import termkit from 'terminal-kit';
const term = termkit.terminal;

// Initialize the terminal
term.fullscreen(true);
term.windowTitle('Terminal Browser');

// Array of tab names and colors
const tabData = [
  { name: 'Home', color: 'red' },
  { name: 'News', color: 'green' },
  { name: 'Sports', color: 'yellow' },
  { name: 'Tech', color: 'blue' },
  { name: 'Music', color: 'magenta' },
  { name: 'Movies', color: 'cyan' },
  { name: 'Games', color: 'brightRed' },
  { name: 'Books', color: 'brightGreen' },
  { name: 'Travel', color: 'brightYellow' },
  { name: 'Food', color: 'brightBlue' },
  { name: 'Health', color: 'brightMagenta' },
  { name: 'Fashion', color: 'brightCyan' },
  { name: 'Art', color: 'white' },
  { name: 'Science', color: 'brightWhite' },
  { name: 'Weather', color: 'gray' },
];
let tabOffset = 0; // For scrolling
let focusedTabIndex = 0; // Focused tab
let selectedTabIndex = -1; // Selected tab (-1 means none selected)
let cursorPosition = 0; // Cursor position in address bar
const TAB_MIN_WIDTH = 25;
const TAB_HEIGHT = 1;
const OMNIBOX_HEIGHT = 3;
const MAX_VISIBLE_TABS = Math.floor(term.width / TAB_MIN_WIDTH);

// Function to draw tabs
function drawTabs() {
  term.moveTo(1, 1); // Top line
  term.bgBlue().white(' '.repeat(term.width)); // Clear tab bar
  let x = 1;
  for (let i = tabOffset; i < tabData.length && x <= term.width; i++) {
    const tabText = ` ${tabData[i].name} `.padEnd(TAB_MIN_WIDTH, ' ');
    term.moveTo(x, 1);
    if (i === focusedTabIndex) {
      term.bgWhite()[tabData[i].color]().bold().underline(tabText); // Focused tab
    } else if (i === selectedTabIndex) {
      term.bgBlue()[tabData[i].color]().underline(tabText); // Selected tab
    } else {
      term.bgBlue()[tabData[i].color](tabText); // Unfocused, unselected tab
    }
    x += tabText.length;
  }
}

// Omnibox layout constants
const BACK_WIDTH = 6;
const FORWARD_WIDTH = 8;
const GO_WIDTH = 6;
const ADDRESS_WIDTH = term.width - BACK_WIDTH - FORWARD_WIDTH - GO_WIDTH - 4;

// Function to draw omnibox
function drawOmnibox(focusedElement = null, addressContent = '') {
  term.moveTo(1, TAB_HEIGHT + 1);
  term.bgBlack().cyan('─'.repeat(term.width)); // Top border
  term.moveTo(1, TAB_HEIGHT + 2);
  term.bgBlack().white(' '.repeat(term.width)); // Clear content row
  term.moveTo(1, TAB_HEIGHT + 3);
  term.bgBlack().cyan('─'.repeat(term.width)); // Bottom border

  // Back button
  term.moveTo(2, TAB_HEIGHT + 2);
  if (focusedElement === 'back') {
    term.bgBrightBlack().black().bold(' Back ');
  } else {
    term.bgGray().white(' Back ');
  }

  // Forward button
  term.moveTo(BACK_WIDTH + 2, TAB_HEIGHT + 2);
  if (focusedElement === 'forward') {
    term.bgBrightBlack().black().bold(' Forward ');
  } else {
    term.bgGray().white(' Forward ');
  }

  // Address bar
  term.moveTo(BACK_WIDTH + FORWARD_WIDTH + 2, TAB_HEIGHT + 2);
  if (focusedElement === 'address') {
    const beforeCursor = addressContent.slice(0, cursorPosition);
    const cursorChar = addressContent[cursorPosition] || ' ';
    const afterCursor = addressContent.slice(cursorPosition + 1);
    term.bgBrightWhite().black().bold(beforeCursor + cursorChar + afterCursor.padEnd(ADDRESS_WIDTH - beforeCursor.length - 1, ' '));
    term.moveTo(BACK_WIDTH + FORWARD_WIDTH + 2 + cursorPosition, TAB_HEIGHT + 2).bgBrightWhite().black().bold(cursorChar); // Highlight cursor
  } else {
    term.bgWhite().black(addressContent.slice(0, ADDRESS_WIDTH).padEnd(ADDRESS_WIDTH, ' '));
  }

  // Go button
  term.moveTo(term.width - GO_WIDTH, TAB_HEIGHT + 2);
  if (focusedElement === 'go') {
    term.bgBrightGreen().black().bold(' Go ');
  } else {
    term.bgGreen().white(' Go ');
  }
}

// Main rendering function
function render(focusedElement = null, addressContent = '') {
  term.clear();
  drawTabs();
  drawOmnibox(focusedElement, addressContent);
  term.moveTo(1, term.height); // Move cursor out of the way
}

// Initial state
let focusedElement = 'tabs'; // Start with tabs focused
let addressContent = '';
render(focusedElement, addressContent);

// Input handling
term.grabInput(true);

