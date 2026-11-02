import { whatIsIt } from './what-is-it.js';

/** @type {Record<string, import('../party.js').Experiment<any>>} */
export const experiments = {
  [whatIsIt.id]: whatIsIt,
};

export const experimentList = Object.values(experiments);
