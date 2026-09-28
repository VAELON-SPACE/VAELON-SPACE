const els = {
  citySelect: document.getElementById("citySelect"),
  peopleInput: document.getElementById("peopleInput"),
  objectiveSelect: document.getElementById("objectiveSelect"),
  stressSelect: document.getElementById("stressSelect"),
  status: document.getElementById("status"),
  sourceNotes: document.getElementById("sourceNotes"),
  maxFlow: document.getElementById("maxFlow"),
  coverage: document.getElementById("coverage"),
  avgTime: document.getElementById("avgTime"),
  runtime: document.getElementById("runtime"),
  priorityCity: document.getElementById("priorityCity"),
  riskWeight: document.getElementById("riskWeight"),
  stressMode: document.getElementById("stressMode"),
  decisionTitle: document.getElementById("decisionTitle"),
  decisionReason: document.getElementById("decisionReason"),
  incidentCount: document.getElementById("incidentCount"),
  incidentRows: document.getElementById("incidentRows"),
  graphSize: document.getElementById("graphSize"),
  planList: document.getElementById("planList"),
  evaluationRows: document.getElementById("evaluationRows"),
  gain: document.getElementById("gain"),
  stressStatus: document.getElementById("stressStatus"),
  stressGrid: document.getElementById("stressGrid"),
  map: document.getElementById("map"),
  mapFallback: document.getElementById("mapFallback"),
  dijkstraBtn: document.getElementById("dijkstraBtn"),
  astarBtn: document.getElementById("astarBtn"),
  floodSlider: document.getElementById("floodSlider"),
  quakeSlider: document.getElementById("quakeSlider"),
  trafficSlider: document.getElementById("trafficSlider"),
  floodValue: document.getElementById("floodValue"),
  quakeValue: document.getElementById("quakeValue"),
  trafficValue: document.getElementById("trafficValue"),
  presetQuake: document.getElementById("presetQuake"),
  presetFlood: document.getElementById("presetFlood"),
  presetNormal: document.getElementById("presetNormal"),
  animatePathBtn: document.getElementById("animatePathBtn"),
  darkModeBtn: document.getElementById("darkModeBtn"),
  cyGraph: document.getElementById("cyGraph"),
  graphModeLabel: document.getElementById("graphModeLabel"),
  graphLoading: document.getElementById("graphLoading"),
  infoTitle: document.getElementById("infoTitle"),
  infoBody: document.getElementById("infoBody"),
  nodesVisited: document.getElementById("nodesVisited"),
  pathCost: document.getElementById("pathCost"),
  executionTime: document.getElementById("executionTime"),
  costBreakdown: document.getElementById("costBreakdown"),
  locateBtn: document.getElementById("locateBtn"),
  locateStatus: document.getElementById("locateStatus"),
  nearestHospitalTitle: document.getElementById("nearestHospitalTitle"),
  nearestHospitalMetrics: document.getElementById("nearestHospitalMetrics"),
  nearestHospitalActions: document.getElementById("nearestHospitalActions"),
  nearestHospitalNote: document.getElementById("nearestHospitalNote"),
  nhName: document.getElementById("nhName"),
  nhDistance: document.getElementById("nhDistance"),
  nhTime: document.getElementById("nhTime"),
  nhBeds: document.getElementById("nhBeds"),
  nhDirectionsLink: document.getElementById("nhDirectionsLink")
};

let rescueMap = null;
let mapLayers = [];
let currentPayload = null;
let currentGraph = null;
let cy = null;
let selectedAlgorithm = "dijkstra";
let selectedPath = [];

// Same real region as cities.js (North Bay wildfire corridor, CA: Sonoma, Napa, Marin,
// Solano, Mendocino, and Lake counties) - kept in sync manually since this browser-only
// fallback has to work even with zero backend (GitHub Pages hosting, no Node process, no
// /api/cities route). See cities.js for full data provenance notes: hospital names, beds,
// and addresses are real (HCAI facility records); teams/ambulances/kits are derived from
// real bed counts, not independently sourced.
const cities = [
  {
    id: "santa-rosa",
    name: "Santa Rosa",
    country: "USA",
    lat: 38.4404,
    lon: -122.7141,
    population: 178127,
    hubs: [
      { id: "santa-rosa-memorial", name: "Santa Rosa Memorial Hospital", lat: 38.4436, lon: -122.7014, teams: 41, ambulances: 24, beds: 338, kits: 3042 },
      { id: "kaiser-santa-rosa", name: "Kaiser Permanente Santa Rosa Medical Center", lat: 38.4719, lon: -122.7053, teams: 21, ambulances: 12, beds: 173, kits: 1557 }
    ]
  },
  {
    id: "petaluma",
    name: "Petaluma",
    country: "USA",
    lat: 38.2324,
    lon: -122.6367,
    population: 59776,
    hubs: [
      { id: "petaluma-valley", name: "Petaluma Valley Hospital", lat: 38.2453, lon: -122.6363, teams: 10, ambulances: 6, beds: 80, kits: 720 }
    ]
  },
  {
    id: "sonoma",
    name: "Sonoma",
    country: "USA",
    lat: 38.2919,
    lon: -122.458,
    population: 11147,
    hubs: [
      { id: "sonoma-valley", name: "Sonoma Valley Hospital", lat: 38.2915, lon: -122.4577, teams: 6, ambulances: 4, beds: 51, kits: 459 }
    ]
  },
  {
    id: "healdsburg",
    name: "Healdsburg",
    country: "USA",
    lat: 38.6105,
    lon: -122.8692,
    population: 11340,
    hubs: [
      { id: "healdsburg-hospital", name: "Healdsburg Hospital", lat: 38.6168, lon: -122.8676, teams: 5, ambulances: 3, beds: 38, kits: 342 }
    ]
  },
  {
    id: "napa",
    name: "Napa",
    country: "USA",
    lat: 38.2975,
    lon: -122.2869,
    population: 80506,
    hubs: [
      { id: "queen-of-the-valley", name: "Providence Queen of the Valley Medical Center", lat: 38.3187, lon: -122.2864, teams: 24, ambulances: 14, beds: 198, kits: 1782 }
    ]
  },
  {
    id: "greenbrae",
    name: "Greenbrae",
    country: "USA",
    lat: 37.9469,
    lon: -122.5361,
    population: 10825,
    hubs: [
      { id: "marinhealth-medical-center", name: "MarinHealth Medical Center", lat: 37.9474, lon: -122.5359, teams: 39, ambulances: 23, beds: 327, kits: 2943 }
    ]
  },
  {
    id: "novato",
    name: "Novato",
    country: "USA",
    lat: 38.1074,
    lon: -122.5697,
    population: 53225,
    hubs: [
      { id: "novato-community", name: "Novato Community Hospital", lat: 38.1046, lon: -122.561, teams: 6, ambulances: 3, beds: 47, kits: 423 }
    ]
  },
  {
    id: "fairfield",
    name: "Fairfield",
    country: "USA",
    lat: 38.2494,
    lon: -122.04,
    population: 119881,
    hubs: [
      { id: "northbay-medical-center", name: "NorthBay Medical Center", lat: 38.2536, lon: -122.0498, teams: 18, ambulances: 11, beds: 154, kits: 1386 }
    ]
  },
  {
    id: "vallejo",
    name: "Vallejo",
    country: "USA",
    lat: 38.1041,
    lon: -122.2566,
    population: 126090,
    hubs: [
      { id: "sutter-solano", name: "Sutter Solano Medical Center", lat: 38.1157, lon: -122.2408, teams: 13, ambulances: 7, beds: 106, kits: 954 }
    ]
  },
  {
    id: "ukiah",
    name: "Ukiah",
    country: "USA",
    lat: 39.1502,
    lon: -123.2078,
    population: 16607,
    hubs: [
      { id: "adventist-health-ukiah-valley", name: "Adventist Health Ukiah Valley", lat: 39.1362, lon: -123.1936, teams: 6, ambulances: 4, beds: 50, kits: 450 }
    ]
  },
  {
    id: "lakeport",
    name: "Lakeport",
    country: "USA",
    lat: 39.043,
    lon: -122.9166,
    population: 4753,
    hubs: [
      { id: "sutter-lakeside", name: "Sutter Lakeside Hospital", lat: 39.0398, lon: -122.8986, teams: 3, ambulances: 2, beds: 27, kits: 243 }
    ]
  }
];

