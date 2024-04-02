/* eslint-disable no-inner-declarations */
{
  const Sent = new Set();
  let faviconDataUrl;
  let received = false;
  let running = false;

  const targetId = self.targetId;

  install();

  function install() {
    if ( window !== top ) return;
    self.getFaviconElement = getFaviconElement;
    self.reportFaviconReceived = reportFaviconReceived;
    self.addEventListener('DOMContentLoaded', getFaviconElement);
    s({installed:true, targetId});
  }

  function reportFaviconReceived() {
    received = true;
  }

  async function getFaviconElement(load) {
    s({functionCall: "getFaviconElement", targetId});
    if ( received || running ) return;
    running = true;
    s({running: "getFaviconElement", targetId});
    requestReset();
    try {
      const iconURLs = Array.from(
        document.querySelectorAll(
          'link[rel~="icon"], link[rel~="shortcut"]'
        )
      ).map(el => el.href);

      let url;
      {
        const urlCopy = new URL(location);
        urlCopy.pathname = "/favicon.ico";
        urlCopy.search = '';
        urlCopy.hash = '';
        iconURLs.push(urlCopy+'');
        /*
          urlCopy.pathname = "/favicon.png";
          iconURLs.push(urlCopy+'');
          urlCopy.pathname = "/favicon.svg";
          iconURLs.push(urlCopy+'');
          urlCopy.pathname = "/favicon.jpg";
          iconURLs.push(urlCopy+'');
          urlCopy.pathname = "/favicon.jpeg";
          iconURLs.push(urlCopy+'');
          urlCopy.pathname = "/favicon.webp";
          iconURLs.push(urlCopy+'');
        */
      }

      let hasIcon = false;
      for( const iconURL of iconURLs ) {
        try {
          hasIcon = await getIcon(iconURL);
        } catch(e) {
          s({getIconWithoutCredentialsError: e+''});
        }
        if ( ! hasIcon ) {
          try {
            hasIcon = await getIcon(iconURL, {withCredentials: true});
          } catch(e) {
            s({getIconWithCredentialsError: e+''});
          }
        }
        if ( hasIcon ) break;
        await new Promise(res => setTimeout(res, 300));
      }
    } catch(e) {
      s({e: e+''});
      running = false;
    }
  }

  function s(o) {
    if ( received || Sent.has(o.faviconDataUrl) ) return;
    if ( o.faviconDataUrl ) {
      Sent.add(o.faviconDataUrl);
    }
    console.log(JSON.stringify({favicon:o}));
  }

  function requestReset() {
    console.log(JSON.stringify({resetFavicon:{reset:true, targetId}}));
  }

  async function getIcon(iconURL, {withCredentials = false} = {}) {
    if ( received ) return;
    let hasIcon = false;
    let resolve;
    const pr = new Promise(res => resolve = res);
    const image = new Image();

    if ( withCredentials ) {
      image.crossOrigin = 'use-credentials';
    } else {
      image.crossOrigin = 'anonymous';
    }

    image.onload = () => {
      const canvas = document.createElement('canvas'); 
      const ctx = canvas.getContext('2d');
      canvas.width = image.width;
      canvas.height = image.height;  
      ctx.drawImage(image, 0, 0);
      try {
        faviconDataUrl = canvas.toDataURL();
        s({faviconDataUrl,targetId});
        hasIcon = true;
      } catch (e) {
        s({imageToDataURLError: e+'', faviconURL:image.src, targetId});
      } finally {
        running = false;
        resolve(hasIcon);
      }
    };

    image.onerror = err => {
      s({imageLoadError: { imageURL: image.src }});
      s({faviconURL: image.src, targetId});
      running = false;
      resolve(false);
    };

    image.src = iconURL;

    return pr;
  }
}
/* eslint-enable no-inner-declarations */
