import {se, getViewWindow, throttle, LastMouse} from '../helpers.js';

export function installScrollWatcher() {
  getViewWindow().addEventListener('scroll', throttle(e => {
    const {pageXOffset:scrollX,pageYOffset:scrollY} = self;
    const {clientX,clientY} = LastMouse;
    const pageX = clientX+scrollX; 
    const pageY = clientY+scrollY;
    Object.assign(LastMouse,{pageX,pageY});
    const X = clientX;
    const Y = clientY;
    const target = document.elementFromPoint(X,Y);
    if ( target ) {
      const {left:x,top:y,width,height} = target.getBoundingClientRect();
      const packet = {
        type: 'scrollToZig',
        clientX,clientY,pageX,pageY,
        x,y,width,height,
        zig: target.getAttribute('zig') || document.activeElement.getAttribute('zig'),
        custom: true,
        originalEvent: e
      };
      if ( packet.zig ) {
        se(packet);
      } else {
        console.log(`No zig on `, target);
      }
    }
  }, 500), {passive:true});
}

