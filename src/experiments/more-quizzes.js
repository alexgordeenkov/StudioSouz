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

/** @type {import('../party.js').Experiment<QuizRound>} */
export const karaokeQuiz = {
  id: 'karaoke-quiz',
  name: 'Караоке квиз',
  kind: 'quiz',
  rules: 'Между строками песни звучат вопросы с двумя вариантами. Отвечайте на пульте.',
  /** @type {QuizRound[]} */
  rounds: [
    {
      mediaTitle: 'Мокрые кроссы Тима Белорусских караоке',
      prompt: 'Кто исполняет «Мокрые кроссы»?',
      options: ['Тима Белорусских', 'Мот'],
      answer: 'Тима Белорусских',
    },
    {
      mediaTitle: 'Кукла Иванушки International караоке',
      prompt: 'Кто исполняет «Кукла»?',
      options: ['Иванушки International', 'Руки Вверх'],
      answer: 'Иванушки International',
    },
    {
      mediaTitle: 'Владимирский централ Михаил Круг караоке',
      prompt: 'Кто исполняет «Владимирский централ»?',
      options: ['Михаил Круг', 'Григорий Лепс'],
      answer: 'Михаил Круг',
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

/** @type {import('../party.js').Experiment<QuizRound>} */
export const shlyager = {
  id: 'shlyager',
  name: 'Я роняю шлягер',
  kind: 'quiz',
  rules: 'Звучит искажённый фрагмент шлягера. Введите название оригинала на пульте.',
  /** @type {QuizRound[]} */
  rounds: [
    {
      mediaTitle: 'Мокрые кроссы Тима Белорусских',
      answer: 'Мокрые кроссы',
    },
    {
      mediaTitle: 'Кукла Иванушки International',
      answer: 'Кукла',
    },
    {
      mediaTitle: 'Владимирский централ Михаил Круг',
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

/** @type {import('../party.js').Experiment<QuizRound>} */
export const cosplay = {
  id: 'cosplay',
  name: 'Косплей',
  kind: 'quiz',
  rules: 'На экране клип. Угадайте, кто из исполнителей поёт.',
  /** @type {QuizRound[]} */
  rounds: [
    {
      mediaTitle: 'Комарово Игорь Скляр клип',
      options: ['Игорь Скляр', 'Виктор Цой', 'Михаил Круг', 'Тима Белорусских'],
      answer: 'Игорь Скляр',
    },
    {
      mediaTitle: 'Звезда по имени Солнце Кино клип',
      options: ['Виктор Цой', 'Игорь Скляр', 'Михаил Круг', 'Тима Белорусских'],
      answer: 'Виктор Цой',
    },
    {
      mediaTitle: 'Владимирский централ Михаил Круг клип',
      options: ['Михаил Круг', 'Виктор Цой', 'Игорь Скляр', 'Тима Белорусских'],
      answer: 'Михаил Круг',
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
