import {CHAR} from '../common.js';
import {s as R} from '../../node_modules/bang.html/src/vv/vanillaview.js';
  
const VIEWPORT_RESET = CHAR.viewportresize; // '&#x26F6;'

export function ViewportResetButton() {
  const buttonVal = R.skip(VIEWPORT_RESET);
  return R`
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



