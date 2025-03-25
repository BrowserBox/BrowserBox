#!/usr/bin/env node

// CyberJaguar - BrowserBox TUI Browser Application
import { WebSocket } from 'ws';
import { appendFileSync } from 'fs';
import { Agent } from 'https';
import TK from 'terminal-kit';
import TerminalBrowser from './terminal-browser.js';

const { terminal } = TK;

// One-liners
const sleep = ms => new Promise(res => setTimeout(res, ms));

// Constants
const BrowserState = {
  targets: [],
  activeTarget: null,
  selectedTabIndex: 0,
};
const HORIZONTAL_COMPRESSION = 1.0;
const VERTICAL_COMPRESSION = 1.0;
const DEBOUNCE_DELAY = 100;
const DEBUG = process.env.JAGUAR_DEBUG === 'true' || false;
const LOG_FILE = 'cdp-log.txt';
const args = process.argv.slice(2);
const CONFIG = {
  useTextByElementGrouping: true,
  useTextGestaltGrouping: false,
  yThreshold: 10,
  xThreshold: 50,
  GAP_SIZE: 1,
};

// Arg processing
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

// Main logic
let socket;
let cleanup;
let targets;
let cookieHeader;
let send;
let browser;
let sessionId;

const selectTabAndRender = async () => {
  if (cleanup) cleanup();

  const selectedTarget = targets[browser.selectedTabIndex];
  const targetId = selectedTarget.targetId;
  BrowserState.activeTarget = selectedTarget;
  BrowserState.selectedTabIndex = browser.selectedTabIndex;

  DEBUG && terminal.cyan(`Attaching to target ${targetId}...\n`);
  const { sessionId: newSessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  sessionId = newSessionId; // Update global sessionId
  DEBUG && terminal.green(`Attached with session ${sessionId}\n`);

  const stop = await printTextLayoutToTerminal({ send, sessionId, onTabSwitch: selectTabAndRender });
  cleanup = stop;
};

(async () => {
  try {
    terminal.cyan('Starting browser connection...\n');
    const connection = await connectToBrowser();
    send = connection.send;
    socket = connection.socket;
    targets = connection.targets;
    cookieHeader = connection.cookieHeader;
    BrowserState.targets = targets;

    // Initialize TerminalBrowser with fetched tabs
    browser = new TerminalBrowser({
      tabWidth: Math.round(Math.max(15, terminal.width / 3)),
      initialTabs: targets.map(t => ({
        title: t.title || new URL(t.url || 'about:blank').hostname,
        url: t.url || 'about:blank',
      })),
    });

    // Sync browser state with events
    browser.on('tabSelected', async (tab) => {
      const index = browser.getTabs().findIndex(t => t.title === tab.title && t.url === tab.url);
      browser.selectedTabIndex = index; // Sync widget's selectedTabIndex
      BrowserState.selectedTabIndex = index;
      BrowserState.activeTarget = targets[index];
      browser.setAddress(tab.url);
      await selectTabAndRender();
    });

    browser.on('navigate', async (url) => {
      const normalizedUrl = normalizeUrl(url);
      DEBUG && terminal.cyan(`Navigating to: ${normalizedUrl}\n`);
      try {
        await send('Page.navigate', { url: normalizedUrl }, sessionId);
        await refreshTerminal({ send, sessionId, state: initializeState() });
      } catch (err) {
        terminal.red(`Navigation failed: ${err.message}\n`);
      }
    });

    browser.on('back', async () => {
      try {
        await send('Page.goBack', {}, sessionId);
        await refreshTerminal({ send, sessionId, state: initializeState() });
      } catch (err) {
        terminal.red(`Back navigation failed: ${err.message}\n`);
      }
    });

    browser.on('forward', async () => {
      try {
        await send('Page.goForward', {}, sessionId);
        await refreshTerminal({ send, sessionId, state: initializeState() });
      } catch (err) {
        terminal.red(`Forward navigation failed: ${err.message}\n`);
      }
    });

    browser.on('tabAdded', async (tab) => {
      terminal.yellow('New tab creation not fully implemented. Using blank tab.\n');
      const newTarget = { title: tab.title, url: tab.url, targetId: `temp-${Date.now()}` };
      targets.push(newTarget);
      BrowserState.targets = targets;
      browser.setTab(browser.getTabs().length - 1, { title: tab.title, url: tab.url });
    });

    await selectTabAndRender();

    process.on('SIGINT', () => {
      if (cleanup) cleanup();
      browser.destroy();
      if (socket) socket.close();
      process.exit(0);
    });
  } catch (error) {
    if (cleanup) cleanup();
    if (DEBUG) console.warn(error);
    terminal.red(`Main error: ${error.message}\n`);
    browser?.destroy();
    process.exit(1);
  }
})();

// Helpers
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

function initializeState() {
  return {
    clickableElements: [],
    isListening: true,
    scrollDelta: 50,
    renderedBoxes: [],
    currentScrollY: 0,
    clickCounter: { value: 0 },
    layoutToNode: null,
    nodeToParent: null,
    nodes: null,
    isInitialized: false,
  };
}

async function fetchSnapshot({ send, sessionId }) {
  DEBUG && terminal.cyan('Enabling DOM and snapshot domains...\n');
  await Promise.all([
    send('DOM.enable', {}, sessionId),
    send('DOMSnapshot.enable', {}, sessionId),
  ]);

  DEBUG && terminal.cyan('Capturing snapshot...\n');
  const snapshot = await send('DOMSnapshot.captureSnapshot', { computedStyles: [], includeDOMRects: true }, sessionId);
  if (!snapshot?.documents?.length) throw new Error('No documents in snapshot');
  DEBUG && appendFileSync('snapshot.log', JSON.stringify({ snapshot }, null, 2));

  const layoutMetrics = await send('Page.getLayoutMetrics', {}, sessionId);
  const viewport = layoutMetrics.visualViewport;
  const document = snapshot.documents[0];

  return {
    snapshot,
    viewportWidth: viewport.clientWidth,
    viewportHeight: viewport.clientHeight,
    viewportX: document.scrollOffsetX,
    viewportY: document.scrollOffsetY,
  };
}

async function prepareLayoutState({ snapshot, viewportWidth, viewportHeight, viewportX, viewportY }) {
  const { textLayoutBoxes, clickableElements, layoutToNode, nodeToParent, nodes } = extractTextLayoutBoxes(snapshot);
  if (!textLayoutBoxes.length) {
    DEBUG && terminal.yellow('No text boxes found.\n');
    return null;
  }

  const { columns: termWidth, rows: termHeight } = await getTerminalSize();
  DEBUG && terminal.blue(`Terminal size: ${termWidth}x${termHeight}\n`);

  const baseScaleX = termWidth / viewportWidth;
  const baseScaleY = (termHeight - 4) / viewportHeight; // Reserve 4 rows for TerminalBrowser
  const scaleX = baseScaleX * HORIZONTAL_COMPRESSION;
  const scaleY = baseScaleY * VERTICAL_COMPRESSION;

  const visibleBoxes = textLayoutBoxes.filter(box => {
    const boxX = box.boundingBox.x;
    const boxY = box.boundingBox.y;
    const boxRight = boxX + box.boundingBox.width;
    const boxBottom = boxY + box.boundingBox.height;
    const viewportLeft = viewportX;
    const viewportRight = viewportX + viewportWidth;
    const viewportTop = viewportY;
    const viewportBottom = viewportY + viewportHeight;
    return boxX < viewportRight && boxRight > viewportLeft && boxY < viewportBottom && boxBottom > viewportTop;
  });

  visibleBoxes.forEach(box => {
    const adjustedX = box.boundingBox.x - viewportX;
    const adjustedY = box.boundingBox.y - viewportY;
    box.termX = Math.ceil(adjustedX * scaleX);
    box.termY = Math.ceil(adjustedY * scaleY) + 4; // Shift down 4 rows for UI
    box.termWidth = box.text.length;
    box.termHeight = 1;
  });

  const { groups, boxToGroup } = groupBoxes(visibleBoxes);

  return {
    visibleBoxes,
    groups,
    boxToGroup,
    termWidth,
    termHeight: termHeight - 4,
    viewportX,
    viewportY,
    viewportWidth,
    viewportHeight,
    clickableElements,
    layoutToNode,
    nodeToParent,
    nodes,
  };
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

  DEBUG && terminal.cyan(`Found ${textBoxes.layoutIndex.length} text boxes in snapshot.\n`);

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

    if (layoutIndex === -1 || !bounds || start === -1 || length === -1) continue;

    const textIndex = layout.text[layoutIndex];
    if (textIndex === -1 || textIndex >= strings.length) continue;

    const fullText = strings[textIndex];
    const text = fullText.substring(start, start + length).trim();
    if (!text) continue;

    const boundingBox = {
      x: bounds[0],
      y: bounds[1],
      width: bounds[2],
      height: bounds[3],
    };

    const nodeIndex = layoutToNode.get(layoutIndex);
    const parentIndex = nodeToParent.get(nodeIndex);
    const backendNodeId = nodes.backendNodeId[nodeIndex];
    const isClickable = nodeIndex !== undefined && isNodeClickable(nodeIndex);
    const ancestorType = getAncestorInfo(nodeIndex, nodes, strings);

    if (isClickable) {
      clickableElements.push({
        text,
        boundingBox,
        clickX: boundingBox.x + boundingBox.width / 2,
        clickY: boundingBox.y + boundingBox.height / 2,
      });
    }

    textLayoutBoxes.push({ text, boundingBox, isClickable, parentIndex, ancestorType, backendNodeId, layoutIndex, nodeIndex });
  }

  return { textLayoutBoxes, clickableElements, layoutToNode, nodeToParent, nodes };
}

