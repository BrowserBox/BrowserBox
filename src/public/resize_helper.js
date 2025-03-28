import {DEBUG, sleep, deviceIsMobile as isMobile} from './voodoo/src/common.js';
{
  // const
    const timers = [];
    let running = false;
    let repeat = true;

  //window.addEventListener('load', resizeAndReport, {once:true});
  resizeAndReport();

  window.addEventListener('message', ({data,origin}) => {
    const target = new URL(location);
    target.port = parseInt(location.port) - 1;
    if ( target.origin !== origin ) {
      DEBUG.val >= DEBUG.med && console.log(`Bad origin`);
    }
    const {ack} = data;
    if ( ack && ack.viewport ) {
      DEBUG.val >= DEBUG.med && console.log(`Viewport received. Switching off send repeat`);
      repeat = false;
    }
  });

  window.addEventListener('orientationchange', e => {
    //window._voodoo_asyncSizeTab();
    try {
      if ( document.fullscreenElement ) {
        resizeAndReport();
      } else {
        timers.forEach(clearTimeout);
        timers.push(setTimeout(() => {
          DEBUG.val >= DEBUG.med && console.info("Device re-oriented! Updating remote viewport.");
          resizeAndReport();
        }, 50));
      }
    } catch(e) {
      console.warn('Error on orientation change', e);
    }
  });

  window.addEventListener('resize', e => {
    try {
      //window._voodoo_asyncSizeTab();
      if ( document.fullscreenElement ) {
        resizeAndReport()
      } else {
        timers.forEach(clearTimeout);
        timers.push(setTimeout(() => {
          DEBUG.val >= DEBUG.med && console.info(`Window resized! Updating remote viewport.`);
          resizeAndReport()
        }, 50));
      }
    } catch(e) {
      console.warn('Error on resize', e);
    }
  });

  async function resizeAndReport() {
    if ( running ) return;
    await sleep(500);
    running = true;
    repeat = true;
    while(true) {
      let viewport;
      try {
        viewport = await window._voodoo_asyncSizeTab({forceFrame:true});
        if ( ! viewport ) {
          throw new Error(`viewport did not load yet`);
        } else {
          DEBUG.val && console.log({resize_helper: 'sized viewport', viewport});
        }
      } catch(e) {
        DEBUG.val >= DEBUG.med && console.warn('Error on report loop', e);
        await sleep(500);
        continue;
      }

      viewport.isMobile = isMobile();
      viewport.hasTouch = viewport.isMobile;
      // need to repeat until ack
      while(repeat && frames.pptr_console) {
        await sleep(350);
        frames.pptr_console && frames.pptr_console.postMessage({viewport}, '*');
      }
      break;
    }
    DEBUG.val >= DEBUG.med && console.log(`Done`);
    running = false;
  }

  self._voodoo_resizeAndReport = resizeAndReport;
}
