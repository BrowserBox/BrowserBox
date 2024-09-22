  /* entry point */
  import fs from 'fs';
  import path from 'path';
  import exitOnExpipe from 'exit-on-epipe';
  import express from 'express';
  import zl from './zombie-lord/index.js';
  import {MAX_FRAMES} from './zombie-lord/screenShots.js';
  import {CONFIG, EXPEDITE, COMMAND_MAX_WAIT,DEBUG,GO_SECURE,sleep,throwAfter} from './common.js';
  import {start_ws_server} from './ws-server.js';

  const BEGIN_AGAIN = 500;
  import {
    chrome_port, app_port, cookie, 
    /*username,*/ token, start_mode
  } from './args.js';

  const demoBlock = token == 'demotoken';
  let ws_started = false;
  let lastDebugOrderId = -Infinity;
  let server;
  let targetSaver;
  //let zombie_started = false;

  if ( GO_SECURE && start_mode == "signup" ) {
    const redirector = express();
    redirector.get('/*path', (req,res) => {
      res.redirect('https://' + req.headers.host + req.url);
    });
    redirector.listen(80, () => DEBUG.val && console.log('listening on 80 for https redirect'));
  }

  try { 
    process.title = "browserbox";
  } catch(e) {
    console.info(`Could not set process title. Current title: ${process.title}`, e);
  }

  process.on('uncaughtException', err => {
    console.log('ue', err, err.stack);
    //zl.life.kill(chrome_port);
    //begin();
  });

  process.on('unhandledRejection', err => {
    console.log('ur', err, err.stack);
    //zl.life.kill(chrome_port);
    //begin();
  });

  process.on('error', err => {
    console.log('e', err, err.stack);
    //zl.life.kill(chrome_port);
    //begin();
  });

  process.on('beforeExit', () => {
    clearInterval(targetSaver);
  });

  begin();

  async function begin() {
    let port;
    if ( start_mode !== "signup" ) {
      try {
        ({port} = await zl.life.newZombie({port: chrome_port, /*username*/}));
        zl.act.setOptions({demoBlock});
      } catch(e) {
        console.warn("ZL start error", e);
        zl.life.kill(chrome_port);
        setTimeout(begin, BEGIN_AGAIN);
      }
      if ( port !== chrome_port ) {
        zl.life.kill(port);
        throw Error(`Port must match port allocated: app port ${port}, chrome port ${chrome_port}`);
      }
      DEBUG.val && console.log({zombie:"gnawing at port ", port});
      await sleep(BEGIN_AGAIN);
    }
    if ( ! ws_started ) {
      server = await start_ws_server(
        app_port, chrome_port, cookie, token, 
      );
      ws_started = true;
    }
    if ( ! targetSaver ) {
      targetSaver = setInterval(saveTargetCount, 13001);
    }
  }

  export async function timedSend(command, port) {
    if ( command.dontWait ) {
      command.dontWait = false;
      console.warn(`Can't set don't wait outside server`);
    }
    if ( EXPEDITE.has(command.name) && ! command.definitelyWait ) {
      command.dontWait = true;
    }
    if ( DEBUG.neverWait || command.dontWait ) {
      return zl.act.send(command, port);
    } else {
      const CancelTimer = {};
      const Saver = {};
      const result = await Promise.race([
        zl.act.send(command, port, Saver),
        throwAfter(COMMAND_MAX_WAIT, command, port, CancelTimer)
      ]);
      /* The above block introduces bugs where if we wait for commands in a timeout way then the timeout firest
         and we never get the result of the command so it is essentially lost
         An idea to solve that is to use  Saver object that saves the results anyway and they can be consumed from there...
         somehow...when they are ready while allowing the next command to be sent without blocking the line
         Honestly I don't even know if commands can block the line anymore. 
         The above DEBUG.neverWait is a new "hack" to get around the issue of this block
         A more comprehensive solution would involve implementing this Saver object and somehow later consuming it. 
         Not hard, just seems unnecessary right now
       */
      console.log({result, location: 'commandTimeoutBlock'});
      CancelTimer.do();
      return result;
    }
  }

  export async function eventSendLoop(events, {Data, Frames, Meta, State, receivesFrames, messageId, connectionId}) {
    DEBUG.metaDebug && DEBUG.val && console.log('before loop', messageId, {Meta});
    for ( const {command} of events ) {
      try {
        command.receivesFrames = receivesFrames && ! command.isZombieLordCommand;
        command.connectionId = connectionId;
        if ( DEBUG.val ) {
          if ( command.isBufferedResultsCollectionOnly ) {
            DEBUG.brc && console.log(`Sending ${JSON.stringify(command)}...`);
          } else {
            console.log(`Sending ${JSON.stringify(command)}...`);
          }
        }
        if ( DEBUG.debugKeyEvents && (
            command?.name?.startsWith?.("Input.dispatchKey") || command?.name?.startsWith?.("Input.insertText")
        ) ) {
          console.info(`[eventSendLoop]: sending ${command.params.key || command.params.text} (${command.params.type ? command.params.type.slice(3) : 'press -> insert'}) (batch size: ${events.length})`);
          //console.log(JSON.stringify(command,null,2));
        }
        if ( DEBUG.debugCommandOrder ) {
          if ( command.debugOrderId <= lastDebugOrderId ) {
            console.info(`Command sequence disorder: about to emit ${command.debugOrderId}, but last was ${lastDebugOrderId}`);
            console.log(command);
          }
          lastDebugOrderId = command.debugOrderId;
          delete command.debugOrderId;
        }
        const sendResult = await timedSend(command, chrome_port);
        DEBUG.debugSendResult && console.log(JSON.stringify({sendResult}));
        if ( sendResult ) {
          const {data,frameBuffer,meta,totalBandwidth} = sendResult;
          DEBUG.metaDebug && DEBUG.val && console.log('meta 1', {meta});
          Data.push(data);
          if ( meta ) {
            // filter out all but the last resource for each targetId
            // to save bandwidth
            const latestResourceForTarget = {};
            const nonResourceMeta = meta.filter(mi => {
              DEBUG.metaDebug && DEBUG.val && console.log({mi});
              if ( ! mi.resource ) return true;
              latestResourceForTarget[mi.resource.targetId] = mi;
              return false;
            });
            //DEBUG.metaDebug && console.log(JSON.stringify({meta}), JSON.stringify({nonResourceMeta}));
            Meta.push(...nonResourceMeta, ...Object.values(latestResourceForTarget));
            //Meta.push(...meta);
          }
          if ( frameBuffer ) {
            Frames.push(...frameBuffer);
            const mf = MAX_FRAMES();
            while(Frames.length > mf) Frames.shift();
          }
          State.totalBandwidth = totalBandwidth;
        } else {
          if ( DEBUG.metaDebug || DEBUG.dataDebug ) console.log(`Did not wait to get the meta or data results`);
        }
      } catch(e) {
        console.warn(e);
        Data.push({error:e+''});
      }
    }
    DEBUG.metaDebug && DEBUG.val && console.log('after loop', {Meta});
  }

  // necessary to know if we closed browser with any tabs or not, so we know whether to open a 'home page' tag when we start again
  function saveTargetCount() {
    const targetCount = zl.act.getTargets(chrome_port).length;
    fs.writeFileSync(path.resolve(CONFIG.baseDir, 'targetCount'), `${targetCount}`);
  }
