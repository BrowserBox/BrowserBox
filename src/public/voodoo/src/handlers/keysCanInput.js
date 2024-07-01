import {DEBUG, deviceIsMobile} from '../common.js';
export function handleKeysCanInputMessage(message, state) {
  const {keyInput:{
    keysCanInput, 
    isTextareaOrContenteditable, type, inputmode, 
    value:value = ''
  }, executionContextId} = message;
  DEBUG.debugKeysCanInput && console.log(`Received keys can input message`, message);
  DEBUG.debugKeysCanInput && deviceIsMobile() && alert(JSON.stringify(message))
  if ( state.ignoreKeysCanInputMessage ) return;
  if ( keysCanInput ) {
    state.viewState.hasNoKeys = true;
    state.contextIdOfFocusedInput = executionContextId;
    if ( ! state.dontFocusControlInputs ) {
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

