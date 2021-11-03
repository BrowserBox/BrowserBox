import {d as R} from '../../node_modules/dumbass/r.js';
import DEFAULT_FAVICON from './faviconDataURL.js';

export function TabList(state) {
  return R`
    <nav class="controls targets" stylist="styleTabList styleNavControl">
      <ul>
        ${state.tabs.map((tab, index) => TabSelector(tab, index, state))}
        <li class="new" stylist="styleTabSelector"
            click=${click => state.createTab(click)}
          >
            <button class=new title="New tab" accesskey="s">+</button>
        </li>
      </ul>
    </nav>
  `;
}

export function TabSelector(tab, index, state) {
  const title = tab.title == 'about:blank' ? '' : tab.title;
  const active = state.activeTarget == tab.targetId;
  return R`${{key:tab.targetId}}
    <li class="tab-selector ${active?'active':''}" stylist="styleTabSelector"
        title="${title || 'Bring to front'}"
        click=${click => state.activateTab(click, tab)} 
      >
        ${FaviconElement(tab, state)}
        <a  
          mousedown=${() => state.viewState.lastActive = document.activeElement}
          href=/tabs/${tab.targetId}>${title}</a>
        <button class=close title="Close tab" ${active?'accesskey=d':''}
          click=${click => state.closeTab(click, tab, index)}>&Chi;</button>
    </li>
  `;
}

export function FaviconElement({targetId}, state) {
  let faviconURL;
  faviconURL = state.favicons.has(targetId) && state.favicons.get(targetId).dataURI;
  return R`${{key:targetId}}
    <img class=favicon src="${R.attrmarkup(faviconURL || DEFAULT_FAVICON)}" 
      data-target-id="${targetId}" bond=${el => bindFavicon(el, {targetId}, state)}>
  `;
}

function bindFavicon(el, {targetId}, state) {
  let favicon = state.favicons.get(targetId);
  if ( favicon ) {
    favicon.el = el;
  } else {
    favicon = {el};
    state.favicons.set(targetId,favicon);
  }
  if ( favicon.el && favicon.dataURI ) {
    el.src = favicon.dataURI;
  }
}
