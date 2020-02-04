export default function getAPI() {
  const api = new URL(location);
  api.hash = '';
  api.search = '';
  api.protocol = api.protocol == 'https:' ? 'wss:' : 'ws:';
  let url = api.href + '';
  const hashIndex = url.indexOf('#');
  if ( hashIndex >= 0 ) {
    url = url.slice(0,hashIndex);
  }
  return url;
}
