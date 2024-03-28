import {DEBUG, CONFIG, VERSION} from './voodoo/src/common.js';

navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(registration => {
    // Extract the version from the scriptURL
    let url = new URL(registration.active.scriptURL);
    let version = url.searchParams.get('ver');

    // Unregister if the version does not match
    if (version !== VERSION) {
      registration.unregister().then(bool => {
        if (bool) console.log('Unregistered an old service worker.');
      });
    }
  });
});

if (DEBUG.mode == 'prod' && CONFIG.useServiceWorkerToCache && 'serviceWorker' in navigator) {
  const S = navigator.serviceWorker;
  S.register(`/sw.js?ver=${VERSION}`).then(registration => {
    console.log('Service Worker registered with scope:', registration.scope);
  })
  .catch(error => {
    console.error('Service Worker registration failed:', error);
  });
}

