export function handleElementInfo({elementInfo:{
      attributes, innerText, noSuchElement
    }, /*executionContextId*/}, state) {
  if ( ! state.elementInfoContinuation ) {
    console.warn(`Got element info message, but no continuation to pass it to`);
    console.warn(JSON.stringify({elementInfo:{attributes, innerText, noSuchElement}}));
    return;
  }

  try {
    state.elementInfoContinuation({attributes, innerText, noSuchElement});
  } catch(e) {
    console.warn(`Element info continueation failed`, state.elementInfoContinuation, e);
    console.warn(JSON.stringify({elementInfo:{attributes, innerText, noSuchElement}}));
  }
}
