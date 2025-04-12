﻿import termkit from 'terminal-kit';
import { EventEmitter } from 'events';
import {sleep, debugLog, logClicks,DEBUG} from './log.js';
import {getAncestorInfo} from './layout.js';
import {getClickedBox,focusInput,renderedBoxes,refreshTerminal,handleClick} from './baby-jaguar.js';
import keys from './kbd.js';
import { dinoGame } from './dino.js';

// Dynamically import CommonJS modules
const { default: tone } = await import('tonegenerator');
const { default: Speaker } = await import('speaker');

const term = termkit.terminal;

export default class TerminalBrowser extends EventEmitter {
  constructor(options = {}, getState) {
    super();
    this.currentFocusIndex = 0;
    this.getState = getState;
    this.getFreshState = () => getState({fresh:true});
    this.term = term;
    this.options = {
      tabWidth: options.tabWidth || Math.max(Math.ceil(this.term.width/4), 15),
      initialTabs: options.initialTabs || [
        { title: 'Home', url: 'https://home.com' },
      ],
      colors: options.colors || ['brightBlue'],
    };

    // State
    this.tabs = this.options.initialTabs.map((tab, i) => ({
      ...tab,
    }));
    if (this.tabs.length === 0) {
      this.emit('newTabRequested', { title: 'New Tab', url: 'about:blank' });
    }
    this.tabOffset = 0;
    this.focusedTabIndex = 0;
    this.selectedTabIndex = -1;
    this.focusedElement = 'tabs'; // 'tabs', 'back', 'forward', 'address', 'go', or 'input:<backendNodeId>'
    this.previousFocusedElement = null; // Track previous focus
    this.addressContent = '';
    this.cursorPosition = 0;

    // Input field management
    this.inputFields = new Map(); // Key: backendNodeId, Value: { value, cursorPosition, focused }

    // Constants
    this.TAB_HEIGHT = 1;
    this.OMNIBOX_HEIGHT = 3;
    this.BACK_WIDTH = 6;
    this.FORWARD_WIDTH = 8;
    this.GO_WIDTH = 6;
    this.ADDRESS_WIDTH = this.term.width - this.BACK_WIDTH - this.FORWARD_WIDTH - this.GO_WIDTH - 4;
    this.NEW_TAB_WIDTH = 5;

    this.keyBuffer = ''; // Tracks recent keystrokes

    this.ditzyTune();

    // Initialize terminal
    this.term.fullscreen(true);
    this.term.windowTitle('Terminal Browser');

    // Show splash screen
    this.splashScreen();

    // Start rendering and input handling
    this.render();
    this.setupInput();
  }

  async ditzyTune() {
    const { spawn } = await import('child_process');

    // Spawn ditzrunner.js to play the tune
    const runnerProcess = spawn('node', ['ditzrunner.js'], {
      detached: true, // Run as a detached process
      stdio: 'ignore', // Ignore stdout/stderr
      windowsHide: true // Hide the window (no effect on macOS, but included for cross-platform)
    });

    // Detach the process so it runs independently
    runnerProcess.unref();
  }

  async splashScreen() {
    // Clear the terminal
    this.term.clear();

    // The ASCII logo
    const logo = [
      '     ██   ██                                  ██    ',
      '    ░██  ██                                  ░██    ',
      '    ░██ ██    █████  ██████ ███████   █████  ░██    ',
      '    ░████    ██░░░██░░██░░█░░██░░░██ ██░░░██ ░██    ',
      '    ░██░██  ░███████ ░██ ░  ░██  ░██░███████ ░██    ',
      '    ░██░░██ ░██░░░░  ░██    ░██  ░██░██░░░░  ░██    ',
      '    ░██ ░░██░░██████░███    ███  ░██░░██████ ███    ',
      '    ░░   ░░  ░░░░░░ ░░░    ░░░   ░░  ░░░░░░ ░░░     '
    ];

    // Define rainbow colors
    const rainbowColors = [
      { r: 255, g: 0, b: 0 },
      { r: 255, g: 165, b: 0 },
      { r: 255, g: 255, b: 0 },
      { r: 0, g: 255, b: 0 },
      { r: 0, g: 0, b: 255 },
      { r: 128, g: 0, b: 128 }
    ];

    // Dimensions of the logo
    const logoHeight = logo.length;
    const logoWidth = logo[0].length;

    // Center the logo
    const startY = Math.floor((this.term.height - logoHeight) / 2);
    const startX = Math.floor((this.term.width - logoWidth) / 2);

    // Calculate the diagonal gradient
    const diagonalLength = Math.sqrt(logoWidth * logoWidth + logoHeight * logoHeight);
    const colorStep = diagonalLength / (rainbowColors.length - 1);

    // Render the logo with a diagonal gradient
    for (let y = 0; y < logoHeight; y++) {
      const line = logo[y];
      for (let x = 0; x < logoWidth; x++) {
        const char = line[x];
        if (char === ' ') continue;

        const diagonalPos = Math.sqrt(x * x + y * y);
        const segment = Math.min(Math.floor(diagonalPos / colorStep), rainbowColors.length - 2);
        const startColor = rainbowColors[segment];
        const endColor = rainbowColors[segment + 1];
        const t = (diagonalPos % colorStep) / colorStep;

        const r = Math.round(startColor.r + t * (endColor.r - startColor.r));
        const g = Math.round(startColor.g + t * (endColor.g - startColor.g));
        const b = Math.round(startColor.b + t * (endColor.b - startColor.b));

        this.term.moveTo(startX + x, startY + y + 1);
        this.term.colorRgb(r, g, b)(char);
      }
    }


    // Reset terminal colors
    this.term.bgDefaultColor().defaultColor();
    this.term.styleReset();
  }

