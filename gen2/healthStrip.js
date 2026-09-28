// healthStrip.js - live provider status in the header. Polls /api/health (server-side state only,
// it never triggers a data fetch itself). If the backend is unreachable the app is running on the
// browser fallback engine, and the strip says so instead of pretending everything is fine.
(() => {
  const root = document.getElementById("healthStrip");
  if (!root) return;
  const NAMES = { usgs: "USGS quakes", "open-meteo": "Open-Meteo weather" };
  const SHORT = { usgs: "USGS", "open-meteo": "Weather" };
  const OVERALL = { nominal: ["up", "NOMINAL"], degraded: ["degraded", "DEGRADED"], offline: ["down", "FEEDS DOWN"], unknown: ["unknown", "STARTING"], local: ["degraded", "LOCAL ENGINE"] };
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  let snap = null, open = false;

  const ago = iso => {
    if (!iso) return "never";
    const s = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 1000));
    return s < 90 ? `${s}s ago` : `${Math.round(s / 60)}m ago`;
  };

  function render() {
    const [tone, label] = OVERALL[snap.overall] || OVERALL.unknown;
    const segs = snap.providers.map(p => `<span class="hs-seg" data-s="${p.status}">${esc(SHORT[p.id] || p.id)}${p.avgLatencyMs != null ? `<i>${p.avgLatencyMs}ms</i>` : ""}</span>`).join("");
    const rows = snap.providers.map(p => `<tr data-s="${p.status}"><td>${esc(NAMES[p.id] || p.id)}</td><td class="st">${p.status.toUpperCase()}${p.retryInSec ? `<span class="err">retry in ${p.retryInSec}s</span>` : ""}</td><td>${p.avgLatencyMs != null ? p.avgLatencyMs + " ms" : "-"}</td><td>${p.successRate != null ? p.successRate + "%" : "-"}</td><td>${ago(p.lastOkAt)}${p.lastError ? `<span class="err">${esc(p.lastError)}</span>` : ""}</td></tr>`).join("");
    const foot = snap.overall === "local"
      ? "Backend not reachable. Routing runs on the in-browser engine with modeled data."
      : "When a feed is down the optimizer keeps running on deterministic fallback data and labels it in the run notes.";
    root.innerHTML = `<button type="button" class="hs-bar" aria-expanded="${open}" aria-controls="hsPanel"><span class="hs-state" data-s="${tone}"><b>${label}</b></span>${segs}</button>
      <div class="hs-panel" id="hsPanel" role="region" aria-label="Data provider health" ${open ? "" : "hidden"}>
        <table><thead><tr><th>Provider</th><th>State</th><th>Latency</th><th>OK</th><th>Last success</th></tr></thead><tbody>${rows || `<tr><td colspan="5">No provider calls yet.</td></tr>`}</tbody></table>
        <p class="foot">${foot}</p></div>`;
  }

  async function poll() {
    try {
      const r = await fetch("/api/health", { cache: "no-store" });
      if (!r.ok) throw new Error(r.status);
      snap = await r.json();
    } catch {
      snap = { overall: "local", providers: [] };
    }
    render();
  }

  root.addEventListener("click", e => { if (e.target.closest(".hs-bar")) { open = !open; render(); } });
  document.addEventListener("click", e => { if (open && !root.contains(e.target)) { open = false; render(); } });
  document.addEventListener("keydown", e => { if (open && e.key === "Escape") { open = false; render(); root.querySelector(".hs-bar")?.focus(); } });
  document.addEventListener("visibilitychange", () => { if (!document.hidden) poll(); });
  setInterval(() => { if (!document.hidden) poll(); }, 20000);
  snap = { overall: "unknown", providers: [] };
  render();
  poll();
})();
