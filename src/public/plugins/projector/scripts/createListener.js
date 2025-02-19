  import {DEBUG} from '../../../voodoo/src/common.js';

  const BUFFERED_FRAME_EVENT = {
    type: "buffered-results-collection",
    command: {
      isBufferedResultsCollectionOnly: true,
      params: {}
    }
  };

  export function createFrameListener(queue, state) {
    const {H} = state;
    return function installFrameListener() {
      self.addEventListener('message', e => {
        if ( e.data && e.data.event ) {
          const {event} = e.data;
          const cache = state.domCache.get(state.activeTarget);
          if ( cache ) {
            event.contextId = cache.contextId;
          }
          if ( event.type.endsWith('move') ) {
            queue.send(BUFFERED_FRAME_EVENT);
          } else if ( event.custom ) {
            if ( event.type == 'scrollToEnd' ) {
              let cache = state.domCache.get(state.activeTarget);
              if ( ! cache ) {
                cache = {};
                state.domCache.set(state.activeTarget,cache);
              }
              cache.scrollTop = event.scrollTop;
              cache.scrollLeft = event.scrollLeft;
            }
            state.H(event); 
          } else {
            if ( ! event.contextId ) {
              DEBUG.val && console.warn(`Event will not have context id as no cache for activeTarget`);
            }
            if ( event.type == 'input' ) {
              if ( event.selectInput ) {
                H({
                  synthetic: true,
                  type: 'select',
                  state: { waitingExecutionContext: event.contextId },
                  event
                });
              } else if ( event.inputType == 'insertText' ) {
                H({
                  synthetic: true,
                  contextId: state.contextIdOfFocusedInput,
                  type: 'typing-clearAndInsertValue',
                  value: event.value,
                  event
                });
              }
            } else if ( event.type == 'click' && event.href ) {
              const activeTab = state.activeTab();          
              let activeTabUrl = new URL(activeTab.url);
              let url = new URL(event.href);
              const frag = url.hash;
              activeTabUrl.hash = url.hash;
              url = url +'';
              activeTabUrl = activeTabUrl + '';
              DEBUG.val >= DEBUG.med && console.log(`Doc url ${activeTab.url}, target url ${url}`);
              if ( url == activeTabUrl ) {
                // in other words if they differ by only the hash
                const viewDoc = state.viewState.viewFrameEl.contentWindow.document;
                const fragElem = viewDoc.querySelector(frag);
                if ( fragElem ) {
                  fragElem.scrollIntoView();
                }
              }
            } else {
              if ( event.type == 'keypress' && event.contenteditableTarget ) {
                /**
                H({
                  synthetic: true,
                  contextId: state.contextIdOfFocusedInput,
                  type: 'typing',
                  data: event.key
                });
                **/
              } else {
                DEBUG.val >= DEBUG.med && console.log(event);
                H(event);
              }
            }
          }
        }
      });
      const win = state.viewState.viewFrameEl.contentWindow;
      DEBUG.val >= DEBUG.med && console.log(win);
      win.addEventListener('load', () => {
        DEBUG.val >= DEBUG.med && console.log("View frame content loaded");
      });
    }
  }

  export function createDOMTreeGetter(queue, delay) {
    return function getDOMTree(force = false) {
      setTimeout(() => {
        DEBUG.val >= DEBUG.med && console.log(`local requests remote tree`);
        queue.send({
          type: "getDOMSnapshot",
          force,
          custom: true
        });
      }, delay);
    }
  }

