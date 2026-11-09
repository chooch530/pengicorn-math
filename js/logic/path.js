// Hero Path: a SplashLearn-style trail of short missions played in order. Pure, no DOM.
// Each stop is one 10-question rescue round of a skill at a level. Finishing a stop
// (any number of stars, never a "fail") opens the next one. Kids can replay any open stop.

const CHAPTER_PATTERN = ['add', 'sub', 'words', 'add', 'mix', 'sub', 'words', 'mix'];

// Chapter n uses level n: numbers to 5, to 10, to 20.
export const CHAPTERS = [1, 2, 3];

export const PATH = CHAPTERS.flatMap((chapter) =>
  CHAPTER_PATTERN.map((skill, i) => ({
    id: `c${chapter}-${i + 1}`,
    chapter,
    skill, // 'add' | 'sub' | 'mix' | 'words'
    level: skill === 'words' ? null : chapter,
  }))
);

export function newPathProgress() {
  // done = how many stops are finished (stop `done` is the next one to play).
  return { done: 0, stars: {} };
}

/** A stop can be played once every stop before it is finished. */
export function isOpen(progress, index) {
  return index >= 0 && index < PATH.length && index <= (progress?.done || 0);
}

/** The stop to play next (the last stop again once the path is finished). */
export function currentStop(progress) {
  return Math.min(progress?.done || 0, PATH.length - 1);
}

export function isComplete(progress) {
  return (progress?.done || 0) >= PATH.length;
}

/** Pure: record a finished stop. Returns new progress; does not mutate the input. */
export function finishStop(progress, index, stars) {
  const p = { ...newPathProgress(), ...(progress || {}) };
  const prevBest = p.stars[index] || 0;
  return {
    done: index === p.done ? Math.min(PATH.length, p.done + 1) : p.done,
    stars: { ...p.stars, [index]: Math.max(prevBest, stars) },
  };
}

/** Parent switch: open every stop. */
export function openAll(progress) {
  return { ...newPathProgress(), ...(progress || {}), done: PATH.length };
}
