// Version variable for cache busting
const CACHE_VERSION = 'v6.3';
const CACHE_NAME = 'my-site-cache-' + CACHE_VERSION;

// Define the patterns to cache as strings
const patternsToCache = [
  '.*',
];
const excludedPaths = new Set([
  "/", "/login", "/SPLlogin", "/pptr", "/SPLgenerate", 
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
          // Add initial assets to cache if necessary
          // const assetsToCache = [...]; // List your assets here if needed
          // return cache.addAll(assetsToCache);
        })
        .then(() => self.skipWaiting()) // Forces the waiting service worker to become the active service worker
    );
  });

  // Service Worker Activate Event
  self.addEventListener('activate', event => {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            // Delete old versions of caches
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      }).then(() => self.clients.claim()) // Claim clients for current page
    );
  });

  // Service Worker Fetch Event
  self.addEventListener('fetch', event => {
    if (shouldCache(event.request)) {
      event.respondWith(
        caches.match(event.request)
          .then(cachedResponse => {
            // Cache hit: send it! full seennndd! :) :p xx ;p
            if (cachedResponse) {
              // Add to revalidation queue
              addToRevalidationQueue(event.request);
              return cachedResponse;
            }
            // Cache miss: fetch and later cache
            return fetch(event.request).then(response => {
              updateCacheAsync(event.request, response.clone());
              return response;
            });
          })
      );
    }
  });

  // Function to determine if a request should be cached
  function shouldCache(request) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Check if the request is in the excluded paths
    if (excludedPaths.has(pathname) || excludedPrefixes.some(prefix => pathname.startsWith(prefix))) {
      return false; // Do not cache if the path is excluded
    }

    // Check if the request matches any of the regex patterns to cache
    return regexPatternsToCache.some(regex => regex.test(request.url));
  }

  // Function to add a request to the revalidation queue at a random position
  function addToRevalidationQueue(request) {
    const insertIndex = Math.floor(Math.random() * (revalidationQueue.length + 1));
    revalidationQueue.splice(insertIndex, 0, request);
    startRevalidationProcess();
  }

  // Function to start the revalidation process
  function startRevalidationProcess() {
    if (!isRevalidationRunning && revalidationQueue.length > 0) {
      isRevalidationRunning = true;
      setTimeout(processRevalidationQueue, INTERVAL);
    }
  }

  // Function to process the revalidation queue in batches
  async function processRevalidationQueue() {
    for (let i = 0; i < Math.min(BATCH_SIZE, revalidationQueue.length); i++) {
      await processRequestWithTimeout(revalidationQueue.shift(), FETCH_TIMEOUT);
    }
    if (revalidationQueue.length > 0) {
      setTimeout(processRevalidationQueue, INTERVAL);
    } else {
      isRevalidationRunning = false;
    }
  }

  // Function to process a request with a fetch timeout
  async function processRequestWithTimeout(request, timeout) {
    try {
      const controller = new AbortController();
      const signal = controller.signal;
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(request, { signal });
      clearTimeout(timeoutId);

      if (!response || response.status !== 200 || response.type !== 'basic') {
        throw new Error('Invalid response');
      }

      const responseToCache = response.clone();
      caches.open(CACHE_NAME).then(cache => {
        cache.put(request, responseToCache);
      });
    } catch (error) {
      console.error('Revalidation failed for request:', request.url, error);
      // Re-add to the end of the queue
      revalidationQueue.push(request);
    }
  }

  // Function to cache and return the response
  function cacheAndReturn(response) {
    if (!response || response.status !== 200 || response.type !== 'basic') {
      return response;
    }
    const responseToCache = response.clone();
    caches.open(CACHE_NAME).then(cache => {
      cache.put(response.url, responseToCache);
    });
    return response;
  }

  // Function to asynchronously update the cache
  function updateCacheAsync(request, responseToCache = null) {
    // Use a delay if desired, or just proceed to update the cache
    setTimeout(() => {
      // If responseToCache is null, fetch it
      const responsePromise = responseToCache ? Promise.resolve(responseToCache) : fetch(request);
      responsePromise.then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return;
        }
        caches.open(CACHE_NAME).then(cache => {
          cache.put(request, response);
        });
      });
    }, 2); // Adjust the delay as needed (0 means it will run as soon as the main execution stack is clear)
  }
}
   

