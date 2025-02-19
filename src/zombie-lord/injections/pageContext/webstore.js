{
  try {
    let shimmed = false;
    shim();
    let int = setInterval(() => {
      if ( shim() ) {
        clearInterval(int);
      }
    }, 1);
    function shim() {
      try {
        if ( shimmed ) return;
        if ( chrome.webstorePrivate ) {
          const B = chrome.webstorePrivate;
          let done = 0;
          if ( chrome.webstorePrivate.beginInstallWithManifest3 ) {
            const f = chrome.webstorePrivate.beginInstallWithManifest3;
            chrome.webstorePrivate.beginInstallWithManifest3 = g;
            async function g(...args) {
              const ret = f.call(B, args[0], () => {
                alert('ret after begin');
                console.log('Running complete...');
                if (chrome.runtime.lastError) alert(chrome.runtime.lastError.message)
                chrome.webstorePrivate.completeInstall(args[0].id, () => {
                  alert('complete returned');
                  if (chrome.runtime.lastError) alert(chrome.runtime.lastError.message)
                });
              });
              console.log('bi', {args, ret});
              alert('requested');
              return ret;
            }
            done += 1;
          }
          if ( chrome.webstorePrivate.completeInstall ) {
            const f = chrome.webstorePrivate.completeInstall;
            chrome.webstorePrivate.completeInstall = async (...args) => {
              alert('complete requested');
              const ret = await f.call(B, ...args); 
              console.log('ci', {args, ret});
              return ret;
            };
            done += 1;
          }
          //alert('shim ' + done);
          shimmed = done == 2;
          return done == 2;
        }
      } catch(e) {
        alert(e + e.stack);
      }
    }
  } catch(e) {
    alert(e + e.stack);
  }
}

