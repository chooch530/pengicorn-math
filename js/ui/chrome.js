// Shared screen pieces: top bar (home / replay / mute), star counter, hold-to-open button.
import { h, icons, svg } from './dom.js';
import { starSVG } from '../art/objects.js';
import * as speech from '../audio/speech.js';
import { sfx, isMuted } from '../audio/sfx.js';

export function starCount(n) {
  return h('div', { class: 'star-count', 'aria-label': `${n} stars` }, svg(starSVG()), String(n));
}

export function replayButton() {
  return h(
    'button',
    {
      class: 'btn btn-round',
      'aria-label': 'Say it again',
      onclick: () => {
        sfx.tap();
        speech.replay();
      },
    },
    icons.replay()
  );
}

export function muteButton(app) {
  const btn = h('button', { class: 'btn btn-round', 'aria-label': 'Sound effects on or off' }, icons.sound());
  const paint = () => {
    btn.classList.toggle('muted-on', isMuted());
    btn.classList.toggle('muted-off', !isMuted());
  };
  btn.addEventListener('click', () => {
    app.setMuted(!isMuted());
    paint();
    sfx.tap();
  });
  paint();
  return btn;
}

export function homeButton(app, target = 'home') {
  return h(
    'button',
    {
      class: 'btn btn-round',
      'aria-label': 'Home',
      onclick: () => {
        sfx.tap();
        app.go(target);
      },
    },
    icons.home()
  );
}

export function topbar(app, { left = [], right = [] } = {}) {
  return h('div', { class: 'topbar' }, ...left, h('div', { class: 'spacer' }), ...right, replayButton(), muteButton(app));
}

/**
 * Button that only fires after being held for `ms`. Shows a filling ring.
 * Used to keep kids out of the parent area.
 */
export function holdButton(onDone, { ms = 3000, label = 'Grown-ups: hold for 3 seconds' } = {}) {
  const ring = h('div', { class: 'ring' });
  const btn = h('button', { class: 'hold-btn', 'aria-label': label }, ring, icons.gear());
  let start = 0;
  let raf = 0;
  const reset = () => {
    cancelAnimationFrame(raf);
    start = 0;
    ring.style.setProperty('--p', 0);
  };
  const tick = (now) => {
    const p = Math.min(100, ((now - start) / ms) * 100);
    ring.style.setProperty('--p', p);
    if (p >= 100) {
      reset();
      onDone();
    } else raf = requestAnimationFrame(tick);
  };
  btn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    start = performance.now();
    raf = requestAnimationFrame(tick);
  });
  for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) btn.addEventListener(ev, reset);
  btn.addEventListener('contextmenu', (e) => e.preventDefault());
  return btn;
}
