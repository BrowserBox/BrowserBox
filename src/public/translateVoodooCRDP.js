import {DEBUG, FRAME_CONTROL, deviceIsMobile} from './voodoo/src/common.js';
import keys from './kbd.js';

export const WorldName = 'PlanetZanj';

const CLASS_A_MODAL_TYPES = new Set([
  "alert",
  "confirm",
  "prompt",
  "beforeunload"
]);

const SHORT_TIMEOUT = 1000;

const MIN_DELTA = 40;
const MIN_PIX_DELTA = 8;
const THRESHOLD_DELTA = 1;
const DOM_DELTA_PIXEL = 0;
const DOM_DELTA_LINE = 1;
const DOM_DELTA_PAGE = 2;
const LINE_HEIGHT_GUESS = 32;

const SYNTHETIC_CTRL = e => keyEvent({key:'Control',code:'Control', originalType:e.originalType,originalEvent:{ctrlKey:true}}, true);

export default translator;

// Global variable to store the current modifier state
let currentModifiers = 0;

// Function to clear the modifier state
export function clearModifiers() {
  currentModifiers = 0;
}

function keyEvent(e, SYNTHETIC = false, straight = false) {
  // Use the existing or passed key definitions
  const def = straight ? e :
    e.key.length == 1 ? keys[e.key] : (keys[e.code] || keys[e.key]);

  if ( ! def ) {
    console.warn(new Error(`Unknown key:${ e.key }`), e); 
    if ( e.originalEvent.type == 'keydown' ) {
      const retVal = {
        command: {
          name: "Input.insertText",
          params: {
            text: e.key,
          },
        }
      }
      return retVal;
    } else {
      return;
    }
  }

  // If definition doesn't match the event key, throw an error
  if (def.key !== e.key) {
    console.warn(new Error(`Mismatch: ${def.key} fails original ${e.key}`), def, e);
  }

  // Update the current modifiers state
  if ( e.originalEvent ) {
    updateModifiers(e.originalEvent);
  }

  // Get the description based on key definitions (inspired by Puppeteer)
  const description = getKeyDescription(e, def);

  // Determine event type ('keyDown', 'rawKeyDown', 'keyUp')
  let type;
  if (e.originalType === "keydown") {
    type = description.text ? "keyDown" : "rawKeyDown";
  } else if (e.originalType === "keypress") {
    type = "char";
  } else {
    type = "keyUp";
  }

  //console.log({description, currentModifiers, e});

  // Construct the return command object with dispatchKeyEvent
  const retVal = {
    command: {
      name: "Input.dispatchKeyEvent",
      params: {
        type,
        text: description.text, // Can be empty based on modifier states
        code: description.code,
        key: description.key,
        windowsVirtualKeyCode: description.keyCode,
        modifiers: currentModifiers,
      },
      requiresShot: ["Enter", "Tab", "Delete"].includes(e.key),
    }
  };

  if ( description.location ) {
    retVal.command.params.location = description.location;
  }

  // Handle special case for Meta key
  if (false && !SYNTHETIC && retVal.command.params.key === 'Meta') {
    return [
      retVal,
      SYNTHETIC_CTRL(e)
    ];
  }

  //console.log({ e, def, retVal });
  return retVal;
}

// Function to update the global modifier state based on the event
function updateModifiers(originalEvent) {
  clearModifiers();
  if (originalEvent.altKey) currentModifiers |= 1;   // Alt
  if (originalEvent.ctrlKey) currentModifiers |= 2;  // Control
  if (originalEvent.metaKey) currentModifiers |= 4;  // Meta
  if (originalEvent.shiftKey) currentModifiers |= 8; // Shift
}

// Based on Puppeteer's key description logic
function getKeyDescription(e, def) {
  const shift = currentModifiers & 8; // Check if Shift is active
  const description = {
    key: def.key || '',
    keyCode: def.keyCode || 0,
    code: def.code || '',
    text: def.text || '',
    location: def.location || 0,
  };

  if (shift && def.shiftKey) {
    description.key = def.shiftKey;
    description.keyCode = def.shiftKeyCode || description.keyCode;
    description.text = def.shiftText || def.shiftKey || '';
  } else if (description.key.length === 1) {
    description.text = description.key;
  }

  if (currentModifiers != 8 && currentModifiers != 0 || e.type == 'keyup') {
    description.text = ''; // If other modifiers (not Shift) are active, clear text
  }

  return description;
}

