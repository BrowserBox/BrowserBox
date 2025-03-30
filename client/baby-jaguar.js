#!/usr/bin/env node
/*
todo
we should ensure longest text in box expands the termbox appropriately. (apparently it is, we need to look at log because there's still sometimes overlap at right)
we should deconflict some lines (small text can vert overlap, with hoz alignment algorithm applied vertically)
*/
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

    // DEBUG 
      const DEBUG = process.env.JAGUAR_DEBUG === 'true' || false;

    // Constants and state
      const BrowserState = {
        targets: [],
        activeTarget: null,
        selectedTabIndex: 0
      };
      const HORIZONTAL_COMPRESSION = 1.0;
      const VERTICAL_COMPRESSION = 1.0;
      const GAP = 1;
      const DEBOUNCE_DELAY = 280;
      const LOG_FILE = 'cdp.log';
      const args = process.argv.slice(2);

      let socket;
      let cleanup;
      let targets;
      let cookieHeader;
      let send;
      let browser;
      let sessionId;
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
        cookieHeader = connection.cookieHeader;
        BrowserState.targets = targets;

        await send('Target.setDiscoverTargets', { discover: true });
        await send('Target.setAutoAttach', { autoAttac: true, waitForDebuggerOnStart: false, flatten: true });

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
        });

        browser.on('tabSelected', async (tab) => {
          const index = browser.getTabs().findIndex(t => t.title === tab.title && t.url === tab.url);
          BrowserState.selectedTabIndex = index;
          browser.selectedTabIndex = index;
          BrowserState.activeTarget = targets[index];
          browser.setAddress(tab.url);
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
          console.warn(`Target with ID ${targetId} not found`);
        }
      }

      async function fetchSnapshot({ send, sessionId }) {
        DEBUG && terminal.cyan('Enabling DOM and snapshot domains...\n');
        await Promise.all([
          send('DOM.enable', {}, sessionId),
          send('DOMSnapshot.enable', {}, sessionId),
        ]);

        DEBUG && terminal.cyan('Capturing snapshot...\n');
        const snapshot = await send('DOMSnapshot.captureSnapshot', {
          computedStyles: [],
          includeDOMRects: true,
          includePaintOrder: true,
          includeBlobs: true
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
      }

      function hasTextBoxDescendant(nodeIdx, childrenMap, textBoxMap) {
        if (textBoxMap.has(nodeIdx)) return true;
        const children = childrenMap.get(nodeIdx) || [];
        return children.some(childIdx => hasTextBoxDescendant(childIdx, childrenMap, textBoxMap));
      }

      // key funcs
          // Helper function to check if one bounding box is fully contained within another
            function isFullyContained(b1, b2) {
              const termB1 = b1.termBox; // {minX, minY, maxX, maxY}
              const termB2 = b2.termBox;

              // b1 is fully contained in b2
              const b1InB2 = termB1.minX >= termB2.minX && 
                             termB1.maxX <= termB2.maxX &&
                             termB1.minY >= termB2.minY && 
                             termB1.maxY <= termB2.maxY;
              
              // b2 is fully contained in b1
              const b2InB1 = termB2.minX >= termB1.minX && 
                             termB2.maxX <= termB1.maxX &&
                             termB2.minY >= termB1.minY && 
                             termB2.maxY <= termB1.maxY;
              
              return b1InB2 || b2InB1;
            }
            function hasGuiOverlap(box1, box2) {
              const a = box1.guiBox;
              const b = box2.guiBox;
              if (!a || !b) return false;
              const result = a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
              debugLog(`Checking GUI overlap between (${a.x}, ${a.y}, ${a.width}, ${a.height}) and (${b.x}, ${b.y}, ${b.width}, ${b.height}): ${result}`);
              return result;
            }
          // Helper function to get the overall bounding box for a list of text boxes
          function getOverallBoundingBox(boxes) {
            if (boxes.length === 0) return null;
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            for (const box of boxes) {
              const b = box.boundingBox;
              minX = Math.min(minX, b.x);
              minY = Math.min(minY, b.y);
              maxX = Math.max(maxX, b.x + b.width);
              maxY = Math.max(maxY, b.y + b.height);
            }
            return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
          }
          function processNode(nodeIdx, childrenMap, textBoxMap, snapshot, nodes) {
            const tagName = nodes.nodeName[nodeIdx] >= 0 ? snapshot.strings[nodes.nodeName[nodeIdx]] : 'Unknown';
            const isTextNode = nodes.nodeType[nodeIdx] === 3;
            let guiBox = { x: 0, y: 0, width: 0, height: 0 };
            let textContent = '';

            // Helper function to collect text content of all text nodes in the subtree
            function collectSubtreeText(nodeIdx) {
              let texts = [];
              if (nodes.nodeType[nodeIdx] === 3) { // Text node
                const textBoxes = snapshot.documents[0].textBoxes;
                const layoutToNode = new Map(snapshot.documents[0].layout.nodeIndex.map((nIdx, lIdx) => [lIdx, nIdx]));
                for (let i = 0; i < textBoxes.layoutIndex.length; i++) {
                  const layoutIdx = textBoxes.layoutIndex[i];
                  if (layoutIdx !== -1 && layoutToNode.get(layoutIdx) === nodeIdx) {
                    const textIndex = snapshot.documents[0].layout.text[layoutIdx];
                    if (textIndex !== -1 && textIndex < snapshot.strings.length) {
                      const text = snapshot.strings[textIndex].substring(textBoxes.start[i], textBoxes.start[i] + textBoxes.length[i]).trim();
                      if (text) texts.push(text);
                    }
                    // Don't break; continue to collect all text boxes for this node
                  }
                }
              }
              const children = childrenMap.get(nodeIdx) || [];
              for (const childIdx of children) {
                texts.push(...collectSubtreeText(childIdx));
              }
              return texts;
            }

            if (isTextNode) {
              const textBoxes = snapshot.documents[0].textBoxes;
              const layoutToNode = new Map(snapshot.documents[0].layout.nodeIndex.map((nIdx, lIdx) => [lIdx, nIdx]));
              let textParts = [];
              for (let i = 0; i < textBoxes.layoutIndex.length; i++) {
                const layoutIdx = textBoxes.layoutIndex[i];
                if (layoutIdx !== -1 && layoutToNode.get(layoutIdx) === nodeIdx) {
                  const bounds = textBoxes.bounds[i];
                  // Update guiBox to encompass all text boxes for this node
                  if (textParts.length === 0) {
                    guiBox = {
                      x: bounds[0],
                      y: bounds[1],
                      width: bounds[2],
                      height: bounds[3]
                    };
                  } else {
                    const minX = Math.min(guiBox.x, bounds[0]);
                    const minY = Math.min(guiBox.y, bounds[1]);
                    const maxX = Math.max(guiBox.x + guiBox.width, bounds[0] + bounds[2]);
                    const maxY = Math.max(guiBox.y + guiBox.height, bounds[1] + bounds[3]);
                    guiBox = {
                      x: minX,
                      y: minY,
                      width: maxX - minX,
                      height: maxY - minY
                    };
                  }
                  const textIndex = snapshot.documents[0].layout.text[layoutIdx];
                  if (textIndex !== -1 && textIndex < snapshot.strings.length) {
                    const text = snapshot.strings[textIndex].substring(textBoxes.start[i], textBoxes.start[i] + textBoxes.length[i]).trim();
                    if (text) textParts.push(text);
                  }
                }
              }
              textContent = textParts.join(' '); // Join all text parts with a space
              if (!textContent) {
                debugLog(`Skipping Node ${nodeIdx} (Tag: #text<>) - Empty text content`);
                return null;
              }
              debugLog(`Node ${nodeIdx} (Tag: #text<${textContent}>) GUI bounds: (${guiBox.x}, ${guiBox.y}, ${guiBox.width}, ${guiBox.height})`);
            } else {
              const layoutIdx = snapshot.documents[0].layout.nodeIndex.indexOf(nodeIdx);
              if (layoutIdx !== -1) {
                const bounds = snapshot.documents[0].layout.bounds[layoutIdx];
                guiBox = {
                  x: bounds[0],
                  y: bounds[1],
                  width: bounds[2],
                  height: bounds[3]
                };
                debugLog(`Node ${nodeIdx} (Tag: ${tagName}) GUI bounds: (${guiBox.x}, ${guiBox.y}, ${guiBox.width}, ${guiBox.height})`);
              } else {
                debugLog(`Node ${nodeIdx} (Tag: ${tagName}) has no GUI bounds in layout`);
              }
            }

            const children = childrenMap.get(nodeIdx) || [];
            let longestText;
            let longestTextLength = 0;
            // Log subtree text content if DEBUG is true
            if (DEBUG) {
              const subtreeTexts = collectSubtreeText(nodeIdx);
              if (subtreeTexts.length > 0) {
                debugLog(`Node ${nodeIdx} (Tag: ${isTextNode ? `#text<${textContent}>` : tagName}) subtree text content: [${subtreeTexts.map(t => `"${t}"`).join(', ')}]`);
              }
              textContent = subtreeTexts.join(' ');
              for( const t of subtreeTexts ) {
                if ( t.length > longestTextLength ) {
                  longestText = t;
                  longestTextLength = t.length;
                }
              }
            }
            debugLog(`Processing Node ${nodeIdx} (Tag: ${isTextNode ? `#text<${textContent}>` : tagName}) with ${children.length} immediate children`);

            if (textBoxMap.has(nodeIdx)) {
              const boxes = textBoxMap.get(nodeIdx);
              DEBUG && console.log(boxes);
              const rows = new Map();
              for (const box of boxes) {
                if (!rows.has(box.termY)) rows.set(box.termY, []);
                if ( box.text.length > longestText ) {
                  longestText = box.text;
                  longestTextLength = longestText.length;
                }
                rows.get(box.termY).push(box);
              }

              for (const [row, rowBoxes] of rows) {
                rowBoxes.sort((a, b) => a.termX - b.termX);
                let lastEndX = -1;
                for (const box of rowBoxes) {
                  if (box.termX <= lastEndX) {
                    const shift = lastEndX + 1 - box.termX;
                    box.termX += shift;
                    box.termBox = {
                      minX: box.termX,
                      minY: box.termY,
                      maxX: box.termX + box.termWidth - 1,
                      maxY: box.termY
                    };
                    debugLog(`Leaf Node ${nodeIdx} (Text: "${box.text}") shifted right by ${shift} to (${box.termX}, ${box.termY})`);
                  } else {
                    box.termBox = {
                      minX: box.termX,
                      minY: box.termY,
                      maxX: box.termX + box.termWidth - 1,
                      maxY: box.termY
                    };
                  }
                  lastEndX = box.termBox.maxX;
                }
              }

              const minX = Math.min(...boxes.map(b => b.termBox.minX));
              const minY = Math.min(...boxes.map(b => b.termBox.minY));
              const maxX = Math.max(...boxes.map(b => b.termBox.maxX));
              const maxY = Math.max(...boxes.map(b => b.termBox.maxY));

              if ( longestText ) {
                const slack = longestText.length - (maxX - minX);
                if ( slack > 0) {
                  maxX += slack;
                }
              }
              const termBox = { minX, minY, maxX, maxY };

              const layoutIdx = snapshot.documents[0].layout.nodeIndex.indexOf(nodeIdx);
              if (layoutIdx !== -1) {
                const bounds = snapshot.documents[0].layout.bounds[layoutIdx];
                guiBox = {
                  x: bounds[0],
                  y: bounds[1],
                  width: bounds[2],
                  height: bounds[3]
                };
              } else {
                const guiMinX = Math.min(...boxes.map(b => b.boundingBox.x));
                const guiMinY = Math.min(...boxes.map(b => b.boundingBox.y));
                const guiMaxX = Math.max(...boxes.map(b => b.boundingBox.x + b.boundingBox.width));
                const guiMaxY = Math.max(...boxes.map(b => b.boundingBox.y + b.boundingBox.height));
                guiBox = { x: guiMinX, y: guiMinY, width: guiMaxX - guiMinX, height: guiMaxY - guiMinY };
              }

              debugLog(`Leaf Node ${nodeIdx} TUI bounds: (${minX}, ${minY}) to (${maxX}, ${maxY}) | GUI bounds: (${guiBox.x}, ${guiBox.y}, ${guiBox.width}, ${guiBox.height})`);
              return { termBox, guiBox, text: textContent };
            }

            const childBoxes = [];
            for (const childIdx of children) {
              const childResult = processNode(childIdx, childrenMap, textBoxMap, snapshot, nodes);
              if (childResult) {
                childBoxes.push({ nodeIdx: childIdx, ...childResult });
              }
            }

            if (childBoxes.length === 0) {
              debugLog(`Node ${nodeIdx} (Tag: ${isTextNode ? `#text<${textContent}>` : tagName}) has no children with text boxes | GUI bounds: (${guiBox.x}, ${guiBox.y}, ${guiBox.width}, ${guiBox.height})`);
              return null;
            }

            const rows = new Map();
            for (const childBox of childBoxes) {
              const row = childBox.termBox.minY;
              if (!rows.has(row)) rows.set(row, []);
              rows.get(row).push(childBox);
            }

            let maxXChild = null;
            let maxXOverall = -Infinity;
            for (const [row, rowBoxes] of rows) {
              rowBoxes.sort((a, b) => a.termBox.minX - b.termBox.minX);
              let lastEndX = -Infinity;
              let lastBox = null;
              for (const childBox of rowBoxes) {
                if (lastBox && childBox.termBox.minX <= lastEndX) {
                  if (!hasGuiOverlap(lastBox, childBox)) {
                    const shift = lastEndX + 1 - childBox.termBox.minX;
                    shiftNode(childBox.nodeIdx, shift, textBoxMap, childrenMap);
                    childBox.termBox.minX += shift;
                    childBox.termBox.maxX += shift;
                    debugLog(`Node ${childBox.nodeIdx} [${JSON.stringify(childBox)}] ("${childBox.text || 'unknown'}") shifted right by ${shift} to (${childBox.termBox.minX}, ${childBox.termBox.minY}) due to TUI overlap and no GUI overlap with previous child ${lastBox.nodeIdx} ("${lastBox.text || 'unknown'}")`);
                  } else {
                    debugLog(`Node ${childBox.nodeIdx} [${JSON.stringify(childBox)}] ("${childBox.text || 'unknown'}") not shifted despite TUI overlap with ${lastBox.nodeIdx} ("${lastBox.text || 'unknown'}") because GUI overlap exists`);
                  }
                }
                if ( childBox.termBox.maxX > maxXOverall ) {
                  maxXChild = childBox
                  maxXOverall = maxXChild.termBox.maxX;
                }
                lastEndX = childBox.termBox.maxX;
                lastBox = childBox;
              }
            }
            if ( maxXChild && textBoxMap.has(maxXChild.nodeIdx) ) {
              maxXChild.termBox.maxX += GAP; 
            }

            const minX = Math.min(...childBoxes.map(cb => cb.termBox.minX));
            const minY = Math.min(...childBoxes.map(cb => cb.termBox.minY));
            const maxX = Math.max(...childBoxes.map(cb => cb.termBox.maxX));
            const maxY = Math.max(...childBoxes.map(cb => cb.termBox.maxY));
            if ( longestText ) {
              const slack = longestText.length - (maxX - minX);
              if ( slack > 0) {
                maxX += slack;
              }
            }
            const termBox = { minX, minY, maxX, maxY };

            debugLog(`Node ${nodeIdx} (Tag: ${isTextNode ? `#text<${textContent}>` : tagName}) final TUI bounds: (${minX}, ${minY}) to (${maxX}, ${maxY}) | GUI bounds: (${guiBox.x}, ${guiBox.y}, ${guiBox.width}, ${guiBox.height})`);
            return { termBox, guiBox, text: textContent };
          }
        function shiftNode(nodeIdx, shift, textBoxMap, childrenMap) {
          if (textBoxMap.has(nodeIdx)) {
            const boxes = textBoxMap.get(nodeIdx);
            for (const box of boxes) {
              box.termX += shift;
              box.termBox.minX += shift;
              box.termBox.maxX += shift;
              debugLog(`Shifting text box of node ${nodeIdx} (Text: "${box.text}") by ${shift} to (${box.termX}, ${box.termY})`);
            }
          }
          // Shift all immediate children
          const children = childrenMap.get(nodeIdx) || [];
          for (const childIdx of children) {
            shiftNode(childIdx, shift, textBoxMap, childrenMap);
          }
        }

        // Update prepareLayoutState to use the new processing logic
        async function prepareLayoutState({ snapshot, viewportWidth, viewportHeight, viewportX, viewportY }) {
          const { textLayoutBoxes, clickableElements, layoutToNode, nodeToParent, nodes } = extractTextLayoutBoxes(snapshot);
          if (!textLayoutBoxes.length) {
            DEBUG && terminal.yellow('No text boxes found.\n');
            return null;
          }

          const { columns: termWidth, rows: termHeight } = await getTerminalSize();
          const baseScaleX = termWidth / viewportWidth;
          const baseScaleY = (termHeight - 4) / viewportHeight;
          const scaleX = baseScaleX * HORIZONTAL_COMPRESSION;
          const scaleY = baseScaleY * VERTICAL_COMPRESSION;

          const visibleBoxes = textLayoutBoxes.filter(box => {
            const boxX = box.boundingBox.x;
            const boxY = box.boundingBox.y;
            const boxRight = boxX + box.boundingBox.width;
            const boxBottom = boxY + box.boundingBox.height;
            return boxX < viewportX + viewportWidth && boxRight > viewportX &&
                   boxY < viewportY + viewportHeight && boxBottom > viewportY;
          }).map(box => {
            const adjustedX = box.boundingBox.x - viewportX;
            const adjustedY = box.boundingBox.y - viewportY;
            box.termX = Math.ceil(adjustedX * scaleX);
            box.termY = Math.ceil(adjustedY * scaleY) + 4;
            box.termWidth = box.text.length;
            box.termHeight = 1;
            return box;
          });

          // Build children map and text box map
          const childrenMap = new Map();
          for (let i = 0; i < nodes.parentIndex.length; i++) {
            const parentIdx = nodes.parentIndex[i];
            if (parentIdx !== -1) {
              if (!childrenMap.has(parentIdx)) childrenMap.set(parentIdx, []);
              childrenMap.get(parentIdx).push(i);
            }
          }
          const textBoxMap = new Map();

          for (const box of visibleBoxes) {
            if (!textBoxMap.has(box.nodeIndex)) textBoxMap.set(box.nodeIndex, []);
            textBoxMap.get(box.nodeIndex).push(box);
            DEBUG && console.log(box);
          }

          // Find root nodes (nodes with text boxes in their subtree and no parent in the visible set)
          const allNodeIndices = new Set([...textBoxMap.keys(), ...childrenMap.keys()]);
          const rootNodes = Array.from(allNodeIndices).filter(nodeIdx => {
            const parentIdx = nodeToParent.get(nodeIdx);
            return (parentIdx === -1 || !allNodeIndices.has(parentIdx)) && 
                   hasTextBoxDescendant(nodeIdx, childrenMap, textBoxMap);
          });

          debugLog(`Processing ${rootNodes.length} root nodes`);
          for (const rootNode of rootNodes) {
            processNode(rootNode, childrenMap, textBoxMap, snapshot, nodes);
          }

          return {
            visibleBoxes,
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

          /**
           * Deconflicts Y-lines to prevent collapsing distinct GUI lines.
           * @param {Array} boxes - Text boxes with termBox properties.
           */
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
          DEBUG && terminal.magenta(`Text Box ${i}: "${text}" at (${boundingBox.x}, ${boundingBox.y}) | parentIndex: ${parentIndex} | backendNodeId: ${backendNodeId} | isClickable: ${isClickable} | ancestorType: ${ancestorType}\n`);
        }

        return { textLayoutBoxes, clickableElements, layoutToNode, nodeToParent, nodes };
      }

      function getAncestorInfo(nodeIndex, nodes, strings) {
        let currentIndex = nodeIndex;
        while (currentIndex !== -1) {
          if (typeof currentIndex !== 'number' || currentIndex < 0 || currentIndex >= nodes.nodeName.length) {
            DEBUG && debugLog(`Invalid nodeIndex in getAncestorInfo: ${nodeIndex}, currentIndex: ${currentIndex}`);
            return 'normal';
          }

          const nodeNameIndex = nodes.nodeName[currentIndex];
          if (typeof nodeNameIndex === 'undefined') {
            DEBUG && debugLog(`Undefined nodeName for currentIndex: ${currentIndex}, nodeIndex: ${nodeIndex}`);
            return 'normal';
          }
          const nodeName = strings[nodeNameIndex];
          const attributes = nodes.attributes[currentIndex] || [];
          const isClickable = nodes.isClickable && nodes.isClickable.index.includes(currentIndex);

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
          if (nodeName === 'A' && (hasHref || hasOnclick)) {
            return 'hyperlink';
          }

          if (isClickable) {
            return 'other_clickable';
          }

          currentIndex = nodes.parentIndex[currentIndex];
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
      function renderLayout({ layoutState, renderedBoxes }) {
        if (!layoutState) return;
        renderBoxes({ ...layoutState, renderedBoxes });
      }

      async function refreshTerminal({ send, sessionId, state, addressBar }) {
        try {
          const { snapshot, viewportWidth, viewportHeight, viewportX, viewportY } = await pollForSnapshot({ send, sessionId });
          state.currentScrollY = viewportY;
          const layoutState = await prepareLayoutState({ snapshot, viewportWidth, viewportHeight, viewportX, viewportY });

          terminal.clear();
          terminal.bgDefaultColor();
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
          }
        } catch (error) {
          if (DEBUG) console.warn(error);
          terminal.red(`Error printing text layout: ${error.message}\n`);
        }
      }

      function renderBoxes(layoutState) {
        const { visibleBoxes, termWidth, termHeight, viewportX, viewportY, clickableElements, renderedBoxes } = layoutState;
        renderedBoxes.length = 0;

        for (const box of visibleBoxes) {
          const { text, boundingBox, isClickable, termX, termY, ancestorType, backendNodeId, layoutIndex, nodeIndex } = box;
          const renderX = Math.max(1, termX + 1);
          const renderY = Math.max(5, termY + 1);

          if (renderX > termWidth || renderY > termHeight + 4) continue;

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
          terminal.defaultColor().bgDefaultColor();
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
        const nodeTag = clickedBox.ancestorType || 'unknown';
        const nodeText = clickedBox.text;
        const clickEvent = { type: 'click' };
        try {
          appendFileSync('clicks.log', `${new Date().toISOString()} - Click ${clickId}: T coords (${termX}, ${termY}), Node (tag: ${nodeTag}, text: "${nodeText}"), G coords (${clickX}, ${clickY}), Event: ${JSON.stringify(clickEvent)}\n`);
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

        await refresh();
      }

    // Main render 
      async function printTextLayoutToTerminal({ send, sessionId, onTabSwitch }) {
        const state = initializeState();
        const refresh = () => refreshTerminal({ send, sessionId, state, addressBar: null });
        const debouncedRefresh = debounce(refresh, DEBOUNCE_DELAY);

        terminal.on('mouse', async (event, data) => {
          if (!state.isListening) return;

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
          } else if ((event === 'MOUSE_WHEEL_UP' || event === 'MOUSE_WHEEL_DOWN') && data.y > 4) {
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
          if ( ! DEBUG ) return;
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
          if ( ! DEBUG ) return;
          try {
            appendFileSync('debug-coords.log', `${new Date().toISOString()} - ${message}\n`);
          } catch (error) {
            console.error(`Failed to write to debug log: ${error.message}`);
          }
        }
