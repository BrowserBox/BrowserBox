import keys from '../../../kbd.js';
import {DEBUG, logitKeyInputEvent} from '../common.js';
import {d as R} from '../../node_modules/dumbass/r.js';
import {OmniBox} from './omniBox.js';
import {PluginsMenuButton} from './pluginsMenuButton.js';

export function Controls(state) {
  const {H,retargetTab} = state;
  return R`
    <nav class="controls history aux" stylist="styleNavControl">
      <!--History-->
        <form submit=${e => H({ synthetic: true,
          type: 'history',
          event: e
        })} click=${saveClick} stylist="styleHistoryForm">
          <button ${state.tabs.length?'':'disabled'} name=history_action title=Back value=back class=back>&lt;</button>
          <button ${state.tabs.length?'':'disabled'} name=history_action title=Forward value=forward class=forward>&gt;</button>
        </form>
    </nav>
    <nav class="controls keyinput aux" stylist="styleNavControl">
      <!--Text-->
        <form class=kbd-input submit=${e => e.preventDefault()}>
          <input tabindex=-1 class=control name=key_input size=5
            autocomplete=off
            bond=${el => state.viewState.keyinput = el}
            keydown=${[logitKeyInputEvent,e => state.openKey = e.key, H,limitCursor,retargetTab]}
            keyup=${[logitKeyInputEvent,() => state.openKey = '', H,retargetTab]}
            focusin=${[() => clearWord(state), () => state.openKey = '']}
            compositionstart=${[logitKeyInputEvent, startComposition]}
            compositionupdate=${[logitKeyInputEvent,updateComposition]}
            compositionend=${[logitKeyInputEvent,endComposition]}
            input=${[logitKeyInputEvent,inputText]}
            keypress=${[logitKeyInputEvent, pressKey]}
            paste=${e => {
              inputText({type:'paste',data:e.clipboardData.getData('Text')});
            }}
            >
          <textarea tabindex=-1 class=control name=textarea_input cols=5 rows=1
            autocomplete=off
            bond=${el => state.viewState.textarea = el}
            keydown=${[logitKeyInputEvent,e => state.openKey = e.key, H,limitCursor,retargetTab]}
            keyup=${[logitKeyInputEvent,() => state.openKey = '', H,retargetTab]}
            focusin=${[() => clearWord(state), () => state.openKey = '']}
            compositionstart=${[logitKeyInputEvent,startComposition]}
            compositionupdate=${[logitKeyInputEvent,updateComposition]}
            compositionend=${[logitKeyInputEvent,endComposition]}
            input=${[logitKeyInputEvent,inputText]}
            keypress=${[logitKeyInputEvent, pressKey]}
            paste=${e => {
              inputText({type:'paste',data:e.clipboardData.getData('Text')});
            }}
            ></textarea>
        </form>
    </nav>
    ${OmniBox(state)}
    ${DEBUG.pluginsMenu ? PluginsMenuButton(state) : ''}
  `;

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
    updateWord(e, state);
    if ( e.key && e.key.length == 1 ) {
      state.lastKeypressKey = e.key;
      H({
        synthetic: true,
        type: 'typing',
        event: e,
        data: e.key
      });
    } else H(e);
    retargetTab(e);
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
    const key = keys[keypress.key];
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

  function limitCursor(/*event*/) {
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
      (e.type == "input" && e.inputType == "insertText") ||
      (e.type == "compositionend" && !! (e.data || state.latestData) )
    );

    if ( DEBUG.val >= DEBUG.high ) {
      logitKeyInputEvent(e);
    }

    return canCommit;
  }


