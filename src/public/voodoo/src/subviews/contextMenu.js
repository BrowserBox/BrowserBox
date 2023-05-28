import {untilTrue, DEBUG, BLANK, deviceIsMobile} from '../common.js';
import {s as R, c as X} from '../../node_modules/bang.html/src/vv/vanillaview.js';

export const makeContextMenuBondTasks = state => [
  el => {
    // only have 1 context menu at a time
    const component = el.getRootNode().host;
    state.viewState.contextMenu = component;
  },
  () => self.addEventListener('click', function remove(click) {
    // if we clicked outside the menu, 
    // remove the menu and stop listening for such clicks
    DEBUG.val && console.log({click});
    if ( ! click.target.closest('.context-menu') ) {
      self.removeEventListener('click', remove);
      if ( state._top.viewState.contextMenu ) {
        state._top.viewState.contextMenu.close(state, false);
      }
    } 
  }),
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
    if ( pageX === undefined || pageY === undefined ) {
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

export const CTX_MENU_THRESHOLD = 375;

export function makeContextMenuHandler(state, node = {type:'page', id: 'current-page'}) {
  const {/*id, */ type:nodeType} = node;

  return contextMenu => {
    const menuItems = CONTEXT_MENU(state)[nodeType];
    // we need this check because we attach a handler to each node
    // we could use delegation at the container of the root node
    // but for now we do it like this
    if ( navigator.vibrate ) {
      try {
        navigator.vibrate(100);
      } catch(e) {
        console.warn('error vibrating', e);
      }
    }
    if ( contextMenu.currentTarget.contains(contextMenu.target) ) {
      DEBUG.debugContextMenu && console.log(`Check 1`);
      let pageX, pageY;
      if ( contextMenu.pageX && contextMenu.pageY ) {
        ({pageX, pageY} = contextMenu);
      } else {
        const {clientX, clientY} = contextMenu.detail;
        ({pageX, pageY} = contextMenu.detail);
        Object.assign(contextMenu, {pageX, pageY, clientX, clientY});
      }
      // cancel click for chrome mobile
      // (note: this does not work as intended. 
      // It does not cancel a touch click on contextmenu open)
      // so it's commented out
      // state.H({type:'touchcancel'});
      // the actual way to kill the click is 
      // by killing the next mouse release like so:
      state.viewState.killNextMouseReleased = true;
      state.viewState.contextMenuClick = contextMenu;

      // we also stop default context menu
      contextMenu.preventDefault();
      contextMenu.stopPropagation();
      const bondTasks = [
        el => {
          // only have 1 context menu at a time
          close(state, false);
          state.viewState.contextMenu = el;
        },
        () => self.addEventListener('click', function remove(click) {
          // if we clicked outside the menu, 
          // remove the menu and stop listening for such clicks
          if ( ! click.target.closest('.context-menu') ) {
            close(state, false);
            self.removeEventListener('click', remove);
          } 
        }),
        el => {
          const x = pageX + 'px';
          const y = pageY + 'px';
          //const x = contextMenu.clientX + 'px';
          //const y = contextMenu.clientY + 'px';
          console.log({w: el.scrollWidth, h: el.scrollHeight});
          if ( (pageX + el.scrollWidth) > globalThis.window.innerWidth )  {
            el.style.right = '8px';
          } else {
            el.style.left = x;
          }
          if ( pageY + el.scrollHeight > ( globalThis.window.innerHeight - 32 ))  {
            el.style.bottom = '48px';
          } else {
            el.style.top = y;
          }
          el.style.visibility = 'visible';
        }
      ];
      const menuView = X`
        <aside class=context-menu 
          role=menu 
          bond=${bondTasks}
          contextmenu=${e => (
            /* don't trigger within the menu */
            e.preventDefault(), 
            e.stopPropagation()
          )}
        >
          <!--
          <h1>Context Menu</h1> 
          <hr>
          -->
          <menu>
            ${menuItems.map(({title,func,hr}) => X`
              ${hr?X`<hr>`:''}
              <li click=${click => func(click, state)}>${title}</li>
            `)}
          </menu>
        </aside>
      `;
      menuView.to(contextMenu.currentTarget, 'afterEnd');
    }
  };
}


