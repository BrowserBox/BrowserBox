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
async function runApp() {
  try {
    // Verify application integrity
    await hardenedApp.verifyManifest();
    log('Application', 'Application integrity check passed.');

    // Validate license
    await hardenedApp.validateLicense();
    log('Application', 'License validation succeeded.');

    // Start application logic
    log('Application', 'Application started.');

    console.log('Hello world');
    const waitSeconds = 5;
    await hardenedApp.securelyMarkTime(waitSeconds, () => console.log(`Approximately ${waitSeconds} seconds was marked securely.`));

    // Release license
    await hardenedApp.releaseLicense();
    log('Application', 'Application finished.');
  } catch (error) {
    console.warn(error);
    log('Application', `Error: ${error.message}`);
    process.exit(1);
  }
}
export async function applicationCheck() {
  console.log('Application Check', {dn: __dirname(), fn: __filename(), stack: (new Error).stack});

  try {
    // Verify application integrity
    await hardenedApp.verifyManifest();
    log('Application', 'Application integrity check passed.');

    // Validate license
    await hardenedApp.validateLicense();
    log('Application', 'License validation succeeded.');

    // Start application logic
    log('Application', 'Application started.');

    return true;
  } catch (error) {
    console.warn(error);
    log('Application', `Error: ${error.message}`);
    return false;
    //process.exit(1);
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

// Export the runApplication function
export async function runApplication() {
  await runApp();
}

// If this script is the entry point, run the application
if (process.argv[1] === __filename()) {
  runApp();
}

