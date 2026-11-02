import { Party } from './party.js';

/**
 * @typedef {'screen' | 'host' | 'controller'} Role
 * @typedef {Object} Conn
 * @property {Role} role
 * @property {string | null} participantId
 */

/**
 * @typedef {Object} Effect
 * @property {'direct' | 'broadcast'} kind
 * @property {any} target
 * @property {Record<string, any>} payload
 */

/**
 * Обрабатывает одно протокольное сообщение и возвращает эффекты для транспорта.
 * Чистая функция по отношению к сокетам: ничего не отправляет сама.
 *
 * @param {Party} party
 * @param {Conn} conn
 * @param {Record<string, any>} message
 * @param {Conn[]} [conns]
 * @returns {Promise<Effect[]>}
 */
export async function handleMessage(party, conn, message, conns = []) {
  /** @type {Effect[]} */
  const effects = [];
  const direct = (/** @type {Record<string, any>} */ payload) =>
    effects.push({ kind: 'direct', target: conn, payload });
  const broadcast = (/** @type {Record<string, any>} */ payload) =>
    effects.push({ kind: 'broadcast', target: null, payload });
  const state = () => broadcast({ type: 'state', ...party.getState() });

  const requireHost = () => {
    if (conn.role !== 'host') {
      direct({ type: 'error', message: 'Это действие доступно только ведущему' });
      return false;
    }
    return true;
  };

  const type = message && message.type;

  switch (type) {
    case 'join': {
      if (conn.role !== 'controller') {
        direct({ type: 'error', message: 'Входить может только пульт' });
        break;
      }
      if (conn.participantId) {
        direct({ type: 'error', message: 'Вы уже в партии' });
        break;
      }
      const code = String(message.code ?? '').toUpperCase().trim();
      if (code !== party.code) {
        direct({ type: 'error', message: 'Неверный код' });
        break;
      }
      try {
        const p = party.addParticipant(message.name);
        conn.participantId = p.id;
        direct({ type: 'joined', participantId: p.id, name: p.name });
        state();
      } catch (e) {
        direct({ type: 'error', message: /** @type {Error} */ (e).message });
      }
      break;
    }

    case 'leave': {
      if (conn.participantId) {
        party.removeParticipant(conn.participantId);
        conn.participantId = null;
        state();
      }
      break;
    }

    case 'kick': {
      if (!requireHost()) break;
      const id = String(message.participantId ?? '');
      if (!party.getParticipant(id)) {
        direct({ type: 'error', message: 'Участник не найден' });
        break;
      }
      party.removeParticipant(id);
      for (const c of conns) {
        if (c.participantId === id) {
          c.participantId = null;
          effects.push({ kind: 'direct', target: c, payload: { type: 'kicked' } });
        }
      }
      state();
      break;
    }

    case 'set-mode': {
      if (!requireHost()) break;
      try {
        party.setMode(message.mode);
        state();
      } catch (e) {
        direct({ type: 'error', message: /** @type {Error} */ (e).message });
      }
      break;
    }

    case 'set-speed-bonus': {
      if (!requireHost()) break;
      party.setSpeedBonus(!!message.enabled);
      state();
      break;
    }

    case 'media-play': {
      if (!requireHost()) break;
      try {
        await party.playMedia({
          title: message.title,
          youtubeId: message.youtubeId,
          localFile: message.localFile,
        });
        state();
      } catch (e) {
        direct({ type: 'error', message: /** @type {Error} */ (e).message });
      }
      break;
    }

    case 'media-control': {
      if (!requireHost()) break;
      const action = message.action;
      if (action === 'pause') party.pauseMedia();
      else if (action === 'play') party.resumeMedia();
      else if (action === 'skip') party.skipMedia();
      state();
      break;
    }

    case 'draw': {
      if (conn.role !== 'controller' || conn.participantId !== party.drawerId) {
        direct({ type: 'error', message: 'Рисует только выбранный участник' });
        break;
      }
      if (message.stroke) {
        party.draw(message.stroke);
        broadcast({ type: 'draw', stroke: message.stroke });
      }
      break;
    }

    case 'clear-canvas': {
      const allowed = conn.role === 'host' || conn.participantId === party.drawerId;
      if (!allowed) break;
      party.clearDrawing();
      broadcast({ type: 'canvas', strokes: [] });
      break;
    }

    case 'undo-draw': {
      if (conn.participantId !== party.drawerId) break;
      party.undoDrawing();
      broadcast({ type: 'canvas', strokes: party.drawing });
      break;
    }

    case 'start-experiment': {
      if (!requireHost()) break;
      try {
        party.selectExperiment(String(message.experimentId ?? ''));
        state();
      } catch (e) {
        direct({ type: 'error', message: /** @type {Error} */ (e).message });
      }
      break;
    }

    case 'start-round': {
      if (!requireHost()) break;
      try {
        party.startRound();
        await party.autoPlayRoundMedia();
        state();
      } catch (e) {
        direct({ type: 'error', message: /** @type {Error} */ (e).message });
      }
      break;
    }

    case 'reveal': {
      if (!requireHost()) break;
      try {
        party.revealRound();
        state();
      } catch (e) {
        direct({ type: 'error', message: /** @type {Error} */ (e).message });
      }
      break;
    }

    case 'next-round': {
      if (!requireHost()) break;
      try {
        party.nextRound();
        state();
      } catch (e) {
        direct({ type: 'error', message: /** @type {Error} */ (e).message });
      }
      break;
    }

    case 'back-to-lobby': {
      if (!requireHost()) break;
      party.backToLobby();
      state();
      break;
    }

    case 'submit-answer': {
      if (conn.role !== 'controller' || !conn.participantId) {
        direct({ type: 'error', message: 'Отвечать может только участник' });
        break;
      }
      try {
        party.submitAnswer(conn.participantId, message.value);
        direct({ type: 'answer-accepted' });
        state();
      } catch (e) {
        direct({ type: 'error', message: /** @type {Error} */ (e).message });
      }
      break;
    }

    default:
      direct({ type: 'error', message: 'Неизвестное сообщение' });
  }

  return effects;
}
