/* ARCHIVAL start-up sequence (home page only).
   Plays once per browser session; add ?boot to the address to replay it.
   The ARCHID line reports ARCHID's real state (read-only); the other lines are presentation. */
(() => {
  "use strict";

  const root = document.documentElement;
  const boot = document.getElementById("boot");
  if (!boot || !root.classList.contains("booting")) return;

  const log = document.getElementById("bootLog");
  const bar = document.getElementById("bootBar");
  const skip = document.getElementById("bootSkip");
  let skipped = false;
  let finished = false;

  const sleep = ms => new Promise(resolve => {
    const id = setTimeout(resolve, skipped ? 0 : ms);
    if (skipped) clearTimeout(id);
  });

  function finish() {
    if (finished) return;
    finished = true;
    try { sessionStorage.setItem("archival-boot", "1"); } catch (e) { /* storage unavailable */ }
    document.removeEventListener("keydown", onKey);
    boot.classList.add("done");
    root.classList.remove("booting");
    setTimeout(() => { boot.hidden = true; boot.style.display = "none"; }, 600);
  }

  function onKey(event) {
    if (["Enter", "Escape", " "].includes(event.key)) { skipped = true; finish(); }
  }

  skip.addEventListener("click", () => { skipped = true; finish(); });
  boot.addEventListener("click", event => { if (event.target === boot) { skipped = true; finish(); } });
  document.addEventListener("keydown", onKey);

  // Waits briefly for ARCHID so the line shows its real result without stalling start-up.
  async function archidResult() {
    const limit = Date.now() + 1600;
    while (window.ARCHID && window.ARCHID.state === "starting" && Date.now() < limit && !skipped) {
      await sleep(120);
    }
    const state = window.ARCHID ? window.ARCHID.state : "offline";
    if (state === "ready") return ["LINKED", ""];
    if (state === "starting") return ["PENDING", ""];
    return ["OFFLINE", "warn"];
  }

  const STEPS = [
    { text: "FARB // CENTRAL RECORDS DATABASE", head: true },
    { text: "Starting archive system", status: "OK" },
    { text: "Reading directory index", status: "OK" },
    { text: "Mounting record collections (3)", status: "OK" },
    { text: "Checking device identity (ARCHID)", status: archidResult },
    { text: "Archive ready", head: true, status: "OPERATIONAL" }
  ];

  async function type(el, text) {
    for (let i = 1; i <= text.length && !skipped; i++) {
      el.textContent = text.slice(0, i);
      await sleep(i === 1 ? 0 : 16);
    }
    el.textContent = text;
  }

  async function run() {
    await sleep(350);
    for (let i = 0; i < STEPS.length && !skipped; i++) {
      const step = STEPS[i];
      const line = document.createElement("div");
      line.className = "boot-line" + (step.head ? " head" : "");
      const t = document.createElement("span"); t.className = "t";
      const lead = document.createElement("span"); lead.className = "lead"; lead.setAttribute("aria-hidden", "true");
      const s = document.createElement("span"); s.className = "s";
      line.append(t, lead, s);
      log.appendChild(line);
      line.classList.add("boot-cursor");
      await type(t, step.text);
      if (step.status) {
        lead.textContent = ".".repeat(60);
        await sleep(i === 0 ? 0 : 260);
        const result = typeof step.status === "function" ? await step.status() : [step.status, ""];
        s.textContent = Array.isArray(result) ? result[0] : result;
        if (Array.isArray(result) && result[1]) s.classList.add(result[1]);
      }
      line.classList.remove("boot-cursor");
      bar.style.width = Math.round(((i + 1) / STEPS.length) * 100) + "%";
      await sleep(step.head ? 220 : 120);
    }
    await sleep(650);
    finish();
  }

  run().catch(finish);
})();
