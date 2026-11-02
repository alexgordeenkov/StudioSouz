import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Party } from '../src/party.js';
import { episodes } from '../src/content/episodes.js';

const norm = (/** @type {string} */ s) =>
  String(s).toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9]/g, '');

/** @type {import('../src/party.js').Experiment<any>} */
const quiz = {
  id: 'quiz',
  name: 'Квиз',
  rules: 'Правила',
  rounds: [{ answer: 'A', accept: ['a'] }],
  isCorrect(round, value) {
    return norm(value) === 'a';
  },
};

/** @type {import('../src/party.js').Experiment<any>} */
const draw = {
  id: 'draw',
  name: 'Рисуй',
  kind: 'drawing',
  rules: 'Правила',
  rounds: [{ answer: 'Кукла', accept: ['кукла'] }],
  isCorrect(round, value) {
    return norm(value) === 'кукла';
  },
};

const packs = [
  { id: 's1', season: 1, number: 1, title: 'Выпуск 1', rounds: { quiz: quiz.rounds } },
  { id: 's2', season: 1, number: 2, title: 'Выпуск 2', rounds: { draw: draw.rounds } },
];

function makeParty() {
  return new Party({ code: 'ABCD', experiments: { quiz, draw }, episodes: packs });
}

test('party defaults to the first episode and shows only its experiments', () => {
  const party = makeParty();
  const state = party.getState();
  assert.equal(state.episode?.id, 's1');
  assert.deepEqual(
    state.availableExperiments.map((e) => e.id),
    ['quiz']
  );
});

test('switching episodes changes available experiments and resets the game', () => {
  const party = makeParty();
  party.selectExperiment('quiz');
  party.startRound();
  assert.equal(party.getState().phase, 'round');
  assert.throws(() => party.setEpisode('s2'), /только в лобби/);

  party.backToLobby();
  party.setEpisode('s2');
  const state = party.getState();
  assert.equal(state.episode?.id, 's2');
  assert.equal(state.phase, 'lobby');
  assert.deepEqual(
    state.availableExperiments.map((e) => e.id),
    ['draw']
  );
});

test('selectExperiment uses pack rounds and rejects games without content', () => {
  const party = makeParty();
  assert.throws(() => party.selectExperiment('draw'), /нет такой игры/);
  party.selectExperiment('quiz');
  assert.equal(party.getState().experiment?.totalRounds, 1);

  party.backToLobby();
  party.setEpisode('s2');
  assert.throws(() => party.selectExperiment('quiz'), /нет такой игры/);
  party.selectExperiment('draw');
  assert.equal(party.getState().experiment?.totalRounds, 1);
});

test('host picks a drawer on the preparation screen and it is used for the round', () => {
  const party = makeParty();
  const a = party.addParticipant('A');
  const b = party.addParticipant('B');

  // В не-рисующем эксперименте выбрать рисующего нельзя.
  party.selectExperiment('quiz');
  assert.throws(() => party.setPendingDrawer(a.id), /никто не рисует/);
  party.backToLobby();

  party.setEpisode('s2');
  party.selectExperiment('draw');
  party.setPendingDrawer(b.id);
  assert.equal(party.getState().pendingDrawerId, b.id);
  party.startRound();
  assert.equal(party.getState().drawerId, b.id);
  assert.equal(party.getState().pendingDrawerId, null);
});

test('real episode packs cover the show and carry non-empty rounds', () => {
  assert.ok(episodes.length >= 3);
  for (const pack of episodes) {
    assert.ok(pack.id);
    assert.ok(pack.season >= 1);
    assert.ok(pack.number >= 1);
    assert.ok(Object.keys(pack.rounds).length > 0, pack.id + ' has no rounds');
    for (const [exp, rounds] of Object.entries(pack.rounds)) {
      assert.ok(Array.isArray(rounds) && rounds.length > 0, `${pack.id}:${exp} empty`);
    }
  }
});

test('episode 1 carries the extracted games from the first show', () => {
  const pack = episodes.find((e) => e.id === 's1e1');
  assert.ok(pack);
  assert.equal(pack.rounds['what-is-it'].length, 7);
  assert.equal(pack.rounds['rap-vs-politics'].length, 6);
  assert.ok(pack.rounds['song-about-song'].length >= 1);
  assert.ok(pack.rounds['degrade-melody'].length >= 2);
  assert.ok(pack.rounds['who-did-this'].length >= 1);

  for (const round of pack.rounds['rap-vs-politics']) {
    assert.ok(round.quote);
    assert.ok(round.options.includes(round.answer));
  }
  for (const round of pack.rounds['who-did-this']) {
    assert.equal(round.muted, true);
    assert.ok(round.options.includes(round.answer));
  }
});

test('episode 2 carries the retranslation rounds', () => {
  const pack = episodes.find((e) => e.id === 's1e2');
  assert.ok(pack);
  assert.equal(pack.rounds['what-is-it'].length, 10);
  assert.equal(pack.rounds.retranslation.length, 3);
  for (const round of pack.rounds.retranslation) {
    assert.ok(round.text);
    assert.ok(round.answer);
  }
});

test('episode 3 carries clipobol and draw-song rounds', () => {
  const pack = episodes.find((e) => e.id === 's3e24');
  assert.ok(pack);
  assert.ok(pack.rounds['draw-song'].length >= 2);
  assert.ok(pack.rounds.clipobol.length >= 1);
  for (const round of pack.rounds.clipobol) {
    assert.ok(round.options.includes(round.answer));
  }
});
