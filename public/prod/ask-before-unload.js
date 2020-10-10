import {DEBUG} from '../voodoo/src/common.js';

setupUnloadHandler();

export default function setupUnloadHandler() {
  DEBUG.delayUnload && self.addEventListener('beforeunload', event => {
    const delayOffRequested = !!document.querySelector('form.delay-off') || 
      window._voodoo_noUnloadDelay;
    if ( DEBUG.delayUnload && !delayOffRequested ) {
      event.preventDefault();
      event.returnValue = `
        You are about to leave the browser.
        If you wanted to navigate, use the < and > buttons provided.
      `;
    }
  });
}
