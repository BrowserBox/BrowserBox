#!/usr/bin/env node

// creating this is diabolical. it should be an interview question. 

import fs from 'fs';
import _keyDefinitions from '../src/public/kbd.js';

/**
 * Corrects the key definitions according to the given specification.
 * 
 * @param {Object} definitions - The original key definitions.
 * @returns {Object} The corrected key definitions.
 */
// Correct key definitions
const correctKeyDefinitions = (definitions) => {
  for (const [key, value] of Object.entries(definitions)) {
    if (isSpecialHandlingKey(key)) {
      continue;
    }

    const significantKey = extractSignificantKey(key);

    if (!value.shiftKeyCode && !value.text) {
      value.keyCode = significantKey.charCodeAt(0);
    }

    if (!value.text && value.key !== significantKey) {
      value.key = significantKey;
    }

    // Pass original value to retain the original code for non-alphanumeric keys
    const expectedCode = generateExpectedCode(significantKey, value);
    if (value.code !== expectedCode) {
      value.code = expectedCode;
    }

    const correctShiftKey = calculateShiftKey(significantKey);
    if (correctShiftKey && value.shiftKey !== correctShiftKey) {
      value.shiftKey = correctShiftKey;
    }
  }
  return definitions;
};

/**
 * Checks if a key requires special handling.
 * 
 * @param {string} key - The key to check.
 * @returns {boolean} True if the key is a special handling key, false otherwise.
 */
const isSpecialHandlingKey = (key) => {
  const specialHandlingKeys = [
    'Power', 'Eject', 'Abort', 'Help', 'Backspace', 'Tab', 'Numpad5', 'NumpadEnter', 
    'Enter', '\r', '\n', 'ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight',
    'AltLeft', 'AltRight', 'Pause', 'CapsLock', 'Escape', 'Convert', 'NonConvert',
    'Space', 'Numpad9', 'PageUp', 'Numpad3', 'PageDown', 'End', 'Numpad1', 'Home',
    'Numpad7', 'ArrowLeft', 'Numpad4', 'Numpad8', 'ArrowUp', 'ArrowRight', 'Numpad6',
    'Numpad2', 'ArrowDown', 'Select', 'Open', 'PrintScreen', 'Insert', 'Numpad0', 
    'Delete', 'NumpadDecimal', 'MetaLeft', 'MetaRight', 'ContextMenu', 'NumpadMultiply',
    'NumpadAdd', 'NumpadSubtract', 'NumpadDivide', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6',
    'F7', 'F8', 'F9', 'F10', 'F11', 'F12', 'F13', 'F14', 'F15', 'F16', 'F17', 'F18',
    'F19', 'F20', 'F21', 'F22', 'F23', 'F24', 'NumLock', 'ScrollLock', 'AudioVolumeMute',
    'AudioVolumeDown', 'AudioVolumeUp', 'MediaTrackNext', 'MediaTrackPrevious', 
    'MediaStop', 'MediaPlayPause', 'Semicolon', 'Equal', 'NumpadEqual', 'Comma', 
    'Minus', 'Period', 'Slash', 'Backquote', 'BracketLeft', 'Backslash', 'BracketRight',
    'Quote', 'AltGraph', 'Props', 'Cancel', 'Clear', 'Shift', 'Control', 'Alt', 
    'Accept', 'ModeChange', 'Print', 'Execute', '\u0000', 'Meta', 'Attn', 'CrSel', 
    'ExSel', 'EraseEof', 'Play', 'ZoomOut'
  ];
  return specialHandlingKeys.includes(key);
};

/**
 * Extracts the significant part of the key.
 * 
 * @param {string} key - The original key.
 * @returns {string} The significant part of the key.
 */
const extractSignificantKey = (key) => {
  return key.startsWith('Key') || key.startsWith('Digit')
    ? key.slice(3)
    : key;
};

/**
 * Generates the expected code based on the significant key.
 * 
 * @param {string} significantKey - The significant part of the key.
 * @param {Object} originalValue - The original value of the key definition.
 * @returns {string} The expected code.
 */
