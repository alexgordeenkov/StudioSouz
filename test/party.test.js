import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Party } from '../src/party.js';

const norm = (/** @type {string} */ s) =>
  String(s).toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9]/g, '');

const testExp = {
  id: 'test',
  name: 'Тест',
  rules: 'Правила теста',
  rounds: [
    { clues: ['a', 'b'], answer: 'Уилл Митяев', accept: ['уилл митяев', 'митяев уилл'] },
    { clues: ['c', 'd'], answer: 'Алла Джонсон', accept: ['алла джонсон'] },
  ],
  /** @param {{ accept: string[] }} round @param {string} value */
  isCorrect(round, value) {
    const n = norm(value);
    return !!n && round.accept.some((a) => norm(a) === n);
  },
};

function makeParty() {
  return new Party({ code: 'ABCD', experiments: { test: testExp } });
}

test('participant joins and appears in lobby state', () => {
  const party = makeParty();
  const p = party.addParticipant('Маша');
  assert.equal(p.name, 'Маша');
  assert.equal(p.score, 0);
  const state = party.getState();
  assert.equal(state.code, 'ABCD');
  assert.equal(state.mode, 'solo');
  assert.equal(state.phase, 'lobby');
  assert.deepEqual(state.participants.map((x) => x.name), ['Маша']);
});

test('participant name is trimmed and required', () => {
  const party = makeParty();
  assert.equal(party.addParticipant('  Лёша  ').name, 'Лёша');
  assert.throws(() => party.addParticipant('   '), /Имя/);
});

test('host can remove a participant', () => {
  const party = makeParty();
  const p = party.addParticipant('Маша');
  assert.equal(party.removeParticipant(p.id), true);
  assert.equal(party.getState().participants.length, 0);
  assert.equal(party.removeParticipant('nope'), false);
});

test('host can switch mode between solo and teams', () => {
  const party = makeParty();
  party.setMode('teams');
  assert.equal(party.getState().mode, 'teams');
  // @ts-expect-error: проверяем недопустимый режим
  assert.throws(() => party.setMode('bad'), /режим/);
});

test('selecting an experiment shows its rules and hides the round', () => {
  const party = makeParty();
  party.selectExperiment('test');
  const state = party.getState();
  assert.equal(state.phase, 'experiment');
  assert.equal(state.experiment?.name, 'Тест');
  assert.equal(state.experiment?.totalRounds, 2);
  assert.equal(state.round, null);
});

test('starting a round exposes clues but never the answer', () => {
  const party = makeParty();
  party.selectExperiment('test');
  party.startRound();
  const state = party.getState();
  assert.equal(state.phase, 'round');
  assert.equal(state.round?.index, 0);
  assert.deepEqual(state.round?.data.clues, ['a', 'b']);
  assert.equal('answer' in (state.round?.data ?? {}), false);
});

test('answers are stored once and only during a round', () => {
  const party = makeParty();
  const p = party.addParticipant('Маша');
  assert.throws(() => party.submitAnswer(p.id, 'Уилл Митяев'), /нельзя отвечать/);
  party.selectExperiment('test');
  party.startRound();
  party.submitAnswer(p.id, 'Уилл Митяев');
  assert.equal(party.getState().answersCount, 1);
  assert.throws(() => party.submitAnswer(p.id, 'ещё раз'), /уже принят/);
});

test('reveal awards a point per correct answer and a speed bonus to the first', () => {
  const party = makeParty();
  const a = party.addParticipant('A');
  const b = party.addParticipant('B');
  const c = party.addParticipant('C');
  party.selectExperiment('test');
  party.startRound();
  party.submitAnswer(a.id, 'Уилл Митяев', 2000);
  party.submitAnswer(b.id, 'митяев уилл', 3000);
  party.submitAnswer(c.id, 'Уилл Митяев', 1000);
  const reveal = party.revealRound();
  assert.equal(reveal.answer, 'Уилл Митяев');
  const points = Object.fromEntries(reveal.results.map((r) => [r.name, r.points]));
  assert.equal(points.A, 1);
  assert.equal(points.B, 1);
  assert.equal(points.C, 2);
  const scores = Object.fromEntries(party.getState().participants.map((p) => [p.name, p.score]));
  assert.deepEqual(scores, { A: 1, B: 1, C: 2 });
});

test('next round advances, and after the last round the experiment ends', () => {
  const party = makeParty();
  party.selectExperiment('test');
  party.startRound();
  party.revealRound();
  assert.deepEqual(party.nextRound(), { finished: false });
  assert.equal(party.getState().round?.index, 1);
  party.revealRound();
  assert.deepEqual(party.nextRound(), { finished: true });
  assert.equal(party.getState().phase, 'results');
});

