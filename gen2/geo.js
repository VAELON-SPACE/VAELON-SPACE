function toRad(degrees) {
  return degrees * Math.PI / 180;
}

function haversineKm(a, b) {
  const radius = 6371;
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const x = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * radius * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

// Deterministic small integer derived from two coordinates. Used to give each
// hub-to-incident pair a stable (not random-per-render) curve direction/strength
// so the map doesn't redraw with a different bow every refresh.
function bendSeed(a, b) {
  const str = `${a.lat.toFixed(3)},${a.lon.toFixed(3)}|${b.lat.toFixed(3)},${b.lon.toFixed(3)}`;
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return hash;
}

// Builds a gentle quadratic-bezier arc between two points instead of a ruler-straight
// line. Used only as a *visual* fallback when we don't have real road geometry (no OSRM
// route) so an estimated route still reads as "estimated" on the map rather than looking
// identical to a real, road-following route.
function arcPoints(a, b, options = {}) {
  const segments = options.segments || 24;
  const bend = options.bend ?? 0.14;
  const dLat = b.lat - a.lat;
  const dLon = b.lon - a.lon;
  const dist = Math.sqrt(dLat * dLat + dLon * dLon) || 0.0001;
  const midLat = (a.lat + b.lat) / 2;
  const midLon = (a.lon + b.lon) / 2;
  const perpLat = -dLon / dist;
  const perpLon = dLat / dist;
  const controlLat = midLat + perpLat * bend * dist;
  const controlLon = midLon + perpLon * bend * dist;

  const points = [];
  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const inv = 1 - t;
    const lat = inv * inv * a.lat + 2 * inv * t * controlLat + t * t * b.lat;
    const lon = inv * inv * a.lon + 2 * inv * t * controlLon + t * t * b.lon;
    points.push({ lat, lon });
  }
  return points;
}

module.exports = { haversineKm, toRad, bendSeed, arcPoints };
