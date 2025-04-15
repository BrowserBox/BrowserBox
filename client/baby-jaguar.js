#!/usr/bin/env node
  // Kernel Browser - a terminal client for the modern world wide web
  // Project Information
  // Initiated by: DOSAYGO Corporation and @o0101
  // Incept date: February 2025
  // Assisted by: @grok and ChatGPT
  // Copyright (C) DOSAYGO and @o0101 2025
  // License: Commercial / paid license - contact sales@dosaygo.com
  // Project Codenames during development: Jaguar, BabyJaguar, CyberJaguar - BrowserBox TUI Browser Application

  // Setup
  // imports
  // built in
  import util from 'util';
  import { appendFileSync } from 'fs';

  // 3rd-party
  import TK from 'terminal-kit';
  export const { terminal } = TK;

  // internal
  import Layout from './layout.js';
  import TerminalBrowser from './terminal-browser.js';
  import { ConnectionManager } from './connection-manager.js';
  import { sleep, logClicks, debugLog, DEBUG } from './log.js';

  // Constants and state
  const clickCounter = { value: 0 };
  const USE_SYNTHETIC_FOCUS = true;
  const markClicks = false;
  const DEBOUNCE_DELAY = 280;
  const args = process.argv.slice(2);
  const mySource = 'krnlclient' + Math.random().toString(36);
  export const renderedBoxes = [];

  const stateBySession = new Map(); // Map<sessionId, state>
  export const sessions = new Map();
  export const renderedBoxesBySession = new Map(); // Map<sessionId, renderedBoxes>
  // Update browserState
  export const browserState = {
    currentSessionId: null,
    targets: null,
    send: null,
  };

  let connection;
  let cleanup;
  let targets;
  let send;
  let browser;
  let messageId = Math.round(Math.round(Math.random() * 1000 + 1) * 1e6);
  let sessionId;
  let browserbox;
  let loginLink;

  // arrows
  const debouncedRefresh = debounce(() => {
    if (sessionId) {
      refreshTerminal({ send, sessionId });
    }
  }, DEBOUNCE_DELAY);

  // arg processing
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

  // remote browser connection constants
  const urlObj = new URL(loginLink);
  const hostname = urlObj.hostname;
  const token = urlObj.searchParams.get('token');
  const baseUrl = `${urlObj.protocol}//${urlObj.host}`;
  const port = parseInt(urlObj.port, 10) || (urlObj.protocol === 'https:' ? 443 : 80);
  const proxyPort = port + 1;
  const proxyBaseUrl = `${urlObj.protocol}//${urlObj.hostname}:${proxyPort}`;
  const loginUrl = `${baseUrl}/login?token=${token}`;
  const apiUrl = `${baseUrl}/api/v10/tabs`;

  if (DEBUG) {
    const ox = process.exit.bind(process);
    process.exit = (...stuff) => {
      const e = new Error();
      console.error('Exiting', e, ...stuff);
      ox(stuff[0]);
    };
  }
  startKernel();

  // main logic
  async function startKernel() {
    try {
      terminal.cyan('Starting browser connection...\n');
      const connection = await connectToBrowser();
      browserState.send = connection.send;
      browserState.targets = connection.targets;
      send = connection.send;
      targets = connection.targets;
      browserbox = connection.browserbox;
      browser = new TerminalBrowser(
        {
          tabWidth: Math.max(15, Math.ceil(terminal.width / 4)),
          initialTabs: targets,
        },
        getTabState,
        getBrowserState
      );
      await send('Target.setDiscoverTargets', { discover: true });
      await send('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: false, flatten: true });

      if (targets.length === 0) {
        await send('Target.createTarget', { url: 'about:blank' });
      }
      browser.on('tabSelected', async (tab) => {
        const index = tab ? browser.getTabs().findIndex(t => t.targetId === tab.targetId) : 0;
        browser.activeTarget = targets[index];
        const { targetId } = browser.activeTarget;
        browser.setAddress(tab.url);
        browserbox.send(
          JSON.stringify({
            messageId: messageId++,
            zombie: {
              events: [
                {
                  command: {
                    name: 'Target.activateTarget',
                    params: { targetId },
                  },
                },
                {
                  command: {
                    isZombieLordCommand: true,
                    name: 'Connection.activateTarget',
                    params: {
                      targetId,
                      source: mySource,
                    },
                  },
                },
              ],
            },
          })
        );
        await selectTabAndRender();
      });

      browser.on('newTabRequested', async (tab) => {
        DEBUG && terminal.cyan(`Creating new remote tab: ${tab.title}\n`);
        try {
          await send('Target.createTarget', { url: tab.url || 'about:blank' });
          targets = await connection.connectionManager.fetchTargets();
          await selectTabAndRender();
        } catch (error) {
          DEBUG && terminal.red(`Failed to create new tab: ${error.message}\n`);
        }
      });

      browser.on('tabClosed', async (index) => {
        let targetId;
        try {
          targetId = targets[index].targetId;
          await send('Target.closeTarget', { targetId });
          targets = await connection.connectionManager.fetchTargets();
          browser.targets = targets;
          browser.tabs = targets;
          DEBUG && terminal.cyan(`Closing remote target: ${targetId}\n`);
          browser.activeTarget = targets[browser.selectedTabIndex] || null;
          await selectTabAndRender();
        } catch (error) {
          debugLog(JSON.stringify({ targets, index }, null, 2));
          DEBUG && terminal.red(`Failed to close target ${targetId}: ${error.message}\n`);
          DEBUG && process.exit(1);
        }
      });

      browser.on('navigate', async (url) => {
        const normalizedUrl = normalizeUrl(url);
        DEBUG && terminal.cyan(`Navigating to: ${normalizedUrl}\n`);
        send('Page.navigate', { url: normalizedUrl }, sessionId);
        await refreshTerminal({ send, sessionId });
      });

      browser.on('back', async () => {
        const navigated = await goBack(sessionId);
        if (navigated) {
          await refreshTerminal({ send, sessionId });
        }
      });

      browser.on('forward', async () => {
        const navigated = await goForward(sessionId);
        if (navigated) {
          await refreshTerminal({ send, sessionId });
        }
      });

      browser.on('renderContent', () => {
        const state = getTabState(getBrowserState().currentSessionId);
        if (state.layoutState) {
          DEBUG && console.log('Rendering content');
          renderLayout({ layoutState: state.layoutState });
        }
      });

      browser.on('click', async ({ x, y }) => {
        const state = getTabState(getBrowserState().currentSessionId);
        if (!state.isInitialized) return;
        await handleClick({
          termX: x,
          termY: y,
          clickableElements: state.clickableElements,
          layoutToNode: state.layoutToNode,
          nodeToParent: state.nodeToParent,
          nodes: state.nodes,
        });
      });

      browser.on('scroll', async ({ direction }) => {
        const state = getTabState(getBrowserState().currentSessionId);
        try {
          const lineHeight = Math.round(state.viewportHeight / terminal.height);
          const deltaY = direction * lineHeight;
          await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 0, y: 0, deltaX: 0, deltaY }, sessionId);
          debouncedRefresh();
        } catch (e) {
          console.error(e);
        }
      });

      await sleep(3000);
      await selectTabAndRender();

      process.title = 'KRNL-RENDER';
      process.on('SIGINT', () => {
        if (connection.connectionManager) connection.connectionManager.cleanup();
        browser.destroy();
        terminal.clear();
        terminal.green('Exiting...\n');
        process.exit(0);
      });
    } catch (error) {
      debugLog(JSON.stringify({ error, stack: error.stack }, null, 2));
      if (connection.connectionManager) connection.connectionManager.cleanup();
      console.error(error);
      if (DEBUG) console.warn(error);
      terminal.red(`Main error: ${error.message}\n`);
      browser?.destroy();
      process.exit(1);
    }
  }

  export function getBrowserState() {
    return browserState;
  }

  export function getTabState(sessionId) {
    if (!sessionId) {
      console.warn('No sessionId provided, returning empty tab state');
      return {
        sessionId: null,
        send: browserState.send || (() => Promise.resolve({})),
        clickCounter,
        clickableElements: [],
        isListening: true,
        scrollDelta: 50,
        currentScrollY: 0,
        layoutToNode: null,
        nodeToParent: null,
        nodes: null,
        isInitialized: false,
        strings: [],
        viewportHeight: 0,
        viewportWidth: 0,
      };
    }
    let state = stateBySession.get(sessionId);
    if (!state) {
      state = initializeState(sessionId);
      stateBySession.set(sessionId, state);
    }
    return state;
  }

  function initializeState(sessionId) {
    const state = {
      get sessionId() {
        return sessionId;
      },
      get send() {
        return browserState.send;
      },
      clickCounter,
      clickableElements: [],
      isListening: true,
      scrollDelta: 50,
      currentScrollY: 0,
      layoutToNode: null,
      nodeToParent: null,
      nodes: null,
      isInitialized: false,
      strings: [],
      viewportHeight: 0,
      viewportWidth: 0,
    };
    stateBySession.set(sessionId, state);
    return state;
  }

  // Update refreshTerminal
  export async function refreshTerminal({ send, sessionId }) {
    try {
      const { snapshot, viewportWidth, viewportHeight, viewportX, viewportY } = await pollForSnapshot({ send, sessionId });
      if (!snapshot) return;
      const state = getTabState(sessionId); // Use getTabState
      state.currentScrollY = viewportY;
      const layoutState = await Layout.prepareLayoutState({
        snapshot,
        viewportWidth,
        viewportHeight,
        viewportX,
        viewportY,
        getTerminalSize,
      });

      terminal.clear();
      terminal.bgDefaultColor();
      terminal.defaultColor();
      terminal.styleReset();
      browser.render();

      if (layoutState) {
        state.layoutState = layoutState;
        state.clickableElements = layoutState.clickableElements;
        state.layoutToNode = layoutState.layoutToNode;
        state.nodeToParent = layoutState.nodeToParent;
        state.nodes = layoutState.nodes;
        state.strings = snapshot.strings;

        renderLayout({ layoutState, sessionId }); // Pass sessionId
        state.isInitialized = true;
        DEBUG && terminal.cyan(`Found ${layoutState.visibleBoxes.length} visible text boxes.\n`);
      } else {
        DEBUG && terminal.yellow('No text boxes found after polling.\n');
        statusLine('No text boxes found');
        renderLayout({ layoutState, sessionId });
        state.isInitialized = true;
      }
    } catch (error) {
      if (DEBUG) console.warn(error);
      DEBUG && terminal.red(`Error printing text layout: ${error.message}\n`);
    }
  }

  async function selectTabAndRender() { // Remove targetId param if unused
    if (cleanup) cleanup();

    DEBUG && debugLog(util.inspect({ browser, targets }));
    const selectedTarget = targets.find(t => t.targetId == browser.selectedTabId) || targets[0];
    const targetId = selectedTarget.targetId;
    browser.activeTarget = selectedTarget;

    DEBUG && terminal.cyan(`Attaching to target ${targetId}...\n`);
    if (!sessions.has(targetId)) {
      const { sessionId: newSessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
      sessionId = newSessionId;
      sessions.set(targetId, sessionId);
      initializeState(sessionId);
    } else {
      sessionId = sessions.get(targetId);
    }
    browserState.currentSessionId = sessionId; // Update global state
    DEBUG && terminal.green(`Attached with session ${sessionId}\n`);

    await refreshTerminal({ send, sessionId }); // Ensure state is ready
    const stop = await printTextLayoutToTerminal();
    cleanup = stop;
  }

  // Helpers
  // Data processing helpers
  function debounce(func, delay) {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }

  async function pollForSnapshot({ send, sessionId, maxAttempts = 4, interval = 1000 }) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const { snapshot, viewportWidth, viewportHeight, viewportX, viewportY } = await fetchSnapshot({ send, sessionId });
      if (snapshot) {
        const state = getTabState(sessionId); // Use getTabState
        state.viewportHeight = viewportHeight;
        state.viewportWidth = viewportWidth;
        const { textLayoutBoxes } = Layout.extractTextLayoutBoxes({ snapshot });
        if (textLayoutBoxes.length > 0) {
          return { snapshot, viewportWidth, viewportHeight, viewportX, viewportY };
        }
        DEBUG && terminal.yellow(`Attempt ${attempt}: Found 0 text boxes, retrying in ${interval}ms...\n`);
      }
      await sleep(interval);
    }
    DEBUG && terminal.yellow(`Max attempts reached, proceeding with last snapshot.\n`);
    return await fetchSnapshot({ send, sessionId });
  }

  // Browser UI
  function statusLine(...stuff) {
    DEBUG && console.error(...stuff);
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

  // Layout calculation and Render helpers
  async function getTerminalSize() {
    const size = { columns: terminal.width, rows: terminal.height };
    if (!size.columns || !size.rows) {
      return { columns: 80, rows: 24 };
    }
    return size;
  }

  function renderLayout({ layoutState }) {
    if (!layoutState) return;
    renderBoxes({ ...layoutState });
  }

  async function fetchSnapshot({ send, sessionId }) {
    try {
      DEBUG && terminal.cyan('Enabling DOM and snapshot domains...\n');
      await Promise.all([
        send('DOM.enable', {}, sessionId),
        send('DOMSnapshot.enable', {}, sessionId),
      ]);

      DEBUG && terminal.cyan('Capturing snapshot...\n');
      const snapshot = await send(
        'DOMSnapshot.captureSnapshot',
        {
          computedStyles: ['display', 'visibility', 'overflow', 'position', 'width', 'height', 'transform', 'opacity'],
          includePaintOrder: true,
        },
        sessionId
      );
      if (!snapshot?.documents?.length) {
        debugLog('snapshot_failed', sessionId, { reason: 'no_documents' }, (new Error).stack);
        return;
      }
      DEBUG && appendFileSync('snapshot.log', JSON.stringify({ snapshot }, null, 2));

      const layoutMetrics = await send('Page.getLayoutMetrics', {}, sessionId);
      const viewport = layoutMetrics.visualViewport;
      const document = snapshot.documents[0];

      // Log backendNodeIds for clickable nodes
      const clickableNodeIds = document.nodes.isClickable?.index
        .map(idx => document.nodes.backendNodeId[idx])
        .filter(id => id !== undefined);
      debugLog('snapshot_nodes', sessionId, {
        clickableNodeIds,
        totalNodes: document.nodes.backendNodeId.length
      }, (new Error).stack);

      return {
        snapshot,
        viewportWidth: viewport.clientWidth,
        viewportHeight: viewport.clientHeight,
        viewportX: document.scrollOffsetX,
        viewportY: document.scrollOffsetY,
      };
    } catch (e) {
      DEBUG && console.warn(e);
      debugLog('snapshot_failed', sessionId, { reason: e.message }, (new Error).stack);
      return {};
    }
  }

  function renderBoxes(layoutState) {
    const { visibleBoxes, termWidth, termHeight, viewportX, viewportY, clickableElements } = layoutState;
    const newBoxes = [];

    for (const box of visibleBoxes) {
      DEBUG && debugLog(`Processing box: text="${box.text}", type="${box.type}", isClickable=${box.isClickable}, ancestorType="${box.ancestorType}", backendNodeId=${box.backendNodeId}`);
      const { text, boundingBox, isClickable, termX, termY, ancestorType, backendNodeId, layoutIndex, nodeIndex, type } = box;
      const renderX = Math.max(1, termX + 1);
      const renderY = Math.max(5, termY + 4);

      if (renderX > termWidth || renderY > termHeight + 4) continue;

      const displayWidth = Math.max(0, termWidth - renderX + 1);
      let displayText = text.substring(0, displayWidth);
      let termWidthForBox;

      if (type === 'input' && boundingBox?.width && layoutState.viewportWidth) {
        const scaleFactor = termWidth / layoutState.viewportWidth;
        termWidthForBox = Math.round(boundingBox.width * scaleFactor);
        termWidthForBox = Math.max(10, Math.min(termWidthForBox, displayWidth));
        logClicks(`Input sizing for backendNodeId: ${backendNodeId}, boundingBox.width: ${boundingBox.width}, viewportWidth: ${layoutState.viewportWidth}, scaleFactor: ${scaleFactor}, termWidth: ${termWidthForBox}`);
      } else {
        termWidthForBox = displayText.length;
      }

      const renderedBox = {
        text,
        type,
        boundingBox,
        isClickable,
        termX: renderX,
        termY: renderY,
        termWidth: termWidthForBox,
        termHeight: 1,
        viewportX,
        viewportY,
        viewportWidth: layoutState.viewportWidth,
        viewportHeight: layoutState.viewportHeight,
        backendNodeId,
        layoutIndex,
        nodeIndex,
      };

      debugLog('render_box', null, {
        backendNodeId,
        type,
        isClickable,
        text: text.slice(0, 50),
        termX,
        termY
      }, (new Error).stack);

      const isFocused = browser.focusManager.getFocusedElement() === (type === 'input' ? `input:${backendNodeId}` : `clickable:${backendNodeId}`);
      if (type === 'input') {
        logClicks(`Drawing input field for backendNodeId: ${backendNodeId}`);
        const currentBackendNodeId = backendNodeId;
        const fallbackValue = text.startsWith('[INPUT') ? '' : text;
        const onChange = createInputChangeHandler({ send, sessionId, backendNodeId: currentBackendNodeId });

        send('DOM.resolveNode', { backendNodeId: currentBackendNodeId }, sessionId)
          .then(resolveResult => {
            if (!resolveResult?.object?.objectId) throw new Error('Node no longer exists');
            const objectId = resolveResult.object.objectId;
            return send(
              'Runtime.callFunctionOn',
              {
                objectId,
                functionDeclaration: 'function() { return this.value; }',
                arguments: [],
                returnByValue: true,
              },
              sessionId
            );
          })
          .then(valueResult => {
            let liveValue = fallbackValue;
            if (valueResult?.result?.value !== undefined) {
              liveValue = '' + valueResult.result.value;
              logClicks(`Fetched live value for backendNodeId: ${currentBackendNodeId}: "${liveValue}"`);
            }
            const inputField = drawInputFieldForNode({
              renderX,
              renderY,
              termWidthForBox,
              backendNodeId: currentBackendNodeId,
              initialValue: liveValue,
              onChange,
            });
            renderedBox.termWidth = inputField.width;
            newBoxes.push(renderedBox);
            if (isClickable) {
              const clickable = clickableElements.find(el => el.text === text && el.boundingBox.x === boundingBox.x && el.boundingBox.y === boundingBox.y);
              if (clickable) {
                clickable.termX = renderX;
                clickable.termY = renderY;
                clickable.termWidth = inputField.width;
                clickable.termHeight = 1;
              }
            }
          })
          .catch(error => {
            logClicks(`Failed to fetch live value for backendNodeId ${currentBackendNodeId}: ${error.message}`);
            const inputField = drawInputFieldForNode({
              renderX,
              renderY,
              termWidthForBox,
              backendNodeId: currentBackendNodeId,
              initialValue: fallbackValue,
              onChange,
            });
            renderedBox.termWidth = inputField.width;
            newBoxes.push(renderedBox);
            if (isClickable) {
              const clickable = clickableElements.find(el => el.text === text && el.boundingBox.x === boundingBox.x && el.boundingBox.y === boundingBox.y);
              if (clickable) {
                clickable.termX = renderX;
                clickable.termY = renderY;
                clickable.termWidth = inputField.width;
                clickable.termHeight = 1;
              }
            }
          });
      } else {
        terminal.moveTo(renderX, renderY);
        if (isFocused && isClickable) {
          terminal.bgCyan();
          if (type === 'button' || ancestorType === 'button') {
            terminal.green(displayText);
          } else if (type === 'media' && isClickable) {
            terminal.gray.underline(displayText);
          } else if (ancestorType === 'hyperlink') {
            terminal.black.underline(displayText);
          } else if (ancestorType === 'other_clickable') {
            terminal.defaultColor.bold(displayText);
          } else {
            terminal.defaultColor(displayText);
          }
        } else {
          terminal.defaultColor().bgDefaultColor();
          if (type === 'button') {
            terminal.bgGreen.black(displayText);
          } else if (type === 'media') {
            if (isClickable) {
              terminal.gray.underline(displayText);
            } else {
              terminal.brightBlack(displayText);
            }
          } else {
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
        if (isClickable) {
          const clickable = clickableElements.find(el => el.text === text && el.boundingBox.x === boundingBox.x && el.boundingBox.y === boundingBox.y);
          if (clickable) {
            clickable.termX = renderX;
            clickable.termY = renderY;
            clickable.termWidth = displayText.length;
            clickable.termHeight = 1;
          }
        }
      }
      newBoxes.push(renderedBox);
    }

    const boxes = renderedBoxesBySession.get(sessionId) || [];
    boxes.length = 0;
    boxes.push(...newBoxes);
    renderedBoxesBySession.set(sessionId, boxes);
    debugLog(JSON.stringify(newBoxes, null, 2));
    debugLog('render_boxes_complete', null, {
      boxCount: newBoxes.length,
      backendNodeIds: newBoxes.map(b => b.backendNodeId).filter(id => id !== undefined)
    }, (new Error).stack);
    terminal.defaultColor().bgDefaultColor();
    terminal.styleReset();
  }

  function drawInputFieldForNode({ renderX, renderY, termWidthForBox, backendNodeId, initialValue, onChange }) {
    const inputField = browser.drawInputField({
      x: renderX,
      y: renderY,
      width: termWidthForBox,
      key: backendNodeId,
      initialValue,
      onChange,
    });
    return inputField;
  }

  function createInputChangeHandler({ send, sessionId, backendNodeId }) {
    return async function onInputChange(value) {
      try {
        const resolveResult = await send('DOM.resolveNode', { backendNodeId }, sessionId);
        if (!resolveResult?.object?.objectId) throw new Error('Node no longer exists');
        const objectId = resolveResult.object.objectId;
        const script = `function() {
          this.value = ${JSON.stringify(value)};
          this.dispatchEvent(new Event('input', { bubbles: true }));
          this.dispatchEvent(new Event('change', { bubbles: true }));
        }`;
        await send(
          'Runtime.callFunctionOn',
          {
            objectId,
            functionDeclaration: script,
            arguments: [],
            returnByValue: true,
          },
          sessionId
        );
        logClicks(`Updated remote value for backendNodeId: ${backendNodeId} to "${value}"`);
      } catch (error) {
        console.error(error);
        logClicks(`Failed to set input value for backendNodeId ${backendNodeId}: ${error.message}`);
        browser.redrawUnfocusedInput(backendNodeId);
        browser.focusManager.setFocusedElement('tabs');
        browser.inputFields.delete('' + backendNodeId);
        browser.render();
      }
    };
  }

  async function getNavigationHistory(sessionId) {
    const { currentIndex, entries } = await send('Page.getNavigationHistory', {}, sessionId);
    return { currentIndex, entries };
  }

  async function navigateHistory(sessionId, direction) {
    const { currentIndex, entries } = await getNavigationHistory(sessionId);
    const newIndex = currentIndex + direction;
    if (newIndex >= 0 && newIndex < entries.length) {
      await send('Page.navigateToHistoryEntry', { entryId: entries[newIndex].id }, sessionId);
      return true;
    }
    statusLine(`No ${direction < 0 ? 'previous' : 'next'} page in history`);
    return false;
  }

  async function goBack(sessionId) {
    return navigateHistory(sessionId, -1);
  }

  async function goForward(sessionId) {
    return navigateHistory(sessionId, 1);
  }

  export function getClickedBox({ termX, termY }) {
    let clickedBox = null;
    for (let i = renderedBoxes.length - 1; i >= 0; i--) {
      const box = renderedBoxes[i];
      if (termX >= box.termX && termX < box.termX + box.termWidth && termY === box.termY) {
        clickedBox = box;
        break;
      }
    }
    if (!clickedBox || !clickedBox.isClickable) {
      statusLine(`No clickable element at (${termX}, ${termY})`, JSON.stringify(renderedBoxes));
      logClicks(`No clickable element at (${termX}, ${termY})`);
      return;
    }
    logClicks(`Clicked box type: ${clickedBox.type}, backendNodeId: ${clickedBox.backendNodeId}`);
    return clickedBox;
  }

  export async function handleClick({ termX, termY, layoutToNode, nodeToParent, nodes }) {
    const clickedBox = getClickedBox({ termX, termY });
    if (!clickedBox) return;
    if (clickedBox.type === 'input') {
      await focusInput({ clickedBox, browser, send, sessionId, termX });
      return;
    } else {
      logClicks('Simulating click on non-input element');
      terminal.moveTo(clickedBox.termX, clickedBox.termY);
      terminal.yellow(clickedBox.text);
      await sleep(300);

      const relativeX = (termX - clickedBox.termX) / clickedBox.termWidth;
      const relativeY = (termY - clickedBox.termY) / clickedBox.termHeight;
      const guiX = clickedBox.boundingBox.x + relativeX * clickedBox.boundingBox.width;
      const guiY = clickedBox.boundingBox.y + relativeY * clickedBox.boundingBox.height;
      const clickX = guiX + clickedBox.viewportX;
      const clickY = guiY + clickedBox.viewportY;

      const clickId = clickCounter.value++;
      const nodeTag = clickedBox.ancestorType || 'unknown';
      const nodeText = clickedBox.text;
      const clickEvent = { type: 'click' };
      try {
        DEBUG && logClicks(`${new Date().toISOString()} - Click ${clickId}: T coords (${termX}, ${termY}), Node (tag: ${nodeTag}, text: "${nodeText}"), G coords (${clickX}, ${clickY}), Event: ${JSON.stringify(clickEvent)}\n`);
      } catch (error) {
        console.error(`Failed to write to clicks log: ${error.message}`);
      }

      let backendNodeId = clickedBox.backendNodeId;
      let currentNodeIndex = layoutToNode.get(clickedBox.layoutIndex);
      let clickableNodeIndex = currentNodeIndex;
      while (currentNodeIndex !== -1) {
        if (nodes.isClickable && nodes.isClickable.index.includes(currentNodeIndex)) {
          clickableNodeIndex = currentNodeIndex;
          break;
        }
        currentNodeIndex = nodeToParent.get(currentNodeIndex);
      }
      backendNodeId = nodes.backendNodeId[clickableNodeIndex];

      let objectId;
      try {
        const resolveResult = await send('DOM.resolveNode', { backendNodeId }, sessionId);
        objectId = resolveResult.object.objectId;
        DEBUG && debugLog(`Resolved backendNodeId ${backendNodeId} to objectId ${objectId}`);
      } catch (error) {
        DEBUG && debugLog(`Failed to resolve backendNodeId ${backendNodeId}: ${error.message}`);
        return;
      }

      try {
        const clickResult = await send(
          'Runtime.callFunctionOn',
          {
            objectId,
            functionDeclaration: 'function() { this.click(); }',
            arguments: [],
            returnByValue: true,
          },
          sessionId
        );
        DEBUG && debugLog(`Click result: ${JSON.stringify(clickResult)}`);
      } catch (error) {
        DEBUG && debugLog(`Failed to execute click on objectId ${objectId}: ${error.message}`);
      }

      if (DEBUG && markClicks) {
        const script = `
          (function() {
            const rect = this.getBoundingClientRect();
            const clickX = rect.left + rect.width / 2;
            const clickY = rect.top + rect.height / 2;
            const circle = document.createElement('div');
            circle.style.cssText = "position: absolute; left: " + clickX + "px; top: " + clickY + "px; width: 20px; height: 20px; background: black; color: white; border-radius: 50%; text-align: center; line-height: 20px; font-size: 12px; z-index: 9999;";
            circle.innerText = "${clickId}";
            circle.id = "click-trace-${clickId}";
            document.body.appendChild(circle);
            return { clickX, clickY };
          })
        `;
        try {
          const circleResult = await send(
            'Runtime.callFunctionOn',
            {
              objectId,
              functionDeclaration: script,
              arguments: [],
              returnByValue: true,
            },
            sessionId
          );
          DEBUG && debugLog(`Circle injection result: ${JSON.stringify(circleResult)}`);
        } catch (error) {
          DEBUG && debugLog(`Circle injection failed: ${error.message}`);
        }
      }

      await refreshTerminal({ send, sessionId });
    }
  }

  export async function focusInput({ clickedBox, browser, send, sessionId, termX }) {
    if ( clickedBox ) {
      logClicks(`Focusing input field: ${clickedBox.backendNodeId}`);
    } else {
      logClicks(`Clicked box is undefined`);
      return;
    }
    const guiX = clickedBox.boundingBox.x + clickedBox.boundingBox.width / 2;
    const guiY = clickedBox.boundingBox.y + clickedBox.boundingBox.height / 2;
    const clickX = guiX + clickedBox.viewportX;
    const clickY = guiY + clickedBox.viewportY;

    if (USE_SYNTHETIC_FOCUS) {
      try {
        const resolveResult = await send('DOM.resolveNode', { backendNodeId: clickedBox.backendNodeId }, sessionId);
        if (!resolveResult?.object?.objectId) throw new Error('Node no longer exists');
        const objectId = resolveResult.object.objectId;
        await send(
          'Runtime.callFunctionOn',
          {
            objectId,
            functionDeclaration: 'function() { this.focus(); }',
            arguments: [],
            returnByValue: true,
          },
          sessionId
        );
        logClicks(`Focused remote input with backendNodeId: ${clickedBox.backendNodeId}`);
      } catch (error) {
        logClicks(`Failed to focus remote input with backendNodeId ${clickedBox.backendNodeId}: ${error.message}`);
      }
    } else {
      try {
        await send(
          'Input.dispatchMouseEvent',
          {
            type: 'mousePressed',
            x: clickX,
            y: clickY,
            button: 'left',
            clickCount: 1,
          },
          sessionId
        );
        await send(
          'Input.dispatchMouseEvent',
          {
            type: 'mouseReleased',
            x: clickX,
            y: clickY,
            button: 'left',
            clickCount: 1,
          },
          sessionId
        );
        logClicks(`Focused remote input with backendNodeId: ${clickedBox.backendNodeId} at GUI coordinates (${clickX}, ${clickY})`);
      } catch (error) {
        logClicks(`Failed to focus remote input with backendNodeId ${clickedBox.backendNodeId}: ${error.message}`);
      }
    }

    browser.focusInput(clickedBox.backendNodeId);
    const inputState = browser.inputFields.get('' + clickedBox.backendNodeId);
    if (inputState) {
      const relativeX = termX - clickedBox.termX;
      inputState.cursorPosition = Math.min(relativeX, inputState.value.length);
      browser.redrawFocusedInput();
    }
  }

  // Main render
  async function printTextLayoutToTerminal() {
    await refreshTerminal({ send, sessionId });
    return () => {
      browser.inputManager.stopListening();
    };
  }

  // Connectivity helpers
  async function connectToBrowser() {
    const connectionManager = new ConnectionManager(loginUrl, proxyBaseUrl, apiUrl);
    const { cookieHeader, cookieValue } = await connectionManager.authenticate();
    const targets = await connectionManager.fetchTargets();
    const { send, socket, browserbox } = await connectionManager.setupWebSockets(hostname, token);
    return { send, socket, targets, cookieHeader, cookieValue, browserbox, connectionManager };
  }

