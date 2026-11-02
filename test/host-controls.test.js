import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Party } from '../src/party.js';

const quiz = {
  id: 'quiz',
  name: 'Квиз',
  rules: '',
  rounds: [
    { quote: 'Цитата', answer: 'Ответ', hint: 'Подсказка' },
    { quote: 'Без подсказки', answer: 'Ответ 2' },
  ],
  isCorrect: () => true,
};

function makeParty() {
  return new Party({ code: 'ABCD', experiments: { quiz } });
}

test('host sees the answer and hint during a round, players do not', () => {
  const party = makeParty();
  party.selectExperiment('quiz');
  party.startRound();

  const publicState = party.getState();
  assert.equal('answer' in publicState.round.data, false);
  assert.equal('hint' in publicState.round.data, false);

  const hostState = party.getState({ forHost: true });
  assert.equal(hostState.round.data.answer, 'Ответ');
  assert.equal(hostState.round.data.hint, 'Подсказка');
});

test('revealing a hint exposes it to everyone once', () => {
  const party = makeParty();
  party.selectExperiment('quiz');
  party.startRound();
  assert.equal(party.getState().hintRevealed, false);

  party.revealHint();
  const state = party.getState();
  assert.equal(state.hintRevealed, true);
  assert.equal(state.round.data.hint, 'Подсказка');
});

test('hint cannot be revealed when the round has none', () => {
  const party = makeParty();
  party.selectExperiment('quiz');
  party.startRound();
  party.nextRound();
  assert.equal(party.getState().round.index, 1);
  assert.throws(() => party.revealHint(), /подсказк/i);
});

test('hint reveal resets on the next round', () => {
  const party = makeParty();
  party.selectExperiment('quiz');
  party.startRound();
  party.revealHint();
  party.revealRound();
  party.nextRound();
  assert.equal(party.getState().hintRevealed, false);
});

test('host adjusts a score by ±1 and it never goes below zero', () => {
  const party = makeParty();
  const a = party.addParticipant('A');
  assert.equal(a.score, 0);

  party.adjustScore(a.id, 1);
  assert.equal(party.getState().participants.find((p) => p.id === a.id).score, 1);

  party.adjustScore(a.id, -1);
  party.adjustScore(a.id, -1);
  assert.equal(party.getState().participants.find((p) => p.id === a.id).score, 0);
});

test('adjustScore rejects an unknown participant', () => {
  const party = makeParty();
  assert.throws(() => party.adjustScore('nope', 1), /не найден/i);
});

test('restarting media bumps the restart token and keeps it playing', async () => {
  const resolver = {
    resolve: async () => ({ source: 'youtube', youtubeId: 'abc123DEF45', title: 'Трек' }),
  };
  const party = new Party({ code: 'ABCD', mediaResolver: resolver });
  await party.playMedia({ title: 'Трек' });
  party.pauseMedia();
  const before = party.getState().media.restartToken ?? 0;

  party.restartMedia();
  const media = party.getState().media;
  assert.equal(media.playing, true);
  assert.equal(media.restartToken, before + 1);
});

test('restartMedia does nothing when there is no media', () => {
  const party = new Party({ code: 'ABCD' });
  party.restartMedia();
  assert.equal(party.getState().media, null);
});
