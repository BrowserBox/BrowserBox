#!/usr/bin/env node

import { promisify } from 'util';
import { exec } from 'child_process';
import { WebSocket } from 'ws';
import { appendFileSync } from 'fs';
import { Agent } from 'https';
import TK from 'terminal-kit';
const { terminal } = TK;

const execAsync = promisify(exec);

const DEBUG = process.env.JAGUAR_DEBUG === 'true' || false;
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

/**
 * Extracts text and their bounding boxes from a CDP snapshot.
 * @param {Object} snapshot - The snapshot object from DOMSnapshot.captureSnapshot.
 * @returns {Array} Array of objects with text and boundingBox properties.
 */

function extractTextLayoutBoxes(snapshot) {
  const textLayoutBoxes = [];
  const strings = snapshot.strings;
  const document = snapshot.documents[0];
  const textBoxes = document.textBoxes;
  const layout = document.layout;
  const nodes = document.nodes;

  if (!textBoxes || !textBoxes.bounds || !textBoxes.start || !textBoxes.length) {
    terminal.yellow('No text boxes found in snapshot.\n');
    return textLayoutBoxes;
  }

  terminal.cyan(`Found ${textBoxes.layoutIndex.length} text boxes in snapshot.\n`);

  // Map layoutIndex to nodeIndex
  const layoutToNode = new Map();
  layout.nodeIndex.forEach((nodeIdx, layoutIdx) => layoutToNode.set(layoutIdx, nodeIdx));

  // Map nodeIndex to parentIndex
  const nodeToParent = new Map();
  nodes.parentIndex.forEach((parentIdx, nodeIdx) => nodeToParent.set(nodeIdx, parentIdx));

  // Get clickable node indexes
  const clickableIndexes = new Set(nodes.isClickable?.index || []);
  DEBUG && terminal.blue(`Clickable Indexes: ${JSON.stringify([...clickableIndexes])}\n`);

  for (let i = 0; i < textBoxes.layoutIndex.length; i++) {
    const layoutIndex = textBoxes.layoutIndex[i];
    const bounds = textBoxes.bounds[i];
    const start = textBoxes.start[i];
    const length = textBoxes.length[i];

    if (layoutIndex === -1 || !bounds || start === -1 || length === -1) {
      DEBUG && terminal.yellow(`Skipping invalid text box ${i} (layoutIndex: ${layoutIndex})\n`);
      continue;
    }

    const textIndex = layout.text[layoutIndex];
    if (textIndex === -1 || textIndex >= strings.length) {
      DEBUG && terminal.yellow(`Invalid text index ${textIndex} for layoutIndex ${layoutIndex}\n`);
      continue;
    }

    const fullText = strings[textIndex];
    const text = fullText.substring(start, start + length).trim();
    if (!text) {
      DEBUG && terminal.yellow(`Empty text for layoutIndex ${layoutIndex}\n`);
      continue;
    }

    const boundingBox = {
      x: bounds[0],
      y: bounds[1],
      width: bounds[2],
      height: bounds[3],
    };

    // Get the nodeIndex for this text box
    const nodeIndex = layoutToNode.get(layoutIndex);
    // Check if this node or its parent is clickable
    const parentIndex = nodeToParent.get(nodeIndex);
    const isClickable = (nodeIndex !== undefined && clickableIndexes.has(nodeIndex)) ||
                       (parentIndex !== undefined && clickableIndexes.has(parentIndex));

    textLayoutBoxes.push({ text, boundingBox, isClickable });
    DEBUG && terminal.magenta(`Text Box ${i}: "${text}" at (${boundingBox.x}, ${boundingBox.y}) | nodeIndex: ${nodeIndex} | parentIndex: ${parentIndex} | isClickable: ${isClickable}\n`);
  }

  return textLayoutBoxes;
}

