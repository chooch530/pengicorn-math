// Multiple-choice answers: the right answer plus two close wrong answers (within ±2),
// never negative, never above the level's max.
//
// Anti-pattern-guessing: we pick one of three shapes with equal chance (when the range
// allows), so the right answer is equally likely to be the smallest, middle, or largest
// number, and the button order is shuffled too.
//   below:    a-2, a-1, a
//   straddle: a-1, a, a+1
//   above:    a, a+1, a+2

export function makeChoices(answer, rng, { min = 0, max = Infinity } = {}) {
  const ok = (n) => n >= min && n <= max;
  const shapes = [
    [answer - 2, answer - 1],
    [answer - 1, answer + 1],
    [answer + 1, answer + 2],
  ].filter((pair) => pair.every(ok));

  let wrong;
  if (shapes.length) {
    wrong = rng.pick(shapes);
  } else {
    // Tiny range: take whatever close numbers fit.
    wrong = [answer - 1, answer + 1, answer - 2, answer + 2].filter(ok).slice(0, 2);
  }
  return rng.shuffle([answer, ...wrong]);
}
