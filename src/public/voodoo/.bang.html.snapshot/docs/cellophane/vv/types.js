// types
  import {T} from './t.js';
  import {CODE} from './common.js';

  // T

    export default T;

  // Both SSR and Browser

    T.defOr('KeyValue', T`String`, T`Number`);

    export const TKey = T.def('Key', {
      key: T`KeyValue`,
      kill: T.defOption(T`Boolean`)
    });

    export const THandlers = T.def('Handlers', null, {verify: i => {
      const validObject = T.check(T`Object`, i);

      if ( ! validObject ) return false;

      const eventNames = Object.keys(i);
      const handlerFuncs = Object.values(i);
      const validNames = eventNames.every(name => T.check(T`String`, name));
      const validFuncs = handlerFuncs.every(func => T.check(T`Function`, func));
      const valid = validNames && validFuncs;

      return valid;
    }});

    export const TFuncArray = T.defCollection('FuncArray', {
      container: T`Array`,
      member: T`Function`
    });

    export const TEmptyArray = T.def('EmptyArray', null, {verify: i => Array.isArray(i) && i.length == 0});

    export const TMarkupObject = T.def('MarkupObject', {
      type: T`String`,
      code: T`String`,
      nodes: T`Array`,
      externals: T`Array`,
    }, {verify: v => v.type == 'MarkupObject' && v.code == CODE});

    export const TMarkupAttrObject = T.def('MarkupAttrObject', {
      type: T`String`,
      code: T`String`,
      str: T`String`
    }, {verify: v => v.type == 'MarkupAttrObject' && v.code == CODE});

  // Browser side

    export const TVanillaViewLikeObject = T.def('VanillaViewLikeObject', {
      instance: T.maybe(T`Key`),
      cacheKey: T.maybe(T`String`),
      code: T`String`,
      externals: T`Array`,
      nodes: T`Array`,
      to: T`Function`,
      update: T`Function`,
      v: T`Array`,
      oldVals: T`Array`
    });

    export const TVanillaViewObject = T.def('VanillaViewObject', {
      instance: T.maybe(T`Key`),
      cacheKey: T.maybe(T`String`),
      code: T`String`,
      externals: T`Array`,
      nodes: T`Array`,
      to: T`Function`,
      update: T`Function`,
      v: T`Array`,
      oldVals: T`Array`
    }, {verify: v => verify(v)});

    export const TBangObject = T.def('BangObject', null, {
      verify: v => v[Symbol.for('BANG-VV')]
    });

    export const TComponent = T.defOr('Component', T`VanillaViewObject`, T`BangObject`)

    export const TVanillaViewArray = T.defCollection('VanillaViewArray', {
      container: T`Array`,
      member: T`Component`,
    });

  // SSR

    export const TSVanillaViewObject = T.def('SVanillaViewObject', {
      str: T`String`,
      handlers: THandlers
    });

    export const TSVanillaViewArray = T.defCollection('SVanillaViewArray', {
      container: T`Array`,
      member: T`SVanillaViewObject`
    });

  // export

  export const BS = {TKey,THandlers,TFuncArray,TVanillaViewObject,TVanillaViewLikeObject,TVanillaViewArray};

  export const SSR = {TKey,THandlers,TFuncArray,TSVanillaViewObject,TSVanillaViewArray};

  export const Types = {BS,SSR};


  // verify function 
    function verify(v) {
      return CODE === v.code;
    }

