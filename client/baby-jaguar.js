#!/usr/bin/env node

import { promisify } from 'util';
import { exec } from 'child_process';
import { WebSocket } from 'ws';
import { appendFileSync } from 'fs';
import { Agent } from 'https';
import TK from 'terminal-kit';
const { terminal } = TK;

// Compression parameters (adjust these to experiment)
const HORIZONTAL_COMPRESSION = 1.0; // < 1 to compress, > 1 to expand
const VERTICAL_COMPRESSION = 1.0; // < 1 to compress, > 1 to expand
const LINE_SHIFT = 1; // 0 (same line), 1 (next line), 2 (two lines)
const DEBOUNCE_DELAY = 100; // Delay in milliseconds for debouncing scroll events

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
    terminal.magenta(`[${timestamp}] ${direction}: `);
    terminal(JSON.stringify(message, null, 2) + '\n');
  } catch (error) {
    console.error(`Failed to write to log file: ${error.message}`);
  }
}

function extractTextLayoutBoxes(snapshot) {
  const textLayoutBoxes = [];
  const clickableElements = [];
  const strings = snapshot.strings;
  const document = snapshot.documents[0];
  const textBoxes = document.textBoxes;
  const layout = document.layout;
  const nodes = document.nodes;

  if (!textBoxes || !textBoxes.bounds || !textBoxes.start || !textBoxes.length) {
    terminal.yellow('No text boxes found in snapshot.\n');
    return { textLayoutBoxes, clickableElements };
  }

  terminal.cyan(`Found ${textBoxes.layoutIndex.length} text boxes in snapshot.\n`);

  const layoutToNode = new Map();
  layout.nodeIndex.forEach((nodeIdx, layoutIdx) => layoutToNode.set(layoutIdx, nodeIdx));

  const nodeToParent = new Map();
  nodes.parentIndex.forEach((parentIdx, nodeIdx) => nodeToParent.set(nodeIdx, parentIdx));

  const clickableIndexes = new Set(nodes.isClickable?.index || []);
  DEBUG && terminal.blue(`Clickable Indexes: ${JSON.stringify([...clickableIndexes])}\n`);

  function isNodeClickable(nodeIndex) {
    let currentIndex = nodeIndex;
    while (currentIndex !== -1) {
      if (clickableIndexes.has(currentIndex)) return true;
      currentIndex = nodeToParent.get(currentIndex);
    }
    return false;
  }

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

    const nodeIndex = layoutToNode.get(layoutIndex);
    const isClickable = nodeIndex !== undefined && isNodeClickable(nodeIndex);

    if (isClickable) {
      clickableElements.push({
        text,
        boundingBox,
        clickX: boundingBox.x + boundingBox.width / 2,
        clickY: boundingBox.y + boundingBox.height / 2,
      });
    }

    textLayoutBoxes.push({ text, boundingBox, isClickable });
    DEBUG && terminal.magenta(`Text Box ${i}: "${text}" at (${boundingBox.x}, ${boundingBox.y}) | nodeIndex: ${nodeIndex} | isClickable: ${isClickable}\n`);
  }

  return { textLayoutBoxes, clickableElements };
}

