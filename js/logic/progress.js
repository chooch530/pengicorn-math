// Kid profiles and progress, saved in localStorage. Every storage call is wrapped
// in try/catch: storage can be missing (private mode), full, or throw on iPad.
// Pure data helpers are exported separately so they can be unit-tested.
import { applyRound } from './scoring.js';
import { LEVELS } from './levels.js';

export const STORAGE_KEY = 'pengicorn.v1';
export const MAX_KIDS = 3;
const SCHEMA = 1;

export function emptyStore() {
  return { schema: SCHEMA, kids: [], settings: { muted: false, voiceURI: null } };
}

export function newKid({ name, avatar, color }) {
  return {
    id: `k${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`,
    name: String(name || '').trim().slice(0, 16) || 'Player',
    avatar: avatar === 'unicorn' ? 'unicorn' : 'penguin',
    color: color || 'blue',
    totalStars: 0,
    modes: { add: { level: 1, band: 0, strongRounds: 0, bestStars: {} } },
    stats: { add: { problems: 0, firstTry: 0, missed: {} } },
    friends: [],
  };
}

/** Pure: fold a finished round into a kid record. Returns { kid, leveledUp }. */
export function recordRound(kid, mode, level, summary) {
  const k = structuredCloneSafe(kid);
  const mp = k.modes[mode];
  const maxLevel = Math.max(...Object.keys(LEVELS[mode]).map(Number));
  const updated = applyRound(mp, {
    stars: summary.stars,
    endBand: summary.endBand,
    numBands: summary.numBands,
    maxLevel,
  });
  const leveledUp = updated.leveledUp;
  delete updated.leveledUp;
  updated.bestStars = { ...mp.bestStars, [level]: Math.max(mp.bestStars?.[level] || 0, summary.stars) };
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
    return isValidStore(s) ? { ...emptyStore(), ...s, settings: { ...emptyStore().settings, ...s.settings } } : emptyStore();
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
  return s;
}