async function printTextLayoutToTerminal({ send, sessionId }) {
  let clickableElements = [];
  let isListening = true;
  let scrollDelta = 50; // Pixels to scroll per wheel event

  const refresh = async () => {
    try {
      DEBUG && terminal.cyan('Enabling DOM and snapshot domains...\n');
      send('DOM.enable', {}, sessionId);
      send('DOMSnapshot.enable', {}, sessionId);
      // Note: Removed Page.reload to preserve scroll position
      DEBUG && terminal.cyan('Capturing snapshot...\n');

      const snapshot = await send('DOMSnapshot.captureSnapshot', { computedStyles: [], includeDOMRects: true }, sessionId);
      if (!snapshot?.documents?.length) throw new Error('No documents in snapshot');

      const layoutMetrics = await send('Page.getLayoutMetrics', {}, sessionId);
      const viewport = layoutMetrics.visualViewport;
      const viewportX = viewport.pageX;
      const viewportY = viewport.pageY;
      const viewportWidth = viewport.clientWidth;
      const viewportHeight = viewport.clientHeight;

      const { textLayoutBoxes, clickableElements: newClickables } = extractTextLayoutBoxes(snapshot);
      clickableElements = newClickables;
      if (!textLayoutBoxes.length) {
        terminal.yellow('No text boxes found.\n');
        return;
      }

      const { columns: termWidth, rows: termHeight } = await getTerminalSize();
      const { contentWidth, contentHeight } = snapshot.documents[0];
      const scaleX = termWidth / contentWidth;
      const scaleY = termHeight / contentHeight;

      const visibleBoxes = textLayoutBoxes.filter(box => {
        const boxX = box.boundingBox.x;
        const boxY = box.boundingBox.y;
        const boxRight = boxX + box.boundingBox.width;
        const boxBottom = boxY + box.boundingBox.height;

        const viewportLeft = viewportX;
        const viewportRight = viewportX + viewportWidth;
        const viewportTop = viewportY;
        const viewportBottom = viewportY + viewportHeight;

        return boxX < viewportRight &&
               boxRight > viewportLeft &&
               boxY < viewportBottom &&
               boxBottom > viewportTop;
      });

      terminal.clear();
      DEBUG && terminal.cyan(`Rendering ${visibleBoxes.length} visible text boxes (viewport: ${viewportWidth}x${viewportHeight} at ${viewportX},${viewportY})...\n`);

      const usedCoords = new Set();
      for (const { text, boundingBox, isClickable } of visibleBoxes) {
        const adjustedX = boundingBox.x - viewportX;
        const adjustedY = boundingBox.y - viewportY;

        let termX = Math.floor(adjustedX * scaleX);
        let termY = Math.floor(adjustedY * scaleY);
        termX = Math.max(0, Math.min(termX, termWidth - text.length));
        termY = Math.max(0, Math.min(termY, termHeight - 1));

        let key = `${termX},${termY}`;
        while (usedCoords.has(key) && termY < termHeight - 1) {
          termY++;
          key = `${termX},${termY}`;
        }
        usedCoords.add(key);

        if (isClickable) {
          const clickable = clickableElements.find(el => el.text === text && el.boundingBox.x === boundingBox.x && el.boundingBox.y === boundingBox.y);
          if (clickable) {
            clickable.termX = termX + 1;
            clickable.termY = termY + 1;
            clickable.termWidth = text.length;
            clickable.termHeight = 1;
          }
        }

        terminal.moveTo(termX + 1, termY + 1);
        if (isClickable) {
          terminal.cyan.underline(text);
        } else {
          terminal(text);
        }
      }

      DEBUG && terminal.moveTo(1, termHeight).green('Text layout printed successfully!\n');
      terminal.moveTo(1, termHeight - 1).green('Click a link, scroll with mouse wheel, < for tabs, or Ctrl+C to exit.\n');
    } catch (error) {
      if (DEBUG) console.warn(error);
      terminal.red(`Error printing text layout: ${error.message}\n`);
    }
  };

  await refresh();

  terminal.on('mouse', async (event, data) => {
    if (!isListening) return;

    if (event === 'MOUSE_LEFT_BUTTON_PRESSED') {
      const { x: termX, y: termY } = data;
      const element = clickableElements.find(el => {
        return termX >= el.termX &&
               termX <= el.termX + el.termWidth &&
               termY >= el.termY &&
               termY <= el.termY + el.termHeight;
      });

      if (element) {
        terminal.yellow(`Clicking link: "${element.text}" at page coordinates (${element.clickX}, ${element.clickY})...\n`);
        try {
          await send('Input.dispatchMouseEvent', {
            type: 'mousePressed',
            x: element.clickX,
            y: element.clickY,
            button: 'left',
            clickCount: 1,
          }, sessionId);
          await send('Input.dispatchMouseEvent', {
            type: 'mouseReleased',
            x: element.clickX,
            y: element.clickY,
            button: 'left',
            clickCount: 1,
          }, sessionId);
          await refresh();
        } catch (error) {
          terminal.red(`Failed to click: ${error.message}\n`);
        }
      }
    } else if (event === 'MOUSE_WHEEL_UP' || event === 'MOUSE_WHEEL_DOWN') {
      const deltaY = event === 'MOUSE_WHEEL_UP' ? -scrollDelta : scrollDelta;
      try {
        await send('Input.dispatchMouseEvent', {
          type: 'mouseWheel',
          x: 0, // Position doesn’t matter for scrolling
          y: 0,
          deltaX: 0,
          deltaY: deltaY,
        }, sessionId);
        await refresh();
      } catch (error) {
        terminal.red(`Failed to scroll: ${error.message}\n`);
      }
    }
  });

  terminal.on('key', (name) => {
    if (!isListening) return;
    if (name === 'CTRL_C') {
      isListening = false;
      process.emit('SIGINT');
    }
  });

  return () => { isListening = false; };
}

