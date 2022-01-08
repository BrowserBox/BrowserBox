import {DEBUG} from '../../voodoo/src/common.js';
import './page/listen.js';

const docEl = document.documentElement;
if (DEBUG.neonMode) {
  docEl.classList.add('neon');
}


