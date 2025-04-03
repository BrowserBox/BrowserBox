import fs from 'fs';
import {rowsLog,debugLog,DEBUG} from './log.js';

const GAP = 1;
const HORIZONTAL_COMPRESSION = 1.0;
const VERTICAL_COMPRESSION = 1.0;

const LayoutAlgorithm = (() => {
  // --------------------------
  // Utility Functions
  // --------------------------
  // New function for vertical grouping
  function groupBoxesVertically(boxes, guiThreshold, gapThreshold = guiThreshold * 2) {
    if (!boxes.length) return boxes;

    // Sort by GUI Y-coordinate (boundingBox.y) to process top-to-bottom
    boxes.sort((a, b) => a.boundingBox.y - b.boundingBox.y);

    const rows = [];
    let currentRow = [boxes[0]];
    let currentGuiY = boxes[0].boundingBox.y;

    // Group boxes into rows based on guiThreshold
    for (let i = 1; i < boxes.length; i++) {
      const box = boxes[i];
      if (Math.abs(box.boundingBox.y - currentGuiY) <= guiThreshold) {
        // Same row based on GUI Y proximity
        currentRow.push(box);
      } else {
        // New row
        rows.push(currentRow);
        currentRow = [box];
        currentGuiY = box.boundingBox.y;
      }
    }
    rows.push(currentRow); // Add the last row

    // Assign termY values with gaps for significant GUI spacing
    let nextY = 5;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      for (const box of row) {
        box.termY = nextY; // Lock the Y-coordinate for this row in terminal space
        box.termBox = {
          minX: box.termX,              // Keep initial termX (will be adjusted later)
          minY: nextY,                  // Start of the row in terminal
          maxX: box.termX + box.termWidth - 1,
          maxY: nextY                   // Single-line box in terminal
        };
        debugLog(`Assigned box "${box.text}" to row at termY=${nextY} (GUI Y=${box.boundingBox.y})`);
      }

      // Check for a gap before the next row
      if (i < rows.length - 1) {
        const currentRowMaxY = Math.max(...rows[i].map(box => box.boundingBox.y + box.boundingBox.height));
        const nextRowMinY = rows[i + 1][0].boundingBox.y;
        const guiGap = nextRowMinY - currentRowMaxY;

        if (guiGap > gapThreshold) {
          nextY += 2; // Skip an extra line in the terminal for a significant GUI gap
          debugLog(`Added empty line: GUI gap of ${guiGap}px between row ${i} (maxY=${currentRowMaxY}) and row ${i+1} (minY=${nextRowMinY}) exceeds gapThreshold=${gapThreshold}`);
        } else {
          nextY += 1; // Normal increment for adjacent rows
        }
      } else {
        nextY += 1; // Last row, just increment normally
      }
    }

    return boxes;
  }

  function hasTextBoxDescendant(nodeIdx, childrenMap, textBoxMap) {
    if (textBoxMap.has(nodeIdx)) return true;
    const children = childrenMap.get(nodeIdx) || [];
    return children.some(childIdx => hasTextBoxDescendant(childIdx, childrenMap, textBoxMap));
  }

  function isFullyContained(b1, b2) {
    const termB1 = b1.termBox;
    const termB2 = b2.termBox;
    const b1InB2 = termB1.minX >= termB2.minX &&
                   termB1.maxX <= termB2.maxX &&
                   termB1.minY >= termB2.minY &&
                   termB1.maxY <= termB2.maxY;
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
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  }

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
    const children = childrenMap.get(nodeIdx) || [];
    for (const childIdx of children) {
      shiftNode(childIdx, shift, textBoxMap, childrenMap);
    }
  }

  // New helper to determine if a node is inline
  function isInlineElement(nodeName) {
    const inlineTags = new Set(['A', 'SPAN', 'B', 'I', 'EM', 'STRONG', '#TEXT']);
    return inlineTags.has(nodeName.toUpperCase()) ;
  }

  // Deep clone an object (simple version for snapshot)
  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  // New function to split the snapshot

  function splitSnapshot(originalSnapshot) {
    const snapshot = deepClone(originalSnapshot);
    const strings = snapshot.strings;
    const document = snapshot.documents[0];
    const nodes = document.nodes;
    const layout = document.layout;
    const textBoxes = document.textBoxes;

    splitLog('Starting splitSnapshot with original snapshot length:', strings.length, 'nodes:', nodes.parentIndex.length);

    // Build layout-to-node mapping
    const layoutToNode = new Map();
    layout.nodeIndex.forEach((nodeIdx, layoutIdx) => layoutToNode.set(layoutIdx, nodeIdx));
    splitLog('Built layoutToNode mapping with', layoutToNode.size, 'entries');

    // Build node-to-parent mapping
    const nodeToParent = new Map();
    nodes.parentIndex.forEach((parentIdx, nodeIdx) => nodeToParent.set(nodeIdx, parentIdx));
    splitLog('Built nodeToParent mapping with', nodeToParent.size, 'entries');

    // Group text boxes by layoutIndex
    const layoutToTextBoxes = new Map();
    for (let i = 0; i < textBoxes.layoutIndex.length; i++) {
      const layoutIdx = textBoxes.layoutIndex[i];
      if (layoutIdx === -1) continue;
      if (!layoutToTextBoxes.has(layoutIdx)) layoutToTextBoxes.set(layoutIdx, []);
      layoutToTextBoxes.get(layoutIdx).push(i);
    }
    splitLog('Grouped text boxes by layoutIndex:', Array.from(layoutToTextBoxes.entries()).map(([idx, tbs]) => `${idx}: ${tbs.length}`));

    // Track new indices
    let nextNodeIdx = nodes.parentIndex.length;
    let nextLayoutIdx = layout.nodeIndex.length;

    // Clone a node's basic properties
    function cloneNode(nodeIdx, newNodeIdx, newTextValueIdx) {
      nodes.parentIndex[newNodeIdx] = nodes.parentIndex[nodeIdx];
      nodes.nodeType[newNodeIdx] = nodes.nodeType[nodeIdx];
      nodes.nodeName[newNodeIdx] = nodes.nodeName[nodeIdx];
      nodes.nodeValue[newNodeIdx] = newTextValueIdx;
      nodes.backendNodeId[newNodeIdx] = nodes.backendNodeId[nodeIdx] + `_clone_${newNodeIdx}`;
      nodes.attributes[newNodeIdx] = [...(nodes.attributes[nodeIdx] || [])];
      splitLog(`Cloned node ${nodeIdx} to ${newNodeIdx} with text index ${newTextValueIdx}`);
    }

    // Process each layoutIndex with text boxes
    for (const [layoutIdx, tbIndices] of layoutToTextBoxes.entries()) {
      if (tbIndices.length <= 1) {
        splitLog(`layoutIdx ${layoutIdx} has ${tbIndices.length} text box(es) - no split needed`);
        continue;
      }

      const nodeIdx = layoutToNode.get(layoutIdx);
      if (nodes.nodeType[nodeIdx] !== 3) {
        splitLog(`Node ${nodeIdx} at layoutIdx ${layoutIdx} is not a #text node (type ${nodes.nodeType[nodeIdx]}) - skipping`);
        continue;
      }

      const originalTextIdx = layout.text[layoutIdx];
      const originalText = strings[originalTextIdx];
      splitLog(`Splitting node ${nodeIdx} at layoutIdx ${layoutIdx} with text: "${originalText}" into ${tbIndices.length} parts`);

      // Process each text box
      for (let i = 0; i < tbIndices.length; i++) {
        const tbIdx = tbIndices[i];
        let start = textBoxes.start[tbIdx];
        let length = textBoxes.length[tbIdx];
        
        // Validate start and length against the original string
        if (start < 0 || start >= originalText.length) {
          splitLog(`Warning: Invalid start index ${start} for text box ${tbIdx}, adjusting to 0`);
          start = 0;
        }
        if (start + length > originalText.length) {
          splitLog(`Warning: Length ${length} exceeds string length at start ${start} for text box ${tbIdx}, adjusting`);
          length = originalText.length - start;
        }

        // Compute the initial text segment
        const initialSegment = originalText.substring(start, start + length);
        splitLog(`Text box ${tbIdx}: initial segment="${initialSegment}"`);

        // Trim leading spaces and calculate the number of spaces trimmed
        const trimmedSegment = initialSegment.trimStart();
        const spacesTrimmed = initialSegment.length - trimmedSegment.length;
        const adjustedStart = start + spacesTrimmed; // Adjust start based on spaces trimmed
        const textSegment = trimmedSegment.trimEnd(); // Also trim trailing spaces for the final segment
        splitLog(`Text box ${tbIdx}: spacesTrimmed=${spacesTrimmed}, adjustedStart=${adjustedStart}, final segment="${textSegment}"`);

        if (i === 0) {
          // Update original node with first text box content
          const newTextIdx = strings.length;
          strings.push(textSegment);
          nodes.nodeValue[nodeIdx] = newTextIdx;
          layout.text[layoutIdx] = newTextIdx;
          layout.bounds[layoutIdx] = [...textBoxes.bounds[tbIdx]];
          textBoxes.layoutIndex[tbIdx] = layoutIdx;
          textBoxes.start[tbIdx] = 0; // Start at 0 for the new string
          textBoxes.length[tbIdx] = textSegment.length;
          splitLog(`Updated node ${nodeIdx} with new textIdx ${newTextIdx} for "${textSegment}"`);
        } else {
          // Create new node and update existing text box
          const newNodeIdx = nextNodeIdx++;
          const newLayoutIdx = nextLayoutIdx++;
          const newTextIdx = strings.length;
          strings.push(textSegment);
          cloneNode(nodeIdx, newNodeIdx, newTextIdx);
          layout.nodeIndex[newLayoutIdx] = newNodeIdx;
          layout.bounds[newLayoutIdx] = [...textBoxes.bounds[tbIdx]];
          layout.text[newLayoutIdx] = newTextIdx;
          layoutToNode.set(newLayoutIdx, newNodeIdx);
          textBoxes.layoutIndex[tbIdx] = newLayoutIdx;
          textBoxes.start[tbIdx] = 0; // Start at 0 for the new string
          textBoxes.length[tbIdx] = textSegment.length;
          splitLog(`Updated text box ${tbIdx} to layoutIdx ${newLayoutIdx} for node ${newNodeIdx} with text "${textSegment}"`);
        }
      }
    }

    splitLog('Split complete. Final snapshot stats - strings:', strings.length, 'nodes:', nodes.parentIndex.length, 'layout:', layout.nodeIndex.length);
    return snapshot;
  }

  function splitLog(...stuff) {
    DEBUG && fs.appendFileSync('split.log', stuff.join(' ') + '\n');
  }

    function reconstructToHTML(snapshot) {
      const strings = snapshot.strings;
      const document = snapshot.documents[0];
      const nodes = document.nodes;
      const nodeToChildren = new Map();

      // Build a map of parent to children
      for (let i = 0; i < nodes.parentIndex.length; i++) {
        const parentIdx = nodes.parentIndex[i];
        if (parentIdx !== -1) {
          if (!nodeToChildren.has(parentIdx)) nodeToChildren.set(parentIdx, []);
          nodeToChildren.get(parentIdx).push(i);
        }
      }

      function buildHTML(nodeIdx, depth = 0) {
        const indent = '  '.repeat(depth);
        const nodeType = nodes.nodeType[nodeIdx];
        const nodeNameIdx = nodes.nodeName[nodeIdx];
        const nodeName = nodeNameIdx >= 0 ? strings[nodeNameIdx] : 'Unknown';
        let html = '';

        if (nodeType === 9) { // Document node
          html += `${indent}<#document>\n`;
          const children = nodeToChildren.get(nodeIdx) || [];
          for (const childIdx of children) {
            html += buildHTML(childIdx, depth + 1);
          }
          html += `${indent}</#document>\n`;
        } else if (nodeType === 1) { // Element node
          html += `${indent}<${nodeName}>\n`;
          const children = nodeToChildren.get(nodeIdx) || [];
          for (const childIdx of children) {
            html += buildHTML(childIdx, depth + 1);
          }
          html += `${indent}</${nodeName}>\n`;
        } else if (nodeType === 3) { // Text node
          const nodeValueIdx = nodes.nodeValue[nodeIdx];
          const textContent = nodeValueIdx >= 0 ? strings[nodeValueIdx] : '';
          html += `${indent}#text "${textContent}"\n`;
        }

        return html;
      }

      // Start with the root node (typically node 0 is the document)
      return buildHTML(0);
    }


  async function prepareLayoutState({ snapshot, viewportWidth, viewportHeight, viewportX, viewportY, getTerminalSize, terminal }) {
    // Transform the snapshot before processing
    DEBUG && fs.writeFileSync('snapshot.log', JSON.stringify(snapshot, null, 2));
    DEBUG && fs.appendFileSync('snapshot.log', reconstructToHTML(snapshot));
    const splitSnapshotData = splitSnapshot(snapshot);
    DEBUG && fs.writeFileSync('split-snapshot.log', JSON.stringify(splitSnapshotData, null, 2));
    DEBUG && fs.appendFileSync('split-snapshot.log', reconstructToHTML(splitSnapshotData));

    const { textLayoutBoxes, clickableElements, layoutToNode, nodeToParent, nodes } = extractTextLayoutBoxes({ snapshot: splitSnapshotData, terminal });
    if (!textLayoutBoxes.length) {
      DEBUG && terminal.yellow('No text boxes found.\n');
      return null;
    }

    const { columns: termWidth, rows: termHeight } = await getTerminalSize();
    const baseScaleX = termWidth / viewportWidth;
    const baseScaleY = (termHeight - 4) / viewportHeight;
    const scaleX = baseScaleX * HORIZONTAL_COMPRESSION;
    const scaleY = baseScaleY * VERTICAL_COMPRESSION;

    // Initial visible boxes calculation
    let visibleBoxes = textLayoutBoxes.filter(box => {
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

    // Apply vertical grouping
    const GUI_VERTICAL_THRESHOLD = 15; // Pixels for grouping rows
    const GUI_GAP_THRESHOLD = 30; // Pixels for adding an empty line
    groupBoxesVertically(visibleBoxes, GUI_VERTICAL_THRESHOLD, GUI_GAP_THRESHOLD);

    // Filter out occluded boxes using paint order
    const layout = splitSnapshotData.documents[0].layout;
    if (layout.paintOrders) {
      // Map nodeIndex to paintOrder
      const paintOrderMap = new Map();
      layout.nodeIndex.forEach((nodeIdx, layoutIdx) => {
        paintOrderMap.set(nodeIdx, layout.paintOrders[layoutIdx]);
      });

      // Sort visibleBoxes by paint order, highest first (topmost elements)
      visibleBoxes.sort((a, b) => {
        const paintA = paintOrderMap.get(a.nodeIndex) || 0;
        const paintB = paintOrderMap.get(b.nodeIndex) || 0;
        return paintB - paintA; // Descending: higher paint order (top) first
      });

      // Track occupied GUI space and filter
      const occupiedAreas = []; // { x, y, right, bottom }
      const filteredBoxes = [];

      for (const box of visibleBoxes) {
        const bounds = box.boundingBox;
        const paintOrder = paintOrderMap.get(box.nodeIndex) || 0;
        const boxArea = { x: bounds.x, y: bounds.y, right: bounds.x + bounds.width, bottom: bounds.y + bounds.height };

        // Check if this box is fully contained by an occupied area (which has a higher paint order)
        let isOccluded = false;
        for (const occupied of occupiedAreas) {
          if (occupied.x <= boxArea.x &&
              occupied.y <= boxArea.y &&
              occupied.right >= boxArea.right &&
              occupied.bottom >= boxArea.bottom) {
            debugLog(`Box "${box.text}" (node ${box.nodeIndex}, paintOrder ${paintOrder}) occluded by prior area`);
            isOccluded = true;
            break;
          }
        }

        if (!isOccluded) {
          filteredBoxes.push(box);
          occupiedAreas.push(boxArea); // Add this box’s bounds to occupied areas
          debugLog(`Box "${box.text}" (node ${box.nodeIndex}, paintOrder ${paintOrder}) added as visible`);
        }
      }

      visibleBoxes = filteredBoxes;
      debugLog(`Filtered down to ${visibleBoxes.length} visible boxes after occlusion check`);
    } else {
      debugLog('No paintOrders available in snapshot; skipping occlusion filter');
    }

    const childrenMap = new Map();
    for (let i = 0; i < nodes.parentIndex.length; i++) {
      let parentIdx = nodes.parentIndex[i];
      if (parentIdx !== -1) {
        if (!childrenMap.has(parentIdx)) childrenMap.set(parentIdx, []);
        childrenMap.get(parentIdx).push(i);
      }
    }
    const textBoxMap = new Map();
    for (const box of visibleBoxes) {
      if (!textBoxMap.has(box.nodeIndex)) textBoxMap.set(box.nodeIndex, []);
      textBoxMap.get(box.nodeIndex).push(box);
    }

    const allNodeIndices = new Set([...textBoxMap.keys(), ...childrenMap.keys()]);
    const rootNodes = Array.from(allNodeIndices).filter(nodeIdx => {
      const parentIdx = nodeToParent.get(nodeIdx);
      return (parentIdx === -1 || !allNodeIndices.has(parentIdx)) &&
             hasTextBoxDescendant(nodeIdx, childrenMap, textBoxMap);
    });

    debugLog(`Processing ${rootNodes.length} root nodes`);
    for (const rootNode of rootNodes) {
      processNode(rootNode, childrenMap, textBoxMap, splitSnapshotData, nodes);
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
  function extractTextLayoutBoxes({ snapshot, terminal }) {
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


  // Returns the union of two GUI boxes.
  function unionBoxes(box1, box2) {
    if (!box1) return box2;
    if (!box2) return box1;
    const minX = Math.min(box1.x, box2.x);
    const minY = Math.min(box1.y, box2.y);
    const maxX = Math.max(box1.x + box1.width, box2.x + box2.width);
    const maxY = Math.max(box1.y + box1.height, box2.y + box2.height);
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }

  // Iterates over all text boxes corresponding to a given node index.
  // Calls the provided callback with (i, layoutIdx, textIndex, textBoxes, layout).
  function iterateTextBoxesForNode(nodeIdx, snapshot, callback) {
    const { textBoxes, layout } = snapshot.documents[0];
    const layoutToNode = new Map(layout.nodeIndex.map((nIdx, lIdx) => [lIdx, nIdx]));
    for (let i = 0; i < textBoxes.layoutIndex.length; i++) {
      const layoutIdx = textBoxes.layoutIndex[i];
      if (layoutIdx !== -1 && layoutToNode.get(layoutIdx) === nodeIdx) {
        const textIndex = layout.text[layoutIdx];
        callback(i, layoutIdx, textIndex, textBoxes, layout);
      }
    }
  }

  // Groups an array of items using the value returned from getRow(item) as the key.
  function groupByRow(items, getRows) {
    const rows = new Map();
    for (const item of items) {
      const itemRows = getRows(item);
      for( const row of itemRows ) {
        if (!rows.has(row)) rows.set(row, []);
        rows.get(row).push(item);
      }
    }
    return rows;
  }

  // Computes the bounding term box for an array of items that each have a "termBox" property.
  function computeBoundingTermBox(items) {
    if (items.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    const minX = Math.min(...items.map(i => i.termBox.minX));
    const minY = Math.min(...items.map(i => i.termBox.minY));
    const maxX = Math.max(...items.map(i => i.termBox.maxX));
    const maxY = Math.max(...items.map(i => i.termBox.maxY));
    return { minX, minY, maxX, maxY };
  }

  // --------------------------
  // Tag & Debug Helpers
  // --------------------------

  // Returns the tag name for a given node.
  function getTagName(nodeIdx, nodes, snapshot) {
    return nodes.nodeName[nodeIdx] >= 0
      ? snapshot.strings[nodes.nodeName[nodeIdx]]
      : 'Unknown';
  }

  // Formats the tag for debug logging.
  function formatTag(tagName, isTextNode, textContent) {
    return isTextNode ? `#text<${textContent}>` : tagName;
  }

  // --------------------------
  // Node Processing Functions
  // --------------------------

  // Processes a text node by extracting its text content and computing its GUI bounds.
  function processTextNode(nodeIdx, snapshot, nodes) {
    const boundsList = [];
    const textParts = [];
    const boxes = [];
    iterateTextBoxesForNode(nodeIdx, snapshot, (i, layoutIdx, textIndex, textBoxes) => {
      const bounds = textBoxes.bounds[i];
      const textBox = { x: bounds[0], y: bounds[1], width: bounds[2], height: bounds[3] };
      if (textIndex !== -1 && textIndex < snapshot.strings.length) {
        const text = snapshot.strings[textIndex]
          .substring(textBoxes.start[i], textBoxes.start[i] + textBoxes.length[i])
          .trim();
        if (text) textParts.push(text);
        if ( text ) {
          textBox.text = text;
          boxes.push(textBox);
        }
      }
    });
    const textContent = textParts.join(' ');
    if (!textContent) {
      debugLog(`Skipping Node ${nodeIdx} (Tag: #text<>) - Empty text content`);
      return null;
    }
    const guiBox = boundsList.reduce(unionBoxes, null) || { x: 0, y: 0, width: 0, height: 0 };
    debugLog(
      `Node ${nodeIdx} (Tag: #text<${textContent}>) GUI bounds: (${guiBox.x}, ${guiBox.y}, ${guiBox.width}, ${guiBox.height})`
    );
    return { text: textContent, guiBox, boxes };
  }

  // Retrieves the GUI bounds for non-text nodes from the layout data.
  function getGuiBoxForNonText(nodeIdx, snapshot, tagName) {
    const layoutIdx = snapshot.documents[0].layout.nodeIndex.indexOf(nodeIdx);
    if (layoutIdx !== -1) {
      const [x, y, width, height] = snapshot.documents[0].layout.bounds[layoutIdx];
      const guiBox = { x, y, width, height };
      debugLog(`Node ${nodeIdx} (Tag: ${tagName}) GUI bounds: (${x}, ${y}, ${width}, ${height})`);
      return guiBox;
    }
    debugLog(`Node ${nodeIdx} (Tag: ${tagName}) has no GUI bounds in layout`);
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  // Recursively collects text content from a node's subtree.
  function collectSubtreeText(nodeIdx, childrenMap, snapshot, nodes) {
    let texts = [];
    if (nodes.nodeType[nodeIdx] === 3) {
      iterateTextBoxesForNode(nodeIdx, snapshot, (i, layoutIdx, textIndex, textBoxes) => {
        if (textIndex !== -1 && textIndex < snapshot.strings.length) {
          const text = snapshot.strings[textIndex]
            .substring(textBoxes.start[i], textBoxes.start[i] + textBoxes.length[i])
            .trim();
          if (text) texts.push(text);
        }
      });
    }
    const children = childrenMap.get(nodeIdx) || [];
    for (const childIdx of children) {
      texts = texts.concat(collectSubtreeText(childIdx, childrenMap, snapshot, nodes));
    }
    return texts;
  }

  // Processes a leaf node that has associated text boxes.
  function processLeafNode(nodeIdx, textBoxMap, snapshot, textContent, guiBox) {
    const boxes = textBoxMap.get(nodeIdx);
    const rows = groupByRow(boxes, b => [b.termY]);
    adjustBoxPositions(rows, nodeIdx);

    const termBox = computeBoundingTermBox(boxes);
    const finalGuiBox = computeFinalGuiBox(nodeIdx, snapshot, boxes, guiBox);

    debugLog(
      `Leaf Node ${nodeIdx} TUI bounds: (${termBox.minX}, ${termBox.minY}) to (${termBox.maxX}, ${termBox.maxY}) | GUI bounds: (${finalGuiBox.x}, ${finalGuiBox.y}, ${finalGuiBox.width}, ${finalGuiBox.height})`
    );
    return { termBox, guiBox: finalGuiBox, text: boxes[0]?.text || textContent };
  }

  function range(a, b) {
    let r = [];
    for( let i = a; i <= b; i++ ) {
      r.push(i);
    }
    return r;
  }

  // Adjusts text box positions within each row to avoid overlaps.
  function adjustBoxPositions(rows, nodeIdx) {
    for (const rowBoxes of rows.values()) {
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
          debugLog(
            `Leaf Node ${nodeIdx} (Text: "${box.text}") shifted right by ${shift} to (${box.termX}, ${box.termY})`
          );
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
  }

  // Computes the final GUI box for a leaf node. Uses layout if available; otherwise unions the bounding boxes.
  function computeFinalGuiBox(nodeIdx, snapshot, boxes, originalGuiBox) {
    const layoutIdx = snapshot.documents[0].layout.nodeIndex.indexOf(nodeIdx);
    if (layoutIdx !== -1) {
      const [x, y, width, height] = snapshot.documents[0].layout.bounds[layoutIdx];
      return { x, y, width, height };
    }
    const guiBox = boxes.reduce((acc, b) => unionBoxes(acc, b.boundingBox), null);
    return guiBox || originalGuiBox;
  }

  // Recursively processes child nodes and collects their processed results.
  function processChildNodes(children, childrenMap, textBoxMap, snapshot, nodes) {
    const childBoxes = [];
    for (const childIdx of children) {
      const childResult = processNode(childIdx, childrenMap, textBoxMap, snapshot, nodes);
      if (childResult) childBoxes.push({ nodeIdx: childIdx, ...childResult });
    }
    return childBoxes;
  }

  // Adjusts child nodes to prevent overlaps; adds a gap to the rightmost child if needed.
  function adjustChildNodesOverlap(childBoxes, textBoxMap, childrenMap) {
    const rows = groupByRow(childBoxes, cb => range(cb.termBox.minY, cb.termBox.maxY));
    let maxXChild = null;
    let maxXOverall = -Infinity;
    DEBUG && rowsLog(rows);

    for (const rowBoxes of rows.values()) {
      rowBoxes.sort((a, b) => a.termBox.minX - b.termBox.minX);
      let lastEndX = -Infinity;
      let lastBox = null;
      for (const childBox of rowBoxes) {
        if (lastBox && childBox.termBox.minX <= lastEndX && !hasGuiOverlap(lastBox, childBox)) {
          const shift = lastEndX + 1 - childBox.termBox.minX;
          shiftNode(childBox.nodeIdx, shift, textBoxMap, childrenMap);
          childBox.termBox.minX += shift;
          childBox.termBox.maxX += shift;
          debugLog(
            `Node ${childBox.nodeIdx} [${JSON.stringify(childBox)}] ("${childBox.text || 'unknown'}") shifted right by ${shift} to (${childBox.termBox.minX}, ${childBox.termBox.minY}) due to TUI overlap and no GUI overlap with previous child ${lastBox.nodeIdx} ("${lastBox.text || 'unknown'}")`
          );
        }
        if (childBox.termBox.maxX > maxXOverall) {
          maxXChild = childBox;
          maxXOverall = childBox.termBox.maxX;
        }
        lastEndX = childBox.termBox.maxX;
        lastBox = childBox;
      }
    }
    if (maxXChild && typeof GAP !== 'undefined' && GAP && textBoxMap.has(maxXChild.nodeIdx)) {
      maxXChild.termBox.maxX += GAP;
    }
  }

  // --------------------------
  // Main API: processNode
  // --------------------------

  // Processes a node in the DOM tree.
  function processNode(nodeIdx, childrenMap, textBoxMap, snapshot, nodes) {
    const tagName = getTagName(nodeIdx, nodes, snapshot);
    const isTextNode = nodes.nodeType[nodeIdx] === 3;
    let guiBox = { x: 0, y: 0, width: 0, height: 0 };
    let textContent = '';

    const children = childrenMap.get(nodeIdx) || [];

    if (isTextNode) {
      const textResult = processTextNode(nodeIdx, snapshot, nodes);
      if (!textResult) return null;
      textContent = textResult.text;
      guiBox = textResult.guiBox;
    } else {
      guiBox = getGuiBoxForNonText(nodeIdx, snapshot, tagName);
    }

    if (DEBUG) {
      const subtreeTexts = collectSubtreeText(nodeIdx, childrenMap, snapshot, nodes);
      if (subtreeTexts.length > 0) {
        debugLog(
          `Node ${nodeIdx} (Tag: ${formatTag(tagName, isTextNode, textContent)}) subtree text content: [${subtreeTexts.map(t => `"${t}"`).join(', ')}]`
        );
      }
      textContent = subtreeTexts.join(' ');
    }
    debugLog(
      `Processing Node ${nodeIdx} (Tag: ${formatTag(tagName, isTextNode, textContent)}) with ${children.length} immediate children`
    );

    if (textBoxMap.has(nodeIdx)) {
      const boxes = textBoxMap.get(nodeIdx);
      // Use pre-assigned termY, only adjust termX
      const rows = groupByRow(boxes, b => [b.termY]); // Respect existing termY
      adjustBoxPositions(rows, nodeIdx); // This only changes termX

      const termBox = computeBoundingTermBox(boxes);
      const finalGuiBox = computeFinalGuiBox(nodeIdx, snapshot, boxes, guiBox);

      debugLog(
        `Leaf Node ${nodeIdx} TUI bounds: (${termBox.minX}, ${termBox.minY}) to (${termBox.maxX}, ${termBox.maxY}) | GUI bounds: (${finalGuiBox.x}, ${finalGuiBox.y}, ${finalGuiBox.width}, ${finalGuiBox.height})`
      );
      return { termBox, guiBox: finalGuiBox, text: boxes[0]?.text || textContent };
    }

    const childBoxes = processChildNodes(children, childrenMap, textBoxMap, snapshot, nodes);
    if (childBoxes.length === 0) {
      debugLog(
        `Node ${nodeIdx} (Tag: ${formatTag(tagName, isTextNode, textContent)}) has no children with text boxes | GUI bounds: (${guiBox.x}, ${guiBox.y}, ${guiBox.width}, ${guiBox.height})`
      );
      return null;
    }

    adjustChildNodesOverlap(childBoxes, textBoxMap, childrenMap);
    const termBox = computeBoundingTermBox(childBoxes);

    debugLog(
      `Node ${nodeIdx} (Tag: ${formatTag(tagName, isTextNode, textContent)}) final TUI bounds: (${termBox.minX}, ${termBox.minY}) to (${termBox.maxX}, ${termBox.maxY}) | GUI bounds: (${guiBox.x}, ${guiBox.y}, ${guiBox.width}, ${guiBox.height})`
    );
    return { termBox, guiBox, text: textContent };
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


  // --------------------------
  // Exposed API
  // --------------------------

  return {
    processNode,
    extractTextLayoutBoxes,
    prepareLayoutState,
  };
})();

export default LayoutAlgorithm;

