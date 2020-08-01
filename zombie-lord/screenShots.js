import {DEBUG} from '../common.js';

const MAX_FRAMES = 3; /* 1, 2, 4 */
const MIN_TIME_BETWEEN_SHOTS = 150; /* 20, 40, 100, 250, 500 */
const MIN_TIME_BETWEEN_TAIL_SHOTS = 250;
const MAX_TIME_BETWEEN_TAIL_SHOTS = 3000;
const NOIMAGE = {img: '', frame:0};
const KEYS = [
  1, 11, 13, 629, 1229, 2046, 17912, 37953, 92194, 151840
];
// image formats for capture depend on what the client can accept
  const WEBP_FORMAT = {
    format: "png"
  };
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
  const WEBP_SHOT = {
    command: {
      name: DEBUG.legacyShots ? "Page.captureScreenshot" : "HeadlessExperimental.beginFrame",
      params: DEBUG.legacyShots ? WEBP_FORMAT : {
        interval: MIN_TIME_BETWEEN_SHOTS, /* ms between frames */
        screenshot : WEBP_FORMAT
      }
    }
  };
  const WEBP_OPTS = {
    quality: 8,
  };
  const MIN_WP_QUAL = 2;
  const MAX_WP_QUAL = 52;
  const MIN_JPG_QUAL = 10;
  const MAX_JPG_QUAL = 83;

export function makeCamera(connection) {
  let shooting = false;
  let frameId = 1;
  let lastHash;
  let lastShot = Date.now();
  let nextShot;
  let tailShot, tailShotDelay = MIN_TIME_BETWEEN_TAIL_SHOTS;

  const nextTailShot = () => {
    DEBUG.shotDebug && console.log("Tail shot");
    doShot();
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
  };

  return {queueTailShot, doShot, shrinkImagery, growImagery};

  function shrinkImagery({averageBw}) {
    SAFARI_SHOT.command.params.quality -= 2;
    if ( SAFARI_SHOT.command.params.quality < MIN_JPG_QUAL ) {
      SAFARI_SHOT.command.params.quality = MIN_JPG_QUAL;
    }
  }

  function growImagery({averageBw}) {
    SAFARI_SHOT.command.params.quality += 2;
    if ( SAFARI_SHOT.command.params.quality > MAX_JPG_QUAL ) {
      SAFARI_SHOT.command.params.quality = MAX_JPG_QUAL;
    }
  }

  function queueTailShot() {
    if ( tailShot ) {
      clearTimeout(tailShot);
      tailShotDelay = MIN_TIME_BETWEEN_TAIL_SHOTS;
      tailShot = false;
    }
    tailShot = setTimeout(nextTailShot, tailShotDelay);
  }

  async function shot() {
    // DEBUG
    if ( DEBUG.noShot ) return NOIMAGE;
    const timeNow = Date.now();
    const dur = timeNow - lastShot;
    if ( dur < MIN_TIME_BETWEEN_SHOTS ) {
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
    DEBUG.shotDebug && console.log(`XCHK screenShot.js (${ShotCommand.name}) call response`, ShotCommand, response ? JSON.stringify(response).slice(0,140) : response );
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
        if ( DEBUG.shotDebug && DEBUG.val > DEBUG.low ) {
          console.log(`Dropping as image did not change.`);
        }
        return NOIMAGE;
      } else {
        lastHash = F.hash;
        return F;
      }
    } else {
      DEBUG.val > DEBUG.med && console.log("Sending no frame");
      if ( DEBUG.shotDebug && DEBUG.val > DEBUG.low ) {
        console.log(`Dropping as shot produced no data.`);
      }
      return NOIMAGE;
    }
  }

  async function saveShot() {
    const F = await shot();        
    if ( F.img ) {
      connection.frameBuffer.push(F);

      while ( connection.frameBuffer.length > MAX_FRAMES ) {
        connection.frameBuffer.shift();
      }
    }

    queueTailShot();

    DEBUG.shotDebug && console.log({framesWaiting:connection.frameBuffer.length, now: Date.now()});
  }

  async function doShot() {
    if ( nextShot || shooting ) return;
    shooting = true;
    await saveShot();
    nextShot = setTimeout(() => nextShot = false, MIN_TIME_BETWEEN_SHOTS);
    shooting = false;
  }
}



