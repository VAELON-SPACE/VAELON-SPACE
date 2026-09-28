// providerHealth.js - per-provider health + a small circuit breaker for the live data feeds.
// Gen 1 only reported feed problems as a joined text note. Gen 2 tracks each provider (USGS,
// Open-Meteo) separately: rolling success rate, average latency, consecutive failures. After
// TRIP_AFTER failures in a row the provider is skipped for COOL_MS so a dead feed can't stall
// every request; the first call after the cool-down is the trial that closes or re-opens it.
const WINDOW = 10, TRIP_AFTER = 3, COOL_MS = 60000;
const providers = new Map();

function rec(id) {
  if (!providers.has(id)) providers.set(id, { id, samples: [], consecutiveFailures: 0, openUntil: 0, lastOkAt: null, lastError: null });
  return providers.get(id);
}

function push(p, ok, ms, err) {
  p.samples.push({ ok, ms });
  if (p.samples.length > WINDOW) p.samples.shift();
  if (ok) { p.consecutiveFailures = 0; p.lastOkAt = new Date().toISOString(); p.lastError = null; return; }
  p.consecutiveFailures += 1;
  p.lastError = String(err).slice(0, 140);
  if (p.consecutiveFailures >= TRIP_AFTER) p.openUntil = Date.now() + COOL_MS;
}

async function guarded(id, fn) {
  const p = rec(id);
  if (Date.now() < p.openUntil) throw new Error(`${id} circuit open, retrying in ${Math.ceil((p.openUntil - Date.now()) / 1000)}s`);
  const t = Date.now();
  try { const value = await fn(); push(p, true, Date.now() - t); return value; }
  catch (e) { push(p, false, Date.now() - t, e.message); throw e; }
}

function statusOf(p) {
  if (Date.now() < p.openUntil) return "down";
  if (!p.samples.length) return "unknown";
  const failRate = p.samples.filter(s => !s.ok).length / p.samples.length;
  return p.consecutiveFailures > 0 || failRate >= 0.3 ? "degraded" : "up";
}

function snapshot() {
  const list = [...providers.values()].map(p => {
    const okMs = p.samples.filter(s => s.ok).map(s => s.ms);
    return {
      id: p.id,
      status: statusOf(p),
      avgLatencyMs: okMs.length ? Math.round(okMs.reduce((a, b) => a + b, 0) / okMs.length) : null,
      successRate: p.samples.length ? Math.round(100 * p.samples.filter(s => s.ok).length / p.samples.length) : null,
      consecutiveFailures: p.consecutiveFailures,
      lastOkAt: p.lastOkAt,
      lastError: p.lastError,
      retryInSec: Date.now() < p.openUntil ? Math.ceil((p.openUntil - Date.now()) / 1000) : 0
    };
  });
  const seen = list.filter(p => p.status !== "unknown");
  const overall = !seen.length ? "unknown" : seen.every(p => p.status === "down") ? "offline" : seen.every(p => p.status === "up") ? "nominal" : "degraded";
  return { generatedAt: new Date().toISOString(), overall, providers: list };
}

module.exports = { guarded, snapshot };
