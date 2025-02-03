import {DEBUG, CHAR} from '../common.js';
import {s as R, c as X} from '../../node_modules/bang.html/src/vv/vanillaview.js';
  
const VIEWPORT_RESET = CHAR.viewportresize; // '&#x26F6;'

export function ViewportResetButton(state) {
  const buttonVal = R.skip(VIEWPORT_RESET);
  return F`
    <nav 
      class="controls viewport-reset-button aux" 
      stylist="styleNavControl styleViewportResetButton">
      <form submit=${[
        e => e.preventDefault(),
        () => window._voodoo_asyncSizeTab({resetRequested:true})
      ]}>
        <button title="Resize viewport" accesskey=v>${buttonVal}</button>
      </form>
    </nav>
  `;
}



