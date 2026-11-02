/**
 * @typedef {'youtube' | 'local'} MediaSource
 */

/**
 * @typedef {Object} Media
 * @property {MediaSource} source
 * @property {string} title
 * @property {string} [youtubeId]
 * @property {string} [localUrl]
 */

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

/**
 * Достаёт 11-символьный id из ссылки YouTube, либо возвращает id как есть.
 * @param {string} input
 * @returns {string | null}
 */
export function extractYouTubeId(input) {
  if (!input) return null;
  const s = String(input).trim();
  if (YOUTUBE_ID.test(s)) return s;
  try {
    const url = new URL(s);
    if (url.hostname.includes('youtu.be')) {
      const id = url.pathname.slice(1).split('/')[0];
      return YOUTUBE_ID.test(id) ? id : null;
    }
    const v = url.searchParams.get('v');
    if (v && YOUTUBE_ID.test(v)) return v;
    const embed = url.pathname.match(/\/embed\/([A-Za-z0-9_-]{11})/);
    if (embed) return embed[1];
  } catch {
    // не URL — ниже вернём null
  }
  return null;
}

/**
 * @param {string} name
 * @param {string} query
 * @returns {boolean}
 */
function nameMatches(name, query) {
  const n = name.toLowerCase();
  const q = query.toLowerCase();
  return !!q && (n.includes(q) || q.includes(n));
}

/**
 * @typedef {Object} MediaResolverDeps
 * @property {(query: string) => Promise<string | null>} search — поиск видео на YouTube
 * @property {() => Promise<Array<{ name: string, url: string }>>} listLocal — список локальных MP3
 */

/**
 * @param {MediaResolverDeps} deps
 */
export function createMediaResolver({ search, listLocal }) {
  return {
    /**
     * @param {{ title?: string, youtubeId?: string, localFile?: string }} request
     * @returns {Promise<Media>}
     */
    async resolve(request) {
      const title = String(request.title ?? '').trim();
      const explicitId = request.youtubeId || extractYouTubeId(title);
      if (explicitId) {
        return { source: 'youtube', youtubeId: explicitId, title: title || explicitId };
      }

      if (title) {
        try {
          const found = await search(title);
          if (found) return { source: 'youtube', youtubeId: found, title };
        } catch {
          // игнорируем сбой поиска — попробуем локальный фолбэк
        }
      }

      const locals = await listLocal();
      const wanted = String(request.localFile ?? title).trim();
      const match = locals.find((file) => nameMatches(file.name, wanted));
      if (match) return { source: 'local', localUrl: match.url, title: title || match.name };

      throw new Error('Медиа не найдено');
    },
  };
}
