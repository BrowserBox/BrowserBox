// put send, on, ons in page context
{
  const BINDING_NAME = 'bb';
  const DEBUG = true;
  const MAX_INSTALL_TRIES = 300;
  const INSTALL_INTERVAL_MS = 100;
  let notifyReady;
  let notifyFailed;
  let messageId = 3e7; // avoid conflict with other message ids
  const BindingState = {
    listeners: new Set(),
    isReady: new Promise((res, rej) => (notifyReady = res, notifyFailed = rej)),
    resolvers: new Map(),
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
      const binding = self[BINDING_NAME];
      const failOut = tries++ > MAX_INSTALL_TRIES;
      try {
        if ( failOut ) {
          clearInterval(sbInterval);
          sbInterval = false;
          throw new Error(`setupBinding: Maximum install tries exceeded.`);
        }
        if ( typeof binding == "function" ) {
          delete self[BINDING_NAME];
          const Binding = {
            send: msg => {
              try {
                return binding(JSON.stringify(msg));
              } catch(e) {
                console.warn(`<Binding>.send failed: ${e}`, {error: e, msg});
              }
            },
            addListener,
            _recv: msg => {
              /* we don't actually pass json, we use objects directly
                try {
                  msg = JSON.parse(msg);
                } catch(e) {
                  console.warn(`<Binding>._recv: parsing msg as JSON failed ${e}`, {msg});
                }
              */
              for( const listener of BindingState.listeners.values() ) {
                try {
                  listener(msg);
                } catch(e) {
                  console.warn(`<Binding>.onmessage: listener failed ${e}`, {listener, error: e});
                }
              }
            },
            ctl: (method, params, sessionId) => {
              const key = `binding${messageId++}`;
              let returnReply;
              const pr = new Promise(res => returnReply = res);

              BindingState.resolvers.set(key, returnReply);

              Binding.send({method, params, sessionId, key}); 

              return pr;
            }
          };
          Binding.addListener(generalResolver);
          Object.defineProperty(self, BINDING_NAME, { get: () => Binding });
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

    function generalResolver({response} = {}) {
      DEBUG && console.log(`General resolver received message: ${response}`, response);
      if ( ! response ) {
        DEBUG && console.warn(`No response`); 
        return;
      }
      const {key} = response;
      if ( !!key && BindingState.resolvers.has(key) ) {
        delete response.key;
        const replier = BindingState.resolvers.get(key);
        BindingState.resolvers.delete(key);
        return replier(response);
      } else {
        if ( ! key ) {
          DEBUG && console.info(`No key for message: ${response}`, response);
        } else {
          DEBUG && console.info(`No replier for message: ${response}`, response);
        }
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
