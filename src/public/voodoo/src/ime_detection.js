import {DEBUG} from './common.js';

  const imeLikelyUnicodeRanges = [
    // Combining broad ranges for languages often using IME
    [0x2E80, 0x9FFF], // Includes CJK characters and some additional ranges
    [0x0E00, 0x0E7F], // Thai
    [0x0900, 0x097F], // Devanagari (used in Hindi and other languages)
    // ... Add other ranges as needed
  ];

  function isInUnicodeRange(char, ranges) {
    const codePoint = char.codePointAt(0);
    return ranges.some(([start, end]) => codePoint >= start && codePoint <= end);
  }

  export function detectIMEInput(inputField, state) {
    const ranges = imeLikelyUnicodeRanges;
    if ( inputField.imeDetection ) return;
    inputField.imeDetection = 1;
    let usingIME = false;

    inputField.addEventListener('compositionstart', () => {
      usingIME = true;
      state.usingIME = usingIME;
      DEBUG.debugIMEDetection && console.log('IME is being used.', {usingIME});
    });

    inputField.addEventListener('compositionend', () => {
      usingIME = false;
      state.usingIME = usingIME;
      DEBUG.debugIMEDetection && console.log('IME is NOT being used.', {usingIME});
    });

    self.inputField = inputField;
    inputField.addEventListener('input', () => {
      const lastChar = inputField.value.slice(-1);

      // Check if the last character falls within the typical IME Unicode ranges
      const imeLikely = isInUnicodeRange(lastChar, ranges);

      usingIME ||= imeLikely;

      if (usingIME || imeLikely) {
        DEBUG.debugIMEDetection && console.log('IME is likely being used.', {usingIME, imeLikely});
      } else {
        DEBUG.debugIMEDetection && console.log('Regular input or post-IME input.', {usingIME, imeLikely});
      }

      state.usingIME = usingIME;
      DEBUG.debugIMEDetection && console.log('using ime', state.currentInputLanguageUsesIME, state);
    }, {capture: true});

    inputField.imeDetection = 2;
    DEBUG.debugIMEDetection && console.log('installed ime detection');
  }

