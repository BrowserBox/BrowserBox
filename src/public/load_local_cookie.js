const s = document.createElement('script');
document.documentElement.appendChild(s);
const url = new URL(location);
const token = () => url.searchParams.get('token') || url.hash.slice(1) || localStorage.getItem('session.tkn');
if ( ! token() ) {
  console.warn(Error(`Token is not available to source local cookie.`));
  alert(`A login token is not present! Your browser, may have cleared it. Or private browsing or incognito mode may have cleared it. Please login again.`);
  location.reload();
} else {
  s.src = `/local_cookie.js?token=${token()}`;
}
