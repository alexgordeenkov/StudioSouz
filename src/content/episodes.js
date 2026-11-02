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
      // Цитаты и ответы — по кадрам выпуска 1 (10:19–16:49)
      'rap-vs-politics': [
        {
          quote: 'Я ловлю в далёком отголоске, что случится на моём веку',
          options: ['Рэп', 'Политика'],
          answer: 'Политика',
        },
        {
          quote: 'Я люблю твой замысел упрямый и играть согласен эту роль',
          options: ['Рэп', 'Политика'],
          answer: 'Политика',
        },
        {
          quote: 'Я ни разу не играл в ГТА',
          options: ['Рэп', 'Политика'],
          answer: 'Рэп',
        },
        {
          quote: 'Ровно день в день, ровно часы в часы',
          options: ['Рэп', 'Политика'],
          answer: 'Политика',
        },
        {
          quote: 'Печальная статистика: полстраны контужено',
          options: ['Рэп', 'Политика'],
          answer: 'Рэп',
        },
        {
          quote: 'Вот мы на Мхами быут на дипломатическую работу',
          options: ['Рэп', 'Политика'],
          answer: 'Политика',
        },
        {
          quote: 'Я сыт по горло вашей властью, я ухожу',
          options: ['Рэп', 'Политика'],
          answer: 'Рэп',
        },
      ],
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