function getAncestorInfo(nodeIndex, nodes, strings) {
  let currentIndex = nodeIndex;
  let path = [];
  while (currentIndex !== -1) {
    if (typeof currentIndex !== 'number' || currentIndex < 0 || currentIndex >= nodes.nodeName.length) return 'normal';
    const nodeNameIndex = nodes.nodeName[currentIndex];
    if (typeof nodeNameIndex === 'undefined') return 'normal';
    const nodeName = strings[nodeNameIndex];
    const attributes = nodes.attributes[currentIndex] || [];
    const isClickable = nodes.isClickable && nodes.isClickable.index.includes(currentIndex);
    path.push(`${currentIndex}:${nodeName}${isClickable ? '(clickable)' : ''}`);

    if (nodeName === 'BUTTON' || (nodeName === 'INPUT' && attributes.some((idx, i) => i % 2 === 0 && strings[idx] === 'type' && strings[attributes[i + 1]] === 'button'))) {
      return 'button';
    }

    let hasHref = false;
    let hasOnclick = false;
    for (let i = 0; i < attributes.length; i += 2) {
      const keyIndex = attributes[i];
      const valueIndex = attributes[i + 1];
      const key = strings[keyIndex];
      if (key === 'href') hasHref = true;
      if (key === 'onclick') hasOnclick = true;
    }
    if (nodeName === 'A' && (hasHref || hasOnclick)) return 'hyperlink';
    if (isClickable) return 'other_clickable';

    currentIndex = nodeToParent.get(currentIndex);
  }
  return 'normal';
}

