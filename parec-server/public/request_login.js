const TOP = new URL(location);
TOP.port = parseInt(location.port) + 2;

parent.postMessage({request: {login:true, loggedIn:false}}, TOP.origin);

self.addEventListener('message', ({data, origin}) => {
  if ( origin === TOP.origin ) {
    if ( data.login ) {
      const {sessionToken} = data.login;
      if ( sessionToken ) {
        const url = new URL(location);
        url.search = `token=${sessionToken}`;
        location = url;
      } else {
        console.warn(`Audio not logged in but did not receive session token.`);
      }
    }
  }
});