async function printTextLayoutToTerminal({ send, sessionId, onTabSwitch }) {
  let clickableElements = [];
  let isListening = true;
  let scrollDelta = 50; // Pixels to scroll per wheel event
  let renderedBoxes = []; // Store rendered boxes with TUI coordinates
  let currentScrollY = 0; // Track the current scroll position

  const debugLog = (message) => {
    try {
      appendFileSync('debug-coords.log', `${new Date().toISOString()} - ${message}\n`);
    } catch (error) {
      console.error(`Failed to write to debug log: ${error.message}`);
    }
  };

  // Debounce utility function
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

const refresh = async () => {
  try {
    DEBUG && terminal.cyan('Enabling DOM and snapshot domains...\n');
    await send('DOM.enable', {}, sessionId);
    await send('DOMSnapshot.enable', {}, sessionId);
    DEBUG && terminal.cyan('Capturing snapshot...\n');

    const snapshot = await send('DOMSnapshot.captureSnapshot', { computedStyles: [], includeDOMRects: true }, sessionId);
    if (!snapshot?.documents?.length) throw new Error('No documents in snapshot');

    const layoutMetrics = await send('Page.getLayoutMetrics', {}, sessionId);
    const viewport = layoutMetrics.visualViewport;
    const document = snapshot.documents[0];
    const viewportWidth = viewport.clientWidth;
    const viewportHeight = viewport.clientHeight;
    const viewportX = document.scrollOffsetX;
    currentScrollY = document.scrollOffsetY;

    const { textLayoutBoxes, clickableElements: newClickables } = extractTextLayoutBoxes(snapshot);
    clickableElements = newClickables;
    if (!textLayoutBoxes.length) {
      terminal.yellow('No text boxes found.\n');
      return;
    }

    const { columns: termWidth, rows: termHeight } = await getTerminalSize();
    DEBUG && terminal.blue(`Terminal size: ${termWidth}x${termHeight}\n`);
    debugLog(`Terminal size: ${termWidth}x${termHeight}`);

    debugLog(`Viewport dimensions: ${viewportWidth}x${viewportHeight}`);

    const baseScaleX = termWidth / viewportWidth;
    const baseScaleY = termHeight / viewportHeight;
    const scaleX = baseScaleX * HORIZONTAL_COMPRESSION;
    const scaleY = baseScaleY * VERTICAL_COMPRESSION;

    const visibleBoxes = textLayoutBoxes.filter(box => {
      const boxX = box.boundingBox.x;
      const boxY = box.boundingBox.y;
      const boxRight = boxX + box.boundingBox.width;
      const boxBottom = boxY + box.boundingBox.height;
      const viewportLeft = viewportX;
      const viewportRight = viewportX + viewportWidth;
      const viewportTop = currentScrollY;
      const viewportBottom = currentScrollY + viewportHeight;
      return boxX < viewportRight && boxRight > viewportLeft && boxY < viewportBottom && boxBottom > viewportTop;
    });

    terminal.clear();
    terminal.moveTo(1, 1);
    DEBUG && terminal.cyan(`Rendering ${visibleBoxes.length} visible text boxes (viewport: ${viewportWidth}x${viewportHeight} at ${viewportX},${currentScrollY})...\n`);

    // Step 1: Sort boxes by y, then x
    const sortedBoxes = visibleBoxes.sort((a, b) => a.boundingBox.y - b.boundingBox.y || a.boundingBox.x - b.boundingBox.x);

    // Step 2: Group boxes into "blocks" based on proximity
    const groups = [];
    let currentGroup = [];
    let lastY = null;
    let lastX = null;
    const yThreshold = 10; // Vertical proximity threshold
    const xThreshold = 50; // Horizontal proximity threshold (adjust as needed)

    for (const box of sortedBoxes) {
      if (!currentGroup.length) {
        currentGroup.push(box);
      } else {
        const yDiff = Math.abs(box.boundingBox.y - lastY);
        const xDiff = Math.abs(box.boundingBox.x - lastX);
        // Group boxes that are close in both x and y (likely part of the same block, e.g., a title)
        if (yDiff < yThreshold && xDiff < xThreshold) {
          currentGroup.push(box);
        } else {
          groups.push(currentGroup);
          currentGroup = [box];
        }
      }
      lastY = box.boundingBox.y;
      lastX = box.boundingBox.x;
    }
    if (currentGroup.length) groups.push(currentGroup);

    // Step 3: Calculate minimum termX for each group and sort groups by topmost y
    const groupsWithMinX = groups.map(group => {
      const minX = Math.min(...group.map(box => box.boundingBox.x));
      const minTermX = Math.max(1, Math.ceil((minX - viewportX) * scaleX));
      const topY = Math.min(...group.map(box => box.boundingBox.y));
      return { group, minTermX, topY };
    }).sort((a, b) => a.topY - b.topY);

    // Step 4: Render groups in a flow layout with minimum X constraint
    renderedBoxes = [];
    let currentY = 1;
    let currentX = 1;

    for (const { group, minTermX } of groupsWithMinX) {
      // Calculate the total width of the group (including spaces between boxes)
      let groupWidth = 0;
      for (const box of group) {
        groupWidth += box.text.length;
        if (group.indexOf(box) < group.length - 1) groupWidth += 1; // Space between boxes
      }

      // Check if the group fits on the current line starting at minTermX
      if (currentX < minTermX) {
        currentX = minTermX; // Move to the minimum X position
      }

      if (currentX + groupWidth - 1 <= termWidth) {
        // Group fits on the current line
        for (const box of group) {
          terminal.moveTo(currentX, currentY);
          if (box.isClickable) {
            terminal.cyan.underline(box.text);
          } else {
            terminal(box.text);
          }

          renderedBoxes.push({
            text: box.text,
            boundingBox: box.boundingBox,
            isClickable: box.isClickable,
            termX: currentX,
            termY: currentY,
            termWidth: box.text.length,
            termHeight: 1,
            viewportX,
            viewportY: currentScrollY,
          });

          if (box.isClickable) {
            const clickable = clickableElements.find(el => el.text === box.text && el.boundingBox.x === box.boundingBox.x && el.boundingBox.y === box.boundingBox.y);
            if (clickable) {
              clickable.termX = currentX;
              clickable.termY = currentY;
              clickable.termWidth = box.text.length;
              clickable.termHeight = 1;
            }
          }

          currentX += box.text.length + 1; // Move right, add space
        }
      } else {
        // Group doesn’t fit; move to the next line and start at minTermX
        currentY++;
        if (currentY >= termHeight) break;
        currentX = minTermX;

        for (const box of group) {
          terminal.moveTo(currentX, currentY);
          if (box.isClickable) {
            terminal.cyan.underline(box.text);
          } else {
            terminal(box.text);
          }

          renderedBoxes.push({
            text: box.text,
            boundingBox: box.boundingBox,
            isClickable: box.isClickable,
            termX: currentX,
            termY: currentY,
            termWidth: box.text.length,
            termHeight: 1,
            viewportX,
            viewportY: currentScrollY,
          });

          if (box.isClickable) {
            const clickable = clickableElements.find(el => el.text === box.text && el.boundingBox.x === box.boundingBox.x && el.boundingBox.y === box.boundingBox.y);
            if (clickable) {
              clickable.termX = currentX;
              clickable.termY = currentY;
              clickable.termWidth = box.text.length;
              clickable.termHeight = 1;
            }
          }

          currentX += box.text.length + 1;
        }
      }

      // After placing the group, move to the next line for the next group
      currentY++;
      if (currentY >= termHeight) break;
      currentX = 1; // Reset X for the next group
    }

    DEBUG && terminal.moveTo(1, termHeight).green('Text layout printed successfully!\n');
    terminal.moveTo(1, termHeight - 1).green('Click a link, scroll with mouse wheel, < for tabs, Ctrl+C to exit.\n');
  } catch (error) {
    if (DEBUG) console.warn(error);
    terminal.red(`Error printing text layout: ${error.message}\n`);
  }
};
  // Create a debounced version of the refresh function
  const debouncedRefresh = debounce(refresh, DEBOUNCE_DELAY);

  terminal.on('mouse', async (event, data) => {
    if (!isListening) return;

    if (event === 'MOUSE_LEFT_BUTTON_PRESSED') {
      const { x: termX, y: termY } = data;

      // Find the topmost textbox that contains the clicked coordinates
      let clickedBox = null;
      for (let i = renderedBoxes.length - 1; i >= 0; i--) { // Iterate in reverse for stacking order
        const box = renderedBoxes[i];
        if (termX >= box.termX &&
            termX <= box.termX + box.termWidth &&
            termY >= box.termY &&
            termY <= box.termY + box.termHeight) {
          clickedBox = box;
          break;
        }
      }

      if (clickedBox && clickedBox.isClickable) {
        terminal.yellow(`Clicked on "${clickedBox.text}" at TUI coordinates (${termX}, ${termY})...\n`);

        // Calculate the relative position within the textbox (e.g., southwest corner)
        const relativeX = (termX - clickedBox.termX) / clickedBox.termWidth; // 0 (left) to 1 (right)
        const relativeY = (termY - clickedBox.termY) / clickedBox.termHeight; // 0 (top) to 1 (bottom)

        // Map the relative position to GUI coordinates within the boundingBox
        const guiX = clickedBox.boundingBox.x + relativeX * clickedBox.boundingBox.width;
        const guiY = clickedBox.boundingBox.y + relativeY * clickedBox.boundingBox.height;

        // Adjust for viewport scroll position
        const clickX = guiX + clickedBox.viewportX;
        const clickY = guiY + clickedBox.viewportY;

        debugLog(`Transmitting click to GUI coordinates (${clickX}, ${clickY})...`);

        try {
          await send('Input.dispatchMouseEvent', {
            type: 'mousePressed',
            x: clickX,
            y: clickY,
            button: 'left',
            clickCount: 1,
          }, sessionId);
          await send('Input.dispatchMouseEvent', {
            type: 'mouseReleased',
            x: clickX,
            y: clickY,
            button: 'left',
            clickCount: 1,
          }, sessionId);
          await refresh(); // Immediate refresh on click
        } catch (error) {
          terminal.red(`Failed to click: ${error.message}\n`);
        }
      } else {
        terminal.yellow(`No clickable element found at TUI coordinates (${termX}, ${termY}).\n`);
      }
    } else if (event === 'MOUSE_WHEEL_UP' || event === 'MOUSE_WHEEL_DOWN') {
      const deltaY = event === 'MOUSE_WHEEL_UP' ? -scrollDelta : scrollDelta;

      // Prevent scrolling into terminal history if already at the top
      if (event === 'MOUSE_WHEEL_UP' && currentScrollY <= 0) {
        debugLog(`Ignoring upward scroll: already at top (scrollOffsetY=${currentScrollY})`);
        return;
      }

      try {
        await send('Input.dispatchMouseEvent', {
          type: 'mouseWheel',
          x: 0,
          y: 0,
          deltaX: 0,
          deltaY: deltaY,
        }, sessionId);
        debouncedRefresh(); // Debounced refresh on scroll
      } catch (error) {
        terminal.red(`Failed to scroll: ${error.message}\n`);
      }
    }
  });

  terminal.on('key', async (name) => {
    if (!isListening) return;
    if (name === 'CTRL_C') {
      isListening = false;
      process.emit('SIGINT');
    } else if (name === '<') {
      isListening = false;
      if (onTabSwitch) onTabSwitch();
    }
  });

  await refresh();

  return () => { isListening = false; };
}

