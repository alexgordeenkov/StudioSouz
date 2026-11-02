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
 * @typedef {'lobby' | 'experiment' | 'round' | 'reveal' | 'results' | 'winner'} Phase
 */

/**
 * @template [T=any]
 * @typedef {Object} Experiment
 * @property {string} id
 * @property {string} name
 * @property {string} rules
 * @property {T[]} rounds
 * @property {(round: T, value: string) => boolean} isCorrect
 * @property {string} [kind]
 */

/**
 * @typedef {Object} EpisodePack
 * @property {string} id
 * @property {number} season
 * @property {number} number
 * @property {string} [title]
 * @property {Record<string, any[]>} rounds
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
  const { answer, accept, hint, ...rest } = round;
  return rest;
}

/**
 * Машина состояний партии: участники, режим, эксперимент, раунды и счёт.
 * Не знает про транспорт.
 */
export class Party {
  /**
   * @param {{
   *   code: string,
   *   experiments?: Record<string, Experiment<any>>,
   *   mediaResolver?: any,
   *   episodes?: EpisodePack[],
   * }} opts
   */
  constructor({ code, experiments = {}, mediaResolver = null, episodes = [] }) {
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
    /** @type {EpisodePack[]} */
    this.episodes = episodes;
    /** @type {EpisodePack | null} */
    this.episode = episodes[0] ?? null;
    /** @type {string | null} */
    this.pendingDrawerId = null;
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
    /** @type {boolean} */
    this.hintRevealed = false;
    /** @type {any} */
    this.mediaResolver = mediaResolver;
    /** @type {any} */
    this.media = null;
    /** @type {string | null} */
    this.drawerId = null;
    /** @type {any[]} */
    this.drawing = [];
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
   * @param {string} id
   */
  markDisconnected(id) {
    const p = this.participants.get(id);
    if (p) p.connected = false;
  }

  /**
   * @param {string} id
   */
  markConnected(id) {
    const p = this.participants.get(id);
    if (p) p.connected = true;
  }

  /**
   * Ручное начисление баллов ведущим. Счёт не опускается ниже нуля.
   * @param {string} participantId
   * @param {number} delta
   */
  adjustScore(participantId, delta) {
    if (this.phase !== 'reveal') throw new Error('Баллы вручную — только на итогах раунда');
    const p = this.participants.get(String(participantId));
    if (!p) throw new Error('Участник не найден');
    const d = Number(delta);
    if (d !== 1 && d !== -1) throw new Error('Можно только +1 или −1');
    p.score = Math.max(0, p.score + d);
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
   * Переключает выпуск. Доступно только в лобби и сбрасывает текущую игру.
   * @param {string} id
   */
  setEpisode(id) {
    if (this.phase !== 'lobby') throw new Error('Выпуск меняется только в лобби');
    const pack = this.episodes.find((e) => e.id === id);
    if (!pack) throw new Error('Выпуск не найден');
    this.episode = pack;
    this.experiment = null;
    this.roundIndex = -1;
    this.answers.clear();
    this.reveal = null;
    this.pendingDrawerId = null;
  }

  /**
   * Игры, для которых в выбранном выпуске есть раунды.
   * @returns {Array<{ id: string, name: string, rules: string, kind: string, rounds: number }>}
   */
  availableExperiments() {
    /** @type {Array<{ id: string, name: string, rules: string, kind: string, rounds: number }>} */
    const list = [];
    for (const exp of Object.values(this.experiments)) {
      const rounds = this.episode ? this.episode.rounds[exp.id] : exp.rounds;
      if (!rounds || rounds.length === 0) continue;
      list.push({
        id: exp.id,
        name: exp.name,
        rules: exp.rules,
        kind: exp.kind ?? 'quiz',
        rounds: rounds.length,
      });
    }
    return list;
  }

  /**
   * @param {string} experimentId
   */
  selectExperiment(experimentId) {
    const base = this.experiments[experimentId];
    if (!base) throw new Error('Эксперимент не найден');
    const rounds = this.episode ? this.episode.rounds[experimentId] : base.rounds;
    if (!rounds || rounds.length === 0) throw new Error('В этом выпуске нет такой игры');
    this.experiment = rounds === base.rounds ? base : { ...base, rounds };
    this.phase = 'experiment';
    this.roundIndex = -1;
    this.answers.clear();
    this.reveal = null;
    this.hintRevealed = false;
    this.pendingDrawerId = null;
  }

  /**
   * Выбор рисующего ведущим перед раундом.
   * @param {string | null} participantId
   */
  setPendingDrawer(participantId) {
    if (this.phase !== 'experiment' || !this.experiment) throw new Error('Сейчас нельзя выбрать рисующего');
    if (this.experiment.kind !== 'drawing') throw new Error('В этой игре никто не рисует');
    if (participantId == null) {
      this.pendingDrawerId = null;
      return;
    }
    const id = String(participantId);
    if (!this.participants.has(id)) throw new Error('Участник не найден');
    this.pendingDrawerId = id;
  }

  startRound() {
    if (!this.experiment) throw new Error('Сначала выберите эксперимент');
    if (this.roundIndex + 1 >= this.experiment.rounds.length) throw new Error('Раунды закончились');
    this.roundIndex++;
    this.answers.clear();
    this.reveal = null;
    this.hintRevealed = false;
    this.media = null;
    this.phase = 'round';
    this.drawerId = null;
    this.drawing = [];
    if (this.experiment.kind === 'drawing') {
      const ids = [...this.participants.keys()];
      if (this.pendingDrawerId && this.participants.has(this.pendingDrawerId)) {
        this.drawerId = this.pendingDrawerId;
      } else if (ids.length) {
        this.drawerId = ids[this.roundIndex % ids.length];
      }
      this.pendingDrawerId = null;
    }
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

  revealHint() {
    if (this.phase !== 'round' || !this.experiment) throw new Error('Сейчас не раунд');
    const round = this.experiment.rounds[this.roundIndex];
    if (!round || !round.hint) throw new Error('У этого раунда нет подсказки');
    this.hintRevealed = true;
  }

  revealRound() {
    if (this.phase !== 'round' || !this.experiment) throw new Error('Сейчас не раунд');
    const round = this.experiment.rounds[this.roundIndex];
    /** @type {RoundResult[]} */
    const results = [];
    /** @type {{ id: string, at: number } | null} */
    let firstCorrect = null;

    for (const p of this.participants.values()) {
      if (p.id === this.drawerId) continue;
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
    // В рисовании возвращаемся на экран подготовки, чтобы ведущий выбрал рисующего.
    if (this.experiment.kind === 'drawing') {
      this.phase = 'experiment';
      this.answers.clear();
      this.reveal = null;
      this.pendingDrawerId = null;
      return { finished: false };
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
    this.hintRevealed = false;
    this.media = null;
  }

  finishParty() {
    this.phase = 'winner';
  }

  /**
   * @param {{ title?: string, youtubeId?: string, localFile?: string }} request
   */
  async playMedia(request) {
    if (!this.mediaResolver) throw new Error('Медиа недоступно');
    const media = await this.mediaResolver.resolve(request);
    this.media = { ...media, playing: true };
    return this.media;
  }

  pauseMedia() {
    if (this.media) this.media = { ...this.media, playing: false };
  }

  resumeMedia() {
    if (this.media) this.media = { ...this.media, playing: true };
  }

  skipMedia() {
    this.media = null;
  }

  restartMedia() {
    if (!this.media) return;
    this.media = {
      ...this.media,
      playing: true,
      restartToken: (this.media.restartToken ?? 0) + 1,
    };
  }

  /** @param {any} stroke */
  draw(stroke) {
    if (!this.drawerId) throw new Error('Сейчас никто не рисует');
    this.drawing.push(stroke);
  }

  clearDrawing() {
    this.drawing = [];
  }

  undoDrawing() {
    this.drawing.pop();
  }

  async autoPlayRoundMedia() {
    const round = this.experiment ? this.experiment.rounds[this.roundIndex] : null;
    if (!round) return;
    const r = /** @type {any} */ (round);
    const ref = r.media ?? (r.mediaTitle ? { title: r.mediaTitle, muted: r.muted } : null);
    if (!ref || !this.mediaResolver) return;
    const media = await this.mediaResolver.resolve(ref);
    this.media = {
      ...media,
      title: ref.label ?? media.title,
      playing: true,
      muted: !!(r.muted ?? ref.muted),
    };
  }

  /**
   * @param {{ forHost?: boolean }} [opts]
   */
  getState({ forHost = false } = {}) {
    const exp = this.experiment;
    /** @type {{ index: number, total: number, data: any } | null} */
    let round = null;
    if (this.phase === 'round' && exp) {
      const raw = exp.rounds[this.roundIndex];
      const data = publicRound(raw);
      if (forHost) {
        data.answer = raw.answer;
        data.hint = raw.hint;
      } else if (this.hintRevealed && raw.hint) {
        data.hint = raw.hint;
      }
      round = { index: this.roundIndex, total: exp.rounds.length, data };
    }
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
            kind: exp.kind ?? 'quiz',
            roundIndex: this.roundIndex,
            totalRounds: exp.rounds.length,
          }
        : null,
      round,
      reveal: this.reveal,
      hintRevealed: this.hintRevealed,
      answersCount: this.answers.size,
      speedBonus: this.speedBonus,
      media: this.media,
      drawerId: this.drawerId,
      pendingDrawerId: this.pendingDrawerId,
      drawing: this.drawing,
      episode: this.episode
        ? {
            id: this.episode.id,
            season: this.episode.season,
            number: this.episode.number,
            title: this.episode.title ?? `Сезон ${this.episode.season} · Выпуск ${this.episode.number}`,
          }
        : null,
      episodes: this.episodes.map((e) => ({
        id: e.id,
        season: e.season,
        number: e.number,
        title: e.title ?? `Сезон ${e.season} · Выпуск ${e.number}`,
      })),
      availableExperiments: this.availableExperiments(),
      winner:
        this.phase === 'winner'
          ? (() => {
              const sorted = [...this.participants.values()].sort((a, b) => b.score - a.score);
              return sorted[0] ? { id: sorted[0].id, name: sorted[0].name, score: sorted[0].score } : null;
            })()
          : null,
    };
  }
}
