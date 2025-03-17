#!/usr/bin/env node

import { WebSocket } from 'ws';
import { Agent } from 'https';
import { createWorker } from 'tesseract.js';
import TK from 'terminal-kit';
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
  const worker = await createWorker('eng', 1);

  const agent = new Agent({ rejectUnauthorized: true });

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
    try {
      const { data } = await worker.recognize(
        Buffer.from(base64Data, 'base64'),
        {},
        { blocks: true }
      );
      let results = [];
      if (data.blocks && Array.isArray(data.blocks)) {
        results = data.blocks.map(block => ({
          bbox: [
            [block.bbox.x0, block.bbox.y0],
            [block.bbox.x1, block.bbox.y0],
            [block.bbox.x1, block.bbox.y1],
            [block.bbox.x0, block.bbox.y1]
          ],
          text: block.text,
          confidence: block.confidence / 100
        }));
      } else if (data.words && Array.isArray(data.words)) {
        results = data.words.map(word => ({
          bbox: [
            [word.bbox.x0, word.bbox.y0],
            [word.bbox.x1, word.bbox.y0],
            [word.bbox.x1, word.bbox.y1],
            [word.bbox.x0, word.bbox.y1]
          ],
          text: word.text,
          confidence: word.confidence / 100
        }));
      } else {
        results = [{
          bbox: [[0, 0], [data.width || 1920, 0], [data.width || 1920, data.height || 1080], [0, data.height || 1080]],
          text: data.text,
          confidence: data.confidence / 100
        }];
      }
      return results;
    } catch (error) {
      return [];
    }
  }

  function renderTerminal(results, imgWidth = 1920, imgHeight = 1080) {
    term.clear();
    if (!Array.isArray(results) || results.length === 0) {
      term.moveTo(1, 1).red('No text detected');
      return;
    }

    const xScale = process.stdout.columns / imgWidth;
    const yScale = (process.stdout.rows - 1) / imgHeight;
    const maxWidth = process.stdout.columns - 2; // Leave margin

    for (const { bbox, text, confidence } of results) {
      if (!bbox || !Array.isArray(bbox) || bbox.length < 4 || !text) continue;

      const [x0, y0] = bbox[0]; // Top-left
      const [x1, y1] = bbox[2]; // Bottom-right
      const termX = Math.floor(x0 * xScale) + 1;
      let termY = Math.floor(y0 * yScale) + 1;
      const textWidth = Math.floor((x1 - x0) * xScale);
      const textHeight = Math.floor((y1 - y0) * yScale);

      // Split text into lines and position them
      const lines = text.split('\n').filter(line => line.trim());
      for (let i = 0; i < lines.length && i < textHeight; i++) {
        const line = lines[i];
        let displayText = line;
        if (textWidth > 0 && line.length > textWidth) {
          displayText = line.slice(0, textWidth); // Truncate to fit bbox width
        }
        if (displayText.length > maxWidth - termX + 1) {
          displayText = displayText.slice(0, maxWidth - termX + 1); // Fit terminal width
        }
        if (termY + i <= process.stdout.rows) {
          term.moveTo(termX, termY + i);
          term.color(confidence > 0.7 ? 'green' : 'red', displayText);
        }
      }
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
        throw new Error(`Failed to fetch initial tabs: ${initialResponse.status}`);
      }
      await initialResponse.json(); // Consume response

      const ws = new WebSocket(wsUrl, { headers: { 'x-browserbox-local-auth': token }, agent });

      ws.on('open', () => {
        term.clear().moveTo(1, 1).green('Connected to WebSocket');
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
            try {
              JSON.parse(decoded.toString('utf8')); // Check if JSON, ignore if so
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
                const imgData = frame.img || frame;
                if (typeof imgData === 'string') {
                  const results = await processScreenshot(imgData);
                  renderTerminal(results);
                  sendAck(ws, frameId, castSessionId);
                }
              }
            }
          }
        } catch (e) {
          term.clear().moveTo(1, 1).red(`Processing error: ${e.message}`);
        }
      });

      ws.on('error', (err) => {
        term.clear().moveTo(1, 1).red(`WebSocket error: ${err.message}`);
      });

      ws.on('close', () => {
        term.clear().moveTo(1, 1).yellow('WebSocket disconnected');
        worker.terminate();
        process.exit(0);
      });

      process.on('SIGINT', async () => {
        term.clear().moveTo(1, 1).yellow('Shutting down...');
        await ws.close();
        await worker.terminate();
        process.exit(0);
      });
    } catch (error) {
      console.error(JSON.stringify({ error: error.message }));
      await worker.terminate();
      process.exit(1);
    }
  }

  await main();
})();
