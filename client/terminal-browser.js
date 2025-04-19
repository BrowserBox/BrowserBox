import termkit from 'terminal-kit';
import { EventEmitter } from 'events';
import { sleep, debugLog } from './log.js';
import { getAncestorInfo } from './layout.js';
import { getBrowserState, getTabState, sessions, getClickedBox, focusInput, renderedBoxesBySession } from './baby-jaguar.js';
import { FocusManager } from './focus-manager.js';
import { InputManager } from './input-manager.js';

const term = termkit.terminal;

export default class TerminalBrowser extends EventEmitter {
  #activeModal = null;

  constructor(options = {}) {
    super();
    this.getTabState = getTabState;
    this.getBrowserState = getBrowserState;
    this.getCurrentTabState = () => {
      return this.getTabState(this.getBrowserState().currentSessionId);
    };
    this.focusManager = new FocusManager(getTabState, getBrowserState);
    const ogEmit = this.emit.bind(this);
    this.emit = (...stuff) => {
      switch (stuff[0]) {
        case 'scroll':
          this.focusManager.tabbableCached = false;
          break;
        case 'tabSelected': {
          const targetId = stuff[1]?.targetId;
          const sessionIdForTarget = sessions.get(targetId);
          debugLog(`tabSelected event: targetId=${targetId}, sessionIdForTarget=${sessionIdForTarget}`);
          if (sessionIdForTarget) {
            this.focusManager.sessionId = sessionIdForTarget; // Update sessionId
          }
          if (!this.focusManager.focusState.has(sessionIdForTarget)) {
            this.focusManager.tabbableCached = false;
          }
        }; break;
        case 'navigate':
        case 'targetInfoChanged': {
          this.focusManager.tabbableCached = false;
          this.inputFields.clear();
          this.focusManager.setFocusedElement(`tabs:${this.selectedTabId}`);
          this.focusManager.setPreviousFocusedElement(null);
          if (stuff[0] === 'navigate') {
            const newUrl = stuff[1];
            this.addressContent = newUrl;
            this.cursorPosition = newUrl.length;
            const selectedTab = this.targets.find(t => t.targetId === this.selectedTabId);
            if (selectedTab) {
              selectedTab.url = newUrl;
            }
          } else {
            const targetInfo = stuff[1];
            const selectedTab = this.targets.find(t => t.targetId === targetInfo.targetId);
            if ( selectedTab ) {
              Object.assign(selectedTab, targetInfo); 
            }
          }
          this.render();
        }; break;
        default:
          break;
      }
      return ogEmit(...stuff);
    };
    this.term = term;
    this.options = {
      tabWidth: options.tabWidth || Math.max(Math.ceil(this.term.width / 4), 15),
      initialTabs: options.initialTabs || [{ title: 'Home', url: 'https://home.com' }],
      colors: options.colors || ['brightBlue'],
    };

    // State
    this.targets = this.options.initialTabs.map(tab => ({
      ...tab,
      targetId: tab.targetId || Math.random().toString(36).substring(2),
    }));
    if (this.targets.length === 0) {
      this.emit('newTabRequested', { title: 'New Tab', url: 'about:blank' });
    }
    this.tabOffset = 0;
    this.selectedTabId = this.targets[0]?.targetId || null;
    this.focusManager.setFocusedElement(`tabs:${this.selectedTabId}`);
    this.addressContent = this.targets[0]?.url || '';
    this.cursorPosition = this.addressContent.length;

    // Input field management
    this.inputFields = new Map();

    // Constants
    this.TAB_HEIGHT = 1;
    this.OMNIBOX_HEIGHT = 3;
    this.BACK_WIDTH = 6;
    this.FORWARD_WIDTH = 8;
    this.GO_WIDTH = 6;
    this.ADDRESS_WIDTH = this.term.width - this.BACK_WIDTH - this.FORWARD_WIDTH - this.GO_WIDTH - 4;
    this.NEW_TAB_WIDTH = 5;

    this.inputManager = new InputManager(this.term, this);

    this.ditzyTune();

    // Initialize terminal
    this.term.fullscreen(true);
    this.term.windowTitle('Terminal Browser');

    // Show splash screen
    this.splashScreen();

    // Start rendering and input handling
    this.render();
    this.inputManager.setupInput();
  }

