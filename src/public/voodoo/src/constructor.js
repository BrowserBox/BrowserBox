
  // imports
    import {handleSelectMessage} from './handlers/selectInput.js';
    import {fetchTabs} from './handlers/targetInfo.js';
    import {detectIMEInput} from './ime_detection.js';
    import {handleMultiplayerMessage} from './handlers/multiplayer.js';
    import {handleKeysCanInputMessage} from './handlers/keysCanInput.js';
    import {handleElementInfo} from './handlers/elementInfo.js';
    import {CTX_MENU_THRESHOLD, makeContextMenuBondTasks} from './subviews/contextMenu.js';
    import {handleScrollNotification} from './handlers/scrollNotify.js';
    import {resetLoadingIndicator,showLoadingIndicator} from './handlers/loadingIndicator.js';
    import {resetFavicon, handleFaviconMessage} from './handlers/favicon.js';
    import DEFAULT_FAVICON from './subviews/faviconDataURL.js';
    import EventQueue from './eventQueue.js';
    import {default as transformEvent, getKeyId, controlChars} from './transformEvent.js';
    import {saveClick} from './subviews/controls.js';
    import {
      untilTrue,
      logit, sleep, debounce, DEBUG, BLANK, 
      CONFIG,
      OPTIONS,
      isFirefox, isSafari, deviceIsMobile,
      SERVICE_COUNT,
      // for bang
      CHAR,
      iden, throttle, elogit,
      logitKeyInputEvent,
    } from './common.js';
    import {component, subviews, saveCanvas, audio_login_url} from './view.js';

    //import installDemoPlugin from '../../plugins/demo/installPlugin.js';
    //import installAppminifierPlugin from '../../plugins/appminifier/installPlugin.js';
    //import installProjectorPlugin from '../../plugins/projector/installPlugin.js';

    // for bang
    import {s as R, c as X} from '../node_modules/bang.html/src/vv/vanillaview.js';

  // constants
    const ThrottledEvents = new Set([
      "mousemove", "pointermove", "touchmove"
    ]);

    const CancelWhenSyncValue = new Set([
      /*
      "keydown",
      "keyup",
      "keypress",
      "compositionstart",
      "compositionend",
      "compositionupdate",
      */
    ]);

    const EnsureCancelWhenSyncValue = e => {
      if ( !e.type.startsWith("key") ) {
        return true;
      } else {
        const id = getKeyId(e);
        return !controlChars.has(id); 
      }
    };

    const SessionlessEvents = new Set([
      "window-bounds",
      "user-agent",
      "hide-scrollbars",
      "respond-to-modal",
    ]);

    const DOC_FORMATS = new Set([
      'pdf',
      'doc',
      'docx',
      'xls',
      'xlsx',
      'ps',
      'rtf',
      'odf',
      'ppt',
      'pptx',
      'pub',
      'pages'
    ]);

    const FLASH_FORMATS = new Set([
      'as',
      'swf',
      'jsfl',
      'fla'
    ]);

    // exponential backoff until fail constants for audio websocket reconnect
      const AUDIO_RECONNECT_MS = 200;
      const AUDIO_RECONNECT_MAX = 60000;
      const AUDIO_RECONNECT_MULTIPLIER = 1.618;

    const IMMEDIATE = 0;
    const SHORT_DELAY = 20;
    const LONG_DELAY = 300;
    const VERY_LONG_DELAY = 60000;
    const EVENT_THROTTLE_MS = 60;  /* 20, 40, 80 */

  // main export
    export default async function voodoo(selector, position, {
       postInstallTasks: postInstallTasks = [],
       preInstallTasks: preInstallTasks = [],
       canvasBondTasks: canvasBondTasks = [],
       bondTasks: bondTasks = [],
       useViewFrame: useViewFrame = false,
       demoMode: demoMode = false,
    } = {}) {
      // security
        const sessionToken = globalThis._sessionToken();
        location.hash = '';

      // constants
        const closed = new Set();
        const LastFrames = new Map();
        const listeners = new Map();
        const lastTarget = '[lastTarget]';
        const state = {
          mySource: (Math.random()*1e10).toString(36)
        };
        const {tabs,vmPaused,activeTarget,requestId} = await (/*demoMode ? fetchDemoTabs() : */ fetchTabs({sessionToken}, () => state));
        // when app loads get favicons for any existing tabs 
        tabs.forEach(({targetId}) => {
          //initialGetFavicon(targetId);
          //getFavicon(targetId);
        });
        // MIGRATE (go)
        const {
          go,
          limitCursor,
        } = subviews;

      // url params
        const urlParams = new URLSearchParams(location.search);
        const urlFlags = parseURLFlags(urlParams);

      // app state
        magicAssign(state, {
          H,
          checkResults,

          // set up progress
          safariLongTapInstalled: false,

          // chrome browser UI (tabs, address bar, etc)
          chromeUI: (
            CONFIG.uiDefaultOff ? false :
            urlFlags.has('chromeUI') ? urlFlags.get('chromeUI') : (
              !DEBUG.toggleUI || 
              !deviceIsMobile() || 
              DEBUG.mobileUIDefault
            )
          ),

          // Client IME UI
          hideIMEUI,
          showIMEUI,

          // IME input detection
          detectIMEInput,

          // bandwidth
          showBandwidthIssue: false,
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
          isMobile: deviceIsMobile(),

          get currentInputLanguageUsesIME() {
            //console.log('requested ime use', this, (new Error).stack);
            self._state = state;
            return state.usingIME;
          },
          get convertTypingEventsToSyncValueEvents() {
            return state.isMobile || state.currentInputLanguageUsesIME;
          },

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
          activeTarget: null,
          tabs: tabs || [],
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

          viewState: {
            showIMEUI: true,
            ModalRef: {

            },
            bounds: {
              x: window.innerWidth,
              y: window.innerHeight,
            }
          },

          clearViewport,
          doShot,

          addListener(name, func) {
            let funcList = listeners.get(name); 

            if ( ! funcList ) {
              funcList = [];
              listeners.set(name, funcList);
            }

            funcList.push(func);
          },

          sidebarMenuActive: false,
          sessionToken,

          // services
          loggedInCount: 0,

          //multiplayer
          unreadChatCount: 0,
          chatRoute: true,
          onlineCount: 1,

          // shot acks
          screenshotReceived: false,
          latestFrameReceived: 0,
          latestCastSession: 0xCC55151C,

          // for bang!
          DEBUG,
          subviews,
          R,
          elogit,
          saveCanvas,
          throttle,
          deviceIsMobile,
          iden,
          audio_login_url,
          X,
          CHAR,
          limitCursor,
          disabled: () => state.tabs.length === 0,
          refocus: false,
          loadings: new Map(),
          contextMenuActive: false,
          contextMenuEvent: null,
          contextMenuBondTasks: makeContextMenuBondTasks(state),
          untilTrue,

          // MIGRATE (go)
          go,
          saveClick,
          logitKeyInputEvent,
          runUpdateTabs,

          // for Magic bar 
          // and also for Tor
          CONFIG,

          // for offline
          OPTIONS,
          writeCanvas,
          get setTopState() {
            return () => {
              setState('bbpro', state); 
            }
          },

          clearBrowser() {
            state.tabs = [];
            state.attached = new Set();
            state.activeTarget = null;
            state.lastTarget = null;
            state.favicons = new Map();
            state.tabMap = new Map();
            state.closed = new Set();
            state.latestRequestId = 0;
          },

          latestRequestId: 0
        });

      // variables
        let Root = document;
        let lastTime = new Date;
        let modaler;
        state.latestRequestId = requestId;

      DEBUG.exposeState && (self.state = state);

      patchGlobals();

      const updateTabs = debounce(rawUpdateTabs, LONG_DELAY);

      /*
      if ( state.demoMode ) {
        state.demoEventConsumer = demoZombie;
      } 
      */

      if ( DEBUG.dev ) {
        Object.assign(self, {state});
      }

      const {searchParams} = new URL(location);
      if ( searchParams.has('url') ) {
        let urls = [];
        try {
          const data = JSON.parse(searchParams.get('url'));
          let isList = Array.isArray(data);
          if ( isList ) {
            urls.push(...data);
          } else {
            urls.push(data);
          }
          urls = urls.map(url => {
            try {
              url = new URL(url.replace(/ /g, '+'));
              if ( url.protocol == 'web+bb:' ) {
                //url = url.href.slice(9);
                url = `${url.pathname.replace(/\/\//, '')}${url.search}${url.hash}`;
              }
              return url+'';
            } catch(e) {
              console.warn(e, url);
              return new Error(`not a URL`);
            }
          }).filter(thing => !(thing instanceof Error));
        } catch(e) {
          alert(`Issue with starting URL: ${e}`);
          console.warn(e);
        }
        postInstallTasks.push(async ({queue}) => {
          const sourceURL = new URL(location.href);
          sourceURL.hash = '';
          const source = sourceURL.origin+'';
          for( const taskUrl of urls ) {
            state.createTab(null, taskUrl, {source});
          }
          history.pushState("", "", "/");
        });
      }

      const queue = new EventQueue(state, sessionToken);
      DEBUG.val && console.log({queue});
      if ( DEBUG.fullScope ) {
        globalThis.queue = queue;
      } else {
        globalThis.queue = queue;
      }

      // check tor status
        {
          const isTorAPI = new URL(location.origin);
          isTorAPI.pathname = '/isTor';
          fetch(isTorAPI).then(r => r.json()).then(({isTor}) => {
            state.isTor = isTor;
            if ( state.isTor ) {
              setState('bbpro', state);
            }
          });
        }

      // plugins 
        /**
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
        } else if ( isFirefox() ) {
          queue.send({type:"isFirefox"});
        }
        **/

        if ( deviceIsMobile() ) {
          state.hideScrollbars();
          queue.send({type:"isMobile"});
        }

      // event handlers
        // multiplayer connections
          const MENU = new URL(location);
          MENU.port = parseInt(location.port) - 1;
          const CHAT = new URL(location);
          CHAT.port = parseInt(location.port) + 2;
          self.addEventListener('message', ({data, origin, source}) => {
            if ( origin === CHAT.origin ) {
              if ( data.multiplayer ) {
                const {chatRoute, messageReceived} = data.multiplayer;
                if ( chatRoute !== undefined ) {
                  DEBUG.val && console.log({chatRoute});
                  state.chatRoute = chatRoute;
                }
                if ( messageReceived ) {
                  DEBUG.val && console.log('message received');
                  state.unreadChatCount += 1;
                }
              }
            } else if ( origin === MENU.origin ) {
              if ( data.multiplayer ) {
                const {view} = data.multiplayer;
                DEBUG.val && console.log({view});
                state.menuView = view;
              }
            } 
            if ( state.sidebarMenuActive ) {
              if ( state.menuView === 'tab-chat' && state.chatRoute ) {
                state.unreadChatCount = 0;
              }
            }
            DEBUG.val && console.log({sidebarMenuActive: state.sidebarMenuActive});
            subviews.UnreadBadge(state);
          });
          queue.addMetaListener('resize', meta => {
            DEBUG.debugResize && console.log(`resize event`, meta);
            clearViewport();
          });
          queue.addMetaListener('multiplayer', meta => handleMultiplayerMessage(meta, state));
        
        // download progress
          queue.addMetaListener('downloPro', ({downloPro}) => {
            DEBUG.debugDownloadProgress && console.log(JSON.stringify({downloPro}, null, 2));
            const {receivedBytes, totalBytes, done, state: dlState} = downloPro;
            if ( dlState == 'canceled' ) {
              const {guid, receivedBytes} = downloPro;
              console.warn(`Download ${guid} cancelled after ${receivedBytes} bytes received.`);
            } 
            state.topBarComponent.updateDownloadStatus(downloPro);
          });

        // should go in bb-view script.js 
        // (so we can use el.shadowRoot instead of document)
        // as context for querySelector
        // audio login
        {
          const AUDIO = CONFIG.isOnion ? new URL(
              `${location.protocol}//${localStorage.getItem(CONFIG.audioServiceFileName)}`
            ) 
            : 
            new URL(location)
          ;
          AUDIO.pathname = DEBUG.useStraightAudioStream ? '/' : '/stream';
          AUDIO.port = CONFIG.isOnion ? 443 : parseInt(location.port) - 2;
          AUDIO.searchParams.set('ran', Math.random());
          if ( CONFIG.isOnion ) {
            // due to 3rd-party cookie restrictions in Tor browser we take an easy approach for now
            // simple logging in to the audio stream using a token every time, avoiding any need for cookies
            AUDIO.searchParams.set('token', localStorage.getItem(CONFIG.sessionTokenFileName));
            setupAudioElement('audio/wav');
          } else {
            self.addEventListener('message', ({data, origin, source}) => {
              DEBUG.val && console.log('message for audio', {data,origin,source});
              if ( origin === AUDIO.origin ) {
                if ( data.request ) {
                  if ( data.request.login ) {
                    DEBUG.val && console.log('send session token', data, state.sessionToken);
                    source.postMessage({login:{sessionToken:state.sessionToken}}, origin);
                  } else if ( data.request.audio ) {
                    DEBUG.debugAudio && console.log('doing audio');
                    state.loggedInCount += 1;
                    if ( state.loggedInCount >= SERVICE_COUNT ) {
                      console.log("Everybody logged in");
                      state.sessionToken = null;
                    }
                    const frame = Root.querySelector('iframe#audio-login');
                    frame?.remove();
                    if ( DEBUG.useStraightAudioStream ) {
                      setupAudioElement('audio/wav');
                    } else {
                      let activateAudio;
                      let fetchedData;
                      if ( DEBUG.includeAudioElementAnyway ) {
                        const audio = Root.querySelector('video#audio');
                        const source = document.createElement('source');
                        source.type = 'audio/wav';
                        source.src = '/silent_half-second.wav'; // this is needed to trigger web audio audibility in some browsers
                        if ( audio ) {
                          audio.append(source);
                          audio.addEventListener('playing', () => {
                            DEBUG.debugAudio && console.log('audio playing ~~ for first time since page load, so clearing buffer');
                            fetchedData = new Float32Array( 0 );
                            audio.playing = true;
                          });
                          audio.addEventListener('waiting', () => audio.playing = false);
                          audio.addEventListener('ended', () => audio.playing = false);
                          activateAudio = async () => {
                            DEBUG.debugAudio && console.log('called activate audio');
                            audio.muted = false;
                            audio.removeAttribute('muted');
                            if ( true || !audio.playing ) {
                              try {
                                DEBUG.debugAudio && console.log(`Trying to play...`);
                                await audio.play();
                                send("ack");
                              } catch(err) {
                                DEBUG.debugAudio && console.info(`Could not yet play audio`, err);
                                return;
                              }
                            }
                            if ( CONFIG.removeAudioStartHandlersAfterFirstStart ) {
                              Root.removeEventListener('pointerdown', activateAudio);
                              Root.removeEventListener('touchend', activateAudio);
                              DEBUG.debugAudio && console.log('Removed audio start handlers');
                            }
                          };
                          setTimeout(activateAudio, 0);
                          Root.addEventListener('pointerdown', activateAudio);
                          Root.addEventListener('touchend', activateAudio);
                          Root.addEventListener('click', activateAudio, {once:true});
                          DEBUG.debugAudio && console.log('added handlers', Root, audio);
                        } else {
                          console.log(Root);
                          console.warn(`Audio element 'video#audio' not found.`);
                        }
                      }
                      const audios = [];
                      self.audios = audios;
                      const wsUri = new URL(AUDIO);
                      wsUri.protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
                      wsUri.hash = '';
                      let ws;
                      const channels = 1;
                      const min_sample_duration = 0.5; // seconds;
                      const sample_rate = 44100; // Hz;
                      const min_sample_size = min_sample_duration * sample_rate;
                      let chunk_size = 2**14;
                      let counter = 1;
                      let playing = false;
                      let active = false;
                      let ctx;
                      let gain;
                      let activeNode;
                      let is_reading = false;
                      let audioReconnectMs = AUDIO_RECONNECT_MS;
                      let stopped = true;
                      fetchedData = new Float32Array( 0 );

                      const ensureResume = () => {
                        if ( ! ctx ) return;
                        ctx && ctx.resume();
                        document.removeEventListener('click', ensureResume);
                      };

                      document.addEventListener('click', ensureResume);

                      document.addEventListener('click', beginSound, {once: true});
                      beginSound();

                      function beginSound() {
                        stopped = false;
                        active = true;
                        ctx = new AudioContext({
                          sampleRate: sample_rate
                        });
                        gain = ctx.createGain();
                        gain.gain.value = 0.618;
                        gain.connect( ctx.destination );

                        connectAudio();
                        readingLoop();
                      }

                      function connectAudio() {
                        // 0 - CONNECTING, 1 - OPEN, 2 - CLOSING, 3 - CLOSED
                        if ( ws?.readyState < 2 ) return;
                        DEBUG.debugAudio && console.log(`Creating websocket...`);
                        ws = new WebSocket(wsUri);
                        DEBUG.debugAudio && console.log('Create ws');
                        DEBUG.debugAudio && console.log(`Created`, ws);
                        ws.binaryType = 'arraybuffer';

                        ws.addEventListener('open', msg => {
                          DEBUG.debugAudio && console.log('ws open');
                          DEBUG.debugAudio && console.log(`Audio websocket connected`, msg);
                          state.audioConnected = true;
                          state.setTopState();
                          audioReconnectMs = AUDIO_RECONNECT_MS;
                          setTimeout(activateAudio, 0);
                          readingLoop();
                        });

                        ws.addEventListener('close', msg => {
                          DEBUG.debugAudio && console.log(`Audio websocket closing`, msg); 
                          state.audioConnected = false;
                          audioReconnectMs = AUDIO_RECONNECT_MS;
                          setTimeout(audioReconnect, 0);
                          state.setTopState();
                        });

                        ws.addEventListener('message', async msg => {
                          DEBUG.debugAudioAcks && console.log('client got msg %s', msg.data.length || msg.data.byteLength);
                          send("ack");
                          if ( typeof msg.data === "string" ) {
                            DEBUG.debugAudioAck && console.log('audio ws message', msg.data);
                            return;
                          }
                          
                          const audioBuffer = new Int16Array(msg.data);
                          fetchedData = concat(fetchedData, audioBuffer);
                          if ( !is_reading && fetchedData.length >= min_sample_size ) {
                            readingLoop();
                          }
                        });

                        ws.addEventListener('error', async err => {
                          console.warn('Audio websocket client got error', err);
                          state.audioConnected = false;
                          audioReconnect(err);
                          state.setTopState();
                        });
                      }

                      async function audioReconnect(msg) {
                        DEBUG.debugAudio && console.log(`Audio websocket waiting ${audioReconnectMs}ms...`, {msg});
                        await sleep(audioReconnectMs);
                        audioReconnectMs *= AUDIO_RECONNECT_MULTIPLIER;
                        if ( audioReconnectMs <= AUDIO_RECONNECT_MAX ) {
                          DEBUG.debugAudio && console.log(`Audio websocket attempting reconnect...`);
                          setTimeout(connectAudio, 0); 
                        } else {
                          const keepTrying = confirm(
                            "We haven't been about to connect to the audio service for a while. Should we keep trying?"
                          );
                          if ( keepTrying ) {
                            audioReconnectMs = AUDIO_RECONNECT_MS;
                            setTimeout(audioReconnect, 0);
                          }
                        }
                      }

                      function readingLoop() {
                        if ( stopped || fetchedData.length < min_sample_size ) {
                          is_reading = false;
                          DEBUG.debugAudio && console.log('not playing');
                          return;
                        }

                        is_reading = true;
                        DEBUG.debugAudioAcks && console.log('reading');

                        const audio_buffer = ctx.createBuffer(
                          channels,
                          fetchedData.length,
                          sample_rate
                        );

                        try {
                          DEBUG.debugAudioAcks && console.log(fetchedData.length);
                          audio_buffer.copyToChannel( fetchedData, 0 );

                          fetchedData = new Float32Array( 0 );

                          activeNode = ctx.createBufferSource();
                          activeNode.buffer = audio_buffer;
                          // ended not end
                          activeNode.addEventListener('ended', () => {
                            DEBUG.debugAudioAcks && console.log('node end');
                            send("stop");
                            readingLoop();
                          });
                          activeNode.connect( gain );

                          activeNode.start( 0 );
                          DEBUG.debugAudioAcks && console.log('playing');
                        } catch(e) {
                          console.warn(e);
                        }
                      }

                      function concat( arr1, arr2 ) {
                        if( !arr2 || !arr2.length ) {
                          return arr1 && arr1.slice();
                        }
                        const arr2_32 = new Float32Array( arr2.byteLength / 2 );
                        const dv = new DataView( arr2.buffer );
                        for( let i = 0, offset = 0; offset < arr2.byteLength; i++, offset += 2 ) {
                          const v = dv.getInt16(offset, true);
                          arr2_32[i] = v > 0 ? (v / 32767.0) : (v / 32768.0);
                        }
                        const out = new arr1.constructor( arr1.length + arr2_32.length );
                        out.set( arr1 );
                        out.set( arr2_32, arr1.length );
                        DEBUG.debugAudioAcks && console.log('out length ' + out.length);
                        return out;
                      }

                      function send(o) {
                        if ( typeof o === 'string' ) {
                          ws.send(o);
                        } else if ( o instanceof ArrayBuffer ) {
                          ws.send(o);
                        } else {
                          ws.send(JSON.stringify(o));
                        }
                      }

                      function startPlaying() {
                        DEBUG.debugAudio && console.log('start playing', playing, audios);
                        if ( playing || !active ) return;
                        console.warn(`startPlaying not implemented yet`);
                      }
                    }
                  }
                }
              }
            });
          }

          async function setupAudioElement(type = 'audio/wav') {
            const bb = document.querySelector('bb-view');
            if ( !bb?.shadowRoot ) {
              await untilTrue(() => !!document.querySelector('bb-view')?.shadowRoot, 1000, 600);
            }
            Root = document.querySelector('bb-view').shadowRoot;
            Root = document.querySelector('bb-view').shadowRoot;
            const audio = Root.querySelector('video#audio');
            //const source = document.createElement('source');
            setAudioSource(AUDIO);
            DEBUG.debugAudio && console.log({'audio?': audio});
            let existingTimer = null;
            let waiting = false;
            if ( audio ) {
              //audio.append(source);
              // Event listener for when audio is successfully loaded
              audio.addEventListener('loadeddata', () => {
                console.log('Audio loaded');
                audio.play();
              });

              audio.addEventListener('playing', () => {
                audio.playing = true;
                audio.hasError = false;
              });
              // Event listener for playing state
              audio.addEventListener('play', () => {
                audio.playing = true;
                audio.hasError = false;
                console.log('Audio playing');
              });

              audio.addEventListener('waiting', () => audio.playing = false);
              audio.addEventListener('ended', () => {
                audio.playing = false;
                DEBUG.debugAudio && console.log(`Audio stream ended`);
                existingTimer = setTimeout(startAudioStream, 100);
              });
              audio.addEventListener('error', err => {
                audio.playing = false;
                audio.hasError = true;
                DEBUG.debugAudio && console.log(`Audio stream errored`, err);
              });
              // Event listener for pause state
              audio.addEventListener('pause', () => {
                audio.playing = false;
                console.log('Audio paused');
              });

              const activateAudio = async () => {
                DEBUG.debugAudio && console.log('called activate audio');
                if ( audio.muted || audio.hasAttribute('muted') ) {
                  audio.muted = false;
                  audio.removeAttribute('muted');
                }
                if ( !audio.playing ) {
                  try {
                    startAudioStream();
                    //send("ack");
                  } catch(err) {
                    DEBUG.debugAudio && console.info(`Could not yet play audio`, err); 
                    return;
                  }
                }
                if ( CONFIG.removeAudioStartHandlersAfterFirstStart /*|| CONFIG.isOnion */ ) {
                  Root.removeEventListener('pointerdown', activateAudio);
                  Root.removeEventListener('touchend', activateAudio);
                  DEBUG.debugAudio && console.log('Removed audio start handlers');
                }
              };
              Root.addEventListener('pointerdown', activateAudio);
              Root.addEventListener('touchend', activateAudio);
              Root.addEventListener('click', activateAudio, {once:true});
              DEBUG.debugAudio && console.log('added handlers', Root, audio);

              async function startAudioStream() {
                setAudioSource(AUDIO);
              }
            } else {
              console.log(Root);
              console.warn(`Audio element 'video#audio' not found.`);
            }

            function setAudioSource(src) {
              // Check if the audio is already loading or playing the same source
              if (audio.src === src && !audio.error && ! audio.hasError && (audio.readyState > 2 || audio.playing)) {
                console.log('Audio is already playing or loading this source');
                return;
              }

              // Reset error state and set the new source
              audio.hasError = null;
              audio.src = src;
            }
          }
        }

        // input
          queue.addMetaListener('selectInput', meta => handleSelectMessage(meta, state));
          queue.addMetaListener('selectInput', meta => console.log({meta}));
          queue.addMetaListener('keyInput', meta => handleKeysCanInputMessage(meta, state));
          queue.addMetaListener('favicon', meta => handleFaviconMessage(meta, state));
          //queue.addMetaListener('navigated', () => canKeysInput());
          queue.addMetaListener('navigated', async ({navigated:{targetId}}) => {
            await resetFavicon({targetId}, state);
            // reset favicon event to send to remote
            //initialGetFavicon(targetId);
            //getFavicon(targetId);
          });

        //queue.addMetaListener('navigated', meta => takeShot(meta, state));

        // element info
          queue.addMetaListener('elementInfo', meta => handleElementInfo(meta, state));
          DEBUG.debugCopyPaste && queue.addMetaListener('elementInfo', meta => console.info('Element info', meta));

        // scroll
          queue.addMetaListener('scroll', meta => handleScrollNotification(meta, state));

        // loading
          queue.addMetaListener('resource', meta => showLoadingIndicator(meta, state));
          queue.addMetaListener('failed', meta => {
            if ( meta.failed.params.type == "Document" ) {
              // we also need to make sure the failure happens at the top level document
              // rather than writing the top level document for any failure in a sub frame
              if ( meta.failed.params.errorText && meta.failed.params.errorText.includes("ABORTED") ) {
                // do nothing. Aborts are normal, and just mean existing document stays there. If we 
                // overwrite that document with an aborted message, the normal function of the page
                // will fail
                // so we could notify with a writeCanvas instead
                // writeCanvas(`Request failed: ${meta.failed.params.errorText}`, meta.failed.frameId, meta.failed.sessionId);
                // but there's not really any point since these aborted errors are normally 
                // quickly followed by something that works
                // plus people are not used to seeing aborted
              } else {
                writeDocument(`Request failed: ${meta.failed.params.errorText}`, meta.failed.frameId, meta.failed.sessionId);
              }
            }
          });
          queue.addMetaListener('navigated', meta => resetLoadingIndicator(meta, state));

        if ( DEBUG.val >= DEBUG.med ) {
          queue.addMetaListener('vm', meta => console.log(meta));
          queue.addMetaListener('modal', meta => console.log(meta));
          queue.addMetaListener('navigated', meta => console.log(meta));
          queue.addMetaListener('changed', meta => console.log(meta));
          queue.addMetaListener('created', meta => console.log(meta));
          queue.addMetaListener('attached', meta => console.log(meta));
          queue.addMetaListener('detached', meta => console.log(meta));
          queue.addMetaListener('destroyed', meta => console.log(meta));
          queue.addMetaListener('crashed', meta => console.log(meta));
          queue.addMetaListener('consoleMessage', meta => console.log(meta));
        }

        // vm
          queue.addMetaListener('vm', ({vm}) => {
            // as soon as the remote JS vm is unpaused (after dialog closed, for example)
            // fetch the tabs
            DEBUG.debugModal && console.log({vm});
            if ( !vm.paused ) {
              // update tabs (to trigger vm paused warning if it's still paused
              // 1 second after a modal closes only if there is no other modal open then
              clearTimeout(modaler);
              modaler = setTimeout(() => !state.viewState.currentModal && updateTabs(), 1000);
            }
          });

        // tabs
          // patch tabs array with changes as they come through
            queue.addMetaListener('changed', ({changed}) => {
              const tab = findTab(changed.targetId);
              if ( tab ) {
                Object.assign(tab, changed);
                setState('bbpro', state);
              } else {
                DEBUG.activateDebug && console.warn(`changed tab not found in our list`, changed);
              }
              updateTabs();
            });

          queue.addMetaListener('created', meta => {
            if ( meta.created.type == 'page') {
              meta.created.hello = 'oncreated';
              const activate = () => activateTab(null, meta.created, {notify: false, forceFrame:true})
              const tab = findTab(meta.created.targetId);
              if ( tab ) {
                if ( DEBUG.activateNewTab ) {
                  DEBUG.val && console.log('Setting activate to occur after delay for new tab');
                  setTimeout(activate, LONG_DELAY);
                }
              } else {
                DEBUG.activateDebug && console.warn('created tab not found in our list', meta.created);
                if ( DEBUG.activateNewTab ) {
                  DEBUG.activateDebug && console.log('Pushing activate for new tab');
                  state.updateTabsTasks.push(activate);
                }
                updateTabs();
              }
            }
          });
          queue.addMetaListener('attached', meta => {
            const attached = meta.attached.targetInfo;
            if ( attached.type == 'page' ) {
              state.attached.add(attached.targetId);

              if ( state.useViewFrame ) {
                //sizeBrowserToBounds(state.viewState.viewFrameEl, attached.targetId);
              } else {
                //sizeBrowserToBounds(state.viewState.canvasEl, attached.targetId);
                emulateNavigator();
              }
              //state.updateTabsTasks.push(() => initialGetFavicon(attached.targetId));
              updateTabs();
            }
          });
          queue.addMetaListener('navigated', updateTabs);
          queue.addMetaListener('detached', updateTabs);
          queue.addMetaListener('destroyed', ({destroyed}) => {
            closed.delete(destroyed.targetId);
            state.attached.delete(destroyed.targetId);
            LastFrames.delete(destroyed.targetId);
            updateTabs();
          });
          queue.addMetaListener('crashed', updateTabs);
          queue.addMetaListener('activateTarget', ({activateTarget}) => {
            (DEBUG.val || DEBUG.activateDebug) && console.log(`Received activate request`, {activateTarget});
            if ( activateTarget.source == state.mySource ) {
              (DEBUG.val || DEBUG.activateDebug) && console.log(`Ignoring activate request as came from us`);
              return;
            }
            const tab = findTab(activateTarget.targetId);
            const activate = () => activateTab(null, activateTarget, {notify: false, forceFrame:true})
            activateTarget.hello = 'refered->active';
            if ( tab ) {
              if ( DEBUG.activateNewTab ) {
                (DEBUG.val || DEBUG.activateDebug) && console.log('Refered -> Activate now');
                activate();
              }
            } else {
              DEBUG.activateDebug && console.warn(
                'activateTarget: created tab not found in our list', 
                activateTarget
              );
              if ( DEBUG.activateNewTab ) {
                DEBUG.activateDebug && console.log('Refered -> Pushing activate for new tab');
                state.updateTabsTasks.push(activate);
              }
              updateTabs();
            }
          });

        //modals
          queue.addMetaListener('modal', modalMessage => state.viewState.modalComponent.openModal(modalMessage));
          queue.addMetaListener('closeModal', modalCloseRequest => {
            DEBUG.val && console.log({modalCloseRequest});
            DEBUG.debugModal && console.log({modalCloseRequest});
            state.viewState.modalComponent.onlyCloseModal(state.viewState.modalComponent.state);
            // update tabs (to trigger vm paused warning if it's still paused
            // 1 second after a modal closes only if there is no other modal open then
            clearTimeout(modaler);
            modaler = setTimeout(() => !state.viewState.currentModal && updateTabs(), 1000);
          });

        // remote secure downloads
          queue.addMetaListener('download', ({download}) => {
            const {sessionId, filename} = download;
            const ext = filename.toLowerCase().split('.').pop();
            let message;
            if ( FLASH_FORMATS.has(ext) ) {
              message = `The Adobe Flash file "${filename}" is saving to the server and will be opened with the Ruffle Flash Emulator soon.`;
            } else if ( DOC_FORMATS.has(ext) ) {
              message = `The ${ext.toUpperCase()} document "${filename}" is saving to the server and will be opened with the DocumentSpark Secure Document Viewer CDR Tool soon.`;
            } else {
              message = `The ${ext.toUpperCase()} file "${filename}" is saving to the server and will be displayed soon if it is a supported format.`;
            }
            const modal = {
              sessionId,
              type: 'notice',
              message,
              /*
                otherButton: {
                  title: 'Buy',
                  onclick: () => window.top.open('https://buy.stripe.com/dR615g7hL0Mjeek5kx', "_blank")
                },
              */
              title: "SecureView\u2122 Enabled",
            };
            CONFIG.showModalOnFileDownload && state.viewState.modalComponent.openModal({modal});
          });

          queue.addMetaListener('secureview', ({secureview}) => {
            DEBUG.val && console.log('secureview', secureview);
            const {url} = secureview;
            if ( url ) {
              if ( DEBUG.useWindowOpenForSecureView ) {
                window.top.open(url);
              } else {
                createTab(null, url);
              }
            }
          });

          queue.addMetaListener('bandwidthIssue', ({bandwidthIssue}) => {
            const showBandwidthIssue = bandwidthIssue == 'yes';
            if ( state.showBandwidthIssue != showBandwidthIssue ) {
              DEBUG.logBandwidthIssueChanges && console.log({bandwidthIssue});
              state.showBandwidthIssue = showBandwidthIssue;
              setState('bbpro', state);
            }
          });

          queue.addMetaListener('flashplayer', ({flashplayer}) => {
            const {url} = flashplayer;
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
            title: `HTTP Authentication`,
          };
          state.viewState.modalComponent.openModal({modal});
        });

        // File chooser 
        queue.addMetaListener('fileChooser', ({fileChooser}) => {
          const {sessionId, mode, accept, csrfToken} = fileChooser;
          DEBUG.val && console.log('client receive file chooser notification', fileChooser);
          const modal = {
            sessionId, mode, accept, csrfToken,
            type: 'filechooser',
            message: `Securely send files to the remote page.`,
            title: `File Upload`,
          };
          DEBUG.val && console.log({fileChooserModal:modal});
          state.viewState.modalComponent.openModal({modal});
        });
      
      // make this so we can call it on resize
        window._voodoo_asyncSizeTab = async (opts) => {
          await sleep(40);
          return sizeTab(opts);
        };

      // bond tasks 
        canvasBondTasks.push(indicateNoOpenTabs);
        canvasBondTasks.push(installZoomListener);
        canvasBondTasks.push(el => asyncSizeBrowserToBounds(el, null, {resetRequested:false}));
        canvasBondTasks.push(rawUpdateTabs);
        if ( isSafari() ) {
          canvasBondTasks.push(installSafariLongTapListener);
        }

        bondTasks.push(canKeysInput);
        bondTasks.push(installTopLevelKeyListeners);

      const preInstallView = {queue};

      for( const task of preInstallTasks ) {
        try {
          task(preInstallView);
        } catch(e) {
          console.error(`Task ${task} failed with ${e}`);
        }
      }

      bangFig({
        componentsPath: './voodoo/src/components',
        useMagicClone: true
      });
      await bangLoaded();

      {
        DEBUG.val && console.log('bang loaded: main voodoo module script.');
        /*
          component(state).then(async x => {
            console.log({x});
            const y = await x(state);
            console.log({y});
            Root = document;
            y.to(selector, position);
          }).catch(err => console.log({err}));
        */
        try {
          await component(state);
          await subviews.Controls(state);
          setEnv({
            DEBUG,
            DEFAULT_FAVICON
          });
          setState('bbpro', state);
          use('bb-view'); 
          use('bb-bar');
          use('bb-tabs'); 
          use('bb-ctrl');
          use('bb-select-tab');
          use('bb-favicon');
          use('bb-loading-indicator');
          use('bb-context-menu');
          use('bb-omni-box');
          use('bb-top-bar');
          use('bb-modals');
          use('bb-resize-button');
          use('bb-bw-spinner');
          use('bb-settings-button');
          const bb = document.querySelector('bb-view');
          if ( !bb?.shadowRoot ) {
            await untilTrue(() => !!document.querySelector('bb-view')?.shadowRoot);
          }
          Root = document.querySelector('bb-view').shadowRoot;
        } catch(e) {
          console.error(e);
        }
      }

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

      const poppetView = {/*loadPlugin,*/ api};

      const postInstallView = {queue};

      await sleep(0);

      for( const task of postInstallTasks ) {
        try {
          await task(postInstallView);
        } catch(e) {
          console.error(`Task ${task} failed with ${e}`);
        }
      }

      window.addEventListener('offline', () => {
        setTimeout(() => {
          setState('bbpro', state);
          writeCanvas("No connection to server");
        },0);
      });

      window.addEventListener('online', () => {
        setTimeout(() => {
          setState('bbpro', state);
          writeCanvas("Online. Connecting...");
        }, 0);
      });

      if ( activeTarget ) {
        setTimeout(() => activateTab(null, {hello:'onload', targetId:activeTarget}, {forceFrame:true}), LONG_DELAY);
      }

      return poppetView;

      // closures
        function checkResults() {
          queue.checkResults();
        }

        function doShot() {
          setTimeout(() => {
            queue.send({
              type: "doShot",
              synthetic: true
            });
          }, SHORT_DELAY);
        }

        function runUpdateTabs() {
          DEBUG.debugTabs && console.log(`Run update tabs called`);
          updateTabs();
        }

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
              //writeCanvas("");
              //writeCanvas("\u{1f608}", {Y:y => y + 50, noClear: true})
            }
          }
        }

        function writeCanvas(text, {X,Y,noClear: noClear = false} = {}) {
          const canv = state.viewState.canvasEl;
          const ctx = state.viewState.ctx;
          if ( ! ctx || ! canv ) {
            console.warn(`No canvas found yet`);
            return;
          }
          ctx.fillStyle = CONFIG.darkMode ? 'black' : 'white';
          if ( !noClear ) {
            ctx.fillRect(0, 0, canv.width, canv.height);
          }
          ctx.fillStyle = 'silver';
          ctx.font = '3vmax sans-serif';
          ctx.textAlign = "center";
          let x = canv.width/2;
          let y = canv.height/2-6*Math.max(canv.width/100, canv.height/100);
          if ( X ) x = X(x);
          if ( Y ) y = Y(y);
          ctx.fillText(text, x, y);
        }

        function writeDocument(html, frameId, sessionId) {
          queue.send({
            type: 'setDocument',
            html, frameId, sessionId,
            synthetic: true
          });
        }

        function clearViewport() {
          //return;
          if ( state.useViewFrame ) {
            try {
              state.viewState.viewFrameEl.contentDocument.body.innerHTML = ``;
            } catch(e) {
              console.warn(e);
            }
          } else {
            const canv = state.viewState.canvasEl;
            const ctx = state.viewState.ctx;
            ctx.fillStyle = CONFIG.darkMode ? 'black' : 'white';
            ctx.fillRect(0, 0, canv.width, canv.height);
          }
        }

        function sendKey(keyEvent) {
          if ( DEBUG.debugKeyEvents ) {
            //console.info(`[sendKey]: got event: ${keyEvent.key} (${keyEvent.type.slice(3)})`, keyEvent);
          }
          const {viewState} = state;
          if ( ! ( viewState.shouldHaveFocus || document.deepActiveElement == viewState.omniBoxInput ) ) {
            let ev = keyEvent;
            if ( ev.key == "Tab" || ev.key == "Enter" ) {
              // do nothing
            } else{
              console.info(`[sendKey]: sending event: ${keyEvent.key}`, keyEvent);
              H(ev);
            }
          }
        }

        function installTopLevelKeyListeners() {
          if ( ! deviceIsMobile() && CONFIG.useTopLevelSendKeyListeners ) {
            self.addEventListener('keydown', sendKey); 
            self.addEventListener('keypress', sendKey);
            self.addEventListener('keyup', sendKey); 
          }
        }

        function installSafariLongTapListener(el) {
          if ( state.safariLongTapInstalled ) return;
          const FLAGS = {passive:true, capture:true};
          const MIN_DURATION = CTX_MENU_THRESHOLD;
          const MAX_MOVEMENT = 24;
          let triggered = false;
          let maxMovement = 0;
          let lastStart;
          let lastE;
          let triggerTimer;
          let expireIgnoreTimer;
          let timeStarted = 0;
          el.addEventListener('touchstart', ts => {
            DEBUG.debugContextMenu && console.log(`Touchstart`);
            triggered = false;
            timeStarted = Date.now();
            maxMovement = 0;
            lastStart = ts;
            lastE = null;
            if ( triggerTimer ) clearTimeout(triggerTimer);
            DEBUG.debugContextMenu && console.log(`Starting Safari context menu trigger timer...`);
            triggerTimer = setTimeout(() => {
              triggerContextMenuUnlessMoved(ts, 'timer');
            }, CTX_MENU_THRESHOLD);
          }, FLAGS);

          el.addEventListener('touchmove', tm => {
            DEBUG.debugContextMenu && console.log(`Touchmove`);
            lastE = tm;
            const touch1 = lastStart.changedTouches[0];
            const touch2 = tm.changedTouches[0];
            const movement = Math.hypot(
              touch2.pageX - touch1.pageX,
              touch2.pageY - touch1.pageY
            );

            maxMovement = Math.max(maxMovement, movement);
            DEBUG.debugContextMenu && console.log({maxMovement});
            if ( maxMovement > MAX_MOVEMENT ) {
              DEBUG.debugContextMenu && console.log(`Clearing trigger timer.`);
              clearTimeout(triggerTimer);
            }
            triggerContextMenuIfLongEnough(tm);
          }, FLAGS);

          el.addEventListener('touchend', te => {
            DEBUG.debugContextMenu && console.log(`Touchend`);
            if ( triggerTimer ) clearTimeout(triggerTimer);
            triggerContextMenuIfLongEnough(te);
          }, FLAGS)

          el.addEventListener('touchcancel', tc => {
            DEBUG.debugContextMenu && console.log(`Touchcancel`);
            if ( triggerTimer ) clearTimeout(triggerTimer);
            triggerContextMenuIfLongEnough(tc);
          }, FLAGS);

          state.safariLongTapInstalled = true;

          function triggerContextMenuIfLongEnough(tf) {
            DEBUG.debugContextMenu && console.log(`Maybe triggering unless long enough`, {triggered});
            if ( triggered ) return;
            const touch1 = lastStart.changedTouches[0];
            let movement = 0;
            let duration = CTX_MENU_THRESHOLD;

            // space 
              const touch2 = tf.changedTouches[0];
              movement = Math.hypot(
                touch2.pageX - touch1.pageX,
                touch2.pageY - touch1.pageY
              );
            // time
              duration = Date.now() - timeStarted;

            DEBUG.debugContextMenu && console.log({duration, movement, maxMovement});

            if ( duration >= MIN_DURATION && movement <= MAX_MOVEMENT && maxMovement <= MAX_MOVEMENT ) {
              triggered = true;
              DEBUG.debugContextMenu && console.log(`Triggering Safari context menu because not moved and long enough...`);
              /**
              lastStart.preventDefault();
              tf && tf.preventDefault();
              **/
              const {pageX,pageY,clientX,clientY} = touch1;
              console.log({pageX,pageY,clientX,clientY});
              el.dispatchEvent(new CustomEvent('contextmenu', {detail:{pageX, pageY, clientX, clientY}}));
            }
          }

          function triggerContextMenuUnlessMoved(event, timer) {
            DEBUG.debugContextMenu && console.log(`Maybe triggering unless moved`, {triggered});
            if ( triggered ) return;
            const touch1 = lastStart.changedTouches[0];
            const tf = lastE || event;
            if ( ! lastE && ! timer ) {
              DEBUG.debugContextMenu && console.log(
                `Bailing out of trigger because not initiated by timer and no last (non touchstart) event`
              );
              return;
            }
            let movement = 0;

            // space 
              const touch2 = tf.changedTouches[0];
              movement = Math.hypot(
                touch2.pageX - touch1.pageX,
                touch2.pageY - touch1.pageY
              );
            // time
            if ( movement <= MAX_MOVEMENT && maxMovement <= MAX_MOVEMENT ) {
              triggered = true;
              DEBUG.debugContextMenu && console.log(`Triggering Safari context menu because already long enough and not moved...`);
              if ( timer ) {
                clearTimeout(expireIgnoreTimer);
                state.ignoreNextClickEvent = true;
                expireIgnoreTimer = setTimeout(() => state.ignoreNextClickEvent = false, 1503);
                lastStart && lastStart.preventDefault();
                lastStart && lastStart.stopPropagation();
                tf && tf.preventDefault();
                tf && tf.stopPropagation();
              }
              const {pageX,pageY,clientX,clientY} = touch1;
              DEBUG.debugContextMenu && console.log({pageX,pageY,clientX,clientY});
              el.dispatchEvent(new CustomEvent('contextmenu', {detail:{pageX, pageY, clientX, clientY}}));
            }
          }
        }

        function installZoomListener(el) {
          /*
          console.log(`Zoom listener switched off.`);
          return;
          */
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

        /* H is for human. It's the things the Human does to the remote browser */
        function H(event) {
          // block if no tabs

          //DEBUG.debugKeyEvents && event.type.startsWith('key') && console.info(`[H]: got key event: ${event.key} (${event.type.slice(3)})`, event);

          DEBUG.HFUNCTION && console.log(`H received`, event);
          if (state.tabs.length == 0) {
            if ( SessionlessEvents.has(event.type) ) {
              DEBUG.val > DEBUG.low && console.log(`passing through sessionless event of type ${event.type}`);
            } else return;
          }

          if ( event.defaultPrevented ) return;

          const mouseEventOnPointerDevice = event.type.startsWith("mouse") && event.type !== "wheel" && !state.DoesNotSupportPointerEvents;
          const tabKeyPressForBrowserUI = event.key == "Tab" && !event.vRetargeted;
          const touchEvent = event.type.startsWith('touch');
          const unnecessaryIfSyncValue = (
            state.convertTypingEventsToSyncValueEvents && 
            CancelWhenSyncValue.has(event.type) &&
            EnsureCancelWhenSyncValue(event)
          );
          const eventCanBeIgnored = mouseEventOnPointerDevice || tabKeyPressForBrowserUI || unnecessaryIfSyncValue;
          
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

          const transformedEvent = transformEvent(event, {scale: state.viewState.scale}, state.viewState.bounds);

          if ( mouseWheel ) {
            transformedEvent.contextId = state.viewState.latestScrollContext;
          }
          
          if ( (event.type.startsWith('key')) && (event.code === 229 || event.keyCode === 229) ) {
            showIMEUI();
          } 

          if ( touchEvent ) {
            DEBUG.HFUNCTION && console.log(`H Sending`, transformedEvent);
            queue.send(transformedEvent);
          } else if ( isThrottled ) {
            DEBUG.HFUNCTION && console.log(`H Sending`, transformedEvent);
            queue.send(transformedEvent);
            DEBUG.debugKeyEvents && event.type.startsWith('key') && console.info(`[H]: sent key event: ${event.key} (${event.type.slice(3)})`);
          } else {
            if ( event.type == "keydown" && event.key == "Enter" ) {
              // Note
                // We do this to make sure we send composed input data when enter is pressed
                // in an input field, if we do not do this, the current composition is not printed
                // but only if we are not using sync mode 
                // (otherwise we will add an unnecessary bit on the end!)
              if ( ! state.convertTypingEventsToSyncValueEvents ) {
                if ( 
                      !! state.latestData && 
                      !! event.target.matches('input') && 
                      state.latestData.length > 1 
                    ) {
                  const newEvent = transformEvent({
                    synthetic: true,
                    type: 'typing', 
                    data: state.latestData,
                    event: {enterKey:true,simulated:true}
                  }, {scale: state.viewState.scale}, state.viewState.bounds);
                  DEBUG.HFUNCTION && console.log(`H Sending`, newEvent);
                  queue.send(newEvent);
                  DEBUG.debugKeyEvents && console.info(`[H]: sent key event: ${event.key} (${event.type.slice(3)})`);
                  state.latestCommitData = state.latestData;
                  state.latestData = "";
                } 
              }
            } else if ( event.type == "keydown" && event.key == "Backspace" ) {
              state.backspaceFiring = true;
              if ( state.viewState.shouldHaveFocus && ! state.convertTypingEventsToSyncValueEvents ) {
                state.viewState.shouldHaveFocus.value = "";
              }
            } else if ( event.type == "keyup" && event.key == "Backspace" ) {
              state.backspaceFiring = false;
            } else if ( event.type == "pointerdown" || event.type == "mousedown" ) {
              if ( ! state.convertTypingEventsToSyncValueEvents ) {
                //const {timeStamp,type} = event;
                const {latestData} = state;
                if ( !! state.viewState.shouldHaveFocus && !! latestData && latestData.length > 1 && latestData != state.latestCommitData) {
                  state.isComposing = false;
                  const data = latestData;
                  const newEvent = transformEvent({
                    synthetic: true,
                    type: 'typing', 
                    data: data,
                    event: {pointerDown:true,simulated:true}
                  }, {scale: state.viewState.scale}, state.viewState.bounds);
                  DEBUG.HFUNCTION && console.log(`H Sending`, newEvent);
                  queue.send(newEvent);
                  state.latestCommitData = data;
                  state.latestData = "";
                }
              }
            } else if ( event.type == "pointerup" || event.type == "mouseup" ) {
              if ( state.viewState.killNextMouseReleased ) {
                state.viewState.killNextMouseReleased = false;
                return;
              }
            }
            DEBUG.HFUNCTION && console.log(`H Sending`, transformedEvent);
            queue.send(transformedEvent);
            DEBUG.debugKeyEvents && event.type.startsWith('key') && console.info(`[H]: sent key event: ${event.key} (${event.type.slice(3)})`);
          }
        }

        function dalert(...args) {
          return;
          setTimeout(() => alert(...args), 1000);
        }

        async function sizeBrowserToBounds(el, targetId, opts) {
          if ( opts && !validOpts(opts, 'resetRequested', 'forceFrame') ) {
            console.log(`Invalid viewport size options given`, opts);
            throw new TypeError(`sizeBrowser options currently only support 'resetRequested' key.`);
          }
          el = el || await untilTrue(() => !!state.viewState.canvasEl) && state.viewState.canvasEl;
          await untilTrue(() => state?.viewState?.bbView?.classList?.contains('bang-styled'));
          if ( ! el ) {
            //throw new TypeError(`sizeBrowserToBounds needs to be called with element as argument.`);
            DEBUG.val && console.warn(new TypeError(`sizeBrowserToBounds needs to be called with element as argument.`));
            return;
          }
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
            targetId: targetId || state.activeTarget,
            ...opts
          });
          H({ synthetic: true,
            type: "window-bounds-preImplementation",
            width,
            height,
            mobile,
            targetId: targetId || state.activeTarget,
            ...opts
          });
          self.ViewportWidth = width;
          self.ViewportHeight = height;
          return {width,height};
        }

        function validOpts(obj, ...keys) {
          keys = new Set(keys);
          const valid = Object.keys(obj).every(k => keys.has(k));
          return valid;
        }

        function showIMEUI(skipCheck = false) {
          if ( 
            !skipCheck && 
            state.viewState.showIMEUI && 
            document.deepActiveElement.matches('.control')
          ) return;

          DEBUG.val && console.log('show IME UI');

          state.viewState.showIMEUI = true;
          state.viewState.skipIMECheck = skipCheck;
          setState('bbpro', state);

          if ( skipCheck ) {
            state.viewState.skipIMECheck = false;
          }
        }

        function hideIMEUI(blur) {
          if ( ! state.viewState.showIMEUI && ! document.deepActiveElement.matches('.control') ) return;
          DEBUG.val && console.log('hide IME UI');
          state.viewState.showIMEUI = false;
          setState('bbpro', state);
        }

        function sizeTab(opts) {
          return sizeBrowserToBounds(state.viewState.canvasEl, null, opts);
        }

        function asyncSizeBrowserToBounds(el, opts) {
          setTimeout(() => (sizeBrowserToBounds(el, null, opts), indicateNoOpenTabs()), 0);
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

        async function activateTab(click, tab, {
            notify: notify = true, 
            forceFrame: forceFrame = false
          } = {}) {
            DEBUG.activateDebug && console.log('activate called', click, tab, {notify, forceFrame});

            sizeTab();

            // don't activate if the click was a close click from our tab
            if ( click && click.currentTarget.querySelector('button.close') == click.target ) return;

            click && click.preventDefault(); 

            // sometimes we delay the call to activate tab and
            // in the meantime the list of tabs can empty
            // so we exit if there is no tab to activate
            if ( ! tab ) return;

            const ourtab = findTab(tab.targetId);
           
            if ( ! ourtab ) {
              DEBUG.val && console.log('No such tab', tab);
              updateTabs();
              return;
            } else {
              tab = ourtab;
            }
            DEBUG.val && console.log('Activating?', tab);

            if ( state.activeTarget == tab.targetId ) {
              if ( state.chromeUI ) { // otherwise there is no omniBoxInput
                if ( state.viewState.omniBoxInput == state.viewState.lastActive ) {
                  state.viewState.omniBoxInput?.focus();
                }
              }
            }

            DEBUG.val && console.log('Activating', tab);

            if ( state.tabs.length === 1 ) {
              DEBUG.val && console.log('first tab');
              // this is due to some bug
              // not sure from where, could be chrome
              // the first tab always needs a resize to fit the screen
              // but subsequent tabs are cool, even if no resize is done
              //setTimeout(() => sizeBrowserToBounds(state.viewState.canvasEl, tab.targetId, {resetRequested:false}), 1000);
            }

            const {targetId} = tab;
            let needsShot = false;

            // grab the last cached frame of the new active, 
            // and save this current tab's frame for when we swtich back to it
            const lastFrame = state.viewState.canvasEl?.toDataURL();
            LastFrames.set(state.activeTarget, lastFrame);
            const nextFrame = LastFrames.get(targetId);
            if ( nextFrame ) {
              const imageEl = queue.getImageEl();
              imageEl.oldSrc = imageEl.src;
              imageEl.src = nextFrame;
            } else {
              clearViewport();
              needsShot = true;
            }

            queue.send({
              command: {
                name: "Target.activateTarget",
                params: {targetId},
                requiresShot: true,
                forceFrame
              }
            });
            if ( notify ) {
              state.H({
                synthetic: true,
                type: 'activate-target',
                source: state.mySource,
                targetId
              });
            }

            state.lastTarget = state.activeTarget;
            state.activeTarget = targetId;
            state.active = activeTab();

            setState('bbpro', state);

            if ( CONFIG.doAckBlast ) {
              clearInterval(state.currentAckBlastInterval);
              const startTime = Date.now();
              state.currentAckBlastInterval = setInterval(() => {
                if ( (Date.now() - startTime) > CONFIG.ACK_BLAST_LENGTH ) {
                  clearInterval(state.currentAckBlastInterval);
                } else {
                  queue.sendAck();
                }
              }, 300);
            }

            if ( needsShot ) {
              DEBUG.debugActivate && console.warn(`Needs shot`, state.active);
            }

            const now = new Date;
            const delta = now - lastTime;
            if ( delta > 1000 ) {
              lastTime = now;
              setTimeout(() => {
                let el;
                if ( click ) {
                  el = click.target;
                } else if ( ! notify ) {
                  el = Array.from(Root.querySelectorAll('nav.targets li.tab-selector a'))
                    .find(el => el.href.endsWith(tab.targetId));
                }
                el?.scrollIntoView({behavior:'smooth',inline:'center'});
              }, 500);
            }

            setTimeout(() => {
              if ( state.active && state.active.url != BLANK ) {
                canKeysInput();
              } else {
                /**
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
                      Secure BrowserBox 
                    </h2>
                    <strong>
                      Current time: ${(new Date).toString()}
                    </strong>
                  </html>
                `);
                **/
                //writeCanvas("");
                if ( ! state.viewState.omniBoxInput ) {
                  console.warn(`No omni box found yet.`);
                  return;
                }
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
              newActive.hello = 'onclose';
              activateTab(click, newActive);
            }
          } else {
            updateTabs();
          }
          setState('bbpro', state);
        }

        async function rawUpdateTabs() {
          DEBUG.val && console.log('Update tabs');
          try {
            let {tabs,vmPaused,activeTarget,requestId} = await (demoMode ? fetchDemoTabs() : fetchTabs({sessionToken}, () => state));
            if ( vmPaused ) {
              // indicatePaused?
              DEBUG.debugModal && console.log(`VMPAUSED`, tabs);
            } else {
              tabs = tabs.filter(({targetId}) => !closed.has(targetId));
              tabs.forEach(({targetId,attached}) => {
                if ( attached ) {
                  state.attached.add(targetId); 
                }
              });

              if ( requestId <= state.latestRequestId ) {
                return;
              } else {
                state.latestRequestId = requestId;
              }
              state.tabs = tabs;
              if ( ! state.tabMap ) {
                state.tabMap = new Map(state.tabs.map(tab => [tab.targetId, tab]));
              } else {
                // merge tab data into existing data
                for( const tab of tabs ) {
                  const existingTab = state.tabMap.get(tab.targetId);
                  if ( ! existingTab ) {
                    state.tabMap.set(tab.targetId, tab);
                  } else {
                    Object.assign(existingTab, tab);
                  }
                }
              }
              // this ensures we activate the tab
              if ( state.tabs.length ) {
                if ( state.tabs.length == 1 ) {
                  setTimeout(() => activateTab(null, {hello:'onupdate.len1', targetId:state.tabs[0].targetId}, {forceFrame:true}), LONG_DELAY);
                } else if( !activeTarget ) {
                  setTimeout(() => activateTab(null, {hello:'onupdate.noactive', targetId:state.tabs[0].targetId}, {forceFrame:true}), LONG_DELAY);
                } else {
                  // the reason we don't set timeout here is because if we did
                  // this activation (of the current tab) would occur after any activation
                  // (of some new tab or whatever) that has been pushed into the updateTabsTasks
                  // queue which runs at the end of the rawUpdateTabs function
                  // activateTab(null, {hello:'onupdate.hasactive',targetId: activeTarget}, {forceFrame:true, notify: false});
                }
              } else {
                indicateNoOpenTabs();
              }
              setState('bbpro', state);
              while(state.updateTabsTasks.length) {
                const task = state.updateTabsTasks.shift();
                try {
                  task();
                } catch(e) {
                  console.warn("State update tabs task failed", e, task);
                }
              }
            }
          } catch(e) {
            console.warn(`Error getting tabs`, e);
          }
        }

        async function createTab(click, url = BLANK, opts) {
          if ( opts && Object.keys(opts).join(',') !== 'source' ) {
            console.log(`Invalid createTab options given`, opts);
            throw new TypeError(`createTab options currently only support 'source' key.`);
          }
          queue.send({
            immediate: true,
            command: {
              name: "Target.createTarget",
              params: {
                url,
                enableBeginFrameControl: DEBUG.frameControl,
                ...opts
              },
            }
          });
          DEBUG.val && console.log('sent create tab');
          if ( click ) {
            click?.target?.blur?.();
            click?.currentTarget?.blur?.();
          }
          setTimeout(updateTabs, 500);
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

        function getFavicon(targetId) {
          console.warn(`Client CAN NOT REQUEST favicon`, (new Error).stack);
          return;
          DEBUG.debugFavicon && console.log(`Queueing get cached favicon message`);
          setTimeout(() => {
            queue.send({
              type: "favicon",
              synthetic: true,
              targetId,
            });
          }, IMMEDIATE);
        }

        function initialGetFavicon(targetId) {
          console.warn(`Client CAN NOT REQUEST favicon`, (new Error).stack);
          return;
          DEBUG.debugFavicon && console.log(`Queueing initial get favicon message (evaluate getFavicon code on client)`);
          setTimeout(() => {
            queue.send({
              type: "getFavicon",
              synthetic: true,
              targetId,
            });
          }, IMMEDIATE);
        }

        /*
        function loadPlugin(plugin) {
          plugins.set(plugin.name, plugin);
          plugin.load(pluginView);
        }
        */

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

  // helpers
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

    export function magicAssign(target, ...sources) {
      sources.forEach(src => {
        Object.defineProperties(
          target,
          Object.getOwnPropertyNames(src).reduce((descriptors, key) => {
            let originalDescriptor = Object.getOwnPropertyDescriptor(src, key);

            // Rebind getters and setters to the target object
            if (originalDescriptor.get || originalDescriptor.set) {
              descriptors[key] = {
                get: originalDescriptor.get ? originalDescriptor.get.bind(target) : undefined,
                set: originalDescriptor.set ? originalDescriptor.set.bind(target) : undefined,
                enumerable: originalDescriptor.enumerable,
                configurable: originalDescriptor.configurable
              };
            } else {
              descriptors[key] = originalDescriptor;
            }

            return descriptors;
          }, {})
        );
      });

      return target;
    }

    function parseURLFlags(params) {
      const flags = new Map();
      for( const [flag, value] of params ) {
        switch(flag) {
          case "ran": {
          } break;
          case "url": {
          } break;
          case "ui":
            try {
              const chromeUI = JSON.parse(value);
              flags.set('chromeUI', chromeUI);
            } catch(e) {
              DEBUG && console.warn(`Given ui flag in URL params, but could not parse true or false from it.`, e);
            }
            break;
          default:
            DEBUG.val && console.info(`Given unknown URL search param ${flag}: ${value}`);
            break;
        }
      }
      return flags;
    }

  // patching 
    function patchGlobals() {
      patchDocument();
    }

  function patchDocument() {
    try {
      Object.defineProperty(Object.getPrototypeOf(document), 'deepActiveElement', {
        get() {
          let root = this;
          while(root.activeElement) {
            const active = root.activeElement;
            if ( !active.shadowRoot ) return active;
            root = active.shadowRoot;
          }
        },
        enumerable: true,
        writeable: false,
        configurable: false
      });
    } catch(e) {
      DEBUG.debugSetup && console.info(`Looks like deepActiveElement already installed.`);
    }
  }
