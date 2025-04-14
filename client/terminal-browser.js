import termkit from 'terminal-kit';
import { EventEmitter } from 'events';
import {sleep, focusLog, debugLog, logClicks} from './log.js';
import {getAncestorInfo} from './layout.js';
import {sessions,getClickedBox,focusInput,renderedBoxes,handleClick} from './baby-jaguar.js';
import KEYS from './kbd.js';
import { dinoGame } from './dino.js';

const term = termkit.terminal;

export default class TerminalBrowser extends EventEmitter {
  constructor(options = {}, getState) {
    super();
    const ogEmit = this.emit.bind(this);
    this.focusState = new Map();
    this.emit = (...stuff) => {
      switch(stuff[0]) {
        case 'scroll':
          this.tabbableCached = false;
          break;
        case 'tabSelected':
          if ( ! this.focusState.has(sessions.get(stuff[1]?.targetId)) ) {
            this.tabbableCached = false;
          }
          break;
        default:
          break;
      } 
      return ogEmit(...stuff);
    };
    this.currentFocusIndex = 0;
    this.getState = getState;
    this.term = term;
    this.options = {
      tabWidth: options.tabWidth || Math.max(Math.ceil(this.term.width/4), 15),
      initialTabs: options.initialTabs || [
        { title: 'Home', url: 'https://home.com' },
      ],
      colors: options.colors || ['brightBlue'],
    };

    // State
    this.targets = this.options.initialTabs.map(tab => ({
      ...tab,
    }));
    this.targets = this.targets;
    if (this.targets.length === 0) {
      this.emit('newTabRequested', { title: 'New Tab', url: 'about:blank' });
    }
    this.tabOffset = 0;
    this.selectedTabId = null;
    this.focusedElement = 'address'; // 'tabs', 'back', 'forward', 'address', 'go', or 'input:<backendNodeId>'
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

  saveFocusState() {
    const { sessionId } = this.getState();
    const {
      tabbableCached,
      selectedTabId,
      focusedElement,
      previousFocusedElement,
      cursorPosition,
      currentFocusIndex // Add this to preserve the focus index
    } = this;
    // Do not save tabbableCache directly; it will be recomputed on restore
    const focusState = {
      tabbableCached: false, // Force recompute on restore
      selectedTabId,
      focusedElement,
      previousFocusedElement,
      cursorPosition,
      currentFocusIndex
    };
    focusLog('save', sessionId, focusState, (new Error).stack);
    this.focusState.set(sessionId, focusState);
  }

  restoreFocusState() {
    const { sessionId } = this.getState();
    const focusState = this.focusState.get(sessionId);
    if (!focusState) {
      // If no state exists, reset to a default state
      this.tabbableCached = false;
      this.currentFocusIndex = 0;
      this.focusedElement = `tabs:${this.selectedTabId || this.targets[0]?.targetId || ''}`;
      this.previousFocusedElement = null;
      this.cursorPosition = 0;
      return;
    }
    focusLog('restore', sessionId, focusState, (new Error).stack);
    // Restore state but ensure tabbableCache is recomputed
    this.tabbableCached = false; // Force recompute
    this.selectedTabId = focusState.selectedTabId;
    this.focusedElement = focusState.focusedElement;
    this.previousFocusedElement = focusState.previousFocusedElement;
    this.cursorPosition = focusState.cursorPosition;
    this.currentFocusIndex = focusState.currentFocusIndex || 0;
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
    if (this.focusedElement.startsWith('tabs:')) {
      current = tabbable.find(el => el.type === 'tab' && `tabs:${el.targetId}` == this.focusedElement) || tabbable[0];
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
    if (this.tabbableCached) return this.tabbableCache;
    const tabbable = [];

    // Browser UI elements
    this.targets.forEach((tab, index) => {
      const x = 1 + index * this.options.tabWidth;
      tabbable.push({ type: 'tab', index, x, y: 1, targetId: tab.targetId });
    });
    tabbable.push({ type: 'newTab', x: this.term.width - this.NEW_TAB_WIDTH + 1, y: 1 });
    tabbable.push({ type: 'back', x: 2, y: this.TAB_HEIGHT + 2 });
    tabbable.push({ type: 'forward', x: this.BACK_WIDTH + 2, y: this.TAB_HEIGHT + 2 });
    tabbable.push({ type: 'address', x: this.BACK_WIDTH + this.FORWARD_WIDTH + 2, y: this.TAB_HEIGHT + 2 });
    tabbable.push({ type: 'go', x: this.term.width - this.GO_WIDTH, y: this.TAB_HEIGHT + 2 });

    const publicState = this.getState();
    if (!publicState || !renderedBoxes || !publicState.layoutToNode || !publicState.nodeToParent || !publicState.nodes) {
      debugLog('Missing state, renderedBoxes, or layout data');
      return tabbable;
    }

    debugLog('Rendered Boxes Count:', renderedBoxes.length);

    // Helper to check if a node has clickable descendants
    const hasClickableDescendants = (nodeIdx) => {
      const descendants = [];
      const collectDescendants = (idx) => {
        publicState.nodeToParent.forEach((parentIdx, childIdx) => {
          if (parentIdx === idx) {
            descendants.push(childIdx);
            collectDescendants(childIdx);
          }
        });
      };
      collectDescendants(nodeIdx);
      return descendants.some(idx => publicState.nodes.isClickable?.index.includes(idx));
    };

    // Group clickable elements by their nearest clickable ancestor
    const elementsByParentId = new Map();
    renderedBoxes.forEach(box => {
      // Include both inputs and clickable elements, including buttons
      if (!box.isClickable && box.type !== 'input' && box.ancestorType !== 'button') return;

      // Find the clickable parent's backendNodeId
      let parentBackendNodeId = box.backendNodeId;
      let parentNodeIndex = box.nodeIndex;
      let currentNodeIndex = box.nodeIndex;

      while (currentNodeIndex !== -1 && currentNodeIndex !== undefined) {
        if (publicState.nodes.isClickable && publicState.nodes.isClickable.index.includes(currentNodeIndex)) {
          parentBackendNodeId = publicState.nodes.backendNodeId[currentNodeIndex];
          parentNodeIndex = currentNodeIndex;
          break;
        }
        currentNodeIndex = publicState.nodeToParent.get(currentNodeIndex);
      }

      // Skip if the nearest clickable ancestor is #document
      const nodeNameIdx = publicState.nodes.nodeName[parentNodeIndex];
      const nodeName = nodeNameIdx >= 0 ? publicState.strings[nodeNameIdx] : '';
      if (nodeName === '#document' || publicState.nodes.nodeType[parentNodeIndex] === 9) {
        return; // Skip #document
      }

      // Include buttons even if they have clickable descendants
      const isButton = box.ancestorType === 'button';
      if (!isButton && hasClickableDescendants(parentNodeIndex)) {
        return; // Skip non-buttons with clickable descendants
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
    elementsByParentId.forEach(elem => {
      tabbable.push({
        type: elem.type,
        backendNodeId: elem.backendNodeId,
        x: elem.minX,
        y: elem.minY,
        width: elem.maxX - elem.minX + 1,
        height: elem.maxY - elem.minY + 1,
        text: elem.text,
        ancestorType: elem.ancestorType,
        boxes: elem.boxes
      });
    });

    debugLog('Final Tabbable Elements Count:', tabbable.length);
    debugLog(JSON.stringify(tabbable, null, 2));
    tabbable.sort((a, b) => a.y - b.y || a.x - b.x);
    this.tabbableCached = true;
    this.tabbableCache = tabbable;
    return tabbable;
  }

  drawTabs() {
    this.term.moveTo(1, 1);
    this.term.bgBlue().white(' '.repeat(this.term.width));
    let x = 1;
    for (let i = this.tabOffset; i < this.targets.length && x <= this.term.width - this.NEW_TAB_WIDTH; i++) {
      const maxTitleLength = this.options.tabWidth - 5;
      const truncatedTitle = this.targets[i].title.slice(0, maxTitleLength);
      const titlePart = ` ${truncatedTitle}`;
      const paddingLength = this.options.tabWidth - titlePart.length - 3;
      const tabText = `${titlePart}${' '.repeat(paddingLength)}[x]`;

      this.term.moveTo(x, 1);
      const isFocused = this.focusedElement === `tabs:${this.targets[i].targetId}`;
      const isSelected = this.selectedTabId === this.targets[i].targetId;

      if (isSelected && isFocused) {
        // Selected and focused: Bright green background, black text
        this.term.bgBrightGreen().black().bold().underline(tabText);
      } else if (isSelected) {
        // Selected but not focused: Bright green background, white text
        this.term.bgBrightGreen().white().bold().underline(tabText);
      } else if (isFocused) {
        // Focused but not selected: Cyan background, black text
        this.term.bgCyan().black().bold().underline(tabText);
      } else {
        // Neither focused nor selected: Blue background, default text
        this.term.bgBlue().defaultColor(tabText);
      }
      x += tabText.length;
    }

    this.term.moveTo(this.term.width - this.NEW_TAB_WIDTH + 1, 1);
    if (this.focusedElement === 'newTab') {
      this.term.bgCyan().black(' [+] ');
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
  handleGlobalKeybindings(key) {
    if (key === 'CTRL_C') {
      this.term.clear();
      this.term.processExit(0);
      return true; // Stop listening
    }
    if (key === 'CTRL_T') {
      this.emit('newTabRequested', { title: `New ${this.targets.length + 1}`, url: 'about:blank' });
      return false;
    }
    if (key === 'CTRL_W') {
      if (this.selectedTabId) this.closeTab(this.selectedTabId);
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
      await this.handleInputCommit(backendNodeId, inputState);
      this.redrawUnfocusedInput(backendNodeId);
      this.focusedElement = `tabs:${this.selectedTabId}`;
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
  async handleInputCommit(backendNodeId, inputState, {useEnter = true} = {}) {
    let keys;
    if ( useEnter ) {
      keys = KEYS.keyEvent('Enter', 'Space', 'Backspace');
    } else {
      keys = KEYS.keyEvent('Space', 'Backspace');
    }
    const {send,sessionId} = this.getState();
    for ( const {command:{name,params}} of keys ) {
      try {
        await send(name, params, sessionId);
        await sleep(50);
        logClicks(`Sent key (${params.key},${params.type}) event for backendNodeId: ${backendNodeId} and session ${sessionId}`);
      } catch(error) {
        logClicks(`Failed to send Enter key event for backendNodeId ${backendNodeId}: ${error.message}`);
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
        case '[':
          this.focusPreviousTab();
          break;
        case ']':
          this.focusNextTab();
          break;
      }
    }
  }

  // Extracted method for address bar key handling
  handleAddressKey(key) {
    switch (key) {
      case 'ENTER':
        this.emit('navigate', this.addressContent);
        if (this.selectedTabId !== null) {
          this.targets.find(t => t.targetId == this.selectedTabId).url = this.addressContent;
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
      case 'h':
      case 'LEFT':
        // Only move focus, not selection
        this.focusPreviousElement();
        break;
      case 'l':
      case 'RIGHT':
        // Only move focus, not selection
        this.focusNextElement();
        break;
      case 'UP':
      case 'DOWN':
        this.emit('scroll', { direction: key === 'UP' ? -1 : 1 });
        break;
      case '[':
        this.focusPreviousTab(); // Changes selection
        break;
      case ']':
        this.focusNextTab(); // Changes selection
        break;
    }
  }

  focusNextTab() {
    // Use selectedTabId to find the current tab index
    const currentTabIndex = this.targets.findIndex(t => t.targetId === this.selectedTabId);
    const nextTabIndex = (currentTabIndex + 1) % this.targets.length;
    this.selectedTabId = this.targets[nextTabIndex].targetId;
    const selectedTab = this.targets[nextTabIndex];
    this.emit('tabSelected', selectedTab);
    this.render(); // Ensure the UI updates to reflect the new selection
  }

  focusPreviousTab() {
    // Use selectedTabId to find the current tab index
    const currentTabIndex = this.targets.findIndex(t => t.targetId === this.selectedTabId);
    const previousTabIndex = (currentTabIndex - 1 + this.targets.length) % this.targets.length;
    this.selectedTabId = this.targets[previousTabIndex].targetId;
    const selectedTab = this.targets[previousTabIndex];
    this.emit('tabSelected', selectedTab);
    this.render(); // Ensure the UI updates to reflect the new selection
  }
  // Extracted method for handling ENTER in UI elements
  handleUIEnter() {
    if (this.focusedElement.startsWith('tabs:')) {
      this.saveFocusState();
      this.selectedTabId = this.focusedElement.split(':')[1];
      this.emit('tabSelected', this.targets.find(t => t.targetId == this.selectedTabId));
    } else if (this.focusedElement === 'newTab') {
      this.emit('newTabRequested', { title: `New ${this.targets.length + 1}`, url: 'about:blank' });
    } else if (this.focusedElement === 'back') {
      this.emit('back');
    } else if (this.focusedElement === 'forward') {
      this.emit('forward');
    } else if (this.focusedElement === 'go') {
      this.emit('navigate', this.addressContent);
      if (this.selectedTabId !== null) {
        this.targets.find(t => t.targetId == this.selectedTabId).url = this.addressContent;
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
        this.emit('newTabRequested', { title: `New ${this.targets.length + 1}`, url: 'about:blank' });
        return;
      }
      let tabX = 1;
      for (let i = this.tabOffset; i < this.targets.length && tabX <= this.term.width - this.NEW_TAB_WIDTH; i++) {
        const tabEnd = tabX + this.options.tabWidth - 1;
        if (x >= tabX && x <= tabEnd) {
          const closeXStart = tabX + this.options.tabWidth - 5;
          if (x >= closeXStart && x <= closeXStart + 3) {
            this.closeTab(i);
          } else {
            this.saveFocusState();
            this.selectedTabId = this.targets[i].targetId;
            this.focusedElement = `tabs:${this.selectedTabId}`;
            this.emit('tabSelected', this.targets[i]);
          }
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
        if (this.selectedTabId !== null) {
          this.targets.find(t => t.targetId == this.selectedTabId).url = this.addressContent;
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
    debugLog(`Boxes for parent ${backendNodeId}: ${JSON.stringify(boxes)}`);
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

    if ( !boxes.length ) return;

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

    // Find all descendant node indices under this backendNodeId
    const descendantNodeIndices = new Set();
    let parentNodeIndex = -1;
    publicState.nodes.backendNodeId.forEach((id, nodeIdx) => {
      if (id == backendNodeId) {
        parentNodeIndex = nodeIdx;
        descendantNodeIndices.add(nodeIdx);
        const collectDescendants = (idx) => {
          // Collect all nodes whose parent is idx
          publicState.nodeToParent.forEach((parentIdx, childIdx) => {
            if (parentIdx === idx) {
              descendantNodeIndices.add(childIdx);
              collectDescendants(childIdx); // Recurse to get grandchildren, etc.
            }
          });
        };
        collectDescendants(nodeIdx);
      }
    });

    const boxes = renderedBoxes.filter(b => descendantNodeIndices.has(b.nodeIndex));
    const ancestorType = parentNodeIndex !== -1 ? getAncestorInfo(parentNodeIndex, publicState.nodes, publicState.strings || []) : (boxes[0]?.ancestorType || 'normal');
    if (!boxes.length) {
      debugLog(`No boxes found for parent ${backendNodeId} with node indices: ${JSON.stringify(Array.from(descendantNodeIndices))}`);
      return { boxes, ancestorType };
    } else {
      debugLog(`Boxes for parent ${backendNodeId} with descendant node indices ${JSON.stringify(Array.from(descendantNodeIndices))}: ${JSON.stringify(boxes)}`);
    }

    const minX = Math.min(...boxes.map(b => b.termX));
    const maxX = Math.max(...boxes.map(b => b.termX + b.termWidth - 1));
    const minY = Math.min(...boxes.map(b => b.termY));
    const maxY = Math.max(...boxes.map(b => b.termY));

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
      this.focusedElement = `tabs:${this.selectedTabId}`;
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
    this.targets.push({
      title: tab.title,
      url: tab.url,
      color: this.options.colors[this.targets.length % this.options.colors.length],
    });
    this.render();
  }

  closeTab(index) {
    this.emit('tabClosed', index);
  }

  getTab(index) {
    return this.targets[index];
  }

  setTab(index, tab) {
    this.targets[index] = tab;
    this.setAddress(tab.url);
    this.render();
  }

  getTabs() {
    return [...this.targets];
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
    if (element.startsWith('tabs:') || element === 'back' || element === 'forward' || element === 'address' || element === 'go') {
      this.focusedElement = element;
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


