// "Who's playing?" — pick a profile by its picture. Plus the add-a-kid form (for a grown-up).
import { h, svg, icons } from './dom.js';
import { art } from '../art/registry.js';
import { starSVG } from '../art/objects.js';
import { topbar, holdButton } from './chrome.js';
import { sfx } from '../audio/sfx.js';
import * as speech from '../audio/speech.js';
import { MAX_KIDS, newKid } from '../logic/progress.js';
import { openParentGate } from './parent.js';

export function render(app) {
  const kids = app.store.kids;
  const cards = kids.map((k) =>
    h(
      'button',
      {
        class: 'kid-card',
        'aria-label': k.name,
        onclick: (e) => {
          sfx.tap();
          app.setKid(k.id);
          app.go('home');
        },
      },
      art.character(k.avatar, k.color),
      h('div', {}, k.name),
      h('div', { class: 'mini-stars' }, svg(starSVG()), String(k.totalStars))
    )
  );
  if (kids.length < MAX_KIDS) {
    cards.push(
      h(
        'button',
        {
          class: 'kid-card add',
          'aria-label': 'Add a player',
          onclick: () => {
            sfx.tap();
            app.go('addKid');
          },
        },
        '+'
      )
    );
  }

  const el = h(
    'div',
    { class: 'screen' },
    topbar(app, { left: [holdButton(() => openParentGate(app))] }),
    h('div', { class: 'kid-grid' }, cards)
  );
  return {
    el,
    enter() {
      speech.speak(kids.length ? 'Who is playing? Tap your picture!' : 'Hi! Ask a grown-up to help you make a player.');
    },
  };
}

export function renderAddKid(app) {
  let avatar = 'penguin';
  let color = 'blue';
  const preview = h('div', { class: 'preview' });
  const colorRow = h('div', { class: 'row' });
  const avatarRow = h('div', { class: 'row' });
  const input = h('input', {
    type: 'text',
    placeholder: 'Name',
    maxlength: '16',
    autocomplete: 'off',
    autocorrect: 'off',
    spellcheck: 'false',
    'aria-label': 'Name',
  });

  function paint() {
    preview.replaceChildren(art.character(avatar, color, { className: 'float' }));
    avatarRow.replaceChildren(
      ...['penguin', 'unicorn'].map((kind) =>
        h(
          'button',
          {
            class: `choice ${kind === avatar ? 'selected' : ''}`,
            'aria-label': kind,
            onclick: () => {
              sfx.tap();
              avatar = kind;
              color = art.variants(kind)[0];
              speech.speak(kind === 'penguin' ? 'Penguin!' : 'Unicorn!', { remember: false });
              paint();
            },
          },
          art.character(kind, art.variants(kind)[0])
        )
      )
    );
    colorRow.replaceChildren(
      ...art.variants(avatar).map((v) =>
        h(
          'button',
          {
            class: `choice ${v === color ? 'selected' : ''}`,
            'aria-label': v,
            onclick: () => {
              sfx.tap();
              color = v;
              paint();
            },
          },
          art.character(avatar, v)
        )
      )
    );
  }
  paint();

  const save = () => {
    const kid = newKid({ name: input.value, avatar, color });
    app.store.kids.push(kid);
    app.save();
    app.setKid(kid.id);
    sfx.correct();
    app.go('home');
  };

  const el = h(
    'div',
    { class: 'screen add-kid' },
    topbar(app, {
      left: app.store.kids.length
        ? [h('button', { class: 'btn btn-round', 'aria-label': 'Back', onclick: () => app.go('kids') }, icons.back())]
        : [],
    }),
    preview,
    input,
    avatarRow,
    colorRow,
    h('button', { class: 'btn btn-primary', 'aria-label': 'Done', onclick: save }, icons.check(), 'Done')
  );
  return {
    el,
    enter() {
      speech.speak('Ask a grown-up to type your name. Then pick a penguin or a unicorn, and a color.');
    },
  };
}
