import {DEBUG} from '../common.js';
import {R,X} from '../../node_modules/craydom/r.js';
  
let pluginsMenuOpen = false;

export function PluginsMenuButton(state) {
  return X`
    <nav class="controls plugins-menu-button aux" stylist="styleNavControl stylePluginsMenuButton">
      <form submit=${[
        e => e.preventDefault(),
        e => {
          pluginsMenuOpen ^= true;
          state.pluginsMenuActive = pluginsMenuOpen;
          state.viewState.dss.setState(state);
          state.viewState.dss.restyleElement(state.viewState.pmEl);
          state.viewState.dss.restyleElement(state.viewState.voodooEl);
        }
      ]}>
        <button title="Menu" accesskey=p>&#9776;</button>
      </form>
    </nav>
  `;
}

// Helper functions 


