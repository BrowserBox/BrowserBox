#!/usr/bin/env node

import { promisify } from 'util';
import { exec } from 'child_process';
import { WebSocket } from 'ws';
import TK from 'terminal-kit';
import { appendFileSync } from 'fs';
const { terminal } = TK;

const execAsync = promisify(exec);

// Debug flag for detailed error logging
const DEBUG = process.env.JAGUAR_DEBUG === 'true' || true;

// Log file for WebSocket messages
const LOG_FILE = 'cdp-log.txt';

// Parse command-line arguments for login link
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
const token = urlObj.searchParams.get('token');
const baseUrl = `${urlObj.protocol}//${urlObj.host}`;
const port = parseInt(urlObj.port, 10) || (urlObj.protocol === 'https:' ? 443 : 80);
const proxyPort = port + 1;
const proxyBaseUrl = `${urlObj.protocol}//${urlObj.hostname}:${proxyPort}`;
const loginUrl = `${baseUrl}/login?session_token=${token}`;
const apiUrl = `${baseUrl}/api/v10/tabs`;

/**
 * Logs a message to the log file with a timestamp.
 * @param {string} direction - 'SEND' or 'RECEIVE'
 * @param {Object|string} message - The message to log
 */
function logMessage(direction, message) {
  const timestamp = new Date().toISOString();
  const logEntry = JSON.stringify({ timestamp, direction, message }, null, 2) + '\n';
  try {
    appendFileSync(LOG_FILE, logEntry);
  } catch (error) {
    console.error(`Failed to write to log file: ${error.message}`);
  }
}

/**
 * Prints text from a web page to scaled terminal coordinates using Chrome DevTools Protocol.
 * @param {Object} params - The API object containing send and on functions.
 * @param {Function} params.send - Function to send CDP commands.
 * @param {Function} params.on - Function to listen for CDP events.
 * @param {string} params.sessionId - Session ID for the target tab.
 */
