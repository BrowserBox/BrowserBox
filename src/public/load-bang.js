import {DEBUG} from './voodoo/src/common.js';

bangLoaded().then(() => {
  DEBUG.val && console.log('bang loaded: last module script');
});
