import {COMMON,DEBUG} from '../voodoo/src/common.js';

setupUnloadHandler();

export default function setupUnloadHandler() {
  COMMON.delayUnload && self.addEventListener('beforeunload', event => {
    const delayOffRequested = !!document.querySelector('form.delay-off') || 
      window._voodoo_noUnloadDelay;
    console.log('Flag', window._voodoo_noUnloadDelay, 'decision', {delayOffRequested});
    if ( COMMON.delayUnload && !delayOffRequested ) {
      event.preventDefault();
      event.returnValue = `
        You are about to leave the browser.
        If you wanted to navigate, use the < and > buttons provided.
      `;
    }
  });
}

