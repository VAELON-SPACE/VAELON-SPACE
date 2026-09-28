const { haversineKm } = require("./geo");
const health = require("./providerHealth");

const USGS_URL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson";
const OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast";

async function fetchJson(url, timeoutMs = 6500) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function loadLiveSignals(cities) {
  const startedAt = Date.now();
  const notes = [];
  let earthquakes = [];
  let weather = [];

  try {
    const usgs = await health.guarded("usgs", () => fetchJson(USGS_URL));
    earthquakes = parseUsgs(usgs, cities);
    notes.push(`USGS loaded ${usgs.features.length} M4.5+ earthquakes from the past day`);
  } catch (error) {
    earthquakes = fallbackEarthquakes(cities);
    notes.push(`USGS unavailable, using deterministic earthquake fallback: ${error.message}`);
  }

  // One failed city no longer discards weather for every other city: keep what loaded, fall back per city.
  const settled = await Promise.allSettled(cities.map(loadWeatherForCity));
  const loaded = settled.filter(r => r.status === "fulfilled").map(r => r.value);
  const failedCities = cities.filter((_, i) => settled[i].status === "rejected");
  weather = [...loaded, ...fallbackWeather(failedCities)];
  notes.push(failedCities.length
    ? `Open-Meteo loaded for ${loaded.length} of ${cities.length} cities; ${failedCities.length} using deterministic fallback`
    : `Open-Meteo weather loaded for ${loaded.length} cities`);

  const incidents = mergeSignals(cities, earthquakes, weather);

  return {
    generatedAt: new Date().toISOString(),
    latencyMs: Date.now() - startedAt,
    notes,
    sources: [
      { name: "USGS Earthquake GeoJSON", url: USGS_URL },
      { name: "Open-Meteo Forecast API", url: "https://open-meteo.com/en/docs" }
    ],
    weather,
    incidents
  };
}

function parseUsgs(feed, cities) {
  return (feed.features || []).map((feature, index) => {
    const coords = feature.geometry && feature.geometry.coordinates;
    if (!Array.isArray(coords) || !Number.isFinite(coords[0]) || !Number.isFinite(coords[1])) return null; // unlocated event: skip it, not the whole feed
    const [lon, lat] = coords;
    const nearest = nearestCity({ lat, lon }, cities);
    if (nearest.distanceKm > 900) return null;

    const mag = Number(feature.properties.mag || 4.5);
    return {
      id: feature.id || `usgs-${index}`,
      name: feature.properties.place || "USGS earthquake",
      kind: "earthquake",
      source: "USGS",
      cityId: nearest.city.id,
      cityName: nearest.city.name,
      lat,
      lon,
      magnitude: mag,
      severity: Math.min(99, Math.round(44 + mag * 8 + Math.max(0, 380 - nearest.distanceKm) / 12)),
      people: Math.round(220 + mag ** 2.35 * 42 + nearest.city.population * nearest.city.risk.earthquake * 0.00022),
      ageMinutes: Math.round((Date.now() - feature.properties.time) / 60000),
      url: feature.properties.url
    };
  }).filter(Boolean);
}

async function loadWeatherForCity(city) {
  const url = new URL(OPEN_METEO_URL);
  url.searchParams.set("latitude", city.lat);
  url.searchParams.set("longitude", city.lon);
  url.searchParams.set("current", "temperature_2m,precipitation,wind_speed_10m,weather_code");
  url.searchParams.set("hourly", "precipitation_probability,precipitation,wind_speed_10m");
  url.searchParams.set("forecast_days", "1");
  url.searchParams.set("timezone", "auto");

  const payload = await health.guarded("open-meteo", () => fetchJson(url.toString()));
  const current = payload.current || {};
  const hourly = payload.hourly || {};
  const maxPrecipProb = Math.max(0, ...(hourly.precipitation_probability || []).filter(Number.isFinite));
  const maxWind = Math.max(Number(current.wind_speed_10m) || 0, ...(hourly.wind_speed_10m || []).filter(Number.isFinite));

  return {
    cityId: city.id,
    cityName: city.name,
    source: "Open-Meteo",
    temperatureC: Number(current.temperature_2m || 0),
    precipitationMm: Number(current.precipitation || 0),
    precipitationProbability: maxPrecipProb,
    windKmh: Number(current.wind_speed_10m || maxWind || 0),
    maxWindKmh: maxWind,
    weatherCode: current.weather_code
  };
}

