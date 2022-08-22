import fs from 'fs';
import os from 'os';
import path from 'path';
import {fileURLToPath} from 'url';
import {FRAME_CONTROL} from './public/translateVoodooCRDP.js';

export const DEBUG = {
  mode: 'prod',
  goSecure: true,
  frameLimit: false,
  noAudio: false,
  legacyShots: !FRAME_CONTROL,      /* until enableBeginFrameControl can be set for any target
    whether created with createTarget or simply spawning, 
    we must use legacy shots */
  commands: false,
  shotDebug: false,
  noShot: false,
  dev: false,
  val: 0,
  low: 1,
  med: 3,
  high: 5
};

// config
const SLEEP_MAX = 20000;  // ms

// test for webpack
//export const APP_ROOT = path.resolve(__dirname, '..', 'src');
export const APP_ROOT = path.dirname(fileURLToPath(import.meta.url));
export const GO_SECURE = fs.existsSync(path.resolve(os.homedir(), 'sslcerts', 'privkey.pem'));
export const version = 'v1';
export const COOKIENAME = `litewait-${version}-userauth-${GO_SECURE?'sec':'nonsec'}`;

export const SECURE_VIEW_SCRIPT = path.join(APP_ROOT, 'zombie-lord', 'scripts', 'get_download_view_url.sh');

export async function throwAfter(ms, command, port) {
  await sleep(ms);
  throw new Error(`Timed out after ${ms}. ${port} : ${JSON.stringify(command,null,2)}`);
}

export async function sleep(ms) {
  ms = Math.min(ms, SLEEP_MAX);
  return new Promise(res => setTimeout(res, ms));
}

export const CONNECTION_ID_URL = "data:text,DoNotDeleteMe";
