// legal.js - Legal dialog (notice, terms, disclaimer, privacy, attributions) + the early-access button.
// DRAFT TEXT: written from what this build actually does (see the privacy tab's data flows). Have a
// lawyer review it, and add governing law / entity details, before it goes on the public site.
(() => {
  const site = window.RESQNET_SITE || {};
  const co = site.company || "Vaelon Space";
  const contact = site.contactEmail ? `<a href="mailto:${site.contactEmail}">${site.contactEmail}</a>` : `the ${co} website`;
  const ext = (href, text) => `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;

  const TABS = {
    notice: ["Notice", `
      <p><strong>&copy; 2022&ndash;2026 ${co}. All rights reserved.</strong></p>
      <p>ResQNet is proprietary software of ${co}. Access to this hosted evaluation build does not grant any licence to, or ownership of, the software, its source code, its algorithms or its documentation. You may not copy, modify, distribute, sublicense, sell, or create derivative works from any part of it without prior written permission.</p>
      <p><strong>Generation.</strong> This is Gen 2, an earlier-generation evaluation build from the 2022&ndash;2023 development line. The current generation is Gen 4; Gen 5 is targeted for January 2027. Target dates are plans, not commitments, and capabilities of later generations are not part of this build.</p>
      <p>For licensing or commercial use, contact ${contact}.</p>`],
    terms: ["Terms of use", `
      <p>By using this evaluation build you agree to these terms.</p>
      <p><strong>Permitted.</strong> Viewing and evaluating the software through the interface provided, for your own assessment.</p>
      <p><strong>Not permitted.</strong> Copying or scraping the software or its outputs at scale; automated or excessive requests; attempting to reverse engineer, extract source code, or bypass any limit or protection; reselling or redistributing the service; using it in any way that breaks the law or the terms of the data providers listed under Data &amp; credits.</p>
      <p><strong>No warranty.</strong> The service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;, without warranties of any kind, express or implied, including accuracy, availability, fitness for a particular purpose, or non-infringement.</p>
      <p><strong>Limitation of liability.</strong> To the maximum extent permitted by law, ${co} is not liable for any indirect, incidental, special or consequential damages, or for any loss arising from use of, or inability to use, this build.</p>
      <p><strong>Changes.</strong> ${co} may change, suspend or withdraw this build, and update these terms, at any time. Any separate written agreement with ${co} takes precedence over this page.</p>`],
    disclaimer: ["Safety disclaimer", `
      <p><strong>This is not an emergency service and must not be used for real rescue or operational decisions.</strong></p>
      <p>Outputs are modeled estimates built from public data and documented formulas. Response team, ambulance and medical-kit counts are derived from hospital bed counts, not measured fleet data. Incident severity and affected-population figures are estimates, not casualty models. Routes may fall back to straight-line estimates when road routing is unavailable, and the interface labels when that happens.</p>
      <p>Live feeds can be delayed, incomplete or unavailable. Nothing here replaces trained emergency personnel, official warnings or verified operational data. In an emergency, contact your local emergency services immediately.</p>`],
    privacy: ["Privacy", `
      <p><strong>Short version.</strong> No accounts, no cookies, no analytics or advertising in this build.</p>
      <p><strong>Our server.</strong> Handles your requests to compute routes and fetches public earthquake and weather data using city coordinates, never your personal data. It keeps short-lived, in-memory request counters per network address for rate limiting (cleared every minute) and stores nothing about you in a database. The hosting provider may keep standard access logs (IP address, time, requested path) under its own policy.</p>
      <p><strong>Your browser talks to third parties directly.</strong> Loading the page fetches code libraries from unpkg.com and map tiles from OpenStreetMap, so those services see your IP address. If you use <em>Use My Live Location</em>, your browser asks for permission first; then your exact coordinates are sent from your browser to the Overpass API (overpass-api.de) to find nearby hospitals, and route coordinates (rounded to roughly 50 m) go to the public OSRM routing server. Those requests do not pass through ${co}, and those services have their own privacy policies.</p>
      <p>Questions or requests: ${contact}.</p>`],
    credits: ["Data & credits", `
      <ul>
        <li>Earthquake data: U.S. Geological Survey (USGS) Earthquake Hazards Program. ${ext("https://earthquake.usgs.gov/", "earthquake.usgs.gov")}</li>
        <li>Weather data by ${ext("https://open-meteo.com/", "Open-Meteo.com")}, licensed ${ext("https://creativecommons.org/licenses/by/4.0/", "CC BY 4.0")}. Values are processed and combined into modeled incidents.</li>
        <li>Map data &copy; ${ext("https://www.openstreetmap.org/copyright", "OpenStreetMap contributors")} (ODbL). Hospital lookup uses the Overpass API on OpenStreetMap data.</li>
        <li>Road routing: ${ext("https://project-osrm.org/", "OSRM")} public demo server (best effort, no service guarantee).</li>
        <li>Hospital names and licensed bed counts: California HCAI facility records. ${ext("https://hcai.ca.gov/", "hcai.ca.gov")}</li>
        <li>Open-source libraries: ${ext("https://leafletjs.com/", "Leaflet")} (BSD-2-Clause), ${ext("https://js.cytoscape.org/", "Cytoscape.js")} (MIT).</li>
      </ul>`]
  };

  const dlg = document.createElement("dialog");
  dlg.id = "legalDialog";
  dlg.setAttribute("aria-labelledby", "legalTitle");
  dlg.innerHTML = `<div class="lg-head"><h2 id="legalTitle">Legal</h2><button type="button" class="lg-close" aria-label="Close">Close</button></div>
    <div class="lg-tabs" role="tablist">${Object.entries(TABS).map(([k, [t]]) => `<button type="button" role="tab" data-tab="${k}">${t}</button>`).join("")}</div>
    <div class="lg-body" role="tabpanel" tabindex="0"></div>`;
  document.body.appendChild(dlg);
  const body = dlg.querySelector(".lg-body");

  function show(tab) {
    if (!TABS[tab]) tab = "notice";
    body.innerHTML = TABS[tab][1];
    body.scrollTop = 0;
    dlg.querySelectorAll("[role=tab]").forEach(b => b.setAttribute("aria-selected", String(b.dataset.tab === tab)));
  }
  function openLegal(tab) { show(tab); if (!dlg.open) dlg.showModal(); }

  dlg.addEventListener("click", e => {
    if (e.target === dlg || e.target.closest(".lg-close")) dlg.close();
    const t = e.target.closest("[data-tab]");
    if (t) show(t.dataset.tab);
  });
  document.addEventListener("click", e => {
    const opener = e.target.closest("[data-legal]");
    if (opener) { e.preventDefault(); openLegal(opener.dataset.legal); }
  });

  // Early-access button: purchaseUrl wins, then contactEmail; with neither set it stays hidden.
  const cta = document.getElementById("earlyAccess");
  if (cta) {
    const href = site.purchaseUrl || (site.contactEmail ? `mailto:${site.contactEmail}?subject=${encodeURIComponent("ResQNet early access")}` : "");
    if (href) cta.href = href; else cta.hidden = true;
  }
  const home = document.getElementById("siteLink");
  if (home) { if (site.siteUrl) home.href = site.siteUrl; else home.hidden = true; }
})();
