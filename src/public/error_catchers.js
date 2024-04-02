import {DEBUG, deviceIsMobile as isMobile} from './voodoo/src/common.js';

setupErrorCatchers();

export default function setupErrorCatchers() {
  (DEBUG.dev || DEBUG.err) && (self.onerror = (...v) => (func()(v, extractMeat(v).message, extractMeat(v).stack, v+''), true));
  (DEBUG.dev || DEBUG.err) && (self.onunhandledrejection = (thing) => {
    if ( DEBUG.promiserejection ) {
      const {code, message, name} = (thing?.reason || {});
      func()(thing, JSON.stringify({
        type: thing?.type,
        code, message, name
      }, null,2));
    }
    thing.preventDefault();
    return true;
  });
}

function extractMeat(list) {
  const meatIndex = list.findIndex(val => !! val && val.message || val.stack);
  if ( meatIndex == -1 || meatIndex == undefined ) {
    return "";
  } else {
    return list[meatIndex];
  }
}

function func() {
  if ( isMobile() ) {
    return (...x) => {
      for( const m of x ) {
        try {
          alert(m);
          alert(JSON.stringify(m));
        } catch(e) {
          alert('could not stringify error: ' + m);
        }
      }
    };
  } else {
    return (a, ...x) => (console.log(a), console.log(...x));
  }
}

