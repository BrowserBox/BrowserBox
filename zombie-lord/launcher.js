import {exec} from 'child_process';
import path from 'path';
import {sleep} from '../common.js';

const RESTART_MS = 1000;
const zombies = new Map();
let chromeNumber = 0;
let chrome_started = false;

const deathHandlers = new Map();

const launcher_api = {
  async newZombie({port, username} = {}) {
    if ( chrome_started ) {
      console.log(`Ignoring launch request as chrome already started.`);
    }
    const cmd = `${path.join(__dirname, 'start_chrome.sh')} ${port} ${username}`;
    chromeNumber += 1;
    console.log(`Chrome Number: ${chromeNumber}, Executing `, cmd);
    const zomb = exec(cmd);
    zombies.set(port,zomb);
    const retVal = {
      port
    };
    process.on('exit', () => { 
      chrome_started = false; 
      zomb.kill(); 
    });
    zomb.on('close', (code, signal) => {
      chrome_started = false;
      console.log(`Chrome going down with code ${code} and signal ${signal}.`);
      //console.log(`Restarting in ${RESTART_MS}`);
      //setTimeout(() => launcher_api.newZombie({port, username}), RESTART_MS);
      const handlers = deathHandlers.get(port);
      if ( !! handlers ) {
        for( const func of handlers ) {
          try {
            func();
          } catch(e) {
            console.warn("Death handler error", e);
          }
        }
      }
    });
    zomb.on('exit', (code, signal) => {
      chrome_started = false;
      console.log(`Chrome going down with code ${code} and signal ${signal}.`);
    });

    zomb.on('error', err => {
      const log = JSON.stringify({chromeProcessMetaError:err});
      console.log(`Chrome zombie error ${log.slice(0,140)}`); 
    });
    zomb.stdout.on('data', data => {
      const log = JSON.stringify({chromeProcessData:data});
      //console.log(`Chrome zombie stdout data ${log.slice(0,140)}`);
    });
    zomb.stderr.on('data', data => {
      const log = JSON.stringify({chromeProcessError:data});
      //console.log(`Chrome zombie stderr data ${log.slice(0,140)}`);
    });

    return retVal;
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
    console.log(`Requesting zombie kill.`);
    zombie && zombie.kill();
  }
};

export default launcher_api;
