import {CONFIG} from './voodoo/src/common.js';

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
  const token = uri.hash.slice(1);
  if ( ! zVal && ! token ) {
    // no tor params
    return;
  }

  if ( zVal ) {
    const z = JSON.parse(atob(decodeURIComponent(zVal)));
    localStorage.setItem(CONFIG.audioServiceFileName, z.x);
    localStorage.setItem(CONFIG.devtoolsServiceFileName, z.y);

    if ( ! z.x || ! z.y ) {
      console.warn(`Missing tor addresses for services`, z);
    } else {
      // pre fetch to warm up cache in case they open it
      const OPTS = { method: "GET", mode: "no-cors" };
      fetch(`${location.protocol}//${z.x}`, OPTS);
      fetch(`${location.protocol}//${z.y}`, OPTS);
    }
  }

  if ( token ) {
    localStorage.setItem(CONFIG.sessionTokenFileName, token);
  }
}

