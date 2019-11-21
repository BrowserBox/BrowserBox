import {DEBUG} from '../common.js';

const MAX_FRAMES = 2; /* 1, 2, 4 */
const MIN_TIME_BETWEEN_SHOTS = 100; /* 20, 40, 100, 250, 500 */
const MIN_TIME_BETWEEN_TAIL_SHOTS = 300;
const NOIMAGE = {img: '', frame:0};
const KEYS = [
  1, 11, 13, 629, 1229, 2046, 17912, 37953, 92194, 151840
];
// image formats for capture depend on what the client can accept
  const SAFARI_FORMAT = {
    format: "jpeg",
    quality: 35 /* 25, 50, 80, 90, 100 */
  };
  const SAFARI_SHOT = {
    command: {
      name: DEBUG.legacyShots ? "Page.captureScreenshot" : "HeadlessExperimental.beginFrame",
      params: DEBUG.legacyShots ? SAFARI_FORMAT : {
        interval: MIN_TIME_BETWEEN_SHOTS, /* ms between frames */
        screenshot : SAFARI_FORMAT
      }
    }
  };

export function makeCamera(connection) {
  let shooting = false;
  let frameId = 1;
  let lastHash;
  let lastShot = Date.now();
  let nextShot;

  return doShot;

  async function shot() {
    if ( DEBUG.noShot ) return NOIMAGE;
    const timeNow = Date.now();
    const dur = timeNow - lastShot;
    if ( dur < MIN_TIME_BETWEEN_SHOTS ) {
      if ( DEBUG.shotDebug || DEBUG.val > DEBUG.low ) {
        console.log(`Dropping as duration (${dur}) too short.`);
      }
      return NOIMAGE;
    }
    if ( DEBUG.shotDebug || DEBUG.val > DEBUG.low ) {
      console.log(`Do shot ${dur}ms`);
    }
    const targetId = connection.sessions.get(connection.sessionId);
    let response;
    const ShotCommand = SAFARI_SHOT.command;
    DEBUG.val > DEBUG.med && console.log(`XCHK screenShot.js (${ShotCommand.name}) call response`, ShotCommand, response ? JSON.stringify(response).slice(0,140) : response );
    response = await connection.sessionSend(ShotCommand);
    lastShot = timeNow;
    response = response || {};
    const {data,screenshotData} = response;
    frameId++;
    if ( !! data || !! screenshotData ) {
      const img = data || screenshotData;
      const F = {img, frame: frameId, targetId};
      F.hash = `${F.img.length}${KEYS.map(k => F.img[k]).join('')}${F.img[F.img.length-1]}`;
      if ( lastHash == F.hash ) {
        if ( DEBUG.shotDebug || DEBUG.val > DEBUG.low ) {
          console.log(`Dropping as image did not change.`);
        }
        return NOIMAGE;
      } else {
        lastHash = F.hash;
        return F;
      }
    } else {
      DEBUG.val > DEBUG.med && console.log("Sending no frame");
      if ( DEBUG.shotDebug || DEBUG.val > DEBUG.low ) {
        console.log(`Dropping as shot produced no data.`);
      }
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
  }

  async function doShot() {
    if ( nextShot || shooting ) return;
    shooting = true;
    await saveShot();
    nextShot = setTimeout(() => nextShot = false, MIN_TIME_BETWEEN_SHOTS);
    shooting = false;
  }
}


