import Voodoo from './voodoo/index.js';
import getAPI from './getAPI.js';
import {default as canvas_translator} from './translateVoodooCRDP.js';

start_app();

async function start_app() {
  const useViewFrame = false;
  const translator = canvas_translator;
  const voodoo = await Voodoo({api: getAPI(), translator, useViewFrame});
  self.voodoo = voodoo;
  return voodoo;
}
