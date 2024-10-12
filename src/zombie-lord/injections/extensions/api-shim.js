{
  // shim key elements of the chrome extension API 
  const FAKEWIN = {id:1,tabs:[{id:1}], left:0, top:0, width:0, height:0};
  try {
    let messageId = 0;
    let WinId = 1;
    let lastWin;

    if ( !globalThis.__ei_setup ) {
      globalThis.__ei_setup = true;

      const Wins = new Map();
      Wins.set(FAKEWIN.id, FAKEWIN);
      const Listeners = {
        action: new Set(),
        winRemoved: new Set(),
      };

      globalThis.__hear = command => {
        console.log(`Extension injection received command`, JSON.stringify(command));
        switch(command.name) {
          case "actionOnClicked": {
            console.log("action clicked");
            Listeners.action.forEach(listener => {
              try {
                listener(command.params);
              } catch(e) {
                console.warn(`Error executing listener on command actionOnClick`, e, {listener}, {command});
              }
            });
          }; break;
          case "windowRemoved": {
            console.log("win removed");
            Wins.forEach((value, id) => {
              Listeners.winRemoved.forEach(listener => {
                try {
                  console.log(`Calling window removed listener with window id: ${id}`);
                  listener(id);
                } catch(e) {
                  console.warn(`Error executing listener on command actionOnClick`, e, {listener}, {command});
                }
              });
            });
          } break;
          default : {
            console.warn(`Unknown extension injection command`, command);
            break;
          }
        }
      };

      const OG_AOCAL_REF = chrome.action.onClicked.addListener;
      chrome.action.onClicked.addListener = listener => {
        console.log(`Received function`, listener, `for execution on Action click`);
        Listeners.action.add(listener);
      };

      chrome.tabs.remove = (id, cb) => { typeof cb == 'function' && setTimeout(cb, 0); void 0 };
      chrome.windows.remove = (id, cb) => { typeof cb == 'function' && setTimeout(cb, 0); void 0 };


      const OG_WC_REF = chrome.windows.create;
      const OG_WC = async (opts, cb) => OG_WC_REF.call(chrome.windows, opts, cb);
      chrome.windows.create = createWindow;

      async function createWindow(opts, cb) {
        // this works for open and close but is wrong sized

        Object.assign(opts, {
          ...__currentViewport
        });
        say({createTab:{opts}});
        try {
          //const win = await OG_WC(opts);
          //lastWin = win;
          //const win = {id:WinId++};

          //Wins.set(win.id, win);
          //console.log(`I am betting this never executes or FAKEWIN is null`, FAKEWIN, JSON.stringify({FAKEWIN}));

          if ( cb ) {
            setTimeout(() => cb(FAKEWIN), 0);
          }

          return FAKEWIN;
        } catch(e) {
          console.warn('Error makeing window for extension', e);
        }

        /* // this works for first open and is right sized but then close doesn't work
        say({createTab:{opts}});

        const win = await OG_WC({type:opts.type, url:'about:blank', left:0, top:0, width:0, height:0});

        Wins.set(win.id, win);

        const fakeWin = {id: 0, ...__currentViewport};

        if ( cb ) {
          setTimeout(() => cb(fakeWin), 0);
        }

        return fakeWin;
        */
      }

      const OG_CWGC_REF = chrome.windows.getCurrent;
      chrome.windows.getCurrent = async (cb) => {
        let resolve;
        const pr = new Promise(res => resolve = res);
        /*
        OG_CWGC_REF.call(chrome.windows, win => {
          win = FAKEWIN;
          lastWin = win;
          win.height -= 86;
          console.log(win, JSON.stringify(win));
          if ( cb ) {
            return cb(win);
          } else {
            return resolve(win);
          }
        });
        */
        if ( cb ) {
          return cb(FAKEWIN);
        } else {
          return resolve(FAKEWIN);
        }
        return pr;
      };

      const OG_WORAL_REF = chrome.windows.onRemoved.addListener;
      chrome.windows.onRemoved.addListener = listener => {
        console.log(`Received function`, listener, `for execution on window removed`);
        Listeners.winRemoved.add(listener);
      };

      const OG_TORAL_REF = chrome.tabs.onRemoved.addListener;
      chrome.tabs.onRemoved.addListener = listener => {
        console.log(`Received function`, listener, `for execution on tab removed`);
        Listeners.winRemoved.add(listener);
      };

      const OG_CWU_REF = chrome.windows.update;
      chrome.windows.update = async (id, opts, cb) => {
        if ( cb ) {
          setTimeout(() => cb(FAKEWIN), 1000);
        }
        return FAKEWIN;
        /*
        let resolve;
        const pr = new Promise(res => resolve = res);
        OG_CWGC_REF.call(chrome.windows, id, opts, (win) => {
          console.log("Updated window from callback", win, JSON.stringify({win}))
          if ( cb ) {
            return cb(win);
          } else {
            return resolve(win);
          }
        });
        */
      };

      chrome.tabs.onUpdated.addListener = (...whatevers) => 0;
      chrome.runtime.onConnect.addListener = (...whatevers) => 0;

      function say(o) {
        o.messageId = messageId++;
        console.log(JSON.stringify(o));
      }
    }
  } catch(err) {
    console.error(`Error setting up extension injection`, err);
  }
}
