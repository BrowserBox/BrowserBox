import {COMMON,DEBUG} from '../voodoo/src/common.js';

setupUnloadHandler();

export default function setupUnloadHandler() {
  self.addEventListener('beforeunload', event => {
    const delayOffRequested = !COMMON.delayUnload || !!document.querySelector('form.delay-off') || 
      window._voodoo_noUnloadDelay;
    console.log('Flag', window._voodoo_noUnloadDelay, 'decision', {delayOffRequested});
    globalThis.windowUnloading = true;
    if ( !delayOffRequested ) {
      event.preventDefault();
      event.returnValue = `
        You are about to leave your remote browser.
        If you wanted to go back or forward in your browsing history in your remote browser, 
        use the < and > buttons to the left of the address bar.
      `;
    }
  });
}

