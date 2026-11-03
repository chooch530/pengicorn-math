// Problem generation. Pure functions, no DOM.
import { levelConfig } from './levels.js';

/** Every addition problem a + b with both operands >= 0 and lo <= sum <= hi. 0 + 0 is excluded. */
export function additionPool(lo, hi) {
  const pool = [];
  for (let sum = Math.max(lo, 1); sum <= hi; sum++) {
    for (let a = 0; a <= sum; a++) pool.push(makeAddition(a, sum - a));
  }
  return pool;
}

export function makeAddition(a, b) {
  return {
    id: `${a}+${b}`,
    mode: 'add',
    a,
    b,
    op: '+',
    answer: a + b,
  };
}

/**
 * Pick the next problem for a round.
 * Draws from the current band, never repeating anything in `usedIds`,
 * and avoiding `avoidIds` (last round's problems) when the band has other options.
 * If the band is exhausted, falls back to the whole level so a round never repeats.
 */
export function nextProblem({ mode, level, band, usedIds, rng, objectKinds = ['fish'], avoidIds = new Set(), prev = null }) {
  const cfg = levelConfig(mode, level);
  const [lo, hi] = cfg.bands[band];
  const fresh = (p) => !usedIds.has(p.id);

  let candidates = additionPool(lo, hi).filter(fresh);
  if (candidates.length === 0) candidates = additionPool(1, cfg.maxAnswer).filter(fresh);
  if (candidates.length === 0) throw new Error('Problem pool exhausted');

  // Soft preference: skip problems seen in the kid's last round, if anything else is left.
  const notRecent = candidates.filter((p) => !avoidIds.has(p.id));
  if (notRecent.length) candidates = notRecent;

  // Keep it mixed: not the same answer, same first number, or a flipped pair (3+2 then 2+3)
  // as the problem just before, when anything else is left.
  if (prev) {
    const different = candidates.filter(
      (p) => p.answer !== prev.answer && p.a !== prev.a && !(p.a === prev.b && p.b === prev.a)
    );
    if (different.length) candidates = different;
  }

  // Problems with a 0 are useful but shouldn't dominate: halve their weight.
  const nonZero = candidates.filter((p) => p.a !== 0 && p.b !== 0);
  const pool = nonZero.length && rng.next() < 0.75 ? nonZero : candidates;

  // Pick the answer first (every sum equally likely), then a problem with that answer.
  // Otherwise big sums dominate, since 10 can be made more ways than 3.
  const answers = [...new Set(pool.map((p) => p.answer))];
  const target = rng.pick(answers);
  const p = rng.pick(pool.filter((q) => q.answer === target));
  return { ...p, objectKind: rng.pick(objectKinds) };
}
