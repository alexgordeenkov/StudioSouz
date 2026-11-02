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
 * Контент — реальные раунды первого эксперимента 1-го выпуска «Студии Союз»
 * («фото исполнителя + предмет»). Кадры вырезаны из видео.
 * @type {import('../party.js').Experiment<WhatIsItRound>}
 */
export const whatIsIt = {
  id: 'what-is-it',
  name: 'Что ты такое?',
  rules:
    'На экране — фотография известного исполнителя, соединённая с предметом. ' +
    'Назовите получившееся слово. Быстрее всех давший верный ответ получает бонус.',
  /** @type {WhatIsItRound[]} */
  rounds: [
    { image: '/media/what-is-it/01.jpg', answer: 'Шнуровень', accept: ['шнуровень'] },
    { image: '/media/what-is-it/02.jpg', answer: 'Гребенщикот', accept: ['гребенщикот'] },
    { image: '/media/what-is-it/03.jpg', answer: 'Яйцой', accept: ['яйцой'] },
    {
      image: '/media/what-is-it/04.jpg',
      answer: 'Мохаммед Алибасов',
      accept: ['мохаммед алибасов', 'алибасов мохаммед'],
    },
    { image: '/media/what-is-it/05.jpg', answer: 'Тарзадница', accept: ['тарзадница', 'тарзанус'] },
    {
      image: '/media/what-is-it/06.jpg',
      answer: 'Акробатрудинов',
      accept: ['акробатрудинов', 'акробатор'],
    },
    { image: '/media/what-is-it/07.jpg', answer: 'Харлама', accept: ['харлама'] },
    // 2-й выпуск
    { image: '/media/what-is-it/09.jpg', answer: 'Лабутенко', accept: ['лабутенко', 'лагутенко'] },
    { image: '/media/what-is-it/10.jpg', answer: 'Моржуков', accept: ['моржуков'] },
    { image: '/media/what-is-it/11.jpg', answer: 'Наталифчик', accept: ['наталифчик'] },
    { image: '/media/what-is-it/12.jpg', answer: 'Шатунож', accept: ['шатунож'] },
    { image: '/media/what-is-it/13.jpg', answer: 'Павлиношвили', accept: ['павлиношвили', 'павлиашвили'] },
    { image: '/media/what-is-it/19.jpg', answer: 'Лолитр', accept: ['лолитр'] },
    { image: '/media/what-is-it/20.jpg', answer: 'Хамелеонтьев', accept: ['хамелеонтьев'] },
    { image: '/media/what-is-it/14.jpg', answer: 'Курагутин', accept: ['курагутин'] },
    { image: '/media/what-is-it/16.jpg', answer: 'Дмбузова', accept: ['дмбузова', 'дембузова'] },
    { image: '/media/what-is-it/17.jpg', answer: 'Бородиназавр', accept: ['бородиназавр', 'бародиназавр'] },
  ],
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
