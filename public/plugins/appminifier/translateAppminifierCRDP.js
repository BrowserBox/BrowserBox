  import {DEBUG} from '../../voodoo/src/common.js';
  import BuiltinTranslator from '../../translateVoodooCRDP.js';
  import {WorldName} from '../../translateVoodooCRDP.js';
  import keys from '../../kbd.js';

  //export const WorldName = 'PlanetZanj-Appminifier';
  export const Overrides = new Set([
    'mousedown', 'mouseup', 'pointerdown', 'pointerup', 'wheel',
    'mousemove', 'pointermove'
  ]);

  const SHORT_TIMEOUT = 1000;

  const INTERACTION_EDGE = 2; // buffer of pixels where we don't trigger events

  const NONE = null;
  const DOM_DELTA_PIXEL = 0;
  const DOM_DELTA_LINE = 1;
  const DOM_DELTA_PAGE = 2;
  const LINE_HEIGHT_GUESS = 22;

  const BOXCACHE = new Map();

  const BUTTON = ["left", "middle", "right"];

  const SYNTHETIC_CTRL = e => keyEvent({key:'Control',originalType:e.originalType}, 2, true);

  export default translator;

  function translator(e, handled = {type: 'case'}) {
    handled.type = handled.type || 'case';
    const TranslatedE = BuiltinTranslator(e, handled);
    const alreadyHandled = handled.type == 'case';
    const weDoNotOverrideHandling = ! Overrides.has(e.type);
    if ( alreadyHandled && weDoNotOverrideHandling ) {
      return TranslatedE;
    }
    switch(e.type) {
      /** overrides **/
        case "wheel":
          return NONE;
        case "mousemove": case "pointermove":
          return NONE; 
        case "mousedown": case "mouseup": 
        case "pointerdown": case "pointerup": {
          const {generation,dataId,x,y,width,height,clientX,clientY, modifiers,button} = e;
          const mouseButton = BUTTON[button] || "none";
          const key = `${dataId}:${generation}`;
          let boundingBox;
          if ( BOXCACHE.has(key) ) {
            boundingBox = BOXCACHE.get(key);
            const {X,Y} = projectEventIntoBox({boundingBox, clientX, clientY, x, y, width, height}); 
            return {
              command : {
                name: "Input.emulateTouchFromMouseEvent",
                params: {
                  x:Math.round(X),
                  y:Math.round(Y),
                  type: e.type.endsWith("down") ? "mousePressed" :
                    e.type.endsWith("up") ? "mouseReleased" : "mouseMoved",
                  button: mouseButton, 
                  clickCount: !e.type.endsWith("move") ? 1 : 0,
                  modifiers
                },
                requiresShot: e.type.endsWith("down")
              }
            };
          } else { 
            BOXCACHE.clear();
            return [
              {
                command: {
                  name: "Runtime.evaluate",
                  params: {
                    expression: `getBoundingBox({generation:"${generation}",dataId:"${dataId}"});`,
                    awaitPromise: true,
                    contextId: e.contextId,
                    timeout: SHORT_TIMEOUT,
                    returnByValue: true
                  },
                },
              },
              (resp) => {
                if ( resp && resp.result && resp.result.value ) {
                  ({boundingBox} = resp.result.value);
                }
                if ( boundingBox ) {
                  BOXCACHE.set(key, boundingBox);
                  const {X,Y} = projectEventIntoBox({boundingBox, clientX, clientY, x, y, width, height}); 
                  return {
                    command : {
                      name: "Input.emulateTouchFromMouseEvent",
                      params: {
                        x:Math.round(X),
                        y:Math.round(Y),
                        type: e.type.endsWith("down") ? "mousePressed" :
                          e.type.endsWith("up") ? "mouseReleased" : "mouseMoved",
                        button: mouseButton, 
                        clickCount: !e.type.endsWith("move") ? 1 : 0,
                        modifiers
                      },
                      requiresShot: e.type.endsWith("down")
                    }
                  };
                }
              }
            ];
          }
          break;
        }
      /** new events handled by Appminifier **/
        case "demo-submit": {
          return {
            command: "Demo.formSubmission",
            params: e
          }
        }
        case "getDOMTree": {
          const force = e.force;
          return [
            {
              command: {
                isZombieLordCommand: true,
                name: "Connection.getContextIdsForActiveSession",
                params: {
                  worldName: WorldName
                }
              }
            },
            ({contextIds: contextIds = []}) => contextIds.map(contextId => ({
              command: {
                name: "Runtime.evaluate",
                params: {
                  expression: `getDOMTree(${force});`,
                  contextId: contextId,
                  timeout: SHORT_TIMEOUT
                },
              }
            }))
          ];
        }
        case "scrollToEnd": {
          // if we use emulateTouchFromMouseEvent we need a button value
          const deltaX = adjustWheelDeltaByMode(0, DOM_DELTA_PAGE);
          const deltaY = adjustWheelDeltaByMode(0.5, DOM_DELTA_PAGE);
          const retVal = mouseEvent(e.originalEvent, deltaX, deltaY);
          return retVal;
          break;
        }
        case "scrollToZig": {
          const {zig} = e;
          if ( ! zig ) return;
          const {x,y,width,height,clientX,clientY, pageX,pageY} = e;
          const [dataId,generation] = zig.split(' ');
          DEBUG.val >= DEBUG.med && console.log(`scroll to zig ${dataId} ${generation}`);
          return [
            {
              command: {
                name: "Runtime.evaluate",
                params: {
                  expression: `getBoundingBox({generation:"${generation}",dataId:"${dataId}"});`,
                  awaitPromise: true,
                  contextId: e.contextId,
                  timeout: SHORT_TIMEOUT,
                  returnByValue: true
                },
              },
            }
             /**
              (resp) => {
                let boundingBox;
                if ( resp && resp.result && resp.result.value ) {
                  ({boundingBox} = resp.result.value);
                }
                const deltaY = boundingBox.y - boundingBox.scrollTop;
                if ( !! boundingBox ) {
                  const {X,Y} = projectEventIntoBox({boundingBox, clientX, clientY, x, y, width, height}); 
                  return mouseEvent({X,Y}, 0, deltaY); 
                }
              }
             **/
          ];
          break;
        }
        case "typing-clearAndInsertValue": {
          if ( ! e.value ) return;
          return   {
            command: {
              name: "Runtime.evaluate",
              params: {
                expression: `clearFocusedInputAndInsertValue("${e.encodedValue}");`,
                includeCommandLineAPI: false,
                userGesture: true,
                contextId: e.contextId,
                timeout: SHORT_TIMEOUT,
                awaitPromise: true
              },
              requiresShot: false
            }
          }
          break;
        }
        case "enableAppminifier": {
          return {
            command: {
              isZombieLordCommand: true,
              name: "Connection.enableMode",
              params: {
                pluginName: 'appminifier'
              }
            }
          };
        }
      default: {
        if ( ( !!e.command && !!e.command.name ) || Array.isArray(e) ) {
          handled.type = 'default';
          return e;
        } else {
          handled.type = 'unhandled';
          return;
        }
      }
    }
  }

  function mouseEvent(e, deltaX = 0, deltaY = 0) { 
    return {
      command : {
        name: "Input.dispatchMouseEvent",
        params: {
          x: Math.round(e.X || 0),
          y: Math.round(e.Y || 0),
          type: e.type || "mouseWheel",
          deltaX, deltaY
        },
        requiresShot: true
      }
    };
  }

  function keyEvent(e, modifiers = false, SYNTHETIC = false) {
    DEBUG.val >= DEBUG.med && console.log(e);
    const id = e.key && e.key.length > 1 ? e.key : e.code;
    const def = keys[id];
    const text = e.originalType == "keypress" ? String.fromCharCode(e.keyCode) : undefined;
    modifiers = Number.isInteger(modifiers) ? modifiers : 
      Number.isInteger(e.originalEvent && e.originalEvent.modifiers) ? e.originalEvent.modifiers :
      Number.isInteger(e.modifiers) ? e.modifiers : 0;
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
