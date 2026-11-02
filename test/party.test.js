import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Party } from '../src/party.js';

test('participant joins and appears in lobby state', () => {
  const party = new Party({ code: 'ABCD' });
  const p = party.addParticipant('Маша');
  assert.equal(p.name, 'Маша');
  assert.equal(p.score, 0);
  const state = party.getState();
  assert.equal(state.code, 'ABCD');
  assert.equal(state.mode, 'solo');
  assert.deepEqual(state.participants.map((x) => x.name), ['Маша']);
});

test('participant name is trimmed and required', () => {
  const party = new Party({ code: 'ABCD' });
  assert.equal(party.addParticipant('  Лёша  ').name, 'Лёша');
  assert.throws(() => party.addParticipant('   '), /Имя/);
});

test('host can remove a participant', () => {
  const party = new Party({ code: 'ABCD' });
  const p = party.addParticipant('Маша');
  assert.equal(party.removeParticipant(p.id), true);
  assert.equal(party.getState().participants.length, 0);
  assert.equal(party.removeParticipant('nope'), false);
});

test('host can switch mode between solo and teams', () => {
  const party = new Party({ code: 'ABCD' });
  party.setMode('teams');
  assert.equal(party.getState().mode, 'teams');
  // @ts-expect-error: проверяем недопустимый режим
  assert.throws(() => party.setMode('bad'), /режим/);
});
