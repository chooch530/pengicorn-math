import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../js/logic/rng.js';
import { additionPool, nextProblem } from '../js/logic/problems.js';
import { LEVELS, ROUND_SIZE } from '../js/logic/levels.js';
import { createRound, nextInRound, answer } from '../js/logic/round.js';

const SEEDS = Array.from({ length: 300 }, (_, i) => i + 1);

test('addition pool: no negatives, sums inside band, no 0+0', () => {
  for (const [level, cfg] of Object.entries(LEVELS.add)) {
    for (const [lo, hi] of cfg.bands) {
      const pool = additionPool(lo, hi);
      assert.ok(pool.length > 0, `level ${level} band ${lo}-${hi} empty`);
      for (const p of pool) {
        assert.ok(p.a >= 0 && p.b >= 0, `negative operand in ${p.id}`);
        assert.ok(p.answer >= lo && p.answer <= hi, `${p.id} outside ${lo}-${hi}`);
        assert.ok(p.answer <= cfg.maxAnswer);
        assert.notEqual(p.id, '0+0');
      }
    }
  }
});

test('level 1 has enough unique problems for a full round', () => {
  assert.ok(additionPool(1, LEVELS.add[1].maxAnswer).length >= ROUND_SIZE);
});

test('nextProblem stays in level range for every band', () => {
  for (const seed of SEEDS) {
    const rng = createRng(seed);
    for (const [level, cfg] of Object.entries(LEVELS.add)) {
      for (let band = 0; band < cfg.bands.length; band++) {
        const p = nextProblem({ mode: 'add', level: Number(level), band, usedIds: new Set(), rng });
        const [lo, hi] = cfg.bands[band];
        assert.ok(p.answer >= lo && p.answer <= hi);
        assert.ok(p.answer >= 0);
      }
    }
  }
});

// Simulate whole rounds with random answering so the band moves up and down.
function playRound(seed, level, startBand, answerStyle) {
  const rng = createRng(seed);
  const kidRng = createRng(seed * 7919);
  const r = createRound({ mode: 'add', level, band: startBand, rng, objectKinds: ['fish'] });
  const seen = [];
  while (nextInRound(r)) {
    seen.push(r.problem);
    let res;
    do {
      const pick =
        answerStyle === 'perfect'
          ? r.problem.answer
          : answerStyle === 'wrong'
            ? r.choices.find((c) => c !== r.problem.answer)
            : kidRng.pick(r.choices);
      res = answer(r, pick);
    } while (res.outcome === 'hint');
  }
  return { r, seen };
}

test('no repeat problems in a round (all levels, all start bands, any answering)', () => {
  for (const seed of SEEDS) {
    for (const level of [1, 2, 3]) {
      for (const startBand of [0, 1, 2]) {
        for (const style of ['perfect', 'wrong', 'random']) {
          const { seen } = playRound(seed, level, startBand, style);
          assert.equal(seen.length, ROUND_SIZE);
          const ids = seen.map((p) => p.id);
          assert.equal(new Set(ids).size, ids.length, `repeat in seed ${seed} L${level}: ${ids}`);
        }
      }
    }
  }
});

test('round problems never have negative answers and stay within the level max', () => {
  for (const seed of SEEDS) {
    for (const level of [1, 2, 3]) {
      const { seen } = playRound(seed, level, 0, 'random');
      for (const p of seen) {
        assert.ok(p.answer >= 0 && p.a >= 0 && p.b >= 0);
        assert.ok(p.answer <= LEVELS.add[level].maxAnswer);
      }
    }
  }
});

test('a miss gives a hint, a second miss reveals', () => {
  const r = createRound({ mode: 'add', level: 1, rng: createRng(5) });
  nextInRound(r);
  const wrong = r.choices.filter((c) => c !== r.problem.answer);
  assert.equal(answer(r, wrong[0]).outcome, 'hint');
  assert.equal(answer(r, wrong[1]).outcome, 'reveal');
  assert.equal(r.log[0].firstTry, false);
});

test('next round avoids last round\'s problems when it can', () => {
  for (const seed of SEEDS.slice(0, 100)) {
    for (const level of [2, 3]) {
      const first = createRound({ mode: 'add', level, band: 1, rng: createRng(seed) });
      const ids = [];
      while (nextInRound(first)) { ids.push(first.problem.id); answer(first, first.problem.answer); }
      const second = createRound({ mode: 'add', level, band: 1, rng: createRng(seed + 1), avoidIds: ids });
      let overlap = 0;
      while (nextInRound(second)) { if (ids.includes(second.problem.id)) overlap++; answer(second, second.problem.answer); }
      assert.equal(overlap, 0, `L${level} seed ${seed} repeated ${overlap} from last round`);
    }
  }
});

test('level 3 problems can reach 20 and stay non-negative', () => {
  const answers = new Set();
  for (const seed of SEEDS) {
    const rng = createRng(seed);
    const p = nextProblem({ mode: 'add', level: 3, band: 2, usedIds: new Set(), rng });
    answers.add(p.answer);
    assert.ok(p.a >= 0 && p.b >= 0 && p.answer <= 20 && p.answer >= 12);
  }
  assert.ok(answers.has(20));
});

test('rounds are mixed: no back-to-back same answer or first number, answers not climbing in order', () => {
  let climbing = 0;
  for (const seed of SEEDS) {
    for (const level of [1, 2, 3]) {
      const r = createRound({ mode: 'add', level, band: 0, rng: createRng(seed) });
      const seen = [];
      while (nextInRound(r)) { seen.push(r.problem); answer(r, r.problem.answer); }
      for (let i = 1; i < seen.length; i++) {
        if (level > 1) {
          assert.notEqual(seen[i].answer, seen[i - 1].answer, `L${level} seed ${seed}: same answer twice in a row`);
          assert.notEqual(seen[i].a, seen[i - 1].a, `L${level} seed ${seed}: same first number twice in a row`);
        }
      }
      const ups = seen.slice(1).filter((p, i) => p.answer > seen[i].answer).length;
      if (ups >= 8) climbing++;
    }
  }
  assert.ok(climbing < 5, `${climbing} rounds climbed in order`);
});

test('easiest band still includes the biggest sums of the level', () => {
  for (const level of [1, 2, 3]) {
    const [lo, hi] = LEVELS.add[level].bands[0];
    assert.equal(hi, LEVELS.add[level].maxAnswer);
    assert.ok(lo <= LEVELS.add[level].maxAnswer / 2 + 1);
  }
});
