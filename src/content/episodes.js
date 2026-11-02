import { whatIsIt } from '../experiments/what-is-it.js';
import { drawSong } from '../experiments/draw-song.js';

/**
 * @typedef {Object} EpisodePack
 * @property {string} id
 * @property {number} season
 * @property {number} number
 * @property {string} title
 * @property {Record<string, any[]>} rounds
 */

/**
 * Пакеты выпусков. Раунды экспериментов берутся отсюда; сам эксперимент —
 * только формат (название, правила, проверка ответа).
 * @type {EpisodePack[]}
 */
export const episodes = [
  {
    id: 's1e1',
    season: 1,
    number: 1,
    title: 'Сезон 1 · Выпуск 1',
    rounds: {
      // 7 коллажей первого выпуска
      'what-is-it': whatIsIt.rounds.slice(0, 7),
    },
  },
  {
    id: 's1e2',
    season: 1,
    number: 2,
    title: 'Сезон 1 · Выпуск 2',
    rounds: {
      // остальные 10 коллажей второго выпуска
      'what-is-it': whatIsIt.rounds.slice(7),
    },
  },
  {
    id: 's3e24',
    season: 3,
    number: 24,
    title: 'Сезон 3 · Выпуск 24',
    rounds: {
      'draw-song': drawSong.rounds.slice(),
    },
  },
];

/**
 * @param {string} id
 * @returns {EpisodePack | undefined}
 */
export function findEpisode(id) {
  return episodes.find((e) => e.id === id);
}