  focusNearestInRow(direction) {
    const tabbable = this.computeTabbableElements();
    if (!tabbable.length) return;

    // Find current element
    let current;
    if (this.focusedElement === 'tabs') {
      current = tabbable.find(el => el.type === 'tab' && el.index === this.focusedTabIndex) || tabbable[0];
    } else if (this.focusedElement === 'newTab') {
      current = tabbable.find(el => el.type === 'newTab');
    } else if (this.focusedElement.startsWith('input:')) {
      const id = this.focusedElement.split(':')[1];
      current = tabbable.find(el => el.type === 'input' && el.backendNodeId == id);
    } else if (this.focusedElement.startsWith('clickable:')) {
      const id = this.focusedElement.split(':')[1];
      current = tabbable.find(el => el.type === 'clickable' && el.backendNodeId == id);
    } else {
      current = tabbable.find(el => el.type === this.focusedElement) || tabbable[0];
    }
    if (!current) return;

    const currentY = current.y;
    const currentCenterX = current.x + (current.width || this.options.tabWidth) / 2;

    // Special transitions
    if (direction === 'down' && currentY === 1) {
      const omniboxElements = tabbable.filter(el => el.y === this.TAB_HEIGHT + 2);
      if (omniboxElements.length) {
        const nearest = omniboxElements.reduce((best, el) => {
          const elCenterX = el.x + (el.width || this.BACK_WIDTH) / 2;
          const bestCenterX = best.x + (best.width || this.BACK_WIDTH) / 2;
          return Math.abs(elCenterX - currentCenterX) < Math.abs(bestCenterX - currentCenterX) ? el : best;
        }, omniboxElements[0]);
        this.currentFocusIndex = tabbable.findIndex(el => el === nearest); // Sync index
        this.setFocus(nearest);
        return;
      }
    } else if (direction === 'up' && currentY === this.TAB_HEIGHT + 2) {
      const tabElements = tabbable.filter(el => el.y === 1);
      if (tabElements.length) {
        const nearest = tabElements.reduce((best, el) => {
          const elCenterX = el.x + (el.width || this.options.tabWidth) / 2;
          const bestCenterX = best.x + (best.width || this.options.tabWidth) / 2;
          return Math.abs(elCenterX - currentCenterX) < Math.abs(bestCenterX - currentCenterX) ? el : best;
        }, tabElements[0]);
        this.currentFocusIndex = tabbable.findIndex(el => el === nearest); // Sync index
        this.setFocus(nearest);
        return;
      }
    }

    // General row navigation
    const targetY = direction === 'down' ? currentY + 1 : currentY - 1;
    let candidates = tabbable.filter(el => el.y === targetY);

    if (!candidates.length) {
      candidates = tabbable.filter(el => direction === 'down' ? el.y > currentY : el.y < currentY);
      if (!candidates.length) return;
      const nextRowY = direction === 'down'
        ? Math.min(...candidates.map(el => el.y))
        : Math.max(...candidates.map(el => el.y));
      candidates = tabbable.filter(el => el.y === nextRowY);
    }

    const nearest = candidates.reduce((best, el) => {
      const elCenterX = el.x + (el.width || this.options.tabWidth) / 2;
      const bestCenterX = best.x + (best.width || this.options.tabWidth) / 2;
      return Math.abs(elCenterX - currentCenterX) < Math.abs(bestCenterX - currentCenterX) ? el : best;
    }, candidates[0]);

    this.currentFocusIndex = tabbable.findIndex(el => el === nearest); // Sync index
    this.setFocus(nearest);
  }

  computeTabbableElements() {
    const tabbable = [];
    
    // Browser UI elements
    this.tabs.forEach((tab, index) => {
      const x = 1 + index * this.options.tabWidth;
      tabbable.push({ type: 'tab', index, x, y: 1 });
    });
    tabbable.push({ type: 'newTab', x: this.term.width - this.NEW_TAB_WIDTH + 1, y: 1 });
    tabbable.push({ type: 'back', x: 2, y: this.TAB_HEIGHT + 2 });
    tabbable.push({ type: 'forward', x: this.BACK_WIDTH + 2, y: this.TAB_HEIGHT + 2 });
    tabbable.push({ type: 'address', x: this.BACK_WIDTH + this.FORWARD_WIDTH + 2, y: this.TAB_HEIGHT + 2 });
    tabbable.push({ type: 'go', x: this.term.width - this.GO_WIDTH, y: this.TAB_HEIGHT + 2 });

    const publicState = this.getState();
    if (publicState && renderedBoxes && publicState.layoutToNode && publicState.nodeToParent && publicState.nodes) {
      debugLog('Rendered Boxes Count:', renderedBoxes.length);

      // Group clickable elements by their nearest clickable ancestor to simplify tabbing
      // ie group by clickable parent backendNodeId
      const elementsByParentId = new Map();
      renderedBoxes.forEach(box => {
        if (!box.isClickable && box.type !== 'input') return;

        // Find the clickable parent's backendNodeId
        let parentBackendNodeId = box.backendNodeId;
        let currentNodeIndex = box.nodeIndex;
        while (currentNodeIndex !== -1 && currentNodeIndex !== undefined) {
          if (publicState.nodes.isClickable && publicState.nodes.isClickable.index.includes(currentNodeIndex)) {
            parentBackendNodeId = publicState.nodes.backendNodeId[currentNodeIndex];
            break;
          }
          currentNodeIndex = publicState.nodeToParent.get(currentNodeIndex);
        }

        if (!elementsByParentId.has(parentBackendNodeId)) {
          elementsByParentId.set(parentBackendNodeId, {
            backendNodeId: parentBackendNodeId,
            type: box.type === 'input' ? 'input' : 'clickable',
            boxes: [],
            text: '',
            ancestorType: box.ancestorType,
            minX: box.termX,
            maxX: box.termX + box.termWidth - 1,
            minY: box.termY,
            maxY: box.termY
          });
        }

        const elem = elementsByParentId.get(parentBackendNodeId);
        elem.boxes.push(box);
        elem.text += (elem.text ? ' ' : '') + box.text;
        elem.minX = Math.min(elem.minX, box.termX);
        elem.maxX = Math.max(elem.maxX, box.termX + box.termWidth - 1);
        elem.minY = Math.min(elem.minY, box.termY);
        elem.maxY = Math.max(elem.maxY, box.termY);
      });

      // Add grouped elements to tabbable
      elementsByParentId.forEach((elem, id) => {
        //debugLog(`Adding parent: id=${id}, type=${elem.type}, text="${elem.text}", ancestorType="${elem.ancestorType}"`);
        tabbable.push({
          type: elem.type,
          backendNodeId: elem.backendNodeId,
          x: elem.minX,
          y: elem.minY,
          width: elem.maxX - elem.minX + 1,
          height: elem.maxY - elem.minY + 1,
          text: elem.text,
          ancestorType: elem.ancestorType
        });
      });
    } else {
      debugLog('Missing state, renderedBoxes, or layout data');
    }

    debugLog('Final Tabbable Elements Count:', tabbable.length);
    debugLog(JSON.stringify(tabbable, null,2));
    tabbable.sort((a, b) => a.y - b.y || a.x - b.x);
    return tabbable;
  }

