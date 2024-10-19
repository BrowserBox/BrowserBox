const USW = true; // service worker
export const VERSION = '10.4.0';
export const SERVICE_COUNT = 4; // browser, documents, audio, devtools
export const FRAME_CONTROL = false;

export const SafariPlatform = /^((?!chrome|android).)*safari/i;
const MobilePlatform = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
const FirefoxPlatform = /firefox/i;
export const FACADE_HOST_REGEX = /^p\d+$/;

export const iden = e => e;
export const isSafari = () => SafariPlatform.test(navigator.userAgent);

export const GO_SECURE = globalThis?.location?.protocol == 'https:';
export const version = 'v10';
export const Port = globalThis?.location?.port || (GO_SECURE ? '443': '80');
export const COOKIENAME = `browserbox-${version}-userauth-${GO_SECURE?'sec':'nonsec'}`+Port;

export const BLANK = "about:blank";
export const USE_DDG = true;
const MIN_WAIT = 50;
const MAX_WAITS = 200;
const OPEN_SERVICES_IN_BROWSER = false; // true is within BrowserBox tabs, false is in the regular browser's new tabs
let authToken;

export const OPTIONS = {
  showBWStatus: true,
  showTorStatus: true,
  showAudioStatus: true,
  showWebRTCStatus: true,
  useSystemColorScheme: true,
  useDarkMode: false,
  useCloudTabsStatus: true,
};

export const DEBUG = Object.freeze({
  debugCopyPaste: false,
  revealServiceWorkersAsTabs: false,
  attachToServiceWorkers: true,
  extensionsAssemble() {
    return CONFIG.isCT() && true;
  },
  debugSW: false,
  debugKeysCanInput: false,
  get debugKCI() {
    return this.debugKeysCanInput;
  },
  blockClientFormFactorCommands: false, /*block setWindowBounds, and setDeviceMetricsOverride from client*/
  logPlugins: false,
  debugPuterAbility: false,
  detectPuterAbility: true,
  debugConnectivity: false,
  noReset: false,
  debugStartup: false,
  bustCache: false,
  showAudioInstructions: false,
  showStableSizeOnResize: false,
  debugUntilTrue: false,
  debugUberFetch: false,
  useUberFetch: true,
  logUberFetchErrors: true,
  tryPeeringAnywayEvenIfUserMediaFails: false,  // there's no point because we only request perms on mobile and 
                                                // mobile will not peer webrtc unless we get perms so no point trying 
                                                // if user media fails
  utilizeTempHackFixForIMENoKey: false,
  mode: 'prod',
  debugKeyEvents: false,
  debugCommandOrder: false,
  // note on: increaseResolutionOfSmallerCanvas
    // this seems to look clearer on smaller devices when we are using a scaled up co viewport, 
    // from multiple clients
    // but it throws off the bitmap calculation for pointer events
    // so switching off for now
  increaseResolutionOfSmallerCanvas: false, 
  debugIMEDetection: false,
  debugShrink: false,
  debugResize: false,
  debugImageRemainderClears: false,
  debugDownload: false,
  debugNetCheck: false,
  debugActivate: false,
  debugDownloadProgress: false,
  logBandwidthIssueChanges: false,
  debugSafariWebRTC: false,
  debugSetup: false,
  /* debug connections */
  cnx: false,
  debugIntentPrompts: false,
  allowContextMenuOnContextMenu: true,
  debugTabs: false,
  debugContextMenu: false,
  debugQdEs: false, /* QdEs == QueuedEvents */
  debugConnect: false,
  debugBetterModals: false,
  debugHistory: false,
  debugFavicon: false,
  get debugElementInfo() {
    return this.debugCopyPaste || this.debugModals || false;
  },
  coords: false,
  debugBitmapCoordConversion: false,
  debugEventChains: false,
  debugEventQueue: false,
  HFUNCTION: false,
  trackLoading: true,
  debugAudio: false,
  debugAudioAck: false,
  debugFastest: false,
  get useStraightAudioStream() {
    return globalThis?.location?.host?.endsWith?.('.onion') || globalThis.comingFromTOR || ! globalThis.AudioContext || false;
  },
  enableAudioElements: true,
  get includeAudioElementAnyway() {
    return DEBUG.enableAudioElements && (isSafari() || deviceIsMobile() || this.useStraightAudioStream);
  },
  scaleImage: true,       // scaleImage: false centers the remote image if it's smaller than local viewport (large screens))
  centerImage: false,
  dontEnforceOnlineCheck: true,
  newUI: true,
  get useWindowOpenForSecureView() {
    return !CONFIG.openServicesInCloudTabs;
  },
  showCollect: false,
  debugFocus: false,
  debugAuth: false,
  debugOtherButton: false,
  get debugModal() {
    return this.debugCopyPaste || false;
  },
  get debugClipboard() {
    return this.debugCopyPaste || false;
  },
  get debugMeta() {
    return  (this.debugFavicon > 1) || 0;
  },
  get untabledServerMessageId() {
    return this.debugMeta > 1;
  },
  debugCast: false,
  debugBox: false,
  debugDraw: false,
  debugDevTools: false,
  debugInspect: false,
  debugFrameDrops: false,
  logFrameIds: false,
  dropFramesWhenDrawing: false,
  ensureScroll: false,
  useDataURL: false,
  noCollect: false, /* do not do buffered frame collection */
  mobileUIDefault: true,  /* mobile UI defaults to true (visible) or false (not visible) */
  toggleUI: true,         /* switches toggle UI option on */
  get logMeta() {
    return !!this.debugMeta;
  }, 
  ackEvery: 1,
  asyncLoop: false,
  immediateAck: true,
  showKeyboardToggleInContextMenu: false,
  logRaces: false,
  logAcks: false,
  regularFrameCheck: false,
  showUnreadBadge: true,
  framesPushed: true,
  clientsCanResetViewport: false,
  adaptiveImageQuality: false,
  loggableEvents: new Set([
    /*typing events*/
    'keydown',
    'keypress',
    'keyup',
    'compositionstart',
    'compositionupdate',
    'compositionend',
    'input',
    'beforeinput',
    /*pointing events*/
    'pointerdown',
    'pointerup',
    'pointermove',
    'touchmove',
    'touchstart',
    'touchcancel',
    'mousedown',
    'mouseup',
    'mousemove',
    'click',
    'contextmenu',
    'dblclick'
  ]),
  activateDebug: false,
  activateNewTab: true,
  frameControl: FRAME_CONTROL,
  debugTyping: false,
  logTyping: false,
  sidebarMenu: false,
  pluginsMenu: false,
  serviceWorker: false,
  neonMode: false,
  resetCache: false,
  exposeState: true,
  fullScope: false,
  get err() { return this.fullScope || false },
  get promiserejection() { return this.fullScope || false },
  get dev() { return this.fullScope || false },
  get val() { return this.fullScope ? 1 : 0 },
  low: 1,
  med: 3,
  high: 5
});