async function pollForSnapshot({ send, sessionId, maxAttempts = 4, interval = 1000 }) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const { snapshot, viewportWidth, viewportHeight, viewportX, viewportY } = await fetchSnapshot({ send, sessionId });
    const { textLayoutBoxes } = extractTextLayoutBoxes(snapshot);
    if (textLayoutBoxes.length > 0) {
      return { snapshot, viewportWidth, viewportHeight, viewportX, viewportY };
    }
    DEBUG && terminal.yellow(`Attempt ${attempt}: Found 0 text boxes, retrying in ${interval}ms...\n`);
    await sleep(interval);
  }
  DEBUG && terminal.yellow(`Max attempts reached, proceeding with last snapshot.\n`);
  return await fetchSnapshot({ send, sessionId });
}

function normalizeUrl(input) {
  const trimmedInput = input.trim();
  const urlPattern = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/i;
  if (urlPattern.test(trimmedInput)) {
    if (!/^https?:\/\//i.test(trimmedInput)) {
      return `https://${trimmedInput}`;
    }
    return trimmedInput;
  }
  const query = encodeURIComponent(trimmedInput);
  return `https://duckduckgo.com/?q=${query}`;
}

async function refreshTerminal({ send, sessionId, state }) {
  try {
    const { snapshot, viewportWidth, viewportHeight, viewportX, viewportY } = await pollForSnapshot({ send, sessionId });
    state.currentScrollY = viewportY;
    const layoutState = await prepareLayoutState({ snapshot, viewportWidth, viewportHeight, viewportX, viewportY });

    terminal.clear();
    browser.render(); // Redraw the TerminalBrowser UI

    if (layoutState) {
      state.clickableElements = layoutState.clickableElements;
      state.layoutToNode = layoutState.layoutToNode;
      state.nodeToParent = layoutState.nodeToParent;
      state.nodes = layoutState.nodes;

      deconflictGroups(layoutState);
      applyGaps(layoutState);
      renderLayout({ layoutState, renderedBoxes: state.renderedBoxes });

      state.isInitialized = true;
      DEBUG && terminal.cyan(`Found ${layoutState.visibleBoxes.length} visible text boxes.\n`);
    } else {
      DEBUG && terminal.yellow('No text boxes found after polling.\n');
    }
  } catch (error) {
    if (DEBUG) console.warn(error);
    terminal.red(`Error printing text layout: ${error.message}\n`);
  }
}

