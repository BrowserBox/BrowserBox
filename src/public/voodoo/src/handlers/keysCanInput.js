import {DEBUG, deviceIsMobile} from '../common.js';
export function handleKeysCanInputMessage(message, state) {
  const {keyInput:{
    keysCanInput, 
    isTextareaOrContenteditable, type, inputmode, 
    value:value = ''
  }, executionContextId} = message;
  DEBUG.debugKeysCanInput && console.log(`Received keys can input message`, message);
  DEBUG.debugKeysCanInput && deviceIsMobile() && alert(JSON.stringify(message))
  DEBUG.debugKCI && console.log(`Got message`, message);
  if ( state.ignoreKeysCanInputMessage ) return;
  if ( keysCanInput ) {
    state.viewState.hasNoKeys = true;
    state.contextIdOfFocusedInput = executionContextId;
    DEBUG.debugKCI && console.log(`Proceeding message`, message);
    if ( ! state.dontFocusControlInputs ) {
      DEBUG.debugKCI && console.log(`Focusing`, message);
      if ( isTextareaOrContenteditable ) {
        state.viewState.focusTextarea(inputmode, value); 
      } else {
        state.viewState.focusKeyinput(type, inputmode, value);
      }
    }
  } else {
    state.contextIdOfFocusedInput = null;
    if ( ! state.dontFocusControlInputs ) {
      const active = document.deepActiveElement;
      if ( active == state.viewState.textarea ) {
        state.viewState.blurTextarea(); 
      } else if ( active == state.viewState.keyinput ) {
        state.viewState.blurKeyinput();
      }
    }
  }
}

