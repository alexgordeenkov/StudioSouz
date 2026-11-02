import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Party } from '../src/party.js';
import { handleMessage } from '../src/protocol.js';

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

const fakeMedia = {
  resolve: async (/** @type {{ title?: string }} */ req) => ({
    source: 'local',
    localUrl: '/media/audio/test.mp3',
    title: req.title || 'test',
  }),
};

/**
 * @param {'screen' | 'host' | 'controller'} role
 * @param {string | null} [participantId]
 */
function mkConn(role, participantId = null) {
  return { role, participantId };
}

function makeParty() {
  return new Party({ code: 'ABCD', experiments: { test: testExp }, mediaResolver: fakeMedia });
}

function stateOf(effects) {
  return effects.find((e) => e.payload.type === 'state');
}

test('controller joins and state is broadcast', async () => {
  const party = makeParty();
  const c = mkConn('controller');
  const effects = await handleMessage(party, c, { type: 'join', name: 'Маша', code: 'ABCD' }, [c]);
  assert.equal(c.participantId, '1');
  assert.equal(party.getState().participants.length, 1);
  const s = stateOf(effects);
  assert.ok(s);
  assert.equal(s.kind, 'broadcast');
  assert.equal(s.payload.participants[0].name, 'Маша');
});

test('join with wrong code is rejected', async () => {
  const party = makeParty();
  const c = mkConn('controller');
  const effects = await handleMessage(party, c, { type: 'join', name: 'Маша', code: 'ZZZZ' }, [c]);
  assert.equal(party.getState().participants.length, 0);
  assert.ok(effects.some((e) => e.payload.type === 'error'));
});

test('join with empty name is rejected', async () => {
  const party = makeParty();
  const c = mkConn('controller');
  const effects = await handleMessage(party, c, { type: 'join', name: '   ', code: 'ABCD' }, [c]);
  assert.equal(party.getState().participants.length, 0);
  assert.ok(effects.some((e) => e.payload.type === 'error'));
});

test('non-controller cannot join', async () => {
  const party = makeParty();
  const c = mkConn('screen');
  const effects = await handleMessage(party, c, { type: 'join', name: 'Маша', code: 'ABCD' }, [c]);
  assert.equal(party.getState().participants.length, 0);
  assert.ok(effects.some((e) => e.payload.type === 'error'));
});

test('host kicks a participant, who is notified and removed', async () => {
  const party = makeParty();
  const ctrl = mkConn('controller');
  await handleMessage(party, ctrl, { type: 'join', name: 'Маша', code: 'ABCD' }, [ctrl]);
  const host = mkConn('host');
  const effects = await handleMessage(party, host, { type: 'kick', participantId: '1' }, [ctrl, host]);
  assert.equal(party.getState().participants.length, 0);
  assert.equal(ctrl.participantId, null);
  assert.ok(effects.some((e) => e.target === ctrl && e.payload.type === 'kicked'));
});

test('host changes mode and state is broadcast', async () => {
  const party = makeParty();
  const host = mkConn('host');
  const effects = await handleMessage(party, host, { type: 'set-mode', mode: 'teams' }, [host]);
  assert.equal(party.getState().mode, 'teams');
  assert.equal(stateOf(effects)?.payload.mode, 'teams');
});

test('non-host cannot kick, change mode, or start an experiment', async () => {
  const party = makeParty();
  const ctrl = mkConn('controller', '1');
  const e1 = await handleMessage(party, ctrl, { type: 'kick', participantId: '1' }, [ctrl]);
  const e2 = await handleMessage(party, ctrl, { type: 'set-mode', mode: 'teams' }, [ctrl]);
  const e3 = await handleMessage(party, ctrl, { type: 'start-experiment', experimentId: 'test' }, [ctrl]);
  assert.ok(e1.some((e) => e.payload.type === 'error'));
  assert.ok(e2.some((e) => e.payload.type === 'error'));
  assert.ok(e3.some((e) => e.payload.type === 'error'));
  assert.equal(party.getState().mode, 'solo');
  assert.equal(party.getState().phase, 'lobby');
});

