// Level and difficulty-band definitions. Pure data, no DOM.
// Each level has 3 bands (easy -> hard). Adaptive difficulty moves between bands
// inside a level. A band is a range of allowed answers (sums).

export const ROUND_SIZE = 10;

export const LEVELS = {
  add: {
    1: { maxAnswer: 5, bands: [[1, 3], [2, 4], [3, 5]] },
    2: { maxAnswer: 10, bands: [[4, 7], [5, 9], [6, 10]] },
    3: { maxAnswer: 20, bands: [[8, 13], [10, 16], [12, 20]] },
  },
};

// Levels that are actually playable in this build. Others exist in logic only.
export const PLAYABLE = { add: [1] };

export function levelConfig(mode, level) {
  const cfg = LEVELS[mode]?.[level];
  if (!cfg) throw new Error(`Unknown level ${mode} ${level}`);
  return cfg;
}
