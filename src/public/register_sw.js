import('./voodoo/src/common.js').then(({DEBUG,CONFIG,VERSION}) => {
  if ( navigator.serviceWorker ) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => {
        // Extract the version from the scriptURL
        if ( registration?.active?.scriptURL ) {
          let url = new URL(registration?.active?.scriptURL);
          let version = url.searchParams.get('ver');

          // Unregister if the version does not match
          if (version !== VERSION || !CONFIG.useServiceWorkerToCache) {
            DEBUG.debugSW && console.log('Unregistering', url);
            registration.unregister().then(async bool => {
              if (bool) {
                DEBUG.debugSW && console.log('Unregistered an old service worker.');
                const cacheNames = await caches.keys(); // Get cache names
                for await (const cacheName of cacheNames) {
                  const deleted = await caches.delete(cacheName);
                  if (deleted) {
                    console.log(`Deleted cache: ${cacheName}`);
                  } else {
                    console.log(`Failed to delete cache: ${cacheName}`);
                  }
                }
                setTimeout(() => {
                  alert(`Your app has been updated and needs to reload.`);
                  location.reload();
                }, 500);
              }
            });
          }
        }
      });
    });
  } else {
    console.info(`No service worker. Will not cache with it.`);
    return;
  }

  if (CONFIG.useServiceWorkerToCache && 'serviceWorker' in navigator) {
    const S = navigator.serviceWorker;

    // allow SW to reload the pages if they need to update to fresh content
    S.addEventListener('message', event => {
      if ( event.data.message == 'cache-out-of-sync' ) {
        DEBUG.debugSW && console.log('Cache out of sync, reloading page.');
        setTimeout(() => {
          alert(`We need to refresh your cache. We will reload now.`);
          globalThis.window.location.reload();
        }, 500);
      }
      if (event.data.message === 'content-updated') {
        CONFIG.logUpdatedContent && console.log(`Content updated for: ${event.data.url}`);
      }
    });

    S.register(`/sw.js?ver=${VERSION}`).then(registration => {
      DEBUG.debugSW && console.log(`Service Worker registered with scope: ${registration.scope} and version: ${VERSION}`);
    })
    .catch(error => {
      console.error('Service Worker registration failed:', error);
    });
  }
});

