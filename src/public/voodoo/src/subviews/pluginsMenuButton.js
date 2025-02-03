//import {DEBUG} from '../common.js';
import {c as X} from '../../node_modules/bang.html/src/vv/vanillaview.js';
  
let pluginsMenuOpen = false;

export function PluginsMenuButton(state) {
  return X`
    <nav class="controls plugins-menu-button aux" stylist="styleNavControl stylePluginsMenuButton">
      <form submit=${[
        e => e.preventDefault(),
        () => {
          pluginsMenuOpen ^= true;
          state.pluginsMenuActive = pluginsMenuOpen;
          setState('bbpro', state);
        }
      ]}>
        <button title="Menu" accesskey=p>&#9776;</button>
      </form>
    </nav>
  `;
}

// Helper functions 


