import {FRAME_CONTROL} from '../../translateVoodooCRDP.js';

export const VERSION = '3.1415926535897932384626338';
const SafariPlatform = /^((?!chrome|android).)*safari/i;
const MobilePlatform = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
const FirefoxPlatform = /firefox/i;

export const isSafari = () => SafariPlatform.test(navigator.userAgent);

export const BLANK = "about:blank";

export const DEBUG = {
  activateNewTab: false,
  frameControl: FRAME_CONTROL,
  pluginsMenu: false,
  serviceWorker: false,
  delayUnload: true,
  neonMode: false,
  resetCache: false,
  dev: true,
  val: 6,
  low: 1,
  med: 3,
  high: 5
};

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

export function isFirefox() {
  return FirefoxPlatform.test(navigator.userAgent);
}

export function deviceIsMobile() {
  return MobilePlatform.test(navigator.userAgent);
}

// debug logging
export function logitKeyInputEvent(e) {
  if ( ! DEBUG.val ) return;
  const {type,key,code,data,isComposing,inputType,composed,target:{value}} = e;
  const typingData = {key,code,type,data,isComposing,inputType,composed,value};
  const debugBox = document.querySelector('#debugBox');
  if ( debugBox ) {
    debugBox.insertAdjacentHTML('afterbegin', `<p style="max-width:90vw;"><code><pre>${JSON.stringify(typingData,null,2)}</code></pre></p>`);
  } else {
    throw new Error("No element with ID 'debugBox' found.");
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


