/**
 * @param {string} value
 * @returns {string}
 */
function normalize(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9]/g, '');
}

/**
 * @typedef {Object} MediaQuizRound
 * @property {string} [mediaTitle]
 * @property {boolean} [muted]
 * @property {string[]} [options]
 * @property {string} answer
 */

/** @type {import('../party.js').Experiment<MediaQuizRound>} */
export const nobodySings = {
  id: 'nobody-sings',
  name: 'Никто поёт',
  kind: 'quiz',
  rules:
    'На экране клип без звука. Угадайте, кто из трёх исполнителей поёт. ' +
    'Быстрее всех давший верный ответ получает бонус.',
  /** @type {MediaQuizRound[]} */
  rounds: [
    {
      mediaTitle: 'Мокрые кроссы Тима Белорусских клип',
      muted: true,
      options: ['Тима Белорусских', 'ЛСП', 'Мот'],
      answer: 'Тима Белорусских',
    },
    {
      mediaTitle: 'Кукла Иванушки International клип',
      muted: true,
      options: ['Иванушки International', 'Руки Вверх', 'На-На'],
      answer: 'Иванушки International',
    },
    {
      mediaTitle: 'Владимирский централ Михаил Круг клип',
      muted: true,
      options: ['Михаил Круг', 'Сергей Шнуров', 'Григорий Лепс'],
      answer: 'Михаил Круг',
    },
  ],
  /**
   * @param {MediaQuizRound} round
   * @param {string} value
   * @returns {boolean}
   */
  isCorrect(round, value) {
    return normalize(value) === normalize(round.answer);
  },
};
