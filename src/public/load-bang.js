import {DEBUG} from './voodoo/src/common.js';

// load ui framework
bangLoaded().then(() => {
  DEBUG.val && console.log('bang loaded: last module script');
});