test('host runs an experiment end to end and scores are awarded', async () => {
  const party = makeParty();
  const host = mkConn('host');
  const a = mkConn('controller');
  const b = mkConn('controller');
  await handleMessage(party, a, { type: 'join', name: 'A', code: 'ABCD' }, [host, a, b]);
  await handleMessage(party, b, { type: 'join', name: 'B', code: 'ABCD' }, [host, a, b]);

  await handleMessage(party, host, { type: 'start-experiment', experimentId: 'test' }, [host, a, b]);
  assert.equal(party.getState().phase, 'experiment');

  await handleMessage(party, host, { type: 'start-round' }, [host, a, b]);
  assert.equal(party.getState().phase, 'round');

  const accepted = await handleMessage(party, a, { type: 'submit-answer', value: 'Уилл Митяев' }, [host, a, b]);
  assert.ok(accepted.some((e) => e.payload.type === 'answer-accepted'));
  assert.equal(party.getState().answersCount, 1);

  await handleMessage(party, host, { type: 'reveal' }, [host, a, b]);
  const state = party.getState();
  assert.equal(state.phase, 'reveal');
  assert.equal(state.reveal?.answer, 'Уилл Митяев');
  const scoreA = state.participants.find((p) => p.name === 'A')?.score;
  const scoreB = state.participants.find((p) => p.name === 'B')?.score;
  assert.equal(scoreA, 2);
  assert.equal(scoreB, 0);
});

test('controller cannot submit an answer outside a round', async () => {
  const party = makeParty();
  const c = mkConn('controller');
  await handleMessage(party, c, { type: 'join', name: 'A', code: 'ABCD' }, [c]);
  const effects = await handleMessage(party, c, { type: 'submit-answer', value: 'Уилл Митяев' }, [c]);
  assert.ok(effects.some((e) => e.payload.type === 'error'));
});

test('host plays, pauses and skips media', async () => {
  const party = makeParty();
  const host = mkConn('host');
  const played = await handleMessage(party, host, { type: 'media-play', title: 'Песня' }, [host]);
  assert.equal(stateOf(played)?.payload.media.source, 'local');
  assert.equal(party.getState().media.playing, true);

  await handleMessage(party, host, { type: 'media-control', action: 'pause' }, [host]);
  assert.equal(party.getState().media.playing, false);

  await handleMessage(party, host, { type: 'media-control', action: 'skip' }, [host]);
  assert.equal(party.getState().media, null);
});

