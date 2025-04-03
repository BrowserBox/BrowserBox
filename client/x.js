const LayoutAlgorithm = (() => {
  // --------------------------
  // Global Configuration
  // --------------------------
  const USE_TEXT_BOX_FOR_OCCLUSION_TEST = true; // Set to true to use text box bounds for occlusion test

  // --------------------------
  // Shared Helper Functions (unchanged from previous)
  // --------------------------

  // Helper to get computed styles as a key-value object
  function getComputedStyles(layoutIndex, layout, strings) {
    if (layoutIndex === -1) return {};
    const computedStyleKeys = ['display', 'visibility', 'overflow', 'position', 'width', 'height', 'transform'];
    const styleIndexes = layout.styles[layoutIndex] || [];
    const styleValues = styleIndexes.map(idx => strings[idx]);
    const styleMap = {};
    computedStyleKeys.forEach((key, i) => {
      if (styleValues[i]) {
        styleMap[key] = styleValues[i];
      }
    });
    fs.appendFileSync('computed-styles.log', `layoutIndex ${layoutIndex}: ${JSON.stringify(styleMap)}\n`);
    return styleMap;
  }

  // Helper to find the layoutIndex of a node's parent element
  function getParentElementLayoutIndex(nodeIndex, layout, nodeToParent) {
    let currentIndex = nodeIndex;
    while (currentIndex !== -1) {
      const parentIndex = nodeToParent.get(currentIndex);
      if (parentIndex === -1) return -1;
      const parentLayoutIndex = layout.nodeIndex.indexOf(parentIndex);
      if (parentLayoutIndex !== -1) return parentLayoutIndex;
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
      if (styles.visibility === 'hidden' || styles.display === 'none') {
        debugLog(`Node ${nodeIndex} hidden by styles: ${JSON.stringify(styles)}`);
        return true;
      }
      const width = styles.width || 'auto';
      const height = styles.height || 'auto';
      const isZeroWidth = width === '0' || width === '0px';
      const isZeroHeight = height === '0' || height === '0px';
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
    let currentIndex = nodeToParent.get(nodeIndex);
    let currentLayoutIndex = currentIndex !== -1 ? layout.nodeIndex.indexOf(currentIndex) : -1;

    const parentStyles = getComputedStyles(currentLayoutIndex, layout, strings);
    const isAbsolutelyPositioned = parentStyles.position === 'absolute';

    if (isAbsolutelyPositioned) {
      debugLog(`Parent of node ${nodeIndex} is absolutely positioned, not clipped by parent: ${JSON.stringify(parentStyles)}`);
      return false;
    }

    let depth = 0;
    while (currentIndex !== -1 && currentLayoutIndex !== -1) {
      const styles = getComputedStyles(currentLayoutIndex, layout, strings);
      const hasOverflowHidden = styles.overflow === 'hidden';
      const width = styles.width || 'auto';
      const height = styles.height || 'auto';

      const isZeroWidth = width === '0' || width === '0px';
      const isZeroHeight = height === '0' || height === '0px';

      if ((isZeroWidth || isZeroHeight) && hasOverflowHidden) {
        debugLog(`Node ${nodeIndex} clipped by ancestor ${currentIndex} at depth ${depth} with styles: ${JSON.stringify(styles)}`);
        return true;
      }

      currentIndex = nodeToParent.get(currentIndex);
      currentLayoutIndex = currentIndex !== -1 ? layout.nodeIndex.indexOf(currentIndex) : -1;
      depth++;
    }
    return false;
  }

  function isNodeClickable(nodeIndex, clickableIndexes, nodeToParent) {
    let currentIndex = nodeIndex;
    while (currentIndex !== -1) {
      if (clickableIndexes.has(currentIndex)) return true;
      currentIndex = nodeToParent.get(currentIndex);
    }
    return false;
  }

  // --------------------------
  // extractTextLayoutBoxes (unchanged)
  // --------------------------

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

      const parentLayoutIndex = getParentElementLayoutIndex(nodeIndex, layout, nodeToParent);
      if (parentLayoutIndex === -1) {
        DEBUG && terminal.yellow(`No parent element found for text box ${i} (nodeIndex: ${nodeIndex})\n`);
        continue;
      }

      const parentStyles = getComputedStyles(parentLayoutIndex, layout, strings);
      const parentWidth = parentStyles.width || 'auto';
      const parentHeight = parentStyles.height || 'auto';
      const isZeroWidth = parentWidth === '0' || parentWidth === '0px';
      const isZeroHeight = parentHeight === '0' || parentHeight === '0px';

      if (isZeroWidth || isZeroHeight) {
        DEBUG && terminal.yellow(`Skipping text box ${i} with zero dimensions in parent (width: ${parentWidth}, height: ${parentHeight})\n`);
        continue;
      }

      if (isHiddenByStyles(nodeIndex, parentLayoutIndex, layout, strings, nodeToParent)) {
        DEBUG && terminal.yellow(`Skipping text box ${i} due to visibility: hidden, display: none, or zero dimensions\n`);
        continue;
      }

      if (isClippedByParent(nodeIndex, parentLayoutIndex, layout, strings, nodeToParent)) {
        DEBUG && terminal.yellow(`Skipping text box ${i} due to parent clipping (width: 0, overflow: hidden)\n`);
        continue;
      }

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

    return { textLayoutBoxes, clickableElements, layoutToNode, nodeToParent, nodes };
  }

  // --------------------------
  // Updated prepareLayoutState
  // --------------------------

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
          const hasOverlap = !(
            boxArea.right <= occupied.x ||
            boxArea.x >= occupied.right ||
            boxArea.bottom <= occupied.y ||
            boxArea.y >= occupied.bottom
          );
          if (hasOverlap) {
            debugLog(`Box "${box.text}" (node ${box.nodeIndex}, paintOrder ${paintOrder}) occluded by prior area with bounds [${occupied.x}, ${occupied.y}, ${occupied.right}, ${occupied.bottom}]`);
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

  // --------------------------
  // Rest of LayoutAlgorithm (unchanged)
  // --------------------------

  return {
    processNode,
    extractTextLayoutBoxes,
    prepareLayoutState,
  };
})();