function renderLayout({ layoutState, renderedBoxes }) {
  if (!layoutState) return;
  renderBoxes({ ...layoutState, renderedBoxes });
}

function renderBoxes(layoutState) {
  const { visibleBoxes, termWidth, termHeight, viewportX, viewportY, clickableElements, renderedBoxes } = layoutState;
  const usedCoords = new Set();

  renderedBoxes.length = 0;

  for (const box of visibleBoxes) {
    const { text, boundingBox, isClickable, termX, termY, ancestorType, backendNodeId, layoutIndex, nodeIndex } = box;
    const renderX = Math.max(1, termX + 1);
    const renderY = Math.max(1, termY + 1);
    const key = `${renderX},${renderY}`;

    if (renderX > termWidth) continue;
    if (usedCoords.has(key)) continue;
    usedCoords.add(key);

    const availableWidth = Math.max(0, termWidth - renderX + 1);
    const displayText = text.substring(0, availableWidth);

    const renderedBox = {
      text,
      boundingBox,
      isClickable,
      termX: renderX,
      termY: renderY,
      termWidth: displayText.length,
      termHeight: 1,
      viewportX,
      viewportY,
      viewportWidth: layoutState.viewportWidth,
      viewportHeight: layoutState.viewportHeight,
      backendNodeId,
      layoutIndex,
      nodeIndex,
    };
    renderedBoxes.push(renderedBox);

    if (isClickable) {
      const clickable = clickableElements.find(el => el.text === text && el.boundingBox.x === boundingBox.x && el.boundingBox.y === boundingBox.y);
      if (clickable) {
        clickable.termX = renderX;
        clickable.termY = renderY;
        clickable.termWidth = displayText.length;
        clickable.termHeight = 1;
      }
    }

    terminal.moveTo(renderX, renderY);
    switch (ancestorType) {
      case 'hyperlink':
        terminal.cyan.underline(displayText);
        break;
      case 'button':
        terminal.bgGreen.black(displayText);
        break;
      case 'other_clickable':
        terminal.bold(displayText);
        break;
      default:
        terminal(displayText);
    }
  }
}

