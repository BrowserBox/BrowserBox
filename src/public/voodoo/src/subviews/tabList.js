import {CHAR, DEBUG} from '../common.js';
import {s as R} from '../../node_modules/bang.html/src/vv/vanillaview.js';
import DEFAULT_FAVICON from './faviconDataURL.js';

function bindFavicon(el, {dataURI, targetId}, state) {
  let favicon = state.favicons.get(targetId);
  if ( favicon ) {
    favicon.el = el;
  } else {
    favicon = {el,dataURI};
    state.favicons.set(targetId,favicon);
  }
  if ( favicon.el && favicon.dataURI ) {
    el.src = favicon.dataURI;
  }
}
