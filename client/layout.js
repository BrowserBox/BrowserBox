#!/usr/bin/env node

import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

/**
 * Prints text from a web page to scaled terminal coordinates using Chrome DevTools Protocol.
 * @param {Object} params - The API object containing send and on functions.
 * @param {Function} params.send - Function to send CDP commands.
 * @param {Function} params.on - Function to listen for CDP events (unused here).
 */
export async function printTextLayoutToTerminal({ send, on }) {
  try {
    // Step 1: Enable necessary CDP domains
    await send('DOM.enable', {});
    await send('DOMSnapshot.enable', {});

    // Step 2: Capture a snapshot of the page
    const snapshot = await send('DOMSnapshot.captureSnapshot', {});

    // Step 3: Extract text layout boxes from the snapshot
    const textLayoutBoxes = extractTextLayoutBoxes(snapshot);

    // Step 4: Get terminal dimensions
    const { columns: termWidth, rows: termHeight } = await getTerminalSize();

    // Step 5: Get page content dimensions from the snapshot
    const { contentWidth, contentHeight } = snapshot.documents[0];

    // Step 6: Calculate scaling factors
    const scaleX = termWidth / contentWidth;
    const scaleY = termHeight / contentHeight;

    // Step 7: Clear the terminal
    process.stdout.write('\\033[2J');

    // Step 8: Print each text at its scaled terminal position
    for (const { text, boundingBox } of textLayoutBoxes) {
      const termX = Math.floor(boundingBox.x * scaleX);
      const termY = Math.floor(boundingBox.y * scaleY);

      // Clamp coordinates to fit within terminal bounds
      const clampedX = Math.max(0, Math.min(termX, termWidth - 1));
      const clampedY = Math.max(0, Math.min(termY, termHeight - 1));

      // Move cursor to position and print text (ANSI is 1-based)
      process.stdout.write(`\\033[${clampedY + 1};${clampedX + 1}H${text}`);
    }

    console.log('\nText layout printed to terminal successfully!');
  } catch (error) {
    console.error('Error printing text layout:', error);
  }
}

/**
 * Extracts text and their bounding boxes from a CDP snapshot.
 * @param {Object} snapshot - The snapshot object from DOMSnapshot.captureSnapshot.
 * @returns {Array} Array of objects with text and boundingBox properties.
 */
function extractTextLayoutBoxes(snapshot) {
  const textLayoutBoxes = [];
  const domNodes = snapshot.documents[0].domNodes;

  for (const node of domNodes) {
    // Check if it's a text node with content
    if (node.nodeType === 3 && node.textValue) {
      const textValue = node.textValue;

      // Process each text fragment for this node
      for (const fragment of node.textFragments || []) {
        const { range, boundingBox } = fragment;
        const text = textValue.substring(range.start, range.start + range.length);
        textLayoutBoxes.push({ text, boundingBox });
      }
    }
  }

  return textLayoutBoxes;
}

/**
 * Gets the current terminal size in columns and rows.
 * @returns {Promise<Object>} Object with columns and rows properties.
 */
async function getTerminalSize() {
  const { stdout } = await execAsync('stty size');
  const [rows, columns] = stdout.trim().split(' ').map(Number);
  return { columns, rows };
}

// Example usage (uncomment to test if running directly)
// if (import.meta.url === `file://${process.argv[1]}`) {
//   const mockApi = {
//     send: async (method, params) => {
//       console.log(`Mock send: ${method}`);
//       return { documents: [{ domNodes: [], contentWidth: 800, contentHeight: 600 }] };
//     },
//     on: () => {},
//   };
//   await printTextLayoutToTerminal(mockApi);
// }
