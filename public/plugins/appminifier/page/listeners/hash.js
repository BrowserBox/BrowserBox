import {getViewWindow, se} from '../helpers.js';

export function installHashFragmentController() {
  getViewWindow().addEventListener('click', e => {
    const link = e.target.closest('a');
    if ( link ) {
      try {
        const href = new URL(link.href);
        if ( href.hash ) {
          se(e,{href: href+''});
        }
      } catch(e) {
        console.info(e);
      }
    }
  });
}

export function installSyntheticHashChanger() {
  // this is more complex since we are in a constant location
  // and the documents locaiton is a synthetic location
  // we need to push an event from the remote for that
  // (we already do), we need to hook it
  getViewWindow().addEventListener('hashchange', e => {
    const hash = location.hash;
    if ( hash ) {
      const id = hash.slice(1);
      const idEl = document.getElementById(id);
      if ( idEl ) {
        idEl.scrollIntoView();
      }
    }
  });
}


