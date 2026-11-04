// Battleship: which part of the ship each shot hits. Pure, no DOM.
// Rule (Calogero): a right answer on ANY try is a hit; only a full miss (answer shown) splashes.
// Hit all 10 parts in a 10-question round and the ship sinks; otherwise it limps away smoking.

export const SHIP_PARTS = 10;

export function createBattle(rng, parts = SHIP_PARTS) {
  return { parts, order: rng.shuffle([...Array(parts).keys()]), hits: [], misses: 0 };
}

/** Record a shot. Returns { hit, part (index or null), hits, sunk }. Does not mutate the input. */
export function shoot(b, hit) {
  if (hit && b.hits.length < b.parts) {
    const part = b.order[b.hits.length];
    const hits = [...b.hits, part];
    return { battle: { ...b, hits }, hit: true, part, hits: hits.length, sunk: hits.length === b.parts };
  }
  return { battle: { ...b, misses: b.misses + 1 }, hit: false, part: null, hits: b.hits.length, sunk: b.hits.length === b.parts };
}

/** Map a round outcome ('correct' | 'hint' | 'reveal') to a shot. 'hint' doesn't fire. */
export function shotFor(outcome) {
  if (outcome === 'correct') return true;
  if (outcome === 'reveal') return false;
  return null;
}

export function isSunk(b) {
  return b.hits.length === b.parts;
}
