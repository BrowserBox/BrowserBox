// this file contains
// all polyfills
// found to be required
// even after Babel transpilation with preset-env 
// targeting older browsers was used

function EventTarget2() {
  
}
EventTarget2.prototype = Element.prototype;

self.EventTarget = self.EventTarget || EventTarget2;