  drawTabs() {
    this.term.moveTo(1, 1);
    this.term.bgBlue().white(' '.repeat(this.term.width));
    let x = 1;
    for (let i = this.tabOffset; i < this.tabs.length && x <= this.term.width - this.NEW_TAB_WIDTH; i++) {
      const maxTitleLength = this.options.tabWidth - 5;
      const truncatedTitle = this.tabs[i].title.slice(0, maxTitleLength);
      const titlePart = ` ${truncatedTitle}`;
      const paddingLength = this.options.tabWidth - titlePart.length - 3;
      const tabText = `${titlePart}${' '.repeat(paddingLength)}[x]`;

      this.term.moveTo(x, 1);
      const isFocused = this.focusedElement === 'tabs' && i === this.focusedTabIndex;
      if (isFocused || i == this.selectedTabIndex) {
        this.term.bgCyan().black().bold().underline(tabText); // Cyan bg, black fg (since original is blue)
      } else {
        this.term.bgBlue().defaultColor(tabText);
      }
      x += tabText.length;
    }

    this.term.moveTo(this.term.width - this.NEW_TAB_WIDTH + 1, 1);
    if (this.focusedElement === 'newTab') {
      this.term.bgCyan().black(' [+] '); // Cyan bg, black fg (original white)
    } else {
      this.term.bgBlue().white(' [+] ');
    }
  }

  drawOmnibox() {
    this.term.moveTo(1, this.TAB_HEIGHT + 1);
    this.term.bgBlack().cyan('─'.repeat(this.term.width));
    this.term.moveTo(1, this.TAB_HEIGHT + 2);
    this.term.bgBlack().white(' '.repeat(this.term.width));
    this.term.moveTo(1, this.TAB_HEIGHT + 3);
    this.term.bgBlack().cyan('─'.repeat(this.term.width));

    this.term.moveTo(2, this.TAB_HEIGHT + 2);
    if (this.focusedElement === 'back') {
      this.term.bgCyan().gray().bold(' Back '); // Original bgGray.white, so gray becomes fg
    } else {
      this.term.bgGray().white(' Back ');
    }

    this.term.moveTo(this.BACK_WIDTH + 2, this.TAB_HEIGHT + 2);
    if (this.focusedElement === 'forward') {
      this.term.bgCyan().gray().bold(' Forward '); // Original bgGray.white, so gray becomes fg
    } else {
      this.term.bgGray().white(' Forward ');
    }

    this.term.moveTo(this.BACK_WIDTH + this.FORWARD_WIDTH + 2, this.TAB_HEIGHT + 2);
    if (this.focusedElement === 'address') {
      const beforeCursor = this.addressContent.slice(0, this.cursorPosition);
      const cursorChar = this.addressContent[this.cursorPosition] || ' ';
      const afterCursor = this.addressContent.slice(this.cursorPosition + 1);
      this.term.bgCyan().white(beforeCursor); // Original bgWhite.black, so white becomes fg
      this.term.bgBlack().brightWhite().bold(cursorChar);
      this.term.bgCyan().white(afterCursor.padEnd(this.ADDRESS_WIDTH - beforeCursor.length - 1, ' '));
    } else {
      this.term.bgWhite().black(this.addressContent.slice(0, this.ADDRESS_WIDTH).padEnd(this.ADDRESS_WIDTH, ' '));
    }

    this.term.moveTo(this.term.width - this.GO_WIDTH, this.TAB_HEIGHT + 2);
    if (this.focusedElement === 'go') {
      this.term.bgCyan().green().bold(' Go '); // Original bgGreen.white, so green becomes fg
    } else {
      this.term.bgGreen().white(' Go ');
    }
    this.term.bgDefaultColor();
    this.term.defaultColor();
    this.term.styleReset();
  }

  drawInputField(options) {
    const { x, y, width, key, initialValue = '', onChange } = options;
    const backendNodeIdStr = '' + key;

    if (!this.inputFields.has(backendNodeIdStr)) {
      this.inputFields.set(backendNodeIdStr, {
        value: initialValue,
        cursorPosition: initialValue.length,
        focused: false,
        onChange,
        x,
        y,
        width,
      });
    }
    const inputState = this.inputFields.get(backendNodeIdStr);
    inputState.x = x;
    inputState.y = y;
    inputState.width = width;

    const displayWidth = Math.min(width, this.term.width - x + 1);
    const isFocused = this.focusedElement === `input:${backendNodeIdStr}`;
    const value = inputState.value;
    const cursorPos = inputState.cursorPosition;

    this.term.moveTo(x, y);
    if (isFocused) {
      const beforeCursor = value.slice(0, cursorPos);
      const cursorChar = value[cursorPos] || ' ';
      const afterCursor = value.slice(cursorPos + 1);
      this.term.bgCyan().white(beforeCursor); // Cyan bg, original white bg becomes fg
      this.term.bgBlack().brightWhite().bold(cursorChar);
      this.term.bgCyan().white(afterCursor.padEnd(displayWidth - beforeCursor.length - 1, ' '));
    } else {
      this.term.bgWhite().black(value.slice(0, displayWidth).padEnd(displayWidth, ' '));
    }

    this.term.bgDefaultColor();
    this.term.defaultColor();
    this.term.styleReset();

    return { backendNodeId: backendNodeIdStr, x, y, width: displayWidth };
  }

