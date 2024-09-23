import Voodoo from './voodoo/index.js';
import getAPI from './getAPI.js';
import {default as image_translator} from './translateVoodooCRDP.js';

// main start
globalThis._restartApp = start_app;

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
