import {getViewWindow, LastInput} from '../helpers.js';

const ACCEPTS_LOCAL_FOCUS = "input, select, textarea, [contenteditable]";

export function installFocusDebug() {
  /**
  getViewWindow().document.body.addEventListener('focusin', e => console.log(e));
  getViewWindow().document.body.addEventListener('focusout', e => console.log(e));
  **/
}

export function installSyntheticFocus() {
  const synthFocus = e => {
    if ( e.target.matches(ACCEPTS_LOCAL_FOCUS) ) {
      e.target.focus();
      LastInput.target = e.target;
      LastInput.value = e.value;
    } else {
      e.target.ownerDocument.activeElement.blur();
      LastInput.target = null;
      LastInput.value = '';
    }
  };
  getViewWindow().addEventListener('mousedown', synthFocus);
  getViewWindow().addEventListener('pointerdown', synthFocus);
}

