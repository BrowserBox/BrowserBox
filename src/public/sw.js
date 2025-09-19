// Imports, constants then state
const CACHE_VERSION = 'v13.0.0';
const CACHE_NAME = 'browserbox-' + CACHE_VERSION;
const ETAG_CACHE_NAME = 'bb-etag-cache-' + CACHE_VERSION;
const DEBUG = globalThis.SW_DEBUG || false;

const patternsToCache = ['.*'];
const excludedPaths = new Set([
  '/win9x',
  '/voodoo/src/common.js',
  '/isSubscriber',
  '/expiry_time',
  '/integrity',
  '/file',
  '/local_cookie.js',
  '/',
  '/login',
  '/SPLlogin',
  '/pptr',
  '/SPLgenerate',
  '/register_sw.js',
  '/sw.js',
  '/image.html',
  '/extensions',
  '/isTor',
  '/isZeta',
  '/torExit',
  '/torca/rootCA.pem',
  '/settings_modal',
  '/restart_app',
  '/stop_app',
  '/stop_browser',
  '/start_browser',
]);
const excludedPrefixes = ['/api/'];
const regexPatternsToCache = patternsToCache.map(pattern => new RegExp(pattern));

// Logic (top level function calls)
// Service Worker Install Event
self.addEventListener('install', event => {});

// Service Worker Activate Event
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== ETAG_CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      try {
        self.clients.claim();
      } catch (e) {
        console.warn(`Error claiming clients (we may not be the active service worker yet)`, e);
      }
    })
  );
});

// Service Worker Fetch Event
self.addEventListener('fetch', event => {
  if (shouldCache(event.request)) {
    event.respondWith(
      caches.match(event.request, { cacheName: CACHE_NAME }).then(cachedResponse => {
        if (cachedResponse) {
          // Start revalidation in the background but return cached response immediately
          checkETagAndRevalidate(event.request, cachedResponse);
          DEBUG && console.log('Returning cached response for', event.request.url);
          return cachedResponse;
        }
        DEBUG && console.log('Fetching and caching new response for', event.request.url);
        return fetchAndCache(event.request);
      })
    );
  }
});

self.addEventListener('message', (e) => {
  if (e.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Functions, then Helper functions
function shouldCache(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  if (excludedPaths.has(pathname) || excludedPrefixes.some(prefix => pathname.startsWith(prefix))) {
    return false;
  }
  return regexPatternsToCache.some(regex => regex.test(request.url));
}

async function fetchAndCache(request) {
  const response = await fetch(request);
  if (response.ok && response.status === 200) {
    // Only cache valid responses with content
    const clone = response.clone();
    const etag = response.headers.get('ETag');
    if (etag) {
      // Store ETag as a simple text response to avoid confusion with content
      await caches.open(ETAG_CACHE_NAME).then(cache => cache.put(request, new Response(etag, {
        headers: { 'Content-Type': 'text/plain' }
      })));
    }
    await caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
    return response;
  }
  return response; // Return non-200 responses without caching
}

async function checkETagAndRevalidate(request, cachedResponse) {
  try {
    const etagResponse = await caches.match(request, { cacheName: ETAG_CACHE_NAME });
    const etag = etagResponse ? await etagResponse.text() : null;

    const response = await fetch(request, {
      headers: etag ? { 'If-None-Match': etag } : {},
      signal: (new AbortController()).signal
    });

    if (response.status === 304) {
      DEBUG && console.log('Content not modified for', request.url);
      return; // Cached response is still valid, no need to update
    }

    if (response.ok && response.status === 200) {
      const newEtag = response.headers.get('ETag');
      if (newEtag && newEtag !== etag) {
        // Update cache with new content and ETag
        await caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
        if (newEtag) {
          await caches.open(ETAG_CACHE_NAME).then(cache => cache.put(request, new Response(newEtag, {
            headers: { 'Content-Type': 'text/plain' }
          })));
        }
        // Notify clients of updated content
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              message: 'content-updated',
              url: request.url
            });
          });
        });
      }
    }
  } catch (error) {
    DEBUG && console.error('Revalidation failed for', request.url, error);
  }
}
