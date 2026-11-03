// Kid profiles and progress, saved in localStorage. Every storage call is wrapped
// in try/catch: storage can be missing (private mode), full, or throw on iPad.
// Pure data helpers are exported separately so they can be unit-tested.
import { applyRound } from './scoring.js';
import { LEVELS } from './levels.js';

export const STORAGE_KEY = 'pengicorn.v1';
export const MAX_KIDS = 3;
const SCHEMA = 1;

export function emptyStore() {
  // lists = the family's saved sight-word lists (e.g. from the teacher), shared by all kids.
  return { schema: SCHEMA, kids: [], lists: [], settings: { muted: false, voiceURI: null } };
}

export function newKid({ name, avatar, color }) {
  return normalizeKid({
    id: `k${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`,
    name: String(name || '').trim().slice(0, 16) || 'Player',
    avatar: avatar === 'unicorn' ? 'unicorn' : 'penguin',
    color: color || 'blue',
    totalStars: 0,
    modes: { add: newModeProgress() },
    stats: { add: { problems: 0, firstTry: 0, missed: {} } },
    friends: [],
    prefs: { pictures: false },
  });
}

export function newModeProgress() {
  // level = highest unlocked level; bands = current difficulty band per level;
  // recent = problem ids from the last round (avoided next round when possible).
  return { level: 1, bands: { 1: 0 }, strongRounds: 0, bestStars: {}, recent: [] };
}

/** Bring older saved kids up to the current shape. Safe to run on every load. */
export function normalizeKid(kid) {
  const k = structuredCloneSafe(kid);
  k.modes = k.modes || {};
  k.stats = k.stats || {};
  k.prefs = { pictures: false, ...(k.prefs || {}) };
  for (const mode of Object.keys(LEVELS)) {
    const mp = { ...newModeProgress(), ...(k.modes[mode] || {}) };
    if (mp.band !== undefined) {
      // v1.0 stored a single band for the current level.
      mp.bands = { ...mp.bands, [mp.level]: mp.band };
      delete mp.band;
    }
    k.modes[mode] = mp;
    k.stats[mode] = { problems: 0, firstTry: 0, missed: {}, ...(k.stats[mode] || {}) };
  }
  // Sight words. list = id of the list this kid practices (null = automatic, see activeListId).
  k.modes.words = { list: null, band: 0, recent: [], bestStars: {}, ...(k.modes.words || {}) };
  k.stats.words = { problems: 0, firstTry: 0, missed: {}, ...(k.stats.words || {}) };
  return k;
}

/** Band to start a level on. */
export function bandFor(kid, mode, level) {
  return kid.modes[mode].bands?.[level] ?? 0;
}

/** Parent switch: show counting pictures with every problem (easier) or numbers only. */
export function setPictures(kid, on) {
  const k = structuredCloneSafe(kid);
  k.prefs = { ...(k.prefs || {}), pictures: !!on };
  return k;
}

/** Which word list a kid practices: their chosen one if it still exists, else the newest family list, else Pre-primer. */
export function activeListId(kid, lists = []) {
  const chosen = kid.modes?.words?.list;
  if (chosen && (lists.some((l) => l.id === chosen) || chosen.startsWith('dolch-'))) return chosen;
  return lists.length ? lists[lists.length - 1].id : 'dolch-pre';
}

export function setWordList(kid, listId) {
  const k = normalizeKid(kid);
  k.modes.words.list = listId;
  k.modes.words.band = 0;
  k.modes.words.recent = [];
  return k;
}

/** Pure: fold a finished sight-word round into a kid record. */
export function recordWordRound(kid, listId, summary) {
  const k = normalizeKid(kid);
  const mw = k.modes.words;
  mw.band = summary.endBand;
  mw.recent = summary.log.map((e) => e.id);
  mw.bestStars = { ...mw.bestStars, [listId]: Math.max(mw.bestStars[listId] || 0, summary.stars) };
  k.totalStars += summary.stars;
  const st = k.stats.words;
  for (const e of summary.log) {
    st.problems++;
    if (e.firstTry) st.firstTry++;
    else st.missed[e.id] = (st.missed[e.id] || 0) + 1;
  }
  return k;
}

let listCounter = 0;
export function newList(name, words) {
  return {
    id: `list${Date.now().toString(36)}${listCounter++}`,
    name: String(name || '').trim().slice(0, 30) || 'Class list',
    words,
    created: new Date().toISOString().slice(0, 10),
  };
}

/** Parent switch: open every level in a mode. */
export function unlockAll(kid, mode) {
  const k = structuredCloneSafe(kid);
  const maxLevel = Math.max(...Object.keys(LEVELS[mode]).map(Number));
  k.modes[mode].level = maxLevel;
  k.modes[mode].strongRounds = 0;
  return k;
}

/** Pure: fold a finished round into a kid record. Returns { kid, leveledUp }. */
export function recordRound(kid, mode, level, summary) {
  const k = normalizeKid(kid);
  const mp = k.modes[mode];
  const maxLevel = Math.max(...Object.keys(LEVELS[mode]).map(Number));
  const updated = applyRound(mp, {
    played: level,
    stars: summary.stars,
    endBand: summary.endBand,
    numBands: summary.numBands,
    maxLevel,
  });
  const leveledUp = updated.leveledUp;
  delete updated.leveledUp;
  updated.bestStars = { ...mp.bestStars, [level]: Math.max(mp.bestStars?.[level] || 0, summary.stars) };
  updated.recent = summary.log.map((e) => e.id);
  k.modes[mode] = updated;
  k.totalStars += summary.stars;

  const st = k.stats[mode];
  for (const entry of summary.log) {
    st.problems++;
    if (entry.firstTry) st.firstTry++;
    else st.missed[entry.id] = (st.missed[entry.id] || 0) + 1;
  }
  return { kid: k, leveledUp };
}

export function mostMissed(kid, mode, n = 5) {
  return Object.entries(kid.stats[mode]?.missed || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}

export function accuracy(kid, mode) {
  const s = kid.stats[mode];
  return s && s.problems ? Math.round((100 * s.firstTry) / s.problems) : null;
}

function structuredCloneSafe(o) {
  return JSON.parse(JSON.stringify(o));
}

function isValidStore(s) {
  return s && s.schema === SCHEMA && Array.isArray(s.kids);
}

// ---- storage (browser only) ----

export function loadStore(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const s = JSON.parse(raw);
    if (!isValidStore(s)) return emptyStore();
    return { ...emptyStore(), ...s, kids: s.kids.map(normalizeKid), lists: Array.isArray(s.lists) ? s.lists : [], settings: { ...emptyStore().settings, ...s.settings } };
  } catch {
    return emptyStore();
  }
}

/** Returns true if saved. */
export function saveStore(store, storage = globalThis.localStorage) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(store));
    return true;
  } catch {
    return false;
  }
}

/** Backup code a parent can copy and paste back in later. */
export function exportStore(store) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(store))));
}

export function importStore(code) {
  const s = JSON.parse(decodeURIComponent(escape(atob(String(code).trim()))));
  if (!isValidStore(s)) throw new Error('Not a valid backup');
  return { ...s, kids: s.kids.map(normalizeKid), lists: Array.isArray(s.lists) ? s.lists : [] };
}
