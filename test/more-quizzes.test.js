import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clipobol, karaokeQuiz, shlyager, cosplay } from '../src/experiments/more-quizzes.js';

for (const exp of [clipobol, karaokeQuiz, shlyager, cosplay]) {
  test(`${exp.id}: rounds are valid and answers are accepted`, () => {
    assert.ok(exp.rounds.length > 0);
    for (const round of exp.rounds) {
      assert.ok(round.answer);
      assert.equal(exp.isCorrect(round, round.answer), true);
      if (round.options) assert.ok(round.options.includes(round.answer));
    }
  });
}
