// to evade some basic bot detection pertaining to detecting signatures of headless

// initial evasions from @sangaline
//   https://intoli.com/blog/not-possible-to-block-chrome-headless/
//   https://intoli.com/blog/not-possible-to-block-chrome-headless/test-headless-final.js

// also
// https://infosimples.github.io/detect-headless/

{
  /* eslint-disable no-inner-declarations */
  // temp location pointer targeting diagnois code

  /**
  // state and config
    const Events = `
      click mousemove mouseover mouseout mousedown pointerdown pointerup pointermove 
    `.split(/\s+/g).filter(s => s.length);
    const Styles = {
      position: 'fixed',
      pointerEvents: 'none',
      transform: 'translate(-50%, -50%)',
      zIndex:999999999,
      display: 'block',
      width: '1rem',
      height: '1rem',
      background: 'transparent',
      border: 'medium solid aqua',
      left: '0px',
      top: '0px'
    }
    const positionMarkers = [];

  install();

  function install() {
    for( const eventName of Events ) {
      document.addEventListener(eventName, showPosition);
    }

    document.defaultView.addEventListener('resize', () => {
      const div = document.createElement('div');
      Object.assign(div.style, Styles);
      Object.assign(div.style, {
        left: window.innerWidth/2+'px',
        top: (window.innerHeight - window.innerHeight*0.85)+10+'px',
        width: '66px',
        borderColor: 'red',
        background: 'lime',
        textAlign: 'center'
      })
      div.style.position = 'fixed';
      div.innerText = 'RESIZE';
      setTimeout(() => {
        div.remove();
      }, 3000);
      document.body.insertAdjacentElement('beforeend', div);
    });
  }

  // display a marker
    function showPosition({clientX,clientY}) {
      const div = document.createElement('div');
      const timestamp = Date.now();
      Object.assign(div.style, Styles);
      Object.assign(div.style, {
        left:clientX+'px', 
        top:clientY+'px'
      });
      document.body.insertAdjacentElement('afterbegin', div);
      positionMarkers.push({
        timestamp, 
        div, 
        remove(ms) {
          setTimeout(() => div.remove(), ms);
        }
      });
    }

  // remove markers older than 2 seconds 
    setInterval(
      () => {
        const Now = Date.now();
        let spliceCount = 0;
        for( const {timestamp, remove} of positionMarkers) {
          const age = Now - timestamp;
          if ( age > 500 ) {
            remove(Math.max(0, 1000 - age));
            spliceCount++;
          }
        }
        positionMarkers.splice(0, spliceCount);
      }, 1000);
  **/

  /* eslint-enable no-inner-declarations */
}
{
  /* eslint-disable no-inner-declarations */
  // temp location for file input related code in page context

  const isFileInput = el => el.localName == 'input' && el.type == 'file';

  self.zombieDosyLastClicked = {};

  self.addEventListener('click', click => {
      const {target} = click;
      const {clientX,clientY} = click;

      self.zombieDosyLastClicked = {target};

      const stack = expandShadowRoots(Array.from(document.elementsFromPoint(clientX,clientY)), clientX, clientY);

      if ( isFileInput(target) && target ) {
        self.zombieDosyLastClicked.fileInput = target;
      } else {
        const fileInputFromStack = stack.find(isFileInput);
        self.zombieDosyLastClicked.fileInput = fileInputFromStack;
      }
      
      //console.log(JSON.stringify({zombieDosyLastClicked:self.zombieDosyLastClicked}));
  }, {capture:true});

  function expandShadowRoots(els, x,y ) {
    const result = []; 
    for( const el of els ) {
      if ( el.shadowRoot ) {
        result.push(...el.shadowRoot.elementsFromPoint(x,y));
      } else {
        result.push(el);
      }
    }
    return result;
  }

  console.log(JSON.stringify({install:"Installed zombieDosyLastClicked with isFileInput support"}));
  /* eslint-enable no-inner-declarations */
}
{
  /* eslint-disable no-inner-declarations */
  // Pass the Webdriver Test.
    const newProto = navigator.__proto__;
    delete newProto.webdriver;
    navigator.__proto__ = newProto;

  // Pass the Chrome Test.
    // We can mock this in as much depth as we need for the test.
    window.chrome = {
      runtime: {}
    };

  // Pass the Permissions Test.
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.__proto__.query = parameters =>
      parameters.name === 'notifications'
        ? Promise.resolve({state: Notification.permission})
        : originalQuery(parameters);

      // Inspired by: https://github.com/ikarienator/phantomjs_hide_and_seek/blob/master/5.spoofFunctionBind.js
      const oldCall = Function.prototype.call;
      function call() {
          return oldCall.apply(this, arguments);
      }
      Function.prototype.call = call;

      const nativeToStringFunctionString = Error.toString().replace(/Error/g, "toString");
      const oldToString = Function.prototype.toString;

      function functionToString() {
        if (this === window.navigator.permissions.query) {
          return "function query() { [native code] }";
        }
        if (this === functionToString) {
          return nativeToStringFunctionString;
        }
        return oldCall.call(oldToString, this);
      }
      Function.prototype.toString = functionToString;

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
      delete newProto.plugins;
      newProto.plugins = PluginArray;
    } catch(e) {
      console.log(JSON.stringify({msg:`navigator.plugins needs workaround.`}));
    }

    try {
      delete newProto.mimeTypes;
      newProto.mimeTypes = MimeTypeArray;
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

  // Pass the Languages Test.
    try {
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en']
      });
    } catch(e) {
      console.log(JSON.stringify({msg:`navigator.languages needs workaround.`}));
    }

  // [caution] Pass the iframe Test
    /** careful with this, it might break something (overriding contentWindow on an iframe?
      what if a page relies on an actual value for this ?? **/
    /**
    /**
    Object.defineProperty(HTMLIFrameElement.prototype, 'contentWindow', {
      get: function() {
        return window;
      }
    });
    **/

  // [caution] Pass toString test, though it breaks console.debug() from working
    window.console.debug = () => {
      return null;
    };

   // Pass the connection rtt test
    delete newProto.connection;
    newProto.connection = {
      rtt:50, 
      type:"unknown", 
      effectiveType:"4g", 
      downlinkMax:Infinity, 
      downlink:(Math.random()*15).toFixed(1), 
      saveData: false,
      onchange: null,
      ontypechange: null,
    };

   // Pass the MouseEvent movementX/Y test
    const mouseProto = MouseEvent.prototype;
    delete mouseProto.movementX;
    delete mouseProto.movementY;
    mouseProto.movementX = 10;
    mouseProto.movementY = 10;

     document.addEventListener('mousemove',e => {
      e.__proto__ = mouseProto;
      //const {clientX,clientY,movementX,movementY} = e;
      //console.log(JSON.stringify({mm:{clientX,clientY,movementX,movementY}}));
     }, {capture:true});
  
  /* eslint-enable no-inner-declarations */
}
