// Heroes world: subtraction, mixed + and -, the Hero Path, and its spoken lines.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../js/logic/rng.js';
import { subtractionPool, nextProblem } from '../js/logic/problems.js';
import { LEVELS, ROUND_SIZE } from '../js/logic/levels.js';
import { createRound, nextInRound, answer } from '../js/logic/round.js';
import { PATH, isOpen, currentStop, finishStop, isComplete, openAll, newPathProgress } from '../js/logic/path.js';
import { newKid, normalizeKid, recordPathStop, unlockEverything, setTeam, recordRound } from '../js/logic/progress.js';
import { numberQuestionText, equationText, hintText, questionText, rescueEscapeText, rescueWinText, rescueIntroText } from '../js/logic/words.js';
import { makeChoices } from '../js/logic/distractors.js';

const SEEDS = Array.from({ length: 200 }, (_, i) => i + 1);

test('subtraction pool: never negative, first number inside band', () => {
  for (const cfg of Object.values(LEVELS.sub)) {
    for (const [lo, hi] of cfg.bands) {
      const pool = subtractionPool(lo, hi);
      assert.ok(pool.length >= ROUND_SIZE);
      for (const p of pool) {
        assert.ok(p.answer >= 0 && p.b >= 0 && p.b <= p.a, p.id);
        assert.ok(p.a >= lo && p.a <= hi, p.id);
        assert.equal(p.op, '-');
        assert.equal(p.answer, p.a - p.b);
      }
    }
  }
});

for (const mode of ['sub', 'mix']) {
  test(`${mode} rounds: 10 unique problems, answers in range, choices never negative`, () => {
    for (const seed of SEEDS) {
      for (const level of [1, 2, 3]) {
        const rng = createRng(seed);
        const r = createRound({ mode, level, band: seed % 3, rng, objectKinds: ['star'] });
        const ids = new Set();
        for (let i = 0; i < ROUND_SIZE; i++) {
          const p = nextInRound(r);
          assert.ok(!ids.has(p.id), `repeat ${p.id}`);
          ids.add(p.id);
          assert.ok(p.answer >= 0 && p.answer <= LEVELS[mode][level].maxAnswer, p.id);
          assert.ok(p.a <= LEVELS[mode][level].maxAnswer, p.id);
          for (const c of r.choices) assert.ok(c >= 0);
          assert.ok(r.choices.includes(p.answer));
          answer(r, p.answer);
        }
        assert.equal(nextInRound(r), null);
      }
    }
  });
}

test('mixed rounds use both + and -', () => {
  let plus = 0;
  let minus = 0;
  for (const seed of SEEDS) {
    const p = nextProblem({ mode: 'mix', level: 2, band: 0, usedIds: new Set(), rng: createRng(seed) });
    if (p.op === '-') minus++;
    else plus++;
  }
  assert.ok(plus > 60 && minus > 60, `plus ${plus}, minus ${minus}`);
});

test('subtraction answers 0 are possible but not dominant', () => {
  let zeros = 0;
  for (const seed of SEEDS) {
    const p = nextProblem({ mode: 'sub', level: 1, band: 0, usedIds: new Set(), rng: createRng(seed) });
    if (p.answer === 0) zeros++;
  }
  assert.ok(zeros < SEEDS.length * 0.3, `${zeros} zero answers`);
});

test('distractors work for a 0 answer', () => {
  const c = makeChoices(0, createRng(3), { min: 0, max: 5 });
  assert.equal(c.length, 3);
  assert.ok(c.includes(0) && c.every((n) => n >= 0));
});

test('path: 24 stops, 3 chapters, every skill in every chapter', () => {
  assert.equal(PATH.length, 24);
  for (const ch of [1, 2, 3]) {
    const skills = new Set(PATH.filter((s) => s.chapter === ch).map((s) => s.skill));
    assert.deepEqual([...skills].sort(), ['add', 'mix', 'sub', 'words']);
  }
  for (const s of PATH) {
    if (s.skill === 'words') assert.equal(s.level, null);
    else assert.ok(LEVELS[s.skill][s.level], s.id);
  }
  assert.equal(new Set(PATH.map((s) => s.id)).size, PATH.length);
});

