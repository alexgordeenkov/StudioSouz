/**
 * Форматы недостающих игр шоу. Раунды приходят из пакетов выпусков.
 * @param {string} value
 */
function normalize(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9]/g, '');
}

/**
 * Общая проверка ответа: канонический `answer` плюс необязательные `accept`.
 * @param {any} round
 * @param {string} value
 * @returns {boolean}
 */
function isCorrect(round, value) {
  const n = normalize(value);
  if (!n) return false;
  const accept = Array.isArray(round.accept) && round.accept.length ? round.accept : [round.answer];
  return accept.some((a) => normalize(a) === n);
}

/**
 * @typedef {Object} ShowGameRound
 * @property {string} [text] многострочный искажённый текст
 * @property {string} [prompt]
 * @property {string} [mediaTitle]
 * @property {string[]} [options]
 * @property {string} answer
 * @property {string[]} [accept]
 */

/**
 * «Песня о песне» и «Перепесня» — один и тот же механик (переосмысленная
 * песня → угадать оригинал), поэтому общий формат.
 * @type {import('../party.js').Experiment<ShowGameRound>}
 */
export const songAboutSong = {
  id: 'song-about-song',
  name: 'Песня о песне',
  kind: 'quiz',
  rules:
    '«Песня о песне» и «Перепесня» — один механик: пародия или «как бы её спел другой исполнитель». ' +
    'Угадайте оригинал и введите его название.',
  rounds: [],
  isCorrect,
};

/** @type {import('../party.js').Experiment<ShowGameRound>} */
export const degradeMelody = {
  id: 'degrade-melody',
  name: 'Унижай мелодию',
  kind: 'quiz',
  rules: 'Звучит мелодия. Угадайте песню и введите её название.',
  rounds: [],
  isCorrect,
};

/** @type {import('../party.js').Experiment<ShowGameRound>} */
export const retranslation = {
  id: 'retranslation',
  name: 'Переперевод',
  kind: 'quiz',
  rules: 'Песня переведена туда-обратно через другой язык. Угадайте оригинал.',
  rounds: [],
  isCorrect,
};

/** @type {import('../party.js').Experiment<ShowGameRound>} */
export const rhymeBall = {
  id: 'rhyme-ball',
  name: 'Рифмобол',
  kind: 'quiz',
  rules: 'Звучит фрагмент песни без последней строки. Выберите, чем он заканчивается.',
  rounds: [],
  isCorrect,
};
