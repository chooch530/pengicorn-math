// Penguin Island level picker: three icebergs. Locked ones explain (out loud) how to open them.
import { h, svg, icons, animate } from './dom.js';
import { art } from '../art/registry.js';
import { starSVG, fishSVG } from '../art/objects.js';
import { topbar, homeButton, starCount } from './chrome.js';
import { sfx } from '../audio/sfx.js';
import * as speech from '../audio/speech.js';
import { LEVELS, PLAYABLE } from '../logic/levels.js';

// target: screen a level opens ('play' = Penguin Island, 'battle' = Battleship).
export function render(app, { mode = 'add', target = 'play', homeTarget = 'home' } = {}) {
  const kid = app.kid;
  if (!kid) return app.go('kids');
  const mp = kid.modes[mode];
  const levels = Object.keys(LEVELS[mode]).map(Number);

  const cards = levels.map((lv) => {
    const open = lv <= mp.level && PLAYABLE[mode].includes(lv);
    const best = mp.bestStars?.[lv] || 0;
    const card = h(
      'button',
      {
        class: `level-card ${open ? '' : 'locked'}`,
        'aria-label': `Level ${lv}${open ? '' : ' (locked)'}`,
        onclick: () => {
          if (open) {
            sfx.tap();
            app.go(target, { mode, level: lv });
          } else {
            sfx.tryAgain();
            animate(card, 'wiggle', 500);
            speech.speak(`Level ${lv} is locked. Keep winning stars on level ${lv - 1} to open it!`, {
              remember: false,
            });
          }
        },
      },
      open ? null : icons.lock(),
      h('div', { class: 'level-num' }, String(lv)),
      h('div', { class: 'level-fish' }, Array.from({ length: lv }, () => svg(fishSVG()))),
      h(
        'div',
        { class: 'level-stars' },
        [0, 1, 2].map((i) => {
          const s = svg(starSVG(i < best ? '#ffd23f' : '#e4e0f0'));
          return s;
        })
      )
    );
    return card;
  });

  const el = h(
    'div',
    { class: 'screen levels' },
    topbar(app, { left: [homeButton(app, homeTarget), starCount(kid.totalStars)] }),
    h(
      'div',
      { class: 'level-row' },
      target === 'battle'
        ? (() => {
            const s = art.vehicle('battleship');
            s.classList.add('level-ship');
            return s;
          })()
        : art.character('penguin', 'blue', { className: 'float level-pip' }),
      ...cards
    )
  );

  const openCount = levels.filter((lv) => lv <= mp.level).length;
  return {
    el,
    enter() {
      document.body.dataset.theme = target === 'battle' ? 'sea' : 'island';
      if (target === 'battle') {
        speech.speak(
          openCount > 1 ? 'Battleship! Pick a level. Bigger numbers are harder.' : 'Battleship! Tap level 1 to start firing!'
        );
        return;
      }
      speech.speak(
        openCount > 1
          ? 'Pick a level! The bigger the number, the harder it is.'
          : 'Tap level 1 to play! Win stars to open the next level.'
      );
    },
  };
}
