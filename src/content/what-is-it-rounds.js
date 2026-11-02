/**
 * Коллажи «Что ты такое?» из 1-го и 2-го выпусков. Пакеты выпусков берут
 * отсюда свои раунды; сам эксперимент остаётся форматом без контента.
 * @type {import('../party.js').Experiment<any>['rounds']}
 */
export const whatIsItRounds = [
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
];
