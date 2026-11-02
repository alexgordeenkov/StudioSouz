// Общие помощники для всех экранов.
export const el = (id) => document.getElementById(id);

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

export const wsUrl = (role) =>
  (location.protocol === 'https:' ? 'wss' : 'ws') + '://' + location.host + '/ws?role=' + role;

/**
 * Подключается к серверу и раздаёт сообщения по обработчикам.
 * @param {string} role
 * @param {Record<string, (msg: any, ws: WebSocket) => void>} handlers
 */
export function connect(role, handlers) {
  const ws = new WebSocket(wsUrl(role));
  ws.onmessage = (event) => {
    let msg;
    try {
      msg = JSON.parse(event.data);
    } catch {
      return;
    }
    const handler = handlers[msg.type];
    if (handler) handler(msg, ws);
  };
  return ws;
}

/**
 * Отправляет сообщение, дождавшись открытия сокета, если нужно.
 * @param {WebSocket} ws
 * @param {Record<string, any>} payload
 */
export function send(ws, payload) {
  const doSend = () => ws.send(JSON.stringify(payload));
  if (ws.readyState === WebSocket.OPEN) doSend();
  else ws.addEventListener('open', doSend, { once: true });
}

/**
 * Загружает конфиг входа (код и ссылку).
 * @returns {Promise<{ code: string, joinUrl: string }>}
 */
export async function loadConfig() {
  const res = await fetch('/api/config');
  return res.json();
}