async function getTerminalSize() {
  const size = { columns: terminal.width, rows: terminal.height };
  if (!size.columns || !size.rows) {
    // Fallback in case terminal size isn't detected
    return { columns: 80, rows: 24 };
  }
  return size;
}

async function connectToBrowser() {
  let cookieHeader;
  let cookieValue;
  let targets;

  terminal.cyan('Authenticating to set session cookie...\n');
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

    const timeout = setTimeout(() => {
      delete Resolvers[key];
      reject(new Error(`Timeout waiting for response to ${method} (id: ${message.id})`));
    }, 10000);

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

  return { send, socket, targets, cookieHeader };
}

(async () => {
  let socket;
  let cleanup;
  let targets;
  let cookieHeader;
  let send;

  const selectTabAndRender = async () => {
    if (cleanup) cleanup();

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

    DEBUG && terminal.cyan(`Attaching to target ${targetId}...\n`);
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
    DEBUG && terminal.green(`Attached with session ${sessionId}\n`);

    const stop = await printTextLayoutToTerminal({ send, sessionId, onTabSwitch: selectTabAndRender });
    cleanup = stop;
  };

  try {
    terminal.cyan('Starting browser connection...\n');
    terminal.grabInput({ mouse: 'button' });
    const connection = await connectToBrowser();
    send = connection.send;
    socket = connection.socket;
    targets = connection.targets;
    cookieHeader = connection.cookieHeader;

    await selectTabAndRender();

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