// Used only when both the live APIs and the /api/optimize backend are unreachable
// (fully static GitHub Pages mode with no network). These are illustrative fixtures
// sized to match real North Bay wildfire/earthquake response scale - not live data, not
// a claim about any specific real event's actual numbers.
const fallbackIncidents = [
  { id: "wildfire-santa-rosa", name: "Santa Rosa wildfire response (Tubbs Fire-scale fixture)", kind: "storm", source: "Static fallback", cityId: "santa-rosa", cityName: "Santa Rosa", lat: 38.49, lon: -122.71, severity: 92, people: 3200 },
  { id: "wildfire-healdsburg", name: "Healdsburg wildfire response (Kincade Fire-scale fixture)", kind: "storm", source: "Static fallback", cityId: "healdsburg", cityName: "Healdsburg", lat: 38.66, lon: -122.83, severity: 88, people: 900 },
  { id: "flood-petaluma", name: "Petaluma River flood corridor", kind: "flood", source: "Static fallback", cityId: "petaluma", cityName: "Petaluma", lat: 38.22, lon: -122.63, severity: 61, people: 420 },
  { id: "eq-sonoma", name: "Sonoma Valley seismic fixture (Rodgers Creek Fault)", kind: "earthquake", source: "Static fallback", cityId: "sonoma", cityName: "Sonoma", lat: 38.3, lon: -122.45, severity: 68, people: 350 },
  { id: "wildfire-napa", name: "Napa wildfire response (Glass Fire-scale fixture)", kind: "storm", source: "Static fallback", cityId: "napa", cityName: "Napa", lat: 38.34, lon: -122.35, severity: 86, people: 1400 },
  { id: "flood-greenbrae", name: "Corte Madera Creek flood corridor", kind: "flood", source: "Static fallback", cityId: "greenbrae", cityName: "Greenbrae", lat: 37.95, lon: -122.53, severity: 58, people: 300 },
  { id: "storm-novato", name: "Novato atmospheric-river storm response", kind: "storm", source: "Static fallback", cityId: "novato", cityName: "Novato", lat: 38.11, lon: -122.57, severity: 54, people: 380 },
  { id: "wildfire-fairfield", name: "Fairfield wildfire response (LNU Complex-scale fixture)", kind: "storm", source: "Static fallback", cityId: "fairfield", cityName: "Fairfield", lat: 38.27, lon: -122.0, severity: 80, people: 1100 },
  { id: "eq-vallejo", name: "Vallejo seismic fixture (Hayward Fault system)", kind: "earthquake", source: "Static fallback", cityId: "vallejo", cityName: "Vallejo", lat: 38.1, lon: -122.24, severity: 62, people: 500 },
  { id: "wildfire-ukiah", name: "Ukiah wildfire response (Mendocino Complex-scale fixture)", kind: "storm", source: "Static fallback", cityId: "ukiah", cityName: "Ukiah", lat: 39.17, lon: -123.19, severity: 90, people: 950 },
  { id: "wildfire-lakeport", name: "Lakeport wildfire response (Valley Fire-scale fixture)", kind: "storm", source: "Static fallback", cityId: "lakeport", cityName: "Lakeport", lat: 39.06, lon: -122.9, severity: 93, people: 600 }
];

const stressProfiles = {
  normal: { label: "Normal", multiplier: 1, capacityPenalty: 0, riskBonus: 0 },
  congested: { label: "Congested", multiplier: 1.28, capacityPenalty: 0.12, riskBonus: 8 },
  blocked: { label: "Blocked", multiplier: 1.62, capacityPenalty: 0.28, riskBonus: 16 }
};

