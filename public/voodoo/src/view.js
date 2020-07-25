import {throttle,DEBUG} from './common.js';
import {cloneKeyEvent} from './constructor.js';
import {d as R} from '../node_modules/dumbass/r.js';
import * as Subviews from './subviews/index.js';
import {dss, stylists} from './styles.js';
import {getBitmapCoordinates} from './transformEvent.js';

export const subviews = Subviews;

//const DEFAULT_URL = 'https://google.com';
//const isIOS = navigator.platform && navigator.platform.match("iPhone|iPod|iPad");
const USE_INPUT_MODE = false;

export function component(state) {
  const {H,/*sizeBrowserToBounds,*/ asyncSizeBrowserToBounds, emulateNavigator, bondTasks, /*installFrameListener,*/ canvasBondTasks} = state;
  const audio_port = Number(location.port ? location.port : ( location.protocol == 'https' ? 443 : 80 ) ) - 2;
  const audio_url = `${location.protocol}//${location.hostname}:${audio_port}/`;
  //const FocusBorrowerSel = '[name="address"], #selectinput, .control';
  const viewState = Object.assign(state.viewState, {
    touchX: 0, touchY: 0,
    textarea: null,
    keyinput: null,
    canvasEl: null,
    viewFrameEl: null,
    shouldHaveFocus: null,
    focusTextarea, blurTextarea,
    focusKeyinput, blurKeyinput
  });

  state.viewState = viewState;

  const toggleVirtualKeyboard = e => {
    e.preventDefault();
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
      const active = document.activeElement;
      if ( !! active && active.matches ) {
        if ( ! active.matches(FocusBorrowerSel) && view_state.shouldHaveFocus == me ) {
          me.focus();
        }
      }
    }, 50);
  };*/

  const retargetTouchScroll = e => retargetTouchScrollToRemote(e,H,viewState);
  
  bondTasks.unshift(el => state.viewState.voodooEl = el);
  bondTasks.push(() => dss.initializeDSS(state, stylists));
  bondTasks.push(() => {
    document.addEventListener('keydown', event => {
      if ( !event.target.matches('body') || state.viewState.shouldHaveFocus ) return;
      if ( event.code == "Space" ) {
        state.H({
          type: 'wheel',
          target: state.viewState.canvasEl,
          pageX: 0,
          pageY: 0,
          clientX: 0,
          clientY: 0,
          deltaMode: 2,
          deltaX: 0, 
          contextId: state.viewState.latestScrollContext,
          deltaY: event.shiftKey ? -0.618 : 0.618
        });
        //event.preventDefault();
      } else if ( event.key == "Tab" ) {
        retargetTab(event);
      } else if ( event.key == "Enter" ) {
        H(cloneKeyEvent(event, true));
      }
    });
    document.addEventListener('keyup', event => {
      if ( !event.target.matches('body') || state.viewState.shouldHaveFocus ) return;
      if ( event.key == "Enter" ) {
        H(cloneKeyEvent(event, true));
      }
    });
  });

  subviews.startBandwidthLoop(state);

  state.viewState.draw = () => {
    return R`
      <main class="voodoo" bond=${bondTasks} stylist="styleVoodooMain">
        ${subviews.BandwidthIndicator(state)}
        ${subviews.TabList(state)}
        ${subviews.Controls(state)}
        <article class=tab-viewport stylist="styleTabViewport styleContextMenu">
          ${subviews.LoadingIndicator(state)}
          ${state.useViewFrame ? (
              state.demoMode ?  
                R`
                  <iframe name=viewFrame 
                    scrolling=yes
                    src=/plugins/demo/index.html
                    load=${[
                      loaded => loaded.target.hasLoaded = true, 
                      state.installFrameListener, 
                      ...canvasBondTasks
                    ]}
                    bond=${[
                      el => state.viewState.viewFrameEl = el, 
                      asyncSizeBrowserToBounds, 
                      emulateNavigator, 
                      ...canvasBondTasks
                    ]}
                  ></iframe>
                ` : 
                state.factoryMode ? 
                  R`
                    <iframe name=viewFrame 
                      scrolling=yes
                      load=${[loaded => loaded.target.hasLoaded = true, ...canvasBondTasks]}
                      bond=${[
                        el => state.viewState.viewFrameEl = el, 
                        asyncSizeBrowserToBounds, 
                        emulateNavigator, 
                        state.installFrameListener, 
                        ...canvasBondTasks, 
                        el => el.src = `/plugins/projector/${isBundle()? 'bundle' : 'index'}.html`
                      ]}
                    ></iframe>
                  ` 
                  :
                  R`
                    <iframe name=viewFrame 
                      scrolling=yes
                      load=${[loaded => loaded.target.hasLoaded = true, ...canvasBondTasks]}
                      bond=${[
                        el => state.viewState.viewFrameEl = el, 
                        asyncSizeBrowserToBounds, 
                        emulateNavigator, 
                        state.installFrameListener, 
                        ...canvasBondTasks, 
                        el => el.src = `/plugins/appminifier/${isBundle()? 'bundle' : 'index'}.html`
                      ]}
                    ></iframe>
                  ` 
            ) :
            R`
              <canvas
                click=${() => {
                  if ( viewState.shouldHaveFocus && document.activeElement != viewState.shouldHaveFocus ) {
                    viewState.shouldHaveFocus.focus(); 
                  }
                }}
                bond=${[saveCanvas, asyncSizeBrowserToBounds, emulateNavigator, ...canvasBondTasks]}
                touchstart:passive=${retargetTouchScroll}
                touchmove=${[
                  e => e.preventDefault(), 
                  throttle(retargetTouchScroll, state.EVENT_THROTTLE_MS)
                ]}
                wheel:passive=${throttle(H, state.EVENT_THROTTLE_MS)}
                mousemove:passive=${throttle(H, state.EVENT_THROTTLE_MS)}         
                mousedown=${H}         
                mouseup=${H}         
                pointermove:passive=${throttle(H, state.EVENT_THROTTLE_MS)}         
                pointerdown=${H}         
                pointerup=${H}         
                contextmenu=${subviews.makeContextMenuHandler(state)}
              ></canvas>
            `
          }
          <select id=selectinput stylist="styleSelectInput"
            input=${e => H({
              synthetic: true,
              type: "select",
              state,
              event: e
            })}
            >
            <option value="" disabled>Select an option</option>
          </select>
        </article>
        ${subviews.Modals(state)}
      </main>
      <audio bond=${el => self.addEventListener('click', () => el.play(), {once:true})} autoplay loop id=audio>
        <source src="${audio_url}" type=audio/mp3>
      </audio>
      ${DEBUG.pluginsMenu ? subviews.PluginsMenu(state) : ''}
    `;
  };

  state.viewState.dss = dss;

  return state.viewState.draw();

  function isBundle() {
    return location.pathname == "/bundle.html";
  }

  function focusKeyinput(type = 'text', inputmode = 'text', value = '') {
    const {viewState} = state;
    viewState.keyinput.type = type;
    if ( USE_INPUT_MODE ) {
      viewState.keyinput.inputmode = inputmode;
    }
    //viewState.keyinput.value = value;
    if ( document.activeElement != viewState.keyinput ) {
      viewState.keyinput.focus({preventScroll:true});
    }
    viewState.shouldHaveFocus = viewState.keyinput;
  }

  function blurKeyinput() {
    const {viewState} = state;
    if ( document.activeElement == viewState.keyinput )
      viewState.keyinput.blur();
    viewState.shouldHaveFocus = null;
  }

  function focusTextarea(inputmode = 'text', value = '') {
    const {viewState} = state;
    if ( USE_INPUT_MODE ) { 
      viewState.textarea.inputmode = inputmode;
    }
    //viewState.textarea.value = value;
    if ( document.activeElement != viewState.textarea ) {
      viewState.textarea.focus({preventScroll:true});
    }
    viewState.shouldHaveFocus = viewState.textarea;
  }

  function blurTextarea() {
    const {viewState} = state;
    if ( document.activeElement == viewState.textarea ) 
      viewState.textarea.blur();
    viewState.shouldHaveFocus = null;
  }

  function saveCanvas(canvasEl) {
    state.viewState.canvasEl = canvasEl;
    state.viewState.ctx = canvasEl.getContext('2d');
  }
}

// helper functions
  function retargetTouchScrollToRemote(event, H, viewState) {
    const {type} = event;
    const {target} = event;
    const {changedTouches:changes} = event;
    if ( changes.length > 1 ) return;
    const touch = changes[0];
    const {clientX,clientY} = touch;
    const {bitmapX,bitmapY} = getBitmapCoordinates({target,clientX,clientY});
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
