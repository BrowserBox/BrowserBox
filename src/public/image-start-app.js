import Voodoo from './voodoo/index.js';
import getAPI from './getAPI.js';
import {default as image_translator} from './translateVoodooCRDP.js';

start_app();

async function start_app() {
  const useViewFrame = false;
  const translator = image_translator;
  const voodoo = await Voodoo({api: getAPI(), translator, useViewFrame});
  self.voodoo = voodoo;
  return voodoo;
}
