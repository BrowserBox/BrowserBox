{
  const DEBUG = false;
  const TOP = new URL(location);
  TOP.port = parseInt(location.port) + 1;
  let destination;

  const lastHash = localStorage.getItem('lastHash');
  if ( lastHash ) {
    destination = lastHash;
  } else {
    destination = 'tab-chat';
  }

  self.addEventListener('change', e => {
    if ( e.target.matches('input[name="tab-head"]') ) {
      const source = e.target.labels[0];
      const oldView = document.querySelector('label.active');
      if ( oldView ) {
        oldView.classList.remove('active');
      }
      source.classList.add('active');

      const dest = e.target.id;
      localStorage.setItem('lastHash', dest);
      parent.postMessage({multiplayer:{view:dest}}, TOP.origin);
    }
  });

  DEBUG && console.log({destination});
  
  const view = document.querySelector(`label[for="${destination}"]`);
  try {
    view.click();
    parent.postMessage({multiplayer:{view:destination}}, TOP.origin);
    DEBUG && console.log(`sidemenu done`);
  } catch(e) {
    console.warn(e);
  }
}


