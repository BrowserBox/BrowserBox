#!/usr/bin/env node
import { spawn } from 'child_process';

// Spawn megaditz.js as a detached process
const tuneProcess = spawn('node', ['megaditz.js'], {
  detached: true, // Run as a detached process
  stdio: 'ignore', // Ignore stdout/stderr
  windowsHide: true // Hide the window (no effect on macOS, but included for cross-platform)
});

// Detach the process so it runs independently
tuneProcess.unref();

//console.log('Spawned megaditz.js to play the ditzy tune');