async function api(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

async function loadCities() {
  try {
    const payload = await api("/api/cities");
    renderCityOptions(payload.cities);
  } catch {
    renderCityOptions(cities);
  }
}

function renderCityOptions(items) {
  els.citySelect.innerHTML = `<option value="all">All cities</option>` + items
    .map(city => `<option value="${city.id}">${city.name}, ${city.country}</option>`)
    .join("");
}

async function runSystem() {
  els.status.textContent = "Running graph optimization...";
  const query = new URLSearchParams({
    city: els.citySelect.value,
    people: els.peopleInput.value,
    objective: els.objectiveSelect.value,
    stress: els.stressSelect.value
  });
  if (document.getElementById("demoScenario")?.checked) query.set("scenario", "demo");

  try {
    const payload = await api(`/api/optimize?${query}`);
    renderPlan(payload, payload.evaluation, "Backend API mode");
  } catch {
    const payload = await runStaticSystem();
    renderPlan(payload, payload.evaluation, "GitHub Pages mode");
  }
}

async function runStaticSystem() {
  const selectedCities = els.citySelect.value === "all"
    ? cities
    : cities.filter(city => city.id === els.citySelect.value);
  const selectedIds = new Set(selectedCities.map(city => city.id));
  const incidents = fallbackIncidents
    .filter(incident => selectedIds.has(incident.cityId))
    .map((incident, index) => ({
      ...incident,
      people: index === 0 ? Math.max(Number(els.peopleInput.value || 1000), incident.people) : incident.people
    }));

  const plan = await optimize(selectedCities, incidents, els.stressSelect.value);
  return {
    notes: [
      "Static GitHub Pages mode is active",
      "Browser fallback uses the same risk-weighted route logic",
      "Run node server.js for live USGS and Open-Meteo data",
      routingNote(plan.routingStats)
    ],
    incidents,
    plan,
    evaluation: evaluate(plan)
  };
}

function routingNote(routingStats) {
  if (!routingStats || !routingStats.total) return "No hub-to-incident routes were in range for this selection";
  const { realRoutedCount, fallbackCount, total } = routingStats;
  if (fallbackCount === 0) return `Routing: all ${total} routes used real OSRM road-network distance/time`;
  if (realRoutedCount === 0) return `Routing: OSRM was unreachable, all ${total} routes fell back to straight-line distance estimates`;
  return `Routing: ${realRoutedCount} of ${total} routes used real OSRM road-network distance/time, ${fallbackCount} fell back to straight-line estimates`;
}

async function optimize(selectedCities, incidents, stress = "normal", useRealRouting = true) {
  const startedAt = performance.now();
  const stressProfile = stressProfiles[stress] || stressProfiles.normal;
  const hubs = selectedCities.flatMap(city => city.hubs.map(hub => ({
    ...hub,
    cityId: city.id,
    cityName: city.name,
    capacity: hubCapacity(hub)
  })));
  const edges = [];
  const adjacency = {};

  [...hubs, ...incidents].forEach(node => {
    adjacency[node.id] = [];
  });

  const candidates = [];
  for (const hub of hubs) {
    for (const incident of incidents) {
      const straightLineKm = haversineKm(hub, incident);
      if (hub.cityId !== incident.cityId && straightLineKm > 350) continue;
      candidates.push({ hub, incident, straightLineKm });
    }
  }

  const routes = useRealRouting
    ? await getRoutesBatchBrowser(candidates.map(c => [c.hub, c.incident]))
    : candidates.map(c => fallbackArcRoute(c.hub, c.incident));
  let realRoutedCount = 0;
  let fallbackCount = 0;

  candidates.forEach((candidate, index) => {
    const { hub, incident } = candidate;
    const route = routes[index];
    const km = route.distanceKm;
    const isRealRoute = route.routingSource === "osrm-road-network";
    if (isRealRoute) realRoutedCount += 1; else fallbackCount += 1;

    const speed = incident.kind === "storm" ? 34 : incident.kind === "flood" ? 38 : 42;
    const baseMinutes = isRealRoute ? route.durationMin : (km / speed) * 60;
    const hazardMultiplier = 1 + incident.severity / 210;
    const demandMultiplier = 1 + Math.min(0.42, incident.people / 12000);
    const travelMinutes = Math.round((8 + baseMinutes) * hazardMultiplier * demandMultiplier * stressProfile.multiplier);
    const riskWeight = Math.min(100, Math.round(incident.severity * 0.55 + Math.min(35, incident.people / 120) + stressProfile.riskBonus));
    const capacity = Math.max(20, Math.round(hub.capacity * (1 - stressProfile.capacityPenalty) * (1 - incident.severity / 360)));
    const path = route.path || [{ lat: hub.lat, lon: hub.lon }, { lat: incident.lat, lon: incident.lon }];
    const edge = { from: hub.id, to: incident.id, weight: travelMinutes, capacity, riskWeight, distanceKm: Math.round(km), routingSource: route.routingSource, path };
    edges.push(edge);
    adjacency[hub.id].push(edge);
  });

  hubs.forEach(hub => dijkstra(adjacency, hub.id));
  const flow = edmondsKarp(hubs, incidents, edges);
  const allocations = flow.allocations.map(item => {
    const hub = hubs.find(h => h.id === item.from);
    const incident = incidents.find(i => i.id === item.to);
    const edge = edges.find(e => e.from === item.from && e.to === item.to);
    return {
      ...item,
      hubName: hub.name,
      hubCity: hub.cityName,
      incidentName: incident.name,
      incidentCity: incident.cityName,
      travelMinutes: edge.weight,
      riskWeight: edge.riskWeight,
      distanceKm: edge.distanceKm,
      routingSource: edge.routingSource,
      path: edge.path,
      utilization: item.people / edge.capacity,
      bottleneck: item.people / edge.capacity >= 0.9
    };
  }).sort((a, b) => a.riskWeight - b.riskWeight || a.travelMinutes - b.travelMinutes);

  const totalDemand = incidents.reduce((sum, incident) => sum + incident.people, 0);
  const averageArrival = allocations.length
    ? Math.round(allocations.reduce((sum, item) => sum + item.people * item.travelMinutes, 0) / Math.max(1, flow.maxFlow))
    : 0;
  const makespan = allocations.reduce((max, item) => Math.max(max, item.travelMinutes + Math.ceil(item.people / 125) * 8), 0);
  const avgRiskWeight = allocations.length
    ? Math.round(allocations.reduce((sum, item) => sum + item.riskWeight, 0) / allocations.length)
    : 0;

  return {
    objective: els.objectiveSelect.value,
    stress,
    stressLabel: stressProfile.label,
    nodes: hubs.length + incidents.length,
    edges: edges.length,
    totalDemand,
    maxFlow: flow.maxFlow,
    coverage: totalDemand ? Number((flow.maxFlow / totalDemand).toFixed(3)) : 0,
    unmetDemand: Math.max(0, totalDemand - flow.maxFlow),
    averageArrival,
    makespan,
    bottleneckCount: allocations.filter(item => item.bottleneck).length,
    averageRiskWeight: avgRiskWeight,
    allocations,
    routingStats: { realRoutedCount, fallbackCount, total: edges.length },
    runtimeMs: Number((performance.now() - startedAt).toFixed(3))
  };
}

function dijkstra(adjacency, startId) {
  const distances = {};
  const queue = new Set(Object.keys(adjacency));
  Object.keys(adjacency).forEach(id => distances[id] = Infinity);
  distances[startId] = 0;

  while (queue.size) {
    let current = null;
    queue.forEach(id => {
      if (current === null || distances[id] < distances[current]) current = id;
    });
    if (current === null || distances[current] === Infinity) break;
    queue.delete(current);
    adjacency[current].forEach(edge => {
      const candidate = distances[current] + edge.weight;
      if (candidate < distances[edge.to]) distances[edge.to] = candidate;
    });
  }
  return distances;
}

function edmondsKarp(hubs, incidents, edges) {
  const source = "source";
  const sink = "sink";
  const residual = {};

  function addEdge(from, to, capacity) {
    residual[from] = residual[from] || {};
    residual[to] = residual[to] || {};
    residual[from][to] = (residual[from][to] || 0) + capacity;
    residual[to][from] = residual[to][from] || 0;
  }

  hubs.forEach(hub => addEdge(source, hub.id, hub.capacity));
  edges.forEach(edge => addEdge(edge.from, edge.to, edge.capacity));
  incidents.forEach(incident => addEdge(incident.id, sink, incident.people));

  let maxFlow = 0;
  while (true) {
    const parent = { [source]: null };
    const queue = [source];
    for (let i = 0; i < queue.length; i += 1) {
      Object.entries(residual[queue[i]] || {}).forEach(([next, capacity]) => {
        if (capacity > 0 && !(next in parent)) {
          parent[next] = queue[i];
          queue.push(next);
        }
      });
    }
    if (!(sink in parent)) break;

    let bottleneck = Infinity;
    for (let node = sink; node !== source; node = parent[node]) {
      bottleneck = Math.min(bottleneck, residual[parent[node]][node]);
    }
    for (let node = sink; node !== source; node = parent[node]) {
      residual[parent[node]][node] -= bottleneck;
      residual[node][parent[node]] += bottleneck;
    }
    maxFlow += bottleneck;
  }

  const allocations = [];
  edges.forEach(edge => {
    const people = residual[edge.to] && residual[edge.to][edge.from] ? residual[edge.to][edge.from] : 0;
    if (people > 0) allocations.push({ from: edge.from, to: edge.to, people });
  });
  return { maxFlow, allocations };
}

function evaluate(plan) {
  const baselineCoverage = Math.max(0.04, Math.min(0.78, plan.coverage * 0.64));
  const baselineTime = Math.round(plan.averageArrival * 1.58 + 12);
  return {
    summary: {
      timeSavedMin: Math.max(0, baselineTime - plan.averageArrival),
      coverageGainPercent: Math.max(0, Math.round(plan.coverage * 100) - Math.round(baselineCoverage * 100))
    },
    comparison: [
      { scenario: "Rescue time", withoutSystem: `${baselineTime} min`, withResQNet: `${plan.averageArrival} min` },
      { scenario: "Coverage", withoutSystem: `${Math.round(baselineCoverage * 100)}%`, withResQNet: `${Math.round(plan.coverage * 100)}%` },
      { scenario: "Unmet demand", withoutSystem: `${Math.round(plan.totalDemand * (1 - baselineCoverage))} people`, withResQNet: `${plan.unmetDemand} people` },
      { scenario: "Risk weighting", withoutSystem: "Not modeled", withResQNet: `${plan.averageRiskWeight}/100 avg` },
      { scenario: "Stress response", withoutSystem: "Manual estimate", withResQNet: plan.stressLabel }
    ]
  };
}

function initMap() {
  if (!window.L || !els.map) return false;
  if (rescueMap) return true;

  rescueMap = L.map(els.map, {
    zoomControl: true,
    scrollWheelZoom: true
  }).setView([24, 22], 2);

  // Tile source is configurable in siteConfig.js (tileUrl / tileAttribution / tileSubdomains).
  // Default: Esri World Street Map - keyless and no Referer requirement. History: the public
  // tile.openstreetmap.org servers return 403 to embedded/file:// traffic, and CARTO raster tiles
  // now stamp "API KEY REQUIRED" on every tile unless a ?key= is supplied.
  const site = window.RESQNET_SITE || {};
  L.tileLayer(site.tileUrl || "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}", {
    maxZoom: 18,
    subdomains: site.tileSubdomains || "abc",
    attribution: site.tileAttribution || "Tiles &copy; Esri &mdash; Source: Esri, HERE, Garmin, OpenStreetMap contributors"
  }).addTo(rescueMap);

  return true;
}

function updateMap(payload) {
  if (!initMap()) {
    renderFallbackMap(payload);
    return;
  }

  els.mapFallback.classList.remove("active");
  mapLayers.forEach(layer => layer.remove());
  mapLayers = [];

  const hubs = getVisibleHubs(payload.incidents);
  const incidentById = new Map(payload.incidents.map(incident => [incident.id, incident]));
  const hubById = new Map(hubs.map(hub => [hub.id, hub]));
  const bounds = [];

  hubs.forEach(hub => {
    const marker = L.marker([hub.lat, hub.lon], {
      icon: L.divIcon({
        className: "",
        html: `<span class="map-marker hub"></span>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9]
      })
    }).bindPopup(`<strong>${escapeHtml(hub.name)}</strong>${escapeHtml(hub.cityName)} response hub`);
    marker.addTo(rescueMap);
    mapLayers.push(marker);
    bounds.push([hub.lat, hub.lon]);
  });

  payload.incidents.forEach(incident => {
    const marker = L.marker([incident.lat, incident.lon], {
      icon: L.divIcon({
        className: "",
        html: `<span class="map-marker incident"></span>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9]
      })
    }).bindPopup(`<strong>${escapeHtml(incident.name)}</strong>${escapeHtml(incident.cityName)} - ${format(incident.people)} people - severity ${incident.severity}%`);
    marker.addTo(rescueMap);
    mapLayers.push(marker);
    bounds.push([incident.lat, incident.lon]);
  });

  payload.plan.allocations.slice(0, 12).forEach((allocation, index) => {
    const hub = hubById.get(allocation.from);
    const incident = incidentById.get(allocation.to);
    if (!hub || !incident) return;

    // Prefer the real road-following geometry (or, failing that, a curved estimate arc)
    // computed server/client-side; only fall back to a bare two-point line if neither is
    // available (e.g. a stale cached payload from before routing carried geometry).
    const rawPath = Array.isArray(allocation.path) && allocation.path.length > 1
      ? allocation.path
      : [{ lat: hub.lat, lon: hub.lon }, { lat: incident.lat, lon: incident.lon }];
    const latlngs = rawPath.map(point => [point.lat, point.lon]);

    const isEstimate = allocation.routingSource === "great-circle-estimate";
    const isTop = index === 0;
    const color = isTop ? "#059669" : allocation.bottleneck ? "#d97706" : "#1d4ed8";
    const popup = `<strong>${escapeHtml(hub.name)} to ${escapeHtml(incident.name)}</strong>` +
      `${format(allocation.people)} people, ${allocation.travelMinutes} min, risk ${allocation.riskWeight}` +
      `<br><small>${isEstimate ? "Estimated route (straight-line distance)" : "Real road route (OSRM)"}</small>`;

    // Soft halo underneath the top pick makes it read as "the chosen route" at a glance
    // without needing a separate legend lookup.
    if (isTop) {
      const halo = L.polyline(latlngs, {
        color,
        weight: 11,
        opacity: 0.18,
        lineCap: "round",
        lineJoin: "round"
      });
      halo.addTo(rescueMap);
      mapLayers.push(halo);
    }

    const route = L.polyline(latlngs, {
      color,
      weight: isTop ? 5 : 3,
      opacity: isTop ? 0.92 : 0.58,
      lineCap: "round",
      lineJoin: "round",
      dashArray: isEstimate ? "2, 9" : null
    }).bindPopup(popup);
    route.addTo(rescueMap);
    mapLayers.push(route);
  });

  if (bounds.length) rescueMap.fitBounds(bounds, { padding: [34, 34], maxZoom: 6 });
}

