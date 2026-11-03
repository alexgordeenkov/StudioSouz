import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lyricQuiz, artistQuiz } from '../src/experiments/family-games.js';
import { Party } from '../src/party.js';

test('family quizzes accept the correct option and hide the answer', () => {
  const round = {
    prompt: 'Из какой песни эта строка?',
    text: 'Жил-был художник один, домик имел и холсты',
    options: ['Миллион алых роз', 'Айсберг', 'Позови меня с собой'],
    answer: 'Миллион алых роз',
    hint: 'Исполнительница — Алла Пугачёва',
  };
  assert.equal(lyricQuiz.isCorrect(round, 'миллион алых роз'), true);
  assert.equal(lyricQuiz.isCorrect(round, 'Айсберг'), false);
  assert.equal(artistQuiz.isCorrect({ ...round, answer: 'Алла Пугачёва' }, 'алла пугачева'), true);

  const pack = {
    id: 'family',
    season: 0,
    number: 1,
    rounds: { [lyricQuiz.id]: [round] },
  };
  const party = new Party({
    code: 'ABCD',
    experiments: { [lyricQuiz.id]: lyricQuiz },
    episodes: [pack],
  });
  party.selectExperiment(lyricQuiz.id);
  party.startRound();
  const data = party.getState().round.data;
  assert.deepEqual(data.options, round.options);
  assert.equal(data.text, round.text);
  assert.equal('answer' in data, false);
});
