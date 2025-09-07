import {COMMON, CONFIG, sleep} from './voodoo/src/common.js';

// Note
  // some services (audio and devtools) require the client to know their URL in order to connect. 
  // in the case of tor we can't calculate from ports as there are independent random addresses
  // this function saves these to local storage for later so we don't always have to provide them
  // in the url. It's expected that for a given main app onion address (hidden service) the 
  // audio and devtools addresses will remain as they are. In other words, all services in an 
  // instance will update their addresses in sync, whent he service as a whole is restarted. 
  // but for the duration of a single run, the addresses are consistent, and so local storage
  // is a good way for the main service to store these other addresses against its own

saveTorParams();

function saveTorParams() {
  const uri = new URL(location); 
  const zVal = uri.searchParams.get('z');
  const token = uri.hash.slice(1) || uri.searchParams.get('token') || localStorage.getItem('sessionToken');
  if ( ! zVal && ! token ) {
    // no tor params
    return;
  }

  //console.log(uri.hash.slice(1), uri.searchParams.get('token'), localStorage.getItem('sessionToken'));

  if ( zVal ) {
    const z = JSON.parse(atob(decodeURIComponent(zVal)));
    localStorage.setItem(CONFIG.audioServiceFileName, z.x);
    localStorage.setItem(CONFIG.devtoolsServiceFileName, z.y);
    localStorage.setItem(CONFIG.docsServiceFileName, z.z);

    if ( ! z.x || ! z.y || ! z.z ) {
      console.warn(`Missing tor addresses for services`, z);
    } else {
      // pre fetch to warm up cache in case they open it
      const OPTS = { method: "GET", mode: "no-cors" };
      const audioURI = `${location.protocol}//${z.x}/?token=${encodeURIComponent(token)}`;
      const activateOnly = audioURI + '&activateOnly=true';
      fetch(activateOnly, OPTS).catch(async err => {
        const getAudio = confirm(`Would you like audio?\n\nIf yes, tap 'Confirm' or 'OK', and a window will open that will auto-set it up.\nLook out for a message that a 'popup was blocked'. If you see that message, click it to allow popups.` + (
          CONFIG.isTor ? 
            `\n\nAlso, when this popup loads you might see a security error because we use an extra-encryption (HTTPS) not widely available for Tor. You need to click through this if you want audio ("Advanced" and "Accept the Risk and Continue").\n\nActivate audio?` 
              : ''
          )
        );
        if ( getAudio ) {
          let ref;
          if ( ! ref ) {
            document.addEventListener('click', () => {
              ref = window.open(activateOnly);
            }, {once: true});
            alert('Oops a popup was blocked. Please close this message, then click the page to open the popup again.');
          } else {
            console.info(`Popup successfully opening`);
          }
          let keepChecking = true;
          while(keepChecking) {
            await sleep(1000);
            await fetch(activateOnly, OPTS).then(r => {
              keepChecking = false; 
            }).catch(() => console.info(`Audio not activated yet`));
          }
          let closed = false;
          try {
            if ( ref && typeof ref.close == "function" ) {
              ref.close();
              await sleep(300);
              closed = true;
            }
          } catch(e) {
            console.warn(`Error closing popup`, e);
          }
          if ( closed ) {
            alert(`Audio is activated. Please close this message and we will reload your page so audio will now work with your remote browser.`);
          } else {
            alert(`Audio is activated. Please close this message and we will reload your page so audio will now work with your remote browser.\n\nAlso, sorry we could not close that popup window automatically. It's safe to close yourself.`);
          }
          COMMON.delayUnload = true;
          setTimeout(() => location.reload(), 100);
        } else {
          console.info(`Proceeding without audio.`);
        }
      });
      fetch(`${location.protocol}//${z.y}/?token=${encodeURIComponent(token)}`, OPTS).catch(err => {
        console.warn(`DevTools is not yet activated`);
      });
      fetch(`${location.protocol}//${z.z}/?token=${encodeURIComponent(token)}`, OPTS).catch(err => {
        console.warn(`Docs is not yet activated`);
      });
    }
  }

  if ( token ) {
    localStorage.setItem(CONFIG.sessionTokenFileName, token);
  }
}

