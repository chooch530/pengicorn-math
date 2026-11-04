// End of round: 1–3 stars, confetti, dancing penguin. Never a "you failed" screen.
import { h, svg, icons, wait } from './dom.js';
import { art } from '../art/registry.js';
import { starSVG } from '../art/objects.js';
import { topbar, homeButton, starCount } from './chrome.js';
import { sfx } from '../audio/sfx.js';
import * as speech from '../audio/speech.js';
import { confetti } from './confetti.js';

export function render(app, { summary, leveledUp, mode = 'add', level = 1, newLevel = level, homeTarget = 'levels', playTarget = 'play' }) {
  // After unlocking a level, the big Play button goes straight to the new one.
  const nextLevel = leveledUp ? newLevel : level;
  const kid = app.kid;
  const slots = [0, 1, 2].map(() => h('div', { class: 'slot' }, svg(starSVG())));
  // Math: Pip dances. Words: the kid's own character dances.
  const pip = mode === 'words' || mode === 'battle' ? art.character(kid.avatar, kid.color, { className: 'dance' }) : art.character('penguin', 'blue', { className: 'dance' });
  let alive = true;
  let stopConfetti = () => {};

  const el = h(
    'div',
    { class: 'screen reward' },
    topbar(app, { left: [homeButton(app, homeTarget), starCount(kid.totalStars)] }),
    h('div', { class: 'big-stars' }, slots),
    h('div', { class: 'pip-dance' }, pip),
    h(
      'div',
      { class: 'actions' },
      h(
        'button',
        {
          class: 'btn btn-round btn-primary btn-big',
          style: { width: '160px', height: '160px' },
          'aria-label': 'Play again',
          onclick: () => {
            sfx.tap();
            app.go(playTarget, { mode: mode === 'battle' ? 'add' : mode, level: nextLevel });
          },
        },
        icons.play()
      )
    )
  );

  const starWord = summary.stars === 1 ? 'star' : 'stars';
  const line =
    `Great job, ${kid.name}! You earned ${summary.stars} ${starWord}!` +
    (leveledUp
      ? ` Wow! You opened level ${newLevel}! Tap the green button to try it.`
      : ' Tap the green button to play again.');

  return {
    el,
    async enter() {
      sfx.fanfare();
      stopConfetti = confetti();
      await wait(500);
      for (let i = 0; i < summary.stars; i++) {
        if (!alive) return;
        slots[i].classList.add('earned');
        sfx.star(i);
        await wait(450);
      }
      if (alive) speech.speak(line);
    },
    cleanup() {
      alive = false;
      stopConfetti();
    },
  };
}
