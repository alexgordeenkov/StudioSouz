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

/**
 * @param {'screen' | 'host' | 'controller'} role
 * @param {string | null} [participantId]
 */
function mkConn(role, participantId = null) {
  return { role, participantId };
}

function makeParty() {
  return new Party({ code: 'ABCD', experiments: { test: testExp } });
}

function stateOf(effects) {
  return effects.find((e) => e.payload.type === 'state');
}

test('controller joins and state is broadcast', () => {
  const party = makeParty();
  const c = mkConn('controller');
  const effects = handleMessage(party, c, { type: 'join', name: 'Маша', code: 'ABCD' }, [c]);
  assert.equal(c.participantId, '1');
  assert.equal(party.getState().participants.length, 1);
  const s = stateOf(effects);
  assert.ok(s);
  assert.equal(s.kind, 'broadcast');
  assert.equal(s.payload.participants[0].name, 'Маша');
});

test('join with wrong code is rejected', () => {
  const party = makeParty();
  const c = mkConn('controller');
  const effects = handleMessage(party, c, { type: 'join', name: 'Маша', code: 'ZZZZ' }, [c]);
  assert.equal(party.getState().participants.length, 0);
  assert.ok(effects.some((e) => e.payload.type === 'error'));
});

test('join with empty name is rejected', () => {
  const party = makeParty();
  const c = mkConn('controller');
  const effects = handleMessage(party, c, { type: 'join', name: '   ', code: 'ABCD' }, [c]);
  assert.equal(party.getState().participants.length, 0);
  assert.ok(effects.some((e) => e.payload.type === 'error'));
});

test('non-controller cannot join', () => {
  const party = makeParty();
  const c = mkConn('screen');
  const effects = handleMessage(party, c, { type: 'join', name: 'Маша', code: 'ABCD' }, [c]);
  assert.equal(party.getState().participants.length, 0);
  assert.ok(effects.some((e) => e.payload.type === 'error'));
});

test('host kicks a participant, who is notified and removed', () => {
  const party = makeParty();
  const ctrl = mkConn('controller');
  handleMessage(party, ctrl, { type: 'join', name: 'Маша', code: 'ABCD' }, [ctrl]);
  const host = mkConn('host');
  const effects = handleMessage(party, host, { type: 'kick', participantId: '1' }, [ctrl, host]);
  assert.equal(party.getState().participants.length, 0);
  assert.equal(ctrl.participantId, null);
  assert.ok(effects.some((e) => e.target === ctrl && e.payload.type === 'kicked'));
});

test('host changes mode and state is broadcast', () => {
  const party = makeParty();
  const host = mkConn('host');
  const effects = handleMessage(party, host, { type: 'set-mode', mode: 'teams' }, [host]);
  assert.equal(party.getState().mode, 'teams');
  assert.equal(stateOf(effects)?.payload.mode, 'teams');
});

test('non-host cannot kick, change mode, or start an experiment', () => {
  const party = makeParty();
  const ctrl = mkConn('controller', '1');
  const e1 = handleMessage(party, ctrl, { type: 'kick', participantId: '1' }, [ctrl]);
  const e2 = handleMessage(party, ctrl, { type: 'set-mode', mode: 'teams' }, [ctrl]);
  const e3 = handleMessage(party, ctrl, { type: 'start-experiment', experimentId: 'test' }, [ctrl]);
  assert.ok(e1.some((e) => e.payload.type === 'error'));
  assert.ok(e2.some((e) => e.payload.type === 'error'));
  assert.ok(e3.some((e) => e.payload.type === 'error'));
  assert.equal(party.getState().mode, 'solo');
  assert.equal(party.getState().phase, 'lobby');
});

test('host runs an experiment end to end and scores are awarded', () => {
  const party = makeParty();
  const host = mkConn('host');
  const a = mkConn('controller');
  const b = mkConn('controller');
  handleMessage(party, a, { type: 'join', name: 'A', code: 'ABCD' }, [host, a, b]);
  handleMessage(party, b, { type: 'join', name: 'B', code: 'ABCD' }, [host, a, b]);

  handleMessage(party, host, { type: 'start-experiment', experimentId: 'test' }, [host, a, b]);
  assert.equal(party.getState().phase, 'experiment');

  handleMessage(party, host, { type: 'start-round' }, [host, a, b]);
  assert.equal(party.getState().phase, 'round');

  const accepted = handleMessage(party, a, { type: 'submit-answer', value: 'Уилл Митяев' }, [host, a, b]);
  assert.ok(accepted.some((e) => e.payload.type === 'answer-accepted'));
  assert.equal(party.getState().answersCount, 1);

  handleMessage(party, host, { type: 'reveal' }, [host, a, b]);
  const state = party.getState();
  assert.equal(state.phase, 'reveal');
  assert.equal(state.reveal?.answer, 'Уилл Митяев');
  const scoreA = state.participants.find((p) => p.name === 'A')?.score;
  const scoreB = state.participants.find((p) => p.name === 'B')?.score;
  assert.equal(scoreA, 2);
  assert.equal(scoreB, 0);
});

test('controller cannot submit an answer outside a round', () => {
  const party = makeParty();
  const c = mkConn('controller');
  handleMessage(party, c, { type: 'join', name: 'A', code: 'ABCD' }, [c]);
  const effects = handleMessage(party, c, { type: 'submit-answer', value: 'Уилл Митяев' }, [c]);
  assert.ok(effects.some((e) => e.payload.type === 'error'));
});
