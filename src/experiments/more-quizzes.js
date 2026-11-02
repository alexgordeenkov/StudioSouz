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
  rules: 'Клип обрывается. Угадайте без звука, какая песня в нём звучит.',
  /** @type {QuizRound[]} */
  rounds: [],
  /**
   * @param {QuizRound} round
   * @param {string} value
   * @returns {boolean}
   */
  isCorrect(round, value) {
    return normalize(value) === normalize(round.answer);
  },
};
