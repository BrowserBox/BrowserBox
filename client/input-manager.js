import { logClicks } from './log.js';
import { dinoGame } from './dino.js';
import KEYS from './kbd.js';
import { handleClick } from './baby-jaguar.js';

export class InputManager {
  constructor(term, browser) {
    this.term = term;
    this.browser = browser;
    this.keyBuffer = '';
    this.isListening = true;
  }

  setupInput() {
    this.term.grabInput({ mouse: 'button' });

    this.term.on('key', async (key) => {
      logClicks(`Key pressed: ${key}, focusedElement: ${this.browser.focusManager.getFocusedElement()}`);

      if (await this.handleDinoCommand(key)) {
        this.isListening = false;
        return;
      }

      if (this.handleGlobalKeybindings(key)) {
        this.isListening = false;
        return;
      }

      const focusedElement = this.browser.focusManager.getFocusedElement();
      if (focusedElement?.startsWith('input:')) {
        this.handleInputKey(key);
      } else if (focusedElement?.startsWith('clickable:')) {
        this.handleClickableKey(key);
      } else if (focusedElement === 'address') {
        this.handleAddressKey(key);
      } else {
        this.handleUIKey(key);
      }
    });

    this.term.on('mouse', (name, data) => {
      this.handleMouseEvent(name, data);
    });

    this.stopListening = () => {
      this.isListening = false;
    };
  }

  async handleDinoCommand(key) {
    if (!this.isListening) return false;

    const focusedElement = this.browser.focusManager.getFocusedElement();
    if (!focusedElement?.startsWith('input:') && focusedElement !== 'address') {
      if (key.length === 1) {
        this.keyBuffer += key.toLowerCase();
        if (this.keyBuffer.length > 4) {
          this.keyBuffer = this.keyBuffer.slice(-4);
        }
        if (this.keyBuffer === 'dino') {
          this.keyBuffer = '';
          this.term.off('key');
          this.term.off('mouse');
          await dinoGame(() => {
            this.setupInput();
            this.browser.render();
          });
          return true;
        }
      } else {
        this.keyBuffer = '';
      }
    } else {
      this.keyBuffer = '';
    }
    return false;
  }

  handleGlobalKeybindings(key) {
    if (key === 'CTRL_C') {
      this.term.clear();
      this.term.processExit(0);
      return true;
    }
    if (key === 'CTRL_T') {
      this.browser.emit('newTabRequested', { title: `New ${this.browser.targets.length + 1}`, url: 'about:blank' });
      return false;
    }
    if (key === 'CTRL_W') {
      if (this.browser.selectedTabId) this.browser.closeTab(this.browser.selectedTabId);
      return false;
    }
    return false;
  }

  async handleInputKey(key) {
    const backendNodeId = this.browser.focusManager.getFocusedElement().split(':')[1];
    const inputState = this.browser.inputFields.get(backendNodeId);
    if (!inputState) {
      logClicks(`No input state for ${backendNodeId}`);
      return;
    }
    logClicks(`Input focused, backendNodeId: ${backendNodeId}, current value: ${inputState.value}`);

    if (key === 'ENTER') {
      await this.handleInputCommit(backendNodeId, inputState);
      this.browser.redrawUnfocusedInput(backendNodeId);
      this.browser.focusManager.setFocusedElement(`tabs:${this.browser.selectedTabId}`);
      this.browser.focusManager.setPreviousFocusedElement(this.browser.focusManager.getFocusedElement());
      if (inputState.onChange) inputState.onChange(inputState.value);
      this.browser.render();
    } else {
      switch (key) {
        case 'LEFT':
          if (inputState.cursorPosition > 0) inputState.cursorPosition--;
          this.browser.redrawFocusedInput();
          break;
        case 'RIGHT':
          if (inputState.cursorPosition < inputState.value.length) inputState.cursorPosition++;
          this.browser.redrawFocusedInput();
          break;
        case 'BACKSPACE':
          if (inputState.cursorPosition > 0) {
            inputState.value = inputState.value.slice(0, inputState.cursorPosition - 1) + inputState.value.slice(inputState.cursorPosition);
            inputState.cursorPosition--;
            if (inputState.onChange) inputState.onChange(inputState.value);
            this.browser.redrawFocusedInput();
          }
          break;
        case 'TAB':
          this.browser.focusManager.focusNextElement(
            element => this.browser.setFocus(element)
          );
          this.browser.render();
          break;
        case 'SHIFT_TAB':
          this.browser.focusManager.focusPreviousElement(
            element => this.browser.setFocus(element)
          );
          this.browser.render();
          break;
        case 'UP':
        case 'DOWN':
          this.browser.emit('scroll', { direction: key === 'UP' ? -1 : 1 });
          break;
        default:
          if (key.length === 1) {
            inputState.value = inputState.value.slice(0, inputState.cursorPosition) + key + inputState.value.slice(inputState.cursorPosition);
            inputState.cursorPosition++;
            logClicks(`Updated value: ${inputState.value}`);
            if (inputState.onChange) inputState.onChange(inputState.value);
            this.browser.redrawFocusedInput();
          }
          break;
      }
    }
  }

