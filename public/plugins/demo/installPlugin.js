import {updateTree, handleTreeUpdate, scrollToTop, scrollTo} from './treeUpdate.js';
import {createFrameListener, createDOMTreeGetter} from './createListener.js';
import {auditClicks} from './programmaticClickIntervention.js';

export default function installPlugin(state, queue) {
  try {
    self.state = state;
    // key input 
    state.ignoreKeysCanInputMessage = false;
    state.dontFocusControlInputs = !! state.viewState.viewFrameEl;

    // dom cache
    state.domCache = new Map();

    // select
    state.ignoreSelectInputEvents = true;

    state.installFrameListener = createFrameListener(queue, state);
    state.getDOMTree = createDOMTreeGetter(queue, state.SHORT_DELAY);

    // plugins 
    queue.addMetaListener('treeUpdate', meta => handleTreeUpdate(meta, state));
    queue.addMetaListener('navigated', meta => clearDomCache(meta, state));
    queue.addMetaListener('navigated', meta => state.getDOMTree());
    queue.addMetaListener('navigated', meta => scrollToTop(meta, state));
    queue.addMetaListener('click', meta => auditClicks(meta, state));

    // start  
    queue.addMetaListener('topRedirect', meta => {
      const {browserUrl} = meta.topRedirect;
      location = browserUrl;
    });

    state.addListener('activateTab', ()  => {
      const {activeTarget} = state;
      const cache = state.domCache.get(activeTarget);
      if ( ! cache  ) {
        state.getDOMTree(true);
      } else {
        updateTree(cache, state); 
        const {scrollTop, scrollLeft} = cache;
        scrollTo({scrollTop,scrollLeft});
      }
    });

    state.getDOMTree();
  } catch(e) {
    console.info(e);
  }
}

function clearDomCache({navigated}, state) {
  const {targetId} = navigated;
  state.domCache.delete(targetId);
}
