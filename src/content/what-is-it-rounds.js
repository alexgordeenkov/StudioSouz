/**
 * Коллажи «Что ты такое?» из 1-го и 2-го выпусков. Пакеты выпусков берут
 * отсюда свои раунды; сам эксперимент остаётся форматом без контента.
 * @type {import('../party.js').Experiment<any>['rounds']}
 */
export const whatIsItRounds = [
  { image: '/media/what-is-it/01.jpg', answer: 'Шнуровень', accept: ['шнуровень'], hint: 'Первая буква: «Ш»' },
  { image: '/media/what-is-it/02.jpg', answer: 'Гребенщикот', accept: ['гребенщикот'], hint: 'Первая буква: «Г»' },
  { image: '/media/what-is-it/03.jpg', answer: 'Яйцой', accept: ['яйцой'], hint: 'Первая буква: «Я»' },
  {
    image: '/media/what-is-it/04.jpg',
    answer: 'Мохаммед Алибасов',
    accept: ['мохаммед алибасов', 'алибасов мохаммед'],
    hint: 'Первая буква: «М»',
  },
  {
    image: '/media/what-is-it/05.jpg',
    answer: 'Тарзадница',
    accept: ['тарзадница', 'тарзанус'],
    hint: 'Первая буква: «Т»',
  },
  {
    image: '/media/what-is-it/06.jpg',
    answer: 'Акробатрудинов',
    accept: ['акробатрудинов', 'акробатор'],
    hint: 'Первая буква: «А»',
  },
  { image: '/media/what-is-it/07.jpg', answer: 'Харлама', accept: ['харлама'], hint: 'Первая буква: «Х»' },
  // 2-й выпуск
  {
    image: '/media/what-is-it/09.jpg',
    answer: 'Лабутенко',
    accept: ['лабутенко', 'лагутенко'],
    hint: 'Первая буква: «Л»',
  },
  { image: '/media/what-is-it/10.jpg', answer: 'Моржуков', accept: ['моржуков'], hint: 'Первая буква: «М»' },
  { image: '/media/what-is-it/11.jpg', answer: 'Наталифчик', accept: ['наталифчик'], hint: 'Первая буква: «Н»' },
  { image: '/media/what-is-it/12.jpg', answer: 'Шатунож', accept: ['шатунож'], hint: 'Первая буква: «Ш»' },
  {
    image: '/media/what-is-it/13.jpg',
    answer: 'Павлиношвили',
    accept: ['павлиношвили', 'павлиашвили'],
    hint: 'Первая буква: «П»',
  },
  { image: '/media/what-is-it/19.jpg', answer: 'Лолитр', accept: ['лолитр'], hint: 'Первая буква: «Л»' },
  { image: '/media/what-is-it/20.jpg', answer: 'Хамелеонтьев', accept: ['хамелеонтьев'], hint: 'Первая буква: «Х»' },
  { image: '/media/what-is-it/14.jpg', answer: 'Курагутин', accept: ['курагутин'], hint: 'Первая буква: «К»' },
  {
    image: '/media/what-is-it/16.jpg',
    answer: 'Дмбузова',
    accept: ['дмбузова', 'дембузова'],
    hint: 'Первая буква: «Д»',
  },
  {
    image: '/media/what-is-it/17.jpg',
    answer: 'Бородиназавр',
    accept: ['бородиназавр', 'бародиназавр'],
    hint: 'Первая буква: «Б»',
  },
];
