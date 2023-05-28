import {encodeModifiers} from './helpers.js';

const TOP_ORIGIN = '*';

export function se(e, data = {}) {
  let event;
  if ( !e.custom ) {
    const raw = !e.type.startsWith('key');
    let {target} = e;
    const {type, vRetargeted, inputType, clientX, clientY, pageX, pageY, key, keyCode, code, deltaMode, deltaX, deltaY, button} = e;
    let {x,y,width,height} = e;
    const modifiers = encodeModifiers(e);
    let dataId, generation, value;

    if ( target == document.documentElement || target == document.body ) return;

    if ( target.nodeType == Node.ELEMENT_NODE ) {
      if ( !target.hasAttribute('zig') ) {
        target = target.closest('[zig]');
      }

      if ( target ) {
        ([dataId, generation] = target.getAttribute('zig').split(' '));
        if ( !(target.value instanceof HTMLElement) ) {
          value = target.value;
        }
      } else {
        console.warn(`Target element has no Data Id so event cannot be projected.`);
        return;
      }
      
      if ( target.getBoundingClientRect ) {
        ({width, height, left:x, top:y} = target.getBoundingClientRect());
      }
    }

    event = {raw, type, vRetargeted, inputType, clientX, clientY, pageX, pageY, dataId, generation, key, keyCode, code, modifiers, width, height, x, y,
      deltaMode, deltaX, deltaY, value, button};

    Object.assign(event, data);

    event.originalEvent = event;
  } else {
    event = e;
    const {type, clientX, clientY, pageX, pageY, key, keyCode, code, deltaMode, deltaX, deltaY}  = event.originalEvent;
    const {
      document: {
        documentElement: {
          clientWidth: innerWidth,
          clientHeight: innerHeight
        }
      }
    } = self;
    const x = clientX || randomInside({LOR: 1/30, HIR: 1/3, SPAN: innerWidth});
    const y = clientY || randomInside({LOR: 1/30, HIR: 1/3, SPAN: innerHeight});
    event.originalEvent = {type, clientX, clientY, pageX, pageY, key, keyCode, code, deltaMode, deltaX, deltaY, x, y, X:x, Y:y};
  }

  parent.postMessage({event}, TOP_ORIGIN);
}

function inputValueDiffers(keyInputEvent, lastInput) {
  if ( keyInputEvent.target !== lastInput.target ) return true;

  return keyInputEvent.target.value !== lastInput.value;
}

export function randomInside({LOR, HIR, SPAN}) {
  const ran = Math.random();
  const HI = SPAN*HIR;
  const LO = SPAN*LOR;
  const P = ((HI - LO) * ran) + LO;
  return P;
}



