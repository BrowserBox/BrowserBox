import {sleep, isSafari, isFirefox, DEBUG, BLANK} from './common.js';
const $ = Symbol('[[EventQueuePrivates]]');
//const TIME_BETWEEN_ONLINE_CHECKS = 1001;

const ALERT_TIMEOUT = 300;
const MAX_E = 255;
const BUFFERED_FRAME_EVENT = {
  type: "buffered-results-collection",
  command: {
    isBufferedResultsCollectionOnly: true,
    params: {}
  }
};
const BUFFERED_FRAME_COLLECT_DELAY = {
  MIN: 75, /* 250, 500 */
  MAX: 4000, /* 2000, 4000, 8000 */
};
const MAX_BW_MEASURES = 10;
const Format = 'jpeg';
const waiting = new Map();
let connecting;
let latestReload;
let latestAlert;
//let lastTestTime;
//let lastOnlineCheck;
let messageId = 0;
let latestFrame = 0;
let frameDrawing = false;
let bufferedFrameCollectDelay = BUFFERED_FRAME_COLLECT_DELAY.MIN;

class Privates {
  constructor(publics, state, sessionToken) {
    this.willCollectBufferedFrame = null;
    this.websockets = new Map();
    this.publics = publics;
    this.subscribers = [];
    this.translators = new Map();
    this.images = new Map();
    this.typeLists = new Map();
    this.loopActive = false;
    this.Data = [];
    this.Meta = [];
    this.sessionToken = sessionToken;

    const WindowLength = 10;
    const messageWindow = [];
    const bwWindow = [];

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
    };

