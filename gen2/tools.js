// tools.js - shareable settings link, auto-refresh, one-page printable report.
(() => {
  const $ = id => document.getElementById(id);
  const ctl = { city: $("citySelect"), people: $("peopleInput"), objective: $("objectiveSelect"), stress: $("stressSelect"), demo: $("demoScenario") };
  const run = $("runBtn");
  if (!ctl.city || !run || !ctl.demo) return;
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const flash = (btn, text) => { const old = btn.textContent; btn.textContent = text; setTimeout(() => { btn.textContent = old; }, 1600); };

  // ---- share link: the four inputs (and demo flag) live in the URL hash; opening it re-runs the decision.
  $("shareBtn").addEventListener("click", async e => {
    const btn = e.currentTarget; // currentTarget is null after an await
    const p = new URLSearchParams({ city: ctl.city.value, people: ctl.people.value, objective: ctl.objective.value, stress: ctl.stress.value, run: "1" });
    if (ctl.demo.checked) p.set("demo", "1");
    const url = `${location.origin}${location.pathname}#${p}`;
    try { await navigator.clipboard.writeText(url); flash(btn, "Link copied"); }
    catch { window.prompt("Copy this link:", url); }
  });

  const shared = new URLSearchParams(location.hash.slice(1));
  if ([...shared.keys()].length) {
    let tries = 0;
    const wait = setInterval(() => {   // city options arrive asynchronously from /api/cities
      tries += 1;
      if (ctl.city.options.length <= 1 && tries < 20) return;
      clearInterval(wait);
      const pick = (el, v) => { if (v && [...el.options].some(o => o.value === v)) el.value = v; };
      pick(ctl.city, shared.get("city")); pick(ctl.objective, shared.get("objective")); pick(ctl.stress, shared.get("stress"));
      const n = Number(shared.get("people"));
      if (Number.isFinite(n) && n >= 100 && n <= 1000000) ctl.people.value = String(Math.round(n));
      ctl.demo.checked = shared.get("demo") === "1";
      if (shared.get("run") === "1") run.click();
    }, 150);
  }

  // ---- auto-refresh: re-runs the decision every 5 minutes while the tab is visible.
  let refresh = null;
  $("autoRefresh").addEventListener("change", e => {
    clearInterval(refresh);
    if (e.target.checked) refresh = setInterval(() => { if (!document.hidden) run.click(); }, 300000);
  });

  // ---- printable one-page report: fills a header that only shows in print, then opens the print dialog
  // (choose "Save as PDF" there). The print stylesheet hides the controls and lab sections.
  $("reportBtn").addEventListener("click", () => {
    let el = $("printHeader");
    if (!el) { el = document.createElement("section"); el.id = "printHeader"; document.querySelector("main").prepend(el); }
    const label = s => s.options[s.selectedIndex]?.text || s.value;
    const now = new Date();
    el.innerHTML = `<h1>ResQNet Gen 2 &mdash; Situation report</h1>
      <p class="ph-meta">Vaelon Space &middot; Generated ${esc(now.toLocaleString())} (${esc(now.toISOString())} UTC)</p>
      <table><tbody>
        <tr><th>Region</th><td>${esc(label(ctl.city))}</td><th>People, first priority incident</th><td>${esc(ctl.people.value)}</td></tr>
        <tr><th>Objective</th><td>${esc(label(ctl.objective))}</td><th>Route stress</th><td>${esc(label(ctl.stress))}</td></tr>
        <tr><th>Data</th><td colspan="3">${ctl.demo.checked ? "Demo scenario: synthetic incidents, not live hazards" : "Live feeds (USGS, Open-Meteo) with modeled fallbacks where noted"}</td></tr>
      </tbody></table>
      <p><strong>Decision:</strong> ${esc($("decisionTitle").textContent)}</p>
      <p>${esc($("decisionReason").textContent)}</p>
      <p class="ph-note">Sources: ${esc($("sourceNotes").textContent)}</p>
      <p class="ph-note">Modeled estimates for evaluation only; not for real rescue or operational decisions. Gen 2 evaluation build (2022&ndash;2023 development line). &copy; 2022&ndash;2026 Vaelon Space. All rights reserved.</p>`;
    window.print();
  });
})();