function deconflictGroups(layoutState) {
  const { visibleBoxes, groups, boxToGroup, termWidth, termHeight } = layoutState;

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

  const moveGroupRightwardBy1Column = (groupId) => {
    const group = groups[groupId];
    group.forEach(box => box.termX += 1);
  };

  const selectMainGroup = (groupIds) => {
    return groupIds.reduce((minGroupId, groupId) => {
      const minBox = groups[minGroupId][0];
      const currBox = groups[groupId][0];
      const minOriginalX = minBox.termX - (minBox.shiftCount || 0);
      const currOriginalX = currBox.termX - (currBox.shiftCount || 0);
      return currOriginalX < minOriginalX ? groupId : minGroupId;
    });
  };

  for (let c = 0; c < termWidth; c++) {
    for (let r = 0; r < termHeight; r++) {
      const currentBoxes = new Set();
      const newBoxes = new Set();

      for (const box of visibleBoxes) {
        if (boxOverlapsThisPosition(box, c, r)) currentBoxes.add(box);
        if (boxHasLeftEdgeCrossingThisPosition(box, c, r)) newBoxes.add(box);
      }

      const oldBoxes = setDifference(currentBoxes, newBoxes);
      if (oldBoxes.size >= 1) {
        const newGroupIds = new Set([...newBoxes].map(box => boxToGroup.get(box)));
        for (const groupId of newGroupIds) {
          moveGroupRightwardBy1Column(groupId);
          groups[groupId].forEach(box => box.shiftCount = (box.shiftCount || 0) + 1);
        }
      }

      if (newBoxes.size > 1) {
        const newGroupIds = [...new Set([...newBoxes].map(box => boxToGroup.get(box)))];
        if (newGroupIds.length > 1) {
          const mainGroupId = selectMainGroup(newGroupIds);
          newGroupIds.splice(newGroupIds.indexOf(mainGroupId), 1);
          for (const groupId of newGroupIds) {
            moveGroupRightwardBy1Column(groupId);
            groups[groupId].forEach(box => box.shiftCount = (box.shiftCount || 0) + 1);
          }
        }
      }
    }
  }
}

function applyGaps(layoutState) {
  const { groups } = layoutState;
  const groupsByRow = new Map();

  for (const group of groups) {
    const row = group[0].termY;
    if (!groupsByRow.has(row)) groupsByRow.set(row, []);
    groupsByRow.get(row).push(group);
  }

  for (const [row, rowGroups] of groupsByRow) {
    rowGroups.sort((a, b) => a[0].termX - b[0].termX);
    for (let i = 1; i < rowGroups.length; i++) {
      const prevGroup = rowGroups[i - 1];
      const currGroup = rowGroups[i];
      const prevRight = Math.max(...prevGroup.map(box => box.termX + box.termWidth));
      const currLeft = Math.min(...currGroup.map(box => box.termX));
      let gap = (prevGroup.some(box => box.text.length > 1) || currGroup.some(box => box.text.length > 1)) ? CONFIG.GAP_SIZE : 0;
      const targetX = prevRight + gap;
      if (currLeft < targetX) {
        const shift = targetX - currLeft;
        currGroup.forEach(box => box.termX += shift);
      }
    }
  }
}

function groupBoxes(visibleBoxes) {
  let groups = [];
  const boxToGroup = new Map();

  if (CONFIG.useTextByElementGrouping) {
    const groupsMap = new Map();
    for (const box of visibleBoxes) {
      const groupKey = box.parentIndex !== undefined ? box.parentIndex : `individual_${visibleBoxes.indexOf(box)}`;
      if (!groupsMap.has(groupKey)) groupsMap.set(groupKey, []);
      groupsMap.get(groupKey).push(box);
    }
    groups = Array.from(groupsMap.values());
  } else if (CONFIG.useTextGestaltGrouping) {
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
    groups = visibleBoxes.map(box => [box]);
  }

  groups.forEach((group, groupId) => group.forEach(box => boxToGroup.set(box, groupId)));
  return { groups, boxToGroup };
}

