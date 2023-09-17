import {spawn} from 'child_process';
import {WebSocket} from 'ws';
/* import fetch from 'node-fetch'; */
import fs from 'fs';
import os from 'os';
import path from 'path';
import {URL} from 'url';
import {unescape} from 'querystring';
import {
  LOG_FILE,
  SignalNotices,
  NoticeFile,
  noticeFilePath,
  NOTICE_SIGNAL,
  APP_ROOT, FLASH_FORMATS, DEBUG, 
  CONFIG,
  sleep, SECURE_VIEW_SCRIPT, MAX_TABS, 
  consolelog,
  untilTrue
} from '../common.js';
import {username} from '../args.js';
import {WorldName} from '../public/translateVoodooCRDP.js';
import {RACE_SAMPLE, makeCamera, COMMON_FORMAT, DEVICE_FEATURES, SCREEN_OPTS, MAX_ACK_BUFFER, MIN_WIDTH, MIN_HEIGHT} from './screenShots.js';
import {blockAds,onInterceptRequest as adBlockIntercept} from './adblocking/blockAds.js';
import {getInjectableAssetPath, LatestCSRFToken, fileChoosers} from '../ws-server.js';
//import {overrideNewtab,onInterceptRequest as newtabIntercept} from './newtab/overrideNewtab.js';
//import {blockSites,onInterceptRequest as whitelistIntercept} from './demoblocking/blockSites.js';

// standard injections
const selectDropdownEvents = fs.readFileSync(path.join(APP_ROOT, 'zombie-lord', 'injections', 'selectDropdownEvents.js')).toString();
const keysCanInputEvents = fs.readFileSync(path.join(APP_ROOT, 'zombie-lord', 'injections', 'keysCanInput.js')).toString();
const textComposition = fs.readFileSync(path.join(APP_ROOT, 'zombie-lord', 'injections', 'textComposition.js')).toString();
const fileInput = fs.readFileSync(path.join(APP_ROOT, 'zombie-lord', 'injections', 'fileInput.js')).toString();
const favicon = fs.readFileSync(path.join(APP_ROOT, 'zombie-lord', 'injections', 'favicon.js')).toString();
const elementInfo = fs.readFileSync(path.join(APP_ROOT, 'zombie-lord', 'injections', 'elementInfo.js')).toString();
const scrollNotify = fs.readFileSync(path.join(APP_ROOT, 'zombie-lord', 'injections', 'scrollNotify.js')).toString();
const botDetectionEvasions = fs.readFileSync(path.join(APP_ROOT, 'zombie-lord', 'injections', 'pageContext', 'botDetectionEvasions.js')).toString();
const showMousePosition = fs.readFileSync(path.join(APP_ROOT, 'zombie-lord', 'injections', 'pageContext', 'showMouse.js')).toString();

// plugins injections
const appMinifier = fs.readFileSync(path.join(APP_ROOT, 'plugins', 'appminifier', 'injections.js')).toString();
const projector = fs.readFileSync(path.join(APP_ROOT, 'plugins', 'projector', 'injections.js')).toString();

// just concatenate the scripts together and do one injection
// but for debugging better to add each separately
// we can put in an array, and loop over to add each
const injectionsScroll = `(function () {
  if( !self.zanjInstalled ) {
     {
       ${fileInput + favicon + keysCanInputEvents + scrollNotify + elementInfo + textComposition + selectDropdownEvents}
     }
     self.zanjInstalled = true;
  } 
}())`;
const manualInjectionsScroll = `(function () {
  ${fileInput + favicon + keysCanInputEvents + scrollNotify + elementInfo + textComposition + selectDropdownEvents}
  ${DEBUG.showMousePosition ? showMousePosition : ''}
}())`;
const pageContextInjectionsScroll = `(function () {
  ${botDetectionEvasions}
  ${DEBUG.showMousePosition ? showMousePosition : ''}
}())`;

const templatedInjections = {
};

const docViewerSecret = process.env.DOCS_KEY;
const MAX_TRIES_TO_LOAD = 10;
const TAB_LOAD_WAIT = 300;
const RECONNECT_MS = 5000;
const WAIT_FOR_DOWNLOAD_BEGIN_DELAY = 5000;
const WAIT_FOR_COALESCED_NETWORK_EVENTS = 1000

import {
  deskUA_Mac_FF,
  mobUA_iOSFF,
  deskPLAT_Mac,
  mobPLAT_iOS,
  LANG,
  VEND_FF,
  ua,
} from './navigator.js';

const GrantedPermissions = [
  "geolocation", 
  "notifications", 
  "durableStorage", 
  /** the following are probably not secure 
    "clipboardReadWrite", 
    "clipboardSanitizedWrite", 
  **/
  /*"flash", (no longer works and results in no grant for anything */ 
  /** the following don't do anything in chrome headless
    "midi",
    "audioCapture", 
    "backgroundSync", 
    "backgroundFetch", 
    "displayCapture", 
    "midiSysex", 
    "nfc", 
    "paymentHandler", 
    "periodicBackgroundSync", 
    "protectedMediaIdentifier", 
    "sensors", 
    "videoCapture", 
    "videoCapturePanTiltZoom", 
    "idleDetection", 
  **/
];
//const PromptText = "Dosy was here.";
const ROOT_SESSION = 'root';

// for fun
const Area51Lat = 37.234332396;
const Area51Long = -115.80666344;

// throttling 'open in external app' requests
const INTENT_PROMPT_THRESHOLD = 30000;

const mobUA = mobUA_iOSFF;
const deskUA = deskUA_Mac_FF;
const mobPLAT = mobPLAT_iOS;
const deskPLAT = deskPLAT_Mac;
const UA = deskUA;
const PLAT = deskPLAT_Mac;
const VEND = VEND_FF;

DEBUG.debugNavigator && console.log({UA, mobUA, deskUA, PLAT, VEND});

const checkSetup = new Map();
const targets = new Set(); 
//const waiting = new Map();
const sessions = new Map();
const casts = new Map();
const loadings = new Map();
const tabs = new Map();
const favicons = new Map();
const Frames = new Map();
const SetupTabs = new Map();
//const originalMessage = new Map();
const DownloadPath = path.resolve(CONFIG.baseDir , 'browser-downloads');
let GlobalFrameId = 1;
let AD_BLOCK_ON = true;
let DEMO_BLOCK_ON = false;
let firstSource;
let latestTimestamp;
let lastVChange;
let lastWChange;

function addSession(targetId, sessionId) {
  sessions.set(targetId,sessionId);
  sessions.set(sessionId,targetId);
}

function startLoading(sessionId) {
  let loading = loadings.get(sessionId);  
  if ( ! loading ) {
    loading = {waiting:0, complete:0,targetId:sessions.get(sessionId)}
    loadings.set(sessionId,loading);
  }
  loading.waiting++;
  return loading;
}

function endLoading(sessionId) {
  let loading = loadings.get(sessionId);  
  if ( ! loading ) throw new Error(`Expected loading for ${sessionId}`);
  loading.waiting--;
  loading.complete++;
  return loading;
}

function clearLoading(sessionId) {
  loadings.delete(sessionId);
}

function removeSession(id) {
  const otherId = sessions.get(id);
  sessions.delete(id);
  sessions.delete(otherId);
}

//let id = 0;

