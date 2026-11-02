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
 * @typedef {Object} QuizRound
 * @property {string} [mediaTitle]
 * @property {boolean} [muted]
 * @property {string} [prompt]
 * @property {string[]} [options]
 * @property {string} answer
 */

/** @type {import('../party.js').Experiment<QuizRound>} */
export const clipobol = {
  id: 'clipobol',
  name: 'Клипобол',
  kind: 'quiz',
  rules: 'Отрывок клипа обрывается. Выберите песню, которая звучит в клипе.',
  /** @type {QuizRound[]} */
  rounds: [
    {
      mediaTitle: 'Мокрые кроссы Тима Белорусских клип',
      options: ['Мокрые кроссы', 'Кукла', 'Владимирский централ', 'Извозчик'],
      answer: 'Мокрые кроссы',
    },
    {
      mediaTitle: 'Кукла Иванушки International клип',
      options: ['Кукла', 'Мокрые кроссы', 'Комарово', 'Извозчик'],
      answer: 'Кукла',
    },
    {
      mediaTitle: 'Владимирский централ Михаил Круг клип',
      options: ['Владимирский централ', 'Комарово', 'Кукла', 'Мокрые кроссы'],
      answer: 'Владимирский централ',
    },
  ],
  /**
   * @param {QuizRound} round
   * @param {string} value
   * @returns {boolean}
   */
  isCorrect(round, value) {
    return normalize(value) === normalize(round.answer);
  },
};
