import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  songAboutSong,
  degradeMelody,
  retranslation,
  rhymeBall,
} from '../src/experiments/show-games.js';
import { Party } from '../src/party.js';

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

test('degrade-melody accepts the song title in any case', () => {
  const round = { mediaTitle: 'Унижай мелодию', answer: 'Комарово' };
  assert.equal(degradeMelody.isCorrect(round, 'комарово'), true);
  assert.equal(degradeMelody.isCorrect(round, '  КОМАРОВО '), true);
  assert.equal(degradeMelody.isCorrect(round, 'Кукла'), false);
  assert.equal(degradeMelody.isCorrect(round, ''), false);
});

test('retranslation shows the distorted text and hides the answer', () => {
  const text = 'Я поднимаюсь со дна\nи мне уже не страшно';
  const round = { text, answer: 'Мокрые кроссы', accept: ['мокрые кроссы'] };
  assert.equal(retranslation.isCorrect(round, 'Мокрые кроссы'), true);
  assert.equal(retranslation.isCorrect(round, 'Кукла'), false);

  const pack = {
    id: 'e2',
    season: 1,
    number: 2,
    rounds: { [retranslation.id]: [round] },
  };
  const party = new Party({
    code: 'ABCD',
    experiments: { [retranslation.id]: retranslation },
    episodes: [pack],
  });
  party.selectExperiment(retranslation.id);
  party.startRound();
  const data = party.getState().round.data;
  assert.equal(data.text, text);
  assert.equal('answer' in data, false);
});

test('rhyme-ball is a choice quiz with a hidden answer', () => {
  const round = {
    prompt: 'Чем заканчивается песня?',
    options: ['Дикобраз', 'Гондурас', 'Унитаз', 'Голубой'],
    answer: 'Унитаз',
  };
  assert.equal(rhymeBall.isCorrect(round, 'унитаз'), true);
  assert.equal(rhymeBall.isCorrect(round, 'Гондурас'), false);

  const pack = {
    id: 'e39',
    season: 3,
    number: 39,
    rounds: { [rhymeBall.id]: [round] },
  };
  const party = new Party({
    code: 'ABCD',
    experiments: { [rhymeBall.id]: rhymeBall },
    episodes: [pack],
  });
  party.selectExperiment(rhymeBall.id);
  party.startRound();
  const data = party.getState().round.data;
  assert.deepEqual(data.options, round.options);
  assert.equal(data.prompt, round.prompt);
  assert.equal('answer' in data, false);
});
