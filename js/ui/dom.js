// Tiny DOM helpers and inline icons (no icon fonts, so it works offline).

export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'html') el.innerHTML = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

export function svg(markup) {
  const t = document.createElement('template');
  t.innerHTML = markup.trim();
  return t.content.firstElementChild;
}

export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** Restart a CSS animation class on an element. */
export function animate(el, cls, ms = 800) {
  if (!el) return;
  el.classList.remove(cls);
  void el.getBoundingClientRect();
  el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), ms);
}

const I = (body) =>
  `<svg class="icon" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

export const icons = {
  home: () => svg(I('<path d="M6 23 L24 8 L42 23"/><path d="M11 20 V40 H37 V20"/><path d="M20 40 V29 H28 V40"/>')),
  replay: () =>
    svg(I('<path d="M8 19 H15 L25 10 V38 L15 29 H8 Z" fill="currentColor"/><path d="M32 17 Q37 24 32 31"/><path d="M37 12 Q46 24 37 36"/>')),
  sound: () =>
    svg(
      `<svg class="icon" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <g class="icon-sound-on"><path d="M18 34 V10 L38 6 V30"/><circle cx="13" cy="34" r="6" fill="currentColor"/><circle cx="33" cy="30" r="6" fill="currentColor"/></g>
        <g class="icon-sound-off"><path d="M18 34 V10 L38 6 V30" opacity="0.35"/><circle cx="13" cy="34" r="6" fill="currentColor" opacity="0.35"/><circle cx="33" cy="30" r="6" fill="currentColor" opacity="0.35"/><path d="M6 6 L42 42" stroke="#e5484d"/></g>
      </svg>`
    ),
  play: () => svg('<svg class="icon" viewBox="0 0 48 48" aria-hidden="true"><path d="M16 9 L39 24 L16 39 Z" fill="currentColor" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/></svg>'),
  check: () => svg(I('<path d="M10 25 L20 35 L39 13"/>')),
  back: () => svg(I('<path d="M28 10 L14 24 L28 38"/>')),
  gear: () =>
    svg(I('<circle cx="24" cy="24" r="6"/><path d="M24 4 V10 M24 38 V44 M4 24 H10 M38 24 H44 M10 10 L14 14 M34 34 L38 38 M38 10 L34 14 M14 34 L10 38"/>')),
  lock: () =>
    svg(
      '<svg class="lock" viewBox="0 0 48 48" aria-hidden="true"><rect x="9" y="21" width="30" height="22" rx="6" fill="#7a6fa8"/><path d="M15 21 V15 A9 9 0 0 1 33 15 V21" stroke="#7a6fa8" stroke-width="5" fill="none"/><circle cx="24" cy="31" r="3.5" fill="#fff"/></svg>'
    ),
  ear: () => svg(I('<path d="M14 18 A10 10 0 1 1 30 26 Q26 30 26 36 A5 5 0 0 1 16 36"/>')),
};
