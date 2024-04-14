// to evade some basic bot detection pertaining to detecting signatures of headless

// initial evasions from @sangaline
//   https://intoli.com/blog/not-possible-to-block-chrome-headless/
//   https://intoli.com/blog/not-possible-to-block-chrome-headless/test-headless-final.js

// also
// https://infosimples.github.io/detect-headless/

{
  // outer height and width
    try {
      Object.defineProperty(globalThis.window, 'outerHeight', {value: window.innerHeight + 80}); // BB chrome is 80 pix high
      Object.defineProperty(globalThis.window, 'outerWidth', {value: window.innerWidth});
    } catch(e) {
      console.warn(`Inner and outer height not overriden`);
    }

  // webdriver, connection.rtt, and chrome properties
    try {
      Object.defineProperty(navigator, 'webdriver', {value: false})
    } catch(e) {
      console.warn(`Webdriver not overriden`);
    }

    try {
      Object.defineProperty(navigator.connection, 'rtt', {value: 50})
    } catch(e) {
      console.warn(`connection.rtt not overriden`);
    }

    try {
      const chrome = {
        app: Object.assign(
          {}, 
          JSON.parse(
            '{"isInstalled":false,"InstallState":{"DISABLED":"disabled","INSTALLED":"installed","NOT_INSTALLED":"not_installed"},"RunningState":{"CANNOT_RUN":"cannot_run","READY_TO_RUN":"ready_to_run","RUNNING":"running"}}'
          ), 
          {
            getDetails: () => null,
            getIsInstalled: () => null,
            installState: () => null,
            runningState: () => null,
          }
        ),
        loadTimes: () => null,
        csi: () => null,
      };
      if ( ! globalThis.chrome ) {
        Object.defineProperty(globalThis, 'chrome', {value: chrome});
      }
    } catch(e) {
      console.warn(`navigator.chrome not set`);
    }

  // Pass the Plugins Length Test.
    // Overwrite the `plugins` property to use a custom getter.
    const PLUGINS = [
      {
        name: "Chrome PDF Plugin",
        description: "Portable Document Format",
        filename: "internal-pdf-viewer",
        mimetypes: [
          {
            type: "application/x-google-chrome-pdf",
            suffixes: "pdf",
            description: "Portable Document Format",
          }
        ]
      },
      {
        name: "Chrome PDF Viewer",
        description: "",
        filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai",
        mimetypes: [
          {
            type: "application/pdf",
            suffixes: "pdf",
            description: "",
          }
        ]
      },
      {
        name: "Native Client",
        description: "",
        filename: "internal-nacl-plugin",
        mimetypes: [
          {
            description: "Native Client Executable",
            suffixes: "",
            type: "application/x-nacl"
          },
          {
            description: "Portable Native Client Executable",
            suffixes: "",
            type: "application/x-pnacl"
          }
        ]
      }
    ];

    const MIMETYPES = [
      {
        type: "application/x-google-chrome-pdf",
        suffixes: "pdf",
        description: "Portable Document Format",
      },
      {
        type: "application/pdf",
        suffixes: "pdf",
        description: "",
      },
      {
        description: "Native Client Executable",
        suffixes: "",
        type: "application/x-nacl"
      },
      {
        description: "Portable Native Client Executable",
        suffixes: "",
        type: "application/x-pnacl"
      }
    ];

    const {PluginArray, MimeTypeArray} = getPluginsClasses();

    try {
      Object.defineProperty(navigator, 'plugins', {value: PluginArray});
    } catch(e) {
      console.log(JSON.stringify({msg:`navigator.plugins needs workaround.`}));
    }

    try {
      Object.defineProperty(navigator, 'mimeTypes', {value: MimeTypeArray});
    } catch(e) {
      console.log(JSON.stringify({msg:`navigator.mimeTypes needs workaround.`}));
    }

    // Classes
      function getPluginsClasses() {
        class Plugin {
          constructor({
            name, description, filename, 
            mimetypes
          }) {
            Object.assign(this, {
              name, description, filename
            });
            mimetypes.forEach((mt, index) => {
              this[index] = mt;
              Object.defineProperty(mt, 'enabledPlugin', {
                get: () => this
              });
            });
            this.item = this.namedItem = i => this[i];
            this.length = mimetypes.length;
            Object.freeze(this);
          }
          toString() {
            return '[object Plugin]';
          }
        }

        class MimeType {
          constructor({
            type, suffixes, description
          }) {
            let plugin;
            Object.assign(this, {
              type, suffixes, description
            });
            Object.defineProperty(this, 'enabledPlugin', {
              set: p => {
                plugin = plugin || p;
              },
              get: () => plugin
            });
            Object.freeze(this);
          }
          toString() {
            return '[object MimeType]';
          }
        }

        self.Plugin = Plugin;
        self.MimeType = MimeType;

        let Z = {};
        if ( navigator.plugins.__proto__ ) {
          Z = Object.create(navigator.plugins.__proto__);
        }

        let Z2 = {};
        if ( navigator.mimeTypes.__proto__ ) {
          Z2 = Object.create(navigator.mimeTypes.__proto__);
        }

        MimeTypeArray.call(Z2,{mimeTypes:MIMETYPES});
        PluginArray.call(Z,{plugins:PLUGINS});

        return {PluginArray: Z, MimeTypeArray: Z2, Plugin, MimeType};

        function PluginArray({plugins}) {
          Object.defineProperty(this, 'length', {
            value: plugins.length
          });
          plugins.forEach((p, i) => {
            const plugin = new Plugin(p);
            this[i] = plugin;
            this[p.name] = plugin;
          });
          Object.defineProperty(this, Symbol.iterator, {
            get: () => () => plugins.values()
          });
          Object.defineProperties(this, {
            toString: {
              value: '[object PluginArray]'
            },
            item: {
              value: i => this[i]
            },
            namedItem: {
              value: n => this[n]
            },
            refresh: {
              value: () => undefined
            }
          });
          Object.freeze(this);
        }

        function MimeTypeArray({mimeTypes}) {
          Object.defineProperty(this, 'length', {
            value: mimeTypes.length
          });
          mimeTypes.forEach((m, i) => {
            const mime = new MimeType(m);
            this[i] = mime;
            this[m.name] = mime;
          });
          Object.defineProperty(this, Symbol.iterator, {
            get: () => () => mimeTypes.values()
          });
          Object.defineProperties(this, {
            toString: {
              value: '[object MimeTypeArray]'
            },
            item: {
              value: i => this[i]
            },
            namedItem: {
              value: n => this[n]
            },
            refresh: {
              value: () => undefined
            }
          });
          Object.freeze(this);
        }
      }
}
