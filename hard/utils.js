// utils.js

import fs from 'fs';
import crypto from 'crypto';
import path from 'path';
import { generateHardwareId } from './hardware_id.js';

// Polyfill for __dirname in ESM
import { fileURLToPath } from 'url';
export const __filename = () => fileURLToPath(import.meta.url);
export const __dirname = () => path.dirname(__filename());

export { generateHardwareId };

export const sleep = ms => new Promise(res => setTimeout(res, ms));

export function log(component, message) {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] [${component}] ${message}`);
}

export function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8').trim();
}

export function writeFile(filePath, data) {
  fs.writeFileSync(filePath, data, 'utf8');
}

export function generateKeyPair() {
  return crypto.generateKeyPairSync('rsa', {
    modulusLength: 4096,
  });
}

export function signData(data, privateKeyPath) {
  const privateKey = readFile(privateKeyPath);
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(data);
  sign.end();
  return sign.sign(privateKey);
}

export function verifySignature(data, signature, publicKeyPath) {
  const publicKey = readFile(publicKeyPath);
  const verify = crypto.createVerify('RSA-SHA256');
  verify.update(data);
  verify.end();
  return verify.verify(publicKey, signature);
}

export function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export function getServerDomainFromCert(certPath) {
  try {
    // Read the certificate file
    const cert = fs.readFileSync(certPath, 'utf8');

    // Parse the certificate
    const certificate = new crypto.X509Certificate(cert);

    // Extract the CN (Common Name) from the subject if available
    const subjectCN = certificate.subject
      .split(',')
      .find((part) => part.trim().startsWith('CN='))
      ?.split('=')[1]
      ?.trim();

    // Extract Subject Alternative Names (SANs)
    const subjectAltName = certificate.subjectAltName;
    const altNames = subjectAltName
      ? subjectAltName
          .split(',')
          .filter((entry) => entry.trim().startsWith('DNS:'))
          .map((entry) => entry.split(':')[1].trim())
      : [];

    // Determine which to use: CN or the first SAN entry
    const serverDomain = subjectCN || altNames[0] || null;

    // Get the CN (Common Name) from the subject
    const domain = serverDomain;

    log('Utils', `Domain Name (CN) from the certificate: ${domain}`);
    return domain;
  } catch (error) {
    console.error('Failed to read or parse the certificate:', error.message);
    return null;
  }
}

/**
 * Converts a string pattern with :id to a RegExp object.
 * @param {string} pattern - The string pattern (e.g., "GET::/stadiums/:id").
 * @returns {RegExp} - The corresponding RegExp object.
 */
export function convertPatternToRegex(pattern) {
  // Escape special regex characters except for ':'
  const escapedPattern = pattern.replace(/([.+?^=!${}()|[\]/\\])/g, '\\$1');

  // Replace ':id' with a regex pattern to match an ID (e.g., one or more non-slash characters)
  const regexString = `${escapedPattern.replace(/:id/g, '[^/]+')}`;

  return new RegExp(regexString);
}

/**
 * Combines a set of RegExp objects into a single RegExp using OR.
 * @param {Set<RegExp>} regexSet - A set of RegExp objects.
 * @returns {RegExp} - A combined RegExp object.
 */
export function combineRegexSet(regexSet) {
  const combinedPattern = [...regexSet]
    .map(regex => regex.source) // Extract the pattern string from each RegExp
    .join('|'); // Join them with the OR operator

  return new RegExp(`^(?:${combinedPattern})$`);
}


