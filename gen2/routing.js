const { haversineKm, arcPoints, bendSeed } = require("./geo");

// Public OSRM demo server. Free, no key required, but rate-limited and not an SLA-backed
// service - fine for a demo/pitch, not for production. Swap OSRM_BASE_URL to a self-hosted
// OSRM instance or a commercial provider (Mapbox Directions, Google Routes) before relying
// on this for anything real. See README "Routing" section.
const OSRM_BASE_URL = process.env.OSRM_BASE_URL || "https://router.project-osrm.org";
const ROUTE_TIMEOUT_MS = 5000;
const MAX_CONCURRENT_REQUESTS = 6;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 min - hub/incident coordinates repeat across requests

const routeCache = new Map();

function roundCoord(value) {
  return Math.round(value * 2000) / 2000; // ~50m precision, plenty for cache reuse
}

function cacheKey(a, b) {
  return `${roundCoord(a.lat)},${roundCoord(a.lon)}|${roundCoord(b.lat)},${roundCoord(b.lon)}`;
}

async function fetchOsrmRoute(a, b) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ROUTE_TIMEOUT_MS);
  try {
    // overview=full + geometries=geojson gets us the actual road-following polyline,
    // not just a distance/time number - without this the map has no choice but to draw
    // a straight line between hub and incident even when OSRM did return a real route.
    const url = `${OSRM_BASE_URL}/route/v1/driving/${a.lon},${a.lat};${b.lon},${b.lat}` +
      `?overview=full&geometries=geojson&alternatives=false&steps=false`;
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`OSRM HTTP ${response.status}`);
    const payload = await response.json();
    if (payload.code !== "Ok" || !payload.routes || !payload.routes.length) {
      throw new Error(`OSRM code ${payload.code || "unknown"}`);
    }
    const route = payload.routes[0];
    const path = (route.geometry && route.geometry.coordinates || [])
      .map(([lon, lat]) => ({ lat, lon }));
    return {
      distanceKm: route.distance / 1000,
      durationMin: route.duration / 60,
      routingSource: "osrm-road-network",
      path: path.length ? path : [a, b]
    };
  } finally {
    clearTimeout(timeout);
  }
}

function fallbackRoute(a, b, reason) {
  // No real road geometry available - draw a gentle, deterministic arc instead of a
  // straight ruler line so an estimated route still looks intentional on the map, and
  // is visually distinguishable (see app.js updateMap: dashed styling) from a real
  // OSRM road route.
  const seed = bendSeed(a, b);
  const strength = 0.1 + (Math.abs(seed) % 12) / 100; // 0.10 - 0.21
  const bend = seed % 2 === 0 ? strength : -strength;
  return {
    distanceKm: haversineKm(a, b),
    durationMin: null,
    routingSource: "great-circle-estimate",
    fallbackReason: reason,
    path: arcPoints(a, b, { bend })
  };
}

async function getRoute(a, b) {
  const key = cacheKey(a, b);
  const cached = routeCache.get(key);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return cached.route;
  }

  let route;
  try {
    route = await fetchOsrmRoute(a, b);
  } catch (error) {
    route = fallbackRoute(a, b, error.message);
  }

  routeCache.set(key, { route, cachedAt: Date.now() });
  return route;
}

// Resolves many hub-to-incident pairs with bounded concurrency so a graph with dozens
// of edges doesn't fire dozens of simultaneous requests at the OSRM demo server.
async function getRoutesBatch(pairs) {
  const results = new Array(pairs.length);
  let cursor = 0;

  async function worker() {
    while (cursor < pairs.length) {
      const index = cursor;
      cursor += 1;
      const [a, b] = pairs[index];
      results[index] = await getRoute(a, b);
    }
  }

  const workerCount = Math.min(MAX_CONCURRENT_REQUESTS, pairs.length) || 1;
  await Promise.all(Array.from({ length: workerCount }, worker));
  return results;
}

module.exports = { getRoute, getRoutesBatch, OSRM_BASE_URL };
