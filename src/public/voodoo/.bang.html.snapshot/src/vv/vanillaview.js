// eslint directives
  /* eslint-disable no-empty */
// vanillaview.js
  // imports
    const CODE = Math.random().toFixed(18);
    const IMMEDIATE = Symbol.for(`[[IMMEDIATE]]`);

  // backwards compatible alias
    const skip = markup;
    const attrskip = attrmarkup;

  // constants
    const DEBUG             = false;
    const NULLFUNC          = () => void 0;
    /* eslint-disable no-useless-escape */
    const KEYMATCH          = /(?:<!\-\-)?(key0.\d+)(?:\-\->)?/gm;
    /* eslint-enable no-useless-escape */
    const ATTRMATCH         = /\w+=/;
    const JOINER            = '<link rel=join>';
    const KEYLEN            = 20;
    const XSS               = () => `Possible XSS / object forgery attack detected. ` +
                              `Object code could not be verified.`;
    const OBJ               = x => ({message:`Object values not allowed here.`, x});
    const UNSET             = () => `Unset values not allowed here.`;
    const INSERT            = () => `Error inserting template into DOM. ` +
      `Position must be one of: ` +
      `replace, beforebegin, afterbegin, beforeend, innerhtml, afterend`;
    const NOTFOUND          = loc => `Error inserting template into DOM. ` +
      `Location ${loc} was not found in the document.`;
    const MOVE              = new class {
      beforeend   (frag,elem) { elem.appendChild(frag) }
      beforebegin (frag,elem) { elem.parentNode.insertBefore(frag,elem) }
      afterend    (frag,elem) { elem.parentNode.insertBefore(frag,elem.nextSibling) }
      replace     (frag,elem) { elem.parentNode.replaceChild(frag,elem) }
      afterbegin  (frag,elem) { elem.insertBefore(frag,elem.firstChild) }
      innerhtml   (frag,elem) { elem.replaceChildren(); elem.appendChild(frag) }
      insert      (frag,node) { node.replaceChildren(frag) }
    };
    const REMOVE_MAP        = new Map();
    const DIV               = document.createElement('div');
    const POS               = 'beforeend';
    const EMPTY = '';
    const {stringify:_STR} = JSON;
    const JS = o => _STR(o, Replacer, EMPTY);
    const isVV  = x => (x?.code === CODE || (x?.type && ( 
        x.type === 'MarkupObject' || x.type === 'MarkupAttrObject' 
      ))) && Array.isArray(x?.nodes);
    const NextFunc          = () => `f${FuncCounter++}` + (Math.random()*10).toString(36).replace('.', '_');

  // logging
    //globalThis.onerror = (...v) => (console.log(v, v[0]+EMPTY, v[4] && v[4].message, v[4] && v[4].stack), true);

  // type functions
    const isKey             = v => !!v && (typeof v.key === 'string' || typeof v.key === 'number') && Object.getOwnPropertyNames(v).length <= 2;

  // state
    let FuncCounter = 10;

  // cache 
    const cache = {};
    let _CONFIG;
    // deux

  // main exports 
    Object.assign(s,{attrskip,skip,attrmarkup,markup,guardEmptyHandlers,die});
    Object.assign(globalThis, {vanillaview: {c, s}}); 

    export async function s(p,...v) {
      const that = this;
      let SystemCall = false;
      let state, _host;

      if ( p[0].length === 0 && v[0].state ) {
        // by convention (see how we construct the template that we tag with FUNC)
        // the first value is the state object when our system calls it
        SystemCall = true;
      }

      const {key} = v.find(isKey) || {};

      if ( SystemCall ) {
        ({state,_host} = v.shift());
        p.shift();
        v = await Promise.all(v.map(val => process(that, val, state, _host)));
        const xyz = vanillaview(p,v, {_host});
        //xyz[Symbol.for('BANG-VV')] = true;
        DEBUG && console.log({state}, self.__state = state);
        return xyz;
      } else {
        const laterFunc = async (state, _host) => {
          DEBUG && console.log({state}, self.__state = state);
          v = await Promise.all(v.map(val => process(that, val, state, _host)));
          const xyz = vanillaview(p,v, {_host});
          //xyz[Symbol.for('BANG-VV')] = true;
          return xyz;
        };
        laterFunc[IMMEDIATE] = true;
        //laterFunc[Symbol.for('BANG-VV')] = true;
        return laterFunc;
      }
    }

    export function c(p,...v) {
      //console.error(`Using c (X) function. Not recommended`);
      return vanillaview(p,v, {useCache:false});
    }

  // main function (TODO: should we refactor?)
    function vanillaview(p,v,{useCache:useCache=true, _host}={}) {
      const retVal = {};
      let instance, cacheKey;

      v = v.map(guardAndTransformVal);

      if ( useCache ) {
        (instance = (v.find(isKey) || {}));
        cacheKey = p.join(JOINER);
        const {cached,firstCall} = isCached(cacheKey,v,instance);
       
        if ( ! firstCall ) {
          cached.update(v);
          return cached;
        } else {
          retVal.oldVals = Array.from(v);
        }
      } else {
        retVal.oldVals = Array.from(v);
      }
      
      // compile the template into an updater

      p = [...p]; 
      const vmap = {};
      const V = v.map(replaceValWithKeyAndOmitInstanceKey(vmap));
      const externals = [];
      let str = EMPTY;

      while( p.length > 1 ) str += p.shift() + V.shift();
      str += p.shift();

      const frag = toDOM(str);
      // FIXME: do we need to walk through shadows here?
      const walker = document.createTreeWalker(frag, NodeFilter.SHOW_ALL);

      do {
        makeUpdaters({walker,vmap,externals});
      } while(walker.nextNode())

      Object.assign(retVal, {
        externals,
        v:Object.values(vmap),
        cacheKey,
        instance,
        to,
        update,
        code:CODE,
        nodes:Array.from(frag.childNodes)
      });

      if ( useCache ) {
        if ( instance.key !== undefined ) {
          cache[cacheKey].instances[instance.key] = retVal;
        } else {
          cache[cacheKey] = retVal;
        }
        retVal.nodes.forEach(node => {
          const instanceKey = instance.key+EMPTY;
          REMOVE_MAP.set(node, {ck:cacheKey, ik: instanceKey});
          _host.destructors.add(() => {
            DEBUG && console.log(`Destructor running for ${_host.name} to remove vv cache keys`, {cacheKey, instanceKey});
            if ( cacheKey && instanceKey && instanceKey !== "undefined" ) {
              if ( cache[cacheKey] ) {
                cache[cacheKey].instances[instanceKey] = null;
              }
            } else if ( cacheKey ) {
              cache[cacheKey] = null;
            }
          });
        });
      }

      return retVal;
    }

  // bang integration functions (modified from bang versions)
    async function process(that, x, state, _host) {
      if ( typeof x === 'string' ) return x;
      else 

      if ( typeof x === 'number' ) return x+EMPTY;
      else

      if ( typeof x === 'boolean' ) return x+EMPTY;
      else

      if ( x instanceof Date ) return x+EMPTY;
      else

      if ( isUnset(x) ) {
        if ( CONFIG.allowUnset ) return CONFIG.unsetPlaceholder || EMPTY;
        else {
          throw new TypeError(`Value cannot be unset, was: ${x}`);
        }
      }
      else

      if ( x instanceof Promise ) return await process(that, await x.catch(err => err+EMPTY), state, _host);
      else

      if ( x instanceof Element ) return x.outerHTML;
      else

      if ( x instanceof Node ) return x.textContent;
      else 

      if ( isVV(x) ) {
        return {code:CODE, externals: x.externals, nodes: x.nodes};
      }

      const isArray     = Array.isArray(x);
      const isVVArray   = isArray && (x.length === 0 || isVV(x[0]));

      if ( isIterable(x) ) {
        if ( isVVArray ) {
          return join(x);
        // is a func array ?
        } else if ( (x[0] instanceof Function) && ! x[0][IMMEDIATE] ) {
          const character = funcCharacter(...x);
          if ( _host.names.has(character) ) {
            const {func: existingFunc, name: existingName} = _host.names.get(character);
            if ( existingName ) {
              DEBUG && console.log(`Name exists!`, x, existingName);
              DEBUG && console.log(`Adding ${existingName} adder`, existingFunc);
              _host.funcs.add(component => (component[existingName] = component[existingName] || existingFunc, existingName));
              return existingName;
            }
          }
          const randomName = NextFunc();
          DEBUG && console.log({definedFunction: randomName, source: 1});

          const func = (
            function(ev) {
              for( const fun of x ) {
                try {
                  fun(ev);
                } catch(e) {
                  console.warn(`Handler in func array failed`, {fun, e, ev, x});
                }
              }
            }
          );

          _host.names.set(character, {name:randomName, func});
          DEBUG && console.log(`Adding ${randomName} adder`, func, _host);
          _host.funcs.add(component => (component[randomName] = func, randomName));
          DEBUG && console.log('name', randomName, func);
          return `${randomName}(event)`;
        } else if ( x[0] instanceof Element || x[0] instanceof Node ) {
          return {code:CODE, externals: [], nodes: x};
        } else {
          // if an Array or iterable is given then
          // its values are recursively processed via this same function
          return process(that, await Promise.all(
            (
              await Promise.all(Array.from(x)).catch(e => e+EMPTY)
            ).map(v => process(that, v, state, _host))
          ), state, _host);
        }
      }

      const isVVK = isKey(x);
      const isMAO = x.code === CODE && typeof x.str === "string";
      if ( isVVK || isMAO || isVV(x) ) {
        return x; // let vanillaview guardAndTransformVal handle
      }

      else 

      if ( x[IMMEDIATE] && Object.getPrototypeOf(x).constructor.name === 'AsyncFunction' ) {
        return await process(that, await x(state, _host), state, _host);
      }
      else

      if ( x[IMMEDIATE] && (x instanceof Function) ) return x(state, _host);
      else // it's an object, of some type 

      if ( x instanceof Function ) {
        const character = funcCharacter(x);
        if ( _host.names.has(character) ) {
          const {func: existingFunc, name: existingName} = _host.names.get(character);
          if ( existingName ) {
            DEBUG && console.log(`Name exists!`, x, existingName);
            DEBUG && console.log(`Adding ${existingName} adder`, existingFunc);
            _host.funcs.add(component => (component[existingName] = component[existingName] || existingFunc, existingName));
            return existingName;
          }
        }
        const name = NextFunc();
        _host.names.set(character, {name, func:x});
        DEBUG && console.log(`Adding ${name} adder`, x, _host);
        _host.funcs.add(component => (component[name] = x, name)); 
        DEBUG && console.log({definedFunction:name, source: 2});
        DEBUG && console.log('name', name, x);
        return `${name}(event)`;
      }

      else
      {
        // State store     
          /* so we assume an object is state and save it */
          /* to the global state store */
          /* which is two-sides so we can find a key */
          /* given an object. This avoid duplicates */
        let stateKey;

        // own keys
          // an object can specify it's own state key
          // to provide a single logical identity for a piece of state that may
          // be represented by many objects

        if ( Object.prototype.hasOwnProperty.call(x, CONFIG.bangKey) ) {
          stateKey = new that.StateKey(x[CONFIG.bangKey])+EMPTY;
          // in that case, replace the previously saved object with the same logical identity
          const oldX = that.STATE.get(stateKey);
          that.STATE.delete(oldX);

          that.STATE.set(stateKey, x);
          that.STATE.set(x, stateKey);
        } 

        else  /* or the system can come up with a state key */

        {
          const jsx = JS(x)
          if ( that.STATE.has(x) || that.STATE.has(jsx) ) {
            stateKey = (that.STATE.get(x) || that.STATE.get(jsx)).replace(/.json.last$/,'');
            const lastXJSON = that.STATE.get(stateKey+'.json.last');
            if ( jsx !== lastXJSON ) {
              that.STATE.delete(lastXJSON); 
              if ( stateKey.startsWith('system-key') ) {
                that.STATE.delete(stateKey);
                const oKey = stateKey;
                stateKey = new that.StateKey()+EMPTY;
              }
              that.STATE.set(stateKey, x);
              that.STATE.set(x, stateKey);
            }
          } else {
            const oKey = stateKey;
            stateKey = new that.StateKey()+EMPTY;
            //console.log({oKey, stateKey, block2:true, jsx});
            that.STATE.set(stateKey, x);
            that.STATE.set(x, stateKey);
            /*
              _host.funcs.add(component => {
                let aq = Dependents.get(stateKey);
                if ( ! aq ) {
                  aq = new Set();
                  Dependents.set(stateKey, aq);
                }
                aq.add(component);
              });
            */
          }
          that.STATE.set(jsx, stateKey+'.json.last');
          that.STATE.set(stateKey+'.json.last', jsx);
        }

        stateKey += EMPTY;
        return stateKey;
      }
    }

    function funcCharacter(...x) {
      return `${x.map(f => f.toString()).join(';')}`; 
    }

    function isIterable(y) {
      if ( y === null ) return false;
      return y[Symbol.iterator] instanceof Function;
    }

    function isUnset(x) {
      return x === undefined || x === null;
    }

  // to function
    function to(location, options) {
      const position = (options || 'replace').toLocaleLowerCase();
      const frag = document.createDocumentFragment();
      this.nodes.forEach(n => frag.appendChild(n));
      const isNode = location instanceof Node;
      const elem = isNode ? location : document.querySelector(location);
      try {
        MOVE[position](frag,elem);
      } catch(e) {
        DEBUG && console.warn(e);
        switch(e.constructor && e.constructor.name) {
          case "DOMException":      die({error: INSERT()},e);             break;
          case "TypeError":         die({error: NOTFOUND(location)},e);   break; 
          default:                  throw e;
        }
      }
      while(this.externals.length) {
        this.externals.shift()();
      }
    }

  // update functions
    function makeUpdaters({walker,vmap,externals}) {
      const node = walker.currentNode;
      if ( node.shadowRoot instanceof ShadowRoot ) {
        throw new TypeError(`Shadow not supported here currently`);
      }
      switch( node.nodeType ) {
        case Node.ELEMENT_NODE:
          handleElement({node,vmap,externals}); break;
        case Node.COMMENT_NODE:
        case Node.TEXT_NODE:
          handleNode({node,vmap,externals}); break;
      }
    }

  // debug stuff
    const Replacers = new Map();
    if ( DEBUG ) {
      window.Replacers = Replacers;
    }
  // end debug stuff

    function handleNode({node,vmap,externals}) {
      const lengths = [];
      const text = node.nodeValue; 
      let result = KEYMATCH.exec(text);
      while ( result ) {
        const {index} = result;
        const key = result[1];
        const val = vmap[key];
        const replacer = makeNodeUpdater({node,index,lengths,val});
        const wrappedReplacer = () => {
          DEBUG && console.group(`Replacer calling for ${key}`);
          try {
            replacer(val.val);
          } catch(error) {
            console.warn(`Error in replacer for key ${key}`, {val, error});
          }
          DEBUG && console.log(`Replacer called for ${key}`);
          Replacers.delete(key);
          DEBUG && console.groupEnd();
        };
        externals.push(wrappedReplacer);
        Replacers.set(key, wrappedReplacer);
        val.replacers.push( replacer );
        result = KEYMATCH.exec(text);
      }
    }

    // node functions
      function makeNodeUpdater(nodeState) {
        const {node} = nodeState;
        const scope = Object.assign({}, nodeState, {
          oldVal: {length: KEYLEN},
          oldNodes: [node],
          lastAnchor: node,
        });
        return (newVal) => {
          if ( scope.oldVal == newVal ) return;
          scope.val.val = newVal;
          switch(getType(newVal)) {
            case "vanillaviewobject":
              handleMarkupInNode(newVal, scope); break;
            default:
              handleTextInNode(newVal, scope); break;
          }
        };
      }

      function handleMarkupInNode(newVal, state) {
        let {oldNodes,lastAnchor} = state;
        if ( newVal.nodes.length ) {
          if ( sameOrder(oldNodes,newVal.nodes) ) {
            // do nothing
          } else {
            // perf
              // list updates could be possible more efficient
              // this is if we are inserting new nodes
              // but I can't imagine a way to do it that's not:
              // 1) quadratic (edit distance)
              // 2) lots of heuristics (did we insert a new node or nodes at the front? OK...etc...)
            const LEGACY = false;
            if ( LEGACY ) {
              Array.from(newVal.nodes).reverse().forEach(n => {
                lastAnchor.parentNode.insertBefore(n,lastAnchor.nextSibling);
                state.lastAnchor = lastAnchor.nextSibling;
              });
              state.lastAnchor = newVal.nodes[0];
            } else {
              const insertable = [];
              Array.from(newVal.nodes).forEach(node => {
                const inserted = document.contains(node.ownerDocument);
                if ( ! inserted ) {
                  insertable.push(node);
                } else {
                  while( insertable.length ) {
                    const insertee = insertable.shift();
                    node.parentNode.insertBefore(insertee, node);
                  }
                }
              });
              while ( insertable.length ) {
                const insertee = insertable.shift();
                lastAnchor.parentNode.insertBefore(insertee,lastAnchor);
              }
              state.lastAnchor = newVal.nodes[newVal.nodes.length-1];
            }
          }
        } else {
          const placeholderNode = summonPlaceholder(lastAnchor);
          lastAnchor.parentNode.insertBefore(placeholderNode,lastAnchor.nextSibling);
          state.lastAnchor = placeholderNode;
        }
        // MARK: Unbond event might be relevant here.
        // if nodes are not included we can just remove them
        const dn = diffNodes(oldNodes,newVal.nodes);
        if ( dn.size ) {
          const f = document.createDocumentFragment();
          const killSet = new Set();
          dn.forEach(n => {
            f.appendChild(n);
            if ( n.linkedCustomElement ) {
              f.appendChild(n.linkedCustomElement);
            }
            if ( n.nodeType === Node.COMMENT_NODE && n.textContent.match(/key\d+/) ) return;
            const kill = REMOVE_MAP.get(n);
            if ( kill ) {
              killSet.add(JS(kill));
              // NOTE:
              // this next line is essential
                // it checks which other VV fragments are descendents of the node being removed. And for each of those
                // it adds the cache Keys of that fragment to the kill set, so their caches will also be killed
                // this essential line prevents the re-rendering of cached components that are meant to be on-screen into 
                // off-screen detached fragments, which occurs if we don't kill these caches, because their caches
                // would indicate they need to be re-rendered at their insertion point, instad of re-created anew
              const deps = [...REMOVE_MAP.entries()].forEach(([vvNode, k]) => n.contains(vvNode) && killSet.add(JS(k)));
            } else {
              DEBUG && console.warn(`No kill signature for`, n, REMOVE_MAP);
            }
          });
          killSet.forEach(kill => {
            const {ck: cacheKey, ik: instanceKey} = JSON.parse(kill);
            try {
              if ( cacheKey && instanceKey && instanceKey !== "undefined" ) {
                if ( cache[cacheKey] ) {
                  cache[cacheKey].instances[instanceKey] = null;
                }
              } else if ( cacheKey ) {
                cache[cacheKey] = null;
              }
            } catch(e) {
              console.warn(`Error in kill for`, {kill, cacheKey, instanceKey});
            }
          });
        }
        state.oldNodes = newVal.nodes || [lastAnchor];
        while ( newVal.externals.length ) {
          const func = newVal.externals.shift();
          func();
        } 
      }

      function sameOrder(nodesA, nodesB) {
        if ( nodesA.length != nodesB.length ) return false;

        return Array.from(nodesA).every((an,i) => an == nodesB[i]);
      }

      function handleTextInNode(newVal, state) {
        let {oldVal, index, val, lengths, node} = state;

        const valIndex = val.vi;
        const originalLengthBefore = Object.keys(lengths.slice(0,valIndex)).length*KEYLEN;
        const lengthBefore = lengths.slice(0,valIndex).reduce((sum,x) => sum + x, 0);
        const value = node.nodeValue;

        lengths[valIndex] = newVal.length;

        const correction = lengthBefore-originalLengthBefore;
        const before = value.slice(0,index+correction);
        const after = value.slice(index+correction+oldVal.length);

        const newValue = before + newVal + after;

        node.nodeValue = newValue;

        if ( node.linkedCustomElement && newValue !== oldVal ) {
          updateLinkedCustomElement(node);
        }

        state.oldVal = newVal;
      }

    // element attribute functions
      function updateLinkedCustomElement(node) {
        const lce = node.linkedCustomElement;
        const span = toDOM(`<span ${node.textContent}></span>`).firstChild;
        //FIXME: may have to look at this for the combination of vv and bang, may not need to remove these
        const toRemove = new Set(
          getAttributes(lce)
            .filter(({name}) => !name.startsWith('on'))
            .map(({name}) => name)
        );
        getAttributes(span).forEach(({name, value}) => {
          if ( name === lce.localName ) return; // i.e., it's the bang tag name
          if ( name.startsWith('on') ) return; // we don't handle event handlers here, that's in bang
          lce.setAttribute(name, value);
          toRemove.delete(name);
        });
        toRemove.forEach(name => lce.removeAttribute(name));
      }

      function handleElement({node,vmap,externals}) {
        getAttributes(node).forEach(({name,value} = {}) => {
          const attrState = {node, vmap, externals, name, lengths: []};

          KEYMATCH.lastIndex = 0;
          let result = KEYMATCH.exec(name);
          while( result ) {
            prepareAttributeUpdater(result, attrState, {updateName:true});
            result = KEYMATCH.exec(name);
          }

          KEYMATCH.lastIndex = 0;
          result = KEYMATCH.exec(value);
          while( result ) {
            prepareAttributeUpdater(result, attrState, {updateName:false});
            result = KEYMATCH.exec(value);
          }
        });
      }

      function prepareAttributeUpdater(result, attrState, {updateName}) {
        const {index, input} = result;
        const scope = Object.assign({}, attrState, {
          index, input, updateName, 
          val: attrState.vmap[result[1]],
          oldVal: {length: KEYLEN},
          oldName: attrState.name,
        });

        let replacer;
        if ( updateName ) {
          replacer = makeAttributeNameUpdater(scope);
        } else {
          replacer = makeAttributeValueUpdater(scope);
        }

        scope.externals.push(() => replacer(scope.val.val));
        scope.val.replacers.push( replacer );
      }

      // FIXME: needs to support multiple replacements just like value
      // QUESTION: why is the variable oldName so required here, why can't we call it oldVal?
      // if we do it breaks, WHY?
      function makeAttributeNameUpdater(scope) {
        let {oldName,node,val} = scope;
        return (newVal) => {
          if ( oldName == newVal ) return;
          val.val = newVal;
          const attr = node.hasAttribute(oldName) ? oldName : EMPTY
          if ( attr !== newVal ) {
            if ( attr ) {
              node.removeAttribute(oldName);
              node[oldName] = undefined;
            }
            if ( newVal ) {
              newVal = newVal.trim();

              let name = newVal, value = undefined;

              if( ATTRMATCH.test(newVal) ) {
                const assignmentIndex = newVal.indexOf('='); 
                ([name,value] = [newVal.slice(0,assignmentIndex), newVal.slice(assignmentIndex+1)]);
              }

              reliablySetAttribute(node, name, value);
            }
            oldName = newVal;
          }
        };
      }

      function makeAttributeValueUpdater(scope) {
        const updater = (newVal) => {
          if ( scope.oldVal == newVal ) return;
          scope.val.val = newVal;
          switch(getType(newVal)) {
            case "funcarray":       updateAttrWithFuncarrayValue(newVal, scope); break;
            case "function":        updateAttrWithFunctionValue(newVal, scope); break;
            case "handlers":        updateAttrWithHandlersValue(newVal, scope); break;
            case "vanillaviewobject": 
              newVal = nodesToStr(newVal.nodes); 
              updateAttrWithTextValue(newVal, scope); break;
            /* eslint-disable no-fallthrough */
            case "markupattrobject":  // deliberate fall through
              newVal = newVal.str;
            default:                
              updateAttrWithTextValue(newVal, scope); break;
            /* eslint-enable no-fallthrough */
          }
        };
        // call it the first time so it loads well
        // and we elide out the key placeholders here
        updater(scope.val.val);
        return updater;
      }

  // helpers
    function Replacer(key, value) {
      const obj = this;
      if ( typeof obj[key] === "function" ) {
        return value.toString();
      } else if ( value instanceof Node ) {
        return `${value.nodeName}//${value.nodeValue || value.outerHTML || value.textContent}`;
      } else return value;
    }

    function getAttributes(node) {
      if ( ! node.hasAttribute ) return [];

      // for parity with classList.add (which trims whitespace)
        // otherwise once the classList manipulation happens
        // our indexes for replacement will be off
      if ( node.hasAttribute('class') ) {
        node.setAttribute('class', formatClassListValue(node.getAttribute('class')));
      }
      return Array.from(node.attributes);
      /*
      if ( !! node.attributes && Number.isInteger(node.attributes.length) ) return Array.from(node.attributes);
      const attrs = [];
      for ( const name of node ) {
        if ( node.hasAttribute(name) ) {
          attrs.push({name, value:node.getAttribute(name)});
        }
      }
      return attrs;
      */
    }

    function updateAttrWithFunctionValue(newVal, scope) {
      let {oldVal,node,name,externals} = scope;
      if ( name !== 'bond' ) {
        let flags = {};
        if ( name.includes(':') ) {
          ([name, ...flags] = name.split(':'));
          flags = flags.reduce((O,f) => {
            O[f] = true;
            return O;
          }, {});
        }
        if ( oldVal ) {
          node.removeEventListener(name, oldVal, flags);
        }
        node.addEventListener(name, newVal, flags); 
        reliablySetAttribute(node, name, EMPTY);
      } else {
        if ( oldVal ) {
          const index = externals.indexOf(oldVal);
          if ( index >= 0 ) {
            externals.splice(index,1);
          }
        }
        externals.push(() => newVal(node)); 
      }
      scope.oldVal = newVal;
    }

    function updateAttrWithFuncarrayValue(newVal, scope) {
      let {oldVal,node,name,externals} = scope;
      if ( oldVal && ! Array.isArray(oldVal) ) {
        oldVal = [oldVal]; 
      }
      if ( name !== 'bond' ) {
        let flags = {};
        if ( name.includes(':') ) {
          ([name, ...flags] = name.split(':'));
          flags = flags.reduce((O,f) => {
            O[f] = true;
            return O;
          }, {});
        }
        if ( oldVal ) {
          oldVal.forEach(of => node.removeEventListener(name, of, flags));
        }
        newVal.forEach(f => node.addEventListener(name, f, flags));
      } else {
        if ( oldVal ) {
          oldVal.forEach(of => {
            const index = externals.indexOf(of);
            if ( index >= 0 ) {
              externals.splice(index,1);
            }
          });
        }
        newVal.forEach(f => externals.push(() => f(node)));
      }
      scope.oldVal = newVal;
    }

    function updateAttrWithHandlersValue(newVal, scope) {
      let {oldVal,node,externals,} = scope;
      if ( !!oldVal && typeof oldVal === 'object'  ) {
        Object.entries(oldVal).forEach(([eventName,funcVal]) => {
          if ( eventName !== 'bond' ) {
            let flags = {};
            if ( eventName.includes(':') ) {
              ([eventName, ...flags] = eventName.split(':'));
              flags = flags.reduce((O,f) => {
                O[f] = true;
                return O;
              }, {});
            }
            node.removeEventListener(eventName, funcVal, flags); 
          } else {
            const index = externals.indexOf(funcVal);
            if ( index >= 0 ) {
              externals.splice(index,1);
            }
          }
        });
      }
      Object.entries(newVal).forEach(([eventName,funcVal]) => {
        if ( eventName !== 'bond' ) {
          let flags = {};
          if ( eventName.includes(':') ) {
            ([eventName, ...flags] = eventName.split(':'));
            flags = flags.reduce((O,f) => {
              O[f] = true;
              return O;
            }, {});
          }
          node.addEventListener(eventName, funcVal, flags); 
        } else {
          externals.push(() => funcVal(node)); 
        }
      });
      scope.oldVal = newVal;
    }

    function updateAttrWithTextValue(newVal, scope) {
      let {oldVal,node,index,name,val,lengths,oldAttrVal} = scope;

      let attr = node.getAttribute(name);
      let newAttrValue;

      if ( oldAttrVal === oldVal ) {
        // if we are setting old val to be the whole attribute value
        // then we can just splice it in by setting it easily
        newAttrValue = newVal;
      } else {
        // otherwise we need to carefully calculate everything
        let zeroWidthCorrection = 0;
        const valIndex = val.vi;
        const originalLengthBefore = Object.keys(lengths.slice(0,valIndex)).length*KEYLEN;
          
        // we need to trim newVal to have parity with classlist add
          // the reason we have zeroWidthCorrection = -1
          // is because the classList is a set of non-zero width tokens
          // separated by spaces
          // when we have a zero width token, we have two adjacent spaces
          // which, by virtue of our other requirement, gets replaced by a single space
          // effectively elliding out our replacement location
          // in order to keep our replacement location in tact
          // we need to compensate for the loss of a token slot (effectively a token + a space)
          // and having a -1 correction effectively does this.
        if ( name == "class" ) {
          newVal = newVal.trim();
          if ( newVal.length == 0 ) {
            zeroWidthCorrection = -1;
          }
          scope.val.val = newVal;
        }
        lengths[valIndex] = newVal.length + zeroWidthCorrection;
        const lengthBefore = lengths.slice(0,valIndex).reduce((sum,x) => sum + x, 0);

        const correction = lengthBefore-originalLengthBefore;
        const before = attr.slice(0,index+correction);
        const after = attr.slice(index+correction+oldVal.length);
        
        if ( name == "class" ) {
          const spacer = oldVal.length == 0 ? ' ' : EMPTY;
          newAttrValue = before + spacer + newVal + spacer + after;
        } else {
          newAttrValue = before + newVal + after;
        }
      }

      if ( attr !== newAttrValue ) {
        reliablySetAttribute(node, name, newAttrValue);
      }

      scope.oldVal = newVal;
      scope.oldAttrVal = newAttrValue;
    }

    function reliablySetAttribute(node, name, value, /*{funcValue} = {}*/) {
      if (  name == "class" ) {
        value = formatClassListValue(value);
      }

      const oName = name;
      let modifiers;

      if ( modifiers ) {
        modifiers = Object.fromEntries(modifiers.map(m => ([m, true])));
        DEBUG && console.warn("not handling modifiers currently", {node, name, value, modifiers});
        //node.addEventListener(name, funcValue, modifiers);
      }

      if ( CONFIG.EVENTS.includes('on'+name) ) {
        name = 'on'+name;

        const existingValue = node.getAttribute(name);
        if ( node.getRootNode().host ) {
          //console.log(node, [...node.getRootNode().host.paths.keys()]);
          if ( node.getRootNode().host.paths.has(existingValue) ) {
            DEBUG && console.log('Not running replacement again for', {node, name, oName, value, existingValue});
            return;
          }
        } else {
          DEBUG && console.warn(`No host exists yet`);
          if ( existingValue?.startsWith('this.') ) {
            DEBUG && console.log('Not running replacement again for', {node, name, oName, value, existingValue});
            return;
          }
        }
      }

      try {
        node.setAttribute(name,isUnset(value) ? name : value);
      } catch(e) {
        console.warn(`error`, e, {node, name, value});
      }
      // if you set style like this is fucks it up
      if ( name in node && name !== 'style' ) {
        try {
          node[name] = isUnset(value) ? true : value;
        } catch(e) {
        }
      }
    }

    function getType(val) {
      const to = typeof val;
      const type = to === 'function' ? 'function' :
        val.code === CODE && Array.isArray(val.nodes) ? 'vanillaviewobject' : 
        val.code === CODE && typeof val.str === 'string' ? 'markupattrobject' :
        Array.isArray(val) && (val.length === 0 || (
          val[0].code === CODE && Array.isArray(val[0].nodes) 
        )) ? 'vanillaviewarray' : 
        Array.isArray(val) && (val.length === 0 || (
          typeof val[0] === 'function'
        )) ? 'funcarray' : 
        to === 'object' ? 'handlers' : 
        'default'
      ;
      return type;
    }

    function summonPlaceholder(sibling) {
      let ph = [...sibling.parentNode.childNodes].find(
        node => node.isConnected && 
          node.nodeType == Node.COMMENT_NODE && 
          node.nodeValue == 'vanillaview_placeholder' 
        );
      if ( ! ph ) {
        ph = toDOM(`<!--vanillaview_placeholder-->`).firstChild;
      }
      return ph;
    }

    // cache helpers
      // FIXME: function needs refactor
      function isCached(cacheKey,v,instance) {
        let firstCall;
        let cached = cache[cacheKey];
        if ( cached == undefined ) {
          cached = cache[cacheKey] = {};
          if ( instance.key !== undefined ) {
            cached.instances = {};
            cached = cached.instances[instance.key] = {};
          }
          firstCall = true;
        } else {
          if ( instance.key !== undefined ) {
            if ( ! cached.instances ) {
              cached.instances = {};
              firstCall = true;
            } else {
              cached = cached.instances[instance.key];
              if ( ! cached ) {
                firstCall = true;
              } else {
                if ( instance.kill === true ) {
                  cached = cache[cacheKey]; 
                  if ( cached && cached.instances ) {
                    cached.instances[instance.key] = null;
                  }
                  cached = null;
                  firstCall = true;
                } else {
                  firstCall = false;
                }
              }
            }
          } else {
            firstCall = false;
          }
        }
        //console.log({cached,firstCall,instance});
        return {cached,firstCall};
      }

    // Markup helpers
      // Returns an object that VanillaView treats as markup,
      // even tho it is NOT a VanillaView Object (defined with R/X/$)
      // And even tho it is in the location of a template value replacement
      // Which would normally be the treated as String
      function markup(str) {
        str = isUnset(str) ? EMPTY : str; 
        const frag = toDOM(str);
        const retVal = {
          type: 'MarkupObject',
          code:CODE,
          nodes:Array.from(frag.childNodes),
          externals: []
        };
        return retVal;
      }

      // Returns an object that VanillaView treats, again, as markup
      // But this time markup that is OKAY to have within a quoted attribute
      function attrmarkup(str) {
        str = isUnset(str) ? EMPTY : str; 
        str = str.replace(/"/g,'&quot;');
        const retVal = {
          type: 'MarkupAttrObject',
          code: CODE,
          str
        };
        return retVal;
      }

      function guardEmptyHandlers(val) {
        if ( Array.isArray(val) ) {
          if ( val.length == 0 ) {
            return [NULLFUNC]
          } 
          return val;
        } else {
          if ( isUnset(val) ) {
            return NULLFUNC;
          }
        }
      }

    // other helpers
      function formatClassListValue(value) {
        value = value.trim();
        value = value.replace(/\s+/g, ' ');
        return value;
      }

      function replaceValWithKeyAndOmitInstanceKey(vmap) {
        return (val,vi) => {
          // omit instance key
          if ( isKey(val) ) {
            return EMPTY;
          }
          const key = 'key'+Math.random().toFixed(15);
          let k = key;
          if ( val.code === CODE && Array.isArray(val.nodes) ) {
            k = `<!--${k}-->`;
          }
          vmap[key] = {vi,val,replacers:[]};
          return k;
        };
      }

      function toDOM(str) {
        DIV.replaceChildren();
        DIV.insertAdjacentHTML(POS, `<template>${str}</template>`);
        return DIV.firstElementChild.content;
      }

      function guardAndTransformVal(v) {
        const isVVArray   = Array.isArray(v) && (v.length === 0 || isVV(v[0]));
        const isNotSet         = isUnset(v);
        const isForgery = v.code !== CODE && Array.isArray(v.nodes);
        const isObject        = typeof v === 'object';

        if ( isVVArray )      return join(v); 
        if ( isKey(v) )           return v;
        if ( v.code === CODE )    return v;

        if ( isNotSet )            die({error: UNSET()});
        if ( isForgery )          die({error: XSS()});

        if ( Array.isArray(v) && v[0] instanceof Node ) {
          return {code:CODE, nodes: v, externals: []};
        }

        if ( Array.isArray(v) && v[0] instanceof Function ) {
          return v;
        }

        if ( isObject ) die({error: OBJ(v)});

        return v+EMPTY;
      }

      function join(os) {
        const externals = [];
        const bigNodes = [];
        const v = [];
        const oldVals = [];
        for( const o of os ) {
          //v.push(...o.v); 
          //oldVals.push(...o.oldVals);
          externals.push(...o.externals);
          bigNodes.push(...o.nodes);
        }
        const retVal = {v,code:CODE,oldVals,nodes:bigNodes,to,update,externals};
        return retVal;
      }

      function nodesToStr(nodes) {
        const frag = document.createDocumentFragment();
        nodes.forEach(n => frag.appendChild(n.cloneNode(true)));
        const container = document.createElement('body');
        container.appendChild(frag);
        return container.innerHTML;
      }

      function diffNodes(last,next) {
        last = new Set(last);
        next = new Set(next);
        return new Set([...last].filter(n => !next.has(n)));
      }

      function update(newVals) {
        const updateable = this.v.filter(({vi}) => didChange(newVals[vi], this.oldVals[vi]));
        updateable.forEach(({vi,replacers}) => replacers.forEach(f => f(newVals[vi])));
        this.oldVals = Array.from(newVals);
      }

      function didChange(oldVal, newVal) {
        const [oldType, newType] = [oldVal, newVal].map(getType); 
        let ret;
        if ( oldType != newType ) {
          ret =  true;
        } else {
          switch(oldType) {
            case "vanillaviewobject":
              // the vanillaview object is returned by a view function
              // which has already called its updaters and checked its slot values
              // to determine and show changes
              // except in the case of a list of nodes
              ret = true;
              break;
            /* eslint-disable no-fallthrough */
            case "funcarray":
            case "function":
              // hard to equate even if same str value as scope could be diff
              ret = true;
              break;
            case "vanillaviewarray":
              // need to do array dif so don't do here
              ret = true;
              break;
            case "markupattrobject":
              // need to check multiple things
              ret = true;
              break;
            default:
              ret = JS(oldVal) !== JS(newVal);
              break;
            /* eslint-enable no-fallthrough */
          }
        }

        return ret;
      }

  // reporting and error helpers 
    function die(msg,err) {
      msg.stack = ((DEBUG && err) || new Error()).stack.split(/\s*\n\s*/g);
      throw msg;
    }
