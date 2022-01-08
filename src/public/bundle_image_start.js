"use strict";

function _defineProperty2(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _toArray(arr) { return _arrayWithHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e2) { throw _e2; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e3) { didErr = true; err = _e3; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

(function () {
  'use strict';

  function handleSelectMessage(_ref, state) {
    var _ref$selectInput = _ref.selectInput,
        selectOpen = _ref$selectInput.selectOpen,
        values = _ref$selectInput.values,
        executionContextId = _ref.executionContextId;
    state.waitingExecutionContext = executionContextId;
    if (state.ignoreSelectInputEvents) return;
    toggleSelect({
      selectOpen: selectOpen,
      values: values
    });
  }

  function toggleSelect(_ref2) {
    var selectOpen = _ref2.selectOpen,
        values = _ref2.values;
    var input = document.querySelector('#selectinput');

    if (selectOpen) {
      input.innerHTML = values;
      input.classList.add('open'); //input.focus();
    } else {
      input.classList.remove('open');
      input.innerHTML = ""; //input.blur();
    }
  }
  /* eslint-disable no-useless-escape */


  var keys = {
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
      'key': "\0",
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
    "\0": {
      'keyCode': 46,
      'key': "\0",
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
  var FRAME_CONTROL = false;
  var WorldName = 'PlanetZanj';
  var SHORT_TIMEOUT = 1000;
  var MIN_DELTA = 40;
  var MIN_PIX_DELTA = 8;
  var THRESHOLD_DELTA = 1;
  var DOM_DELTA_PIXEL = 0;
  var DOM_DELTA_LINE = 1;
  var DOM_DELTA_PAGE = 2;
  var LINE_HEIGHT_GUESS = 32;

  var SYNTHETIC_CTRL = function SYNTHETIC_CTRL(e) {
    return keyEvent({
      key: 'Control',
      originalType: e.originalType
    }, 2, true);
  };

  function translator(e) {
    var handled = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
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
          var button = "none";

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
                button: button,
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
          var deltaMode = e.originalEvent.deltaMode;
          var deltaX = adjustWheelDeltaByMode(e.originalEvent.deltaX, deltaMode);
          var deltaY = adjustWheelDeltaByMode(e.originalEvent.deltaY, deltaMode);
          var contextId = e.contextId;
          var clientX = 0;
          var clientY = 0;
          var deltas = {
            deltaX: deltaX,
            deltaY: deltaY,
            clientX: clientX,
            clientY: clientY
          };
          var retVal;

          if (deltaX > MIN_DELTA || deltaY > MIN_DELTA) {
            var retVal1 = {
              command: {
                name: "Runtime.evaluate",
                params: {
                  expression: "self.ensureScroll(".concat(JSON.stringify(deltas), ");"),
                  includeCommandLineAPI: false,
                  userGesture: true,
                  contextId: contextId,
                  timeout: SHORT_TIMEOUT
                }
              }
            };
            var retVal2 = mouseEvent(e, deltaX, deltaY);
            retVal = [retVal1, retVal2];
          } else {
            retVal = mouseEvent(e, deltaX, deltaY);
          }

          return retVal;
        }

      case "auth-response":
        {
          var _requestId = e.requestId,
              authResponse = e.authResponse;
          return {
            command: {
              name: "Fetch.continueWithAuth",
              params: {
                requestId: _requestId,
                authChallengeResponse: authResponse
              }
            }
          };
        }

      case "resample-imagery":
        {
          var down = e.down,
              up = e.up,
              averageBw = e.averageBw;
          return {
            command: {
              isZombieLordCommand: true,
              name: "Connection.resampleImagery",
              params: {
                averageBw: averageBw,
                down: down,
                up: up
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
              var text = e.key;
              return {
                command: {
                  name: "Input.insertText",
                  params: {
                    text: text
                  },
                  requiresShot: true,
                  ignoreHash: true
                }
              };
            } else return;
          } else if (e.key == "Unidentified") {
            if (e.code.length) {
              var _text = e.code;
              return {
                command: {
                  name: "Input.insertText",
                  params: {
                    text: _text
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
          var frameId = e.frameId,
              sessionId = e.sessionId,
              html = e.html;

          if (frameId) {
            return {
              command: {
                name: "Page.setDocumentContent",
                params: {
                  html: html,
                  frameId: frameId,
                  sessionId: sessionId
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
              }, function (_ref) {
                var frameId = _ref.frameTree.frame.id;
                return {
                  command: {
                    name: "Page.setDocumentContent",
                    params: {
                      html: html,
                      frameId: frameId
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
                  }, function (_ref2) {
                    var currentIndex = _ref2.currentIndex,
                        entries = _ref2.entries;
                    var intendedEntry = entries[currentIndex + (e.action == "back" ? -1 : +1)];

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
          var _deltaX = e.deltaX,
              _deltaY = e.deltaY,
              _clientX = e.bitmapX,
              _clientY = e.bitmapY,
              _contextId = e.contextId; // only one scroll direction at a time

          if (Math.abs(_deltaY) > Math.abs(_deltaX)) {
            _deltaX = 0;

            if (Math.abs(_deltaY) > 0.2 * self.ViewportHeight) {
              _deltaY = Math.round(5.718 * _deltaY);
            }
          } else {
            _deltaY = 0;

            if (Math.abs(_deltaX) > 0.3 * self.ViewportWidth) {
              _deltaX = Math.round(5.718 * _deltaX);
            }
          }

          _clientX = Math.round(_clientX);
          _clientY = Math.round(_clientY);
          var _deltas = {
            deltaX: _deltaX,
            deltaY: _deltaY,
            clientX: _clientX,
            clientY: _clientY
          };
          var _retVal = {
            command: {
              name: "Runtime.evaluate",
              params: {
                expression: "self.ensureScroll(".concat(JSON.stringify(_deltas), ");"),
                includeCommandLineAPI: false,
                userGesture: true,
                contextId: _contextId,
                timeout: SHORT_TIMEOUT
              }
            }
          };

          var _retVal2 = mouseEvent(e, _deltaX, _deltaY);

          var _retVal3 = [_retVal, _retVal2];
          return _retVal3;
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
          var _retVal4 = {
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
          return _retVal4;
        }

      case "select":
        {
          var _retVal5 = {
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
          return _retVal5;
        }

      case "window-bounds":
        {
          var width = e.width,
              height = e.height,
              targetId = e.targetId;
          width = parseInt(width);
          height = parseInt(height);
          var _retVal6 = {
            chain: [{
              command: {
                name: "Browser.getWindowForTarget",
                params: {
                  targetId: targetId
                }
              }
            }, function (_ref3) {
              var windowId = _ref3.windowId,
                  bounds = _ref3.bounds;
              if (bounds.width == width && bounds.height == height) return;
              var retVal = {
                command: {
                  name: "Browser.setWindowBounds",
                  params: {
                    windowId: windowId,
                    bounds: {
                      width: width,
                      height: height
                    }
                  },
                  requiresWindowId: true
                }
              };
              return retVal;
            }]
          };
          return _retVal6;
        }

      case "window-bounds-preImplementation":
        {
          var _width = e.width,
              _height = e.height,
              mobile = e.mobile;
          _width = parseInt(_width);
          _height = parseInt(_height);
          var _retVal7 = {
            command: {
              name: "Emulation.setDeviceMetricsOverride",
              params: {
                width: _width,
                height: _height,
                mobile: mobile,
                deviceScaleFactor: 1,
                screenOrientation: {
                  angle: 90,
                  type: 'landscapePrimary'
                }
              }
            },
            requiresShot: true
          };
          return _retVal7;
        }

      case "user-agent":
        {
          var userAgent = e.userAgent,
              platform = e.platform,
              acceptLanguage = e.acceptLanguage;
          var _retVal8 = {
            command: {
              name: "Network.setUserAgentOverride",
              params: {
                userAgent: userAgent,
                platform: platform,
                acceptLanguage: acceptLanguage
              }
            }
          };
          return _retVal8;
        }

      case "hide-scrollbars":
        {
          var _retVal9 = {
            command: {
              name: "Emulation.setScrollbarsHidden",
              params: {
                hidden: true
              }
            }
          };
          return _retVal9;
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
            }, function (_ref4) {
              var contextIds = _ref4.contextIds;
              return contextIds.map(function (contextId) {
                return {
                  command: {
                    name: "Runtime.evaluate",
                    params: {
                      expression: "canKeysInput();",
                      contextId: contextId,
                      timeout: SHORT_TIMEOUT
                    }
                  }
                };
              });
            }]
          };
        }

      case "describeNode":
        {
          var backendNodeId = e.backendNodeId;
          return {
            command: {
              name: "DOM.describeNode",
              params: {
                backendNodeId: backendNodeId
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
            }, function (_ref5) {
              var contextIds = _ref5.contextIds;
              return contextIds.map(function (contextId) {
                return {
                  command: {
                    name: "Runtime.evaluate",
                    params: {
                      expression: "getElementInfo(".concat(JSON.stringify(e.data), ");"),
                      contextId: contextId,
                      timeout: SHORT_TIMEOUT
                    }
                  }
                };
              });
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
            }, function (_ref6) {
              var sessionContextIdPairs = _ref6.sessionContextIdPairs;
              return sessionContextIdPairs.map(function (_ref7) {
                var sessionId = _ref7.sessionId,
                    contextId = _ref7.contextId;
                return {
                  command: {
                    name: "Runtime.evaluate",
                    params: {
                      sessionId: sessionId,
                      contextId: contextId,
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
            }, function (_ref8) {
              var browserContextId = _ref8.browserContextId;
              return {
                command: {
                  name: "Target.createTarget",
                  params: {
                    browserContextId: browserContextId,
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
            }, function (_ref9) {
              var sessionIds = _ref9.sessionIds;
              return sessionIds.map(function (sessionId) {
                return {
                  command: {
                    name: "Page.resetNavigationHistory",
                    params: {
                      sessionId: sessionId
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
          var accept = false;
          var response = e.response,
              _sessionId = e.sessionId,
              promptText = e.promptText;

          if (response == "ok") {
            accept = true;
          }

          return {
            command: {
              name: "Page.handleJavaScriptDialog",
              params: {
                accept: accept,
                promptText: promptText,
                sessionId: _sessionId
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
    var deltaX = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    var deltaY = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
    return {
      command: {
        name: "Input.dispatchMouseEvent",
        params: {
          x: Math.round(e.bitmapX),
          y: Math.round(e.bitmapY),
          type: "mouseWheel",
          deltaX: deltaX,
          deltaY: deltaY
        },
        requiresShot: true
      }
    };
  }

  function keyEvent(e) {
    var modifiers = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    var SYNTHETIC = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    var id = e.key && e.key.length > 1 ? e.key : e.code;
    var def = keys[id];
    var text = e.originalType == "keypress" ? String.fromCharCode(e.keyCode) : undefined;
    modifiers = modifiers || encodeModifiers(e.originalEvent);
    var type;

    if (e.originalType == "keydown") {
      if (text) type = "keyDown";else type = "rawKeyDown";
    } else if (e.originalType == "keypress") {
      type = "char";
    } else {
      type = "keyUp";
    }

    var retVal = {
      command: {
        name: "Input.dispatchKeyEvent",
        params: {
          type: type,
          text: text,
          unmodifiedText: text,
          code: def.code,
          key: def.key,
          windowsVirtualKeyCode: e.keyCode,
          modifiers: modifiers
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
    var modifiers = 0;

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
    var threshold = Math.abs(delta) > THRESHOLD_DELTA;

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

  var SafariPlatform = /^((?!chrome|android).)*safari/i;
  var MobilePlatform = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  var FirefoxPlatform = /firefox/i;

  var iden = function iden(e) {
    return e;
  };

  var isSafari = function isSafari() {
    return SafariPlatform.test(navigator.userAgent);
  };

  var BLANK = "about:blank";
  var DEBUG = {
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

  function sleep(_x) {
    return _sleep.apply(this, arguments);
  }

  function _sleep() {
    _sleep = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee9(ms) {
      return regeneratorRuntime.wrap(function _callee9$(_context9) {
        while (1) {
          switch (_context9.prev = _context9.next) {
            case 0:
              return _context9.abrupt("return", new Promise(function (res) {
                return setTimeout(res, ms);
              }));

            case 1:
            case "end":
              return _context9.stop();
          }
        }
      }, _callee9);
    }));
    return _sleep.apply(this, arguments);
  }

  function debounce(func, wait) {
    var timeout;
    return function () {
      var _this = this;

      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      var later = function later() {
        timeout = null;
        func.apply(_this, args);
      };

      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  } // leading edge throttle


  function throttle(func, wait) {
    var timeout;

    var throttled = function throttled() {
      if (!timeout) {
        timeout = setTimeout(function () {
          return timeout = false;
        }, wait);
        return func.apply(void 0, arguments);
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


  var tabNumbers = new Map();
  var TabNumber = 1;

  function fetchTabs(_x2) {
    return _fetchTabs.apply(this, arguments);
  }

  function _fetchTabs() {
    _fetchTabs = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee10(_ref) {
      var sessionToken, url, resp, data, _reload4, x, _reload5;

      return regeneratorRuntime.wrap(function _callee10$(_context10) {
        while (1) {
          switch (_context10.prev = _context10.next) {
            case 0:
              sessionToken = _ref.sessionToken;
              _context10.prev = 1;
              url = new URL(location);
              url.pathname = '/api/v1/tabs';
              _context10.next = 6;
              return fetch(url);

            case 6:
              resp = _context10.sent;

              if (!resp.ok) {
                _context10.next = 18;
                break;
              }

              _context10.next = 10;
              return resp.json();

            case 10:
              data = _context10.sent;

              if (data.error) {
                if (data.resetRequired) {
                  _reload4 = confirm("Some errors occurred and we can't seem to reach your cloud browser. You can try reloading the page and if the problem persists, try switching your cloud browser off then on again. Want to reload the page now?");
                  if (_reload4) location.reload();
                }
              }

              data.tabs = (data.tabs || []).filter(function (_ref2) {
                var type = _ref2.type;
                return type == 'page';
              }); // FIX for #36 ? 
              // note: this does *not* work because new tabs can be inserted anywhere
              // data.tabs.reverse();

              data.tabs.forEach(function (tab) {
                if (!tabNumbers.has(tab.targetId)) {
                  tabNumbers.set(tab.targetId, TabNumber++);
                }

                tab.number = tabNumbers.get(tab.targetId);
              });
              data.tabs.sort(function (a, b) {
                return a.number - b.number;
              });
              return _context10.abrupt("return", data);

            case 18:
              if (!(resp.status == 401)) {
                _context10.next = 30;
                break;
              }

              console.warn("Session has been cleared. Let's attempt relogin", sessionToken);

              if (!DEBUG.blockAnotherReset) {
                _context10.next = 22;
                break;
              }

              return _context10.abrupt("return");

            case 22:
              DEBUG.blockAnotherReset = true;
              x = new URL(location);
              x.pathname = 'login';
              x.search = "token=".concat(sessionToken, "&ran=").concat(Math.random());
              alert("Your browser cleared your session. We need to reload the page to refresh it.");
              DEBUG.delayUnload = false;
              location.href = x;
              return _context10.abrupt("return");

            case 30:
              _context10.next = 37;
              break;

            case 32:
              _context10.prev = 32;
              _context10.t0 = _context10["catch"](1);
              console.warn(_context10.t0);
              _reload5 = confirm("Some errors occurred and we can't seem to reach your cloud browser. You can try reloading the page and if the problem persists, try switching your cloud browser off then on again. Want to reload the page now?");
              if (_reload5) location.reload();

            case 37:
            case "end":
              return _context10.stop();
          }
        }
      }, _callee10, null, [[1, 32]]);
    }));
    return _fetchTabs.apply(this, arguments);
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

  var defineProperty = _defineProperty;

  function ownKeys(object, enumerableOnly) {
    var keys = Object.keys(object);

    if (Object.getOwnPropertySymbols) {
      var symbols = Object.getOwnPropertySymbols(object);
      enumerableOnly && (symbols = symbols.filter(function (sym) {
        return Object.getOwnPropertyDescriptor(object, sym).enumerable;
      })), keys.push.apply(keys, symbols);
    }

    return keys;
  }

  function _objectSpread(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = null != arguments[i] ? arguments[i] : {};
      i % 2 ? ownKeys(Object(source), !0).forEach(function (key) {
        defineProperty(target, key, source[key]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }

    return target;
  }

  var DemoTab = function DemoTab() {
    return {
      targetId: 'demo1' + Math.random(),
      browserContextId: 'demobrowser1',
      title: 'Dosy Browser',
      type: 'page',
      url: 'payment://signup-to-dosy-browser.html'
    };
  };

  var dontFocus = true;
  var runFuncs = ['installFormSubmitButtonHandler', 'installStripeButton'];
  var opts = {
    dontFocus: dontFocus,
    runFuncs: runFuncs
  };
  var started = new Set();
  var tab = DemoTab();
  var tabs = [tab];
  var requestId = 1;
  var messageId$1 = 1;

  function fetchDemoTabs() {
    return _fetchDemoTabs.apply(this, arguments);
  }

  function _fetchDemoTabs() {
    _fetchDemoTabs = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee11() {
      return regeneratorRuntime.wrap(function _callee11$(_context11) {
        while (1) {
          switch (_context11.prev = _context11.next) {
            case 0:
              requestId++;
              tab = tab || tabs[0];
              return _context11.abrupt("return", {
                tabs: tabs,
                activeTarget: tab && tab.targetId,
                requestId: requestId
              });

            case 3:
            case "end":
              return _context11.stop();
          }
        }
      }, _callee11);
    }));
    return _fetchDemoTabs.apply(this, arguments);
  }

  function demoZombie(_x3) {
    return _demoZombie.apply(this, arguments);
  }

  function _demoZombie() {
    _demoZombie = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee12(_ref) {
      var events, meta, _iterator16, _step16, event;

      return regeneratorRuntime.wrap(function _callee12$(_context12) {
        while (1) {
          switch (_context12.prev = _context12.next) {
            case 0:
              events = _ref.events;
              meta = [];
              _iterator16 = _createForOfIteratorHelper(events);
              _context12.prev = 3;

              _iterator16.s();

            case 5:
              if ((_step16 = _iterator16.n()).done) {
                _context12.next = 17;
                break;
              }

              event = _step16.value;
              _context12.t0 = meta.push;
              _context12.t1 = meta;
              _context12.t2 = _toConsumableArray;
              _context12.next = 12;
              return handleEvent(event);

            case 12:
              _context12.t3 = _context12.sent;
              _context12.t4 = (0, _context12.t2)(_context12.t3);

              _context12.t0.apply.call(_context12.t0, _context12.t1, _context12.t4);

            case 15:
              _context12.next = 5;
              break;

            case 17:
              _context12.next = 22;
              break;

            case 19:
              _context12.prev = 19;
              _context12.t5 = _context12["catch"](3);

              _iterator16.e(_context12.t5);

            case 22:
              _context12.prev = 22;

              _iterator16.f();

              return _context12.finish(22);

            case 25:
              messageId$1++;
              return _context12.abrupt("return", {
                data: [],
                frameBuffer: [],
                meta: meta,
                messageId: messageId$1
              });

            case 27:
            case "end":
              return _context12.stop();
          }
        }
      }, _callee12, null, [[3, 19, 22, 25]]);
    }));
    return _demoZombie.apply(this, arguments);
  }

  function handleEvent(_x4) {
    return _handleEvent.apply(this, arguments);
  }

  function _handleEvent() {
    _handleEvent = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee13(event) {
      var meta, command, meta1, meta2, jres, _jres, browserUrl, _meta2, _meta3;

      return regeneratorRuntime.wrap(function _callee13$(_context13) {
        while (1) {
          switch (_context13.prev = _context13.next) {
            case 0:
              meta = [];
              command = event.command;

              if (!(tab && !started.has(tab.targetId))) {
                _context13.next = 15;
                break;
              }

              started.add(tab.targetId);
              _context13.t0 = meta;
              _context13.t1 = _objectSpread;
              _context13.next = 8;
              return fetch("https://".concat(location.hostname, ":8001/demo-landing")).then(function (resp) {
                return resp.text();
              });

            case 8:
              _context13.t2 = _context13.sent;
              _context13.t3 = tab && tab.targetId;
              _context13.t4 = {
                open: _context13.t2,
                targetId: _context13.t3
              };
              _context13.t5 = opts;
              _context13.t6 = (0, _context13.t1)(_context13.t4, _context13.t5);
              _context13.t7 = {
                treeUpdate: _context13.t6
              };

              _context13.t0.push.call(_context13.t0, _context13.t7);

            case 15:
              _context13.t8 = command.name;
              _context13.next = _context13.t8 === "Target.createTarget" ? 18 : _context13.t8 === "Target.activateTarget" ? 32 : _context13.t8 === "Demo.formSubmission" ? 34 : 46;
              break;

            case 18:
              tab = DemoTab();
              tabs.push(tab);
              meta1 = {
                created: {
                  targetId: tab.targetId
                }
              };
              _context13.t9 = _objectSpread;
              _context13.next = 24;
              return fetch("https://".concat(location.hostname, ":8001/demo-landing")).then(function (resp) {
                return resp.text();
              });

            case 24:
              _context13.t10 = _context13.sent;
              _context13.t11 = tab.targetId;
              _context13.t12 = {
                open: _context13.t10,
                targetId: _context13.t11
              };
              _context13.t13 = opts;
              _context13.t14 = (0, _context13.t9)(_context13.t12, _context13.t13);
              meta2 = {
                treeUpdate: _context13.t14
              };
              meta.push(meta1, meta2);
              return _context13.abrupt("break", 46);

            case 32:
              tab = tabs.find(function (_ref2) {
                var targetId = _ref2.targetId;
                return targetId == command.params.targetId;
              });
              return _context13.abrupt("break", 46);

            case 34:
              try {
                jres = JSON.parse(event.result);
              } catch (e) {}

              if (!(!!jres && !!jres.browserUrl)) {
                _context13.next = 43;
                break;
              }

              _jres = jres, browserUrl = _jres.browserUrl;
              _meta2 = {
                topRedirect: {
                  browserUrl: browserUrl,
                  targetId: tab && tab.targetId
                }
              };
              _context13.next = 40;
              return sleep(5000);

            case 40:
              meta.push(_meta2);
              _context13.next = 45;
              break;

            case 43:
              _meta3 = {
                treeUpdate: _objectSpread({
                  open: event.result,
                  targetId: tab && tab.targetId
                }, opts)
              };
              meta.push(_meta3);

            case 45:
              return _context13.abrupt("break", 46);

            case 46:
              return _context13.abrupt("return", meta);

            case 47:
            case "end":
              return _context13.stop();
          }
        }
      }, _callee13);
    }));
    return _handleEvent.apply(this, arguments);
  }

  function handleKeysCanInputMessage(_ref, state) {
    var _ref$keyInput = _ref.keyInput,
        keysCanInput = _ref$keyInput.keysCanInput,
        isTextareaOrContenteditable = _ref$keyInput.isTextareaOrContenteditable,
        type = _ref$keyInput.type,
        inputmode = _ref$keyInput.inputmode,
        _ref$keyInput$value = _ref$keyInput.value,
        value = _ref$keyInput$value === void 0 ? '' : _ref$keyInput$value,
        executionContextId = _ref.executionContextId;
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
        var active = document.activeElement;

        if (active == state.viewState.textarea) {
          state.viewState.blurTextarea();
        } else if (active == state.viewState.keyinput) {
          state.viewState.blurKeyinput();
        }
      }
    }
  }

  function handleElementInfo(_ref, state) {
    var _ref$elementInfo = _ref.elementInfo,
        attributes = _ref$elementInfo.attributes,
        innerText = _ref$elementInfo.innerText,
        noSuchElement = _ref$elementInfo.noSuchElement;

    if (!state.elementInfoContinuation) {
      console.warn("Got element info message, but no continuation to pass it to");
      console.warn(JSON.stringify({
        elementInfo: {
          attributes: attributes,
          innerText: innerText,
          noSuchElement: noSuchElement
        }
      }));
      return;
    }

    try {
      state.elementInfoContinuation({
        attributes: attributes,
        innerText: innerText,
        noSuchElement: noSuchElement
      });
    } catch (e) {
      console.warn("Element info continueation failed", state.elementInfoContinuation, e);
      console.warn(JSON.stringify({
        elementInfo: {
          attributes: attributes,
          innerText: innerText,
          noSuchElement: noSuchElement
        }
      }));
    }
  }

  function handleScrollNotification(_ref, state) {
    var executionContextId = _ref.executionContextId;
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

  var taggedTemplateLiteral = _taggedTemplateLiteral; // common for all r submodules

  var CODE = '' + Math.random();

  var _templateObject$e, _templateObject2$9, _templateObject3$8, _templateObject4$5, _templateObject5$4, _templateObject6$3, _templateObject7$3;

  var BuiltIns$1 = [Symbol, Boolean, Number, String, Object, Set, Map, WeakMap, WeakSet, Uint8Array, Uint16Array, Uint32Array, Float32Array, Float64Array, Int8Array, Int16Array, Int32Array, Uint8ClampedArray, Node, NodeList, Element, HTMLElement, Blob, ArrayBuffer, FileList, Text, HTMLDocument, Document, DocumentFragment, Error, File, Event, EventTarget, URL];
  var SEALED_DEFAULT$1 = true;

  var isNone$1 = function isNone$1(instance) {
    return instance == null || instance == undefined;
  };

  var typeCache$1 = new Map();
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

  T$1[Symbol["for"]('jtype-system.typeCache')] = typeCache$1;
  defineSpecials$1();
  mapBuiltins$1();

  function T$1(parts) {
    for (var _len = arguments.length, vals = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      vals[_key - 1] = arguments[_key];
    }

    var cooked = vals.reduce(function (prev, cur, i) {
      return prev + cur + parts[i + 1];
    }, parts[0]);
    var typeName = cooked;
    if (!typeCache$1.has(typeName)) throw new TypeError("Cannot use type ".concat(typeName, " before it is defined."));
    return typeCache$1.get(typeName).type;
  }

  function partialMatch$1(type, instance) {
    return validate$1(type, instance, {
      partial: true
    });
  }

  function validate$1(type, instance) {
    var _ref16 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
        _ref16$partial = _ref16.partial,
        partial = _ref16$partial === void 0 ? false : _ref16$partial;

    guardType$1(type);
    guardExists$1(type);
    var typeName = type.name;

    var _typeCache$1$get = typeCache$1.get(typeName),
        spec = _typeCache$1$get.spec,
        kind = _typeCache$1$get.kind,
        help = _typeCache$1$get.help,
        verify = _typeCache$1$get.verify,
        verifiers = _typeCache$1$get.verifiers,
        sealed = _typeCache$1$get.sealed;

    var specKeyPaths = spec ? allKeyPaths$1(spec).sort() : [];
    var specKeyPathSet = new Set(specKeyPaths);
    var bigErrors = [];

    switch (kind) {
      case "def":
        {
          var allValid = true;

          if (spec) {
            var keyPaths = partial ? allKeyPaths$1(instance, specKeyPathSet) : specKeyPaths;
            allValid = !isNone$1(instance) && keyPaths.every(function (kp) {
              // Allow lookup errors if the type match for the key path can include None
              var _lookup$ = lookup$1(instance, kp, function () {
                return checkTypeMatch$1(lookup$1(spec, kp).resolved, T$1(_templateObject$e || (_templateObject$e = taggedTemplateLiteral(["None"]))));
              }),
                  resolved = _lookup$.resolved,
                  lookupErrors = _lookup$.errors;

              bigErrors.push.apply(bigErrors, _toConsumableArray(lookupErrors));
              if (lookupErrors.length) return false;
              var keyType = lookup$1(spec, kp).resolved;

              if (!keyType || !(keyType instanceof Type$1)) {
                bigErrors.push({
                  error: "Key path '".concat(kp, "' is not present in the spec for type '").concat(typeName, "'")
                });
                return false;
              }

              var _validate$ = validate$1(keyType, resolved),
                  valid = _validate$.valid,
                  validationErrors = _validate$.errors;

              bigErrors.push.apply(bigErrors, _toConsumableArray(validationErrors));
              return valid;
            });
          }

          var verified = true;

          if (partial && !spec && !!verify) {
            throw new TypeError("Type checking with option 'partial' is not a valid option for types that" + " only use a verify function but have no spec");
          } else if (verify) {
            try {
              verified = verify(instance);

              if (!verified) {
                if (verifiers) {
                  throw {
                    error: "Type ".concat(typeName, " value '").concat(JSON.stringify(instance), "' violated at least 1 verify function in:\n").concat(verifiers.map(function (f) {
                      return '\t' + (f.help || '') + ' (' + f.verify.toString() + ')';
                    }).join('\n'))
                  };
                } else if (type.isSumType) {
                  throw {
                    error: "Value '".concat(JSON.stringify(instance), "' did not match any of: ").concat(_toConsumableArray(type.types.keys()).map(function (t) {
                      return t.name;
                    })),
                    verify: verify,
                    verifiers: verifiers
                  };
                } else {
                  var helpMsg = '';

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

          var sealValid = true;

          if (!!sealed && !!spec) {
            var type_key_paths = specKeyPaths;
            var all_key_paths = allKeyPaths$1(instance, specKeyPathSet).sort();
            sealValid = all_key_paths.join(',') == type_key_paths.join(',');

            if (!sealValid) {
              if (all_key_paths.length < type_key_paths.length) {
                sealValid = true;
              } else {
                var errorKeys = [];
                var tkp = new Set(type_key_paths);

                var _iterator = _createForOfIteratorHelper(all_key_paths),
                    _step;

                try {
                  for (_iterator.s(); !(_step = _iterator.n()).done;) {
                    var k = _step.value;

                    if (!tkp.has(k)) {
                      errorKeys.push({
                        error: "Key path '".concat(k, "' is not in the spec for type ").concat(typeName)
                      });
                    }
                  }
                } catch (err) {
                  _iterator.e(err);
                } finally {
                  _iterator.f();
                }

                if (errorKeys.length) {
                  bigErrors.push.apply(bigErrors, errorKeys);
                }
              }
            }
          }

          return {
            valid: allValid && verified && sealValid,
            errors: bigErrors,
            partial: partial
          };
        }

      case "defCollection":
        {
          var _validate$2 = validate$1(spec.container, instance),
              containerValid = _validate$2.valid,
              containerErrors = _validate$2.errors;

          var membersValid = true;
          var _verified = true;
          bigErrors.push.apply(bigErrors, _toConsumableArray(containerErrors));

          if (partial) {
            throw new TypeError("Type checking with option 'partial' is not a valid option for Collection types");
          } else {
            if (containerValid) {
              membersValid = _toConsumableArray(instance).every(function (member) {
                var _validate$3 = validate$1(spec.member, member),
                    valid = _validate$3.valid,
                    errors = _validate$3.errors;

                bigErrors.push.apply(bigErrors, _toConsumableArray(errors));
                return valid;
              });
            }

            if (verify) {
              try {
                _verified = verify(instance);
              } catch (e) {
                bigErrors.push(e);
                _verified = false;
              }
            }
          }

          return {
            valid: containerValid && membersValid && _verified,
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
    return validate$1.apply(void 0, arguments).valid;
  }

  function lookup$1(obj, keyPath, canBeNone) {
    if (isNone$1(obj)) throw new TypeError("Lookup requires a non-unset object.");
    if (!keyPath) throw new TypeError("keyPath must not be empty");
    var keys = keyPath.split(/\./g);
    var pathComplete = [];
    var errors = [];
    var resolved = obj;

    while (keys.length) {
      var nextKey = keys.shift();
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
      resolved: resolved,
      errors: errors
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
    } else if (typeA.name.startsWith('?') && typeB == T$1(_templateObject2$9 || (_templateObject2$9 = taggedTemplateLiteral(["None"])))) {
      return true;
    } else if (typeB.name.startsWith('?') && typeA == T$1(_templateObject3$8 || (_templateObject3$8 = taggedTemplateLiteral(["None"])))) {
      return true;
    }

    if (typeA.name.startsWith('>') || typeB.name.startsWith('>')) {
      console.error(new Error("Check type match has not been implemented for derived//sub types yet."));
    }

    return false;
  }

  function option$1(type) {
    return T$1(_templateObject4$5 || (_templateObject4$5 = taggedTemplateLiteral(["?", ""])), type.name);
  }

  function sub$1(type) {
    return T$1(_templateObject5$4 || (_templateObject5$4 = taggedTemplateLiteral([">", ""])), type.name);
  }

  function defSub$1(type, spec) {
    var _ref17 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
        _ref17$verify = _ref17.verify,
        verify = _ref17$verify === void 0 ? undefined : _ref17$verify,
        _ref17$help = _ref17.help,
        help = _ref17$help === void 0 ? '' : _ref17$help;

    var name = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : '';
    guardType$1(type);
    guardExists$1(type);
    var verifiers;

    if (!verify) {
      verify = function verify() {
        return true;
      };
    }

    if (type["native"]) {
      verifiers = [{
        help: help,
        verify: verify
      }];

      verify = function verify(i) {
        return i instanceof type["native"];
      };

      var helpMsg = "Needs to be of type ".concat(type["native"].name, ". ").concat(help || '');
      verifiers.push({
        help: helpMsg,
        verify: verify
      });
    }

    var newType = def$1("".concat(name, ">").concat(type.name), spec, {
      verify: verify,
      help: help,
      verifiers: verifiers
    });
    return newType;
  }

  function defEnum$1(name) {
    if (!name) throw new TypeError("Type must be named.");
    guardRedefinition$1(name);

    for (var _len2 = arguments.length, values = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
      values[_key2 - 1] = arguments[_key2];
    }

    var valueSet = new Set(values);

    var verify = function verify(i) {
      return valueSet.has(i);
    };

    var help = "Value of Enum type ".concat(name, " must be one of ").concat(values.join(','));
    return def$1(name, null, {
      verify: verify,
      help: help
    });
  }

  function exists$1(name) {
    return typeCache$1.has(name);
  }

  function guardRedefinition$1(name) {
    if (exists$1(name)) throw new TypeError("Type ".concat(name, " cannot be redefined."));
  }

  function allKeyPaths$1(o, specKeyPaths) {
    var isTypeSpec = !specKeyPaths;
    var keyPaths = new Set();
    return recurseObject(o, keyPaths, '');

    function recurseObject(o, keyPathSet) {
      var lastLevel = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';
      var levelKeys = Object.getOwnPropertyNames(o);
      var keyPaths = levelKeys.map(function (k) {
        return lastLevel + (lastLevel.length ? '.' : '') + k;
      });
      levelKeys.forEach(function (k, i) {
        var v = o[k];

        if (isTypeSpec) {
          if (v instanceof Type$1) {
            keyPathSet.add(keyPaths[i]);
          } else if (_typeof(v) == "object") {
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
          } else if (_typeof(v) == "object") {
            if (!Array.isArray(v)) {
              recurseObject(v, keyPathSet, keyPaths[i]);
            } else {
              v.forEach(function (item, index) {
                return recurseObject(item, keyPathSet, keyPaths[i] + '.' + index);
              }); //throw new TypeError(`We don't support Instances that use Arrays as structure, just yet.`); 
            }
          } else {
            //console.warn("Spec has no such key",  keyPaths[i]);
            keyPathSet.add(keyPaths[i]);
          }
        }
      });
      return _toConsumableArray(keyPathSet);
    }
  }

  function defOption$1(type) {
    guardType$1(type);
    var typeName = type.name;
    return T$1.def("?".concat(typeName), null, {
      verify: function verify(i) {
        return isUnset$1(i) || T$1.check(type, i);
      }
    });
  }

  function maybe$1(type) {
    try {
      return defOption$1(type);
    } catch (e) {// console.log(`Option Type ${type.name} already declared.`, e);
    }

    return T$1(_templateObject6$3 || (_templateObject6$3 = taggedTemplateLiteral(["?", ""])), type.name);
  }

  function verify$2() {
    return check$1.apply(void 0, arguments);
  }

  function defCollection$1(name, _ref) {
    var container = _ref.container,
        member = _ref.member;

    var _ref18 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
        _ref18$sealed = _ref18.sealed,
        sealed = _ref18$sealed === void 0 ? SEALED_DEFAULT$1 : _ref18$sealed,
        _ref18$verify = _ref18.verify,
        verify = _ref18$verify === void 0 ? undefined : _ref18$verify;

    if (!name) throw new TypeError("Type must be named.");
    if (!container || !member) throw new TypeError("Type must be specified.");
    guardRedefinition$1(name);
    var kind = 'defCollection';
    var t = new Type$1(name);
    var spec = {
      kind: kind,
      spec: {
        container: container,
        member: member
      },
      verify: verify,
      sealed: sealed,
      type: t
    };
    typeCache$1.set(name, spec);
    return t;
  }

  function defTuple$1(name, _ref2) {
    var pattern = _ref2.pattern;
    if (!name) throw new TypeError("Type must be named.");
    if (!pattern) throw new TypeError("Type must be specified.");
    var kind = 'def';
    var specObj = {};
    pattern.forEach(function (type, key) {
      return specObj[key] = type;
    });
    var t = new Type$1(name);
    var spec = {
      kind: kind,
      spec: specObj,
      type: t
    };
    typeCache$1.set(name, spec);
    return t;
  }

  function Type$1(name) {
    var mods = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    if (!(this instanceof Type$1 ? this.constructor : void 0)) throw new TypeError("Type with new only.");
    Object.defineProperty(this, 'name', {
      get: function get() {
        return name;
      }
    });
    this.typeName = name;

    if (mods.types) {
      var types = mods.types;
      var typeSet = new Set(types);
      Object.defineProperty(this, 'isSumType', {
        get: function get() {
          return true;
        }
      });
      Object.defineProperty(this, 'types', {
        get: function get() {
          return typeSet;
        }
      });
    }

    if (mods["native"]) {
      var _native = mods["native"];
      Object.defineProperty(this, 'native', {
        get: function get() {
          return _native;
        }
      });
    }
  }

  Type$1.prototype.toString = function () {
    return "".concat(this.typeName, " Type");
  };

  function def$1(name, spec) {
    var _ref19 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
        _ref19$help = _ref19.help,
        help = _ref19$help === void 0 ? '' : _ref19$help,
        _ref19$verify = _ref19.verify,
        verify = _ref19$verify === void 0 ? undefined : _ref19$verify,
        _ref19$sealed = _ref19.sealed,
        sealed = _ref19$sealed === void 0 ? undefined : _ref19$sealed,
        _ref19$types = _ref19.types,
        types = _ref19$types === void 0 ? undefined : _ref19$types,
        _ref19$verifiers = _ref19.verifiers,
        verifiers = _ref19$verifiers === void 0 ? undefined : _ref19$verifiers,
        _ref19$native = _ref19["native"],
        _native2 = _ref19$native === void 0 ? undefined : _ref19$native;

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

    var kind = 'def';

    if (sealed === undefined) {
      sealed = true;
    }

    var t = new Type$1(name, {
      types: types,
      "native": _native2
    });
    var cache = {
      spec: spec,
      kind: kind,
      help: help,
      verify: verify,
      verifiers: verifiers,
      sealed: sealed,
      types: types,
      "native": _native2,
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
      types: types,
      verify: function verify(i) {
        return types.some(function (t) {
          return check$1(t, i);
        });
      }
    });
  }

  function guard$1(type, instance) {
    guardType$1(type);
    guardExists$1(type);

    var _validate$4 = validate$1(type, instance),
        valid = _validate$4.valid,
        errors = _validate$4.errors;

    if (!valid) throw new TypeError("Type ".concat(type, " requested, but item is not of that type: ").concat(errors.join(', ')));
  }

  function guardType$1(t) {
    //console.log(t);
    if (!(t instanceof Type$1)) throw new TypeError("Type must be a valid Type object.");
  }

  function guardExists$1(t) {
    var name = originalName$1(t);
    if (!exists$1(name)) throw new TypeError("Type must exist. Type ".concat(name, " has not been defined."));
  }

  function errors$1() {
    return validate$1.apply(void 0, arguments).errors;
  }

  function mapBuiltins$1() {
    BuiltIns$1.forEach(function (t) {
      return def$1(originalName$1(t), null, {
        "native": t,
        verify: function verify(i) {
          return originalName$1(i.constructor) === originalName$1(t);
        }
      });
    });
    BuiltIns$1.forEach(function (t) {
      return defSub$1(T$1(_templateObject7$3 || (_templateObject7$3 = taggedTemplateLiteral(["", ""])), originalName$1(t)));
    });
  }

  function defineSpecials$1() {
    T$1.def("Any", null, {
      verify: function verify() {
        return true;
      }
    });
    T$1.def("Some", null, {
      verify: function verify(i) {
        return !isUnset$1(i);
      }
    });
    T$1.def("None", null, {
      verify: function verify(i) {
        return isUnset$1(i);
      }
    });
    T$1.def("Function", null, {
      verify: function verify(i) {
        return i instanceof Function;
      }
    });
    T$1.def("Integer", null, {
      verify: function verify(i) {
        return Number.isInteger(i);
      }
    });
    T$1.def("Array", null, {
      verify: function verify(i) {
        return Array.isArray(i);
      }
    });
    T$1.def("Iterable", null, {
      verify: function verify(i) {
        return i[Symbol.iterator] instanceof Function;
      }
    });
  }

  function isUnset$1(i) {
    return i === null || i === undefined;
  }

  function originalName$1(t) {
    if (!!t && t.name) {
      return t.name;
    }

    var oName = Object.prototype.toString.call(t).replace(/\[object |\]/g, '');

    if (oName.endsWith('Constructor')) {
      return oName.replace(/Constructor$/, '');
    }

    return oName;
  }

  var _templateObject$d, _templateObject2$8, _templateObject3$7, _templateObject4$4, _templateObject5$3, _templateObject6$2, _templateObject7$2, _templateObject8$1, _templateObject9$1, _templateObject10$1, _templateObject11$1, _templateObject12$1, _templateObject13$1, _templateObject14$1, _templateObject15$1, _templateObject16$1, _templateObject17$1, _templateObject18$1, _templateObject19$1, _templateObject20$1, _templateObject21$1, _templateObject22$1, _templateObject23$1, _templateObject24$1, _templateObject25$1, _templateObject26$1, _templateObject27, _templateObject28, _templateObject29, _templateObject30, _templateObject31, _templateObject32, _templateObject33;

  T$1.def('Key', {
    key: T$1.defOr('ValidKey', T$1(_templateObject$d || (_templateObject$d = taggedTemplateLiteral(["String"]))), T$1(_templateObject2$8 || (_templateObject2$8 = taggedTemplateLiteral(["Number"]))))
  });
  var THandlers = T$1.def('Handlers', null, {
    verify: function verify(i) {
      var validObject = T$1.check(T$1(_templateObject3$7 || (_templateObject3$7 = taggedTemplateLiteral(["Object"]))), i);
      if (!validObject) return false;
      var eventNames = Object.keys(i);
      var handlerFuncs = Object.values(i);
      var validNames = eventNames.every(function (name) {
        return T$1.check(T$1(_templateObject4$4 || (_templateObject4$4 = taggedTemplateLiteral(["String"]))), name);
      });
      var validFuncs = handlerFuncs.every(function (func) {
        return T$1.check(T$1(_templateObject5$3 || (_templateObject5$3 = taggedTemplateLiteral(["Function"]))), func);
      });
      var valid = validNames && validFuncs;
      return valid;
    }
  });
  T$1.defCollection('FuncArray', {
    container: T$1(_templateObject6$2 || (_templateObject6$2 = taggedTemplateLiteral(["Array"]))),
    member: T$1(_templateObject7$2 || (_templateObject7$2 = taggedTemplateLiteral(["Function"])))
  });
  T$1.def('EmptyArray', null, {
    verify: function verify(i) {
      return Array.isArray(i) && i.length == 0;
    }
  });
  T$1.def('MarkupObject', {
    type: T$1(_templateObject8$1 || (_templateObject8$1 = taggedTemplateLiteral(["String"]))),
    code: T$1(_templateObject9$1 || (_templateObject9$1 = taggedTemplateLiteral(["String"]))),
    nodes: T$1(_templateObject10$1 || (_templateObject10$1 = taggedTemplateLiteral(["Array"]))),
    externals: T$1(_templateObject11$1 || (_templateObject11$1 = taggedTemplateLiteral(["Array"])))
  }, {
    verify: function verify(v) {
      return v.type == 'MarkupObject' && v.code == CODE;
    }
  });
  T$1.def('MarkupAttrObject', {
    type: T$1(_templateObject12$1 || (_templateObject12$1 = taggedTemplateLiteral(["String"]))),
    code: T$1(_templateObject13$1 || (_templateObject13$1 = taggedTemplateLiteral(["String"]))),
    str: T$1(_templateObject14$1 || (_templateObject14$1 = taggedTemplateLiteral(["String"])))
  }, {
    verify: function verify(v) {
      return v.type == 'MarkupAttrObject' && v.code == CODE;
    }
  }); // Browser side

  T$1.def('BrutalLikeObject', {
    code: T$1(_templateObject15$1 || (_templateObject15$1 = taggedTemplateLiteral(["String"]))),
    externals: T$1(_templateObject16$1 || (_templateObject16$1 = taggedTemplateLiteral(["Array"]))),
    nodes: T$1(_templateObject17$1 || (_templateObject17$1 = taggedTemplateLiteral(["Array"]))),
    to: T$1(_templateObject18$1 || (_templateObject18$1 = taggedTemplateLiteral(["Function"]))),
    update: T$1(_templateObject19$1 || (_templateObject19$1 = taggedTemplateLiteral(["Function"]))),
    v: T$1(_templateObject20$1 || (_templateObject20$1 = taggedTemplateLiteral(["Array"]))),
    oldVals: T$1(_templateObject21$1 || (_templateObject21$1 = taggedTemplateLiteral(["Array"])))
  });
  T$1.def('BrutalObject', {
    code: T$1(_templateObject22$1 || (_templateObject22$1 = taggedTemplateLiteral(["String"]))),
    externals: T$1(_templateObject23$1 || (_templateObject23$1 = taggedTemplateLiteral(["Array"]))),
    nodes: T$1(_templateObject24$1 || (_templateObject24$1 = taggedTemplateLiteral(["Array"]))),
    to: T$1(_templateObject25$1 || (_templateObject25$1 = taggedTemplateLiteral(["Function"]))),
    update: T$1(_templateObject26$1 || (_templateObject26$1 = taggedTemplateLiteral(["Function"]))),
    v: T$1(_templateObject27 || (_templateObject27 = taggedTemplateLiteral(["Array"]))),
    oldVals: T$1(_templateObject28 || (_templateObject28 = taggedTemplateLiteral(["Array"])))
  }, {
    verify: function verify(v) {
      return verify$1(v);
    }
  });
  T$1.defCollection('BrutalArray', {
    container: T$1(_templateObject29 || (_templateObject29 = taggedTemplateLiteral(["Array"]))),
    member: T$1(_templateObject30 || (_templateObject30 = taggedTemplateLiteral(["BrutalObject"])))
  }); // SSR

  T$1.def('SBrutalObject', {
    str: T$1(_templateObject31 || (_templateObject31 = taggedTemplateLiteral(["String"]))),
    handlers: THandlers
  });
  T$1.defCollection('SBrutalArray', {
    container: T$1(_templateObject32 || (_templateObject32 = taggedTemplateLiteral(["Array"]))),
    member: T$1(_templateObject33 || (_templateObject33 = taggedTemplateLiteral(["SBrutalObject"])))
  }); // export

  function verify$1(v) {
    return CODE === v.code;
  }

  var _templateObject$c, _templateObject2$7, _templateObject3$6, _templateObject4$3, _templateObject5$2, _templateObject6$1, _templateObject7$1, _templateObject8, _templateObject9, _templateObject10, _templateObject11, _templateObject12, _templateObject13, _templateObject14, _templateObject15, _templateObject16, _templateObject17, _templateObject18, _templateObject19, _templateObject20, _templateObject21, _templateObject22, _templateObject23, _templateObject24, _templateObject25, _templateObject26;

  var skip = markup;
  var attrskip = attrmarkup; // constants

  var NULLFUNC = function NULLFUNC() {
    return void 0;
  };
  /* eslint-disable no-useless-escape */


  var KEYMATCH = /(?:<!\-\-)?(key\d+)(?:\-\->)?/gm;
  /* eslint-enable no-useless-escape */

  var ATTRMATCH = /\w+=/;
  var KEYLEN = 20;

  var XSS = function XSS() {
    return "Possible XSS / object forgery attack detected. " + "Object code could not be verified.";
  };

  var OBJ = function OBJ() {
    return "Object values not allowed here.";
  };

  var UNSET = function UNSET() {
    return "Unset values not allowed here.";
  };

  var INSERT = function INSERT() {
    return "Error inserting template into DOM. " + "Position must be one of: " + "replace, beforebegin, afterbegin, beforeend, innerhtml, afterend";
  };

  var NOTFOUND = function NOTFOUND(loc) {
    return "Error inserting template into DOM. " + "Location ".concat(loc, " was not found in the document.");
  };

  var MOVE = new ( /*#__PURE__*/function () {
    function _class() {
      _classCallCheck(this, _class);
    }

    _createClass(_class, [{
      key: "beforeend",
      value: function beforeend(frag, elem) {
        elem.appendChild(frag);
      }
    }, {
      key: "beforebegin",
      value: function beforebegin(frag, elem) {
        elem.parentNode.insertBefore(frag, elem);
      }
    }, {
      key: "afterend",
      value: function afterend(frag, elem) {
        elem.parentNode.insertBefore(frag, elem.nextSibling);
      }
    }, {
      key: "replace",
      value: function replace(frag, elem) {
        elem.parentNode.replaceChild(frag, elem);
      }
    }, {
      key: "afterbegin",
      value: function afterbegin(frag, elem) {
        elem.insertBefore(frag, elem.firstChild);
      }
    }, {
      key: "innerhtml",
      value: function innerhtml(frag, elem) {
        elem.innerHTML = '';
        elem.appendChild(frag);
      }
    }]);

    return _class;
  }())(); // logging

  self.onerror = function () {
    for (var _len = arguments.length, v = new Array(_len), _key = 0; _key < _len; _key++) {
      v[_key] = arguments[_key];
    }

    return console.log(v, v[0] + '', v[4] && v[4].message, v[4] && v[4].stack), true;
  }; // type functions


  var isKey = function isKey(v) {
    return T$1.check(T$1(_templateObject$c || (_templateObject$c = taggedTemplateLiteral(["Key"]))), v);
  };

  var isHandlers = function isHandlers(v) {
    return T$1.check(T$1(_templateObject2$7 || (_templateObject2$7 = taggedTemplateLiteral(["Handlers"]))), v);
  }; // cache 


  var cache = {};
  var d = R;
  var u = X; // main exports 

  Object.assign(R, {
    s: s,
    attrskip: attrskip,
    skip: skip,
    attrmarkup: attrmarkup,
    markup: markup,
    guardEmptyHandlers: guardEmptyHandlers,
    die: die
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
    var _ref20 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
        _ref20$useCache = _ref20.useCache,
        useCache = _ref20$useCache === void 0 ? true : _ref20$useCache;

    var retVal = {};
    var instanceKey, cacheKey;
    v = v.map(guardAndTransformVal);

    if (useCache) {
      var _ref21 = v.find(isKey) || {};

      instanceKey = _ref21.key;
      cacheKey = p.join('<link rel=join>');

      var _isCached = isCached(cacheKey, v, instanceKey),
          cached = _isCached.cached,
          firstCall = _isCached.firstCall;

      if (!firstCall) {
        cached.update(v);
        return cached;
      } else {
        retVal.oldVals = Array.from(v);
      }
    } else {
      retVal.oldVals = Array.from(v);
    } // compile the template into an updater


    p = _toConsumableArray(p);
    var vmap = {};
    var V = v.map(replaceValWithKeyAndOmitInstanceKey(vmap));
    var externals = [];
    var str = '';

    while (p.length > 1) {
      str += p.shift() + V.shift();
    }

    str += p.shift();
    var frag = toDOM(str);
    var walker = document.createTreeWalker(frag, NodeFilter.SHOW_ALL);

    do {
      makeUpdaters({
        walker: walker,
        vmap: vmap,
        externals: externals
      });
    } while (walker.nextNode());

    Object.assign(retVal, {
      externals: externals,
      v: Object.values(vmap),
      to: to,
      update: update,
      code: CODE,
      nodes: _toConsumableArray(frag.childNodes)
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
    var position = (options || 'replace').toLocaleLowerCase();
    var frag = document.createDocumentFragment();
    this.nodes.forEach(function (n) {
      return frag.appendChild(n);
    });
    var isNode = T$1.check(T$1(_templateObject3$6 || (_templateObject3$6 = taggedTemplateLiteral([">Node"]))), location);
    var elem = isNode ? location : document.querySelector(location);

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
    var walker = _ref.walker,
        vmap = _ref.vmap,
        externals = _ref.externals;
    var node = walker.currentNode;

    switch (node.nodeType) {
      case Node.ELEMENT_NODE:
        handleElement({
          node: node,
          vmap: vmap,
          externals: externals
        });
        break;

      case Node.COMMENT_NODE:
      case Node.TEXT_NODE:
        handleNode({
          node: node,
          vmap: vmap,
          externals: externals
        });
        break;
    }
  }

  function handleNode(_ref2) {
    var node = _ref2.node,
        vmap = _ref2.vmap,
        externals = _ref2.externals;
    var lengths = [];
    var text = node.nodeValue;
    var result = KEYMATCH.exec(text);

    var _loop = function _loop() {
      var _result = result,
          index = _result.index;
      var key = result[1];
      var val = vmap[key];
      var replacer = makeNodeUpdater({
        node: node,
        index: index,
        lengths: lengths,
        val: val
      });
      externals.push(function () {
        return replacer(val.val);
      });
      val.replacers.push(replacer);
      result = KEYMATCH.exec(text);
    };

    while (result) {
      _loop();
    }
  } // node functions


  function makeNodeUpdater(nodeState) {
    var node = nodeState.node;
    var scope = Object.assign({}, nodeState, {
      oldVal: {
        length: KEYLEN
      },
      oldNodes: [node],
      lastAnchor: node
    });
    return function (newVal) {
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
    var oldNodes = state.oldNodes,
        lastAnchor = state.lastAnchor;

    if (newVal.nodes.length) {
      if (sameOrder(oldNodes, newVal.nodes)) ;else {
        Array.from(newVal.nodes).reverse().forEach(function (n) {
          lastAnchor.parentNode.insertBefore(n, lastAnchor.nextSibling);
          state.lastAnchor = lastAnchor.nextSibling;
        });
        state.lastAnchor = newVal.nodes[0];
      }
    } else {
      var placeholderNode = summonPlaceholder(lastAnchor);
      lastAnchor.parentNode.insertBefore(placeholderNode, lastAnchor.nextSibling);
      state.lastAnchor = placeholderNode;
    } // MARK: Unbond event might be relevant here.


    var dn = diffNodes(oldNodes, newVal.nodes);

    if (dn.size) {
      var f = document.createDocumentFragment();
      dn.forEach(function (n) {
        return f.appendChild(n);
      });
    }

    state.oldNodes = newVal.nodes || [lastAnchor];

    while (newVal.externals.length) {
      var func = newVal.externals.shift();
      func();
    }
  }

  function sameOrder(nodesA, nodesB) {
    if (nodesA.length != nodesB.length) return false;
    return Array.from(nodesA).every(function (an, i) {
      return an == nodesB[i];
    });
  }

  function handleTextInNode(newVal, state) {
    var oldVal = state.oldVal,
        index = state.index,
        val = state.val,
        lengths = state.lengths,
        node = state.node;
    var valIndex = val.vi;
    var originalLengthBefore = Object.keys(lengths.slice(0, valIndex)).length * KEYLEN;
    var lengthBefore = lengths.slice(0, valIndex).reduce(function (sum, x) {
      return sum + x;
    }, 0);
    var value = node.nodeValue;
    lengths[valIndex] = newVal.length;
    var correction = lengthBefore - originalLengthBefore;
    var before = value.slice(0, index + correction);
    var after = value.slice(index + correction + oldVal.length);
    var newValue = before + newVal + after;
    node.nodeValue = newValue;
    state.oldVal = newVal;
  } // element attribute functions


  function handleElement(_ref3) {
    var node = _ref3.node,
        vmap = _ref3.vmap,
        externals = _ref3.externals;
    getAttributes(node).forEach(function () {
      var _ref22 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          name = _ref22.name,
          value = _ref22.value;

      var attrState = {
        node: node,
        vmap: vmap,
        externals: externals,
        name: name,
        lengths: []
      };
      KEYMATCH.lastIndex = 0;
      var result = KEYMATCH.exec(name);

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
    var updateName = _ref4.updateName;
    var index = result.index,
        input = result.input;
    var scope = Object.assign({}, attrState, {
      index: index,
      input: input,
      updateName: updateName,
      val: attrState.vmap[result[1]],
      oldVal: {
        length: KEYLEN
      },
      oldName: attrState.name
    });
    var replacer;

    if (updateName) {
      replacer = makeAttributeNameUpdater(scope);
    } else {
      replacer = makeAttributeValueUpdater(scope);
    }

    scope.externals.push(function () {
      return replacer(scope.val.val);
    });
    scope.val.replacers.push(replacer);
  } // FIXME: needs to support multiple replacements just like value
  // QUESTION: why is the variable oldName so required here, why can't we call it oldVal?
  // if we do it breaks, WHY?


  function makeAttributeNameUpdater(scope) {
    var oldName = scope.oldName,
        node = scope.node,
        val = scope.val;
    return function (newVal) {
      if (oldName == newVal) return;
      val.val = newVal;
      var attr = node.hasAttribute(oldName) ? oldName : '';

      if (attr !== newVal) {
        if (attr) {
          node.removeAttribute(oldName);
          node[oldName] = undefined;
        }

        if (newVal) {
          newVal = newVal.trim();
          var name = newVal,
              value = undefined;

          if (ATTRMATCH.test(newVal)) {
            var assignmentIndex = newVal.indexOf('=');
            var _ref23 = [newVal.slice(0, assignmentIndex), newVal.slice(assignmentIndex + 1)];
            name = _ref23[0];
            value = _ref23[1];
          }

          reliablySetAttribute(node, name, value);
        }

        oldName = newVal;
      }
    };
  }

  function makeAttributeValueUpdater(scope) {
    return function (newVal) {
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
    var attrs = [];

    var _iterator2 = _createForOfIteratorHelper(node),
        _step2;

    try {
      for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
        var name = _step2.value;

        if (node.hasAttribute(name)) {
          attrs.push({
            name: name,
            value: node.getAttribute(name)
          });
        }
      }
    } catch (err) {
      _iterator2.e(err);
    } finally {
      _iterator2.f();
    }

    return attrs;
  }

  function updateAttrWithFunctionValue(newVal, scope) {
    var oldVal = scope.oldVal,
        node = scope.node,
        name = scope.name,
        externals = scope.externals;

    if (name !== 'bond') {
      var flags = {};

      if (name.includes(':')) {
        var _name$split = name.split(':');

        var _name$split2 = _toArray(_name$split);

        name = _name$split2[0];
        flags = _name$split2.slice(1);
        flags = flags.reduce(function (O, f) {
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
        var index = externals.indexOf(oldVal);

        if (index >= 0) {
          externals.splice(index, 1);
        }
      }

      externals.push(function () {
        return newVal(node);
      });
    }

    scope.oldVal = newVal;
  }

  function updateAttrWithFuncarrayValue(newVal, scope) {
    var oldVal = scope.oldVal,
        node = scope.node,
        name = scope.name,
        externals = scope.externals;

    if (oldVal && !Array.isArray(oldVal)) {
      oldVal = [oldVal];
    }

    if (name !== 'bond') {
      var flags = {};

      if (name.includes(':')) {
        var _name$split3 = name.split(':');

        var _name$split4 = _toArray(_name$split3);

        name = _name$split4[0];
        flags = _name$split4.slice(1);
        flags = flags.reduce(function (O, f) {
          O[f] = true;
          return O;
        }, {});
      }

      if (oldVal) {
        oldVal.forEach(function (of) {
          return node.removeEventListener(name, of, flags);
        });
      }

      newVal.forEach(function (f) {
        return node.addEventListener(name, f, flags);
      });
    } else {
      if (oldVal) {
        oldVal.forEach(function (of) {
          var index = externals.indexOf(of);

          if (index >= 0) {
            externals.splice(index, 1);
          }
        });
      }

      newVal.forEach(function (f) {
        return externals.push(function () {
          return f(node);
        });
      });
    }

    scope.oldVal = newVal;
  }

  function updateAttrWithHandlersValue(newVal, scope) {
    var oldVal = scope.oldVal,
        node = scope.node,
        externals = scope.externals;

    if (!!oldVal && T$1.check(T$1(_templateObject4$3 || (_templateObject4$3 = taggedTemplateLiteral(["Handlers"]))), oldVal)) {
      Object.entries(oldVal).forEach(function (_ref5) {
        var _ref24 = _slicedToArray(_ref5, 2),
            eventName = _ref24[0],
            funcVal = _ref24[1];

        if (eventName !== 'bond') {
          var flags = {};

          if (eventName.includes(':')) {
            var _eventName$split = eventName.split(':');

            var _eventName$split2 = _toArray(_eventName$split);

            eventName = _eventName$split2[0];
            flags = _eventName$split2.slice(1);
            flags = flags.reduce(function (O, f) {
              O[f] = true;
              return O;
            }, {});
          }

          console.log(eventName, funcVal, flags);
          node.removeEventListener(eventName, funcVal, flags);
        } else {
          var index = externals.indexOf(funcVal);

          if (index >= 0) {
            externals.splice(index, 1);
          }
        }
      });
    }

    Object.entries(newVal).forEach(function (_ref6) {
      var _ref25 = _slicedToArray(_ref6, 2),
          eventName = _ref25[0],
          funcVal = _ref25[1];

      if (eventName !== 'bond') {
        var flags = {};

        if (eventName.includes(':')) {
          var _eventName$split3 = eventName.split(':');

          var _eventName$split4 = _toArray(_eventName$split3);

          eventName = _eventName$split4[0];
          flags = _eventName$split4.slice(1);
          flags = flags.reduce(function (O, f) {
            O[f] = true;
            return O;
          }, {});
        }

        node.addEventListener(eventName, funcVal, flags);
      } else {
        externals.push(function () {
          return funcVal(node);
        });
      }
    });
    scope.oldVal = newVal;
  }

  function updateAttrWithTextValue(newVal, scope) {
    var oldVal = scope.oldVal,
        node = scope.node,
        index = scope.index,
        name = scope.name,
        val = scope.val,
        lengths = scope.lengths;
    var zeroWidthCorrection = 0;
    var valIndex = val.vi;
    var originalLengthBefore = Object.keys(lengths.slice(0, valIndex)).length * KEYLEN; // we need to trim newVal to have parity with classlist add
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
    var attr = node.getAttribute(name);
    var lengthBefore = lengths.slice(0, valIndex).reduce(function (sum, x) {
      return sum + x;
    }, 0);
    var correction = lengthBefore - originalLengthBefore;
    var before = attr.slice(0, index + correction);
    var after = attr.slice(index + correction + oldVal.length);
    var newAttrValue;

    if (name == "class") {
      var spacer = oldVal.length == 0 ? ' ' : '';
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
    } catch (e) {}

    try {
      node[name] = value == undefined ? true : value;
    } catch (e) {}
  }

  function getType(val) {
    var type = T$1.check(T$1(_templateObject5$2 || (_templateObject5$2 = taggedTemplateLiteral(["Function"]))), val) ? 'function' : T$1.check(T$1(_templateObject6$1 || (_templateObject6$1 = taggedTemplateLiteral(["Handlers"]))), val) ? 'handlers' : T$1.check(T$1(_templateObject7$1 || (_templateObject7$1 = taggedTemplateLiteral(["BrutalObject"]))), val) ? 'brutalobject' : T$1.check(T$1(_templateObject8 || (_templateObject8 = taggedTemplateLiteral(["MarkupObject"]))), val) ? 'markupobject' : T$1.check(T$1(_templateObject9 || (_templateObject9 = taggedTemplateLiteral(["MarkupAttrObject"]))), val) ? 'markupattrobject' : T$1.check(T$1(_templateObject10 || (_templateObject10 = taggedTemplateLiteral(["BrutalArray"]))), val) ? 'brutalarray' : T$1.check(T$1(_templateObject11 || (_templateObject11 = taggedTemplateLiteral(["FuncArray"]))), val) ? 'funcarray' : 'default';
    return type;
  }

  function summonPlaceholder(sibling) {
    var ph = _toConsumableArray(sibling.parentNode.childNodes).find(function (node) {
      return node.nodeType == Node.COMMENT_NODE && node.nodeValue == 'brutal-placeholder';
    });

    if (!ph) {
      ph = toDOM("<!--brutal-placeholder-->").firstChild;
    }

    return ph;
  } // cache helpers
  // FIXME: function needs refactor


  function isCached(cacheKey, v, instanceKey) {
    var firstCall;
    var cached = cache[cacheKey];

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
      cached: cached,
      firstCall: firstCall
    };
  } // Markup helpers
  // Returns an object that Brutal treats as markup,
  // even tho it is NOT a Brutal Object (defined with R/X/$)
  // And even tho it is in the location of a template value replacement
  // Which would normally be the treated as String


  function markup(str) {
    str = T$1.check(T$1(_templateObject12 || (_templateObject12 = taggedTemplateLiteral(["None"]))), str) ? '' : str;
    var frag = toDOM(str);
    var retVal = {
      type: 'MarkupObject',
      code: CODE,
      nodes: _toConsumableArray(frag.childNodes),
      externals: []
    };
    return retVal;
  } // Returns an object that Brutal treats, again, as markup
  // But this time markup that is OKAY to have within a quoted attribute


  function attrmarkup(str) {
    str = T$1.check(T$1(_templateObject13 || (_templateObject13 = taggedTemplateLiteral(["None"]))), str) ? '' : str;
    str = str.replace(/"/g, '&quot;');
    var retVal = {
      type: 'MarkupAttrObject',
      code: CODE,
      str: str
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
      if (T$1.check(T$1(_templateObject14 || (_templateObject14 = taggedTemplateLiteral(["None"]))), val)) {
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
    return function (val, vi) {
      // omit instance key
      if (T$1.check(T$1(_templateObject15 || (_templateObject15 = taggedTemplateLiteral(["Key"]))), val)) {
        return '';
      }

      var key = ('key' + Math.random()).replace('.', '').padEnd(KEYLEN, '0').slice(0, KEYLEN);
      var k = key;

      if (T$1.check(T$1(_templateObject16 || (_templateObject16 = taggedTemplateLiteral(["BrutalObject"]))), val) || T$1.check(T$1(_templateObject17 || (_templateObject17 = taggedTemplateLiteral(["MarkupObject"]))), val)) {
        k = "<!--".concat(k, "-->");
      }

      vmap[key.trim()] = {
        vi: vi,
        val: val,
        replacers: []
      };
      return k;
    };
  }

  function toDOM(str) {
    var templateEl = new DOMParser().parseFromString("<template>".concat(str, "</template>"), "text/html").head.firstElementChild;
    var f;

    if (templateEl instanceof HTMLTemplateElement) {
      f = templateEl.content;
      f.normalize();
      return f;
    } else {
      throw new TypeError("Could not find template element after parsing string to DOM:\n=START=\n".concat(str, "\n=END="));
    }
  }

  function guardAndTransformVal(v) {
    var isFunc = T$1.check(T$1(_templateObject18 || (_templateObject18 = taggedTemplateLiteral(["Function"]))), v);
    var isUnset = T$1.check(T$1(_templateObject19 || (_templateObject19 = taggedTemplateLiteral(["None"]))), v);
    var isObject = T$1.check(T$1(_templateObject20 || (_templateObject20 = taggedTemplateLiteral(["Object"]))), v);
    var isBrutalArray = T$1.check(T$1(_templateObject21 || (_templateObject21 = taggedTemplateLiteral(["BrutalArray"]))), v);
    var isFuncArray = T$1.check(T$1(_templateObject22 || (_templateObject22 = taggedTemplateLiteral(["FuncArray"]))), v);
    var isMarkupObject = T$1.check(T$1(_templateObject23 || (_templateObject23 = taggedTemplateLiteral(["MarkupObject"]))), v);
    var isMarkupAttrObject = T$1.check(T$1(_templateObject24 || (_templateObject24 = taggedTemplateLiteral(["MarkupAttrObject"]))), v);
    var isBrutal = T$1.check(T$1(_templateObject25 || (_templateObject25 = taggedTemplateLiteral(["BrutalObject"]))), v);
    var isForgery = T$1.check(T$1(_templateObject26 || (_templateObject26 = taggedTemplateLiteral(["BrutalLikeObject"]))), v) && !isBrutal;
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
    var externals = [];
    var bigNodes = [];
    var v = [];
    var oldVals = [];
    os.forEach(function (o) {
      //v.push(...o.v); 
      //oldVals.push(...o.oldVals);
      externals.push.apply(externals, _toConsumableArray(o.externals));
      bigNodes.push.apply(bigNodes, _toConsumableArray(o.nodes));
    });
    var retVal = {
      v: v,
      code: CODE,
      oldVals: oldVals,
      nodes: bigNodes,
      to: to,
      update: update,
      externals: externals
    };
    return retVal;
  }

  function nodesToStr(nodes) {
    var frag = document.createDocumentFragment();
    nodes.forEach(function (n) {
      return frag.appendChild(n.cloneNode(true));
    });
    var container = document.createElement('body');
    container.appendChild(frag);
    return container.innerHTML;
  }

  function diffNodes(last, next) {
    last = new Set(last);
    next = new Set(next);
    return new Set(_toConsumableArray(last).filter(function (n) {
      return !next.has(n);
    }));
  }

  function update(newVals) {
    var _this2 = this;

    var updateable = this.v.filter(function (_ref7) {
      var vi = _ref7.vi;
      return didChange(newVals[vi], _this2.oldVals[vi]);
    });
    updateable.forEach(function (_ref8) {
      var vi = _ref8.vi,
          replacers = _ref8.replacers;
      return replacers.forEach(function (f) {
        return f(newVals[vi]);
      });
    });
    this.oldVals = Array.from(newVals);
  }

  function didChange(oldVal, newVal) {
    var _map = [oldVal, newVal].map(getType),
        _map2 = _slicedToArray(_map, 2),
        oldType = _map2[0],
        newType = _map2[1];

    var ret;

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
    msg.stack = new Error().stack.split(/\s*\n\s*/g);
    throw JSON.stringify(msg, null, 2);
  }

  function s(msg) {}

  var _templateObject$b;

  var loadings = new Map();
  var SHOW_LOADED_MS = 300;
  var DEFAULT_LOADING = {
    waiting: 0,
    complete: 0
  };
  var delayHideTimeout;

  function LoadingIndicator(state) {
    var delayHide = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
    var loading = loadings.get(state.activeTarget) || DEFAULT_LOADING;
    var isLoading = loading.waiting > 0;

    if (delayHide && loading.complete > 0) {
      if (!isLoading) {
        clearTimeout(delayHideTimeout);
        delayHideTimeout = setTimeout(function () {
          loading.isLoading = false;
          LoadingIndicator(state, false);
        }, SHOW_LOADED_MS);
      }

      loading.isLoading = true;
    } else {
      loading.isLoading = isLoading;
    }

    return d(_templateObject$b || (_templateObject$b = taggedTemplateLiteral(["\n    <aside class=\"loading-indicator\" stylist=\"styleLoadingIndicator\">\n      <progress ", " name=loading max=", " value=", ">\n    </aside>\n  "])), loading.isLoading ? '' : 'hidden', loading.waiting + loading.complete, loading.complete);
  }

  function resetLoadingIndicator(_ref, state) {
    var navigated = _ref.navigated;
    var targetId = navigated.targetId;
    loadings["delete"](targetId);

    if (state.activeTarget == targetId) {
      LoadingIndicator(state);
    }
  }

  function showLoadingIndicator(_ref2, state) {
    var resource = _ref2.resource;
    var targetId = resource.targetId;
    loadings.set(targetId, resource);

    if (state.activeTarget == targetId) {
      LoadingIndicator(state);
    }
  }

  var DEFAULT_FAVICON = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEsAAABLCAYAAAA4TnrqAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAuIwAALiMBeKU/dgAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAn/SURBVHic7Zx/bFzFEce/s+ezcc5OCC0lDi65OHf7zliyWlx+NUgY9VcKjYTbNKhAmtAKWiTapq1Q1fS/NqJIVCGlVI1IKSQ0qElQA7RFgNRimiAh1BSkJLLfu/MPim1CoKHxXXyu726nf/jZNc7bu927s1NV9/kreTs7sx6/nbezs2ugRo0aNWrUqFGjRo3zDJ1P411dXeEzZ87EhRAOM68hog8DaAIQBpADkAHwLoBBZu5funRp6ujRo7nzNd5Fd5aUMgHgiwC6iWgtMy+x6H6WiF5h5l4AhzzP61+QQWpYFGe1trY2RiKRLcy8BcBVVVT9GjM/ls1m94yMjGSrqDeQBXVWZ2dnZHJy8lsAtgK4ZAFNvUNEO9Lp9MNjY2MTC2VkwZwVi8XWCyEeAhBdKBsBjALY5nne3oVQXnVnRaPRC8Ph8G4i2lBt3RYczOfzdw4ODp6pptKqOiuRSHQppQ4CWG3ZNQdgEMBbAN4nohwzRwAsJ6IoM19WxnAGlFIbU6nU38voG0jVnOU4zjpmfgpAxECcARxh5meFEL0tLS1v9Pb25nXCHR0dF+VyuasB3AhgPYBVhsPKCCE29Pf3v2AoX5SqOEtKeQuAJzC9PirGODPvCoVCv+rv7x8u0xw5jnMDM98DoMdAPgdgk+d5+8u091/DlSrw36hnUdxReQAPTU1N/WR4eHg8Ho9fSUTNBupHdGupRCIRVUoNGQ4zJ4RYX+kbVpGz/Bj1MopMPWY+HgqFbu3v7z8GAFLKXwP4uqEJBrDZ87wnAmzbOAsAMkqp6yuJYaLcjtFo9EI/mBeLUXuz2exVM47yucHCDGE6Tp1DPp8/a6EHAJqEEAfb2tqWWfabpWxnhcPh3Sj+1bvf87wtAStrW5vrpZQ9HR0dF819mEql3gVwHxH9w0JXW11d3W5L+7OUNQ2llDcDOFRE5H7P836o6TuE8haqCsDdnuc9Mr/BcZzbmPm3poqI6GbXdZ+xHYD1m9XZ2RkBsLOIyF7P87YVaW+wtekjAHw5qKGlpWU/gH+bKmLmnStXrrRJ4GcHYIWf6wWuc5j5+MTExDcxHZg/QHd3d53jOLcBaLG1OUd/XdBzf432IIApQ1XR5ubme2ztW03D1tbWxiVLlgwhOCnOCyGumAnmjuPsY+aNAAJ/wHJg5t5kMqn9QHR3d9eNjo5uJKJ9BupOTkxMtNnsVli9WZFIZAv0uwcPzTiqvb29hZlvRRUdZUJvb28+mUw+CeBtA/EVjY2Nm230WzmLme/QNI03NDRsnyNXblyqFkbxi4i22Cg1dpa/w3llUBsz7zp27Nj7Nob/R7g6kUhIU2GbN0uXh7EQYpeFnrIhIlVtncxskl8CsHOWLrAecV3XJu0oG2Z+qdo6lVLGGYVRAO7q6gpnMpm1zOesCOAn0dVmnIi+x8xvzrHzXjKZfKPahojouq6urrBJ1cjIWX65KnARJ4ToDRjAuV61gJl/43neo5WosJCNjI+PxwD0lRI0moZCCEfTlGtpaTnnty2EeBvAOya6NfYqnW5Wb6AQwijIG71ZzBwjCly/DgbtcJ44cWJKStlFROuY+WsAPqlRPQJgB4DZHQQiOuG67ism49KRyWRub2pqWg/gJgCbSskrpeImeo2cRUQXaZ6/GfQcADzPGwXwaHt7+3OFQmFMI3av53m/MxmDDX45bD+AA1LKqwDoZgYAgIiWm+g1/Ro2aZ6nS3Xs6+t7G0Aq0LgQJw3tlwsDOGIgZ7Jra5yONAaOhNkorwqFQjfm8/lbhBA9zHyFoc2qkM/nvx8Oh48z8wpMFzsuDxAz2oEwdZbOKUa/kb6+viSA7Y7j/JyITlqeb6gIv3a4EwCklB0IdpZRFdt0GmY0z43m+gyu66aZ+dTM/5VSK2z6VwoRfUjTVDKcAOZfw9NBX0Miipr0L8IDjuNcUigU/ppKpV6vUFdJmPkjmqbTJv2N3iwiSmqMX5ZIJHS/LRNamXmnEOJv8Xj8YxXoKYlfqAisGRBR4AdoPkbOUkp5ujZmDtyJKMK/gsYhhLjeUo8V9fX110Dz8zKza6LDaBouW7YsmU6nzyKg7MXMNwF43kSPz7cBbMP0Oa3Z9Rsz3xuPx08R0bu6jkRUKBQKx/3KjhWFQmGtZmGdaW5uHjDRYbytLKV8EcBnApre9DxvNezyMcRisYuFEP2Y4zBDxgFc7i96TSEpZR8CFqfM/EIymVxnosRmi0aXr61yHMemcApgtu53wrYfgKVKKau1mpRyLTSreCHEX0z12OyRHwJwX1ADM98jpRwGgEKhkBkYGDgVJBfQr6CZGkUhopVSyjb/35Ou6+rSqRnu0jUIIYrVPz8oayroH9B4TdPcA2AAwEAoFHrHcZztGrmqQES7Zuwx82g8HtcWWGOxWAeAr2iaX/UXzEbYFiweM5T7qqFK48JoMYjoFl2bEOIBaGYQMz9uY8fKWdlsdg/M9qk+Go/Hb+3u7i41zR9B8FLClkA7UsoeAJ/X9DmZy+X22BixctbIyEiWiB40kSWifWNjY2ellD/VySSTyd97nrfcD9j/tBlLKRzHWQ1Au9vKzDuGh4cnbXRal+/T6fQvAAwbitcD+G4pIT/Vec52LHP4wAZka2trIzMfgD53Hcpmsw/bGrF21tjY2AQRbbXoYlRwZeb9MD+rENQXABCNRi+IRCJPA/iETp6ItpZzyaCs81n+cZ0D5fTVkUwm/+Tf3fk0ipffM0T0JIBvKKWuJaJLk8nk7cC0o8Lh8NPM/Nki/fe7rltWRarsswj5fP6uurq6LgBrytUxH9d10wD+LKXcC+AHASJD+Xz+40Hn26WUbUR0sMTmYkoppV1zlaLsk3+Dg4NnlFIbod/rmiUej98Bi9RKCPE85sUhn2VCiPr5Dx3H2QDgaAlHZfxz8eOm45hPxaeVE4nE55RSf0DpY92HlVJ3p1IpoxSnvb19VaFQuBbAzwBcOqfpNIDXmflBIcRbzLwDwKdKqMsppb6QSqVeNLGtY7HPwRcAPENEv3Rd9yUYJN+O43yHmYNOGk769kIlVEwR0SbXdSuOsVW7YeG/YU9BXwmaTx8R/VEp9TIzH9ZNj3g83k5Eb2B6GWJLRin1pUrfqBmqencnFotdIYQ4CKDNsmsB0wXXkwDew/RUuwBAvX/DNQH7j1HKj1FV266u+q2wtra2Zf7x6cDDsovEAaXUnZUE8yD+3+4bjgD40ULdNywVHMvm9OnTXkNDw+6GhoZxAJ0wj2XlcJKZf5zNZjcNDQ0dXSgji3ZHurGxcTMRbQZwTRVVv8rMj+dyuT22SXE5LPrt+0QiIZm5Ryl1AxFdB7P7iTOcBXCYiF4SQhyy2birBuf97zqk0+k1ABKY/oJejOnpWo/ppDoD4BQRDTKz29zcPHA+/65DjRo1atSoUaNGjRrnnf8APcnjzVWJn1oAAAAASUVORK5CYII=";

  var _templateObject$a, _templateObject2$6, _templateObject3$5;

  function TabList(state) {
    return d(_templateObject$a || (_templateObject$a = taggedTemplateLiteral(["\n    <nav class=\"controls targets\" stylist=\"styleTabList styleNavControl\">\n      <ul>\n        ", "\n        <li class=\"new\" stylist=\"styleTabSelector\"\n            click=", "\n          >\n            <button class=new title=\"New tab\" accesskey=\"s\">+</button>\n        </li>\n      </ul>\n    </nav>\n  "])), state.tabs.map(function (tab, index) {
      return TabSelector(tab, index, state);
    }), function (click) {
      return state.createTab(click);
    });
  }

  function TabSelector(tab, index, state) {
    var title = tab.title == 'about:blank' ? '' : tab.title;
    var active = state.activeTarget == tab.targetId;
    return d(_templateObject2$6 || (_templateObject2$6 = taggedTemplateLiteral(["", "\n    <li class=\"tab-selector ", "\" stylist=\"styleTabSelector\"\n        title=\"", "\"\n        click=", " \n      >\n        ", "\n        <a  \n          mousedown=", "\n          href=/tabs/", ">", "</a>\n        <button class=close title=\"Close tab\" ", "\n          click=", ">&Chi;</button>\n    </li>\n  "])), {
      key: tab.targetId
    }, active ? 'active' : '', title || 'Bring to front', function (click) {
      return state.activateTab(click, tab);
    }, FaviconElement(tab, state), function () {
      return state.viewState.lastActive = document.activeElement;
    }, tab.targetId, title, active ? 'accesskey=d' : '', function (click) {
      return state.closeTab(click, tab, index);
    });
  }

  function FaviconElement(_ref, state) {
    var targetId = _ref.targetId;
    var faviconURL;
    faviconURL = state.favicons.has(targetId) && state.favicons.get(targetId).dataURI;
    return d(_templateObject3$5 || (_templateObject3$5 = taggedTemplateLiteral(["", "\n    <img class=favicon src=\"", "\" \n      data-target-id=\"", "\" bond=", ">\n  "])), {
      key: targetId
    }, d.attrmarkup(faviconURL || DEFAULT_FAVICON), targetId, function (el) {
      return bindFavicon(el, {
        targetId: targetId
      }, state);
    });
  }

  function bindFavicon(el, _ref2, state) {
    var targetId = _ref2.targetId;
    var favicon = state.favicons.get(targetId);

    if (favicon) {
      favicon.el = el;
    } else {
      favicon = {
        el: el
      };
      state.favicons.set(targetId, favicon);
    }

    if (favicon.el && favicon.dataURI) {
      el.src = favicon.dataURI;
    }
  }

  function resetFavicon(_ref, state) {
    var targetId = _ref.targetId;
    var favicon = state.favicons.get(targetId);

    if (favicon) {
      favicon.dataURI = DEFAULT_FAVICON;
    }

    FaviconElement({
      targetId: targetId
    }, state);
  }

  function handleFaviconMessage(_ref2, state) {
    var _ref2$favicon = _ref2.favicon,
        faviconDataUrl = _ref2$favicon.faviconDataUrl,
        targetId = _ref2$favicon.targetId;
    var favicon = state.favicons.get(targetId);

    if (favicon) {
      favicon.dataURI = faviconDataUrl;
    } else {
      favicon = {
        dataURI: faviconDataUrl
      };
      state.favicons.set(targetId, favicon);
    }

    FaviconElement({
      targetId: targetId
    }, state);
  }

  var $ = Symbol('[[EventQueuePrivates]]'); //const TIME_BETWEEN_ONLINE_CHECKS = 1001;

  var ALERT_TIMEOUT = 300;
  var MAX_E = 255;
  var BUFFERED_FRAME_EVENT$3 = {
    type: "buffered-results-collection",
    command: {
      isBufferedResultsCollectionOnly: true,
      params: {}
    }
  };
  var BUFFERED_FRAME_COLLECT_DELAY = {
    MIN: 75,

    /* 250, 500 */
    MAX: 4000
    /* 2000, 4000, 8000 */

  };
  var Format = 'jpeg';
  var waiting = new Map();
  var connecting;
  var latestReload;
  var latestAlert; //let lastTestTime;
  //let lastOnlineCheck;

  var messageId = 0;
  var latestFrame = 0;
  var frameDrawing = false;
  var bufferedFrameCollectDelay = BUFFERED_FRAME_COLLECT_DELAY.MIN;

  var Privates = /*#__PURE__*/function () {
    function Privates(publics, state, sessionToken) {
      _classCallCheck(this, Privates);

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
      var WindowLength = 10;
      var messageWindow = [];
      var bwWindow = [];

      this.addBytes = function (n, hasFrame) {
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

          var averageSize = Math.round(messageWindow.reduce(function (total, size) {
            return total + size;
          }, 0) / messageWindow.length);
          var averageBw = Math.round(bwWindow.reduce(function (total, size) {
            return total + size;
          }, 0) / bwWindow.length);

          if (averageSize > averageBw * 1.1) {
            state.H({
              custom: true,
              type: 'resample-imagery',
              down: true,
              averageBw: averageBw
            });
          } else if (averageSize < averageBw * 0.9) {
            state.H({
              custom: true,
              type: 'resample-imagery',
              up: true,
              averageBw: averageBw
            });
          }
        }
      };
    }

    _createClass(Privates, [{
      key: "triggerSendLoop",
      value: function triggerSendLoop() {
        var _this3 = this;

        if (this.loopActive) return;
        this.loopActive = true;
        this.currentDelay = this.constructor.firstDelay;
        setTimeout(function () {
          return _this3.nextLoop();
        }, this.currentDelay);
      }
    }, {
      key: "nextLoop",
      value: function () {
        var _nextLoop = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
          var _this4 = this;

          var q, url, _translator, firstChainIndex, chain, events, _q$shift, splice_index;

          return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  //let data, meta, totalBandwidth;
                  q = Array.from(this.publics.queue);
                  url = this.subscribers[0];

                  if (!this.publics.state.demoMode && this.translators.has(url)) {
                    _translator = this.translators.get(url);
                    q = q.map(function (e) {
                      return _translator(e, {});
                    }).filter(function (e) {
                      return e !== undefined;
                    });
                    q = q.reduce(function (Q, e) {
                      return Array.isArray(e) ? Q.push.apply(Q, _toConsumableArray(e)) : Q.push(e), Q;
                    }, []);
                  }

                  firstChainIndex = q.findIndex(function (e) {
                    return !!e.chain;
                  });

                  if (firstChainIndex == -1) {
                    events = q.splice(0, MAX_E);
                    this.publics.queue.splice(0, MAX_E);
                  } else if (firstChainIndex == 0) {
                    _q$shift = q.shift();
                    chain = _q$shift.chain;
                    this.publics.queue.shift();
                  } else {
                    splice_index = Math.min(MAX_E, firstChainIndex);
                    events = q.splice(0, splice_index);
                    this.publics.queue.splice(0, splice_index);
                  }

                  if (chain) {
                    this.sendEventChain({
                      chain: chain,
                      url: url
                    }).then(function (_ref) {
                      var meta = _ref.meta,
                          totalBandwidth = _ref.totalBandwidth;

                      if (!!meta && meta.length) {
                        meta.forEach(function (metaItem) {
                          var executionContextId = metaItem.executionContextId;

                          var _loop2 = function _loop2() {
                            var key = _Object$keys[_i2];

                            var typeList = _this4.typeLists.get(key);

                            if (typeList) {
                              typeList.forEach(function (func) {
                                try {
                                  var _func;

                                  func((_func = {}, _defineProperty2(_func, key, metaItem[key]), _defineProperty2(_func, "executionContextId", executionContextId), _func));
                                } catch (e) {}
                              });
                            }
                          };

                          for (var _i2 = 0, _Object$keys = Object.keys(metaItem); _i2 < _Object$keys.length; _i2++) {
                            _loop2();
                          }
                        });
                      }

                      if (totalBandwidth) {
                        _this4.publics.state.totalBandwidth = totalBandwidth;
                      }
                    });
                  } else {
                    this.sendEvents({
                      events: events,
                      url: url
                    });
                  }

                  if (this.publics.queue.length) {
                    setTimeout(function () {
                      return _this4.nextLoop();
                    }, this.currentDelay);
                  } else {
                    this.loopActive = false;
                  }

                case 7:
                case "end":
                  return _context.stop();
              }
            }
          }, _callee, this);
        }));

        function nextLoop() {
          return _nextLoop.apply(this, arguments);
        }

        return nextLoop;
      }()
    }, {
      key: "sendEvents",
      value: function () {
        var _sendEvents = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(_ref2) {
          var _this5 = this;

          var events, url, protocol, senders, resolve, promise, request;
          return regeneratorRuntime.wrap(function _callee3$(_context3) {
            while (1) {
              switch (_context3.prev = _context3.next) {
                case 0:
                  events = _ref2.events, url = _ref2.url;

                  if (events) {
                    _context3.next = 3;
                    break;
                  }

                  return _context3.abrupt("return", {
                    meta: [],
                    data: []
                  });

                case 3:
                  events = events.filter(function (e) {
                    return !!e && !!e.command;
                  });

                  if (!(events.length == 0)) {
                    _context3.next = 6;
                    break;
                  }

                  return _context3.abrupt("return", {
                    meta: [],
                    data: []
                  });

                case 6:
                  this.maybeCheckForBufferedFrames(events);

                  try {
                    url = new URL(url);
                    protocol = url.protocol; // OK WTF

                    url.search = "session_token=".concat(this.sessionToken);
                    url = url + '';
                  } catch (e) {
                    alert("WTF " + url);
                    console.warn(e, url, this);
                  }

                  if (this.publics.state.demoMode) {
                    _context3.next = 35;
                    break;
                  }

                  if (!(protocol == 'ws:' || protocol == 'wss:')) {
                    _context3.next = 31;
                    break;
                  }

                  _context3.prev = 10;
                  senders = this.websockets.get(url);
                  messageId++;
                  promise = new Promise(function (res) {
                    return resolve = res;
                  });
                  waiting.set("".concat(url, ":").concat(messageId), resolve);

                  if (!senders) {
                    _context3.next = 19;
                    break;
                  }

                  senders.so({
                    messageId: messageId,
                    zombie: {
                      events: events
                    }
                  });
                  _context3.next = 21;
                  break;

                case 19:
                  _context3.next = 21;
                  return this.connectSocket(url, events, messageId);

                case 21:
                  return _context3.abrupt("return", promise);

                case 24:
                  _context3.prev = 24;
                  _context3.t0 = _context3["catch"](10);
                  console.warn(_context3.t0);
                  console.warn(JSON.stringify({
                    msg: "Error sending event to websocket ".concat(url),
                    events: events,
                    url: url,
                    error: _context3.t0
                  }));
                  return _context3.abrupt("return", {
                    error: 'failed to send',
                    events: events
                  });

                case 29:
                  _context3.next = 33;
                  break;

                case 31:
                  request = {
                    method: 'POST',
                    body: JSON.stringify({
                      events: events
                    }),
                    headers: {
                      'content-type': 'application/json'
                    }
                  };
                  return _context3.abrupt("return", fetch(url, request).then(function (r) {
                    return r.json();
                  }).then( /*#__PURE__*/function () {
                    var _ref26 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(_ref3) {
                      var data, frameBuffer, meta, errors;
                      return regeneratorRuntime.wrap(function _callee2$(_context2) {
                        while (1) {
                          switch (_context2.prev = _context2.next) {
                            case 0:
                              data = _ref3.data, frameBuffer = _ref3.frameBuffer, meta = _ref3.meta;

                              if (!!frameBuffer && _this5.images.has(url)) {
                                drawFrames(_this5.publics.state, frameBuffer, _this5.images.get(url));
                              }

                              errors = data.filter(function (d) {
                                return !!d.error;
                              });
                              if (errors.length) ;
                              return _context2.abrupt("return", {
                                data: data,
                                meta: meta
                              });

                            case 5:
                            case "end":
                              return _context2.stop();
                          }
                        }
                      }, _callee2);
                    }));

                    return function (_x6) {
                      return _ref26.apply(this, arguments);
                    };
                  }())["catch"](function (e) {
                    console.warn(JSON.stringify({
                      msg: "Error sending event to POST url ".concat(url),
                      events: events,
                      url: url,
                      error: e
                    }));
                    return {
                      error: 'failed to send',
                      events: events
                    };
                  }));

                case 33:
                  _context3.next = 38;
                  break;

                case 35:
                  _context3.next = 37;
                  return this.publics.state.demoEventConsumer({
                    events: events
                  });

                case 37:
                  return _context3.abrupt("return", _context3.sent);

                case 38:
                case "end":
                  return _context3.stop();
              }
            }
          }, _callee3, this, [[10, 24]]);
        }));

        function sendEvents(_x5) {
          return _sendEvents.apply(this, arguments);
        }

        return sendEvents;
      }()
    }, {
      key: "connectSocket",
      value: function () {
        var _connectSocket = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7(url, events, messageId) {
          var _this6 = this;

          var _this$publics$queue, socket;

          return regeneratorRuntime.wrap(function _callee7$(_context7) {
            while (1) {
              switch (_context7.prev = _context7.next) {
                case 0:
                  if (!connecting) {
                    _context7.next = 3;
                    break;
                  }

                  (_this$publics$queue = this.publics.queue).unshift.apply(_this$publics$queue, _toConsumableArray(events));

                  return _context7.abrupt("return");

                case 3:
                  connecting = true;

                  if (!(!this.publics.state.demoMode && onLine())) {
                    _context7.next = 20;
                    break;
                  }

                  _context7.prev = 5;
                  socket = new WebSocket(url);
                  _context7.next = 14;
                  break;

                case 9:
                  _context7.prev = 9;
                  _context7.t0 = _context7["catch"](5);
                  talert("Error connecting to the server. Will reload to try again.");
                  _context7.next = 14;
                  return treload();

                case 14:
                  socket.onopen = function () {
                    _this6.websockets.set(url, {
                      so: so,
                      sa: sa
                    });

                    var receivesFrames = !_this6.publics.state.useViewFrame;
                    so({
                      messageId: messageId,
                      zombie: {
                        events: events,
                        receivesFrames: receivesFrames
                      }
                    });

                    function so(o) {
                      socket.send(JSON.stringify(o));
                    }

                    function sa(a) {
                      socket.send(a);
                    }
                  };

                  socket.onmessage = /*#__PURE__*/function () {
                    var _ref27 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(message) {
                      var MessageData, messageData, data, frameBuffer, meta, serverMessageId, totalBandwidth, errors, x, _reload, _reload2, _reload3, replyTransmitted, fallbackReplyTransmitted;

                      return regeneratorRuntime.wrap(function _callee4$(_context4) {
                        while (1) {
                          switch (_context4.prev = _context4.next) {
                            case 0:
                              MessageData = message.data;
                              messageData = JSON.parse(MessageData);
                              data = messageData.data, frameBuffer = messageData.frameBuffer, meta = messageData.meta, serverMessageId = messageData.messageId, totalBandwidth = messageData.totalBandwidth;

                              if (!!frameBuffer && frameBuffer.length && _this6.images.has(url)) {
                                _this6.addBytes(MessageData.length, frameBuffer.length);

                                drawFrames(_this6.publics.state, frameBuffer, _this6.images.get(url));
                              } else {
                                _this6.addBytes(MessageData.length, false);
                              }

                              errors = data.filter(function (d) {
                                return !!d && !!d.error;
                              });

                              if (!errors.length) {
                                _context4.next = 74;
                                break;
                              }

                              DEBUG && console.log(JSON.stringify(errors));

                              if (!errors.some(function (_ref4) {
                                var error = _ref4.error;
                                return error.hasSession === false;
                              })) {
                                _context4.next = 29;
                                break;
                              }

                              console.warn("Session has been cleared. Let's attempt relogin", _this6.sessionToken);

                              if (!DEBUG.blockAnotherReset) {
                                _context4.next = 11;
                                break;
                              }

                              return _context4.abrupt("return");

                            case 11:
                              DEBUG.blockAnotherReset = true;
                              _context4.prev = 12;
                              x = new URL(location);
                              x.pathname = 'login';
                              x.search = "token=".concat(_this6.sessionToken, "&ran=").concat(Math.random());
                              _context4.next = 18;
                              return talert("Your browser cleared your session. We need to reload the page to refresh it.");

                            case 18:
                              DEBUG.delayUnload = false;
                              location.href = x;
                              socket.onmessage = null;
                              _context4.next = 26;
                              break;

                            case 23:
                              _context4.prev = 23;
                              _context4.t0 = _context4["catch"](12);
                              talert("An error occurred. Please reload.");

                            case 26:
                              return _context4.abrupt("return");

                            case 29:
                              if (!errors.some(function (_ref5) {
                                var error = _ref5.error;
                                return error.includes && error.includes("ECONNREFUSED");
                              })) {
                                _context4.next = 40;
                                break;
                              }

                              console.warn("Cloud browser has not started yet. Let's reload and see if it has then.");

                              if (!DEBUG.blockAnotherReset) {
                                _context4.next = 33;
                                break;
                              }

                              return _context4.abrupt("return");

                            case 33:
                              DEBUG.blockAnotherReset = true;
                              talert("Your cloud browser has not started yet. We'll reload and see if it has then.");
                              _context4.next = 37;
                              return treload();

                            case 37:
                              return _context4.abrupt("return");

                            case 40:
                              if (!errors.some(function (_ref6) {
                                var error = _ref6.error;
                                return error.includes && error.includes("Timed out");
                              })) {
                                _context4.next = 52;
                                break;
                              }

                              console.warn("Some events are timing out when sent to the cloud browser.");

                              if (!DEBUG.blockAnotherReset) {
                                _context4.next = 44;
                                break;
                              }

                              return _context4.abrupt("return");

                            case 44:
                              DEBUG.blockAnotherReset = true;
                              _context4.next = 47;
                              return tconfirm("Some events are timing out when sent to the cloud browser. Try reloading the page, and if the problem persists try switching your cloud browser off then on again. Want to reload now?");

                            case 47:
                              _reload = _context4.sent;

                              if (_reload) {
                                treload();
                              }

                              return _context4.abrupt("return");

                            case 52:
                              if (!errors.some(function (_ref7) {
                                var error = _ref7.error;
                                return error.includes && error.includes("not opened");
                              })) {
                                _context4.next = 64;
                                break;
                              }

                              console.warn("We can't establish a connection the cloud browser right now. We can try reloading the page, but if the problem persists try switching your cloud browser off then on again.");

                              if (!DEBUG.blockAnotherReset) {
                                _context4.next = 56;
                                break;
                              }

                              return _context4.abrupt("return");

                            case 56:
                              DEBUG.blockAnotherReset = true;
                              _context4.next = 59;
                              return tconfirm("We can't establish a connection the cloud browser right now. We can try reloading the page, but if the problem persists try switching your cloud browser off then on again. Reload the page now?");

                            case 59:
                              _reload2 = _context4.sent;

                              if (_reload2) {
                                treload();
                              }

                              return _context4.abrupt("return");

                            case 64:
                              if (!errors.some(function (_ref8) {
                                var resetRequired = _ref8.resetRequired;
                                return resetRequired;
                              })) {
                                _context4.next = 74;
                                break;
                              }

                              console.warn("Some errors have occurred which require reloading the page. If the problem persists try switching your cloud browser off then on again.");

                              if (!DEBUG.blockAnotherReset) {
                                _context4.next = 68;
                                break;
                              }

                              return _context4.abrupt("return");

                            case 68:
                              DEBUG.blockAnotherReset = true;
                              _context4.next = 71;
                              return tconfirm("Some errors have occurred which require reloading the page. If the problem persists try switching your cloud browser off then on again. Want to reload the page now?");

                            case 71:
                              _reload3 = _context4.sent;

                              if (_reload3) {
                                treload();
                              }

                              return _context4.abrupt("return");

                            case 74:
                              if (!!meta && meta.length) {
                                meta.forEach(function (metaItem) {
                                  var executionContextId = metaItem.executionContextId;

                                  var _loop3 = function _loop3() {
                                    var key = _Object$keys2[_i3];

                                    var typeList = _this6.typeLists.get(key);

                                    if (typeList) {
                                      typeList.forEach(function (func) {
                                        try {
                                          var _func2;

                                          func((_func2 = {}, _defineProperty2(_func2, key, metaItem[key]), _defineProperty2(_func2, "executionContextId", executionContextId), _func2));
                                        } catch (e) {}
                                      });
                                    }
                                  };

                                  for (var _i3 = 0, _Object$keys2 = Object.keys(metaItem); _i3 < _Object$keys2.length; _i3++) {
                                    _loop3();
                                  }
                                });
                              }

                              if (totalBandwidth) {
                                _this6.publics.state.totalBandwidth = totalBandwidth;
                              }

                              replyTransmitted = transmitReply({
                                url: url,
                                id: serverMessageId,
                                data: data,
                                meta: meta,
                                totalBandwidth: totalBandwidth
                              });

                              if (!replyTransmitted) {
                                _context4.next = 79;
                                break;
                              }

                              return _context4.abrupt("return");

                            case 79:
                              fallbackReplyTransmitted = transmitReply({
                                url: url,
                                id: messageId,
                                data: data,
                                meta: meta,
                                totalBandwidth: totalBandwidth
                              });

                              if (!fallbackReplyTransmitted) {
                                _context4.next = 82;
                                break;
                              }

                              return _context4.abrupt("return");

                            case 82:
                            case "end":
                              return _context4.stop();
                          }
                        }
                      }, _callee4, null, [[12, 23]]);
                    }));

                    return function (_x10) {
                      return _ref27.apply(this, arguments);
                    };
                  }();

                  socket.onclose = /*#__PURE__*/function () {
                    var _ref28 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(e) {
                      return regeneratorRuntime.wrap(function _callee5$(_context5) {
                        while (1) {
                          switch (_context5.prev = _context5.next) {
                            case 0:
                              _this6.websockets["delete"](url);

                              console.log("Socket disconnected. Will reconnect when online");
                              talert("Error connecting to the server -- Will reload to try again.");
                              _context5.next = 5;
                              return treload();

                            case 5:
                            case "end":
                              return _context5.stop();
                          }
                        }
                      }, _callee5);
                    }));

                    return function (_x11) {
                      return _ref28.apply(this, arguments);
                    };
                  }();

                  socket.onerror = /*#__PURE__*/function () {
                    var _ref29 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6(e) {
                      return regeneratorRuntime.wrap(function _callee6$(_context6) {
                        while (1) {
                          switch (_context6.prev = _context6.next) {
                            case 0:
                              socket.onerror = null;
                              talert("Error connecting to the server - Will reload to try again.");
                              _context6.next = 4;
                              return treload();

                            case 4:
                            case "end":
                              return _context6.stop();
                          }
                        }
                      }, _callee6);
                    }));

                    return function (_x12) {
                      return _ref29.apply(this, arguments);
                    };
                  }();

                  _context7.next = 24;
                  break;

                case 20:
                  console.log("Offline. Will connect socket when online");
                  talert("Error connecting to the server, will reload to try again.");
                  _context7.next = 24;
                  return treload();

                case 24:
                case "end":
                  return _context7.stop();
              }
            }
          }, _callee7, this, [[5, 9]]);
        }));

        function connectSocket(_x7, _x8, _x9) {
          return _connectSocket.apply(this, arguments);
        }

        return connectSocket;
      }()
    }, {
      key: "sendEventChain",
      value: function () {
        var _sendEventChain = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee8(_ref9) {
          var chain, url, Meta, Data, lastData, _iterator3, _step3, next, _yield$this$sendEvent, meta, data, funcResult, events, _yield$this$sendEvent2, _meta, _data;

          return regeneratorRuntime.wrap(function _callee8$(_context8) {
            while (1) {
              switch (_context8.prev = _context8.next) {
                case 0:
                  chain = _ref9.chain, url = _ref9.url;
                  Meta = [], Data = [];
                  _iterator3 = _createForOfIteratorHelper(chain);
                  _context8.prev = 3;

                  _iterator3.s();

                case 5:
                  if ((_step3 = _iterator3.n()).done) {
                    _context8.next = 33;
                    break;
                  }

                  next = _step3.value;

                  if (!(_typeof(next) == "object")) {
                    _context8.next = 18;
                    break;
                  }

                  _context8.next = 10;
                  return this.sendEvents({
                    events: [next],
                    url: url
                  });

                case 10:
                  _yield$this$sendEvent = _context8.sent;
                  meta = _yield$this$sendEvent.meta;
                  data = _yield$this$sendEvent.data;
                  Meta.push.apply(Meta, _toConsumableArray(meta));
                  Data.push.apply(Data, _toConsumableArray(data));
                  lastData = data;
                  _context8.next = 31;
                  break;

                case 18:
                  if (!(typeof next == "function")) {
                    _context8.next = 31;
                    break;
                  }

                  funcResult = void 0;

                  try {
                    funcResult = next(lastData[0]);
                  } catch (e) {
                    Data.push({
                      error: e + ''
                    });
                  }

                  events = void 0;

                  if (Array.isArray(funcResult)) {
                    events = funcResult;
                  } else if (_typeof(funcResult) == "object") {
                    events = [funcResult];
                  }

                  _context8.next = 25;
                  return this.sendEvents({
                    events: events,
                    url: url
                  });

                case 25:
                  _yield$this$sendEvent2 = _context8.sent;
                  _meta = _yield$this$sendEvent2.meta;
                  _data = _yield$this$sendEvent2.data;
                  Meta.push.apply(Meta, _toConsumableArray(_meta));
                  Data.push.apply(Data, _toConsumableArray(_data));
                  lastData = _data;

                case 31:
                  _context8.next = 5;
                  break;

                case 33:
                  _context8.next = 38;
                  break;

                case 35:
                  _context8.prev = 35;
                  _context8.t0 = _context8["catch"](3);

                  _iterator3.e(_context8.t0);

                case 38:
                  _context8.prev = 38;

                  _iterator3.f();

                  return _context8.finish(38);

                case 41:
                  return _context8.abrupt("return", {
                    data: Data,
                    meta: Meta
                  });

                case 42:
                case "end":
                  return _context8.stop();
              }
            }
          }, _callee8, this, [[3, 35, 38, 41]]);
        }));

        function sendEventChain(_x13) {
          return _sendEventChain.apply(this, arguments);
        }

        return sendEventChain;
      }()
    }, {
      key: "maybeCheckForBufferedFrames",
      value: function maybeCheckForBufferedFrames(events) {
        var _this7 = this;

        if (meetsCollectBufferedFrameCondition(this.publics.queue, events)) {
          if (this.willCollectBufferedFrame) {
            clearTimeout(this.willCollectBufferedFrame);
            this.willCollectBufferedFrame = false;
            bufferedFrameCollectDelay = BUFFERED_FRAME_COLLECT_DELAY.MIN;
          }

          this.willCollectBufferedFrame = setTimeout(function () {
            return _this7.pushNextCollectEvent();
          }, bufferedFrameCollectDelay);
        }
      }
    }, {
      key: "pushNextCollectEvent",
      value: function pushNextCollectEvent() {
        var _this8 = this;

        clearTimeout(this.willCollectBufferedFrame);
        this.willCollectBufferedFrame = false;

        if (bufferedFrameCollectDelay >= BUFFERED_FRAME_COLLECT_DELAY.MAX) {
          bufferedFrameCollectDelay = BUFFERED_FRAME_COLLECT_DELAY.MIN;
        } else {
          bufferedFrameCollectDelay *= 1.618;
          this.willCollectBufferedFrame = setTimeout(function () {
            return _this8.pushNextCollectEvent();
          }, bufferedFrameCollectDelay);
        }

        this.publics.queue.push(Object.assign({
          id: messageId++
        }, BUFFERED_FRAME_EVENT$3));
        this.triggerSendLoop();
      }
    }], [{
      key: "firstDelay",
      get: function get() {
        return 20;
        /* 20, 40, 250, 500;*/
      }
    }]);

    return Privates;
  }();

  var EventQueue = /*#__PURE__*/function () {
    function EventQueue(state, sessionToken) {
      _classCallCheck(this, EventQueue);

      var privates = new Privates(this, state, sessionToken);
      var queue = [];
      this.state = state;
      Object.defineProperties(this, _defineProperty2({
        queue: {
          get: function get() {
            return queue;
          }
        }
      }, $, {
        get: function get() {
          return privates;
        }
      }));
    }

    _createClass(EventQueue, [{
      key: "send",
      value: function send(event) {
        if (Array.isArray(event)) {
          var _this$queue;

          (_this$queue = this.queue).push.apply(_this$queue, _toConsumableArray(event));
        } else {
          this.queue.push(event);
        }

        this[$].triggerSendLoop();
      }
    }, {
      key: "addSubscriber",
      value: function addSubscriber(url, translator, imageEl) {
        var _this9 = this;

        this[$].subscribers.push(url);

        if (!!translator && typeof translator == "function") {
          this[$].translators.set(url, translator);
        }

        if (!!imageEl && imageEl instanceof HTMLImageElement) {
          this[$].images.set(url, imageEl);

          imageEl.onerror = function () {
            frameDrawing = false;
          };

          imageEl.addEventListener('load', function () {
            var ctx = _this9.state.viewState.ctx;
            ctx.drawImage(imageEl, 0, 0);
            frameDrawing = false;
          });
        }
      }
    }, {
      key: "addMetaListener",
      value: function addMetaListener(type, func) {
        var typeList = this[$].typeLists.get(type);

        if (!typeList) {
          typeList = [];
          this[$].typeLists.set(type, typeList);
        }

        typeList.push(func);
      }
    }]);

    return EventQueue;
  }();

  function drawFrames(_x14, _x15, _x16) {
    return _drawFrames.apply(this, arguments);
  }

  function _drawFrames() {
    _drawFrames = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee14(state, buf, image) {
      var _iterator17, _step17, _step17$value, img, frame;

      return regeneratorRuntime.wrap(function _callee14$(_context14) {
        while (1) {
          switch (_context14.prev = _context14.next) {
            case 0:
              buf = buf.filter(function (x) {
                return !!x;
              });
              buf.sort(function (_ref10, _ref11) {
                var frame1 = _ref10.frame;
                var frame2 = _ref11.frame;
                return frame2 - frame1;
              });
              buf = buf.filter(function (_ref12) {
                var frame = _ref12.frame,
                    targetId = _ref12.targetId;
                var cond = frame > latestFrame && targetId == state.activeTarget;
                latestFrame = frame;
                return cond;
              });
              _iterator17 = _createForOfIteratorHelper(buf);
              _context14.prev = 4;

              _iterator17.s();

            case 6:
              if ((_step17 = _iterator17.n()).done) {
                _context14.next = 20;
                break;
              }

              _step17$value = _step17.value, img = _step17$value.img, frame = _step17$value.frame;

              if (!(frame < latestFrame)) {
                _context14.next = 11;
                break;
              }

              console.warn("Got frame ".concat(frame, " less than ").concat(latestFrame, ". Dropping"));
              return _context14.abrupt("continue", 18);

            case 11:
              if (!frameDrawing) {
                _context14.next = 14;
                break;
              }

              _context14.next = 14;
              return sleep(Privates.firstDelay);

            case 14:
              frameDrawing = frame;
              image.src = "data:image/".concat(Format, ";base64,").concat(img);
              _context14.next = 18;
              return sleep(Privates.firstDelay);

            case 18:
              _context14.next = 6;
              break;

            case 20:
              _context14.next = 25;
              break;

            case 22:
              _context14.prev = 22;
              _context14.t0 = _context14["catch"](4);

              _iterator17.e(_context14.t0);

            case 25:
              _context14.prev = 25;

              _iterator17.f();

              return _context14.finish(25);

            case 28:
            case "end":
              return _context14.stop();
          }
        }
      }, _callee14, null, [[4, 22, 25, 28]]);
    }));
    return _drawFrames.apply(this, arguments);
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
    var someRequireShot = events.some(function (_ref13) {
      var command = _ref13.command;
      return command.requiresShot || command.requiresTailShot;
    });
    var createsTarget = events.some(function (_ref14) {
      var command = _ref14.command;
      return command.name == "Target.createTarget";
    });
    var meetsCondition = someRequireShot || createsTarget;
    return meetsCondition;
  }

  function transmitReply(_ref15) {
    var url = _ref15.url,
        id = _ref15.id,
        data = _ref15.data,
        meta = _ref15.meta,
        totalBandwidth = _ref15.totalBandwidth;
    var key = "".concat(url, ":").concat(id);
    var resolvePromise = waiting.get(key);

    if (resolvePromise) {
      waiting["delete"](key);
      resolvePromise({
        data: data,
        meta: meta,
        totalBandwidth: totalBandwidth
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

    latestAlert = setTimeout(function () {
      return alert(msg);
    }, ALERT_TIMEOUT);
  }

  function tconfirm(_x17) {
    return _tconfirm.apply(this, arguments);
  }

  function _tconfirm() {
    _tconfirm = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee15(msg) {
      var resolve, pr;
      return regeneratorRuntime.wrap(function _callee15$(_context15) {
        while (1) {
          switch (_context15.prev = _context15.next) {
            case 0:
              pr = new Promise(function (res) {
                return resolve = res;
              });

              if (latestAlert) {
                clearTimeout(latestAlert);
              }

              latestAlert = setTimeout(function () {
                resolve(confirm(msg));
              }, ALERT_TIMEOUT);
              return _context15.abrupt("return", pr);

            case 4:
            case "end":
              return _context15.stop();
          }
        }
      }, _callee15);
    }));
    return _tconfirm.apply(this, arguments);
  }

  function treload() {
    return _treload.apply(this, arguments);
  }

  function _treload() {
    _treload = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee16() {
      var resolve, pr;
      return regeneratorRuntime.wrap(function _callee16$(_context16) {
        while (1) {
          switch (_context16.prev = _context16.next) {
            case 0:
              pr = new Promise(function (res) {
                return resolve = res;
              });

              if (latestReload) {
                clearTimeout(latestReload);
              }

              latestReload = setTimeout(function () {
                return resolve(location.reload());
              }, ALERT_TIMEOUT);
              return _context16.abrupt("return", pr);

            case 4:
            case "end":
              return _context16.stop();
          }
        }
      }, _callee16);
    }));
    return _treload.apply(this, arguments);
  }

  var getKeyId = function getKeyId(event) {
    return event.key && event.key.length > 1 ? event.key : event.code;
  };

  var controlChars = new Set(["Enter", "Backspace", "Control", "Shift", "Alt", "Meta", "Space", "Delete", "ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", "Tab"]);

  function transformEvent(e) {
    var transformedEvent = {
      type: e.type
    };
    var event, synthetic, originalEvent;

    if (e.synthetic) {
      synthetic = e;
      originalEvent = e.event;
      var form;

      if (originalEvent) {
        form = originalEvent.target && originalEvent.target.matches && originalEvent.target.matches('form') ? originalEvent.target : null;
        transformedEvent.originalType = originalEvent.type;
        transformedEvent.originalEvent = originalEvent;
      }

      switch (synthetic.type) {
        case "auth-response":
          {
            var _synthetic = synthetic,
                authResponse = _synthetic.authResponse,
                _requestId2 = _synthetic.requestId;
            Object.assign(transformedEvent, {
              authResponse: authResponse,
              requestId: _requestId2
            });
            break;
          }

        case "typing":
          {
            // get (composed) characters created
            var data = synthetic.data;
            Object.assign(transformedEvent, {
              characters: data
            });
            break;
          }

        case "typing-syncValue":
        case "typing-clearAndInsertValue":
          {
            var _synthetic2 = synthetic,
                value = _synthetic2.value,
                contextId = _synthetic2.contextId;
            var encodedValue;

            if (value != null && value != undefined) {
              encodedValue = btoa(unescape(encodeURIComponent(value)));
            }

            Object.assign(transformedEvent, {
              encodedValue: encodedValue,
              value: value,
              contextId: contextId
            });
            break;
          }

        case "typing-deleteContentBackward":
          {
            var encodedValueToDelete;

            if (synthetic.valueToDelete) {
              encodedValueToDelete = btoa(unescape(encodeURIComponent(synthetic.valueToDelete)));
            }

            Object.assign(transformedEvent, {
              encodedValueToDelete: encodedValueToDelete,
              contextId: synthetic.contextId
            });
            break;
          }

        case "url-address":
          {
            // get URL address
            var address = synthetic.url;
            Object.assign(transformedEvent, {
              address: address
            });
            break;
          }

        case "search-bar":
          {
            // get URL address
            var search = originalEvent.target.search.value;
            Object.assign(transformedEvent, {
              search: search
            });
            break;
          }

        case "history":
          {
            // get button
            var action = form.clickedButton.value;
            Object.assign(transformedEvent, {
              action: action
            });
            break;
          }

        case "touchscroll":
          {
            var _synthetic3 = synthetic,
                deltaX = _synthetic3.deltaX,
                deltaY = _synthetic3.deltaY,
                bitmapX = _synthetic3.bitmapX,
                bitmapY = _synthetic3.bitmapY,
                _contextId2 = _synthetic3.contextId;
            Object.assign(transformedEvent, {
              deltaX: deltaX,
              deltaY: deltaY,
              bitmapX: bitmapX,
              bitmapY: bitmapY,
              contextId: _contextId2
            });
            break;
          }

        case "zoom":
          {
            var _synthetic4 = synthetic,
                scale = _synthetic4.scale;
            var coords = getBitmapCoordinates(originalEvent);
            Object.assign(transformedEvent, coords, {
              scale: scale
            });
            break;
          }

        case "select":
          {
            var _value = originalEvent.target.value;
            var executionContext = synthetic.state.waitingExecutionContext;
            Object.assign(transformedEvent, {
              value: _value,
              executionContext: executionContext
            });
            break;
          }

        case "window-bounds":
          {
            var _synthetic5 = synthetic,
                width = _synthetic5.width,
                height = _synthetic5.height,
                targetId = _synthetic5.targetId;
            Object.assign(transformedEvent, {
              width: width,
              height: height,
              targetId: targetId
            });
            break;
          }

        case "window-bounds-preImplementation":
          {
            // This is here until Browser.getWindowForTarget and Browser.setWindowBounds come online
            var _width2, _height2;

            if (synthetic.width !== undefined && synthetic.height !== undefined) {
              var _synthetic6 = synthetic;
              _width2 = _synthetic6.width;
              _height2 = _synthetic6.height;
            } else {
              var _form = form;
              _width2 = _form.width.value;
              _height2 = _form.height.value;
            }

            Object.assign(transformedEvent, {
              width: _width2,
              height: _height2
            });
            break;
          }

        case "user-agent":
          {
            var _synthetic7 = synthetic,
                userAgent = _synthetic7.userAgent,
                platform = _synthetic7.platform,
                acceptLanguage = _synthetic7.acceptLanguage;
            Object.assign(transformedEvent, {
              userAgent: userAgent,
              platform: platform,
              acceptLanguage: acceptLanguage
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

            var _getBitmapCoordinates = getBitmapCoordinates(transformedEvent.data),
                clientX = _getBitmapCoordinates.bitmapX,
                clientY = _getBitmapCoordinates.bitmapY;

            Object.assign(transformedEvent.data, {
              clientX: clientX,
              clientY: clientY
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
              synthetic: synthetic
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
            var id = getKeyId(event);

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
            var _event = event,
                button = _event.button;

            var _coords = getBitmapCoordinates(event);

            Object.assign(transformedEvent, _coords, {
              button: button
            });
            break;
          }
      }
    }

    return transformedEvent;
  }

  function getBitmapCoordinates(event) {
    var scale = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
    var clientX = event.clientX,
        clientY = event.clientY;
    var bitmap = event.target;
    var coordinates;

    if (bitmap) {
      var _bitmap$getBoundingCl = bitmap.getBoundingClientRect(),
          parentX = _bitmap$getBoundingCl.left,
          parentY = _bitmap$getBoundingCl.top,
          elementWidth = _bitmap$getBoundingCl.width,
          elementHeight = _bitmap$getBoundingCl.height;

      bitmap.width / elementWidth * scale;
      bitmap.height / elementHeight * scale;
      coordinates = {
        bitmapX: clientX - parentX,
        bitmapY: clientY - parentY
      };
    } else {
      coordinates = {
        clientX: clientX,
        clientY: clientY
      };
    }

    return coordinates;
  }

  var _templateObject$9;

  var omniBoxInput = null;
  var refocus = false;

  function OmniBox(state) {
    var activeTab = state.activeTab();
    var H = state.H;

    if (document.activeElement == omniBoxInput) {
      refocus = true;
    }

    return d(_templateObject$9 || (_templateObject$9 = taggedTemplateLiteral(["\n    <nav class=\"controls url\" stylist=styleNavControl>\n      <!--URL-->\n        <form class=url stylist=styleURLForm submit=", " click=", ">\n          <input \n            maxlength=3000\n            title=\"Address or search\"\n            bond=", "\n            stylist=styleOmniBox \n            autocomplete=off ", " \n            name=address \n            placeholder=\"", "\" \n            type=search \n            value=\"", "\"\n          >\n          <button ", " title=\"Go\" class=go>&crarr;</button>\n        </form>\n    </nav>\n  "])), function (e) {
      var form = e.target;
      var address = form.address;
      var url, search;

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
    }, saveClick, function (el) {
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
    var _ref30 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref30$query = _ref30.query,
        query = _ref30$query === void 0 ? '' : _ref30$query;

    {
      return "https://google.com/search?q=".concat(encodeURIComponent(query));
    }
  }

  var _templateObject$8;

  var pluginsMenuOpen = false;

  function PluginsMenuButton(state) {
    return u(_templateObject$8 || (_templateObject$8 = taggedTemplateLiteral(["\n    <nav class=\"controls plugins-menu-button aux\" stylist=\"styleNavControl stylePluginsMenuButton\">\n      <form submit=", ">\n        <button title=\"Menu\" accesskey=p>&#9776;</button>\n      </form>\n    </nav>\n  "])), [function (e) {
      return e.preventDefault();
    }, function () {
      pluginsMenuOpen ^= true;
      state.pluginsMenuActive = pluginsMenuOpen;
      state.viewState.dss.setState(state);
      state.viewState.dss.restyleElement(state.viewState.pmEl);
      state.viewState.dss.restyleElement(state.viewState.voodooEl);
    }]);
  } // Helper functions


  var _templateObject$7;

  function Controls(state) {
    var H = state.H,
        retargetTab = state.retargetTab;
    return d(_templateObject$7 || (_templateObject$7 = taggedTemplateLiteral(["\n    <nav class=\"controls history aux\" stylist=\"styleNavControl\">\n      <!--History-->\n        <form submit=", " click=", " stylist=\"styleHistoryForm\">\n          <button ", " name=history_action title=Back value=back class=back>&lt;</button>\n          <button ", " name=history_action title=Forward value=forward class=forward>&gt;</button>\n        </form>\n    </nav>\n    <nav class=\"controls keyinput aux\" stylist=\"styleNavControl\">\n      <!--Text-->\n        <form class=kbd-input submit=", ">\n          <input tabindex=-1 class=control name=key_input size=5\n            autocomplete=off\n            bond=", "\n            keydown=", "\n            keyup=", "\n            focusin=", "\n            compositionstart=", "\n            compositionupdate=", "\n            compositionend=", "\n            input=", "\n            keypress=", "\n            paste=", "\n            >\n          <textarea tabindex=-1 class=control name=textarea_input cols=5 rows=1\n            autocomplete=off\n            bond=", "\n            keydown=", "\n            keyup=", "\n            focusin=", "\n            compositionstart=", "\n            compositionupdate=", "\n            compositionend=", "\n            input=", "\n            keypress=", "\n            paste=", "\n            ></textarea>\n        </form>\n    </nav>\n    ", "\n    ", "\n  "])), function (e) {
      return H({
        synthetic: true,
        type: 'history',
        event: e
      });
    }, saveClick, state.tabs.length ? '' : 'disabled', state.tabs.length ? '' : 'disabled', function (e) {
      return e.preventDefault();
    }, function (el) {
      return state.viewState.keyinput = el;
    }, [logitKeyInputEvent, function (e) {
      return state.openKey = e.key;
    }, H, limitCursor, retargetTab], [logitKeyInputEvent, function () {
      return state.openKey = '';
    }, H, retargetTab], [function () {
      return clearWord(state);
    }, function () {
      return state.openKey = '';
    }], [logitKeyInputEvent, startComposition], [logitKeyInputEvent, updateComposition], [logitKeyInputEvent, endComposition], [logitKeyInputEvent, inputText], [logitKeyInputEvent, pressKey], function (e) {
      inputText({
        type: 'paste',
        data: e.clipboardData.getData('Text')
      });
    }, function (el) {
      return state.viewState.textarea = el;
    }, [logitKeyInputEvent, function (e) {
      return state.openKey = e.key;
    }, H, limitCursor, retargetTab], [logitKeyInputEvent, function () {
      return state.openKey = '';
    }, H, retargetTab], [function () {
      return clearWord(state);
    }, function () {
      return state.openKey = '';
    }], [logitKeyInputEvent, startComposition], [logitKeyInputEvent, updateComposition], [logitKeyInputEvent, endComposition], [logitKeyInputEvent, inputText], [logitKeyInputEvent, pressKey], function (e) {
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
      var data = e.data || "";

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
      var data = e.data || "";

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
    var key = keys[keypress.key];

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
    var canCommit = e.type == "input" && e.inputType == "insertText" || e.type == "compositionend" && !!(e.data || state.latestData);
    return canCommit;
  }

  var _templateObject$6, _templateObject2$5, _templateObject3$4;

  var serverBwThisSecond = 0;
  var lastServerBandwidth = 0;
  var bwThisSecond = 0;
  var lastBandwidth = 0;
  var last = Date.now();

  function BandwidthIndicator(state) {
    var saved = state.totalBandwidth / 1000000;
    var ss = 'M';

    if (saved > 1000) {
      saved /= 1000;
      ss = 'G';
    }

    var sr = state.totalServerBytesThisSecond;
    var sm = 'B/s';

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

    var used = state.totalBytes / 1000;
    var us = 'Kb';

    if (used > 1000) {
      used /= 1000;
      us = 'M';
    }

    if (used > 1000) {
      used /= 1000;
      us = 'G';
    }

    var lr = state.totalBytesThisSecond;
    var lm = 'B/s';

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

    return d(_templateObject$6 || (_templateObject$6 = taggedTemplateLiteral(["\n    <aside title=\"Bandwidth savings\" class=\"bandwidth-indicator\" stylist=\"styleBandwidthIndicator\">\n      <section class=measure>\n        &#x1f4e1; <span>", "</span>&nbsp;", "\n      </section>\n      <section class=measure>\n        &#x1f4bb; <span>", "</span>&nbsp;", "\n      </section>\n    </aside>\n  "])), Math.round(saved) + ss, state.showBandwidthRate ? u(_templateObject2$5 || (_templateObject2$5 = taggedTemplateLiteral(["<span>(", ")</span>"])), Math.round(sr) + sm) : '', Math.round(used) + us, state.showBandwidthRate ? u(_templateObject3$4 || (_templateObject3$4 = taggedTemplateLiteral(["<span>(", ")</span>"])), Math.round(lr) + lm) : '');
  }

  function startBandwidthLoop(state) {
    setInterval(function () {
      var now = Date.now();
      var diff = (now - last) / 1000;
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
    var _ref31 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        _ref31$bondTasks = _ref31.bondTasks,
        bondTasks = _ref31$bondTasks === void 0 ? [] : _ref31$bondTasks;

    return d(_templateObject$5 || (_templateObject$5 = taggedTemplateLiteral(["\n    <nav class=plugins-menu \n      bond=", " \n      stylist=\"stylePluginsMenu\"\n    >\n      <aside>\n        <header>\n          <h1 class=spread>\n            Menu\n            ", "\n          </h1>\n        </header>\n        <article>\n          <section>\n            <h1>\n              Quality Settings\n            </h1>\n            <form method=POST action=#save-settings>\n              <fieldset>\n                <legend>Image Mode Settings</legend>\n                <p>\n                  <label>\n                    <input type=range min=1 max=100 value=25 name=jpeg_quality\n                      oninput=\"jfqvalue.value = this.value;\" \n                    >\n                    JPEG frame quality\n                    &nbsp;(<output id=jfqvalue>25</output>)\n                  </label>\n                <p>\n                  <button>Save</button>\n              </fieldset>\n            </form>\n          </section>\n          <section>\n            <h1>\n              Plugins\n            </h1>\n            <form method=POST action=#plugins-settings>\n              <fieldset>\n                <legend>Enabled plugins</legend>\n                <p>\n                  <label>\n                    <input type=checkbox name=mapmaker>\n                    Map Maker \n                  </label>\n                <p>\n                  <label>\n                    <input type=checkbox name=mapviewer>\n                    Map Viewer\n                  </label>\n                <p>\n                  <label>\n                    <input type=checkbox name=trailmarker>\n                    Trail Marker\n                  </label>\n                <p>\n                  <label>\n                    <input type=checkbox name=trailrunner>\n                    Trail Runner\n                  </label>\n                <p>\n                  <button>Save</button>\n              </fieldset>\n              <fieldset>\n                <legend>Discover plugins</legend>\n                <p>\n                  <label>\n                    <button name=discover>Discover</button>\n                    Discover plugins to install \n                  </label>\n                <p>\n                  <label>\n                    <input type=search name=plugin_search>\n                    <button name=search>Search</button>\n                    Search for plugins to install\n                  </label>\n                <p>\n                  <ul class=plugins-search-results></ul>\n              </fieldset>\n            </form>\n          </section>\n        </article>\n      </aside>\n    </nav>\n  "])), [function (el) {
      return state.viewState.pmEl = el;
    }, function () {
      return console.log("PMA?".concat(!!state.pluginsMenuActive));
    }].concat(_toConsumableArray(bondTasks)), PluginsMenuButton(state));
  }

  var _templateObject$4, _templateObject2$4, _templateObject3$3;

  var NATIVE_MODALS = new Set(['alert', 'confirm', 'prompt', 'beforeunload']);
  var ModalRef = {
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
      var currentModal = state.viewState.currentModal; // these are default values when there is no current Modal

      var msg = '',
          type = '',
          title = '',
          currentModalEl = false;
      var csrfToken = '';
      var _requestId3 = '';
      var sessionId = '';
      var mode = '';
      var accept = '';
      var multiple = false;
      var submitText = '';
      var cancelText = '';
      var otherButton = null;
      var working = false;
      var url = '';

      if (currentModal) {
        // the defaults here are defaults when there *is* a current modal
        var _currentModal$msg = currentModal.msg;
        msg = _currentModal$msg === void 0 ? 'Empty' : _currentModal$msg;
        type = currentModal.type;
        var _currentModal$csrfTok = currentModal.csrfToken;
        csrfToken = _currentModal$csrfTok === void 0 ? '' : _currentModal$csrfTok;
        var _currentModal$url = currentModal.url;
        url = _currentModal$url === void 0 ? '' : _currentModal$url;
        var _currentModal$title = currentModal.title;
        title = _currentModal$title === void 0 ? 'Untitled' : _currentModal$title;
        currentModalEl = currentModal.el;
        var _currentModal$request = currentModal.requestId;
        _requestId3 = _currentModal$request === void 0 ? '' : _currentModal$request;
        var _currentModal$mode = currentModal.mode;
        mode = _currentModal$mode === void 0 ? '' : _currentModal$mode;
        var _currentModal$session = currentModal.sessionId;
        sessionId = _currentModal$session === void 0 ? '' : _currentModal$session;
        var _currentModal$accept = currentModal.accept;
        accept = _currentModal$accept === void 0 ? '' : _currentModal$accept;
        var _currentModal$submitT = currentModal.submitText;
        submitText = _currentModal$submitT === void 0 ? 'Submit' : _currentModal$submitT;
        var _currentModal$cancelT = currentModal.cancelText;
        cancelText = _currentModal$cancelT === void 0 ? 'Cancel' : _currentModal$cancelT;
        var _currentModal$otherBu = currentModal.otherButton;
        otherButton = _currentModal$otherBu === void 0 ? null : _currentModal$otherBu;
        var _currentModal$working = currentModal.working;
        working = _currentModal$working === void 0 ? false : _currentModal$working;
      }

      if (type == 'intentPrompt') {
        if (!url) {
          throw new TypeError("IntentPrompt modal requires a url");
        } else {
          var Url = new URL(url);

          if (Url.protocol == 'intent:') {
            if ((Url + '').includes('google.com/maps')) {
              Url.protocol = 'https:';
            }

            url = Url;
          }
        }
      }

      if (type == 'auth' && !_requestId3) {
        throw new TypeError("Auth modal requires a requestId to send the response to");
      }

      if (type == 'filechooser' && !(mode && sessionId && csrfToken)) {
        console.log(currentModal);
        throw new TypeError("File chooser modal requires both sessionId, mode and csrfToken");
      }

      if (mode == 'selectMultiple') {
        multiple = true;
      }

      return d(_templateObject$4 || (_templateObject$4 = taggedTemplateLiteral(["\n          <aside class=\"modals ", "\" stylist=\"styleModals\" click=", ">\n            <article bond=", " class=\"alert ", "\">\n              <h1>Alert!</h1>\n              <p class=message value=message>", "</p>\n              <button class=ok title=Acknowledge value=ok>Acknowledge</button>\n            </article>\n            <article bond=", " class=\"confirm ", "\">\n              <h1>Confirm</h1>\n              <p class=message value=message>", "</p>\n              <button class=ok title=\"Confirm\" value=ok>Confirm</button>\n              <button class=cancel title=\"Deny\" value=cancel>Deny</button>\n            </article>\n            <article bond=", " class=\"prompt ", "\">\n              <h1>Prompt</h1>\n              <p class=message value=message>", "</p>\n              <p><input type=text name=response>\n              <button class=ok title=\"Send\" value=ok>Send</button>\n              <button class=cancel title=\"Dismiss\" value=cancel>Dismiss</button>\n            </article>\n            <article bond=", " class=\"beforeunload ", "\">\n              <h1>Page unloading</h1>\n              <p class=message value=message>", "</p>\n              <button class=ok title=\"Leave\" value=ok>Leave</button>\n              <button class=cancel title=\"Remain\" value=cancel>Remain</button>\n            </article>\n            <article bond=", " class=\"infobox ", "\">\n              <h1>", "</h1>\n              <textarea \n                readonly class=message value=message rows=", "\n              >", "</textarea>\n              <button class=ok title=\"Got it\" value=ok>OK</button>\n            </article>\n            <article bond=", " class=\"notice ", "\">\n              <h1>", "</h1>\n              <p class=message value=message>", "</p>\n              <button class=ok title=Acknowledge value=ok>OK</button>\n              ", "\n            </article>\n            <article bond=", " class=\"auth ", "\">\n              <h1>", "</h1>\n              <form>\n                <p class=message value=message>", "</p>\n                <input type=hidden name=requestid value=", ">\n                <p>\n                  <input type=text name=username placeholder=username maxlength=140>\n                <p>\n                  <input type=password name=password placeholder=password maxlength=140>\n                <p>\n                  <button click=", ">Submit</button>\n                  <button click=", ">Cancel</button>\n              </form>\n            </article>\n            <article bond=", " class=\"filechooser ", "\">\n              <h1>", "</h1>\n              <form method=POST action=/file enctype=multipart/form-data>\n                <p class=message value=message>", "</p>\n                <input type=hidden name=sessionid value=", ">\n                <input type=hidden name=_csrf value=", ">\n                <p>\n                  <label>\n                    Select ", ".\n                    <input type=file name=files ", " accept=\"", "\">\n                  </label>\n                <p>\n                  <button \n                    ", " \n                    click=", "\n                  >", "</button>\n                  <button \n                    ", " \n                    click=", "\n                  >", "</button>\n              </form>\n            </article>\n            <article bond=", " class=\"intent-prompt ", "\">\n              <h1>", "</h1>\n              <form method=GET action=\"", "\" target=_top submit=", ">\n                <p class=message value=message>", "</p>\n                <p>\n                  <button type=reset>Stop it</button>\n                  <button>Open external app</button>\n              </form>\n            </article>\n          </aside>\n        "])), currentModal ? 'active' : '', function (click) {
        return closeModal(click, state);
      }, function (el) {
        return ModalRef.alert = el;
      }, currentModalEl === ModalRef.alert ? 'open' : '', msg || 'You are alerted.', function (el) {
        return ModalRef.confirm = el;
      }, currentModalEl === ModalRef.confirm ? 'open' : '', msg || 'You are asked to confirm', function (el) {
        return ModalRef.prompt = el;
      }, currentModalEl === ModalRef.prompt ? 'open' : '', msg || 'You are prompted for information:', function (el) {
        return ModalRef.beforeunload = el;
      }, currentModalEl === ModalRef.beforeunload ? 'open' : '', msg || 'Are you sure you wish to leave?', function (el) {
        return ModalRef.infobox = el;
      }, currentModalEl === ModalRef.infobox ? 'open' : '', title || 'Info', Math.ceil(msg.length / 80), msg, function (el) {
        return ModalRef.notice = el;
      }, currentModalEl === ModalRef.notice ? 'open' : '', title, msg || 'Empty notice', otherButton ? u(_templateObject2$4 || (_templateObject2$4 = taggedTemplateLiteral(["<button title=\"", "\" click=", ">", "</button>"])), otherButton.title, otherButton.onclick, otherButton.title) : '', function (el) {
        return ModalRef.auth = el;
      }, currentModalEl === ModalRef.auth ? 'open' : '', title, msg || 'Empty notice', _requestId3, function (click) {
        return respondWithAuth(click, state);
      }, function (click) {
        return respondWithCancel(click, state);
      }, function (el) {
        return ModalRef.filechooser = el;
      }, currentModalEl === ModalRef.filechooser ? 'open' : '', title, msg || 'Empty notice', sessionId, csrfToken, multiple ? 'one or more files' : 'one file', multiple ? 'multiple' : '', accept, working ? 'disabled' : '', function (click) {
        return chooseFile(click, state);
      }, submitText, working ? 'disabled' : '', function (click) {
        return cancelFileChooser(click, state);
      }, cancelText, function (el) {
        return ModalRef.intentPrompt = el;
      }, currentModalEl === ModalRef.intentPrompt ? 'open' : '', title, url, function (submission) {
        submission.preventDefault();
        window.top.open(url);
      }, "This page is asking to open an external app using URL: ".concat(url));
    } catch (e) {
      console.log("Modal error", e);
    }
  }

  function chooseFile(_x18, _x19) {
    return _chooseFile.apply(this, arguments);
  }

  function _chooseFile() {
    _chooseFile = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee17(click, state) {
      var form, body, request, resp;
      return regeneratorRuntime.wrap(function _callee17$(_context17) {
        while (1) {
          switch (_context17.prev = _context17.next) {
            case 0:
              click.preventDefault();
              click.stopPropagation();
              form = click.target.closest('form');
              body = new FormData(form);
              request = {
                method: form.method,
                body: body
              };
              Object.assign(state.viewState.currentModal, {
                submitText: 'Uploading...',
                working: true
              });
              Modals(state);
              _context17.next = 9;
              return fetch(form.action, request).then(function (r) {
                return r.json();
              });

            case 9:
              resp = _context17.sent;

              if (resp.error) {
                alert(resp.error);
              }

              closeModal(click, state);

            case 12:
            case "end":
              return _context17.stop();
          }
        }
      }, _callee17);
    }));
    return _chooseFile.apply(this, arguments);
  }

  function cancelFileChooser(_x20, _x21) {
    return _cancelFileChooser.apply(this, arguments);
  }

  function _cancelFileChooser() {
    _cancelFileChooser = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee18(click, state) {
      var form, body, request, resp;
      return regeneratorRuntime.wrap(function _callee18$(_context18) {
        while (1) {
          switch (_context18.prev = _context18.next) {
            case 0:
              click.preventDefault();
              click.stopPropagation();
              form = click.target.closest('form');
              form.reset();
              body = new FormData(form);
              body["delete"]('files');
              request = {
                method: form.method,
                body: body
              };
              Object.assign(state.viewState.currentModal, {
                cancelText: 'Canceling...',
                working: true
              });
              Modals(state);
              _context18.next = 11;
              return fetch(form.action, request).then(function (r) {
                return r.json();
              });

            case 11:
              resp = _context18.sent;

              if (resp.error) {
                alert("An error occurred");
              }

              closeModal(click, state);

            case 14:
            case "end":
              return _context18.stop();
          }
        }
      }, _callee18);
    }));
    return _cancelFileChooser.apply(this, arguments);
  }

  function respondWithAuth(click, state) {
    click.preventDefault();
    click.stopPropagation();
    var form = click.target.closest('form');
    var data = new FormData(form);
    var requestId = data.get('requestid').slice(0, 140);
    var username = data.get('username').slice(0, 140);
    var password = data.get('password').slice(0, 140);
    var authResponse = {
      username: username,
      password: password,
      response: "ProvideCredentials"
    };
    state.H({
      synthetic: true,
      type: 'auth-response',
      requestId: requestId,
      authResponse: authResponse
    });
    closeModal(click, state);
  }

  function respondWithCancel(click, state) {
    click.preventDefault();
    click.stopPropagation();
    var form = click.target.closest('form');
    var data = new FormData(form);
    var requestId = data.get('requestid').slice(0, 140);
    var authResponse = {
      response: "CancelAuth"
    };
    state.H({
      synthetic: true,
      type: 'auth-response',
      requestId: requestId,
      authResponse: authResponse
    });
    closeModal(click, state);
  }

  function openModal() {
    var _ref32 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref32$modal = _ref32.modal,
        sessionId = _ref32$modal.sessionId,
        mode = _ref32$modal.mode,
        requestId = _ref32$modal.requestId,
        title = _ref32$modal.title,
        type = _ref32$modal.type,
        msg = _ref32$modal.message,
        defaultPrompt = _ref32$modal.defaultPrompt,
        url = _ref32$modal.url,
        otherButton = _ref32$modal.otherButton,
        csrfToken = _ref32$modal.csrfToken;

    var state = arguments.length > 1 ? arguments[1] : undefined;
    var currentModal = {
      type: type,
      csrfToken: csrfToken,
      mode: mode,
      requestId: requestId,
      msg: msg,
      el: ModalRef[type],
      sessionId: sessionId,
      otherButton: otherButton,
      title: title,
      url: url
    };
    state.viewState.currentModal = currentModal; //console.log(state.viewState.currentModal);

    Modals(state);
  }

  function closeModal(click, state) {
    if (!click.target.matches('button')) return;
    var response = click.target.value || 'unknown';
    var sessionId = state.viewState.currentModal.sessionId;
    state.viewState.lastModal = state.viewState.currentModal;
    state.viewState.currentModal = null;
    state.viewState.lastModal.modalResponse = response;

    if (NATIVE_MODALS.has(state.viewState.lastModal.type)) {
      console.log(state.viewState);
      state.H({
        synthetic: true,
        type: "respond-to-modal",
        response: response,
        sessionId: sessionId
      });
    }

    setTimeout(function () {
      return Modals(state);
    }, 50);
  } // Permission request


  function PermissionRequest(_ref) {
    var permission = _ref.permission,
        request = _ref.request,
        page = _ref.page;
    return d(_templateObject3$3 || (_templateObject3$3 = taggedTemplateLiteral(["\n        <article class=\"permission-request hidden\">\n          <h1>", "</h1>\n          <p class=request>", " is requesting ", " permission. The details are: ", "</p>\n          <button class=grant>Grant</button>\n          <button class=deny>Deny</button>\n        </article>\n      "])), permission, page, permission, request);
  }

  var _templateObject$3, _templateObject2$3, _templateObject3$2, _templateObject4$2;

  var CLOSE_DELAY = 222;
  var SHORT_CUT = 'Ctrl+Shift+J'; //const FUNC = e => console.log("Doing it", e);

  var CONTEXT_MENU = function CONTEXT_MENU(state) {
    return {
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
    };
  };

  function
  /*state*/
  ContextMenu() {
    return d(_templateObject$3 || (_templateObject$3 = taggedTemplateLiteral(["\n\n  "])));
  }

  var CTX_MENU_THRESHOLD = 675;

  function makeContextMenuHandler(state) {
    var node = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
      type: 'page',
      id: 'current-page'
    };
    var nodeType = node.type;
    return function (contextMenu) {
      var menuItems = CONTEXT_MENU()[nodeType]; // we need this check because we attach a handler to each node
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
        var pageX, pageY;

        if (contextMenu.pageX && contextMenu.pageY) {
          pageX = contextMenu.pageX;
          pageY = contextMenu.pageY;
        } else {
          var _contextMenu$detail = contextMenu.detail,
              clientX = _contextMenu$detail.clientX,
              clientY = _contextMenu$detail.clientY;
          var _contextMenu$detail2 = contextMenu.detail;
          pageX = _contextMenu$detail2.pageX;
          pageY = _contextMenu$detail2.pageY;
          Object.assign(contextMenu, {
            pageX: pageX,
            pageY: pageY,
            clientX: clientX,
            clientY: clientY
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
        var bondTasks = [function (el) {
          // only have 1 context menu at a time
          close(state, false);
          state.viewState.contextMenu = el;
        }, function () {
          return self.addEventListener('click', function remove(click) {
            // if we clicked outside the menu, 
            // remove the menu and stop listening for such clicks
            if (!click.target.closest('.context-menu')) {
              close(state, false);
              self.removeEventListener('click', remove);
            }
          });
        }, function (el) {
          var x = pageX + 'px';
          var y = pageY + 'px';

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
        var menuView = u(_templateObject2$3 || (_templateObject2$3 = taggedTemplateLiteral(["\n        <aside class=context-menu \n          role=menu \n          bond=", "\n          contextmenu=", "\n        >\n          <h1>Menu</h1> \n          <hr>\n          <ul>\n            ", "\n          </ul>\n        </aside>\n      "])), bondTasks, function (e) {
          return (
            /* don't trigger within the menu */
            e.preventDefault(), e.stopPropagation()
          );
        }, menuItems.map(function (_ref) {
          var title = _ref.title,
              func = _ref.func,
              hr = _ref.hr;
          return u(_templateObject3$2 || (_templateObject3$2 = taggedTemplateLiteral(["\n              ", "\n              <li click=", ">", "</li>\n            "])), hr ? u(_templateObject4$2 || (_templateObject4$2 = taggedTemplateLiteral(["<hr>"]))) : '', function (click) {
            return func(click, state);
          }, title);
        }));
        menuView.to(contextMenu.currentTarget, 'afterEnd');
      }
    };
  }

  function close(state) {
    var delay = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

    if (delay) {
      setTimeout(function () {
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
    var contextClick = state.viewState.contextMenuClick;
    var clientX = contextClick.clientX,
        clientY = contextClick.clientY,
        target = contextClick.target;
    var H = state.H;
    close(state);

    state.elementInfoContinuation = function (_ref2) {
      var innerText = _ref2.innerText,
          noSuchElement = _ref2.noSuchElement;

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
        target: target,
        clientX: clientX,
        clientY: clientY
      }
    });
  }

  function copyLink(click, state) {
    var contextClick = state.viewState.contextMenuClick;
    var clientX = contextClick.clientX,
        clientY = contextClick.clientY,
        target = contextClick.target;
    var H = state.H;
    close(state);

    state.elementInfoContinuation = function (_ref3) {
      var attributes = _ref3.attributes,
          noSuchElement = _ref3.noSuchElement;

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
        target: target,
        clientX: clientX,
        clientY: clientY
      }
    });
  }

  function paste(click, state) {
    close(state);
    var pasteData = prompt("Enter text to paste");
    var input = state.viewState.shouldHaveFocus;
    if (!input) return;
    var value = input.value;
    var newValue = value.slice(0, input.selectionStart) + pasteData + value.slice(input.selectionEnd);
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
    var timeNow = new Date();
    var stringTime = timeNow.toJSON();
    var fileName = stringTime.replace(/[-:.]/g, "_");
    var imageData = state.viewState.canvasEl.toDataURL();
    var downloader = document.createElement('a');
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
    var goButton = document.querySelector('form.url button.go');
    goButton.click();
  }

  function openInNewTab(click, state) {
    var contextClick = state.viewState.contextMenuClick;
    var target = contextClick.target,
        pageX = contextClick.pageX,
        pageY = contextClick.pageY,
        clientX = contextClick.clientX,
        clientY = contextClick.clientY;
    var H = state.H;
    state.viewState.killNextMouseReleased = false;

    if (deviceIsMobile()) {
      // we need to get the URL of the target link 
      // then use 
      // state.createTab(click, url);
      state.elementInfoContinuation = function (_ref4) {
        var attributes = _ref4.attributes,
            noSuchElement = _ref4.noSuchElement;

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
          target: target,
          clientX: clientX,
          clientY: clientY
        }
      });
    } else {
      H({
        type: 'pointerdown',
        button: 0,
        ctrlKey: true,
        target: target,
        pageX: pageX,
        pageY: pageY,
        clientX: clientX,
        clientY: clientY,
        noShot: true
      });
      H({
        type: 'pointerup',
        button: 0,
        ctrlKey: true,
        target: target,
        pageX: pageX,
        pageY: pageY,
        clientX: clientX,
        clientY: clientY
      });
    }

    close(state);
  }

  function newBrowserContextAndTab(click, state) {
    var H = state.H;
    H({
      synthetic: true,
      type: 'newIncognitoTab',
      data: {}
    });
    close(state);
  }

  function clearHistoryAndCacheLeaveCookies(click, state) {
    var doIt = confirm("You'll stay signed in to most sites, but wipe browsing history and cached files. Are you sure?");

    if (doIt) {
      var H = state.H;
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
    var doIt = confirm("This will sign you out of most sites, and wipe all history and caches. Really wipe everything?");

    if (doIt) {
      var H = state.H;
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

  function fullScreen(_x22, _x23) {
    return _fullScreen.apply(this, arguments);
  }

  function _fullScreen() {
    _fullScreen = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee19(click, state) {
      return regeneratorRuntime.wrap(function _callee19$(_context19) {
        while (1) {
          switch (_context19.prev = _context19.next) {
            case 0:
              if (!(document.fullscreenElement || document.webkitFullscreenElement)) {
                _context19.next = 9;
                break;
              }

              if (!document.webkitCancelFullscreen) {
                _context19.next = 5;
                break;
              }

              document.webkitCancelFullscreen();
              _context19.next = 7;
              break;

            case 5:
              _context19.next = 7;
              return document.exitFullscreen();

            case 7:
              _context19.next = 15;
              break;

            case 9:
              if (!document.body.webkitRequestFullscreen) {
                _context19.next = 13;
                break;
              }

              document.body.webkitRequestFullscreen({
                navigationUI: 'hide'
              });
              _context19.next = 15;
              break;

            case 13:
              _context19.next = 15;
              return document.body.requestFullscreen({
                navigationUI: 'hide'
              });

            case 15:
              close(state);

            case 16:
            case "end":
              return _context19.stop();
          }
        }
      }, _callee19);
    }));
    return _fullScreen.apply(this, arguments);
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

  var BROWSER_SIDE = function () {
    try {
      return self.DOMParser && true;
    } catch (e) {
      return false;
    }
  }();

  var BuiltIns = [Symbol, Boolean, Number, String, Object, Set, Map, WeakMap, WeakSet, Uint8Array, Uint16Array, Uint32Array, Float32Array, Float64Array, Int8Array, Int16Array, Int32Array, Uint8ClampedArray].concat(_toConsumableArray(BROWSER_SIDE ? [Node, NodeList, Element, HTMLElement, Blob, ArrayBuffer, FileList, Text, HTMLDocument, Document, DocumentFragment, Error, File, Event, EventTarget, URL] : [Buffer]));
  var SEALED_DEFAULT = true;

  var isNone = function isNone(instance) {
    return instance == null || instance == undefined;
  };

  var typeCache = new Map();
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

  T[Symbol["for"]('jtype-system.typeCache')] = typeCache;
  defineSpecials();
  mapBuiltins();

  function T(parts) {
    for (var _len = arguments.length, vals = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      vals[_key - 1] = arguments[_key];
    }

    var cooked = vals.reduce(function (prev, cur, i) {
      return prev + cur + parts[i + 1];
    }, parts[0]);
    var typeName = cooked;
    if (!typeCache.has(typeName)) throw new TypeError("Cannot use type ".concat(typeName, " before it is defined."));
    return typeCache.get(typeName).type;
  }

  function partialMatch(type, instance) {
    return validate(type, instance, {
      partial: true
    });
  }

  function validate(type, instance) {
    var _ref33 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
        _ref33$partial = _ref33.partial,
        partial = _ref33$partial === void 0 ? false : _ref33$partial;

    guardType(type);
    guardExists(type);
    var typeName = type.name;

    var _typeCache$get = typeCache.get(typeName),
        spec = _typeCache$get.spec,
        kind = _typeCache$get.kind,
        help = _typeCache$get.help,
        verify = _typeCache$get.verify,
        verifiers = _typeCache$get.verifiers,
        sealed = _typeCache$get.sealed;

    var specKeyPaths = spec ? allKeyPaths(spec).sort() : [];
    var specKeyPathSet = new Set(specKeyPaths);
    var bigErrors = [];

    switch (kind) {
      case "def":
        {
          var allValid = true;

          if (spec) {
            var keyPaths = partial ? allKeyPaths(instance, specKeyPathSet) : specKeyPaths;
            allValid = !isNone(instance) && keyPaths.every(function (kp) {
              // Allow lookup errors if the type match for the key path can include None
              var _lookup = lookup(instance, kp, function () {
                return checkTypeMatch(lookup(spec, kp).resolved, T(_templateObject$2 || (_templateObject$2 = taggedTemplateLiteral(["None"]))));
              }),
                  resolved = _lookup.resolved,
                  lookupErrors = _lookup.errors;

              bigErrors.push.apply(bigErrors, _toConsumableArray(lookupErrors));
              if (lookupErrors.length) return false;
              var keyType = lookup(spec, kp).resolved;

              if (!keyType || !(keyType instanceof Type)) {
                bigErrors.push({
                  error: "Key path '".concat(kp, "' is not present in the spec for type '").concat(typeName, "'")
                });
                return false;
              }

              var _validate = validate(keyType, resolved),
                  valid = _validate.valid,
                  validationErrors = _validate.errors;

              bigErrors.push.apply(bigErrors, _toConsumableArray(validationErrors));
              return valid;
            });
          }

          var verified = true;

          if (partial && !spec && !!verify) {
            throw new TypeError("Type checking with option 'partial' is not a valid option for types that" + " only use a verify function but have no spec");
          } else if (verify) {
            try {
              verified = verify(instance);

              if (!verified) {
                if (verifiers) {
                  throw {
                    error: "Type ".concat(typeName, " value '").concat(JSON.stringify(instance), "' violated at least 1 verify function in:\n").concat(verifiers.map(function (f) {
                      return '\t' + (f.help || '') + ' (' + f.verify.toString() + ')';
                    }).join('\n'))
                  };
                } else if (type.isSumType) {
                  throw {
                    error: "Value '".concat(JSON.stringify(instance), "' did not match any of: ").concat(_toConsumableArray(type.types.keys()).map(function (t) {
                      return t.name;
                    })),
                    verify: verify,
                    verifiers: verifiers
                  };
                } else {
                  var helpMsg = '';

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

          var sealValid = true;

          if (!!sealed && !!spec) {
            var type_key_paths = specKeyPaths;
            var all_key_paths = allKeyPaths(instance, specKeyPathSet).sort();
            sealValid = all_key_paths.join(',') == type_key_paths.join(',');

            if (!sealValid) {
              if (all_key_paths.length < type_key_paths.length) {
                sealValid = true;
              } else {
                var errorKeys = [];
                var tkp = new Set(type_key_paths);

                var _iterator4 = _createForOfIteratorHelper(all_key_paths),
                    _step4;

                try {
                  for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
                    var k = _step4.value;

                    if (!tkp.has(k)) {
                      errorKeys.push({
                        error: "Key path '".concat(k, "' is not in the spec for type ").concat(typeName)
                      });
                    }
                  }
                } catch (err) {
                  _iterator4.e(err);
                } finally {
                  _iterator4.f();
                }

                if (errorKeys.length) {
                  bigErrors.push.apply(bigErrors, errorKeys);
                }
              }
            }
          }

          return {
            valid: allValid && verified && sealValid,
            errors: bigErrors,
            partial: partial
          };
        }

      case "defCollection":
        {
          var _validate2 = validate(spec.container, instance),
              containerValid = _validate2.valid,
              containerErrors = _validate2.errors;

          var membersValid = true;
          var _verified2 = true;
          bigErrors.push.apply(bigErrors, _toConsumableArray(containerErrors));

          if (partial) {
            throw new TypeError("Type checking with option 'partial' is not a valid option for Collection types");
          } else {
            if (containerValid) {
              membersValid = _toConsumableArray(instance).every(function (member) {
                var _validate3 = validate(spec.member, member),
                    valid = _validate3.valid,
                    errors = _validate3.errors;

                bigErrors.push.apply(bigErrors, _toConsumableArray(errors));
                return valid;
              });
            }

            if (verify) {
              try {
                _verified2 = verify(instance);
              } catch (e) {
                bigErrors.push(e);
                _verified2 = false;
              }
            }
          }

          return {
            valid: containerValid && membersValid && _verified2,
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
    return validate.apply(void 0, arguments).valid;
  }

  function lookup(obj, keyPath, canBeNone) {
    if (isNone(obj)) throw new TypeError("Lookup requires a non-unset object.");
    if (!keyPath) throw new TypeError("keyPath must not be empty");
    var keys = keyPath.split(/\./g);
    var pathComplete = [];
    var errors = [];
    var resolved = obj;

    while (keys.length) {
      var nextKey = keys.shift();
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
      resolved: resolved,
      errors: errors
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
    } else if (typeA.name.startsWith('?') && typeB == T(_templateObject2$2 || (_templateObject2$2 = taggedTemplateLiteral(["None"])))) {
      return true;
    } else if (typeB.name.startsWith('?') && typeA == T(_templateObject3$1 || (_templateObject3$1 = taggedTemplateLiteral(["None"])))) {
      return true;
    }

    if (typeA.name.startsWith('>') || typeB.name.startsWith('>')) {
      console.error(new Error("Check type match has not been implemented for derived//sub types yet."));
    }

    return false;
  }

  function option(type) {
    return T(_templateObject4$1 || (_templateObject4$1 = taggedTemplateLiteral(["?", ""])), type.name);
  }

  function sub(type) {
    return T(_templateObject5$1 || (_templateObject5$1 = taggedTemplateLiteral([">", ""])), type.name);
  }

  function defSub(type, spec) {
    var _ref34 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
        _ref34$verify = _ref34.verify,
        verify = _ref34$verify === void 0 ? undefined : _ref34$verify,
        _ref34$help = _ref34.help,
        help = _ref34$help === void 0 ? '' : _ref34$help;

    var name = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : '';
    guardType(type);
    guardExists(type);
    var verifiers;

    if (!verify) {
      verify = function verify() {
        return true;
      };
    }

    if (type["native"]) {
      verifiers = [{
        help: help,
        verify: verify
      }];

      verify = function verify(i) {
        return i instanceof type["native"];
      };

      var helpMsg = "Needs to be of type ".concat(type["native"].name, ". ").concat(help || '');
      verifiers.push({
        help: helpMsg,
        verify: verify
      });
    }

    var newType = def("".concat(name, ">").concat(type.name), spec, {
      verify: verify,
      help: help,
      verifiers: verifiers
    });
    return newType;
  }

  function defEnum(name) {
    if (!name) throw new TypeError("Type must be named.");
    guardRedefinition(name);

    for (var _len2 = arguments.length, values = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
      values[_key2 - 1] = arguments[_key2];
    }

    var valueSet = new Set(values);

    var verify = function verify(i) {
      return valueSet.has(i);
    };

    var help = "Value of Enum type ".concat(name, " must be one of ").concat(values.join(','));
    return def(name, null, {
      verify: verify,
      help: help
    });
  }

  function exists(name) {
    return typeCache.has(name);
  }

  function guardRedefinition(name) {
    if (exists(name)) throw new TypeError("Type ".concat(name, " cannot be redefined."));
  }

  function allKeyPaths(o, specKeyPaths) {
    var isTypeSpec = !specKeyPaths;
    var keyPaths = new Set();
    return recurseObject(o, keyPaths, '');

    function recurseObject(o, keyPathSet) {
      var lastLevel = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';
      var levelKeys = Object.getOwnPropertyNames(o);
      var keyPaths = levelKeys.map(function (k) {
        return lastLevel + (lastLevel.length ? '.' : '') + k;
      });
      levelKeys.forEach(function (k, i) {
        var v = o[k];

        if (isTypeSpec) {
          if (v instanceof Type) {
            keyPathSet.add(keyPaths[i]);
          } else if (_typeof(v) == "object") {
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
          } else if (_typeof(v) == "object") {
            if (!Array.isArray(v)) {
              recurseObject(v, keyPathSet, keyPaths[i]);
            } else {
              v.forEach(function (item, index) {
                return recurseObject(item, keyPathSet, keyPaths[i] + '.' + index);
              }); //throw new TypeError(`We don't support Instances that use Arrays as structure, just yet.`); 
            }
          } else {
            //console.warn("Spec has no such key",  keyPaths[i]);
            keyPathSet.add(keyPaths[i]);
          }
        }
      });
      return _toConsumableArray(keyPathSet);
    }
  }

  function defOption(type) {
    guardType(type);
    var typeName = type.name;
    return T.def("?".concat(typeName), null, {
      verify: function verify(i) {
        return isUnset(i) || T.check(type, i);
      }
    });
  }

  function maybe(type) {
    try {
      return defOption(type);
    } catch (e) {// console.log(`Option Type ${type.name} already declared.`, e);
    }

    return T(_templateObject6 || (_templateObject6 = taggedTemplateLiteral(["?", ""])), type.name);
  }

  function verify() {
    return check.apply(void 0, arguments);
  }

  function defCollection(name, _ref) {
    var container = _ref.container,
        member = _ref.member;

    var _ref35 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
        _ref35$sealed = _ref35.sealed,
        sealed = _ref35$sealed === void 0 ? SEALED_DEFAULT : _ref35$sealed,
        _ref35$verify = _ref35.verify,
        verify = _ref35$verify === void 0 ? undefined : _ref35$verify;

    if (!name) throw new TypeError("Type must be named.");
    if (!container || !member) throw new TypeError("Type must be specified.");
    guardRedefinition(name);
    var kind = 'defCollection';
    var t = new Type(name);
    var spec = {
      kind: kind,
      spec: {
        container: container,
        member: member
      },
      verify: verify,
      sealed: sealed,
      type: t
    };
    typeCache.set(name, spec);
    return t;
  }

  function defTuple(name, _ref2) {
    var pattern = _ref2.pattern;
    if (!name) throw new TypeError("Type must be named.");
    if (!pattern) throw new TypeError("Type must be specified.");
    var kind = 'def';
    var specObj = {};
    pattern.forEach(function (type, key) {
      return specObj[key] = type;
    });
    var t = new Type(name);
    var spec = {
      kind: kind,
      spec: specObj,
      type: t
    };
    typeCache.set(name, spec);
    return t;
  }

  function Type(name) {
    var mods = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    if (!(this instanceof Type ? this.constructor : void 0)) throw new TypeError("Type with new only.");
    Object.defineProperty(this, 'name', {
      get: function get() {
        return name;
      }
    });
    this.typeName = name;

    if (mods.types) {
      var types = mods.types;
      var typeSet = new Set(types);
      Object.defineProperty(this, 'isSumType', {
        get: function get() {
          return true;
        }
      });
      Object.defineProperty(this, 'types', {
        get: function get() {
          return typeSet;
        }
      });
    }

    if (mods["native"]) {
      var _native3 = mods["native"];
      Object.defineProperty(this, 'native', {
        get: function get() {
          return _native3;
        }
      });
    }
  }

  Type.prototype.toString = function () {
    return "".concat(this.typeName, " Type");
  };

  function def(name, spec) {
    var _ref36 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
        _ref36$help = _ref36.help,
        help = _ref36$help === void 0 ? '' : _ref36$help,
        _ref36$verify = _ref36.verify,
        verify = _ref36$verify === void 0 ? undefined : _ref36$verify,
        _ref36$sealed = _ref36.sealed,
        sealed = _ref36$sealed === void 0 ? undefined : _ref36$sealed,
        _ref36$types = _ref36.types,
        types = _ref36$types === void 0 ? undefined : _ref36$types,
        _ref36$verifiers = _ref36.verifiers,
        verifiers = _ref36$verifiers === void 0 ? undefined : _ref36$verifiers,
        _ref36$native = _ref36["native"],
        _native4 = _ref36$native === void 0 ? undefined : _ref36$native;

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

    var kind = 'def';

    if (sealed === undefined) {
      sealed = true;
    }

    var t = new Type(name, {
      types: types,
      "native": _native4
    });
    var cache = {
      spec: spec,
      kind: kind,
      help: help,
      verify: verify,
      verifiers: verifiers,
      sealed: sealed,
      types: types,
      "native": _native4,
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
      types: types,
      verify: function verify(i) {
        return types.some(function (t) {
          return check(t, i);
        });
      }
    });
  }

  function guard(type, instance) {
    guardType(type);
    guardExists(type);

    var _validate4 = validate(type, instance),
        valid = _validate4.valid,
        errors = _validate4.errors;

    if (!valid) throw new TypeError("Type ".concat(type, " requested, but item is not of that type: ").concat(errors.join(', ')));
  }

  function guardType(t) {
    //console.log(t);
    if (!(t instanceof Type)) throw new TypeError("Type must be a valid Type object.");
  }

  function guardExists(t) {
    var name = originalName(t);
    if (!exists(name)) throw new TypeError("Type must exist. Type ".concat(name, " has not been defined."));
  }

  function errors() {
    return validate.apply(void 0, arguments).errors;
  }

  function mapBuiltins() {
    BuiltIns.forEach(function (t) {
      return def(originalName(t), null, {
        "native": t,
        verify: function verify(i) {
          return originalName(i.constructor) === originalName(t);
        }
      });
    });
    BuiltIns.forEach(function (t) {
      return defSub(T(_templateObject7 || (_templateObject7 = taggedTemplateLiteral(["", ""])), originalName(t)));
    });
  }

  function defineSpecials() {
    T.def("Any", null, {
      verify: function verify() {
        return true;
      }
    });
    T.def("Some", null, {
      verify: function verify(i) {
        return !isUnset(i);
      }
    });
    T.def("None", null, {
      verify: function verify(i) {
        return isUnset(i);
      }
    });
    T.def("Function", null, {
      verify: function verify(i) {
        return i instanceof Function;
      }
    });
    T.def("Integer", null, {
      verify: function verify(i) {
        return Number.isInteger(i);
      }
    });
    T.def("Array", null, {
      verify: function verify(i) {
        return Array.isArray(i);
      }
    });
    T.def("Iterable", null, {
      verify: function verify(i) {
        return i[Symbol.iterator] instanceof Function;
      }
    });
  }

  function isUnset(i) {
    return i === null || i === undefined;
  }

  function originalName(t) {
    if (!!t && t.name) {
      return t.name;
    }

    var oName = Object.prototype.toString.call(t).replace(/\[object |\]/g, '');

    if (oName.endsWith('Constructor')) {
      return oName.replace(/Constructor$/, '');
    }

    return oName;
  }

  var _templateObject$1, _templateObject2$1;

  var FULL_LABEL = 'c3s-unique-';
  var LABEL_LEN = 3;
  var LABEL = FULL_LABEL.slice(0, LABEL_LEN);
  var PREFIX_LEN = 10 + LABEL_LEN;
  var PREFIX_BASE = 36;
  T.defCollection("Prefix", {
    container: T(_templateObject$1 || (_templateObject$1 = taggedTemplateLiteral(["Array"]))),
    member: T(_templateObject2$1 || (_templateObject2$1 = taggedTemplateLiteral(["String"])))
  }, {
    verify: function verify(i) {
      return i.length > 0;
    }
  });
  var counter = 1;

  function generateUniquePrefix() {
    counter += 3;
    var number = counter * Math.random() * performance.now() * +new Date();
    var prefixString = (LABEL + number.toString(PREFIX_BASE).replace(/\./, '')).slice(0, PREFIX_LEN);
    return {
      prefix: [prefixString]
    };
  }

  function prefixAllRules(ss, prefix) {
    var combinator = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : ' ';
    var lastRuleIndex = ss.cssRules.length - 1;
    var i = lastRuleIndex;

    while (i >= 0) {
      lastRuleIndex = ss.cssRules.length - 1;
      var lastRule = ss.cssRules[lastRuleIndex];

      if (!lastRule) {
        console.warn("No such last rule", lastRuleIndex);
        continue;
      }

      if (lastRule.type == CSSRule.STYLE_RULE) {
        prefixStyleRule(lastRule, ss, lastRuleIndex, prefix, combinator);
      } else if (lastRule.type == CSSRule.MEDIA_RULE) {
        var rules = Array.from(lastRule.cssRules);
        var lastIndex = rules.length - 1;

        for (var _i4 = 0, _rules = rules; _i4 < _rules.length; _i4++) {
          var rule = _rules[_i4];
          prefixStyleRule(rule, lastRule, lastIndex, prefix, combinator);
        }

        ss.deleteRule(lastRuleIndex);

        try {
          var index = 0;

          if (ss.cssRules.length && ss.cssRules[0].type == CSSRule.NAMESPACE_RULE) {
            index = 1;
          }

          ss.insertRule(lastRule.cssText, index);
        } catch (e) {
          console.log(e, lastRule.cssText, lastRule, ss); //throw e;
        }
      } else {
        ss.deleteRule(lastRuleIndex);
        var _index = 0;

        if (ss.cssRules.length && ss.cssRules[0].type == CSSRule.NAMESPACE_RULE) {
          _index = 1;
        }

        ss.insertRule(lastRule.cssText, _index);
      }

      i--;
    }
  }

  function prefixStyleRule(lastRule, ss, lastRuleIndex, prefix, combinator) {
    var newRuleText = lastRule.cssText;
    var selectorText = lastRule.selectorText;
    var selectors = selectorText.split(/\s*,\s*/g);
    var modifiedSelectors = selectors.map(function (sel) {
      // we also need to insert prefix BEFORE any descendent combinators
      var firstDescendentIndex = sel.indexOf(' ');

      if (firstDescendentIndex > -1) {
        var firstSel = sel.slice(0, firstDescendentIndex);
        var restSel = sel.slice(firstDescendentIndex); // we also need to insert prefix BEFORE any pseudo selectors 
        // NOTE: the following indexOf test will BREAK if selector contains a :
        // such as [ns\\:name="scoped-name"]

        var firstPseudoIndex = firstSel.indexOf(':');

        if (firstPseudoIndex > -1) {
          var _ref37 = [firstSel.slice(0, firstPseudoIndex), firstSel.slice(firstPseudoIndex)],
              pre = _ref37[0],
              post = _ref37[1];
          return "".concat(pre).concat(prefix).concat(post).concat(restSel) + (combinator == '' ? '' : ", ".concat(prefix).concat(combinator).concat(sel));
        } else return "".concat(firstSel).concat(prefix).concat(restSel) + (combinator == '' ? '' : ", ".concat(prefix).concat(combinator).concat(sel));
      } else {
        var _firstPseudoIndex = sel.indexOf(':');

        if (_firstPseudoIndex > -1) {
          var _ref38 = [sel.slice(0, _firstPseudoIndex), sel.slice(_firstPseudoIndex)],
              _pre = _ref38[0],
              _post = _ref38[1];
          return "".concat(_pre).concat(prefix).concat(_post) + (combinator == '' ? '' : ", ".concat(prefix).concat(combinator).concat(sel));
        } else return "".concat(sel).concat(prefix) + (combinator == '' ? '' : ", ".concat(prefix).concat(combinator).concat(sel));
      }
    });
    var ruleBlock = newRuleText.slice(newRuleText.indexOf('{'));
    var newRuleSelectorText = modifiedSelectors.join(', ');
    newRuleText = "".concat(newRuleSelectorText, " ").concat(ruleBlock);
    ss.deleteRule(lastRuleIndex);

    try {
      var index = 0;

      if (ss.cssRules.length && ss.cssRules[0].type == CSSRule.NAMESPACE_RULE) {
        index = 1;
      }

      ss.insertRule(newRuleText, index);
    } catch (e) {
      console.log(e, newRuleText, selectorText, lastRuleIndex, ss); //throw e;
    }
  }

  var InsertListeners = [];
  var RemovedListeners = [];
  var inserted = new Set();
  var removed = new Set();
  var monitoring = false;

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

    var mo = new MutationObserver(function (mutations) {
      var AddedElements = [];
      var RemovedElements = [];

      var _iterator5 = _createForOfIteratorHelper(mutations),
          _step5;

      try {
        for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
          var mutation = _step5.value;
          var addedElements = Array.from(mutation.addedNodes);
          var removedElements = Array.from(mutation.removedNodes);
          addedElements.forEach(function (el) {
            var _AddedElements;

            if (!(el instanceof HTMLElement)) return;

            if (el.matches('[stylist]')) {
              AddedElements.push(el);
            }

            (_AddedElements = AddedElements).push.apply(_AddedElements, _toConsumableArray(el.querySelectorAll('[stylist]')));
          });
          removedElements.forEach(function (el) {
            var _RemovedElements;

            if (!(el instanceof HTMLElement)) return;

            if (el.matches('[stylist]')) {
              RemovedElements.push(el);
            }

            (_RemovedElements = RemovedElements).push.apply(_RemovedElements, _toConsumableArray(el.querySelectorAll('[stylist]')));
          });
        }
      } catch (err) {
        _iterator5.e(err);
      } finally {
        _iterator5.f();
      }

      var AddedSet = new Set(AddedElements);
      var FilterOut = new Set();
      RemovedElements.forEach(function (el) {
        return AddedSet.has(el) && FilterOut.add(el);
      });
      AddedElements = AddedElements.filter(function (el) {
        return !FilterOut.has(el);
      });
      RemovedElements = RemovedElements.filter(function (el) {
        return !FilterOut.has(el);
      });

      if (RemovedElements.length) {
        var _iterator6 = _createForOfIteratorHelper(RemovedListeners),
            _step6;

        try {
          for (_iterator6.s(); !(_step6 = _iterator6.n()).done;) {
            var listener = _step6.value;

            try {
              listener.apply(void 0, _toConsumableArray(RemovedElements));
            } catch (e) {
              console.warn("Removed listener error", e, listener);
            }
          }
        } catch (err) {
          _iterator6.e(err);
        } finally {
          _iterator6.f();
        }
      }

      if (AddedElements.length) {
        var _iterator7 = _createForOfIteratorHelper(InsertListeners),
            _step7;

        try {
          for (_iterator7.s(); !(_step7 = _iterator7.n()).done;) {
            var _listener = _step7.value;

            try {
              _listener.apply(void 0, _toConsumableArray(AddedElements));
            } catch (e) {
              console.warn("Insert listener error", e, _listener);
            }
          }
        } catch (err) {
          _iterator7.e(err);
        } finally {
          _iterator7.f();
        }
      }
    });
    mo.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
    monitoring = true;
  }

  var stylistFunctions = new Map();
  var mappings = new Map();
  var memory = {
    state: {}
  };
  var initialized = false;

  function setState(newState) {
    var clonedState = clone(newState);
    Object.assign(memory.state, clonedState);
  }

  function restyleElement(el) {
    if (!el) return;
    el.classList.forEach(function (className) {
      return className.startsWith('c3s') && restyleClass(className);
    });
  }

  function restyleClass(className) {
    var _mappings$get = mappings.get(className),
        element = _mappings$get.element,
        stylist = _mappings$get.stylist;

    associate(className, element, stylist, memory.state);
  }

  function restyleAll() {
    mappings.forEach(function (_ref, className) {
      var element = _ref.element,
          stylist = _ref.stylist;
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
      var initialEls = Array.from(document.querySelectorAll('[stylist]'));
      associateStylistFunctions.apply(void 0, _toConsumableArray(initialEls));
      initialized = true;
    }

    return;

    function associateStylistFunctions() {
      for (var _len = arguments.length, els = new Array(_len), _key = 0; _key < _len; _key++) {
        els[_key] = arguments[_key];
      }

      els = els.filter(function (el) {
        return el.hasAttribute('stylist');
      });
      if (els.length == 0) return;

      var _iterator8 = _createForOfIteratorHelper(els),
          _step8;

      try {
        for (_iterator8.s(); !(_step8 = _iterator8.n()).done;) {
          var el = _step8.value;
          var stylistNames = (el.getAttribute('stylist') || '').split(/\s+/g);

          var _iterator9 = _createForOfIteratorHelper(stylistNames),
              _step9;

          try {
            for (_iterator9.s(); !(_step9 = _iterator9.n()).done;) {
              var stylistName = _step9.value;
              var stylist = stylistFunctions.get(stylistName);
              if (!stylist) throw new TypeError("Stylist named by ".concat(stylistName, " is unknown."));
              var className = randomClass();
              el.classList.add(className);
              associate(className, el, stylist, state);
            }
          } catch (err) {
            _iterator9.e(err);
          } finally {
            _iterator9.f();
          }
        }
      } catch (err) {
        _iterator8.e(err);
      } finally {
        _iterator8.f();
      }
    }
  } // an object whose properties are functions that are stylist functions


  function addMoreStylistFunctions(functionsObject) {
    var toRegister = [];

    var _loop4 = function _loop4() {
      var funcName = _Object$keys3[_i5];
      var value = functionsObject[funcName];
      if (typeof value !== "function") throw new TypeError("Functions object must only contain functions."); // this prevents a bug where we miss an existing style element in 
      // a check for a style element based on the stylist.name property

      if (value.name !== funcName) throw new TypeError("Stylist function must be actual function named ".concat(funcName, " (it was ").concat(value.name, ")")); // don't overwrite exisiting names

      if (!stylistFunctions.has(funcName)) {
        toRegister.push(function () {
          return stylistFunctions.set(funcName, value);
        });
      }
    };

    for (var _i5 = 0, _Object$keys3 = Object.keys(functionsObject); _i5 < _Object$keys3.length; _i5++) {
      _loop4();
    }

    while (toRegister.length) {
      toRegister.pop()();
    }
  }

  function randomClass() {
    var _generateUniquePrefix = generateUniquePrefix(),
        _generateUniquePrefix2 = _slicedToArray(_generateUniquePrefix.prefix, 1),
        className = _generateUniquePrefix2[0];

    return className;
  }

  function associate(className, element, stylist, state) {
    var styleText = stylist(element, state) || '';
    var styleElement = document.head.querySelector("style[data-prefix=\"".concat(className, "\"]"));
    var changes = false;
    var prefixed = true;
    var prefixedStyleText;

    if (!mappings.has(className)) {
      mappings.set(className, {
        element: element,
        stylist: stylist
      });
    }

    if (!styleElement) {
      prefixed = false;
      var styleMarkup = "\n      <style data-stylist=\"".concat(stylist.name, "\" data-prefix=\"").concat(className, "\">\n        ").concat(styleText, "\n      </style>\n    ");
      document.head.insertAdjacentHTML('beforeend', styleMarkup);
      styleElement = document.head.querySelector("style[data-prefix=\"".concat(className, "\"]"));
    } else {
      if (styleElement instanceof HTMLStyleElement) {
        prefixedStyleText = Array.from(styleElement.sheet.cssRules).filter(function (rule) {
          return !rule.parentRule;
        }).map(function (rule) {
          return rule.cssText;
        }).join('\n');
      }
    } // I don't know why this has to happen, but it does


    if (styleElement.innerHTML != styleText) {
      styleElement.innerHTML = styleText;
      changes = true;
    } // only prefix if we have not already


    if (!prefixed || changes) {
      if (styleElement instanceof HTMLStyleElement) {
        var styleSheet = styleElement.sheet;
        prefixAllRules(styleSheet, "." + className, '');
        element.setAttribute('associated', 'true');
        prefixedStyleText = Array.from(styleSheet.cssRules).filter(function (rule) {
          return !rule.parentRule;
        }).map(function (rule) {
          return rule.cssText;
        }).join('\n');
        styleElement.innerHTML = prefixedStyleText;
      }
    }
  }

  function disassociate(className, element) {
    var styleSheet = document.querySelector("style[data-prefix=\"".concat(className, "\"]"));
    mappings["delete"](className);

    if (styleSheet) {
      element.classList.remove(className);
      styleSheet.remove();
    }
  }

  function unassociateStylistFunctions() {
    for (var _len2 = arguments.length, els = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      els[_key2] = arguments[_key2];
    }

    els = els.filter(function (el) {
      return el.hasAttribute('stylist');
    });
    if (els.length == 0) return;

    var _iterator10 = _createForOfIteratorHelper(els),
        _step10;

    try {
      var _loop5 = function _loop5() {
        var el = _step10.value;
        el.classList.forEach(function (className) {
          return className.startsWith('c3s') && disassociate(className, el);
        });
      };

      for (_iterator10.s(); !(_step10 = _iterator10.n()).done;) {
        _loop5();
      }
    } catch (err) {
      _iterator10.e(err);
    } finally {
      _iterator10.f();
    }
  }

  function clone(o) {
    return JSON.parse(JSON.stringify(o));
  }

  var stylists = {
    styleDocument: styleDocument,
    styleVoodooMain: styleVoodooMain,
    styleTabSelector: styleTabSelector,
    styleTabList: styleTabList,
    styleNavControl: styleNavControl,
    styleOmniBox: styleOmniBox,
    styleURLForm: styleURLForm,
    stylePluginsMenu: stylePluginsMenu,
    stylePluginsMenuButton: stylePluginsMenuButton,
    styleLoadingIndicator: styleLoadingIndicator,
    styleHistoryForm: styleHistoryForm,
    styleBandwidthIndicator: styleBandwidthIndicator,
    styleTabViewport: styleTabViewport,
    styleSelectInput: styleSelectInput,
    styleModals: styleModals,
    styleContextMenu: styleContextMenu
  };
  var dss = {
    restyleAll: restyleAll,
    restyleElement: restyleElement,
    initializeDSS: initializeDSS,
    setState: setState
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

  var subviews = Subviews; //const DEFAULT_URL = 'https://google.com';

  function component(state) {
    var H = state.H,
        asyncSizeBrowserToBounds = state.asyncSizeBrowserToBounds,
        emulateNavigator = state.emulateNavigator,
        bondTasks = state.bondTasks,
        canvasBondTasks = state.canvasBondTasks;
    var audio_port = Number(location.port ? location.port : location.protocol == 'https' ? 443 : 80) - 2;
    var audio_url = "".concat(location.protocol, "//").concat(location.hostname, ":").concat(audio_port, "/"); //const FocusBorrowerSel = '[name="address"], #selectinput, .control';

    var viewState = Object.assign(state.viewState, {
      touchX: 0,
      touchY: 0,
      textarea: null,
      keyinput: null,
      canvasEl: null,
      viewFrameEl: null,
      shouldHaveFocus: null,
      focusTextarea: focusTextarea,
      blurTextarea: blurTextarea,
      focusKeyinput: focusKeyinput,
      blurKeyinput: blurKeyinput
    });
    state.viewState = viewState;

    var toggleVirtualKeyboard = function toggleVirtualKeyboard(e) {
      e.preventDefault();
      var el = viewState.shouldHaveFocus;

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

    var retargetTab = function retargetTab(e) {
      return retargetTabToRemote(e, H);
    };

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

    var retargetTouchScroll = function retargetTouchScroll(e) {
      return retargetTouchScrollToRemote(e, H, viewState);
    };

    bondTasks.unshift(function (el) {
      return state.viewState.voodooEl = el;
    });
    bondTasks.push(function () {
      return dss.initializeDSS(state, stylists);
    });
    bondTasks.push(function () {
      document.addEventListener('keydown', function (event) {
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
      document.addEventListener('keyup', function (event) {
        if (!event.target.matches('body') || state.viewState.shouldHaveFocus) return;

        if (event.key == "Enter") {
          H(cloneKeyEvent(event, true));
        }
      });
    });
    subviews.startBandwidthLoop(state);

    state.viewState.draw = function () {
      return d(_templateObject || (_templateObject = taggedTemplateLiteral(["\n      <main class=\"voodoo\" bond=", " stylist=\"styleVoodooMain\">\n        ", "\n        ", "\n        ", "\n        <article class=tab-viewport stylist=\"styleTabViewport styleContextMenu\">\n          ", "\n          ", "\n          <select id=selectinput stylist=\"styleSelectInput\"\n            input=", "\n            >\n            <option value=\"\" disabled>Select an option</option>\n          </select>\n        </article>\n        ", "\n      </main>\n      <audio bond=", " autoplay loop id=audio>\n        <source src=\"", "\" type=audio/mp3>\n      </audio>\n      ", "\n    "])), bondTasks, subviews.BandwidthIndicator(state), subviews.TabList(state), subviews.Controls(state), subviews.LoadingIndicator(state), state.useViewFrame ? state.demoMode ? d(_templateObject2 || (_templateObject2 = taggedTemplateLiteral(["\n                  <iframe name=viewFrame \n                    scrolling=yes\n                    src=/plugins/demo/index.html\n                    load=", "\n                    bond=", "\n                  ></iframe>\n                "])), [function (loaded) {
        return loaded.target.hasLoaded = true;
      }, state.installFrameListener].concat(_toConsumableArray(canvasBondTasks)), [function (el) {
        return state.viewState.viewFrameEl = el;
      }, asyncSizeBrowserToBounds, emulateNavigator].concat(_toConsumableArray(canvasBondTasks))) : state.factoryMode ? d(_templateObject3 || (_templateObject3 = taggedTemplateLiteral(["\n                    <iframe name=viewFrame \n                      scrolling=yes\n                      load=", "\n                      bond=", "\n                    ></iframe>\n                  "])), [function (loaded) {
        return loaded.target.hasLoaded = true;
      }].concat(_toConsumableArray(canvasBondTasks)), [function (el) {
        return state.viewState.viewFrameEl = el;
      }, asyncSizeBrowserToBounds, emulateNavigator, state.installFrameListener].concat(_toConsumableArray(canvasBondTasks), [function (el) {
        return el.src = "/plugins/projector/".concat(isBundle() ? 'bundle' : 'index', ".html");
      }])) : d(_templateObject4 || (_templateObject4 = taggedTemplateLiteral(["\n                    <iframe name=viewFrame \n                      scrolling=yes\n                      load=", "\n                      bond=", "\n                    ></iframe>\n                  "])), [function (loaded) {
        return loaded.target.hasLoaded = true;
      }].concat(_toConsumableArray(canvasBondTasks)), [function (el) {
        return state.viewState.viewFrameEl = el;
      }, asyncSizeBrowserToBounds, emulateNavigator, state.installFrameListener].concat(_toConsumableArray(canvasBondTasks), [function (el) {
        return el.src = "/plugins/appminifier/".concat(isBundle() ? 'bundle' : 'index', ".html");
      }])) : d(_templateObject5 || (_templateObject5 = taggedTemplateLiteral(["\n              <canvas\n                click=", "\n                bond=", "\n                touchstart:passive=", "\n                touchmove=", "\n                wheel:passive=", "\n                mousemove:passive=", "         \n                mousedown=", "         \n                mouseup=", "         \n                pointermove:passive=", "         \n                pointerdown=", "         \n                pointerup=", "         \n                contextmenu=", "\n              ></canvas>\n            "])), [elogit, function () {
        if (viewState.shouldHaveFocus && document.activeElement != viewState.shouldHaveFocus) {
          viewState.shouldHaveFocus.focus();
        }
      }], [saveCanvas, asyncSizeBrowserToBounds, emulateNavigator].concat(_toConsumableArray(canvasBondTasks)), [elogit, retargetTouchScroll], [function (e) {
        return e.preventDefault();
      }, elogit, throttle(retargetTouchScroll, state.EVENT_THROTTLE_MS)], throttle(H, state.EVENT_THROTTLE_MS), [elogit, throttle(H, state.EVENT_THROTTLE_MS)], [elogit, H], [elogit, H], [elogit, throttle(H, state.EVENT_THROTTLE_MS)], [deviceIsMobile() ? function (e) {
        return startTimer(e, state.viewState);
      } : iden, elogit, H], [deviceIsMobile() ? function (e) {
        return endTimer(e, state.viewState);
      } : iden, elogit, H], [elogit, subviews.makeContextMenuHandler(state)]), function (e) {
        return H({
          synthetic: true,
          type: "select",
          state: state,
          event: e
        });
      }, subviews.Modals(state), function (el) {
        return self.addEventListener('click', function () {
          return el.play();
        }, {
          once: true
        });
      }, audio_url, '');
    };

    state.viewState.dss = dss;
    return state.viewState.draw();

    function isBundle() {
      return location.pathname == "/bundle.html";
    }

    function focusKeyinput() {
      var type = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'text';
      var value = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';
      var viewState = state.viewState;
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
      var viewState = state.viewState;
      if (document.activeElement == viewState.keyinput) viewState.keyinput.blur();
      viewState.shouldHaveFocus = null;
    }

    function focusTextarea() {
      var viewState = state.viewState;

      if (document.activeElement != viewState.textarea) {
        viewState.textarea.focus({
          preventScroll: true
        });
      }

      viewState.shouldHaveFocus = viewState.textarea;
    }

    function blurTextarea() {
      var viewState = state.viewState;
      if (document.activeElement == viewState.textarea) viewState.textarea.blur();
      viewState.shouldHaveFocus = null;
    }

    function saveCanvas(canvasEl) {
      state.viewState.canvasEl = canvasEl;
      state.viewState.ctx = canvasEl.getContext('2d');
    }
  } // helper functions


  function startTimer(e, viewState) {
    var _e$pointerId = e.pointerId,
        pointerId = _e$pointerId === void 0 ? 'default' : _e$pointerId;
    viewState[pointerId] = performance.now();
  }

  function endTimer(e, viewState) {
    var _e$pointerId2 = e.pointerId,
        pointerId = _e$pointerId2 === void 0 ? 'default' : _e$pointerId2;
    viewState[pointerId] = performance.now() - viewState[pointerId];

    if (viewState[pointerId] > subviews.CTX_MENU_THRESHOLD) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  function retargetTouchScrollToRemote(event, H, viewState) {
    var type = event.type;
    var target = event.target;
    var changes = event.changedTouches;
    if (changes.length > 1) return;
    var touch = changes[0];
    var clientX = touch.clientX,
        clientY = touch.clientY;

    var _getBitmapCoordinates2 = getBitmapCoordinates({
      target: target,
      clientX: clientX,
      clientY: clientY
    }),
        bitmapX = _getBitmapCoordinates2.bitmapX,
        bitmapY = _getBitmapCoordinates2.bitmapY;

    if (type == 'touchmove') {
      event.preventDefault();
      var deltaX = Math.ceil(viewState.touchX - bitmapX);
      var deltaY = Math.ceil(viewState.touchY - bitmapY);
      viewState.killNextMouseReleased = true;
      H({
        synthetic: true,
        type: "touchscroll",
        bitmapX: bitmapX,
        bitmapY: bitmapY,
        deltaX: deltaX,
        deltaY: deltaY,
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
    var ev = cloneKeyEvent(event, true);
    H(ev);
  }

  var FocusCache$1 = function FocusCache$1() {
    var focusSaver = {
      doc: null,
      oldValue: '',
      activeElement: null,
      selectionStart: 0,
      selectionEnd: 0,
      reset: function reset() {
        focusSaver.activeElement = null;
        focusSaver.selectionStart = 0;
        focusSaver.selectionEnd = 0;
        focusSaver.oldValue = '';
        focusSaver.doc = null;
      },
      save: function save(doc) {
        try {
          var el = doc.activeElement;
          focusSaver.doc = doc;
          focusSaver.activeElement = el;
          focusSaver.selectionStart = el.selectionStart;
          focusSaver.selectionEnd = el.selectionEnd;
          focusSaver.oldValue = el.value;
        } catch (e) {}
      },
      restore: function restore() {
        console.log('restore focus');

        try {
          var oldFocus = focusSaver.activeElement;

          if (!oldFocus) {
            DEBUG.val >= DEBUG.med && console.log("No old focus");
            return;
          }

          var updatedEl;

          var _ref39 = oldFocus.hasAttribute('zig') ? oldFocus.getAttribute('zig').split(' ') : "",
              _ref40 = _slicedToArray(_ref39, 1),
              oldId = _ref40[0];

          var dataIdSelector = "".concat(oldFocus.localName, "[zig^=\"").concat(oldId, "\"]");
          var byDataId = focusSaver.doc.querySelector(dataIdSelector);

          if (!byDataId) {
            var fallbackSelector = oldFocus.id ? "".concat(oldFocus.localName, "#").concat(oldFocus.id) : oldFocus.name ? "".concat(oldFocus.localName, "[name=\"").concat(oldFocus.name, "\"]") : '';
            var byFallbackSelector;

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
        } catch (e) {}
      }
    };
    return focusSaver;
  };

  function handleTreeUpdate$1(_ref2, state) {
    var _ref2$treeUpdate = _ref2.treeUpdate,
        open = _ref2$treeUpdate.open,
        targetId = _ref2$treeUpdate.targetId,
        dontFocus = _ref2$treeUpdate.dontFocus,
        runFuncs = _ref2$treeUpdate.runFuncs,
        executionContextId = _ref2.executionContextId;

    if (targetId !== state.activeTarget) {
      var _cache = state.domCache.get(targetId);

      if (!_cache) {
        _cache = {
          contextId: '',
          domTree: '',
          focusSaver: FocusCache$1()
        };
        state.domCache.set(targetId, _cache);
      } // when we have  iframes this will be dangerous
      // to flatten contextId (which will be multiple per page 1 for each iframe)


      _cache.contextId = executionContextId;
      _cache.domTree = open;
      return;
    }

    if (state.viewState.viewFrameEl) {
      updateTree$1({
        targetId: targetId,
        domTree: open,
        contextId: executionContextId,
        dontFocus: dontFocus,
        runFuncs: runFuncs
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
    var domTree = _ref3.domTree,
        targetId = _ref3.targetId,
        contextId = _ref3.contextId,
        _ref3$dontFocus = _ref3.dontFocus,
        dontFocus = _ref3$dontFocus === void 0 ? false : _ref3$dontFocus,
        _ref3$runFuncs = _ref3.runFuncs,
        runFuncs = _ref3$runFuncs === void 0 ? [] : _ref3$runFuncs;
    var frame = getViewFrame$1(state);
    var doc = getViewWindow$2(state).document;
    var cache = state.domCache.get(targetId);

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
        Array.from(doc.querySelectorAll('html > head')).forEach(function (node) {
          return node !== doc.head && node.remove();
        });
      } else {
        frame.addEventListener('load', function () {
          doc = getViewWindow$2(state).document;
          doc.body.outerHTML = domTree;
          Array.from(doc.querySelectorAll('html > head')).forEach(function (node) {
            return node !== doc.head && node.remove();
          });
        }, {
          once: true
        });
      }

      if (!dontFocus) {
        cache.focusSaver.restore();
      }

      if (runFuncs) {
        if (frame.hasLoaded) {
          var win = getViewWindow$2(state);

          var _iterator11 = _createForOfIteratorHelper(runFuncs),
              _step11;

          try {
            for (_iterator11.s(); !(_step11 = _iterator11.n()).done;) {
              var name = _step11.value;

              try {
                win[name]();
              } catch (e) {}
            }
          } catch (err) {
            _iterator11.e(err);
          } finally {
            _iterator11.f();
          }
        } else {
          frame.addEventListener('load', function () {
            var win = getViewWindow$2(state);

            var _iterator12 = _createForOfIteratorHelper(runFuncs),
                _step12;

            try {
              for (_iterator12.s(); !(_step12 = _iterator12.n()).done;) {
                var _name = _step12.value;

                try {
                  win[_name]();
                } catch (e) {}
              }
            } catch (err) {
              _iterator12.e(err);
            } finally {
              _iterator12.f();
            }
          });
        }
      }
    }
  }

  function scrollToTop$1(_ref4, state) {
    var navigated = _ref4.navigated;
    setTimeout(function () {
      if (navigated.targetId !== state.activeTarget) return;

      if (state.viewState.viewFrameEl) {
        getViewWindow$2(state).scrollTo(0, 0);
      }
    }, 40);
  }

  function scrollTo$2(_ref5, state) {
    var scrollY = _ref5.scrollY,
        scrollX = _ref5.scrollX;
    setTimeout(function () {
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

  var BUFFERED_FRAME_EVENT$2 = {
    type: "buffered-results-collection",
    command: {
      isBufferedResultsCollectionOnly: true,
      params: {}
    }
  };

  function createFrameListener$2(queue, state) {
    var H = state.H;
    return function installFrameListener() {
      self.addEventListener('message', function (e) {
        if (e.data && e.data.event) {
          var event = e.data.event;

          var _cache2 = state.domCache.get(state.activeTarget);

          if (_cache2) {
            event.contextId = _cache2.contextId;
          }

          if (event.type.endsWith('move')) {
            queue.send(BUFFERED_FRAME_EVENT$2);
          } else if (event.custom) {
            if (event.type == 'scrollToEnd') {
              var _cache3 = state.domCache.get(state.activeTarget);

              if (!_cache3) {
                _cache3 = {};
                state.domCache.set(state.activeTarget, _cache3);
              }

              _cache3.scrollTop = event.scrollTop;
              _cache3.scrollLeft = event.scrollLeft;
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
                  event: event
                });
              } else if (event.inputType == 'insertText') {
                H({
                  synthetic: true,
                  contextId: state.contextIdOfFocusedInput,
                  type: 'typing-clearAndInsertValue',
                  value: event.value,
                  event: event
                });
              }
            } else if (event.type == 'click' && event.href) {
              var activeTab = state.activeTab();
              var activeTabUrl = new URL(activeTab.url);
              var url = new URL(event.href);
              var frag = url.hash;
              activeTabUrl.hash = url.hash;
              url = url + '';
              activeTabUrl = activeTabUrl + '';

              if (url == activeTabUrl) {
                // in other words if they differ by only the hash
                var viewDoc = state.viewState.viewFrameEl.contentWindow.document;
                var fragElem = viewDoc.querySelector(frag);

                if (fragElem) {
                  fragElem.scrollIntoView();
                }
              }
            } else {
              if (event.type == 'keypress' && event.contenteditableTarget) ;else {
                H(event);
              }
            }
          }
        }
      });
      var win = state.viewState.viewFrameEl.contentWindow;
      win.addEventListener('load', function () {});
    };
  }

  function createDOMTreeGetter$2(queue, delay) {
    return function getDOMTree() {
      var force = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
      setTimeout(function () {
        queue.send({
          type: "getDOMTree",
          force: force,
          custom: true
        });
      }, delay);
    };
  }

  function saveFailingClick$1(_ref, state) {
    var click = _ref.click;

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
    var click = _ref2.click;
    if (click.hitsTarget) return;else {
      saveFailingClick$1({
        click: click
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

      queue.addMetaListener('treeUpdate', function (meta) {
        return handleTreeUpdate$1(meta, state);
      });
      queue.addMetaListener('navigated', function (meta) {
        return clearDomCache$2(meta, state);
      });
      queue.addMetaListener('navigated', function (meta) {
        return state.getDOMTree();
      });
      queue.addMetaListener('navigated', function (meta) {
        return scrollToTop$1(meta, state);
      });
      queue.addMetaListener('click', function (meta) {
        return auditClicks$1(meta, state);
      }); // start  

      queue.addMetaListener('topRedirect', function (meta) {
        var browserUrl = meta.topRedirect.browserUrl;
        location = browserUrl;
      });
      state.addListener('activateTab', function () {
        var activeTarget = state.activeTarget;
        var cache = state.domCache.get(activeTarget);

        if (!cache) {
          state.getDOMTree(true);
        } else {
          updateTree$1(cache, state);
          var scrollTop = cache.scrollTop,
              scrollLeft = cache.scrollLeft;
          scrollTo$2({
            scrollTop: scrollTop,
            scrollLeft: scrollLeft
          });
        }
      });
      state.getDOMTree();
    } catch (e) {
      console.info(e);
    }
  }

  function clearDomCache$2(_ref, state) {
    var navigated = _ref.navigated;
    var targetId = navigated.targetId;
    state.domCache["delete"](targetId);
  }

  var FocusCache = function FocusCache() {
    var focusSaver = {
      doc: null,
      oldValue: '',
      activeElement: null,
      selectionStart: 0,
      selectionEnd: 0,
      reset: function reset() {
        focusSaver.activeElement = null;
        focusSaver.selectionStart = 0;
        focusSaver.selectionEnd = 0;
        focusSaver.oldValue = '';
        focusSaver.doc = null;
      },
      save: function save(doc) {
        try {
          var el = doc.activeElement;
          focusSaver.doc = doc;
          focusSaver.activeElement = el;
          focusSaver.selectionStart = el.selectionStart;
          focusSaver.selectionEnd = el.selectionEnd;
          focusSaver.oldValue = el.value;
        } catch (e) {}
      },
      restore: function restore() {
        console.log('restore focus');

        try {
          var oldFocus = focusSaver.activeElement;

          if (!oldFocus) {
            DEBUG.val >= DEBUG.med && console.log("No old focus");
            return;
          }

          var updatedEl;

          var _ref41 = oldFocus.hasAttribute('zig') ? oldFocus.getAttribute('zig').split(' ') : "",
              _ref42 = _slicedToArray(_ref41, 1),
              oldId = _ref42[0];

          var dataIdSelector = "".concat(oldFocus.localName, "[zig^=\"").concat(oldId, "\"]");
          var byDataId = focusSaver.doc.querySelector(dataIdSelector);

          if (!byDataId) {
            var fallbackSelector = oldFocus.id ? "".concat(oldFocus.localName, "#").concat(oldFocus.id) : oldFocus.name ? "".concat(oldFocus.localName, "[name=\"").concat(oldFocus.name, "\"]") : '';
            var byFallbackSelector;

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
        } catch (e) {}
      }
    };
    return focusSaver;
  };

  function resetFocusCache(_ref, state) {
    var targetId = _ref.navigated.targetId,
        executionContextId = _ref.executionContextId;
    var cache = state.domCache.get(targetId);

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
    var _ref2$treeUpdate2 = _ref2.treeUpdate,
        open = _ref2$treeUpdate2.open,
        targetId = _ref2$treeUpdate2.targetId,
        dontFocus = _ref2$treeUpdate2.dontFocus,
        runFuncs = _ref2$treeUpdate2.runFuncs,
        executionContextId = _ref2.executionContextId;

    if (targetId !== state.activeTarget) {
      var _cache4 = state.domCache.get(targetId);

      if (!_cache4) {
        _cache4 = {
          contextId: '',
          domTree: '',
          focusSaver: FocusCache()
        };
        state.domCache.set(targetId, _cache4);
      } // when we have  iframes this will be dangerous
      // to flatten contextId (which will be multiple per page 1 for each iframe)


      _cache4.contextId = executionContextId;
      _cache4.domTree = open;
      return;
    }

    if (state.viewState.viewFrameEl) {
      updateTree({
        targetId: targetId,
        domTree: open,
        contextId: executionContextId,
        dontFocus: dontFocus,
        runFuncs: runFuncs
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
    var domTree = _ref3.domTree,
        targetId = _ref3.targetId,
        contextId = _ref3.contextId,
        _ref3$dontFocus2 = _ref3.dontFocus,
        dontFocus = _ref3$dontFocus2 === void 0 ? false : _ref3$dontFocus2,
        _ref3$runFuncs2 = _ref3.runFuncs,
        runFuncs = _ref3$runFuncs2 === void 0 ? [] : _ref3$runFuncs2;
    var frame = getViewFrame(state);
    var doc = getViewWindow$1(state).document;
    var cache = state.domCache.get(targetId);

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
        Array.from(doc.querySelectorAll('html > head')).forEach(function (node) {
          return node !== doc.head && node.remove();
        });
      } else {
        frame.addEventListener('load', function () {
          doc = getViewWindow$1(state).document;
          doc.body.outerHTML = domTree;
          Array.from(doc.querySelectorAll('html > head')).forEach(function (node) {
            return node !== doc.head && node.remove();
          });
        }, {
          once: true
        });
      }

      if (!dontFocus) {
        cache.focusSaver.restore();
      }

      if (runFuncs) {
        if (frame.hasLoaded) {
          var win = getViewWindow$1(state);

          var _iterator13 = _createForOfIteratorHelper(runFuncs),
              _step13;

          try {
            for (_iterator13.s(); !(_step13 = _iterator13.n()).done;) {
              var name = _step13.value;

              try {
                win[name]();
              } catch (e) {}
            }
          } catch (err) {
            _iterator13.e(err);
          } finally {
            _iterator13.f();
          }
        } else {
          frame.addEventListener('load', function () {
            var win = getViewWindow$1(state);

            var _iterator14 = _createForOfIteratorHelper(runFuncs),
                _step14;

            try {
              for (_iterator14.s(); !(_step14 = _iterator14.n()).done;) {
                var _name2 = _step14.value;

                try {
                  win[_name2]();
                } catch (e) {}
              }
            } catch (err) {
              _iterator14.e(err);
            } finally {
              _iterator14.f();
            }
          });
        }
      }
    }
  }

  function scrollToTop(_ref4, state) {
    var navigated = _ref4.navigated;
    setTimeout(function () {
      if (navigated.targetId !== state.activeTarget) return;

      if (state.viewState.viewFrameEl) {
        getViewWindow$1(state).scrollTo(0, 0);
      }
    }, 40);
  }

  function scrollTo$1(_ref5, state) {
    var scrollY = _ref5.scrollY,
        scrollX = _ref5.scrollX;
    setTimeout(function () {
      if (state.viewState.viewFrameEl) {
        getViewWindow$1(state).scrollTo(scrollX, scrollY);
      }
    }, 40);
  }

  function handleTreeDiff(_ref6, state) {
    var _ref6$treeDiff = _ref6.treeDiff,
        diffs = _ref6$treeDiff.diffs,
        targetId = _ref6$treeDiff.targetId,
        executionContextId = _ref6.executionContextId;

    if (targetId !== state.activeTarget) {
      var _cache5 = state.domCache.get(targetId);

      if (!_cache5) {
        _cache5 = {
          contextId: '',
          domTree: '',
          focusSaver: FocusCache()
        };
        state.domCache.set(targetId, _cache5);
      } // when we have  iframes this will be dangerous
      // to flatten contextId (which will be multiple per page 1 for each iframe)


      _cache5.contextId = executionContextId;
      _cache5.diffs = diffs;
      return;
    }

    if (state.viewState.viewFrameEl) {
      var later = [];

      var _iterator15 = _createForOfIteratorHelper(diffs),
          _step15;

      try {
        for (_iterator15.s(); !(_step15 = _iterator15.n()).done;) {
          var _diff = _step15.value;

          var _result2 = patchTree(_diff, state);

          if (!_result2) later.push(_diff);
        }
      } catch (err) {
        _iterator15.e(err);
      } finally {
        _iterator15.f();
      }

      for (var _i6 = 0, _later = later; _i6 < _later.length; _i6++) {
        var diff = _later[_i6];
        var result = patchTree(diff, state);

        if (!result) {
          console.warn("Diff could not be applied after two tries", diff);
        }
      }
    }
  }

  function patchTree(_ref7, state) {
    var insert = _ref7.insert,
        remove = _ref7.remove;
    var doc = getViewWindow$1(state).document;

    var _ref43 = insert || remove,
        parentZig = _ref43.parentZig;

    var parentZigSelector = "[zig=\"".concat(parentZig, "\"]");
    var parentElement = doc.querySelector(parentZigSelector);

    if (!parentElement) {
      //throw new TypeError(`No such parent element selected by ${parentZigSelector}`);
      //console.warn(`No such parent element selected by ${parentZigSelector}`);
      return false;
    }

    if (insert) {
      parentElement.insertAdjacentHTML('beforeEnd', insert.outerHTML); //console.log(parentElement, "Added", insert.outerHTML);
    }

    if (remove) {
      var zigSelectorToRemove = "[zig=\"".concat(remove.zig, "\"]");
      var elToRemove = parentElement.querySelector(zigSelectorToRemove);

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

  var BUFFERED_FRAME_EVENT$1 = {
    type: "buffered-results-collection",
    command: {
      isBufferedResultsCollectionOnly: true,
      params: {}
    }
  };

  function createFrameListener$1(queue, state) {
    var H = state.H;
    return function installFrameListener() {
      self.addEventListener('message', function (e) {
        if (e.data && e.data.event) {
          var event = e.data.event;

          var _cache6 = state.domCache.get(state.activeTarget);

          if (_cache6) {
            event.contextId = _cache6.contextId;
          }

          if (event.type.endsWith('move')) {
            queue.send(BUFFERED_FRAME_EVENT$1);
          } else if (event.custom) {
            if (event.type == 'scrollToEnd') {
              var _cache7 = state.domCache.get(state.activeTarget);

              if (!_cache7) {
                _cache7 = {};
                state.domCache.set(state.activeTarget, _cache7);
              }

              _cache7.scrollTop = event.scrollTop;
              _cache7.scrollLeft = event.scrollLeft;
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
                  event: event
                });
              } else if (event.inputType == 'insertText') {
                H({
                  synthetic: true,
                  contextId: state.contextIdOfFocusedInput,
                  type: 'typing-clearAndInsertValue',
                  value: event.value,
                  event: event
                });
              }
            } else if (event.type == 'click' && event.href) {
              var activeTab = state.activeTab();
              var activeTabUrl = new URL(activeTab.url);
              var url = new URL(event.href);
              var frag = url.hash;
              activeTabUrl.hash = url.hash;
              url = url + '';
              activeTabUrl = activeTabUrl + '';

              if (url == activeTabUrl) {
                // in other words if they differ by only the hash
                var viewDoc = state.viewState.viewFrameEl.contentWindow.document;
                var fragElem = viewDoc.querySelector(frag);

                if (fragElem) {
                  fragElem.scrollIntoView();
                }
              }
            } else {
              if (event.type == 'keypress' && event.contenteditableTarget) ;else {
                H(event);
              }
            }
          }
        }
      });
      var win = state.viewState.viewFrameEl.contentWindow;
      win.addEventListener('load', function () {});
    };
  }

  function createDOMTreeGetter$1(queue, delay) {
    return function getDOMTree() {
      var force = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
      setTimeout(function () {
        queue.send({
          type: "getDOMTree",
          force: force,
          custom: true
        });
      }, delay);
    };
  }

  function saveFailingClick(_ref, state) {
    var click = _ref.click;

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
    var click = _ref2.click;
    if (click.hitsTarget) return;else {
      saveFailingClick({
        click: click
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

      queue.addMetaListener('topRedirect', function (meta) {
        var browserUrl = meta.topRedirect.browserUrl;
        location = browserUrl;
      });
      queue.addMetaListener('treeUpdate', function (meta) {
        return handleTreeUpdate(meta, state);
      });
      queue.addMetaListener('treeDiff', function (meta) {
        return handleTreeDiff(meta, state);
      });
      queue.addMetaListener('navigated', function (meta) {
        return resetFocusCache(meta, state);
      });
      queue.addMetaListener('navigated', function (meta) {
        return handleNavigate$1(meta, state);
      });
      queue.addMetaListener('click', function (meta) {
        return auditClicks(meta, state);
      }); // appminifier plugin 

      queue.send({
        type: "enableAppminifier",
        custom: true
      });
      state.addListener('activateTab', function () {
        var win = getViewWindow$1(state);
        var activeTarget = state.activeTarget,
            clearViewport = state.clearViewport,
            lastTarget = state.lastTarget;
        var lastCache = state.domCache.get(lastTarget);
        var cache = state.domCache.get(activeTarget);

        if (!cache) {
          state.clearViewport();
          state.getDOMTree(true);
        } else {
          // save scroll position of last target before we update window
          // using block scope oorah
          if (lastCache) {
            var _scrollX = win.pageXOffset,
                _scrollY = win.pageYOffset;
            Object.assign(lastCache, {
              scrollX: _scrollX,
              scrollY: _scrollY
            });
          }

          state.clearViewport();
          updateTree(cache, state); // restore scroll position of new target

          var scrollX = cache.scrollX,
              scrollY = cache.scrollY;
          scrollTo$1({
            scrollX: scrollX,
            scrollY: scrollY
          }, state);
        }
      });
    } catch (e) {
      console.info(e);
    }
  }

  function clearDomCache$1(_ref, state) {
    var navigated = _ref.navigated;
    var targetId = navigated.targetId;
    state.domCache["delete"](targetId);
  }

  function handleNavigate$1(_ref2, state) {
    var navigated = _ref2.navigated;
    clearDomCache$1({
      navigated: navigated
    }, state);

    if (navigated.url.startsWith('http')) {
      state.scrollToTopOnNextTreeUpdate = navigated;
      state.getDOMTree();
    } else {
      state.clearViewport();
    }
  }

  function scrollTo(_ref2, state) {
    var scrollY = _ref2.scrollY,
        scrollX = _ref2.scrollX;
    setTimeout(function () {
      if (state.viewState.viewFrameEl) {
        getViewWindow(state).scrollTo(scrollX, scrollY);
      }
    }, 40);
  }

  function getViewWindow(state) {
    return state.viewState.viewFrameEl.contentWindow;
  }

  var BUFFERED_FRAME_EVENT = {
    type: "buffered-results-collection",
    command: {
      isBufferedResultsCollectionOnly: true,
      params: {}
    }
  };

  function createFrameListener(queue, state) {
    var H = state.H;
    return function installFrameListener() {
      self.addEventListener('message', function (e) {
        if (e.data && e.data.event) {
          var event = e.data.event;

          var _cache8 = state.domCache.get(state.activeTarget);

          if (_cache8) {
            event.contextId = _cache8.contextId;
          }

          if (event.type.endsWith('move')) {
            queue.send(BUFFERED_FRAME_EVENT);
          } else if (event.custom) {
            if (event.type == 'scrollToEnd') {
              var _cache9 = state.domCache.get(state.activeTarget);

              if (!_cache9) {
                _cache9 = {};
                state.domCache.set(state.activeTarget, _cache9);
              }

              _cache9.scrollTop = event.scrollTop;
              _cache9.scrollLeft = event.scrollLeft;
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
                  event: event
                });
              } else if (event.inputType == 'insertText') {
                H({
                  synthetic: true,
                  contextId: state.contextIdOfFocusedInput,
                  type: 'typing-clearAndInsertValue',
                  value: event.value,
                  event: event
                });
              }
            } else if (event.type == 'click' && event.href) {
              var activeTab = state.activeTab();
              var activeTabUrl = new URL(activeTab.url);
              var url = new URL(event.href);
              var frag = url.hash;
              activeTabUrl.hash = url.hash;
              url = url + '';
              activeTabUrl = activeTabUrl + '';

              if (url == activeTabUrl) {
                // in other words if they differ by only the hash
                var viewDoc = state.viewState.viewFrameEl.contentWindow.document;
                var fragElem = viewDoc.querySelector(frag);

                if (fragElem) {
                  fragElem.scrollIntoView();
                }
              }
            } else {
              if (event.type == 'keypress' && event.contenteditableTarget) ;else {
                H(event);
              }
            }
          }
        }
      });
      var win = state.viewState.viewFrameEl.contentWindow;
      win.addEventListener('load', function () {});
    };
  }

  function createDOMTreeGetter(queue, delay) {
    return function getDOMTree() {
      var force = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
      setTimeout(function () {
        queue.send({
          type: "getDOMSnapshot",
          force: force,
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

    queue.addMetaListener('navigated', function (meta) {
      return handleNavigate(meta, state);
    });
    queue.addMetaListener('domSnapshot', function (meta) {
      return console.log(meta, state);
    });
    queue.send({
      type: "enableProjector",
      custom: true
    });
    state.addListener('activateTab', function () {
      var win = getViewWindow(state);
      var activeTarget = state.activeTarget,
          lastTarget = state.lastTarget;
      var lastCache = state.domCache.get(lastTarget);
      var cache = state.domCache.get(activeTarget);

      if (!cache) {
        state.clearViewport();
        state.getDOMSnapshot(true);
      } else {
        // save scroll position of last target before we update window
        // using block scope oorah
        if (lastCache) {
          var _scrollX2 = win.pageXOffset,
              _scrollY2 = win.pageYOffset;
          Object.assign(lastCache, {
            scrollX: _scrollX2,
            scrollY: _scrollY2
          });
        }

        state.clearViewport(); //updateTree(cache, state); 
        // restore scroll position of new target

        var scrollX = cache.scrollX,
            scrollY = cache.scrollY;
        scrollTo({
          scrollX: scrollX,
          scrollY: scrollY
        }, state);
      }
    });
  }

  function clearDomCache(_ref, state) {
    var navigated = _ref.navigated;
    var targetId = navigated.targetId;
    state.domCache["delete"](targetId);
  }

  function handleNavigate(_ref2, state) {
    var navigated = _ref2.navigated;
    clearDomCache({
      navigated: navigated
    }, state);

    if (navigated.url.startsWith('http')) {
      state.scrollToTopOnNextTreeUpdate = navigated;
      state.getDOMSnapshot();
    } else {
      state.clearViewport();
    }
  }

  var ThrottledEvents = new Set(["mousemove", "pointermove", "touchmove"]);
  var CancelWhenSyncValue = new Set(["keydown", "keyup", "keypress", "compositionstart", "compositionend", "compositionupdate"]);

  var EnsureCancelWhenSyncValue = function EnsureCancelWhenSyncValue(e) {
    if (!e.type.startsWith("key")) {
      return true;
    } else {
      var id = getKeyId(e);
      return !controlChars.has(id);
    }
  };

  var SessionlessEvents = new Set(["window-bounds", "window-bounds-preImplementation", "user-agent", "hide-scrollbars"]);
  var IMMEDIATE = 0;
  var SHORT_DELAY = 20;
  var LONG_DELAY = 300;
  var VERY_LONG_DELAY = 60000;
  var EVENT_THROTTLE_MS = 40;
  /* 20, 40, 80 */
  // view frame debug

  var latestRequestId = 0;

  function voodoo(_x24, _x25) {
    return _voodoo.apply(this, arguments);
  }

  function _voodoo() {
    _voodoo = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee26(selector, position) {
      var _ref45,
          _ref45$postInstallTas,
          postInstallTasks,
          _ref45$preInstallTask,
          preInstallTasks,
          _ref45$canvasBondTask,
          canvasBondTasks,
          _ref45$bondTasks,
          bondTasks,
          _ref45$useViewFrame,
          useViewFrame,
          _ref45$demoMode,
          demoMode,
          sessionToken,
          closed,
          listeners,
          lastTarget,
          _yield,
          tabs,
          activeTarget,
          requestId,
          state,
          updateTabs,
          taskUrl,
          queue,
          plugins,
          preInstallView,
          _iterator18,
          _step18,
          task,
          api,
          pluginView,
          poppetView,
          postInstallView,
          _iterator19,
          _step19,
          _task,
          runListeners,
          findTab,
          activeTab,
          indicateNoOpenTabs,
          writeCanvas,
          writeDocument,
          clearViewport,
          sendKey,
          installTopLevelKeyListeners,
          installSafariLongTapListener,
          installZoomListener,
          H,
          sizeBrowserToBounds,
          sizeTab,
          asyncSizeBrowserToBounds,
          emulateNavigator,
          hideScrollbars,
          activateTab,
          _activateTab,
          closeTab,
          _closeTab,
          rawUpdateTabs,
          _rawUpdateTabs,
          createTab,
          _createTab,
          canKeysInput,
          getFavicon,
          loadPlugin,

      /*...events*/
      addToQueue,

      /*pluginRenderedView*/
      requestRender,

      /*name, listener*/
      subscribeToQueue,
          _args26 = arguments;

      return regeneratorRuntime.wrap(function _callee26$(_context26) {
        while (1) {
          switch (_context26.prev = _context26.next) {
            case 0:
              subscribeToQueue = function _subscribeToQueue() {
                console.warn("Unimplemented");
              };

              requestRender = function _requestRender() {
                console.warn("Unimplemented");
              };

              addToQueue = function _addToQueue() {
                console.warn("Unimplemented");
              };

              loadPlugin = function _loadPlugin(plugin) {
                plugins.set(plugin.name, plugin);
                plugin.load(pluginView);
              };

              getFavicon = function _getFavicon() {
                setTimeout(function () {
                  queue.send({
                    type: "getFavicon",
                    synthetic: true
                  });
                }, IMMEDIATE);
              };

              canKeysInput = function _canKeysInput() {
                if (state.viewState.viewFrameEl) return;
                setTimeout(function () {
                  queue.send({
                    type: "canKeysInput",
                    synthetic: true
                  });
                }, SHORT_DELAY);
              };

              _createTab = function _createTab3() {
                _createTab = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee25(click) {
                  var url,
                      _args25 = arguments;
                  return regeneratorRuntime.wrap(function _callee25$(_context25) {
                    while (1) {
                      switch (_context25.prev = _context25.next) {
                        case 0:
                          url = _args25.length > 1 && _args25[1] !== undefined ? _args25[1] : BLANK;
                          queue.send({
                            command: {
                              name: "Target.createTarget",
                              params: {
                                url: url,
                                enableBeginFrameControl: DEBUG.frameControl
                              }
                            }
                          });

                          if (click) {
                            click.target.blur();
                            click.currentTarget.blur();
                          }

                        case 3:
                        case "end":
                          return _context25.stop();
                      }
                    }
                  }, _callee25);
                }));
                return _createTab.apply(this, arguments);
              };

              createTab = function _createTab2(_x33) {
                return _createTab.apply(this, arguments);
              };

              _rawUpdateTabs = function _rawUpdateTabs3() {
                _rawUpdateTabs = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee24() {
                  var _yield2, tabs, activeTarget, requestId, _task2;

                  return regeneratorRuntime.wrap(function _callee24$(_context24) {
                    while (1) {
                      switch (_context24.prev = _context24.next) {
                        case 0:
                          _context24.next = 2;
                          return demoMode ? fetchDemoTabs() : fetchTabs({
                            sessionToken: sessionToken
                          });

                        case 2:
                          _yield2 = _context24.sent;
                          tabs = _yield2.tabs;
                          activeTarget = _yield2.activeTarget;
                          requestId = _yield2.requestId;
                          tabs = tabs.filter(function (_ref10) {
                            var targetId = _ref10.targetId;
                            return !closed.has(targetId);
                          });

                          if (!(requestId <= latestRequestId)) {
                            _context24.next = 11;
                            break;
                          }

                          return _context24.abrupt("return");

                        case 11:
                          latestRequestId = requestId;

                        case 12:
                          state.tabs = tabs;

                          if (demoMode) {
                            state.activeTarget = activeTarget;
                          }

                          state.active = activeTab(); // this ensures we activate the tab

                          if (state.tabs.length == 1) {
                            setTimeout(function () {
                              return activateTab(null, state.tabs[0]);
                            }, LONG_DELAY); //state.updateTabsTasks.push(() => setTimeout(() => activateTab(null, state.tabs[0]), LONG_DELAY));
                            //updateTabs();
                            //sizeBrowserToBounds(state.viewState.canvasEl, state.tabs[0].targetId);
                          } else if (!state.activeTarget || !state.active) {
                            if (state.tabs.length) {
                              setTimeout(function () {
                                return activateTab(null, state.tabs[0]);
                              }, LONG_DELAY); //state.updateTabsTasks.push(() => setTimeout(() => activateTab(null, state.tabs[0]), LONG_DELAY));
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
                            _task2 = state.updateTabsTasks.shift();

                            try {
                              _task2();
                            } catch (e) {
                              console.warn("State update tabs task failed", e, _task2);
                            }
                          }

                        case 20:
                        case "end":
                          return _context24.stop();
                      }
                    }
                  }, _callee24);
                }));
                return _rawUpdateTabs.apply(this, arguments);
              };

              rawUpdateTabs = function _rawUpdateTabs2() {
                return _rawUpdateTabs.apply(this, arguments);
              };

              _closeTab = function _closeTab3() {
                _closeTab = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee23(click, tab, index) {
                  var targetId, events, newActive;
                  return regeneratorRuntime.wrap(function _callee23$(_context23) {
                    while (1) {
                      switch (_context23.prev = _context23.next) {
                        case 0:
                          targetId = tab.targetId;
                          closed.add(targetId);
                          resetLoadingIndicator({
                            navigated: targetId
                          }, state);
                          setTimeout(function () {
                            return closed["delete"](targetId);
                          }, VERY_LONG_DELAY);
                          events = [{
                            command: {
                              name: "Target.closeTarget",
                              params: {
                                targetId: targetId
                              }
                            }
                          }];
                          _context23.next = 7;
                          return queue.send(events);

                        case 7:
                          state.tabs.splice(index, 1);

                          if (state.activeTarget == targetId) {
                            if (state.tabs.length == 0) {
                              state.activeTarget = null;
                            } else {
                              if (index >= state.tabs.length) {
                                index = state.tabs.length - 1;
                              }

                              newActive = state.tabs[index];
                              activateTab(click, newActive);
                            }
                          } else {
                            updateTabs();
                          }

                          subviews.TabList(state);
                          subviews.LoadingIndicator(state);

                        case 11:
                        case "end":
                          return _context23.stop();
                      }
                    }
                  }, _callee23);
                }));
                return _closeTab.apply(this, arguments);
              };

              closeTab = function _closeTab2(_x30, _x31, _x32) {
                return _closeTab.apply(this, arguments);
              };

              _activateTab = function _activateTab3() {
                _activateTab = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee22(click, tab) {
                  var targetId;
                  return regeneratorRuntime.wrap(function _callee22$(_context22) {
                    while (1) {
                      switch (_context22.prev = _context22.next) {
                        case 0:
                          if (!(click && click.currentTarget.querySelector('button.close') == click.target)) {
                            _context22.next = 2;
                            break;
                          }

                          return _context22.abrupt("return");

                        case 2:
                          click && click.preventDefault(); // sometimes we delay the call to activate tab and
                          // in the meantime the list of tabs can empty
                          // so we exit if there is no tab to activate

                          if (tab) {
                            _context22.next = 5;
                            break;
                          }

                          return _context22.abrupt("return");

                        case 5:
                          if (click) {
                            setTimeout(function () {
                              return click.target.closest('li').scrollIntoView({
                                inline: 'center',
                                behavior: 'smooth'
                              });
                            }, LONG_DELAY);
                          }

                          if (!(state.activeTarget == tab.targetId)) {
                            _context22.next = 9;
                            break;
                          }

                          if (state.viewState.omniBoxInput == state.viewState.lastActive) {
                            state.viewState.omniBoxInput.focus();
                          }

                          return _context22.abrupt("return");

                        case 9:
                          targetId = tab.targetId;
                          queue.send({
                            command: {
                              name: "Target.activateTarget",
                              params: {
                                targetId: targetId
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
                          setTimeout(function () {
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
                                    Secure ViewFinder 
                                  </h2>
                                  <strong>
                                    Current time: ${(new Date).toString()}
                                  </strong>
                                </html>
                              `);
                              **/
                              writeCanvas("Secure ViewFinder");
                              state.viewState.omniBoxInput.focus();
                            }
                          }, SHORT_DELAY);

                        case 22:
                        case "end":
                          return _context22.stop();
                      }
                    }
                  }, _callee22);
                }));
                return _activateTab.apply(this, arguments);
              };

              activateTab = function _activateTab2(_x28, _x29) {
                return _activateTab.apply(this, arguments);
              };

              hideScrollbars = function _hideScrollbars() {
                H({
                  synthetic: true,
                  type: "hide-scrollbars"
                });
              };

              emulateNavigator = function _emulateNavigator() {
                var _navigator = navigator,
                    platform = _navigator.platform,
                    userAgent = _navigator.userAgent,
                    acceptLanguage = _navigator.language;
                H({
                  synthetic: true,
                  type: "user-agent",
                  userAgent: userAgent,
                  platform: platform,
                  acceptLanguage: acceptLanguage
                });
              };

              asyncSizeBrowserToBounds = function _asyncSizeBrowserToBo(el) {
                setTimeout(function () {
                  return sizeBrowserToBounds(el), indicateNoOpenTabs();
                }, 0);
              };

              sizeTab = function _sizeTab() {
                return sizeBrowserToBounds(state.viewState.canvasEl);
              };

              sizeBrowserToBounds = function _sizeBrowserToBounds(el, targetId) {
                var _el$getBoundingClient = el.getBoundingClientRect(),
                    width = _el$getBoundingClient.width,
                    height = _el$getBoundingClient.height;

                width = Math.round(width);
                height = Math.round(height);

                if (el.width != width || el.height != height) {
                  el.width = width;
                  el.height = height;
                }

                var mobile = deviceIsMobile();
                H({
                  synthetic: true,
                  type: "window-bounds",
                  width: width,
                  height: height,
                  targetId: targetId || state.activeTarget
                });
                H({
                  synthetic: true,
                  type: "window-bounds-preImplementation",
                  width: width,
                  height: height,
                  mobile: mobile,
                  targetId: targetId || state.activeTarget
                });
                self.ViewportWidth = width;
                self.ViewportHeight = height;
              };

              H = function _H(event) {
                // block if no tabs
                if (state.tabs.length == 0) {
                  if (SessionlessEvents.has(event.type)) ;else return;
                }

                if (event.defaultPrevented) return;
                var mouseEventOnPointerDevice = event.type.startsWith("mouse") && event.type !== "wheel" && !state.DoesNotSupportPointerEvents;
                var tabKeyPressForBrowserUI = event.key == "Tab" && !event.vRetargeted;
                var unnecessaryIfSyncValue = state.convertTypingEventsToSyncValueEvents && CancelWhenSyncValue.has(event.type) && EnsureCancelWhenSyncValue(event);
                var eventCanBeIgnored = mouseEventOnPointerDevice || tabKeyPressForBrowserUI || unnecessaryIfSyncValue;
                if (eventCanBeIgnored) return;
                var pointerEvent = event.type.startsWith("pointer");
                var mouseWheel = event.type == "wheel";
                var syntheticNonTypingEventWrapper = event.synthetic && event.type != "typing" && event.event;
                if (mouseWheel) ;else if (pointerEvent) {
                  state.DoesNotSupportPointerEvents = false;
                } else if (syntheticNonTypingEventWrapper) {
                  event.event.preventDefault && event.event.preventDefault();
                }
                var simulated = event.event && event.event.simulated;
                var hasTarget = event.event && event.event.target;

                if (event.type == "typing" && hasTarget && !simulated && state.convertTypingEventsToSyncValueEvents) {
                  event.type = 'typing-syncValue';
                  event.value = event.event.target.value;
                  event.contextId = state.contextIdOfFocusedInput;
                  event.data = "";
                }

                var isThrottled = ThrottledEvents.has(event.type);
                var transformedEvent = transformEvent(event);

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
                      var latestData = state.latestData;

                      if (!!state.viewState.shouldHaveFocus && !!latestData && latestData.length > 1 && latestData != state.latestCommitData) {
                        state.isComposing = false;
                        var data = latestData;
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
              };

              installZoomListener = function _installZoomListener(el) {
                var FLAGS = {
                  passive: true
                };
                var lastScale = 1.0;
                var scaling = false;
                var startDist = 0;
                var lastDist = 0;
                var touch;
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
                    var delta = event.deltaZ || event.deltaY;
                    var direction = Math.sign(delta);
                    var multiplier;

                    if (direction > 0) {
                      multiplier = 1 / 1.25;
                    } else {
                      multiplier = 1.25;
                    }

                    var scale = lastScale * multiplier;
                    lastScale = scale;
                    H({
                      synthetic: true,
                      type: 'zoom',
                      scale: scale,
                      event: event
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
                    var dist = Math.hypot(event.touches[0].pageX - event.touches[1].pageX, event.touches[0].pageY - event.touches[1].pageY);
                    lastDist = dist;
                  }
                }

                function end() {
                  if (scaling) {
                    if (lastDist < 8) ;else {
                      var scale = lastScale * Math.abs(lastDist / startDist);
                      lastScale = scale;
                      H({
                        synthetic: true,
                        type: 'zoom',
                        scale: scale,
                        event: touch
                      });
                    }
                    scaling = false;
                    startDist = 0;
                    lastDist = 0;
                    touch = false;
                  }
                }
              };

              installSafariLongTapListener = function _installSafariLongTap(el) {
                var FLAGS = {
                  passive: true,
                  capture: true
                };
                var MIN_DURATION = 200;
                var MAX_MOVEMENT = 20;
                var lastStart;
                el.addEventListener('touchstart', function (ts) {
                  return lastStart = ts;
                }, FLAGS);
                el.addEventListener('touchend', triggerContextMenuIfLongEnough, FLAGS);
                el.addEventListener('touchcancel', triggerContextMenuIfLongEnough, FLAGS);

                function triggerContextMenuIfLongEnough(tf) {
                  // space 
                  var touch1 = lastStart.changedTouches[0];
                  var touch2 = tf.changedTouches[0];
                  var movement = Math.hypot(touch2.pageX - touch1.pageX, touch2.pageY - touch1.pageY); // time

                  var duration = tf.timeStamp - lastStart.timeStamp;

                  if (duration > MIN_DURATION && movement < MAX_MOVEMENT) {
                    lastStart.preventDefault();
                    tf.preventDefault();
                    var pageX = touch1.pageX,
                        pageY = touch1.pageY,
                        clientX = touch1.clientX,
                        clientY = touch1.clientY;
                    el.dispatchEvent(new CustomEvent('contextmenu', {
                      detail: {
                        pageX: pageX,
                        pageY: pageY,
                        clientX: clientX,
                        clientY: clientY
                      }
                    }));
                  }
                }
              };

              installTopLevelKeyListeners = function _installTopLevelKeyLi() {
                if (!deviceIsMobile()) {
                  self.addEventListener('keydown', sendKey);
                  self.addEventListener('keypress', sendKey);
                  self.addEventListener('keyup', sendKey);
                }
              };

              sendKey = function _sendKey(keyEvent) {
                var viewState = state.viewState;

                if (!(viewState.shouldHaveFocus || document.activeElement == viewState.omniBoxInput)) {
                  var ev = keyEvent;
                  if (ev.key == "Tab" || ev.key == "Enter") ;else {
                    H(ev);
                  }
                }
              };

              clearViewport = function _clearViewport() {
                if (state.useViewFrame) {
                  try {
                    state.viewState.viewFrameEl.contentDocument.body.innerHTML = "";
                  } catch (e) {
                    console.warn(e);
                  }
                } else {
                  var canv = state.viewState.canvasEl;
                  var ctx = state.viewState.ctx;
                  ctx.fillStyle = 'white';
                  ctx.fillRect(0, 0, canv.width, canv.height);
                }
              };

              writeDocument = function _writeDocument(html, frameId, sessionId) {
                queue.send({
                  type: 'setDocument',
                  html: html,
                  frameId: frameId,
                  sessionId: sessionId,
                  synthetic: true
                });
              };

              writeCanvas = function _writeCanvas(text) {
                var canv = state.viewState.canvasEl;
                var ctx = state.viewState.ctx;
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canv.width, canv.height);
                ctx.fillStyle = 'silver';
                ctx.font = 'italic 3vmax sans-serif';
                ctx.textAlign = "center";
                ctx.fillText(text, innerWidth / 2, innerHeight / 2 - 6 * Math.max(innerWidth / 100, innerHeight / 100));
              };

              indicateNoOpenTabs = function _indicateNoOpenTabs() {
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
              };

              activeTab = function _activeTab() {
                return state.tabs.length == 1 ? state.tabs[0] : findTab(state.activeTarget) || {};
              };

              findTab = function _findTab(id) {
                return state.tabs.find(function (_ref9) {
                  var targetId = _ref9.targetId;
                  return id == targetId;
                });
              };

              runListeners = function _runListeners(name, data) {
                var funcList = listeners.get(name);
                if (!funcList || funcList.length == 0) return false;
                var score = false;

                var _iterator20 = _createForOfIteratorHelper(funcList),
                    _step20;

                try {
                  for (_iterator20.s(); !(_step20 = _iterator20.n()).done;) {
                    var func = _step20.value;

                    try {
                      func(data);
                      score = score || true;
                    } catch (e) {
                      console.log("Listeners func for ".concat(name, " fails: ").concat(func, "\nError: ").concat(e + e.stack));
                    }
                  }
                } catch (err) {
                  _iterator20.e(err);
                } finally {
                  _iterator20.f();
                }

                return score;
              };

              _ref45 = _args26.length > 2 && _args26[2] !== undefined ? _args26[2] : {}, _ref45$postInstallTas = _ref45.postInstallTasks, postInstallTasks = _ref45$postInstallTas === void 0 ? [] : _ref45$postInstallTas, _ref45$preInstallTask = _ref45.preInstallTasks, preInstallTasks = _ref45$preInstallTask === void 0 ? [] : _ref45$preInstallTask, _ref45$canvasBondTask = _ref45.canvasBondTasks, canvasBondTasks = _ref45$canvasBondTask === void 0 ? [] : _ref45$canvasBondTask, _ref45$bondTasks = _ref45.bondTasks, bondTasks = _ref45$bondTasks === void 0 ? [] : _ref45$bondTasks, _ref45$useViewFrame = _ref45.useViewFrame, useViewFrame = _ref45$useViewFrame === void 0 ? false : _ref45$useViewFrame, _ref45$demoMode = _ref45.demoMode, demoMode = _ref45$demoMode === void 0 ? false : _ref45$demoMode;
              sessionToken = location.hash && location.hash.slice(1);
              location.hash = '';
              closed = new Set();
              listeners = new Map();
              lastTarget = '[lastTarget]';
              _context26.next = 39;
              return demoMode ? fetchDemoTabs() : fetchTabs({
                sessionToken: sessionToken
              });

            case 39:
              _yield = _context26.sent;
              tabs = _yield.tabs;
              activeTarget = _yield.activeTarget;
              requestId = _yield.requestId;
              latestRequestId = requestId;
              state = {
                H: H,
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
                demoMode: demoMode,
                // if we are using a view frame (instead of canvas)
                useViewFrame: useViewFrame,
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
                sizeBrowserToBounds: sizeBrowserToBounds,
                asyncSizeBrowserToBounds: asyncSizeBrowserToBounds,
                emulateNavigator: emulateNavigator,
                hideScrollbars: hideScrollbars,
                bondTasks: bondTasks,
                canvasBondTasks: canvasBondTasks,
                // tabs
                updateTabsTasks: [],
                lastTarget: lastTarget,
                activeTarget: activeTarget,
                tabs: tabs,
                attached: new Set(),
                activateTab: activateTab,
                closeTab: closeTab,
                createTab: createTab,
                activeTab: activeTab,
                favicons: new Map(),
                // timing constants
                IMMEDIATE: IMMEDIATE,
                SHORT_DELAY: SHORT_DELAY,
                LONG_DELAY: LONG_DELAY,
                VERY_LONG_DELAY: VERY_LONG_DELAY,
                EVENT_THROTTLE_MS: EVENT_THROTTLE_MS,
                viewState: {},
                clearViewport: clearViewport,
                addListener: function addListener(name, func) {
                  var funcList = listeners.get(name);

                  if (!funcList) {
                    funcList = [];
                    listeners.set(name, funcList);
                  }

                  funcList.push(func);
                }
              };
              updateTabs = debounce(rawUpdateTabs, LONG_DELAY);

              if (state.demoMode) {
                state.demoEventConsumer = demoZombie;
              }

              if (location.search.includes("url=")) {
                try {
                  taskUrl = decodeURIComponent(location.search.split('&').filter(function (x) {
                    return x.includes('url=');
                  })[0].split('=')[1]);
                } catch (e) {
                  alert(e);
                  console.warn(e);
                  taskUrl = location.search.split('&').filter(function (x) {
                    return x.includes('url=');
                  })[0].split('=')[1];
                }

                postInstallTasks.push( /*#__PURE__*/function () {
                  var _ref46 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee21(_ref) {
                    var queue, completed;
                    return regeneratorRuntime.wrap(function _callee21$(_context21) {
                      while (1) {
                        switch (_context21.prev = _context21.next) {
                          case 0:
                            queue = _ref.queue;
                            completed = false;
                            queue.addMetaListener('changed', /*#__PURE__*/function () {
                              var _ref47 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee20(meta) {
                                return regeneratorRuntime.wrap(function _callee20$(_context20) {
                                  while (1) {
                                    switch (_context20.prev = _context20.next) {
                                      case 0:
                                        if (!completed) {
                                          _context20.next = 2;
                                          break;
                                        }

                                        return _context20.abrupt("return");

                                      case 2:
                                        if (!(meta.changed.type == 'page' && meta.changed.url.startsWith("https://isolation.site/redirect"))) {
                                          _context20.next = 14;
                                          break;
                                        }

                                        _context20.next = 5;
                                        return sleep(500);

                                      case 5:
                                        _context20.next = 7;
                                        return activateTab(null, meta.changed);

                                      case 7:
                                        _context20.next = 9;
                                        return sleep(2000);

                                      case 9:
                                        H({
                                          synthetic: true,
                                          type: "url-address",
                                          event: null,
                                          url: taskUrl
                                        });
                                        completed = true;
                                        _context20.next = 13;
                                        return sleep(5000);

                                      case 13:
                                        history.pushState("", "", "/");

                                      case 14:
                                      case "end":
                                        return _context20.stop();
                                    }
                                  }
                                }, _callee20);
                              }));

                              return function (_x27) {
                                return _ref47.apply(this, arguments);
                              };
                            }());
                            state.createTab(null, "https://isolation.site/redirect.html");

                          case 4:
                          case "end":
                            return _context21.stop();
                        }
                      }
                    }, _callee21);
                  }));

                  return function (_x26) {
                    return _ref46.apply(this, arguments);
                  };
                }());
              }

              queue = new EventQueue(state, sessionToken); // plugins 

              plugins = new Map();

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


              queue.addMetaListener('selectInput', function (meta) {
                return handleSelectMessage(meta, state);
              });
              queue.addMetaListener('keyInput', function (meta) {
                return handleKeysCanInputMessage(meta, state);
              });
              queue.addMetaListener('favicon', function (meta) {
                return handleFaviconMessage(meta, state);
              });
              queue.addMetaListener('navigated', function () {
                return canKeysInput();
              });
              queue.addMetaListener('navigated', function (_ref2) {
                var targetId = _ref2.navigated.targetId;
                return resetFavicon({
                  targetId: targetId
                }, state);
              }); //queue.addMetaListener('navigated', meta => takeShot(meta, state));
              // element info

              queue.addMetaListener('elementInfo', function (meta) {
                return handleElementInfo(meta, state);
              }); // scroll

              queue.addMetaListener('scroll', function (meta) {
                return handleScrollNotification(meta, state);
              }); // loading

              queue.addMetaListener('resource', function (meta) {
                return showLoadingIndicator(meta, state);
              });
              queue.addMetaListener('failed', function (meta) {
                if (meta.failed.params.type == "Document") {
                  // we also need to make sure the failure happens at the top level document
                  // rather than writing the top level document for any failure in a sub frame
                  if (meta.failed.params.errorText && meta.failed.params.errorText.includes("ABORTED")) ;else {
                    writeDocument("Request failed: ".concat(meta.failed.params.errorText), meta.failed.frameId, meta.failed.sessionId);
                  }
                }
              });
              queue.addMetaListener('navigated', function (meta) {
                return resetLoadingIndicator(meta, state);
              });
              queue.addMetaListener('changed', function (_ref3) {
                var changed = _ref3.changed;
                var tab = findTab(changed.targetId);

                if (tab) {
                  Object.assign(tab, changed);
                  subviews.TabList(state);
                }

                updateTabs({
                  changed: changed
                });
              }); // tabs

              queue.addMetaListener('created', function (meta) {
                if (meta.created.type == 'page') {
                  setTimeout(function () {
                    return activateTab(null, meta.created);
                  }, LONG_DELAY); //state.updateTabsTasks.push(() => setTimeout(() => activateTab(null, meta.created), LONG_DELAY));
                  //updateTabs();
                  //sizeBrowserToBounds(state.viewState.canvasEl, meta.created.targetId);
                }
              });
              queue.addMetaListener('attached', function (meta) {
                var attached = meta.attached.targetInfo;

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
              queue.addMetaListener('destroyed', function (_ref4) {
                var destroyed = _ref4.destroyed;
                closed["delete"](destroyed.targetId);
                updateTabs();
              });
              queue.addMetaListener('crashed', updateTabs); //modals

              queue.addMetaListener('modal', function (modalMessage) {
                return subviews.openModal(modalMessage, state);
              }); // remote secure downloads

              queue.addMetaListener('download', function (_ref5) {
                var download = _ref5.download;
                var sessionId = download.sessionId,
                    filename = download.filename;
                var modal = {
                  sessionId: sessionId,
                  type: 'notice',
                  message: "The file \"".concat(filename, "\" is downloading to a secure location and will be displayed securely momentarily if it is a supported format."),
                  otherButton: {
                    title: 'Get License',
                    onclick: function onclick() {
                      return window.open('mailto:cris@dosycorp.com?Subject=ViewFinder+License+Support+Inquiry&body=Hi%20Cris', "_blank");
                    }
                  },
                  title: "SecureView\u2122 Enabled"
                };
                subviews.openModal({
                  modal: modal
                }, state);
              });
              queue.addMetaListener('secureview', function (_ref6) {
                var secureview = _ref6.secureview;
                var url = secureview.url;

                if (url) {
                  createTab(null, url);
                }
              }); // HTTP auth

              queue.addMetaListener('authRequired', function (_ref7) {
                var authRequired = _ref7.authRequired;
                var requestId = authRequired.requestId;
                var modal = {
                  requestId: requestId,
                  type: 'auth',
                  message: "Provide credentials to continue",
                  title: "HTTP Auth"
                };
                subviews.openModal({
                  modal: modal
                }, state);
              }); // File chooser 

              queue.addMetaListener('fileChooser', function (_ref8) {
                var fileChooser = _ref8.fileChooser;
                var sessionId = fileChooser.sessionId,
                    mode = fileChooser.mode,
                    accept = fileChooser.accept,
                    csrfToken = fileChooser.csrfToken;
                var modal = {
                  sessionId: sessionId,
                  mode: mode,
                  accept: accept,
                  csrfToken: csrfToken,
                  type: 'filechooser',
                  message: "Securely send files to the remote page.",
                  title: "File Chooser"
                };
                console.log({
                  fileChooserModal: modal
                });
                subviews.openModal({
                  modal: modal
                }, state);
              }); // make this so we can call it on resize

              window._voodoo_asyncSizeTab = function () {
                return setTimeout(sizeTab, 0);
              }; // bond tasks 


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
              preInstallView = {
                queue: queue
              };
              _iterator18 = _createForOfIteratorHelper(preInstallTasks);

              try {
                for (_iterator18.s(); !(_step18 = _iterator18.n()).done;) {
                  task = _step18.value;

                  try {
                    task(preInstallView);
                  } catch (e) {
                    console.error("Task ".concat(task, " failed with ").concat(e));
                  }
                }
              } catch (err) {
                _iterator18.e(err);
              } finally {
                _iterator18.f();
              }

              component(state).to(selector, position);
              api = {
                back: function back() {
                  return 1;
                },
                forward: function forward() {
                  return 1;
                },
                reload: function reload() {
                  return 1;
                },
                stop: function stop() {
                  return 1;
                },
                mouse: function mouse() {
                  return 1;
                },
                touch: function touch() {
                  return 1;
                },
                scroll: function scroll() {
                  return 1;
                },
                key: function key() {
                  return 1;
                },
                type: function type() {
                  return 1;
                },
                omni: function omni() {
                  return 1;
                },
                newTab: function newTab() {
                  return 1;
                },
                closeTab: function closeTab() {
                  return 1;
                },
                switchTab: function switchTab() {
                  return 1;
                }
              };
              pluginView = {
                addToQueue: addToQueue,
                subscribeToQueue: subscribeToQueue,
                requestRender: requestRender,
                api: api
              };
              poppetView = {
                loadPlugin: loadPlugin,
                api: api
              };
              postInstallView = {
                queue: queue
              };
              _context26.next = 94;
              return sleep(0);

            case 94:
              _iterator19 = _createForOfIteratorHelper(postInstallTasks);

              try {
                for (_iterator19.s(); !(_step19 = _iterator19.n()).done;) {
                  _task = _step19.value;

                  try {
                    _task(postInstallView);
                  } catch (e) {
                    console.error("Task ".concat(_task, " failed with ").concat(e));
                  }
                }
              } catch (err) {
                _iterator19.e(err);
              } finally {
                _iterator19.f();
              }

              if (activeTarget) {
                setTimeout(function () {
                  return activateTab(null, {
                    targetId: activeTarget
                  });
                }, LONG_DELAY); //state.updateTabsTasks.push(() => setTimeout(() => activateTab(null, {targetId:activeTarget}), LONG_DELAY));
                //updateTabs();
                //sizeBrowserToBounds(state.viewState.canvasEl, activeTarget);
              }

              return _context26.abrupt("return", poppetView);

            case 98:
            case "end":
              return _context26.stop();
          }
        }
      }, _callee26);
    }));
    return _voodoo.apply(this, arguments);
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
      vRetargeted: vRetargeted
    };
  }

  function Voodoo() {
    var _ref44 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        api = _ref44.api,
        translator = _ref44.translator,
        image = _ref44.image,
        _ref44$useViewFrame = _ref44.useViewFrame,
        useViewFrame = _ref44$useViewFrame === void 0 ? false : _ref44$useViewFrame,
        _ref44$demoMode = _ref44.demoMode,
        demoMode = _ref44$demoMode === void 0 ? false : _ref44$demoMode;

    var selector = arguments.length > 1 ? arguments[1] : undefined;
    var position = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'beforeEnd';
    var root;

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
      translator = function translator(e) {
        return e;
      };
    }

    return voodoo(root, position, {
      useViewFrame: useViewFrame,
      demoMode: demoMode,
      preInstallTasks: [function (poppet) {
        return poppet.queue.addSubscriber(api, translator, image);
      }],
      postInstallTasks: []
    });
  }

  var sessionToken = location.hash && location.hash.slice(1);

  function getAPI() {
    var api = new URL(location);
    api.hash = '';
    api.search = "session_token=".concat(sessionToken);
    api.protocol = api.protocol == 'https:' ? 'wss:' : 'ws:';
    var url = api.href + '';
    var hashIndex = url.indexOf('#');

    if (hashIndex >= 0) {
      url = url.slice(0, hashIndex);
    }

    return url;
  }

  start_app();

  function start_app() {
    return _start_app.apply(this, arguments);
  }

  function _start_app() {
    _start_app = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee27() {
      var useViewFrame, translator$1, voodoo;
      return regeneratorRuntime.wrap(function _callee27$(_context27) {
        while (1) {
          switch (_context27.prev = _context27.next) {
            case 0:
              useViewFrame = false;
              translator$1 = translator;
              _context27.next = 4;
              return Voodoo({
                api: getAPI(),
                translator: translator$1,
                useViewFrame: useViewFrame
              });

            case 4:
              voodoo = _context27.sent;
              self.voodoo = voodoo;
              return _context27.abrupt("return", voodoo);

            case 7:
            case "end":
              return _context27.stop();
          }
        }
      }, _callee27);
    }));
    return _start_app.apply(this, arguments);
  }
})();

