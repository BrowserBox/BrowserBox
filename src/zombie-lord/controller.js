import Connect from './connection.js';
import {getViewport} from './connection.js';
import {CONFIG,COMMAND_MAX_WAIT,throwAfter, untilTrue, sleep, DEBUG} from '../common.js';
import {MAX_FRAMES, MIN_TIME_BETWEEN_SHOTS, ACK_COUNT, MAX_ROUNDTRIP, MIN_SPOT_ROUNDTRIP, MIN_ROUNDTRIP, BUF_SEND_TIMEOUT, RACE_SAMPLE} from './screenShots.js';
import fs from 'fs';

const FRAME_GC_LIMIT = 5;
const TIME_WINDOW = 2;
const MAX_CONNECTIONS = process.env.MAX_CONN ? parseInt(process.env.MAX_CONN) : 5;
console.log({MAX_CONNECTIONS});
const connections = new Map();

// Connection options
const Options = {
  adBlock: DEBUG.adBlock,
  demoBlock: false
};

//const TAIL_START = 100;
//let lastTailShot = false;
//let lastHash;

const controller_api = {
  zombieIsDead(port) {
    const connection = connections.get(port);
    try {
      return connection.zombie.disconnected;
    } catch(e) {
      console.warn('zombie dead', e);
      return true;
    }
  },

  sendFavicons(send, port) {
    const connection = connections.get(port);
    if ( connection?.favicons?.size ) {
      const meta = [...connection.favicons.entries()].map(([targetId, faviconDataUrl]) => ({favicon:{targetId, faviconDataUrl}}));
      if ( connection.modal ) {
        const {modal} = connection;
        meta.push({modal});
      }
      DEBUG.debugFaviconsSend && console.log(`Will send favicons`, meta);
      send({meta});
    }
  },

  fanOut(deliverTo, port) {
    const connection = connections.get(port);
    if ( connection ) {
      for( const {socket} of connection.links.values() ) {
        deliverTo(socket);
      }
    } else {
      throw new TypeError(`No connection on port ${port}`);
    }
  },

  linkStats(port) {
    const connection = connections.get(port);
    if ( connection ) {
      return {
        onlineCount: connection.links.size
      }
    } else {
      throw new TypeError(`No connection on port ${port}`);
    }
  },

  async screenshotAck(connectionId, port, receivedFrameId, channel) {
    const {frameId, castSessionId} = receivedFrameId;
    const connection = connections.get(port);
    //DEBUG.debugCast && console.log('Acking', connectionId, port, receivedFrameId);
    if ( connection ) {
      const channels = connection.links.get(connectionId);
      if ( ! channels ) {
        throw new TypeError(`No client connected with connectionId ${connectionId}`);
      }
      const {ack} = channels;

      try {
        ack.received = receivedFrameId;
        ack.count = ACK_COUNT;
        ack.receivedAt = Date.now();

        if ( CONFIG.screencastOnly ) {
          if ( ! connection.sessionId ) {
            DEBUG.showNoSessionIdWarnings && console.warn(`No sessionId for screencast ack`);
          }
          controller_api.send({
            name: "Page.screencastFrameAck",
            params: {
              sessionId: castSessionId || 1
            },
            sessionId: connection.sessionId
          }, port).then(sendResult => {
            DEBUG.metaDebug && console.log({sendResult});
            if ( channel ) {
              const {Data, Frames, Meta, State, receivesFrames, messageId} = channel;
              const {data, meta, frameBuffer, totalBandwidth} = sendResult;
              if ( data ) {
                Data.push(data);
              }
              if ( meta ) {
                Meta.push(...meta);
              }
              if ( frameBuffer ) {
                Frames.push(...frameBuffer);
                while ( Frames.length > MAX_FRAMES ) {
                  Frames.shift();
                }
              }
              State.totalBandwidth = totalBandwidth;
            } else {
              DEBUG.channelDebug && console.warn(`Got a send result but no channel to set results upstream. Uh OH`);
              DEBUG.channelDebug && console.log((new Error).stack);
            }
          })
          //DEBUG.debugCast && console.log("Sent ack");
        }

        if ( DEBUG.adaptiveImagery ) {
          const sentAt = ack.sent.get(frameId);
          if ( sentAt ) {
            ack.sent.delete(frameId);
            const roundtripTime = (ack.receivedAt - sentAt)/2;
            DEBUG.debugAdaptiveImagery && console.log({rtt:roundtripTime});
            ack.times.push(roundtripTime);
            ack.timeSum += roundtripTime;
            while(ack.times.length > TIME_WINDOW) {
              ack.timeSum -= ack.times.shift();
            }

            const avgRoundtrip = ack.timeSum / ack.times.length;
            DEBUG.debugAdaptiveImagery && console.log(`Average roundtrip time: ${avgRoundtrip}ms, actual: ${roundtripTime}ms`);
            if ( avgRoundtrip > MAX_ROUNDTRIP /*|| roundtripTime > MAX_ROUNDTRIP */ ) {
              connection.shrinkImagery();
            } else if ( avgRoundtrip < MIN_ROUNDTRIP /*|| roundtripTime < MIN_SPOT_ROUNDTRIP */) {
              connection.growImagery();
            }
          }
        }

        if ( ack.sending ) return;
        //DEBUG.debugCast && console.log("Sending frames", ack);
        ack.sending = true;

        await sleep(10);

        while ( ack.count && DEBUG.bufSend && ack.bufSend && ack.buffer.length ) {
          DEBUG.acks && console.log(`Got ack from ${connectionId} and have buffered unsent frame. Will send now.`);

          const {peer, socket, fastest} = channels;
          const channel = DEBUG.chooseFastest && fastest ? fastest : 
            DEBUG.useWebRTC && peer ? peer : socket;
          const [imgBuf, frameId] = ack.buffer.pop();
          DEBUG.shotDebug && console.log('Sending', frameId);
          connection.so(channel, imgBuf);
          DEBUG.adaptiveImagery && ack.sent.set(frameId, Date.now());

          if ( DEBUG.chooseFastest && DEBUG.useWebRTC && socket && peer ) {
            const choice = Math.random() >= RACE_SAMPLE;
            if ( choice ) {
              const otherChannel = channel === peer ? socket : peer;
              connection.so(otherChannel, imgBuf);
              DEBUG.logFastest && console.log('Race started');
            }
          }

          //ack.bufSend = false;
          ack.received = 0;
          ack.count -= 1;
          if ( ack.count < 0 ) {
            ack.count = 0;
            ack.buffer.length = 0;
          }
          await sleep(MIN_TIME_BETWEEN_SHOTS);
        }

        ack.sending = false;

        if ( ack.sent.size > FRAME_GC_LIMIT ) {
          for( const key of ack.sent.keys() ) {
            if ( key < frameId ) ack.sent.delete(key);
          }
        }

        DEBUG.acks && console.log(`Set ack received ${connectionId}`);
      } catch(e) {
        console.warn('screenshotAck error', e);
        ack.sending = false;
      }
    } else {
      throw new TypeError(`No connection on port ${port}`);
    }
  },

  async addLink(so, {connectionId, peer, socket, fastest}, port) {
    await untilTrue(() => connections.has(port), 100, 1000);
    const connection = connections.get(port);
    if ( connection ) {
      let channels = connection.links.get(connectionId);
      if ( (socket || peer) && ! channels ) {
        DEBUG.val && console.log("Links", connection.links.size, "Max", MAX_CONNECTIONS);
        if ( ( connection.links.size + 1) > MAX_CONNECTIONS ) {
          console.warn('Closing connection as total connection count exceeds MAX_CONNECTIONS');
          if ( socket ) {
            so(socket, 
              { 
                data: [{
                  error: `There are already ${MAX_CONNECTIONS} in the session. The room is full`
                }]
              }
            );
            setTimeout(() => socket && socket.close(), 600);
          }
          if ( peer ) {
            setTimeout(() => peer && peer.destroy(), 500);
          }
          return;
        }
        channels = {ack:{received:true, buffer:[], sent:new Map(), times: [], timeSum: 0, bufSend: true}};
        DEBUG.acks && console.log(`set ack received true at first ${connectionId}`, channels);
        
        (DEBUG.socDebug || DEBUG.debugConnect) && console.info(`Add connection ${connectionId}`);
        connection.links.set(connectionId, channels);
        untilTrue(() => connection.sessionId, 300, 100).then(() => {
          DEBUG.acks && console.log(
            'sending ack on link add or change', 
            connection.sessionId, connection.latestCastId
          );
          controller_api.screenshotAck(connectionId, port, 1);
        });
      }
      if ( ! peer && ! socket ) {
        (DEBUG.socDebug || DEBUG.debugConnect) && console.info(`Disconnect. Remove connection ${connectionId}`);
        this.deleteLink({connectionId}, port);
      } else if ( channels ) {
        channels.peer = peer;
        channels.socket = socket;
        if ( channels.fastest !== fastest ) {
          DEBUG.logFastest && console.log(`Switched fastest channel to ${
            fastest === peer ? 'webrtc peer' : 'websocket'
          }.`);
          channels.fastest = fastest;
        }
        DEBUG.socDebug && console.log(`Client ${connectionId} setting ${peer ? 'peer' : ''} ${peer && socket? 'and socket' : 'socket'}`);
        if ( !fastest && peer && socket ) {
          console.log("Links keys", ...connection.links.keys());
        }
      }
      if ( ! connection.so ) {
        connection.so = so;
      }
      connection.doShot({forceFrame:true});
    } else {
      console.info(connections);
      throw new TypeError(`No connection on port ${port}`);
    }
  },

  deleteLink({connectionId}, port) {
    const connection = connections.get(port);
    (DEBUG.socDebug || DEBUG.debugConnect) && console.info(`Remove connection ${connectionId}`);
    if ( connection ) {
      connection.links.delete(connectionId);
      connection.viewports.delete(connectionId);
      const remainingConnectionId = [...connection.viewports.keys()][0];
      DEBUG.debugViewportDimensions && console.log('Viewports--', connection.viewports);
      const viewport = getViewport(...connection.viewports.values());
      DEBUG.debugViewportDimensions && console.log('Common viewport', viewport);
      DEBUG.coords && console.log(`Resetting device metrics on client departure`, viewport);
      this.send({
        name: "Browser.setWindowBounds",
        params: {
          windowId: connection.latestWindowId,
          bounds: viewport,
        },
        requiresWindowId: true,
        forceFrame: true,
        receivesFrames: true,
      }, port);
      this.send({
        name: "Emulation.setDeviceMetricsOverride",
        params: {
          ...viewport,
          mobile: viewport.mobile ? viewport.mobile : connection.isMobile,
        },
        receivesFrames: true,
        requiresShot: true,
        forceFrame: true,
      }, port);
    } else {
      throw new TypeError(`No connection on port ${port}`);
    }
  },

  setClientErrorSender(sender, port) {
    const connection = connections.get(port);    
    if ( ! connection ) {
      return false;
    }
    connection.setClientErrorSender(sender);
    return true;
  },

  setOptions(new_options) {
    Object.assign(Options, new_options);
  },

  async close(port) {
    const connection = connections.get(port);    
    if ( ! connection ) {
      return true;
    }
    connections.delete(port);
    return await connection.close();
  },

  getActiveTarget(port) {
    const connection = connections.get(port);
    if ( ! connection ) return;
    const activeTargetId = connection.sessions.get(connection.sessionId);
    return activeTargetId;
  },

  getHiddenTarget(port) {
    const connection = connections.get(port);
    if ( ! connection ) return;
    return connection.hiddenTargetId;
  },

  setHiddenTarget(targetId, port) {
    const connection = connections.get(port);
    if ( ! connection ) return;
    connection.hiddenTargetId = targetId;
  },

  addTargets(tabs, port) {
    if ( ! tabs ) throw new TypeError(`No tabs provided.`);
    const connection = connections.get(port);
    if ( ! connection ) return;
    tabs.forEach(({targetId}) => {
      connection.targets.add(targetId);
    });
  },

  hasTab(targetId, port) {
    const connection = connections.get(port);
    if ( ! connection ) return false;
    return connection.tabs.has(targetId);
  },

  hasSession(targetId, port) {
    const connection = connections.get(port);
    if ( ! connection ) return false;
    return connection.sessions.has(targetId);
  },

  getBrowserTargetId(port) {
    const connection = connections.get(port);
    if ( ! connection ) return;
    return connection.browserTargetId;
  },

  async send(command, port, Saver) {
    let retVal = {};
    let connection = connections.get(port);    
    //let Page, Target;
    try {
      if ( ! connection ) {
        connection = await Connect({port}, Options);
        connections.set(port,connection)
      }
      //({Page, Target} = connection.zombie);
      command = command || {};
      DEBUG.val >= DEBUG.high && !command.isBufferedResultsCollectionOnly && console.log(JSON.stringify(command));
      if ( command.isBufferedResultsCollectionOnly ) {
        DEBUG.frameDebug && process.stdout.write('.');
        retVal.data = {};
      } else if ( command.isZombieLordCommand ) {
        switch(command.name) {
          // ALTERNATE : we COULD change this API to NOT reveal contextIds to client.
          // and instead offer a command like Connection.broadcastToAllContextsInSession()
          // that takes a script to evaluate 
          case "Connection.screenshotAck": {
            throw new TypeError(`We don't handle ack here.`); 
          }
          break;
          case "Connection.doShot": {
            DEBUG.val && console.log("Calling do shot");
            connection.doShot();
          }
          break;
          case "Connection.getFavicon": {
            const targetId = command.params.targetId || connection.sessions.get(connection.sessionId);
            const faviconDataUrl = connection.favicons.get(targetId);
            DEBUG.debugFavicon && console.log('Received message to Get Favicon', 
              {targetId, faviconDataUrl}, connection.favicons, command, connection.sessions);
            if ( faviconDataUrl ) {
              connection.meta.push({
                favicon: {
                  targetId,
                  faviconDataUrl
                }
              });
            }
          }
          break;
          case "Connection.getContextIdsForActiveSession": {
            DEBUG.showContextIdCalls && console.log('Received', command);
            const contexts = connection.worlds.get(connection.sessionId);
            const targetId = connection.sessions.get(connection.sessionId);
            // console.log(connection.worlds, connection.sessions, contexts,targetId,connection.sessionId);
            if ( ! contexts ) {
              retVal.data = {contextIds:[]};
            } else {
              DEBUG.val > DEBUG.med && console.log({currentSession:connection.sessionId, targetId, contexts:[...contexts.values()]});
              retVal.data = {contextIds:[...contexts.values()]};
            }
            DEBUG.showContextIdCalls && console.log('Ret val', retVal);
          }
          break;
          case "Connection.getAllContextIds": {
            const allContexts = [];
            for ( const sessionId of connection.worlds.keys() ) {
              // because we double book entry in connection worlds both sessionId and targetId
              // so we have to check if the key is targetId and if so we skip
              if ( connection.targets.has(sessionId) ) continue;
              const contexts = connection.worlds.get(sessionId);
              if ( contexts ) {
                for ( const contextId of contexts ) {
                  allContexts.push({sessionId,contextId});
                }
              }
            }
            retVal.data = {sessionContextIdPairs:allContexts};
          }
          break;
          case "Connection.getAllSessionIds": {
            const sessionIds = [];
            for ( const sessionId of connection.worlds.keys() ) {
              // because we double book entry in connection worlds both sessionId and targetId
              // so we have to check if the key is targetId and if so we skip
              if ( connection.targets.has(sessionId) ) continue;
              sessionIds.push(sessionId);
            }
            retVal.data = {sessionIds};
          }
          break;
          case "Connection.setIsFirefox": {
            connection.isFirefox = true;
          }
          break;
          case "Connection.setIsSafari": {
            connection.isSafari = true;
          }
          break;
          case "Connection.setIsMobile": {
            connection.isMobile = true;
          }
          break;
          case "Connection.getTabs": {
            const tabs = Array.from(connection.tabs.values());
            retVal.data = {tabs};
          }
          break;
          case "Connection.enableMode": {
            // reset first
            const plugins = Object.keys(connection.plugins);
            for ( const pluginName of plugins ) {
              connection.plugins[pluginName] = false;
            }

            // now enable 
            const {pluginName} = command.params;
            if ( pluginName ) {
              connection.plugins[pluginName] = true;
            }
            retVal.data = {};
          }
          break;
          case "Connection.resetMode": {
            const plugins = Object.keys(connection.plugins);
            for ( const pluginName of plugins ) {
              connection.plugins[pluginName] = false;
            }
            retVal.data = {};
          }
          case "Connection.resampleImagery": {
            const {down, up, averageBw} = command.params;
            if ( down ) {
              connection.shrinkImagery({averageBw});
            } else if ( up ) {
              connection.growImagery({averageBw});
            }
          }
          break;
          case "Connection.closeModal": {
            connection.meta.push({
              closeModal: command.params
            });
            DEBUG.val && console.log(`received close modal and sent to clients`, command);
          }
          break;
          case "Connection.activateTarget": {
            connection.meta.push({
              activateTarget: command.params
            });
            DEBUG.val && console.log(`received activateTarget and sent to clients`, command);
          }
          break;
          default: {
            console.warn(`Unknown zombie lord command: ${command.name}`);
          }
          break;
        }
      } else if ( command.name ) {
        DEBUG.val > DEBUG.med && console.log({command});
        DEBUG.pausedDebug && console.log({paused:connection.vmPaused});
        if ( /* connection.vmPaused || */ command.dontWait ) {
          connection.sessionSend(command).then(resp => {
            DEBUG.debugCommandResponses && console.log(`DROPPED RESPONSE`, resp);
            return resp;
          });
          retVal.data = {vmPaused: connection.vmPaused};
          DEBUG.debugModals && console.log("Saving VM paused", retVal);
        } else {
          const CancelTimer = {};
          const response = await Promise.race([
            connection.sessionSend(command),
            throwAfter(COMMAND_MAX_WAIT, command, port, CancelTimer)
          ]);
          DEBUG.dataDebug && console.log({response});
          CancelTimer.do();
          /**
          console.log(
            "XCHK controller.js call response", command, response, CancelTimer.do.toString()
          );
          **/
          if ( response?.meta ) {
            connection.meta.push(...response.meta);
          } else if ( response ) {
            retVal.data = response;
          } else {
            DEBUG.debugCommandResponses && console.warn(`No response to command`, command);
          }
        }
      }
      if ( command.requiresLoad ) {
        // we could do a promise race here load vs sleep
        //await Page.loadEventFired();
        await sleep();
      }
      if ( command.requiresExtraWait ) {
        await sleep(command.extraWait);
      }
      if ( command.requiresShot || command.forceFrame ) {
        DEBUG.frameDebug && console.log({forceFrame:{command}});
        await connection.doShot({ignoreHash: command.ignoreHash || command.forceFrame});
      }
      if ( command.requiresTailShot ) {
        connection.queueTailShot({ignoreHash: command.ignoreHash});
      }
      if ( connection.frameBuffer.length && command.receivesFrames ) {
        retVal.frameBuffer = Array.from(connection.frameBuffer);
        connection.frameBuffer.length = 0;
        if ( !DEBUG.binaryFrames ) {
          retVal.frameBuffer = retVal.frameBuffer.filter(frame => {
            if ( frame.hash == connection.lastHash ) {
              DEBUG.shotDebug && DEBUG.val > DEBUG.med && console.log(`DROP frame ${frame.hash}`); 
              return false;
            } else {
              connection.lastHash = frame.hash;
              DEBUG.shotDebug && DEBUG.val > DEBUG.med && console.log(`SEND frame ${frame.hash}`);
              return true;
            }
          });
        }

        DEBUG.val > DEBUG.med && console.log(`Sending ${retVal.frameBuffer.length} frames.`);
      }
      if ( connection.meta.length ) {
        (DEBUG.metaDebug || DEBUG.frameDebug) && console.log('Meta length', connection.meta.length);
        retVal.meta = Array.from(connection.meta);
        (DEBUG.metaDebug || DEBUG.debugFavicon) && console.warn(`META: Resetting meta!`, JSON.stringify(connection.meta));
        connection.meta.length = 0;
        //move([], connection.meta);
        (DEBUG.metaDebug || (DEBUG.val > DEBUG.med)) && console.log(
          `Sending ${retVal.meta.length} meta.`
        );
      }
      retVal.totalBandwidth = connection.totalBandwidth;
    } catch(e) {
      console.warn(e);
      retVal.data = {error:e+'', resetRequired: true};
    }
    DEBUG.debugModals && console.log("VM PAUSED", connection.vmPaused, "MODAL", connection.modal);
    if ( connection.vmPaused ) {
      if ( !retVal.data ) {
        retVal.data = {};
      }
      retVal.data.vmPaused = connection.vmPaused;
      retVal.data.modal = connection.modal;
    }
    return retVal;
  },

  saveIP(ip_address) {
    this.ip_address = ip_address;
    console.log("Connect from", ip_address);
  },

  logIP() {
    try {
      fs.appendFileSync("/tmp/badIPLog", this.ip_address + "\n");
    } catch(e) {
      console.warn("Error appending log", e);
      try {
        fs.writeFileSync("/tmp/badIPLog", this.ip_address + "\n");
      } catch(e2) {
        console.warn("Error writing log", e);
      }
    }
  },

  isSafari(port) {
    const connection = connections.get(port);
    if ( ! connection ) {
      throw new TypeError(`No such connection on port: ${port}`);
    }
    return connection.isSafari;
  },

  getConnection(port) {
    return connections.get(port);
  }
};

export default controller_api;

function move(a_dest, a_src) {
  while(a_src.length) {
    a_dest.push(a_src.shift());
  }
  return a_dest;
}

