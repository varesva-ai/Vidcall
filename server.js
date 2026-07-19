// Tiny signaling server: serves the static page and relays WebRTC
// offers/answers/ICE candidates between everyone in the single room.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 3000;
const MAX_PEERS = 10;

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  const file = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  const filePath = path.join(__dirname, 'public', path.normalize(file).replace(/^(\.\.[\/\\])+/, ''));
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  });
});

const wss = new WebSocketServer({ server });
const peers = new Map(); // id -> ws
let nextId = 1;

function send(ws, msg) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg));
}

wss.on('connection', (ws) => {
  if (peers.size >= MAX_PEERS) {
    send(ws, { type: 'full' });
    ws.close();
    return;
  }

  const id = String(nextId++);
  ws.id = id;

  // Tell the newcomer who's already here; they will send offers to each.
  send(ws, { type: 'welcome', id, peers: [...peers.keys()] });
  peers.set(id, ws);

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }
    if (msg.type === 'signal' && peers.has(msg.to)) {
      send(peers.get(msg.to), { type: 'signal', from: id, data: msg.data });
    } else if (msg.type === 'name') {
      for (const [pid, pws] of peers) {
        if (pid !== id) send(pws, { type: 'name', from: id, name: msg.name });
      }
    }
  });

  ws.on('close', () => {
    peers.delete(id);
    for (const pws of peers.values()) send(pws, { type: 'peer-left', id });
  });
});

server.listen(PORT, () => {
  console.log(`vidcall running on http://localhost:${PORT}`);
});
