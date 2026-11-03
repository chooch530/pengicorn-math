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
import { PLAYABLE, ROUND_SIZE } from '../logic/levels.js';
import { recordRound, bandFor } from '../logic/progress.js';
import { questionText, numberQuestionText, praiseText, hintText, countingText, equationText } from '../logic/words.js';

export function render(app, { mode = 'add', level } = {}) {
  const kid = app.kid;
  if (!kid) return app.go('kids');

  const mp = kid.modes[mode];
  // Play the requested level if it's unlocked and built; otherwise the highest one that is.
  const open = PLAYABLE[mode].filter((lv) => lv <= mp.level);
  const lvl = open.includes(level) ? level : Math.max(...open);
  const band = bandFor(kid, mode, lvl);
  // Pictures off (default): just numbers. Pictures still pop in as the hint after a miss.
  const pictures = !!kid.prefs?.pictures;

  const rng = createRng();
  const round = createRound({
    mode,
    level: lvl,
    band,
    rng,
    objectKinds: ['fish', 'snowball'],
    avoidIds: mp.recent || [],
  });

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
    topbar(app, { left: [homeButton(app, 'levels')], center: dots }),
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

  /**
   * Objects for one number. Up to 5: a small cluster (4 = 2x2, 5 = 3+2).
   * Above 5: ten-frames (rows of 5, two rows per frame) so kids can see fives and tens.
   */
  function group(count, kind, arriving) {
    const objs = h('div', { class: 'objects' });
    const add = (parent, i) => {
      const o = art.object(kind, { className: arriving ? 'arrive' : '' });
      if (arriving) o.style.animationDelay = `${0.4 + i * (count > 10 ? 0.07 : 0.15)}s`;
      const wrap = h('div', { class: 'obj-wrap' }, o);
      parent.append(wrap);
      objectEls.push(wrap);
    };
    if (count === 0) {
      const f = h('div', { class: 'frame' }, h('div', { class: 'empty' }));
      f.style.setProperty('--cols', 1);
      objs.append(f);
    } else if (count <= 5) {
      const f = h('div', { class: 'frame' });
      f.style.setProperty('--cols', count <= 3 ? count : count === 4 ? 2 : 3);
      objs.append(f);
      for (let i = 0; i < count; i++) add(f, i);
    } else {
      for (let start = 0; start < count; start += 10) {
        const f = h('div', { class: 'frame tens' });
        f.style.setProperty('--cols', 5);
        objs.append(f);
        for (let i = start; i < Math.min(count, start + 10); i++) add(f, i);
      }
    }
    return h('div', { class: 'group' }, objs, h('div', { class: 'num' }, String(count)));
  }

  /**
   * Keep the problem on ONE line, left to right (A + B = ?), like a normal math problem.
   * Shrinks the pictures (--obj) until that line fits the screen.
   */
  function fit() {
    if (!alive || !el.isConnected) return;
    const fits = () =>
      equation.scrollWidth <= equation.clientWidth + 1 &&
      el.scrollHeight <= el.clientHeight + 1 &&
      el.scrollWidth <= el.clientWidth + 1;
    let size = 110;
    el.style.setProperty('--obj', `${size}px`);
    while (!fits() && size > 12) {
      size = Math.floor(size * 0.92);
      el.style.setProperty('--obj', `${size}px`);
    }
  }

  /** Show the pictures (used as the hint when pictures are off). */
  async function showPictures() {
    if (!equation.classList.contains('pics-off')) return;
    for (const w of objectEls) w.firstElementChild.classList.remove('arrive');
    equation.classList.remove('pics-off');
    equation.classList.add('pics-pop');
    fit();
    await wait(450);
  }

  function paintProblem(p) {
    objectEls = [];
    qmark = h('div', { class: 'qmark' }, '?');
    equation.className = `equation ${pictures ? '' : 'pics-off'}`;
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
    fit();
    if (pictures && p.b > 0) setTimeout(() => alive && sfx.splash(), 400);
  }

  async function nextProblem() {
    const p = nextInRound(round);
    paintDots();
    if (!p) return finish();
    paintProblem(p);
    busy = false;
    speech.speak(pictures ? questionText(p) : numberQuestionText(p));
  }

  async function glowAll({ tags = false } = {}) {
    const step = objectEls.length > 10 ? (tags ? 380 : 180) : tags ? 520 : 320;
    for (let i = 0; i < objectEls.length; i++) {
      if (!alive) return;
      const w = objectEls[i];
      const o = w.firstElementChild;
      o.classList.add('glow');
      if (tags) w.append(h('div', { class: 'count-tag' }, String(i + 1)));
      sfx.count(i % 12);
      await wait(step);
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
      await showPictures();
      await wait(300);
      await glowAll();
      busy = false;
      return;
    }

    // reveal: show the answer, count it out together, move on. No penalty screen.
    for (const b of answers.children) {
      if (Number(b.textContent) === p.answer) b.classList.add('reveal');
      b.disabled = true;
    }
    await showPictures();
    await wait(300);
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
    const { kid: updated, leveledUp } = recordRound(app.kid, mode, lvl, summary);
    app.updateKid(updated);
    app.go('reward', { summary, leveledUp, mode, level: lvl, newLevel: updated.modes[mode].level });
  }

  let resizeTimer;
  const onResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(fit, 120);
  };

  return {
    el,
    enter() {
      document.body.dataset.theme = 'island';
      addEventListener('resize', onResize);
      addEventListener('orientationchange', onResize);
      nextProblem();
    },
    cleanup() {
      alive = false;
      removeEventListener('resize', onResize);
      removeEventListener('orientationchange', onResize);
    },
  };
}