test('path: finishing the current stop opens the next; replays never skip ahead', () => {
  let p = newPathProgress();
  assert.ok(isOpen(p, 0));
  assert.ok(!isOpen(p, 1));
  p = finishStop(p, 0, 1);
  assert.equal(p.done, 1);
  assert.ok(isOpen(p, 1));
  p = finishStop(p, 0, 3); // replay: better stars, no skip
  assert.equal(p.done, 1);
  assert.equal(p.stars[0], 3);
  p = finishStop(p, 0, 2); // worse replay keeps best
  assert.equal(p.stars[0], 3);
  assert.equal(currentStop(p), 1);
  const all = openAll(p);
  assert.ok(isComplete(all));
  assert.equal(currentStop(all), PATH.length - 1);
  assert.ok(isOpen(all, PATH.length - 1));
  assert.ok(!isOpen(all, PATH.length));
  assert.equal(finishStop(all, PATH.length - 1, 3).done, PATH.length);
});

test('kids: old saves get path progress, team, sub and mix modes', () => {
  const old = { id: 'k1', name: 'A', avatar: 'penguin', color: 'blue', totalStars: 4, modes: { add: { level: 2, bands: { 1: 2 } } }, stats: {}, prefs: { pictures: true } };
  const k = normalizeKid(old);
  assert.deepEqual(k.modes.path, { done: 0, stars: {} });
  assert.equal(k.prefs.team, null);
  assert.equal(k.prefs.pictures, true);
  assert.equal(k.modes.sub.level, 1);
  assert.equal(k.modes.mix.level, 1);
  assert.equal(k.modes.add.level, 2);
  assert.equal(setTeam(k, 'unicorn').prefs.team, 'unicorn');
  assert.equal(setTeam(k, 'anything').prefs.team, 'hero');
});

test('recordPathStop and unlockEverything', () => {
  let k = newKid({ name: 'B', avatar: 'unicorn', color: 'pink' });
  k = recordPathStop(k, 0, 2);
  assert.equal(k.modes.path.done, 1);
  assert.equal(k.modes.path.stars[0], 2);
  const u = unlockEverything(k);
  assert.equal(u.modes.path.done, PATH.length);
  for (const m of ['add', 'sub', 'mix']) assert.equal(u.modes[m].level, 3);
});

test('subtraction rounds record stats under their own mode', () => {
  const k = newKid({ name: 'C', avatar: 'penguin', color: 'blue' });
  const summary = { stars: 2, firstTryCorrect: 7, total: 10, endBand: 1, numBands: 3, log: [{ id: '5-2', firstTry: false, misses: 1, band: 0 }] };
  const { kid } = recordRound(k, 'sub', 1, summary);
  assert.equal(kid.stats.sub.problems, 1);
  assert.equal(kid.stats.sub.missed['5-2'], 1);
  assert.equal(kid.stats.add.problems, 0);
});

test('spoken text for subtraction says minus, never a symbol', () => {
  const p = { a: 5, b: 2, op: '-', answer: 3, objectKind: 'star' };
  assert.equal(numberQuestionText(p), 'What is 5 minus 2?');
  assert.equal(equationText(p), '5 minus 2 is 3.');
  assert.match(hintText(p), /take away 2/);
  assert.equal(questionText(p, 'Sparkle'), 'Sparkle has 5 stars. 2 fly away. How many stars are left?');
  assert.equal(questionText({ ...p, b: 0, answer: 5 }, 'Sparkle'), 'Sparkle has 5 stars. None fly away. How many stars are left?');
  assert.equal(numberQuestionText({ a: 1, b: 2, op: '+', answer: 3 }), 'What is 1 plus 2?');
  assert.match(rescueEscapeText(1), /saved 1 friend\./);
  assert.match(rescueEscapeText(7), /saved 7 friends/);
  assert.match(rescueWinText('unicorn'), /super unicorn/);
  assert.match(rescueIntroText('hero', true), /right word/);
});
