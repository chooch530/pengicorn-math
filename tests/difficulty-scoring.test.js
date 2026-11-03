import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDifficulty, recordResult } from '../js/logic/difficulty.js';
import { starsForRound, applyRound } from '../js/logic/scoring.js';
import { newKid, normalizeKid, bandFor, unlockAll, setPictures, recordRound, mostMissed, accuracy, exportStore, importStore, emptyStore, loadStore, saveStore } from '../js/logic/progress.js';

const run = (results, start = 0) => results.reduce((s, r) => recordResult(s, r), createDifficulty(start));

test('4 right in a row raises the band', () => {
  assert.equal(run([1, 1, 1].map(Boolean)).band, 0);
  assert.equal(run([1, 1, 1, 1].map(Boolean)).band, 1);
  assert.equal(run(Array(8).fill(true)).band, 2);
  assert.equal(run(Array(20).fill(true)).band, 2, 'caps at top band');
});

test('2 wrong in a row lowers the band', () => {
  assert.equal(run([false], 2).band, 2);
  assert.equal(run([false, false], 2).band, 1);
  assert.equal(run(Array(10).fill(false), 2).band, 0, 'floors at band 0');
});

test('streaks reset on the opposite result', () => {
  assert.equal(run([true, true, true, false, true]).band, 0);
  assert.equal(run([false, true, false], 1).band, 1);
});

test('stars: always at least 1', () => {
  assert.equal(starsForRound(10), 3);
  assert.equal(starsForRound(9), 3);
  assert.equal(starsForRound(8), 2);
  assert.equal(starsForRound(6), 2);
  assert.equal(starsForRound(5), 1);
  assert.equal(starsForRound(0), 1);
});

test('level unlocks after 2 strong rounds at the top band', () => {
  const base = { level: 1, bands: { 1: 2 }, strongRounds: 0 };
  const opts = { played: 1, stars: 2, endBand: 2, numBands: 3, maxLevel: 3 };
  const once = applyRound(base, opts);
  assert.equal(once.level, 1);
  assert.equal(once.strongRounds, 1);
  const twice = applyRound(once, opts);
  assert.equal(twice.level, 2);
  assert.equal(twice.bands[2], 0);
  assert.ok(twice.leveledUp);
  assert.equal(applyRound(once, { ...opts, stars: 1 }).strongRounds, 0, 'weak round resets');
  assert.equal(applyRound(once, { ...opts, endBand: 1 }).strongRounds, 0, 'not at top resets');
});

test('replaying an easier level saves its band but never unlocks', () => {
  const mp = { level: 2, bands: { 1: 0, 2: 1 }, strongRounds: 1 };
  const r = applyRound(mp, { played: 1, stars: 3, endBand: 2, numBands: 3, maxLevel: 3 });
  assert.equal(r.level, 2);
  assert.equal(r.bands[1], 2);
  assert.equal(r.bands[2], 1);
  assert.equal(r.strongRounds, 1);
  assert.equal(r.leveledUp, false);
});

test('top level never goes past the max', () => {
  const mp = { level: 3, bands: { 3: 2 }, strongRounds: 1 };
  const r = applyRound(mp, { played: 3, stars: 3, endBand: 2, numBands: 3, maxLevel: 3 });
  assert.equal(r.level, 3);
  assert.equal(r.leveledUp, false);
});

test('old v1.0 saves migrate to per-level bands', () => {
  const old = newKid({ name: 'Old', avatar: 'penguin' });
  old.modes.add = { level: 1, band: 2, strongRounds: 1, bestStars: { 1: 3 } };
  const k = normalizeKid(old);
  assert.equal(k.modes.add.bands[1], 2);
  assert.equal(k.modes.add.band, undefined);
  assert.deepEqual(k.modes.add.recent, []);
  assert.equal(bandFor(k, 'add', 1), 2);
  assert.equal(bandFor(k, 'add', 3), 0);
});

test('unlockAll opens every level', () => {
  const k = unlockAll(newKid({ name: 'A', avatar: 'penguin' }), 'add');
  assert.equal(k.modes.add.level, 3);
});

test('recordRound updates stats and stars', () => {
  const kid = newKid({ name: 'Test', avatar: 'penguin' });
  const summary = {
    stars: 2, endBand: 1, numBands: 3,
    log: [{ id: '2+3', firstTry: false }, { id: '2+3', firstTry: false }, { id: '1+1', firstTry: true }],
  };
  const { kid: k } = recordRound(kid, 'add', 1, summary);
  assert.equal(k.totalStars, 2);
  assert.equal(k.modes.add.bands[1], 1);
  assert.deepEqual(k.modes.add.recent, ['2+3', '2+3', '1+1']);
  assert.equal(k.modes.add.bestStars[1], 2);
  assert.deepEqual(mostMissed(k, 'add')[0], ['2+3', 2]);
  assert.equal(accuracy(k, 'add'), 33);
  assert.equal(kid.totalStars, 0, 'original not mutated');
});

test('backup code round-trips, rejects junk', () => {
  const s = emptyStore();
  s.kids.push(newKid({ name: 'Zoë', avatar: 'unicorn' }));
  assert.deepEqual(importStore(exportStore(s)), s);
  assert.throws(() => importStore('not-a-backup'));
});

test('storage failures never throw', () => {
  const broken = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('full'); } };
  assert.deepEqual(loadStore(broken), emptyStore());
  assert.equal(saveStore(emptyStore(), broken), false);
  assert.deepEqual(loadStore(undefined), emptyStore());
});

test('counting pictures default off, old saves get it off, parent can turn it on', () => {
  const k = newKid({ name: 'A', avatar: 'penguin' });
  assert.equal(k.prefs.pictures, false);
  const old = { ...k };
  delete old.prefs;
  assert.equal(normalizeKid(old).prefs.pictures, false);
  const on = setPictures(k, true);
  assert.equal(on.prefs.pictures, true);
  assert.equal(k.prefs.pictures, false, 'original not mutated');
});
