import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../js/logic/rng.js';
import { makeChoices } from '../js/logic/distractors.js';

test('choices: 3 distinct, include answer, close, in range', () => {
  for (let seed = 1; seed <= 200; seed++) {
    const rng = createRng(seed);
    for (const max of [5, 10, 20]) {
      for (let ans = 0; ans <= max; ans++) {
        const c = makeChoices(ans, rng, { min: 0, max });
        assert.equal(c.length, 3);
        assert.equal(new Set(c).size, 3, `dupes for ${ans}: ${c}`);
        assert.ok(c.includes(ans));
        for (const n of c) {
          assert.ok(n >= 0 && n <= max, `${n} out of range`);
          assert.ok(Math.abs(n - ans) <= 2, `${n} not close to ${ans}`);
        }
      }
    }
  }
});

test('right answer is not always the middle number or the same slot', () => {
  const rng = createRng(42);
  const rank = [0, 0, 0];
  const slot = [0, 0, 0];
  for (let i = 0; i < 3000; i++) {
    const c = makeChoices(3, rng, { min: 0, max: 10 });
    rank[[...c].sort((a, b) => a - b).indexOf(3)]++;
    slot[c.indexOf(3)]++;
  }
  for (const n of [...rank, ...slot]) assert.ok(n > 800, `skewed: rank ${rank} slot ${slot}`);
});

test('buttons are never in sorted order and are often not consecutive', () => {
  const rng = createRng(7);
  let gappy = 0;
  for (let i = 0; i < 3000; i++) {
    const c = makeChoices(rng.int(2, 18), rng, { min: 0, max: 20 });
    const up = c[0] < c[1] && c[1] < c[2];
    const down = c[0] > c[1] && c[1] > c[2];
    assert.ok(!up && !down, `sorted: ${c}`);
    const s = [...c].sort((a, b) => a - b);
    if (s[2] - s[0] > 2) gappy++;
  }
  assert.ok(gappy > 700, `only ${gappy} non-consecutive sets`);
});
