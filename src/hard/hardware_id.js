import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';
import { HOME_DIR } from './config.js';

// Function to compute a hash from the stringified data
function computeHash(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

// Function to read SSH host keys
function readSshHostKeys() {
  const sshKeyPaths = [
    '/etc/ssh/ssh_host_dsa_key.pub',
    '/etc/ssh/ssh_host_ecdsa_key.pub',
    '/etc/ssh/ssh_host_ed25519_key.pub',
    '/etc/ssh/ssh_host_rsa_key.pub'
  ];
  let sshKeys = '';

  sshKeyPaths.forEach((keyPath) => {
    if (fs.existsSync(keyPath)) {
      sshKeys += fs.readFileSync(keyPath, 'utf8').toString().replace(/\s+/g, '').trim();
    }
  });

  return sshKeys;
}

// Function to generate a hardware ID
export function generateHardwareId() {
  const reportPath = path.join(HOME_DIR, `report-${Date.now()}.json`);

  // Generate a diagnostic report and save it to a file
  process.report.writeReport(`${reportPath}`);

  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

  // Extract relevant information
  const osName = report.header.osName || '';
  const osRelease = report.header.osRelease || '';
  const osVersion = report.header.osVersion || '';
  const osMachine = report.header.osMachine || '';
  const host = report.header.host || '';
  const cpus = report.header.cpus
    ? report.header.cpus.map(cpu => `${cpu.model}-${cpu.speed}`).join(';')
    : '';
  const networkInterfaces = report.header.networkInterfaces
    ? report.header.networkInterfaces
        .filter(iface => !iface.internal && iface.mac !== '00:00:00:00:00:00')
        .map(iface => iface.mac)
        .join(';')
    : '';
  const totalMemory = report.resourceUsage?.total_memory || '';

  // Read SSH host keys
  const sshHostKeys = readSshHostKeys();

  // Combine the extracted information and SSH host keys
  const combinedInfo = `${host}-${osName}-${osRelease}-${osVersion}-${osMachine}-${cpus}-${networkInterfaces}-${totalMemory}-${sshHostKeys}`;
  //console.error(`fingerprint data: ${combinedInfo}`);

  // Compute and return the hardware ID
  fs.unlinkSync(reportPath);
  return computeHash(combinedInfo);
}

if ( import.meta.url.endsWith(process.argv[1]) ) {
  console.log('instance', generateHardwareId());
}



