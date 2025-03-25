#!/usr/bin/env node

import { promisify } from 'util';
import { exec } from 'child_process';
import { WebSocket } from 'ws';
import { appendFileSync } from 'fs';
import { Agent } from 'https';
import TK from 'terminal-kit';

const { terminal } = TK;
const execAsync = promisify(exec);
const sleep = ms => new Promise(res => setTimeout(res, ms));

// Compression parameters (adjust these to experiment)
const HORIZONTAL_COMPRESSION = 1.0; // < 1 to compress, > 1 to expand
const VERTICAL_COMPRESSION = 1.0; // < 1 to compress, > 1 to expand
const LINE_SHIFT = 1; // 0 (same line), 1 (next line), 2 (two lines)
const DEBOUNCE_DELAY = 100; // Delay in milliseconds for debouncing scroll events
const CONFIG = {
  useTextByElementGrouping: true,  // Group text boxes by their parent HTML element
  useTextGestaltGrouping: false,   // Group by proximity (threshold-based)
  yThreshold: 10,                  // Vertical proximity threshold in pixels
  xThreshold: 50                   // Horizontal proximity threshold in pixels
};

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
    const parentIndex = nodeToParent.get(nodeIndex); // Add parentIndex for grouping
    const isClickable = nodeIndex !== undefined && isNodeClickable(nodeIndex);

    if (isClickable) {
      clickableElements.push({
        text,
        boundingBox,
        clickX: boundingBox.x + boundingBox.width / 2,
        clickY: boundingBox.y + boundingBox.height / 2,
      });
    }

    textLayoutBoxes.push({ text, boundingBox, isClickable, parentIndex });
    DEBUG && terminal.magenta(`Text Box ${i}: "${text}" at (${boundingBox.x}, ${boundingBox.y}) | parentIndex: ${parentIndex} | isClickable: ${isClickable}\n`);
  }

  return { textLayoutBoxes, clickableElements };
}