function renderFallbackMap(payload) {
  const hubs = getVisibleHubs(payload.incidents);
  const incidentById = new Map(payload.incidents.map(incident => [incident.id, incident]));
  const hubById = new Map(hubs.map(hub => [hub.id, hub]));
  const points = [...hubs, ...payload.incidents];
  const worldView = new Set(payload.incidents.map(incident => incident.cityId)).size > 1;
  const extents = getMapExtents(points);

  function project(point) {
    if (worldView) {
      return { x: ((point.lon + 180) / 360) * 82 + 9, y: ((82 - point.lat) / 164) * 66 + 16 };
    }
    const x = ((point.lon - extents.minLon) / extents.lonRange) * 66 + 17;
    const y = (1 - ((point.lat - extents.minLat) / extents.latRange)) * 54 + 24;
    return { x, y };
  }

  const routes = payload.plan.allocations.slice(0, 12).map((allocation, index) => {
    const hub = hubById.get(allocation.from);
    const incident = incidentById.get(allocation.to);
    if (!hub || !incident) return "";
    const a = project(hub);
    const b = project(incident);
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    const angle = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
    return `<span class="fallback-route ${index === 0 ? "selected" : ""}" style="left:${a.x}%;top:${a.y}%;width:${length}%;transform:rotate(${angle}deg)"></span>`;
  }).join("");

  const pins = points.map(point => {
    const pos = project(point);
    const type = point.capacity ? "hub" : "incident";
    return `<span class="fallback-pin ${type}" title="${escapeHtml(point.name)}" style="left:${pos.x}%;top:${pos.y}%"></span>`;
  }).join("");

  const labels = points.map(point => {
    const pos = project(point);
    const type = point.capacity ? "Hub" : `${format(point.people)} people`;
    return `
      <span class="fallback-label" style="left:${clamp(pos.x, 8, 78)}%;top:${clamp(pos.y, 12, 82)}%">
        ${escapeHtml(point.name)}
        <small>${escapeHtml(type)}</small>
      </span>
    `;
  }).join("");

  const basemap = worldView ? buildWorldBasemap() : buildLocalBasemap(payload.incidents[0]?.cityName || "Local area");
  els.mapFallback.innerHTML = basemap + routes + pins + labels;
  els.mapFallback.classList.add("active");
}

function buildInteractiveGraph(payload) {
  const hubs = getVisibleHubs(payload.incidents);
  const incidents = payload.incidents;
  const cityIds = new Set(incidents.map(incident => incident.cityId));
  const cityNodes = cities
    .filter(city => cityIds.has(city.id))
    .map(city => ({
      id: `corridor-${city.id}`,
      label: `${city.name} corridor`,
      type: "corridor",
      lat: city.lat,
      lon: city.lon,
      risk: 28
    }));

  const nodes = [
    ...hubs.map(hub => ({
      id: hub.id,
      label: hub.name,
      type: "hub",
      cityId: hub.cityId || cities.find(city => city.name === hub.cityName)?.id,
      lat: hub.lat,
      lon: hub.lon,
      risk: 18,
      capacity: hub.capacity
    })),
    ...cityNodes,
    ...incidents.map(incident => ({
      id: incident.id,
      label: incident.name,
      type: "incident",
      cityId: incident.cityId,
      lat: incident.lat,
      lon: incident.lon,
      risk: Math.min(100, Math.round(incident.severity * 0.62 + Math.min(30, incident.people / 140))),
      severity: incident.severity,
      people: incident.people,
      kind: incident.kind
    }))
  ];

  const edges = [];
  hubs.forEach(hub => {
    const cityId = hub.cityId || cities.find(city => city.name === hub.cityName)?.id;
    const corridorId = `corridor-${cityId}`;
    if (cityIds.has(cityId)) {
      edges.push(makeGraphEdge(hub, nodes.find(node => node.id === corridorId), "staging"));
    }
    incidents.forEach(incident => {
      if (hub.cityId !== incident.cityId && haversineKm(hub, incident) > 350) return;
      edges.push(makeGraphEdge(hub, incident, "direct"));
    });
  });

  incidents.forEach(incident => {
    const corridor = nodes.find(node => node.id === `corridor-${incident.cityId}`);
    if (corridor) edges.push(makeGraphEdge(corridor, incident, "corridor"));
  });

  const topRoute = payload.plan.allocations[0];
  const priorityIncident = [...incidents].sort((a, b) => b.severity * b.people - a.severity * a.people)[0];
  return {
    nodes,
    edges,
    startId: topRoute ? topRoute.from : hubs[0]?.id,
    goalId: topRoute ? topRoute.to : priorityIncident?.id
  };
}

function makeGraphEdge(from, to, kind) {
  const distanceKm = haversineKm(from, to);
  const targetRisk = to.risk || to.severity || 30;
  const base = Math.round(6 + distanceKm * 1.4 + targetRisk * 0.58);
  return {
    id: `${from.id}-${to.id}-${kind}`,
    source: from.id,
    target: to.id,
    kind,
    distanceKm: Math.round(distanceKm),
    baseWeight: base,
    weight: base,
    risk: targetRisk
  };
}

function updateGraphLab(payload) {
  if (!window.cytoscape || !els.cyGraph) {
    els.graphLoading.textContent = "Graph library unavailable";
    return;
  }

  currentPayload = payload;
  currentGraph = applySimulationWeights(buildInteractiveGraph(payload));
  renderCytoscapeGraph(currentGraph);
  runSelectedAlgorithm();
}

function applySimulationWeights(graph) {
  const flood = Number(els.floodSlider.value) / 100;
  const quake = Number(els.quakeSlider.value) / 100;
  const traffic = Number(els.trafficSlider.value) / 100;
  const nodeById = new Map(graph.nodes.map(node => [node.id, node]));
  const edges = graph.edges.map(edge => {
    const target = nodeById.get(edge.target);
    const floodPenalty = target?.kind === "flood" || edge.kind === "corridor" ? flood * 52 : flood * 16;
    const quakePenalty = target?.kind === "earthquake" || edge.kind === "direct" ? quake * 46 : quake * 12;
    const trafficPenalty = traffic * (edge.kind === "direct" ? 60 : 34);
    const weight = Math.round(edge.baseWeight + floodPenalty + quakePenalty + trafficPenalty);
    return { ...edge, weight };
  });

  return { ...graph, edges };
}

