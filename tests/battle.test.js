import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../js/logic/rng.js';
import { createBattle, shoot, shotFor, isSunk, SHIP_PARTS } from '../js/logic/battle.js';
import { createRound, nextInRound, answer } from '../js/logic/round.js';

test('10 hits sink the ship, every part hit exactly once', () => {
  let b = createBattle(createRng(1));
  const parts = [];
  for (let i = 0; i < SHIP_PARTS; i++) {
    const r = shoot(b, true);
    b = r.battle;
    parts.push(r.part);
    assert.equal(r.sunk, i === SHIP_PARTS - 1);
  }
  assert.deepEqual([...parts].sort((x, y) => x - y), [...Array(SHIP_PARTS).keys()]);
  assert.ok(isSunk(b));
});

test('a miss splashes and does not sink', () => {
  let b = createBattle(createRng(2));
  const r = shoot(b, false);
  assert.equal(r.hit, false);
  assert.equal(r.part, null);
  assert.equal(r.battle.misses, 1);
  assert.equal(isSunk(r.battle), false);
});

test('outcome mapping: right on any try hits, hint waits, reveal misses', () => {
  assert.equal(shotFor('correct'), true);
  assert.equal(shotFor('hint'), null);
  assert.equal(shotFor('reveal'), false);
});

test('a full round: second-try answers still hit; one reveal means the ship escapes', () => {
  const r = createRound({ mode: 'add', level: 2, rng: createRng(9) });
  let b = createBattle(createRng(9));
  let i = 0;
  while (nextInRound(r)) {
    const wrong = r.choices.filter((c) => c !== r.problem.answer);
    let res;
    if (i === 1) answer(r, wrong[0]); // one miss, then right: still a hit
    if (i === 4) {
      answer(r, wrong[0]);
      res = answer(r, wrong[1]); // reveal: splash
    } else res = answer(r, r.problem.answer);
    const shot = shotFor(res.outcome);
    if (shot !== null) b = shoot(b, shot).battle;
    i++;
  }
  assert.equal(b.hits.length, 9);
  assert.equal(b.misses, 1);
  assert.equal(isSunk(b), false);
});
