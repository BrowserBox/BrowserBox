import {DEBUG} from '../common.js';
import sharp from 'sharp';

const NOIMAGE = {img: '', frame:0};
const KEYS = [
  1, 11, 13, 629, 1229, 2046, 17912, 37953, 92194, 151840
];
// image formats for capture depend on what the client can accept
  const SAFARI_FORMAT = {
    format: "jpeg",
    quality: 35 /* 25, 50, 80, 90, 100 */
  };
  const WEBP_FORMAT = {
    format: "png"
  };
  const SAFARI_SHOT = {
    command: {
      name: DEBUG.legacyShots ? "Page.captureScreenshot" : "HeadlessExperimental.beginFrame",
      params: DEBUG.legacyShots ? SAFARI_FORMAT : {
        interval: 40, /* ms between frames */
        screenshot : SAFARI_FORMAT
      }
    }
  };
  const WEBP_SHOT = {
    command: {
      name: DEBUG.legacyShots ? "Page.captureScreenshot" : "HeadlessExperimental.beginFrame",
      params: DEBUG.legacyShots ? WEBP_FORMAT : {
        interval: 40, /* ms between frames */
        screenshot : WEBP_FORMAT
      }
    }
  };

const WEBP_OPTS = {
  quality: 42,
};
const MAX_FRAMES = 2; /* 1, 2, 4 */
const MIN_TIME_BETWEEN_SHOTS = 40; /* 20, 40, 100, 250, 500 */
const MIN_TIME_BETWEEN_TAIL_SHOTS = 300;

let frameId = 1;
let lastHash;

export function makeCamera(connection) {
  let tailShot = false;
  let shooting = false;
  let nextShot = false;
  let lastShot = Date.now();

  return doShot;

  async function shot() {
    if ( DEBUG.noShot ) return NOIMAGE;
    if ( shooting ) return NOIMAGE;
    shooting = true;
    const timeNow = Date.now();
    const dur = timeNow - lastShot;
    if ( dur < MIN_TIME_BETWEEN_SHOTS ) {
      if ( DEBUG.shotDebug || DEBUG.val > DEBUG.low ) {
        console.log(`Dropping as duration (${dur}) too short.`);
      }
      shooting = false;
      return NOIMAGE;
    }
    if ( DEBUG.shotDebug || DEBUG.val > DEBUG.low ) {
      console.log(`Do shot ${dur}ms`);
    }
    const targetId = connection.sessions.get(connection.sessionId);
    let response;
    const ShotCommand = (connection.isSafari ? SAFARI_SHOT : WEBP_SHOT).command;
    DEBUG.val > DEBUG.med && console.log(`XCHK screenShot.js (${ShotCommand.name}) call response`, ShotCommand, response ? JSON.stringify(response).slice(0,140) : response );
    response = await connection.sessionSend(ShotCommand);
    lastShot = timeNow;
    response = response || {};
    const {data,screenshotData} = response;
    frameId++;
    if ( !! data || !! screenshotData ) {
      const img = Buffer.from(data || screenshotData, 'base64');
      const F = {img, frame: frameId, targetId};
      F.hash = `${F.img.length}${KEYS.map(k => F.img[k]).join('')}${F.img[F.img.length-1]}`;
      if ( lastHash == F.hash ) {
        if ( DEBUG.shotDebug || DEBUG.val > DEBUG.low ) {
          console.log(`Dropping as image did not change.`);
        }
        shooting = false;
        return NOIMAGE;
      } else {
        lastHash = F.hash;
        await forExport({frame:F, connection});
        shooting = false;
        return F;
      }
    } else {
      DEBUG.val > DEBUG.med && console.log("Sending no frame");
      if ( DEBUG.shotDebug || DEBUG.val > DEBUG.low ) {
        console.log(`Dropping as shot produced no data.`);
      }
      shooting = false;
      return NOIMAGE;
    }
  }

  async function saveShot() {
    const F = await shot();        
    if ( !! F.img ) {
      connection.frameBuffer.push(F);

      while ( connection.frameBuffer.length > MAX_FRAMES ) {
        connection.frameBuffer.shift();
      }
    }

    DEBUG.val > DEBUG.high && console.log({framesWaiting:connection.frameBuffer.length, now: Date.now()});
    nextShot = false;
  }

  async function doShot() {
    if ( nextShot ) return;
    saveShot();
    nextShot = setTimeout(() => { 
      nextShot = false;
      if ( tailShot ) {
        clearTimeout(tailShot);
      }
      tailShot = nextShot = setTimeout(() => {
        tailShot = false;
        console.log("Tail shot");
        saveShot();
      }, MIN_TIME_BETWEEN_TAIL_SHOTS);
      DEBUG.val > DEBUG.med && !DEBUG.noShot && console.log(`Doing shot ${Date.now()}`);
    }, MIN_TIME_BETWEEN_SHOTS);
  }
}

export async function forExport({frame, connection}) {
  let {img} = frame;
  if ( ! connection.isSafari ) {
    img = await sharp(img).webp(WEBP_OPTS).toBuffer();
  }
  img = img.toString('base64');
  frame.img = img;
  return frame;
}

