const path = require('path');
const url = require('url');

const file = __filename;
const dir = path.dirname(file);
const APP_ROOT = dir;

console.log({APP_ROOT});

module.exports = {
  APP_ROOT,
  dir,
  file
}

