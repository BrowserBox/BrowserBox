import termkit from 'terminal-kit';
import { EventEmitter } from 'events';

const term = termkit.terminal;

export default class TerminalBrowser extends EventEmitter {
  constructor(options = {}) {
    super();
    this.term = term;
    this.options = {
      tabWidth: options.tabWidth || 25,
      initialTabs: options.initialTabs || [
        { title: 'Home', url: 'https://home.com' },
        { title: 'News', url: 'https://news.com' },
        { title: 'Sports', url: 'https://sports.com' },
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
    this.focusedElement = 'tabs';
    this.addressContent = '';
    this.cursorPosition = 0;

    // Constants
    this.TAB_HEIGHT = 1;
    this.OMNIBOX_HEIGHT = 3;
    this.MAX_VISIBLE_TABS = Math.floor((this.term.width - 5) / this.options.tabWidth); // Reserve space for [+]
    this.BACK_WIDTH = 6;
    this.FORWARD_WIDTH = 8;
    this.GO_WIDTH = 6;
    this.ADDRESS_WIDTH = this.term.width - this.BACK_WIDTH - this.FORWARD_WIDTH - this.GO_WIDTH - 4;
    this.NEW_TAB_WIDTH = 5; // "[+] "

    // Initialize terminal
    this.term.fullscreen(true);
    this.term.windowTitle('Terminal Browser');

    // Start rendering and input handling
    this.render();
    this.setupInput();
  }

  // Draw tabs with [x] and [+] button
  drawTabs() {
    this.term.moveTo(1, 1);
    this.term.bgBlue().white(' '.repeat(this.term.width));
    let x = 1;
    for (let i = this.tabOffset; i < this.tabs.length && x <= this.term.width - this.NEW_TAB_WIDTH; i++) {
      // Truncate title to fit within the tab width, accounting for leading space and [x]
      const maxTitleLength = this.options.tabWidth - 5; // 1 for leading space, 3 for [x], 1 for space before [x]
      const truncatedTitle = this.tabs[i].title.slice(0, maxTitleLength);
      // Construct the tab text: " title" + padding + "[x]"
      const titlePart = ` ${truncatedTitle}`;
      const paddingLength = this.options.tabWidth - titlePart.length - 3; // Space needed before [x]
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

    // Draw [+] button at top right
    this.term.moveTo(this.term.width - this.NEW_TAB_WIDTH + 1, 1);
    this.term.bgBlue().white(' [+] ');
  }

  // Draw omnibox
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

  // Render the UI
  render() {
    this.term.moveTo(1, 6);
    this.term.eraseDisplayAbove();
    this.drawTabs();
    this.drawOmnibox();
    this.term.bgDefaultColor();
    this.term.defaultColor();
    this.term.moveTo(1, this.term.height);
  }

  // Setup input handling with mouse support
  setupInput() {
    this.term.grabInput({ mouse: 'button' });
    this.term.on('key', async (key) => {
      if (this.focusedElement === 'address') {
        switch (key) {
          case 'TAB':
            this.focusedElement = 'go';
            this.render();
            break;
          case 'SHIFT_TAB':
            this.focusedElement = 'forward';
            this.render();
            break;
          case 'ENTER':
            this.emit('navigate', this.addressContent);
            if (this.selectedTabIndex !== -1) {
              this.tabs[this.selectedTabIndex].url = this.addressContent;
              this.tabs[this.selectedTabIndex].title = '...';
            }
            this.render();
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
          default:
            if (key.length === 1) {
              this.addressContent = this.addressContent.slice(0, this.cursorPosition) + key + this.addressContent.slice(this.cursorPosition);
              this.cursorPosition++;
              this.render();
            }
            break;
        }
      } else {
        switch (key) {
          case 'CTRL_C':
            this.term.clear();
            this.term.processExit(0);
            break;
          // Other key cases remain unchanged...
          case 'ENTER':
            if (this.focusedElement === 'tabs') {
              this.selectedTabIndex = this.focusedTabIndex;
              this.emit('tabSelected', this.tabs[this.selectedTabIndex]);
              this.render();
            } else if (this.focusedElement === 'back') {
              this.emit('back');
              this.render();
            } else if (this.focusedElement === 'forward') {
              this.emit('forward');
              this.render();
            } else if (this.focusedElement === 'go') {
              this.emit('navigate', this.addressContent);
              if (this.selectedTabIndex !== -1) {
                this.tabs[this.selectedTabIndex].url = this.addressContent;
                this.tabs[this.selectedTabIndex].title = new URL(this.addressContent).hostname;
              }
              this.render();
            }
            break;
        }
      }
    });

    // Mouse handling
    this.term.on('mouse', (name, data) => {
      if (name === 'MOUSE_LEFT_BUTTON_PRESSED') {
        const { x, y } = data;

        // Tab row (y = 1)
        if (y === 1) {
          // Check for [+] button
          if (x >= this.term.width - this.NEW_TAB_WIDTH + 1 && x <= this.term.width) {
            this.emit('newTabRequested', { title: `New ${this.tabs.length + 1}`, url: 'about:blank' });
            // Don’t call addTab here; wait for main logic to confirm
            return;
          }

          // Check tabs and [x]
          let tabX = 1;
          for (let i = this.tabOffset; i < this.tabs.length && tabX <= this.term.width - this.NEW_TAB_WIDTH; i++) {
            const tabEnd = tabX + this.options.tabWidth - 1;
            if (x >= tabX && x <= tabEnd) {
              const closeXStart = tabX + this.options.tabWidth - 5; // "[x]" position
              if (x >= closeXStart && x <= closeXStart + 3) {
                // Close tab
                this.closeTab(i);
              } else {
                // Focus/select tab
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
            this.render();
          } else if (x >= this.BACK_WIDTH + 2 && x <= this.BACK_WIDTH + this.FORWARD_WIDTH + 1) {
            this.focusedElement = 'forward';
            this.emit('forward');
            this.render();
          } else if (x >= this.BACK_WIDTH + this.FORWARD_WIDTH + 2 && x <= this.BACK_WIDTH + this.FORWARD_WIDTH + this.ADDRESS_WIDTH + 1) {
            this.focusedElement = 'address';
            this.cursorPosition = Math.min(
              Math.max(0, x - (this.BACK_WIDTH + this.FORWARD_WIDTH + 2)),
              this.addressContent.length
            );
            this.render();
          } else if (x >= this.term.width - this.GO_WIDTH + 1 && x <= this.term.width) {
            this.focusedElement = 'go';
            this.emit('navigate', this.addressContent);
            if (this.selectedTabIndex !== -1) {
              this.tabs[this.selectedTabIndex].url = this.addressContent;
              this.tabs[this.selectedTabIndex].title = new URL(this.addressContent).hostname;
            }
            this.render();
          }
        }
      }
    });
  }

  // API Methods
// In TerminalBrowser class, replace the addTab method:
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

  destroy() {
    this.term.clear();
    this.term.processExit(0);
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
}
