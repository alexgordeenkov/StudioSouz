import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { networkInterfaces } from 'node:os';
import { WebSocketServer } from 'ws';
import QRCode from 'qrcode';
import { Party } from './party.js';
import { handleMessage } from './protocol.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const PORT = Number(process.env.PORT) || 3000;

const party = new Party({ code: makeCode() });

/**
 * @param {string} file
 * @returns {string}
 */
function contentType(file) {
  if (file.endsWith('.html')) return 'text/html; charset=utf-8';
  if (file.endsWith('.css')) return 'text/css; charset=utf-8';
  if (file.endsWith('.js')) return 'text/javascript; charset=utf-8';
  if (file.endsWith('.svg')) return 'image/svg+xml';
  if (file.endsWith('.png')) return 'image/png';
  return 'application/octet-stream';
}

/**
 * @returns {string}
 */
function makeCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 4; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

/**
 * @returns {string}
 */
function lanAddress() {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] ?? []) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return 'localhost';
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`);

  if (url.pathname === '/api/config') {
    const lan = lanAddress();
    const joinUrl = `http://${lan}:${PORT}/?code=${party.code}`;
    const qr = await QRCode.toDataURL(joinUrl, { margin: 1, width: 360 });
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ code: party.code, joinUrl, qr, lan, port: PORT }));
    return;
  }

  let filePath = url.pathname;
  if (filePath === '/') filePath = '/index.html';
  if (filePath === '/screen') filePath = '/screen.html';
  if (filePath === '/host') filePath = '/host.html';

  if (filePath.includes('..')) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  const full = path.join(PUBLIC_DIR, filePath);
  try {
    const data = await readFile(full);
    res.writeHead(200, { 'content-type': contentType(full) });
    res.end(data);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
});

const wss = new WebSocketServer({ server, path: '/ws' });

/**
 * @typedef {Object} ServerConn
 * @property {'screen' | 'host' | 'controller'} role
 * @property {string | null} participantId
 * @property {import('ws').WebSocket} ws
 */

/** @type {ServerConn[]} */
const conns = [];

/**
 * @param {import('ws').WebSocket} ws
 * @param {Record<string, any>} payload
 */
function safeSend(ws, payload) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

/**
 * @param {Record<string, any>} payload
 */
function broadcast(payload) {
  for (const c of conns) safeSend(c.ws, payload);
}

wss.on('connection', (ws, req) => {
  const url = new URL(req.url ?? '/ws', 'http://localhost');
  const requested = url.searchParams.get('role');
  const role =
    requested === 'screen' || requested === 'host' || requested === 'controller'
      ? requested
      : 'controller';

  /** @type {ServerConn} */
  const conn = { role, participantId: null, ws };
  conns.push(conn);

  safeSend(ws, { type: 'lobby', ...party.getState() });

  ws.on('message', (raw) => {
    /** @type {Record<string, any>} */
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }
    const effects = handleMessage(party, conn, msg, conns);
    for (const eff of effects) {
      if (eff.kind === 'broadcast') {
        broadcast(eff.payload);
      } else if (eff.kind === 'direct' && eff.target) {
        safeSend(eff.target.ws, eff.payload);
      }
    }
  });

  ws.on('close', () => {
    const idx = conns.indexOf(conn);
    if (idx >= 0) conns.splice(idx, 1);
    if (conn.participantId) {
      party.removeParticipant(conn.participantId);
      broadcast({ type: 'lobby', ...party.getState() });
    }
  });
});

server.listen(PORT, () => {
  console.log('');
  console.log('  Muzykalnye igry - server is running');
  console.log(`  Join code: ${party.code}`);
  console.log(`  Common screen: http://localhost:${PORT}/screen`);
  console.log(`  Host screen:   http://localhost:${PORT}/host`);
  console.log(`  Controller:    http://localhost:${PORT}/`);
  console.log('');
});