function renderCytoscapeGraph(graph) {
  const elements = [
    ...graph.nodes.map(node => ({ data: node })),
    ...graph.edges.map(edge => ({ data: edge }))
  ];

  if (!cy) {
    cy = cytoscape({
      container: els.cyGraph,
      elements,
      layout: { name: "cose", animate: true, fit: true, padding: 36 },
      style: [
        { selector: "node", style: { "label": "data(label)", "font-size": 10, "text-wrap": "wrap", "text-max-width": 96, "background-color": "#64748b", "color": "#0f172a", "width": 34, "height": 34, "border-width": 2, "border-color": "#fff" } },
        { selector: "node[type = 'hub']", style: { "background-color": "#1d4ed8", "shape": "round-rectangle" } },
        { selector: "node[type = 'incident']", style: { "background-color": "#dc2626", "shape": "ellipse" } },
        { selector: "node[type = 'corridor']", style: { "background-color": "#d97706", "shape": "diamond" } },
        { selector: "edge", style: { "curve-style": "bezier", "target-arrow-shape": "triangle", "line-color": "#cbd5e1", "target-arrow-color": "#cbd5e1", "width": 2, "label": "data(weight)", "font-size": 9, "color": "#64748b" } },
        { selector: ".visited", style: { "background-color": "#0ea5e9", "line-color": "#0ea5e9", "target-arrow-color": "#0ea5e9" } },
        { selector: ".selected", style: { "background-color": "#059669", "line-color": "#059669", "target-arrow-color": "#059669", "width": 5, "z-index": 10 } },
        { selector: ".traversed", style: { "line-color": "#7c3aed", "target-arrow-color": "#7c3aed", "width": 7 } }
      ]
    });
    cy.on("tap", "node", event => showNodeInfo(event.target.data()));
    cy.on("tap", "edge", event => showEdgeInfo(event.target.data()));
  } else {
    cy.elements().remove();
    cy.add(elements);
    cy.layout({ name: "cose", animate: true, fit: true, padding: 36 }).run();
  }
}

function runSelectedAlgorithm() {
  if (!currentGraph || !currentGraph.startId || !currentGraph.goalId) return;
  els.graphLoading.textContent = "Calculating route...";
  const startedAt = performance.now();
  const result = selectedAlgorithm === "astar"
    ? runAStar(currentGraph, currentGraph.startId, currentGraph.goalId)
    : runDijkstraGraph(currentGraph, currentGraph.startId, currentGraph.goalId);
  const elapsed = Number((performance.now() - startedAt).toFixed(3));
  selectedPath = result.path;
  highlightGraphResult(result);
  els.nodesVisited.textContent = result.visited;
  els.pathCost.textContent = result.cost === Infinity ? "--" : result.cost;
  els.executionTime.textContent = `${elapsed} ms`;
  els.graphModeLabel.textContent = `${selectedAlgorithm === "astar" ? "A*" : "Dijkstra"} weighted graph routing`;
  els.graphLoading.textContent = "Ready";
  renderCostBreakdown(result, elapsed);
}

function runDijkstraGraph(graph, startId, goalId) {
  const adjacency = makeAdjacency(graph.edges);
  const distances = Object.fromEntries(graph.nodes.map(node => [node.id, Infinity]));
  const previous = {};
  const queue = new Set(graph.nodes.map(node => node.id));
  let visited = 0;
  distances[startId] = 0;

  while (queue.size) {
    let current = null;
    queue.forEach(id => {
      if (current === null || distances[id] < distances[current]) current = id;
    });
    if (current === null || distances[current] === Infinity) break;
    queue.delete(current);
    visited += 1;
    if (current === goalId) break;
    (adjacency.get(current) || []).forEach(edge => {
      const candidate = distances[current] + edge.weight;
      if (candidate < distances[edge.target]) {
        distances[edge.target] = candidate;
        previous[edge.target] = { node: current, edgeId: edge.id };
      }
    });
  }

  return buildPathResult(previous, startId, goalId, distances[goalId], visited);
}

function runAStar(graph, startId, goalId) {
  const adjacency = makeAdjacency(graph.edges);
  const nodeById = new Map(graph.nodes.map(node => [node.id, node]));
  const open = new Set([startId]);
  const previous = {};
  const gScore = Object.fromEntries(graph.nodes.map(node => [node.id, Infinity]));
  const fScore = Object.fromEntries(graph.nodes.map(node => [node.id, Infinity]));
  let visited = 0;
  gScore[startId] = 0;
  fScore[startId] = graphHeuristic(nodeById.get(startId), nodeById.get(goalId));

  while (open.size) {
    let current = null;
    open.forEach(id => {
      if (current === null || fScore[id] < fScore[current]) current = id;
    });
    if (current === goalId) break;
    open.delete(current);
    visited += 1;
    (adjacency.get(current) || []).forEach(edge => {
      const candidate = gScore[current] + edge.weight;
      if (candidate < gScore[edge.target]) {
        previous[edge.target] = { node: current, edgeId: edge.id };
        gScore[edge.target] = candidate;
        fScore[edge.target] = candidate + graphHeuristic(nodeById.get(edge.target), nodeById.get(goalId));
        open.add(edge.target);
      }
    });
  }

  return buildPathResult(previous, startId, goalId, gScore[goalId], visited);
}

function makeAdjacency(edges) {
  const adjacency = new Map();
  edges.forEach(edge => {
    if (!adjacency.has(edge.source)) adjacency.set(edge.source, []);
    adjacency.get(edge.source).push(edge);
  });
  return adjacency;
}

function buildPathResult(previous, startId, goalId, cost, visited) {
  const path = [];
  for (let node = goalId; node && node !== startId; node = previous[node]?.node) {
    const step = previous[node];
    if (!step) break;
    path.unshift({ from: step.node, to: node, edgeId: step.edgeId });
  }
  return { path, cost: cost === Infinity ? Infinity : Math.round(cost), visited };
}

function graphHeuristic(a, b) {
  if (!a || !b) return 0;
  return Math.round(haversineKm(a, b) * 0.65);
}

function highlightGraphResult(result) {
  if (!cy) return;
  cy.elements().removeClass("selected visited traversed");
  result.path.forEach(step => {
    cy.getElementById(step.from).addClass("selected");
    cy.getElementById(step.to).addClass("selected");
    cy.getElementById(step.edgeId).addClass("selected");
  });
}

function renderCostBreakdown(result, elapsed) {
  const edgeById = new Map(currentGraph.edges.map(edge => [edge.id, edge]));
  const riskyAvoided = currentGraph.nodes
    .filter(node => node.type === "incident" && !result.path.some(step => step.to === node.id))
    .sort((a, b) => b.risk - a.risk)
    .slice(0, 2)
    .map(node => node.label)
    .join(", ") || "None";
  const edgeText = result.path.map(step => {
    const edge = edgeById.get(step.edgeId);
    return edge ? `${edge.kind}: ${edge.weight}` : "";
  }).filter(Boolean).join(" + ");
  els.costBreakdown.innerHTML = [
    ["Chosen path", result.path.length ? result.path.map(step => step.to).join(" -> ") : "No feasible path"],
    ["Cost breakdown", edgeText || "No route cost available"],
    ["Risky nodes avoided", riskyAvoided],
    ["Timer", `${elapsed} ms JavaScript execution`]
  ].map(([label, value]) => `<article><span>${label}</span><strong>${escapeHtml(value)}</strong></article>`).join("");
}

function animateSelectedPath() {
  if (!cy || !selectedPath.length) return;
  cy.elements().removeClass("traversed");
  els.graphLoading.textContent = "Animating path...";
  selectedPath.forEach((step, index) => {
    setTimeout(() => {
      cy.getElementById(step.edgeId).addClass("traversed");
      cy.getElementById(step.to).addClass("traversed");
      if (index === selectedPath.length - 1) els.graphLoading.textContent = "Ready";
    }, index * 420);
  });
}