test('reveal shows the answer and per-player results', () => {
  const party = makeParty();
  const a = party.addParticipant('A');
  party.selectExperiment('test');
  party.startRound();
  party.submitAnswer(a.id, 'Алла Джонсон');
  party.revealRound();
  const state = party.getState();
  assert.equal(state.phase, 'reveal');
  assert.equal(state.reveal?.answer, 'Уилл Митяев');
  assert.equal(state.reveal?.results.length, 1);
  assert.equal(state.reveal?.results[0].correct, false);
});

test('speed bonus can be turned off by the host', () => {
  const party = makeParty();
  const a = party.addParticipant('A');
  const b = party.addParticipant('B');
  party.setSpeedBonus(false);
  party.selectExperiment('test');
  party.startRound();
  party.submitAnswer(a.id, 'Уилл Митяев', 1000);
  party.submitAnswer(b.id, 'Уилл Митяев', 2000);
  const reveal = party.revealRound();
  const points = Object.fromEntries(reveal.results.map((r) => [r.name, r.points]));
  assert.equal(points.A, 1);
  assert.equal(points.B, 1);
});

test('media can be played, paused, resumed and skipped', async () => {
  const resolver = {
    resolve: async () => ({ source: 'youtube', youtubeId: 'abc123DEF45', title: 'Тест' }),
  };
  const party = new Party({ code: 'ABCD', mediaResolver: resolver });
  const media = await party.playMedia({ title: 'Тест' });
  assert.equal(media.source, 'youtube');
  assert.equal(party.getState().media.playing, true);
  party.pauseMedia();
  assert.equal(party.getState().media.playing, false);
  party.resumeMedia();
  assert.equal(party.getState().media.playing, true);
  party.skipMedia();
  assert.equal(party.getState().media, null);
});

test('revealing a round clears the media layer', async () => {
  const mediaExp = {
    id: 'media',
    name: 'Медиа',
    rules: '',
    rounds: [{ media: { localFile: 'x' }, answer: 'A', accept: ['a'] }],
    isCorrect(/** @type {any} */ round, /** @type {string} */ value) {
      return norm(value) === 'a';
    },
  };
  const resolver = {
    resolve: async (/** @type {any} */ req) => ({
      source: 'local',
      localUrl: '/x.mp3',
      title: req.localFile,
    }),
  };
  const party = new Party({ code: 'ABCD', experiments: { media: mediaExp }, mediaResolver: resolver });
  party.selectExperiment('media');
  party.startRound();
  await party.autoPlayRoundMedia();
  assert.ok(party.getState().media);
  party.revealRound();
  assert.equal(party.getState().media, null);
});

test('hint audio exposes only variants whose files exist', () => {
  const hintExp = {
    id: 'hint',
    name: 'Подсказка',
    rules: '',
    rounds: [{ answer: 'Песня', accept: ['песня'], hint: 'H', hintMedia: 'pesnya' }],
    isCorrect(/** @type {any} */ round, /** @type {string} */ value) {
      return norm(value) === 'песня';
    },
  };
  const party = new Party({ code: 'ABCD', experiments: { hint: hintExp } });
  party.selectExperiment('hint');
  party.startRound();

  assert.equal(party.getState({ forHost: true }).round?.data.hintAudio, undefined);
  assert.throws(() => party.playHintMedia('vocal'), /недоступен/);

  party.setLocalAudio(['pesnya']);
  assert.deepEqual(party.getState({ forHost: true }).round?.data.hintAudio, {
    vocal: '/media/audio/pesnya.mp3',
  });

  party.setLocalAudio(['pesnya', 'pesnya-instrumental']);
  assert.deepEqual(party.getState({ forHost: true }).round?.data.hintAudio, {
    vocal: '/media/audio/pesnya.mp3',
    instrumental: '/media/audio/pesnya-instrumental.mp3',
  });
  assert.equal('hintMedia' in (party.getState().round?.data ?? {}), false);
});

test('host plays, pauses and switches hint audio before reveal', () => {
  const hintExp = {
    id: 'hint',
    name: 'Подсказка',
    rules: '',
    rounds: [{ answer: 'Песня', accept: ['песня'], hint: 'H', hintMedia: 'pesnya' }],
    isCorrect(/** @type {any} */ round, /** @type {string} */ value) {
      return norm(value) === 'песня';
    },
  };
  const party = new Party({ code: 'ABCD', experiments: { hint: hintExp } });
  party.setLocalAudio(['pesnya', 'pesnya-instrumental']);
  party.selectExperiment('hint');
  party.startRound();

  const media = party.playHintMedia('instrumental');
  assert.equal(media.hint, true);
  assert.equal(media.hintVariant, 'instrumental');
  assert.equal(media.playing, true);

  party.playHintMedia('instrumental');
  assert.equal(party.getState().media?.playing, false);

  party.playHintMedia('vocal');
  assert.equal(party.getState().media?.hintVariant, 'vocal');
  assert.equal(party.getState().media?.playing, true);

  party.revealHint();
  party.playHintMedia('instrumental');
  assert.equal(party.getState().media?.hintVariant, 'instrumental');

  party.revealRound();
  assert.equal(party.getState().media, null);
  assert.throws(() => party.playHintMedia('vocal'), /не раунд/);
});

