//import {LoadingIndicator} from '../subviews/loadingIndicator.js';

export function resetLoadingIndicator({navigated}, state) {
  const {targetId} = navigated;
  state.loadings.delete(targetId);
  /*
  if ( state.activeTarget == targetId ) {
    LoadingIndicator(state);
  }
  */
}

export function showLoadingIndicator({resource}, state) {
  const {targetId} = resource;
  state.loadings.set(targetId, resource);
  /*
  if ( state.activeTarget == targetId ) {
    LoadingIndicator(state);
  }
  */
}
