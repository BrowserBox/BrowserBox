import termkit from 'terminal-kit';
import { EventEmitter } from 'events';
import {logClicks,DEBUG} from './log.js';

const term = termkit.terminal;

export default class TerminalBrowser extends EventEmitter {
  constructor(options = {}) {
    super();
    this.term = term;
    this.options = {
      tabWidth: options.tabWidth || 25,
      initialTabs: options.initialTabs || [
        { title: 'Home', url: 'https://home.com' },
      ],
      colors: options.colors || ['red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'brightRed', 'brightGreen', 'brightYellow', 'brightBlue', 'brightMagenta', 'brightCyan', 'white', 'brightWhite', 'gray'],
    };

    // State
    this.tabs = this.options.initialTabs.map((tab, i) => ({
      title: tab.title,
      url: tab.url,
      color: this.options.colors[i % this.options.colors.length],
    }));
    if (this.tabs.length === 0) {
      this.emit('newTabRequested', { title: 'New Tab', url: 'about:blank' });
    }
    this.tabOffset = 0;
    this.focusedTabIndex = 0;
    this.selectedTabIndex = -1;
    this.focusedElement = 'tabs'; // 'tabs', 'back', 'forward', 'address', 'go', or 'input:<backendNodeId>'
    this.addressContent = '';
    this.cursorPosition = 0;

    // Input field management
    this.inputFields = new Map(); // Key: backendNodeId, Value: { value, cursorPosition, focused }

    // Constants
    this.TAB_HEIGHT = 1;
    this.OMNIBOX_HEIGHT = 3;
    this.MAX_VISIBLE_TABS = Math.floor((this.term.width - 5) / this.options.tabWidth);
    this.BACK_WIDTH = 6;
    this.FORWARD_WIDTH = 8;
    this.GO_WIDTH = 6;
    this.ADDRESS_WIDTH = this.term.width - this.BACK_WIDTH - this.FORWARD_WIDTH - this.GO_WIDTH - 4;
    this.NEW_TAB_WIDTH = 5;

    // Initialize terminal
    this.term.fullscreen(true);
    this.term.windowTitle('Terminal Browser');

    // Start rendering and input handling
    this.render();
    this.setupInput();
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
      if (i === this.focusedTabIndex) {
        this.term.bgWhite()[this.tabs[i].color]().bold().underline(tabText);
      } else if (i === this.selectedTabIndex) {
        this.term.bgBlue()[this.tabs[i].color]().underline(tabText);
      } else {
        this.term.bgBlue()[this.tabs[i].color](tabText);
      }
      x += tabText.length;
    }

    this.term.moveTo(this.term.width - this.NEW_TAB_WIDTH + 1, 1);
    this.term.bgBlue().white(' [+] ');
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
      this.term.bgBrightBlack().black().bold(' Back ');
    } else {
      this.term.bgGray().white(' Back ');
    }

    this.term.moveTo(this.BACK_WIDTH + 2, this.TAB_HEIGHT + 2);
    if (this.focusedElement === 'forward') {
      this.term.bgBrightBlack().black().bold(' Forward ');
    } else {
      this.term.bgGray().white(' Forward ');
    }

    this.term.moveTo(this.BACK_WIDTH + this.FORWARD_WIDTH + 2, this.TAB_HEIGHT + 2);
    if (this.focusedElement === 'address') {
      const beforeCursor = this.addressContent.slice(0, this.cursorPosition);
      const cursorChar = this.addressContent[this.cursorPosition] || ' ';
      const afterCursor = this.addressContent.slice(this.cursorPosition + 1);
      this.term.bgBrightWhite().black(beforeCursor);
      this.term.bgBlack().brightWhite().bold(cursorChar);
      this.term.bgBrightWhite().black(afterCursor.padEnd(this.ADDRESS_WIDTH - beforeCursor.length - 1, ' '));
    } else {
      this.term.bgWhite().black(this.addressContent.slice(0, this.ADDRESS_WIDTH).padEnd(this.ADDRESS_WIDTH, ' '));
    }

