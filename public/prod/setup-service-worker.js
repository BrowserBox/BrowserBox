import {DEBUG, VERSION} from '../voodoo/src/common.js';

setupServiceWorkers();

export default function setupServiceWorkers() {
  if ( DEBUG.serviceWorker && 'serviceWorker' in navigator ) {
    const refresh = DEBUG.resetCache ? 'CLEAR' + Math.random() : VERSION;
    navigator.serviceWorker.register('/serviceWorker.js?v=' + refresh );
    navigator.serviceWorker.addEventListener("controllerchange", async e => {
      console.log("Controller change", e);
    });
  }
}