const generateExpectedCode = (significantKey, originalValue) => {
  if (/^[a-zA-Z]$/.test(significantKey)) {
    return `Key${significantKey.toUpperCase()}`;
  } else if (/^[0-9]$/.test(significantKey)) {
    return `Digit${significantKey}`;
  } else {
    // For non-alphanumeric keys, retain the original code if it exists
    return originalValue.code || undefined;
  }
};

/**
 * Calculates the shiftKey value based on the significant key.
 * 
 * @param {string} significantKey - The significant part of the key.
 * @returns {string|null} The shiftKey value, or null if not applicable.
 */
const calculateShiftKey = (significantKey) => {
  if (/^[a-z]$/.test(significantKey)) {
    return significantKey.toUpperCase();
  } else if (/^[A-Z]$/.test(significantKey)) {
    return significantKey;
  } else if (/^[0-9]$/.test(significantKey)) {
    const shiftSymbols = ")!@#$%^&*(";
    return shiftSymbols[parseInt(significantKey, 10)];
  }
  return undefined;
};

/**
 * Formats the corrected definitions and writes them to a file.
 * 
 * @param {Object} definitions - The corrected key definitions.
 * @param {string} filename - The file to write to.
 */
const formatSpecialKey = (entry, key) => {
  if (entry.code === 'NumpadDecimal' && entry.keyCode === 46) {
    // Handle the special case for NumpadDecimal
    key = '\\u0000';
    entry.key = '\\u0000'
  } else if (key === '\r') {
    key = '\\r';
  } else if (key === '\n') {
    key = '\\n';
  } else if (key == '\'') {
    key = '\\\'';
  } else if (key == '\\') {
    key = '\\\\';
  }
  return key;
};

const formatAndWriteDefinitions = (definitions, filename) => {
  const sortedKeys = Object.keys(definitions).sort();
  const formattedOutput = sortedKeys.map(key => {
    const entry = definitions[key];

    // Handle special keys like '\u0000', '\r', '\n'
    const formattedKey = formatSpecialKey(entry, key);

    const formattedEntry = Object.entries(entry)
      .map(([field, value]) => {
        if (field === 'key' && entry.code === 'NumpadDecimal' && entry.keyCode == 46 ) {
          return `${field}: '${'\\'}${'u'}${'0000'}'`;  // Write \u0000 as a literal, not escaped
        } else if (typeof value === 'string') {
          // Properly escape special characters in values
          value = value
            .replace(/\\/g, '\\\\')  // Escape backslashes
            .replace(/'/g, '\\\'')    // Escape single quotes
            .replace(/\r/g, '\\r')    // Replace carriage return with '\r'
            .replace(/\n/g, '\\n');   // Replace newline with '\n'
          return `${field}: '${value}'`;
        } else {
          return `${field}: ${value}`;
        }
      })
      .join(', ');

    // Format the key properly, ensuring special cases are handled
    const quotedKey = formattedKey.startsWith('\\u') ? `'${formattedKey}'` : `'${formattedKey}'`;

    return `  ${quotedKey}: { ${formattedEntry} }`;
  });

  const outputContent = `const keys = {\n${formattedOutput.join(',\n')}\n};\n\nexport default keys;`;

  // Write the formatted output to the file
  fs.writeFileSync(filename, outputContent, 'utf8');
};


/**
 * Determines if a key needs quotes based on its characters.
 * 
 * @param {string} key - The key to check.
 * @returns {boolean} True if the key needs quotes, false otherwise.
 */
const isKeyNeedingQuotes = (key) => {
  return !/^[a-zA-Z_]\w*$/.test(key);
};

// Correct the key definitions
const correctedKeyDefinitions = correctKeyDefinitions(_keyDefinitions);

// Write the corrected definitions to a new file
formatAndWriteDefinitions(correctedKeyDefinitions, 'kbd2.js');

console.log("Corrected key definitions written to 'kbd2.js'");

