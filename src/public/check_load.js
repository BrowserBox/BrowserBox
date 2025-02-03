import {untilTrueOrTimeout, untilTrue} from './voodoo/src/common.js';

checkLoad();

async function checkLoad() {
  const TOR_WAIT = 47917;
  const LOAD_WAIT = 11719;
  const isTorAPI = new URL(location.origin);

  if ( globalThis.checkingTOR ) {
    await untilTrueOrTimeout(() => !globalThis.checkingTOR, 15).catch(e => console.warn(`Waiting for tor check completion timed out`, e)); 
  }

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
      const doReload = confirm(`Hmm, looks like your page is taking longer to load than normal. This is usually fixed by reloading and trying again. Let's try that? Hit OK to reload.\n\nOr, hit Cancel if you'd prefer to wait.\n\nNote: waiting may be a better strategy on slow connections or with Tor.`);
      if ( doReload ) location.reload();
    }
  }, 331);
}