/**
  Note, to support multiple clients we cannot simply call Connect for each one
  to create multiple CRDP sessions into the one browser.

  The reason is because each session will have its own target and sessionId
  and some things we want to do for shared browsing require sharing that 
  information across clients.

  1 Connect call per client would require a translation table among targetIds and sessionIds
**/
export default async function Connect({port}, {adBlock:adBlock = DEBUG.adBlock, demoBlock: demoBlock = false} = {}) {
  AD_BLOCK_ON = adBlock;

  LOG_FILE.Commands = new Set([
    "Emulation.setDeviceMetricsOverride",
    "Browser.setWindowBounds",
    "Page.startScreencast",
    "Page.stopScreencast",
    "Page.captureScreenshot"
  ]);

  if ( demoBlock ) {
    AD_BLOCK_ON = false;
    DEMO_BLOCK_ON = true;
  }
  const connection = {
    zombie: await makeZombie({port}),
    // the clients ({peer, socket} objects)
    links: new Map,
    viewports: new Map,
    // send to client function
    so: null,
    port,
    browserTargetId: null,
    loadingCount: 0,
    totalBandwidth: 0,
    record: {},
    frameBuffer: [],
    pausing: new Map(),
    worlds: new Map(),
    sessionSend,
    sessions,
    targets,
    tabs,
    favicons,
    sessionId: null,
    bounds: Object.assign({}, COMMON_FORMAT),
    navigator: { userAgent: UA, platform: PLAT, acceptLanguage: LANG, vendor: VEND },
    plugins: {},
    setClientErrorSender(e) {
      this.zombie.sendErrorToClient = e;
    },
    // screencast related
    casts,
    latestCastId: null,
    activeTarget: null,
  };

  process.on(NOTICE_SIGNAL, reportNoticeOnSignal);

  function reportNoticeOnSignal(signal) {
    try {
      const notice = fs.readFileSync(noticeFilePath).toString();
      DEBUG.debugNoticeSignal && console.log({signal, notice});
      const modal = {
        type: 'notice',
        title: "System Notice",
        message: notice,
      };
      connection.meta.push({modal});
      const randomName = path.resolve(SignalNotices, 'old' + Math.random().toString(36) + performance.now());
      fs.renameSync(noticeFilePath, randomName);
      fs.unlinkSync(randomName);
    } catch(e) {
      console.log(`Error on sending notice`, e, {signal});
    }
  }

  if ( DEBUG.metaDebug ) {
    const arr = [];
    Object.defineProperty(connection, 'meta', {
      get: () => {
        //console.log(`Getting connection.meta`, arr.length, (new Error).stack);
        console.log('accessing meta', JSON.stringify(arr), (new Error).stack);
        return arr;
      },
      set: val => {
        console.log(`SETTING connection.meta`, arr.length, (new Error).stack);
        arr.push(...val); 
      }
    });
  } else {
    (DEBUG.debugFavicon || DEBUG.metaDebug) && console.warn(`META: resetting meta`, JSON.stringify(connection.meta));
    connection.meta = [];
  }
  connection.zombie.on('disconnect', async () => {
    console.log(`Reconnecting to zombie in ${RECONNECT_MS}`);
    process.off(NOTICE_SIGNAL, reportNoticeOnSignal);
    await sleep(RECONNECT_MS);
    setTimeout(async () => {
      // maybe should actually call makeZombie again?
      const next_connection = await Connect(
        {port:connection.port}, 
        {adBlock, demoBlock}
      );
      Object.assign(connection,next_connection);
    }, RECONNECT_MS);
  });

  {
    const {doShot, queueTailShot, shrinkImagery, growImagery, restartCast} = makeCamera(connection);
    connection.doShot = doShot;
    connection.queueTailShot = queueTailShot;
    connection.shrinkImagery = shrinkImagery;
    connection.growImagery = growImagery;
    connection.restartCast = restartCast;
  }

  if ( DEBUG.useFlashEmu ) {
    try {
      templatedInjections.flashEmu = templatedInjections.flashEmu || 
        await import(path.join(APP_ROOT, 'zombie-lord', 'injections', 'templated', 'flashEmu.js'));
    } catch(e) {
      console.warn(`Error importing flashEmu.js`, e);
    }
  }

  console.log({port});
  const {send,on, ons} = connection.zombie;

  const {targetInfo:browserTargetInfo} = await send("Target.getTargetInfo", {});
  connection.browserTargetId = browserTargetInfo.targetId;

  ! DEBUG.legacyShots && await send("HeadlessExperimental.enable", {});
  await send("Target.setDiscoverTargets", {
    discover:true,
    filter: [
      {type: 'page'}
    ]
  });
  await send("Target.setAutoAttach", {
    autoAttach:DEBUG.attachImmediately, 
    waitForDebuggerOnStart:DEBUG.attachImmediately, 
    flatten:true, 
    filter: [
      {type: 'page'}
    ]
  });

  await send("Browser.setDownloadBehavior", {
    behavior: "allowAndName",
    downloadPath: DownloadPath,
    eventsEnabled: true
  });
  on("Browser.downloadWillBegin", beginDownload);
  on("Browser.downloadProgress", progressDownload);

  on("Target.targetCreated", async ({targetInfo}) => {
    DEBUG.val && consolelog('create 1', targetInfo);
    const {targetId} = targetInfo;
    targets.add(targetId);
    tabs.set(targetId,targetInfo);
    connection.meta.push({created:targetInfo,targetInfo});
    if ( targetInfo.type == "page" && !DEBUG.attachImmediately ) {
      await send("Target.attachToTarget", {targetId, flatten:true});
    }
    DEBUG.val && consolelog('create 2', targetInfo);
  });

  on("Target.targetInfoChanged", async ({targetInfo}) => {
    DEBUG.val && consolelog('change 1', targetInfo);
    const {targetId} = targetInfo;
    if ( tabs.has(targetId) ) {
      tabs.set(targetId,targetInfo);
      connection.meta.push({changed:targetInfo,targetInfo});
      if ( targetInfo.type == "page" ) {
        connection.doShot();
      }
    } else {
      DEBUG.val > DEBUG.med && console.log("Changed event for removed target", targetId, targetInfo);
    }
    DEBUG.val && consolelog('change 2', targetInfo);
    if ( checkSetup.has(targetId) && targetInfo.url !== 'about:blank' ) {
      const sessionId = sessions.get(targetId);
      if ( sessionId ) {
        const obj = checkSetup.get(targetId);
        await sleep(TAB_LOAD_WAIT);
        const worlds = connection.worlds.get(sessionId);
        DEBUG.val && console.log('worlds at info changed', worlds);

        let missingWorlds = ! worlds;

        if ( worlds ) {
          const {frameTree} = await send("Page.getFrameTree", {}, sessionId);
          const frameList = enumerateFrames(frameTree, worlds.size);
          DEBUG.worldDebug && consolelog('Frames', frameList, 'worlds', worlds);
          missingWorlds = worlds.size < frameList.length;
        }

        if ( missingWorlds ) {
          DEBUG.worldDebug && consolelog(
            'Our tab has not fully loaded all our injections. Will reload', 
            targetInfo
          );
          const obj = checkSetup.get(targetId);
          if ( obj.val > 0 ) {
            obj.val--;
          } else {
            console.warn(`Tried ${MAX_TRIES_TO_LOAD} times to load our injections in tab, but didn't work. Not trying anymore.`, targetInfo);
            checkSetup.delete(targetId);
          }
          if ( obj.checking ) {
            DEBUG.worldDebug && consolelog(`Already checking ${targetId}`, obj);
            return;
          }
          obj.checking = true;
          if ( !obj.tabSetup ) {
            obj.needsReload = true;
          } else {
            await send("Page.reload", {}, sessionId);
          }
        } else {
          checkSetup.delete(targetId);
          DEBUG.worldDebug && consolelog(`Our tab is loaded!`, targetInfo);
        }
      }
    }
  });

  on("Target.attachedToTarget", async ({sessionId,targetInfo,waitingForDebugger}) => {
    DEBUG.worldDebug && consolelog('attached 1', targetInfo);
    DEBUG.val && consolelog('attached 1', targetInfo);
    const attached = {sessionId,targetInfo,waitingForDebugger};
    const {targetId} = targetInfo;
    DEBUG.val > DEBUG.med && console.log("Attached to target", sessionId, targetId);
    targets.add(targetId);
    addSession(targetId, sessionId);
    checkSetup.set(targetId, {val:MAX_TRIES_TO_LOAD, checking:false});
    connection.meta.push({attached});
    // we always size when we attach, otherwise they just go to screen size
    // which might be bigger than the lowest common screen dimensions for the clients
    // so they will call a resize anyway, so we just anticipate here
    await setupTab({attached});
    /**
      // putting this here will stop open in new tab from working, since
      // we will reload a tab before it has navigated to its intended destination
      // in effect resetting it mid navigation, whereupon it remains on about:blank
      // and information about its intended destination is lost
      const worlds = connection.worlds.get(sessionId);
      DEBUG.val && console.log('worlds at attached', worlds);
      if ( ! worlds ) {
        await send("Page.reload", {}, sessionId);
      }
    **/
    DEBUG.val && consolelog('attached 2', targetInfo);
    DEBUG.worldDebug && consolelog('attached 2', targetInfo);
  });

  on("Target.detachedFromTarget", ({sessionId}) => {
    const detached = {sessionId};
    const targetId = sessions.get(sessionId);
    targets.delete(targetId);
    tabs.delete(targetId);
    removeSession(sessionId);
    if ( connection.activeTarget === targetId ) {
      connection.activeTarget = null;
    }
    deleteWorld(targetId);
    connection.meta.push({detached});
  });

  on("Target.targetCrashed", meta => endTarget(meta, 'crashed'));

  on("Target.targetDestroyed", meta => endTarget(meta, 'destroyed'));

  ons("Page.screencastFrame", sendFrameToClient);
  ons("Target.receivedMessageFromTarget", receiveMessage);
  //ons("LayerTree.layerPainted", receiveMessage);
  ons("Page.frameRequestedNavigation", receiveMessage);
  ons("Network.requestWillBeSent", receiveMessage);
  ons("Network.dataReceived", receiveMessage);
  ons("Network.loadingFailed", receiveMessage);
  ons("Network.responseReceived", receiveMessage);
  ons("Fetch.requestPaused", receiveMessage);
  ons("Fetch.authRequired", receiveMessage);
  ons("Runtime.bindingCalled", receiveMessage);
  ons("Runtime.consoleAPICalled", receiveMessage);
  ons("Runtime.executionContextCreated", receiveMessage);
  ons("Runtime.executionContextDestroyed", receiveMessage);
  ons("Runtime.executionContextsCleared", receiveMessage);
  ons("Page.frameNavigated", receiveMessage);
  ons("Page.fileChooserOpened", receiveMessage);
  ons("Page.javascriptDialogOpening", receiveMessage);
  ons("Runtime.exceptionThrown", receiveMessage);
  ons("Target.detachedFromTarget", receiveMessage);

  if ( DEBUG.coords ) {
    ons("Page.frameNavigated", async ({message, sessionId}) => {
      const dimensions = await send("Page.getLayoutMetrics", {}, sessionId);
      console.log({dimensions});
    });
  }

  await send(
    "Browser.grantPermissions", 
    {
      permissions: GrantedPermissions
    }
  );
  
  function sendFrameToClient({message, sessionId}) {
    const {sessionId: castSessionId, data, metadata} = message.params;
    const {timestamp} = metadata;
    const {frameId} = updateCast(sessionId, {castSessionId}, 'frame');

    if ( !sessions.has(sessionId) ) return;

    if ( timestamp <= latestTimestamp ) {
      DEBUG.logCastOutOfOrderFrames && console.warn(
        `Frame ${frameId} is from earlier than a prior frame. Dropping frame`,
        {delta:(-latestTimestamp+timestamp)}
      );
      // ack it so we keep up the pace
      if ( ! sessionId ) {
        console.warn(`1 No sessionId for screencast ack`);
      }
      setTimeout(() => send("Page.screencastFrameAck", {sessionId: frameId}, sessionId), 5);
      return;
    }
    latestTimestamp = timestamp;

    const targetId = sessions.get(sessionId);
    const frame = Buffer.from(data, 'base64');
    const header = Buffer.alloc(28);
    //DEBUG.debugCast && console.log({writing:{castSessionId,frameId}});
    header.writeUInt32LE(castSessionId, 0);
    header.writeUInt32LE(frameId, 4);
    header.writeUInt32LE(parseInt(targetId.slice(0,8), 16), 8);
    header.writeUInt32LE(parseInt(targetId.slice(8,16), 16), 12);
    header.writeUInt32LE(parseInt(targetId.slice(16,24), 16), 16);
    header.writeUInt32LE(parseInt(targetId.slice(24,32), 16), 20);
    const imgBuf = Buffer.concat([header,frame]);
    for ( const {ack, fastest, peer, socket, connectionId} of connection.links.values() ) {
      /* here connectionId is a unique id for connection to browser-frontend client */
      const channel = fastest ? fastest : (socket || peer);
      if ( DEBUG.sendFramesWhenTheyArrive && ack.count ) {
        if ( ack.received || DEBUG.sendImmediate ) {
          connection.so(channel, imgBuf);
          ack.received = false;
          ack.count--;
          if ( ack.count < 0 ) ack.count = 0;
          DEBUG.adaptiveImagery && ack.sent.set(frameId, Date.now());
          if ( DEBUG.chooseFastest && DEBUG.useWebRTC && socket && peer ) {
            const choice = Math.random() >= RACE_SAMPLE;
            if ( choice ) {
              const otherChannel = channel === peer ? socket : peer;
              connection.so(otherChannel, imgBuf);
              DEBUG.logFastest && console.log('Race started');
            }
          }
        } 
      } else {
        ack.buffer.unshift([imgBuf, frameId]);
        if ( ack.buffer.length > MAX_ACK_BUFFER ) {
          ack.buffer.length = MAX_ACK_BUFFER;
        }
      }
    }
  }

  async function beginDownload(dl) {
    try {
      DEBUG.debugDownloads && console.log({dl});
      const {suggestedFilename, guid, url: dlURL} = dl;
      const downloadFileName = suggestedFilename || getFileFromURL(dlURL);
      const download = {suggestedFilename, guid, url: dlURL};
      download.filename = downloadFileName;

      DEBUG.val && console.log({download});
      DEBUG.val && console.log({suggestedFilename});

      // notification
        connection.meta.push({download});
        connection.lastDownloadFileName = downloadFileName;

      // do only once
      if ( connection.lastDownloadGUID == download.guid ) return;
      connection.lastDownloadGUID = download.guid;

      // logging 
        DEBUG.val > DEBUG.med && console.log({downloadFileName,SECURE_VIEW_SCRIPT,username});

      const ext = downloadFileName.split('.').pop();
      const guidFile = path.resolve(DownloadPath, guid);
      const originalFile = path.resolve(DownloadPath, downloadFileName); 
      let isGuidFile = false;

      await untilTrue(() => isGuidFile = fs.existsSync(guidFile), 150, 40);

      if ( isGuidFile ) {
        try {
          fs.linkSync(guidFile, originalFile);
        } catch(e) {
          DEBUG.showFlash && console.info(`Could not create link from guid file`, e);
        } finally {
          try {
            fs.unlinkSync(guidFile);
          } catch {
            console.warn(`Could not delete guid file`, guidFile, downloadFileName);
          }
        }
      } else {
        await untilTrue(() => fs.existsSync(originalFile), 150, 40);
      }

      if ( FLASH_FORMATS.has(ext) ) {
        DEBUG.showFlash && console.log('Got a flash file', downloadFileName, download);
        const url = `${getInjectableAssetPath()}/flash-player.html?url=${
          encodeURIComponent(`${
            getInjectableAssetPath()
          }/flash/${
            downloadFileName
          }`)}&downloadFileName=${
            encodeURIComponent(downloadFileName)
        }&ran=${Math.random()}`;
        const flashplayer = {url};
        connection.meta.push({flashplayer});
        DEBUG.val > DEBUG.med && console.log("Send secure view", flashplayer);
        DEBUG.showFlash && console.log("Send flash player", flashplayer);

        const linkToFile = path.resolve(APP_ROOT, 'public', 'assets', 'flash', downloadFileName);
        try {
          fs.linkSync(originalFile, linkToFile); 
        } catch(e) {
          DEBUG.showFlash && console.info(`Could not create link`, e);
        }
      } else {
        console.log({docViewerSecret, SECURE_VIEW_SCRIPT});
        const subshell = spawn(
          SECURE_VIEW_SCRIPT, 
          [username, `${originalFile}`, docViewerSecret]
        );
        let uri = '';
        let done = false;

        // subshell collect data and send once
          subshell.stderr.on('data', data => {
            console.warn('secure view script err:', data.toString());
          });
          subshell.stdout.on('data', data => {
            uri += data;
            console.log('secure view script data (uri):', uri);
          });
          subshell.on('error', x => {
            console.warn('secure view script error event:', x);
          });
          subshell.stdout.on('end', sendURL);
          subshell.on('close', sendURL);
          subshell.on('exit', sendURL);

        function sendURL(code) {
          const url = uri ? uri.trim() : "";

          if ( ! uri || url.length == 0 ) {
            console.warn("No URI", downloadFileName, uri, url);
            //throw new Error( "No URI" );
            return;
          }

          if ( code == 0 ) {
            // only do once
            if ( done ) return;
            done = true;
            connection.lastSentFileName = connection.lastDownloadFileName;

            // trim any whitespace added by the shell echo in the script
            const secureview = {url};
            DEBUG.val > DEBUG.med && console.log("Send secure view", secureview);
            connection.meta.push({secureview});
          } else if ( code == undefined ) {
            console.log(`No code. Probably STDOUT end event.`, url);

            // only do once
            if ( done ) return;
            done = true;
            connection.lastSentFileName = connection.lastDownloadFileName;

            // trim any whitespace added by the shell echo in the script
            const secureview = {url};
            DEBUG.val > DEBUG.med && console.log("Send secure view", secureview);
            console.log("Send secure view", secureview);
            connection.meta.push({secureview});
          } else {
            console.warn(`Secure View subshell exited with code ${code}`);
          }
        }
      }
    } catch(e) {
      console.warn(e);
    }
  }

  async function progressDownload({receivedBytes, totalBytes, guid, state}) {
    try {
      const amountToAddToServerData = Math.max(receivedBytes, totalBytes, 1);
      
      if ( Number.isInteger(amountToAddToServerData) ) {
        connection.totalBandwidth += amountToAddToServerData;
      }
      connection.meta.push({dl_progress:{receivedBytes, totalBytes, guid, state}});
    } catch(e) {
      console.warn(e);
    }
  }

  async function receiveMessage({message, sessionId}) {
    if ( message.method == "Network.dataReceived" ) {
      const {encodedDataLength, dataLength} = message.params;
      connection.totalBandwidth += (encodedDataLength || dataLength);
    } else if ( message.method == "Target.detachedFromTarget" ) {
      const {targetId} = message.params;
      removeSession(targetId);
      const sessionId = sessions.get(targetId);
      if ( connection.activeTarget === targetId ) {
        connection.activeTarget = null;
      }
      connection.meta.push({detached:message.params});
    } else if ( message.method == "Runtime.bindingCalled" ) {
      const {name, executionContextId} = message.params;
      let {payload} = message.params;
      try {
        payload = JSON.parse(payload);
      } catch(e) {console.warn(e)}

      let response;
      if ( !!payload.method && !! payload.params ) {
        payload.name = payload.method;
        payload.params.sessionId = sessionId;
        response = await sessionSend(payload);
      }
      DEBUG.val >= DEBUG.med && console.log(JSON.stringify({bindingCalled:{name,payload,response,executionContextId}}));
      await send(
        "Runtime.evaluate", 
        {
          expression: `self.instructZombie.onmessage(${JSON.stringify({response})})`,
          contextId: executionContextId,
          awaitPromise: true
        },
        sessionId
      );
    } else if ( message.method == "Runtime.consoleAPICalled" ) {
      const consoleMessage = message.params;
      const {type,args,executionContextId} = consoleMessage;

      const logMessages = args.map(convertRemoteObjectToString);

      try {
        DEBUG.val && console.log("Runtime.consoleAPICalled",
          {executionContextId}, 
          {logMessageCount:logMessages.length}, 
          {type},
          JSON.stringify(logMessages).slice(0,255)
        );
      } catch(e) {
        console.warn("Could not show messages from console API");
        DEBUG.val && console.log(args);
      }

      if ( ! args.length ) return;

      const activeContexts = connection.worlds.get(connection.sessionId);
      DEBUG.val > DEBUG.low && console.log(`Active context`, activeContexts);
      // security note:
        // we should check this so people can spam us with messages
        // but there may be some things we need to send from page context. in that case
        // perhaps we ought to send them from 'binding' 
        /*if ( ! activeContexts || ! activeContexts.has(executionContextId) ) {
          DEBUG.val && console.log(`Blocking as is not a context in the active target.`);
          return;
        }*/

      message = consoleMessage;
      const firstArg = args[0];
      if ( DEBUG.debugConsoleMessages ) {
        const {type, args} = message;
        const argVals = args.map(({value, className, subtype, description}) => {
          if ( value === undefined ) {
            return `${description} ${subtype ? `(${subtype})` : ''}`;
          }
          return value;
        })
        console.group(`Remote console message (context: ${executionContextId})`);
        try {
          console[type](...argVals);
        } catch(e) {
          console.log(...argVals);
        }
        console.groupEnd();
      }
      if( firstArg.value ) {
        try {
          // we only accept JSON messages
          const Message = JSON.parse(firstArg.value);
          Message.executionContextId = executionContextId;
          if ( Message.favicon ) {
            const {faviconDataUrl, faviconURL, targetId} = Message.favicon;
            const oldUrl = favicons.get(targetId);
            if ( faviconDataUrl ) {
              if ( oldUrl !== faviconDataUrl ) {
                favicons.set(targetId, faviconDataUrl);
                connection.meta.push(Message);
                DEBUG.debugFavicon && console.log(`FROM PAGE: Setting favicon for ${targetId}`, {Message});
              }
            } else if ( faviconURL?.startsWith?.('http') ) {
              if ( favicons.has(faviconURL) ) {
                const faviconDataUrl = favicons.get(faviconURL);
                if ( oldUrl !== faviconDataUrl ) {
                  favicons.set(targetId, faviconDataUrl);
                  const Message = {favicon:{targetId, faviconDataUrl}, executionContextId};
                  connection.meta.push(Message);
                  DEBUG.debugFavicon && console.log(`FROM SERVER CACHE (from FETCH): Setting favicon for ${targetId}`, {Message});
                }
              } else {
                (DEBUG.val > DEBUG.high) && console.warn(
                  `Should probably be using CURL for this as we can easily replicate all headers
                  alternately we create a fetch request that replicates all headers from the browser.
                  We can save these headers from a network request. Tho this is complex. But it's the best way.`
                );
                DEBUG.debugFavicon && console.info(`Will send request for supposed favicon at url: ${faviconURL}`);
                fetch(faviconURL, {
                  method: 'GET',
                  cache: 'force-cache',
                  headers: {
                    'user-agent': connection.navigator.userAgent
                  }
                }).then(resp => {
                  if ( resp.ok ) {
                    const contentType = resp.headers.get('content-type');
                    DEBUG.debugFavicon && console.log("resp", contentType, resp);
                    if ( contentType?.startsWith('image') ) {
                      try {
                        resp.arrayBuffer().then(buf => {
                          const faviconDataUrl = `data:${contentType};base64,${
                            Buffer.from(buf).toString('base64')
                          }`;
                          favicons.set(faviconURL, faviconDataUrl);
                          if ( oldUrl !== faviconDataUrl ) {
                            favicons.set(targetId, faviconDataUrl);
                            const Message = {favicon:{targetId, faviconDataUrl}, executionContextId};
                            connection.meta.push(Message);
                            DEBUG.debugFavicon && console.log(`FROM FETCH: Setting favicon for ${targetId}`, {Message});
                          }
                        });
                      } catch(e) {
                        console.warn('favicon', e);
                      }
                    } else {
                      DEBUG.debugFavicon && console.warn(`Supposed favicon had incorrect content type: ${contentType}`);
                    }
                  }
                }).catch(err => {
                  console.warn('favicon get err', Message, err);
                });
              }
            }
          } else {
            connection.meta.push(Message);
          }
        } catch(e) {
          DEBUG.debugFavicon && firstArg.type === 'string' && firstArg.value.includes('favicon') &&
            console.log(`Error in favicon message`, e, message);
          DEBUG.val > DEBUG.med && console.log('console message err', e, message);
        }
      }
      DEBUG.val > DEBUG.med && connection.meta.push({consoleMessage});
    } else if ( message.method == "Runtime.executionContextCreated" ) {
      DEBUG.val && console.log(JSON.stringify({createdContext:message.params.context}));
      const {name:worldName, id:contextId} = message.params.context;
      addContext(sessionId,contextId);
      if ( worldName == WorldName ) {
        SetupTabs.set(sessionId, {worldName});
        await send(
          "Runtime.addBinding", 
          {
            name: "instructZombie",
            executionContextId: contextId
          },
          sessionId
        );
      } else if ( DEBUG.manuallyInjectIntoEveryCreatedContext && SetupTabs.get(sessionId)?.worldName !== WorldName ) {
        /*
        const targetId = sessions.get(sessionId);
        const expression = saveTargetIdAsGlobal(targetId) + manualInjectionsScroll;
        const resp = await send("Runtime.evaluate", {
          contextId,
          expression
        }, sessionId);
        DEBUG.val && console.log({resp,contextId});
        */
      }
    } else if ( message.method == "Runtime.executionContextDestroyed" ) {
      const contextId = message.params.executionContextId;
      deleteContext(sessionId, contextId);
    } else if ( message.method == "Runtime.executionContextsCleared" ) {
      DEBUG.val > DEBUG.med && console.log("Execution contexts cleared");
      deleteWorld(sessionId);
    } else if ( message.method == "LayerTree.layerPainted" ) {
      if ( !DEBUG.screenCastOnly ) connection.doShot();
    } else if ( message.method == "Page.javascriptDialogOpening" ) {
      const {params:modal} = message;
      modal.sessionId = sessionId;
      (DEBUG.val || DEBUG.debugModals ) && console.log(JSON.stringify({modal}));
      connection.meta.push({modal});
      connection.vmPaused = true;
      connection.modal = modal;
    } else if ( message.method == "Page.frameNavigated" ) {
      const {url, securityOrigin, unreachableUrl, parentId} = message.params.frame;
      const topFrame = !parentId;
      if ( !!topFrame && (!! url || !! unreachableUrl) ) {
        clearLoading(sessionId);
        const targetId = sessions.get(sessionId);
        if ( checkSetup.has(targetId) ) {
          // we could check this in a couple ms to see if we still have check setup and 
          // if so we might need another reload
          DEBUG.worldDebug && consolelog('Reloaded ?', targetId)
          const obj = checkSetup.get(targetId);
          DEBUG.worldDebug && consolelog(obj);
          obj.checking = false;
        }
        const navigated = {
          targetId,
          topFrame,
          url, unreachableUrl
        };

        favicons.delete(targetId);
        DEBUG.debugFavicon && console.log(`Deleted favicon for targetId ${targetId} upon navigation`);

        connection.meta.push({favicon: {useDefaultFavicon: true}});
        connection.meta.push({navigated});
        // this is strangely necessary to not avoid the situation where the layer tree is not updated
        // on page navigation, meaning that layerPainted events stop firing after a couple of navigations
        /*
        await send(
          "LayerTree.enable", 
          {},
          sessionId
        );
        */
        //connection.doShot();
      }
      /**
        // we now do this once for browser, rather than the same thing for every origin
        if ( ! unreachableUrl && securityOrigin || url ) {
          const origin = securityOrigin || new URL(url).origin;
          console.log('granting', GrantedPermissions, origin);
          const resp = await send(
            "Browser.grantPermissions", 
            {
              permissions: GrantedPermissions
            }
          );
          DEBUG.val && console.log('grantPermissions resp', {resp});
          await send(
            "Emulation.setGeolocationOverride",
            {
              latitude: Area51Lat, longitude: Area51Long, accuracy: 5
            },
            sessionId
          );
        }
      **/
    } else if ( message.method == "Page.fileChooserOpened" ) {
      const {mode,backendNodeId} = message.params;
      const fileChooser = {mode, sessionId};

      DEBUG.val && console.log('file chooser', message);

      fileChoosers.set(sessionId, backendNodeId);

      DEBUG.val > DEBUG.med && console.log(fileChooser, message);

      try {
        const {node:{attributes:fileInputAttributes}} = await send("DOM.describeNode", {
          backendNodeId
        }, sessionId);

        if ( fileInputAttributes ) {
          for( let i = 0; i < fileInputAttributes.length; i++ ) {
            if ( fileInputAttributes[i] == "accept" ) {
              fileChooser.accept = fileInputAttributes[i+1];
              break;
            }
          }
        }
      } catch(e) {
        console.info(`Error getting FileInput.accept attribute by describing backend node from id`, e, fileChooser)
      }

      fileChooser.csrfToken = LatestCSRFToken;

      DEBUG.val && console.log('notify client', fileChooser);
      connection.meta.push({fileChooser});
    } else if ( message.method == "Network.requestWillBeSent" ) {
      const resource = startLoading(sessionId);
      const {requestId,frameId, request:{url}} = message.params;
      if ( requestId && frameId ) {
        Frames.set(requestId,{url,frameId});
      }
      connection.meta.push({resource}); 
    } else if ( message.method == "Network.requestServedFromCache" ) {
      const resource = endLoading(sessionId);
      const {requestId} = message.params;
      connection.meta.push({resource}); 
      setTimeout(() => Frames.delete(requestId), WAIT_FOR_COALESCED_NETWORK_EVENTS);
    } else if ( message.method == "Network.loadingFinished" ) {
      const resource = endLoading(sessionId);
      const {requestId} = message.params;
      connection.meta.push({resource}); 
      setTimeout(() => Frames.delete(requestId), WAIT_FOR_COALESCED_NETWORK_EVENTS);
    } else if ( message.method == "Network.loadingFailed" ) {
      const resource = endLoading(sessionId);
      const {requestId} = message.params;
      const savedFrame = Frames.get(requestId)
      DEBUG.fontDebug && message.params.type == 'Font' && console.log({message, savedFrame});
      if ( savedFrame ) {
        const {url: url = '',frameId} = savedFrame;

        if ( message.params.type == "Document" ) {
          const someFileName = getFileFromURL(url);

          message.frameId = frameId;
          DEBUG.val && console.log({failedURL:url});
          if ( !(url.startsWith('http')) ) {
            const modal = {
              type: 'intentPrompt',
              title: 'External App Request',
              message: `This page is asking to open an external app via URL: ${
                url.slice(0, 140) + (url.length > 140 ? '...' : '')
              }`,
              url
            };
            DEBUG.val && console.log(JSON.stringify({modal},null,2));
            const now = Date.now();
            const delta = now - (connection.lastIntentPromptAt || 0);
            if ( DEBUG.throttleIntentPrompts && delta < INTENT_PROMPT_THRESHOLD ) {
              console.log(`Dropping intent prompt because it is more frequent than ${
                INTENT_PROMPT_THRESHOLD
              }ms`);
            } else {
              connection.lastIntentPromptAt = now;
              connection.meta.push({modal});
            }
          } else {
            setTimeout(() => {
              if ( someFileName == connection.lastDownloadFileName ) {
                // this is not a failure 
                DEBUG.val && console.log({expectDownload:someFileName});
              } else {
                connection.meta.push({failed:message});
                DEBUG.val && console.log({failed:message});
              }
            }, WAIT_FOR_DOWNLOAD_BEGIN_DELAY );
          }
        }

        connection.meta.push({resource}); 
        setTimeout(() => Frames.delete(requestId), WAIT_FOR_COALESCED_NETWORK_EVENTS);
      } else {
        DEBUG.val && console.warn(`No url or frameId saved for requestId: ${requestId}`);
      }
    } else if ( message.method == "Network.responseReceived" ) {
      const resource = endLoading(sessionId);
      connection.meta.push({resource}); 
    } else if ( message.method == "Runtime.exceptionThrown" ) {
      (DEBUG.val || DEBUG.debugConsoleMessages) && console.log(JSON.stringify({exception:message.params}, null,2));
    } else if ( message.method == "Fetch.requestPaused" ) {
      DEBUG.fontDebug && message.params.resourceType == 'Font' && console.log({paused:message});
      //newtabIntercept({sessionId, message}, Target);
      if ( AD_BLOCK_ON ) { 
        await adBlockIntercept({sessionId, message}, connection.zombie);
      }
    } else if ( message.method == "Fetch.authRequired" ) {
      const {requestId, request, /*frameId, */ resourceType, authChallenge} = message.params;
      connection.pausing.set(requestId, request.url);
      connection.pausing.set(request.url, requestId);
      const authRequired = {authChallenge, requestId, resourceType};
      (DEBUG.debugAuth || DEBUG.val) && console.log({authRequired});
      connection.meta.push({authRequired});
    } else if ( message.method && ( message.method.startsWith("LayerTree") || message.method.startsWith("Page") || message.method.startsWith("Network")) ) {
      // ignore
    } else { 
      console.warn("Unknown message from target", message);
    }
  }

  return connection;

  async function setupTab({attached}) {
    const {waitingForDebugger, sessionId, targetInfo} = attached;
    const {targetId} = targetInfo;
    DEBUG.attachImmediately && DEBUG.worldDebug && console.log({waitingForDebugger, targetInfo});
    try {
      DEBUG.val && console.log(sessionId, targetId, 'setting up');

      ! DEBUG.legacyShots && await send("HeadlessExperimental.enable", {}, sessionId);

      if ( ! loadings.has(sessionId) ) {
        const loading = {waiting:0, complete:0,targetId}
        loadings.set(sessionId,loading);
      }

      await send(
        "Emulation.setGeolocationOverride",
        {
          latitude: Area51Lat, longitude: Area51Long, accuracy: 5
        },
        sessionId
      );
      await send("Network.enable", {}, sessionId);
      await send("Network.setBlockedURLs", {
          urls: [
            "file://*",
          ]
        },
        sessionId
      )
      await send(
        "Emulation.setUserAgentOverride", 
        connection.navigator,
        sessionId
      );
      await send(
        "Security.setIgnoreCertificateErrors",
        {
          ignore: DEBUG.ignoreCertificateErrors
        },
        sessionId
      );
      if ( AD_BLOCK_ON ) {
        await send("Fetch.enable",{
            handleAuthRequests: true,
            patterns: [
              {
                urlPattern: 'http://*/*',
                requestStage: "Response"
              },
              {
                urlPattern: 'https://*/*',
                requestStage: "Response"
              },
              {
                urlPattern: 'http://*/*',
                requestStage: "Request"
              },
              {
                urlPattern: 'https://*/*',
                requestStage: "Request"
              }
            ],
          },
          sessionId
        );
      }
      await send(
        "Emulation.setAutoDarkModeOverride",
        {
          enabled: CONFIG.darkMode
        },
        sessionId
      );
      await send(
        "Emulation.setEmulatedMedia",
        {
          media: 'screen',
          features: [
            {
              name: 'prefers-color-scheme',
              value: CONFIG.darkMode ? 'dark' : 'light'
            }
          ]
        },
        sessionId
      );
      await send(
        "Emulation.setDefaultBackgroundColorOverride",
        {
          color: { r: 120, g: 120, b: 120, a: 0.8 }
        },
        sessionId
      );

      await send("Page.enable", {}, sessionId);

      if ( CONFIG.screencastOnly ) {
        const castInfo = casts.get(targetId);
        if ( !castInfo || ! castInfo.castSessionId ) {
          updateCast(sessionId, {started:true}, 'start');
          DEBUG.shotDebug && console.log("SCREENCAST", SCREEN_OPTS);
          await send("Page.startScreencast", SCREEN_OPTS, sessionId);
        } else {
          if ( ! sessionId ) {
            console.warn(`2 No sessionId for screencast ack`);
          }
          await send("Page.screencastFrameAck", {
            sessionId: castInfo.castSessionId
          }, sessionId);
        }
      }

      if ( DEBUG.useFlashEmu ) {
        await send("Page.setBypassCSP", {enabled: true}, sessionId);
      }

      DEBUG.val && console.log('Enabling file chooser interception for session', sessionId);

      await send("Page.setInterceptFileChooserDialog", {
        enabled: true
      }, sessionId);
      await send(
        "DOMSnapshot.enable", 
        {},
        sessionId
      );
      await send(
        "Runtime.enable", 
        {},
        sessionId
      );
      // Page context injection (to set values in the page's original JS execution context
        let templatedInjectionsScroll = '';
        // Flash emulation injection
        if ( DEBUG.useFlashEmu ) {
          const injectableAssetPath = getInjectableAssetPath();
          const flashEmuScript = templatedInjections.flashEmu.default({
            injectableAssetPath
          });
          templatedInjectionsScroll += flashEmuScript;
        }
        await send(
          "Page.addScriptToEvaluateOnNewDocument",
          {
            // NOTE: NO world name to use the Page context
            source: pageContextInjectionsScroll + templatedInjectionsScroll
          },
          sessionId
        );
      // Isolated world injection
        let modeInjectionScroll = '';
        if ( connection.plugins.appminifier ) {
          modeInjectionScroll += appMinifier;
        } 
        if ( connection.plugins.projector ) {
          modeInjectionScroll += projector;
        }
        await send(
          "Page.addScriptToEvaluateOnNewDocument", 
          {
            source: [
              saveTargetIdAsGlobal(targetId),
              injectionsScroll,
              modeInjectionScroll
            ].join(''),
            worldName: WorldName
          },
          sessionId
        );
      await send(
        "Emulation.setDeviceMetricsOverride", 
        Object.assign({
          mobile: connection.isMobile ? true : false
        }, connection.bounds),
        sessionId
      );
      await send(
        "Emulation.setScrollbarsHidden",
        {hidden:connection.hideBars || false},
        sessionId
      );
      const {windowId} = await send("Browser.getWindowForTarget", {targetId});
      connection.latestWindowId = windowId;
      const {width,height} = connection.bounds;
      await send("Browser.setWindowBounds", {bounds:{width,height},windowId})
      //id = await overrideNewtab(connection.zombie, sessionId, id);
      if ( AD_BLOCK_ON ) {
        await blockAds(/*connection.zombie, sessionId*/);
      } else if ( DEMO_BLOCK_ON ) {
        console.warn("Demo block disabled.");
        //await blockSites(connection.zombie, sessionId);
      }
      await send(
        "LayerTree.enable", 
        {},
        sessionId
      );
      if ( waitingForDebugger ) {
        await send("Runtime.runIfWaitingForDebugger", {}, sessionId);
      }
      const obj = checkSetup.get(targetId)
      if ( obj ) {
        if ( obj.needsReload ) {
          DEBUG.worldDebug && consolelog('Reloading', targetId);
          obj.needsReload = false; 
          await send("Page.reload", {}, sessionId);
          obj.checking = false;
        } 
        obj.tabSetup = true;
      } else {
        console.warn(`No checsetup entry at end of setuptab`, targetId);
      }
    } catch(e) {
      console.warn("Error setting up", e, targetId, sessionId);
    }
  }

  function updateCast(sessionId, castUpdate, event) {
    const targetId = sessions.get(sessionId);
    let castInfo = casts.get(targetId);

    if ( event === 'start' ) {
      DEBUG.debugCast && console.log(`Screencast info udpate on event: ${event} -- `, targetId, sessionId, castInfo);
    } else if ( event === 'frame' ) {
      /*
      DEBUG.debugCast && connection.latestCastId !== castUpdate.castSessionId && console.info(`
        We are changing the connection.latestCastId from ${
          connection.latestCastId
        } to ${
          castUpdate.castSessionId
      }`);
      */
      connection.latestCastId = castUpdate.castSessionId;
    } else if ( event === 'stop' ) {
      connection.latestCastId = null;
    }
    if ( ! castInfo ) {
      GlobalFrameId++;
      castInfo = {};
      Object.defineProperty(castInfo, 'frameId', {
        get: () => GlobalFrameId
      });
      casts.set(targetId, castInfo);
      DEBUG.debugCast && console.info(`Creating castInfo for target: ${targetId}`);
    } else {
      if ( event !== 'start' && 
          castInfo.castSessionId && castUpdate.castSessionId !== castInfo.castSessionId
        ) {
          DEBUG.debugCast && console.info(`Screencast info on event: ${event} -- ${
              castInfo.started ? '[normal ~ cast running]' : '[not normal ~ no cast running]'
            }: we are updating the cast session id for target ${targetId}, from ${
              castInfo.castSessionId 
            } to ${
              castUpdate.castSessionId
          }`);
      }
      if ( castUpdate.castSessionId ) {
        let {sessions} = castInfo;
        if ( ! sessions ) {
          sessions = castInfo.sessions = new Set();
        }
        sessions.add(castUpdate.castSessionId);
      }
      if ( castUpdate.started === false ) {
        let {sessions} = castInfo;
        if ( ! sessions || ! sessions.has(castUpdate.castSessionId) ) {
          DEBUG.debugCast && console.warn(`Screencast info on event: ${
            event
          } -- [not normal]: we are stopping a cast session (${
            castUpdate.castSessionId
          }) but we have no record of this session having started.`);
          if ( ! sessions ) {
            sessions = castInfo.sessions = new Set();
          }
        }
        sessions.delete(castInfo.castSessionId); 
        DEBUG.debugCast && console.info(`We are deleting the latest castSessionId ${
            castInfo.castSessionId
          } from our cast sessions set. We HOPE and assume it is the ONLY cast running for targetId ${
            targetId
        }`);
      }
    }
    Object.assign(castInfo, castUpdate);
    if ( castInfo.started === false ) {
      //castInfo.castSessionId = null;
    }
    if ( event === 'frame' ) {
      GlobalFrameId++;
    } else if ( event === 'stop' ) {
      DEBUG.debugCast && console.log(`Screencast info udpate on event: ${event} -- `, targetId, castInfo);
    } else if ( event === 'start' && ! castInfo.started ) {
      GlobalFrameId++;
    }
    return castInfo;
  }

  async function sessionSend(command) {
    /* here connection is a connection to a browser backend */
    const that = this || connection;
    let sessionId;
    const {connectionId} = command;
    command.connectionId = null;
    const {targetId} = command.params;
    // FIXME: I want THIS kind of debug. Cool.
    //DEBUG.has("commands") && console.log(JSON.stringify(command));
    // NOTE POSSIBLE BUG: MOVED this ABOVE below block
    // BEFORE IT WAS AFTER Network.set....ide"
      if ( !! targetId && !targets.has(targetId) ) {
        DEBUG.val && console.log("Blocking as target does not exist.", targetId);
        return {};
      }
    switch( command.name ) {
      case "Page.navigate": {
        let {url} = command.params;

        url = url.trim();

        if ( url.startsWith("file:") || isFileURL(url) ) {
          console.log("Blocking file navigation");
          return {};
        } else if ( url.startsWith("vbscript:") ) {
          console.log("Blocking vbscript protocol url");
          return {};
        } else if ( url.startsWith("javascript:") ) {
          console.log("Blocking javascript protocol url");
          return {};
        } else if ( url.startsWith("data:text/html") ) {
          console.log("Blocking HTML data URL");
          return {};
        }
      }; break;
      case "Browser.getWindowForTarget": {
        if ( !command.params.targetId ) {
          command.params.targetId = connection.hiddenTargetId;
        }
      }; break;
      case "Browser.setWindowBounds": {
        /* if the client has not requested we resize to their viewport
         we only move a bound if it's smaller than existing
         This ensures that the default behaviour is to let the remote
         browser viewport fit in everyone's screen
         This can be escaped by resetRequested
        */

        DEBUG.debugViewportDimensions && console.log('Command', command);
        if ( connectionId ) {
          connection.viewports.set(connectionId, Object.assign(connection.viewports.get(connectionId) || {}, command.params.bounds));
          if ( command.params.windowId ) {
            connection.latestWindowId = command.params.windowId;
          }
          DEBUG.debugViewportDimensions && console.log('Viewports', connection.viewports);
        }
        const viewport = getViewport(...connection.viewports.values());
        DEBUG.debugViewportDimensions && console.log('Common viewport', viewport);
        if ( ! command.params.resetRequested ) {
          const {width, height} = viewport;
          Object.assign(command.params.bounds, {width, height});
        } else {
          // don't send our custom flag through to the browser
          ensureMinBounds(command.params.bounds);
        }
        delete command.params.bounds.resetRequested;
        Object.assign(connection.bounds, command.params.bounds);
        SCREEN_OPTS.maxWidth = connection.bounds.width;
        SCREEN_OPTS.maxHeight = connection.bounds.height;
        DEBUG.debugViewportDimensions && console.log("Screen opts at set window bounds", SCREEN_OPTS);
        DEBUG.debugViewportDimensions && console.log('Connection bounds', connection.bounds);

        const thisChange = JSON.stringify(command.params,null,2);
        const changes = lastWChange !== thisChange;
        DEBUG.showViewportChanges && console.log({lastWChange, thisChange});
        if ( changes ) {
          lastWChange = thisChange;
          setTimeout(() => connection.restartCast(), 0);
        } else {
          return {};
        }
      }; break;
      case "Emulation.setDeviceMetricsOverride": {
        /* if the client has not request we resize to their viewport
         we only move a bound if it's smaller than existing
         This ensures that the default behaviour is to let the remote
         browser viewport fit in everyone's screen
         This can be escaped by resetRequested
        */

        DEBUG.debugViewportDimensions && console.log('Command', command);
        if ( connectionId ) {
          connection.viewports.set(connectionId, Object.assign(connection.viewports.get(connectionId) || {}, command.params));
          DEBUG.debugViewportDimensions && console.log('Viewports', connection.viewports);
        }
        const viewport = getViewport(...connection.viewports.values());
        DEBUG.debugViewportDimensions && console.log('Common viewport', viewport);
        if ( ! command.params.resetRequested ) {
          Object.assign(command.params, viewport);
        } else {
          // don't send our custom flag through to the browser
          ensureMinBounds(command.params);
        }
        delete command.params.resetRequested;
        command.params.mobile = connection.isMobile ? true : false;
        Object.assign(connection.bounds, command.params);
        SCREEN_OPTS.maxWidth = connection.bounds.width;
        SCREEN_OPTS.maxHeight = connection.bounds.height;
        if ( command.params.deviceScaleFactor ) {
          DEVICE_FEATURES.deviceScaleFactor = command.params.deviceScaleFactor;
        } 
        if ( command.params.mobile ) {
          DEVICE_FEATURES.mobile = command.params.mobile;
        } 
        DEBUG.debugViewportDimensions && console.log("Screen opts at device metric override", SCREEN_OPTS);
        DEBUG.debugViewportDimensions && console.log('Connection bounds', connection.bounds);

        DEBUG.showTodos && console.log(`Make V Changes sessionId linked (issue #351)`);
        const thisChange = JSON.stringify(command.params,null,2)+(command.params.sessionId||command.sessionId||that.sessionId);
        const changes = lastVChange !== thisChange;
        DEBUG.showViewportChanges && console.log({lastVChange, thisChange});
        if ( changes ) {
          lastVChange = thisChange;
          setTimeout(() => connection.restartCast(), 0);
        } else {
          return {};
        }
      }; break;
      case "Emulation.setScrollbarsHidden": {
        DEBUG.scrollbars && console.log("setting scrollbars 'hideBars'", command.params.hidden);
        connection.hideBars = command.params.hidden;
      }; break;
      case "Emulation.setUserAgentOverride": {
        let changed = false;
        //connection.navigator.platform = command.params.platform;
        //connection.navigator.userAgent = command.params.userAgent;
        //command.params.userAgent = connection.navigator.userAgent;
        //command.params.platform = connection.navigator.platform;

        command.params.userAgent = connection.isMobile ? mobUA : deskUA;
        command.params.platform = connection.isMobile ? mobPLAT : deskPLAT;

        connection.navigator.platform = command.params.platform;

        changed = connection.navigator.userAgent !== command.params.userAgent;

        connection.navigator.userAgent = command.params.userAgent;
        connection.navigator.acceptLanguage = command.params.acceptLanguage;

        if ( changed ) {
          command.needsReload = true;
        }
      }; break;
      case "Target.createTarget": {
        if ( (sessions.size/2 + 1) > MAX_TABS ) {
          DEBUG.val && console.warn(`Blocking as TabCount > MAX_TABS`); 
          return {error: `Too many tabs`};
        } 
        if ( command.params.source ) {
          if ( !DEBUG.worldDebug && command.params.source === firstSource && 
              !DEBUG.enableClientsToSetURL ) {
            console.log("Blocking as only first sourced navigation is intended.");
            return {};
          } else if ( ! firstSource ) {
            firstSource = command.params.source;
          }
          delete command.params.source;
        }
        DEBUG.val && console.log(`Create. Tabs: ${sessions.size/2}`);
      }; break;
      case "Target.closeTarget": {
        targets.delete(targetId);
        tabs.delete(targetId);
        const tSessionId = sessions.get(targetId);
        if ( sessions.get(that.sessionId) == targetId ) {
          that.sessionId = null;
        }
        if ( that.activeTarget === targetId ) {
          that.activeTarget = null;
        }
        removeSession(targetId);
        DEBUG.val && console.log(`Close. Tabs: ${sessions.size/2}`);
        if ( tSessionId ) {
          DEBUG.val > DEBUG.med && console.log("Received close. Will send detach first.");
          // FIX NOTE: these sleeps (have not test ms sensitivity, maybe we could go lower), FIX issue #130
          // in other words, they prevent the seg fault crash on Target.closeTarget we get sometimes
          await sleep(300);
          await send("Target.detachFromTarget", {sessionId:tSessionId});
          await sleep(300);
        }
      }; break;
      case "Fetch.continueWithAuth": {
        const {requestId} = command.params;
        const url = connection.pausing.get(requestId);
        DEBUG.debugAuth && console.log({auth:{url,command}})
        connection.pausing.delete(requestId);
        connection.pausing.delete(url);
      }; break;
      case "Page.handleJavaScriptDialog": {
        connection.vmPaused = false;
        DEBUG.debugModals && console.log({command});
        command.requiresTask = () => {
          connection.modal = null;
          connection.meta.push({vm:{paused:false}});
        };
      }; break;
    }

    if ( !command.name.startsWith("Target") && !(command.name.startsWith("Browser") && command.name != "Browser.getWindowForTarget") ) {
      sessionId = command.params.sessionId || that.sessionId;
    } else if ( command.name == "Target.activateTarget" ) {
      that.sessionId = sessions.get(targetId); 
      if ( ! that.sessionId ) { 
        console.warn(`!! No sessionId at Target.activateTarget`);
      }
      that.targetId = targetId; 
      sessionId = that.sessionId;
      const worlds = connection.worlds.get(sessionId);
      DEBUG.val && console.log('worlds at session send', worlds);
      if ( ! worlds ) {
        DEBUG.val && console.log("reloading because no worlds we can access yet");
        await send("Page.reload", {}, sessionId);
      } else {
        DEBUG.val && console.log("Tab is loaded",sessionId);
      }
      connection.activeTarget = targetId;

      if ( CONFIG.screencastOnly ) {
        const castInfo = casts.get(targetId);
        if ( !castInfo || ! castInfo.castSessionId ) {
          updateCast(sessionId, {started:true}, 'start');
          await send("Page.startScreencast", SCREEN_OPTS, sessionId);
        } else {
          if ( ! sessionId ) {
            console.warn(`3 No sessionId for screencast ack`);
          }
          await send("Page.screencastFrameAck", {
            sessionId: castInfo.castSessionId
          }, sessionId);
        }
      }
    }
    if ( command.name.startsWith("Target") || ! sessionId ) {
      if ( command.name.startsWith("Page") || command.name.startsWith("Runtime") || command.name.startsWith("Emulation") ) {
        sessionId = that.sessionId;
        DEBUG.coords && command.name.startsWith("Emulation") && console.log('Emulation session send 1', command, {sessionId})
        if ( sessionId ) {
          return await send(command.name, command.params, sessionId); 
        } else {
          //DEBUG.val && console.log(`Blocking as ${command.name} must be run with session.`, command);
          DEBUG.showNoSessionIdWarnings && console.warn(`!! No sessionId for command: ${JSON.stringify(command,null,2)}`);
          return {};
        }
      } else {
        DEBUG.val > DEBUG.med && console.log({zombieNoSessionCommand:command});
        return await send(command.name, command.params); 
      }
    } else {
      if ( command.name !== "Page.screencastFrameAck" ) {
        sessionId = command.params.sessionId || that.sessionId;
        if ( ! sessionId || ! sessions.has(sessionId) ) {
          DEBUG.val && console.log("Blocking as session not exist.", sessionId);
          console.warn(`5 No sessionId at Page.screencastFrameAck`);
          return {};
        }
      } else {
        sessionId = command.sessionId || that.sessionId;
        //console.log(command, sessionId);
      }
      if ( !! command.params.contextId && ! hasContext(sessionId, command.params.contextId) ) {
        DEBUG.val && console.log("Blocking as context does not exist.", command, sessionId, connection.worlds, connection.worlds.get(sessionId) );
        return {};
      }
      DEBUG.val > DEBUG.med && 
        command.name !== "Page.captureScreenshot" && 
        command.name !== "HeadlessExperimental.beginFrame" &&
        console.log({zombieSessionCommand:command});
      try {
        const {requiresTask,needsReload} = command;
        command.needsReload = undefined;
        command.requiresTask = undefined;
        //DEBUG.coords && command.name.startsWith("Emulation") && console.log('Emulation session send 2', command, {sessionId})
        const r = await send(command.name, command.params, sessionId);
        if ( needsReload ) {
          await send("Page.reload", {}, sessionId);
        }
        if ( requiresTask ) {
          //setTimeout(() => {
            try {
              requiresTask();
            } catch(e) {
              console.warn(`Command`, command, `requiresTask`, requiresTask, `failed`, e);
            }
          //}, 0);
        }
        return r;
      } catch(e) {
        console.log(e);
        try {
          if ( e.Error && e.Error.indexOf("session") ) {
            const {sessionId} = e.request.params;
            removeSession(sessionId);
            if ( that.activeTarget === targetId ) {
              that.activeTarget = null;
            }
            DEBUG.val > DEBUG.med && console.log("Removed session");
          }
        } finally {
          void 0;
        }
      }
    }
  }

  function addContext(id, contextId) {
    DEBUG.val > DEBUG.med && console.log({addingContext:{id,contextId}});
    const otherId = sessions.get(id);
    let contexts = connection.worlds.get(id);
    if ( ! contexts ) {
      contexts = new Set();
      connection.worlds.set(id, contexts);
      connection.worlds.set(otherId, contexts);
    }
    contexts.add(contextId);
  }

  function hasContext(sessionId, contextId) {
    const id = sessionId || connection.sessionId;
    const contexts = connection.worlds.get(id);
    if ( ! contexts ) return false;
    else return contexts.has(contextId);
  }

  function deleteContext(id, contextId) {
    DEBUG.val > DEBUG.med && console.log({deletingContext:{id,contextId}});
    //const otherId = sessions.get(id);
    let contexts = connection.worlds.get(id);
    if ( contexts ) {
      contexts.delete(contextId);
    }
  }

  function deleteWorld(id) {
    const otherId = sessions.get(id);
    connection.worlds.delete(id);
    connection.worlds.delete(otherId);
  }

  function endTarget({targetId}, label) {
    DEBUG.val > DEBUG.med && console.warn({[label]:{targetId}});
    const sessionId = sessions.get(targetId);
    if ( connection.activeTarget === targetId ) {
      connection.activeTarget = null;
    }
    targets.delete(targetId);
    tabs.delete(targetId);
    removeSession(targetId);
    deleteWorld(targetId);
    connection.meta.push({[label]:{targetId}});
  }
}

