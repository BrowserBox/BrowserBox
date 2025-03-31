const GAP = 1;
// LayoutAlgorithm.js
// A singleton module that implements the layout processing algorithm.
import {debugLog,DEBUG} from './log.js';

const LayoutAlgorithm = (() => {
  // --------------------------
  // Utility Functions
  // --------------------------

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
  function groupByRow(items, getRow) {
    const rows = new Map();
    for (const item of items) {
      const row = getRow(item);
      if (!rows.has(row)) rows.set(row, []);
      rows.get(row).push(item);
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
    iterateTextBoxesForNode(nodeIdx, snapshot, (i, layoutIdx, textIndex, textBoxes) => {
      const bounds = textBoxes.bounds[i];
      boundsList.push({ x: bounds[0], y: bounds[1], width: bounds[2], height: bounds[3] });
      if (textIndex !== -1 && textIndex < snapshot.strings.length) {
        const text = snapshot.strings[textIndex]
          .substring(textBoxes.start[i], textBoxes.start[i] + textBoxes.length[i])
          .trim();
        if (text) textParts.push(text);
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
    return { text: textContent, guiBox };
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
    const rows = groupByRow(boxes, b => b.termY);
    adjustBoxPositions(rows, nodeIdx);

    const termBox = computeBoundingTermBox(boxes);
    const finalGuiBox = computeFinalGuiBox(nodeIdx, snapshot, boxes, guiBox);

    debugLog(
      `Leaf Node ${nodeIdx} TUI bounds: (${termBox.minX}, ${termBox.minY}) to (${termBox.maxX}, ${termBox.maxY}) | GUI bounds: (${finalGuiBox.x}, ${finalGuiBox.y}, ${finalGuiBox.width}, ${finalGuiBox.height})`
    );
    return { termBox, guiBox: finalGuiBox, text: boxes[0]?.text || textContent };
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
    const rows = groupByRow(childBoxes, cb => cb.termBox.minY);
    let maxXChild = null;
    let maxXOverall = -Infinity;

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

    // Process node based on type.
    if (isTextNode) {
      const textResult = processTextNode(nodeIdx, snapshot, nodes);
      if (!textResult) return null;
      textContent = textResult.text;
      guiBox = textResult.guiBox;
    } else {
      guiBox = getGuiBoxForNonText(nodeIdx, snapshot, tagName);
    }

    const children = childrenMap.get(nodeIdx) || [];

    // Collect subtree text for debugging.
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

    // Handle leaf nodes with text boxes.
    if (textBoxMap.has(nodeIdx)) {
      return processLeafNode(nodeIdx, textBoxMap, snapshot, textContent, guiBox);
    }

    // Process child nodes recursively.
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
    processNode
    // Additional functions can be exported here if needed.
  };
})();

export default LayoutAlgorithm;

