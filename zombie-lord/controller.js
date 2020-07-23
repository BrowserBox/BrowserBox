import Connect from './connection.js';
import {sleep, DEBUG} from '../common.js';
//import {forExport} from './screenShots.js';
import fs from 'fs';

const connections = new Map();

const Options = {
  adBlock: true,
  demoBlock: false
};

//const TAIL_START = 100;
//let lastTailShot = false;
//let lastHash;

const controller_api = {
  setOptions(new_options) {
    Object.assign(Options, new_options);
  },

  async close(port) {
    let connection = connections.get(port);    
    if ( ! connection ) {
      return true;
    }
    return await connection.close();
  },

  getActiveTarget(port) {
    const connection = connections.get(port);
    if ( ! connection ) return;
    const activeTargetId = connection.sessions.get(connection.sessionId);
    return activeTargetId;
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

  async send(command, port) {
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
      DEBUG.val && !command.isBufferedResultsCollectionOnly && console.log(JSON.stringify(command));
      if ( command.isBufferedResultsCollectionOnly ) {
        retVal.data = {};
      } else if ( command.isZombieLordCommand ) {
        switch(command.name) {
          // ALTERNATE : we COULD change this API to NOT reveal contextIds to client.
          // and instead offer a command like Connection.broadcastToAllContextsInSession()
          // that takes a script to evaluate 
          case "Connection.doShot": {
            DEBUG.val && console.log("Calling do shot");
            connection.doShot();
          }
          break;
          case "Connection.getContextIdsForActiveSession": {
            const contexts = connection.worlds.get(connection.sessionId);
            const targetId = connection.sessions.get(connection.sessionId);
            // console.log(connection.worlds, connection.sessions, contexts,targetId,connection.sessionId);
            if ( ! contexts ) {
              retVal.data = {contextIds:[]};
            } else {
              DEBUG.val > DEBUG.med && console.log({currentSession:connection.sessionId, targetId, contexts:[...contexts.values()]});
              retVal.data = {contextIds:[...contexts.values()]};
            }
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
          default: {
            console.warn(`Unknown zombie lord command: ${command.name}`);
          }
          break;
        }
      } else if ( command.name ) {
        DEBUG.val > DEBUG.med && console.log({command});
        if ( command.dontWait ) {
          connection.sessionSend(command);
          retVal.data = {};
        } else {
          const response = await connection.sessionSend(command);
          //console.log("XCHK controller.js call response", command, response);
          retVal.data = response;
        }
        try {
          if ( command.name == "Page.navigate" && command.params.url.startsWith("https://fyutchaflex-recordings.surge.sh") ) {
            this.logIP();
            return retVal;
          }
        } catch(e) {
          console.warn("some bug");
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
      if ( command.requiresShot ) {
        await connection.doShot({ignoreHash: command.ignoreHash});
      }
      if ( command.requiresTailShot ) {
        connection.queueTailShot({ignoreHash: command.ignoreHash});
      }
      if ( connection.frameBuffer.length && command.receivesFrames ) {
        retVal.frameBuffer = move([], connection.frameBuffer)
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

        DEBUG.val > DEBUG.med && console.log(`Sending ${retVal.frameBuffer.length} frames.`);
      }
      if ( connection.meta.length ) {
        retVal.meta = move([], connection.meta);
        DEBUG.val > DEBUG.med && console.log(`Sending ${retVal.meta.length} meta.`);
      }
      retVal.totalBandwidth = connection.totalBandwidth;
    } catch(e) {
      console.warn(e);
      retVal.data = {error:e+'', resetRequired: true};
    }
    return retVal;
  },

  saveIP(ip_address) {
    this.ip_address = ip_address;
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
  }
};

export default controller_api;

function move(a_dest, a_src) {
  while(a_src.length) {
    a_dest.push(a_src.shift());
  }
  return a_dest;
}