async function handleClick({ termX, termY, renderedBoxes, clickableElements, send, sessionId, clickCounter, refresh }) {
  let clickedBox = null;
  for (let i = renderedBoxes.length - 1; i >= 0; i--) {
    const box = renderedBoxes[i];
    if (termX >= box.termX && termX <= box.termX + box.termWidth && termY >= box.termY && termY <= box.termY + box.termHeight) {
      clickedBox = box;
      break;
    }
  }

  if (!clickedBox || !clickedBox.isClickable) {
    terminal.yellow(`No clickable element found at TUI coordinates (${termX}, ${termY}).\n`);
    return;
  }

  terminal.moveTo(clickedBox.termX, clickedBox.termY);
  terminal.yellow(clickedBox.text);
  await sleep(300);
  await refresh();

  const relativeX = (termX - clickedBox.termX) / clickedBox.termWidth;
  const relativeY = (termY - clickedBox.termY) / clickedBox.termHeight;
  const guiX = clickedBox.boundingBox.x + relativeX * clickedBox.boundingBox.width;
  const guiY = clickedBox.boundingBox.y + relativeY * clickedBox.boundingBox.height;
  const clickX = guiX + clickedBox.viewportX;
  const clickY = guiY + clickedBox.viewportY;

  const clickId = clickCounter.value++;
  const clickEvent = { type: 'mousePressed', x: clickX, y: clickY, button: 'left', clickCount: 1 };
  await send('Input.dispatchMouseEvent', clickEvent, sessionId);
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: clickX, y: clickY, button: 'left' }, sessionId);

  appendFileSync('clicks.log', `${new Date().toISOString()} - Click ${clickId}: T coords (${termX}, ${termY}), G coords (${clickX}, ${clickY}), Event: ${JSON.stringify(clickEvent)}\n`);
  await refresh();
}

async function printTextLayoutToTerminal({ send, sessionId, onTabSwitch }) {
  const state = initializeState();
  const refresh = () => refreshTerminal({ send, sessionId, state });

  const debouncedRefresh = debounce(refresh, DEBOUNCE_DELAY);

  terminal.on('mouse', async (event, data) => {
    if (!state.isListening) return;
    if (event === 'MOUSE_LEFT_BUTTON_PRESSED' && data.y > 4) { // Below TerminalBrowser UI
      if (!state.isInitialized) return;
      await handleClick({
        termX: data.x,
        termY: data.y,
        renderedBoxes: state.renderedBoxes,
        clickableElements: state.clickableElements,
        send,
        sessionId,
        clickCounter: state.clickCounter,
        refresh,
      });
    } else if (event === 'MOUSE_WHEEL_UP' || event === 'MOUSE_WHEEL_DOWN') {
      const deltaY = event === 'MOUSE_WHEEL_UP' ? -state.scrollDelta : state.scrollDelta;
      if (event === 'MOUSE_WHEEL_UP' && state.currentScrollY <= 0) return;
      await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 0, y: 0, deltaX: 0, deltaY }, sessionId);
      debouncedRefresh();
    }
  });

  terminal.on('key', async (name) => {
    if (!state.isListening) return;
    if (name === 'CTRL_C') {
      state.isListening = false;
      process.emit('SIGINT');
    } else if (name === '<') {
      state.isListening = false;
      if (onTabSwitch) await onTabSwitch();
    }
  });

  await refresh();
  return () => { state.isListening = false; };
}

async function getTerminalSize() {
  const size = { columns: terminal.width, rows: terminal.height };
  return size.columns && size.rows ? size : { columns: 80, rows: 24 };
}

