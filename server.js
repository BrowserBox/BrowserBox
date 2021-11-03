  import express from 'express';
  import zl from './zombie-lord/api.js';
  import {DEBUG,GO_SECURE,sleep,throwAfter} from './common.js';
  import {start_ws_server} from './ws-server.js';

  const BEGIN_AGAIN = 500;
  const COMMAND_MAX_WAIT = 11111;
  const MAX_FRAME = 2; /* 2, 4 */

  const EXPEDITE = new Set([
    "Page.navigate",
    "Page.navigateToHistoryEntry",
    "Runtime.evaluate",
    "Network.setUserAgentOverride",
  ]);

  import {
    chrome_port, app_port, cookie, 
    /*username,*/ token, start_mode
  } from './args.js';

  const demoBlock = token == 'demotoken';

  let ws_started = false;
  //let zombie_started = false;

  if ( GO_SECURE && start_mode == "signup" ) {
    const redirector = express();
    redirector.get('*', (req,res) => {
      res.redirect('https://' + req.headers.host + req.url);
    });
    redirector.listen(80, () => DEBUG.val && console.log('listening on 80 for https redirect'));
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
      if ( port !== chrome_port ) throw Error(`Port must match port allocated: p${port}, cp${chrome_port}`);
      DEBUG.val && console.log({zombie:"gnawing at port ", port});
      await sleep(BEGIN_AGAIN);
    }
    if ( ! ws_started ) {
      await start_ws_server(
        app_port, chrome_port, cookie, token, 
      );
      ws_started = true;
    }
  }

  export function timedSend(command, port) {
    if ( command.dontWait ) {
      command.dontWait = false;
      console.warn(`Can't set don't wait outside server`);
    }
    if ( EXPEDITE.has(command.name) && ! command.definitelyWait ) {
      command.dontWait = true;
    }
    if ( command.dontWait ) {
      return zl.act.send(command, port);
    } else {
      return Promise.race([
        zl.act.send(command, port),
        throwAfter(COMMAND_MAX_WAIT, command, port)
      ]);
    }
  }

  export async function eventSendLoop(events, {Data, Frames, Meta, State, receivesFrames}) {
    for ( const {command} of events ) {
      try {
        command.receivesFrames = receivesFrames && ! command.isZombieLordCommand;
        if ( DEBUG.val ) {
          if ( command.isBufferedResultsCollectionOnly ) {
            DEBUG.brc && console.log(`Sending ${JSON.stringify(command)}...`);
          } else {
            console.log(`Sending ${JSON.stringify(command)}...`);
          }
        }
        const sendResult = await timedSend(command, chrome_port);
        if ( sendResult ) {
          const {data,frameBuffer,meta,totalBandwidth} = sendResult;
          Data.push(data);
          if ( meta ) {
            // filter out all but the last resource for each targetId
            const latestResourceForTarget = {};
            const nonResourceMeta = meta.filter(mi => {
              if ( ! mi.resource ) return true;
              latestResourceForTarget[mi.resource.targetId] = mi;
              return false;
            });
            Meta.push(...nonResourceMeta, ...Object.values(latestResourceForTarget));
          }
          if ( frameBuffer) {
            Frames.push(...frameBuffer);
            while(Frames.length > MAX_FRAME) Frames.shift();
          }
          State.totalBandwidth = totalBandwidth;
        }
      } catch(e) {
        console.warn(e);
        Data.push({error:e+''});
      }
    }
  }