  drawSelect(options) {
    const { x, y, width, key, options: selectOptions = [], onChange } = options;
    const backendNodeIdStr = '' + key;

    // Initialize state if not present
    if (!this.inputFields.has(backendNodeIdStr)) {
      this.inputFields.set(backendNodeIdStr, {
        type: 'select',
        value: selectOptions.length > 0 ? selectOptions[0].value : '', // Default to first option
        selectedIndex: 0, // Track the selected option index
        options: selectOptions, // Array of { value, label }
        cursorPosition: 0, // For consistency, though not used for select
        focused: false,
        onChange,
        x,
        y,
        width,
      });
    }

    const inputState = this.inputFields.get(backendNodeIdStr);
    inputState.x = x;
    inputState.y = y;
    inputState.width = width;

    const displayWidth = Math.min(width, this.term.width - x + 1);
    const isFocused = this.focusedElement === `input:${backendNodeIdStr}`;
    const selectedOption = inputState.options[inputState.selectedIndex] || { label: '' };

    this.term.moveTo(x, y);
    if (isFocused) {
      this.term.bgCyan().white(`[${selectedOption.label}]`.slice(0, displayWidth).padEnd(displayWidth, ' '));
    } else {
      this.term.bgWhite().black(`[${selectedOption.label}]`.slice(0, displayWidth).padEnd(displayWidth, ' '));
    }

    this.term.bgDefaultColor();
    this.term.defaultColor();
    this.term.styleReset();

    return { backendNodeId: backendNodeIdStr, x, y, width: displayWidth };
  }

  drawRadio(options) {
    const { x, y, width, key, name, value, checked = false, onChange } = options;
    const backendNodeIdStr = '' + key;

    // Initialize state if not present
    if (!this.inputFields.has(backendNodeIdStr)) {
      this.inputFields.set(backendNodeIdStr, {
        type: 'radio',
        name, // To group radios together
        value,
        checked,
        focused: false,
        onChange,
        x,
        y,
        width,
      });
    }

    const inputState = this.inputFields.get(backendNodeIdStr);
    inputState.x = x;
    inputState.y = y;
    inputState.width = width;
    inputState.checked = checked; // Update checked state

    const displayWidth = Math.min(width, this.term.width - x + 1);
    const isFocused = this.focusedElement === `input:${backendNodeIdStr}`;
    const label = value || '';

    this.term.moveTo(x, y);
    if (isFocused) {
      this.term.bgCyan().white(`${inputState.checked ? '(•)' : '( )'} ${label}`.slice(0, displayWidth).padEnd(displayWidth, ' '));
    } else {
      this.term.bgWhite().black(`${inputState.checked ? '(•)' : '( )'} ${label}`.slice(0, displayWidth).padEnd(displayWidth, ' '));
    }

    this.term.bgDefaultColor();
    this.term.defaultColor();
    this.term.styleReset();

    return { backendNodeId: backendNodeIdStr, x, y, width: displayWidth };
  }

  drawCheckbox(options) {
    const { x, y, width, key, value, checked = false, onChange } = options;
    const backendNodeIdStr = '' + key;

    // Initialize state if not present
    if (!this.inputFields.has(backendNodeIdStr)) {
      this.inputFields.set(backendNodeIdStr, {
        type: 'checkbox',
        value,
        checked,
        focused: false,
        onChange,
        x,
        y,
        width,
      });
    }

    const inputState = this.inputFields.get(backendNodeIdStr);
    inputState.x = x;
    inputState.y = y;
    inputState.width = width;
    inputState.checked = checked; // Update checked state

    const displayWidth = Math.min(width, this.term.width - x + 1);
    const isFocused = this.focusedElement === `input:${backendNodeIdStr}`;
    const label = value || '';

    this.term.moveTo(x, y);
    if (isFocused) {
      this.term.bgCyan().white(`${inputState.checked ? '[x]' : '[ ]'} ${label}`.slice(0, displayWidth).padEnd(displayWidth, ' '));
    } else {
      this.term.bgWhite().black(`${inputState.checked ? '[x]' : '[ ]'} ${label}`.slice(0, displayWidth).padEnd(displayWidth, ' '));
    }

    this.term.bgDefaultColor();
    this.term.defaultColor();
    this.term.styleReset();

    return { backendNodeId: backendNodeIdStr, x, y, width: displayWidth };
  }

  redrawFocusedInput() {
    if (!this.focusedElement.startsWith('input:')) return;

    const backendNodeId = this.focusedElement.split(':')[1];
    const inputState = this.inputFields.get(backendNodeId);
    if (!inputState || !inputState.focused) return;

    const { x, y, width, value, cursorPosition } = inputState;
    const displayWidth = Math.min(width, this.term.width - x + 1);

    this.term.moveTo(x, y);
    const beforeCursor = value.slice(0, cursorPosition);
    const cursorChar = value[cursorPosition] || ' ';
    const afterCursor = value.slice(cursorPosition + 1);
    this.term.bgCyan().black(beforeCursor); // Cyan background for focus
    this.term.bgBlack().brightWhite().bold(cursorChar); // Cursor highlight
    this.term.bgCyan().black(afterCursor.padEnd(displayWidth - beforeCursor.length - 1, ' '));
    this.term.bgDefaultColor();
    this.term.defaultColor();
    this.term.styleReset();
  }

  redrawUnfocusedInput(backendNodeId) {
    const inputState = this.inputFields.get('' + backendNodeId);
    if (!inputState) return;

    const { x, y, width, value } = inputState;
    const displayWidth = Math.min(width, this.term.width - x + 1);

    this.term.moveTo(x, y);
    this.term.bgWhite().black(value.slice(0, displayWidth).padEnd(displayWidth, ' '));
    this.term.bgDefaultColor();
    this.term.defaultColor();
    this.term.styleReset();
  }

  focusInput(backendNodeId) {
    const backendNodeIdStr = '' + backendNodeId;
    if (this.inputFields.has(backendNodeIdStr)) {
      // Redraw previous input as unfocused
      if (this.previousFocusedElement && this.previousFocusedElement.startsWith('input:')) {
        const prevBackendNodeId = this.previousFocusedElement.split(':')[1];
        if (prevBackendNodeId !== backendNodeIdStr) { // Avoid redrawing if same input
          this.redrawUnfocusedInput(prevBackendNodeId);
        }
      }

      this.focusedElement = `input:${backendNodeIdStr}`;
      this.previousFocusedElement = this.focusedElement; // Update previous focus
      const inputState = this.inputFields.get(backendNodeIdStr);
      inputState.focused = true;
      logClicks(`Focused input: ${backendNodeIdStr}, value: ${inputState.value}`);
      this.redrawFocusedInput();
    } else {
      logClicks(`Cannot focus ${backendNodeIdStr}: no state found`);
    }
  }

