
  import {handleSelectMessage} from './handlers/selectInput.js';
  import {fetchTabs} from './handlers/targetInfo.js';
  import {demoZombie, fetchDemoTabs}  from './handlers/demo.js';
  import {handleKeysCanInputMessage} from './handlers/keysCanInput.js';
  import {handleElementInfo} from './handlers/elementInfo.js';
  import {handleScrollNotification} from './handlers/scrollNotify.js';
  import {resetLoadingIndicator,showLoadingIndicator} from './handlers/loadingIndicator.js';
  import {resetFavicon, handleFaviconMessage} from './handlers/favicon.js';
  import EventQueue from './eventQueue.js';
  import transformEvent from './transformEvent.js';
  import {sleep, debounce, DEBUG, BLANK, isFirefox, isSafari, deviceIsMobile} from './common.js';
  import {component, subviews} from './view.js';

  import installDemoPlugin from '../../plugins/demo/installPlugin.js';
  import installAppminifierPlugin from '../../plugins/appminifier/installPlugin.js';
  import installProjectorPlugin from '../../plugins/projector/installPlugin.js';

  const ThrottledEvents = new Set([
    "mousemove", "pointermove", "touchmove"
  ]);

  const SessionlessEvents = new Set([
    "window-bounds",
    "window-bounds-preImplementation",
    "user-agent",
    "hide-scrollbars"
  ]);

  const IMMEDIATE = 0;
  const SHORT_DELAY = 20;
  const LONG_DELAY = 300;
  const VERY_LONG_DELAY = 60000;
  const EVENT_THROTTLE_MS = 40;  /* 20, 40, 80 */

  // view frame debug
  let latestRequestId = 0;

  export default async function voodoo(selector, position, {
     postInstallTasks: postInstallTasks = [],
     preInstallTasks: preInstallTasks = [],
     canvasBondTasks: canvasBondTasks = [],
     bondTasks: bondTasks = [],
     useViewFrame: useViewFrame = false,
     demoMode: demoMode = false,
  } = {}) {
    const sessionToken = location.hash && location.hash.slice(1);
    location.hash = '';

    const closed = new Set();
    const listeners = new Map();
    const lastTarget = '[lastTarget]';
    const {tabs,activeTarget,requestId} = await (demoMode ? fetchDemoTabs() : fetchTabs({sessionToken}));
    latestRequestId = requestId;

    const state = {
      H,

      // bandwidth
      messageDelay: 0,          // time it takes to receive an average, non-frame message
      showBandwidthRate: true,
      myBandwidth: 0,
      serverBandwidth: 0,
      totalBytes: 0,
      totalServerBytesThisSecond: 0,
      totalBytesThisSecond: 0,
      totalBandwidth: 0,
      frameBandwidth: [],

      // demo mode
      demoMode,

      // if we are using a view frame (instead of canvas)
      useViewFrame,

      // for chrome vs firefox and mobile vs desktop to handle
      // different ways of doing IME input and keypress
      openKey: '',
      lastKeypressKey: '',

      // for firefox because it's IME does not fire inputType
      // so we have no simple way to handle deleting content backward
      // this should be FF on MOBILE only probably so that's why it's false
      convertTypingEventsToSyncValueEvents: isFirefox() && deviceIsMobile(),
      //convertTypingEventsToSyncValueEvents: false,

      // for safari to detect if pointerevents work
      DoesNotSupportPointerEvents: true,

      // safari to keep track of composition
      isComposing: false,

      // useful for input events that don't support data
      // invalidated by the first data prop set
      DataIsNotSupported: true,
      sizeBrowserToBounds,
      asyncSizeBrowserToBounds,
      emulateNavigator,
      hideScrollbars,
      bondTasks,
      canvasBondTasks,

      // tabs
      updateTabsTasks: [],
      lastTarget,
      activeTarget,
      tabs,
      attached: new Set(),
      activateTab,
      closeTab,
      createTab,
      activeTab,
      favicons: new Map(),

      // timing constants
      IMMEDIATE,
      SHORT_DELAY,
      LONG_DELAY,
      VERY_LONG_DELAY,
      EVENT_THROTTLE_MS,

      viewState: {},

      clearViewport,

      addListener(name, func) {
        let funcList = listeners.get(name); 

        if ( ! funcList ) {
          funcList = [];
          listeners.set(name, funcList);
        }

        funcList.push(func);
      }
    };

    const updateTabs = debounce(rawUpdateTabs, LONG_DELAY);

    if ( state.demoMode ) {
      state.demoEventConsumer = demoZombie;
    } 

    if ( DEBUG.dev ) {
      Object.assign(self, {state});
    }

    const queue = new EventQueue(state, sessionToken);

    // plugins 
      const plugins = new Map;
      if ( state.useViewFrame ) {
        installAppminifierPlugin(state,queue);
        if ( location.pathname == "/factory.html" ) {
          installProjectorPlugin(state,queue);
        }
        if ( state.demoMode ) {
          installDemoPlugin(state,queue);
        }
      }

      if ( isSafari() ) {
        queue.send({type:"isSafari"});
      }
      if ( isFirefox() ) {
        queue.send({type:"isFirefox"});
      }

      if ( deviceIsMobile() ) {
        state.hideScrollbars();
      }

    // event handlers
      // input
      queue.addMetaListener('selectInput', meta => handleSelectMessage(meta, state));
      queue.addMetaListener('keyInput', meta => handleKeysCanInputMessage(meta, state));
      queue.addMetaListener('favicon', meta => handleFaviconMessage(meta, state));
      queue.addMetaListener('navigated', () => canKeysInput());
      queue.addMetaListener('navigated', ({navigated:{targetId}}) => resetFavicon({targetId}, state));

      //queue.addMetaListener('navigated', meta => takeShot(meta, state));

      // element info
      queue.addMetaListener('elementInfo', meta => handleElementInfo(meta, state));

      // scroll
      queue.addMetaListener('scroll', meta => handleScrollNotification(meta, state));

      // loading
      queue.addMetaListener('resource', meta => showLoadingIndicator(meta, state));
      queue.addMetaListener('failed', meta => {
        if ( meta.failed.params.type == "Document" ) {
          // we also need to make sure the failure happens at the top level document
          // rather than writing the top level document for any failure in a sub frame
          writeDocument(`Request failed: ${meta.failed.params.errorText}`, meta.failed.frameId, meta.failed.sessionId);
        }
      });
      queue.addMetaListener('navigated', meta => resetLoadingIndicator(meta, state));

      if ( DEBUG.val >= DEBUG.med ) {
        queue.addMetaListener('navigated', meta => console.log(meta));
        queue.addMetaListener('changed', meta => console.log(meta));
        queue.addMetaListener('created', meta => console.log(meta));
        queue.addMetaListener('attached', meta => console.log(meta));
        queue.addMetaListener('detached', meta => console.log(meta));
        queue.addMetaListener('destroyed', meta => console.log(meta));
        queue.addMetaListener('crashed', meta => console.log(meta));
        queue.addMetaListener('consoleMessage', meta => console.log(meta));
      }

      // patch tabs array with changes as they come through
      queue.addMetaListener('changed', ({changed}) => {
        const tab = findTab(changed.targetId);
        if ( tab ) {
          Object.assign(tab, changed);
          subviews.TabList(state);
        }
        updateTabs({changed});
      });

      // tabs
      queue.addMetaListener('created', meta => {
        if ( meta.created.type == 'page') {
          if ( DEBUG.activateNewTab ) {
            if ( meta.created.url == 'about:blank' || meta.created.url == '' ) {
              state.updateTabsTasks.push(() => setTimeout(() => activateTab(null, meta.created), LONG_DELAY));
            }
          }
          updateTabs();
          sizeBrowserToBounds(state.viewState.canvasEl, meta.created.targetId);
        }
      });
      queue.addMetaListener('attached', meta => {
        const attached = meta.attached.targetInfo;
        if ( attached.type == 'page' ) {
          state.attached.add(attached.targetId);

          if ( state.useViewFrame ) {
            sizeBrowserToBounds(state.viewState.viewFrameEl, attached.targetId);
          } else {
            sizeBrowserToBounds(state.viewState.canvasEl, attached.targetId);
            emulateNavigator();
          }
          updateTabs();
        }
      });
      queue.addMetaListener('navigated', updateTabs);
      queue.addMetaListener('detached', updateTabs);
      queue.addMetaListener('destroyed', ({destroyed}) => {
        closed.delete(destroyed.targetId);
        updateTabs();
      });
      queue.addMetaListener('crashed', updateTabs);

      //modals
      queue.addMetaListener('modal', modalMessage => subviews.openModal(modalMessage, state));

      // remote secure downloads
      queue.addMetaListener('download', ({download}) => {
        const {sessionId, filename} = download;
        const modal = {
          sessionId,
          type: 'notice',
          /*
          message: `The file "${filename}" is downloading to this pits of hell to be consumed in eternal damnation by stinky daemons. Send bitcoins to this address to save your file. Just kidding, bitcoin is not a valid store of value. Contact cris@dosyrcorp.com for a license to use a secure file viewer, or deploy commercially. This open-source software is free to use for governments and not-for-profits. All data will be deleted at the end of your session. Also by daemons.`,
          */
          message: `The file "${filename}" is downloading a secure location and will be deleted at the end of your session. Contact cris@dosyrcorp.com for a license to use a secure file viewer, or to deploy commercially. This open-source software is free to use for governments and not-for-profits. See the README.md for more details.`,
          otherButton: {
            /*
            title: 'Open README.md',
            onclick: () => window.open('https://github.com/dosyago/BrowserGap/blob/master/README.md', "_blank")
            */
            title: 'Mail Cris',
            onclick: () => window.open('mailto:cris@dosycorp.com?Subject=BrowserGap+License+Inquiry&body=Hi%20Cris', "_blank")
          },
          title: "SecureView\u2122 Not-enabled",
        };
        subviews.openModal({modal}, state);
      });

      queue.addMetaListener('secureview', ({secureview}) => {
        const {url} = secureview;
        if ( url ) {
          createTab(null, url);
        }
      });

      // HTTP auth
      queue.addMetaListener('authRequired', ({authRequired}) => {
        const {requestId} = authRequired;
        const modal = {
          requestId,
          type: 'auth',
          message: `Provide credentials to continue`,
          title: `HTTP Auth`,
        };
        subviews.openModal({modal}, state);
      });

      // File chooser 
      queue.addMetaListener('fileChooser', ({fileChooser}) => {
        const {sessionId, mode, accept} = fileChooser;
        const modal = {
          sessionId, mode, accept,
          type: 'filechooser',
          message: `Securely send files to the remote page.`,
          title: `File Chooser`,
        };
        subviews.openModal({modal}, state);
      });

    
    // bond tasks 
      canvasBondTasks.push(indicateNoOpenTabs);
      canvasBondTasks.push(installZoomListener);
      canvasBondTasks.push(asyncSizeBrowserToBounds);
      if ( isSafari() ) {
        canvasBondTasks.push(installSafariLongTapListener);
      }

      bondTasks.push(canKeysInput);
      bondTasks.push(getFavicon);
      bondTasks.push(installTopLevelKeyListeners);

    const preInstallView = {queue};

    for( const task of preInstallTasks ) {
      try {
        task(preInstallView);
      } catch(e) {
        console.error(`Task ${task} failed with ${e}`);
      }
    }

    component(state).to(selector, position);

    const api = {
      back: () => 1,
      forward: () => 1,
      reload: () => 1, 
      stop: () => 1,
      mouse: () => 1,
      touch: () => 1, 
      scroll: () => 1,
      key: () => 1,
      type: () => 1,
      omni: () => 1,
      newTab: () => 1,
      closeTab: () => 1,
      switchTab: () => 1,
    };

    const pluginView = {addToQueue, subscribeToQueue, requestRender, api};

    const poppetView = {loadPlugin, api};

    const postInstallView = {queue};

    await sleep(0);

    for( const task of postInstallTasks ) {
      try {
        task(postInstallView);
      } catch(e) {
        console.error(`Task ${task} failed with ${e}`);
      }
    }

    if ( activeTarget ) {
      activateTab(null, {targetId:activeTarget});
    }

    return poppetView;

    // closures
      /*function doShot() {
        setTimeout(() => {
          queue.send({
            type: "doShot",
            synthetic: true
          });
        }, SHORT_DELAY);
      }*/

      function runListeners(name, data) {
        const funcList = listeners.get(name);

        if ( ! funcList || funcList.length == 0 ) return false;

        let score = false;

        for (const func of funcList) {
          try {
            func(data); 
            score = score || true;
          } catch(e) {
            console.log(`Listeners func for ${name} fails: ${func}\nError: ${e + e.stack}`);
          }
        }
        
        return score;
      }

      function findTab(id) {
        return state.tabs.find(({targetId}) => id == targetId);
      }

      function activeTab() {
        return state.tabs.length == 1 ? state.tabs[0] : findTab(state.activeTarget) || {};
      }

      function indicateNoOpenTabs() {
        if ( state.tabs.length == 0 ) {
          clearViewport();
          if ( state.useViewFrame ) {
            try {
              state.viewState.viewFrameEl.contentDocument.body.innerHTML = `
                <em>${state.factoryMode ? 'Factory Mode' : 'Custom Mode'}. No tabs open.</em>
              `;
            } catch(e) {
              console.warn(e);
            }
          } else {
            writeCanvas("All tabs closed.");
          }
        }
      }

      function writeCanvas(text) {
        const canv = state.viewState.canvasEl;
        const ctx = state.viewState.ctx;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canv.width, canv.height);
        ctx.fillStyle = 'silver';
        ctx.font = 'italic 3vmax sans-serif';
        ctx.textAlign = "center";
        ctx.fillText(text, innerWidth/2, innerHeight/2-6*Math.max(innerWidth/100, innerHeight/100));
      }

      function writeDocument(html, frameId, sessionId) {
        queue.send({
          type: 'setDocument',
          html, frameId, sessionId,
          synthetic: true
        });
      }

      function clearViewport() {
        if ( state.useViewFrame ) {
          try {
            state.viewState.viewFrameEl.contentDocument.body.innerHTML = ``;
          } catch(e) {
            console.warn(e);
          }
        } else {
          const canv = state.viewState.canvasEl;
          const ctx = state.viewState.ctx;
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canv.width, canv.height);
        }
      }

      /*function sendKey(keyEvent) {
        const {viewState} = state;
        if ( document.activeElement !== viewState.keyinput && document.activeElement !== viewState.textarea ) {
          let ev = keyEvent;
          if ( keyEvent.key == "Tab" || keyEvent.key == "Space" ) {
            event.preventDefault();
            ev = cloneKeyEvent(event, true);
          } 
          H(ev);
        }
      }*/

      function installTopLevelKeyListeners() {
        //self.addEventListener('keydown', sendKey); 
        //self.addEventListener('keyup', sendKey); 
      }

      function installSafariLongTapListener(el) {
        const FLAGS = {passive:true, capture:true};
        const MIN_DURATION = 200;
        const MAX_MOVEMENT = 20;
        let lastStart;
        el.addEventListener('touchstart', ts => lastStart = ts, FLAGS);
        el.addEventListener('touchend', triggerContextMenuIfLongEnough, FLAGS);
        el.addEventListener('touchcancel', triggerContextMenuIfLongEnough, FLAGS);

        function triggerContextMenuIfLongEnough(tf) {
          // space 
            const touch1 = lastStart.changedTouches[0];
            const touch2 = tf.changedTouches[0];
            const movement = Math.hypot(
              touch2.pageX - touch1.pageX,
              touch2.pageY - touch1.pageY
            );
          // time
            const duration = tf.timeStamp - lastStart.timeStamp;
          if ( duration > MIN_DURATION && movement < MAX_MOVEMENT ) {
            lastStart.preventDefault();
            tf.preventDefault();
            const {pageX,pageY,clientX,clientY} = touch1;
            el.dispatchEvent(new CustomEvent('contextmenu', {detail:{pageX,pageY,clientX,clientY}}));
          }
        }
      }

      function installZoomListener(el) {
        const FLAGS = {passive:true};
        let lastScale = 1.0;
        let scaling = false;
        let startDist = 0;
        let lastDist = 0;
        let touch;

        el.addEventListener('touchstart', begin, FLAGS);
        el.addEventListener('touchmove', move, FLAGS);
        el.addEventListener('touchend', end, FLAGS);
        el.addEventListener('touchcancel', end, FLAGS);

        el.addEventListener('wheel', sendZoom, {passive:true, capture: true});

        function sendZoom(event) {
          if ( event.ctrlKey || event.deltaZ != 0 ) {
            const delta = event.deltaZ || event.deltaY;
            const direction = Math.sign(delta);
            let multiplier;
            if ( direction > 0 ) {
              multiplier = 1/1.25;
            } else {
              multiplier = 1.25;
            }
            const scale = lastScale * multiplier;
            lastScale = scale;
            DEBUG.val > DEBUG.low && console.log('sending zoom ' + scale);
            H({ synthetic:true,
              type:'zoom',
              scale,
              event
            });
          }
        }

        function begin(event) {
          if ( event.touches.length == 2 ) {
            startDist = Math.hypot(
              event.touches[0].pageX - event.touches[1].pageX,
              event.touches[0].pageY - event.touches[1].pageY
            );
            if ( startDist > 8 ) {
              scaling = true;
              touch = event.touches[0];
            } else {
              scaling = false;
            }
          }
        }

        function move(event) {
          if ( scaling ) {
            const dist = Math.hypot(
              event.touches[0].pageX - event.touches[1].pageX,
              event.touches[0].pageY - event.touches[1].pageY
            );
            lastDist = dist;
          }
        }

        function end() {
          if ( scaling ) {
            if ( lastDist < 8 ) {
              // do nothing, 
            } else {
              const scale = lastScale * Math.abs(lastDist / startDist);
              lastScale = scale;
              DEBUG.val > DEBUG.low && console.log('sending zoom ' + scale);
              H({ synthetic:true,
                type:'zoom',
                scale,
                event: touch
              });
            }
            scaling = false;
            startDist = 0;
            lastDist = 0;
            touch = false;
          }
        }
      }

      function H(event) {
        // block if no tabs
        if (state.tabs.length == 0) {
          if ( SessionlessEvents.has(event.type) ) {
            DEBUG.val > DEBUG.low && console.log(`passing through sessionless event of type ${event.type}`);
          } else return;
        }
        const mouseEventOnPointerDevice = event.type.startsWith("mouse") && event.type !== "wheel" && !state.DoesNotSupportPointerEvents;
        const tabKeyPressForBrowserUI = event.key == "Tab" && !event.vRetargeted;
        const eventCanBeIgnored = mouseEventOnPointerDevice || tabKeyPressForBrowserUI;
        
        if ( eventCanBeIgnored ) return;

        const pointerEvent = event.type.startsWith("pointer");
        const mouseWheel = event.type == "wheel";
        const syntheticNonTypingEventWrapper = event.synthetic && event.type != "typing" && event.event;
      
        if ( mouseWheel ) {
          // do nothing
        } else if ( pointerEvent ) {
          state.DoesNotSupportPointerEvents = false;
        } else if ( syntheticNonTypingEventWrapper ) {
          event.event.preventDefault && event.event.preventDefault();
        }

        const simulated = event.event && event.event.simulated;
        const hasTarget = event.event && event.event.target;

        if ( event.type == "typing" && hasTarget 
            && ! simulated && state.convertTypingEventsToSyncValueEvents ) {
          event.type = 'typing-syncValue';
          event.value = event.event.target.value;
          event.contextId = state.contextIdOfFocusedInput;
          event.data = "";
        }

        const isThrottled = ThrottledEvents.has(event.type);
        const transformedEvent = transformEvent(event);

        if ( mouseWheel ) {
          transformedEvent.contextId = state.viewState.latestScrollContext;
        }
        
        if ( isThrottled ) {
          queue.send(transformedEvent);
        } else {
          if ( event.type == "keydown" && event.key == "Enter" ) {
            // We do this to make sure we send composed input data when enter is pressed
            // in an input field, if we do not do this, the current composition is not printed
            if ( !! state.latestData && !! event.target.matches('input') && state.latestData.length > 1 ) {
              queue.send(transformEvent({
                synthetic: true,
                type: 'typing', 
                data: state.latestData,
                event: {enterKey:true,simulated:true}
              }));
              state.latestCommitData = state.latestData;
              state.latestData = "";
            } 
          } else if ( event.type == "keydown" && event.key == "Backspace" ) {
            state.backspaceFiring = true;
          } else if ( event.type == "keyup" && event.key == "Backspace" ) {
            state.backspaceFiring = false;
          } else if ( event.type == "pointerdown" || event.type == "mousedown" ) {
            //const {timeStamp,type} = event;
            const {latestData} = state;
            if ( !! state.viewState.shouldHaveFocus && !! latestData && latestData.length > 1 && latestData != state.latestCommitData) {
              state.isComposing = false;
              const data = latestData;
              queue.send(transformEvent({
                synthetic: true,
                type: 'typing', 
                data: data,
                event: {pointerDown:true,simulated:true}
              }));
              state.latestCommitData = data;
              state.latestData = "";
            }
          } else if ( event.type == "pointerup" || event.type == "mouseup" ) {
            if ( state.viewState.killNextMouseReleased ) {
              state.viewState.killNextMouseReleased = false;
              return;
            }
          }
          queue.send(transformedEvent);
        }
      }

      function sizeBrowserToBounds(el, targetId) {
        let {width, height} = el.getBoundingClientRect();
        width = Math.round(width);
        height = Math.round(height);
        if ( el.width != width || el.height != height ) {
          el.width = width;
          el.height = height;
        }
        const mobile = deviceIsMobile();
        H({ synthetic: true,
          type: "window-bounds",
          width,
          height,
          targetId: targetId || state.activeTarget
        });
        H({ synthetic: true,
          type: "window-bounds-preImplementation",
          width,
          height,
          mobile,
          targetId: targetId || state.activeTarget
        });
        self.ViewportWidth = width;
        self.ViewportHeight = height;
      }

      function sizeTab() {
        return sizeBrowserToBounds(state.viewState.canvasEl);
      }

      function asyncSizeBrowserToBounds(el) {
        setTimeout(() => (sizeBrowserToBounds(el), indicateNoOpenTabs()), 0);
      }

      function emulateNavigator() {
        const {platform,userAgent,language:acceptLanguage} = navigator;
        H({ synthetic: true,
          type: "user-agent",
          userAgent, platform , acceptLanguage
        });
      }

      function hideScrollbars() {
        H({ synthetic: true,
          type: "hide-scrollbars",
        });
      }

      async function activateTab(click, tab) {
        click && click.preventDefault(); 
        if ( state.activeTarget == tab.targetId ) {
          if ( state.viewState.omniBoxInput == state.viewState.lastActive ) {
            state.viewState.omniBoxInput.focus();
          }
          return;
        }
        const {targetId} = tab;
        queue.send({
          command: {
            name: "Target.activateTarget",
            params: {targetId},
            requiresShot: true,
          }
        });
        sizeTab();
        canKeysInput();
        state.lastTarget = state.activeTarget;
        state.activeTarget = targetId;
        // we assume that a listener will call clearviewport
        // this returns false if there are no listeners
        if ( ! runListeners('activateTab') ) {
          clearViewport();
        }
        state.active = activeTab();
        subviews.TabList(state);
        subviews.OmniBox(state);
        subviews.LoadingIndicator(state);
        sizeBrowserToBounds(state.viewState.canvasEl);
        setTimeout(() => {
          if ( state.active && state.active.url != BLANK ) {
            canKeysInput();
          } else {
            writeDocument(`
              <!DOCTYPE html>
                <style>
                  :root {
                    height: 100%;
                    background: #${Math.floor(Math.random() * 0x1000000).toString(16).padStart(6, 0)};
                    color: navy;
                    font-family: system-ui;
                  }
                  h2 {
                  }
                  strong {
                    padding: 0.5rem;
                  }
                </style>
                <h2>
                  New Blank Browser Tab. 
                </h2>
                <strong>
                  Current time: ${(new Date).toString()}
                </strong>
              </html>
            `);
            //writeDocument("Secure BrowserGap Tab.");
            //writeDocument("Undead Tab from the Crypt of Hell. <a href=https://github.com/dosyago/BrowserGap>Spells here</a>.");
            state.viewState.omniBoxInput.focus();
          }
        }, SHORT_DELAY);
      }

      async function closeTab(click, tab, index) {
        const {targetId} = tab;
        closed.add(targetId);
        resetLoadingIndicator({navigated:targetId},state);
        setTimeout(() => closed.delete(targetId), VERY_LONG_DELAY);
        const events = [
          {
            command: {
              name: "Target.closeTarget",
              params: {targetId},
            }
          }
        ];
        await queue.send(events);
        state.tabs.splice(index,1);
        if ( state.activeTarget == targetId ) {
          if ( state.tabs.length == 0 ) {
            state.activeTarget = null; 
          } else {
            if ( index >= state.tabs.length ) {
              index = state.tabs.length-1;
            }
            const newActive = state.tabs[index];
            activateTab(click, newActive);
          }
        } else {
          updateTabs();
        }
        subviews.TabList(state);
        subviews.LoadingIndicator(state);
      }

      async function rawUpdateTabs() {
        let {tabs,activeTarget,requestId} = await (demoMode ? fetchDemoTabs() : fetchTabs({sessionToken}));
        tabs = tabs.filter(({targetId}) => !closed.has(targetId));
        if ( requestId <= latestRequestId ) {
          return;
        }
        else {
          latestRequestId = requestId;
        }
        state.tabs = tabs;
        if ( demoMode ) {
          state.activeTarget = activeTarget;
        }
        state.active = activeTab();
        if( !state.activeTarget || !state.active) {
          if ( state.tabs.length ) {
            await activateTab(null, state.tabs[0]);
          }
        }
        subviews.Controls(state);
        subviews.TabList(state);
        if ( state.tabs.length == 0 ) {
          indicateNoOpenTabs();
        }
        while(state.updateTabsTasks.length) {
          const task = state.updateTabsTasks.shift();
          try {
            task();
          } catch(e) {
            console.warn("State update tabs task failed", e, task);
          }
        }
      }

      async function createTab(click, url = BLANK) {
        queue.send({
          command: {
            name: "Target.createTarget",
            params: {
              url,
              enableBeginFrameControl: DEBUG.frameControl
            },
          }
        });
      }

      function canKeysInput() {
        if ( state.viewState.viewFrameEl ) return;
        setTimeout(() => {
          queue.send({
            type: "canKeysInput",
            synthetic: true
          });
        }, SHORT_DELAY);
      }

      function getFavicon() {
        setTimeout(() => {
          queue.send({
            type: "getFavicon",
            synthetic: true
          });
        }, IMMEDIATE);
      }

      function loadPlugin(plugin) {
        plugins.set(plugin.name, plugin);
        plugin.load(pluginView);
      }

      function addToQueue(/*...events*/) {
        console.warn("Unimplemented");
      }

      function requestRender(/*pluginRenderedView*/) {
        console.warn("Unimplemented");
      }

      function subscribeToQueue(/*name, listener*/) {
        console.warn("Unimplemented");
      }
  }

  export function cloneKeyEvent(event, vRetargeted) {
    return {
      type: event.type,
      keyCode: event.keyCode,
      key: event.key,
      code: event.code,
      altKey: event.altKey,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      shiftKey: event.shiftKey,
      vRetargeted
    };
  }

