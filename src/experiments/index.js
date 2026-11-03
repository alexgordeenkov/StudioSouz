import { whatIsIt } from './what-is-it.js';
import { drawSong } from './draw-song.js';
import { songAboutSong, degradeMelody, retranslation, rhymeBall } from './show-games.js';
import { lyricQuiz, artistQuiz } from './family-games.js';

/** @type {Record<string, import('../party.js').Experiment<any>>} */
export const experiments = {
  [whatIsIt.id]: whatIsIt,
  [drawSong.id]: drawSong,
  [songAboutSong.id]: songAboutSong,
  [degradeMelody.id]: degradeMelody,
  [retranslation.id]: retranslation,
  [rhymeBall.id]: rhymeBall,
  [lyricQuiz.id]: lyricQuiz,
  [artistQuiz.id]: artistQuiz,
};

export const experimentList = Object.values(experiments);
