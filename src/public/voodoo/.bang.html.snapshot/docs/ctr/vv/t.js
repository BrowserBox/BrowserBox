
  export const BROWSER_SIDE      = (() => {try{ return self.DOMParser && true; } catch(e) { return false; }})();

  const BuiltIns = [
    Symbol, Boolean, Number, String, Object, Set, Map, WeakMap, WeakSet,
    Uint8Array, Uint16Array, Uint32Array, Float32Array, Float64Array,
    Int8Array, Int16Array, Int32Array, 
    Uint8ClampedArray, 
    ...(BROWSER_SIDE ? [
      Node,NodeList,Element,HTMLElement, Blob, ArrayBuffer,
      FileList, Text, HTMLDocument, Document, DocumentFragment,
      Error, File, Event, EventTarget, URL
    /* eslint-disable no-undef */
    ] : [ Buffer ])
    /* eslint-enable no-undef */
  ]

  const DEBUG = false;
  const SEALED_DEFAULT = true;
  const isNone = instance => instance == null || instance == undefined;

  const typeCache = new Map();

  T.def = def;
  T.check = check;
  T.sub = sub;
  T.verify = verify;
  T.validate = validate;
  T.partialMatch = partialMatch;
  T.defEnum = defEnum;
  T.defSub = defSub;
  T.defTuple = defTuple;
  T.defCollection = defCollection;
  T.defOr = defOr;
  T.option = option;
  T.defOption = defOption;
  T.maybe = maybe;
  T.guard = guard;
  T.errors = errors;

  // debug
  if ( DEBUG ) {
    self.T = T;
    self.typeCache = typeCache;
  }

  T[Symbol.for('jtype-system.typeCache')] = typeCache;

  defineSpecials();
  mapBuiltins();

  export function T(parts, ...vals) {
    const cooked = vals.reduce((prev,cur,i) => prev+cur+parts[i+1], parts[0]);
    const typeName = cooked;
    if ( !typeCache.has(typeName) ) throw new TypeError(`Cannot use type ${typeName} before it is defined.`);
    return typeCache.get(typeName).type;
  }

  function partialMatch(type, instance) {
    return validate(type, instance, {partial:true});
  }

  function validate(type, instance, {partial: partial = false} = {}) {
    guardType(type);
    guardExists(type);
    const typeName = type.name;

    const {spec,specKeyPaths,kind,help,verify,verifiers,sealed} = typeCache.get(typeName);

    const specKeyPathSet = new Set(specKeyPaths);

    const bigErrors = [];

    switch(kind) {
      case "def": {
        let allValid = true;
        if ( spec ) {
          const keyPaths = partial ? allKeyPaths(instance, specKeyPathSet) : specKeyPaths;
          allValid = !isNone(instance) && keyPaths.every(kp => {
            // Allow lookup errors if the type match for the key path can include None

            const {resolved, errors:lookupErrors} = lookup(instance,kp,() => checkTypeMatch(lookup(spec,kp).resolved, T`None`));
            bigErrors.push(...lookupErrors);

            if ( lookupErrors.length ) return false;

            const keyType = lookup(spec,kp).resolved;
            if ( !keyType || !(keyType instanceof Type) ) {
              bigErrors.push({
                error: `Key path '${kp}' is not present in the spec for type '${typeName}'`
              });
              return false;
            }

            const {valid, errors: validationErrors} = validate(keyType, resolved);
            bigErrors.push(...validationErrors);

            return valid;
          });
        }
        let verified = true;
        if ( partial && ! spec && !!verify ) {
          throw new TypeError(`Type checking with option 'partial' is not a valid option for types that` + 
            ` only use a verify function but have no spec`);
        } else if ( verify ) {
          try {
            verified = verify(instance);
            if ( ! verified ) {
              if ( verifiers ) {
                throw {
                  error:`Type ${typeName} value '${JSON.stringify(instance)}' violated at least 1 verify function in:\n${
                    verifiers.map(f => '\t'+(f.help||'') + ' ('+f.verify.toString()+')').join('\n')
                  }`
                };
              } else if ( type.isSumType ) {
                throw {
                  error: `Value '${JSON.stringify(instance)}' did not match any of: ${[...type.types.keys()].map(t => t.name)}`,
                  verify, verifiers
                }
              } else {
                let helpMsg = '';
                if ( help ) {
                  helpMsg = `Help: ${help}. `;
                }
                throw {error:`${helpMsg}Type ${typeName} Value '${JSON.stringify(instance)}' violated verify function in: ${verify.toString()}`};
              }
            }
          } catch(e) {
            bigErrors.push(e);
            verified = false;
          }
        }
        let sealValid = true;
        if ( !!sealed && !! spec ) {
          const type_key_paths = specKeyPaths;
          const all_key_paths = allKeyPaths(instance, specKeyPathSet).sort();
          sealValid  = all_key_paths.join(',') == type_key_paths.join(',');
          if ( ! sealValid ) {
            if ( all_key_paths.length < type_key_paths.length ) {
              sealValid = true;
            } else {
              const errorKeys = [];
              const tkp = new Set(type_key_paths); 
              for( const k of all_key_paths ) {
                if ( ! tkp.has(k) ) {
                  errorKeys.push({
                    error: `Key path '${k}' is not in the spec for type ${typeName}`
                  });
                }
              }
              if ( errorKeys.length ) {
                bigErrors.push(...errorKeys);
              }
            }
          }
        }
        return {valid: allValid && verified && sealValid, errors: bigErrors, partial}
      } case "defCollection": {
        const {valid:containerValid, errors:containerErrors} = validate(spec.container, instance);
        let membersValid = true;
        let verified = true;

        bigErrors.push(...containerErrors);
        if ( partial ) {
          throw new TypeError(`Type checking with option 'partial' is not a valid option for Collection types`);
        } else {
          if ( containerValid ) {
             membersValid= [...instance].every(member => {
              const {valid, errors} = validate(spec.member, member);
              bigErrors.push(...errors);
              return valid;
            });
          }
          if ( verify ) {
            try {
              verified = verify(instance);
            } catch(e) {
              bigErrors.push(e);
              verified = false;
            }
          }
        }
          
        return {valid:containerValid && membersValid && verified, errors:bigErrors};
      } default: {
        throw new TypeError(`Checking for type kind ${kind} is not yet implemented.`);
      }
    }
  }

  function check(...args) {
    return validate(...args).valid;
  }

  function lookup(obj, keyPath, canBeNone) {
    if ( isNone(obj) ) throw new TypeError(`Lookup requires a non-unset object.`);

    if ( !keyPath ) throw new TypeError(`keyPath must not be empty`);


    const keys = keyPath.split(/\./g);
    const pathComplete = [];
    const errors = [];

    let resolved = obj;

    while(keys.length) {
      const nextKey = keys.shift();
      resolved = resolved[nextKey];
      pathComplete.push(nextKey);
      if ( (resolved === null || resolved === undefined) ) {
        if ( keys.length ) {
          errors.push({
            error: 
              `Lookup on key path '${keyPath}' failed at '` + 
              pathComplete.join('.') +
              `' when ${resolved} was found at '${nextKey}'.` 
          });
        } else if ( !!canBeNone && canBeNone() ) {
          resolved = undefined;
        } else {
          errors.push({
            error: 
              `Resolution on key path '${keyPath}' failed` + 
              `when ${resolved} was found at '${nextKey}' and the Type of this` +
              `key's value cannot be None.`
          });
        }
        break;
      }
    }
    return {resolved,errors};
  }

  function checkTypeMatch(typeA, typeB) {
    guardType(typeA);
    guardExists(typeA);
    guardType(typeB);
    guardExists(typeB);

    if ( typeA === typeB ) {
      return true;
    } else if ( typeA.isSumType && typeA.types.has(typeB) ) {
      return true;
    } else if ( typeB.isSumType && typeB.types.has(typeA) ) {
      return true;
    } else if ( typeA.name.startsWith('?') && typeB == T`None` ) {
      return true;
    } else if ( typeB.name.startsWith('?') && typeA == T`None` ) {
      return true;
    }

    if ( typeA.name.startsWith('>') || typeB.name.startsWith('>') ) {
      console.error(new Error(`Check type match has not been implemented for derived//sub types yet.`));
    }

    return false;
  }

  function option(type) {
    return T`?${type.name}`;
  }

  function sub(type) {
    return T`>${type.name}`;
  }

  function defSub(type, spec, {verify: verify = undefined, help:help = ''} = {}, name = '') {
    guardType(type);
    guardExists(type);

    let verifiers;

    if ( ! verify ) {
      verify = () => true;
    } 

    if ( type.native ) {
      verifiers = [ {help,verify} ];
      verify = i => i instanceof type.native;
      const helpMsg = `Needs to be of type ${type.native.name}. ${help||''}`;
      verifiers.push({help:helpMsg,verify});
    }

    const newType = def(`${name}>${type.name}`, spec, {verify,help, verifiers});
    return newType;
  }

  function defEnum(name, ...values) {
    if ( !name ) throw new TypeError(`Type must be named.`); 
    guardRedefinition(name);
    
    const valueSet = new Set(values);
    const verify = i => valueSet.has(i);
    const help = `Value of Enum type ${name} must be one of ${values.join(',')}`;

    return def(name, null, {verify,help});
  }

  function exists(name) {
    return typeCache.has(name);
  }

  function guardRedefinition(name) {
    if ( exists(name) ) throw new TypeError(`Type ${name} cannot be redefined.`);
  }

  function allKeyPaths(o, specKeyPaths) {
    const isTypeSpec = ! specKeyPaths;
    const keyPaths = new Set();
    return recurseObject(o, keyPaths, '');

    function recurseObject(o, keyPathSet, lastLevel = '') {
      if ( isUnset(o) ) return [];
      const levelKeys = Object.getOwnPropertyNames(o); 
      const keyPaths = levelKeys
        .map(k => lastLevel + (lastLevel.length ? '.' : '') + k)
      levelKeys.forEach((k,i) => {
        const v = o[k];
        if ( isTypeSpec ) {
          if ( v instanceof Type ) {
            keyPathSet.add(keyPaths[i]);
          } else if ( typeof v == "object" ) {
            if ( ! Array.isArray(v) ) {
              recurseObject(v, keyPathSet, keyPaths[i]);
            } else {
              DEBUG && console.warn({o,v,keyPathSet, lastLevel});
              throw new TypeError(`We don't support Types that use Arrays as structure, just yet.`); 
            }
          } else {
            throw new TypeError(`Spec cannot contain leaf values that are not valid Types`);
          }
        } else {
          if ( specKeyPaths.has(keyPaths[i]) ) {
            keyPathSet.add(keyPaths[i]); 
          } else if ( typeof v == "object" ) {
            if ( k === '_self' ) {
              //recurseObject({}, keyPathSet, keyPaths[i]);
            } else if ( ! Array.isArray(v) ) {
              recurseObject(v, keyPathSet, keyPaths[i]);
            } else {
              v.forEach((item,index) => recurseObject(item, keyPathSet, keyPaths[i] + '.' + index));
              //throw new TypeError(`We don't support Instances that use Arrays as structure, just yet.`); 
            }
          } else {
            //console.warn("Spec has no such key",  keyPaths[i]);
            keyPathSet.add(keyPaths[i]);
          }
        }
      });
      return [...keyPathSet];
    }
  }

  function defOption(type) {
    guardType(type);
    const typeName = type.name;
    return T.def(`?${typeName}`, null, {verify: i => isUnset(i) || T.check(type,i)});
  }

  function maybe(type) {
    try {
      return defOption(type);
    } catch(e) {
      // console.log(`Option Type ${type.name} already declared.`, e);
    }
    return T`?${type.name}`;
  }

  function verify(...args) { return check(...args); }

  function defCollection(name, {container, member}, {sealed: sealed = SEALED_DEFAULT, verify: verify = undefined} = {}) {
    if ( !name ) throw new TypeError(`Type must be named.`); 
    if ( !container || !member ) throw new TypeError(`Type must be specified.`);
    guardRedefinition(name);

    const kind = 'defCollection';
    const t = new Type(name);
    const Spec = {container, member};
    const specKeyPaths = allKeyPaths(Spec).sort();
    const spec = {kind, spec: Spec, verify, sealed, type: t};
    spec.specKeyPaths = specKeyPaths;
    typeCache.set(name, spec);
    return t;
  }

  function defTuple(name, {pattern}) {
    if ( !name ) throw new TypeError(`Type must be named.`); 
    if ( !pattern ) throw new TypeError(`Type must be specified.`);
    const kind = 'def';
    const specObj = {};
    pattern.forEach((type,key) => specObj[key] = type);
    const t = new Type(name);
    const spec = {kind, spec: specObj, type:t};
    const specKeyPaths = allKeyPaths(specObj).sort();
    spec.specKeyPaths = specKeyPaths;
    typeCache.set(name, spec);
    return t;
  }

  function Type(name, mods = {}) {
    if ( ! new.target ) throw new TypeError(`Type with new only.`);
    Object.defineProperty(this,'name', {get: () => name});
    this.typeName = name;

    if ( mods.types ) {
      const {types} = mods;
      const typeSet = new Set(types);
      Object.defineProperty(this,'isSumType', {get: () => true});
      Object.defineProperty(this,'types', {get: () => typeSet});
    }

    if ( mods.native ) {
      const {native} = mods;
      Object.defineProperty(this,'native', {get: () => native});
    }
  }

  Type.prototype.toString = function () {
    return `${this.typeName} Type`;
  };

  function def(name, spec, {help:help = '', verify:verify = undefined, sealed:sealed = undefined, types:types = undefined, verifiers:verifiers = undefined, native:native = undefined} = {}) {
    if ( !name ) throw new TypeError(`Type must be named.`); 
    guardRedefinition(name);

    if ( name.startsWith('?') ) {
      if ( spec ) {
        throw new TypeError(`Option type can not have a spec.`);
      } 

      if ( ! verify(null) ) {
        throw new TypeError(`Option type must be OK to be unset.`);
      }
    }

    const kind = 'def';
    if ( sealed === undefined ) {
      sealed = true;
    }
    const t = new Type(name, {types, native});
    const cache = {spec,kind,help,verify,verifiers,sealed,types,native,type:t};
    const specKeyPaths = allKeyPaths(spec).sort();
    cache.specKeyPaths = specKeyPaths;
    typeCache.set(name, cache);
    return t;
  }

  function defOr(name, ...types) {
    return T.def(name, null, {types, verify: i => types.some(t => check(t,i))});
  }

  function guard(type, instance) {
    guardType(type);
    guardExists(type);
    const {valid, errors} = validate(type, instance);
    if ( ! valid ) throw new TypeError(`Type ${type} requested, but item is not of that type: ${errors.join(', ')}`);
  }

  function guardType(t) {
    //console.log(t);
    if ( !(t instanceof Type) ) throw new TypeError(`Type must be a valid Type object.`);
  }

  function guardExists(t) {
    const name = originalName(t);
    if ( ! exists(name) ) throw new TypeError(`Type must exist. Type ${name} has not been defined.`);
  }

  function errors(...args) {
    return validate(...args).errors;
  }

  function mapBuiltins() {
    BuiltIns.forEach(t => def(originalName(t), null, {native: t, verify: i => originalName(i.constructor) === originalName(t)}));  
    BuiltIns.forEach(t => defSub(T`${originalName(t)}`));  
  }

  function defineSpecials() {
    T.def(`Any`, null, {verify: () => true});
    T.def(`Some`, null, {verify: i => !isUnset(i)});
    T.def(`None`, null, {verify: i => isUnset(i)});
    T.def(`Function`, null, {verify: i => i instanceof Function});
    T.def(`Integer`, null, {verify: i => Number.isInteger(i)});
    T.def(`Array`, null, {verify: i => Array.isArray(i)});
    T.def(`Iterable`, null, {verify: i => i[Symbol.iterator] instanceof Function});
  }

  function isUnset(i) {
    return i === null || i === undefined;
  }

  function originalName(t) {
    if (!!t && t.name) {
      return t.name;
    } 
    const oName = Object.prototype.toString.call(t).replace(/\[object |\]/g, '');
    if ( oName.endsWith('Constructor') ) {
      return oName.replace(/Constructor$/,'');
    }
    return oName;
  }

