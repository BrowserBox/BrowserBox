const s = document.createElement('script');
document.documentElement.appendChild(s);
const url = new URL(location);
const token = () => url.searchParams.get('token') || url.hash.slice(1) || localStorage.getItem('session.tkn') || localStorage.getItem('sessionToken');
if ( ! token() ) {
  console.warn(Error(`Token is not available to source local cookie.`));
  const doIt = confirm(`A login token is not present! Your browser, may have cleared it. Or private browsing or incognito mode may have cleared it. Please login again. Reload?`);
  if ( doIt ) {
    location.reload();
  }
} else {
  globalThis._sessionToken = () => token();
  localStorage.setItem('sessionToken', token());
  s.src = `/local_cookie.js?token=${token()}`;
}
