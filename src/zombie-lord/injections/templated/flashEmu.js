import {untilTrue} from '../../../common.js';
export default function flashEmuScript({
    injectableAssetPath
  } = {}) {
    if ( ! injectableAssetPath ) {
      throw new TypeError`
        flashEmuScript requires templating with a injectableAssetPath property
        to correctly install the emulator.
      `;
    }

    return `
      {
        const DEBUG = {
          debugUntilTrue: false
        };
        const MIN_WAIT = 10;
        install();

        async function install() {
          const script = document.createElement('script');
          script.src = "${injectableAssetPath}/ruffle/ruffle.js";
          await untilTrue(() => !!(document.head || document.documentElement), 10, 500);
          try {
            (document.head || document.documentElement).append(script);
          } catch(e) {
            console.info('Document.head?', !!document.head, 'Document.documentElement?', !!document.documentElement);
            console.info('Location: ', document.location.href);
            console.warn('Failed to append script for now', e);
          }
        }

        ${untilTrue.toString()}
      }
    `;
}
