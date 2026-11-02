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
 * @returns {Effect[]}
 */
export function handleMessage(party, conn, message, conns = []) {
  /** @type {Effect[]} */
  const effects = [];
  const direct = (/** @type {Record<string, any>} */ payload) =>
    effects.push({ kind: 'direct', target: conn, payload });
  const broadcast = (/** @type {Record<string, any>} */ payload) =>
    effects.push({ kind: 'broadcast', target: null, payload });
  const lobby = () => broadcast({ type: 'lobby', ...party.getState() });

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
        lobby();
      } catch (e) {
        direct({ type: 'error', message: /** @type {Error} */ (e).message });
      }
      break;
    }

    case 'leave': {
      if (conn.participantId) {
        party.removeParticipant(conn.participantId);
        conn.participantId = null;
        lobby();
      }
      break;
    }

    case 'kick': {
      if (conn.role !== 'host') {
        direct({ type: 'error', message: 'Только ведущий может убрать участника' });
        break;
      }
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
      lobby();
      break;
    }

    case 'set-mode': {
      if (conn.role !== 'host') {
        direct({ type: 'error', message: 'Только ведущий меняет режим' });
        break;
      }
      try {
        party.setMode(message.mode);
        lobby();
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
