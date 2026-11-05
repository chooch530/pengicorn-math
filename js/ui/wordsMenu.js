// Words: pick Classic (find the word) or the Pirate ship (find the word to fire the cannon).
import { h } from './dom.js';
import { art } from '../art/registry.js';
import { topbar, homeButton, starCount } from './chrome.js';
import { sfx } from '../audio/sfx.js';
import * as speech from '../audio/speech.js';

export function render(app) {
  const kid = app.kid;
  if (!kid) return app.go('kids');

  const card = (cls, label, glyph, picture, target) =>
    h(
      'button',
      {
        class: `mode-card ${cls}`,
        'aria-label': label,
        onclick: () => {
          sfx.tap();
          app.go(target);
        },
      },
      h('div', { class: 'mode-glyph' }, glyph),
      picture
    );

  const el = h(
    'div',
    { class: 'screen' },
    topbar(app, { left: [homeButton(app, 'splash'), starCount(kid.totalStars)] }),
    h(
      'div',
      { class: 'mode-row' },
      card('mode-words', 'Classic words', 'abc', art.character(kid.avatar, kid.color, { className: 'float' }), 'words'),
      card('mode-pirate', 'Pirate ship', 'ARRR', art.vehicle('pirate-ship'), 'wordsBattle')
    )
  );

  return {
    el,
    enter() {
      document.body.dataset.theme = 'meadow';
      speech.speak('Tap the letters to find words. Or tap the pirate ship to fire your cannon!');
    },
  };
}
