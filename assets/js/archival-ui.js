/* ARCHIVAL interface helpers.
   Read-only companion to archid.js: it only displays ARCHID's state in the
   sidebar chip. It never creates, reads or writes identity, cookies or progress. */
(() => {
  "use strict";

  // Keep the current section visible in the scrolling mobile navigation.
  const current = document.querySelector('.nav a[aria-current="page"]');
  if (current && current.scrollIntoView) {
    const nav = current.parentElement;
    if (nav.scrollWidth > nav.clientWidth) nav.scrollLeft = current.offsetLeft - 12;
  }

  const chip = document.querySelector("[data-archid-chip]");
  if (!chip) return;
  const dot = chip.querySelector(".dot");
  const label = chip.querySelector("[data-archid-label]");

  const STATES = {
    starting: ["Connecting", ""],
    ready: ["Device linked", "ok"],
    offline: ["Offline", "warn"],
    revoked: ["Device removed", "warn"]
  };

  function paint(state) {
    const entry = STATES[state] || STATES.starting;
    label.textContent = entry[0];
    dot.className = "dot" + (entry[1] ? " " + entry[1] : "");
  }

  if (!window.ARCHID) {
    label.textContent = "Not available";
    dot.className = "dot warn";
    return;
  }

  paint(window.ARCHID.state);
  window.addEventListener("archid-state", event => paint(event.detail && event.detail.state));
})();
