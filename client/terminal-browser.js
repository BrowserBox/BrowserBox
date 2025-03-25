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
    this.tabOffset = 0;
    this.focusedTabIndex = 0;
    this.selectedTabIndex = -1;
    this.focusedElement = 'tabs';
    this.addressContent = '';
    this.cursorPosition = 0;

    // Constants
    this.TAB_HEIGHT = 1;
    this.OMNIBOX_HEIGHT = 3;
    this.MAX_VISIBLE_TABS = Math.floor(this.term.width / this.options.tabWidth);
    this.BACK_WIDTH = 6;
    this.FORWARD_WIDTH = 8;
    this.GO_WIDTH = 6;
    this.ADDRESS_WIDTH = this.term.width - this.BACK_WIDTH - this.FORWARD_WIDTH - this.GO_WIDTH - 4;

    // Initialize terminal
    this.term.fullscreen(true);
    this.term.windowTitle('Terminal Browser');

    // Start rendering and input handling
    this.render();
    this.setupInput();
  }

  // Draw tabs
  drawTabs() {
    this.term.moveTo(1, 1);
    this.term.bgBlue().white(' '.repeat(this.term.width));
    let x = 1;
    for (let i = this.tabOffset; i < this.tabs.length && x <= this.term.width; i++) {
      const truncatedTitle = this.tabs[i].title.slice(0, this.options.tabWidth - 4);
      const tabText = ` ${truncatedTitle} `.padEnd(this.options.tabWidth, ' ');
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
  }

  // Draw omnibox with visible cursor
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
      // Draw the text before and after the cursor
      this.term.bgBrightWhite().black(beforeCursor);
      // Draw the cursor character with inverse colors
      this.term.bgBlack().brightWhite().bold(cursorChar);
      // Draw the text after the cursor
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
    this.term.clear();
    this.drawTabs();
    this.drawOmnibox();
    this.term.moveTo(1, this.term.height);
  }

  // Setup input handling
  setupInput() {
    this.term.grabInput({mouse:'button'});
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
            this.render();
            break;
          case 'LEFT':
            if (this.cursorPosition > 0) {
              this.cursorPosition--;
              this.render();
            }
            break;
          case 'RIGHT':
            if (this.cursorPosition < this.addressContent.length) {
              this.cursorPosition++;
              this.render();
            }
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
          case 'q':
            this.term.clear();
            this.term.processExit(0);
            break;

          case 't':
            this.addTab({ title: `New ${this.tabs.length + 1}`, url: '' });
            this.render();
            break;

          case 'LEFT':
          case 'h':
            if (this.focusedElement === 'tabs') {
              if (this.focusedTabIndex > 0) {
                this.focusedTabIndex--;
                if (this.focusedTabIndex < this.tabOffset) {
                  this.tabOffset--;
                }
                this.render();
              }
            } else if (this.focusedElement === 'forward') {
              this.focusedElement = 'back';
              this.render();
            } else if (this.focusedElement === 'address') {
              this.focusedElement = 'forward';
              this.render();
            } else if (this.focusedElement === 'go') {
              this.focusedElement = 'address';
              this.render();
            }
            break;

          case 'RIGHT':
          case 'l':
            if (this.focusedElement === 'tabs') {
              if (this.focusedTabIndex < this.tabs.length - 1) {
                this.focusedTabIndex++;
                if (this.focusedTabIndex >= this.tabOffset + this.MAX_VISIBLE_TABS) {
                  this.tabOffset++;
                }
                this.render();
              }
            } else if (this.focusedElement === 'back') {
              this.focusedElement = 'forward';
              this.render();
            } else if (this.focusedElement === 'forward') {
              this.focusedElement = 'address';
              this.render();
            } else if (this.focusedElement === 'address') {
              this.focusedElement = 'go';
              this.render();
            }
            break;

          case 'UP':
          case 'k':
            if (this.focusedElement !== 'tabs') {
              this.focusedElement = 'tabs';
              this.render();
            }
            break;

          case 'DOWN':
          case 'j':
            if (this.focusedElement === 'tabs') {
              this.focusedElement = 'back';
              this.render();
            }
            break;

          case 'TAB':
            if (this.focusedElement === 'tabs') {
              if (this.focusedTabIndex < this.tabs.length - 1) {
                this.focusedTabIndex++;
                if (this.focusedTabIndex >= this.tabOffset + this.MAX_VISIBLE_TABS) {
                  this.tabOffset++;
                }
              } else {
                this.focusedElement = 'back';
              }
            } else if (this.focusedElement === 'back') {
              this.focusedElement = 'forward';
            } else if (this.focusedElement === 'forward') {
              this.focusedElement = 'address';
              this.cursorPosition = this.addressContent.length;
            } else if (this.focusedElement === 'go') {
              this.focusedElement = 'tabs';
              this.focusedTabIndex = 0;
              this.tabOffset = 0;
            }
            this.render();
            break;

          case 'SHIFT_TAB':
            if (this.focusedElement === 'tabs') {
              if (this.focusedTabIndex > 0) {
                this.focusedTabIndex--;
                if (this.focusedTabIndex < this.tabOffset) {
                  this.tabOffset--;
                }
              } else {
                this.focusedElement = 'go';
              }
            } else if (this.focusedElement === 'back') {
              this.focusedElement = 'tabs';
              this.focusedTabIndex = this.tabs.length - 1;
              this.tabOffset = Math.max(0, this.tabs.length - this.MAX_VISIBLE_TABS);
            } else if (this.focusedElement === 'forward') {
              this.focusedElement = 'back';
            } else if (this.focusedElement === 'go') {
              this.focusedElement = 'address';
              this.cursorPosition = this.addressContent.length;
            }
            this.render();
            break;

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
              this.render();
            }
            break;

          default:
            if (key === 'r' && this.focusedElement === 'tabs') {
              if (this.focusedTabIndex > 0) {
                this.focusedTabIndex--;
                if (this.focusedTabIndex < this.tabOffset) {
                  this.tabOffset--;
                }
                this.render();
              }
            }
            break;
        }
      }
    });
  }

  // API Methods
  addTab(tab) {
    this.tabs.push({
      title: tab.title,
      url: tab.url,
      color: this.options.colors[this.tabs.length % this.options.colors.length],
    });
    this.emit('tabAdded', tab);
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
}

// Example usage
/**
{
  const browser = new TerminalBrowser({
    tabWidth: 30,
    initialTabs: [
      { title: 'Google', url: 'https://google.com' },
      { title: 'GitHub', url: 'https://github.com' },
      { title: 'Reddit', url: 'https://reddit.com' },
    ],
  });

  browser.on('tabSelected', (tab) => {
    console.log(`Tab selected: ${tab.title} (${tab.url})`);
    browser.setAddress(tab.url);
  });

  browser.on('tabAdded', (tab) => {
    console.log(`Tab added: ${tab.title}`);
  });

  browser.on('back', () => {
    console.log('Back button pressed');
  });

  browser.on('forward', () => {
    console.log('Forward button pressed');
  });

  browser.on('navigate', (url) => {
    console.log(`Navigating to: ${url}`);
  });

  // Keep the app running
  await new Promise(() => {});
}
**/