export const CONFIG = Object.freeze({
  alwaysSendTopLevel: false,
  get isCT() {
    return globalThis?.location?.hostname?.endsWith?.('.cloudtabs.net');
  },
  get mainPort() {
    if ( CONFIG.isDNSFacade ) {
      return parseInt(location.hostname.split('.')[0].replace(/\D+/g, '')); 
    } else {
      return location.port;
    }
  },
  get isDNSFacade() {
    return !!location.hostname.split('.')[0].match(FACADE_HOST_REGEX);
  },
  ensureDevToolsOpensInNewTab: false,
  logUpdatedContent: false,
  ensureFrameOnResize: true,
  openServicesInCloudTabs: globalThis?.location?.hostname?.endsWith?.('.cloudtabs.net') ? true : OPEN_SERVICES_IN_BROWSER,
  encforceKeyOrdering: true,
  useTopLevelControlKeyListeners: true,
  useTopLevelSendKeyListeners: true,
  get useServiceWorkerToCache() {
    return USW;
  },
  downloadMeterVanishTimeout: DEBUG.debugDownload ? 500000 : 5000,
  ACK_BLAST_LENGTH: 1000,
  netCheckTimeout: 6007,
  netCheckMinGap: 2000,
  netCheckMaxGap: 7001,
  doAckBlast: true,
  /* making this true means we don't check audio start on every tap or click BUT
   it does seem to interfere with audio restarting in the case it stops
  */
  centerContextMenuOnMobile: true,
  get darkMode() {
    if ( OPTIONS.useSystemColorScheme ) {
      const isDark = !!window?.matchMedia?.('(prefers-color-scheme: dark)')?.matches;
      return isDark;
    }
    return OPTIONS.useDarkMode;
  }, 
  showModalOnFileDownload: false,
  settingsButton: false,
  useBlankWindowForProtocolLaunch: false,
  removeAudioStartHandlersAfterFirstStart: false, 
  onlyStartAudioBeginSoundOnce: false,
  uiDefaultOff: false,
  magicBar: false,
  audioServiceFileName: 'audio.srv',
  devtoolsServiceFileName: 'devtools.srv',
  sessionTokenFileName: 'session.tkn',
  get isOnion() {
    return globalThis?.location?.host?.endsWith?.('.onion')
  },
  get privateConnectivity() {
    return this.isOnion || true; // on by default now
  }
});