async function getTerminalSize() {
  return { columns: terminal.width, rows: terminal.height };
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

  DEBUG && terminal.cyan('Fetching available tabs...\n');
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

  DEBUG && terminal.cyan(`Fetching WebSocket debugger URL from ${proxyBaseUrl}/json/version...\n`);
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
  DEBUG && terminal.cyan(`Connecting to WebSocket at ${wsDebuggerUrl}...\n`);
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
      DEBUG && logMessage('RECEIVE', message);
    } catch (error) {
      if (DEBUG) console.warn(error);
      DEBUG && logMessage('RECEIVE_ERROR', { raw: Buffer.isBuffer(data) ? data.toString('base64') : data, error: error.message });
      terminal.red(`Invalid message: ${String(data).slice(0, 50)}...\n`);
      return;
    }
    const key = `${message.sessionId || 'root'}:${message.id}`;
    if (message.id && Resolvers[key]) {
      Resolvers[key](message.result || message.error);
      delete Resolvers[key];
    } else {
      DEBUG && logMessage('UNHANDLED', message);
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
      DEBUG && logMessage('SEND', message);
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
  DEBUG && terminal.green('Connected to WebSocket\n');

  DEBUG && terminal.cyan('Fetching all targets...\n');
  const { targetInfos } = await send('Target.getTargets', {});
  const pageTarget = targetInfos.find(t => t.type === 'page' && t.url === selectedTarget.url);
  if (!pageTarget) {
    terminal.red('Could not find matching page target.\n');
    process.exit(1);
  }
  const finalTargetId = pageTarget.targetId;

  DEBUG && terminal.cyan(`Attaching to target ${finalTargetId}...\n`);
  const { sessionId } = await send('Target.attachToTarget', { targetId: finalTargetId, flatten: true });
  DEBUG && terminal.green(`Attached with session ${sessionId}\n`);

  return { send, sessionId };
}

(async () => {
  let socket;
  let cleanup;
  let targets; // Store tabs for navigation

  const selectTabAndRender = async (send, sessionId) => {
    if (cleanup) cleanup(); // Stop previous listeners

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
    const finalTargetId = selectedTarget.targetId;

    DEBUG && terminal.cyan(`Attaching to target ${finalTargetId}...\n`);
    const { sessionId: newSessionId } = await send('Target.attachToTarget', { targetId: finalTargetId, flatten: true });
    DEBUG && terminal.green(`Attached with session ${newSessionId}\n`);

    const stop = await printTextLayoutToTerminal({ send, sessionId: newSessionId });
    cleanup = stop;
  };

  try {
    terminal.cyan('Starting browser connection...\n');
    terminal.grabInput({ mouse: 'button' });
    const { send, sessionId, socket: wsSocket } = await connectToBrowser();
    socket = wsSocket;

    // Store targets for tab navigation
    const tabsResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json', 'Cookie': cookieHeader },
    });
    const tabsData = await tabsResponse.json();
    targets = (tabsData.tabs || []).filter(t => t.type === 'page' || t.type === 'tab');

    await selectTabAndRender(send, sessionId);

    terminal.on('key', async (name) => {
      if (name === 'CTRL_C') {
        process.emit('SIGINT');
      } else if (name === '<') {
        await selectTabAndRender(send, sessionId);
      }
    });

    process.on('SIGINT', () => {
      if (cleanup) cleanup();
      terminal.grabInput(false);
      terminal.clear();
      terminal.green('Exiting...\n');
      if (socket) socket.close();
      process.exit(0);
    });
  } catch (error) {
    if (cleanup) cleanup();
    if (DEBUG) console.warn(error);
    terminal.red(`Main error: ${error.message}\n`);
    process.exit(1);
  }
})();
