/* Motif landing, progressive enhancement only. Page is fully readable without JS. */
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- nucleotide motif strip ---------- */
  (function () {
    var el = document.getElementById("motifStrip");
    if (!el) return;
    var seq = "ATGCGTTACGATCGACTGAAACCTCGACATGCAGCTCCG";
    var cls = { A: "nt-a", T: "nt-t", G: "nt-g", C: "nt-c" };
    var frag = document.createDocumentFragment();
    for (var i = 0; i < seq.length; i++) {
      var base = seq[i];
      var s = document.createElement("span");
      s.className = "b " + (cls[base] || "");
      s.textContent = base;
      if (!reduce) s.style.animationDelay = (i * 28) + "ms";
      frag.appendChild(s);
    }
    el.appendChild(frag);
  })();

  /* ---------- scroll reveals ---------- */
  (function () {
    var items = [].slice.call(document.querySelectorAll(".reveal"));
    if (reduce || !("IntersectionObserver" in window)) {
      items.forEach(function (n) { n.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    items.forEach(function (n) { io.observe(n); });
  })();

  /* ---------- sticky nav shadow ---------- */
  (function () {
    var nav = document.getElementById("nav");
    if (!nav) return;
    var tick = function () { nav.classList.toggle("is-stuck", window.scrollY > 8); };
    tick();
    window.addEventListener("scroll", tick, { passive: true });
  })();

  /* ---------- provenance thread: draw on scroll + light stages ---------- */
  (function () {
    var track = document.querySelector(".lineage__track");
    var path = document.getElementById("threadPath");
    var stages = [].slice.call(document.querySelectorAll(".stage"));
    if (!track || !path) return;
    if (reduce) {
      path.style.strokeDasharray = "none"; path.style.strokeDashoffset = "0";
      stages.forEach(function (s) { s.classList.add("is-lit"); });
      return;
    }
    var len = 1000;
    try { len = path.getTotalLength() || 1000; } catch (e) {}
    path.parentNode.style.setProperty("--len", len);
    path.style.strokeDasharray = len; path.style.strokeDashoffset = len;
    var ticking = false;
    function update() {
      ticking = false;
      var vh = window.innerHeight || document.documentElement.clientHeight;
      var refY = vh * 0.66;
      var r = track.getBoundingClientRect();
      var p = (refY - r.top) / (r.height || 1);
      if (p < 0) p = 0; else if (p > 1) p = 1;
      path.style.strokeDashoffset = len * (1 - p);
      for (var i = 0; i < stages.length; i++) {
        var node = stages[i].querySelector(".stage__node");
        var nr = node.getBoundingClientRect();
        stages[i].classList.toggle("is-lit", (nr.top + nr.height / 2) < refY + 6);
      }
    }
    function onScroll() { if (!ticking) { ticking = true; window.requestAnimationFrame(update); } }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();
  })();

  /* ---------- mount ambient background fields ---------- */
  (function () {
    if (!window.MotifAmbient || typeof window.MotifAmbient.mount !== "function") return;
    document.querySelectorAll(".ambient-host[data-ambient]").forEach(function (host) {
      var theme = host.getAttribute("data-ambient") === "dark" ? "dark" : "light";
      try { window.MotifAmbient.mount(host, { theme: theme, density: theme === "dark" ? 1.0 : 0.8 }); } catch (e) {}
    });
  })();

  /* ---------- mount live viz widgets (clear fallback only if the widget is present) ---------- */
  function mountViz(id, api, opts) {
    var el = document.getElementById(id);
    if (!el) return;
    var g = window[api];
    if (!g || typeof g.mount !== "function") return; /* keep the fallback image */
    el.innerHTML = "";
    try { g.mount(el, opts || {}); }
    catch (e) { el.innerHTML = '<p class="mono" style="color:var(--ink-4);font-size:.8rem">visualization unavailable</p>'; }
  }
  mountViz("plasmid-map", "MotifPlasmid", {});
  mountViz("codon-strip", "MotifCodons", {});

  /* ---------- accordion (single-open) ---------- */
  (function () {
    document.querySelectorAll(".accordion").forEach(function (acc) {
      var items = [].slice.call(acc.querySelectorAll(".acc"));
      function heightFor(item) { return item.querySelector(".acc__inner").offsetHeight; }
      function setOpen(item, open, animate) {
        var btn = item.querySelector(".acc__btn");
        var panel = item.querySelector(".acc__panel");
        item.classList.toggle("is-open", open);
        btn.setAttribute("aria-expanded", open ? "true" : "false");
        if (!animate) { var pt = panel.style.transition; panel.style.transition = "none"; panel.style.height = open ? heightFor(item) + "px" : "0px"; panel.offsetHeight; panel.style.transition = pt; return; }
        panel.style.height = open ? heightFor(item) + "px" : "0px";
      }
      items.forEach(function (item) {
        var btn = item.querySelector(".acc__btn");
        setOpen(item, item.classList.contains("is-open"), false);
        btn.addEventListener("click", function () {
          var willOpen = !item.classList.contains("is-open");
          items.forEach(function (o) { if (o !== item) setOpen(o, false, true); });
          setOpen(item, willOpen, true);
        });
      });
      window.addEventListener("resize", function () {
        items.forEach(function (item) { if (item.classList.contains("is-open")) item.querySelector(".acc__panel").style.height = heightFor(item) + "px"; });
      }, { passive: true });
    });
  })();

  /* ---------- tabs (quick start) ---------- */
  (function () {
    var root = document.getElementById("startTabs");
    if (!root) return;
    var tabs = [].slice.call(root.querySelectorAll('[role="tab"]'));
    function select(tab) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute("aria-controls"));
        if (!panel) return;
        panel.classList.toggle("is-active", on);
        if (on) panel.removeAttribute("hidden"); else panel.setAttribute("hidden", "");
      });
    }
    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { select(tab); });
      tab.addEventListener("keydown", function (e) {
        var n = null;
        if (e.key === "ArrowRight") n = tabs[(i + 1) % tabs.length];
        else if (e.key === "ArrowLeft") n = tabs[(i - 1 + tabs.length) % tabs.length];
        if (n) { e.preventDefault(); select(n); n.focus(); }
      });
    });
  })();
})();
