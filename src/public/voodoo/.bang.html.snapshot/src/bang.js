/* eslint-disable no-setter-return, no-with, no-constant-condition, no-async-promise-executor */
(function () {
  // constants, classes, config and state
    const BBDEBUG = false;
    const SK_BBDEBUG = false;
    const IMMEDIATE = Symbol.for(`[[IMMEDIATE]]`);
    const NAMESPACE = 'b';
    const PIPELINE_REQUESTS = true;
    const RANDOM_SLEEP_ON_FIRST_PRINT = true;
    const RESPONSIVE_MEDIATION = true;
    const USE_XPATH = true;
    const X_NS_ATTRS = `.//@*[starts-with(name(), '${NAMESPACE}:')]`;
    const X_NEWLISTENING = document.createExpression(X_NS_ATTRS);
    const XON_EVENT_ATTRS = `.//@*[starts-with(local-name(), 'on')]`;
    const X_LISTENING = document.createExpression(XON_EVENT_ATTRS);
    const OPTIMIZE = true;
    const GET_ONLY = true;
    const MOBILE = isMobile();
    const GC_TIMEOUT = 10000;
    //const GENERATOR = (function*(){yield}()).constructor;
    const EMPTY = '';
    const {stringify:_STR} = JSON;
    const Reserved = new Set(['_self', '_host', '_top']);
    const LIGHTHOUSE = navigator.userAgent.includes("Chrome-Lighthouse");
    const DOUBLE_BARREL = /^\w+-(?:\w+-?)*$/; // note that this matches triple- and higher barrels, too
    const POS = 'beforeend';
    const LOCAL_PATH = 'this.';
    const PARENT_PATH = 'this.getRootNode().host.';
    const ONE_HIGHER = 'getRootNode().host.';
    const CALL_WITH_EVENT = '(event)';
    let comp = 0;
    const NextComponent = () => `b${comp++}${Math.random().toString(36)}`;
    const F = _FUNC; 
    const G = _GFUNC;
    const FUNC_CALL = /\);?$/;
    const MirrorNode = Symbol.for('[[MN]]');
    const DIV = document.createElement('div');
    const path = location.pathname;
    const CONFIG = {
      htmlFile: 'markup.html',
      scriptFile: 'script.js',
      styleFile: 'style.css',
      bangKey: '_bang_key',
      componentsPath: `${path}${path.endsWith('/') ? EMPTY : '/'}../components`,
      allowUnset: true,
      unsetPlaceholder: EMPTY,
      EVENTS: `bond error load click pointerdown pointerup pointermove mousedown mouseup submit
        mousemove touchstart touchend touchmove touchcancel dblclick dragstart dragend 
        dragmove drag mouseover mouseout focus blur focusin focusout scroll
        input change compositionstart compositionend text paste beforepaste select cut copy
        keydown keyup keypress compositionupdate selectionchange 
        contextmenu wheel
      `.split(/\s+/g).filter(s => s.length).map(e => `[on${e}]`).join(','),
      delayFirstPaintUntilLoaded: false,
      capBangRatioAtUnity: false,
      noHandlerPassthrough: false,
      useMagicClone: true,
    }
    const History = [];
    const STATE = new Map();
    const CACHE = new Map();
    const syskeys = new Map();
    const Waiters = new Map();
    const Started = new Set();
    const TRANSFORMING = new WeakSet();
    const Dependents = new Map();
    const MAX_CONCURRENT_REQUESTS = 5;
    const RequestPipeLine = new Map();
    const RequestWaiting = [];
    class Counter {
      started = 0;
      finished = 0;

      constructor(root) {
        root.counts = this;
        this.root = root;
      }

      check() {
        const {root} = this;
        const isTopLevel = root === document;
        let loaded = false;

        if ( isTopLevel ) {
          const noSwiftDescendents = root.querySelectorAll('.bang-el:not([lazy])').length === 0;
          loaded = noSwiftDescendents;
        } else {
          const nonZeroCheck = this.started > 0;
          const finishedCheck = this.finished >= this.started;
          loaded = nonZeroCheck && finishedCheck;
        }

        return loaded;
      }

      start() {
        if ( this.root == document ) say('log', 'Counting start');
        this.started++;
      }

      finish() {
        if ( this.root == document ) say('log', 'Counting finished');
        this.finished++;
      }
    }
    const SHADOW_OPTS = {mode:'open', delegatesFocus: true};
    const OBSERVE_OPTS = {subtree: true, childList: true, characterData: true};
    const INSERT = 'insert';
    const ALL_DEPS = {allDependents: true};
    const Env = Object.create(null); // storage for 'environment variables' (add to with setEnv)
    let LoadChecker;
    let RequestId = 0;
    let hindex = 0;
    let observer; // global mutation observer
    let systemKeys = 1;
    let _c$;
    let _s$;
    let firstState;

    const BangBase = (name) => class Base extends HTMLElement {
      static #activeAttrs = ['state']; // we listen for changes to these attributes only
      static get observedAttributes() {
        return Array.from(Base.#activeAttrs);
      }
      #name = name;
      #dependents = [];
      #funcs = new Set();
      #names = new Map();
      #paths = new Map();
      #destructors = new Set();
      #others;
      key;

      constructor() {
        super();
        this.cookMarkup = async (markup, state) => {
          const _host = this;
          BBDEBUG && console.log(`Component ${this.#name}`);
          const cooked = await cook.call(this, markup, state);
          BBDEBUG && console.log(`Component : ${this.#name}`);
          BBDEBUG && console.log(`State host: ${_host.name}`);
          BBDEBUG && console.log(`Will add ${this.#funcs.size} event handler functions`);
          if ( _host.name !== this.#name ) {
            BBDEBUG && console.info(`\tComponent and _host value differ`);
          }
          this.#funcs.forEach(t => {
            try {
              const funcName = t(this);
              BBDEBUG && console.log(`Applied automatic event handler function ${funcName} to component`, this);
              this.#funcs.delete(t);
            } catch(e) {
              console.warn(e);
            }
          });
          BBDEBUG && console.log();
          let shadow = this.shadowRoot;
          if ( ! shadow ) {
            const shadow = this.attachShadow(SHADOW_OPTS);
            observer.observe(shadow, OBSERVE_OPTS);
            await cooked.to(shadow, INSERT);
            // add dependents
            const deps = await findBangs(transformBang, shadow, ALL_DEPS);
            this.#dependents = deps.map(node => node.untilVisible());
            this.cookListeners(shadow);
          } else {
            BBDEBUG && console.log('already has shadow', this);
            if ( this.needsRefresh ) {
              this.cookListeners(shadow);
              this.needsRefresh = false;
            }
          }
        }
        this.markLoaded = async () => {
          this.alreadyPrinted = true;
          if ( ! this.loaded ) {
            this.counts.finish();
            const loaded = await this.untilLoaded();
            if ( loaded ) {
              this.loaded = loaded;
              this.setVisible();
              if ( ! this.isLazy ) {
                setTimeout(() => document.counts.finish(), 0);
              }
            } else {
              console.warn('Not loaded', this);
              // right now this never happens
            }
          }
        }
      }

      prepareState() {
        // set others to be merged into the with
      }

      get others() {
        if ( ! this.#others ) return {}
        return this.#others;
      }

      set others(newOthers) {
        this.#others = newOthers;
      }

      get destructors() {
        return this.#destructors;
      }

      get paths() {
        return this.#paths;
      }

      get names() {
        return this.#names;
      }

      get funcs() {
        return this.#funcs;
      }

      get name() {
        return this.#name;
      }

      // BANG! API methods
      async print() {
        if ( !this.alreadyPrinted ) {
          this.prepareVisibility();
        }
        const state = this.handleAttrs(this.attributes);
        if ( OPTIMIZE ) {
          const nextState = JS(state);
          if ( this.alreadyPrinted && this.lastState === nextState ) {
            return;
          }
          this.lastState = nextState;
        }
        return this.printShadow(state)
      }

      update() {
        if ( this.fastUpdate ) {
          return this.fastUpdate();
        } else {
          return this.print();
        }
      }

      rerender() {
        this.printShadow(this.state);
      }

      prepareVisibility() {
        this.classList.add('bang-el');
        this.counts.start();
        if ( !this.isLazy ) {
          document.counts.start();
        }
        this.classList.remove('bang-styled');
        // we prefetch the style
        fetchStyle(name).catch(err => {
          say('warn', err);
        });
      }

      async untilLoaded() {
        const myDependentsLoaded = (await Promise.all(this.#dependents)).every(visible => visible);
        const myContentLoaded = await becomesTrue(this.loadCheck, this.loadKey);
        const styleCheck = await becomesTrue(() => this.styleSheetsImported());
        BBDEBUG && console.log(new Date - self.Start);
        return myContentLoaded && myDependentsLoaded && styleCheck;
      }

      async styleSheetsImported() {     
        // just a very basic version that works with the way we write components now
        // a single style import and a single stylesheet per component

        // always first stylesheet is inserted by system (at top of markup template) 
        // I think we can count on the above being true but not sure

        const rules = this?.shadowRoot?.styleSheets?.[0]?.cssRules;
        if ( rules ) {
          const iRule = [...rules].find(rule => rule instanceof CSSImportRule);
          if ( !iRule ) {
            return true;
          }
          await becomesTrue(() => !!iRule?.styleSheet?.rules?.length);
          return true;
        }
        return true;
      }

      async untilVisible() {
        if ( this.isLazy ) return true;
        return await becomesTrue(this.visibleCheck, this.visibleLoadKey);
      }

      get deps() {
        return this.#dependents;
      }

      //FIXME this has a problem
      updateIfChanged(state) {
        const {didChange} = stateChanged(state);
        if ( didChange ) {
          const oKey = this.getAttribute('state');
          const newKey = updateState(state);
          BBDEBUG && console.log({didChange, oKey, newKey}, this);
          const views = Dependents.get(this) || new Set();
          views.add(this);
          Dependents.set(newKey, views);
          views.forEach(view => view.setAttribute('state', newKey));
        }
      }

      setVisible() {
        this.classList.add('bang-styled');
      }

      get state() {
        const key = this.getAttribute('state');
        return getState(key); //(key);
      }

      set state(newValue) {
        const key = this.getAttribute('state');
        if ( key.startsWith('system-key:') ) {
          return this.updateIfChanged(this.state);
        }
        return setState(key, newValue);
      }

      // Web Components methods
      attributeChangedCallback(name, oldValue) {
        if ( name === 'state' && !isUnset(oldValue) ) {
          this.update();
        }
      }

      connectedCallback() {
        new Counter(this);
        this.loadCheck = () => this?.counts?.check?.();
        this.visibleCheck = () => {
          const result = this?.classList?.contains?.('bang-styled');
          BBDEBUG && console.log(`Visible check. Result? ${result}`, this?.constructor?.name + '', this, globalThis.lastThis = this);
          return result;
        };
        this.loadKey = Math.random().toString(36);
        this.visibleLoadKey = Math.random().toString(36);
        say('log',name, 'connected');
        this.handleAttrs(this.attributes, {originals: true});
        if ( this.hasAttribute('lazy') ) {
          this.isLazy = true;
          if ( this.hasAttribute('super') ) {
            this.superLazy = true;
            loaded().then(() => sleep(400*Math.random()).then(() => this.print()));
          } else {
            if ( RANDOM_SLEEP_ON_FIRST_PRINT ) {
              sleep(160*Math.random()).then(() => this.print());
            } else {
              this.print();
            }
          }
        } else {
          this.print();
        }
      }

      disconnectedCallback() {
        BBDEBUG && console.log(`${this.name} disconnecting...`);
        this.alreadyPrinted = false;
        this.loaded = false;
        this.destructors.forEach(d => {
          try {
            BBDEBUG && console.log(`Running destructor`, d.toString());
            d();
          } catch(e) {
            console.warn(`Destructor for ${this.name} failed`, e, d);
          }
        });
        this.needsRefresh = true;
      }

      // private methods
      cookListeners(root) {
        return cookListeners(root);
      }

      handleAttrs(attrs, {node, originals} = {}) {
        const stateHolder = {};

        if ( ! node ) node = this;

        // we can optimize this method more, we only get attrs if originals == true
        // otherwise we just get and process the single 'state' attr 
        // this is a lot more performant
        for( const {name,value} of attrs ) {
          if ( isUnset(value) ) continue;
          handleAttribute(name, value, {node, originals, stateHolder, host: this});
        }

        self._states.push(stateHolder.state);

        return stateHolder.state;
      }

      printShadow(state) {
        if ( ! state ) {
          BBDEBUG && console.warn(`No state on component ${this.name}. Will pass empty state`);
          BBDEBUG && console.dir(this);
          //throw new TypeError(`No state`);
          const stateKey = new StateKey()+''; 
          state = {};
          setState(stateKey, state);
          this.setAttribute('state', stateKey);
          BBDEBUG && console.log(`Assigned empty state to key ${stateKey}`);
        }
        return fetchMarkup(this.#name).then(markup => this.cookMarkup(markup, state))
        .catch(err => BBDEBUG && say('warn!',err))
        .finally(this.markLoaded);
      }
    };

    class StateKey extends String {
      constructor (keyNumber) {
        if ( BBDEBUG || SK_BBDEBUG ) {
          const stack = (new Error('state key')).stack;
          self.syskeys.set(`system-key:${systemKeys+2}`, stack);
        }
        if ( keyNumber == undefined ) super(`system-key:${systemKeys+=2}`); 
        else super(`client-key:${keyNumber}`);
      }
    }

  install();

  // API
    async function use(name) {
      if ( self.customElements.get(name) ) return;

      BBDEBUG && console.log('using', name);

      let component;
      await fetchScript(name)
        .then(script => { // if there's a script that extends base, evaluate it to be component
          const Base = BangBase(name);
          const Compose = `(function () { ${Base.toString()}; return ${script}; }())`;
          try {
            with({...Env}) {
              component = eval(Compose);
            }
          } catch(e) {
            console.error(`Error evaluating component ${name}`, e, {Compose});
          }
        }).catch(err => {  // otherwise if there is no such extension script, just use the Base class
          BBDEBUG && say('log!', err);
          component = BangBase(name);
        });
      
      if ( self.customElements.get(name) ) return;

      self.customElements.define(name, component);
    }

    function setEnv(env) {
      if ( env ) {
        Object.assign(Env, env);
      }
    }
    
    // run a map of a list of work with configurable breaks in between
    // to let the main thread breathe at the same time 
    async function schedule(list, func, {
          batchSize: batchSize = 1,
          yieldTime: yieldTime = 30,
          strictSerial: strictSerial = true,
          useFrame: useFrame = false
        } = {}) {
      // note list can be async iterable
      const results = [];
      let i = 0;
      let currentBatch = 0;
      for await ( const item of list ) {
        let result;
        if ( strictSerial ) {
          result = await func(item, i);
        } else {
          result = func(item, i);
        }
        results.push(result);

        if ( RESPONSIVE_MEDIATION ) {
          i++;
          currentBatch++;
          if ( currentBatch < batchSize ) continue;
          currentBatch = 0;

          if ( useFrame ) {
            await nextFrame();
          } else if ( yieldTime > -1 ) {
            await sleep(yieldTime);
          }
        }
      }
      return results;
    }

    function undoState(key, transform = x => x) {
      while( hindex > 0 ) {
        hindex -= 1;
        if ( History[hindex].name === key ) {
          setState(key, transform(History[hindex].value));
          return true;
        }
      }
      return false;
    }

    function redoState(key, transform = x => x) {
      while( hindex < History.length - 1 ) {
        hindex += 1;
        if ( History[hindex].name === key ) {
          setState(key, transform(History[hindex].value));
          return true;
        }
      }
      return false;
    }

    function bangFig(newConfig = {}) {
      console.log(newConfig);
      Object.assign(CONFIG, newConfig);
    }

    function immediate(f) {
      if ( !(f instanceof Function) ) {
        throw new TypeError(`immediate can only be called on a function. Recieved: ${f}`);
      }

      if ( f[IMMEDIATE] ) return;

      Object.defineProperty(f, IMMEDIATE, {value: true, configurable: false, enumerable: false, writable: false});
    }

    function runCode(context, str) {
      with({...Env, ...context}) {
        return eval(str); 
      }
    }

    function stateChanged(obj) {
      const key = STATE.get(obj);
      const oStateJSON = STATE.get(key+'.json.last');
      const stateJSON = JS(obj);
      return {key, didChange: oStateJSON !== stateJSON, stateJSON, oStateJSON};
    }

    function updateState(state, key) {
      key = key || STATE.get(state);
      if ( ! key ) {
        console.warn('no key for state', state);
        throw new ReferenceError(`Key must exist to update state.`);
      }
      const oKey = key;
      const oStateJSON = STATE.get(key+'.json.last');
      const stateJSON = JS(state);
      STATE.delete(oStateJSON);
      STATE.set(key, state);
      BBDEBUG && console.log({key, state});
      const views = Dependents.get(oKey);
      if ( key.startsWith('system-key:') ) {
        try {
          STATE.delete(key);
          STATE.delete(key+'.json.last');
          key = new StateKey()+'';
          STATE.set(key, state);
          STATE.set(state, key);
          if ( views ) {
            views.forEach(view => view.setAttribute('state', key));
          }
          BBDEBUG && console.log({key, oKey});
        } catch(e) {
          console.warn(e);
        }
      }
      if ( views ) {
        Dependents.set(key, views);
      }
      STATE.set(key+'.json.last', stateJSON);
      STATE.set(stateJSON, key+'.json.last');
      return key;
    }

    function getViews(obj) {
      const key = STATE.get(obj);
      const acquirers = Dependents.get(key);
      if ( acquirers ) {
        return Array.from(acquirers);
      } else {
        console.warn('No acquirers for key');
        return [];
      }
    }

    function setState(key, state, {
      rerender: rerender = true, 
      save: save = false
    } = {}) {
      const jss = JS(state);
      BBDEBUG && console.log({jss, state});
      let lk = key+'.json.last';
      if ( GET_ONLY ) {
        if ( !STATE.has(key) ) {
          STATE.set(key, state);
          STATE.set(state, key);
          STATE.set(jss,lk);
          STATE.set(lk,jss);
        } else {
          const oStateJSON = STATE.get(lk);
          /*if ( stateChanged(oState).didChange ) {*/
          if ( oStateJSON !== jss ) {
            key = updateState(state, key);
            BBDEBUG && console.log({key}, 'no where to put');
          }
        }
      } else {
        STATE.set(key, state);
        STATE.set(state, key);
        STATE.set(jss,lk);
        STATE.set(lk,jss);
      }

      if ( save ) {
        hindex = Math.min(hindex+1, History.length);
        History.splice(hindex, 0, {name: key, value: clone(state)});
      }

      if ( rerender ) { // re-render only those components depending on that key
        const acquirers = Dependents.get(key);
        if ( acquirers ) acquirers.forEach(host => host.update());
      }

      if ( ! firstState ) {
        firstState = state; 
        BBDEBUG && console.log(`Set first state at key ${key}`, state);
      }
      
      return true;
    }

    function getState(key) {
      return STATE.get(key);
    }

    function patchState(key, state) {
      return setState(key, state, {rerender: false});
    }

    function cloneState(key, getOnly = GET_ONLY) {
      if ( getOnly ) return STATE.get(key);
      if ( STATE.has(key) ) return clone(STATE.get(key));
      else {
        throw new ReferenceError(`State store does not have the key ${key}`);
      }
    }

    async function loaded() {
      return becomesTrue(LoadChecker);
    }

    async function bangLoaded() {
      return becomesTrue(bangLoadedCheck);
    }

    function bangLoadedCheck() {
      const c_defined = typeof _c$ === "function";
      return c_defined;
    }

  // network pipelining (for performance)
    async function pipeLinedFetch(...args) {
      if ( !PIPELINE_REQUESTS ) return fetch(...args);
      const key = nextRequestId();
      const result = {args, started: new Date};
      let pr;
      if ( RequestPipeLine.size < MAX_CONCURRENT_REQUESTS ) {
        pr = fetch(...args).catch(err => (say('log', err), `/* ${err} */`));
        result.pr = pr;
        RequestPipeLine.set(key, result);
        const complete = r => {
          const result = RequestPipeLine.get(key);
          result.finished = new Date;
          result.duration = result.finished - result.started;
          RequestPipeLine.delete(key); 
          if ( RequestWaiting.length && RequestPipeLine.size < MAX_CONCURRENT_REQUESTS ) {
            const result = RequestWaiting.shift();
            const req = fetch(...result.args);
            req.then(complete).then(r => (result.resolve(r), r)).catch(e => (result.reject(e), e));
            RequestPipeLine.set(key, result);
          }
          return r;
        };
        pr.then(complete);
      } else {
        let resolve, reject;
        pr = new Promise((res,rej) => (resolve = res, reject = rej));
        result.resolve = resolve;
        result.reject = reject;
        RequestWaiting.push(result);
      }
      return pr;
    }

    function nextRequestId() {
      return `${RequestId++}${Math.random().toString(36)}`;
    }

  // helpers
    function cookListeners(root) {
      const that = root.getRootNode().host;
      BBDEBUG && console.log({root, that});
      const listening = select(root, USE_XPATH ? X_LISTENING : CONFIG.EVENTS);
      BBDEBUG && console.log({listening});
      if ( USE_XPATH ) {
        listening.forEach(({name, value, ownerElement:node}) => handleAttribute(name, value, {node, originals: true, host: that}));
      } else {
        listening.forEach(node => that.handleAttrs(node.attributes, {node, originals: true}));
      }

      if ( USE_XPATH ) {
        // new style event listeners (only with XPath)
        const newListening = select(root, X_NEWLISTENING);
        newListening.forEach(({name, value, ownerElement:node}) => handleNewAttribute(name, value, {node, originals: true, host: that}));
      }
    }

    function handleAttribute(name, value, {node, originals, stateHolder, host: Host} = {}) {
      BBDEBUG && console.log({name, value, node, originals, stateHolder});
      if ( name === 'state' ) {
        const stateKey = value.trim(); 
        const stateObject = getState(stateKey); // cloneState(stateKey);
        
        if ( isUnset(stateObject) ) {
          console.warn(node);
          self.STATE = STATE;
          console.warn(new ReferenceError(`
            <${node.localName}> constructor passed state key ${stateKey} which is unset. It must be set.
          `));
          return;
        }
        
        stateHolder.state = stateObject;

        if ( originals ) {
          let acquirers = Dependents.get(stateKey);
          if ( ! acquirers ) {
            acquirers = new Set();
            Dependents.set(stateKey, acquirers);
          }
          acquirers.add(node);
          Dependents.set(node, acquirers);
        } else return;
      } else if ( originals ) { // set event handlers to custom element class instance methods
        if ( ! name.startsWith('on') ) return;
        value = value.trim();

        if ( node.getRootNode().host.paths.has(value) ) return;
        //console.log('1', value, [...node.getRootNode().host.paths.keys()]);

        value = value.replace(/\(event\)$/, '');
        if ( ! value ) return;

        //if ( value.startsWith('this.') ) return;

        const {Func,host,path} = getAncestor(node, value);

        if ( name === 'onbond' ) {
          if ( Func ) {
            BBDEBUG && console.log(`Dereference bond function`, Func, node);
            try {
              Func(node);
              //FIXME: should this actually be removed ? 
              //node.removeAttribute(name);
            } catch(error) {
              console.warn(`bond function error`, {error, name, value, node, originals, stateHolder, Func});
            }
          } else {
            console.warn(`bond function Not dereferencable`, {name, value, node, originals, stateHolder});
          }
          return;
        }

        if ( !path || value.startsWith(path) ) return;

        // Conditional logic explained:
          // don't add a function call bracket if
          // 1. it already has one
          // 2. the reference is not a function
        const ender = value.match(FUNC_CALL) ? EMPTY : CALL_WITH_EVENT;
        const val = `${path}${value}${ender}`;
        host.paths.set(val, Func); 
        node.setAttribute(name, val);
        BBDEBUG && console.log(`Adding destructor`, host, name);
        if ( value.match(/^f\d+_/) ) {
          host.destructors.add(() => node.removeAttribute(name));
        }
      }
    }

    function handleNewAttribute(name, value, {node, Host}) {
      value = value.trim();
      if ( ! value ) return;

      const [nameSpace, ...flags] = name.split(':');
      
      if ( nameSpace !== NAMESPACE ) {
        throw new TypeError(`Irregular namespace ${nameSpace}`);
      }

      const eventName = flags.pop();
      const flagObj = Object.fromEntries(flags.map(f => [f, true]));

      if ( node.getRootNode().host.paths.has(value) ) return;

      value = value.replace(/\(event\)$/, '');
      if ( ! value ) return;

      const {Func,host,path} = getAncestor(node, value);

      BBDEBUG && console.log(node, {value, path});

      if ( !path || value.startsWith(path) ) return;

      // Conditional logic explained:
        // don't add a function call bracket if
        // 1. it already has one
        // 2. the reference is not a function
      const ender = value.match(FUNC_CALL) ? EMPTY : CALL_WITH_EVENT;
      const val = `${path}${value}${ender}`;
      host.paths.set(val, Func); 
      const handler = new Function('event', `return ${val}`);
      node.addEventListener(
        eventName, 
        handler,
        flagObj
      );
      if ( value.match(/^f\d+_/) ) {
        host.destructors.add(() => {
          node.removeEventListener(
            eventName, 
            handler,
            flagObj
          );
        });
      }
    }

    function select(context, selector) {
      try {
        if ( USE_XPATH ) {
          const results = [];
          let xresult;
          if ( context instanceof DocumentFragment ) {
            for( const elContext of context.children ) {
              if ( selector instanceof XPathExpression ) {
                xresult = selector.evaluate(elContext, XPathResult.ORDERED_NODE_ITERATOR_TYPE);
              } else {
                xresult = document.evaluate(selector, elContext, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
              }
              let node;
              /* eslint-disable no-cond-assign */
              while(node = xresult.iterateNext()) {
                results.push(node);
              } 
              /* eslint-enable no-cond-assign */
            }
          } else {
            if ( selector instanceof XPathExpression ) {
              xresult = selector.evaluate(context, XPathResult.ORDERED_NODE_ITERATOR_TYPE);
            } else {
              xresult = document.evaluate(selector, context, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
            }
            let node;
            /* eslint-disable no-cond-assign */
            while(node = xresult.iterateNext()) {
              results.push(node);
            }
            /* eslint-enable no-cond-assign */
          }
          return results;
        } else {
          BBDEBUG && console.log('non xpath', selector);
          return context.querySelectorAll ? context.querySelectorAll(selector) : [];
        }
      } catch(e) {
        console.warn(e);
      }
    }

    async function install() {
      BBDEBUG && (self.Start = new Date);
      new Counter(document);
      LoadChecker = () => document.counts.check();

      self._states = [];
      self.syskeys = syskeys;
      Object.assign(globalThis, {
        Dependents,
        STATE,
        Env,
        CONFIG,
        F,
        setEnv,
        use, setState, getState, patchState, cloneState, loaded, 
        sleep, bangFig, bangLoaded, isMobile, trace,
        undoState, redoState, stateChanged, getViews, updateState,
        isUnset,  EMPTY, 
        dateString,
        runCode, schedule,
        immediate,
        ...( BBDEBUG ? { STATE, CACHE, TRANSFORMING, Started, BangBase } : {})
      });

      const module = globalThis.vanillaview || (await import('./vv/vanillaview.js'));
      const {s,c} = module;
      const That = {STATE,CONFIG,StateKey,JS}; 
      _c$ = s.bind(That);
      _s$ = c.bind(That);
      That._c$ = _c$;
      That._s$ = _s$;

      globalThis.Fskip = s.skip;

      if ( CONFIG.delayFirstPaintUntilLoaded ) {
        becomesTrue(() => document.body).then(() => document.body.classList.add('bang-el'));
      }

      observer = new MutationObserver(transformBangs);
      /* we are interested in bang nodes (which start as comments) */
      observer.observe(document, OBSERVE_OPTS);
      await findBangs(transformBang); 
      
      loaded().then(() => document.body.classList.add('bang-styled'));
    }

    async function fetchMarkup(name) {
      // cache first
        // we make any subsequent calls for name wait for the first call to complete
        // otherwise we create many in parallel without benefitting from caching

      const key = `markup:${name}`;

      if ( Started.has(key) ) {
        if ( ! CACHE.has(key) ) await cacheHasKey(key);
      } else Started.add(key);

      const styleKey = `style${name}`;
      const baseUrl = `${CONFIG.componentsPath}/${name}`;
      if ( CACHE.has(key) ) {
        const markup = CACHE.get(key);
        if ( CACHE.get(styleKey) instanceof Error ) { 
          /*comp && comp.setVisible(); */
        }
        
        // if there is an error style and we are still includig that link
        // we generate and cache the markup again to omit such a link element
        if ( CACHE.get(styleKey) instanceof Error && markup.includes(`href=${baseUrl}/${CONFIG.styleFile}`) ) {
          // then we need to set the cache for markup again and remove the link to the stylesheet which failed 
        } else {
          /* comp && comp.setVisible(); */
          return markup;
        }
      }
      
      const markupUrl = `${baseUrl}/${CONFIG.htmlFile}`;
      let resp;
      const markupText = await pipeLinedFetch(markupUrl).then(async r => { 
        let text = EMPTY;
        if ( r.ok ) text = await r.text();
        else text = `<slot></slot>`;        // if no markup is given we just insert all content within the custom element
      
        if ( CACHE.get(styleKey) instanceof Error ) { 
          resp = `
          <style>
            ${await fetchFile(EMPTY, CONFIG.styleFile).catch(err => `/* ${err+EMPTY} */`)}
          </style>${text}` 
        } else {
          // inlining styles for increase speed */
          resp = `
          <style>
            ${await fetchFile(EMPTY, CONFIG.styleFile).catch(err => `/* ${err+EMPTY} */`)}
            ${await fetchStyle(name)}
          </style>${text}`;
        }
        
        return resp;
      }).finally(async () => CACHE.set(key, await resp));
      return markupText;
    }

    async function fetchFile(name, file) {
      const key = `${file}:${name}`;

      if ( Started.has(key) ) {
        if ( ! CACHE.has(key) ) await cacheHasKey(key);
      } else Started.add(key);

      if ( CACHE.has(key) ) return CACHE.get(key);

      const url = `${CONFIG.componentsPath}/${name ? name + '/' : EMPTY}${file}`;
      let resp;
      const fileText = await pipeLinedFetch(url).then(r => { 
        if ( r.ok ) {
          resp = r.text();
          return resp;
        } 
        resp = new ReferenceError(`Fetch error: ${url}, ${r.statusText}`);
        throw resp;
      })
      .then(e => e instanceof Error ? `/* no ${name}/${file} defined */` : e)
      .finally(async () => CACHE.set(key, await resp));
      
      return fileText;
    }

    async function fetchStyle(name) {
      return fetchFile(name, CONFIG.styleFile);
    }

    async function fetchScript(name) {
      return fetchFile(name, CONFIG.scriptFile);
    }

    // search and transform each added subtree
    async function transformBangs(records) {
      for( const record of records ) {
        for( const node of record.addedNodes ) {
          if ( node.nodeType !== Node.TEXT_NODE ) {
            cookListeners(node);
            await findBangs(transformBang, node);
          }
        }
      }
    }

    function transformBang(current) {
      const [name, data] = getBangDetails(current);

      // replace the bang node (comment) with its actual custom element node
      const actualElement = createElement(name, data);
      current.linkedCustomElement = actualElement;
      actualElement[MirrorNode] = current;
      current.parentNode.replaceChild(actualElement, current);
    }

    async function findBangs(callback, root = document.documentElement, {
          allDependents: allDependents = false,
          batchSize: batchSize = 100,
          yieldTime: yieldTime = 0,
          useFrame: useFrame = true
        } = {}) {
      if ( root.noFindBang ) return allDependents ? [] : void 0;
      const found = allDependents ? 
        node => node.nodeType === Node.COMMENT_NODE || 
          node.nodeType === Node.ELEMENT_NODE 
        :
        node => node.nodeType === Node.COMMENT_NODE
      ;
      const Filter = allDependents ? 
        NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_ELEMENT
        :
        NodeFilter.SHOW_COMMENT
      ;
      const Details = allDependents ? 
        getNodeDetails  
        :
        getBangDetails
      ;
      const Return = allDependents ? NodeFilter.FILTER_SKIP : NodeFilter.FILTER_REJECT;
      const Acceptor = {
        acceptNode(node) {
          if ( found(node) ) {
            const [name] = Details(node); 
            if ( name.match(DOUBLE_BARREL) ) return NodeFilter.FILTER_ACCEPT;
            else return Return; 
          } else if ( isDocument(node) ) {
            return NodeFilter.FILTER_ACCEPT;
          } else return NodeFilter.FILTER_SKIP;
        }
      };
      // FIXME: do we need to walk through shadows here?
      const iterators = [];
      const replacements = [];
      const dependents = [];

      let iterator = document.createTreeWalker(root, Filter, Acceptor);
      let current;

      iterators.push(iterator);

      // handle any descendents
        while (true) {
          current = iterator?.nextNode();
          if ( ! current ) {
            if ( iterators.length ) {
              iterator = iterators.shift();
              current = iterator.currentNode;
              // Note:
                // we need isBangTag here because a node that doesn't pass 
                // Acceptor.accept will stop show up as the first currentNode
                // in a tree iterator
              if ( isBangTag(current) ) {
                if ( !TRANSFORMING.has(current) ) {
                  TRANSFORMING.add(current);
                  const target = current;
                  replacements.push(() => transformBang(target));
                }
              }
              continue;
            } else break;
          }

          // handle root node
            // Note:
              // it's a special case because it will be present in the iteration even if
              // the NodeFilter would filter it out if it were not the root
            // Note:
              // a small optimization is replace isBangTag by the following check
              // we don't need isBangTag here because it's already passed the 
              // equivalent check in Acceptor.acceptNode
          if ( current.nodeType === Node.COMMENT_NODE ) {
            if ( !TRANSFORMING.has(current) ) {
              TRANSFORMING.add(current);
              const target = current;
              replacements.push(() => transformBang(target));
            }
          }

          dependents.push(current);

          if ( current.shadowRoot instanceof ShadowRoot ) {
            iterators.push(document.createTreeWalker(current.shadowRoot, Filter, Acceptor)); 
          }
        }

      let i = 0;
      while(replacements.length) {
        replacements.pop()();
        if ( RESPONSIVE_MEDIATION && allDependents ) {
          i++;
          if ( i < batchSize ) continue;
          i = 0;
          if ( useFrame ) {
            await nextFrame();
          } else {
            await sleep(yieldTime);
          }
        }
      }

      if ( allDependents ) {
        return dependents
          .map(actualElement)
          .filter(el => el && !el.hasAttribute('lazy'));
      } else return;
    }




    function actualElement(node) {
      const el = node.nodeType === Node.COMMENT_NODE ? 
        node.linkedCustomElement 
        : 
        node 
      ;
      //console.log(node, el);
      return el;
    }

    // NOTE: I'll have to add auto-detected functions to the node
    // before this point, so they can be found here
    // but after (I think) vv does it's processing. (I hope we can do this with current flow)
    function getAncestor(node, value) {
      const oNode = node;
      let lastNode;
      if ( node ) {
        const currentPath = ['this.'];
        while( node ) {
          if ( node[value] instanceof Function ) {
            const retVal = {Func: node[value], path: currentPath.join(EMPTY), oNode, host: node};
            return retVal;
          }
          if ( node?.paths?.has(value) ) {
            return { host: node, Func: node?.paths?.get(value), path: value };
          }
          currentPath.push( ONE_HIGHER );

          lastNode = node;

          node = node.getRootNode().host;
        }
      }
      console.warn(`Error could not dereference function ${value} starting at original node:`, oNode);
      console.warn(`Got as high as`, lastNode);
      return {};
    }

    function isBangTag(node) {
      return node.nodeType === Node.COMMENT_NODE && getBangDetails(node)[0].match(DOUBLE_BARREL);
    }

    function isDocument(node) {
      return node.nodeType === Node.DOCUMENT_FRAGMENT_NODE ||
        node.nodeType === Node.DOCUMENT_NODE
      ;
    }

    function getBangDetails(node) {
      const text = node.textContent.trim();
      const [name, ...data] = text.split(/[\s\t]/g);
      return [name.trim(), data.join(' ')];
    }

    function getNodeDetails(node) {
      switch(node.nodeType) {
        case Node.COMMENT_NODE:
          return getBangDetails(node);
        case Node.ELEMENT_NODE:
          return [node.localName];
      }
    }

    async function cook(markup, state) {
      let cooked = EMPTY;
      const _top = firstState;
      const _self = state;
      const _host = this;

      if ( ! state._top ) {
        Object.defineProperty(state, '_top', { value: _top });
      }
      
      try {
        with({...Env, ...state, ..._host.others}) {
          cooked = await eval("(async function () { return await _FUNC`${{state,_host}}"+markup+"`; }())");  
        }
        return cooked;
      } catch(error) {
        console.warn('cook', error);
        say('error!', 'Template error', {markup, state, error, _host: this});
        throw error;
      }
    }

    async function _FUNC(strings, ...vals) {
      const s = Array.from(strings);
      const ret =  await _c$(s, ...vals);
      return ret;
    }

    async function _GFUNC(strings, ...vals) {
      const s = Array.from(strings);
      const ret = await _s$(s, ...vals);
      return ret;
    }

    function createElement(name, data) {
      return toDOM(`<${name} ${data}></${name}>`).firstElementChild;
    }

    function toDOM(str) {
      DIV.replaceChildren();
      DIV.insertAdjacentHTML(POS, `<template>${str}</template>`);
      return DIV.firstElementChild.content;
    }

    async function becomesTrue(check, key) {
      const WaitKey = key || check;
      let waiters = Waiters.get(WaitKey);

      if ( ! waiters ) {
        waiters = _becomesTrue(check).then(checkResult => {
          setTimeout(() => Waiters.delete(WaitKey), GC_TIMEOUT);
          return checkResult; 
        });
        Waiters.set(WaitKey, waiters);
      }
      const pr = new Promise(resolve => waiters.then(resolve));
      return pr;
    }

    async function _becomesTrue(check) {
      return new Promise(async res => {
        while(true) {
          await nextFrame();
          const v = await check();
          if ( v ) break;
        }
        res(true);
      });
    }

    // this is to optimize using becomesTrue so we don't start a new timer
    // for every becomesTrue function call (in the case of the cache check, anyway)
    // we can use this pattern to apply to other becomesTrue calls like loaded
    async function cacheHasKey(key) {
      const cacheKey = `cache:${key}`;
      const funcKey = `checkFunc:${key}`;
      let checkFunc = Waiters.get(funcKey);
      if ( ! checkFunc ) {
        checkFunc = () => CACHE.has(key);
        Waiters.set(funcKey,checkFunc);
      }
      return becomesTrue(checkFunc, cacheKey);
    }

    async function sleep(ms) {
      return new Promise(res => setTimeout(res, ms));
    }
    
    async function nextFrame() {
      return new Promise(res => requestAnimationFrame(res));
    }

    function isUnset(x) {
      return x === undefined || x === null;
    }

    function say(mode, ...stuff) {
      (BBDEBUG || mode === 'error' || mode.endsWith('!')) && MOBILE && !LIGHTHOUSE && alert(`${mode}: ${stuff.join('\n')}`);
      (BBDEBUG || mode === 'error' || mode.endsWith('!')) && console[mode.replace('!',EMPTY)](...stuff);
    }

    function isMobile() {
      const toMatch = [
        /Android/i,
        /webOS/i,
        /iPhone/i,
        /iPad/i,
        /iPod/i,
        /BlackBerry/i,
        /Windows Phone/i
      ];

      return toMatch.some((toMatchItem) => {
        return navigator.userAgent.match(toMatchItem);
      });
    }
  
    function trace(msg = EMPTY) {
      const tracer = new Error('Trace');
      BBDEBUG && console.log(msg, 'Call stack', tracer.stack);
    }

    function dateString(date) {
      const offset = date.getTimezoneOffset()
      date = new Date(date.getTime() - (offset*60*1000))
      return date.toISOString().split('T')[0];
    }

    function clone(o) {
      console.log(CONFIG);
      if ( CONFIG.useMagicClone ) {
        return magicClone(o);
      }
      return JSON.parse(JS(o));
    }

    function magicClone(o) {
      console.log('using magic clone');
      // Check if the input is an object. Non-objects (like primitives) are returned as is.
      if (o === null || typeof o !== 'object') {
        return o;
      }

      try {
        // Create a new object with the same prototype as the original.
        let clone = Object.create(Object.getPrototypeOf(o));

        // Copy each property (including getters, setters, and regular properties).
        Object.getOwnPropertyNames(o).forEach(prop => {
          let descriptor = Object.getOwnPropertyDescriptor(o, prop);
          Object.defineProperty(clone, prop, descriptor);
        });

        return clone;
      } catch (error) {
        // Handle errors (e.g., non-clonable objects) and possibly log them.
        console.error('Error in magicClone:', error);
        return null; // Or any other fallback value as per your error handling strategy.
      }
    }

    function JS(o) {
      if ( CONFIG.useMagicClone ) {
        return magicStringify(o); 
      }
      return _STR(o, Replacer, EMPTY);
    }

    function magicStringify(obj) {
      const seenObjects = new WeakSet();

      function serialize(o) {
        if (o === null || typeof o !== 'object') {
          return o;
        }

        // Detect circular references
        if (seenObjects.has(o)) {
          return '[Circular]';
        }
        seenObjects.add(o);

        if (o?.constructor?.name === 'Object' || Array.isArray(o)) {
          let plainObj = Array.isArray(o) ? [] : {};

          Object.getOwnPropertyNames(o).forEach(prop => {
            let descriptor = Object.getOwnPropertyDescriptor(o, prop);
            plainObj[prop] = (typeof descriptor.value === 'object') ? serialize(descriptor.value) : (descriptor.get ? o[prop] : descriptor.value);
          });

          return plainObj;
        } else {
          // Non-plain objects are returned as is
          return o;
        }
      }

      try {
        return JSON.stringify(serialize(obj), Replacer, EMPTY);
      } catch (error) {
        console.error('Error in magicStringify:', error);
        return null;
      }
    }

    function Replacer(key, value) {
      const obj = this;
      if ( typeof obj[key] === "function" ) {
        return value.toString();
      } else if ( value instanceof Node ) {
        return `${value.nodeName}//${value.nodeValue || value.outerHTML || value.textContent}`;
      } else return value;
    }
}());

