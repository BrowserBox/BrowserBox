import('./voodoo/src/common.js').then(({ DEBUG, CONFIG, VERSION }) => {
  if (!('serviceWorker' in navigator)) {
    console.info('No service worker. Will not cache with it.');
    return;
  }

  const S = navigator.serviceWorker;
  const EXPECTED_SW_URL = new URL(`/sw.js?ver=${VERSION}`, location.origin).href;

  // One-shot reload guard (prevents loops)
  let reloadedOnce = sessionStorage.getItem('sw-reloaded-for') === VERSION;
  S.addEventListener('controllerchange', () => {
    if (reloadedOnce) return;
    reloadedOnce = true;
    sessionStorage.setItem('sw-reloaded-for', VERSION);
    //setTimeout(() => location.reload(), 50);
  });

  // Listen for SW messages
  S.addEventListener('message', (event) => {
    if (event.data?.message === 'cache-out-of-sync') {
      DEBUG?.debugSW && console.log('Cache out of sync, reloading page.');
      alert('We need to refresh your cache. We will reload now.');
      setTimeout(() => {
        //window.location.reload();
      }, 500);
    }
    if (event.data?.message === 'content-updated') {
      CONFIG.logUpdatedContent && console.log(`Content updated for: ${event.data.url}`);
    }
  });

  (async () => {
    // Only deal with the SW that controls THIS page
    const reg = await S.getRegistration();

    if (!CONFIG.useServiceWorkerToCache) {
      if (reg) await reg.unregister(); // no reload: let the next nav be clean
      return;
    }

    // If missing, register fresh
    if (!reg) {
      await S.register(`/sw.js?ver=${VERSION}`);
      DEBUG?.debugSW && console.log('SW registered (fresh)', { scope: (await S.getRegistration())?.scope });
      return;
    }

    const activeURL = reg.active?.scriptURL || null;
    const waitingURL = reg.waiting?.scriptURL || null;
    const installingURL = reg.installing?.scriptURL || null;

    DEBUG?.debugSW && console.log('SW status', {
      scope: reg.scope,
      expected: EXPECTED_SW_URL,
      activeURL,
      waitingURL,
      installingURL
    });

    // Already on the right version
    if (activeURL === EXPECTED_SW_URL) return;

    // If the right version is already downloaded and waiting, activate it
    if (waitingURL === EXPECTED_SW_URL && reg.waiting) {
      reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      return; // controllerchange will reload once (guarded)
    }

    // Otherwise, ask the browser to check for updates
    try { await reg.update(); } catch {}

    // If still wrong (Safari/querystring quirks), force a register with the expected URL
    if ((await S.getRegistration())?.active?.scriptURL !== EXPECTED_SW_URL) {
      await S.register(`/sw.js?ver=${VERSION}`);
    }
  })().catch(err => console.error('SW bootstrap failed:', err));
});