  render() {
    this.term.moveTo(1, 6);
    this.term.eraseDisplayAbove();
    this.drawTabs();
    this.drawOmnibox();
    this.term.bgDefaultColor();
    this.term.defaultColor();
    this.term.styleReset();
    this.term.moveTo(1, this.term.height);
  }

  async handleDinoCommand(key, isListening) {
    if (!isListening) return false;

    // Only check for "dino" when no input or address bar is focused
    if (!this.focusedElement.startsWith('input:') && this.focusedElement !== 'address') {
      if (key.length === 1) {
        this.keyBuffer += key.toLowerCase();
        if (this.keyBuffer.length > 4) {
          this.keyBuffer = this.keyBuffer.slice(-4); // Keep only the last 4 characters
        }
        if (this.keyBuffer === 'dino') {
          this.keyBuffer = ''; // Reset buffer
          // Disable browser input handling
          this.term.off('key');
          this.term.off('mouse');
          // Run the Dino game
          await dinoGame(() => {
            // Callback to restore browser input handling
            this.setupInput();
            this.render(); // Redraw browser UI
          });
          return true; // Indicate that we handled the key
        }
      } else {
        // Reset buffer on non-character keys (like arrow keys, ENTER, etc.)
        this.keyBuffer = '';
      }
    } else {
      // Reset buffer if we're in an input field or address bar
      this.keyBuffer = '';
    }
    return false; // Indicate that we didn't handle the key
  }

  setupInput() {
    this.term.grabInput({ mouse: 'button' });
    let isListening = true;

    this.term.on('key', async (key) => {
      logClicks(`Key pressed: ${key}, focusedElement: ${this.focusedElement}`);

      // Handle Dino command
      if (await this.handleDinoCommand(key, isListening)) {
        isListening = false; // Pause browser input while game runs
        return;
      }

      // Handle global keybindings
      if (this.handleGlobalKeybindings(key, isListening)) {
        isListening = false;
        return;
      }

      // Handle specific element types
      if (this.focusedElement.startsWith('input:')) {
        this.handleInputKey(key);
      } else if (this.focusedElement.startsWith('clickable:')) {
        this.handleClickableKey(key);
      } else if (this.focusedElement === 'address') {
        this.handleAddressKey(key);
      } else {
        this.handleUIKey(key);
      }
    });

    this.term.on('mouse', (name, data) => {
      this.handleMouseEvent(name, data);
    });

    this.stopListening = () => { isListening = false; };
  }

  // Extracted method for global keybindings
  handleGlobalKeybindings(key, isListening) {
    if (key === 'CTRL_C') {
      this.term.clear();
      this.term.processExit(0);
      return true; // Stop listening
    }
    if (key === 'CTRL_T') {
      this.emit('newTabRequested', { title: `New ${this.tabs.length + 1}`, url: 'about:blank' });
      return false;
    }
    if (key === 'CTRL_W') {
      if (this.selectedTabIndex >= 0) this.closeTab(this.selectedTabIndex);
      return false;
    }
    return false; // Continue listening
  }

  // Extracted method for input field key handling
  async handleInputKey(key) {
    const backendNodeId = this.focusedElement.split(':')[1];
    const inputState = this.inputFields.get(backendNodeId);
    if (!inputState) {
      logClicks(`No input state for ${backendNodeId}`);
      return;
    }
    logClicks(`Input focused, backendNodeId: ${backendNodeId}, current value: ${inputState.value}`);

    if (key === 'ENTER') {
      await this.handleInputEnter(backendNodeId, inputState);
      this.redrawUnfocusedInput(backendNodeId);
      this.focusedElement = 'tabs';
      this.previousFocusedElement = this.focusedElement;
      if (inputState.onChange) inputState.onChange(inputState.value);
      this.render();
    } else {
      switch (key) {
        case 'LEFT':
          if (inputState.cursorPosition > 0) inputState.cursorPosition--;
          this.redrawFocusedInput();
          break;
        case 'RIGHT':
          if (inputState.cursorPosition < inputState.value.length) inputState.cursorPosition++;
          this.redrawFocusedInput();
          break;
        case 'BACKSPACE':
          if (inputState.cursorPosition > 0) {
            inputState.value = inputState.value.slice(0, inputState.cursorPosition - 1) + inputState.value.slice(inputState.cursorPosition);
            inputState.cursorPosition--;
            if (inputState.onChange) inputState.onChange(inputState.value);
            this.redrawFocusedInput();
          }
          break;
        case 'TAB':
          this.focusNextElement();
          break;
        case 'SHIFT_TAB':
          this.focusPreviousElement();
          break;
        case 'UP':
        case 'DOWN':
          this.emit('scroll', { direction: key === 'UP' ? -1 : 1 });
          break;
        default:
          if (key.length === 1) {
            inputState.value = inputState.value.slice(0, inputState.cursorPosition) + key + inputState.value.slice(inputState.cursorPosition);
            inputState.cursorPosition++;
            logClicks(`Updated value: ${inputState.value}`);
            if (inputState.onChange) inputState.onChange(inputState.value);
            this.redrawFocusedInput();
          }
          break;
      }
    }
  }

  // Extracted method for handling ENTER in input fields
  async handleInputEnter(backendNodeId, inputState) {
    const keyCommand = keyEvent('ENTER');
    if (keyCommand) {
      try {
        await this.getState().send(keyCommand.command.name, keyCommand.command.params, this.getState().sessionId);
        keyCommand.command.params.type = "keyUp";
        keyCommand.command.params.text = undefined;
        await sleep(50);
        await this.getState().send(keyCommand.command.name, keyCommand.command.params, this.getState().sessionId);
        logClicks(`Sent Enter key event for backendNodeId: ${backendNodeId} and session ${this.getState().sessionId}`);
      } catch (error) {
        logClicks(`Failed to send Enter key event for backendNodeId ${backendNodeId}: ${error.message}`);
        //process.exit(0);
      }
    }
  }