function mergeSignals(cities, earthquakes, weather) {
  const incidents = [...earthquakes];

  for (const report of weather) {
    const city = cities.find(item => item.id === report.cityId);
    if (!city) continue;

    const stormPressure = Math.min(99, Math.round(report.precipitationProbability * 0.42 + report.maxWindKmh * 0.95 + city.risk.storm * 25));
    const floodPressure = Math.min(99, Math.round(report.precipitationProbability * 0.55 + report.precipitationMm * 9 + city.risk.flood * 28));

    if (stormPressure >= 44) {
      incidents.push({
        id: `weather-storm-${city.id}`,
        name: `${city.name} severe weather response`,
        kind: "storm",
        source: "Open-Meteo",
        cityId: city.id,
        cityName: city.name,
        lat: city.lat + 0.08,
        lon: city.lon - 0.08,
        magnitude: report.maxWindKmh,
        severity: stormPressure,
        people: Math.round(320 + city.population * city.risk.storm * stormPressure / 65000),
        ageMinutes: 0,
        url: "https://open-meteo.com/en/docs"
      });
    }

    if (floodPressure >= 38) {
      incidents.push({
        id: `weather-flood-${city.id}`,
        name: `${city.name} flood risk corridor`,
        kind: "flood",
        source: "Open-Meteo",
        cityId: city.id,
        cityName: city.name,
        lat: city.lat - 0.1,
        lon: city.lon + 0.1,
        magnitude: report.precipitationProbability,
        severity: floodPressure,
        people: Math.round(260 + city.population * city.risk.flood * floodPressure / 72000),
        ageMinutes: 0,
        url: "https://open-meteo.com/en/docs"
      });
    }
  }

  return incidents
    .filter(incident => incident.people > 0)
    .sort((a, b) => b.severity * b.people - a.severity * a.people)
    .slice(0, 18);
}

function nearestCity(point, cities) {
  let best = { city: cities[0], distanceKm: Infinity };
  for (const city of cities) {
    const distanceKm = haversineKm(point, city);
    if (distanceKm < best.distanceKm) best = { city, distanceKm };
  }
  return best;
}

function fallbackEarthquakes(cities) {
  return cities
    .filter(city => city.risk.earthquake > 0.45)
    .slice(0, 4)
    .map((city, index) => ({
      id: `fallback-quake-${city.id}`,
      name: `${city.name} earthquake stress fixture`,
      kind: "earthquake",
      source: "Deterministic fallback",
      cityId: city.id,
      cityName: city.name,
      lat: city.lat + 0.18,
      lon: city.lon - 0.16,
      magnitude: 5.8 + index * 0.3,
      severity: Math.round(66 + city.risk.earthquake * 25),
      people: Math.round(600 + city.population * city.risk.earthquake / 9000),
      ageMinutes: 30 + index * 22,
      url: "https://earthquake.usgs.gov/"
    }));
}

function fallbackWeather(cities) {
  return cities.map((city, index) => ({
    cityId: city.id,
    cityName: city.name,
    source: "Deterministic fallback",
    temperatureC: 24 + index,
    precipitationMm: Math.round(city.risk.flood * 10),
    precipitationProbability: Math.round(45 + city.risk.flood * 38),
    windKmh: Math.round(18 + city.risk.storm * 42),
    maxWindKmh: Math.round(26 + city.risk.storm * 52),
    weatherCode: 61
  }));
}

// Synthetic, clearly labeled incidents for demos and calm days (live feeds can legitimately show no
// active hazards). Never mixed into live results unless the caller asks for scenario=demo.
function demoIncidents(cities) {
  return [...cities].sort((a, b) => b.risk.earthquake - a.risk.earthquake).slice(0, 4).map((city, i) => ({
    id: `demo-quake-${city.id}`,
    name: `${city.name} demo earthquake scenario`,
    kind: "earthquake",
    source: "Demo scenario",
    cityId: city.id,
    cityName: city.name,
    lat: city.lat + 0.18,
    lon: city.lon - 0.16,
    magnitude: 5.8 + i * 0.3,
    severity: Math.round(66 + city.risk.earthquake * 25),
    people: Math.round(600 + city.population * city.risk.earthquake / 9000),
    ageMinutes: 30 + i * 22,
    url: "https://earthquake.usgs.gov/"
  }));
}

module.exports = { loadLiveSignals, demoIncidents };
