import termkit from 'terminal-kit';
import { spawn } from 'child_process';

const term = termkit.terminal;

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
  const jumpHeight = 12; // Higher jump (was 8)
  let isJumping = false;
  let jumpFrame = 0;
  const jumpDuration = 20; // Frames to complete a jump (up and down)
  let cacti = []; // Array of cactus positions
  let score = 0;
  let highScore = 0;
  let gameOver = false;
  let frameCount = 0;
  const frameRate = 20; // Frames per second (50ms per frame)

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
  const gameLoop = setInterval(() => {
    if (gameOver) return;

    // Clear the screen
    term.clear();

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
    if (frameCount % (Math.floor(Math.random() * 40) + 30) === 0) { // Random spacing (30-70 frames)
      const height = Math.floor(Math.random() * 5) + 3; // Random height (3-7 rows)
      const cactusSprite = cactusBase.slice(-height); // Take the bottom N rows
      cacti.push({ x: term.width - 1, sprite: cactusSprite });
    }

    // Update cactus positions
    cacti = cacti.map(c => ({ x: c.x - 1, sprite: c.sprite })).filter(c => c.x >= -5);

    // Check for collisions
    const dinoX = 10; // Dino's fixed X position
    const dinoHeight = dino.length;
    const dinoBottom = dinoY;
    const dinoTop = dinoY - dinoHeight + 1;
    for (const cactus of cacti) {
      if (cactus.x >= dinoX && cactus.x <= dinoX + 4) { // Dino's width is roughly 4 characters
        if (dinoBottom >= groundY - cactus.sprite.length + 1) { // Dino is too low to clear the cactus
          gameOver = true;
          clearInterval(gameLoop);
          soundProcess.send('gameOver'); // Trigger game over sound
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
      if (c.x === dinoX - 1) { // Cactus just passed the Dino
        score++;
        highScore = Math.max(highScore, score);
      }
    });

    // Draw clouds (parallax layers)
    clouds.forEach(cloud => {
      term.moveTo(Math.round(cloud.x), cloud.y);
      term[cloud.color](cloud.symbol);
    });

    // Draw the ground with texture
    term.moveTo(1, groundY + 1);
    term.gray(shiftedTexture.join(''));

    // Draw the Dino
    dino.forEach((line, index) => {
      term.moveTo(dinoX, Math.round(dinoY) - dino.length + 1 + index);
      term.green(line);
    });

    // Draw cacti
    cacti.forEach(c => {
      c.sprite.forEach((line, index) => {
        term.moveTo(c.x, groundY - c.sprite.length + 1 + index);
        term.red(line);
      });
    });

    // Draw score (top-right, like Chrome Dino)
    term.moveTo(term.width - 20, 1);
    term.white(`HI ${highScore.toString().padStart(5, '0')} ${score.toString().padStart(5, '0')}`);

    frameCount++;
  }, 1000 / frameRate);

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
