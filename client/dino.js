import termkit from 'terminal-kit';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

const term = termkit.terminal;

// Map color names to terminal-kit color methods
const colorMap = {
  blue: term.blue,
  magenta: term.magenta,
  green: term.green,
  darkGreen: term.green, // terminal-kit doesn't have a direct darkGreen, so we'll use green
  yellow: term.yellow,
  gray: term.gray,
  white: term.white,
  brightWhite: term.brightWhite,
  red: term.red
};

// High score file path
const highScoreDir = path.join(os.homedir(), '.config', 'dosaygo', 'kernel');
const highScoreFile = path.join(highScoreDir, 'dino.score');

// Load high score from file
async function loadHighScore() {
  try {
    await fs.mkdir(highScoreDir, { recursive: true }); // Create directory if it doesn't exist
    const data = await fs.readFile(highScoreFile, 'utf8');
    const json = JSON.parse(data);
    return json.highScore || 0;
  } catch (err) {
    if (err.code === 'ENOENT') return 0; // File doesn't exist, start with 0
    console.error('Error loading high score:', err);
    return 0;
  }
}

// Save high score to file
async function saveHighScore(highScore) {
  try {
    await fs.mkdir(highScoreDir, { recursive: true }); // Create directory if it doesn't exist
    await fs.writeFile(highScoreFile, JSON.stringify({ highScore }), 'utf8');
  } catch (err) {
    console.error('Error saving high score:', err);
  }
}

