// hardenedApplication.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import https from 'https';
import { exec } from 'child_process';
import { PKI } from './pki.js';
import { readFile, log } from './utils.js';
import { generateHardwareId } from './hardware_id.js';
import { DEBUG, TICKET_DIR, DIST_DIR, DISTRIBUTION_SERVER_URL } from './config.js';
import { rainstormHash } from '@dosyago/rainsum';
import { revalidate } from './../../branch-bbx-revalidate.js'
import { sleep } from './../common.js';

export const __filename = () => fileURLToPath(import.meta.url);
export const __dirname = () => path.dirname(__filename());
const MAX_REVALIDATE_RETRIES = 2;

/**
 * HardenedApplication class encapsulates application integrity and license management.
 * This version uses ESNext private fields, allowing a raw in-memory private key if desired.
 */
export class HardenedApplication {
  // Private fields
  #appDir;
  #privateKeyPath;
  #privateKeyPem;
  #ignorePatterns;
  #certificatePath;
  #licenseServerUrl;
  #apiVersion;
  #instanceId;
  #pki;

  /**
   * Constructs a new HardenedApplication instance.
   * @param {Object} options - Configuration options.
   * @param {string} options.appDir - Directory containing application files.
   * @param {string} [options.privateKeyPath] - Path to the private key for signing (if file-based).
   * @param {string} [options.privateKeyPem] - In-memory PEM string of the private key (if db-based).
   * @param {Array<string>} [options.ignorePatterns] - Patterns to ignore during file scanning.
   * @param {string} [options.certificatePath] - Path to the license certificate.
   * @param {string} [options.licenseServerUrl] - URL of the license server.
   * @param {string} [options.apiVersion] - API version for the license server.
   */
  constructor(options = {}) {
    const {
      appDir,
      privateKeyPath = null,
      privateKeyPem = null,
      ignorePatterns = [
        'version.json',
        'package.json',
        '.bang.html.snapshot',
        '~',
        'README.txt',
        'README.md',
        'core',
        'nohup.out',
        'src/public/assets/ruffle',
        '.bbpro_install_dir',
        '.DS_Store',
        'node_modules',
        'package-lock.json',
        '.git/',
        '.sig',
        '.swp',
        '.log',
        'login_link.txt',
        'timechain_proof.json',
        'tickets.json',
        'ticket.json',
        'manifest.txt',
        'manifest.txt.sig',
        'certificate.json',
        'certificates.json',
        'src/public/voodoo/assets/icons'
      ],
      certificatePath = null,
      licenseServerUrl = null,
      apiVersion = 'v1',
    } = options;

    if (!appDir) {
      throw new Error('appDir is required.');
    }

    this.#appDir = path.resolve(appDir);
    this.#privateKeyPath = privateKeyPath;      // If file-based
    this.#privateKeyPem = privateKeyPem;        // If in-memory
    this.#ignorePatterns = ignorePatterns;
    this.#certificatePath = certificatePath;
    this.#licenseServerUrl = licenseServerUrl;
    this.#apiVersion = apiVersion;
    this.#instanceId = this.#generateInstanceId();

    this.#pki = new PKI();
  }

