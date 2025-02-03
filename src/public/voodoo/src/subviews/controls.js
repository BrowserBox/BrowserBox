import keys from '../../../kbd.js';
import {controlChars,getKeyId} from '../transformEvent.js';
import {DEBUG, CHAR, logitKeyInputEvent} from '../common.js';
import {c as X, s as R} from '../../node_modules/bang.html/src/vv/vanillaview.js';
//import {PluginsMenuButton} from './pluginsMenuButton.js';
//import {SidebarMenuButton} from './sidebarMenuButton.js';

export function Controls(state) {
  const {H} = state;

  Object.assign(state, {
    logitKeyInputEvent,
    startComposition,
    updateComposition,
    endComposition,
    inputText,
    pressKey,
    saveClick,
    clearWord,
    updateWord,
  });

  function startComposition(/*e*/) {
    state.isComposing = true;
    state.latestData = "";
  }

  function updateComposition(e) {
    state.isComposing = true;
    if ( state.hasCommitted ) {
      state.latestData = e.data || state.latestData || "";
    }
  }

  function endComposition(e) {
    if ( ! state.isComposing ) return;
    state.isComposing = false;
    if ( e.data == state.latestCommitData ) return;
    let data = e.data || "";
    if ( commitChange(e, state) ) {
      H({
        synthetic: true,
        type: 'typing',
        event: e, 
        data: data 
      });
      state.latestCommitData = data;
      state.hasCommitted = true;
      state.latestData = "";
    } else {
      state.latestData = "";
    }
  }

  function inputText(e) {
    let data = e.data || "";
    DEBUG.logTyping && console.log("Input event", e);
    if ( state.convertTypingEventsToSyncValueEvents ) {
      H({
        synthetic: true,
        type: 'typing',
        event: e,
        data: data 
      });
    } else {
      if ( state.openKey == data ) return;
      if ( commitChange(e, state) ) {
        state.isComposing = false;
        H({
          synthetic: true,
          type: 'typing',
          event: e,
          data: data 
        });
        state.latestCommitData = data;
        state.hasCommitted = true;
        state.latestData = "";
      } else if ( e.inputType == 'deleteContentBackward' ) {
        if ( ! state.backspaceFiring ) {
          H({
            type: "keydown",
            key: "Backspace"
          });
          H({
            type: "keyup",
            key: "Backspace"
          });
          if ( state.viewState.shouldHaveFocus ) {
            state.viewState.shouldHaveFocus.value = "";
          }
          /**
          H({
            synthetic: true,
            type: 'typing-deleteContentBackward',
            event: e,
            contextId: state.contextIdOfFocusedInput,
            valueToDelete: state.latestCommitData,
          });
          **/
        }
        state.latestData = "";
      } else if ( e.inputType == 'insertReplacementText' ) {
        if ( ! state.backspaceFiring ) {
          H({
            type: "keydown",
            key: "Backspace"
          });
          H({
            type: "keyup",
            key: "Backspace"
          });
          if ( state.viewState.shouldHaveFocus ) {
            state.viewState.shouldHaveFocus.value = "";
          }
          /**
          H({
            synthetic: true,
            type: 'typing-deleteContentBackward',
            event: e,
            contextId: state.contextIdOfFocusedInput,
            valueToDelete: state.latestCommitData,
          });
          **/
        }
        state.latestData = "";
        H({
          synthetic: true,
          type: 'typing-deleteContentBackward',
          event: e,
          contextId: state.contextIdOfFocusedInput,
          valueToDelete: state.currentWord,
        });
        H({
          synthetic: true,
          type: 'typing',
          event: e,
          data: e.data
        });
        state.latestData = "";
        clearWord(state);
        state.latestCommitData = e.data;
        state.hasCommitted = true;
      } else if ( e.type == 'paste' ) {
        H({
          synthetic: true,
          type: 'typing',
          event: e,
          data: data
        });
        state.latestData = "";
        clearWord(state);
        state.latestCommitData = data;
        state.hasCommitted = true;
        state.latestData = "";
      }
    }
  }

  function pressKey(e) {
    //DEBUG.debugKeyEvents && console.info(`[pressKey]: got key event: ${e.key} (${e.type.slice(3)})`, e);
    updateWord(e, state);
    if ( controlChars.has(getKeyId(e)) && e.type == 'keypress' && keys[getKeyId(e)].text ) {
      H(e);
    }
    /*
    if ( e.key && e.key.length == 1 ) {
      state.lastKeypressKey = e.key;
      H({
        synthetic: true,
        type: 'typing',
        event: e,
        data: e.key
      });
    } else H(e);
    */
    DEBUG.debugKeyEvents && console.info(`[pressKey]: sent key event: ${e.key} (${e.type.slice(3)})`);
    state.retargetTab(e);
  }
}

// Helper functions 
  // save the target of a form submission
  export function saveClick(event) {
    if ( event.target.matches('button') ) {
      event.currentTarget.clickedButton = event.target;
    }
  }

  // keep track of sequences of keypresses (words basically)
  // because some IMEs (iOS / Safari) issue a insertReplacementText if we select a 
  // suggested word, which requires we delete the word already entered.
  function clearWord(state) {
    state.hasCommitted = false;
    state.currentWord = "";
  }

  function updateWord(keypress, state) {
    const key = keys[getKeyId(keypress)];
    if ( !! key && (key.code == 'Space' || key.code == 'Enter') ) {
      clearWord(state);
    } else {
      state.currentWord += keypress.key;
    }
  }
  /**
    * Limit cursor prevents the cursor to be moved
    * Inside textarea.
    * The reason we do this is to greatly simplify (for now)
    * The type of input events that we need to handle and transmit
    * to the remote browser.
    * This limits us to only consider appending or deleting at the END
    * of the textarea. 
  **/

  export function limitCursor(/*event*/) {
    /*
    const target = event.target;
    target.selectionStart = target.selectionEnd = target.value.length;
    */
    return;
  }

  // text
  // determines if it's time to commit a text input change from an IME
  function commitChange(e, state) {
    const canCommit = ( 
      (e.type == "input" && (e.inputType == "insertText" || e.inputType == "insertFromComposition")) ||
      (e.type == "compositionend" && !! (e.data || state.latestData) )
    );

    if ( DEBUG.val >= DEBUG.high ) {
      logitKeyInputEvent(e);
    }

    return canCommit;
  }


