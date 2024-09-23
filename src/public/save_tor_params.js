import {COMMON, CONFIG} from './voodoo/src/common.js';

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

    if ( ! z.x || ! z.y ) {
      console.warn(`Missing tor addresses for services`, z);
    } else {
      // pre fetch to warm up cache in case they open it
      const OPTS = { method: "GET", mode: "no-cors" };
      const audioURI = `${location.protocol}//${z.x}/?token=${encodeURIComponent(token)}`;
      const activateOnly = audioURI + '&activateOnly=true';
      fetch(activateOnly, OPTS).catch(async err => {
        const getAudio = confirm(`Would you like to active audio?\n\nIf you want to, hit OK, and allow the audio window to open. You will see a security error on that popup relating to the self-signed HTTPS certificates we use.\n\nIf you want to enable audio, you need to click "Advanced" and "Accept the Risk and Continue".\n\nOnce you have done that, we will close that window and reload this page to activate audio.\n\nWant to proceed to activate audio?`);
        if ( getAudio ) {
          let ref = window.open(activateOnly); 
          if ( ! ref ) {
            document.addEventListener('click', () => {
              ref = window.open(activateOnly);
            }, {once: true});
            alert('Oops, popup was blocked. Please close this message, then click the page to open the popup again.');
          } else {
            console.info(`Popup successfully opening`);
          }
          let keepChecking = true;
          while(keepChecking) {
            await sleep(1000);
            await fetch(audioURI, OPTS).then(r => {
              keepChecking = false; 
            }).catch(() => console.info(`Audio not activated yet`));
          }
          ref?.close?.();
          alert(`Audio is activated. Please close this message and we will reload your page so audio will now work with your remote browser.`);
          COMMON.delayUnload = false;
          location.reload();
        } else {
          console.info(`Proceeding without audio.`);
        }
      });
      fetch(`${location.protocol}//${z.y}/?token=${encodeURIComponent(token)}`, OPTS).catch(err => {
        console.warn(`DevTools is not yet activated`);
      });
    }
  }

  if ( token ) {
    localStorage.setItem(CONFIG.sessionTokenFileName, token);
  }
}

