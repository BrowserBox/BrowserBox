import {untilTrue, CONFIG, DEBUG, BLANK, deviceIsMobile} from '../common.js';
import {s as R, c as X} from '../../node_modules/bang.html/src/vv/vanillaview.js';

export const makeContextMenuBondTasks = state => [
  el => {
    // only have 1 context menu at a time
    const component = el.getRootNode().host;
    state.viewState.contextMenu = component;
  },
  () => {
    if ( state.contextMenuGlobalClick ) return;
    state.contextMenuGlobalClick = true;
    self.addEventListener('click', function remove(click) {
      // if we clicked outside the menu, 
      // remove the menu and stop listening for such clicks
      DEBUG.val && console.log({click});
      DEBUG.debugContextMenu && console.log("Click target", click.target);
      if ( state.ignoreNextClickEvent ) {
        DEBUG.debugContextMenu && console.log("Not closing menu because ignoring this click event", click.target);
        click.preventDefault();
        click.stopPropagation();
        state.ignoreNextClickEvent = false;
        return;
      }
      if ( ! click.target.closest('.context-menu') ) {
        DEBUG.debugContextMenu && console.log(`Removing context menu global click closer`);
        self.removeEventListener('click', remove, {capture: true});
        state.contextMenuGlobalClick = false;
        if ( state._top.viewState.contextMenu ) {
          DEBUG.debugContextMenu && console.log(`Closing context menu because it is open`);
          state._top.viewState.contextMenu.close(state, false);
        } else {
          DEBUG.debugContextMenu && console.log(`NOT closing context menu because it is NOT open`);
        }
      } 
    }, {capture: true});
  },
  async el => {
    DEBUG.debugContextMenu && console.log(`Check 2`, el);
    await untilTrue(() => !!state.contextMenuEvent);
    await untilTrue(() => !!state?.viewState?.contextMenu?.matches('.bang-styled'));
    DEBUG.debugContextMenu && console.log(`Check 3`);
    const contextMenu = state.contextMenuEvent;
    if ( ! contextMenu ) {
      console.log(`context menu event, not arrived yet`);
      return;
    } else {
      (DEBUG.debugContextMenu || DEBUG.val) && console.log('Context menu Event' , contextMenu);
    }
    let pageX, pageY;
    if ( contextMenu?.detail?.pageX !== undefined ) {
      ({pageX, pageY} = contextMenu.detail);
    } else {
      ({pageX, pageY} = contextMenu);
    }
    if ( CONFIG.centerContextMenuOnMobile && deviceIsMobile() || pageX === undefined || pageY === undefined ) {
      pageX = (globalThis.window.innerWidth - el.scrollWidth)/2;
      pageY = (globalThis.window.innerHeight - el.scrollHeight)/2;
    }
    const x = pageX + 'px';
    const y = pageY + 'px';
    DEBUG.debugContextMenu && console.log(`Check 4`, {x,y});
    const component = el.getRootNode().host;
    if ( (pageX + el.scrollWidth) > ( globalThis.window.innerWidth  - 8) )  {
      component.style.right = '4px';
    } else {
      component.style.left = x;
    }
    if ( pageY + el.scrollHeight > ( globalThis.window.innerHeight - 8 ))  {
      component.style.bottom = '4px';
    } else {
      component.style.top = y;
    }
    component.style.visibility = 'visible';
  }
];

export const CTX_MENU_THRESHOLD = DEBUG.debugContextMenu ? 375 : 375;


