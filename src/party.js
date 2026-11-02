/**
 * @typedef {Object} Participant
 * @property {string} id
 * @property {string} name
 * @property {number} score
 * @property {boolean} connected
 */

/**
 * @typedef {'solo' | 'teams'} Mode
 */

/**
 * @typedef {Object} PartyState
 * @property {string} code
 * @property {Mode} mode
 * @property {Participant[]} participants
 */

/**
 * Машина состояний партии: участники и режим. Не знает про транспорт.
 */
export class Party {
  /**
   * @param {{ code: string }} opts
   */
  constructor({ code }) {
    /** @type {string} */
    this.code = code;
    /** @type {Mode} */
    this.mode = 'solo';
    /** @type {Map<string, Participant>} */
    this.participants = new Map();
    /** @type {number} */
    this._nextId = 1;
  }

  /**
   * @param {string} rawName
   * @returns {Participant}
   */
  addParticipant(rawName) {
    const name = String(rawName ?? '').trim();
    if (!name) throw new Error('Имя обязательно');
    if (name.length > 24) throw new Error('Имя слишком длинное');
    const id = String(this._nextId++);
    const participant = { id, name, score: 0, connected: true };
    this.participants.set(id, participant);
    return participant;
  }

  /**
   * @param {string} id
   * @returns {boolean}
   */
  removeParticipant(id) {
    return this.participants.delete(id);
  }

  /**
   * @param {Mode} mode
   */
  setMode(mode) {
    if (mode !== 'solo' && mode !== 'teams') throw new Error('Неизвестный режим');
    this.mode = mode;
  }

  /**
   * @param {string} id
   * @returns {Participant | undefined}
   */
  getParticipant(id) {
    return this.participants.get(id);
  }

  /**
   * @returns {PartyState}
   */
  getState() {
    return {
      code: this.code,
      mode: this.mode,
      participants: [...this.participants.values()].map((p) => ({ ...p })),
    };
  }
}
