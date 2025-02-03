  import {
    CONFIG,
    COMMON,
    sleep, isSafari, isFirefox, 
    DEBUG, BLANK, littleEndian,
    deviceIsMobile,
    untilHuman,
    untilTrueOrTimeout,
    untilTrue,
    be2le,
    randomInterval,
  } from './common.js';
  import abto64 from './abto64.js';

  const $ = Symbol('[[EventQueuePrivates]]');
  //const TIME_BETWEEN_ONLINE_CHECKS = 1001;

  const FRAME_CHECK_INTERVAL = 100;
  const ALERT_TIMEOUT = 300;
  const SOCKET_RECONNECT_MS = 1618;
  const PEER_RECONNECT_MS = 618;
  const HEADER_BYTE_LEN = 28;
  const KEYS = [
    1, 11, 13, 629, 1229, 2046, 17912, 37953, 92194, 151840
  ];
  const MAX_E = 255;
  const REGULAR_NO_FRAME_ACK_INTERVAL = 3001;
  const BUFFERED_FRAME_EVENT = {
    type: "buffered-results-collection",
    command: {
      isBufferedResultsCollectionOnly: true,
      params: {}
    }
  };
  const BUFFERED_FRAME_COLLECT_DELAY = {
    MIN: 40, /* 250, 500 */
    MAX: 4000, /* 2000, 4000, 8000 */
  };
  const RACES = new Map();
  const Scores = [];
  const AlreadySent = new Map();
  const SCORE_WINDOW = 11;
  const MIN_DECISION_DATA = 5;
  const ITYPE = true || isSafari() ? 'image/jpeg' : 'image/webp';
  const MAX_BW_MEASURES = 10;
  const OldIncoming = new Map();
  const waiting = new Map();
  const isLE = littleEndian();

  let DEBUG_ORDER_ID = 99999;
  let loopCalls = 0;
  let inFrameCount = 0;
  let noFrameReceived = 1;
  let WSScore = 0;
  let WPScore = 0;
  let connecting;
  let latestReload;
  let latestAlert;
  //let lastTestTime;
  //let lastOnlineCheck;

  let messageId = Math.ceil(Math.random()*10001)*1000000;
  let latestFrameId = -1;
  let clearNextFrame = false;
  let frameDrawing = false;
  let bufferedFrameCollectDelay = BUFFERED_FRAME_COLLECT_DELAY.MIN;
  let Connectivity;

  class Privates {
    constructor(publics, state, sessionToken) {
      this.willCollectBufferedFrame = null;
      this.websockets = new Map();
      this.publics = publics;
      this.subscribers = [];
      this.translators = new Map();
      this.eventQueue = new Map();
      this.images = new Map();
      this.typeLists = new Map();
      this.loopActive = false;
      this.Data = [];
      this.Meta = [];
      this.sessionToken = sessionToken;

      const WindowLength = 10;
      const messageWindow = [];
      const bwWindow = [];

      Object.defineProperty(this, 'screenshotReceived', {
        get() {
          return state.screenshotReceived;
        }, 

        set(val) {
          state.screenshotReceived = val;
          DEBUG.logAcks && val && console.log('set screenshot received' , state.screenshotReceived);
        }
      });

      this.addBytes = (n,hasFrame) => {
        state.totalBytes += n;

        if ( hasFrame ) {
          messageWindow.push(n);
          bwWindow.push(state.totalBytesThisSecond);

          while(messageWindow.length > WindowLength) {
            messageWindow.shift();
          }
          while (bwWindow.length > WindowLength) {
            bwWindow.shift();
          }

          const averageSize = Math.round(messageWindow.reduce((total, size) => total + size, 0)/messageWindow.length);
          const averageBw = Math.round(bwWindow.reduce((total, size) => total + size, 0)/bwWindow.length);

          if ( DEBUG.adpativeImageQuality ) {
            if ( averageSize > averageBw * 1.1  ) {
              state.H({
                custom: true,
                type: 'resample-imagery',
                down: true,
                averageBw
              });
            } else if ( averageSize < averageBw * 0.9 ) {
              state.H({
                custom: true,
                type: 'resample-imagery',
                up: true,
                averageBw
              });
            }
          }
        }
      };

      let lastBytes = 0;
      let lastCheck = Date.now();

      if ( !DEBUG.framesPushed || DEBUG.regularFrameCheck ) {
        this.checkForFrames();
        DEBUG.val && console.log('Starting check for frames');
      }
      ackIfNoFrame(state);
      //clearNextFrame = true;
    }

    static get firstDelay() { return 37; /* 20, 40, 250, 500;*/ }

    get connected() {
      return this.publics.state?.connected;
    }

    triggerSendLoop() {
      if ( this.loopActive ) return;
      this.loopActive = true;
      this.currentDelay = this.constructor.firstDelay;
      clearTimeout(this.currentLoop);
      this.currentLoop = setTimeout(() => this.nextLoop(), this.currentDelay); 
    }

    sendImmediate(event) {
      DEBUG.debugTabs && console.log(`Sending immediately`, event);
      const url = this.subscribers[0];
      return this.sendEvents({events:[event], url});
    }

    async nextLoop() {
      DEBUG.logLoop && console.log('Loop start');
      loopCalls++;
      //let data, meta, totalBandwidth;
      let q = Array.from(this.publics.queue);

      const url = this.subscribers[0];

      if ( !this.publics.state.demoMode && this.translators.has(url) ) {
        const translator = this.translators.get(url);
        q = q.map(e => translator(e, {})).filter(e => e !== undefined);
        q = q.reduce((Q, e) => (Array.isArray(e) ? Q.push(...e) : Q.push(e), Q), []);
      }

      const firstChainIndex = q.findIndex(e => !!e.chain);

      let chain, events;

      if ( firstChainIndex == -1 ) {
        events = q.splice(0,MAX_E);
        this.publics.queue.splice(0,MAX_E);
      } else if ( firstChainIndex == 0 ) {
        ({chain} = q.shift()); 
        this.publics.queue.shift();
      } else {
        const splice_index = Math.min(MAX_E,firstChainIndex);
        events = q.splice(0, splice_index);
        this.publics.queue.splice(0, splice_index);
      }

      if ( chain ) {
        this.sendEventChain({chain,url}).then(({data,meta,totalBandwidth}) => {
          if ( !!data ) {
            if ( data.some(({vmPaused}) => vmPaused) ) {
              DEBUG.debugVM && console.log('VM PAUSED');
            }
          }
          if ( !!meta && meta.length ) {
            meta.forEach(metaItem => {
              const executionContextId = metaItem.executionContextId;
              DEBUG.logMeta && console.log(`Meta in chain`, metaItem);
              for ( const key of Object.keys(metaItem) ) {
                DEBUG.logMeta && console.log('meta', key, metaItem);
                let typeList = this.typeLists.get(key);
                if ( typeList ) {
                  typeList.forEach(func => {
                    try {
                      func({[key]:metaItem[key], executionContextId});
                    } catch(e) {
                      console.warn(`Error on ${key} handler`, func, e);
                    }
                  });
                }
              }
            });
          }

          if ( totalBandwidth ) {
            this.publics.state.totalBandwidth = totalBandwidth;
          }
        });
      } else {
        this.sendEvents({events,url}).then(() => {
        });
      }

      if ( DEBUG.asyncLoop ) {
        await sleep(this.currentDelay/2);
      }

      ///*
        let measure, dist;
        if ( DEBUG.logLoop ) {
          measure = Date.now();
          dist = measure - this.lastMeasure;
        }
        if ( this.publics.queue.length ) {
          DEBUG.logLoop &&
            console.log(`Loop continue (frame:${latestFrameId}) (loops:${loopCalls})`, dist);
          if ( DEBUG.asyncLoop ) {
            clearTimeout(this.currentLoop);
            this.currentLoop = setTimeout(() => this.nextLoop(), this.currentDelay/2);
          } else {
            clearTimeout(this.currentLoop);
            this.currentLoop = setTimeout(() => this.nextLoop(), this.currentDelay);
          }
        } else {
          DEBUG.logLoop && 
            console.log(`Loop stop (frame:${latestFrameId}) (loops:${loopCalls})`, dist);
          this.loopActive = false;
        }
        if ( DEBUG.logLoop ) {
          this.lastMeasure = measure;
        }
      //*/
    }

    queueEvents({events, url}) {
      let q = this.eventQueue.get(url);
      if ( ! q ) {
        q = [];
        this.eventQueue.set(url, q);
      }
      q.push(...events);
      DEBUG.debugQdEs && console.log(`Queued`, [...events], this.eventQueue);
      DEBUG.debugQdEs && console.log(`Total queue length`, q.length);
    }

    hasQueuedEvents(url) {    
      return this.eventQueue.get(url)?.length > 0
    }

    unqueueEvents(url) {
      let q;
      if ( this.hasQueuedEvents(url) ) {
        q = this.eventQueue.get(url);
        this.eventQueue.set(url, []);
      } else {
        q = [];
      }
      DEBUG.debugQdEs && console.log(`Unqueued`, [...q]);
      DEBUG.debugQdEs && console.log(`Total queue length`, 0);
      return q;
    }

    async sendEvents({events, url}) {
      DEBUG.debugConnect && console.info(`Send events A`, events, url);
      if ( this.hasQueuedEvents(url) ) {
        events = [...this.unqueueEvents(url), ...events];
        DEBUG.debugQdEs && console.log(`1 Forming events to send from passed events and queued events:`, events, this.eventQueue);
      }
      if ( ! events ) return {meta:[],data:[]};
      events = events.filter(e => !!e && !!e.command);
      if ( events.length == 0 ) return {meta:[], data:[]};
      this.checkForBufferedFrames(events);
      let protocol;
      // TODO: FIXME: we should gate this check behind a simpler check to see if URL has changed. Cache the pass in other words
      try {
        url = new URL(url);
        protocol = url.protocol;
        // OK WTF
        url.search = `session_token=${this.sessionToken}`;
        url = url + '';
      } catch(e) {
        alert("WTF " + url);
        console.warn(e, url, this);
      }
      if ( ! this.publics.state.demoMode ) {
        (DEBUG.debugQdEs || DEBUG.debugConnect) && console.info(`Send events B (${events.length} events)`, events, url);
        if ( protocol == 'ws:' || protocol == 'wss:' ) {
          try {
            if ( ! this.senders ) {
              this.senders = this.websockets.get(url);
            }
            const {senders} = this;
            messageId++;
            let resolve;
            const promise = new Promise(res => resolve = res);
            if ( DEBUG.debugCommandOrder ) {
              events = events.map(e => {
                e.command.debugOrderId = DEBUG_ORDER_ID++;
                return e;
              });
            }
            const sendClosure = senders => senders.so(
              {
                messageId,
                zombie:{events},
                screenshotAck: noFrameReceived || this.screenshotReceived
              }, 
              {url, resolve}
            );

            (DEBUG.debugQdEs || DEBUG.debugConnect) && console.info(`Send events C`, senders);
            if ( senders ) {
              if ( DEBUG.logAcks && this.screenshotReceived ) {
                const measure = Date.now();
                const dist = measure - this.lastAckTime;
                this.lastAckTime = measure;
                console.log('ASYNC Ack sent. Time since last ack sent', dist, '. Time since this shot received', measure - this.publics.state.lastShotAt);
              } 
              try {
                sendClosure(senders);
              } catch(e) {
                console.warn(`Issue with sendClosure`, sendClosure, e);
              }
              this.screenshotReceived = undefined;
            } else {
              DEBUG.debugConnect && console.log('Awaiting connect', url, this.websockets);
              this.queueEvents({events,url});
              const connected = await this.connectSocket(url); 
              if ( ! connected ) {
                DEBUG.debugConnect && console.info(`Socket did not connect...will retry`);
                await sleep(666); 
                //return this.sendEvents({events:[], url});
              }
              (DEBUG.debugQdEs || DEBUG.debugConnect) && console.info(`Socket connected.`);
            }
            return promise;
          } catch(e) {
            console.warn(e);
            console.warn(JSON.stringify({
              msg: `Error sending event to websocket ${url}`,
              events, url, error: e
            }));
            return {error:'failed to send', events};
          }
        } else {
          const request = {
            method: 'POST', 
            body: JSON.stringify({events}), 
            headers: {
              'content-type': 'application/json'
            }
          };
          return uberFetch(url, request).then(r => r.json()).then(async ({data,frameBuffer,meta}) => {
            if ( !!frameBuffer && this.images.has(url) ) {
              if ( DEBUG.logAcks ) {
                const measure = Date.now();
                const dist = measure - this.publics.state.lastShotAt
                this.publics.state.lastShotAt = measure;
                console.log('Got shot. Time since last', dist);
              }
              if ( DEBUG.immediateAck ) {
                messageId++;
                noFrameReceived = 0;
                this.publics.state.screenshotReceived = {
                  frameId: this.publics.state.latestFrameReceived, 
                  castSessionId: this.publics.state.latestCastSession
                };
                if ( DEBUG.debugCommandOrder ) {
                  BUFFERED_FRAME_EVENT.command.debugOrderId = DEBUG_ORDER_ID++;
                }
                this.senders.so({messageId,zombie:{events:[BUFFERED_FRAME_EVENT]},screenshotAck: noFrameReceived || this.screenshotReceived});
                this.publics.state.screenshotReceived = false;
                if ( DEBUG.logAcks ) {
                  const measure = Date.now();
                  const dist = measure - this.lastAckTime;
                  this.lastAckTime = measure;
                  console.log('Ack sent. Time since last ack sent', dist, '. Time since this shot received', measure - this.publics.state.lastShotAt);
                }
              }
              drawFrames(this.publics.state, frameBuffer, this.images.get(url));
            }
            const errors = data.filter(d => !!d.error);
            if ( errors.length ) {
              DEBUG.val >= DEBUG.low && console.warn(`${errors.length} errors occured.`);
              DEBUG.val >= DEBUG.low && console.log(JSON.stringify(errors));
            }
            return {data, meta};
          }).catch(e => {
            console.warn(JSON.stringify({
              msg: `Error sending event to POST url ${url}`,
              events, url, error: e
            }));
            return {error:'failed to send', events};
          });
        }
      } else {
        return await this.publics.state.demoEventConsumer({events});
      }
    }

    async connectSocket(url, sendClosure) {
      // normalize URL forces us to have only 1 browser-backend connection per origin
      // we could change this but for now keep it
      const wsUrl = url;
      url = normalizeUrl(url);
      const privates = this;
      let resolve;
      const promise = new Promise(res => resolve = res);
      if ( connecting ) {
        DEBUG.debugCnx && console.log(`Already connecting...`);
        await untilTrue(() => this.websockets.has(url));
        try {
          sendClosure(this.websockets.get(url));
        } catch(e) {
          resolve(false);
        }
      } else {
        DEBUG.debugCnx && console.log(`Not connecting...`);
        if ( !this.publics.state.demoMode && onLine() && ! connecting ) {
          DEBUG.debugCnx && console.log(`Online and now connecting...`);
          connecting = true;
          let peer;
          let socket;
          let Senders;
          let AssureOpenTask;
          try {
            socket = new WebSocket(wsUrl);
            DEBUG.cnx && console.info('Creating socket');
            socket.binaryType = "blob";
            connecting = socket;
            socket.onopen = () => {
              this.publics.state.connected = true;
              privates.socket = socket;
              DEBUG.cnx && console.log(`WebSocket open`);
              Senders = {so,sa};
              const receivesFrames = !this.publics.state.useViewFrame;
              so({messageId,zombie:{events: [],receivesFrames}});
              messageId++;
              this.publics.state.getViewport().then(viewport => {
                messageId++;
                so({messageId, viewport});
              });
              this.publics.state.serverConnected = true;
              this.publics.state.refreshViews();

              AssureOpenTask = async () => {
                this.publics.state.serverConnected = true;
                this.publics.state.setTopState();
                this.websockets.set(url, Senders);
                this.senders = Senders;

                if ( sendClosure ) {
                  try {
                    sendClosure(Senders);
                  } catch(e) {
                    console.warn(`Error with send closure`, sendClosure, e);
                  }
                }

                if ( ! privates.peer && hasWebRTC() ) {
                  connectPeer().catch(err => console.warn(`Connect peer error`, err));;
                } else {
                  peer = privates.peer;
                  globalThis.setupAudio();
                }
              }

              function so(o, reply) {
                messageId++;
                o.messageId = messageId;
                if ( reply ) {
                  const key = `${reply.url}:${o.messageId}`; 
                  DEBUG.debugMeta && console.log(`Sending message with id (adding reply)`, messageId, 
                    JSON.stringify({message:o,key}));
                  waiting.set(key, reply.resolve);
                } else if ( DEBUG.debugMeta ) {
                  console.log('Sending message with id (not adding to waiting as reply is not indicated)', messageId, 
                    JSON.stringify({message:o}));
                  console.log((new Error('trace')).stack);
                }
                if ( AlreadySent.has(o.messageId) ) {
                  console.warn('We have previously sent a message with that id', 
                    AlreadySent.get(o.messageId) 
                  );
                }
                AlreadySent.set(o.messageId, o);
                if ( privates?.socket?.readyState < WebSocket.CLOSING ) {
                  privates.socket.send(JSON.stringify(o));
                } else {
                  socket?.close?.();
                }
              }

              function sa(a) {
                if ( privates.socket.readyState < WebSocket.CLOSING ) {
                  privates.socket.send(a);
                } else {
                  privates.socket.close();
                }
              }

              async function connectPeer() {
                peer = new SimplePeer({trickle: true, initiator: false});
                peer.on('error', err => DEBUG.cnx && console.log('webrtc peer error', err));
                peer.on('close', c => {
                  privates.peer = null;
                  privates.publics.state.webrtcConnected = false;
                  privates.publics.state.setTopState();
                  DEBUG.cnx && console.log('peer closed', c);
                  if ( onLine() ) {
                    setTimeout(connectPeer, PEER_RECONNECT_MS);
                  }
                });
                peer.on('connect', () => {
                  DEBUG.cnx && console.log('peer connected');
                  privates.peer = peer;
                  privates.publics.state.webrtcConnected = true;
                  if ( privates.publics.state.micStream ) {
                    privates.publics.state.micStream.getTracks().forEach(function(track) {
                      track.stop();
                    });
                    privates.publics.state.micStream = null;
                    if ( privates.publics.state.micAccessNotAlwaysAllowed ) {
                      // if the user has not set always allow, then notify them about this as they are probably antsy 
                      // about it and need reassurance which is fine
                      DEBUG.showAudioInstructions && DEBUG.debugSafariWebRTC && setTimeout(() => alert(`Fast connection established. Mic access dropped!`), 60);
                      // so we don't do this alert again
                      privates.publics.state.micAccessNotAlwaysAllowed = false;
                    }
                  }
                  privates.publics.state.setTopState();
                  privates.publics.state.refreshViews();
                });
                peer.on('signal', data => {
                  DEBUG.cnx && console.log('have webrtc signal data', data);
                  messageId++;
                  so({messageId,copeer:{signal:data}});
                });
                peer.on('data', MessageData => {
                  DEBUG.debugConnect && console.log(`got webrtc data frame`, MessageData);
                  const {img,frameId,castSessionId,targetId} = parse(MessageData);
                  privates.publics.state.latestFrameReceived = frameId;
                  privates.publics.state.latestCastSession = castSessionId;
                  DEBUG.debugFasest && console.log('fastest?');
                  if ( RACES.has(frameId) && RACES.get(frameId).first === 'websocket' ) {
                    DEBUG.logRaces && console.log('websocket won');
                    RACES.delete(frameId);
                    Scores.push('websocket');
                    WSScore++;
                    while ( Scores.length > SCORE_WINDOW ) {
                      const last = Scores.shift(); 
                      if ( last === 'websocket' ) {
                        WSScore--;
                      } else {
                        WPScore--;
                      }
                    }
                    if ( Scores.length >= MIN_DECISION_DATA ) {
                      messageId++;
                      const msg = {messageId,fastestChannel:{}};
                      if ( WSScore > WPScore ) {
                        DEBUG.logRaces && console.log('Switch to websocket');
                        msg.fastestChannel.websocket = true;
                      } else {
                        DEBUG.logRaces && console.log('Switch to webrtc peer');
                        msg.fastestChannel.webrtcpeer = true;
                      }
                      so(msg);
                    }
                  } else {
                    RACES.set(frameId, {first:'peer', at:Date.now()});
                    if ( targetId !== privates.publics.state.activeTarget ) {
                      DEBUG.debugFrameDrops &&
                        console.warn(`Dropping frame for ${targetId} ${frameId} because target not active.`, latestFrameId);
                      return;
                    }
                    if ( DEBUG.logAcks ) {
                      const measure = Date.now();
                      const dist = measure - privates.publics.state.lastShotAt
                      privates.publics.state.lastShotAt = measure;
                      console.log('Got shot. Time since last', dist);
                    }
                    if ( DEBUG.immediateAck ) {
                      messageId++;
                      noFrameReceived = 0;
                      inFrameCount++;
                      if ( (inFrameCount % DEBUG.ackEvery) == 0 ) {
                        privates.publics.state.screenshotReceived = {
                          frameId: privates.publics.state.latestFrameReceived, 
                          castSessionId: privates.publics.state.latestCastSession
                        };
                      }
                      if ( DEBUG.debugCommandOrder ) {
                        BUFFERED_FRAME_EVENT.command.debugOrderId = DEBUG_ORDER_ID++;
                      }
                      privates.senders.so({messageId,zombie:{events:[BUFFERED_FRAME_EVENT]},screenshotAck: noFrameReceived || privates.screenshotReceived});
                      privates.publics.state.screenshotReceived = false;
                      if ( DEBUG.logAcks ) {
                        const measure = Date.now();
                        const dist = measure - privates.lastAckTime;
                        privates.lastAckTime = measure;
                        console.log('Ack sent. Time since last ack sent', dist, '. Time since privates shot received', measure - privates.publics.state.lastShotAt);
                      }
                    }
                    if ( (frameId - latestFrameId) < 1 ) {
                      DEBUG.debugFrameDrops &&
                        console.warn(`Dropping frame for ${targetId} ${frameId} because old.`, latestFrameId);
                      return;
                    }
                    latestFrameId = frameId;
                    DEBUG.logFrameIds && console.log(`Drawing frameId ${frameId}`);
                    drawFrames(
                      privates.publics.state, 
                      img,
                      privates.images.get(url), 
                      true, 
                      true,
                      frameId
                    );
                    privates.addBytes(img.byteLength, true);    
                    setTimeout(() => RACES.delete(frameId), 15000);
                  }
                });
              }
            };
            socket.onmessage = async message => {
              let {data:MessageData} = message;
              if ( AssureOpenTask ) {
                const Task = AssureOpenTask;
                AssureOpenTask = false;
                Task().then(() => resolve(true)).catch(err => console.warn(`Assume open task errored`, Task, err));
              }
              if ( typeof MessageData === "string" ) {
                const messageData = JSON.parse(MessageData);
                const {copeer,data,frameBuffer,meta,messageId:serverMessageId,totalBandwidth} = messageData;

                if ( copeer ) {
                  DEBUG.cnx && console.log(`received webrtc signal data from socket`, copeer);
                  const {signal} = copeer;
                  if ( ! hasWebRTC() ) {
                    globalThis.setupAudio();
                  } else {
                    untilTrue(() => !!peer).then(async () => {
                      if ( isSafari() && deviceIsMobile() && ! globalThis.comingFromTOR ) {
                        if ( !state.safariWebRTCPermsRequestStarted ) {
                          let resolve;
                          let reject;
                          const pr = new Promise((res, rej) => (resolve = res, reject = rej));
                          state.afterSafariPermsRequested = pr;
                          state.safariWebRTCPermsRequestStarted = true;

                          try {
                            DEBUG.debugSafariWebRTC && console.log(`Showing permission explainer`);
                            await untilTrueOrTimeout(() => !!state?.viewState?.modalComponent, 60);
                          } catch(e) {
                            console.warn('Modal component did not load', e);
                            setTimeout(() => reject(e), 0);
                            alert(`Loading is slow and some components have not loaded. You may want to reload to try again.`);
                            throw new Error(`ModalComponent did not load in time.`);
                          }

                          // wait for any other modals to clear
                          await untilHuman(() => !state?.viewState.currentModal);

                          if ( !state?.viewState.currentModal ) {
                            DEBUG.debugSafariWebRTC && console.log(`Requesting media permissions`);
                            const [{state: state1}, {state: state2}] = (await Promise.all([
                              navigator.permissions.query({ name: 'microphone' }),
                              navigator.permissions.query({ name: 'camera' })
                            ]));
                            if (state1 === 'granted' || state2 === 'granted') {
                              // Skip the pre-request explainer
                              DEBUG.debugSafariWebRTC && console.log(`We already have permissions, no need to explain a request!`);
                            } else {
                              if ( deviceIsMobile() && ! globalThis.comingFromTOR ) {
                                state.micAccessNotAlwaysAllowed  = true;
                                await showExplainer();
                              } else {
                                console.info(`Desktop Safari no longer requires us to request User Media before enabling WebRTC.`);
                              }
                            }
                            try {
                              if ( deviceIsMobile() && ! globalThis.comingFromTOR ) {
                                state.micStream = await navigator.mediaDevices.getUserMedia({audio: { echoCancellation: { ideal : false }}});
                              } else {
                                //await navigator.mediaDevices.getUserMedia({audio: true});
                                console.info(`Desktop Safari no longer requires us to request User Media before enabling WebRTC.`);
                              }
                              state.safariWebRTCPermsRequested = true;
                              resolve(true);
                            } catch(e) {
                              reject('Could not obtain user media permission', e);
                            }
                          }
                        }
                        state.afterSafariPermsRequested = state.afterSafariPermsRequested.then(() => {
                          DEBUG.debugSafariWebRTC && console.log(`Signaling`);
                          peer.signal(signal);
                        }).catch(err => {
                          DEBUG.cnx && console.info(`Safari User Media request to enable WebRTC peering has failed.`);
                          if ( DEBUG.tryPeeringAnywayEvenIfUserMediaFails ) {
                            DEBUG.cnx && console.info(`However we will try to peer anyway.`);
                            peer.signal(signal);
                          } else {
                            DEBUG.cnx && console.info(`Will destroy peer as WebRTC data channel peering unsupported in this browser.`);
                            peer.destroy('WebRTC peering on data channel not supported in this browser'); 
                          }
                        }).finally(() => {
                          setTimeout(async () => {
                            if ( await globalThis.setupAudio() && deviceIsMobile() ) {
                              DEBUG.showAudioInstructions && setTimeout(() => alert('Tap the screen to unmute.'), 100);
                            }
                          }, 30);
                        });
                      } else {
                        peer.signal(signal);  
                        setTimeout(async () => {
                          if ( await globalThis.setupAudio() && deviceIsMobile() ) {
                            DEBUG.showAudioInstructions && setTimeout(() => alert('Tap the screen to unmute.'), 100);
                          }
                        }, 30);
                      }
                    });
                  }
                }

                if ( !!frameBuffer && frameBuffer.length && this.images.has(url) ) {
                  this.addBytes(MessageData.length, frameBuffer.length);    
                  if ( DEBUG.logAcks ) {
                    const measure = Date.now();
                    const dist = measure - this.publics.state.lastShotAt
                    this.publics.state.lastShotAt = measure;
                    console.log('Got shot. Time since last', dist);
                  }
                  if ( DEBUG.immediateAck ) {
                    messageId++;
                    noFrameReceived = 0;
                    inFrameCount++;
                    if ( (inFrameCount % DEBUG.ackEvery) == 0 ) {
                      this.publics.state.screenshotReceived = {
                        frameId: this.publics.state.latestFrameReceived, 
                        castSessionId: this.publics.state.latestCastSession
                      };
                    }

                    if ( DEBUG.debugCommandOrder ) {
                      BUFFERED_FRAME_EVENT.command.debugOrderId = DEBUG_ORDER_ID++;
                    }
                    this.senders.so({messageId,zombie:{events:[BUFFERED_FRAME_EVENT]},screenshotAck: noFrameReceived || this.screenshotReceived});
                    this.publics.state.screenshotReceived = false;
                    if ( DEBUG.logAcks ) {
                      const measure = Date.now();
                      const dist = measure - this.lastAckTime;
                      this.lastAckTime = measure;
                      console.log('Ack sent. Time since last ack sent', dist, '. Time since this shot received', measure - this.publics.state.lastShotAt);
                    }
                  }
                  drawFrames(this.publics.state, frameBuffer, this.images.get(url));
                } else {
                  this.addBytes(MessageData.length, false);    
                }

                if ( data ) {
                  const errors = data.filter(d => !!d && !!d.error);
                  if ( data.some(({vmPaused}) => vmPaused) ) {
                    DEBUG.debugMeta && console.log('Yes VM Paused', data);
                  }
                  if ( errors.length ) {
                    DEBUG.val >= DEBUG.low && console.warn(`${errors.length} errors occured.`);
                    DEBUG && console.log(JSON.stringify(errors));
                    errors.map(err => console.warn(err));
                    if ( errors.some(({error}) => error.hasSession === false)) {
                      console.warn(`Session has been cleared. Let's attempt relogin`, this.sessionToken);
                      if ( COMMON.blockAnotherReset ) return;
                      COMMON.blockAnotherReset = true;
                      try {
                        const x = new URL(location);
                        x.pathname = 'login';
                        x.search = `token=${this.sessionToken}&ran=${Math.random()}`;
                        await talert("Your browser cleared your session. We need to reload the page to refresh it.");
                        DEBUG.delayUnload = false;
                        if ( ! DEBUG.noReset ) {
                          location.href = x;
                        }
                        socket.onmessage = null;
                      } catch(e) {
                        talert("An error occurred. Please reload.");
                      }
                      return;
                    } else if ( errors.some(({error}) => error.includes && error.includes("ECONNREFUSED")) ) {
                      console.warn(`Cloud browser has not started yet. Let's reload and see if it has then.`);
                      if ( COMMON.blockAnotherReset ) return;
                      COMMON.blockAnotherReset = true;
                      talert("Your cloud browser has not started yet. We'll reload and see if it has then.");
                      await treload(this.sessionToken);
                      return;
                    } else if ( errors.some(({error}) => error.includes && error.includes("Timed out")) ) {
                      console.warn(`Some events are timing out when sent to the cloud browser.`);
                      if ( COMMON.blockAnotherReset ) return;
                      COMMON.blockAnotherReset = true;
                      const reload = await tconfirm(`Some events are timing out when sent to the cloud browser. Try reloading the page, and if the problem persists try switching your cloud browser off then on again. Want to reload now?`, this.connected, this.publics.state); 
                      if ( reload ) {
                        treload(this.sessionToken);
                      }
                      return;
                    } else if ( errors.some(({error}) => error.includes && error.includes("not opened")) ) {
                      console.warn(`We can't establish a connection the cloud browser right now. We can try reloading the page, but if the problem persists try switching your cloud browser off then on again.`);
                      if ( COMMON.blockAnotherReset ) return;
                      COMMON.blockAnotherReset = true;
                      const reload = await tconfirm(`We can't establish a connection the cloud browser right now. We can try reloading the page, but if the problem persists try switching your cloud browser off then on again. Reload the page now?`, this.connected, this.publics.state);
                      if ( reload ) {
                        treload(this.sessionToken);
                      }
                      return;
                    } else if ( errors.some(({resetRequired}) => resetRequired)) {
                      console.warn(`Some errors have occurred which require reloading the page. If the problem persists try switching your cloud browser off then on again.`);
                      if ( COMMON.blockAnotherReset ) return;
                      COMMON.blockAnotherReset = true;
                      const reload = await tconfirm(`Some errors have occurred which require reloading the page. If the problem persists try switching your cloud browser off then on again. Want to reload the page now?`, this.connected, this.publics.state); 
                      if ( reload ) {
                        treload(this.sessionToken);
                      }
                      return;
                    }
                  }
                }

                if ( !!meta && meta.length ) {
                  DEBUG.debugMeta && console.log({meta});
                  meta.forEach(metaItem => {
                    DEBUG.logMeta && console.log(`Meta in regular event stream`, metaItem);
                    const executionContextId = metaItem.executionContextId;
                    for ( const key of Object.keys(metaItem) ) {
                      DEBUG.logMeta && console.log('meta', key, metaItem);
                      let typeList = this.typeLists.get(key);
                      if ( typeList ) {
                        typeList.forEach(func => {
                          try {
                            func({[key]:metaItem[key], executionContextId});
                          } catch(e) {
                            console.warn(`Error on ${key} handler`, func, e);
                          }
                        });
                      }
                    }
                  });
                }

                DEBUG.debugMeta && console.log({serverMessageId,data,meta});

                if ( totalBandwidth ) {
                  this.publics.state.totalBandwidth = totalBandwidth;
                }

                if ( serverMessageId ) {
                  DEBUG.debugMeta && console.log(`Server message has id:`, serverMessageId);
                  const replyTransmitted  = transmitReply({url, id: serverMessageId, data, meta, totalBandwidth}, messageData );
                  
                  if ( replyTransmitted ) return;

                  else if ( DEBUG.untabledServerMessageId ) {
                    console.warn(`Server sent message Id ${serverMessageId}, which is not in our table.`, messageData);
                    if ( OldIncoming.has(serverMessageId) ) {
                      console.warn(`But it was in our table before.`, OldIncoming.get(serverMessageId));
                    }
                    console.log(JSON.stringify({message}), 'table', waiting);
                  }

                  //console.info(`Falling back to closure message id ${messageId}`);
                  /*
                    const fallbackReplyTransmitted = transmitReply({url, id: messageId, data, meta, totalBandwidth});

                    if ( fallbackReplyTransmitted ) return;

                    else if ( DEBUG.val ) {
                      console.warn(`Neither server nor closure message ids were in our table.`);
                    }
                  */
                  //die();
                } else {
                  DEBUG.debugMeta && console.log(`Server message has no id`, messageData);
                }
              } else {
                // messagedata is a blob
                try {
                  const {img,frameId,castSessionId,targetId} = parse(await MessageData.arrayBuffer());
                  privates.publics.state.latestFrameReceived = frameId;
                  privates.publics.state.latestCastSession = castSessionId;
                  if ( RACES.has(frameId) && RACES.get(frameId).first === 'peer' ) {
                    RACES.delete(frameId);
                    DEBUG.logRaces && console.log('webrtc peer won');
                    Scores.push('webrtc peer');
                    WPScore++;
                    while ( Scores.length > SCORE_WINDOW ) {
                      const last = Scores.shift(); 
                      if ( last === 'websocket' ) {
                        WSScore--;
                      } else {
                        WPScore--;
                      }
                    }
                    if ( Scores.length >= MIN_DECISION_DATA ) {
                      messageId++;
                      const msg = {messageId,fastestChannel:{}};
                      if ( WSScore > WPScore ) {
                        msg.fastestChannel.websocket = true;
                      } else {
                        msg.fastestChannel.webrtcpeer = true;
                      }
                      const {so} = this.websockets.get(url);
                      so(msg);
                    }
                  } else {
                    RACES.set(frameId, {first:'websocket', at:Date.now()});
                    if ( targetId !== privates.publics.state.activeTarget ) {
                      DEBUG.debugFrameDrops &&
                        console.warn(`Dropping frame for ${targetId} ${frameId} because target not active.`, latestFrameId);
                      return;
                    }
                    if ( DEBUG.logAcks ) {
                      const measure = Date.now();
                      const dist = measure - this.publics.state.lastShotAt
                      this.publics.state.lastShotAt = measure;
                      console.log('Got shot. Time since last', dist);
                    }
                    if ( DEBUG.immediateAck ) {
                      messageId++;
                      noFrameReceived = 0;
                      inFrameCount++;
                      if ( (inFrameCount % DEBUG.ackEvery) == 0 ) {
                        this.publics.state.screenshotReceived = {
                          frameId: this.publics.state.latestFrameReceived, 
                          castSessionId: this.publics.state.latestCastSession
                        };
                      }
                      if ( DEBUG.debugCommandOrder ) {
                        BUFFERED_FRAME_EVENT.command.debugOrderId = DEBUG_ORDER_ID++;
                      }
                      this.senders.so({messageId,zombie:{events:[BUFFERED_FRAME_EVENT]},screenshotAck: noFrameReceived || this.screenshotReceived});
                      this.publics.state.screenshotReceived = false;
                      if ( DEBUG.logAcks ) {
                        const measure = Date.now();
                        const dist = measure - this.lastAckTime;
                        this.lastAckTime = measure;
                        console.log('Ack sent. Time since last ack sent', dist, '. Time since this shot received', measure - this.publics.state.lastShotAt);
                      }
                    }
                    if ( (frameId - latestFrameId) < 1 ) {
                      DEBUG.debugFrameDrops &&
                        console.warn(`Dropping frame for ${targetId} ${frameId} because old.`, latestFrameId);
                      return;
                    }
                    latestFrameId = frameId;
                    DEBUG.logFrameIds && console.log(`Drawing frameId ${frameId}`);
                    DEBUG.debugDraw && console.log("Getting image", {url, img: this.images.get(url)}, this.images);
                    drawFrames(this.publics.state, img, this.images.get(url), true, true);
                    this.addBytes(img.byteLength, true);    
                    setTimeout(() => RACES.delete(frameId), 15000);
                  }
                } catch(e) {
                  DEBUG.debugEventQueue && console.error(`WebSocket message data read failed`, e, {message});
                }
              }
            };
            socket.onclose = async (e) => {
              this.publics.state.connected = false;
              DEBUG.cnx && console.log(`WebSocket closed. Server going down?`);
              this.websockets.delete(url);
              privates.socket = null;
              this.publics.state.serverConnected = false;
              messageId = Math.ceil(Math.random()*10001)*1000000;
              latestFrameId = -1;
              this.publics.state.clearBrowser();
              this.publics.state.setTopState();
              this.publics.state.writeCanvas("No connection to server");
              this.senders = null;
              connecting = false;
              (DEBUG.cnx || DEBUG.debugConnect) && console.info("Socket disconnected. Will attempt reconnect if online", e, this.websockets);
              // prefer no modals
                /*
                  globalThis.addEventListener('click', () => {
                    setTimeout(() => {
                      alert("No connection to server. Reload to try again");
                    });
                  }, {once:true});
                */
              if ( onLine() ) {
                return privates.connectSocket(url);
              }
              resolve(false);
            };
            socket.onerror = async (e) => {
              this.publics.state.connected = false;
              socket.onerror = null;
              (DEBUG.cnx || DEBUG.debugConnect) && console.warn("WebSocket error", e);
              socket.close();
            };
          } catch(e) {
            this.publics.state.connected = false;
            this.websockets.delete(url);
            this.senders = null;
            connecting = false;
            DEBUG.cnx && console.log(`WebSocket open error. Server down?`);
            resolve(false);
          } 
        } else {
          if ( connecting ) {
            console.log(`Connection attempt already in progres...`);
          } else {
            console.log("Offline. Will connect socket when online");
          }
          resolve(false);
        }
      }
      return promise;
    }

    async sendEventChain({chain, url}) {
      const Meta = [], Data = [];
      let lastData;
      for( const next of chain ) {
        if ( typeof next == "object" ) {
          DEBUG.debugEventChains && console.log("chain next", next);
          const resp = await this.sendEvents({events:[next], url});
          const {meta,data} = resp;
          if ( meta ) {
            Meta.push(...meta);
          } 
          if ( data ) {
            Data.push(...data);
          }
          if ( !meta && !data ) {
            DEBUG.val && console.log('no meta and no data', {resp});
          }
          lastData = data;
          DEBUG.debugEventChains && console.log("chain last Data", lastData, {meta, data});
        } else if ( typeof next == "function" ) {
          DEBUG.debugEventChains && console.log("chain func", next);
          let funcResult;
          try {
            funcResult = next(lastData[0]);
          } catch(e) {
            DEBUG.debugEventChains && console.log("Error in chain func", {lastData, next, chain});
            DEBUG.debugEventChains && console.warn("Error in chain func", e);
            Data.push({error:e+''});
          }
          let events;
          if ( Array.isArray(funcResult) ) {
            DEBUG.debugEventChains && console.log("chain func array result", funcResult);
            events = funcResult;
          } else if ( typeof funcResult == "object" ) {
            DEBUG.debugEventChains && console.log("chain func object result", funcResult);
            events = [funcResult];
          } 
          DEBUG.debugEventChains && console.log("chain func result will send events", {events, funcResult});
          let {meta,data} = await this.sendEvents({events, url});
          Meta.push(...meta);
          Data.push(...data);
          lastData = data;
          DEBUG.debugEventChains && console.log("chain func next events results and last Data", lastData, {meta, data});
        }
      }
      return {data:Data,meta:Meta};
    }

    checkForBufferedFrames(events) {
      if ( !DEBUG.regularFrameCheck ) return;
      if ( this.willCollectBufferedFrame ) {
        clearTimeout(this.willCollectBufferedFrame);
        this.willCollectBufferedFrame = false;
        bufferedFrameCollectDelay = BUFFERED_FRAME_COLLECT_DELAY.MIN;
      }
      this.willCollectBufferedFrame = setTimeout(() => this.pushNextCollectEvent(), bufferedFrameCollectDelay);
    }

    maybeCheckForBufferedFrames(events) {
      if ( !DEBUG.regularFrameCheck ) return;
      if ( meetsCollectBufferedFrameCondition(this.publics.queue, events) ) {
        if ( this.willCollectBufferedFrame ) {
          clearTimeout(this.willCollectBufferedFrame);
          this.willCollectBufferedFrame = false;
          bufferedFrameCollectDelay = BUFFERED_FRAME_COLLECT_DELAY.MIN;
        }
        this.willCollectBufferedFrame = setTimeout(() => this.pushNextCollectEvent(), bufferedFrameCollectDelay);
      }
    }

    checkForFrames() {
      DEBUG.val && console.log(`Starting frame check...`);
      this.bufferedFramesInterval = setInterval(
        () => this.pushNextCollectEvent(), 
        FRAME_CHECK_INTERVAL 
      );
    }

    singleCheckForResults() {
      if ( DEBUG.debugCommandOrder ) {
        BUFFERED_FRAME_EVENT.command.debugOrderId = DEBUG_ORDER_ID++;
      }
      const bfce = Object.assign({
        },
        BUFFERED_FRAME_EVENT
      );
      this.publics.send(bfce);
    }

    pushNextCollectEvent() {
      if ( DEBUG.noCollect ) return;
      DEBUG.showCollect && console.log('collect event');
      clearTimeout(this.willCollectBufferedFrame);
      // if we're not checking regularly for any frames, then do exponential backoff checking
      if ( ! DEBUG.regularFrameCheck ) {
        DEBUG.val >= DEBUG.med && console.log("Meets collect delayed shot condition. Pushing a collect results event.");
        this.willCollectBufferedFrame = false;
        if ( bufferedFrameCollectDelay >= BUFFERED_FRAME_COLLECT_DELAY.MAX ) {
          bufferedFrameCollectDelay = BUFFERED_FRAME_COLLECT_DELAY.MIN;
        } else {
          bufferedFrameCollectDelay *= 1.618; 
          this.willCollectBufferedFrame = setTimeout(() => this.pushNextCollectEvent(), bufferedFrameCollectDelay);
        }
      }
      DEBUG.val && console.log(this.publics.state.attached);
      if ( noFrameReceived || this.publics.state.attached.size ) {
        if ( DEBUG.debugCommandOrder ) {
          BUFFERED_FRAME_EVENT.command.debugOrderId = DEBUG_ORDER_ID++;
        }
        const bfce = Object.assign({
          },
          BUFFERED_FRAME_EVENT
        );
        this.publics.send(bfce);
        DEBUG.val && console.log('collection event push result', this.publics.queue);
      }
    }
  }

  export default class EventQueue {
    constructor(state, sessionToken) {
      const privates = new Privates(this, state, sessionToken);
      if ( DEBUG.fullScope ) {
        this.privates = privates;
      }
      const queue = [];
      this.state = state;

      Connectivity = this.state.Connectivity;
      Connectivity.checkInterval = randomInterval(async () => {
        await sleep(0);
        const { status, error } = await Connectivity.checker.checkInternet();
        if ( status == 'error' ) {
          console.warn(`Internet connectivity check error: ${error}`, error);
        } else if ( status != Connectivity.lastStatus ) {
          Connectivity.lastStatus = status;
          setState('bbpro', state);
        }
      }, CONFIG.netCheckMinGap, CONFIG.netCheckMaxGap);

      Object.defineProperties(this, {
        queue: {
          get: () => queue
        },
        [$]: {
          get: () => privates
        }
      });
    }
    sendViewport(viewport) {
      messageId++;
      if ( ! this[$].senders )  {
        untilTrue(() => this[$].senders).then(() => this.sendViewport(viewport));
      } else {
        if ( !viewport.deviceScaleFactor ) {
          viewport.deviceScaleFactor = 1;
        }
        this[$].senders.so({messageId,viewport});
      }
    }
    sendAck() {
      messageId++;
      this.state.screenshotReceived = {
        frameId: this.state.latestFrameReceived, 
        castSessionId: this.state.latestCastSession
      };
      if ( ! this[$].senders )  {
        /*
        if ( DEBUG.debugCommandOrder ) {
          BUFFERED_FRAME_EVENT.command.debugOrderId = DEBUG_ORDER_ID++;
        }
        untilTrue(() => this[$].senders).then(() => {
          this[$].senders.so({messageId,zombie:{events:[BUFFERED_FRAME_EVENT]},screenshotAck: this[$].screenshotReceived});
        });
        */
      } else {
        if ( DEBUG.debugCommandOrder ) {
          BUFFERED_FRAME_EVENT.command.debugOrderId = DEBUG_ORDER_ID++;
        }
        this[$].senders.so({messageId,zombie:{events:[BUFFERED_FRAME_EVENT]},screenshotAck: this[$].screenshotReceived});
      }
    }
    send( event ) {
      if ( event.immediate ) {
        event.immediate = undefined;
        this[$].sendImmediate(event);
        this.checkResults();
      } else {
        if ( Array.isArray(event) ) {
          this.queue.push(...event);
        } else {
          this.queue.push(event);
        }
        this[$].triggerSendLoop();
      }
    }
    checkResults() {
      DEBUG.debugTabs && console.log(`Checking for results...`);
      this[$].singleCheckForResults();
    }
    getImageEl( url ) {
      url = url || this[$].subscribers[0];
      url = normalizeUrl(url);
      return this[$].images.get(url);
    }
    addSubscriber( url, translator, imageEl ) {
      url = normalizeUrl(url);
      this[$].subscribers.push( url );
      if ( !! translator && typeof translator == "function" ) {
        this[$].translators.set(url, translator);
      }
      if ( !! imageEl && imageEl instanceof HTMLImageElement ) {
        this[$].images.set(url, imageEl);
        imageEl.onerror = () => {
          frameDrawing = false;
          if ( imageEl.oldSrc && ! DEBUG.useDataURL ) {
            URL.revokeObjectURL(imageEl.oldSrc);
          }
        };
        imageEl.addEventListener('load', () => {
          const {canvasEl: canvas, ctx} = this.state.viewState;
          if ( false && clearNextFrame ) {
            clearNextFrame = false;
            //ctx.clearRect(0,0,canvas.width,canvas.height);
            clearInterval(this[$].clearInterval);
            //this[$].clearInterval = setTimeout(() => clearNextFrame = true, 1001);
          }
          //blitImage();
          // get the scale
          if ( DEBUG.scaleImage ) {
            const dpi = window.devicePixelRatio;
            const lastBounds = state.viewState.bounds;
            const {
              width:elementWidth, height:elementHeight
            } = canvas.getBoundingClientRect();
            const scaleX = (canvas.width / imageEl.width);
            const scaleY = (canvas.height / imageEl.height);
            state.viewState.scaleX = scaleX;
            state.viewState.scaleY = scaleY;
            let scale = Math.min(scaleX,scaleY);
            state.viewState.scale = scale;
            if ( DEBUG.increaseResolutionOfSmallerCanvas && scale < 1.0 ) {
              canvas.width /= scale;
              canvas.height /= scale;
              scale = 1.0; // for drawing as we've resized the canvas we don't need to resize the image
              if ( DEBUG.debugShrink ) {
                console.log(`New canvas dimensions: ${canvas.width} x ${canvas.height}`);
              }
            }

            if ( lastBounds ) {
              if ( imageEl.width != lastBounds.x || imageEl.height != lastBounds.y ) {
                DEBUG.debugImageRemainderClears && console.log(`Last image and this image differ in size, clearing`, imageEl.width, imageEl.height, lastBounds, Date.now());
                ctx.clearRect(0,0,canvas.width,canvas.height);
              }
            }
            state.viewState.bounds = {
              x: imageEl.width,
              y: imageEl.height,
            };
            ctx.drawImage(imageEl, 0, 0, imageEl.width * scale, imageEl.height * scale);
          } else {
            console.warn(`We are not adjusting pointer position for the diff`);
            if ( DEBUG.centerImage && (canvas.width !== imageEl.width || canvas.height !== imageEl.height) ) {
              const diffW = canvas.width - imageEl.width;
              const diffH = canvas.height - imageEl.height;
              ctx.drawImage(imageEl, diffW/2, diffH/2);
            } else {
              ctx.drawImage(imageEl,0,0);
            }
          }
          frameDrawing = false;
          if ( imageEl.oldSrc && ! DEBUG.useDataURL ) {
            URL.revokeObjectURL(imageEl.oldSrc);
          }
        });
      }
    }
    addMetaListener( type, func ) {
      let typeList = this[$].typeLists.get(type);
      if ( !typeList ) {
        typeList = [];
        this[$].typeLists.set(type, typeList);
      }
      typeList.push(func);
    }
    removeMetaListener( type, func ) {
      let typeList = this[$].typeLists.get(type);
      if ( !typeList ) {
        return;
      }
      typeList.splice(typeList.indexOf(func), 1);
    }
  }

  function hasWebRTC() {
    return !!(window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection);
  }

  async function showExplainer() {
    state.viewState.modalComponent.openModal({modal:{
      type:'notice',
      message: `We're about to request mic access to improve streaming (because of the Safari bug, below). It's just for setup, not recording, and auto-closes after a fast link is built. Tap Allow in Website Settings to avoid future prompts; or, deny if you prefer, tho it might affect quality. Ready?`,
      title: `Safari Permissions`,
      link: {
        title: 'View Bug',
        target: "_blank",
        href: "https://bugs.webkit.org/show_bug.cgi?id=189503"
      }
    }}, state);
    DEBUG.debugSafariWebRTC && console.log(`Waiting for explainer to open`);
    await untilTrue(() => state?.viewState?.currentModal);
    DEBUG.debugSafariWebRTC && console.log(`Waiting for explainer close`);
    await untilHuman(() => state.viewState && !state.viewState.currentModal);
    DEBUG.debugSafariWebRTC && console.log(`Waiting for 309 ms`);
    await sleep(309);
  }

  function normalizeUrl(url) {
    return url;
    /*
    const uri = new URL(url);
    return uri.origin;
    */
  }

  function parse(ab) {
    let data = ab;
    if ( ab instanceof ArrayBuffer ) {
      data = new Uint8Array(ab)
    }
    DEBUG.debugCast && console.log({ab,data})
    const u32 = new Uint32Array(data.buffer, 0, HEADER_BYTE_LEN);
    const img = data.slice(HEADER_BYTE_LEN);
    DEBUG.debugCast && console.log({u32,img});

    let castSessionId, frameId, targetId;

    if ( isLE ) {
      castSessionId = u32[0];
      frameId = u32[1];
      targetId = `${
        u32[2].toString(16).padStart(8,'0')}${
        u32[3].toString(16).padStart(8,'0')}${
        u32[4].toString(16).padStart(8,'0')}${
        u32[5].toString(16).padStart(8,'0')
       }`.toLocaleUpperCase();
    } else {
      castSessionId = be2le(u32[0]);
      frameId = be2le(u32[1]);
      targetId = `${
        be2le(u32[2]).toString(16).padStart(8,'0')}${
        be2le(u32[3]).toString(16).padStart(8,'0')}${
        be2le(u32[4]).toString(16).padStart(8,'0')}${
        be2le(u32[5]).toString(16).padStart(8,'0')
       }`.toLocaleUpperCase();
    }

    DEBUG.debugCast && console.log({castSessionId, frameId, targetId});

    return {img,castSessionId,frameId,targetId};
  }

  async function drawFrames(state, buf, image, raw = false, typedArray = false, frameId) {
    clearTimeout(state.ackIfNoFrame);

    if ( ! DEBUG.immediateAck ) {
      noFrameReceived = 0;
      inFrameCount++;
      if ( (inFrameCount % DEBUG.ackEvery) == 0 ) {
        state.screenshotReceived = {
          frameId: state.latestFrameReceived, 
          castSessionId: state.latestCastSession
        };
      }
    }

    if ( ! image ) {
      throw new TypeError(`No image to draw upon`);
    }

    if ( DEBUG.dropFramesWhenDrawing && frameDrawing ) {
      DEBUG.val && console.warn(`Dropping frame because still drawing last one`, buf, image, state.screenshotReceived);
      return;
    }

    state.ackIfNoFrame = setTimeout(() => ackIfNoFrame(state), REGULAR_NO_FRAME_ACK_INTERVAL);

    if ( typedArray === true ) {
      if ( frameDrawing ) {
        //await sleep(Privates.firstDelay);
      }
      image.oldSrc = image.src;
      if ( DEBUG.useDataURL ) {
        image.src = `data:${ITYPE};base64,${abto64(buf)}`;
      } else {
        image.src = URL.createObjectURL(new Blob([buf]), {type: ITYPE});
      }
      frameDrawing = true;
      //alert('log ack!');
    } else if ( raw === true ) {
      if ( frameDrawing ) {
        //await sleep(Privates.firstDelay);
      }
      image.oldSrc = image.src;
      if ( DEBUG.useDataURL ) {
        image.src = `data:${ITYPE};base64,${abto64(buf[0])}`;
      } else {
        image.src = URL.createObjectURL(new Blob([buf[0]]), {type: ITYPE});
      }
      frameDrawing = true;
      //alert('log ack2!');
    } else {
      buf = buf.filter(x => !!x);
      buf = buf.filter(({targetId}) => targetId == state.activeTarget);
      for( const {img,frame:frameId} of buf ) { 
        if ( frameDrawing ) {
          DEBUG.val >= DEBUG.med && console.log(`Wanting to draw ${frameId} but breifly waiting for a previous frame to load.`);
          await sleep(Privates.firstDelay);
        }
        if ( (frameId - latestFrameId) < 1 ) {
          DEBUG.debugFrameDrops && console.warn(
            `Dropping frame ${frameId} because old.`, latestFrameId
          );
          return;
        }
        latestFrameId = frameId;
        DEBUG.logFrameIds && console.log(`Drawing frameId ${frameId}`);
        image.src = `data:${ITYPE};base64,${img}`;
        frameDrawing = true;
        state.screenshotReceived = {frameId, castSessionId:0xCC55151C};
        //alert('log ack3');
      }
    }
  }

  function ackIfNoFrame(state) {
    clearTimeout(state.ackIfNoFrame);
    state.screenshotReceived = {
      frameId: state.latestFrameReceived, 
      castSessionId: state.latestCastSession
    };
    state.ackIfNoFrame = setTimeout(() => ackIfNoFrame(state), REGULAR_NO_FRAME_ACK_INTERVAL);
  }

  function meetsCollectBufferedFrameCondition(queue, events) {
    /**
      * The conditions for this are:
      * - we are sending the remainder of the queue (so none remain after this send).
      * - there is at least 1 click, scroll, or select event here.
      * 
      * If these conditions are met, then we set a timer. Once that timer expires,
      * We make an additional request to the server. That request is designed to pick up,
      * if it exists, any screenshot created after the click, scroll or select.
      * 
      * The timer is voided if we happen to make ANY request, before it expires. 
      * Let's have the timer property on the privates.
      * Let's expire it (cancel it) at sendEvents
      *
      * Finally what type of event will it add to the queue.
    **/ 
    const someRequireShot = events.some(({command}) => command.requiresShot || command.requiresTailShot);
    const createsTarget = events.some(({command}) => command.name == "Target.createTarget");
    const meetsCondition = someRequireShot || createsTarget;
    DEBUG.val >= DEBUG.med && console.log({events, someRequireShot, createsTarget});
    return meetsCondition;
  }

  function transmitReply({url, id, data, meta, totalBandwidth},message) {
    let key = `${url}:${id}`;
    const resolvePromise = waiting.get(key);
    DEBUG.debugMeta && console.log({key, url, id, meta, message});
    if ( resolvePromise ) {
      DEBUG.debugMeta && console.log({resolvingPromise:{key, resolvePromise}});
      waiting.delete(key);
      OldIncoming.set(id, {data,meta,totalBandwidth,message});
      resolvePromise({data,meta,totalBandwidth});
      return true;
    } else {
      return false;
    }
  }

  /*async function die() {
    if ( DEBUG.val ) {
      console.log(`Application is in an invalid state. Going to ask to reload`);
    }
    if ( !DEBUG.dev && await tconfirm(`Sorry, something went wrong, and we need to reload. Is this okay?`, this.connected) ) {
      treload();
    } else if ( DEBUG.val ) {
      throw new Error(`App is in an invalid state`);
    } else {
      treload();
    }
  }*/

  function onLine() {
    return Connectivity.checker.status == 'online';
  }

  function talert(msg) {
    if ( latestAlert && ! DEBUG.val ) {
      clearTimeout(latestAlert);
    }
    if ( typeof msg != "string" ) {
      try {
        msg = JSON.stringify(msg);
      } catch(e) {
        msg = "Original msg could not be converted to string";
        console.warn(msg);
      }
    }
    latestAlert = setTimeout(() => alert(msg), ALERT_TIMEOUT);
  }

  async function tconfirm(msg, connected, state) {
    if ( ! connected ) {
      if ( globalThis.purchaseClicked ) return;
      if ( state?.wipeIsInProgress || globalThis.wipeIsInProgress ) return;
      if ( globalThis.comingFromTOR ) return;
      if ( CONFIG.isCT ) {
        alert(`Your session expired. Close this message to return to your dashboard.`);
        try {
          top.location.href = 'https://browse.cloudtabs.net/';
        } catch(e) {
          location.href = 'https://browse.cloudtabs.net/'
        }
      } else {
        if ( globalThis.alreadyExpired || globalThis.windowUnloading ) return;
        globalThis.alreadyExpired = true;
        alert(`Your session has expired or disconnected.`);
      }
    } else {
      let resolve;
      const pr = new Promise(res => resolve = res);

      if ( latestAlert ) {
        clearTimeout(latestAlert);
      }
      latestAlert = setTimeout(() => {
        resolve(confirm(msg));
      }, ALERT_TIMEOUT);

      return pr;
    }
  }

  async function treload(sessionToken) {
    if ( DEBUG.val ) {
      alert("DEBUG mode. Not reloading automatically.");
      return;
    }

    let resolve;
    const pr = new Promise(res => resolve = res);

    if ( latestReload ) {
      clearTimeout(latestReload);
    }
    const newLocation = sessionToken ? 
      `${location.origin}/login?token=${sessionToken}&ran=${Math.random()}` 
      :
      location.href
    ;
    latestReload = setTimeout(() => resolve(location.href = newLocation), ALERT_TIMEOUT);

    return pr;
  }
