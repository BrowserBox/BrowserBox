const DEBUG = false;
const TOP = new URL(location);
TOP.port = parseInt(location.port) - 1;
self.onmessage = ({data, origin}) => {
  DEBUG && console.log(data, origin, TOP);
  if ( origin === TOP.origin ) {
    const {sessionToken} = data;
    if ( sessionToken ) {
      const loginUrl = new URL(location);
      loginUrl.pathname = '/login';
      loginUrl.search = `token=${sessionToken}`;
      self.location = loginUrl;
    }
  }
};
parent.parent.postMessage({request:{sessionToken:true}}, TOP.origin);
