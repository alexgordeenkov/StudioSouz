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

/** @type {import('../party.js').Experiment<any>} */
export const rapVsPolitics = {
  id: 'rap-vs-politics',
  name: 'Рэп против политики',
  kind: 'quiz',
  rules: 'Цитата принадлежит рэперу или политику? Выберите вариант на пульте.',
  rounds: [],
  isCorrect(round, value) {
    return normalize(value) === normalize(round.answer);
  },
};

/** @type {import('../party.js').Experiment<any>} */
export const songAboutSong = {
  id: 'song-about-song',
  name: 'Песня о песне',
  kind: 'quiz',
  rules: 'Звучит песня о хите. Угадайте оригинальный хит и введите его название.',
  rounds: [],
  isCorrect(round, value) {
    return normalize(value) === normalize(round.answer);
  },
};

/** @type {import('../party.js').Experiment<any>} */
export const degradeMelody = {
  id: 'degrade-melody',
  name: 'Унижай мелодию',
  kind: 'quiz',
  rules: 'Мелодия записана необычным звуком. Угадайте её и введите название.',
  rounds: [],
  isCorrect(round, value) {
    return normalize(value) === normalize(round.answer);
  },
};

/** @type {import('../party.js').Experiment<any>} */
export const retranslation = {
  id: 'retranslation',
  name: 'Переперевод',
  kind: 'quiz',
  rules: 'Песня переведена туда-обратно через другой язык. Угадайте оригинал.',
  rounds: [],
  isCorrect(round, value) {
    return normalize(value) === normalize(round.answer);
  },
};

/** @type {import('../party.js').Experiment<any>} */
export const whoDidThis = {
  id: 'who-did-this',
  name: 'Кто это наделал?',
  kind: 'quiz',
  rules: 'Клип без звука. Выберите песню, под которую он снят.',
  rounds: [],
  isCorrect(round, value) {
    return normalize(value) === normalize(round.answer);
  },
};
