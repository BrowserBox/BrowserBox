"use strict";
{
  /* eslint-disable no-inner-declarations */
  const HONORIFICS = '/data/englishHonorifics.json';
  let Setup = false;
  let H;

  self.addEventListener('load', setup);

  function setup() {
    if ( Setup ) return;

    const registerLinks = Array.from(document.querySelectorAll('a.register'));
    registerLinks.forEach(anchor => anchor.addEventListener('click', populateHonorifics));

    Setup = true;
  }

  async function populateHonorifics() {
    if ( H ) return;

    H = await fetch(HONORIFICS).then(r => r.json());
    const Honorifics = document.querySelector('#honorifics');
    const markup = H.reduce((M, title) => M + `<option value="${title}">`, '')

    Honorifics.innerHTML = '';
    Honorifics.insertAdjacentHTML('beforeEnd', markup);
  }

  /* eslint-enable no-inner-declarations */
}