async function connectToBrowser() {
  let cookieHeader;
  let cookieValue;
  let targets;

  terminal.cyan('Authenticating to set session cookie...\n');
  const response = await fetch(loginUrl, { method: 'GET', headers: { 'Accept': 'text/html' }, redirect: 'manual' });
  if (response.status !== 302) throw new Error(`Expected 302 redirect, got HTTP ${response.status}: ${await response.text()}`);
  const setCookie = response.headers.get('set-cookie');
  if (!setCookie) throw new Error('No Set-Cookie header in /login response');
  const cookieMatch = setCookie.match(/browserbox-[^=]+=(.+?)(?:;|$)/);
  if (!cookieMatch) throw new Error('Could not parse browserbox cookie');
  cookieValue = cookieMatch[1];
  const cookieName = setCookie.split('=')[0];
  cookieHeader = `${cookieName}=${cookieValue}`;

  DEBUG && terminal.cyan('Fetching available tabs...\n');
  const tabResponse = await fetch(apiUrl, { method: 'GET', headers: { 'Accept': 'application/json', 'Cookie': cookieHeader } });
  if (!tabResponse.ok) throw new Error(`HTTP ${tabResponse.status}: ${await tabResponse.text()}`);
  const data = await tabResponse.json();
  targets = (data.tabs || []).filter(t => t.type === 'page' || t.type === 'tab');
  BrowserState.targets = targets;

  if (!targets.length) {
    terminal.yellow('No page or tab targets available.\n');
    process.exit(0);
  }

  DEBUG && terminal.cyan(`Fetching WebSocket debugger URL from ${proxyBaseUrl}/json/version...\n`);
  const wsResponse = await fetch(`${proxyBaseUrl}/json/version`, { method: 'GET', headers: { 'Accept': 'application/json', 'x-browserbox-local-auth': cookieValue } });
  if (!wsResponse.ok) throw new Error(`HTTP ${wsResponse.status}: ${await wsResponse.text()}`);
  const wsData = await wsResponse.json();
  let wsDebuggerUrl = wsData.webSocketDebuggerUrl;
  if (!wsDebuggerUrl) throw new Error('No webSocketDebuggerUrl in response');

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

  socket.on('message', (data) => {
    let message;
    try {
      const dataStr = Buffer.isBuffer(data) ? data.toString('utf8') : data;
      message = JSON.parse(dataStr);
      DEBUG && appendFileSync(LOG_FILE, `${new Date().toISOString()} - RECEIVE: ${JSON.stringify(message, null, 2)}\n`);
    } catch (error) {
      if (DEBUG) console.warn(error);
      terminal.red(`Invalid message: ${String(data).slice(0, 50)}...\n`);
      return;
    }
    const key = `${message.sessionId || 'root'}:${message.id}`;
    if (message.id && Resolvers[key]) {
      Resolvers[key](message.result || message.error);
      delete Resolvers[key];
    }
  });

  async function send(method, params = {}, sessionId) {
    const message = { method, params, sessionId, id: ++id };
    const key = `${sessionId || 'root'}:${message.id}`;
    let resolve;
    const promise = new Promise((res) => resolve = res);
    Resolvers[key] = resolve;

    const timeout = setTimeout(() => {
      delete Resolvers[key];
      throw new Error(`Timeout waiting for response to ${method} (id: ${message.id})`);
    }, 10000);

    DEBUG && appendFileSync(LOG_FILE, `${new Date().toISOString()} - SEND: ${JSON.stringify(message, null, 2)}\n`);
    socket.send(JSON.stringify(message));
    return promise.finally(() => clearTimeout(timeout));
  }

  await new Promise((resolve, reject) => {
    socket.on('open', resolve);
    socket.on('error', reject);
  });
  DEBUG && terminal.green('Connected to WebSocket\n');

  return { send, socket, targets, cookieHeader };
}
