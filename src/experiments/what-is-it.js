/**
 * Нормализует ответ для сравнения: регистр, ё→е, без пробелов и пунктуации.
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
 * @typedef {Object} WhatIsItRound
 * @property {string} image — кадр-коллаж из шоу
 * @property {string} answer — канонический ответ
 * @property {string[]} accept — допустимые варианты ответа
 */

/**
 * Формат «Что ты такое?». Раунды приходят из пакетов выпусков
 * (`src/content/what-is-it-rounds.js`).
 * @type {import('../party.js').Experiment<WhatIsItRound>}
 */
export const whatIsIt = {
  id: 'what-is-it',
  name: 'Что ты такое?',
  rules:
    'На экране — фотография известного исполнителя, соединённая с предметом. ' +
    'Назовите получившееся слово. Быстрее всех давший верный ответ получает бонус.',
  /** @type {WhatIsItRound[]} */
  rounds: [],
  /**
   * @param {WhatIsItRound} round
   * @param {string} value
   * @returns {boolean}
   */
  isCorrect(round, value) {
    const n = normalize(value);
    if (!n) return false;
    return round.accept.some((a) => normalize(a) === n);
  },
};
