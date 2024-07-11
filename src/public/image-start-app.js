import Voodoo from './voodoo/index.js';
import getAPI from './getAPI.js';
import {default as image_translator} from './translateVoodooCRDP.js';

// main start
const LOAD_WAIT = 10000; // 10 seconds for load
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
  console.log(voodoo);
  try {
    await Promise.race([
      voodoo.api.untilLoaded(),
      new Promise((_, rej) => setTimeout(rej, LOAD_WAIT)),
    ]);
  } catch(e) {
    alert(`Hmm, looks like your page is taking longer to load than normal. This is usually fixed by reloading and trying again. Let's try that!`);
    location.reload();
  }
  return voodoo;
}
