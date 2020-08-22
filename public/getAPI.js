const sessionToken = location.hash && location.hash.slice(1);

export default function getAPI() {
  const api = new URL(location);
  api.hash = '';
  api.search = `session_token=${sessionToken}`;
  api.protocol = api.protocol == 'https:' ? 'wss:' : 'ws:';
  let url = api.href + '';
  const hashIndex = url.indexOf('#');
  if ( hashIndex >= 0 ) {
    url = url.slice(0,hashIndex);
  }
  return url;
}
