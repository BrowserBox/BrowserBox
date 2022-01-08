(function () {
  'use strict';

  const MobilePlatform = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  function deviceIsMobile() {
    return MobilePlatform.test(navigator.userAgent);
  } // debug logging

  const timers = [];

  if (deviceIsMobile()) {
    window.addEventListener('orientationchange', e => {
      //window._voodoo_asyncSizeTab();
      if (document.fullscreenElement) {
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
      if (document.fullscreenElement) {
        window._voodoo_asyncSizeTab();
      } else {
        timers.forEach(clearTimeout);
        timers.push(setTimeout(() => {
          console.info("Window resized! Updating remote viewport.");

          window._voodoo_asyncSizeTab();
        }, 50));
      }
    });
  }

  setupUnloadHandler();
  function setupUnloadHandler() {
    self.addEventListener('beforeunload', event => {
      const delayOffRequested = !!document.querySelector('form.delay-off') || window._voodoo_noUnloadDelay;

      if (!delayOffRequested) {
        event.preventDefault();
        event.returnValue = "\n        You are about to leave the browser.\n        If you wanted to navigate, use the < and > buttons provided.\n      ";
      }
    });
  }

})();
