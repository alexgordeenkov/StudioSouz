import { whatIsIt } from './what-is-it.js';
import { drawSong } from './draw-song.js';
import { clipobol } from './more-quizzes.js';
import { rapVsPolitics, songAboutSong, degradeMelody, retranslation, whoDidThis } from './show-games.js';

/** @type {Record<string, import('../party.js').Experiment<any>>} */
export const experiments = {
  [whatIsIt.id]: whatIsIt,
  [drawSong.id]: drawSong,
  [clipobol.id]: clipobol,
  [rapVsPolitics.id]: rapVsPolitics,
  [songAboutSong.id]: songAboutSong,
  [degradeMelody.id]: degradeMelody,
  [retranslation.id]: retranslation,
  [whoDidThis.id]: whoDidThis,
};

export const experimentList = Object.values(experiments);
