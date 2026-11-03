// Stars and level unlocking.

/** Stars for a round, based on first-try correct answers. Always at least 1 star. */
export function starsForRound(firstTryCorrect, total = 10) {
  const ratio = firstTryCorrect / total;
  if (ratio >= 0.9) return 3;
  if (ratio >= 0.6) return 2;
  return 1;
}

// Unlock the next level after this many rounds in a row of 2+ stars,
// finished in the top band, played on the highest unlocked level.
export const ROUNDS_TO_ADVANCE = 2;

/**
 * Update a kid's progress in one mode after a round.
 * @param {{level:number, bands:Object, strongRounds:number}} mp  level = highest unlocked level
 * @param {{played:number, stars:number, endBand:number, numBands:number, maxLevel:number}} r
 * @returns new mode progress plus `leveledUp` (true when a new level was just unlocked)
 */
export function applyRound(mp, { played, stars, endBand, numBands, maxLevel }) {
  const next = { ...mp, bands: { ...(mp.bands || {}), [played]: endBand }, leveledUp: false };
  if (played !== mp.level) return next; // replaying an easier level never unlocks anything

  const atTop = endBand === numBands - 1;
  next.strongRounds = atTop && stars >= 2 ? (mp.strongRounds || 0) + 1 : 0;
  if (next.strongRounds >= ROUNDS_TO_ADVANCE && mp.level < maxLevel) {
    next.level = mp.level + 1;
    next.bands[next.level] = next.bands[next.level] ?? 0;
    next.strongRounds = 0;
    next.leveledUp = true;
  }
  return next;
}
