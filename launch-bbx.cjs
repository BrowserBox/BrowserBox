#!/usr/bin/env node
const { platform } = require('os');
const { execSync } = require('child_process');
const path = require('path');

const bashScript = path.join(__dirname, 'bbx.sh');
const bootstrapScript = path.join(__dirname, 'bootstrap.ps1');
const args = process.argv.slice(2).join(' ');

try {
    if (platform() === 'win32') {
        // Windows: Run the bootstrap script in PowerShell 5.1
        execSync(`powershell -File "${bootstrapScript}" ${args}`, { stdio: 'inherit' });
    } else {
        // Unix-like: Run the Bash script
        execSync(`bash "${bashScript}" ${args}`, { stdio: 'inherit' });
    }
} catch (error) {
    process.exit(1);
}
