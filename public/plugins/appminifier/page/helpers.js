export const LastMouse = {x:0,y:0,target:document.documentElement,clientX:0,clientY:0,pageX:0,pageY:0};
export const LastInput = {target:null, value:''};
export * from './serializeEvent.js';

export function getViewWindow() {
  return window;
}
 
export function throttle(callback, limit) {
  var wait = false;       
  return function (...args) {    
    if (!wait) {          
      try {
        callback.call(this, ...args);    
      } catch(e){
        console.warn(e);
      }
      wait = true;        
      setTimeout(function () {  
        wait = false;     
      }, limit);
    }
  }
}

export function encodeModifiers(originalEvent) {
  let modifiers = 0;
  if (originalEvent.altKey ) {
    modifiers += 1;
  }
  if (originalEvent.ctrlKey || originalEvent.metaKey) {
    modifiers += 2;
  }
  if (originalEvent.metaKey ) {
    modifiers += 4;
  } 
  if (originalEvent.shiftKey ) {
    modifiers += 8;
  }

  return modifiers;
}

