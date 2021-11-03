import {deviceIsMobile} from '../common.js';
import {d as R, u as X} from '../../node_modules/dumbass/r.js';
import {openModal} from './index.js';

const CLOSE_DELAY = 222;
const SHORT_CUT = 'Ctrl+Shift+J';
//const FUNC = e => console.log("Doing it", e);

const CONTEXT_MENU = (state) => ({
  'page': [
    {
      title: 'Open link in new tab',
      shortCut: SHORT_CUT,
      func: openInNewTab,
    },
    {
      title: 'Save screenshot',
      shortCut: SHORT_CUT,
      func: download
    },
    {
      title: 'Reload',
      shortCut: SHORT_CUT,
      func: reload
    },
    {
      title: 'Copy text from here',
      shortCut: SHORT_CUT,
      func: copy,
      hr: true
    },
    {
      title: 'Copy link address from here',
      shortCut: SHORT_CUT,
      func: copyLink,
    },
    {
      title: 'Paste text',
      shortCut: SHORT_CUT,
      func: paste
    },
    //  This is blocked (apparently) on: https://bugs.chromium.org/p/chromium/issues/detail?id=1015260
    {
      title: 'New incognito tab',
      shortCut: SHORT_CUT,
      func: newBrowserContextAndTab,
      hr: true,
    },
    {
      title: 'Clear history',
      shortCut: SHORT_CUT,
      func: clearHistoryAndCacheLeaveCookies,
      hr: true,
    },
    {
      title: 'Wipe everything',
      shortCut: SHORT_CUT,
      func: clearBrowsingData,
    },
    {
      title: (
        document.fullscreenElement || 
        document.webkitFullscreenElement
      ) ? 
        'Exit full screen' : 
        'Full screen'
      ,
      shortCut: SHORT_CUT,
      func: fullScreen,
      hr: true,
    },
  ], 
});

export function ContextMenu(/*state*/) {
  return R`

  `;
}

