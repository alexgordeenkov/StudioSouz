import { whatIsIt } from './what-is-it.js';
import { drawSong } from './draw-song.js';

/** @type {Record<string, import('../party.js').Experiment<any>>} */
export const experiments = {
  [whatIsIt.id]: whatIsIt,
  [drawSong.id]: drawSong,
};

export const experimentList = Object.values(experiments);
