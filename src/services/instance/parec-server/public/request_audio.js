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

parent.postMessage({request: {audio:true, loggedIn:true}}, TOP.origin);
