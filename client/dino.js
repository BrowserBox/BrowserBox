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

export async function dinoGame(onExit, {noCap = true} = {}) {
  // Initialize terminal
  term.fullscreen(true);
  term.windowTitle('Dino Game');
  term.clear();

  if (!noCap) {
    term.grabInput({ mouse: 'button' });
  }

  // Spawn boop.js for sound effects
  const soundProcess = spawn('node', ['boop.js'], {
    detached: true,
    stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
    windowsHide: true
  });
  soundProcess.unref();

  // Game state
  const groundY = term.height - 5;
  let dinoY = groundY;
  const jumpHeight = 15;
  const superJumpHeight = jumpHeight * 2;
  let isJumping = false;
  let isFalling = false;
  let jumpFrame = 0;
  let jumpStartY = groundY;
  let currentJumpHeight = jumpHeight;
  let currentJumpDuration = 24;
  const jumpDuration = 24;
  const superJumpDuration = 32;
  const fallSpeed = 1;
  let hasSuperJumped = false;
  let cacti = [];
  let score = 0;
  let highScore = await loadHighScore();
  let gameOver = false;
  let frameCount = 0;
  const baseFrameRate = 30;
  let speed = 1;
  let dinoFrameIndex = 0; // For sprite animation
  const animationSpeed = 3; // Switch frames every 5 ticks

  // Ground texture
  let groundTexture = Array(term.width).fill('').map(() => {
    const rand = Math.random();
    return rand < 0.2 ? '.' : rand < 0.4 ? ',' : rand < 0.6 ? '-' : '_';
  });
  let groundOffset = 0;

  // Parallax clouds
  const clouds = [
    { x: 20, y: 3, speed: 0.2, symbol: '☁', color: 'gray' },
    { x: 40, y: 5, speed: 0.5, symbol: '☁', color: 'white' },
    { x: 60, y: 7, speed: 0.8, symbol: '☁', color: 'brightWhite' }
  ];

  // Dino sprite with animation frames
  const dinoFrames = [
    // Frame 1: Forward leg stride
    [
      '  ○▓  ', // Head with eye
      '  ▓*  ', // Scale detail
      '██▓▓█ ', // Sleek body
      '  ▓   ',
      ' ▒    ', // Back leg forward
      '   ░  '  // Front leg extended
    ],
    // Frame 2: Backward leg stride
    [
      '  ○▓  ',
      '  ▓*  ',
      '██▓▓█ ',
      '  ▓   ',
      '   ▒  ', // Back leg back
      ' ░    '  // Front leg retracted
    ],
    // Frame 3: Mid-stride
    [
      '  ○▓  ',
      '  ▓*  ',
      '██▓▓█ ',
      '  ▓   ',
      ' ▒ ▒  ', // Legs even
      '      '  // Clean ground
    ]
  ];

  // Cactus sprite base
  const cactusBase = [
    '  █  ',
    '  █  ',
    '███  ',
    '  █  ',
    '  █  '
  ];

  // Game loop
  const gameFrame = () => {
    if (gameOver) return;
    term.clear();

    speed = 1 + frameCount * 0.001;

    groundOffset = (groundOffset + speed) % term.width;
    const shiftedTexture = [...groundTexture.slice(Math.round(groundOffset)), ...groundTexture.slice(0, Math.round(groundOffset))];

    // Update Dino position
    if (isJumping) {
      let progress = jumpFrame / currentJumpDuration;
      let height = 4 * currentJumpHeight * progress * (1 - progress);
      dinoY = Math.max(1, jumpStartY - height);
      jumpFrame++;
      if (jumpFrame >= currentJumpDuration) {
        isJumping = false;
        if (dinoY > groundY) {
          isFalling = true;
        } else {
          dinoY = groundY;
          currentJumpHeight = jumpHeight;
          currentJumpDuration = jumpDuration;
          hasSuperJumped = false;
        }
      }
    } else if (isFalling) {
      dinoY += fallSpeed * speed;
      if (dinoY >= groundY) {
        dinoY = groundY;
        isFalling = false;
        currentJumpHeight = jumpHeight;
        currentJumpDuration = jumpDuration;
        hasSuperJumped = false;
      }
    }

    // Update clouds
    clouds.forEach(cloud => {
      cloud.x -= cloud.speed * speed;
      if (cloud.x < -5) cloud.x = term.width + 5;
    });

    // Spawn cacti
    if (frameCount % (Math.floor(Math.random() * 40) + 20) === 0) {
      const height = Math.floor(Math.random() * 5) + 3;
      const cactusSprite = cactusBase.slice(-height);
      cacti.push({ x: term.width - 1, sprite: cactusSprite });
    }

    // Update cacti
    cacti = cacti.map(c => ({ x: c.x - 1.5 * speed, sprite: c.sprite })).filter(c => c.x >= -5);

    // Collision detection
    const dinoX = 11;
    const dinoHeight = dinoFrames[0].length;
    const dinoBottom = dinoY;
    for (const cactus of cacti) {
      if (cactus.x >= dinoX && cactus.x <= dinoX + 4) {
        if (dinoBottom >= groundY - cactus.sprite.length + 1) {
          clearInterval(gameLoop);
          saveHighScore(highScore);
          soundProcess.send('gameOver');
          gameFrame();
          gameOver = true;
          term.moveTo(Math.floor(term.width / 2) - 5, Math.floor(term.height / 2));
          term.red('Game Over');
          term.moveTo(1, term.height - 1);
          term.white('Press R to restart, Q to quit');
          return;
        }
      }
    }

    score += speed * 0.1;
    highScore = Math.max(highScore, Math.floor(score));

    // Drawing
    clouds.forEach(cloud => {
      term.moveTo(Math.round(cloud.x), cloud.y);
      colorMap[cloud.color](cloud.symbol);
    });

    term.moveTo(1, groundY + 1);
    term.gray(shiftedTexture.join(''));

    const currentDino = dinoFrames[dinoFrameIndex];
    currentDino.forEach((line, index) => {
      term.moveTo(dinoX, Math.round(dinoY) - currentDino.length + 1 + index);
      const color = index % 2 === 0 ? colorMap.blue : colorMap.magenta;
      color(line);
    });

    cacti.forEach(c => {
      c.sprite.forEach((line, index) => {
        term.moveTo(Math.round(c.x), groundY - c.sprite.length + 1 + index);
        const colorName = index % 3 === 0 ? 'green' : index % 3 === 1 ? 'darkGreen' : 'yellow';
        colorMap[colorName](line);
      });
    });

    term.moveTo(term.width - 20, 1);
    term.white(`HI ${highScore.toString().padStart(5, '0')} ${Math.floor(score).toString().padStart(5, '0')}`);

    // Update animation frame
    if (!isJumping && !isFalling) {
      if (frameCount % animationSpeed === 0) {
        dinoFrameIndex = (dinoFrameIndex + 1) % dinoFrames.length;
      }
    } else {
      dinoFrameIndex = 2; // Mid-stride for jumping
    }

    frameCount++;
  };
  const gameLoop = setInterval(gameFrame, 1000 / baseFrameRate);

  // Handle input
  return new Promise(resolve => {
    term.on('key', (key) => {
      if (gameOver) {
        if (key === 'r' || key === 'R') {
          // Restart the game
          term.clear();
          resolve(dinoGame(onExit));
        } else if (key === 'q' || key === 'Q' || key === 'CTRL_C') {
          // Quit and return to browser
          soundProcess.kill();
          clearInterval(gameLoop);
          term.clear();
          term.off('key'); // Remove game-specific key handler
          if (onExit) onExit();
          resolve();
        }
        return;
      }

      if (key === ' ') {
        if (!isJumping && !isFalling) {
          isJumping = true;
          jumpFrame = 0;
          currentJumpHeight = jumpHeight;
          currentJumpDuration = jumpDuration;
          jumpStartY = groundY;
          soundProcess.send('jump');
        } else if (isJumping && !hasSuperJumped) {
          isJumping = true;
          jumpFrame = 0;
          currentJumpHeight = superJumpHeight;
          currentJumpDuration = superJumpDuration;
          jumpStartY = dinoY;
          hasSuperJumped = true;
          soundProcess.send('jump');
        }
      }
    });
  });
}

//dinoGame(() => process.exit(0), {noCap: false});
