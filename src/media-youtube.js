import { execFile } from 'node:child_process';

const YT_DLP = process.env.YT_DLP || 'yt-dlp';

/**
 * Ищет первое видео на YouTube по запросу и возвращает его id (или null).
 * @param {string} query
 * @param {{ timeout?: number }} [opts]
 * @returns {Promise<string | null>}
 */
export function searchYouTube(query, { timeout = 20000 } = {}) {
  return new Promise((resolve) => {
    execFile(
      YT_DLP,
      ['--skip-download', '--no-warnings', '--get-id', `ytsearch1:${query}`],
      { timeout, windowsHide: true },
      (error, stdout) => {
        if (error) return resolve(null);
        const id = String(stdout).trim().split(/\r?\n/)[0];
        resolve(/^[A-Za-z0-9_-]{11}$/.test(id) ? id : null);
      }
    );
  });
}
