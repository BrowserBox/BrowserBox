import {untilTrue} from '../../../common.js';
export default function customDownloadPlugin({
    embeddingHostname
  } = {}) {
    if ( ! embeddingHostname ) {
      throw new TypeError`
        customDownloadPlugin requires templating with a embeddingHostname property
        to correctly install the plugin.
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
