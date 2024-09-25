{
  if ( location.hostname == "chromewebstore.google.com" ) {
    const NOT_ALLOWED_CHAR = /[^a-z0-9\-]/g;
    const INSTALL_BUTTON_SELECTOR = 'main section > section > div:last-child button';
    document.addEventListener('click', event => {
      if ( event.target.closest(INSTALL_BUTTON_SELECTOR) ) {
        const installExtension = confirm('You want to install?');
        const id = location.pathname.split('/').pop();
        if ( ! id ) {
          alert('Sorry, extension ID cannot be found');
          return;
        }

        const nameParts = document.title.split('-');
        nameParts.pop();
        let name = nameParts.filter(p => p.length).join('-').trim().replace(/\s/g, '-').toLocaleLowerCase();
        if ( name.match(NOT_ALLOWED_CHAR) ) {
          name = name.replace(NOT_ALLOWED_CHAR, '');
          if ( name.length < 3 ) {
            name = `chrome-extension-${id}`;
          }
        }
        console.log(JSON.stringify({
          installExtension: {
            id, name
          }
        }));
      }
    });
  }
}
