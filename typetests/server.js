// Why can I just use "git submodule foreach 'npm i && npm rebuild'" ????
"use strict";
System.register("args", [], function (exports_1, context_1) {
    "use strict";
    var chrome_port, app_port, cookie, username, token, start_mode;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [],
        execute: function () {
            exports_1("chrome_port", chrome_port = process.argv[2]);
            exports_1("app_port", app_port = process.argv[3]);
            exports_1("cookie", cookie = process.argv[4]);
            exports_1("username", username = process.argv[5]);
            exports_1("token", token = process.argv[6]);
            exports_1("start_mode", start_mode = process.argv[7]);
        }
    };
});
/* eslint-disable no-useless-escape */
System.register("public/kbd", [], function (exports_2, context_2) {
    "use strict";
    var keys;
    var __moduleName = context_2 && context_2.id;
    return {
        setters: [],
        execute: function () {/* eslint-disable no-useless-escape */
            keys = {
                '0': { 'keyCode': 48, 'key': '0', 'code': 'Digit0' },
                '1': { 'keyCode': 49, 'key': '1', 'code': 'Digit1' },
                '2': { 'keyCode': 50, 'key': '2', 'code': 'Digit2' },
                '3': { 'keyCode': 51, 'key': '3', 'code': 'Digit3' },
                '4': { 'keyCode': 52, 'key': '4', 'code': 'Digit4' },
                '5': { 'keyCode': 53, 'key': '5', 'code': 'Digit5' },
                '6': { 'keyCode': 54, 'key': '6', 'code': 'Digit6' },
                '7': { 'keyCode': 55, 'key': '7', 'code': 'Digit7' },
                '8': { 'keyCode': 56, 'key': '8', 'code': 'Digit8' },
                '9': { 'keyCode': 57, 'key': '9', 'code': 'Digit9' },
                'Power': { 'key': 'Power', 'code': 'Power' },
                'Eject': { 'key': 'Eject', 'code': 'Eject' },
                'Abort': { 'keyCode': 3, 'code': 'Abort', 'key': 'Cancel' },
                'Help': { 'keyCode': 6, 'code': 'Help', 'key': 'Help' },
                'Backspace': { 'keyCode': 8, 'code': 'Backspace', 'key': 'Backspace' },
                'Tab': { 'keyCode': 9, 'code': 'Tab', 'key': 'Tab' },
                'Numpad5': { 'keyCode': 12, 'shiftKeyCode': 101, 'key': 'Clear', 'code': 'Numpad5', 'shiftKey': '5', 'location': 3 },
                'NumpadEnter': { 'keyCode': 13, 'code': 'NumpadEnter', 'key': 'Enter', 'text': '\r', 'location': 3 },
                'Enter': { 'keyCode': 13, 'code': 'Enter', 'key': 'Enter', 'text': '\r' },
                '\r': { 'keyCode': 13, 'code': 'Enter', 'key': 'Enter', 'text': '\r' },
                '\n': { 'keyCode': 13, 'code': 'Enter', 'key': 'Enter', 'text': '\r' },
                'ShiftLeft': { 'keyCode': 16, 'code': 'ShiftLeft', 'key': 'Shift', 'location': 1 },
                'ShiftRight': { 'keyCode': 16, 'code': 'ShiftRight', 'key': 'Shift', 'location': 2 },
                'ControlLeft': { 'keyCode': 17, 'code': 'ControlLeft', 'key': 'Control', 'location': 1 },
                'ControlRight': { 'keyCode': 17, 'code': 'ControlRight', 'key': 'Control', 'location': 2 },
                'AltLeft': { 'keyCode': 18, 'code': 'AltLeft', 'key': 'Alt', 'location': 1 },
                'AltRight': { 'keyCode': 18, 'code': 'AltRight', 'key': 'Alt', 'location': 2 },
                'Pause': { 'keyCode': 19, 'code': 'Pause', 'key': 'Pause' },
                'CapsLock': { 'keyCode': 20, 'code': 'CapsLock', 'key': 'CapsLock' },
                'Escape': { 'keyCode': 27, 'code': 'Escape', 'key': 'Escape' },
                'Convert': { 'keyCode': 28, 'code': 'Convert', 'key': 'Convert' },
                'NonConvert': { 'keyCode': 29, 'code': 'NonConvert', 'key': 'NonConvert' },
                'Space': { 'keyCode': 32, 'code': 'Space', 'key': ' ' },
                'Numpad9': { 'keyCode': 33, 'shiftKeyCode': 105, 'key': 'PageUp', 'code': 'Numpad9', 'shiftKey': '9', 'location': 3 },
                'PageUp': { 'keyCode': 33, 'code': 'PageUp', 'key': 'PageUp' },
                'Numpad3': { 'keyCode': 34, 'shiftKeyCode': 99, 'key': 'PageDown', 'code': 'Numpad3', 'shiftKey': '3', 'location': 3 },
                'PageDown': { 'keyCode': 34, 'code': 'PageDown', 'key': 'PageDown' },
                'End': { 'keyCode': 35, 'code': 'End', 'key': 'End' },
                'Numpad1': { 'keyCode': 35, 'shiftKeyCode': 97, 'key': 'End', 'code': 'Numpad1', 'shiftKey': '1', 'location': 3 },
                'Home': { 'keyCode': 36, 'code': 'Home', 'key': 'Home' },
                'Numpad7': { 'keyCode': 36, 'shiftKeyCode': 103, 'key': 'Home', 'code': 'Numpad7', 'shiftKey': '7', 'location': 3 },
                'ArrowLeft': { 'keyCode': 37, 'code': 'ArrowLeft', 'key': 'ArrowLeft' },
                'Numpad4': { 'keyCode': 37, 'shiftKeyCode': 100, 'key': 'ArrowLeft', 'code': 'Numpad4', 'shiftKey': '4', 'location': 3 },
                'Numpad8': { 'keyCode': 38, 'shiftKeyCode': 104, 'key': 'ArrowUp', 'code': 'Numpad8', 'shiftKey': '8', 'location': 3 },
                'ArrowUp': { 'keyCode': 38, 'code': 'ArrowUp', 'key': 'ArrowUp' },
                'ArrowRight': { 'keyCode': 39, 'code': 'ArrowRight', 'key': 'ArrowRight' },
                'Numpad6': { 'keyCode': 39, 'shiftKeyCode': 102, 'key': 'ArrowRight', 'code': 'Numpad6', 'shiftKey': '6', 'location': 3 },
                'Numpad2': { 'keyCode': 40, 'shiftKeyCode': 98, 'key': 'ArrowDown', 'code': 'Numpad2', 'shiftKey': '2', 'location': 3 },
                'ArrowDown': { 'keyCode': 40, 'code': 'ArrowDown', 'key': 'ArrowDown' },
                'Select': { 'keyCode': 41, 'code': 'Select', 'key': 'Select' },
                'Open': { 'keyCode': 43, 'code': 'Open', 'key': 'Execute' },
                'PrintScreen': { 'keyCode': 44, 'code': 'PrintScreen', 'key': 'PrintScreen' },
                'Insert': { 'keyCode': 45, 'code': 'Insert', 'key': 'Insert' },
                'Numpad0': { 'keyCode': 45, 'shiftKeyCode': 96, 'key': 'Insert', 'code': 'Numpad0', 'shiftKey': '0', 'location': 3 },
                'Delete': { 'keyCode': 46, 'code': 'Delete', 'key': 'Delete' },
                'NumpadDecimal': { 'keyCode': 46, 'shiftKeyCode': 110, 'code': 'NumpadDecimal', 'key': '\u0000', 'shiftKey': '.', 'location': 3 },
                'Digit0': { 'keyCode': 48, 'code': 'Digit0', 'shiftKey': ')', 'key': '0' },
                'Digit1': { 'keyCode': 49, 'code': 'Digit1', 'shiftKey': '!', 'key': '1' },
                'Digit2': { 'keyCode': 50, 'code': 'Digit2', 'shiftKey': '@', 'key': '2' },
                'Digit3': { 'keyCode': 51, 'code': 'Digit3', 'shiftKey': '#', 'key': '3' },
                'Digit4': { 'keyCode': 52, 'code': 'Digit4', 'shiftKey': '$', 'key': '4' },
                'Digit5': { 'keyCode': 53, 'code': 'Digit5', 'shiftKey': '%', 'key': '5' },
                'Digit6': { 'keyCode': 54, 'code': 'Digit6', 'shiftKey': '^', 'key': '6' },
                'Digit7': { 'keyCode': 55, 'code': 'Digit7', 'shiftKey': '&', 'key': '7' },
                'Digit8': { 'keyCode': 56, 'code': 'Digit8', 'shiftKey': '*', 'key': '8' },
                'Digit9': { 'keyCode': 57, 'code': 'Digit9', 'shiftKey': '\(', 'key': '9' },
                'KeyA': { 'keyCode': 65, 'code': 'KeyA', 'shiftKey': 'A', 'key': 'a' },
                'KeyB': { 'keyCode': 66, 'code': 'KeyB', 'shiftKey': 'B', 'key': 'b' },
                'KeyC': { 'keyCode': 67, 'code': 'KeyC', 'shiftKey': 'C', 'key': 'c' },
                'KeyD': { 'keyCode': 68, 'code': 'KeyD', 'shiftKey': 'D', 'key': 'd' },
                'KeyE': { 'keyCode': 69, 'code': 'KeyE', 'shiftKey': 'E', 'key': 'e' },
                'KeyF': { 'keyCode': 70, 'code': 'KeyF', 'shiftKey': 'F', 'key': 'f' },
                'KeyG': { 'keyCode': 71, 'code': 'KeyG', 'shiftKey': 'G', 'key': 'g' },
                'KeyH': { 'keyCode': 72, 'code': 'KeyH', 'shiftKey': 'H', 'key': 'h' },
                'KeyI': { 'keyCode': 73, 'code': 'KeyI', 'shiftKey': 'I', 'key': 'i' },
                'KeyJ': { 'keyCode': 74, 'code': 'KeyJ', 'shiftKey': 'J', 'key': 'j' },
                'KeyK': { 'keyCode': 75, 'code': 'KeyK', 'shiftKey': 'K', 'key': 'k' },
                'KeyL': { 'keyCode': 76, 'code': 'KeyL', 'shiftKey': 'L', 'key': 'l' },
                'KeyM': { 'keyCode': 77, 'code': 'KeyM', 'shiftKey': 'M', 'key': 'm' },
                'KeyN': { 'keyCode': 78, 'code': 'KeyN', 'shiftKey': 'N', 'key': 'n' },
                'KeyO': { 'keyCode': 79, 'code': 'KeyO', 'shiftKey': 'O', 'key': 'o' },
                'KeyP': { 'keyCode': 80, 'code': 'KeyP', 'shiftKey': 'P', 'key': 'p' },
                'KeyQ': { 'keyCode': 81, 'code': 'KeyQ', 'shiftKey': 'Q', 'key': 'q' },
                'KeyR': { 'keyCode': 82, 'code': 'KeyR', 'shiftKey': 'R', 'key': 'r' },
                'KeyS': { 'keyCode': 83, 'code': 'KeyS', 'shiftKey': 'S', 'key': 's' },
                'KeyT': { 'keyCode': 84, 'code': 'KeyT', 'shiftKey': 'T', 'key': 't' },
                'KeyU': { 'keyCode': 85, 'code': 'KeyU', 'shiftKey': 'U', 'key': 'u' },
                'KeyV': { 'keyCode': 86, 'code': 'KeyV', 'shiftKey': 'V', 'key': 'v' },
                'KeyW': { 'keyCode': 87, 'code': 'KeyW', 'shiftKey': 'W', 'key': 'w' },
                'KeyX': { 'keyCode': 88, 'code': 'KeyX', 'shiftKey': 'X', 'key': 'x' },
                'KeyY': { 'keyCode': 89, 'code': 'KeyY', 'shiftKey': 'Y', 'key': 'y' },
                'KeyZ': { 'keyCode': 90, 'code': 'KeyZ', 'shiftKey': 'Z', 'key': 'z' },
                'MetaLeft': { 'keyCode': 91, 'code': 'MetaLeft', 'key': 'Meta', 'location': 1 },
                'MetaRight': { 'keyCode': 92, 'code': 'MetaRight', 'key': 'Meta', 'location': 2 },
                'ContextMenu': { 'keyCode': 93, 'code': 'ContextMenu', 'key': 'ContextMenu' },
                'NumpadMultiply': { 'keyCode': 106, 'code': 'NumpadMultiply', 'key': '*', 'location': 3 },
                'NumpadAdd': { 'keyCode': 107, 'code': 'NumpadAdd', 'key': '+', 'location': 3 },
                'NumpadSubtract': { 'keyCode': 109, 'code': 'NumpadSubtract', 'key': '-', 'location': 3 },
                'NumpadDivide': { 'keyCode': 111, 'code': 'NumpadDivide', 'key': '/', 'location': 3 },
                'F1': { 'keyCode': 112, 'code': 'F1', 'key': 'F1' },
                'F2': { 'keyCode': 113, 'code': 'F2', 'key': 'F2' },
                'F3': { 'keyCode': 114, 'code': 'F3', 'key': 'F3' },
                'F4': { 'keyCode': 115, 'code': 'F4', 'key': 'F4' },
                'F5': { 'keyCode': 116, 'code': 'F5', 'key': 'F5' },
                'F6': { 'keyCode': 117, 'code': 'F6', 'key': 'F6' },
                'F7': { 'keyCode': 118, 'code': 'F7', 'key': 'F7' },
                'F8': { 'keyCode': 119, 'code': 'F8', 'key': 'F8' },
                'F9': { 'keyCode': 120, 'code': 'F9', 'key': 'F9' },
                'F10': { 'keyCode': 121, 'code': 'F10', 'key': 'F10' },
                'F11': { 'keyCode': 122, 'code': 'F11', 'key': 'F11' },
                'F12': { 'keyCode': 123, 'code': 'F12', 'key': 'F12' },
                'F13': { 'keyCode': 124, 'code': 'F13', 'key': 'F13' },
                'F14': { 'keyCode': 125, 'code': 'F14', 'key': 'F14' },
                'F15': { 'keyCode': 126, 'code': 'F15', 'key': 'F15' },
                'F16': { 'keyCode': 127, 'code': 'F16', 'key': 'F16' },
                'F17': { 'keyCode': 128, 'code': 'F17', 'key': 'F17' },
                'F18': { 'keyCode': 129, 'code': 'F18', 'key': 'F18' },
                'F19': { 'keyCode': 130, 'code': 'F19', 'key': 'F19' },
                'F20': { 'keyCode': 131, 'code': 'F20', 'key': 'F20' },
                'F21': { 'keyCode': 132, 'code': 'F21', 'key': 'F21' },
                'F22': { 'keyCode': 133, 'code': 'F22', 'key': 'F22' },
                'F23': { 'keyCode': 134, 'code': 'F23', 'key': 'F23' },
                'F24': { 'keyCode': 135, 'code': 'F24', 'key': 'F24' },
                'NumLock': { 'keyCode': 144, 'code': 'NumLock', 'key': 'NumLock' },
                'ScrollLock': { 'keyCode': 145, 'code': 'ScrollLock', 'key': 'ScrollLock' },
                'AudioVolumeMute': { 'keyCode': 173, 'code': 'AudioVolumeMute', 'key': 'AudioVolumeMute' },
                'AudioVolumeDown': { 'keyCode': 174, 'code': 'AudioVolumeDown', 'key': 'AudioVolumeDown' },
                'AudioVolumeUp': { 'keyCode': 175, 'code': 'AudioVolumeUp', 'key': 'AudioVolumeUp' },
                'MediaTrackNext': { 'keyCode': 176, 'code': 'MediaTrackNext', 'key': 'MediaTrackNext' },
                'MediaTrackPrevious': { 'keyCode': 177, 'code': 'MediaTrackPrevious', 'key': 'MediaTrackPrevious' },
                'MediaStop': { 'keyCode': 178, 'code': 'MediaStop', 'key': 'MediaStop' },
                'MediaPlayPause': { 'keyCode': 179, 'code': 'MediaPlayPause', 'key': 'MediaPlayPause' },
                'Semicolon': { 'keyCode': 186, 'code': 'Semicolon', 'shiftKey': ':', 'key': ';' },
                'Equal': { 'keyCode': 187, 'code': 'Equal', 'shiftKey': '+', 'key': '=' },
                'NumpadEqual': { 'keyCode': 187, 'code': 'NumpadEqual', 'key': '=', 'location': 3 },
                'Comma': { 'keyCode': 188, 'code': 'Comma', 'shiftKey': '\<', 'key': ',' },
                'Minus': { 'keyCode': 189, 'code': 'Minus', 'shiftKey': '_', 'key': '-' },
                'Period': { 'keyCode': 190, 'code': 'Period', 'shiftKey': '>', 'key': '.' },
                'Slash': { 'keyCode': 191, 'code': 'Slash', 'shiftKey': '?', 'key': '/' },
                'Backquote': { 'keyCode': 192, 'code': 'Backquote', 'shiftKey': '~', 'key': '`' },
                'BracketLeft': { 'keyCode': 219, 'code': 'BracketLeft', 'shiftKey': '{', 'key': '[' },
                'Backslash': { 'keyCode': 220, 'code': 'Backslash', 'shiftKey': '|', 'key': '\\' },
                'BracketRight': { 'keyCode': 221, 'code': 'BracketRight', 'shiftKey': '}', 'key': ']' },
                'Quote': { 'keyCode': 222, 'code': 'Quote', 'shiftKey': '"', 'key': '\'' },
                'AltGraph': { 'keyCode': 225, 'code': 'AltGraph', 'key': 'AltGraph' },
                'Props': { 'keyCode': 247, 'code': 'Props', 'key': 'CrSel' },
                'Cancel': { 'keyCode': 3, 'key': 'Cancel', 'code': 'Abort' },
                'Clear': { 'keyCode': 12, 'key': 'Clear', 'code': 'Numpad5', 'location': 3 },
                'Shift': { 'keyCode': 16, 'key': 'Shift', 'code': 'ShiftLeft', 'location': 1 },
                'Control': { 'keyCode': 17, 'key': 'Control', 'code': 'ControlLeft', 'location': 1 },
                'Alt': { 'keyCode': 18, 'key': 'Alt', 'code': 'AltLeft', 'location': 1 },
                'Accept': { 'keyCode': 30, 'key': 'Accept' },
                'ModeChange': { 'keyCode': 31, 'key': 'ModeChange' },
                ' ': { 'keyCode': 32, 'key': ' ', 'code': 'Space' },
                'Print': { 'keyCode': 42, 'key': 'Print' },
                'Execute': { 'keyCode': 43, 'key': 'Execute', 'code': 'Open' },
                '\u0000': { 'keyCode': 46, 'key': '\u0000', 'code': 'NumpadDecimal', 'location': 3 },
                'a': { 'keyCode': 65, 'key': 'a', 'code': 'KeyA' },
                'b': { 'keyCode': 66, 'key': 'b', 'code': 'KeyB' },
                'c': { 'keyCode': 67, 'key': 'c', 'code': 'KeyC' },
                'd': { 'keyCode': 68, 'key': 'd', 'code': 'KeyD' },
                'e': { 'keyCode': 69, 'key': 'e', 'code': 'KeyE' },
                'f': { 'keyCode': 70, 'key': 'f', 'code': 'KeyF' },
                'g': { 'keyCode': 71, 'key': 'g', 'code': 'KeyG' },
                'h': { 'keyCode': 72, 'key': 'h', 'code': 'KeyH' },
                'i': { 'keyCode': 73, 'key': 'i', 'code': 'KeyI' },
                'j': { 'keyCode': 74, 'key': 'j', 'code': 'KeyJ' },
                'k': { 'keyCode': 75, 'key': 'k', 'code': 'KeyK' },
                'l': { 'keyCode': 76, 'key': 'l', 'code': 'KeyL' },
                'm': { 'keyCode': 77, 'key': 'm', 'code': 'KeyM' },
                'n': { 'keyCode': 78, 'key': 'n', 'code': 'KeyN' },
                'o': { 'keyCode': 79, 'key': 'o', 'code': 'KeyO' },
                'p': { 'keyCode': 80, 'key': 'p', 'code': 'KeyP' },
                'q': { 'keyCode': 81, 'key': 'q', 'code': 'KeyQ' },
                'r': { 'keyCode': 82, 'key': 'r', 'code': 'KeyR' },
                's': { 'keyCode': 83, 'key': 's', 'code': 'KeyS' },
                't': { 'keyCode': 84, 'key': 't', 'code': 'KeyT' },
                'u': { 'keyCode': 85, 'key': 'u', 'code': 'KeyU' },
                'v': { 'keyCode': 86, 'key': 'v', 'code': 'KeyV' },
                'w': { 'keyCode': 87, 'key': 'w', 'code': 'KeyW' },
                'x': { 'keyCode': 88, 'key': 'x', 'code': 'KeyX' },
                'y': { 'keyCode': 89, 'key': 'y', 'code': 'KeyY' },
                'z': { 'keyCode': 90, 'key': 'z', 'code': 'KeyZ' },
                'Meta': { 'keyCode': 91, 'key': 'Meta', 'code': 'MetaLeft', 'location': 1 },
                '*': { 'keyCode': 106, 'key': '*', 'code': 'NumpadMultiply', 'location': 3 },
                '+': { 'keyCode': 107, 'key': '+', 'code': 'NumpadAdd', 'location': 3 },
                '-': { 'keyCode': 109, 'key': '-', 'code': 'NumpadSubtract', 'location': 3 },
                '/': { 'keyCode': 111, 'key': '/', 'code': 'NumpadDivide', 'location': 3 },
                ';': { 'keyCode': 186, 'key': ';', 'code': 'Semicolon' },
                '=': { 'keyCode': 187, 'key': '=', 'code': 'Equal' },
                ',': { 'keyCode': 188, 'key': ',', 'code': 'Comma' },
                '.': { 'keyCode': 190, 'key': '.', 'code': 'Period' },
                '`': { 'keyCode': 192, 'key': '`', 'code': 'Backquote' },
                '[': { 'keyCode': 219, 'key': '[', 'code': 'BracketLeft' },
                '\\': { 'keyCode': 220, 'key': '\\', 'code': 'Backslash' },
                ']': { 'keyCode': 221, 'key': ']', 'code': 'BracketRight' },
                '\'': { 'keyCode': 222, 'key': '\'', 'code': 'Quote' },
                'Attn': { 'keyCode': 246, 'key': 'Attn' },
                'CrSel': { 'keyCode': 247, 'key': 'CrSel', 'code': 'Props' },
                'ExSel': { 'keyCode': 248, 'key': 'ExSel' },
                'EraseEof': { 'keyCode': 249, 'key': 'EraseEof' },
                'Play': { 'keyCode': 250, 'key': 'Play' },
                'ZoomOut': { 'keyCode': 251, 'key': 'ZoomOut' },
                ')': { 'keyCode': 48, 'key': ')', 'code': 'Digit0' },
                '!': { 'keyCode': 49, 'key': '!', 'code': 'Digit1' },
                '@': { 'keyCode': 50, 'key': '@', 'code': 'Digit2' },
                '#': { 'keyCode': 51, 'key': '#', 'code': 'Digit3' },
                '$': { 'keyCode': 52, 'key': '$', 'code': 'Digit4' },
                '%': { 'keyCode': 53, 'key': '%', 'code': 'Digit5' },
                '^': { 'keyCode': 54, 'key': '^', 'code': 'Digit6' },
                '&': { 'keyCode': 55, 'key': '&', 'code': 'Digit7' },
                '(': { 'keyCode': 57, 'key': '\(', 'code': 'Digit9' },
                'A': { 'keyCode': 65, 'key': 'A', 'code': 'KeyA' },
                'B': { 'keyCode': 66, 'key': 'B', 'code': 'KeyB' },
                'C': { 'keyCode': 67, 'key': 'C', 'code': 'KeyC' },
                'D': { 'keyCode': 68, 'key': 'D', 'code': 'KeyD' },
                'E': { 'keyCode': 69, 'key': 'E', 'code': 'KeyE' },
                'F': { 'keyCode': 70, 'key': 'F', 'code': 'KeyF' },
                'G': { 'keyCode': 71, 'key': 'G', 'code': 'KeyG' },
                'H': { 'keyCode': 72, 'key': 'H', 'code': 'KeyH' },
                'I': { 'keyCode': 73, 'key': 'I', 'code': 'KeyI' },
                'J': { 'keyCode': 74, 'key': 'J', 'code': 'KeyJ' },
                'K': { 'keyCode': 75, 'key': 'K', 'code': 'KeyK' },
                'L': { 'keyCode': 76, 'key': 'L', 'code': 'KeyL' },
                'M': { 'keyCode': 77, 'key': 'M', 'code': 'KeyM' },
                'N': { 'keyCode': 78, 'key': 'N', 'code': 'KeyN' },
                'O': { 'keyCode': 79, 'key': 'O', 'code': 'KeyO' },
                'P': { 'keyCode': 80, 'key': 'P', 'code': 'KeyP' },
                'Q': { 'keyCode': 81, 'key': 'Q', 'code': 'KeyQ' },
                'R': { 'keyCode': 82, 'key': 'R', 'code': 'KeyR' },
                'S': { 'keyCode': 83, 'key': 'S', 'code': 'KeyS' },
                'T': { 'keyCode': 84, 'key': 'T', 'code': 'KeyT' },
                'U': { 'keyCode': 85, 'key': 'U', 'code': 'KeyU' },
                'V': { 'keyCode': 86, 'key': 'V', 'code': 'KeyV' },
                'W': { 'keyCode': 87, 'key': 'W', 'code': 'KeyW' },
                'X': { 'keyCode': 88, 'key': 'X', 'code': 'KeyX' },
                'Y': { 'keyCode': 89, 'key': 'Y', 'code': 'KeyY' },
                'Z': { 'keyCode': 90, 'key': 'Z', 'code': 'KeyZ' },
                ':': { 'keyCode': 186, 'key': ':', 'code': 'Semicolon' },
                '<': { 'keyCode': 188, 'key': '\<', 'code': 'Comma' },
                '_': { 'keyCode': 189, 'key': '_', 'code': 'Minus' },
                '>': { 'keyCode': 190, 'key': '>', 'code': 'Period' },
                '?': { 'keyCode': 191, 'key': '?', 'code': 'Slash' },
                '~': { 'keyCode': 192, 'key': '~', 'code': 'Backquote' },
                '{': { 'keyCode': 219, 'key': '{', 'code': 'BracketLeft' },
                '|': { 'keyCode': 220, 'key': '|', 'code': 'Backslash' },
                '}': { 'keyCode': 221, 'key': '}', 'code': 'BracketRight' },
                '"': { 'keyCode': 222, 'key': '"', 'code': 'Quote' }
            };
            exports_2("default", keys);
        }
    };
});
System.register("public/translateVoodooCRDP", ["public/kbd"], function (exports_3, context_3) {
    "use strict";
    var kbd_js_1, FRAME_CONTROL, IMAGE_FORMAT, WorldName, SHORT_TIMEOUT, MIN_DELTA, MIN_PIX_DELTA, THRESHOLD_DELTA, DOM_DELTA_PIXEL, DOM_DELTA_LINE, DOM_DELTA_PAGE, LINE_HEIGHT_GUESS, SYNTHETIC_CTRL;
    var __moduleName = context_3 && context_3.id;
    function translator(e, handled = { type: 'case' }) {
        handled.type = handled.type || 'case';
        switch (e.type) {
            case "touchcancel": {
                return {
                    command: {
                        name: "Input.dispatchTouchEvent",
                        params: {
                            type: "touchCancel"
                        },
                    }
                };
            }
            case "mousedown":
            case "mouseup":
            case "mousemove":
            case "pointerdown":
            case "pointerup":
            case "pointermove": {
                let button = "none";
                if (!e.type.endsWith("move")) {
                    if (e.button == 0) {
                        button = "left";
                    }
                    else {
                        button = "right";
                    }
                }
                return {
                    command: {
                        name: "Input.emulateTouchFromMouseEvent",
                        params: {
                            x: Math.round(e.bitmapX),
                            y: Math.round(e.bitmapY),
                            type: e.type.endsWith("down") ? "mousePressed" :
                                e.type.endsWith("up") ? "mouseReleased" : "mouseMoved",
                            button,
                            clickCount: !e.type.endsWith("move") ? 1 : 0,
                            modifiers: encodeModifiers(e.originalEvent)
                        },
                        requiresShot: !e.originalEvent.noShot && e.type.endsWith("down")
                    }
                };
            }
            case "wheel": {
                // if we use emulateTouchFromMouseEvent we need a button value
                const deltaMode = e.originalEvent.deltaMode;
                const deltaX = adjustWheelDeltaByMode(e.originalEvent.deltaX, deltaMode);
                const deltaY = adjustWheelDeltaByMode(e.originalEvent.deltaY, deltaMode);
                const { contextId } = e;
                const clientX = 0;
                const clientY = 0;
                const deltas = { deltaX, deltaY, clientX, clientY };
                let retVal;
                if (deltaX > MIN_DELTA || deltaY > MIN_DELTA) {
                    const retVal1 = {
                        command: {
                            name: "Runtime.evaluate",
                            params: {
                                expression: `self.ensureScroll(${JSON.stringify(deltas)});`,
                                includeCommandLineAPI: false,
                                userGesture: true,
                                contextId,
                                timeout: SHORT_TIMEOUT
                            }
                        }
                    };
                    const retVal2 = mouseEvent(e, deltaX, deltaY);
                    retVal = [retVal1, retVal2];
                }
                else {
                    retVal = mouseEvent(e, deltaX, deltaY);
                }
                return retVal;
            }
            case "auth-response": {
                const { requestId, authResponse } = e;
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
            case "control-chars": {
                return keyEvent(e);
            }
            case "typing": {
                //alert(JSON.stringify(e));
                if (e.isComposing || !e.characters)
                    return;
                else
                    return {
                        command: {
                            name: "Input.insertText",
                            params: {
                                text: (e.characters || '')
                            },
                            requiresShot: true,
                            ignoreHash: true
                        }
                    };
            }
            case "typing-syncValue": {
                if (!e.encodedValue)
                    return;
                else
                    return {
                        command: {
                            name: "Runtime.evaluate",
                            params: {
                                expression: `syncFocusedInputToValue("${e.encodedValue}");`,
                                includeCommandLineAPI: false,
                                userGesture: true,
                                contextId: e.contextId,
                                timeout: SHORT_TIMEOUT,
                            },
                            requiresShot: true,
                            ignoreHash: true
                        }
                    };
            }
            case "typing-deleteContentBackward": {
                if (!e.encodedValueToDelete)
                    return;
                else
                    return {
                        command: {
                            name: "Runtime.evaluate",
                            params: {
                                expression: `fromFocusedInputDeleteLastOccurrenceOf("${e.encodedValueToDelete}");`,
                                includeCommandLineAPI: false,
                                userGesture: true,
                                contextId: e.contextId,
                                timeout: SHORT_TIMEOUT
                            },
                            requiresShot: true
                        }
                    };
            }
            case "url-address": {
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
            case "history": {
                switch (e.action) {
                    case "reload":
                    case "stop": {
                        return {
                            command: {
                                requiresLoad: e.action == "reload",
                                requiresShot: e.action == "reload",
                                name: e.action == "reload" ? "Page.reload" : "Page.stopLoading",
                                params: {},
                            }
                        };
                    }
                    case "back":
                    case "forward": {
                        return { chain: [
                                {
                                    command: {
                                        name: "Page.getNavigationHistory",
                                        params: {}
                                    }
                                },
                                ({ currentIndex, entries }) => {
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
                                }
                            ] };
                    }
                    default: {
                        throw new TypeError(`Unkown history action ${e.action}`);
                    }
                }
            }
            case "touchscroll": {
                let { deltaX, deltaY, bitmapX: clientX, bitmapY: clientY, contextId } = e;
                // only one scroll direction at a time
                if (Math.abs(deltaY) > Math.abs(deltaX)) {
                    deltaX = 0;
                    if (Math.abs(deltaY) > 0.412 * self.ViewportHeight) {
                        deltaY = Math.round(2.718 * deltaY);
                    }
                }
                else {
                    deltaY = 0;
                    if (Math.abs(deltaX) > 0.412 * self.ViewportWidth) {
                        deltaX = Math.round(2.718 * deltaX);
                    }
                }
                clientX = Math.round(clientX);
                clientY = Math.round(clientY);
                const deltas = { deltaX, deltaY, clientX, clientY };
                const retVal1 = {
                    command: {
                        name: "Runtime.evaluate",
                        params: {
                            expression: `self.ensureScroll(${JSON.stringify(deltas)});`,
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
            case "zoom": {
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
            case "select": {
                const retVal = {
                    command: {
                        name: "Runtime.evaluate",
                        params: {
                            expression: `self.setSelectValue("${e.value}");`,
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
            case "window-bounds": {
                let { width, height, targetId } = e;
                width = parseInt(width);
                height = parseInt(height);
                const retVal = { chain: [
                        {
                            command: {
                                name: "Browser.getWindowForTarget",
                                params: { targetId },
                            }
                        },
                        ({ windowId, bounds }) => {
                            if (bounds.width == width && bounds.height == height)
                                return;
                            const retVal = {
                                command: {
                                    name: "Browser.setWindowBounds",
                                    params: {
                                        windowId,
                                        bounds: { width, height }
                                    },
                                    requiresWindowId: true
                                }
                            };
                            return retVal;
                        }
                    ] };
                return retVal;
            }
            case "window-bounds-preImplementation": {
                // This is here until Browser.getWindowForTarget and Browser.setWindowBounds come online
                let { width, height } = e;
                width = parseInt(width);
                height = parseInt(height);
                const retVal = {
                    command: {
                        name: "Emulation.setVisibleSize",
                        params: { width, height },
                    },
                    requiresShot: true,
                };
                return retVal;
            }
            case "user-agent": {
                const { userAgent, platform, acceptLanguage } = e;
                const retVal = {
                    command: {
                        name: "Network.setUserAgentOverride",
                        params: {
                            userAgent, platform,
                            acceptLanguage,
                        }
                    }
                };
                return retVal;
            }
            case "hide-scrollbars": {
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
            case "buffered-results-collection": {
                return e;
            }
            case "doShot": {
                return {
                    command: {
                        isZombieLordCommand: true,
                        name: "Connection.doShot",
                        params: {}
                    }
                };
            }
            case "canKeysInput": {
                return { chain: [
                        {
                            command: {
                                isZombieLordCommand: true,
                                name: "Connection.getContextIdsForActiveSession",
                                params: {
                                    worldName: WorldName
                                }
                            }
                        },
                        ({ contextIds }) => contextIds.map(contextId => ({
                            command: {
                                name: "Runtime.evaluate",
                                params: {
                                    expression: "canKeysInput();",
                                    contextId: contextId,
                                    timeout: SHORT_TIMEOUT
                                },
                            }
                        }))
                    ] };
            }
            case "getElementInfo": {
                return { chain: [
                        {
                            command: {
                                isZombieLordCommand: true,
                                name: "Connection.getContextIdsForActiveSession",
                                params: {
                                    worldName: WorldName
                                }
                            }
                        },
                        ({ contextIds }) => contextIds.map(contextId => ({
                            command: {
                                name: "Runtime.evaluate",
                                params: {
                                    expression: `getElementInfo(${JSON.stringify(e.data)});`,
                                    contextId: contextId,
                                    timeout: SHORT_TIMEOUT
                                },
                            }
                        }))
                    ] };
            }
            case "getFavicon": {
                return { chain: [
                        {
                            command: {
                                isZombieLordCommand: true,
                                name: "Connection.getAllContextIds",
                                params: {
                                    worldName: WorldName
                                }
                            }
                        },
                        ({ sessionContextIdPairs }) => sessionContextIdPairs.map(({ sessionId, contextId }) => {
                            return {
                                command: {
                                    name: "Runtime.evaluate",
                                    params: {
                                        sessionId,
                                        contextId,
                                        expression: "getFaviconElement();",
                                        timeout: SHORT_TIMEOUT
                                    },
                                }
                            };
                        })
                    ] };
            }
            case "newIncognitoTab": {
                return { chain: [
                        {
                            command: {
                                name: "Target.createBrowserContext",
                                params: {}
                            }
                        },
                        ({ browserContextId }) => {
                            return {
                                command: {
                                    name: "Target.createTarget",
                                    params: {
                                        browserContextId,
                                        url: "about:blank",
                                        enableBeginFrameControl: FRAME_CONTROL
                                    },
                                }
                            };
                        }
                    ] };
            }
            case "isSafari": {
                return {
                    command: {
                        isZombieLordCommand: true,
                        name: "Connection.setIsSafari",
                        params: {}
                    }
                };
            }
            case "isFirefox": {
                return {
                    command: {
                        isZombieLordCommand: true,
                        name: "Connection.setIsFirefox",
                        params: {}
                    }
                };
            }
            case "clearAllPageHistory": {
                return { chain: [
                        {
                            command: {
                                isZombieLordCommand: true,
                                name: "Connection.getAllSessionIds",
                                params: {}
                            }
                        },
                        ({ sessionIds }) => sessionIds.map(sessionId => {
                            return {
                                command: {
                                    name: "Page.resetNavigationHistory",
                                    params: {
                                        sessionId,
                                    },
                                }
                            };
                        })
                    ] };
            }
            case "clearCache": {
                return {
                    command: {
                        name: "Network.clearBrowserCache",
                        params: {}
                    }
                };
            }
            case "clearCookies": {
                return {
                    command: {
                        name: "Network.clearBrowserCookies",
                        params: {}
                    }
                };
            }
            case "respond-to-modal": {
                let accept = false;
                let { response, sessionId, promptText } = e;
                if (response == "ok") {
                    accept = true;
                }
                return {
                    command: {
                        name: "Page.handleJavaScriptDialog",
                        params: {
                            accept, promptText, sessionId
                        }
                    }
                };
            }
            default: {
                if ((!!e.command && !!e.command.name) || Array.isArray(e)) {
                    handled.type = 'default';
                    return e;
                }
                else {
                    handled.type = 'unhandled';
                    return;
                }
            }
        }
    }
    function mouseEvent(e, deltaX = 0, deltaY = 0) {
        return {
            command: {
                name: "Input.dispatchMouseEvent",
                params: {
                    x: Math.round(e.bitmapX),
                    y: Math.round(e.bitmapY),
                    type: "mouseWheel",
                    deltaX, deltaY
                },
                requiresShot: true,
            }
        };
    }
    function keyEvent(e, modifiers = 0, SYNTHETIC = false) {
        const id = e.key && e.key.length > 1 ? e.key : e.code;
        const def = kbd_js_1.default[id];
        const text = e.originalType == "keypress" ? String.fromCharCode(e.keyCode) : undefined;
        modifiers = modifiers || encodeModifiers(e.originalEvent);
        let type;
        if (e.originalType == "keydown") {
            if (text)
                type = "keyDown";
            else
                type = "rawKeyDown";
        }
        else if (e.originalType == "keypress") {
            type = "char";
        }
        else {
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
                    modifiers,
                },
                requiresShot: e.key == "Enter" || e.key == "Tab" || e.key == "Delete",
                ignoreHash: e.key == "Enter" || e.key == "Tab" || e.key == "Delete"
            }
        };
        if (!SYNTHETIC && retVal.command.params.key == 'Meta') {
            return [
                retVal,
                SYNTHETIC_CTRL(e)
            ];
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
        if (delta == 0)
            return delta;
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
    return {
        setters: [
            function (kbd_js_1_1) {
                kbd_js_1 = kbd_js_1_1;
            }
        ],
        execute: function () {
            exports_3("FRAME_CONTROL", FRAME_CONTROL = false);
            exports_3("IMAGE_FORMAT", IMAGE_FORMAT = 'png');
            exports_3("WorldName", WorldName = 'PlanetZanj');
            SHORT_TIMEOUT = 1000;
            MIN_DELTA = 40;
            MIN_PIX_DELTA = 8;
            THRESHOLD_DELTA = 1;
            DOM_DELTA_PIXEL = 0;
            DOM_DELTA_LINE = 1;
            DOM_DELTA_PAGE = 2;
            LINE_HEIGHT_GUESS = 32;
            SYNTHETIC_CTRL = e => keyEvent({ key: 'Control', originalType: e.originalType }, 2, true);
            exports_3("default", translator);
        }
    };
});
System.register("common", ["fs", "path", "url", "current-git-branch", "public/translateVoodooCRDP"], function (exports_4, context_4) {
    "use strict";
    var fs_1, path_1, url_1, current_git_branch_1, translateVoodooCRDP_js_1, DEBUG, APP_ROOT, GO_SECURE, STAGING, MASTER, BRANCH, version, COOKIENAME, SECURE_VIEW_SCRIPT, CONNECTION_ID_URL;
    var __moduleName = context_4 && context_4.id;
    async function throwAfter(ms, command, port) {
        await sleep(ms);
        throw new Error(`Timed out after ${ms}. ${port} : ${JSON.stringify(command, null, 2)}`);
    }
    exports_4("throwAfter", throwAfter);
    async function sleep(ms) {
        return new Promise(res => setTimeout(res, ms));
    }
    exports_4("sleep", sleep);
    return {
        setters: [
            function (fs_1_1) {
                fs_1 = fs_1_1;
            },
            function (path_1_1) {
                path_1 = path_1_1;
            },
            function (url_1_1) {
                url_1 = url_1_1;
            },
            function (current_git_branch_1_1) {
                current_git_branch_1 = current_git_branch_1_1;
            },
            function (translateVoodooCRDP_js_1_1) {
                translateVoodooCRDP_js_1 = translateVoodooCRDP_js_1_1;
            }
        ],
        execute: function () {
            exports_4("DEBUG", DEBUG = {
                goSecure: true,
                noAudio: false,
                legacyShots: !translateVoodooCRDP_js_1.FRAME_CONTROL,
                IMAGE_FORMAT: translateVoodooCRDP_js_1.IMAGE_FORMAT,
                shotDebug: false,
                noShot: false,
                dev: false,
                val: 0,
                low: 1,
                med: 3,
                high: 5
            });
            exports_4("APP_ROOT", APP_ROOT = path_1.default.dirname(url_1.fileURLToPath(context_4.meta.url)));
            exports_4("GO_SECURE", GO_SECURE = fs_1.default.existsSync(path_1.default.resolve(APP_ROOT, 'sslcert', 'master', 'privkey.pem')));
            exports_4("STAGING", STAGING = current_git_branch_1.default() == 'staging');
            exports_4("MASTER", MASTER = current_git_branch_1.default() == 'master');
            exports_4("BRANCH", BRANCH = current_git_branch_1.default());
            exports_4("version", version = 'v1');
            exports_4("COOKIENAME", COOKIENAME = `litewait-${version}-userauth-${GO_SECURE ? 'sec' : 'nonsec'}`);
            exports_4("SECURE_VIEW_SCRIPT", SECURE_VIEW_SCRIPT = path_1.default.join(__dirname, 'zombie-lord', 'scripts', 'get_download_view_url.sh'));
            exports_4("CONNECTION_ID_URL", CONNECTION_ID_URL = "data:text,DoNotDeleteMe");
        }
    };
});
System.register("zombie-lord/launcher", ["path", "os", "fs", "is-docker", "./custom-launcher/dist/chrome-launcher.js", "common"], function (exports_5, context_5) {
    "use strict";
    var path_2, os_1, fs_2, is_docker_1, chrome_launcher_js_1, common_js_1, RESTART_MS, zombies, chromeNumber, chrome_started, deathHandlers, launcher_api;
    var __moduleName = context_5 && context_5.id;
    return {
        setters: [
            function (path_2_1) {
                path_2 = path_2_1;
            },
            function (os_1_1) {
                os_1 = os_1_1;
            },
            function (fs_2_1) {
                fs_2 = fs_2_1;
            },
            function (is_docker_1_1) {
                is_docker_1 = is_docker_1_1;
            },
            function (chrome_launcher_js_1_1) {
                chrome_launcher_js_1 = chrome_launcher_js_1_1;
            },
            function (common_js_1_1) {
                common_js_1 = common_js_1_1;
            }
        ],
        execute: function () {
            RESTART_MS = 1000;
            zombies = new Map();
            chromeNumber = 0;
            chrome_started = false;
            deathHandlers = new Map();
            launcher_api = {
                async newZombie({ port, username } = {}) {
                    const udd = path_2.default.resolve(os_1.default.homedir(), 'chrome-browser');
                    const upd = path_2.default.resolve(udd, 'Default');
                    if (!fs_2.default.existsSync(udd)) {
                        fs_2.default.mkdirSync(udd, { recursive: true });
                    }
                    if (chrome_started) {
                        common_js_1.DEBUG.val && console.log(`Ignoring launch request as chrome already started.`);
                    }
                    const DEFAULT_FLAGS = [
                        '--window-size=1280,800',
                        '--profiling-flush=1',
                        '--enable-aggressive-domstorage-flushing',
                        '--restore-last-session',
                        '--disk-cache-size=2750000000',
                        `--profile-directory="${upd}"`
                    ];
                    chromeNumber += 1;
                    common_js_1.DEBUG.val && console.log(`Chrome Number: ${chromeNumber}, Executing chrome-launcher`);
                    const CHROME_FLAGS = Array.from(DEFAULT_FLAGS);
                    if (!process.env.DEBUG_SKATEBOARD) {
                        CHROME_FLAGS.push('--headless');
                    }
                    else {
                        CHROME_FLAGS.push('--no-sandbox');
                    }
                    if (is_docker_1.default()) {
                        CHROME_FLAGS.push('--remote-debugging-address=0.0.0.0');
                    }
                    if (common_js_1.DEBUG.noAudio) {
                        CHROME_FLAGS.push('--mute-audio');
                    }
                    const CHROME_OPTS = {
                        port,
                        ignoreDefaultFlags: true,
                        handleSIGINT: false,
                        userDataDir: path_2.default.resolve(os_1.default.homedir(), 'chrome-browser'),
                        logLevel: 'verbose',
                        chromeFlags: CHROME_FLAGS
                    };
                    common_js_1.DEBUG.val && console.log(CHROME_OPTS, CHROME_FLAGS);
                    const zomb = await chrome_launcher_js_1.launch(CHROME_OPTS);
                    chrome_started = true;
                    zombies.set(port, zomb);
                    const retVal = {
                        port
                    };
                    process.on('SIGHUP', undoChrome);
                    process.on('SIGUSR1', undoChrome);
                    process.on('SIGTERM', undoChrome);
                    process.on('SIGINT', undoChrome);
                    process.on('beforeExit', undoChrome);
                    return retVal;
                    async function undoChrome() {
                        common_js_1.DEBUG.val && console.log("Undo chrome called");
                        if (!chrome_started)
                            return;
                        chrome_started = false;
                        try {
                            await zomb.kill();
                            process.exit(0);
                        }
                        catch (e) {
                            console.warn("Error on kill chrome on exit", e);
                            process.exit(1);
                        }
                    }
                },
                onDeath(port, func) {
                    let handlers = deathHandlers.get(port);
                    if (!handlers) {
                        handlers = [];
                        deathHandlers.set(port, handlers);
                    }
                    handlers.push(func);
                },
                kill(port) {
                    const zombie = zombies.get(port);
                    common_js_1.DEBUG.val && console.log(`Requesting zombie kill.`);
                    zombie && zombie.kill();
                }
            };
            exports_5("default", launcher_api);
        }
    };
});
System.register("zombie-lord/screenShots", ["common", "sharp"], function (exports_6, context_6) {
    "use strict";
    var common_js_2, sharp_1, MAX_FRAMES, MIN_TIME_BETWEEN_SHOTS, MIN_TIME_BETWEEN_TAIL_SHOTS, MAX_TIME_BETWEEN_TAIL_SHOTS, NOIMAGE, KEYS, WEBP_FORMAT, SAFARI_FORMAT, SAFARI_SHOT, WEBP_SHOT, WEBP_OPTS;
    var __moduleName = context_6 && context_6.id;
    function makeCamera(connection) {
        let shooting = false;
        let frameId = 1;
        let lastHash;
        let lastShot = Date.now();
        let nextShot;
        let tailShot, tailShotDelay = MIN_TIME_BETWEEN_TAIL_SHOTS;
        const nextTailShot = () => {
            common_js_2.DEBUG.shotDebug && console.log("Tail shot");
            doShot();
            tailShotDelay *= 1.618;
            if (tailShotDelay < MAX_TIME_BETWEEN_TAIL_SHOTS) {
                if (tailShot) {
                    clearTimeout(tailShot);
                }
                tailShot = setTimeout(nextTailShot, tailShotDelay);
            }
            else {
                tailShotDelay = MIN_TIME_BETWEEN_TAIL_SHOTS;
                tailShot = false;
            }
        };
        return { queueTailShot, doShot };
        function queueTailShot() {
            if (tailShot) {
                clearTimeout(tailShot);
                tailShotDelay = MIN_TIME_BETWEEN_TAIL_SHOTS;
                tailShot = false;
            }
            tailShot = setTimeout(nextTailShot, tailShotDelay);
        }
        async function shot() {
            if (common_js_2.DEBUG.noShot)
                return NOIMAGE;
            const timeNow = Date.now();
            const dur = timeNow - lastShot;
            if (dur < MIN_TIME_BETWEEN_SHOTS) {
                if (common_js_2.DEBUG.shotDebug && common_js_2.DEBUG.val > common_js_2.DEBUG.low) {
                    console.log(`Dropping as duration (${dur}) too short.`);
                }
                return NOIMAGE;
            }
            if (common_js_2.DEBUG.shotDebug && common_js_2.DEBUG.val > common_js_2.DEBUG.low) {
                console.log(`Do shot ${dur}ms`);
            }
            const targetId = connection.sessions.get(connection.sessionId);
            let response;
            const ShotCommand = (connection.isSafari || connection.isFirefox ? SAFARI_SHOT : WEBP_SHOT).command;
            common_js_2.DEBUG.val > common_js_2.DEBUG.high && console.log(`XCHK screenShot.js (${ShotCommand.name}) call response`, ShotCommand, response ? JSON.stringify(response).slice(0, 140) : response);
            response = await connection.sessionSend(ShotCommand);
            lastShot = timeNow;
            response = response || {};
            const { data, screenshotData } = response;
            frameId++;
            if (!!data || !!screenshotData) {
                const img = data || screenshotData;
                const F = { img, frame: frameId, targetId };
                F.hash = `${F.img.length}${KEYS.map(k => F.img[k]).join('')}${F.img[F.img.length - 1]}`;
                if (lastHash == F.hash) {
                    if (common_js_2.DEBUG.shotDebug && common_js_2.DEBUG.val > common_js_2.DEBUG.low) {
                        console.log(`Dropping as image did not change.`);
                    }
                    return NOIMAGE;
                }
                else {
                    lastHash = F.hash;
                    await forExport({ frame: F, connection });
                    return F;
                }
            }
            else {
                common_js_2.DEBUG.val > common_js_2.DEBUG.med && console.log("Sending no frame");
                if (common_js_2.DEBUG.shotDebug && common_js_2.DEBUG.val > common_js_2.DEBUG.low) {
                    console.log(`Dropping as shot produced no data.`);
                }
                return NOIMAGE;
            }
        }
        async function saveShot() {
            const F = await shot();
            if (F.img) {
                connection.frameBuffer.push(F);
                while (connection.frameBuffer.length > MAX_FRAMES) {
                    connection.frameBuffer.shift();
                }
            }
            queueTailShot();
            common_js_2.DEBUG.val > common_js_2.DEBUG.high && console.log({ framesWaiting: connection.frameBuffer.length, now: Date.now() });
        }
        async function doShot() {
            if (nextShot || shooting)
                return;
            shooting = true;
            await saveShot();
            nextShot = setTimeout(() => nextShot = false, MIN_TIME_BETWEEN_SHOTS);
            shooting = false;
        }
    }
    exports_6("makeCamera", makeCamera);
    async function forExport({ frame, connection }) {
        let { img } = frame;
        // FIXME : CPU issues
        img = Buffer.from(img, 'base64');
        if (!connection.isSafari) {
            img = await sharp_1.default(img).webp(WEBP_OPTS).toBuffer();
        }
        img = img.toString('base64');
        frame.img = img;
        return frame;
    }
    exports_6("forExport", forExport);
    return {
        setters: [
            function (common_js_2_1) {
                common_js_2 = common_js_2_1;
            },
            function (sharp_1_1) {
                sharp_1 = sharp_1_1;
            }
        ],
        execute: function () {
            MAX_FRAMES = 3; /* 1, 2, 4 */
            MIN_TIME_BETWEEN_SHOTS = 150; /* 20, 40, 100, 250, 500 */
            MIN_TIME_BETWEEN_TAIL_SHOTS = 250;
            MAX_TIME_BETWEEN_TAIL_SHOTS = 3000;
            NOIMAGE = { img: '', frame: 0 };
            KEYS = [
                1, 11, 13, 629, 1229, 2046, 17912, 37953, 92194, 151840
            ];
            // image formats for capture depend on what the client can accept
            WEBP_FORMAT = {
                format: "png"
            };
            SAFARI_FORMAT = {
                format: "jpeg",
                quality: 35 /* 25, 50, 80, 90, 100 */
            };
            SAFARI_SHOT = {
                command: {
                    name: common_js_2.DEBUG.legacyShots ? "Page.captureScreenshot" : "HeadlessExperimental.beginFrame",
                    params: common_js_2.DEBUG.legacyShots ? SAFARI_FORMAT : {
                        interval: MIN_TIME_BETWEEN_SHOTS,
                        screenshot: SAFARI_FORMAT
                    }
                }
            };
            WEBP_SHOT = {
                command: {
                    name: common_js_2.DEBUG.legacyShots ? "Page.captureScreenshot" : "HeadlessExperimental.beginFrame",
                    params: common_js_2.DEBUG.legacyShots ? WEBP_FORMAT : {
                        interval: MIN_TIME_BETWEEN_SHOTS,
                        screenshot: WEBP_FORMAT
                    }
                }
            };
            WEBP_OPTS = {
                quality: 42,
            };
        }
    };
});
System.register("zombie-lord/adblocking/blocking", [], function (exports_7, context_7) {
    "use strict";
    var BLOCKING;
    var __moduleName = context_7 && context_7.id;
    return {
        setters: [],
        execute: function () {
            BLOCKING = [
                // Privacy (13 Aug 2017 22:41 UTC)
                /^file:/,
                /(?:^|\.)(?:0(?:emm|stats|tracker)|1(?:0(?:3bees|5app)|1nux|2(?:3co(?:mpteur|unt)|mnkys)|-cl0ud|freecounter|pel)|2(?:0(?:0summit|6solutions)|1sme|4(?:7(?:-inc|ilabs)|businessnews|counter|log))|3(?:3across|60(?:tag|i)|d(?:live)?stats)|4(?:0nuggets|4-trk-srv|oney)|5(?:1(?:network|yes)|5labs)|6ldu6qa|7(?:7tracking|bpeople)|88infra-strat|99(?:c(?:lick|ounters)|stats)|a(?:013|-counters|a(?:ddzz|msitecertifier|n\.amazon)|b(?:c(?:ompteur|stats)|lsrv|trcking)|c(?:c(?:e(?:ptableserver|ssintel)|umulatorg)|e(?:counter|trk|xedge)|s86|t(?:i(?:onallocator|ve(?:-trk7|conversion|meter|prospects|tracker\.activehotels))|nx)|xiom(?:-online|apac))|d(?:-score|alyser|blade|chem(?:ix|y-content|y)|d(?:freestats|lvr)|e(?:lixir|mails)|greed|insight|ku|m(?:antx|itad|other)|o(?:be(?:dtm|tag)|ftheyear)|pies|r(?:izer|ta)|s(?:e(?:nsedetective|ttings)|kom|psp|ymptotic)|t(?:hletic|lgc|raction)|ultblogtoplist|v(?:anced-web-analytics|conversion)|xvip|yapper)|f(?:airweb|fi(?:liates-pro|n(?:esystems|itymatrix)|stats))|g(?:entinteractive|ilecrm|kn)|headday|i(?:mediagroup|r(?:2s|pr))|k(?:anoo|stat)|l(?:c(?:mpn|vid)|e(?:nty|xa(?:cdn|metrics))|kemics|ltracked|ta(?:bold1|stat)|venda|zexa)|m(?:a(?:desa|valet|zingcounters)|bercrow|i(?:kay|lliamilli)|plitude|xdt)|n(?:a(?:l(?:oganalytics|yt(?:ics(?:-egain|wizard)|k))|metrix|tid3)|d(?:againanotherthing|roid\.mobile\.linksynergy|y(?:etanotherthing|hoppe))|exia-it|g(?:elfishstats|orch-cdr7|srvr)|onymousdmp|swerscloud|tvoice|xiousapples)|p(?:ex(?:stats|two)|ollofind|pboycdn|rt[nx])|qtracker|r(?:c(?:adeweb|h-nicto)|ianelab|kayne|lime|p(?:uonline|xs)|rowpushengine|turtrack)|s(?:soctrac|tro-way)|t(?:atus|o(?:shonetwork|ut\.email-match)|raxio|t(?:icwicket|racta))|u(?:d(?:ien(?:ce(?:\.visiblemeasures|amplify|iq|rate)|s)|rte|sp|td)|t(?:horinsights|o(?:-ping|a(?:ffiliatenetwork|udience)|id)))|v(?:a(?:ntlink|stats)|enseo|mws)|w(?:asete|esomelytics|in1|seukpi\.whisbi|zbijw)|xiomaticalley|z(?:alead|era-s014))|b(?:1(?:img|js)|2c|a(?:bator|ifendian|lancebreath|m-x|ptisttop1000|sicstat)|e(?:a(?:con(?:2\.indieclicktv|\.kmi-us)|nst(?:alkdata|ock))|bj|e(?:ftransmission|mrdwn|ncounter)|havioralengine|lstat|nchit|rg-6-82|sucherzahlen|target)|foleyinteractive|i(?:dderrtb|g(?:cattracks|mining|tracker)|kepasture|onicclick|z(?:ible|o))|k(?:rtx|vtrack)|l(?:izzardcheck|o(?:ckmetrics|g(?:104|-stat|counter|meetsbrand|patrol|r(?:ankers|eaderproject)|s(?:counter|ontop)|toplist))|ue(?:cava|kai)|vdstatus)|m(?:23|324|lmedia|metrix)|o(?:omtrain|ts(?:canner|visit)|unce(?:exchange|x))|pmonline|r(?:cdn|i(?:dgevine|ghtedge|lig)|onto|srvr)|stn-14-ma|t(?:buckets|static|t(?:rack|tag))|u(?:bblestat|g(?:herd|snag)|mlam|rstbeacon|siness\.sharedcount|x1le001)|ytemgdd)|c(?:1exchange|3(?:metrics|tag)|-o-u-n-t|\.adroll|a(?:dreon|l(?:l(?:ingjustified|measurement|rail|track(?:ingmetric)?s)|otag)|mpaigncog|n(?:alstat|ddi|opylabs)|p(?:hyon-analytics|turly)|s(?:h(?:burners|count)|ualstat))|c(?:cpmo|rtvi)|dntrf|e(?:dexis|lebr(?:os-analytic|u)s|ntraltag|rtifica|trk)|f(?:ormanalytics|track)|h(?:a(?:nnelintelligence|rt(?:aca|beat))|eezburger-analytics|ickensaladandads|r(?:ist(?:iantop1000|malicious)|umedia))|i(?:nt|rcular-counters)|l(?:ari(?:fyingquack|ty(?:ray|tag))|e(?:a(?:nanalytic|rviewstat)s|v(?:eritics|i))|i(?:ck(?:2meter|-(?:linking|url)|a(?:id|lyz)er|d(?:ensity|imensions)|ening|forensics|inc|m(?:anage|eter)|pathmedia|report|s(?:agen|hif)t|t(?:hru\.lefbc|rack[1s])|zs)|ent\.tahono|x(?:count|py))|oud(?:-(?:exploration|iq)|tracer101)|u(?:bcollector|strmaps))|m(?:core|meglobal|ptch)|n(?:etcontentsolutions|xweb|zz)|o(?:gnitivematch|ll(?:1onf|arity|serve)|m(?:mander1|p(?:any-target|teur(?:-(?:fr|visite))?)|radepony)|n(?:firm(?:ational|it)|sciouscabbage|t(?:a(?:ctmonkey|dor(?:gratis|visitasgratis|web)|toreaccessi)|e(?:ntinsights|xtly)|inue|rol\.cityofcairns)|ver(?:getrack|sion(?:fly|ly|ruler)|t(?:experiments|global|ro)))|oladata|p(?:peregg|ycarpenter)|r(?:e(?:-cen-54|m(?:etric|otive)s)|mce)|st1action|unt(?:by|er(?:-gratis|bot|central|geo|land|s(?:4u|ervis|forlife)|tracker)|his|ing4free|omat|z))|pcmanager|q(?:counter|uotient)|r(?:-nielsen|\.loszona|a(?:ftkeys|shfootwork|zyegg)|iteo|mmetrixwris|o(?:sswalkmail|wd(?:s(?:cience|kout)|twist))|sspxl)|s(?:bew|data1|i-tracking|s\.aliyun)|t(?:\.(?:itbusinessedge|thegear-box)|nsnet|s(?:-(?:log|secure)\.channelintelligenc|\.(?:businesswir|channelintelligenc))e|tracking02)|u(?:ntador|ralate|stomer(?:conversio|discoverytrack))|xense|y(?:bermonitor|toclause))|d(?:-stats|a(?:counter|ilycaller-alerts|pxl|t(?:a(?:\.(?:beyond|imakenews|marketgid)|brain|caciques|feedfile|performa|xpand|m)|vantage)|yl(?:ife-analytic|og)s)|c(?:-storm|\.tremormedia)|e(?:17a|cideinteractive|epattention|javu\.mlapps|legatediscussion|mand(?:base|media\.s3\.amazonaws)|p-x|tectdiscovery|v(?:atics|ice9))|gmsearchlab|i(?:alogtech|d-?it|e-rankliste|ffusion-tracker|git(?:al(?:-metric|optout)|s)|mestore|nkstat|rectrdr|s(?:cover-path|playmarketplace|t(?:iltag|r(?:alytics|ibeo)))|volution)|jers|lrowehtfodne|m(?:analytics1|d53|p(?:counter|xs)|tr(?:acker|y))|o(?:clix|modomain|tomi|ubleverify)|ps-reach|s(?:mmadvantage|p(?:arking|ly))|t(?:c-v6t|i-ranker|scout)|u(?:mmy-domain-do-not-change|rocount)|win[12]|yn(?:atracesaas|trk))|e(?:-(?:kaiseki|referrer|zeeinternet)|\.funnymel|a(?:rnitup|sy(?:-hit-counters|counter|hitcounters))|btrk1|c(?:-(?:optimizer|track)|n5|ommstats(?:\.s3\.amazonaws)?|sanalytics|ustomeropinions)|d(?:ge\.bredg|igitalsurvey|w\.insideline)|jyymghi|kmpinpoint|l(?:a(?:-3-tn|sticbeanstal)k|ectusdigital|it(?:e-s001|ics)|oqua)|m(?:a(?:il(?:-(?:match|reflex)|retargeting)|rbox)|beddedanalytics|ediatrack|jcd|ltrk)|n(?:ecto(?:analytics)?|g(?:ag(?:e(?:master|ya)|io)|ine(?:212|64))|hance|quisite|sighten|t(?:er-system|icelabs))|p(?:erfectdata|i(?:lot|odata|track)|roof)|reportz|s(?:earchvision|omniture|ta(?:disticasgratis|ra|t))|t(?:ahub|h(?:erealhakai|nio)|r(?:acker|igue)|yper)|u(?:-survey|ro(?:counter|pagerank))|v(?:anetpro|e(?:nt(?:\.loyalty\.bigdoor|optimize|s\.launchdarkly|tracker\.videostrip)|rgage)|isit(?:analyst|cs2?)|olvemediametrics)|web(?:analytics|counter)|x(?:actag|clusiveclicks|elator|it(?:intel|monitor)|ovueplatform|p(?:lore-123|osebox)|t(?:ole|reme-dm))|yein|zytrack)|f(?:a(?:bricww|ctortg|llingfalcon|miliarfloor|n(?:dommetrics|playr)|rmer\.wego|st(?:analytic|ly-analytics|onlineusers|webcounter)|thomseo)|bgdc|e(?:arfulflag|ed(?:ji|perfec)t|tchback)|i(?:ksu|litrac|n(?:alid|derlocator)|shhoo|tanalytics|xcounter)|l(?:a(?:gcounter|kyfeast|sh(?:-(?:counter|stat)|adengine|gamestats))|counter|ix(?:360|car|facts)|u(?:ctuo|encymedia|idsurveys|rry)|x(?:pxl|1)|yingpt)|o(?:gl1onf|llowercounter|otprint(?:dns|live)|r(?:e(?:nsics1000|seeresults)|kcdn|m(?:alyzer|isimo)|t(?:er|vision))|undry42)|prnt|q(?:secure|tag)|r(?:ailoffer|e(?:e(?:-(?:counter|website-(?:hit-counter|statistic)s)|bloghitcounter|counter(?:code|stat)|logs|onlineusers|s(?:itemapgenerator|tats)|usersonline|weblogger)|s(?:coerspica|h(?:counter|plum)))|iendbuy|osmo|uitflan)|shka|tbpro|u(?:eldeck|getech|n(?:-hits|neld|stage)|se(?:-data|stats))|yreball)|g(?:botvisit|e(?:istm|mtrackers|o(?:bytes|co(?:mpteur|ntatore)|riot)|t(?:b(?:ackstory|lueshift)|clicky|drip|freeb(?:acklinks|l)|response|smart(?:content|look)))|i(?:ddycoa|gcoun)t|l(?:anceguide|btracker|ob(?:ase|etrackr))|o(?:-stats\.dlinkddns|\.toutapp|dhat|ingup|ldstats|neviral|ogleadservices|pjn|rgeousground|s(?:quared|tats)|urmetads|vmetric|yavelab)|r(?:a(?:ph(?:effect|insider)|vity4?)|eyinstrument|idsum(?:dissector)?|o(?:undspeak|wingio))|secondscreen|t(?:cslt-di2|opstats)|u-pix\.appspot|visit|weini)|h(?:4k5|a(?:l(?:ldata|stats)|mmerhearing|veamint|ymarket)|e(?:a(?:ls\.msgfocu|panalytic)s|llosherpa|ntaicounter|tchi|xagon-analytics|ystaks)|i(?:conversion|gh(?:erengine|metrics)|lariouszinc|perstat|stats|t(?:2map|-(?:count(?:er-download|s)|parade)|box|counters(?:online|tats)|farm|matic|s(?:2u|l(?:ink|og)|niffer|processor)|t(?:ail|racker)|w(?:ake|ebcounter)))|lserve|m\.baidu|o(?:mechader|st-tracker|t(?:-count|dogsandads|jar))|qhrt|strck|u(?:b(?:rus|spot)|manclick|n(?:kal|t-leads)|rra)|wpub|xtrack|y(?:fntrak|pe(?:ractivate|stat)))|i(?:-stats|b(?:-ibi|illboard|pxl)|c(?:-live|live|s0)|d(?:-visitors|targeting)|esnare|factz|ivt|l(?:jmp|lumenix|ogbox)|m(?:a(?:gedoll|nginatium)|manalytics|p(?:\.(?:affiliator|c(?:lickability|onstantcontact))|counter|ortedincrease)|rtrack)|n(?:audium|boxtag|d(?:ex(?:stat|tool)s|icia)|eedhits|f(?:erclick|inigraph|lectionpointmedia)|no(?:mdc|vateads)|p(?:honic|ref(?:\.s3\.amazonaws)?|wrd)|s(?:i(?:de-graph|g(?:ht(?:\.mintel|era|grit)|it)|temetrics)|pectlet|t(?:apage|reamatic))|t(?:e(?:gritystat|l(?:evance|imet|li(?:-(?:direct|tracker)|ad-tracking|gencefocus))|r(?:ceptum|gient|mundomedia|stateanalytics|vigil))|rastats)|v(?:i(?:sioncloudstats|temedia)|odo))|os\.mobile\.linksynergy|p(?:2(?:location|map|phrase)|-a(?:dress|pi)|addresslabs|catch|erceptions|f(?:ingerprint|rom)|in(?:fodb|you)|locationtools|ro|stat)|qfp1|rs09|st(?:-t)?rack|t(?:alianadirectory|rac(?:ker(?:360|pro)|mediav4))|w(?:ebtrack|stats)|xiaa|zea(?:ranks)?)|j(?:anrain|brlsr|doqocy|ewelcheese|i(?:ankongbao|mdo-stats|rafe)|otform|s(?:counter|onip|tracker)|u(?:mptime|stuno)|wmstats)|k(?:-analytix|am(?:eleoon|pyle)|ey(?:ade|word(?:-match|max)|xel)|i(?:eden|ss(?:metrics|testing))|l(?:ert|ldabck)|o(?:mtrack|psil|stenlose-counter)|qzyfj|syrium0014)|l(?:2\.visiblemeasures|\.fairblocker|a(?:n(?:dingpg|srv030)|s(?:agneandands|erstat))|ct\.salesforce|e(?:ad(?:-(?:123|converter)|for(?:ce1|ensics|mix)|i(?:um|[dn])|life|managerfx|s(?:ius|rx)|zu)|g(?:enhit|olas-media)|ntainform|s-experts|tterboxtrail|vexis|xity)|i(?:adm|bstat|jit|n(?:ezing|k(?:-smart|\.huffingtonpost|connector|pulse|synergy|xchanger))|strakbi|ves(?:egmentservice|tat)|zardslaugh)|loogg|o(?:calytics|g(?:\.kukuplay|aholic|counter|dy|entries|gly|sss|ua)|o(?:kery|p11)|pley|sstrack)|p(?:beta|orirxe)|sfinteractive|u(?:c(?:idel|kyorange)|minate|xup(?:adva|cdn[ac]))|xtrack|y(?:pn|tiks))|m(?:1ll1c4n0|-pathy|\.addthisedge|a(?:baya|candcheeseandads|g(?:iq|nify360)|p(?:loco|myuser)|r(?:insm|k(?:et(?:015|2lead|izator)|itondemand)|tianstats|yneallynndyl)|ster(?:stats|tag\.effiliation)|th(?:eranalytics|tag)|xymiser)|b(?:4a|-srv|otvisit|ww)|dotlabs|e(?:a(?:surem(?:ap|entapi)|tballsandads)|di(?:a(?:armor|bong|forgews|gauge|plex|rithmics|seeding|v)|ego)|ga-stats|latstat|mecounter|rc(?:adoclics|ent)|t(?:a(?:keyproduc|lyz)er|e(?:orsolutions|ring\.pagesuite)|ri(?:csdirect|go))|yersdalebixby|zzobit)|i(?:a(?:lbj6|ozhen)|c(?:odigo|pn)|das-i|llioncounter|xpanel)|kt(?:3261|941|oresp)|l(?:314|click|etracker|no6|stat)|m(?:ccint|i-agency|stat|tro)|o(?:bify|chibot|n(?:goosemetric|iti)s|trixi|use(?:3k|flow|stats|trace)|vable-ink-6710|wfruit)|plxtms|s(?:g(?:app|tag)|parktrk)|t(?:racking|s\.mansion)|ucocutaneousmyrmecophaga|v(?:ilivestats|tracker)|xpnl|y(?:affiliateprogram|bloglog|fastcounter|n(?:ewcounter|telligence)|omnistar|r(?:eferer|oitracking)|s(?:coop-tracking\.googlecode|eostats|ocialpixel)|tictac|usersonline))|n(?:a(?:ayna|look|t(?:pal|uraltracking)|v(?:dmp|egg|ilytics)|ytev)|df81|e(?:atstats|dstat|pohita|rfherdersolo|stedmedia|t(?:-filter|applications|clickstats|m(?:ini)?ng|ratings)|w(?:relic|scurve|trackmedia)|x(?:eps|tstat))|ga(?:cm|static)|i(?:cewii|ftymaps|nestats)|o(?:nxt1\.c\.youtube|owho|rdicresearch|tifyvisitors|vately|winteract)|prove|stracking|u(?:conomy|datasecurity|loox)|y(?:ctrl32|tlog))|o(?:adz|bserverapp|ctopart-analytics|d(?:\.visiblemeasures|esaconflate|oscope)|ffer(?:matica|s(?:\.keynote|trategy))|hmystats|idah|ktopost|m(?:arsys|e(?:tri|d)a|g(?:pm|uk)|iki)|n(?:e(?:link-translations|stat|tag-sys)|gsono|line-media-stats)|p(?:bandit|en(?:click|hit|venue|xtracker)|roi|t(?:i(?:m(?:ahub|izely(?:\.appspot)?|ost)|n-machine)|orb))|r(?:anges88|capia|g-dot-com|ts\.wixawin)|s(?:-data|itracker)|t(?:oshiana|racking)|urnet-analytics|verstat|wldata|xidy)|p(?:0\.raasnet|-td|\.raasnet|a(?:-oa|ge(?:fair|rankfree)|idstats|r(?:dot|klogic|rable)|ss-1234|thful)|c(?:licks|speedup)|e(?:erius|r(?:centmobile|f(?:drive|ectaudience|iliate|orm(?:ancerevenues|tracking))|ion|mutive|r\.h-cdn|s(?:ianstat|onyze))|t(?:ametrics|iteumbrella))|f\.aclst|h(?:antom\.nudgespot|o(?:n(?:e-an)?alytics|tographpan)|pstat)|i(?:-stats|ckzor|etexture|kzor|ng(?:-fast|agenow|il|omatic)|p(?:fire|pio)|x(?:\.speedbit|analytics|el(?:\.(?:parsely|xmladfeed)|eze|interactivemedia|revenue|s(?:\.youknowbes|nippe)t)|imedia)|zzaandads)|j(?:atr|tra)|l(?:a(?:cemypixel|tform(?:municatorcorp|panda))|e(?:cki|isty|xop))|m14|ntr(?:ac|[as])|o(?:intomatic|larmobile|psample|r(?:ngraph|tfold)|st(?:affiliatepro|clickmarketing)|wercount)|r(?:-chart|e(?:cisioncounter|dictivedna)|o(?:clivitysystems|ductsup|ext|file(?:rtracking3|snitch)|j(?:ect(?:haile|sunblock)|op\.dnsalias)|motionengine|ofpositivemedia|specteye|v(?:enpixel|idence\.voxmedia))|tracker)|s(?:tat|yma-statistic)s|t(?:engine|mind|o-slb-09|p123|rk-wn)|u(?:bli(?:cidees|sh(?:\.pizzazzemail|flow))|ffyloss|l(?:leymarketing|se(?:log|maps))|re(?:airhits|video)|tags))|q(?:-counter|bop|dtracking|oijertneio|sstats|u(?:a(?:intcan|ltrics|nt(?:count|ummetric))|bitproducts|est(?:ionpro|radeaffiliates)|i(?:llion|ntelligence))|zlog)|r(?:24-tech|a(?:\.linksynergy|d(?:ar(?:stats|url)|iomanlibya)|mp(?:anel|metrics)|nk(?:-(?:hits|power)|in(?:gpartner|teractive))|pidcounter|venjs)|e(?:a(?:c(?:h(?:force|socket)|tful)|d(?:ertracking|notify)|l(?:counters|t(?:imeplease|racker)))|coset|d(?:i(?:r\.widdit|stats)|statcounter)|edge|f(?:er(?:forex|lytics|sion)|inedads|tagger)|l(?:ead|iablecounter|maxtop)|marketstats|p(?:0pkgr|orting\.reactlite)|s(?:-x|ea(?:rch(?:-(?:artisan|tool)|intel)|u-pub)|on8|ponsetap)|targetly|v(?:enue(?:pilot|science)|olvermaps)|wardtv|ztrack)|f(?:ihub|r-69)|hinoseo|i(?:astats|ch(?:ard-group|metrics|relevance)|ghtstats|t(?:ecounter|ogaga|zykey))|k(?:dms|tu)|lcdn|mtag|n(?:engage|g-snp-003|labs)|o(?:i(?:-pro|s(?:ervice|py)|testing|vista)|llingcounters)|pdtrk|rimpl|svpgenius|t(?:bauction|rk)|u(?:m(?:analytics|pelstiltskinhead)|4)|ztrkr)|s(?:-vop\.sundaysky|a(?:dv\.dadapro|getrc|jari|le(?:cycle|sgenius)|mbaads|pha|revtop|s15k01|yyac|s)|bdtds|c(?:a(?:ledb|rabresearch|stnet)|hoolyeargo|i(?:encerevenu|ntillatingspac)e|o(?:recardresearch|ut\.haymarketmedia)|rip(?:pscontroller|t(?:il|s(?:21|head)))|upio)|ddan|e(?:a(?:-nov-1|rch(?:feed|ignite|plow))|cure(?:-pixel|\.ifbyphone|paths)|dotracker|e(?:dtag|hits|why)|gment(?:-analytics|ify)?|l(?:aris|ectivesummer|ipuquoe|l(?:ebrity|points))|m(?:a(?:nticverses|text)|iocast)|p(?:aratesilver|yra)|r(?:ious-partners|v(?:estats|ing(?:-sys|pps|trkid)|ustats))|ssioncam|x(?:counter|ystat))|f14g|h(?:a(?:llowschool|r(?:e(?:asale|dcount)|p(?:patch|spring)))|elterstraw|i(?:nystat|ppinginsights)|o(?:elace|ptimally|wroomlogic)|rinktheweb)|i(?:bulla|ftscience|g(?:\.gamerdna|nup-way)|lverpop|mpl(?:e(?:hitcounter|reach)|ymeasured)|nglefeed|te(?:24x7rum|apps|bro|compass|improve(?:analytics)?|linktrack|meter|stat|t(?:istik|racker)))|k(?:imresources|yglue)|l(?:-ct5|ingpic)|m(?:a(?:llseotools|rt(?:-d(?:igital-solutions|mp)|ctr|zonessva))|fsvc|rtlnks)|n(?:aps\.vidiemi|iphub|o(?:obi|wsignal))|o(?:c(?:dm|ia(?:lprofitmachine|plus)|ketanalytics)|doit|flopxl|jern|krati|metrics|phus3)|p(?:amanalyst|e(?:cialstat|ed(?:-trap|curve))|ider-mich|klw|l(?:ittag|urgi|yt)|n-twr-14|o(?:nsored|t(?:mx|tysense))|ring(?:metrics|serve)|tag[123]?|urioussteam|y(?:log|words))|quidanalytics|rv(?:1010elan|trck)|t(?:a(?:ck-sonar|dsvc|r-cntr-5|t(?:-well|count(?:er(?:free)?)?|h(?:at|ound)|i(?:c\.parsely|st(?:i(?:c(?:he-(?:free|web)|s\.m0lxcdn\.kukuplay)|q)|x))|owl|s(?:4(?:all|you)|adv\.dadapro|event|forever|i(?:mg|nsight|t)|machine|rely|sheet|wave|w)|t(?:ooz|rax)|u(?:ncore|scake|n)))|c(?:llctrs|ounter)|e(?:elhousemedia|llaservice)|ippleit|or(?:esurprise|m(?:containertag|iq))|rivesidewalk)|u(?:b(?:2tech|traxion)|ddensidewalk|garcurtain|m(?:mitemarketinganalytics|o(?:logic|me))|ndaysky|per(?:counter|stat)s|r(?:f(?:counters|ertracker)|v(?:ey(?:scout|w(?:all-api\.survata|riter))|icate)))|v(?:r-prc-01|trd)|w(?:fstats|iss-counter|oopgrid)|xtracking|y(?:nergy-(?:sync|e)|somos))|t(?:-analytics|\.(?:d(?:evnet|gm-au)|powerreviews)|a(?:g(?:4arm|c(?:dn|ommander)|ifydiageo|srvcs)|iltarget|mgrt|nx|p(?:filiate|lytics|stream)|rgetfuel)|cimg|d(?:573|stats)|e(?:aliumiq|dioustooth|l(?:ize|laparts?)|mnos|ndatta|rabytemedia|t(?:igi|oolbox))|h(?:e(?:a(?:dex|gency)|b(?:estlinks|righttag)|counter|freehitcounter|hairofcaptainpicard|rmstats|specialsearch)|i(?:ngswontend|sisa(?:nother)?coolthing))|i(?:cklesign|nycounter|soomi-services|tag)|kqlhce|l813|m(?:1-001|pjmp|vtp)|nctrx|o(?:monline-inc|p(?:10(?:0(?:blogger|webshop)|sportsite)s|-bloggers|blog(?:area|ging)|depo|malaysia|ofblogs|s(?:em|tat))|r(?:bit|o-tags)|uchclarity)|r(?:a(?:ce(?:-2000|\.qq|lytics|works)|dedoubler|f(?:fikcntr|it)|il(?:-web|headapp)|k(?:ksocial\.googlecode|zor)|versedlp)|b(?:na|o)|e(?:asuredata|ehousei|nd(?:counter|emon))|gtcdn|igg(?:er(?:edmessaging|tag\.gorillanation)|it)|k(?:\.pswec|jmp|lnks|srv44)|u(?:conversion|optik|thfulturn)|y\.abtasty)|s(?:c(?:apeplay|ounter)|k[45]|t14netreal|w0)|twbs\.channelintelligence|urn|wcount|y(?:nt|xo))|u(?:5e|a(?:dx|rating)|bertags|ciservice|gdturner|hygtf1|mbel|n(?:i(?:caondemand|versaltrackingcontainer)|knowntray)|p(?:-rank|t(?:imeviewer|olike|racs))|r(?:iuridfg|l(?:brie|sel)f)|s(?:abil(?:itytools|la)|er(?:cycle|d(?:ive|mp)|look|onlinecounter|report|s-api|zoom)|uarios-online)|zrating)|v(?:12group|a(?:laffiliates|maker)|banalytics|d(?:na-assets|oing)|e(?:duy|i(?:lle-referencement|nteractive)|laro|ntivmedia|r(?:t(?:icals(?:cope|earchworks)|ster)|ypopularwebsite))|i(?:deostat|glink|n(?:lens|ub)|r(?:alninjas|ool)|s(?:i(?:b(?:ility-stats|l(?:emeasures|i))|oncriticalpanels|stat|t(?:or(?:-track|globe|inspector|js|p(?:ath|rofiler)|tracklog|ville)|streamer))|ual(?:dna(?:-stats)?|revenue|websiteoptimizer))|v(?:istats|ocha)|zu(?:ry)?)|m(?:5apis|m(?:-satellite[12]|pxl)|trk)|o(?:icefive|odooalerts|tistics)|unetotbe)|w(?:3counter|a(?:framedia9|tch\.teroti)|e(?:b(?:-(?:stat|visor)|c(?:are\.byside|ompteur)|dissector|engage|flowmetrics|g(?:ains|lstats|ozar)|iqonline|leads-tracker|masterplan|s(?:erviceaward|ite(?:-hit-counters|ceo|onlinecounter|perform|sampling|welcome)|pectator|tats4u)|t(?:r(?:a(?:ffiq|xs)|ends)|una)|visor)|count4u)|h(?:ackedmedia|i(?:sbi|tepixel)|o(?:aremyfriends|isvisiting|s(?:clickingwho|eesyou|on)))|i(?:derplanet|ki(?:a-beacon|odeliv)|shloop)|o(?:nder-ma|opra-ns|rldlogger)|p(?:-stats|dstat)|r(?:ating|edint)|statslive|t(?:-safetag|p101|stats)|under(?:counter|daten)|ww-path|y(?:sistat|wy(?:userservice)?)|zrkt)|x(?:-traceur|\.ligatus|a-counter|clk-integracion|g4ken|hit|iti|l-counti|t(?:great|remline)|xxcounter)|y(?:-track|a(?:manoha|udience)|botvisit|ellowbrix|gsm|i(?:eld(?:bot|ify|software)|gao)|ouramigo)|z(?:a(?:nox|rget)|dtag|e(?:bestof|dwhyex|nlivestats|otap|sep)|irve100|o(?:ntera|om(?:flow|ino)|wary)|roitracker|t(?:-dst|cadx|srv)))\.com$/,
                /(?:^|\.)(?:2(?:cnt|o7)|3(?:60tag|gl)|7eer|8020solutions|a(?:8ww|-pagerank|bmr|c(?:estats|int)|d(?:c(?:-serv|l(?:ear|ickstats))|dcontrol|track\.calls)|gencytradingdesk|mctp|n(?:a(?:ly(?:sistools|tics-engine)|metrix)|rdoezrs)|p(?:icit|pier)|rsdev|udienceinsights|vazudsp|xf8|8)|b(?:a(?:rillianc|ynot)e|btrack|etarget|i(?:dswitch|g(?:mir|stats)|zspring)|l(?:og(?:ranking|tw)|ueconic))|c(?:btrk|cgateway|edexis|h(?:artbeat|eckmypr)|ityua|lick(?:able|c(?:lick|onversion)|tale)|mcintra|n(?:t1|zz)|o(?:gmatch|n(?:tent(?:-square|spread)|ver(?:sionlogic|tmarketing))|pacast|unter(?:-kostenlos|city|views))|r(?:iteo|osspixel|wdcntrl)|ya(?:1t|2))|d(?:1447tq2m68ekg\.cloudfront|21o24qxwf7uku\.cloudfront|3a2okcloueqyx\.cloudfront|e(?:c(?:dna|ibelinsight)|lidatax|mdex|qwas|teql)|i(?:gidip|scovertrail)|o(?:minocounter|tmetrics)|pbolvw|u8783wkf05yr\.cloudfront)|e(?:-(?:pageran|webtrac)k|clampsialemontree|d(?:geadx|t02)|ffectivemeasure|resmas|s(?:m1|track)|u(?:lerian(?:cdn)?|ropuls)|v(?:erest(?:js|tech)|yy)|yeota|zakus)|f(?:eedcat|l(?:ixsyndication|owstats)|re(?:e(?:-counters|geoip|stats)|maks)|uziontech)|g(?:\.delivery|e(?:oplugi|tconversio)n|gxt|lobalwebindex|o-mpulse|rmtech|simedia|tags|u(?:anoo|ruquicks))|h(?:it(?:maze)?-counters|s-analytics|urterkranach)|i(?:bpxl|hstats\.cloudapp|m(?:cht|rk)|n(?:centivesnetwork|dividuad|f(?:inity-tracking|ormz)|stadia|voca)|p(?:-label|count(?:er)?)|yi)|jump-time|k(?:eymetric|it(?:bit|code)|nowledgevine|ontagent|rxd)|l(?:fov|ivehit|o(?:cotrack|gnormal|opfuse)|uckyorange|ypn)|m(?:a(?:gnetmail1|rketo|teti|x(?:track|ymis)er)|e(?:dia(?:bong|partner\.bigpoint)|etrics|gastat)|kt51|m7|o(?:balyzer|n(?:etate|itus))|pwe|stracker|wstats|x(?:cdn|ptint)|y(?:pagerank|stat-in|visualiq))|n(?:e(?:dstat(?:basic|pro)?|t(?:biscuits|graviton))|gmco|pario-inc|r-data|s1p|uggad)|o(?:fferpoint|jrq|mtrdc|n(?:ecount|line-(?:metrix|right-now))|p(?:en(?:stat|tracker)|tify)|spserver)|p(?:\.delivery|ages05|er(?:formanceanalyser|imeterx)|ingdom|lwosvr|m0|pctracking|r(?:edict(?:iveresponse|a)|imetag|nx|oxad)|vmax)|q(?:baka|uick-counter)|r(?:7ls|apid(?:stats|trk)|e(?:altimestatistics|dcounter|edbusiness|invigorate|search|v(?:dn|enuewire|sw))|oi(?:-rocket|tracking)|s6|t(?:fn|mark)|u)|s(?:3s-main|a(?:geanalyst|yyac)|coutanalytics|e(?:arch\.mediatarget|masio|nsic|o(?:-master|parts))|itebro|m(?:art(?:-ip|erremarketer|racker)|ileyhost)|o(?:cialtrack|ftonic-analytics)|p(?:acehits|eedcounter|ring-tns|ycounter)|rpx|tat(?:is(?:fy|ti(?:chegratis|k-gallup))|s(?:advance-01|y))|ubmitnet|vlu|ynthasite)|t(?:\.ymlp275|argetix|cactivity|e(?:lemetrytaxonomy|ntaculos)|hes(?:earchagency|tat)|ns-cs|overy|r(?:a(?:c(?:etracking|k-web)|f(?:ex|iz))|ekmedia|kme|uehits)|ylere)|u(?:apoisk|rl-stats)|v(?:3cdn|antage-media|e(?:pxl1|rtical-leap)|i(?:afoura|s(?:it(?:log|or-analytics)|to1)|zisense)|tracker)|w(?:55c|aplog|cfbc|eb(?:-(?:boosting|counter|stat)|tr(?:affstats|ekk(?:-(?:asia|us))?))|ho(?:aremyfriends|isonline)|isetrack|t-eu02|underloop)|xclaimwords|yoochoose|z(?:ampda|dbb|iyu|oos(?:ne|sof)t|qtk))\.net$/,
                // Advertisement (13 Aug 2017 22:40 UTC)
                /(?:^|\.)(?:0(?:07-gateway|4v70ab|emn|fmm|icep80f|llii0g6|pixl|xwxmj21r75kka)|1(?:0(?:0pour|1m3|3092804|pipsaffiliates|y5gehv)|1(?:00i|c9e55308a)|2(?:3(?:cursors|vidz)|place)|5(?:2media|yomodels)|8(?:00freecams|8server|clicks|naked)|bx4t5c|c(?:cbt|lickdownloads)|empiredirect|loop|nimo|phads|tizer|worldonline|y(?:k851od|me78h))|2(?:0(?:6ads|dollars2surf)|1(?:find|sexturycash)|4(?:7realmedia|ad89fc2690ed9369|x7adservice)|54a|dpt|kurl|leep|p9fyvx|xbpub)|3(?:2b4oilo|3(?:2-d|93)|50media|6(?:0(?:ads(?:track)?|installer|popads|yield)|5sbaffiliates)|7signals|cnce854|l(?:ift|r67y45)|omb|r(?:dads|edlightfix)|t7euflv)|4(?:0xbfzk8|3plc|5i73jv6|8a298f68e0|dsply|uvjosuc|wnet)|5(?:9zs1xei|advertise|clickcashsoftware|dimes|g(?:9quwq|l1x9qc))|6(?:00z|2b70ac32d4614b|7s6gxv28kin|8216c38fb36e0|99fy4ne|a0e2d19ac28)|7(?:50industries|7(?:7(?:-partners?|partners?|seo)|8669)|cxcrejm|insight|pud|search|u8a8i88|vws1j1j)|8(?:3nsdjqqo1cau183xz|7159d7b62fc885|88(?:games|medianetwork|p(?:oker|romos))|baf7ae42000024|ipztcc1)|9(?:7d73lsi|ts3tpia)|a(?:2(?:c653c4d145fa5f96a|gw|pub)|3pub|4(?:33|dtrk)|5(?:a5a|pub)|-s(?:sl\.ligatus|tatic)|\.(?:adroll|ligatus|raasnet|sucksex)|a(?:\.voice2page|dbobwqgmzi|nvxbvkdxph|qpajztftqw|sopqgmzywa|tmytrykqhi)|b(?:4tn|geobalancer|l(?:etomeet|ogica)|outads\.quantcast|s(?:contal|ilf|oluteclickscom|quint)|usedbabysitters|yvhqmfnvih)|c(?:c(?:e(?:lacomm|ss-mc)|ltr|mgr|oun(?:cilist|ts\.pkr)|u(?:mulatork|serveadsystem))|jmkenepeyn|lsqdpgeaik|mexxx|nsavlosahs|r(?:ididae|onym)|t(?:i(?:on(?:desk|locker)|vedancer)|uallysheep)|wswfbyhtsf|xujxzdluum)|d(?:1(?:2[01235789]|3[124])m|2(?:games|up)|4(?:game|partners)|-(?:411|bay|clicks|f(?:eeds|low)|g(?:bn|oi)|indicator|maven|recommend|s(?:ponso|ti)r|u)|a(?:c(?:ado|ts)|gora|pd)|b(?:\.fling|lockwhitelist09[78]|m[ai]|oo(?:st|th)|r(?:au|ite|ook?)|u(?:ddiz|ff|ll|tler|yer))|c(?:a(?:de|sh)|d(?:nx|e)|entriconline|h(?:ap|emical)|lick(?:africa|media|service)|mps|o(?:lo(?:ny)?|n(?:jure|scious))|r(?:ax|on|u))|d(?:aim|bags|elive|i(?:nto|ply)|now|o(?:-mnton|er)|roid|t(?:his|oany)|ynamix)|e(?:cn|dy|lement|n(?:abler|gage)|spresso|x(?:c(?:hangeprediction|ite)|prts?|tent))|f(?:a(?:ctory88|rm\.mediaplex)|click1|eedstrk|o(?:otprints|rg(?:ames|einc))|pkxvaqeyj|r(?:amesrc|ika|ontiers)|u(?:nkyserver|sion|x))|g(?:99|a(?:lax|rdener|temedia)|e(?:ar|nt007)|i(?:la|tize)|o(?:rithms|to|i)|r(?:oups|x))|h(?:e(?:alers|se)|itzads|o(?:od|stingsolutions))|i(?:cate|kteev|m(?:ise|mix|p(?:act|eria|s))|n(?:c(?:on|h)|digo|te(?:nd|rax)|vigorate)|q(?:global|uity)|reland|s(?:fy|n)|t(?:-media|i(?:on|ze)|or))|j(?:al|ector|ourne|u(?:ggler|n(?:gle|ky)|g))|k(?:lip|nowledge|o(?:nekt|va)|2)|l(?:a(?:ndpro|tch)|egend|isher|o(?:aded|oxtracking)|partner|ux)|m(?:a(?:iltiser|mba|n(?:age|media)|xim)|e(?:do|ld|ta|z)|ngronline|ob|pads|tpmp127|ulti|zn)|n(?:anny|e(?:ctar|mo|t(?:work(?:performanc|m)|xchang)e|t)|gin|i(?:gma|mation|um)|o(?:ble|w)|untius|xs(?:id|1)?)|o(?:hana|mik|n(?:ion|ly|news)|p(?:erator|tim)|rika|t(?:ic|mob|omy|ube)|vida)|p(?:a(?:cks|rlor|y)|dx|er(?:fect|iu[mn])|hreak|inion|l(?:ugg|xmd)|oper|pv|r(?:e(?:dictive|mo)|o(?:fit2share|tected|n))|ushup)|qu(?:antix|est3d)|r(?:cdn|e(?:a(?:ctor|dy(?:tractions)?)|c(?:over|reate)|layer|novate|sellers|v(?:enuerescue|ivify|olver))|ocket|unnr)|s(?:2srv|4cheap|-(?:4u|stats|twitter)|a(?:feprotected|lvo|me)|b(?:ookie|rook)|c(?:endmedia|lickingnetwork)|dk|ensecamp|f(?:ast|or(?:allmedia|indians)|u(?:ndi|se))|gangsta|h(?:ack|exa|o(?:pping|st(?:net|view|[12]))|uffle)|i(?:duou|gnal|mili|nimage)s|judo|kpak|l(?:i(?:dango|ngers)|ot|vr)|m(?:arket|oon)|n(?:ative|etworkserver)|o(?:mi|nar|p(?:timal|x)|vo)|p(?:dbl|eed|lex|ruce|ynet)|r(?:ing|v(?:\.(?:bangbros|eacdn)|media))|t(?:argeting|erra|una)|u(?:p(?:ermarket|ply(?:ads|ssl)?)|rve)|v(?:cs|ert|ids)|wam|xgm|zom|p)|t(?:aily|bomthnsyz|dp|e(?:ar|c(?:hus|c)|ractive)|gs|hrive|o(?:add|l(?:ogy[123]|l)|ma(?:fusion)?|nement|o(?:ls(?:2\.ama|\.gossip)kings|x))|pix|r(?:gt|i(?:eval|x)|overt|u(?:ism|e))|w(?:bjs|irl))|u(?:acni|dzlhdjgof|lt(?:3dcomics|-adv|a(?:ccessnow|d(?:media|world))|cam(?:chatfree|free|liveweb)|force|linkexchange|m(?:ediabuying|o(?:da|viegroup))|popunders|sense|t(?:ds|iz))|p-tech|rr)|v(?:777|-plus|a(?:n(?:seads|tage(?:globalmarketing|media))|r(?:kads|d))|e(?:ntor[iy]|r(?:global|igo|keyz|pub|s(?:al(?:display|servers)?|olutions)))|google|i(?:deum|sorded)|m(?:ania|edialtd|d)|points|r(?:edir|tice)|uatianf)|w(?:ebster|hirl|ires|or(?:dsservicapi|kmedia|ldmedia))|x(?:-t|c(?:hg|ore)|i(?:on|te)|market|p(?:ansion|o(?:se|wer))|regie)|yo(?:ulike|z)|z(?:bazar|hub|i(?:ff|ntext)|m(?:edia|ob)|o[nu]k|power|s))|e(?:1a1e258b8b016|esy|ghae5y|robins)|f(?:bfoxmwzlqa|cyhf|d(?:ads|yfxfrwbfy)|edispdljgb|f(?:-(?:jp\.(?:dxlive|exshot)|online)|b(?:ot[1378]|uzzads)|i(?:liat(?:e-(?:gate|robot|b)|ion-(?:france|int))|nit(?:ad|y))|p(?:lanet|ortal-lb\.bevomedia)|track|utdmedia)|gr1|lrm(?:alpha)?|ovelsa|qwfxkjmgwv|ricawin|terdownloads?)|g(?:ain(?:clence|s(?:ca|tei)n)|cdn|entcenters|g(?:ntknflhal|regat(?:eknowledge|orgetb))|mtrk|omwefq|pnzrmptmos|reeableprice|vzvwof|wsneccrbda)|h(?:alogy|kpdnrtjwat|wjxktemuyz|yuzjgukqyd|zybvwdwrhi)|i(?:iaqehoqgrj|m(?:4media|atch)|pmedia|rpush|stilierf|ypulgy)|j(?:aeihzlcwvn|gffcat|illionmax|krls|mggjgrardn|xftwwmlinv)|k(?:1\.imgaft|\.imgaft|a(?:mhd|vita)|oeurmzrqjg|rzgxzjynpi|viqfqbwqqj)|l(?:a(?:dbvddjsxf|rgery|sdzdnfvtj)|chemysocial|fynetwork|g(?:kebjdgafa|o(?:cashmaster|rithmia|vid))|i(?:kelys|mama|promo)|l(?:-about-tech|a(?:bc|dultcash)|eliteads|mt|o(?:sponsor|ydigital)|pass\.salemwebnetwork|sporttv|yes)|p(?:ha(?:bird(?:network)?|godaddy)|inedrct)|t(?:ernativeadverts|hybesr|itude-arena|publi)|vivigqrogq)|m(?:-display|a(?:teur(?:\.amarotic|couplewebcam)|zon(?:-cornerstone|ily))|b(?:aab|qphwf|ra)|d2016|ertazy|gdgt|hpbhyxfgvd|npmitevuxx|obee|p(?:\.rd\.linksynergy|lify\.outbrain|xchange)|qtbshegbqg|tracking01)|n(?:as(?:jdzutdmv|tasia(?:-international|saffiliate))|bkoxl|d(?:ase|omedia(?:group)?)|ge(?:ge|inge|lpastel)|i(?:m(?:e\.jlist|its)|view)|l(?:eqthwxxns|uecyopslm)|nualinternetsurvey|o(?:gjkubvdfe|miely|nymousads|ufpjmkled)|swered-questions|t(?:araimedia|oball|rtrtyzkhw)|umiltrk|wufkjjja|y(?:clip-media|oneregistonmay|pbbervqig|uwksovtwv|xp))|o(?:cular|m(?:inpzhzhwj|vdhxvblfp)|q(?:neyvmaz|viogrwckf)|r(?:ms|pum))|p(?:ester|gjczhgjrka|i\.(?:140proof|flattr|groupon|starsmp)|mebf|p(?:a(?:ds|re(?:de|st))|endad|lebarq|next|ortium|rupt|tap|webview)|r(?:il29-disp-download|omoweb)|smediaagency|vdr|x(?:lv|target)|ycomm)|q(?:drzqsuxxvd|eukceruxzd|lvpnfxrkyf|ornnfwxmua|ryyhyzjveh|uete)|r(?:\.voicefive|a(?:b4eg|gvjeosjdx|lego|wegnvvufy)|cade(?:be|chain)|e(?:-ter|as(?:ins|nap)|youahuman)|ti(?:-mediagroup|culty)|yufuxbmwnb)|s(?:5000|-farm|\.devbridge|afesite|e(?:adnet|cxggulyrf)|hwlrtiazee|iafriendfinder|klots|ldkjflajsdfasdf|ooda|qamasz|rety|s(?:etize|oc-amazon)|terpix)|t(?:a(?:dserve|ufekxogx)r|cyboopajyp|emda|malinks|r(?:esadvertising|insic)|terlocus|wola)|u(?:2m8|ctionnudge|di(?:ence(?:2media|fuel|profiler)|tude)|g(?:renso|ust15download)|nmdhxrco|spipe|t(?:kmgrbdlbj|o(?:-i(?:nsurance-quotes-compare|m)|linkmaker\.itunes\.apple|mateyourlist)))|v(?:al(?:anchers|opaly)|dfcctzwfdk|ercarto|gthreatlabs|rdpbiwvwyt|zkjvbaxgqk)|w(?:a(?:dhtimes|kebottlestudy)|empire|fjqdhcuftd|gyhiupjzvu|ltovhc|mpartners|ogbtinorwx|s(?:-ajax|atstb|clic|mer|urveys)|vrvqxq)|x(?:47mp-xp-21|aggthnkquj|dxmdv|fkfstrbacx|ill)|y(?:boll|jebauqdrys|ozhcgcsyun)|z(?:ads|bdbtsmdocl|ditojzcdkc|e(?:ozrjk|rbazer)|gyzdjexcxg|jmp|kvcgzjsrmk|o(?:ogleads|rbe)|roydhgqcfv|tecash|zvkcavtgwp))|b(?:2c-wsinsight\.crowdfactory|\.sell|a(?:b(?:bnrs|es\.picrush)|ck(?:beatmedia|links)|d(?:ge(?:\.(?:clevergirlscollective|facebook)|s\.(?:alltop|instagram)|ville)|jocks)|f3667dbc6a0bc21e0|goojzsqygg|iaclwdpztd|jofdblygev|kkels|m(?:-bam-slam|b(?:ergerkennanchitinous|oocast))|n(?:ana(?:-splash|flippy)|delcot|man\.isoftmarketing)|ordrid|r(?:g(?:ainpricedude|etbook)|onsoffers)|skodenta|t(?:arsur|igfkcbwpb)|ungarnr|vesinyourface|y(?:pops|vlsmaahou))|b(?:elements|heuxcancwj|jlsdqhpbuqaspgjyxaobmpmzunjnvqmahejnwwvaqbzzqodu|lznptpffqc|o(?:emhlddgju|pkapcgonb)|p(?:-vnh|\.brazzers)|redir-ac-100|uni|zwbxchqgph)|c(?:\.coupons|ash4you|vcmedia)|d(?:afhnltyxlw|ggxjonzbmq|ozkocgkljj|yzewccsqpw)|e(?:a(?:conads|mkite|tchucknorris)|b(?:ufuspldzh|i)|coquin|d(?:orm|sbreath)|e(?:keting|rforthepipl)|f(?:ad|orescenc)e|ghfkrygvxp|h(?:jgnhniasz|ybmunweid)|l(?:amicash|ointeractive|write)|n(?:chmarkingstuff|tdownload)|ringmedia|s(?:ied|t(?:5ex|-zb|casinopartner|f(?:indsite|orexp(?:artners|lmdb))|gameads|h(?:itsnow|olly)|o(?:fferdirect|nlinecoupons)|pr(?:icewala|oducttesters)|ssn))|t(?:3(?:000partner|65affiliate)s|a(?:\.down2crazy|ffs)|oga|rad|ting(?:\.betfair|partners)|weendigital)|wovdhiubnk)|f(?:ast|havmgufvhn|idvcsuazwy)|g(?:arilrzlgez|csojmtgdrv|fgaduyvocz|itczbd|mtracker|pxrwjrbsjb|uaeoakgmrw)|h(?:c(?:pmowwxwbv|umsc)|ejerqgrtlq|jhijisulwl|mqoolzgxnp|yqllgtzjee)|i(?:d(?:adx|der\.criteo|ge(?:wat|a)r|system|theatre|ver(?:dr[ds]|tiser))|emedia|g(?:choicegroup|door|fineads|pulpit)|j(?:fzvbtwhvf|scode)|llypub|mlocal|n(?:aryoptions(?:24h|game)|go4affiliates|layer)|p(?:-bip-blip|write)|rcgizd|skerando|t(?:coinadvertiser|tad)s|z(?:ographics|rotator|zclick))|j(?:cvibh|jingda|kfmvhygpub|pktmjdxqpl|zcyqezwksznxxhscsfcogugkyiupgjhikadadgoiruasxpxo)|k(?:gesylgvrgf|m(?:mlcbertdbselmdxpzcuyuilaolxqfhtyukmjkklxphbwsae|tspywevsk)|xkodsmrnqd)|l(?:a(?:ck6adv|m(?:ads|city)|rdenso|undorz|zwuatr)|in(?:dury|kadr)|o(?:cks\.ginotrack|g(?:c(?:atalog|lans)|engage|ger(?:ex|greetbox\.googlecode)|herads|lines|ohertz|topsites)|ssoms|wwor)|prkaomvazv|u(?:andi|e(?:advertise|streak|toad)|posr)|vqxlczxeda)|m(?:anpn|jccqfxlabturkmpzzokhsahleqqrysudwpuzqjbxbqeakgnf|qnguru|ubqabepbcb|yepmehjzhz)|n(?:etworx|html|iarapemvbd|kgacehxxmx|mla|nsgqjofzar|serving)|o(?:-videos\.s3\.amazonaws|a(?:fernd|rd-books)|cksnabswdq|g(?:ads|kmogzrvzf|uaokxhdsa)|inkcash|kroet|lgooltxygp|n(?:gacams|usfapturbo|zuna)|o(?:-box|j7tho|k(?:ingdragon|ofsex)|m-boom-vroom|st(?:able|clic|er3d|show))|p-bop-bam|ro(?:ra(?:ngo|s)|tango)|ston(?:paradise|wall)|w(?:ells|qvvztlkzn)|ylesportsreklame)|p(?:asyspro|bwwasthwtp|prksdgogtw|tracking)|q(?:ptlqmtroto|qjowpigdnx|ytfutmwulr)|r(?:\.rk|a(?:inient|n(?:chr|d(?:-display|clik|reachsys)|zas)|ss(?:rule|yobedientcotangent)|venetmedianetwork)|e(?:a(?:dpro|ltime)|ezybath|threngenotypeteledyne)|i(?:d(?:getrack|lonz|uend)|ght(?:eroption|info|share))|o(?:adstreetads|keloy|thersincash|wsersfeedback)|q(?:rtgjklary|vld0p)|tcmjchfyel|ucelead(?:x[1234]|x)?|ygxppyaugt)|s(?:aixnxcpaai|nbfufjgxrb|pjagxietut|trtb|upflnjmuzn)|t(?:bapoifsphl|cwkbqojiyg|kcdqrzmqca|n(?:\.createsend1|ibbler)|rll|tbgroup|xoeiisonxh)|u(?:520|a(?:ltwif|mingh|n(?:dorw|gkoj))|d(?:getedbauer|url|yxjttmjkf)|f(?:ferapp|qrxzyrecf)|itxcrnucyi|jntrmh|l(?:etproofserving|garine|letproofserving)|m(?:blecash|pin)|n(?:chofads|ny-net)|oalait|r(?:jam|stnet)|sinessc(?:are|lick)|ttons\.(?:contactme|reddit)|x(?:ept|flow)|y(?:flood|orselltnhomes|sellads)|zz(?:-stats|buttons|paradise))|v(?:ezznurwekr|obtmbziccr|yoekxfjwpa|zjhnqrypiv)|w(?:inpartypartners|pqqofejekh|yckpmsolzk)|x(?:nvdau|oixzbtllwx)|y(?:qmzodcdhhu|spot|vue)|z(?:baizntfrhl|fguipyjops|gwkxnjqjdz|jtjfjteazqzmukjwhyzsaqdtouiopcmtmgdiytfdzboxdann|n(?:clicks|mgijglbpr)|rvwbsh5o|yrhqbdldds))|c(?:13b2beea116e|8factor|-on-text|a(?:binsone|llmd5map|m(?:4(?:flat|tracking)|crush|d(?:ough|uty)|p(?:a(?:nja|rtner)|lacecash|rime)|s(?:\.spacash|ense|itecash)|zap)|n(?:aanita|o(?:eklix|nresourcecenter))|p(?:-cap-pop|acitygrid|itatmarket|t(?:ainad|ifymedia))|r(?:bo(?:nad|ur)s|s(?:\.fyidriving|xardivaf)|t(?:o(?:ontube|rkins)|stick))|s(?:\.criteo|alemedia|h(?:4m(?:embers|ovie)|-(?:duck|program)|\.femjoy|atgsc|layer|mylinks|onvisit|t(?:hat|raf(?:ic|f)))|i(?:no(?:-zilla|\.betsson)|ours)|pion|t(?:erpretic|platform))|twrite|w(?:\.criteo|cwpvmpcje)|ygh)|b(?:-content|aazars|c(?:lick(?:bank|s)|omponent)|leads|wrwcjdctrj|x(?:qceuuwnaz|tnudkklwh))|c(?:-dt|baobjyprxh|dkyvyw|efzhxgobjm|winenmbnso)|d(?:828|b(?:kxcnfmehf|xuzzlgfhh)|hzxcwuibzk|icyazp|n(?:7now|\.(?:a(?:dblade|ssets\.gorillanation)|mobicow|o(?:ffclou|ptm)d)|a(?:\.tremormedia|ds)|farm18|jke|rl|servr|trip)|qmeyhqrwinofutpcepbahedusocxqyfokvehqlqpusttfwve|rjblrhsuxljwesjholugzxwukkerpobmonocjygnautvzjjm|veeechegws)|e(?:epq|l(?:ebjihad|ogera)|n(?:nter|twrite)|r(?:otop|tified-apps)|seyitsikzs|wdbisyrzdv)|f(?:cloudcdn|dmkifknsjt|sdtzggpcmr)|g(?:jyesqhxzzm|mkpdqjnedb)|h(?:a(?:n(?:agers|go(?:sity)?)|r(?:ctr|geplatform|ltonmedia))|e(?:-ka|ck(?:m8|outfree)|naladenews|rytso|styry)|i(?:efcurrent|liadv|na-netwave|pleader|tika)|o(?:hye2t|ices\.truste|pstick16)|qulqxfghdz|ronicads|tpcjezorlo|ualangry|vjfriqlvnt|xfeymgmwbo|ytrrvwvabg|zashakbgds)|i(?:3ixee8|bleclick|hnrhqwbcsq|kzhemgwchl|rcularhub|ty(?:adspi|se)x|xjmaxkemzknxxuyvkbzlhvvgeqmzgopppvefpfkqdraonoez)|j(?:n(?:oeafncyzb|wobsladbq)|vgnswapbqo|x(?:dbmxtnqmy|kzkzmdomd))|k(?:q(?:kwhampiyb|pusmxvilv)|ryzlnafwyd|wpsghi)|l(?:a(?:s(?:h-media|s64deal)|xonmedia|yaim)|cken|dlr|e(?:a(?:fs|r(?:-request|ac|bit)|vageguarantyaquarius)|dghtdrjtb|nte|v(?:ernt|v))|hkbfqzwpst|i(?:c(?:2pub|k(?:2jump|a(?:ble|gy)|b(?:et88|ooth(?:lnk)?)|c(?:ash|ertain)|exa|fuse|ganic|i(?:ntext|ocdn)|mngr|n(?:ano|erd)|osmedia|s(?:2count|4ads|gear|ifter|or|venue)|t(?:hru(?:cash|server)|ripz)|upto|winks|xchange|z(?:\.lonelycheatingwives|xc)))|x(?:galore|sense|trac))|kfeed|mbtech|o(?:ckdisplaystoring|ud(?:cdn37612[567]|iiv|s(?:ervepoint|rvtrk)|tracked))|premdo)|m(?:bestsrv|d(?:fnow|jujqlfbts|otgwjhpqf)|fads|psuzvr|qyhtqkhduy|rxvyjyaerf)|n(?:fiukuediuy|ntsmnymvnp)|o(?:advertise|de(?:\.popup2m|lnet|onclick|zap)|edmediagroup|g(?:sdigital|uan|xsnvqesph)|in(?:ad|sicmp|tent)|krrmzagaxn|l(?:d(?:-cold-freezing|hardcash)|l(?:ection-day|iersads)|oredguitar|pory)|m(?:botag|click|eadvertisewithus|gnnyx|m(?:andwalk|ission(?:-junction|lounge|monster)|oncannon|unicatoremail)|p(?:le(?:tecarrd|xmedianetwork)|utersoftwarelive)|score|unicazio|wgi)|n(?:cernrain|duit-services|exitry|ferentse|n(?:atix|e(?:ct(?:\.nosto|i(?:gnite|onads))|x(?:place|tra)))|s(?:ent(?:-st)?\.truste|ivenu|olepprofile|trument|umergenepool)|t(?:a(?:dd|xe)|e(?:nt(?:-(?:4-u|cooperation)|\.liveuniverse|abc|js|ure)|xt(?:uads|web))|ri(?:busourcesyndication|ed))|ver(?:sionsbox|tsocial)|yak)|o(?:kie(?:-script|assistant|bot|consent\.silktide|information|manager1\.contentforces|reports|q)|l(?:erads|mirage))|p(?:acet|yrightaccesscontrols)|r(?:-natty|e\.queerclick|nflip|ruptcy|txphssdvc|write)|s(?:itin|mjs)|tnr|u(?:ll|pon2buy)|vjoecuzyss|yhvotxgrnq)|p(?:\.intl\.match|a(?:beyond|c(?:lick[sz]|oreg)|grip|l(?:ead|ock)|mnizzierk|nuk|way|y(?:ard|s))|cadnet|doalzgwnwf|fclassifieds|hxwpicozlatvnsospudjhswfxwmykgbihjzvckxvtxzfsgtx|kbdmkguggh|layer\.blinkx|m(?:10|a(?:dvisors|ffiliation)|jpcefbwqr|leader|star|t(?:erra|ree))|u(?:im|laptop)|v(?:ad(?:vertise|s)|tgt)|x(?:24|adroit|interactive|jivpayggg)|ynfeqyqfby)|q(?:b(?:abfsyfqse|phspgvhuk)|oyvpldkmqt)|r(?:a(?:k(?:cash|media)|zy(?:hell|lead|videosempire))|e(?:ative(?:-serving|cdn)|oads)|i(?:ckwrite|spads)|kgtnad|o(?:c(?:oads|spaceoptimizer)|ea|ssrider|w(?:d(?:g(?:atheradnetwork|ravity)|ynews)|nclam)|xdfrdjfnt)|piucewddag|tracklink|uiseworldinc)|s(?:\.(?:celebbusters|exposedontape)|bsyukodmga|cactmkbfvn|lxhmchzgbx|mqorveetie|s-style-95|tdfxkxbqbc|yngxtkifrh)|t(?:asnet|cautobody|enetwork|imfrfrmqip|jwmzryhcoj|m-media|plyvuuzdcv|r(?:hub|manager)|yzd|zvtevpcssx)|u(?:a(?:ntroy|sparian)|bics|elinks|guwxkasghy|r(?:ancience|iyo|redex|t(?:aecompartilha|isfrierson)))|w(?:gads|kuki|liihvsjckn|ofongvtbsi|t(?:ekghutpaq|rackit)|xblalyyvbj)|x(?:gwwsapihlo|nxognwkuxm|oxruotepqgcvgqxdlwwucgyazmbkhdojqzihljdwwfeylovh|rmgoybhyrk)|y(?:b(?:er(?:bidhos|netentertainmen)t|mas)|gnus|muxbcnhinm|wegkfcrhup|xagtpeggjv)|z(?:c(?:bkaptwfmv|yppdffuhh)|echose|geitdowtlv|oivochvduv|ppmlbidjdx))|d(?:03x2011|2(?:9gqcij|\.ligatus|ship)|3lens|5zob5vm0r8li6khce5he5|-l-t|\.(?:adroll|ligatus)|a(?:cqmkmsjajm|ffaite|llavel|n(?:a123|meneldur|zabucks)|r(?:edorm|warvid)|s(?:5ku9q|hbida)|t(?:a(?:-(?:data-vac|eroadvertising)|\.adroll|cratic-px|wrkz)|e(?:f(?:ree|unclub)|traders)|ing(?:-adv|a(?:dnetwork|mateurs)|censored|factory|gold|idol)|oporn|umreact)|x(?:nfpzmnfdr|zupqivdoj)|zhantai)|b(?:bsrv|clix|jcbnlwchgu|lpmp|moviesunlimitedx|ojgaxhxalh|taclpoahri|wawnzkjniz|ysmkeerpzo)|c(?:121677|dalkgtbmip|gbswcvywyl|matjqifoim|neohtx|znhkojghrl)|d(?:fcash|prxzxnhzbq)|e(?:al(?:current|s(?:\.macupdate|warm))|c(?:enthat|ision(?:mark|news))|dicated(?:media|networks)|e(?:cash|p(?:intent|metrix))|f(?:aultimg|eatural|initial)|guiste|hardward|l(?:-del-ete|i(?:ghtdriving|very(?:4[579]|51|-s3\.adswizz|\.adyea|dom|taste))|napb|ta-boa)|ma(?:nier|tom)|notyro|ouvnqbgflv|p(?:loyad|ositphoto|r(?:avedwhore|esi))s|qrdwsjlpjz|r(?:iversal|kopd|latas)|s(?:capita|tinationurl)|t(?:ailtoothteam|hao|roposal)|v(?:elop(?:-forevery4u|ermedia)|scroll)|x(?:imedia|platform))|f(?:cwecvmjtdj|skgmrepts|ujqyjifvoe)|g(?:gcgurqynie|m(?:a(?:tix|ustralia|xinteractive)|lubjidcxc)|wrxyucxpizivncznkpmdhtrdzyyylpoeitiannqfxmdzpmwx)|h(?:lnlwxspczc|mhdiozqbnq|omixidnkas|sztvyjwcmk|undora)|i(?:a(?:bolicaf|mondtraff|nomi)|fferentdesk|g(?:i(?:pathmedia|t(?:aldesir|revenu)e)|sby)|nclinx|rect(?:aclick|clicksonly|ion-x|leads|nicparking|orym|rev|tr(?:ac)?k)|s(?:bkzufvqhk|creetlocalgirls|pop|qusads|tant(?:news|stat))|t(?:-dit-dot|dotsol|ouyldfqgt|write)|v(?:ascam|ertura)|ysqcbfyuru)|j(?:-updates|bnmqdawodm|ntmaplqzbi|xvususwvso|zmpsingsrtfsnbnkphyagxdemeagsiabguuqbiqvpupamgej)|k(?:4ywix|rhsftochvzqryurlptloayhlpftkogvzptcmjlwjgymcfrmv)|l(?:-rm|tag)s|m(?:atquyckwtu|bjbgiifpfo|dcpvgu|g-mobile|jcabavsraf|ojscqlwewu|u20vut|wubqhtuvls|yypseympjf)|n(?:bizcdn|oucjqzsasm|qejgrbtlxe|t(?:lpwpjwcfu|r(?:ax|ck|x))|xpseduuehm)|o(?:b(?:gfkflsnmpaeetycphmcloiijxbvxeyfxgjdlczcuuaxmdzz|jgpqzygow)|dwnkpzaned|gwrite|hhehsgnxfl|jerena|llar(?:ade|sponsor)|m(?:ain(?:a(?:dvertising|pifeedh)|buyingservices|sponsor)|dex|inoad)|ogleonduty|renga|t(?:andads?|mailer-surveys|net(?:kicks|shoutout))|u(?:ble(?:-check|click(?:bygoogle)?|gear|pimp(?:ssl)?|r(?:ads|ecall))|mantr)|vltuzibsfs|w(?:ages|n(?:1oads|loa(?:d(?:-performanc|boutiqu|thesefil)e|transfer)|songlyrics)))|p(?:allyihgtgu|msrv|pcevxbshdl|s(?:rexor|tack))|qp(?:amcouthqv|ywdubbxih)|r(?:bwugautcgh|eamaquarium|nxs|o(?:pzenad|wle)|qjihcfdrqj|tqfejznjnl)|s(?:evjzklcjjb|fkwkjnfkjnwjef|mysdzjhxot|n(?:extgen|jsdrbqwdu|r-affiliates)|ultra|wwghrlwwcm)|t(?:iserv2|m(?:pub|wwpykiqng)|zads)|u(?:a(?:mews|vindr)|b(?:ijsirwtwq|shub|zmzpdkddi)|chmcmpmqqu|delsa|etads|ggiads|l(?:cetcgvcx|psxaznlw)r|moyqzxluou|ncanny|r(?:nowar|okuro|tz)|sgihujnthv|vyjbofwfqh|xyrxhfwilv)|v(?:dkinoteatr|srlrnpyxwv)|w(?:dewew|entymgplvrizqhieugzkozmqjxrxcyxeqdjvcbjmrhnkguwk)|x(?:cqavshmvst|fsbkmaydtt|i(?:gubtmyllj|ixnrumvni)|urtngzawwe)|y(?:azeqpeoykf|erbegytfkj|ino|jifezeyagm|nami(?:c(?:dn|oxygen|serving)|tedata)|unhvev|zstwcqbgjk)|z(?:dfmwaztrrm|zawlkmtvug))|e(?:2ertt|65ew88|9mlrvy1|-(?:generator|viral)|a(?:idabmuxbqy|rnify|s(?:nviytengk|y(?:ad|download(?:4you|now)|flirt|hits4u|inline)))|b(?:ayobjects|dr[23]|fjbrlcvjlv|lastengine|o(?:cornac|undservices)|spiewapcta|uzzing|yakgowemds|zkswbs78)|c(?:meqhxevxgmtoxubrjstrrlyfgrrtqhvafyagettmwnwkwltn|ortb|pmrocks|t(?:bduztanog|o-ecto-uno))|d(?:g(?:evertise|sscofljhc|ualf)|n(?:npxhjsqyd|plus)|vbyybaviln|wywpsufuda|xvyyywsxqh)|e(?:fbzuwvnnab|jcqlenlsko|puawuevovi|qabqioietkquydwxfgvtvpxpzkuilfcpzkplhcckoghwgacb|rdckbwujcx)|f(?:5ahgoo|cnevmojvfs|ukznkfmrck)|g(?:amingonline|kkeahdzjqy|tkhpkkfswf)|hnjtmqchrub|i(?:dzaqzygtvq|fbewnmtgpi|ibdnjlautz|w(?:cqowbowqo|rwjc))|j(?:gxyfzciwyi|jrckrhigez|wmxjttljbe)|k(?:ansovi|gmjxjyfzzd|hgvpsfrwqm|mas)|l(?:beobjhnsvh|e(?:ct(?:next|osake)|fantsearch|kted|pheny)|it(?:e-sex-finder|search)|jjyutgjiuh|kpxsfzrubq|xxkpaeudxu|z(?:logcphhka|mazpsbnwn))|m(?:b(?:erads|raceablemidpointcinnabar)|dbszgmxggo|ediawebs|irdzzvhviv|p(?:iremoney|tyspaceads)|rumkgmdmdq)|n(?:f(?:hddbnariw|upatujiqb)|gineseeker|hwftpkwvnb|iaypwywduf|lnks|t(?:erads|itlements\.jwplayer|recard(?:\.s3\.amazonaws)?)|zyxtdcacde)|o(?:jrldtucqsf|sads|vkzcueutgf)|p(?:e(?:rnepojk|sogtigo)le|go(?:kiocquxf|oipixbbo)|icgameads|oxtzgddiwp|t(?:ord|um)|zxtposabej)|qszmuwnozvx|r(?:bsqnmglmnv|endri|goledo|ht5jhy|kwkjfompvt|niphiq|o(?:a(?:dvertising|nalysis)|sadv|tikdating|v(?:ation|inmo))|s(?:hgrst|zwzaidmlc)|vpgpxr|wgerwt)|s(?:c(?:alatenetwork|o(?:kuro|rtso|ttish))|gwceckxumg|l(?:gydoqbedo|ydbnukkme)|nirgskobfj|p(?:ecifican|nrlezwzvd)|say(?:ad|coupon)s|t(?:antiale|orest))|t(?:argetnet|b(?:mvqjnfxtk|rjgpsadke)|g(?:dta|giddfdaqd)|o(?:logy|ro)|r(?:ader\.kalahari|evro))|u(?:2xml|pwogkcjczz|r(?:ew|o(?:-rx|click|pacas(?:ino|h)))|tklhuazxlt)|v(?:e(?:ntful|rnote)|hvoeqfrlsb|iderable|lvaulglzpu|olve(?:mediallc|nation))|w(?:ebse|gtanybkkch)|x(?:act(?:drive|ly0r)|c(?:ellenceads|hange4media|iliburn|lusive(?:cpms|pussy)|olobar)|dynsrv|er(?:ciale|nala)|gfpunished|i(?:optyxiyoo|t(?:explos|junct)ion)|lpor|nyzdboihvi|o(?:clickz?|gripper|srv|ticads)|p(?:ebtu|lor(?:ad|er\.sheknow)s|o(?:crack|grim|nential))|t(?:onsuan|ra33))|y(?:diuqpdtfew|e(?:medias|re(?:turn)?|viewads|wonder)|lyitpslpqu)|z(?:btpdjeimlv|emyudhkzvx|jrnbpjthir|knqsblzmsl|mob|uosstmbcle))|f(?:4906b7c15ba|7oddtr|-(?:4560|hookups|questionnaire)|a(?:bolele|c(?:e(?:book(?:cover|ofse)x|porn)|sowlaufzk)|eph6ax|ggrim|ir(?:adsnetwork|blocker)|n(?:aticalfly|delcot|sign\.streamray)|oxietqwbmu|pality|r(?:-far-star|kkbndawtxczozilrrrunxflspkyowishacdueiqzeddsnuu)|st2earn|tads\.toldya)|b(?:-plus|bjlubvwmwd|ooksluts|svu)|c(?:fd5de4b3be3|gadgets\.blogspot|j(?:hxlybaiab|nqpkrdglw))|d(?:dbdlolkxgc|epobamndfn|f4|ogfuqpgeub)|e(?:at(?:ence|ure(?:dusers|link))|ed(?:\.mikle|age|blitz|s\.(?:delicious|videosz))|gyacmbobil|l(?:ixflow|jack)|m(?:-inc|bsflungod)|nixm|r(?:4ere|rellis))|f(?:anszicnoqs|hwzaenzoue|pkqjyvvneg|wbpadvkcyi)|g(?:hdembabvwe|kvpyrmkbap|mucsiirrsq|wsjwiaqtjc|zaxilcgxum)|h(?:awywadfjlo|serve|ylnqzxwsbo)|i(?:eldpprofile|gshare|l(?:amentapp(?:-assets)?\.s3\.amazonaws|e(?:loadr|s(?:erver\.mod|tub)e|target)|t(?:ermomosearch|hads))|mserve(?:\.myspace)?|nd(?:-abc|andtry|betterresults|onlinesurveysforcash|sthat)|r(?:axtech|e(?:feeder|g(?:etbook|ob))|m(?:harbor|protected)linked|st(?:-rate|adsolution|class-download|l(?:ightera|oad)|mediahub)|ugsivsqot)|sari|xionmedia)|j(?:cvncxrmmru|fxpykp|uouqwxgbir|volzrojowa|xlbkwhtpil)|k(?:d(?:qrjnoxhch|sfk38fnc2bc3)|ekipafwlqd|ianrxjfumm|jyzxnoxusg|rrvhoierty)|l(?:a(?:sh(?:adtools|clicks|group|talking)|vordecision)|e(?:awier|sh(?:cash|lightgirls)|xlinks)|irt(?:4(?:fre)?e|ingsms)|o(?:donas|migo)|u(?:ohbiy|xads)|ymyads|zelfqolfnf)|m(?:cwqmwdaubb|dwbsfxf0|s(?:ads|cash)|uxugcqucuu|zxzkgmpmrx)|n(?:aolgfubmlc|c(?:ash|net1)|eheruhxqtv|jcriccyuna|kyyrgraizy)|o(?:a(?:ks|mybox)|bjoccwkrkv|calex|gzyads|kisduu|llo(?:wistic|yu)|ntsapi(?:27|39)8|o(?:dieblogroll|nad|t(?:ar|erslideupad|note))|r(?:cepprofile|ex(?:-affiliate|yard)|getstore|ifiha|kizata|pyke|restersurveys)|u(?:lsomty|ndayu)|xpush)|p(?:bmjwoebzby|pupmqbydpk|slcnjecewd|vfeyjrwlio)|q(?:azjwxovxlu|kcdhptlqma|mxwckinopg|ovfxpsytxf|pteozo)|r(?:ameptp|czfzikturw|d(?:dujheozns|hsmerubfg)|e(?:akads|e(?:-porn-vidz|biesurveys|couponbiz|lancer|onescams|paidsurveyz|rotator|s(?:kreen|oftwarelive)|tellafriend|webcams)|st(?:acero|ime))|hgxd|iend(?:lyduck|s2follow)|l(?:vfzybstsa|zxwxictmg)|omfriendswithlove|ty[abe]|u(?:amens|itkings|trun)|x(?:le|rydv))|s(?:ddidfmmzvw|v(?:crapnmmvj|xxllfpfhk))|t(?:gfmbxqkjda|j(?:cfx|rekbpjkwe)|odxdoolvdm|vkgkkmthed|ytssqazcqx)|u(?:andarst|ck(?:bookdating|ermedia|youcash)|elbuck|gger\.ipage|n(?:klicks|n(?:el-me|ypickuplinesforgirls))|ture(?:residual|u)s|urqgbfhvqx)|v(?:beyduylvgy|r(?:bloxygbrv|vxmksxhut)|wcwbdrprdt)|w(?:bntw|crhzvfxoyi|fgbhjhnlkv|ix|lkncckwcop|zlsugrflhh)|x(?:cayktrneld|depo|j(?:gprpozntk|yultd)|rgikipxnlq|tgrttlarkl|vxgwqcddvm|wkhwcmsqne|yc0dwa)|z(?:siwzxnqadb|zudxglrnrr))|g(?:17media|4whisperermedia|5fzq2l|6ni40i7|726n8cy|a(?:87z2o|g(?:acon|enez)|inmoneyfast|l(?:ileofive|leyn)|m(?:bling-affiliation|e(?:-clicks|ads|cetera|hotus|rsad|srevenue|vui24))|n(?:ardineroreal|ja|nett\.gcion)|r(?:o(?:-garo-osh|write)|risto|vmedia)|t(?:e-ru|ikus)|xmdcfkxygs|y(?:ad(?:network|pros)|xperience)|zogsjsoxty)|b(?:akhtzvoguz|iwxmjw|kfkofgm?ks|ltotkythfh|sxcyukuuex|wrjyntqsvr)|cboyhlfqxhc|d(?:ekvzhsqwau|ixpvfqbhun|mdigital|puknsngvps)|e(?:azikjazoid|dmodsxbebd|f(?:aqjwdgzb|hasi|nar)o|mineering|n(?:e(?:gd|ric(?:link|steps)|sismedia)|i(?:alradio|eessp)|ovesetacet|usaceracousticophobia)|o(?:\.(?:camazon|query\.yahoo)|i(?:nventory|pads)|promos|visite)|qcqduubhll|r(?:pkshe|tgh)|stionpub|t(?:\.(?:2leep|box24casino|davincisgold|paradise8|rubyroyal|slotocash|thisisvegas)|g(?:lu|scfre)e|iton|m(?:ailcounter|yads)|popunder|s(?:co(?:recash|utapp)|ecuredfiles|itecontrol|mily)|traff))|f(?:fxdjhgbjhv|hdkse|revenge|xa\.sheetmusicplus)|g(?:bfbseakyqv|gemaop|n(?:abmvnwphu|cpm|gbgccubvf)|tujtuyvcci|wcash|zuksudqktn)|h(?:fgcdsdfgcg|troafchzrt)|i(?:antaffiliates|b(?:-gib-la|sonvillainousweatherstrip)|gya|miclub|ojhiimnvwr|thubbadge\.appspot|v(?:ingsol|muvbacwui)|y(?:jhogjmfmc|upoeynkfx))|j(?:eyqtunbnap|xdibyzvczd)|k(?:blyvnioxpd|eahnmvduys|gdqahkcbmykurmngzrrolrecfqvsjgqdyujvgdrgoezkcobq|iryieltcbg|lmedia|vhfryrramj)|l(?:-cash|btrk|ical|lkdkxygckb|nqvqbedbmvtcdzcokrfczopbddhopygrvrnlgmalgvhnsfsc|o(?:-glo-oom|bal(?:ad(?:media|sales)|interactive|s(?:ign|uccessclub))|wdot)|slciwwvtxn)|mp(?:dixdh|muqniggyz)|n(?:adhzstittd|ipadiiodpa|nmdzbroemx)|o(?:2euroshop|\.pardot|acestnzgrd|ember|fgfsvnfnfw|g(?:oplexer|vo)|j(?:oingscnow|wyansqmcl)|ld(?:-(?:file|good4u)|erotica)|o(?:d(?:-black4u|bookbook|luckblockingthis)|gle(?:adservicepixel|syndicatiion|tagmanager))|r(?:gonkil|oost|tags)|t(?:agy|oplaymillion)|v(?:er(?:eign|nmenttrainingexchange)|iral-content))|p(?:acalculatorhighschoolfree|bznagpormpyusuxbvlpbuejqzwvspcyqjcxbqtbdtlixcgzp|erzgnvuuyx|gsxlmjnfid|hfgyrkpumn|l(?:trrdffobf|usapi\.appspot)|nduywxhgme)|q(?:nmautydwky|orytmpkjdq|thfroeirol|u(?:lrzprheth|vhveabaem))|r(?:a(?:bmyads|fpedia|nodiorite|tisnetwork|zeit)|ceweaxhbpvclyxhwuozrbtvqzjgbnzklvxdezzficwjnmfil|e(?:at(?:branddeals|cpm|edr)|en(?:-red|labelppc)|nstia|tzalz|ystripe)|fqrhqlzvjl|idlockparadise|llopa|mtas|o(?:ovinads|u(?:chyaccessoryrockefeller|pcommerce))|t0[23]|u(?:adhc|mpyadzen)|xpaizsvdzw)|s(?:csystemwithdarren|iqerorqkxu|niper2)|t(?:aouarrwypu|bfhyprjhqz|cpsbvtwaqw|evyaeeiged|monytxxglu|qfsxrrerzu|sads|xfafvoohbc)|u(?:aldoniye|bdadtxwqow|htjoqtobac|i(?:andr|taralliance)|mgum|n(?:partners|zblazingpromo)|r(?:rfwsscwda|urevenue))|v(?:erjfuapaag|gakxvukmrm|oszbzfzmtl|rqquiotcyr|xobjcxcbkb)|w(?:a(?:atiev|llet)|cujaprdsen|someiyywaz)|x(?:101|dyluyqciac|gnvickedxpuiavkgpisnlsphrcyyvkgtordatszlrspkgppe|vbogvbcivs|xsqeqlepva)|y(?:dlzimosfnz|inmxpztbgf|nax|pxbcrmxsmikqbmnlwtezmjotrrdxpqtafumympsdtsfvkkza)|z(?:bop|koehgbpozz|mofmqddajr|pqlbqyerpb|umjmvqjkki))|h(?:12-media|a(?:fbezbemwwd|jcehcnodio|l(?:fpriceozarks|lucius|ogennetwork)|n(?:aprop|dll)|qlmmii|r(?:dcoresexnow|renmedianetwork)|s(?:h-hash-tag|ingham)|tagashira|v(?:e(?:nwrit|tohav)e|inates|nr))|b(?:-247|bwlhxfnbpq|edvoyluzmq|rbtmjyvdsy|vnnwtoonhh|zzkwsuaooc)|c(?:ggkyhzxzsv|lccadfmkpw|yxksgsxnzb)|d(?:-plugin|hvbeyy36fnnc8|player-download|vid-?codecs|wlzheftpin)|e(?:a(?:d(?:linesnetwork|up)|lth(?:affiliatesnetwork|carestars|grades))|biichigo|efwozhlxgz|llo(?:bar|reverb)|ntaibiz|r(?:a(?:cgjcuqmk|vda)|ezera|ocpm)|vdxhsfbwud|xagram|ydqkfbglbu)|f(?:fm(?:xndinqyo|zplu)|gevdzcoocs|juehls|mtqgiqscvg)|g(?:bmwkklwittcdkjapnpeikxojivfhgszbxmrjfrvajzhzhuks|cgfxjkvjch|dat|hit|z(?:opbyhidre|tvnjbsrki))|h(?:ourtrk2|wqfmqyqoks)|i(?:adone|ddenbucks|g(?:h(?:cpm|net)s|ygtvnzxad)|jacksystem|lkfxdqxzac|m(?:ediad[sx]|selves)|p(?:als|ersushiads|lair)|st(?:ians|orest)|t(?:-now|wastedgarden)|zlireklam)|j(?:eoncuvklqh|ukmfdbryln|vdkrjmxngg)|k(?:acgxlpfurb|djrnkjwtqo|lyzmspvqjh|oxlirf)|l(?:ads|ekbinpgsuk|jiofrtqenc|otiwnz|pnowp-c)|m(?:cjupvbxxyx|ongcash)|n(?:-button\.herokuapp|button\.appspot|desrzcgjmprqbbropdulvkfroonnrlbpqxhvprsavhwrfxtv|ivikwwypcv|like|oajsaivjsg|qnftzzytjl|tpbpeiuajc)|o(?:kaybo|la-shopping|me-soon|nouncil|okupbucks|p(?:afrmwpckj|feed|i(?:los|nionse))|r(?:ny(?:birds|girlsexposed|matches|spots)|sered|testoz|yzon-media)|sti(?:canaffiliate|ng\.conduit)|t(?:-(?:dances|mob|socials)|chatd(?:ate|irect)|elscombined|keys|ptp|social[sz]|words)|ustion|w(?:jkpaynzwf|todoblog))|p(?:dmnmehzcor|kwirncwvxo|lgpoicsnea|mgdwvvqulp|r\.outbrain|xxzfzdocinivvulcujuhypyrniicjfauortalmjerubjgaja)|q(?:aajpaedpux|footyad4\.blogspot|nyahlpmehp|pass|sxomhxwhpq|xtsqwpvort)|r(?:dbamvfzipe|kshoveizfo|vxpinmdyjx)|s(?:mclick|oyrqqsludd|slx|tpnetwork|vqfvjidloc|zyozoawqnk)|t(?:llanmhrnjrbestmyabzhyweaccazvuslvadtvutfiqnjyavg|onrwegnifw|rprrrtrwrc|tpool)|u(?:ayucnblhgy|bvotrpjios|e(?:enmivecmx|jizictcgd)|lahooprect|tkuzwropgf|ynrscfbulr|z(?:mweoxlwanzvstlgygbrnfrmodaodqaczzibeplcezmyjnlv|onico))|v(?:ccjhkcvlfr|dddlsdexic|fz(?:acisynoq|shrpfueb)|ukouhckryjudrawwylpboxdsonxhacpodmxvbonqipalsprb)|w(?:fcdqnvovij|sbehjaxebh|vwuoxsosfp)|x(?:bvbmxv|kanryhktub|lojjtpqtlk|uvwqsecumg)|y(?:per(?:linksecure|promote|trackeraff|vre|webads)|tkatubjuln|ubowucvkch|vsquazvafrmmmcfpqkabocwpjuabojycniphsmwyhizxgebu|zncftkveum)|z(?:skbnafzwsu|tkbjdkaiwt|wxkqnqrdfv))|i(?:2casting|5rl5lf|\.skimresources|a(?:g(?:squdxpcfr|vkdeienla)|mediaserve|sbetaffiliates)|b(?:atom|qmccuuhjqc|ryte)|c(?:afyriewzzrwxlxhtoeakmwroueywnwhmqmaxsqdntasgfvhc|direct|gakpprechm|jeqbqdzhyx|pfrrffsenr|qadvnew|zhhiiowapd)|d(?:e(?:al(?:-sexe|media)|ntads)|kyfrsbzesx|o(?:lbucks|wnloadgalore)|pukwmp|reammedia|vuakamkzmx)|e(?:ctshrhpgsl|oexdjxrwtq|qprskfariw)|f(?:aklabnhplb|rame(?:\.(?:adultfriendfinder|mediaplazza)|s\.hustler)|vetqzfiawg)|g(?:a(?:meunion|wfxfnupeb)|dfzixkdzxe|ithab|l(?:oohq|wibwbjxuoflrczfvpibhihwuqneyvmhzeqbmdmujmirdkae)|n(?:itioninstaller|up)|upodzh|yzmhqbihoi)|h(?:drozswbekx|eartbucks|flwxrsptqz|gkmgwfhjam|qxhokndcfq|riduffgkel)|i(?:asdomk1m9812m4z3|bcejrrfhxh|cheewi|hwyqhxajtn|jmodcvlwfk|tfqholnpud)|jquery10|k(?:ealcmavhpk|nctklddhoh|v(?:fgsftmyhn|ltjooosqh)|zikistheking)|l(?:api\.ebay|ividnewtab|lustriousoatmeal|ovecheating|rxikdjozlk|sivrexvpyv|vibsabwuza)|m(?:a(?:ge(?:\.(?:cecash|nsk-sys)|adnet|s(?:\.(?:d(?:mca|reamhost)|mylot|scanalert)|nake))|sdk\.googleapis)|bbjywwahev|edia(?:audiences|revenue)|g(?:\.(?:bluehost|hostmonster|mybet|promoddl)|carry|feedget|lt|oatxhxior|pop\.googlecode|sniper|tty|webfeed)|i(?:cl|tr)k|onomy|p(?:actradius(?:-go)?|lix|ore|res(?:ionesweb|sion(?:affiliate|desk|monster)))|qkdsdgfygm|rwxmau|tdtaloqwcz|yqdbxq|zngbreiiiv)|n(?:-appadvertising|atye|binaryoption|c(?:entaclick|loak|o(?:meliberation|tand)|re(?:ase-marketing|diblesugar))|d(?:e(?:terman|xww)|i(?:a(?:ds|n(?:friendfinder|linkexchange|weeklynews))|eclick|sancal)|ofad|u(?:anajo|strybrains))|e(?:ntasky|rtanceretinallaurel|tinteractive|woioxxdbm)|f(?:ectiousmedia|inityads|luads|o(?:links|rm(?:ation-sale|visitors)))|it\.lingospot|ktad|line\.playbryte|m(?:obi|rjokdxmkh)|n(?:ity|ovid)|omoang|playbricks|s(?:brvwfrcgb|i(?:ghtexpress(?:ai)?|ruand|te(?:promotion|systems))|kin(?:ad|media)|t(?:a(?:gramfollowbutton|llcdnfile|nt(?:clk|dollarz|paydaynetwork))|i(?:cator|nctiveads|vate)))|t(?:e(?:gral-marketing|lli(?:chatadul|tx)t|nthq|r(?:click|estably|gi|netadbrokers|polls|stitial\.glsp\.netdna-cdn)|xt(?:direc|scrip)t)|opicmedia|rapromotion|trax|uneads)|uvo|v(?:e(?:stingchanne|tp)l|i(?:te\.linescale|ziads))|xhtjrwictg)|o(?:atyggwaypq|haqrkjddeq|ighavxylne|nbpysfukdh)|p(?:dlsrwctdjb|owercdn|r(?:edictive|o(?:blet|mote))|sowrite)|q(?:mjedevvojm|rqmhrfkyuu)|r(?:bkobqlrbtt|jaeupzarkvwmxonaeslgicvjvgdruvdywmdvuaoyfsjgdzhk|rttzthsxot|xpndjg|zdishtggyo)|s(?:bzjaedbdjr|caebizkzyd|dlyvhegxxz|ggimkjabpa|lationa|ohits|parkmedia|qgobsgtqsh|ubdom(?:ains)?)|t(?:biwlsxtigx|evcsjvtcmb|mcash|r(?:engia|xx)|slive)|u(?:1(?:6wmye|xoe7o)|benda|pqelechcmj|ymaolvzery)|v(?:itrine\.buscape|k(?:asohqerzl|tdwmjhkqy)|qoqtozlmjp|sqnmridfxn)|w(?:anttodeliver|e(?:acndqhiht|banalyze)|fboasiqwohfw|innersadvantage|monrwpeeku|qugvxozbkd|rjczthkkla)|x(?:lsylapsdtr|np|s(?:public|xgaegvplo)|z(?:hwyuxxvxb|nwuxokydz))|ydghotpzofn|z(?:319xlstbsqs34623cb|eads|hvnderudte|i(?:whlafxitn|xtxrvogaq)|nhvszyizwd|ooto|tsbnkxphnj|wsvyqv))|j(?:a(?:bcdkwmwnek|cquarter|dcenter|hsrhlp|kzxxzrymhz|mkkydyiyhx|n(?:dolav|go(?:network)?|rlobmiroi)|s(?:min|pensar)|tkcmpxhbba|uftivogtho|vbucks|ymancash)|b(?:bgczjipjvb|gehhqvfppf|oovenoenkh|visobwrlcv|yksmjmbmku)|c(?:ctggmdccmt|noeyqsdfrc)|d(?:hnfbmrhwkn|lnquri|rm4|t(?:racker|ufqcyumvb))|e(?:e(?:h7eet|tyetmedia)|isl|mmgroup|r(?:rcotch|twakjcaym)|vijshpvnwm|wishcontentnetwork|y(?:oxmhhnofdhaalzlfbrsfmezfxqxgwqjkxthzptjdizuyoj|searc)h)|f(?:aqiomgvajb|duv7|fwwuyychxw|r(?:esi|ibvstvcqy))|g(?:qkrvjtuapt|rcggutsilp)|h(?:rmgusalkdu|upypvmcsqfqpbxbvumiaatlilzjrzbembarnhyoochsedzvi)|i(?:a(?:nscoat|this|wen88)|jcetagjfzo|sbar|vox|wire|yairvjgfqk|zzontoy)|j(?:drwkistgfh|ipgxjf|poxurorlsb|x(?:aibzdypcb|sdkphpcwu)|yovwimoydq)|k(?:fg4hfdss|joxlhkwnxd|kernvkrwdr|vjsdjbjkbvsdk)|l(?:armqbypyku|flzjdt|mirsfthnmh|slujfguojw|ymmwnkxhph)|m(?:bhyqijqhxk|p9|v(?:jmgofvxnu|nolvmspponhnyd6b)|zaqwcmcbui)|n(?:c(?:hbwtzbrrf|jzdohkgic)|dclagxkvpn|ercechoqjb|xqlltlnezn|ylpjlnjfsp)|o(?:7cofh3|b(?:amatic|s(?:\.thejobnetwork|yndicate)|t(?:arget|hread)|veibsozms)|gpsoiyngua|in(?:\.filthydatez|bot|nowinstantly)|qpatxugyug|rndvyzchaq|vepjufhmmw|wapt|y(?:ourself|tocash))|p(?:flmmxdflmm|ncpftyxliq|uiucicqwan|wvdpvsmhow)|q(?:i(?:bqqxghcfk|nqsrmygeu)|kxaejcijfz|mcbepfjgks|qrcwwd|ueryserver)|r(?:myhchnfawh|tawlpbusyg)|s(?:co(?:de\.yavli|unt)|eewggtkfrs|feedadsget|hjrozmwmyj|retra)|t(?:rakk|umenosmrte|zlsdmbmfms)|u(?:arinet|dicated|gglu|ic(?:eadv|yads)|j(?:uads|zh9va)|m(?:boaffiliates|p(?:elead|tap))|nbi-tracker|osanf|qmlmoclnhe|rsp|s(?:rlkubhjnr|t(?:getitfaster|re(?:levant|sa))|ukrs)|yfhwxcvzft)|v(?:nvvuveozfi|odizomnxtg)|w(?:aavsze|fdyujffrzt|wlyiicjkuh|zegfmsgyba)|x(?:anmrdurjhw|uezvyaakks|vhdyguseaf)|y(?:auuwrrigim|dbctzvbqrh|pmcknqvnfd|vtidkx)|z(?:9ugaqb|b(?:arlrhbicg|skhgpivyl)|ekquhmaxrk|lzdnvvktcf|qharwtwqei))|k(?:0z09okc|a(?:djwdpzxdxd|looga|n(?:oodle|tarmedia)|play|r(?:cvrpwayal|go|ownxatpbd)|y(?:fdraimewk|ophjgzqdq))|b(?:jddmnkallz|r(?:nfzgglehh|wlgzazfnv)|sceyleonkq|zrszspknla)|c(?:chjeoufbqu|eikbfhsnet)|d(?:askxrcgxhp|t(?:ictjmofbl|stmiptmvk)|vcvkwwtbwn)|e(?:cldktirqzk|e(?:edoleeroe|llcvwpzgj|onewsbkanews|wurd)|halim|nduktur|qnebfovnhl|sllcmdcsbd|t(?:ads|oo)|y(?:runmodel|word(?:blocks|pop|sconnect)))|f(?:dwywhuissy|limllvanjv|pwayrztgjj|wpyyctzmpk|zimhbhjdqa)|g(?:idpryrz8u2v0rz37|kjlivo|vgtudoridc|zuerzjysxw)|i(?:dasfid|hhgldtpuho|kuzip|lorama|n(?:ley|tokup)|os(?:how|ked)|tnmedia|wi-offers)|j(?:afuhwuhwf|bqzbiteubt|dhfjhvbjsdkbcjk3746|gh5o|jlucebvxtu|mddlhlejeh|nkmidieyrb|plmlvtdoaf|qyvgvvazii)|kn(?:vwhcmqoet|wvfdzyqzj)|l(?:akcdiqmgxq|dwitfrqwal|fqffhvdpkd|i(?:k(?:advertising|saya|vip)|pmart|xfeed)|mvharqoxdq|oapers|rdsagmuepg)|m(?:tubsbmwdep|v(?:eerigfvyy|upiadkzdn))|n(?:kxnwscphdk|o(?:andr|wd)|slxwqgatnd)|o(?:l(?:estence|it(?:at|ion))|moona|n(?:bwfktusr|textu)a|ocash|rexo|stprice|v(?:glrrlpqum|la))|p(?:lzvizvsqrh|nuqvpevotn|sdnlprwclz)|q(?:cflzvunhew|gfcumsbtyy|mjmrzjhmdn|sipdhvcejx)|r(?:3vinsx|aken\.giantrealm|ilxjkgttmp|muxxubtkrg|ovrhmqgupd|sdoqvsmgld|x(?:exwfnghfu|pudrzyvko)|ziyrrnvjai)|sbklucaxgbf|t(?:cltsgjcbjdcyrcdaspmwqwscxgbqhscmkpsxarejfsfpohkk|hdreplfmil|jqfqadgmxh|rmzzrlkbet)|u(?:a(?:d\.kusogi|manan|vzcushxyd|ygqohsbeg)|jkgfzzyeol|m(?:ekqeccmob|pulblogger)|rtgcwrdakv|tlvuitevgw)|v(?:adaiwjwxdp|dskjbjkbdfsv|pofpkxmlpb|rozyibdkkt|syksorguja|vvdfimdxnu|zvtiswjroe)|w(?:gpddeduvje|ipnlppnybc|jglwybtlhm|ystoaqjvml)|x(?:areafqwjop|dprqrrfhhn|tepdregiuo)|y(?:hkyreweusn|lqpeevrkgh|owarob|veduvdkbro|zhecmvpiaw)|z(?:qrjfulybvv|ujizavnlxf|wddxlpcqww))|l(?:a(?:-la-(?:moon|sf)|kequincy|n(?:delcut|istaconcepts)|pi\.ebay|r(?:entisol|gestable|kbe)|serhairremovalstore|unchbit|v(?:antat|etawhiting)|yer(?:loop|s\.spacash|welt)|zkslkkmtpy)|b(?:fryfttoihl|m1|pndcvhuqlm|ypppwfvagq)|c(?:kpubqq|l2adserver|pqoewrzuxh|tpaemybjkv|uprkufusba|xrhcqouqtw|y(?:ncwbacrgz|xmuhxroyo))|d(?:82ydd|aiuhkayqtu|gateway|kyzudgbksh|yiuvdoahxz)|e(?:a(?:d(?:acceptor|cola|mediapartners)|noisgo|ptrade)|che69|etmedia|gendarylars|pin(?:sa|to)r|s(?:sbuttons|uard)|t(?:adnew|ilyadothejob|reach|s(?:advertisetogether|getsocialnow|hareus)|zonke)|uojmgbkpcl|visites|xwdqnzmkdr)|f(?:cnzhcnzded|stmedia|vrjrdrgazl)|g(?:njcntegeqf|se|t(?:hvsytzwtc|nwgfqkyyf))|h(?:aqzqjbafcu|ekiqlzatfv|uqalcxjmtq)|i(?:a-ndr|c(?:antrum|kbylick)|e8oong|f(?:epipenewsdaily|tdna)|ga(?:dx|t(?:ional|us))|k(?:e(?:btn|control)|suad)|menewsonedailyn|n(?:k(?:buddies|clicks|e(?:levator|xchange)|grand|m(?:ads|yc)|referral|s(?:2revenue|\.freeones|alpha|howoff|mart)|w(?:elove|ithin|orth)|ybank)|oleictanzaniatitanic)|o(?:nsads|sawitskzd)|qbipkfbafq|stingcafe|v(?:e(?:ad(?:exchang|optimiz)er|c(?:am|hatflirt)|intent|jasmin|pr(?:ivate|omotool)s|rail|s(?:exasian|tatisc)|traf|universenetwork)|write)|xzmpxjilqp|zads)|j(?:huvzutnpza|ng(?:encgbdbn|jrwkyovx)|zhxfurwibo)|k(?:aarvdprhzx|bvfdgqvvpk|jmcevfgoxfbyhhmzambtzydolhmeelgkotdllwtfshrkhrev|ktkgcpqzwd|rcapch)|ljtgiwhqtue|m(?:e(?:bxwbsno|juamdbtwc)|jjenhdubpu|uxaeyapbqxszavtsljaqvmlsuuvifznvttuuqfcxcbgqdnn)|n(?:djj|jpyxvbpyvj|kgt|nwwxpeodmw|zcmgguxlac)|o(?:ading-(?:delivery1|resource)|c(?:al(?:adbuy|edgemedia)|k(?:erdome|hosts|scalecompare))|ginradius|ltrk|o(?:dyas|k(?:it-quick|smart)|ney(?:ads|network)|pmaze)|s(?:omy|tun)|tteryaffiliates|udloss|ve(?:adverts|claw|me|rcash)|x(?:metwdjrmh|tk))|p(?:\.(?:musicboxnewtab|ncdownloader|titanpoker)|iqwtsuduhh|lqyocxmify|poblhorbrf|wvdgfo)|q(?:cdn|hnrsfkgcfe|lksxbltzxw|pkjasgqjve)|r(?:jltdosshhd|oywnhohfrj)|s(?:awards|egvhvzrpqc|hwezesshks|kzcjgerhzn|slotuojpud|tkfdmmxbmv)|ttsvesujmry|u(?:adcik|cid(?:commerce|media)|hqeqaypvmc|raclhaunxv|shcrush|vc(?:ash|om)|x(?:adv|uryslotonline))|v(?:dtftxgbsiu|lvpdztdnro|rvufurxhgp)|w(?:asxldakmhx|enrqtarmdx|jzsigenxsl|kef63hfc|ocvazxfnuj|qwsptepdxy|ysswaxnutn)|x(?:2rv|ghhxdcmumk|kqybzanzug)|y(?:ifwfhdizcc|tpdzqyiygthvxlmgblonknzrctcwsjycmlcczifxbkquknsr|zskjigkxwy)|z(?:awbiclvehu|bzwpmozwfy|fvonzwjzhz|jl|movatu|rfxzvfbkay|vnaaozpqyb))|m(?:10s8|2pub|4pub|57ku6sm|a(?:b(?:irol|oflgkaxqn)|chings|d(?:-adz|adsmedia|isonlogic|s(?:erving|one))|fndqbvdgkm|g(?:ical-sky|netisemedia|wfymjhils)|i(?:l(?:\.advantagebusinessmedia|erlite|marketingmachine)|n(?:adv|roll))|k(?:echatcash|hhvgdkhwn)|l(?:akasonline|l(?:com|orcash|sponsor))|n(?:fys|goforex|ingrs)|omaotang|p\.pop6|r(?:feel|ginalwoodfernrounddance|imedia|k(?:\.reevoo|e(?:r(?:got|ly)|t(?:banker|gid|health|ingenhanced|leverage|network|oring|researchglobal))|swebcams)|sads|tiniadnetwork|vilias)|s(?:srelevance|ter(?:nal|wanker))|t(?:chcows|hads|iro|rix-cash)|udau|x(?:c(?:ash|orpmedia)|girlgames|iadv|serving)|ziynjxjdoe)|b(?:01|10[234]|38|57|\.marathonbet|ajaazbqdzc|fvfdkawpoi|gvhfotcqsj|vmecdlwlts)|c(?:-nudes|agbtdcwklf|d(?:omainalot|storage))|d(?:adx|eaoowvqxma|ialog|lsrv|n2015x[12345]|rkqbsirbry)|e(?:a(?:digital|gjivconqt|surelyapp)|ccahoo|d(?:als\.bizrate|i(?:a(?:303|6degrees|970|-(?:app|general|serving|toolbar)|\.(?:eurolive|m(?:atch|yko(?:cam|dial))|netrefer|pussycash)|c(?:lick|pm)|f(?:filiation|ilesdownload|lire|or[cg]e)|g(?:r(?:idwork|a)|4)|keywords|onpro|p(?:ass|eo)|raily|t(?:arget|ive|raks)|ver)|umpimpin)|leyads|yagundem)|e(?:aowsxneps|bo|ndocash|pwrite|t(?:goodgirl|ic-partner)s)|g(?:a(?:cpm|popads|tronmailer)|base)|h0f1b|in(?:eserver|list)|l(?:low(?:ads|tin)|qdjqiekcv)|me\.smhlmao|n(?:epe|iald|t(?:ad|eret))|pchnbjsrik|r(?:aad2\.blogspot|c(?:henta|uras))|ssagespaceads|t(?:a(?:4-group|ffiliation|pelite|rtmoney(?:\.met-art)?|verti(?:sing|zer))|hodcash|odoroleta24h)|ubonus|viodisplayads|ya41w7|z(?:imedi|a)a)|f(?:eed\.newzfind|lkgrgxadij|mikwfdopmiusbveskwmouxvafvzurvklwyfamxlddexgrtci|ryftaguwuv|t(?:bfgcusnzl|racking)|uebmooizdr)|g(?:cash(?:gate)?|id|platform|rxsztbcfeg)|h(?:aafkoekzax|cttlcbkwvp|fvtafbraql|ghzpotwnoh|rfhwlqsnzf|wxckevqdkx)|i(?:-mi-fa|adbbnreara|bebu|c(?:roadinc|txtwtjigs)|kdvucquacd|l(?:abra|l(?:ennialmedia|ionairesurveys))|n(?:dlytix|odazi|take)|rago|stands|va|xpo|zmhwicqhprznhflygfnymqbmvwokewzlmymmvjodqlizwlrf)|jujcjfrgslf|k(?:ceizyfjmmq|fzovhrfrre|hoj|mxovjaijti|pdquuxcnhl|t(?:mobi|seek)|yzqyfschwd|zynqxqlcxk)|l(?:axgqosoawc|bzafthbtsl|grrqymdsyk|kqusrmsfib|mjxddzdazr|nadvertising|stoxplovkj)|m(?:a(?:axx|dsgadget|igzevcfws)|cltttqfkbh|d(?:cibihoimt|ifgneivng)|e(?:ddgjhplqy|sheltljyi)|gads|ismm|knsfgqxxsg|nridsrreyh|o(?:jdtejhgeg|ndi|ptional)|vcmovwegkz|webhandler\.888|ygcnboxlam)|n(?:etads|jgoxmx|usvlgl|yavixcddgx|zimonbovqs)|o(?:8mwxi1|a(?:dlbgojatn|tads)|b(?:a(?:lives|tor[iy])|bobr|day|fox|gold|i(?:co(?:nt|w)|devdom|fobi|kano|le(?:-10|metrics\.appspot|r(?:affles|evenu))|right|sla|yield)|orobot|st(?:itialtag|rks)|trks|ytrks)|d(?:el(?:egating|sgonebad)|ifis?cans)|engage|ffsets|gointeractive|hcafpwpldi|j(?:iva|oaffiliates)|konocdn|lqvpnnlmnb|n(?:dominishows|e(?:tizer101|y(?:4ads|co(?:ntrol|smos)|tec|whisper))|soonads)|o(?:kie1|termedia|xar)|p(?:ilod|vkjodhcwscyudzfqtjuwvpzpgzuwndtofzftbtpdfszeido)|quxotvyuoo|r(?:e(?:gamers|hitserver|playerz|share)|itava)|s(?:dqxsgjhe|elat)s|t(?:ominer|tnow)|ucitons)|p(?:3(?:ger|ix|vicio)|k01|mcash|nrs|oboqvqhjqv|rezchc|ytdykvcdsg|zuzvqyuvbh)|q(?:cnrhxdsbwr|phkzwlartq|wkqapsrgnt)|r(?:fveznetjtp|kzgpbaapif|nbzzwjkusv|qsuedzvrrt|skincash)|s(?:\.wsex|iegurhgfyl|quaredproductions|rwoxdkffcl|ypr|zfmpseoqbu)|t(?:\.sellingrealestatemalta|agmonetization[abc]|bsdhzpikjt|lieuvyoikf|o(?:\.mediatakeout|or)|r(?:css|ee)|tyfwtvyumc)|u(?:atrasec|eqzsdabscd|jap|k(?:wonagoacampo|xblrkoaaa)|lti(?:adserv|view)|n(?:ically|pprwlhric)|riarw|si(?:c-desktop|k-a-z)|tary)|v(?:juhdjuwqtk|qinxgp|zmmcbxssgp)|w(?:lucuvbyrff|qkpxsrlrus)|x(?:popad|s(?:ads|uikhqaggf)|t(?:ads|cafifuufp))|y(?:-best-jobs|a(?:ffiliates|wesomecash)|c(?:asinoaccount|lickbankad)s|d(?:irtyhobby|reamads)|frvfxqeimp|infotopia|linkbox|nativeads|precisionads|rdrcts|s(?:a(?:feurl|gagame)|earch-online|taticfiles)|thi(?:mna|ngs)|v(?:ads|oicenation))|z(?:28ismn|betmhucxih|guykhxnuap|khhjueazkn))|n(?:1(?:30|61)adserv|388hkxg|673oum|9nedegrees|a(?:bbr|grande|hvyfyfpffm|iadexports|m(?:eads|jixxurjam)|nigans|stydollars|t(?:ive(?:ads(?:feed)?|xxx)|oms|ure-friend)|ughtyplayful|vaxudoru|wdwtocxqru)|b(?:b(?:ljlzbbpck|vpxfxnamb)|hubocsduzn|jmp|kwnsonadrb|mffortfyyg|rwtboukesx|static|zionsmbgrt)|c(?:dxfwxijazn|rjsserver|spvnslmmbv)|d(?:emlviibdyc|gmwuxzxppa|kvzncsuxgx|ndptjtonhh|pegjgxzbbv|tlcaudedxz|xidnvvyvwx)|e(?:blotech|dmppiilnld|ewweeklylinsz|f(?:czemmdcqi|xtwxk)|g(?:drvgo|olist)|o(?:-neo-xeo|bux|datagroup|ffic)|palhtml|t(?:3media|-ad-vantage|avenir|liker|pondads|s(?:eer|olads)|work(?:edblogs|ice|xi))|u(?:desicmediagroup|esdate)|w(?:17write|-new-years|a(?:ds\.bangbros|gerevenue)|ideasdaily|nudecash|s(?:-whistleout\.s3\.amazonaws|\.fark|adst(?:ream)?|exbook|gator|harecounts|letter\.outbrain|m(?:axfeednetwork|emory)|togram|whip)|yorkwhil)|x(?:a(?:ge|c)|t(?:door|landingads|mobilecash)))|f(?:dntqlqrgwc|n(?:iziqm|ssadfhxov)|sqrijauncb|xusyviqsnh)|g(?:ecity|lmedia|mckvucrjbnyybvgesxozxcwpgnaljhpedttelavqmpgvfsxg|nofhussaao|uooqblyjrz)|h(?:bklvpswckx|eanvabodkw)|i(?:c(?:eratios|h(?:1eox|ead(?:generator|s)))|djppokmlcx|fyalnngdhb|kkiscash|tmus|viemwsmiaq|ytrusmedia|zation)|j(?:cdmsgjbbbz|jybqyiuotl|maq)|k(?:k(?:31jjp|reqvurtoh)|livofyjkbt|redir|yngrtleloc)|l(?:fqbfwbfovt|ljrfvbnisi)|m(?:a(?:afswoiecv|yxdwzhaus)|hhnyqmxgku)|n(?:bestmblotl|igsvoorscmgnyobwuhrgnbcgtiicyflrtpwxsekldubasizg|jiluslnwli|vjigagpwsh)|o(?:b(?:leppc|setfinvestor)|kswnfvghee|mlxyhfgeny|n(?:issue|kads)|olablkcuyu|r(?:e(?:ntisol|tia)|mkela|thmay)|thering|v(?:a(?:dun|revenu)e|ember-lax)|wspots)|p(?:auffnlpgzw|eanaixbjptsemxrcivetuusaagofdeahtrxofqpxoshduhri|gdqwtrprfq|ikrbynhuzi|lrzxvyrhiq|vos)|q(?:lkwyyzzgtn|uchhfyex)|r(?:e(?:ctoqhwdhi|late)|fort|gpugas|nma|yvxfosuiju)|s(?:azelqlavtc|c(?:ash|ontext)|dsvc|fwads|g\.symantec|martad|pmotion)|t(?:ent|n(?:dubuzxyfz|lawgchgds)|urveev)|u(?:a(?:fguy|loghy|yfpthqlkq)|btjnopbjup|cqkjkvppgs|ihcvbixjea|llenabler|m(?:ber(?:ium|threebear)|mobile)|nsbvlzuhyi|s(?:cutsdqqcc|eek|hflxucofk)|vidp)|v(?:a(?:dn|jxoahenwe)|mjtxnlcdqo|p2auf5|qsjdvgqnyk)|w(?:dufyamroaf|f(?:drxktftep|halifax)|irvhxxcsft)|x(?:cxithvcoeh|tck)|y(?:admcncserve-05y06a|bpurpgexoe|mphdate|qogyaflmln)|z(?:cpdaboaayv|phoenix|xriltfmrpl))|o(?:2live|333o|\.gweini|a(?:adkiypttok|internetservices|licqudnfhf|wleebf|xwtgfhsxod|zojnwqtsaj)|b(?:e(?:isantcloddishprocrustes|sw|us)|jects(?:\.tremormedia|ervers)|qtccxcfjmd|thqxbm|uuyneuhfwf|vbubmzdvom|xwnnheaixf)|c(?:eanwebcraft|ipbbphfszy|l(?:as(?:erver|rv)|sasrv|us)|tagonize|y(?:dwjnqasrn|hpouojiss)|zvtbskwbmj)|d(?:b\.outbrain|omcrqlxulb|p(?:jcjreznno|lbueosuzw)|sljzffiixm|tcspsrhbko|zb5nkp)|e(?:h(?:jxqhiasrk|posan)|wscpwrvoca)|f(?:a(?:jzowbwzzi|pes)|bqjpaamioq|fer(?:forge|palads|s(?:-service\.cbsinteractive|erve|quared|syndication\.appspot))|g(?:apiydisrw|hrodsrqkg)|jampfenbwv|muojegzbxo)|g(?:ercron|gifinogi|qeedybsojr|u(?:lzxfxrmow|orftbvegb))|h(?:ecnqpldvuw|m(?:casting|vrqomsitr|write)|v1tie2)|i(?:ffrtkdgoef|hbs34|psyfnmrwir|ramtfxzqfc|urtedh)|j(?:ngisbfwwyp|vwpiqnmecd)|k(?:a(?:eetrzjyvx|sfshomqmg)|biafbcvoqo|gfvcourjeb|muxdbq|nmanswftcd|vmsjyrremu)|l(?:ctpejrnnfh|dership|thlikechgq|wopczjfkng)|m(?:click|g2|nitagjs|pzowzfwwfc|qygrfokyxg)|n(?:ads|cl(?:asrv|ick(?:max|pulse)|kds)|e(?:dmp|fontapi91283|networkdirect|s(?:ignal|pot))|gkidcasarv|hercam|jqfyuxprnq|kcjpgmshqx|line(?:-adnetwork|\.mydirtyhobby|c(?:a(?:reerpackage|shmethod)|inemavideonow))|rampadvertising|scroll|toplist|v(?:ertise|hilwrqdgd))|o(?:dode|ecyaauiz|f(?:ophdrkjoh|te)|nenbygymsl|s(?:4l|djdhqayjm)|tloakr|uggjayokzx|yhetoodapmrjvffzpmjdqubnpevefsofghrfsvixxcbwtmrj)|p(?:e(?:n(?:adserving|cdb8450[789]|downloadmanager|etray|fonts(?:47372|937443)|profilemeta|registrationprjy|x(?:adexchang|enterpris)e|x)|ratical)|hpbseelohv|inionbar|pcgcqytazs|t(?:-intelligence|eama|i(?:m(?:atic|izesocial|onk)|n(?:emailpro|monster))|kit|nmn?str)|yisszzoyhc|zdgga2kkw6yh)|qmjxcqgdghq|r(?:a(?:rala|tosaeron)|bengine|d(?:diltnmmlu|ermc|ingly)|mnduxoewtl|szajhynaqr|zsaxuicrmr)|s(?:bblnlmwzcr|iaffiliate|lzqjnh|preymedialp|rto|sdqciz|uq4jc)|t(?:her(?:profit|sonline)|pyldlrygga|rfmbluvrde|vetus)|u(?:b(?:ibahphzsz|riojtpnps)|gfkbyllars|lxdvvpmfcd|runlimitedleads|t(?:ils\.f5biz|ster))|v(?:alpigs|e(?:ld|r(?:haps|sailor|tur[es]))|fbwavekglf|gzbnjj|oczhahelca|rdkhamiljt|zmelkxgtgf)|w(?:ihjchxgydd|lmjcogunzx|odfrquhqui|qobhxvaack|rqvyeyrzhy|wewfaxvpch)|x(?:a(?:do|nehlscsry)|cluster|sng|tracking|ybe)|y(?:rgxjuvsedi|trrdlrovcn|zsverimywg)|z(?:e(?:lmedikal|rtesa)|hwenyohtpb|o(?:ltyqcnwmu|nemedia)|vzmgvssaou|wtmmcdglos|ymwqsycimr))|p(?:2ads|7(?:hwvdb4p|vortex)|-(?:advg|comme-performance|digital-server)|\.smartertravel|a(?:c(?:ific-yield|litor)|ds(?:del(?:ivery)?|tm)|ge(?:rage|sinxt)|i(?:dsearchexperts|nterede)|kranks|lzblimzpdk|n(?:\.dogster|achetech|oll|therads)|perg|r(?:dous|kingpremium|t(?:ner(?:\.(?:alloy|e-conomic|googleadservices|popmog|video\.syndication\.msn)|cash|earning|s\.(?:betus|yobt))|y(?:casino|p(?:artners|oker)))|write)|s(?:-rahav|si(?:onfruitads|ve-earner))|utaspr|y(?:dotcom|gear|perpost|rfnvfofeq))|b(?:butsvpzqza|nnsras|yet)|c(?:ash\.(?:globalmailer5|imlive)|e(?:brrqydcox|qybrdyncq))|d(?:baewqjyvux|fcomplete|ippmqmrkvn|n-[12]|zqwzrxlltz)|e(?:2k2dty|a(?:cepowder|kclick)|cash|e(?:lawaymaker|mee|r39|wu(?:ranpdwo|vgdcian))|n(?:nynetwork|uma)|p(?:ipo|perjamnetwork)|qdwnztlzjp|r(?:cularity|edest|f(?:creatives|ectmarket|ormanc(?:e(?:-based|adexchange)|ingads)|b)|manyb|severed)|xu|zrphjl)|f(?:eretgf|ibgoaqdzbp|jwtzlfaivp)|g(?:mediaserve|partner|ssl|uxoochezkc|xciwvwcfof)|h(?:armcash|eedo|il(?:bard|osophe)re|onespybubble)|i(?:ano(?:-media|buyerdeals|ldor)|c(?:admedia|bucks|kytime|st(?:unoar|i)|tureturn)|ercial|faojvaiofw|n(?:ballpublishernetwork|ddeals|khoneypots)|oneeringad|p(?:-pip-pop|aoffers|eaota|pity)|ticlik|vot(?:almedialabs|runner)|wwplvxvqqi|x(?:azza|el(?:litomedia|track66)|jqfvlsqvu|xur))|j(?:ffrqroudcp|nrwznmzguc|zabhzetdmt)|k(?:klpazhqqda|mzxzfazpst|o(?:ugirndckw|yiqjjxhsy)|qbgjuinhgpizxifssrtqsyxnzjxwozacnxsrxnvkrokysnhb|tgargbhjmo)|l(?:a(?:n(?:n(?:iver|to)|taosexy)|t(?:form\.(?:foursquare|linkedin|tumblr)|inumadvertisement)|xo|y(?:boymethod|ukinternet))|csedkinoul|e(?:as(?:esavemyimages|teria)|eko|nomedia|x2)|g(?:alhmhkhzy|dhrvzsvxp)|ista|lddc|muxaeyapbqxszavtsljaqvmlsuuvifznvttuuqfcxcbgqdnn|o(?:cap|px)|quutxxewil|u(?:g(?:err|rush)|s(?:hlikegarnier|one\.google))|wvwvhudkuv|xserve|yftjxmrxrk)|m(?:\.web|gmbpuiblak|lcuxqbngrl|pubs|srvr)|n(?:ads|fpithmmrxc|jeolgxsimj|mkuqkonlzj|oss|u(?:nijdm|ymnyhbbuf))|o(?:a(?:urtor|zvacfzbed)|d\.(?:manplay|xpress)|int(?:clicktrack|roll|s2shop)|ke(?:rstrategy|traff)|l(?:a(?:nders|wrg)|ephen|imantu|luxnetwork|montventures|ydarth)|ntypriddcrick|onproscash|p(?:6\.adultfriendfinder|-rev|ander|cp[mv]|earn|m(?:a(?:jo|rke)r|og|yads?)|onclick|pysol|s(?:\.freeze|ads|uperbbrands)|tm|u(?:l(?:aritish|is(?:engage)?)|nder(?:total|zone|z)|p(?:domination|via))|zkvfimbox)|r(?:kolt|n(?:-(?:hitz|site-builder)|attitude|conversions|deals|earn|kings|leep|oow|t(?:agged|rack))|table-basketball)|st(?:ernel|release)|t(?:cityzip|d\.onlytease|pourrichordataoscilloscope)|urmajeurs|wer(?:jobs|links|marketing))|p(?:c(?:-direct|indo|linking|trck|webspy)|jjbzcxripw|qfteducvts|uuwencqopa|xrlfhsouac|zfvypsurty)|q(?:dysthxgrpz|oznetbeeza|waaocbzrob)|r(?:a(?:ctively|eicwgzapf)|e(?:cisionclick|dict(?:ad|ivadnetwork)|ferences\.truste|miumhdv|nvifxzjuo|s(?:sly|tadsng)|xista)|ggimadscvm|i(?:c(?:e(?:dinfo|spider)|kac)|maryads|tesol|v(?:a(?:cy(?:4browsers|-policy\.truste|protector)|te(?:webseiten|4))|y)|zel)|jcq|m(?:-native|obiles)|o(?:-pro-go|adsdirect|btn|d\.untd|f(?:figurufast|i(?:le\.bharatmatrimony|tpeelers))|gram3|jectwonderful|ludimpup|mo(?:4partners|\.(?:blackcrush|cams|galabingo|mydirtyhobby|pegcweb|ulust|vador)|benef|cionesweb|s(?:\.(?:gpniches|meetlocals|wealthymen)|hq\.wildfireapp)|t(?:ed|ion(?:-campaigns|\.monster|s\.newegg))|webstar)|p(?:el(?:l(?:er(?:ad|pop)|lerad)|plu)s|goservice|ranok)|rentisol|sperent|tect-x|vide(?:plan|r-direc)t|wlerz|ximic)|pops|qivgpcjxpp|scripts|wlzpyschwi)|s(?:clicks|dnlprwclz|e(?:qcs05|rhnmbbwexmbjderezswultfqlamugbqzsmyxwumgqwxuerl)|hcqtizgdlm|m(?:a0[123]|lgjalddqu)|rbrytujuxv)|t(?:classic|iqsfrnkmmtvtpucwzsaqonmvaprjafeerwlyhabobuvuazun|mzr|oflpqqqkdk|p2[24]|rfc|vjsyfayezb|webcams)|u(?:b(?:-fit|\.(?:aujourdhui|dreamboxcart)|directe|exchange|gears|l(?:i(?:cityclerks|sh(?:er(?:\.monster|adnetwork)|4)|ted|r)|y)|mine|nation|rain|ted)|gklldkhrfg|html|l(?:pyads|se(?:360|mgr))|n(?:chtab|lkhusprgw)|ogotzrsvtg|readexchange|s(?:bamejpkxq|erving|h(?:2check|a(?:ngo|ssist)|crew|engage|ify|woosh)|s(?:l(?:11|4)|yeatingclub(?:cams)?))|t(?:anapartners|kjter|rr[2349])|zzlingfall)|v(?:iztjecuczh|oplkodbxra|ptwhhkfmog|tcntdlcdsb)|w(?:izshlkrpyh|ynoympqwgg|zn9ze)|x(?:3792|arwmerpavfmomfyjwuuinxaipktnanwlkvbmuldgimposwzm|gkuwybzuqz|ktkwmrribg|l2015x1|stda)|y(?:dpcqjenhjx|iel2bz)|z(?:aasocba|cpotzdkfyn|gchrjikhfyueumavkqiccvsdqhdjpljgwhbcobsnjrjfidpq|kpyzgqvofi|uwqncdai))|q(?:1(?:media(?:hydraplatform)?|xyxm89)|3sift|a(?:d(?:serv(?:ic)?e|tkdlqlemf)|hajvkyfjpg|j(?:aohrcbpkd|jyxsifzfe)|nzlmrnxxne|rqyhfwient|ulinf|waqcurthru|zzzxwynmot)|bfvwovkuewm|c(?:lxheddcepf|ogokgclksa|pegxszbgjm)|d(?:lhprdtwhvgxuzklovisrdbkhptpfarrbcmtrxbzlvhygqisv|mil)|e(?:embhyfvjtq|kmxaimxkok|nafbvgmoci|r(?:lbvqwsqtb|tewrt|yz)|vivcixnngf|wa33a)|f(?:hjthejwvgm|m(?:bgvgvauvt|cpclzunze)|r(?:hhvbfofbt|pehkvqtyj))|graprebabxo|hqofqeivtno|i(?:jffgqsbkii|ktwikahncl|nsmmxvacuh|qrguvdhcux|remmtynkae|urgfxexsmp|xlpaaeaspr)|j(?:mearsroiyn|skosdsxanp)|k(?:dywnhtmpgc|lhtphiphni|nuubmfneib|pwdakgxynv|uprxbmkeqp)|l(?:jczwei|ugrmjsncbe)|mamdjtoykgl|n(?:dqwtrwguhv|polbme|qrmqwehcpa|rzmapdcc|s(?:dwkjctkso|r))|o(?:iowocphgjm|lnnepubuyz|twtnckqrke|xsriddwmqx)|p(?:cyafunjtir|iyjprptazz)|q(?:apezviufsh|byfhlctzty|gtevtjnpwd|vatwaqtzgp|ylzyrqnewl)|r(?:csppwzjryh|egqtqtuisj|ksjrjppkam|lsx|ozsnmc)|s(?:ervz|giqllpfthg|wotrk)|t(?:jafpcpmcri|smzrnccnwz)|u(?:a(?:godex|izzywzluk|litypageviews|nt(?:omcoding|umads))|dpdpkxffzt|e(?:nsillo|ronamoro|st(?:ionmarket|us)|xotac)|i(?:ckcash(?:500|-system)|nstreet)|lifiad)|v(?:euxmbhbhmg|sbroqoaggw)|w(?:bnzilogwdc|emfst|hkndqqxxbq|qqliynxufj|r(?:fpgf|kigqtgygc)|zmje9w)|x(?:bnmdjmymqa|nniyuuaxhv|xyzmukttyp)|y(?:h7u6wo0c8vz0szdhnvbn|vpgddwqynp|zoejyqbqyd)|z(?:cpotzdkfyn|sccm|xtbsnaebfw))|r(?:3seek|42tag|66net|7e0zhv8|a(?:bilitan|ck-media|d(?:eant|i(?:calwealthformula|usmarketing))|ga(?:zzeinvendit|p)a|i(?:ggy|n(?:bowtgx|wealth))|mctrlgate|pt|wasy|z(?:-raz-mataz|write))|b(?:dmtydtobai|fxurlfctsz|grlqsepeds|ppnzuxoatx|rbvedkazkr|sfglbipyfs|uowrinsjsx|vfibdsouqz|xtrk|yjirwjbibz)|c(?:jthosmxldl|kxwyowygef|nkflgtxspr|urn|zagufykvpw)|d(?:dywd|i(?:ge|kvendxamg|ul)|lynbosndvx|qyasdstllr|srv|zxpvbveezdkcyustcomuhczsbvteccejkdkfepouuhxpxtmy)|e(?:a(?:c(?:h(?:local|mode|word)|tx)|drboard|l(?:datechat|itycash|lifecam|m(?:atch|edia)|securedredir(?:ect)?)|spans)|c(?:entres|omendedsite)|d(?:courtside|i(?:rect(?:native|optimizer|popads)|skina)|lightcenter|p(?:eepers|ineapplemedia)|rosesisleornsay|uxmediagroup)|e(?:binbxhlva|lcentric|vive(?:global|network|pro))|f(?:ban|erback)|g(?:ardensa|urgical)|hyery|itb|klam(?:port|z)|l(?:atedweboffers|e(?:star|vanti)|ytec)|mintrex|n(?:contreanna|ewads)|p(?:aynik|efwairfkx|mbuycurl|r(?:ak|essina))|rtazmgduxp|s(?:ellerratings|i(?:deral|mler\.randevum)|pondhq|ult(?:links|s(?:page|z)))|t(?:argeter|kow|oxo|rayan)|v(?:2pub|content|depo|enue(?:giants|mantra)?|i(?:ewdollars|vestar)|mob|nuehub|okinets|res(?:da|ponse))|war(?:d(?:isement|s(?:affiliates|tyle))|tific)|xbucks)|f(?:f(?:jopgiuhsx|qzbqqmuhaomjpwatukocrykmesssfdhpjuoptovsthbsswd)|gsi|v(?:icvayyfsp|oort)|yphhvcczyq)|g(?:advert|mgocplioed|z(?:pseubgxho|tepyoefvm))|h(?:erser|f(?:ntvnbxfxu|vzboqkjfmabakkxggqdmulrsxmisvuzqijzvysbcgyycwfk)|gersf|own|ythm(?:content|xchange))|i(?:aetcuycxjz|bbon\.india|c(?:-ric-rum|ead|h(?:media(?:247|\.yahoo)|webmedia)|k-rick-rob)|fwhwdsqvgw|hzsedipaqq|ng(?:revenue|tone(?:match|partn)er)|owrite|p(?:bwing|plead)|tzysponge|v(?:cash|erbanksand)|xaka)|j(?:ljndfgnkcu|n(?:cckyoyvtu|kpqax)|pqbishujeu|yihkorkewq)|k(?:elvtnnhofl|lluqchluxg|rpvzgzdwqaynyzxkuviotbvibnpqaktcioaaukckhbvkognu|vpcjiuumbk)|l(?:lvjujeyeuy|qvyqgjkxgx|ypbeouoxxw)|m(?:-tracker|bilhzcytee|dzbqggjskv|etgarrpiouttmwqtuajcnzgesgozrihrzwmjlpxvcnmdqath|gxhpflxhmd|jxcosbfgyl|kflouh|lzgvnuqxlp|xads)|n(?:frfxqztlno|hkptivhwhc|rbvhaoqzcksxbhgqtrucinodprlsmuvwmaxqhxngkqlsiwwp|yuhkbucgun)|o(?:a(?:dcomponentsdb|stedvoice)|botadserver|cket(?:games|yield)|gueaffiliatesystem|i(?:a\.hutchmedia|charger|rocket)|kt|m(?:ance-ne|etroi)t|t(?:atingad|orads)|u(?:ghted|lettebotplus)|vion|xyaffiliates|yal-cash)|p(?:czohkv|speqqiddjm|ulxcwmnuxi)|qt(?:dnrhjktzr|hkhiuddlg)|r(?:rdddbtofnf|scdnsfunoe|yodgeerrvn)|s(?:cgfvsximqdpowcmruwitolouncrmnribnfobxzfhrpdmahqe|jpgfugttlh|s(?:-info|\.dtiserv|pump)|vxipjqyvfs)|t(?:ax\.criteo|b(?:pops?|system)|u(?:fxsncbegz|sxaoxemxy)|xunghyiwiq)|u(?:a(?:mupr|nd(?:org|r))|biconproject|ckusschroederraspberry|gistratuan|kplaza|le(?:claim\.web\.fc2|rclick)|mmyaffiliates|n(?:adtag|etki|reproducerow|slin)|o(?:vcruc|ypiedfpov)|ssianlovematch|zttiecdedv)|v(?:nc72k|oxndszxwmo|t(?:life|track)|zudtgpvwxz)|w(?:eqvydtzyre|pads|tvvdspsbll)|x(?:i(?:crihobtkf|sfwvggzot)|sazdeoypma|thdr|uqpktyqixa)|y(?:a\.rockyou|lnirfbokjd|minos)|z(?:cmcqljwxy|giiioqfpn)y)|s(?:11clickmoviedownloadercom\.maynemyltf\.netdna-cdn|2d6|72jfisrt3ife|\.adroll|a(?:2xskt|\.entireweb|ambaa|fe(?:cllc|li(?:nktracker|stextreme))|gulzuyvybu|i(?:l(?:thru|znsgbygz)|puciruuja)|jhiqlcsugy|l(?:e(?:file\.googlecode|snleads)|tamendors|vador24)|m(?:lmqljptbd|vaulter)|oboo|pvummffiay|sc(?:dn|entral)|t(?:greera|uralist)|uispjbeisl|vvysource|y(?:adcoltd|media))|b(?:affiliates|cpower|ftffngpzwt|hnftwdlpbo)|c(?:an(?:medios|scout)|b(?:nvzfscfmn|ywuiojqvh)|e(?:nesgirls|uexzmiwrf)|gyndrujhzf|mffjmashzc|o(?:otloor|respro|utle)|r(?:atch(?:affs|mania)|ibol)|u(?:nd|wbelujeeu)|xxbyqjslyp)|d(?:emctwaiazt|f(?:kjndskjfkj|lxcvety)|qspuyipbof)|e(?:a(?:l(?:\.(?:alphassl|digicert|godaddy|networksolutions|qualys|st(?:arfieldtech|ellaservice)|thawte|verisign|websecurity\.norton)|server\.trustwave)|rch(?:\.twitter|peack))|c(?:coads|ondstreetmedia|ret(?:behindporn|media|rune)|ur(?:e(?:-softwaremanager|\.komli|intl|p2p|websiteaccess)|it(?:ain|ymetrics)))|d(?:oparking|uctionprofits)|e(?:gamese|kbang|mybucks|thisinaction)|hiba|i(?:qobwpbofg|tentipp)|kindo|l(?:ectablemedia|l(?:health|oweb))|manticrep|n(?:dp(?:tp|ulse)|kinar|zari)|pulchralconestogaleftover|r(?:i(?:albay|end|ousfiles)|v(?:e(?:-sys|\.(?:prestige|williamhill)casino|bom|dby(?:-buysellads|\.yell|adbutler|openx)|meads|quake|r(?:140|\.freegamesall))|ing(?:-system|clks)))|sxc|t(?:newsonedayc|ravieso|tleships)|v(?:4ifmxa|endaystart)|x(?:-journey|datecash|flirtbook|i(?:ba|ntheuk|tnow)|list|money|o(?:le|pages)|playcam|search(?:com)?|t(?:racker|ubecash)|vertise|y(?:-ch|\.fling)))|f(?:aprgtgcguh|cckxdgfgzo|mziexfvvru|pkwhncpllt|zcbcrwxhic)|g(?:fcsnwegazn|zsviqlvcxc)|h(?:a(?:kamech|re(?:-server|\.loginradius|aholic|d\.juicybucks|gods|results|th(?:is|rough)|xy))|ie(?:k1ph|ld\.sitelock)|n(?:mhrlcredd|oadlvpylf)|o(?:apinh|kala|ogloonetwork|p(?:alyst|ilize|pingads|runner|socially|zyapp)|wyoursite)|qads|vdvzydgryx)|i(?:amzone|ccash|delinesapp|erra-fox|jlnueeertd|l(?:rfbopbobw|stavo)|m(?:ilarsabine|p(?:io|l(?:einternetupdate|yhired|y))|usangr|vinvo)|n(?:ceresofa|glesexdates|iature)|ogczwibswm|rfad|t(?:e(?:brand|encore|s(?:cout(?:adserver)?|ense-oo)|three)|tiad)|wtuvvgraum)|j(?:gklyyyraghhrgimsepycygdqvezppyfjkqddhlzbimoabjae|osteras|pexaylsfjnopulpgkbqtkzieizcdtslnofpkafsqweztufpa|tevvoviqhe)|k(?:eettools|i(?:mlinks|nected)|knyxzaixws|oovyads|y(?:activate|s(?:crpr|a))|zhfyqozkic)|l(?:acaxy|e(?:eknoteboxcontent\.sleeknote|ndastic)|fpu|i(?:ckdeals\.meritline|kslik|m(?:spots|trade)|nse)|mmjkkvbkyp|o(?:altbyucrg|peaota))|m(?:a(?:click|rt(?:-feed-online|ad(?:server|tags)|devicemedia|ertravel|icon\.geotrust|targetting|webads|yads))|ethgiar|i(?:l(?:e(?:red|ycentral)|ingsock|yes4u)|ntmouse)|owtion|pgfx|r(?:qvdpgkbvz|t-view)|s-(?:mmm|xxx)|utty)|n(?:a(?:ck-media|kesort|p(?:surveys|widget)|p)|cpizczabhhafkzeifklgonzzkpqgogmnhyeggikzloelmfmd|e(?:akystam|tddbbbgb)p|fqpqyecdrb|gjaetjozyr|hfjfnvgnry|jhhcnr|pevihwaepwxapnevcpiqxrsewuuonzuslrzrcxqwltupzbwu)|o(?:-excited|advr|c(?:hr|i(?:al(?:annex|birth|elective|lypublish|m(?:arker|edia(?:buttons|tabs)?)|oomph|re(?:ach|st)|s(?:ex|park)|twist|vibe|9)|ety6|o(?:cast|mantic))|kjgaabayf)|d(?:ahea|u)d|ft(?:4dle|onicads|popads|ware(?:piset|s2015))|i(?:buuqqhuyo|egibhwvti|rqzccdtyk)|k(?:anffuyinr|itosa)|l(?:a(?:pok|rmos)a|ocpm|utionsadultes)|nobi|osooka|phiasearch|ssxjmotqqs|vqylkbucid)|p(?:a(?:mualfr|rkstudios)|bflxvnheih|cwm|e(?:akol|c(?:ificmedia|tato|ulese)|e(?:d(?:network(?:14|6)|shiftmedia)|b)|reminf)|frlpjmvkmq|here\.outbrain|i(?:ceworks|llvacation|nbox\.freedom)|l(?:azards|inky|ut)|mxs|o(?:a-soard|mwstrgood|n(?:gecell|sor(?:edtweets|mob|palace|select))|rts(?:lovin|yndicator)|t(?:rails|tt|xc(?:dn|hange))|utable)|r(?:awley|intrade|oose)|unkycash)|q(?:2trk2|nezuqjdbhe|tsuzrfefwy|u(?:arterun|eeder)|web)|r(?:fizvugkheq|i(?:aqmzx|zwhcdjruf)|ksyzqzcetq|ppykbedhqp|v(?:2trking|\.yavli|pub)|xgnzdkjucr)|s(?:dphmfduwcl|jhkvwjoovf|l(?:2anyone4?|-services|boost|checkerapi|oemwiszaz)|sjohomoapt|volkkihcyp)|t(?:\.ipornia|a(?:cka(?:dapt|ttacka)|lesplit|ndartads|r(?:gamesaffiliate|layer|t(?:appexchange|ede|pagea|raint|webpromo))|t(?:e(?:cannotice|lea)d|ic\.delicious|s(?:mobi|trackeronline)))|bg8kgm876qwt|e(?:althlockers|epto|ncef|p(?:-step-g|keyd)o)|i(?:ck(?:coinad|yadstv)|pple|rshakead)|nvgvtwzzrh|or(?:e\.lavasoft|myshock|ystack)|r(?:eam(?:ate(?:access)?|d(?:efenc|ownloadonlin)e)|i(?:kead(?:cdn\.s3\.amazonaws)?|psaver)|u(?:cturesofa|q))|yld-by)|u(?:a(?:lzmze|r(?:biard|tings)|valds)|b(?:emania|missing|scriptiongenius)|cceedscene|fzmohljbgw|ggesttool|ite(?:6ixty6ix|smart)|lidshyly|n(?:mcre|nysmedia)|onvyzivnfy|p(?:arewards|er(?:adexchange|i(?:nterstitial|ppo)|loofy|sitetime|widget-assets\.gowatchit)|p(?:ly(?:\.upjers|frame)|rent)|remeadsonline)|r(?:geprice|vey(?:-poll|\.constantcontact|end|gizmo|monkey|s(?:paid|tope)))|thome|wadesdshrg)|v(?:apqzplbwjx|jloaomrher|nhdfqvhjzn|rsqqtj)|w(?:1block|2block|an-swan-goose|bdds|ckuwtoyrklhtccjuuvcstyesxpbmycjogrqkivmmcqqdezld|e(?:etstudents|len)|gvpkwmojcv|i(?:shu|tchadhub)|oop|twtbiwbjvq|ualyer)|x(?:lzcvqfeacy|prcyzcpqil|tzhwvbuflt)|y(?:dnkqqscbxc|mbiosting|n(?:c(?:edvision|ronex)|dicate(?:\.p(?:ayloadz|urch)|dsearchresults)|erpattern)|orlvhuzgmdqbuxgiulsrusnkgkpvbwmxeqqcboeamyqmyexv|rnujjldljl)|z(?:jgylwamcxo|nxdqqvjgam|vzzuffxatb|y(?:ejlnlvnmy|nlslqxerx)))|t(?:3(?:q7af0z|sort)|7row|a(?:b(?:eduhsdhlkalelecelxbcwvsfyspwictbszchbbratpojhlb|oola(?:syndication)?)|c(?:astas|rater|ticalrepublic)|elsfdgtmka|fmaster|g(?:\.regieci|cade|junction|s(?:host|d))|il(?:pdulprk|swee)p|kensparks|l(?:aropa|k-blog)|m(?:mfmhtfhut|qqjgbvbps)|ngozebra|odggarfrmd|p(?:ad|ihmxemcksuvleuzpodsdfubceomxfqayamnsoswxzkijjmw|joyads)|qyljgaqsaz|r(?:dangro|get(?:\.vivid|adverts|ctracker|ingnow|net|point|spot))|t(?:ami-solutions|tomedia)|wgiuioeaovaozwassucoydtrsellartytpikvcjpuwpagwfv|zvowjqekha)|b(?:affiliate|jjzhkwfezt)|c(?:dikyjqdmsb|gojxmwkkgm|kofxwcaqts|rinrvfejjh|yeyccspxod)|d(?:5[568]3|cgjhfgdxfghfch)|e(?:a(?:mbetaffiliates|ser(?:net|vizio))|c(?:-tec-boom|h(?:-board|cloudtrk|norati(?:media)?))|dlrouwixqq|endestruction|k-tek-trek|lwrite|nnerlist|osredic|qceeivmpvv|r(?:a(?:creative|xhif)|r(?:a(?:adstool|click)s|ibleturkey))|s(?:chenite|tfilter)|vrhhgzzutw|x(?:asboston|t(?:onlyads|srv))|yuzyrjmrdi)|f(?:bzzigqzbax|qzkesrzttj|t(?:sbqbeuthh|wmyrkbzkf))|g(?:dlekikqbdc|ijoezvmvvl|jdebebaama|mnstr|rmzphjmvem|tmedia)|h(?:a(?:ez4sh|n(?:gasoline|kyouforadvertising)|ttoftheg)|e(?:-adult-company|adgateway|b(?:estbookies|unsenburner)|cloudtrader|echosystem|l(?:istassassin|o(?:ungenet|vebucks))|midnightmatulas|o(?:dosium|utplay)|p(?:ayporn|ornsurvey)|rewardsurvey|s(?:lingshot|ocialsexnetwork)|traderinpajamas|w(?:ebgemnetwork|heelof))|i(?:rdpartycdn\.lumovies|scdn)|nqemehtyfe|o(?:seads|ughtleadr)|rnt|sdfrgr|umbs\.sunporno|vdzghlvfoh|xdbyracswy)|i(?:583|c(?:-tic-(?:bam|toc)|rite)|d(?:altv|ytrail)|enribwjswv|gzuaivmtgo|josnqojfmv|kwglketskr|mteen|n(?:-tin-win|buadserv|grinter|ker|y(?:pass|weene))|ouqzubepuy|s(?:adama|er|sage-extension|wsdusmdig)|vlvdeuokwy|zernet)|j(?:bgiyek|k(?:ckpytpnje|enzfnjpfd)|oomo|pzulhghqai)|k(?:arkbzkirlw|eeebdseixv|fsmiyiozuo|high|oatkkdwyky|sljtdqkqxh)|l(?:d(?:adserv|xywgnezoh)|jikqcijttf|noffpocjud|pwwloqryzu|vmedia|zhxxfeteeimoonsegagetpulbygiqyfvulvemqnfqnoazccg)|m(?:d(?:cfkxcckvqbqbixszbdyfjgusfzyguvtvvisojtswwvoduhi|n2015x9)|exywfvjoei|fkuesmlpto|kbpnkruped|mpbkwnzilv|server-1|whazsjnhip)|npbbdrvwwip|o(?:boads|days(?:finder|sn)|flvbkpwxcr|k(?:-dan-host|enads)|llfreeforwarding|mekas|nefuse|ol(?:-site|bar(?:\.(?:avg|cdn\.gigya)|plex)|s\.(?:bongacams|gfcash))|p(?:-sponsor|auto10|b(?:ananaad|inaryaffiliates\.ck-cdn|ucks)|casino10|hotoffers|onefontsxy|qualitylink|relatedtopics|sy)|r(?:conpro|o(?:advertising(?:media)?|rango)|rentdeluxe|vind)|s(?:soffads|tickad)|t(?:al(?:adperformance|profitplan)|emcash|ifiquo|vsaexihbe)|ur(?:\.(?:cum-covered-gfs|mrskin)|s\.imlive)|vkhtekzrlu|wardstelephone|yhxqjgqcjo)|p(?:fnibqjrpcj|nads|ueomljcrvy|vprtdclnym)|q(?:darrhactqc|lkg)|r(?:563|a(?:ce(?:admanager|dseals\.starfieldtech)|de(?:adexchange|p(?:opups|ub)|r\.erosdlz)|f(?:firms|mag)|pasol|v(?:el(?:advertising|scream)|idia))|cbxjusetvc|dhjlszfbwk|e(?:direct|npyle)|hu?nt|i(?:admedianetwork|b(?:alfusion|utedz)|gami|mpur)|jhhuhn|k(?:alot|er|pointcloud|4)|mit|ombocrack|qbzsxnzxmf|trccl|u(?:alaid|e(?:securejump|x)|st(?:edadserver|logo)|thfulhead)|w12|y9|zi30ic)|s(?:kctmvpwjdb|uitufixxlf|whwnkcjvxf|yndicate)|t(?:daxwrryiou|gwyqmuhfhx|lmodels|zmedia)|u(?:b(?:berlo|e(?:adnetwork|dspots|mogul|replay))|enti|jbidamlfrn|mfvfvyxusz|r(?:-tur-key|anasi|bo(?:adv|fileindir)|nsocial|yvfzreolc)|sno|tvp)|v(?:ammzkprvuv|processing)|w(?:a(?:ckle|lm)|dksbsyipqa|e(?:ard|et(?:board|grid|meme|river|up))|i(?:lightsex|npinenetwork|st(?:ads|yscash)|t(?:buttons|t(?:ad|er(?:counter|forweb|icon|mysite)|his)))|jgylzydlhz|meccosyivi|nrkedqefhv|qiqiang|tad)|x(?:bvzcyfyyoy|w(?:nwvhkbtzb|zdalmamma)|xx|yxoktogdcy)|y(?:nyh|roo|zfzrjaxxcg)|zjngascinro)|u(?:1hw38x0|223o|a(?:nbalible|vqdzorwish|xdkesuxtvu)|b(?:azpxeafwjr|ercpm|hzahnzujqlvecihiyukradtnbmjyjsktsoeagcrbbsfzzrfi|opxbdwtnlf|udigital|xtoqsqusyx)|c(?:aluco|cgdtmmxota|kxjsiy|ptqdmerltn)|d(?:bwpgvnalth|rwyjpwjfeg|vbtgkxwnap)|e(?:b(?:cqdgigsid|yotcdyshk)|cjpplzfjur|r(?:hhgezdrdi|ladwdpkge)|uerea)|f(?:mnicckqyru|r(?:aton|zvzpympib))|g(?:aral|hus|lyst|xyemavfvlolypdqcksmqzorlphjycckszifyknwlfcvxxihx)|h(?:appine|fqrxwlnszw)|i(?:adserver|lknldyynwm|pjeyipoumf|qatnpooq)|j(?:dctbsbbimb|ieva|ocmihdknwj|q(?:afhcsrhyz|bxbcqtbqt)|tyosgemtnx|yyciaedxqr)|k(?:bxppjxfgna|ffjaqtxhor|jzdydnveuc|olwxqopahb|ulelead|xeudykhgdi)|l(?:ffbcunqnpv|ife17yeter|oywtmpqskx|pxnhiugynh|wsjpfxwniz)|m(?:amdmo|boffikfkoc|nsvtykkptl|qsrvdg|wsjnsvfzuo|xzhxfrrkmt)|n(?:aspajas|cumlzowtkn|d(?:ertone|ousun)|ffpgtoorpz|hardward|i(?:cast|tethecows|versityofinternetscience)|lockr|r(?:bpcqmiybu|ulymedia)|terary|ztsvrjofqp)|oarbhxfyygn|p(?:liftsearch|norma)|q(?:gloylf|htuahgfmcx|oboyvqsqpy|potqld|qgyniatjtf)|r(?:ahor9u|banairship|eace|ldelivery|p(?:ornnetwork|scavikbyv)|qxrzrphsga)|s(?:e(?:net(?:junction|passport)|rcash)|oqghurirvz|swrite|urv|xsp7v|ymycvrilyt|zpxpcoflkl)|t(?:fffrxmzuvy|okapa|rehter|ubeconverter|zpjbrtyjuj)|up(?:qrsjbxrstncicwcdlzrcgoycrgurvfbuiraklyimzzyimrq|roxhcbcsl)|v(?:akjjlbjrmx|ffdmlqwmha|msfffedzzw|xaafcozjgh)|w(?:nklfxurped|pmwpjlxblb|rzafoopcyr)|x(?:ernab|yofgcf)|y(?:fsqkwhpihm|qzlnmdtfpnqskyyvidmllmzauitvaijcgqjldwcwvewjgwfj|usewjlkadj)|z(?:b(?:boiydfzog|ciwrwzzhs)|esptwcwwmt|qtaxiorsev|reuvnlizlz))|v(?:1(?:1media|n7c)|2cigs|3g4s|a(?:c(?:nuuitxqot|write)|dpay|fmypxwomid|g(?:hwpbslvbu|ttuyfeuij)|l(?:idclick|ue(?:ad|c(?:lick(?:media)?|ommerce)))|muglchdpte|oajrwmjzxp|pedia|s(?:hoot|topped)|ultwrite)|b(?:ehjwhcbhtg|jvbjertwov|lunqrovanf|u(?:pfouyymse|qjdyrsrvi)|yefnnrswpn)|c(?:gbtlktbagb|media|ommission|wdjbbughuy)|d(?:hmatjdoyqt|lvaqsbaiok|nwtglxprwx|opia|pyueivvsuc|qarbfqauec|uswjwfcexa|vylfkwjpvw|yqcdxqvebl|ztrack)|e(?:ctor(?:pastel|stock)|eqneifeblh|gmvagvesye|jlbuixnknc|l(?:lde|ti)|mba|n(?:dexo|turead|usbux)|oxa|pcsswlpolz|r(?:s(?:ahq|etime)|t(?:amedia|icalaffiliation)|ymuchad))|f(?:asewomnmco|erwqf|kfctmtgrtq|nvsvxlgxbvndhgqqohfgdcfprvxqisiqhclfhdpnjzloctny)|g(?:ckzqudqhfr|feahkrzixa|mrqurgxlimcawbweuzbvbzxabsfuuxseldfapjmxoboaplmg|tnbvzkepbm)|h(?:atpbmitwcn|ctcywajcwv|iaxerjzbqi|m(?:engine|network)|pqxkhvjgwx|uveukirbuz|wuphctrfil)|i(?:anadserver|brantmedia|cofhozbuaf|d(?:coin|eo(?:-(?:loader|people)|adex|deals|egg|hub|l(?:ansoftware|iver|ogygroup)|plaza|sz|vfr|zr)|pay)|ew(?:clc|ivo|rtb|scout)|ndicosuite|p(?:-vip-vup|cpms|questing)|qfxgmgacxv|r(?:almediatech|sualr|tuagirlhd)|si(?:ads|blegains|t(?:\.homepagle|details|web))|uboin4|v(?:cdctagoij|etivcuggz|idcash)|xnixxer|zsvhgfkcli)|j(?:rpdagpjwyt|zttumdetao)|k(?:arvfrrlhmv|dbvgcawubn|oad|qfzlpowalv)|l(?:exokrako|nveqkifcpxdosizybusvjqkfmowoawoshlmcbittpoywblpe|ogexpert|rzhoueyoxw|tvhssjbliy|vowhlxxibn)|m(?:cpydzlqfcg|vhmwppcsvd)|n(?:adjbcsxfyt|hcxditnodg|tsm|yginzinvmq)|o(?:d(?:-cash|haqaujopg)|go[pst]ita|l(?:leqgoafcb|uumtrk3?)|odoo|pdi|tes\.buzz\.yahoo|yeurbase)|p(?:fiiojohjch|ico|klpmvzbogn|rmnwbskk|sotshujdguwijdiyzyacgwuxgnlucgsrhhhglezlkrpmdfiy|tbn|wwtzprrkcn)|q(?:aprwkiwset|fksrwnxodc|tjeddutdix)|r(?:p\.outbrain|qajyuu|stage|t\.outbrain)|s(?:20060817|4(?:entertainment|family)|erv\.bc\.cdn\.bitgravity|gherxdcfon|hsjxfjehju|3)|t(?:cquvxsaosz|h05dse|oygnkflehv|q(?:davdjsymt|mlzprsunm))|u(?:alawilk|canmoywief|lexmouotod|n(?:gle|wzlxfsogj)|pulse|vuplaza|ysooqimdbt)|vgttgprssiy|w(?:gffbknpgxe|ugfpktabed|xskpufgwww)|x(?:btrsqjnjpq|lpefsjnmws|qhchlyijwu|uhavco|vxsgut)|y(?:dlqaxchmij|ozgtrtyoms|rwkkiuzgtu|w(?:ujhsinxfa|ycfxgxqlv))|z(?:hbfwpo|mnvqiqgxqk))|w(?:00tads|3exit|\.uptolike|a(?:bxsybclllz|d(?:dr|rzbroefwd)|entchjzuwq|f(?:avwthigmc|media[356]|r(?:amedia[3578]|szmnbshq))|gershare|h(?:anda|oha|wahnetworks)|l(?:prater|terns[ae])|m(?:cash|network)|n(?:gfenxi|tatop)|p(?:loft|trick)|r(?:facco|pwrite|somnet)|t(?:\.(?:freesubdom|ipowerapps)|chformytechstuff|er(?:istian|soul)|xeoifxbjo)|ymp)|b(?:ptqzmv|qliddtojkf|sadsdel2?|tgtphzivet|vsgqtwyvjb)|c(?:absbogwfxv|gquaaknuha|oloqvrhhcf|panalytics)|d(?:bddckjoguz|cxuezpxivqgmecukeirnsyhjpjoqdqfdtchquwyqatlwxtgq|dtrsuqmqhw)|e(?:a(?:drevenue|lth-at-home-millions)|b(?:\.adblade|advertise123|c(?:am(?:bait|promotions|s)|lick(?:engine|manager))|eatyouradblocker|master\.erotik|onlinnew|s(?:e(?:curity\.norton|eds)|ite(?:alive5?|promoserver))|trackerplus|usersurvey)|ekwkbulvsy|fbjdsbvksdbvkv|gotmedia|h(?:eartit|tkuhlwsxy)|liketofuckstrangers|nsdteuy|p(?:huklsjobdxqllpeklcrvquyyifgkictuepzxxhzpjbclmcq|mmzpypfwq|zfylndtwu)|qpkntrxqzh|tpeachcash|uigcsch31|workremotely)|f(?:bqjdwwunle|iejyjdlbsrkklvxxwkferadhbcwtxrotehopgqppsqwluboc|network)|g(?:efjuno|g(?:maxxawkxu|nmbmedlmo)|lbionuopeh|partner|reatdream|ulihtuzssn)|h(?:5kb0u4|a(?:leads|ts(?:app-sharing|broadcast))|gsyczcofwf|i(?:njxmkugky|teboardnez)|kwbllcctfm|s(?:jufifuwkw|ldqctrvuk)|tsrv9|uvrlmzyvzy|zbmdeypkrb)|i(?:cxfvlozsqz|dget(?:\.(?:adviceiq|breakingburner|c(?:hipin|lipix|rowdignite)|firefeeder|imshopping|jobberman|p(?:rnewswire|ushbullet)|s(?:coutpa|tagram)|trustpilot|weibo|yavli)|bucks|cf\.adviceiq|s(?:\.(?:adviceiq|b(?:acktype|ufferapp)|d(?:igg|zone)|fccinteractive|getpocket|itunes\.apple|lendingtree|mobilelocalnews|outbrain|progrids|seekitlocal|t(?:ap(?:cdn|iture)|rustedshops|wimg))|plus))|felovers|get(?:media|studios)|jczxvihjyu|l(?:d(?:hookups|match)|liamhill)|n(?:buyer|gads|hugebonus)|orcewmylbe|pjyzwavojq|rfpvmoblpa|sepops|th(?:-binaryoption|binaryoptions)|zejdnlqwcb)|j(?:djovjrxsqx|efwuiioe123f|nkvhlgvixx)|k(?:exsfmw|g(?:aqvvwvqjg|gjmkrkvot)|hychiklhdglppaeynvntkublzecyyymosjkiofraxechigon|jcdukkwcvr|l(?:vnlkwsc3|yhvfc)|tlsedohnly)|l(?:juxryvolwc|marketing|uzajogsxoy)|m(?:hksxycucxb|jdnluokizo|mediacorp|vcxgpdgdkz|wkwubufart)|nzxwgatxjuf|o(?:lopiar|n(?:click|der(?:landads|push))|o(?:box|d-pen)|pdi|r(?:d(?:bankads|ego|getboo)|ld(?:datinghere|s(?:bestcams|earchpro)|widemailer)|th(?:athousandwords|yadvertising))|tilhqoftvl)|p(?:comwidgets|ktjtwsidcz|syjttctdnt|vvlwprfbtm)|q(?:bvqmremvgp|gaevqpbwgx|lkp|nxcthitqpf|ocynupmbad|pcxujvkvhr|qqpe|rwopgkkohk|z(?:aloayckal|orzjhvzqf))|r(?:apper\.ign|hpnrkdkbqi|ierville|m(?:cfyzl|wikcnynbk)|qjwrrpsnnm|tnetixxrmg)|s(?:-gateway|aijhlcnsqu|c(?:rsmuagezg|vmnvhanbr)|fqmxdljrknkalwskqmefnonnyoqjmeapkmzqwghehedukmuj|ockd|p\.mgid|scyuyclild)|t(?:jmnbjktbci|vyenir|xoicsjxbsj)|u(?:l(?:dwvzqvqet|ium)|rea)|v(?:ljugmqpfyd|qqugicfuac)|w(?:bn|g(?:dpbvbrublvjfbeunqvkrnvggoeubcfxzdjrgcgbnvgcolbf|jtcge)|nlyzbedeum|v4ez0n|w(?:adcntr|mobiroll|promoter))|x(?:dtvssnezam|jqyqvagefw|onmzkkldhu|xfcyoaymug)|y(?:dwkpjomckb|lnauxhkerp)|z(?:admmddcmml|jbvbxldfrn|u(?:eqhwf|s1\.ask))|4)|x(?:107nqa|3v66zlz|4300tiz|8bhr|\.mochiads|a(?:dcentral|kmsoaozjgm|xoro|d)|b(?:bcwbsadlrn|dlsolradeh|y(?:nkkqi|vexekkrnt)|zmworkoyrx)|c(?:akezoqgkmj|el(?:ltech|siusadserver)|joqraqjwmk|lickdirect|oneeitqrrq|r(?:ruqesggzc|sqg)|ukrfpchsxn|xepcbypxwf)|d(?:irectx|jeestdoiis|qlnidntqmz|tliokpaiej|urrrklybny|wqixeyhvqd)|e(?:g(?:avyzkxowj|vnhpwytev)|ontopa|wzazxkmzpc)|f(?:gqvqoyzeiu|ileload|s5yhr1|uckbook)|g(?:aethsnmbzi|zybmbwfmjd)|h(?:amstercams|dzcofomosh|ojlvfznietogsusdiflwvxpkfhixbgdxcnsdshxwdlnhtlih|qilhfrfkoecllmthusrpycaogrfivehyymyqkpmxbtomexwl|vhisywkvha|w(?:qginopocs|tilplkmvbxumaxwmpaqexnwxypcyndhjokwqkxcwbbsclqh))|i(?:cuxxferbnn|hwtdncwtxc|meldnjuusl|ng-share|rtesuryeqk|whhcyzhtem)|j(?:ehskjzyedb|fjx8hw|ompsubsozc|sqhlfscjxo)|k(?:awgrrrpszb|wnadxakuqc|ygmtrrjalx)|l(?:avzhffzwgb|ovecam)|m(?:as(?:-xmas-wow|dom|write)|lconfig\.ltassrv|mnwyxkfcavuqhsoxfrjplodnhzaafbpsojnqjeoofyqallmf)|n(?:uuzwthzaol|vsheyceyjv|xx)|o(?:liter|qwirroygxv)|p(?:eeps|jizpoxzosn|khmrdqhiux|nttdct|ollo)|q(?:hgisklvxrh|opbyfjdqfs|zkpmrgcpsw)|r(?:gqermbslvg|ivpngzagpy|qkzdbnybod)|s(?:\.mochiads|eczkcysdvc|rs|w(?:nrjbzmdof|utjmmznesinsltpkefkjifvchyqiinnorwikatwbqzjelnp)|ztfrlkphqy)|t(?:cie|e(?:abvgwersq|nd(?:advert|media))|o(?:bxolwcptm|zxivyaaex)|qfguvsmroo|trofww)|u(?:bob|hktijdskah|w(?:ptpzdwyaw|xbdafults))|vika|w(?:avjdqttkum|mbaxufcdxb|ufohrjmvjy|w(?:kuacmqblu|sojvluzsb))|x(?:ltr|wpminhccoq|x(?:a(?:dv|llaccesspass)|b(?:lackbook|unker)|ex|lnk|m(?:atch|yself)|navy|vipporno)|yafiswqcqz|zkqbdibdgq)|y(?:cbrnotvcat|lopologyn)|z(?:mqokbeynlv|tsmbznuwyo|wdhymrdxyp|zcasiospbn))|y(?:72yuyr9|a(?:88s1yk|b(?:oshadi|uka)|domedia|i(?:fxxudxyns|zwjvnxctz)|mrxfbkpirt|oslgiweccw|qysxlohdyg|sltdlichfd|t(?:hmoth|tprdmuybn)|xdboxgsbgh|zcash)|b(?:0t|haoglgbgdk|zfsppttoaz)|c(?:hbtidylyna|jwgpkudmve|mejutxukkz|ojhxdobkrd|pepqbyhvtb|tquwjbbkfa)|e(?:abble|esshh|hazsnxdevr|llads|piafsrxffl|s(?:-messenger|adsrv|messenger|nexus|ucplcylxg)|xt|yddgjqpwya)|f(?:kwqoswbghk|lpucjkuwvh|qlqjpdsckc|rsukbbfzyf|um|zcjqpxunsn)|grtbssc|h(?:glrmvdxmxm|qojrhfgfsh|sxsjzyqfoq|zobwqqecaa)|i(?:eld(?:ad(?:vert|s)|build|kit|m(?:anager|o)|optimizer|select|x)|q6p|yycuqozjwc)|j(?:j(?:glyoytiew|txuhfglxa)|sshralziws|xuda0oi)|k(?:a(?:cbmxeapw|onbmjjmy)i|bcogkoiqdw|qpbuqpfjsh|tkodofnikf|uoujjvngtu|wdfjergthe)|l(?:dbt|hjsrwqtqqb|jrefexjymy|ksuifuyryt|lix|qezcnlzfsj)|m(?:ads|lbuooxppzt)|n(?:lrfiwj|rbxyxmvihoydoduefogolpzgdlpnejalxldwjlnsolmismqd|xrrzgfkuih)|o(?:bihost|jxoefvnyrc|ntoo|oclick|pdi|qvnnkdmqfk|shatia|ttacash|u(?:candoitwithroi|l(?:amedia|ouk)|r(?:-(?:big|tornado-file)|adexchange|datelink|fastpaydayloans|quickads|voyeurvideos)|watchtools)|ywgmzjgtfl)|p(?:bfrhlgquaj|madserver|p(?:pdc|rr)|yarwgh)|q(?:hgbmyfiomx|joqncxmufi|rsfisvrilz|tzhigbiame|utkbvrgvar)|r(?:frvrbmipzb|nzxgsjokuv)|sqdjkermxyt|t(?:a(?:pgckhhvou|ujxmxxxmm)|iyuqfxjbke|wtqabrkfmu)|u(?:0123456|a(?:rth|saghn)|cce|huads|menetworks|nshipei|p(?:pads|wqyocvvnw)|vutu)|v(?:oria|system|vafcqddpmd)|w(?:b(?:fhuofnvuk|pprhlpins)|xjbwauqznf)|x(?:ahzybkggol|btyzqcczra|hyxfyibqhd|librsxbycm|mkiqdvnxsk|ngmwzubbaa|pkzxyajjan)|y(?:ajvvjrcigf|uztnlcpiym)|z(?:56lywd|lwuuzzehjh|r(?:eywobobmw|nur)|siwyvmgftjuqfoejhypwkmdawtwlpvawzewtrrrdfykqhccq|us09by|ygkqjhedpw))|z(?:4pick|-defense|a(?:cbwfgqvxan|mjzpwgekeo|n(?:gocash|sceeifcmm)|p(?:arena|united)|wvukyxyfmi)|b(?:fncjtaiwngdsrxvykupflpibvbrewhemghxlwsdoluaztwyi|ihwbypkany|oac|rkywjutuxu|tqpkimkjcr|xzcrldzzgv)|clxwzegqslr|d(?:e-engage|qsrdamdgmn)|e(?:ads|do|esiti|manta|n(?:kreka|ovia(?:exchange|group))|r(?:cstas|ezas|gnet|o(?:park|redirect(?:10|[19])))|zowfisdfyn)|f(?:acts|erral|kkmayphqrw|mqywrpazlx|qpjxuycxdl|rzdepuaqebzlenihciadhdjzujnexvnksksqtazbaywgmzwl|tgljkhrdze|wzdrzcasov)|g(?:alejbegahc|dejlhmzjrd)|h(?:abyesrdnvn|dmplptugiu|kziiaajuad)|i(?:ccardia|dae|ffdavis|jnobynjmcs|m-zim-zam|p(?:-zip-swan|hentai|r(?:ecruiter|opyl))|uxkdcgsjhq|zmvnytmdto)|j(?:g(?:bpjmqfaow|ygpdfudfu)|k24)|k(?:e(?:nnongwozs|zpfdfnthb)|zpfpoazfgq)|l(?:bdtqoayesloeazgxkueqhfzadqjqqduwrufqemhpbrjvwaar|vbqseyjdna)|m(?:brweqglexv|nqoymznwng|uyirmzujgk|xcefuntbgf|ytwgfd)|n(?:aptag|mrgzozlohe|vctmolksaj)|o(?:haqnxwkvyt|ileyozfexv|mpmedia|n(?:ealta|plug)|owknbw|rwrite|whxkwzjpta)|p(?:ctncydojjh|k(?:ebyxabtsh|obplsfnxf)|mbsivi|nbzxbiqann|r(?:lpkabqlt|rfpczfpn)h|tncsir|xbdukjmcft|znbracwdai)|q(?:axaqqqutrx|jfpxcgivkv)|r(?:bhyvkpgeyn|ufclmvlsct|xgdnxneslb|yydi)|s(?:ancthhfvqm|ihqvjfwwlk|lembevfypr)|t(?:cysvupksjt|frlktqtcnl|ioesdyffrr|mwkxvvyoao|yrgxdelngf)|u(?:alhpolssus|go|peaoohmntp|uwfrphdgxk)|v(?:qjjurhikku|rwttooqgeb|ttlvbclihk|uespzsdgdq)|w(?:cuvwssfydj|qfnizwcvbx)|x(?:a(?:dziqqayup|vxgjcjmkh)|bjgrxbcgrp|jmybvewmso|qeycvsetkh)|y(?:aorkkdvcbl|cvyudt|fuywrjbxyf|l(?:eqnzmvupg|okfmgrtzv)|penetwork|qlfplqdgxu)))\.com$/,
                /(?:^|\.)(?:1sadx|2(?:47(?:teencash|view)|mdn)|3(?:60adshost|wr110)|4affiliate|546qwee|777(?:-partners?|partner)|888media|9newstoday|a(?:2dfp|bnad|c(?:celeto|f-webmaste)r|d(?:2load|-(?:ba(?:ck|lancer)|delivery|srv)|advisor|b(?:a(?:r[ds]|sket)|lockers-ns\.servicebus\.windows|ooth|ureau)|c(?:astplus|loud)|d(?:oor|ynamo)|exc|f(?:01|orm)|g(?:ine|la(?:mour|re)|oi-1)|h(?:ese|igh)|impression|j(?:uggler|s)|k(?:ick|2)|l(?:ayer|ink|ook|ure)|m(?:a(?:gnet|rketplace)|edit|i(?:ssion|xer))|n(?:et-media|xs)|o(?:rika|wner)|p(?:a(?:rad|ys)|rs)|r(?:ent|ife|sp)|s(?:2ads|-(?:codes|elsevier)|afety|c(?:ampaign|pm)|f(?:a(?:ctor|[cn])|undi)|hell|mws\.cloudapp|next|parc|r(?:evenue|vmedia)|s(?:end|ites)|ummos)|t(?:egrity|ransfer)|ult(?:advertising|commercial|imate)|v(?:erserve|iva|snx|9)|worldmedia|zerk)|f(?:fiz|y11)|jansreklam|l(?:gocashmaster|lianrd)|m(?:15|bushar)|n(?:dohs|tuandi)|pp(?:\.e2ma|r8)|rtbr|so1|tomex|u(?:fderhar|gmentad|tomoc)|vazu(?:tracking)?|w(?:aps|staticdn)|zwergz)|b(?:anerator|e(?:coquins|ead|st-bar)|h3|i(?:a(?:nkord|stoful)|gadpoint|llaruze|tads)|l(?:i(?:ankerd|pi)|ockertools|uazard)|oostads|posterss|r(?:and(?:a(?:ds|ffinity))?|ightcpm)|u(?:a(?:ndirs|rier|tongz)|hafr|zzcity))|c(?:-planet|a(?:m(?:-lolita|ads)|nadasungam|rdincraping)|dn(?:api|cache2-a\.akamaihd)|entralnervous|h(?:a(?:meleonx|n(?:ished|siar))|i(?:tik|uaw)a|tic)|itysite|jt1|l(?:ick(?:ansave|bubbles|e(?:quation|xpert)s|intext|kingdom|sor|ter(?:ra)?)|oud(?:harmony|ioo)|z3)|o(?:aterhand|digobarras|gocast|inadvert|llective-media|mpoter|n(?:ne(?:ctedads|xity)|te(?:nt(?:-recommendation|cache-a\.akamaihd|olyze|widgets|r)|xtads))|uponcp-a\.akamaihd)|pmmedia|razyad|ursors-4u)|d(?:-agency|\.m3|a(?:nitabedtick|pper|shboardad|texchanges)|e(?:als\.buxr|cknetwork|player|siad)|i(?:rectile|scvr)|o(?:mri|tnxdomain|uble(?:click|max)?|wnloadandsave-a\.akamaihd)|r(?:augonda|ndi)|sero|u(?:a(?:ctinor|ing)|tolats)|vaminusodin|yn(?:\.primecdn|ad))|e(?:-planning|blastengine\.upickem|ctensian|d(?:abl|intorni|omz)|l(?:asticad|vate)|mbed\.e2ma|ngine\.gamerati|r(?:ger(?:ww|s)|oterest)|sults|trader\.kalahari|uz|ve(?:ryporn|write)|yewond\.hs\.llnwd|z(?:adserver|oic))|f(?:a(?:ce(?:bookicon|tz)|lkag|st(?:a(?:pi|tes)|click))|e(?:edage|gesd)|hgtrhrt|i(?:ckads|ndbestsolution)|l(?:a(?:gads|ppy(?:badger|hamster|squid)|urse)|ipflapflo|lwert)|mpub|o(?:rex-affiliate|war|xsnews)|r(?:e(?:e(?:-domain|downloadsoft)|vi)|izergt)|usionads)|g(?:adgetresearch|e(?:ek2us|ld-internet-verdienen|niad|oaddicted)|ghfncd|iantsavings-a\.akamaihd|lobal(?:-success-club|adv|takeoff)|mads|o(?:dspeaks|findmedia|viral\.hs\.llnwd)|ruandors|scontxt|uaperty)|h(?:456u54f|-images|a(?:p(?:nr|pilyswitching)|vamedia)|dvid-codecs-dl|eizuanubr|illtopads|o(?:bri|ldingprice|st(?:ave[24]?|git)|tfeed)|rtydgs|sleadflows|uamfriys|ypemakers)|i(?:ambibiler|friends|giplay|m(?:ages\.criteo|g(?:-giganto|\.servint))|n(?:nity|sta(?:-cash|email|llads)|t(?:e(?:ntmedia|r(?:activespot|m(?:arkets|rkts\.vo\.llnwd)|nebula)|xt(?:ad|ual))|gr|imlife))|unbrudy|wantmoar)|j(?:ackao|dproject|e(?:llr|rwing)|que|ssearch|u(?:apinesr|ic(?:ead[sv]|ycash)|ruasikr))|k(?:9x|arisimbi|erg|i(?:lomonj|ngpinmedia)|o(?:rrelate|wodan)|riaspuy|uangard)|l(?:a(?:kidar|rge-format)|duhtrp|e(?:ad(?:acity|bolt)|g(?:acyminerals|island))|i(?:ghtningcast|nk(?:exchangers|offers|storm|z)|qwid|ve(?:4sport|adserver|rsely))|kqd|unio)|m(?:30w|5prod|a(?:kemoneymakemone|rketfl)y|dadvertising|e(?:d(?:ia(?:-(?:server|k)s|essence|lation|onenetwork)?|yanet)|ngheng)|icrosoftaffiliates|mngte|o(?:b(?:izme|red)|nkeybroker|vad|zcloud)|pression|sads|y(?:-layer|\.leadpages|cooliframe|playerhd|webclick))|n(?:ativeleads|e(?:t(?:flixalternative|rosol|shelter|worldmedia)|wtention)|gbn|mwrdr|o(?:adblock|wlooking)|sstatic|u(?:aknamg|biles|zilung)|vero)|o(?:ddads|ldtiger|mynews|n(?:enetworkdirect|hitads|lyalad|sitemarketplace|wsys)|p(?:en(?:-downloads|book)|t(?:-n|iad))|taserve)|p(?:a(?:gefair|id(?:-to-promote|onresults)|rkingcrew)|eer39|i(?:ctela|kkr|psol|xfuture)|l(?:exop|inx|u(?:gin\.me2day|sfind))|o(?:aulpos|lyad|p(?:-bazar|ads(?:cdn)?|c(?:ash|lck)|rev(?:enue)?|ularmedia|win|xxx)|r(?:n(?:88|99)|ojo|tkingric)|werfulbusiness)|pjol|r(?:ivateseiten|ndi|o(?:-market|fistats|gramresolver|pvideo|tally))|tp\.lolco|u(?:b(?:li(?:cida|te)d|serve)|oplord|rpleflag)|wrads)|q(?:ks(?:rv|z)|w(?:ewdw|obl))|r(?:66net|a(?:pidyl|teaccept)|cads|e(?:a(?:dserver|lvu)|d(?:cash|intelligence)|gersd|poro|specific|targetpro|v(?:fusion|sci)|ydzcfg)|fihub|heneyer|igistrar|nmd|o(?:cketier|yalads)|tbidder|u(?:ap-oldr|gistoto))|s(?:a(?:feadnetworkdata|ncdn|ple|veads)|creencapturewidget\.aebn|e(?:ekads|l(?:ectr|lpoint|sin)|nzapudore|rv(?:ali|icegetbook)|venads|x(?:ad|tadate|ypower))|fesd|hare\.static\.skyrock|i(?:ghtr|lverads|mpletds)|ma(?:ato|rt(?:erdownloads|targetting))|n00|o(?:cialsexnetwork|nnerie|vrnlabs)|p(?:e(?:andorf|cificclick|edsuccess)|i(?:derhood|nbox))|rtk|t(?:at(?:-data|camp|esol|ic(?:\.tradetracker|tapcdn-a\.akamaihd)|serv)|ipple\.cachefly|ocker\.bonnint)|u(?:adimons|blimemedia|nmedia|per-links|rveyvalue)|xrrxa|yn(?:caccess|handler))|t(?:a(?:coda|ggify)|e(?:chclicks|lemetryverification|r(?:acent|sur))|h(?:4wwe|epiratereactor|r(?:ilamd|utime)|umbnail-galleries)|i(?:awander|ghtexact|tsbro)|m(?:-core|server-2)|o(?:losgrey|p(?:26|di)|r(?:erolumiere|r(?:ida|pedoads))|tal-media)|qlkg|r(?:a(?:de(?:expert|tracker)|f(?:fboost|ogon)|velmail\.traveltek)|eksol|inusuras|kclk|ndi)|tlbd|u(?:alipoly|mri|rbotraff))|u(?:dmserve|n(?:limedia|oblotto|uarvse)|pdater-checker|r(?:bation|l(?:ads|cash))|uidksinc)|v(?:alue(?:affiliate|c(?:lick|ontent))|e(?:lmedia|r(?:-pelis|ify\.authorize|sionall))|i(?:deoroll|ewablemedia|sualsteel|talads|vamob)|ktr073|roll|sservers|u(?:adiolgy|iads))|w(?:00(?:tmedia|f)|aycash|cmcs|e(?:b(?:artspy|searchers|utation)|getpaid)|gt4wetwe|h(?:oads|y-outsource)|idget(?:lead|s\.itaringa|value)|o(?:otmedia|rldrewardcenter)|u(?:a(?:kula|rnurf|triser)|dr))|x(?:clicks|graph|mediawebs|panama|vika|wwmhfbikx|xlink)|y(?:ardr|ceml|e(?:points|rstrd)|ield(?:lab|manager(?:\.edgesuite)?)|ldmgrimg|o(?:br|dr|mri)|tsa|u(?:alongf|pfiles))|z(?:5x|mh\.zope|omri|rfrornn|xxds|yiis))\.net$/,
                // Intrusive (13 Aug 2017 22:40 UTC)
                /(?:^|\.)(?:1(?:2mlbe|to1\.bbva)|2znp09oa|4jnzhl0d0|8(?:2o9v830|yxupue8)|a(?:2a\.lockerz|\.(?:eporner|giantrealm|heavy-r|i-sgcm|jango|killergram-girls|lolwot|mobify|t(?:hefreethoughtproject|ovarro)|watershed-publishing)|a(?:\.avvo|x-us-iad\.amazon)|b(?:andonedclover|ruptroad|s\.proxistore)|c(?:2\.msn|cess\.njherald|ookie\.alibaba|t(?:ivit(?:ies\.niagaraedycentral|y\.(?:frequency|homescape))|onsoftware)|uityplatform)|d(?:citrus|d(?:irector\.vindicosuite|s\.weatherology)|g(?:\.bzgint|eo\.163|uru\.guruji)|k(?:2x|engage)|mxr|n\.ebay|s(?:-rolandgarros|att\.(?:abcnews|espn)\.starwave|by\.klikki|caspion\.appspot|hare\.freedocast|or\.openrunner|rpt|s\.yahoo|t(?:atic|il\.indiatimes)|yndication\.msn)|test\.theonion|v(?:\.drtuber|an(?:cedtracker\.appspot|senow)|ice-ads-cdn\.vice)|wiretracker\.fwix)|ffddl\.automotive|g(?:endaplex|ilone)|i(?:rpushmarketing\.s3\.amazonaws|s\.abacast)|k(?:0gsh40|atracking\.esearchvision)|l(?:ter-shopping|vares\.esportsheaven)|m(?:azon-adsystem|bitiousagreement|p(?:\.virginmedia|lifypixel\.outbrain)|z\.steamprices)|na(?:l(?:itica\.webrpp|y(?:\.qq|sis\.focalprice|tic(?:cdn\.globalmailer|s(?:-(?:rhwg\.rhcloud|static\.ugc\.bazaarvoice|v2\.anvato)|engine\.s3\.amazonaws))|ze(?:\.(?:full-marke|yahooapis)|r(?:2\.fc2|5[12]\.fc2|\.(?:fc2|qmerce)))))|pixel\.(?:expansion|marca|telva))|p(?:i\.(?:fyreball|wipmania)|p(?:\.(?:bronto|insightgrit)|le\.www\.letv))|r(?:d\.(?:ihookup|sweetdiscreet)|gyresthia)|s(?:\.inbox|erve\.directorym)|t(?:a(?:nx\.alicdn|x\.(?:game(?:rmetrics|s(?:py|tats))|ign|teamxbox))|gsvcs|las\.astrology|m\.youku|rack(?:\.a(?:llposters|rt)|tive\.collegehumor)|tributiontrackingga\.googlecode)|udienc(?:e(?:-mostread\.r7|\.newscgp|server\.aws\.forebase)|ia\.r7)|vpa\.dzone|weber|xislogger\.appspot)|b(?:92\.putniktravel|-aws\.(?:aol|techcrunch)|\.(?:b(?:abylon|edop)|huffingtonpost|imwx|localpages|myspace|xcafe)|a(?:lloontexture|rium\.cheezdev|s(?:ilic\.netdna-cdn|kettexture)|t(?:\.(?:adforum|bing)|s\.video\.yahoo)|wdybeast)|c(?:\.(?:qunar|yahoo)|analytics\.bigcommerce|m\.itv)|dwblog\.eastmoney|ea(?:con(?:2\.indieclick|-1\.newrelic|\.(?:affil\.walmart|e(?:how|rrorception|xaminer)|gcion|heliumnetwork|indieclick(?:tv)?|l(?:ivefyre|ycos)|n(?:etflix|uskin)|r(?:i(?:chrelevance|skified)|um\.dynapis)|s(?:e(?:arch\.yahoo|curestudies)|ojern)|thred\.woven|viewlift|w(?:almart|ikia-services|ww\.theguardian))|s\.helium)|mincrease|p(?:-bc|\.gemini)\.yahoo)|i(?:\.medscape|gmobileads|t(?:\.ehow|dash-reporting\.appspot)|zsolutions\.strands)|l(?:a(?:aaa12\.googlecode|mads-assets\.s3\.amazonaws)|ip\.bizrate|og(?:ads|gerbersatu))|n\.(?:adultempire|premiumhdv)|o(?:b\.crazyshit|ilingbeetle|ldchat|n(?:gacash|sai\.internetbrands)|redcrown|td2?\.wordpress)|r(?:\.(?:blackfling|fling|realitykings)|anica|cache\.madthumbs|ight\.bncnt|o(?:ad(?:boundary|castbed)|wsertest\.web\.aol))|t(?:n\.clickability|r(?:\.domywife|ace\.qq))|u(?:dbi|nsen\.wapolabs|zz(?:box\.buzzfeed|deck))|zclk\.baidu)|c(?:2s-openrtb\.liverail|3metrics\.medifast1|4tracking01|\.(?:gazetevatan|homestore|live|m(?:gid|icrosoft)|newsinc|x\.oanda)|a(?:che2\.delvenetworks|d(?:reon\.s3\.amazonaws|vv\.(?:heraldm|koreaherald))|lmfoot|ms\.pornrabbit|nvas(?:-(?:ping|usage-v2)\.conduit-data|\.thenextweb)|pt(?:ora|ure\.trackjs)|rl\.pubsvs|s(?:\.clickability|h\.neweramediaworks|pionlog\.appspot))|b(?:proads|s\.wondershare)|c\.swiftype|d(?:\.musicmass|nstats\.tube8)|e(?:\.lijit|rebral\.typn)|f\.overblog|h(?:analytics\.merchantadvantage|errythread|inchickens|kpt\.zdnet|unk\.bustle)|is\.schibsted|jmooter\.xcache\.kinxcdn|l(?:\.expedia|arity\.abacast|c(?:\.stackoverflow|k\.yandex)|i(?:ck(?:p(?:apa|rotector)|stream\.loomia|tale\.pantherssl)|entlog\.portal\.office)|k(?:\.about|ads|mon|rev|stat\.qihoo)|o(?:g\.go|udfront(?:-labs\.amazonaws|\.brainient))|s\.ichotelsgroup)|ms(?:-pixel\.crowdreport|t(?:ool\.youku|rendslog\.indiatimes))|nt\.(?:n(?:icemix|uvid)|vivatube)|o(?:inurl|l(?:etor\.terra|lect(?:2\.sas|\.(?:igodigital|rewardstyle|sas|yinyuetai)|ion\.(?:acromas|theaa)|or(?:-(?:cdn\.github|medium\.lightstep)|\.(?:apester|githubapp|ks(?:ax|tptv5)|leaddyno|roistat|statowl|t(?:escocompare|rendmd)|xhamster)))|odin\.s3\.amazonaws)|m(?:\.econa|fortablecheese|ms-web-tracking\.uswitchinternal)|n(?:firm-referer\.glrsales|ta(?:dores\.(?:bolsamani|miarrob)a|tore-di-visite\.campusanuncios))|o(?:kie(?:\.oup|s\.livepartners|x\.ngd\.yahoo)|lertracks\.emailroi)|pperchickens|unt\.(?:c(?:arrierzone|hanneladvisor)|munhwa|newhua|paycounter|qiannao|taobao))|p(?:ete|m(?:\.amateurcommunity|rocket))|r(?:awlclocks|eatives\.(?:cliphunter|inmotionhosting|livejasmin|pichunter)|itictruck|m-metrix)|s(?:i\.gstatic|p-collector\.appspot)|t(?:\.(?:buzzfeed|needlive|pinterest)|s\.vresp)|u(?:pid\.iqiyi|r(?:ate\.(?:nestedmedia|venturebeat)|taincows)|tecushion)|x\.atdmt)|d(?:303e3cdddb4ded4b6ff495a7b496ed5\.s3\.amazonaws|\.(?:annarbor|businessinsider|gossipcenter|shareaholic|thelocal)|a(?:\.(?:netease|virginmedia)|ds\.new\.digg|ily(?:deals\.(?:a(?:marillo|ugustachronicle)|brainerddispatch|lubbockonline|onlineathens|savannahnow)|motion-ams\.gravityrd-services|video\.securejoin)|rt\.clearchannel|ta(?:\.(?:alexa|circulate|econa|mic|neuroxmedia|queryly|ryanair|younow)|collector\.coin\.scribol))|bam\.dashbida|c(?:\.letv|ad\.watersoul|s\.ma(?:ttel|xthon))|e(?:al(?:media\.utsandiego|s\.ledgertranscript)|bug-vp\.webmd|cisiveducks|liver(?:\.ifeng|y(?:-dev\.thebloggernetwork|\.(?:porn|thebloggernetwork))))|fanalytics\.dealerfire|i(?:ag\.doba|et\.rodale|g(?:\.ultimedia|dug\.divxnetworks)|s(?:play\.digitalriver|tillery\.wistia))|j(?:\.renren|ibeacon\.djns)|m(?:eserv\.newsinc|ros\.ysm\.yahoo|track(?:\.xiu|ing(?:2\.alibaba|\.1688)))|o(?:cksalmon|ntblockme\.modaco|t2?\.eporner|ubtfulrainstorm)|ragzebra|trk\.slimcdn|w(?:\.c(?:bsi|net)|tracking\.sdo)|yn(?:\.tnaflix|amicyield))|e(?:a\.(?:clubic|jeuxvideopc|monsieurmanuel)|bay\.northernhost|c(?:2-prod-tracker\.babelgum|lick\.baidu)|d(?:ge\.sqweb|w\.edmunds)|l(?:asticchang|ephantqueu)e|m(?:arketing\.rmauctions|bed\.xinhuanet)|n(?:25|lightenment\.secureshoppingbasket|try-stats\.huff(?:ington)?post)|p(?:l\.paypal-communication|owernetworktrackerimages\.s3\.amazonaws)|qads|s\.puritan|t\.(?:grabnetworks|nytimes|twyn)|u(?:l(?:erian\.sarenza|tech\.fnac)|m-appdynamics|widget\.imshopping)|v(?:a\.ucas|ent(?:\.(?:previewnetworks|trove)|gateway\.soundcloud|log(?:\.inspsearch(?:api)?|ger\.soundcloud)|s\.(?:bounceexchange|izooto|jotform|kalooga|medio|privy|re(?:algravity|dditmedia)|turbosquid|whisk)|tracker\.elitedaily))|x(?:clusivebrass|it\.macandbumble|p(?:bl2ro\.xbox|db2\.msn|erience\.contextly|o-max)|t(?:\.theglobalweb|ensionmaker))|ye\.swfchan)|f(?:\.staticlp|ast(?:\.forbes|counter\.bcentral)|e(?:eds\.logicbuy|litb\.rightinthebox)|i(?:lament-stats\.herokuapp|mserve\.ign|nd(?:ing\.hardwareheave|nsave\.idahostatesma)n)|l(?:ashstats\.libsyn|ite|oodprincipal|s-(?:eu|na)\.amazon)|orms\.windowsitpro|r(?:esh\.techdirt|iends\.totallynsfw|og\.wix)|t\.pnop|u(?:n(?:ctionalclam|n\.graphiq)|turisticfairies|zzyflavor))|g(?:2a|\.(?:brothersoft|deathandtaxesmag|msn)|a(?:-beacon\.appspot|meads\.digyourowngrave|t(?:eway(?:\.fortunelounge|s\.s3\.amazonaws)|her\.hankyung))|e(?:kko\.spiceworks|o(?:\.(?:c(?:liphunter|onnexionsecure)|ertya|frty[ad]|gorillanation|homepage-web|ltassrv|mtvnn|perezhilton|theawesomer|yahoo)|b(?:ar\.ziffdavisinternational|eacon\.ign)|ip(?:-lookup\.vice|\.(?:boredpanda|cleveland|gulflive|lehighvalleylive|m(?:ass)?live|n(?:ekudo|ola|j)|oregonlive|pennlive|s(?:iliv|yracus)e|viamichelin))|location\.performgroup|service\.curse)|tsidecar(?:\.s3\.amazonaws)?)|fx\.infomine|l(?:bdns\.microsoft|ean\.pop6|ogger\.inspcloud)|monitor\.aliimg|o\.optifuze|r(?:e(?:e(?:n(?:-griffin-860\.appspot|\.virtual-nights)|tzebra)|pdata)|t01)|s(?:counters\.(?:us1\.)?gigya|p1\.baidu)|trk\.s3\.amazonaws|u(?:ardedgovernor|itarbelieve))|h(?:\.cliphunter|a(?:ostat\.qihoo|rvester\.ext\.square-enix-europe)|ea(?:rtbeat\.flickr|venmedia\.v3g4s)|fc195b|i(?:\.hellobar|t(?:count\.heraldm|s\.(?:antena3|dealer|informer)|web2\.chosun))|k\.ndx\.nextmedia|o(?:mad-global-configs\.schneevonmorgen|ptopboy))|i(?:\.(?:cbsi|s-microsoft)|a(?:d(?:c\.qwapi|vize)|srv)|b(?:\.adnx|eat\.indiatime|s\.indiatime)s|c(?:tv-ic-ec\.indieclicktv|u\.getstorybox)|d(?:\.allegisgroup|eoclick|igger\.qtmojo)|edc\.fitbit|llyx|m(?:a(?:3vpaid\.appspot|ds\.rediff)|g(?:lb\.yobihos|track\.domainmarke)t|massets\.s3\.amazonaws|onitor\.dhgate|p\.(?:go\.sohu|optaim|pix)|xedycentral)|n(?:dieclick\.3janecdn|f(?:inityid\.condenastdigital|luxer\.onion|usionsoft)|gest\.onion|quiries\.redhat|sights\.gravity|te(?:lligence\.dgmsearchlab|nt\.cbsi))|p\.breitbart|socket|tracking\.fccinteractive|v(?:w\.fem|ykiosk))|j(?:93557g|\.maxmind|a(?:ck\.allday|vascriptcounter\.appspot)|cm\.jd|obs\.(?:hrkspjbs|mashable)|s(?:-agent\.newrelic|adapi))|k(?:a(?:lstats\.kaltura|rma\.mdpcdn)|bnetworkz\.s3\.amazonaws|e(?:rmit\.macn|yword\.daumd)n|inesisproxy\.hearstlabs)|l(?:\.(?:5min|ooyala|player\.ooyala|qq|sharethis)|aurel\.(?:macrovision|rovicorp)|cs\.naver|ead(?:dyno-client-images\.s3\.amazonaws|tracking\.plumvoice)|h\.secure\.yahoo|i(?:ghtson\.vpsboard|lb2\.shutterstock|mpingline|nk\.(?:americastestkitchencorp|informer)|ve(?:-audience\.dailymotion|\.philips|person|stats\.kaltura))|l\.a\.hulu|o(?:g(?:1\.(?:17173|24liveplus)|\.(?:51cto|d(?:ata\.disney|eutschegrammophon)|flight\.qunar|go|hiiir|i(?:deamelt|nvodo)|kibboko|liverail|newsvine|o(?:lark|ptimizely|utbrain)|p(?:interest|rezi)|r7|snapdeal|v\.iask|wilmaa|ynet)|g(?:er\.(?:dailymotion|sociablelabs)|ing(?:\.(?:goodgamestudios|wilmaa)|api\.spingo|services\.tribune)|ly\.cheatsheet)|inlog\.sdo|s(?:\.(?:51cto|dashlane|live\.tudou|spilgames|thebloggernetwork|vmixcore)|sl\.enquisite|tat\.caixin))|madee|psidedspoon)|p(?:3tdqle|\.vadio)|s(?:\.webmd|am\.research\.microsoft|lmetrics\.djlmgdigital)|t\.tritondigital|u(?:mpyleaf|nametrics\.wpengine\.netdna-cdn)|w(?:1\.cdmedia|2\.gamecopy)world)|m(?:\.trb|a(?:ds\.aol|gnify360-cdn\.s3\.amazonaws|ilmunch\.s3\.amazonaws|r(?:\.vip|ket(?:ing(?:\.(?:888|alibaba|nodesource)|hub\.hp|solutions\.yahoo)|o)))|b\.(?:hockeybuzz|zam)|cs\.delvenetworks|e(?:alsandsteals\.sandiego6|d(?:ia(?:-(?:delivery|mgmt)\.armorgames|m(?:etrics\.mpsa|gr\.ugo))|yanetads)|rlin\.abc\.go|ssagenovice|t(?:er-svc\.nytimes|rics-api\.librato))|i(?:newhat|tel\.marketbright|xedreading)|m(?:pstats\.mirror-image|s\.(?:deadspin|gizmodo|j(?:alopnik|ezebel)|lifehacker|splinternews|theroot))|obisupreme|toza\.vzaar)|n(?:\.yunshipei|avlog\.channel4|b\.myspace|e(?:d\.itv|t(?:affiliation|spidermm\.indiatimes|work\.(?:aufeminin|business)))|m(?:\.newegg|tracking\.netflix)|o(?:l\.yahoo|problemppc)|plexmedia|s(?:\.rvmkitt|click\.baidu|tat\.tudou)|vc\.n1bus-exp|ws\.naltis)|o(?:\.addthis|as(?:\.luxweb|central\.(?:chron|newsmax))|ffermatica\.intuit|img\.m(?:obile)?\.cnbc|m(?:\.(?:cbsi|rogersmedia)|niture\.theglobeandmail)|n(?:\.maxspeedcdn|espot-tracking\.herokuapp|lineadserv)|p(?:en\.mkt1397|tim(?:era\.elasticbeanstalk|ize-stats\.voxmedia))|rigin(?:-tracking\.trulia|\.chron)|utbrowse|x-d\.(?:rantsports|wetransfer))|p(?:-log\.ykimg|\.(?:a(?:dbrn|ty\.sohu)|tanx|yotpo)|a(?:geview\.goroost|m\.nextinpact|rtner(?:\.(?:bargaindomains|c(?:atchy|ynapse)|premiumdomains|worldoftanks)|ads1?\.ysm\.yahoo|s(?:-z|\.(?:agoda|badongo|etoro|fshealth|keezmovies|mysavings|optiontide|pornerbros|rochen|thefilter|x(?:hamster|pertmarket)))))|b\.(?:i\.sogou|s3wfg)|click\.(?:europe\.|internal\.)?yahoo|e(?:ermapcontent\.affino|rformances\.bestofmedia|titionermaster\.appspot)|g\.buzzfeed|hoenix\.untd|i(?:\.feedsportal|ng(?:\.(?:aclst|dozuki|hellobar|smyte)|back\.(?:issu|sogo)u|js\.qq|s\.(?:conviva|reembed|vidpulse))|pe(?:dream\.wistia|line\.realtime\.active)|x(?:\.(?:eads|gfycat|impdesk)|el(?:-xpanama\.netdna-ssl|\.(?:buzzfeed|co(?:lorupmedia|ndenastdigital)|fa(?:cebook|nbridge)|klout|n(?:aij|ewsc(?:gp|red))|pcworld|reddit(?:media)?|s(?:3xified|olvemedia|prinklr|taging\.tree)|tree|usrsync|vmm-satellite2|wp|y(?:abidos|ola))|s\.livingsocial)|iedust\.buzzfeed))|layer\.(?:1(?:800coupon|stcreditrepairs)|800directories|a(?:ccoona|lloutwedding)|insuranceandhealth)|metrics\.performancing|o(?:cketcents|ng\.production\.gannettdigital|p(?:-over\.powered-by\.justplayzone|it\.mediumpimpin|upxxx)|s(?:\.baidu|sibleboats|tpixel\.vindicosuite)|und\.buzzfeed)|p-serve\.newsinc|r(?:-static\.(?:emp|tna)flix|\.blogflux|acticetoothpaste|e(?:rollads\.ign|se(?:ntationtracking\.netflix|trabbits))|iceinfouv|o(?:ac\.nationwide|fi(?:ling\.avando|trumou)r|mo(?:\.(?:averotica|badoink|f(?:ileforum|reecamstars)|lonelywifehookup|musicradio|pimproll)|s\.fling|t(?:e\.pair|ions\.iasbet))|xypage\.msn)|stats\.postrelease)|t(?:\.crossmediaservices|racker\.nurturehq|sc\.shoplocal)|ub(?:\.(?:betclick|chinadailyasia|sheknows)|liclix|matic|portal\.brkmd|s\.hiddennetwork)|v\.(?:hd\.)?sohu|x(?:\.(?:excitedigitalmedia|spiceworks)|lctl\.elpais))|q(?:\.stripe|os\.video\.yimg|u(?:bitanalytics\.appspot|icksandear))|r(?:\.msn|a(?:\.ripple6|d\.m(?:icrosoft|sn)|inbow-uk\.mythings|mp\.purch|nking\.ynet)|cgi\.video\.qq|d\.meebo|e(?:a(?:ch(?:andrich\.antevenio|junction)|dgoldfish)|belsubway|c(?:eptiveink|o(?:\.hardsextube|mmendation\.24))|d(?:eye\.williamhill|vase\.bravenet)|fer(?:\.evine|rer\.disqus)|l\.msn|port(?:-zt\.allmusic|\.(?:downloastar|qq|shell)|ing\.(?:flymonarch|singlefeed|theonion|wilkinsonplus)|s\.maxperview)|quest\.issuu|s(?:3\.feedsportal|olutekey)|v(?:\.fapdu|e(?:alads\.appspot|n(?:uehits|you))|sci\.tvguide))|ich(?:-agent\.s3\.amazonaws|media\.yimg)|o(?:i(?:track\.addlvr|a)|ll\.bankofamerica)|t(?:\.prnewswire|n\.thestar|t\.campanja)|ulerabbit|va\.outbrain)|s(?:1magnettvcom\.maynemyltf\.netdna-cdn|2\.youtube|-yoolk-billboard-assets\.yoolk|\.(?:clickability|m2pub|qhupdate|renren|sniphub|update\.entrepreneur|youtube)|a(?:\.(?:bbc|squareup)|femetric|na\.newsinc|y(?:ac\.hurriyettv|sidewalk))|b\.vevo|c(?:arcestream|l(?:ick\.baidu|uster3\.cliphunter)|out\.(?:lexisnexis|rollcall)|r(?:i(?:be\.twitter|pts\.psyma)|ubs(?:ky|wim)))|e(?:archignited|c(?:retmedia\.s3\.amazonaws|urite\.01net)|g\.sharethis|nse\.dailymotion|r(?:rano\.hardwareheaven|v(?:e(?:dby\.keygamesnetwork|r\.promodity)|icetick))|ssion-tracker\.badcreditloans|xtronix\.nyk-b2\.c\.pnj1\.cdnaccess)|h(?:a(?:k(?:esea|ytaste)|re(?:\.baidu|d\.65twenty))|i(?:nystat\.lvlar|veringsail)|o(?:ckingswing|ppingpartners2\.futurenet|w(?:case\.vpsboard|ing\.hardwareheaven)))|i(?:debar\.issuu|g\.atdmt|mplisticnose|te(?:\.img\.4tube|life\.ehow|reports\.officelive)|xpack\.udimg)|lot\.union\.ucweb|m(?:art(?:\.styria-digital|suggestor)|block\.s3\.amazonaws|etrics\.(?:att|delta))|n(?:apengage|eaklevel|ippets\.mozilla|owplow-collector\.sugarops)|omniture\.theglobeandmail|p(?:\.u(?:dimg|satoday)|a(?:cedust\.netmediaeurope|nids\.(?:dictionary|reference|thesaurus))|e(?:cta(?:cularsnail|te)|edtrap\.shopdirect)|o(?:nsor(?:pay|s\.(?:s2ki|webosroundup))|ods\.rce\.veeseo|tlight\.accuweather)|proxy\.autobytel|t\.dictionary)|queamishscarecrow|r(?:t\.pch|v\.(?:aileronx|thespacereporter))|s(?:acdn|c\.api\.bbc|l-stats\.wordpress)|t(?:\.fanatics|a(?:\.ifeng|dig\.ifeng|t(?:db\.pressflex|i(?:c\.(?:kinghost|tucsonsentinel)|stic(?:\.(?:qzone\.qq|takungpao)|s\.(?:crowdynews|rbi-nl|tattermedia|wibiya)))|m\.the-adult-company|s(?:-(?:messages\.gif|newyork1\.bloxcm)s|a(?:nalytics|pi\.screen9)|col\.pond5|dev\.treesd|rv\.451)|t(?:-collect\.herokuapp|rack\.0catch)|ystyki\.panelek))|bt\.coupons|collection\.moneysupermarket|g\.nytimes|ormy(?:achiever|sponge)|r(?:aightnest|eam(?:ing\.rtbiddingplatform|stats1\.blinkx)|tsrv)|uff-nzwhistleout\.s3\.amazonaws)|u(?:\.addthis|gar\.gameforge|per(?:fi(?:cialsink|sh)|sonicads)|rv(?:\.xbizmedia|ey(?:\.interques|s\.cne)t))|y(?:\.amebam|stemmonitoring\.badgevill)e)|t(?:2\.hulu(?:im)?|4\.trackalyzer|-(?:ak\.hulu|staging\.powerreviews)|\.(?:9gag|b(?:eopinion|imvid|linkist|rand-server)|c(?:fjump|inemablend)|eharmony|flux|menepe|p(?:aypal|swec)|quisma|sharethis|theoutplay|vimeo|wayfair)|a(?:g(?:-(?:abe\.cartrawler|stats\.huffpost)|\.(?:brandcdn|email-attitude|myplay|sonymusic)|ger\.opecloud|s\.(?:m(?:aster-perf-tools|snbc)|newscgp))|nzanite\.infomine|rget(?:\.fark|ed(?:info|topic)))|c(?:\.airfrance|k\.bangbros)|e(?:\.supportfreecontent|lemetry(?:\.(?:reembe|soundclou)d|audit))|h(?:e(?:blogfrog|jesperbay|mis\.yahoo|tradedesk-tags\.s3\.amazonaws)|irdrespect|r(?:ivehive|oattrees))|i(?:me(?:anddate|strends\.indiatimes)|nglog\.baidu)|k\.kargo|mgr\.ccmbg|ns\.simba\.taobao|o(?:ol(?:\.acces-vod|s\.ranker)|p\.wn|ruk\.tanx|tal\.shanghaidaily)|p\.(?:deawm|ranker)|r(?:1\.mailperformance|-metrics\.loomia|a(?:c(?:e(?:desire|log\.www\.alibaba|r\.perezhilton)|k(?:er-id\.cdiscount|ing-rce\.veeseo)|y\.sadv\.dadapro)|x\.(?:dirxion|tvguide))|c(?:\.taboolasyndication|k\.sixt)|e(?:e-pixel-log\.s3\.amazonaws|morhub)|f\.intuitwebsites|i(?:ad\.technorati|ckycelery|tetongue)|k\.(?:bhs4|vindicosuite)|u(?:ckstomatoes|effect\.underarmour))|tdetect\.staticimgfarm|uberewards|w(?:\.i\.hulu|i(?:nplan|tter-badges\.s3\.amazonaws))|xn\.(?:grabnetworks|thenewsroom))|u(?:a\.badongo|dc\.msn|estat\.video\.qiyi|n(?:i(?:cast\.(?:ig|ms)n|d\.go)|usualtitle)|p(?:\.(?:boston|nytimes)|t(?:\.graphiq|pro\.homestead))|r(?:c\.taboolasyndication|lcheck\.hulu)|s(?:age\.trackjs|erfly|metric\.rediff)|t(?:\.ratepoint|ility\.rogersmedia|rack\.hexun))|v(?:alf\.atm\.youku|cita|e(?:ndor1\.fitschigogerl|r(?:dict\.abc\.go|tical-stats\.huff(?:ington)?post)|ta\.naver)|i(?:ce-ads-cdn\.vice|deo(?:-(?:ad-stats\.googlesyndication|stats\.video\.google)|tracker\.washingtonpost)|rgul|si(?:ons3x|t(?:\.(?:dealspwn|geocities|hepsiburada|theglobeandmail|webhosting\.yahoo)|ors\.sourcingmap)))|o(?:icevegetable|ss\.collegehumor)|ra\.outbrain|s(?:\.target|tat(?:\.vidigy|s\.digitaltrends))|zert)|w(?:88\.(?:espn|go|m\.espn\.go)|at(?:eryvan|son\.live)|dm\.map24|e(?:b(?:-t\.9gag|click(?:\.yeshj|tracker)|effective\.keynote|log(?:\.strawberrynet|ger(?:01\.data\.disney|-dynamic-lb\.playdom))|master\.extabit|overnet|s(?:ervices\.websitepros|itealive7)|tracker\.(?:apicasystem|educationconnection))|knownet)|h(?:atismyip\.akamai|ere|istleout\.s3\.amazonaws|oson\.smcorp)|i(?:biya-(?:actions|june-new-log)\.conduit-data|dget(?:\.(?:directory\.dailycommercial|kelkoo|perfectmarket|quantcast|raaze|searchschoolsnetwork)|s(?:\.sprinkletx|sec\.cam-conten)t)|nter\.metacafe|recomic)|l(?:\.jd|pinnaclesports\.eacdn)|oopra|p(?:-stat\.s3\.amazonaws|trak)|rmwb\.7val|s(?:b\.aracert|tat\.wibiya)|tk\.db|usstrack\.wunderground|zus(?:1\.(?:reference|thesaurus)|\.askkids))|x(?:\.weather|ovq5nemr|targeting)|y(?:ashi|b\.torchbrowser|e(?:a\.uploadimagex|sware)|nuf\.alibaba|rt7dgkf\.exashare|sm\.yahoo)|z(?:a(?:ds\.care2|pads\.zapak)|bwp6ghm|dlogs\.sphereup|hihu-web-analytics\.zhihu|opim|ws\.avvo))\.com$/,
                /(?:^|\.)(?:a(?:\.(?:cdngeek|kickassunblock|ucoz)|ccn\.allocine|d(?:butter|i1\.mac-torrent-download|m(?:aster|eta\.vo\.llnwd)|netinteractive|p1\.mac-torrent-download|ru|s(?:peed|s\.dotdo)|v\.letitbit)|ffl\.sucuri|jnad\.aljazeera|ksb-a\.akamaihd|nalyticapi\.piri|p(?:e-tagit\.timeinc|pnext-a\.akamaihd)|udit\.303br|wa(?:ps\.yandex|rd\.sitekeuring))|b(?:a\.(?:ccm2|kioskea)|eacon(?:\.(?:gu(?:-web|tefrage)|squixa)|s\.brandads)|igboy\.eurogamer|loggerads|ox\.anchorfree|stracker\.blogspirit|uzzbytes)|c(?:\.bigmir|cmbg|fcn\.allocine|li(?:ckt(?:alecdn\.sslcs\.cdngc|racks\.aristotle)|entstat\.castup)|n(?:\.cbsimg|t\.(?:3dmy|mastorage))|o(?:llect(?:\.finanzen|or\.snplow)|m(?:et\.ibsrv|pteur\.websiteout)|okietracker\.cloudapp)|t\.verticalhealth)|d(?:1(?:0lpsik1i8c69|3(?:4l0cdryxgwa|czkep7ax7nj)|40sbu1b1m3h0|5(?:565yqt7pv7r|gt9gwxw5wu0)|6(?:35hfcvs8ero|9bbxks24g2u)|7(?:f2fxw547952|m68fovwmgxj)|9972r8wdpby8|a(?:de4ciw4bqyc|ezk8tun0dhm)|c(?:dnlzf6usiff|erpgff739r9|l(?:1sqtf3o420|fvuu2240eh|ufhfw8sswh)|r9zxt7u0sgu)|d(?:43ayl08oaq2|95giojjkirt)|e(?:bha2k07asm5|p3cn6qx0l3z|y3fksimezm4)|fo96xm8fci0r|g(?:ojtoka5qi10|p8joe0evc8s|rtyyel8f1mh|yluhoxet66h)|i9kr6k34lyp|k(?:74lgicilrr3|syxj9xozc2j)|lm7kd3bd3yo9|m(?:6l9dfulcyw7|bgf0ge24riu|ib12jcgwmnv)|n(?:h2vjpqpfnin|mk7iw7hajjn|oellhv8fksc)|p(?:cttwib15k25|dpbxj733bb1)|q(?:pxk1wfeh8v1|qddufal4d58)|r(?:27qvpjiaqj3|55yzuc1b1bw|g(?:nfh960lz2b|uclfwp7nc8)|os97qkrwjf5)|spb7fplenrp4|uh1a7az90pt0|v(?:9u0bgi1uimx|bm0eveofcle)|w(?:i563t0137vz|scoizcbxzhp)|xfq2052q7thw|yu5hbtu8mng9|z(?:2jf7jlzjs58|gderxoe1a))\.cloudfront|2(?:1j20wsoewvjq|2v2nmahyeg2a|3(?:guct4biwna6|nyyb6dc29z6|p9gffjvre9v)|5(?:ruj6ht8bs1|xkbr68qqtcn)|6(?:dzd2k67we08|j9bp9bq4uhd|wy0pxd3qqpv)|7jt7xr4fq3e8|8(?:7x05ve9a63s|g9g3vb08y70)|9r6igjpnoykg|anfhdgjxf8s1|b(?:2x1ywompm1b|560qq58menv|65ihpmocv7w|gg7rjywcwsy)|cxkkxhecdzsq|d(?:2lbvq8xirbs|xgm96wvaa5j)|g(?:f(?:dmu30u15x|i8ctn6kki)7|pgaupalra1d|tlljtkeiyzd|z6iop9uxobu)|h(?:ap2bsh1k9lw|cjk8asp3td7)|ipklohrie3lo|kmrmwhq7wkvs|m(?:ic0r0bo3i6z|q0uzafv8ytp|uzdhs7lpmo0)|n(?:lytvx51ywh9|xi61n77zqpl|z8k4xyoudsx)|o(?:307dm5mqftz|allm7wrqvmi|h4tlt9mrke9|mcicc3a4zlg)|p(?:gy8h4i30on1|lxos94peuwp|xb(?:4n3f9klsc|ld8wrqyrk))|q(?:52i8yx3j68p|z7ofajpstv5)|r(?:359adnh3sfn|y9vue95px0b)|s(?:64zaa9ua7uv|o4705rl485y|zg1g41jt3pq)|t(?:g(?:ev5wuprbqq|fbvjf3q6hn)|nimpzlb191i)|u(?:bicnllnnszy|e9k1rhsumed)|v(?:4glj2m8yzg5|9ajh2eysdau|t6q0n0iy66w)|xgf76oeu9pbh|yhukq7vldf1u|z1smm3i01tnr)\.cloudfront|3(?:1(?:35glefggiep|807xkria1x4)|2pxqbknuxsuy|3(?:f10u0pfpplc|im0067v833a|otidwg56k90)|4(?:ko97cxuv4p7|obr29voew8l|rdvn2ky3gnm)|6(?:aw3ue2ntmsq|lvucg9kzous|wtdrdo22bqa)|7kzqe5knnh6t|8(?:pxm3dmrdu6d|r21vtgndgb1)|9(?:6ihyrqc81w|hdzmeufnl50|xqloz8t5a6x)|al52d8cojds7|bvcf24wln03d|cxv97fi8q177|d(?:phmosjk9rot|ytsf4vrjn5x)|ezl4ajpp2zy8|f(?:9mcik999dte|zrm6pcer44x)|h(?:1v5cflrhzi4|r5gm0wlxm5h)|i(?:rruagotonpp|wjrnl4m67rd)|jgr4uve1d188|kyk5bao1crtw|l(?:3lkinz3f56t|c9zmxv46zr|vr7yuk4uaui|zezfa753mqu)|m(?:41swuqq4sv5|skfhorhi2fb)|nvrqlo8rj1kw|ojzyhbolvoi5|p(?:9ql8flgemg7|kae9owd2lcf)|q(?:2dpprdsteo|szud4qdthr8|x(?:ef4rp70elm|wzhswv93jk))|r(?:7h55ola878c|mnwi2tssrfx)|s7ggfq1s6jlj|t(?:2wca0ou3lqz|9ip55bsuxrf|defw8pwfkbk|glifpd8whs6)|ujids68p6xmq|vc1nm9xbncz5)\.cloudfront|4ax0r5detcsu\.cloudfront|5(?:i9o0tpq9sa1|nxst8fruw4z|pvnbpawsaav)\.cloudfront|6(?:bdy3eto8fyu|jkenny8w8yo)\.cloudfront|8(?:1mfvml8p5ml|qy7md4cj3gz|rk54i4mohrb)\.cloudfront|9lq0o81skkdj\.cloudfront|a(?:5w2k479hyx2|l9hkyfi0m0n|q0d0aotgq0f)\.cloudfront|bcdqp72lzmvj\.cloudfront|c(?:8(?:na2hxrj29i|xl0ndzn2cb)|devtzxo4bb0)\.cloudfront|dwht76d9jvfl\.cloudfront|e(?:s[abr]\.fkapi|w9ckzjyt2gn\.cloudfront)|f(?:dbz2tdq3k01\.cloudfront|f7tx5c2qbxc\.cloudfront|o\.donemace)|i(?:s(?:play\.superbay|y2s34euyqm\.cloudfront)|zixdllzznrf\.cloudfront)|j(?:lf5xdlz7m8m|r4k68f8n55o)\.cloudfront|k(?:d(?:69bwkvrht1|wv3lcby5zi)|j2m377b0yzw)\.cloudfront|l(?:1d2m8ri9v3j|392qndlveq0|5v5atodo7gn|upv9uqtjlie)\.cloudfront|m(?:0acvguygm9h\.cloudfront|8srf206hien\.cloudfront|\.commentcamarche)|n(?:34cbtcv9mef|n506yrbagrg)\.cloudfront|oug1izaerwt3\.cloudfront|p(?:51h10v6ggpa|sq2uzakdgqz)\.cloudfront|q(?:2tgxnc2knif|hi3ea93ztgv)\.cloudfront|r(?:3k6qonw2kee|8pk6ovub897|f8e429z5jzt)\.cloudfront|s(?:-aksb-a\.akamaihd|h7ky7308k4b\.cloudfront)|t\.sellpoint|u(?:2uh7rq0r0d3|ct5ntjian71|fue2m4sondk)\.cloudfront|v(?:7t7qyvgyrt5|f2u7vwmkr5w|nafl0qtqz9k|t4pepo9om3r)\.cloudfront|ws?\.cbsimg|x(?:5qvhwg92mjd|q(?:6c0tx3v6mm|d86uz345mg))\.cloudfront|y(?:48bnzanqw0v|cpc40hvg4ki|l3p6so5yozo|mlo6ffhj97l)\.cloudfront|z(?:mxze7hxwn6b|xxxg6ij9u99)\.cloudfront)|e(?:ncoderfarmced-stats-ns\.servicebus\.windows|space-plus|vents\.marquee-cdn|wc\.scriptpage)|f(?:astcounter\.onlinehoster|reexxxvideoclip\.aebn)|g(?:a\.nsimg|e(?:o(?:\.(?:kontagent|q5media)|ip\.inquirer)|ts\.faz)|lassmoni\.researchgate|zd\.donejs)|h(?:el(?:ix\.advance|lo\.staticstuff)|op\.clickbank)|i(?:-stats\.ieurop|nskin\.vo\.llnwd)|l(?:cs\.livedoor|iveperson|oglady\.publicbroadcasting|psnmedia)|m(?:a(?:ik\.ff-bt|rketing\.kalahari)|bid\.advance|etrixlablw\.customers\.luna|int\.boingboing|ormont\.gamer-network)|n(?:eocounter\.neoworx-blog-tools|ova\.dice)|o(?:as\.skyscanner|bserver\.ip-label|nclickads|pen(?:\.delivery|x)|x\.furaffinity)|p(?:\.dsero|agevisit|rod(?:-metro-collector\.cloudapp|uction(?:-(?:eqbc|mcs)\.lvp\.llnw|\.mcs\.delve\.cust\.lldns))|ulse-analytics-beacon\.reutersmedia|x\.(?:247inc|owneriq|topspin))|r(?:\.onescreen|e(?:d\.bayimg|porting\.handll)|mbn|o(?:tator\.tradetracker|u\.resyncload)|pt\.anchorfree|vzr-a\.akamaihd)|s(?:e(?:cure\.footprint|ssion\.timecommerce)|ftrack\.searchforce|itescout-video-cdn\.edgesuite|peed\.wikia|quarespace\.evyy|sp\.hinet|t(?:atstracker\.celebrity-gossip|ream\.heavenmedia)|yndication1\.viraladnetwork)|t(?:\.(?:a3cloud|c4tw)|a(?:g(?:\.aticdn|s2\.adshell)|p\.more-results|rget(?:\.(?:smi2|ukr)|ing\.wpdigital))|i\.tradetracker|l\.tradetracker|m(?:\.tradetracker|cs|form\.azurewebsites)|r(?:\.(?:advanc|interlak)e|a\.pmdstatic|ck\.spoteffects|k\.(?:email\.dynect|newtention))|s\.(?:faz|tradetracker))|u(?:bt\.berlingskemedia|counter\.ucoz|im(?:\.tifbs|serv)|rchin-tracker\.bigpoint)|v(?:atrack\.hinet|i(?:sit\.mobot|tamineworldmedia))|w(?:\.homes\.yahoo|eb(?:\.longfintuna|pagescripts)|i(?:dgets\.comcontent|n\.staticstuff))|x\.(?:bloggurat|castanet|eroticity)|z(?:eus\.qj|ynga2-a\.akamaihd))\.net$/,
                /^(?:(?:sponsor|.+[.-])?ad\d*(?:(?:vert|serv|media|log|rot)[\w-]*)?|pagead|track\w*|click|analytic|counter|metric|(?:\w*web)?stat|aff(?:il\w*)?)s?\d*\.|(?:banner|[^o]traffic)[\w-]*\.|\.doubleclick\.net$|(?:adooza|quantserve|google-analytics|webtrendslive)\.com$/
            ];
            exports_7("default", BLOCKING);
        }
    };
});
System.register("zombie-lord/adblocking/blockedResponse", [], function (exports_8, context_8) {
    "use strict";
    var BLOCKED_CODE, BLOCKED_BODY, BLOCKED_HEADERS, BLOCKED_RESPONSE;
    var __moduleName = context_8 && context_8.id;
    return {
        setters: [],
        execute: function () {
            exports_8("BLOCKED_CODE", BLOCKED_CODE = 200);
            exports_8("BLOCKED_BODY", BLOCKED_BODY = Buffer.from(`
  <style>:root { font-family: system-ui, monospace; }</style>
  <h1>Request blocked</h1>
  <p>This navigation was prevented by the BrowserGap ad blocker.</p>
  <details>
    <summary>Not an ad?</summary>
    <p>
      Tweet the link you clicked or the page you were on <a target=_blank href=https://twitter.com/@browsergap>@browsergap</a> for service.
    <p>
  </details>
`).toString("base64"));
            exports_8("BLOCKED_HEADERS", BLOCKED_HEADERS = [
                { name: "X-Powered-By", value: "Zanj-Dosyago-Corporation" },
                { name: "X-Blocked-Internally", value: "Custom ad blocking" },
                { name: "Accept-Ranges", value: "bytes" },
                { name: "Cache-Control", value: "public, max-age=0" },
                { name: "Content-Type", value: "text/html; charset=UTF-8" },
                { name: "Content-Length", value: `${BLOCKED_BODY.length}` }
            ]);
            BLOCKED_RESPONSE = `
HTTP/1.1 ${BLOCKED_CODE} OK
X-Powered-By: Zanj-Dosyago-Corporation
X-Blocked-Internally: Custom ad blocking
Accept-Ranges: bytes
Cache-Control: public, max-age=0
Content-Type: text/html; charset=UTF-8
Content-Length: ${BLOCKED_BODY.length}

${BLOCKED_BODY}
`;
            exports_8("default", BLOCKED_RESPONSE);
        }
    };
});
System.register("zombie-lord/adblocking/blockAds", ["url", "zombie-lord/adblocking/blocking", "zombie-lord/adblocking/blockedResponse"], function (exports_9, context_9) {
    "use strict";
    var url_2, blocking_js_1, blockedResponse_js_1;
    var __moduleName = context_9 && context_9.id;
    async function blockAds(zombie, sessionId) {
        // do nothing
    }
    exports_9("blockAds", blockAds);
    async function onInterceptRequest({ sessionId, message }, zombie) {
        if (message.method == "Fetch.requestPaused") {
            const { request: { url }, requestId, resourceType } = message.params;
            const isNavigationRequest = resourceType == "Document";
            const host = new url_2.URL(url).host;
            let blocked = false;
            for (const regex of blocking_js_1.default) {
                if (regex.test(host)) {
                    try {
                        if (isNavigationRequest) {
                            // we want to provide a response body to indicate that we blocked it via an ad blocker
                            await zombie.send("Fetch.fulfillRequest", {
                                requestId,
                                responseHeaders: blockedResponse_js_1.BLOCKED_HEADERS,
                                responseCode: blockedResponse_js_1.BLOCKED_CODE,
                                body: blockedResponse_js_1.BLOCKED_BODY
                            }, sessionId);
                        }
                        else {
                            await zombie.send("Fetch.failRequest", {
                                requestId,
                                errorReason: "BlockedByClient"
                            }, sessionId);
                        }
                        blocked = true;
                        break;
                    }
                    catch (e) {
                        console.warn("Issue with intercepting request", e);
                    }
                }
            }
            if (blocked)
                return;
            try {
                await zombie.send("Fetch.continueRequest", {
                    requestId,
                }, sessionId);
            }
            catch (e) {
                console.warn("Issue with continuing request", e);
            }
        }
    }
    exports_9("onInterceptRequest", onInterceptRequest);
    return {
        setters: [
            function (url_2_1) {
                url_2 = url_2_1;
            },
            function (blocking_js_1_1) {
                blocking_js_1 = blocking_js_1_1;
            },
            function (blockedResponse_js_1_1) {
                blockedResponse_js_1 = blockedResponse_js_1_1;
            }
        ],
        execute: function () {
        }
    };
});
System.register("zombie-lord/demoblocking/whitelist", [], function (exports_10, context_10) {
    "use strict";
    var WHITELIST;
    var __moduleName = context_10 && context_10.id;
    return {
        setters: [],
        execute: function () {
            WHITELIST = [
                /reddit.com$/,
                /wikipedia.org$/,
            ];
            exports_10("default", WHITELIST);
        }
    };
});
System.register("zombie-lord/demoblocking/blockedResponse", [], function (exports_11, context_11) {
    "use strict";
    var BLOCKED_RESPONSE;
    var __moduleName = context_11 && context_11.id;
    return {
        setters: [],
        execute: function () {
            BLOCKED_RESPONSE = `
HTTP/1.1 200 OK
X-Powered-By: Zanj-Dosyago-Corporation
X-Blocked-Internally: Custom ad blocking
Accept-Ranges: bytes
Cache-Control: public, max-age=0
Content-Type: text/html; charset=UTF-8
Content-Length: 244

<h1>Request blocked</h1>
<p>This navigation was prevented because you're in demo mode.</p>
<h2>Need to see this site?</h2>
<p>You can sign up for unrestricted access to the whole internet
  <a id=dosy-litewait-membership href=https://stretchy.live/signup.html?>here.</a>
</p>
`;
            exports_11("default", BLOCKED_RESPONSE);
        }
    };
});
System.register("zombie-lord/demoblocking/blockSites", ["url", "zombie-lord/demoblocking/whitelist", "zombie-lord/demoblocking/blockedResponse"], function (exports_12, context_12) {
    "use strict";
    var url_3, whitelist_js_1, blockedResponse_js_2, interceptId;
    var __moduleName = context_12 && context_12.id;
    async function blockSites(zombie, sessionId, id) {
        const { Target } = zombie;
        // note
        // to make a good try of avoiding message id collissions between ids issued in connection.js
        // and ids issued asynchronously here in replies given in response to messages received
        // TODO: could factor out a "nextId" function into common and use it everywhere.
        // even better could factor out a sendMessage function into common which takes (sessionId, and zombie/Target).
        interceptId = id;
        await Target.sendMessageToTarget({
            message: JSON.stringify({
                id: ++id,
                method: "Network.setRequestInterception", params: {
                    patterns: [
                        {
                            urlPatterns: 'http://*/*',
                        },
                        {
                            urlPatterns: 'https://*/*',
                        }
                    ]
                }
            }),
            sessionId
        });
        await Target.sendMessageToTarget({
            message: JSON.stringify({
                id: ++id,
                method: "Network.enable", params: {}
            }),
            sessionId
        });
        return id;
    }
    exports_12("blockSites", blockSites);
    async function onInterceptRequest({ sessionId, message }, Target) {
        if (message.method == "Network.requestIntercepted") {
            const { request: { url }, interceptionId, isNavigationRequest } = message.params;
            const host = new url_3.URL(url).host;
            const whiteListed = whitelist_js_1.default.some(regex => regex.test(host));
            if (!whiteListed) {
                if (isNavigationRequest) {
                    // we want to provide a response body to indicate that we blocked it via an ad blocker
                    await Target.sendMessageToTarget({
                        message: JSON.stringify({
                            id: ++interceptId,
                            method: "Network.continueInterceptedRequest", params: {
                                interceptionId,
                                rawResponse: Buffer.from(blockedResponse_js_2.default).toString('base64')
                            }
                        }),
                        sessionId
                    });
                }
                else {
                    await Target.sendMessageToTarget({
                        message: JSON.stringify({
                            id: ++interceptId,
                            method: "Network.continueInterceptedRequest", params: {
                                interceptionId,
                                errorReason: "BlockedByClient"
                            }
                        }),
                        sessionId
                    });
                }
            }
            else {
                try {
                    await Target.sendMessageToTarget({
                        message: JSON.stringify({
                            id: ++interceptId,
                            method: "Network.continueInterceptedRequest", params: {
                                interceptionId,
                            }
                        }),
                        sessionId
                    });
                }
                catch (e) {
                    console.warn("Issue with continuing request", e);
                }
            }
        }
    }
    exports_12("onInterceptRequest", onInterceptRequest);
    return {
        setters: [
            function (url_3_1) {
                url_3 = url_3_1;
            },
            function (whitelist_js_1_1) {
                whitelist_js_1 = whitelist_js_1_1;
            },
            function (blockedResponse_js_2_1) {
                blockedResponse_js_2 = blockedResponse_js_2_1;
            }
        ],
        execute: function () {
            interceptId = 0;
        }
    };
});
System.register("zombie-lord/connection", ["ws", "node-fetch", "fs", "path", "url", "querystring", "common", "args", "public/translateVoodooCRDP", "zombie-lord/screenShots", "zombie-lord/adblocking/blockAds"], function (exports_13, context_13) {
    "use strict";
    var ws_1, node_fetch_1, fs_3, path_3, url_4, querystring_1, common_js_3, args_js_1, translateVoodooCRDP_js_2, screenShots_js_1, blockAds_js_1, selectDropdownEvents, keysCanInputEvents, textComposition, favicon, elementInfo, scrollNotify, botDetectionEvasions, appMinifier, projector, injectionsScroll, pageContextInjectionsScroll, RECONNECT_MS, deskUA, mobUA, LANG, deskPLAT, mobPLAT, GrantedPermissions, PromptText, ROOT_SESSION, UA, PLAT, targets, waiting, sessions, loadings, tabs, originalMessage, AD_BLOCK_ON, DEMO_BLOCK_ON, id;
    var __moduleName = context_13 && context_13.id;
    function addSession(targetId, sessionId) {
        sessions.set(targetId, sessionId);
        sessions.set(sessionId, targetId);
    }
    function startLoading(sessionId) {
        let loading = loadings.get(sessionId);
        if (!loading) {
            loading = { waiting: 0, complete: 0, targetId: sessions.get(sessionId) };
            loadings.set(sessionId, loading);
        }
        loading.waiting++;
        return loading;
    }
    function endLoading(sessionId) {
        let loading = loadings.get(sessionId);
        if (!loading)
            throw new Error(`Expected loading for ${sessionId}`);
        loading.waiting--;
        loading.complete++;
        return loading;
    }
    function clearLoading(sessionId) {
        loadings.delete(sessionId);
    }
    function removeSession(id) {
        const otherId = sessions.get(id);
        sessions.delete(id);
        sessions.delete(otherId);
    }
    async function Connect({ port }, { adBlock: adBlock = true, demoBlock: demoBlock = false } = {}) {
        AD_BLOCK_ON = adBlock;
        if (demoBlock) {
            AD_BLOCK_ON = false;
            DEMO_BLOCK_ON = true;
        }
        const connection = {
            zombie: await makeZombie({ port }),
            port,
            browserTargetId: null,
            loadingCount: 0,
            totalBandwidth: 0,
            record: {},
            frameBuffer: [],
            meta: [],
            pausing: new Map(),
            worlds: new Map(),
            sessionSend,
            sessions,
            targets,
            tabs,
            sessionId: null,
            bounds: { width: 1280, height: 800 },
            navigator: { userAgent: UA, platform: PLAT, acceptLanguage: LANG },
            plugins: {},
        };
        connection.zombie.on('disconnect', async () => {
            console.log(`Reconnecting to zombie in ${RECONNECT_MS}`);
            await common_js_3.sleep(RECONNECT_MS);
            setTimeout(async () => {
                const next_connection = await Connect({ port: connection.port });
                Object.assign(connection, next_connection);
            }, RECONNECT_MS);
        });
        {
            const { doShot, queueTailShot } = screenShots_js_1.makeCamera(connection);
            connection.doShot = doShot;
            connection.queueTailShot = queueTailShot;
        }
        const { send, on, ons } = connection.zombie;
        const { targetInfo: browserTargetInfo } = await send("Target.getTargetInfo");
        connection.browserTargetId = browserTargetInfo.targetId;
        !common_js_3.DEBUG.legacyShots && await send("HeadlessExperimental.enable", {});
        await send("Target.setDiscoverTargets", { discover: true });
        await send("Target.setAutoAttach", {
            autoAttach: false,
            waitForDebuggerOnStart: false,
            flatten: true,
            windowOpen: true
        });
        on("Target.targetCreated", async ({ targetInfo }) => {
            const { targetId } = targetInfo;
            targets.add(targetId);
            tabs.set(targetId, targetInfo);
            connection.meta.push({ created: targetInfo, targetInfo });
            if (targetInfo.type == "page") {
                await send("Target.attachToTarget", { targetId, flatten: true });
            }
        });
        on("Target.targetInfoChanged", async ({ targetInfo }) => {
            const { targetId } = targetInfo;
            if (tabs.has(targetId)) {
                tabs.set(targetId, targetInfo);
                connection.meta.push({ changed: targetInfo, targetInfo });
                if (targetInfo.type == "page") {
                    connection.doShot();
                }
            }
            else {
                common_js_3.DEBUG.val > common_js_3.DEBUG.med && console.log("Changed event for removed target", targetId, targetInfo);
            }
        });
        on("Target.attachedToTarget", async ({ sessionId, targetInfo, waitingForDebugger }) => {
            const attached = { sessionId, targetInfo, waitingForDebugger };
            const { targetId } = targetInfo;
            common_js_3.DEBUG.val > common_js_3.DEBUG.med && console.log("Attached to target", sessionId, targetId);
            targets.add(targetId);
            addSession(targetId, sessionId);
            connection.meta.push({ attached });
            await setupTab({ attached });
        });
        on("Target.detachedFromTarget", ({ sessionId }) => {
            const detached = { sessionId };
            const targetId = sessions.get(sessionId);
            targets.delete(targetId);
            tabs.delete(targetId);
            removeSession(sessionId);
            deleteWorld(targetId);
            connection.meta.push({ detached });
        });
        on("Target.targetCrashed", meta => endTarget(meta, 'crashed'));
        on("Target.targetDestroyed", meta => endTarget(meta, 'destroyed'));
        ons("Target.receivedMessageFromTarget", receiveMessage);
        ons("LayerTree.layerPainted", receiveMessage);
        ons("Network.requestWillBeSent", receiveMessage);
        ons("Network.dataReceived", receiveMessage);
        ons("Network.loadingFailed", receiveMessage);
        ons("Network.responseReceived", receiveMessage);
        ons("Fetch.requestPaused", receiveMessage);
        ons("Fetch.authRequired", receiveMessage);
        ons("Runtime.bindingCalled", receiveMessage);
        ons("Runtime.consoleAPICalled", receiveMessage);
        ons("Runtime.executionContextCreated", receiveMessage);
        ons("Runtime.executionContextDestroyed", receiveMessage);
        ons("Runtime.executionContextsCleared", receiveMessage);
        ons("Page.frameNavigated", receiveMessage);
        ons("Page.fileChooserOpened", receiveMessage);
        ons("Page.javascriptDialogOpening", receiveMessage);
        ons("Page.downloadWillBegin", receiveMessage);
        ons("Runtime.exceptionThrown", receiveMessage);
        ons("Target.detachedFromTarget", receiveMessage);
        async function receiveMessage({ message, sessionId }) {
            if (message.method == "Network.dataReceived") {
                const { encodedDataLength, dataLength } = message.params;
                connection.totalBandwidth += (encodedDataLength || dataLength);
            }
            else if (message.method == "Target.detachedFromTarget") {
                removeSession(message.params.targetId);
                connection.meta.push({ detached: message.params });
            }
            else if (message.method == "Runtime.bindingCalled") {
                const { name, executionContextId } = message.params;
                let { payload } = message.params;
                try {
                    payload = JSON.parse(payload);
                }
                catch (e) {
                    console.warn(e);
                }
                let response;
                if (!!payload.method && !!payload.params) {
                    payload.name = payload.method;
                    payload.params.sessionId = sessionId;
                    response = await sessionSend(payload);
                }
                common_js_3.DEBUG.val >= common_js_3.DEBUG.med && console.log(JSON.stringify({ bindingCalled: { name, payload, response, executionContextId } }));
                await send("Runtime.evaluate", {
                    expression: `self.instructZombie.onmessage(${JSON.stringify({ response })})`,
                    contextId: executionContextId,
                    awaitPromise: true
                }, sessionId);
            }
            else if (message.method == "Runtime.consoleAPICalled") {
                const consoleMessage = message.params;
                const { args, executionContextId } = consoleMessage;
                try {
                    common_js_3.DEBUG.val && console.log(executionContextId, consoleMessage.args[0].value.slice(0, 255));
                }
                catch (e) { }
                if (!args.length)
                    return;
                const activeContexts = connection.worlds.get(connection.sessionId);
                common_js_3.DEBUG.val > common_js_3.DEBUG.low && console.log(`Active context`, activeContexts);
                if (false && (!activeContexts || !activeContexts.has(executionContextId))) {
                    common_js_3.DEBUG.val && console.log(`Blocking as is not a context in the active target.`);
                    return;
                }
                message = consoleMessage;
                const firstArg = args[0];
                try {
                    message = JSON.parse(firstArg.value);
                    message.executionContextId = executionContextId;
                    connection.meta.push(message);
                }
                catch (e) { }
                common_js_3.DEBUG.val > common_js_3.DEBUG.med && connection.meta.push({ consoleMessage });
            }
            else if (message.method == "Runtime.executionContextCreated") {
                common_js_3.DEBUG.val && console.log(JSON.stringify({ createdContext: message.params.context }));
                const { name: worldName, id: contextId } = message.params.context;
                if (worldName == translateVoodooCRDP_js_2.WorldName) {
                    addContext(sessionId, contextId);
                    await send("Runtime.addBinding", {
                        name: "instructZombie",
                        executionContextId: contextId
                    }, sessionId);
                }
            }
            else if (message.method == "Runtime.executionContextDestroyed") {
                const contextId = message.params.executionContextId;
                deleteContext(sessionId, contextId);
            }
            else if (message.method == "Runtime.executionContextsCleared") {
                common_js_3.DEBUG.val > common_js_3.DEBUG.med && console.log("Execution contexts cleared");
                deleteWorld(sessionId);
            }
            else if (message.method == "LayerTree.layerPainted") {
                connection.doShot();
            }
            else if (message.method == "Page.javascriptDialogOpening") {
                const { params: modal } = message;
                modal.sessionId = sessionId;
                console.log(JSON.stringify({ modal }));
                connection.meta.push({ modal });
            }
            else if (message.method == "Page.frameNavigated") {
                const { url, securityOrigin, unreachableUrl, parentId } = message.params.frame;
                const topFrame = !parentId;
                if (!!topFrame && (!!url || !!unreachableUrl)) {
                    clearLoading(sessionId);
                    const targetId = sessions.get(sessionId);
                    const navigated = {
                        targetId,
                        topFrame,
                        url, unreachableUrl
                    };
                    connection.meta.push({ navigated });
                    // this is strangely necessary to not avoid the situation where the layer tree is not updated
                    // on page navigation, meaning that layerPainted events stop firing after a couple of navigations
                    await send("LayerTree.enable", {}, sessionId);
                }
                if (!unreachableUrl && securityOrigin || url) {
                    const origin = securityOrigin || new url_4.URL(url).origin;
                    await send("Browser.grantPermissions", {
                        origin, permissions: GrantedPermissions
                    }, sessionId);
                }
            }
            else if (message.method == "Page.fileChooserOpened") {
                const { mode } = message.params;
                const fileChooser = { mode, sessionId };
                common_js_3.DEBUG.val > common_js_3.DEBUG.med && console.log(fileChooser, message);
                connection.meta.push({ fileChooser });
            }
            else if (message.method == "Page.downloadWillBegin") {
                const { params: download } = message;
                let uri = '';
                download.sessionId = sessionId;
                const downloadFileName = getFileFromURL(download.url);
                // notification and only do once
                connection.meta.push({ download });
                connection.lastDownloadFileName = downloadFileName;
                // logging 
                common_js_3.DEBUG.val > common_js_3.DEBUG.med && console.log({ downloadFileName, SECURE_VIEW_SCRIPT: common_js_3.SECURE_VIEW_SCRIPT, username: args_js_1.username });
                /**
                // This shouldn't be in the community edition
                const subshell = spawn(SECURE_VIEW_SCRIPT, [username, `${downloadFileName}`]);
          
                // subshell collect data and send once
                  subshell.stderr.pipe(process.stderr);
                  subshell.stdout.on('data', data => {
                    uri += data;
                  });
                  subshell.stdout.on('end', sendURL);
                  subshell.on('close', sendURL);
                  subshell.on('exit', sendURL);
          
                async function sendURL(code) {
                  if ( ! uri ) {
                    console.warn("No URI", downloadFileName);
                    //throw new Error( "No URI" );
                  }
                  if ( connection.lastSentFileName == connection.lastDownloadFileName ) return;
                  connection.lastSentFileName = connection.lastDownloadFileName;
                  if ( ! code ) {
                    // trim any whitespace added by the shell echo in the script
                    const url  = uri.trim();
                    const secureview = {url};
                    DEBUG.val > DEBUG.med && console.log("Send secure view", secureview);
                    connection.meta.push({secureview});
                  } else {
                    console.warn(`Secure View subshell exited with code ${code}`);
                  }
                }
                **/
            }
            else if (message.method == "Network.requestWillBeSent") {
                const resource = startLoading(sessionId);
                connection.meta.push({ resource });
            }
            else if (message.method == "Network.requestServedFromCache") {
                const resource = endLoading(sessionId);
                connection.meta.push({ resource });
            }
            else if (message.method == "Network.loadingFinished") {
                const resource = endLoading(sessionId);
                connection.meta.push({ resource });
            }
            else if (message.method == "Network.loadingFailed") {
                const resource = endLoading(sessionId);
                connection.meta.push({ resource });
            }
            else if (message.method == "Network.responseReceived") {
                const resource = endLoading(sessionId);
                connection.meta.push({ resource });
            }
            else if (message.method == "Runtime.exceptionThrown") {
                common_js_3.DEBUG.val && console.log(JSON.stringify({ exception: message.params }, null, 2));
            }
            else if (message.method == "Fetch.requestPaused") {
                //newtabIntercept({sessionId, message}, Target);
                if (AD_BLOCK_ON) {
                    await blockAds_js_1.onInterceptRequest({ sessionId, message }, connection.zombie);
                }
                else if (DEMO_BLOCK_ON) {
                    console.warn("Demo block disabled");
                    //whitelistIntercept({sessionId, message}, Target);
                }
            }
            else if (message.method == "Fetch.authRequired") {
                const { requestId, request, frameId, resourceType, authChallenge } = message.params;
                connection.pausing.set(requestId, request.url);
                connection.pausing.set(request.url, requestId);
                const authRequired = { authChallenge, requestId, resourceType };
                common_js_3.DEBUG.val > common_js_3.DEBUG.med && console.log({ authRequired });
                connection.meta.push({ authRequired });
            }
            else if (message.method && (message.method.startsWith("LayerTree") || message.method.startsWith("Page") || message.method.startsWith("Network"))) {
                // ignore
            }
            else {
                console.warn("Unknown message from target", message);
            }
        }
        return connection;
        async function setupTab({ attached }) {
            const { sessionId, targetInfo: { targetId } } = attached;
            try {
                common_js_3.DEBUG.val && console.log(sessionId, targetId, 'setting up');
                !common_js_3.DEBUG.legacyShots && await send("HeadlessExperimental.enable", {}, sessionId);
                if (!loadings.has(sessionId)) {
                    const loading = { waiting: 0, complete: 0, targetId };
                    loadings.set(sessionId, loading);
                }
                await send("Network.enable", {}, sessionId);
                await send("Network.setBlockedURLs", {
                    urls: [
                        "file://*",
                    ]
                }, sessionId);
                await send("Fetch.enable", {
                    handleAuthRequests: true,
                    patterns: [
                        {
                            urlPatterns: 'http://*/*',
                        },
                        {
                            urlPatterns: 'https://*/*',
                        }
                    ],
                }, sessionId);
                await send("Page.enable", {}, sessionId);
                await send("Page.setInterceptFileChooserDialog", {
                    enabled: true
                }, sessionId);
                await send("Page.setDownloadBehavior", {
                    behavior: "allow",
                    downloadPath: `/home/${args_js_1.username}/browser-downloads/`
                }, sessionId);
                await send("DOMSnapshot.enable", {}, sessionId);
                await send("Runtime.enable", {}, sessionId);
                // Page context injection (to set values in the page's original JS execution context
                await send("Page.addScriptToEvaluateOnNewDocument", {
                    // NOTE: NO world name to use the Page context
                    source: pageContextInjectionsScroll
                }, sessionId);
                // Isolated world injection
                let modeInjectionScroll = '';
                if (connection.plugins.appminifier) {
                    modeInjectionScroll += appMinifier;
                }
                if (connection.plugins.projector) {
                    modeInjectionScroll += projector;
                }
                await send("Page.addScriptToEvaluateOnNewDocument", {
                    source: [
                        saveTargetIdAsGlobal(targetId),
                        injectionsScroll,
                        modeInjectionScroll
                    ].join(''),
                    worldName: translateVoodooCRDP_js_2.WorldName
                }, sessionId);
                await send("Emulation.setVisibleSize", connection.bounds, sessionId);
                await send("Emulation.setScrollbarsHidden", { hidden: connection.hideBars }, sessionId);
                await send("Network.setUserAgentOverride", connection.navigator, sessionId);
                //id = await overrideNewtab(connection.zombie, sessionId, id);
                if (AD_BLOCK_ON) {
                    await blockAds_js_1.blockAds(connection.zombie, sessionId);
                }
                else if (DEMO_BLOCK_ON) {
                    console.warn("Demo block disabled.");
                    //await blockSites(connection.zombie, sessionId);
                }
                await send("LayerTree.enable", {}, sessionId);
            }
            catch (e) {
                console.warn("Error setting up", e, targetId, sessionId);
            }
        }
        async function sessionSend(command) {
            const that = this || connection;
            let sessionId;
            const { targetId } = command.params;
            // FIXME: I want THIS kind of debug. Cool.
            //DEBUG.has("commands") && console.log(JSON.stringify(command));
            if (command.name == "Page.navigate") {
                let { url } = command.params;
                url = url.trim();
                if (url.startsWith("file:") || isFileURL(url)) {
                    console.log("Blocking file navigation");
                    return {};
                }
            }
            if (command.name == "Emulation.setVisibleSize") {
                connection.bounds.width = command.params.width;
                connection.bounds.height = command.params.height;
            }
            if (command.name == "Emulation.setScrollbarsHidden") {
                connection.hideBars = command.params.hidden;
            }
            if (command.name == "Network.setUserAgentOverride") {
                connection.navigator.platform = command.params.platform;
                connection.navigator.userAgent = command.params.userAgent;
                connection.navigator.acceptLanguage = command.params.acceptLanguage;
            }
            if (!!targetId && !targets.has(targetId)) {
                common_js_3.DEBUG.val && console.log("Blocking as target does not exist.", targetId);
                return {};
            }
            if (command.name == "Target.closeTarget") {
                targets.delete(targetId);
                tabs.delete(targetId);
                const tSessionId = sessions.get(targetId);
                if (sessions.get(that.sessionId) == targetId) {
                    that.sessionId = null;
                }
                removeSession(targetId);
                if (tSessionId) {
                    common_js_3.DEBUG.val > common_js_3.DEBUG.med && console.log("Received close. Will send detach first.");
                    // FIX NOTE: these sleeps (have not test ms sensitivity, maybe we could go lower), FIX issue #130
                    // in other words, they prevent the seg fault crash on Target.closeTarget we get sometimes
                    await common_js_3.sleep(300);
                    await send("Target.detachFromTarget", { sessionId: tSessionId });
                    await common_js_3.sleep(300);
                }
            }
            if (command.name == "Fetch.continueWithAuth") {
                const { requestId } = command.params;
                const url = connection.pausing.get(requestId);
                connection.pausing.delete(requestId);
                connection.pausing.delete(url);
            }
            if (!command.name.startsWith("Target")) {
                sessionId = command.params.sessionId || that.sessionId;
            }
            else if (command.name == "Target.activateTarget") {
                that.sessionId = sessions.get(targetId);
                that.targetId = targetId;
                sessionId = that.sessionId;
                const worlds = connection.worlds.get(sessionId);
                if (!worlds) {
                    common_js_3.DEBUG.val && console.log("reloading because no worlds we can access yet");
                    await send("Page.reload", {}, sessionId);
                }
                else {
                    common_js_3.DEBUG.val && console.log("Activate", sessionId);
                }
            }
            if (command.name.startsWith("Target") || !sessionId) {
                if (command.name.startsWith("Page") || command.name.startsWith("Runtime")) {
                    sessionId = that.sessionId;
                    if (sessionId) {
                        return await send(command.name, command.params, sessionId);
                    }
                    else {
                        common_js_3.DEBUG.val && console.log(`Blocking as ${command.name} must be run with session.`, command);
                        return {};
                    }
                }
                else {
                    common_js_3.DEBUG.val > common_js_3.DEBUG.med && console.log({ zombieNoSessionCommand: command });
                    const resp = await send(command.name, command.params);
                    return resp;
                }
            }
            else {
                sessionId = command.params.sessionId || that.sessionId;
                if (!sessions.has(sessionId)) {
                    common_js_3.DEBUG.val && console.log("Blocking as session not exist.", sessionId);
                    return {};
                }
                if (!!command.params.contextId && !hasContext(sessionId, command.params.contextId)) {
                    common_js_3.DEBUG.val && console.log("Blocking as context does not exist.", command, sessionId, connection.worlds, connection.worlds.get(sessionId));
                    return {};
                }
                common_js_3.DEBUG.val > common_js_3.DEBUG.med &&
                    command.name !== "Page.captureScreenshot" &&
                    command.name !== "HeadlessExperimental.beginFrame" &&
                    console.log({ zombieSessionCommand: command });
                try {
                    const r = await send(command.name, command.params, sessionId);
                    return r;
                }
                catch (e) {
                    console.log(e);
                    try {
                        if (e.Error && e.Error.indexOf("session")) {
                            removeSession(e.request.params.sessionId);
                            common_js_3.DEBUG.val > common_js_3.DEBUG.med && console.log("Removed session");
                        }
                    }
                    catch (e2) { }
                }
            }
        }
        function addContext(id, contextId) {
            common_js_3.DEBUG.val > common_js_3.DEBUG.med && console.log({ addingContext: { id, contextId } });
            const otherId = sessions.get(id);
            let contexts = connection.worlds.get(id);
            if (!contexts) {
                contexts = new Set();
                connection.worlds.set(id, contexts);
                connection.worlds.set(otherId, contexts);
            }
            contexts.add(contextId);
        }
        function hasContext(sessionId, contextId) {
            const id = sessionId || connection.sessionId;
            const contexts = connection.worlds.get(id);
            if (!contexts)
                return false;
            else
                return contexts.has(contextId);
        }
        function deleteContext(id, contextId) {
            common_js_3.DEBUG.val > common_js_3.DEBUG.med && console.log({ deletingContext: { id, contextId } });
            const otherId = sessions.get(id);
            let contexts = connection.worlds.get(id);
            if (contexts) {
                contexts.delete(contextId);
            }
        }
        function deleteWorld(id) {
            const otherId = sessions.get(id);
            connection.worlds.delete(id);
            connection.worlds.delete(otherId);
        }
        function endTarget({ targetId }, label) {
            common_js_3.DEBUG.val > common_js_3.DEBUG.med && console.warn({ [label]: { targetId } });
            targets.delete(targetId);
            tabs.delete(targetId);
            removeSession(targetId);
            deleteWorld(targetId);
            connection.meta.push({ [label]: { targetId } });
        }
    }
    exports_13("default", Connect);
    function saveTargetIdAsGlobal(targetId) {
        return `
    {
      const targetId = "${targetId}";
      Object.defineProperty(self, 'targetId', {
        get: () => targetId
      });
    }
  `;
    }
    function isFileURL(url) {
        const firstColonIndex = url.indexOf(':');
        const scheme = url.slice(firstColonIndex - 4, firstColonIndex);
        return scheme == 'file';
    }
    async function makeZombie({ port: port = 9222 } = {}) {
        const { webSocketDebuggerUrl } = await node_fetch_1.default(`http://localhost:${port}/json/version`).then(r => r.json());
        const socket = new ws_1.default(webSocketDebuggerUrl);
        const Resolvers = {};
        const Handlers = {};
        socket.on('message', handle);
        let id = 0;
        async function send(method, params = {}, sessionId) {
            const message = {
                method, params, sessionId,
                id: ++id
            };
            const key = `${sessionId || ROOT_SESSION}:${message.id}`;
            let resolve;
            const promise = new Promise(res => resolve = res);
            Resolvers[key] = resolve;
            socket.send(JSON.stringify(message));
            return promise;
        }
        async function handle(message) {
            const stringMessage = message;
            message = JSON.parse(message);
            const { sessionId } = message;
            const { method, params } = message;
            const { id, result } = message;
            if (id) {
                const key = `${sessionId || ROOT_SESSION}:${id}`;
                const resolve = Resolvers[key];
                if (!resolve) {
                    console.warn(`No resolver for key`, key, stringMessage.slice(0, 140));
                }
                else {
                    Resolvers[key] = undefined;
                    try {
                        await resolve(result);
                    }
                    catch (e) {
                        console.warn(`Resolver failed`, e, key, stringMessage.slice(0, 140), resolve);
                    }
                }
            }
            else if (method) {
                const listeners = Handlers[method];
                if (Array.isArray(listeners)) {
                    for (const func of listeners) {
                        try {
                            await func({ message, sessionId });
                        }
                        catch (e) {
                            console.warn(`Listener failed`, method, e, func.toString().slice(0, 140), stringMessage.slice(0, 140));
                        }
                    }
                }
            }
            else {
                console.warn(`Unknown message on socket`, message);
            }
        }
        function on(method, handler) {
            let listeners = Handlers[method];
            if (!listeners) {
                Handlers[method] = listeners = [];
            }
            listeners.push(wrap(handler));
        }
        function ons(method, handler) {
            let listeners = Handlers[method];
            if (!listeners) {
                Handlers[method] = listeners = [];
            }
            listeners.push(handler);
        }
        function wrap(fn) {
            return ({ message, sessionId }) => fn(message.params);
        }
        let resolve;
        const promise = new Promise(res => resolve = res);
        socket.on('open', () => resolve());
        await promise;
        return {
            send,
            on, ons
        };
    }
    function getFileFromURL(url) {
        url = new url_4.URL(url);
        const { pathname } = url;
        const nodes = pathname.split('/');
        let lastNode = nodes.pop();
        if (!lastNode) {
            throw Error(`URL cannot be parsed to get filename`);
        }
        return querystring_1.unescape(lastNode);
    }
    return {
        setters: [
            function (ws_1_1) {
                ws_1 = ws_1_1;
            },
            function (node_fetch_1_1) {
                node_fetch_1 = node_fetch_1_1;
            },
            function (fs_3_1) {
                fs_3 = fs_3_1;
            },
            function (path_3_1) {
                path_3 = path_3_1;
            },
            function (url_4_1) {
                url_4 = url_4_1;
            },
            function (querystring_1_1) {
                querystring_1 = querystring_1_1;
            },
            function (common_js_3_1) {
                common_js_3 = common_js_3_1;
            },
            function (args_js_1_1) {
                args_js_1 = args_js_1_1;
            },
            function (translateVoodooCRDP_js_2_1) {
                translateVoodooCRDP_js_2 = translateVoodooCRDP_js_2_1;
            },
            function (screenShots_js_1_1) {
                screenShots_js_1 = screenShots_js_1_1;
            },
            function (blockAds_js_1_1) {
                blockAds_js_1 = blockAds_js_1_1;
            }
        ],
        execute: function () {
            // standard injections
            selectDropdownEvents = fs_3.default.readFileSync(path_3.default.join(__dirname, 'injections', 'selectDropdownEvents.js')).toString();
            keysCanInputEvents = fs_3.default.readFileSync(path_3.default.join(__dirname, 'injections', 'keysCanInput.js')).toString();
            textComposition = fs_3.default.readFileSync(path_3.default.join(__dirname, 'injections', 'textComposition.js')).toString();
            favicon = fs_3.default.readFileSync(path_3.default.join(__dirname, 'injections', 'favicon.js')).toString();
            elementInfo = fs_3.default.readFileSync(path_3.default.join(__dirname, 'injections', 'elementInfo.js')).toString();
            scrollNotify = fs_3.default.readFileSync(path_3.default.join(__dirname, 'injections', 'scrollNotify.js')).toString();
            botDetectionEvasions = fs_3.default.readFileSync(path_3.default.join(__dirname, 'injections', 'pageContext', 'botDetectionEvasions.js')).toString();
            // plugins injections
            appMinifier = fs_3.default.readFileSync(path_3.default.join(__dirname, '..', 'plugins', 'appminifier', 'injections.js')).toString();
            projector = fs_3.default.readFileSync(path_3.default.join(__dirname, '..', 'plugins', 'projector', 'injections.js')).toString();
            // just concatenate the scripts together and do one injection
            // but for debugging better to add each separately
            // we can put in an array, and loop over to add each
            injectionsScroll = botDetectionEvasions + favicon + keysCanInputEvents + scrollNotify + elementInfo + textComposition + selectDropdownEvents;
            pageContextInjectionsScroll = botDetectionEvasions;
            RECONNECT_MS = 5000;
            deskUA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36";
            mobUA = "Mozilla/5.0 (Linux; Android 8.1.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3384.0 Mobile Safari/537.36";
            LANG = "en-US";
            deskPLAT = "Win32";
            mobPLAT = "Android";
            GrantedPermissions = ["geolocation", "notifications", "flash"];
            PromptText = "Dosy was here.";
            ROOT_SESSION = 'root';
            UA = mobUA;
            PLAT = mobPLAT;
            targets = new Set();
            waiting = new Map();
            sessions = new Map();
            loadings = new Map();
            tabs = new Map();
            originalMessage = new Map();
            AD_BLOCK_ON = true;
            DEMO_BLOCK_ON = false;
            id = 0;
        }
    };
});
System.register("zombie-lord/controller", ["zombie-lord/connection", "common", "fs"], function (exports_14, context_14) {
    "use strict";
    var connection_js_1, common_js_4, fs_4, connections, Options, TAIL_START, lastTailShot, lastHash, controller_api;
    var __moduleName = context_14 && context_14.id;
    function move(a_dest, a_src) {
        while (a_src.length) {
            a_dest.push(a_src.shift());
        }
        return a_dest;
    }
    return {
        setters: [
            function (connection_js_1_1) {
                connection_js_1 = connection_js_1_1;
            },
            function (common_js_4_1) {
                common_js_4 = common_js_4_1;
            },
            function (fs_4_1) {
                fs_4 = fs_4_1;
            }
        ],
        execute: function () {
            connections = new Map();
            Options = {
                adBlock: true,
                demoBlock: false
            };
            TAIL_START = 100;
            lastTailShot = false;
            controller_api = {
                setOptions(new_options) {
                    Object.assign(Options, new_options);
                },
                async close(port) {
                    let connection = connections.get(port);
                    if (!connection) {
                        return true;
                    }
                    return await connection.close();
                },
                getActiveTarget(port) {
                    const connection = connections.get(port);
                    if (!connection)
                        return;
                    const activeTargetId = connection.sessions.get(connection.sessionId);
                    return activeTargetId;
                },
                addTargets(tabs, port) {
                    if (!tabs)
                        throw new TypeError(`No tabs provided.`);
                    const connection = connections.get(port);
                    if (!connection)
                        return;
                    tabs.forEach(({ targetId }) => {
                        connection.targets.add(targetId);
                    });
                },
                hasTab(targetId, port) {
                    const connection = connections.get(port);
                    if (!connection)
                        return false;
                    return connection.tabs.has(targetId);
                },
                hasSession(targetId, port) {
                    const connection = connections.get(port);
                    if (!connection)
                        return false;
                    return connection.sessions.has(targetId);
                },
                getBrowserTargetId(port) {
                    const connection = connections.get(port);
                    if (!connection)
                        return;
                    return connection.browserTargetId;
                },
                async send(command, port) {
                    let retVal = {};
                    let connection = connections.get(port);
                    let Page, Target;
                    try {
                        if (!connection) {
                            connection = await connection_js_1.default({ port }, Options);
                            connections.set(port, connection);
                        }
                        ({ Page, Target } = connection.zombie);
                        command = command || {};
                        common_js_4.DEBUG.val && !command.isBufferedResultsCollectionOnly && console.log(JSON.stringify(command));
                        if (command.isBufferedResultsCollectionOnly) {
                            retVal.data = {};
                        }
                        else if (command.isZombieLordCommand) {
                            switch (command.name) {
                                // ALTERNATE : we COULD change this API to NOT reveal contextIds to client.
                                // and instead offer a command like Connection.broadcastToAllContextsInSession()
                                // that takes a script to evaluate 
                                case "Connection.doShot": {
                                    common_js_4.DEBUG.val && console.log("Calling do shot");
                                    connection.doShot();
                                }
                                case "Connection.getContextIdsForActiveSession": {
                                    const contexts = connection.worlds.get(connection.sessionId);
                                    const targetId = connection.sessions.get(connection.sessionId);
                                    // console.log(connection.worlds, connection.sessions, contexts,targetId,connection.sessionId);
                                    if (!contexts) {
                                        retVal.data = { contextIds: [] };
                                    }
                                    else {
                                        common_js_4.DEBUG.val > common_js_4.DEBUG.med && console.log({ currentSession: connection.sessionId, targetId, contexts: [...contexts.values()] });
                                        retVal.data = { contextIds: [...contexts.values()] };
                                    }
                                    break;
                                }
                                case "Connection.getAllContextIds": {
                                    const allContexts = [];
                                    for (const sessionId of connection.worlds.keys()) {
                                        // because we double book entry in connection worlds both sessionId and targetId
                                        // so we have to check if the key is targetId and if so we skip
                                        if (connection.targets.has(sessionId))
                                            continue;
                                        const contexts = connection.worlds.get(sessionId);
                                        if (contexts) {
                                            for (const contextId of contexts) {
                                                allContexts.push({ sessionId, contextId });
                                            }
                                        }
                                    }
                                    retVal.data = { sessionContextIdPairs: allContexts };
                                    break;
                                }
                                case "Connection.getAllSessionIds": {
                                    const sessionIds = [];
                                    for (const sessionId of connection.worlds.keys()) {
                                        // because we double book entry in connection worlds both sessionId and targetId
                                        // so we have to check if the key is targetId and if so we skip
                                        if (connection.targets.has(sessionId))
                                            continue;
                                        sessionIds.push(sessionId);
                                    }
                                    retVal.data = { sessionIds };
                                    break;
                                }
                                case "Connection.setIsFirefox": {
                                    connection.isFirefox = true;
                                    break;
                                }
                                case "Connection.setIsSafari": {
                                    connection.isSafari = true;
                                    break;
                                }
                                case "Connection.getTabs": {
                                    const tabs = Array.from(connection.tabs.values());
                                    retVal.data = { tabs };
                                    break;
                                }
                                case "Connection.enableMode": {
                                    // reset first
                                    const plugins = Object.keys(connection.plugins);
                                    for (const pluginName of plugins) {
                                        connection.plugins[pluginName] = false;
                                    }
                                    // now enable 
                                    const { pluginName } = command.params;
                                    if (pluginName) {
                                        connection.plugins[pluginName] = true;
                                    }
                                    retVal.data = {};
                                    break;
                                }
                                case "Connection.resetMode": {
                                    const plugins = Object.keys(connection.plugins);
                                    for (const pluginName of plugins) {
                                        connection.plugins[pluginName] = false;
                                    }
                                    retVal.data = {};
                                    break;
                                }
                            }
                        }
                        else if (command.name) {
                            common_js_4.DEBUG.val > common_js_4.DEBUG.med && console.log({ command });
                            if (command.dontWait) {
                                connection.sessionSend(command);
                                retVal.data = {};
                            }
                            else {
                                const response = await connection.sessionSend(command);
                                //console.log("XCHK controller.js call response", command, response);
                                retVal.data = response;
                            }
                            try {
                                if (command.name == "Page.navigate" && command.params.url.startsWith("https://fyutchaflex-recordings.surge.sh")) {
                                    this.logIP();
                                }
                            }
                            catch (e) {
                                console.warn("some bug");
                            }
                        }
                        if (command.requiresLoad) {
                            // we could do a promise race here load vs sleep
                            //await Page.loadEventFired();
                            await common_js_4.sleep();
                        }
                        if (command.requiresExtraWait) {
                            await common_js_4.sleep(command.extraWait);
                        }
                        if (command.requiresShot) {
                            await connection.doShot({ ignoreHash: command.ignoreHash });
                        }
                        if (command.requiresTailShot) {
                            connection.queueTailShot({ ignoreHash: command.ignoreHash });
                        }
                        if (connection.frameBuffer.length && command.receivesFrames) {
                            retVal.frameBuffer = move([], connection.frameBuffer);
                            retVal.frameBuffer = retVal.frameBuffer.filter(frame => {
                                if (frame.hash == connection.lastHash) {
                                    common_js_4.DEBUG.shotDebug && common_js_4.DEBUG.val > common_js_4.DEBUG.med && console.log(`DROP frame ${frame.hash}`);
                                    return false;
                                }
                                else {
                                    connection.lastHash = frame.hash;
                                    common_js_4.DEBUG.shotDebug && common_js_4.DEBUG.val > common_js_4.DEBUG.med && console.log(`SEND frame ${frame.hash}`);
                                    return true;
                                }
                            });
                            common_js_4.DEBUG.val > common_js_4.DEBUG.med && console.log(`Sending ${retVal.frameBuffer.length} frames.`);
                        }
                        if (connection.meta.length) {
                            retVal.meta = move([], connection.meta);
                            common_js_4.DEBUG.val > common_js_4.DEBUG.med && console.log(`Sending ${retVal.meta.length} meta.`);
                        }
                        retVal.totalBandwidth = connection.totalBandwidth;
                    }
                    catch (e) {
                        console.warn(e);
                        retVal.data = { error: e + '', resetRequired: true };
                    }
                    return retVal;
                },
                saveIP(ip_address) {
                    this.ip_address = ip_address;
                },
                logIP() {
                    try {
                        fs_4.default.appendFileSync("/tmp/badIPLog", this.ip_address + "\n");
                    }
                    catch (e) {
                        console.warn("Error appending log", e);
                        try {
                            fs_4.default.writeFileSync("/tmp/badIPLog", this.ip_address + "\n");
                        }
                        catch (e2) {
                            console.warn("Error writing log", e);
                        }
                    }
                }
            };
            exports_14("default", controller_api);
        }
    };
});
System.register("zombie-lord/api", ["zombie-lord/launcher", "zombie-lord/controller"], function (exports_15, context_15) {
    "use strict";
    var launcher_js_1, controller_js_1, api;
    var __moduleName = context_15 && context_15.id;
    return {
        setters: [
            function (launcher_js_1_1) {
                launcher_js_1 = launcher_js_1_1;
            },
            function (controller_js_1_1) {
                controller_js_1 = controller_js_1_1;
            }
        ],
        execute: function () {
            api = {
                life: launcher_js_1.default,
                act: controller_js_1.default
            };
            exports_15("default", api);
        }
    };
});
System.register("public/plugins/demo/page", [], function (exports_16, context_16) {
    "use strict";
    var __moduleName = context_16 && context_16.id;
    function pluginsDemoPage({ body: body = '' } = {}) {
        return `
    <head>
      <title>Demo</title>
      <link rel=stylesheet href=/plugins/demo/styles/styletidyup.css>
      <!--
      <link rel=stylesheet href=styles/basic.css>
      <link rel=stylesheet href=styles/dark.css>
      <link rel=stylesheet href=styles/light.css>
      <link rel=stylesheet href=styles/darkmode.css>
      -->
    </head>
    <body>
      ${body}
      <script src=/plugins/demo/listen.js></script>
      <script src=/plugins/demo/doingit.js></script>
      <script src=/plugins/demo/stripe.js></script>
    </body>
  `;
    }
    exports_16("pluginsDemoPage", pluginsDemoPage);
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("ws-server", ["express", "http", "https", "node-fetch", "multer", "ws", "fs", "path", "body-parser", "cookie-parser", "public/plugins/demo/page", "zombie-lord/api", "args", "common", "server"], function (exports_17, context_17) {
    "use strict";
    var express_1, http_1, https_1, node_fetch_2, multer_1, ws_2, fs_5, path_4, body_parser_1, cookie_parser_1, page_js_1, api_js_1, args_js_2, common_js_5, server_js_1, protocol, COOKIE_OPTS, storage, upload, Queue, messageQueueRunning, browserTargetId, requestId;
    var __moduleName = context_17 && context_17.id;
    async function start_ws_server(port, zombie_port, allowed_user_cookie, session_token) {
        common_js_5.DEBUG.val && console.log(`Starting websocket server on ${port}`);
        const app = express_1.default();
        const server_port = port;
        app.use(body_parser_1.default.urlencoded({ extended: true }));
        app.use(body_parser_1.default.json({ extended: true }));
        app.use(cookie_parser_1.default());
        if (args_js_2.start_mode == "signup") {
            app.get("/", (req, res) => res.sendFile(path_4.default.join(__dirname, 'public', 'index.html')));
        }
        else {
            app.get("/", (req, res) => res.sendFile(path_4.default.join(__dirname, 'public', 'image.html')));
            app.get("/login", (req, res) => {
                const { token, ran } = req.query;
                if (token == session_token) {
                    res.cookie(common_js_5.COOKIENAME, allowed_user_cookie, COOKIE_OPTS);
                    const url = `/?ran=${ran || Math.random()}#${session_token}`;
                    res.redirect(url);
                }
                else {
                    res.type("html");
                    if (session_token == 'token2') {
                        res.end(`Incorrect token ${token}/token2. <a href=/login?token=token2>Login first.</a>`);
                    }
                    else {
                        res.end(`Incorrect token "${token}". <a href=https://${req.hostname}/signup.html>Login first.</a>`);
                    }
                }
            });
        }
        app.use(express_1.default.static('public'));
        app.post('/current/:current/event/:event', wrap(async (req, res) => {
            const actualUri = 'https://' + req.headers.host + ':8001' + req.url;
            const resp = await node_fetch_2.default(actualUri, { method: 'POST', body: JSON.stringify(req.body),
                headers: {
                    'Content-Type': 'application/json'
                } }).then(r => r.text());
            res.end(page_js_1.pluginsDemoPage({ body: resp }));
        }));
        const sslBranch = common_js_5.BRANCH == 'master' ? 'master' : 'staging';
        const secure_options = {};
        try {
            const sec = {
                cert: fs_5.default.readFileSync(`./sslcert/${sslBranch}/fullchain.pem`),
                key: fs_5.default.readFileSync(`./sslcert/${sslBranch}/privkey.pem`),
                ca: fs_5.default.readFileSync(`./sslcert/${sslBranch}/chain.pem`),
            };
            Object.assign(secure_options, sec);
        }
        catch (e) {
            console.warn(`No certs found so will use insecure no SSL.`);
        }
        const secure = secure_options.cert && secure_options.ca && secure_options.key;
        const server = protocol.createServer.apply(protocol, common_js_5.GO_SECURE && secure ? [secure_options, app] : [app]);
        const wss = new ws_2.default.Server({ server });
        wss.on('connection', (ws, req) => {
            const cookie = req.headers.cookie;
            api_js_1.default.act.saveIP(req.connection.remoteAddress);
            common_js_5.DEBUG.val && console.log({ connectionIp: req.connection.remoteAddress });
            if (common_js_5.DEBUG.dev || allowed_user_cookie == 'cookie' ||
                (cookie && cookie.includes(`${common_js_5.COOKIENAME}=${allowed_user_cookie}`))) {
                api_js_1.default.life.onDeath(zombie_port, () => {
                    //console.log("Closing as zombie crashed.");
                    //ws.close();
                });
                ws.on('message', message => {
                    const func = async () => {
                        const Data = [], Frames = [], Meta = [], State = {};
                        message = JSON.parse(message);
                        const { zombie, tabs, messageId } = message;
                        try {
                            if (zombie) {
                                const { events } = zombie;
                                let { receivesFrames } = zombie;
                                if (receivesFrames) {
                                    // switch it on in DEBUG and save it on the websocket for all future events
                                    common_js_5.DEBUG.noShot = false;
                                    ws.receivesFrames = receivesFrames;
                                }
                                else {
                                    receivesFrames = ws.receivesFrames;
                                }
                                common_js_5.DEBUG.val && console.log(`Starting ${events.length} events for message ${messageId}`);
                                await server_js_1.eventSendLoop(events, { Data, Frames, Meta, State, receivesFrames });
                                common_js_5.DEBUG.val && console.log(`Ending ${events.length} events for message ${messageId}\n`);
                                const { totalBandwidth } = State;
                                so(ws, { messageId, data: Data, frameBuffer: Frames, meta: Meta, totalBandwidth });
                            }
                            else if (tabs) {
                                let { data: { targetInfos: targets } } = await server_js_1.timedSend({
                                    name: "Target.getTargets",
                                    params: {},
                                }, zombie_port);
                                browserTargetId = browserTargetId || api_js_1.default.act.getBrowserTargetId(zombie_port);
                                targets = targets.filter(({ targetId, type }) => type == 'page' && api_js_1.default.act.hasSession(targetId, zombie_port));
                                const activeTarget = api_js_1.default.act.getActiveTarget(zombie_port);
                                api_js_1.default.act.addTargets(targets, zombie_port);
                                so(ws, { messageId, activeTarget, tabs: targets });
                            }
                            else {
                                console.warn(JSON.stringify({ unknownMessage: message }));
                            }
                        }
                        catch (e) {
                            so(ws, { messageId, data: [
                                    {
                                        error: "Failed to communicate with cloud browser",
                                        resetRequired: true
                                    }
                                ], frameBuffer: [], meta: [], totalBandwidth: 0 });
                        }
                    };
                    Queue.funcs.push(func);
                    if (!messageQueueRunning) {
                        runMessageQueue();
                    }
                });
            }
            else {
                const hadSession = !!cookie && cookie.includes(common_js_5.COOKIENAME);
                const msg = hadSession ?
                    `Your session has expired. Please log back in.`
                    : `No session detected, have you signed up yet?`;
                const error = { msg, willCloseSocket: true, hadSession };
                so(ws, { messageId: 1, data: [{ error }] });
                console.log("Closing as not authorized.");
                ws.close();
            }
        });
        server.listen(server_port, async (err) => {
            if (err) {
                console.error('err', err);
                process.exit(1);
            }
            else {
                addHandlers();
                common_js_5.DEBUG.val && console.log({ uptime: new Date, message: 'websocket server up', server_port });
            }
        });
        function so(socket, message) {
            if (!message)
                return;
            if (typeof message == "string" || Array.isArray(message)) {
                message = message;
            }
            else {
                message = JSON.stringify(message);
            }
            try {
                socket.send(message);
            }
            catch (e) {
                console.warn(`Websocket error with sending message`, e, message);
            }
        }
        function addHandlers() {
            app.get(`/api/${common_js_5.version}/tabs`, wrap(async (req, res) => {
                const cookie = req.cookies[common_js_5.COOKIENAME];
                if (!common_js_5.DEBUG.dev && allowed_user_cookie !== 'cookie' &&
                    (cookie !== allowed_user_cookie)) {
                    return res.status(401).send('{"err":"forbidden"}');
                }
                requestId++;
                res.type('json');
                let targets;
                try {
                    ({ data: { targetInfos: targets } } = await server_js_1.timedSend({
                        name: "Target.getTargets",
                        params: {},
                    }, zombie_port));
                    browserTargetId = browserTargetId || api_js_1.default.act.getBrowserTargetId(zombie_port);
                    targets = targets.filter(({ targetId, type }) => type == 'page' && api_js_1.default.act.hasSession(targetId, zombie_port));
                    const activeTarget = api_js_1.default.act.getActiveTarget(zombie_port);
                    api_js_1.default.act.addTargets(targets, zombie_port);
                    res.end(JSON.stringify({ tabs: targets, activeTarget, requestId }));
                }
                catch (e) {
                    console.warn('th', e);
                    //res.end(JSON.stringify({error:e+'', resetRequired:true}));
                    throw e;
                }
            }));
            app.post("/file", upload.array("files", 6), async (req, res) => {
                const cookie = req.cookies[common_js_5.COOKIENAME];
                if (!common_js_5.DEBUG.dev && allowed_user_cookie !== 'cookie' &&
                    (cookie !== allowed_user_cookie)) {
                    return res.status(401).send('{"err":"forbidden"}');
                }
                const { files } = req;
                const { sessionid: sessionId } = req.body;
                const action = !files || files.length == 0 ? 'cancel' : 'accept';
                const command = {
                    name: "Page.handleFileChooser",
                    params: {
                        files: files && files.map(({ path }) => path),
                        action
                    },
                    sessionId
                };
                common_js_5.DEBUG.val > common_js_5.DEBUG.med && console.log("We need to send the right command to the browser session", files, sessionId, action, command);
                const result = await api_js_1.default.act.send(command, zombie_port);
                if (result.error) {
                    res.status(500).send(JSON.stringify({ error: 'there was an error attaching the files' }));
                }
                else {
                    common_js_5.DEBUG.val > common_js_5.DEBUG.med && console.log("Sent files to file input", result, files);
                    const result = {
                        success: true,
                        files: files.map(({ originalName, size }) => ({ name: originalName, size }))
                    };
                    res.json(files);
                }
            });
            // error handling middleware
            app.use('*', (err, req, res, next) => {
                try {
                    res.type('json');
                }
                catch (e) { }
                let message = '';
                if (common_js_5.DEBUG.dev && common_js_5.DEBUG.val) {
                    message = s({ error: { msg: err.message, stack: err.stack.split(/\n/g) } });
                }
                else {
                    message = s({ error: err.message || err + '', resetRequired: true });
                }
                res.write(message);
                res.end();
                console.warn(err);
            });
        }
        async function runMessageQueue() {
            if (messageQueueRunning)
                return;
            messageQueueRunning = true;
            while (Queue.funcs.length) {
                const func = Queue.funcs.shift();
                try {
                    await func();
                }
                catch (e) {
                    console.warn("error while running message queue", e);
                }
                // await sleep(TIME_BETWEEN_MESSAGES);
            }
            messageQueueRunning = false;
        }
        // helpers
        function wrap(fn) {
            return async function handler(req, res, next) {
                try {
                    await fn(req, res, next);
                }
                catch (e) {
                    common_js_5.DEBUG.val && console.log(e);
                    console.info(`caught error in ${fn}`);
                    next(e);
                }
            };
        }
        function s(o) {
            let r;
            if (typeof o == "string")
                r = 0;
            else
                try {
                    r = JSON.stringify(o, null, 2);
                }
                catch (e) {
                    common_js_5.DEBUG.val > common_js_5.DEBUG.hi && console.warn(e);
                }
            try {
                r = r + '';
            }
            catch (e) {
                common_js_5.DEBUG.val > common_js_5.DEBUG.hi && console.warn(e);
            }
            return r;
        }
    }
    exports_17("start_ws_server", start_ws_server);
    function nextFileName(ext = '') {
        if (!ext.startsWith('.')) {
            ext = '.' + ext;
        }
        return `file${(Math.random() * 1000000).toString(36)}${ext}`;
    }
    return {
        setters: [
            function (express_1_1) {
                express_1 = express_1_1;
            },
            function (http_1_1) {
                http_1 = http_1_1;
            },
            function (https_1_1) {
                https_1 = https_1_1;
            },
            function (node_fetch_2_1) {
                node_fetch_2 = node_fetch_2_1;
            },
            function (multer_1_1) {
                multer_1 = multer_1_1;
            },
            function (ws_2_1) {
                ws_2 = ws_2_1;
            },
            function (fs_5_1) {
                fs_5 = fs_5_1;
            },
            function (path_4_1) {
                path_4 = path_4_1;
            },
            function (body_parser_1_1) {
                body_parser_1 = body_parser_1_1;
            },
            function (cookie_parser_1_1) {
                cookie_parser_1 = cookie_parser_1_1;
            },
            function (page_js_1_1) {
                page_js_1 = page_js_1_1;
            },
            function (api_js_1_1) {
                api_js_1 = api_js_1_1;
            },
            function (args_js_2_1) {
                args_js_2 = args_js_2_1;
            },
            function (common_js_5_1) {
                common_js_5 = common_js_5_1;
            },
            function (server_js_1_1) {
                server_js_1 = server_js_1_1;
            }
        ],
        execute: function () {
            protocol = common_js_5.GO_SECURE ? https_1.default : http_1.default;
            COOKIE_OPTS = {
                secure: common_js_5.GO_SECURE,
                httpOnly: true,
                maxAge: 345600000,
                sameSite: 'Strict'
            };
            storage = multer_1.default.diskStorage({
                destination: (req, file, cb) => cb(null, path_4.default.join(__dirname, '..', 'uploads')),
                filename: (req, file, cb) => {
                    return cb(null, nextFileName(path_4.default.extname(file.originalname)));
                }
            });
            upload = multer_1.default({ storage });
            Queue = {
                funcs: []
            };
            messageQueueRunning = false;
            requestId = 0;
        }
    };
});
System.register("server", ["express", "zombie-lord/api", "common", "ws-server", "args"], function (exports_18, context_18) {
    "use strict";
    var express_2, api_js_2, common_js_6, ws_server_js_1, BEGIN_AGAIN, COMMAND_MAX_WAIT, MAX_FRAME, EXPEDITE, args_js_3, demoBlock, ws_started, zombie_started;
    var __moduleName = context_18 && context_18.id;
    async function begin() {
        let port;
        if (args_js_3.start_mode !== "signup") {
            try {
                ({ port } = await api_js_2.default.life.newZombie({ port: args_js_3.chrome_port, username: args_js_3.username }));
                api_js_2.default.act.setOptions({ demoBlock });
            }
            catch (e) {
                console.warn("ZL start error", e);
                api_js_2.default.life.kill(args_js_3.chrome_port);
                setTimeout(begin, BEGIN_AGAIN);
            }
            if (port !== args_js_3.chrome_port)
                throw Error(`Port must match port allocated`);
            common_js_6.DEBUG.val && console.log({ zombie: "gnawing at port ", port });
            await common_js_6.sleep(BEGIN_AGAIN);
        }
        if (!ws_started) {
            await ws_server_js_1.start_ws_server(args_js_3.app_port, args_js_3.chrome_port, args_js_3.cookie, args_js_3.token);
            ws_started = true;
        }
    }
    function timedSend(command, port) {
        if (command.dontWait) {
            command.dontWait = false;
            console.warn(`Can't set don't wait outside server`);
        }
        if (EXPEDITE.has(command.name)) {
            command.dontWait = true;
        }
        if (command.dontWait) {
            return api_js_2.default.act.send(command, port);
        }
        else {
            return Promise.race([
                api_js_2.default.act.send(command, port),
                common_js_6.throwAfter(COMMAND_MAX_WAIT, command, port)
            ]);
        }
    }
    exports_18("timedSend", timedSend);
    async function eventSendLoop(events, { Data, Frames, Meta, State, receivesFrames }) {
        for (const { command } of events) {
            try {
                command.receivesFrames = receivesFrames && !command.isZombieLordCommand;
                common_js_6.DEBUG.val && console.log(`Sending ${JSON.stringify(command)}...`);
                const { data, frameBuffer, meta, totalBandwidth } = await timedSend(command, args_js_3.chrome_port);
                common_js_6.DEBUG.val && console.log(`Sent ${JSON.stringify(command)}!`);
                Data.push(data);
                if (meta) {
                    // filter out all but the last resource for each targetId
                    const latestResourceForTarget = {};
                    const nonResourceMeta = meta.filter(mi => {
                        if (!mi.resource)
                            return true;
                        latestResourceForTarget[mi.resource.targetId] = mi;
                        return false;
                    });
                    Meta.push(...nonResourceMeta, ...Object.values(latestResourceForTarget));
                }
                if (frameBuffer) {
                    Frames.push(...frameBuffer);
                    while (Frames.length > MAX_FRAME)
                        Frames.shift();
                }
                State.totalBandwidth = totalBandwidth;
            }
            catch (e) {
                console.warn(e);
                Data.push({ error: e + '' });
            }
        }
    }
    exports_18("eventSendLoop", eventSendLoop);
    return {
        setters: [
            function (express_2_1) {
                express_2 = express_2_1;
            },
            function (api_js_2_1) {
                api_js_2 = api_js_2_1;
            },
            function (common_js_6_1) {
                common_js_6 = common_js_6_1;
            },
            function (ws_server_js_1_1) {
                ws_server_js_1 = ws_server_js_1_1;
            },
            function (args_js_3_1) {
                args_js_3 = args_js_3_1;
            }
        ],
        execute: function () {
            BEGIN_AGAIN = 500;
            COMMAND_MAX_WAIT = 11111;
            MAX_FRAME = 2; /* 2, 4 */
            EXPEDITE = new Set([
                "Page.navigate",
                "Runtime.evaluate"
            ]);
            demoBlock = args_js_3.token == 'demotoken';
            ws_started = false;
            zombie_started = false;
            if (common_js_6.GO_SECURE && args_js_3.start_mode == "signup") {
                const redirector = express_2.default();
                redirector.get('*', (req, res) => {
                    res.redirect('https://' + req.headers.host + req.url);
                });
                redirector.listen(80, () => common_js_6.DEBUG.val && console.log('listening on 80 for https redirect'));
            }
            process.on('uncaughtException', err => {
                console.log('ue', err, err.stack);
                //zl.life.kill(chrome_port);
                //begin();
            });
            process.on('unhandledRejection', err => {
                console.log('ur', err, err.stack);
                //zl.life.kill(chrome_port);
                //begin();
            });
            process.on('error', err => {
                console.log('e', err, err.stack);
                //zl.life.kill(chrome_port);
                //begin();
            });
            begin();
        }
    };
});
/* eslint-disable no-global-assign */
require = require('esm')(module /*, options*/);
module.exports = require('./server.js');
/* eslint-enable no-global-assign */
System.register("rollup.config", ["rollup-plugin-babel", "rollup-plugin-commonjs", "rollup-plugin-node-resolve"], function (exports_19, context_19) {
    "use strict";
    var rollup_plugin_babel_1, rollup_plugin_commonjs_1, rollup_plugin_node_resolve_1;
    var __moduleName = context_19 && context_19.id;
    return {
        setters: [
            function (rollup_plugin_babel_1_1) {
                rollup_plugin_babel_1 = rollup_plugin_babel_1_1;
            },
            function (rollup_plugin_commonjs_1_1) {
                rollup_plugin_commonjs_1 = rollup_plugin_commonjs_1_1;
            },
            function (rollup_plugin_node_resolve_1_1) {
                rollup_plugin_node_resolve_1 = rollup_plugin_node_resolve_1_1;
            }
        ],
        execute: function () {
            exports_19("default", {
                plugins: [
                    rollup_plugin_commonjs_1.default(),
                    rollup_plugin_node_resolve_1.default(),
                    rollup_plugin_babel_1.default({
                        "babelrc": false,
                        "exclude": ['node_modules/@babel/runtime/**', 'public/voodoo/node_modules/@babel/runtime/**'],
                        "runtimeHelpers": true,
                        "plugins": [
                            "@babel/plugin-transform-runtime"
                        ],
                        "presets": [
                            [
                                "@babel/preset-env",
                                {
                                    targets: {
                                        browsers: ["safari >= 9"]
                                    }
                                }
                            ]
                        ]
                    }),
                ],
                context: {
                    [require.resolve('whatwg-fetch')]: 'fetch'
                }
            });
        }
    };
});
{
    const fs = require('fs');
    const cp = require('child_process');
    const path = require('path');
    const { promisify } = require('util');
    const readdir = promisify(fs.readdir);
    const stat = promisify(fs.stat);
    const access = promisify(fs.access);
    const exec = promisify(cp.exec);
    const delay = ms => new Promise(res => setTimeout(res, ms));
    perform();
    async function perform() {
        const thisDir = path.join(__dirname);
        await exec('npm i; npm rebuild;');
        await exec('npm set progress=false');
        //await exec('npm i -g pnpm');
        await recurser(thisDir);
        await delay(1000);
    }
    async function recurser(dir) {
        console.log("installed in ", dir);
        await delay(500);
        const files = await readdir(dir);
        for (const f of files) {
            try {
                const isDir = (await stat(path.join(dir, f))).isDirectory();
                if (isDir) {
                    const isSubmodule = await stat(path.join(dir, f, 'package.json'));
                    if (isDir && isSubmodule) {
                        await exec(`cd ${path.join(dir, f)}; npm i; npm rebuild;`);
                    }
                    await recurser(path.join(dir, f));
                }
            }
            catch (e) { /*console.warn(e)*/ }
        }
    }
}
System.register("spdy-server", ["express", "spdy", "fs", "zombie-lord/api", "path", "body-parser", "server"], function (exports_20, context_20) {
    "use strict";
    var express_3, spdy_1, fs_6, api_js_3, path_5, body_parser_2, server_js_2, options, version;
    var __moduleName = context_20 && context_20.id;
    async function start_spdy_server(port, zombie_port) {
        console.log(`Starting SPDY server on port ${port}`);
        const app = express_3.default();
        const server_port = port;
        app.use(express_3.default.static('public'));
        app.use(body_parser_2.default.json({ extended: true }));
        const { data: { targetInfos } } = await server_js_2.timedSend({
            name: "Target.getTargets",
            params: {}
        }, zombie_port);
        const browserTargetId = targetInfos[0].targetId;
        function addHandlers() {
            app.post(`/api/${version}/zombie`, async (req, res) => {
                const Data = [], Frames = [], Meta = [];
                const { events } = req.body;
                await server_js_2.eventSendLoop(events, { Data, Frames, Meta });
                res.type('json');
                return res.end(JSON.stringify({ data: Data, frameBuffer: Frames, meta: Meta }));
            });
            app.get(`/api/${version}/tabs`, async (req, res) => {
                res.type('json');
                let { data: { targetInfos: tabs } } = await server_js_2.timedSend({
                    name: "Target.getTargets",
                    params: {}
                }, zombie_port);
                const activeTarget = api_js_3.default.act.getActiveTarget(zombie_port);
                api_js_3.default.act.addTargets(tabs, zombie_port);
                tabs = (tabs || []).filter(({ targetId }) => targetId != browserTargetId);
                res.end(JSON.stringify({ tabs, activeTarget }));
            });
        }
        const server = spdy_1.default.createServer(options, app);
        server.listen(server_port, async (err) => {
            if (err) {
                console.error(err);
                process.exit(1);
            }
            else {
                console.log({ uptime: new Date, message: 'spdy server up', server_port });
                addHandlers();
            }
        });
    }
    exports_20("start_spdy_server", start_spdy_server);
    return {
        setters: [
            function (express_3_1) {
                express_3 = express_3_1;
            },
            function (spdy_1_1) {
                spdy_1 = spdy_1_1;
            },
            function (fs_6_1) {
                fs_6 = fs_6_1;
            },
            function (api_js_3_1) {
                api_js_3 = api_js_3_1;
            },
            function (path_5_1) {
                path_5 = path_5_1;
            },
            function (body_parser_2_1) {
                body_parser_2 = body_parser_2_1;
            },
            function (server_js_2_1) {
                server_js_2 = server_js_2_1;
            }
        ],
        execute: function () {
            options = {
                key: fs_6.default.readFileSync(path_5.default.join(__dirname, "certs", "server.key")),
                cert: fs_6.default.readFileSync(path_5.default.join(__dirname, "certs", "server.crt")),
            };
            version = 'v1';
        }
    };
});
