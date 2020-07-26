import {DEBUG, logit} from './common.js';

export const controlChars = new Set([
  "Enter", "Backspace", "Control", "Shift", "Alt", "Meta", "Space", "Delete",
  "ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", "Tab"
]);

export default function transformEvent(e) {
  const transformedEvent = {
    type: e.type
  };
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
        
        if ( value) {
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
        const coords = getBitmapCoordinates(originalEvent);
        Object.assign(transformedEvent, coords, {scale});
        break;
      }
      case "select": {
        const value = originalEvent.target.value; 
        const executionContext = synthetic.state.waitingExecutionContext;
        Object.assign(transformedEvent, {value, executionContext});
        break;
      }
      case "window-bounds": {
        const {width, height, targetId} = synthetic;
        DEBUG.val && console.log(width,height,targetId);
        Object.assign(transformedEvent, {width, height,targetId});
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
        Object.assign(transformedEvent, {width, height});
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
        break;
      }
      case "getElementInfo": {
        transformedEvent.data = e.data;
        const {bitmapX:clientX, bitmapY:clientY} = getBitmapCoordinates(transformedEvent.data);
        Object.assign(transformedEvent.data, {clientX,clientY});
        break;
      }
      case "touchcancel": {
        break;
      }
      case "respond-to-modal" : {
        Object.assign(transformedEvent, e);
        break;
      }
      case "isSafari": {
        break;
      }
      case "isFirefox": {
        break;
      }
      case "newIncognitoTab": {
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
        const id = event.key && event.key.length > 1 ? event.key : event.code;
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
        const coords = getBitmapCoordinates(event);
        Object.assign(transformedEvent, coords, {button});
        break;
      }
    }
  }
  DEBUG.val >= DEBUG.med && console.log(transformedEvent);
  return transformedEvent;
}

export function getBitmapCoordinates(event, scale = 1) {
  const {clientX,clientY} = event;
  const bitmap = event.target;
  let coordinates;

  if ( bitmap ) {
    const {
      left:parentX, top:parentY, 
      width:elementWidth, height:elementHeight
    } = bitmap.getBoundingClientRect();

    const scaleX = bitmap.width / elementWidth * scale;
    const scaleY = bitmap.height / elementHeight * scale;

    coordinates = {
      bitmapX: (clientX - parentX),
      bitmapY: (clientY - parentY)
    };

    if ( DEBUG.val > DEBUG.high ) {
      const dpi = window.devicePixelRatio;
      const info = {coordinates, parentX, parentY, clientX, clientY, scaleX, scaleY, dpi };

      logit(info);
    }
  } else {
    coordinates = {clientX,clientY};
  }

  return coordinates;
}
