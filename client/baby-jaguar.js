#!/usr/bin/env node

import { promisify } from 'util';
import { exec } from 'child_process';
import { WebSocket } from 'ws';
import { appendFileSync } from 'fs';
import { Agent } from 'https';
import TK from 'terminal-kit';
const { terminal } = TK;

const execAsync = promisify(exec);

const DEBUG = process.env.JAGUAR_DEBUG === 'true' || true;
const LOG_FILE = 'cdp-log.txt';

const args = process.argv.slice(2);
let loginLink;
if (args.length === 1) {
  loginLink = args[0];
  try {
    const urlObj = new URL(loginLink);
    if (!urlObj.pathname.startsWith('/login') || !urlObj.searchParams.has('token')) {
      throw new Error('Invalid login link format. Expected: /login?token=<token>');
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
} else {
  console.error('Usage: node script.mjs <login-link>');
  console.error('Example: node script.mjs "https://example.com/login?token=abc123"');
  process.exit(1);
}

const urlObj = new URL(loginLink);
const hostname = urlObj.hostname;
const token = urlObj.searchParams.get('token');
const baseUrl = `${urlObj.protocol}//${urlObj.host}`;
const port = parseInt(urlObj.port, 10) || (urlObj.protocol === 'https:' ? 443 : 80);
const proxyPort = port + 1;
const proxyBaseUrl = `${urlObj.protocol}//${urlObj.hostname}:${proxyPort}`;
const loginUrl = `${baseUrl}/login?token=${token}`;
const apiUrl = `${baseUrl}/api/v10/tabs`;

function logMessage(direction, message) {
  const timestamp = new Date().toISOString();
  const logEntry = JSON.stringify({ timestamp, direction, message }, null, 2) + '\n';
  try {
    appendFileSync(LOG_FILE, logEntry);
    // Print to terminal for immediate feedback
    terminal.magenta(`[${timestamp}] ${direction}: `);
    terminal(JSON.stringify(message, null, 2) + '\n');
  } catch (error) {
    console.error(`Failed to write to log file: ${error.message}`);
  }
}

async function printTextLayoutToTerminal({ send, on, sessionId }) {
  try {
    terminal.cyan('Enabling DOM and snapshot domains...\n');
    send('DOM.enable', {}, sessionId);
    terminal.cyan('DOM enabled, enabling DOMSnapshot...\n');
    send('DOMSnapshot.enable', {}, sessionId);
    send('Page.reload', {}, sessionId);
    terminal.cyan('DOMSnapshot enabled, capturing snapshot...\n');

    const snapshot = await send('DOMSnapshot.captureSnapshot', {computedStyles:[]}, sessionId);
    if (!snapshot?.documents?.length) {
      throw new Error('No documents in snapshot');
    }

    const textLayoutBoxes = extractTextLayoutBoxes(snapshot);
    if (!textLayoutBoxes.length) {
      terminal.yellow('No text boxes found in snapshot.\n');
      return;
    }

    const { columns: termWidth, rows: termHeight } = await getTerminalSize();
    const { contentWidth, contentHeight } = snapshot.documents[0];

    const scaleX = termWidth / contentWidth;
    const scaleY = termHeight / contentHeight;

    terminal.clear();
    terminal.cyan(`Rendering ${textLayoutBoxes.length} text boxes...\n`);

    for (const { text, boundingBox } of textLayoutBoxes) {
      const termX = Math.floor(boundingBox.x * scaleX);
      const termY = Math.floor(boundingBox.y * scaleY);
      const clampedX = Math.max(0, Math.min(termX, termWidth - 1));
      const clampedY = Math.max(0, Math.min(termY, termHeight - 1));
      terminal.moveTo(clampedX + 1, clampedY + 1)(text);
    }

    terminal.moveTo(1, termHeight).green('Text layout printed successfully!\n');
  } catch (error) {
    if (DEBUG) console.warn(error);
    terminal.red(`Error printing text layout: ${error.message}\n`);
  }
}

/**
 * Extracts text and their bounding boxes from a CDP snapshot.
 * @param {Object} snapshot - The snapshot object from DOMSnapshot.captureSnapshot.
 * @returns {Array} Array of objects with text and boundingBox properties.
 */
function extractTextLayoutBoxes(snapshot) {
  const textLayoutBoxes = [];
  const strings = snapshot.strings;
  const document = snapshot.documents[0]; // Assuming we work with the first document
  const nodeTree = document.nodes;
  const textBoxes = document.textBoxes;

  if (!textBoxes || !textBoxes.bounds || !textBoxes.start || !textBoxes.length) {
    terminal.yellow('No text boxes found in snapshot.\n');
    return textLayoutBoxes;
  }

  // Iterate over each text box in TextBoxSnapshot
  for (let i = 0; i < textBoxes.layoutIndex.length; i++) {
    const layoutIndex = textBoxes.layoutIndex[i]; // Index into LayoutTreeSnapshot.nodeIndex
    const bounds = textBoxes.bounds[i]; // [x, y, width, height]
    const start = textBoxes.start[i]; // Starting character index
    const length = textBoxes.length[i]; // Number of characters

    // Find the corresponding node in LayoutTreeSnapshot
    const layoutNodeIndex = document.layout.nodeIndex.indexOf(layoutIndex);
    if (layoutNodeIndex === -1) continue; // No matching layout node

    const textIndex = document.layout.text[layoutNodeIndex]; // StringIndex into strings
    if (textIndex === undefined || textIndex < 0 || textIndex >= strings.length) continue;

    // Extract the text substring
    const fullText = strings[textIndex];
    const text = fullText.substring(start, start + length).trim();
    if (!text) continue;

    // Convert bounds to boundingBox format {x, y, width, height}
    const boundingBox = {
      x: bounds[0],
      y: bounds[1],
      width: bounds[2],
      height: bounds[3],
    };

    textLayoutBoxes.push({ text, boundingBox });
  }

  return textLayoutBoxes;
}

async function getTerminalSize() {
  try {
    const { stdout } = await execAsync('stty size');
    const [rows, columns] = stdout.trim().split(' ').map(Number);
    return { columns, rows };
  } catch (error) {
    if (DEBUG) console.warn(error);
    terminal.red(`Failed to get terminal size: ${error.message}\n`);
    return { columns: 80, rows: 24 };
  }
}

async function connectToBrowser() {
  terminal.cyan('Authenticating to set session cookie...\n');
  let cookieHeader;
  let cookieValue;
  try {
    const response = await fetch(loginUrl, { method: 'GET', headers: { 'Accept': 'text/html' }, redirect: 'manual' });
    if (response.status !== 302) throw new Error(`Expected 302 redirect, got HTTP ${response.status}: ${await response.text()}`);
    const setCookie = response.headers.get('set-cookie');
    if (!setCookie) throw new Error('No Set-Cookie header in /login response');
    const cookieMatch = setCookie.match(/browserbox-[^=]+=(.+?)(?:;|$)/);
    if (!cookieMatch) throw new Error('Could not parse browserbox cookie');
    cookieValue = cookieMatch[1];
    const cookieName = setCookie.split('=')[0];
    cookieHeader = `${cookieName}=${cookieValue}`;
    if (DEBUG) console.log(`Captured cookie: ${cookieHeader}`);
  } catch (error) {
    if (DEBUG) console.warn(error);
    terminal.red(`Error during login: ${error.message}\n`);
    process.exit(1);
  }

  terminal.cyan('Fetching available tabs...\n');
  let targets;
  try {
    const response = await fetch(apiUrl, { method: 'GET', headers: { 'Accept': 'application/json', 'Cookie': cookieHeader } });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    const data = await response.json();
    targets = (data.tabs || []).filter(t => t.type === 'page' || t.type === 'tab');
  } catch (error) {
    if (DEBUG) console.warn(error);
    terminal.red(`Error fetching tabs: ${error.message}\n`);
    process.exit(1);
  }

  if (!targets.length) {
    terminal.yellow('No page or tab targets available.\n');
    process.exit(0);
  }

  terminal.clear().green('Available tabs:\n');
  const items = targets.map((t, i) => `${i + 1}. ${t.title || t.url || t.targetId}`);
  const selection = await terminal.singleColumnMenu(items, {
    style: terminal.white,
    selectedStyle: terminal.green.bgBlack,
    exitOnUnexpectedKey: true,
    keyBindings: { '1': 'submit', '2': 'submit', '3': 'submit', '4': 'submit', '5': 'submit', '6': 'submit', '7': 'submit', '8': 'submit', '9': 'submit' },
  }).promise.catch(() => {
    terminal.yellow('Selection interrupted. Exiting...\n');
    process.exit(0);
  });

  const selectedTarget = targets[selection.selectedIndex];
  const targetId = selectedTarget.targetId;

  terminal.cyan(`Fetching WebSocket debugger URL from ${proxyBaseUrl}/json/version...\n`);
  let wsDebuggerUrl;
  try {
    const response = await fetch(`${proxyBaseUrl}/json/version`, { method: 'GET', headers: { 'Accept': 'application/json', 'x-browserbox-local-auth': cookieValue } });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    const data = await response.json();
    wsDebuggerUrl = data.webSocketDebuggerUrl;
    if (!wsDebuggerUrl) throw new Error('No webSocketDebuggerUrl in response');
  } catch (error) {
    if (DEBUG) console.warn(error);
    terminal.red(`Error fetching WebSocket debugger URL: ${error.message}\n`);
    process.exit(1);
  }

  wsDebuggerUrl = wsDebuggerUrl.replace('ws://localhost', `wss://${hostname}`);
  wsDebuggerUrl = `${wsDebuggerUrl}/${token}`;
  terminal.cyan(`Connecting to WebSocket at ${wsDebuggerUrl}...\n`);
  const socket = new WebSocket(wsDebuggerUrl, {
    headers: { 'x-browserbox-local-auth': cookieValue },
    agent: new Agent({ rejectUnauthorized: false }),
  });

  const Resolvers = {};
  let id = 0;

  socket.on('close', () => terminal.yellow('WebSocket disconnected\n'));
  socket.on('error', (err) => {
    if (DEBUG) console.warn(err);
    terminal.red(`WebSocket error: ${err.message}\n`);
  });

  socket.on('message', async (data) => {
    let message;
    try {
      const dataStr = Buffer.isBuffer(data) ? data.toString('utf8') : data;
      message = JSON.parse(dataStr);
      logMessage('RECEIVE', message);
    } catch (error) {
      if (DEBUG) console.warn(error);
      logMessage('RECEIVE_ERROR', { raw: Buffer.isBuffer(data) ? data.toString('base64') : data, error: error.message });
      terminal.red(`Invalid message: ${String(data).slice(0, 50)}...\n`);
      return;
    }
    const key = `${message.sessionId || 'root'}:${message.id}`;
    if (message.id && Resolvers[key]) {
      Resolvers[key](message.result || message.error);
      delete Resolvers[key];
    } else {
      logMessage('UNHANDLED', message);
    }
  });

  async function send(method, params = {}, sessionId) {
    const message = { method, params, sessionId, id: ++id };
    const key = `${sessionId || 'root'}:${message.id}`;
    let resolve, reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    Resolvers[key] = resolve;

    // Add a timeout to detect hangs
    const timeout = setTimeout(() => {
      delete Resolvers[key];
      reject(new Error(`Timeout waiting for response to ${method} (id: ${message.id})`));
    }, 10000); // 10 seconds timeout

    try {
      logMessage('SEND', message);
      socket.send(JSON.stringify(message));
    } catch (error) {
      clearTimeout(timeout);
      delete Resolvers[key];
      if (DEBUG) console.warn(error);
      terminal.red(`Send error: ${error.message}\n`);
      throw error;
    }
    return promise.finally(() => clearTimeout(timeout));
  }

  await new Promise((resolve, reject) => {
    socket.on('open', resolve);
    socket.on('error', reject);
  });
  terminal.green('Connected to WebSocket\n');

  terminal.cyan('Fetching all targets...\n');
  const { targetInfos } = await send('Target.getTargets', {});
  const pageTarget = targetInfos.find(t => t.type === 'page' && t.url === selectedTarget.url);
  if (!pageTarget) {
    terminal.red('Could not find matching page target.\n');
    process.exit(1);
  }
  const finalTargetId = pageTarget.targetId;

  terminal.cyan(`Attaching to target ${finalTargetId}...\n`);
  const { sessionId } = await send('Target.attachToTarget', { targetId: finalTargetId, flatten: true });
  terminal.green(`Attached with session ${sessionId}\n`);

  return { send, sessionId };
}

(async () => {
  let socket;
  try {
    terminal.cyan('Starting browser connection...\n');
    const result = await connectToBrowser();
    socket = result.socket; // Store socket for cleanup
    await printTextLayoutToTerminal(result);

    process.on('SIGINT', () => {
      terminal.yellow('\nShutting down...\n');
      if (socket) socket.close();
      process.exit(0);
    });
  } catch (error) {
    if (DEBUG) console.warn(error);
    terminal.red(`Main error: ${error.message}\n`);
    process.exit(1);
  }
})();