async function printTextLayoutToTerminal({ send, on, sessionId }) {
  try {
    terminal.cyan('Enabling DOM and snapshot domains...\n');
    await send('DOM.enable', {}, sessionId);
    await send('DOMSnapshot.enable', {}, sessionId);

    terminal.cyan('Capturing page snapshot...\n');
    const snapshot = await send('DOMSnapshot.captureSnapshot', {}, sessionId);

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
  const domNodes = snapshot.documents[0].domNodes;

  for (const node of domNodes) {
    if (node.nodeType === 3 && node.textValue) {
      const textValue = node.textValue.trim();
      if (!textValue) continue;
      for (const fragment of node.textFragments || []) {
        const { range, boundingBox } = fragment;
        const text = textValue.substring(range.start, range.start + range.length);
        if (text) textLayoutBoxes.push({ text, boundingBox });
      }
    }
  }
  return textLayoutBoxes;
}

/**
 * Gets the current terminal size in columns and rows.
 * @returns {Promise<Object>} Object with columns and rows properties.
 */
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

/**
 * Connects to the browser and returns CDP send/on functions with a selected session.
 */
async function connectToBrowser() {
  // First, hit /login to set the cookie
  terminal.cyan('Authenticating to set session cookie...\n');
  let cookieHeader;
  try {
    const response = await fetch(loginUrl, {
      method: 'GET',
      headers: { 'Accept': 'text/html' }, // /login might return HTML
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    // Extract the cookie from Set-Cookie header
    const setCookie = response.headers.get('set-cookie');
    if (!setCookie) {
      throw new Error('No Set-Cookie header in /login response');
    }
    const cookieMatch = setCookie.match(/browserbox-[^=]+=(.+?)(?:;|$)/);
    if (!cookieMatch) {
      throw new Error('Could not parse browserbox cookie from Set-Cookie header');
    }
    const cookieValue = cookieMatch[1];
    const cookieName = setCookie.split('=')[0];
    cookieHeader = `${cookieName}=${cookieValue}`;
    if (DEBUG) console.log(`Captured cookie: ${cookieHeader}`);
  } catch (error) {
    if (DEBUG) console.warn(error);
    terminal.red(`Error during login: ${error.message}\n`);
    process.exit(1);
  }

  // Fetch tabs from BrowserBox API using the cookie
  terminal.cyan('Fetching available tabs...\n');
  let targets;
  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cookie': cookieHeader,
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    const data = await response.json();
    targets = (data.tabs || []).filter(t => t.type === 'page' || t.type === 'tab');
  } catch (error) {
    if (DEBUG) console.warn(error);
    terminal.red(`Error fetching tabs: ${error.message}\n`);
    process.exit(1);
  }

  if (!targets.length) {
    terminal.yellow('No page or tab targets available to connect to.\n');
    process.exit(0);
  }

  // Let user select a tab
  terminal.clear().green('Available tabs:\n');
  const items = targets.map((t, i) => `${i + 1}. ${t.title || t.url || t.targetId}`);
  let selection;
  try {
    selection = await terminal.singleColumnMenu(items, {
      style: terminal.white,
      selectedStyle: terminal.green.bgBlack,
      exitOnUnexpectedKey: true,
      keyBindings: {
        '1': 'submit',
        '2': 'submit',
        '3': 'submit',
        '4': 'submit',
        '5': 'submit',
        '6': 'submit',
        '7': 'submit',
        '8': 'submit',
        '9': 'submit',
      },
    }).promise;
  } catch (error) {
    if (DEBUG) console.warn(error);
    terminal.yellow('Selection interrupted. Exiting...\n');
    process.exit(0);
  }

  const selectedTarget = targets[selection.selectedIndex];
  const targetId = selectedTarget.targetId;

  // Fetch the WebSocket debugger URL from /json/version on the proxy port
  terminal.cyan(`Fetching WebSocket debugger URL from ${proxyBaseUrl}/json/version...\n`);
  let wsDebuggerUrl;
  try {
    const response = await fetch(`${proxyBaseUrl}/json/version`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cookie': cookieHeader,
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    const data = await response.json();
    wsDebuggerUrl = data.webSocketDebuggerUrl;
    if (!wsDebuggerUrl) {
      throw new Error('No webSocketDebuggerUrl in /json/version response');
    }
  } catch (error) {
    if (DEBUG) console.warn(error);
    terminal.red(`Error fetching WebSocket debugger URL: ${error.message}\n`);
    process.exit(1);
  }

  // Connect to the WebSocket debugger URL with the cookie
  terminal.cyan(`Connecting to WebSocket at ${wsDebuggerUrl}...\n`);
  const socket = new WebSocket(wsDebuggerUrl, {
    headers: { 'Cookie': cookieHeader },
  });

  const Resolvers = {};
  let id = 0;

  socket.on('close', () => {
    terminal.yellow('WebSocket disconnected\n');
  });

  socket.on('error', (err) => {
    if (DEBUG) console.warn(err);
    terminal.red(`WebSocket error: ${err.message}\n`);
  });

  async function send(method, params = {}, sessionId) {
    const message = { method, params, sessionId, id: ++id };
    const key = `${sessionId || 'root'}:${message.id}`;
    let resolve;
    const promise = new Promise((res) => (resolve = res));
    Resolvers[key] = resolve;
    try {
      logMessage('SEND', message);
      socket.send(JSON.stringify(message));
    } catch (error) {
      if (DEBUG) console.warn(error);
      terminal.red(`Send error: ${error.message}\n`);
      throw error;
    }
    return promise;
  }

  function on(method, handler) {
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
      if (message.method === method) {
        await handler(message.params);
      } else if (message.id && Resolvers[`${message.sessionId || 'root'}:${message.id}`]) {
        Resolvers[`${message.sessionId || 'root'}:${message.id}`](message.result || message.error);
        delete Resolvers[`${message.sessionId || 'root'}:${message.id}`];
      } else {
        logMessage('UNHANDLED', message);
      }
    });
  }

  await new Promise((resolve, reject) => {
    socket.on('open', resolve);
    socket.on('error', reject);
  });
  terminal.green('Connected to WebSocket\n');

  // Get all targets to find the correct target ID
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

  return { send, on, sessionId };
}

// Main execution
(async () => {
  try {
    terminal.cyan('Starting browser connection...\n');
    const { send, on, sessionId } = await connectToBrowser();
    await printTextLayoutToTerminal({ send, on, sessionId });

    process.on('SIGINT', () => {
      terminal.yellow('\nShutting down...');
      socket.close();
      process.exit(0);
    });
  } catch (error) {
    if (DEBUG) console.warn(error);
    terminal.red(`Main error: ${error.message}\n`);
    process.exit(1);
  }
})();
