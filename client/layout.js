import fs from 'fs';
import {rowsLog,debugLog,DEBUG} from './log.js';

const GAP = 1;
const HORIZONTAL_COMPRESSION = 1.0;
const VERTICAL_COMPRESSION = 1.0;
const USE_TEXT_BOX_FOR_OCCLUSION_TEST = true; // Set to true to use text box bounds for occlusion test
const RECOGNIZE_MULTIROW_MEDIA_BOXES = false;
const POSITION_SET_1 = new Set([
  'relative',
  'sticky',
  'unset',
  'initial'
]);

const LayoutAlgorithm = (() => {
  // --------------------------
  // Utility Functions
  // --------------------------

  // New function for vertical grouping
  function groupBoxesVertically(boxes, guiThreshold, gapThreshold = guiThreshold * 2) {
    if (!boxes.length) return boxes;

    boxes.sort((a, b) => a.boundingBox.y - b.boundingBox.y);

    const rows = [];
    let currentRow = [boxes[0]];
    let currentGuiY = boxes[0].boundingBox.y;

    for (let i = 1; i < boxes.length; i++) {
      const box = boxes[i];
      if (Math.abs(box.boundingBox.y - currentGuiY) <= guiThreshold) {
        currentRow.push(box);
      } else {
        rows.push(currentRow);
        currentRow = [box];
        currentGuiY = box.boundingBox.y;
      }
    }
    rows.push(currentRow);

    let nextY = 5;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      for (const box of row) {
        box.termY = nextY;
        if (box.type === 'media') {
          box.termWidth = RECOGNIZE_MULTIROW_MEDIA_BOXES
            ? Math.max(5, Math.ceil(box.boundingBox.width / 20))
            : 5; // Matches length of [IMG], [VID], [AUD]
          box.termHeight = 1;
          box.text = RECOGNIZE_MULTIROW_MEDIA_BOXES
            ? `[${box.text.slice(1, 4)} ${box.termWidth}x${Math.ceil(box.boundingBox.height / 40)}]`
            : box.text; // Keep [IMG], [VID], or [AUD]
        } else {
          box.termWidth = box.text.length;
          box.termHeight = 1;
        }
        box.termBox = {
          minX: box.termX,
          minY: nextY,
          maxX: box.termX + box.termWidth - 1,
          maxY: nextY
        };
        debugLog(`Assigned box "${box.text}" to row at termY=${nextY} (GUI Y=${box.boundingBox.y})`);
      }

      if (i < rows.length - 1) {
        const currentRowMaxY = Math.max(...rows[i].map(box => box.boundingBox.y + box.boundingBox.height));
        const nextRowMinY = rows[i + 1][0].boundingBox.y;
        const guiGap = nextRowMinY - currentRowMaxY;

        if (guiGap > gapThreshold) {
          nextY += RECOGNIZE_MULTIROW_MEDIA_BOXES ? Math.max(2, Math.ceil(guiGap / 40)) : 2;
          debugLog(`Added gap: GUI gap of ${guiGap}px`);
        } else {
          nextY += 1; // Single-row increment
        }
      } else {
        nextY += 1;
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

  // Helper function to get the overall bounding box for a list of text boxes
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

  // Helper to get computed styles as a key-value object
  function getComputedStyles(layoutIndex, layout, strings) {
    if (layoutIndex === -1) return {};
    const computedStyleKeys = ['display', 'visibility', 'overflow', 'position', 'width', 'height', 'transform', 'opacity'];
    const styleIndexes = layout.styles[layoutIndex] || [];
    const styleValues = styleIndexes.map(idx => strings[idx]);
    const styleMap = {};
    computedStyleKeys.forEach((key, i) => {
      if (styleValues[i]) {
        styleMap[key] = styleValues[i];
      }
    });
    // Log the computed styles to computed-styles.log
    DEBUG && fs.appendFileSync('computed-styles.log', `layoutIndex ${layoutIndex}: ${JSON.stringify(styleMap)}\n`);
    return styleMap;
  }

  // Helper to find the layoutIndex of a node's parent element
  function getParentElementLayoutIndex(nodeIndex, layout, nodeToParent) {
    let currentIndex = nodeIndex;
    while (currentIndex !== -1) {
      const parentIndex = nodeToParent.get(currentIndex);
      if (parentIndex === -1) return -1;
      const parentLayoutIndex = layout.nodeIndex.indexOf(parentIndex);
      if (parentLayoutIndex !== -1) return parentLayoutIndex; // Found the parent element in layout
      currentIndex = parentIndex;
    }
    return -1;
  }

  // Helper to check if a node or its ancestors have visibility: hidden, display: none, or zero dimensions
  function isHiddenByStyles(nodeIndex, layoutIndex, layout, strings, nodeToParent) {
    let currentIndex = nodeIndex;
    let currentLayoutIndex = layoutIndex;
    while (currentIndex !== -1) {
      const styles = getComputedStyles(currentLayoutIndex, layout, strings);
      if (styles.visibility === 'hidden' || styles.display === 'none' || styles.opacity == '0') {
        debugLog(`Node ${nodeIndex} hidden by styles: ${JSON.stringify(styles)}`);
        return true;
      }
      // Check for zero dimensions
      const width = styles.width || 'auto';
      const height = styles.height || 'auto';
      const isZeroWidth = width == '0' || width === '0px';
      const isZeroHeight = height == '0' || height === '0px';
      if (isZeroWidth || isZeroHeight) {
        debugLog(`Node ${nodeIndex} hidden by zero dimensions: ${JSON.stringify(styles)}`);
        return true;
      }
      currentIndex = nodeToParent.get(currentIndex);
      currentLayoutIndex = currentIndex !== -1 ? layout.nodeIndex.indexOf(currentIndex) : -1;
    }
    return false;
  }

  // Helper to check if a node is clipped by a parent with width: 0, overflow: hidden
  function isClippedByParent(nodeIndex, layoutIndex, layout, strings, nodeToParent) {
    // Start with the parent of the text node
    let currentIndex = nodeToParent.get(nodeIndex);
    let currentLayoutIndex = currentIndex !== -1 ? layout.nodeIndex.indexOf(currentIndex) : -1;

    // Check if the parent element (not the text node) has position: absolute
    const parentStyles = getComputedStyles(currentLayoutIndex, layout, strings);
    const isHidden = parentStyles.overflow == 'hidden';
    const hiddenIgnored = POSITION_SET_1.has(parentStyles.position) && parentStyles.display == 'inline';

    if (!(isHidden && ! hiddenIgnored)) {
      debugLog(`Parent of node ${nodeIndex} is not hidden by parent: ${JSON.stringify(parentStyles)}`);
      return false;
    }

    // Check ancestors for clipping
    let depth = 0;
    while (currentIndex !== -1 && currentLayoutIndex !== -1) {
      const styles = getComputedStyles(currentLayoutIndex, layout, strings);
      const hasZeroOpacity = styles.opacity == '0';
      const hasOverflowHidden = styles.overflow === 'hidden';
      const width = styles.width || 'auto';
      const height = styles.height || 'auto';

      const isZeroWidth = width == '0' || width === '0px';
      const isZeroHeight = height == '0' || height === '0px';

      if ((isZeroWidth || isZeroHeight) && hasOverflowHidden || hasZeroOpacity) {
        debugLog(`Node ${nodeIndex} clipped by ancestor ${currentIndex} at depth ${depth} with styles: ${JSON.stringify(styles)}`);
        return true;
      }

      currentIndex = nodeToParent.get(currentIndex);
      currentLayoutIndex = currentIndex !== -1 ? layout.nodeIndex.indexOf(currentIndex) : -1;
      depth++;
    }
    return false;
  }

  // Helper to check if a node is clickable
  function isNodeClickable(nodeIndex, clickableIndexes, nodeToParent) {
    let currentIndex = nodeIndex;
    while (currentIndex !== -1) {
      if (clickableIndexes.has(currentIndex)) return true;
      currentIndex = nodeToParent.get(currentIndex);
    }
    return false;
  }

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
      if (!text || text.match(/^\s*$/)) {
        DEBUG && terminal.yellow(`Empty or whitespace-only text for layoutIndex ${layoutIndex}\n`);
        continue;
      }

      const nodeIndex = layoutToNode.get(layoutIndex);

      // Find the parent element's layoutIndex
      const parentLayoutIndex = getParentElementLayoutIndex(nodeIndex, layout, nodeToParent);
      if (parentLayoutIndex === -1) {
        DEBUG && terminal.yellow(`No parent element found for text box ${i} (nodeIndex: ${nodeIndex})\n`);
        continue;
      }

      // Get the parent element's styles to check width and height
      const parentStyles = getComputedStyles(parentLayoutIndex, layout, strings);
      const parentWidth = parentStyles.width || 'auto';
      const parentHeight = parentStyles.height || 'auto';
      const isZeroWidth = parentWidth === '0' || parentWidth === '0px';
      const isZeroHeight = parentHeight === '0' || parentHeight === '0px';

      // Filter out boxes with zero width or height (using parent element's computed styles)
      if (isZeroWidth || isZeroHeight) {
        DEBUG && terminal.yellow(`Skipping text box ${i} with zero dimensions in parent (width: ${parentWidth}, height: ${parentHeight})\n`);
        continue;
      }

      // Filter out boxes hidden by visibility: hidden, display: none, or zero dimensions
      if (isHiddenByStyles(nodeIndex, parentLayoutIndex, layout, strings, nodeToParent)) {
        DEBUG && terminal.yellow(`Skipping text box ${i} due to visibility: hidden, display: none, or zero dimensions\n`);
        continue;
      }

      // Filter out boxes clipped by a parent with width: 0, overflow: hidden
      if (isClippedByParent(nodeIndex, parentLayoutIndex, layout, strings, nodeToParent)) {
        DEBUG && terminal.yellow(`Skipping text box ${i} due to parent clipping (width: 0, overflow: hidden)\n`);
        continue;
      }

      // Use textBoxes.bounds for the actual text box position
      const textBoundingBox = {
        x: bounds[0],
        y: bounds[1],
        width: bounds[2],
        height: bounds[3],
      };

      const parentIndex = nodeToParent.get(nodeIndex);
      const backendNodeId = nodes.backendNodeId[nodeIndex];
      const isClickable = nodeIndex !== undefined && isNodeClickable(nodeIndex, clickableIndexes, nodeToParent);
      const ancestorType = getAncestorInfo(nodeIndex, nodes, strings);

      if (isClickable) {
        clickableElements.push({
          text,
          boundingBox: textBoundingBox,
          clickX: textBoundingBox.x + textBoundingBox.width / 2,
          clickY: textBoundingBox.y + textBoundingBox.height / 2,
        });
      }

      textLayoutBoxes.push({ text, boundingBox: textBoundingBox, isClickable, parentIndex, ancestorType, backendNodeId, layoutIndex, nodeIndex });
      DEBUG && terminal.magenta(`Text Box ${i}: "${text}" at (${textBoundingBox.x}, ${textBoundingBox.y}) | parentIndex: ${parentIndex} | backendNodeId: ${backendNodeId} | isClickable: ${isClickable} | ancestorType: ${ancestorType}\n`);
    }

    // Process media nodes
    for (let layoutIdx = 0; layoutIdx < layout.nodeIndex.length; layoutIdx++) {
      const nodeIdx = layout.nodeIndex[layoutIdx];
      const nodeNameIdx = nodes.nodeName[nodeIdx];
      const nodeName = nodeNameIdx >= 0 ? strings[nodeNameIdx] : '';
      const nodeNameUpper = nodeName.toUpperCase();
      
      let mediaType, placeholder;
      if (nodeNameUpper === 'IMG') {
        mediaType = 'media';
        placeholder = '[IMG]';
      } else if (nodeNameUpper === 'VIDEO') {
        mediaType = 'media';
        placeholder = '[VID]';
      } else if (nodeNameUpper === 'AUDIO') {
        mediaType = 'media';
        placeholder = '[AUD]';
      } else {
        continue; // Skip non-media elements
      }

      const bounds = layout.bounds[layoutIdx];
      if (!bounds || bounds[2] === 0 || bounds[3] === 0) continue;

      const boundingBox = {
        x: bounds[0],
        y: bounds[1],
        width: bounds[2],
        height: bounds[3],
      };

      const parentIndex = nodeToParent.get(nodeIdx);
      const backendNodeId = nodes.backendNodeId[nodeIdx];
      const isClickable = isNodeClickable(nodeIdx, clickableIndexes, nodeToParent);
      const ancestorType = getAncestorInfo(nodeIdx, nodes, strings);

      const mediaBox = {
        type: mediaType,
        text: placeholder,
        boundingBox,
        isClickable,
        parentIndex,
        ancestorType,
        backendNodeId,
        layoutIndex: layoutIdx,
        nodeIndex: nodeIdx,
      };

      textLayoutBoxes.push(mediaBox);
      if (isClickable) {
        clickableElements.push({
          text: placeholder,
          boundingBox,
          clickX: boundingBox.x + boundingBox.width / 2,
          clickY: boundingBox.y + boundingBox.height / 2,
        });
      }
      DEBUG && terminal.magenta(`${placeholder} ${layoutIdx}: at (${boundingBox.x}, ${boundingBox.y}) | w=${boundingBox.width}, h=${boundingBox.height} | clickable: ${isClickable}\n`);
    }

    return { textLayoutBoxes, clickableElements, layoutToNode, nodeToParent, nodes };
  }

  async function prepareLayoutState({ snapshot, viewportWidth, viewportHeight, viewportX, viewportY, getTerminalSize, terminal }) {
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

    const GUI_VERTICAL_THRESHOLD = 15;
    const GUI_GAP_THRESHOLD = 30;
    groupBoxesVertically(visibleBoxes, GUI_VERTICAL_THRESHOLD, GUI_GAP_THRESHOLD);

    const layout = splitSnapshotData.documents[0].layout;
    if (layout.paintOrders) {
      const paintOrderMap = new Map();
      layout.nodeIndex.forEach((nodeIdx, layoutIdx) => {
        paintOrderMap.set(nodeIdx, layout.paintOrders[layoutIdx]);
      });

      visibleBoxes.sort((a, b) => {
        const paintA = paintOrderMap.get(a.nodeIndex) || 0;
        const paintB = paintOrderMap.get(b.nodeIndex) || 0;
        return paintB - paintA;
      });
      debugLog(JSON.stringify(visibleBoxes));

      const occupiedAreas = [];
      const filteredBoxes = [];

      for (const box of visibleBoxes) {
        const paintOrder = paintOrderMap.get(box.nodeIndex) || 0;
        let boxArea;

        if (USE_TEXT_BOX_FOR_OCCLUSION_TEST) {
          // Use the text box bounds for occlusion testing
          const bounds = box.boundingBox;
          boxArea = {
            x: bounds.x,
            y: bounds.y,
            right: bounds.x + bounds.width,
            bottom: bounds.y + bounds.height,
          };
        } else {
          // Use the parent element's bounds for occlusion testing
          const parentLayoutIndex = getParentElementLayoutIndex(box.nodeIndex, layout, nodeToParent);
          if (parentLayoutIndex === -1) {
            debugLog(`No parent element found for box "${box.text}" (node ${box.nodeIndex})`);
            continue;
          }
          const parentBounds = layout.bounds[parentLayoutIndex];
          boxArea = {
            x: parentBounds[0],
            y: parentBounds[1],
            right: parentBounds[0] + parentBounds[2],
            bottom: parentBounds[1] + parentBounds[3],
          };
        }

        // Check if this box overlaps in any way with an occupied area (which has a higher paint order)
        let isOccluded = false;
        for (const occupied of occupiedAreas) {
          // Calculate overlaps
          const horizontalOverlap = Math.min(boxArea.right, occupied.right) - 
                                   Math.max(boxArea.x, occupied.x);
          const verticalOverlap = Math.min(boxArea.bottom, occupied.bottom) - 
                                 Math.max(boxArea.y, occupied.y);
          
          // Get box height for vertical threshold calculation
          const boxHeight = boxArea.bottom - boxArea.y;
          const verticalThreshold = boxHeight * 0.2; // 20% of box height
          
          // Check if overlap exceeds allowed thresholds
          const exceedsHorizontal = horizontalOverlap > 5; // More than 5 pixels
          const exceedsVertical = verticalOverlap > verticalThreshold; // More than 20%
          
          // Box is occluded only if BOTH horizontal AND vertical overlaps exceed thresholds
          if (exceedsHorizontal && exceedsVertical) {
            debugLog(`Box "${box.text}" (node ${box.nodeIndex}, paintOrder ${paintOrder}) occluded by prior area with bounds [${occupied.x}, ${occupied.y}, ${occupied.right}, ${occupied.bottom}]`);
            debugLog(`Horizontal overlap: ${horizontalOverlap}px (max 5px), Vertical overlap: ${verticalOverlap}px (max ${verticalThreshold}px)`);
            isOccluded = true;
            break;
          }
        }

        if (!isOccluded) {
          filteredBoxes.push(box);
          occupiedAreas.push(boxArea);
          debugLog(`Box "${box.text}" (node ${box.nodeIndex}, paintOrder ${paintOrder}) added as visible with bounds [${boxArea.x}, ${boxArea.y}, ${boxArea.right}, ${boxArea.bottom}]`);
        }
      }

      visibleBoxes = filteredBoxes;
      debugLog(`Filtered down to ${visibleBoxes.length} visible boxes after occlusion check`);
      debugLog(JSON.stringify(visibleBoxes));
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
        debugLog(`Node ${nodeIdx} (Tag: ${formatTag(tagName, isTextNode, textContent)}) subtree text: [${subtreeTexts.join(', ')}]`);
      }
      textContent = subtreeTexts.join(' ');
    }

    if (textBoxMap.has(nodeIdx)) {
      const boxes = textBoxMap.get(nodeIdx);
      const rows = groupByRow(boxes, b => [b.termY]);
      adjustBoxPositions(rows, nodeIdx);

      const termBox = computeBoundingTermBox(boxes);
      const finalGuiBox = computeFinalGuiBox(nodeIdx, snapshot, boxes, guiBox);
      const boxType = boxes[0].type || 'text';
      const displayText = boxType === 'media' ? boxes[0].text : (boxes[0]?.text || textContent);

      debugLog(`Leaf Node ${nodeIdx} (${boxType}) TUI bounds: (${termBox.minX}, ${termBox.minY}) to (${termBox.maxX}, ${termBox.maxY})`);
      return { termBox, guiBox: finalGuiBox, text: displayText };
    }

    const childBoxes = processChildNodes(children, childrenMap, textBoxMap, snapshot, nodes);
    if (childBoxes.length === 0) {
      debugLog(`Node ${nodeIdx} (Tag: ${formatTag(tagName, isTextNode, textContent)}) has no children with boxes`);
      return null;
    }

    adjustChildNodesOverlap(childBoxes, textBoxMap, childrenMap);
    const termBox = computeBoundingTermBox(childBoxes);

    debugLog(`Node ${nodeIdx} (Tag: ${formatTag(tagName, isTextNode, textContent)}) final TUI bounds: (${termBox.minX}, ${termBox.minY}) to (${termBox.maxX}, ${termBox.maxY})`);
    return { termBox, guiBox, text: textContent };
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

