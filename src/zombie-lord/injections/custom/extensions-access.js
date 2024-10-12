{
  if ( location.hostname == "chromewebstore.google.com" ) {
    const MIN_WAIT = 5;
    const MAX_WAITS = 8640000;
    const DEBUG = {
      debugUntilTrue: true,
    }
    const NOT_ALLOWED_CHAR = /[^a-z0-9\-]/g;
    const INSTALL_BUTTON_SELECTOR = 'main section > section > div:last-child button';

    correct();

    async function correct() {
      await untilTrue(() => document.querySelector(INSTALL_BUTTON_SELECTOR), 100, 10000, () => console.warn('Could not find the main button'));
      setInterval(() => {
        const installButton = document.querySelector(INSTALL_BUTTON_SELECTOR);
        const id = location.pathname.split('/').pop();

        if ( ! id ) {
          return;
        }

        if ( installButton.innerText.trim().match(/Add.*to.*Desktop/i) ) {
          // just a bit of convneience only for the english store present version tho.
          const allSpan = Array.from(document.querySelectorAll(INSTALL_BUTTON_SELECTOR + ' span'));
          const spanWithWords = allSpan.filter(s => s.innerText.trim().length);
          let words = "Add to CloudTabs";
          if ( globalThis._installedExtensions?.has?.(id) ) {
            words = "Remove from CloudTabs";
          }

          if ( spanWithWords.length > 1 ) {
            installButton.innerText = words;
            installButton.style.color = "white !important;"
          } else {
            spanWithWords[0].innerText = words;
          }
        }
      }, 250);
    }
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
                  deleteExtension: {
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
    async function untilTrue(pred, waitOverride = MIN_WAIT, maxWaits = MAX_WAITS, failCallback) {
      let waitCount = 0;
      let resolve;
      let reject;
      const pr = new Promise((res, rej) => (resolve = res, reject = rej));
      setTimeout(checkPred, 0);
      return pr;

      function checkPred() {
        try {
          DEBUG.debugUntilTrue && console.log('Checking', pred);
          DEBUG.debugUntilTrue && console.log('Pred result? ' + pred());
          if ( pred() ) {
            return resolve(true);
          } else {
            waitCount++;
            if ( waitCount < maxWaits ) {
              setTimeout(checkPred, waitOverride);
            } else if ( typeof failCallback == "function" ) {
              failCallback(reject); 
            }
          }
        } catch(e) {
          console.error(`Predicate failure`, pred, e);
          throw e;
        }
      }
    }
  }
  if ( location.protocol == "chrome:" && location.hostname == "extensions" ) {
    const NOT_ALLOWED_CHAR = /[^a-z0-9\-]/g;
    const MIN_WAIT = 5;
    const MAX_WAITS = 8640000;
    const DEBUG = {
      debugUntilTrue: true,
    }
    console.log('Inside chrome extensions page');
    const S = {
      extMan: 'extensions-manager',
      vMan: 'cr-view-manager',
      eLi: 'extensions-item-list',
      eI: 'extensions-item',
      rB: '#removeButton',
      eT: '#enableToggle',
    };
    DocumentFragment.prototype.$ = $;
    DocumentFragment.prototype.$$ = $$;

    // path documents the path 
    const path = [
      () => $(S.extMan).shadowRoot,
      r => r.$(S.vMan),
      e => $.call(e, S.eLi).shadowRoot,
      r => r.$$(S.eI),
      i => i.shadowRoot.$(S.rB)
    ];

    const getItems = () => $(S.extMan)?.shadowRoot?.$?.(S.vMan)?.querySelector?.(S.eLi)?.shadowRoot?.$$?.(S.eI);

    install();

    async function install() {
      await untilTrue(() => getItems()?.length > 0, 100, 1000, () => console.warn(`Never found any extension items to attach to`))
      const items = getItems();
      for(const ext of items) {
        try {
          const removeButton = ext.shadowRoot.$(S.rB);
          const enableToggle = ext.shadowRoot.$(S.eT);
          const doc = removeButton.getRootNode();
          const id = doc.host.id;
          const nameEl = doc.querySelector('#name') || doc.querySelector('[id^="name"]');
          let name = nameEl?.innerText || `extension-${id}`;
          removeButton.addEventListener('click', () => {
            const doIt = confirm(`Do you want to remove "${name}" from your CloudTabs browser?`);
            if ( doIt ) {
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
                  deleteExtension: {
                    id, name
                  }
                }));
              } catch(err) {
                console.warn(`Error intercepting extension removal`, err);
              }
            }
          }, {capture:true});
          enableToggle.addEventListener('click', () => {
            const doIt = confirm(`Do you want to modify "${name}" in your CloudTabs browser?`);
            if ( doIt ) {
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
                  modifyExtension: {
                    id, name
                  }
                }));
              } catch(err) {
                console.warn(`Error intercepting extension removal`, err);
              }
            }
          }, {capture:true});
        } catch(err) {
          console.warn(`Error installing for extension item`, ext, err);
        }
      }
    }

    function $(sel) {
      return (queryable(this) ? this :  document).querySelector(sel);
    }
    function $$(sel) {
      return (queryable(this) ? this :  document).querySelectorAll(sel);
    }

    function queryable(thing) {
      return (thing instanceof Element || thing instanceof DocumentFragment);
    }
    async function untilTrue(pred, waitOverride = MIN_WAIT, maxWaits = MAX_WAITS, failCallback) {
      let waitCount = 0;
      let resolve;
      let reject;
      const pr = new Promise((res, rej) => (resolve = res, reject = rej));
      setTimeout(checkPred, 0);
      return pr;

      function checkPred() {
        try {
          DEBUG.debugUntilTrue && console.log('Checking', pred);
          DEBUG.debugUntilTrue && console.log('Pred result? ' + pred());
          if ( pred() ) {
            return resolve(true);
          } else {
            waitCount++;
            if ( waitCount < maxWaits ) {
              setTimeout(checkPred, waitOverride);
            } else if ( typeof failCallback == "function" ) {
              failCallback(reject); 
            }
          }
        } catch(e) {
          console.error(`Predicate failure`, pred, e);
          throw e;
        }
      }
    }
  }
}
