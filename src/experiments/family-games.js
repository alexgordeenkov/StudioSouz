/**
 * Форматы «Семейного выпуска»: простые квизы с вариантами на пульте.
 * @param {string} value
 */
function normalize(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9]/g, '');
}

/**
 * @param {any} round
 * @param {string} value
 * @returns {boolean}
 */
function isCorrect(round, value) {
  const n = normalize(value);
  if (!n) return false;
  const accept = Array.isArray(round.accept) && round.accept.length ? round.accept : [round.answer];
  return accept.some((answer) => normalize(answer) === n);
}

/**
 * @typedef {Object} FamilyQuizRound
 * @property {string} prompt
 * @property {string} text
 * @property {string[]} options
 * @property {string} answer
 * @property {string[]} [accept]
 * @property {string} hint
 */

/** @type {import('../party.js').Experiment<FamilyQuizRound>} */
export const lyricQuiz = {
  id: 'lyric-quiz',
  name: 'Угадай песню по строке',
  kind: 'quiz',
  rules: 'На экране строка из песни. Выберите название на пульте.',
  rounds: [],
  isCorrect,
};

/** @type {import('../party.js').Experiment<FamilyQuizRound>} */
export const artistQuiz = {
  id: 'artist-quiz',
  name: 'Кто исполнил?',
  kind: 'quiz',
  rules: 'На экране название песни. Выберите исполнителя на пульте.',
  rounds: [],
  isCorrect,
};
