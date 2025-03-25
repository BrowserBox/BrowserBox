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
    } else {
      term.bgBlue()[tabData[i].color](tabText); // Unfocused tab
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
    term.bgBrightWhite().black().bold(addressContent.padEnd(ADDRESS_WIDTH, ' '));
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
      if (focusedElement === 'tabs') {
        if (tabOffset > 0) {
          tabOffset--;
          focusedTabIndex = tabOffset; // Sync focus with visible tab
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
      if (focusedElement === 'tabs') {
        if (tabOffset < tabData.length - MAX_VISIBLE_TABS) {
          tabOffset++;
          focusedTabIndex = tabOffset; // Sync focus with visible tab
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

    case 'UP': // Move focus to tabs
      if (focusedElement !== 'tabs') {
        focusedElement = 'tabs';
        render(focusedElement, addressContent);
      }
      break;

    case 'DOWN': // Move focus to omnibox
      if (focusedElement === 'tabs') {
        focusedElement = 'back';
        render(focusedElement, addressContent);
      }
      break;

    case 'TAB': // Cycle focus within omnibox when not on tabs
      if (focusedElement !== 'tabs') {
        if (focusedElement === 'back') focusedElement = 'forward';
        else if (focusedElement === 'forward') focusedElement = 'address';
        else if (focusedElement === 'address') focusedElement = 'go';
        else if (focusedElement === 'go') focusedElement = 'back';
        render(focusedElement, addressContent);
      }
      break;

    case 'ENTER':
      if (focusedElement === 'tabs') {
        term.windowTitle(`Selected: ${tabData[focusedTabIndex].name}`);
      } else if (focusedElement === 'back') {
        term.windowTitle('Back pressed');
      } else if (focusedElement === 'forward') {
        term.windowTitle('Forward pressed');
      } else if (focusedElement === 'go' || focusedElement === 'address') {
        term.windowTitle(`Navigating to: ${addressContent}`);
      }
      render(focusedElement, addressContent);
      break;

    default:
      if (focusedElement === 'address') {
        if (key === 'BACKSPACE') {
          addressContent = addressContent.slice(0, -1);
        } else if (key.length === 1) {
          addressContent += key;
        }
        render(focusedElement, addressContent);
      }
      break;
  }
});

// Keep the app running
await new Promise(() => {});
