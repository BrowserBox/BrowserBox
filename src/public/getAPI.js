export default function getAPI() {
  const sessionToken = globalThis._sessionToken();
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
