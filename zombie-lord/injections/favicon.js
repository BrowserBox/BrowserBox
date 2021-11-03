/* eslint-disable no-inner-declarations */
{
  let faviconSent = false;
  let faviconDataUrl;

  const targetId = self.targetId;

  install();

  function install() {
    if ( window !== top ) return;
    self.addEventListener('DOMContentLoaded', getFaviconElement);
    setTimeout(getFaviconElement, 50);
    getFaviconElement();
    self.getFaviconElement = getFaviconElement;
  }

  async function getFaviconElement() {
    try {
      if ( faviconSent ) return;
      if ( faviconDataUrl ) {
        s({faviconDataUrl,targetId});
      }
      const iconEl = document.querySelector('link[rel~="icon"]');
      let url;
      if ( iconEl ) {
        url = iconEl.href;
      } else {
        const urlCopy = new URL(location);
        urlCopy.pathname = "/favicon.ico";
        urlCopy.search = '';
        urlCopy.hash = '';
        url = urlCopy + '';
      }
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas'); 
        const ctx = canvas.getContext('2d');
        canvas.width = image.width;
        canvas.height = image.height;  
        ctx.drawImage(image, 0, 0);
        try {
          faviconDataUrl = canvas.toDataURL();
          s({faviconDataUrl,targetId});
        } finally {
          void 0;
        }
      };
      image.src = url;
    } catch(e) {
      console.log({e});
    }
  }

  function s(o) {
    if ( faviconSent ) return;
    if ( o.faviconDataUrl ) faviconSent = true;
    console.log(JSON.stringify({favicon:o}));
  }
}
/* eslint-enable no-inner-declarations */
