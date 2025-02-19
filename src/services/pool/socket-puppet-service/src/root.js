import path from 'path';
import url from 'url';

let root;
let File;
let esm = false;

try {
  console.log(__dirname, __filename);
} catch(e) {
  esm = true;
}

if ( ! esm ) {
  root = require('./root.cjs').APP_ROOT;
  File = require('./root.cjs').file;
} else {
  File = url.fileURLToPath(import.meta.url);
  root = path.dirname(File);
}

console.log({root, File});

export const APP_ROOT = root;
export const dir = APP_ROOT;
export const file = File;

