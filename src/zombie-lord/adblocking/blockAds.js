import {URL} from 'url';
import BLOCKING from './blocking.js';
import {DEBUG, sleep, CONFIG} from '../../common.js';
import {BLOCKED_BODY, BLOCKED_CODE, BLOCKED_HEADERS} from './blockedResponse.js';

const {FORBIDDEN} = CONFIG;

export async function blockAds(/*zombie, sessionId*/) {
  // do nothing
}

export async function onInterceptRequest({sessionId, message}, zombie) {
  DEBUG.debugInterception && console.log(`Request paused`);
  try {
    if ( message.method == "Fetch.requestPaused" ) {
      const {request:{url}, requestId, resourceType, responseErrorReason} = message.params;
      const isNavigationRequest = resourceType == "Document";
      const isFont = resourceType == "Font";
      const uri = new URL(url);
      const {host,protocol} = uri;
      let blocked = false;
      let ri = 0;
      for( const regex of BLOCKING ) {
        DEBUG.debugInterception && console.log(`Testing regex`, ++ri);
        if ( regex.test(host) ) {
          try {
            if ( isNavigationRequest ) {
              // we want to provide a response body to indicate that we blocked it via an ad blocker
              await zombie.send("Fetch.fulfillRequest", {
                  requestId,
                  responseHeaders: BLOCKED_HEADERS,
                  responseCode: BLOCKED_CODE,
                  body: BLOCKED_BODY
                },
                sessionId
              );
            } else {
              await zombie.send("Fetch.failRequest", {
                  requestId,
                  errorReason: "BlockedByClient"
                },
                sessionId
              );
            }
            blocked = true;
            break;
          } catch(e) {
            console.warn("Issue with intercepting request", e);
          }
        }
        DEBUG.debugInterception && console.log(`Regex ${ri}: ${regex.test(host)}`);
      }
      blocked = blocked || FORBIDDEN.has(protocol);
      DEBUG.debugInterception && console.log(`Is blocked ${blocked}`);
      //await sleep(3000);
      if ( blocked ) return;
      // responseErrorReason never appears to be set, regardless of interception stage 
      //DEBUG.debugInterception && console.log({responseErrorReason,requestId, url, resourceType});
      // we need the font check here, because otherwise fonts will fail to load
      // somehow if a font is intercepted in responseStage (which we do) it will show a failed error
      // and if we have a failed error then we fail the request
      if ( !isFont && responseErrorReason ) {
        if ( isNavigationRequest ) {
          DEBUG.debugInterception && console.log(`Fulfill request`);
          await zombie.send("Fetch.fulfillRequest", {
              requestId,
              responseHeaders: BLOCKED_HEADERS,
              responseCode: BLOCKED_CODE,
              body: Buffer.from(responseErrorReason).toString("base64"),
            },
            sessionId
          );
          DEBUG.debugInterception && console.log(`Fulfill request complete`);
        } else {
          await zombie.send("Fetch.failRequest", {
              requestId,
              errorReason: responseErrorReason
            },
            sessionId
          );
        }
      } else {
        try {
          DEBUG.debugInterception && console.log(`Continue request`);
          await zombie.send("Fetch.continueRequest", {
              requestId,
            },
            sessionId
          );
          DEBUG.debugInterception && console.log(`Continue request complete`);
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

