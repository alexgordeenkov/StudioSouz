import { whatIsIt } from './what-is-it.js';
import { drawSong } from './draw-song.js';
import { nobodySings } from './nobody-sings.js';

/** @type {Record<string, import('../party.js').Experiment<any>>} */
export const experiments = {
  [whatIsIt.id]: whatIsIt,
  [drawSong.id]: drawSong,
  [nobodySings.id]: nobodySings,
};

export const experimentList = Object.values(experiments);
