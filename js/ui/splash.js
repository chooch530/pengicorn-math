// First screen. Its one job: get a tap so iOS lets us play speech and sound.
import { h, icons } from './dom.js';
import { art } from '../art/registry.js';

export function render(app) {
  const penguin = art.character('penguin', 'blue', { className: 'float' });
  const unicorn = art.character('unicorn', 'rainbow', { className: 'float' });
  unicorn.style.animationDelay = '0.6s';

  const start = () => {
    app.unlockAudio();
    app.go(app.store.kids.length ? 'kids' : 'addKid');
  };

  const el = h(
    'div',
    { class: 'screen splash' },
    h('div', { class: 'hero' }, penguin, unicorn),
    h('h1', {}, 'Pengicorn Math'),
    h('button', { class: 'btn btn-round btn-primary btn-big bounce-in', 'aria-label': 'Play', onclick: start }, icons.play())
  );
  return { el };
}
