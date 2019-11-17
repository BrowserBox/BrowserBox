import {DEBUG} from '../common.js';
import sharp from 'sharp';

// image formats for capture depend on what the client can accept
  const SAFARI_FORMAT = {
    format: "jpeg",
    quality: 21 /* 25, 50, 80, 90, 100 */
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
const MIN_TIME_BETWEEN_SHOTS = 200; /* 20, 40, 100, 250, 500 */
const MIN_TIME_BETWEEN_TAIL_SHOTS = 100; /* 40, 100, 250, 500 */
const MAX_TIME_BETWEEN_TAIL_SHOTS = 2000;

let frameId = 1;
let lastHash;
let tailShotTime = MIN_TIME_BETWEEN_TAIL_SHOTS;

export function makeCamera(connection) {
  let tailShot;
  let nextShot;
  let lastShot;

  return doShot;

  async function shot() {
    if ( DEBUG.noShot ) return;
    if ( DEBUG.val > DEBUG.low ) {
      const timeNow = Date.now();
      console.log("Do shot", timeNow - lastShot);
      lastShot = timeNow;
    }
    const targetId = connection.sessions.get(connection.sessionId);
    try {
      let response;
      const ShotCommand = (connection.isSafari ? SAFARI_SHOT : WEBP_SHOT).command;
      DEBUG.val > DEBUG.med && console.log(`XCHK screenShot.js (${ShotCommand.name}) call response`, ShotCommand, response ? JSON.stringify(response).slice(0,140) : response );
      response = await connection.sessionSend(ShotCommand);
      response = response || {};
      const {data,screenshotData} = response;
      frameId++;
      if ( !! data || !! screenshotData ) {
        const img = Buffer.from(data || screenshotData, 'base64');
        const F = {img, frame: frameId, targetId};
        await forExport({frame:F, connection});
        F.hash = F.img;
        return F;
      } else {
        DEBUG.val > DEBUG.med && console.log("Sending no frame");
        return {img: '', frame:0};
      }
    } catch(e) {
      console.warn(e);
      return {img: '', frame:0};
    }
  }

  async function saveShot({tail:tail = false} = {}) {
    const F = await shot();        
    if ( !! F.img ) {
      connection.frameBuffer.push(F);

      while ( connection.frameBuffer.length > MAX_FRAMES ) {
        connection.frameBuffer.shift();
      }
    }

    if ( ! tail ) {
      clearTimeout(tailShot);
      tailShot = setTimeout(doTailShot, tailShotTime);
    }
    DEBUG.val > DEBUG.high && console.log({framesWaiting:connection.frameBuffer.length, now: Date.now()});
  }

  async function doTailShot() {
    if ( tailShot ) {
      clearTimeout(tailShot);
    }
    DEBUG.val > DEBUG.low && console.log("Tail shot");
    await saveShot({tail:true});
    DEBUG.val > DEBUG.med && console.log("Doing tail shot");
    if ( tailShotTime < MAX_TIME_BETWEEN_TAIL_SHOTS) {
      tailShot = setTimeout(doTailShot, tailShotTime);
      tailShotTime = 1.618*tailShotTime;
    } else {
      tailShotTime = MIN_TIME_BETWEEN_TAIL_SHOTS;
    }
  }

  // throttled && debounced with tail 
  async function doShot() {
    if ( nextShot ) return;
    nextShot = setTimeout(() => { 
      nextShot = false; 
      DEBUG.val > DEBUG.med && !DEBUG.noShot && console.log(`Doing shot ${Date.now()}`);
      saveShot();
    }, MIN_TIME_BETWEEN_SHOTS);
  }
}

export async function forExport({frame, connection}) {
  let {img} = frame;
  // FIXME : CPU issues
  if ( ! connection.isSafari ) {
    img = await sharp(img).webp(WEBP_OPTS).toBuffer();
  }
  img = img.toString('base64');
  frame.img = img;
  return frame;
}

export async function frameHash(frame) {
  // updated to use current (Nov 2019) Sharp API.
  // from:
  // https://github.com/lovell/sharp/commit/c15994812756c206987d29102471e69c6bbd3fc1#diff-900514821d804f6815b2dcd954387ac4
  // Generates a 64-bit(<s>-as-binary-string</s>) image fingerprint
  // Based on the dHash gradient method - see http://www.hackerfactor.com/blog/index.php?/archives/529-Kind-of-Like-That.html
  let data = await sharp(frame.img)
    .greyscale()
    .normalise()
    .resize(27, 10, {fit: 'fill', kernel: 'mitchell'})
    .raw()
    .toBuffer(); 

  let fingerprint = '';

  for (let col = 0; col < 26; col++) {
    let gradient = 0;
    for (var row = 0; row < 10; row++) {
      let left = data[row * 26 + col];
      let right = data[row * 26 + col + 1];
      fingerprint = fingerprint + (left < right ? '1' : '0');
    }
  }

  return fingerprint;
}
