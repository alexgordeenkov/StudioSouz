import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nobodySings } from '../src/experiments/nobody-sings.js';
import { Party } from '../src/party.js';

test('nobody-sings rounds have a muted clip, three options and a correct answer', () => {
  assert.ok(nobodySings.rounds.length >= 3);
  for (const round of nobodySings.rounds) {
    assert.ok(round.mediaTitle);
    assert.equal(round.muted, true);
    assert.equal(round.options.length, 3);
    assert.ok(round.options.includes(round.answer));
    assert.equal(nobodySings.isCorrect(round, round.answer), true);
    const wrong = round.options.find((o) => o !== round.answer);
    assert.equal(nobodySings.isCorrect(round, wrong), false);
  }
});

test('starting a media-quiz round autoplays its muted media and hides the answer', async () => {
  const resolver = {
    resolve: async (req) => ({ source: 'youtube', youtubeId: 'abc123DEF45', title: req.title }),
  };
  const party = new Party({
    code: 'ABCD',
    experiments: { [nobodySings.id]: nobodySings },
    mediaResolver: resolver,
  });
  party.addParticipant('A');
  party.selectExperiment(nobodySings.id);
  party.startRound();
  await party.autoPlayRoundMedia();
  const state = party.getState();
  assert.equal(state.media.source, 'youtube');
  assert.equal(state.media.muted, true);
  assert.deepEqual(state.round.data.options, nobodySings.rounds[0].options);
  assert.equal('answer' in state.round.data, false);
});
