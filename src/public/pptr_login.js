
self.onmessage = ({data, origin}) => {
  const url = new URL(location);
  url.port = parseInt(location.port) - 1;
  
  const target = new URL(location);

  if ( target.origin !== origin ) {
    console.warn(`Bad origin`, origin);
    return;
  }

  if ( data && data.login ) {
    if ( data.sessionToken ) {
      url.pathname = '/login';
      url.search = `token=${data.sessionToken}`;
      //console.log(url+'');
    } else {
      url.pathname = '/run-script';
    }

    setTimeout(() => self.location = url, 0);
  }
};
