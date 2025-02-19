import {URL} from 'url';
import WHITELIST from './whitelist.js';
import BLOCKED_RESPONSE from './blockedResponse.js';

let interceptId = 0;

export async function blockSites(zombie, sessionId, id) {
  const {Target} = zombie;

  // note
    // to make a good try of avoiding message id collissions between ids issued in connection.js
    // and ids issued asynchronously here in replies given in response to messages received
    // TODO: could factor out a "nextId" function into common and use it everywhere.
    // even better could factor out a sendMessage function into common which takes (sessionId, and zombie/Target).
  interceptId = id; 

  await Target.sendMessageToTarget({
    message: JSON.stringify({
      id: ++id,
      method: "Network.setRequestInterception", params: {
        patterns: [
          {
            urlPatterns: 'http://*/*',
          },
          {
            urlPatterns: 'https://*/*',
          }
        ]
      }
    }),
    sessionId
  });

  await Target.sendMessageToTarget({
    message: JSON.stringify({
      id: ++id,
      method: "Network.enable", params: {}
    }),
    sessionId
  });

  return id;
}

export async function onInterceptRequest({sessionId, message}, Target) {
  if ( message.method == "Network.requestIntercepted" ) {
    const {request:{url}, interceptionId, isNavigationRequest} = message.params;
    const host = new URL(url).host;
    const whiteListed = WHITELIST.some(regex => regex.test(host));
    if ( ! whiteListed ) {
      if ( isNavigationRequest ) {
        // we want to provide a response body to indicate that we blocked it via an ad blocker
        await Target.sendMessageToTarget({
          message: JSON.stringify({
            id: ++interceptId,
            method: "Network.continueInterceptedRequest", params:{
            interceptionId,
            rawResponse: Buffer.from(BLOCKED_RESPONSE).toString('base64')
          }}),
          sessionId
        });
      } else {
        await Target.sendMessageToTarget({
          message: JSON.stringify({
            id: ++interceptId,
            method: "Network.continueInterceptedRequest", params:{
            interceptionId,
            errorReason: "BlockedByClient"
          }}),
          sessionId
        });
      }
    } else {
      try {
        await Target.sendMessageToTarget({
          message: JSON.stringify({
            id: ++interceptId,
            method: "Network.continueInterceptedRequest", params:{
            interceptionId,
          }}),
          sessionId
        });
      } catch(e) {
        console.warn("Issue with continuing request", e);
      }
    }
  }
}

