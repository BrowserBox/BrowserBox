import {URL} from 'url';
import BLOCKING from './blocking.js';
import {BLOCKED_BODY, BLOCKED_CODE, BLOCKED_HEADERS} from './blockedResponse.js';

export async function blockAds(/*zombie, sessionId*/) {
  // do nothing
}

export async function onInterceptRequest({sessionId, message}, zombie) {
  if ( message.method == "Fetch.requestPaused" ) {
    const {request:{url}, requestId, resourceType, responseErrorReason} = message.params;
    const isNavigationRequest = resourceType == "Document";
    const host = new URL(url).host;
    let blocked = false;
    for( const regex of BLOCKING ) {
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
    }
    if ( blocked ) return;
    // responseErrorReason never appears to be set, regardless of interception stage 
    //console.log({responseErrorReason,requestId, url, resourceType});
    if ( responseErrorReason ) {
      if ( isNavigationRequest ) {
        await zombie.send("Fetch.fulfillRequest", {
            requestId,
            responseHeaders: BLOCKED_HEADERS,
            responseCode: BLOCKED_CODE,
            body: Buffer.from(responseErrorReason).toString("base64"),
          },
          sessionId
        );
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
        await zombie.send("Fetch.continueRequest", {
            requestId,
          },
          sessionId
        );
      } catch(e) {
        console.warn("Issue with continuing request", e);
      }
    }
  }
}

