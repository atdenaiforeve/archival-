/* ARCHIVAL visual effects.
   Presentation only. It never reads or writes ARCHID, cookies, storage or any record data,
   and the site works exactly the same if this file fails to load. */
(() => {
  "use strict";

  const root = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const make = (tag, cls, parent) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (parent) parent.appendChild(node);
    return node;
  };

  root.classList.add("js-fx");

  // Waits until the home-page start-up sequence has finished (no-op on other pages).
  function afterBoot(fn) {
    if (!root.classList.contains("booting")) { fn(); return; }
    const watcher = new MutationObserver(() => {
      if (!root.classList.contains("booting")) { watcher.disconnect(); fn(); }
    });
    watcher.observe(root, { attributes: true, attributeFilter: ["class"] });
  }

  /* ---------- Background: drifting node network ---------- */
  (function network() {
    const canvas = make("canvas", "fx-canvas", document.body);
    canvas.setAttribute("aria-hidden", "true");
    const ctx = canvas.getContext && canvas.getContext("2d");
    if (!ctx) return;

    let w = 0, h = 0, points = [], raf = 0;
    const mouse = { x: -9999, y: -9999 };

    function spawn() {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.12 + Math.random() * 0.3;
      return { x: Math.random() * w, y: Math.random() * h, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, r: 0.8 + Math.random() * 1.5, red: Math.random() < 0.05 };
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const target = Math.round(Math.min(90, Math.max(24, (w * h) / 22000)));
      while (points.length < target) points.push(spawn());
      points.length = target;
      if (reduce) draw(false);
    }

    function draw(move) {
      ctx.clearRect(0, 0, w, h);
      const linkDist = 150, linkSq = linkDist * linkDist;
      for (const p of points) {
        if (move) {
          p.x += p.vx; p.y += p.vy;
          if (p.x < -12) p.x = w + 12; else if (p.x > w + 12) p.x = -12;
          if (p.y < -12) p.y = h + 12; else if (p.y > h + 12) p.y = -12;
        }
      }
      for (let i = 0; i < points.length; i++) {
        const a = points[i];
        for (let j = i + 1; j < points.length; j++) {
          const b = points[j];
          const dx = a.x - b.x, dy = a.y - b.y, d = dx * dx + dy * dy;
          if (d < linkSq) {
            ctx.strokeStyle = "rgba(88,180,176," + ((1 - d / linkSq) * 0.22).toFixed(3) + ")";
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        const mx = a.x - mouse.x, my = a.y - mouse.y, md = mx * mx + my * my;
        if (md < 190 * 190) {
          ctx.strokeStyle = "rgba(127,240,232," + ((1 - md / (190 * 190)) * 0.45).toFixed(3) + ")";
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      }
      for (const p of points) {
        ctx.fillStyle = p.red ? "rgba(213,143,137,.85)" : "rgba(143,211,207,.65)";
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
    }

    function loop() { draw(true); raf = requestAnimationFrame(loop); }

    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("pointermove", e => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
    document.addEventListener("pointerleave", () => { mouse.x = mouse.y = -9999; });
    document.addEventListener("visibilitychange", () => {
      cancelAnimationFrame(raf);
      if (!document.hidden && !reduce) loop();
    });
    resize();
    if (!reduce) loop();
  })();

  make("div", "fx-beam", document.body).setAttribute("aria-hidden", "true");
  const spot = make("div", "fx-spot", document.body);
  spot.setAttribute("aria-hidden", "true");

  /* ---------- Pointer: spotlight, reticle ring, folder tilt ---------- */
  if (finePointer && !reduce) {
    const ring = make("div", "fx-ring off", document.body);
    const dot = make("div", "fx-dot", document.body);
    ring.setAttribute("aria-hidden", "true"); dot.setAttribute("aria-hidden", "true");
    let tx = 0, ty = 0, rx = 0, ry = 0, running = false;

    function follow() {
      rx += (tx - rx) * 0.2; ry += (ty - ry) * 0.2;
      ring.style.transform = "translate(" + rx.toFixed(1) + "px," + ry.toFixed(1) + "px)";
      if (Math.abs(tx - rx) + Math.abs(ty - ry) > 0.3) requestAnimationFrame(follow); else running = false;
    }

    window.addEventListener("pointermove", e => {
      tx = e.clientX; ty = e.clientY;
      dot.style.transform = "translate(" + tx + "px," + ty + "px)";
      ring.classList.remove("off");
      root.style.setProperty("--mx", tx + "px");
      root.style.setProperty("--my", ty + "px");
      const target = e.target;
      ring.classList.toggle("hot", !!(target.closest && target.closest("a, button, .folder, .tx-row, .ev-card, input, [role='button']")));
      if (!running) { running = true; requestAnimationFrame(follow); }
    }, { passive: true });
    document.addEventListener("pointerleave", () => ring.classList.add("off"));

    $$(".folder").forEach(card => {
      card.addEventListener("pointermove", e => {
        const box = card.getBoundingClientRect();
        const px = (e.clientX - box.left) / box.width, py = (e.clientY - box.top) / box.height;
        card.style.setProperty("--ry", ((px - 0.5) * 9).toFixed(2) + "deg");
        card.style.setProperty("--rx", ((0.5 - py) * 9).toFixed(2) + "deg");
        card.style.setProperty("--gx", (px * 100).toFixed(1) + "%");
        card.style.setProperty("--gy", (py * 100).toFixed(1) + "%");
      });
      card.addEventListener("pointerleave", () => {
        card.style.setProperty("--rx", "0deg"); card.style.setProperty("--ry", "0deg");
      });
    });
  }

  /* ---------- Banner clock and ticker ---------- */
  const banner = $(".banner");
  if (banner) {
    const clock = make("span", "clock");
    banner.insertBefore(clock, banner.lastElementChild);
    const tick = () => { clock.textContent = new Date().toTimeString().slice(0, 8) + " LOCAL"; };
    tick();
    setInterval(tick, 1000);

    const ticker = make("div", "ticker");
    ticker.setAttribute("aria-hidden", "true");
    const track = make("div", "ticker-track", ticker);
    const items = ["RESTRICTED ARCHIVE", "AUTHORISED ACCESS ONLY", "HANDLE ACCORDING TO CLASSIFICATION", "UNAUTHORISED ALTERATION OF RECORDS IS PROHIBITED"];
    const half = () => {
      const span = make("span", "", track);
      for (let r = 0; r < 3; r++) {
        items.forEach(text => {
          span.appendChild(document.createTextNode(text));
          make("b", "sep", span).textContent = "◆";
        });
      }
    };
    half(); half();
    banner.after(ticker);
  }

  /* ---------- Headline decode ---------- */
  const GLYPHS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&/<>=+";
  function decode(node, duration) {
    const text = node.textContent;
    if (!text.trim()) return Promise.resolve();
    const box = node.getBoundingClientRect();
    node.style.minHeight = box.height + "px";
    node.textContent = "";
    const hidden = make("span", "sr-only", node); hidden.textContent = text;
    const shown = make("span", "", node); shown.setAttribute("aria-hidden", "true");
    return new Promise(resolve => {
      const start = performance.now();
      (function step(now) {
        const t = Math.min(1, (now - start) / duration);
        const locked = Math.floor(t * text.length);
        let out = "";
        for (let i = 0; i < text.length; i++) {
          const ch = text[i];
          out += (i < locked || ch === " " || /[^A-Za-z0-9]/.test(ch)) ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }
        shown.textContent = out;
        if (t < 1) requestAnimationFrame(step);
        else { shown.textContent = text; node.style.minHeight = ""; resolve(); }
      })(start);
    });
  }

  afterBoot(() => {
    const title = $("h1");
    const label = $(".record-no");
    if (!reduce) {
      if (label) decode(label, 700);
      if (title) {
        decode(title, 900).then(() => {
          setInterval(() => {
            title.classList.add("glitch");
            setTimeout(() => title.classList.remove("glitch"), 450);
          }, 7000 + Math.random() * 3000);
        });
      }
    }

    /* ---------- Count-up numbers ---------- */
    $$(".f-meta strong").forEach(node => {
      const finalValue = parseInt(node.textContent, 10);
      if (reduce || !/^\d+$/.test(node.textContent.trim())) return;
      const start = performance.now();
      node.textContent = "0";
      (function step(now) {
        const t = Math.min(1, (now - start) / 1100);
        node.textContent = String(Math.round(finalValue * (1 - Math.pow(1 - t, 3))));
        if (t < 1) requestAnimationFrame(step);
      })(start);
    });

    /* ---------- Reveal on scroll ---------- */
    if (reduce || !("IntersectionObserver" in window)) return;
    const targets = $$(".folder, .control, .section-head, .viewer, .notice, .panel, .deck, .evidence-grid > *, .file-row, .viewer-empty, .btn-row, .pulse");
    const seen = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const node = entry.target;
        seen.unobserve(node);
        node.classList.add("in");
        // Hand control back to the element's own transitions once the entrance is over.
        setTimeout(() => node.classList.remove("reveal", "in"), 1200);
      });
    }, { threshold: 0.08 });
    targets.forEach((node, i) => {
      node.classList.add("reveal");
      node.style.setProperty("--d", Math.min(i % 8, 7) * 70 + "ms");
      seen.observe(node);
    });
  });

  /* ---------- Page transition between pages ---------- */
  if (!reduce) {
    document.addEventListener("click", e => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = e.target.closest && e.target.closest("a[href]");
      if (!link || link.target || link.hasAttribute("download")) return;
      const url = new URL(link.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return;
      e.preventDefault();
      root.classList.add("leaving");
      setTimeout(() => { location.href = link.href; }, 210);
    });
    window.addEventListener("pageshow", () => root.classList.remove("leaving"));
  }

  /* ---------- Press / to jump to the search box ---------- */
  document.addEventListener("keydown", e => {
    if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement && document.activeElement.tagName)) return;
    const field = $(".search input");
    if (field) { e.preventDefault(); field.focus(); }
  });
})();
