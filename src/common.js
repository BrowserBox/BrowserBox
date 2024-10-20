import fs from 'fs';
import os from 'os';
import path from 'path';
import {execSync} from 'child_process';
import {fileURLToPath} from 'url';

import isDocker from 'is-docker';

import {FRAME_CONTROL} from './public/voodoo/src/common.js';
import {APP_ROOT as app_root} from './root.js';
export * from './args.js';

export const version = 'v10';
export const scratchState = {
  cameFromTOR: false,
  slowConnection: false,
};
export const T2_MINUTES = 2 * 60; // 2 minutes in seconds
export const StartupTabs = new Set(); // track tabs that arrive at setup
export const OurWorld = new Map();
export const BASE_PATH = path.resolve(os.homedir(), '.config', 'dosyago', 'bbpro');
export const EXTENSIONS_PATH = path.resolve(BASE_PATH, 'browser-cache', 'Default', 'Extensions');
export const SUBSCRIBER_FILE_PATH = path.resolve(BASE_PATH, 'subscriber.json');
export const WL_FILE_PATH = path.resolve(BASE_PATH, 'wl.txt');
export const expiryTimeFilePath = path.resolve(BASE_PATH, 'expiry_time');
export let subscriberFileExists;

try {
  subscriberFileExists = fs.existsSync(path.resolve(SUBSCRIBER_FILE_PATH));
} catch(e) {
  subscriberFileExists = false;
}

export const isCT = process?.env?.DOMAIN?.endsWith?.('.cloudtabs.net');

export let wlFileExists;
export let hostWL;

if ( isCT ) {
  try {
    wlFileExists = fs.existsSync(path.resolve(WL_FILE_PATH));
    if ( wlFileExists ) {
      hostWL = new Set(
        fs.readFileSync(path.resolve(WL_FILE_PATH)).toString()
          .split(/\s*\n\s*/g)
          .map(line => line.trim())
          .filter(line => line.length)
      );
    }
    //console.log(`WL set up`, hostWL);
  } catch(e) {
    //console.warn(e);
    wlFileExists = false;
  }
}

export const EXPEDITE = new Set([
  "Target.activateTarget",
  "Page.navigate",
  "Page.navigateToHistoryEntry",
  "Runtime.evaluate",
  "Emulation.setUserAgentOverride",
  "Input.dispatchMouseEvent",
  "Input.dispatchKeyEvent",
  "Input.insertText",
]);

export const LOG_FILE = {
  Commands: new Set(),
  FileHandle: null
};

