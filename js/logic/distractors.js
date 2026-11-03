// Multiple-choice answers: the right answer plus two close wrong answers (within ±2),
// never negative, never above the level's max.
//
// Anti-pattern-guessing:
//  - The right answer is equally likely to be the smallest, middle, or largest number.
//  - The three numbers are often NOT consecutive (e.g. 7, 9, 10), so "it's always the
//    one in the middle of a run" doesn't work.
//  - Buttons are never shown in sorted order (1 2 3 or 3 2 1).

const SHAPES = {
  low: [[1, 2]], // answer is smallest: a, a+1, a+2
  high: [[-2, -1]], // answer is largest
  mid: [[-1, 1], [-2, 1], [-1, 2], [-2, 2]], // answer in the middle, gaps vary
};

export function makeChoices(answer, rng, { min = 0, max = Infinity } = {}) {
  const ok = (n) => n >= min && n <= max;
  const fits = (pair) => pair.every((d) => ok(answer + d));

  const ranks = Object.keys(SHAPES).filter((k) => SHAPES[k].some(fits));
  let wrong;
  if (ranks.length) {
    const rank = rng.pick(ranks);
    wrong = rng.pick(SHAPES[rank].filter(fits)).map((d) => answer + d);
  } else {
    wrong = [answer - 1, answer + 1, answer - 2, answer + 2].filter(ok).slice(0, 2);
  }

  const all = [answer, ...wrong];
  let order = rng.shuffle(all);
  for (let tries = 0; tries < 10 && isSorted(order); tries++) order = rng.shuffle(all);
  return order;
}

function isSorted(a) {
  const up = a.every((n, i) => i === 0 || n > a[i - 1]);
  const down = a.every((n, i) => i === 0 || n < a[i - 1]);
  return up || down;
}
