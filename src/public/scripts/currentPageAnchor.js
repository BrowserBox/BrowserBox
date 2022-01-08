"use strict";
{
  /* eslint-disable no-inner-declarations */
  self.addEventListener('load', markCurrentPageLink);

  function markCurrentPageLink() {
    const links = Array.from(document.querySelectorAll('header nav a[href]:not(.logo-link)'));

    links
      // exclude links that are just fragments
      .filter(anchor => !anchor.getAttribute('href').startsWith('#'))
      .forEach(anchor => {
        // strip html extension as server redirects it to path without it
        const anchorPath = new URL(anchor.href).pathname.replace(".html","");
        if ( anchorPath == document.location.pathname ) {
          anchor.classList.add('current-page');
        }
      });
  }
  /* eslint-enable no-inner-declarations */
}
