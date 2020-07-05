import {FaviconElement} from '../subviews/tabList.js';
import DEFAULT_FAVICON from '../subviews/faviconDataURL.js'

export function resetFavicon({targetId}, state) {
  const favicon = state.favicons.get(targetId);
  if ( favicon ) {
    favicon.dataURI = DEFAULT_FAVICON;
  }
  FaviconElement({targetId}, state);
}

export function handleFaviconMessage({favicon:{faviconDataUrl,targetId}}, state) {
  let favicon = state.favicons.get(targetId);
  if ( favicon ) {
    favicon.dataURI = faviconDataUrl;
  } else {
    favicon = {dataURI:faviconDataUrl}
    state.favicons.set(targetId, favicon);
  }
  FaviconElement({targetId}, state);
}


