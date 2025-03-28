  import {DEBUG} from '../../voodoo/src/common.js';

  const FocusCache = () => {
    const focusSaver = {
      doc: null,
      oldValue: '',
      activeElement: null,
      selectionStart: 0,
      selectionEnd: 0,
      reset: () => {
        focusSaver.activeElement = null;
        focusSaver.selectionStart = 0;
        focusSaver.selectionEnd = 0;
        focusSaver.oldValue = '';
        focusSaver.doc = null;
      },
      save: doc => {
        try {
          const el = doc.activeElement;
          focusSaver.doc = doc;
          focusSaver.activeElement = el;
          focusSaver.selectionStart = el.selectionStart;
          focusSaver.selectionEnd = el.selectionEnd;
          focusSaver.oldValue = el.value;
        } catch(e) {
          DEBUG.val >= DEBUG.med && console.log(`Issue with save focus`, focusSaver, e);
        }
      },
      restore: () => {
        console.log('restore focus');
        try {
          const oldFocus = focusSaver.activeElement;
          if ( ! oldFocus ) {
            DEBUG.val >= DEBUG.med && console.log(`No old focus`);
            return;
          }

          let updatedEl;
          const [oldId] = oldFocus.hasAttribute('zig') ? oldFocus.getAttribute('zig').split(' ') : "";
          const dataIdSelector = `${oldFocus.localName}[zig^="${oldId}"]`;
          const byDataId = focusSaver.doc.querySelector(dataIdSelector);

          if ( ! byDataId ) {
            const fallbackSelector = oldFocus.id ? `${oldFocus.localName}#${oldFocus.id}` : 
            oldFocus.name? `${oldFocus.localName}[name="${oldFocus.name}"]` : '';

            let byFallbackSelector;

            if ( fallbackSelector ) {
              byFallbackSelector = focusSaver.doc.querySelector(fallbackSelector);
            }
            
            if ( byFallbackSelector ) {
              updatedEl = byFallbackSelector;
            }
          } else {
            DEBUG.val >= DEBUG.med && console.log(`Restoring focus data id`);
            updatedEl = byDataId;
          }

          if ( updatedEl ) {
            updatedEl.focus();
            updatedEl.value = focusSaver.oldValue;
            updatedEl.selectionStart = updatedEl.value ? updatedEl.value.length : focusSaver.selectionStart;
            updatedEl.selectionEnd = updatedEl.value ? updatedEl.value.length : focusSaver.selectionEnd;
          } else {
            DEBUG.val >= DEBUG.med && console.warn(`Sorry, we couldn't find the element that was focused before.`);
          }
        } catch(e) {
          DEBUG.val >= DEBUG.med && console.log(`Issue with restore focus`, focusSaver, e);
        }
      }
    };
    return focusSaver;
  };

  export function resetFocusCache({navigated:{targetId}, executionContextId}, state) {
    let cache = state.domCache.get(targetId);
    if ( ! cache ) {
      cache = {contextId:'', domTree:'', focusSaver: FocusCache()};
      state.domCache.set(targetId, cache);
    } else {
      cache.focusSaver.reset();
    }
    if ( executionContextId ) {
      cache.contextId = executionContextId;
    } 
  }

  export function handleTreeUpdate({treeUpdate:{open,targetId,dontFocus,runFuncs}, executionContextId}, state) {
    if ( targetId !== state.activeTarget ) {
      DEBUG.val >= DEBUG.med && console.log(`Rejecting tree update for ${targetId} as it is not active target ${state.activeTarget}`);
      DEBUG.val >= DEBUG.med && console.log(`But saving this update into that targets cache.`);
      let cache = state.domCache.get(targetId);
      if ( ! cache ) {
        cache = {contextId:'', domTree:'', focusSaver: FocusCache()};
        state.domCache.set(targetId, cache);
      }
      // when we have  iframes this will be dangerous
      // to flatten contextId (which will be multiple per page 1 for each iframe)
      cache.contextId = executionContextId;
      cache.domTree = open;
      return;
    }
    if ( state.viewState.viewFrameEl ) {
      updateTree({targetId, domTree:open, contextId:executionContextId, dontFocus, runFuncs}, state);
      if ( state.scrollToTopOnNextTreeUpdate ) {
        scrollToTop({navigated:state.scrollToTopOnNextTreeUpdate}, state);
        state.scrollToTopOnNextTreeUpdate = null;
      }
    } else {
      DEBUG.val && console.warn(`No view frame`);
    }
  }

  export function updateTree({domTree,targetId,contextId,dontFocus:dontFocus = false, runFuncs: runFuncs= []}, state) {
    const frame = getViewFrame(state);
    let doc = getViewWindow(state).document;
    let cache = state.domCache.get(targetId);
    if ( ! cache ) {
      cache = {contextId:'', domTree:'', focusSaver: FocusCache()};
      state.domCache.set(targetId, cache);
    }
    cache.contextId = contextId;
    cache.domTree = domTree;
    if ( !doc.body || doc.body.outerHTML !== domTree ) {
      cache.focusSaver.save(doc);
      if ( frame.hasLoaded ) {
        doc = getViewWindow(state).document;
        doc.body.outerHTML = domTree;
        Array.from(doc.querySelectorAll('html > head')).forEach(node => node !== doc.head && node.remove());
      } else {
        frame.addEventListener('load', () => {
          doc = getViewWindow(state).document;
          doc.body.outerHTML = domTree;
          Array.from(doc.querySelectorAll('html > head')).forEach(node => node !== doc.head && node.remove());
        }, {once:true});
      }
      if ( ! dontFocus ) {
        cache.focusSaver.restore();
      }
      if ( runFuncs ) {
        if ( frame.hasLoaded ) {
          const win = getViewWindow(state);
          for ( const name of runFuncs ) {
            try { win[name](); } catch(e){DEBUG.val && console.warn(name, e)}
          }
        } else {
          frame.addEventListener('load', () => {
            const win = getViewWindow(state);
            for ( const name of runFuncs ) {
              try { win[name](); } catch(e){DEBUG.val && console.warn(name, e)}
            }
          });
        }
      }
    }
  }

  export function scrollToTop({navigated}, state) {
    setTimeout(() => {
      if ( navigated.targetId !== state.activeTarget ) return;
      if ( state.viewState.viewFrameEl ) {
        getViewWindow(state).scrollTo(0,0);
      } else {
        DEBUG.val && console.warn(`No view frame`);
      }
    }, 40);
  }

  export function scrollTo({scrollY,scrollX}, state) {
    setTimeout(() => {
      if ( state.viewState.viewFrameEl ) {
        getViewWindow(state).scrollTo(scrollX,scrollY);
      } else {
        DEBUG.val && console.warn(`No view frame`);
      }
    }, 40);
  }

  export function handleTreeDiff({treeDiff:{diffs,targetId},executionContextId}, state) {
    if ( targetId !== state.activeTarget ) {
      DEBUG.val >= DEBUG.med && console.log(`Rejecting tree diff for ${targetId} as it is not active target ${state.activeTarget}`);
      DEBUG.val >= DEBUG.med && console.log(`But saving this diff into that targets cache.`);
      let cache = state.domCache.get(targetId);
      if ( ! cache ) {
        cache = {contextId:'', domTree:'', focusSaver: FocusCache()};
        state.domCache.set(targetId, cache);
      }
      // when we have  iframes this will be dangerous
      // to flatten contextId (which will be multiple per page 1 for each iframe)
      cache.contextId = executionContextId;
      cache.diffs = diffs;
      return;
    }
    if ( state.viewState.viewFrameEl ) {
      const later = [];
      for ( const diff of diffs ) {
        const result = patchTree(diff,state);
        if ( ! result ) later.push(diff);
      }
      for ( const diff of later ) {
        const result = patchTree(diff, state);
        if ( ! result ) {
          console.warn(`Diff could not be applied after two tries`, diff);
        }
      }
    } else {
      DEBUG.val && console.warn(`No view frame`);
    }
  }

  function patchTree({
        insert, remove  
      }, state) {
    const doc = getViewWindow(state).document;

    const {parentZig} = insert || remove;
    const parentZigSelector = `[zig="${parentZig}"]`;
    const parentElement = doc.querySelector(parentZigSelector);

    
    if ( ! parentElement ) {
      //throw new TypeError(`No such parent element selected by ${parentZigSelector}`);
      //console.warn(`No such parent element selected by ${parentZigSelector}`);
      return false;
    }

    if ( insert ) {
      parentElement.insertAdjacentHTML('beforeEnd', insert.outerHTML);
      //console.log(parentElement, "Added", insert.outerHTML);
    }

    if ( remove ) {
      const zigSelectorToRemove = `[zig="${remove.zig}"]`;
      const elToRemove = parentElement.querySelector(zigSelectorToRemove);
      if ( ! elToRemove ) {
        //throw new TypeError(`No such element to remove selected by ${zigSelectorToRemove}`);
        //console.warn(`No such element to remove selected by ${zigSelectorToRemove}`);
        return true;
      } else {
        elToRemove.remove();
      }
      //console.log("Removed", elToRemove);
    }

    return true;
  }

  function zigs(dataId, generation) {
    return `[zig="${dataId} ${generation}"]`;
  }

  export function getViewWindow(state) {
    return state.viewState.viewFrameEl.contentWindow;
  }

  export function getViewFrame(state) {
    return state.viewState.viewFrameEl;
  }
