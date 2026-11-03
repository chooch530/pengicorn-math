// After picking a player: Math or Words. Two big picture buttons, spoken labels.
import { h } from './dom.js';
import { art } from '../art/registry.js';
import { topbar, starCount, holdButton } from './chrome.js';
import { sfx } from '../audio/sfx.js';
import * as speech from '../audio/speech.js';
import { openParentGate } from './parent.js';

export function render(app) {
  const kid = app.kid;
  if (!kid) return app.go('kids');

  const card = (cls, label, glyph, character, onTap) =>
    h(
      'button',
      { class: `mode-card ${cls}`, 'aria-label': label, onclick: onTap },
      h('div', { class: 'mode-glyph' }, glyph),
      character
    );

  const math = card('mode-math', 'Math', '1+2', art.character('penguin', 'blue', { className: 'float' }), () => {
    sfx.tap();
    app.go('home');
  });
  const words = card('mode-words', 'Words', 'abc', art.character('unicorn', 'rainbow', { className: 'float' }), () => {
    sfx.tap();
    app.go('words');
  });
  words.querySelector('.char').style.animationDelay = '0.6s';

  const kidChip = h(
    'button',
    {
      class: 'kid-chip btn',
      style: { padding: '0 16px 0 6px', fontSize: '26px' },
      'aria-label': 'Change player',
      onclick: () => {
        sfx.tap();
        app.go('kids');
      },
    },
    art.character(kid.avatar, kid.color),
    h('span', { class: 'kid-name' }, kid.name)
  );

  const el = h(
    'div',
    { class: 'screen' },
    topbar(app, { left: [kidChip, starCount(kid.totalStars)] }),
    h('div', { class: 'mode-row' }, math, words),
    h('div', { class: 'corner-gear' }, holdButton(() => openParentGate(app)))
  );

  return {
    el,
    enter() {
      document.body.dataset.theme = 'island';
      speech.speak(`Hi ${kid.name}! Tap the numbers to play math. Tap the letters to read words.`);
    },
  };
}
