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
      console.log(\`Probably no need for this\`);
    `;
}
