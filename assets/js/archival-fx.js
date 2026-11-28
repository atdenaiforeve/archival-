/* ARCHIVAL presentation helpers.
   Display only. It never reads or writes ARCHID, cookies, storage or any record data,
   and the site works exactly the same if this file fails to load. */
(() => {
  "use strict";

  document.documentElement.classList.add("js-fx");

  // System time readout in the top banner, as on an official records terminal.
  const banner = document.querySelector(".banner");
  if (banner && banner.lastElementChild) {
    const clock = document.createElement("span");
    clock.className = "clock";
    clock.setAttribute("aria-hidden", "true");
    banner.insertBefore(clock, banner.lastElementChild);
    const tick = () => { clock.textContent = "SYSTEM TIME " + new Date().toTimeString().slice(0, 8); };
    tick();
    setInterval(tick, 1000);
  }

  // Press / to jump to the search box on pages that have one.
  document.addEventListener("keydown", event => {
    if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
    const active = document.activeElement;
    if (active && /^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName)) return;
    const field = document.querySelector(".search input");
    if (field) { event.preventDefault(); field.focus(); }
  });
})();
