(function () {
  'use strict';

  function handleSelectMessage(_ref, state) {
    let {
      selectInput: {
        selectOpen,
        values,
        selected
      },
      executionContextId
    } = _ref;
    state.waitingExecutionContext = executionContextId;
    if (state.ignoreSelectInputEvents) return;
    toggleSelect({
      selectOpen,
      values,
      selected
    });
  }

  function toggleSelect(_ref2) {
    let {
      selectOpen,
      values,
      selected
    } = _ref2;
    const input = document.querySelector('#selectinput');

    if (selectOpen) {
      input.innerHTML = values;
      input.selectedIndex = selected;
      input.classList.add('open'); //input.focus();
    } else {
      input.classList.remove('open');
      input.innerHTML = ""; //input.blur();
    }
  }

  /* eslint-disable no-useless-escape */
  const keys = {
    '0': {
      'keyCode': 48,
      'key': '0',
      'code': 'Digit0'
    },
    '1': {
      'keyCode': 49,
      'key': '1',
      'code': 'Digit1'
    },
    '2': {
      'keyCode': 50,
      'key': '2',
      'code': 'Digit2'
    },
    '3': {
      'keyCode': 51,
      'key': '3',
      'code': 'Digit3'
    },
    '4': {
      'keyCode': 52,
      'key': '4',
      'code': 'Digit4'
    },
    '5': {
      'keyCode': 53,
      'key': '5',
      'code': 'Digit5'
    },
    '6': {
      'keyCode': 54,
      'key': '6',
      'code': 'Digit6'
    },
    '7': {
      'keyCode': 55,
      'key': '7',
      'code': 'Digit7'
    },
    '8': {
      'keyCode': 56,
      'key': '8',
      'code': 'Digit8'
    },
    '9': {
      'keyCode': 57,
      'key': '9',
      'code': 'Digit9'
    },
    'Power': {
      'key': 'Power',
      'code': 'Power'
    },
    'Eject': {
      'key': 'Eject',
      'code': 'Eject'
    },
    'Abort': {
      'keyCode': 3,
      'code': 'Abort',
      'key': 'Cancel'
    },
    'Help': {
      'keyCode': 6,
      'code': 'Help',
      'key': 'Help'
    },
    'Backspace': {
      'keyCode': 8,
      'code': 'Backspace',
      'key': 'Backspace'
    },
    'Tab': {
      'keyCode': 9,
      'code': 'Tab',
      'key': 'Tab'
    },
    'Numpad5': {
      'keyCode': 12,
      'shiftKeyCode': 101,
      'key': 'Clear',
      'code': 'Numpad5',
      'shiftKey': '5',
      'location': 3
    },
    'NumpadEnter': {
      'keyCode': 13,
      'code': 'NumpadEnter',
      'key': 'Enter',
      'text': '\r',
      'location': 3
    },
    'Enter': {
      'keyCode': 13,
      'code': 'Enter',
      'key': 'Enter',
      'text': '\r'
    },
    '\r': {
      'keyCode': 13,
      'code': 'Enter',
      'key': 'Enter',
      'text': '\r'
    },
    '\n': {
      'keyCode': 13,
      'code': 'Enter',
      'key': 'Enter',
      'text': '\r'
    },
    'ShiftLeft': {
      'keyCode': 16,
      'code': 'ShiftLeft',
      'key': 'Shift',
      'location': 1
    },
    'ShiftRight': {
      'keyCode': 16,
      'code': 'ShiftRight',
      'key': 'Shift',
      'location': 2
    },
    'ControlLeft': {
      'keyCode': 17,
      'code': 'ControlLeft',
      'key': 'Control',
      'location': 1
    },
    'ControlRight': {
      'keyCode': 17,
      'code': 'ControlRight',
      'key': 'Control',
      'location': 2
    },
    'AltLeft': {
      'keyCode': 18,
      'code': 'AltLeft',
      'key': 'Alt',
      'location': 1
    },
    'AltRight': {
      'keyCode': 18,
      'code': 'AltRight',
      'key': 'Alt',
      'location': 2
    },
    'Pause': {
      'keyCode': 19,
      'code': 'Pause',
      'key': 'Pause'
    },
    'CapsLock': {
      'keyCode': 20,
      'code': 'CapsLock',
      'key': 'CapsLock'
    },
    'Escape': {
      'keyCode': 27,
      'code': 'Escape',
      'key': 'Escape'
    },
    'Convert': {
      'keyCode': 28,
      'code': 'Convert',
      'key': 'Convert'
    },
    'NonConvert': {
      'keyCode': 29,
      'code': 'NonConvert',
      'key': 'NonConvert'
    },
    'Space': {
      'keyCode': 32,
      'code': 'Space',
      'key': ' '
    },
    'Numpad9': {
      'keyCode': 33,
      'shiftKeyCode': 105,
      'key': 'PageUp',
      'code': 'Numpad9',
      'shiftKey': '9',
      'location': 3
    },
    'PageUp': {
      'keyCode': 33,
      'code': 'PageUp',
      'key': 'PageUp'
    },
    'Numpad3': {
      'keyCode': 34,
      'shiftKeyCode': 99,
      'key': 'PageDown',
      'code': 'Numpad3',
      'shiftKey': '3',
      'location': 3
    },
    'PageDown': {
      'keyCode': 34,
      'code': 'PageDown',
      'key': 'PageDown'
    },
    'End': {
      'keyCode': 35,
      'code': 'End',
      'key': 'End'
    },
    'Numpad1': {
      'keyCode': 35,
      'shiftKeyCode': 97,
      'key': 'End',
      'code': 'Numpad1',
      'shiftKey': '1',
      'location': 3
    },
    'Home': {
      'keyCode': 36,
      'code': 'Home',
      'key': 'Home'
    },
    'Numpad7': {
      'keyCode': 36,
      'shiftKeyCode': 103,
      'key': 'Home',
      'code': 'Numpad7',
      'shiftKey': '7',
      'location': 3
    },
    'ArrowLeft': {
      'keyCode': 37,
      'code': 'ArrowLeft',
      'key': 'ArrowLeft'
    },
    'Numpad4': {
      'keyCode': 37,
      'shiftKeyCode': 100,
      'key': 'ArrowLeft',
      'code': 'Numpad4',
      'shiftKey': '4',
      'location': 3
    },
    'Numpad8': {
      'keyCode': 38,
      'shiftKeyCode': 104,
      'key': 'ArrowUp',
      'code': 'Numpad8',
      'shiftKey': '8',
      'location': 3
    },
    'ArrowUp': {
      'keyCode': 38,
      'code': 'ArrowUp',
      'key': 'ArrowUp'
    },
    'ArrowRight': {
      'keyCode': 39,
      'code': 'ArrowRight',
      'key': 'ArrowRight'
    },
    'Numpad6': {
      'keyCode': 39,
      'shiftKeyCode': 102,
      'key': 'ArrowRight',
      'code': 'Numpad6',
      'shiftKey': '6',
      'location': 3
    },
    'Numpad2': {
      'keyCode': 40,
      'shiftKeyCode': 98,
      'key': 'ArrowDown',
      'code': 'Numpad2',
      'shiftKey': '2',
      'location': 3
    },
    'ArrowDown': {
      'keyCode': 40,
      'code': 'ArrowDown',
      'key': 'ArrowDown'
    },
    'Select': {
      'keyCode': 41,
      'code': 'Select',
      'key': 'Select'
    },
    'Open': {
      'keyCode': 43,
      'code': 'Open',
      'key': 'Execute'
    },
    'PrintScreen': {
      'keyCode': 44,
      'code': 'PrintScreen',
      'key': 'PrintScreen'
    },
    'Insert': {
      'keyCode': 45,
      'code': 'Insert',
      'key': 'Insert'
    },
    'Numpad0': {
      'keyCode': 45,
      'shiftKeyCode': 96,
      'key': 'Insert',
      'code': 'Numpad0',
      'shiftKey': '0',
      'location': 3
    },
    'Delete': {
      'keyCode': 46,
      'code': 'Delete',
      'key': 'Delete'
    },
    'NumpadDecimal': {
      'keyCode': 46,
      'shiftKeyCode': 110,
      'code': 'NumpadDecimal',
      'key': '\u0000',
      'shiftKey': '.',
      'location': 3
    },
    'Digit0': {
      'keyCode': 48,
      'code': 'Digit0',
      'shiftKey': ')',
      'key': '0'
    },
    'Digit1': {
      'keyCode': 49,
      'code': 'Digit1',
      'shiftKey': '!',
      'key': '1'
    },
    'Digit2': {
      'keyCode': 50,
      'code': 'Digit2',
      'shiftKey': '@',
      'key': '2'
    },
    'Digit3': {
      'keyCode': 51,
      'code': 'Digit3',
      'shiftKey': '#',
      'key': '3'
    },
    'Digit4': {
      'keyCode': 52,
      'code': 'Digit4',
      'shiftKey': '$',
      'key': '4'
    },
    'Digit5': {
      'keyCode': 53,
      'code': 'Digit5',
      'shiftKey': '%',
      'key': '5'
    },
    'Digit6': {
      'keyCode': 54,
      'code': 'Digit6',
      'shiftKey': '^',
      'key': '6'
    },
    'Digit7': {
      'keyCode': 55,
      'code': 'Digit7',
      'shiftKey': '&',
      'key': '7'
    },
    'Digit8': {
      'keyCode': 56,
      'code': 'Digit8',
      'shiftKey': '*',
      'key': '8'
    },
    'Digit9': {
      'keyCode': 57,
      'code': 'Digit9',
      'shiftKey': '\(',
      'key': '9'
    },
    'KeyA': {
      'keyCode': 65,
      'code': 'KeyA',
      'shiftKey': 'A',
      'key': 'a'
    },
    'KeyB': {
      'keyCode': 66,
      'code': 'KeyB',
      'shiftKey': 'B',
      'key': 'b'
    },
    'KeyC': {
      'keyCode': 67,
      'code': 'KeyC',
      'shiftKey': 'C',
      'key': 'c'
    },
    'KeyD': {
      'keyCode': 68,
      'code': 'KeyD',
      'shiftKey': 'D',
      'key': 'd'
    },
    'KeyE': {
      'keyCode': 69,
      'code': 'KeyE',
      'shiftKey': 'E',
      'key': 'e'
    },
    'KeyF': {
      'keyCode': 70,
      'code': 'KeyF',
      'shiftKey': 'F',
      'key': 'f'
    },
    'KeyG': {
      'keyCode': 71,
      'code': 'KeyG',
      'shiftKey': 'G',
      'key': 'g'
    },
    'KeyH': {
      'keyCode': 72,
      'code': 'KeyH',
      'shiftKey': 'H',
      'key': 'h'
    },
    'KeyI': {
      'keyCode': 73,
      'code': 'KeyI',
      'shiftKey': 'I',
      'key': 'i'
    },
    'KeyJ': {
      'keyCode': 74,
      'code': 'KeyJ',
      'shiftKey': 'J',
      'key': 'j'
    },
    'KeyK': {
      'keyCode': 75,
      'code': 'KeyK',
      'shiftKey': 'K',
      'key': 'k'
    },
    'KeyL': {
      'keyCode': 76,
      'code': 'KeyL',
      'shiftKey': 'L',
      'key': 'l'
    },
    'KeyM': {
      'keyCode': 77,
      'code': 'KeyM',
      'shiftKey': 'M',
      'key': 'm'
    },
    'KeyN': {
      'keyCode': 78,
      'code': 'KeyN',
      'shiftKey': 'N',
      'key': 'n'
    },
    'KeyO': {
      'keyCode': 79,
      'code': 'KeyO',
      'shiftKey': 'O',
      'key': 'o'
    },
    'KeyP': {
      'keyCode': 80,
      'code': 'KeyP',
      'shiftKey': 'P',
      'key': 'p'
    },
    'KeyQ': {
      'keyCode': 81,
      'code': 'KeyQ',
      'shiftKey': 'Q',
      'key': 'q'
    },
    'KeyR': {
      'keyCode': 82,
      'code': 'KeyR',
      'shiftKey': 'R',
      'key': 'r'
    },
    'KeyS': {
      'keyCode': 83,
      'code': 'KeyS',
      'shiftKey': 'S',
      'key': 's'
    },
    'KeyT': {
      'keyCode': 84,
      'code': 'KeyT',
      'shiftKey': 'T',
      'key': 't'
    },
    'KeyU': {
      'keyCode': 85,
      'code': 'KeyU',
      'shiftKey': 'U',
      'key': 'u'
    },
    'KeyV': {
      'keyCode': 86,
      'code': 'KeyV',
      'shiftKey': 'V',
      'key': 'v'
    },
    'KeyW': {
      'keyCode': 87,
      'code': 'KeyW',
      'shiftKey': 'W',
      'key': 'w'
    },
    'KeyX': {
      'keyCode': 88,
      'code': 'KeyX',
      'shiftKey': 'X',
      'key': 'x'
    },
    'KeyY': {
      'keyCode': 89,
      'code': 'KeyY',
      'shiftKey': 'Y',
      'key': 'y'
    },
    'KeyZ': {
      'keyCode': 90,
      'code': 'KeyZ',
      'shiftKey': 'Z',
      'key': 'z'
    },
    'MetaLeft': {
      'keyCode': 91,
      'code': 'MetaLeft',
      'key': 'Meta',
      'location': 1
    },
    'MetaRight': {
      'keyCode': 92,
      'code': 'MetaRight',
      'key': 'Meta',
      'location': 2
    },
    'ContextMenu': {
      'keyCode': 93,
      'code': 'ContextMenu',
      'key': 'ContextMenu'
    },
    'NumpadMultiply': {
      'keyCode': 106,
      'code': 'NumpadMultiply',
      'key': '*',
      'location': 3
    },
    'NumpadAdd': {
      'keyCode': 107,
      'code': 'NumpadAdd',
      'key': '+',
      'location': 3
    },
    'NumpadSubtract': {
      'keyCode': 109,
      'code': 'NumpadSubtract',
      'key': '-',
      'location': 3
    },
    'NumpadDivide': {
      'keyCode': 111,
      'code': 'NumpadDivide',
      'key': '/',
      'location': 3
    },
    'F1': {
      'keyCode': 112,
      'code': 'F1',
      'key': 'F1'
    },
    'F2': {
      'keyCode': 113,
      'code': 'F2',
      'key': 'F2'
    },
    'F3': {
      'keyCode': 114,
      'code': 'F3',
      'key': 'F3'
    },
    'F4': {
      'keyCode': 115,
      'code': 'F4',
      'key': 'F4'
    },
    'F5': {
      'keyCode': 116,
      'code': 'F5',
      'key': 'F5'
    },
    'F6': {
      'keyCode': 117,
      'code': 'F6',
      'key': 'F6'
    },
    'F7': {
      'keyCode': 118,
      'code': 'F7',
      'key': 'F7'
    },
    'F8': {
      'keyCode': 119,
      'code': 'F8',
      'key': 'F8'
    },
    'F9': {
      'keyCode': 120,
      'code': 'F9',
      'key': 'F9'
    },
    'F10': {
      'keyCode': 121,
      'code': 'F10',
      'key': 'F10'
    },
    'F11': {
      'keyCode': 122,
      'code': 'F11',
      'key': 'F11'
    },
    'F12': {
      'keyCode': 123,
      'code': 'F12',
      'key': 'F12'
    },
    'F13': {
      'keyCode': 124,
      'code': 'F13',
      'key': 'F13'
    },
    'F14': {
      'keyCode': 125,
      'code': 'F14',
      'key': 'F14'
    },
    'F15': {
      'keyCode': 126,
      'code': 'F15',
      'key': 'F15'
    },
    'F16': {
      'keyCode': 127,
      'code': 'F16',
      'key': 'F16'
    },
    'F17': {
      'keyCode': 128,
      'code': 'F17',
      'key': 'F17'
    },
    'F18': {
      'keyCode': 129,
      'code': 'F18',
      'key': 'F18'
    },
    'F19': {
      'keyCode': 130,
      'code': 'F19',
      'key': 'F19'
    },
    'F20': {
      'keyCode': 131,
      'code': 'F20',
      'key': 'F20'
    },
    'F21': {
      'keyCode': 132,
      'code': 'F21',
      'key': 'F21'
    },
    'F22': {
      'keyCode': 133,
      'code': 'F22',
      'key': 'F22'
    },
    'F23': {
      'keyCode': 134,
      'code': 'F23',
      'key': 'F23'
    },
    'F24': {
      'keyCode': 135,
      'code': 'F24',
      'key': 'F24'
    },
    'NumLock': {
      'keyCode': 144,
      'code': 'NumLock',
      'key': 'NumLock'
    },
    'ScrollLock': {
      'keyCode': 145,
      'code': 'ScrollLock',
      'key': 'ScrollLock'
    },
    'AudioVolumeMute': {
      'keyCode': 173,
      'code': 'AudioVolumeMute',
      'key': 'AudioVolumeMute'
    },
    'AudioVolumeDown': {
      'keyCode': 174,
      'code': 'AudioVolumeDown',
      'key': 'AudioVolumeDown'
    },
    'AudioVolumeUp': {
      'keyCode': 175,
      'code': 'AudioVolumeUp',
      'key': 'AudioVolumeUp'
    },
    'MediaTrackNext': {
      'keyCode': 176,
      'code': 'MediaTrackNext',
      'key': 'MediaTrackNext'
    },
    'MediaTrackPrevious': {
      'keyCode': 177,
      'code': 'MediaTrackPrevious',
      'key': 'MediaTrackPrevious'
    },
    'MediaStop': {
      'keyCode': 178,
      'code': 'MediaStop',
      'key': 'MediaStop'
    },
    'MediaPlayPause': {
      'keyCode': 179,
      'code': 'MediaPlayPause',
      'key': 'MediaPlayPause'
    },
    'Semicolon': {
      'keyCode': 186,
      'code': 'Semicolon',
      'shiftKey': ':',
      'key': ';'
    },
    'Equal': {
      'keyCode': 187,
      'code': 'Equal',
      'shiftKey': '+',
      'key': '='
    },
    'NumpadEqual': {
      'keyCode': 187,
      'code': 'NumpadEqual',
      'key': '=',
      'location': 3
    },
    'Comma': {
      'keyCode': 188,
      'code': 'Comma',
      'shiftKey': '\<',
      'key': ','
    },
    'Minus': {
      'keyCode': 189,
      'code': 'Minus',
      'shiftKey': '_',
      'key': '-'
    },
    'Period': {
      'keyCode': 190,
      'code': 'Period',
      'shiftKey': '>',
      'key': '.'
    },
    'Slash': {
      'keyCode': 191,
      'code': 'Slash',
      'shiftKey': '?',
      'key': '/'
    },
    'Backquote': {
      'keyCode': 192,
      'code': 'Backquote',
      'shiftKey': '~',
      'key': '`'
    },
    'BracketLeft': {
      'keyCode': 219,
      'code': 'BracketLeft',
      'shiftKey': '{',
      'key': '['
    },
    'Backslash': {
      'keyCode': 220,
      'code': 'Backslash',
      'shiftKey': '|',
      'key': '\\'
    },
    'BracketRight': {
      'keyCode': 221,
      'code': 'BracketRight',
      'shiftKey': '}',
      'key': ']'
    },
    'Quote': {
      'keyCode': 222,
      'code': 'Quote',
      'shiftKey': '"',
      'key': '\''
    },
    'AltGraph': {
      'keyCode': 225,
      'code': 'AltGraph',
      'key': 'AltGraph'
    },
    'Props': {
      'keyCode': 247,
      'code': 'Props',
      'key': 'CrSel'
    },
    'Cancel': {
      'keyCode': 3,
      'key': 'Cancel',
      'code': 'Abort'
    },
    'Clear': {
      'keyCode': 12,
      'key': 'Clear',
      'code': 'Numpad5',
      'location': 3
    },
    'Shift': {
      'keyCode': 16,
      'key': 'Shift',
      'code': 'ShiftLeft',
      'location': 1
    },
    'Control': {
      'keyCode': 17,
      'key': 'Control',
      'code': 'ControlLeft',
      'location': 1
    },
    'Alt': {
      'keyCode': 18,
      'key': 'Alt',
      'code': 'AltLeft',
      'location': 1
    },
    'Accept': {
      'keyCode': 30,
      'key': 'Accept'
    },
    'ModeChange': {
      'keyCode': 31,
      'key': 'ModeChange'
    },
    ' ': {
      'keyCode': 32,
      'key': ' ',
      'code': 'Space'
    },
    'Print': {
      'keyCode': 42,
      'key': 'Print'
    },
    'Execute': {
      'keyCode': 43,
      'key': 'Execute',
      'code': 'Open'
    },
    '\u0000': {
      'keyCode': 46,
      'key': '\u0000',
      'code': 'NumpadDecimal',
      'location': 3
    },
    'a': {
      'keyCode': 65,
      'key': 'a',
      'code': 'KeyA'
    },
    'b': {
      'keyCode': 66,
      'key': 'b',
      'code': 'KeyB'
    },
    'c': {
      'keyCode': 67,
      'key': 'c',
      'code': 'KeyC'
    },
    'd': {
      'keyCode': 68,
      'key': 'd',
      'code': 'KeyD'
    },
    'e': {
      'keyCode': 69,
      'key': 'e',
      'code': 'KeyE'
    },
    'f': {
      'keyCode': 70,
      'key': 'f',
      'code': 'KeyF'
    },
    'g': {
      'keyCode': 71,
      'key': 'g',
      'code': 'KeyG'
    },
    'h': {
      'keyCode': 72,
      'key': 'h',
      'code': 'KeyH'
    },
    'i': {
      'keyCode': 73,
      'key': 'i',
      'code': 'KeyI'
    },
    'j': {
      'keyCode': 74,
      'key': 'j',
      'code': 'KeyJ'
    },
    'k': {
      'keyCode': 75,
      'key': 'k',
      'code': 'KeyK'
    },
    'l': {
      'keyCode': 76,
      'key': 'l',
      'code': 'KeyL'
    },
    'm': {
      'keyCode': 77,
      'key': 'm',
      'code': 'KeyM'
    },
    'n': {
      'keyCode': 78,
      'key': 'n',
      'code': 'KeyN'
    },
    'o': {
      'keyCode': 79,
      'key': 'o',
      'code': 'KeyO'
    },
    'p': {
      'keyCode': 80,
      'key': 'p',
      'code': 'KeyP'
    },
    'q': {
      'keyCode': 81,
      'key': 'q',
      'code': 'KeyQ'
    },
    'r': {
      'keyCode': 82,
      'key': 'r',
      'code': 'KeyR'
    },
    's': {
      'keyCode': 83,
      'key': 's',
      'code': 'KeyS'
    },
    't': {
      'keyCode': 84,
      'key': 't',
      'code': 'KeyT'
    },
    'u': {
      'keyCode': 85,
      'key': 'u',
      'code': 'KeyU'
    },
    'v': {
      'keyCode': 86,
      'key': 'v',
      'code': 'KeyV'
    },
    'w': {
      'keyCode': 87,
      'key': 'w',
      'code': 'KeyW'
    },
    'x': {
      'keyCode': 88,
      'key': 'x',
      'code': 'KeyX'
    },
    'y': {
      'keyCode': 89,
      'key': 'y',
      'code': 'KeyY'
    },
    'z': {
      'keyCode': 90,
      'key': 'z',
      'code': 'KeyZ'
    },
    'Meta': {
      'keyCode': 91,
      'key': 'Meta',
      'code': 'MetaLeft',
      'location': 1
    },
    '*': {
      'keyCode': 106,
      'key': '*',
      'code': 'NumpadMultiply',
      'location': 3
    },
    '+': {
      'keyCode': 107,
      'key': '+',
      'code': 'NumpadAdd',
      'location': 3
    },
    '-': {
      'keyCode': 109,
      'key': '-',
      'code': 'NumpadSubtract',
      'location': 3
    },
    '/': {
      'keyCode': 111,
      'key': '/',
      'code': 'NumpadDivide',
      'location': 3
    },
    ';': {
      'keyCode': 186,
      'key': ';',
      'code': 'Semicolon'
    },
    '=': {
      'keyCode': 187,
      'key': '=',
      'code': 'Equal'
    },
    ',': {
      'keyCode': 188,
      'key': ',',
      'code': 'Comma'
    },
    '.': {
      'keyCode': 190,
      'key': '.',
      'code': 'Period'
    },
    '`': {
      'keyCode': 192,
      'key': '`',
      'code': 'Backquote'
    },
    '[': {
      'keyCode': 219,
      'key': '[',
      'code': 'BracketLeft'
    },
    '\\': {
      'keyCode': 220,
      'key': '\\',
      'code': 'Backslash'
    },
    ']': {
      'keyCode': 221,
      'key': ']',
      'code': 'BracketRight'
    },
    '\'': {
      'keyCode': 222,
      'key': '\'',
      'code': 'Quote'
    },
    'Attn': {
      'keyCode': 246,
      'key': 'Attn'
    },
    'CrSel': {
      'keyCode': 247,
      'key': 'CrSel',
      'code': 'Props'
    },
    'ExSel': {
      'keyCode': 248,
      'key': 'ExSel'
    },
    'EraseEof': {
      'keyCode': 249,
      'key': 'EraseEof'
    },
    'Play': {
      'keyCode': 250,
      'key': 'Play'
    },
    'ZoomOut': {
      'keyCode': 251,
      'key': 'ZoomOut'
    },
    ')': {
      'keyCode': 48,
      'key': ')',
      'code': 'Digit0'
    },
    '!': {
      'keyCode': 49,
      'key': '!',
      'code': 'Digit1'
    },
    '@': {
      'keyCode': 50,
      'key': '@',
      'code': 'Digit2'
    },
    '#': {
      'keyCode': 51,
      'key': '#',
      'code': 'Digit3'
    },
    '$': {
      'keyCode': 52,
      'key': '$',
      'code': 'Digit4'
    },
    '%': {
      'keyCode': 53,
      'key': '%',
      'code': 'Digit5'
    },
    '^': {
      'keyCode': 54,
      'key': '^',
      'code': 'Digit6'
    },
    '&': {
      'keyCode': 55,
      'key': '&',
      'code': 'Digit7'
    },
    '(': {
      'keyCode': 57,
      'key': '\(',
      'code': 'Digit9'
    },
    'A': {
      'keyCode': 65,
      'key': 'A',
      'code': 'KeyA'
    },
    'B': {
      'keyCode': 66,
      'key': 'B',
      'code': 'KeyB'
    },
    'C': {
      'keyCode': 67,
      'key': 'C',
      'code': 'KeyC'
    },
    'D': {
      'keyCode': 68,
      'key': 'D',
      'code': 'KeyD'
    },
    'E': {
      'keyCode': 69,
      'key': 'E',
      'code': 'KeyE'
    },
    'F': {
      'keyCode': 70,
      'key': 'F',
      'code': 'KeyF'
    },
    'G': {
      'keyCode': 71,
      'key': 'G',
      'code': 'KeyG'
    },
    'H': {
      'keyCode': 72,
      'key': 'H',
      'code': 'KeyH'
    },
    'I': {
      'keyCode': 73,
      'key': 'I',
      'code': 'KeyI'
    },
    'J': {
      'keyCode': 74,
      'key': 'J',
      'code': 'KeyJ'
    },
    'K': {
      'keyCode': 75,
      'key': 'K',
      'code': 'KeyK'
    },
    'L': {
      'keyCode': 76,
      'key': 'L',
      'code': 'KeyL'
    },
    'M': {
      'keyCode': 77,
      'key': 'M',
      'code': 'KeyM'
    },
    'N': {
      'keyCode': 78,
      'key': 'N',
      'code': 'KeyN'
    },
    'O': {
      'keyCode': 79,
      'key': 'O',
      'code': 'KeyO'
    },
    'P': {
      'keyCode': 80,
      'key': 'P',
      'code': 'KeyP'
    },
    'Q': {
      'keyCode': 81,
      'key': 'Q',
      'code': 'KeyQ'
    },
    'R': {
      'keyCode': 82,
      'key': 'R',
      'code': 'KeyR'
    },
    'S': {
      'keyCode': 83,
      'key': 'S',
      'code': 'KeyS'
    },
    'T': {
      'keyCode': 84,
      'key': 'T',
      'code': 'KeyT'
    },
    'U': {
      'keyCode': 85,
      'key': 'U',
      'code': 'KeyU'
    },
    'V': {
      'keyCode': 86,
      'key': 'V',
      'code': 'KeyV'
    },
    'W': {
      'keyCode': 87,
      'key': 'W',
      'code': 'KeyW'
    },
    'X': {
      'keyCode': 88,
      'key': 'X',
      'code': 'KeyX'
    },
    'Y': {
      'keyCode': 89,
      'key': 'Y',
      'code': 'KeyY'
    },
    'Z': {
      'keyCode': 90,
      'key': 'Z',
      'code': 'KeyZ'
    },
    ':': {
      'keyCode': 186,
      'key': ':',
      'code': 'Semicolon'
    },
    '<': {
      'keyCode': 188,
      'key': '\<',
      'code': 'Comma'
    },
    '_': {
      'keyCode': 189,
      'key': '_',
      'code': 'Minus'
    },
    '>': {
      'keyCode': 190,
      'key': '>',
      'code': 'Period'
    },
    '?': {
      'keyCode': 191,
      'key': '?',
      'code': 'Slash'
    },
    '~': {
      'keyCode': 192,
      'key': '~',
      'code': 'Backquote'
    },
    '{': {
      'keyCode': 219,
      'key': '{',
      'code': 'BracketLeft'
    },
    '|': {
      'keyCode': 220,
      'key': '|',
      'code': 'Backslash'
    },
    '}': {
      'keyCode': 221,
      'key': '}',
      'code': 'BracketRight'
    },
    '"': {
      'keyCode': 222,
      'key': '"',
      'code': 'Quote'
    }
  };

  const FRAME_CONTROL = false;
  const WorldName = 'PlanetZanj';
  const SHORT_TIMEOUT = 1000;
  const MIN_DELTA = 40;
  const MIN_PIX_DELTA = 8;
  const THRESHOLD_DELTA = 1;
  const DOM_DELTA_PIXEL = 0;
  const DOM_DELTA_LINE = 1;
  const DOM_DELTA_PAGE = 2;
  const LINE_HEIGHT_GUESS = 32;

  const SYNTHETIC_CTRL = e => keyEvent({
    key: 'Control',
    originalType: e.originalType
  }, 2, true);

  function translator(e) {
    let handled = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
      type: 'case'
    };
    handled.type = handled.type || 'case';

    switch (e.type) {
      case "touchcancel":
        {
          return {
            command: {
              name: "Input.dispatchTouchEvent",
              params: {
                type: "touchCancel"
              }
            }
          };
        }

      case "mousedown":
      case "mouseup":
      case "mousemove":
      case "pointerdown":
      case "pointerup":
      case "pointermove":
        {
          let button = "none";

          if (!e.type.endsWith("move")) {
            if (e.button == 0) {
              button = "left";
            } else {
              button = "right";
            }
          }

          return {
            command: {
              name: "Input.emulateTouchFromMouseEvent",
              params: {
                x: Math.round(e.bitmapX),
                y: Math.round(e.bitmapY),
                type: e.type.endsWith("down") ? "mousePressed" : e.type.endsWith("up") ? "mouseReleased" : "mouseMoved",
                button,
                clickCount: !e.type.endsWith("move") ? 1 : 0,
                modifiers: encodeModifiers(e.originalEvent)
              },
              requiresShot: !e.originalEvent.noShot && e.type.endsWith("down")
            }
          };
        }

      case "wheel":
        {
          // if we use emulateTouchFromMouseEvent we need a button value
          const deltaMode = e.originalEvent.deltaMode;
          const deltaX = adjustWheelDeltaByMode(e.originalEvent.deltaX, deltaMode);
          const deltaY = adjustWheelDeltaByMode(e.originalEvent.deltaY, deltaMode);
          const {
            contextId
          } = e;
          const clientX = 0;
          const clientY = 0;
          const deltas = {
            deltaX,
            deltaY,
            clientX,
            clientY
          };
          let retVal;

          if (deltaX > MIN_DELTA || deltaY > MIN_DELTA) {
            const retVal1 = {
              command: {
                name: "Runtime.evaluate",
                params: {
                  expression: "self.ensureScroll(".concat(JSON.stringify(deltas), ");"),
                  includeCommandLineAPI: false,
                  userGesture: true,
                  contextId,
                  timeout: SHORT_TIMEOUT
                }
              }
            };
            const retVal2 = mouseEvent(e, deltaX, deltaY);
            retVal = [retVal1, retVal2];
          } else {
            retVal = mouseEvent(e, deltaX, deltaY);
          }

          return retVal;
        }

      case "auth-response":
        {
          const {
            requestId,
            authResponse
          } = e;
          return {
            command: {
              name: "Fetch.continueWithAuth",
              params: {
                requestId,
                authChallengeResponse: authResponse
              }
            }
          };
        }

      case "resample-imagery":
        {
          const {
            down,
            up,
            averageBw
          } = e;
          return {
            command: {
              isZombieLordCommand: true,
              name: "Connection.resampleImagery",
              params: {
                averageBw,
                down,
                up
              }
            }
          };
        }

      case "control-chars":
        {
          return keyEvent(e);
        }

      case "keydown":
        if (!e.key || !e.code) {
          return;
        } else if (e.key == "Unidentified" || e.code == "Unidentified") {
          return;
        } else {
          return keyEvent(e);
        }

      case "keyup":
        if (!e.key || !e.code) {
          return;
        } else if (e.key == "Unidentified" || e.code == "Unidentified") {
          return;
        } else {
          return keyEvent(e);
        }

      case "keypress":
        {
          if (e.code == "Unidentified") {
            if (e.key.length) {
              const text = e.key;
              return {
                command: {
                  name: "Input.insertText",
                  params: {
                    text
                  },
                  requiresShot: true,
                  ignoreHash: true
                }
              };
            } else return;
          } else if (e.key == "Unidentified") {
            if (e.code.length) {
              const text = e.code;
              return {
                command: {
                  name: "Input.insertText",
                  params: {
                    text
                  },
                  requiresShot: true,
                  ignoreHash: true
                }
              };
            } else return;
          } else return keyEvent(e);
        }

      case "typing":
        {
          if (e.isComposing || !e.characters) return;else return {
            command: {
              name: "Input.insertText",
              params: {
                text: e.characters || ''
              },
              requiresShot: true,
              ignoreHash: true
            }
          };
        }

      case "typing-syncValue":
        {
          return {
            command: {
              name: "Runtime.evaluate",
              params: {
                expression: "syncFocusedInputToValue(\"".concat(e.encodedValue, "\");"),
                includeCommandLineAPI: false,
                userGesture: true,
                contextId: e.contextId,
                timeout: SHORT_TIMEOUT
              },
              requiresShot: true,
              ignoreHash: true
            }
          };
        }

      case "typing-deleteContentBackward":
        {
          if (!e.encodedValueToDelete) return;else return {
            command: {
              name: "Runtime.evaluate",
              params: {
                expression: "fromFocusedInputDeleteLastOccurrenceOf(\"".concat(e.encodedValueToDelete, "\");"),
                includeCommandLineAPI: false,
                userGesture: true,
                contextId: e.contextId,
                timeout: SHORT_TIMEOUT
              },
              requiresShot: true
            }
          };
        }

      case "url-address":
        {
          return {
            command: {
              name: "Page.navigate",
              params: {
                url: e.address
              },
              requiresLoad: true,
              requiresShot: true,
              requiresTailShot: true
            }
          };
        }

      case "setDocument":
        {
          const {
            frameId,
            sessionId,
            html
          } = e;

          if (frameId) {
            return {
              command: {
                name: "Page.setDocumentContent",
                params: {
                  html,
                  frameId,
                  sessionId
                },
                requiresShot: true
              }
            };
          } else {
            return {
              chain: [{
                command: {
                  name: "Page.getFrameTree",
                  params: {}
                }
              }, _ref => {
                let {
                  frameTree: {
                    frame: {
                      id: frameId
                    }
                  }
                } = _ref;
                return {
                  command: {
                    name: "Page.setDocumentContent",
                    params: {
                      html,
                      frameId
                    },
                    requiresShot: true
                  }
                };
              }]
            };
          }
        }

      case "history":
        {
          switch (e.action) {
            case "reload":
            case "stop":
              {
                return {
                  command: {
                    requiresLoad: e.action == "reload",
                    requiresShot: e.action == "reload",
                    name: e.action == "reload" ? "Page.reload" : "Page.stopLoading",
                    params: {}
                  }
                };
              }

            case "back":
            case "forward":
              {
                return {
                  chain: [{
                    command: {
                      name: "Page.getNavigationHistory",
                      params: {}
                    }
                  }, _ref2 => {
                    let {
                      currentIndex,
                      entries
                    } = _ref2;
                    const intendedEntry = entries[currentIndex + (e.action == "back" ? -1 : +1)];

                    if (intendedEntry) {
                      return {
                        command: {
                          name: "Page.navigateToHistoryEntry",
                          params: {
                            entryId: intendedEntry.id
                          },
                          requiresLoad: true,
                          requiresShot: true,
                          requiresTailShot: true
                        }
                      };
                    }
                  }]
                };
              }

            default:
              {
                throw new TypeError("Unkown history action ".concat(e.action));
              }
          }
        }

      case "touchscroll":
        {
          let {
            deltaX,
            deltaY,
            bitmapX: clientX,
            bitmapY: clientY,
            contextId
          } = e; // only one scroll direction at a time

          if (Math.abs(deltaY) > Math.abs(deltaX)) {
            deltaX = 0;

            if (Math.abs(deltaY) > 0.2 * self.ViewportHeight) {
              deltaY = Math.round(5.718 * deltaY);
            }
          } else {
            deltaY = 0;

            if (Math.abs(deltaX) > 0.3 * self.ViewportWidth) {
              deltaX = Math.round(5.718 * deltaX);
            }
          }

          clientX = Math.round(clientX);
          clientY = Math.round(clientY);
          const deltas = {
            deltaX,
            deltaY,
            clientX,
            clientY
          };
          const retVal1 = {
            command: {
              name: "Runtime.evaluate",
              params: {
                expression: "self.ensureScroll(".concat(JSON.stringify(deltas), ");"),
                includeCommandLineAPI: false,
                userGesture: true,
                contextId,
                timeout: SHORT_TIMEOUT
              }
            }
          };
          const retVal2 = mouseEvent(e, deltaX, deltaY);
          const retVal = [retVal1, retVal2];
          return retVal;
        }

      case "zoom":
        {
          /** retval does not work. Expanding pinch is OK, but contracting seems to fail **/

          /*
          const retVal = {
            command: {
              name: "Input.synthesizePinchGesture",
              params: {
                relativeSpeed: 300,
                scaleFactor: e.scale,
                gestureSourceType: "touch",
                x: Math.round(e.bitmapX),
                y: Math.round(e.bitmapY)
              },
              requiresShot: true,
              requiresExtraWait: true,
              extraWait: 300
            }
          };
          */

          /** so we are using emulation and multiplying the scale factor in the event listener **/
          const retVal2 = {
            command: {
              name: "Emulation.setPageScaleFactor",
              params: {
                pageScaleFactor: e.scale
              },
              requiresShot: true,
              requiresExtraWait: true,
              extraWait: 300
            }
          };
          return retVal2;
        }

      case "select":
        {
          const retVal = {
            command: {
              name: "Runtime.evaluate",
              params: {
                expression: "self.setSelectValue(\"".concat(e.value, "\");"),
                includeCommandLineAPI: false,
                userGesture: true,
                contextId: e.executionContext,
                timeout: SHORT_TIMEOUT
              },
              requiresShot: true,
              requiresExtraWait: true,
              extraWait: 300
            }
          };
          return retVal;
        }

      case "window-bounds":
        {
          let {
            width,
            height,
            targetId
          } = e;
          width = parseInt(width);
          height = parseInt(height);
          const retVal = {
            chain: [{
              command: {
                name: "Browser.getWindowForTarget",
                params: {
                  targetId
                }
              }
            }, _ref3 => {
              let {
                windowId,
                bounds
              } = _ref3;
              if (bounds.width == width && bounds.height == height) return;
              const retVal = {
                command: {
                  name: "Browser.setWindowBounds",
                  params: {
                    windowId,
                    bounds: {
                      width,
                      height
                    }
                  },
                  requiresWindowId: true
                }
              };
              return retVal;
            }]
          };
          return retVal;
        }

      case "window-bounds-preImplementation":
        {
          let {
            width,
            height,
            mobile
          } = e;
          width = parseInt(width);
          height = parseInt(height);
          const retVal = {
            command: {
              name: "Emulation.setDeviceMetricsOverride",
              params: {
                width,
                height,
                mobile,
                deviceScaleFactor: 1,
                screenOrientation: {
                  angle: 90,
                  type: 'landscapePrimary'
                }
              }
            },
            requiresShot: true
          };
          return retVal;
        }

      case "user-agent":
        {
          const {
            userAgent,
            platform,
            acceptLanguage
          } = e;
          const retVal = {
            command: {
              name: "Network.setUserAgentOverride",
              params: {
                userAgent,
                platform,
                acceptLanguage
              }
            }
          };
          return retVal;
        }

      case "hide-scrollbars":
        {
          const retVal = {
            command: {
              name: "Emulation.setScrollbarsHidden",
              params: {
                hidden: true
              }
            }
          };
          return retVal;
        }

      case "buffered-results-collection":
        {
          return e;
        }

      case "doShot":
        {
          return {
            command: {
              isZombieLordCommand: true,
              name: "Connection.doShot",
              params: {}
            }
          };
        }

      case "canKeysInput":
        {
          return {
            chain: [{
              command: {
                isZombieLordCommand: true,
                name: "Connection.getContextIdsForActiveSession",
                params: {
                  worldName: WorldName
                }
              }
            }, _ref4 => {
              let {
                contextIds
              } = _ref4;
              return contextIds.map(contextId => ({
                command: {
                  name: "Runtime.evaluate",
                  params: {
                    expression: "canKeysInput();",
                    contextId: contextId,
                    timeout: SHORT_TIMEOUT
                  }
                }
              }));
            }]
          };
        }

      case "describeNode":
        {
          const {
            backendNodeId
          } = e;
          return {
            command: {
              name: "DOM.describeNode",
              params: {
                backendNodeId
              }
            }
          };
        }

      case "getElementInfo":
        {
          return {
            chain: [{
              command: {
                isZombieLordCommand: true,
                name: "Connection.getContextIdsForActiveSession",
                params: {
                  worldName: WorldName
                }
              }
            }, _ref5 => {
              let {
                contextIds
              } = _ref5;
              return contextIds.map(contextId => ({
                command: {
                  name: "Runtime.evaluate",
                  params: {
                    expression: "getElementInfo(".concat(JSON.stringify(e.data), ");"),
                    contextId: contextId,
                    timeout: SHORT_TIMEOUT
                  }
                }
              }));
            }]
          };
        }

      case "getFavicon":
        {
          return {
            chain: [{
              command: {
                isZombieLordCommand: true,
                name: "Connection.getAllContextIds",
                params: {
                  worldName: WorldName
                }
              }
            }, _ref6 => {
              let {
                sessionContextIdPairs
              } = _ref6;
              return sessionContextIdPairs.map(_ref7 => {
                let {
                  sessionId,
                  contextId
                } = _ref7;
                return {
                  command: {
                    name: "Runtime.evaluate",
                    params: {
                      sessionId,
                      contextId,
                      expression: "getFaviconElement();",
                      timeout: SHORT_TIMEOUT
                    }
                  }
                };
              });
            }]
          };
        }

      case "newIncognitoTab":
        {
          return {
            chain: [{
              command: {
                name: "Target.createBrowserContext",
                params: {}
              }
            }, _ref8 => {
              let {
                browserContextId
              } = _ref8;
              return {
                command: {
                  name: "Target.createTarget",
                  params: {
                    browserContextId,
                    url: "about:blank",
                    enableBeginFrameControl: FRAME_CONTROL
                  }
                }
              };
            }]
          };
        }

      case "isMobile":
        {
          return {
            command: {
              isZombieLordCommand: true,
              name: "Connection.setIsMobile",
              params: {}
            }
          };
        }

      case "isSafari":
        {
          return {
            command: {
              isZombieLordCommand: true,
              name: "Connection.setIsSafari",
              params: {}
            }
          };
        }

      case "isFirefox":
        {
          return {
            command: {
              isZombieLordCommand: true,
              name: "Connection.setIsFirefox",
              params: {}
            }
          };
        }

      case "clearAllPageHistory":
        {
          return {
            chain: [{
              command: {
                isZombieLordCommand: true,
                name: "Connection.getAllSessionIds",
                params: {}
              }
            }, _ref9 => {
              let {
                sessionIds
              } = _ref9;
              return sessionIds.map(sessionId => {
                return {
                  command: {
                    name: "Page.resetNavigationHistory",
                    params: {
                      sessionId
                    }
                  }
                };
              });
            }]
          };
        }

      case "clearCache":
        {
          return {
            command: {
              name: "Network.clearBrowserCache",
              params: {}
            }
          };
        }

      case "clearCookies":
        {
          return {
            command: {
              name: "Network.clearBrowserCookies",
              params: {}
            }
          };
        }

      case "respond-to-modal":
        {
          let accept = false;
          let {
            response,
            sessionId,
            promptText
          } = e;

          if (response == "ok") {
            accept = true;
          }

          return {
            command: {
              name: "Page.handleJavaScriptDialog",
              params: {
                accept,
                promptText,
                sessionId
              }
            }
          };
        }

      default:
        {
          if (!!e.command && !!e.command.name || Array.isArray(e)) {
            handled.type = 'default';
            return e;
          } else {
            handled.type = 'unhandled';
            return;
          }
        }
    }
  }

  function mouseEvent(e) {
    let deltaX = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    let deltaY = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
    return {
      command: {
        name: "Input.dispatchMouseEvent",
        params: {
          x: Math.round(e.bitmapX),
          y: Math.round(e.bitmapY),
          type: "mouseWheel",
          deltaX,
          deltaY
        },
        requiresShot: true
      }
    };
  }

  function keyEvent(e) {
    let modifiers = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    let SYNTHETIC = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    const id = e.key && e.key.length > 1 ? e.key : e.code;
    const def = keys[id];
    const text = e.originalType == "keypress" ? String.fromCharCode(e.keyCode) : undefined;
    modifiers = modifiers || encodeModifiers(e.originalEvent);
    let type;

    if (e.originalType == "keydown") {
      if (text) type = "keyDown";else type = "rawKeyDown";
    } else if (e.originalType == "keypress") {
      type = "char";
    } else {
      type = "keyUp";
    }

    const retVal = {
      command: {
        name: "Input.dispatchKeyEvent",
        params: {
          type,
          text,
          unmodifiedText: text,
          code: def.code,
          key: def.key,
          windowsVirtualKeyCode: e.keyCode,
          modifiers
        },
        requiresShot: e.key == "Enter" || e.key == "Tab" || e.key == "Delete",
        ignoreHash: e.key == "Enter" || e.key == "Tab" || e.key == "Delete"
      }
    };

    if (!SYNTHETIC && retVal.command.params.key == 'Meta') {
      return [retVal, SYNTHETIC_CTRL(e)];
    }

    return retVal;
  }

  function encodeModifiers(originalEvent) {
    let modifiers = 0;

    if (originalEvent.altKey) {
      modifiers += 1;
    }

    if (originalEvent.ctrlKey || originalEvent.metaKey) {
      modifiers += 2;
    }

    if (originalEvent.metaKey) {
      modifiers += 4;
    }

    if (originalEvent.shiftKey) {
      modifiers += 8;
    }

    return modifiers;
  }

  function adjustWheelDeltaByMode(delta, mode) {
    if (delta == 0) return delta;
    let threshold = Math.abs(delta) > THRESHOLD_DELTA;

    if (!threshold) {
      delta = Math.sqrt(Math.abs(delta)) * Math.sign(delta);
    }

    switch (mode) {
      case DOM_DELTA_PIXEL:
        //console.log("pix mode", delta);
        if (threshold && Math.abs(delta) < MIN_PIX_DELTA) {
          delta = Math.sign(delta) * MIN_PIX_DELTA;
        }

        break;

      case DOM_DELTA_LINE:
        //console.log("line mode", delta);
        delta = delta * LINE_HEIGHT_GUESS;

        if (threshold && Math.abs(delta) < MIN_DELTA) {
          delta = Math.sign(delta) * MIN_DELTA;
        }

        break;

      case DOM_DELTA_PAGE:
        //console.log("page mode", delta);
        delta = delta * self.ViewportHeight;

        if (threshold && Math.abs(delta) < MIN_DELTA) {
          delta = Math.sign(delta) * MIN_DELTA;
        }

        break;
    }

    return delta;
  }

  const SafariPlatform = /^((?!chrome|android).)*safari/i;
  const MobilePlatform = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  const FirefoxPlatform = /firefox/i;
  const iden = e => e;
  const isSafari = () => SafariPlatform.test(navigator.userAgent);
  const BLANK = "about:blank";
  const DEBUG = {
    loggableEvents: new Set([
    /*typing events*/
    'keydown', 'keypress', 'keyup', 'compositionstart', 'compositionupdate', 'compositionend', 'input', 'beforeinput',
    /*pointing events*/
    'pointerdown', 'pointerup', 'pointermove', 'touchmove', 'touchstart', 'touchcancel', 'mousedown', 'mouseup', 'mousemove', 'click', 'contextmenu', 'dblclick']),
    activateNewTab: false,
    frameControl: FRAME_CONTROL,
    pluginsMenu: false,
    serviceWorker: false,
    delayUnload: true,
    neonMode: false,
    resetCache: false,
    dev: false,
    val: 0,
    low: 1,
    med: 3,
    high: 5
  };
  async function sleep(ms) {
    return new Promise(res => setTimeout(res, ms));
  }
  function debounce(func, wait) {
    let timeout;
    return function () {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      const later = () => {
        timeout = null;
        func.apply(this, args);
      };

      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  } // leading edge throttle

  function throttle(func, wait) {
    let timeout;

    const throttled = function () {
      if (!timeout) {
        timeout = setTimeout(() => timeout = false, wait);
        return func(...arguments);
      }
    };

    return throttled;
  }
  function isFirefox() {
    return FirefoxPlatform.test(navigator.userAgent);
  }
  function deviceIsMobile() {
    return MobilePlatform.test(navigator.userAgent);
  } // debug logging

  function logitKeyInputEvent(e) {
    return;
  }
  function elogit(e) {
    return;
  } // debug logging

  //FIXME we could move this into constructor 
  const tabNumbers = new Map();
  let TabNumber = 1;
  async function fetchTabs(_ref) {
    let {
      sessionToken
    } = _ref;

    try {
      const url = new URL(location);
      url.pathname = '/api/v1/tabs';
      const resp = await fetch(url);

      if (resp.ok) {
        const data = await resp.json();

        if (data.error) {
          if (data.resetRequired) {
            const reload = confirm("Some errors occurred and we can't seem to reach your cloud browser. You can try reloading the page and if the problem persists, try switching your cloud browser off then on again. Want to reload the page now?");
            if (reload) location.reload();
          }
        }

        data.tabs = (data.tabs || []).filter(_ref2 => {
          let {
            type
          } = _ref2;
          return type == 'page';
        }); // FIX for #36 ? 
        // note: this does *not* work because new tabs can be inserted anywhere
        // data.tabs.reverse();

        data.tabs.forEach(tab => {
          if (!tabNumbers.has(tab.targetId)) {
            tabNumbers.set(tab.targetId, TabNumber++);
          }

          tab.number = tabNumbers.get(tab.targetId);
        });
        data.tabs.sort((a, b) => a.number - b.number);
        return data;
      } else if (resp.status == 401) {
        console.warn("Session has been cleared. Let's attempt relogin", sessionToken);
        if (DEBUG.blockAnotherReset) return;
        DEBUG.blockAnotherReset = true;
        const x = new URL(location);
        x.pathname = 'login';
        x.search = "token=".concat(sessionToken, "&ran=").concat(Math.random());
        alert("Your browser cleared your session. We need to reload the page to refresh it.");
        DEBUG.delayUnload = false;
        location.href = x;
        return;
      }
    } catch (e) {
      console.warn(e);
      const reload = confirm("Some errors occurred and we can't seem to reach your cloud browser. You can try reloading the page and if the problem persists, try switching your cloud browser off then on again. Want to reload the page now?");
      if (reload) location.reload();
    }
  }

  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }

  function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

  function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

  const DemoTab = () => ({
    targetId: 'demo1' + Math.random(),
    browserContextId: 'demobrowser1',
    title: 'Dosy Browser',
    type: 'page',
    url: 'payment://signup-to-dosy-browser.html'
  });

  const dontFocus = true;
  const runFuncs = ['installFormSubmitButtonHandler', 'installStripeButton'];
  const opts = {
    dontFocus,
    runFuncs
  };
  const started = new Set();
  let tab = DemoTab();
  const tabs = [tab];
  let requestId = 1;
  let messageId$1 = 1;
  async function fetchDemoTabs() {
    requestId++;
    tab = tab || tabs[0];
    return {
      tabs,
      activeTarget: tab && tab.targetId,
      requestId
    };
  }
  async function demoZombie(_ref) {
    let {
      events
    } = _ref;
    const meta = [];

    for (const event of events) {
      meta.push(...(await handleEvent(event)));
    }

    messageId$1++;
    return {
      data: [],
      frameBuffer: [],
      meta,
      messageId: messageId$1
    };
  }

  async function handleEvent(event) {
    const meta = [];
    const {
      command
    } = event;

    if (tab && !started.has(tab.targetId)) {
      started.add(tab.targetId);
      meta.push({
        treeUpdate: _objectSpread({
          open: await fetch("https://".concat(location.hostname, ":8001/demo-landing")).then(resp => resp.text()),
          targetId: tab && tab.targetId
        }, opts)
      });
    }

    switch (command.name) {
      case "Target.createTarget":
        {
          tab = DemoTab();
          tabs.push(tab);
          const meta1 = {
            created: {
              targetId: tab.targetId
            }
          };
          const meta2 = {
            treeUpdate: _objectSpread({
              open: await fetch("https://".concat(location.hostname, ":8001/demo-landing")).then(resp => resp.text()),
              targetId: tab.targetId
            }, opts)
          };
          meta.push(meta1, meta2);
          break;
        }

      case "Target.activateTarget":
        {
          tab = tabs.find(_ref2 => {
            let {
              targetId
            } = _ref2;
            return targetId == command.params.targetId;
          });
          break;
        }

      case "Demo.formSubmission":
        {
          let jres;

          try {
            jres = JSON.parse(event.result);
          } catch (e) {}

          if (!!jres && !!jres.browserUrl) {
            const {
              browserUrl
            } = jres;
            const meta1 = {
              topRedirect: {
                browserUrl,
                targetId: tab && tab.targetId
              }
            };
            await sleep(5000);
            meta.push(meta1);
          } else {
            const meta1 = {
              treeUpdate: _objectSpread({
                open: event.result,
                targetId: tab && tab.targetId
              }, opts)
            };
            meta.push(meta1);
          }

          break;
        }
    }

    return meta;
  }

  function handleKeysCanInputMessage(_ref, state) {
    let {
      keyInput: {
        keysCanInput,
        isTextareaOrContenteditable,
        type,
        inputmode,
        value = ''
      },
      executionContextId
    } = _ref;
    if (state.ignoreKeysCanInputMessage) return;

    if (keysCanInput) {
      state.contextIdOfFocusedInput = executionContextId;

      if (!state.dontFocusControlInputs) {
        if (isTextareaOrContenteditable) {
          state.viewState.focusTextarea(inputmode, value);
        } else {
          state.viewState.focusKeyinput(type, inputmode, value);
        }
      }
    } else {
      state.contextIdOfFocusedInput = null;

      if (!state.dontFocusControlInputs) {
        const active = document.activeElement;

        if (active == state.viewState.textarea) {
          state.viewState.blurTextarea();
        } else if (active == state.viewState.keyinput) {
          state.viewState.blurKeyinput();
        }
      }
    }
  }

  function handleElementInfo(_ref, state) {
    let {
      elementInfo: {
        attributes,
        innerText,
        noSuchElement
      }
      /*executionContextId*/

    } = _ref;

    if (!state.elementInfoContinuation) {
      console.warn("Got element info message, but no continuation to pass it to");
      console.warn(JSON.stringify({
        elementInfo: {
          attributes,
          innerText,
          noSuchElement
        }
      }));
      return;
    }

    try {
      state.elementInfoContinuation({
        attributes,
        innerText,
        noSuchElement
      });
    } catch (e) {
      console.warn("Element info continueation failed", state.elementInfoContinuation, e);
      console.warn(JSON.stringify({
        elementInfo: {
          attributes,
          innerText,
          noSuchElement
        }
      }));
    }
  }

  function handleScrollNotification(_ref, state) {
    let {
      /*scroll:{didScroll},*/
      executionContextId
    } = _ref;
    state.viewState.latestScrollContext = executionContextId;
  }

  function _taggedTemplateLiteral(strings, raw) {
    if (!raw) {
      raw = strings.slice(0);
    }

    return Object.freeze(Object.defineProperties(strings, {
      raw: {
        value: Object.freeze(raw)
      }
    }));
  }

  // common for all r submodules
  const CODE = '' + Math.random();

  var _templateObject$e, _templateObject2$9, _templateObject3$8, _templateObject4$5, _templateObject5$4, _templateObject6$3, _templateObject7$3;

  const BuiltIns$1 = [Symbol, Boolean, Number, String, Object, Set, Map, WeakMap, WeakSet, Uint8Array, Uint16Array, Uint32Array, Float32Array, Float64Array, Int8Array, Int16Array, Int32Array, Uint8ClampedArray, Node, NodeList, Element, HTMLElement, Blob, ArrayBuffer, FileList, Text, HTMLDocument, Document, DocumentFragment, Error, File, Event, EventTarget, URL];
  const SEALED_DEFAULT$1 = true;

  const isNone$1 = instance => instance == null || instance == undefined;

  const typeCache$1 = new Map();
  T$1.def = def$1;
  T$1.check = check$1;
  T$1.sub = sub$1;
  T$1.verify = verify$2;
  T$1.validate = validate$1;
  T$1.partialMatch = partialMatch$1;
  T$1.defEnum = defEnum$1;
  T$1.defSub = defSub$1;
  T$1.defTuple = defTuple$1;
  T$1.defCollection = defCollection$1;
  T$1.defOr = defOr$1;
  T$1.option = option$1;
  T$1.defOption = defOption$1;
  T$1.maybe = maybe$1;
  T$1.guard = guard$1;
  T$1.errors = errors$1; // debug

  T$1[Symbol.for('jtype-system.typeCache')] = typeCache$1;
  defineSpecials$1();
  mapBuiltins$1();
  function T$1(parts) {
    for (var _len = arguments.length, vals = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      vals[_key - 1] = arguments[_key];
    }

    const cooked = vals.reduce((prev, cur, i) => prev + cur + parts[i + 1], parts[0]);
    const typeName = cooked;
    if (!typeCache$1.has(typeName)) throw new TypeError("Cannot use type ".concat(typeName, " before it is defined."));
    return typeCache$1.get(typeName).type;
  }

  function partialMatch$1(type, instance) {
    return validate$1(type, instance, {
      partial: true
    });
  }

  function validate$1(type, instance) {
    let {
      partial = false
    } = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    guardType$1(type);
    guardExists$1(type);
    const typeName = type.name;
    const {
      spec,
      kind,
      help,
      verify,
      verifiers,
      sealed
    } = typeCache$1.get(typeName);
    const specKeyPaths = spec ? allKeyPaths$1(spec).sort() : [];
    const specKeyPathSet = new Set(specKeyPaths);
    const bigErrors = [];

    switch (kind) {
      case "def":
        {
          let allValid = true;

          if (spec) {
            const keyPaths = partial ? allKeyPaths$1(instance, specKeyPathSet) : specKeyPaths;
            allValid = !isNone$1(instance) && keyPaths.every(kp => {
              // Allow lookup errors if the type match for the key path can include None
              const {
                resolved,
                errors: lookupErrors
              } = lookup$1(instance, kp, () => checkTypeMatch$1(lookup$1(spec, kp).resolved, T$1(_templateObject$e || (_templateObject$e = _taggedTemplateLiteral(["None"])))));
              bigErrors.push(...lookupErrors);
              if (lookupErrors.length) return false;
              const keyType = lookup$1(spec, kp).resolved;

              if (!keyType || !(keyType instanceof Type$1)) {
                bigErrors.push({
                  error: "Key path '".concat(kp, "' is not present in the spec for type '").concat(typeName, "'")
                });
                return false;
              }

              const {
                valid,
                errors: validationErrors
              } = validate$1(keyType, resolved);
              bigErrors.push(...validationErrors);
              return valid;
            });
          }

          let verified = true;

          if (partial && !spec && !!verify) {
            throw new TypeError("Type checking with option 'partial' is not a valid option for types that" + " only use a verify function but have no spec");
          } else if (verify) {
            try {
              verified = verify(instance);

              if (!verified) {
                if (verifiers) {
                  throw {
                    error: "Type ".concat(typeName, " value '").concat(JSON.stringify(instance), "' violated at least 1 verify function in:\n").concat(verifiers.map(f => '\t' + (f.help || '') + ' (' + f.verify.toString() + ')').join('\n'))
                  };
                } else if (type.isSumType) {
                  throw {
                    error: "Value '".concat(JSON.stringify(instance), "' did not match any of: ").concat([...type.types.keys()].map(t => t.name)),
                    verify,
                    verifiers
                  };
                } else {
                  let helpMsg = '';

                  if (help) {
                    helpMsg = "Help: ".concat(help, ". ");
                  }

                  throw {
                    error: "".concat(helpMsg, "Type ").concat(typeName, " Value '").concat(JSON.stringify(instance), "' violated verify function in: ").concat(verify.toString())
                  };
                }
              }
            } catch (e) {
              bigErrors.push(e);
              verified = false;
            }
          }

          let sealValid = true;

          if (!!sealed && !!spec) {
            const type_key_paths = specKeyPaths;
            const all_key_paths = allKeyPaths$1(instance, specKeyPathSet).sort();
            sealValid = all_key_paths.join(',') == type_key_paths.join(',');

            if (!sealValid) {
              if (all_key_paths.length < type_key_paths.length) {
                sealValid = true;
              } else {
                const errorKeys = [];
                const tkp = new Set(type_key_paths);

                for (const k of all_key_paths) {
                  if (!tkp.has(k)) {
                    errorKeys.push({
                      error: "Key path '".concat(k, "' is not in the spec for type ").concat(typeName)
                    });
                  }
                }

                if (errorKeys.length) {
                  bigErrors.push(...errorKeys);
                }
              }
            }
          }

          return {
            valid: allValid && verified && sealValid,
            errors: bigErrors,
            partial
          };
        }

      case "defCollection":
        {
          const {
            valid: containerValid,
            errors: containerErrors
          } = validate$1(spec.container, instance);
          let membersValid = true;
          let verified = true;
          bigErrors.push(...containerErrors);

          if (partial) {
            throw new TypeError("Type checking with option 'partial' is not a valid option for Collection types");
          } else {
            if (containerValid) {
              membersValid = [...instance].every(member => {
                const {
                  valid,
                  errors
                } = validate$1(spec.member, member);
                bigErrors.push(...errors);
                return valid;
              });
            }

            if (verify) {
              try {
                verified = verify(instance);
              } catch (e) {
                bigErrors.push(e);
                verified = false;
              }
            }
          }

          return {
            valid: containerValid && membersValid && verified,
            errors: bigErrors
          };
        }

      default:
        {
          throw new TypeError("Checking for type kind ".concat(kind, " is not yet implemented."));
        }
    }
  }

  function check$1() {
    return validate$1(...arguments).valid;
  }

  function lookup$1(obj, keyPath, canBeNone) {
    if (isNone$1(obj)) throw new TypeError("Lookup requires a non-unset object.");
    if (!keyPath) throw new TypeError("keyPath must not be empty");
    const keys = keyPath.split(/\./g);
    const pathComplete = [];
    const errors = [];
    let resolved = obj;

    while (keys.length) {
      const nextKey = keys.shift();
      resolved = resolved[nextKey];
      pathComplete.push(nextKey);

      if (resolved === null || resolved === undefined) {
        if (keys.length) {
          errors.push({
            error: "Lookup on key path '".concat(keyPath, "' failed at '") + pathComplete.join('.') + "' when ".concat(resolved, " was found at '").concat(nextKey, "'.")
          });
        } else if (!!canBeNone && canBeNone()) {
          resolved = undefined;
        } else {
          errors.push({
            error: "Resolution on key path '".concat(keyPath, "' failed") + "when ".concat(resolved, " was found at '").concat(nextKey, "' and the Type of this") + "key's value cannot be None."
          });
        }

        break;
      }
    }

    return {
      resolved,
      errors
    };
  }

  function checkTypeMatch$1(typeA, typeB) {
    guardType$1(typeA);
    guardExists$1(typeA);
    guardType$1(typeB);
    guardExists$1(typeB);

    if (typeA === typeB) {
      return true;
    } else if (typeA.isSumType && typeA.types.has(typeB)) {
      return true;
    } else if (typeB.isSumType && typeB.types.has(typeA)) {
      return true;
    } else if (typeA.name.startsWith('?') && typeB == T$1(_templateObject2$9 || (_templateObject2$9 = _taggedTemplateLiteral(["None"])))) {
      return true;
    } else if (typeB.name.startsWith('?') && typeA == T$1(_templateObject3$8 || (_templateObject3$8 = _taggedTemplateLiteral(["None"])))) {
      return true;
    }

    if (typeA.name.startsWith('>') || typeB.name.startsWith('>')) {
      console.error(new Error("Check type match has not been implemented for derived//sub types yet."));
    }

    return false;
  }

  function option$1(type) {
    return T$1(_templateObject4$5 || (_templateObject4$5 = _taggedTemplateLiteral(["?", ""])), type.name);
  }

  function sub$1(type) {
    return T$1(_templateObject5$4 || (_templateObject5$4 = _taggedTemplateLiteral([">", ""])), type.name);
  }

  function defSub$1(type, spec) {
    let {
      verify = undefined,
      help = ''
    } = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    let name = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : '';
    guardType$1(type);
    guardExists$1(type);
    let verifiers;

    if (!verify) {
      verify = () => true;
    }

    if (type.native) {
      verifiers = [{
        help,
        verify
      }];

      verify = i => i instanceof type.native;

      const helpMsg = "Needs to be of type ".concat(type.native.name, ". ").concat(help || '');
      verifiers.push({
        help: helpMsg,
        verify
      });
    }

    const newType = def$1("".concat(name, ">").concat(type.name), spec, {
      verify,
      help,
      verifiers
    });
    return newType;
  }

  function defEnum$1(name) {
    if (!name) throw new TypeError("Type must be named.");
    guardRedefinition$1(name);

    for (var _len2 = arguments.length, values = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
      values[_key2 - 1] = arguments[_key2];
    }

    const valueSet = new Set(values);

    const verify = i => valueSet.has(i);

    const help = "Value of Enum type ".concat(name, " must be one of ").concat(values.join(','));
    return def$1(name, null, {
      verify,
      help
    });
  }

  function exists$1(name) {
    return typeCache$1.has(name);
  }

  function guardRedefinition$1(name) {
    if (exists$1(name)) throw new TypeError("Type ".concat(name, " cannot be redefined."));
  }

  function allKeyPaths$1(o, specKeyPaths) {
    const isTypeSpec = !specKeyPaths;
    const keyPaths = new Set();
    return recurseObject(o, keyPaths, '');

    function recurseObject(o, keyPathSet) {
      let lastLevel = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';
      const levelKeys = Object.getOwnPropertyNames(o);
      const keyPaths = levelKeys.map(k => lastLevel + (lastLevel.length ? '.' : '') + k);
      levelKeys.forEach((k, i) => {
        const v = o[k];

        if (isTypeSpec) {
          if (v instanceof Type$1) {
            keyPathSet.add(keyPaths[i]);
          } else if (typeof v == "object") {
            if (!Array.isArray(v)) {
              recurseObject(v, keyPathSet, keyPaths[i]);
            } else {
              throw new TypeError("We don't support Types that use Arrays as structure, just yet.");
            }
          } else {
            throw new TypeError("Spec cannot contain leaf values that are not valid Types");
          }
        } else {
          if (specKeyPaths.has(keyPaths[i])) {
            keyPathSet.add(keyPaths[i]);
          } else if (typeof v == "object") {
            if (!Array.isArray(v)) {
              recurseObject(v, keyPathSet, keyPaths[i]);
            } else {
              v.forEach((item, index) => recurseObject(item, keyPathSet, keyPaths[i] + '.' + index)); //throw new TypeError(`We don't support Instances that use Arrays as structure, just yet.`); 
            }
          } else {
            //console.warn("Spec has no such key",  keyPaths[i]);
            keyPathSet.add(keyPaths[i]);
          }
        }
      });
      return [...keyPathSet];
    }
  }

  function defOption$1(type) {
    guardType$1(type);
    const typeName = type.name;
    return T$1.def("?".concat(typeName), null, {
      verify: i => isUnset$1(i) || T$1.check(type, i)
    });
  }

  function maybe$1(type) {
    try {
      return defOption$1(type);
    } catch (e) {// console.log(`Option Type ${type.name} already declared.`, e);
    }

    return T$1(_templateObject6$3 || (_templateObject6$3 = _taggedTemplateLiteral(["?", ""])), type.name);
  }

  function verify$2() {
    return check$1(...arguments);
  }

  function defCollection$1(name, _ref) {
    let {
      container,
      member
    } = _ref;
    let {
      sealed = SEALED_DEFAULT$1,
      verify = undefined
    } = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    if (!name) throw new TypeError("Type must be named.");
    if (!container || !member) throw new TypeError("Type must be specified.");
    guardRedefinition$1(name);
    const kind = 'defCollection';
    const t = new Type$1(name);
    const spec = {
      kind,
      spec: {
        container,
        member
      },
      verify,
      sealed,
      type: t
    };
    typeCache$1.set(name, spec);
    return t;
  }

  function defTuple$1(name, _ref2) {
    let {
      pattern
    } = _ref2;
    if (!name) throw new TypeError("Type must be named.");
    if (!pattern) throw new TypeError("Type must be specified.");
    const kind = 'def';
    const specObj = {};
    pattern.forEach((type, key) => specObj[key] = type);
    const t = new Type$1(name);
    const spec = {
      kind,
      spec: specObj,
      type: t
    };
    typeCache$1.set(name, spec);
    return t;
  }

  function Type$1(name) {
    let mods = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    if (!new.target) throw new TypeError("Type with new only.");
    Object.defineProperty(this, 'name', {
      get: () => name
    });
    this.typeName = name;

    if (mods.types) {
      const {
        types
      } = mods;
      const typeSet = new Set(types);
      Object.defineProperty(this, 'isSumType', {
        get: () => true
      });
      Object.defineProperty(this, 'types', {
        get: () => typeSet
      });
    }

    if (mods.native) {
      const {
        native
      } = mods;
      Object.defineProperty(this, 'native', {
        get: () => native
      });
    }
  }

  Type$1.prototype.toString = function () {
    return "".concat(this.typeName, " Type");
  };

  function def$1(name, spec) {
    let {
      help = '',
      verify = undefined,
      sealed = undefined,
      types = undefined,
      verifiers = undefined,
      native = undefined
    } = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    if (!name) throw new TypeError("Type must be named.");
    guardRedefinition$1(name);

    if (name.startsWith('?')) {
      if (spec) {
        throw new TypeError("Option type can not have a spec.");
      }

      if (!verify(null)) {
        throw new TypeError("Option type must be OK to be unset.");
      }
    }

    const kind = 'def';

    if (sealed === undefined) {
      sealed = true;
    }

    const t = new Type$1(name, {
      types,
      native
    });
    const cache = {
      spec,
      kind,
      help,
      verify,
      verifiers,
      sealed,
      types,
      native,
      type: t
    };
    typeCache$1.set(name, cache);
    return t;
  }

  function defOr$1(name) {
    for (var _len3 = arguments.length, types = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
      types[_key3 - 1] = arguments[_key3];
    }

    return T$1.def(name, null, {
      types,
      verify: i => types.some(t => check$1(t, i))
    });
  }

  function guard$1(type, instance) {
    guardType$1(type);
    guardExists$1(type);
    const {
      valid,
      errors
    } = validate$1(type, instance);
    if (!valid) throw new TypeError("Type ".concat(type, " requested, but item is not of that type: ").concat(errors.join(', ')));
  }

  function guardType$1(t) {
    //console.log(t);
    if (!(t instanceof Type$1)) throw new TypeError("Type must be a valid Type object.");
  }

  function guardExists$1(t) {
    const name = originalName$1(t);
    if (!exists$1(name)) throw new TypeError("Type must exist. Type ".concat(name, " has not been defined."));
  }

  function errors$1() {
    return validate$1(...arguments).errors;
  }

  function mapBuiltins$1() {
    BuiltIns$1.forEach(t => def$1(originalName$1(t), null, {
      native: t,
      verify: i => originalName$1(i.constructor) === originalName$1(t)
    }));
    BuiltIns$1.forEach(t => defSub$1(T$1(_templateObject7$3 || (_templateObject7$3 = _taggedTemplateLiteral(["", ""])), originalName$1(t))));
  }

  function defineSpecials$1() {
    T$1.def("Any", null, {
      verify: () => true
    });
    T$1.def("Some", null, {
      verify: i => !isUnset$1(i)
    });
    T$1.def("None", null, {
      verify: i => isUnset$1(i)
    });
    T$1.def("Function", null, {
      verify: i => i instanceof Function
    });
    T$1.def("Integer", null, {
      verify: i => Number.isInteger(i)
    });
    T$1.def("Array", null, {
      verify: i => Array.isArray(i)
    });
    T$1.def("Iterable", null, {
      verify: i => i[Symbol.iterator] instanceof Function
    });
  }

  function isUnset$1(i) {
    return i === null || i === undefined;
  }

  function originalName$1(t) {
    if (!!t && t.name) {
      return t.name;
    }

    const oName = Object.prototype.toString.call(t).replace(/\[object |\]/g, '');

    if (oName.endsWith('Constructor')) {
      return oName.replace(/Constructor$/, '');
    }

    return oName;
  }

  var _templateObject$d, _templateObject2$8, _templateObject3$7, _templateObject4$4, _templateObject5$3, _templateObject6$2, _templateObject7$2, _templateObject8$1, _templateObject9$1, _templateObject10$1, _templateObject11$1, _templateObject12$1, _templateObject13$1, _templateObject14$1, _templateObject15$1, _templateObject16$1, _templateObject17$1, _templateObject18$1, _templateObject19$1, _templateObject20$1, _templateObject21$1, _templateObject22$1, _templateObject23$1, _templateObject24$1, _templateObject25$1, _templateObject26$1, _templateObject27, _templateObject28, _templateObject29, _templateObject30, _templateObject31, _templateObject32, _templateObject33;

  T$1.def('Key', {
    key: T$1.defOr('ValidKey', T$1(_templateObject$d || (_templateObject$d = _taggedTemplateLiteral(["String"]))), T$1(_templateObject2$8 || (_templateObject2$8 = _taggedTemplateLiteral(["Number"]))))
  });
  const THandlers = T$1.def('Handlers', null, {
    verify: i => {
      const validObject = T$1.check(T$1(_templateObject3$7 || (_templateObject3$7 = _taggedTemplateLiteral(["Object"]))), i);
      if (!validObject) return false;
      const eventNames = Object.keys(i);
      const handlerFuncs = Object.values(i);
      const validNames = eventNames.every(name => T$1.check(T$1(_templateObject4$4 || (_templateObject4$4 = _taggedTemplateLiteral(["String"]))), name));
      const validFuncs = handlerFuncs.every(func => T$1.check(T$1(_templateObject5$3 || (_templateObject5$3 = _taggedTemplateLiteral(["Function"]))), func));
      const valid = validNames && validFuncs;
      return valid;
    }
  });
  T$1.defCollection('FuncArray', {
    container: T$1(_templateObject6$2 || (_templateObject6$2 = _taggedTemplateLiteral(["Array"]))),
    member: T$1(_templateObject7$2 || (_templateObject7$2 = _taggedTemplateLiteral(["Function"])))
  });
  T$1.def('EmptyArray', null, {
    verify: i => Array.isArray(i) && i.length == 0
  });
  T$1.def('MarkupObject', {
    type: T$1(_templateObject8$1 || (_templateObject8$1 = _taggedTemplateLiteral(["String"]))),
    code: T$1(_templateObject9$1 || (_templateObject9$1 = _taggedTemplateLiteral(["String"]))),
    nodes: T$1(_templateObject10$1 || (_templateObject10$1 = _taggedTemplateLiteral(["Array"]))),
    externals: T$1(_templateObject11$1 || (_templateObject11$1 = _taggedTemplateLiteral(["Array"])))
  }, {
    verify: v => v.type == 'MarkupObject' && v.code == CODE
  });
  T$1.def('MarkupAttrObject', {
    type: T$1(_templateObject12$1 || (_templateObject12$1 = _taggedTemplateLiteral(["String"]))),
    code: T$1(_templateObject13$1 || (_templateObject13$1 = _taggedTemplateLiteral(["String"]))),
    str: T$1(_templateObject14$1 || (_templateObject14$1 = _taggedTemplateLiteral(["String"])))
  }, {
    verify: v => v.type == 'MarkupAttrObject' && v.code == CODE
  }); // Browser side

  T$1.def('BrutalLikeObject', {
    code: T$1(_templateObject15$1 || (_templateObject15$1 = _taggedTemplateLiteral(["String"]))),
    externals: T$1(_templateObject16$1 || (_templateObject16$1 = _taggedTemplateLiteral(["Array"]))),
    nodes: T$1(_templateObject17$1 || (_templateObject17$1 = _taggedTemplateLiteral(["Array"]))),
    to: T$1(_templateObject18$1 || (_templateObject18$1 = _taggedTemplateLiteral(["Function"]))),
    update: T$1(_templateObject19$1 || (_templateObject19$1 = _taggedTemplateLiteral(["Function"]))),
    v: T$1(_templateObject20$1 || (_templateObject20$1 = _taggedTemplateLiteral(["Array"]))),
    oldVals: T$1(_templateObject21$1 || (_templateObject21$1 = _taggedTemplateLiteral(["Array"])))
  });
  T$1.def('BrutalObject', {
    code: T$1(_templateObject22$1 || (_templateObject22$1 = _taggedTemplateLiteral(["String"]))),
    externals: T$1(_templateObject23$1 || (_templateObject23$1 = _taggedTemplateLiteral(["Array"]))),
    nodes: T$1(_templateObject24$1 || (_templateObject24$1 = _taggedTemplateLiteral(["Array"]))),
    to: T$1(_templateObject25$1 || (_templateObject25$1 = _taggedTemplateLiteral(["Function"]))),
    update: T$1(_templateObject26$1 || (_templateObject26$1 = _taggedTemplateLiteral(["Function"]))),
    v: T$1(_templateObject27 || (_templateObject27 = _taggedTemplateLiteral(["Array"]))),
    oldVals: T$1(_templateObject28 || (_templateObject28 = _taggedTemplateLiteral(["Array"])))
  }, {
    verify: v => verify$1(v)
  });
  T$1.defCollection('BrutalArray', {
    container: T$1(_templateObject29 || (_templateObject29 = _taggedTemplateLiteral(["Array"]))),
    member: T$1(_templateObject30 || (_templateObject30 = _taggedTemplateLiteral(["BrutalObject"])))
  }); // SSR

  T$1.def('SBrutalObject', {
    str: T$1(_templateObject31 || (_templateObject31 = _taggedTemplateLiteral(["String"]))),
    handlers: THandlers
  });
  T$1.defCollection('SBrutalArray', {
    container: T$1(_templateObject32 || (_templateObject32 = _taggedTemplateLiteral(["Array"]))),
    member: T$1(_templateObject33 || (_templateObject33 = _taggedTemplateLiteral(["SBrutalObject"])))
  }); // export

  function verify$1(v) {
    return CODE === v.code;
  }

  var _templateObject$c, _templateObject2$7, _templateObject3$6, _templateObject4$3, _templateObject5$2, _templateObject6$1, _templateObject7$1, _templateObject8, _templateObject9, _templateObject10, _templateObject11, _templateObject12, _templateObject13, _templateObject14, _templateObject15, _templateObject16, _templateObject17, _templateObject18, _templateObject19, _templateObject20, _templateObject21, _templateObject22, _templateObject23, _templateObject24, _templateObject25, _templateObject26;

  const skip = markup;
  const attrskip = attrmarkup; // constants

  const NULLFUNC = () => void 0;
  /* eslint-disable no-useless-escape */


  const KEYMATCH = /(?:<!\-\-)?(key\d+)(?:\-\->)?/gm;
  /* eslint-enable no-useless-escape */

  const ATTRMATCH = /\w+=/;
  const KEYLEN = 20;

  const XSS = () => "Possible XSS / object forgery attack detected. " + "Object code could not be verified.";

  const OBJ = () => "Object values not allowed here.";

  const UNSET = () => "Unset values not allowed here.";

  const INSERT = () => "Error inserting template into DOM. " + "Position must be one of: " + "replace, beforebegin, afterbegin, beforeend, innerhtml, afterend";

  const NOTFOUND = loc => "Error inserting template into DOM. " + "Location ".concat(loc, " was not found in the document.");

  const MOVE = new class {
    beforeend(frag, elem) {
      elem.appendChild(frag);
    }

    beforebegin(frag, elem) {
      elem.parentNode.insertBefore(frag, elem);
    }

    afterend(frag, elem) {
      elem.parentNode.insertBefore(frag, elem.nextSibling);
    }

    replace(frag, elem) {
      elem.parentNode.replaceChild(frag, elem);
    }

    afterbegin(frag, elem) {
      elem.insertBefore(frag, elem.firstChild);
    }

    innerhtml(frag, elem) {
      elem.innerHTML = '';
      elem.appendChild(frag);
    }

  }(); // logging

  self.onerror = function () {
    for (var _len = arguments.length, v = new Array(_len), _key = 0; _key < _len; _key++) {
      v[_key] = arguments[_key];
    }

    return console.log(v, v[0] + '', v[4] && v[4].message, v[4] && v[4].stack), true;
  }; // type functions


  const isKey = v => T$1.check(T$1(_templateObject$c || (_templateObject$c = _taggedTemplateLiteral(["Key"]))), v);

  const isHandlers = v => T$1.check(T$1(_templateObject2$7 || (_templateObject2$7 = _taggedTemplateLiteral(["Handlers"]))), v); // cache 


  const cache = {};
  const d = R;
  const u = X; // main exports 

  Object.assign(R, {
    s,
    attrskip,
    skip,
    attrmarkup,
    markup,
    guardEmptyHandlers,
    die
  });

  function R(p) {
    for (var _len2 = arguments.length, v = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
      v[_key2 - 1] = arguments[_key2];
    }

    return dumbass(p, v);
  }
  function X(p) {
    for (var _len3 = arguments.length, v = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
      v[_key3 - 1] = arguments[_key3];
    }

    return dumbass(p, v, {
      useCache: false
    });
  } // main function (TODO: should we refactor?)

  function dumbass(p, v) {
    let {
      useCache = true
    } = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    const retVal = {};
    let instanceKey, cacheKey;
    v = v.map(guardAndTransformVal);

    if (useCache) {
      ({
        key: instanceKey
      } = v.find(isKey) || {});
      cacheKey = p.join('<link rel=join>');
      const {
        cached,
        firstCall
      } = isCached(cacheKey, v, instanceKey);

      if (!firstCall) {
        cached.update(v);
        return cached;
      } else {
        retVal.oldVals = Array.from(v);
      }
    } else {
      retVal.oldVals = Array.from(v);
    } // compile the template into an updater


    p = [...p];
    const vmap = {};
    const V = v.map(replaceValWithKeyAndOmitInstanceKey(vmap));
    const externals = [];
    let str = '';

    while (p.length > 1) str += p.shift() + V.shift();

    str += p.shift();
    const frag = toDOM(str);
    const walker = document.createTreeWalker(frag, NodeFilter.SHOW_ALL);

    do {
      makeUpdaters({
        walker,
        vmap,
        externals
      });
    } while (walker.nextNode());

    Object.assign(retVal, {
      externals,
      v: Object.values(vmap),
      to,
      update,
      code: CODE,
      nodes: [...frag.childNodes]
    });

    if (useCache) {
      if (instanceKey) {
        cache[cacheKey].instances[instanceKey] = retVal;
      } else {
        cache[cacheKey] = retVal;
      }
    }

    return retVal;
  } // to function


  function to(location, options) {
    const position = (options || 'replace').toLocaleLowerCase();
    const frag = document.createDocumentFragment();
    this.nodes.forEach(n => frag.appendChild(n));
    const isNode = T$1.check(T$1(_templateObject3$6 || (_templateObject3$6 = _taggedTemplateLiteral([">Node"]))), location);
    const elem = isNode ? location : document.querySelector(location);

    try {
      MOVE[position](frag, elem);
    } catch (e) {

      switch (e.constructor && e.constructor.name) {
        case "DOMException":
          die({
            error: INSERT()
          });
          break;

        case "TypeError":
          die({
            error: NOTFOUND(location)
          });
          break;

        default:
          throw e;
      }
    }

    while (this.externals.length) {
      this.externals.shift()();
    }
  } // update functions


  function makeUpdaters(_ref) {
    let {
      walker,
      vmap,
      externals
    } = _ref;
    const node = walker.currentNode;

    switch (node.nodeType) {
      case Node.ELEMENT_NODE:
        handleElement({
          node,
          vmap,
          externals
        });
        break;

      case Node.COMMENT_NODE:
      case Node.TEXT_NODE:
        handleNode({
          node,
          vmap,
          externals
        });
        break;
    }
  }

  function handleNode(_ref2) {
    let {
      node,
      vmap,
      externals
    } = _ref2;
    const lengths = [];
    const text = node.nodeValue;
    let result = KEYMATCH.exec(text);

    while (result) {
      const {
        index
      } = result;
      const key = result[1];
      const val = vmap[key];
      const replacer = makeNodeUpdater({
        node,
        index,
        lengths,
        val
      });
      externals.push(() => replacer(val.val));
      val.replacers.push(replacer);
      result = KEYMATCH.exec(text);
    }
  } // node functions


  function makeNodeUpdater(nodeState) {
    const {
      node
    } = nodeState;
    const scope = Object.assign({}, nodeState, {
      oldVal: {
        length: KEYLEN
      },
      oldNodes: [node],
      lastAnchor: node
    });
    return newVal => {
      if (scope.oldVal == newVal) return;
      scope.val.val = newVal;

      switch (getType(newVal)) {
        case "markupobject":
        case "brutalobject":
          handleMarkupInNode(newVal, scope);
          break;

        default:
          handleTextInNode(newVal, scope);
          break;
      }
    };
  }

  function handleMarkupInNode(newVal, state) {
    let {
      oldNodes,
      lastAnchor
    } = state;

    if (newVal.nodes.length) {
      if (sameOrder(oldNodes, newVal.nodes)) ; else {
        Array.from(newVal.nodes).reverse().forEach(n => {
          lastAnchor.parentNode.insertBefore(n, lastAnchor.nextSibling);
          state.lastAnchor = lastAnchor.nextSibling;
        });
        state.lastAnchor = newVal.nodes[0];
      }
    } else {
      const placeholderNode = summonPlaceholder(lastAnchor);
      lastAnchor.parentNode.insertBefore(placeholderNode, lastAnchor.nextSibling);
      state.lastAnchor = placeholderNode;
    } // MARK: Unbond event might be relevant here.


    const dn = diffNodes(oldNodes, newVal.nodes);

    if (dn.size) {
      const f = document.createDocumentFragment();
      dn.forEach(n => f.appendChild(n));
    }

    state.oldNodes = newVal.nodes || [lastAnchor];

    while (newVal.externals.length) {
      const func = newVal.externals.shift();
      func();
    }
  }

  function sameOrder(nodesA, nodesB) {
    if (nodesA.length != nodesB.length) return false;
    return Array.from(nodesA).every((an, i) => an == nodesB[i]);
  }

  function handleTextInNode(newVal, state) {
    let {
      oldVal,
      index,
      val,
      lengths,
      node
    } = state;
    const valIndex = val.vi;
    const originalLengthBefore = Object.keys(lengths.slice(0, valIndex)).length * KEYLEN;
    const lengthBefore = lengths.slice(0, valIndex).reduce((sum, x) => sum + x, 0);
    const value = node.nodeValue;
    lengths[valIndex] = newVal.length;
    const correction = lengthBefore - originalLengthBefore;
    const before = value.slice(0, index + correction);
    const after = value.slice(index + correction + oldVal.length);
    const newValue = before + newVal + after;
    node.nodeValue = newValue;
    state.oldVal = newVal;
  } // element attribute functions


  function handleElement(_ref3) {
    let {
      node,
      vmap,
      externals
    } = _ref3;
    getAttributes(node).forEach(function () {
      let {
        name,
        value
      } = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      const attrState = {
        node,
        vmap,
        externals,
        name,
        lengths: []
      };
      KEYMATCH.lastIndex = 0;
      let result = KEYMATCH.exec(name);

      while (result) {
        prepareAttributeUpdater(result, attrState, {
          updateName: true
        });
        result = KEYMATCH.exec(name);
      }

      KEYMATCH.lastIndex = 0;
      result = KEYMATCH.exec(value);

      while (result) {
        prepareAttributeUpdater(result, attrState, {
          updateName: false
        });
        result = KEYMATCH.exec(value);
      }
    });
  }

  function prepareAttributeUpdater(result, attrState, _ref4) {
    let {
      updateName
    } = _ref4;
    const {
      index,
      input
    } = result;
    const scope = Object.assign({}, attrState, {
      index,
      input,
      updateName,
      val: attrState.vmap[result[1]],
      oldVal: {
        length: KEYLEN
      },
      oldName: attrState.name
    });
    let replacer;

    if (updateName) {
      replacer = makeAttributeNameUpdater(scope);
    } else {
      replacer = makeAttributeValueUpdater(scope);
    }

    scope.externals.push(() => replacer(scope.val.val));
    scope.val.replacers.push(replacer);
  } // FIXME: needs to support multiple replacements just like value
  // QUESTION: why is the variable oldName so required here, why can't we call it oldVal?
  // if we do it breaks, WHY?


  function makeAttributeNameUpdater(scope) {
    let {
      oldName,
      node,
      val
    } = scope;
    return newVal => {
      if (oldName == newVal) return;
      val.val = newVal;
      const attr = node.hasAttribute(oldName) ? oldName : '';

      if (attr !== newVal) {
        if (attr) {
          node.removeAttribute(oldName);
          node[oldName] = undefined;
        }

        if (newVal) {
          newVal = newVal.trim();
          let name = newVal,
              value = undefined;

          if (ATTRMATCH.test(newVal)) {
            const assignmentIndex = newVal.indexOf('=');
            [name, value] = [newVal.slice(0, assignmentIndex), newVal.slice(assignmentIndex + 1)];
          }

          reliablySetAttribute(node, name, value);
        }

        oldName = newVal;
      }
    };
  }

  function makeAttributeValueUpdater(scope) {
    return newVal => {
      if (scope.oldVal == newVal) return;
      scope.val.val = newVal;

      switch (getType(newVal)) {
        case "funcarray":
          updateAttrWithFuncarrayValue(newVal, scope);
          break;

        case "function":
          updateAttrWithFunctionValue(newVal, scope);
          break;

        case "handlers":
          updateAttrWithHandlersValue(newVal, scope);
          break;

        case "markupobject":
        case "brutalobject":
          newVal = nodesToStr(newVal.nodes);
          updateAttrWithTextValue(newVal, scope);
          break;

        /* eslint-disable no-fallthrough */

        case "markupattrobject":
          // deliberate fall through
          newVal = newVal.str;

        default:
          updateAttrWithTextValue(newVal, scope);
          break;

        /* eslint-enable no-fallthrough */
      }
    };
  } // helpers


  function getAttributes(node) {
    if (!node.hasAttribute) return []; // for parity with classList.add (which trims whitespace)
    // otherwise once the classList manipulation happens
    // our indexes for replacement will be off

    if (node.hasAttribute('class')) {
      node.setAttribute('class', formatClassListValue(node.getAttribute('class')));
    }

    if (!!node.attributes && Number.isInteger(node.attributes.length)) return Array.from(node.attributes);
    const attrs = [];

    for (const name of node) {
      if (node.hasAttribute(name)) {
        attrs.push({
          name,
          value: node.getAttribute(name)
        });
      }
    }

    return attrs;
  }

  function updateAttrWithFunctionValue(newVal, scope) {
    let {
      oldVal,
      node,
      name,
      externals
    } = scope;

    if (name !== 'bond') {
      let flags = {};

      if (name.includes(':')) {
        [name, ...flags] = name.split(':');
        flags = flags.reduce((O, f) => {
          O[f] = true;
          return O;
        }, {});
      }

      if (oldVal) {
        node.removeEventListener(name, oldVal, flags);
      }

      node.addEventListener(name, newVal, flags);
    } else {
      if (oldVal) {
        const index = externals.indexOf(oldVal);

        if (index >= 0) {
          externals.splice(index, 1);
        }
      }

      externals.push(() => newVal(node));
    }

    scope.oldVal = newVal;
  }

  function updateAttrWithFuncarrayValue(newVal, scope) {
    let {
      oldVal,
      node,
      name,
      externals
    } = scope;

    if (oldVal && !Array.isArray(oldVal)) {
      oldVal = [oldVal];
    }

    if (name !== 'bond') {
      let flags = {};

      if (name.includes(':')) {
        [name, ...flags] = name.split(':');
        flags = flags.reduce((O, f) => {
          O[f] = true;
          return O;
        }, {});
      }

      if (oldVal) {
        oldVal.forEach(of => node.removeEventListener(name, of, flags));
      }

      newVal.forEach(f => node.addEventListener(name, f, flags));
    } else {
      if (oldVal) {
        oldVal.forEach(of => {
          const index = externals.indexOf(of);

          if (index >= 0) {
            externals.splice(index, 1);
          }
        });
      }

      newVal.forEach(f => externals.push(() => f(node)));
    }

    scope.oldVal = newVal;
  }

  function updateAttrWithHandlersValue(newVal, scope) {
    let {
      oldVal,
      node,
      externals
    } = scope;

    if (!!oldVal && T$1.check(T$1(_templateObject4$3 || (_templateObject4$3 = _taggedTemplateLiteral(["Handlers"]))), oldVal)) {
      Object.entries(oldVal).forEach(_ref5 => {
        let [eventName, funcVal] = _ref5;

        if (eventName !== 'bond') {
          let flags = {};

          if (eventName.includes(':')) {
            [eventName, ...flags] = eventName.split(':');
            flags = flags.reduce((O, f) => {
              O[f] = true;
              return O;
            }, {});
          }

          console.log(eventName, funcVal, flags);
          node.removeEventListener(eventName, funcVal, flags);
        } else {
          const index = externals.indexOf(funcVal);

          if (index >= 0) {
            externals.splice(index, 1);
          }
        }
      });
    }

    Object.entries(newVal).forEach(_ref6 => {
      let [eventName, funcVal] = _ref6;

      if (eventName !== 'bond') {
        let flags = {};

        if (eventName.includes(':')) {
          [eventName, ...flags] = eventName.split(':');
          flags = flags.reduce((O, f) => {
            O[f] = true;
            return O;
          }, {});
        }

        node.addEventListener(eventName, funcVal, flags);
      } else {
        externals.push(() => funcVal(node));
      }
    });
    scope.oldVal = newVal;
  }

  function updateAttrWithTextValue(newVal, scope) {
    let {
      oldVal,
      node,
      index,
      name,
      val,
      lengths
    } = scope;
    let zeroWidthCorrection = 0;
    const valIndex = val.vi;
    const originalLengthBefore = Object.keys(lengths.slice(0, valIndex)).length * KEYLEN; // we need to trim newVal to have parity with classlist add
    // the reason we have zeroWidthCorrection = -1
    // is because the classList is a set of non-zero width tokens
    // separated by spaces
    // when we have a zero width token, we have two adjacent spaces
    // which, by virtue of our other requirement, gets replaced by a single space
    // effectively elliding out our replacement location
    // in order to keep our replacement location in tact
    // we need to compensate for the loss of a token slot (effectively a token + a space)
    // and having a -1 correction effectively does this.

    if (name == "class") {
      newVal = newVal.trim();

      if (newVal.length == 0) {
        zeroWidthCorrection = -1;
      }

      scope.val.val = newVal;
    }

    lengths[valIndex] = newVal.length + zeroWidthCorrection;
    let attr = node.getAttribute(name);
    const lengthBefore = lengths.slice(0, valIndex).reduce((sum, x) => sum + x, 0);
    const correction = lengthBefore - originalLengthBefore;
    const before = attr.slice(0, index + correction);
    const after = attr.slice(index + correction + oldVal.length);
    let newAttrValue;

    if (name == "class") {
      const spacer = oldVal.length == 0 ? ' ' : '';
      newAttrValue = before + spacer + newVal + spacer + after;
    } else {
      newAttrValue = before + newVal + after;
    }
    reliablySetAttribute(node, name, newAttrValue);
    scope.oldVal = newVal;
  }

  function reliablySetAttribute(node, name, value) {
    if (name == "class") {
      value = formatClassListValue(value);
    }

    try {
      node.setAttribute(name, value);
    } catch (e) {
    }

    try {
      node[name] = value == undefined ? true : value;
    } catch (e) {
    }
  }

  function getType(val) {
    const type = T$1.check(T$1(_templateObject5$2 || (_templateObject5$2 = _taggedTemplateLiteral(["Function"]))), val) ? 'function' : T$1.check(T$1(_templateObject6$1 || (_templateObject6$1 = _taggedTemplateLiteral(["Handlers"]))), val) ? 'handlers' : T$1.check(T$1(_templateObject7$1 || (_templateObject7$1 = _taggedTemplateLiteral(["BrutalObject"]))), val) ? 'brutalobject' : T$1.check(T$1(_templateObject8 || (_templateObject8 = _taggedTemplateLiteral(["MarkupObject"]))), val) ? 'markupobject' : T$1.check(T$1(_templateObject9 || (_templateObject9 = _taggedTemplateLiteral(["MarkupAttrObject"]))), val) ? 'markupattrobject' : T$1.check(T$1(_templateObject10 || (_templateObject10 = _taggedTemplateLiteral(["BrutalArray"]))), val) ? 'brutalarray' : T$1.check(T$1(_templateObject11 || (_templateObject11 = _taggedTemplateLiteral(["FuncArray"]))), val) ? 'funcarray' : 'default';
    return type;
  }

  function summonPlaceholder(sibling) {
    let ph = [...sibling.parentNode.childNodes].find(node => node.nodeType == Node.COMMENT_NODE && node.nodeValue == 'brutal-placeholder');

    if (!ph) {
      ph = toDOM("<!--brutal-placeholder-->").firstChild;
    }

    return ph;
  } // cache helpers
  // FIXME: function needs refactor


  function isCached(cacheKey, v, instanceKey) {
    let firstCall;
    let cached = cache[cacheKey];

    if (cached == undefined) {
      cached = cache[cacheKey] = {};

      if (instanceKey) {
        cached.instances = {};
        cached = cached.instances[instanceKey] = {};
      }

      firstCall = true;
    } else {
      if (instanceKey) {
        if (!cached.instances) {
          cached.instances = {};
          firstCall = true;
        } else {
          cached = cached.instances[instanceKey];

          if (!cached) {
            firstCall = true;
          } else {
            firstCall = false;
          }
        }
      } else {
        firstCall = false;
      }
    }

    return {
      cached,
      firstCall
    };
  } // Markup helpers
  // Returns an object that Brutal treats as markup,
  // even tho it is NOT a Brutal Object (defined with R/X/$)
  // And even tho it is in the location of a template value replacement
  // Which would normally be the treated as String


  function markup(str) {
    str = T$1.check(T$1(_templateObject12 || (_templateObject12 = _taggedTemplateLiteral(["None"]))), str) ? '' : str;
    const frag = toDOM(str);
    const retVal = {
      type: 'MarkupObject',
      code: CODE,
      nodes: [...frag.childNodes],
      externals: []
    };
    return retVal;
  } // Returns an object that Brutal treats, again, as markup
  // But this time markup that is OKAY to have within a quoted attribute


  function attrmarkup(str) {
    str = T$1.check(T$1(_templateObject13 || (_templateObject13 = _taggedTemplateLiteral(["None"]))), str) ? '' : str;
    str = str.replace(/"/g, '&quot;');
    const retVal = {
      type: 'MarkupAttrObject',
      code: CODE,
      str
    };
    return retVal;
  }

  function guardEmptyHandlers(val) {
    if (Array.isArray(val)) {
      if (val.length == 0) {
        return [NULLFUNC];
      }

      return val;
    } else {
      if (T$1.check(T$1(_templateObject14 || (_templateObject14 = _taggedTemplateLiteral(["None"]))), val)) {
        return NULLFUNC;
      }
    }
  } // other helpers


  function formatClassListValue(value) {
    value = value.trim();
    value = value.replace(/\s+/g, ' ');
    return value;
  }

  function replaceValWithKeyAndOmitInstanceKey(vmap) {
    return (val, vi) => {
      // omit instance key
      if (T$1.check(T$1(_templateObject15 || (_templateObject15 = _taggedTemplateLiteral(["Key"]))), val)) {
        return '';
      }

      const key = ('key' + Math.random()).replace('.', '').padEnd(KEYLEN, '0').slice(0, KEYLEN);
      let k = key;

      if (T$1.check(T$1(_templateObject16 || (_templateObject16 = _taggedTemplateLiteral(["BrutalObject"]))), val) || T$1.check(T$1(_templateObject17 || (_templateObject17 = _taggedTemplateLiteral(["MarkupObject"]))), val)) {
        k = "<!--".concat(k, "-->");
      }

      vmap[key.trim()] = {
        vi,
        val,
        replacers: []
      };
      return k;
    };
  }

  function toDOM(str) {
    const templateEl = new DOMParser().parseFromString("<template>".concat(str, "</template>"), "text/html").head.firstElementChild;
    let f;

    if (templateEl instanceof HTMLTemplateElement) {
      f = templateEl.content;
      f.normalize();
      return f;
    } else {
      throw new TypeError("Could not find template element after parsing string to DOM:\n=START=\n".concat(str, "\n=END="));
    }
  }

  function guardAndTransformVal(v) {
    const isFunc = T$1.check(T$1(_templateObject18 || (_templateObject18 = _taggedTemplateLiteral(["Function"]))), v);
    const isUnset = T$1.check(T$1(_templateObject19 || (_templateObject19 = _taggedTemplateLiteral(["None"]))), v);
    const isObject = T$1.check(T$1(_templateObject20 || (_templateObject20 = _taggedTemplateLiteral(["Object"]))), v);
    const isBrutalArray = T$1.check(T$1(_templateObject21 || (_templateObject21 = _taggedTemplateLiteral(["BrutalArray"]))), v);
    const isFuncArray = T$1.check(T$1(_templateObject22 || (_templateObject22 = _taggedTemplateLiteral(["FuncArray"]))), v);
    const isMarkupObject = T$1.check(T$1(_templateObject23 || (_templateObject23 = _taggedTemplateLiteral(["MarkupObject"]))), v);
    const isMarkupAttrObject = T$1.check(T$1(_templateObject24 || (_templateObject24 = _taggedTemplateLiteral(["MarkupAttrObject"]))), v);
    const isBrutal = T$1.check(T$1(_templateObject25 || (_templateObject25 = _taggedTemplateLiteral(["BrutalObject"]))), v);
    const isForgery = T$1.check(T$1(_templateObject26 || (_templateObject26 = _taggedTemplateLiteral(["BrutalLikeObject"]))), v) && !isBrutal;
    if (isFunc) return v;
    if (isBrutal) return v;
    if (isKey(v)) return v;
    if (isHandlers(v)) return v;
    if (isBrutalArray) return join(v);
    if (isFuncArray) return v;
    if (isMarkupObject) return v;
    if (isMarkupAttrObject) return v;
    if (isUnset) die({
      error: UNSET()
    });
    if (isForgery) die({
      error: XSS()
    });
    if (isObject) die({
      error: OBJ()
    });
    return v + '';
  }

  function join(os) {
    const externals = [];
    const bigNodes = [];
    const v = [];
    const oldVals = [];
    os.forEach(o => {
      //v.push(...o.v); 
      //oldVals.push(...o.oldVals);
      externals.push(...o.externals);
      bigNodes.push(...o.nodes);
    });
    const retVal = {
      v,
      code: CODE,
      oldVals,
      nodes: bigNodes,
      to,
      update,
      externals
    };
    return retVal;
  }

  function nodesToStr(nodes) {
    const frag = document.createDocumentFragment();
    nodes.forEach(n => frag.appendChild(n.cloneNode(true)));
    const container = document.createElement('body');
    container.appendChild(frag);
    return container.innerHTML;
  }

  function diffNodes(last, next) {
    last = new Set(last);
    next = new Set(next);
    return new Set([...last].filter(n => !next.has(n)));
  }

  function update(newVals) {
    const updateable = this.v.filter(_ref7 => {
      let {
        vi
      } = _ref7;
      return didChange(newVals[vi], this.oldVals[vi]);
    });
    updateable.forEach(_ref8 => {
      let {
        vi,
        replacers
      } = _ref8;
      return replacers.forEach(f => f(newVals[vi]));
    });
    this.oldVals = Array.from(newVals);
  }

  function didChange(oldVal, newVal) {
    const [oldType, newType] = [oldVal, newVal].map(getType);
    let ret;

    if (oldType != newType) {
      ret = true;
    } else {
      switch (oldType) {
        case "brutalobject":
          // the brutal object is returned by a view function
          // which has already called its updaters and checked its slot values
          // to determine and show changes
          // except in the case of a list of nodes
          ret = true;
          break;

        /* eslint-disable no-fallthrough */

        case "funcarray":
        case "function":
          // hard to equate even if same str value as scope could be diff
          ret = true;
          break;

        case "brutalarray":
          // need to do array dif so don't do here
          ret = true;
          break;

        case "markupattrobject":
        case "markupobject":
          // need to check multiple things
          ret = true;
          break;

        default:
          ret = JSON.stringify(oldVal) !== JSON.stringify(newVal);
          break;

        /* eslint-enable no-fallthrough */
      }
    }
    return ret;
  } // reporting and error helpers 


  function die(msg, err) {
    msg.stack = (new Error()).stack.split(/\s*\n\s*/g);
    throw JSON.stringify(msg, null, 2);
  }

  function s(msg) {
  }

  var _templateObject$b;
  const loadings = new Map();
  const SHOW_LOADED_MS = 300;
  const DEFAULT_LOADING = {
    waiting: 0,
    complete: 0
  };
  let delayHideTimeout;
  function LoadingIndicator(state) {
    let delayHide = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
    const loading = loadings.get(state.activeTarget) || DEFAULT_LOADING;
    const isLoading = loading.waiting > 0;

    if (delayHide && loading.complete > 0) {
      if (!isLoading) {
        clearTimeout(delayHideTimeout);
        delayHideTimeout = setTimeout(() => {
          loading.isLoading = false;
          LoadingIndicator(state, false);
        }, SHOW_LOADED_MS);
      }

      loading.isLoading = true;
    } else {
      loading.isLoading = isLoading;
    }

    return d(_templateObject$b || (_templateObject$b = _taggedTemplateLiteral(["\n    <aside class=\"loading-indicator\" stylist=\"styleLoadingIndicator\">\n      <progress ", " name=loading max=", " value=", ">\n    </aside>\n  "])), loading.isLoading ? '' : 'hidden', loading.waiting + loading.complete, loading.complete);
  }

  function resetLoadingIndicator(_ref, state) {
    let {
      navigated
    } = _ref;
    const {
      targetId
    } = navigated;
    loadings.delete(targetId);

    if (state.activeTarget == targetId) {
      LoadingIndicator(state);
    }
  }
  function showLoadingIndicator(_ref2, state) {
    let {
      resource
    } = _ref2;
    const {
      targetId
    } = resource;
    loadings.set(targetId, resource);

    if (state.activeTarget == targetId) {
      LoadingIndicator(state);
    }
  }

  const DEFAULT_FAVICON = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEsAAABLCAYAAAA4TnrqAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAuIwAALiMBeKU/dgAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAn/SURBVHic7Zx/bFzFEce/s+ezcc5OCC0lDi65OHf7zliyWlx+NUgY9VcKjYTbNKhAmtAKWiTapq1Q1fS/NqJIVCGlVI1IKSQ0qElQA7RFgNRimiAh1BSkJLLfu/MPim1CoKHxXXyu726nf/jZNc7bu927s1NV9/kreTs7sx6/nbezs2ugRo0aNWrUqFGjRo3zDJ1P411dXeEzZ87EhRAOM68hog8DaAIQBpADkAHwLoBBZu5funRp6ujRo7nzNd5Fd5aUMgHgiwC6iWgtMy+x6H6WiF5h5l4AhzzP61+QQWpYFGe1trY2RiKRLcy8BcBVVVT9GjM/ls1m94yMjGSrqDeQBXVWZ2dnZHJy8lsAtgK4ZAFNvUNEO9Lp9MNjY2MTC2VkwZwVi8XWCyEeAhBdKBsBjALY5nne3oVQXnVnRaPRC8Ph8G4i2lBt3RYczOfzdw4ODp6pptKqOiuRSHQppQ4CWG3ZNQdgEMBbAN4nohwzRwAsJ6IoM19WxnAGlFIbU6nU38voG0jVnOU4zjpmfgpAxECcARxh5meFEL0tLS1v9Pb25nXCHR0dF+VyuasB3AhgPYBVhsPKCCE29Pf3v2AoX5SqOEtKeQuAJzC9PirGODPvCoVCv+rv7x8u0xw5jnMDM98DoMdAPgdgk+d5+8u091/DlSrw36hnUdxReQAPTU1N/WR4eHg8Ho9fSUTNBupHdGupRCIRVUoNGQ4zJ4RYX+kbVpGz/Bj1MopMPWY+HgqFbu3v7z8GAFLKXwP4uqEJBrDZ87wnAmzbOAsAMkqp6yuJYaLcjtFo9EI/mBeLUXuz2exVM47yucHCDGE6Tp1DPp8/a6EHAJqEEAfb2tqWWfabpWxnhcPh3Sj+1bvf87wtAStrW5vrpZQ9HR0dF819mEql3gVwHxH9w0JXW11d3W5L+7OUNQ2llDcDOFRE5H7P836o6TuE8haqCsDdnuc9Mr/BcZzbmPm3poqI6GbXdZ+xHYD1m9XZ2RkBsLOIyF7P87YVaW+wtekjAHw5qKGlpWU/gH+bKmLmnStXrrRJ4GcHYIWf6wWuc5j5+MTExDcxHZg/QHd3d53jOLcBaLG1OUd/XdBzf432IIApQ1XR5ubme2ztW03D1tbWxiVLlgwhOCnOCyGumAnmjuPsY+aNAAJ/wHJg5t5kMqn9QHR3d9eNjo5uJKJ9BupOTkxMtNnsVli9WZFIZAv0uwcPzTiqvb29hZlvRRUdZUJvb28+mUw+CeBtA/EVjY2Nm230WzmLme/QNI03NDRsnyNXblyqFkbxi4i22Cg1dpa/w3llUBsz7zp27Nj7Nob/R7g6kUhIU2GbN0uXh7EQYpeFnrIhIlVtncxskl8CsHOWLrAecV3XJu0oG2Z+qdo6lVLGGYVRAO7q6gpnMpm1zOesCOAn0dVmnIi+x8xvzrHzXjKZfKPahojouq6urrBJ1cjIWX65KnARJ4ToDRjAuV61gJl/43neo5WosJCNjI+PxwD0lRI0moZCCEfTlGtpaTnnty2EeBvAOya6NfYqnW5Wb6AQwijIG71ZzBwjCly/DgbtcJ44cWJKStlFROuY+WsAPqlRPQJgB4DZHQQiOuG67ism49KRyWRub2pqWg/gJgCbSskrpeImeo2cRUQXaZ6/GfQcADzPGwXwaHt7+3OFQmFMI3av53m/MxmDDX45bD+AA1LKqwDoZgYAgIiWm+g1/Ro2aZ6nS3Xs6+t7G0Aq0LgQJw3tlwsDOGIgZ7Jra5yONAaOhNkorwqFQjfm8/lbhBA9zHyFoc2qkM/nvx8Oh48z8wpMFzsuDxAz2oEwdZbOKUa/kb6+viSA7Y7j/JyITlqeb6gIv3a4EwCklB0IdpZRFdt0GmY0z43m+gyu66aZ+dTM/5VSK2z6VwoRfUjTVDKcAOZfw9NBX0Miipr0L8IDjuNcUigU/ppKpV6vUFdJmPkjmqbTJv2N3iwiSmqMX5ZIJHS/LRNamXmnEOJv8Xj8YxXoKYlfqAisGRBR4AdoPkbOUkp5ujZmDtyJKMK/gsYhhLjeUo8V9fX110Dz8zKza6LDaBouW7YsmU6nzyKg7MXMNwF43kSPz7cBbMP0Oa3Z9Rsz3xuPx08R0bu6jkRUKBQKx/3KjhWFQmGtZmGdaW5uHjDRYbytLKV8EcBnApre9DxvNezyMcRisYuFEP2Y4zBDxgFc7i96TSEpZR8CFqfM/EIymVxnosRmi0aXr61yHMemcApgtu53wrYfgKVKKau1mpRyLTSreCHEX0z12OyRHwJwX1ADM98jpRwGgEKhkBkYGDgVJBfQr6CZGkUhopVSyjb/35Ou6+rSqRnu0jUIIYrVPz8oayroH9B4TdPcA2AAwEAoFHrHcZztGrmqQES7Zuwx82g8HtcWWGOxWAeAr2iaX/UXzEbYFiweM5T7qqFK48JoMYjoFl2bEOIBaGYQMz9uY8fKWdlsdg/M9qk+Go/Hb+3u7i41zR9B8FLClkA7UsoeAJ/X9DmZy+X22BixctbIyEiWiB40kSWifWNjY2ellD/VySSTyd97nrfcD9j/tBlLKRzHWQ1Au9vKzDuGh4cnbXRal+/T6fQvAAwbitcD+G4pIT/Vec52LHP4wAZka2trIzMfgD53Hcpmsw/bGrF21tjY2AQRbbXoYlRwZeb9MD+rENQXABCNRi+IRCJPA/iETp6ItpZzyaCs81n+cZ0D5fTVkUwm/+Tf3fk0ipffM0T0JIBvKKWuJaJLk8nk7cC0o8Lh8NPM/Nki/fe7rltWRarsswj5fP6uurq6LgBrytUxH9d10wD+LKXcC+AHASJD+Xz+40Hn26WUbUR0sMTmYkoppV1zlaLsk3+Dg4NnlFIbod/rmiUej98Bi9RKCPE85sUhn2VCiPr5Dx3H2QDgaAlHZfxz8eOm45hPxaeVE4nE55RSf0DpY92HlVJ3p1IpoxSnvb19VaFQuBbAzwBcOqfpNIDXmflBIcRbzLwDwKdKqMsppb6QSqVeNLGtY7HPwRcAPENEv3Rd9yUYJN+O43yHmYNOGk769kIlVEwR0SbXdSuOsVW7YeG/YU9BXwmaTx8R/VEp9TIzH9ZNj3g83k5Eb2B6GWJLRin1pUrfqBmqencnFotdIYQ4CKDNsmsB0wXXkwDew/RUuwBAvX/DNQH7j1HKj1FV266u+q2wtra2Zf7x6cDDsovEAaXUnZUE8yD+3+4bjgD40ULdNywVHMvm9OnTXkNDw+6GhoZxAJ0wj2XlcJKZf5zNZjcNDQ0dXSgji3ZHurGxcTMRbQZwTRVVv8rMj+dyuT22SXE5LPrt+0QiIZm5Ryl1AxFdB7P7iTOcBXCYiF4SQhyy2birBuf97zqk0+k1ABKY/oJejOnpWo/ppDoD4BQRDTKz29zcPHA+/65DjRo1atSoUaNGjRrnnf8APcnjzVWJn1oAAAAASUVORK5CYII=";

  var _templateObject$a, _templateObject2$6, _templateObject3$5;
  function TabList(state) {
    return d(_templateObject$a || (_templateObject$a = _taggedTemplateLiteral(["\n    <nav class=\"controls targets\" stylist=\"styleTabList styleNavControl\">\n      <ul>\n        ", "\n        <li class=\"new\" stylist=\"styleTabSelector\"\n            click=", "\n          >\n            <button class=new title=\"New tab\" accesskey=\"s\">+</button>\n        </li>\n      </ul>\n    </nav>\n  "])), state.tabs.map((tab, index) => TabSelector(tab, index, state)), click => state.createTab(click));
  }
  function TabSelector(tab, index, state) {
    const title = tab.title == 'about:blank' ? '' : tab.title;
    const active = state.activeTarget == tab.targetId;
    return d(_templateObject2$6 || (_templateObject2$6 = _taggedTemplateLiteral(["", "\n    <li class=\"tab-selector ", "\" stylist=\"styleTabSelector\"\n        title=\"", "\"\n        click=", " \n      >\n        ", "\n        <a  \n          mousedown=", "\n          href=/tabs/", ">", "</a>\n        <button class=close title=\"Close tab\" ", "\n          click=", ">&Chi;</button>\n    </li>\n  "])), {
      key: tab.targetId
    }, active ? 'active' : '', title || 'Bring to front', click => state.activateTab(click, tab), FaviconElement(tab, state), () => state.viewState.lastActive = document.activeElement, tab.targetId, title, active ? 'accesskey=d' : '', click => state.closeTab(click, tab, index));
  }
  function FaviconElement(_ref, state) {
    let {
      targetId
    } = _ref;
    let faviconURL;
    faviconURL = state.favicons.has(targetId) && state.favicons.get(targetId).dataURI;
    return d(_templateObject3$5 || (_templateObject3$5 = _taggedTemplateLiteral(["", "\n    <img class=favicon src=\"", "\" \n      data-target-id=\"", "\" bond=", ">\n  "])), {
      key: targetId
    }, d.attrmarkup(faviconURL || DEFAULT_FAVICON), targetId, el => bindFavicon(el, {
      targetId
    }, state));
  }

  function bindFavicon(el, _ref2, state) {
    let {
      targetId
    } = _ref2;
    let favicon = state.favicons.get(targetId);

    if (favicon) {
      favicon.el = el;
    } else {
      favicon = {
        el
      };
      state.favicons.set(targetId, favicon);
    }

    if (favicon.el && favicon.dataURI) {
      el.src = favicon.dataURI;
    }
  }

  function resetFavicon(_ref, state) {
    let {
      targetId
    } = _ref;
    const favicon = state.favicons.get(targetId);

    if (favicon) {
      favicon.dataURI = DEFAULT_FAVICON;
    }

    FaviconElement({
      targetId
    }, state);
  }
  function handleFaviconMessage(_ref2, state) {
    let {
      favicon: {
        faviconDataUrl,
        targetId
      }
    } = _ref2;
    let favicon = state.favicons.get(targetId);

    if (favicon) {
      favicon.dataURI = faviconDataUrl;
    } else {
      favicon = {
        dataURI: faviconDataUrl
      };
      state.favicons.set(targetId, favicon);
    }

    FaviconElement({
      targetId
    }, state);
  }

  const $ = Symbol('[[EventQueuePrivates]]'); //const TIME_BETWEEN_ONLINE_CHECKS = 1001;

  const ALERT_TIMEOUT = 300;
  const MAX_E = 255;
  const BUFFERED_FRAME_EVENT$3 = {
    type: "buffered-results-collection",
    command: {
      isBufferedResultsCollectionOnly: true,
      params: {}
    }
  };
  const BUFFERED_FRAME_COLLECT_DELAY = {
    MIN: 75,

    /* 250, 500 */
    MAX: 4000
    /* 2000, 4000, 8000 */

  };
  const Format = 'jpeg';
  const waiting = new Map();
  let connecting;
  let latestReload;
  let latestAlert; //let lastTestTime;
  //let lastOnlineCheck;

  let messageId = 0;
  let latestFrame = 0;
  let frameDrawing = false;
  let bufferedFrameCollectDelay = BUFFERED_FRAME_COLLECT_DELAY.MIN;

  class Privates {
    constructor(publics, state, sessionToken) {
      this.willCollectBufferedFrame = null;
      this.websockets = new Map();
      this.publics = publics;
      this.subscribers = [];
      this.translators = new Map();
      this.images = new Map();
      this.typeLists = new Map();
      this.loopActive = false;
      this.Data = [];
      this.Meta = [];
      this.sessionToken = sessionToken;
      const WindowLength = 10;
      const messageWindow = [];
      const bwWindow = [];

      this.addBytes = (n, hasFrame) => {
        state.totalBytes += n;

        if (hasFrame) {
          messageWindow.push(n);
          bwWindow.push(state.totalBytesThisSecond);

          while (messageWindow.length > WindowLength) {
            messageWindow.shift();
          }

          while (bwWindow.length > WindowLength) {
            bwWindow.shift();
          }

          const averageSize = Math.round(messageWindow.reduce((total, size) => total + size, 0) / messageWindow.length);
          const averageBw = Math.round(bwWindow.reduce((total, size) => total + size, 0) / bwWindow.length);

          if (averageSize > averageBw * 1.1) {
            state.H({
              custom: true,
              type: 'resample-imagery',
              down: true,
              averageBw
            });
          } else if (averageSize < averageBw * 0.9) {
            state.H({
              custom: true,
              type: 'resample-imagery',
              up: true,
              averageBw
            });
          }
        }
      };
    }

    static get firstDelay() {
      return 20;
      /* 20, 40, 250, 500;*/
    }

    triggerSendLoop() {
      if (this.loopActive) return;
      this.loopActive = true;
      this.currentDelay = this.constructor.firstDelay;
      setTimeout(() => this.nextLoop(), this.currentDelay);
    }

    async nextLoop() {
      //let data, meta, totalBandwidth;
      let q = Array.from(this.publics.queue);
      const url = this.subscribers[0];

      if (!this.publics.state.demoMode && this.translators.has(url)) {
        const translator = this.translators.get(url);
        q = q.map(e => translator(e, {})).filter(e => e !== undefined);
        q = q.reduce((Q, e) => (Array.isArray(e) ? Q.push(...e) : Q.push(e), Q), []);
      }

      const firstChainIndex = q.findIndex(e => !!e.chain);
      let chain, events;

      if (firstChainIndex == -1) {
        events = q.splice(0, MAX_E);
        this.publics.queue.splice(0, MAX_E);
      } else if (firstChainIndex == 0) {
        ({
          chain
        } = q.shift());
        this.publics.queue.shift();
      } else {
        const splice_index = Math.min(MAX_E, firstChainIndex);
        events = q.splice(0, splice_index);
        this.publics.queue.splice(0, splice_index);
      }

      if (chain) {
        this.sendEventChain({
          chain,
          url
        }).then(_ref => {
          let {
            /*data,*/
            meta,
            totalBandwidth
          } = _ref;

          if (!!meta && meta.length) {
            meta.forEach(metaItem => {
              const executionContextId = metaItem.executionContextId;

              for (const key of Object.keys(metaItem)) {
                let typeList = this.typeLists.get(key);

                if (typeList) {
                  typeList.forEach(func => {
                    try {
                      func({
                        [key]: metaItem[key],
                        executionContextId
                      });
                    } catch (e) {
                    }
                  });
                }
              }
            });
          }

          if (totalBandwidth) {
            this.publics.state.totalBandwidth = totalBandwidth;
          }
        });
      } else {
        this.sendEvents({
          events,
          url
        });
      }

      if (this.publics.queue.length) {
        setTimeout(() => this.nextLoop(), this.currentDelay);
      } else {
        this.loopActive = false;
      }
    }

    async sendEvents(_ref2) {
      let {
        events,
        url
      } = _ref2;
      if (!events) return {
        meta: [],
        data: []
      };
      events = events.filter(e => !!e && !!e.command);
      if (events.length == 0) return {
        meta: [],
        data: []
      };
      this.maybeCheckForBufferedFrames(events);
      let protocol;

      try {
        url = new URL(url);
        protocol = url.protocol; // OK WTF

        url.search = "session_token=".concat(this.sessionToken);
        url = url + '';
      } catch (e) {
        alert("WTF " + url);
        console.warn(e, url, this);
      }

      if (!this.publics.state.demoMode) {
        if (protocol == 'ws:' || protocol == 'wss:') {
          try {
            const senders = this.websockets.get(url);
            messageId++;
            let resolve;
            const promise = new Promise(res => resolve = res);
            waiting.set("".concat(url, ":").concat(messageId), resolve);

            if (senders) {
              senders.so({
                messageId,
                zombie: {
                  events
                }
              });
            } else {
              await this.connectSocket(url, events, messageId);
            }

            return promise;
          } catch (e) {
            console.warn(e);
            console.warn(JSON.stringify({
              msg: "Error sending event to websocket ".concat(url),
              events,
              url,
              error: e
            }));
            return {
              error: 'failed to send',
              events
            };
          }
        } else {
          const request = {
            method: 'POST',
            body: JSON.stringify({
              events
            }),
            headers: {
              'content-type': 'application/json'
            }
          };
          return fetch(url, request).then(r => r.json()).then(async _ref3 => {
            let {
              data,
              frameBuffer,
              meta
            } = _ref3;

            if (!!frameBuffer && this.images.has(url)) {
              drawFrames(this.publics.state, frameBuffer, this.images.get(url));
            }

            const errors = data.filter(d => !!d.error);

            if (errors.length) ;

            return {
              data,
              meta
            };
          }).catch(e => {
            console.warn(JSON.stringify({
              msg: "Error sending event to POST url ".concat(url),
              events,
              url,
              error: e
            }));
            return {
              error: 'failed to send',
              events
            };
          });
        }
      } else {
        return await this.publics.state.demoEventConsumer({
          events
        });
      }
    }

    async connectSocket(url, events, messageId) {
      if (connecting) {
        this.publics.queue.unshift(...events);
        return;
      }

      connecting = true;

      if (!this.publics.state.demoMode && onLine()) {
        let socket;

        try {
          socket = new WebSocket(url);
        } catch (e) {
          talert("Error connecting to the server. Will reload to try again.");
          await treload();
        }

        socket.onopen = () => {
          this.websockets.set(url, {
            so,
            sa
          });
          const receivesFrames = !this.publics.state.useViewFrame;
          so({
            messageId,
            zombie: {
              events,
              receivesFrames
            }
          });

          function so(o) {
            socket.send(JSON.stringify(o));
          }

          function sa(a) {
            socket.send(a);
          }
        };

        socket.onmessage = async message => {
          let {
            data: MessageData
          } = message;
          const messageData = JSON.parse(MessageData);
          const {
            data,
            frameBuffer,
            meta,
            messageId: serverMessageId,
            totalBandwidth
          } = messageData;

          if (!!frameBuffer && frameBuffer.length && this.images.has(url)) {
            this.addBytes(MessageData.length, frameBuffer.length);
            drawFrames(this.publics.state, frameBuffer, this.images.get(url));
          } else {
            this.addBytes(MessageData.length, false);
          }

          const errors = data.filter(d => !!d && !!d.error);

          if (errors.length) {
            DEBUG && console.log(JSON.stringify(errors));

            if (errors.some(_ref4 => {
              let {
                error
              } = _ref4;
              return error.hasSession === false;
            })) {
              console.warn("Session has been cleared. Let's attempt relogin", this.sessionToken);
              if (DEBUG.blockAnotherReset) return;
              DEBUG.blockAnotherReset = true;

              try {
                const x = new URL(location);
                x.pathname = 'login';
                x.search = "token=".concat(this.sessionToken, "&ran=").concat(Math.random());
                await talert("Your browser cleared your session. We need to reload the page to refresh it.");
                DEBUG.delayUnload = false;
                location.href = x;
                socket.onmessage = null;
              } catch (e) {
                talert("An error occurred. Please reload.");
              }

              return;
            } else if (errors.some(_ref5 => {
              let {
                error
              } = _ref5;
              return error.includes && error.includes("ECONNREFUSED");
            })) {
              console.warn("Cloud browser has not started yet. Let's reload and see if it has then.");
              if (DEBUG.blockAnotherReset) return;
              DEBUG.blockAnotherReset = true;
              talert("Your cloud browser has not started yet. We'll reload and see if it has then.");
              await treload();
              return;
            } else if (errors.some(_ref6 => {
              let {
                error
              } = _ref6;
              return error.includes && error.includes("Timed out");
            })) {
              console.warn("Some events are timing out when sent to the cloud browser.");
              if (DEBUG.blockAnotherReset) return;
              DEBUG.blockAnotherReset = true;
              const reload = await tconfirm("Some events are timing out when sent to the cloud browser. Try reloading the page, and if the problem persists try switching your cloud browser off then on again. Want to reload now?");

              if (reload) {
                treload();
              }

              return;
            } else if (errors.some(_ref7 => {
              let {
                error
              } = _ref7;
              return error.includes && error.includes("not opened");
            })) {
              console.warn("We can't establish a connection the cloud browser right now. We can try reloading the page, but if the problem persists try switching your cloud browser off then on again.");
              if (DEBUG.blockAnotherReset) return;
              DEBUG.blockAnotherReset = true;
              const reload = await tconfirm("We can't establish a connection the cloud browser right now. We can try reloading the page, but if the problem persists try switching your cloud browser off then on again. Reload the page now?");

              if (reload) {
                treload();
              }

              return;
            } else if (errors.some(_ref8 => {
              let {
                resetRequired
              } = _ref8;
              return resetRequired;
            })) {
              console.warn("Some errors have occurred which require reloading the page. If the problem persists try switching your cloud browser off then on again.");
              if (DEBUG.blockAnotherReset) return;
              DEBUG.blockAnotherReset = true;
              const reload = await tconfirm("Some errors have occurred which require reloading the page. If the problem persists try switching your cloud browser off then on again. Want to reload the page now?");

              if (reload) {
                treload();
              }

              return;
            }
          }

          if (!!meta && meta.length) {
            meta.forEach(metaItem => {
              const executionContextId = metaItem.executionContextId;

              for (const key of Object.keys(metaItem)) {
                let typeList = this.typeLists.get(key);

                if (typeList) {
                  typeList.forEach(func => {
                    try {
                      func({
                        [key]: metaItem[key],
                        executionContextId
                      });
                    } catch (e) {
                    }
                  });
                }
              }
            });
          }

          if (totalBandwidth) {
            this.publics.state.totalBandwidth = totalBandwidth;
          }

          const replyTransmitted = transmitReply({
            url,
            id: serverMessageId,
            data,
            meta,
            totalBandwidth
          });
          if (replyTransmitted) return;
          const fallbackReplyTransmitted = transmitReply({
            url,
            id: messageId,
            data,
            meta,
            totalBandwidth
          });
          if (fallbackReplyTransmitted) return; //die();
        };

        socket.onclose = async e => {
          this.websockets.delete(url);
          console.log("Socket disconnected. Will reconnect when online");
          talert("Error connecting to the server -- Will reload to try again.");
          await treload();
        };

        socket.onerror = async e => {
          socket.onerror = null;
          talert("Error connecting to the server - Will reload to try again.");
          await treload();
        };
      } else {
        console.log("Offline. Will connect socket when online");
        talert("Error connecting to the server, will reload to try again.");
        await treload();
      }
    }

    async sendEventChain(_ref9) {
      let {
        chain,
        url
      } = _ref9;
      const Meta = [],
            Data = [];
      let lastData;

      for (const next of chain) {
        if (typeof next == "object") {
          const {
            meta,
            data
          } = await this.sendEvents({
            events: [next],
            url
          });
          Meta.push(...meta);
          Data.push(...data);
          lastData = data;
        } else if (typeof next == "function") {
          let funcResult;

          try {
            funcResult = next(lastData[0]);
          } catch (e) {
            Data.push({
              error: e + ''
            });
          }

          let events;

          if (Array.isArray(funcResult)) {
            events = funcResult;
          } else if (typeof funcResult == "object") {
            events = [funcResult];
          }

          let {
            meta,
            data
          } = await this.sendEvents({
            events,
            url
          });
          Meta.push(...meta);
          Data.push(...data);
          lastData = data;
        }
      }

      return {
        data: Data,
        meta: Meta
      };
    }

    maybeCheckForBufferedFrames(events) {
      if (meetsCollectBufferedFrameCondition(this.publics.queue, events)) {
        if (this.willCollectBufferedFrame) {
          clearTimeout(this.willCollectBufferedFrame);
          this.willCollectBufferedFrame = false;
          bufferedFrameCollectDelay = BUFFERED_FRAME_COLLECT_DELAY.MIN;
        }

        this.willCollectBufferedFrame = setTimeout(() => this.pushNextCollectEvent(), bufferedFrameCollectDelay);
      }
    }

    pushNextCollectEvent() {
      clearTimeout(this.willCollectBufferedFrame);
      this.willCollectBufferedFrame = false;

      if (bufferedFrameCollectDelay >= BUFFERED_FRAME_COLLECT_DELAY.MAX) {
        bufferedFrameCollectDelay = BUFFERED_FRAME_COLLECT_DELAY.MIN;
      } else {
        bufferedFrameCollectDelay *= 1.618;
        this.willCollectBufferedFrame = setTimeout(() => this.pushNextCollectEvent(), bufferedFrameCollectDelay);
      }

      this.publics.queue.push(Object.assign({
        id: messageId++
      }, BUFFERED_FRAME_EVENT$3));
      this.triggerSendLoop();
    }

  }

  class EventQueue {
    constructor(state, sessionToken) {
      const privates = new Privates(this, state, sessionToken);
      const queue = [];
      this.state = state;
      Object.defineProperties(this, {
        queue: {
          get: () => queue
        },
        [$]: {
          get: () => privates
        }
      });
    }

    send(event) {
      if (Array.isArray(event)) {
        this.queue.push(...event);
      } else {
        this.queue.push(event);
      }

      this[$].triggerSendLoop();
    }

    addSubscriber(url, translator, imageEl) {
      this[$].subscribers.push(url);

      if (!!translator && typeof translator == "function") {
        this[$].translators.set(url, translator);
      }

      if (!!imageEl && imageEl instanceof HTMLImageElement) {
        this[$].images.set(url, imageEl);

        imageEl.onerror = () => {
          frameDrawing = false;
        };

        imageEl.addEventListener('load', () => {
          const ctx = this.state.viewState.ctx;
          ctx.drawImage(imageEl, 0, 0);
          frameDrawing = false;
        });
      }
    }

    addMetaListener(type, func) {
      let typeList = this[$].typeLists.get(type);

      if (!typeList) {
        typeList = [];
        this[$].typeLists.set(type, typeList);
      }

      typeList.push(func);
    }

  }

  async function drawFrames(state, buf, image) {
    buf = buf.filter(x => !!x);
    buf.sort((_ref10, _ref11) => {
      let {
        frame: frame1
      } = _ref10;
      let {
        frame: frame2
      } = _ref11;
      return frame2 - frame1;
    });
    buf = buf.filter(_ref12 => {
      let {
        frame,
        targetId
      } = _ref12;
      const cond = frame > latestFrame && targetId == state.activeTarget;
      latestFrame = frame;
      return cond;
    });

    for (const {
      img,
      frame
    } of buf) {
      if (frame < latestFrame) {
        console.warn("Got frame ".concat(frame, " less than ").concat(latestFrame, ". Dropping"));
        continue;
      }

      if (frameDrawing) {
        await sleep(Privates.firstDelay);
      }

      frameDrawing = frame;
      image.src = "data:image/".concat(Format, ";base64,").concat(img);
      await sleep(Privates.firstDelay);
    }
  }

  function meetsCollectBufferedFrameCondition(queue, events) {
    /**
      * The conditions for this are:
      * - we are sending the remainder of the queue (so none remain after this send).
      * - there is at least 1 click, scroll, or select event here.
      * 
      * If these conditions are met, then we set a timer. Once that timer expires,
      * We make an additional request to the server. That request is designed to pick up,
      * if it exists, any screenshot created after the click, scroll or select.
      * 
      * The timer is voided if we happen to make ANY request, before it expires. 
      * Let's have the timer property on the privates.
      * Let's expire it (cancel it) at sendEvents
      *
      * Finally what type of event will it add to the queue.
    **/
    const someRequireShot = events.some(_ref13 => {
      let {
        command
      } = _ref13;
      return command.requiresShot || command.requiresTailShot;
    });
    const createsTarget = events.some(_ref14 => {
      let {
        command
      } = _ref14;
      return command.name == "Target.createTarget";
    });
    const meetsCondition = someRequireShot || createsTarget;
    return meetsCondition;
  }

  function transmitReply(_ref15) {
    let {
      url,
      id,
      data,
      meta,
      totalBandwidth
    } = _ref15;
    let key = "".concat(url, ":").concat(id);
    const resolvePromise = waiting.get(key);

    if (resolvePromise) {
      waiting.delete(key);
      resolvePromise({
        data,
        meta,
        totalBandwidth
      });
      return true;
    } else {
      return false;
    }
  }
  /*async function die() {
    if ( DEBUG.val ) {
      console.log(`Application is in an invalid state. Going to ask to reload`);
    }
    if ( !DEBUG.dev && await tconfirm(`Sorry, something went wrong, and we need to reload. Is this okay?`) ) {
      treload();
    } else if ( DEBUG.val ) {
      throw new Error(`App is in an invalid state`);
    } else {
      treload();
    }
  }*/


  function onLine() {
    return navigator.onLine;
  }

  function talert(msg) {
    if (latestAlert && !DEBUG.val) {
      clearTimeout(latestAlert);
    }

    if (typeof msg != "string") {
      try {
        msg = JSON.stringify(msg);
      } catch (e) {
        msg = "Original msg could not be converted to string";
        console.warn(msg);
      }
    }

    latestAlert = setTimeout(() => alert(msg), ALERT_TIMEOUT);
  }

  async function tconfirm(msg) {
    let resolve;
    const pr = new Promise(res => resolve = res);

    if (latestAlert) {
      clearTimeout(latestAlert);
    }

    latestAlert = setTimeout(() => {
      resolve(confirm(msg));
    }, ALERT_TIMEOUT);
    return pr;
  }

  async function treload() {

    let resolve;
    const pr = new Promise(res => resolve = res);

    if (latestReload) {
      clearTimeout(latestReload);
    }

    latestReload = setTimeout(() => resolve(location.reload()), ALERT_TIMEOUT);
    return pr;
  }

  const getKeyId = event => event.key && event.key.length > 1 ? event.key : event.code;
  const controlChars = new Set(["Enter", "Backspace", "Control", "Shift", "Alt", "Meta", "Space", "Delete", "ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", "Tab"]);
  function transformEvent(e) {
    const transformedEvent = {
      type: e.type
    };
    let event, synthetic, originalEvent;

    if (e.synthetic) {
      synthetic = e;
      originalEvent = e.event;
      let form;

      if (originalEvent) {
        form = originalEvent.target && originalEvent.target.matches && originalEvent.target.matches('form') ? originalEvent.target : null;
        transformedEvent.originalType = originalEvent.type;
        transformedEvent.originalEvent = originalEvent;
      }

      switch (synthetic.type) {
        case "auth-response":
          {
            const {
              authResponse,
              requestId
            } = synthetic;
            Object.assign(transformedEvent, {
              authResponse,
              requestId
            });
            break;
          }

        case "typing":
          {
            // get (composed) characters created
            let data = synthetic.data;
            Object.assign(transformedEvent, {
              characters: data
            });
            break;
          }

        case "typing-syncValue":
        case "typing-clearAndInsertValue":
          {
            const {
              value,
              contextId
            } = synthetic;
            let encodedValue;

            if (value != null && value != undefined) {
              encodedValue = btoa(unescape(encodeURIComponent(value)));
            }

            Object.assign(transformedEvent, {
              encodedValue,
              value,
              contextId
            });
            break;
          }

        case "typing-deleteContentBackward":
          {
            let encodedValueToDelete;

            if (synthetic.valueToDelete) {
              encodedValueToDelete = btoa(unescape(encodeURIComponent(synthetic.valueToDelete)));
            }

            Object.assign(transformedEvent, {
              encodedValueToDelete,
              contextId: synthetic.contextId
            });
            break;
          }

        case "url-address":
          {
            // get URL address
            const address = synthetic.url;
            Object.assign(transformedEvent, {
              address
            });
            break;
          }

        case "search-bar":
          {
            // get URL address
            const search = originalEvent.target.search.value;
            Object.assign(transformedEvent, {
              search
            });
            break;
          }

        case "history":
          {
            // get button
            const action = form.clickedButton.value;
            Object.assign(transformedEvent, {
              action
            });
            break;
          }

        case "touchscroll":
          {
            const {
              deltaX,
              deltaY,
              bitmapX,
              bitmapY,
              contextId
            } = synthetic;
            Object.assign(transformedEvent, {
              deltaX,
              deltaY,
              bitmapX,
              bitmapY,
              contextId
            });
            break;
          }

        case "zoom":
          {
            const {
              scale
            } = synthetic;
            const coords = getBitmapCoordinates(originalEvent);
            Object.assign(transformedEvent, coords, {
              scale
            });
            break;
          }

        case "select":
          {
            const value = originalEvent.target.value;
            const executionContext = synthetic.state.waitingExecutionContext;
            Object.assign(transformedEvent, {
              value,
              executionContext
            });
            break;
          }

        case "window-bounds":
          {
            const {
              width,
              height,
              targetId
            } = synthetic;
            Object.assign(transformedEvent, {
              width,
              height,
              targetId
            });
            break;
          }

        case "window-bounds-preImplementation":
          {
            // This is here until Browser.getWindowForTarget and Browser.setWindowBounds come online
            let width, height;

            if (synthetic.width !== undefined && synthetic.height !== undefined) {
              ({
                width,
                height
              } = synthetic);
            } else {
              ({
                width: {
                  value: width
                },
                height: {
                  value: height
                }
              } = form);
            }

            Object.assign(transformedEvent, {
              width,
              height
            });
            break;
          }

        case "user-agent":
          {
            const {
              userAgent,
              platform,
              acceptLanguage
            } = synthetic;
            Object.assign(transformedEvent, {
              userAgent,
              platform,
              acceptLanguage
            });
            break;
          }

        case "hide-scrollbars":
          {
            break;
          }

        case "canKeysInput":
          {
            break;
          }

        case "getFavicon":
          {
            break;
          }

        case "getElementInfo":
          {
            transformedEvent.data = e.data;
            const {
              bitmapX: clientX,
              bitmapY: clientY
            } = getBitmapCoordinates(transformedEvent.data);
            Object.assign(transformedEvent.data, {
              clientX,
              clientY
            });
            break;
          }

        case "touchcancel":
          {
            break;
          }

        case "respond-to-modal":
          {
            Object.assign(transformedEvent, e);
            break;
          }

        case "isSafari":
          {
            break;
          }

        case "isMobile":
          {
            break;
          }

        case "isFirefox":
          {
            break;
          }

        case "newIncognitoTab":
          {
            break;
          }

        case "clearAllPageHistory":
          {
            break;
          }

        case "clearCache":
          {
            break;
          }

        case "clearCookies":
          {
            break;
          }

        default:
          {
            console.warn("Unknown command ".concat(JSON.stringify({
              synthetic
            })));
            break;
          }
      }
    } else if (e.raw || e.custom) {
      Object.assign(transformedEvent, e);
    } else {
      event = e;
      transformedEvent.originalEvent = e;

      switch (event.type) {
        case "keypress":
        case "keydown":
        case "keyup":
          {
            const id = getKeyId(event);

            if (controlChars.has(id)) {
              event.type == "keypress" && event.preventDefault && event.preventDefault();
              transformedEvent.synthetic = true;
              transformedEvent.originalType = event.type;
              transformedEvent.type = "control-chars";
              transformedEvent.key = event.key;
              transformedEvent.code = event.code;
              transformedEvent.keyCode = event.keyCode;
            } else if (event.code == "Unidentified" || event.key == "Unidentified") {
              transformedEvent.key = event.key;
              transformedEvent.code = event.code;
            } else {
              transformedEvent.synthetic = true;
              transformedEvent.originalType = event.type;
              transformedEvent.type = event.type;
              transformedEvent.key = event.key;
              transformedEvent.code = event.code;
              transformedEvent.keyCode = event.keyCode;
            }

            break;
          }

        case "wheel":
        case "mousemove":
        case "mousedown":
        case "mouseup":
        case "pointermove":
        case "pointerdown":
        case "pointerup":
          {
            // get relevant X, Y coordinates and element under point
            // also get any relevant touch points and pressures and other associated
            // pointer or touch metadata or properties
            const {
              button
            } = event;
            const coords = getBitmapCoordinates(event);
            Object.assign(transformedEvent, coords, {
              button
            });
            break;
          }
      }
    }
    return transformedEvent;
  }
  function getBitmapCoordinates(event) {
    let scale = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
    const {
      clientX,
      clientY
    } = event;
    const bitmap = event.target;
    let coordinates;

    if (bitmap) {
      const {
        left: parentX,
        top: parentY,
        width: elementWidth,
        height: elementHeight
      } = bitmap.getBoundingClientRect();
      bitmap.width / elementWidth * scale;
      bitmap.height / elementHeight * scale;
      coordinates = {
        bitmapX: clientX - parentX,
        bitmapY: clientY - parentY
      };
    } else {
      coordinates = {
        clientX,
        clientY
      };
    }

    return coordinates;
  }

  var _templateObject$9;
  let omniBoxInput = null;
  let refocus = false;
  function OmniBox(state) {
    const activeTab = state.activeTab();
    const {
      H
    } = state;

    if (document.activeElement == omniBoxInput) {
      refocus = true;
    }

    return d(_templateObject$9 || (_templateObject$9 = _taggedTemplateLiteral(["\n    <nav class=\"controls url\" stylist=styleNavControl>\n      <!--URL-->\n        <form class=url stylist=styleURLForm submit=", " click=", ">\n          <input \n            maxlength=3000\n            title=\"Address or search\"\n            bond=", "\n            stylist=styleOmniBox \n            autocomplete=off ", " \n            name=address \n            placeholder=\"", "\" \n            type=search \n            value=\"", "\"\n          >\n          <button ", " title=\"Go\" class=go>&crarr;</button>\n        </form>\n    </nav>\n  "])), e => {
      const {
        target: form
      } = e;
      const {
        address
      } = form;
      let url, search;

      try {
        url = new URL(address.value);

        if (url.hostname == location.hostname) {
          console.warn("Too relative", address.value);
          throw new TypeError("Cannot use relative URI");
        }

        url = url + '';
      } catch (e) {
        search = searchProvider({
          query: address.value
        });
      }

      H({
        synthetic: true,
        type: 'url-address',
        event: e,
        url: url || search
      });
    }, saveClick, el => {
      omniBoxInput = el;
      state.viewState.omniBoxInput = omniBoxInput;

      if (refocus) {
        refocus = false;
        omniBoxInput.focus();
      }
    }, state.tabs.length == 0 ? 'disabled' : '', state.tabs.length ? 'Address or search' : '', activeTab.url == 'about:blank' ? '' : activeTab.url || '', state.tabs.length ? '' : 'disabled');
  }
  function focusOmniBox() {
    if (omniBoxInput) {
      omniBoxInput.focus();
    }
  } // Search

  function searchProvider() {
    let {
      query = ''
    } = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    {
      return "https://duckduckgo.com/?q=".concat(encodeURIComponent(query));
    }
  }

  var _templateObject$8;
  let pluginsMenuOpen = false;
  function PluginsMenuButton(state) {
    return u(_templateObject$8 || (_templateObject$8 = _taggedTemplateLiteral(["\n    <nav class=\"controls plugins-menu-button aux\" stylist=\"styleNavControl stylePluginsMenuButton\">\n      <form submit=", ">\n        <button title=\"Menu\" accesskey=p>&#9776;</button>\n      </form>\n    </nav>\n  "])), [e => e.preventDefault(), () => {
      pluginsMenuOpen ^= true;
      state.pluginsMenuActive = pluginsMenuOpen;
      state.viewState.dss.setState(state);
      state.viewState.dss.restyleElement(state.viewState.pmEl);
      state.viewState.dss.restyleElement(state.viewState.voodooEl);
    }]);
  } // Helper functions

  var _templateObject$7;
  function Controls(state) {
    const {
      H,
      retargetTab
    } = state;
    return d(_templateObject$7 || (_templateObject$7 = _taggedTemplateLiteral(["\n    <nav class=\"controls history aux\" stylist=\"styleNavControl\">\n      <!--History-->\n        <form submit=", " click=", " stylist=\"styleHistoryForm\">\n          <button ", " name=history_action title=Back value=back class=back>&lt;</button>\n          <button ", " name=history_action title=Forward value=forward class=forward>&gt;</button>\n        </form>\n    </nav>\n    <nav class=\"controls keyinput aux\" stylist=\"styleNavControl\">\n      <!--Text-->\n        <form class=kbd-input submit=", ">\n          <input tabindex=-1 class=control name=key_input size=5\n            autocomplete=off\n            bond=", "\n            keydown=", "\n            keyup=", "\n            focusin=", "\n            compositionstart=", "\n            compositionupdate=", "\n            compositionend=", "\n            input=", "\n            keypress=", "\n            paste=", "\n            >\n          <textarea tabindex=-1 class=control name=textarea_input cols=5 rows=1\n            autocomplete=off\n            bond=", "\n            keydown=", "\n            keyup=", "\n            focusin=", "\n            compositionstart=", "\n            compositionupdate=", "\n            compositionend=", "\n            input=", "\n            keypress=", "\n            paste=", "\n            ></textarea>\n        </form>\n    </nav>\n    ", "\n    ", "\n  "])), e => H({
      synthetic: true,
      type: 'history',
      event: e
    }), saveClick, state.tabs.length ? '' : 'disabled', state.tabs.length ? '' : 'disabled', e => e.preventDefault(), el => state.viewState.keyinput = el, [logitKeyInputEvent, e => state.openKey = e.key, H, limitCursor, retargetTab], [logitKeyInputEvent, () => state.openKey = '', H, retargetTab], [() => clearWord(state), () => state.openKey = ''], [logitKeyInputEvent, startComposition], [logitKeyInputEvent, updateComposition], [logitKeyInputEvent, endComposition], [logitKeyInputEvent, inputText], [logitKeyInputEvent, pressKey], e => {
      inputText({
        type: 'paste',
        data: e.clipboardData.getData('Text')
      });
    }, el => state.viewState.textarea = el, [logitKeyInputEvent, e => state.openKey = e.key, H, limitCursor, retargetTab], [logitKeyInputEvent, () => state.openKey = '', H, retargetTab], [() => clearWord(state), () => state.openKey = ''], [logitKeyInputEvent, startComposition], [logitKeyInputEvent, updateComposition], [logitKeyInputEvent, endComposition], [logitKeyInputEvent, inputText], [logitKeyInputEvent, pressKey], e => {
      inputText({
        type: 'paste',
        data: e.clipboardData.getData('Text')
      });
    }, OmniBox(state), '');

    function
      /*e*/
    startComposition() {
      state.isComposing = true;
      state.latestData = "";
    }

    function updateComposition(e) {
      state.isComposing = true;

      if (state.hasCommitted) {
        state.latestData = e.data || state.latestData || "";
      }
    }

    function endComposition(e) {
      if (!state.isComposing) return;
      state.isComposing = false;
      if (e.data == state.latestCommitData) return;
      let data = e.data || "";

      if (commitChange(e, state)) {
        H({
          synthetic: true,
          type: 'typing',
          event: e,
          data: data
        });
        state.latestCommitData = data;
        state.hasCommitted = true;
        state.latestData = "";
      } else {
        state.latestData = "";
      }
    }

    function inputText(e) {
      let data = e.data || "";

      if (state.convertTypingEventsToSyncValueEvents) {
        H({
          synthetic: true,
          type: 'typing',
          event: e,
          data: data
        });
      } else {
        if (state.openKey == data) return;

        if (commitChange(e, state)) {
          state.isComposing = false;
          H({
            synthetic: true,
            type: 'typing',
            event: e,
            data: data
          });
          state.latestCommitData = data;
          state.hasCommitted = true;
          state.latestData = "";
        } else if (e.inputType == 'deleteContentBackward') {
          if (!state.backspaceFiring) {
            H({
              type: "keydown",
              key: "Backspace"
            });
            H({
              type: "keyup",
              key: "Backspace"
            });

            if (state.viewState.shouldHaveFocus) {
              state.viewState.shouldHaveFocus.value = "";
            }
            /**
            H({
              synthetic: true,
              type: 'typing-deleteContentBackward',
              event: e,
              contextId: state.contextIdOfFocusedInput,
              valueToDelete: state.latestCommitData,
            });
            **/

          }

          state.latestData = "";
        } else if (e.inputType == 'insertReplacementText') {
          if (!state.backspaceFiring) {
            H({
              type: "keydown",
              key: "Backspace"
            });
            H({
              type: "keyup",
              key: "Backspace"
            });

            if (state.viewState.shouldHaveFocus) {
              state.viewState.shouldHaveFocus.value = "";
            }
            /**
            H({
              synthetic: true,
              type: 'typing-deleteContentBackward',
              event: e,
              contextId: state.contextIdOfFocusedInput,
              valueToDelete: state.latestCommitData,
            });
            **/

          }

          state.latestData = "";
          H({
            synthetic: true,
            type: 'typing-deleteContentBackward',
            event: e,
            contextId: state.contextIdOfFocusedInput,
            valueToDelete: state.currentWord
          });
          H({
            synthetic: true,
            type: 'typing',
            event: e,
            data: e.data
          });
          state.latestData = "";
          clearWord(state);
          state.latestCommitData = e.data;
          state.hasCommitted = true;
        } else if (e.type == 'paste') {
          H({
            synthetic: true,
            type: 'typing',
            event: e,
            data: data
          });
          state.latestData = "";
          clearWord(state);
          state.latestCommitData = data;
          state.hasCommitted = true;
          state.latestData = "";
        }
      }
    }

    function pressKey(e) {
      updateWord(e, state);

      if (e.key && e.key.length == 1) {
        state.lastKeypressKey = e.key;
        H({
          synthetic: true,
          type: 'typing',
          event: e,
          data: e.key
        });
      } else H(e);

      retargetTab(e);
    }
  } // Helper functions 
  // save the target of a form submission

  function saveClick(event) {
    if (event.target.matches('button')) {
      event.currentTarget.clickedButton = event.target;
    }
  } // keep track of sequences of keypresses (words basically)
  // because some IMEs (iOS / Safari) issue a insertReplacementText if we select a 
  // suggested word, which requires we delete the word already entered.

  function clearWord(state) {
    state.hasCommitted = false;
    state.currentWord = "";
  }

  function updateWord(keypress, state) {
    const key = keys[keypress.key];

    if (!!key && (key.code == 'Space' || key.code == 'Enter')) {
      clearWord(state);
    } else {
      state.currentWord += keypress.key;
    }
  }
  /**
    * Limit cursor prevents the cursor to be moved
    * Inside textarea.
    * The reason we do this is to greatly simplify (for now)
    * The type of input events that we need to handle and transmit
    * to the remote browser.
    * This limits us to only consider appending or deleting at the END
    * of the textarea. 
  **/


  function
    /*event*/
  limitCursor() {
    /*
    const target = event.target;
    target.selectionStart = target.selectionEnd = target.value.length;
    */
    return;
  } // text
  // determines if it's time to commit a text input change from an IME


  function commitChange(e, state) {
    const canCommit = e.type == "input" && e.inputType == "insertText" || e.type == "compositionend" && !!(e.data || state.latestData);

    return canCommit;
  }

  var _templateObject$6, _templateObject2$5, _templateObject3$4;
  let serverBwThisSecond = 0;
  let lastServerBandwidth = 0;
  let bwThisSecond = 0;
  let lastBandwidth = 0;
  let last = Date.now();
  function BandwidthIndicator(state) {
    let saved = state.totalBandwidth / 1000000;
    let ss = 'M';

    if (saved > 1000) {
      saved /= 1000;
      ss = 'G';
    }

    let sr = state.totalServerBytesThisSecond;
    let sm = 'B/s';

    if (sr > 1000) {
      sr /= 1000;
      sm = 'Kb/s';
    }

    if (sr > 1000) {
      sr /= 1000;
      sm = 'M/s';
    }

    if (sr > 1000) {
      sr /= 1000;
      sm = 'G/s';
    }

    let used = state.totalBytes / 1000;
    let us = 'Kb';

    if (used > 1000) {
      used /= 1000;
      us = 'M';
    }

    if (used > 1000) {
      used /= 1000;
      us = 'G';
    }

    let lr = state.totalBytesThisSecond;
    let lm = 'B/s';

    if (lr > 1000) {
      lr /= 1000;
      lm = 'Kb/s';
    }

    if (lr > 1000) {
      lr /= 1000;
      lm = 'M/s';
    }

    if (lr > 1000) {
      lr /= 1000;
      lm = 'G/s';
    }

    return d(_templateObject$6 || (_templateObject$6 = _taggedTemplateLiteral(["\n    <aside title=\"Bandwidth savings\" class=\"bandwidth-indicator\" stylist=\"styleBandwidthIndicator\">\n      <section class=measure>\n        &#x1f4e1; <span>", "</span>&nbsp;", "\n      </section>\n      <section class=measure>\n        &#x1f4bb; <span>", "</span>&nbsp;", "\n      </section>\n    </aside>\n  "])), Math.round(saved) + ss, state.showBandwidthRate ? u(_templateObject2$5 || (_templateObject2$5 = _taggedTemplateLiteral(["<span>(", ")</span>"])), Math.round(sr) + sm) : '', Math.round(used) + us, state.showBandwidthRate ? u(_templateObject3$4 || (_templateObject3$4 = _taggedTemplateLiteral(["<span>(", ")</span>"])), Math.round(lr) + lm) : '');
  }
  function startBandwidthLoop(state) {
    setInterval(() => {
      const now = Date.now();
      const diff = (now - last) / 1000;
      last = now;
      serverBwThisSecond = state.totalBandwidth - lastServerBandwidth;
      bwThisSecond = state.totalBytes - lastBandwidth;
      lastBandwidth = state.totalBytes;
      state.totalBytesThisSecond = Math.round(bwThisSecond / diff);
      lastServerBandwidth = state.totalBandwidth;
      state.totalServerBytesThisSecond = Math.round(serverBwThisSecond / diff);
      BandwidthIndicator(state);
    }, 1000);
  }

  var _templateObject$5;
  function PluginsMenu(state) {
    let {
      bondTasks = []
    } = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    return d(_templateObject$5 || (_templateObject$5 = _taggedTemplateLiteral(["\n    <nav class=plugins-menu \n      bond=", " \n      stylist=\"stylePluginsMenu\"\n    >\n      <aside>\n        <header>\n          <h1 class=spread>\n            Menu\n            ", "\n          </h1>\n        </header>\n        <article>\n          <section>\n            <h1>\n              Quality Settings\n            </h1>\n            <form method=POST action=#save-settings>\n              <fieldset>\n                <legend>Image Mode Settings</legend>\n                <p>\n                  <label>\n                    <input type=range min=1 max=100 value=25 name=jpeg_quality\n                      oninput=\"jfqvalue.value = this.value;\" \n                    >\n                    JPEG frame quality\n                    &nbsp;(<output id=jfqvalue>25</output>)\n                  </label>\n                <p>\n                  <button>Save</button>\n              </fieldset>\n            </form>\n          </section>\n          <section>\n            <h1>\n              Plugins\n            </h1>\n            <form method=POST action=#plugins-settings>\n              <fieldset>\n                <legend>Enabled plugins</legend>\n                <p>\n                  <label>\n                    <input type=checkbox name=mapmaker>\n                    Map Maker \n                  </label>\n                <p>\n                  <label>\n                    <input type=checkbox name=mapviewer>\n                    Map Viewer\n                  </label>\n                <p>\n                  <label>\n                    <input type=checkbox name=trailmarker>\n                    Trail Marker\n                  </label>\n                <p>\n                  <label>\n                    <input type=checkbox name=trailrunner>\n                    Trail Runner\n                  </label>\n                <p>\n                  <button>Save</button>\n              </fieldset>\n              <fieldset>\n                <legend>Discover plugins</legend>\n                <p>\n                  <label>\n                    <button name=discover>Discover</button>\n                    Discover plugins to install \n                  </label>\n                <p>\n                  <label>\n                    <input type=search name=plugin_search>\n                    <button name=search>Search</button>\n                    Search for plugins to install\n                  </label>\n                <p>\n                  <ul class=plugins-search-results></ul>\n              </fieldset>\n            </form>\n          </section>\n        </article>\n      </aside>\n    </nav>\n  "])), [el => state.viewState.pmEl = el, () => console.log("PMA?".concat(!!state.pluginsMenuActive)), ...bondTasks], PluginsMenuButton(state));
  }

  var _templateObject$4, _templateObject2$4, _templateObject3$3;

  const NATIVE_MODALS = new Set(['alert', 'confirm', 'prompt', 'beforeunload']);
  const ModalRef = {
    alert: null,
    confirm: null,
    prompt: null,
    beforeunload: null,
    infobox: null,
    notice: null,
    auth: null,
    filechooser: null,
    intentPrompt: null
  }; // Modals

  function Modals(state) {
    try {
      const {
        currentModal
      } = state.viewState; // these are default values when there is no current Modal

      let msg = '',
          type = '',
          title = '',
          currentModalEl = false;
      let csrfToken = '';
      let requestId = '';
      let sessionId = '';
      let mode = '';
      let accept = '';
      let multiple = false;
      let submitText = '';
      let cancelText = '';
      let otherButton = null;
      let working = false;
      let url = '';

      if (currentModal) {
        // the defaults here are defaults when there *is* a current modal
        ({
          msg = 'Empty',
          type,
          csrfToken = '',
          url = '',
          title = 'Untitled',
          el: currentModalEl,
          requestId = '',
          mode = '',
          sessionId = '',
          accept = '',
          submitText = 'Submit',
          cancelText = 'Cancel',
          otherButton = null,
          working = false
        } = currentModal);
      }

      if (type == 'intentPrompt') {
        if (!url) {
          throw new TypeError("IntentPrompt modal requires a url");
        } else {
          const Url = new URL(url);

          if (Url.protocol == 'intent:') {
            if ((Url + '').includes('google.com/maps')) {
              Url.protocol = 'https:';
            }

            url = Url;
          }
        }
      }

      if (type == 'auth' && !requestId) {
        throw new TypeError("Auth modal requires a requestId to send the response to");
      }

      if (type == 'filechooser' && !(mode && sessionId && csrfToken)) {
        console.log(currentModal);
        throw new TypeError("File chooser modal requires both sessionId, mode and csrfToken");
      }

      if (mode == 'selectMultiple') {
        multiple = true;
      }

      return d(_templateObject$4 || (_templateObject$4 = _taggedTemplateLiteral(["\n          <aside class=\"modals ", "\" stylist=\"styleModals\" click=", ">\n            <article bond=", " class=\"alert ", "\">\n              <h1>Alert!</h1>\n              <p class=message value=message>", "</p>\n              <button class=ok title=Acknowledge value=ok>Acknowledge</button>\n            </article>\n            <article bond=", " class=\"confirm ", "\">\n              <h1>Confirm</h1>\n              <p class=message value=message>", "</p>\n              <button class=ok title=\"Confirm\" value=ok>Confirm</button>\n              <button class=cancel title=\"Deny\" value=cancel>Deny</button>\n            </article>\n            <article bond=", " class=\"prompt ", "\">\n              <h1>Prompt</h1>\n              <p class=message value=message>", "</p>\n              <p><input type=text name=response>\n              <button class=ok title=\"Send\" value=ok>Send</button>\n              <button class=cancel title=\"Dismiss\" value=cancel>Dismiss</button>\n            </article>\n            <article bond=", " class=\"beforeunload ", "\">\n              <h1>Page unloading</h1>\n              <p class=message value=message>", "</p>\n              <button class=ok title=\"Leave\" value=ok>Leave</button>\n              <button class=cancel title=\"Remain\" value=cancel>Remain</button>\n            </article>\n            <article bond=", " class=\"infobox ", "\">\n              <h1>", "</h1>\n              <textarea \n                readonly class=message value=message rows=", "\n              >", "</textarea>\n              <button class=ok title=\"Got it\" value=ok>OK</button>\n            </article>\n            <article bond=", " class=\"notice ", "\">\n              <h1>", "</h1>\n              <p class=message value=message>", "</p>\n              <button class=ok title=Acknowledge value=ok>OK</button>\n              ", "\n            </article>\n            <article bond=", " class=\"auth ", "\">\n              <h1>", "</h1>\n              <form>\n                <p class=message value=message>", "</p>\n                <input type=hidden name=requestid value=", ">\n                <p>\n                  <input type=text name=username placeholder=username maxlength=140>\n                <p>\n                  <input type=password name=password placeholder=password maxlength=140>\n                <p>\n                  <button click=", ">Submit</button>\n                  <button click=", ">Cancel</button>\n              </form>\n            </article>\n            <article bond=", " class=\"filechooser ", "\">\n              <h1>", "</h1>\n              <form method=POST action=/file enctype=multipart/form-data>\n                <p class=message value=message>", "</p>\n                <input type=hidden name=sessionid value=", ">\n                <input type=hidden name=_csrf value=", ">\n                <p>\n                  <label>\n                    Select ", ".\n                    <input type=file name=files ", " accept=\"", "\">\n                  </label>\n                <p>\n                  <button \n                    ", " \n                    click=", "\n                  >", "</button>\n                  <button \n                    ", " \n                    click=", "\n                  >", "</button>\n              </form>\n            </article>\n            <article bond=", " class=\"intent-prompt ", "\">\n              <h1>", "</h1>\n              <form method=GET action=\"", "\" target=_top submit=", ">\n                <p class=message value=message>", "</p>\n                <p>\n                  <button type=reset>Stop it</button>\n                  <button>Open external app</button>\n              </form>\n            </article>\n          </aside>\n        "])), currentModal ? 'active' : '', click => closeModal(click, state), el => ModalRef.alert = el, currentModalEl === ModalRef.alert ? 'open' : '', msg || 'You are alerted.', el => ModalRef.confirm = el, currentModalEl === ModalRef.confirm ? 'open' : '', msg || 'You are asked to confirm', el => ModalRef.prompt = el, currentModalEl === ModalRef.prompt ? 'open' : '', msg || 'You are prompted for information:', el => ModalRef.beforeunload = el, currentModalEl === ModalRef.beforeunload ? 'open' : '', msg || 'Are you sure you wish to leave?', el => ModalRef.infobox = el, currentModalEl === ModalRef.infobox ? 'open' : '', title || 'Info', Math.ceil(msg.length / 80), msg, el => ModalRef.notice = el, currentModalEl === ModalRef.notice ? 'open' : '', title, msg || 'Empty notice', otherButton ? u(_templateObject2$4 || (_templateObject2$4 = _taggedTemplateLiteral(["<button title=\"", "\" click=", ">", "</button>"])), otherButton.title, otherButton.onclick, otherButton.title) : '', el => ModalRef.auth = el, currentModalEl === ModalRef.auth ? 'open' : '', title, msg || 'Empty notice', requestId, click => respondWithAuth(click, state), click => respondWithCancel(click, state), el => ModalRef.filechooser = el, currentModalEl === ModalRef.filechooser ? 'open' : '', title, msg || 'Empty notice', sessionId, csrfToken, multiple ? 'one or more files' : 'one file', multiple ? 'multiple' : '', accept, working ? 'disabled' : '', click => chooseFile(click, state), submitText, working ? 'disabled' : '', click => cancelFileChooser(click, state), cancelText, el => ModalRef.intentPrompt = el, currentModalEl === ModalRef.intentPrompt ? 'open' : '', title, url, submission => {
        submission.preventDefault();
        window.top.open(url);
      }, "This page is asking to open an external app using URL: ".concat(url));
    } catch (e) {
      console.log("Modal error", e);
    }
  }

  async function chooseFile(click, state) {
    click.preventDefault();
    click.stopPropagation();
    const form = click.target.closest('form');
    const body = new FormData(form);
    const request = {
      method: form.method,
      body
    };
    Object.assign(state.viewState.currentModal, {
      submitText: 'Uploading...',
      working: true
    });
    Modals(state);
    const resp = await fetch(form.action, request).then(r => r.json());

    if (resp.error) {
      alert(resp.error);
    }

    closeModal(click, state);
  }

  async function cancelFileChooser(click, state) {
    click.preventDefault();
    click.stopPropagation();
    const form = click.target.closest('form');
    form.reset();
    const body = new FormData(form);
    body.delete('files');
    const request = {
      method: form.method,
      body
    };
    Object.assign(state.viewState.currentModal, {
      cancelText: 'Canceling...',
      working: true
    });
    Modals(state);
    const resp = await fetch(form.action, request).then(r => r.json());

    if (resp.error) {
      alert("An error occurred");
    }

    closeModal(click, state);
  }

  function respondWithAuth(click, state) {
    click.preventDefault();
    click.stopPropagation();
    const form = click.target.closest('form');
    const data = new FormData(form);
    const requestId = data.get('requestid').slice(0, 140);
    const username = data.get('username').slice(0, 140);
    const password = data.get('password').slice(0, 140);
    const authResponse = {
      username,
      password,
      response: "ProvideCredentials"
    };
    state.H({
      synthetic: true,
      type: 'auth-response',
      requestId,
      authResponse
    });
    closeModal(click, state);
  }

  function respondWithCancel(click, state) {
    click.preventDefault();
    click.stopPropagation();
    const form = click.target.closest('form');
    const data = new FormData(form);
    const requestId = data.get('requestid').slice(0, 140);
    const authResponse = {
      response: "CancelAuth"
    };
    state.H({
      synthetic: true,
      type: 'auth-response',
      requestId,
      authResponse
    });
    closeModal(click, state);
  }

  function openModal() {
    let {
      modal: {
        sessionId,
        mode,
        requestId,
        title,
        type,
        message: msg,
        defaultPrompt,
        url,
        otherButton,
        csrfToken
      }
    } = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    let state = arguments.length > 1 ? arguments[1] : undefined;
    const currentModal = {
      type,
      csrfToken,
      mode,
      requestId,
      msg,
      el: ModalRef[type],
      sessionId,
      otherButton,
      title,
      url
    };
    state.viewState.currentModal = currentModal; //console.log(state.viewState.currentModal);
    Modals(state);
  }

  function closeModal(click, state) {
    if (!click.target.matches('button')) return;
    const response = click.target.value || 'unknown';
    const {
      sessionId
    } = state.viewState.currentModal;
    state.viewState.lastModal = state.viewState.currentModal;
    state.viewState.currentModal = null;
    state.viewState.lastModal.modalResponse = response;

    if (NATIVE_MODALS.has(state.viewState.lastModal.type)) {
      console.log(state.viewState);
      state.H({
        synthetic: true,
        type: "respond-to-modal",
        response,
        sessionId
      });
    }

    setTimeout(() => Modals(state), 50);
  } // Permission request


  function PermissionRequest(_ref) {
    let {
      permission,
      request,
      page
    } = _ref;
    return d(_templateObject3$3 || (_templateObject3$3 = _taggedTemplateLiteral(["\n        <article class=\"permission-request hidden\">\n          <h1>", "</h1>\n          <p class=request>", " is requesting ", " permission. The details are: ", "</p>\n          <button class=grant>Grant</button>\n          <button class=deny>Deny</button>\n        </article>\n      "])), permission, page, permission, request);
  }

  var _templateObject$3, _templateObject2$3, _templateObject3$2, _templateObject4$2;
  const CLOSE_DELAY = 222;
  const SHORT_CUT = 'Ctrl+Shift+J'; //const FUNC = e => console.log("Doing it", e);

  const CONTEXT_MENU = state => ({
    'page': [{
      title: 'Open link in new tab',
      shortCut: SHORT_CUT,
      func: openInNewTab
    }, {
      title: 'Save screenshot',
      shortCut: SHORT_CUT,
      func: download
    }, {
      title: 'Reload',
      shortCut: SHORT_CUT,
      func: reload
    }, {
      title: 'Copy text from here',
      shortCut: SHORT_CUT,
      func: copy,
      hr: true
    }, {
      title: 'Copy link address from here',
      shortCut: SHORT_CUT,
      func: copyLink
    }, {
      title: 'Paste text',
      shortCut: SHORT_CUT,
      func: paste
    }, //  This is blocked (apparently) on: https://bugs.chromium.org/p/chromium/issues/detail?id=1015260
    {
      title: 'New incognito tab',
      shortCut: SHORT_CUT,
      func: newBrowserContextAndTab,
      hr: true
    }, {
      title: 'Clear history',
      shortCut: SHORT_CUT,
      func: clearHistoryAndCacheLeaveCookies,
      hr: true
    }, {
      title: 'Wipe everything',
      shortCut: SHORT_CUT,
      func: clearBrowsingData
    }, {
      title: document.fullscreenElement || document.webkitFullscreenElement ? 'Exit full screen' : 'Full screen',
      shortCut: SHORT_CUT,
      func: fullScreen,
      hr: true
    }]
  });

  function
    /*state*/
  ContextMenu() {
    return d(_templateObject$3 || (_templateObject$3 = _taggedTemplateLiteral(["\n\n  "])));
  }
  const CTX_MENU_THRESHOLD = 675;
  function makeContextMenuHandler(state) {
    let node = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
      type: 'page',
      id: 'current-page'
    };
    const {
      /*id, */
      type: nodeType
    } = node;
    return contextMenu => {
      const menuItems = CONTEXT_MENU()[nodeType]; // we need this check because we attach a handler to each node
      // we could use delegation at the container of the root node
      // but for now we do it like this

      if (navigator.vibrate) {
        try {
          navigator.vibrate(100);
        } catch (e) {
          console.warn('error vibrating', e);
        }
      }

      if (contextMenu.currentTarget.contains(contextMenu.target)) {
        let pageX, pageY;

        if (contextMenu.pageX && contextMenu.pageY) {
          ({
            pageX,
            pageY
          } = contextMenu);
        } else {
          const {
            clientX,
            clientY
          } = contextMenu.detail;
          ({
            pageX,
            pageY
          } = contextMenu.detail);
          Object.assign(contextMenu, {
            pageX,
            pageY,
            clientX,
            clientY
          });
        } // cancel click for chrome mobile
        // (note: this does not work as intended. 
        // It does not cancel a touch click on contextmenu open)
        // so it's commented out
        // state.H({type:'touchcancel'});
        // the actual way to kill the click is 
        // by killing the next mouse release like so:


        state.viewState.contextMenuClick = contextMenu; //state.viewState.killNextMouseReleased = true;
        // we also stop default context menu

        contextMenu.preventDefault();
        contextMenu.stopPropagation();
        const bondTasks = [el => {
          // only have 1 context menu at a time
          close(state, false);
          state.viewState.contextMenu = el;
        }, () => self.addEventListener('click', function remove(click) {
          // if we clicked outside the menu, 
          // remove the menu and stop listening for such clicks
          if (!click.target.closest('.context-menu')) {
            close(state, false);
            self.removeEventListener('click', remove);
          }
        }), el => {
          const x = pageX + 'px';
          const y = pageY + 'px';

          if (pageX + el.scrollWidth > innerWidth) {
            el.style.right = '8px';
          } else {
            el.style.left = x;
          }

          if (pageY + el.scrollHeight > innerHeight - 32) {
            el.style.bottom = '48px';
          } else {
            el.style.top = y;
          }
        }];
        const menuView = u(_templateObject2$3 || (_templateObject2$3 = _taggedTemplateLiteral(["\n        <aside class=context-menu \n          role=menu \n          bond=", "\n          contextmenu=", "\n        >\n          <h1>Menu</h1> \n          <hr>\n          <ul>\n            ", "\n          </ul>\n        </aside>\n      "])), bondTasks, e => (
        /* don't trigger within the menu */
        e.preventDefault(), e.stopPropagation()), menuItems.map(_ref => {
          let {
            title,
            func,
            hr
          } = _ref;
          return u(_templateObject3$2 || (_templateObject3$2 = _taggedTemplateLiteral(["\n              ", "\n              <li click=", ">", "</li>\n            "])), hr ? u(_templateObject4$2 || (_templateObject4$2 = _taggedTemplateLiteral(["<hr>"]))) : '', click => func(click, state), title);
        }));
        menuView.to(contextMenu.currentTarget, 'afterEnd');
      }
    };
  }

  function close(state) {
    let delay = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

    if (delay) {
      setTimeout(() => {
        if (state.viewState.contextMenu) {
          state.viewState.contextMenu.remove();
          state.viewState.contextMenu = null;
        }
      }, CLOSE_DELAY);
    } else {
      if (state.viewState.contextMenu) {
        state.viewState.contextMenu.remove();
        state.viewState.contextMenu = null;
      }
    }
  }
  /*function styleContextMenu(el, state) {
    return `
        * .context-menu {
          position: absolute;
          background: whitesmoke;
          box-shadow: 1px 1px 1px 1px grey;
          padding: 0.5em 0;
          min-width: 200px;
          z-index: 10;
        }

        * .context-menu h1 {
          margin: 0;
          font-size: smaller;
        }

        * .context-menu ul {
          margin: 0;
          padding: 0;
          font-size: smaller;
        }

        * .context-menu ul li {
          cursor: default;
        }
        
        * .context-menu li,
        * .context-menu h1 {
          padding: 0 1em;
        }

        * .context-menu ul li:hover {
          background: powderblue;
        }
    `;
  }*/
  // context menu option functions

  /**
    * This code is needed like this
    * so that paste works in mobile (Chrome) and on Desktop (Chrome and Firefox)
    *
  ****/


  function copy(click, state) {
    const contextClick = state.viewState.contextMenuClick;
    const {
      clientX,
      clientY,
      target
    } = contextClick;
    const {
      H
    } = state;
    close(state);

    state.elementInfoContinuation = _ref2 => {
      let {
        innerText,
        noSuchElement
      } = _ref2;

      if (!noSuchElement) {
        state.elementInfoContinuation = null;
        openModal({
          modal: {
            type: 'infobox',
            message: innerText,
            title: 'Text from page:'
          }
        }, state);
      }
    };

    H({
      type: 'getElementInfo',
      synthetic: true,
      data: {
        innerText: true,
        target,
        clientX,
        clientY
      }
    });
  }

  function copyLink(click, state) {
    const contextClick = state.viewState.contextMenuClick;
    const {
      clientX,
      clientY,
      target
    } = contextClick;
    const {
      H
    } = state;
    close(state);

    state.elementInfoContinuation = _ref3 => {
      let {
        attributes,
        noSuchElement
      } = _ref3;

      if (!noSuchElement) {
        state.elementInfoContinuation = null;
        openModal({
          modal: {
            type: 'infobox',
            message: attributes.href,
            title: 'Text from page:'
          }
        }, state);
      }
    };

    H({
      type: 'getElementInfo',
      synthetic: true,
      data: {
        closest: 'a[href]',
        attributes: ['href'],
        target,
        clientX,
        clientY
      }
    });
  }

  function paste(click, state) {
    close(state);
    const pasteData = prompt("Enter text to paste");
    const input = state.viewState.shouldHaveFocus;
    if (!input) return;
    const value = input.value;
    const newValue = value.slice(0, input.selectionStart) + pasteData + value.slice(input.selectionEnd);
    input.value = newValue;
    input.selectionStart = input.selectionEnd;

    if (document.activeElement !== input) {
      input.focus();
    }

    state.H({
      type: 'typing',
      data: pasteData,
      synthetic: true,
      event: {
        paste: true,
        simulated: true
      }
    });
  }

  function download(click, state) {
    close(state);
    const timeNow = new Date();
    const stringTime = timeNow.toJSON();
    const fileName = stringTime.replace(/[-:.]/g, "_");
    const imageData = state.viewState.canvasEl.toDataURL();
    const downloader = document.createElement('a');
    downloader.href = imageData;
    Object.assign(downloader.style, {
      position: 'absolute',
      top: '0px',
      left: '0px',
      opacity: 0
    });
    downloader.download = "".concat(fileName, ".png");
    document.body.appendChild(downloader);
    downloader.click();
    downloader.remove();
  }

  function
    /*click, state*/
  reload() {
    const goButton = document.querySelector('form.url button.go');
    goButton.click();
  }

  function openInNewTab(click, state) {
    const contextClick = state.viewState.contextMenuClick;
    const {
      target,
      pageX,
      pageY,
      clientX,
      clientY
    } = contextClick;
    const {
      H
    } = state;
    state.viewState.killNextMouseReleased = false;

    if (deviceIsMobile()) {
      // we need to get the URL of the target link 
      // then use 
      // state.createTab(click, url);
      state.elementInfoContinuation = _ref4 => {
        let {
          attributes,
          noSuchElement
        } = _ref4;

        if (!noSuchElement) {
          state.elementInfoContinuation = null;
          state.createTab(click, attributes.href);
        }
      };

      H({
        type: 'getElementInfo',
        synthetic: true,
        data: {
          closest: 'a[href]',
          attributes: ['href'],
          target,
          clientX,
          clientY
        }
      });
    } else {
      H({
        type: 'pointerdown',
        button: 0,
        ctrlKey: true,
        target,
        pageX,
        pageY,
        clientX,
        clientY,
        noShot: true
      });
      H({
        type: 'pointerup',
        button: 0,
        ctrlKey: true,
        target,
        pageX,
        pageY,
        clientX,
        clientY
      });
    }

    close(state);
  }

  function newBrowserContextAndTab(click, state) {
    const {
      H
    } = state;
    H({
      synthetic: true,
      type: 'newIncognitoTab',
      data: {}
    });
    close(state);
  }

  function clearHistoryAndCacheLeaveCookies(click, state) {
    const doIt = confirm("You'll stay signed in to most sites, but wipe browsing history and cached files. Are you sure?");

    if (doIt) {
      const {
        H
      } = state;
      H({
        synthetic: true,
        type: "clearAllPageHistory"
      });
      H({
        synthetic: true,
        type: "clearCache"
      });
      alert("Cleared all caches and history.");
    }

    close(state);
  }

  function clearBrowsingData(click, state) {
    const doIt = confirm("This will sign you out of most sites, and wipe all history and caches. Really wipe everything?");

    if (doIt) {
      const {
        H
      } = state;
      H({
        synthetic: true,
        type: "clearAllPageHistory"
      });
      H({
        synthetic: true,
        type: "clearCache"
      });
      H({
        synthetic: true,
        type: "clearCookies"
      });
      alert("Cleared all history, caches and cookies.");
    }

    close(state);
  }

  async function fullScreen(click, state) {
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      if (document.webkitCancelFullscreen) {
        document.webkitCancelFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } else {
      if (document.body.webkitRequestFullscreen) {
        document.body.webkitRequestFullscreen({
          navigationUI: 'hide'
        });
      } else {
        await document.body.requestFullscreen({
          navigationUI: 'hide'
        });
      }
    }

    close(state);
  }

  var Subviews = /*#__PURE__*/Object.freeze({
    __proto__: null,
    Controls: Controls,
    saveClick: saveClick,
    OmniBox: OmniBox,
    focusOmniBox: focusOmniBox,
    TabList: TabList,
    TabSelector: TabSelector,
    FaviconElement: FaviconElement,
    loadings: loadings,
    LoadingIndicator: LoadingIndicator,
    BandwidthIndicator: BandwidthIndicator,
    startBandwidthLoop: startBandwidthLoop,
    PluginsMenuButton: PluginsMenuButton,
    PluginsMenu: PluginsMenu,
    Modals: Modals,
    openModal: openModal,
    PermissionRequest: PermissionRequest,
    ContextMenu: ContextMenu,
    CTX_MENU_THRESHOLD: CTX_MENU_THRESHOLD,
    makeContextMenuHandler: makeContextMenuHandler
  });

  var _templateObject$2, _templateObject2$2, _templateObject3$1, _templateObject4$1, _templateObject5$1, _templateObject6, _templateObject7;

  const BROWSER_SIDE = (() => {
    try {
      return self.DOMParser && true;
    } catch (e) {
      return false;
    }
  })();
  const BuiltIns = [Symbol, Boolean, Number, String, Object, Set, Map, WeakMap, WeakSet, Uint8Array, Uint16Array, Uint32Array, Float32Array, Float64Array, Int8Array, Int16Array, Int32Array, Uint8ClampedArray, ...(BROWSER_SIDE ? [Node, NodeList, Element, HTMLElement, Blob, ArrayBuffer, FileList, Text, HTMLDocument, Document, DocumentFragment, Error, File, Event, EventTarget, URL
  /* eslint-disable no-undef */
  ] : [Buffer])
  /* eslint-enable no-undef */
  ];
  const SEALED_DEFAULT = true;

  const isNone = instance => instance == null || instance == undefined;

  const typeCache = new Map();
  T.def = def;
  T.check = check;
  T.sub = sub;
  T.verify = verify;
  T.validate = validate;
  T.partialMatch = partialMatch;
  T.defEnum = defEnum;
  T.defSub = defSub;
  T.defTuple = defTuple;
  T.defCollection = defCollection;
  T.defOr = defOr;
  T.option = option;
  T.defOption = defOption;
  T.maybe = maybe;
  T.guard = guard;
  T.errors = errors; // debug

  T[Symbol.for('jtype-system.typeCache')] = typeCache;
  defineSpecials();
  mapBuiltins();
  function T(parts) {
    for (var _len = arguments.length, vals = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      vals[_key - 1] = arguments[_key];
    }

    const cooked = vals.reduce((prev, cur, i) => prev + cur + parts[i + 1], parts[0]);
    const typeName = cooked;
    if (!typeCache.has(typeName)) throw new TypeError("Cannot use type ".concat(typeName, " before it is defined."));
    return typeCache.get(typeName).type;
  }

  function partialMatch(type, instance) {
    return validate(type, instance, {
      partial: true
    });
  }

  function validate(type, instance) {
    let {
      partial = false
    } = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    guardType(type);
    guardExists(type);
    const typeName = type.name;
    const {
      spec,
      kind,
      help,
      verify,
      verifiers,
      sealed
    } = typeCache.get(typeName);
    const specKeyPaths = spec ? allKeyPaths(spec).sort() : [];
    const specKeyPathSet = new Set(specKeyPaths);
    const bigErrors = [];

    switch (kind) {
      case "def":
        {
          let allValid = true;

          if (spec) {
            const keyPaths = partial ? allKeyPaths(instance, specKeyPathSet) : specKeyPaths;
            allValid = !isNone(instance) && keyPaths.every(kp => {
              // Allow lookup errors if the type match for the key path can include None
              const {
                resolved,
                errors: lookupErrors
              } = lookup(instance, kp, () => checkTypeMatch(lookup(spec, kp).resolved, T(_templateObject$2 || (_templateObject$2 = _taggedTemplateLiteral(["None"])))));
              bigErrors.push(...lookupErrors);
              if (lookupErrors.length) return false;
              const keyType = lookup(spec, kp).resolved;

              if (!keyType || !(keyType instanceof Type)) {
                bigErrors.push({
                  error: "Key path '".concat(kp, "' is not present in the spec for type '").concat(typeName, "'")
                });
                return false;
              }

              const {
                valid,
                errors: validationErrors
              } = validate(keyType, resolved);
              bigErrors.push(...validationErrors);
              return valid;
            });
          }

          let verified = true;

          if (partial && !spec && !!verify) {
            throw new TypeError("Type checking with option 'partial' is not a valid option for types that" + " only use a verify function but have no spec");
          } else if (verify) {
            try {
              verified = verify(instance);

              if (!verified) {
                if (verifiers) {
                  throw {
                    error: "Type ".concat(typeName, " value '").concat(JSON.stringify(instance), "' violated at least 1 verify function in:\n").concat(verifiers.map(f => '\t' + (f.help || '') + ' (' + f.verify.toString() + ')').join('\n'))
                  };
                } else if (type.isSumType) {
                  throw {
                    error: "Value '".concat(JSON.stringify(instance), "' did not match any of: ").concat([...type.types.keys()].map(t => t.name)),
                    verify,
                    verifiers
                  };
                } else {
                  let helpMsg = '';

                  if (help) {
                    helpMsg = "Help: ".concat(help, ". ");
                  }

                  throw {
                    error: "".concat(helpMsg, "Type ").concat(typeName, " Value '").concat(JSON.stringify(instance), "' violated verify function in: ").concat(verify.toString())
                  };
                }
              }
            } catch (e) {
              bigErrors.push(e);
              verified = false;
            }
          }

          let sealValid = true;

          if (!!sealed && !!spec) {
            const type_key_paths = specKeyPaths;
            const all_key_paths = allKeyPaths(instance, specKeyPathSet).sort();
            sealValid = all_key_paths.join(',') == type_key_paths.join(',');

            if (!sealValid) {
              if (all_key_paths.length < type_key_paths.length) {
                sealValid = true;
              } else {
                const errorKeys = [];
                const tkp = new Set(type_key_paths);

                for (const k of all_key_paths) {
                  if (!tkp.has(k)) {
                    errorKeys.push({
                      error: "Key path '".concat(k, "' is not in the spec for type ").concat(typeName)
                    });
                  }
                }

                if (errorKeys.length) {
                  bigErrors.push(...errorKeys);
                }
              }
            }
          }

          return {
            valid: allValid && verified && sealValid,
            errors: bigErrors,
            partial
          };
        }

      case "defCollection":
        {
          const {
            valid: containerValid,
            errors: containerErrors
          } = validate(spec.container, instance);
          let membersValid = true;
          let verified = true;
          bigErrors.push(...containerErrors);

          if (partial) {
            throw new TypeError("Type checking with option 'partial' is not a valid option for Collection types");
          } else {
            if (containerValid) {
              membersValid = [...instance].every(member => {
                const {
                  valid,
                  errors
                } = validate(spec.member, member);
                bigErrors.push(...errors);
                return valid;
              });
            }

            if (verify) {
              try {
                verified = verify(instance);
              } catch (e) {
                bigErrors.push(e);
                verified = false;
              }
            }
          }

          return {
            valid: containerValid && membersValid && verified,
            errors: bigErrors
          };
        }

      default:
        {
          throw new TypeError("Checking for type kind ".concat(kind, " is not yet implemented."));
        }
    }
  }

  function check() {
    return validate(...arguments).valid;
  }

  function lookup(obj, keyPath, canBeNone) {
    if (isNone(obj)) throw new TypeError("Lookup requires a non-unset object.");
    if (!keyPath) throw new TypeError("keyPath must not be empty");
    const keys = keyPath.split(/\./g);
    const pathComplete = [];
    const errors = [];
    let resolved = obj;

    while (keys.length) {
      const nextKey = keys.shift();
      resolved = resolved[nextKey];
      pathComplete.push(nextKey);

      if (resolved === null || resolved === undefined) {
        if (keys.length) {
          errors.push({
            error: "Lookup on key path '".concat(keyPath, "' failed at '") + pathComplete.join('.') + "' when ".concat(resolved, " was found at '").concat(nextKey, "'.")
          });
        } else if (!!canBeNone && canBeNone()) {
          resolved = undefined;
        } else {
          errors.push({
            error: "Resolution on key path '".concat(keyPath, "' failed") + "when ".concat(resolved, " was found at '").concat(nextKey, "' and the Type of this") + "key's value cannot be None."
          });
        }

        break;
      }
    }

    return {
      resolved,
      errors
    };
  }

  function checkTypeMatch(typeA, typeB) {
    guardType(typeA);
    guardExists(typeA);
    guardType(typeB);
    guardExists(typeB);

    if (typeA === typeB) {
      return true;
    } else if (typeA.isSumType && typeA.types.has(typeB)) {
      return true;
    } else if (typeB.isSumType && typeB.types.has(typeA)) {
      return true;
    } else if (typeA.name.startsWith('?') && typeB == T(_templateObject2$2 || (_templateObject2$2 = _taggedTemplateLiteral(["None"])))) {
      return true;
    } else if (typeB.name.startsWith('?') && typeA == T(_templateObject3$1 || (_templateObject3$1 = _taggedTemplateLiteral(["None"])))) {
      return true;
    }

    if (typeA.name.startsWith('>') || typeB.name.startsWith('>')) {
      console.error(new Error("Check type match has not been implemented for derived//sub types yet."));
    }

    return false;
  }

  function option(type) {
    return T(_templateObject4$1 || (_templateObject4$1 = _taggedTemplateLiteral(["?", ""])), type.name);
  }

  function sub(type) {
    return T(_templateObject5$1 || (_templateObject5$1 = _taggedTemplateLiteral([">", ""])), type.name);
  }

  function defSub(type, spec) {
    let {
      verify = undefined,
      help = ''
    } = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    let name = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : '';
    guardType(type);
    guardExists(type);
    let verifiers;

    if (!verify) {
      verify = () => true;
    }

    if (type.native) {
      verifiers = [{
        help,
        verify
      }];

      verify = i => i instanceof type.native;

      const helpMsg = "Needs to be of type ".concat(type.native.name, ". ").concat(help || '');
      verifiers.push({
        help: helpMsg,
        verify
      });
    }

    const newType = def("".concat(name, ">").concat(type.name), spec, {
      verify,
      help,
      verifiers
    });
    return newType;
  }

  function defEnum(name) {
    if (!name) throw new TypeError("Type must be named.");
    guardRedefinition(name);

    for (var _len2 = arguments.length, values = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
      values[_key2 - 1] = arguments[_key2];
    }

    const valueSet = new Set(values);

    const verify = i => valueSet.has(i);

    const help = "Value of Enum type ".concat(name, " must be one of ").concat(values.join(','));
    return def(name, null, {
      verify,
      help
    });
  }

  function exists(name) {
    return typeCache.has(name);
  }

  function guardRedefinition(name) {
    if (exists(name)) throw new TypeError("Type ".concat(name, " cannot be redefined."));
  }

  function allKeyPaths(o, specKeyPaths) {
    const isTypeSpec = !specKeyPaths;
    const keyPaths = new Set();
    return recurseObject(o, keyPaths, '');

    function recurseObject(o, keyPathSet) {
      let lastLevel = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';
      const levelKeys = Object.getOwnPropertyNames(o);
      const keyPaths = levelKeys.map(k => lastLevel + (lastLevel.length ? '.' : '') + k);
      levelKeys.forEach((k, i) => {
        const v = o[k];

        if (isTypeSpec) {
          if (v instanceof Type) {
            keyPathSet.add(keyPaths[i]);
          } else if (typeof v == "object") {
            if (!Array.isArray(v)) {
              recurseObject(v, keyPathSet, keyPaths[i]);
            } else {
              throw new TypeError("We don't support Types that use Arrays as structure, just yet.");
            }
          } else {
            throw new TypeError("Spec cannot contain leaf values that are not valid Types");
          }
        } else {
          if (specKeyPaths.has(keyPaths[i])) {
            keyPathSet.add(keyPaths[i]);
          } else if (typeof v == "object") {
            if (!Array.isArray(v)) {
              recurseObject(v, keyPathSet, keyPaths[i]);
            } else {
              v.forEach((item, index) => recurseObject(item, keyPathSet, keyPaths[i] + '.' + index)); //throw new TypeError(`We don't support Instances that use Arrays as structure, just yet.`); 
            }
          } else {
            //console.warn("Spec has no such key",  keyPaths[i]);
            keyPathSet.add(keyPaths[i]);
          }
        }
      });
      return [...keyPathSet];
    }
  }

  function defOption(type) {
    guardType(type);
    const typeName = type.name;
    return T.def("?".concat(typeName), null, {
      verify: i => isUnset(i) || T.check(type, i)
    });
  }

  function maybe(type) {
    try {
      return defOption(type);
    } catch (e) {// console.log(`Option Type ${type.name} already declared.`, e);
    }

    return T(_templateObject6 || (_templateObject6 = _taggedTemplateLiteral(["?", ""])), type.name);
  }

  function verify() {
    return check(...arguments);
  }

  function defCollection(name, _ref) {
    let {
      container,
      member
    } = _ref;
    let {
      sealed = SEALED_DEFAULT,
      verify = undefined
    } = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    if (!name) throw new TypeError("Type must be named.");
    if (!container || !member) throw new TypeError("Type must be specified.");
    guardRedefinition(name);
    const kind = 'defCollection';
    const t = new Type(name);
    const spec = {
      kind,
      spec: {
        container,
        member
      },
      verify,
      sealed,
      type: t
    };
    typeCache.set(name, spec);
    return t;
  }

  function defTuple(name, _ref2) {
    let {
      pattern
    } = _ref2;
    if (!name) throw new TypeError("Type must be named.");
    if (!pattern) throw new TypeError("Type must be specified.");
    const kind = 'def';
    const specObj = {};
    pattern.forEach((type, key) => specObj[key] = type);
    const t = new Type(name);
    const spec = {
      kind,
      spec: specObj,
      type: t
    };
    typeCache.set(name, spec);
    return t;
  }

  function Type(name) {
    let mods = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    if (!new.target) throw new TypeError("Type with new only.");
    Object.defineProperty(this, 'name', {
      get: () => name
    });
    this.typeName = name;

    if (mods.types) {
      const {
        types
      } = mods;
      const typeSet = new Set(types);
      Object.defineProperty(this, 'isSumType', {
        get: () => true
      });
      Object.defineProperty(this, 'types', {
        get: () => typeSet
      });
    }

    if (mods.native) {
      const {
        native
      } = mods;
      Object.defineProperty(this, 'native', {
        get: () => native
      });
    }
  }

  Type.prototype.toString = function () {
    return "".concat(this.typeName, " Type");
  };

  function def(name, spec) {
    let {
      help = '',
      verify = undefined,
      sealed = undefined,
      types = undefined,
      verifiers = undefined,
      native = undefined
    } = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    if (!name) throw new TypeError("Type must be named.");
    guardRedefinition(name);

    if (name.startsWith('?')) {
      if (spec) {
        throw new TypeError("Option type can not have a spec.");
      }

      if (!verify(null)) {
        throw new TypeError("Option type must be OK to be unset.");
      }
    }

    const kind = 'def';

    if (sealed === undefined) {
      sealed = true;
    }

    const t = new Type(name, {
      types,
      native
    });
    const cache = {
      spec,
      kind,
      help,
      verify,
      verifiers,
      sealed,
      types,
      native,
      type: t
    };
    typeCache.set(name, cache);
    return t;
  }

  function defOr(name) {
    for (var _len3 = arguments.length, types = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
      types[_key3 - 1] = arguments[_key3];
    }

    return T.def(name, null, {
      types,
      verify: i => types.some(t => check(t, i))
    });
  }

  function guard(type, instance) {
    guardType(type);
    guardExists(type);
    const {
      valid,
      errors
    } = validate(type, instance);
    if (!valid) throw new TypeError("Type ".concat(type, " requested, but item is not of that type: ").concat(errors.join(', ')));
  }

  function guardType(t) {
    //console.log(t);
    if (!(t instanceof Type)) throw new TypeError("Type must be a valid Type object.");
  }

  function guardExists(t) {
    const name = originalName(t);
    if (!exists(name)) throw new TypeError("Type must exist. Type ".concat(name, " has not been defined."));
  }

  function errors() {
    return validate(...arguments).errors;
  }

  function mapBuiltins() {
    BuiltIns.forEach(t => def(originalName(t), null, {
      native: t,
      verify: i => originalName(i.constructor) === originalName(t)
    }));
    BuiltIns.forEach(t => defSub(T(_templateObject7 || (_templateObject7 = _taggedTemplateLiteral(["", ""])), originalName(t))));
  }

  function defineSpecials() {
    T.def("Any", null, {
      verify: () => true
    });
    T.def("Some", null, {
      verify: i => !isUnset(i)
    });
    T.def("None", null, {
      verify: i => isUnset(i)
    });
    T.def("Function", null, {
      verify: i => i instanceof Function
    });
    T.def("Integer", null, {
      verify: i => Number.isInteger(i)
    });
    T.def("Array", null, {
      verify: i => Array.isArray(i)
    });
    T.def("Iterable", null, {
      verify: i => i[Symbol.iterator] instanceof Function
    });
  }

  function isUnset(i) {
    return i === null || i === undefined;
  }

  function originalName(t) {
    if (!!t && t.name) {
      return t.name;
    }

    const oName = Object.prototype.toString.call(t).replace(/\[object |\]/g, '');

    if (oName.endsWith('Constructor')) {
      return oName.replace(/Constructor$/, '');
    }

    return oName;
  }

  var _templateObject$1, _templateObject2$1;

  const FULL_LABEL = 'c3s-unique-';
  const LABEL_LEN = 3;
  const LABEL = FULL_LABEL.slice(0, LABEL_LEN);
  const PREFIX_LEN = 10 + LABEL_LEN;
  const PREFIX_BASE = 36; //const sleep = ms => new Promise(res => setTimeout(res, ms));
  T.defCollection("Prefix", {
    container: T(_templateObject$1 || (_templateObject$1 = _taggedTemplateLiteral(["Array"]))),
    member: T(_templateObject2$1 || (_templateObject2$1 = _taggedTemplateLiteral(["String"])))
  }, {
    verify: i => i.length > 0
  });
  let counter = 1;
  function generateUniquePrefix() {
    counter += 3;
    const number = counter * Math.random() * performance.now() * +new Date();
    const prefixString = (LABEL + number.toString(PREFIX_BASE).replace(/\./, '')).slice(0, PREFIX_LEN);
    return {
      prefix: [prefixString]
    };
  }
  function prefixAllRules(ss, prefix) {
    let combinator = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : ' ';
    let lastRuleIndex = ss.cssRules.length - 1;
    let i = lastRuleIndex;

    while (i >= 0) {
      lastRuleIndex = ss.cssRules.length - 1;
      const lastRule = ss.cssRules[lastRuleIndex];

      if (!lastRule) {
        console.warn("No such last rule", lastRuleIndex);
        continue;
      }

      if (lastRule.type == CSSRule.STYLE_RULE) {
        prefixStyleRule(lastRule, ss, lastRuleIndex, prefix, combinator);
      } else if (lastRule.type == CSSRule.MEDIA_RULE) {
        const rules = Array.from(lastRule.cssRules);
        const lastIndex = rules.length - 1;

        for (const rule of rules) {
          prefixStyleRule(rule, lastRule, lastIndex, prefix, combinator);
        }

        ss.deleteRule(lastRuleIndex);

        try {
          let index = 0;

          if (ss.cssRules.length && ss.cssRules[0].type == CSSRule.NAMESPACE_RULE) {
            index = 1;
          }

          ss.insertRule(lastRule.cssText, index);
        } catch (e) {
          console.log(e, lastRule.cssText, lastRule, ss); //throw e;
        }
      } else {
        ss.deleteRule(lastRuleIndex);
        let index = 0;

        if (ss.cssRules.length && ss.cssRules[0].type == CSSRule.NAMESPACE_RULE) {
          index = 1;
        }

        ss.insertRule(lastRule.cssText, index);
      }

      i--;
    }
  }

  function prefixStyleRule(lastRule, ss, lastRuleIndex, prefix, combinator) {
    let newRuleText = lastRule.cssText;
    const {
      selectorText
    } = lastRule;
    const selectors = selectorText.split(/\s*,\s*/g);
    const modifiedSelectors = selectors.map(sel => {
      // we also need to insert prefix BEFORE any descendent combinators
      const firstDescendentIndex = sel.indexOf(' ');

      if (firstDescendentIndex > -1) {
        const firstSel = sel.slice(0, firstDescendentIndex);
        const restSel = sel.slice(firstDescendentIndex); // we also need to insert prefix BEFORE any pseudo selectors 
        // NOTE: the following indexOf test will BREAK if selector contains a :
        // such as [ns\\:name="scoped-name"]

        const firstPseudoIndex = firstSel.indexOf(':');

        if (firstPseudoIndex > -1) {
          const [pre, post] = [firstSel.slice(0, firstPseudoIndex), firstSel.slice(firstPseudoIndex)];
          return "".concat(pre).concat(prefix).concat(post).concat(restSel) + (combinator == '' ? '' : ", ".concat(prefix).concat(combinator).concat(sel));
        } else return "".concat(firstSel).concat(prefix).concat(restSel) + (combinator == '' ? '' : ", ".concat(prefix).concat(combinator).concat(sel));
      } else {
        const firstPseudoIndex = sel.indexOf(':');

        if (firstPseudoIndex > -1) {
          const [pre, post] = [sel.slice(0, firstPseudoIndex), sel.slice(firstPseudoIndex)];
          return "".concat(pre).concat(prefix).concat(post) + (combinator == '' ? '' : ", ".concat(prefix).concat(combinator).concat(sel));
        } else return "".concat(sel).concat(prefix) + (combinator == '' ? '' : ", ".concat(prefix).concat(combinator).concat(sel));
      }
    });
    const ruleBlock = newRuleText.slice(newRuleText.indexOf('{'));
    const newRuleSelectorText = modifiedSelectors.join(', ');
    newRuleText = "".concat(newRuleSelectorText, " ").concat(ruleBlock);
    ss.deleteRule(lastRuleIndex);

    try {
      let index = 0;

      if (ss.cssRules.length && ss.cssRules[0].type == CSSRule.NAMESPACE_RULE) {
        index = 1;
      }

      ss.insertRule(newRuleText, index);
    } catch (e) {
      console.log(e, newRuleText, selectorText, lastRuleIndex, ss); //throw e;
    }
  }

  const InsertListeners = [];
  const RemovedListeners = [];
  const inserted = new Set();
  const removed = new Set();
  let monitoring = false;
  function addInsertListener(listener) {
    if (inserted.has(listener)) return;
    InsertListeners.push(listener);
    inserted.add(listener);
  }
  function addRemovedListener(listener) {
    if (removed.has(listener)) return;
    RemovedListeners.push(listener);
    removed.add(listener);
  }
  function monitorChanges() {
    if (monitoring) return; // demo of watching for any new nodes that declare stylists

    const mo = new MutationObserver(mutations => {
      let AddedElements = [];
      let RemovedElements = [];

      for (const mutation of mutations) {
        const addedElements = Array.from(mutation.addedNodes);
        const removedElements = Array.from(mutation.removedNodes);
        addedElements.forEach(el => {
          if (!(el instanceof HTMLElement)) return;

          if (el.matches('[stylist]')) {
            AddedElements.push(el);
          }

          AddedElements.push(...el.querySelectorAll('[stylist]'));
        });
        removedElements.forEach(el => {
          if (!(el instanceof HTMLElement)) return;

          if (el.matches('[stylist]')) {
            RemovedElements.push(el);
          }

          RemovedElements.push(...el.querySelectorAll('[stylist]'));
        });
      }

      const AddedSet = new Set(AddedElements);
      const FilterOut = new Set();
      RemovedElements.forEach(el => AddedSet.has(el) && FilterOut.add(el));
      AddedElements = AddedElements.filter(el => !FilterOut.has(el));
      RemovedElements = RemovedElements.filter(el => !FilterOut.has(el));

      if (RemovedElements.length) {
        for (const listener of RemovedListeners) {
          try {
            listener(...RemovedElements);
          } catch (e) {
            console.warn("Removed listener error", e, listener);
          }
        }
      }

      if (AddedElements.length) {
        for (const listener of InsertListeners) {
          try {
            listener(...AddedElements);
          } catch (e) {
            console.warn("Insert listener error", e, listener);
          }
        }
      }
    });
    mo.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
    monitoring = true;
  }

  const stylistFunctions = new Map();
  const mappings = new Map();
  const memory = {
    state: {}
  };
  let initialized = false;
  function setState(newState) {
    const clonedState = clone(newState);
    Object.assign(memory.state, clonedState);
  }
  function restyleElement(el) {
    if (!el) return;
    el.classList.forEach(className => className.startsWith('c3s') && restyleClass(className));
  }
  function restyleClass(className) {
    const {
      element,
      stylist
    } = mappings.get(className);
    associate(className, element, stylist, memory.state);
  }
  function restyleAll() {
    mappings.forEach((_ref, className) => {
      let {
        element,
        stylist
      } = _ref;
      associate(className, element, stylist, memory.state);
    });
  }
  function initializeDSS(state, functionsObject) {
    setState(state);
    /** 
      to REALLY prevent FOUC put this style tag BEFORE any DSS-styled markup
      and before any scripts that add markup, 
      and before the initializeDSS call
    **/

    if (!document.querySelector('[data-role="prevent-fouc"]')) {
      document.head.insertAdjacentHTML('beforeend', "\n      <style data-role=\"prevent-fouc\">\n        [stylist]:not([associated]) {\n          display: none !important;\n        }\n      </style>\n    ");
    }

    addMoreStylistFunctions(functionsObject);
    addInsertListener(associateStylistFunctions);
    addRemovedListener(unassociateStylistFunctions);
    monitorChanges();

    if (!initialized) {
      const initialEls = Array.from(document.querySelectorAll('[stylist]'));
      associateStylistFunctions(...initialEls);
      initialized = true;
    }

    return;

    function associateStylistFunctions() {
      for (var _len = arguments.length, els = new Array(_len), _key = 0; _key < _len; _key++) {
        els[_key] = arguments[_key];
      }

      els = els.filter(el => el.hasAttribute('stylist'));
      if (els.length == 0) return;

      for (const el of els) {
        const stylistNames = (el.getAttribute('stylist') || '').split(/\s+/g);

        for (const stylistName of stylistNames) {
          const stylist = stylistFunctions.get(stylistName);
          if (!stylist) throw new TypeError("Stylist named by ".concat(stylistName, " is unknown."));
          const className = randomClass();
          el.classList.add(className);
          associate(className, el, stylist, state);
        }
      }
    }
  } // an object whose properties are functions that are stylist functions

  function addMoreStylistFunctions(functionsObject) {
    const toRegister = [];

    for (const funcName of Object.keys(functionsObject)) {
      const value = functionsObject[funcName];
      if (typeof value !== "function") throw new TypeError("Functions object must only contain functions."); // this prevents a bug where we miss an existing style element in 
      // a check for a style element based on the stylist.name property

      if (value.name !== funcName) throw new TypeError("Stylist function must be actual function named ".concat(funcName, " (it was ").concat(value.name, ")")); // don't overwrite exisiting names

      if (!stylistFunctions.has(funcName)) {
        toRegister.push(() => stylistFunctions.set(funcName, value));
      }
    }

    while (toRegister.length) toRegister.pop()();
  }

  function randomClass() {
    const {
      prefix: [className]
    } = generateUniquePrefix();
    return className;
  }

  function associate(className, element, stylist, state) {
    const styleText = stylist(element, state) || '';
    let styleElement = document.head.querySelector("style[data-prefix=\"".concat(className, "\"]"));
    let changes = false;
    let prefixed = true;
    let prefixedStyleText;

    if (!mappings.has(className)) {
      mappings.set(className, {
        element,
        stylist
      });
    }

    if (!styleElement) {
      prefixed = false;
      const styleMarkup = "\n      <style data-stylist=\"".concat(stylist.name, "\" data-prefix=\"").concat(className, "\">\n        ").concat(styleText, "\n      </style>\n    ");
      document.head.insertAdjacentHTML('beforeend', styleMarkup);
      styleElement = document.head.querySelector("style[data-prefix=\"".concat(className, "\"]"));
    } else {
      if (styleElement instanceof HTMLStyleElement) {
        prefixedStyleText = Array.from(styleElement.sheet.cssRules).filter(rule => !rule.parentRule).map(rule => rule.cssText).join('\n');
      }
    } // I don't know why this has to happen, but it does


    if (styleElement.innerHTML != styleText) {
      styleElement.innerHTML = styleText;
      changes = true;
    } // only prefix if we have not already


    if (!prefixed || changes) {
      if (styleElement instanceof HTMLStyleElement) {
        const styleSheet = styleElement.sheet;
        prefixAllRules(styleSheet, "." + className, '');
        element.setAttribute('associated', 'true');
        prefixedStyleText = Array.from(styleSheet.cssRules).filter(rule => !rule.parentRule).map(rule => rule.cssText).join('\n');
        styleElement.innerHTML = prefixedStyleText;
      }
    }
  }

  function disassociate(className, element) {
    const styleSheet = document.querySelector("style[data-prefix=\"".concat(className, "\"]"));
    mappings.delete(className);

    if (styleSheet) {
      element.classList.remove(className);
      styleSheet.remove();
    }
  }

  function unassociateStylistFunctions() {
    for (var _len2 = arguments.length, els = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      els[_key2] = arguments[_key2];
    }

    els = els.filter(el => el.hasAttribute('stylist'));
    if (els.length == 0) return;

    for (const el of els) {
      el.classList.forEach(className => className.startsWith('c3s') && disassociate(className, el));
    }
  }

  function clone(o) {
    return JSON.parse(JSON.stringify(o));
  }

  const stylists = {
    styleDocument,
    styleVoodooMain,
    styleTabSelector,
    styleTabList,
    styleNavControl,
    styleOmniBox,
    styleURLForm,
    stylePluginsMenu,
    stylePluginsMenuButton,
    styleLoadingIndicator,
    styleHistoryForm,
    styleBandwidthIndicator,
    styleTabViewport,
    styleSelectInput,
    styleModals,
    styleContextMenu
  };
  const dss = {
    restyleAll,
    restyleElement,
    initializeDSS,
    setState
  }; // stylists

  function
    /*el, state*/
  styleDocument() {
    return "\n      :root {\n        height: 100%;\n        display: flex;\n      }\n\n      :root body {\n        width: 100%;\n        max-height: 100%;\n        box-sizing: border-box;\n        margin: 0;\n      }\n\n      nav input[type=\"text\"], nav input[type=\"url\"], \n      nav input[type=\"search\"], nav input:not([type]), \n      nav button {\n        -webkit-appearance: none;\n        -moz-appearance: none;\n        appearance: none;\n      }\n\n      :root .debugBox,\n      :root #debugBox {\n        display: ".concat('none', ";\n      }\n\n      :root input, :root button, :root select, :root textarea, :root [contenteditable] {\n        font-family: system-ui, Arial, Helvetica, sans-serif, monospace, system;\n      }\n    ");
  }

  function styleVoodooMain(el, state) {
    return "\n      main.voodoo {\n        position: relative;\n        display: grid;\n        grid-template-areas:\n          \"targets targets targets targets targets\"\n          \"bandwidth history url url plugins-menu-button\"\n          \"viewport viewport viewport viewport viewport\";\n        grid-template-rows: auto 3rem 1fr;\n        grid-template-columns: auto auto 1fr auto auto;\n        height: 100%;\n        width: 100%;\n        overflow: hidden;\n        transition: all 0.3s ease;\n        background: snow;\n        min-height: ".concat(window.innerHeight - 4, "px;\n      }\n\n      @media screen and (max-width: 600px) {\n        main.voodoo {\n          grid-template-areas:\n            \"targets targets targets targets\"\n            \"url url url url\"\n            \"viewport viewport viewport viewport\"\n            \"bandwidth history history plugins-menu-button\";\n          grid-template-rows: auto 3rem 1fr 3rem;\n          grid-template-columns: 1fr 1fr 1fr 1fr;\n        }\n\n        nav.controls.aux {\n          display: flex; \n          justify-content: center;\n        }\n      }\n\n      ").concat(state.pluginsMenuActive ? "\n          main.voodoo {\n            transform: scale(0.75);\n            filter: blur(8px);\n            opacity: 0.8;\n          }\n        " : '', "\n    ");
  }

  function
    /*el, state*/
  styleTabList() {
    return "\n      nav ul {\n      }\n\n      nav ul li {\n        display: inline-block;\n        border-top-left-radius: 0.35rem;\n        border-top-right-radius: 0.35rem;\n        overflow: hidden;\n      }\n\n      nav ul li:not(.new):not(.active)::after {\n        content: \" \";\n        border-right: thin solid;\n        display: inline-block;\n        position: absolute;\n        height: 1.25rem;\n        top: 0.38rem;\n        right: 0;\n      }\n\n      nav.targets {\n        position: relative;\n        overflow: auto hidden;\n        background: var(--lightgrey);\n      }\n\n      nav.targets::-webkit-scrollbar {\n        display: none;\n      }\n\n      nav.targets ul {\n        overflow: none;\n        display: flex;\n        flex-wrap: nowrap;\n        min-width: 100%;\n      }\n    ";
  }

  function
    /*el, state*/
  styleTabSelector() {
    return "\n      li.tab-selector {\n        display: inline-flex;\n        align-items: center;\n        box-sizing: border-box;\n        max-width: 11rem;\n        word-break: break-word;\n        min-width: 100px;\n        position: relative;\n        height: 2rem;\n        background: transparent;\n        background: rgba(200,210,220,0.6);\n        padding-left: 0.5rem;\n      }\n      \n      li.tab-selector img.favicon {\n        flex: 0 0;\n        width: 20px;\n        height: 20px;\n        pointer-events: none;\n      }\n\n      li.tab-selector:not(.active) {\n        opacity: 0.8;\n      }\n\n      li.tab-selector:not(.active):hover {\n        opacity: 0.9;\n        background: var(--white);\n      }\n\n      li.tab-selector.active {\n        background: var(--white);\n      }\n\n      li.tab-selector button.close {\n        position: absolute;\n        right: 0.25rem;\n        top: 0.25rem;\n        height: 1.5rem;\n        width: 1.5rem;\n        z-index:2;\n        text-align: center;\n        padding: 0;\n        background-image: url(./voodoo/asset-imports/nhsuk-icons/icon-close.svg);\n        background-size: 61.8% 61.8%;\n      }\n\n      li.tab-selector button.close:hover,\n      li.tab-selector button.close:active {\n      }\n\n      li.tab-selector:not(.active):hover,\n      li.tab-selector:not(.active) a:focus {\n      }\n\n      li.tab-selector a {\n        cursor: default;\n        display: inline-block;\n        box-sizing: border-box;\n        width: 100%;\n        height: 100%;\n        overflow: hidden;\n        text-decoration: none;\n        vertical-align: middle;\n        line-height: 2rem;\n        white-space: nowrap;\n        text-overflow: ellipsis;\n        font-size: 0.85rem;\n        padding-left: 0.35rem;\n        padding-right: 1.65rem;\n        outline: none;\n        border-color: transparent;\n      }\n\n      li.new {\n        flex-shrink: 0;\n        min-width: unset;\n        border-top-left-radius: 0.35rem;\n        border-top-right-radius: 0.35rem;\n        overflow: hidden;\n        margin: 0 0.35rem;\n      }\n\n      li.new button.new {\n        display: inline-block;\n        border-radius: 2rem;\n        width: 1.7rem;\n        height: 1.7rem;\n        min-width: unset;\n        background-image: url(./voodoo/asset-imports/nhsuk-icons/icon-plus.svg);\n        background-size: 20px 20px;\n        outline: none;\n        border-color: transparent;\n      }\n\n      li.new button:hover, li.new button:active, li.new button:focus {\n      }\n    ";
  }

  function
    /*el, state*/
  styleNavControl() {
    return "\n      @media screen and (max-width: 600px) {\n        nav.aux {\n          display: flex; \n          justify-content: center;\n        }\n      }\n\n      nav {\n        position: relative;\n        display: inline-flex;\n        flex-basis: 2em;\n        min-height: 2em;\n        line-height: 2em;\n        background: transparent;\n      }\n      \n      nav:not(.targets) {\n        padding: 0.35rem 0;\n      }\n\n      nav button {\n        -webkit-user-select: none;\n        -moz-user-select: none;\n        user-select: none;\n        -webkit-touch-callout: none;\n        background-color: transparent;\n      }\n\n      nav.other {\n        display: none;\n      }\n\n      nav.keyinput {\n        grid-area: keyinput;\n        position: absolute;\n      }\n\n      nav.loading {\n        grid-area: loading;\n      }\n\n      nav.targets {\n        grid-area: targets; \n      }\n      \n      nav.url {\n        grid-area: url;\n      }\n\n      nav.history {\n        grid-area: history;\n      }\n\n      nav form {\n        display: flex;\n      }\n\n      ".concat(isSafari() && !DEBUG.dev ? "nav button, nav input {\n          -webkit-appearance: none;\n          -moz-appearance: none;\n          appearance: none;\n          border: 0;\n          box-sizing: border-box;\n          position: relative;\n          top: -2px;\n        }\n        \n        nav button:active {\n          background: linear-gradient( to top, var(--white), var(--silver) );\n        }\n\n        nav button {\n          background: linear-gradient( to bottom, var(--white), var(--silver) );\n        }" : '', "\n\n      nav form * {\n      }\n\n      nav aside.menu.disabled {\n        display: none;\n      }\n\n      nav form.kbd-input {\n        position: fixed;\n        top: -5rem;\n        left: -15rem;\n        z-index: 999999;\n      }\n\n      nav form.kbd-input input,\n      nav form.kbd-input textarea {\n        color: transparent;\n        background: transparent;\n        border-color: transparent;\n        box-shadow: none;\n        pointer-events: none;\n      }\n    ");
  }

  function
    /*el, state*/
  styleOmniBox() {
    return "\n      input:not(:focus), input[disabled] {\n        background: var(--verylightgrey);\n      }\n\n      input:not(:focus):not([disabled]) {\n        opacity: 0.7;\n      }\n\n      input:not(:focus):not([disabled]):hover {\n        opacity: 0.9;\n      }\n\n      input:focus {\n        outline: medium solid dodgerblue;\n      }\n      \n      ".concat(isSafari() ? "\n          input {\n            -webkit-appearance: none;\n          }\n        " : '', "\n    ");
  }

  function
    /*el, state*/
  styleHistoryForm() {
    return "\n      form button.back {\n        background-image: url(./voodoo/asset-imports/nhsuk-icons/icon-chevron-left.svg);\n      }\n\n      form button.forward {\n        background-image: url(./voodoo/asset-imports/nhsuk-icons/icon-chevron-right.svg);\n      }\n    ";
  }

  function
    /*el, state*/
  styleURLForm() {
    return "\n      form {\n        position: relative;\n        display: flex;\n        flex: 1;\n      }\n\n      form input {\n        width: 100%;\n        outline: none;\n        padding: 0 0.5rem 0 0.35rem;\n      }\n\n      form.url input:focus {\n      }\n\n      form.url input[disabled] {\n        background: transparent;\n      }\n\n      form button.go {\n        background-image: url(./voodoo/asset-imports/nhsuk-icons/icon-arrow-right-circle.svg);\n        background-size: 20px 20px;\n      }\n    ";
  }

  function stylePluginsMenu(el, state) {
    return "\n      nav.plugins-menu {\n        position: absolute;\n        top: 0;\n        left: 0;\n        right: 0;\n        bottom: 0;\n        z-index: 10000;\n        display: ".concat(state.pluginsMenuActive ? 'block' : 'none', ";\n        box-sizing: border-box;\n        max-height: 100vh;\n        overflow: hidden;\n      }\n\n      nav > aside {\n        scroll-behaviour: smooth;\n        box-sizing: border-box;\n        max-height: 100vh;\n        overflow: auto;\n        padding-bottom: 10rem;\n      }\n\n      nav > aside > article {\n        padding: 2rem 2rem 5rem;\n        background: rgba(225,220,220,0.3);\n      }\n\n      nav > aside > header {\n        position: sticky;\n        position: -webkit-sticky;\n        top: 0;\n        background: grey;\n        box-shadow: 0 1px 1px 0 grey;\n      }\n\n      nav.plugins-menu h1.spread {\n        display: flex;\n        justify-content: space-between;\n        align-items: center;\n        padding: 0 0.5rem 0 1rem;\n      }\n\n      nav article {\n        max-width: 70ch;\n        margin: 0 auto;\n      }\n\n      nav ul {\n        list-style-position: inside;\n      }\n\n      nav h1 {\n        margin: 0;\n      }\n\n      nav li dl {\n        display: inline-block;\n        margin: 0;\n        vertical-align: top;\n        max-width: 85%;\n      }\n\n      nav dt h1 {\n        display: inline;\n      }\n\n      nav details:not([open]) {\n        display: inline;\n      }\n\n      nav button {\n        background: var(--silver);\n      }\n    ");
  }

  function
    /*el, state*/
  stylePluginsMenuButton() {
    return "\n      nav.plugins-menu-button {\n        grid-area: plugins-menu-button;\n        position: relative;\n        display: inline-flex;\n      }\n\n      nav button {\n        font-weight: bold;\n      }\n\n      nav ul.options {\n        list-style-type: none;\n        padding: 0;\n        margin: 0;\n        display: none;\n      }\n\n      nav ul.options li {\n        -webkit-appearance: button;\n        -moz-appearance: button;\n        appearance: button;\n      }\n\n      nav ul.options.open {\n        display: table;\n        min-width: 10rem;\n        z-index: 2;\n        right: 0;\n        top: 100%;\n        transform: translate(0, 0);\n      }\n\n      @media screen and (max-width: 600px) {\n        nav ul.options.open {\n          top: 0;\n          transform: translate(0, -100%);\n        }\n      }\n    ";
  }
  /*function styleOldPluginsMenu(el, state) {
    return `
      nav.plugins-menu {
        grid-area: plugins-menu;
        position: relative;
      }
       nav button {
        background: var(--silver);
      }
      
      nav ul.options {
        list-style-type: none;
        padding: 0;
        margin: 0;
        display: none;
      }
       nav ul.options li {
        -webkit-appearance: button;
        -moz-appearance: button;
        appearance: button;
      }
       nav ul.options.open {
        display: table;
        min-width: 10rem;
        z-index: 2;
        right: 0;
        top: 100%;
        transform: translate(0, 0);
      }
       @media screen and (max-width: 600px) {
        nav ul.options.open {
          top: 0;
          transform: translate(0, -100%);
        }
      }
    `;
  }*/


  function
    /*el, state*/
  styleBandwidthIndicator() {
    return "\n      aside.bandwidth-indicator {\n        grid-area: bandwidth;\n        font-size: smaller;\n        pointer-events: none;\n        margin: 0.25rem 0;\n        width: 18ch;\n        max-height: 2.5rem;\n        overflow: hidden;\n        color: var(--grey);\n        background: transparent;\n        white-space: nowrap;\n      }\n\n      aside section.measure {\n\n      }\n\n      @media screen and (max-width: 600px) {\n        aside.bandwidth-indicator {\n          align-items: flex-start;\n          max-width: 25vw;\n          width: auto;\n        }\n      }\n    ";
  }

  function
    /*el, state*/
  styleLoadingIndicator() {
    return "\n      aside.loading-indicator {\n        grid-area: pending;\n        position: absolute;\n        pointer-events: none;\n        height: 0.33rem;\n        min-height: 5.333px;\n        width: 100%;\n        pointer-events: none;\n        z-index: 2;\n        overflow: hidden;\n        top: -1px;\n      }\n\n      aside.loading-indicator progress {\n        display: inline;\n        -webkit-appearance: none;\n        -moz-appearance: none;\n        appearance: none;\n        width: 100%;\n        height: 100%;\n      }\n\n      aside.loading-indicator progress[hidden] {\n        display: none;\n      }\n\n      aside.loading-indicator progress::-webkit-progress-bar {\n        background: silver;\n      }\n\n      aside.loading-indicator progress::-webkit-progress-value {\n        background: dodgerblue;\n      }\n    ";
  }

  function
    /*el, state*/
  styleTabViewport() {
    return "\n      article.tab-viewport {\n        grid-area: viewport;\n        display: flex;\n        flex-direction: column;\n        flex-grow: 1;\n        -webkit-overflow-scrolling: touch;\n        overflow: auto;\n        border-top: thin solid gainsboro;\n        border-bottom: thin solid gainsboro;\n      }\n\n      article.tab-viewport canvas,\n      article.tab-viewport iframe {\n        position: relative;\n        display: block;\n        width: 100%;\n        height: 100%;\n        flex-grow: 1;\n        box-sizing: border-box;\n      }\n\n      article.tab-viewport iframe {\n        border: 0;\n        outline: 0;\n      }\n\n      * canvas {\n        image-rendering: high-quality;\n        -webkit-user-select: none;\n        -moz-user-select: none;\n        user-select: none;\n        -webkit-touch-callout: none;\n      }\n    ";
  }

  function
    /*el, state*/
  styleSelectInput() {
    return "\n      #selectinput {\n        position: absolute;\n        left: 50%;\n        top: 30%;\n        transform: translate(-50%,-50%);\n        display: none;\n        font-size: 2em;\n      }\n\n      #selectinput.open {\n        display: inline;\n        max-width: 90vw;\n      }\n    ";
  }

  function
    /*el, state*/
  styleModals() {
    return "\n      aside {\n        position: absolute;\n        display: flex;\n        top: 0;\n        left: 0;\n        width: 100vw;\n        height: 100vh;\n        z-index: 5;\n        align-items: flex-start;\n        justify-content: center;\n        background: rgba(50,50,50,0.2);\n      }\n\n      aside:not(.active) {\n        display: none;\n      }\n\n      aside > article:not(.open) {\n        display: none; \n      }\n\n      aside > article {\n        z-index: 6;\n        border: thin solid;\n        background: whitesmoke;\n        padding: 1rem 2rem;\n        margin-top: 2.5rem;\n        min-width: 150px;\n        max-width: 666px;\n        max-height: 80vh;\n        word-break: break-word;\n        overflow-x: hidden;\n        overflow-y: auto;\n        box-shadow: 1px 1px 1px grey;\n      }\n\n      * article.infobox textarea {\n        display: block;\n        background: white;\n        font-family: monospace;\n        width: 555px;\n        min-height: 8em;\n        max-width: 100%;\n        max-height: 60vh;\n        word-break: break-word;\n        overflow-x: hidden;\n        border: thin solid grey;\n        overflow-y: auto;\n        whitespace: pre;\n        margin: 1em auto;\n        resize: none;\n      }\n    ";
  }

  function
    /*el, state*/
  styleContextMenu() {
    return "\n      * .context-menu {\n        position: absolute;\n        background: whitesmoke;\n        box-shadow: 1px 1px 1px 1px grey;\n        padding: 0.5em 0;\n        min-width: 200px;\n        z-index: 10;\n        -webkit-user-select: none;\n        -moz-user-select: none;\n        user-select: none;\n        -webkit-touch-callout: none;\n      }\n\n      * .context-menu h1 {\n        margin: 0;\n        font-size: smaller;\n      }\n\n      * .context-menu ul {\n        margin: 0;\n        padding: 0;\n        font-size: smaller;\n        list-style-type: none;\n      }\n\n      * .context-menu ul li {\n        cursor: default;\n      }\n      \n      * .context-menu li,\n      * .context-menu h1 {\n        padding: 0 1em;\n      }\n\n      * .context-menu ul li:hover {\n        background: powderblue;\n      }\n    ";
  }

  var _templateObject, _templateObject2, _templateObject3, _templateObject4, _templateObject5;
  const subviews = Subviews; //const DEFAULT_URL = 'https://google.com';
  function component(state) {
    const {
      H,

      /*sizeBrowserToBounds,*/
      asyncSizeBrowserToBounds,
      emulateNavigator,
      bondTasks,

      /*installFrameListener,*/
      canvasBondTasks
    } = state;
    const audio_port = Number(location.port ? location.port : location.protocol == 'https' ? 443 : 80) - 2;
    const audio_url = "".concat(location.protocol, "//").concat(location.hostname, ":").concat(audio_port, "/"); //const FocusBorrowerSel = '[name="address"], #selectinput, .control';

    const viewState = Object.assign(state.viewState, {
      touchX: 0,
      touchY: 0,
      textarea: null,
      keyinput: null,
      canvasEl: null,
      viewFrameEl: null,
      shouldHaveFocus: null,
      focusTextarea,
      blurTextarea,
      focusKeyinput,
      blurKeyinput
    });
    state.viewState = viewState;

    const toggleVirtualKeyboard = e => {
      e.preventDefault();
      let el = viewState.shouldHaveFocus;

      if (el) {
        if (el == viewState.keyinput) {
          blurKeyinput();
        } else if (el == viewState.textarea) {
          blurTextarea();
        }
      } else {
        focusKeyinput();
      }
    };

    const retargetTab = e => retargetTabToRemote(e, H);

    state.retargetTab = retargetTab;
    state.toggleVirtualKeyboard = toggleVirtualKeyboard; // this will likely have to be updated for iOS since "keyboard summons by focus" MUST 
    // be triggered by a user action, I believe, and I think it will not work after a setTimeout

    /*const refocusMeIfNotAllowedBorrower = (e, view_state) => {
      const me = e.target;
      setTimeout(() => {
        const active = document.activeElement;
        if ( !! active && active.matches ) {
          if ( ! active.matches(FocusBorrowerSel) && view_state.shouldHaveFocus == me ) {
            me.focus();
          }
        }
      }, 50);
    };*/

    const retargetTouchScroll = e => retargetTouchScrollToRemote(e, H, viewState);

    bondTasks.unshift(el => state.viewState.voodooEl = el);
    bondTasks.push(() => dss.initializeDSS(state, stylists));
    bondTasks.push(() => {
      document.addEventListener('keydown', event => {
        if (!event.target.matches('body') || state.viewState.shouldHaveFocus) return;

        if (event.code == "Space") {
          state.H({
            type: 'wheel',
            target: state.viewState.canvasEl,
            pageX: 0,
            pageY: 0,
            clientX: 0,
            clientY: 0,
            deltaMode: 2,
            deltaX: 0,
            contextId: state.viewState.latestScrollContext,
            deltaY: event.shiftKey ? -0.618 : 0.618
          }); //event.preventDefault();
        } else if (event.key == "Tab") {
          retargetTab(event);
        } else if (event.key == "Enter") {
          H(cloneKeyEvent(event, true));
        }
      });
      document.addEventListener('keyup', event => {
        if (!event.target.matches('body') || state.viewState.shouldHaveFocus) return;

        if (event.key == "Enter") {
          H(cloneKeyEvent(event, true));
        }
      });
    });
    subviews.startBandwidthLoop(state);

    state.viewState.draw = () => {
      return d(_templateObject || (_templateObject = _taggedTemplateLiteral(["\n      <main class=\"voodoo\" bond=", " stylist=\"styleVoodooMain\">\n        ", "\n        ", "\n        ", "\n        <article class=tab-viewport stylist=\"styleTabViewport styleContextMenu\">\n          ", "\n          ", "\n          <select id=selectinput stylist=\"styleSelectInput\"\n            input=", "\n            >\n            <option value=\"\" disabled>Select an option</option>\n          </select>\n        </article>\n        ", "\n      </main>\n      <audio bond=", " autoplay loop id=audio>\n        <source src=\"", "\" type=audio/mp3>\n      </audio>\n      ", "\n    "])), bondTasks, subviews.BandwidthIndicator(state), subviews.TabList(state), subviews.Controls(state), subviews.LoadingIndicator(state), state.useViewFrame ? state.demoMode ? d(_templateObject2 || (_templateObject2 = _taggedTemplateLiteral(["\n                  <iframe name=viewFrame \n                    scrolling=yes\n                    src=/plugins/demo/index.html\n                    load=", "\n                    bond=", "\n                  ></iframe>\n                "])), [loaded => loaded.target.hasLoaded = true, state.installFrameListener, ...canvasBondTasks], [el => state.viewState.viewFrameEl = el, asyncSizeBrowserToBounds, emulateNavigator, ...canvasBondTasks]) : state.factoryMode ? d(_templateObject3 || (_templateObject3 = _taggedTemplateLiteral(["\n                    <iframe name=viewFrame \n                      scrolling=yes\n                      load=", "\n                      bond=", "\n                    ></iframe>\n                  "])), [loaded => loaded.target.hasLoaded = true, ...canvasBondTasks], [el => state.viewState.viewFrameEl = el, asyncSizeBrowserToBounds, emulateNavigator, state.installFrameListener, ...canvasBondTasks, el => el.src = "/plugins/projector/".concat(isBundle() ? 'bundle' : 'index', ".html")]) : d(_templateObject4 || (_templateObject4 = _taggedTemplateLiteral(["\n                    <iframe name=viewFrame \n                      scrolling=yes\n                      load=", "\n                      bond=", "\n                    ></iframe>\n                  "])), [loaded => loaded.target.hasLoaded = true, ...canvasBondTasks], [el => state.viewState.viewFrameEl = el, asyncSizeBrowserToBounds, emulateNavigator, state.installFrameListener, ...canvasBondTasks, el => el.src = "/plugins/appminifier/".concat(isBundle() ? 'bundle' : 'index', ".html")]) : d(_templateObject5 || (_templateObject5 = _taggedTemplateLiteral(["\n              <canvas\n                click=", "\n                bond=", "\n                touchstart:passive=", "\n                touchmove=", "\n                wheel:passive=", "\n                mousemove:passive=", "         \n                mousedown=", "         \n                mouseup=", "         \n                pointermove:passive=", "         \n                pointerdown=", "         \n                pointerup=", "         \n                contextmenu=", "\n              ></canvas>\n            "])), [elogit, () => {
        if (viewState.shouldHaveFocus && document.activeElement != viewState.shouldHaveFocus) {
          viewState.shouldHaveFocus.focus();
        }
      }], [saveCanvas, asyncSizeBrowserToBounds, emulateNavigator, ...canvasBondTasks], [elogit, retargetTouchScroll], [e => e.preventDefault(), elogit, throttle(retargetTouchScroll, state.EVENT_THROTTLE_MS)], throttle(H, state.EVENT_THROTTLE_MS), [elogit, throttle(H, state.EVENT_THROTTLE_MS)], [elogit, H], [elogit, H], [elogit, throttle(H, state.EVENT_THROTTLE_MS)], [deviceIsMobile() ? e => startTimer(e, state.viewState) : iden, elogit, H], [deviceIsMobile() ? e => endTimer(e, state.viewState) : iden, elogit, H], [elogit, subviews.makeContextMenuHandler(state)]), e => H({
        synthetic: true,
        type: "select",
        state,
        event: e
      }), subviews.Modals(state), el => self.addEventListener('click', () => el.play(), {
        once: true
      }), audio_url, '');
    };

    state.viewState.dss = dss;
    return state.viewState.draw();

    function isBundle() {
      return location.pathname == "/bundle.html";
    }

    function focusKeyinput() {
      let type = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'text';
      let value = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';
      const {
        viewState
      } = state;
      viewState.keyinput.type = type;

      viewState.keyinput.value = value;

      if (document.activeElement != viewState.keyinput) {
        viewState.keyinput.focus({
          preventScroll: true
        });
      }

      viewState.shouldHaveFocus = viewState.keyinput;
    }

    function blurKeyinput() {
      const {
        viewState
      } = state;
      if (document.activeElement == viewState.keyinput) viewState.keyinput.blur();
      viewState.shouldHaveFocus = null;
    }

    function focusTextarea() {
      const {
        viewState
      } = state;


      if (document.activeElement != viewState.textarea) {
        viewState.textarea.focus({
          preventScroll: true
        });
      }

      viewState.shouldHaveFocus = viewState.textarea;
    }

    function blurTextarea() {
      const {
        viewState
      } = state;
      if (document.activeElement == viewState.textarea) viewState.textarea.blur();
      viewState.shouldHaveFocus = null;
    }

    function saveCanvas(canvasEl) {
      state.viewState.canvasEl = canvasEl;
      state.viewState.ctx = canvasEl.getContext('2d');
    }
  } // helper functions

  function startTimer(e, viewState) {
    const {
      pointerId = 'default'
    } = e;
    viewState[pointerId] = performance.now();
  }

  function endTimer(e, viewState) {
    const {
      pointerId = 'default'
    } = e;
    viewState[pointerId] = performance.now() - viewState[pointerId];

    if (viewState[pointerId] > subviews.CTX_MENU_THRESHOLD) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  function retargetTouchScrollToRemote(event, H, viewState) {
    const {
      type
    } = event;
    const {
      target
    } = event;
    const {
      changedTouches: changes
    } = event;
    if (changes.length > 1) return;
    const touch = changes[0];
    const {
      clientX,
      clientY
    } = touch;
    const {
      bitmapX,
      bitmapY
    } = getBitmapCoordinates({
      target,
      clientX,
      clientY
    });

    if (type == 'touchmove') {
      event.preventDefault();
      const deltaX = Math.ceil(viewState.touchX - bitmapX);
      const deltaY = Math.ceil(viewState.touchY - bitmapY);
      viewState.killNextMouseReleased = true;
      H({
        synthetic: true,
        type: "touchscroll",
        bitmapX,
        bitmapY,
        deltaX,
        deltaY,
        event: event,
        contextId: viewState.latestScrollContext
      });
    }

    viewState.touchX = bitmapX;
    viewState.touchY = bitmapY;
  }

  function retargetTabToRemote(event, H) {
    if (event.key !== "Tab") return;
    event.preventDefault();
    event.stopPropagation();
    const ev = cloneKeyEvent(event, true);
    H(ev);
  }

  const FocusCache$1 = () => {
    const focusSaver = {
      doc: null,
      oldValue: '',
      activeElement: null,
      selectionStart: 0,
      selectionEnd: 0,
      reset: () => {
        focusSaver.activeElement = null;
        focusSaver.selectionStart = 0;
        focusSaver.selectionEnd = 0;
        focusSaver.oldValue = '';
        focusSaver.doc = null;
      },
      save: doc => {
        try {
          const el = doc.activeElement;
          focusSaver.doc = doc;
          focusSaver.activeElement = el;
          focusSaver.selectionStart = el.selectionStart;
          focusSaver.selectionEnd = el.selectionEnd;
          focusSaver.oldValue = el.value;
        } catch (e) {
        }
      },
      restore: () => {
        console.log('restore focus');

        try {
          const oldFocus = focusSaver.activeElement;

          if (!oldFocus) {
            DEBUG.val >= DEBUG.med && console.log("No old focus");
            return;
          }

          let updatedEl;
          const [oldId] = oldFocus.hasAttribute('zig') ? oldFocus.getAttribute('zig').split(' ') : "";
          const dataIdSelector = "".concat(oldFocus.localName, "[zig^=\"").concat(oldId, "\"]");
          const byDataId = focusSaver.doc.querySelector(dataIdSelector);

          if (!byDataId) {
            const fallbackSelector = oldFocus.id ? "".concat(oldFocus.localName, "#").concat(oldFocus.id) : oldFocus.name ? "".concat(oldFocus.localName, "[name=\"").concat(oldFocus.name, "\"]") : '';
            let byFallbackSelector;

            if (fallbackSelector) {
              byFallbackSelector = focusSaver.doc.querySelector(fallbackSelector);
            }

            if (byFallbackSelector) {
              updatedEl = byFallbackSelector;
            }
          } else {
            DEBUG.val >= DEBUG.med && console.log("Restoring focus data id");
            updatedEl = byDataId;
          }

          if (updatedEl) {
            updatedEl.focus();
            updatedEl.value = focusSaver.oldValue;
            updatedEl.selectionStart = updatedEl.value ? updatedEl.value.length : focusSaver.selectionStart;
            updatedEl.selectionEnd = updatedEl.value ? updatedEl.value.length : focusSaver.selectionEnd;
          } else {
            DEBUG.val >= DEBUG.med && console.warn("Sorry, we couldn't find the element that was focused before.");
          }
        } catch (e) {
        }
      }
    };
    return focusSaver;
  };
  function handleTreeUpdate$1(_ref2, state) {
    let {
      treeUpdate: {
        open,
        targetId,
        dontFocus,
        runFuncs
      },
      executionContextId
    } = _ref2;

    if (targetId !== state.activeTarget) {
      let cache = state.domCache.get(targetId);

      if (!cache) {
        cache = {
          contextId: '',
          domTree: '',
          focusSaver: FocusCache$1()
        };
        state.domCache.set(targetId, cache);
      } // when we have  iframes this will be dangerous
      // to flatten contextId (which will be multiple per page 1 for each iframe)


      cache.contextId = executionContextId;
      cache.domTree = open;
      return;
    }

    if (state.viewState.viewFrameEl) {
      updateTree$1({
        targetId,
        domTree: open,
        contextId: executionContextId,
        dontFocus,
        runFuncs
      }, state);

      if (state.scrollToTopOnNextTreeUpdate) {
        scrollToTop$1({
          navigated: state.scrollToTopOnNextTreeUpdate
        }, state);
        state.scrollToTopOnNextTreeUpdate = null;
      }
    }
  }
  function updateTree$1(_ref3, state) {
    let {
      domTree,
      targetId,
      contextId,
      dontFocus = false,
      runFuncs = []
    } = _ref3;
    const frame = getViewFrame$1(state);
    let doc = getViewWindow$2(state).document;
    let cache = state.domCache.get(targetId);

    if (!cache) {
      cache = {
        contextId: '',
        domTree: '',
        focusSaver: FocusCache$1()
      };
      state.domCache.set(targetId, cache);
    }

    cache.contextId = contextId;
    cache.domTree = domTree;

    if (!doc.body || doc.body.outerHTML !== domTree) {
      cache.focusSaver.save(doc);

      if (frame.hasLoaded) {
        doc = getViewWindow$2(state).document;
        doc.body.outerHTML = domTree;
        Array.from(doc.querySelectorAll('html > head')).forEach(node => node !== doc.head && node.remove());
      } else {
        frame.addEventListener('load', () => {
          doc = getViewWindow$2(state).document;
          doc.body.outerHTML = domTree;
          Array.from(doc.querySelectorAll('html > head')).forEach(node => node !== doc.head && node.remove());
        }, {
          once: true
        });
      }

      if (!dontFocus) {
        cache.focusSaver.restore();
      }

      if (runFuncs) {
        if (frame.hasLoaded) {
          const win = getViewWindow$2(state);

          for (const name of runFuncs) {
            try {
              win[name]();
            } catch (e) {
            }
          }
        } else {
          frame.addEventListener('load', () => {
            const win = getViewWindow$2(state);

            for (const name of runFuncs) {
              try {
                win[name]();
              } catch (e) {
              }
            }
          });
        }
      }
    }
  }
  function scrollToTop$1(_ref4, state) {
    let {
      navigated
    } = _ref4;
    setTimeout(() => {
      if (navigated.targetId !== state.activeTarget) return;

      if (state.viewState.viewFrameEl) {
        getViewWindow$2(state).scrollTo(0, 0);
      }
    }, 40);
  }
  function scrollTo$2(_ref5, state) {
    let {
      scrollY,
      scrollX
    } = _ref5;
    setTimeout(() => {
      if (state.viewState.viewFrameEl) {
        getViewWindow$2(state).scrollTo(scrollX, scrollY);
      }
    }, 40);
  }

  function getViewWindow$2(state) {
    return state.viewState.viewFrameEl.contentWindow;
  }
  function getViewFrame$1(state) {
    return state.viewState.viewFrameEl;
  }

  const BUFFERED_FRAME_EVENT$2 = {
    type: "buffered-results-collection",
    command: {
      isBufferedResultsCollectionOnly: true,
      params: {}
    }
  };
  function createFrameListener$2(queue, state) {
    const {
      H
    } = state;
    return function installFrameListener() {
      self.addEventListener('message', e => {
        if (e.data && e.data.event) {
          const {
            event
          } = e.data;
          const cache = state.domCache.get(state.activeTarget);

          if (cache) {
            event.contextId = cache.contextId;
          }

          if (event.type.endsWith('move')) {
            queue.send(BUFFERED_FRAME_EVENT$2);
          } else if (event.custom) {
            if (event.type == 'scrollToEnd') {
              let cache = state.domCache.get(state.activeTarget);

              if (!cache) {
                cache = {};
                state.domCache.set(state.activeTarget, cache);
              }

              cache.scrollTop = event.scrollTop;
              cache.scrollLeft = event.scrollLeft;
            }

            state.H(event);
          } else {
            if (!event.contextId) ;

            if (event.type == 'input') {
              if (event.selectInput) {
                H({
                  synthetic: true,
                  type: 'select',
                  state: {
                    waitingExecutionContext: event.contextId
                  },
                  event
                });
              } else if (event.inputType == 'insertText') {
                H({
                  synthetic: true,
                  contextId: state.contextIdOfFocusedInput,
                  type: 'typing-clearAndInsertValue',
                  value: event.value,
                  event
                });
              }
            } else if (event.type == 'click' && event.href) {
              const activeTab = state.activeTab();
              let activeTabUrl = new URL(activeTab.url);
              let url = new URL(event.href);
              const frag = url.hash;
              activeTabUrl.hash = url.hash;
              url = url + '';
              activeTabUrl = activeTabUrl + '';

              if (url == activeTabUrl) {
                // in other words if they differ by only the hash
                const viewDoc = state.viewState.viewFrameEl.contentWindow.document;
                const fragElem = viewDoc.querySelector(frag);

                if (fragElem) {
                  fragElem.scrollIntoView();
                }
              }
            } else {
              if (event.type == 'keypress' && event.contenteditableTarget) ; else {
                H(event);
              }
            }
          }
        }
      });
      const win = state.viewState.viewFrameEl.contentWindow;
      win.addEventListener('load', () => {
      });
    };
  }
  function createDOMTreeGetter$2(queue, delay) {
    return function getDOMTree() {
      let force = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
      setTimeout(() => {
        queue.send({
          type: "getDOMTree",
          force,
          custom: true
        });
      }, delay);
    };
  }

  function saveFailingClick$1(_ref, state) {
    let {
      click
    } = _ref;

    if (click.clickModifiers & 2) {
      state.createTab(click, click.intendedHref);
    } else if (click.intendedHref) {
      state.H({
        synthetic: true,
        type: 'url-address',
        url: click.intendedHref,
        event: click
      });
    }
  }
  function auditClicks$1(_ref2, state) {
    let {
      click
    } = _ref2;
    if (click.hitsTarget) return;else {
      saveFailingClick$1({
        click
      }, state);
    }
  }

  function installPlugin$2(state, queue) {
    try {
      self.state = state; // key input 

      state.ignoreKeysCanInputMessage = false;
      state.dontFocusControlInputs = !!state.viewState.viewFrameEl; // dom cache

      state.domCache = new Map(); // select

      state.ignoreSelectInputEvents = true;
      state.installFrameListener = createFrameListener$2(queue, state);
      state.getDOMTree = createDOMTreeGetter$2(queue, state.SHORT_DELAY); // plugins 

      queue.addMetaListener('treeUpdate', meta => handleTreeUpdate$1(meta, state));
      queue.addMetaListener('navigated', meta => clearDomCache$2(meta, state));
      queue.addMetaListener('navigated', meta => state.getDOMTree());
      queue.addMetaListener('navigated', meta => scrollToTop$1(meta, state));
      queue.addMetaListener('click', meta => auditClicks$1(meta, state)); // start  

      queue.addMetaListener('topRedirect', meta => {
        const {
          browserUrl
        } = meta.topRedirect;
        location = browserUrl;
      });
      state.addListener('activateTab', () => {
        const {
          activeTarget
        } = state;
        const cache = state.domCache.get(activeTarget);

        if (!cache) {
          state.getDOMTree(true);
        } else {
          updateTree$1(cache, state);
          const {
            scrollTop,
            scrollLeft
          } = cache;
          scrollTo$2({
            scrollTop,
            scrollLeft
          });
        }
      });
      state.getDOMTree();
    } catch (e) {
      console.info(e);
    }
  }

  function clearDomCache$2(_ref, state) {
    let {
      navigated
    } = _ref;
    const {
      targetId
    } = navigated;
    state.domCache.delete(targetId);
  }

  const FocusCache = () => {
    const focusSaver = {
      doc: null,
      oldValue: '',
      activeElement: null,
      selectionStart: 0,
      selectionEnd: 0,
      reset: () => {
        focusSaver.activeElement = null;
        focusSaver.selectionStart = 0;
        focusSaver.selectionEnd = 0;
        focusSaver.oldValue = '';
        focusSaver.doc = null;
      },
      save: doc => {
        try {
          const el = doc.activeElement;
          focusSaver.doc = doc;
          focusSaver.activeElement = el;
          focusSaver.selectionStart = el.selectionStart;
          focusSaver.selectionEnd = el.selectionEnd;
          focusSaver.oldValue = el.value;
        } catch (e) {
        }
      },
      restore: () => {
        console.log('restore focus');

        try {
          const oldFocus = focusSaver.activeElement;

          if (!oldFocus) {
            DEBUG.val >= DEBUG.med && console.log("No old focus");
            return;
          }

          let updatedEl;
          const [oldId] = oldFocus.hasAttribute('zig') ? oldFocus.getAttribute('zig').split(' ') : "";
          const dataIdSelector = "".concat(oldFocus.localName, "[zig^=\"").concat(oldId, "\"]");
          const byDataId = focusSaver.doc.querySelector(dataIdSelector);

          if (!byDataId) {
            const fallbackSelector = oldFocus.id ? "".concat(oldFocus.localName, "#").concat(oldFocus.id) : oldFocus.name ? "".concat(oldFocus.localName, "[name=\"").concat(oldFocus.name, "\"]") : '';
            let byFallbackSelector;

            if (fallbackSelector) {
              byFallbackSelector = focusSaver.doc.querySelector(fallbackSelector);
            }

            if (byFallbackSelector) {
              updatedEl = byFallbackSelector;
            }
          } else {
            DEBUG.val >= DEBUG.med && console.log("Restoring focus data id");
            updatedEl = byDataId;
          }

          if (updatedEl) {
            updatedEl.focus();
            updatedEl.value = focusSaver.oldValue;
            updatedEl.selectionStart = updatedEl.value ? updatedEl.value.length : focusSaver.selectionStart;
            updatedEl.selectionEnd = updatedEl.value ? updatedEl.value.length : focusSaver.selectionEnd;
          } else {
            DEBUG.val >= DEBUG.med && console.warn("Sorry, we couldn't find the element that was focused before.");
          }
        } catch (e) {
        }
      }
    };
    return focusSaver;
  };

  function resetFocusCache(_ref, state) {
    let {
      navigated: {
        targetId
      },
      executionContextId
    } = _ref;
    let cache = state.domCache.get(targetId);

    if (!cache) {
      cache = {
        contextId: '',
        domTree: '',
        focusSaver: FocusCache()
      };
      state.domCache.set(targetId, cache);
    } else {
      cache.focusSaver.reset();
    }

    if (executionContextId) {
      cache.contextId = executionContextId;
    }
  }
  function handleTreeUpdate(_ref2, state) {
    let {
      treeUpdate: {
        open,
        targetId,
        dontFocus,
        runFuncs
      },
      executionContextId
    } = _ref2;

    if (targetId !== state.activeTarget) {
      let cache = state.domCache.get(targetId);

      if (!cache) {
        cache = {
          contextId: '',
          domTree: '',
          focusSaver: FocusCache()
        };
        state.domCache.set(targetId, cache);
      } // when we have  iframes this will be dangerous
      // to flatten contextId (which will be multiple per page 1 for each iframe)


      cache.contextId = executionContextId;
      cache.domTree = open;
      return;
    }

    if (state.viewState.viewFrameEl) {
      updateTree({
        targetId,
        domTree: open,
        contextId: executionContextId,
        dontFocus,
        runFuncs
      }, state);

      if (state.scrollToTopOnNextTreeUpdate) {
        scrollToTop({
          navigated: state.scrollToTopOnNextTreeUpdate
        }, state);
        state.scrollToTopOnNextTreeUpdate = null;
      }
    }
  }
  function updateTree(_ref3, state) {
    let {
      domTree,
      targetId,
      contextId,
      dontFocus = false,
      runFuncs = []
    } = _ref3;
    const frame = getViewFrame(state);
    let doc = getViewWindow$1(state).document;
    let cache = state.domCache.get(targetId);

    if (!cache) {
      cache = {
        contextId: '',
        domTree: '',
        focusSaver: FocusCache()
      };
      state.domCache.set(targetId, cache);
    }

    cache.contextId = contextId;
    cache.domTree = domTree;

    if (!doc.body || doc.body.outerHTML !== domTree) {
      cache.focusSaver.save(doc);

      if (frame.hasLoaded) {
        doc = getViewWindow$1(state).document;
        doc.body.outerHTML = domTree;
        Array.from(doc.querySelectorAll('html > head')).forEach(node => node !== doc.head && node.remove());
      } else {
        frame.addEventListener('load', () => {
          doc = getViewWindow$1(state).document;
          doc.body.outerHTML = domTree;
          Array.from(doc.querySelectorAll('html > head')).forEach(node => node !== doc.head && node.remove());
        }, {
          once: true
        });
      }

      if (!dontFocus) {
        cache.focusSaver.restore();
      }

      if (runFuncs) {
        if (frame.hasLoaded) {
          const win = getViewWindow$1(state);

          for (const name of runFuncs) {
            try {
              win[name]();
            } catch (e) {
            }
          }
        } else {
          frame.addEventListener('load', () => {
            const win = getViewWindow$1(state);

            for (const name of runFuncs) {
              try {
                win[name]();
              } catch (e) {
              }
            }
          });
        }
      }
    }
  }
  function scrollToTop(_ref4, state) {
    let {
      navigated
    } = _ref4;
    setTimeout(() => {
      if (navigated.targetId !== state.activeTarget) return;

      if (state.viewState.viewFrameEl) {
        getViewWindow$1(state).scrollTo(0, 0);
      }
    }, 40);
  }
  function scrollTo$1(_ref5, state) {
    let {
      scrollY,
      scrollX
    } = _ref5;
    setTimeout(() => {
      if (state.viewState.viewFrameEl) {
        getViewWindow$1(state).scrollTo(scrollX, scrollY);
      }
    }, 40);
  }
  function handleTreeDiff(_ref6, state) {
    let {
      treeDiff: {
        diffs,
        targetId
      },
      executionContextId
    } = _ref6;

    if (targetId !== state.activeTarget) {
      let cache = state.domCache.get(targetId);

      if (!cache) {
        cache = {
          contextId: '',
          domTree: '',
          focusSaver: FocusCache()
        };
        state.domCache.set(targetId, cache);
      } // when we have  iframes this will be dangerous
      // to flatten contextId (which will be multiple per page 1 for each iframe)


      cache.contextId = executionContextId;
      cache.diffs = diffs;
      return;
    }

    if (state.viewState.viewFrameEl) {
      const later = [];

      for (const diff of diffs) {
        const result = patchTree(diff, state);
        if (!result) later.push(diff);
      }

      for (const diff of later) {
        const result = patchTree(diff, state);

        if (!result) {
          console.warn("Diff could not be applied after two tries", diff);
        }
      }
    }
  }

  function patchTree(_ref7, state) {
    let {
      insert,
      remove
    } = _ref7;
    const doc = getViewWindow$1(state).document;
    const {
      parentZig
    } = insert || remove;
    const parentZigSelector = "[zig=\"".concat(parentZig, "\"]");
    const parentElement = doc.querySelector(parentZigSelector);

    if (!parentElement) {
      //throw new TypeError(`No such parent element selected by ${parentZigSelector}`);
      //console.warn(`No such parent element selected by ${parentZigSelector}`);
      return false;
    }

    if (insert) {
      parentElement.insertAdjacentHTML('beforeEnd', insert.outerHTML); //console.log(parentElement, "Added", insert.outerHTML);
    }

    if (remove) {
      const zigSelectorToRemove = "[zig=\"".concat(remove.zig, "\"]");
      const elToRemove = parentElement.querySelector(zigSelectorToRemove);

      if (!elToRemove) {
        //throw new TypeError(`No such element to remove selected by ${zigSelectorToRemove}`);
        //console.warn(`No such element to remove selected by ${zigSelectorToRemove}`);
        return true;
      } else {
        elToRemove.remove();
      } //console.log("Removed", elToRemove);

    }

    return true;
  }

  function getViewWindow$1(state) {
    return state.viewState.viewFrameEl.contentWindow;
  }
  function getViewFrame(state) {
    return state.viewState.viewFrameEl;
  }

  const BUFFERED_FRAME_EVENT$1 = {
    type: "buffered-results-collection",
    command: {
      isBufferedResultsCollectionOnly: true,
      params: {}
    }
  };
  function createFrameListener$1(queue, state) {
    const {
      H
    } = state;
    return function installFrameListener() {
      self.addEventListener('message', e => {
        if (e.data && e.data.event) {
          const {
            event
          } = e.data;
          const cache = state.domCache.get(state.activeTarget);

          if (cache) {
            event.contextId = cache.contextId;
          }

          if (event.type.endsWith('move')) {
            queue.send(BUFFERED_FRAME_EVENT$1);
          } else if (event.custom) {
            if (event.type == 'scrollToEnd') {
              let cache = state.domCache.get(state.activeTarget);

              if (!cache) {
                cache = {};
                state.domCache.set(state.activeTarget, cache);
              }

              cache.scrollTop = event.scrollTop;
              cache.scrollLeft = event.scrollLeft;
            }

            state.H(event);
          } else {
            if (!event.contextId) ;

            if (event.type == 'input') {
              if (event.selectInput) {
                H({
                  synthetic: true,
                  type: 'select',
                  state: {
                    waitingExecutionContext: event.contextId
                  },
                  event
                });
              } else if (event.inputType == 'insertText') {
                H({
                  synthetic: true,
                  contextId: state.contextIdOfFocusedInput,
                  type: 'typing-clearAndInsertValue',
                  value: event.value,
                  event
                });
              }
            } else if (event.type == 'click' && event.href) {
              const activeTab = state.activeTab();
              let activeTabUrl = new URL(activeTab.url);
              let url = new URL(event.href);
              const frag = url.hash;
              activeTabUrl.hash = url.hash;
              url = url + '';
              activeTabUrl = activeTabUrl + '';

              if (url == activeTabUrl) {
                // in other words if they differ by only the hash
                const viewDoc = state.viewState.viewFrameEl.contentWindow.document;
                const fragElem = viewDoc.querySelector(frag);

                if (fragElem) {
                  fragElem.scrollIntoView();
                }
              }
            } else {
              if (event.type == 'keypress' && event.contenteditableTarget) ; else {
                H(event);
              }
            }
          }
        }
      });
      const win = state.viewState.viewFrameEl.contentWindow;
      win.addEventListener('load', () => {
      });
    };
  }
  function createDOMTreeGetter$1(queue, delay) {
    return function getDOMTree() {
      let force = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
      setTimeout(() => {
        queue.send({
          type: "getDOMTree",
          force,
          custom: true
        });
      }, delay);
    };
  }

  function saveFailingClick(_ref, state) {
    let {
      click
    } = _ref;

    if (click.clickModifiers & 2) {
      state.createTab(click, click.intendedHref);
    } else if (click.intendedHref) {
      state.H({
        synthetic: true,
        type: 'url-address',
        url: click.intendedHref,
        event: click
      });
    }
  }
  function auditClicks(_ref2, state) {
    let {
      click
    } = _ref2;
    if (click.hitsTarget) return;else {
      saveFailingClick({
        click
      }, state);
    }
  }

  function installPlugin$1(state, queue) {
    if (location.pathname !== "/custom.html" && location.pathname !== "/") return;

    try {
      // key input 
      state.ignoreKeysCanInputMessage = false;
      state.dontFocusControlInputs = !!state.useViewFrame; // dom cache

      state.domCache = new Map(); // select

      state.ignoreSelectInputEvents = true;
      state.installFrameListener = createFrameListener$1(queue, state);
      state.getDOMTree = createDOMTreeGetter$1(queue, state.SHORT_DELAY); // plugins 

      queue.addMetaListener('topRedirect', meta => {
        const {
          browserUrl
        } = meta.topRedirect;
        location = browserUrl;
      });
      queue.addMetaListener('treeUpdate', meta => handleTreeUpdate(meta, state));
      queue.addMetaListener('treeDiff', meta => handleTreeDiff(meta, state));
      queue.addMetaListener('navigated', meta => resetFocusCache(meta, state));
      queue.addMetaListener('navigated', meta => handleNavigate$1(meta, state));
      queue.addMetaListener('click', meta => auditClicks(meta, state)); // appminifier plugin 

      queue.send({
        type: "enableAppminifier",
        custom: true
      });
      state.addListener('activateTab', () => {
        const win = getViewWindow$1(state);
        const {
          activeTarget,
          clearViewport,
          lastTarget
        } = state;
        const lastCache = state.domCache.get(lastTarget);
        const cache = state.domCache.get(activeTarget);

        if (!cache) {
          state.clearViewport();
          state.getDOMTree(true);
        } else {
          // save scroll position of last target before we update window
          // using block scope oorah
          if (lastCache) {
            const {
              pageXOffset: scrollX,
              pageYOffset: scrollY
            } = win;
            Object.assign(lastCache, {
              scrollX,
              scrollY
            });
          }

          state.clearViewport();
          updateTree(cache, state); // restore scroll position of new target

          const {
            scrollX,
            scrollY
          } = cache;
          scrollTo$1({
            scrollX,
            scrollY
          }, state);
        }
      });
    } catch (e) {
      console.info(e);
    }
  }

  function clearDomCache$1(_ref, state) {
    let {
      navigated
    } = _ref;
    const {
      targetId
    } = navigated;
    state.domCache.delete(targetId);
  }

  function handleNavigate$1(_ref2, state) {
    let {
      navigated
    } = _ref2;
    clearDomCache$1({
      navigated
    }, state);

    if (navigated.url.startsWith('http')) {
      state.scrollToTopOnNextTreeUpdate = navigated;
      state.getDOMTree();
    } else {
      state.clearViewport();
    }
  }

  function scrollTo(_ref2, state) {
    let {
      scrollY,
      scrollX
    } = _ref2;
    setTimeout(() => {
      if (state.viewState.viewFrameEl) {
        getViewWindow(state).scrollTo(scrollX, scrollY);
      }
    }, 40);
  }
  function getViewWindow(state) {
    return state.viewState.viewFrameEl.contentWindow;
  }

  const BUFFERED_FRAME_EVENT = {
    type: "buffered-results-collection",
    command: {
      isBufferedResultsCollectionOnly: true,
      params: {}
    }
  };
  function createFrameListener(queue, state) {
    const {
      H
    } = state;
    return function installFrameListener() {
      self.addEventListener('message', e => {
        if (e.data && e.data.event) {
          const {
            event
          } = e.data;
          const cache = state.domCache.get(state.activeTarget);

          if (cache) {
            event.contextId = cache.contextId;
          }

          if (event.type.endsWith('move')) {
            queue.send(BUFFERED_FRAME_EVENT);
          } else if (event.custom) {
            if (event.type == 'scrollToEnd') {
              let cache = state.domCache.get(state.activeTarget);

              if (!cache) {
                cache = {};
                state.domCache.set(state.activeTarget, cache);
              }

              cache.scrollTop = event.scrollTop;
              cache.scrollLeft = event.scrollLeft;
            }

            state.H(event);
          } else {
            if (!event.contextId) ;

            if (event.type == 'input') {
              if (event.selectInput) {
                H({
                  synthetic: true,
                  type: 'select',
                  state: {
                    waitingExecutionContext: event.contextId
                  },
                  event
                });
              } else if (event.inputType == 'insertText') {
                H({
                  synthetic: true,
                  contextId: state.contextIdOfFocusedInput,
                  type: 'typing-clearAndInsertValue',
                  value: event.value,
                  event
                });
              }
            } else if (event.type == 'click' && event.href) {
              const activeTab = state.activeTab();
              let activeTabUrl = new URL(activeTab.url);
              let url = new URL(event.href);
              const frag = url.hash;
              activeTabUrl.hash = url.hash;
              url = url + '';
              activeTabUrl = activeTabUrl + '';

              if (url == activeTabUrl) {
                // in other words if they differ by only the hash
                const viewDoc = state.viewState.viewFrameEl.contentWindow.document;
                const fragElem = viewDoc.querySelector(frag);

                if (fragElem) {
                  fragElem.scrollIntoView();
                }
              }
            } else {
              if (event.type == 'keypress' && event.contenteditableTarget) ; else {
                H(event);
              }
            }
          }
        }
      });
      const win = state.viewState.viewFrameEl.contentWindow;
      win.addEventListener('load', () => {
      });
    };
  }
  function createDOMTreeGetter(queue, delay) {
    return function getDOMTree() {
      let force = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
      setTimeout(() => {
        queue.send({
          type: "getDOMSnapshot",
          force,
          custom: true
        });
      }, delay);
    };
  }

  function installPlugin(state, queue) {
    console.log("Installing projector plugin");
    if (location.pathname !== "/factory.html") return;
    state.factoryMode = true;
    state.domCache = new Map();
    state.installFrameListener = createFrameListener(queue, state);
    state.getDOMSnapshot = createDOMTreeGetter(queue, state.SHORT_DELAY); //queue.addMetaListener('treeUpdate', meta => handleTreeUpdate(meta, state));
    //queue.addMetaListener('treeDiff', meta => handleTreeDiff(meta, state));

    queue.addMetaListener('navigated', meta => handleNavigate(meta, state));
    queue.addMetaListener('domSnapshot', meta => console.log(meta, state));
    queue.send({
      type: "enableProjector",
      custom: true
    });
    state.addListener('activateTab', () => {
      const win = getViewWindow(state);
      const {
        activeTarget,
        lastTarget
      } = state;
      const lastCache = state.domCache.get(lastTarget);
      const cache = state.domCache.get(activeTarget);

      if (!cache) {
        state.clearViewport();
        state.getDOMSnapshot(true);
      } else {
        // save scroll position of last target before we update window
        // using block scope oorah
        if (lastCache) {
          const {
            pageXOffset: scrollX,
            pageYOffset: scrollY
          } = win;
          Object.assign(lastCache, {
            scrollX,
            scrollY
          });
        }

        state.clearViewport(); //updateTree(cache, state); 
        // restore scroll position of new target

        const {
          scrollX,
          scrollY
        } = cache;
        scrollTo({
          scrollX,
          scrollY
        }, state);
      }
    });
  }

  function clearDomCache(_ref, state) {
    let {
      navigated
    } = _ref;
    const {
      targetId
    } = navigated;
    state.domCache.delete(targetId);
  }

  function handleNavigate(_ref2, state) {
    let {
      navigated
    } = _ref2;
    clearDomCache({
      navigated
    }, state);

    if (navigated.url.startsWith('http')) {
      state.scrollToTopOnNextTreeUpdate = navigated;
      state.getDOMSnapshot();
    } else {
      state.clearViewport();
    }
  }

  const ThrottledEvents = new Set(["mousemove", "pointermove", "touchmove"]);
  const CancelWhenSyncValue = new Set(["keydown", "keyup", "keypress", "compositionstart", "compositionend", "compositionupdate"]);

  const EnsureCancelWhenSyncValue = e => {
    if (!e.type.startsWith("key")) {
      return true;
    } else {
      const id = getKeyId(e);
      return !controlChars.has(id);
    }
  };

  const SessionlessEvents = new Set(["window-bounds", "window-bounds-preImplementation", "user-agent", "hide-scrollbars"]);
  const IMMEDIATE = 0;
  const SHORT_DELAY = 20;
  const LONG_DELAY = 300;
  const VERY_LONG_DELAY = 60000;
  const EVENT_THROTTLE_MS = 40;
  /* 20, 40, 80 */
  // view frame debug

  let latestRequestId = 0;
  async function voodoo(selector, position) {
    let {
      postInstallTasks = [],
      preInstallTasks = [],
      canvasBondTasks = [],
      bondTasks = [],
      useViewFrame = false,
      demoMode = false
    } = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    const sessionToken = location.hash && location.hash.slice(1);
    location.hash = '';
    const closed = new Set();
    const listeners = new Map();
    const lastTarget = '[lastTarget]';
    const {
      tabs,
      activeTarget,
      requestId
    } = await (demoMode ? fetchDemoTabs() : fetchTabs({
      sessionToken
    }));
    latestRequestId = requestId;
    const state = {
      H,
      // bandwidth
      messageDelay: 0,
      // time it takes to receive an average, non-frame message
      showBandwidthRate: true,
      myBandwidth: 0,
      serverBandwidth: 0,
      totalBytes: 0,
      totalServerBytesThisSecond: 0,
      totalBytesThisSecond: 0,
      totalBandwidth: 0,
      frameBandwidth: [],
      // demo mode
      demoMode,
      // if we are using a view frame (instead of canvas)
      useViewFrame,
      // for chrome vs firefox and mobile vs desktop to handle
      // different ways of doing IME input and keypress
      openKey: '',
      lastKeypressKey: '',
      // for firefox because it's IME does not fire inputType
      // so we have no simple way to handle deleting content backward
      // this should be FF on MOBILE only probably so that's why it's false
      convertTypingEventsToSyncValueEvents: deviceIsMobile(),
      //convertTypingEventsToSyncValueEvents: false,
      // for safari to detect if pointerevents work
      DoesNotSupportPointerEvents: true,
      // safari to keep track of composition
      isComposing: false,
      // useful for input events that don't support data
      // invalidated by the first data prop set
      DataIsNotSupported: true,
      sizeBrowserToBounds,
      asyncSizeBrowserToBounds,
      emulateNavigator,
      hideScrollbars,
      bondTasks,
      canvasBondTasks,
      // tabs
      updateTabsTasks: [],
      lastTarget,
      activeTarget,
      tabs,
      attached: new Set(),
      activateTab,
      closeTab,
      createTab,
      activeTab,
      favicons: new Map(),
      // timing constants
      IMMEDIATE,
      SHORT_DELAY,
      LONG_DELAY,
      VERY_LONG_DELAY,
      EVENT_THROTTLE_MS,
      viewState: {},
      clearViewport,

      addListener(name, func) {
        let funcList = listeners.get(name);

        if (!funcList) {
          funcList = [];
          listeners.set(name, funcList);
        }

        funcList.push(func);
      }

    };
    const updateTabs = debounce(rawUpdateTabs, LONG_DELAY);

    if (state.demoMode) {
      state.demoEventConsumer = demoZombie;
    }

    if (location.search.includes("url=")) {
      let taskUrl;

      try {
        taskUrl = decodeURIComponent(location.search.split('&').filter(x => x.includes('url='))[0].split('=')[1]);
      } catch (e) {
        alert(e);
        console.warn(e);
        taskUrl = location.search.split('&').filter(x => x.includes('url='))[0].split('=')[1];
      }

      postInstallTasks.push(async _ref => {
        let {
          queue
        } = _ref;
        let completed = false;
        queue.addMetaListener('changed', async meta => {
          if (completed) return;

          if (meta.changed.type == 'page' && meta.changed.url.startsWith("https://isolation.site/redirect")) {
            await sleep(500);
            await activateTab(null, meta.changed);
            await sleep(2000);
            H({
              synthetic: true,
              type: "url-address",
              event: null,
              url: taskUrl
            });
            completed = true;
            await sleep(5000);
            history.pushState("", "", "/");
          }
        });
        state.createTab(null, "https://isolation.site/redirect.html");
      });
    }

    const queue = new EventQueue(state, sessionToken); // plugins 

    const plugins = new Map();

    if (state.useViewFrame) {
      installPlugin$1(state, queue);

      if (location.pathname == "/factory.html") {
        installPlugin(state, queue);
      }

      if (state.demoMode) {
        installPlugin$2(state, queue);
      }
    }

    if (isSafari()) {
      queue.send({
        type: "isSafari"
      });
    } else if (isFirefox()) {
      queue.send({
        type: "isFirefox"
      });
    }

    if (deviceIsMobile()) {
      state.hideScrollbars();
      queue.send({
        type: "isMobile"
      });
    } // event handlers
    // input


    queue.addMetaListener('selectInput', meta => handleSelectMessage(meta, state));
    queue.addMetaListener('keyInput', meta => handleKeysCanInputMessage(meta, state));
    queue.addMetaListener('favicon', meta => handleFaviconMessage(meta, state));
    queue.addMetaListener('navigated', () => canKeysInput());
    queue.addMetaListener('navigated', _ref2 => {
      let {
        navigated: {
          targetId
        }
      } = _ref2;
      return resetFavicon({
        targetId
      }, state);
    }); //queue.addMetaListener('navigated', meta => takeShot(meta, state));
    // element info

    queue.addMetaListener('elementInfo', meta => handleElementInfo(meta, state)); // scroll

    queue.addMetaListener('scroll', meta => handleScrollNotification(meta, state)); // loading

    queue.addMetaListener('resource', meta => showLoadingIndicator(meta, state));
    queue.addMetaListener('failed', meta => {
      if (meta.failed.params.type == "Document") {
        // we also need to make sure the failure happens at the top level document
        // rather than writing the top level document for any failure in a sub frame
        if (meta.failed.params.errorText && meta.failed.params.errorText.includes("ABORTED")) ; else {
          writeDocument("Request failed: ".concat(meta.failed.params.errorText), meta.failed.frameId, meta.failed.sessionId);
        }
      }
    });
    queue.addMetaListener('navigated', meta => resetLoadingIndicator(meta, state));


    queue.addMetaListener('changed', _ref3 => {
      let {
        changed
      } = _ref3;
      const tab = findTab(changed.targetId);

      if (tab) {
        Object.assign(tab, changed);
        subviews.TabList(state);
      }

      updateTabs({
        changed
      });
    }); // tabs

    queue.addMetaListener('created', meta => {
      if (meta.created.type == 'page') {
        setTimeout(() => activateTab(null, meta.created), LONG_DELAY); //state.updateTabsTasks.push(() => setTimeout(() => activateTab(null, meta.created), LONG_DELAY));
        //updateTabs();
        //sizeBrowserToBounds(state.viewState.canvasEl, meta.created.targetId);
      }
    });
    queue.addMetaListener('attached', meta => {
      const attached = meta.attached.targetInfo;

      if (attached.type == 'page') {
        state.attached.add(attached.targetId);

        if (state.useViewFrame) {
          sizeBrowserToBounds(state.viewState.viewFrameEl, attached.targetId);
        } else {
          sizeBrowserToBounds(state.viewState.canvasEl, attached.targetId);
          emulateNavigator();
        }

        updateTabs();
      }
    });
    queue.addMetaListener('navigated', updateTabs);
    queue.addMetaListener('detached', updateTabs);
    queue.addMetaListener('destroyed', _ref4 => {
      let {
        destroyed
      } = _ref4;
      closed.delete(destroyed.targetId);
      updateTabs();
    });
    queue.addMetaListener('crashed', updateTabs); //modals

    queue.addMetaListener('modal', modalMessage => subviews.openModal(modalMessage, state)); // remote secure downloads

    queue.addMetaListener('download', _ref5 => {
      let {
        download
      } = _ref5;
      const {
        sessionId,
        filename
      } = download;
      const modal = {
        sessionId,
        type: 'notice',
        message: "The file \"".concat(filename, "\" is downloading to a secure location and will be displayed securely momentarily if it is a supported format."),
        otherButton: {
          title: 'Get License',
          onclick: () => window.open('mailto:cris@dosycorp.com?Subject=BrowserBox+License+Support+Inquiry&body=Hi%20Cris', "_blank")
        },
        title: "SecureView\u2122 Enabled"
      };
      subviews.openModal({
        modal
      }, state);
    });
    queue.addMetaListener('secureview', _ref6 => {
      let {
        secureview
      } = _ref6;
      const {
        url
      } = secureview;

      if (url) {
        createTab(null, url);
      }
    }); // HTTP auth

    queue.addMetaListener('authRequired', _ref7 => {
      let {
        authRequired
      } = _ref7;
      const {
        requestId
      } = authRequired;
      const modal = {
        requestId,
        type: 'auth',
        message: "Provide credentials to continue",
        title: "HTTP Auth"
      };
      subviews.openModal({
        modal
      }, state);
    }); // File chooser 

    queue.addMetaListener('fileChooser', _ref8 => {
      let {
        fileChooser
      } = _ref8;
      const {
        sessionId,
        mode,
        accept,
        csrfToken
      } = fileChooser;
      const modal = {
        sessionId,
        mode,
        accept,
        csrfToken,
        type: 'filechooser',
        message: "Securely send files to the remote page.",
        title: "File Chooser"
      };
      console.log({
        fileChooserModal: modal
      });
      subviews.openModal({
        modal
      }, state);
    }); // make this so we can call it on resize

    window._voodoo_asyncSizeTab = () => setTimeout(sizeTab, 0); // bond tasks 


    canvasBondTasks.push(indicateNoOpenTabs);
    canvasBondTasks.push(installZoomListener);
    canvasBondTasks.push(asyncSizeBrowserToBounds);
    canvasBondTasks.push(rawUpdateTabs);

    if (isSafari()) {
      canvasBondTasks.push(installSafariLongTapListener);
    }

    bondTasks.push(canKeysInput);
    bondTasks.push(getFavicon);
    bondTasks.push(installTopLevelKeyListeners);
    const preInstallView = {
      queue
    };

    for (const task of preInstallTasks) {
      try {
        task(preInstallView);
      } catch (e) {
        console.error("Task ".concat(task, " failed with ").concat(e));
      }
    }

    component(state).to(selector, position);
    const api = {
      back: () => 1,
      forward: () => 1,
      reload: () => 1,
      stop: () => 1,
      mouse: () => 1,
      touch: () => 1,
      scroll: () => 1,
      key: () => 1,
      type: () => 1,
      omni: () => 1,
      newTab: () => 1,
      closeTab: () => 1,
      switchTab: () => 1
    };
    const pluginView = {
      addToQueue,
      subscribeToQueue,
      requestRender,
      api
    };
    const poppetView = {
      loadPlugin,
      api
    };
    const postInstallView = {
      queue
    };
    await sleep(0);

    for (const task of postInstallTasks) {
      try {
        task(postInstallView);
      } catch (e) {
        console.error("Task ".concat(task, " failed with ").concat(e));
      }
    }

    if (activeTarget) {
      setTimeout(() => activateTab(null, {
        targetId: activeTarget
      }), LONG_DELAY); //state.updateTabsTasks.push(() => setTimeout(() => activateTab(null, {targetId:activeTarget}), LONG_DELAY));
      //updateTabs();
      //sizeBrowserToBounds(state.viewState.canvasEl, activeTarget);
    }

    return poppetView; // closures

    /*function doShot() {
      setTimeout(() => {
        queue.send({
          type: "doShot",
          synthetic: true
        });
      }, SHORT_DELAY);
    }*/

    function runListeners(name, data) {
      const funcList = listeners.get(name);
      if (!funcList || funcList.length == 0) return false;
      let score = false;

      for (const func of funcList) {
        try {
          func(data);
          score = score || true;
        } catch (e) {
          console.log("Listeners func for ".concat(name, " fails: ").concat(func, "\nError: ").concat(e + e.stack));
        }
      }

      return score;
    }

    function findTab(id) {
      return state.tabs.find(_ref9 => {
        let {
          targetId
        } = _ref9;
        return id == targetId;
      });
    }

    function activeTab() {
      return state.tabs.length == 1 ? state.tabs[0] : findTab(state.activeTarget) || {};
    }

    function indicateNoOpenTabs() {
      if (state.tabs.length == 0) {
        clearViewport();

        if (state.useViewFrame) {
          try {
            state.viewState.viewFrameEl.contentDocument.body.innerHTML = "\n                <em>".concat(state.factoryMode ? 'Factory Mode' : 'Custom Mode', ". No tabs open.</em>\n              ");
          } catch (e) {
            console.warn(e);
          }
        } else {
          writeCanvas("No tabs open.");
        }
      }
    }

    function writeCanvas(text) {
      const canv = state.viewState.canvasEl;
      const ctx = state.viewState.ctx;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canv.width, canv.height);
      ctx.fillStyle = 'silver';
      ctx.font = 'italic 3vmax sans-serif';
      ctx.textAlign = "center";
      ctx.fillText(text, innerWidth / 2, innerHeight / 2 - 6 * Math.max(innerWidth / 100, innerHeight / 100));
    }

    function writeDocument(html, frameId, sessionId) {
      queue.send({
        type: 'setDocument',
        html,
        frameId,
        sessionId,
        synthetic: true
      });
    }

    function clearViewport() {
      if (state.useViewFrame) {
        try {
          state.viewState.viewFrameEl.contentDocument.body.innerHTML = "";
        } catch (e) {
          console.warn(e);
        }
      } else {
        const canv = state.viewState.canvasEl;
        const ctx = state.viewState.ctx;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canv.width, canv.height);
      }
    }

    function sendKey(keyEvent) {
      const {
        viewState
      } = state;

      if (!(viewState.shouldHaveFocus || document.activeElement == viewState.omniBoxInput)) {
        let ev = keyEvent;

        if (ev.key == "Tab" || ev.key == "Enter") ; else {
          H(ev);
        }
      }
    }

    function installTopLevelKeyListeners() {
      if (!deviceIsMobile()) {
        self.addEventListener('keydown', sendKey);
        self.addEventListener('keypress', sendKey);
        self.addEventListener('keyup', sendKey);
      }
    }

    function installSafariLongTapListener(el) {
      const FLAGS = {
        passive: true,
        capture: true
      };
      const MIN_DURATION = 200;
      const MAX_MOVEMENT = 20;
      let lastStart;
      el.addEventListener('touchstart', ts => lastStart = ts, FLAGS);
      el.addEventListener('touchend', triggerContextMenuIfLongEnough, FLAGS);
      el.addEventListener('touchcancel', triggerContextMenuIfLongEnough, FLAGS);

      function triggerContextMenuIfLongEnough(tf) {
        // space 
        const touch1 = lastStart.changedTouches[0];
        const touch2 = tf.changedTouches[0];
        const movement = Math.hypot(touch2.pageX - touch1.pageX, touch2.pageY - touch1.pageY); // time

        const duration = tf.timeStamp - lastStart.timeStamp;

        if (duration > MIN_DURATION && movement < MAX_MOVEMENT) {
          lastStart.preventDefault();
          tf.preventDefault();
          const {
            pageX,
            pageY,
            clientX,
            clientY
          } = touch1;
          el.dispatchEvent(new CustomEvent('contextmenu', {
            detail: {
              pageX,
              pageY,
              clientX,
              clientY
            }
          }));
        }
      }
    }

    function installZoomListener(el) {
      const FLAGS = {
        passive: true
      };
      let lastScale = 1.0;
      let scaling = false;
      let startDist = 0;
      let lastDist = 0;
      let touch;
      el.addEventListener('touchstart', begin, FLAGS);
      el.addEventListener('touchmove', move, FLAGS);
      el.addEventListener('touchend', end, FLAGS);
      el.addEventListener('touchcancel', end, FLAGS);
      el.addEventListener('wheel', sendZoom, {
        passive: true,
        capture: true
      });

      function sendZoom(event) {
        if (event.ctrlKey || event.deltaZ != 0) {
          const delta = event.deltaZ || event.deltaY;
          const direction = Math.sign(delta);
          let multiplier;

          if (direction > 0) {
            multiplier = 1 / 1.25;
          } else {
            multiplier = 1.25;
          }

          const scale = lastScale * multiplier;
          lastScale = scale;
          H({
            synthetic: true,
            type: 'zoom',
            scale,
            event
          });
        }
      }

      function begin(event) {
        if (event.touches.length == 2) {
          startDist = Math.hypot(event.touches[0].pageX - event.touches[1].pageX, event.touches[0].pageY - event.touches[1].pageY);

          if (startDist > 8) {
            scaling = true;
            touch = event.touches[0];
          } else {
            scaling = false;
          }
        }
      }

      function move(event) {
        if (scaling) {
          const dist = Math.hypot(event.touches[0].pageX - event.touches[1].pageX, event.touches[0].pageY - event.touches[1].pageY);
          lastDist = dist;
        }
      }

      function end() {
        if (scaling) {
          if (lastDist < 8) ; else {
            const scale = lastScale * Math.abs(lastDist / startDist);
            lastScale = scale;
            H({
              synthetic: true,
              type: 'zoom',
              scale,
              event: touch
            });
          }

          scaling = false;
          startDist = 0;
          lastDist = 0;
          touch = false;
        }
      }
    }

    function H(event) {
      // block if no tabs
      if (state.tabs.length == 0) {
        if (SessionlessEvents.has(event.type)) ; else return;
      }

      if (event.defaultPrevented) return;
      const mouseEventOnPointerDevice = event.type.startsWith("mouse") && event.type !== "wheel" && !state.DoesNotSupportPointerEvents;
      const tabKeyPressForBrowserUI = event.key == "Tab" && !event.vRetargeted;
      const unnecessaryIfSyncValue = state.convertTypingEventsToSyncValueEvents && CancelWhenSyncValue.has(event.type) && EnsureCancelWhenSyncValue(event);
      const eventCanBeIgnored = mouseEventOnPointerDevice || tabKeyPressForBrowserUI || unnecessaryIfSyncValue;
      if (eventCanBeIgnored) return;
      const pointerEvent = event.type.startsWith("pointer");
      const mouseWheel = event.type == "wheel";
      const syntheticNonTypingEventWrapper = event.synthetic && event.type != "typing" && event.event;

      if (mouseWheel) ; else if (pointerEvent) {
        state.DoesNotSupportPointerEvents = false;
      } else if (syntheticNonTypingEventWrapper) {
        event.event.preventDefault && event.event.preventDefault();
      }

      const simulated = event.event && event.event.simulated;
      const hasTarget = event.event && event.event.target;

      if (event.type == "typing" && hasTarget && !simulated && state.convertTypingEventsToSyncValueEvents) {
        event.type = 'typing-syncValue';
        event.value = event.event.target.value;
        event.contextId = state.contextIdOfFocusedInput;
        event.data = "";
      }

      const isThrottled = ThrottledEvents.has(event.type);
      const transformedEvent = transformEvent(event);

      if (mouseWheel) {
        transformedEvent.contextId = state.viewState.latestScrollContext;
      }

      if (isThrottled) {
        queue.send(transformedEvent);
      } else {
        if (event.type == "keydown" && event.key == "Enter") {
          // Note
          // We do this to make sure we send composed input data when enter is pressed
          // in an input field, if we do not do this, the current composition is not printed
          // but only if we are not using sync mode 
          // (otherwise we will add an unnecessary bit on the end!)
          if (!state.convertTypingEventsToSyncValueEvents) {
            if (!!state.latestData && !!event.target.matches('input') && state.latestData.length > 1) {
              queue.send(transformEvent({
                synthetic: true,
                type: 'typing',
                data: state.latestData,
                event: {
                  enterKey: true,
                  simulated: true
                }
              }));
              state.latestCommitData = state.latestData;
              state.latestData = "";
            }
          }
        } else if (event.type == "keydown" && event.key == "Backspace") {
          state.backspaceFiring = true;

          if (state.viewState.shouldHaveFocus && !state.convertTypingEventsToSyncValueEvents) {
            state.viewState.shouldHaveFocus.value = "";
          }
        } else if (event.type == "keyup" && event.key == "Backspace") {
          state.backspaceFiring = false;
        } else if (event.type == "pointerdown" || event.type == "mousedown") {
          if (!state.convertTypingEventsToSyncValueEvents) {
            //const {timeStamp,type} = event;
            const {
              latestData
            } = state;

            if (!!state.viewState.shouldHaveFocus && !!latestData && latestData.length > 1 && latestData != state.latestCommitData) {
              state.isComposing = false;
              const data = latestData;
              queue.send(transformEvent({
                synthetic: true,
                type: 'typing',
                data: data,
                event: {
                  pointerDown: true,
                  simulated: true
                }
              }));
              state.latestCommitData = data;
              state.latestData = "";
            }
          }
        } else if (event.type == "pointerup" || event.type == "mouseup") {
          if (state.viewState.killNextMouseReleased) {
            state.viewState.killNextMouseReleased = false;
            return;
          }
        }

        queue.send(transformedEvent);
      }
    }

    function sizeBrowserToBounds(el, targetId) {
      let {
        width,
        height
      } = el.getBoundingClientRect();
      width = Math.round(width);
      height = Math.round(height);

      if (el.width != width || el.height != height) {
        el.width = width;
        el.height = height;
      }

      const mobile = deviceIsMobile();
      H({
        synthetic: true,
        type: "window-bounds",
        width,
        height,
        targetId: targetId || state.activeTarget
      });
      H({
        synthetic: true,
        type: "window-bounds-preImplementation",
        width,
        height,
        mobile,
        targetId: targetId || state.activeTarget
      });
      self.ViewportWidth = width;
      self.ViewportHeight = height;
    }

    function sizeTab() {
      return sizeBrowserToBounds(state.viewState.canvasEl);
    }

    function asyncSizeBrowserToBounds(el) {
      setTimeout(() => (sizeBrowserToBounds(el), indicateNoOpenTabs()), 0);
    }

    function emulateNavigator() {
      const {
        platform,
        userAgent,
        language: acceptLanguage
      } = navigator;
      H({
        synthetic: true,
        type: "user-agent",
        userAgent,
        platform,
        acceptLanguage
      });
    }

    function hideScrollbars() {
      H({
        synthetic: true,
        type: "hide-scrollbars"
      });
    }

    async function activateTab(click, tab) {
      // don't activate if the click was a close click from our tab
      if (click && click.currentTarget.querySelector('button.close') == click.target) return;
      click && click.preventDefault(); // sometimes we delay the call to activate tab and
      // in the meantime the list of tabs can empty
      // so we exit if there is no tab to activate

      if (!tab) return;

      if (click) {
        setTimeout(() => click.target.closest('li').scrollIntoView({
          inline: 'center',
          behavior: 'smooth'
        }), LONG_DELAY);
      }

      if (state.activeTarget == tab.targetId) {
        if (state.viewState.omniBoxInput == state.viewState.lastActive) {
          state.viewState.omniBoxInput.focus();
        }

        return;
      }

      const {
        targetId
      } = tab;
      queue.send({
        command: {
          name: "Target.activateTarget",
          params: {
            targetId
          },
          requiresShot: true
        }
      });
      sizeTab();
      canKeysInput();
      state.lastTarget = state.activeTarget;
      state.activeTarget = targetId; // we assume that a listener will call clearviewport
      // this returns false if there are no listeners

      if (!runListeners('activateTab')) {
        clearViewport();
      }

      state.active = activeTab();
      subviews.TabList(state);
      subviews.OmniBox(state);
      subviews.LoadingIndicator(state);
      sizeBrowserToBounds(state.viewState.canvasEl);
      setTimeout(() => {
        if (state.active && state.active.url != BLANK) {
          canKeysInput();
        } else {
          /**
          writeDocument(`
            <!DOCTYPE html>
              <style>
                :root {
                  height: 100%;
                  background: #${Math.floor(Math.random() * 0x1000000).toString(16).padStart(6, 0)};
                  color: navy;
                  font-family: system-ui;
                }
                h2 {
                }
                strong {
                  padding: 0.5rem;
                }
              </style>
              <h2>
                Secure BrowserBox 
              </h2>
              <strong>
                Current time: ${(new Date).toString()}
              </strong>
            </html>
          `);
          **/
          writeCanvas("Secure BrowserBox");
          state.viewState.omniBoxInput.focus();
        }
      }, SHORT_DELAY);
    }

    async function closeTab(click, tab, index) {
      const {
        targetId
      } = tab;
      closed.add(targetId);
      resetLoadingIndicator({
        navigated: targetId
      }, state);
      setTimeout(() => closed.delete(targetId), VERY_LONG_DELAY);
      const events = [{
        command: {
          name: "Target.closeTarget",
          params: {
            targetId
          }
        }
      }];
      await queue.send(events);
      state.tabs.splice(index, 1);

      if (state.activeTarget == targetId) {
        if (state.tabs.length == 0) {
          state.activeTarget = null;
        } else {
          if (index >= state.tabs.length) {
            index = state.tabs.length - 1;
          }

          const newActive = state.tabs[index];
          activateTab(click, newActive);
        }
      } else {
        updateTabs();
      }

      subviews.TabList(state);
      subviews.LoadingIndicator(state);
    }

    async function rawUpdateTabs() {
      let {
        tabs,
        activeTarget,
        requestId
      } = await (demoMode ? fetchDemoTabs() : fetchTabs({
        sessionToken
      }));
      tabs = tabs.filter(_ref10 => {
        let {
          targetId
        } = _ref10;
        return !closed.has(targetId);
      });

      if (requestId <= latestRequestId) {
        return;
      } else {
        latestRequestId = requestId;
      }

      state.tabs = tabs;

      if (demoMode) {
        state.activeTarget = activeTarget;
      }

      state.active = activeTab(); // this ensures we activate the tab

      if (state.tabs.length == 1) {
        setTimeout(() => activateTab(null, state.tabs[0]), LONG_DELAY); //state.updateTabsTasks.push(() => setTimeout(() => activateTab(null, state.tabs[0]), LONG_DELAY));
        //updateTabs();
        //sizeBrowserToBounds(state.viewState.canvasEl, state.tabs[0].targetId);
      } else if (!state.activeTarget || !state.active) {
        if (state.tabs.length) {
          setTimeout(() => activateTab(null, state.tabs[0]), LONG_DELAY); //state.updateTabsTasks.push(() => setTimeout(() => activateTab(null, state.tabs[0]), LONG_DELAY));
          //updateTabs();
          //sizeBrowserToBounds(state.viewState.canvasEl, state.tabs[0].targetId);
        }
      }

      subviews.Controls(state);
      subviews.TabList(state);

      if (state.tabs.length == 0) {
        indicateNoOpenTabs();
      }

      while (state.updateTabsTasks.length) {
        const task = state.updateTabsTasks.shift();

        try {
          task();
        } catch (e) {
          console.warn("State update tabs task failed", e, task);
        }
      }
    }

    async function createTab(click) {
      let url = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : BLANK;
      queue.send({
        command: {
          name: "Target.createTarget",
          params: {
            url,
            enableBeginFrameControl: DEBUG.frameControl
          }
        }
      });

      if (click) {
        click.target.blur();
        click.currentTarget.blur();
      }
    }

    function canKeysInput() {
      if (state.viewState.viewFrameEl) return;
      setTimeout(() => {
        queue.send({
          type: "canKeysInput",
          synthetic: true
        });
      }, SHORT_DELAY);
    }

    function getFavicon() {
      setTimeout(() => {
        queue.send({
          type: "getFavicon",
          synthetic: true
        });
      }, IMMEDIATE);
    }

    function loadPlugin(plugin) {
      plugins.set(plugin.name, plugin);
      plugin.load(pluginView);
    }

    function
      /*...events*/
    addToQueue() {
      console.warn("Unimplemented");
    }

    function
      /*pluginRenderedView*/
    requestRender() {
      console.warn("Unimplemented");
    }

    function
      /*name, listener*/
    subscribeToQueue() {
      console.warn("Unimplemented");
    }
  }
  function cloneKeyEvent(event, vRetargeted) {
    return {
      type: event.type,
      keyCode: event.keyCode,
      key: event.key,
      code: event.code,
      altKey: event.altKey,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      shiftKey: event.shiftKey,
      vRetargeted
    };
  }

  function Voodoo() {
    let {
      api,
      translator,
      image,
      useViewFrame = false,
      demoMode = false
    } = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    let selector = arguments.length > 1 ? arguments[1] : undefined;
    let position = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'beforeEnd';
    let root;

    if (!selector) {
      //console.warn(`Did not specify a root to attach to. Assuming it's the first found from either the body tag, or the document element.`);
      root = document.body || document.documentElement;
    } else if (typeof selector == "string") {
      root = document.querySelector(selector);
    } else if (selector instanceof HTMLElement) {
      root = selector;
    }

    if (useViewFrame) {
      console.log("Using a view frame instead of a canvas.");
    } else {
      if (!image) {
        //console.warn(`Did not specify an image to act as the screen, searching for one descending from root`);
        image = root.querySelector('img');

        if (!image) {
          //console.warn(`No image found! Creating one...`);
          image = new Image();
          root.appendChild(image);
        }
      } else if (typeof image == "string") {
        root = document.querySelector(image);
      } else if (!(image instanceof HTMLImageElement)) {
        throw new TypeError("A valid image was not found");
      }

      image.style.display = 'none';
    }

    if (!api) {
      // assume the root api is same
      // but warn
      //console.warn(`Did not specify an API, assuming it's ${location}`);
      api = location.href;
    }

    if (!translator) {
      //console.warn(`Did not specify a translator, will send RAW Voodoo commands to API`);
      translator = e => e;
    }

    return voodoo(root, position, {
      useViewFrame,
      demoMode,
      preInstallTasks: [poppet => poppet.queue.addSubscriber(api, translator, image)],
      postInstallTasks: []
    });
  }

  const sessionToken = location.hash && location.hash.slice(1);
  function getAPI() {
    const api = new URL(location);
    api.hash = '';
    api.search = "session_token=".concat(sessionToken);
    api.protocol = api.protocol == 'https:' ? 'wss:' : 'ws:';
    let url = api.href + '';
    const hashIndex = url.indexOf('#');

    if (hashIndex >= 0) {
      url = url.slice(0, hashIndex);
    }

    return url;
  }

  start_app();

  async function start_app() {
    const useViewFrame = false;
    const translator$1 = translator;
    const voodoo = await Voodoo({
      api: getAPI(),
      translator: translator$1,
      useViewFrame
    });
    self.voodoo = voodoo;
    return voodoo;
  }

})();
