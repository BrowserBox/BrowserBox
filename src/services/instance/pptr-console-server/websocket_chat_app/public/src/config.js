// config constants
  export const APP_TESTING = globalThis.location && location.pathname.startsWith('/runtests');
  export const SilenceLogs = true;
  export const InitialReconnectDelay = 1000;
  export const ExponentialBackoff = 1.618;
  export const myCode = (Date.now()*Math.random()).toString(36);
  // myCode is only used to verify a name update is for us 