export const CTX_MENU_THRESHOLD = 675;

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
      state.viewState.contextMenuClick = contextMenu;
      //state.viewState.killNextMouseReleased = true;

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
          if ( pageX + el.scrollWidth > innerWidth )  {
            el.style.right = '8px';
          } else {
            el.style.left = x;
          }
          if ( pageY + el.scrollHeight > ( innerHeight - 32 ))  {
            el.style.bottom = '48px';
          } else {
            el.style.top = y;
          }
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
          <h1>Menu</h1> 
          <hr>
          <ul>
            ${menuItems.map(({title,func,hr}) => X`
              ${hr?X`<hr>`:''}
              <li click=${click => func(click, state)}>${title}</li>
            `)}
          </ul>
        </aside>
      `;
      menuView.to(contextMenu.currentTarget, 'afterEnd');
    }
  };
}

function close(state, delay = true) {
  if ( delay ) {
    setTimeout(() => {
      if ( state.viewState.contextMenu ) {
        state.viewState.contextMenu.remove();
        state.viewState.contextMenu = null;
      }
    }, CLOSE_DELAY);
  } else {
    if ( state.viewState.contextMenu ) {
      state.viewState.contextMenu.remove();
      state.viewState.contextMenu = null;
    }
  }
}

/*function styleContextMenu(el, state) {
  return `
      * .context-menu {
        position: absolute;
        background: whitesmoke;
        box-shadow: 1px 1px 1px 1px grey;
        padding: 0.5em 0;
        min-width: 200px;
        z-index: 10;
      }

      * .context-menu h1 {
        margin: 0;
        font-size: smaller;
      }

      * .context-menu ul {
        margin: 0;
        padding: 0;
        font-size: smaller;
      }

      * .context-menu ul li {
        cursor: default;
      }
      
      * .context-menu li,
      * .context-menu h1 {
        padding: 0 1em;
      }

      * .context-menu ul li:hover {
        background: powderblue;
      }
  `;
}*/

// context menu option functions
  /**
    * This code is needed like this
    * so that paste works in mobile (Chrome) and on Desktop (Chrome and Firefox)
    *
  ****/

    function copy(click, state) {
      const contextClick = state.viewState.contextMenuClick;
      const {clientX,clientY, target} = contextClick;
      const {H} = state;
      close(state);
      state.elementInfoContinuation = ({innerText, noSuchElement}) => {
        if ( ! noSuchElement ) {
          state.elementInfoContinuation = null;
          openModal({modal:{type:'infobox', message: innerText, title: 'Text from page:'}}, state);
        }
      };
      H({
        type: 'getElementInfo',
        synthetic: true,
        data: {
          innerText: true,
          target,
          clientX, clientY
        }
      });
    }

    function copyLink(click, state) {
      const contextClick = state.viewState.contextMenuClick;
      const {clientX,clientY, target} = contextClick;
      const {H} = state;
      close(state);
      state.elementInfoContinuation = ({attributes, noSuchElement}) => {
        if ( ! noSuchElement ) {
          state.elementInfoContinuation = null;
          openModal({modal:{type:'infobox', message: attributes.href, title: 'Text from page:'}}, state);
        }
      };
      H({
        type: 'getElementInfo',
        synthetic: true,
        data: {
          closest: 'a[href]',
          attributes: ['href'],
          target,
          clientX, clientY
        }
      });
    }

    function paste(click, state) {
      close(state);
      const pasteData = prompt("Enter text to paste");
      const input = state.viewState.shouldHaveFocus;
      if ( ! input ) return;
      const value = input.value;
      const newValue = value.slice(0, input.selectionStart) + pasteData + value.slice(input.selectionEnd);
      input.value = newValue;
      input.selectionStart = input.selectionEnd;
      if ( document.activeElement !== input ) {
        input.focus();
      }
      state.H({
        type: 'typing',
        data: pasteData,
        synthetic: true,
        event: {paste: true, simulated: true}
      });
    }

    function download(click, state) {
      close(state);
      const timeNow = new Date();
      const stringTime = timeNow.toJSON(); 
      const fileName = stringTime.replace(/[-:.]/g, "_");
      const imageData = state.viewState.canvasEl.toDataURL();
      const downloader = document.createElement('a');
      downloader.href = imageData;
      Object.assign(downloader.style, {
        position: 'absolute',
        top: '0px',
        left: '0px',
        opacity: 0
      });
      downloader.download = `${fileName}.png`;
      document.body.appendChild(downloader);
      downloader.click();
      downloader.remove();
    }

    function reload(/*click, state*/) {
      const goButton = document.querySelector('form.url button.go');
      goButton.click();
    }

    function openInNewTab(click, state) {
      const contextClick = state.viewState.contextMenuClick;
      const {target,pageX,pageY,clientX,clientY} = contextClick;
      const {H} = state;
      state.viewState.killNextMouseReleased = false;
      if ( deviceIsMobile() ) {
        // we need to get the URL of the target link 
        // then use 
        // state.createTab(click, url);
        state.elementInfoContinuation = ({attributes, noSuchElement}) => {
          if ( ! noSuchElement ) {
            state.elementInfoContinuation = null;
            state.createTab(click, attributes.href);
          }
        };
        H({
          type: 'getElementInfo',
          synthetic: true,
          data: {
            closest: 'a[href]',
            attributes: ['href'],
            target,
            clientX, clientY
          }
        });
      } else {
        H({
          type: 'pointerdown',
          button: 0,
          ctrlKey: true,
          target,
          pageX, pageY,
          clientX, clientY,
          noShot: true
        });
        H({
          type: 'pointerup',
          button: 0,
          ctrlKey: true,
          target,
          pageX, pageY,
          clientX, clientY
        });
      }
      close(state);
    }

    function newBrowserContextAndTab(click, state) {
      const {H} = state;
      H({
        synthetic: true,
        type: 'newIncognitoTab',
        data: {}
      });
      close(state);
    }

    function clearHistoryAndCacheLeaveCookies(click, state) {
      const doIt = confirm("You'll stay signed in to most sites, but wipe browsing history and cached files. Are you sure?");
      if ( doIt ) {
        const {H} = state;
        H({
          synthetic: true,
          type: "clearAllPageHistory"
        });
        H({
          synthetic: true,
          type: "clearCache"
        });
        alert("Cleared all caches and history.");
      }
      close(state);
    }

    function clearBrowsingData(click, state) {
      const doIt = confirm("This will sign you out of most sites, and wipe all history and caches. Really wipe everything?");
      if ( doIt ) {
        const {H} = state;
        H({
          synthetic: true,
          type: "clearAllPageHistory"
        });
        H({
          synthetic: true,
          type: "clearCache"
        });
        H({
          synthetic: true,
          type: "clearCookies"
        });
        alert("Cleared all history, caches and cookies.");
      }
      close(state);
    }

    async function fullScreen(click, state) {
      if ( document.fullscreenElement || document.webkitFullscreenElement ) {
        if ( document.webkitCancelFullscreen ) {
          document.webkitCancelFullscreen();
        } else {
          await document.exitFullscreen();
        }
      } else {
        if ( document.body.webkitRequestFullscreen ) {
          document.body.webkitRequestFullscreen({navigationUI:'hide'});
        } else {
          await document.body.requestFullscreen({navigationUI:'hide'});
        }
      }
      close(state);
    }

