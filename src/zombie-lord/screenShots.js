//import {CWebp} from 'cwebp';
import {DEBUG, sleep, CONFIG, scratchState} from '../common.js';

const slowOrTORConnection = () => {
  return process.env.TORBB || scratchState.connectFromTOR || scratchState.slowConnection;
};
const FORMAT = "jpeg"; // "png"
const MIN_JPG_QUAL = () => slowOrTORConnection() ? 25 : 5;
const MAX_JPG_QUAL = () => slowOrTORConnection() ? 75 : 80;
const MAX_NTH_FRAME = () => slowOrTORConnection() ? 17 : 8;
export const JPEG_QUAL = () => MAX_JPG_QUAL();
export const MAX_ACK_BUFFER = 3;
export const COMMON_FORMAT = Object.freeze({
  width: 1920,
  height: 1080,
  everyNth: 1,
  deviceScaleFactor: 1,
  mobile: false,
});
export const DEVICE_FEATURES = {
  deviceScaleFactor: COMMON_FORMAT.deviceScaleFactor,
  mobile: COMMON_FORMAT.mobile,
};
export const SCREEN_OPTS = {
  format: FORMAT,
  quality: JPEG_QUAL(),
  maxWidth: COMMON_FORMAT.width,
  maxHeight: COMMON_FORMAT.height,
  everyNthFrame: COMMON_FORMAT.everyNth,
};
const getScreenshotViewport = () => ({
  x: 0,
  y: 0,
  width: SCREEN_OPTS.maxWidth,
  height: SCREEN_OPTS.maxHeight,
  scale: DEVICE_FEATURES.deviceScaleFactor,
});
export const MIN_WIDTH = 300;
export const MIN_HEIGHT = 300;
export const WEBP_QUAL = 32;
export const JPEG_WEBP_QUAL = MAX_JPG_QUAL();
// these can be tuned UP on better bandwidth and DOWN on lower bandwidth
export const ACK_COUNT = process.platform == 'darwin' ? 1 : 2; // how many frames per ack? this should be adapted per link capacity
export const MAX_FRAMES = () => slowOrTORConnection() ? 1 : 2; /* 1, 2, 4 */
export const MIN_TIME_BETWEEN_SHOTS = () => slowOrTORConnection() ? 100 : 40; /* 20, 40, 100, 250, 500 */
export const MIN_TIME_BETWEEN_TAIL_SHOTS = () => slowOrTORConnection() ? 1000 : 175;
export const MAX_TIME_BETWEEN_TAIL_SHOTS = 4000;
export const MAX_TIME_TO_WAIT_FOR_SCREENSHOT = 100;
// local testing values so small haha
export const MAX_ROUNDTRIP = () =>  DEBUG.localTestRTT ? 100 : slowOrTORConnection() ? 4000 : 725;
export const MIN_ROUNDTRIP = () => DEBUG.localTestRTT ? 80 : slowOrTORConnection() ? 2000 : 600;
export const MIN_SPOT_ROUNDTRIP = () => slowOrTORConnection() ? 600 : 125;
export const BUF_SEND_TIMEOUT = 50;
const NOIMAGE = {img: '', frame:0};
const KEYS = [
  1, 11, 13, 629, 1229, 2046, 17912, 37953, 92194, 151840
];
export const RACE_SAMPLE = 0.74;

// image formats for capture depend on what the client can accept
  const WEBP_FORMAT = {
    format: FORMAT,
  };
  const SAFARI_FORMAT = {
    format: FORMAT,
    quality: JPEG_QUAL 
  };
  const SAFARI_SHOT = {
    command: {
      name: "Page.captureScreenshot", 
      params: { 
        ...SAFARI_FORMAT,
        // the below two options fuck up screenshots
        /*
        get clip() { return getScreenshotViewport() },
        */
        /*optimizeForSpeed: true,*/
      }
    }
  };

