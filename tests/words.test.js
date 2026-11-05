import { test } from 'node:test';
import assert from 'node:assert/strict';
import { numberQuestionText, questionText } from '../js/logic/words.js';

test('numbers-only question is plain left-to-right math', () => {
  assert.equal(numberQuestionText({ a: 2, b: 1 }), 'What is 2 plus 1?');
});

test('picture question still tells the story', () => {
  assert.match(questionText({ a: 2, b: 1, objectKind: 'fish' }), /Pip has 2 fish/);
});

import { pirateHitText, pirateEscapeText } from '../js/logic/words.js';
import { createRng } from '../js/logic/rng.js';

test('pirate lines name the word and the number of hits', () => {
  assert.match(pirateHitText('said', createRng(1)), /That says said\.$/);
  assert.match(pirateEscapeText(7), /hit it 7 times/);
});
