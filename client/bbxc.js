#!/usr/bin/env node

import { WebSocket } from 'ws';

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
const apiUrl = `${baseUrl}/api/v10/tabs?sessionToken=${token}`; // Adjust version if needed
const wsUrl = `${baseUrl.replace('http', 'ws')}?session_token=${token}`;

let messageId = 1;

// Parse binary screenshot header
function parseBinaryScreenshot(buffer) {
  const u32 = new Uint32Array(buffer.buffer, 0, 7); // 28 bytes / 4 = 7 Uint32
  const isLittleEndian = true; // Node.js is little-endian
  let castSessionId = isLittleEndian ? u32[0] : swap32(u32[0]);
  let frameId = isLittleEndian ? u32[1] : swap32(u32[1]);
  let targetId = `${u32[2].toString(16).padStart(8, '0')}${u32[3].toString(16).padStart(8, '0')}${u32[4].toString(16).padStart(8, '0')}${u32[5].toString(16).padStart(8, '0')}`.toUpperCase();
  const img = buffer.slice(28); // HEADER_BYTE_LEN = 28
  return { frameId, castSessionId, targetId, img: img.toString('base64') };
}

// Swap bytes for big-endian (if needed)
function swap32(val) {
  return ((val & 0xFF) << 24) | ((val & 0xFF00) << 8) | ((val >> 8) & 0xFF00) | ((val >> 24) & 0xFF);
}

// Send screenshot acknowledgment
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

// Main async function
async function main() {
  try {
    // Fetch initial tab data
    const initialResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    if (!initialResponse.ok) {
      const errorText = await initialResponse.text();
      throw new Error(`Failed to fetch initial tabs: ${initialResponse.status} - ${errorText}`);
    }
    const initialData = await initialResponse.json();
    console.log(JSON.stringify(initialData, null, 2));

    // Establish WebSocket connection
    const ws = new WebSocket(wsUrl, {
      headers: { 'x-browserbox-local-auth': token },
    });

    ws.on('open', () => {
      console.log(JSON.stringify({ status: 'WebSocket connected' }));
      // Request initial tabs and start screenshot flow
      ws.send(JSON.stringify({
        messageId: messageId++,
        tabs: true,
        screenshotAck: 1, // Initial ack
        zombie: { events: [] },
      }));
    });

    ws.on('message', (data) => {
      if (Buffer.isBuffer(data)) {
        // Binary screenshot
        const { frameId, castSessionId, targetId, img } = parseBinaryScreenshot(data);
        const frameData = {
          type: 'screenshot',
          frameId,
          castSessionId,
          targetId,
          data: img,
          timestamp: new Date().toISOString(),
        };
        console.log(JSON.stringify(frameData, null, 2));
        sendAck(ws, frameId, castSessionId);
      } else {
        // JSON message
        const message = JSON.parse(data.toString());
        console.log(JSON.stringify(message, null, 2));

        // Handle frameBuffer (base64 screenshots)
        if (message.frameBuffer && Array.isArray(message.frameBuffer) && message.frameBuffer.length > 0) {
          message.frameBuffer.forEach((frame, index) => {
            const frameId = frame.frameId || (message.messageId * 1000 + index); // Fallback if frameId not provided
            const castSessionId = frame.castSessionId || 0x7FFFFFFF; // Default from client
            const frameData = {
              type: 'screenshot',
              frameId,
              castSessionId,
              data: frame.img || frame, // Handle {img} or raw base64
              timestamp: new Date().toISOString(),
            };
            console.log(JSON.stringify(frameData, null, 2));
            sendAck(ws, frameId, castSessionId);
          });
        }

        // Handle meta messages (no screenshot-specific ack needed)
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
              console.log(JSON.stringify(metaData, null, 2));
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

    // Handle Ctrl+C gracefully
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
