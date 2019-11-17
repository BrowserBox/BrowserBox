import Voodoo from './voodoo/index.js';
import getAPI from './getAPI.js';
import {default as dom_translator} from './plugins/appminifier/translateAppminifierCRDP.js';

start_demo();

async function start_demo() {
  const useViewFrame = true;
  const demoMode = true;
  const translator = dom_translator;
  const voodoo = await Voodoo({api: getAPI(), translator, useViewFrame, demoMode});
  self.voodoo = voodoo;
  return voodoo;
}
