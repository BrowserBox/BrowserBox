import {CONFIG} from './voodoo/src/common.js';

if (false && CONFIG.useServiceWorkerToCache && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then(registration => {
    console.log('Service Worker registered with scope:', registration.scope);
  })
  .catch(error => {
    console.error('Service Worker registration failed:', error);
  });
}

