//import {exec} from 'child_process';
import path from 'path';
import os from 'os';
import fs from 'fs';
import isDocker from 'is-docker';
import {launch as ChromeLauncher} from './custom-launcher/dist/chrome-launcher.js';
import {DEBUG} from '../common.js';

//const RESTART_MS = 1000;
const zombies = new Map();
let chromeNumber = 0;
let chrome_started = false;

const deathHandlers = new Map();

const launcher_api = {
  async newZombie({port, /*username*/}) {
    const udd = path.resolve(os.homedir(), 'chrome-browser');
    const upd = path.resolve(udd, 'Default');
    if ( ! fs.existsSync( udd ) ) {
      fs.mkdirSync(udd, {recursive:true});
    }
    if ( chrome_started ) {
      DEBUG.val && console.log(`Ignoring launch request as chrome already started.`);
    }
    const DEFAULT_FLAGS = [
      /*
      '--display:1',
      '--use-gl=egl',
      */
      '--window-size=2880,1800',
      '--profiling-flush=1',
      '--enable-aggressive-domstorage-flushing',
      '--restore-last-session',
      '--disk-cache-size=2750000000',
      `--profile-directory="${upd}"`
    ];
    chromeNumber += 1;
    DEBUG.val && console.log(`Chrome Number: ${chromeNumber}, Executing chrome-launcher`);
    const CHROME_FLAGS = Array.from(DEFAULT_FLAGS);
    if (!process.env.DEBUG_SKATEBOARD) {
      CHROME_FLAGS.push('--headless'); 
    } else {
      CHROME_FLAGS.push('--no-sandbox'); 
    }
    if (isDocker()) {
      console.log("We are in docker");
      CHROME_FLAGS.push('--remote-debugging-address=0.0.0.0');
      CHROME_FLAGS.push('--no-sandbox'); 
    }
    if ( DEBUG.noAudio ) {
      CHROME_FLAGS.push('--mute-audio');
    }
    const CHROME_OPTS = {
      port,
      ignoreDefaultFlags: true,
      handleSIGINT: false,
      userDataDir: path.resolve(os.homedir(), 'chrome-browser'),
      logLevel: 'verbose',
      chromeFlags: CHROME_FLAGS
    };
    DEBUG.val && console.log(CHROME_OPTS, CHROME_FLAGS);
    const zomb = await ChromeLauncher(CHROME_OPTS);

    const retVal = {};

    if ( zomb.process ) {
      chrome_started = true;
      zombies.set(port,zomb);
      retVal.port = port;
      zomb.process.on('exit', () => {
        console.warn("Chrome exiting");
        let handlers = deathHandlers.get(port);
        if ( handlers ) {
          for( const handler of handlers ) {
            try { 
              handler();
            } catch(e) {
              console.warn("Error in chrome death handler", e, handler);
            }
          }
        }
      });
    } else {
      await zomb.kill();
    }
    process.on('SIGHUP', undoChrome);
    process.on('SIGUSR1', undoChrome);
    process.on('SIGTERM', undoChrome);
    process.on('SIGINT', undoChrome);
    process.on('beforeExit', undoChrome);

    return retVal;

    async function undoChrome() {
      DEBUG.val && console.log("Undo chrome called");
      if ( ! chrome_started ) return;
      chrome_started = false; 
      try {
        await zomb.kill(); 
        process.exit(0);
      } catch(e) {
        console.warn("Error on kill chrome on exit", e);
        process.exit(1);
      } 
    }
  },

  onDeath(port, func) {
    let handlers = deathHandlers.get(port);
    if ( ! handlers ) {
      handlers = [];
      deathHandlers.set(port,handlers);
    }
    handlers.push(func);
  },

  kill(port) {
    const zombie = zombies.get(port);
    DEBUG.val && console.log(`Requesting zombie kill.`);
    zombie && zombie.kill();
  }
};

export default launcher_api;