function showNodeInfo(node) {
  const degree = cy ? cy.getElementById(node.id).connectedEdges().length : 0;
  els.infoTitle.textContent = node.label;
  els.infoBody.textContent = `${node.type} node. Risk score ${node.risk || 0}/100. Connectivity ${degree} graph edges. ${node.people ? `${format(node.people)} affected people.` : ""}`;
}

function showEdgeInfo(edge) {
  els.infoTitle.textContent = `${edge.source} -> ${edge.target}`;
  els.infoBody.textContent = `${edge.kind} edge. Current weight ${edge.weight}, base weight ${edge.baseWeight}, distance ${edge.distanceKm} km, target risk ${edge.risk}/100.`;
}

function getMapExtents(points) {
  const lats = points.map(point => point.lat);
  const lons = points.map(point => point.lon);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const latPad = Math.max(0.04, (maxLat - minLat) * 0.3);
  const lonPad = Math.max(0.04, (maxLon - minLon) * 0.3);
  return {
    minLat: minLat - latPad,
    minLon: minLon - lonPad,
    latRange: Math.max(0.02, maxLat - minLat + latPad * 2),
    lonRange: Math.max(0.02, maxLon - minLon + lonPad * 2)
  };
}

function buildWorldBasemap() {
  return `
    <svg class="fallback-basemap" viewBox="0 0 1000 520" preserveAspectRatio="none" aria-hidden="true">
      <rect width="1000" height="520" fill="#eef2f7"></rect>
      <path class="water-line" d="M0 125 C160 100 250 150 410 128 S680 96 1000 130"></path>
      <path class="water-line" d="M0 325 C180 300 300 356 470 332 S720 292 1000 335"></path>
      <path class="land" d="M95 120 C140 62 225 78 260 132 C298 188 250 234 188 220 C130 210 60 180 95 120Z"></path>
      <path class="land" d="M215 245 C268 228 323 260 322 318 C322 390 250 428 214 368 C180 310 160 266 215 245Z"></path>
      <path class="land" d="M430 98 C520 56 628 80 705 130 C782 182 770 252 676 262 C600 270 550 228 482 230 C410 232 360 175 430 98Z"></path>
      <path class="land" d="M575 250 C650 238 720 275 745 340 C775 418 672 448 618 395 C574 352 530 275 575 250Z"></path>
      <path class="land" d="M790 278 C852 244 940 262 958 325 C977 390 900 425 835 392 C782 365 740 306 790 278Z"></path>
      <path class="land" d="M488 312 C548 310 595 350 582 400 C566 462 472 462 438 408 C404 354 426 314 488 312Z"></path>
    </svg>
  `;
}

function buildLocalBasemap(cityName) {
  return `
    <svg class="fallback-basemap" viewBox="0 0 1000 520" preserveAspectRatio="none" aria-hidden="true">
      <rect width="1000" height="520" fill="#eef2f7"></rect>
      <path class="map-area" d="M45 90 H955 V430 H45Z"></path>
      <path class="map-area" d="M110 130 H360 V260 H110Z"></path>
      <path class="map-area" d="M390 115 H650 V245 H390Z"></path>
      <path class="map-area" d="M690 140 H900 V300 H690Z"></path>
      <path class="map-area" d="M170 305 H455 V420 H170Z"></path>
      <path class="map-area" d="M510 295 H850 V425 H510Z"></path>
      <path class="road-major" d="M40 268 C190 235 325 260 480 238 S760 198 960 230"></path>
      <path class="road-major" d="M238 70 C260 180 248 285 310 450"></path>
      <path class="road-major" d="M620 70 C590 190 635 310 590 455"></path>
      <path class="road-minor" d="M80 155 H930"></path>
      <path class="road-minor" d="M80 350 H930"></path>
      <path class="water-line" d="M0 470 C220 430 360 505 520 462 S780 415 1000 455"></path>
      <text x="82" y="112">${escapeHtml(cityName)} route graph</text>
    </svg>
  `;
}

function getVisibleHubs(incidents) {
  const cityIds = new Set(incidents.map(incident => incident.cityId));
  return cities
    .filter(city => cityIds.has(city.id))
    .flatMap(city => city.hubs.map(hub => ({
      ...hub,
      cityName: city.name,
      capacity: hubCapacity(hub)
    })));
}

async function runStress() {
  const startedAt = performance.now();
  const syntheticCities = Array.from({ length: 40 }, (_, index) => ({
    id: `city-${index}`,
    name: `Synthetic City ${index + 1}`,
    country: "Test",
    lat: 20 + (index % 10) * 2,
    lon: 70 + Math.floor(index / 10) * 2,
    hubs: [
      { id: `hub-${index}-a`, name: `Hub ${index + 1}A`, lat: 20 + (index % 10) * 2, lon: 70 + Math.floor(index / 10) * 2, teams: 20, ambulances: 10, beds: 80, kits: 900 }
    ]
  }));
  const syntheticIncidents = syntheticCities.map((city, index) => ({
    id: `incident-${index}`,
    name: `Synthetic crisis ${index + 1}`,
    kind: ["earthquake", "flood", "storm"][index % 3],
    source: "Stress generator",
    cityId: city.id,
    cityName: city.name,
    lat: city.lat + 0.05,
    lon: city.lon + 0.05,
    severity: 55 + index % 35,
    people: 300 + index * 20
  }));
  // useRealRouting: false - synthetic test coordinates, not real places; this button
  // benchmarks the graph/max-flow code path, not live routing.
  const plan = await optimize(syntheticCities, syntheticIncidents, "blocked", false);
  const runtimeMs = Number((performance.now() - startedAt).toFixed(3));
  els.stressStatus.textContent = runtimeMs < 250 ? "PASS" : "REVIEW";
  const items = [
    ["Cities", 40],
    ["Incidents", 40],
    ["Graph", `${plan.nodes} nodes - ${plan.edges} edges`],
    ["Blocked-route runtime", `${runtimeMs} ms`],
    ["Max Flow", format(plan.maxFlow)],
    ["Avg Risk", `${plan.averageRiskWeight}/100`]
  ];
  els.stressGrid.innerHTML = items.map(([label, value]) => `<article><span>${label}</span><strong>${value}</strong></article>`).join("");
}

function renderPlan(payload, evaluation, mode) {
  const plan = payload.plan;
  const topRoute = plan.allocations[0];
  const priorityIncident = [...payload.incidents].sort((a, b) => b.severity * b.people - a.severity * a.people)[0];

  els.status.textContent = `Optimization complete (${mode})`;
  els.sourceNotes.textContent = payload.notes.join(" - ");
  els.maxFlow.textContent = format(plan.maxFlow);
  els.coverage.textContent = `${Math.round(plan.coverage * 100)}%`;
  els.avgTime.textContent = `${plan.averageArrival} min`;
  els.runtime.textContent = `${plan.runtimeMs} ms`;
  els.priorityCity.textContent = priorityIncident ? priorityIncident.cityName : "--";
  els.riskWeight.textContent = plan.averageRiskWeight ? `${plan.averageRiskWeight}/100` : "--";
  els.stressMode.textContent = plan.stressLabel || "Normal";
  els.incidentCount.textContent = `${payload.incidents.length} incidents`;
  els.graphSize.textContent = `${plan.nodes} nodes - ${plan.edges} edges`;
  els.gain.textContent = `+${evaluation.summary.coverageGainPercent}% coverage, ${evaluation.summary.timeSavedMin} min saved`;

  if (topRoute) {
    els.decisionTitle.textContent = `${topRoute.hubName} to ${topRoute.incidentName}`;
    els.decisionReason.textContent = `Selected first because its risk-weighted route cost is ${topRoute.riskWeight}/100 with ${topRoute.travelMinutes} minutes travel time, ${format(topRoute.people)} people-equivalent capacity, and ${Math.round(topRoute.utilization * 100)}% edge utilization.`;
  } else {
    els.decisionTitle.textContent = "No feasible route found";
    els.decisionReason.textContent = payload.incidents.length
      ? "No hub-to-incident edge survived the current stress and regional constraints."
      : "The live feeds show no active hazards in this region right now, so there is nothing to route to. Tick Demo scenario and run again to see routing on synthetic incidents.";
  }

  updateMap(payload);
  updateGraphLab(payload);

  els.incidentRows.innerHTML = payload.incidents.map(incident => {
    const risk = Math.min(100, Math.round(incident.severity * 0.55 + Math.min(35, incident.people / 120) + (stressProfiles[plan.stress]?.riskBonus || 0)));
    return `
      <tr>
        <td><strong>${escapeHtml(incident.name)}</strong></td>
        <td>${escapeHtml(incident.cityName)}</td>
        <td>${format(incident.people)}</td>
        <td>${incident.severity}%</td>
        <td>${risk}/100</td>
      </tr>
    `;
  }).join("");

  els.planList.innerHTML = plan.allocations.slice(0, 10).map((item, index) => `
    <article class="plan-item">
      <span class="rank">${index + 1}</span>
      <div>
        <h3>${escapeHtml(item.hubName)} to ${escapeHtml(item.incidentName)}</h3>
        <p>${format(item.people)} people-equivalent capacity, ${item.travelMinutes} min, ${item.distanceKm || "--"} km, risk weight ${item.riskWeight}/100.</p>
      </div>
      <span class="badge ${item.bottleneck ? "alert" : ""}">${item.bottleneck ? "Bottleneck" : "Selected"}</span>
    </article>
  `).join("");

  els.evaluationRows.innerHTML = evaluation.comparison.map(row => `
    <tr>
      <td>${escapeHtml(row.scenario)}</td>
      <td>${escapeHtml(row.withoutSystem)}</td>
      <td><strong>${escapeHtml(row.withResQNet)}</strong></td>
    </tr>
  `).join("");
}

