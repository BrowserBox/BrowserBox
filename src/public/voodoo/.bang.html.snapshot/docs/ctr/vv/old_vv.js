// vanillaview.js
  // imports
    import {CODE} from './common.js';
    import T from './types.js';

  // backwards compatible alias
    const skip = markup;
    const attrskip = attrmarkup;

  // constants
    const DEBUG             = false;
    const NULLFUNC          = () => void 0;
    /* eslint-disable no-useless-escape */
    const KEYMATCH          = /(?:<!\-\-)?(key\d+)(?:\-\->)?/gm;
    /* eslint-enable no-useless-escape */
    const ATTRMATCH         = /\w+=/;
    const KEYLEN            = 20;
    const XSS               = () => `Possible XSS / object forgery attack detected. ` +
                              `Object code could not be verified.`;
    const OBJ               = () => `Object values not allowed here.`;
    const KEY               = v => `'key' property must be a string. Was: ${v.key}`;
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
      innerhtml   (frag,elem) { elem.innerHTML = ''; elem.appendChild(frag) }
      insert      (frag,node) { node.replaceChildren(frag) }
    };

  // logging
    globalThis.onerror = (...v) => (console.log(v, v[0]+'', v[4] && v[4].message, v[4] && v[4].stack), true);

  // type functions
    const isKey             = v => T.check(T`Key`, v); 
    const isHandlers        = v => T.check(T`Handlers`, v);

  // cache 
    const cache = {};
    // deux

  // main exports 
    Object.assign(s,{say,attrskip,skip,attrmarkup,markup,guardEmptyHandlers,die});

    Object.assign(globalThis, {vanillaview: {c, s, T}}); 

    export async function s(p,...v) {
      const that = this;
      let SystemCall = false;
      let state;

      if ( p[0].length === 0 && v[0].state ) {
        // by convention (see how we construct the template that we tag with FUNC)
        // the first value is the state object when our system calls it
        SystemCall = true;
      }

      if ( SystemCall ) {
        ({state} = v.shift());
        p.shift();
        DEBUG && say('log','System VV_FUNC call: ' + v.join(', '));
        v = await Promise.all(v.map(val => process(that, val, state)));
        const xyz = vanillaview(p,v);
        //xyz[Symbol.for('BANG-VV')] = true;
        return xyz;
      } else {
        const laterFunc = async state => {
          v = await Promise.all(v.map(val => process(that, val, state)));
          const xyz = vanillaview(p,v);
          //xyz[Symbol.for('BANG-VV')] = true;
          return xyz;
        };
        //laterFunc[Symbol.for('BANG-VV')] = true;
        DEBUG && console.log('async laterFunc', laterFunc);
        return laterFunc;
      }
    }

    export function c(p,...v) {
      return vanillaview(p,v, {useCache:false});
    }

  // main function (TODO: should we refactor?)
    function vanillaview(p,v,{useCache:useCache=true}={}) {
      const retVal = {};
      let instance, cacheKey;

      v = v.map(guardAndTransformVal);

      if ( useCache ) {
        (instance = (v.find(isKey) || {}));
        cacheKey = p.join('<link rel=join>');
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
      let str = '';

      while( p.length > 1 ) str += p.shift() + V.shift();
      str += p.shift();

      const frag = toDOM(str);
      const walker = document.createTreeWalker(frag, NodeFilter.SHOW_ALL);

      do {
        makeUpdaters({walker,vmap,externals});
      } while(walker.nextNode())

      Object.assign(retVal, {
        externals,
        v:Object.values(vmap),
        cacheKey,
        to,
        update,
        code:CODE,
        nodes:[...frag.childNodes]
      });

      if ( useCache ) {
        if ( instance.key !== undefined ) {
          cache[cacheKey].instances[instance.key] = retVal;
        } else {
          cache[cacheKey] = retVal;
        }
      }

      return retVal;
    }

  // bang integration functions (modified from bang versions)
    async function process(that, x, state) {
      if ( typeof x === 'string' ) return x;
      else 

      if ( typeof x === 'number' ) return x+'';
      else

      if ( typeof x === 'boolean' ) return x+'';
      else

      if ( x instanceof Date ) return x+'';
      else

      if ( isUnset(x) ) {
        if ( that.CONFIG.allowUnset ) return that.CONFIG.unsetPlaceholder || '';
        else {
          throw new TypeError(`Value cannot be unset, was: ${x}`);
        }
      }
      else

      if ( x instanceof Promise ) return await process(that, await x.catch(err => err+''), state);
      else

      if ( x instanceof Element ) return x.outerHTML;
      else

      if ( x instanceof Node ) return x.textContent;

      const isVVArray   = T.check(T`VanillaViewArray`, x);

      if ( isIterable(x) && ! isVVArray ) {
        // if an Array or iterable is given then
        // its values are recursively processed via this same function
        return process(that, (await Promise.all(
          (
            await Promise.all(Array.from(x)).catch(e => err+'')
          ).map(v => process(that, v, state))
        )), state);
      }


      const isVVK = isKey(x);
      const isMO    = T.check(T`MarkupObject`, x);
      const isMAO = T.check(T`MarkupAttrObject`, x);
      const isVV      = T.check(T`Component`, x);
      if ( isVVArray || isVVK || isMO || isMAO || isVV ) {
        DEBUG && console.log('vv', x, {isVVArray, isVVK, isMO, isMAO, isVV});
        return isVVArray ? join(x) : x; // let vanillaview guardAndTransformVal handle
      }

      else 

      if ( Object.getPrototypeOf(x).constructor.name === 'AsyncFunction' ) {
        DEBUG && console.log('asyncfunc', x);
        return await process(that, await x(state), state);
      }
      else

      if ( x instanceof Function ) return x(state);
      else // it's an object, of some type 

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

        if ( Object.prototype.hasOwnProperty.call(x, that.CONFIG.bangKey) ) {
          stateKey = new that.StateKey(x[that.CONFIG.bangKey])+'';
          // in that case, replace the previously saved object with the same logical identity
          const oldX = that.STATE.get(stateKey);
          that.STATE.delete(oldX);

          that.STATE.set(stateKey, x);
          that.STATE.set(x, stateKey);
        } 

        else  /* or the system can come up with a state key */

        {
          if ( that.STATE.has(x) ) {
            stateKey = that.STATE.get(x);
            const lastXJSON = that.STATE.get(stateKey+'.json.last');
            if ( JSON.stringify(x) !== lastXJSON ) {
              that.STATE.delete(lastXJSON); 
              if ( stateKey.startsWith('system-key') ) {
                that.STATE.delete(stateKey);
                stateKey = new that.StateKey()+'';
              }
              that.STATE.set(stateKey, x);
              that.STATE.set(x, stateKey);
            }
          } else {
            stateKey = new that.StateKey()+'';
            that.STATE.set(stateKey, x);
            that.STATE.set(x, stateKey);
          }
          that.STATE.set(JSON.stringify(x), stateKey+'.json.last');
          that.STATE.set(stateKey+'.json.last', JSON.stringify(x));
        }

        stateKey += '';
        DEBUG && say('log',{stateKey});
        return stateKey;
      }
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
        DEBUG && console.log({location,options,e,elem,isNode});
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
      switch( node.nodeType ) {
        case Node.ELEMENT_NODE:
          handleElement({node,vmap,externals}); break;
        case Node.COMMENT_NODE:
        case Node.TEXT_NODE:
          handleNode({node,vmap,externals}); break;
      }
    }

    function handleNode({node,vmap,externals}) {
      const lengths = [];
      const text = node.nodeValue; 
      let result = KEYMATCH.exec(text);
      while ( result ) {
        const {index} = result;
        const key = result[1];
        const val = vmap[key];
        const replacer = makeNodeUpdater({node,index,lengths,val});
        externals.push(() => replacer(val.val));
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
            case "markupobject": 
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
              const LISTD = false;
              const insertable = [];
              (DEBUG || LISTD) && console.log('\n');
              Array.from(newVal.nodes).forEach(node => {
                const inserted = document.contains(node.ownerDocument);
                if ( ! inserted ) {
                  (DEBUG || LISTD) && console.dirxml('not yet inserted', node);
                  insertable.push(node);
                } else {
                  (DEBUG || LISTD) && console.dirxml('already inserted', node, `${insertable.length} to insert before`);
                  while( insertable.length ) {
                    const insertee = insertable.shift();
                    node.parentNode.insertBefore(insertee, node);
                  }
                }
              });
              (DEBUG || LISTD) && console.log('\n');
              while ( insertable.length ) {
                const insertee = insertable.shift();
                (DEBUG || LISTD) && console.log({insertee, lastAnchor, oldNodes});
                lastAnchor.parentNode.insertBefore(insertee,lastAnchor);
              }
              (DEBUG || LISTD) && console.log('Inserts done');
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
          dn.forEach(n => {
            f.appendChild(n);
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

        if ( node.linkedCustomElement && newValue.match(/state[\s\S]*=/gm) ) {
          DEBUG && console.log('Updating linked customElement', node, newVal, node.linkedCustomElement);
          node.linkedCustomElement.setAttribute('state', newVal);
        }

        state.oldVal = newVal;
      }

    // element attribute functions
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
          const attr = node.hasAttribute(oldName) ? oldName : ''
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
            case "markupobject":     
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
    function getAttributes(node) {
      if ( ! node.hasAttribute ) return [];

      // for parity with classList.add (which trims whitespace)
        // otherwise once the classList manipulation happens
        // our indexes for replacement will be off
      if ( node.hasAttribute('class') ) {
        node.setAttribute('class', formatClassListValue(node.getAttribute('class')));
      }
      if ( !! node.attributes && Number.isInteger(node.attributes.length) ) return Array.from(node.attributes);
      const attrs = [];
      for ( const name of node ) {
        if ( node.hasAttribute(name) ) {
          attrs.push({name, value:node.getAttribute(name)});
        }
      }
      return attrs;
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
        reliablySetAttribute(node, name, '');
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
      if ( !!oldVal && T.check(T`Handlers`, oldVal) ) {
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
            console.log(eventName, funcVal, flags);
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
      let {oldVal,node,index,name,val,lengths} = scope;
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
      let attr = node.getAttribute(name);

      const lengthBefore = lengths.slice(0,valIndex).reduce((sum,x) => sum + x, 0);

      const correction = lengthBefore-originalLengthBefore;
      const before = attr.slice(0,index+correction);
      const after = attr.slice(index+correction+oldVal.length);

      let newAttrValue;
      
      if ( name == "class" ) {
        const spacer = oldVal.length == 0 ? ' ' : '';
        newAttrValue = before + spacer + newVal + spacer + after;
      } else {
        newAttrValue = before + newVal + after;
      }

      if ( DEBUG && name === 'style' ) {
        console.log('style attribute', {newAttrValue, before, newVal, after});
      }

      DEBUG && console.log(JSON.stringify({
        newVal,
        valIndex,
        lengths,
        attr,
        lengthBefore,
        originalLengthBefore,
        correction,
        before,
        after,
        newAttrValue
      }, null, 2));

      reliablySetAttribute(node, name, newAttrValue);

      scope.oldVal = newVal;
    }

    function reliablySetAttribute(node, name, value ) {
      if (  name == "class" ) {
        value = formatClassListValue(value);
      }

      try {
        node.setAttribute(name,isUnset(value) ? name : value);
      } catch(e) {
        DEBUG && console.warn(e);
      }

      // if you set style like this is fucks it up
      if ( name !== 'style' ) {
        try {
          node[name] = isUnset(value) ? true : value;
        } catch(e) {
          DEBUG && console.warn(e);
        }
      }
    }

    function getType(val) {
      const type = T.check(T`Function`, val) ? 'function' :
        T.check(T`Handlers`, val) ? 'handlers' : 
        T.check(T`VanillaViewObject`, val) ? 'vanillaviewobject' : 
        T.check(T`MarkupObject`, val) ? 'markupobject' :
        T.check(T`MarkupAttrObject`, val) ? 'markupattrobject' :
        T.check(T`VanillaViewArray`, val) ? 'vanillaviewarray' : 
        T.check(T`FuncArray`, val) ? 'funcarray' : 
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
                  // cached = cached[cacheKey]; // ? or cached = null ? 
                  cached = null;
                  cached.instances[instance.key] = null;
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
        console.log({cached,firstCall,instance});
        return {cached,firstCall};
      }

    // Markup helpers
      // Returns an object that VanillaView treats as markup,
      // even tho it is NOT a VanillaView Object (defined with R/X/$)
      // And even tho it is in the location of a template value replacement
      // Which would normally be the treated as String
      function markup(str) {
        str = T.check(T`None`, str) ? '' : str; 
        const frag = toDOM(str);
        const retVal = {
          type: 'MarkupObject',
          code:CODE,
          nodes:[...frag.childNodes],
          externals: []
        };
        return retVal;
      }

      // Returns an object that VanillaView treats, again, as markup
      // But this time markup that is OKAY to have within a quoted attribute
      function attrmarkup(str) {
        str = T.check(T`None`, str) ? '' : str; 
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
          if ( T.check(T`None`, val) ) {
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
          if ( T.check(T`Key`, val) ) {
            return '';
          }
          const key = ('key'+Math.random()).replace('.','').padEnd(KEYLEN,'0').slice(0,KEYLEN);
          let k = key;
          if ( T.check(T`VanillaViewObject`, val) || T.check(T`MarkupObject`, val) ) {
            k = `<!--${k}-->`;
          }
          vmap[key.trim()] = {vi,val,replacers:[]};
          return k;
        };
      }

      function toDOM(str) {
        const templateEl = (new DOMParser).parseFromString(
          `<template>${str}</template>`,"text/html"
        ).head.firstElementChild;
        let f;
        if ( templateEl instanceof HTMLTemplateElement ) { 
          f = templateEl.content;
          f.normalize();
          return f;
        } else {
          throw new TypeError(`Could not find template element after parsing string to DOM:\n=START=\n${str}\n=END=`);
        }
      }

      function guardAndTransformVal(v) {
        const isFunc          = T.check(T`Function`, v);
        const isUnset         = T.check(T`None`, v);
        const isObject        = T.check(T`Object`, v);
        const isVanillaViewArray   = T.check(T`VanillaViewArray`, v);
        const isFuncArray     = T.check(T`FuncArray`, v);
        const isMarkupObject    = T.check(T`MarkupObject`, v);
        const isMarkupAttrObject= T.check(T`MarkupAttrObject`, v);
        const isVanillaView        = T.check(T`VanillaViewObject`, v);
        const isForgery       = T.check(T`VanillaViewLikeObject`, v)  && !isVanillaView; 

        if ( isFunc )             return v;
        if ( isVanillaView )           return v;
        if ( isKey(v) )           return v;
        if ( isHandlers(v) )      return v;
        if ( isVanillaViewArray )      return join(v); 
        if ( isFuncArray )        return v;
        if ( isMarkupObject )     return v;
        if ( isMarkupAttrObject)  return v;

        if ( isUnset )            die({error: UNSET()});
        if ( isForgery )          die({error: XSS()});

        if ( isObject )       {
          if ( Object.keys(v).join(',') === "key" ) {
            die({error: KEY(v)});    
          } else die({error: OBJ()});
        }

        return v+'';
      }

      function join(os) {
        const externals = [];
        const bigNodes = [];
        const v = [];
        const oldVals = [];
        os.forEach(o => {
          //v.push(...o.v); 
          //oldVals.push(...o.oldVals);
          externals.push(...o.externals);
          bigNodes.push(...o.nodes);
        });
        DEBUG && console.log({oldVals,v});
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
        DEBUG && console.log({updateable, oldVals:this.oldVals, newVals});
        updateable.forEach(({vi,replacers}) => replacers.forEach(f => f(newVals[vi])));
        this.oldVals = Array.from(newVals);
      }

      function didChange(oldVal, newVal) {
        DEBUG && console.log({oldVal,newVal});
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
            case "markupobject":
              // need to check multiple things
              ret = true;
              break;
            default:
              ret = JSON.stringify(oldVal) !== JSON.stringify(newVal);
              break;
            /* eslint-enable no-fallthrough */
          }
        }

        DEBUG && console.log({ret});
        return ret;
      }

  // reporting and error helpers 
    function die(msg,err) {
      if (DEBUG && err) console.warn(err);
      msg.stack = ((DEBUG && err) || new Error()).stack.split(/\s*\n\s*/g);
      throw JSON.stringify(msg,null,2);
    }

    function say(msg) {
      if ( DEBUG ) {
        console.log(JSON.stringify(msg,showNodes,2));
        console.info('.');
      }
    }

    function showNodes(k,v) {
      let out = v;
      if ( T.check(T`>Node`, v) ) {
        out = `<${v.nodeName.toLowerCase()} ${
          !v.attributes ? '' : [...v.attributes].map(({name,value}) => `${name}='${value}'`).join(' ')}>${
          v.nodeValue || (v.children && v.children.length <= 1 ? v.innerText : '')}`;
      } else if ( typeof v === "function" ) {
        return `${v.name || 'anon'}() { ... }`
      }
      return out;
    }
