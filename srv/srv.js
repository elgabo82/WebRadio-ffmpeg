// Proxy HLS (.m3u8) → MP3 over HTTPS
// npm install express fluent-ffmpeg
const fs = require('fs');
const https = require('https');
const express = require('express');
const ffmpeg = require('fluent-ffmpeg');

const HLS_URL = 'https://d18akkbk4wyh6u.cloudfront.net/index.m3u8';
const PORT = 8884;                       // https://localhost:8443/stream

// ─── Express app ───────────────────────────────────────────────────────────
const app = express();

app.get('/stream', (req, res) => {
  res.set({
    'Content-Type': 'audio/mpeg',
    'Transfer-Encoding': 'chunked',
    'Cache-Control': 'no-cache',
  });

  ffmpeg(HLS_URL)
    .addOption('-vn')          // no video
    .audioCodec('libmp3lame')
    .audioBitrate('128k')
    .format('mp3')
    .on('error', (err) => {
      console.error('FFmpeg error:', err.message);
      if (!res.headersSent) res.sendStatus(500);
    })
    .pipe(res, { end: true });
});

// ─── HTTPS server ──────────────────────────────────────────────────────────
const credentials = {
  key:  fs.readFileSync('/etc/letsencrypt/live/radio.grupofmo.com/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/radio.grupofmo.com/cert.pem'),
};
https.createServer(credentials, app).listen(PORT, () => {
  console.log(`Proxy MP3 (HTTPS) ready → https://localhost:${PORT}/stream`);
});

