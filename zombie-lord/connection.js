import {spawn} from 'child_process';
import ws from 'ws';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import {URL} from 'url';
import {unescape} from 'querystring';
import {APP_ROOT, DEBUG,sleep,SECURE_VIEW_SCRIPT} from '../common.js';
import {username} from '../args.js';
import {WorldName} from '../public/translateVoodooCRDP.js';
import {makeCamera} from './screenShots.js';
import {blockAds,onInterceptRequest as adBlockIntercept} from './adblocking/blockAds.js';
import {LatestCSRFToken, fileChoosers} from '../ws-server.js';
import docViewerSecret from '../secrets/docViewer.js';
//import {overrideNewtab,onInterceptRequest as newtabIntercept} from './newtab/overrideNewtab.js';
//import {blockSites,onInterceptRequest as whitelistIntercept} from './demoblocking/blockSites.js';

// standard injections
const selectDropdownEvents = fs.readFileSync(path.join(APP_ROOT, 'zombie-lord', 'injections', 'selectDropdownEvents.js')).toString();
const keysCanInputEvents = fs.readFileSync(path.join(APP_ROOT, 'zombie-lord', 'injections', 'keysCanInput.js')).toString();
const textComposition = fs.readFileSync(path.join(APP_ROOT, 'zombie-lord', 'injections', 'textComposition.js')).toString();
const favicon = fs.readFileSync(path.join(APP_ROOT, 'zombie-lord', 'injections', 'favicon.js')).toString();
const elementInfo = fs.readFileSync(path.join(APP_ROOT, 'zombie-lord', 'injections', 'elementInfo.js')).toString();
const scrollNotify = fs.readFileSync(path.join(APP_ROOT, 'zombie-lord', 'injections', 'scrollNotify.js')).toString();
const botDetectionEvasions = fs.readFileSync(path.join(APP_ROOT, 'zombie-lord', 'injections', 'pageContext', 'botDetectionEvasions.js')).toString();

// plugins injections
const appMinifier = fs.readFileSync(path.join(APP_ROOT, 'plugins', 'appminifier', 'injections.js')).toString();
const projector = fs.readFileSync(path.join(APP_ROOT, 'plugins', 'projector', 'injections.js')).toString();

// just concatenate the scripts together and do one injection
// but for debugging better to add each separately
// we can put in an array, and loop over to add each
const injectionsScroll = botDetectionEvasions + favicon + keysCanInputEvents + scrollNotify + elementInfo + textComposition + selectDropdownEvents;
const pageContextInjectionsScroll = botDetectionEvasions;

const RECONNECT_MS = 5000;
const WAIT_FOR_DOWNLOAD_BEGIN_DELAY = 5000;
const WAIT_FOR_COALESCED_NETWORK_EVENTS = 1000
const deskUA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:78.0) Gecko/20100101 Firefox/78.0";
//const mobUA = "Mozilla/5.0 (Android 9; Mobile; rv:79.0) Gecko/79.0 Firefox/79.0";
//const deskUA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.75 Safari/537.36";
const mobUA = "Mozilla/5.0 (Android 9; Mobile; rv:79.0) Gecko/79.0 Firefox/79.0";

const LANG = "en-US";
const deskPLAT = "Win64";
//const deskPLAT = "MacIntel";
const mobPLAT = "Android";

//const VEND = "Apple Computer, Inc.";
//const VEND = "Google, Inc.";
const VEND = "";

const GrantedPermissions = ["geolocation", "notifications", "flash", "midi"];
//const PromptText = "Dosy was here.";
const ROOT_SESSION = 'root';

// for fun
const Area51Lat = 37.234332396;
const Area51Long = -115.80666344;

const UA = mobUA;
const PLAT = mobPLAT;

const targets = new Set(); 
//const waiting = new Map();
const sessions = new Map();
const loadings = new Map();
const tabs = new Map();
const Frames = new Map();
//const originalMessage = new Map();

let AD_BLOCK_ON = true;
let DEMO_BLOCK_ON = false;

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

