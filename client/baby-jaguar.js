#!/usr/bin/env node

// CyberJaguar - BrowserBox TUI Browser Application
  // Setup
    // imports
      import { WebSocket } from 'ws';
      import { appendFileSync } from 'fs';
      import { Agent } from 'https';
      import TK from 'terminal-kit';
      import TerminalBrowser from './terminal-browser.js';
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
    let browser;
    let sessionId;

    const selectTabAndRender = async () => {
      if (cleanup) cleanup();

      const selectedTarget = targets[BrowserState.selectedTabIndex];
      const targetId = selectedTarget.targetId;
      BrowserState.activeTarget = selectedTarget;

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

        // Initialize TerminalBrowser
        browser = new TerminalBrowser({
          tabWidth: Math.round(Math.max(15, terminal.width / 3)),
          initialTabs: targets.map(t => ({
            title: t.title || new URL(t.url || 'about:blank').hostname,
            url: t.url || 'about:blank',
          })),
        });

        // Event handlers for TerminalBrowser
        browser.on('tabSelected', async (tab) => {
          const index = browser.getTabs().findIndex(t => t.title === tab.title && t.url === tab.url);
          BrowserState.selectedTabIndex = index;
          browser.selectedTabIndex = index; // Sync with widget
          BrowserState.activeTarget = targets[index];
          browser.setAddress(tab.url);
          await selectTabAndRender();
        });

        browser.on('navigate', async (url) => {
          const normalizedUrl = normalizeUrl(url);
          DEBUG && terminal.cyan(`Navigating to: ${normalizedUrl}\n`);
          send('Page.navigate', { url: normalizedUrl }, sessionId);
          await refreshTerminal({ send, sessionId, state: initializeState(), addressBar: null });
        });

        browser.on('back', async () => {
          send('Page.goBack', {}, sessionId);
          await refreshTerminal({ send, sessionId, state: initializeState(), addressBar: null });
        });

        browser.on('forward', async () => {
          send('Page.goForward', {}, sessionId);
          await refreshTerminal({ send, sessionId, state: initializeState(), addressBar: null });
        });

        browser.on('tabAdded', (tab) => {
          // Placeholder for new tab creation
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
        DEBUG && debugLog(`Terminal size: ${termWidth}x${termHeight}`);
        DEBUG && debugLog(`Viewport dimensions: ${viewportWidth}x${viewportHeight}`);

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
          box.termY = Math.ceil(adjustedY * scaleY) + 4; // Shift down 4 rows for new UI
          box.termWidth = box.text.length;
          box.termHeight = 1;
        });

        const { groups, boxToGroup } = groupBoxes(visibleBoxes);

        return {
          visibleBoxes,
          groups,
          boxToGroup,
          termWidth,
          termHeight: termHeight - 4, // Adjust usable height
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
          const parentIndex = nodeToParent.get(nodeIndex);
          const backendNodeId = nodes.backendNodeId[nodeIndex]; // Add backendNodeId
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

          textLayoutBoxes.push({ text, boundingBox, isClickable, parentIndex, ancestorType, backendNodeId, layoutIndex, nodeIndex }); // Add backendNodeId, layoutIndex, nodeIndex
          DEBUG && terminal.magenta(`Text Box ${i}: "${text}" at (${boundingBox.x}, ${boundingBox.y}) | parentIndex: ${parentIndex} | backendNodeId: ${backendNodeId} | isClickable: ${isClickable} | ancestorType: ${ancestorType}\n`);
        }

        return { textLayoutBoxes, clickableElements, layoutToNode, nodeToParent, nodes }; // Pass these for handleClick
      }

      function getAncestorInfo(nodeIndex, nodes, strings) {
        let currentIndex = nodeIndex;
        let path = [];
        while (currentIndex !== -1) {
          if (typeof currentIndex !== 'number' || currentIndex < 0 || currentIndex >= nodes.nodeName.length) {
            DEBUG && debugLog(`Invalid nodeIndex in getAncestorInfo: ${nodeIndex}, currentIndex: ${currentIndex}, path: ${path.join(' -> ')}`);
            return 'normal';
          }

          const nodeNameIndex = nodes.nodeName[currentIndex];
          if (typeof nodeNameIndex === 'undefined') {
            DEBUG && debugLog(`Undefined nodeName for currentIndex: ${currentIndex}, nodeIndex: ${nodeIndex}, path: ${path.join(' -> ')}`);
            return 'normal';
          }
          const nodeName = strings[nodeNameIndex];
          const attributes = nodes.attributes[currentIndex] || [];
          const isClickable = nodes.isClickable && nodes.isClickable.index.includes(currentIndex);
          path.push(`${currentIndex}:${nodeName}${isClickable ? '(clickable)' : ''}`);

          // Log attributes for debugging
          let attrDebug = [];
          for (let i = 0; i < attributes.length; i += 2) {
            const keyIndex = attributes[i];
            const valueIndex = attributes[i + 1];
            const key = strings[keyIndex];
            const value = strings[valueIndex];
            attrDebug.push(`${key}=${value}`);
          }
          DEBUG && debugLog(`Node ${currentIndex}: ${nodeName}, clickable: ${isClickable}, attributes: ${attrDebug.join(', ')}`);

          if (nodeName === 'BUTTON' || (nodeName === 'INPUT' && attributes.some((idx, i) => i % 2 === 0 && strings[idx] === 'type' && strings[attributes[i + 1]] === 'button'))) {
            DEBUG && debugLog(`Classified as button at node ${currentIndex}, path: ${path.join(' -> ')}`);
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
          if (nodeName === 'A' && (hasHref || hasOnclick)) {
            DEBUG && debugLog(`Classified as hyperlink at node ${currentIndex}, path: ${path.join(' -> ')}`);
            return 'hyperlink';
          }

          if (isClickable) {
            DEBUG && debugLog(`Classified as other_clickable at node ${currentIndex}, path: ${path.join(' -> ')}`);
            return 'other_clickable';
          }

          currentIndex = nodes.parentIndex[currentIndex];
        }
        DEBUG && debugLog(`Classified as normal for nodeIndex ${nodeIndex}, path: ${path.join(' -> ')}`);
        return 'normal';
      }

      // Helper to poll for snapshot until text boxes are found (max 4 attempts, 1s intervals)
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
        return await fetchSnapshot({ send, sessionId }); // Return last snapshot even if empty
      }

    // Browser UI
      // Helper to parse and normalize URLs
      function normalizeUrl(input) {
        const trimmedInput = input.trim();
        
        // Check if it looks like a URL (with or without scheme)
        const urlPattern = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/i;
        if (urlPattern.test(trimmedInput)) {
          // If it’s a hostname or URL without scheme, add https://
          if (!/^https?:\/\//i.test(trimmedInput)) {
            return `https://${trimmedInput}`;
          }
          return trimmedInput; // Already has scheme, return as-is
        }
        
        // Otherwise, treat as search keywords and redirect to DuckDuckGo
        const query = encodeURIComponent(trimmedInput);
        return `https://duckduckgo.com/?q=${query}`;
      }

      // Helper to draw and manage the address bar
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
                  await refresh(); // Refresh after navigation with polling
                } catch (err) {
                  term.red(`Navigation failed: ${err.message}\n`);
                }
              } else {
                refresh(); // Redraw if canceled
              }
            }
          );
        };

        return { drawAddressBar, activateAddressBar, isActive: () => addressBarActive, getUrl: () => currentUrl };
      }

    // Layout calculation and Render helpers
      // the layout to the terminal
      function renderLayout({ layoutState, renderedBoxes }) {
        if (!layoutState) return;
        renderBoxes({ ...layoutState, renderedBoxes }); // No clear here, handled in refreshTerminal
      }
      // Adjusted refreshTerminal with polling and debug flags
      async function refreshTerminal({ send, sessionId, state, addressBar }) {
        try {
          const { snapshot, viewportWidth, viewportHeight, viewportX, viewportY } = await pollForSnapshot({ send, sessionId });
          state.currentScrollY = viewportY;
          const layoutState = await prepareLayoutState({ snapshot, viewportWidth, viewportHeight, viewportX, viewportY });

          terminal.clear();
          terminal.bgDefaultColor();
          browser.render(); // Redraw TerminalBrowser UI

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

      // Pass 3: Render boxes with truncation
      function renderBoxes(layoutState) {
        const { visibleBoxes, termWidth, termHeight, viewportX, viewportY, clickableElements, renderedBoxes } = layoutState;
        const usedCoords = new Set();

        renderedBoxes.length = 0;

        for (const box of visibleBoxes) {
          const { text, boundingBox, isClickable, termX, termY, ancestorType, backendNodeId, layoutIndex, nodeIndex } = box;
          const renderX = Math.max(1, termX + 1);
          const renderY = Math.max(5, termY + 1); // Ensure rendering starts below UI (row 5)
          const key = `${renderX},${renderY}`;

          if (renderX > termWidth || renderY > termHeight + 4) { // Adjust for UI offset
            DEBUG && debugLog(`Skipped "${text}" at (${renderX}, ${renderY}) - beyond bounds`);
            continue;
          }

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
            originalTermX: termX,
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

          DEBUG && debugLog(`Rendering "${displayText}": Page (${boundingBox.x}, ${boundingBox.y}), Terminal (${renderX}, ${renderY}), Type: ${ancestorType}`);
          terminal.moveTo(renderX, renderY);
          terminal.defaultColor().bgDefaultColor(); // Reset to default colors before drawing

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

        DEBUG && terminal.moveTo(1, termHeight + 4).green('Text layout printed successfully!\n'); // Adjust debug message position
      }

      // Pass 2: Apply gaps between groups
        function applyGaps(layoutState) {
          const { groups } = layoutState;
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
                gap = CONFIG.GAP_SIZE;
              }
              const targetX = prevRight + gap;
              if (currLeft < targetX) {
                const shift = targetX - currLeft;
                currGroup.forEach(box => {
                  box.termX += shift;
                  DEBUG && debugLog(`Added gap for group box "${box.text}": shifted from ${box.termX - shift} to ${box.termX}`);
                });
              }
            }
          }
        }
      // Pass 1: De-conflict groups by column walk
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
          group.forEach(box => {
            box.termX += 1;
            DEBUG && debugLog(`Moved group ${groupId} box "${box.text}" right to termX=${box.termX}`);
          });
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
              if (boxOverlapsThisPosition(box, c, r)) {
                currentBoxes.add(box);
              }
              if (boxHasLeftEdgeCrossingThisPosition(box, c, r)) {
                newBoxes.add(box);
              }
            }

            const oldBoxes = setDifference(currentBoxes, newBoxes);
            if (oldBoxes.size > 1) {
              DEBUG && debugLog(`Warning: Multiple old boxes at (${c}, ${r}): ${oldBoxes.size}`);
            }

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
      function groupBoxes(visibleBoxes) {
        let groups = [];
        const boxToGroup = new Map();

        if (CONFIG.useTextByElementGrouping) {
          const groupsMap = new Map();
          for (const box of visibleBoxes) {
            const groupKey = box.parentIndex !== undefined ? box.parentIndex : `individual_${visibleBoxes.indexOf(box)}`;
            if (!groupsMap.has(groupKey)) {
              groupsMap.set(groupKey, []);
            }
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

        groups.forEach((group, groupId) => {
          group.forEach(box => boxToGroup.set(box, groupId));
        });

        DEBUG && debugLog(`Grouped ${visibleBoxes.length} boxes into ${groups.length} groups`);
        return { groups, boxToGroup };
      }

    // Interactivity helpers
      // Adjusted setupEventHandlers to include address bar key
      function setupEventHandlers({ terminal, send, sessionId, state, refresh, onTabSwitch, addressBar }) {
        const debouncedRefresh = debounce(refresh, DEBOUNCE_DELAY);

        terminal.on('mouse', async (event, data) => {
          if (!state.isListening || addressBar.isActive()) return;

          if (event === 'MOUSE_LEFT_BUTTON_PRESSED') {
            if (!state.isInitialized) {
              DEBUG && debugLog(`Click ignored: Terminal not yet initialized`);
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
              DEBUG && debugLog(`Ignoring upward scroll: already at top (scrollOffsetY=${state.currentScrollY})`);
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

      async function handleClick({ termX, termY, renderedBoxes, clickableElements, send, sessionId, clickCounter, refresh, layoutToNode, nodeToParent, nodes }) {
        DEBUG && debugLog(`handleClick called with termX: ${termX}, termY: ${termY}, layoutToNode: ${layoutToNode ? 'defined' : 'undefined'}, nodeToParent: ${nodeToParent ? 'defined' : 'undefined'}, nodes: ${nodes ? 'defined' : 'undefined'}`);

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

        // Local visual flash
        terminal.moveTo(clickedBox.termX, clickedBox.termY);
        terminal.yellow(clickedBox.text);
        await sleep(300);
        await refresh();

        // Calculate GUI coordinates (for logging only, not used for clicking)
        const relativeX = (termX - clickedBox.termX) / clickedBox.termWidth;
        const relativeY = (termY - clickedBox.termY) / clickedBox.termHeight;
        const guiX = clickedBox.boundingBox.x + relativeX * clickedBox.boundingBox.width;
        const guiY = clickedBox.boundingBox.y + relativeY * clickedBox.boundingBox.height;
        const clickX = guiX + clickedBox.viewportX;
        const clickY = guiY + clickedBox.viewportY;

        // Log the click details
        const clickId = clickCounter.value++;
        const nodeTag = clickedBox.ancestorType || 'unknown';
        const nodeText = clickedBox.text;
        const clickEvent = { type: 'click' };
        try {
          appendFileSync('clicks.log', `${new Date().toISOString()} - Click ${clickId}: T coords (${termX}, ${termY}), Node (tag: ${nodeTag}, text: "${nodeText}"), G coords (${clickX}, ${clickY}), Event: ${JSON.stringify(clickEvent)}\n`);
        } catch (error) {
          console.error(`Failed to write to clicks log: ${error.message}`);
        }

        // Ensure required data is available
        if (!layoutToNode || !nodeToParent || !nodes) {
          DEBUG && debugLog(`Cannot process click: layoutToNode, nodeToParent, or nodes not available. layoutToNode: ${layoutToNode}, nodeToParent: ${nodeToParent}, nodes: ${nodes}`);
          return;
        }

        // Find the nearest clickable element (traverse up if necessary)
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

        // Resolve the node to a RemoteObject
        let objectId;
        try {
          const resolveResult = await send('DOM.resolveNode', { backendNodeId }, sessionId);
          objectId = resolveResult.object.objectId;
          DEBUG && debugLog(`Resolved backendNodeId ${backendNodeId} to objectId ${objectId}`);
        } catch (error) {
          DEBUG && debugLog(`Failed to resolve backendNodeId ${backendNodeId}: ${error.message}`);
          return;
        }

        // Execute a click on the remote object
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

        // Inject a black circle using getBoundingClientRect for accurate positioning
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
          DEBUG && debugLog(`Injecting circle script for objectId ${objectId}`);
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

        await refresh();
      }

    // Main render 
      async function printTextLayoutToTerminal({ send, sessionId, onTabSwitch }) {
        const state = initializeState();
        const refresh = () => refreshTerminal({ send, sessionId, state, addressBar: null });
        const debouncedRefresh = debounce(refresh, DEBOUNCE_DELAY);

        terminal.on('mouse', async (event, data) => {
          if (!state.isListening) return;

          // Handle clicks below the UI
          if (event === 'MOUSE_LEFT_BUTTON_PRESSED' && data.y > 4) {
            if (!state.isInitialized) {
              DEBUG && debugLog(`Click ignored: Terminal not yet initialized`);
              return;
            }
            await handleClick({
              termX: data.x,
              termY: data.y,
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
          } 
          // Restore original scrolling behavior for content area
          else if ((event === 'MOUSE_WHEEL_UP' || event === 'MOUSE_WHEEL_DOWN') && data.y > 4) {
            const deltaY = event === 'MOUSE_WHEEL_UP' ? -state.scrollDelta : state.scrollDelta;
            if (event === 'MOUSE_WHEEL_UP' && state.currentScrollY <= 0) {
              DEBUG && debugLog(`Ignoring upward scroll: already at top (scrollOffsetY=${state.currentScrollY})`);
              return;
            }
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

    // helpers
      async function getTerminalSize() {
        const size = { columns: terminal.width, rows: terminal.height };
        if (!size.columns || !size.rows) {
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
          BrowserState.targets = targets;
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

      // logging 
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

        function debugLog(message) {
          try {
            appendFileSync('debug-coords.log', `${new Date().toISOString()} - ${message}\n`);
          } catch (error) {
            console.error(`Failed to write to debug log: ${error.message}`);
          }
        }

