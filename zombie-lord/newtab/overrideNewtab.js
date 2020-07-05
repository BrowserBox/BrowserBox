//import {URL} from 'url';
import NEWTAB_RESPONSE from './newtabResponse.js';

let interceptId = 0;

// Note currently this does not work as about:blank is not passed through Network as a request

export async function overrideNewtab(zombie, sessionId, id) {
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
            urlPatterns: 'about:blank',
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

  console.log("Called override");
  return id;
}

export async function onInterceptRequest({sessionId, message}, Target) {
  if ( message.method == "Network.requestIntercepted" ) {
    const {request:{url}, interceptionId, isNavigationRequest} = message.params;
    let overridden = false;
    console.log("URL", url);
    if ( url == "about:blank" ) {
      console.log("Will override");
      try {
        if ( isNavigationRequest ) {
          // we want to provide a response body to indicate that this is a new tab
          await Target.sendMessageToTarget({
            message: JSON.stringify({
              id: ++interceptId,
              method: "Network.continueInterceptedRequest", params:{
              interceptionId,
              rawResponse: Buffer.from(NEWTAB_RESPONSE).toString('base64')
            }}),
            sessionId
          });
        } else {
          // in the case of a non navigation request to about blank we provide an empty reponse
          await Target.sendMessageToTarget({
            message: JSON.stringify({
              id: ++interceptId,
              method: "Network.continueInterceptedRequest", params:{
              interceptionId,
              rawResponse: Buffer.from("").toString('base64')
            }}),
            sessionId
          });
        }
        overridden = true;
      } catch(e) {
        console.warn("Issue with intercepting requires", e);
      }
    }
    if ( overridden ) return;
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

