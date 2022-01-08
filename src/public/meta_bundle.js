"use strict";

(function () {
  'use strict';

  var MobilePlatform = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

  function deviceIsMobile() {
    return MobilePlatform.test(navigator.userAgent);
  } // debug logging


  var timers = [];

  if (deviceIsMobile()) {
    window.addEventListener('orientationchange', function (e) {
      //window._voodoo_asyncSizeTab();
      if (document.fullscreenElement) {
        window._voodoo_asyncSizeTab();
      } else {
        timers.forEach(clearTimeout);
        timers.push(setTimeout(function () {
          console.info("Device re-oriented! Updating remote viewport.");

          window._voodoo_asyncSizeTab();
        }, 50));
      }
    });
  } else {
    window.addEventListener('resize', function (e) {
      //window._voodoo_asyncSizeTab();
      if (document.fullscreenElement) {
        window._voodoo_asyncSizeTab();
      } else {
        timers.forEach(clearTimeout);
        timers.push(setTimeout(function () {
          console.info("Window resized! Updating remote viewport.");

          window._voodoo_asyncSizeTab();
        }, 50));
      }
    });
  }

  setupUnloadHandler();

  function setupUnloadHandler() {
    self.addEventListener('beforeunload', function (event) {
      var delayOffRequested = !!document.querySelector('form.delay-off') || window._voodoo_noUnloadDelay;

      if (!delayOffRequested) {
        event.preventDefault();
        event.returnValue = "\n        You are about to leave the browser.\n        If you wanted to navigate, use the < and > buttons provided.\n      ";
      }
    });
  }
})();

