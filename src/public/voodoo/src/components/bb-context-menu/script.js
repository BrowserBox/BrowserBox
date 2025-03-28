class BBContextMenu extends Base {
  static CLOSE_DELAY = 1222;

  static SHORT_CUT = 'Ctrl+Shift+J';

  CTX_MENU_THRESHOLD = 375;

  MENU_ITEMS(state) {
    const {_top} = state;
    return {
      'page': [
        ...(_top.deviceIsMobile() ? this.MobileOptions(_top) : []),
        {
          title: 'Open Link in New Tab',
          shortCut: this.constructor.SHORT_CUT,
          func: this.openInNewTab,
        },
        //  This is blocked (apparently) on: https://bugs.chromium.org/p/chromium/issues/detail?id=1015260
        {
          title: 'Open Link in Incognito Tab',
          shortCut: this.constructor.SHORT_CUT,
          func: this.newBrowserContextAndTab,
        },
        {
          hr: true,
          title: 'Resize Screen',
          shortCut: this.constructor.SHORT_CUT,
          func: this.resizeViewport
        },
        {
          title: (
            document.fullscreenElement || 
            document.webkitFullscreenElement
          ) ? 
            'Exit Full Screen' : 
            'Full Screen'
          ,
          shortCut: this.constructor.SHORT_CUT,
          func: this.fullScreen,
        },
        {
          title: 'Save Screenshot',
          shortCut: this.constructor.SHORT_CUT,
          func: this.download
        },
        {
          title: 'Toggle Controls',
          shortCut: this.constructor.SHORT_CUT,
          func: this.toggleChromeUI
        },
        {
          title: 'Copy Text from Here',
          shortCut: this.constructor.SHORT_CUT,
          func: this.copy,
          hr: true
        },
        {
          title: 'Copy Link Address from Here',
          shortCut: this.constructor.SHORT_CUT,
          func: this.copyLink,
        },
        {
          title: 'Paste Text',
          shortCut: this.constructor.SHORT_CUT,
          func: this.paste
        },
        {
          title: 'Reload',
          hr: true,
          shortCut: this.constructor.SHORT_CUT,
          func: this.reload
        },
        {
          title: 'Clear History',
          shortCut: this.constructor.SHORT_CUT,
          func: this.clearHistoryAndCacheLeaveCookies,
        },
        {
          title: 'Inspect in DevTools',
          hr: true,
          shortCut: this.constructor.SHORT_CUT,
          func: this.inspectCurrentTabInDevTools,
        },
      ], 
    };
  }

  MobileOptions(state) {
    return (DEBUG.showKeyboardToggleInContextMenu ? [
      {
        title: state.viewState.shouldHaveFocus ? 'Hide keyboard' : 'Show keyboard',
        shortCut: this.constructor.SHORT_CUT,
        func: (click) => {
          state.toggleVirtualKeyboard(click);
          this.close(state);
        }
      },
    ] : []);
  }

  constructor() {
    super();
  }

  // custom untilLoaded to ensure styles are loaded
  // before running bond to ensure that the correct sizes are used
  // in calculation of the menu position, otherwise the menu will 
  // be positioned based on how big it is before the styles are applied
  async untilLoaded() {
    await super.untilLoaded();
    await becomesTrue(() => getComputedStyle(this?.shadowRoot?.querySelector('#load-test'))?.display === "contents");
    return true;
  }

  get menuItems() {
    return this.MENU_ITEMS(this.state._top).page;
  }

  /* core functions */
    async inspectCurrentTabInDevTools(click) {
      const state = this.state._top;

      const currentTab = state.activeTarget;

      DEBUG.debugInspect && console.log(`Opening DevTools window to inspect tab ${currentTab}`, state.active);

      let devtoolsWindow;
      if ( state.CONFIG.ensureDevToolsOpensInNewTab || !state.CONFIG.openServicesInCloudTabs ) {
        devtoolsWindow = window.open("about:blank");
      }
      state.emulateActive(currentTab);

      const url = state.CONFIG.isOnion ? new URL(
          `${location.protocol}//${localStorage.getItem(state.CONFIG.devtoolsServiceFileName)}`
        ) 
        : 
        new URL(location)
      ;

      if ( state.CONFIG.isDNSFacade ) {
        const port = state.CONFIG.mainPort + 1;
        const subs = url.hostname.split('.');
        subs.shift();
        subs.unshift(`p${port}`);
        url.hostname = subs.join('.');
        console.log({url});
      } else {
        url.port = state.CONFIG.isOnion ? 443 : (parseInt(state.CONFIG.mainPort) + 1);
      }

      url.pathname = "login";
      const params = url.searchParams;
      params.set('token', state.sessionToken);

      DEBUG.debugInspect && console.log("Login url", url.href);

      const useCookies = state.useCookies;
      DEBUG.debugInspect && alert('use cookie?' + useCookies);
      DEBUG.debugInspect && console.log(state.CONFIG.mainPort, state.CONFIG)

      // we don't use cookie auth with Tor as Tor browser will block this "3rd-party request"
      if ( useCookies ) {
        try {
          await uberFetch(url, {mode: 'no-cors', credentials: 'include'});
        } catch(e) {
          console.warn(`Issue when attempting to login via token for cookie to devtools service`);
        }
      }

      const dtUrl = `${url.host}/devtools/page/${currentTab}`;
      DEBUG.debugDevTools && console.log({dtUrl});
      params.set(
        location.protocol.endsWith('https:') ? 'wss' : 'ws', 
        dtUrl
      );
      params.set('remoteFrontend', 'true');
      if ( !useCookies ) {
        const locationUrl = new URL(url);
        locationUrl.pathname = `/devtools/inspector.html`
        const nextUri = locationUrl.href;

        url.pathname = '/login';
        url.searchParams.set('token', localStorage.getItem(state.CONFIG.sessionTokenFileName));
        url.searchParams.set('nextUri', nextUri);

        DEBUG.debugInspect && console.log("Inspect url", url.href);

        DEBUG.debugInspect && alert('Will set url to: ' + url);
        if ( !state.CONFIG.ensureDevToolsOpensInNewTab && state.CONFIG.openServicesInCloudTabs ) {
          state.createTab(click, url);
          setTimeout(() => state.runUpdateTabs(), 0);
        } else {
          devtoolsWindow.location = url;
        }
      } else {
        url.pathname = `/devtools/inspector.html`

        DEBUG.debugInspect && console.log("Inspect url", url.href);

        DEBUG.debugInspect && alert('Will set url to: ' + url);
        if ( !state.CONFIG.ensureDevToolsOpensInNewTab && state.CONFIG.openServicesInCloudTabs ) {
          state.createTab(click, url);
          setTimeout(() => state.runUpdateTabs(), 0);
        } else {
          devtoolsWindow.location  = url;
        }
      }
    }

    close(_) {
      DEBUG.debugContextMenu && console.log((new Error(`Tracking close event`)).stack);
      const _top = _ ? _ : this.state._top;
      if ( _top.viewState.contextMenu ) {
        _top.viewState.contextMenu = null;
        _top.contextMenuActive = false;
        //_top.contextMenuEvent = null;
      }
      setState('bbpro', _top);
    }

    copy(click) {
      DEBUG.debugCopyPaste && console.log(`Received copy request`);
      state = this.state._top;
      const contextClick = state.contextMenuEvent;
      let pageX, pageY, clientX, clientY;
      if ( contextClick?.detail?.pageX ) {
        ({pageX,pageY,clientX,clientY} = contextClick.detail);
      } else {
        ({pageX,pageY,clientX,clientY} = contextClick);
      }
      DEBUG.debugCopyPaste && console.log({clientX,clientY});
      const target = state.viewState.canvasEl;
      const {H} = state;
      state.elementInfoContinuation = ({innerText, noSuchElement}) => {
        if ( noSuchElement ) {
          DEBUG.debugCopyPaste && console.log(`Got no such element so not nuking elementInfoContinuation`);
          return;
        }
        state.elementInfoContinuation = null;
        state.viewState.modalComponent.openModal({modal:{
          type:'copy', 
          highlight: true, 
          message: innerText, 
          title: `Text from Page`
        }}, state);
      };
      this.close(state);
      DEBUG.debugCopyPaste && console.log('setup elementInfoContinuation', {clientX,clientY}, state.elementInfoContinuation);
      H({
        type: 'getElementInfo',
        synthetic: true,
        data: {
          innerText: true,
          target,
          clientX, clientY
        }
      });
      DEBUG.debugCopyPaste && console.log('sending request for element info to remote');
      setTimeout(() => {
        state.checkResults();
      }, 300);
    }

    copyLink(click) {
      state = this.state._top;
      const contextClick = state.contextMenuEvent;
      const target = state.viewState.canvasEl;
      let pageX, pageY, clientX, clientY;
      if ( contextClick?.detail?.pageX ) {
        ({pageX,pageY,clientX,clientY} = contextClick.detail);
      } else {
        ({pageX,pageY,clientX,clientY} = contextClick);
      }
      const {H} = state;
      this.close(state);
      state.elementInfoContinuation = ({attributes, noSuchElement}) => {
        if ( ! noSuchElement ) {
          state.elementInfoContinuation = null;
          state.viewState.modalComponent.openModal({modal:{
            type: 'copy', 
            message: attributes.href, 
            highlight: true,
            title: 'Link from Page'
          }}, state);
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
      setTimeout(() => {
        state.checkResults();
      }, 300);
    }

    paste(click) {
      state = this.state._top;
      this.close(state);
      state.viewState.modalComponent.openModal({modal:{
        type:'paste', 
        message: "Enter text to paste", 
        title: `Paste into Page`
      }}, state);
    }

    download(click) {
      state = this.state._top;
      this.close(state);
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

    reload(click) {
      state = this.state._top;
      const goButton = state?.viewState?.omniBoxInput?.closest('form.url')?.querySelector('button.go');
      if ( goButton ) {
        goButton.click();
      } else {
        state.go({
          target: {
            address: {
              value: state.activeTab().url || BLANK 
            }
          }
        }, state);
      }
      this.close(state);
    }

    openInNewTab(click) {
      state = this.state._top;
      const contextClick = state.contextMenuEvent;
      const target = state.viewState.canvasEl;
      DEBUG.debugTabs && console.log({contextClick, target});
      let pageX, pageY, clientX, clientY;
      if ( contextClick?.detail?.pageX ) {
        ({pageX,pageY,clientX,clientY} = contextClick.detail);
      } else if ( contextClick ) {
        ({pageX,pageY,clientX,clientY} = contextClick);
      } else {
        console.warn(`NO data for context menu event`);
      }
      const {H} = state;
      // we need to get the URL of the target link 
      // then use 
      // state.createTab(click, url);
      state.viewState.killNextMouseReleased = true;
      state.elementInfoContinuation = ({attributes, noSuchElement}) => {
        DEBUG.debugTabs && console.log(`Received continuation`);
        if ( ! noSuchElement ) {
          state.elementInfoContinuation = null;
          state.createTab(click, attributes.href);
          setTimeout(() => state.runUpdateTabs(), 0);
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
      setTimeout(() => {
        state.checkResults();
      }, 300);
      DEBUG.debugTabs && console.log(`Check sent element info request`);
      this.close(state);
    }

    newBrowserContextAndTab(click) {
      state = this.state._top;
      const {H} = state;
      const contextClick = state.contextMenuEvent;
      const target = state.viewState.canvasEl;
      let pageX, pageY, clientX, clientY;
      if ( contextClick?.detail?.pageX ) {
        ({pageX,pageY,clientX,clientY} = contextClick.detail);
      } else {
        ({pageX,pageY,clientX,clientY} = contextClick);
      }
      state.viewState.killNextMouseReleased = true;
      state.elementInfoContinuation = ({attributes, noSuchElement}) => {
        DEBUG.debugTabs && console.log(`Received continuation`);
        if ( ! noSuchElement ) {
          state.elementInfoContinuation = null;
          H({
            synthetic: true,
            immediate: true,
            type: 'newIncognitoTab',
            url: attributes.href
          });
          setTimeout(() => {
            state.checkResults();
            setTimeout(() => state.runUpdateTabs(), 300);
          }, 300);
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
      setTimeout(() => {
        state.checkResults();
      }, 300);
      this.close(state);
    }

    clearHistoryAndCacheLeaveCookies(click) {
      state = this.state._top;
      state.wipeIsInProgress = true;
      globalThis.wipeIsInProgress = true;
      const doIt = confirm("You'll stay signed in to most sites, but your browsing history and caches will be wiped. You cannot undo this action.\nIf you proceed, your application will reload in 5 seconds.\n\nAre you sure you want to clear all history and caches?");
      if ( doIt ) {
        const {H} = state;
        H({
          synthetic: true,
          type: "clearCacheAndHistory"
        });
        setTimeout(() => location.reload(), 5000);
      }
      this.close(state);
    }

    clearBrowsingData(click) {
      state = this.state._top;
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
      this.close(state);
    }

    resizeViewport(click) {
      state = this.state._top;
      window._voodoo_asyncSizeTab({resetRequested:true})
      this.close(state);
    }

    toggleChromeUI(click) {
      state = this.state._top;
      state.chromeUI ^= true;
      state.hideIMEUI();
      this.close(state);
      window._voodoo_asyncSizeTab({resetRequested:true})
    }

    async fullScreen(click) {
      state = this.state._top;
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
      this.resizeViewport(click);
    }
}