    let lastBytes = 0;
    let lastCheck = Date.now();
  }

  static get firstDelay() { return 20; /* 20, 40, 250, 500;*/ }

  triggerSendLoop() {
    if ( this.loopActive ) return;
    this.loopActive = true;
    this.currentDelay = this.constructor.firstDelay;
    setTimeout(() => this.nextLoop(), this.currentDelay); 
  }

  async nextLoop() {
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
      this.sendEventChain({chain,url}).then(({/*data,*/meta,totalBandwidth}) => {
        if ( !!meta && meta.length ) {
          meta.forEach(metaItem => {
            const executionContextId = metaItem.executionContextId;
            for ( const key of Object.keys(metaItem) ) {
              let typeList = this.typeLists.get(key);
              if ( typeList ) {
                typeList.forEach(func => {
                  try {
                    func({[key]:metaItem[key], executionContextId});
                  } catch(e) {
                    DEBUG.val && console.warn(`Error on ${key} handler`, func, e);
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
      this.sendEvents({events,url});
    }

    if ( this.publics.queue.length ) {
      setTimeout(() => this.nextLoop(), this.currentDelay);
    } else {
      this.loopActive = false;
    }
  }

  async sendEvents({events, url}) {
    if ( ! events ) return {meta:[],data:[]};
    events = events.filter(e => !!e && !!e.command);
    if ( events.length == 0 ) return {meta:[], data:[]};
    this.maybeCheckForBufferedFrames(events);
    let protocol;
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
      if ( protocol == 'ws:' || protocol == 'wss:' ) {
        try {
          const senders = this.websockets.get(url);
          messageId++;
          let resolve;
          const promise = new Promise(res => resolve = res);
          waiting.set(`${url}:${messageId}`, resolve);
          if ( senders ) {
            senders.so({messageId,zombie:{events}});
          } else {
            await this.connectSocket(url, events, messageId); 
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
        return fetch(url, request).then(r => r.json()).then(async ({data,frameBuffer,meta}) => {
          if ( !!frameBuffer && this.images.has(url) ) {
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

  async connectSocket(url, events, messageId) {
    if ( connecting ) {
      this.publics.queue.unshift(...events);
      return;
    }
    connecting = true;
    if ( !this.publics.state.demoMode && onLine() ) {
      let socket;
      try {
        socket = new WebSocket(url);
      } catch(e) {
        talert(`Error connecting to the server. Will reload to try again.`);
        if ( DEBUG.val ) talert( {msg:e.message, name:e.name, newWebsocketError:e, url, WebSocket, socket} );
        await treload();
      }
      socket.onopen = () => {
        this.websockets.set(url, {so,sa});
        const receivesFrames = !this.publics.state.useViewFrame;
        so({messageId,zombie:{events,receivesFrames}});
        function so(o) {
          socket.send(JSON.stringify(o));
        }
        function sa(a) {
          socket.send(a);
        }
      };
      socket.onmessage = async message => {
        let {data:MessageData} = message;
        const messageData = JSON.parse(MessageData);
        const {data,frameBuffer,meta,messageId:serverMessageId,totalBandwidth} = messageData;
        if ( !!frameBuffer && frameBuffer.length && this.images.has(url) ) {
          this.addBytes(MessageData.length, frameBuffer.length);    
          drawFrames(this.publics.state, frameBuffer, this.images.get(url));
        } else {
          this.addBytes(MessageData.length, false);    
        }

        const errors = data.filter(d => !!d && !!d.error);
        if ( errors.length ) {
          DEBUG.val >= DEBUG.low && console.warn(`${errors.length} errors occured.`);
          DEBUG && console.log(JSON.stringify(errors));
          if ( errors.some(({error}) => error.hasSession === false)) {
            console.warn(`Session has been cleared. Let's attempt relogin`, this.sessionToken);
            if ( DEBUG.blockAnotherReset ) return;
            DEBUG.blockAnotherReset = true;
            try {
              const x = new URL(location);
              x.pathname = 'login';
              x.search = `token=${this.sessionToken}&ran=${Math.random()}`;
              await talert("Your browser cleared your session. We need to reload the page to refresh it.");
              DEBUG.delayUnload = false;
              location.href = x;
              socket.onmessage = null;
            } catch(e) {
              talert("An error occurred. Please reload.");
            }
            return;
          } else if ( errors.some(({error}) => error.includes && error.includes("ECONNREFUSED")) ) {
            console.warn(`Cloud browser has not started yet. Let's reload and see if it has then.`);
            if ( DEBUG.blockAnotherReset ) return;
            DEBUG.blockAnotherReset = true;
            talert("Your cloud browser has not started yet. We'll reload and see if it has then.");
            await treload();
            return;
          } else if ( errors.some(({error}) => error.includes && error.includes("Timed out")) ) {
            console.warn(`Some events are timing out when sent to the cloud browser.`);
            if ( DEBUG.blockAnotherReset ) return;
            DEBUG.blockAnotherReset = true;
            const reload = await tconfirm(`Some events are timing out when sent to the cloud browser. Try reloading the page, and if the problem persists try switching your cloud browser off then on again. Want to reload now?`); 
            if ( reload ) {
              treload();
            }
            return;
          } else if ( errors.some(({error}) => error.includes && error.includes("not opened")) ) {
            console.warn(`We can't establish a connection the cloud browser right now. We can try reloading the page, but if the problem persists try switching your cloud browser off then on again.`);
            if ( DEBUG.blockAnotherReset ) return;
            DEBUG.blockAnotherReset = true;
            const reload = await tconfirm(`We can't establish a connection the cloud browser right now. We can try reloading the page, but if the problem persists try switching your cloud browser off then on again. Reload the page now?`);
            if ( reload ) {
              treload();
            }
            return;
          } else if ( errors.some(({resetRequired}) => resetRequired)) {
            console.warn(`Some errors have occurred which require reloading the page. If the problem persists try switching your cloud browser off then on again.`);
            if ( DEBUG.blockAnotherReset ) return;
            DEBUG.blockAnotherReset = true;
            const reload = await tconfirm(`Some errors have occurred which require reloading the page. If the problem persists try switching your cloud browser off then on again. Want to reload the page now?`); 
            if ( reload ) {
              treload();
            }
            return;
          }
        }

        if ( !!meta && meta.length ) {
          meta.forEach(metaItem => {
            const executionContextId = metaItem.executionContextId;
            for ( const key of Object.keys(metaItem) ) {
              let typeList = this.typeLists.get(key);
              if ( typeList ) {
                typeList.forEach(func => {
                  try {
                    func({[key]:metaItem[key], executionContextId});
                  } catch(e) {
                    DEBUG.val && console.warn(`Error on ${key} handler`, func, e);
                  }
                });
              }
            }
          });
        }

        if ( totalBandwidth ) {
          this.publics.state.totalBandwidth = totalBandwidth;
        }

        const replyTransmitted  = transmitReply({url, id: serverMessageId, data, meta, totalBandwidth});
        
        if ( replyTransmitted ) return;

        else if ( DEBUG.val ) {
          console.warn(`Server sent message Id ${serverMessageId}, which is not in our table.`);
          console.info(`Falling back to closure message id ${messageId}`);
        }

        const fallbackReplyTransmitted = transmitReply({url, id: messageId, data, meta, totalBandwidth});

        if ( fallbackReplyTransmitted ) return;

        else if ( DEBUG.val ) {
          console.warn(`Neither server nor closure message ids were in our table.`);
        }

        //die();
      };
      socket.onclose = async (e) => {
        this.websockets.delete(url);
        console.log("Socket disconnected. Will reconnect when online");
        talert(`Error connecting to the server -- Will reload to try again.`);
        if ( DEBUG.val ) talert( {socketClosed:e} );
        await treload();
      };
      socket.onerror = async (e) => {
        socket.onerror = null;
        talert(`Error connecting to the server - Will reload to try again.`);
        if ( DEBUG.val ) talert( {socketError:e} );
        await treload();
      };
    } else {
      console.log("Offline. Will connect socket when online");
      talert(`Error connecting to the server, will reload to try again.`);
      if ( DEBUG.val ) talert( {offline:true} );
      await treload();
    }
  }

  async sendEventChain({chain, url}) {
    const Meta = [], Data = [];
    let lastData;
    for( const next of chain ) {
      if ( typeof next == "object" ) {
        const {meta,data} = await this.sendEvents({events:[next], url});
        Meta.push(...meta);
        Data.push(...data);
        lastData = data;
      } else if ( typeof next == "function" ) {
        let funcResult;
        try {
          funcResult = next(lastData[0]);
        } catch(e) {
          Data.push({error:e+''});
        }
        let events;
        if ( Array.isArray(funcResult) ) {
          events = funcResult;
        } else if ( typeof funcResult == "object" ) {
          events = [funcResult];
        } 
        let {meta,data} = await this.sendEvents({events, url});
        Meta.push(...meta);
        Data.push(...data);
        lastData = data;
      }
    }
    return {data:Data,meta:Meta};
  }

  maybeCheckForBufferedFrames(events) {
    if ( meetsCollectBufferedFrameCondition(this.publics.queue, events) ) {
      if ( this.willCollectBufferedFrame ) {
        clearTimeout(this.willCollectBufferedFrame);
        this.willCollectBufferedFrame = false;
        bufferedFrameCollectDelay = BUFFERED_FRAME_COLLECT_DELAY.MIN;
      }
      this.willCollectBufferedFrame = setTimeout(() => this.pushNextCollectEvent(), bufferedFrameCollectDelay);
    }
  }

  pushNextCollectEvent() {
    DEBUG.val >= DEBUG.med && console.log("Meets collect delayed shot condition. Pushing a collect results event.");
    clearTimeout(this.willCollectBufferedFrame);
    this.willCollectBufferedFrame = false;
    if ( bufferedFrameCollectDelay >= BUFFERED_FRAME_COLLECT_DELAY.MAX ) {
      bufferedFrameCollectDelay = BUFFERED_FRAME_COLLECT_DELAY.MIN;
    } else {
      bufferedFrameCollectDelay *= 1.618; 
      this.willCollectBufferedFrame = setTimeout(() => this.pushNextCollectEvent(), bufferedFrameCollectDelay);
    }
    this.publics.queue.push(Object.assign({id:messageId++},BUFFERED_FRAME_EVENT));
    this.triggerSendLoop();
  }
}

export default class EventQueue {
  constructor(state, sessionToken) {
    const privates = new Privates(this, state, sessionToken);
    const queue = [];
    this.state = state;
    Object.defineProperties(this, {
      queue: {
        get: () => queue
      },
      [$]: {
        get: () => privates
      }
    });
  }
  send( event ) {
    if ( Array.isArray(event) ) {
      this.queue.push(...event);
    } else {
      this.queue.push(event);
    }
    this[$].triggerSendLoop();
  }
  addSubscriber( url, translator, imageEl ) {
    this[$].subscribers.push( url );
    if ( !! translator && typeof translator == "function" ) {
      this[$].translators.set(url, translator);
    }
    if ( !! imageEl && imageEl instanceof HTMLImageElement ) {
      this[$].images.set(url, imageEl);
      imageEl.onerror = () => {
        frameDrawing = false;
      };
      imageEl.addEventListener('load', () => {
        const ctx = this.state.viewState.ctx;
        ctx.drawImage(imageEl,0,0);
        frameDrawing = false;
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
}

async function drawFrames(state, buf, image) {
  buf = buf.filter(x => !!x);
  buf.sort(({frame:frame1},{frame:frame2}) => frame2 - frame1);
  buf = buf.filter(({frame,targetId}) => {
    const cond = frame > latestFrame && targetId == state.activeTarget;
    latestFrame = frame;
    return cond;
  });
  for( const {img,frame} of buf ) { 
    if ( frame < latestFrame ) {
      console.warn(`Got frame ${frame} less than ${latestFrame}. Dropping`);
      continue;
    }
    if ( frameDrawing ) {
      DEBUG.val >= DEBUG.med && console.log(`Wanting to draw ${frame} but waiting for ${frameDrawing} to load.`);
      await sleep(Privates.firstDelay);
    }
    frameDrawing = frame;
    DEBUG.val >= DEBUG.med && console.log(`Drawing frame ${frame}`);
    image.src = `data:image/${Format};base64,${img}`;
    await sleep(Privates.firstDelay);
  }
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

function transmitReply({url, id, data, meta, totalBandwidth}) {
  let key = `${url}:${id}`;
  const resolvePromise = waiting.get(key);
  if ( resolvePromise ) {
    waiting.delete(key);
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
  if ( !DEBUG.dev && await tconfirm(`Sorry, something went wrong, and we need to reload. Is this okay?`) ) {
    treload();
  } else if ( DEBUG.val ) {
    throw new Error(`App is in an invalid state`);
  } else {
    treload();
  }
}*/

function onLine() {
  return navigator.onLine;
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

async function tconfirm(msg) {
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

async function treload() {
  if ( DEBUG.val ) {
    alert("DEBUG mode. Not reloading automatically.");
    return;
  }

  let resolve;
  const pr = new Promise(res => resolve = res);

  if ( latestReload ) {
    clearTimeout(latestReload);
  }
  latestReload = setTimeout(() => resolve(location.reload()), ALERT_TIMEOUT);

  return pr;
}