  // Extracted method for clickable elements
  async handleClickableKey(key) {
    const backendNodeId = this.focusedElement.split(':')[1];
    const publicState = this.getState();
    const tabbable = this.computeTabbableElements();
    const focusedElement = tabbable.find(el => el.type === 'clickable' && ('' + el.backendNodeId) === backendNodeId);

    if (key === 'ENTER') {
      if (focusedElement) {
        await handleClick({
          termX: focusedElement.x,
          termY: focusedElement.y,
          clickableElements: publicState.clickableElements,
          clickCounter: publicState.clickCounter,
          layoutToNode: publicState.layoutToNode,
          nodeToParent: publicState.nodeToParent,
          nodes: publicState.nodes,
        });
        this.render();
      } else {
        logClicks(`No tabbable element found for clickable:${backendNodeId}`);
      }
    } else if (key === 'TAB' || key === 'l') {
      this.focusNextElement();
    } else if (key === 'SHIFT_TAB' || key === 'h') {
      this.focusPreviousElement();
    } else {
      switch (key) {
        case 'UP':
        case 'DOWN':
          this.emit('scroll', { direction: key === 'UP' ? -1 : 1 });
          break;
        case 'j':
          this.focusNearestInRow('down');
          break;
        case 'k':
          this.focusNearestInRow('up');
          break;
      }
    }
  }

  // Extracted method for address bar key handling
  handleAddressKey(key) {
    switch (key) {
      case 'ENTER':
        this.emit('navigate', this.addressContent);
        if (this.selectedTabIndex !== -1) {
          this.tabs[this.selectedTabIndex].url = this.addressContent;
        }
        this.render();
        break;
      case 'TAB':
        this.focusNextElement();
        break;
      case 'SHIFT_TAB':
        this.focusPreviousElement();
        break;
      case 'LEFT':
        if (this.cursorPosition > 0) this.cursorPosition--;
        this.render();
        break;
      case 'RIGHT':
        if (this.cursorPosition < this.addressContent.length) this.cursorPosition++;
        this.render();
        break;
      case 'BACKSPACE':
        if (this.cursorPosition > 0) {
          this.addressContent = this.addressContent.slice(0, this.cursorPosition - 1) + this.addressContent.slice(this.cursorPosition);
          this.cursorPosition--;
          this.render();
        }
        break;
      case 'UP':
      case 'DOWN':
        this.emit('scroll', { direction: key === 'UP' ? -1 : 1 });
        break;
      default:
        if (key.length === 1) {
          this.addressContent = this.addressContent.slice(0, this.cursorPosition) + key + this.addressContent.slice(this.cursorPosition);
          this.cursorPosition++;
          this.render();
        }
        break;
    }
  }

  // Extracted method for UI key handling (tabs, back, forward, go, etc.)
  handleUIKey(key) {
    switch (key) {
      case 'j':
        this.focusNearestInRow('down');
        break;
      case 'k':
        this.focusNearestInRow('up');
        break;
      case 'h':
        if (this.focusedElement === 'tabs' && this.focusedTabIndex > 0) {
          this.focusedTabIndex--;
          this.render();
        } else {
          this.focusPreviousElement();
        }
        break;
      case 'l':
        if (this.focusedElement === 'tabs' && this.focusedTabIndex < this.tabs.length - 1) {
          this.focusedTabIndex++;
          this.render();
        } else {
          this.focusNextElement();
        }
        break;
      case 'ENTER':
        this.handleUIEnter();
        this.render();
        break;
      case 'TAB':
        this.focusNextElement();
        break;
      case 'SHIFT_TAB':
        this.focusPreviousElement();
        break;
      case 'LEFT':
        if (this.focusedElement === 'tabs' && this.focusedTabIndex > 0) {
          this.focusedTabIndex--;
          this.render();
        }
        break;
      case 'RIGHT':
        if (this.focusedElement === 'tabs' && this.focusedTabIndex < this.tabs.length - 1) {
          this.focusedTabIndex++;
          this.render();
        }
        break;
      case 'UP':
      case 'DOWN':
        this.emit('scroll', { direction: key === 'UP' ? -1 : 1 });
        break;
    }
  }

  // Extracted method for handling ENTER in UI elements
  handleUIEnter() {
    if (this.focusedElement === 'tabs') {
      this.selectedTabIndex = this.focusedTabIndex;
      this.emit('tabSelected', this.tabs[this.selectedTabIndex]);
    } else if (this.focusedElement === 'newTab') {
      this.emit('newTabRequested', { title: `New ${this.tabs.length + 1}`, url: 'about:blank' });
    } else if (this.focusedElement === 'back') {
      this.emit('back');
    } else if (this.focusedElement === 'forward') {
      this.emit('forward');
    } else if (this.focusedElement === 'go') {
      this.emit('navigate', this.addressContent);
      if (this.selectedTabIndex !== -1) {
        this.tabs[this.selectedTabIndex].url = this.addressContent;
      }
    }
  }

  // Extracted method for mouse events
  handleMouseEvent(name, data) {
    const { x, y } = data;
    if (name === 'MOUSE_LEFT_BUTTON_PRESSED') {
      this.handleMouseClick(x, y);
    } else if (name === 'MOUSE_WHEEL_UP' || name === 'MOUSE_WHEEL_DOWN') {
      if (y > 4) {
        this.emit('scroll', { direction: name === 'MOUSE_WHEEL_UP' ? -1 : 1 });
      }
    }
  }

