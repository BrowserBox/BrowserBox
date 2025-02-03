import {CONFIG, iden, deviceIsMobile, throttle, DEBUG, elogit} from './common.js';
import {cloneKeyEvent} from './constructor.js';
import {s as R, c as X} from '../node_modules/bang.html/src/vv/vanillaview.js';
import * as Subviews from './subviews/index.js';
import {CTX_MENU_THRESHOLD} from './subviews/contextMenu.js';
import {getBitmapCoordinates} from './transformEvent.js';

export const subviews = Subviews;

//const DEFAULT_URL = 'https://google.com';
//const isIOS = navigator.platform && navigator.platform.match("iPhone|iPod|iPad");
const USE_INPUT_MODE = true;

// for bang
const audio_port = Number(CONFIG.mainPort ? CONFIG.mainPort : ( location.protocol == 'https' ? 443 : 80 ) ) - 2;
export const audio_login_url = CONFIG.isOnion ? 
  `${location.protocol}//${localStorage.getItem(CONFIG.audioServiceFileName)}/login?token=${encodeURIComponent(globalThis._sessionToken())}` 
  : 
  `${location.protocol}//${location.hostname}:${audio_port}/login?token=${encodeURIComponent(globalThis._sessionToken())}` 
;

// MIGRATE
export function component(state) {
  const {H,/*sizeBrowserToBounds,*/ asyncSizeBrowserToBounds, emulateNavigator, bondTasks, /*installFrameListener,*/ canvasBondTasks} = state;
  const audio_url = `${location.protocol}//${location.hostname}:${audio_port}/`;
  //const FocusBorrowerSel = '[name="address"], #selectinput, .control';

  // FIXME: causing no keys to work
  const viewState = Object.assign({}, {
    touchX: 0, touchY: 0,
    textarea: null,
    keyinput: null,
    canvasEl: null,
    viewFrameEl: null,
    shouldHaveFocus: null,
    // FIXME: causing no keys to work
    focusTextarea, blurTextarea,
    focusKeyinput, blurKeyinput
  }, state.viewState);

  state.viewState = viewState;
  //const {viewState} = state;
  DEBUG.val && console.log('merged set viewstate!');
  state.startTimer = startTimer;
  state.endTimer = endTimer;

  const toggleVirtualKeyboard = e => {
    e?.preventDefault?.();
    let el = viewState.shouldHaveFocus;
    if ( el ) {
      if ( el == viewState.keyinput ) {
        blurKeyinput(); 
      } else if ( el == viewState.textarea ) {
        blurTextarea();
      }
    } else {
      focusKeyinput();
    }
  };

  const retargetTab = e => retargetTabToRemote(e,H);
  state.retargetTab = retargetTab;
  state.toggleVirtualKeyboard = toggleVirtualKeyboard;

  // this will likely have to be updated for iOS since "keyboard summons by focus" MUST 
  // be triggered by a user action, I believe, and I think it will not work after a setTimeout

  /*const refocusMeIfNotAllowedBorrower = (e, view_state) => {
    const me = e.target;
    setTimeout(() => {
      const active = document.deepActiveElement;
      if ( !! active && active.matches ) {
        if ( ! active.matches(FocusBorrowerSel) && view_state.shouldHaveFocus == me ) {
          me.focus();
        }
      }
    }, 50);
  };*/

  const retargetTouchScroll = e => retargetTouchScrollToRemote(e,H,viewState);

  Object.assign(state, {
    retargetTouchScrollToRemote,
    retargetTouchScroll,
  });
  
  bondTasks.unshift(el => state.viewState.voodooEl = el);
  bondTasks.push(() => self._voodoo_resizeAndReport());

  return;

  function isBundle() {
    return location.pathname == "/bundle.html";
  }

  function focusKeyinput(type, inputmode, value = '') {
    const {viewState} = state;
    viewState.keyinput.type = type || viewState.keyinput.type || 'text';
    if ( USE_INPUT_MODE ) {
      viewState.keyinput.inputmode = inputmode || 'text';
    }
    viewState.keyinput.value = value || viewState.keyinput.value;
    if ( document.deepActiveElement != viewState.keyinput ) {
      viewState.keyinput.focus({preventScroll:true});
    }
    viewState.shouldHaveFocus = viewState.keyinput;
  }

  function blurKeyinput() {
    const {viewState} = state;
    if ( document.deepActiveElement == viewState.keyinput )
      viewState.keyinput.blur();
    viewState.keyinput.value = '';
    viewState.shouldHaveFocus = null;
  }

  function focusTextarea(inputmode = 'text', value = '') {
    const {viewState} = state;
    if ( USE_INPUT_MODE ) { 
      viewState.textarea.inputmode = inputmode;
    }
    //viewState.textarea.value = value;
    if ( document.deepActiveElement != viewState.textarea ) {
      viewState.textarea.focus({preventScroll:true});
    }
    viewState.shouldHaveFocus = viewState.textarea;
  }

  function blurTextarea() {
    const {viewState} = state;
    if ( document.deepActiveElement == viewState.textarea ) 
      viewState.textarea.blur();
    viewState.textarea.value = '';
    viewState.shouldHaveFocus = null;
  }
}

// helper functions
  export function saveCanvas(canvasEl, state) {
    DEBUG.val && console.log("Setting canvas", canvasEl, state);
    self._states.push(state);
    state.viewState.canvasEl = canvasEl;
    state.viewState.ctx = canvasEl.getContext('2d');
  }

  function startTimer(e, viewState) {
    const {pointerId:pointerId = 'default'} = e;

    viewState[pointerId] = performance.now();
  }

  function endTimer(e, viewState) {
    const {pointerId:pointerId = 'default'} = e;

    viewState[pointerId] = performance.now() - viewState[pointerId];

    // MIGRATE (to class static field on BBContextMenu)
    if ( viewState[pointerId] > CTX_MENU_THRESHOLD ) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  function retargetTouchScrollToRemote(event, H, viewState) {
    const {type} = event;
    const {target} = event;
    const {changedTouches:changes} = event;
    if ( changes.length > 1 ) return;
    const touch = changes[0];
    const {clientX,clientY} = touch;
    const {bitmapX,bitmapY} = getBitmapCoordinates({target,clientX,clientY}, viewState.scale, viewState.bounds);
    if ( type == 'touchmove' ) {
      event.preventDefault();
      const deltaX = Math.ceil(viewState.touchX - bitmapX);
      const deltaY = Math.ceil(viewState.touchY - bitmapY);
      viewState.killNextMouseReleased = true;
      H({
        synthetic: true,
        type: "touchscroll",
        bitmapX, bitmapY,
        deltaX, deltaY,
        event: event,
        contextId: viewState.latestScrollContext
      });
    }
    viewState.touchX = bitmapX;
    viewState.touchY = bitmapY;
  }

  function retargetTabToRemote(event, H) {
    if ( event.key !== "Tab" ) return;
    event.preventDefault();
    event.stopPropagation();
    const ev = cloneKeyEvent(event, true);
    H(ev);
  }
