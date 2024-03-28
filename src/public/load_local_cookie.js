const s = document.createElement('script');
document.documentElement.appendChild(s);
const url = new URL(location);
const token = () => url.searchParams.get('token') || url.hash.slice(1) || localStorage.getItem('session.tkn');
if ( ! token() ) {
  throw new Error(`Token is not available to source local cookie.`);
} else {
  s.src = `/local_cookie.js?token=${token()}`;
}
