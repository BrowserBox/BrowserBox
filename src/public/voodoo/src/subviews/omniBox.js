import {d as R} from '../../node_modules/dumbass/r.js';
import {saveClick} from './controls.js';

const USE_DDG = true;

let omniBoxInput = null;
let refocus = false;

export function OmniBox(state) {
  const activeTab = state.activeTab();
  const {H} = state;
  if ( document.activeElement == omniBoxInput ) {
    refocus = true;
  }
  return R`
    <nav class="controls url" stylist=styleNavControl>
      <!--URL-->
        <form class=url stylist=styleURLForm submit=${e => {
          const {target:form} = e;
          const {address} = form;
          let url, search;
          try {
            url = new URL(address.value);
            if ( url.hostname == location.hostname ) {
              console.warn("Too relative", address.value);
              throw new TypeError("Cannot use relative URI");
            }
            url = url + '';
          } catch(e) {
            search = searchProvider({query:address.value}); 
          }
          H({
            synthetic: true,
            type: 'url-address',
            event: e,
            url: url || search
          });
        }} click=${saveClick}>
          <input 
            maxlength=3000
            title="Address or search"
            bond=${el => {
              omniBoxInput = el;
              state.viewState.omniBoxInput = omniBoxInput;
              if ( refocus ) {
                refocus = false;
                omniBoxInput.focus();
              }
            }}
            stylist=styleOmniBox 
            autocomplete=off ${state.tabs.length==0?'disabled':''} 
            name=address 
            placeholder="${
              state.tabs.length? 
                'Address or search' : 
                ''
            }" 
            type=search 
            value="${activeTab.url == 'about:blank' ? '' : activeTab.url || ''}"
          >
          <button ${state.tabs.length?'':'disabled'} title="Go" class=go>&crarr;</button>
        </form>
    </nav>
  `;
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

