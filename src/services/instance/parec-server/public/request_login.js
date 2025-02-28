const TOP = new URL(location);
if ( location.port ) {
  TOP.port = parseInt(location.port) + 2;
} else {
  const subs = TOP.hostname.split('.');
  let port = parseInt(subs[0].replace(/\D+/g, ''));
  if ( !Number.isNaN(port) ) {
    port += 2; 
    subs.shift();
    subs.unshift(`p${port}`);
    TOP.hostname = subs.join('.');
  }
}

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
