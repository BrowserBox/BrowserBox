
  {
    const DEBUG = {
      dev: true, 
      err: true
    };

    setupErrorCatchers();

    function setupErrorCatchers() {
      (DEBUG.dev || DEBUG.err) && (self.onerror = (...v) => (func(v), true));
      (DEBUG.dev || DEBUG.err) && (self.onunhandledrejection = (e) => (e.promise.catch(err => func(err+' '+err.stack)), true));
    }

    function func() {
      if ( isMobile() ) {
        return (...x) => alert(x[0]);
      } else {
        return (...x) => console.log(...x)
      }
    }

    function extractMeat(list) {
      const meatIndex = list.findIndex(val => !! val && val.message || val.stack);
      if ( meatIndex == -1 || meatIndex == undefined ) {
        return "";
      } else {
        return list[meatIndex];
      }
    }
  }
