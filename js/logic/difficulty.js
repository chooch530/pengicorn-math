// Adaptive difficulty inside a level.
// 4 first-try-correct in a row -> up one band. 2 misses in a row -> down one band.
// A "miss" is any problem not solved on the first try (internal only; the kid never sees it).

export const UP_AFTER = 4;
export const DOWN_AFTER = 2;

export function createDifficulty(band = 0, numBands = 3) {
  return { band, numBands, rightStreak: 0, wrongStreak: 0 };
}

export function recordResult(state, firstTryCorrect) {
  let { band, numBands, rightStreak, wrongStreak } = state;
  if (firstTryCorrect) {
    rightStreak++;
    wrongStreak = 0;
    if (rightStreak >= UP_AFTER && band < numBands - 1) {
      band++;
      rightStreak = 0;
    }
  } else {
    wrongStreak++;
    rightStreak = 0;
    if (wrongStreak >= DOWN_AFTER && band > 0) {
      band--;
      wrongStreak = 0;
    }
  }
  return { band, numBands, rightStreak, wrongStreak };
}
