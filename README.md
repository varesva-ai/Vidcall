# vidcall

Zero-login group video call. Open the URL → you're in the call. Max 10 people.

## Run

```
npm install
npm start
```

Open http://localhost:3000 in two tabs (or from your phone on the same Wi‑Fi via `http://<your-ip>:3000` — note: browsers only allow camera on `localhost` or HTTPS, so phones need an HTTPS deploy).

## How it works

- `server.js` — static file server + WebSocket signaling relay (single room, 10-peer cap)
- `public/index.html` — WebRTC mesh client: each newcomer opens a peer connection to everyone already in the room; media flows peer-to-peer, the server only relays offers/answers/ICE

## Deploying (to use it across the internet)

Push to any Node host with WebSocket support (Railway, Render, Fly.io). HTTPS is provided by those platforms, which unlocks camera access on all devices. If two people are both behind strict NATs, add a TURN server to `RTC_CONFIG` in `index.html` (e.g. a free tier from metered.ca or your own coturn).