export default async function Connect({port}, {adBlock:adBlock = true, demoBlock: demoBlock = false} = {}) {
  AD_BLOCK_ON = adBlock;

  if ( demoBlock ) {
    AD_BLOCK_ON = false;
    DEMO_BLOCK_ON = true;
  }
  const connection = {
    zombie: await makeZombie({port}),
    port,
    browserTargetId: null,
    loadingCount: 0,
    totalBandwidth: 0,
    record: {},
    frameBuffer: [],
    meta: [],
    pausing: new Map(),
    worlds: new Map(),
    sessionSend,
    sessions,
    targets,
    tabs,
    sessionId: null,
    bounds: {width: 1280, height: 800},
    navigator: { userAgent: UA, platform: PLAT, acceptLanguage: LANG, vendor: VEND },
    plugins: {},
    setClientErrorSender(e) {
      this.zombie.sendErrorToClient = e;
    }
  };
  connection.zombie.on('disconnect', async () => {
    console.log(`Reconnecting to zombie in ${RECONNECT_MS}`);
    await sleep(RECONNECT_MS);
    setTimeout(async () => {
      const next_connection = await Connect(
        {port:connection.port}, 
        {adBlock, demoBlock, sendErrorToClient}
      );
      Object.assign(connection,next_connection);
    }, RECONNECT_MS);
  });

  {
    const {doShot, queueTailShot, shrinkImagery, growImagery} = makeCamera(connection);
    connection.doShot = doShot;
    connection.queueTailShot = queueTailShot;
    connection.shrinkImagery = shrinkImagery;
    connection.growImagery = growImagery;
  }

  const {send,on, ons} = connection.zombie;

  const {targetInfo:browserTargetInfo} = await send("Target.getTargetInfo");
  connection.browserTargetId = browserTargetInfo.targetId;

  ! DEBUG.legacyShots && await send("HeadlessExperimental.enable", {});
  await send("Target.setDiscoverTargets", {discover:true});
  await send("Target.setAutoAttach", {
    autoAttach:false, 
    waitForDebuggerOnStart:false, 
    flatten:true, 
    windowOpen:true
  });

  //UPGRADE for future
  //Page.setDownloadBehavior is deprecated
  /**
  await send("Browser.setDownloadBehavior", {
    behavior: "allow",
    downloadPath: `/home/${username}/browser-downloads/`
  });
  **/

  on("Target.targetCreated", async ({targetInfo}) => {
    const {targetId} = targetInfo;
    targets.add(targetId);
    tabs.set(targetId,targetInfo);
    connection.meta.push({created:targetInfo,targetInfo});
    if ( targetInfo.type == "page" ) {
      await send("Target.attachToTarget", {targetId, flatten:true});
    }
  });

  on("Target.targetInfoChanged", async ({targetInfo}) => {
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
  });

  on("Target.attachedToTarget", async ({sessionId,targetInfo,waitingForDebugger}) => {
    const attached = {sessionId,targetInfo,waitingForDebugger};
    const {targetId} = targetInfo;
    DEBUG.val > DEBUG.med && console.log("Attached to target", sessionId, targetId);
    targets.add(targetId);
    addSession(targetId, sessionId);
    connection.meta.push({attached});
    await setupTab({attached});
  });

  on("Target.detachedFromTarget", ({sessionId}) => {
    const detached = {sessionId};
    const targetId = sessions.get(sessionId);
    targets.delete(targetId);
    tabs.delete(targetId);
    removeSession(sessionId);
    deleteWorld(targetId);
    connection.meta.push({detached});
  });

  on("Target.targetCrashed", meta => endTarget(meta, 'crashed'));

  on("Target.targetDestroyed", meta => endTarget(meta, 'destroyed'));

  ons("Target.receivedMessageFromTarget", receiveMessage);
  ons("LayerTree.layerPainted", receiveMessage);
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
  ons("Page.downloadWillBegin", receiveMessage);
  ons("Page.downloadProgress", receiveMessage);
  ons("Runtime.exceptionThrown", receiveMessage);
  ons("Target.detachedFromTarget", receiveMessage);
  
  async function receiveMessage({message, sessionId}) {
    if ( message.method == "Network.dataReceived" ) {
      const {encodedDataLength, dataLength} = message.params;
      connection.totalBandwidth += (encodedDataLength || dataLength);
    } else if ( message.method == "Target.detachedFromTarget" ) {
      removeSession(message.params.targetId);
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
      /*if ( ! activeContexts || ! activeContexts.has(executionContextId) ) {
        DEBUG.val && console.log(`Blocking as is not a context in the active target.`);
        return;
      }*/
      message = consoleMessage;
      const firstArg = args[0];
      try {
        message = JSON.parse(firstArg.value);
        message.executionContextId = executionContextId;
        connection.meta.push(message);
      } catch(e) {
        void 0;
      } finally {
        DEBUG.val > DEBUG.med && connection.meta.push({consoleMessage});
      }
    } else if ( message.method == "Runtime.executionContextCreated" ) {
      DEBUG.val && console.log(JSON.stringify({createdContext:message.params.context}));
      const {name:worldName, id:contextId} = message.params.context;
      if ( worldName == WorldName ) {
        addContext(sessionId,contextId);
        await send(
          "Runtime.addBinding", 
          {
            name: "instructZombie",
            executionContextId: contextId
          },
          sessionId
        );
      }
    } else if ( message.method == "Runtime.executionContextDestroyed" ) {
      const contextId = message.params.executionContextId;
      deleteContext(sessionId, contextId);
    } else if ( message.method == "Runtime.executionContextsCleared" ) {
      DEBUG.val > DEBUG.med && console.log("Execution contexts cleared");
      deleteWorld(sessionId);
    } else if ( message.method == "LayerTree.layerPainted" ) {
      connection.doShot();
    } else if ( message.method == "Page.javascriptDialogOpening" ) {
      const {params:modal} = message;
      modal.sessionId = sessionId;
      console.log(JSON.stringify({modal}));
      connection.meta.push({modal});
    } else if ( message.method == "Page.frameNavigated" ) {
      const {url, securityOrigin, unreachableUrl, parentId} = message.params.frame;
      const topFrame = !parentId;
      if ( !!topFrame && (!! url || !! unreachableUrl) ) {
        clearLoading(sessionId);
        const targetId = sessions.get(sessionId);
        const navigated = {
          targetId,
          topFrame,
          url, unreachableUrl
        };
        connection.meta.push({navigated});
        // this is strangely necessary to not avoid the situation where the layer tree is not updated
        // on page navigation, meaning that layerPainted events stop firing after a couple of navigations
        await send(
          "LayerTree.enable", 
          {},
          sessionId
        );
      }
      if ( ! unreachableUrl && securityOrigin || url ) {
        const origin = securityOrigin || new URL(url).origin;
        await send(
          "Browser.grantPermissions", 
          {
            origin, permissions: GrantedPermissions
          }
        );
        await send(
          "Emulation.setGeolocationOverride",
          {
            latitude: Area51Lat, longitude: Area51Long, accuracy: 5
          },
          sessionId
        );
      }
    } else if ( message.method == "Page.fileChooserOpened" ) {
      const {mode,backendNodeId} = message.params;
      const fileChooser = {mode, sessionId};

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

      connection.meta.push({fileChooser});
    } else if ( message.method == "Page.downloadProgress" ) {
      const {params:downloadProgress} = message;
      const {done, receivedBytes, totalBytes, state} = downloadProgress;

      if ( ! done && state == 'inProgress' ) return;

      const amountToAddToServerData = Math.max(receivedBytes, totalBytes, 1);
      
      if ( Number.isInteger(amountToAddToServerData) ) {
        connection.totalBandwidth += amountToAddToServerData;
      }
    } else if ( message.method == "Page.downloadWillBegin" ) {
      // MARK 3
      ///**
        const {params:download} = message;
        const {suggestedFilename} = download;

        const downloadFileName = suggestedFilename || getFileFromURL(download.url);

        download.sessionId = sessionId;
        download.filename = downloadFileName;

        // MARK 6
        DEBUG.val && console.log({download});
        DEBUG.val && console.log({suggestedFilename});

        // TODO:
        // bisect by 
        // 1. disable download behaviour in Page domain
        // 2. enable it and disable various parts of below code
        // find out which part of the code creates the 'lock up' 
        // issue we are experiencing

        // notification
          connection.meta.push({download});
          connection.lastDownloadFileName = downloadFileName;

        // do only once
        if ( connection.lastDownloadGUID == download.guid ) return;
        connection.lastDownloadGUID = download.guid;

        // logging 
          DEBUG.val > DEBUG.med && console.log({downloadFileName,SECURE_VIEW_SCRIPT,username});

        // MARK 4 
          // This shouldn't be in the community edition
          console.log({docViewerSecret});
          const subshell = spawn(SECURE_VIEW_SCRIPT, [username, `${downloadFileName}`, docViewerSecret]);
          let uri = '';
          let done = false;

          // subshell collect data and send once
            subshell.stderr.pipe(process.stderr);
            subshell.stdout.on('data', data => {
              uri += data;
            });
            subshell.stdout.on('end', sendURL);
            subshell.on('close', sendURL);
            subshell.on('exit', sendURL);

          async function sendURL(code) {
            //MARK 5

            const url = uri ? uri.trim() : "";

            if ( ! uri || url.length == 0 ) {
              console.warn("No URI", downloadFileName);
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
              console.log("Send secure view", secureview);
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
      //**/
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
      if ( savedFrame ) {
        const {url,frameId} = savedFrame;

        if ( message.params.type == "Document" ) {
          const someFileName = getFileFromURL(url);

          message.frameId = frameId;
          DEBUG.val && console.log({failedURL:url});
          if ( !(url.startsWith('http')) ) {
            const modal = {
              type: 'intentPrompt',
              title: 'External App Request',
              message: `This page is asking to open an external app via URL: ${url}`,
              url
            };
            DEBUG.val && console.log(JSON.stringify({modal},null,2));
            connection.meta.push({modal});
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
        console.warn(`No url or frameId saved for requestId: ${requestId}`);
      }
    } else if ( message.method == "Network.responseReceived" ) {
      const resource = endLoading(sessionId);
      connection.meta.push({resource}); 
    } else if ( message.method == "Runtime.exceptionThrown" ) {
      DEBUG.val && console.log(JSON.stringify({exception:message.params}, null,2));
    } else if ( message.method == "Fetch.requestPaused" ) {
      //newtabIntercept({sessionId, message}, Target);
      if ( AD_BLOCK_ON ) { 
        await adBlockIntercept({sessionId, message}, connection.zombie);
      } else if ( DEMO_BLOCK_ON ) {
        console.warn("Demo block disabled");
        //whitelistIntercept({sessionId, message}, Target);
      }
    } else if ( message.method == "Fetch.authRequired" ) {
      const {requestId, request, /*frameId, */ resourceType, authChallenge} = message.params;
      connection.pausing.set(requestId, request.url);
      connection.pausing.set(request.url, requestId);
      const authRequired = {authChallenge, requestId, resourceType};
      DEBUG.val > DEBUG.med && console.log({authRequired});
      connection.meta.push({authRequired});
    } else if ( message.method && ( message.method.startsWith("LayerTree") || message.method.startsWith("Page") || message.method.startsWith("Network")) ) {
      // ignore
    } else { 
      console.warn("Unknown message from target", message);
    }
  }

  return connection;

  async function setupTab({attached}) {
    const {sessionId, targetInfo:{targetId}} = attached;
    try {
      DEBUG.val && console.log(sessionId, targetId, 'setting up');

      ! DEBUG.legacyShots && await send("HeadlessExperimental.enable", {}, sessionId);

      if ( ! loadings.has(sessionId) ) {
        const loading = {waiting:0, complete:0,targetId}
        loadings.set(sessionId,loading);
      }

      await send("Network.enable", {}, sessionId);
      await send("Network.setBlockedURLs", {
          urls: [
            "file://*",
          ]
        },
        sessionId
      )
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
              }
            ],
          },
          sessionId
        );
      }
      await send("Page.enable", {}, sessionId);
      await send("Page.setInterceptFileChooserDialog", {
        enabled: true
      }, sessionId);
      //MARK 1
      ///**
        await send("Page.setDownloadBehavior", {
            behavior: "allow",
            downloadPath: `/home/${username}/browser-downloads/`
          },
          sessionId
        );
      //**/
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
        await send(
          "Page.addScriptToEvaluateOnNewDocument",
          {
            // NOTE: NO world name to use the Page context
            source: pageContextInjectionsScroll
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
        connection.bounds,
        sessionId
      );
      await send(
        "Emulation.setScrollbarsHidden",
        {hidden:connection.hideBars},
        sessionId
      );
      await send(
        "Network.setUserAgentOverride", 
        connection.navigator,
        sessionId
      );
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
    } catch(e) {
      console.warn("Error setting up", e, targetId, sessionId);
    }
  }

  async function sessionSend(command) {
    const that = this || connection;
    let sessionId;
    const {targetId} = command.params;
    // FIXME: I want THIS kind of debug. Cool.
    //DEBUG.has("commands") && console.log(JSON.stringify(command));
    if ( command.name == "Page.navigate" ) {
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
    }
    if ( command.name == "Emulation.setDeviceMetricsOverride" ) {
      Object.assign(connection.bounds, command.params);
    }
    if ( command.name == "Emulation.setScrollbarsHidden" ) {
      connection.hideBars = command.params.hidden;
    }
    if ( command.name == "Network.setUserAgentOverride" ) {
      //connection.navigator.platform = command.params.platform;
      //connection.navigator.userAgent = command.params.userAgent;
      //command.params.userAgent = connection.navigator.userAgent;
      //command.params.platform = connection.navigator.platform;
      command.params.userAgent = connection.isMobile ? mobUA : deskUA;
      command.params.platform = connection.isMobile ? mobPLAT : deskPLAT;
      connection.navigator.platform = command.params.platform;
      connection.navigator.userAgent = command.params.userAgent;
      connection.navigator.acceptLanguage = command.params.acceptLanguage;
    }
    if ( !! targetId && !targets.has(targetId) ) {
      DEBUG.val && console.log("Blocking as target does not exist.", targetId);
      return {};
    }
    if ( command.name == "Target.closeTarget" ) {
      targets.delete(targetId);
      tabs.delete(targetId);
      const tSessionId = sessions.get(targetId);
      if ( sessions.get(that.sessionId) == targetId ) {
        that.sessionId = null;
      }
      removeSession(targetId);
      if ( tSessionId ) {
        DEBUG.val > DEBUG.med && console.log("Received close. Will send detach first.");
        // FIX NOTE: these sleeps (have not test ms sensitivity, maybe we could go lower), FIX issue #130
        // in other words, they prevent the seg fault crash on Target.closeTarget we get sometimes
        await sleep(300);
        await send("Target.detachFromTarget", {sessionId:tSessionId});
        await sleep(300);
      }
    }
    if ( command.name == "Fetch.continueWithAuth" ) {
      const {requestId} = command.params;
      const url = connection.pausing.get(requestId);
      connection.pausing.delete(requestId);
      connection.pausing.delete(url);
    }
    if ( !command.name.startsWith("Target") && !(command.name.startsWith("Browser") && command.name != "Browser.getWindowForTarget") ) {
      sessionId = command.params.sessionId || that.sessionId;
    } else if ( command.name == "Target.activateTarget" ) {
      that.sessionId = sessions.get(targetId); 
      that.targetId = targetId; 
      sessionId = that.sessionId;
      const worlds = connection.worlds.get(sessionId);
      if ( ! worlds ) {
        DEBUG.val && console.log("reloading because no worlds we can access yet");
        await send("Page.reload", {}, sessionId);
      } else {
        DEBUG.val && console.log("Activate",sessionId);
      }
    }
    if ( command.name.startsWith("Target") || ! sessionId ) {
      if ( command.name.startsWith("Page") || command.name.startsWith("Runtime") ) {
        sessionId = that.sessionId;
        if ( sessionId ) {
          return await send(command.name, command.params, sessionId); 
        } else {
          DEBUG.val && console.log(`Blocking as ${command.name} must be run with session.`, command);
          return {};
        }
      } else {
        DEBUG.val > DEBUG.med && console.log({zombieNoSessionCommand:command});
        const resp = await send(command.name, command.params); 
        return resp;
      }
    } else {
      sessionId = command.params.sessionId || that.sessionId;
      if ( ! sessions.has(sessionId) ) {
        DEBUG.val && console.log("Blocking as session not exist.", sessionId);
        return {};
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
        const r = await send(command.name, command.params, sessionId);
        return r;
      } catch(e) {
        console.log(e);
        try {
          if ( e.Error && e.Error.indexOf("session") ) {
            removeSession(e.request.params.sessionId);
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
    targets.delete(targetId);
    tabs.delete(targetId);
    removeSession(targetId);
    deleteWorld(targetId);
    connection.meta.push({[label]:{targetId}});
  }
}

function saveTargetIdAsGlobal(targetId) {
  return `
    {
      const targetId = "${targetId}";
      Object.defineProperty(self, 'targetId', {
        get: () => targetId
      });
    }
  `;
}

function isFileURL(url) {
  const firstColonIndex = url.indexOf(':');

  const scheme = url.slice(firstColonIndex-4, firstColonIndex);

  return scheme == 'file';
}

async function makeZombie({port:port = 9222} = {}) {
  const {webSocketDebuggerUrl} = await fetch(`http://localhost:${port}/json/version`).then(r => r.json());
  const socket = new ws(webSocketDebuggerUrl);
  const Zombie = {
    disconnected: true
  };
  const Resolvers = {};
  const Handlers = {};
  socket.on('message', handle);
  socket.on('close', () => {
    Zombie.disconnected = true;
  });
  let id = 0;
  
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
    if ( DEBUG.commands ) {
      if ( !(message.method == "Page.captureScreenshot" && ! DEBUG.shotDebug) ) {
        console.log({send:message});
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
    Resolvers[key] = resolve; 
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
    const {id, result} = message;

    if ( id ) {
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
