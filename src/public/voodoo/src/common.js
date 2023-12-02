export const SERVICE_COUNT = 4; // pptr(menu), chat, audio, devtools
export const FRAME_CONTROL = false;

export const VERSION = '3.14159265358979323846264338327950';
export const SafariPlatform = /^((?!chrome|android).)*safari/i;
const MobilePlatform = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
const FirefoxPlatform = /firefox/i;

export const iden = e => e;
export const isSafari = () => SafariPlatform.test(navigator.userAgent);

export const BLANK = "about:blank";
export const USE_DDG = true;
const MIN_WAIT = 50;
const MAX_WAITS = 200;

export const OPTIONS = {
  showBWStatus: true,
  showTorStatus: true,
  showAudioStatus: true,
  showWebRTCStatus: true,
  useSystemColorScheme: true,
  useDarkMode: false,
};

export const DEBUG = Object.freeze({
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
  debugElementInfo: false,
  coords: false,
  debugBitmapCoordConversion: false,
  debugEventChains: false,
  debugEventQueue: false,
  HFUNCTION: false,
  debugCopyPaste: false,
  trackLoading: true,
  debugAudioAck: false,
  debugFastest: false,
  get useStraightAudioStream() {
    return location.host.endsWith('.onion') || false;
  },
  get includeAudioElementAnyway() {
    return isSafari() || deviceIsMobile() || this.useStraightAudioStream;
  },
  scaleImage: true,       // scaleImage: false centers the remote image if it's smaller than local viewport (large screens))
  centerImage: false,
  dontEnforceOnlineCheck: true,
  newUI: true,
  get useWindowOpenForSecureView() {
    return true && ! deviceIsMobile();
  },
  showCollect: false,
  debugFocus: false,
  debugAuth: false,
  debugAudio: false,
  debugModal: false,
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
  clientsCanResetViewport: true,
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
  encforceKeyOrdering: true,
  useTopLevelControlKeyListeners: true,
  useTopLevelSendKeyListeners: false,
  get useServiceWorkerToCache() {
    return location.hostname !== 'localhost' && true;
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
      const isDark = globalThis.window.top.matchMedia("screen and (prefers-color-scheme: dark)");
      return isDark;
    }
    return OPTIONS.useDarkMode;
  }, 
  showModalOnFileDownload: false,
  settingsButton: false,
  useBlankWindowForProtocolLaunch: false,
  removeAudioStartHandlersAfterFirstStart: false, 
  uiDefaultOff: false,
  magicBar: false,
  audioServiceFileName: 'audio.srv',
  devtoolsServiceFileName: 'devtools.srv',
  sessionTokenFileName: 'session.tkn',
  get isOnion() {
    return location.host.endsWith('.onion')
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
  delayUnload: false,
}));

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
  return MobilePlatform.test(navigator.userAgent);
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
    DEBUG.debugUntilTrue && console.log('Checking', pred);
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
  }
}

export async function untilHuman(pred) {
  return untilTrue(pred, 618, 100*60*72); // wait for 3 days 
}

export async function untilTrueOrTimeout(pred, seconds) {
  return untilTrue(pred, 1000, seconds, reject => reject(`Checking predicate (${pred}) timed out after ${seconds} seconds.`));
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
