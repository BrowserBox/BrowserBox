#!/usr/bin/env node
// CyberJaguar - BrowserBox TUI Browser Application
  // Setup
    // imports
      import { WebSocket } from 'ws';
      import { appendFileSync } from 'fs';
      import { Agent } from 'https';
      import Layout from './layout.js';
      import TerminalBrowser from './terminal-browser.js';
      import {sleep, logClicks, logMessage,debugLog,DEBUG} from './log.js';
      import TK from 'terminal-kit';
      const { terminal } = TK;

    // Constants and state
      const USE_SYNTHETIC_FOCUS = true;
      const markClicks = false;
      const BrowserState = {
        targets: [],
        activeTarget: null,
        selectedTabIndex: 0
      };
      const DEBOUNCE_DELAY = 280;
      const args = process.argv.slice(2);
      const mySource = 'jagclient' + Math.random().toString(36);

      let state;
      let socket;
      let cleanup;
      let targets;
      let cookieHeader;
      let send;
      let browser;
      let messageId = Math.round(Math.round(Math.random()*1000 + 1) * 1e6);
      let sessionId;
      let browserbox;
      let loginLink;

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

  // main logic
    const debouncedRefresh = debounce(() => {
      if (sessionId) {
        refreshTerminal({ send, sessionId, state: initializeState(), addressBar: null });
      }
    }, DEBOUNCE_DELAY);

    const selectTabAndRender = async () => {
      if (cleanup) cleanup();

      const selectedTarget = targets[BrowserState.selectedTabIndex];
      const targetId = selectedTarget.targetId;
      BrowserState.activeTarget = selectedTarget;

      DEBUG && terminal.cyan(`Attaching to target ${targetId}...\n`);
      const { sessionId: newSessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
      sessionId = newSessionId;
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
        browserbox = connection.browserbox;
        cookieHeader = connection.cookieHeader;
        BrowserState.targets = targets;
        const newState = {
          get sessionId() { return sessionId; },

          get send() { return send; }
        };

        await send('Target.setDiscoverTargets', { discover: true });
        await send('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: false, flatten: true });

        if (targets.length === 0) {
          const { targetId } = await connection.send('Target.createTarget', { url: 'about:blank' });
          const newTarget = { targetId, title: 'New Tab', url: 'about:blank', type: 'page' };
          targets.push(newTarget);
        }

        browser = new TerminalBrowser({
          tabWidth: Math.round(Math.max(15, terminal.width / 3)),
          initialTabs: targets.map(t => ({
            title: t.title || new URL(t.url || 'about:blank').hostname,
            url: t.url || 'about:blank',
          })),
        }, () => newState);

        browser.on('tabSelected', async (tab) => {
          const index = browser.getTabs().findIndex(t => t.title === tab.title && t.url === tab.url);
          BrowserState.selectedTabIndex = index;
          browser.selectedTabIndex = index;
          BrowserState.activeTarget = targets[index];
          const {targetId} = BrowserState.activeTarget;
          browser.setAddress(tab.url);
          browserbox.send(JSON.stringify({messageId: messageId++, zombie:{events: [
            {command: {
              name: "Target.activateTarget",
              params: {targetId},
            }},
            {command:{
              isZombieLordCommand: true,
              name: "Connection.activateTarget",
              params: {
                targetId, source: mySource
              }
            }}
          ]}}));
          await selectTabAndRender();
        });

        browser.on('newTabRequested', async (tab) => {
          DEBUG && terminal.cyan(`Creating new remote tab: ${tab.title}\n`);
          try {
            const { targetId } = await send('Target.createTarget', { url: tab.url || 'about:blank' });
            const newTarget = { targetId, title: tab.title, url: tab.url || 'about:blank', type: 'page' };
            targets.push(newTarget);
            BrowserState.targets = targets;

            browser.addTabToUI({ title: newTarget.title, url: newTarget.url });
            browser.focusedTabIndex = browser.tabs.length - 1;
            browser.selectedTabIndex = browser.focusedTabIndex;
            BrowserState.selectedTabIndex = browser.selectedTabIndex;
            BrowserState.activeTarget = newTarget;

            await selectTabAndRender();
          } catch (error) {
            DEBUG && terminal.red(`Failed to create new tab: ${error.message}\n`);
          }
        });

        browser.on('tabClosed', async (index) => {
          const targetId = targets[index].targetId;
          targets.splice(index, 1);
          BrowserState.targets = targets;
          DEBUG && terminal.cyan(`Closing remote target: ${targetId}\n`);
          try {
            await send('Target.closeTarget', { targetId });
          } catch (error) {
            DEBUG && terminal.red(`Failed to close target ${targetId}: ${error.message}\n`);
          }
          if (BrowserState.selectedTabIndex === index) {
            BrowserState.selectedTabIndex = Math.min(index, targets.length - 1);
            BrowserState.activeTarget = targets[BrowserState.selectedTabIndex] || null;
            await selectTabAndRender();
          }
        });

        browser.on('navigate', async (url) => {
          const normalizedUrl = normalizeUrl(url);
          DEBUG && terminal.cyan(`Navigating to: ${normalizedUrl}\n`);
          send('Page.navigate', { url: normalizedUrl }, sessionId);
          await refreshTerminal({ send, sessionId, state: initializeState(), addressBar: null });
        });

        browser.on('back', async () => {
          const navigated = await goBack(sessionId);
          if (navigated) {
            await refreshTerminal({ send, sessionId, state: initializeState(), addressBar: null });
          }
        });

        browser.on('forward', async () => {
          const navigated = await goForward(sessionId);
          if (navigated) {
            await refreshTerminal({ send, sessionId, state: initializeState(), addressBar: null });
          }
        });

        await selectTabAndRender();

        process.on('SIGINT', () => {
          if (cleanup) cleanup();
          browser.destroy();
          if (socket) socket.close();
          terminal.clear();
          terminal.green('Exiting...\n');
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
    // Data processing helpers
      function debounce(func, delay) {
        let timeoutId;
        return (...args) => {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => func(...args), delay);
        };
      }

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

      function updateTabData(targetId, title, url) {
        const targetIndex = BrowserState.targets.findIndex(t => t.targetId === targetId);
        if (targetIndex !== -1) {
          BrowserState.targets[targetIndex].title = title;
          BrowserState.targets[targetIndex].url = url;
          if (targetIndex < browser.tabs.length) {
            browser.setTab(targetIndex, { title, url });
          }
        } else {
          DEBUG && console.warn(`Target with ID ${targetId} not found`);
        }
      }

      async function fetchSnapshot({ send, sessionId }) {
        try {
          DEBUG && terminal.cyan('Enabling DOM and snapshot domains...\n');
          // add a map to only do this 1 time per session. Also throw in a Page.reload to trigger it if it locks for good measure
          await Promise.all([
            send('DOM.enable', {}, sessionId),
            send('DOMSnapshot.enable', {}, sessionId),
          ]);

          DEBUG && terminal.cyan('Capturing snapshot...\n');
          const snapshot = await send('DOMSnapshot.captureSnapshot', {
            computedStyles: ['display', 'visibility', 'overflow', 'position', 'width', 'height', 'transform', 'opacity'],
            includePaintOrder: true,
          }, sessionId);
          if (!snapshot?.documents?.length) {
            return;
          }
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
        } catch(e) {
          DEBUG && console.warn(e);
          return {};
        }
      }

      async function pollForSnapshot({ send, sessionId, maxAttempts = 4, interval = 1000 }) {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          const { snapshot, viewportWidth, viewportHeight, viewportX, viewportY } = await fetchSnapshot({ send, sessionId });
          if ( snapshot ) {
            Object.assign(state, {
              viewportHeight, viewportWidth, 
            });
            const { textLayoutBoxes } = Layout.extractTextLayoutBoxes({ snapshot, terminal });
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
        let currentUrl = BrowserState.activeTarget.url;
        let addressBarActive = false;

        const drawAddressBar = () => {
          term.moveTo(1, 1).eraseLine();
          term.bgBlue.white(` URL: ${currentUrl} (Press 'a' to edit) `);
        };

        const activateAddressBar = () => {
          if (addressBarActive) return;
          addressBarActive = true;
          term.moveTo(6, 1).eraseLineAfter();
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
      async function getTerminalSize() {
        const size = { columns: terminal.width, rows: terminal.height };
        if (!size.columns || !size.rows) {
          return { columns: 80, rows: 24 };
        }
        return size;
      }

      function renderLayout({ layoutState, renderedBoxes }) {
        if (!layoutState) return;
        renderBoxes({ ...layoutState, renderedBoxes });
      }

      async function refreshTerminal({ send, sessionId, state, addressBar }) {
        try {
          // sometimes this line errors out and poll returns nothing. I think we could try a page reload
          // and try to repro and figure it out
          const { snapshot, viewportWidth, viewportHeight, viewportX, viewportY } = await pollForSnapshot({ send, sessionId });
          if ( ! snapshot ) return;
          state.currentScrollY = viewportY;
          const layoutState = await Layout.prepareLayoutState({ snapshot, viewportWidth, viewportHeight, viewportX, viewportY, getTerminalSize, terminal });

          terminal.clear();
          terminal.bgDefaultColor();
          terminal.defaultColor();
          browser.render();

          if (layoutState) {
            state.clickableElements = layoutState.clickableElements;
            state.layoutToNode = layoutState.layoutToNode;
            state.nodeToParent = layoutState.nodeToParent;
            state.nodes = layoutState.nodes;

            renderLayout({ layoutState, renderedBoxes: state.renderedBoxes });
            state.isInitialized = true;
            DEBUG && terminal.cyan(`Found ${layoutState.visibleBoxes.length} visible text boxes.\n`);
          } else {
            DEBUG && terminal.yellow('No text boxes found after polling.\n');
            renderLayout({ layoutState, renderedBoxes: state.renderedBoxes });
            state.isInitialized = true;
          }
        } catch (error) {
          if (DEBUG) console.warn(error);
          DEBUG && terminal.red(`Error printing text layout: ${error.message}\n`);
        }
      }

      function renderBoxes(layoutState) {
        const { visibleBoxes, termWidth, termHeight, viewportX, viewportY, clickableElements, renderedBoxes } = layoutState;
        renderedBoxes.length = 0;

        for (const box of visibleBoxes) {
          const { text, boundingBox, isClickable, termX, termY, ancestorType, backendNodeId, layoutIndex, nodeIndex, type } = box;
          const renderX = Math.max(1, termX + 1);
          const renderY = Math.max(5, termY + 1);

          if (renderX > termWidth || renderY > termHeight + 4) continue;

          // Compute available width in the terminal
          const displayWidth = Math.max(0, termWidth - renderX + 1);
          let displayText = text.substring(0, displayWidth); // Truncate text to fit terminal
          let termWidthForBox;

          if (type === 'input' && boundingBox?.width && layoutState.viewportWidth) {
            // Scale GUI width to terminal width
            const scaleFactor = termWidth / layoutState.viewportWidth; // Pixels to characters
            termWidthForBox = Math.round(boundingBox.width * scaleFactor);
            // Clamp to ensure it fits within the terminal and isn't too small
            termWidthForBox = Math.max(10, Math.min(termWidthForBox, displayWidth));
            logClicks(`Input sizing for backendNodeId: ${backendNodeId}, boundingBox.width: ${boundingBox.width}, viewportWidth: ${layoutState.viewportWidth}, scaleFactor: ${scaleFactor}, termWidth: ${termWidthForBox}`);
          } else {
            // For non-inputs or if boundingBox.width is missing, use displayText length
            termWidthForBox = displayText.length;
          }

          const renderedBox = {
            text,
            type,
            boundingBox,
            isClickable,
            termX: renderX,
            termY: renderY,
            termWidth: termWidthForBox, // Set termWidth based on scaling or displayText
            termHeight: 1,
            viewportX,
            viewportY,
            viewportWidth: layoutState.viewportWidth,
            viewportHeight: layoutState.viewportHeight,
            backendNodeId,
            layoutIndex,
            nodeIndex,
          };

          if (type === 'input') {
            logClicks(`Drawing input field for backendNodeId: ${backendNodeId}`);
            const currentBackendNodeId = backendNodeId;
            const fallbackValue = text.startsWith('[INPUT') ? '' : text;

            // Fire off async call to fetch live value, but don't await
            send('DOM.resolveNode', { backendNodeId: currentBackendNodeId }, sessionId)
              .then(resolveResult => {
                if (!resolveResult?.object?.objectId) {
                  throw new Error('Node no longer exists');
                }
                const objectId = resolveResult.object.objectId;
                return send('Runtime.callFunctionOn', {
                  objectId,
                  functionDeclaration: 'function() { return this.value; }',
                  arguments: [],
                  returnByValue: true,
                }, sessionId);
              })
              .then(valueResult => {
                let liveValue = fallbackValue;
                if (valueResult?.result?.value !== undefined) {
                  liveValue = String(valueResult.result.value);
                  logClicks(`Fetched live value for backendNodeId: ${currentBackendNodeId}: "${liveValue}"`);
                }

                // Use termWidthForBox as the width for drawInputField
                const inputField = browser.drawInputField({
                  x: renderX,
                  y: renderY,
                  width: termWidthForBox, // Use scaled termWidth
                  key: currentBackendNodeId,
                  initialValue: liveValue,
                  onChange: async (value) => {
                    try {
                      const resolveResult = await send('DOM.resolveNode', { backendNodeId: currentBackendNodeId }, sessionId);
                      if (!resolveResult?.object?.objectId) {
                        throw new Error('Node no longer exists');
                      }
                      const objectId = resolveResult.object.objectId;
                      const script = `function() {
                        this.value = ${JSON.stringify(value)};
                        this.dispatchEvent(new Event('input', { bubbles: true }));
                        this.dispatchEvent(new Event('change', { bubbles: true }));
                      }`;
                      await send('Runtime.callFunctionOn', {
                        objectId,
                        functionDeclaration: script,
                        arguments: [],
                        returnByValue: true,
                      }, sessionId);
                      logClicks(`Updated remote value for backendNodeId: ${currentBackendNodeId} to "${value}"`);
                    } catch (error) {
                      logClicks(`Failed to set input value for backendNodeId ${currentBackendNodeId}: ${error.message}`);
                      browser.redrawUnfocusedInput(currentBackendNodeId);
                      browser.focusedElement = 'tabs';
                      browser.inputFields.delete(String(currentBackendNodeId));
                      browser.render();
                    }
                  },
                });

                // Update renderedBox.termWidth if necessary (should match termWidthForBox)
                renderedBox.termWidth = inputField.width;
                renderedBoxes.push(renderedBox);

                // Update clickable elements if necessary
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

                const inputField = browser.drawInputField({
                  x: renderX,
                  y: renderY,
                  width: termWidthForBox, // Use scaled termWidth
                  key: currentBackendNodeId,
                  initialValue: fallbackValue,
                  onChange: async (value) => {
                    try {
                      const resolveResult = await send('DOM.resolveNode', { backendNodeId: currentBackendNodeId }, sessionId);
                      if (!resolveResult?.object?.objectId) {
                        throw new Error('Node no longer exists');
                      }
                      const objectId = resolveResult.object.objectId;
                      const script = `function() {
                        this.value = ${JSON.stringify(value)};
                        this.dispatchEvent(new Event('input', { bubbles: true }));
                        this.dispatchEvent(new Event('change', { bubbles: true }));
                      }`;
                      await send('Runtime.callFunctionOn', {
                        objectId,
                        functionDeclaration: script,
                        arguments: [],
                        returnByValue: true,
                      }, sessionId);
                      logClicks(`Updated remote value for backendNodeId ${currentBackendNodeId} to "${value}"`);
                    } catch (error) {
                      logClicks(`Failed to set input value for backendNodeId ${currentBackendNodeId}: ${error.message}`);
                      browser.redrawUnfocusedInput(currentBackendNodeId);
                      browser.focusedElement = 'tabs';
                      browser.inputFields.delete(String(currentBackendNodeId));
                      browser.render();
                    }
                  },
                });

                renderedBox.termWidth = inputField.width;
                renderedBoxes.push(renderedBox);

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
          }
        }
      }

    // Interactivity helpers
      async function getNavigationHistory(sessionId) {
        const { currentIndex, entries } = await send('Page.getNavigationHistory', {}, sessionId);
        return { currentIndex, entries };
      }

      async function goBack(sessionId) {
        const { currentIndex, entries } = await getNavigationHistory(sessionId);
        if (currentIndex > 0) {
          const previousEntry = entries[currentIndex - 1];
          await send('Page.navigateToHistoryEntry', { entryId: previousEntry.id }, sessionId);
          return true;
        } else {
          console.log('No previous page in history');
          return false;
        }
      }

      async function goForward(sessionId) {
        const { currentIndex, entries } = await getNavigationHistory(sessionId);
        if (currentIndex < entries.length - 1) {
          const nextEntry = entries[currentIndex + 1];
          await send('Page.navigateToHistoryEntry', { entryId: nextEntry.id }, sessionId);
          return true;
        } else {
          console.log('No next page in history');
          return false;
        }
      }

      async function handleClick({ termX, termY, renderedBoxes, clickableElements, send, sessionId, clickCounter, refresh, layoutToNode, nodeToParent, nodes }) {
        let clickedBox = null;
        for (let i = renderedBoxes.length - 1; i >= 0; i--) {
          const box = renderedBoxes[i];
          if (termX >= box.termX && termX < box.termX + box.termWidth && termY === box.termY) {
            clickedBox = box;
            break;
          }
        }
        if (!clickedBox || !clickedBox.isClickable) {
          logClicks(`No clickable element at (${termX}, ${termY})`);
          return;
        }

        logClicks(`Clicked box type: ${clickedBox.type}, backendNodeId: ${clickedBox.backendNodeId}`);
        if (clickedBox.type === 'input') {
          if (USE_SYNTHETIC_FOCUS) {
            logClicks(`Focusing input field: ${clickedBox.backendNodeId}`);

            // Focus the remote input element
            try {
              const resolveResult = await send('DOM.resolveNode', { backendNodeId: clickedBox.backendNodeId }, sessionId);
              if (!resolveResult?.object?.objectId) {
                throw new Error('Node no longer exists');
              }
              const objectId = resolveResult.object.objectId;
              await send('Runtime.callFunctionOn', {
                objectId,
                functionDeclaration: 'function() { this.focus(); }',
                arguments: [],
                returnByValue: true,
              }, sessionId);
              logClicks(`Focused remote input with backendNodeId: ${clickedBox.backendNodeId}`);
            } catch (error) {
              logClicks(`Failed to focus remote input with backendNodeId ${clickedBox.backendNodeId}: ${error.message}`);
            }

            // Focus locally in the TUI
            browser.focusInput(clickedBox.backendNodeId);

            // Calculate cursor position based on click
            const inputState = browser.inputFields.get(String(clickedBox.backendNodeId));
            if (inputState) {
              const relativeX = termX - clickedBox.termX; // Position within the input
              inputState.cursorPosition = Math.min(relativeX, inputState.value.length); // Clamp to value length
              browser.redrawFocusedInput(); // Redraw to show cursor
            }
            return;
          } else {
            logClicks(`Focusing input field: ${clickedBox.backendNodeId}`);

            // Focus the remote input element with a mouse click
            try {
              // Calculate the center of the input element in GUI coordinates
              const guiX = clickedBox.boundingBox.x + clickedBox.boundingBox.width / 2;
              const guiY = clickedBox.boundingBox.y + clickedBox.boundingBox.height / 2;
              const clickX = guiX + clickedBox.viewportX;
              const clickY = guiY + clickedBox.viewportY;

              // Send mouse down event
              await send('Input.dispatchMouseEvent', {
                type: 'mousePressed',
                x: clickX,
                y: clickY,
                button: 'left',
                clickCount: 1,
              }, sessionId);

              // Send mouse up event
              await send('Input.dispatchMouseEvent', {
                type: 'mouseReleased',
                x: clickX,
                y: clickY,
                button: 'left',
                clickCount: 1,
              }, sessionId);

              logClicks(`Focused remote input with backendNodeId: ${clickedBox.backendNodeId} at GUI coordinates (${clickX}, ${clickY})`);
            } catch (error) {
              logClicks(`Failed to focus remote input with backendNodeId ${clickedBox.backendNodeId}: ${error.message}`);
            }

            // Focus locally in the TUI
            browser.focusInput(clickedBox.backendNodeId);

            // Calculate cursor position based on click
            const inputState = browser.inputFields.get(String(clickedBox.backendNodeId));
            if (inputState) {
              const relativeX = termX - clickedBox.termX;
              inputState.cursorPosition = Math.min(relativeX, inputState.value.length);
              browser.redrawFocusedInput();
            }
            return;
          }
        }

        // Click simulation for other elements
        logClicks("Simulating click on non-input element");
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
          const clickResult = await send('Runtime.callFunctionOn', {
            objectId,
            functionDeclaration: 'function() { this.click(); }',
            arguments: [],
            returnByValue: true
          }, sessionId);
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
            const circleResult = await send('Runtime.callFunctionOn', {
              objectId,
              functionDeclaration: script,
              arguments: [],
              returnByValue: true
            }, sessionId);
            DEBUG && debugLog(`Circle injection result: ${JSON.stringify(circleResult)}`);
          } catch (error) {
            DEBUG && debugLog(`Circle injection failed: ${error.message}`);
          }
        }

        await refresh();
      }

    // Main render 
      async function printTextLayoutToTerminal({ send, sessionId, onTabSwitch }) {
        state = initializeState();
        const refresh = () => refreshTerminal({ send, sessionId, state, addressBar: null });
        const debouncedRefresh = debounce(refresh, DEBOUNCE_DELAY);

        browser.on('renderContent', () => {
          if (state.layoutState) {
            console.log('Rendering content');
            renderLayout({ layoutState: state.layoutState, renderedBoxes: state.renderedBoxes });
          }
        });

        browser.on('click', async ({ x, y }) => {
          if (!state.isInitialized) return;
          await handleClick({
            termX: x,
            termY: y,
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
        });

        browser.on('scroll', async ({ direction }) => {
          const lineHeight = Math.round(state.viewportHeight / terminal.height);
          const deltaY = direction * lineHeight;
          if (direction < 0 && state.currentScrollY <= 0) return;
          await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 0, y: 0, deltaX: 0, deltaY }, sessionId);
          debouncedRefresh();
        });

        await refresh(); // This should trigger the initial render
        return () => {
          state.isListening = false;
          browser.stopListening();
        };
      }
    // helpers
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
          BrowserState.targets = targets;
        } catch (error) {
          if (DEBUG) console.warn(error);
          terminal.red(`Error fetching tabs: ${error.message}\n`);
          process.exit(1);
        }

        if (!targets.length) {
          terminal.yellow('No page or tab targets available.\n');
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
        console.log(wsDebuggerUrl);
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
            logMessage('RECEIVE', message, terminal);
          } catch (error) {
            if (DEBUG) console.warn(error);
            terminal.red(`Invalid message: ${String(data).slice(0, 50)}...\n`);
            return;
          }
          const key = `${message.sessionId || 'root'}:${message.id}`;
          if (message.id && Resolvers[key]) {
            Resolvers[key](message.result || message.error);
            delete Resolvers[key];
          } else {
            if (message.method === 'Target.targetInfoChanged') {
              const { targetInfo } = message.params;
              const { targetId, title, url } = targetInfo;
              updateTabData(targetId, title, url);
              debouncedRefresh();
            }
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
            resolve({});
          }, 10000);

          try {
            logMessage('SEND', message, terminal);
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

       
        let bbResolve;
        const bbReady = new Promise(res => bbResolve = res);
        let wsBBUrl = new URL(loginUrl);
        wsBBUrl.protocol = 'wss:'
        wsBBUrl.searchParams.set('session_token', wsBBUrl.searchParams.get('token'));
        wsBBUrl.pathname = '/';

        const browserbox = new WebSocket(wsBBUrl, {
          headers: { 'x-browserbox-local-auth': token },
          agent: new Agent({ rejectUnauthorized: false }),
        });

        browserbox.on('open', bbResolve);

        await bbReady;
        console.log('Connected to browserbox');

        return { send, socket, targets, cookieHeader, browserbox };
      }

