import {DEBUG, logit} from './common.js';

export const getKeyId = event => event.key && event.key.length > 1 ? event.key : event.code;
export const controlChars = new Set([]);
/*
  "Enter", "Backspace", "Control", "Shift", "Alt", "Meta", "Space", "Delete",
  "ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", "Tab"
]);
*/

export default function transformEvent(e, {scale}, bounds) {
  const transformedEvent = {
    type: e.type,
    forceFrame: e.forceFrame
  };
  const {source} = e;
  if ( !! source ) {
    transformedEvent.source = source;
  }
  let event, synthetic, originalEvent;
  if (e.synthetic) {
    synthetic = e;
    originalEvent = e.event;
    let form;
    if ( originalEvent ) {
      form = originalEvent.target && originalEvent.target.matches && originalEvent.target.matches('form') ? originalEvent.target : null;
      transformedEvent.originalType = originalEvent.type;
      transformedEvent.originalEvent = originalEvent;
    }
    switch(synthetic.type) {
      case "actionOnClicked": {
        const {data} = synthetic;
        Object.assign(transformedEvent, {data});
        break;
      }
      case "favicon": {
        throw new TypeError(`Client can not request favicons from back-end`);
        const {targetId} = synthetic;
        Object.assign(transformedEvent, {targetId});
        break;
      }
      case "auth-response": {
        const {authResponse, requestId} = synthetic;
        Object.assign(transformedEvent, {authResponse, requestId});
        break;
      }
      case "typing": {
        // get (composed) characters created

        let data = synthetic.data;

        Object.assign(transformedEvent, {
          characters: data
        });
        break;
      }
      case "typing-syncValue": 
      case "typing-clearAndInsertValue": {
        const {value,contextId} = synthetic;
        
        let encodedValue;
        
        if ( value != null && value != undefined ) {
          encodedValue = btoa(unescape(encodeURIComponent(value)));
        }

        Object.assign(transformedEvent, {
          encodedValue,
          value,
          contextId
        });
        break;
      }
      case "typing-deleteContentBackward": {
        let encodedValueToDelete;
        
        if ( synthetic.valueToDelete ) {
          encodedValueToDelete = btoa(unescape(encodeURIComponent(synthetic.valueToDelete)));
        }
        
        Object.assign(transformedEvent, {
          encodedValueToDelete,
          contextId: synthetic.contextId
        });
        break;
      }
      case "url-address": {
        // get URL address
        const address = synthetic.url;
        Object.assign(transformedEvent, {address});
        break;
      }
      case "search-bar": {
        // get URL address
        const search = originalEvent.target.search.value;
        Object.assign(transformedEvent, {search});
        break;
      }
      case "history": {
        // get button
        const action = form.clickedButton.value;
        Object.assign(transformedEvent, { action } );
        break;
      }
      case "touchscroll": {
        const {deltaX, deltaY, bitmapX, bitmapY, contextId} = synthetic;
        Object.assign(transformedEvent, {deltaX, deltaY, bitmapX, bitmapY, contextId});
        break;
      }
      case "zoom": {
        const {scale} = synthetic;
        const coords = getBitmapCoordinates(originalEvent, scale, bounds);
        Object.assign(transformedEvent, coords, {scale});
        break;
      }
      case "select": {
        const value = originalEvent.target.value; 
        const executionContext = synthetic.state.waitingExecutionContext;
        Object.assign(transformedEvent, {value, executionContext});
        break;
      }
      case "activate-target": {
        const {targetId, source} = synthetic;
        DEBUG.val > DEBUG.med && console.log({activateTarget:{targetId}});
        Object.assign(transformedEvent, {targetId, source});
        break;
      }
      case "window-bounds": {
        const {forceFrame, resetRequested, width, height, targetId} = synthetic;
        DEBUG.val > DEBUG.med && console.log({windowBounds:{width,height,targetId}});
        Object.assign(transformedEvent, {width, height,targetId, resetRequested, forceFrame});
        break;
      }
      case "window-bounds-preImplementation": {
        // This is here until Browser.getWindowForTarget and Browser.setWindowBounds come online
        let width, height;
        if ( synthetic.width !== undefined && synthetic.height !== undefined ) {
          ({width,height} = synthetic);
        } else {
          ({width:{value:width}, height:{value:height}} = form);
        }

        const {targetId, mobile, forceFrame, resetRequested} = synthetic;
        Object.assign(transformedEvent, {width, height, mobile, targetId, resetRequested, forceFrame});
        break;
      }
      case "user-agent": {
        const {userAgent, platform, acceptLanguage} = synthetic;
        Object.assign(transformedEvent, {userAgent, platform, acceptLanguage});
        break;
      }
      case "hide-scrollbars": {
        break;
      }
      case "canKeysInput": {
        break; 
      }
      case "getFavicon": {
        throw new TypeError(`Client can not request favicons from back-end`);
        const {targetId} = synthetic;
        Object.assign(transformedEvent, {targetId});
        break;
      }
      case "getElementInfo": {
        transformedEvent.data = e.data;
        const {bitmapX:clientX, bitmapY:clientY} = getBitmapCoordinates(transformedEvent.data, scale, bounds);
        Object.assign(transformedEvent.data, {clientX,clientY});
        DEBUG.debugCopyPaste && console.log({clientX,clientY});
        break;
      }
      case "touchcancel": {
        break;
      }
      case "respond-to-modal" : {
        DEBUG.debugModal && console.log("Respond to modal", e);
        Object.assign(transformedEvent, e);
        break;
      }
      case "isSafari": {
        break;
      }
      case "isMobile": {
        break;
      }
      case "isFirefox": {
        break;
      }
      case "newIncognitoTab": {
        const address = synthetic.url || 'about:blank';
        Object.assign(transformedEvent, {address});
        break; 
      }
      case "clearAllPageHistory": {
        break; 
      }
      case "clearCache": {
        break; 
      }
      case "clearCookies": {
        break; 
      }
      default: {
        console.warn(`Unknown command ${JSON.stringify({synthetic})}`);
        break;
      }
    }
  } else if (e.raw || e.custom) {
    Object.assign(transformedEvent, e);
  } else {
    event = e;
    transformedEvent.originalEvent = e;
    switch(event.type) {
      case "keypress":
      case "keydown":
      case "keyup": {
        const id = getKeyId(event);
        if ( controlChars.has(id) ) {
          event.type == "keypress" && event.preventDefault && event.preventDefault();
          transformedEvent.synthetic = true;
          transformedEvent.originalType = event.type;
          transformedEvent.type = "control-chars";
          transformedEvent.key = event.key;
          transformedEvent.code = event.code;
          transformedEvent.keyCode = event.keyCode;
          DEBUG.val >= DEBUG.med && console.log(transformedEvent);
        } else if ( event.code == "Unidentified" || event.key == "Unidentified" ) {
          transformedEvent.key = event.key;
          transformedEvent.code = event.code;
        } else {
          transformedEvent.synthetic = true;
          transformedEvent.originalType = event.type;
          transformedEvent.type = event.type;
          transformedEvent.key = event.key;
          transformedEvent.code = event.code;
          transformedEvent.keyCode = event.keyCode;
        }
        break;
      }
      case "wheel":
      case "mousemove":
      case "mousedown":
      case "mouseup": 
      case "pointermove":
      case "pointerdown":
      case "pointerup": {
        // get relevant X, Y coordinates and element under point
        // also get any relevant touch points and pressures and other associated
        // pointer or touch metadata or properties
        const {button} = event;
        const coords = getBitmapCoordinates(event, scale, bounds);
        Object.assign(transformedEvent, coords, {button});
        break;
      }
      case "touchstart": 
      case "touchmove":
      case "touchend": {
        const {touches} = event; 
        const touchPoints = Array.from(touches).map(touch => {
          const {rotationAngle, radiusX, radiusY, force} = touch;
          const {clientX,clientY} = getBitmapCoordinates(touch, scale, bounds);
          return {
            id: touch.identifier,
            x: clientX,
            y: clientY,
            radiusX, radiusY,
            rotationAngle,
            force
          }
        });
        Object.assign(transformedEvent, {touchPoints});
        break;
      }
    }
  }
  DEBUG.val >= DEBUG.med && console.log(transformedEvent);
  return transformedEvent;
}

export function getBitmapCoordinates(event, scale = 1, bounds) {
  const {clientX,clientY} = event;
  const bitmap = event.target;
  let coordinates;

  DEBUG.debugBitmapCoordConversion && console.log({clientX, clientY, bitmap, event});
  if ( bitmap ) {
    const {
      left:parentX, top:parentY, 
      width:bitMapWidth, height: bitMapHeight,
    } = bitmap.getBoundingClientRect();

    const localViewport = {
      x: (clientX - parentX)/scale,
      y: (clientY - parentY)/scale
    }

    const remoteViewport = {
      x: Math.max(0,Math.min(localViewport.x, bounds.x)),
      y: Math.max(0,Math.min(localViewport.y, bounds.y))
    }

    DEBUG.debugBitmapCoordConversion && console.log({localViewport, remoteViewport, scale});

    coordinates = {
      bitmapX: remoteViewport.x,
      bitmapY: remoteViewport.y
    };

    if ( DEBUG.val > DEBUG.high ) {
      const info = {coordinates, parentX, parentY, clientX, clientY, scaleX, scaleY, dpi };

      logit(info);
    }
  } else {
    coordinates = {bitmapX: clientX,bitmapY: clientY, clientX, clientY};
  }

  return coordinates;
}
