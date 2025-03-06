import {URL} from 'url';
import BLOCKING from './blocking.js';
import {DEBUG, sleep, CONFIG} from '../../common.js';
import {BLOCKED_BODY, BLOCKED_CODE, BLOCKED_HEADERS} from './blockedResponse.js';
import * as WLBlock from './WLblockedResponse.js';
import * as WLBlockRedir from './WLblockedResponse-redir.js';

let WL_BLOCKED_BODY, WL_BLOCKED_CODE, WL_BLOCKED_HEADERS;

if ( CONFIG.useRedirectBlock ) {
  ({WL_BLOCKED_BODY, WL_BLOCKED_CODE, WL_BLOCKED_HEADERS} = WLBlockRedir);
} else {
  ({WL_BLOCKED_BODY, WL_BLOCKED_CODE, WL_BLOCKED_HEADERS} = WLBlock);
}

const {FORBIDDEN} = CONFIG;

export async function blockAds(/*zombie, sessionId*/) {
  // do nothing
}

export async function onInterceptRequest({sessionId, message}, zombie, connection) {
  DEBUG.debugInterception && console.log(`Request paused`, message?.params?.request?.url, sessionId);
  
  try {
    if ( message.method == "Fetch.requestPaused" ) {
      const {request:{url}, responseHeaders, frameId, requestId, resourceType, responseErrorReason} = message.params;
      const isNavigationRequest = resourceType == "Document";
      const isFont = resourceType == "Font";
      const uri = new URL(url);
      const {hostname, host, protocol} = uri;
      let blocked = false;
      let wl = false;
      let ri = 0;
      let isPDF = false;
      if ( CONFIG.hostWL ) {
        const rHost = hostname.split('.').slice(-2).join('.');
        blocked = !CONFIG.hostWL.has(rHost); 
        if ( blocked ) wl = true;
      } else {
        for( const regex of BLOCKING ) {
          DEBUG.debugInterception && console.log(`Testing regex`, ++ri);
          if ( regex.test(host) ) {
            try {
              blocked = true;
              break;
            } catch(e) {
              console.warn("Issue with intercepting request", e);
            }
          }
          DEBUG.debugInterception && console.log(`Regex ${ri}: ${regex.test(host)}`);
        }
      }
      blocked = blocked || FORBIDDEN.has(protocol);
      
      DEBUG.debugInterception && console.log(`Is blocked ${blocked}`);
      if ( blocked ) {
        if ( isNavigationRequest ) {
          // we want to provide a response body to indicate that we blocked it via an ad blocker
          const responseHeaders = wl ? WL_BLOCKED_HEADERS : BLOCKED_HEADERS;
          const responseCode = wl ? WL_BLOCKED_CODE : BLOCKED_CODE;
          const body = wl ? WL_BLOCKED_BODY : BLOCKED_BODY;
          DEBUG.blockDebug && wl && console.log(`WL Blocking`, uri);
          zombie.send("Fetch.fulfillRequest", {
              requestId,
              responseHeaders,
              responseCode,
              body,
            },
            sessionId
          );
        } else {
          zombie.send("Fetch.failRequest", {
              requestId,
              errorReason: "BlockedByClient"
            },
            sessionId
          );
        }
        return;
      }
      // responseErrorReason never appears to be set, regardless of interception stage 
      //DEBUG.debugInterception && console.log({responseErrorReason,requestId, url, resourceType});
      // we need the font check here, because otherwise fonts will fail to load
      // somehow if a font is intercepted in responseStage (which we do) it will show a failed error
      // and if we have a failed error then we fail the request
      if ( !isFont && responseErrorReason ) {
        if ( isNavigationRequest ) {
          DEBUG.debugInterception && console.log(`Fulfill request`);
          zombie.send("Fetch.fulfillRequest", {
              requestId,
              responseHeaders: BLOCKED_HEADERS,
              responseCode: BLOCKED_CODE,
              body: Buffer.from(responseErrorReason).toString("base64"),
            },
            sessionId
          );
          DEBUG.debugInterception && console.log(`Fulfill request complete`);
        } else {
          zombie.send("Fetch.failRequest", {
              requestId,
              errorReason: responseErrorReason
            },
            sessionId
          );
        }
      } else {
        try {
          if ( DEBUG.revealChromeJSIntercepts && url.startsWith('chrome') && url.endsWith('.js') ) {
            console.log(`Continue request ${url}`);
          }
          let failRequest = false;
          let resolve;
          const untilRequestFailed = new Promise(res => resolve = res);
          if ( isNavigationRequest && responseHeaders ) {
            const contentType = responseHeaders.find(({name}) => name.match(/content-type/i));
            if ( contentType?.value?.match(/application\/pdf/i) ) {
              isPDF = true;
              if ( connection.DesktopOnly.has(url) && connection.DesktopOnly.has(sessionId) ) {
                console.log(`Do nothing because we already knew this pdf. Just checking user agent:`);
                    zombie.send("Runtime.evaluate", {
                      expression: `navigator.userAgent`,
                      timeout: CONFIG.SHORT_TIMEOUT,
                      /*
                      includeCommandLineAPI: false,
                      userGesture: true,
                      awaitPromise: true,
                      */
                    }, sessionId).then(r => {
                      //console.log({sessionId,r})
                      const {result:{value: userAgent}} = r;
                      DEBUG.debugPdf && console.log(`Page has userAgent: `, userAgent);
                      zombie.send("Emulations.setDeviceMetricsOverride", {mobile:false}, sessionId);
                    });
              } else {
                //failRequest = true;
                connection.DesktopOnly.add(url);
                connection.DesktopOnly.add(sessionId);
                DEBUG.debugPdf && console.log(`Found a pdf `, url, frameId, connection.DesktopOnly, {sessionId}, connection.updateTargetsOnCommonChanged); 
                try {
                  connection.forceMeta({triggerViewport:{width:1920,height:1080,mobile:false}});
                } catch(e) {
                  DEBUG.debugPdf && console.info(`Error updating targets on pdf find`, e);
                }
              }
              DEBUG.debugPdf && console.log(failRequest ? `Failing request in order to re-navigate to it:` : `Continuing request`, url);
            }
          }
          if ( failRequest ) {
            zombie.send("Fetch.failRequest", {
                requestId,
                errorReason: "Aborted"
              },
              sessionId
            );
            resolve();
          } else {
            zombie.send("Fetch.continueRequest", {
                requestId,
              },
              sessionId
            );
            DEBUG.debugInterception && console.log(`Continue request complete`);
            ( DEBUG.debugPdf && isPDF ) && console.log(`Continue request complete`); 
          }
        } catch(e) {
          console.warn("Issue with continuing request", e, message);
        }
      }
    } else {
      throw new Error(`error in intercept`, message);
    }
  } catch(e) {
    console.warn('blocking intercept err', e);
  }
}

