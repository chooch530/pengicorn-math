import { test } from 'node:test';
import assert from 'node:assert/strict';
import { numberQuestionText, questionText } from '../js/logic/words.js';

test('numbers-only question is plain left-to-right math', () => {
  assert.equal(numberQuestionText({ a: 2, b: 1 }), 'What is 2 plus 1?');
});

test('picture question still tells the story', () => {
  assert.match(questionText({ a: 2, b: 1, objectKind: 'fish' }), /Pip has 2 fish/);
});
