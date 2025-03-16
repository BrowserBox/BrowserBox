#!/usr/bin/env node

import { WebSocket } from 'ws';
import { Agent } from 'https';
import { createWorker } from 'tesseract.js';
import TK from 'terminal-kit'
const { terminal } = TK;

// Parse command-line arguments
const args = process.argv.slice(2);
if (args.length !== 1) {
  console.error('Usage: ./bbreader.mjs <login-link>');
  process.exit(1);
}
const loginLink = args[0];

// Extract URL components
let urlObj;
try {
  urlObj = new URL(loginLink);
  if (!urlObj.pathname.startsWith('/login') || !urlObj.searchParams.has('token')) {
    throw new Error('Invalid login link format. Expected: /login?token=<token>');
  }
} catch (error) {
  console.error(JSON.stringify({ error: error.message }));
  process.exit(1);
}

const token = urlObj.searchParams.get('token');
const baseUrl = `${urlObj.protocol}//${urlObj.host}`;
const apiUrl = `${baseUrl}/api/v10/tabs?sessionToken=${token}`;
const wsUrl = `${baseUrl.replace('http', 'ws')}?session_token=${token}`;

let messageId = 1;
const term = new terminal();

// Initialize Tesseract worker
(async () => {
  const worker = await createWorker({
    logger: m => console.error(JSON.stringify(m)), // Debug logging to stderr
  });
  await worker.load();
  await worker.loadLanguage('eng');
  await worker.initialize('eng');

  const agent = new Agent({ rejectUnauthorized: false });

  function parseBinaryScreenshot(buffer) {
    if (buffer.length < 28) return null;
    const u32 = new Uint32Array(buffer.buffer, 0, 7);
    const isLittleEndian = true;
    let castSessionId = isLittleEndian ? u32[0] : swap32(u32[0]);
    let frameId = isLittleEndian ? u32[1] : swap32(u32[1]);
    let targetId = `${u32[2].toString(16).padStart(8, '0')}${u32[3].toString(16).padStart(8, '0')}${u32[4].toString(16).padStart(8, '0')}${u32[5].toString(16).padStart(8, '0')}`.toUpperCase();
    if (frameId <= 0 || castSessionId <= 0 || !targetId.match(/^[0-9A-F]{32}$/)) return null;
    const img = buffer.slice(28);
    return { frameId, castSessionId, targetId, img: img.toString('base64') };
  }

  function swap32(val) {
    return ((val & 0xFF) << 24) | ((val & 0xFF00) << 8) | ((val >> 8) & 0xFF00) | ((val >> 24) & 0xFF);
  }

  function sendAck(ws, frameId, castSessionId) {
    const ackMessage = {
      messageId: messageId++,
      screenshotAck: { frameId, castSessionId },
      zombie: { events: [{ type: 'buffered-results-collection', command: { isBufferedResultsCollectionOnly: true, params: {} } }] },
    };
    ws.send(JSON.stringify(ackMessage));
  }

  async function processScreenshot(base64Data) {
    const { data } = await worker.recognize(Buffer.from(base64Data, 'base64'));
    // Convert Tesseract words to EasyOCR-like format: [bbox, text, confidence]
    return data.words.map(word => [
      [[word.bbox.x0, word.bbox.y0], [word.bbox.x1, word.bbox.y0], [word.bbox.x1, word.bbox.y1], [word.bbox.x0, word.bbox.y1]],
      word.text,
      word.confidence / 100
    ]);
  }

  function renderTerminal(results, imgWidth = 1920, imgHeight = 1080) {
    term.clear();
    const xScale = process.stdout.columns / imgWidth;
    const yScale = (process.stdout.rows - 1) / imgHeight;
    for (const [bbox, text, conf] of results) {
      const [x1, y1] = bbox[0]; // Top-left corner
      const termX = Math.floor(x1 * xScale);
      const termY = Math.floor(y1 * yScale);
      term.moveTo(termX + 1, termY + 1);
      term.color(conf > 0.7 ? 'green' : 'red', text);
    }
  }

  async function main() {
    try {
      const initialResponse = await fetch(apiUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        agent,
      });
      if (!initialResponse.ok) {
        const errorText = await initialResponse.text();
        throw new Error(`Failed to fetch initial tabs: ${initialResponse.status} - ${errorText}`);
      }
      const initialData = await initialResponse.json();
      console.error(JSON.stringify(initialData));

      const ws = new WebSocket(wsUrl, { headers: { 'x-browserbox-local-auth': token }, agent });

      ws.on('open', () => {
        console.error(JSON.stringify({ status: 'WebSocket connected' }));
        ws.send(JSON.stringify({
          messageId: messageId++,
          tabs: true,
          screenshotAck: 1,
          zombie: { events: [] },
        }));
      });

      ws.on('message', async (data) => {
        try {
          if (Buffer.isBuffer(data)) {
            const decoded = Buffer.from(data, 'base64');
            let content;
            try {
              content = JSON.parse(decoded.toString('utf8'));
              console.error(JSON.stringify(content));
            } catch (e) {
              const screenshot = parseBinaryScreenshot(decoded);
              if (screenshot) {
                const results = await processScreenshot(screenshot.img);
                renderTerminal(results);
                sendAck(ws, screenshot.frameId, screenshot.castSessionId);
              }
            }
          } else {
            const message = JSON.parse(data.toString());
            if (message.frameBuffer && Array.isArray(message.frameBuffer) && message.frameBuffer.length > 0) {
              for (const [index, frame] of message.frameBuffer.entries()) {
                const frameId = frame.frameId || (message.messageId * 1000 + index);
                const castSessionId = frame.castSessionId || 0x7FFFFFFF;
                const results = await processScreenshot(frame.img || frame);
                renderTerminal(results);
                sendAck(ws, frameId, castSessionId);
              }
            }
            if (message.meta && Array.isArray(message.meta)) {
              message.meta.forEach((metaItem) => {
                Object.entries(metaItem).forEach(([key, value]) => {
                  console.error(JSON.stringify({ type: 'meta', subtype: key, data: value, messageId: message.messageId, timestamp: message.timestamp || '' }));
                });
              });
            }
          }
        } catch (e) {
          console.error(JSON.stringify({ error: `Processing error: ${e.message}`, raw: data.toString() }));
        }
      });

      ws.on('error', (err) => console.error(JSON.stringify({ error: `WebSocket error: ${err.message}` })));
      ws.on('close', () => {
        console.error(JSON.stringify({ status: 'WebSocket disconnected' }));
        worker.terminate();
        process.exit(0);
      });
      process.on('SIGINT', () => {
        ws.close();
        worker.terminate();
      });
    } catch (error) {
      console.error(JSON.stringify({ error: error.message }));
      worker.terminate();
      process.exit(1);
    }
  }

  main();
})();
