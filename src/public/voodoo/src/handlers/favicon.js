// MIGRATE
import {DEBUG, untilTrue} from '../common.js';
import DEFAULT_FAVICON from '../subviews/faviconDataURL.js'

export async function resetFavicon({targetId}, state) {
  await untilTrue(() => !!state?.tabMap);
  const tab = state.tabMap.get(targetId);

  DEBUG.debugFavicon && console.log(`reset favicon called for tab`, tab);

  if ( tab ) {
    tab.defaultFavicon = true;
    tab.faviconDataURI = DEFAULT_FAVICON;
  }

  tab?.favicon?.rerender();
}

export async function handleFaviconMessage({favicon:{faviconDataUrl,useDefaultFavicon,targetId}}, state) {
  await untilTrue(() => !!state?.tabMap);
  const tab = state.tabMap.get(targetId);
  DEBUG.debugFavicon && console.log('handle favicon message happening', {tab, faviconDataUrl, useDefaultFavicon, targetId})

  if ( useDefaultFavicon ) {
    return resetFavicon({targetId}, state);
  }

  if ( tab && targetId ) {
    tab.faviconDataURI = faviconDataUrl;
    tab.defaultFavicon = false;
  } else if ( targetId ) {
    state.tabMap.set(targetId, {
      targetId,
      faviconDataURI: faviconDataUrl,
    });
    DEBUG.debugFavicon && console.warn(`No such tab for favicon with details:`, {faviconDataUrl, targetId});
  } else {
    console.warn(`No such targetId for favicon with details:`, {faviconDataUrl, targetId});
  }

  tab?.favicon?.rerender();
}


