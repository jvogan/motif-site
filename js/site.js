// Motif landing page: copy buttons, example tabs, and scroll reveal.
// Without JavaScript the page shows every example with its request and
// screenshot, the copy buttons stay hidden, and the prompt text stays
// selectable.

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// ---------- Copy buttons ----------
// The button keeps one width in both states: it is measured once with the
// "Copied" label and that width becomes its minimum.
const SVG = 'http://www.w3.org/2000/svg';
const checkIcon = () => {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('class', 'prompt__check');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const use = document.createElementNS(SVG, 'use');
  use.setAttribute('href', '#check');
  svg.append(use);
  return svg;
};

for (const box of document.querySelectorAll('.prompt')) {
  const button = box.querySelector('.prompt__copy');
  const text = box.querySelector('.prompt__text');
  const status = box.querySelector('.prompt__status');
  if (!button || !text || !status) continue;
  let timer;

  const showIdle = () => {
    button.textContent = 'Copy';
    button.classList.remove('is-done');
  };
  const showDone = () => {
    button.replaceChildren(checkIcon(), 'Copied');
    button.classList.add('is-done');
  };
  // Measuring briefly applies the done state; transitions are off meanwhile
  // so the button does not fade from sage back to blue on load.
  const fit = () => {
    const done = button.classList.contains('is-done');
    button.style.transition = 'none';
    button.style.minWidth = '';
    showDone();
    const width = button.getBoundingClientRect().width;
    if (!done) showIdle();
    if (width) button.style.minWidth = `${Math.ceil(width)}px`;
    void button.offsetWidth;
    button.style.transition = '';
  };

  const copied = () => {
    showDone();
    status.textContent = 'Copied';
    clearTimeout(timer);
    timer = setTimeout(() => {
      showIdle();
      status.textContent = '';
    }, 1800);
  };

  button.addEventListener('click', async () => {
    const value = text.textContent.trim();
    try {
      await navigator.clipboard.writeText(value);
      copied();
    } catch {
      // No clipboard access: select the text so the reader can copy it.
      const range = document.createRange();
      range.selectNodeContents(text);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      let ok = false;
      try { ok = document.execCommand('copy'); } catch {}
      if (ok) copied();
      else status.textContent = 'Press Ctrl+C or Command+C to copy the selected text.';
    }
  });

  button.hidden = false;
  fit();
  window.matchMedia('(max-width: 640px)').addEventListener('change', fit);
}

// ---------- Example tabs ----------
// The static markup lists every example: a title, the request, the
// screenshot, and a note. Here each title becomes a tab and each example
// its tab panel.
const wide = window.matchMedia('(min-width: 960px)');

for (const showcase of document.querySelectorAll('[data-showcase]')) {
  const items = [...showcase.querySelectorAll('.showcase__item')];
  if (items.length < 2) continue;

  const nav = document.createElement('div');
  nav.className = 'showcase__nav';
  const tablist = document.createElement('div');
  tablist.className = 'showcase__tabs';
  tablist.setAttribute('role', 'tablist');
  tablist.setAttribute('aria-label', showcase.dataset.label || 'Examples');
  // The accent bar that slides to the selected tab from 960px.
  const indicator = document.createElement('span');
  indicator.className = 'showcase__indicator';
  indicator.setAttribute('aria-hidden', 'true');
  nav.append(tablist, indicator);
  const panels = document.createElement('div');
  panels.className = 'showcase__panels';

  const tabs = items.map((item, i) => {
    const title = item.querySelector('.showcase__title');
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'showcase__tab';
    tab.id = `${item.id}-tab`;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', item.id);
    tab.textContent = title.textContent.trim();
    title.remove();

    item.setAttribute('role', 'tabpanel');
    item.setAttribute('aria-labelledby', tab.id);
    tablist.append(tab);
    panels.append(item);
    tab.addEventListener('click', () => select(i, false));
    return tab;
  });

  showcase.append(nav, panels);
  showcase.classList.add('is-tabs');
  let current = 0;

  const place = () => {
    const tab = tabs[current];
    indicator.style.setProperty('--indicator-y', `${tab.offsetTop}px`);
    indicator.style.setProperty('--indicator-h', `${tab.offsetHeight}px`);
  };

  const orient = () => {
    tablist.setAttribute('aria-orientation', wide.matches ? 'vertical' : 'horizontal');
    place();
  };
  wide.addEventListener('change', orient);
  if ('ResizeObserver' in window) new ResizeObserver(place).observe(tablist);

  function select(index, focus) {
    current = index;
    tabs.forEach((tab, i) => {
      const on = i === index;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      items[i].classList.toggle('is-active', on);
    });
    place();
    // Moving focus scrolls the page only as far as the tab needs.
    if (focus) {
      tabs[index].focus({ preventScroll: true });
      tabs[index].scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }

  tablist.addEventListener('keydown', (event) => {
    const from = tabs.indexOf(document.activeElement);
    if (from < 0) return;
    let next;
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        next = (from + 1) % tabs.length;
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        next = (from - 1 + tabs.length) % tabs.length;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = tabs.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    select(next, true);
  });

  select(0, false);
  orient();
}

// ---------- Scroll reveal ----------
// Section content fades up once as it enters the viewport.
const revealed = document.querySelectorAll('.reveal');
if (!reducedMotion.matches && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-in');
      observer.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -8% 0px' });
  revealed.forEach((el) => observer.observe(el));
} else {
  revealed.forEach((el) => el.classList.add('is-in'));
}

// Last line: tells the failsafe in index.html that everything above ran.
// If any step throws first, the failsafe drops html.js after 3 s and the
// page shows its static state.
window.motifReady = true;
