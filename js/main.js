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
    }, { rootMargin: "0px 0px 25% 0px", threshold: 0 });
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

  /* ---------- mount ambient background fields ---------- */
  (function () {
    if (!window.MotifAmbient || typeof window.MotifAmbient.mount !== "function") return;
    document.querySelectorAll(".ambient-host[data-ambient]").forEach(function (host) {
      var theme = host.getAttribute("data-ambient") === "dark" ? "dark" : "light";
      try { window.MotifAmbient.mount(host, { theme: theme, density: theme === "dark" ? 1.0 : 0.8 }); } catch (e) {}
    });
  })();
})();
