//FIXME we could move this into constructor 
// and switch it to WS 

import {DEBUG} from '../common.js';

const tabNumbers = new Map();
let TabNumber = 1;

export async function fetchTabs({sessionToken}) {
  try {
    const url = new URL(location);
    url.pathname = '/api/v1/tabs';
    const resp = await fetch(url);
    if ( resp.ok ) {
      const data = await resp.json();
      if ( data.error ) {
        if ( data.resetRequired ) {
          const reload = confirm(`Some errors occurred and we can't seem to reach your cloud browser. You can try reloading the page and if the problem persists, try switching your cloud browser off then on again. Want to reload the page now?`);
          if ( reload ) location.reload();
        }
      }
      data.tabs = (data.tabs || []).filter(({type}) => type == 'page');
      // FIX for #36 ? 
      // note: this does *not* work because new tabs can be inserted anywhere
      // data.tabs.reverse();
      data.tabs.forEach(tab => {
        if ( !tabNumbers.has(tab.targetId) ) {
          tabNumbers.set(tab.targetId, TabNumber++);
        }
        tab.number = tabNumbers.get(tab.targetId);
      });
      data.tabs.sort((a,b) => a.number - b.number);
      return data;
    } else if ( resp.status == 401 ) {
      console.warn(`Session has been cleared. Let's attempt relogin`, sessionToken);
      if ( DEBUG.blockAnotherReset ) return;
      DEBUG.blockAnotherReset = true;
      const x = new URL(location);
      x.pathname = 'login';
      x.search = `token=${sessionToken}&ran=${Math.random()}`;
      alert("Your browser cleared your session. We need to reload the page to refresh it.");
      DEBUG.delayUnload = false;
      location.href = x;
      return;
    }
  } catch(e) {
    console.warn(e);
    const reload = confirm(`Some errors occurred and we can't seem to reach your cloud browser. You can try reloading the page and if the problem persists, try switching your cloud browser off then on again. Want to reload the page now?`);
    if ( reload ) location.reload();
  }
}
