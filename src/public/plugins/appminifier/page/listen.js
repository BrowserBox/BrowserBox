import {controlChars} from '../../../voodoo/src/transformEvent.js';
import * as Exception from './exceptions.js';
import {installScrollWatcher} from './listeners/scroll.js';
import {installHashFragmentController, installSyntheticHashChanger} from './listeners/hash.js';
import {installFocusDebug, installSyntheticFocus} from './listeners/focus.js';
import {se, getViewWindow, LastInput, LastMouse} from './helpers.js';

const KEYINPUT = new Set([
  'keydown', 'keypress', 'keyup', 'input', 'compositionstart', 'compositionupdate', 'compositionend'
]);

const Exceptions = new Map();
const capture = ['mousedown', 'mouseup', 'pointerdown', 'pointerup'];
const allow = ['keydown', 'keypress', 'keyup', 'input', 'compositionstart', 'compositionupdate', 'compositionend'];
const passive = ['touchstart', 'touchmove', 'mousemove', 'pointermove'];
const cancel = ['click', 'submit'];
const exceptions = ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'click'];

installListeners();

function installListeners() {
  parent.addEventListener('touchstart', function doNothingWith(event) {});
  document.addEventListener('touchstart', function doNothingWith(event) {});

  capture.forEach(event => listen(event, true));
  allow.forEach(event => listen(event, false));
  passive.forEach(event => listen(event, false, true));
  cancel.forEach(e => getViewWindow().addEventListener(e, ev => {
    if ( allowException(ev) ) return;
    ev.preventDefault() && ev.stopPropagation();
  }));

  exceptions.forEach(name => registerException(name, Exception.anchorException));
  exceptions.forEach(name => registerException(name, Exception.selectException));
  exceptions.forEach(name => registerException(name, Exception.radioException));
  exceptions.forEach(name => registerException(name, Exception.checkboxException));
  exceptions.forEach(name => registerException(name, Exception.keyInputException));
  exceptions.forEach(name => registerException(name, Exception.detailsSummaryException));

  installScrollWatcher();
  installHashFragmentController();
  installSyntheticHashChanger();
  installFocusDebug();
  installSyntheticFocus();
}

function listen(type, cancel = true, passive = false) {
  getViewWindow().addEventListener(type, e => {
    try {
      if ( cancel && ! allowException(e) ) {
        e.preventDefault && e.preventDefault();
      } 
      if ( e.type.endsWith('move') ) {
        const {target,clientX,clientY,pageX,pageY} = e.touches ? e.touches[0] : e;
        Object.assign(LastMouse,{clientX,clientY,pageX,pageY,target});
      } else if ( e.type == 'touchstart' ) {
        const {target,clientX,clientY,pageX,pageY} = e.touches[0];
        Object.assign(LastMouse,{clientX,clientY,pageX,pageY,target});
      } else if ( KEYINPUT.has(e.type) ) {
        // this causes a problem because we are canceling some type of key events effectively 
        // by not sending them to top if they are not controls and if they do not change the value
        //if ( ! inputValueDiffers(e, LastInput) && ! controlChars.has(e.key) ) return;
        e.vRetargeted = e.key == "Tab";
        LastInput.target = e.target;
        LastInput.value = e.target.value;
      }
      let data = {};
      if ( e.target.matches && e.target.matches('[contenteditable]') ) {
        data = {contenteditableTarget:true}; 
      } else if ( e.target.matches && e.target.matches('select') ) {
        data = {selectInput:true, target:{ value: e.target.value }};
      }
      se(e, data);
    } catch(e) {
      console.warn(e);
    }
  }, {passive});
}

function registerException(name, func) {
  let exceptions = Exceptions.get(name);
  if ( !exceptions ) {
    exceptions = [];
    Exceptions.set(name, exceptions);
  }
  exceptions.push(func); 
}

function allowException(e) {
  const {type} = e;
  const exceptions = Exceptions.get(type);
  if ( exceptions ) {
    return exceptions.some(except => except(e)); 
  }
  return false;
}

