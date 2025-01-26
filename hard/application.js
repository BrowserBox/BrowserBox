// application.js

// build-ins and 3rd parties
  import path from 'path';
  import { spawnSync } from 'child_process';
  import { fileURLToPath } from 'url';

// our lib
  import { HardenedApplication } from './hardenedApplication.js';
  import { sleep, log } from './utils.js';
  import {
    APP_DIR,
    API_VERSION,
    ROOT_PUBLIC_KEY_PATH,
    CERTIFICATE_PATH,
    LICENSE_SERVER_URL,
  } from './config.js';

const __filename = () => fileURLToPath(import.meta.url);
const __dirname = () => path.dirname(__filename());

// Initialize HardenedApplication with necessary configurations
const hardenedApp = new HardenedApplication({
  appDir: __dirname(), // Directory containing your application files
  certificatePath: CERTIFICATE_PATH,
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

// Export the runApplication function
export async function runApplication() {
  await runApp();
}

// If this script is the entry point, run the application
if (process.argv[1] === __filename()) {
  runApp();
}