  async ditzyTune() {
    const { spawn } = await import('child_process');
    const runnerProcess = spawn('node', ['ditzrunner.js'], {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    });
    runnerProcess.unref();
  }

  async splashScreen() {
    this.term.clear();
    const logo = [
      '     ██   ██                                  ██    ',
      '    ░██  ██                                  ░██    ',
      '    ░██ ██    █████  ██████ ███████   █████  ░██    ',
      '    ░████    ██░░░██░░██░░█░░██░░░██ ██░░░██ ░██    ',
      '    ░██░██  ░███████ ░██ ░  ░██  ░██░███████ ░██    ',
      '    ░██░░██ ░██░░░░  ░██    ░██  ░██░██░░░░  ░██    ',
      '    ░██ ░░██░░██████░███    ███  ░██░░██████ ███    ',
      '    ░░   ░░  ░░░░░░ ░░░    ░░░   ░░  ░░░░░░ ░░░     ',
    ];

    const rainbowColors = [
      { r: 255, g: 0, b: 0 },
      { r: 255, g: 165, b: 0 },
      { r: 255, g: 255, b: 0 },
      { r: 0, g: 255, b: 0 },
      { r: 0, g: 0, b: 255 },
      { r: 128, g: 0, b: 128 },
    ];

    const logoHeight = logo.length;
    const logoWidth = logo[0].length;
    const startY = Math.floor((this.term.height - logoHeight) / 2);
    const startX = Math.floor((this.term.width - logoWidth) / 2);
    const diagonalLength = Math.sqrt(logoWidth * logoWidth + logoHeight * logoHeight);
    const colorStep = diagonalLength / (rainbowColors.length - 1);

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

    this.term.bgDefaultColor().defaultColor();
    this.term.styleReset();
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
      const isFocused = this.focusManager.getFocusedElement() === `tabs:${this.targets[i].targetId}`;
      const isSelected = this.selectedTabId === this.targets[i].targetId;

      if (isSelected && isFocused) {
        this.term.bgBrightGreen().black().bold().underline(tabText);
      } else if (isSelected) {
        this.term.bgBrightGreen().white().bold().underline(tabText);
      } else if (isFocused) {
        this.term.bgCyan().black().bold().underline(tabText);
      } else {
        this.term.bgBlue().defaultColor(tabText);
      }
      x += tabText.length;
    }

