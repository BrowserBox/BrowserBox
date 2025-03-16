#!/usr/bin/env node

import { WebSocket } from 'ws';
import { Agent } from 'https';

// Parse command-line arguments
const args = process.argv.slice(2);
if (args.length !== 1) {
  console.error('Usage: bbxc <login-link>');
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
  console.error(`Error: ${error.message}`);
  process.exit(1);
}

const token = urlObj.searchParams.get('token');
const baseUrl = `${urlObj.protocol}//${urlObj.host}`;
const apiUrl = `${baseUrl}/api/v10/tabs?sessionToken=${token}`;
const wsUrl = `${baseUrl.replace('http', 'ws')}?session_token=${token}`;

let messageId = 1;

// Custom HTTPS agent to bypass SSL verification (for mkcert/local testing)
const agent = new Agent({
  rejectUnauthorized: false, // WARNING: Use only for local testing!
});

// Parse binary screenshot header (returns null if invalid)
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
    zombie: {
      events: [{
        type: 'buffered-results-collection',
        command: { isBufferedResultsCollectionOnly: true, params: {} },
      }],
    },
  };
  ws.send(JSON.stringify(ackMessage));
}

async function main() {
  try {
    // Fetch initial tab data with custom agent
    const initialResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      agent, // Bypass SSL verification
    });
    if (!initialResponse.ok) {
      const errorText = await initialResponse.text();
      throw new Error(`Failed to fetch initial tabs: ${initialResponse.status} - ${errorText}`);
    }
    const initialData = await initialResponse.json();
    console.log(JSON.stringify(initialData));

    // Establish WebSocket connection with custom agent
    const ws = new WebSocket(wsUrl, {
      headers: { 'x-browserbox-local-auth': token },
      agent, // Pass agent via WebSocket options (works in ws v8+)
    });

    ws.on('open', () => {
      console.log(JSON.stringify({ status: 'WebSocket connected' }));
      ws.send(JSON.stringify({
        messageId: messageId++,
        tabs: true,
        screenshotAck: 1,
        zombie: { events: [] },
      }));
    });

    ws.on('message', (data) => {
      if (Buffer.isBuffer(data)) {
        const decoded = Buffer.from(data, 'base64');
        let content;
        try {
          content = JSON.parse(decoded.toString('utf8'));
          console.log(JSON.stringify(content));
        } catch (e) {
          try {
            const screenshot = parseBinaryScreenshot(decoded);
            if (screenshot) {
              const frameData = {
                type: 'screenshot',
                frameId: screenshot.frameId,
                castSessionId: screenshot.castSessionId,
                targetId: screenshot.targetId,
                data: screenshot.img,
                timestamp: new Date().toISOString(),
              };
              console.log(JSON.stringify(frameData));
              sendAck(ws, screenshot.frameId, screenshot.castSessionId);
            }
          } catch (e) {
            console.error(JSON.stringify({ error: `Failed to decode binary message: ${e.message}`, raw: data.toString('base64') }));
          }
        }
      } else {
        let message;
        try {
          message = JSON.parse(data.toString());
          console.log(JSON.stringify(message));
        } catch (e) {
          console.error(JSON.stringify({ error: `Failed to parse JSON message: ${e.message}`, raw: data.toString() }));
          return;
        }

        if (message.frameBuffer && Array.isArray(message.frameBuffer) && message.frameBuffer.length > 0) {
          message.frameBuffer.forEach((frame, index) => {
            const frameId = frame.frameId || (message.messageId * 1000 + index);
            const castSessionId = frame.castSessionId || 0x7FFFFFFF;
            const frameData = {
              type: 'screenshot',
              frameId,
              castSessionId,
              data: frame.img || frame,
              timestamp: new Date().toISOString(),
            };
            console.log(JSON.stringify(frameData));
            sendAck(ws, frameId, castSessionId);
          });
        }

        if (message.meta && Array.isArray(message.meta)) {
          message.meta.forEach((metaItem) => {
            const metaKeys = Object.keys(metaItem);
            metaKeys.forEach((key) => {
              const metaData = {
                type: 'meta',
                subtype: key,
                data: metaItem[key],
                messageId: message.messageId,
                timestamp: new Date().toISOString(),
              };
              console.log(JSON.stringify(metaData));
            });
          });
        }
      }
    });

    ws.on('error', (err) => {
      console.error(JSON.stringify({ error: `WebSocket error: ${err.message}` }));
    });

    ws.on('close', () => {
      console.log(JSON.stringify({ status: 'WebSocket disconnected' }));
      process.exit(0);
    });

    process.on('SIGINT', () => {
      ws.close();
      process.exit(0);
    });

  } catch (error) {
    console.error(JSON.stringify({ error: error.message }));
    process.exit(1);
  }
}

main();
