// Level and difficulty-band definitions. Pure data, no DOM.
// Each level has 3 bands (easy -> hard). Adaptive difficulty moves between bands
// inside a level. A band is a range of allowed answers (sums).
// Bands share the same top (the level max) and only raise the floor, so every
// difficulty mixes small and big problems instead of creeping up in order.

export const ROUND_SIZE = 10;

export const LEVELS = {
  add: {
    1: { maxAnswer: 5, bands: [[1, 5], [2, 5], [3, 5]] },
    2: { maxAnswer: 10, bands: [[3, 10], [5, 10], [7, 10]] },
    3: { maxAnswer: 20, bands: [[6, 20], [10, 20], [13, 20]] },
  },
};

// Levels that are actually playable in this build. Others exist in logic only.
export const PLAYABLE = { add: [1, 2, 3] };

export function levelConfig(mode, level) {
  const cfg = LEVELS[mode]?.[level];
  if (!cfg) throw new Error(`Unknown level ${mode} ${level}`);
  return cfg;
}
