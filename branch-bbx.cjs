#!/usr/bin/env node

const { spawn } = require('child_process');
const os = require('os');

console.log('Installing BrowserBox CLI (`bbx`)...');

/**
 * Runs the installation command interactively for the given platform.
 * @param {string} platform - The OS platform ('win32', 'linux', 'darwin', etc.)
 * @returns {Promise<void>} - Resolves on success, rejects on failure
 */
function runInstallation(platform) {
  let shell, args;

  if (platform === 'win32') {
    // Windows: Use PowerShell
    shell = 'powershell.exe';
    args = ['-Command', 'irm bbx.dosaygo.com | iex'];
  } else {
    // Linux/macOS: Use Bash
    shell = '/bin/bash';
    args = ['-c', 'bash <(curl -sSL bbx.sh.dosaygo.com) install'];
  }

  return new Promise((resolve, reject) => {
    const child = spawn(shell, args, { stdio: 'inherit' });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Installation failed with exit code ${code}`));
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Main function to install BrowserBox and provide next steps.
 */
async function installBrowserBox() {
  const platform = os.platform();
  console.log(`Detected OS: ${platform}`);

  try {
    // Run the installation interactively
    await runInstallation(platform);
    console.log('\nBrowserBox CLI (`bbx`) installed successfully!');

    // Provide platform-specific next steps
    if (platform === 'win32') {
      console.log('### Next Steps for Windows:');
      console.log('1. Purchase a license at https://dosaygo.com');
      console.log('2. Receive your API key via email after purchase (Note: `bbx activate` is not available on Windows)');
      console.log('3. Run with: bbx setup && bbx run');
    } else {
      console.log('### Next Steps for Linux/macOS:');
      console.log('1. Purchase a license at https://dosaygo.com');
      console.log('2. Activate with: bbx activate [seats]');
      console.log('3. Run with: bbx setup && bbx run');
    }
  } catch (error) {
    console.error(`\nInstallation failed: ${error.message}`);
    console.error('Please try installing manually or contact support@dosaygo.com');
    process.exit(1);
  }
}

// Execute the installation
installBrowserBox();
