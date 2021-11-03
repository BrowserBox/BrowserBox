import {
   getViewWindow, 
   /*
   updateTree, 
   handleTreeUpdate, 
   handleTreeDiff, 
   */
   scrollTo
} from './scripts/treeUpdate.js';
import {createFrameListener, createDOMTreeGetter} from './scripts/createListener.js';

export default function installPlugin(state, queue) {
  console.log("Installing projector plugin");
  if ( location.pathname !== "/factory.html" ) return;

  state.factoryMode = true;
  state.domCache = new Map();

  state.installFrameListener = createFrameListener(queue, state);
  state.getDOMSnapshot = createDOMTreeGetter(queue, state.SHORT_DELAY);

  //queue.addMetaListener('treeUpdate', meta => handleTreeUpdate(meta, state));
  //queue.addMetaListener('treeDiff', meta => handleTreeDiff(meta, state));
  queue.addMetaListener('navigated', meta => handleNavigate(meta, state));
  queue.addMetaListener('domSnapshot', meta => console.log(meta, state));

  queue.send({
    type: "enableProjector",
    custom: true
  });

  state.addListener('activateTab', ()  => {
    const win = getViewWindow(state);
    const {activeTarget, lastTarget} = state;
    const lastCache = state.domCache.get(lastTarget);
    const cache = state.domCache.get(activeTarget);
    if ( ! cache  ) {
      state.clearViewport();
      state.getDOMSnapshot(true);
    } else {
      // save scroll position of last target before we update window
      // using block scope oorah
      if ( lastCache ) {
        const {pageXOffset:scrollX,pageYOffset:scrollY} = win;
        Object.assign(lastCache,{scrollX,scrollY});
      }

      state.clearViewport();
      //updateTree(cache, state); 

      // restore scroll position of new target
      const {scrollX, scrollY} = cache;
      scrollTo({scrollX,scrollY}, state);
    }
  });
}

function clearDomCache({navigated}, state) {
  const {targetId} = navigated;
  state.domCache.delete(targetId);
}

function handleNavigate({navigated}, state) {
  clearDomCache({navigated}, state);
  if ( navigated.url.startsWith('http')) {
    state.scrollToTopOnNextTreeUpdate = navigated;
    state.getDOMSnapshot();
  } else {
    state.clearViewport(); 
  }
}
