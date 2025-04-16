#!/usr/bin/env node

import os from 'os';
import { spawn } from 'child_process';
import {release} from './src/hard/application.js';

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
    await release();
  } catch(e) {
    console.log(error);
  }
  try {
    // Run the installation interactively
    await runStop(platform);
  } catch (error) {
    process.exit(1);
  }
}

//stop();

