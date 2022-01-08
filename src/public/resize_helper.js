import {deviceIsMobile as isMobile} from './voodoo/src/common.js';

// const
  const timers = [];

  if ( isMobile() ) {
    window.addEventListener('orientationchange', e => {
      //window._voodoo_asyncSizeTab();
      if ( document.fullscreenElement ) {
        window._voodoo_asyncSizeTab();
      } else {
        timers.forEach(clearTimeout);
        timers.push(setTimeout(() => {
          console.info("Device re-oriented! Updating remote viewport.");
          window._voodoo_asyncSizeTab();
        }, 50));
      }
    });
  } else {
    window.addEventListener('resize', e => {
      //window._voodoo_asyncSizeTab();
      if ( document.fullscreenElement ) {
        window._voodoo_asyncSizeTab();
      } else {
        timers.forEach(clearTimeout);
        timers.push(setTimeout(() => {
          console.info(`Window resized! Updating remote viewport.`);
          window._voodoo_asyncSizeTab();
        }, 50));
      }
    });
  }

