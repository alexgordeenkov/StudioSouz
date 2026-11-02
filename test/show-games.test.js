import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  rapVsPolitics,
  songAboutSong,
  degradeMelody,
  retranslation,
  whoDidThis,
} from '../src/experiments/show-games.js';
import { Party } from '../src/party.js';

test('rap-vs-politics accepts only the chosen side', () => {
  const round = { quote: 'Мы поднимаемся', options: ['Рэпер', 'Политик'], answer: 'Рэпер' };
  assert.equal(rapVsPolitics.isCorrect(round, 'рэпер'), true);
  assert.equal(rapVsPolitics.isCorrect(round, '  РЭПЕР '), true);
  assert.equal(rapVsPolitics.isCorrect(round, 'Политик'), false);
  assert.equal(rapVsPolitics.isCorrect(round, ''), false);
});

test('rap-vs-politics exposes the quote in round state and hides the answer', () => {
  const pack = {
    id: 'e1',
    season: 1,
    number: 1,
    rounds: {
      [rapVsPolitics.id]: [{ quote: 'Мы поднимаемся', options: ['Рэпер', 'Политик'], answer: 'Рэпер' }],
    },
  };
  const party = new Party({
    code: 'ABCD',
    experiments: { [rapVsPolitics.id]: rapVsPolitics },
    episodes: [pack],
  });
  party.selectExperiment(rapVsPolitics.id);
  party.startRound();
  const data = party.getState().round.data;
  assert.equal(data.quote, 'Мы поднимаемся');
  assert.deepEqual(data.options, ['Рэпер', 'Политик']);
  assert.equal('answer' in data, false);
});

test('song-about-song accepts the original hit and keeps its media title', () => {
  const round = {
    mediaTitle: 'Песня о песне — Владимирский централ',
    answer: 'Владимирский централ',
    accept: ['владимирский централ', 'централ'],
  };
  assert.equal(songAboutSong.isCorrect(round, 'Владимирский централ'), true);
  assert.equal(songAboutSong.isCorrect(round, 'Централ'), true);
  assert.equal(songAboutSong.isCorrect(round, 'Кукла'), false);

  const pack = {
    id: 'e1',
    season: 1,
    number: 1,
    rounds: { [songAboutSong.id]: [round] },
  };
  const party = new Party({
    code: 'ABCD',
    experiments: { [songAboutSong.id]: songAboutSong },
    episodes: [pack],
  });
  party.selectExperiment(songAboutSong.id);
  party.startRound();
  const data = party.getState().round.data;
  assert.equal(data.mediaTitle, round.mediaTitle);
  assert.equal('answer' in data, false);
});
