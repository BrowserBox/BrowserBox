import termkit from 'terminal-kit';

const term = termkit.terminal;

async function dinoGame() {
  // Initialize terminal
  term.fullscreen(true);
  term.windowTitle('Dino Game');
  term.clear();

  // Game state
  const groundY = term.height - 5; // Move ground lower on the screen
  let dinoY = groundY; // Dino's vertical position (ground level)
  const jumpHeight = 8; // How high the Dino jumps (increased for more space)
  let isJumping = false;
  let jumpFrame = 0;
  const jumpDuration = 20; // Frames to complete a jump (up and down)
  let cacti = []; // Array of cactus positions
  let score = 0;
  let gameOver = false;
  let frameCount = 0;
  const frameRate = 20; // Frames per second (50ms per frame)

  // Dino sprite using block characters (ANSI pixels)
  const dino = [
    '  ▓▓  ',
    '  ▓▓  ',
    '██▓▓██',
    '  ▓▓  ',
    '  ▓▓  ',
    ' ░ ░  '
  ];

  // Cactus sprite using block characters
  const cactus = [
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

    // Spawn cacti
    if (frameCount % 50 === 0) { // Spawn a cactus every 50 frames
      cacti.push({ x: term.width - 1 });
    }

    // Update cactus positions
    cacti = cacti.map(c => ({ x: c.x - 1 })).filter(c => c.x >= 0);

    // Check for collisions
    const dinoX = 10; // Dino's fixed X position
    const dinoHeight = dino.length;
    const dinoBottom = dinoY;
    const dinoTop = dinoY - dinoHeight + 1;
    for (const cactus of cacti) {
      if (cactus.x >= dinoX && cactus.x <= dinoX + 4) { // Dino's width is roughly 4 characters
        if (dinoBottom >= groundY - 1) { // Dino is on the ground (not jumping high enough)
          gameOver = true;
          clearInterval(gameLoop);
          term.moveTo(1, term.height - 2);
          term.red(`Game Over! Score: ${score}`);
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
      }
    });

    // Draw the ground
    term.moveTo(1, groundY + 1);
    term.gray('─'.repeat(term.width));

    // Draw the Dino
    dino.forEach((line, index) => {
      term.moveTo(dinoX, Math.round(dinoY) - dino.length + 1 + index);
      term.green(line);
    });

    // Draw cacti
    cacti.forEach(c => {
      cactus.forEach((line, index) => {
        term.moveTo(c.x, groundY - cactus.length + 1 + index);
        term.red(line);
      });
    });

    // Draw score
    term.moveTo(1, 1);
    term.white(`Score: ${score}`);

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
        term.clear();
        term.processExit(0);
      }
      return;
    }

    if (key === ' ') { // Correct key name for space bar in terminal-kit
      if (!isJumping) {
        isJumping = true;
        jumpFrame = 0;
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
