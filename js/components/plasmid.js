(function () {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";
  const TOTAL_BP = 2686;
  const CENTER = 320;
  const RING_RADIUS = 184;
  const FEATURE_RADIUS = 158;
  const instances = new WeakMap();
  let instanceCount = 0;

  const FEATURES = [
    { id: "amp", name: "AmpR (bla)", short: "AmpR (bla)", start: 1626, end: 2486, color: "#C0603C", deep: "#A6482A", strand: "reverse (−)", label: [72, 256], anchor: "start" },
    { id: "lacz", name: "lacZα", short: "lacZα", start: 146, end: 469, color: "#6E90AE", deep: "#4D6E8C", strand: "reverse (−)", label: [518, 102], anchor: "start" },
    { id: "ori", name: "pMB1 ori", short: "pMB1 ori", start: 867, end: 1455, color: "#7F9270", deep: "#5E7350", strand: "reverse (−)", label: [506, 495], anchor: "start" },
    { id: "mcs", name: "MCS", short: "MCS", start: 396, end: 452, color: "#C79A44", deep: "#9E762F", strand: "reverse (−)", enzymes: ["EcoRI 396", "BamHI 417", "SalI 429", "PstI 439", "HindIII 447"], label: [554, 264], anchor: "start" }
  ];

  const SITES = [
    { name: "NdeI", bp: 184, radius: 222 },
    { name: "AflIII", bp: 806, radius: 222 }
  ];

  // pUC19 MCS unique cutters sit within ~7 degrees of arc, too close to label
  // individually, so they render as ticks plus one grouped callout on the MCS feature.
  const MCS_SITES = [
    { name: "EcoRI", bp: 396 },
    { name: "BamHI", bp: 417 },
    { name: "SalI", bp: 429 },
    { name: "PstI", bp: 439 },
    { name: "HindIII", bp: 447 }
  ];

  function svgEl(tag, attrs) {
    const node = document.createElementNS(NS, tag);
    Object.entries(attrs || {}).forEach(([key, value]) => node.setAttribute(key, value));
    return node;
  }

  function pointForBp(bp, radius) {
    const angle = (bp / TOTAL_BP) * Math.PI * 2 - Math.PI / 2;
    return {
      x: CENTER + radius * Math.cos(angle),
      y: CENTER + radius * Math.sin(angle),
      degrees: (bp / TOTAL_BP) * 360 - 90
    };
  }

  function arcPath(start, end, radius) {
    const a = pointForBp(start, radius);
    const b = pointForBp(end, radius);
    const span = ((end - start + TOTAL_BP) % TOTAL_BP) || TOTAL_BP;
    const largeArc = span > TOTAL_BP / 2 ? 1 : 0;
    return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${radius} ${radius} 0 ${largeArc} 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
  }

  function setCounterRotation(nodes, angle) {
    nodes.forEach((node) => {
      const x = node.dataset.cx;
      const y = node.dataset.cy;
      const base = Number(node.dataset.baseAngle || 0);
      node.setAttribute("transform", `rotate(${(base - angle).toFixed(3)} ${x} ${y})`);
    });
  }

  function injectStyles() {
    if (document.getElementById("motif-plasmid-styles")) return;
    const style = document.createElement("style");
    style.id = "motif-plasmid-styles";
    style.textContent = `
      .mpm-root {
        --mpm-ink: #1F1E1D;
        --mpm-ink-2: #46433D;
        --mpm-ink-3: #6B6459;
        --mpm-cream: #FAF9F5;
        --mpm-paper: #FFFFFF;
        --mpm-line: rgba(31,30,29,0.12);
        position: relative;
        width: 100%;
        height: 100%;
        min-width: 280px;
        min-height: 280px;
        isolation: isolate;
        color: var(--mpm-ink);
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
      }
      .mpm-svg { display: block; width: 100%; height: 100%; overflow: visible; }
      .mpm-empty-hit { fill: transparent; }
      .mpm-ring { fill: none; stroke: var(--mpm-line); stroke-width: 1.5; vector-effect: non-scaling-stroke; }
      .mpm-ring-inner { fill: none; stroke: rgba(31,30,29,0.045); stroke-width: 1; stroke-dasharray: 1.5 7; vector-effect: non-scaling-stroke; }
      .mpm-major-tick { stroke: rgba(31,30,29,0.32); stroke-width: 1.25; vector-effect: non-scaling-stroke; }
      .mpm-minor-tick { stroke: rgba(31,30,29,0.14); stroke-width: 1; vector-effect: non-scaling-stroke; }
      .mpm-bp-label, .mpm-site-label {
        fill: var(--mpm-ink-3);
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 9px;
        letter-spacing: .02em;
      }
      .mpm-bp-label { font-size: 9.5px; }
      .mpm-site-tick { stroke: var(--mpm-ink-2); stroke-width: 1; vector-effect: non-scaling-stroke; }
      .mpm-site-guide { fill: none; stroke: rgba(31,30,29,0.14); stroke-width: 1; vector-effect: non-scaling-stroke; }
      .mpm-feature-leader { fill: none; stroke: var(--mpm-line); stroke-width: 1; vector-effect: non-scaling-stroke; }
      .mpm-feature-dot { stroke: var(--mpm-cream); stroke-width: 2; vector-effect: non-scaling-stroke; }
      .mpm-feature-label {
        fill: var(--mpm-ink-2);
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 11.5px;
        font-weight: 520;
        letter-spacing: .015em;
        transition: opacity 220ms ease, font-weight 220ms ease, fill 220ms ease;
      }
      .mpm-feature-range {
        fill: var(--mpm-ink-3);
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 8px;
        font-weight: 400;
        letter-spacing: .04em;
      }
      .mpm-feature-focus, .mpm-feature-visual, .mpm-feature-hit {
        fill: none;
        stroke-linecap: round;
        stroke-linejoin: round;
        vector-effect: non-scaling-stroke;
      }
      .mpm-feature-focus { stroke: var(--mpm-ink); stroke-width: 22; opacity: 0; transition: opacity 150ms ease; }
      .mpm-feature-visual {
        stroke: var(--feature-color);
        stroke-width: 14;
        transition: stroke 200ms ease, stroke-width 200ms cubic-bezier(0.22,0.61,0.36,1), opacity 220ms ease;
      }
      .mpm-feature-hit { stroke: transparent; stroke-width: 30; cursor: pointer; pointer-events: stroke; outline: none; }
      .mpm-feature-group.is-active .mpm-feature-visual,
      .mpm-feature-group.is-selected .mpm-feature-visual { stroke: var(--feature-deep); stroke-width: 17; }
      .mpm-feature-group.is-active .mpm-feature-label,
      .mpm-feature-group.is-selected .mpm-feature-label { fill: var(--mpm-ink); font-weight: 700; }
      .mpm-feature-group.is-muted .mpm-feature-visual,
      .mpm-feature-group.is-muted .mpm-feature-label,
      .mpm-feature-group.is-muted .mpm-feature-leader,
      .mpm-feature-group.is-muted .mpm-feature-dot { opacity: .32; }
      .mpm-feature-group:focus-within .mpm-feature-focus { opacity: .72; }
      .mpm-feature-group:focus-within .mpm-feature-visual { stroke-width: 16; }
      .mpm-feature-hit:focus-visible { outline: none; }
      .mpm-center-kicker {
        fill: var(--mpm-ink-3);
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 8.5px;
        letter-spacing: .18em;
        text-transform: uppercase;
      }
      .mpm-center-title {
        fill: var(--mpm-ink);
        font-family: Georgia, "Times New Roman", serif;
        font-size: 21px;
        letter-spacing: -.01em;
      }
      .mpm-center-rule { stroke: var(--mpm-line); stroke-width: 1; vector-effect: non-scaling-stroke; }
      .mpm-center-sub {
        fill: var(--mpm-ink-3);
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 8.5px;
        letter-spacing: .08em;
      }
      .mpm-tooltip {
        position: absolute;
        z-index: 4;
        max-width: 230px;
        padding: 8px 10px;
        border: 1px solid rgba(31,30,29,0.1);
        border-radius: 7px;
        background: rgba(255,255,255,.96);
        box-shadow: 0 9px 24px rgba(31,30,29,.09);
        color: var(--mpm-ink-2);
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 9.5px;
        line-height: 1.4;
        letter-spacing: .015em;
        pointer-events: none;
        opacity: 0;
        transform: translate(-50%, -50%) scale(.97);
        transition: opacity 140ms ease, transform 180ms cubic-bezier(0.22,0.61,0.36,1);
        white-space: nowrap;
      }
      .mpm-tooltip.is-visible { opacity: 1; transform: translate(-50%, -50%) scale(1); }
      .mpm-info-card {
        position: absolute;
        z-index: 3;
        left: 50%;
        top: 53.5%;
        width: 174px;
        padding: 11px 12px 10px;
        border: 1px solid rgba(31,30,29,.1);
        border-radius: 9px;
        background: rgba(250,249,245,.94);
        box-shadow: 0 10px 30px rgba(31,30,29,.06);
        transform: translate(-50%, -42%) scale(.97);
        opacity: 0;
        pointer-events: none;
        transition: opacity 180ms ease, transform 240ms cubic-bezier(0.22,0.61,0.36,1);
      }
      .mpm-info-card.is-visible { opacity: 1; transform: translate(-50%, -50%) scale(1); pointer-events: auto; }
      .mpm-info-head { display: flex; align-items: center; gap: 7px; margin-bottom: 8px; }
      .mpm-info-swatch { width: 7px; height: 7px; flex: 0 0 auto; border-radius: 50%; background: var(--card-color); }
      .mpm-info-name { overflow: hidden; color: var(--mpm-ink); font-family: Georgia, "Times New Roman", serif; font-size: 14px; line-height: 1; text-overflow: ellipsis; white-space: nowrap; }
      .mpm-info-grid { display: grid; grid-template-columns: auto 1fr; gap: 3px 9px; margin: 0; }
      .mpm-info-grid dt, .mpm-info-grid dd { margin: 0; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 8px; line-height: 1.35; }
      .mpm-info-grid dt { color: var(--mpm-ink-3); text-transform: uppercase; letter-spacing: .08em; }
      .mpm-info-grid dd { color: var(--mpm-ink-2); text-align: right; }
      .mpm-root:not(.is-ready) .mpm-feature-visual { stroke-dasharray: var(--path-length); stroke-dashoffset: var(--path-length); }
      .mpm-root.is-ready .mpm-feature-visual { animation: mpm-draw 700ms cubic-bezier(0.22,0.61,0.36,1) var(--draw-delay) both; }
      .mpm-root:not(.is-ready) .mpm-tick-layer { opacity: 0; }
      .mpm-root.is-ready .mpm-tick-layer { animation: mpm-fade 600ms ease 280ms both; }
      .mpm-root[data-running="false"] .mpm-feature-visual,
      .mpm-root[data-running="false"] .mpm-tick-layer { animation-play-state: paused !important; }
      @keyframes mpm-draw { from { stroke-dasharray: var(--path-length); stroke-dashoffset: var(--path-length); } to { stroke-dasharray: var(--path-length); stroke-dashoffset: 0; } }
      @keyframes mpm-fade { from { opacity: 0; } to { opacity: 1; } }
      @media (prefers-reduced-motion: reduce) {
        .mpm-root *, .mpm-root *::before, .mpm-root *::after { animation-duration: .001ms !important; animation-delay: 0ms !important; transition-duration: .001ms !important; }
        .mpm-feature-visual { stroke-dashoffset: 0 !important; }
        .mpm-tick-layer { opacity: 1 !important; }
      }
    `;
    document.head.appendChild(style);
  }

  function mount(elOrId, options) {
    const target = typeof elOrId === "string" ? document.getElementById(elOrId) : elOrId;
    if (!target || target.nodeType !== 1) throw new Error("MotifPlasmid.mount: target element not found");
    if (instances.has(target)) instances.get(target).destroy();

    injectStyles();
    const opts = options || {};
    const uid = `mpm-${++instanceCount}`;
    const root = document.createElement("div");
    root.className = "mpm-root";
    root.dataset.running = "true";

    const svg = svgEl("svg", {
      class: "mpm-svg",
      viewBox: "0 0 640 640",
      role: "group",
      "aria-labelledby": `${uid}-title ${uid}-desc`
    });
    const title = svgEl("title", { id: `${uid}-title` });
    title.textContent = "Interactive circular map of the pUC19 plasmid";
    const desc = svgEl("desc", { id: `${uid}-desc` });
    desc.textContent = "A 2,686 base pair plasmid map. Tab to a sequence feature and press Enter to select it.";
    svg.append(title, desc, svgEl("rect", { class: "mpm-empty-hit", x: "0", y: "0", width: "640", height: "640" }));

    const orbit = svgEl("g", { class: "mpm-orbit" });
    orbit.append(
      svgEl("circle", { class: "mpm-ring-inner", cx: CENTER, cy: CENTER, r: FEATURE_RADIUS }),
      svgEl("circle", { class: "mpm-ring", cx: CENTER, cy: CENTER, r: RING_RADIUS })
    );

    const tickLayer = svgEl("g", { class: "mpm-tick-layer" });
    for (let bp = 0; bp < TOTAL_BP; bp += 100) {
      const major = bp % 500 === 0;
      const p1 = pointForBp(bp, major ? 177 : 180);
      const p2 = pointForBp(bp, major ? 193 : 188);
      tickLayer.appendChild(svgEl("line", {
        class: major ? "mpm-major-tick" : "mpm-minor-tick",
        x1: p1.x.toFixed(2), y1: p1.y.toFixed(2), x2: p2.x.toFixed(2), y2: p2.y.toFixed(2)
      }));
      if (major && bp <= 2500) {
        const lp = pointForBp(bp, 208);
        const label = svgEl("text", {
          class: "mpm-bp-label",
          x: lp.x.toFixed(2), y: (lp.y + 3).toFixed(2),
          "text-anchor": "middle",
          "data-counter": "",
          "data-cx": lp.x.toFixed(2), "data-cy": lp.y.toFixed(2)
        });
        label.textContent = bp === 0 ? "0 bp" : bp.toLocaleString();
        tickLayer.appendChild(label);
      }
    }
    orbit.appendChild(tickLayer);

    const siteLayer = svgEl("g", { class: "mpm-site-layer mpm-tick-layer" });
    SITES.forEach((site) => {
      const inside = pointForBp(site.bp, 177);
      const outside = pointForBp(site.bp, 193);
      const labelPoint = pointForBp(site.bp, site.radius);
      const siteAngle = pointForBp(site.bp, 1).degrees;
      const guideEnd = pointForBp(site.bp, site.radius - 7);
      siteLayer.append(
        svgEl("line", { class: "mpm-site-tick", x1: inside.x.toFixed(2), y1: inside.y.toFixed(2), x2: outside.x.toFixed(2), y2: outside.y.toFixed(2) }),
        svgEl("line", { class: "mpm-site-guide", x1: outside.x.toFixed(2), y1: outside.y.toFixed(2), x2: guideEnd.x.toFixed(2), y2: guideEnd.y.toFixed(2) })
      );
      const label = svgEl("text", {
        class: "mpm-site-label",
        x: labelPoint.x.toFixed(2), y: labelPoint.y.toFixed(2),
        "text-anchor": "middle",
        "dominant-baseline": "middle",
        "data-counter": "",
        "data-cx": labelPoint.x.toFixed(2), "data-cy": labelPoint.y.toFixed(2),
        "data-base-angle": (siteAngle + 90).toFixed(2)
      });
      label.textContent = `${site.name} · ${site.bp}`;
      siteLayer.appendChild(label);
    });
    MCS_SITES.forEach((site) => {
      const inside = pointForBp(site.bp, 177);
      const outside = pointForBp(site.bp, 190);
      siteLayer.appendChild(svgEl("line", {
        class: "mpm-site-tick", x1: inside.x.toFixed(2), y1: inside.y.toFixed(2), x2: outside.x.toFixed(2), y2: outside.y.toFixed(2)
      }));
    });
    orbit.appendChild(siteLayer);

    const featureNodes = new Map();
    FEATURES.forEach((feature, index) => {
      const group = svgEl("g", { class: "mpm-feature-group", "data-feature": feature.id });
      group.style.setProperty("--feature-color", feature.color);
      group.style.setProperty("--feature-deep", feature.deep);
      const d = arcPath(feature.start, feature.end, FEATURE_RADIUS);
      const focusPath = svgEl("path", { class: "mpm-feature-focus", d });
      const visualPath = svgEl("path", { class: "mpm-feature-visual", d });
      visualPath.style.setProperty("--draw-delay", `${90 + index * 115}ms`);
      const hitPath = svgEl("path", {
        class: "mpm-feature-hit", d, tabindex: "0", role: "button",
        "aria-label": `${feature.name}, ${feature.start} to ${feature.end}, ${feature.end - feature.start} base pairs, ${feature.strand} strand. Press Enter to select.`
      });
      const mid = feature.start + (feature.end - feature.start) / 2;
      const leadStart = pointForBp(mid, 167);
      const leadOuter = pointForBp(mid, 199);
      const [lx, ly] = feature.label;
      const elbowX = feature.anchor === "end" ? lx + 10 : lx - 10;
      const leader = svgEl("path", {
        class: "mpm-feature-leader",
        d: `M ${leadStart.x.toFixed(2)} ${leadStart.y.toFixed(2)} L ${leadOuter.x.toFixed(2)} ${leadOuter.y.toFixed(2)} L ${elbowX} ${ly}`
      });
      const dot = svgEl("circle", { class: "mpm-feature-dot", cx: leadStart.x.toFixed(2), cy: leadStart.y.toFixed(2), r: "3", fill: feature.color });
      const label = svgEl("text", {
        class: "mpm-feature-label", x: lx, y: ly,
        "text-anchor": feature.anchor,
        "data-counter": "", "data-cx": lx, "data-cy": ly
      });
      const labelName = svgEl("tspan", { x: lx, dy: "0" });
      labelName.textContent = feature.short;
      const labelRange = svgEl("tspan", { class: "mpm-feature-range", x: lx, dy: "12" });
      labelRange.textContent = `${feature.start}-${feature.end}`;
      label.append(labelName, labelRange);
      if (feature.enzymes) {
        feature.enzymes.forEach((txt) => {
          const enzyme = svgEl("tspan", { class: "mpm-feature-range mpm-feature-enzyme", x: lx, dy: "13" });
          enzyme.textContent = txt;
          label.append(enzyme);
        });
      }
      group.append(focusPath, visualPath, leader, dot, label, hitPath);
      orbit.appendChild(group);
      featureNodes.set(feature.id, { group, visualPath, hitPath, feature });
    });
    svg.appendChild(orbit);

    const centerLayer = svgEl("g", { class: "mpm-center" });
    const kicker = svgEl("text", { class: "mpm-center-kicker", x: CENTER, y: "287", "text-anchor": "middle" });
    kicker.textContent = "CIRCULAR DNA";
    const centerTitle = svgEl("text", { class: "mpm-center-title", x: CENTER, y: "313", "text-anchor": "middle" });
    centerTitle.textContent = "pUC19 · 2,686 bp";
    const centerRule = svgEl("line", { class: "mpm-center-rule", x1: "287", y1: "326", x2: "353", y2: "326" });
    const centerSub = svgEl("text", { class: "mpm-center-sub", x: CENTER, y: "345", "text-anchor": "middle" });
    centerSub.textContent = "ILLUSTRATIVE MAP";
    centerLayer.append(kicker, centerTitle, centerRule, centerSub);
    svg.appendChild(centerLayer);

    const tooltip = document.createElement("div");
    tooltip.className = "mpm-tooltip";
    tooltip.setAttribute("role", "status");
    tooltip.setAttribute("aria-hidden", "true");

    const card = document.createElement("aside");
    card.className = "mpm-info-card";
    card.setAttribute("aria-live", "polite");
    card.setAttribute("aria-hidden", "true");
    card.innerHTML = `<div class="mpm-info-head"><span class="mpm-info-swatch"></span><span class="mpm-info-name"></span></div><dl class="mpm-info-grid"><dt>span</dt><dd data-field="span"></dd><dt>length</dt><dd data-field="length"></dd><dt>strand</dt><dd data-field="strand"></dd></dl>`;

    root.append(svg, tooltip, card);
    target.replaceChildren(root);

    featureNodes.forEach(({ visualPath }) => {
      const length = visualPath.getTotalLength().toFixed(2);
      visualPath.style.setProperty("--path-length", length);
    });

    let selectedId = null;
    let transientId = null;
    let angle = 0;
    let rafId = 0;
    let lastTime = 0;
    let isIntersecting = true;
    let isHoveringMap = false;
    let hasFocusWithin = false;
    let destroyed = false;
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const rotationMs = Math.max(30000, Number(opts.rotationSeconds || 90) * 1000);
    const counterNodes = Array.from(orbit.querySelectorAll("[data-counter]"));
    setCounterRotation(counterNodes, angle);

    function activeIds() {
      const ids = new Set();
      if (selectedId) ids.add(selectedId);
      if (transientId) ids.add(transientId);
      return ids;
    }

    function refreshFeatureState() {
      const active = activeIds();
      featureNodes.forEach(({ group }, id) => {
        group.classList.toggle("is-active", id === transientId);
        group.classList.toggle("is-selected", id === selectedId);
        group.classList.toggle("is-muted", active.size > 0 && !active.has(id));
      });
    }

    function positionTooltip(node) {
      const rootRect = root.getBoundingClientRect();
      const pathRect = node.getBoundingClientRect();
      const scaleX = rootRect.width / 640;
      let x = pathRect.left + pathRect.width / 2 - rootRect.left;
      let y = pathRect.top + pathRect.height / 2 - rootRect.top;
      const dx = x - rootRect.width / 2;
      const dy = y - rootRect.height / 2;
      const length = Math.hypot(dx, dy) || 1;
      x += (dx / length) * 36 * scaleX;
      y += (dy / length) * 36 * scaleX;
      x = Math.max(100, Math.min(rootRect.width - 100, x));
      y = Math.max(34, Math.min(rootRect.height - 34, y));
      tooltip.style.left = `${x}px`;
      tooltip.style.top = `${y}px`;
    }

    function showTooltip(id) {
      const entry = featureNodes.get(id);
      if (!entry) return;
      const f = entry.feature;
      tooltip.textContent = `${f.name} · ${f.start}-${f.end} · ${f.end - f.start} bp`;
      positionTooltip(entry.visualPath);
      tooltip.classList.add("is-visible");
      tooltip.setAttribute("aria-hidden", "false");
    }

    function hideTooltip() {
      tooltip.classList.remove("is-visible");
      tooltip.setAttribute("aria-hidden", "true");
    }

    function renderCard() {
      const entry = selectedId && featureNodes.get(selectedId);
      if (!entry) {
        card.classList.remove("is-visible");
        card.setAttribute("aria-hidden", "true");
        centerLayer.style.opacity = "1";
        return;
      }
      const f = entry.feature;
      card.style.setProperty("--card-color", f.color);
      card.querySelector(".mpm-info-name").textContent = f.name;
      card.querySelector('[data-field="span"]').textContent = `${f.start}-${f.end}`;
      card.querySelector('[data-field="length"]').textContent = `${f.end - f.start} bp`;
      card.querySelector('[data-field="strand"]').textContent = f.strand;
      card.classList.add("is-visible");
      card.setAttribute("aria-hidden", "false");
      centerLayer.style.opacity = "0";
    }

    function selectFeature(id) {
      selectedId = selectedId === id ? null : id;
      refreshFeatureState();
      renderCard();
      if (typeof opts.onSelect === "function") opts.onSelect(selectedId ? featureNodes.get(selectedId).feature : null);
    }

    function canRotate() {
      return !destroyed && !motionQuery.matches && isIntersecting && !document.hidden && !isHoveringMap && !hasFocusWithin;
    }

    function updateRunningState() {
      const pageRunning = isIntersecting && !document.hidden;
      root.dataset.running = pageRunning ? "true" : "false";
      if (canRotate()) {
        if (!rafId) {
          lastTime = 0;
          rafId = requestAnimationFrame(rotateFrame);
        }
      } else if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
        lastTime = 0;
      }
    }

    function rotateFrame(now) {
      rafId = 0;
      if (!canRotate()) return;
      if (lastTime) angle = (angle + (Math.min(now - lastTime, 50) / rotationMs) * 360) % 360;
      lastTime = now;
      orbit.setAttribute("transform", `rotate(${angle.toFixed(3)} ${CENTER} ${CENTER})`);
      setCounterRotation(counterNodes, angle);
      rafId = requestAnimationFrame(rotateFrame);
    }

    featureNodes.forEach(({ hitPath, visualPath, feature }, id) => {
      hitPath.addEventListener("pointerenter", () => {
        transientId = id;
        refreshFeatureState();
        showTooltip(id);
      });
      hitPath.addEventListener("pointerleave", () => {
        transientId = null;
        refreshFeatureState();
        hideTooltip();
      });
      hitPath.addEventListener("focus", () => {
        transientId = id;
        refreshFeatureState();
        showTooltip(id);
      });
      hitPath.addEventListener("blur", () => {
        transientId = null;
        refreshFeatureState();
        hideTooltip();
      });
      hitPath.addEventListener("click", (event) => {
        event.stopPropagation();
        selectFeature(id);
      });
      hitPath.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          event.stopPropagation();
          selectFeature(id);
          showTooltip(id);
        }
      });
      visualPath.appendChild(svgEl("title", {})).textContent = `${feature.name}: ${feature.start}-${feature.end}`;
    });

    svg.addEventListener("click", () => {
      if (!selectedId) return;
      selectedId = null;
      refreshFeatureState();
      renderCard();
      if (typeof opts.onSelect === "function") opts.onSelect(null);
    });
    root.addEventListener("pointerenter", () => { isHoveringMap = true; updateRunningState(); });
    root.addEventListener("pointerleave", () => { isHoveringMap = false; updateRunningState(); });
    root.addEventListener("focusin", () => { hasFocusWithin = true; updateRunningState(); });
    root.addEventListener("focusout", () => {
      requestAnimationFrame(() => {
        hasFocusWithin = root.contains(document.activeElement);
        updateRunningState();
      });
    });
    const visibilityHandler = () => updateRunningState();
    document.addEventListener("visibilitychange", visibilityHandler);
    const motionHandler = () => updateRunningState();
    if (motionQuery.addEventListener) motionQuery.addEventListener("change", motionHandler);
    else motionQuery.addListener(motionHandler);

    let observer = null;
    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver((entries) => {
        isIntersecting = entries[0].isIntersecting;
        if (isIntersecting && !root.classList.contains("is-ready")) requestAnimationFrame(() => root.classList.add("is-ready"));
        updateRunningState();
      }, { threshold: 0.08 });
      observer.observe(root);
    } else {
      requestAnimationFrame(() => root.classList.add("is-ready"));
    }

    const api = {
      select(id) {
        if (id != null && !featureNodes.has(id)) return false;
        selectedId = id || null;
        refreshFeatureState();
        renderCard();
        return true;
      },
      destroy() {
        destroyed = true;
        if (rafId) cancelAnimationFrame(rafId);
        if (observer) observer.disconnect();
        document.removeEventListener("visibilitychange", visibilityHandler);
        if (motionQuery.removeEventListener) motionQuery.removeEventListener("change", motionHandler);
        else motionQuery.removeListener(motionHandler);
        if (root.parentNode === target) target.removeChild(root);
        instances.delete(target);
      }
    };

    instances.set(target, api);
    if (opts.selectedFeature && featureNodes.has(opts.selectedFeature)) api.select(opts.selectedFeature);
    updateRunningState();
    return api;
  }

  window.MotifPlasmid = Object.freeze({ mount });
})();
