import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../js/logic/rng.js';
import {
  BUILTIN_LISTS, parseWordList, makeWordChoices, lookAlikeScore, wordQueue,
  createSightRound, nextInSightRound, answerSight, sightSummary, SIGHT_ROUND_SIZE,
} from '../js/logic/sight.js';
import { newKid, activeListId, setWordList, recordWordRound, normalizeKid } from '../js/logic/progress.js';

test('built-in Dolch lists have the standard sizes', () => {
  assert.deepEqual(BUILTIN_LISTS.map((l) => l.words.length), [40, 52, 41]);
});

test('parse pasted text: separators, numbering, case, duplicates, junk', () => {
  assert.deepEqual(parseWordList('the, said\nwas;  saw • They'), ['the', 'said', 'was', 'saw', 'they']);
  assert.deepEqual(parseWordList('1. the\n2. said\n3) Was\n10. the'), ['the', 'said', 'was']);
  assert.deepEqual(parseWordList('i a b c x don’t can\'t 42 ---'), ['I', 'a', "don't", "can't"]);
});

test('parse drops short photo noise but keeps real short words', () => {
  assert.deepEqual(parseWordList('ee go ll to tt we'), ['go', 'to', 'we']);
});

test('parse OCR output drops header words', () => {
  const ocr = 'Sight Words - Week 8\n1. the\n2. said\n3. Was\n\n7. come\n\n12. because\n';
  assert.deepEqual(parseWordList(ocr), ['the', 'said', 'was', 'come', 'because']);
});

test('look-alikes rank close: saw is closer to was than yellow is', () => {
  assert.ok(lookAlikeScore('was', 'saw') < lookAlikeScore('was', 'yellow'));
  assert.ok(lookAlikeScore('then', 'them') < lookAlikeScore('then', 'play'));
});

test('choices: 3 distinct, include target, never the target twice, any list size', () => {
  const lists = [...BUILTIN_LISTS.map((l) => l.words), ['the'], ['go', 'to'], ['was', 'saw', 'said']];
  for (let seed = 1; seed <= 200; seed++) {
    const rng = createRng(seed);
    for (const words of lists) {
      for (const band of [0, 1, 2]) {
        const target = rng.pick(words);
        const c = makeWordChoices(target, words, rng, band);
        assert.equal(c.length, 3);
        assert.ok(c.includes(target));
        assert.equal(new Set(c.map((w) => w.toLowerCase())).size, 3, `dupes ${c}`);
      }
    }
  }
});

test('hard band picks look-alikes from the kid\'s list', () => {
  const words = ['was', 'saw', 'said', 'the', 'yellow', 'jump', 'funny'];
  let hits = 0;
  for (let seed = 1; seed <= 100; seed++) {
    const c = makeWordChoices('was', words, createRng(seed), 2);
    if (c.includes('saw')) hits++;
  }
  assert.ok(hits > 80, `saw only offered ${hits} times`);
});

test('queue: everything before repeats, no back-to-back, works for tiny lists', () => {
  for (let seed = 1; seed <= 200; seed++) {
    const rng = createRng(seed);
    for (const words of [BUILTIN_LISTS[0].words, ['a', 'b', 'c'], ['go', 'to'], ['the']]) {
      const q = wordQueue(words, rng);
      assert.equal(q.length, SIGHT_ROUND_SIZE);
      if (words.length >= SIGHT_ROUND_SIZE) assert.equal(new Set(q).size, SIGHT_ROUND_SIZE, 'repeat in long list');
      if (words.length > 1) for (let i = 1; i < q.length; i++) assert.notEqual(q[i], q[i - 1], `back-to-back ${q}`);
    }
  }
});

test('queue avoids last round\'s words when the list is long enough', () => {
  const words = BUILTIN_LISTS[1].words;
  const last = words.slice(0, 10);
  for (let seed = 1; seed <= 50; seed++) {
    const q = wordQueue(words, createRng(seed), 10, last);
    assert.ok(q.every((w) => !last.includes(w)));
  }
});

test('round: hint then reveal, stars, stats', () => {
  const r = createSightRound({ words: BUILTIN_LISTS[0].words, rng: createRng(3) });
  nextInSightRound(r);
  const wrong = r.choices.filter((w) => w !== r.problem.word);
  assert.equal(answerSight(r, wrong[0]).outcome, 'hint');
  assert.equal(answerSight(r, wrong[1]).outcome, 'reveal');
  while (nextInSightRound(r)) assert.equal(answerSight(r, r.problem.word).outcome, 'correct');
  const s = sightSummary(r);
  assert.equal(s.firstTryCorrect, 9);
  assert.equal(s.stars, 3);
  const k = recordWordRound(newKid({ name: 'L', avatar: 'penguin' }), 'dolch-pre', s);
  assert.equal(k.stats.words.problems, 10);
  assert.equal(Object.values(k.stats.words.missed)[0], 1);
  assert.equal(k.modes.words.bestStars['dolch-pre'], 3);
});

test('active list: chosen, else newest family list, else Pre-primer', () => {
  const kid = newKid({ name: 'L', avatar: 'penguin' });
  assert.equal(activeListId(kid, []), 'dolch-pre');
  const lists = [{ id: 'l1' }, { id: 'l2' }];
  assert.equal(activeListId(kid, lists), 'l2');
  assert.equal(activeListId(setWordList(kid, 'l1'), lists), 'l1');
  assert.equal(activeListId(setWordList(kid, 'dolch-1'), lists), 'dolch-1');
  assert.equal(activeListId(setWordList(kid, 'deleted'), lists), 'l2', 'deleted list falls back');
});

test('old saves get words progress', () => {
  const k = newKid({ name: 'L', avatar: 'penguin' });
  delete k.modes.words;
  delete k.stats.words;
  const n = normalizeKid(k);
  assert.equal(n.modes.words.band, 0);
  assert.equal(n.stats.words.problems, 0);
});
