// put send, on, ons in page context
{
  const DEBUG = true;
  const MAX_INSTALL_TRIES = 300;
  const INSTALL_INTERVAL_MS = 100;
  let notifyReady;
  let notifyFailed;
  const BindingState = {
    listeners: new Set(),
    isReady: new Promise((res, rej) => (notifyReady = res, notifyFailed = rej)),
  };

  installProtocol();

  function installProtocol() {
    DEBUG && console.log('injecting protocol into page guest page');
    let sbInterval = setInterval(setupBinding, INSTALL_INTERVAL_MS);
    let tries = 0;

    Object.defineProperty(globalThis, '_untilBindingReady', {
      get() {
        return BindingState.isReady
      }
    });

    setupBinding();

    function setupBinding() {
      const binding = self.bb;
      const failOut = tries++ > MAX_INSTALL_TRIES;
      try {
        if ( failOut ) {
          clearInterval(sbInterval);
          sbInterval = false;
          throw new Error(`setupBinding: Maximum install tries exceeded.`);
        }
        if ( typeof binding == "function" ) {
          delete self.bb;
          Binding = {
            send: msg => {
              try {
                binding(JSON.stringify(msg));
              } catch(e) {
                console.warn(`<Binding>.send failed: ${e}`, {error: e, msg});
              }
            },
            addListener,
            _recv: msg => {
              try {
                msg = JSON.parse(msg);
              } catch(e) {
                console.warn(`<Binding>._recv: parsing msg as JSON failed ${e}`, {msg});
              }
              for( const listener of BindingState.listeners.values() ) {
                try {
                  listener(msg);
                } catch(e) {
                  console.warn(`<Binding>.onmessage: listener failed ${e}`, {listener, error: e});
                }
              }
            },
          };
          Object.defineProperty(self, 'bb', { get: () => Binding });
          clearInterval(sbInterval);
          sbInterval = false;
          Binding.send({bindingAttached:true});
          notifyReady(true);
          DEBUG && console.log(`binding set up`);
        }
      } catch(err) {
        console.error(`Binding failed to install: ${err}`, {error: err, tries}); 
        notifyFailed(false);
      }
    }
  }

  async function bindingReady() {
    DEBUG && console.log(`Waiting for binding to be ready`);
    try {
      await BindingState.isReady(); 
    } catch(e) {
      DEBUG && console.warn(`Binding install failed`, e);
      return false;
    }
    DEBUG && console.log(`Binding ready`);
    return true;
  }

  function addListener(listener) {
    if ( typeof listener != "function" ) {
      throw new TypeError(`addListener: Listener for binding must be a function`);
    }
    BindingState.listeners.add(listener);
  }
}