export const CHAR = Object.freeze({
  loadReload: '&orarr;', /*"&#x27f3;",*/ /*"&#x267b;", */ /*"&orarr;",*/
  forward: "&rsaquo;",
  backward: "&lsaquo;",
  approxequals: "&#8776;",
  newtab: '&#xFF0B;', /*'&#8917;',*/ /*"&#9932;",*/ /*"&#x2716;",*/ /*"&#x2795;",*/ /*"&#xff0b;",*/ /*"&#8944;", */ /*"&#8917;",*/
  tabcloser: '&#xFF0B;', /*"&#9932",*/ /*"&#9587;",*/ /*"&#9249;",*/ /*"&#8999;",*/ /*"&#8800;",*/ /*"&#8945;",*/
  menuopener: "&#8943;",
  menucloser: "&#8942;", /*"&#8728;"*/
  /*
    viewportresize: ["&#2023;", "&#3204", "&#3162;", 
      ...Range(3104, 3111).map(n => `&#${n};`),
      ...Range(3120, 3125).map(n => `&#${n};`)
    ][2],
  */
  viewportresize: "&#x25a0", /*"&#3162;", */
  complexmenu: "&#1421;", 
});

export const COMMON = Object.seal(Object.preventExtensions({
  blockAnotherReset: false,
  delayUnload: true,
}));

export const HIDDEN_DOMAINS = new Set([
  'neajdppkdcdipfabeoofebfddakdcjhd', // chrome internal tts extension, which chrome hides by default, so we shouldn't show it
]);

export const AttachmentTypes = new Set([
  'page',
  ...(DEBUG.revealServiceWorkersAsTabs ? [
    'service_worker' 
  ] : []),
]);

// Cache the token outside the uberFetch function
authToken = globalThis?.localStorage?.getItem?.('localCookie');

Object.assign(globalThis, { uberFetch });

export async function uberFetch (url, options = {}) {
  // Check if uberFetch should be used
  if (!DEBUG.useUberFetch) {
    // Fall back to regular fetch if DEBUG.useUberFetch is false
    return fetch(url, options);
  }

  if ( ! authToken ) {
    console.warn(`Using uberFetch but authToken not yet present. Waiting for it...`);
    await untilTrueOrTimeout(() => globalThis?.localStorage?.getItem?.('localCookie'), 120); // wait 2 minutes 
    console.info(`Using uberFetch and authToken arrived!`);
    authToken = globalThis?.localStorage?.getItem?.('localCookie');
  }

  // If there's no 'headers' field in options, initialize it
  if (!options.headers) {
    options.headers = {};
  }

  // Add the X-BrowserBox-Local-Auth header with the cached auth token
  options.headers['X-BrowserBox-Local-Auth'] = authToken;

  try {
    DEBUG.debugUberFetch && console.info(`Uber fetch to: ${url}`, options);
    DEBUG.debugUberFetch && console.info(`Stack at uber fetch`);
    DEBUG.debugUberFetch && console.error(new Error(`Trace`));
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    DEBUG.logUberFetchErrors && console.error('uberFetch encountered an error:', error, url, options);
    throw error; // Re-throw the error to be handled by the caller
  }
}

export async function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