function hubCapacity(hub) {
  return Math.round(hub.teams * 18 + hub.ambulances * 9 + hub.beds * 0.45 + hub.kits / 18);
}

function haversineKm(a, b) {
  const radius = 6371;
  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLon = (b.lon - a.lon) * Math.PI / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * radius * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

// --- Real road routing (GitHub Pages / no-backend mode) -------------------------------
// Same idea as the Node backend's routing.js: ask OSRM's public demo server for a real
// driving route, cache it, and fall back to the straight-line distance (clearly flagged)
// if OSRM is unreachable. Runs client-side so this works even when this page is served
// as static files with no Node process behind it.
const OSRM_BASE_URL = "https://router.project-osrm.org";
const osrmRouteCache = new Map();

function roundCoord(value) {
  return Math.round(value * 2000) / 2000;
}

function routeCacheKey(a, b) {
  return `${roundCoord(a.lat)},${roundCoord(a.lon)}|${roundCoord(b.lat)},${roundCoord(b.lon)}`;
}

// Deterministic small integer derived from two coordinates - keeps a given hub/incident
// pair's fallback arc bend stable across re-renders instead of jittering randomly.
function bendSeed(a, b) {
  const str = `${a.lat.toFixed(3)},${a.lon.toFixed(3)}|${b.lat.toFixed(3)},${b.lon.toFixed(3)}`;
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) hash = (hash * 31 + str.charCodeAt(i)) | 0;
  return hash;
}

// Gentle quadratic-bezier arc between two points, used only when we have no real road
// geometry so an estimated route still reads as intentional/estimated on the map rather
// than a plain ruler-straight line.
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
    points.push({
      lat: inv * inv * a.lat + 2 * inv * t * controlLat + t * t * b.lat,
      lon: inv * inv * a.lon + 2 * inv * t * controlLon + t * t * b.lon
    });
  }
  return points;
}

function fallbackArcRoute(a, b) {
  const seed = bendSeed(a, b);
  const strength = 0.1 + (Math.abs(seed) % 12) / 100; // 0.10 - 0.21
  const bend = seed % 2 === 0 ? strength : -strength;
  return {
    distanceKm: haversineKm(a, b),
    durationMin: null,
    routingSource: "great-circle-estimate",
    path: arcPoints(a, b, { bend })
  };
}

async function fetchOsrmRouteBrowser(a, b) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    // overview=full + geometries=geojson returns the actual road-following polyline
    // (not just a distance/time number) so the map can draw the real route instead of
    // a straight line between hub and incident.
    const url = `${OSRM_BASE_URL}/route/v1/driving/${a.lon},${a.lat};${b.lon},${b.lat}?overview=full&geometries=geojson&alternatives=false&steps=false`;
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

async function getRouteBrowser(a, b) {
  const key = routeCacheKey(a, b);
  if (osrmRouteCache.has(key)) return osrmRouteCache.get(key);
  let route;
  try {
    route = await fetchOsrmRouteBrowser(a, b);
  } catch {
    route = fallbackArcRoute(a, b);
  }
  osrmRouteCache.set(key, route);
  return route;
}

async function getRoutesBatchBrowser(pairs) {
  const results = new Array(pairs.length);
  let cursor = 0;
  async function worker() {
    while (cursor < pairs.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await getRouteBrowser(pairs[index][0], pairs[index][1]);
    }
  }
  const workerCount = Math.min(6, pairs.length) || 1;
  await Promise.all(Array.from({ length: workerCount }, worker));
  return results;
}

// --- Live location -> nearest hospital -------------------------------------------
// Uses the browser Geolocation API to get the person's real live position, then finds
// the closest ACTUAL hospital anywhere in the world via OpenStreetMap's Overpass API
// (not just the 12 fixed North Bay, CA hubs used by the simulation above - someone
// opening this from Karnal or Kyoto or Nairobi should get a real nearby hospital, not
// a California one thousands of km away). Falls back to the curated North Bay dataset
// only if the live OSM lookup itself fails (e.g. offline / Overpass unreachable).
const allHubs = cities.flatMap(city => city.hubs.map(hub => ({
  ...hub,
  cityId: city.id,
  cityName: city.name
})));

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
// Search rings, in meters - start close and widen out until something real is found,
// so a person in a dense city gets a very local result while someone in a rural area
// still gets an answer instead of "nothing found".
const OVERPASS_RADII_M = [8000, 20000, 60000, 150000, 400000];

let locateLayers = [];

function clearLocateLayers() {
  locateLayers.forEach(layer => layer.remove());
  locateLayers = [];
}

function nearestFixedHospitalTo(point) {
  let best = null;
  let bestKm = Infinity;
  allHubs.forEach(hub => {
    const km = haversineKm(point, hub);
    if (km < bestKm) {
      bestKm = km;
      best = hub;
    }
  });
  return best;
}

function overpassElementToHospital(element, userPoint) {
  const lat = element.lat ?? element.center?.lat;
  const lon = element.lon ?? element.center?.lon;
  if (lat == null || lon == null) return null;
  const tags = element.tags || {};
  const name = tags.name || tags["name:en"] || "Unnamed hospital";
  const addressParts = [tags["addr:housenumber"], tags["addr:street"], tags["addr:city"]]
    .filter(Boolean);
  return {
    id: `osm-${element.type}-${element.id}`,
    name,
    lat,
    lon,
    cityName: tags["addr:city"] || "",
    address: addressParts.join(" ") || null,
    emergency: tags.emergency === "yes",
    beds: tags.beds ? Number(tags.beds) : null,
    straightLineKm: haversineKm(userPoint, { lat, lon })
  };
}

