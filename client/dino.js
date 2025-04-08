import termkit from 'terminal-kit';
import { spawn } from 'child_process';

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

async function dinoGame() {
  // Initialize terminal
  //term.fullscreen(true);
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
  let highScore = 0;
  let gameOver = false;
  let frameCount = 0;
  const frameRate = 30; // 30 FPS

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
    // Clear the screen
    if ( !gameOver ) term.clear();

    // Update ground texture (scroll left)
    groundOffset = (groundOffset + 1) % term.width;
    const shiftedTexture = [...groundTexture.slice(groundOffset), ...groundTexture.slice(0, groundOffset)];

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

    // Update clouds (parallax effect)
    clouds.forEach(cloud => {
      cloud.x -= cloud.speed;
      if (cloud.x < -5) cloud.x = term.width + 5; // Reset when off-screen
    });

    // Spawn cacti with random height and spacing
    if (frameCount % (Math.floor(Math.random() * 40) + 20) === 0) { // Random spacing (20-60 frames)
      const height = Math.floor(Math.random() * 5) + 3; // Random height (3-7 rows)
      const cactusSprite = cactusBase.slice(-height); // Take the bottom N rows
      cacti.push({ x: term.width - 1, sprite: cactusSprite });
    }

    // Update cactus positions (faster movement)
    cacti = cacti.map(c => ({ x: c.x - 1.5, sprite: c.sprite })).filter(c => c.x >= -5);

    // Check for collisions
    const dinoX = 11; // Dino's fixed X position
    const dinoHeight = dino.length;
    const dinoBottom = dinoY;
    const dinoTop = dinoY - dinoHeight + 1;
    for (const cactus of cacti) {
      if (cactus.x >= dinoX && cactus.x <= dinoX + 4) { // Dino's width is roughly 4 characters
        if (dinoBottom >= groundY - cactus.sprite.length + 1) { // Dino is too low to clear the cactus
          gameOver = true;
          clearInterval(gameLoop);
          soundProcess.send('gameOver'); // Trigger game over sound
          gameFrame();
          // Don't clear the screen, just overlay "Game Over"
          term.moveTo(Math.floor(term.width / 2) - 5, Math.floor(term.height / 2));
          term.red('Game Over');
          term.moveTo(1, term.height - 1);
          term.white('Press R to restart, Q to quit');
          return;
        }
      }
    }

    // Increment score
    cacti.forEach(c => {
      if (c.x <= dinoX - 1 && c.x > dinoX - 2) { // Cactus just passed the Dino
        score++;
        highScore = Math.max(highScore, score);
      }
    });

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
    term.white(`HI ${highScore.toString().padStart(5, '0')} ${score.toString().padStart(5, '0')}`);

    frameCount++;
  };
  const gameLoop = setInterval(gameFrame, 1000 / frameRate);

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
  //term.clear();
  term.processExit(1);
});