test('non-host cannot control media', async () => {
  const party = makeParty();
  const ctrl = mkConn('controller', '1');
  const effects = await handleMessage(party, ctrl, { type: 'media-play', title: 'Песня' }, [ctrl]);
  assert.ok(effects.some((e) => e.payload.type === 'error'));
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

test('only the assigned drawer can draw, and strokes are broadcast', async () => {
  const party = new Party({ code: 'ABCD', experiments: { draw: drawExp } });
  const host = mkConn('host');
  const a = mkConn('controller');
  const b = mkConn('controller');
  await handleMessage(party, a, { type: 'join', name: 'A', code: 'ABCD' }, [host, a, b]);
  await handleMessage(party, b, { type: 'join', name: 'B', code: 'ABCD' }, [host, a, b]);
  await handleMessage(party, host, { type: 'start-experiment', experimentId: 'draw' }, [host, a, b]);
  await handleMessage(party, host, { type: 'start-round' }, [host, a, b]);

  const drawerId = party.getState().drawerId;
  const drawer = drawerId === a.participantId ? a : b;
  const other = drawerId === a.participantId ? b : a;

  const effects = await handleMessage(party, drawer, { type: 'draw', stroke: { x0: 0, y0: 0, x1: 1, y1: 1 } }, [host, a, b]);
  assert.ok(effects.some((e) => e.payload.type === 'draw'));
  assert.equal(party.getState().drawing.length, 1);

  const denied = await handleMessage(party, other, { type: 'draw', stroke: { x0: 0, y0: 0, x1: 1, y1: 1 } }, [host, a, b]);
  assert.ok(denied.some((e) => e.payload.type === 'error'));
});

test('host finishes the party and the winner is shown', async () => {
  const party = makeParty();
  const host = mkConn('host');
  const a = mkConn('controller');
  await handleMessage(party, a, { type: 'join', name: 'A', code: 'ABCD' }, [host, a]);
  await handleMessage(party, host, { type: 'finish-party' }, [host, a]);
  assert.equal(party.getState().phase, 'winner');
  assert.equal(party.getState().winner?.name, 'A');
});

test('a disconnected participant can rejoin with the same id', async () => {
  const party = makeParty();
  const a = mkConn('controller');
  await handleMessage(party, a, { type: 'join', name: 'A', code: 'ABCD' }, [a]);
  const id = a.participantId;
  party.markDisconnected(id);
  const b = mkConn('controller');
  const effects = await handleMessage(party, b, { type: 'rejoin', participantId: id }, [b]);
  assert.equal(b.participantId, id);
  assert.ok(effects.some((e) => e.payload.type === 'joined'));
  assert.equal(party.getState().participants[0].connected, true);
});

test('host selects an episode and the state carries available experiments', async () => {
  const party = new Party({
    code: 'ABCD',
    experiments: { test: testExp },
    episodes: [{ id: 'e1', season: 1, number: 1, title: 'Выпуск 1', rounds: { test: testExp.rounds } }],
  });
  const host = mkConn('host');
  const effects = await handleMessage(party, host, { type: 'select-episode', episodeId: 'e1' }, [host]);
  assert.equal(party.getState().episode?.id, 'e1');
  const s = stateOf(effects);
  assert.ok(s);
  assert.equal(s.payload.availableExperiments[0].id, 'test');
});

test('host reveals a hint and everyone sees it; non-host cannot', async () => {
  const exp = {
    id: 'q',
    name: 'Q',
    rules: '',
    rounds: [{ answer: 'A', hint: 'H' }],
    isCorrect: () => true,
  };
  const party = new Party({ code: 'ABCD', experiments: { q: exp } });
  const host = mkConn('host');
  const ctrl = mkConn('controller');
  await handleMessage(party, host, { type: 'start-experiment', experimentId: 'q' }, [host, ctrl]);
  await handleMessage(party, host, { type: 'start-round' }, [host, ctrl]);

  const denied = await handleMessage(party, ctrl, { type: 'reveal-hint' }, [host, ctrl]);
  assert.ok(denied.some((e) => e.payload.type === 'error'));

  const effects = await handleMessage(party, host, { type: 'reveal-hint' }, [host, ctrl]);
  const broadcast = effects.find((e) => e.kind === 'broadcast');
  assert.equal(broadcast.payload.round.data.hint, 'H');
  assert.equal(broadcast.payload.hintRevealed, true);
  const hostState = effects.find((e) => e.kind === 'direct' && e.target === host);
  assert.equal(hostState.payload.round.data.answer, 'A');
});

test('host adjusts a score; non-host cannot', async () => {
  const party = makeParty();
  const host = mkConn('host');
  const a = mkConn('controller');
  await handleMessage(party, a, { type: 'join', name: 'A', code: 'ABCD' }, [host, a]);
  const id = a.participantId;
  await handleMessage(party, host, { type: 'start-experiment', experimentId: 'test' }, [host, a]);
  await handleMessage(party, host, { type: 'start-round' }, [host, a]);
  await handleMessage(party, host, { type: 'reveal' }, [host, a]);

  const denied = await handleMessage(
    party,
    a,
    { type: 'adjust-score', participantId: id, delta: 1 },
    [host, a]
  );
  assert.ok(denied.some((e) => e.payload.type === 'error'));

  await handleMessage(party, host, { type: 'adjust-score', participantId: id, delta: 1 }, [host, a]);
  assert.equal(party.getState().participants[0].score, 1);
});

test('host restarts media; non-host cannot', async () => {
  const party = makeParty();
  const host = mkConn('host');
  const ctrl = mkConn('controller');
  await handleMessage(party, host, { type: 'media-play', title: 'Песня' }, [host, ctrl]);
  const before = party.getState().media.restartToken ?? 0;

  const denied = await handleMessage(party, ctrl, { type: 'media-control', action: 'restart' }, [host, ctrl]);
  assert.ok(denied.some((e) => e.payload.type === 'error'));

  await handleMessage(party, host, { type: 'media-control', action: 'restart' }, [host, ctrl]);
  assert.equal(party.getState().media.restartToken, before + 1);
  assert.equal(party.getState().media.playing, true);
});

test('next-round autoplays the new round media and clears the old one', async () => {
  const mediaExp = {
    id: 'media',
    name: 'Медиа',
    rules: '',
    rounds: [
      { mediaTitle: 'Первый', answer: 'A' },
      { mediaTitle: 'Второй', answer: 'B' },
    ],
    isCorrect: () => true,
  };
  const resolver = {
    resolve: async (/** @type {{ title?: string }} */ req) => ({
      source: 'youtube',
      youtubeId: 'abcdefghijk',
      title: req.title,
    }),
  };
  const party = new Party({ code: 'ABCD', experiments: { media: mediaExp }, mediaResolver: resolver });
  const host = mkConn('host');
  await handleMessage(party, host, { type: 'start-experiment', experimentId: 'media' }, [host]);
  await handleMessage(party, host, { type: 'start-round' }, [host]);
  assert.equal(party.getState().media?.title, 'Первый');
  await handleMessage(party, host, { type: 'reveal' }, [host]);
  await handleMessage(party, host, { type: 'next-round' }, [host]);
  assert.equal(party.getState().media?.title, 'Второй');
});
