#!/usr/bin/env node

// imports
  import { execSync, spawn } from 'child_process';
  import { join } from 'path';
  import { existsSync } from 'fs';

// Main script logic
  try { // to set NODE_EXTRA_CA_CERTS with mkcert CA root
    const caRoot = execSync('mkcert -CAROOT', { stdio: 'pipe' }).toString().trim();
    const CERT_FILE = 'rootCA.pem';
    const certPath = join(caRoot, CERT_FILE);
    if (existsSync(certPath)) {
      process.env.NODE_EXTRA_CA_CERTS = certPath;
      console.log(`Set NODE_EXTRA_CA_CERTS to ${certPath}`);
    } else {
      console.warn('mkcert CA root found but rootCA.pem missing. Self-signed certs may fail.');
    }
  } catch (error) {
    console.warn('mkcert not found or failed. If using self-signed certs, set NODE_EXTRA_CA_CERTS manually.');
  }

  // Spawn the main script with inherited stdio and passed args
  const mainScript = join(process.cwd(), 'baby-jaguar.js');
  const child = spawn('node', [mainScript, ...process.argv.slice(2)], {
    stdio: 'inherit',
    env: process.env,
  });

  child.on('error', (error) => {
    console.error(`Error: Failed to start main script - ${error.message}`);
    process.exit(1);
  });

  child.on('exit', (code) => {
    process.exit(code || 0);
  });
