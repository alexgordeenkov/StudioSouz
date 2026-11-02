import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractYouTubeId, createMediaResolver } from '../src/media.js';

test('extractYouTubeId understands ids and YouTube URLs', () => {
  assert.equal(extractYouTubeId('kJd-VhYgIns'), 'kJd-VhYgIns');
  assert.equal(extractYouTubeId('https://youtu.be/kJd-VhYgIns?si=x'), 'kJd-VhYgIns');
  assert.equal(extractYouTubeId('https://www.youtube.com/watch?v=kJd-VhYgIns'), 'kJd-VhYgIns');
  assert.equal(extractYouTubeId('https://www.youtube.com/embed/kJd-VhYgIns'), 'kJd-VhYgIns');
  assert.equal(extractYouTubeId('просто текст'), null);
  assert.equal(extractYouTubeId(''), null);
});

function resolverWith(search, locals = []) {
  return createMediaResolver({ search: async () => search, listLocal: async () => locals });
}

test('resolve prefers an explicit youtube id', async () => {
  const media = await resolverWith(null).resolve({ title: 'Любая песня', youtubeId: 'abc123DEF45' });
  assert.equal(media.source, 'youtube');
  assert.equal(media.youtubeId, 'abc123DEF45');
});

test('resolve finds a youtube video by title', async () => {
  const media = await resolverWith('kJd-VhYgIns').resolve({ title: 'Студия Союз' });
  assert.equal(media.source, 'youtube');
  assert.equal(media.youtubeId, 'kJd-VhYgIns');
});

test('resolve falls back to a local MP3 when youtube search fails', async () => {
  const locals = [{ name: 'Студия Союз 1 выпуск', url: '/media/audio/soyuz.mp3' }];
  const media = await resolverWith(null, locals).resolve({ title: 'Студия Союз' });
  assert.equal(media.source, 'local');
  assert.equal(media.localUrl, '/media/audio/soyuz.mp3');
});

test('resolve throws when nothing is available', async () => {
  await assert.rejects(() => resolverWith(null, []).resolve({ title: 'Нет такого' }), /не найдено/);
});
