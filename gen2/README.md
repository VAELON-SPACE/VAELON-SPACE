# ResQNet Gen 2 - evaluation build

(c) 2022-2026 Vaelon Space. All rights reserved. Proprietary; see LICENSE.

Gen 2 is an earlier-generation evaluation build (2022-2023 development line): risk-aware emergency
routing on a real North Bay wildfire corridor (11 cities, 12 hospitals) with live USGS and Open-Meteo
feeds, OSRM road routing, Dijkstra / A* and Edmonds-Karp max-flow, and per-provider health.
The current generation is Gen 4; Gen 5 is targeted for January 2027 (a target, not a commitment).

Not an emergency service. Outputs are modeled estimates and must not be used for real rescue or
operational decisions. See the Legal links in the app footer.

## Run

    npm start      # http://localhost:3000, Node 18+, no npm dependencies

Edit `siteConfig.js` to set the contact email, purchase/early-access URL and website link.

## Before publishing

- Have the Legal dialog text (`legal.js`) reviewed by counsel.
- Open-Meteo's free API is for non-commercial use only. A sales website is likely commercial use:
  get an Open-Meteo API plan (or self-host) and keep the "Weather data by Open-Meteo.com" credit.
- The public OSM tile and OSRM demo servers are best-effort with usage policies; use your own or a
  commercial provider for real traffic.
- Set `RESQNET_CORS_ORIGIN` only if the frontend is served from a different origin.