  /**
   * Generates a unique INSTANCE_ID for each application run.
   * @returns {string} - A unique hexadecimal string.
   */
  #generateInstanceId() {
    return `DOSAYGO://browserbox/${generateHardwareId().hwid}/${crypto.randomBytes(16).toString('hex')}`;
  }

  /**
   * Create a manifest of all included files and sign it with the provided private key (file-based or memory-based).
   */
  async createManifestAndSign() {
    const privateKey = this.#getSigningKey();
    if (!privateKey) {
      throw new Error('No private key available for signing.');
    }

    const manifestPath = path.join(__dirname(), 'manifest.txt');

    // Gather file hashes
    const entries = await this.#hashAllFiles();
    // Write manifest
    const manifestContent = entries.map(e => `${e.hash} ${e.relativePath}`).join('\n');
    fs.writeFileSync(manifestPath, manifestContent, 'utf-8');
    console.log({manifestContent});

    // Sign the manifest
    const signature = this.#signData(Buffer.from(manifestContent, 'utf-8'), privateKey);
    fs.writeFileSync(manifestPath + '.sig', signature.toString('hex'), 'utf-8');

    console.log('Manifest created and signed successfully.');
  }

  /**
   * Verify the manifest and ensure all files match their recorded hashes.
   * Also verify the signature of the manifest against the root public key from the distribution server.
   */
  async verifyManifest() {
    // Fetch the root public key from the distribution server
    const response = await fetchWithTimeoutAndRetry(`${DISTRIBUTION_SERVER_URL}/keys/root`, {
      method: 'GET',
      agent: new https.Agent({ rejectUnauthorized: true })
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch root public key: ${response.status}`);
    }

    const { key: publicKey } = await response.json();
    if (!publicKey) {
      throw new Error('Received empty public key from server');
    }

    const manifestPath = path.join(__dirname(), 'manifest.txt');
    const sigPath = manifestPath + '.sig';

    if (!fs.existsSync(manifestPath) || !fs.existsSync(sigPath)) {
      throw new Error('Manifest or signature file missing.');
    }

    const manifestContent = fs.readFileSync(manifestPath, 'utf-8').trim();
    const manifestSignature = Buffer.from(fs.readFileSync(sigPath, 'utf-8'), 'hex');

    // Verify the manifest signature first
    const isManifestValid = this.#verifySignature(
      Buffer.from(manifestContent, 'utf-8'),
      manifestSignature,
      publicKey
    );
    if (!isManifestValid) {
      throw new Error('Manifest signature verification failed.');
    }

    // Now, re-hash all files and compare with manifest
    const currentEntries = await this.#hashAllFiles();
    const currentContent = currentEntries.map(e => `${e.hash} ${e.relativePath}`).join('\n');

    if (currentContent.trim() !== manifestContent.trim()) {
      // If they differ, either a file changed or something is tampered
      try { 
        fs.writeFileSync(path.resolve(TICKET_DIR, 'calculated-manifest.txt'), currentContent.trim());
      } catch(e) {
        console.warn(`Could not write calculated manifest.`, e);
      }
      throw new Error('Current file hashes do not match the manifest.');
    }

    console.log('Manifest verified successfully. All files match and signature is valid.');
    return true;
  }

  /**
   * Hash all files except ignored patterns using rainstormHash(256)
   * Returns an array of {relativePath, hash}
   */
  async #hashAllFiles() {
    const files = [];
    this.#walkDir(this.#appDir, (filePath) => {
      files.push(filePath);
    });

    const results = [];
    for (const f of files) {
      const data = fs.readFileSync(f);
      const hash = await rainstormHash(256, 0, data);
      const relativePath = path.relative(this.#appDir, f).replace(/\\/g, '/');
      results.push({ relativePath, hash });
    }

    // Sort entries to ensure consistent ordering
    results.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
    return results;
  }

  /**
   * Recursively walks through a directory and executes a callback on each file.
   * @param {string} dir - Directory path.
   * @param {Function} callback - Function to execute on each file.
   */
  #walkDir(dir, callback) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const relativePath = path.relative(this.#appDir, fullPath).replace(/\\/g, '/');

      // Skip ignored patterns
      if (this.#shouldIgnore(relativePath)) {
        continue;
      } else {
        process.env.BBX_VERBOSE_DEBUG && console.log(`Including ${relativePath} / (${fullPath}) in manifest.`);
      }

      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        this.#walkDir(fullPath, callback);
      } else if (stat.isFile()) {
        callback(fullPath);
      }
    }
  }

  /**
   * Determines whether a file should be ignored based on the ignore patterns.
   * @param {string} relativePath - The relative path of the file.
   * @returns {boolean} - True if the file should be ignored, false otherwise.
   */
  #shouldIgnore(relativePath) {
    for (const pattern of this.#ignorePatterns) {
      if (this.#matchPattern(relativePath, pattern)) {
        process.env.BBX_VERBOSE_DEBUG && console.log(`Ignoring ${relativePath} based on ${pattern}`);
        return true;
      }
    }
    return false;
  }

  /**
   * Simple pattern matching function (supports '*' wildcard).
   * @param {string} text - The text to match.
   * @param {string} pattern - The pattern to match against.
   * @returns {boolean} - True if the pattern matches the text, false otherwise.
   */
  #matchPattern(text, pattern) {
    const escapedPattern = pattern
      .replace(/[-\/\\^$+?.()|[\]{}]/g, '\\$&')
      .replace(/\*/g, '.*');
    const regex = new RegExp(`${escapedPattern}`, 'i');
    return regex.test(text);
  }

  /**
   * Signs data using the provided private key.
   * @param {Buffer|string} data - The data to sign.
   * @param {string} privateKey - The PEM-formatted private key.
   * @returns {Buffer} - The signature.
   */
  #signData(data, privateKey) {
    const sign = crypto.createSign('SHA256');
    sign.update(data);
    sign.end();
    return sign.sign(privateKey);
  }

  /**
   * Verifies the signature of the data using the provided public key.
   * @param {Buffer|string} data - The original data.
   * @param {Buffer|string} signature - The signature.
   * @param {string} publicKey - The PEM-formatted public key.
   * @returns {boolean} - True if the signature is valid, false otherwise.
   */
  #verifySignature(data, signature, publicKey) {
    const verify = crypto.createVerify('SHA256');
    verify.update(data);
    verify.end();
    return verify.verify(publicKey, signature);
  }

  /**
   * Retrieve the signing key from memory or file, whichever is set.
   * @returns {string|null} - The PEM-formatted private key or null if not found.
   */
  #getSigningKey() {
    if (this.#privateKeyPem) {
      return this.#privateKeyPem;       // In-memory key
    }
    if (this.#privateKeyPath && fs.existsSync(this.#privateKeyPath)) {
      return fs.readFileSync(this.#privateKeyPath, 'utf8'); // File-based key
    }
    return null;
  }

  /**
   * Checks the license by performing local PKI validation and communicating with the license server.
   * @throws Will throw an error if license validation fails.
   */
  async checkLicense({targets, integrity} = {}) {
    try {
      if (!this.#certificatePath || !this.#licenseServerUrl) {
        throw new Error('License validation configuration is incomplete.');
      }

      const hwfp = generateHardwareId();
      hwfp.integrity = {integrity};

      console.log({certPath: this.#certificatePath });

      const certificateJson = readFile(this.#certificatePath);

      // Perform local validation using PKI
      const fullChain = JSON.parse(certificateJson);
      const isValidLocal = await this.#pki.validateTicket(fullChain);

      if (!isValidLocal) {
        throw new Error('Local certificate validation failed.');
      }

      // Send the certificate to the license server for validation
      const response = await fetchWithTimeoutAndRetry(
        `${this.#licenseServerUrl}/tickets/validate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            certificateJson: fullChain, instanceId: this.#instanceId, revalidateOnly: true,
            targets, hwfp
          }),
          agent: new https.Agent({ rejectUnauthorized: true }),
        }
      );

      let result;
      try {
        result = await response.text();
        result = JSON.parse(result);
      } catch {
        console.warn({result});
        throw new Error(`License server produced in invalid response with code ${response.status}`);
      }

      if (!response.ok) {
        if ( result.err && (result.err == 'already in use' || result.err == 'ticket expired') ) {
          try { 
            await revalidate(); 
            if ( Number.isNaN(parseInt(attempt)) ) {
              attempt = MAX_REVALIDATE_RETRIES - 1;
            }
            if ( attempt++ < MAX_REVALIDATE_RETRIES ) {
              return this.validateLicense(attempt);
            } else {
              result.message = 'Failed to revalidate a stale ticket.';
            }
          } catch(err) {
            result.message = err.message || 'Revalidate failed';
          }
        } else {
          console.warn(result);
          throw new Error(`License server responded with status ${response.status}`);
        }
      }

      if (result.message !== 'License is valid.') {
        throw new Error(`License validation failed: ${result.message}`);
      }

      console.log('License validation succeeded.');
    } catch(err) {
      console.warn(`Error validating license`, err);
      throw new Error(`License validation failed: ${err.message}`);
    }
  }

  /**
   * Validates the license by performing local PKI validation and communicating with the license server.
   * @throws Will throw an error if license validation fails.
   */
  async validateLicense(attempt = 0) {
    if (!this.#certificatePath || !this.#licenseServerUrl) {
      throw new Error('License validation configuration is incomplete.');
    }

    console.log({certPath: this.#certificatePath });

    const certificateJson = readFile(this.#certificatePath);

    // Perform local validation using PKI
    const fullChain = JSON.parse(certificateJson);
    const isValidLocal = await this.#pki.validateTicket(fullChain);

    if (!isValidLocal) {
      throw new Error('Local certificate validation failed.');
    }

    // Send the certificate to the license server for validation
    const response = await fetchWithTimeoutAndRetry(
      `${this.#licenseServerUrl}/tickets/validate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certificateJson: fullChain, instanceId: this.#instanceId }),
        agent: new https.Agent({ rejectUnauthorized: true }),
      }
    );

    let result;
    try {
      result = await response.text();
      result = JSON.parse(result);
    } catch {
      console.warn({result});
      throw new Error(`License server produced in invalid response with code ${response.status}`);
    }

    if (!response.ok) {
      if ( result.err && (result.err == 'already in use' || result.err == 'ticket expired') ) {
        try { 
          await revalidate(); 
          if ( Number.isNaN(parseInt(attempt)) ) {
            attempt = MAX_REVALIDATE_RETRIES - 1;
          }
          if ( attempt++ < MAX_REVALIDATE_RETRIES ) {
            return this.validateLicense(attempt);
          } else {
            result.message = 'Failed to revalidate a stale ticket.';
          }
        } catch(err) {
          result.message = err.message || 'Revalidate failed';
        }
      } else {
        console.warn(result);
        throw new Error(`License server responded with status ${response.status}`);
      }
    }

    if (result.message !== 'License is valid.') {
      throw new Error(`License validation failed: ${result.message}`);
    }

    console.log('License validation succeeded.');
  }

  /**
   * Releases the license by communicating with the license server.
   * @throws Will throw an error if license release fails.
   */
  async releaseLicense() {
    if (!this.#certificatePath || !this.#licenseServerUrl) {
      throw new Error('License release configuration is incomplete.');
    }

    const certificateJson = readFile(this.#certificatePath);

    const response = await fetchWithTimeoutAndRetry(
      `${this.#licenseServerUrl}/tickets/release`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certificateJson, instanceId: this.#instanceId }),
        agent: new https.Agent({ rejectUnauthorized: true }),
      }
    );

    if (!response.ok) {
      throw new Error(`License server responded with status ${response.status}`);
    }

    console.log(`License released for instance ${this.#instanceId}.`);
    
    return await response.json();
  }

  /**
   * Securely marks time by invoking the timechain CLI.
   * @param {number} durationInSeconds - Duration in seconds for marking time.
   * @param {Function} callback - Callback to invoke when marking is complete.
   * @param {Object} [options] - Additional options for the timechain CLI.
   * @param {string} [options.proofType='nonce'] - 'nonce' or 'iteration'
   * @param {string} [options.outputFile] - Output file path for timechain results
   * @param {string} [options.useHash='rainstorm'] - 'rainstorm' or 'sha256'
   */
  async securelyMarkTime(durationInSeconds, callback, options = {}) {
    if (typeof durationInSeconds !== 'number' || durationInSeconds <= 0) {
      throw new Error('durationInSeconds must be a positive number.');
    }
    if (typeof callback !== 'function') {
      throw new Error('callback must be a function.');
    }

    const marks = 3;

    const {
      proofType = 'iteration',
      interval = `${Math.ceil(durationInSeconds/marks)} seconds`,
      outputFile = path.join(this.#appDir, 'timechain_proof.json'),
      useHash = 'rainstorm',
    } = options;

    if (!!this.#certificatePath) {
      const cert = this.#pki.getCertificate(this.#certificatePath);
      this.#pki.saveTicket(cert);
      this.#privateKeyPath = this.#pki.getTicketPrivateKeyPath();
    }

    if (!this.#privateKeyPath) {
      throw new Error('Private key path is required for signing.');
    }

    let cmd = `node ${path.resolve(DIST_DIR, 'timechain.js')} mark ` +
              `--out-file "${outputFile}" ` +
              `--proof-type "${proofType}" ` +
              `--interval "${interval}" ` +
              `--use-hash "${useHash}" ` +
              `--client-private-key "${this.#privateKeyPath}" ` +
              `--marks "${marks}" `;

    console.log(`Executing timechain command: ${cmd}`);
    DEBUG && fs.appendFileSync('tc.log', `\n\n${new Date}: ${cmd}`);

    return new Promise((resolve, reject) => {
      exec(cmd, { cwd: this.#appDir }, (error, stdout, stderr) => {
        if (error) {
          console.error('Timechain CLI error:', error);
          return reject(error);
        }

        try {
          callback();
          resolve({ stdout, stderr });
        } catch (cbError) {
          reject(cbError);
        }
      });
    });
  }
}

// fetch helpers
  async function fetchWithTimeoutAndRetry(resource, options = {}) {
    try {
      return await fetchWithTimeout(resource, options);
    } catch(e) {
      console.warn(`First fetch failed`, resource, e); 
      console.info(`Will retry 1 time for`, resource);
      await sleep(2417);
      return fetchWithTimeout(resource, options);
    }
  }

  async function fetchWithTimeout(resource, options = {}) {
    const { timeout = 12000 } = options  // default 12 seconds

    options.timeout = undefined;

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(resource, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response
  }
