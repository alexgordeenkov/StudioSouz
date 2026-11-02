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
 * @typedef {'lobby' | 'experiment' | 'round' | 'reveal' | 'results'} Phase
 */

/**
 * @template [T=any]
 * @typedef {Object} Experiment
 * @property {string} id
 * @property {string} name
 * @property {string} rules
 * @property {T[]} rounds
 * @property {(round: T, value: string) => boolean} isCorrect
 */

/**
 * @typedef {Object} RoundResult
 * @property {string} participantId
 * @property {string} name
 * @property {string} value
 * @property {boolean} correct
 * @property {number} points
 */

/**
 * Убирает из раунда служебные поля, которые нельзя видеть до раскрытия.
 * @param {any} round
 * @returns {any}
 */
function publicRound(round) {
  const { answer, accept, ...rest } = round;
  return rest;
}

/**
 * Машина состояний партии: участники, режим, эксперимент, раунды и счёт.
 * Не знает про транспорт.
 */
export class Party {
  /**
   * @param {{ code: string, experiments?: Record<string, Experiment<any>> }} opts
   */
  constructor({ code, experiments = {} }) {
    /** @type {string} */
    this.code = code;
    /** @type {Mode} */
    this.mode = 'solo';
    /** @type {Map<string, Participant>} */
    this.participants = new Map();
    /** @type {number} */
    this._nextId = 1;
    /** @type {Record<string, Experiment<any>>} */
    this.experiments = experiments;
    /** @type {boolean} */
    this.speedBonus = true;
    /** @type {Phase} */
    this.phase = 'lobby';
    /** @type {Experiment<any> | null} */
    this.experiment = null;
    /** @type {number} */
    this.roundIndex = -1;
    /** @type {Map<string, { value: string, at: number }>} */
    this.answers = new Map();
    /** @type {{ answer: string, results: RoundResult[], firstCorrectId: string | null } | null} */
    this.reveal = null;
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
    this.answers.delete(id);
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
   * @param {boolean} enabled
   */
  setSpeedBonus(enabled) {
    this.speedBonus = !!enabled;
  }

  /**
   * @param {string} id
   * @returns {Participant | undefined}
   */
  getParticipant(id) {
    return this.participants.get(id);
  }

  /**
   * @param {string} experimentId
   */
  selectExperiment(experimentId) {
    const exp = this.experiments[experimentId];
    if (!exp) throw new Error('Эксперимент не найден');
    this.experiment = exp;
    this.phase = 'experiment';
    this.roundIndex = -1;
    this.answers.clear();
    this.reveal = null;
  }

  startRound() {
    if (!this.experiment) throw new Error('Сначала выберите эксперимент');
    if (this.roundIndex + 1 >= this.experiment.rounds.length) throw new Error('Раунды закончились');
    this.roundIndex++;
    this.answers.clear();
    this.reveal = null;
    this.phase = 'round';
  }

  /**
   * @param {string} participantId
   * @param {string} value
   * @param {number} [at]
   */
  submitAnswer(participantId, value, at = Date.now()) {
    if (this.phase !== 'round') throw new Error('Сейчас нельзя отвечать');
    if (!this.participants.has(participantId)) throw new Error('Участник не найден');
    if (this.answers.has(participantId)) throw new Error('Ответ уже принят');
    const text = String(value ?? '').trim();
    if (!text) throw new Error('Пустой ответ');
    if (text.length > 60) throw new Error('Слишком длинный ответ');
    this.answers.set(participantId, { value: text, at });
  }

  revealRound() {
    if (this.phase !== 'round' || !this.experiment) throw new Error('Сейчас не раунд');
    const round = this.experiment.rounds[this.roundIndex];
    /** @type {RoundResult[]} */
    const results = [];
    /** @type {{ id: string, at: number } | null} */
    let firstCorrect = null;

    for (const p of this.participants.values()) {
      const a = this.answers.get(p.id);
      const correct = a ? this.experiment.isCorrect(round, a.value) : false;
      results.push({
        participantId: p.id,
        name: p.name,
        value: a ? a.value : '',
        correct,
        points: 0,
      });
      if (correct && a && (!firstCorrect || a.at < firstCorrect.at)) {
        firstCorrect = { id: p.id, at: a.at };
      }
    }

    for (const r of results) {
      if (r.correct) r.points = 1;
      if (this.speedBonus && firstCorrect && r.participantId === firstCorrect.id) r.points += 1;
      const p = this.participants.get(r.participantId);
      if (p) p.score += r.points;
    }

    this.reveal = {
      answer: String(/** @type {any} */ (round).answer ?? ''),
      results,
      firstCorrectId: firstCorrect ? firstCorrect.id : null,
    };
    this.phase = 'reveal';
    return this.reveal;
  }

  /**
   * @returns {{ finished: boolean }}
   */
  nextRound() {
    if (!this.experiment) throw new Error('Нет эксперимента');
    if (this.roundIndex + 1 >= this.experiment.rounds.length) {
      this.phase = 'results';
      return { finished: true };
    }
    this.startRound();
    return { finished: false };
  }

  backToLobby() {
    this.phase = 'lobby';
    this.experiment = null;
    this.roundIndex = -1;
    this.answers.clear();
    this.reveal = null;
  }

  getState() {
    const exp = this.experiment;
    const round =
      this.phase === 'round' && exp
        ? { index: this.roundIndex, total: exp.rounds.length, data: publicRound(exp.rounds[this.roundIndex]) }
        : null;
    return {
      code: this.code,
      mode: this.mode,
      phase: this.phase,
      participants: [...this.participants.values()].map((p) => ({ ...p })),
      experiment: exp
        ? {
            id: exp.id,
            name: exp.name,
            rules: exp.rules,
            roundIndex: this.roundIndex,
            totalRounds: exp.rounds.length,
          }
        : null,
      round,
      reveal: this.reveal,
      answersCount: this.answers.size,
      speedBonus: this.speedBonus,
    };
  }
}
