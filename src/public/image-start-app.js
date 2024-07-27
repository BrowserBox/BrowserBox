import Voodoo from './voodoo/index.js';
import getAPI from './getAPI.js';
import {default as image_translator} from './translateVoodooCRDP.js';

// main start
globalThis._restartApp = start_app;
globalThis._sessionToken = () => {
  let sessionToken = location.hash && location.hash.slice(1);
  if ( ! sessionToken ) {
    sessionToken = localStorage.getItem("sessionToken");
  } else {
    localStorage.setItem("sessionToken", sessionToken);
  }
  return sessionToken;
};

start_app();

async function start_app() {
  const useViewFrame = false;
  const translator = image_translator;
  const voodoo = await Voodoo({api: getAPI(), translator, useViewFrame,
    postInstallTasks: [() => self._voodoo_resizeAndReport]
  });
  self.voodoo = voodoo;
  return voodoo;
}