    this.term.moveTo(this.term.width - this.GO_WIDTH, this.TAB_HEIGHT + 2);
    if (this.focusedElement === 'go') {
      this.term.bgBrightGreen().black().bold(' Go ');
    } else {
      this.term.bgGreen().white(' Go ');
    }
  }

  drawInputField(options) {
    const { x, y, width, key, initialValue = '', onChange } = options;
    const backendNodeIdStr = String(key);

    if (!this.inputFields.has(backendNodeIdStr)) {
      logClicks(`Initializing input state for ${backendNodeIdStr} with value: ${initialValue}`);
      this.inputFields.set(backendNodeIdStr, {
        value: initialValue,
        cursorPosition: initialValue.length,
        focused: false,
        onChange,
        x,              // Store position
        y,
        width,          // Store size
      });
    }
    const inputState = this.inputFields.get(backendNodeIdStr);
    logClicks(`Drawing input ${backendNodeIdStr}, value: ${inputState.value}, focused: ${inputState.focused}`);

    // Update position if changed (e.g., during initial render or layout shift)
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
      const cursorChar = value[cursorPos] || ' '; // Space if cursor is at end
      const afterCursor = value.slice(cursorPos + 1);
      this.term.bgBrightWhite().black(beforeCursor);
      this.term.bgBlack().brightWhite().bold(cursorChar); // Highlight cursor
      this.term.bgBrightWhite().black(afterCursor.padEnd(displayWidth - beforeCursor.length - 1, ' '));
    } else {
      this.term.bgWhite().black(value.slice(0, displayWidth).padEnd(displayWidth, ' '));
    }

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
    const cursorChar = value[cursorPosition] || ' '; // Space if at end
    const afterCursor = value.slice(cursorPosition + 1);
    this.term.bgBrightWhite().black(beforeCursor);
    this.term.bgBlack().brightWhite().bold(cursorChar); // Cursor highlight
    this.term.bgBrightWhite().black(afterCursor.padEnd(displayWidth - beforeCursor.length - 1, ' '));
  }

  focusInput(backendNodeId) {
    const backendNodeIdStr = String(backendNodeId); // Ensure string key
    if (this.inputFields.has(backendNodeIdStr)) {
      this.focusedElement = `input:${backendNodeIdStr}`;
      const inputState = this.inputFields.get(backendNodeIdStr);
      inputState.focused = true;
      logClicks(`Focused input: ${backendNodeIdStr}, value: ${inputState.value}`);
      this.render();
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
    this.term.moveTo(1, this.term.height);
  }

  setupInput() {
    this.term.grabInput({ mouse: 'button' });
    let isListening = true;

    this.term.on('key', async (key) => {
      logClicks(`Key pressed: ${key}, focusedElement: ${this.focusedElement}`);
      if (!isListening) return;

      if (this.focusedElement.startsWith('input:')) {
        const backendNodeId = this.focusedElement.split(':')[1];
        const inputState = this.inputFields.get(backendNodeId);
        if (!inputState) {
          logClicks(`No input state for ${backendNodeId}`);
          return;
        }
        logClicks(`Input focused, backendNodeId: ${backendNodeId}, current value: ${inputState.value}`);

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
          case 'ENTER':
            this.focusedElement = 'tabs';
            if (inputState.onChange) inputState.onChange(inputState.value);
            this.render(); // Full render to update focus
            break;
          case 'TAB':
            this.focusNextInput();
            break;
          case 'SHIFT_TAB':
            this.focusPreviousInput();
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
      } else {
        switch (key) {
          case 'CTRL_C':
            isListening = false;
            this.term.clear();
            this.term.processExit(0);
            break;
          case 'ENTER':
            if (this.focusedElement === 'tabs') {
              this.selectedTabIndex = this.focusedTabIndex;
              this.emit('tabSelected', this.tabs[this.selectedTabIndex]);
            } else if (this.focusedElement === 'back') {
              this.emit('back');
            } else if (this.focusedElement === 'forward') {
              this.emit('forward');
            } else if (this.focusedElement === 'go') {
              this.emit('navigate', this.addressContent);
              if (this.selectedTabIndex !== -1) {
                this.tabs[this.selectedTabIndex].url = this.addressContent;
                this.tabs[this.selectedTabIndex].title = new URL(this.addressContent).hostname;
              }
            }
            this.render();
            break;
          case 'TAB':
            this.focusNextElement();
            this.render();
            break;
          case 'SHIFT_TAB':
            this.focusPreviousElement();
            this.render();
            break;
          case 'LEFT':
            if (this.focusedElement === 'tabs' && this.focusedTabIndex > 0) {
              this.focusedTabIndex--;
              this.render();
            } else if (this.focusedElement === 'address') {
              if (this.cursorPosition > 0) this.cursorPosition--;
              this.render();
            }
            break;
          case 'RIGHT':
            if (this.focusedElement === 'tabs' && this.focusedTabIndex < this.tabs.length - 1) {
              this.focusedTabIndex++;
              this.render();
            } else if (this.focusedElement === 'address') {
              if (this.cursorPosition < this.addressContent.length) this.cursorPosition++;
              this.render();
            }
            break;
          case 'BACKSPACE':
            if (this.focusedElement === 'address' && this.cursorPosition > 0) {
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
            if (key.length === 1 && this.focusedElement === 'address') {
              this.addressContent = this.addressContent.slice(0, this.cursorPosition) + key + this.addressContent.slice(this.cursorPosition);
              this.cursorPosition++;
              this.render();
            }
            break;
        }
      }
    });

    this.term.on('mouse', (name, data) => {
      if (!isListening) return;

      const { x, y } = data;
      if (name === 'MOUSE_LEFT_BUTTON_PRESSED') {
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
              this.tabs[this.selectedTabIndex].title = new URL(this.addressContent).hostname;
            }
          }
          this.render();
          return;
        }

        // Content area (y > 4)
        if (y > 4) {
          this.emit('click', { x, y });
        }
      } else if (name === 'MOUSE_WHEEL_UP' || name === 'MOUSE_WHEEL_DOWN') {
        if (y > 4) {
          this.emit('scroll', { direction: name === 'MOUSE_WHEEL_UP' ? -1 : 1 });
        }
      }
    });

    this.stopListening = () => { isListening = false; };
  }

  focusNextElement() {
    const elements = ['tabs', 'back', 'forward', 'address', 'go', ...Array.from(this.inputFields.keys()).map(id => `input:${id}`)];
    const currentIdx = elements.indexOf(this.focusedElement);
    this.focusedElement = elements[(currentIdx + 1) % elements.length];
    if (this.focusedElement === 'tabs') this.focusedTabIndex = Math.min(this.focusedTabIndex, this.tabs.length - 1);
    if (this.focusedElement === 'address') this.cursorPosition = this.addressContent.length;
    if (this.focusedElement.startsWith('input:')) {
      const id = this.focusedElement.split(':')[1];
      const inputState = this.inputFields.get(id);
      if (inputState) inputState.focused = true;
    }
  }

  focusPreviousElement() {
    const elements = ['tabs', 'back', 'forward', 'address', 'go', ...Array.from(this.inputFields.keys()).map(id => `input:${id}`)];
    const currentIdx = elements.indexOf(this.focusedElement);
    this.focusedElement = elements[(currentIdx - 1 + elements.length) % elements.length];
    if (this.focusedElement === 'tabs') this.focusedTabIndex = Math.min(this.focusedTabIndex, this.tabs.length - 1);
    if (this.focusedElement === 'address') this.cursorPosition = this.addressContent.length;
    if (this.focusedElement.startsWith('input:')) {
      const id = this.focusedElement.split(':')[1];
      const inputState = this.inputFields.get(id);
      if (inputState) inputState.focused = true;
    }
  }

  focusNextInput() {
    const inputKeys = Array.from(this.inputFields.keys()).map(id => `input:${id}`);
    if (inputKeys.length === 0) {
      this.focusedElement = 'tabs';
      return;
    }
    const currentIdx = inputKeys.indexOf(this.focusedElement);
    this.focusedElement = inputKeys[(currentIdx + 1) % inputKeys.length] || 'tabs';
    if (this.focusedElement.startsWith('input:')) {
      const id = this.focusedElement.split(':')[1];
      const inputState = this.inputFields.get(id);
      if (inputState) inputState.focused = true;
    }
    this.render();
  }

  focusPreviousInput() {
    const inputKeys = Array.from(this.inputFields.keys()).map(id => `input:${id}`);
    if (inputKeys.length === 0) {
      this.focusedElement = 'tabs';
      return;
    }
    const currentIdx = inputKeys.indexOf(this.focusedElement);
    this.focusedElement = inputKeys[(currentIdx - 1 + inputKeys.length) % inputKeys.length] || 'tabs';
    if (this.focusedElement.startsWith('input:')) {
      const id = this.focusedElement.split(':')[1];
      const inputState = this.inputFields.get(id);
      if (inputState) inputState.focused = true;
    }
    this.render();
  }

  // Existing API methods (addTab, addTabToUI, closeTab, etc.) remain unchanged...

  getInputValue(backendNodeId) {
    return this.inputFields.get(String(backendNodeId))?.value || '';
  }

  setInputValue(backendNodeId, value) {
    const backendNodeIdStr = String(backendNodeId);
    if (this.inputFields.has(backendNodeIdStr)) {
      const inputState = this.inputFields.get(backendNodeIdStr);
      inputState.value = value;
      inputState.cursorPosition = value.length;
      if (inputState.onChange) inputState.onChange(value);
      this.render();
    }
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
    if (index >= 0 && index < this.tabs.length) {
      this.tabs.splice(index, 1);
      if (this.tabs.length === 0) {
        // Automatically open a new tab when the last one is closed
        this.emit('newTabRequested', { title: 'New Tab', url: 'about:blank' });
      } else {
        if (this.focusedTabIndex >= this.tabs.length) this.focusedTabIndex = this.tabs.length - 1;
        if (this.selectedTabIndex >= this.tabs.length) this.selectedTabIndex = this.tabs.length - 1;
      }
      this.emit('tabClosed', index);
      this.render();
    }
  }

  getTab(index) {
    return this.tabs[index];
  }

  setTab(index, tab) {
    this.tabs[index] = {
      title: tab.title,
      url: tab.url,
      color: this.tabs[index].color,
    };
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