  // Extracted method for mouse click handling
  handleMouseClick(x, y) {
    // Tab row (y = 1)
    if (y === 1) {
      if (x >= this.term.width - this.NEW_TAB_WIDTH + 1 && x <= this.term.width) {
        this.emit('newTabRequested', { title: `New ${this.tabs.length + 1}`, url: 'about:blank' });
        return;
      }
      let tabX = 1;
      for (let i = this.tabOffset; i < this.tabs.length && tabX <= this.term.width - this.NEW_TAB_WIDTH; i++) {
        const tabEnd = tabX + this.options.tabWidth - 1;
        if (x >= tabX && x <= tabEnd) {
          const closeXStart = tabX + this.options.tabWidth - 5;
          if (x >= closeXStart && x <= closeXStart + 3) {
            this.closeTab(i);
          } else {
            this.focusedTabIndex = i;
            this.focusedElement = 'tabs';
            this.selectedTabIndex = i;
            this.emit('tabSelected', this.tabs[i]);
          }
          this.render();
          return;
        }
        tabX += this.options.tabWidth;
      }
    }

    // Omnibox row (y = 3)
    if (y === this.TAB_HEIGHT + 2) {
      if (x >= 2 && x <= this.BACK_WIDTH + 1) {
        this.focusedElement = 'back';
        this.emit('back');
      } else if (x >= this.BACK_WIDTH + 2 && x <= this.BACK_WIDTH + this.FORWARD_WIDTH + 1) {
        this.focusedElement = 'forward';
        this.emit('forward');
      } else if (x >= this.BACK_WIDTH + this.FORWARD_WIDTH + 2 && x <= this.BACK_WIDTH + this.FORWARD_WIDTH + this.ADDRESS_WIDTH + 1) {
        this.focusedElement = 'address';
        this.cursorPosition = Math.min(
          Math.max(0, x - (this.BACK_WIDTH + this.FORWARD_WIDTH + 2)),
          this.addressContent.length
        );
      } else if (x >= this.term.width - this.GO_WIDTH + 1 && x <= this.term.width) {
        this.focusedElement = 'go';
        this.emit('navigate', this.addressContent);
        if (this.selectedTabIndex !== -1) {
          this.tabs[this.selectedTabIndex].url = this.addressContent;
        }
      }
      this.render();
      return;
    }

    // Content area (y > 4)
    if (y > 4) {
      this.emit('click', { x, y });
    }
  }

  redrawClickable(backendNodeId) {
    const publicState = this.getState();
    const renderData = this.getRenderData(backendNodeId, publicState);
    if (!renderData) return;

    const { boxes, minX, maxY, ancestorType } = renderData;
    debugLog(`Boxes for parent ${backendNodeId}:`, boxes);
    debugLog(`AncestorType for ${backendNodeId}: ${ancestorType}`);

    // Render each line at its termY
    for (let y = renderData.minY; y <= maxY; y++) {
      this.term.moveTo(minX, y);
      const boxAtY = boxes.find(b => b.termY === y);
      let lineText = boxAtY ? boxAtY.text : '';
      lineText = lineText.slice(0, this.term.width - minX + 1);

      this.term.bgCyan();
      if (ancestorType === 'button') {
        this.term.green(lineText);
      } else if (ancestorType === 'hyperlink') {
        this.term.black().underline(lineText);
      } else if (ancestorType === 'other_clickable') {
        this.term.defaultColor().bold(lineText);
      } else {
        this.term.defaultColor(lineText);
      }
    }
    debugLog(`Redraw ${backendNodeId} with ancestorType ${ancestorType} ${JSON.stringify({ minX, minY: renderData.minY, maxX: renderData.maxX, maxY })}`);
    this.term.bgDefaultColor().defaultColor();
    this.term.styleReset();
  }

  redrawUnfocusedElement(backendNodeId) {
    const publicState = this.getState();
    const renderData = this.getRenderData(backendNodeId, publicState);
    if (!renderData) return;

    const { boxes, minX, maxY, ancestorType } = renderData;

    if (boxes[0].type === 'input') {
      const inputState = this.inputFields.get('' + backendNodeId);
      if (!inputState) return;
      const { x, y, width, value } = inputState;
      const displayWidth = Math.min(width, this.term.width - x + 1);
      this.term.moveTo(x, y);
      this.term.bgWhite().black(value.slice(0, displayWidth).padEnd(displayWidth, ' '));
    } else {
      for (let y = renderData.minY; y <= maxY; y++) {
        this.term.moveTo(minX, y);
        const boxAtY = boxes.find(b => b.termY === y);
        let lineText = boxAtY ? boxAtY.text : '';
        lineText = lineText.slice(0, this.term.width - minX + 1);

        this.term.defaultColor().bgDefaultColor();
        this.term.styleReset();
        if (ancestorType === 'button') {
          this.term.bgGreen().black(lineText);
        }
        else if (ancestorType === 'hyperlink') this.term.cyan().underline(lineText);
        else if (ancestorType === 'other_clickable') this.term.bold(lineText);
        else this.term(lineText);
      }
    }
    this.term.bgDefaultColor().defaultColor();
    this.term.styleReset();
  }

  getRenderData(backendNodeId, publicState) {
    if (!publicState || !renderedBoxes || !publicState.nodeToParent || !publicState.nodes) {
      debugLog(`Missing state data for backendNodeId ${backendNodeId}`);
      return null;
    }

    // Find all child node indices under this parent backendNodeId
    const childNodeIndices = new Set();
    let parentNodeIndex = -1;
    publicState.nodes.backendNodeId.forEach((id, nodeIdx) => {
      if (id == backendNodeId) {
        parentNodeIndex = nodeIdx;
        childNodeIndices.add(nodeIdx);
        const collectChildren = (idx) => {
          const children = Array.from(renderedBoxes)
            .filter(b => publicState.nodeToParent.get(b.nodeIndex) === idx)
            .map(b => b.nodeIndex);
          children.forEach(childIdx => {
            childNodeIndices.add(childIdx);
            collectChildren(childIdx);
          });
        };
        collectChildren(nodeIdx);
      }
    });

    const boxes = renderedBoxes.filter(b => childNodeIndices.has(b.nodeIndex));
    if (!boxes.length) {
      debugLog(`No boxes found for parent ${backendNodeId} with node indices:`, Array.from(childNodeIndices));
      return null;
    }

    const minX = Math.min(...boxes.map(b => b.termX));
    const maxX = Math.max(...boxes.map(b => b.termX + b.termWidth - 1));
    const minY = Math.min(...boxes.map(b => b.termY));
    const maxY = Math.max(...boxes.map(b => b.termY));
    const ancestorType = parentNodeIndex !== -1 ? getAncestorInfo(parentNodeIndex, publicState.nodes, publicState.strings || []) : boxes[0].ancestorType;

    // Sort boxes by termY for rendering
    boxes.sort((a, b) => a.termY - b.termY);

    return { boxes, minX, maxX, minY, maxY, ancestorType };
  }

