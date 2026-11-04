// First screen: pick the game (Math or Words). The tap also unlocks speech and sound on iOS.
// Next: pick a player, then straight into the chosen game.
import { h } from './dom.js';
import { art } from '../art/registry.js';

export function render(app) {
  const pick = (mode) => () => {
    app.unlockAudio();
    app.mode = mode;
    app.go(app.store.kids.length ? 'kids' : 'addKid');
  };

  const card = (cls, label, glyph, character, onTap) =>
    h(
      'button',
      { class: `mode-card ${cls}`, 'aria-label': label, onclick: onTap },
      h('div', { class: 'mode-glyph' }, glyph),
      character
    );

  const unicorn = art.character('unicorn', 'rainbow', { className: 'float' });
  unicorn.style.animationDelay = '0.6s';

  const el = h(
    'div',
    { class: 'screen splash' },
    h('h1', {}, 'Pengicorn'),
    h(
      'div',
      { class: 'mode-row' },
      card('mode-math', 'Math', '1+2', art.character('penguin', 'blue', { className: 'float' }), pick('math')),
      card('mode-words', 'Words', 'abc', unicorn, pick('words')),
      card('mode-battle', 'Battleship', 'BOOM', art.vehicle('battleship'), pick('battle'))
    )
  );
  return { el };
}
