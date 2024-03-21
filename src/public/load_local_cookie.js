import {untilTrueOrTimeout} from './voodoo/src/common.js'; 

const s = document.createElement('script');
document.body.appendChild(s);
const url = new URL(location);
s.type = 'module'
const token = () => localStorage.getItem('sessionToken') || url.searchParams.get('token') || localStorage.getItem('session.tkn');
(async () => {
  if ( ! token() ) {
    untilTrueOrTimeout(() => !!token(), 120).then(() => s.src = `/local_cookie.js?token=${token()}`);
  } else {
    s.src = `/local_cookie.js?token=${token()}`;
  }
})();
