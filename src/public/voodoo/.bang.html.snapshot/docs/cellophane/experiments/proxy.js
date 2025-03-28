// notes
  // this doesn't really work because either we have to reference every value via the full path
  // missing our goal of reducing typing by introducing proxies
  // or we have to add a .value() or () to the end of every value, which is weird...
  // either way we can't use normal JS syntax and ops on values of we use a proxy like this
  // we can only have normality if we do things the way we do them, with the cloneState and setState
  // methods
const RecursiveStateProxy = (function () {
  const Target = () => void 0;

  // We have two handlers, one for state[key], and one for the rest
  // this is so 'get' will work, because otherwise we don't know when a get path begins
  // this way it always begins at state
  class StateHandler {
    apply(targ, thisArg, args) {
      throw new TypeError(`State is not a function.`);
    }

    get(targ, prop, recv) {
      if ( prop === isProxy ) {
        return true; 
      } else {
        guard('get', this, targ, recv);
        return new Proxy(Target, new Handler(prop));
      }
      return recv;
    }
    
    set(targ, prop, value, recv) {
      guard('set', this, targ, recv, value);
      const key = prop;
      const state = cloneState(key);
      setState(key, value);
      return true;
    }
    
    // not possible 
      construct() {
        throw new TypeError(`Not constructible.`);
      }
      defineProperty() {
        throw new TypeError(`Not possible.`);
      }
      deleteProperty() {
        throw new TypeError(`Not possible.`);
      }
      getOwnPropertyDescriptor() {
        throw new TypeError(`Not possible.`);
      }
      getPrototypeOf() {
        throw new TypeError(`Not possible.`);
      }
      has() {
        throw new TypeError(`Not possible.`);
      }
      isExtensible() {
        throw new TypeError(`Not possible.`);
      }
      ownKeys() {
        throw new TypeError(`Not possible.`);
      }
      preventExtensions() {
        throw new TypeError(`Not possible.`);
      }
      setPrototypeOf() {
        throw new TypeError(`Not possible.`);
      }
  }

  class Handler {
    // private
    #path = [];

    constructor(firstStop) {
      this.#path.push(firstStop);
    }

    apply(targ, thisArg, args) {
      guard('apply', this, targ);

      try {
        args = JSON.stringify(args);
      } catch(e) {
        DEBUG && console.warn(`apply.JSON.stringify error`, e);
        throw new TypeError(`Arguments need to be able to be serialized by JSON.stringify`);
      }

      
      const path = Array.from(this.#path);
      this.#path.length = 0;
      console.log(path, args);
      const key = path.shift();
      const state = cloneState(key);
      const reboundFunction = resolvePathToFunction(state, path);

      // note: result of function call is *not* proxied
      return reboundFunction(...args);
    }

    get(targ, prop, recv) {
      if ( prop === isProxy ) {
        return true; 
      } else {
        guard('get', this, targ, recv);
        this.#path.push(prop);
      }
      return recv;
    }
    
    set(targ, prop, value, recv) {
      guard('set', this, targ, recv, value);
      const path = Array.from(this.#path);
      console.log(path, value);
      this.#path.length = 0;
      const key = path.shift();
      const state = cloneState(key);
      const setter = resolvePenultimate(state, path);
      setter[path.pop()] = value;
      setState(key, state);
      return true;
    }
    
    // not possible 
      construct() {
        throw new TypeError(`Not constructible.`);
      }
      defineProperty() {
        throw new TypeError(`Not possible.`);
      }
      deleteProperty() {
        throw new TypeError(`Not possible.`);
      }
      getOwnPropertyDescriptor() {
        throw new TypeError(`Not possible.`);
      }
      getPrototypeOf() {
        throw new TypeError(`Not possible.`);
      }
      has() {
        throw new TypeError(`Not possible.`);
      }
      isExtensible() {
        throw new TypeError(`Not possible.`);
      }
      ownKeys() {
        throw new TypeError(`Not possible.`);
      }
      preventExtensions() {
        throw new TypeError(`Not possible.`);
      }
      setPrototypeOf() {
        throw new TypeError(`Not possible.`);
      }
  }

  const HandlerInstance = new StateHandler;

  class RecursiveStateProxy {
    constructor() {
      const {proxy: StateProxy, revoke} = Proxy.revocable(Target, HandlerInstance);
      this.detachProxy = revoke;
      this.receiver = StateProxy;
    }
  }

  return RecursiveStateProxy;

  /* eslint-disable no-inner-declarations */

  // helpers
    function guard(source, handler, targ, recv, value = null) {
      if ( !(handler instanceof StateHandler) && !(handler instanceof Handler) ) {
        throw new TypeError(`${source}: this needs to be the Handler instance`);
      }

      if ( targ !== Target ) {
        throw new TypeError(`${source}: targ needs to be the Target`);
      }

      if ( source !== 'apply' && !recv[isProxy] ) {
        throw new TypeError(`${source}: recv needs to be the State Proxy`);
      }

      if ( source === 'set' ) {

      }
    }

    function resolvePenultimate(root, steps) {
      let link = root;
      let lastLink;
      let index = 0;
      let nextStep = steps[index];

      while(link[nextStep] !== undefined) {
        lastLink = link;
        link = link[nextStep];

        index+=1;
        nextStep = steps[index];
      }

      if ( index < steps.length ) {
        console.info(`Path ended before last step reached`, {lastLink, link, nextStep, steps, root});
        throw new TypeError(`API method ${steps.join('.')} was not found. Reason: Path was undefined (at ${
            steps.slice(0,index+1).join('.')
          }) before reaching end of: ${
            steps.join('.')
          }`
        );
      }

      return lastLink;
    } 

    function resolvePathToFunction(root, steps) {
      let link = root;
      let lastLink;
      let index = 0;
      let nextStep = steps[index];

      while(link[nextStep] !== undefined) {
        lastLink = link;
        link = link[nextStep];

        index+=1;
        nextStep = steps[index];
      }

      if ( index < steps.length ) {
        console.info(`Path ended before last step reached`, {lastLink, link, nextStep, steps, root});
        throw new TypeError(`API method ${steps.join('.')} was not found. Reason: Path was undefined (at ${
            steps.slice(0,index+1).join('.')
          }) before reaching end of: ${
            steps.join('.')
          }`
        );
      }

      if ( typeof link !== "function" ) {
        console.info(`Path ended at non-function`, {lastLink, nonFunction: link, nextStep, steps, root});
        throw new TypeError(`Path needs to end at a function for API call. But ended at: ${link}`);
      }

      // bind link's this value to lastLink
        // as if it was called via <lastLink>.<link>(
      const reboundFunction = link.bind(lastLink);

      return reboundFunction;
    }

  /* eslint-enable no-inner-declarations */
}());

