#!/usr/bin/env node

import os from 'os';
import { spawn } from 'child_process';

console.log('Stopping BrowserBox...');

/**
 * Runs the installation command interactively for the given platform.
 * @param {string} platform - The OS platform ('win32', 'linux', 'darwin', etc.)
 * @returns {Promise<void>} - Resolves on success, rejects on failure
 */
function runStop(platform) {
  let shell, args;

  if (platform === 'win32') {
    // Windows: Use PowerShell
    shell = 'powershell.exe';
    args = ['-Command', 'bbx stop'];
  } else {
    // Linux/macOS: Use Bash
    shell = '/bin/bash';
    args = ['-c', 'bbx stop'];
  }

  return new Promise((resolve, reject) => {
    const child = spawn(shell, args, { stdio: 'ignore', detached: true, windowsHide: true });
    child.unref();
    child.on('error', () => {console.warn('Error stopping'); resolve(process.exit(1));});
  });
}

/**
 * Main function to install BrowserBox and provide next steps.
 */
export async function stop() {
  const platform = os.platform();
  console.log(`Detected OS: ${platform}`);

  try {
    // Run the installation interactively
    await runStop(platform);
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
    process.exit(1);
  }
}

//stop();

