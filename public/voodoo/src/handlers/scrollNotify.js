export function handleScrollNotification({/*scroll:{didScroll},*/executionContextId}, state) {
  state.viewState.latestScrollContext = executionContextId;
}
