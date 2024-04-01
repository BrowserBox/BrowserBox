// Version variable for cache busting
const CACHE_VERSION = 'v8.9.0';
const CACHE_NAME = 'browserbox-' + CACHE_VERSION;
const ETAG_CACHE_NAME = 'etag-cache-' + CACHE_VERSION;

// Define the patterns to cache as strings
const patternsToCache = [
  '.*',
];
const excludedPaths = new Set([
  "/voodoo/src/common.js",
  "/integrity",
  "/file",
  "/local_cookie.js", 
  "/", "/login", "/SPLlogin", "/pptr", "/SPLgenerate", 
  "/register_sw.js",
  "/image.html",
  "/isTor",
  "/torca/rootCA.pem", "/settings_modal", "/restart_app", 
  "/stop_app", "/stop_browser", "/start_browser", "/integrity"
]);
const excludedPrefixes = [
  '/api/',
];
// Convert string patterns to RegExp objects
const regexPatternsToCache = patternsToCache.map(pattern => new RegExp(pattern));

// Revalidation queue for cache updates
const revalidationQueue = [];
let isRevalidationRunning = false;
const BATCH_SIZE = 3;
const INTERVAL = 60000; // 60 seconds for queue processing
const FETCH_TIMEOUT = 10000; // 10 seconds for fetch timeout

if ( location.hostname != 'localhost' ) {
  // Service Worker Install Event
  self.addEventListener('install', event => {
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then(cache => {
          // Your initial cache population can go here if needed
        })
        .then(() => self.skipWaiting())
    );
  });

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
      }).then(() => self.clients.claim())
    );
  });

  // Service Worker Fetch Event
  self.addEventListener('fetch', event => {
    if (shouldCache(event.request)) {
      event.respondWith(
        caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              // Here we add the request to the revalidation process with ETag checking
              checkETagAndRevalidate(event.request, cachedResponse);
              return cachedResponse;
            }
            return fetchAndCache(event.request);
          })
      );
    }
  });

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
    if (response.ok) {
      const clone = response.clone();
      const etag = response.headers.get('ETag');
      if (etag) {
        caches.open(ETAG_CACHE_NAME).then(cache => cache.put(request, new Response(etag)));
      }
      caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
    }
    return response;
  }

  async function checkETagAndRevalidate(request, cachedResponse) {
    const etagResponse = await caches.open(ETAG_CACHE_NAME).match(request);
    const etag = etagResponse ? await etagResponse.text() : undefined;
    if (!etag) {
      addToRevalidationQueue(request);
      return;
    }
    fetch(request, {
      headers: { 'If-None-Match': etag },
      signal: (new AbortController()).signal
    }).then(response => {
      if (response.status === 304) {
        console.log('Content not modified');
      } else if (response.ok) {
        const newEtag = response.headers.get('ETag');
        caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
        if (newEtag) {
          caches.open(ETAG_CACHE_NAME).then(cache => cache.put(request, new Response(newEtag)));
        }
      }
    }).catch(error => {
      console.error('Revalidation failed:', error);
    });
  }

  function addToRevalidationQueue(request) {
    const insertIndex = Math.floor(Math.random() * (revalidationQueue.length + 1));
    revalidationQueue.splice(insertIndex, 0, request);
    startRevalidationProcess();
  }

  function startRevalidationProcess() {
    if (!isRevalidationRunning && revalidationQueue.length > 0) {
      isRevalidationRunning = true;
      setTimeout(processRevalidationQueue, INTERVAL);
    }
  }

  async function processRevalidationQueue() {
    for (let i = 0; i < Math.min(BATCH_SIZE, revalidationQueue.length); i++) {
      const request = revalidationQueue.shift();
      try {
        await fetchAndCache(request); // Re-fetch and cache, which will handle ETag comparison
      } catch (error) {
        console.error('Failed to revalidate:', request, error);
        revalidationQueue.push(request); // Optionally re-add failed requests to the queue
      }
    }
    if (revalidationQueue.length > 0) {
      setTimeout(processRevalidationQueue, INTERVAL);
    } else {
      isRevalidationRunning = false;
    }
  }
}

