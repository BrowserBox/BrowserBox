#!/usr/bin/env node

const { exec } = require('child_process');
const os = require('os');

console.log('Installing BrowserBox CLI (`bbx`)...');

// Function to execute shell commands and handle output
function runCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${stderr}`);
        reject(error);
        return;
      }
      console.log(stdout);
      resolve(stdout);
    });
  });
}

// Detect the operating system and run the appropriate install command
async function installBrowserBox() {
  const platform = os.platform();

  try {
    if (platform === 'win32') {
      // Windows installation
      console.log('Detected Windows OS. Running PowerShell command...');
      await runCommand('irm bbx.dosaygo.com | iex');
      console.log('BrowserBox CLI (`bbx`) installed successfully!');
      console.log('Next steps for Windows:');
      console.log('1. Purchase a license at https://dosaygo.com');
      console.log('2. Receive your API key via email after purchase (Note: `bbx activate` is not available on Windows)');
      console.log('3. Run with: bbx setup && bbx run');
    } else {
      // Linux, macOS, or other Unix-like systems
      console.log('Detected Unix-like OS (Linux/macOS). Running bash command...');
      await runCommand('bash <(curl -sSL bbx.sh.dosaygo.com) install');
      console.log('BrowserBox CLI (`bbx`) installed successfully!');
      console.log('Next steps for Linux/macOS:');
      console.log('1. Purchase a license at https://dosaygo.com');
      console.log('2. Activate with: bbx activate [seats]');
      console.log('3. Run with: bbx setup && bbx run');
    }
  } catch (error) {
    console.error('Installation failed. Please try manually or contact support@dosaygo.com');
    process.exit(1);
  }
}

// Run the installation
installBrowserBox();
