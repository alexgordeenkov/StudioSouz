import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clipobol } from '../src/experiments/more-quizzes.js';

test('clipobol ships no invented rounds; content comes from episode packs', () => {
  assert.equal(clipobol.rounds.length, 0);
  const round = { options: ['Кукла', 'Комарово'], answer: 'Кукла' };
  assert.equal(clipobol.isCorrect(round, 'Кукла'), true);
  assert.equal(clipobol.isCorrect(round, 'Комарово'), false);
});
