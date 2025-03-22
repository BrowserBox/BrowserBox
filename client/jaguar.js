#!/usr/bin/env node

import { execSync, spawn } from 'child_process';
import { join } from 'path';
import { existsSync } from 'fs';

// Try to set NODE_EXTRA_CA_CERTS with mkcert CA root
try {
  const caRoot = execSync('mkcert -CAROOT', { stdio: 'pipe' }).toString().trim();
  const certPath = join(caRoot, 'rootCA.pem');
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
  env: { ...process.env },
});

child.on('error', (error) => {
  console.error(`Failed to start main script: ${error.message}`);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
