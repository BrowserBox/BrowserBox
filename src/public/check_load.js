{
  const LOAD_WAIT = 1000; // 10 seconds for load
  const checkUntil = Date.now() + LOAD_WAIT;
  let timer = setInterval(() => {
    if ( globalThis?.voodoo?.api?.untilLoaded?.() ) {
      clearInterval(timer);
    }
    if ( Date.now() > checkUntil ) {
      alert(`Hmm, looks like your page is taking longer to load than normal. This is usually fixed by reloading and trying again. Let's try that!`);
      location.reload();
    }
  }
}
