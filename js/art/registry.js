// The only door between game code and art.
// Screens call art.character(...) / art.object(...) and get back a DOM element.
// To use a purchased sprite pack later, write a provider with the same three
// methods (character, object, variants) that returns <img> elements, and call
// setProvider(). No game logic or screen code needs to change.
//
// Animation contract: the returned element gets class "char" (characters) or "obj"
// (objects). Screens animate by toggling classes on that element (see css: .bounce,
// .blink-idle, .glow). SVG parts named .eyes get idle blinking automatically;
// sprite packs can ignore that.

import { penguinSVG, PENGUIN_VARIANTS } from './penguin.js';
import { unicornSVG, UNICORN_VARIANTS } from './unicorn.js';
import { fishSVG, snowballSVG, starSVG } from './objects.js';
import { battleshipSVG, playerBoatSVG } from './battleship.js';

function fromMarkup(markup) {
  const t = document.createElement('template');
  t.innerHTML = markup.trim();
  return t.content.firstElementChild;
}

const svgProvider = {
  character(kind, variant) {
    const markup = kind === 'unicorn' ? unicornSVG(variant) : penguinSVG(variant);
    return fromMarkup(markup);
  },
  object(kind) {
    if (kind === 'snowball') return fromMarkup(snowballSVG());
    if (kind === 'star') return fromMarkup(starSVG());
    return fromMarkup(fishSVG());
  },
  variants(kind) {
    return Object.keys(kind === 'unicorn' ? UNICORN_VARIANTS : PENGUIN_VARIANTS);
  },
  // Battleship pieces. A sprite pack must keep 10 elements with class "part" and data-part 0–9.
  vehicle(kind) {
    return fromMarkup(kind === 'player-boat' ? playerBoatSVG() : battleshipSVG());
  },
};

let provider = svgProvider;

export function setProvider(p) {
  provider = p;
}

export const art = {
  character(kind, variant, { className = '' } = {}) {
    const el = provider.character(kind, variant);
    el.classList.add('char', `char-${kind}`, 'blink-idle');
    if (className) el.classList.add(...className.split(' '));
    // Stagger blink timing so a row of characters doesn't blink in sync.
    el.style.setProperty('--blink-delay', `${(Math.random() * 3).toFixed(2)}s`);
    return el;
  },
  object(kind, { className = '' } = {}) {
    const el = provider.object(kind);
    el.classList.add('obj', `obj-${kind}`);
    if (className) el.classList.add(...className.split(' '));
    return el;
  },
  variants(kind) {
    return provider.variants(kind);
  },
  /** 'battleship' (10 hittable parts) or 'player-boat'. */
  vehicle(kind) {
    return provider.vehicle(kind);
  },
};

// Spoken names for object kinds (singular, plural) and the verb for gaining more.
export const OBJECT_WORDS = {
  fish: { one: 'fish', many: 'fish', more: 'catches' },
  snowball: { one: 'snowball', many: 'snowballs', more: 'makes' },
  star: { one: 'star', many: 'stars', more: 'finds' },
};
