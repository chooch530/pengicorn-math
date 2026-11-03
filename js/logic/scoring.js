// Stars and level advancement.

/** Stars for a round, based on first-try correct answers. Always at least 1 star. */
export function starsForRound(firstTryCorrect, total = 10) {
  const ratio = firstTryCorrect / total;
  if (ratio >= 0.9) return 3;
  if (ratio >= 0.6) return 2;
  return 1;
}

// Advance to the next level after this many rounds of 2+ stars while in the top band.
export const ROUNDS_TO_ADVANCE = 2;

/**
 * Update a kid's level progress after a round.
 * @param {{level:number, band:number, strongRounds:number}} modeProgress
 * @param {{stars:number, endBand:number, numBands:number, maxLevel:number}} result
 */
export function applyRound(modeProgress, { stars, endBand, numBands, maxLevel }) {
  const next = { ...modeProgress, band: endBand };
  const atTop = endBand === numBands - 1;
  next.strongRounds = atTop && stars >= 2 ? (modeProgress.strongRounds || 0) + 1 : 0;
  next.leveledUp = false;
  if (next.strongRounds >= ROUNDS_TO_ADVANCE && modeProgress.level < maxLevel) {
    next.level = modeProgress.level + 1;
    next.band = 0;
    next.strongRounds = 0;
    next.leveledUp = true;
  }
  return next;
}
