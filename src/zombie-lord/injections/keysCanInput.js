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
    if ( document.addEventListener ) {
      document.addEventListener('DOMContentLoaded', monitorActiveElement);
    }
    setTimeout(monitorActiveElement, 200);
    self.canKeysInput = () => monitorActiveElement(null, {alwaysNotify:true});
    console.log(JSON.stringify({message:"Defined canKeysInput",targetId:self.targetId}));
  }

  // i believe this function next tick refers to how the focus out event will essentially occur on the 'next tick' after focus/activeEl status
  // is lost the function is for monitoring that keys can no longer input
  function monitorActiveElementNextTick(e = {target:document.activeElement}, {alwaysNotify = false} = {}) {
    let focusDestination =  document.activeElement;
    let condition;
    if ( !e.path ) {
      e.path = e?.composedPath?.() || getAncestors(target);
    }
    setTimeout(() => {
      condition = focusDestination.matches(KEYINPUT_ELEMENT);
      if ( condition ) {
        //console.log(`KCI on active element`, focusDestination);
      }
      const changedTarget = self.focusEl != focusDestination;
      const newType = focusDestination.getAttribute('type');
      const inputmode = focusDestination.getAttribute('inputmode');
      const newIsTextareaOrContenteditable = focusDestination.matches(TEXTAREA_OR_CONTENTEDITABLE);
      self.focusEl = focusDestination;
      if ( ! condition ) {
        self.focusEl = null;
      }
      if ( alwaysNotify || 
        changedTarget || (condition != keysCanInput) || (type != newType) || (newIsTextareaOrContenteditable != isTextareaOrContenteditable) 
      ) {
        //console.log(`Focus out keysCanInput ${keysCanInput} condition ${condition}`);
        const value = condition ? (focusDestination.value || focusDestination.textContent) : undefined;
        keysCanInput = condition;
        type = newType;
        isTextareaOrContenteditable = newIsTextareaOrContenteditable;
        s({keysCanInput,isTextareaOrContenteditable,type,inputmode,value});
      }
    }, 100);
  }

  function monitorActiveElement(e = {target:document.activeElement}, {alwaysNotify:alwaysNotify = false} = {}) {
    let target = e.target;
    if ( ! target || ! target.matches ) return;
    if ( !e.path ) {
      e.path = e?.composedPath?.() || getAncestors(target);
    }
    let condition;
    setTimeout(() => {
      if ( document.activeElement.matches(KEYINPUT_ELEMENT) ) {
        target = document.activeElement;
      }
      condition = target.matches(KEYINPUT_ELEMENT);
      if ( !condition && e?.path ) {
        target = Array.from(e.path).find(el => el.matches && el.matches(KEYINPUT_ELEMENT)); 
        condition = !!target;
      }
      if ( condition ) {
        const changedTarget = self.focusEl != target;
        const newType = target.getAttribute('type');
        const inputmode = target.getAttribute('inputmode');
        const newIsTextareaOrContenteditable = target.matches(TEXTAREA_OR_CONTENTEDITABLE);
        self.focusEl = target;
        // always notify (since we may be joining page for first time)
        if ( alwaysNotify || 
          changedTarget || (condition != keysCanInput) || (type != newType) || (newIsTextareaOrContenteditable != isTextareaOrContenteditable) 
        ) {
          const value = target.value;
          keysCanInput = condition;
          type = newType;
          isTextareaOrContenteditable = newIsTextareaOrContenteditable;
          s({keysCanInput,isTextareaOrContenteditable,type,inputmode,value});
        }
      }
      if ( ! condition ) {
        self.focusEl = null;
      }
    }, 100);
  }

  function s(o) {
    console.log(JSON.stringify({keyInput:o}));
  }

  function getAncestors(el) {
    const anc = [];
    while(el?.nodeType == Node.ELEMENT_NODE) {
      anc.push(el);
      el = el.parentNode;
      if ( el?.host ) {
        el = el.host;
      }
    }
    return anc;
  }
}
/* eslint-enable no-inner-declarations */
