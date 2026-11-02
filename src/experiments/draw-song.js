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
 * @typedef {Object} DrawSongRound
 * @property {string} answer
 * @property {string[]} accept
 */

/** @type {import('../party.js').Experiment<DrawSongRound>} */
export const drawSong = {
  id: 'draw-song',
  name: 'Нарисуй песню',
  kind: 'drawing',
  rules:
    'Один участник рисует песню на пульте, остальные угадывают её название. ' +
    'Ведущий раскрывает ответ и засчитывает балл угадавшему.',
  /** @type {DrawSongRound[]} */
  rounds: [
    { answer: 'Мокрые кроссы', accept: ['мокрые кроссы'] },
    { answer: 'Кукла', accept: ['кукла', 'кукла иванушки'] },
  ],
  /**
   * @param {DrawSongRound} round
   * @param {string} value
   * @returns {boolean}
   */
  isCorrect(round, value) {
    const n = normalize(value);
    if (!n) return false;
    return round.accept.some((a) => normalize(a) === n);
  },
};
