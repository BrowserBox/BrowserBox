import {
   getViewWindow, updateTree, handleTreeUpdate, 
   handleTreeDiff, scrollToTop, scrollTo, 
   resetFocusCache
} from './scripts/treeUpdate.js';
import {createFrameListener, createDOMTreeGetter} from './scripts/createListener.js';
import {auditClicks} from './scripts/programmaticClickIntervention.js';

export default function installPlugin(state, queue) {
  if ( location.pathname !== "/custom.html" && location.pathname !== "/" ) return;
  try {
    // key input 
    state.ignoreKeysCanInputMessage = false;
    state.dontFocusControlInputs = !! state.useViewFrame;

    // dom cache
    state.domCache = new Map();

    // select
    state.ignoreSelectInputEvents = true;

    state.installFrameListener = createFrameListener(queue, state);
    state.getDOMTree = createDOMTreeGetter(queue, state.SHORT_DELAY);

    // plugins 
    queue.addMetaListener('topRedirect', meta => {
      const {browserUrl} = meta.topRedirect;
      location = browserUrl;
    });

    queue.addMetaListener('treeUpdate', meta => handleTreeUpdate(meta, state));
    queue.addMetaListener('treeDiff', meta => handleTreeDiff(meta, state));
    queue.addMetaListener('navigated', meta => resetFocusCache(meta, state));
    queue.addMetaListener('navigated', meta => handleNavigate(meta, state));
    queue.addMetaListener('click', meta => auditClicks(meta, state));

    // appminifier plugin 

    queue.send({
      type: "enableAppminifier",
      custom: true
    });
    state.addListener('activateTab', ()  => {
      const win = getViewWindow(state);
      const {activeTarget, clearViewport, lastTarget} = state;
      const lastCache = state.domCache.get(lastTarget);
      const cache = state.domCache.get(activeTarget);
      if ( ! cache  ) {
        state.clearViewport();
        state.getDOMTree(true);
      } else {
        // save scroll position of last target before we update window
        // using block scope oorah
        if ( lastCache ) {
          const {pageXOffset:scrollX,pageYOffset:scrollY} = win;
          Object.assign(lastCache,{scrollX,scrollY});
        }

        state.clearViewport();
        updateTree(cache, state); 

        // restore scroll position of new target
        const {scrollX, scrollY} = cache;
        scrollTo({scrollX,scrollY}, state);
      }
    });
  } catch(e) {
    console.info(e);
  }
}

function clearDomCache({navigated}, state) {
  const {targetId} = navigated;
  state.domCache.delete(targetId);
}

function handleNavigate({navigated}, state) {
  clearDomCache({navigated}, state);
  if ( navigated.url.startsWith('http')) {
    state.scrollToTopOnNextTreeUpdate = navigated;
    state.getDOMTree();
  } else {
    state.clearViewport(); 
  }
}