export function getViewport(...viewports) {
  if ( viewports.length === 1 ) {
    return viewports[0];
  }
  if ( viewports.length === 0 ) {
    const {
      width, height, deviceScaleFactor,
    } = COMMON_FORMAT;
    return {width, height, deviceScaleFactor};
  }
  const width = Math.min(...viewports.map(v => v.width));
  const height = Math.min(...viewports.map(v => v.height));
  const deviceScaleFactor = Math.max(...viewports.map(v => v.deviceScaleFactor));
  const commonViewport = {
    width, height, deviceScaleFactor
  };
  ensureMinBounds(commonViewport);
  return commonViewport;
}

function ensureMinBounds(bounds) {
  if ( ! Number.isFinite(bounds.width) || bounds.width < MIN_WIDTH ) {
    bounds.width = MIN_WIDTH;
  }
  if ( ! Number.isFinite(bounds.height) || bounds.height < MIN_HEIGHT ) {
    bounds.height = MIN_HEIGHT;
  }
  return bounds;
}


function saveTargetIdAsGlobal(targetId) {
  return `
    {
      const targetId = "${targetId}";
      try {
        Object.defineProperty(self, 'targetId', {
          get: () => targetId,
        });
      } catch(e) {
        console.warn('Already defined targetId?', e);
      }
    }
  `;
}

