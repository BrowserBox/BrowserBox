import {DEBUG, CONFIG, VERSION} from './voodoo/src/common.js';

if (DEBUG.mode == 'prod' && CONFIG.useServiceWorkerToCache && 'serviceWorker' in navigator) {
  const S = navigator.serviceWorker;
  S.register(`/sw.js?ver=${VERSION}`).then(registration => {
    console.log('Service Worker registered with scope:', registration.scope);
  })
  .catch(error => {
    console.error('Service Worker registration failed:', error);
  });
}

