import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Party } from '../src/party.js';
import { handleMessage } from '../src/protocol.js';

/**
 * @param {'screen' | 'host' | 'controller'} role
 * @param {string | null} [participantId]
 */
function mkConn(role, participantId = null) {
  return { role, participantId };
}

test('controller joins and lobby is broadcast', () => {
  const party = new Party({ code: 'ABCD' });
  const c = mkConn('controller');
  const effects = handleMessage(party, c, { type: 'join', name: 'Маша', code: 'ABCD' }, [c]);
  assert.equal(c.participantId, '1');
  assert.equal(party.getState().participants.length, 1);
  const lobby = effects.find((e) => e.payload.type === 'lobby');
  assert.ok(lobby);
  assert.equal(lobby.kind, 'broadcast');
  assert.equal(lobby.payload.participants[0].name, 'Маша');
});

test('join with wrong code is rejected', () => {
  const party = new Party({ code: 'ABCD' });
  const c = mkConn('controller');
  const effects = handleMessage(party, c, { type: 'join', name: 'Маша', code: 'ZZZZ' }, [c]);
  assert.equal(party.getState().participants.length, 0);
  assert.ok(effects.some((e) => e.payload.type === 'error'));
});

test('join with empty name is rejected', () => {
  const party = new Party({ code: 'ABCD' });
  const c = mkConn('controller');
  const effects = handleMessage(party, c, { type: 'join', name: '   ', code: 'ABCD' }, [c]);
  assert.equal(party.getState().participants.length, 0);
  assert.ok(effects.some((e) => e.payload.type === 'error'));
});

test('non-controller cannot join', () => {
  const party = new Party({ code: 'ABCD' });
  const c = mkConn('screen');
  const effects = handleMessage(party, c, { type: 'join', name: 'Маша', code: 'ABCD' }, [c]);
  assert.equal(party.getState().participants.length, 0);
  assert.ok(effects.some((e) => e.payload.type === 'error'));
});

test('host kicks a participant, who is notified and removed', () => {
  const party = new Party({ code: 'ABCD' });
  const ctrl = mkConn('controller');
  handleMessage(party, ctrl, { type: 'join', name: 'Маша', code: 'ABCD' }, [ctrl]);
  const host = mkConn('host');
  const effects = handleMessage(party, host, { type: 'kick', participantId: '1' }, [ctrl, host]);
  assert.equal(party.getState().participants.length, 0);
  assert.equal(ctrl.participantId, null);
  assert.ok(effects.some((e) => e.target === ctrl && e.payload.type === 'kicked'));
});

test('host changes mode and lobby is broadcast', () => {
  const party = new Party({ code: 'ABCD' });
  const host = mkConn('host');
  const effects = handleMessage(party, host, { type: 'set-mode', mode: 'teams' }, [host]);
  assert.equal(party.getState().mode, 'teams');
  assert.ok(effects.some((e) => e.payload.type === 'lobby' && e.payload.mode === 'teams'));
});

test('non-host cannot kick or change mode', () => {
  const party = new Party({ code: 'ABCD' });
  const ctrl = mkConn('controller', '1');
  const e1 = handleMessage(party, ctrl, { type: 'kick', participantId: '1' }, [ctrl]);
  const e2 = handleMessage(party, ctrl, { type: 'set-mode', mode: 'teams' }, [ctrl]);
  assert.ok(e1.some((e) => e.payload.type === 'error'));
  assert.ok(e2.some((e) => e.payload.type === 'error'));
  assert.equal(party.getState().mode, 'solo');
});
