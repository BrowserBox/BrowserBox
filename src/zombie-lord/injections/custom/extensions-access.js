{
  if ( location.hostname == "chromewebstore.google.com" ) {
    const NOT_ALLOWED_CHAR = /[^a-z0-9\-]/g;
    const INSTALL_BUTTON_SELECTOR = 'main section > section > div:last-child button';
    document.addEventListener('click', event => {
      if ( event.target.closest(INSTALL_BUTTON_SELECTOR) ) {
        setTimeout(() => {
          const nameParts = document.title.split('-');
          nameParts.pop();
          let name = nameParts.filter(p => p.length).join('-').trim();

          const id = location.pathname.split('/').pop();
          if ( ! id ) {
            alert('Sorry, extension ID cannot be found');
            return;
          }

          if ( globalThis._installedExtensions?.has?.(id) ) {
            const removeExtension = confirm(`Do you want to remove the extension "${name}" from your CloudTabs browser?\n\nIf you select Confirm your app will remove the extension and restart.`);
            if ( removeExtension ) {
              try {
                name = name.replace(/\s/g, '-').toLocaleLowerCase();
                if ( name.match(NOT_ALLOWED_CHAR) ) {
                  name = name.replace(NOT_ALLOWED_CHAR, '');
                  if ( name.length < 3 ) {
                    name = `chrome-extension-${id}`;
                  }
                }
                name = name.replace(/-+/g, '-');
                if ( name.length > 49 ) {
                  name = name.slice(0, 49);
                  if ( name[48] == '-' ) {
                    name = name.slice(0, 48);
                  }
                }
                console.log(JSON.stringify({
                  removeExtension: {
                    id, name
                  }
                }));
              } catch(err) {
                console.warn(`Error intercepting extension removal`, err);
              }
            }
          } else {
            const installExtension = confirm(`Do you want to install the extension "${name}" into your CloudTabs browser?\n\nIf you select Confirm your app will install the extension and restart.`);
            if ( installExtension ) {
              try {
                name = name.replace(/\s/g, '-').toLocaleLowerCase();
                if ( name.match(NOT_ALLOWED_CHAR) ) {
                  name = name.replace(NOT_ALLOWED_CHAR, '');
                  if ( name.length < 3 ) {
                    name = `chrome-extension-${id}`;
                  }
                }
                name = name.replace(/-+/g, '-');
                if ( name.length > 49 ) {
                  name = name.slice(0, 49);
                  if ( name[48] == '-' ) {
                    name = name.slice(0, 48);
                  }
                }
                console.log(JSON.stringify({
                  installExtension: {
                    id, name
                  }
                }));
              } catch(err) {
                console.warn(`Error intercepting extension installation`, err);
              }
            }
          }
        }, 1);
      }
    });
  }
}
