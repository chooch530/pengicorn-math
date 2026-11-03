// A round of 10 problems as a small state machine. No DOM, no audio.
// The UI asks the round what happened and decides how to show it.
import { ROUND_SIZE, levelConfig } from './levels.js';
import { nextProblem } from './problems.js';
import { makeChoices } from './distractors.js';
import { createDifficulty, recordResult } from './difficulty.js';
import { starsForRound } from './scoring.js';

export function createRound({ mode, level, band = 0, rng, objectKinds }) {
  const cfg = levelConfig(mode, level);
  return {
    mode,
    level,
    rng,
    objectKinds,
    maxAnswer: cfg.maxAnswer,
    difficulty: createDifficulty(band, cfg.bands.length),
    usedIds: new Set(),
    index: -1,
    problem: null,
    choices: [],
    misses: 0,
    firstTryCorrect: 0,
    log: [], // { id, firstTry, misses, band }
    done: false,
  };
}

/** Advance to the next problem. Returns the problem, or null when the round is over. */
export function nextInRound(r) {
  r.index++;
  if (r.index >= ROUND_SIZE) {
    r.done = true;
    r.problem = null;
    return null;
  }
  const p = nextProblem({
    mode: r.mode,
    level: r.level,
    band: r.difficulty.band,
    usedIds: r.usedIds,
    rng: r.rng,
    objectKinds: r.objectKinds,
  });
  r.usedIds.add(p.id);
  r.problem = p;
  r.choices = makeChoices(p.answer, r.rng, { min: 0, max: r.maxAnswer });
  r.misses = 0;
  return p;
}

/**
 * Submit an answer.
 * Returns { outcome: 'correct' | 'hint' | 'reveal' }.
 *  - correct: solved (on any try)
 *  - hint:    1st miss -> UI highlights the objects to count
 *  - reveal:  2nd miss -> UI shows the answer and moves on
 */
export function answer(r, value) {
  const p = r.problem;
  if (!p) throw new Error('No active problem');
  if (value === p.answer) {
    finish(r, true);
    return { outcome: 'correct', firstTry: r.misses === 0 };
  }
  r.misses++;
  if (r.misses >= 2) {
    finish(r, false);
    return { outcome: 'reveal' };
  }
  return { outcome: 'hint' };
}

function finish(r, solved) {
  const firstTry = solved && r.misses === 0;
  if (firstTry) r.firstTryCorrect++;
  r.log.push({ id: r.problem.id, firstTry, misses: r.misses, band: r.difficulty.band });
  r.difficulty = recordResult(r.difficulty, firstTry);
}

export function roundSummary(r) {
  return {
    stars: starsForRound(r.firstTryCorrect, ROUND_SIZE),
    firstTryCorrect: r.firstTryCorrect,
    total: ROUND_SIZE,
    endBand: r.difficulty.band,
    numBands: r.difficulty.numBands,
    log: r.log,
  };
}
