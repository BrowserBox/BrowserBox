import keys from '../../kbd.js';
import AppminifierTranslator from '../appminifier/translateAppminifierCRDP.js';

export const WorldName = 'PlanetZanj-Demo';

const SHORT_TIMEOUT = 1000;

const INTERACTION_EDGE = 9; // buffer of pixels where we don't trigger events

const NONE = null;
const DOM_DELTA_PIXEL = 0;
const DOM_DELTA_LINE = 1;
const DOM_DELTA_PAGE = 2;
const LINE_HEIGHT_GUESS = 22;

const BUTTON = ["left", "middle", "right"];

const SYNTHETIC_CTRL = e => keyEvent({key:'Control',originalType:e.originalType}, 2, true);

export default translator;

function translator(e, handled = {type:'case'}) {
  return AppminifierTranslator(e, handled);
}

function mouseEvent(e, deltaX = 0, deltaY = 0) { 
  return {
    command : {
      name: "Input.dispatchMouseEvent",
      params: {
        x: Math.round(e.X || 0),
        y: Math.round(e.Y || 0),
        type: "mouseWheel",
        deltaX, deltaY
      },
      requiresShot: true
    }
  };
}

function keyEvent(e, modifiers = 0, SYNTHETIC = false) {
  const id = e.key && e.key.length > 1 ? e.key : e.code;
  const def = keys[id];
  const text = e.originalType == "keypress" ? String.fromCharCode(e.keyCode) : undefined;
  modifiers = modifiers || e.modifiers;
  let type;
  if ( e.originalType == "keydown" ) {
    if ( text ) 
      type = "keyDown";
    else 
      type = "rawKeyDown";
  } else if ( e.originalType == "keypress" ) {
    type = "char";
  } else {
    type = "keyUp";
  }
  const retVal = {
    command: {
      name: "Input.dispatchKeyEvent",
      params: {
        type,
        text,
        unmodifiedText: text,
        code: def.code,
        key: def.key,
        windowsVirtualKeyCode: e.keyCode,
        modifiers,
      },
    }
  };
  if ( ! SYNTHETIC && retVal.command.params.key == 'Meta' ) {
    return [
      retVal,
      SYNTHETIC_CTRL(e)
    ];
  }
  return retVal;
}

function adjustWheelDeltaByMode(delta, mode) {
  switch(mode) {
    case DOM_DELTA_PIXEL:
      break;
    case DOM_DELTA_LINE:
      delta = delta * LINE_HEIGHT_GUESS;
      break;
    case DOM_DELTA_PAGE:
      delta = delta * self.ViewportHeight;
      break;
  }
  return delta;
}

function projectEventIntoBox({boundingBox, clientX, clientY, x, y, width, height}) {
  const {x:newX, y:newY, width:Width, height:Height,innerWidth:RemoteIW, innerHeight:RemoteIH} = boundingBox;
  const originalBoxXRatio = (clientX - x) / width;
  const originalBoxYRatio = (clientY - y) / height;
  const X = bound(newX + Width*originalBoxXRatio, RemoteIW);
  const Y = bound(newY + Height*originalBoxYRatio, RemoteIH);
  return {X,Y};
}

function bound(val, upper) {
  // make sure we are not negative
  val = Math.max(val,INTERACTION_EDGE);
  if ( val > upper - INTERACTION_EDGE ) {
    val = upper - INTERACTION_EDGE;
  }
  return val;
}
