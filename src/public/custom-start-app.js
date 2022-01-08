import Voodoo from './voodoo/index.js';
import getAPI from './getAPI.js';
import {default as dom_translator} from './plugins/appminifier/translateAppminifierCRDP.js';

start_app();

async function start_app() {
  const useViewFrame = true;
  const translator = dom_translator;
  const voodoo = await Voodoo({api: getAPI(), translator, useViewFrame});
  self.voodoo = voodoo;
  return voodoo;
}
