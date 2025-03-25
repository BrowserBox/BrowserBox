import blessed from 'neo-blessed';

// Create the screen
const screen = blessed.screen({
  smartCSR: true,
  title: 'Terminal Browser',
});

// Function to create a new tab
const createTab = (index) => `Tab ${index + 1}`;

// Initialize tabs (let's start with 10 for demo purposes)
const tabs = Array.from({ length: 10 }, (_, i) => createTab(i));

// Tab bar with infinite scrolling
const tabBar = blessed.list({
  parent: screen,
  top: 0,
  left: 0,
  width: '100%',
  height: 1,
  items: tabs,
  scrollable: true,
  alwaysScroll: true,
  keys: true,
  mouse: true,
  style: {
    fg: 'white',
    bg: 'blue',
    selected: {
      fg: 'black',
      bg: 'white',
    },
  },
});

// Omnibox container
const omnibox = blessed.box({
  parent: screen,
  top: 1,
  left: 0,
  width: '100%',
  height: 3,
  border: {
    type: 'line',
  },
  style: {
    fg: 'white',
    bg: 'black',
    border: {
      fg: 'cyan',
    },
  },
});

// Back button
const backButton = blessed.button({
  parent: omnibox,
  left: 1,
  top: 1,
  width: 5,
  height: 1,
  content: 'Back',
  align: 'center',
  style: {
    fg: 'white',
    bg: 'gray',
    hover: {
      bg: 'lightgray',
    },
  },
});

// Forward button
const forwardButton = blessed.button({
  parent: omnibox,
  left: 7,
  top: 1,
  width: 7,
  height: 1,
  content: 'Forward',
  align: 'center',
  style: {
    fg: 'white',
    bg: 'gray',
    hover: {
      bg: 'lightgray',
    },
  },
});

// Address bar
const addressBar = blessed.textbox({
  parent: omnibox,
  left: 15,
  top: 1,
  width: '70%-15',
  height: 1,
  inputOnFocus: true,
  style: {
    fg: 'black',
    bg: 'white',
    focus: {
      border: {
        fg: 'yellow',
      },
    },
  },
});

// Go button
const goButton = blessed.button({
  parent: omnibox,
  right: 1,
  top: 1,
  width: 5,
  height: 1,
  content: 'Go',
  align: 'center',
  style: {
    fg: 'white',
    bg: 'green',
    hover: {
      bg: 'lightgreen',
    },
  },
});

// Event handlers
backButton.on('press', () => {
  screen.title = 'Back pressed';
  screen.render();
});

forwardButton.on('press', () => {
  screen.title = 'Forward pressed';
  screen.render();
});

goButton.on('press', async () => {
  const url = addressBar.getValue();
  screen.title = `Navigating to: ${url}`;
  screen.render();
});

addressBar.on('submit', async (value) => {
  screen.title = `Submitted: ${value}`;
  screen.render();
});

// Add more tabs dynamically with a keybinding
screen.key(['t'], () => {
  tabs.push(createTab(tabs.length));
  tabBar.setItems(tabs);
  screen.render();
});

// Scroll tabs with arrow keys
screen.key(['left'], () => {
  tabBar.scroll(-1);
  screen.render();
});

screen.key(['right'], () => {
  tabBar.scroll(1);
  screen.render();
});

// Focus management
screen.key(['tab'], () => {
  screen.focusNext();
  screen.render();
});

// Exit with 'q' or 'Ctrl+C'
screen.key(['q', 'C-c'], () => process.exit(0));

// Initial render
screen.render();

// Keep the app running
await new Promise(() => {});
