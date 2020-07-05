#!/usr/bin/env node
System.register("voodoo/src/handlers/selectInput", [], function (exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    function handleSelectMessage({ selectInput: { selectOpen, values }, executionContextId }, state) {
        state.waitingExecutionContext = executionContextId;
        if (state.ignoreSelectInputEvents)
            return;
        toggleSelect({ selectOpen, values });
    }
    exports_1("handleSelectMessage", handleSelectMessage);
    function toggleSelect({ selectOpen, values }) {
        const input = document.querySelector('#selectinput');
        if (selectOpen) {
            input.innerHTML = values;
            input.classList.add('open');
            //input.focus();
        }
        else {
            input.classList.remove('open');
            input.innerHTML = "";
            //input.blur();
        }
    }
    return {
        setters: [],
        execute: function () {
        }
    };
});
/* eslint-disable no-useless-escape */
System.register("kbd", [], function (exports_2, context_2) {
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
System.register("translateVoodooCRDP", ["kbd"], function (exports_3, context_3) {
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
System.register("voodoo/src/common", ["translateVoodooCRDP"], function (exports_4, context_4) {
    "use strict";
    var translateVoodooCRDP_js_1, VERSION, isSafari, BLANK, DEBUG;
    var __moduleName = context_4 && context_4.id;
    async function sleep(ms) {
        return new Promise(res => setTimeout(res, ms));
    }
    exports_4("sleep", sleep);
    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            const later = () => {
                timeout = null;
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    exports_4("debounce", debounce);
    // leading edge throttle
    function throttle(func, wait) {
        let timeout;
        const throttled = (...args) => {
            if (!timeout) {
                timeout = setTimeout(() => timeout = false, wait);
                return func(...args);
            }
        };
        return throttled;
    }
    exports_4("throttle", throttle);
    function isFirefox() {
        return /firefox/i.test(navigator.userAgent);
    }
    exports_4("isFirefox", isFirefox);
    function deviceIsMobile() {
        return (typeof window.orientation !== "undefined") || (navigator.userAgent.indexOf('IEMobile') !== -1);
    }
    exports_4("deviceIsMobile", deviceIsMobile);
    // debug logging
    function logitKeyInputEvent(e) {
        if (!DEBUG.val)
            return;
        const { type, key, code, data, isComposing, inputType, composed, target: { value } } = e;
        const typingData = { key, code, type, data, isComposing, inputType, composed, value };
        const debugBox = document.querySelector('#debugBox');
        if (debugBox) {
            debugBox.insertAdjacentHTML('afterBegin', `<p style="max-width:90vw;"><code><pre>${JSON.stringify(typingData, null, 2)}</code></pre></p>`);
        }
        else {
            throw new Error("No element with ID 'debugBox' found.");
        }
    }
    exports_4("logitKeyInputEvent", logitKeyInputEvent);
    // debug logging
    function logit(info) {
        if (!DEBUG.val)
            return;
        const debugBox = document.querySelector('#debugBox');
        if (debugBox) {
            debugBox.insertAdjacentHTML('afterBegin', `<p style="max-width:90vw;"><code><pre>${JSON.stringify(info, null, 2)}</code></pre></p>`);
        }
        else {
            throw new Error("No element with ID 'debugBox' found.");
        }
    }
    exports_4("logit", logit);
    return {
        setters: [
            function (translateVoodooCRDP_js_1_1) {
                translateVoodooCRDP_js_1 = translateVoodooCRDP_js_1_1;
            }
        ],
        execute: function () {
            exports_4("VERSION", VERSION = '3.1415926535897932384626338');
            exports_4("isSafari", isSafari = () => /^((?!chrome|android).)*safari/i.test(navigator.userAgent));
            exports_4("BLANK", BLANK = "about:blank");
            exports_4("DEBUG", DEBUG = {
                activateNewTab: false,
                frameControl: translateVoodooCRDP_js_1.FRAME_CONTROL,
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
            });
        }
    };
});
//FIXME we could move this into constructor 
// and switch it to WS 
System.register("voodoo/src/handlers/targetInfo", ["voodoo/src/common"], function (exports_5, context_5) {
    "use strict";
    var common_js_1, tabNumbers, TabNumber;
    var __moduleName = context_5 && context_5.id;
    async function fetchTabs({ sessionToken }) {
        try {
            const url = new URL(location);
            url.pathname = '/api/v1/tabs';
            const resp = await fetch(url);
            if (resp.ok) {
                const data = await resp.json();
                if (data.error) {
                    if (data.resetRequired) {
                        const reload = confirm(`Some errors occurred and we can't seem to reach your cloud browser. You can try reloading the page and if the problem persists, try switching your cloud browser off then on again. Want to reload the page now?`);
                        if (reload)
                            location.reload();
                    }
                }
                data.tabs = (data.tabs || []).filter(({ type }) => type == 'page');
                // FIX for #36 ? 
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
            }
            else if (resp.status == 401) {
                console.warn(`Session has been cleared. Let's attempt relogin`, sessionToken);
                if (common_js_1.DEBUG.blockAnotherReset)
                    return;
                common_js_1.DEBUG.blockAnotherReset = true;
                const x = new URL(location);
                x.pathname = 'login';
                x.search = `token=${sessionToken}&ran=${Math.random()}`;
                alert("Your browser cleared your session. We need to reload the page to refresh it.");
                common_js_1.DEBUG.delayUnload = false;
                location.href = x;
                return;
            }
        }
        catch (e) {
            console.warn(e);
            const reload = confirm(`Some errors occurred and we can't seem to reach your cloud browser. You can try reloading the page and if the problem persists, try switching your cloud browser off then on again. Want to reload the page now?`);
            if (reload)
                location.reload();
        }
    }
    exports_5("fetchTabs", fetchTabs);
    return {
        setters: [
            function (common_js_1_1) {
                common_js_1 = common_js_1_1;
            }
        ],
        execute: function () {//FIXME we could move this into constructor 
            // and switch it to WS 
            tabNumbers = new Map();
            TabNumber = 1;
        }
    };
});
System.register("voodoo/src/handlers/demo", ["voodoo/src/common"], function (exports_6, context_6) {
    "use strict";
    var common_js_2, DemoTab, dontFocus, runFuncs, opts, started, tab, tabs, requestId, messageId;
    var __moduleName = context_6 && context_6.id;
    async function fetchDemoTabs() {
        requestId++;
        tab = tab || tabs[0];
        return { tabs, activeTarget: tab && tab.targetId, requestId };
    }
    exports_6("fetchDemoTabs", fetchDemoTabs);
    async function demoZombie({ events }) {
        const meta = [];
        common_js_2.DEBUG.val >= common_js_2.DEBUG.med && console.log(`DEMO Received events: ${JSON.stringify({ events }, null, 2)}`);
        for (const event of events) {
            meta.push(...(await handleEvent(event)));
        }
        messageId++;
        return { data: [], frameBuffer: [], meta, messageId };
    }
    exports_6("demoZombie", demoZombie);
    async function handleEvent(event) {
        const meta = [];
        const { command } = event;
        if (tab && !started.has(tab.targetId)) {
            started.add(tab.targetId);
            meta.push({
                treeUpdate: {
                    open: await fetch(`https://${location.hostname}:8001/demo-landing`).then(resp => resp.text()),
                    targetId: tab && tab.targetId,
                    ...opts
                }
            });
        }
        switch (command.name) {
            case "Target.createTarget": {
                tab = DemoTab();
                tabs.push(tab);
                const meta1 = {
                    created: {
                        targetId: tab.targetId
                    }
                };
                const meta2 = {
                    treeUpdate: {
                        open: await fetch(`https://${location.hostname}:8001/demo-landing`).then(resp => resp.text()),
                        targetId: tab.targetId,
                        ...opts
                    }
                };
                meta.push(meta1, meta2);
                break;
            }
            case "Target.activateTarget": {
                tab = tabs.find(({ targetId }) => targetId == command.params.targetId);
                break;
            }
            case "Demo.formSubmission": {
                let jres;
                try {
                    jres = JSON.parse(event.result);
                }
                catch (e) { }
                if (!!jres && !!jres.browserUrl) {
                    const { browserUrl } = jres;
                    const meta1 = {
                        topRedirect: {
                            browserUrl,
                            targetId: tab && tab.targetId
                        }
                    };
                    await common_js_2.sleep(5000);
                    meta.push(meta1);
                }
                else {
                    const meta1 = {
                        treeUpdate: {
                            open: event.result,
                            targetId: tab && tab.targetId,
                            ...opts
                        }
                    };
                    meta.push(meta1);
                }
                break;
            }
        }
        return meta;
    }
    return {
        setters: [
            function (common_js_2_1) {
                common_js_2 = common_js_2_1;
            }
        ],
        execute: function () {
            DemoTab = () => ({
                targetId: 'demo1' + Math.random(),
                browserContextId: 'demobrowser1',
                title: 'Dosy Browser',
                type: 'page',
                url: 'payment://signup-to-dosy-browser.html'
            });
            dontFocus = true;
            runFuncs = [
                'installFormSubmitButtonHandler',
                'installStripeButton'
            ];
            opts = { dontFocus, runFuncs };
            started = new Set();
            tab = DemoTab();
            tabs = [tab];
            requestId = 1;
            messageId = 1;
        }
    };
});
System.register("voodoo/src/handlers/keysCanInput", [], function (exports_7, context_7) {
    "use strict";
    var __moduleName = context_7 && context_7.id;
    function handleKeysCanInputMessage({ keyInput: { keysCanInput, isTextareaOrContenteditable, type, inputmode, value: value = '' }, executionContextId }, state) {
        if (state.ignoreKeysCanInputMessage)
            return;
        if (keysCanInput) {
            state.contextIdOfFocusedInput = executionContextId;
            if (!state.dontFocusControlInputs) {
                if (isTextareaOrContenteditable) {
                    state.viewState.focusTextarea(inputmode, value);
                }
                else {
                    state.viewState.focusKeyinput(type, inputmode, value);
                }
            }
        }
        else {
            state.contextIdOfFocusedInput = null;
            if (!state.dontFocusControlInputs) {
                const active = document.activeElement;
                if (active == state.viewState.textarea) {
                    state.viewState.blurTextarea();
                }
                else if (active == state.viewState.keyinput) {
                    state.viewState.blurKeyinput();
                }
            }
        }
    }
    exports_7("handleKeysCanInputMessage", handleKeysCanInputMessage);
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("voodoo/src/handlers/elementInfo", [], function (exports_8, context_8) {
    "use strict";
    var __moduleName = context_8 && context_8.id;
    function handleElementInfo({ elementInfo: { attributes, innerText, noSuchElement }, }, state) {
        if (!state.elementInfoContinuation) {
            console.warn(`Got element info message, but no continuation to pass it to`);
            console.warn(JSON.stringify({ elementInfo: { attributes, innerText, noSuchElement } }));
            return;
        }
        try {
            state.elementInfoContinuation({ attributes, innerText, noSuchElement });
        }
        catch (e) {
            console.warn(`Element info continueation failed`, state.elementInfoContinuation, e);
            console.warn(JSON.stringify({ elementInfo: { attributes, innerText, noSuchElement } }));
        }
    }
    exports_8("handleElementInfo", handleElementInfo);
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("voodoo/src/handlers/scrollNotify", [], function (exports_9, context_9) {
    "use strict";
    var __moduleName = context_9 && context_9.id;
    function handleScrollNotification({ /*scroll:{didScroll},*/ executionContextId }, state) {
        state.viewState.latestScrollContext = executionContextId;
    }
    exports_9("handleScrollNotification", handleScrollNotification);
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("voodoo/node_modules/dumbass/common", [], function (exports_10, context_10) {
    "use strict";
    var CODE;
    var __moduleName = context_10 && context_10.id;
    return {
        setters: [],
        execute: function () {
            // common for all r submodules
            exports_10("CODE", CODE = '' + Math.random());
        }
    };
});
System.register("voodoo/node_modules/dumbass/t", [], function (exports_11, context_11) {
    "use strict";
    var BuiltIns, DEBUG, SEALED_DEFAULT, isNone, typeCache;
    var __moduleName = context_11 && context_11.id;
    function T(parts, ...vals) {
        const cooked = vals.reduce((prev, cur, i) => prev + cur + parts[i + 1], parts[0]);
        const typeName = cooked;
        if (!typeCache.has(typeName))
            throw new TypeError(`Cannot use type ${typeName} before it is defined.`);
        return typeCache.get(typeName).type;
    }
    exports_11("T", T);
    function partialMatch(type, instance) {
        return validate(type, instance, { partial: true });
    }
    function validate(type, instance, { partial: partial = false } = {}) {
        guardType(type);
        guardExists(type);
        const typeName = type.name;
        const { spec, kind, help, verify, verifiers, sealed } = typeCache.get(typeName);
        const specKeyPaths = spec ? allKeyPaths(spec).sort() : [];
        const specKeyPathSet = new Set(specKeyPaths);
        const bigErrors = [];
        switch (kind) {
            case "def": {
                let allValid = true;
                if (spec) {
                    const keyPaths = partial ? allKeyPaths(instance, specKeyPathSet) : specKeyPaths;
                    allValid = !isNone(instance) && keyPaths.every(kp => {
                        // Allow lookup errors if the type match for the key path can include None
                        const { resolved, errors: lookupErrors } = lookup(instance, kp, () => checkTypeMatch(lookup(spec, kp).resolved, T `None`));
                        bigErrors.push(...lookupErrors);
                        if (lookupErrors.length)
                            return false;
                        const keyType = lookup(spec, kp).resolved;
                        if (!keyType || !(keyType instanceof Type)) {
                            bigErrors.push({
                                error: `Key path '${kp}' is not present in the spec for type '${typeName}'`
                            });
                            return false;
                        }
                        const { valid, errors: validationErrors } = validate(keyType, resolved);
                        bigErrors.push(...validationErrors);
                        return valid;
                    });
                }
                let verified = true;
                if (partial && !spec && !!verify) {
                    throw new TypeError(`Type checking with option 'partial' is not a valid option for types that` +
                        ` only use a verify function but have no spec`);
                }
                else if (verify) {
                    try {
                        verified = verify(instance);
                        if (!verified) {
                            if (verifiers) {
                                throw {
                                    error: `Type ${typeName} value '${JSON.stringify(instance)}' violated at least 1 verify function in:\n${verifiers.map(f => '\t' + (f.help || '') + ' (' + f.verify.toString() + ')').join('\n')}`
                                };
                            }
                            else if (type.isSumType) {
                                throw {
                                    error: `Value '${JSON.stringify(instance)}' did not match any of: ${[...type.types.keys()].map(t => t.name)}`,
                                    verify, verifiers
                                };
                            }
                            else {
                                let helpMsg = '';
                                if (help) {
                                    helpMsg = `Help: ${help}. `;
                                }
                                throw { error: `${helpMsg}Type ${typeName} Value '${JSON.stringify(instance)}' violated verify function in: ${verify.toString()}` };
                            }
                        }
                    }
                    catch (e) {
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
                        }
                        else {
                            const errorKeys = [];
                            const tkp = new Set(type_key_paths);
                            for (const k of all_key_paths) {
                                if (!tkp.has(k)) {
                                    errorKeys.push({
                                        error: `Key path '${k}' is not in the spec for type ${typeName}`
                                    });
                                }
                            }
                            if (errorKeys.length) {
                                bigErrors.push(...errorKeys);
                            }
                        }
                    }
                }
                return { valid: allValid && verified && sealValid, errors: bigErrors, partial };
            }
            case "defCollection": {
                const { valid: containerValid, errors: containerErrors } = validate(spec.container, instance);
                let membersValid = true;
                let verified = true;
                bigErrors.push(...containerErrors);
                if (partial) {
                    throw new TypeError(`Type checking with option 'partial' is not a valid option for Collection types`);
                }
                else {
                    if (containerValid) {
                        membersValid = [...instance].every(member => {
                            const { valid, errors } = validate(spec.member, member);
                            bigErrors.push(...errors);
                            return valid;
                        });
                    }
                    if (verify) {
                        try {
                            verified = verify(instance);
                        }
                        catch (e) {
                            bigErrors.push(e);
                            verified = false;
                        }
                    }
                }
                return { valid: containerValid && membersValid && verified, errors: bigErrors };
            }
            default: {
                throw new TypeError(`Checking for type kind ${kind} is not yet implemented.`);
            }
        }
    }
    function check(...args) {
        return validate(...args).valid;
    }
    function lookup(obj, keyPath, canBeNone) {
        if (isNone(obj))
            throw new TypeError(`Lookup requires a non-unset object.`);
        if (!keyPath)
            throw new TypeError(`keyPath must not be empty`);
        const keys = keyPath.split(/\./g);
        const pathComplete = [];
        const errors = [];
        let resolved = obj;
        while (keys.length) {
            const nextKey = keys.shift();
            resolved = resolved[nextKey];
            pathComplete.push(nextKey);
            if ((resolved === null || resolved === undefined)) {
                if (keys.length) {
                    errors.push({
                        error: `Lookup on key path '${keyPath}' failed at '` +
                            pathComplete.join('.') +
                            `' when ${resolved} was found at '${nextKey}'.`
                    });
                }
                else if (!!canBeNone && canBeNone()) {
                    resolved = undefined;
                }
                else {
                    errors.push({
                        error: `Resolution on key path '${keyPath}' failed` +
                            `when ${resolved} was found at '${nextKey}' and the Type of this` +
                            `key's value cannot be None.`
                    });
                }
                break;
            }
        }
        return { resolved, errors };
    }
    function checkTypeMatch(typeA, typeB) {
        guardType(typeA);
        guardExists(typeA);
        guardType(typeB);
        guardExists(typeB);
        if (typeA === typeB) {
            return true;
        }
        else if (typeA.isSumType && typeA.types.has(typeB)) {
            return true;
        }
        else if (typeB.isSumType && typeB.types.has(typeA)) {
            return true;
        }
        else if (typeA.name.startsWith('?') && typeB == T `None`) {
            return true;
        }
        else if (typeB.name.startsWith('?') && typeA == T `None`) {
            return true;
        }
        if (typeA.name.startsWith('>') || typeB.name.startsWith('>')) {
            console.error(new Error(`Check type match has not been implemented for derived//sub types yet.`));
        }
        return false;
    }
    function option(type) {
        return T `?${type.name}`;
    }
    function sub(type) {
        return T `>${type.name}`;
    }
    function defSub(type, spec, { verify: verify = undefined, help: help = '' } = {}, name = '') {
        guardType(type);
        guardExists(type);
        let verifiers;
        if (!verify) {
            verify = () => true;
        }
        if (type.native) {
            verifiers = [{ help, verify }];
            verify = i => i instanceof type.native;
            const helpMsg = `Needs to be of type ${type.native.name}. ${help || ''}`;
            verifiers.push({ help: helpMsg, verify });
        }
        const newType = def(`${name}>${type.name}`, spec, { verify, help, verifiers });
        return newType;
    }
    function defEnum(name, ...values) {
        if (!name)
            throw new TypeError(`Type must be named.`);
        guardRedefinition(name);
        const valueSet = new Set(values);
        const verify = i => valueSet.has(i);
        const help = `Value of Enum type ${name} must be one of ${values.join(',')}`;
        return def(name, null, { verify, help });
    }
    function exists(name) {
        return typeCache.has(name);
    }
    function guardRedefinition(name) {
        if (exists(name))
            throw new TypeError(`Type ${name} cannot be redefined.`);
    }
    function allKeyPaths(o, specKeyPaths) {
        const isTypeSpec = !specKeyPaths;
        const keyPaths = new Set();
        return recurseObject(o, keyPaths, '');
        function recurseObject(o, keyPathSet, lastLevel = '') {
            const levelKeys = Object.getOwnPropertyNames(o);
            const keyPaths = levelKeys
                .map(k => lastLevel + (lastLevel.length ? '.' : '') + k);
            levelKeys.forEach((k, i) => {
                const v = o[k];
                if (isTypeSpec) {
                    if (v instanceof Type) {
                        keyPathSet.add(keyPaths[i]);
                    }
                    else if (typeof v == "object") {
                        if (!Array.isArray(v)) {
                            recurseObject(v, keyPathSet, keyPaths[i]);
                        }
                        else {
                            DEBUG && console.warn({ o, v, keyPathSet, lastLevel });
                            throw new TypeError(`We don't support Types that use Arrays as structure, just yet.`);
                        }
                    }
                    else {
                        throw new TypeError(`Spec cannot contain leaf values that are not valid Types`);
                    }
                }
                else {
                    if (specKeyPaths.has(keyPaths[i])) {
                        keyPathSet.add(keyPaths[i]);
                    }
                    else if (typeof v == "object") {
                        if (!Array.isArray(v)) {
                            recurseObject(v, keyPathSet, keyPaths[i]);
                        }
                        else {
                            v.forEach((item, index) => recurseObject(item, keyPathSet, keyPaths[i] + '.' + index));
                            //throw new TypeError(`We don't support Instances that use Arrays as structure, just yet.`); 
                        }
                    }
                    else {
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
        return T.def(`?${typeName}`, null, { verify: i => isUnset(i) || T.check(type, i) });
    }
    function maybe(type) {
        try {
            return defOption(type);
        }
        catch (e) {
            // console.log(`Option Type ${type.name} already declared.`, e);
        }
        return T `?${type.name}`;
    }
    function verify(...args) { return check(...args); }
    function defCollection(name, { container, member }, { sealed: sealed = SEALED_DEFAULT, verify: verify = undefined } = {}) {
        if (!name)
            throw new TypeError(`Type must be named.`);
        if (!container || !member)
            throw new TypeError(`Type must be specified.`);
        guardRedefinition(name);
        const kind = 'defCollection';
        const t = new Type(name);
        const spec = { kind, spec: { container, member }, verify, sealed, type: t };
        typeCache.set(name, spec);
        return t;
    }
    function defTuple(name, { pattern }) {
        if (!name)
            throw new TypeError(`Type must be named.`);
        if (!pattern)
            throw new TypeError(`Type must be specified.`);
        const kind = 'def';
        const specObj = {};
        pattern.forEach((type, key) => specObj[key] = type);
        const t = new Type(name);
        const spec = { kind, spec: specObj, type: t };
        typeCache.set(name, spec);
        return t;
    }
    function Type(name, mods = {}) {
        if (!new.target)
            throw new TypeError(`Type with new only.`);
        Object.defineProperty(this, 'name', { get: () => name });
        this.typeName = name;
        if (mods.types) {
            const { types } = mods;
            const typeSet = new Set(types);
            Object.defineProperty(this, 'isSumType', { get: () => true });
            Object.defineProperty(this, 'types', { get: () => typeSet });
        }
        if (mods.native) {
            const { native } = mods;
            Object.defineProperty(this, 'native', { get: () => native });
        }
    }
    function def(name, spec, { help: help = '', verify: verify = undefined, sealed: sealed = undefined, types: types = undefined, verifiers: verifiers = undefined, native: native = undefined } = {}) {
        if (!name)
            throw new TypeError(`Type must be named.`);
        guardRedefinition(name);
        if (name.startsWith('?')) {
            if (spec) {
                throw new TypeError(`Option type can not have a spec.`);
            }
            if (!verify(null)) {
                throw new TypeError(`Option type must be OK to be unset.`);
            }
        }
        const kind = 'def';
        if (sealed === undefined) {
            sealed = true;
        }
        const t = new Type(name, { types, native });
        const cache = { spec, kind, help, verify, verifiers, sealed, types, native, type: t };
        typeCache.set(name, cache);
        return t;
    }
    function defOr(name, ...types) {
        return T.def(name, null, { types, verify: i => types.some(t => check(t, i)) });
    }
    function guard(type, instance) {
        guardType(type);
        guardExists(type);
        const { valid, errors } = validate(type, instance);
        if (!valid)
            throw new TypeError(`Type ${type} requested, but item is not of that type: ${errors.join(', ')}`);
    }
    function guardType(t) {
        //console.log(t);
        if (!(t instanceof Type))
            throw new TypeError(`Type must be a valid Type object.`);
    }
    function guardExists(t) {
        const name = originalName(t);
        if (!exists(name))
            throw new TypeError(`Type must exist. Type ${name} has not been defined.`);
    }
    function errors(...args) {
        return validate(...args).errors;
    }
    function mapBuiltins() {
        BuiltIns.forEach(t => def(originalName(t), null, { native: t, verify: i => originalName(i.constructor) === originalName(t) }));
        BuiltIns.forEach(t => defSub(T `${originalName(t)}`));
    }
    function defineSpecials() {
        T.def(`Any`, null, { verify: () => true });
        T.def(`Some`, null, { verify: i => !isUnset(i) });
        T.def(`None`, null, { verify: i => isUnset(i) });
        T.def(`Function`, null, { verify: i => i instanceof Function });
        T.def(`Integer`, null, { verify: i => Number.isInteger(i) });
        T.def(`Array`, null, { verify: i => Array.isArray(i) });
        T.def(`Iterable`, null, { verify: i => i[Symbol.iterator] instanceof Function });
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
    return {
        setters: [],
        execute: function () {
            BuiltIns = [
                Symbol, Boolean, Number, String, Object, Set, Map, WeakMap, WeakSet,
                Uint8Array, Uint16Array, Uint32Array, Float32Array, Float64Array,
                Int8Array, Int16Array, Int32Array,
                Uint8ClampedArray,
                Node, NodeList, Element, HTMLElement, Blob, ArrayBuffer,
                FileList, Text, HTMLDocument, Document, DocumentFragment,
                Error, File, Event, EventTarget, URL
            ];
            DEBUG = false;
            SEALED_DEFAULT = true;
            isNone = instance => instance == null || instance == undefined;
            typeCache = new Map();
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
            T.errors = errors;
            // debug
            if (DEBUG) {
                self.T = T;
                self.typeCache = typeCache;
            }
            T[Symbol.for('jtype-system.typeCache')] = typeCache;
            defineSpecials();
            mapBuiltins();
            Type.prototype.toString = function () {
                return `${this.typeName} Type`;
            };
        }
    };
});
System.register("voodoo/node_modules/dumbass/types", ["voodoo/node_modules/dumbass/t", "voodoo/node_modules/dumbass/common"], function (exports_12, context_12) {
    "use strict";
    var t_js_1, common_js_3, TKey, THandlers, TFuncArray, TEmptyArray, TMarkupObject, TMarkupAttrObject, TBrutalLikeObject, TBrutalObject, TBrutalArray, TSBrutalObject, TSBrutalArray, BS, SSR, Types;
    var __moduleName = context_12 && context_12.id;
    // verify function 
    function verify(v) {
        return common_js_3.CODE === v.code;
    }
    return {
        setters: [
            function (t_js_1_1) {
                t_js_1 = t_js_1_1;
            },
            function (common_js_3_1) {
                common_js_3 = common_js_3_1;
            }
        ],
        execute: function () {
            exports_12("default", t_js_1.T);
            // Both SSR and Browser
            exports_12("TKey", TKey = t_js_1.T.def('Key', {
                key: t_js_1.T.defOr('ValidKey', t_js_1.T `String`, t_js_1.T `Number`)
            }));
            exports_12("THandlers", THandlers = t_js_1.T.def('Handlers', null, { verify: i => {
                    const validObject = t_js_1.T.check(t_js_1.T `Object`, i);
                    if (!validObject)
                        return false;
                    const eventNames = Object.keys(i);
                    const handlerFuncs = Object.values(i);
                    const validNames = eventNames.every(name => t_js_1.T.check(t_js_1.T `String`, name));
                    const validFuncs = handlerFuncs.every(func => t_js_1.T.check(t_js_1.T `Function`, func));
                    const valid = validNames && validFuncs;
                    return valid;
                } }));
            exports_12("TFuncArray", TFuncArray = t_js_1.T.defCollection('FuncArray', {
                container: t_js_1.T `Array`,
                member: t_js_1.T `Function`
            }));
            exports_12("TEmptyArray", TEmptyArray = t_js_1.T.def('EmptyArray', null, { verify: i => Array.isArray(i) && i.length == 0 }));
            exports_12("TMarkupObject", TMarkupObject = t_js_1.T.def('MarkupObject', {
                type: t_js_1.T `String`,
                code: t_js_1.T `String`,
                nodes: t_js_1.T `Array`,
                externals: t_js_1.T `Array`,
            }, { verify: v => v.type == 'MarkupObject' && v.code == common_js_3.CODE }));
            exports_12("TMarkupAttrObject", TMarkupAttrObject = t_js_1.T.def('MarkupAttrObject', {
                type: t_js_1.T `String`,
                code: t_js_1.T `String`,
                str: t_js_1.T `String`
            }, { verify: v => v.type == 'MarkupAttrObject' && v.code == common_js_3.CODE }));
            // Browser side
            exports_12("TBrutalLikeObject", TBrutalLikeObject = t_js_1.T.def('BrutalLikeObject', {
                code: t_js_1.T `String`,
                externals: t_js_1.T `Array`,
                nodes: t_js_1.T `Array`,
                to: t_js_1.T `Function`,
                update: t_js_1.T `Function`,
                v: t_js_1.T `Array`
            }));
            exports_12("TBrutalObject", TBrutalObject = t_js_1.T.def('BrutalObject', {
                code: t_js_1.T `String`,
                externals: t_js_1.T `Array`,
                nodes: t_js_1.T `Array`,
                to: t_js_1.T `Function`,
                update: t_js_1.T `Function`,
                v: t_js_1.T `Array`
            }, { verify: v => verify(v) }));
            exports_12("TBrutalArray", TBrutalArray = t_js_1.T.defCollection('BrutalArray', {
                container: t_js_1.T `Array`,
                member: t_js_1.T `BrutalObject`
            }));
            // SSR
            exports_12("TSBrutalObject", TSBrutalObject = t_js_1.T.def('SBrutalObject', {
                str: t_js_1.T `String`,
                handlers: THandlers
            }));
            exports_12("TSBrutalArray", TSBrutalArray = t_js_1.T.defCollection('SBrutalArray', {
                container: t_js_1.T `Array`,
                member: t_js_1.T `SBrutalObject`
            }));
            // export
            exports_12("BS", BS = { TKey, THandlers, TFuncArray, TBrutalObject, TBrutalLikeObject, TBrutalArray });
            exports_12("SSR", SSR = { TKey, THandlers, TFuncArray, TSBrutalObject, TSBrutalArray });
            exports_12("Types", Types = { BS, SSR });
        }
    };
});
System.register("voodoo/node_modules/dumbass/r", ["voodoo/node_modules/dumbass/common", "voodoo/node_modules/dumbass/types"], function (exports_13, context_13) {
    "use strict";
    var common_js_4, types_js_1, skip, attrskip, DEBUG, NULLFUNC, KEYMATCH, ATTRMATCH, KEYLEN, XSS, OBJ, UNSET, INSERT, NOTFOUND, MOVE, isKey, isHandlers, cache, d, u;
    var __moduleName = context_13 && context_13.id;
    function R(p, ...v) {
        return dumbass(p, v);
    }
    exports_13("R", R);
    function X(p, ...v) {
        return dumbass(p, v, { useCache: false });
    }
    exports_13("X", X);
    // main function (TODO: should we refactor?)
    function dumbass(p, v, { useCache: useCache = true } = {}) {
        let instanceKey, cacheKey;
        v = v.map(guardAndTransformVal);
        if (useCache) {
            ({ key: instanceKey } = (v.find(isKey) || {}));
            cacheKey = p.join('<link rel=join>');
            const { cached, firstCall } = isCached(cacheKey, v, instanceKey);
            if (!firstCall) {
                cached.update(v);
                return cached;
            }
        }
        // compile the template into an updater
        p = [...p];
        const vmap = {};
        const V = v.map(replaceValWithKeyAndOmitInstanceKey(vmap));
        const externals = [];
        let str = '';
        while (p.length > 1)
            str += p.shift() + V.shift();
        str += p.shift();
        const frag = toDOM(str);
        const walker = document.createTreeWalker(frag, NodeFilter.SHOW_ALL);
        do {
            makeUpdaters({ walker, vmap, externals });
        } while (walker.nextNode());
        const retVal = { externals, v: Object.values(vmap), to,
            update, code: common_js_4.CODE, nodes: [...frag.childNodes] };
        if (useCache) {
            if (instanceKey) {
                cache[cacheKey].instances[instanceKey] = retVal;
            }
            else {
                cache[cacheKey] = retVal;
            }
        }
        return retVal;
    }
    // to function
    function to(location, options) {
        const position = (options || 'replace').toLocaleLowerCase();
        const frag = document.createDocumentFragment();
        this.nodes.forEach(n => frag.appendChild(n));
        const isNode = types_js_1.default.check(types_js_1.default `>Node`, location);
        const elem = isNode ? location : document.querySelector(location);
        try {
            MOVE[position](frag, elem);
        }
        catch (e) {
            DEBUG && console.log({ location, options, e, elem, isNode });
            DEBUG && console.warn(e);
            switch (e.constructor && e.constructor.name) {
                case "DOMException":
                    die({ error: INSERT() }, e);
                    break;
                case "TypeError":
                    die({ error: NOTFOUND(location) }, e);
                    break;
                default: throw e;
            }
        }
        while (this.externals.length) {
            this.externals.shift()();
        }
    }
    // update functions
    function makeUpdaters({ walker, vmap, externals }) {
        const node = walker.currentNode;
        switch (node.nodeType) {
            case Node.ELEMENT_NODE:
                handleElement({ node, vmap, externals });
                break;
            case Node.COMMENT_NODE:
            case Node.TEXT_NODE:
                handleNode({ node, vmap, externals });
                break;
        }
    }
    function handleNode({ node, vmap, externals }) {
        const lengths = [];
        const text = node.nodeValue;
        let result = KEYMATCH.exec(text);
        while (result) {
            const { index } = result;
            const key = result[1];
            const val = vmap[key];
            const replacer = makeNodeUpdater({ node, index, lengths, val });
            externals.push(() => replacer(val.val));
            val.replacers.push(replacer);
            result = KEYMATCH.exec(text);
        }
    }
    // node functions
    function makeNodeUpdater(nodeState) {
        const { node } = nodeState;
        const scope = Object.assign({}, nodeState, {
            oldVal: { length: KEYLEN },
            oldNodes: [node],
            lastAnchor: node,
        });
        return (newVal) => {
            if (scope.oldVal == newVal)
                return;
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
        let { oldNodes, lastAnchor } = state;
        if (newVal.nodes.length) {
            Array.from(newVal.nodes).reverse().forEach(n => {
                lastAnchor.parentNode.insertBefore(n, lastAnchor.nextSibling);
                state.lastAnchor = lastAnchor.nextSibling;
            });
            state.lastAnchor = newVal.nodes[0];
        }
        else {
            const placeholderNode = summonPlaceholder(lastAnchor);
            lastAnchor.parentNode.insertBefore(placeholderNode, lastAnchor.nextSibling);
            state.lastAnchor = placeholderNode;
        }
        // MARK: Unbond event might be relevant here.
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
    function handleTextInNode(newVal, state) {
        let { oldVal, index, val, lengths, node } = state;
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
    }
    // element attribute functions
    function handleElement({ node, vmap, externals }) {
        getAttributes(node).forEach(({ name, value } = {}) => {
            const attrState = { node, vmap, externals, name, lengths: [] };
            KEYMATCH.lastIndex = 0;
            let result = KEYMATCH.exec(name);
            while (result) {
                prepareAttributeUpdater(result, attrState, { updateName: true });
                result = KEYMATCH.exec(name);
            }
            KEYMATCH.lastIndex = 0;
            result = KEYMATCH.exec(value);
            while (result) {
                prepareAttributeUpdater(result, attrState, { updateName: false });
                result = KEYMATCH.exec(value);
            }
        });
    }
    function prepareAttributeUpdater(result, attrState, { updateName }) {
        const { index, input } = result;
        const scope = Object.assign({}, attrState, {
            index, input, updateName,
            val: attrState.vmap[result[1]],
            oldVal: { length: KEYLEN },
            oldName: attrState.name,
        });
        let replacer;
        if (updateName) {
            replacer = makeAttributeNameUpdater(scope);
        }
        else {
            replacer = makeAttributeValueUpdater(scope);
        }
        scope.externals.push(() => replacer(scope.val.val));
        scope.val.replacers.push(replacer);
    }
    // FIXME: needs to support multiple replacements just like value
    // QUESTION: why is the variable oldName so required here, why can't we call it oldVal?
    // if we do it breaks, WHY?
    function makeAttributeNameUpdater(scope) {
        let { oldName, node, val } = scope;
        return (newVal) => {
            if (oldName == newVal)
                return;
            val.val = newVal;
            const attr = node.hasAttribute(oldName) ? oldName : '';
            if (attr !== newVal) {
                if (attr) {
                    node.removeAttribute(oldName);
                    node[oldName] = undefined;
                }
                if (newVal) {
                    newVal = newVal.trim();
                    let name = newVal, value = undefined;
                    if (ATTRMATCH.test(newVal)) {
                        const assignmentIndex = newVal.indexOf('=');
                        ([name, value] = [newVal.slice(0, assignmentIndex), newVal.slice(assignmentIndex + 1)]);
                    }
                    reliablySetAttribute(node, name, value);
                }
                oldName = newVal;
            }
        };
    }
    function makeAttributeValueUpdater(scope) {
        return (newVal) => {
            if (scope.oldVal == newVal)
                return;
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
                case "markupattrobject": // deliberate fall through
                    newVal = newVal.str;
                default:
                    updateAttrWithTextValue(newVal, scope);
                    break;
                /* eslint-enable no-fallthrough */
            }
        };
    }
    // helpers
    function getAttributes(node) {
        if (!node.hasAttribute)
            return [];
        // for parity with classList.add (which trims whitespace)
        // otherwise once the classList manipulation happens
        // our indexes for replacement will be off
        if (node.hasAttribute('class')) {
            node.setAttribute('class', formatClassListValue(node.getAttribute('class')));
        }
        if (!!node.attributes && Number.isInteger(node.attributes.length))
            return Array.from(node.attributes);
        const attrs = [];
        for (const name of node) {
            if (node.hasAttribute(name)) {
                attrs.push({ name, value: node.getAttribute(name) });
            }
        }
        return attrs;
    }
    function updateAttrWithFunctionValue(newVal, scope) {
        let { oldVal, node, name, externals } = scope;
        if (name !== 'bond') {
            let flags = {};
            if (name.includes(':')) {
                ([name, ...flags] = name.split(':'));
                flags = flags.reduce((O, f) => {
                    O[f] = true;
                    return O;
                }, {});
            }
            if (oldVal) {
                node.removeEventListener(name, oldVal, flags);
            }
            node.addEventListener(name, newVal, flags);
        }
        else {
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
        let { oldVal, node, name, externals } = scope;
        if (oldVal && !Array.isArray(oldVal)) {
            oldVal = [oldVal];
        }
        if (name !== 'bond') {
            let flags = {};
            if (name.includes(':')) {
                ([name, ...flags] = name.split(':'));
                flags = flags.reduce((O, f) => {
                    O[f] = true;
                    return O;
                }, {});
            }
            if (oldVal) {
                oldVal.forEach(of => node.removeEventListener(name, of, flags));
            }
            newVal.forEach(f => node.addEventListener(name, f, flags));
        }
        else {
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
        let { oldVal, node, externals, } = scope;
        if (!!oldVal && types_js_1.default.check(types_js_1.default `Handlers`, oldVal)) {
            Object.entries(oldVal).forEach(([eventName, funcVal]) => {
                if (eventName !== 'bond') {
                    let flags = {};
                    if (eventName.includes(':')) {
                        ([eventName, ...flags] = eventName.split(':'));
                        flags = flags.reduce((O, f) => {
                            O[f] = true;
                            return O;
                        }, {});
                    }
                    console.log(eventName, funcVal, flags);
                    node.removeEventListener(eventName, funcVal, flags);
                }
                else {
                    const index = externals.indexOf(funcVal);
                    if (index >= 0) {
                        externals.splice(index, 1);
                    }
                }
            });
        }
        Object.entries(newVal).forEach(([eventName, funcVal]) => {
            if (eventName !== 'bond') {
                let flags = {};
                if (eventName.includes(':')) {
                    ([eventName, ...flags] = eventName.split(':'));
                    flags = flags.reduce((O, f) => {
                        O[f] = true;
                        return O;
                    }, {});
                }
                node.addEventListener(eventName, funcVal, flags);
            }
            else {
                externals.push(() => funcVal(node));
            }
        });
        scope.oldVal = newVal;
    }
    function updateAttrWithTextValue(newVal, scope) {
        let { oldVal, node, index, name, val, lengths } = scope;
        let zeroWidthCorrection = 0;
        const valIndex = val.vi;
        const originalLengthBefore = Object.keys(lengths.slice(0, valIndex)).length * KEYLEN;
        // we need to trim newVal to have parity with classlist add
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
        }
        else {
            newAttrValue = before + newVal + after;
        }
        DEBUG && console.log(JSON.stringify({
            newVal,
            valIndex,
            lengths,
            attr,
            lengthBefore,
            originalLengthBefore,
            correction,
            before,
            after,
            newAttrValue
        }, null, 2));
        reliablySetAttribute(node, name, newAttrValue);
        scope.oldVal = newVal;
    }
    function reliablySetAttribute(node, name, value) {
        if (name == "class") {
            value = formatClassListValue(value);
        }
        try {
            node.setAttribute(name, value);
        }
        catch (e) {
            DEBUG && console.warn(e);
        }
        try {
            node[name] = value == undefined ? true : value;
        }
        catch (e) {
            DEBUG && console.warn(e);
        }
    }
    function getType(val) {
        const type = types_js_1.default.check(types_js_1.default `Function`, val) ? 'function' :
            types_js_1.default.check(types_js_1.default `Handlers`, val) ? 'handlers' :
                types_js_1.default.check(types_js_1.default `BrutalObject`, val) ? 'brutalobject' :
                    types_js_1.default.check(types_js_1.default `MarkupObject`, val) ? 'markupobject' :
                        types_js_1.default.check(types_js_1.default `MarkupAttrObject`, val) ? 'markupattrobject' :
                            types_js_1.default.check(types_js_1.default `FuncArray`, val) ? 'funcarray' : 'default';
        return type;
    }
    function summonPlaceholder(sibling) {
        let ph = [...sibling.parentNode.childNodes].find(node => node.nodeType == Node.COMMENT_NODE && node.nodeValue == 'brutal-placeholder');
        if (!ph) {
            ph = toDOM(`<!--brutal-placeholder-->`).firstChild;
        }
        return ph;
    }
    // cache helpers
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
        }
        else {
            if (instanceKey) {
                if (!cached.instances) {
                    cached.instances = {};
                    firstCall = true;
                }
                else {
                    cached = cached.instances[instanceKey];
                    if (!cached) {
                        firstCall = true;
                    }
                    else {
                        firstCall = false;
                    }
                }
            }
            else {
                firstCall = false;
            }
        }
        return { cached, firstCall };
    }
    // Markup helpers
    // Returns an object that Brutal treats as markup,
    // even tho it is NOT a Brutal Object (defined with R/X/$)
    // And even tho it is in the location of a template value replacement
    // Which would normally be the treated as String
    function markup(str) {
        str = types_js_1.default.check(types_js_1.default `None`, str) ? '' : str;
        const frag = toDOM(str);
        const retVal = {
            type: 'MarkupObject',
            code: common_js_4.CODE,
            nodes: [...frag.childNodes],
            externals: []
        };
        return retVal;
    }
    // Returns an object that Brutal treats, again, as markup
    // But this time markup that is OKAY to have within a quoted attribute
    function attrmarkup(str) {
        str = types_js_1.default.check(types_js_1.default `None`, str) ? '' : str;
        str = str.replace(/"/g, '&quot;');
        const retVal = {
            type: 'MarkupAttrObject',
            code: common_js_4.CODE,
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
        }
        else {
            if (types_js_1.default.check(types_js_1.default `None`, val)) {
                return NULLFUNC;
            }
        }
    }
    // other helpers
    function formatClassListValue(value) {
        value = value.trim();
        value = value.replace(/\s+/g, ' ');
        return value;
    }
    function replaceValWithKeyAndOmitInstanceKey(vmap) {
        return (val, vi) => {
            // omit instance key
            if (types_js_1.default.check(types_js_1.default `Key`, val)) {
                return '';
            }
            const key = ('key' + Math.random()).replace('.', '').padEnd(KEYLEN, '0').slice(0, KEYLEN);
            let k = key;
            if (types_js_1.default.check(types_js_1.default `BrutalObject`, val) || types_js_1.default.check(types_js_1.default `MarkupObject`, val)) {
                k = `<!--${k}-->`;
            }
            vmap[key.trim()] = { vi, val, replacers: [] };
            return k;
        };
    }
    function toDOM(str) {
        const templateEl = (new DOMParser).parseFromString(`<template>${str}</template>`, "text/html").head.firstElementChild;
        let f;
        if (templateEl instanceof HTMLTemplateElement) {
            f = templateEl.content;
            f.normalize();
            return f;
        }
        else {
            throw new TypeError(`Could not find template element after parsing string to DOM:\n=START=\n${str}\n=END=`);
        }
    }
    function guardAndTransformVal(v) {
        const isFunc = types_js_1.default.check(types_js_1.default `Function`, v);
        const isUnset = types_js_1.default.check(types_js_1.default `None`, v);
        const isObject = types_js_1.default.check(types_js_1.default `Object`, v);
        const isBrutalArray = types_js_1.default.check(types_js_1.default `BrutalArray`, v);
        const isFuncArray = types_js_1.default.check(types_js_1.default `FuncArray`, v);
        const isMarkupObject = types_js_1.default.check(types_js_1.default `MarkupObject`, v);
        const isMarkupAttrObject = types_js_1.default.check(types_js_1.default `MarkupAttrObject`, v);
        const isBrutal = types_js_1.default.check(types_js_1.default `BrutalObject`, v);
        const isForgery = types_js_1.default.check(types_js_1.default `BrutalLikeObject`, v) && !isBrutal;
        if (isFunc)
            return v;
        if (isBrutal)
            return v;
        if (isKey(v))
            return v;
        if (isHandlers(v))
            return v;
        if (isBrutalArray)
            return join(v);
        if (isFuncArray)
            return v;
        if (isMarkupObject)
            return v;
        if (isMarkupAttrObject)
            return v;
        if (isUnset)
            die({ error: UNSET() });
        if (isForgery)
            die({ error: XSS() });
        if (isObject)
            die({ error: OBJ() });
        return v + '';
    }
    function join(os) {
        const externals = [];
        const bigNodes = [];
        os.forEach(o => (externals.push(...o.externals), bigNodes.push(...o.nodes)));
        //Refers #45. Debug to try to see when node reverse order is introduced.
        //setTimeout( () => console.log(nodesToStr(bigNodes)), 1000 );
        const retVal = { v: [], code: common_js_4.CODE, nodes: bigNodes, to, update, externals };
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
        this.v.forEach(({ vi, replacers }) => replacers.forEach(f => f(newVals[vi])));
    }
    // reporting and error helpers 
    function die(msg, err) {
        if (DEBUG && err)
            console.warn(err);
        msg.stack = ((DEBUG && err) || new Error()).stack.split(/\s*\n\s*/g);
        throw JSON.stringify(msg, null, 2);
    }
    function s(msg) {
        if (DEBUG) {
            console.log(JSON.stringify(msg, showNodes, 2));
            console.info('.');
        }
    }
    function showNodes(k, v) {
        let out = v;
        if (types_js_1.default.check(types_js_1.default `>Node`, v)) {
            out = `<${v.nodeName.toLowerCase()} ${!v.attributes ? '' : [...v.attributes].map(({ name, value }) => `${name}='${value}'`).join(' ')}>${v.nodeValue || (v.children && v.children.length <= 1 ? v.innerText : '')}`;
        }
        else if (typeof v === "function") {
            return `${v.name || 'anon'}() { ... }`;
        }
        return out;
    }
    return {
        setters: [
            function (common_js_4_1) {
                common_js_4 = common_js_4_1;
            },
            function (types_js_1_1) {
                types_js_1 = types_js_1_1;
            }
        ],
        execute: function () {
            // backwards compatible alias
            skip = markup;
            attrskip = attrmarkup;
            // constants
            DEBUG = false;
            NULLFUNC = () => void 0;
            /* eslint-disable no-useless-escape */
            KEYMATCH = /(?:<!\-\-)?(key\d+)(?:\-\->)?/gm;
            /* eslint-enable no-useless-escape */
            ATTRMATCH = /\w+=/;
            KEYLEN = 20;
            XSS = () => `Possible XSS / object forgery attack detected. ` +
                `Object code could not be verified.`;
            OBJ = () => `Object values not allowed here.`;
            UNSET = () => `Unset values not allowed here.`;
            INSERT = () => `Error inserting template into DOM. ` +
                `Position must be one of: ` +
                `replace, beforebegin, afterbegin, beforeend, innerhtml, afterend`;
            NOTFOUND = loc => `Error inserting template into DOM. ` +
                `Location ${loc} was not found in the document.`;
            MOVE = new class {
                beforeend(frag, elem) { elem.appendChild(frag); }
                beforebegin(frag, elem) { elem.parentNode.insertBefore(frag, elem); }
                afterend(frag, elem) { elem.parentNode.insertBefore(frag, elem.nextSibling); }
                replace(frag, elem) { elem.parentNode.replaceChild(frag, elem); }
                afterbegin(frag, elem) { elem.insertBefore(frag, elem.firstChild); }
                innerhtml(frag, elem) { elem.innerHTML = ''; elem.appendChild(frag); }
            };
            // logging
            self.onerror = (...v) => (console.log(v, v[0] + '', v[4] && v[4].message, v[4] && v[4].stack), true);
            // type functions
            isKey = v => types_js_1.default.check(types_js_1.default `Key`, v);
            isHandlers = v => types_js_1.default.check(types_js_1.default `Handlers`, v);
            // cache 
            cache = {};
            exports_13("d", d = R);
            exports_13("u", u = X);
            // main exports 
            Object.assign(R, { s, attrskip, skip, attrmarkup, markup, guardEmptyHandlers, die });
            if (DEBUG) {
                Object.assign(self, { d, u, T: types_js_1.default });
            }
        }
    };
});
System.register("voodoo/src/subviews/loadingIndicator", ["voodoo/node_modules/dumbass/r"], function (exports_14, context_14) {
    "use strict";
    var r_js_1, loadings, SHOW_LOADED_MS, DEFAULT_LOADING, delayHideTimeout;
    var __moduleName = context_14 && context_14.id;
    function LoadingIndicator(state, delayHide = true) {
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
        }
        else {
            loading.isLoading = isLoading;
        }
        return r_js_1.d `
    <aside class="loading-indicator" stylist="styleLoadingIndicator">
      <progress ${loading.isLoading ? '' : 'hidden'} name=loading max=${loading.waiting + loading.complete} value=${loading.complete}>
    </aside>
  `;
    }
    exports_14("LoadingIndicator", LoadingIndicator);
    return {
        setters: [
            function (r_js_1_1) {
                r_js_1 = r_js_1_1;
            }
        ],
        execute: function () {
            exports_14("loadings", loadings = new Map());
            SHOW_LOADED_MS = 300;
            DEFAULT_LOADING = {
                waiting: 0,
                complete: 0
            };
        }
    };
});
System.register("voodoo/src/handlers/loadingIndicator", ["voodoo/src/subviews/loadingIndicator"], function (exports_15, context_15) {
    "use strict";
    var loadingIndicator_js_1;
    var __moduleName = context_15 && context_15.id;
    function resetLoadingIndicator({ navigated }, state) {
        const { targetId } = navigated;
        loadingIndicator_js_1.loadings.delete(targetId);
        if (state.activeTarget == targetId) {
            loadingIndicator_js_1.LoadingIndicator(state);
        }
    }
    exports_15("resetLoadingIndicator", resetLoadingIndicator);
    function showLoadingIndicator({ resource }, state) {
        const { targetId } = resource;
        loadingIndicator_js_1.loadings.set(targetId, resource);
        if (state.activeTarget == targetId) {
            loadingIndicator_js_1.LoadingIndicator(state);
        }
    }
    exports_15("showLoadingIndicator", showLoadingIndicator);
    return {
        setters: [
            function (loadingIndicator_js_1_1) {
                loadingIndicator_js_1 = loadingIndicator_js_1_1;
            }
        ],
        execute: function () {
        }
    };
});
System.register("voodoo/src/subviews/faviconDataURL", [], function (exports_16, context_16) {
    "use strict";
    var DEFAULT_FAVICON;
    var __moduleName = context_16 && context_16.id;
    return {
        setters: [],
        execute: function () {
            DEFAULT_FAVICON = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEsAAABLCAYAAAA4TnrqAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAuIwAALiMBeKU/dgAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAn/SURBVHic7Zx/bFzFEce/s+ezcc5OCC0lDi65OHf7zliyWlx+NUgY9VcKjYTbNKhAmtAKWiTapq1Q1fS/NqJIVCGlVI1IKSQ0qElQA7RFgNRimiAh1BSkJLLfu/MPim1CoKHxXXyu726nf/jZNc7bu927s1NV9/kreTs7sx6/nbezs2ugRo0aNWrUqFGjRo3zDJ1P411dXeEzZ87EhRAOM68hog8DaAIQBpADkAHwLoBBZu5funRp6ujRo7nzNd5Fd5aUMgHgiwC6iWgtMy+x6H6WiF5h5l4AhzzP61+QQWpYFGe1trY2RiKRLcy8BcBVVVT9GjM/ls1m94yMjGSrqDeQBXVWZ2dnZHJy8lsAtgK4ZAFNvUNEO9Lp9MNjY2MTC2VkwZwVi8XWCyEeAhBdKBsBjALY5nne3oVQXnVnRaPRC8Ph8G4i2lBt3RYczOfzdw4ODp6pptKqOiuRSHQppQ4CWG3ZNQdgEMBbAN4nohwzRwAsJ6IoM19WxnAGlFIbU6nU38voG0jVnOU4zjpmfgpAxECcARxh5meFEL0tLS1v9Pb25nXCHR0dF+VyuasB3AhgPYBVhsPKCCE29Pf3v2AoX5SqOEtKeQuAJzC9PirGODPvCoVCv+rv7x8u0xw5jnMDM98DoMdAPgdgk+d5+8u091/DlSrw36hnUdxReQAPTU1N/WR4eHg8Ho9fSUTNBupHdGupRCIRVUoNGQ4zJ4RYX+kbVpGz/Bj1MopMPWY+HgqFbu3v7z8GAFLKXwP4uqEJBrDZ87wnAmzbOAsAMkqp6yuJYaLcjtFo9EI/mBeLUXuz2exVM47yucHCDGE6Tp1DPp8/a6EHAJqEEAfb2tqWWfabpWxnhcPh3Sj+1bvf87wtAStrW5vrpZQ9HR0dF819mEql3gVwHxH9w0JXW11d3W5L+7OUNQ2llDcDOFRE5H7P836o6TuE8haqCsDdnuc9Mr/BcZzbmPm3poqI6GbXdZ+xHYD1m9XZ2RkBsLOIyF7P87YVaW+wtekjAHw5qKGlpWU/gH+bKmLmnStXrrRJ4GcHYIWf6wWuc5j5+MTExDcxHZg/QHd3d53jOLcBaLG1OUd/XdBzf432IIApQ1XR5ubme2ztW03D1tbWxiVLlgwhOCnOCyGumAnmjuPsY+aNAAJ/wHJg5t5kMqn9QHR3d9eNjo5uJKJ9BupOTkxMtNnsVli9WZFIZAv0uwcPzTiqvb29hZlvRRUdZUJvb28+mUw+CeBtA/EVjY2Nm230WzmLme/QNI03NDRsnyNXblyqFkbxi4i22Cg1dpa/w3llUBsz7zp27Nj7Nob/R7g6kUhIU2GbN0uXh7EQYpeFnrIhIlVtncxskl8CsHOWLrAecV3XJu0oG2Z+qdo6lVLGGYVRAO7q6gpnMpm1zOesCOAn0dVmnIi+x8xvzrHzXjKZfKPahojouq6urrBJ1cjIWX65KnARJ4ToDRjAuV61gJl/43neo5WosJCNjI+PxwD0lRI0moZCCEfTlGtpaTnnty2EeBvAOya6NfYqnW5Wb6AQwijIG71ZzBwjCly/DgbtcJ44cWJKStlFROuY+WsAPqlRPQJgB4DZHQQiOuG67ism49KRyWRub2pqWg/gJgCbSskrpeImeo2cRUQXaZ6/GfQcADzPGwXwaHt7+3OFQmFMI3av53m/MxmDDX45bD+AA1LKqwDoZgYAgIiWm+g1/Ro2aZ6nS3Xs6+t7G0Aq0LgQJw3tlwsDOGIgZ7Jra5yONAaOhNkorwqFQjfm8/lbhBA9zHyFoc2qkM/nvx8Oh48z8wpMFzsuDxAz2oEwdZbOKUa/kb6+viSA7Y7j/JyITlqeb6gIv3a4EwCklB0IdpZRFdt0GmY0z43m+gyu66aZ+dTM/5VSK2z6VwoRfUjTVDKcAOZfw9NBX0Miipr0L8IDjuNcUigU/ppKpV6vUFdJmPkjmqbTJv2N3iwiSmqMX5ZIJHS/LRNamXmnEOJv8Xj8YxXoKYlfqAisGRBR4AdoPkbOUkp5ujZmDtyJKMK/gsYhhLjeUo8V9fX110Dz8zKza6LDaBouW7YsmU6nzyKg7MXMNwF43kSPz7cBbMP0Oa3Z9Rsz3xuPx08R0bu6jkRUKBQKx/3KjhWFQmGtZmGdaW5uHjDRYbytLKV8EcBnApre9DxvNezyMcRisYuFEP2Y4zBDxgFc7i96TSEpZR8CFqfM/EIymVxnosRmi0aXr61yHMemcApgtu53wrYfgKVKKau1mpRyLTSreCHEX0z12OyRHwJwX1ADM98jpRwGgEKhkBkYGDgVJBfQr6CZGkUhopVSyjb/35Ou6+rSqRnu0jUIIYrVPz8oayroH9B4TdPcA2AAwEAoFHrHcZztGrmqQES7Zuwx82g8HtcWWGOxWAeAr2iaX/UXzEbYFiweM5T7qqFK48JoMYjoFl2bEOIBaGYQMz9uY8fKWdlsdg/M9qk+Go/Hb+3u7i41zR9B8FLClkA7UsoeAJ/X9DmZy+X22BixctbIyEiWiB40kSWifWNjY2ellD/VySSTyd97nrfcD9j/tBlLKRzHWQ1Au9vKzDuGh4cnbXRal+/T6fQvAAwbitcD+G4pIT/Vec52LHP4wAZka2trIzMfgD53Hcpmsw/bGrF21tjY2AQRbbXoYlRwZeb9MD+rENQXABCNRi+IRCJPA/iETp6ItpZzyaCs81n+cZ0D5fTVkUwm/+Tf3fk0ipffM0T0JIBvKKWuJaJLk8nk7cC0o8Lh8NPM/Nki/fe7rltWRarsswj5fP6uurq6LgBrytUxH9d10wD+LKXcC+AHASJD+Xz+40Hn26WUbUR0sMTmYkoppV1zlaLsk3+Dg4NnlFIbod/rmiUej98Bi9RKCPE85sUhn2VCiPr5Dx3H2QDgaAlHZfxz8eOm45hPxaeVE4nE55RSf0DpY92HlVJ3p1IpoxSnvb19VaFQuBbAzwBcOqfpNIDXmflBIcRbzLwDwKdKqMsppb6QSqVeNLGtY7HPwRcAPENEv3Rd9yUYJN+O43yHmYNOGk769kIlVEwR0SbXdSuOsVW7YeG/YU9BXwmaTx8R/VEp9TIzH9ZNj3g83k5Eb2B6GWJLRin1pUrfqBmqencnFotdIYQ4CKDNsmsB0wXXkwDew/RUuwBAvX/DNQH7j1HKj1FV266u+q2wtra2Zf7x6cDDsovEAaXUnZUE8yD+3+4bjgD40ULdNywVHMvm9OnTXkNDw+6GhoZxAJ0wj2XlcJKZf5zNZjcNDQ0dXSgji3ZHurGxcTMRbQZwTRVVv8rMj+dyuT22SXE5LPrt+0QiIZm5Ryl1AxFdB7P7iTOcBXCYiF4SQhyy2birBuf97zqk0+k1ABKY/oJejOnpWo/ppDoD4BQRDTKz29zcPHA+/65DjRo1atSoUaNGjRrnnf8APcnjzVWJn1oAAAAASUVORK5CYII=`;
            exports_16("default", DEFAULT_FAVICON);
        }
    };
});
System.register("voodoo/src/subviews/tabList", ["voodoo/node_modules/dumbass/r", "voodoo/src/subviews/faviconDataURL"], function (exports_17, context_17) {
    "use strict";
    var r_js_2, faviconDataURL_js_1;
    var __moduleName = context_17 && context_17.id;
    function TabList(state) {
        return r_js_2.d `
    <nav class="controls targets" stylist="styleTabList styleNavControl">
      <ul>
        ${state.tabs.map((tab, index) => TabSelector(tab, index, state))}
        <li class="new" stylist="styleTabSelector">
          <button class=new title="New tab" accesskey="s" 
            click=${click => state.createTab(click)}>+</button>
        </li>
      </ul>
    </nav>
  `;
    }
    exports_17("TabList", TabList);
    function TabSelector(tab, index, state) {
        const title = tab.title == 'about:blank' ? '' : tab.title;
        const active = state.activeTarget == tab.targetId;
        return r_js_2.d `${{ key: tab.targetId }}
    <li class="tab-selector ${active ? 'active' : ''}" stylist="styleTabSelector">
      ${FaviconElement(tab, state)}
      <a title="Bring to front" 
        mousedown=${() => state.viewState.lastActive = document.activeElement}
        click=${click => state.activateTab(click, tab)} href=/tabs/${tab.targetId}>${title}</a>
      <button class=close title="Close tab" ${active ? 'accesskey=d' : ''}
        click=${click => state.closeTab(click, tab, index)}>&Chi;</button>
    </li>
  `;
    }
    exports_17("TabSelector", TabSelector);
    function FaviconElement({ targetId }, state) {
        let faviconURL;
        faviconURL = state.favicons.has(targetId) && state.favicons.get(targetId).dataURI;
        return r_js_2.d `${{ key: targetId }}
    <img class=favicon src="${r_js_2.d.attrmarkup(faviconURL || faviconDataURL_js_1.default)}" 
      data-target-id="${targetId}" bond=${el => bindFavicon(el, { targetId }, state)}>
  `;
    }
    exports_17("FaviconElement", FaviconElement);
    function bindFavicon(el, { targetId }, state) {
        let favicon = state.favicons.get(targetId);
        if (favicon) {
            favicon.el = el;
        }
        else {
            favicon = { el };
            state.favicons.set(targetId, favicon);
        }
        if (favicon.el && favicon.dataURI) {
            el.src = favicon.dataURI;
        }
    }
    return {
        setters: [
            function (r_js_2_1) {
                r_js_2 = r_js_2_1;
            },
            function (faviconDataURL_js_1_1) {
                faviconDataURL_js_1 = faviconDataURL_js_1_1;
            }
        ],
        execute: function () {
        }
    };
});
System.register("voodoo/src/handlers/favicon", ["voodoo/src/subviews/tabList", "voodoo/src/subviews/faviconDataURL"], function (exports_18, context_18) {
    "use strict";
    var tabList_js_1, faviconDataURL_js_2;
    var __moduleName = context_18 && context_18.id;
    function resetFavicon({ targetId }, state) {
        const favicon = state.favicons.get(targetId);
        if (favicon) {
            favicon.dataURI = faviconDataURL_js_2.default;
        }
        tabList_js_1.FaviconElement({ targetId }, state);
    }
    exports_18("resetFavicon", resetFavicon);
    function handleFaviconMessage({ favicon: { faviconDataUrl, targetId } }, state) {
        let favicon = state.favicons.get(targetId);
        if (favicon) {
            favicon.dataURI = faviconDataUrl;
        }
        else {
            favicon = { dataURI: faviconDataUrl };
            state.favicons.set(targetId, favicon);
        }
        tabList_js_1.FaviconElement({ targetId }, state);
    }
    exports_18("handleFaviconMessage", handleFaviconMessage);
    return {
        setters: [
            function (tabList_js_1_1) {
                tabList_js_1 = tabList_js_1_1;
            },
            function (faviconDataURL_js_2_1) {
                faviconDataURL_js_2 = faviconDataURL_js_2_1;
            }
        ],
        execute: function () {
        }
    };
});
System.register("voodoo/src/eventQueue", ["voodoo/src/common"], function (exports_19, context_19) {
    "use strict";
    var common_js_5, $, ALERT_TIMEOUT, BLANK_SPACE, MAX_E, BUFFERED_FRAME_EVENT, BUFFERED_FRAME_COLLECT_DELAY, waiting, connecting, latestReload, latestAlert, messageId, latestFrame, frameDrawing, bufferedFrameCollectDelay, Privates, EventQueue;
    var __moduleName = context_19 && context_19.id;
    async function drawFrames(state, buf, image) {
        // we don't draw frames for about blank
        // but, haha, this heuristic 
        if (state.active && state.active.url == common_js_5.BLANK && buf[0] && buf[0].img.includes(BLANK_SPACE)) {
            common_js_5.DEBUG.val >= common_js_5.DEBUG.med && console.log("Returning before drawing", buf, JSON.stringify(buf).length);
            return;
        }
        buf = buf.filter(x => !!x);
        buf.sort(({ frame: frame1 }, { frame: frame2 }) => frame2 - frame1);
        buf = buf.filter(({ frame, targetId }) => {
            const cond = frame > latestFrame && targetId == state.activeTarget;
            latestFrame = frame;
            return cond;
        });
        for (const { img, frame } of buf) {
            if (frame < latestFrame) {
                console.warn(`Got frame ${frame} less than ${latestFrame}. Dropping`);
                continue;
            }
            if (frameDrawing) {
                common_js_5.DEBUG.val >= common_js_5.DEBUG.med && console.log(`Wanting to draw ${frame} but waiting for ${frameDrawing} to load.`);
                await common_js_5.sleep(Privates.firstDelay);
            }
            frameDrawing = frame;
            common_js_5.DEBUG.val >= common_js_5.DEBUG.med && console.log(`Drawing frame ${frame}`);
            image.src = `data:image/png;base64,${img}`;
            await common_js_5.sleep(Privates.firstDelay);
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
        const someRequireShot = events.some(({ command }) => command.requiresShot || command.requiresTailShot);
        const createsTarget = events.some(({ command }) => command.name == "Target.createTarget");
        const meetsCondition = someRequireShot || createsTarget;
        common_js_5.DEBUG.val >= common_js_5.DEBUG.med && console.log({ events, someRequireShot, createsTarget });
        return meetsCondition;
    }
    function transmitReply({ url, id, data, meta, totalBandwidth }) {
        let key = `${url}:${id}`;
        const resolvePromise = waiting.get(key);
        if (resolvePromise) {
            waiting.delete(key);
            resolvePromise({ data, meta, totalBandwidth });
            return true;
        }
        else {
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
        if (latestAlert) {
            clearTimeout(latestAlert);
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
    return {
        setters: [
            function (common_js_5_1) {
                common_js_5 = common_js_5_1;
            }
        ],
        execute: function () {
            $ = Symbol('[[EventQueuePrivates]]');
            //const TIME_BETWEEN_ONLINE_CHECKS = 1001;
            ALERT_TIMEOUT = 300;
            BLANK_SPACE = new Array(201).join('A');
            MAX_E = 255;
            BUFFERED_FRAME_EVENT = {
                type: "buffered-results-collection",
                command: {
                    isBufferedResultsCollectionOnly: true,
                    params: {}
                }
            };
            BUFFERED_FRAME_COLLECT_DELAY = {
                MIN: 75,
                MAX: 4000,
            };
            waiting = new Map();
            //let lastTestTime;
            //let lastOnlineCheck;
            messageId = 0;
            latestFrame = 0;
            frameDrawing = false;
            bufferedFrameCollectDelay = BUFFERED_FRAME_COLLECT_DELAY.MIN;
            Privates = class Privates {
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
                    this.addBytes = n => {
                        state.totalBytes += n;
                    };
                }
                static get firstDelay() { return 20; /* 20, 40, 250, 500;*/ }
                triggerSendLoop() {
                    if (this.loopActive)
                        return;
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
                    }
                    else if (firstChainIndex == 0) {
                        ({ chain } = q.shift());
                        this.publics.queue.shift();
                    }
                    else {
                        const splice_index = Math.min(MAX_E, firstChainIndex);
                        events = q.splice(0, splice_index);
                        this.publics.queue.splice(0, splice_index);
                    }
                    if (chain) {
                        this.sendEventChain({ chain, url }).then(({ /*data,*/ meta, totalBandwidth }) => {
                            if (!!meta && meta.length) {
                                meta.forEach(metaItem => {
                                    const executionContextId = metaItem.executionContextId;
                                    for (const key of Object.keys(metaItem)) {
                                        let typeList = this.typeLists.get(key);
                                        if (typeList) {
                                            typeList.forEach(func => {
                                                try {
                                                    func({ [key]: metaItem[key], executionContextId });
                                                }
                                                catch (e) {
                                                    common_js_5.DEBUG.val && console.warn(`Error on ${key} handler`, func, e);
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
                    }
                    else {
                        this.sendEvents({ events, url });
                    }
                    if (this.publics.queue.length) {
                        setTimeout(() => this.nextLoop(), this.currentDelay);
                    }
                    else {
                        this.loopActive = false;
                    }
                }
                async sendEvents({ events, url }) {
                    if (!events)
                        return { meta: [], data: [] };
                    events = events.filter(e => !!e && !!e.command);
                    if (events.length == 0)
                        return { meta: [], data: [] };
                    this.maybeCheckForBufferedFrames(events);
                    let protocol;
                    try {
                        url = new URL(url);
                        protocol = url.protocol;
                        url = url + '';
                    }
                    catch (e) {
                        console.warn(e, url);
                    }
                    if (!this.publics.state.demoMode) {
                        if (protocol == 'ws:' || protocol == 'wss:') {
                            try {
                                const senders = this.websockets.get(url);
                                messageId++;
                                let resolve;
                                const promise = new Promise(res => resolve = res);
                                waiting.set(`${url}:${messageId}`, resolve);
                                if (senders) {
                                    senders.so({ messageId, zombie: { events } });
                                }
                                else {
                                    await this.connectSocket(url, events, messageId);
                                }
                                return promise;
                            }
                            catch (e) {
                                console.warn(e);
                                console.warn(JSON.stringify({
                                    msg: `Error sending event to websocket ${url}`,
                                    events, url, error: e
                                }));
                                return { error: 'failed to send', events };
                            }
                        }
                        else {
                            const request = {
                                method: 'POST',
                                body: JSON.stringify({ events }),
                                headers: {
                                    'content-type': 'application/json'
                                }
                            };
                            return fetch(url, request).then(r => r.json()).then(async ({ data, frameBuffer, meta }) => {
                                if (!!frameBuffer && this.images.has(url)) {
                                    drawFrames(this.publics.state, frameBuffer, this.images.get(url));
                                }
                                const errors = data.filter(d => !!d.error);
                                if (errors.length) {
                                    common_js_5.DEBUG.val >= common_js_5.DEBUG.low && console.warn(`${errors.length} errors occured.`);
                                    common_js_5.DEBUG.val >= common_js_5.DEBUG.low && console.log(JSON.stringify(errors));
                                }
                                return { data, meta };
                            }).catch(e => {
                                console.warn(JSON.stringify({
                                    msg: `Error sending event to POST url ${url}`,
                                    events, url, error: e
                                }));
                                return { error: 'failed to send', events };
                            });
                        }
                    }
                    else {
                        return await this.publics.state.demoEventConsumer({ events });
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
                        }
                        catch (e) {
                            talert(`Error connecting to the server. Will reload to try again.`);
                            await treload();
                        }
                        socket.onopen = () => {
                            this.websockets.set(url, { so, sa });
                            const receivesFrames = !this.publics.state.useViewFrame;
                            so({ messageId, zombie: { events, receivesFrames } });
                            function so(o) {
                                socket.send(JSON.stringify(o));
                            }
                            function sa(a) {
                                socket.send(a);
                            }
                        };
                        socket.onmessage = async (message) => {
                            let { data: messageData } = message;
                            this.addBytes(messageData.length);
                            messageData = JSON.parse(messageData);
                            const { data, frameBuffer, meta, messageId: serverMessageId, totalBandwidth } = messageData;
                            if (!!frameBuffer && this.images.has(url)) {
                                drawFrames(this.publics.state, frameBuffer, this.images.get(url));
                            }
                            const errors = data.filter(d => !!d && !!d.error);
                            if (errors.length) {
                                common_js_5.DEBUG.val >= common_js_5.DEBUG.low && console.warn(`${errors.length} errors occured.`);
                                common_js_5.DEBUG && console.log(JSON.stringify(errors));
                                if (errors.some(({ error }) => error.hasSession === false)) {
                                    console.warn(`Session has been cleared. Let's attempt relogin`, this.sessionToken);
                                    if (common_js_5.DEBUG.blockAnotherReset)
                                        return;
                                    common_js_5.DEBUG.blockAnotherReset = true;
                                    try {
                                        const x = new URL(location);
                                        x.pathname = 'login';
                                        x.search = `token=${this.sessionToken}&ran=${Math.random()}`;
                                        await talert("Your browser cleared your session. We need to reload the page to refresh it.");
                                        common_js_5.DEBUG.delayUnload = false;
                                        location.href = x;
                                        socket.onmessage = null;
                                    }
                                    catch (e) {
                                        talert("An error occurred. Please reload.");
                                    }
                                    return;
                                }
                                else if (errors.some(({ error }) => error.includes && error.includes("ECONNREFUSED"))) {
                                    console.warn(`Cloud browser has not started yet. Let's reload and see if it has then.`);
                                    if (common_js_5.DEBUG.blockAnotherReset)
                                        return;
                                    common_js_5.DEBUG.blockAnotherReset = true;
                                    talert("Your cloud browser has not started yet. We'll reload and see if it has then.");
                                    await treload();
                                    return;
                                }
                                else if (errors.some(({ error }) => error.includes && error.includes("Timed out"))) {
                                    console.warn(`Some events are timing out when sent to the cloud browser.`);
                                    if (common_js_5.DEBUG.blockAnotherReset)
                                        return;
                                    common_js_5.DEBUG.blockAnotherReset = true;
                                    const reload = await tconfirm(`Some events are timing out when sent to the cloud browser. Try reloading the page, and if the problem persists try switching your cloud browser off then on again. Want to reload now?`);
                                    if (reload) {
                                        treload();
                                    }
                                    return;
                                }
                                else if (errors.some(({ error }) => error.includes && error.includes("not opened"))) {
                                    console.warn(`We can't establish a connection the cloud browser right now. We can try reloading the page, but if the problem persists try switching your cloud browser off then on again.`);
                                    if (common_js_5.DEBUG.blockAnotherReset)
                                        return;
                                    common_js_5.DEBUG.blockAnotherReset = true;
                                    const reload = await tconfirm(`We can't establish a connection the cloud browser right now. We can try reloading the page, but if the problem persists try switching your cloud browser off then on again. Reload the page now?`);
                                    if (reload) {
                                        treload();
                                    }
                                    return;
                                }
                                else if (errors.some(({ resetRequired }) => resetRequired)) {
                                    console.warn(`Some errors have occurred which require reloading the page. If the problem persists try switching your cloud browser off then on again.`);
                                    if (common_js_5.DEBUG.blockAnotherReset)
                                        return;
                                    common_js_5.DEBUG.blockAnotherReset = true;
                                    const reload = await tconfirm(`Some errors have occurred which require reloading the page. If the problem persists try switching your cloud browser off then on again. Want to reload the page now?`);
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
                                                    func({ [key]: metaItem[key], executionContextId });
                                                }
                                                catch (e) {
                                                    common_js_5.DEBUG.val && console.warn(`Error on ${key} handler`, func, e);
                                                }
                                            });
                                        }
                                    }
                                });
                            }
                            if (totalBandwidth) {
                                this.publics.state.totalBandwidth = totalBandwidth;
                            }
                            const replyTransmitted = transmitReply({ url, id: serverMessageId, data, meta, totalBandwidth });
                            if (replyTransmitted)
                                return;
                            else if (common_js_5.DEBUG.val) {
                                console.warn(`Server sent message Id ${serverMessageId}, which is not in our table.`);
                                console.info(`Falling back to closure message id ${messageId}`);
                            }
                            const fallbackReplyTransmitted = transmitReply({ url, id: messageId, data, meta, totalBandwidth });
                            if (fallbackReplyTransmitted)
                                return;
                            else if (common_js_5.DEBUG.val) {
                                console.warn(`Neither server nor closure message ids were in our table.`);
                            }
                            //die();
                        };
                        socket.onclose = async () => {
                            this.websockets.delete(url);
                            console.log("Socket disconnected. Will reconnect when online");
                            talert(`Error connecting to the server - Will reload to try again.`);
                            await treload();
                        };
                        socket.onerror = async () => {
                            socket.onerror = null;
                            talert(`Error connecting to the server - Will reload to try again.`);
                            await treload();
                        };
                    }
                    else {
                        console.log("Offline. Will connect socket when online");
                        talert(`Error connecting to the server, will reload to try again.`);
                        await treload();
                    }
                }
                async sendEventChain({ chain, url }) {
                    const Meta = [], Data = [];
                    let lastData;
                    for (const next of chain) {
                        if (typeof next == "object") {
                            const { meta, data } = await this.sendEvents({ events: [next], url });
                            Meta.push(...meta);
                            Data.push(...data);
                            lastData = data;
                        }
                        else if (typeof next == "function") {
                            let funcResult;
                            try {
                                funcResult = next(lastData[0]);
                            }
                            catch (e) {
                                Data.push({ error: e + '' });
                            }
                            let events;
                            if (Array.isArray(funcResult)) {
                                events = funcResult;
                            }
                            else if (typeof funcResult == "object") {
                                events = [funcResult];
                            }
                            let { meta, data } = await this.sendEvents({ events, url });
                            Meta.push(...meta);
                            Data.push(...data);
                            lastData = data;
                        }
                    }
                    return { data: Data, meta: Meta };
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
                    common_js_5.DEBUG.val >= common_js_5.DEBUG.med && console.log("Meets collect delayed shot condition. Pushing a collect results event.");
                    clearTimeout(this.willCollectBufferedFrame);
                    this.willCollectBufferedFrame = false;
                    if (bufferedFrameCollectDelay >= BUFFERED_FRAME_COLLECT_DELAY.MAX) {
                        bufferedFrameCollectDelay = BUFFERED_FRAME_COLLECT_DELAY.MIN;
                    }
                    else {
                        bufferedFrameCollectDelay *= 1.618;
                        this.willCollectBufferedFrame = setTimeout(() => this.pushNextCollectEvent(), bufferedFrameCollectDelay);
                    }
                    this.publics.queue.push(Object.assign({ id: messageId++ }, BUFFERED_FRAME_EVENT));
                    this.triggerSendLoop();
                }
            };
            EventQueue = class EventQueue {
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
                    }
                    else {
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
                            const canv = this.state.viewState.canvasEl;
                            canv.width = imageEl.width;
                            canv.height = imageEl.height;
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
            };
            exports_19("default", EventQueue);
        }
    };
});
System.register("voodoo/src/transformEvent", ["voodoo/src/common"], function (exports_20, context_20) {
    "use strict";
    var common_js_6, controlChars;
    var __moduleName = context_20 && context_20.id;
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
                case "auth-response": {
                    const { authResponse, requestId } = synthetic;
                    Object.assign(transformedEvent, { authResponse, requestId });
                    break;
                }
                case "typing": {
                    // get (composed) characters created
                    let data = synthetic.data;
                    Object.assign(transformedEvent, {
                        characters: data
                    });
                    break;
                }
                case "typing-syncValue":
                case "typing-clearAndInsertValue": {
                    const { value, contextId } = synthetic;
                    let encodedValue;
                    if (value) {
                        encodedValue = btoa(unescape(encodeURIComponent(value)));
                    }
                    Object.assign(transformedEvent, {
                        encodedValue,
                        value,
                        contextId
                    });
                    break;
                }
                case "typing-deleteContentBackward": {
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
                case "url-address": {
                    // get URL address
                    const address = synthetic.url;
                    Object.assign(transformedEvent, { address });
                    break;
                }
                case "search-bar": {
                    // get URL address
                    const search = originalEvent.target.search.value;
                    Object.assign(transformedEvent, { search });
                    break;
                }
                case "history": {
                    // get button
                    const action = form.clickedButton.value;
                    Object.assign(transformedEvent, { action });
                    break;
                }
                case "touchscroll": {
                    const { deltaX, deltaY, bitmapX, bitmapY, contextId } = synthetic;
                    Object.assign(transformedEvent, { deltaX, deltaY, bitmapX, bitmapY, contextId });
                    break;
                }
                case "zoom": {
                    const { scale } = synthetic;
                    const coords = getBitmapCoordinates(originalEvent);
                    Object.assign(transformedEvent, coords, { scale });
                    break;
                }
                case "select": {
                    const value = originalEvent.target.value;
                    const executionContext = synthetic.state.waitingExecutionContext;
                    Object.assign(transformedEvent, { value, executionContext });
                    break;
                }
                case "window-bounds": {
                    const { width, height, targetId } = synthetic;
                    common_js_6.DEBUG.val && console.log(width, height, targetId);
                    Object.assign(transformedEvent, { width, height, targetId });
                    break;
                }
                case "window-bounds-preImplementation": {
                    // This is here until Browser.getWindowForTarget and Browser.setWindowBounds come online
                    let width, height;
                    if (synthetic.width !== undefined && synthetic.height !== undefined) {
                        ({ width, height } = synthetic);
                    }
                    else {
                        ({ width: { value: width }, height: { value: height } } = form);
                    }
                    Object.assign(transformedEvent, { width, height });
                    break;
                }
                case "user-agent": {
                    const { userAgent, platform, acceptLanguage } = synthetic;
                    Object.assign(transformedEvent, { userAgent, platform, acceptLanguage });
                    break;
                }
                case "hide-scrollbars": {
                    break;
                }
                case "canKeysInput": {
                    break;
                }
                case "getFavicon": {
                    break;
                }
                case "getElementInfo": {
                    transformedEvent.data = e.data;
                    const { bitmapX: clientX, bitmapY: clientY } = getBitmapCoordinates(transformedEvent.data);
                    Object.assign(transformedEvent.data, { clientX, clientY });
                    break;
                }
                case "touchcancel": {
                    break;
                }
                case "respond-to-modal": {
                    Object.assign(transformedEvent, e);
                    break;
                }
                case "isSafari": {
                    break;
                }
                case "isFirefox": {
                    break;
                }
                case "newIncognitoTab": {
                    break;
                }
                case "clearAllPageHistory": {
                    break;
                }
                case "clearCache": {
                    break;
                }
                case "clearCookies": {
                    break;
                }
                default: {
                    console.warn(`Unknown command ${JSON.stringify({ synthetic })}`);
                    break;
                }
            }
        }
        else if (e.raw || e.custom) {
            Object.assign(transformedEvent, e);
        }
        else {
            event = e;
            transformedEvent.originalEvent = e;
            switch (event.type) {
                case "keypress":
                case "keydown":
                case "keyup": {
                    const id = event.key && event.key.length > 1 ? event.key : event.code;
                    if (controlChars.has(id)) {
                        event.type == "keypress" && event.preventDefault && event.preventDefault();
                        transformedEvent.synthetic = true;
                        transformedEvent.originalType = event.type;
                        transformedEvent.type = "control-chars";
                        transformedEvent.key = event.key;
                        transformedEvent.code = event.code;
                        transformedEvent.keyCode = event.keyCode;
                        common_js_6.DEBUG.val >= common_js_6.DEBUG.med && console.log(transformedEvent);
                    }
                    break;
                }
                case "wheel":
                case "mousemove":
                case "mousedown":
                case "mouseup":
                case "pointermove":
                case "pointerdown":
                case "pointerup": {
                    // get relevant X, Y coordinates and element under point
                    // also get any relevant touch points and pressures and other associated
                    // pointer or touch metadata or properties
                    const { button } = event;
                    const coords = getBitmapCoordinates(event);
                    Object.assign(transformedEvent, coords, { button });
                    break;
                }
            }
        }
        common_js_6.DEBUG.val >= common_js_6.DEBUG.med && console.log(transformedEvent);
        return transformedEvent;
    }
    exports_20("default", transformEvent);
    function getBitmapCoordinates(event, scale = 1) {
        const { clientX, clientY } = event;
        const bitmap = event.target;
        let coordinates;
        if (bitmap) {
            const { left: parentX, top: parentY, width: elementWidth, height: elementHeight } = bitmap.getBoundingClientRect();
            const scaleX = bitmap.width / elementWidth * scale;
            const scaleY = bitmap.height / elementHeight * scale;
            coordinates = {
                bitmapX: (clientX - parentX),
                bitmapY: (clientY - parentY)
            };
            if (common_js_6.DEBUG.val > common_js_6.DEBUG.high) {
                const dpi = window.devicePixelRatio;
                const info = { coordinates, parentX, parentY, clientX, clientY, scaleX, scaleY, dpi };
                common_js_6.logit(info);
            }
        }
        else {
            coordinates = { clientX, clientY };
        }
        return coordinates;
    }
    exports_20("getBitmapCoordinates", getBitmapCoordinates);
    return {
        setters: [
            function (common_js_6_1) {
                common_js_6 = common_js_6_1;
            }
        ],
        execute: function () {
            exports_20("controlChars", controlChars = new Set([
                "Enter", "Backspace", "Control", "Shift", "Alt", "Meta", "Space", "Delete",
                "ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", "Tab"
            ]));
        }
    };
});
System.register("voodoo/src/subviews/omniBox", ["voodoo/node_modules/dumbass/r", "voodoo/src/subviews/controls"], function (exports_21, context_21) {
    "use strict";
    var r_js_3, controls_js_1, USE_DDG, omniBoxInput, refocus;
    var __moduleName = context_21 && context_21.id;
    function OmniBox(state) {
        const activeTab = state.activeTab();
        const { H } = state;
        if (document.activeElement == omniBoxInput) {
            refocus = true;
        }
        return r_js_3.d `
    <nav class="controls url" stylist=styleNavControl>
      <!--URL-->
        <form class=url stylist=styleURLForm submit=${e => {
            const { target: form } = e;
            const { address } = form;
            let url, search;
            try {
                url = new URL(address.value);
                if (url.hostname == location.hostname) {
                    console.warn("Too relative", address.value);
                    throw new TypeError("Cannot use relative URI");
                }
                url = url + '';
            }
            catch (e) {
                search = searchProvider({ query: address.value });
            }
            H({
                synthetic: true,
                type: 'url-address',
                event: e,
                url: url || search
            });
        }} click=${controls_js_1.saveClick}>
          <input 
            maxlength=3000
            title="Address or search"
            bond=${el => {
            omniBoxInput = el;
            state.viewState.omniBoxInput = omniBoxInput;
            if (refocus) {
                refocus = false;
                omniBoxInput.focus();
            }
        }}
            stylist=styleOmniBox 
            autocomplete=off ${state.tabs.length == 0 ? 'disabled' : ''} 
            name=address 
            placeholder="${state.tabs.length ?
            'Address or search' :
            ''}" 
            type=search 
            value="${activeTab.url == 'about:blank' ? '' : activeTab.url || ''}"
          >
          <button ${state.tabs.length ? '' : 'disabled'} title="Go" class=go>&crarr;</button>
        </form>
    </nav>
  `;
    }
    exports_21("OmniBox", OmniBox);
    function focusOmniBox() {
        if (omniBoxInput) {
            omniBoxInput.focus();
        }
    }
    exports_21("focusOmniBox", focusOmniBox);
    // Search
    function searchProvider({ query: query = '' } = {}) {
        if (USE_DDG) {
            return `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
        }
        else {
            return `https://google.com/search?q=${encodeURIComponent(query)}`;
        }
    }
    return {
        setters: [
            function (r_js_3_1) {
                r_js_3 = r_js_3_1;
            },
            function (controls_js_1_1) {
                controls_js_1 = controls_js_1_1;
            }
        ],
        execute: function () {
            USE_DDG = false;
            omniBoxInput = null;
            refocus = false;
        }
    };
});
System.register("voodoo/src/subviews/pluginsMenuButton", ["voodoo/node_modules/dumbass/r"], function (exports_22, context_22) {
    "use strict";
    var r_js_4, pluginsMenuOpen;
    var __moduleName = context_22 && context_22.id;
    function PluginsMenuButton(state) {
        return r_js_4.u `
    <nav class="controls plugins-menu-button aux" stylist="styleNavControl stylePluginsMenuButton">
      <form submit=${[
            e => e.preventDefault(),
            () => {
                pluginsMenuOpen ^= true;
                state.pluginsMenuActive = pluginsMenuOpen;
                state.viewState.dss.setState(state);
                state.viewState.dss.restyleElement(state.viewState.pmEl);
                state.viewState.dss.restyleElement(state.viewState.voodooEl);
            }
        ]}>
        <button title="Menu" accesskey=p>&#9776;</button>
      </form>
    </nav>
  `;
    }
    exports_22("PluginsMenuButton", PluginsMenuButton);
    return {
        setters: [
            function (r_js_4_1) {
                r_js_4 = r_js_4_1;
            }
        ],
        execute: function () {
            pluginsMenuOpen = false;
            // Helper functions 
        }
    };
});
System.register("voodoo/src/subviews/controls", ["kbd", "voodoo/src/common", "voodoo/node_modules/dumbass/r", "voodoo/src/subviews/omniBox", "voodoo/src/subviews/pluginsMenuButton"], function (exports_23, context_23) {
    "use strict";
    var kbd_js_2, common_js_7, r_js_5, omniBox_js_1, pluginsMenuButton_js_1;
    var __moduleName = context_23 && context_23.id;
    function Controls(state) {
        const { H, retargetTab } = state;
        return r_js_5.d `
    <nav class="controls history aux" stylist="styleNavControl">
      <!--History-->
        <form submit=${e => H({ synthetic: true,
            type: 'history',
            event: e
        })} click=${saveClick} stylist="styleHistoryForm">
          <button ${state.tabs.length ? '' : 'disabled'} name=history_action title=Back value=back class=back>&lt;</button>
          <button ${state.tabs.length ? '' : 'disabled'} name=history_action title=Forward value=forward class=forward>&gt;</button>
        </form>
    </nav>
		<nav class="controls keyinput aux" stylist="styleNavControl">
      <!--Text-->
        <form class=kbd-input submit=${e => e.preventDefault()}>
          <input tabindex=-1 class=control name=key_input size=2
            autocomplete=off
            bond=${el => state.viewState.keyinput = el}
            keydown=${[common_js_7.logitKeyInputEvent, e => state.openKey = e.key, H, limitCursor, retargetTab]}
            keyup=${[common_js_7.logitKeyInputEvent, () => state.openKey = '', H, retargetTab]}
            focusin=${[() => clearWord(state), () => state.openKey = '']}
            compositionstart=${[common_js_7.logitKeyInputEvent, startComposition]}
            compositionupdate=${[common_js_7.logitKeyInputEvent, updateComposition]}
            compositionend=${[common_js_7.logitKeyInputEvent, endComposition]}
            input=${[common_js_7.logitKeyInputEvent, inputText]}
            keypress=${[common_js_7.logitKeyInputEvent, pressKey]}
            paste=${e => {
            inputText({ type: 'paste', data: e.clipboardData.getData('Text') });
        }}
            >
          <textarea tabindex=-1 class=control name=textarea_input cols=2 rows=1
            autocomplete=off
            bond=${el => state.viewState.textarea = el}
            keydown=${[common_js_7.logitKeyInputEvent, e => state.openKey = e.key, H, limitCursor, retargetTab]}
            keyup=${[common_js_7.logitKeyInputEvent, () => state.openKey = '', H, retargetTab]}
            focusin=${[() => clearWord(state), () => state.openKey = '']}
            compositionstart=${[common_js_7.logitKeyInputEvent, startComposition]}
            compositionupdate=${[common_js_7.logitKeyInputEvent, updateComposition]}
            compositionend=${[common_js_7.logitKeyInputEvent, endComposition]}
            input=${[common_js_7.logitKeyInputEvent, inputText]}
            keypress=${[common_js_7.logitKeyInputEvent, pressKey]}
            paste=${e => {
            inputText({ type: 'paste', data: e.clipboardData.getData('Text') });
        }}
            ></textarea>
        </form>
		</nav>
    ${omniBox_js_1.OmniBox(state)}
    ${common_js_7.DEBUG.pluginsMenu ? pluginsMenuButton_js_1.PluginsMenuButton(state) : ''}
  `;
        function startComposition( /*e*/) {
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
            if (!state.isComposing)
                return;
            state.isComposing = false;
            if (e.data == state.latestCommitData)
                return;
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
            }
            else {
                state.latestData = "";
            }
        }
        function inputText(e) {
            let data = e.data || "";
            if (state.openKey == data)
                return;
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
            }
            else if (e.inputType == 'deleteContentBackward') {
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
            }
            else if (e.inputType == 'insertReplacementText') {
                H({
                    synthetic: true,
                    type: 'typing-deleteContentBackward',
                    event: e,
                    contextId: state.contextIdOfFocusedInput,
                    valueToDelete: state.currentWord,
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
            }
            else if (e.type == 'paste') {
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
            }
        }
        function pressKey(e) {
            updateWord(e, state);
            state.lastKeypressKey = e.key;
            if (!!e.key && e.key.length == 1) {
                H({
                    synthetic: true,
                    type: 'typing',
                    event: e,
                    data: e.key
                });
            }
            else
                H(e);
            retargetTab(e);
        }
    }
    exports_23("Controls", Controls);
    // Helper functions 
    // save the target of a form submission
    function saveClick(event) {
        if (event.target.matches('button')) {
            event.currentTarget.clickedButton = event.target;
        }
    }
    exports_23("saveClick", saveClick);
    // keep track of sequences of keypresses (words basically)
    // because some IMEs (iOS / Safari) issue a insertReplacementText if we select a 
    // suggested word, which requires we delete the word already entered.
    function clearWord(state) {
        state.hasCommitted = false;
        state.currentWord = "";
    }
    function updateWord(keypress, state) {
        const key = kbd_js_2.default[keypress.key];
        if (!!key && (key.code == 'Space' || key.code == 'Enter')) {
            clearWord(state);
        }
        else {
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
    function limitCursor( /*event*/) {
        /*
        const target = event.target;
        target.selectionStart = target.selectionEnd = target.value.length;
        */
        return;
    }
    // text
    // determines if it's time to commit a text input change from an IME
    function commitChange(e, state) {
        const canCommit = ((e.type == "input" && e.inputType == "insertText") ||
            (e.type == "compositionend" && !!(e.data || state.latestData)));
        if (common_js_7.DEBUG.val >= common_js_7.DEBUG.high) {
            common_js_7.logitKeyInputEvent(e);
        }
        return canCommit;
    }
    return {
        setters: [
            function (kbd_js_2_1) {
                kbd_js_2 = kbd_js_2_1;
            },
            function (common_js_7_1) {
                common_js_7 = common_js_7_1;
            },
            function (r_js_5_1) {
                r_js_5 = r_js_5_1;
            },
            function (omniBox_js_1_1) {
                omniBox_js_1 = omniBox_js_1_1;
            },
            function (pluginsMenuButton_js_1_1) {
                pluginsMenuButton_js_1 = pluginsMenuButton_js_1_1;
            }
        ],
        execute: function () {
        }
    };
});
System.register("voodoo/src/subviews/bandwidthIndicator", ["voodoo/node_modules/dumbass/r"], function (exports_24, context_24) {
    "use strict";
    var r_js_6, lastBandwidth;
    var __moduleName = context_24 && context_24.id;
    function BandwidthIndicator(state) {
        const saved = (state.totalBandwidth - state.totalBytes) / 1000000;
        return r_js_6.d `
    <aside title="Bandwidth savings" class="bandwidth-indicator" stylist="styleBandwidthIndicator">
      <section class=measure>
        Saved: <span>${Math.round(saved)}M</span>
      </section>
      <section class=measure>
        Used: <span>${Math.round(state.totalBytes / 1000000)}M</span>
        ${state.showBandwidthRate ? r_js_6.d `K/s: <span>${Math.round(state.totalBytesThisSecond / 1000)}</span>` : ''}
      </section>
    </aside>
  `;
    }
    exports_24("BandwidthIndicator", BandwidthIndicator);
    function startBandwidthLoop(state) {
        setInterval(() => {
            const bwThisSecond = state.totalBytes - lastBandwidth;
            state.totalBytesThisSecond = bwThisSecond;
            lastBandwidth = state.totalBytes;
            BandwidthIndicator(state);
        }, 1000);
    }
    exports_24("startBandwidthLoop", startBandwidthLoop);
    return {
        setters: [
            function (r_js_6_1) {
                r_js_6 = r_js_6_1;
            }
        ],
        execute: function () {
            lastBandwidth = 0;
        }
    };
});
System.register("voodoo/src/subviews/pluginsMenu", ["voodoo/node_modules/dumbass/r", "voodoo/src/subviews/pluginsMenuButton"], function (exports_25, context_25) {
    "use strict";
    var r_js_7, pluginsMenuButton_js_2;
    var __moduleName = context_25 && context_25.id;
    function PluginsMenu(state, { bondTasks: bondTasks = [], } = {}) {
        return r_js_7.d `
    <nav class=plugins-menu 
      bond=${[
            el => state.viewState.pmEl = el,
            () => console.log(`PMA?${!!state.pluginsMenuActive}`),
            ...bondTasks
        ]} 
      stylist="stylePluginsMenu"
    >
      <aside>
        <header>
          <h1 class=spread>
            Menu
            ${pluginsMenuButton_js_2.PluginsMenuButton(state)}
          </h1>
        </header>
        <article>
          <section>
            <h1>
              Quality Settings
            </h1>
            <form method=POST action=#save-settings>
              <fieldset>
                <legend>Image Mode Settings</legend>
                <p>
                  <label>
                    <input type=range min=1 max=100 value=25 name=jpeg_quality
                      oninput="jfqvalue.value = this.value;" 
                    >
                    JPEG frame quality
                    &nbsp;(<output id=jfqvalue>25</output>)
                  </label>
                <p>
                  <button>Save</button>
              </fieldset>
            </form>
          </section>
          <section>
            <h1>
              Plugins
            </h1>
            <form method=POST action=#plugins-settings>
              <fieldset>
                <legend>Enabled plugins</legend>
                <p>
                  <label>
                    <input type=checkbox name=mapmaker>
                    Map Maker 
                  </label>
                <p>
                  <label>
                    <input type=checkbox name=mapviewer>
                    Map Viewer
                  </label>
                <p>
                  <label>
                    <input type=checkbox name=trailmarker>
                    Trail Marker
                  </label>
                <p>
                  <label>
                    <input type=checkbox name=trailrunner>
                    Trail Runner
                  </label>
                <p>
                  <button>Save</button>
              </fieldset>
              <fieldset>
                <legend>Discover plugins</legend>
                <p>
                  <label>
                    <button name=discover>Discover</button>
                    Discover plugins to install 
                  </label>
                <p>
                  <label>
                    <input type=search name=plugin_search>
                    <button name=search>Search</button>
                    Search for plugins to install
                  </label>
                <p>
                  <ul class=plugins-search-results></ul>
              </fieldset>
            </form>
          </section>
        </article>
      </aside>
    </nav>
  `;
    }
    exports_25("PluginsMenu", PluginsMenu);
    return {
        setters: [
            function (r_js_7_1) {
                r_js_7 = r_js_7_1;
            },
            function (pluginsMenuButton_js_2_1) {
                pluginsMenuButton_js_2 = pluginsMenuButton_js_2_1;
            }
        ],
        execute: function () {
        }
    };
});
System.register("voodoo/src/subviews/other", ["voodoo/src/common", "voodoo/node_modules/dumbass/r"], function (exports_26, context_26) {
    "use strict";
    var common_js_8, r_js_8, NATIVE_MODALS, ModalRef;
    var __moduleName = context_26 && context_26.id;
    // Modals
    function Modals(state) {
        const { currentModal } = state.viewState;
        // these are default values when there is no current Modal
        let msg = '', type = '', title = '', currentModalEl = false;
        let requestId = '';
        let sessionId = '';
        let mode = '';
        let multiple = false;
        let submitText = '';
        let cancelText = '';
        let working = false;
        if (currentModal) {
            // the defaults here are defaults when there *is* a current modal
            ({
                msg: msg = 'Empty',
                type,
                title: title = 'Untitled',
                el: currentModalEl,
                requestId: requestId = '',
                mode: mode = '',
                sessionId: sessionId = '',
                submitText: submitText = 'Submit',
                cancelText: cancelText = 'Cancel',
                working: working = false,
            } = currentModal);
        }
        if (type == 'auth' && !requestId) {
            throw new TypeError(`Auth modal requires a requestId to send the response to`);
        }
        if (type == 'filechooser' && !(mode || !sessionId)) {
            throw new TypeError(`File chooser modal requires both sessionId and mode`);
        }
        if (mode == 'selectMultiple') {
            multiple = true;
        }
        return r_js_8.d `
        <aside class="modals ${currentModal ? 'active' : ''}" stylist="styleModals" click=${click => closeModal(click, state)}>
          <article bond=${el => ModalRef.alert = el} class="alert ${currentModalEl === ModalRef.alert ? 'open' : ''}">
            <h1>Alert!</h1>
            <p class=message value=message>${msg || 'You are alerted.'}</p>
            <button class=ok title=Acknowledge value=ok>Acknowledge</button>
          </article>
          <article bond=${el => ModalRef.confirm = el} class="confirm ${currentModalEl === ModalRef.confirm ? 'open' : ''}">
            <h1>Confirm</h1>
            <p class=message value=message>${msg || 'You are asked to confirm'}</p>
            <button class=ok title="Confirm" value=ok>Confirm</button>
            <button class=cancel title="Deny" value=cancel>Deny</button>
          </article>
          <article bond=${el => ModalRef.prompt = el} class="prompt ${currentModalEl === ModalRef.prompt ? 'open' : ''}">
            <h1>Prompt</h1>
            <p class=message value=message>${msg || 'You are prompted for information:'}</p>
            <p><input type=text name=response>
            <button class=ok title="Send" value=ok>Send</button>
            <button class=cancel title="Dismiss" value=cancel>Dismiss</button>
          </article>
          <article bond=${el => ModalRef.beforeunload = el} class="beforeunload ${currentModalEl === ModalRef.beforeunload ? 'open' : ''}">
            <h1>Page unloading</h1>
            <p class=message value=message>${msg || 'Are you sure you wish to leave?'}</p>
            <button class=ok title="Leave" value=ok>Leave</button>
            <button class=cancel title="Remain" value=cancel>Remain</button>
          </article>
          <article bond=${el => ModalRef.infobox = el} class="infobox ${currentModalEl === ModalRef.infobox ? 'open' : ''}">
            <h1>${title || 'Info'}</h1>
            <textarea 
              readonly class=message value=message rows=${Math.ceil(msg.length / 80)}
            >${msg}</textarea>
            <button class=ok title="Got it" value=ok>OK</button>
          </article>
          <article bond=${el => ModalRef.notice = el} class="notice ${currentModalEl === ModalRef.notice ? 'open' : ''}">
            <h1>${title}</h1>
            <p class=message value=message>${msg || 'Empty notice'}</p>
            <button class=ok title=Acknowledge value=ok>OK</button>
          </article>
          <article bond=${el => ModalRef.auth = el} class="auth ${currentModalEl === ModalRef.auth ? 'open' : ''}">
            <h1>${title}</h1>
            <form>
              <p class=message value=message>${msg || 'Empty notice'}</p>
              <input type=hidden name=requestid value=${requestId}>
              <p>
                <input type=text name=username placeholder=username maxlength=140>
              <p>
                <input type=password name=password placeholder=password maxlength=140>
              <p>
                <button click=${click => respondWithAuth(click, state)}>Submit</button>
                <button click=${click => respondWithCancel(click, state)}>Cancel</button>
            </form>
          </article>
          <article bond=${el => ModalRef.filechooser = el} class="filechooser ${currentModalEl === ModalRef.filechooser ? 'open' : ''}">
            <h1>${title}</h1>
            <form method=POST action=/file enctype=multipart/form-data>
              <p class=message value=message>${msg || 'Empty notice'}</p>
              <input type=hidden name=sessionid value=${sessionId}>
              <p>
                <label>
                  Select ${multiple ? 'one or more files' : 'one file'}.
                  <input type=file name=files ${multiple ? 'multiple' : ''}>
                </label>
              <p>
                <button 
                  ${working ? 'disabled' : ''} 
                  click=${click => chooseFile(click, state)}
                >${submitText}</button>
                <button 
                  ${working ? 'disabled' : ''} 
                  click=${click => cancelFileChooser(click, state)}
                >${cancelText}</button>
            </form>
          </article>
        </aside>
      `;
    }
    exports_26("Modals", Modals);
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
        else {
            common_js_8.DEBUG.val && console.log(`Success attached files`, resp);
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
            alert(`An error occurred`);
        }
        else {
            common_js_8.DEBUG.val && console.log(`Success cancelling file attachment`, resp);
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
    function openModal({ modal: { sessionId, mode, requestId, title, type, message: msg, defaultPrompt, url } } = {}, state) {
        const currentModal = { type, mode, requestId, msg, el: ModalRef[type], sessionId, title };
        state.viewState.currentModal = currentModal;
        const modalDebug = {
            defaultPrompt, url, currentModal, ModalRef, state, title
        };
        common_js_8.DEBUG.val >= common_js_8.DEBUG.med && Object.assign(self, { modalDebug });
        common_js_8.DEBUG.val >= common_js_8.DEBUG.med && console.log(`Will display modal ${type} with ${msg} on el:`, state.viewState.currentModal.el);
        Modals(state);
    }
    exports_26("openModal", openModal);
    function closeModal(click, state) {
        if (!click.target.matches('button'))
            return;
        const response = click.target.value || 'unknown';
        const { sessionId } = state.viewState.currentModal;
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
        Modals(state);
    }
    // Permission request
    function PermissionRequest({ permission, request, page }) {
        return r_js_8.d `
        <article class="permission-request hidden">
          <h1>${permission}</h1>
          <p class=request>${page} is requesting ${permission} permission. The details are: ${request}</p>
          <button class=grant>Grant</button>
          <button class=deny>Deny</button>
        </article>
      `;
    }
    exports_26("PermissionRequest", PermissionRequest);
    return {
        setters: [
            function (common_js_8_1) {
                common_js_8 = common_js_8_1;
            },
            function (r_js_8_1) {
                r_js_8 = r_js_8_1;
            }
        ],
        execute: function () {
            // Auxilliary view functions 
            NATIVE_MODALS = new Set([
                'alert',
                'confirm',
                'prompt',
                'beforeunload'
            ]);
            ModalRef = {
                alert: null, confirm: null, prompt: null, beforeunload: null,
                infobox: null, notice: null, auth: null, filechooser: null
            };
        }
    };
});
System.register("voodoo/src/subviews/contextMenu", ["voodoo/src/common", "voodoo/node_modules/dumbass/r", "voodoo/src/subviews/index"], function (exports_27, context_27) {
    "use strict";
    var common_js_9, r_js_9, index_js_1, CLOSE_DELAY, SHORT_CUT, CONTEXT_MENU;
    var __moduleName = context_27 && context_27.id;
    function ContextMenu( /*state*/) {
        return r_js_9.d `

  `;
    }
    exports_27("ContextMenu", ContextMenu);
    function makeContextMenuHandler(state, node = { type: 'page', id: 'current-page' }) {
        const { /*id, */ type: nodeType } = node;
        const menuItems = CONTEXT_MENU[nodeType];
        return contextMenu => {
            // we need this check because we attach a handler to each node
            // we could use delegation at the container of the root node
            // but for now we do it like this
            if (navigator.vibrate) {
                try {
                    navigator.vibrate(100);
                }
                catch (e) {
                    console.warn('error vibrating', e);
                }
            }
            if (contextMenu.currentTarget.contains(contextMenu.target)) {
                let pageX, pageY;
                if (contextMenu.pageX && contextMenu.pageY) {
                    ({ pageX, pageY } = contextMenu);
                }
                else {
                    const { clientX, clientY } = contextMenu.detail;
                    ({ pageX, pageY } = contextMenu.detail);
                    Object.assign(contextMenu, { pageX, pageY, clientX, clientY });
                }
                // cancel click for chrome mobile
                // (note: this does not work as intended. 
                // It does not cancel a touch click on contextmenu open)
                // so it's commented out
                // state.H({type:'touchcancel'});
                // the actual way to kill the click is 
                // by killing the next mouse release like so:
                state.viewState.contextMenuClick = contextMenu;
                state.viewState.killNextMouseReleased = true;
                // we also stop default context menu
                contextMenu.preventDefault();
                contextMenu.stopPropagation();
                const bondTasks = [
                    el => {
                        // only have 1 context menu at a time
                        close(state, false);
                        state.viewState.contextMenu = el;
                    },
                    () => self.addEventListener('click', function remove(click) {
                        // if we clicked outside the menu, 
                        // remove the menu and stop listening for such clicks
                        if (!click.target.closest('.context-menu')) {
                            close(state, false);
                            self.removeEventListener('click', remove);
                        }
                    }),
                    el => {
                        const x = pageX + 'px';
                        const y = pageY + 'px';
                        if (pageX + el.scrollWidth > innerWidth) {
                            el.style.right = '8px';
                        }
                        else {
                            el.style.left = x;
                        }
                        if (pageY + el.scrollHeight > (innerHeight - 32)) {
                            el.style.bottom = '48px';
                        }
                        else {
                            el.style.top = y;
                        }
                    }
                ];
                const menuView = r_js_9.u `
        <aside class=context-menu 
          role=menu 
          bond=${bondTasks}
          contextmenu=${e => (
                /* don't trigger within the menu */
                e.preventDefault(),
                    e.stopPropagation())}
        >
          <h1>Menu</h1> 
          <hr>
          <ul>
            ${menuItems.map(({ title, func, hr }) => r_js_9.u `
              ${hr ? r_js_9.u `<hr>` : ''}
              <li click=${click => func(click, state)}>${title}</li>
            `)}
          </ul>
        </aside>
      `;
                menuView.to(contextMenu.currentTarget, 'afterEnd');
            }
        };
    }
    exports_27("makeContextMenuHandler", makeContextMenuHandler);
    function close(state, delay = true) {
        if (delay) {
            setTimeout(() => {
                if (state.viewState.contextMenu) {
                    state.viewState.contextMenu.remove();
                    state.viewState.contextMenu = null;
                }
            }, CLOSE_DELAY);
        }
        else {
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
        const { clientX, clientY, target } = contextClick;
        const { H } = state;
        close(state);
        state.elementInfoContinuation = ({ innerText, noSuchElement }) => {
            if (!noSuchElement) {
                state.elementInfoContinuation = null;
                index_js_1.openModal({ modal: { type: 'infobox', message: innerText, title: 'Text from page:' } }, state);
            }
        };
        H({
            type: 'getElementInfo',
            synthetic: true,
            data: {
                innerText: true,
                target,
                clientX, clientY
            }
        });
    }
    function copyLink(click, state) {
        const contextClick = state.viewState.contextMenuClick;
        const { clientX, clientY, target } = contextClick;
        const { H } = state;
        close(state);
        state.elementInfoContinuation = ({ attributes, noSuchElement }) => {
            if (!noSuchElement) {
                state.elementInfoContinuation = null;
                index_js_1.openModal({ modal: { type: 'infobox', message: attributes.href, title: 'Text from page:' } }, state);
            }
        };
        H({
            type: 'getElementInfo',
            synthetic: true,
            data: {
                closest: 'a[href]',
                attributes: ['href'],
                target,
                clientX, clientY
            }
        });
    }
    function paste(click, state) {
        close(state);
        const pasteData = prompt("Enter text to paste");
        const input = state.viewState.shouldHaveFocus;
        if (!input)
            return;
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
            event: { paste: true, simulated: true }
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
        downloader.download = `${fileName}.png`;
        document.body.appendChild(downloader);
        downloader.click();
        downloader.remove();
    }
    function reload( /*click, state*/) {
        const goButton = document.querySelector('form.url button.go');
        goButton.click();
    }
    function openInNewTab(click, state) {
        const contextClick = state.viewState.contextMenuClick;
        const { target, pageX, pageY, clientX, clientY } = contextClick;
        const { H } = state;
        state.viewState.killNextMouseReleased = false;
        if (common_js_9.deviceIsMobile()) {
            // we need to get the URL of the target link 
            // then use 
            // state.createTab(click, url);
            state.elementInfoContinuation = ({ attributes, noSuchElement }) => {
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
                    clientX, clientY
                }
            });
        }
        else {
            H({
                type: 'pointerdown',
                button: 0,
                ctrlKey: true,
                target,
                pageX, pageY,
                clientX, clientY,
                noShot: true
            });
            H({
                type: 'pointerup',
                button: 0,
                ctrlKey: true,
                target,
                pageX, pageY,
                clientX, clientY
            });
        }
        close(state);
    }
    function newBrowserContextAndTab(click, state) {
        const { H } = state;
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
            const { H } = state;
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
            const { H } = state;
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
    return {
        setters: [
            function (common_js_9_1) {
                common_js_9 = common_js_9_1;
            },
            function (r_js_9_1) {
                r_js_9 = r_js_9_1;
            },
            function (index_js_1_1) {
                index_js_1 = index_js_1_1;
            }
        ],
        execute: function () {
            CLOSE_DELAY = 222;
            SHORT_CUT = 'Ctrl+Shift+J';
            //const FUNC = e => console.log("Doing it", e);
            CONTEXT_MENU = {
                'page': [
                    {
                        title: 'Open link in new tab',
                        shortCut: SHORT_CUT,
                        func: openInNewTab,
                    },
                    {
                        title: 'Save screenshot',
                        shortCut: SHORT_CUT,
                        func: download
                    },
                    {
                        title: 'Reload',
                        shortCut: SHORT_CUT,
                        func: reload
                    },
                    {
                        title: 'Copy text from here',
                        shortCut: SHORT_CUT,
                        func: copy,
                        hr: true
                    },
                    {
                        title: 'Copy link address from here',
                        shortCut: SHORT_CUT,
                        func: copyLink,
                    },
                    {
                        title: 'Paste text',
                        shortCut: SHORT_CUT,
                        func: paste
                    },
                    //  This is blocked (apparently) on: https://bugs.chromium.org/p/chromium/issues/detail?id=1015260
                    {
                        title: 'New incognito tab',
                        shortCut: SHORT_CUT,
                        func: newBrowserContextAndTab,
                        hr: true,
                    },
                    {
                        title: 'Clear history',
                        shortCut: SHORT_CUT,
                        func: clearHistoryAndCacheLeaveCookies,
                        hr: true,
                    },
                    {
                        title: 'Wipe everything',
                        shortCut: SHORT_CUT,
                        func: clearBrowsingData,
                    },
                ],
            };
        }
    };
});
System.register("voodoo/src/subviews/index", ["voodoo/src/subviews/controls", "voodoo/src/subviews/omniBox", "voodoo/src/subviews/tabList", "voodoo/src/subviews/loadingIndicator", "voodoo/src/subviews/bandwidthIndicator", "voodoo/src/subviews/pluginsMenuButton", "voodoo/src/subviews/pluginsMenu", "voodoo/src/subviews/other", "voodoo/src/subviews/contextMenu"], function (exports_28, context_28) {
    "use strict";
    var __moduleName = context_28 && context_28.id;
    function exportStar_1(m) {
        var exports = {};
        for (var n in m) {
            if (n !== "default") exports[n] = m[n];
        }
        exports_28(exports);
    }
    return {
        setters: [
            function (controls_js_2_1) {
                exportStar_1(controls_js_2_1);
            },
            function (omniBox_js_2_1) {
                exportStar_1(omniBox_js_2_1);
            },
            function (tabList_js_2_1) {
                exportStar_1(tabList_js_2_1);
            },
            function (loadingIndicator_js_2_1) {
                exportStar_1(loadingIndicator_js_2_1);
            },
            function (bandwidthIndicator_js_1_1) {
                exportStar_1(bandwidthIndicator_js_1_1);
            },
            function (pluginsMenuButton_js_3_1) {
                exportStar_1(pluginsMenuButton_js_3_1);
            },
            function (pluginsMenu_js_1_1) {
                exportStar_1(pluginsMenu_js_1_1);
            },
            function (other_js_1_1) {
                exportStar_1(other_js_1_1);
            },
            function (contextMenu_js_1_1) {
                exportStar_1(contextMenu_js_1_1);
            }
        ],
        execute: function () {
        }
    };
});
System.register("voodoo/node_modules/jtype-system/t", [], function (exports_29, context_29) {
    "use strict";
    var BROWSER_SIDE, BuiltIns, DEBUG, SEALED_DEFAULT, isNone, typeCache;
    var __moduleName = context_29 && context_29.id;
    function T(parts, ...vals) {
        const cooked = vals.reduce((prev, cur, i) => prev + cur + parts[i + 1], parts[0]);
        const typeName = cooked;
        if (!typeCache.has(typeName))
            throw new TypeError(`Cannot use type ${typeName} before it is defined.`);
        return typeCache.get(typeName).type;
    }
    exports_29("T", T);
    function partialMatch(type, instance) {
        return validate(type, instance, { partial: true });
    }
    function validate(type, instance, { partial: partial = false } = {}) {
        guardType(type);
        guardExists(type);
        const typeName = type.name;
        const { spec, kind, help, verify, verifiers, sealed } = typeCache.get(typeName);
        const specKeyPaths = spec ? allKeyPaths(spec).sort() : [];
        const specKeyPathSet = new Set(specKeyPaths);
        const bigErrors = [];
        switch (kind) {
            case "def": {
                let allValid = true;
                if (spec) {
                    const keyPaths = partial ? allKeyPaths(instance, specKeyPathSet) : specKeyPaths;
                    allValid = !isNone(instance) && keyPaths.every(kp => {
                        // Allow lookup errors if the type match for the key path can include None
                        const { resolved, errors: lookupErrors } = lookup(instance, kp, () => checkTypeMatch(lookup(spec, kp).resolved, T `None`));
                        bigErrors.push(...lookupErrors);
                        if (lookupErrors.length)
                            return false;
                        const keyType = lookup(spec, kp).resolved;
                        if (!keyType || !(keyType instanceof Type)) {
                            bigErrors.push({
                                error: `Key path '${kp}' is not present in the spec for type '${typeName}'`
                            });
                            return false;
                        }
                        const { valid, errors: validationErrors } = validate(keyType, resolved);
                        bigErrors.push(...validationErrors);
                        return valid;
                    });
                }
                let verified = true;
                if (partial && !spec && !!verify) {
                    throw new TypeError(`Type checking with option 'partial' is not a valid option for types that` +
                        ` only use a verify function but have no spec`);
                }
                else if (verify) {
                    try {
                        verified = verify(instance);
                        if (!verified) {
                            if (verifiers) {
                                throw {
                                    error: `Type ${typeName} value '${JSON.stringify(instance)}' violated at least 1 verify function in:\n${verifiers.map(f => '\t' + (f.help || '') + ' (' + f.verify.toString() + ')').join('\n')}`
                                };
                            }
                            else if (type.isSumType) {
                                throw {
                                    error: `Value '${JSON.stringify(instance)}' did not match any of: ${[...type.types.keys()].map(t => t.name)}`,
                                    verify, verifiers
                                };
                            }
                            else {
                                let helpMsg = '';
                                if (help) {
                                    helpMsg = `Help: ${help}. `;
                                }
                                throw { error: `${helpMsg}Type ${typeName} Value '${JSON.stringify(instance)}' violated verify function in: ${verify.toString()}` };
                            }
                        }
                    }
                    catch (e) {
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
                        }
                        else {
                            const errorKeys = [];
                            const tkp = new Set(type_key_paths);
                            for (const k of all_key_paths) {
                                if (!tkp.has(k)) {
                                    errorKeys.push({
                                        error: `Key path '${k}' is not in the spec for type ${typeName}`
                                    });
                                }
                            }
                            if (errorKeys.length) {
                                bigErrors.push(...errorKeys);
                            }
                        }
                    }
                }
                return { valid: allValid && verified && sealValid, errors: bigErrors, partial };
            }
            case "defCollection": {
                const { valid: containerValid, errors: containerErrors } = validate(spec.container, instance);
                let membersValid = true;
                let verified = true;
                bigErrors.push(...containerErrors);
                if (partial) {
                    throw new TypeError(`Type checking with option 'partial' is not a valid option for Collection types`);
                }
                else {
                    if (containerValid) {
                        membersValid = [...instance].every(member => {
                            const { valid, errors } = validate(spec.member, member);
                            bigErrors.push(...errors);
                            return valid;
                        });
                    }
                    if (verify) {
                        try {
                            verified = verify(instance);
                        }
                        catch (e) {
                            bigErrors.push(e);
                            verified = false;
                        }
                    }
                }
                return { valid: containerValid && membersValid && verified, errors: bigErrors };
            }
            default: {
                throw new TypeError(`Checking for type kind ${kind} is not yet implemented.`);
            }
        }
    }
    function check(...args) {
        return validate(...args).valid;
    }
    function lookup(obj, keyPath, canBeNone) {
        if (isNone(obj))
            throw new TypeError(`Lookup requires a non-unset object.`);
        if (!keyPath)
            throw new TypeError(`keyPath must not be empty`);
        const keys = keyPath.split(/\./g);
        const pathComplete = [];
        const errors = [];
        let resolved = obj;
        while (keys.length) {
            const nextKey = keys.shift();
            resolved = resolved[nextKey];
            pathComplete.push(nextKey);
            if ((resolved === null || resolved === undefined)) {
                if (keys.length) {
                    errors.push({
                        error: `Lookup on key path '${keyPath}' failed at '` +
                            pathComplete.join('.') +
                            `' when ${resolved} was found at '${nextKey}'.`
                    });
                }
                else if (!!canBeNone && canBeNone()) {
                    resolved = undefined;
                }
                else {
                    errors.push({
                        error: `Resolution on key path '${keyPath}' failed` +
                            `when ${resolved} was found at '${nextKey}' and the Type of this` +
                            `key's value cannot be None.`
                    });
                }
                break;
            }
        }
        return { resolved, errors };
    }
    function checkTypeMatch(typeA, typeB) {
        guardType(typeA);
        guardExists(typeA);
        guardType(typeB);
        guardExists(typeB);
        if (typeA === typeB) {
            return true;
        }
        else if (typeA.isSumType && typeA.types.has(typeB)) {
            return true;
        }
        else if (typeB.isSumType && typeB.types.has(typeA)) {
            return true;
        }
        else if (typeA.name.startsWith('?') && typeB == T `None`) {
            return true;
        }
        else if (typeB.name.startsWith('?') && typeA == T `None`) {
            return true;
        }
        if (typeA.name.startsWith('>') || typeB.name.startsWith('>')) {
            console.error(new Error(`Check type match has not been implemented for derived//sub types yet.`));
        }
        return false;
    }
    function option(type) {
        return T `?${type.name}`;
    }
    function sub(type) {
        return T `>${type.name}`;
    }
    function defSub(type, spec, { verify: verify = undefined, help: help = '' } = {}, name = '') {
        guardType(type);
        guardExists(type);
        let verifiers;
        if (!verify) {
            verify = () => true;
        }
        if (type.native) {
            verifiers = [{ help, verify }];
            verify = i => i instanceof type.native;
            const helpMsg = `Needs to be of type ${type.native.name}. ${help || ''}`;
            verifiers.push({ help: helpMsg, verify });
        }
        const newType = def(`${name}>${type.name}`, spec, { verify, help, verifiers });
        return newType;
    }
    function defEnum(name, ...values) {
        if (!name)
            throw new TypeError(`Type must be named.`);
        guardRedefinition(name);
        const valueSet = new Set(values);
        const verify = i => valueSet.has(i);
        const help = `Value of Enum type ${name} must be one of ${values.join(',')}`;
        return def(name, null, { verify, help });
    }
    function exists(name) {
        return typeCache.has(name);
    }
    function guardRedefinition(name) {
        if (exists(name))
            throw new TypeError(`Type ${name} cannot be redefined.`);
    }
    function allKeyPaths(o, specKeyPaths) {
        const isTypeSpec = !specKeyPaths;
        const keyPaths = new Set();
        return recurseObject(o, keyPaths, '');
        function recurseObject(o, keyPathSet, lastLevel = '') {
            const levelKeys = Object.getOwnPropertyNames(o);
            const keyPaths = levelKeys
                .map(k => lastLevel + (lastLevel.length ? '.' : '') + k);
            levelKeys.forEach((k, i) => {
                const v = o[k];
                if (isTypeSpec) {
                    if (v instanceof Type) {
                        keyPathSet.add(keyPaths[i]);
                    }
                    else if (typeof v == "object") {
                        if (!Array.isArray(v)) {
                            recurseObject(v, keyPathSet, keyPaths[i]);
                        }
                        else {
                            DEBUG && console.warn({ o, v, keyPathSet, lastLevel });
                            throw new TypeError(`We don't support Types that use Arrays as structure, just yet.`);
                        }
                    }
                    else {
                        throw new TypeError(`Spec cannot contain leaf values that are not valid Types`);
                    }
                }
                else {
                    if (specKeyPaths.has(keyPaths[i])) {
                        keyPathSet.add(keyPaths[i]);
                    }
                    else if (typeof v == "object") {
                        if (!Array.isArray(v)) {
                            recurseObject(v, keyPathSet, keyPaths[i]);
                        }
                        else {
                            v.forEach((item, index) => recurseObject(item, keyPathSet, keyPaths[i] + '.' + index));
                            //throw new TypeError(`We don't support Instances that use Arrays as structure, just yet.`); 
                        }
                    }
                    else {
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
        return T.def(`?${typeName}`, null, { verify: i => isUnset(i) || T.check(type, i) });
    }
    function maybe(type) {
        try {
            return defOption(type);
        }
        catch (e) {
            // console.log(`Option Type ${type.name} already declared.`, e);
        }
        return T `?${type.name}`;
    }
    function verify(...args) { return check(...args); }
    function defCollection(name, { container, member }, { sealed: sealed = SEALED_DEFAULT, verify: verify = undefined } = {}) {
        if (!name)
            throw new TypeError(`Type must be named.`);
        if (!container || !member)
            throw new TypeError(`Type must be specified.`);
        guardRedefinition(name);
        const kind = 'defCollection';
        const t = new Type(name);
        const spec = { kind, spec: { container, member }, verify, sealed, type: t };
        typeCache.set(name, spec);
        return t;
    }
    function defTuple(name, { pattern }) {
        if (!name)
            throw new TypeError(`Type must be named.`);
        if (!pattern)
            throw new TypeError(`Type must be specified.`);
        const kind = 'def';
        const specObj = {};
        pattern.forEach((type, key) => specObj[key] = type);
        const t = new Type(name);
        const spec = { kind, spec: specObj, type: t };
        typeCache.set(name, spec);
        return t;
    }
    function Type(name, mods = {}) {
        if (!new.target)
            throw new TypeError(`Type with new only.`);
        Object.defineProperty(this, 'name', { get: () => name });
        this.typeName = name;
        if (mods.types) {
            const { types } = mods;
            const typeSet = new Set(types);
            Object.defineProperty(this, 'isSumType', { get: () => true });
            Object.defineProperty(this, 'types', { get: () => typeSet });
        }
        if (mods.native) {
            const { native } = mods;
            Object.defineProperty(this, 'native', { get: () => native });
        }
    }
    function def(name, spec, { help: help = '', verify: verify = undefined, sealed: sealed = undefined, types: types = undefined, verifiers: verifiers = undefined, native: native = undefined } = {}) {
        if (!name)
            throw new TypeError(`Type must be named.`);
        guardRedefinition(name);
        if (name.startsWith('?')) {
            if (spec) {
                throw new TypeError(`Option type can not have a spec.`);
            }
            if (!verify(null)) {
                throw new TypeError(`Option type must be OK to be unset.`);
            }
        }
        const kind = 'def';
        if (sealed === undefined) {
            sealed = true;
        }
        const t = new Type(name, { types, native });
        const cache = { spec, kind, help, verify, verifiers, sealed, types, native, type: t };
        typeCache.set(name, cache);
        return t;
    }
    function defOr(name, ...types) {
        return T.def(name, null, { types, verify: i => types.some(t => check(t, i)) });
    }
    function guard(type, instance) {
        guardType(type);
        guardExists(type);
        const { valid, errors } = validate(type, instance);
        if (!valid)
            throw new TypeError(`Type ${type} requested, but item is not of that type: ${errors.join(', ')}`);
    }
    function guardType(t) {
        //console.log(t);
        if (!(t instanceof Type))
            throw new TypeError(`Type must be a valid Type object.`);
    }
    function guardExists(t) {
        const name = originalName(t);
        if (!exists(name))
            throw new TypeError(`Type must exist. Type ${name} has not been defined.`);
    }
    function errors(...args) {
        return validate(...args).errors;
    }
    function mapBuiltins() {
        BuiltIns.forEach(t => def(originalName(t), null, { native: t, verify: i => originalName(i.constructor) === originalName(t) }));
        BuiltIns.forEach(t => defSub(T `${originalName(t)}`));
    }
    function defineSpecials() {
        T.def(`Any`, null, { verify: () => true });
        T.def(`Some`, null, { verify: i => !isUnset(i) });
        T.def(`None`, null, { verify: i => isUnset(i) });
        T.def(`Function`, null, { verify: i => i instanceof Function });
        T.def(`Integer`, null, { verify: i => Number.isInteger(i) });
        T.def(`Array`, null, { verify: i => Array.isArray(i) });
        T.def(`Iterable`, null, { verify: i => i[Symbol.iterator] instanceof Function });
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
    return {
        setters: [],
        execute: function () {
            exports_29("BROWSER_SIDE", BROWSER_SIDE = (() => { try {
                return self.DOMParser && true;
            }
            catch (e) {
                return false;
            } })());
            BuiltIns = [
                Symbol, Boolean, Number, String, Object, Set, Map, WeakMap, WeakSet,
                Uint8Array, Uint16Array, Uint32Array, Float32Array, Float64Array,
                Int8Array, Int16Array, Int32Array,
                Uint8ClampedArray,
                ...(BROWSER_SIDE ? [
                    Node, NodeList, Element, HTMLElement, Blob, ArrayBuffer,
                    FileList, Text, HTMLDocument, Document, DocumentFragment,
                    Error, File, Event, EventTarget, URL
                ] : [Buffer])
            ];
            DEBUG = false;
            SEALED_DEFAULT = true;
            isNone = instance => instance == null || instance == undefined;
            typeCache = new Map();
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
            T.errors = errors;
            // debug
            if (DEBUG) {
                self.T = T;
                self.typeCache = typeCache;
            }
            T[Symbol.for('jtype-system.typeCache')] = typeCache;
            defineSpecials();
            mapBuiltins();
            Type.prototype.toString = function () {
                return `${this.typeName} Type`;
            };
        }
    };
});
System.register("voodoo/node_modules/maskingtape.css/externals", ["voodoo/node_modules/jtype-system/t"], function (exports_30, context_30) {
    "use strict";
    var t_js_2;
    var __moduleName = context_30 && context_30.id;
    return {
        setters: [
            function (t_js_2_1) {
                t_js_2 = t_js_2_1;
            }
        ],
        execute: function () {
            exports_30("T", t_js_2.T);
            exports_30("default", { T: t_js_2.T });
        }
    };
});
System.register("voodoo/node_modules/maskingtape.css/c3s", ["voodoo/node_modules/maskingtape.css/externals"], function (exports_31, context_31) {
    "use strict";
    var FULL_LABEL, LABEL_LEN, LABEL, PREFIX_LEN, PREFIX_BASE, externals_js_1, counter, c3s;
    var __moduleName = context_31 && context_31.id;
    function generateUniquePrefix() {
        counter += 3;
        const number = counter * Math.random() * performance.now() * (+new Date);
        const prefixString = (LABEL + number.toString(PREFIX_BASE).replace(/\./, '')).slice(0, PREFIX_LEN);
        return { prefix: [prefixString] };
    }
    exports_31("generateUniquePrefix", generateUniquePrefix);
    function extendPrefix({ prefix: existingPrefix }) {
        externals_js_1.T.guard(externals_js_1.T `Prefix`, existingPrefix);
        existingPrefix.push(generateUniquePrefix().prefix[0]);
    }
    exports_31("extendPrefix", extendPrefix);
    function findStyleSheet(link) {
        let ss;
        const ssFound = Array.from(document.styleSheets).find(({ ownerNode }) => ownerNode == link);
        if (!ssFound) {
            console.warn("last error", link);
            throw new TypeError(`Cannot find sheet for link`);
        }
        else {
            ss = ssFound;
        }
        if (ss instanceof CSSStyleSheet) {
            return ss;
        }
    }
    exports_31("findStyleSheet", findStyleSheet);
    function findStyleLink(url) {
        let ss;
        url = getURL(url);
        const ssFound = Array.from(document.styleSheets).find(({ href }) => href == url);
        if (!ssFound) {
            const qsFound = document.querySelector(`link[href="${url}"]`);
            if (qsFound) {
                ss = qsFound;
            }
        }
        else {
            ss = ssFound.ownerNode;
        }
        if (ss instanceof HTMLLinkElement) {
            return ss;
        }
    }
    exports_31("findStyleLink", findStyleLink);
    function isStyleSheetAccessible(ss) {
        try {
            Array.from(ss.sheet.cssRules);
            return true;
        }
        catch (e) {
            return false;
        }
    }
    exports_31("isStyleSheetAccessible", isStyleSheetAccessible);
    // it may actually be better to clone the sheet using
    // a style element rather than cloning using the link 
    // which may both rely on and recause a network request
    function cloneStyleSheet(ss) {
        const newNode = ss.cloneNode(true);
        newNode.dataset.scoped = true;
        ss.replaceWith(newNode);
        return newNode;
    }
    exports_31("cloneStyleSheet", cloneStyleSheet);
    function prefixAllRules(ss, prefix, combinator = ' ') {
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
            }
            else if (lastRule.type == CSSRule.MEDIA_RULE) {
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
                }
                catch (e) {
                    console.log(e, lastRule.cssText, lastRule, ss);
                    //throw e;
                }
            }
            else {
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
    exports_31("prefixAllRules", prefixAllRules);
    function prefixStyleRule(lastRule, ss, lastRuleIndex, prefix, combinator) {
        let newRuleText = lastRule.cssText;
        const { selectorText } = lastRule;
        const selectors = selectorText.split(/\s*,\s*/g);
        const modifiedSelectors = selectors.map(sel => {
            // we also need to insert prefix BEFORE any descendent combinators
            const firstDescendentIndex = sel.indexOf(' ');
            if (firstDescendentIndex > -1) {
                const firstSel = sel.slice(0, firstDescendentIndex);
                const restSel = sel.slice(firstDescendentIndex);
                // we also need to insert prefix BEFORE any pseudo selectors 
                // NOTE: the following indexOf test will BREAK if selector contains a :
                // such as [ns\\:name="scoped-name"]
                const firstPseudoIndex = firstSel.indexOf(':');
                if (firstPseudoIndex > -1) {
                    const [pre, post] = [firstSel.slice(0, firstPseudoIndex), firstSel.slice(firstPseudoIndex)];
                    return `${pre}${prefix}${post}${restSel}` + (combinator == '' ? '' : `, ${prefix}${combinator}${sel}`);
                }
                else
                    return `${firstSel}${prefix}${restSel}` + (combinator == '' ? '' : `, ${prefix}${combinator}${sel}`);
            }
            else {
                const firstPseudoIndex = sel.indexOf(':');
                if (firstPseudoIndex > -1) {
                    const [pre, post] = [sel.slice(0, firstPseudoIndex), sel.slice(firstPseudoIndex)];
                    return `${pre}${prefix}${post}` + (combinator == '' ? '' : `, ${prefix}${combinator}${sel}`);
                }
                else
                    return `${sel}${prefix}` + (combinator == '' ? '' : `, ${prefix}${combinator}${sel}`);
            }
        });
        const ruleBlock = newRuleText.slice(newRuleText.indexOf('{'));
        const newRuleSelectorText = modifiedSelectors.join(', ');
        newRuleText = `${newRuleSelectorText} ${ruleBlock}`;
        ss.deleteRule(lastRuleIndex);
        try {
            let index = 0;
            if (ss.cssRules.length && ss.cssRules[0].type == CSSRule.NAMESPACE_RULE) {
                index = 1;
            }
            ss.insertRule(newRuleText, index);
        }
        catch (e) {
            console.log(e, newRuleText, selectorText, lastRuleIndex, ss);
            //throw e;
        }
    }
    async function scopeStyleSheet(url, prefix, combinator = ' ') {
        const ss = findStyleLink(url);
        if (!ss) {
            throw new TypeError(`Stylesheet with URI ${url} cannot be found.`);
        }
        const isKnownAccessible = isStyleSheetAccessible(ss);
        if (!isKnownAccessible) {
            return new Promise(res => {
                ss.onload = () => {
                    const isAccessible = isStyleSheetAccessible(ss);
                    if (!isAccessible) {
                        throw new TypeError(`Non CORS sheet at ${url} cannot have its rules accessed so cannot be scoped.`);
                    }
                    const scopedSS = cloneStyleSheet(ss);
                    scopedSS.onload = () => {
                        const sheet = findStyleSheet(scopedSS);
                        prefixAllRules(sheet, prefix, combinator);
                    };
                    res(scopedSS);
                };
            });
        }
        else {
            const scopedSS = cloneStyleSheet(ss);
            return new Promise(res => {
                scopedSS.onload = () => {
                    try {
                        const sheet = findStyleSheet(scopedSS);
                        prefixAllRules(sheet, prefix, combinator);
                    }
                    catch (e) {
                        console.warn(e);
                    }
                    res(scopedSS);
                };
            });
        }
    }
    exports_31("scopeStyleSheet", scopeStyleSheet);
    function scope(url) {
        const prefix = generateUniquePrefix().prefix[0];
        return { scopedSheet: scopeStyleSheet(url, '.' + prefix), prefix };
    }
    exports_31("scope", scope);
    // used when the first scoping didn't work and we need to add more prefix to increase specificity
    // if this ever occurs
    // which is why we use '' combinator to add to the prefix of the already scoped sheet
    function rescope({ scopedSheet, prefix: existingPrefix }) {
        const prefix = generateUniquePrefix().prefix[0];
        const combinator = '';
        prefixAllRules(scopedSheet, prefix, combinator);
        return { scopedSheet, prefix: prefix + existingPrefix };
    }
    exports_31("rescope", rescope);
    function getURL(uri) {
        const link = document.createElement('a');
        link.href = uri;
        return link.href;
    }
    exports_31("getURL", getURL);
    return {
        setters: [
            function (externals_js_1_1) {
                externals_js_1 = externals_js_1_1;
            }
        ],
        execute: function () {
            FULL_LABEL = 'c3s-unique-';
            LABEL_LEN = 3;
            LABEL = FULL_LABEL.slice(0, LABEL_LEN);
            PREFIX_LEN = 10 + LABEL_LEN;
            PREFIX_BASE = 36;
            externals_js_1.T.defCollection("Prefix", {
                container: externals_js_1.T `Array`,
                member: externals_js_1.T `String`
            }, { verify: i => i.length > 0 });
            counter = 1;
            c3s = { scope, rescope };
            exports_31("default", c3s);
        }
    };
});
System.register("voodoo/node_modules/style.dss/monitorChanges", [], function (exports_32, context_32) {
    "use strict";
    var InsertListeners, RemovedListeners, inserted, removed, monitoring;
    var __moduleName = context_32 && context_32.id;
    function addInsertListener(listener) {
        if (inserted.has(listener))
            return;
        InsertListeners.push(listener);
        inserted.add(listener);
    }
    exports_32("addInsertListener", addInsertListener);
    function addRemovedListener(listener) {
        if (removed.has(listener))
            return;
        RemovedListeners.push(listener);
        removed.add(listener);
    }
    exports_32("addRemovedListener", addRemovedListener);
    function monitorChanges() {
        if (monitoring)
            return;
        // demo of watching for any new nodes that declare stylists
        const mo = new MutationObserver((mutations) => {
            let AddedElements = [];
            let RemovedElements = [];
            for (const mutation of mutations) {
                const addedElements = Array.from(mutation.addedNodes);
                const removedElements = Array.from(mutation.removedNodes);
                addedElements.forEach(el => {
                    if (!(el instanceof HTMLElement))
                        return;
                    if (el.matches('[stylist]')) {
                        AddedElements.push(el);
                    }
                    AddedElements.push(...el.querySelectorAll('[stylist]'));
                });
                removedElements.forEach(el => {
                    if (!(el instanceof HTMLElement))
                        return;
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
                    }
                    catch (e) {
                        console.warn("Removed listener error", e, listener);
                    }
                }
            }
            if (AddedElements.length) {
                for (const listener of InsertListeners) {
                    try {
                        listener(...AddedElements);
                    }
                    catch (e) {
                        console.warn("Insert listener error", e, listener);
                    }
                }
            }
        });
        mo.observe(document.documentElement, { childList: true, subtree: true });
        monitoring = true;
    }
    exports_32("monitorChanges", monitorChanges);
    return {
        setters: [],
        execute: function () {
            InsertListeners = [];
            RemovedListeners = [];
            inserted = new Set();
            removed = new Set();
            monitoring = false;
        }
    };
});
System.register("voodoo/node_modules/style.dss/index", ["voodoo/node_modules/maskingtape.css/c3s", "voodoo/node_modules/style.dss/monitorChanges"], function (exports_33, context_33) {
    "use strict";
    var c3s_js_1, monitorChanges_js_1, stylistFunctions, mappings, memory, initialized;
    var __moduleName = context_33 && context_33.id;
    function setState(newState) {
        const clonedState = clone(newState);
        Object.assign(memory.state, clonedState);
    }
    exports_33("setState", setState);
    function restyleElement(el) {
        if (!el)
            return;
        el.classList.forEach(className => className.startsWith('c3s') && restyleClass(className));
    }
    exports_33("restyleElement", restyleElement);
    function restyleClass(className) {
        const { element, stylist } = mappings.get(className);
        associate(className, element, stylist, memory.state);
    }
    exports_33("restyleClass", restyleClass);
    function restyleAll() {
        mappings.forEach(({ element, stylist }, className) => {
            associate(className, element, stylist, memory.state);
        });
    }
    exports_33("restyleAll", restyleAll);
    function initializeDSS(state, functionsObject) {
        setState(state);
        /**
          to REALLY prevent FOUC put this style tag BEFORE any DSS-styled markup
          and before any scripts that add markup,
          and before the initializeDSS call
        **/
        if (!document.querySelector('[data-role="prevent-fouc"]')) {
            document.head.insertAdjacentHTML('beforeend', `
      <style data-role="prevent-fouc">
        [stylist]:not([associated]) {
          display: none !important;
        }
      </style>
    `);
        }
        addMoreStylistFunctions(functionsObject);
        monitorChanges_js_1.addInsertListener(associateStylistFunctions);
        monitorChanges_js_1.addRemovedListener(unassociateStylistFunctions);
        monitorChanges_js_1.monitorChanges();
        if (!initialized) {
            const initialEls = Array.from(document.querySelectorAll('[stylist]'));
            associateStylistFunctions(...initialEls);
            initialized = true;
        }
        return;
        function associateStylistFunctions(...els) {
            els = els.filter(el => el.hasAttribute('stylist'));
            if (els.length == 0)
                return;
            for (const el of els) {
                const stylistNames = (el.getAttribute('stylist') || '').split(/\s+/g);
                for (const stylistName of stylistNames) {
                    const stylist = stylistFunctions.get(stylistName);
                    if (!stylist)
                        throw new TypeError(`Stylist named by ${stylistName} is unknown.`);
                    const className = randomClass();
                    el.classList.add(className);
                    associate(className, el, stylist, state);
                }
            }
        }
    }
    exports_33("initializeDSS", initializeDSS);
    // an object whose properties are functions that are stylist functions
    function addMoreStylistFunctions(functionsObject) {
        const toRegister = [];
        for (const funcName of Object.keys(functionsObject)) {
            const value = functionsObject[funcName];
            if (typeof value !== "function")
                throw new TypeError("Functions object must only contain functions.");
            // this prevents a bug where we miss an existing style element in 
            // a check for a style element based on the stylist.name property
            if (value.name !== funcName)
                throw new TypeError(`Stylist function must be actual function named ${funcName} (it was ${value.name})`);
            // don't overwrite exisiting names
            if (!stylistFunctions.has(funcName)) {
                toRegister.push(() => stylistFunctions.set(funcName, value));
            }
        }
        while (toRegister.length)
            toRegister.pop()();
    }
    exports_33("addMoreStylistFunctions", addMoreStylistFunctions);
    function randomClass() {
        const { prefix: [className] } = c3s_js_1.generateUniquePrefix();
        return className;
    }
    function associate(className, element, stylist, state) {
        const styleText = (stylist(element, state) || '');
        let styleElement = document.head.querySelector(`style[data-prefix="${className}"]`);
        let changes = false;
        let prefixed = true;
        let prefixedStyleText;
        if (!mappings.has(className)) {
            mappings.set(className, { element, stylist });
        }
        if (!styleElement) {
            prefixed = false;
            const styleMarkup = `
      <style data-stylist="${stylist.name}" data-prefix="${className}">
        ${styleText}
      </style>
    `;
            document.head.insertAdjacentHTML('beforeend', styleMarkup);
            styleElement = document.head.querySelector(`style[data-prefix="${className}"]`);
        }
        else {
            if (styleElement instanceof HTMLStyleElement) {
                prefixedStyleText = Array.from(styleElement.sheet.cssRules)
                    .filter(rule => !rule.parentRule)
                    .map(rule => rule.cssText)
                    .join('\n');
            }
        }
        // I don't know why this has to happen, but it does
        if (styleElement.innerHTML != styleText) {
            styleElement.innerHTML = styleText;
            changes = true;
        }
        // only prefix if we have not already
        if (!prefixed || changes) {
            if (styleElement instanceof HTMLStyleElement) {
                const styleSheet = styleElement.sheet;
                c3s_js_1.prefixAllRules(styleSheet, "." + className, '');
                element.setAttribute('associated', 'true');
                prefixedStyleText = Array.from(styleSheet.cssRules)
                    .filter(rule => !rule.parentRule)
                    .map(rule => rule.cssText)
                    .join('\n');
                styleElement.innerHTML = prefixedStyleText;
            }
        }
    }
    function disassociate(className, element) {
        const styleSheet = document.querySelector(`style[data-prefix="${className}"]`);
        mappings.delete(className);
        if (styleSheet) {
            element.classList.remove(className);
            styleSheet.remove();
        }
    }
    function unassociateStylistFunctions(...els) {
        els = els.filter(el => el.hasAttribute('stylist'));
        if (els.length == 0)
            return;
        for (const el of els) {
            el.classList.forEach(className => className.startsWith('c3s') && disassociate(className, el));
        }
    }
    function clone(o) {
        return JSON.parse(JSON.stringify(o));
    }
    return {
        setters: [
            function (c3s_js_1_1) {
                c3s_js_1 = c3s_js_1_1;
            },
            function (monitorChanges_js_1_1) {
                monitorChanges_js_1 = monitorChanges_js_1_1;
            }
        ],
        execute: function () {
            stylistFunctions = new Map();
            mappings = new Map();
            memory = { state: {} };
            initialized = false;
        }
    };
});
System.register("voodoo/src/styles", ["voodoo/node_modules/style.dss/index", "voodoo/src/common"], function (exports_34, context_34) {
    "use strict";
    var index_js_2, common_js_10, stylists, dss;
    var __moduleName = context_34 && context_34.id;
    // stylists
    function styleDocument( /*el, state*/) {
        return `
      :root {
        height: 100%;
        display: flex;
      }

      :root body {
        width: 100%;
        max-height: 100%;
        box-sizing: border-box;
        margin: 0;
      }

      nav input[type="text"], nav input[type="url"], 
      nav input[type="search"], nav input:not([type]), 
      nav button {
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
      }

      :root .debugBox,
      :root #debugBox {
        display: ${common_js_10.DEBUG.val >= common_js_10.DEBUG.high ? 'block' : 'none'};
      }

      :root input, :root button, :root select, :root textarea, :root [contenteditable] {
        font-family: system-ui, Arial, Helvetica, sans-serif, monospace, system;
      }
    `;
    }
    function styleVoodooMain(el, state) {
        return `
      main.voodoo {
        position: relative;
        display: grid;
        grid-template-areas:
          "targets targets targets targets targets"
          "bandwidth history url url plugins-menu-button"
          "viewport viewport viewport viewport viewport";
        grid-template-rows: auto auto 1fr;
        grid-template-columns: auto auto 1fr auto auto;
        height: 100%;
        width: 100%;
        overflow: hidden;
        transition: all 0.3s ease;
        background: snow;
        min-height: ${window.innerHeight - 4}px;
      }

      @media screen and (max-width: 600px) {
        main.voodoo {
          grid-template-areas:
            "targets targets targets targets"
            "url url url url"
            "viewport viewport viewport viewport"
            "bandwidth history history plugins-menu-button";
          grid-template-rows: auto auto 1fr auto;
          grid-template-columns: 1fr 1fr 1fr 1fr;
        }

        nav.controls.aux {
          display: flex; 
          justify-content: center;
        }
      }

      ${state.pluginsMenuActive ?
            `
          main.voodoo {
            transform: scale(0.75);
            filter: blur(8px);
            opacity: 0.8;
          }
        ` : ''}
    `;
    }
    function styleTabList( /*el, state*/) {
        return `
      nav ul {
      }

      nav ul li {
        display: inline-block;
        border-top-left-radius: 0.35rem;
        border-top-right-radius: 0.35rem;
        overflow: hidden;
      }

      nav ul li:not(.new):not(.active)::after {
        content: " ";
        border-right: thin solid;
        display: inline-block;
        position: absolute;
        height: 1.25rem;
        top: 0.38rem;
        right: 0;
      }

      nav.targets {
        position: relative;
        overflow: auto hidden;
        background: var(--lightgrey);
      }

      nav.targets::-webkit-scrollbar {
        display: none;
      }

      nav.targets ul {
        overflow: none;
        display: flex;
        flex-wrap: nowrap;
        min-width: 100%;
      }
    `;
    }
    function styleTabSelector( /*el, state*/) {
        return `
      li.tab-selector {
        display: inline-flex;
        align-items: center;
        box-sizing: border-box;
        max-width: 11rem;
        word-break: break-word;
        min-width: 100px;
        position: relative;
        height: 2rem;
        background: transparent;
        padding-left: 0.5rem;
      }
      
      li.tab-selector img.favicon {
        flex: 0 0;
        width: 20px;
        height: 20px;
        pointer-events: none;
      }

      li.tab-selector:not(.active) {
        opacity: 0.7;
      }

      li.tab-selector:not(.active):hover {
        opacity: 0.9;
        background: var(--white);
      }

      li.tab-selector.active {
        background: var(--white);
      }

      li.new {
        flex-shrink: 0;
        min-width: unset;
        border-top-left-radius: 0.35rem;
        border-top-right-radius: 0.35rem;
        overflow: hidden;
        margin: 0 0.35rem;
      }

      li.new button.new {
        display: inline-block;
        border-radius: 2rem;
        width: 1.7rem;
        height: 1.7rem;
        min-width: unset;
        background-image: url(./voodoo/asset-imports/nhsuk-icons/icon-plus.svg);
        background-size: 20px 20px;
        outline: none;
        border-color: transparent;
      }

      li.new button:hover, li.new button:active, li.new button:focus {
      }

      li.tab-selector button.close {
        position: absolute;
        right: 0.25rem;
        top: 0.25rem;
        height: 1.5rem;
        width: 1.5rem;
        z-index:2;
        text-align: center;
        padding: 0;
        background-image: url(./voodoo/asset-imports/nhsuk-icons/icon-close.svg);
        background-size: 61.8% 61.8%;
      }

      li.tab-selector button.close:hover,
      li.tab-selector button.close:active {
      }

      li.tab-selector:not(.active):hover,
      li.tab-selector:not(.active) a:focus {
      }

      li.tab-selector a {
        display: inline-block;
        box-sizing: border-box;
        width: 100%;
        height: 100%;
        overflow: hidden;
        text-decoration: none;
        vertical-align: middle;
        line-height: 2rem;
        white-space: nowrap;
        text-overflow: ellipsis;
        font-size: 0.85rem;
        padding-left: 0.35rem;
        padding-right: 1.65rem;
        outline: none;
        border-color: transparent;
      }
    `;
    }
    function styleNavControl( /*el, state*/) {
        return `
      @media screen and (max-width: 600px) {
        nav.aux {
          display: flex; 
          justify-content: center;
        }
      }

      nav {
        display: inline-flex;
        flex-basis: 2em;
        min-height: 2em;
        line-height: 2em;
        background: transparent;
      }
      
      nav:not(.targets) {
        padding: 0.35rem 0;
      }

      nav button {
        -webkit-user-select: none;
        -moz-user-select: none;
        user-select: none;
        -webkit-touch-callout: none;
        background-color: transparent;
      }

      nav.other {
        display: none;
      }

      nav.keyinput {
        grid-area: keyinput;
        position: absolute;
      }

      nav.loading {
        grid-area: loading;
      }

      nav.targets {
        grid-area: targets; 
      }
      
      nav.url {
        grid-area: url;
      }

      nav.history {
        grid-area: history;
      }

      nav form {
        display: flex;
      }

      ${common_js_10.isSafari() ?
            `nav button, nav input {
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
          border: 0;
          box-sizing: border-box;
          position: relative;
          top: -2px;
        }
        
        nav button:active {
          background: linear-gradient( to top, var(--white), var(--silver) );
        }

        nav button {
          background: linear-gradient( to bottom, var(--white), var(--silver) );
        }` : ''}

      nav form * {
      }

      nav aside.menu.disabled {
        display: none;
      }

      nav form.kbd-input {
        position: fixed;
        top: 5rem;
        left: 5rem;
        z-index: -1;
      }

      nav form.kbd-input input,
      nav form.kbd-input textarea {
        opacity: 0;
        border: 0;

        -webkit-user-select: none;
        -moz-user-select: none;
        user-select: none;
        -webkit-touch-callout: none;
      }
    `;
    }
    function styleOmniBox( /*el, state*/) {
        return `
      input:not(:focus), input[disabled] {
        background: var(--verylightgrey);
      }

      input:not(:focus):not([disabled]) {
        opacity: 0.7;
      }

      input:not(:focus):not([disabled]):hover {
        opacity: 0.9;
      }

      input:focus {
        outline: medium solid dodgerblue;
      }
      
      ${common_js_10.isSafari() ? `
          input {
            -webkit-appearance: none;
          }
        ` : ''}
    `;
    }
    function styleHistoryForm( /*el, state*/) {
        return `
      form button.back {
        background-image: url(./voodoo/asset-imports/nhsuk-icons/icon-chevron-left.svg);
      }

      form button.forward {
        background-image: url(./voodoo/asset-imports/nhsuk-icons/icon-chevron-right.svg);
      }
    `;
    }
    function styleURLForm( /*el, state*/) {
        return `
      form {
        position: relative;
        display: flex;
        flex: 1;
      }

      form input {
        width: 100%;
        outline: none;
        padding: 0 0.5rem 0 0.35rem;
      }

      form.url input:focus {
      }

      form.url input[disabled] {
        background: transparent;
      }

      form button.go {
        background-image: url(./voodoo/asset-imports/nhsuk-icons/icon-arrow-right-circle.svg);
        background-size: 20px 20px;
      }
    `;
    }
    function stylePluginsMenu(el, state) {
        return `
      nav.plugins-menu {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 10000;
        display: ${state.pluginsMenuActive ? 'block' : 'none'};
        box-sizing: border-box;
        max-height: 100vh;
        overflow: hidden;
      }

      nav > aside {
        scroll-behaviour: smooth;
        box-sizing: border-box;
        max-height: 100vh;
        overflow: auto;
        padding-bottom: 10rem;
      }

      nav > aside > article {
        padding: 2rem 2rem 5rem;
        background: rgba(225,220,220,0.3);
      }

      nav > aside > header {
        position: sticky;
        position: -webkit-sticky;
        top: 0;
        background: grey;
        box-shadow: 0 1px 1px 0 grey;
      }

      nav.plugins-menu h1.spread {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 0.5rem 0 1rem;
      }

      nav article {
        max-width: 70ch;
        margin: 0 auto;
      }

      nav ul {
        list-style-position: inside;
      }

      nav h1 {
        margin: 0;
      }

      nav li dl {
        display: inline-block;
        margin: 0;
        vertical-align: top;
        max-width: 85%;
      }

      nav dt h1 {
        display: inline;
      }

      nav details:not([open]) {
        display: inline;
      }

      nav button {
        background: var(--silver);
      }
    `;
    }
    function stylePluginsMenuButton( /*el, state*/) {
        return `
      nav.plugins-menu-button {
        grid-area: plugins-menu-button;
        position: relative;
        display: inline-flex;
      }

      nav button {
        font-weight: bold;
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
    function styleBandwidthIndicator( /*el, state*/) {
        return `
      aside.bandwidth-indicator {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        justify-content: center;
        grid-area: bandwidth;
        font-size: smaller;
        pointer-events: none;
        overflow: hidden;
        width: auto;
        color: var(--grey);
        background: transparent;
      }

      aside section.measure {

      }

      @media screen and (max-width: 600px) {
        aside.bandwidth-indicator {
          align-items: flex-start;
        }
      }
    `;
    }
    function styleLoadingIndicator( /*el, state*/) {
        return `
      aside.loading-indicator {
        grid-area: pending;
        position: absolute;
        pointer-events: none;
        height: 0.33rem;
        min-height: 5.333px;
        width: 100%;
        pointer-events: none;
        z-index: 2;
        overflow: hidden;
        top: -1px;
      }

      aside.loading-indicator progress {
        display: inline;
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
        width: 100%;
        height: 100%;
      }

      aside.loading-indicator progress[hidden] {
        display: none;
      }

      aside.loading-indicator progress::-webkit-progress-bar {
        background: silver;
      }

      aside.loading-indicator progress::-webkit-progress-value {
        background: dodgerblue;
      }
    `;
    }
    function styleTabViewport( /*el, state*/) {
        return `
      article.tab-viewport {
        grid-area: viewport;
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        -webkit-overflow-scrolling: touch;
        overflow: auto;
        border-top: thin solid gainsboro;
        border-bottom: thin solid gainsboro;
      }

      article.tab-viewport canvas,
      article.tab-viewport iframe {
        position: relative;
        display: block;
        width: 100%;
        height: 100%;
        flex-grow: 1;
        box-sizing: border-box;
      }

      article.tab-viewport iframe {
        border: 0;
        outline: 0;
      }

      * canvas {
        image-rendering: high-quality;
        -webkit-touch-callout: none;
      }
    `;
    }
    function styleSelectInput( /*el, state*/) {
        return `
      #selectinput {
        position: absolute;
        left: 50%;
        top: 30%;
        transform: translate(-50%,-50%);
        display: none;
        font-size: 2em;
      }

      #selectinput.open {
        display: inline;
        max-width: 90vw;
      }
    `;
    }
    function styleModals( /*el, state*/) {
        return `
      aside {
        position: absolute;
        display: flex;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 5;
        align-items: flex-start;
        justify-content: center;
        background: rgba(50,50,50,0.2);
      }

      aside:not(.active) {
        display: none;
      }

      aside > article:not(.open) {
        display: none; 
      }

      aside > article {
        z-index: 6;
        border: thin solid;
        background: whitesmoke;
        padding: 1rem 2rem;
        margin-top: 2.5rem;
        min-width: 150px;
        max-width: 666px;
        max-height: 80vh;
        word-break: break-word;
        overflow-x: hidden;
        overflow-y: auto;
        box-shadow: 1px 1px 1px grey;
      }

      * article.infobox textarea {
        display: block;
        background: white;
        font-family: monospace;
        width: 555px;
        min-height: 8em;
        max-width: 100%;
        max-height: 60vh;
        word-break: break-word;
        overflow-x: hidden;
        border: thin solid grey;
        overflow-y: auto;
        whitespace: pre;
        margin: 1em auto;
        resize: none;
      }
    `;
    }
    function styleContextMenu( /*el, state*/) {
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
        list-style-type: none;
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
    }
    return {
        setters: [
            function (index_js_2_1) {
                index_js_2 = index_js_2_1;
            },
            function (common_js_10_1) {
                common_js_10 = common_js_10_1;
            }
        ],
        execute: function () {
            exports_34("stylists", stylists = {
                styleDocument, styleVoodooMain,
                styleTabSelector, styleTabList,
                styleNavControl, styleOmniBox, styleURLForm,
                stylePluginsMenu,
                stylePluginsMenuButton, styleLoadingIndicator,
                styleHistoryForm,
                styleBandwidthIndicator,
                styleTabViewport,
                styleSelectInput,
                styleModals,
                styleContextMenu
            });
            exports_34("dss", dss = {
                restyleAll: index_js_2.restyleAll, restyleElement: index_js_2.restyleElement, initializeDSS: index_js_2.initializeDSS, setState: index_js_2.setState
            });
        }
    };
});
System.register("voodoo/src/view", ["voodoo/src/common", "voodoo/src/constructor", "voodoo/node_modules/dumbass/r", "voodoo/src/subviews/index", "voodoo/src/styles", "voodoo/src/transformEvent"], function (exports_35, context_35) {
    "use strict";
    var common_js_11, constructor_js_1, r_js_10, Subviews, styles_js_1, transformEvent_js_1, subviews, USE_INPUT_MODE;
    var __moduleName = context_35 && context_35.id;
    function component(state) {
        const { H, /*sizeBrowserToBounds,*/ asyncSizeBrowserToBounds, emulateNavigator, bondTasks, /*installFrameListener,*/ canvasBondTasks } = state;
        const audio_port = 1 + Number(location.port ? location.port : (location.protocol == 'https' ? 443 : 80));
        const audio_url = `${location.protocol}//${location.hostname}:${audio_port}/`;
        //const FocusBorrowerSel = '[name="address"], #selectinput, .control';
        const viewState = Object.assign(state.viewState, {
            touchX: 0, touchY: 0,
            textarea: null,
            keyinput: null,
            canvasEl: null,
            viewFrameEl: null,
            shouldHaveFocus: null,
            focusTextarea, blurTextarea,
            focusKeyinput, blurKeyinput
        });
        state.viewState = viewState;
        const toggleVirtualKeyboard = e => {
            e.preventDefault();
            let el = viewState.shouldHaveFocus;
            if (el) {
                if (el == viewState.keyinput) {
                    blurKeyinput();
                }
                else if (el == viewState.textarea) {
                    blurTextarea();
                }
            }
            else {
                focusKeyinput();
            }
        };
        const retargetTab = e => retargetTabToRemote(e, H);
        state.retargetTab = retargetTab;
        state.toggleVirtualKeyboard = toggleVirtualKeyboard;
        // this will likely have to be updated for iOS since "keyboard summons by focus" MUST 
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
        bondTasks.push(() => styles_js_1.dss.initializeDSS(state, styles_js_1.stylists));
        bondTasks.push(() => {
            document.addEventListener('keydown', event => {
                if (!event.target.matches('body') || state.viewState.shouldHaveFocus)
                    return;
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
                    });
                }
                else if (event.key == "Tab") {
                    retargetTab(event);
                }
                else if (event.key == "Enter") {
                    H(constructor_js_1.cloneKeyEvent(event, true));
                }
            });
            document.addEventListener('keyup', event => {
                if (!event.target.matches('body') || state.viewState.shouldHaveFocus)
                    return;
                if (event.key == "Enter") {
                    H(constructor_js_1.cloneKeyEvent(event, true));
                }
            });
        });
        subviews.startBandwidthLoop(state);
        state.viewState.draw = () => {
            return r_js_10.d `
      <main class="voodoo" bond=${bondTasks} stylist="styleVoodooMain">
        ${subviews.BandwidthIndicator(state)}
        ${subviews.TabList(state)}
        ${subviews.Controls(state)}
        <article class=tab-viewport stylist="styleTabViewport styleContextMenu">
          ${subviews.LoadingIndicator(state)}
          ${state.useViewFrame ? (state.demoMode ?
                r_js_10.d `
                  <iframe name=viewFrame 
                    scrolling=yes
                    src=/plugins/demo/index.html
                    load=${[
                    loaded => loaded.target.hasLoaded = true,
                    state.installFrameListener,
                    ...canvasBondTasks
                ]}
                    bond=${[
                    el => state.viewState.viewFrameEl = el,
                    asyncSizeBrowserToBounds,
                    emulateNavigator,
                    ...canvasBondTasks
                ]}
                  ></iframe>
                ` :
                state.factoryMode ?
                    r_js_10.d `
                    <iframe name=viewFrame 
                      scrolling=yes
                      load=${[loaded => loaded.target.hasLoaded = true, ...canvasBondTasks]}
                      bond=${[
                        el => state.viewState.viewFrameEl = el,
                        asyncSizeBrowserToBounds,
                        emulateNavigator,
                        state.installFrameListener,
                        ...canvasBondTasks,
                        el => el.src = `/plugins/projector/${isBundle() ? 'bundle' : 'index'}.html`
                    ]}
                    ></iframe>
                  `
                    :
                        r_js_10.d `
                    <iframe name=viewFrame 
                      scrolling=yes
                      load=${[loaded => loaded.target.hasLoaded = true, ...canvasBondTasks]}
                      bond=${[
                            el => state.viewState.viewFrameEl = el,
                            asyncSizeBrowserToBounds,
                            emulateNavigator,
                            state.installFrameListener,
                            ...canvasBondTasks,
                            el => el.src = `/plugins/appminifier/${isBundle() ? 'bundle' : 'index'}.html`
                        ]}
                    ></iframe>
                  `) :
                r_js_10.d `
              <canvas
                click=${() => {
                    if (viewState.shouldHaveFocus && document.activeElement != viewState.shouldHaveFocus) {
                        viewState.shouldHaveFocus.focus();
                    }
                }}
                bond=${[saveCanvas, asyncSizeBrowserToBounds, emulateNavigator, ...canvasBondTasks]}
                touchstart:passive=${retargetTouchScroll}
                touchmove=${[
                    e => e.preventDefault(),
                    common_js_11.throttle(retargetTouchScroll, state.EVENT_THROTTLE_MS)
                ]}
                wheel:passive=${common_js_11.throttle(H, state.EVENT_THROTTLE_MS)}
                mousemove:passive=${common_js_11.throttle(H, state.EVENT_THROTTLE_MS)}         
                mousedown=${H}         
                mouseup=${H}         
                pointermove:passive=${common_js_11.throttle(H, state.EVENT_THROTTLE_MS)}         
                pointerdown=${H}         
                pointerup=${H}         
                contextmenu=${subviews.makeContextMenuHandler(state)}
              ></canvas>
            `}
          <select id=selectinput stylist="styleSelectInput"
            input=${e => H({
                synthetic: true,
                type: "select",
                state,
                event: e
            })}
            >
            <option value="" disabled>Select an option</option>
          </select>
        </article>
        ${subviews.Modals(state)}
      </main>
      <audio bond=${el => self.addEventListener('click', () => el.play(), { once: true })} autoplay loop id=audio>
        <source src="${audio_url}" type=audio/mp3>
      </audio>
      ${common_js_11.DEBUG.pluginsMenu ? subviews.PluginsMenu(state) : ''}
    `;
        };
        state.viewState.dss = styles_js_1.dss;
        return state.viewState.draw();
        function isBundle() {
            return location.pathname == "/bundle.html";
        }
        function focusKeyinput(type = 'text', inputmode = 'text', value = '') {
            const { viewState } = state;
            viewState.keyinput.type = type;
            if (USE_INPUT_MODE) {
                viewState.keyinput.inputmode = inputmode;
            }
            viewState.keyinput.value = value;
            if (document.activeElement != viewState.keyinput) {
                viewState.keyinput.focus({ preventScroll: true });
            }
            viewState.shouldHaveFocus = viewState.keyinput;
        }
        function blurKeyinput() {
            const { viewState } = state;
            if (document.activeElement == viewState.keyinput)
                viewState.keyinput.blur();
            viewState.shouldHaveFocus = null;
        }
        function focusTextarea(inputmode = 'text', value = '') {
            const { viewState } = state;
            if (USE_INPUT_MODE) {
                viewState.textarea.inputmode = inputmode;
            }
            viewState.textarea.value = value;
            if (document.activeElement != viewState.textarea) {
                viewState.textarea.focus({ preventScroll: true });
            }
            viewState.shouldHaveFocus = viewState.textarea;
        }
        function blurTextarea() {
            const { viewState } = state;
            if (document.activeElement == viewState.textarea)
                viewState.textarea.blur();
            viewState.shouldHaveFocus = null;
        }
        function saveCanvas(canvasEl) {
            state.viewState.canvasEl = canvasEl;
            state.viewState.ctx = canvasEl.getContext('2d');
        }
    }
    exports_35("component", component);
    // helper functions
    function retargetTouchScrollToRemote(event, H, viewState) {
        const { type } = event;
        const { target } = event;
        const { changedTouches: changes } = event;
        if (changes.length > 1)
            return;
        const touch = changes[0];
        const { clientX, clientY } = touch;
        const { bitmapX, bitmapY } = transformEvent_js_1.getBitmapCoordinates({ target, clientX, clientY });
        if (type == 'touchmove') {
            event.preventDefault();
            const deltaX = Math.ceil(viewState.touchX - bitmapX);
            const deltaY = Math.ceil(viewState.touchY - bitmapY);
            viewState.killNextMouseReleased = true;
            H({
                synthetic: true,
                type: "touchscroll",
                bitmapX, bitmapY,
                deltaX, deltaY,
                event: event,
                contextId: viewState.latestScrollContext
            });
        }
        viewState.touchX = bitmapX;
        viewState.touchY = bitmapY;
    }
    function retargetTabToRemote(event, H) {
        if (event.key !== "Tab")
            return;
        event.preventDefault();
        event.stopPropagation();
        const ev = constructor_js_1.cloneKeyEvent(event, true);
        H(ev);
    }
    return {
        setters: [
            function (common_js_11_1) {
                common_js_11 = common_js_11_1;
            },
            function (constructor_js_1_1) {
                constructor_js_1 = constructor_js_1_1;
            },
            function (r_js_10_1) {
                r_js_10 = r_js_10_1;
            },
            function (Subviews_1) {
                Subviews = Subviews_1;
            },
            function (styles_js_1_1) {
                styles_js_1 = styles_js_1_1;
            },
            function (transformEvent_js_1_1) {
                transformEvent_js_1 = transformEvent_js_1_1;
            }
        ],
        execute: function () {
            exports_35("subviews", subviews = Subviews);
            //const DEFAULT_URL = 'https://google.com';
            //const isIOS = navigator.platform && navigator.platform.match("iPhone|iPod|iPad");
            USE_INPUT_MODE = false;
        }
    };
});
System.register("plugins/demo/treeUpdate", ["voodoo/src/common"], function (exports_36, context_36) {
    "use strict";
    var common_js_12, FocusCache;
    var __moduleName = context_36 && context_36.id;
    function resetFocusCache({ navigated: { targetId }, executionContextId }, state) {
        let cache = state.domCache.get(targetId);
        if (!cache) {
            cache = { contextId: '', domTree: '', focusSaver: FocusCache() };
            state.domCache.set(targetId, cache);
        }
        else {
            cache.focusSaver.reset();
        }
        if (executionContextId) {
            cache.contextId = executionContextId;
        }
    }
    exports_36("resetFocusCache", resetFocusCache);
    function handleTreeUpdate({ treeUpdate: { open, targetId, dontFocus, runFuncs }, executionContextId }, state) {
        if (targetId !== state.activeTarget) {
            common_js_12.DEBUG.val >= common_js_12.DEBUG.med && console.log(`Rejecting tree update for ${targetId} as it is not active target ${state.activeTarget}`);
            common_js_12.DEBUG.val >= common_js_12.DEBUG.med && console.log(`But saving this update into that targets cache.`);
            let cache = state.domCache.get(targetId);
            if (!cache) {
                cache = { contextId: '', domTree: '', focusSaver: FocusCache() };
                state.domCache.set(targetId, cache);
            }
            // when we have  iframes this will be dangerous
            // to flatten contextId (which will be multiple per page 1 for each iframe)
            cache.contextId = executionContextId;
            cache.domTree = open;
            return;
        }
        if (state.viewState.viewFrameEl) {
            updateTree({ targetId, domTree: open, contextId: executionContextId, dontFocus, runFuncs }, state);
            if (state.scrollToTopOnNextTreeUpdate) {
                scrollToTop({ navigated: state.scrollToTopOnNextTreeUpdate }, state);
                state.scrollToTopOnNextTreeUpdate = null;
            }
        }
        else {
            common_js_12.DEBUG.val && console.warn(`No view frame`);
        }
    }
    exports_36("handleTreeUpdate", handleTreeUpdate);
    function updateTree({ domTree, targetId, contextId, dontFocus: dontFocus = false, runFuncs: runFuncs = [] }, state) {
        const frame = getViewFrame(state);
        let doc = getViewWindow(state).document;
        let cache = state.domCache.get(targetId);
        if (!cache) {
            cache = { contextId: '', domTree: '', focusSaver: FocusCache() };
            state.domCache.set(targetId, cache);
        }
        cache.contextId = contextId;
        cache.domTree = domTree;
        if (!doc.body || doc.body.outerHTML !== domTree) {
            cache.focusSaver.save(doc);
            if (frame.hasLoaded) {
                doc = getViewWindow(state).document;
                doc.body.outerHTML = domTree;
                Array.from(doc.querySelectorAll('html > head')).forEach(node => node !== doc.head && node.remove());
            }
            else {
                frame.addEventListener('load', () => {
                    doc = getViewWindow(state).document;
                    doc.body.outerHTML = domTree;
                    Array.from(doc.querySelectorAll('html > head')).forEach(node => node !== doc.head && node.remove());
                }, { once: true });
            }
            if (!dontFocus) {
                cache.focusSaver.restore();
            }
            if (runFuncs) {
                if (frame.hasLoaded) {
                    const win = getViewWindow(state);
                    for (const name of runFuncs) {
                        try {
                            win[name]();
                        }
                        catch (e) {
                            common_js_12.DEBUG.val && console.warn(name, e);
                        }
                    }
                }
                else {
                    frame.addEventListener('load', () => {
                        const win = getViewWindow(state);
                        for (const name of runFuncs) {
                            try {
                                win[name]();
                            }
                            catch (e) {
                                common_js_12.DEBUG.val && console.warn(name, e);
                            }
                        }
                    });
                }
            }
        }
    }
    exports_36("updateTree", updateTree);
    function scrollToTop({ navigated }, state) {
        setTimeout(() => {
            if (navigated.targetId !== state.activeTarget)
                return;
            if (state.viewState.viewFrameEl) {
                getViewWindow(state).scrollTo(0, 0);
            }
            else {
                common_js_12.DEBUG.val && console.warn(`No view frame`);
            }
        }, 40);
    }
    exports_36("scrollToTop", scrollToTop);
    function scrollTo({ scrollY, scrollX }, state) {
        setTimeout(() => {
            if (state.viewState.viewFrameEl) {
                getViewWindow(state).scrollTo(scrollX, scrollY);
            }
            else {
                common_js_12.DEBUG.val && console.warn(`No view frame`);
            }
        }, 40);
    }
    exports_36("scrollTo", scrollTo);
    function handleTreeDiff({ treeDiff: { diffs, targetId }, executionContextId }, state) {
        if (targetId !== state.activeTarget) {
            common_js_12.DEBUG.val >= common_js_12.DEBUG.med && console.log(`Rejecting tree diff for ${targetId} as it is not active target ${state.activeTarget}`);
            common_js_12.DEBUG.val >= common_js_12.DEBUG.med && console.log(`But saving this diff into that targets cache.`);
            let cache = state.domCache.get(targetId);
            if (!cache) {
                cache = { contextId: '', domTree: '', focusSaver: FocusCache() };
                state.domCache.set(targetId, cache);
            }
            // when we have  iframes this will be dangerous
            // to flatten contextId (which will be multiple per page 1 for each iframe)
            cache.contextId = executionContextId;
            cache.diffs = diffs;
            return;
        }
        if (state.viewState.viewFrameEl) {
            const later = [];
            for (const diff of diffs) {
                const result = patchTree(diff, state);
                if (!result)
                    later.push(diff);
            }
            for (const diff of later) {
                const result = patchTree(diff, state);
                if (!result) {
                    console.warn(`Diff could not be applied after two tries`, diff);
                }
            }
        }
        else {
            common_js_12.DEBUG.val && console.warn(`No view frame`);
        }
    }
    exports_36("handleTreeDiff", handleTreeDiff);
    function patchTree({ insert, remove }, state) {
        const doc = getViewWindow(state).document;
        const { parentZig } = insert || remove;
        const parentZigSelector = `[zig="${parentZig}"]`;
        const parentElement = doc.querySelector(parentZigSelector);
        if (!parentElement) {
            //throw new TypeError(`No such parent element selected by ${parentZigSelector}`);
            //console.warn(`No such parent element selected by ${parentZigSelector}`);
            return false;
        }
        if (insert) {
            parentElement.insertAdjacentHTML('beforeEnd', insert.outerHTML);
            //console.log(parentElement, "Added", insert.outerHTML);
        }
        if (remove) {
            const zigSelectorToRemove = `[zig="${remove.zig}"]`;
            const elToRemove = parentElement.querySelector(zigSelectorToRemove);
            if (!elToRemove) {
                //throw new TypeError(`No such element to remove selected by ${zigSelectorToRemove}`);
                //console.warn(`No such element to remove selected by ${zigSelectorToRemove}`);
                return true;
            }
            else {
                elToRemove.remove();
            }
            //console.log("Removed", elToRemove);
        }
        return true;
    }
    function zigs(dataId, generation) {
        return `[zig="${dataId} ${generation}"]`;
    }
    function getViewWindow(state) {
        return state.viewState.viewFrameEl.contentWindow;
    }
    exports_36("getViewWindow", getViewWindow);
    function getViewFrame(state) {
        return state.viewState.viewFrameEl;
    }
    exports_36("getViewFrame", getViewFrame);
    return {
        setters: [
            function (common_js_12_1) {
                common_js_12 = common_js_12_1;
            }
        ],
        execute: function () {
            FocusCache = () => {
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
                        }
                        catch (e) {
                            common_js_12.DEBUG.val >= common_js_12.DEBUG.med && console.log(`Issue with save focus`, focusSaver, e);
                        }
                    },
                    restore: () => {
                        console.log('restore focus');
                        try {
                            const oldFocus = focusSaver.activeElement;
                            if (!oldFocus) {
                                common_js_12.DEBUG.val >= common_js_12.DEBUG.med && console.log(`No old focus`);
                                return;
                            }
                            let updatedEl;
                            const [oldId] = oldFocus.hasAttribute('zig') ? oldFocus.getAttribute('zig').split(' ') : "";
                            const dataIdSelector = `${oldFocus.localName}[zig^="${oldId}"]`;
                            const byDataId = focusSaver.doc.querySelector(dataIdSelector);
                            if (!byDataId) {
                                const fallbackSelector = oldFocus.id ? `${oldFocus.localName}#${oldFocus.id}` :
                                    oldFocus.name ? `${oldFocus.localName}[name="${oldFocus.name}"]` : '';
                                let byFallbackSelector;
                                if (fallbackSelector) {
                                    byFallbackSelector = focusSaver.doc.querySelector(fallbackSelector);
                                }
                                if (byFallbackSelector) {
                                    updatedEl = byFallbackSelector;
                                }
                            }
                            else {
                                common_js_12.DEBUG.val >= common_js_12.DEBUG.med && console.log(`Restoring focus data id`);
                                updatedEl = byDataId;
                            }
                            if (updatedEl) {
                                updatedEl.focus();
                                updatedEl.value = focusSaver.oldValue;
                                updatedEl.selectionStart = updatedEl.value ? updatedEl.value.length : focusSaver.selectionStart;
                                updatedEl.selectionEnd = updatedEl.value ? updatedEl.value.length : focusSaver.selectionEnd;
                            }
                            else {
                                common_js_12.DEBUG.val >= common_js_12.DEBUG.med && console.warn(`Sorry, we couldn't find the element that was focused before.`);
                            }
                        }
                        catch (e) {
                            common_js_12.DEBUG.val >= common_js_12.DEBUG.med && console.log(`Issue with restore focus`, focusSaver, e);
                        }
                    }
                };
                return focusSaver;
            };
        }
    };
});
System.register("plugins/demo/createListener", ["voodoo/src/common"], function (exports_37, context_37) {
    "use strict";
    var common_js_13, BUFFERED_FRAME_EVENT;
    var __moduleName = context_37 && context_37.id;
    function createFrameListener(queue, state) {
        const { H } = state;
        return function installFrameListener() {
            self.addEventListener('message', e => {
                if (e.data && e.data.event) {
                    const { event } = e.data;
                    const cache = state.domCache.get(state.activeTarget);
                    if (cache) {
                        event.contextId = cache.contextId;
                    }
                    if (event.type.endsWith('move')) {
                        queue.send(BUFFERED_FRAME_EVENT);
                    }
                    else if (event.custom) {
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
                    }
                    else {
                        if (!event.contextId) {
                            common_js_13.DEBUG.val && console.warn(`Event will not have context id as no cache for activeTarget`);
                        }
                        if (event.type == 'input') {
                            if (event.selectInput) {
                                H({
                                    synthetic: true,
                                    type: 'select',
                                    state: { waitingExecutionContext: event.contextId },
                                    event
                                });
                            }
                            else if (event.inputType == 'insertText') {
                                H({
                                    synthetic: true,
                                    contextId: state.contextIdOfFocusedInput,
                                    type: 'typing-clearAndInsertValue',
                                    value: event.value,
                                    event
                                });
                            }
                        }
                        else if (event.type == 'click' && event.href) {
                            const activeTab = state.activeTab();
                            let activeTabUrl = new URL(activeTab.url);
                            let url = new URL(event.href);
                            const frag = url.hash;
                            activeTabUrl.hash = url.hash;
                            url = url + '';
                            activeTabUrl = activeTabUrl + '';
                            common_js_13.DEBUG.val >= common_js_13.DEBUG.med && console.log(`Doc url ${activeTab.url}, target url ${url}`);
                            if (url == activeTabUrl) {
                                // in other words if they differ by only the hash
                                const viewDoc = state.viewState.viewFrameEl.contentWindow.document;
                                const fragElem = viewDoc.querySelector(frag);
                                if (fragElem) {
                                    fragElem.scrollIntoView();
                                }
                            }
                        }
                        else {
                            if (event.type == 'keypress' && event.contenteditableTarget) {
                                /**
                                H({
                                  synthetic: true,
                                  contextId: state.contextIdOfFocusedInput,
                                  type: 'typing',
                                  data: event.key
                                });
                                **/
                            }
                            else {
                                common_js_13.DEBUG.val >= common_js_13.DEBUG.med && console.log(event);
                                H(event);
                            }
                        }
                    }
                }
            });
            const win = state.viewState.viewFrameEl.contentWindow;
            common_js_13.DEBUG.val >= common_js_13.DEBUG.med && console.log(win);
            win.addEventListener('load', () => {
                common_js_13.DEBUG.val >= common_js_13.DEBUG.med && console.log("View frame content loaded");
            });
        };
    }
    exports_37("createFrameListener", createFrameListener);
    function createDOMTreeGetter(queue, delay) {
        return function getDOMTree(force = false) {
            setTimeout(() => {
                common_js_13.DEBUG.val >= common_js_13.DEBUG.med && console.log(`local requests remote tree`);
                queue.send({
                    type: "getDOMTree",
                    force,
                    custom: true
                });
            }, delay);
        };
    }
    exports_37("createDOMTreeGetter", createDOMTreeGetter);
    return {
        setters: [
            function (common_js_13_1) {
                common_js_13 = common_js_13_1;
            }
        ],
        execute: function () {
            BUFFERED_FRAME_EVENT = {
                type: "buffered-results-collection",
                command: {
                    isBufferedResultsCollectionOnly: true,
                    params: {}
                }
            };
        }
    };
});
System.register("plugins/demo/programmaticClickIntervention", [], function (exports_38, context_38) {
    "use strict";
    var __moduleName = context_38 && context_38.id;
    function saveFailingClick({ click }, state) {
        if (click.clickModifiers & 2) {
            state.createTab(click, click.intendedHref);
        }
        else if (click.intendedHref) {
            state.H({
                synthetic: true,
                type: 'url-address',
                url: click.intendedHref,
                event: click
            });
        }
    }
    exports_38("saveFailingClick", saveFailingClick);
    function auditClicks({ click }, state) {
        if (click.hitsTarget)
            return;
        else {
            saveFailingClick({ click }, state);
        }
    }
    exports_38("auditClicks", auditClicks);
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("plugins/demo/installPlugin", ["plugins/demo/treeUpdate", "plugins/demo/createListener", "plugins/demo/programmaticClickIntervention"], function (exports_39, context_39) {
    "use strict";
    var treeUpdate_js_1, createListener_js_1, programmaticClickIntervention_js_1;
    var __moduleName = context_39 && context_39.id;
    function installPlugin(state, queue) {
        try {
            self.state = state;
            // key input 
            state.ignoreKeysCanInputMessage = false;
            state.dontFocusControlInputs = !!state.viewState.viewFrameEl;
            // dom cache
            state.domCache = new Map();
            // select
            state.ignoreSelectInputEvents = true;
            state.installFrameListener = createListener_js_1.createFrameListener(queue, state);
            state.getDOMTree = createListener_js_1.createDOMTreeGetter(queue, state.SHORT_DELAY);
            // plugins 
            queue.addMetaListener('treeUpdate', meta => treeUpdate_js_1.handleTreeUpdate(meta, state));
            queue.addMetaListener('navigated', meta => clearDomCache(meta, state));
            queue.addMetaListener('navigated', meta => state.getDOMTree());
            queue.addMetaListener('navigated', meta => treeUpdate_js_1.scrollToTop(meta, state));
            queue.addMetaListener('click', meta => programmaticClickIntervention_js_1.auditClicks(meta, state));
            // start  
            queue.addMetaListener('topRedirect', meta => {
                const { browserUrl } = meta.topRedirect;
                location = browserUrl;
            });
            state.addListener('activateTab', () => {
                const { activeTarget } = state;
                const cache = state.domCache.get(activeTarget);
                if (!cache) {
                    state.getDOMTree(true);
                }
                else {
                    treeUpdate_js_1.updateTree(cache, state);
                    const { scrollTop, scrollLeft } = cache;
                    treeUpdate_js_1.scrollTo({ scrollTop, scrollLeft });
                }
            });
            state.getDOMTree();
        }
        catch (e) {
            console.info(e);
        }
    }
    exports_39("default", installPlugin);
    function clearDomCache({ navigated }, state) {
        const { targetId } = navigated;
        state.domCache.delete(targetId);
    }
    return {
        setters: [
            function (treeUpdate_js_1_1) {
                treeUpdate_js_1 = treeUpdate_js_1_1;
            },
            function (createListener_js_1_1) {
                createListener_js_1 = createListener_js_1_1;
            },
            function (programmaticClickIntervention_js_1_1) {
                programmaticClickIntervention_js_1 = programmaticClickIntervention_js_1_1;
            }
        ],
        execute: function () {
        }
    };
});
System.register("plugins/appminifier/scripts/treeUpdate", ["voodoo/src/common"], function (exports_40, context_40) {
    "use strict";
    var common_js_14, FocusCache;
    var __moduleName = context_40 && context_40.id;
    function resetFocusCache({ navigated: { targetId }, executionContextId }, state) {
        let cache = state.domCache.get(targetId);
        if (!cache) {
            cache = { contextId: '', domTree: '', focusSaver: FocusCache() };
            state.domCache.set(targetId, cache);
        }
        else {
            cache.focusSaver.reset();
        }
        if (executionContextId) {
            cache.contextId = executionContextId;
        }
    }
    exports_40("resetFocusCache", resetFocusCache);
    function handleTreeUpdate({ treeUpdate: { open, targetId, dontFocus, runFuncs }, executionContextId }, state) {
        if (targetId !== state.activeTarget) {
            common_js_14.DEBUG.val >= common_js_14.DEBUG.med && console.log(`Rejecting tree update for ${targetId} as it is not active target ${state.activeTarget}`);
            common_js_14.DEBUG.val >= common_js_14.DEBUG.med && console.log(`But saving this update into that targets cache.`);
            let cache = state.domCache.get(targetId);
            if (!cache) {
                cache = { contextId: '', domTree: '', focusSaver: FocusCache() };
                state.domCache.set(targetId, cache);
            }
            // when we have  iframes this will be dangerous
            // to flatten contextId (which will be multiple per page 1 for each iframe)
            cache.contextId = executionContextId;
            cache.domTree = open;
            return;
        }
        if (state.viewState.viewFrameEl) {
            updateTree({ targetId, domTree: open, contextId: executionContextId, dontFocus, runFuncs }, state);
            if (state.scrollToTopOnNextTreeUpdate) {
                scrollToTop({ navigated: state.scrollToTopOnNextTreeUpdate }, state);
                state.scrollToTopOnNextTreeUpdate = null;
            }
        }
        else {
            common_js_14.DEBUG.val && console.warn(`No view frame`);
        }
    }
    exports_40("handleTreeUpdate", handleTreeUpdate);
    function updateTree({ domTree, targetId, contextId, dontFocus: dontFocus = false, runFuncs: runFuncs = [] }, state) {
        const frame = getViewFrame(state);
        let doc = getViewWindow(state).document;
        let cache = state.domCache.get(targetId);
        if (!cache) {
            cache = { contextId: '', domTree: '', focusSaver: FocusCache() };
            state.domCache.set(targetId, cache);
        }
        cache.contextId = contextId;
        cache.domTree = domTree;
        if (!doc.body || doc.body.outerHTML !== domTree) {
            cache.focusSaver.save(doc);
            if (frame.hasLoaded) {
                doc = getViewWindow(state).document;
                doc.body.outerHTML = domTree;
                Array.from(doc.querySelectorAll('html > head')).forEach(node => node !== doc.head && node.remove());
            }
            else {
                frame.addEventListener('load', () => {
                    doc = getViewWindow(state).document;
                    doc.body.outerHTML = domTree;
                    Array.from(doc.querySelectorAll('html > head')).forEach(node => node !== doc.head && node.remove());
                }, { once: true });
            }
            if (!dontFocus) {
                cache.focusSaver.restore();
            }
            if (runFuncs) {
                if (frame.hasLoaded) {
                    const win = getViewWindow(state);
                    for (const name of runFuncs) {
                        try {
                            win[name]();
                        }
                        catch (e) {
                            common_js_14.DEBUG.val && console.warn(name, e);
                        }
                    }
                }
                else {
                    frame.addEventListener('load', () => {
                        const win = getViewWindow(state);
                        for (const name of runFuncs) {
                            try {
                                win[name]();
                            }
                            catch (e) {
                                common_js_14.DEBUG.val && console.warn(name, e);
                            }
                        }
                    });
                }
            }
        }
    }
    exports_40("updateTree", updateTree);
    function scrollToTop({ navigated }, state) {
        setTimeout(() => {
            if (navigated.targetId !== state.activeTarget)
                return;
            if (state.viewState.viewFrameEl) {
                getViewWindow(state).scrollTo(0, 0);
            }
            else {
                common_js_14.DEBUG.val && console.warn(`No view frame`);
            }
        }, 40);
    }
    exports_40("scrollToTop", scrollToTop);
    function scrollTo({ scrollY, scrollX }, state) {
        setTimeout(() => {
            if (state.viewState.viewFrameEl) {
                getViewWindow(state).scrollTo(scrollX, scrollY);
            }
            else {
                common_js_14.DEBUG.val && console.warn(`No view frame`);
            }
        }, 40);
    }
    exports_40("scrollTo", scrollTo);
    function handleTreeDiff({ treeDiff: { diffs, targetId }, executionContextId }, state) {
        if (targetId !== state.activeTarget) {
            common_js_14.DEBUG.val >= common_js_14.DEBUG.med && console.log(`Rejecting tree diff for ${targetId} as it is not active target ${state.activeTarget}`);
            common_js_14.DEBUG.val >= common_js_14.DEBUG.med && console.log(`But saving this diff into that targets cache.`);
            let cache = state.domCache.get(targetId);
            if (!cache) {
                cache = { contextId: '', domTree: '', focusSaver: FocusCache() };
                state.domCache.set(targetId, cache);
            }
            // when we have  iframes this will be dangerous
            // to flatten contextId (which will be multiple per page 1 for each iframe)
            cache.contextId = executionContextId;
            cache.diffs = diffs;
            return;
        }
        if (state.viewState.viewFrameEl) {
            const later = [];
            for (const diff of diffs) {
                const result = patchTree(diff, state);
                if (!result)
                    later.push(diff);
            }
            for (const diff of later) {
                const result = patchTree(diff, state);
                if (!result) {
                    console.warn(`Diff could not be applied after two tries`, diff);
                }
            }
        }
        else {
            common_js_14.DEBUG.val && console.warn(`No view frame`);
        }
    }
    exports_40("handleTreeDiff", handleTreeDiff);
    function patchTree({ insert, remove }, state) {
        const doc = getViewWindow(state).document;
        const { parentZig } = insert || remove;
        const parentZigSelector = `[zig="${parentZig}"]`;
        const parentElement = doc.querySelector(parentZigSelector);
        if (!parentElement) {
            //throw new TypeError(`No such parent element selected by ${parentZigSelector}`);
            //console.warn(`No such parent element selected by ${parentZigSelector}`);
            return false;
        }
        if (insert) {
            parentElement.insertAdjacentHTML('beforeEnd', insert.outerHTML);
            //console.log(parentElement, "Added", insert.outerHTML);
        }
        if (remove) {
            const zigSelectorToRemove = `[zig="${remove.zig}"]`;
            const elToRemove = parentElement.querySelector(zigSelectorToRemove);
            if (!elToRemove) {
                //throw new TypeError(`No such element to remove selected by ${zigSelectorToRemove}`);
                //console.warn(`No such element to remove selected by ${zigSelectorToRemove}`);
                return true;
            }
            else {
                elToRemove.remove();
            }
            //console.log("Removed", elToRemove);
        }
        return true;
    }
    function zigs(dataId, generation) {
        return `[zig="${dataId} ${generation}"]`;
    }
    function getViewWindow(state) {
        return state.viewState.viewFrameEl.contentWindow;
    }
    exports_40("getViewWindow", getViewWindow);
    function getViewFrame(state) {
        return state.viewState.viewFrameEl;
    }
    exports_40("getViewFrame", getViewFrame);
    return {
        setters: [
            function (common_js_14_1) {
                common_js_14 = common_js_14_1;
            }
        ],
        execute: function () {
            FocusCache = () => {
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
                        }
                        catch (e) {
                            common_js_14.DEBUG.val >= common_js_14.DEBUG.med && console.log(`Issue with save focus`, focusSaver, e);
                        }
                    },
                    restore: () => {
                        console.log('restore focus');
                        try {
                            const oldFocus = focusSaver.activeElement;
                            if (!oldFocus) {
                                common_js_14.DEBUG.val >= common_js_14.DEBUG.med && console.log(`No old focus`);
                                return;
                            }
                            let updatedEl;
                            const [oldId] = oldFocus.hasAttribute('zig') ? oldFocus.getAttribute('zig').split(' ') : "";
                            const dataIdSelector = `${oldFocus.localName}[zig^="${oldId}"]`;
                            const byDataId = focusSaver.doc.querySelector(dataIdSelector);
                            if (!byDataId) {
                                const fallbackSelector = oldFocus.id ? `${oldFocus.localName}#${oldFocus.id}` :
                                    oldFocus.name ? `${oldFocus.localName}[name="${oldFocus.name}"]` : '';
                                let byFallbackSelector;
                                if (fallbackSelector) {
                                    byFallbackSelector = focusSaver.doc.querySelector(fallbackSelector);
                                }
                                if (byFallbackSelector) {
                                    updatedEl = byFallbackSelector;
                                }
                            }
                            else {
                                common_js_14.DEBUG.val >= common_js_14.DEBUG.med && console.log(`Restoring focus data id`);
                                updatedEl = byDataId;
                            }
                            if (updatedEl) {
                                updatedEl.focus();
                                updatedEl.value = focusSaver.oldValue;
                                updatedEl.selectionStart = updatedEl.value ? updatedEl.value.length : focusSaver.selectionStart;
                                updatedEl.selectionEnd = updatedEl.value ? updatedEl.value.length : focusSaver.selectionEnd;
                            }
                            else {
                                common_js_14.DEBUG.val >= common_js_14.DEBUG.med && console.warn(`Sorry, we couldn't find the element that was focused before.`);
                            }
                        }
                        catch (e) {
                            common_js_14.DEBUG.val >= common_js_14.DEBUG.med && console.log(`Issue with restore focus`, focusSaver, e);
                        }
                    }
                };
                return focusSaver;
            };
        }
    };
});
System.register("plugins/appminifier/scripts/createListener", ["voodoo/src/common"], function (exports_41, context_41) {
    "use strict";
    var common_js_15, BUFFERED_FRAME_EVENT;
    var __moduleName = context_41 && context_41.id;
    function createFrameListener(queue, state) {
        const { H } = state;
        return function installFrameListener() {
            self.addEventListener('message', e => {
                if (e.data && e.data.event) {
                    const { event } = e.data;
                    const cache = state.domCache.get(state.activeTarget);
                    if (cache) {
                        event.contextId = cache.contextId;
                    }
                    if (event.type.endsWith('move')) {
                        queue.send(BUFFERED_FRAME_EVENT);
                    }
                    else if (event.custom) {
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
                    }
                    else {
                        if (!event.contextId) {
                            common_js_15.DEBUG.val && console.warn(`Event will not have context id as no cache for activeTarget`);
                        }
                        if (event.type == 'input') {
                            if (event.selectInput) {
                                H({
                                    synthetic: true,
                                    type: 'select',
                                    state: { waitingExecutionContext: event.contextId },
                                    event
                                });
                            }
                            else if (event.inputType == 'insertText') {
                                H({
                                    synthetic: true,
                                    contextId: state.contextIdOfFocusedInput,
                                    type: 'typing-clearAndInsertValue',
                                    value: event.value,
                                    event
                                });
                            }
                        }
                        else if (event.type == 'click' && event.href) {
                            const activeTab = state.activeTab();
                            let activeTabUrl = new URL(activeTab.url);
                            let url = new URL(event.href);
                            const frag = url.hash;
                            activeTabUrl.hash = url.hash;
                            url = url + '';
                            activeTabUrl = activeTabUrl + '';
                            common_js_15.DEBUG.val >= common_js_15.DEBUG.med && console.log(`Doc url ${activeTab.url}, target url ${url}`);
                            if (url == activeTabUrl) {
                                // in other words if they differ by only the hash
                                const viewDoc = state.viewState.viewFrameEl.contentWindow.document;
                                const fragElem = viewDoc.querySelector(frag);
                                if (fragElem) {
                                    fragElem.scrollIntoView();
                                }
                            }
                        }
                        else {
                            if (event.type == 'keypress' && event.contenteditableTarget) {
                                /**
                                H({
                                  synthetic: true,
                                  contextId: state.contextIdOfFocusedInput,
                                  type: 'typing',
                                  data: event.key
                                });
                                **/
                            }
                            else {
                                common_js_15.DEBUG.val >= common_js_15.DEBUG.med && console.log(event);
                                H(event);
                            }
                        }
                    }
                }
            });
            const win = state.viewState.viewFrameEl.contentWindow;
            common_js_15.DEBUG.val >= common_js_15.DEBUG.med && console.log(win);
            win.addEventListener('load', () => {
                common_js_15.DEBUG.val >= common_js_15.DEBUG.med && console.log("View frame content loaded");
            });
        };
    }
    exports_41("createFrameListener", createFrameListener);
    function createDOMTreeGetter(queue, delay) {
        return function getDOMTree(force = false) {
            setTimeout(() => {
                common_js_15.DEBUG.val >= common_js_15.DEBUG.med && console.log(`local requests remote tree`);
                queue.send({
                    type: "getDOMTree",
                    force,
                    custom: true
                });
            }, delay);
        };
    }
    exports_41("createDOMTreeGetter", createDOMTreeGetter);
    return {
        setters: [
            function (common_js_15_1) {
                common_js_15 = common_js_15_1;
            }
        ],
        execute: function () {
            BUFFERED_FRAME_EVENT = {
                type: "buffered-results-collection",
                command: {
                    isBufferedResultsCollectionOnly: true,
                    params: {}
                }
            };
        }
    };
});
System.register("plugins/appminifier/scripts/programmaticClickIntervention", [], function (exports_42, context_42) {
    "use strict";
    var __moduleName = context_42 && context_42.id;
    function saveFailingClick({ click }, state) {
        if (click.clickModifiers & 2) {
            state.createTab(click, click.intendedHref);
        }
        else if (click.intendedHref) {
            state.H({
                synthetic: true,
                type: 'url-address',
                url: click.intendedHref,
                event: click
            });
        }
    }
    exports_42("saveFailingClick", saveFailingClick);
    function auditClicks({ click }, state) {
        if (click.hitsTarget)
            return;
        else {
            saveFailingClick({ click }, state);
        }
    }
    exports_42("auditClicks", auditClicks);
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("plugins/appminifier/installPlugin", ["plugins/appminifier/scripts/treeUpdate", "plugins/appminifier/scripts/createListener", "plugins/appminifier/scripts/programmaticClickIntervention"], function (exports_43, context_43) {
    "use strict";
    var treeUpdate_js_2, createListener_js_2, programmaticClickIntervention_js_2;
    var __moduleName = context_43 && context_43.id;
    function installPlugin(state, queue) {
        if (location.pathname !== "/custom.html" && location.pathname !== "/")
            return;
        try {
            // key input 
            state.ignoreKeysCanInputMessage = false;
            state.dontFocusControlInputs = !!state.useViewFrame;
            // dom cache
            state.domCache = new Map();
            // select
            state.ignoreSelectInputEvents = true;
            state.installFrameListener = createListener_js_2.createFrameListener(queue, state);
            state.getDOMTree = createListener_js_2.createDOMTreeGetter(queue, state.SHORT_DELAY);
            // plugins 
            queue.addMetaListener('topRedirect', meta => {
                const { browserUrl } = meta.topRedirect;
                location = browserUrl;
            });
            queue.addMetaListener('treeUpdate', meta => treeUpdate_js_2.handleTreeUpdate(meta, state));
            queue.addMetaListener('treeDiff', meta => treeUpdate_js_2.handleTreeDiff(meta, state));
            queue.addMetaListener('navigated', meta => treeUpdate_js_2.resetFocusCache(meta, state));
            queue.addMetaListener('navigated', meta => handleNavigate(meta, state));
            queue.addMetaListener('click', meta => programmaticClickIntervention_js_2.auditClicks(meta, state));
            // appminifier plugin 
            queue.send({
                type: "enableAppminifier",
                custom: true
            });
            state.addListener('activateTab', () => {
                const win = treeUpdate_js_2.getViewWindow(state);
                const { activeTarget, clearViewport, lastTarget } = state;
                const lastCache = state.domCache.get(lastTarget);
                const cache = state.domCache.get(activeTarget);
                if (!cache) {
                    state.clearViewport();
                    state.getDOMTree(true);
                }
                else {
                    // save scroll position of last target before we update window
                    // using block scope oorah
                    if (lastCache) {
                        const { pageXOffset: scrollX, pageYOffset: scrollY } = win;
                        Object.assign(lastCache, { scrollX, scrollY });
                    }
                    state.clearViewport();
                    treeUpdate_js_2.updateTree(cache, state);
                    // restore scroll position of new target
                    const { scrollX, scrollY } = cache;
                    treeUpdate_js_2.scrollTo({ scrollX, scrollY }, state);
                }
            });
        }
        catch (e) {
            console.info(e);
        }
    }
    exports_43("default", installPlugin);
    function clearDomCache({ navigated }, state) {
        const { targetId } = navigated;
        state.domCache.delete(targetId);
    }
    function handleNavigate({ navigated }, state) {
        clearDomCache({ navigated }, state);
        if (navigated.url.startsWith('http')) {
            state.scrollToTopOnNextTreeUpdate = navigated;
            state.getDOMTree();
        }
        else {
            state.clearViewport();
        }
    }
    return {
        setters: [
            function (treeUpdate_js_2_1) {
                treeUpdate_js_2 = treeUpdate_js_2_1;
            },
            function (createListener_js_2_1) {
                createListener_js_2 = createListener_js_2_1;
            },
            function (programmaticClickIntervention_js_2_1) {
                programmaticClickIntervention_js_2 = programmaticClickIntervention_js_2_1;
            }
        ],
        execute: function () {
        }
    };
});
System.register("plugins/projector/scripts/treeUpdate", ["voodoo/src/common"], function (exports_44, context_44) {
    "use strict";
    var common_js_16;
    var __moduleName = context_44 && context_44.id;
    /*
      export function handleTreeUpdate({treeUpdate:{open,targetId,dontFocus,runFuncs}, executionContextId}, state) {
        if ( targetId !== state.activeTarget ) {
          DEBUG.val >= DEBUG.med && console.log(`Rejecting tree update for ${targetId} as it is not active target ${state.activeTarget}`);
          DEBUG.val >= DEBUG.med && console.log(`But saving this update into that targets cache.`);
          let cache = state.domCache.get(targetId);
          if ( ! cache ) {
            cache = {contextId:'', domTree:'', focusSaver: null};
            state.domCache.set(targetId, cache);
          }
          // when we have  iframes this will be dangerous
          // to flatten contextId (which will be multiple per page 1 for each iframe)
          cache.contextId = executionContextId;
          cache.domTree = open;
          return;
        }
        if ( state.viewState.viewFrameEl ) {
          updateTree({targetId, domTree:open, contextId:executionContextId, dontFocus, runFuncs}, state);
          if ( state.scrollToTopOnNextTreeUpdate ) {
            scrollToTop({navigated:state.scrollToTopOnNextTreeUpdate}, state);
            state.scrollToTopOnNextTreeUpdate = null;
          }
        } else {
          DEBUG.val && console.warn(`No view frame`);
        }
      }
  
      export function updateTree({domTree,targetId,contextId,dontFocus:dontFocus = false, runFuncs: runFuncs= []}, state) {
        const frame = getViewFrame(state);
        let doc = getViewWindow(state).document;
        let cache = state.domCache.get(targetId);
        if ( ! cache ) {
          cache = {contextId:'', domTree:'', focusSaver: null};
          state.domCache.set(targetId, cache);
        }
        cache.contextId = contextId;
        cache.domTree = domTree;
        if ( !doc.body || doc.body.outerHTML !== domTree ) {
          //cache.focusSaver.save(doc);
          if ( frame.hasLoaded ) {
            doc = getViewWindow(state).document;
            doc.body.outerHTML = domTree;
            Array.from(doc.querySelectorAll('html > head')).forEach(node => node !== doc.head && node.remove());
          } else {
            frame.addEventListener('load', () => {
              doc = getViewWindow(state).document;
              doc.body.outerHTML = domTree;
              Array.from(doc.querySelectorAll('html > head')).forEach(node => node !== doc.head && node.remove());
            }, {once:true});
          }
          if ( ! dontFocus ) {
            //cache.focusSaver.restore();
          }
          if ( runFuncs ) {
            if ( frame.hasLoaded ) {
              const win = getViewWindow(state);
              for ( const name of runFuncs ) {
                try { win[name](); } catch(e){DEBUG.val && console.warn(name, e)}
              }
            } else {
              frame.addEventListener('load', () => {
                const win = getViewWindow(state);
                for ( const name of runFuncs ) {
                  try { win[name](); } catch(e){DEBUG.val && console.warn(name, e)}
                }
              });
            }
          }
        }
      }
    */
    /*
      export function handleTreeDiff({treeDiff:{diffs,targetId},executionContextId}, state) {
        if ( targetId !== state.activeTarget ) {
          DEBUG.val >= DEBUG.med && console.log(`Rejecting tree diff for ${targetId} as it is not active target ${state.activeTarget}`);
          DEBUG.val >= DEBUG.med && console.log(`But saving this diff into that targets cache.`);
          let cache = state.domCache.get(targetId);
          if ( ! cache ) {
            cache = {contextId:'', domTree:'', focusSaver: FocusCache()};
            state.domCache.set(targetId, cache);
          }
          // when we have  iframes this will be dangerous
          // to flatten contextId (which will be multiple per page 1 for each iframe)
          cache.contextId = executionContextId;
          cache.diffs = diffs;
          return;
        }
        if ( state.viewState.viewFrameEl ) {
          const later = [];
          for ( const diff of diffs ) {
            const result = patchTree(diff,state);
            if ( ! result ) later.push(diff);
          }
          for ( const diff of later ) {
            const result = patchTree(diff, state);
            if ( ! result ) {
              console.warn(`Diff could not be applied after two tries`, diff);
            }
          }
        } else {
          DEBUG.val && console.warn(`No view frame`);
        }
      }
  
      function patchTree({
            insert, remove
          }, state) {
        const doc = getViewWindow(state).document;
  
        const {parentZig} = insert || remove;
        const parentZigSelector = `[zig="${parentZig}"]`;
        const parentElement = doc.querySelector(parentZigSelector);
  
        
        if ( ! parentElement ) {
          //throw new TypeError(`No such parent element selected by ${parentZigSelector}`);
          //console.warn(`No such parent element selected by ${parentZigSelector}`);
          return false;
        }
  
        if ( insert ) {
          parentElement.insertAdjacentHTML('beforeEnd', insert.outerHTML);
          //console.log(parentElement, "Added", insert.outerHTML);
        }
  
        if ( remove ) {
          const zigSelectorToRemove = `[zig="${remove.zig}"]`;
          const elToRemove = parentElement.querySelector(zigSelectorToRemove);
          if ( ! elToRemove ) {
            //throw new TypeError(`No such element to remove selected by ${zigSelectorToRemove}`);
            //console.warn(`No such element to remove selected by ${zigSelectorToRemove}`);
            return true;
          } else {
            elToRemove.remove();
          }
          //console.log("Removed", elToRemove);
        }
  
        return true;
      }
  
      function zigs(dataId, generation) {
        return `[zig="${dataId} ${generation}"]`;
      }
    */
    function scrollToTop({ navigated }, state) {
        setTimeout(() => {
            if (navigated.targetId !== state.activeTarget)
                return;
            if (state.viewState.viewFrameEl) {
                getViewWindow(state).scrollTo(0, 0);
            }
            else {
                common_js_16.DEBUG.val && console.warn(`No view frame`);
            }
        }, 40);
    }
    exports_44("scrollToTop", scrollToTop);
    function scrollTo({ scrollY, scrollX }, state) {
        setTimeout(() => {
            if (state.viewState.viewFrameEl) {
                getViewWindow(state).scrollTo(scrollX, scrollY);
            }
            else {
                common_js_16.DEBUG.val && console.warn(`No view frame`);
            }
        }, 40);
    }
    exports_44("scrollTo", scrollTo);
    function getViewWindow(state) {
        return state.viewState.viewFrameEl.contentWindow;
    }
    exports_44("getViewWindow", getViewWindow);
    function getViewFrame(state) {
        return state.viewState.viewFrameEl;
    }
    exports_44("getViewFrame", getViewFrame);
    return {
        setters: [
            function (common_js_16_1) {
                common_js_16 = common_js_16_1;
            }
        ],
        execute: function () {
        }
    };
});
System.register("plugins/projector/scripts/createListener", ["voodoo/src/common"], function (exports_45, context_45) {
    "use strict";
    var common_js_17, BUFFERED_FRAME_EVENT;
    var __moduleName = context_45 && context_45.id;
    function createFrameListener(queue, state) {
        const { H } = state;
        return function installFrameListener() {
            self.addEventListener('message', e => {
                if (e.data && e.data.event) {
                    const { event } = e.data;
                    const cache = state.domCache.get(state.activeTarget);
                    if (cache) {
                        event.contextId = cache.contextId;
                    }
                    if (event.type.endsWith('move')) {
                        queue.send(BUFFERED_FRAME_EVENT);
                    }
                    else if (event.custom) {
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
                    }
                    else {
                        if (!event.contextId) {
                            common_js_17.DEBUG.val && console.warn(`Event will not have context id as no cache for activeTarget`);
                        }
                        if (event.type == 'input') {
                            if (event.selectInput) {
                                H({
                                    synthetic: true,
                                    type: 'select',
                                    state: { waitingExecutionContext: event.contextId },
                                    event
                                });
                            }
                            else if (event.inputType == 'insertText') {
                                H({
                                    synthetic: true,
                                    contextId: state.contextIdOfFocusedInput,
                                    type: 'typing-clearAndInsertValue',
                                    value: event.value,
                                    event
                                });
                            }
                        }
                        else if (event.type == 'click' && event.href) {
                            const activeTab = state.activeTab();
                            let activeTabUrl = new URL(activeTab.url);
                            let url = new URL(event.href);
                            const frag = url.hash;
                            activeTabUrl.hash = url.hash;
                            url = url + '';
                            activeTabUrl = activeTabUrl + '';
                            common_js_17.DEBUG.val >= common_js_17.DEBUG.med && console.log(`Doc url ${activeTab.url}, target url ${url}`);
                            if (url == activeTabUrl) {
                                // in other words if they differ by only the hash
                                const viewDoc = state.viewState.viewFrameEl.contentWindow.document;
                                const fragElem = viewDoc.querySelector(frag);
                                if (fragElem) {
                                    fragElem.scrollIntoView();
                                }
                            }
                        }
                        else {
                            if (event.type == 'keypress' && event.contenteditableTarget) {
                                /**
                                H({
                                  synthetic: true,
                                  contextId: state.contextIdOfFocusedInput,
                                  type: 'typing',
                                  data: event.key
                                });
                                **/
                            }
                            else {
                                common_js_17.DEBUG.val >= common_js_17.DEBUG.med && console.log(event);
                                H(event);
                            }
                        }
                    }
                }
            });
            const win = state.viewState.viewFrameEl.contentWindow;
            common_js_17.DEBUG.val >= common_js_17.DEBUG.med && console.log(win);
            win.addEventListener('load', () => {
                common_js_17.DEBUG.val >= common_js_17.DEBUG.med && console.log("View frame content loaded");
            });
        };
    }
    exports_45("createFrameListener", createFrameListener);
    function createDOMTreeGetter(queue, delay) {
        return function getDOMTree(force = false) {
            setTimeout(() => {
                common_js_17.DEBUG.val >= common_js_17.DEBUG.med && console.log(`local requests remote tree`);
                queue.send({
                    type: "getDOMSnapshot",
                    force,
                    custom: true
                });
            }, delay);
        };
    }
    exports_45("createDOMTreeGetter", createDOMTreeGetter);
    return {
        setters: [
            function (common_js_17_1) {
                common_js_17 = common_js_17_1;
            }
        ],
        execute: function () {
            BUFFERED_FRAME_EVENT = {
                type: "buffered-results-collection",
                command: {
                    isBufferedResultsCollectionOnly: true,
                    params: {}
                }
            };
        }
    };
});
System.register("plugins/projector/installPlugin", ["plugins/projector/scripts/treeUpdate", "plugins/projector/scripts/createListener"], function (exports_46, context_46) {
    "use strict";
    var treeUpdate_js_3, createListener_js_3;
    var __moduleName = context_46 && context_46.id;
    function installPlugin(state, queue) {
        console.log("Installing projector plugin");
        if (location.pathname !== "/factory.html")
            return;
        state.factoryMode = true;
        state.domCache = new Map();
        state.installFrameListener = createListener_js_3.createFrameListener(queue, state);
        state.getDOMSnapshot = createListener_js_3.createDOMTreeGetter(queue, state.SHORT_DELAY);
        //queue.addMetaListener('treeUpdate', meta => handleTreeUpdate(meta, state));
        //queue.addMetaListener('treeDiff', meta => handleTreeDiff(meta, state));
        queue.addMetaListener('navigated', meta => handleNavigate(meta, state));
        queue.addMetaListener('domSnapshot', meta => console.log(meta, state));
        queue.send({
            type: "enableProjector",
            custom: true
        });
        state.addListener('activateTab', () => {
            const win = treeUpdate_js_3.getViewWindow(state);
            const { activeTarget, lastTarget } = state;
            const lastCache = state.domCache.get(lastTarget);
            const cache = state.domCache.get(activeTarget);
            if (!cache) {
                state.clearViewport();
                state.getDOMSnapshot(true);
            }
            else {
                // save scroll position of last target before we update window
                // using block scope oorah
                if (lastCache) {
                    const { pageXOffset: scrollX, pageYOffset: scrollY } = win;
                    Object.assign(lastCache, { scrollX, scrollY });
                }
                state.clearViewport();
                //updateTree(cache, state); 
                // restore scroll position of new target
                const { scrollX, scrollY } = cache;
                treeUpdate_js_3.scrollTo({ scrollX, scrollY }, state);
            }
        });
    }
    exports_46("default", installPlugin);
    function clearDomCache({ navigated }, state) {
        const { targetId } = navigated;
        state.domCache.delete(targetId);
    }
    function handleNavigate({ navigated }, state) {
        clearDomCache({ navigated }, state);
        if (navigated.url.startsWith('http')) {
            state.scrollToTopOnNextTreeUpdate = navigated;
            state.getDOMSnapshot();
        }
        else {
            state.clearViewport();
        }
    }
    return {
        setters: [
            function (treeUpdate_js_3_1) {
                treeUpdate_js_3 = treeUpdate_js_3_1;
            },
            function (createListener_js_3_1) {
                createListener_js_3 = createListener_js_3_1;
            }
        ],
        execute: function () {
        }
    };
});
System.register("voodoo/src/constructor", ["voodoo/src/handlers/selectInput", "voodoo/src/handlers/targetInfo", "voodoo/src/handlers/demo", "voodoo/src/handlers/keysCanInput", "voodoo/src/handlers/elementInfo", "voodoo/src/handlers/scrollNotify", "voodoo/src/handlers/loadingIndicator", "voodoo/src/handlers/favicon", "voodoo/src/eventQueue", "voodoo/src/transformEvent", "voodoo/src/common", "voodoo/src/view", "plugins/demo/installPlugin", "plugins/appminifier/installPlugin", "plugins/projector/installPlugin"], function (exports_47, context_47) {
    "use strict";
    var selectInput_js_1, targetInfo_js_1, demo_js_1, keysCanInput_js_1, elementInfo_js_1, scrollNotify_js_1, loadingIndicator_js_3, favicon_js_1, eventQueue_js_1, transformEvent_js_2, common_js_18, view_js_1, installPlugin_js_1, installPlugin_js_2, installPlugin_js_3, ThrottledEvents, SessionlessEvents, IMMEDIATE, SHORT_DELAY, LONG_DELAY, VERY_LONG_DELAY, EVENT_THROTTLE_MS, latestRequestId;
    var __moduleName = context_47 && context_47.id;
    async function voodoo(selector, position, { postInstallTasks: postInstallTasks = [], preInstallTasks: preInstallTasks = [], canvasBondTasks: canvasBondTasks = [], bondTasks: bondTasks = [], useViewFrame: useViewFrame = false, demoMode: demoMode = false, } = {}) {
        const sessionToken = location.hash && location.hash.slice(1);
        location.hash = '';
        const closed = new Set();
        const listeners = new Map();
        const lastTarget = '[lastTarget]';
        const { tabs, activeTarget, requestId } = await (demoMode ? demo_js_1.fetchDemoTabs() : targetInfo_js_1.fetchTabs({ sessionToken }));
        latestRequestId = requestId;
        const state = {
            H,
            // bandwidth
            totalBytes: 0,
            totalBytesThisSecond: 0,
            totalBandwidth: 0,
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
            convertTypingEventsToSyncValueEvents: common_js_18.isFirefox() && common_js_18.deviceIsMobile(),
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
        const updateTabs = common_js_18.debounce(rawUpdateTabs, LONG_DELAY);
        if (state.demoMode) {
            state.demoEventConsumer = demo_js_1.demoZombie;
        }
        if (common_js_18.DEBUG.dev) {
            Object.assign(self, { state });
        }
        const queue = new eventQueue_js_1.default(state, sessionToken);
        // plugins 
        const plugins = new Map;
        if (state.useViewFrame) {
            installPlugin_js_2.default(state, queue);
            if (location.pathname == "/factory.html") {
                installPlugin_js_3.default(state, queue);
            }
            if (state.demoMode) {
                installPlugin_js_1.default(state, queue);
            }
        }
        if (common_js_18.isSafari()) {
            queue.send({ type: "isSafari" });
        }
        if (common_js_18.isFirefox()) {
            queue.send({ type: "isFirefox" });
        }
        if (common_js_18.deviceIsMobile()) {
            state.hideScrollbars();
        }
        // event handlers
        // input
        queue.addMetaListener('selectInput', meta => selectInput_js_1.handleSelectMessage(meta, state));
        queue.addMetaListener('keyInput', meta => keysCanInput_js_1.handleKeysCanInputMessage(meta, state));
        queue.addMetaListener('favicon', meta => favicon_js_1.handleFaviconMessage(meta, state));
        queue.addMetaListener('navigated', () => canKeysInput());
        queue.addMetaListener('navigated', ({ navigated: { targetId } }) => favicon_js_1.resetFavicon({ targetId }, state));
        //queue.addMetaListener('navigated', meta => takeShot(meta, state));
        // element info
        queue.addMetaListener('elementInfo', meta => elementInfo_js_1.handleElementInfo(meta, state));
        // scroll
        queue.addMetaListener('scroll', meta => scrollNotify_js_1.handleScrollNotification(meta, state));
        // loading
        queue.addMetaListener('resource', meta => loadingIndicator_js_3.showLoadingIndicator(meta, state));
        queue.addMetaListener('navigated', meta => loadingIndicator_js_3.resetLoadingIndicator(meta, state));
        if (common_js_18.DEBUG.val >= common_js_18.DEBUG.med) {
            queue.addMetaListener('navigated', meta => console.log(meta));
            queue.addMetaListener('changed', meta => console.log(meta));
            queue.addMetaListener('created', meta => console.log(meta));
            queue.addMetaListener('attached', meta => console.log(meta));
            queue.addMetaListener('detached', meta => console.log(meta));
            queue.addMetaListener('destroyed', meta => console.log(meta));
            queue.addMetaListener('crashed', meta => console.log(meta));
            queue.addMetaListener('consoleMessage', meta => console.log(meta));
        }
        // patch tabs array with changes as they come through
        queue.addMetaListener('changed', ({ changed }) => {
            const tab = findTab(changed.targetId);
            if (tab) {
                Object.assign(tab, changed);
                view_js_1.subviews.TabList(state);
            }
            updateTabs({ changed });
        });
        // tabs
        queue.addMetaListener('created', meta => {
            if (meta.created.type == 'page') {
                if (common_js_18.DEBUG.activateNewTab) {
                    if (meta.created.url == 'about:blank' || meta.created.url == '') {
                        state.updateTabsTasks.push(() => setTimeout(() => activateTab(null, meta.created), LONG_DELAY));
                    }
                }
                updateTabs();
            }
        });
        queue.addMetaListener('attached', meta => {
            const attached = meta.attached.targetInfo;
            if (attached.type == 'page') {
                state.attached.add(attached.targetId);
                if (state.useViewFrame) {
                    sizeBrowserToBounds(state.viewState.viewFrameEl, true);
                }
                else {
                    asyncSizeBrowserToBounds(state.viewState.canvasEl);
                    emulateNavigator();
                }
                updateTabs();
            }
        });
        queue.addMetaListener('navigated', updateTabs);
        queue.addMetaListener('detached', updateTabs);
        queue.addMetaListener('destroyed', ({ destroyed }) => {
            closed.delete(destroyed.targetId);
            updateTabs();
        });
        queue.addMetaListener('crashed', updateTabs);
        //modals
        queue.addMetaListener('modal', modalMessage => view_js_1.subviews.openModal(modalMessage, state));
        // remote secure downloads
        queue.addMetaListener('download', ({ download }) => {
            const { sessionId } = download;
            const modal = {
                sessionId,
                type: 'notice',
                message: `Please purchase a license to use secure file view in Community-Edition. To purchase a license mail cris@dosycorp.com to speak with someone who will help.`,
                title: "SecureView\u2122",
            };
            view_js_1.subviews.openModal({ modal }, state);
        });
        queue.addMetaListener('secureview', ({ secureview }) => {
            const { url } = secureview;
            if (url) {
                createTab(null, url);
            }
        });
        // HTTP auth
        queue.addMetaListener('authRequired', ({ authRequired }) => {
            const { requestId } = authRequired;
            const modal = {
                requestId,
                type: 'auth',
                message: `Provide credentials to continue`,
                title: `HTTP Auth`,
            };
            view_js_1.subviews.openModal({ modal }, state);
        });
        // File chooser 
        queue.addMetaListener('fileChooser', ({ fileChooser }) => {
            const { sessionId, mode } = fileChooser;
            const modal = {
                sessionId, mode,
                type: 'filechooser',
                message: `Securely send files to the remote page.`,
                title: `File Chooser`,
            };
            view_js_1.subviews.openModal({ modal }, state);
        });
        // bond tasks 
        canvasBondTasks.push(indicateNoOpenTabs);
        canvasBondTasks.push(installZoomListener);
        canvasBondTasks.push(asyncSizeBrowserToBounds);
        if (common_js_18.isSafari()) {
            canvasBondTasks.push(installSafariLongTapListener);
        }
        bondTasks.push(canKeysInput);
        bondTasks.push(getFavicon);
        bondTasks.push(installTopLevelKeyListeners);
        const preInstallView = { queue };
        for (const task of preInstallTasks) {
            try {
                task(preInstallView);
            }
            catch (e) {
                console.error(`Task ${task} failed with ${e}`);
            }
        }
        view_js_1.component(state).to(selector, position);
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
            switchTab: () => 1,
        };
        const pluginView = { addToQueue, subscribeToQueue, requestRender, api };
        const poppetView = { loadPlugin, api };
        const postInstallView = { queue };
        await common_js_18.sleep(0);
        for (const task of postInstallTasks) {
            try {
                task(postInstallView);
            }
            catch (e) {
                console.error(`Task ${task} failed with ${e}`);
            }
        }
        if (activeTarget) {
            activateTab(null, { targetId: activeTarget });
        }
        return poppetView;
        // closures
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
            if (!funcList || funcList.length == 0)
                return false;
            let score = false;
            for (const func of funcList) {
                try {
                    func(data);
                    score = score || true;
                }
                catch (e) {
                    console.log(`Listeners func for ${name} fails: ${func}\nError: ${e + e.stack}`);
                }
            }
            return score;
        }
        function findTab(id) {
            return state.tabs.find(({ targetId }) => id == targetId);
        }
        function activeTab() {
            return state.tabs.length == 1 ? state.tabs[0] : findTab(state.activeTarget) || {};
        }
        function indicateNoOpenTabs() {
            if (state.tabs.length == 0) {
                clearViewport();
                if (state.useViewFrame) {
                    try {
                        state.viewState.viewFrameEl.contentDocument.body.innerHTML = `
                <em>${state.factoryMode ? 'Factory Mode' : 'Custom Mode'}. No tabs open.</em>
              `;
                    }
                    catch (e) {
                        console.warn(e);
                    }
                }
                else {
                    writeCanvas("All tabs closed.");
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
        function clearViewport() {
            if (state.useViewFrame) {
                try {
                    state.viewState.viewFrameEl.contentDocument.body.innerHTML = ``;
                }
                catch (e) {
                    console.warn(e);
                }
            }
            else {
                const canv = state.viewState.canvasEl;
                const ctx = state.viewState.ctx;
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canv.width, canv.height);
            }
        }
        /*function sendKey(keyEvent) {
          const {viewState} = state;
          if ( document.activeElement !== viewState.keyinput && document.activeElement !== viewState.textarea ) {
            let ev = keyEvent;
            if ( keyEvent.key == "Tab" || keyEvent.key == "Space" ) {
              event.preventDefault();
              ev = cloneKeyEvent(event, true);
            }
            H(ev);
          }
        }*/
        function installTopLevelKeyListeners() {
            //self.addEventListener('keydown', sendKey); 
            //self.addEventListener('keyup', sendKey); 
        }
        function installSafariLongTapListener(el) {
            const FLAGS = { passive: true, capture: true };
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
                const movement = Math.hypot(touch2.pageX - touch1.pageX, touch2.pageY - touch1.pageY);
                // time
                const duration = tf.timeStamp - lastStart.timeStamp;
                if (duration > MIN_DURATION && movement < MAX_MOVEMENT) {
                    lastStart.preventDefault();
                    tf.preventDefault();
                    const { pageX, pageY, clientX, clientY } = touch1;
                    el.dispatchEvent(new CustomEvent('contextmenu', { detail: { pageX, pageY, clientX, clientY } }));
                }
            }
        }
        function installZoomListener(el) {
            const FLAGS = { passive: true };
            let lastScale = 1.0;
            let scaling = false;
            let startDist = 0;
            let lastDist = 0;
            let touch;
            el.addEventListener('touchstart', begin, FLAGS);
            el.addEventListener('touchmove', move, FLAGS);
            el.addEventListener('touchend', end, FLAGS);
            el.addEventListener('touchcancel', end, FLAGS);
            el.addEventListener('wheel', sendZoom, { passive: true, capture: true });
            function sendZoom(event) {
                if (event.ctrlKey || event.deltaZ != 0) {
                    const delta = event.deltaZ || event.deltaY;
                    const direction = Math.sign(delta);
                    let multiplier;
                    if (direction > 0) {
                        multiplier = 1 / 1.25;
                    }
                    else {
                        multiplier = 1.25;
                    }
                    const scale = lastScale * multiplier;
                    lastScale = scale;
                    common_js_18.DEBUG.val > common_js_18.DEBUG.low && console.log('sending zoom ' + scale);
                    H({ synthetic: true,
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
                    }
                    else {
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
                    if (lastDist < 8) {
                        // do nothing, 
                    }
                    else {
                        const scale = lastScale * Math.abs(lastDist / startDist);
                        lastScale = scale;
                        common_js_18.DEBUG.val > common_js_18.DEBUG.low && console.log('sending zoom ' + scale);
                        H({ synthetic: true,
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
                if (SessionlessEvents.has(event.type)) {
                    common_js_18.DEBUG.val > common_js_18.DEBUG.low && console.log(`passing through sessionless event of type ${event.type}`);
                }
                else
                    return;
            }
            const mouseEventOnPointerDevice = event.type.startsWith("mouse") && event.type !== "wheel" && !state.DoesNotSupportPointerEvents;
            const tabKeyPressForBrowserUI = event.key == "Tab" && !event.vRetargeted;
            const eventCanBeIgnored = mouseEventOnPointerDevice || tabKeyPressForBrowserUI;
            if (eventCanBeIgnored)
                return;
            const pointerEvent = event.type.startsWith("pointer");
            const mouseWheel = event.type == "wheel";
            const syntheticNonTypingEventWrapper = event.synthetic && event.type != "typing" && event.event;
            if (mouseWheel) {
                // do nothing
            }
            else if (pointerEvent) {
                state.DoesNotSupportPointerEvents = false;
            }
            else if (syntheticNonTypingEventWrapper) {
                event.event.preventDefault && event.event.preventDefault();
            }
            const simulated = event.event && event.event.simulated;
            const hasTarget = event.event && event.event.target;
            if (event.type == "typing" && hasTarget
                && !simulated && state.convertTypingEventsToSyncValueEvents) {
                event.type = 'typing-syncValue';
                event.value = event.event.target.value;
                event.contextId = state.contextIdOfFocusedInput;
                event.data = "";
            }
            const isThrottled = ThrottledEvents.has(event.type);
            const transformedEvent = transformEvent_js_2.default(event);
            if (mouseWheel) {
                transformedEvent.contextId = state.viewState.latestScrollContext;
            }
            if (isThrottled) {
                queue.send(transformedEvent);
            }
            else {
                if (event.type == "keydown" && event.key == "Enter") {
                    // We do this to make sure we send composed input data when enter is pressed
                    // in an input field, if we do not do this, the current composition is not printed
                    if (!!state.latestData && !!event.target.matches('input') && state.latestData.length > 1) {
                        queue.send(transformEvent_js_2.default({
                            synthetic: true,
                            type: 'typing',
                            data: state.latestData,
                            event: { enterKey: true, simulated: true }
                        }));
                        state.latestCommitData = state.latestData;
                        state.latestData = "";
                    }
                }
                else if (event.type == "keydown" && event.key == "Backspace") {
                    state.backspaceFiring = true;
                }
                else if (event.type == "keyup" && event.key == "Backspace") {
                    state.backspaceFiring = false;
                }
                else if (event.type == "pointerdown" || event.type == "mousedown") {
                    //const {timeStamp,type} = event;
                    const { latestData } = state;
                    if (!!state.viewState.shouldHaveFocus && !!latestData && latestData.length > 1 && latestData != state.latestCommitData) {
                        state.isComposing = false;
                        const data = latestData;
                        queue.send(transformEvent_js_2.default({
                            synthetic: true,
                            type: 'typing',
                            data: data,
                            event: { pointerDown: true, simulated: true }
                        }));
                        state.latestCommitData = data;
                        state.latestData = "";
                    }
                }
                else if (event.type == "pointerup" || event.type == "mouseup") {
                    if (state.viewState.killNextMouseReleased) {
                        state.viewState.killNextMouseReleased = false;
                        return;
                    }
                }
                queue.send(transformedEvent);
            }
        }
        function sizeBrowserToBounds(el, firstTime = false) {
            let { width, height } = el.getBoundingClientRect();
            width = Math.round(width);
            height = Math.round(height);
            const { innerWidth: iw, outerWidth: ow, innerHeight: ih, outerHeight: oh } = window;
            const { width: w, availWidth: aw, height: h, availHeight: ah } = screen;
            width = iw;
            if (common_js_18.DEBUG.val > common_js_18.DEBUG.high) {
                common_js_18.logit({ iw, ow, ih, oh, width, height, w, aw, h, ah });
            }
            if (!el.dataset.sized && (el.width != width || el.height != height)) {
                el.dataset.sized = true;
                el.width = width;
                el.height = height;
            }
            const mobile = common_js_18.deviceIsMobile();
            if (firstTime) {
                H({ synthetic: true,
                    type: "window-bounds",
                    width: width + (mobile ? 0 : 17),
                    mobile,
                    height: height + 64,
                    targetId: state.activeTarget
                });
            }
            H({ synthetic: true,
                type: "window-bounds-preImplementation",
                width: width + (mobile ? 0 : 17),
                height,
                mobile,
                targetId: state.activeTarget
            });
            self.ViewportWidth = width;
            self.ViewportHeight = height;
        }
        /*function sizeTab() {
          return sizeBrowserToBounds(state.viewState.canvasEl);
        }*/
        function asyncSizeBrowserToBounds(el) {
            setTimeout(() => (sizeBrowserToBounds(el, true), indicateNoOpenTabs()), 0);
        }
        function emulateNavigator() {
            const { platform, userAgent, language: acceptLanguage } = navigator;
            H({ synthetic: true,
                type: "user-agent",
                userAgent, platform, acceptLanguage
            });
        }
        function hideScrollbars() {
            H({ synthetic: true,
                type: "hide-scrollbars",
            });
        }
        async function activateTab(click, tab) {
            click && click.preventDefault();
            if (state.activeTarget == tab.targetId) {
                if (state.viewState.omniBoxInput == state.viewState.lastActive) {
                    state.viewState.omniBoxInput.focus();
                }
                return;
            }
            const { targetId } = tab;
            queue.send({
                command: {
                    name: "Target.activateTarget",
                    params: { targetId },
                    requiresShot: true,
                }
            });
            //sizeTab();
            canKeysInput();
            state.lastTarget = state.activeTarget;
            state.activeTarget = targetId;
            // we assume that a listener will call clearviewport
            // this returns false if there are no listeners
            if (!runListeners('activateTab')) {
                clearViewport();
            }
            state.active = activeTab();
            view_js_1.subviews.TabList(state);
            view_js_1.subviews.OmniBox(state);
            view_js_1.subviews.LoadingIndicator(state);
            setTimeout(() => {
                if (state.active && state.active.url != common_js_18.BLANK) {
                    canKeysInput();
                }
                else {
                    writeCanvas("Secure RemoteView Tab.");
                    state.viewState.omniBoxInput.focus();
                }
            }, SHORT_DELAY);
        }
        async function closeTab(click, tab, index) {
            const { targetId } = tab;
            closed.add(targetId);
            loadingIndicator_js_3.resetLoadingIndicator({ navigated: targetId }, state);
            setTimeout(() => closed.delete(targetId), VERY_LONG_DELAY);
            const events = [
                {
                    command: {
                        name: "Target.closeTarget",
                        params: { targetId },
                    }
                }
            ];
            await queue.send(events);
            state.tabs.splice(index, 1);
            if (state.activeTarget == targetId) {
                if (state.tabs.length == 0) {
                    state.activeTarget = null;
                }
                else {
                    if (index >= state.tabs.length) {
                        index = state.tabs.length - 1;
                    }
                    const newActive = state.tabs[index];
                    activateTab(click, newActive);
                }
            }
            else {
                updateTabs();
            }
            view_js_1.subviews.TabList(state);
            view_js_1.subviews.LoadingIndicator(state);
        }
        async function rawUpdateTabs() {
            let { tabs, activeTarget, requestId } = await (demoMode ? demo_js_1.fetchDemoTabs() : targetInfo_js_1.fetchTabs({ sessionToken }));
            tabs = tabs.filter(({ targetId }) => !closed.has(targetId));
            if (requestId <= latestRequestId) {
                return;
            }
            else {
                latestRequestId = requestId;
            }
            state.tabs = tabs;
            if (demoMode) {
                state.activeTarget = activeTarget;
            }
            state.active = activeTab();
            if (!state.activeTarget || !state.active) {
                if (state.tabs.length) {
                    await activateTab(null, state.tabs[0]);
                }
            }
            view_js_1.subviews.Controls(state);
            view_js_1.subviews.TabList(state);
            if (state.tabs.length == 0) {
                indicateNoOpenTabs();
            }
            while (state.updateTabsTasks.length) {
                const task = state.updateTabsTasks.shift();
                try {
                    task();
                }
                catch (e) {
                    console.warn("State update tabs task failed", e, task);
                }
            }
        }
        async function createTab(click, url = common_js_18.BLANK) {
            queue.send({
                command: {
                    name: "Target.createTarget",
                    params: {
                        url,
                        enableBeginFrameControl: common_js_18.DEBUG.frameControl
                    },
                }
            });
        }
        function canKeysInput() {
            if (state.viewState.viewFrameEl)
                return;
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
        function addToQueue( /*...events*/) {
            console.warn("Unimplemented");
        }
        function requestRender( /*pluginRenderedView*/) {
            console.warn("Unimplemented");
        }
        function subscribeToQueue( /*name, listener*/) {
            console.warn("Unimplemented");
        }
    }
    exports_47("default", voodoo);
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
    exports_47("cloneKeyEvent", cloneKeyEvent);
    return {
        setters: [
            function (selectInput_js_1_1) {
                selectInput_js_1 = selectInput_js_1_1;
            },
            function (targetInfo_js_1_1) {
                targetInfo_js_1 = targetInfo_js_1_1;
            },
            function (demo_js_1_1) {
                demo_js_1 = demo_js_1_1;
            },
            function (keysCanInput_js_1_1) {
                keysCanInput_js_1 = keysCanInput_js_1_1;
            },
            function (elementInfo_js_1_1) {
                elementInfo_js_1 = elementInfo_js_1_1;
            },
            function (scrollNotify_js_1_1) {
                scrollNotify_js_1 = scrollNotify_js_1_1;
            },
            function (loadingIndicator_js_3_1) {
                loadingIndicator_js_3 = loadingIndicator_js_3_1;
            },
            function (favicon_js_1_1) {
                favicon_js_1 = favicon_js_1_1;
            },
            function (eventQueue_js_1_1) {
                eventQueue_js_1 = eventQueue_js_1_1;
            },
            function (transformEvent_js_2_1) {
                transformEvent_js_2 = transformEvent_js_2_1;
            },
            function (common_js_18_1) {
                common_js_18 = common_js_18_1;
            },
            function (view_js_1_1) {
                view_js_1 = view_js_1_1;
            },
            function (installPlugin_js_1_1) {
                installPlugin_js_1 = installPlugin_js_1_1;
            },
            function (installPlugin_js_2_1) {
                installPlugin_js_2 = installPlugin_js_2_1;
            },
            function (installPlugin_js_3_1) {
                installPlugin_js_3 = installPlugin_js_3_1;
            }
        ],
        execute: function () {
            ThrottledEvents = new Set([
                "mousemove", "pointermove", "touchmove"
            ]);
            SessionlessEvents = new Set([
                "window-bounds",
                "window-bounds-preImplementation",
                "user-agent",
                "hide-scrollbars"
            ]);
            IMMEDIATE = 0;
            SHORT_DELAY = 20;
            LONG_DELAY = 300;
            VERY_LONG_DELAY = 60000;
            EVENT_THROTTLE_MS = 40; /* 20, 40, 80 */
            // view frame debug
            latestRequestId = 0;
        }
    };
});
System.register("voodoo/index", ["voodoo/src/constructor"], function (exports_48, context_48) {
    "use strict";
    var constructor_js_2, USE_BOTH;
    var __moduleName = context_48 && context_48.id;
    function Voodoo({ api, translator, image, useViewFrame: useViewFrame = false, demoMode: demoMode = false, } = {}, selector, position = 'beforeEnd') {
        let root;
        if (!selector) {
            console.warn(`Did not specify a root to attach to. Assuming it's the first found from either the body tag, or the document element.`);
            root = document.body || document.documentElement;
        }
        else if (typeof selector == "string") {
            root = document.querySelector(selector);
        }
        else if (selector instanceof HTMLElement) {
            root = selector;
        }
        if (!USE_BOTH && useViewFrame) {
            console.log(`Using a view frame instead of a canvas.`);
        }
        else {
            if (!image) {
                console.warn(`Did not specify an image to act as the screen, searching for one descending from root`);
                image = root.querySelector('img');
                if (!image) {
                    console.warn(`No image found! Creating one...`);
                    image = new Image();
                    root.appendChild(image);
                }
            }
            else if (typeof image == "string") {
                root = document.querySelector(image);
            }
            else if (!(image instanceof HTMLImageElement)) {
                throw new TypeError(`A valid image was not found`);
            }
            image.style.display = 'none';
        }
        if (!api) {
            // assume the root api is same
            // but warn
            console.warn(`Did not specify an API, assuming it's ${location}`);
            api = location.href;
        }
        if (!translator) {
            console.warn(`Did not specify a translator, will send RAW Voodoo commands to API`);
            translator = e => e;
        }
        return constructor_js_2.default(root, position, {
            useViewFrame,
            demoMode,
            preInstallTasks: [
                poppet => poppet.queue.addSubscriber(api, translator, image)
            ],
            postInstallTasks: []
        });
    }
    exports_48("default", Voodoo);
    return {
        setters: [
            function (constructor_js_2_1) {
                constructor_js_2 = constructor_js_2_1;
            }
        ],
        execute: function () {
            // view frame debug
            USE_BOTH = false;
        }
    };
});
System.register("getAPI", [], function (exports_49, context_49) {
    "use strict";
    var __moduleName = context_49 && context_49.id;
    function getAPI() {
        const api = new URL(location);
        api.hash = '';
        api.search = '';
        api.protocol = api.protocol == 'https:' ? 'wss:' : 'ws:';
        let url = api.href + '';
        const hashIndex = url.indexOf('#');
        if (hashIndex >= 0) {
            url = url.slice(0, hashIndex);
        }
        return url;
    }
    exports_49("default", getAPI);
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("canvas-start-app", ["voodoo/index", "getAPI", "translateVoodooCRDP"], function (exports_50, context_50) {
    "use strict";
    var index_js_3, getAPI_js_1, translateVoodooCRDP_js_2;
    var __moduleName = context_50 && context_50.id;
    async function start_app() {
        const useViewFrame = false;
        const translator = translateVoodooCRDP_js_2.default;
        const voodoo = await index_js_3.default({ api: getAPI_js_1.default(), translator, useViewFrame });
        self.voodoo = voodoo;
        return voodoo;
    }
    return {
        setters: [
            function (index_js_3_1) {
                index_js_3 = index_js_3_1;
            },
            function (getAPI_js_1_1) {
                getAPI_js_1 = getAPI_js_1_1;
            },
            function (translateVoodooCRDP_js_2_1) {
                translateVoodooCRDP_js_2 = translateVoodooCRDP_js_2_1;
            }
        ],
        execute: function () {
            start_app();
        }
    };
});
System.register("plugins/appminifier/translateAppminifierCRDP", ["voodoo/src/common", "translateVoodooCRDP", "kbd"], function (exports_51, context_51) {
    "use strict";
    var common_js_19, translateVoodooCRDP_js_3, translateVoodooCRDP_js_4, kbd_js_3, Overrides, SHORT_TIMEOUT, INTERACTION_EDGE, NONE, DOM_DELTA_PIXEL, DOM_DELTA_LINE, DOM_DELTA_PAGE, LINE_HEIGHT_GUESS, BOXCACHE, BUTTON, SYNTHETIC_CTRL;
    var __moduleName = context_51 && context_51.id;
    function translator(e, handled = { type: 'case' }) {
        handled.type = handled.type || 'case';
        const TranslatedE = translateVoodooCRDP_js_3.default(e, handled);
        const alreadyHandled = handled.type == 'case';
        const weDoNotOverrideHandling = !Overrides.has(e.type);
        if (alreadyHandled && weDoNotOverrideHandling) {
            return TranslatedE;
        }
        switch (e.type) {
            /** overrides **/
            case "wheel":
                return NONE;
            case "mousemove":
            case "pointermove":
                return NONE;
            case "mousedown":
            case "mouseup":
            case "pointerdown":
            case "pointerup": {
                const { generation, dataId, x, y, width, height, clientX, clientY, modifiers, button } = e;
                const mouseButton = BUTTON[button] || "none";
                const key = `${dataId}:${generation}`;
                let boundingBox;
                if (BOXCACHE.has(key)) {
                    boundingBox = BOXCACHE.get(key);
                    const { X, Y } = projectEventIntoBox({ boundingBox, clientX, clientY, x, y, width, height });
                    return {
                        command: {
                            name: "Input.emulateTouchFromMouseEvent",
                            params: {
                                x: Math.round(X),
                                y: Math.round(Y),
                                type: e.type.endsWith("down") ? "mousePressed" :
                                    e.type.endsWith("up") ? "mouseReleased" : "mouseMoved",
                                button: mouseButton,
                                clickCount: !e.type.endsWith("move") ? 1 : 0,
                                modifiers
                            },
                            requiresShot: e.type.endsWith("down")
                        }
                    };
                }
                else {
                    BOXCACHE.clear();
                    return [
                        {
                            command: {
                                name: "Runtime.evaluate",
                                params: {
                                    expression: `getBoundingBox({generation:"${generation}",dataId:"${dataId}"});`,
                                    awaitPromise: true,
                                    contextId: e.contextId,
                                    timeout: SHORT_TIMEOUT,
                                    returnByValue: true
                                },
                            },
                        },
                        (resp) => {
                            if (resp && resp.result && resp.result.value) {
                                ({ boundingBox } = resp.result.value);
                            }
                            if (boundingBox) {
                                BOXCACHE.set(key, boundingBox);
                                const { X, Y } = projectEventIntoBox({ boundingBox, clientX, clientY, x, y, width, height });
                                return {
                                    command: {
                                        name: "Input.emulateTouchFromMouseEvent",
                                        params: {
                                            x: Math.round(X),
                                            y: Math.round(Y),
                                            type: e.type.endsWith("down") ? "mousePressed" :
                                                e.type.endsWith("up") ? "mouseReleased" : "mouseMoved",
                                            button: mouseButton,
                                            clickCount: !e.type.endsWith("move") ? 1 : 0,
                                            modifiers
                                        },
                                        requiresShot: e.type.endsWith("down")
                                    }
                                };
                            }
                        }
                    ];
                }
                break;
            }
            /** new events handled by Appminifier **/
            case "demo-submit": {
                return {
                    command: "Demo.formSubmission",
                    params: e
                };
            }
            case "getDOMTree": {
                const force = e.force;
                return [
                    {
                        command: {
                            isZombieLordCommand: true,
                            name: "Connection.getContextIdsForActiveSession",
                            params: {
                                worldName: translateVoodooCRDP_js_4.WorldName
                            }
                        }
                    },
                    ({ contextIds: contextIds = [] }) => contextIds.map(contextId => ({
                        command: {
                            name: "Runtime.evaluate",
                            params: {
                                expression: `getDOMTree(${force});`,
                                contextId: contextId,
                                timeout: SHORT_TIMEOUT
                            },
                        }
                    }))
                ];
            }
            case "scrollToEnd": {
                // if we use emulateTouchFromMouseEvent we need a button value
                const deltaX = adjustWheelDeltaByMode(0, DOM_DELTA_PAGE);
                const deltaY = adjustWheelDeltaByMode(0.5, DOM_DELTA_PAGE);
                const retVal = mouseEvent(e.originalEvent, deltaX, deltaY);
                return retVal;
                break;
            }
            case "scrollToZig": {
                const { zig } = e;
                if (!zig)
                    return;
                const { x, y, width, height, clientX, clientY, pageX, pageY } = e;
                const [dataId, generation] = zig.split(' ');
                common_js_19.DEBUG.val >= common_js_19.DEBUG.med && console.log(`scroll to zig ${dataId} ${generation}`);
                return [
                    {
                        command: {
                            name: "Runtime.evaluate",
                            params: {
                                expression: `getBoundingBox({generation:"${generation}",dataId:"${dataId}"});`,
                                awaitPromise: true,
                                contextId: e.contextId,
                                timeout: SHORT_TIMEOUT,
                                returnByValue: true
                            },
                        },
                    }
                    /**
                     (resp) => {
                       let boundingBox;
                       if ( resp && resp.result && resp.result.value ) {
                         ({boundingBox} = resp.result.value);
                       }
                       const deltaY = boundingBox.y - boundingBox.scrollTop;
                       if ( !! boundingBox ) {
                         const {X,Y} = projectEventIntoBox({boundingBox, clientX, clientY, x, y, width, height});
                         return mouseEvent({X,Y}, 0, deltaY);
                       }
                     }
                    **/
                ];
                break;
            }
            case "typing-clearAndInsertValue": {
                if (!e.value)
                    return;
                return {
                    command: {
                        name: "Runtime.evaluate",
                        params: {
                            expression: `clearFocusedInputAndInsertValue("${e.encodedValue}");`,
                            includeCommandLineAPI: false,
                            userGesture: true,
                            contextId: e.contextId,
                            timeout: SHORT_TIMEOUT,
                            awaitPromise: true
                        },
                        requiresShot: false
                    }
                };
                break;
            }
            case "enableAppminifier": {
                return {
                    command: {
                        isZombieLordCommand: true,
                        name: "Connection.enableMode",
                        params: {
                            pluginName: 'appminifier'
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
                    x: Math.round(e.X || 0),
                    y: Math.round(e.Y || 0),
                    type: e.type || "mouseWheel",
                    deltaX, deltaY
                },
                requiresShot: true
            }
        };
    }
    function keyEvent(e, modifiers = false, SYNTHETIC = false) {
        common_js_19.DEBUG.val >= common_js_19.DEBUG.med && console.log(e);
        const id = e.key && e.key.length > 1 ? e.key : e.code;
        const def = kbd_js_3.default[id];
        const text = e.originalType == "keypress" ? String.fromCharCode(e.keyCode) : undefined;
        modifiers = Number.isInteger(modifiers) ? modifiers :
            Number.isInteger(e.originalEvent && e.originalEvent.modifiers) ? e.originalEvent.modifiers :
                Number.isInteger(e.modifiers) ? e.modifiers : 0;
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
    function adjustWheelDeltaByMode(delta, mode) {
        switch (mode) {
            case DOM_DELTA_PIXEL:
                break;
            case DOM_DELTA_LINE:
                delta = delta * LINE_HEIGHT_GUESS;
                break;
            case DOM_DELTA_PAGE:
                delta = delta * self.ViewportHeight;
                break;
        }
        return delta;
    }
    function projectEventIntoBox({ boundingBox, clientX, clientY, x, y, width, height }) {
        const { x: newX, y: newY, width: Width, height: Height, innerWidth: RemoteIW, innerHeight: RemoteIH } = boundingBox;
        const originalBoxXRatio = (clientX - x) / width;
        const originalBoxYRatio = (clientY - y) / height;
        const X = bound(newX + Width * originalBoxXRatio, RemoteIW);
        const Y = bound(newY + Height * originalBoxYRatio, RemoteIH);
        return { X, Y };
    }
    function bound(val, upper) {
        // make sure we are not negative
        val = Math.max(val, INTERACTION_EDGE);
        if (val > upper - INTERACTION_EDGE) {
            val = upper - INTERACTION_EDGE;
        }
        return val;
    }
    return {
        setters: [
            function (common_js_19_1) {
                common_js_19 = common_js_19_1;
            },
            function (translateVoodooCRDP_js_3_1) {
                translateVoodooCRDP_js_3 = translateVoodooCRDP_js_3_1;
                translateVoodooCRDP_js_4 = translateVoodooCRDP_js_3_1;
            },
            function (kbd_js_3_1) {
                kbd_js_3 = kbd_js_3_1;
            }
        ],
        execute: function () {
            //export const WorldName = 'PlanetZanj-Appminifier';
            exports_51("Overrides", Overrides = new Set([
                'mousedown', 'mouseup', 'pointerdown', 'pointerup', 'wheel',
                'mousemove', 'pointermove'
            ]));
            SHORT_TIMEOUT = 1000;
            INTERACTION_EDGE = 2; // buffer of pixels where we don't trigger events
            NONE = null;
            DOM_DELTA_PIXEL = 0;
            DOM_DELTA_LINE = 1;
            DOM_DELTA_PAGE = 2;
            LINE_HEIGHT_GUESS = 22;
            BOXCACHE = new Map();
            BUTTON = ["left", "middle", "right"];
            SYNTHETIC_CTRL = e => keyEvent({ key: 'Control', originalType: e.originalType }, 2, true);
            exports_51("default", translator);
        }
    };
});
System.register("custom-start-app", ["voodoo/index", "getAPI", "plugins/appminifier/translateAppminifierCRDP"], function (exports_52, context_52) {
    "use strict";
    var index_js_4, getAPI_js_2, translateAppminifierCRDP_js_1;
    var __moduleName = context_52 && context_52.id;
    async function start_app() {
        const useViewFrame = true;
        const translator = translateAppminifierCRDP_js_1.default;
        const voodoo = await index_js_4.default({ api: getAPI_js_2.default(), translator, useViewFrame });
        self.voodoo = voodoo;
        return voodoo;
    }
    return {
        setters: [
            function (index_js_4_1) {
                index_js_4 = index_js_4_1;
            },
            function (getAPI_js_2_1) {
                getAPI_js_2 = getAPI_js_2_1;
            },
            function (translateAppminifierCRDP_js_1_1) {
                translateAppminifierCRDP_js_1 = translateAppminifierCRDP_js_1_1;
            }
        ],
        execute: function () {
            start_app();
        }
    };
});
// this file contains
// all polyfills
// found to be required
// even after Babel transpilation with preset-env 
// targeting older browsers was used
function EventTarget2() {
}
EventTarget2.prototype = Element.prototype;
self.EventTarget = self.EventTarget || EventTarget2;
System.register("dist-start", ["voodoo/index", "getAPI", "translateVoodooCRDP", "plugins/appminifier/translateAppminifierCRDP"], function (exports_53, context_53) {
    "use strict";
    var index_js_5, getAPI_js_3, translateVoodooCRDP_js_5, translateAppminifierCRDP_js_2;
    var __moduleName = context_53 && context_53.id;
    async function start_app() {
        const useViewFrame = false;
        const translator = useViewFrame ? translateAppminifierCRDP_js_2.default : translateVoodooCRDP_js_5.default;
        const voodoo = await index_js_5.default({ api: getAPI_js_3.default(), translator, useViewFrame });
        self.voodoo = voodoo;
        return voodoo;
    }
    return {
        setters: [
            function (index_js_5_1) {
                index_js_5 = index_js_5_1;
            },
            function (getAPI_js_3_1) {
                getAPI_js_3 = getAPI_js_3_1;
            },
            function (translateVoodooCRDP_js_5_1) {
                translateVoodooCRDP_js_5 = translateVoodooCRDP_js_5_1;
            },
            function (translateAppminifierCRDP_js_2_1) {
                translateAppminifierCRDP_js_2 = translateAppminifierCRDP_js_2_1;
            }
        ],
        execute: function () {
            start_app();
        }
    };
});
System.register("error_catchers", ["voodoo/src/common"], function (exports_54, context_54) {
    "use strict";
    var common_js_20;
    var __moduleName = context_54 && context_54.id;
    function setupErrorCatchers() {
        common_js_20.DEBUG.dev && (self.onerror = (v) => (func(v, extractMeat(v).message, extractMeat(v).stack, v + ''), true));
        common_js_20.DEBUG.dev && (self.onerror = (v) => (console.log(v), true));
        common_js_20.DEBUG.dev && (self.onunhandledrejection = ({ reason }) => (func(JSON.stringify(reason, null, 2)), true));
    }
    exports_54("default", setupErrorCatchers);
    function isMobile() {
        return (typeof window.orientation !== "undefined") || (navigator.userAgent.indexOf('IEMobile') !== -1);
    }
    function func() {
        if (isMobile()) {
            return (x) => {
                console.log(x);
                //alert(JSON.stringify(x));
                //throw x[0];
            };
        }
        else {
            return (...x) => console.log(...x);
        }
    }
    function extractMeat(list) {
        const meatIndex = list.findIndex(val => !!val && val.message || val.stack);
        if (meatIndex == -1 || meatIndex == undefined) {
            return "";
        }
        else {
            return list[meatIndex];
        }
    }
    return {
        setters: [
            function (common_js_20_1) {
                common_js_20 = common_js_20_1;
            }
        ],
        execute: function () {
            setupErrorCatchers();
        }
    };
});
System.register("plugins/projector/translateProjectorCRDP", ["translateVoodooCRDP"], function (exports_55, context_55) {
    "use strict";
    var translateVoodooCRDP_js_6, translateVoodooCRDP_js_7, Overrides, SHORT_TIMEOUT;
    var __moduleName = context_55 && context_55.id;
    function translator(e, handled = { type: 'case' }) {
        handled.type = handled.type || 'case';
        const TranslatedE = translateVoodooCRDP_js_6.default(e, handled);
        const alreadyHandled = handled.type == 'case';
        const weDoNotOverrideHandling = !Overrides.has(e.type);
        if (alreadyHandled && weDoNotOverrideHandling) {
            return TranslatedE;
        }
        switch (e.type) {
            case "enableProjector": {
                return {
                    command: {
                        isZombieLordCommand: true,
                        name: "Connection.enableMode",
                        params: {
                            pluginName: 'projector'
                        }
                    }
                };
            }
            case "getDOMSnapshot": {
                const force = e.force;
                return [
                    {
                        command: {
                            isZombieLordCommand: true,
                            name: "Connection.getContextIdsForActiveSession",
                            params: {
                                worldName: translateVoodooCRDP_js_7.WorldName
                            }
                        }
                    },
                    ({ contextIds: contextIds = [] }) => contextIds.map(contextId => ({
                        command: {
                            name: "Runtime.evaluate",
                            params: {
                                expression: `getDOMSnapshot(${force});`,
                                contextId: contextId,
                                timeout: SHORT_TIMEOUT
                            },
                        }
                    }))
                ];
            }
        }
        return e;
    }
    exports_55("default", translator);
    return {
        setters: [
            function (translateVoodooCRDP_js_6_1) {
                translateVoodooCRDP_js_6 = translateVoodooCRDP_js_6_1;
                translateVoodooCRDP_js_7 = translateVoodooCRDP_js_6_1;
            }
        ],
        execute: function () {
            //export const WorldName = 'PlanetZanj-Projector';
            exports_55("Overrides", Overrides = new Set([]));
            SHORT_TIMEOUT = 1000;
        }
    };
});
System.register("factory-start-app", ["voodoo/index", "getAPI", "plugins/projector/translateProjectorCRDP"], function (exports_56, context_56) {
    "use strict";
    var index_js_6, getAPI_js_4, translateProjectorCRDP_js_1;
    var __moduleName = context_56 && context_56.id;
    async function start_app() {
        const useViewFrame = true;
        const translator = translateProjectorCRDP_js_1.default;
        const voodoo = await index_js_6.default({ api: getAPI_js_4.default(), translator, useViewFrame });
        self.voodoo = voodoo;
        return voodoo;
    }
    return {
        setters: [
            function (index_js_6_1) {
                index_js_6 = index_js_6_1;
            },
            function (getAPI_js_4_1) {
                getAPI_js_4 = getAPI_js_4_1;
            },
            function (translateProjectorCRDP_js_1_1) {
                translateProjectorCRDP_js_1 = translateProjectorCRDP_js_1_1;
            }
        ],
        execute: function () {
            start_app();
        }
    };
});
System.register("image-start-app", ["voodoo/index", "getAPI", "translateVoodooCRDP"], function (exports_57, context_57) {
    "use strict";
    var index_js_7, getAPI_js_5, translateVoodooCRDP_js_8;
    var __moduleName = context_57 && context_57.id;
    async function start_app() {
        const useViewFrame = false;
        const translator = translateVoodooCRDP_js_8.default;
        const voodoo = await index_js_7.default({ api: getAPI_js_5.default(), translator, useViewFrame });
        self.voodoo = voodoo;
        return voodoo;
    }
    return {
        setters: [
            function (index_js_7_1) {
                index_js_7 = index_js_7_1;
            },
            function (getAPI_js_5_1) {
                getAPI_js_5 = getAPI_js_5_1;
            },
            function (translateVoodooCRDP_js_8_1) {
                translateVoodooCRDP_js_8 = translateVoodooCRDP_js_8_1;
            }
        ],
        execute: function () {
            start_app();
        }
    };
});
System.register("landing", [], function (exports_58, context_58) {
    "use strict";
    var __moduleName = context_58 && context_58.id;
    function Landing(state) {
        const { Wrap } = state.boilerplate;
        return Wrap(state, "Remote Browser Isolation", `
        <section class=content>
          <section class=introduction tabindex=0>
            <div class=story>
              <h1>Welcome to Safe Browsing.</h1>
              <p>
                In a world of risks, we offer you the simplest and best browser isolation 
                platform. 
              </p>
            </div>
            <div class=graphic>
              <img src=/images/3rd-party/undraw/security.svg>
            </div>
          </section>
        </section>
     `, `
          <section class=content>
            <section class=introduction tabindex=0>
              <div class=graphic>
                <img src=/images/3rd-party/undraw/securityon.svg>
              </div>
              <div class=story>
                <h1>Customer-First Security.</h1>
                <p>
                  We put the customer first, and provide the 
                  most similar experience to browsing on your normal insecure browser, without
                  the risks. Our fault-tolerant browser-as-a-service infrastructure 
                  enables the secure and reliable provision of fully managed, 
                  fully hosted and fully remote cloud browsers, at whatever scale you require.
                  Our familiar web client looks and feels just like using your regular insecure browser, 
                  and runs in all modern and legacy platforms, no downloads required, even on mobile.
                </p>
              </div>
            </section>
            <section class=protection tabindex=0>
              <div class=story>
                <h1>More Private. More Secure. More Control.</h1>
                <p>
                  BrowserGap never runs any JavaScript, applets, CSS or HTML from the remote page on your machine or network. By totally isolating your infrastructure form the risks of the web, it means that malware, exploits, ransomware, adware and other web risks cannot harm you operations.
                </p>
              </div>
              <div class=graphic>
                <img src=/images/3rd-party/undraw/safe.svg>
              </div>
            </section>
            <section class=security tabindex=0>
              <div class=graphic>
                <img src=/images/3rd-party/undraw/container.svg>
              </div>
              <div class=story>
                <h1>The Highest Security. Complete Isolation.</h1>
                <p>
                  BrowserGap never runs any remote code on your machine. Ever. We never run any JavaScript, applets, CSS and not even one tag of HTML on your machine that comes from the remote browser. Our platform is the only browser isolation system that can run on any device, and never runs any code on your machine. We provide a fully interactive image of the remote web page, that looks and feels just like browsing on your favorite consumer browser, but without any of the regular risks associated with that. 
                </p>
              </div>
            </section>
            <section class=introduction tabindex=0>
              <hr class=diagonal>
              <div class=graphic>
                <img src=/images/3rd-party/undraw/future.svg>
              </div>
              <div class=story>
                <h1>What is Browser isolation?</h1>
                <p>
                  Browser isolation is a security practise where you isolate 
                  your network from the internet. All browsing is conducted over a secure channel, using an isolated, and remote, cloud browser. 
                </p>
              </div>
            </section>
            <section class=introduction tabindex=0>
              <div class=points>
                <h1>What is BrowserGap?</h1>
                <ul>
                  <li>Secure browsing, familiar interface. 
                  <li>Browser isolation vendor
                  <li>Cloud browser provider
                  <li>Remote browser product
                  <li>No install or download required.
                  <li>Browser-as-a-service
                </ul>
              </div>
              <div class=graphic>
                <img src=/images/3rd-party/undraw/question.svg>
              </div>
            </section>
            <section class=introduction tabindex=0>
              <div class=graphic>
                <img src=/images/3rd-party/undraw/helpfulsign.svg>
              </div>
              <div class=story>
                <h1>BrowserGap. The difference is the way it works.</h1>
                <p>
                  BrowserGap is just one of many browser isolation vendors. You should pick the best vendor for your particular needs. BrowserGap focuses on providing excellent customer support, and the most similar user interface and experience to a regular insecure browser, without the risks. 
                </p>
              </div>
            </section>
            <section class=security tabindex=0>
              <div class=points>
                <h1>How does BrowserGap protect my privacy and security?</h1>
                <ul>
                  <li>Remote cloud browsers
                  <li>Complete browser isolation
                  <li>Threat containment
                  <li>All execution happens in remote DMZ
                  <li>Codeless "interactive image" technology
                  <li>Zero trust security
                  <li>No JavaScript, cookies, HTML/CSS from the remote web page are sent to you, ever.
                </ul>
              </div>
              <div class=graphic>
                <img src=/images/3rd-party/undraw/privacy.svg>
              </div>
            </section>
            <section class=introduction tabindex=0>
              <div class=graphic>
                <img src=/images/3rd-party/undraw/undraw_hologram_fjwp.svg>
              </div>
              <div class=story>
                <h1>How does browser isolation help secure my network?</h1>
                <p>
                  Our full isolation system means never is any JavaScript code, images, HTML, CSS or other assets from a remote page sent to you. You interact with the internet via a secure layer, similar to a scientist doing experiments in a fume hood or hazmat isolation in a biological safety cabinet. The principle is very similar with our total isolation system ensuring a constant "negative pressure" from the web to you. Meaning that no web content actually reaches you, except via a holographic image of that content that is fully interactive yet totally inert. 
                </p>
              </div>
            </section>
            <section class=protection tabindex=0>
              <div class=points>
                <h1>What does BrowserGap stop?</h1>
                <ul>
                  <li>Zero-day exploits
                  <li>Malicious websites and webapps
                  <li>Browser exploitation
                  <li>Malware and viruses
                  <li>Device rootkits
                  <li>Adware and tracking
                  <li>Ransomware
                </ul>
              </div>
              <div class=graphic>
                <img src=/images/3rd-party/undraw/cleanup.svg>
              </div>
            </section>
            <section class=reliability tabindex=0>
              <div class=graphic>
                <img src=/images/3rd-party/undraw/mobilebrowsers.svg>
              </div>
              <div class=story>
                <h1>Looks and feels just like a normal browser.</h1>
                <p>
                  BrowserGap provides a fully interactive image of the remote web page, that looks and feels just like browsing on your favorite consumer browser, but without any of the regular risks associated with that. You can easily open new tabs, watch video (at a reduced frame rate), download files and even play audio.
                </p>
              </div>
            </section>
            <section class=reliability tabindex=0>
              <div class=points>
                <h1>How high-maintenance is BrowserGap?</h1>
                <ul>
                  <li>Fully managed
                  <li>Fully hosted
                  <li>Completely familiar browser interface
                  <li>Zero or minimal training required
                  <li>Per-seat, subscription pricing
                </ul>
              </div>
              <div class=graphic>
                <img src=/images/3rd-party/undraw/chill.svg>
              </div>
            </section>
            <section class=cta>
              <a href=#membership-application class="register toggle-opener">
                <span class=verbose-name>Apply for Membership</span> Now
              </a>
            </section>
          </section>
  `);
    }
    exports_58("default", Landing);
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("pages/about", [], function (exports_59, context_59) {
    "use strict";
    var __moduleName = context_59 && context_59.id;
    function About(state) {
        const { Wrap } = state.boilerplate;
        return Wrap(state, "About BrowserGap", `
        <section class=content>
          <section class=introduction tabindex=0>
            <div class=story>
              <h1>About BrowserGap.</h1>
              <h2>A product of The Dosyago Corporation</h2>
            </div>
            <div class=graphic>
              <img src=/images/3rd-party/undraw/instruct.svg>
            </div>
          </section>
        </section>
    `, `
        <section class=content>
          <section class=story>
            <div class=document>
              <h1>The Origin</h1>
              <p>
                We started as a web-scraping platform product in 2017. Delivering a web-scraping experience to anyone anywhere using a browser, has a lot of parallels with delivering a browsing experience to anyone anywhere using a browser. They both involve browsers running in the cloud.
              <p>
                After analyzing the market for web-scraping products, we decided that, despite the favorable legal environment that was emerging for web data scraping, the time was not yet right for a solution similar to what we were planning. 
              <p>
                At around the same time we discovered a class of products that would enable a lot of reuse of our existing technolgoy, code and expertise. That was web browser isolation. So we shifted gears at the end of 2018 to build such a product. Initially we concieved it as a way to deliver the same content by converting it into pixels in the cloud and save bandwidth and battery as there was no local computation.
              <h1>Something Big</h1>
              <p>
                The more we looked into the web browser isolation market, the more we liked it. We had always dreamed of selling to large organizations, and building a truly B2B product. In some sense, our planned scraping offering was an attempt to fit a pseudo-democratised data-scraping solution into a B2B mold. Discovering the possibility to deliver a product that was more naturally a B2B fit, and also one that overlapped interests we already had, was very encouraging. 
              <p>
                Things turned even more encouraging when we discovered the nascent nature of the market, the DARPA request for information about vendors and the large degree of fit between our existing system and what a reliable cloud-based browser isolation service would require. 
              <h1>Looking Forward</h1>
              <p>
                We aim to be the simplest browser isolation solution. This is not just a philosophy. Simplicity is a core tennet of security, similar to the way that a larger codebase will attract a larger number of bugs than a smaller one: a larger system will accrue a larger number of attack vectors than a smaller system. 
              <p>
                We also see a key point of differentiation of our offering being that the experience of using BrowserGap is the most similar to using a regular web browser. Tabs are there. Incognito mode. Websites look and work the same as they normally would. You can persist cookies for common sites from day to day. This, again is not just a philosophy. We believe firmly that simplicity and usability are core tennets of security. How secure is a secure channel that nobody uses? The answer is it's not secure at all because it contributes zero net security to the intended users. 
            </div>
          </section>
        </section>
  `);
    }
    exports_59("About", About);
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("pages/training", [], function (exports_60, context_60) {
    "use strict";
    var __moduleName = context_60 && context_60.id;
    function Training(state) {
        const { Wrap } = state.boilerplate;
        return Wrap(state, "Tutorials and Support Reading Room", `
        <section class=content>
          <section class=introduction tabindex=0>
            <div class=story>
              <h1>Training, tutorials and support room.</h1>
            </div>
            <div class=graphic>
              <img src=/images/3rd-party/undraw/instruct.svg>
            </div>
          </section>
        </section>
    `, `
          <section class=content>
            <section class=protection tabindex=0>
              <div class="points graphic">
                <a href=/pages/document-reading-room/history-of-browser-gap.html>
                  <h1>History of Browser Gap</h1>
                  <img src=/images/3rd-party/undraw/backintheday.svg>
                </a>
              </div>
              <div class="points graphic">
                <a href=/pages/document-reading-room/threats-facing-the-web-user.html>
                  <h1>Threats Facing the Web User</h1>
                  <img src=/images/3rd-party/undraw/escape.svg>
                </a>
              </div>
              <div class="points graphic">
                <a href=/pages/document-reading-room/browser-gap-an-overview-of-features.html>
                  <h1>BrowserGap: An Overview of Features</h1>
                  <img src=/images/3rd-party/undraw/inbloom.svg>
                </a>
              </div>
              <div class="points graphic">
                <a target=_blank href=https://www.youtube.com/channel/UCxyWgnYfo8TvSJWc9n_vVcQ>
                  <h1>BrowserGap Training Videos</h1>
                  <img src=/images/3rd-party/undraw/instruct.svg>
                </a>
              </div>
            </section>
          </section>
  `);
    }
    exports_60("Training", Training);
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("pages/pricing", [], function (exports_61, context_61) {
    "use strict";
    var __moduleName = context_61 && context_61.id;
    function Pricing(state) {
        const { Wrap } = state.boilerplate;
        return Wrap(state, "Per-seat Subscription Pricing", `
        <section class=content>
          <section class=header tabindex=0>
            <div class=story>
              <h1>The Clock is Ticking on Browser Security.</h1>
              <p>
                Spend a little time and get the most secure, and most familiar, browsing experience.
              </p>
            </div>
            <div class=graphic>
              <img src=/images/3rd-party/undraw/serious.svg>
            </div>
          </section>
        </section>
    `, `
          <section class=content>
            <section class=pricing tabindex=0>
              <div class=graphic>
                <img src=/images/3rd-party/undraw/hacker.svg>
              </div>
              <div class=points>
                <h1>How much time are you willing to invest in your security?</h1>
                <ul>
                  <li>Unlimited tabs per browser. 
                  <li>Multiple people can use the same browser.
                  <li>It's just like a workstation, except secure, only a browser and in the cloud.
                  <li>Ticket-based support.
                  <li>Security of BrowserGap's Total Isolation Solution.
                </ul>
              </div>
            </section>
            <section class=cta>
              <div class="price points">
                <h1>BrowserGap Rubicon.</h1>
                <p>
                  Monthly Package
                </p>
                <p>
                  USD $22.22 per month.
                </p>
              </div>
              <a href=#membership-application class="register toggle-opener">
                <span class=verbose-name>Apply for Membership</span> Now
              </a>
            </section>
            <section class=danger>
              <div class=points>
                <a href=/pages/case-study/uk-corporate-website-malware-attack.html>
                  <h1>100s of Employee Computers Infected via Browser: A Case Study</h1>
                  <p>
                    Read about the security exploits and web-based vulnerability that occured at a large UK company.
                  </p>
                </a>
              </div>
            </section>
            <section class=danger>
              <div class=graphic>
                <img src=/images/3rd-party/undraw/scary.svg>
              </div>
              <div class=story>
                <h1>Time's up for browser security.</h1>
                <p>
                  Don't expose yourself to avoidable risks. Take action today, before it's too late.
                  Engage BrowserGap now to contain these risks before they infect your infrastructure.
                </p>
              </div>
            </section>
          </section>
  `);
    }
    exports_61("Pricing", Pricing);
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("pages/cloudBrowsers", [], function (exports_62, context_62) {
    "use strict";
    var __moduleName = context_62 && context_62.id;
    function CloudBrowsers(state) {
        const { Wrap } = state.boilerplate;
        return Wrap(state, "Remote Cloud Browser Isolation Service", `
        <section class=content>
          <section class=introduction tabindex=0>
            <div class=story>
              <h1>Fully-Remote Cloud-based Browser Isolation Service.</h1>
              <p>
                The simplest and best browser isolation 
                platform, using fully isolated, fully remote cloud browsers.
              </p>
            </div>
              <div class=graphic>
                <img src=/images/3rd-party/undraw/safe.svg>
              </div>
          </section>
        </section>
    `, `
          <section class=content>
            <section class=introduction tabindex=0>
              <div class=graphic>
                <img src=/images/3rd-party/undraw/securityon.svg>
              </div>
              <div class=story>
                <h1>Total Isolation Solution.</h1>
                <p>
                  The simplest and best browser isolation 
                  platform. We put the customer first, and provide the 
                  most similar experience to browsing on your local machine, without
                  the risks. Our fault-tolerant browser-as-a-service infrastructure 
                  enables the secure provision of fully managed, 
                  fully hosted and fully remote cloud browsers. 
                  Our familiar web client looks and feels just like using your popular web browser, 
                  and runs in all modern and legacy browsers, even on mobile.
                </p>
              </div>
            </section>
            <section class=reliability tabindex=0>
              <div class=story>
                <h1>Bespoke Deployments.</h1>
                <p>
                  Custom URL filtering. Domain blacklisting and whitelisting. 
                  Reach out to us for more possibilities.
                </p>
              </div>
              <div class=graphic>
                <img src=/images/3rd-party/undraw/software.svg>
              </div>
            </section>
            <section class=protection tabindex=0>
              <div class=graphic>
                <img src=/images/3rd-party/undraw/logistic.svg>
              </div>
              <div class=story>
                <h1>Fully managed.</h1>
                <p>
                  BrowserGap never runs any remote code on your machine. Ever. We also strip out most ads using adblocking technology on the remote browser. We never run any JavaScript, applets, CSS and not even one tag of HTML on your machine that comes from the remote browser. This means that malware, exploits, ransomware, adware and other web risks cannot harm you or your infrastructure.         
                </p>
              </div>
            </section>
          </section>
  `);
    }
    exports_62("CloudBrowsers", CloudBrowsers);
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("pages/fiveElements", [], function (exports_63, context_63) {
    "use strict";
    var __moduleName = context_63 && context_63.id;
    function FiveElements(state) {
        const { Wrap } = state.boilerplate;
        return Wrap(state, "Five Elements of BrowserGap Security", `
        <section class=content>
          <section class=introduction tabindex=0>
            <div class=story>
              <h1>Five Elements Strong.</h1>
              <p>
                The Five Elements of Enhanced Web Security.
              </p>
            </div>
            <div class=graphic>
              <img src=/images/3rd-party/undraw/five.svg>
            </div>
          </section>
        </section>
    `, `
          <section class=content>
            <section class=five-elements tabindex=0>
              <div class=graphic>
                <img src=/images/3rd-party/undraw/connection.svg>
              </div>
              <div class=points>
                <h1>Total Isolation Solution</h1>
                <h1>Codeless Interactive Image Client</h1>
                <p>
                  BrowserGap never runs any remote code on your machine. Ever. We also strip out most ads using adblocking technology on the remote browser. We never run any JavaScript, applets, CSS and not even one tag of HTML on your machine that comes from the remote browser. This means that malware, exploits, ransomware, adware and other web risks cannot harm you or your infrastructure.         
                </p>
              </div>
            </section>
            <section class=five-elements tabindex=0>
              <div class=points>
                <h1>Familiar Browsing Experience</h1>
                <p>
                  BrowserGap never runs any remote code on your machine. Ever. We also strip out most ads using adblocking technology on the remote browser. We never run any JavaScript, applets, CSS and not even one tag of HTML on your machine that comes from the remote browser. This means that malware, exploits, ransomware, adware and other web risks cannot harm you or your infrastructure.         
                </p>
              </div>
              <div class=graphic>
                <img src=/images/3rd-party/undraw/familiar.svg>
              </div>
            </section>
            <section class=five-elements tabindex=0>
              <div class=graphic>
                <img src=/images/3rd-party/undraw/world.svg>
              </div>
              <div class=points>
                <h1>Remote cloud browsers.</h1>
                <p>
                  BrowserGap never runs any remote code on your machine. Ever. We also strip out most ads using adblocking technology on the remote browser. We never run any JavaScript, applets, CSS and not even one tag of HTML on your machine that comes from the remote browser. This means that malware, exploits, ransomware, adware and other web risks cannot harm you or your infrastructure.         
                </p>
              </div>
            </section>
            <section class=five-elements tabindex=0>
              <div class=points>
                <h1>Single-tenant architecture</h1>
                <p>
                  BrowserGap never runs any remote code on your machine. Ever. We also strip out most ads using adblocking technology on the remote browser. We never run any JavaScript, applets, CSS and not even one tag of HTML on your machine that comes from the remote browser. This means that malware, exploits, ransomware, adware and other web risks cannot harm you or your infrastructure.         
                </p>
              </div>
              <div class=graphic>
                <img src=/images/3rd-party/undraw/secserver.svg>
              </div>
            </section>
            <section class=five-elements tabindex=0>
              <div class=graphic>
                <img src=/images/3rd-party/undraw/webdevice.svg>
              </div>
              <div class=points>
                <h1>Any browser. Any device. No downloads or installs.</h1>
                <p>
                  BrowserGap never runs any remote code on your machine. Ever. We also strip out most ads using adblocking technology on the remote browser. We never run any JavaScript, applets, CSS and not even one tag of HTML on your machine that comes from the remote browser. This means that malware, exploits, ransomware, adware and other web risks cannot harm you or your infrastructure.         
                </p>
              </div>
            </section>
          </section>
  `);
    }
    exports_63("FiveElements", FiveElements);
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("pages/document-reading-room/history", [], function (exports_64, context_64) {
    "use strict";
    var __moduleName = context_64 && context_64.id;
    function History(state) {
        const { Wrap } = state.boilerplate;
        return Wrap(state, "Reading Room: History of BrowserGap", `
        <section class="longform content">
          <section class=introduction tabindex=0>
            <div class=graphic>
              <img src=/images/3rd-party/undraw/backintheday.svg>
            </div>
            <div class=story>
              <h1>History of BrowserGap</h1>
              <p>
                Where we come from helps guide where we will choose to go in future.
              </p>
            </div>
          </section>
        </section>
    `, `
          <section class="longform content">
            <p>
              BrowserGap began in the winter of 2012, with a RFQ for some price data to be scraped from 
              various online auction sites.
            <p>
              This project grew into a general web scraper product, which came to adopt the goal of 
              being deliverable without download, through any browser, to any one. You could scrape
              the web, while in the web, so to speak.
            <p>
              That requirement necessitated running a browser somewhere other than on the client which 
              a simple web app could then talk to, and provide the simulation of being in the browser, 
              when in fact one was only controlling and viewing a remote browser.
            <p>
              As the competition for web scrapers thickened, and the market landscape sloped toward
              two peaks: enterprise and free, we decided to pivot to a more sustainable niche.
          </section>
  `);
    }
    exports_64("History", History);
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("pages/document-reading-room/threats", [], function (exports_65, context_65) {
    "use strict";
    var __moduleName = context_65 && context_65.id;
    function Threats(state) {
        const { Wrap } = state.boilerplate;
        return Wrap(state, "Reading Room: The Threats Facing the Web User", `
        <section class="longform content">
          <section class=introduction tabindex=0>
            <div class=story>
              <h1>Web Browsing: Threats to the User</h1>
              <p>
                A codex arcana of awfulness plaguing the web.
              </p>
            </div>
            <div class=graphic>
              <img src=/images/3rd-party/undraw/escape.svg>
            </div>
          </section>
        </section>
    `, `
          <section class="longform content">

          </section>
  `);
    }
    exports_65("Threats", Threats);
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("pages/document-reading-room/features", [], function (exports_66, context_66) {
    "use strict";
    var __moduleName = context_66 && context_66.id;
    function Features(state) {
        const { Wrap } = state.boilerplate;
        return Wrap(state, "Reading Room: An Overview of BrowserGap Features", `
        <section class="longform content">
          <section class=introduction tabindex=0>
            <div class=story>
              <h1>BrowserGap Features</h1>
              <p>
                A catalog of mostly wonderful things.
              </p>
            </div>
            <div class=graphic>
              <img src=/images/3rd-party/undraw/inbloom.svg>
            </div>
          </section>
        </section>
    `, `
          <section class="longform content">

          </section>
  `);
    }
    exports_66("Features", Features);
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("pages/document-reading-room/index", ["pages/document-reading-room/history", "pages/document-reading-room/threats", "pages/document-reading-room/features"], function (exports_67, context_67) {
    "use strict";
    var __moduleName = context_67 && context_67.id;
    function exportStar_2(m) {
        var exports = {};
        for (var n in m) {
            if (n !== "default") exports[n] = m[n];
        }
        exports_67(exports);
    }
    return {
        setters: [
            function (history_js_1_1) {
                exportStar_2(history_js_1_1);
            },
            function (threats_js_1_1) {
                exportStar_2(threats_js_1_1);
            },
            function (features_js_1_1) {
                exportStar_2(features_js_1_1);
            }
        ],
        execute: function () {
        }
    };
});
System.register("pages/legal-room/terms", [], function (exports_68, context_68) {
    "use strict";
    var __moduleName = context_68 && context_68.id;
    function Terms(state) {
        const { Wrap } = state.boilerplate;
        return Wrap(state, "Terms and Conditions", `
      <section class=content> 
        <section class=introduction>
          <div class=story>
            <h1>Terms & Conditions</h1>
          </div>
        </section>
      </section>
    `, `
        <section class=content>
          <section class=legal>
            <div class=document>
              <h2><strong>Terms and Conditions</strong></h2>

              <p>Welcome to BrowserGap!</p>

              <p>These terms and conditions outline the rules and regulations for the use of The Dosyago Corporation's Website, located at https://browsergap.xyz.</p>

              <p>By accessing this website we assume you accept these terms and conditions. Do not continue to use BrowserGap if you do not agree to take all of the terms and conditions stated on this page.               
              <p>The following terminology applies to these Terms and Conditions, Privacy Statement and Disclaimer Notice and all Agreements: "Client", "You" and "Your" refers to you, the person log on this website and compliant to the Company’s terms and conditions. "The Company", "Ourselves", "We", "Our" and "Us", refers to our Company. "Party", "Parties", or "Us", refers to both the Client and ourselves. All terms refer to the offer, acceptance and consideration of payment necessary to undertake the process of our assistance to the Client in the most appropriate manner for the express purpose of meeting the Client’s needs in respect of provision of the Company’s stated services, in accordance with and subject to, prevailing law of Netherlands. Any use of the above terminology or other words in the singular, plural, capitalization and/or he/she or they, are taken as interchangeable and therefore as referring to same.</p>

              <h3><strong>Cookies</strong></h3>

              <p>We employ the use of cookies. By accessing BrowserGap, you agreed to use cookies in agreement with the The Dosyago Corporation's Privacy Policy.</p>

              <p>Most interactive websites use cookies to let us retrieve the user’s details for each visit. Cookies are used by our website to enable the functionality of certain areas to make it easier for people visiting our website. Some of our affiliate/advertising partners may also use cookies.</p>

              <h3><strong>License</strong></h3>

              <p>Unless otherwise stated, The Dosyago Corporation and/or its licensors own the intellectual property rights for all material on BrowserGap. All intellectual property rights are reserved. You may access this from BrowserGap for your own personal use subjected to restrictions set in these terms and conditions.</p>

              <p>You must not:</p>
              <ul>
                  <li>Republish material from BrowserGap</li>
                  <li>Sell, rent or sub-license material from BrowserGap</li>
                  <li>Reproduce, duplicate or copy material from BrowserGap</li>
                  <li>Redistribute content from BrowserGap</li>
              </ul>

              <p>This Agreement shall begin on the date hereof.</p>

              <p>Parts of this website offer an opportunity for users to post and exchange opinions and information in certain areas of the website. The Dosyago Corporation does not filter, edit, publish or review Comments prior to their presence on the website. Comments do not reflect the views and opinions of The Dosyago Corporation,its agents and/or affiliates. Comments reflect the views and opinions of the person who post their views and opinions. To the extent permitted by applicable laws, The Dosyago Corporation shall not be liable for the Comments or for any liability, damages or expenses caused and/or suffered as a result of any use of and/or posting of and/or appearance of the Comments on this website.</p>

              <p>The Dosyago Corporation reserves the right to monitor all Comments and to remove any Comments which can be considered inappropriate, offensive or causes breach of these Terms and Conditions.</p>

              <p>You warrant and represent that:</p>

              <ul>
                  <li>You are entitled to post the Comments on our website and have all necessary licenses and consents to do so;</li>
                  <li>The Comments do not invade any intellectual property right, including without limitation copyright, patent or trademark of any third party;</li>
                  <li>The Comments do not contain any defamatory, libelous, offensive, indecent or otherwise unlawful material which is an invasion of privacy</li>
                  <li>The Comments will not be used to solicit or promote business or custom or present commercial activities or unlawful activity.</li>
              </ul>

              <p>You hereby grant The Dosyago Corporation a non-exclusive license to use, reproduce, edit and authorize others to use, reproduce and edit any of your Comments in any and all forms, formats or media.</p>

              <h3><strong>Hyperlinking to our Content</strong></h3>

              <p>The following organizations may link to our Website without prior written approval:</p>

              <ul>
                  <li>Government agencies;</li>
                  <li>Search engines;</li>
                  <li>News organizations;</li>
                  <li>Online directory distributors may link to our Website in the same manner as they hyperlink to the Websites of other listed businesses; and</li>
                  <li>System wide Accredited Businesses except soliciting non-profit organizations, charity shopping malls, and charity fundraising groups which may not hyperlink to our Web site.</li>
              </ul>

              <p>These organizations may link to our home page, to publications or to other Website information so long as the link: (a) is not in any way deceptive; (b) does not falsely imply sponsorship, endorsement or approval of the linking party and its products and/or services; and (c) fits within the context of the linking party’s site.</p>

              <p>We may consider and approve other link requests from the following types of organizations:</p>

              <ul>
                  <li>commonly-known consumer and/or business information sources;</li>
                  <li>dot.com community sites;</li>
                  <li>associations or other groups representing charities;</li>
                  <li>online directory distributors;</li>
                  <li>internet portals;</li>
                  <li>accounting, law and consulting firms; and</li>
                  <li>educational institutions and trade associations.</li>
              </ul>

              <p>We will approve link requests from these organizations if we decide that: (a) the link would not make us look unfavorably to ourselves or to our accredited businesses; (b) the organization does not have any negative records with us; (c) the benefit to us from the visibility of the hyperlink compensates the absence of The Dosyago Corporation; and (d) the link is in the context of general resource information.</p>

              <p>These organizations may link to our home page so long as the link: (a) is not in any way deceptive; (b) does not falsely imply sponsorship, endorsement or approval of the linking party and its products or services; and (c) fits within the context of the linking party’s site.</p>

              <p>If you are one of the organizations listed in paragraph 2 above and are interested in linking to our website, you must inform us by sending an e-mail to The Dosyago Corporation. Please include your name, your organization name, contact information as well as the URL of your site, a list of any URLs from which you intend to link to our Website, and a list of the URLs on our site to which you would like to link. Wait 2-3 weeks for a response.</p>

              <p>Approved organizations may hyperlink to our Website as follows:</p>

              <ul>
                  <li>By use of our corporate name; or</li>
                  <li>By use of the uniform resource locator being linked to; or</li>
                  <li>By use of any other description of our Website being linked to that makes sense within the context and format of content on the linking party’s site.</li>
              </ul>

              <p>No use of The Dosyago Corporation's logo or other artwork will be allowed for linking absent a trademark license agreement.</p>

              <h3><strong>iFrames</strong></h3>

              <p>Without prior approval and written permission, you may not create frames around our Webpages that alter in any way the visual presentation or appearance of our Website.</p>

              <h3><strong>Content Liability</strong></h3>

              <p>We shall not be hold responsible for any content that appears on your Website. You agree to protect and defend us against all claims that is rising on your Website. No link(s) should appear on any Website that may be interpreted as libelous, obscene or criminal, or which infringes, otherwise violates, or advocates the infringement or other violation of, any third party rights.</p>

              <h3><strong>Your Privacy</strong></h3>

              <p>Please read Privacy Policy</p>

              <h3><strong>Reservation of Rights</strong></h3>

              <p>We reserve the right to request that you remove all links or any particular link to our Website. You approve to immediately remove all links to our Website upon request. We also reserve the right to amen these terms and conditions and it’s linking policy at any time. By continuously linking to our Website, you agree to be bound to and follow these linking terms and conditions.</p>

              <h3><strong>Removal of links from our website</strong></h3>

              <p>If you find any link on our Website that is offensive for any reason, you are free to contact and inform us any moment. We will consider requests to remove links but we are not obligated to or so or to respond to you directly.</p>

              <p>We do not ensure that the information on this website is correct, we do not warrant its completeness or accuracy; nor do we promise to ensure that the website remains available or that the material on the website is kept up to date.</p>

              <h3><strong>Disclaimer</strong></h3>

              <p>To the maximum extent permitted by applicable law, we exclude all representations, warranties and conditions relating to our website and the use of this website. Nothing in this disclaimer will:</p>

              <ul>
                  <li>limit or exclude our or your liability for death or personal injury;</li>
                  <li>limit or exclude our or your liability for fraud or fraudulent misrepresentation;</li>
                  <li>limit any of our or your liabilities in any way that is not permitted under applicable law; or</li>
                  <li>exclude any of our or your liabilities that may not be excluded under applicable law.</li>
              </ul>

              <p>The limitations and prohibitions of liability set in this Section and elsewhere in this disclaimer: (a) are subject to the preceding paragraph; and (b) govern all liabilities arising under the disclaimer, including liabilities arising in contract, in tort and for breach of statutory duty.</p>

              <p>As long as the website and the information and services on the website are provided free of charge, we will not be liable for any loss or damage of any nature.</p>
            </div>
          </section>
        </section>
  `);
    }
    exports_68("Terms", Terms);
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("pages/legal-room/privacy", [], function (exports_69, context_69) {
    "use strict";
    var __moduleName = context_69 && context_69.id;
    function Privacy(state) {
        const { Wrap } = state.boilerplate;
        return Wrap(state, "Privacy Policy", `
      <section class=content> 
        <section class=introduction>
          <div class=story>
            <h1>Privacy Policy</h1>
          </div>
        </section>
      </section>
    `, `
      <section class=content>
        <section class=legal>
          <div class=document>
            <h1>Welcome to our Privacy Policy</h1>
            <h3>Your privacy is fundamentally important to us.</h3>
            The Dosyago Corporation is located at:<br/>
            <address>
              The Dosyago Corporation<br/>2035 Sunset Lake Rd, Newark <br />19702 - DE , United States<br/>13862300027			
						</address>
						<time>Last revised on October 15, 2019</time>
            <h1>Introduction</h1>
            <p>
              The Dosyago Corporation will collect certain non-personally identify information about you as you use our sites. We may use this data to better understand our users. We can also publish this data, but the data will be about a large group of users, not individuals.
            <p>
              We will also ask you to provide personal information, but you'll always be able to opt out. If you give us personal information, we won't do anything evil with it.
            <p>
              We can also use cookies, but you can choose not to store these.
            <p>
              That's the basic idea, but you must read through the entire Privacy Policy below and agree with all the details before you use any of our sites.
						<h1>Reuse</h1>
              This document is based upon the Automattic Privacy Policy and is licensed under Creative Commons Attribution Share-Alike License 2.5. Basically, this means you can use it verbatim or edited, but you must release new versions under the same license and you have to credit Automattic somewhere (like this!). Automattic is not connected with and does not sponsor or endorse The Dosyago Corporation or its use of the work.
            <p>
              The Dosyago Corporation, Inc. ("The Dosyago Corporation") makes available services include our web sites (https://browsergap.xyz and https://dosyago.com), our blog, our API, and any other software, sites, and services offered by The Dosyago Corporation in connection to any of those (taken together, the "Service"). It is The Dosyago Corporation's policy to respect your privacy regarding any information we may collect while operating our websites.

						<h1>Questions</h1>
            <p>
              If you have question about this Privacy Policy, please contact us at cris@dosyago.com

						<h1>Visitors</h1>
            <p>
              Like most website operators, The Dosyago Corporation collects non-personally-identifying information of the sort that web browsers and servers typically make available, such as the browser type, language preference, referring site, and the date and time of each visitor request. The Dosyago Corporation's purpose in collecting non-personally identifying information is to better understand how The Dosyago Corporation's visitors use its website. From time to time, The Dosyago Corporation may release non-personally-identifying information in the aggregate, e.g., by publishing a report on trends in the usage of its website.
            <p>
              The Dosyago Corporation also collects potentially personally-identifying information like Internet Protocol (IP) addresses. The Dosyago Corporation does not use such information to identify its visitors, however, and does not disclose such information, other than under the same circumstances that it uses and discloses personally-identifying information, as described below. We may also collect and use IP addresses to block users who violated our Terms of Service.

						<h1>Gathering of Personally-Identifying Information</h1>
            <p>
              Certain visitors to The Dosyago Corporation's websites choose to interact with The Dosyago Corporation in ways that require The Dosyago Corporation to gather personally-identifying information. The amount and type of information that The Dosyago Corporation gathers depends on the nature of the interaction. The Dosyago Corporation collects such information only insofar as is necessary or appropriate to fulfill the purpose of the visitor's interaction with The Dosyago Corporation. The Dosyago Corporation does not disclose personally-identifying information other than as described below. And visitors can always refuse to supply personally-identifying information, with the caveat that it may prevent them from engaging in certain Service-related activities.

            <p>
              Additionally, some interactions, such as posting a comment, may ask for optional personal information. For instance, when posting a comment, may provide a website that will be displayed along with a user's name when the comment is displayed. Supplying such personal information is completely optional and is only displayed for the benefit and the convenience of the user.

						<h1>Aggregated Statistics</h1>
            <p>
              The Dosyago Corporation may collect statistics about the behavior of visitors to the Service. For instance, The Dosyago Corporation may monitor the most popular parts of the https://browsergap.xyz. The Dosyago Corporation may display this information publicly or provide it to others. However, The Dosyago Corporation does not disclose personally-identifying information other than as described below.

						<h1>Protection of Certain Personally-Identifying Information</h1>
            <p>
              The Dosyago Corporation discloses potentially personally-identifying and personally-identifying information only to those of its employees, contractors and affiliated organizations that (i) need to know that information in order to process it on The Dosyago Corporation's behalf or to provide services available at The Dosyago Corporation's websites, and (ii) that have agreed not to disclose it to others. Some of those employees, contractors and affiliated organizations may be located outside of your home country; by using the Service, you consent to the transfer of such information to them. The Dosyago Corporation will not rent or sell potentially personally-identifying and personally-identifying information to anyone. Other than to its employees, contractors and affiliated organizations, as described above, The Dosyago Corporation discloses potentially personally-identifying and personally-identifying information only when required to do so by law, or when The Dosyago Corporation believes in good faith that disclosure is reasonably necessary to protect the property or rights of The Dosyago Corporation, third parties or the public at large. If you are a registered user of the Service and have supplied your email address, The Dosyago Corporation may occasionally send you an email to tell you about new features, solicit your feedback, or just keep you up to date with what's going on with The Dosyago Corporation and our products. We primarily use our website and blog to communicate this type of information, so we expect to keep this type of email to a minimum. If you send us a request (for example via a support email or via one of our feedback mechanisms), we reserve the right to publish it in order to help us clarify or respond to your request or to help us support other users. The Dosyago Corporation takes all measures reasonably necessary to protect against the unauthorized access, use, alteration or destruction of potentially personally-identifying and personally-identifying information.

						<h1>Cookies</h1>
            <p>
              A cookie is a string of information that a website stores on a visitor's computer, and that the visitor's browser provides to the Service each time the visitor returns. The Dosyago Corporation uses cookies to help The Dosyago Corporation identify and track visitors, their usage of The Dosyago Corporation Service, and their Service access preferences. The Dosyago Corporation visitors who do not wish to have cookies placed on their computers should set their browsers to refuse cookies before using The Dosyago Corporation's websites, with the drawback that certain features of The Dosyago Corporation's websites may not function properly without the aid of cookies.

						<h1>Data Storage</h1>
            <p>
              The Dosyago Corporation uses third party vendors and hosting partners to provide the necessary hardware, software, networking, storage, and related technology required to run the Service. You understand that although you retain full rights to your data, it may be stored on third party storage and transmitted through third party networks.

						<h1>Privacy Policy Changes</h1>
            <p>
              Although most changes are likely to be minor, The Dosyago Corporation may change its Privacy Policy from time to time, and in The Dosyago Corporation's sole discretion. The Dosyago Corporation encourages visitors to frequently check this page for any changes to its Privacy Policy. Your continued use of this site after any change in this Privacy Policy will constitute your acceptance of such change.
          </div>
        </section>
      </section>
  `);
    }
    exports_69("Privacy", Privacy);
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("pages/legal-room/security", [], function (exports_70, context_70) {
    "use strict";
    var __moduleName = context_70 && context_70.id;
    function Security(state) {
        const { Wrap } = state.boilerplate;
        return Wrap(state, "Security Policy // Responsible Vulernability Disclosure Policy", `
      <section class=content> 
        <section class=introduction>
          <div class=story>
            <h1>Security Policy // Responsible Vulernability Disclosure Policy</h1>
          </div>
        </section>
      </section>
    `, `
      <section class=content>
        <section class=legal>
          <div class=document>
						<h1>Brand Promise</h1>
            <p>
              Keeping user information safe and secure is a top priority for us at The Dosyago Corporation, and we welcome the contribution of external security researchers to report vulnerabilities in a responsible manner for BrowserGap.
						<h1>Scope</h1>
            <p>
              If you believe you've found a security issue in any website, service, or software owned or operated by The Dosyago Corporation, we encourage you to notify us.
						<h1>How to Submit a Report</h1>
            <p>
              To submit a vulnerability report to The Dosyago Corporation, please contact us at cris@dosyago.com. Your submission will be reviewed and validated by a member of our security team.
						<h1>Safe Harbor</h1>
            <p>
              The Dosyago Corporation supports safe harbor for security researchers who:
            <ol>
              <li>Make a good faith effort to avoid privacy violations, destruction of data, and interruption or degradation of our services.
              <li>Only interact with accounts you own or with explicit permission of the account holder. If you do encounter Personally Identifiable Information (PII) contact us immediately, do not proceed with access, and immediately purge any local information.
              <li>Provide us with a reasonable amount of time to resolve vulnerabilities prior to any disclosure to the public or a third-party.
            </ol>
            <p>
              We will consider activities conducted consistent with this policy to constitute "authorized" conduct and will not pursue civil action or initiate a complaint to law enforcement. We will help to the extent we can if legal action is initiated by a third party against you.
            <p>
              Please submit a report to us before engaging in conduct that may be inconsistent with or unaddressed by this policy.
						<h1>Preferences</h1>
            <ol>
              <li>Please provide detailed reports with reproducible steps and a clearly defined impact.
              <li>Submit one vulnerability per report.
              <li>Social engineering (e.g. phishing, vishing, smishing) is prohibited.
            </ol>
          </div>
        </section>
      </section>
  `);
    }
    exports_70("Security", Security);
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("pages/legal-room/index", ["pages/legal-room/terms", "pages/legal-room/privacy", "pages/legal-room/security"], function (exports_71, context_71) {
    "use strict";
    var __moduleName = context_71 && context_71.id;
    function exportStar_3(m) {
        var exports = {};
        for (var n in m) {
            if (n !== "default") exports[n] = m[n];
        }
        exports_71(exports);
    }
    return {
        setters: [
            function (terms_js_1_1) {
                exportStar_3(terms_js_1_1);
            },
            function (privacy_js_1_1) {
                exportStar_3(privacy_js_1_1);
            },
            function (security_js_1_1) {
                exportStar_3(security_js_1_1);
            }
        ],
        execute: function () {
        }
    };
});
System.register("pages/case-study/ukCorpWebCaseStudy", [], function (exports_72, context_72) {
    "use strict";
    var __moduleName = context_72 && context_72.id;
    function UKCorpWeb(state) {
        const { Wrap } = state.boilerplate;
        return Wrap(state, "Case Study: 100s of Company Computers Infected by Web Malware", `
        <section class=content>
          <section class=introduction tabindex=0>
            <div class=story>
              <h1>Case Study: 100s of Company Computers Infected by Web Malware</h1>
              <p>
                Attackers use company's own corporate website to deliver malware to employees machines through their browser.	
              </p>
            </div>
            <div class=graphic>
              <img src=/images/3rd-party/undraw/team.svg>
            </div>
          </section>
        </section>
    `, `
      <section class=content>
        <section class=case-study>
          <div class=document>
            <h1>Introduction</h1>
            <p>
                This widespread compromise of a large UK company's internal network originated from an exploit hosted on their externally-managed corporate website. This was achieved as a result of poor security practices by the website provider. The attackers used a commonly available RAT to gain information about the internal network and control a number of computers. The widespread malware infection took extensive effort to eradicate and remediate.
            <h1>How it happened: the technical details</h1>
            <p>
              As part of their survey of the victim's network and services, attackers discovered that the corporate website
            was hosted by a service provider, and it contained a known vulnerability. In the survey stage of the attack on
            the service provider, the attackers exploited this vulnerability to add a specialised exploit delivery script to
            the corporate website.
            <p>
              The script compared the IP addresses of the website's visitors against the IP range used by the company. It
              then infected a number of computers within the company, taking advantage of a known software flaw, to
              download malware to the visitor's computer within a directory that allowed file execution.
              Over 300 computers were infected during the delivery stage with remote access malware. The malware then
              beaconed and delivered network information to attacker-owned domains. The attackers were eventually
              detected early in the affect stage. By this time they had installed further tools and were consolidating their
              position, carrying out network enumeration and identifying high value users.
            <p>
              Whilst the compromise was successful, it was detected through network security monitoring, and a welldefined incident response plan made it possible to investigate the incident using system and network logs,
              plus forensic examinations of many computers.
              To eradicate the discovered infection it was necessary, at great cost, to return the computers to a known
              good state. Further investigation was also required to identify any further malware that could be used to
              retain network access. To prevent further attacks through the same route, the contract terms with the
              website provider needed to be renegotiated, to ensure they had similar security standards to the targeted
              organisation.
            <h1>Capabilities, vulnerabilities and mitigations</h1>
            <p>
              The attackers used a combination of automated scanning tools, exploit kits and technology-specific attacks
              to compromise the organisation. They took advantage of a known software flaw and the trust relationship
              between the company and its supplier.
            <p>
              The intensive and costly investigation and remediation of the compromise could have been averted by more
              effective implementation of the following cyber security controls:
            <p>
              <ul>
                  <li>
                      patching - the corporate website would have not been compromised, nor would the malware
                    download script have succeeded, had patching on both the web server and users’ computers been
                    up to date
                  </li>
                  <li>
                    network perimeter defences - the malware could have been prevented from being downloaded and
                    the command and control might not have succeeded with the use of two-way web filtering, content
                    checking and firewall policies (as part of the internet gateway structure)
                  </li>
                  <li>
                    whitelisting and execution control - unauthorised executables such as the exploration tools would
                    have been unable to run if the company's corporate computers were subject to whitelisting and
                    execution control (this could also prevent applications from being able to run from the temporary or
                    personal profile folders)
                  </li>
                  <li>
                    security monitoring - may have detected the compromise at an earlier stage
                  </li>
              </ul>
            <p>
              Original source: <cite><a target=_blank href=https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/400106/Common_Cyber_Attacks-Reducing_The_Impact.pdf>Common Cyber Attacks: Reducing The Impact</a></cite>, GCHQ Communications-Electronics Security Group, 2015, pp. 14 - 15.
          </div>
        </section>
      </section>
  `);
    }
    exports_72("UKCorpWeb", UKCorpWeb);
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("pages/case-study/index", ["pages/case-study/ukCorpWebCaseStudy"], function (exports_73, context_73) {
    "use strict";
    var __moduleName = context_73 && context_73.id;
    function exportStar_4(m) {
        var exports = {};
        for (var n in m) {
            if (n !== "default") exports[n] = m[n];
        }
        exports_73(exports);
    }
    return {
        setters: [
            function (ukCorpWebCaseStudy_js_1_1) {
                exportStar_4(ukCorpWebCaseStudy_js_1_1);
            }
        ],
        execute: function () {
        }
    };
});
System.register("pages/index", ["pages/about", "pages/training", "pages/pricing", "pages/cloudBrowsers", "pages/fiveElements", "pages/document-reading-room/index", "pages/legal-room/index", "pages/case-study/index"], function (exports_74, context_74) {
    "use strict";
    var __moduleName = context_74 && context_74.id;
    var exportedNames_1 = {
        "DRR": true,
        "Legal": true,
        "CaseStudy": true
    };
    function exportStar_5(m) {
        var exports = {};
        for (var n in m) {
            if (n !== "default" && !exportedNames_1.hasOwnProperty(n)) exports[n] = m[n];
        }
        exports_74(exports);
    }
    return {
        setters: [
            function (about_js_1_1) {
                exportStar_5(about_js_1_1);
            },
            function (training_js_1_1) {
                exportStar_5(training_js_1_1);
            },
            function (pricing_js_1_1) {
                exportStar_5(pricing_js_1_1);
            },
            function (cloudBrowsers_js_1_1) {
                exportStar_5(cloudBrowsers_js_1_1);
            },
            function (fiveElements_js_1_1) {
                exportStar_5(fiveElements_js_1_1);
            },
            function (DRR_1) {
                exports_74("DRR", DRR_1);
            },
            function (Legal_1) {
                exports_74("Legal", Legal_1);
            },
            function (CaseStudy_1) {
                exports_74("CaseStudy", CaseStudy_1);
            }
        ],
        execute: function () {
        }
    };
});
System.register("pages/boilerplate", [], function (exports_75, context_75) {
    "use strict";
    var __moduleName = context_75 && context_75.id;
    function Wrap(state, title, contentIntro, contentBody) {
        return `
    <!DOCTYPE html>
      <meta charset=utf-8>
      <meta name=viewport content=width=device-width,initial-scale=1,user-scalable=no>
      <meta name=supported-color-schemes content="light dark">
      <meta name=color-schemes content="light dark">
      <meta name=description
        content="BrowserGap puts you first with the most familiar and secure browser isolation serivce, while our remote and fully isolated cloud browsers protect your network.">
      <meta name=author content="BrowserGap">
      <meta name=copright content="The Dosyago Corporation, Newark, DE">
      <meta name=robots content="index,follow">
			<!-- aux meta -->
				<!-- Twitter -->
					<meta property="twitter:card" content="summary_large_image">
					<meta property="twitter:url" content="https://browsergap.xyz/">
					<meta property="twitter:title" content="BrowserGap. Remote browser isolation.">
					<meta property="twitter:description" content="BrowserGap puts you first with the most familiar and secure browser isolation serivce, while our remote and fully isolated cloud browsers protect your network.">
					<meta property="twitter:image" content="https://browsergap.xyz/images/3rd-party/undraw/security.svg"> 
				<!-- Open Graph / Facebook -->
					<meta property="og:type" content="website">
					<meta property="og:url" content="https://browsergap.xyz">
					<meta property="og:title" content="BrowserGap. Remote browser isolation.">
					<meta property="og:description" content="BrowserGap puts you first with the most familiar and secure browser isolation serivce, while our remote and fully isolated cloud browsers protect your network.">
					<meta property="og:image" content="https://browsergap.xyz/images/3rd-party/undraw/security.svg">
      <title>
        BrowserGap &mdash; ${title}
      </title>
      <link rel=stylesheet href=/styles/main.css>
      <link rel=stylesheet href=/styles/logo.css>
      <header role=banner aria-label="Page header when page is scrolled to the top">
        <nav>
          <a class=drawer href=#main-menu-open>&#x2630;</a>
          <a class=logo-link href=/>
            <aside class=logo>
              <h1>
                <span class=browser>
                  <span class=inner>
                    Browser
                  </span>
                </span>
                <span class=gap>
                  <span class=inner>
                    Gap
                  </span>
                </span>
              </h1>
            </aside>
          </a>
          <ul id=main-menu-open>
            <li>
              <a href=#top class=drawer>Close</a>
            </li>
            <li>
              <a href=/pages/remote-cloud-browser-service.html#cloud-browsers>
                Cloud browsers
              </a>
            </li>
            <li>
              <a href=/pages/per-seat-subscription-pricing.html#pricing>
                Pricing
              </a>
            </li>
            <li>
              <a href=/pages/five-elements-technology-reading-room.html#five-elements>
                Five Elements     
              </a>
            </li>
            <li>
              <a href=/pages/tutorials-and-support-reading-room.html#reading-room>
                Reading Room
              </a>
            </li>
            <li class=for-button>
              <a href=#membership-application class="register toggle-opener">
                <span class=verbose-name>
                  Membership&nbsp;Application
                </span>
              </a>
            </li>
          </ul>
        </nav>
        <form method=POST
          action=https://formspree.io/cris@dosyago.com
          id=membership-application class=registration>
          <input type=hidden name=subject value="Membership Application for BrowserGap">
          <fieldset role=dialog>
            <legend>Membership Application</legend>
            <p>
              <label>
                Salutation
                <input autofocus required type=text autocomplete=honorific-prefix 
                  list=honorifics
                  maxlength=50
                  name=salutation placeholder="Major">
                </input>
              </label>
              <label>
                Your given name
                <input type=text autocomplete=given-name 
                  maxlength=100
                  name=given-name placeholder="Motoko">
              </label>
              <label>
                Your family name
                <input required type=text autocomplete=family-name 
                  maxlength=100
                  name=family-name placeholder="Kusanagi">
              </label>
            <p>
              <label>
                Your organization
                <input type=text autocomplete=organization 
                  maxlength=100
                  name=organization placeholder="Public Security Section 9">
              </label>
              <label>
                Your work email
                <input required type=email autocomplete=email 
                  maxlength=128
                  name=email placeholder="major@sec9.neotokyo.go.jp">
              </label>
            <p>
              <label>
                Your timezone
                <input required type=text autocomplete=on 
                  maxlength=64
                  name=timezone placeholder="GMT+9">
              </label>
            <p>
              <label>
                How many employees need browser isolation?
                <input name=scale type=number min=1 placeholder=300>
              </label>
            <p class=legal-agree>
              <label>
                <input required type=checkbox name=agree>
                I agree to the terms and conditions, privacy policy, data protection statement and consent to be contacted about this service.
              </label>
            <p>
              <button>Submit request</button>
              <br>
              <a class=cancel href=#top>I'm happy with my current solution.</a>
          </fieldset>
        </form>
        <form  id=account-login method=GET action=#login class=authentication>
          <fieldset role=dialog>
            <p>
              <label>
                Login email
                <input autofocus required type=email 
                  maxlength=128
                  name=email placeholder="major@sec9.neotokyo.go.jp">
              </label>
            <p>
              <label>
                Login password
                <input required type=password 
                  maxlength=128 
                  name=password placeholder="**********************">
              </label>
            <p>
              <button>Login</button>
              <a class=cancel href=#top>Not now</a>
          </fieldset>
        </form>
      </header>
      <main>
        <div class=header-background>
          <header role=banner aria-label="Page header after scrolling page down past the top">
            <nav>
              <a class=drawer href=#main-menu-open>&#x2630;</a>
              <a class=logo-link href=/>
                <aside class=logo>
                  <h1>
                    <span class=browser>
                      <span class=inner>
                        Browser
                      </span>
                    </span>
                    <span class=gap>
                      <span class=inner>
                        Gap
                      </span>
                    </span>
                  </h1>
                </aside>
              </a>
              <ul>
                <li>
                  <a href=#top class=drawer>Close</a>
                </li>
                <li>
                  <a href=/pages/remote-cloud-browser-service.html#cloud-browsers>
                    Cloud browsers
                  </a>
                </li>
                <li>
                  <a href=/pages/per-seat-subscription-pricing.html#pricing>
                    Pricing
                  </a>
                </li>
                <li>
                  <a href=/pages/five-elements-technology-reading-room.html#five-elements>
                    Five Elements     
                  </a>
                </li>
                <li>
                  <a href=/pages/tutorials-and-support-reading-room.html#reading-room>
                    Reading Room
                  </a>
                </li>
                <li>
                  <a href=#membership-application class="register toggle-opener">
                    <span class=verbose-name>
                      Membership&nbsp;Application
                    </span>
                  </a>
                </li>
              </ul>
            </nav>
          </header>
        </div>
        <div class=diagonal-background></div>
        ${contentIntro}
        <div class=wrapper>
          ${contentBody}
          <footer>
            <author> 
              <aside class=logo>
                <h1>
                  <span class=browser>
                    <span class=inner>
                      Browser
                    </span>
                  </span>
                  <span class=gap>
                    <span class=inner>
                      Gap
                    </span>
                  </span>
                </h1>
              </aside>
              <p>
                The simplest and best browser isolation 
                platform. We provide completely isolated, fully managed,
                fully hosted, remote cloud browsers, via our fault-tolerant
                browser-as-a-service infrastructure.
              </p>
              <p>
                <cite>
                  Copyright &copy; 2012 - 2019
                  The Dosyago Corporation, 
                  All rights reserved.
                </cite>
              </p>
            </author>
            <nav>
              <ul>
                <h1>Need help?</h1>
                <li>
                  <a href=mailto:support@browsergap.xyz>
                    Get support
                  </a>
                </li>
                <li>
                  <a href=/pages/training-and-tutorials.html>
                    Training & Tutorials
                  </a>
                </li>
              </ul>
              <ul>
                <h1>Company</h1>
                <li>
                  <a href=/pages/about-browsergap.html>
                    About us
                  </a>
                </li>
                <li>
                  <a href=mailto:resume@browsergap.xyz>
                    Careers
                  </a>
                </li>
                <li>
                  <a href=mailto:contact@browsergap.xyz>
                    Contact
                  </a>
                </li>
              </ul>
              <ul>
                <h1>Legal Room</h1>
                <li>
                  <a href=/pages/legal-room/terms.html>
                    Terms of service
                  </a>
                </li>
                <li>
                  <a href=/pages/legal-room/privacy.html>
                    Privacy policy
                  </a>
                </li>
                <li>
                  <a href=/pages/legal-room/security-responsible-vulnerability-disclosure-policy.html>
                    Security
                  </a>
                </li>
              </ul>
            </nav>
            <a id=authentication href=#account-login class="authenticate toggle-opener">
                    Member&nbsp;Login
                  </a>
          </footer>
        </div>
      </main>
      <datalist id=honorifics>
        <option value="Mr">
        <option value="Mrs">
        <option value="Ms">
      </datalist>
      <script defer async src=/scripts/currentPageAnchor.js></script>
      <script defer async src=/scripts/populateHonorifics.js></script>
  `;
    }
    exports_75("Wrap", Wrap);
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("index", ["landing", "pages/index", "./.well-known/index.js", "pages/boilerplate"], function (exports_76, context_76) {
    "use strict";
    var __moduleName = context_76 && context_76.id;
    return {
        setters: [
            function (Landing_1) {
                exports_76("Landing", Landing_1);
            },
            function (Pages_1) {
                exports_76("Pages", Pages_1);
            },
            function (SecTxt_1) {
                exports_76("SecTxt", SecTxt_1);
            },
            function (Boilerplate_1) {
                exports_76("Boilerplate", Boilerplate_1);
            }
        ],
        execute: function () {
        }
    };
});
System.register("prod/setup-service-worker", ["voodoo/src/common"], function (exports_77, context_77) {
    "use strict";
    var common_js_21;
    var __moduleName = context_77 && context_77.id;
    function setupServiceWorkers() {
        if (common_js_21.DEBUG.serviceWorker && 'serviceWorker' in navigator) {
            const refresh = common_js_21.DEBUG.resetCache ? 'CLEAR' + Math.random() : common_js_21.VERSION;
            navigator.serviceWorker.register('/serviceWorker.js?v=' + refresh);
            navigator.serviceWorker.addEventListener("controllerchange", async (e) => {
                console.log("Controller change", e);
            });
        }
    }
    exports_77("default", setupServiceWorkers);
    return {
        setters: [
            function (common_js_21_1) {
                common_js_21 = common_js_21_1;
            }
        ],
        execute: function () {
            setupServiceWorkers();
        }
    };
});
System.register("prod/ask-before-unload", ["voodoo/src/common"], function (exports_78, context_78) {
    "use strict";
    var common_js_22;
    var __moduleName = context_78 && context_78.id;
    function setupUnloadHandler() {
        common_js_22.DEBUG.delayUnload && self.addEventListener('beforeunload', event => {
            const delayOffRequested = !!document.querySelector('form.delay-off');
            if (common_js_22.DEBUG.delayUnload && !delayOffRequested) {
                event.preventDefault();
                event.returnValue = `
        You are about to leave the browser.
        If you wanted to navigate, use the < and > buttons provided.
      `;
            }
        });
    }
    exports_78("default", setupUnloadHandler);
    return {
        setters: [
            function (common_js_22_1) {
                common_js_22 = common_js_22_1;
            }
        ],
        execute: function () {
            setupUnloadHandler();
        }
    };
});
System.register("meta", ["whatwg-fetch", "@babel/polyfill", "error_catchers", "prod/setup-service-worker", "prod/ask-before-unload"], function (exports_79, context_79) {
    "use strict";
    var __moduleName = context_79 && context_79.id;
    return {
        setters: [
            function (_1) {
            },
            function (_2) {
            },
            function (_3) {
            },
            function (_4) {
            },
            function (_5) {
            }
        ],
        execute: function () {
        }
    };
});
/* eslint-disable no-global-assign */
require = require('esm')(module /*, options*/);
module.exports = require('./index.js');
/* eslint-enable no-global-assign */
System.register("render_static", ["./common.js", "site", "fs", "path"], function (exports_80, context_80) {
    "use strict";
    var common_js_23, Site, Fs, Path, STATIC_FILE_PATHS, State;
    var __moduleName = context_80 && context_80.id;
    async function renderAll({ state }) {
        console.log(`Rendering all static file paths...`);
        for (const [pathList, renderFunc] of enumerateTree(STATIC_FILE_PATHS)) {
            await render({ state, renderFunc, pathList });
        }
        console.log(`Done rendering!`);
    }
    async function render({ state, renderFunc, pathList }) {
        const path = Path.join(common_js_23.APP_ROOT, ...pathList);
        console.log(`Writing static file ${path}`);
        await Fs.promises.writeFile(path, renderFunc(state));
        console.log(`Wrote ${path}!`);
    }
    // helpers
    /**
      *
      * Treats an object as a tree
      * Enumerates all leaves as pairs [pathList, value]
      *
      **/
    function* enumerateTree(tree) {
        const queue = [{ path: [], value: tree }];
        while (queue.length) {
            const current = queue.shift();
            if (isObject(current.value)) {
                const entries = Object
                    .entries(current.value)
                    .map(([name, value]) => ({ path: current.path.concat(name), value }));
                queue.push(...entries);
            }
            else {
                yield [current.path, current.value];
            }
        }
    }
    function isObject(val) {
        return (typeof val == "object" && val != null);
    }
    return {
        setters: [
            function (common_js_23_1) {
                common_js_23 = common_js_23_1;
            },
            function (Site_1) {
                Site = Site_1;
            },
            function (Fs_1) {
                Fs = Fs_1;
            },
            function (Path_1) {
                Path = Path_1;
            }
        ],
        execute: function () {
            // site routes as a "sitemap" style tree and render funcs
            STATIC_FILE_PATHS = {
                'index.html': Site.Landing.default,
                'pages': {
                    'about-browsergap.html': Site.Pages.About,
                    'training-and-tutorials.html': Site.Pages.Training,
                    'remote-cloud-browser-service.html': Site.Pages.CloudBrowsers,
                    'per-seat-subscription-pricing.html': Site.Pages.Pricing,
                    'five-elements-technology-reading-room.html': Site.Pages.FiveElements,
                    'tutorials-and-support-reading-room.html': Site.Pages.Training,
                    'document-reading-room': {
                        'history-of-browser-gap.html': Site.Pages.DRR.History,
                        'threats-facing-the-web-user.html': Site.Pages.DRR.Threats,
                        'browser-gap-an-overview-of-features.html': Site.Pages.DRR.Features,
                    },
                    'legal-room': {
                        'terms.html': Site.Pages.Legal.Terms,
                        'privacy.html': Site.Pages.Legal.Privacy,
                        'security-responsible-vulnerability-disclosure-policy.html': Site.Pages.Legal.Security
                    },
                    'case-study': {
                        'uk-corporate-website-malware-attack.html': Site.Pages.CaseStudy.UKCorpWeb,
                    }
                },
                '.well-known': {
                    'security.txt': Site.SecTxt.securityTxt
                }
            };
            // the render state (including ref boilerplate wrapper function)
            State = {
                boilerplate: {
                    Wrap: Site.Boilerplate.Wrap
                }
            };
            renderAll({ state: State });
            setTimeout(() => 1, 1 << 31);
        }
    };
});
// constants 
const CACHE = "lw-cache-20190614";
const CLEAR = location.search.startsWith('?v=CLEAR');
const ONLINE_TEST = location.protocol + '//' + location.hostname + '/online-test.html';
// route 
const IGNORE = {
    [ONLINE_TEST]: true
};
const NEVER_CACHE = {
    '/api/v1/tabs': true,
};
const API_STUB = {
    '/api/v1/tabs': async () => new Response(JSON.stringify({ tabs: [], requestId: 0 }), {
        status: 200,
        statusText: 'OK',
        headers: {
            'Content-Type': 'application/json'
        }
    })
};
const OFFLINE = async () => new Response(NoLoadView(), {
    status: 200,
    statusText: 'OK',
    headers: {
        'Content-Type': 'text/html'
    }
});
// handlers
self.addEventListener('activate', async (e) => await e.waitUntil(self.Clients.claim()));
self.addEventListener('install', async (e) => {
    try {
        await e.skipWaiting();
    }
    finally {
        await setup();
    }
});
self.addEventListener('fetch', e => e.waitUntil(fetchResponder(e)));
async function fetchResponder(e) {
    CLEAR && console.log(e.request);
    if (e.request.method != 'GET')
        return;
    if (e.request.url in IGNORE)
        return;
    const Url = new URL(e.request.url);
    if (Url.port !== location.port)
        return;
    if (Url.pathname.startsWith('/current'))
        return;
    e.respondWith(fetchResponder2(e));
}
async function fetchResponder2(e) {
    const cache = await caches.open(CACHE);
    const cachedResponse = await cache.match(e.request);
    let response;
    if (!CLEAR && cachedResponse)
        response = cachedResponse;
    else if (e.request.cache === 'only-if-cached' && e.request.mode !== 'same-origin')
        return;
    else
        response = await cacheFetcher2(e);
    if (response) {
        return response;
    }
}
async function cacheFetcher2(e) {
    const requestUrl = new URL(e.request.url);
    const route = requestUrl.pathname;
    let response;
    try {
        response = await fetch(e.request);
    }
    catch (e) {
        console.warn(e, e.request);
    }
    if (response) {
        if (route in NEVER_CACHE) {
            return response;
        }
        else {
            const clone = response.clone();
            const cache = await caches.open(CACHE);
            await cache.put(e.request, clone);
            return response;
        }
    }
    else if (route in API_STUB) {
        return API_STUB[route]();
    }
    else {
        return OFFLINE();
    }
}
async function setup() {
    await caches.open(CACHE);
}
// views
function NoLoadView() {
    return `
        <!DOCTYPE html>
        <meta charset=utf-8>
        <meta name=viewport content="width=device-width, initial-scale=1.0">
        <title>We'll be right back</title>
        <main>
          <header>
            <h1>Alakazam &mdash; we've vanished!</h1>
          </header>
          <article>
            <h2>No doubt we shall return presently</h2>
            <p>
              As we see it, you have a couple of options right now:
            </p>
            <ul>
              <li>
                You can sit here and wait.
              <li>
                You can <a href=${self.registration.scope}>reload the page.</a>
              <li>
                You can <a href=https://github.com/dosycorp/service-issues/issues>open an issue.</a>
              <li> 
                You can vent your anger into this <a href=#black-hole>black hole</a> below.
            </ul>
            <form id=black-hole>
              <fieldset>Vent into the black hole</fieldset>
              <p>
                <textarea></textarea> 
              <p>
                <button>Send into black hole</button>
            </form>
          </article>
          <footer>
            A production of <a target=_blank href=https://dosyago.com>The Dosyago Corporation</a>.
          </footer>
        </main>
      `;
}
System.register("start-demo-app", ["voodoo/index", "getAPI", "plugins/appminifier/translateAppminifierCRDP"], function (exports_81, context_81) {
    "use strict";
    var index_js_8, getAPI_js_6, translateAppminifierCRDP_js_3;
    var __moduleName = context_81 && context_81.id;
    async function start_demo() {
        const useViewFrame = true;
        const demoMode = true;
        const translator = translateAppminifierCRDP_js_3.default;
        const voodoo = await index_js_8.default({ api: getAPI_js_6.default(), translator, useViewFrame, demoMode });
        self.voodoo = voodoo;
        return voodoo;
    }
    return {
        setters: [
            function (index_js_8_1) {
                index_js_8 = index_js_8_1;
            },
            function (getAPI_js_6_1) {
                getAPI_js_6 = getAPI_js_6_1;
            },
            function (translateAppminifierCRDP_js_3_1) {
                translateAppminifierCRDP_js_3 = translateAppminifierCRDP_js_3_1;
            }
        ],
        execute: function () {
            start_demo();
        }
    };
});
/* eslint-disable no-global-assign */
require = require('esm')(module /*, options*/);
module.exports = require('./render_static.js');
/* eslint-enable no-global-assign */