export function debounce(func, wait) {
  let timeout;
  return function (...args) {
    const later = () => {
      timeout = null; 
      func.apply(this, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
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

export function littleEndian() {
  const uInt32 = new Uint32Array([0x11223344]);
  const uInt8 = new Uint8Array(uInt32.buffer);
 
  if(uInt8[0] === 0x44) {
    return true;
  } else if (uInt8[0] === 0x11) {
    return false;
  } else {
    return true;
  }
}

export function be2le(u32) {
  const u32a = new Uint32Array([u32]);
  const data = new Uint8Array(u32a.buffer);
  return (data[3]<<0) | (data[2]<<8) | (data[1]<<16) | (data[0]<<24);
}

export function isFirefox() {
  return FirefoxPlatform.test(navigator.userAgent);
}

export function deviceIsMobile() {
  const mobile = MobilePlatform.test(navigator.userAgent);
  /*
  if ( mobile ) {
    alert('mobile');
  }
  */
  return mobile;
}

// debug logging
export function logitKeyInputEvent(e) {
  if ( DEBUG.val < DEBUG.high && DEBUG.debugBox ) return;
  if ( DEBUG.loggableEvents && ! DEBUG.loggableEvents.has(e.type) ) return;
  const {type,key,code,data,isComposing,inputType,composed,target:{value}} = e;
  const typingData = {key,code,type,data,isComposing,inputType,composed,value};
  const debugBox = document.querySelector('#debugBox');
  if ( debugBox ) {
    debugBox.insertAdjacentHTML('afterbegin', `<p style="max-width:90vw;"><code><pre>${JSON.stringify(typingData,null,2)}</code></pre></p>`);
  } else {
    if ( deviceIsMobile() ) {
      alert("No debugBox found");
    } else {
      throw new Error("No element with ID 'debugBox' found.");
    }
  }
}

export function elogit(e) {
  if ( DEBUG.val < DEBUG.high && ! DEBUG.debugBox ) return;
  if ( DEBUG.loggableEvents && ! DEBUG.loggableEvents.has(e.type) ) return;
  const {type,defaultPrevented,clientX,clientY,touches,deltaX,deltaY,ctrlKey,metaKey,shiftKey,pointerType,isPrimary,button,buttons} = e;
  const data = {type,defaultPrevented,clientX,clientY,touches,deltaX,deltaY,ctrlKey,metaKey,shiftKey,pointerType,isPrimary,button,buttons};
  const debugBox = document.querySelector('#debugBox');
  if ( debugBox ) {
    debugBox.insertAdjacentHTML('afterbegin', `<p style="max-width:90vw;"><code><pre>${JSON.stringify(data,null,2)}</code></pre></p>`);
  } else {
    if ( deviceIsMobile() ) {
      alert("No debugBox found");
    } else {
      throw new Error("No element with ID 'debugBox' found.");
    }
  }
}

export function Range(...args) {
  return [...genrange(...args)];
}

export function* genrange(a, b, inc = +1) {
  let i = a;
  for( let i = a; i <=b; i += inc ) {
    yield i;
  }
}

// debug logging
export function logit(info) {
  if ( ! DEBUG.val ) return;
  const debugBox = document.querySelector('#debugBox');
  if ( debugBox ) {
    debugBox.insertAdjacentHTML('afterbegin', `<p style="max-width:90vw;"><code><pre>${JSON.stringify(info,null,2)}</code></pre></p>`);
  } else {
    throw new Error("No element with ID 'debugBox' found.");
  }
}


export async function untilTrue(pred, waitOverride = MIN_WAIT, maxWaits = MAX_WAITS, failCallback) {
  let waitCount = 0;
  let resolve;
  let reject;
  const pr = new Promise((res, rej) => (resolve = res, reject = rej));
  setTimeout(checkPred, 0);
  return pr;

  function checkPred() {
    try {
      DEBUG.debugUntilTrue && console.log('Checking', pred);
      DEBUG.debugUntilTrue && console.log('Pred result? ' + pred());
      if ( pred() ) {
        return resolve(true);
      } else {
        waitCount++;
        if ( waitCount < maxWaits ) {
          setTimeout(checkPred, waitOverride);
        } else if ( typeof failCallback == "function" ) {
          failCallback(reject); 
        }
      }
    } catch(e) {
      console.error(`Predicate failure`, pred, e);
      throw e;
    }
  }
}

export async function untilHuman(pred) {
  return untilTrue(pred, 618, 100*60*72); // wait for 3 days 
}

export async function untilTrueOrTimeout(pred, seconds) {
  return untilTrue(pred, 500, 2*seconds, reject => reject(`Checking predicate (${pred}) timed out after ${seconds} seconds.`));
}

export function randomInterval(func, minGap, maxGap) {
  if ( minGap > maxGap ) throw new TypeError(`minGap needs to be less than maxGap for function randomInterval`);

  const controller = new AbortController();
  const { signal } = controller;
  let timeoutIdClosure;

  signal.addEventListener('abort', () => clearTimeout(timeoutIdClosure));

  repeater();

  return { 
    abort() {
      controller.abort();
    }
  };

  async function repeater() {
    const nextWait = Math.ceil(minGap + Math.random()*(maxGap-minGap));

    if ( signal.aborted ) {
      return;
    }

    try {
      await func();
    } catch(e) {
      console.warn(`Error when calling function at randomInterval. Error: ${e}\nFunction: ${func}`);
    }

    if ( signal.aborted ) {
      return;
    }

    timeoutIdClosure = setTimeout(repeater, nextWait);
  }
}

export function clearRandom(interval) {
  if ( typeof interval.abort == "function" ) {
    interval.abort();
  }
}
