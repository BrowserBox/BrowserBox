// application.js

// build-ins and 3rd parties
  import path from 'path';
  import os from 'os';
  import { spawnSync } from 'child_process';

// our lib
  import { __dirname, __filename, HardenedApplication } from './hardenedApplication.js';
  import { sleep, log } from './utils.js';
  import {
    APP_DIR,
    API_VERSION,
    ROOT_PUBLIC_KEY_PATH,
    CERTIFICATE_PATH,
    LICENSE_SERVER_URL,
  } from './config.js';

// Initialize HardenedApplication with necessary configurations
const hardenedApp = new HardenedApplication({
  appDir: path.resolve(__dirname(), '..', '..'), // Directory containing your application files
  certificatePath: path.resolve(os.homedir(), '.config', 'dosyago', 'bbpro', 'tickets', 'ticket.json'),
  licenseServerUrl: LICENSE_SERVER_URL,
  apiVersion: API_VERSION,
  // instanceId is generated internally
});

/**
 * Runs the main application with integrity and license verification.
 */
export async function applicationCheck() {
  console.log('Application Check', {dn: __dirname(), fn: __filename(), stack: (new Error).stack});

  try {
    // Validate license
    await hardenedApp.validateLicense();
    log('Application', 'License validation succeeded.');

    // Verify application integrity
    await hardenedApp.verifyManifest();
    log('Application', 'Application integrity check passed.');

    // Start application logic
    log('Application', 'Application started.');

    return true;
  } catch (error) {
    console.warn(error);
    log('Application', `Error: ${error.message}`);
    return false;
  }
}

export async function validityCheck({targets} = {}) {
  console.log('Validity Check', {dn: __dirname(), fn: __filename(), stack: (new Error).stack});

  let integrity = false;
  try {
    // Verify application integrity
    integrity = await hardenedApp.verifyManifest();
    log('Application', 'Application integrity check passed.');
  } catch(e) {
    log('Application', 'Application integrity check failed.' + e);
    integrity = false;
  }

  try {
    // Validate license
    await hardenedApp.checkLicense({targets, integrity});
    log('Application', 'License validation succeeded.');

    // Start application logic
    log('Application', 'Application started.');

    return true && integrity;
  } catch (error) {
    console.warn(error);
    log('Application', `Error: ${error.message}`);
    return false;
  }
}

export async function release() {
  return await hardenedApp.releaseLicense();
}



