// Penguin Island round: 10 addition problems with countable objects.
// All decisions (what's right, hints, difficulty) come from logic/round.js;
// this file only draws and plays sounds.
import { h, wait, animate } from './dom.js';
import { art } from '../art/registry.js';
import { topbar, homeButton } from './chrome.js';
import { sfx } from '../audio/sfx.js';
import * as speech from '../audio/speech.js';
import { createRng } from '../logic/rng.js';
import { createRound, nextInRound, answer, roundSummary } from '../logic/round.js';
import { LEVELS, PLAYABLE, ROUND_SIZE } from '../logic/levels.js';
import { recordRound } from '../logic/progress.js';
import { questionText, praiseText, hintText, countingText, equationText } from '../logic/words.js';

export function render(app, { mode = 'add' } = {}) {
  const kid = app.kid;
  if (!kid) return app.go('kids');

  // Only Level 1 is built. A kid who has earned Level 2 keeps playing L1 at the top band.
  const mp = kid.modes[mode];
  const maxPlayable = Math.max(...PLAYABLE[mode]);
  const level = Math.min(mp.level, maxPlayable);
  const numBands = LEVELS[mode][level].bands.length;
  const band = mp.level > level ? numBands - 1 : Math.min(mp.band, numBands - 1);

  const rng = createRng();
  const round = createRound({ mode, level, band, rng, objectKinds: ['fish', 'snowball'] });

  const pip = art.character('penguin', 'blue');
  const dots = h('div', { class: 'dots' });
  const equation = h('div', { class: 'equation' });
  const answers = h('div', { class: 'answers' });
  let objectEls = [];
  let qmark;
  let busy = false;
  let alive = true;

  const el = h(
    'div',
    { class: 'screen play' },
    topbar(app, { left: [homeButton(app)] }),
    dots,
    h('div', { class: 'pip-spot' }, pip),
    equation,
    answers
  );

  function paintDots() {
    dots.replaceChildren(
      ...Array.from({ length: ROUND_SIZE }, (_, i) =>
        h('span', { class: i < round.index ? 'done' : i === round.index ? 'now' : '' })
      )
    );
  }

  function group(count, kind, arriving) {
    // 4 -> 2x2, 5 -> 3+2, 6 -> 3x2; larger counts (later levels) use rows of 5.
    const cols = count <= 3 ? Math.max(count, 1) : count === 4 ? 2 : count <= 6 ? 3 : 5;
    const objs = h('div', { class: 'objects' });
    objs.style.setProperty('--cols', cols);
    if (count === 0) objs.append(h('div', { class: 'empty' }));
    for (let i = 0; i < count; i++) {
      const o = art.object(kind, { className: arriving ? 'arrive' : '' });
      if (arriving) o.style.animationDelay = `${0.4 + i * 0.18}s`;
      const wrap = h('div', { class: 'obj-wrap' }, o);
      objs.append(wrap);
      objectEls.push(wrap);
    }
    return h('div', { class: 'group' }, objs, h('div', { class: 'num' }, String(count)));
  }

  function paintProblem(p) {
    objectEls = [];
    qmark = h('div', { class: 'qmark' }, '?');
    equation.replaceChildren(
      group(p.a, p.objectKind, false),
      h('div', { class: 'sym' }, '+'),
      group(p.b, p.objectKind, true),
      h('div', { class: 'sym' }, '='),
      qmark
    );
    answers.replaceChildren(
      ...round.choices.map((value) => {
        const b = h('button', { class: 'btn answer', 'aria-label': String(value) }, String(value));
        b.addEventListener('click', () => onAnswer(b, value));
        return b;
      })
    );
    if (p.b > 0) setTimeout(() => alive && sfx.splash(), 400);
  }

  async function nextProblem() {
    const p = nextInRound(round);
    paintDots();
    if (!p) return finish();
    paintProblem(p);
    busy = false;
    speech.speak(questionText(p));
  }

  async function glowAll({ tags = false } = {}) {
    for (let i = 0; i < objectEls.length; i++) {
      if (!alive) return;
      const w = objectEls[i];
      const o = w.firstElementChild;
      o.classList.add('glow');
      if (tags) w.append(h('div', { class: 'count-tag' }, String(i + 1)));
      sfx.count(i);
      await wait(tags ? 520 : 320);
      if (!tags) o.classList.remove('glow');
    }
  }

  async function onAnswer(btn, value) {
    if (busy) return;
    busy = true;
    const p = round.problem;
    const res = answer(round, value);

    if (res.outcome === 'correct') {
      speech.stop();
      sfx.correct();
      btn.classList.add('right');
      qmark.textContent = String(p.answer);
      qmark.classList.add('solved');
      animate(pip, 'bounce', 700);
      for (const w of objectEls) animate(w.firstElementChild, 'bounce', 700);
      await speech.speak(praiseText(p, rng), { remember: false });
      await wait(300);
      if (alive) nextProblem();
      return;
    }

    sfx.tryAgain();
    btn.classList.add('tried');
    btn.disabled = true;
    animate(btn, 'wiggle', 500);

    if (res.outcome === 'hint') {
      speech.speak(hintText(p));
      await wait(600);
      await glowAll();
      busy = false;
      return;
    }

    // reveal: show the answer, count it out together, move on. No penalty screen.
    for (const b of answers.children) {
      if (Number(b.textContent) === p.answer) b.classList.add('reveal');
      b.disabled = true;
    }
    await wait(500);
    const counting = speech.speak(`Let's count. ${countingText(p.answer)}`, { remember: false });
    await wait(700);
    await glowAll({ tags: true });
    await counting;
    if (!alive) return;
    qmark.textContent = String(p.answer);
    qmark.classList.add('solved');
    await speech.speak(equationText(p), { remember: false });
    await wait(400);
    if (alive) nextProblem();
  }

  function finish() {
    const summary = roundSummary(round);
    const { kid: updated, leveledUp } = recordRound(app.kid, mode, level, summary);
    app.updateKid(updated);
    app.go('reward', { summary, leveledUp, mode });
  }

  return {
    el,
    enter() {
      document.body.dataset.theme = 'island';
      nextProblem();
    },
    cleanup() {
      alive = false;
    },
  };
}
