(function () {
  "use strict";

  var STYLE_ID = "motif-codons-styles";
  var DEFAULT_SEQUENCE = "ATGGCTAGCAAAGGAGAAGAACTTTTCACTGGATGG";
  var BASE_NAMES = { A: "adenine", T: "thymine", G: "guanine", C: "cytosine" };
  var AMINO = {
    F: "Phe", L: "Leu", I: "Ile", M: "Met", V: "Val", S: "Ser",
    P: "Pro", T: "Thr", A: "Ala", Y: "Tyr", H: "His", Q: "Gln",
    N: "Asn", K: "Lys", D: "Asp", E: "Glu", C: "Cys", W: "Trp",
    R: "Arg", G: "Gly", "*": "Stop"
  };
  var CODON_TABLE = {
    TTT: "F", TTC: "F", TTA: "L", TTG: "L",
    TCT: "S", TCC: "S", TCA: "S", TCG: "S",
    TAT: "Y", TAC: "Y", TAA: "*", TAG: "*",
    TGT: "C", TGC: "C", TGA: "*", TGG: "W",
    CTT: "L", CTC: "L", CTA: "L", CTG: "L",
    CCT: "P", CCC: "P", CCA: "P", CCG: "P",
    CAT: "H", CAC: "H", CAA: "Q", CAG: "Q",
    CGT: "R", CGC: "R", CGA: "R", CGG: "R",
    ATT: "I", ATC: "I", ATA: "I", ATG: "M",
    ACT: "T", ACC: "T", ACA: "T", ACG: "T",
    AAT: "N", AAC: "N", AAA: "K", AAG: "K",
    AGT: "S", AGC: "S", AGA: "R", AGG: "R",
    GTT: "V", GTC: "V", GTA: "V", GTG: "V",
    GCT: "A", GCC: "A", GCA: "A", GCG: "A",
    GAT: "D", GAC: "D", GAA: "E", GAG: "E",
    GGT: "G", GGC: "G", GGA: "G", GGG: "G"
  };

  var mounted = new WeakMap();

  function installStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      ".mc-root{--mc-ink:#1F1E1D;--mc-ink-2:#46433D;--mc-ink-3:#6B6459;--mc-paper:#FFFFFF;--mc-clay:#C0603C;--mc-clay-deep:#A6482A;--mc-sage:#7F9270;--mc-mist:#6E90AE;--mc-gold:#C79A44;--mc-line:rgba(31,30,29,.12);box-sizing:border-box;width:100%;color:var(--mc-ink);font-family:system-ui,-apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif}",
      ".mc-root *{box-sizing:border-box}",
      ".mc-card{position:relative;overflow:hidden;padding:25px 26px 22px;border:1px solid var(--mc-line);border-radius:16px;background:var(--mc-paper);box-shadow:0 18px 44px rgba(31,30,29,.055),0 2px 8px rgba(31,30,29,.025)}",
      ".mc-card:before{content:\"\";position:absolute;inset:0 0 auto;height:1px;background:rgba(255,255,255,.9);pointer-events:none}",
      ".mc-head{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:20px}",
      ".mc-eyebrow{display:flex;align-items:center;gap:8px;color:var(--mc-ink-3);font:600 10px/1.2 ui-monospace,Menlo,Monaco,Consolas,monospace;letter-spacing:.12em;text-transform:uppercase}",
      ".mc-eyebrow:before{content:\"\";width:18px;height:1px;background:var(--mc-clay)}",
      ".mc-counter{color:var(--mc-ink-3);font:500 10px/1 ui-monospace,Menlo,Monaco,Consolas,monospace;font-variant-numeric:tabular-nums}",
      ".mc-stage{position:relative;min-width:0}",
      ".mc-amino-callout{height:54px;display:flex;align-items:flex-end;padding-left:0;will-change:transform;transform:translate3d(0,0,0)}",
      ".mc-current-aa{display:flex;align-items:baseline;gap:7px;white-space:nowrap;transform-origin:18px 100%;opacity:1;transform:translateY(0) scale(1)}",
      ".mc-current-aa.is-entering{animation:mc-aa-in 420ms cubic-bezier(.22,.61,.36,1) both}",
      ".mc-aa-one{font:400 37px/.9 Georgia,\"Times New Roman\",serif;letter-spacing:-.035em;color:var(--mc-ink)}",
      ".mc-aa-dot{color:var(--mc-clay);font-size:13px}",
      ".mc-aa-three{color:var(--mc-ink-3);font:600 11px/1 ui-monospace,Menlo,Monaco,Consolas,monospace;letter-spacing:.05em}",
      ".mc-rail-wrap{position:relative;overflow:hidden;margin:0 -4px;padding:10px 4px 12px}",
      ".mc-sequence{position:relative;display:flex;align-items:center;width:max-content;will-change:transform;transform:translate3d(0,0,0)}",
      ".mc-codon{position:relative;display:flex;align-items:center;gap:2px;padding:0 4px}",
      ".mc-codon:not(:last-child):after{content:\"\";width:1px;height:4px;margin-left:4px;border-radius:1px;background:rgba(31,30,29,.16)}",
      ".mc-base{display:inline-flex;align-items:center;justify-content:center;width:11px;height:28px;font:650 17px/1 ui-monospace,Menlo,Monaco,Consolas,monospace}",
      ".mc-base[data-base=A]{color:var(--mc-clay)}.mc-base[data-base=T]{color:var(--mc-mist)}.mc-base[data-base=G]{color:var(--mc-sage)}.mc-base[data-base=C]{color:var(--mc-gold)}",
      ".mc-window{position:absolute;z-index:2;top:4px;left:0;height:40px;border:1.5px solid var(--mc-clay);border-radius:9px;background:rgba(192,96,60,.035);box-shadow:0 3px 10px rgba(192,96,60,.08),inset 0 0 0 1px rgba(255,255,255,.65);pointer-events:none;will-change:transform,width;transform:translate3d(0,0,0)}",
      ".mc-window:before,.mc-window:after{content:\"\";position:absolute;left:50%;width:5px;height:5px;border:solid var(--mc-clay);transform:translateX(-50%) rotate(45deg);background:var(--mc-paper)}",
      ".mc-window:before{top:-4px;border-width:1.5px 0 0 1.5px}.mc-window:after{bottom:-4px;border-width:0 1.5px 1.5px 0}",
      ".mc-divider{height:1px;margin:9px 0 16px;background:var(--mc-line)}",
      ".mc-chain-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px}",
      ".mc-label{color:var(--mc-ink-3);font:600 9px/1 ui-monospace,Menlo,Monaco,Consolas,monospace;letter-spacing:.12em;text-transform:uppercase}",
      ".mc-chain{display:flex;align-items:center;min-height:28px;overflow:hidden}",
      ".mc-residue{position:relative;display:flex;align-items:center;justify-content:center;flex:0 0 28px;width:28px;height:28px;border:1px solid var(--mc-line);border-radius:50%;background:var(--mc-paper);color:var(--mc-ink-2);font:400 15px/1 Georgia,\"Times New Roman\",serif;opacity:.22;transform:scale(.82);transition:opacity 260ms ease,transform 360ms cubic-bezier(.22,.61,.36,1),border-color 260ms ease,color 260ms ease}",
      ".mc-residue:not(:first-child){margin-left:8px}.mc-residue:not(:first-child):before{content:\"\";position:absolute;right:100%;width:9px;height:1px;background:var(--mc-line)}",
      ".mc-residue.is-made{opacity:1;transform:scale(1);border-color:rgba(192,96,60,.3);color:var(--mc-clay-deep)}",
      ".mc-residue.is-new{animation:mc-residue-in 420ms cubic-bezier(.22,.61,.36,1) both}",
      ".mc-progress{display:block;width:100%;height:2px;margin-top:12px;overflow:visible}",
      ".mc-progress-track{fill:rgba(31,30,29,.08)}",
      ".mc-progress-fill{fill:var(--mc-clay);transform:scaleX(0);transform-origin:left center;transform-box:fill-box;will-change:transform}",
      "@keyframes mc-aa-in{0%{opacity:0;transform:translateY(7px) scale(.96)}100%{opacity:1;transform:translateY(0) scale(1)}}",
      "@keyframes mc-residue-in{0%{opacity:0;transform:translateX(-5px) scale(.72)}100%{opacity:1;transform:translateX(0) scale(1)}}",
      "@media(max-width:600px){.mc-card{padding:21px 18px 19px}.mc-chain{flex-wrap:wrap;row-gap:8px;overflow:visible}}",
      "@media(prefers-reduced-motion:reduce){.mc-root *{animation:none!important;transition:none!important}}"
    ].join("");
    document.head.appendChild(style);
  }

  function normalizeSequence(value) {
    var sequence = String(value || DEFAULT_SEQUENCE).toUpperCase().replace(/U/g, "T").replace(/[^ATGC]/g, "");
    sequence = sequence.slice(0, sequence.length - (sequence.length % 3));
    if (!sequence) throw new Error("MotifCodons requires at least one complete DNA codon.");
    return sequence;
  }

  function translate(sequence) {
    var codons = [];
    var residues = [];
    for (var i = 0; i < sequence.length; i += 3) {
      var codon = sequence.slice(i, i + 3);
      codons.push(codon);
      residues.push(CODON_TABLE[codon]);
    }
    return { codons: codons, residues: residues };
  }

  function element(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function easeOutCubic(value) {
    return 1 - Math.pow(1 - value, 3);
  }

  function mount(elOrId, options) {
    var host = typeof elOrId === "string" ? document.getElementById(elOrId) : elOrId;
    if (!host || host.nodeType !== 1) throw new Error("MotifCodons.mount expected an element or a valid element id.");
    if (mounted.has(host)) mounted.get(host).destroy();

    installStyles();
    options = options || {};
    var sequence = normalizeSequence(options.sequence);
    var data = translate(sequence);
    var codons = data.codons;
    var residues = data.residues;
    var stepMs = Math.max(700, Number(options.stepDuration) || 1280);
    var pauseMs = Math.max(600, Number(options.loopPause) || 1100);
    var media = window.matchMedia("(prefers-reduced-motion: reduce)");
    var reduced = media.matches;
    var visible = true;
    var frame = 0;
    var index = reduced ? codons.length - 1 : 0;
    var phaseStart = 0;
    var fromX = 0;
    var targetX = 0;
    var lastX = 0;
    var fromPan = 0;
    var targetPan = 0;
    var lastPan = 0;
    var destroyed = false;

    host.textContent = "";
    var root = element("div", "mc-root");
    var card = element("div", "mc-card");
    var description = "DNA sequence " + codons.join(" ") + ". Translation: " + residues.join("") + ", " + residues.map(function (aa) { return AMINO[aa]; }).join(", ") + ".";
    card.setAttribute("role", "img");
    card.setAttribute("aria-label", description);

    var head = element("div", "mc-head");
    head.appendChild(element("div", "mc-eyebrow", "coding sequence · 5′ → 3′"));
    var counter = element("div", "mc-counter");
    head.appendChild(counter);

    var stage = element("div", "mc-stage");
    var callout = element("div", "mc-amino-callout");
    var currentAA = element("div", "mc-current-aa");
    var one = element("span", "mc-aa-one");
    var dot = element("span", "mc-aa-dot", "·");
    var three = element("span", "mc-aa-three");
    currentAA.appendChild(one); currentAA.appendChild(dot); currentAA.appendChild(three);
    callout.appendChild(currentAA);
    var railWrap = element("div", "mc-rail-wrap");
    var sequenceRow = element("div", "mc-sequence");
    var codonNodes = [];
    codons.forEach(function (codon, codonIndex) {
      var codonNode = element("div", "mc-codon");
      codonNode.dataset.index = String(codonIndex);
      codon.split("").forEach(function (base) {
        var baseNode = element("span", "mc-base", base);
        baseNode.dataset.base = base;
        baseNode.title = BASE_NAMES[base];
        codonNode.appendChild(baseNode);
      });
      codonNodes.push(codonNode);
      sequenceRow.appendChild(codonNode);
    });
    var readingWindow = element("div", "mc-window");
    railWrap.appendChild(sequenceRow);
    railWrap.appendChild(readingWindow);
    stage.appendChild(callout);
    stage.appendChild(railWrap);

    var divider = element("div", "mc-divider");
    var chainHead = element("div", "mc-chain-head");
    chainHead.appendChild(element("div", "mc-label", "nascent peptide · N → C"));
    var progressText = element("div", "mc-label");
    chainHead.appendChild(progressText);
    var chain = element("div", "mc-chain");
    var residueNodes = residues.map(function (aa, residueIndex) {
      var residue = element("span", "mc-residue", aa);
      residue.title = AMINO[aa] + " · codon " + codons[residueIndex];
      chain.appendChild(residue);
      return residue;
    });
    var svgNS = "http://www.w3.org/2000/svg";
    var progress = document.createElementNS(svgNS, "svg");
    progress.setAttribute("class", "mc-progress");
    progress.setAttribute("viewBox", "0 0 100 2");
    progress.setAttribute("preserveAspectRatio", "none");
    progress.setAttribute("aria-hidden", "true");
    var progressTrack = document.createElementNS(svgNS, "rect");
    progressTrack.setAttribute("class", "mc-progress-track");
    progressTrack.setAttribute("x", "0"); progressTrack.setAttribute("y", "0");
    progressTrack.setAttribute("width", "100"); progressTrack.setAttribute("height", "2");
    progressTrack.setAttribute("rx", "1");
    var progressFill = document.createElementNS(svgNS, "rect");
    progressFill.setAttribute("class", "mc-progress-fill");
    progressFill.setAttribute("x", "0"); progressFill.setAttribute("y", "0");
    progressFill.setAttribute("width", "100"); progressFill.setAttribute("height", "2");
    progressFill.setAttribute("rx", "1");
    progress.appendChild(progressTrack); progress.appendChild(progressFill);

    card.appendChild(head); card.appendChild(stage); card.appendChild(divider);
    card.appendChild(chainHead); card.appendChild(chain); card.appendChild(progress);
    root.appendChild(card); host.appendChild(root);

    Array.prototype.forEach.call(card.querySelectorAll(":scope > *, .mc-stage *"), function (node) {
      node.setAttribute("aria-hidden", "true");
    });

    function metrics(forIndex) {
      var codonNode = codonNodes[forIndex];
      var width = codonNode.offsetWidth - (forIndex < codonNodes.length - 1 ? 7 : 0);
      var rawX = codonNode.offsetLeft;
      var minimumPan = Math.min(0, railWrap.clientWidth - sequenceRow.offsetWidth);
      var pan = clamp((railWrap.clientWidth - width) / 2 - rawX, minimumPan, 0);
      return { x: rawX + pan, width: width, pan: pan };
    }

    function showResidues(through, animateNewest) {
      residueNodes.forEach(function (node, i) {
        node.classList.toggle("is-made", i <= through);
        node.classList.remove("is-new");
      });
      if (animateNewest && residueNodes[through]) {
        void residueNodes[through].offsetWidth;
        residueNodes[through].classList.add("is-new");
      }
    }

    function setLabels(forIndex, animate) {
      one.textContent = residues[forIndex];
      three.textContent = AMINO[residues[forIndex]];
      counter.textContent = String(forIndex + 1).padStart(2, "0") + " / " + String(codons.length).padStart(2, "0");
      progressText.textContent = Math.round(((forIndex + 1) / codons.length) * 100) + "%";
      progressFill.style.transform = "scaleX(" + ((forIndex + 1) / codons.length) + ")";
      if (animate) {
        currentAA.classList.remove("is-entering");
        void currentAA.offsetWidth;
        currentAA.classList.add("is-entering");
      }
      showResidues(forIndex, animate);
    }

    function positionStatic(forIndex) {
      var next = metrics(forIndex);
      lastX = next.x;
      lastPan = next.pan;
      sequenceRow.style.transform = "translate3d(" + next.pan + "px,0,0)";
      readingWindow.style.width = next.width + "px";
      readingWindow.style.transform = "translate3d(" + next.x + "px,0,0)";
      var calloutWidth = currentAA.offsetWidth || 76;
      var calloutX = clamp(next.x + (next.width - calloutWidth) / 2, 0, Math.max(0, railWrap.clientWidth - calloutWidth));
      callout.style.transform = "translate3d(" + calloutX + "px,0,0)";
    }

    function land(forIndex, animate) {
      index = forIndex;
      positionStatic(index);
      setLabels(index, animate);
    }

    function shouldRun() {
      return !destroyed && !reduced && codons.length > 1 && visible && !document.hidden;
    }

    function schedule() {
      if (shouldRun() && !frame) frame = requestAnimationFrame(tick);
    }

    function tick(now) {
      frame = 0;
      if (!shouldRun()) return;
      if (!phaseStart) phaseStart = now;
      var elapsed = now - phaseStart;
      var isLast = index === codons.length - 1;
      var holdMs = isLast ? pauseMs : stepMs;
      var travelMs = Math.min(620, stepMs * .48);

      if (elapsed >= holdMs) {
        var nextIndex = isLast ? 0 : index + 1;
        var nextMetric = metrics(nextIndex);
        fromX = lastX;
        targetX = nextMetric.x;
        fromPan = lastPan;
        targetPan = nextMetric.pan;
        readingWindow.style.width = nextMetric.width + "px";
        phaseStart = now;
        index = nextIndex;
        if (nextIndex === 0) showResidues(-1, false);
      } else if (elapsed <= travelMs && (targetX !== fromX || targetPan !== fromPan)) {
        var amount = easeOutCubic(elapsed / travelMs);
        var currentX = fromX + (targetX - fromX) * amount;
        var currentPan = fromPan + (targetPan - fromPan) * amount;
        sequenceRow.style.transform = "translate3d(" + currentPan + "px,0,0)";
        readingWindow.style.transform = "translate3d(" + currentX + "px,0,0)";
        var calloutWidth = currentAA.offsetWidth || 76;
        var calloutX = clamp(currentX + (metrics(index).width - calloutWidth) / 2, 0, Math.max(0, railWrap.clientWidth - calloutWidth));
        callout.style.transform = "translate3d(" + calloutX + "px,0,0)";
      } else if (targetX !== fromX || targetPan !== fromPan) {
        targetX = fromX;
        targetPan = fromPan;
        land(index, true);
      }
      schedule();
    }

    function resetMode() {
      reduced = media.matches;
      if (frame) cancelAnimationFrame(frame);
      frame = 0; phaseStart = 0; fromX = 0; targetX = 0; fromPan = 0; targetPan = 0;
      land(reduced ? codons.length - 1 : 0, false);
      schedule();
    }

    function resumeStable() {
      land(index, false);
      fromX = lastX; targetX = lastX;
      fromPan = lastPan; targetPan = lastPan;
      phaseStart = 0;
      schedule();
    }

    function onVisibility() {
      if (!document.hidden) resumeStable();
    }

    var observer = "IntersectionObserver" in window ? new IntersectionObserver(function (entries) {
      visible = entries[0] ? entries[0].isIntersecting : true;
      if (visible) resumeStable();
    }, { threshold: 0.08 }) : null;
    if (observer) observer.observe(root);
    document.addEventListener("visibilitychange", onVisibility);
    if (media.addEventListener) media.addEventListener("change", resetMode);
    else if (media.addListener) media.addListener(resetMode);

    var resizeObserver = "ResizeObserver" in window ? new ResizeObserver(function () { positionStatic(index); }) : null;
    if (resizeObserver) resizeObserver.observe(railWrap);

    requestAnimationFrame(function () {
      land(index, false);
      fromX = lastX; targetX = lastX;
      fromPan = lastPan; targetPan = lastPan;
      schedule();
    });

    var api = {
      destroy: function () {
        destroyed = true;
        if (frame) cancelAnimationFrame(frame);
        if (observer) observer.disconnect();
        if (resizeObserver) resizeObserver.disconnect();
        document.removeEventListener("visibilitychange", onVisibility);
        if (media.removeEventListener) media.removeEventListener("change", resetMode);
        else if (media.removeListener) media.removeListener(resetMode);
        host.textContent = "";
        mounted.delete(host);
      }
    };
    mounted.set(host, api);
    return api;
  }

  window.MotifCodons = { mount: mount };
})();
