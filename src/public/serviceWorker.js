  // constants 
    const CACHE = "bb-cache-20240323";
    const CLEAR = location.search.startsWith('?v=CLEAR');
    const ONLINE_TEST = location.protocol + '//' + location.hostname + '/online-test.html';

  // route 
    const IGNORE = {
      [ONLINE_TEST]: true
    };

    const NEVER_CACHE = {
      '/api/v1/tabs': true,
    };

    const API_STUB = {
      '/api/v1/tabs' : async () => new Response(
        JSON.stringify({ tabs: [], requestId: 0 }), 
        {
          status:200, 
          statusText:'OK', 
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    };

    const OFFLINE = async () => new Response(
      NoLoadView(),
      {
        status:200, 
        statusText:'OK', 
        headers: {
          'Content-Type': 'text/html'
        }
      }
    );

  // handlers
    self.addEventListener('activate', async e => await e.waitUntil(self.Clients.claim()));

    self.addEventListener('install', async e => {
      try {
        await e.skipWaiting();
      } finally { 
        await setup();
      }
    });

    self.addEventListener('fetch', e => e.waitUntil(fetchResponder(e)));
    
    async function fetchResponder(e) {
      CLEAR && console.log(e.request);
      if ( e.request.method != 'GET' ) return;

      if ( e.request.url in IGNORE ) return;

      const Url = new URL(e.request.url);
      if ( Url.port !== location.port ) return;
      if ( Url.pathname.startsWith('/current') ) return;

      e.respondWith(fetchResponder2(e));
    }

    async function fetchResponder2(e) {
      const cache = await caches.open(CACHE);
      const cachedResponse = await cache.match(e.request); 

      let response;

      if (!CLEAR && cachedResponse) response = cachedResponse;

      else if (e.request.cache === 'only-if-cached' && e.request.mode !== 'same-origin') return;

      else response = await cacheFetcher2(e);

      if ( response ) {
        return response;
      }
    }

    async function cacheFetcher2(e) {
      const requestUrl = new URL(e.request.url);
      const route = requestUrl.pathname;

      let response;

      try { 
        response = await fetch(e.request);
      } catch(e) {
        console.warn(e, e.request);
      }

      if ( response ) {
        if ( route in NEVER_CACHE ) {
          return response;
        } else {
          const clone = response.clone();
          const cache = await caches.open(CACHE);
          await cache.put(e.request, clone);
          return response;
        }
      } else if ( route in API_STUB ) {
        return API_STUB[route]();
      } else {
        return OFFLINE();
      }
    }

    async function setup() {
      await caches.open(CACHE);
    }

  // views
    function NoLoadView() {
      return `
        <!DOCTYPE html>
        <meta charset=utf-8>
        <meta name=viewport content="width=device-width, initial-scale=1.0">
        <title>We'll be right back</title>
        <main>
          <header>
            <h1>Alakazam &mdash; we've vanished!</h1>
          </header>
          <article>
            <h2>No doubt we shall return presently</h2>
            <p>
              As we see it, you have a couple of options right now:
            </p>
            <ul>
              <li>
                You can sit here and wait.
              <li>
                You can <a href=${self.registration.scope}>reload the page.</a>
              <li>
                You can <a href=https://github.com/dosycorp/service-issues/issues>open an issue.</a>
              <li> 
                You can vent your anger into this <a href=#black-hole>black hole</a> below.
            </ul>
            <form id=black-hole>
              <fieldset>Vent into the black hole</fieldset>
              <p>
                <textarea></textarea> 
              <p>
                <button>Send into black hole</button>
            </form>
          </article>
          <footer>
            A production of <a target=_blank href=https://dosyago.com>The Dosyago Corporation</a>.
          </footer>
        </main>
      `;
    }
