import {DEBUG} from '../common.js';

export function handleElementInfo({elementInfo:{
      attributes, innerText, noSuchElement
    }, executionContextId}, state) {
  if ( ! state.elementInfoContinuation ) {
    DEBUG.debugElementInfo && console.warn(`Got element info message, but no continuation to pass it to`);
    DEBUG.debugElementInfo && console.warn(JSON.stringify({elementInfo:{attributes, innerText, noSuchElement}}));
    return;
  }

  if ( noSuchElement ) {
    DEBUG.debugElementInfo && console.info(`Ignoring anyway as noSuchElement present`);
    return;
  }

  try {
    state.elementInfoContinuation({attributes, innerText, noSuchElement});
  } catch(e) {
    console.warn(`Element info continuation failed`, state.elementInfoContinuation, e);
    console.warn(JSON.stringify({elementInfo:{attributes, innerText, noSuchElement}}));
  }
}