function isFileURL(url) {
  const firstColonIndex = url.indexOf(':');

  const scheme = url.slice(firstColonIndex-4, firstColonIndex);

  return scheme == 'file';
}

async function makeZombie({port:port = 9222} = {}) {
  const {webSocketDebuggerUrl} = await fetch(`http://${
      DEBUG.useLoopbackIP ? '127.0.0.1' : 'localhost'
    }:${port}/json/version`).then(r => r.json());
  const socket = new WebSocket(webSocketDebuggerUrl);
  const Zombie = {
    disconnected: true
  };
  const Resolvers = {};
  const Handlers = {};
  const LAST_COMMANDS_WINDOW = 5;
  const lastCommands = [];
  socket.on('message', handle);
  socket.on('close', () => {
    Zombie.disconnected = true;
  });
  let id = 0;

  let resolve;
  const promise = new Promise(res => resolve = res);

  socket.on('open', () => {
    Zombie.disconnected = false;
    resolve();
  });

  await promise;

  Object.assign(Zombie, {
    send,
    on, ons
  });

  return Zombie;
  
  /* send debugging protocol message to browser */
  async function send(method, params = {}, sessionId) {
    if ( Zombie.disconnected ) {
      Zombie.sendErrorToClient('Our connection to chrome is disconnected. Probably means chrome shut down or crashed.');
      return;
    }
    const message = {
      method, params, sessionId, 
      id: ++id
    };
    const key = `${sessionId||ROOT_SESSION}:${message.id}`;
    let resolve;
    let promise = new Promise(res => resolve = res);
    if ( DEBUG.debugHistory && method.includes("History") ) {
      console.log(`History message`, message);
      const oResolve = resolve;
      resolve = (...args) => {
        console.log(`History message reply`, ...args);
        return oResolve(...args);
      };
    }
    if ( DEBUG.commands ) {
      const isFetchDomain = message.method.startsWith("Fetch.");
      const isCaptureScreenshot = message.method == "Page.captureScreenshot";
      const isScreenshotAck = message.method == "Page.screencastFrameAck";
      const isNeither = !(isCaptureScreenshot || isScreenshotAck || (isFetchDomain && DEBUG.dontShowFetchDomain));
      const displayCommand = isNeither || (DEBUG.acks && isScreenshotAck) || (DEBUG.shotDebug && isCaptureScreenshot);
      if ( displayCommand ) {
        //console.log({send:message});
        promise = promise.then(resp => {
          if ( resp && resp.data ) {
            if ( resp.data.length < 1000 ) {
              console.log({message,resp});
            } else {
              console.log(JSON.stringify({message,resp:'[long response]'},null,2));
            }
          } else {
            console.log(JSON.stringify({message,resp: resp || '[no response]'},null,2));
          }
          return resp;
        }).catch(err => {
          console.warn({sendFail:err}); 
        });
      }
    }
    if ( DEBUG.showErrorSources ) {
      resolve._originalCommand = message;
    }
    Resolvers[key] = resolve; 
    if ( DEBUG.showErrorSources ) {
      lastCommands.unshift(message);
      if ( lastCommands.length > LAST_COMMANDS_WINDOW ) {
        lastCommands.length = LAST_COMMANDS_WINDOW;
      }
    }
    if ( DEBUG.logFileCommands && LOG_FILE.Commands.has(message.method) ) {
      DEBUG.val && console.info(`Logging`, message);
      fs.appendFileSync(LOG_FILE.FileHandle, JSON.stringify({
        timestamp: (new Date).toISOString(),
        message,
      },null,2)+"\n");
    }
    if ( message.method == "Page.captureScreenshot" ) {
      DEBUG.showBlockedCaptureScreenshots && console.info("Blocking page capture screenshot");
      return Promise.resolve(true);
    }
    try {
      socket.send(JSON.stringify(message));
    } catch(e) {
      console.warn("Error sending to chrome", e);
      Zombie.sendErrorToClient(e);
    }
    return promise;
  }

  async function handle(message) {
    const stringMessage = message;
    message = JSON.parse(message);
    const {sessionId} = message;
    const {method} = message;
    const {id, result, error} = message;

    if ( error ) {
      if ( DEBUG.showErrorSources ) {
        console.warn("\nBrowser backend Error message", message);
        const key = `${sessionId||ROOT_SESSION}:${id}`;
        const originalCommand = Resolvers?.[key]?._originalCommand;
        if ( originalCommand ) {
          console.log(`Original command that caused error`, originalCommand);
        } else {
          console.log(`Can't find original command as no id, but last ${LAST_COMMANDS_WINDOW} commands sent were:`, lastCommands);
        }
        console.log('');
      }
    } else if ( id ) {
      const key = `${sessionId||ROOT_SESSION}:${id}`;
      const resolve = Resolvers[key];
      if ( ! resolve ) {
        console.warn(`No resolver for key`, key, stringMessage.slice(0,140));
      } else {
        Resolvers[key] = undefined;
        try {
          await resolve(result);
        } catch(e) {
          console.warn(`Resolver failed`, e, key, stringMessage.slice(0,140), resolve);
        }
      }
    } else if ( method ) {
      const listeners = Handlers[method];
      if ( Array.isArray(listeners) ) {
        for( const func of listeners ) {
          try {
            await func({message, sessionId});
          } catch(e) {
            console.warn(`Listener failed`, method, e, func.toString().slice(0,140), stringMessage.slice(0,140));
          }
        }
      }
    } else {
      console.warn(`Unknown message on socket`, message);
    }
  }

  function on(method, handler) {
    let listeners = Handlers[method]; 
    if ( ! listeners ) {
      Handlers[method] = listeners = [];
    }
    listeners.push(wrap(handler));
  }

  function ons(method, handler) {
    let listeners = Handlers[method]; 
    if ( ! listeners ) {
      Handlers[method] = listeners = [];
    }
    listeners.push(handler);
  }

  function wrap(fn) {
    return ({message}) => fn(message.params)
  }
}