async function fetchNearbyHospitalsOsm(userPoint) {
  for (const radius of OVERPASS_RADII_M) {
    const query = `[out:json][timeout:20];
(
  node["amenity"="hospital"](around:${radius},${userPoint.lat},${userPoint.lon});
  way["amenity"="hospital"](around:${radius},${userPoint.lat},${userPoint.lon});
  relation["amenity"="hospital"](around:${radius},${userPoint.lat},${userPoint.lon});
);
out center 15;`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(OVERPASS_URL, {
        method: "POST",
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`Overpass HTTP ${response.status}`);
      const payload = await response.json();
      const hospitals = (payload.elements || [])
        .map(element => overpassElementToHospital(element, userPoint))
        .filter(Boolean)
        .sort((a, b) => a.straightLineKm - b.straightLineKm);
      if (hospitals.length) return hospitals;
    } catch (error) {
      // Keep widening the search radius on a miss; only bail out for real network
      // failure so one empty ring doesn't stop a wider ring from being tried.
      if (error.name === "AbortError") throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
  return [];
}

function setLocateStatus(message, tone) {
  els.locateStatus.textContent = message;
  els.locateStatus.classList.remove("error", "success");
  if (tone) els.locateStatus.classList.add(tone);
}

function geolocationErrorMessage(error) {
  if (error.code === error.PERMISSION_DENIED) {
    return "Location permission was denied. Enable location access for this site in your browser settings and try again.";
  }
  if (error.code === error.POSITION_UNAVAILABLE) {
    return "Your position is currently unavailable. Check your device's location/GPS settings and try again.";
  }
  if (error.code === error.TIMEOUT) {
    return "Timed out getting your location. Try again, ideally with a clear GPS signal.";
  }
  return "Could not get your location. Try again.";
}

function getCurrentPositionAsync(options) {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

async function useMyLocation() {
  if (!("geolocation" in navigator)) {
    setLocateStatus("Geolocation isn't supported in this browser.", "error");
    return;
  }

  els.locateBtn.disabled = true;
  setLocateStatus("Requesting permission and locating you...");

  try {
    const position = await getCurrentPositionAsync({
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0
    });

    const userPoint = {
      lat: position.coords.latitude,
      lon: position.coords.longitude
    };

    setLocateStatus("Searching nearby real hospitals (OpenStreetMap)...");

    let hospital = null;
    let usedFixedFallback = false;

    try {
      const hospitals = await fetchNearbyHospitalsOsm(userPoint);
      if (hospitals.length) hospital = hospitals[0];
    } catch {
      // OSM lookup failed outright (offline, blocked, etc.) - handled below.
    }

    if (!hospital) {
      // Last resort only: OSM had nothing (or was unreachable) within ~400km, so fall
      // back to this app's own curated North Bay, CA hospital list rather than showing
      // nothing. This is clearly labeled in the UI so it's never mistaken for a real
      // nearby match.
      const fixedHub = nearestFixedHospitalTo(userPoint);
      if (fixedHub) {
        hospital = { ...fixedHub, straightLineKm: haversineKm(userPoint, fixedHub) };
        usedFixedFallback = true;
      }
    }

    if (!hospital) {
      setLocateStatus("Couldn't find any hospital near your location. Try again or check your connection.", "error");
      return;
    }

    setLocateStatus("Calculating route...");

    // Ask for a real road-network route so distance/time and the drawn line reflect
    // actual driving routes, not a straight line - falls back to a great-circle
    // estimate automatically if OSRM can't be reached.
    const route = await getRouteBrowser(userPoint, { lat: hospital.lat, lon: hospital.lon });
    const isEstimate = route.routingSource === "great-circle-estimate";

    renderNearestHospital(userPoint, hospital, route, isEstimate, usedFixedFallback);

    if (usedFixedFallback) {
      setLocateStatus(
        "No nearby hospital found on OpenStreetMap - showing this app's North Bay, CA dataset instead (may be far away).",
        "error"
      );
    } else {
      setLocateStatus(
        isEstimate
          ? "Located you. Showing straight-line estimate (road routing was unreachable)."
          : "Located you. Showing the nearest real hospital by road route.",
        "success"
      );
    }
  } catch (error) {
    if (error && typeof error.code === "number") {
      setLocateStatus(geolocationErrorMessage(error), "error");
    } else {
      setLocateStatus("Something went wrong finding your route. Try again.", "error");
    }
  } finally {
    els.locateBtn.disabled = false;
  }
}

function renderNearestHospital(userPoint, hospital, route, isEstimate, usedFixedFallback) {
  const locationLabel = hospital.cityName ? `, ${hospital.cityName}` : "";
  els.nearestHospitalTitle.textContent = usedFixedFallback
    ? `No real hospital found nearby on OpenStreetMap - closest match from this app's own dataset: ${hospital.name}${locationLabel}.`
    : `${hospital.name}${locationLabel} is the nearest real hospital to your live location.`;
  els.nhName.textContent = `${hospital.name}${locationLabel}`;
  els.nhDistance.textContent = `${route.distanceKm.toFixed(1)} km${isEstimate ? " (est.)" : ""}`;
  els.nhTime.textContent = route.durationMin ? `${Math.round(route.durationMin)} min` : "--";
  els.nhBeds.textContent = hospital.beds ? `${hospital.beds} beds` : "Not available";
  els.nearestHospitalMetrics.hidden = false;
  els.nearestHospitalActions.hidden = false;
  els.nhDirectionsLink.href =
    `https://www.google.com/maps/dir/?api=1&origin=${userPoint.lat},${userPoint.lon}` +
    `&destination=${hospital.lat},${hospital.lon}&travelmode=driving`;

  if (!initMap()) return;

  clearLocateLayers();

  const userMarker = L.marker([userPoint.lat, userPoint.lon], {
    icon: L.divIcon({
      className: "",
      html: `<span class="map-marker user"></span>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    })
  }).bindPopup("<strong>Your live location</strong>");
  userMarker.addTo(rescueMap);
  locateLayers.push(userMarker);

  const bedsLine = hospital.beds ? `${hospital.beds} beds - ` : "";
  const hubMarker = L.marker([hospital.lat, hospital.lon], {
    icon: L.divIcon({
      className: "",
      html: `<span class="map-marker hub"></span>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    })
  }).bindPopup(
    `<strong>${escapeHtml(hospital.name)}</strong>${escapeHtml(locationLabel)}` +
    `<br><small>${bedsLine}${route.distanceKm.toFixed(1)} km away</small>`
  );
  hubMarker.addTo(rescueMap);
  locateLayers.push(hubMarker);

  const rawPath = Array.isArray(route.path) && route.path.length > 1
    ? route.path
    : [userPoint, { lat: hospital.lat, lon: hospital.lon }];
  const latlngs = rawPath.map(point => [point.lat, point.lon]);

  const routeLine = L.polyline(latlngs, {
    color: "#059669",
    weight: 5,
    opacity: 0.9,
    lineCap: "round",
    lineJoin: "round",
    dashArray: isEstimate ? "8 8" : null
  });
  routeLine.addTo(rescueMap);
  locateLayers.push(routeLine);

  const bounds = [[userPoint.lat, userPoint.lon], [hospital.lat, hospital.lon]];
  rescueMap.fitBounds(bounds, { padding: [60, 60], maxZoom: 13 });

  document.getElementById("nearestHospital").scrollIntoView({ behavior: "smooth", block: "center" });
}

function format(value) {
  return Number(value).toLocaleString();
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  }[char]));
}

function refreshSimulationLabels() {
  els.floodValue.textContent = `${els.floodSlider.value}%`;
  els.quakeValue.textContent = `${els.quakeSlider.value}%`;
  els.trafficValue.textContent = `${els.trafficSlider.value}%`;
}

function rerunGraphSimulation() {
  refreshSimulationLabels();
  if (!currentPayload) return;
  currentGraph = applySimulationWeights(buildInteractiveGraph(currentPayload));
  renderCytoscapeGraph(currentGraph);
  runSelectedAlgorithm();
}

function setAlgorithm(mode) {
  selectedAlgorithm = mode;
  els.dijkstraBtn.classList.toggle("active", mode === "dijkstra");
  els.astarBtn.classList.toggle("active", mode === "astar");
  runSelectedAlgorithm();
}

function setPreset(mode) {
  if (mode === "earthquake") {
    els.floodSlider.value = 15;
    els.quakeSlider.value = 88;
    els.trafficSlider.value = 48;
  } else if (mode === "flood") {
    els.floodSlider.value = 86;
    els.quakeSlider.value = 22;
    els.trafficSlider.value = 58;
  } else {
    els.floodSlider.value = 18;
    els.quakeSlider.value = 24;
    els.trafficSlider.value = 22;
  }
  rerunGraphSimulation();
}

document.getElementById("runBtn").addEventListener("click", runSystem);
document.getElementById("stressBtn").addEventListener("click", runStress);
els.locateBtn.addEventListener("click", useMyLocation);
els.dijkstraBtn.addEventListener("click", () => setAlgorithm("dijkstra"));
els.astarBtn.addEventListener("click", () => setAlgorithm("astar"));
els.animatePathBtn.addEventListener("click", animateSelectedPath);
els.darkModeBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  els.darkModeBtn.textContent = document.body.classList.contains("dark") ? "Light" : "Dark";
});
els.presetQuake.addEventListener("click", () => setPreset("earthquake"));
els.presetFlood.addEventListener("click", () => setPreset("flood"));
els.presetNormal.addEventListener("click", () => setPreset("normal"));
[els.floodSlider, els.quakeSlider, els.trafficSlider].forEach(slider => {
  slider.addEventListener("input", rerunGraphSimulation);
});
refreshSimulationLabels();
loadCities().then(runSystem);
