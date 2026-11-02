import { whatIsIt } from './what-is-it.js';
import { drawSong } from './draw-song.js';
import { nobodySings } from './nobody-sings.js';
import { clipobol, karaokeQuiz, shlyager, cosplay } from './more-quizzes.js';

/** @type {Record<string, import('../party.js').Experiment<any>>} */
export const experiments = {
  [whatIsIt.id]: whatIsIt,
  [drawSong.id]: drawSong,
  [nobodySings.id]: nobodySings,
  [clipobol.id]: clipobol,
  [karaokeQuiz.id]: karaokeQuiz,
  [shlyager.id]: shlyager,
  [cosplay.id]: cosplay,
};

export const experimentList = Object.values(experiments);