term.on('key', async (key) => {
  if (focusedElement === 'address') {
    // Address bar mode: limited key handling
    switch (key) {
      case 'TAB':
        focusedElement = 'go';
        render(focusedElement, addressContent);
        break;

      case 'SHIFT_TAB':
        focusedElement = 'forward';
        render(focusedElement, addressContent);
        break;

      case 'ENTER':
        term.windowTitle(`Navigating to: ${addressContent}`);
        render(focusedElement, addressContent);
        break;

      case 'LEFT':
        if (cursorPosition > 0) {
          cursorPosition--;
          render(focusedElement, addressContent);
        }
        break;

      case 'RIGHT':
        if (cursorPosition < addressContent.length) {
          cursorPosition++;
          render(focusedElement, addressContent);
        }
        break;

      case 'BACKSPACE':
        if (cursorPosition > 0) {
          addressContent = addressContent.slice(0, cursorPosition - 1) + addressContent.slice(cursorPosition);
          cursorPosition--;
          render(focusedElement, addressContent);
        }
        break;

      default:
        if (key.length === 1) {
          addressContent = addressContent.slice(0, cursorPosition) + key + addressContent.slice(cursorPosition);
          cursorPosition++;
          render(focusedElement, addressContent);
        }
        break;
    }
  } else {
    // Normal mode: full key handling
    switch (key) {
      case 'CTRL_C':
      case 'q':
        term.clear();
        term.processExit(0);
        break;

      case 't': // Add new tab
        tabData.push({ name: `New ${tabData.length + 1}`, color: 'white' });
        render(focusedElement, addressContent);
        break;

      case 'LEFT':
      case 'h': // Move focus left across tabs
        if (focusedElement === 'tabs') {
          if (focusedTabIndex > 0) {
            focusedTabIndex--;
            if (focusedTabIndex < tabOffset) {
              tabOffset--;
            }
            render(focusedElement, addressContent);
          }
        } else if (focusedElement === 'forward') {
          focusedElement = 'back';
          render(focusedElement, addressContent);
        } else if (focusedElement === 'address') {
          focusedElement = 'forward';
          render(focusedElement, addressContent);
        } else if (focusedElement === 'go') {
          focusedElement = 'address';
          render(focusedElement, addressContent);
        }
        break;

      case 'RIGHT':
      case 'l': // Move focus right across tabs
        if (focusedElement === 'tabs') {
          if (focusedTabIndex < tabData.length - 1) {
            focusedTabIndex++;
            if (focusedTabIndex >= tabOffset + MAX_VISIBLE_TABS) {
              tabOffset++;
            }
            render(focusedElement, addressContent);
          }
        } else if (focusedElement === 'back') {
          focusedElement = 'forward';
          render(focusedElement, addressContent);
        } else if (focusedElement === 'forward') {
          focusedElement = 'address';
          render(focusedElement, addressContent);
        } else if (focusedElement === 'address') {
          focusedElement = 'go';
          render(focusedElement, addressContent);
        }
        break;

      case 'UP':
      case 'k': // Move focus to tabs
        if (focusedElement !== 'tabs') {
          focusedElement = 'tabs';
          render(focusedElement, addressContent);
        }
        break;

      case 'DOWN':
      case 'j': // Move focus to omnibox
        if (focusedElement === 'tabs') {
          focusedElement = 'back';
          render(focusedElement, addressContent);
        }
        break;

      case 'TAB': // Cycle through everything forward
        if (focusedElement === 'tabs') {
          if (focusedTabIndex < tabData.length - 1) {
            focusedTabIndex++;
            if (focusedTabIndex >= tabOffset + MAX_VISIBLE_TABS) {
              tabOffset++;
            }
          } else {
            focusedElement = 'back';
          }
        } else if (focusedElement === 'back') {
          focusedElement = 'forward';
        } else if (focusedElement === 'forward') {
          focusedElement = 'address';
          cursorPosition = addressContent.length; // Start at end of text
        } else if (focusedElement === 'go') {
          focusedElement = 'tabs';
          focusedTabIndex = 0;
          tabOffset = 0;
        }
        render(focusedElement, addressContent);
        break;

      case 'SHIFT_TAB': // Cycle through everything backward
        if (focusedElement === 'tabs') {
          if (focusedTabIndex > 0) {
            focusedTabIndex--;
            if (focusedTabIndex < tabOffset) {
              tabOffset--;
            }
          } else {
            focusedElement = 'go';
          }
        } else if (focusedElement === 'back') {
          focusedElement = 'tabs';
          focusedTabIndex = tabData.length - 1;
          tabOffset = Math.max(0, tabData.length - MAX_VISIBLE_TABS);
        } else if (focusedElement === 'forward') {
          focusedElement = 'back';
        } else if (focusedElement === 'go') {
          focusedElement = 'address';
          cursorPosition = addressContent.length; // Start at end of text
        }
        render(focusedElement, addressContent);
        break;

      case 'ENTER':
        if (focusedElement === 'tabs') {
          selectedTabIndex = focusedTabIndex; // Select the focused tab
          term.windowTitle(`Selected: ${tabData[selectedTabIndex].name}`);
          render(focusedElement, addressContent);
        } else if (focusedElement === 'back') {
          term.windowTitle('Back pressed');
          render(focusedElement, addressContent);
        } else if (focusedElement === 'forward') {
          term.windowTitle('Forward pressed');
          render(focusedElement, addressContent);
        } else if (focusedElement === 'go') {
          term.windowTitle(`Navigating to: ${addressContent}`);
          render(focusedElement, addressContent);
        }
        break;

      default:
        if (key === 'r' && focusedElement === 'tabs') { // Bonus r key
          if (focusedTabIndex > 0) {
            focusedTabIndex--;
            if (focusedTabIndex < tabOffset) {
              tabOffset--;
            }
            render(focusedElement, addressContent);
          }
        }
        break;
    }
  }
});

// Keep the app running
await new Promise(() => {});
