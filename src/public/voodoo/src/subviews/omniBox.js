import {s as R} from '../../node_modules/bang.html/src/vv/vanillaview.js';
import {CHAR, USE_DDG} from '../common.js';
import {resetFavicon} from '../handlers/favicon.js';
import {saveClick} from './controls.js';
import {checkAndAppendHTTPS} from '../domainer.js';

let omniBoxInput = null;
let refocus = false;

export function OmniBox(state) {
  const activeTab = state.activeTab();
  if ( document.deepActiveElement == omniBoxInput ) {
    refocus = true;
  }
  const disabled = state.tabs.length === 0;
  return R`
    <nav class="controls url" stylist=styleNavControl>
      <!--URL-->
        <form class=url stylist=styleURLForm submit=${e => go(e, state)}
            click=${saveClick}>
          <input 
            maxlength=3000
            title="Search or address"
            bond=${el => {
              omniBoxInput = el;
              state.viewState.omniBoxInput = omniBoxInput;
              if ( refocus ) {
                refocus = false;
                omniBoxInput.focus();
              }
            }}
            stylist=styleOmniBox 
            autocomplete=off ${state.tabs.length==0?'aria-disabled':''} 
            name=address 
            placeholder="${
              state.tabs.length? 
                'Search or address' : 
                'Open a tab first'
            }" 
            type=search 
            value="${activeTab.url == 'about:blank' ? '' : activeTab.url || ''}"
          >
          <button ${disabled ? 'disabled' : ''} title="${
            disabled? '(Go) Open a tab first' : 'Navigate or Search'
          }" class=go>${
            R.skip(CHAR.loadReload)
          }</button>
        </form>
    </nav>
  `;
}

export function go(e, state) {
  //console.log(e);
  const {target:form} = e;
  const {address} = form;
  let url, search;
  let addressValue = address.value;
  try {
    addressValue = checkAndAppendHTTPS(addressValue, state?.isTor);
  } catch(e) {
    console.info(`Error checking for a domain`);
  }
  try {
    url = new URL(addressValue);
    if ( url.host == location.host && ! (url.path.startsWith('/assets/') || url.path.startsWith('/uploads/'))) {
      console.warn("Too relative", address.value);
      return;
    }
    url = url + '';
  } catch(e) {
    search = searchProvider({query:address.value}); 
  }
  state.H({
    synthetic: true,
    type: 'url-address',
    event: e,
    url: url || search
  });
  resetFavicon({targetId: state.activeTarget}, state);
}

export function focusOmniBox() {
  if ( omniBoxInput ) {
    omniBoxInput.focus();
  }
}
// Search
function searchProvider({query: query = '' } = {}) {
  if ( USE_DDG ) {
    return `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
  } else {
    return `https://google.com/search?q=${encodeURIComponent(query)}`;
  }
}