function getFileFromURL(url) {
  url = new URL(url); 
  const {pathname} = url;
  const nodes = pathname.split('/');
  let lastNode = nodes.pop();
  if ( ! lastNode ) {
    DEBUG.val > DEBUG.med && console.warn({url, nodes, fileNameError: Error(`URL cannot be parsed to get filename`)});
    return `download${Date.now()}`;
  }
  const name = unescape(lastNode);
  // MARK 2
  DEBUG.val && console.log({name});
  return name;
}

function convertRemoteObjectToString({type, className, value, unserializableValue, description}) {
  let asString;

  if ( value ) {
    try {
      asString = JSON.stringify(value);  
    } finally { void 0; }
  } else if ( unserializableValue ) {
    try {
      asString = unserializableValue + "";
    } finally { void 0; }
  }

  return `${type}:${className||type}:${asString||''}:${description||'[unknown value]'}`;
}

function enumerateFrames(tree, max = 0) {
  const stack = [tree];
  const frames = [];

  while(stack.length) {
    const {frame,childFrames} = stack.shift();
    if ( childFrames ) {
      stack.push(...childFrames);
    }
    frames.push(frame);
    if ( max && frames.length > max ) {
      return frames;  // only check so far if we know we will have a mismatch with world number
    }
  }

  return frames;
}

function clone(o) {
  return JSON.parse(JSON.stringify(o));
}