function translator(e, handled = {type:'case'}) {
  handled.type = handled.type || 'case';
  switch(e.type) {
    case "touchcancel": {
      return {
        command : {
          name: "Input.dispatchTouchEvent",
          params: {
            type: "touchCancel"
          },
        }
      };
    }
    case "mousedown": case "mouseup": case "mousemove": 
    case "pointerdown": case "pointerup": case "pointermove": {
      let button = "none";
      if ( ! e.type.endsWith("move") ) {
        if ( e.button == 0 ) {
          button = "left";
        } else {
          button = "right";
        }
      }
      return {
        command : {
          name: !deviceIsMobile() ? 
            "Input.dispatchMouseEvent"
              :
            "Input.emulateTouchFromMouseEvent",
          /*name: "Input.dispatchMouseEvent",*/
          params: {
            x: Math.round(e.bitmapX),
            y: Math.round(e.bitmapY),
            type: e.type.endsWith("down") ? "mousePressed" :
              e.type.endsWith("up") ? "mouseReleased" : "mouseMoved",
            button,
            clickCount: !e.type.endsWith("move") ? 1 : 0,
            modifiers: encodeModifiers(e.originalEvent)
          },
          requiresShot: ! e.originalEvent.noShot && e.type.endsWith("down"),
          ignoreHash: ! e.originalEvent.noShot && e.type.endsWith("down") 
        }
      };
    }
    case "touchstart": case "touchmove": case "touchend": {
      const {touchPoints} = e;
      return {
        command: {
          name: "Input.dispatchTouchEvent",
          params: {
            type: e.type.endsWith('move') ? 'touchMove' :
              e.type.endsWith('start') ? 'touchStart' : 'touchEnd',
            modifiers: encodeModifiers(e.originalEvent),
            touchPoints,
          }
        }
      }
      break;
    }
    case "wheel": {
      // if we use emulateTouchFromMouseEvent we need a button value
      const deltaMode = e.originalEvent.deltaMode;
      const deltaX = adjustWheelDeltaByMode(e.originalEvent.deltaX, deltaMode);
      const deltaY = adjustWheelDeltaByMode(e.originalEvent.deltaY, deltaMode);
      const {contextId} = e;
      const clientX = 0;
      const clientY = 0
      const deltas = {deltaX,deltaY,clientX,clientY};
      let retVal;
      if ( DEBUG.ensureScroll && (deltaX > MIN_DELTA || deltaY > MIN_DELTA) ) {
        const retVal1 = {
          command: {
            name: "Runtime.evaluate",
            params: {
              expression: `self.ensureScroll(${JSON.stringify(deltas)});`,
              includeCommandLineAPI: false,
              userGesture: true,
              contextId,
              timeout: SHORT_TIMEOUT
            }
          }
        };
        const retVal2 = mouseEvent(e, deltaX, deltaY);
        retVal = [retVal1,retVal2];
      } else {
        retVal = mouseEvent(e, deltaX, deltaY);
      }
      return retVal;
    }
    case "actionOnClicked": {
      const {data} = e;
      return {
        command: {
          isZombieLordCommand: true,
          name: "Connection.extensions.actionOnClicked",
          params: {
            ...data
          }
        }
      }
    }
    case "favicon": {
      throw new TypeError(`Client cannot request favicons from bank-end`);
      let {targetId} = e;
      return {
        command: {
          isZombieLordCommand: true,
          name: "Connection.getFavicon",
          params: {
            targetId
          }
        }
      }
    }
    case "auth-response": {
      const {requestId, sessionId, authResponse} = e;
      return {
        command: {
          name: "Fetch.continueWithAuth",
          params: {
            requestId,
            authChallengeResponse: authResponse
          }
        }
      };
    }
    case "resample-imagery": {
      const {down, up, averageBw} = e;
      return {
        command: {
          isZombieLordCommand: true,
          name: "Connection.resampleImagery",
          params: {
            averageBw, down , up
          }
        }
      }
    }
    case "control-chars": {
      return keyEvent(e);
    }
    case "keydown":
      if ( !e.key || ! e.code ) {
        return;
      } else if ( e.key == "Unidentified" || e.code == "Unidentified" ) {
        return;
      } else {
        return keyEvent(e);
      }
    case "keyup":
      if ( !e.key || ! e.code ) {
        return;
      } else if ( e.key == "Unidentified" || e.code == "Unidentified" ) {
        return;
      } else {
        return keyEvent(e);
      }
    case "keypress": {
      if ( e.code == "Unidentified" ) {
        if( e.key.length ) {
          const text = e.key;
          return {
            command: {
              name: "Input.insertText",
              params: {
                text
              },
              requiresShot: true,
              /*ignoreHash: true*/
            }
          }
        } else return;
      } else if ( e.key == "Unidentified" ) {
        if( e.code.length ) {
          const text = e.code;
          return {
            command: {
              name: "Input.insertText",
              params: {
                text
              },
              requiresShot: true,
              /*ignoreHash: true*/
            }
          }
        } else return;
      } else return keyEvent(e);
    };
    case "typing": {
      if ( e.isComposing || ! e.characters ) return;
      else return {
        command: {
          name: "Input.insertText",
          params: {
            text: (e.characters || '') 
          },
          requiresShot: true,
          /*ignoreHash: true*/
        }
      }
    }
    case "typing-syncValue": {
      return {
        command: {
          name: "Runtime.evaluate",
          params: {
            expression: `syncFocusedInputToValue("${e.encodedValue}");`,
            includeCommandLineAPI: false,
            userGesture: true,
            contextId: e.contextId,
            timeout: SHORT_TIMEOUT,
          },
          requiresShot: true,
          /*ignoreHash: true*/
        }
      }
    }
    case "typing-deleteContentBackward": {
      if ( ! e.encodedValueToDelete ) return;
      else return {
        command: {
          name: "Runtime.evaluate",
          params: {
            expression: `fromFocusedInputDeleteLastOccurrenceOf("${e.encodedValueToDelete}");`,
            includeCommandLineAPI: false,
            userGesture: true,
            contextId: e.contextId,
            timeout: SHORT_TIMEOUT
          },
          requiresShot: true
        }
      }
    }
    case "url-address": {
      return {
        command: {
          name: "Page.navigate",
          params: {
            url: e.address
          },
          source: e.source,
          requiresLoad: true,
          requiresShot: true,
          requiresTailShot: true
        }
      }
    }
    case "setDocument": {
      const {frameId,sessionId,html} = e;
      if ( frameId ) {
        return {
          command: {
            name: "Page.setDocumentContent",
            params: {
              html, frameId, sessionId
            }, 
            requiresShot: true,
          }
        };
      } else {
        return {chain:[
          {
            command: {
              name: "Page.getFrameTree",
              params: {}
            }
          },
          ({frameTree:{frame:{id:frameId}}}) => {
            return {
              command: {
                name: "Page.setDocumentContent",
                params: {
                  html, frameId
                }, 
                requiresShot: true,
              }
            };
          }
        ]};
      }
    }
    case "history": {
      switch(e.action) {
        case "reload": case "stop": {
          return {
            command: {
              requiresLoad: e.action == "reload",
              requiresShot: e.action == "reload",
              name: e.action == "reload" ? "Page.reload" : "Page.stopLoading",
              params: {},
            }
          };
        }
        case "back": case "forward": {
          return {chain:[
            {
              command: {
                name: "Page.getNavigationHistory",
                params: {}
              }
            },
            ({currentIndex, entries}) => {
              const intendedEntry = entries[currentIndex + (e.action == "back" ? -1 : +1 )]; 
              /*
                const intendedEntry = {
                  id: Math.max(Math.min(currentIndex + (e.action == "back" ? -1 : +1 ), entries.length-1), 0)
                };
              */
              DEBUG.debugHistory && console.log({historyEntries:entries, currentIndex, intendedEntry});
              if ( intendedEntry ) {
                return {
                  command: {
                    name: "Page.navigateToHistoryEntry",
                    params: {
                      entryId: intendedEntry.id
                    }, 
                    /*
                      requiresLoad: true,
                      requiresShot: true,
                      requiresTailShot: true
                    */
                  }
                };
              } 
            }
          ]};
        }
        default: {
          throw new TypeError(`Unkown history action ${e.action}`);
        }
      }
    }
    case "touchscroll": {
      let {deltaX,deltaY,bitmapX:clientX,bitmapY:clientY,contextId} = e;
      // only one scroll direction at a time
      if ( Math.abs(deltaY) > Math.abs(deltaX) ) {
        deltaX = 0;
        if ( Math.abs(deltaY) > 0.2 * self.ViewportHeight ) {
          deltaY = Math.round(5.718 * deltaY);
        }
      } else {
        deltaY = 0;
        if ( Math.abs(deltaX) > 0.3 * self.ViewportWidth ) {
          deltaX = Math.round(5.718 * deltaX);
        }
      }
      clientX = Math.round(clientX);
      clientY = Math.round(clientY);
      const deltas = {deltaX,deltaY,clientX,clientY};
      let retVal;
      if ( DEBUG.ensureScroll ) {
        const retVal1 = {
          command: {
            name: "Runtime.evaluate",
            params: {
              expression: `self.ensureScroll(${JSON.stringify(deltas)});`,
              includeCommandLineAPI: false,
              userGesture: true,
              contextId,
              timeout: SHORT_TIMEOUT
            }
          }
        };
        const retVal2 = mouseEvent(e, deltaX, deltaY);
        retVal = [retVal1,retVal2];
      } else {
        retVal = mouseEvent(e, deltaX, deltaY);
      }
      return retVal;
    }
    case "zoom": {
      /** retval does not work. Expanding pinch is OK, but contracting seems to fail **/
      /*
      const retVal = {
        command: {
          name: "Input.synthesizePinchGesture",
          params: {
            relativeSpeed: 300,
            scaleFactor: e.scale,
            gestureSourceType: "touch",
            x: Math.round(e.bitmapX),
            y: Math.round(e.bitmapY)
          },
          requiresShot: true,
          requiresExtraWait: true,
          extraWait: 300
        }
      };
      */
      /** so we are using emulation and multiplying the scale factor in the event listener **/
      const retVal2 = {
        command: {
          name: "Emulation.setPageScaleFactor",
          params: {
            pageScaleFactor: e.scale
          },
          requiresShot: true,
          requiresExtraWait: true,
          extraWait: 300
        }
      }
      return retVal2;
    }
    case "select": {
      const retVal = {
        command : {
          name: "Runtime.evaluate",
          params: {
            expression: `self.setSelectValue("${e.value}");`,
            includeCommandLineAPI: false,
            userGesture: true,
            contextId: e.executionContext,
            timeout: 1000
          },
          requiresShot: true,
          requiresExtraWait: true,
          extraWait: 300
        }
      };
      return retVal;
    }
    case "activate-target": {
      let {targetId, source} = e;
      const retVal = {
        command: {
          isZombieLordCommand: true,
          name: "Connection.activateTarget",
          params: {
            targetId, source
          },
          forceFrame: e.forceFrame
        }
      };
      return retVal;
    }
    case "window-bounds": {
      let {forceFrame,width,height,mobile,resetRequested, targetId} = e;
      width = parseInt(width);
      height = parseInt(height);
      const retVal = {chain:[
        {
          command: {
            name: "Browser.getWindowForTarget",
            params: {targetId},
          }
        },
        ({windowId, bounds}) => {
          if ( bounds.width == width && bounds.height == height ) return;
          const retVal = {
            command: {
              name: "Browser.setWindowBounds",
              params: {
                windowId,
                bounds: {width, height, mobile},
                resetRequested
              },
              requiresWindowId: true,
              forceFrame
            }
          };
          return retVal;
        }
      ]};
      if ( DEBUG.blockClientFormFactorCommands ) return;
      return retVal;
    }
    case "window-bounds-preImplementation": {
      let {forceFrame,width,height,mobile,resetRequested, targetId} = e;
      width = parseInt(width);
      height = parseInt(height);
      const retVal = {
        command: {
          name: "Emulation.setDeviceMetricsOverride",
          params: {
            width,
            height,
            mobile, 
            deviceScaleFactor:1,
            /*
            ...(mobile ? {
              screenOrientation: {
                angle: 90,
                type: 'landscapePrimary'
              }
            } : {}),
            */
            resetRequested, 
          },
          requiresShot: true,
          forceFrame
        },
      };
      if ( DEBUG.blockClientFormFactorCommands ) return;
      return retVal;
    }
    case "user-agent": {
      const {userAgent, platform, acceptLanguage} = e;
      const retVal = {
        command: {
          name: "Emulation.setUserAgentOverride",
          params: {
            userAgent, platform,
            acceptLanguage, 
          }
        }
      }
      return retVal;
    }
    case "hide-scrollbars": {
      const retVal = {
        command: {
          name: "Emulation.setScrollbarsHidden",
          params: {
            hidden: true
          }
        }
      }
      return retVal;
    }
    case "buffered-results-collection": {
      return e;
    }
    case "doShot": {
      return {
        command: {
          isZombieLordCommand: true,
          name: "Connection.doShot",
          params: {},
          forceFrame: e.forceFrame
        }
      };
    }
    case "canKeysInput": {
      return {chain:[
        {
          command: {
            isZombieLordCommand: true,
            name: "Connection.getContextIdsForActiveSession",
            params: {
              worldName: WorldName
            }
          }
        },
        ({contextIds}) => contextIds.map(contextId => ({
          command: {
            name: "Runtime.evaluate",
            params: {
              expression: "canKeysInput();",
              contextId: contextId,
              timeout: SHORT_TIMEOUT
            },
          }
        }))
      ]};
    }
    case "describeNode": {
      const {backendNodeId} = e;
      return {
        command: {
          name: "DOM.describeNode",
          params: {
            backendNodeId
          }
        }
      };
    }
    case "getElementInfo": {
      DEBUG.debugCopyPaste && console.log("Copy paste event", e);
      return {chain:[
        {
          command: {
            isZombieLordCommand: true,
            name: "Connection.getContextIdsForActiveSession",
            params: {
              worldName: WorldName
            }
          }
        },
        ({contextIds}) => contextIds.map(contextId => ({
          command: {
            name: "Runtime.evaluate",
            params: {
              expression: `getElementInfo && getElementInfo(${JSON.stringify(e.data)});`,
              contextId: contextId,
              timeout: SHORT_TIMEOUT
            },
          }
        }))
      ]};
    }
    case "getFavicon": {
      throw new TypeError(`Client cannot request favicons from bank-end`);
      return {chain:[
        {
          command: {
            isZombieLordCommand: true,
            name: "Connection.getAllContextIds",
            params: {
              worldName: WorldName
            }
          }
        },
        ({sessionContextIdPairs}) => {
          const retVal = sessionContextIdPairs.map(({sessionId,contextId}) => {
            return {
              command: {
                name: "Runtime.evaluate",
                params: {
                  sessionId,
                  contextId,
                  expression: "getFaviconElement();",
                  timeout: SHORT_TIMEOUT
                },
              }
            };
          });
          DEBUG.debugFavicon && console.log('getFavicon', {sessionContextIdPairs, retVal});
          return retVal;
        }
      ]};
    }
    case "reportFaviconReceived": {
      DEBUG.debugFavicon && console.log(`Reporting favicons received`);
      console.error(`Do we need this [report favicon received]?`);
      const {sessionId} = e;
      return {chain:[
        {
          command: {
            isZombieLordCommand: true,
            name: "Connection.getAllContextIdsForSession",
            params: {
              worldName: WorldName,
              session: sessionId
            }
          }
        },
        ({contextIds}) => {
          const retVal = contextIds.map(contextId => {
            return {
              command: {
                name: "Runtime.evaluate",
                params: {
                  sessionId,
                  contextId,
                  expression: "reportFaviconReceived();",
                  timeout: SHORT_TIMEOUT
                },
              }
            };
          });
          DEBUG.debugFavicon && console.log('reportFaviconReceived', {contextIds, retVal});
          return retVal;
        }
      ]};
    }
    case "newIncognitoTab": {
      const {address} = e;
      return {chain:[
        {
          command: {
            name: "Target.createBrowserContext",
            params: {
            },
          }
        },
        ({browserContextId}) => {
          return {
            command: {
              name: "Target.createTarget",
              params: {
                browserContextId,
                url: address,
                enableBeginFrameControl: FRAME_CONTROL
              },
            }
          };
        }
      ]};
    }
    case "isMobile": {
      return {
        command: {
          isZombieLordCommand: true,
          name: "Connection.setIsMobile",
          params: {}
        }
      };
    }
    case "isSafari": {
      return {
        command: {
          isZombieLordCommand: true,
          name: "Connection.setIsSafari",
          params: {}
        }
      };
    }
    case "isFirefox": {
      return {
        command: {
          isZombieLordCommand: true,
          name: "Connection.setIsFirefox",
          params: {}
        }
      };
    }
    case "clearAllPageHistory": {
      return {chain:[
        {
          command: {
            isZombieLordCommand: true,
            name: "Connection.getAllSessionIds",
            params: {}
          }
        },
        ({sessionIds}) => sessionIds.map(sessionId => {
          return {
            command: {
              name: "Page.resetNavigationHistory",
              params: {
                sessionId,
              },
            }
          };
        })
      ]};
    }
    case "clearCacheAndHistory": {
      return {
        command: {
          isZombieLordCommand: true,
          name: "Connection.clearCacheAndHistory",
          params: {}
        }
      };
    }
    case "clearCache": {
      return {
        command: {
          name: "Network.clearBrowserCache",
          params: {}
        }
      };
    }
    case "clearCookies": {
      return {
        command: {
          name: "Network.clearBrowserCookies",
          params: {}
        }
      };
    }
    case "respond-to-modal": {
      let accept = false;
      let {modalType, response, sessionId, promptText} = e; 
      if ( response == "ok" ) {
        accept = true;
      }
      DEBUG.debugModal && console.log({responseToModal:e});
      if ( CLASS_A_MODAL_TYPES.has(modalType) ) {
        if ( modalType === 'prompt' ) {
          // this is important to ensure the modal is closed
          promptText = promptText || '';
        }
        return [
          {
            command: {
              name: "Page.handleJavaScriptDialog",
              params: {
                accept, promptText, sessionId
              }
            }
          }, {
            command: {
              isZombieLordCommand: true,
              name: "Connection.closeModal",
              params: {
                modalType,
                sessionId,
                response
              }
            }
          }
        ];
      } else {
        return {
          command: {
            isZombieLordCommand: true,
            name: "Connection.closeModal",
            params: {
              modalType,
              sessionId,
              response
            }
          }
        };
      }
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
        x: Math.round(e.bitmapX),
        y: Math.round(e.bitmapY),
        type: "mouseWheel",
        deltaX, deltaY
      },
      requiresShot: true,
    }
  };
}

function encodeModifiers(originalEvent) {
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

function adjustWheelDeltaByMode(delta, mode) {
  if ( delta == 0 ) return delta;
  let threshold = Math.abs(delta) > THRESHOLD_DELTA;
  if ( ! threshold ) {
    delta = Math.sqrt(Math.abs(delta))*Math.sign(delta);
  }
  switch(mode) {
    case DOM_DELTA_PIXEL:
      //console.log("pix mode", delta);
      if ( threshold && Math.abs(delta) < MIN_PIX_DELTA ) {
        delta = Math.sign(delta)*MIN_PIX_DELTA;
      }
      break;
    case DOM_DELTA_LINE:
      //console.log("line mode", delta);
      delta = delta * LINE_HEIGHT_GUESS;
      if ( threshold && Math.abs(delta) < MIN_DELTA ) {
        delta = Math.sign(delta)*MIN_DELTA;
      }
      break;
    case DOM_DELTA_PAGE:
      //console.log("page mode", delta);
      delta = delta * self.ViewportHeight;
      if ( threshold && Math.abs(delta) < MIN_DELTA ) {
        delta = Math.sign(delta)*MIN_DELTA;
      }
      break;
  }
  return delta;
}
