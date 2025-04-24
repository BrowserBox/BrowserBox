
export function handleMultiplayerMessage({multiplayer}, state) {
  const {onlineCount} = multiplayer;
  if ( onlineCount && onlineCount !== state.onlineCount ) {
    state.onlineCount = multiplayer.onlineCount;
    globalThis.setState('bbpro', state);
  }
}

