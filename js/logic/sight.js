// Sight words: built-in lists, look-alike wrong answers, word-list parsing, and a
// 10-word round. Pure functions, no DOM. Same shape as logic/round.js so the UI
// and scoring work the same way as math.
import { createDifficulty, recordResult } from './difficulty.js';
import { starsForRound } from './scoring.js';

export const SIGHT_ROUND_SIZE = 10;

// Dolch sight word lists.
export const BUILTIN_LISTS = [
  {
    id: 'dolch-pre',
    name: 'Pre-primer',
    words: ('a and away big blue can come down find for funny go help here I in is it jump little look make me my ' +
      'not one play red run said see the three to two up we where yellow you').split(' '),
  },
  {
    id: 'dolch-primer',
    name: 'Primer',
    words: ('all am are at ate be black brown but came did do eat four get good have he into like must new no now on ' +
      'our out please pretty ran ride saw say she so soon that there they this too under want was well went what ' +
      'white who will with yes').split(' '),
  },
  {
    id: 'dolch-1',
    name: 'Grade 1',
    words: ('after again an any as ask by could every fly from give going had has her him his how just know let live ' +
      'may of old once open over put round some stop take thank them then think walk were when').split(' '),
  },
];

const ALL_BUILTIN = [...new Set(BUILTIN_LISTS.flatMap((l) => l.words))];

/** Words are shown lowercase, except "I". */
export function normalizeWord(w) {
  const s = String(w).trim().toLowerCase();
  return s === 'i' ? 'I' : s;
}

// Header words that show up on printed lists but aren't part of the list.
// Real 1–2 letter words. Anything else that short is almost always photo noise ("ee", "ll").
const SHORT_WORDS = new Set(['a', 'I', 'am', 'an', 'as', 'at', 'be', 'by', 'do', 'go', 'he', 'hi', 'if', 'in', 'is', 'it', 'me', 'my', 'no', 'of', 'oh', 'ok', 'on', 'or', 'ox', 'so', 'to', 'up', 'us', 'we']);

const HEADER_WORDS = new Set(['sight', 'words', 'word', 'week', 'list', 'name', 'date', 'spelling', 'practice', 'homework', 'grade', 'unit', 'lesson', 'kindergarten']);

/**
 * Turn pasted text or OCR output into a clean word list.
 * Splits on spaces, commas, new lines, bullets and numbering; keeps letters and apostrophes;
 * drops stray single letters (except "a" and "I"), header words, and duplicates.
 */
