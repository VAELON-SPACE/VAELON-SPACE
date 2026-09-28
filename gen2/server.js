const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const { cities } = require("./cities");
const { loadLiveSignals, demoIncidents } = require("./dataSources");
const { optimizeCrisisPlan } = require("./optimizer");
const { evaluatePlan } = require("./evaluation");
const { runStressTest } = require("./stressTest");
const health = require("./providerHealth");

const PORT = Number(process.env.PORT || 3000);
// Static frontend files (index.html, app.js, styles.css) live at the repo root, not in a
// separate public/ folder - this also has to be the same layout GitHub Pages serves.
const publicDir = __dirname;

// Same-origin by default. Only set RESQNET_CORS_ORIGIN if the frontend is served from another origin.
const CORS_ORIGIN = process.env.RESQNET_CORS_ORIGIN || "";
const corsHeaders = () => (CORS_ORIGIN ? { "Access-Control-Allow-Origin": CORS_ORIGIN, Vary: "Origin" } : {});

// Only the browser files are public. Gen 1 served every .js in the folder, including the
// optimizer and data modules; a hosted demo must not hand those out.
const PUBLIC_FILES = new Set(["/index.html", "/app.js", "/healthStrip.js", "/siteConfig.js", "/legal.js", "/tools.js", "/styles.css"]);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png"
};

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...corsHeaders()
  });
  res.end(body);
}

function sendStatic(req, res) {
  const requestPath = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
  const safePath = requestPath === "/" ? "/index.html" : requestPath;
  const filePath = path.normalize(path.join(publicDir, safePath));

  const ext = path.extname(filePath);
  const isKnownAsset = Object.prototype.hasOwnProperty.call(mimeTypes, ext);
  const touchesHiddenOrServerFile = !PUBLIC_FILES.has(safePath);

  if (!filePath.startsWith(publicDir) || !isKnownAsset || touchesHiddenOrServerFile) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
    res.end(content);
  });
}

function routingNote(routingStats) {
  if (!routingStats || !routingStats.total) return "No hub-to-incident routes were in range for this selection";
  const { realRoutedCount, fallbackCount, total } = routingStats;
  if (fallbackCount === 0) return `Routing: all ${total} routes used real OSRM road-network distance/time`;
  if (realRoutedCount === 0) return `Routing: OSRM was unreachable, all ${total} routes fell back to straight-line distance estimates`;
  return `Routing: ${realRoutedCount} of ${total} routes used real OSRM road-network distance/time, ${fallbackCount} fell back to straight-line estimates`;
}

// scenario=demo swaps live incidents for synthetic ones and says so in the run notes.
async function signalsFor(selectedCities, url) {
  const signals = await loadLiveSignals(selectedCities);
  if (url.searchParams.get("scenario") !== "demo") return signals;
  return { ...signals, incidents: demoIncidents(selectedCities), notes: [...signals.notes, "Demo scenario: incidents are synthetic, not live hazards"] };
}

async function handleApi(req, res, url) {
  const cityId = url.searchParams.get("city") || "all";
  if (url.pathname === "/api/health") { sendJson(res, 200, health.snapshot()); return; }
  const people = Math.min(1000000, Math.max(100, Math.round(Number(url.searchParams.get("people"))) || 1000));
  const pick = (name, allowed, fallback) => (allowed.includes(url.searchParams.get(name)) ? url.searchParams.get(name) : fallback);
  const objective = pick("objective", ["balanced", "fastest", "coverage"], "balanced");
  const stress = pick("stress", ["normal", "congested", "blocked"], "normal");
  const selectedCities = cityId === "all" ? cities : cities.filter(city => city.id === cityId);

  if (!selectedCities.length) {
    sendJson(res, 404, { error: `Unknown city "${cityId}"` });
    return;
  }

  if (url.pathname === "/api/cities") {
    sendJson(res, 200, { cities });
    return;
  }

  if (url.pathname === "/api/live") {
    const signals = await signalsFor(selectedCities, url);
    sendJson(res, 200, signals);
    return;
  }

  if (url.pathname === "/api/optimize") {
    const signals = await signalsFor(selectedCities, url);
    const plan = await optimizeCrisisPlan({
      cities: selectedCities,
      incidents: signals.incidents,
      people,
      objective,
      stress
    });
    const notes = [...signals.notes, routingNote(plan.routingStats)];
    sendJson(res, 200, { ...signals, notes, plan, evaluation: evaluatePlan(plan) });
    return;
  }

  if (url.pathname === "/api/evaluate") {
    const signals = await signalsFor(selectedCities, url);
    const plan = await optimizeCrisisPlan({
      cities: selectedCities,
      incidents: signals.incidents,
      people,
      objective,
      stress
    });
    sendJson(res, 200, evaluatePlan(plan));
    return;
  }

  if (url.pathname === "/api/stress") {
    const cityCount = Math.min(40, Math.max(1, Number(url.searchParams.get("cities")) || 25));
    const incidentCount = Math.min(220, Math.max(1, Number(url.searchParams.get("incidents")) || 120));
    sendJson(res, 200, await runStressTest({ cityCount, incidentCount }));
    return;
  }

  sendJson(res, 404, { error: "Unknown API route" });
}

// 120 API requests/minute per client; enough for the UI, stops a script from hammering the live feeds.
const hits = new Map();
setInterval(() => hits.clear(), 60000).unref();

const server = http.createServer(async (req, res) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  // Allow the Vaelon Space site to embed the console in an iframe (Gen 1 used X-Frame-Options: DENY).
  // Override with RESQNET_FRAME_ANCESTORS="'self' https://your-site.com" if the site lives elsewhere.
  res.setHeader("Content-Security-Policy", `frame-ancestors ${process.env.RESQNET_FRAME_ANCESTORS || "'self' https://vaelon.space https://www.vaelon.space"}`);
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin"); // OSM tile servers reject requests with no Referer
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)");
  try {
    if (req.url.startsWith("/api/")) {
      const ip = req.socket.remoteAddress || "?";
      hits.set(ip, (hits.get(ip) || 0) + 1);
      if (hits.get(ip) > 120) { res.setHeader("Retry-After", "30"); sendJson(res, 429, { error: "Too many requests" }); return; }
    }
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        ...corsHeaders(),
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      });
      res.end();
      return;
    }

    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url);
      return;
    }

    sendStatic(req, res);
  } catch (error) {
    sendJson(res, 500, {
      error: "Server error",
      message: error.message
    });
  }
});

server.listen(PORT, () => {
  console.log(`ResQNet Gen 2 running at http://localhost:${PORT}`);
  // Warm the provider health so the status strip is meaningful before anyone clicks Run.
  const warm = () => loadLiveSignals(cities).catch(() => {});
  warm();
  setInterval(warm, 5 * 60000).unref();
});