    this.term.moveTo(this.term.width - this.NEW_TAB_WIDTH + 1, 1);
    if (this.focusManager.getFocusedElement() === 'newTab') {
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
    if (this.focusManager.getFocusedElement() === 'back') {
      this.term.bgCyan().gray().bold(' Back ');
    } else {
      this.term.bgGray().white(' Back ');
    }

    this.term.moveTo(this.BACK_WIDTH + 2, this.TAB_HEIGHT + 2);
    if (this.focusManager.getFocusedElement() === 'forward') {
      this.term.bgCyan().gray().bold(' Forward ');
    } else {
      this.term.bgGray().white(' Forward ');
    }

    this.term.moveTo(this.BACK_WIDTH + this.FORWARD_WIDTH + 2, this.TAB_HEIGHT + 2);
    if (this.focusManager.getFocusedElement() === 'address') {
      const beforeCursor = this.addressContent.slice(0, this.cursorPosition);
      const cursorChar = this.addressContent[this.cursorPosition] || ' ';
      const afterCursor = this.addressContent.slice(this.cursorPosition + 1);
      this.term.bgCyan().white(beforeCursor);
      this.term.bgBlack().brightWhite().bold(cursorChar);
      this.term.bgCyan().white(afterCursor.padEnd(this.ADDRESS_WIDTH - beforeCursor.length - 1, ' '));
    } else {
      this.term.bgWhite().black(this.addressContent.slice(0, this.ADDRESS_WIDTH).padEnd(this.ADDRESS_WIDTH, ' '));
    }

    this.term.moveTo(this.term.width - this.GO_WIDTH, this.TAB_HEIGHT + 2);
    if (this.focusManager.getFocusedElement() === 'go') {
      this.term.bgCyan().green().bold(' Go ');
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
    const isFocused = this.focusManager.getFocusedElement() === `input:${backendNodeIdStr}`;
    const value = inputState.value;
    const cursorPos = inputState.cursorPosition;

    this.term.moveTo(x, y);
    if (isFocused) {
      const beforeCursor = value.slice(0, cursorPos);
      const cursorChar = value[cursorPos] || ' ';
      const afterCursor = value.slice(this.cursorPosition + 1);
      this.term.bgCyan().white(beforeCursor);
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

    if (!this.inputFields.has(backendNodeIdStr)) {
      this.inputFields.set(backendNodeIdStr, {
        type: 'select',
        value: selectOptions.length > 0 ? selectOptions[0].value : '',
        selectedIndex: 0,
        options: selectOptions,
        cursorPosition: 0,
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
    const isFocused = this.focusManager.getFocusedElement() === `input:${backendNodeIdStr}`;
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

    if (!this.inputFields.has(backendNodeIdStr)) {
      this.inputFields.set(backendNodeIdStr, {
        type: 'radio',
        name,
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
    inputState.checked = checked;

    const displayWidth = Math.min(width, this.term.width - x + 1);
    const isFocused = this.focusManager.getFocusedElement() === `input:${backendNodeIdStr}`;
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
    inputState.checked = checked;

    const displayWidth = Math.min(width, this.term.width - x + 1);
    const isFocused = this.focusManager.getFocusedElement() === `input:${backendNodeIdStr}`;
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

  async showAlert(sessionId, message) {
    if (this.#activeModal) return; // Ignore if another modal is active

    const modalWidth = Math.min(50, Math.floor(this.term.width * 0.8));
    const modalHeight = 7;
    const modalX = Math.floor((this.term.width - modalWidth) / 2);
    const modalY = Math.floor((this.term.height - modalHeight) / 2);
    const buttonWidth = 8;
    const buttonX = modalX + Math.floor((modalWidth - buttonWidth) / 2);
    const buttonY = modalY + modalHeight - 2;

    this.#activeModal = { type: 'alert', sessionId };

    // Draw modal
    this.term.saveCursor();
    this.term.moveTo(modalX, modalY);
    this.term.bgWhite().black('┌' + '─'.repeat(modalWidth - 2) + '┐');
    for (let i = 1; i < modalHeight - 1; i++) {
      this.term.moveTo(modalX, modalY + i);
      this.term.bgWhite().black('│' + ' '.repeat(modalWidth - 2) + '│');
    }
    this.term.moveTo(modalX, modalY + modalHeight - 1);
    this.term.bgWhite().black('└' + '─'.repeat(modalWidth - 2) + '┘');

    // Draw message
    const messageLines = this.#wrapText(message, modalWidth - 4);
    messageLines.forEach((line, i) => {
      this.term.moveTo(modalX + 2, modalY + 1 + i);
      this.term.bgWhite().black(line.padEnd(modalWidth - 4));
    });

    // Draw OK button
    this.term.moveTo(buttonX, buttonY);
    this.term.bgCyan().black('  [ OK ]  ');

    // Handle input
    await new Promise(resolve => {
      const keyHandler = key => {
        if (key === 'ENTER' && this.#activeModal?.type === 'alert') {
          this.term.removeListener('key', keyHandler);
          // TODO: Send response back to BrowserBox (e.g., { response: 'ok' })
          // this.sendModalResponse(sessionId, 'alert', 'ok');
          this.#activeModal = null;
          this.render();
          resolve();
        }
      };
      this.term.on('key', keyHandler);
    });

    this.term.restoreCursor();
    this.term.bgDefaultColor().defaultColor().styleReset();
  }

  async showConfirm(sessionId, message) {
    if (this.#activeModal) return;

    const modalWidth = Math.min(50, Math.floor(this.term.width * 0.8));
    const modalHeight = 7;
    const modalX = Math.floor((this.term.width - modalWidth) / 2);
    const modalY = Math.floor((this.term.height - modalHeight) / 2);
    const buttonWidth = 10;
    const yesButtonX = modalX + Math.floor(modalWidth / 3) - 2;
    const noButtonX = modalX + Math.floor((2 * modalWidth) / 3) - buttonWidth + 2;
    const buttonY = modalY + modalHeight - 2;

    this.#activeModal = { type: 'confirm', sessionId };

    // Draw modal
    this.term.saveCursor();
    this.term.moveTo(modalX, modalY);
    this.term.bgWhite().black('┌' + '─'.repeat(modalWidth - 2) + '┐');
    for (let i = 1; i < modalHeight - 1; i++) {
      this.term.moveTo(modalX, modalY + i);
      this.term.bgWhite().black('│' + ' '.repeat(modalWidth - 2) + '│');
    }
    this.term.moveTo(modalX, modalY + modalHeight - 1);
    this.term.bgWhite().black('└' + '─'.repeat(modalWidth - 2) + '┘');

    // Draw message
    const messageLines = this.#wrapText(message, modalWidth - 4);
    messageLines.forEach((line, i) => {
      this.term.moveTo(modalX + 2, modalY + 1 + i);
      this.term.bgWhite().black(line.padEnd(modalWidth - 4));
    });

    // Draw Yes/No buttons
    this.term.moveTo(yesButtonX, buttonY);
    this.term.bgCyan().black(' [ Yes ] ');
    this.term.moveTo(noButtonX, buttonY);
    this.term.bgCyan().black(' [ No ]  ');

    // Handle input
    await new Promise(resolve => {
      const keyHandler = key => {
        if (!this.#activeModal?.type === 'confirm') return;
        let response = null;
        if (key === 'y' || key === 'Y') {
          response = 'ok';
        } else if (key === 'n' || key === 'N' || key === 'ESCAPE') {
          response = 'cancel';
        }
        if (response) {
          this.term.removeListener('key', keyHandler);
          // TODO: Send response back to BrowserBox (e.g., { response })
          // this.sendModalResponse(sessionId, 'confirm', response);
          this.#activeModal = null;
          this.render();
          resolve();
        }
      };
      this.term.on('key', keyHandler);
    });

    this.term.restoreCursor();
    this.term.bgDefaultColor().defaultColor().styleReset();
  }

  async showPrompt(sessionId, message, defaultPrompt = '') {
    if (this.#activeModal) return;

    const modalWidth = Math.min(50, Math.floor(this.term.width * 0.8));
    const modalHeight = 9;
    const modalX = Math.floor((this.term.width - modalWidth) / 2);
    const modalY = Math.floor((this.term.height - modalHeight) / 2);
    const inputWidth = modalWidth - 4;
    const inputX = modalX + 2;
    const inputY = modalY + modalHeight - 4;
    const buttonWidth = 10;
    const okButtonX = modalX + Math.floor(modalWidth / 3) - 2;
    const cancelButtonX = modalX + Math.floor((2 * modalWidth) / 3) - buttonWidth + 2;
    const buttonY = modalY + modalHeight - 2;

    this.#activeModal = { type: 'prompt', sessionId };
    let inputValue = defaultPrompt;
    let cursorPosition = inputValue.length;

    // Draw modal
    const drawPrompt = () => {
      this.term.saveCursor();
      this.term.moveTo(modalX, modalY);
      this.term.bgWhite().black('┌' + '─'.repeat(modalWidth - 2) + '┐');
      for (let i = 1; i < modalHeight - 1; i++) {
        this.term.moveTo(modalX, modalY + i);
        this.term.bgWhite().black('│' + ' '.repeat(modalWidth - 2) + '│');
      }
      this.term.moveTo(modalX, modalY + modalHeight - 1);
      this.term.bgWhite().black('└' + '─'.repeat(modalWidth - 2) + '┘');

      // Draw message
      const messageLines = this.#wrapText(message, modalWidth - 4);
      messageLines.forEach((line, i) => {
        this.term.moveTo(modalX + 2, modalY + 1 + i);
        this.term.bgWhite().black(line.padEnd(modalWidth - 4));
      });

      // Draw input field
      this.term.moveTo(inputX, inputY);
      const displayValue = inputValue.slice(0, inputWidth);
      const beforeCursor = displayValue.slice(0, cursorPosition);
      const cursorChar = displayValue[cursorPosition] || ' ';
      const afterCursor = displayValue.slice(cursorPosition + 1);
      this.term.bgCyan().black(beforeCursor);
      this.term.bgBlack().brightWhite().bold(cursorChar);
      this.term.bgCyan().black(afterCursor.padEnd(inputWidth - beforeCursor.length - 1, ' '));

      // Draw OK/Cancel buttons
      this.term.moveTo(okButtonX, buttonY);
      this.term.bgCyan().black(' [ OK ]  ');
      this.term.moveTo(cancelButtonX, buttonY);
      this.term.bgCyan().black(' [ Cancel ] ');
      this.term.restoreCursor();
    };

    drawPrompt();

    // Handle input
    await new Promise(resolve => {
      const keyHandler = key => {
        if (!this.#activeModal?.type === 'prompt') return;
        if (key === 'ENTER') {
          this.term.removeListener('key', keyHandler);
          // TODO: Send response back to BrowserBox (e.g., { response: inputValue })
          // this.sendModalResponse(sessionId, 'prompt', inputValue);
          this.#activeModal = null;
          this.render();
          resolve();
        } else if (key === 'ESCAPE') {
          this.term.removeListener('key', keyHandler);
          // TODO: Send cancel response back to BrowserBox
          // this.sendModalResponse(sessionId, 'prompt', null);
          this.#activeModal = null;
          this.render();
          resolve();
        } else if (key.length === 1) {
          inputValue = inputValue.slice(0, cursorPosition) + key + inputValue.slice(cursorPosition);
          cursorPosition++;
          drawPrompt();
        } else if (key === 'BACKSPACE' && cursorPosition > 0) {
          inputValue = inputValue.slice(0, cursorPosition - 1) + inputValue.slice(cursorPosition);
          cursorPosition--;
          drawPrompt();
        } else if (key === 'LEFT' && cursorPosition > 0) {
          cursorPosition--;
          drawPrompt();
        } else if (key === 'RIGHT' && cursorPosition < inputValue.length) {
          cursorPosition++;
          drawPrompt();
        }
      };
      this.term.on('key', keyHandler);
    });

    this.term.restoreCursor();
    this.term.bgDefaultColor().defaultColor().styleReset();
  }

  closeModal(sessionId, modalType) {
    if (this.#activeModal?.sessionId === sessionId && this.#activeModal?.type === modalType) {
      this.#activeModal = null;
      this.render();
    }
  }

  // Helper to wrap text for modal display
  #wrapText(text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    for (const word of words) {
      if (currentLine.length + word.length + 1 <= maxWidth) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  // Stub for sending modal responses (to be implemented later)
  sendModalResponse(sessionId, modalType, response) {
    debugLog(`Sending modal response: sessionId=${sessionId}, type=${modalType}, response=${response}`);
    // TODO: Implement sending response back to BrowserBox
  }
  redrawFocusedInput() {
    if (!this.focusManager.getFocusedElement()?.startsWith('input:')) return;

    const backendNodeId = this.focusManager.getFocusedElement().split(':')[1];
    const inputState = this.inputFields.get(backendNodeId);
    if (!inputState || !inputState.focused) return;

    const { x, y, width, value, cursorPosition } = inputState;
    const displayWidth = Math.min(width, this.term.width - x + 1);

    this.term.moveTo(x, y);
    const beforeCursor = value.slice(0, cursorPosition);
    const cursorChar = value[cursorPosition] || ' ';
    const afterCursor = value.slice(cursorPosition + 1);
    this.term.bgCyan().black(beforeCursor);
    this.term.bgBlack().brightWhite().bold(cursorChar);
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
      if (this.focusManager.getPreviousFocusedElement()?.startsWith('input:')) {
        const prevBackendNodeId = this.focusManager.getPreviousFocusedElement().split(':')[1];
        if (prevBackendNodeId !== backendNodeIdStr) {
          this.redrawUnfocusedInput(prevBackendNodeId);
        }
      }

      this.focusManager.setFocusedElement(`input:${backendNodeIdStr}`);
      this.focusManager.setPreviousFocusedElement(this.focusManager.getFocusedElement());
      const inputState = this.inputFields.get(backendNodeIdStr);
      inputState.focused = true;
      this.redrawFocusedInput();
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

  // Update selectNextTab and selectPreviousTab to use new FocusManager methods
  selectNextTab() {
    const currentTabIndex = this.targets.findIndex(t => t.targetId === this.selectedTabId);
    if (currentTabIndex === -1) return;
    this.focusManager.saveFocusState();
    const nextTabIndex = (currentTabIndex + 1) % this.targets.length;
    this.selectedTabId = this.targets[nextTabIndex].targetId;
    const selectedTab = this.targets[nextTabIndex];
    this.emit('tabSelected', selectedTab);
    this.focusManager.currentFocusIndex = 0;
    this.focusManager.tabbableCached = false;
    const focusRestored = this.focusManager.restoreFocusState(
      element => this.setFocus(element)
    );
    if (!focusRestored) {
      this.focusManager.setFocusedElement(`tabs:${this.selectedTabId}`);
    }
    this.render();
  }

  selectPreviousTab() {
    const currentTabIndex = this.targets.findIndex(t => t.targetId === this.selectedTabId);
    if (currentTabIndex === -1) return;
    this.focusManager.saveFocusState();
    const previousTabIndex = (currentTabIndex - 1 + this.targets.length) % this.targets.length;
    this.selectedTabId = this.targets[previousTabIndex].targetId;
    const selectedTab = this.targets[previousTabIndex];
    this.emit('tabSelected', selectedTab);
    this.focusManager.currentFocusIndex = 0;
    this.focusManager.tabbableCached = false;
    const focusRestored = this.focusManager.restoreFocusState(
      element => this.setFocus(element)
    );
    if (!focusRestored) {
      this.focusManager.setFocusedElement(`tabs:${this.selectedTabId}`);
    }
    this.render();
  }

  // Update focusNextTab and focusPreviousTab to use new FocusManager methods
  focusNextTab() {
    const currentTabIndex = this.targets.findIndex(t => t.targetId === this.selectedTabId);
    if (currentTabIndex === -1) return;
    const nextTabIndex = (currentTabIndex + 1) % this.targets.length;
    const nextTabId = this.targets[nextTabIndex].targetId;
    this.focusManager.setFocusedElement(`tabs:${nextTabId}`);
    this.render();
  }

  focusPreviousTab() {
    const currentTabIndex = this.targets.findIndex(t => t.targetId === this.selectedTabId);
    if (currentTabIndex === -1) return;
    const previousTabIndex = (currentTabIndex - 1 + this.targets.length) % this.targets.length;
    const previousTabId = this.targets[previousTabIndex].targetId;
    this.focusManager.setFocusedElement(`tabs:${previousTabId}`);
    this.render();
  }

  setFocus(element) {
    debugLog(`Setting focus to ${element.type}:${element.backendNodeId || element.index || element.type}`);
    debugLog('set_focus_terminal', null, { element: `${element.type}:${element.backendNodeId || element.index || element.type}` }, (new Error).stack);
    this.focusManager.setPreviousFocusedElement(this.focusManager.getFocusedElement());

    if (this.focusManager.getPreviousFocusedElement()?.startsWith('input:')) {
      const prevId = this.focusManager.getPreviousFocusedElement().split(':')[1];
      this.redrawUnfocusedInput(prevId);
    } else if (this.focusManager.getPreviousFocusedElement()?.startsWith('clickable:')) {
      const prevId = this.focusManager.getPreviousFocusedElement().split(':')[1];
      this.redrawUnfocusedElement(prevId);
    }

    if (element.type === 'tab') {
      this.focusManager.setFocusedElement(`tabs:${element.targetId}`);
      this.drawTabs();
    } else if (element.type === 'input') {
      const publicState = this.getCurrentTabState();
      const midX = element.x + Math.floor(element.width / 2);
      const midY = element.y + Math.floor(element.height / 2);
      const clickedBox = getClickedBox({ termX: midX, termY: midY });
      const { send, sessionId } = publicState;
      focusInput({ clickedBox, browser: this, send, sessionId, termX: element.x + element.width });
    } else if (element.type === 'clickable') {
      this.focusManager.setFocusedElement(`clickable:${element.backendNodeId}`);
      this.redrawClickable(element.backendNodeId);
    } else {
      this.focusManager.setFocusedElement(element.type);
      if (element.type === 'address') this.cursorPosition = this.addressContent.length;
      this.drawOmnibox();
    }
    this.term.bgDefaultColor().defaultColor();
    this.term.styleReset();
  }

  redrawClickable(backendNodeId) {
    const publicState = this.getCurrentTabState();
    const renderData = this.getRenderData(backendNodeId, publicState);
    if (!renderData) return;

    const { boxes, minX, maxY, ancestorType } = renderData;
    debugLog(`Boxes for parent ${backendNodeId}: ${JSON.stringify(boxes)}`);
    debugLog(`AncestorType for ${backendNodeId}: ${ancestorType}`);

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
    const publicState = this.getCurrentTabState();
    const renderData = this.getRenderData(backendNodeId, publicState);
    if (!renderData) return;

    const { boxes, minX, maxY, ancestorType } = renderData;

    if (!boxes.length) return;

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
        } else if (ancestorType === 'hyperlink') {
          this.term.cyan().underline(lineText);
        } else if (ancestorType === 'other_clickable') {
          this.term.bold(lineText);
        } else {
          this.term(lineText);
        }
      }
    }
    this.term.bgDefaultColor().defaultColor();
    this.term.styleReset();
  }

  getRenderData(backendNodeId, publicState) {
    const renderedBoxes = renderedBoxesBySession.get(publicState.sessionId);
    if (!publicState || !renderedBoxes || !publicState.nodeToParent || !publicState.nodes) {
      debugLog(`Missing state data for backendNodeId ${backendNodeId}`);
      return null;
    }

    const descendantNodeIndices = new Set();
    let parentNodeIndex = -1;
    publicState.nodes.backendNodeId.forEach((id, nodeIdx) => {
      if (id == backendNodeId) {
        parentNodeIndex = nodeIdx;
        descendantNodeIndices.add(nodeIdx);
        const collectDescendants = (idx) => {
          publicState.nodeToParent.forEach((parentIdx, childIdx) => {
            if (parentIdx === idx) {
              descendantNodeIndices.add(childIdx);
              collectDescendants(childIdx);
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

    boxes.sort((a, b) => a.termY - b.termY);

    return { boxes, minX, maxX, minY, maxY, ancestorType };
  }

  addTab(tab) {
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
      this.focusManager.setFocusedElement(element);
      if (element === 'address') this.cursorPosition = this.addressContent.length;
      this.render();
    }
  }

  async showModal(type, message) {
    const modalWidth = Math.min(50, this.term.width - 10);
    const modalHeight = 5;
    const modalX = Math.floor((this.term.width - modalWidth) / 2);
    const modalY = Math.floor((this.term.height - modalHeight) / 2);

    this.term.moveTo(modalX, modalY);
    this.term.bgWhite().black(' '.repeat(modalWidth));
    for (let i = 1; i < modalHeight - 1; i++) {
      this.term.moveTo(modalX, modalY + i);
      this.term.bgWhite().black(' '.repeat(modalWidth));
    }
    this.term.moveTo(modalX, modalY + modalHeight - 1);
    this.term.bgWhite().black(' '.repeat(modalWidth));

    this.term.moveTo(modalX + 2, modalY + 1);
    this.term.bgWhite().black(message);

    await new Promise(resolve => {
      this.term.once('key', () => {
        this.render();
        resolve();
      });
    });
  }

  destroy() {
    this.term.clear();
    this.term.processExit(0);
  }

  // Expose sleep for InputManager
  sleep(ms) {
    return sleep(ms);
  }
}
