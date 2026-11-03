// The map: Penguin Island is open; the other places are shown locked ("being built").
import { h, icons, animate } from './dom.js';
import { art } from '../art/registry.js';
import { topbar, starCount, holdButton, homeButton } from './chrome.js';
import { sfx } from '../audio/sfx.js';
import * as speech from '../audio/speech.js';
import { openParentGate } from './parent.js';

export function render(app) {
  const kid = app.kid;
  if (!kid) return app.go('kids');

  const island = h(
    'button',
    {
      class: 'place place-island',
      'aria-label': 'Penguin Island',
      onclick: () => {
        sfx.tap();
        app.go('levels', { mode: 'add' });
      },
    },
    art.character('penguin', 'blue', { className: 'float' })
  );

  const locked = (cls, kind, variant, name) => {
    const el = h(
      'button',
      {
        class: `place ${cls} locked`,
        'aria-label': `${name} (locked)`,
        onclick: () => {
          sfx.tryAgain();
          animate(el, 'wiggle', 500);
          speech.speak(`${name} is still being built. Try Penguin Island!`, { remember: false });
        },
      },
      icons.lock(),
      art.character(kind, variant)
    );
    return el;
  };

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
    topbar(app, { left: [homeButton(app, 'modes'), kidChip, starCount(kid.totalStars)] }),
    h(
      'div',
      { class: 'map' },
      island,
      locked('place-meadow', 'unicorn', 'rainbow', 'Unicorn Meadow'),
      locked('place-castle', 'unicorn', 'purple', 'Rainbow Castle')
    ),
    h('div', { class: 'corner-gear' }, holdButton(() => openParentGate(app)))
  );

  return {
    el,
    enter() {
      document.body.dataset.theme = 'island';
      speech.speak(`Hi ${kid.name}! Tap Penguin Island to play.`);
    },
  };
}
