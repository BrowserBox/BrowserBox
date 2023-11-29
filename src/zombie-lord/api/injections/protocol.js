// put send, on, ons in page context
{
  const DEBUG = true;
  const BindingState = {
    listeners: new Set(),
  };

  installProtocol();

  function installProtocol() {
    DEBUG && console.log('injecting protocol into page guest page');
    const sbInterval = setInterval(setupBinding, 20);
    setupBinding();
    function setupBinding() {
      const binding = self.bb;
      if ( typeof binding == "function" ) {
        delete self.bb;
        Binding = {
          send: msg => {
            try {
              binding(JSON.stringify(msg));
            } catch(e) {
              console.warn(`<Binding>.send failed: ${e}`, {error: e, msg});
            }
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
        Binding.send({bindingAttached:true});
        clearInterval(sbInterval);
        DEBUG && console.log(`binding set up`);
      }
    }
  }

  function addListener(listener) {
    if ( typeof listener != "function" ) {
      throw new TypeError(`addListener: Listener for binding must be a function`);
    }
    BindingState.listeners.add(listener);
  }
}
