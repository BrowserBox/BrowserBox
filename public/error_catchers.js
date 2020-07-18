import {DEBUG} from './voodoo/src/common.js';

setupErrorCatchers();

export default function setupErrorCatchers() {
  DEBUG.dev && (self.onerror = (v) => (func()(v, extractMeat(v).message, extractMeat(v).stack, v+''), true));
  DEBUG.dev && (self.onerror = (v) => (console.log(v), true));
  DEBUG.dev && (self.onunhandledrejection = ({reason}) => (func()(JSON.stringify(reason,null,2)), true));
}

function isMobile() {
  return (typeof window.orientation !== "undefined") || (navigator.userAgent.indexOf('IEMobile') !== -1);
}

function func() {
  if ( isMobile() ) {
    return (x) => {
      console.log(x);
      //alert(JSON.stringify(x));
      //throw x[0];
    };
  } else {
    return (...x) => console.log(...x)
  }
}

function extractMeat(list) {
  const meatIndex = list.findIndex(val => !! val && val.message || val.stack);
  if ( meatIndex == -1 || meatIndex == undefined ) {
    return "";
  } else {
    return list[meatIndex];
  }
}


