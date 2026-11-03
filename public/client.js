// Общие помощники для всех экранов.
export const el = (id) => document.getElementById(id);

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

export const wsUrl = (role) =>
  (location.protocol === 'https:' ? 'wss' : 'ws') + '://' + location.host + '/ws?role=' + role;

/**
 * Подключается к серверу и раздаёт сообщения по обработчикам.
 * Переподключается сам; на время обрыва показывает баннер.
 * @param {string} role
 * @param {Record<string, (msg: any, ws: any) => void>} handlers
 */
export function connect(role, handlers) {
  /** @type {WebSocket | null} */
  let socket = null;
  let retry = 0;
  let timer = 0;
  let stopped = false;
  /** @type {Set<() => void>} */
  const openListeners = new Set();

  /** @type {any} */
  let client;

  const status = (/** @type {string} */ text) => {
    let node = document.getElementById('connection');
    if (!node) {
      node = document.createElement('div');
      node.id = 'connection';
      node.setAttribute('role', 'status');
      document.body.appendChild(node);
    }
    node.textContent = text;
    node.classList.toggle('hidden', !text);
  };

  const open = () => {
    if (stopped) return;
    socket = new WebSocket(wsUrl(role));
    socket.onopen = () => {
      retry = 0;
      status('');
      if (handlers.open) handlers.open({}, client);
      for (const fn of openListeners) fn();
      openListeners.clear();
    };
    socket.onmessage = (event) => {
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }
      const handler = handlers[msg.type];
      if (handler) handler(msg, client);
    };
    socket.onclose = () => {
      if (stopped) return;
      status('Связь потеряна. Переподключаемся…');
      timer = window.setTimeout(open, Math.min(1000 * 2 ** retry++, 5000));
    };
    socket.onerror = () => socket && socket.close();
  };

  client = {
    get readyState() {
      return socket ? socket.readyState : WebSocket.CONNECTING;
    },
    /** @param {string} data */
    send(data) {
      if (socket && socket.readyState === WebSocket.OPEN) socket.send(data);
    },
    /**
     * @param {string} type
     * @param {() => void} fn
     */
    addEventListener(type, fn) {
      if (type !== 'open') return;
      if (socket && socket.readyState === WebSocket.OPEN) fn();
      else openListeners.add(fn);
    },
    close() {
      stopped = true;
      window.clearTimeout(timer);
      if (socket) socket.close();
    },
  };

  open();
  return client;
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

/**
 * Рисует один отрезок на холсте (координаты 0..1).
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLCanvasElement} canvas
 * @param {{ x0: number, y0: number, x1: number, y1: number }} stroke
 */
export function drawStroke(ctx, canvas, stroke) {
  ctx.strokeStyle = '#1b0d05';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(stroke.x0 * canvas.width, stroke.y0 * canvas.height);
  ctx.lineTo(stroke.x1 * canvas.width, stroke.y1 * canvas.height);
  ctx.stroke();
}

/**
 * @param {HTMLCanvasElement} canvas
 */
export function clearCanvas(canvas) {
  canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {Array<{ x0: number, y0: number, x1: number, y1: number }>} strokes
 */
export function redrawCanvas(canvas, strokes) {
  clearCanvas(canvas);
  const ctx = canvas.getContext('2d');
  for (const stroke of strokes || []) drawStroke(ctx, canvas, stroke);
}
