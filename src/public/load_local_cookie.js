{
  const s = document.createElement('script');
  document.body.appendChild(s);
  const url = new URL(location);
  s.type = 'module'
  s.src = `/local_cookie.js?token=${localStorage.getItem('sessionToken')||url.searchParams.get('sessionToken')}`;
}
