import termkit from 'terminal-kit';
import { EventEmitter } from 'events';
import {sleep, debugLog, logClicks,DEBUG} from './log.js';
import keys from './kbd.js';

const term = termkit.terminal;

export default class TerminalBrowser extends EventEmitter {
  constructor(options = {}, getState) {
    super();
    this.getState = getState;
    this.term = term;
    this.options = {
      tabWidth: options.tabWidth || 25,
      initialTabs: options.initialTabs || [
        { title: 'Home', url: 'https://home.com' },
      ],
      colors: options.colors || ['brightBlue'],
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
    this.previousFocusedElement = null; // Track previous focus
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

  computeTabbableElements() {
    const tabbable = [];
    // Browser UI elements (tabs, buttons, etc.) - assuming this part works
    this.tabs.forEach((tab, index) => {
      const x = 1 + index * this.options.tabWidth;
      tabbable.push({ type: 'tab', index, x, y: 1 });
    });
    tabbable.push({ type: 'newTab', x: this.term.width - this.NEW_TAB_WIDTH + 1, y: 1 });
    tabbable.push({ type: 'back', x: 2, y: this.TAB_HEIGHT + 2 });
    tabbable.push({ type: 'forward', x: this.BACK_WIDTH + 2, y: this.TAB_HEIGHT + 2 });
    tabbable.push({ type: 'address', x: this.BACK_WIDTH + this.FORWARD_WIDTH + 2, y: this.TAB_HEIGHT + 2 });
    tabbable.push({ type: 'go', x: this.term.width - this.GO_WIDTH, y: this.TAB_HEIGHT + 2 });

    // Content pane elements
    const state = this.getState();
    if (state && state.renderedBoxes) {
      debugLog('Rendered Boxes Count:', state.renderedBoxes.length);
      state.renderedBoxes.forEach(box => {
        if (box.isClickable || box.type === 'input') {
          debugLog(`Adding to tabbable: text="${box.text}", type="${box.type}", isClickable=${box.isClickable}, backendNodeId=${box.backendNodeId}`);
          tabbable.push({
            type: box.type === 'input' ? 'input' : 'clickable',
            backendNodeId: box.backendNodeId,
            x: box.termX,
            y: box.termY,
            width: box.termWidth,
            height: box.termHeight,
            text: box.text,
          });
        }
      });
    } else {
      debugLog('No state or renderedBoxes available');
    }

    debugLog('Final Tabbable Elements Count:', tabbable.length);
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
      if (isFocused) {
        this.term.bgCyan().black().bold().underline(tabText); // Cyan bg, black fg (since original is blue)
      } else if (i === this.selectedTabIndex) {
        this.term.bgBlue()[this.tabs[i].color]().underline(tabText);
      } else {
        this.term.bgBlue()[this.tabs[i].color](tabText);
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
  }

  drawInputField(options) {
    const { x, y, width, key, initialValue = '', onChange } = options;
    const backendNodeIdStr = String(key);

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
  }

  redrawUnfocusedInput(backendNodeId) {
    const inputState = this.inputFields.get(String(backendNodeId));
    if (!inputState) return;

    const { x, y, width, value } = inputState;
    const displayWidth = Math.min(width, this.term.width - x + 1);

    this.term.moveTo(x, y);
    this.term.bgWhite().black(value.slice(0, displayWidth).padEnd(displayWidth, ' '));
    this.term.bgDefaultColor();
    this.term.defaultColor();
  }

  focusInput(backendNodeId) {
    const backendNodeIdStr = String(backendNodeId);
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
      this.render(); // Full render for initial focus
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

      // Global keybindings
      if (key === 'CTRL_C') {
        isListening = false;
        this.term.clear();
        this.term.processExit(0);
        return;
      }
      if (key === 'CTRL_T') {
        this.emit('newTabRequested', { title: `New ${this.tabs.length + 1}`, url: 'about:blank' });
        return;
      }
      if (key === 'CTRL_W') {
        if (this.selectedTabIndex >= 0) this.closeTab(this.selectedTabIndex);
        return;
      }

      // Handle input focus
      if (this.focusedElement.startsWith('input:')) {
        const backendNodeId = this.focusedElement.split(':')[1];
        const inputState = this.inputFields.get(backendNodeId);
        if (!inputState) {
          logClicks(`No input state for ${backendNodeId}`);
          return;
        }
        logClicks(`Input focused, backendNodeId: ${backendNodeId}, current value: ${inputState.value}`);

        if (key === 'ENTER') {
          const keyCommand = keyEvent('ENTER');
          if (keyCommand) {
            try {
              await this.getState().send(keyCommand.command.name, keyCommand.command.params, this.getState().sessionId);
              keyCommand.command.params.type = "keyUp";
              keyCommand.command.params.text = undefined;
              sleep(50).then(async () => {
                await this.getState().send(keyCommand.command.name, keyCommand.command.params, this.getState().sessionId);
                logClicks(`Sent Enter key event for backendNodeId: ${backendNodeId} and session ${this.getState().sessionId}`);
              });
            } catch (error) {
              logClicks(`Failed to send Enter key event for backendNodeId ${backendNodeId}: ${error.message}`);
            }
          }
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
              this.focusNextElement(); // Updated to use new tabbing logic
              this.render();
              break;
            case 'SHIFT_TAB':
              this.focusPreviousElement(); // Updated to use new tabbing logic
              this.render();
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
      // Handle clickable elements
      else if (this.focusedElement.startsWith('clickable:')) {
        const backendNodeId = this.focusedElement.split(':')[1];
        const state = this.getState();
        const box = state.renderedBoxes.find(b => String(b.backendNodeId) === backendNodeId);

        if (key === 'ENTER') {
          if (box) {
            await handleClick({
              termX: box.termX,
              termY: box.termY,
              renderedBoxes: state.renderedBoxes,
              clickableElements: state.clickableElements,
              send: state.send,
              sessionId: state.sessionId,
              clickCounter: state.clickCounter,
              refresh: () => refreshTerminal({ send: state.send, sessionId: state.sessionId, state }),
              layoutToNode: state.layoutToNode,
              nodeToParent: state.nodeToParent,
              nodes: state.nodes,
            });
            this.render();
          }
        } else if (key === 'TAB') {
          this.focusNextElement();
          this.render();
        } else if (key === 'SHIFT_TAB') {
          this.focusPreviousElement();
          this.render();
        }
      }
      // Handle UI elements
      else {
        switch (key) {
          case 'ENTER':
            if (this.focusedElement === 'tabs') {
              this.selectedTabIndex = this.focusedTabIndex;
              this.emit('tabSelected', this.tabs[this.selectedTabIndex]);
            } else if (this.focusedElement === 'newTab') { // Added newTab handling
              this.emit('newTabRequested', { title: `New ${this.tabs.length + 1}`, url: 'about:blank' });
            } else if (this.focusedElement === 'back') {
              this.emit('back');
            } else if (this.focusedElement === 'forward') {
              this.emit('forward');
            } else if (this.focusedElement === 'go' || this.focusedElement === 'address') {
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
    const tabbable = this.computeTabbableElements();
    if (!tabbable.length) return;

    const currentIdx = this.findCurrentFocusIndex(tabbable);
    const nextIdx = (currentIdx + 1) % tabbable.length;
    this.setFocus(tabbable[nextIdx]);
    this.render();
  }

  focusPreviousElement() {
    const tabbable = this.computeTabbableElements();
    if (!tabbable.length) return;

    const currentIdx = this.findCurrentFocusIndex(tabbable);
    const prevIdx = (currentIdx - 1 + tabbable.length) % tabbable.length;
    this.setFocus(tabbable[prevIdx]);
    this.render();
  }

  findCurrentFocusIndex(tabbable) {
    if (!this.focusedElement) return -1;
    if (this.focusedElement === 'tabs') {
      return tabbable.findIndex(el => el.type === 'tab' && el.index === this.focusedTabIndex);
    }
    if (this.focusedElement.startsWith('input:')) {
      const id = this.focusedElement.split(':')[1];
      return tabbable.findIndex(el => el.type === 'input' && String(el.backendNodeId) === id);
    }
    return tabbable.findIndex(el => el.type === this.focusedElement);
  }

  setFocus(element) {
    this.previousFocusedElement = this.focusedElement;

    if (element.type === 'tab') {
      this.focusedElement = 'tabs';
      this.focusedTabIndex = element.index;
    } else if (element.type === 'input') {
      this.focusInput(element.backendNodeId);
    } else {
      this.focusedElement = element.type;
      if (element.type === 'address') this.cursorPosition = this.addressContent.length;
    }

    // Unfocus previous input if necessary
    if (this.previousFocusedElement?.startsWith('input:') && this.focusedElement !== this.previousFocusedElement) {
      const prevId = this.previousFocusedElement.split(':')[1];
      this.redrawUnfocusedInput(prevId);
    }
  }

  focusNextInput() {
    const inputKeys = Array.from(this.inputFields.keys()).map(id => `input:${id}`);
    if (inputKeys.length === 0) {
      this.focusedElement = 'tabs';
      if (this.previousFocusedElement && this.previousFocusedElement.startsWith('input:')) {
        const prevBackendNodeId = this.previousFocusedElement.split(':')[1];
        this.redrawUnfocusedInput(prevBackendNodeId);
      }
      this.previousFocusedElement = this.focusedElement;
      this.render();
      return;
    }
    const currentIdx = inputKeys.indexOf(this.focusedElement);
    const newFocusedElement = inputKeys[(currentIdx + 1) % inputKeys.length] || 'tabs';

    // Redraw previous input as unfocused
    if (this.previousFocusedElement && this.previousFocusedElement.startsWith('input:')) {
      const prevBackendNodeId = this.previousFocusedElement.split(':')[1];
      if (this.previousFocusedElement !== newFocusedElement) {
        this.redrawUnfocusedInput(prevBackendNodeId);
      }
    }

    this.focusedElement = newFocusedElement;
    this.previousFocusedElement = this.focusedElement;
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
      if (this.previousFocusedElement && this.previousFocusedElement.startsWith('input:')) {
        const prevBackendNodeId = this.previousFocusedElement.split(':')[1];
        this.redrawUnfocusedInput(prevBackendNodeId);
      }
      this.previousFocusedElement = this.focusedElement;
      this.render();
      return;
    }
    const currentIdx = inputKeys.indexOf(this.focusedElement);
    const newFocusedElement = inputKeys[(currentIdx - 1 + inputKeys.length) % inputKeys.length] || 'tabs';

    // Redraw previous input as unfocused
    if (this.previousFocusedElement && this.previousFocusedElement.startsWith('input:')) {
      const prevBackendNodeId = this.previousFocusedElement.split(':')[1];
      if (this.previousFocusedElement !== newFocusedElement) {
        this.redrawUnfocusedInput(prevBackendNodeId);
      }
    }

    this.focusedElement = newFocusedElement;
    this.previousFocusedElement = this.focusedElement;
    if (this.focusedElement.startsWith('input:')) {
      const id = this.focusedElement.split(':')[1];
      const inputState = this.inputFields.get(id);
      if (inputState) inputState.focused = true;
    }
    this.render();
  }

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

