import {CONFIG} from './common.js';

if (CONFIG.useServiceWorkerToCache && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('/path/to/sw.js') // Adjust the path as necessary
    .then(registration => {
      console.log('Service Worker registered with scope:', registration.scope);
    })
    .catch(error => {
      console.error('Service Worker registration failed:', error);
    });
}

