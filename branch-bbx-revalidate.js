#!/usr/bin/env node

import os from 'os';
import { spawnSync } from 'child_process';

console.log('Revalidating BrowserBox ticket...');

/**
 * Runs the revalidation command interactively for the given platform.
 * @param {string} platform - The OS platform ('win32', 'linux', 'darwin', etc.)
 * @returns {Promise<void>} - Resolves on success, rejects on failure
 */
function runRevalidate(platform) {
  let shell, args;

  if (platform === 'win32') {
    // Windows: Use PowerShell
    shell = 'powershell.exe';
    args = ['-Command', 'bbx revalidate'];
  } else {
    // Linux/macOS: Use Bash
    shell = '/bin/bash';
    args = ['-c', 'bbrevalidate'];
  }

  const { output, status } = spawnSync(shell, args, { stdio: 'inherit', detached: false, windowsHide: true });
  if ( Number.isNaN(status) || status === null || parseInt(status) > 0 ) {
    throw new Error(`Revalidate failed`, JSON.stringify({output, status}));
  }
  return { errored: false };
}

/**
 * Main function to revalidate BrowserBox ticket in case of staleness.
 */
export async function revalidate() {
  const platform = os.platform();
  console.log(`Detected OS: ${platform}`);

  return runRevalidate(platform);
}