export const DEBUG = Object.freeze({
  revealChromeJSIntercepts: false,
  debugSetupWorker: false,
  attachToServiceWorkers: true,
  showServerWorkersAsTabs: false,
  extensionsAccess: true,
  showExtensions: true,
  debugReconnect: true,
  fileDebug: false,
  debugScreenSize: false,
  showFileErrors: false,
  debugCast: false,
  lowEndDefault: false,
  debugSession: false,
  traceViewportUpdateFuncs: false,
  debugReload: false,
  debugInfoChanged: false,
  attachDebug: false,
  debugSetupReload: false,
  blockDebug: false,
  debugDebounce: false,
  adjustHeightForHeadfulUI: true,
  needsDOMSnapshot: false,
  dontSkipOldMissingWorldsCheck: false,
  disableIso: true,
  decorateFrameListWithContexts: true,
  showFrameTreeOnFrameChanges: true,
  debugNewWorlds: false,
  neverShowErrorSources: false,
  debugReloadLoop: false,
  alwaysStartShutdownTimer: true,
  debugViewports: false,
  noteCallStackInLog: true,
  showNoTargets: false,
  debugUserAgent: false,
  showSkippedCommandsAfterViewportChangeCheck: false,
  showFaviconErrors: false,
  showUARedux: false,
  disable3PC: true,
  networkDebug: false,
  networkBlocking: true,
  blockFileURLs: true,
  blockChromeURLs: false,
  blockInspect: true,
  extensionsNew: true,
  preventNewTab: true,
  extensionsAssemble: false,
  extensions: [
    'cbimabofgmfdkicghcadidpemeenbffn',
    'eimadpbcbfnmbkopoojfekhnkhdbieeh'
  ],
  useActiveFocusEmulation: true,
  fixDevToolsInactive: true,
  restore: false, // debug restore
  restoreSessions: process.env.BB_NO_RESTORE_LAST_SESSION ? false : true,
  ensureRSA_for_3PC: false,
  useLocalAuthInPrepFor_3PC_PhaseOut: true,
  showDebug: false,
  utilizeTempHackFixForIMENoKey: false,
  debugTyping: false,
  logFileCommands: false,
  windowsUses48KAudio: false,
  debugAlerts: false,
  debugModals: false,
  debugCommandOrder: false,
  debugKeyEvents: false,
  debugBinding: false,
  events: false,
  commands: false,
  blockList: new Set([
    //"Emulation.setDeviceMetricsOverride",
  ]),
  adBlock: true,
  debugAddr: true,
  debugScaledUpCoViewport: false,
  debugInterception: false,
  noCastMaxDims: false,
  debugAckBlast: false,
  allowAckBlastOnStart: !process.env.TORBB && true,
  dontSendActivate: false,
  ALL_FLAGS: false, // turn on all chrome flags listed in MISC_STABILITY_RELATED_FLAGS_THAT_REDUCE_SECURITY
  localTestRTT: !process.env.TORBB && process.platform == "darwin" && true,
  showTargetSessionMap: false,
  debugFileDownload: false,
  debugFileUpload: false,
  get useNewAsgardHeadless() { 
    return this.restoreSessions || true;
  },
  showFlags: true,
  allowExternalChrome: true,
  debugChromeStart: false,
  showTodos: false,
  showViewportChanges: false,
  showResizeEvents: false,
  logRestartCast: false,
  get showErrorSources() {
    return this.logFileCommands || this.commands || false;
  },
  showNoSessionIdWarnings: false,
  showBlockedCaptureScreenshots: false,
  coords: false,
  debugScrollbars: true,
  get ensureUptimeBeforeRestart() {
    return this.mode !== 'dev'
  },
  debugRestart: true,
  debugUntilTrue: false,
  debugUntilForever: false,
  debugViewportDimensions: false,
  debugViewportChanges: false,
  debugDevtoolsServer: false,
  /* peer and websocket connections */
  cnx: false, 
  debugClicks: false,
  debugNoticeSignal: false,
  throttleIntentPrompts: false,
  // this rewdraws every mouse event which produces too many frames for slow Tor
  //showMousePosition: !process.env.TORBB && true, 
  showMousePosition: true, 
  debugConnect: false,
  debugCommandResponses: false,
  dataDebug: false,
  debugHistory: false,
  debugFaviconsSend: false,
  debugFavicon: false,
  neverWait: true, /* for commands */
  attachImmediately: true,
  manuallyInjectIntoEveryCreatedContext: false,
  ignoreCertificateErrors: false,
  debugNavigator: false,
  showContextIdCalls: false,
  debugCopyPaste: false,
  watchFrameStack: false,
  enableClientsToSetURL: true,
  debugSendResult: false,
  metaDebug: false,
  channelDebug: false,
  debugCookie: false,
  waitLonger: true,
  useLoopbackIP: true,
  debugAuth: false,
  pausedDebug: false,
  get useWebRTC() {
    if ( this.isBSD ) {
      return false;
    } else if ( process.env.TORBB ) {
      return false;
    } else {
      return true;
    }
  },
  binaryFrames: true,
  sendImmediate: !process.env.TORBB && true,
  chooseFastest: !process.env.TORBB && true,
  logCastOutOfOrderFrames: false,
  noSecurityHeaders: false,
  bundleClientCode: false,
  get isBSD() {
    return process.platform.endsWith('bsd'); 
  },
  get mode() {
    // prod or dev (whether to bundle frontend code or not)
    // bsd is always dev because bundlers like parcel etc do not work on it
    return this.bundleClientCode ? 
      this.isBSD ? 'dev' : 'prod'
      :
      'dev';
  },
  showOrigin: false,
  useDocCustomDownloadPlugin: true,
  useFlashEmu: process.env.USE_FLASH == 'true' ? true : false,
  showFlash: false, /* debug flash */
  loadSPLFreshEachLogin: false,
  frameDebug: false,
  adaptiveImagery: true,
  debugAdaptiveImagery: false,
  useGL: true,
  disableGL: false,
  disable3D: process.platform == 'linux',
  // this logs resize related data, probably rename resizeDebug or logResize
  resize: false,          
  logFastest: false,
  showConsoleMessages: false,
  get debugConsoleMessages() {
    /* || other condition || some other condition ... etc ... */
    return this.debugFavicon || this.showConsoleMessages; 
  },
  worldDebug: false,
  bufSend: true,
  acks: false,          // actually this doesn't "turn on" acks. They are on by default
                        // this flag just turns on acks logging. It should probably be called
                        // logAcks (like it is in the front end)
  socDebug: false,
  fontDebug: false,
  useHash: false,
  cwebp: false,
  sendFramesWhenTheyArrive: !process.env.TORBB && true,
  onlySendOnAck: process.env.TORBB || false,
  goSecure: true,
  noAudio: false,
  legacyShots: !FRAME_CONTROL,      /* until enableBeginFrameControl can be set for any target
    whether created with createTarget or simply spawning, 
    we must use legacy shots */
  get dontShowFetchDomain() {
    return this.commands && true;
  },
  shotDebug: false,
  noShot: false,
  dev: false,
  val: 0,
  low: 1,
  med: 3,
  high: 5
});

