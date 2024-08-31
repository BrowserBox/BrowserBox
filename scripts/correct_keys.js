#!/usr/bin/env node

import fs from 'fs';

import _keyDefinitions from '../src/public/kbd.js';

const correctKeyDefinitions = (definitions) => {
  for (const [key, value] of Object.entries(definitions)) {
    // Check if keyCode needs to be added or corrected
    if (typeof value.keyCode !== 'number') {
      const keyCode = key.charCodeAt(0);
      console.log(`Adding keyCode for '${key}': ${keyCode}`);
      value.keyCode = keyCode;
    } else if (key !== 'Power' && key !== 'Eject' && key !== 'Cancel') {
      const expectedKeyCode = key.charCodeAt(0);
      if (value.keyCode !== expectedKeyCode) {
        console.log(`Correcting keyCode for '${key}': ${value.keyCode} -> ${expectedKeyCode}`);
        value.keyCode = expectedKeyCode;
      }
    }

    // Ensure 'key' field is the character itself if it's missing or incorrect
    if (value.key !== key) {
      console.log(`Correcting key for '${key}': ${value.key} -> ${key}`);
      value.key = key;
    }

    // Ensure 'code' field is correct based on the key
    if (value.code !== undefined) {
      if (value.code.startsWith('Key') || value.code.startsWith('Digit')) {
        const expectedCode =
          key.length === 1 && /^[a-zA-Z]$/.test(key)
            ? `Key${key.toUpperCase()}`
            : /^[0-9]$/.test(key)
            ? `Digit${key}`
            : value.code;
        if (value.code !== expectedCode) {
          console.log(`Correcting code for '${key}': ${value.code} -> ${expectedCode}`);
          value.code = expectedCode;
        }
      }
    } else {
      if (/^[a-zA-Z]$/.test(key)) {
        const code = `Key${key.toUpperCase()}`;
        console.log(`Adding code for '${key}': ${code}`);
        value.code = code;
      } else if (/^[0-9]$/.test(key)) {
        const code = `Digit${key}`;
        console.log(`Adding code for '${key}': ${code}`);
        value.code = code;
      } else {
        // Handle special keys here if needed
      }
    }
  }

  return definitions;
};

// Correct the key definitions
const correctedKeyDefinitions = correctKeyDefinitions(_keyDefinitions);

// Convert the corrected object to the desired format
const outputContent = `
const keys = ${JSON.stringify(correctedKeyDefinitions, null, 2)};

export default keys;
`;

// Write the corrected object to kbd2.js
fs.writeFileSync('kbd2.js', outputContent.trim(), 'utf8');

console.log("Corrected key definitions written to 'kbd2.js'");

