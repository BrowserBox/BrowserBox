import {SERVICE_COUNT, DEBUG} from '../common.js';
import {s as R} from '../../node_modules/bang.html/src/vv/vanillaview.js';
import {SidebarMenuButton} from './sidebarMenuButton.js';

const WAIT_FOR_ANY_ACK = 300;
let handlerClosure;
export function SidebarMenu(state, {
      bondTasks: bondTasks = [], 
    } = {}) {

  const PPTRURL = new URL(location);
  PPTRURL.pathname = '/pptr';

  if ( handlerClosure === undefined ) {
    handlerClosure = loadEvent => {
      const {target} = loadEvent;
      setTimeout(
        () => sendToken(target, PPTRURL, state), 
        WAIT_FOR_ANY_ACK
      );
    };
  }

  DEBUG.val && console.log({sessionToken:state.sessionToken});
  return R`
    <nav class=sidebar-menu 
      bond=${[
        el => state.viewState.smEl = el, 
        /*() => console.log(`SMA?${!!state.sidebarMenuActive}`),*/
        () => self.addEventListener('message', stopTryingToLogin(state)),
        ...bondTasks
      ]} 
      stylist="styleSidebarMenu"
    >
      <aside>
        <article>
          <iframe 
            name=pptr_console
            bond=${frame => setSRC(frame)}
            load=${handlerClosure} 
            frameborder=0 seamless
          ></iframe>
        </article>
      </aside>
    </nav>
  `;

  function setSRC(frame) {
    frame.setAttribute('src', PPTRURL.href);
    DEBUG.val && console.log(`Set src`, frame);
  }
}

function sendToken(frame, target, state) {
  // handlerClosure becomes undefined after we received 
  // acknowledgement from the frame that it logged in
  if ( handlerClosure === undefined ) return;

  const {sessionToken} = state;

  if ( frame ) {
    (frame.postMessage ? frame : frame.contentWindow).postMessage(
      {login:true,sessionToken}, 
      target.origin
    );
  }
  // we do the following devtools login from the pptr frame now
  DEBUG.val && console.log(`Posted token`, sessionToken);
}

function stopTryingToLogin(state) {
  const mHandler = ({origin, data, source}) => {
    const originUrl = new URL(origin);
    if ( parseInt(originUrl.port) === (parseInt(CONFIG.mainPort) - 1) ) {
      // pptr guy
      const {ack} = data;
      if ( ack && ack.arrived ) {
        state.loggedInCount += 1;
        if ( state.loggedInCount >= SERVICE_COUNT ) {
          self.removeEventListener('message', mHandler);
          state.sessionToken = null;
          DEBUG.val && console.log(`Everyone logged in`);
        }
        const frame = document.querySelector('iframe[name="pptr_console"]');
        if ( frame ) {
          frame.removeEventListener('load', handlerClosure);
        }
        handlerClosure = undefined;
      }
    } else if ( parseInt(originUrl.port) === (parseInt(CONFIG.mainPort) + 1 ) ) {
      DEBUG.val && console.log(origin, data);
      // devtools guy
      const {request} = data;
      if ( request.sessionToken ) {
        sendToken(source, originUrl, state);
        state.loggedInCount += 1;
        if ( state.loggedInCount >= SERVICE_COUNT ) {
          self.removeEventListener('message', mHandler);
          state.sessionToken = null;
          console.log(`Everyone logged in`);
        }
      }
    } else if ( parseInt(originUrl.port) === (parseInt(CONFIG.mainPort) + 2 ) ) {
      // chat guy
      const {request} = data;
      if ( request && request.sessionToken ) {
        sendToken(source, originUrl, state);
        state.loggedInCount += 1;
        if ( state.loggedInCount >= SERVICE_COUNT ) {
          self.removeEventListener('message', mHandler);
          state.sessionToken = null;
          console.log(`Everyone logged in`);
        }
      }
    }
  };
  return mHandler;
}