DEBUG.showDebug && console.log(DEBUG);

export const ALLOWED_3RD_PARTY_EMBEDDERS = [
  "https://cloudtabs.net",
  "https://*.puter.com",
  "https://puter.com",
  "https://*.puter.site",
  "https://*.cloudtabs.net",
  "https://localhost:*",
  ...(
  process.env.DOMAIN ? [
    `https://${process.env.DOMAIN}:*`,
    `https://*.${process.env.DOMAIN}:*`,
  ] : []),
];
export const FLASH_FORMATS = new Set([
  'swf',
  'fla',
  'as',
  'jsfl',
]);
export const CONFIG = Object.freeze({
  useRedirectBlock: true,
  blockedRedirectLocation: 'https://browse.cloudtabs.net/blocked',
  isCT,
  hostWL,
  expiryTimeFilePath,
  homePage: 'https://bing.com',
  BINDING_NAME: 'bb',
  devapi: true,
  inspectMode: false, // right now Overlay.setInspectMode does nothing, circle back to this
  createPowerSource: false,
  isSubscriber: subscriberFileExists || false,
  useTorProxy: process.env.TOR_PROXY || false,
  // viewport scale up related options
    // note: we are switching this off as the weird seems to break some sites
    useScaledUpCoViewport: false,
    get useCappedScaling() {
      return this.useScaledUpCoViewport && true;
    },
    mobileMaxWidth: 414, // CSS pixels
    mobileMaxHeight: 736, // CSS pixels
  // speed up cast on switch activated related
    castSyncsWithActive: true,
    doAckBlast: !process.env.TORBB && true,
  SHORT_TIMEOUT: 30,
  useLayerTreeDomain: false,
  tailShots: false,
  alwaysRestartCast: true,
  blockAllCaptureScreenshots: true,
  setAlternateBackgroundColor: false,
  screencastOnly: true,
  baseDir: BASE_PATH,
  darkMode: false, 
  forceDarkContentMode: false,
  audioDropPossiblySilentFrames: true,
  sslcerts: port => {
    if ( process.env.TORBB ) {
      DEBUG.debugAddr && console.log('Cert file for', process.env[`ADDR_${port}`]);
      return path.join(os.homedir(), process.env.SSLCERTS_DIR, process.env[`ADDR_${port}`]);
    } else {
      return process.env.SSLCERTS_DIR ? process.env.SSLCERTS_DIR : 'sslcerts';
    }
  },
  reniceValue: process.env.RENICE_VALUE || -15,
  sleepMax: 20000,
  maxTimers: 800,
  FORBIDDEN: new Set([
    'javascript:',
    'file:',
    'vbscript:'
  ]),
  connectivityTests: [
    "https://1.1.1.1",
    "https://dns.google",
    "https://www.akamai.com",
    "https://www.lumen.com",
    "https://www.equinix.com",
    "https://www.f5.com",
    "https://www.cogentco.com",
    "https://www.he.net",
    "https://www.arista.com",
  ]
});
export const localBlockList = process.platform == 'darwin' 
  || 
  process.env.GITHUB_ACTIONS 
  || 
  isDocker() ? [] : [
    /^localhost/,
    /^::1/,
    /^127.0/,
    /^192.168./,
    /^169.254./,
    /^10./,
    /^172.(1[6-9]|2[0-9]|3[01])./,
];
export const AttachmentTypes = new Set([
  'page', 
  ...(DEBUG.attachToServiceWorkers ? [
    'service_worker'
  ] : [])
]);

const Timers = new Set(); 

if ( ! DEBUG.useWebRTC ) {
  console.warn(`Warning!! Not using web rtc`);
}

if ( DEBUG.logFileCommands ) {
  LOG_FILE.FileHandle = fs.openSync(path.resolve(CONFIG.baseDir, 'watch-commands.log'), 'a');
  process.on('beforeExit', () => {
    fs.closeSync(LOG_FILE.FileHandle);
  });
}

export const SignalNotices = path.resolve(CONFIG.baseDir, 'notices');
export const NoticeFile = 'text';
export const noticeFilePath = path.resolve(SignalNotices, NoticeFile);
export const NOTICE_SIGNAL = 'SIGPIPE';
export const CONNECTION_ID_URL = "data:text,DoNotDeleteMe";
export const MAX_TABS = 15;
const MIN_HEIGHT = 300;
const MIN_WAIT = 10;
const MAX_WAITS = 200;
export const COMMAND_MAX_WAIT = DEBUG.waitLonger ? 
    5000 : 333; /* don't wait very long, but wait longer in debug */

