import {s as R} from '../../node_modules/bang.html/src/vv/vanillaview.js';

export const loadings = new Map(); 

const SHOW_LOADED_MS = 300;

const DEFAULT_LOADING = {
  waiting: 0,
  complete: 0
};

let delayHideTimeout;

export function LoadingIndicator(state, delayHide = true) {
  const loading = loadings.get(state.activeTarget) || DEFAULT_LOADING;
  const isLoading = loading.waiting > 0;
  if ( delayHide && loading.complete > 0 ) {
    if ( ! isLoading ) {
      clearTimeout(delayHideTimeout);
      delayHideTimeout = setTimeout(() => {
        loading.isLoading = false;
        LoadingIndicator(state, false);
      }, SHOW_LOADED_MS );
    }
    loading.isLoading = true;
  } else {
    loading.isLoading = isLoading;
  }
  return R`
    <aside class="loading-indicator" stylist="styleLoadingIndicator">
      <progress ${loading.isLoading?'':'hidden'} name=loading max=${loading.waiting + loading.complete} value=${loading.complete}>
    </aside>
  `;
}

