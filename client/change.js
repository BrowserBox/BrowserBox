#!/usr/bin/env node

// CyberJaguar - BrowserBox TUI Browser Application
  // Setup
    // imports
      import { WebSocket } from 'ws';
      import { appendFileSync } from 'fs';
      import { Agent } from 'https';
      import TK from 'terminal-kit';
      const { terminal } = TK;

    // one liners
      const sleep = ms => new Promise(res => setTimeout(res, ms));

    // Constants
      const BrowserState = {
        targets: [],
        activeTarget: null,
        selectedTabIndex: 0 // Add to track current tab selection
      };
      const HORIZONTAL_COMPRESSION = 1.0;
      const VERTICAL_COMPRESSION = 1.0;
      const LINE_SHIFT = 1;
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

    // arg processing
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

  // main logic
    let socket;
    let cleanup;
    let targets;
    let cookieHeader;
    let send;

    const selectTabAndRender = async () => {
      if (cleanup) cleanup();

      terminal.clear();
      const items = targets.map((t, i) => `${(t.title || new URL(t.url || 'about:blank').hostname).slice(0, Math.round(Math.max(15, terminal.width / 3)))}`);
      const selection = await terminal.singleRowMenu(items, {
        style: terminal.white,
        selectedStyle: terminal.black.bgGreen,
        exitOnUnexpectedKey: false,
      }).promise.catch(() => {
        terminal.yellow('Selection interrupted. Exiting...\n');
        process.exit(0);
      });

      const selectedTarget = targets[selection.selectedIndex];
      const targetId = selectedTarget.targetId;
      BrowserState.activeTarget = selectedTarget;
      BrowserState.selectedTabIndex = selection.selectedIndex;

      DEBUG && terminal.cyan(`Attaching to target ${targetId}...\n`);
      const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
      DEBUG && terminal.green(`Attached with session ${sessionId}\n`);

      const stop = await printTextLayoutToTerminal({ send, sessionId, onTabSwitch: selectTabAndRender });
      cleanup = stop;
    };

    (async () => {
      try {
        terminal.cyan('Starting browser connection...\n');
        terminal.fullscreen();
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

  // Helpers
    // Data processing helpers
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
        debugLog(`Terminal size: ${termWidth}x${termHeight}`);
        debugLog(`Viewport dimensions: ${viewportWidth}x${viewportHeight}`);

        const baseScaleX = termWidth / viewportWidth;
        const baseScaleY = (termHeight - 2) / viewportHeight; // Reserve 2 rows for UI
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
          box.termY = Math.ceil(adjustedY * scaleY) + 2; // Shift down 2 rows
          box.termWidth = box.text.length;
          box.termHeight = 1;
        });

        const { groups, boxToGroup } = groupBoxes(visibleBoxes, CONFIG);

        return {
          visibleBoxes,
          groups,
          boxToGroup,
          termWidth,
          termHeight: termHeight - 2, // Adjust usable height
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

      // [Other data processing helpers like extractTextLayoutBoxes, getAncestorInfo, pollForSnapshot remain unchanged]

    // Browser UI
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

      function createAddressBar({ term, send, sessionId, state, refresh }) {
        let currentUrl = BrowserState.activeTarget?.url || loginUrl;
        let addressBarActive = false;

        const drawAddressBar = () => {
          term.moveTo(1, 2).eraseLine(); // Move to row 2
          term.bgBlue.white(` URL: ${currentUrl} (Press 'a' to edit) `);
        };

        const activateAddressBar = () => {
          if (addressBarActive) return;
          addressBarActive = true;
          term.moveTo(6, 2).eraseLineAfter();
          term.inputField(
            { default: currentUrl, cancelable: true },
            async (error, input) => {
              addressBarActive = false;
              if (!error && input) {
                const normalizedUrl = normalizeUrl(input);
                currentUrl = normalizedUrl;
                DEBUG && term.cyan(`\nNavigating to: ${currentUrl}\n`);
                try {
                  await send('Page.navigate', { url: currentUrl }, sessionId);
                  await refresh();
                } catch (err) {
                  term.red(`Navigation failed: ${err.message}\n`);
                }
              } else {
                refresh();
              }
            }
          );
        };

        return { drawAddressBar, activateAddressBar, isActive: () => addressBarActive, getUrl: () => currentUrl };
      }

    // Layout calculation and Render helpers
      function renderLayout({ layoutState, renderedBoxes, CONFIG }) {
        if (!layoutState) return;
        renderBoxes({ ...layoutState, renderedBoxes, CONFIG }); // No clear here, handled in refreshTerminal
      }

      async function refreshTerminal({ send, sessionId, state, addressBar }) {
        try {
          const { snapshot, viewportWidth, viewportHeight, viewportX, viewportY } = await pollForSnapshot({ send, sessionId });
          state.currentScrollY = viewportY;
          const layoutState = await prepareLayoutState({ snapshot, viewportWidth, viewportHeight, viewportX, viewportY });
          
          terminal.clear();
          
          // Draw tab row
          const items = BrowserState.targets.map((t, i) => `${(t.title || new URL(t.url || 'about:blank').hostname).slice(0, Math.round(Math.max(15, terminal.width / 3)))}`);
          terminal.moveTo(1, 1);
          terminal.singleRowMenu(items, {
            style: terminal.white,
            selectedStyle: terminal.black.bgGreen,
            selectedIndex: BrowserState.selectedTabIndex,
            exitOnUnexpectedKey: false,
          });

          // Draw address bar
          addressBar.drawAddressBar();

          // Render content
          if (layoutState) {
            state.clickableElements = layoutState.clickableElements;
            state.layoutToNode = layoutState.layoutToNode;
            state.nodeToParent = layoutState.nodeToParent;
            state.nodes = layoutState.nodes;
            renderLayout({ layoutState, renderedBoxes: state.renderedBoxes, CONFIG });
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

      // [Other render helpers like renderBoxes, applyGaps, deconflictGroups, groupBoxes remain unchanged]

    // Interactivity helpers
      function setupEventHandlers({ terminal, send, sessionId, state, refresh, onTabSwitch, addressBar }) {
        const debouncedRefresh = debounce(refresh, DEBOUNCE_DELAY);

        terminal.on('mouse', async (event, data) => {
          if (!state.isListening || addressBar.isActive()) return;

          if (event === 'MOUSE_LEFT_BUTTON_PRESSED') {
            if (!state.isInitialized) {
              debugLog(`Click ignored: Terminal not yet initialized`);
              return;
            }
            const { x: termX, y: termY } = data;
            if (termY === 1) {
              // Click on tab row, approximate tab selection
              const tabWidth = Math.floor(terminal.width / BrowserState.targets.length);
              const clickedTabIndex = Math.floor(termX / tabWidth);
              if (clickedTabIndex >= 0 && clickedTabIndex < BrowserState.targets.length) {
                BrowserState.selectedTabIndex = clickedTabIndex;
                BrowserState.activeTarget = BrowserState.targets[clickedTabIndex];
                const targetId = BrowserState.activeTarget.targetId;
                await send('Target.attachToTarget', { targetId, flatten: true });
                await refresh();
              }
              return;
            }
            await handleClick({
              termX,
              termY,
              renderedBoxes: state.renderedBoxes,
              clickableElements: state.clickableElements,
              send,
              sessionId,
              clickCounter: state.clickCounter,
              refresh,
              layoutToNode: state.layoutToNode,
              nodeToParent: state.nodeToParent,
              nodes: state.nodes,
            });
          } else if (event === 'MOUSE_WHEEL_UP' || event === 'MOUSE_WHEEL_DOWN') {
            const deltaY = event === 'MOUSE_WHEEL_UP' ? -state.scrollDelta : state.scrollDelta;
            if (event === 'MOUSE_WHEEL_UP' && state.currentScrollY <= 0) {
              debugLog(`Ignoring upward scroll: already at top (scrollOffsetY=${state.currentScrollY})`);
              return;
            }
            send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 0, y: 0, deltaX: 0, deltaY }, sessionId);
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
            if (onTabSwitch) onTabSwitch();
          } else if (name === 'a' && !addressBar.isActive()) {
            addressBar.activateAddressBar();
          } else if (name === 'LEFT' && !addressBar.isActive()) {
            if (BrowserState.selectedTabIndex > 0) {
              BrowserState.selectedTabIndex--;
              BrowserState.activeTarget = BrowserState.targets[BrowserState.selectedTabIndex];
              const targetId = BrowserState.activeTarget.targetId;
              await send('Target.attachToTarget', { targetId, flatten: true });
              await refresh();
            }
          } else if (name === 'RIGHT' && !addressBar.isActive()) {
            if (BrowserState.selectedTabIndex < BrowserState.targets.length - 1) {
              BrowserState.selectedTabIndex++;
              BrowserState.activeTarget = BrowserState.targets[BrowserState.selectedTabIndex];
              const targetId = BrowserState.activeTarget.targetId;
              await send('Target.attachToTarget', { targetId, flatten: true });
              await refresh();
            }
          }
        });
      }

      // [handleClick remains unchanged]

    // Main render 
      async function printTextLayoutToTerminal({ send, sessionId, onTabSwitch }) {
        const state = initializeState();
        const addressBar = createAddressBar({ term: terminal, send, sessionId, state, refresh: () => refreshTerminal({ send, sessionId, state, addressBar }) });
        const refresh = () => refreshTerminal({ send, sessionId, state, addressBar });

        setupEventHandlers({ terminal, send, sessionId, state, refresh, onTabSwitch, addressBar });
        await refresh();

        return () => { state.isListening = false; };
      }

    // [Other helpers like getTerminalSize, connectToBrowser, logMessage, debugLog remain unchanged]