  async handleInputCommit(backendNodeId, inputState, { useEnter = true } = {}) {
    let keys;
    if (useEnter) {
      keys = KEYS.keyEvent('Enter', 'Space', 'Backspace');
    } else {
      keys = KEYS.keyEvent('Space', 'Backspace');
    }
    const { send, sessionId } = this.browser.getState();
    for (const { command: { name, params } } of keys) {
      try {
        await send(name, params, sessionId);
        await this.browser.sleep(50);
        logClicks(`Sent key (${params.key},${params.type}) event for backendNodeId: ${backendNodeId} and session ${sessionId}`);
      } catch (error) {
        logClicks(`Failed to send Enter key event for backendNodeId ${backendNodeId}: ${error.message}`);
      }
    }
  }

  async handleClickableKey(key) {
    const backendNodeId = this.browser.focusManager.getFocusedElement().split(':')[1];
    const publicState = this.browser.getState();
    const tabbable = this.browser.focusManager.computeTabbableElements();
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
        this.browser.render();
      } else {
        logClicks(`No tabbable element found for clickable:${backendNodeId}`);
      }
    } else if (key === 'TAB' || key === 'l') {
      this.browser.focusManager.focusNextElement(
        element => this.browser.setFocus(element)
      );
      this.browser.render();
    } else if (key === 'SHIFT_TAB' || key === 'h') {
      this.browser.focusManager.focusPreviousElement(
        element => this.browser.setFocus(element)
      );
      this.browser.render();
    } else {
      switch (key) {
        case 'UP':
        case 'DOWN':
          this.browser.emit('scroll', { direction: key === 'UP' ? -1 : 1 });
          break;
        case 'j':
          this.browser.focusManager.focusNearestInRow(
            'down',
            element => this.browser.setFocus(element),
            this.browser.options
          );
          this.browser.render();
          break;
        case 'k':
          this.browser.focusManager.focusNearestInRow(
            'up',
            element => this.browser.setFocus(element),
            this.browser.options
          );
          this.browser.render();
          break;
        case '[':
          this.browser.focusManager.sessionId = publicState.sessionId;
          this.browser.selectPreviousTab();
          break;
        case ']':
          this.browser.focusManager.sessionId = publicState.sessionId;
          this.browser.selectNextTab();
          break;
      }
    }
  }

  handleAddressKey(key) {
    switch (key) {
      case 'ENTER':
        this.browser.emit('navigate', this.browser.addressContent);
        if (this.browser.selectedTabId !== null) {
          this.browser.targets.find(t => t.targetId === this.browser.selectedTabId).url = this.browser.addressContent;
        }
        this.browser.render();
        break;
      case 'TAB':
        this.browser.focusManager.focusNextElement(
          element => this.browser.setFocus(element)
        );
        this.browser.render();
        break;
      case 'SHIFT_TAB':
        this.browser.focusManager.focusPreviousElement(
          element => this.browser.setFocus(element)
        );
        this.browser.render();
        break;
      case 'LEFT':
        if (this.browser.cursorPosition > 0) this.browser.cursorPosition--;
        this.browser.render();
        break;
      case 'RIGHT':
        if (this.browser.cursorPosition < this.browser.addressContent.length) this.browser.cursorPosition++;
        this.browser.render();
        break;
      case 'BACKSPACE':
        if (this.browser.cursorPosition > 0) {
          this.browser.addressContent = this.browser.addressContent.slice(0, this.browser.cursorPosition - 1) + this.browser.addressContent.slice(this.browser.cursorPosition);
          this.browser.cursorPosition--;
          this.browser.render();
        }
        break;
      case 'UP':
      case 'DOWN':
        this.browser.emit('scroll', { direction: key === 'UP' ? -1 : 1 });
        break;
      default:
        if (key.length === 1) {
          this.browser.addressContent = this.browser.addressContent.slice(0, this.browser.cursorPosition) + key + this.browser.addressContent.slice(this.browser.cursorPosition);
          this.browser.cursorPosition++;
          this.browser.render();
        }
        break;
    }
  }

  handleUIKey(key) {
    switch (key) {
      case 'j':
        this.browser.focusManager.focusNearestInRow(
          'down',
          element => this.browser.setFocus(element),
          this.browser.options
        );
        this.browser.render();
        break;
      case 'k':
        this.browser.focusManager.focusNearestInRow(
          'up',
          element => this.browser.setFocus(element),
          this.browser.options
        );
        this.browser.render();
        break;
      case 'ENTER':
        this.handleUIEnter();
        this.browser.render();
        break;
      case 'TAB':
        this.browser.focusManager.focusNextElement(
          element => this.browser.setFocus(element)
        );
        this.browser.render();
        break;
      case 'SHIFT_TAB':
        this.browser.focusManager.focusPreviousElement(
          element => this.browser.setFocus(element)
        );
        this.browser.render();
        break;
      case 'h':
      case 'LEFT':
        this.browser.focusManager.focusPreviousElement(
          element => this.browser.setFocus(element)
        );
        this.browser.render();
        break;
      case 'l':
      case 'RIGHT':
        this.browser.focusManager.focusNextElement(
          element => this.browser.setFocus(element)
        );
        this.browser.render();
        break;
      case 'UP':
      case 'DOWN':
        this.browser.emit('scroll', { direction: key === 'UP' ? -1 : 1 });
        break;
      case '[':
        this.browser.selectPreviousTab();
        break;
      case ']':
        this.browser.selectNextTab();
        break;
    }
  }

  handleUIEnter() {
    const focusedElement = this.browser.focusManager.getFocusedElement();
    if (focusedElement.startsWith('tabs:')) {
      this.browser.selectedTabId = focusedElement.split(':')[1];
      this.browser.emit('tabSelected', this.browser.targets.find(t => t.targetId === this.browser.selectedTabId));
    } else if (focusedElement === 'newTab') {
      this.browser.emit('newTabRequested', { title: `New ${this.browser.targets.length + 1}`, url: 'about:blank' });
    } else if (focusedElement === 'back') {
      this.browser.emit('back');
    } else if (focusedElement === 'forward') {
      this.browser.emit('forward');
    } else if (focusedElement === 'go') {
      this.browser.emit('navigate', this.browser.addressContent);
      if (this.browser.selectedTabId !== null) {
        this.browser.targets.find(t => t.targetId === this.browser.selectedTabId).url = this.browser.addressContent;
      }
    }
  }

  handleMouseEvent(name, data) {
    const { x, y } = data;
    if (name === 'MOUSE_LEFT_BUTTON_PRESSED') {
      this.handleMouseClick(x, y);
    } else if (name === 'MOUSE_WHEEL_UP' || name === 'MOUSE_WHEEL_DOWN') {
      if (y > 4) {
        this.browser.emit('scroll', { direction: name === 'MOUSE_WHEEL_UP' ? -1 : 1 });
      }
    }
  }

  handleMouseClick(x, y) {
    if (y === 1) {
      if (x >= this.browser.term.width - this.browser.NEW_TAB_WIDTH + 1 && x <= this.browser.term.width) {
        this.browser.emit('newTabRequested', { title: `New ${this.browser.targets.length + 1}`, url: 'about:blank' });
        return;
      }
      let tabX = 1;
      for (let i = this.browser.tabOffset; i < this.browser.targets.length && tabX <= this.browser.term.width - this.browser.NEW_TAB_WIDTH; i++) {
        const tabEnd = tabX + this.browser.options.tabWidth - 1;
        if (x >= tabX && x <= tabEnd) {
          const closeXStart = tabX + this.browser.options.tabWidth - 5;
          if (x >= closeXStart && x <= closeXStart + 3) {
            this.browser.closeTab(i);
          } else {
            this.browser.selectedTabId = this.browser.targets[i].targetId;
            this.browser.focusManager.setFocusedElement(`tabs:${this.browser.selectedTabId}`);
            this.browser.emit('tabSelected', this.browser.targets[i]);
          }
          return;
        }
        tabX += this.browser.options.tabWidth;
      }
    }

    if (y === this.browser.TAB_HEIGHT + 2) {
      if (x >= 2 && x <= this.browser.BACK_WIDTH + 1) {
        this.browser.focusManager.setFocusedElement('back');
        this.browser.emit('back');
      } else if (x >= this.browser.BACK_WIDTH + 2 && x <= this.browser.BACK_WIDTH + this.browser.FORWARD_WIDTH + 1) {
        this.browser.focusManager.setFocusedElement('forward');
        this.browser.emit('forward');
      } else if (x >= this.browser.BACK_WIDTH + this.browser.FORWARD_WIDTH + 2 && x <= this.browser.BACK_WIDTH + this.browser.FORWARD_WIDTH + this.browser.ADDRESS_WIDTH + 1) {
        this.browser.focusManager.setFocusedElement('address');
        this.browser.cursorPosition = Math.min(
          Math.max(0, x - (this.browser.BACK_WIDTH + this.browser.FORWARD_WIDTH + 2)),
          this.browser.addressContent.length
        );
      } else if (x >= this.browser.term.width - this.browser.GO_WIDTH + 1 && x <= this.browser.term.width) {
        this.browser.focusManager.setFocusedElement('go');
        this.browser.emit('navigate', this.browser.addressContent);
        if (this.browser.selectedTabId !== null) {
          this.browser.targets.find(t => t.targetId === this.browser.selectedTabId).url = this.browser.addressContent;
        }
      }
      this.browser.render();
      return;
    }

    if (y > 4) {
      this.browser.emit('click', { x, y });
    }
  }
}