function groupBoxes(visibleBoxes, CONFIG) {
  let groups = [];
  const boxToGroup = new Map();

  if (CONFIG.useTextByElementGrouping) {
    // Group by parent HTML element
    const groupsMap = new Map(); // parentIndex -> array of boxes
    for (const box of visibleBoxes) {
      const groupKey = box.parentIndex !== undefined ? box.parentIndex : `individual_${visibleBoxes.indexOf(box)}`;
      if (!groupsMap.has(groupKey)) {
        groupsMap.set(groupKey, []);
      }
      groupsMap.get(groupKey).push(box);
    }
    groups = Array.from(groupsMap.values());
  } else if (CONFIG.useTextGestaltGrouping) {
    // Group by proximity
    const sortedBoxes = visibleBoxes.sort((a, b) => a.boundingBox.y - b.boundingBox.y || a.boundingBox.x - b.boundingBox.x);
    let currentGroup = [];
    let lastY = null;
    let lastX = null;
    for (const box of sortedBoxes) {
      if (!currentGroup.length) {
        currentGroup.push(box);
      } else {
        const yDiff = Math.abs(box.boundingBox.y - lastY);
        const xDiff = Math.abs(box.boundingBox.x - lastX);
        if (yDiff < CONFIG.yThreshold && xDiff < CONFIG.xThreshold) {
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
  } else {
    // No grouping: each box is its own group
    groups = visibleBoxes.map(box => [box]);
  }

  // Assign group IDs to boxes
  groups.forEach((group, groupId) => {
    group.forEach(box => boxToGroup.set(box, groupId));
  });

  debugLog(`Grouped ${visibleBoxes.length} boxes into ${groups.length} groups`);
  return { groups, boxToGroup };
}

async function printTextLayoutToTerminal({ send, sessionId, onTabSwitch }) {
  let clickableElements = [];
  let isListening = true;
  let scrollDelta = 50;
  let renderedBoxes = [];
  let currentScrollY = 0;

  const debugLog = (message) => {
    try {
      appendFileSync('debug-coords.log', `${new Date().toISOString()} - ${message}\n`);
    } catch (error) {
      console.error(`Failed to write to debug log: ${error.message}`);
    }
  };

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
      send('DOM.enable', {}, sessionId);
      send('DOMSnapshot.enable', {}, sessionId);
      DEBUG && terminal.cyan('Capturing snapshot...\n');

      const snapshot = await send('DOMSnapshot.captureSnapshot', { computedStyles: [], includeDOMRects: true }, sessionId);
      if (!snapshot?.documents?.length) throw new Error('No documents in snapshot');
      appendFileSync('snapshot.log', JSON.stringify({ snapshot }, null, 2));

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

      // Add terminal coordinates to boxes
      visibleBoxes.forEach(box => {
        const adjustedX = box.boundingBox.x - viewportX;
        const adjustedY = box.boundingBox.y - currentScrollY;
        box.termX = Math.ceil(adjustedX * scaleX); // 0-based initially
        box.termY = Math.ceil(adjustedY * scaleY); // 0-based initially
        box.termWidth = box.text.length;
        box.termHeight = 1;
      });

      // Group the boxes
      const { groups, boxToGroup } = groupBoxes(visibleBoxes, CONFIG);

      // Helper functions for de-confliction
      const boxOverlapsThisPosition = (box, col, row) => {
        return row === box.termY && col >= box.termX && col < box.termX + box.termWidth;
      };

      const boxHasLeftEdgeCrossingThisPosition = (box, col, row) => {
        return row === box.termY && col === box.termX;
      };

      const setDifference = (setA, setB) => {
        const diff = new Set(setA);
        for (const elem of setB) diff.delete(elem);
        return diff;
      };

      const moveGroupRightwardBy1Column = (groupId, groups) => {
        const group = groups[groupId];
        group.forEach(box => {
          box.termX += 1;
          debugLog(`Moved group ${groupId} box "${box.text}" right to termX=${box.termX}`);
        });
      };

      const selectMainGroup = (groupIds, groups, boxToGroup) => {
        return groupIds.reduce((minGroupId, groupId) => {
          const minBox = groups[minGroupId][0];
          const currBox = groups[groupId][0];
          const minOriginalX = minBox.termX - (minBox.shiftCount || 0);
          const currOriginalX = currBox.termX - (currBox.shiftCount || 0);
          return currOriginalX < minOriginalX ? groupId : minGroupId;
        });
      };

      // Pass 1: De-confliction by column walk (group-based)
      for (let c = 0; c < termWidth; c++) {
        for (let r = 0; r < termHeight; r++) {
          const currentBoxes = new Set();
          const newBoxes = new Set();

          for (const box of visibleBoxes) {
            if (boxOverlapsThisPosition(box, c, r)) {
              currentBoxes.add(box);
            }
            if (boxHasLeftEdgeCrossingThisPosition(box, c, r)) {
              newBoxes.add(box);
            }
          }

          const oldBoxes = setDifference(currentBoxes, newBoxes);
          if (oldBoxes.size > 1) {
            debugLog(`Warning: Multiple old boxes at (${c}, ${r}): ${oldBoxes.size}`);
          }

          if (oldBoxes.size >= 1) {
            const newGroupIds = new Set([...newBoxes].map(box => boxToGroup.get(box)));
            for (const groupId of newGroupIds) {
              moveGroupRightwardBy1Column(groupId, groups);
              groups[groupId].forEach(box => box.shiftCount = (box.shiftCount || 0) + 1);
            }
          }

          if (newBoxes.size > 1) {
            const newGroupIds = [...new Set([...newBoxes].map(box => boxToGroup.get(box)))];
            if (newGroupIds.length > 1) {
              const mainGroupId = selectMainGroup(newGroupIds, groups, boxToGroup);
              newGroupIds.splice(newGroupIds.indexOf(mainGroupId), 1);
              for (const groupId of newGroupIds) {
                moveGroupRightwardBy1Column(groupId, groups);
                groups[groupId].forEach(box => box.shiftCount = (box.shiftCount || 0) + 1);
              }
            }
          }
        }
      }

      // Pass 2: Apply gaps between groups on the same row
      const GAP_SIZE = 1;
      const groupsByRow = new Map();
      for (const group of groups) {
        const row = group[0].termY; // Assume all boxes in group share termY
        if (!groupsByRow.has(row)) {
          groupsByRow.set(row, []);
        }
        groupsByRow.get(row).push(group);
      }

      for (const [row, rowGroups] of groupsByRow) {
        rowGroups.sort((a, b) => a[0].termX - b[0].termX);
        for (let i = 1; i < rowGroups.length; i++) {
          const prevGroup = rowGroups[i - 1];
          const currGroup = rowGroups[i];
          const prevRight = Math.max(...prevGroup.map(box => box.termX + box.termWidth));
          const currLeft = Math.min(...currGroup.map(box => box.termX));
          let gap = 0;
          if (prevGroup.some(box => box.text.length > 1) || currGroup.some(box => box.text.length > 1)) {
            gap = GAP_SIZE;
          }
          const targetX = prevRight + gap;
          if (currLeft < targetX) {
            const shift = targetX - currLeft;
            currGroup.forEach(box => {
              box.termX += shift;
              debugLog(`Added gap for group box "${box.text}": shifted from ${box.termX - shift} to ${box.termX}`);
            });
          }
        }
      }

      // Pass 3: Render with wrapColumn to prevent overflow
      const usedCoords = new Set();
      renderedBoxes = [];

      for (const box of visibleBoxes) {
        const { text, boundingBox, isClickable, termX, termY } = box;
        const renderX = Math.max(1, termX + 1); // 1-based for terminal
        const renderY = Math.max(1, termY + 1);
        const key = `${renderX},${renderY}`;

        if (usedCoords.has(key)) continue;
        usedCoords.add(key);

        // Calculate available width from renderX to termWidth
        const availableWidth = Math.max(0, termWidth - renderX + 1); // +1 because renderX is 1-based

        // Set wrap column to prevent text from exceeding termWidth
        terminal.wrapColumn({ x: renderX, width: availableWidth });

        renderedBoxes.push({
          text,
          boundingBox,
          isClickable,
          termX: renderX,
          termY: renderY,
          termWidth: Math.min(text.length, availableWidth), // Reflect visible width
          termHeight: 1,
          viewportX,
          viewportY: currentScrollY,
        });

        if (isClickable) {
          const clickable = clickableElements.find(el => el.text === text && el.boundingBox.x === boundingBox.x && el.boundingBox.y === boundingBox.y);
          if (clickable) {
            clickable.termX = renderX;
            clickable.termY = renderY;
            clickable.termWidth = Math.min(text.length, availableWidth);
            clickable.termHeight = 1;
          }
        }

        debugLog(`Rendering "${text.substring(0, availableWidth)}": Page (${boundingBox.x}, ${boundingBox.y}), Terminal (${renderX}, ${renderY})`);
        terminal.moveTo(renderX, renderY);
        DEBUG && terminal.gray(`Drawing "${text}" at (${renderX}, ${renderY}) with width ${availableWidth}\n`);
        if (isClickable) {
          terminal.wrap.cyan.underline(text); // Use .wrap to enforce column width
        } else {
          terminal.wrap(text); // Use .wrap to enforce column width
        }
      }

      DEBUG && terminal.moveTo(1, termHeight).green('Text layout printed successfully!\n');
    } catch (error) {
      if (DEBUG) console.warn(error);
      terminal.red(`Error printing text layout: ${error.message}\n`);
    }
  };

  const debouncedRefresh = debounce(refresh, DEBOUNCE_DELAY);

  // [Unchanged event handlers remain the same]
  terminal.on('mouse', async (event, data) => {
    if (!isListening) return;

    if (event === 'MOUSE_LEFT_BUTTON_PRESSED') {
      const { x: termX, y: termY } = data;
      let clickedBox = null;
      for (let i = renderedBoxes.length - 1; i >= 0; i--) {
        const box = renderedBoxes[i];
        if (termX >= box.termX && termX <= box.termX + box.termWidth && termY >= box.termY && termY <= box.termY + box.termHeight) {
          clickedBox = box;
          break;
        }
      }
      if (clickedBox && clickedBox.isClickable) {
        terminal.yellow(`Clicked on "${clickedBox.text}" at TUI coordinates (${termX}, ${termY})...\n`);
        const relativeX = (termX - clickedBox.termX) / clickedBox.termWidth;
        const relativeY = (termY - clickedBox.termY) / clickedBox.termHeight;
        const guiX = clickedBox.boundingBox.x + relativeX * clickedBox.boundingBox.width;
        const guiY = clickedBox.boundingBox.y + relativeY * clickedBox.boundingBox.height;
        const clickX = guiX + clickedBox.viewportX;
        const clickY = guiY + clickedBox.viewportY;
        debugLog(`Transmitting click to GUI coordinates (${clickX}, ${clickY})...`);
        send('Input.dispatchMouseEvent', { type: 'mousePressed', x: clickX, y: clickY, button: 'left', clickCount: 1 }, sessionId);
        send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: clickX, y: clickY, button: 'left', clickCount: 1 }, sessionId);
        await refresh();
      } else {
        terminal.yellow(`No clickable element found at TUI coordinates (${termX}, ${termY}).\n`);
      }
    } else if (event === 'MOUSE_WHEEL_UP' || event === 'MOUSE_WHEEL_DOWN') {
      const deltaY = event === 'MOUSE_WHEEL_UP' ? -scrollDelta : scrollDelta;
      if (event === 'MOUSE_WHEEL_UP' && currentScrollY <= 0) {
        debugLog(`Ignoring upward scroll: already at top (scrollOffsetY=${currentScrollY})`);
        return;
      }
      send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 0, y: 0, deltaX: 0, deltaY }, sessionId);
      debouncedRefresh();
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

function debugLog(message) {
  try {
    appendFileSync('debug-coords.log', `${new Date().toISOString()} - ${message}\n`);
  } catch (error) {
    console.error(`Failed to write to debug log: ${error.message}`);
  }
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