export function parseWordList(text) {
  const out = [];
  const seen = new Set();
  for (const raw of String(text || '').split(/[\s,;|/•·*]+/)) {
    const cleaned = raw
      .replace(/[‘’ʼ`]/g, "'")
      .replace(/^[^A-Za-z']+|[^A-Za-z']+$/g, '')
      .replace(/^'+|'+$/g, '');
    if (!cleaned || !/^[A-Za-z']+$/.test(cleaned)) continue;
    const w = normalizeWord(cleaned);
    if (w.length <= 2 && !SHORT_WORDS.has(w)) continue;
    if (w.length > 15 || HEADER_WORDS.has(w)) continue;
    if (seen.has(w)) continue;
    seen.add(w);
    out.push(w);
  }
  return out;
}

/** Edit distance (Levenshtein). */
export function distance(a, b) {
  const m = a.length;
  const n = b.length;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}

/** Lower = looks more alike. was/saw (same letters) and then/them (one letter off) score lowest. */
export function lookAlikeScore(target, w) {
  const a = target.toLowerCase();
  const b = w.toLowerCase();
  let s = distance(a, b);
  if (a.length === b.length && [...a].sort().join('') === [...b].sort().join('')) s -= 1.5; // anagram
  if (a[0] === b[0]) s -= 0.6;
  if (a[a.length - 1] === b[b.length - 1]) s -= 0.3;
  s += Math.abs(a.length - b.length) * 0.4;
  return s;
}

/**
 * Two wrong words that look like the target. Prefers words from the kid's own list,
 * topped up from the built-in lists when the list is short.
 * band 0 = pick from the 8 closest, band 2 = pick from the 3 closest (harder to tell apart).
 */
export function makeWordChoices(target, listWords, rng, band = 1) {
  const key = (w) => w.toLowerCase();
  const pool = [];
  const seen = new Set([key(target)]);
  for (const w of [...listWords, ...ALL_BUILTIN]) {
    if (seen.has(key(w))) continue;
    seen.add(key(w));
    pool.push(w);
  }
  const inList = new Set(listWords.map(key));
  const ranked = pool
    .map((w) => ({ w, s: lookAlikeScore(target, w) - (inList.has(key(w)) ? 1.2 : 0) + rng.next() * 0.3 }))
    .sort((x, y) => x.s - y.s);
  const b = Math.max(0, Math.min(2, band));
  let wrong;
  if (b === 2) {
    // Hardest: always the closest look-alike, plus one more from the next few.
    wrong = [ranked[0].w, rng.pick(ranked.slice(1, 4)).w];
  } else {
    const width = b === 0 ? 8 : 5;
    wrong = rng.shuffle(ranked.slice(0, width)).slice(0, 2).map((x) => x.w);
  }
  return rng.shuffle([target, ...wrong]);
}

/**
 * Order of words for a round: every word in the list comes up before any repeats,
 * last round's words go to the back, and the same word never appears twice in a row.
 */
export function wordQueue(words, rng, size = SIGHT_ROUND_SIZE, avoid = []) {
  if (!words.length) return [];
  const recent = new Set(avoid);
  const out = [];
  while (out.length < size) {
    const fresh = rng.shuffle(words.filter((w) => !recent.has(w)));
    const old = rng.shuffle(words.filter((w) => recent.has(w)));
    let batch = [...fresh, ...old];
    if (out.length && batch[0] === out[out.length - 1] && batch.length > 1) {
      batch = [...batch.slice(1), batch[0]];
    }
    out.push(...batch);
    recent.clear();
  }
  return out.slice(0, size);
}

export function createSightRound({ words, band = 0, rng, avoid = [] }) {
  const clean = [...new Set(words.map(normalizeWord))];
  return {
    words: clean,
    rng,
    queue: wordQueue(clean, rng, SIGHT_ROUND_SIZE, avoid),
    difficulty: createDifficulty(band, 3),
    index: -1,
    problem: null,
    choices: [],
    misses: 0,
    firstTryCorrect: 0,
    log: [],
    done: false,
  };
}

export function nextInSightRound(r) {
  r.index++;
  if (r.index >= r.queue.length) {
    r.done = true;
    r.problem = null;
    return null;
  }
  const word = r.queue[r.index];
  r.problem = { id: word, word, answer: word };
  r.choices = makeWordChoices(word, r.words, r.rng, r.difficulty.band);
  r.misses = 0;
  return r.problem;
}

/** Same outcomes as math: 'correct' | 'hint' (1st miss) | 'reveal' (2nd miss). */
export function answerSight(r, value) {
  if (!r.problem) throw new Error('No active word');
  if (value === r.problem.word) {
    finish(r, true);
    return { outcome: 'correct' };
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
  r.log.push({ id: r.problem.word, firstTry, misses: r.misses, band: r.difficulty.band });
  r.difficulty = recordResult(r.difficulty, firstTry);
}

export function sightSummary(r) {
  const total = r.queue.length;
  return {
    stars: starsForRound(r.firstTryCorrect, total),
    firstTryCorrect: r.firstTryCorrect,
    total,
    endBand: r.difficulty.band,
    numBands: 3,
    log: r.log,
  };
}

/** Find a list by id among built-ins and the family's saved lists. */
export function findList(id, customLists = []) {
  return [...customLists, ...BUILTIN_LISTS].find((l) => l.id === id) || null;
}
