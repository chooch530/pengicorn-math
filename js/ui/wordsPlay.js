// Words mode round: the voice says a sight word, the kid taps it from 3 word cards.
// Decisions (right/wrong, hints, difficulty) come from logic/sight.js; this file draws and talks.
import { h, wait, animate, icons } from './dom.js';
import { art } from '../art/registry.js';
import { topbar, homeButton } from './chrome.js';
import { sfx } from '../audio/sfx.js';
import * as speech from '../audio/speech.js';
import { createRng } from '../logic/rng.js';
import { createSightRound, nextInSightRound, answerSight, sightSummary, findList, BUILTIN_LISTS } from '../logic/sight.js';
import { activeListId, recordWordRound } from '../logic/progress.js';
import { findWordText, wordHintText, wordRevealText, wordPraiseText, pirateIntroText, pirateHitText, battleMissText, pirateSunkText, pirateEscapeText } from '../logic/words.js';
import { createBattle, shoot, isSunk } from '../logic/battle.js';
import { createBattleScene } from './battleScene.js';

// battle=true: the pirate-ship version. Right words (any try) fire the cannon; a full miss splashes.
export function render(app, { battle = false } = {}) {
  const kid = app.kid;
  if (!kid) return app.go('kids');

  const listId = activeListId(kid, app.store.lists);
  const list = findList(listId, app.store.lists) || BUILTIN_LISTS[0];
  const mw = kid.modes.words;
  const rng = createRng();
  const round = createSightRound({
    words: list.words,
    band: mw.band || 0,
    rng,
    avoid: mw.recent || [],
  });

  const scene = battle ? createBattleScene(kid, { theme: 'pirate' }) : null;
  let fleet = battle ? createBattle(rng) : null;
  const hero = battle ? scene.el : art.character(kid.avatar, kid.color);
  const dots = h('div', { class: 'dots' });
  const cards = h('div', { class: 'word-cards' });
  const hear = h('button', { class: 'btn btn-round hear-btn', 'aria-label': 'Hear the word' }, icons.replay());
  let busy = false;
  let alive = true;

  hear.addEventListener('click', () => {
    if (!round.problem) return;
    sfx.tap();
    animate(hear, 'bounce', 600);
    speech.speak(round.problem.word, { remember: false });
  });

  const el = h(
    'div',
    { class: `screen words-play${battle ? ' battle' : ''}` },
    topbar(app, { left: [homeButton(app, 'wordsMenu')], center: dots }),
    h('div', { class: 'words-hero' }, hero, hear),
    cards
  );

  function paintDots() {
    dots.replaceChildren(
      ...round.queue.map((_, i) => h('span', { class: i < round.index ? 'done' : i === round.index ? 'now' : '' }))
    );
  }

  /** Shrink the word font until every card fits. */
  function fit() {
    if (!alive || !el.isConnected) return;
    let size = 120;
    const over = () =>
      el.scrollHeight > el.clientHeight + 1 ||
      [...cards.children].some((c) => c.scrollWidth > c.clientWidth + 1);
    el.style.setProperty('--word', `${size}px`);
    while (over() && size > 28) {
      size = Math.floor(size * 0.92);
      el.style.setProperty('--word', `${size}px`);
    }
  }

  function paint() {
    cards.replaceChildren(
      ...round.choices.map((w) => {
        const b = h('button', { class: 'btn word-card', 'aria-label': w }, h('span', { class: 'word-text' }, w));
        b.addEventListener('click', () => onAnswer(b, w));
        return b;
      })
    );
    fit();
  }

  function next() {
    const p = nextInSightRound(round);
    paintDots();
    if (!p) return finish();
    paint();
    busy = false;
    speech.speak(findWordText(p.word));
  }

  async function onAnswer(btn, value) {
    if (busy) return;
    busy = true;
    const w = round.problem.word;
    const res = answerSight(round, value);

    if (res.outcome === 'correct') for (const b of cards.children) b.disabled = true;

    if (res.outcome === 'correct' && battle) {
      speech.stop();
      btn.classList.add('right');
      const shot = shoot(fleet, true);
      fleet = shot.battle;
      await scene.fire(true, shot.part);
      await speech.speak(pirateHitText(w, rng), { remember: false });
      await wait(200);
      if (alive) next();
      return;
    }

    if (res.outcome === 'correct') {
      speech.stop();
      sfx.correct();
      btn.classList.add('right');
      animate(hero, 'bounce', 700);
      await speech.speak(wordPraiseText(w, rng), { remember: false });
      await wait(250);
      if (alive) next();
      return;
    }

    sfx.tryAgain();
    btn.classList.add('tried');
    btn.disabled = true;
    animate(btn, 'wiggle', 500);

    if (res.outcome === 'hint') {
      animate(hear, 'bounce', 600);
      await speech.speak(wordHintText(w), { remember: false });
      busy = false;
      return;
    }

    // reveal
    for (const b of cards.children) {
      if (b.getAttribute('aria-label') === w) b.classList.add('reveal');
      b.disabled = true;
    }
    await wait(300);
    await speech.speak(wordRevealText(w), { remember: false });
    if (battle && alive) {
      fleet = shoot(fleet, false).battle;
      await scene.fire(false);
      await speech.speak(battleMissText(), { remember: false });
    }
    await wait(500);
    if (alive) next();
  }

  async function finish() {
    const summary = sightSummary(round);
    const updated = recordWordRound(app.kid, list.id, summary);
    app.updateKid(updated);
    const rewardParams = { summary, mode: 'words', homeTarget: 'wordsMenu', playTarget: battle ? 'wordsBattle' : 'words' };
    if (battle) {
      busy = true;
      cards.replaceChildren();
      const sunk = isSunk(fleet);
      const line = speech.speak(sunk ? pirateSunkText() : pirateEscapeText(fleet.hits.length), { remember: false });
      await scene.finale(sunk);
      await line;
      if (!alive) return;
    }
    app.go('reward', rewardParams);
  }

  let t;
  const onResize = () => {
    clearTimeout(t);
    t = setTimeout(fit, 120);
  };

  return {
    el,
    enter() {
      document.body.dataset.theme = battle ? 'sunset' : 'meadow';
      addEventListener('resize', onResize);
      if (battle) speech.speak(pirateIntroText(), { remember: false }).then(() => alive && next());
      else next();
    },
    cleanup() {
      alive = false;
      removeEventListener('resize', onResize);
    },
  };
}