  // Update setFocus
  setFocus(element) {
    debugLog(`Setting focus from ${this.focusedElement} to ${element.type}:${element.backendNodeId || element.index || element.type}`);
    this.previousFocusedElement = this.focusedElement;

    // Unfocus previous element
    if (this.previousFocusedElement?.startsWith('input:')) {
      const prevId = this.previousFocusedElement.split(':')[1];
      this.redrawUnfocusedElement(prevId);
    } else if (this.previousFocusedElement?.startsWith('clickable:')) {
      const prevId = this.previousFocusedElement.split(':')[1];
      this.redrawUnfocusedElement(prevId);
    }

    if (element.type === 'tab') {
      this.focusedElement = 'tabs';
      this.focusedTabIndex = element.index;
      this.drawTabs(); // Redraw tabs for UI focus
    } else if (element.type === 'input') {
      // perhaps doing this through an emit to have unidirectional flow is cleaner
      const publicState = this.getState();
      const midX = element.x + Math.floor(element.width/2);
      const midY = element.y + Math.floor(element.height/2);
      const clickedBox = getClickedBox({ termX: midX, termY : midY });
      const { send, sessionId } = publicState;
      focusInput({ clickedBox, browser: this, send, sessionId, termX: element.x + element.width });
      //this.focusInput(element.backendNodeId); // This already handles redraw but is called by above
    } else if (element.type === 'clickable') {
      this.focusedElement = `clickable:${element.backendNodeId}`;
      this.redrawClickable(element.backendNodeId); // Redraw only this element
    } else {
      this.focusedElement = element.type;
      if (element.type === 'address') this.cursorPosition = this.addressContent.length;
      this.drawOmnibox(); // Redraw omnibox for UI focus
    }
    this.term.bgDefaultColor().defaultColor();
    this.term.styleReset();
    this.render();
  }

  // Update focusNextElement and focusPreviousElement to avoid full render
  focusNextElement() {
    const tabbable = this.computeTabbableElements();
    if (!tabbable.length) return;

    const currentIdx = this.currentFocusIndex;
    const nextIdx = (currentIdx + 1) % tabbable.length;
    this.currentFocusIndex = nextIdx;
    this.setFocus(tabbable[nextIdx]);
    this.render();
  }

  focusPreviousElement() {
    const tabbable = this.computeTabbableElements();
    if (!tabbable.length) return;

    const currentIdx = this.currentFocusIndex;
    const prevIdx = (currentIdx - 1 + tabbable.length) % tabbable.length;
    this.currentFocusIndex = prevIdx;
    this.setFocus(tabbable[prevIdx]);
    this.render();
  }

  // API Methods

  addTab(tab) {
    // Emit an event to request a new tab; main logic will handle creation
    this.emit('newTabRequested', tab);
  }

  addTabToUI(tab) {
    this.tabs.push({
      title: tab.title,
      url: tab.url,
      color: this.options.colors[this.tabs.length % this.options.colors.length],
    });
    this.render();
  }

  closeTab(index) {
    this.emit('tabClosed', index);
  }

  getTab(index) {
    return this.tabs[index];
  }

  setTab(index, tab) {
    this.tabs[index] = tab;
    this.setAddress(tab.url);
    this.render();
  }

  getTabs() {
    return [...this.tabs];
  }

  setAddress(url) {
    this.addressContent = url;
    this.cursorPosition = url.length;
    this.render();
  }

  getAddress() {
    return this.addressContent;
  }

  focus(element) {
    if (element === 'tabs' || element === 'back' || element === 'forward' || element === 'address' || element === 'go') {
      this.focusedElement = element;
      if (element === 'tabs') this.focusedTabIndex = Math.min(this.focusedTabIndex, this.tabs.length - 1);
      if (element === 'address') this.cursorPosition = this.addressContent.length;
      this.render();
    }
  }

  async showModal(type, message) {
    const modalWidth = Math.min(50, this.term.width - 10);
    const modalHeight = 5;
    const modalX = Math.floor((this.term.width - modalWidth) / 2);
    const modalY = Math.floor((this.term.height - modalHeight) / 2);

    // Draw modal background
    this.term.moveTo(modalX, modalY);
    this.term.bgWhite().black(' '.repeat(modalWidth));
    for (let i = 1; i < modalHeight - 1; i++) {
      this.term.moveTo(modalX, modalY + i);
      this.term.bgWhite().black(' '.repeat(modalWidth));
    }
    this.term.moveTo(modalX, modalY + modalHeight - 1);
    this.term.bgWhite().black(' '.repeat(modalWidth));

    // Draw message
    const wrappedMessage = this.term.wrapColumn({ width: modalWidth - 4 });
    this.term.moveTo(modalX + 2, modalY + 1);
    this.term.bgWhite().black(message);

    // Wait for any key press
    await new Promise(resolve => {
      this.term.once('key', () => {
        this.render(); // Redraw the UI to remove the modal
        resolve();
      });
    });
  }
  destroy() {
    this.term.clear();
    this.term.processExit(0);
  }
}

// helpers
      function keyEvent(key) {
        // Map TUI key to key definition (e.g., 'ENTER' -> 'Enter')
        const keyName = key === 'ENTER' ? 'Enter' : key;
        const def = keys[keyName];

        if (!def) {
          console.warn(`Unknown key: ${key}`);
          return null;
        }

        // Determine event type
        const type = def.text ? 'keyDown' : 'rawKeyDown'; // For Enter, this will be 'keyDown' due to text: '\r'

        // Construct the CDP command
        const command = {
          name: 'Input.dispatchKeyEvent',
          params: {
            type,
            text: def.text, // '\r' for Enter
            code: def.code, // 'Enter'
            key: def.key,   // 'Enter'
            windowsVirtualKeyCode: def.keyCode, // 13
            modifiers: 0,   // No modifiers for now (e.g., no Shift, Ctrl)
          },
          requiresShot: ['Enter'].includes(def.key), // Trigger a screenshot if needed
        };

        if (def.location) {
          command.params.location = def.location;
        }

        return { command };
      }      

