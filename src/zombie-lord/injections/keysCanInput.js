/* eslint-disable no-inner-declarations */
/*
  This provides event for
  when focus moves to a element
  that can accept text input

  input:not([type="range"]):not([type="submit"]):not([type="reset"]):not([type="file"]):not([type="image"]):not([type="button"]):not([type="color"]):not([type="radio"]):not([type="checkbox"]),textarea,[contenteditable]

  So we check if document.activeElement matches this selector, and if it does we emit a "consoleMessage" event that has the
  keysCanInput slot set to true
*/

{
  const KEYINPUT_ELEMENT = 'input:not([type="range"]):not([type="submit"]):not([type="reset"]):not([type="file"]):not([type="image"]):not([type="button"]):not([type="color"]):not([type="radio"]):not([type="checkbox"]),textarea,[contenteditable]';
  const TEXTAREA_OR_CONTENTEDITABLE = 'textarea,[contenteditable]';

  let keysCanInput = false;
  let isTextareaOrContenteditable = false;
  let type;
  self.focusEl = null;

  install();

  function install() {
    self.addEventListener('focusin', monitorActiveElement, {passive:true});
    self.addEventListener('focusout', monitorActiveElementNextTick, {passive:true});
    self.addEventListener('beforeunload', () => {
      if ( !! self.focusEl && top == self ) {
        keysCanInput = false;
        self.focusEl = null;
        s({keysCanInput,isTextareaOrContenteditable,type});
      }
    });
    self.addEventListener('load', monitorActiveElement);
    self.addEventListener('domcontentloaded', monitorActiveElement);
    setTimeout(monitorActiveElement, 100);
    self.canKeysInput = () => monitorActiveElement(null, {alwaysNotify:true});
    console.log(JSON.stringify({message:"Defined canKeysInput",targetId:self.targetId}));
  }

  function monitorActiveElementNextTick(e) {
    let {target} = e || {target:document.activeElement};
    let condition = target == self.focusEl;
    if ( !condition && e ) {
      target = Array.from(e.path).find(el => el.matches && el.matches(KEYINPUT_ELEMENT)); 
      condition = target == self.focusEl;
    }
    if ( condition ) {
      self.focusEl = null;
      keysCanInput = false;
      s({keysCanInput,isTextareaOrContenteditable,type});
    }
  }

  function monitorActiveElement(e, {alwaysNotify:alwaysNotify = false} = {}) {
    let {target} = e || {target:document.activeElement};
    if ( ! target || ! target.matches ) return;
    let condition = target.matches(KEYINPUT_ELEMENT);
    if ( !condition && e ) {
      target = Array.from(e.path).find(el => el.matches && el.matches(KEYINPUT_ELEMENT)); 
      condition = !!target;
    }
    if ( condition ) {
      self.focusEl = target;
      const newType = target.getAttribute('type');
      const inputmode = target.getAttribute('inputmode');
      const newIsTextareaOrContenteditable = target.matches(TEXTAREA_OR_CONTENTEDITABLE);
      // always notify (since we may be joining page for first time)
      if ( alwaysNotify || 
        condition != keysCanInput || type != newType || newIsTextareaOrContenteditable != isTextareaOrContenteditable 
      ) {
        const value = target.value;
        keysCanInput = condition;
        type = newType;
        isTextareaOrContenteditable = newIsTextareaOrContenteditable;
        s({keysCanInput,isTextareaOrContenteditable,type,inputmode,value});
      }
    }
  }

  function s(o) {
    console.log(JSON.stringify({keyInput:o}));
  }
}
/* eslint-enable no-inner-declarations */
