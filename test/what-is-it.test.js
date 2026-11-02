import { test } from 'node:test';
import assert from 'node:assert/strict';
import { whatIsIt } from '../src/experiments/what-is-it.js';
import { whatIsItRounds } from '../src/content/what-is-it-rounds.js';

test('what-is-it content is the real show rounds with images', () => {
  assert.equal(whatIsIt.rounds.length, 0);
  assert.equal(whatIsItRounds.length, 17);
  assert.ok(whatIsItRounds.every((r) => r.image && r.answer && r.accept.length > 0));
});

test('what-is-it accepts canonical and variant answers, rejects wrong', () => {
  const first = whatIsItRounds[0];
  assert.equal(whatIsIt.isCorrect(first, 'Шнуровень'), true);
  assert.equal(whatIsIt.isCorrect(first, '  шнуровень '), true);
  assert.equal(whatIsIt.isCorrect(first, 'шнуровень!'), true);
  assert.equal(whatIsIt.isCorrect(first, 'Шнуров'), false);
  assert.equal(whatIsIt.isCorrect(first, ''), false);

  const ali = whatIsItRounds.find((r) => r.answer === 'Мохаммед Алибасов');
  assert.ok(ali);
  assert.equal(whatIsIt.isCorrect(ali, 'Мохаммед Алибасов'), true);
  assert.equal(whatIsIt.isCorrect(ali, 'Алибасов Мохаммед'), true);
});
