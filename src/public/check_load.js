import './voodoo/src/common.js';

{
  const TOR_WAIT = 45000;
  const LOAD_WAIT = 10000;
  const isTorAPI = new URL(location.origin);
  let isTor = false || globalThis.comingFromTOR || isTorAPI.hostname.endsWith('.onion');
  if ( ! isTor ) {
    isTorAPI.pathname = '/isTor';
    await uberFetch(isTorAPI).then(r => r.json()).then(resp => {
      isTor = resp.isTor;
      console.log({resp});
    });
  }
  const checkUntil = Date.now() + (isTor ? TOR_WAIT : LOAD_WAIT);
  let loaderInstalled = false;
  let timer = setInterval(() => {
    if ( !loaderInstalled && globalThis?.voodoo?.api?.untilLoaded) {
      globalThis?.voodoo?.api?.untilLoaded?.().then(() => clearInterval(timer));
      loaderInstalled = true;
    }
    if ( Date.now() > checkUntil ) {
      clearInterval(timer);
      alert(`Hmm, looks like your page is taking longer to load than normal. This is usually fixed by reloading and trying again. Let's try that!`);
      location.reload();
    }
  }, 300);
}
