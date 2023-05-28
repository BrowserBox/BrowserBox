//import {DEBUG} from '../common.js';
import {s as R} from '../../node_modules/bang.html/src/vv/vanillaview.js';
import {PluginsMenuButton} from './pluginsMenuButton.js';

export function PluginsMenu(state, {
      bondTasks: bondTasks = [], 
    } = {}) {

  return R`
    <nav class=plugins-menu 
      bond=${[
        el => state.viewState.pmEl = el, 
        ...bondTasks
      ]} 
      stylist="stylePluginsMenu"
    >
      <aside>
        <header>
          <h1 class=spread>
            Menu
            ${PluginsMenuButton(state)}
          </h1>
        </header>
        <article>
          <section>
            <h1>
              Quality Settings
            </h1>
            <form method=POST action=#save-settings>
              <fieldset>
                <legend>Image Mode Settings</legend>
                <p>
                  <label>
                    <input type=range min=1 max=100 value=25 name=jpeg_quality
                      oninput="jfqvalue.value = this.value;" 
                    >
                    JPEG frame quality
                    &nbsp;(<output id=jfqvalue>25</output>)
                  </label>
                <p>
                  <button>Save</button>
              </fieldset>
            </form>
          </section>
          <section>
            <h1>
              Plugins
            </h1>
            <form method=POST action=#plugins-settings>
              <fieldset>
                <legend>Enabled plugins</legend>
                <p>
                  <label>
                    <input type=checkbox name=mapmaker>
                    Map Maker 
                  </label>
                <p>
                  <label>
                    <input type=checkbox name=mapviewer>
                    Map Viewer
                  </label>
                <p>
                  <label>
                    <input type=checkbox name=trailmarker>
                    Trail Marker
                  </label>
                <p>
                  <label>
                    <input type=checkbox name=trailrunner>
                    Trail Runner
                  </label>
                <p>
                  <button>Save</button>
              </fieldset>
              <fieldset>
                <legend>Discover plugins</legend>
                <p>
                  <label>
                    <button name=discover>Discover</button>
                    Discover plugins to install 
                  </label>
                <p>
                  <label>
                    <input type=search name=plugin_search>
                    <button name=search>Search</button>
                    Search for plugins to install
                  </label>
                <p>
                  <ul class=plugins-search-results></ul>
              </fieldset>
            </form>
          </section>
        </article>
      </aside>
    </nav>
  `;
}