// test for webpack
export const APP_ROOT = app_root;

if ( DEBUG.noSecurityHeaders ) {
  console.warn(`Security headers are switched off! Audio will fail.`);
}
//export const APP_ROOT = APP_ROOT;

export const GO_SECURE = fs.existsSync(path.resolve(CONFIG.sslcerts(process.env.APP_PORT), 'privkey.pem'));

export const COOKIENAME = `browserbox-${version}-userauth-${GO_SECURE?'sec':'nonsec'}`;

export const SECURE_VIEW_SCRIPT = path.join(APP_ROOT, 'zombie-lord', 'scripts', 'get_download_view_url.sh');
export const EXTENSION_INSTALL_SCRIPT = 'add-extension';
export const EXTENSION_REMOVE_SCRIPT = 'del-extension';
export const EXTENSION_MODIFY_SCRIPT = 'mod-extension';
export const EXTENSIONS_GET_SCRIPT = 'get-extensions';

fs.mkdirSync(CONFIG.baseDir, {recursive: true});
fs.mkdirSync(SignalNotices, {recursive:true});
try {
  execSync(`chmod 757 ${SignalNotices}`);
} catch(e) {
  console.warn(`Running chmod on notices file failed.`);
}

export async function throwAfter(ms, command, port, Aborter) {
  // could make this sleep cancellable
  await sleep(ms, Aborter);
  //DEBUG.metaDebug && console.log(`Throwing after`);
  // let's not throw but instead return a warning, that we could collect on the client 
  // or server if we warned in another way
  // rather than just exploding
  //throw new Error(`Timed out after ${ms}. ${port} : ${JSON.stringify(command,null,2)}`);
  return {
    meta: [
      {
        timeoutWarning: true,
        timedOutAfter: ms,
        originalCommand: command,
        port
      }
    ]
  };
}

export function consolelog(...args) {
  setTimeout(() => console.log(...args), 50);
}

export async function sleep(ms, Aborter) {
  if ( Timers.size > CONFIG.maxTimers ) {
    throw new Error(`Too many timers created!`);
  }
  let timer;
  ms = Math.min(ms, CONFIG.sleepMax);
  const pr = new Promise(res => timer = setTimeout(() => {
    if ( Aborter ) {
      Aborter.do = () => void 0;
    }
    Timers.delete(pr);
    res();
  }, ms));
  Timers.add(pr);
  if ( Aborter ) {
    Aborter.do = () => {
      clearTimeout(timer);
      Timers.delete(pr);
    };
  }
  return pr;
}

export async function untilTrueOrTimeout(pred, seconds) {
  return untilTrue(pred, 500, 2*seconds, () => new Error(`Checking predicate (${pred}) timed out after ${seconds} seconds.`));
}

export async function untilTrue(pred, waitOverride = MIN_WAIT, maxWaits = MAX_WAITS, getRejectionReason) {
  let waitCount = 0;
  let resolve, reject;
  const pr = new Promise((res, rej) => (resolve = res, reject = rej));
  setTimeout(checkPred, 0);
  return pr;

  async function checkPred() {
    DEBUG.debugUntilTrue && console.log('Checking', pred+'');
    if ( await pred() ) {
      return resolve(true);
    } else {
      waitCount++;
      if ( waitCount < maxWaits ) {
        setTimeout(checkPred, waitOverride);
      } else {
        if ( getRejectionReason ) {
          return reject(getRejectionReason());
        }
      }
    }
  }
}

export async function untilForever(pred, waitOverride = 5000) {
  let resolve;
  const pr = new Promise(res => resolve = res);
  setTimeout(checkPred, 0);
  return pr;

  function checkPred() {
    DEBUG.debugUntilForever && console.log('Checking', pred);
    if ( pred() ) {
      return resolve(true);
    } else {
      setTimeout(checkPred, waitOverride);
    }
  }
}

// leading edge throttle
export function throttle(func, wait) {
  let timeout;

  const throttled = (...args) => {
    if ( ! timeout ) {
      timeout = setTimeout(() => timeout = false, wait);
      return func(...args);
    }
  }

  return throttled;
}

export function debounce(func, wait) {
  let timeout;
  return function (...args) {
    DEBUG.debugDebounce && console.log(`Debounce got func ${func} with args ${args}`);
    const later = () => {
      timeout = null; 
      func.apply(this, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  }
}