test('screen progress updates the active hint and seek is clamped', () => {
  const hintExp = {
    id: 'hint',
    name: 'Подсказка',
    rules: '',
    rounds: [{ answer: 'Песня', accept: ['песня'], hint: 'H', hintMedia: 'pesnya' }],
    isCorrect(/** @type {any} */ round, /** @type {string} */ value) {
      return norm(value) === 'песня';
    },
  };
  const party = new Party({ code: 'ABCD', experiments: { hint: hintExp } });
  party.setLocalAudio(['pesnya']);
  party.selectExperiment('hint');
  party.startRound();
  const media = party.playHintMedia('vocal');

  assert.equal(party.mediaProgress('other', 10, 100), false);
  assert.equal(party.mediaProgress(media.id, 42, 195), true);
  assert.deepEqual(party.getState({ forHost: true }).media?.progress, { currentTime: 42, duration: 195 });

  party.seekMedia(250);
  assert.equal(party.getState().media?.seekTo, 195);
  assert.equal(party.getState().media?.seekToken, 1);
});

test('a round reveal can play the full version and clears it on results', async () => {
  const mediaExp = {
    id: 'media',
    name: 'Медиа',
    rules: '',
    rounds: [
      {
        media: { localFile: 'short' },
        revealMedia: { localFile: 'full' },
        answer: 'A',
        accept: ['a'],
      },
    ],
    isCorrect(/** @type {any} */ round, /** @type {string} */ value) {
      return norm(value) === 'a';
    },
  };
  const resolver = {
    resolve: async (/** @type {any} */ req) => ({
      source: 'local',
      localUrl: `/${req.localFile}.mp3`,
      title: req.localFile,
    }),
  };
  const party = new Party({ code: 'ABCD', experiments: { media: mediaExp }, mediaResolver: resolver });
  party.selectExperiment('media');
  party.startRound();
  await party.autoPlayRoundMedia();
  assert.equal(party.getState().media?.localUrl, '/short.mp3');
  party.revealRound();
  await party.autoPlayRevealMedia();
  assert.equal(party.getState().media?.localUrl, '/full.mp3');
  assert.equal(party.getState().media?.reveal, true);
  party.nextRound();
  assert.equal(party.getState().media, null);
});

const drawExp = {
  id: 'draw',
  name: 'Рисуй',
  kind: 'drawing',
  rules: '',
  rounds: [{ answer: 'Кукла', accept: ['кукла'] }],
  /** @param {{ accept: string[] }} round @param {string} value */
  isCorrect(round, value) {
    return norm(value) === 'кукла';
  },
};

test('drawing round assigns a drawer, stores strokes, and skips the drawer in scoring', () => {
  const party = new Party({ code: 'ABCD', experiments: { draw: drawExp } });
  const a = party.addParticipant('A');
  const b = party.addParticipant('B');
  party.selectExperiment('draw');
  party.startRound();
  const state = party.getState();
  assert.equal(state.experiment?.kind, 'drawing');
  assert.ok(state.drawerId);

  party.draw({ x0: 0, y0: 0, x1: 1, y1: 1 });
  assert.equal(party.getState().drawing.length, 1);
  party.undoDrawing();
  assert.equal(party.getState().drawing.length, 0);
  party.draw({ x0: 0, y0: 0, x1: 1, y1: 1 });
  party.clearDrawing();
  assert.equal(party.getState().drawing.length, 0);

  const guesser = a.id === party.drawerId ? b : a;
  party.submitAnswer(guesser.id, 'Кукла');
  const reveal = party.revealRound();
  assert.equal(reveal.results.length, 1);
  assert.equal(reveal.results[0].correct, true);
});

test('finishing the party shows the top scorer as winner', () => {
  const party = makeParty();
  const a = party.addParticipant('A');
  const b = party.addParticipant('B');
  a.score = 3;
  b.score = 5;
  party.finishParty();
  const state = party.getState();
  assert.equal(state.phase, 'winner');
  assert.equal(state.winner?.name, 'B');
  assert.equal(state.winner?.score, 5);
});

test('a dropped participant stays in the party and can reconnect', () => {
  const party = makeParty();
  const a = party.addParticipant('A');
  party.markDisconnected(a.id);
  assert.equal(party.getState().participants[0].connected, false);
  assert.equal(party.getState().participants.length, 1);
  party.markConnected(a.id);
  assert.equal(party.getState().participants[0].connected, true);
});
