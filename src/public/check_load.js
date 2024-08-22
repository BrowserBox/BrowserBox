{
  const LOAD_WAIT = 10000; // 10 seconds for load
  const checkUntil = Date.now() + LOAD_WAIT;
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
