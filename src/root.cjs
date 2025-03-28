const path = require('path');
const url = require('url');

const file = __filename;
const dir = path.dirname(file);
const APP_ROOT = dir;

module.exports = {
  APP_ROOT,
  dir,
  file
}

