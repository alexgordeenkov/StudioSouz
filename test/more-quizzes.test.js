import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clipobol } from '../src/experiments/more-quizzes.js';

test('clipobol rounds are valid and answers are accepted', () => {
  assert.ok(clipobol.rounds.length > 0);
  for (const round of clipobol.rounds) {
    assert.ok(round.answer);
    assert.equal(clipobol.isCorrect(round, round.answer), true);
    if (round.options) assert.ok(round.options.includes(round.answer));
  }
});
