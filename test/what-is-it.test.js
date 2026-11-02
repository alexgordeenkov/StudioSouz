import { test } from 'node:test';
import assert from 'node:assert/strict';
import { whatIsIt } from '../src/experiments/what-is-it.js';

test('what-is-it content is the real show rounds with images', () => {
  assert.equal(whatIsIt.rounds.length, 7);
  assert.ok(whatIsIt.rounds.every((r) => r.image && r.answer && r.accept.length > 0));
});

test('what-is-it accepts canonical and variant answers, rejects wrong', () => {
  const first = whatIsIt.rounds[0];
  assert.equal(whatIsIt.isCorrect(first, 'Шнуровень'), true);
  assert.equal(whatIsIt.isCorrect(first, '  шнуровень '), true);
  assert.equal(whatIsIt.isCorrect(first, 'шнуровень!'), true);
  assert.equal(whatIsIt.isCorrect(first, 'Шнуров'), false);
  assert.equal(whatIsIt.isCorrect(first, ''), false);

  const ali = whatIsIt.rounds.find((r) => r.answer === 'Мохаммед Алибасов');
  assert.ok(ali);
  assert.equal(whatIsIt.isCorrect(ali, 'Мохаммед Алибасов'), true);
  assert.equal(whatIsIt.isCorrect(ali, 'Алибасов Мохаммед'), true);
});