export function makeCamera(connection) {
  let restartingNow = false;
  let shooting = false;
  let lastScreenOpts = null;
  let frameId = 1;
  let lastHash;
  let lastShot = Date.now();
  let nextShot;
  let tailShot, tailShotDelay = MIN_TIME_BETWEEN_TAIL_SHOTS;

  const nextTailShot = async () => {
    DEBUG.shotDebug && console.log("Tail shot");
    return;
    tailShotDelay *= 1.618;
    if ( tailShotDelay < MAX_TIME_BETWEEN_TAIL_SHOTS ) {
      if ( tailShot ) {
        clearTimeout(tailShot);
      }
      tailShot = setTimeout(nextTailShot, tailShotDelay);
    } else {
      tailShotDelay = MIN_TIME_BETWEEN_TAIL_SHOTS;
      tailShot = false;
    }
    try { await doShot(); } catch(e) {
      console.warn('Error on tail shot', e, 'delay:', tailShotDelay);
      clearTimeout(tailShot);
    }
  };

  return {
    queueTailShot, 
    doShot, 
    shrinkImagery, 
    growImagery, 
    restartCast,
    stopCast,
    startCast,
  };

  async function stopCast() {
    DEBUG.logRestartCast && console.log(`Stopping cast`);
    await connection.sessionSend({
      name: "Page.stopScreencast",
      params: {}
    });
  }

  async function startCast() {
    DEBUG.logRestartCast && console.log(`Starting cast`);
    const {
      format,
      quality, everyNthFrame,
      maxWidth, maxHeight
    } = SCREEN_OPTS;
    DEBUG.debugScreenSize && console.log(`Sending cast `, SCREEN_OPTS);
    await connection.sessionSend({
      name: "Page.startScreencast",
      params: {
        format, quality, everyNthFrame, 
        ...(DEBUG.noCastMaxDims ? 
          {}
          : 
          {maxWidth, maxHeight}
        ),
      }
    });
    lastScreenOpts = {
      quality, everyNthFrame,
      maxWidth, maxHeight,
    };
  }

  async function restartCast() {
    let restart = true;
    if ( lastScreenOpts ) {
      restart = false;
      if (
        lastScreenOpts.quality !== SCREEN_OPTS.quality ||
        lastScreenOpts.maxWidth !== SCREEN_OPTS.maxWidth ||
        lastScreenOpts.maxHeight !== SCREEN_OPTS.maxHeight ||
        lastScreenOpts.everyNthFrame !== SCREEN_OPTS.everyNthFrame 
      ) {
        restart = true;
      }
    }
    if ( CONFIG.alwaysRestartCast ) {
      restart = true;
      DEBUG.logRestartCast && console.log(`ALWAYS restarting cast.`);
    }
    try {
      if ( restart ) {
        if ( restartingNow ) return;
        restartingNow = true;
        DEBUG.logRestartCast && console.log(`Restarting cast`);
        await connection.sessionSend({
          name: "Page.stopScreencast",
          params: {}
        });
        const {
          format,
          quality, everyNthFrame,
          maxWidth, maxHeight
        } = SCREEN_OPTS;
        await connection.sessionSend({
          name: "Page.startScreencast",
          params: {
            format, quality, everyNthFrame, 
            ...(DEBUG.noCastMaxDims ? 
              {}
              : 
              {maxWidth, maxHeight}
            ),
          }
        });
        lastScreenOpts = {
          quality, everyNthFrame,
          maxWidth, maxHeight,
        };
      } else {
        DEBUG.logRestartCast && console.log(`Restart requested by nothing changed so not restarting cast.`);
      }
    }catch(e) {
      console.warn(`Error restarting cast`, e);
    }
    restartingNow = false;
  }

  async function shrinkImagery() {
    if ( SCREEN_OPTS.everyNthFrame >= MAX_NTH_FRAME() && SCREEN_OPTS.quality <= MIN_JPG_QUAL() ) {
      // we don't go any lower
      return;
    }
    SAFARI_SHOT.command.params.quality -= 20;
    SCREEN_OPTS.quality -= 20;
    if ( SAFARI_SHOT.command.params.quality < MIN_JPG_QUAL() ) {
      SAFARI_SHOT.command.params.quality = MIN_JPG_QUAL();
    }
    if ( SCREEN_OPTS.quality < MIN_JPG_QUAL() ) {
      SCREEN_OPTS.quality = MIN_JPG_QUAL();
      SCREEN_OPTS.everyNthFrame += 2;
      if ( SCREEN_OPTS.everyNthFrame > MAX_NTH_FRAME() ) {
        SCREEN_OPTS.everyNthFrame = MAX_NTH_FRAME();
      }
      DEBUG.debugAdaptiveImagery && console.log(`Will only send every ${SCREEN_OPTS.everyNthFrame}th frame`);
    }
    if ( DEBUG.debugAdaptiveImagery ) {
      console.log(`Shrinking JPEG quality to ${SAFARI_SHOT.command.params.quality}`);
    }
    restartCast();
  }

  async function growImagery() {
    if ( SCREEN_OPTS.quality >= MAX_JPG_QUAL() ) {
      // we don't go any higher
      return;
    }

    SAFARI_SHOT.command.params.quality = 80;
    SCREEN_OPTS.quality = 80;
    if ( SAFARI_SHOT.command.params.quality > MAX_JPG_QUAL() ) {
      SAFARI_SHOT.command.params.quality = MAX_JPG_QUAL();
    }
    if ( SCREEN_OPTS.everyNthFrame != 1 ) {
      SCREEN_OPTS.everyNthFrame = 1;
      DEBUG.debugAdaptiveImagery && console.log(`Will now send every ${SCREEN_OPTS.everyNthFrame}th frame`);
    }
    if ( SCREEN_OPTS.quality > MAX_JPG_QUAL() ) {
      SCREEN_OPTS.quality = MAX_JPG_QUAL();
    }
    if ( DEBUG.debugAdaptiveImagery ) {
      console.log(`Growing JPEG quality to ${SAFARI_SHOT.command.params.quality}`);
    }
    restartCast();
  }

  function queueTailShot() {
    if ( tailShot ) {
      clearTimeout(tailShot);
      tailShotDelay = MIN_TIME_BETWEEN_TAIL_SHOTS;
      tailShot = false;
    }
    tailShot = setTimeout(nextTailShot, tailShotDelay);
  }

  async function shot(opts = {}) {
    if ( DEBUG.frameDebug && opts.ignoreHash ) {
      setTimeout(() => console.log(opts), 20);
    }
    // DEBUG
    if ( DEBUG.noShot ) return NOIMAGE;
    const timeNow = Date.now();
    const dur = timeNow - lastShot;
    if ( !opts.ignoreHash && dur < MIN_TIME_BETWEEN_SHOTS() ) {
      if ( DEBUG.shotDebug && DEBUG.val > DEBUG.low ) {
        console.log(`Dropping as duration (${dur}) too short.`);
      }
      return NOIMAGE;
    }
    if ( DEBUG.shotDebug && DEBUG.val > DEBUG.low ) {
      console.log(`Do shot ${dur}ms`);
    }
    const targetId = connection.sessions.get(connection.sessionId);
    let response;
    //const ShotCommand = ((connection.isSafari || connection.isFirefox) ? SAFARI_SHOT : WEBP_SHOT).command;
    const ShotCommand = SAFARI_SHOT.command;
    if ( opts.blockExempt ) {
      ShotCommand.blockExempt = true;
    }
    DEBUG.shotDebug && console.log(`XCHK screenShot.js (${ShotCommand.name}) call response`, ShotCommand, response ? JSON.stringify(response).slice(0,140) : response );
    response = await Promise.race([
      connection.sessionSend(ShotCommand),
      sleep(MAX_TIME_TO_WAIT_FOR_SCREENSHOT)
    ]);
    lastShot = timeNow;
    response = response || {};
    const {data,screenshotData} = response;
    frameId++;
    if ( !! data || !! screenshotData ) {
      const img = data || screenshotData;
      const F = {img, frameId, targetId};
      F.hash = DEBUG.useHash && !opts.ignoreHash && 
        `${F.img.length}${KEYS.map(k => F.img[k]).join('')}${F.img[F.img.length-1]}`;
      if ( DEBUG.useHash && !opts.ignoreHash && lastHash == F.hash ) {
        if ( DEBUG.shotDebug && DEBUG.val > DEBUG.low ) {
          console.log(`Dropping as image did not change.`);
        }
        return NOIMAGE;
      } else {
        lastHash = F.hash;
        return F;
      }
    } else {
      DEBUG.frameDebug && console.log('no frame!');
      DEBUG.val > DEBUG.med && console.log("Sending no frame");
      if ( DEBUG.shotDebug && DEBUG.val > DEBUG.low ) {
        console.log(`Dropping as shot produced no data.`);
      }
      return NOIMAGE;
    }
  }

  async function saveShot(opts) {
    const F = await Promise.race([
      shot(opts),
      sleep(MAX_TIME_TO_WAIT_FOR_SCREENSHOT)
    ]);
    if ( F && F.img ) {
      if ( DEBUG.binaryFrames ) {
        if ( DEBUG.sendFramesWhenTheyArrive && ! CONFIG.screencastOnly  ) {
          // ISSUE ?: should this really be disabled on screencast ? 
          // bugs here
          // no need to encode 1 time for every client
          // isSafari should be connectionId linked not connection
          let imgBuf = Buffer.from(F.img, 'base64');
          if ( DEBUG.cwebp && ! connection.isSafari ) {
            console.warn(`Not currently supported due to when dependency of cwebp not correctly building in esbuild 
              build script ./scripts/only_build.sh`);
            /*
            const encoder = new CWebp(imgBuf);
            encoder.quality(WEBP_QUAL);
            imgBuf = await encoder.toBuffer();
            */
          }

          const header = Buffer.alloc(28);
          /* magic instead of cast session Id when not in cast mode */
          header.writeUInt32LE(0xCC55151C, 0); 
          header.writeUInt32LE(F.frameId, 4);
          header.writeUInt32LE(parseInt(F.targetId.slice(0,8), 16), 8);
          header.writeUInt32LE(parseInt(F.targetId.slice(8,16), 16), 12);
          header.writeUInt32LE(parseInt(F.targetId.slice(16,24), 16), 16);
          header.writeUInt32LE(parseInt(F.targetId.slice(24,32), 16), 20);

          imgBuf = Buffer.concat([header,imgBuf]);

          //const vals = [...connection.links.entries()];

          for ( const {ack, fastest, peer, socket, connectionId} of connection.links.values() ) {
            if ( ! ack.count && !opts.ignoreHash ) {
              DEBUG.acks && console.log(`No ack for client ${'connectionId'}, so will skip sending frame to client.`);
              if ( DEBUG.bufSend ) {
                ack.buffer.unshift([imgBuf,F.frameId]);
                if ( ack.buffer.length > MAX_ACK_BUFFER ) {
                  ack.buffer.length = MAX_ACK_BUFFER;
                }
              }
              continue;
            }
            DEBUG.acks && console.log({ack:{received:ack.received, count:ack.count}, opts}, new Date);
            DEBUG.acks && console.log('Ack or ignoreHash received so will send frame');
            ack.received = 0;
            ack.count--;
            if ( ack.count < 0 ) ack.count = 0;
            //console.log(connection.links.size, ...connection.links.keys());
            //console.log(peer + socket + '');
            const channel = DEBUG.chooseFastest && fastest ? fastest : 
              DEBUG.useWebRTC && peer ? peer : socket;
            connection.so(channel, imgBuf);
            DEBUG.adaptiveImagery && ack.sent.set(F.frameId, Date.now());
            DEBUG.acks && console.log(`Sent frame to ${connectionId}`);

            if ( DEBUG.chooseFastest && DEBUG.useWebRTC && socket && peer ) {
              const choice = Math.random() >= RACE_SAMPLE;
              if ( choice ) {
                const otherChannel = channel === peer ? socket : peer;
                connection.so(otherChannel, imgBuf);
                DEBUG.logFastest && console.log('Race started');
              }
            }

            if ( DEBUG.bufSend ) {
              ack.buffer.length = 0;
              //ack.bufSend = false;
              clearTimeout(ack.debounceBufSend);
              ack.debounceBufSend = setTimeout(() => ack.bufSend = true, BUF_SEND_TIMEOUT);
            }
          }
        } else { 
          DEBUG.watchFrameStack && console.log('Push frame', (new Error('frame')).stack);
          connection.frameBuffer.push(Buffer.from(F.img, 'base64'));
        }
      } else {
        connection.frameBuffer.push(F);
      }

      const mf = MAX_FRAMES();
      while ( connection.frameBuffer.length > mf ) {
        connection.frameBuffer.shift();
      }
    }

    if ( CONFIG.tailShots ) queueTailShot();

    DEBUG.shotDebug && console.log({framesWaiting:connection.frameBuffer.length, now: Date.now()});
  }

  async function doShot(opts = {}) {
    if ( !(opts.ignoreHash || opts.forceFrame || opts.blockExempt) && (nextShot || shooting) ) {
      DEBUG.shotDebug && DEBUG.val > DEBUG.low && console.log(`Dropping shot`, opts.ignoreHash, opts.forceFrame, nextShot, shooting);
      return;
    }
    shooting = true;
    await Promise.race([
      saveShot(opts),
      sleep(MAX_TIME_TO_WAIT_FOR_SCREENSHOT)
    ]);
    nextShot = setTimeout(() => nextShot = false, MIN_TIME_BETWEEN_SHOTS());
    shooting = false;
  }
}