async function dinoGame() {
  // Initialize terminal
  term.fullscreen(true);
  term.windowTitle('Dino Game');
  term.clear();

  // Spawn boop.js for sound effects
  const soundProcess = spawn('node', ['boop.js'], {
    detached: true,
    stdio: ['ignore', 'ignore', 'ignore', 'ipc'], // Ignore stdio, use IPC channel
    windowsHide: true
  });
  soundProcess.unref();

  // Game state
  const groundY = term.height - 5; // Ground near the bottom
  let dinoY = groundY; // Dino's vertical position (ground level)
  const jumpHeight = 15; // Higher jump
  let isJumping = false;
  let jumpFrame = 0;
  const jumpDuration = 24; // Longer jump duration
  let cacti = []; // Array of cactus positions
  let score = 0;
  let highScore = await loadHighScore(); // Load high score from file
  let gameOver = false;
  let frameCount = 0;
  const baseFrameRate = 30; // Base frame rate (30 FPS)
  let speed = 1; // Speed multiplier (increases over time)

  // Ground texture (randomly generated)
  let groundTexture = Array(term.width).fill('').map(() => {
    const rand = Math.random();
    return rand < 0.2 ? '.' : rand < 0.4 ? ',' : rand < 0.6 ? '-' : '_';
  });
  let groundOffset = 0;

  // Parallax clouds (3 layers at different speeds)
  const clouds = [
    { x: 20, y: 3, speed: 0.2, symbol: '☁', color: 'gray' }, // Slowest, farthest
    { x: 40, y: 5, speed: 0.5, symbol: '☁', color: 'white' }, // Medium
    { x: 60, y: 7, speed: 0.8, symbol: '☁', color: 'brightWhite' } // Fastest, closest
  ];

  // Dino sprite using block characters (ANSI pixels)
  const dino = [
    '  ▓▓  ',
    '  ▓▓  ',
    '██▓▓██',
    '  ▓▓  ',
    '  ▓▓  ',
    ' ░ ░  '
  ];

  // Cactus sprite base (will vary in height)
  const cactusBase = [
    '  █  ',
    '  █  ',
    '███  ',
    '  █  ',
    '  █  '
  ];

  // Game loop
  const gameFrame = () => {
    // Clear the screen (unless game over)
    if ( gameOver ) return;
    term.clear();

    // Update speed (increases over time)
    speed = 1 + frameCount * 0.001; // Increase speed by 0.001 per frame

    // Update ground texture (scroll left, faster with speed)
    groundOffset = (groundOffset + speed) % term.width;
    const shiftedTexture = [...groundTexture.slice(Math.round(groundOffset)), ...groundTexture.slice(0, Math.round(groundOffset))];

    // Update Dino position (jumping logic)
    if (isJumping) {
      jumpFrame++;
      if (jumpFrame <= jumpDuration / 2) {
        // Going up
        dinoY = groundY - (jumpHeight * (jumpFrame / (jumpDuration / 2)));
      } else {
        // Going down
        dinoY = groundY - (jumpHeight * (1 - (jumpFrame - jumpDuration / 2) / (jumpDuration / 2)));
      }
      if (jumpFrame >= jumpDuration) {
        isJumping = false;
        jumpFrame = 0;
        dinoY = groundY;
      }
    }

    // Update clouds (parallax effect, scaled by speed)
    clouds.forEach(cloud => {
      cloud.x -= cloud.speed * speed;
      if (cloud.x < -5) cloud.x = term.width + 5; // Reset when off-screen
    });

    // Spawn cacti with random height and spacing
    if (frameCount % (Math.floor(Math.random() * 40) + 20) === 0) { // Random spacing (20-60 frames)
      const height = Math.floor(Math.random() * 5) + 3; // Random height (3-7 rows)
      const cactusSprite = cactusBase.slice(-height); // Take the bottom N rows
      cacti.push({ x: term.width - 1, sprite: cactusSprite });
    }

    // Update cactus positions (faster movement with speed)
    cacti = cacti.map(c => ({ x: c.x - 1.5 * speed, sprite: c.sprite })).filter(c => c.x >= -5);

    // Check for collisions
    const dinoX = 11; // Dino's fixed X position
    const dinoHeight = dino.length;
    const dinoBottom = dinoY;
    const dinoTop = dinoY - dinoHeight + 1;
    for (const cactus of cacti) {
      if (cactus.x >= dinoX && cactus.x <= dinoX + 4) { // Dino's width is roughly 4 characters
        if (dinoBottom >= groundY - cactus.sprite.length + 1) { // Dino is too low to clear the cactus
          clearInterval(gameLoop);
          saveHighScore(highScore); // Save high score
          soundProcess.send('gameOver'); // Trigger game over sound
          gameFrame(); // Draw the final frame
          gameOver = true;
          // Overlay "Game Over"
          term.moveTo(Math.floor(term.width / 2) - 5, Math.floor(term.height / 2));
          term.red('Game Over');
          term.moveTo(1, term.height - 1);
          term.white('Press R to restart, Q to quit');
          return;
        }
      }
    }

    // Increment score (based on distance run, scaled by speed)
    score += speed * 0.1; // Increment score by speed * 0.1 per frame
    highScore = Math.max(highScore, Math.floor(score));

    // Draw clouds (parallax layers)
    clouds.forEach(cloud => {
      term.moveTo(Math.round(cloud.x), cloud.y);
      colorMap[cloud.color](cloud.symbol);
    });

    // Draw the ground with texture
    term.moveTo(1, groundY + 1);
    term.gray(shiftedTexture.join(''));

    // Draw the Dino with blue and purple colors
    dino.forEach((line, index) => {
      term.moveTo(dinoX, Math.round(dinoY) - dino.length + 1 + index);
      const color = index % 2 === 0 ? colorMap.blue : colorMap.magenta; // Alternate blue and purple
      color(line);
    });

    // Draw cacti with green, dark green, and yellow colors
    cacti.forEach(c => {
      c.sprite.forEach((line, index) => {
        term.moveTo(Math.round(c.x), groundY - c.sprite.length + 1 + index);
        const colorName = index % 3 === 0 ? 'green' : index % 3 === 1 ? 'darkGreen' : 'yellow'; // Cycle through colors
        const color = colorMap[colorName];
        color(line);
      });
    });

    // Draw score (top-right, like Chrome Dino)
    term.moveTo(term.width - 20, 1);
    term.white(`HI ${highScore.toString().padStart(5, '0')} ${Math.floor(score).toString().padStart(5, '0')}`);

    frameCount++;
  };
  const gameLoop = setInterval(gameFrame, 1000 / baseFrameRate);

  // Handle input
  term.on('key', (key) => {
    if (gameOver) {
      if (key === 'r' || key === 'R') {
        // Restart the game
        term.clear();
        dinoGame();
      } else if (key === 'q' || key === 'Q' || key === 'CTRL_C') {
        // Quit
        soundProcess.kill(); // Clean up the sound process
        term.clear();
        term.processExit(0);
      }
      return;
    }

    if (key === ' ') { // Correct key name for space bar in terminal-kit
      if (!isJumping) {
        isJumping = true;
        jumpFrame = 0;
        soundProcess.send('jump'); // Trigger jump sound
      }
    }
  });
}

// Run the game
term.grabInput({ mouse: 'button' });
dinoGame().catch(err => {
  console.error('Error in Dino game:', err);
  term.clear();
  term.processExit(1);
});
