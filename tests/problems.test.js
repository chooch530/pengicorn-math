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
