import { readdir } from 'node:fs/promises';

/**
 * Возвращает функцию, которая перечисляет локальные MP3 в каталоге.
 * @param {string} dir
 * @returns {() => Promise<Array<{ name: string, url: string }>>}
 */
export function createLocalLister(dir) {
  return async function listLocal() {
    try {
      const files = await readdir(dir);
      return files
        .filter((file) => /\.mp3$/i.test(file))
        .map((file) => ({
          name: file.replace(/\.mp3$/i, ''),
          url: `/media/audio/${encodeURIComponent(file)}`,
        }));
    } catch {
      return [];
    }
  };
}
