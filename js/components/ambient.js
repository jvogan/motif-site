(function () {
  'use strict';

  const PALETTE = {
    ink: '#1F1E1D',
    cream: '#FAF9F5',
    dark: '#262624',
    creamText: '#EDE6D8',
    line: 'rgba(31,30,29,0.12)',
    clay: '#C0603C',
    mist: '#6E90AE',
    sage: '#7F9270',
    gold: '#C79A44'
  };

  const BASES = [
    ['A', PALETTE.clay],
    ['T', PALETTE.mist],
    ['G', PALETTE.sage],
    ['C', PALETTE.gold]
  ];

  const TAU = Math.PI * 2;
  let instanceCount = 0;

  function mulberry32(seed) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6D2B79F5) | 0;
      let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hexToRgb(hex) {
    const value = parseInt(hex.slice(1), 16);
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
  }

  function rgba(hex, alpha) {
    const [r, g, b] = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function mount(elOrId, options) {
    const container = typeof elOrId === 'string'
      ? document.getElementById(elOrId)
      : elOrId;

    if (!(container instanceof HTMLElement)) {
      throw new TypeError('MotifAmbient.mount expected an element or a valid element id.');
    }

    const settings = Object.assign({ theme: 'light', density: 1 }, options || {});
    const theme = settings.theme === 'dark' ? 'dark' : 'light';
    const density = clamp(Number.isFinite(Number(settings.density)) ? Number(settings.density) : 1, 0.25, 3);
    const previous = container.__motifAmbient;
    if (previous && typeof previous.destroy === 'function') previous.destroy();

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { alpha: true, desynchronized: true });
    if (!context) throw new Error('MotifAmbient requires Canvas 2D support.');

    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = [
      'position:absolute',
      'inset:0',
      'width:100%',
      'height:100%',
      'display:block',
      'pointer-events:none',
      'z-index:0',
      'overflow:hidden'
    ].join(';');

    const computedPosition = getComputedStyle(container).position;
    const addedPosition = computedPosition === 'static';
    if (addedPosition) container.style.position = 'relative';
    container.insertBefore(canvas, container.firstChild);

    const seed = 9173 + (++instanceCount * 7919) + (theme === 'dark' ? 53 : 0);
    const random = mulberry32(seed);
    const contours = [];
    const glyphs = [];
    const dots = [];
    let width = 0;
    let height = 0;
    let dpr = 1;
    let frameId = 0;
    let inView = true;
    let destroyed = false;
    let lastTime = 0;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reducedMotion = mediaQuery.matches;

    function rebuildField() {
      contours.length = 0;
      glyphs.length = 0;
      dots.length = 0;

      const contourCount = Math.max(4, Math.round(7 * density));
      const glyphCount = Math.max(5, Math.round((width * height / 76000) * density));
      const dotCount = Math.max(12, Math.round((width * height / 26000) * density));

      for (let i = 0; i < contourCount; i += 1) {
        const points = [];
        const pointCount = 7;
        const lane = (i + 0.65) / contourCount;
        for (let p = 0; p < pointCount; p += 1) {
          points.push({
            x: (p / (pointCount - 1)) * 1.24 - 0.12,
            y: lane + (random() - 0.5) * 0.19,
            phase: random() * TAU,
            amplitude: 5 + random() * 13
          });
        }
        contours.push({
          points,
          phase: random() * TAU,
          speed: 0.000018 + random() * 0.000018,
          alpha: theme === 'dark' ? 0.105 + random() * 0.025 : 0.046 + random() * 0.018,
          width: 0.65 + random() * 0.55,
          offset: (random() - 0.5) * 42
        });
      }

      for (let i = 0; i < glyphCount; i += 1) {
        const base = BASES[Math.floor(random() * BASES.length)];
        glyphs.push({
          letter: base[0],
          color: base[1],
          x: random(),
          y: random(),
          size: 10 + random() * 3,
          alpha: theme === 'dark' ? 0.105 + random() * 0.035 : 0.075 + random() * 0.025,
          phase: random() * TAU,
          driftX: 4 + random() * 10,
          driftY: 3 + random() * 8,
          speed: 0.00002 + random() * 0.000025
        });
      }

      for (let i = 0; i < dotCount; i += 1) {
        const color = BASES[Math.floor(random() * BASES.length)][1];
        dots.push({
          color,
          x: random(),
          y: random(),
          radius: 0.65 + random() * 1.25,
          alpha: theme === 'dark' ? 0.09 + random() * 0.055 : 0.05 + random() * 0.035,
          phase: random() * TAU,
          driftX: 3 + random() * 12,
          driftY: 3 + random() * 10,
          speed: 0.000018 + random() * 0.00003
        });
      }
    }

    function resize() {
      const rect = container.getBoundingClientRect();
      const nextWidth = Math.max(1, Math.round(rect.width));
      const nextHeight = Math.max(1, Math.round(rect.height));
      const nextDpr = clamp(window.devicePixelRatio || 1, 1, 2.5);
      if (nextWidth === width && nextHeight === height && nextDpr === dpr) return;

      width = nextWidth;
      height = nextHeight;
      dpr = nextDpr;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      rebuildField();
      draw(reducedMotion ? 0 : lastTime);
    }

    function drawWash() {
      const first = context.createRadialGradient(width * 0.14, height * 0.28, 0, width * 0.14, height * 0.28, width * 0.62);
      first.addColorStop(0, rgba(PALETTE.clay, theme === 'dark' ? 0.035 : 0.016));
      first.addColorStop(1, rgba(PALETTE.clay, 0));
      context.fillStyle = first;
      context.fillRect(0, 0, width, height);

      const second = context.createRadialGradient(width * 0.86, height * 0.74, 0, width * 0.86, height * 0.74, width * 0.52);
      second.addColorStop(0, rgba(PALETTE.gold, theme === 'dark' ? 0.025 : 0.012));
      second.addColorStop(1, rgba(PALETTE.gold, 0));
      context.fillStyle = second;
      context.fillRect(0, 0, width, height);
    }

    function drawContours(time) {
      context.lineCap = 'round';
      context.lineJoin = 'round';

      contours.forEach((contour) => {
        const animated = contour.points.map((point, index) => ({
          x: point.x * width + Math.sin(time * contour.speed * 0.72 + contour.phase + index * 0.4) * 4,
          y: point.y * height + contour.offset + Math.sin(time * contour.speed + point.phase) * point.amplitude
        }));

        context.beginPath();
        context.moveTo(animated[0].x, animated[0].y);
        for (let i = 0; i < animated.length - 1; i += 1) {
          const current = animated[i];
          const next = animated[i + 1];
          const midpointX = (current.x + next.x) / 2;
          const midpointY = (current.y + next.y) / 2;
          context.quadraticCurveTo(current.x, current.y, midpointX, midpointY);
        }
        const last = animated[animated.length - 1];
        context.lineTo(last.x, last.y);
        context.globalAlpha = theme === 'dark' ? 1 : contour.alpha / 0.12;
        context.strokeStyle = theme === 'dark'
          ? rgba(PALETTE.creamText, contour.alpha)
          : PALETTE.line;
        context.lineWidth = contour.width;
        context.stroke();
      });
      context.globalAlpha = 1;
    }

    function drawGlyphs(time) {
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.font = '500 11px ui-monospace, Menlo, monospace';

      glyphs.forEach((glyph) => {
        const phase = time * glyph.speed + glyph.phase;
        const x = glyph.x * width + Math.sin(phase) * glyph.driftX;
        const y = glyph.y * height + Math.cos(phase * 0.81) * glyph.driftY;
        context.globalAlpha = glyph.alpha;
        context.fillStyle = glyph.color;
        context.font = `500 ${glyph.size}px ui-monospace, Menlo, monospace`;
        context.fillText(glyph.letter, x, y);
      });

      dots.forEach((dot) => {
        const phase = time * dot.speed + dot.phase;
        const x = dot.x * width + Math.sin(phase) * dot.driftX;
        const y = dot.y * height + Math.cos(phase * 0.73) * dot.driftY;
        context.globalAlpha = dot.alpha;
        context.fillStyle = dot.color;
        context.beginPath();
        context.arc(x, y, dot.radius, 0, TAU);
        context.fill();
      });
      context.globalAlpha = 1;
    }

    function drawHelix(time) {
      if (width < 440 || density < 0.6) return;
      const centerY = height * 0.64;
      const amplitude = Math.min(23, height * 0.052);
      const startX = width * 0.16;
      const span = width * 0.68;
      const count = Math.max(13, Math.round(span / 43));
      const drift = Math.sin(time * 0.000018) * 7;

      context.lineWidth = 0.55;
      for (let i = 0; i < count; i += 1) {
        const progress = i / (count - 1);
        const angle = progress * TAU * 2.25 + time * 0.000025;
        const x = startX + span * progress + drift;
        const y1 = centerY + Math.sin(angle) * amplitude;
        const y2 = centerY - Math.sin(angle) * amplitude;
        const depth = 0.55 + Math.abs(Math.cos(angle)) * 0.45;
        const alpha = (theme === 'dark' ? 0.10 : 0.052) * depth;

        context.strokeStyle = rgba(theme === 'dark' ? PALETTE.creamText : PALETTE.ink, alpha * 0.55);
        context.beginPath();
        context.moveTo(x, y1);
        context.lineTo(x, y2);
        context.stroke();

        context.fillStyle = rgba(i % 2 ? PALETTE.clay : PALETTE.mist, alpha);
        context.beginPath();
        context.arc(x, y1, 1.35, 0, TAU);
        context.fill();
        context.fillStyle = rgba(i % 2 ? PALETTE.sage : PALETTE.gold, alpha);
        context.beginPath();
        context.arc(x, y2, 1.15, 0, TAU);
        context.fill();
      }
    }

    function draw(time) {
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);
      drawWash();
      drawContours(time);
      drawHelix(time);
      drawGlyphs(time);
    }

    function animate(time) {
      frameId = 0;
      if (destroyed || reducedMotion || !inView || document.hidden) return;
      lastTime = time;
      draw(time);
      frameId = requestAnimationFrame(animate);
    }

    function updateAnimation() {
      if (destroyed) return;
      if (frameId) {
        cancelAnimationFrame(frameId);
        frameId = 0;
      }
      if (reducedMotion) {
        draw(0);
      } else if (inView && !document.hidden) {
        frameId = requestAnimationFrame(animate);
      }
    }

    function onVisibilityChange() {
      updateAnimation();
    }

    function onMotionChange(event) {
      reducedMotion = event.matches;
      updateAnimation();
    }

    const resizeObserver = new ResizeObserver(resize);
    const intersectionObserver = new IntersectionObserver((entries) => {
      inView = entries[0] ? entries[0].isIntersecting : true;
      updateAnimation();
    }, { rootMargin: '120px 0px' });

    resizeObserver.observe(container);
    intersectionObserver.observe(container);
    document.addEventListener('visibilitychange', onVisibilityChange);
    if (mediaQuery.addEventListener) mediaQuery.addEventListener('change', onMotionChange);
    else mediaQuery.addListener(onMotionChange);

    resize();
    updateAnimation();

    const api = {
      canvas,
      destroy() {
        if (destroyed) return;
        destroyed = true;
        if (frameId) cancelAnimationFrame(frameId);
        resizeObserver.disconnect();
        intersectionObserver.disconnect();
        document.removeEventListener('visibilitychange', onVisibilityChange);
        if (mediaQuery.removeEventListener) mediaQuery.removeEventListener('change', onMotionChange);
        else mediaQuery.removeListener(onMotionChange);
        canvas.remove();
        if (addedPosition && container.style.position === 'relative') container.style.position = '';
        if (container.__motifAmbient === api) delete container.__motifAmbient;
      }
    };

    container.__motifAmbient = api;
    return api;
  }

  window.MotifAmbient = { mount };
}());
