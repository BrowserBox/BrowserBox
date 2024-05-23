export function handleScrollNotification({/*scroll:{didScroll},*/executionContextUniqueId}, state) {
  state.viewState.latestScrollContext = executionContextUniqueId;
}
