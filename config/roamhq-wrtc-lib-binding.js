'use strict';

const os = require('os');
const Path = require('path');
const paths_to_try = [
  Path.resolve(os.homedir(), 'build', 'Release', 'wrtc.node'),
  '../build/wrtc.node',
  '../build/Debug/wrtc.node',
  '../build/Release/wrtc.node',
  `./node_modules/@roamhq/wrtc-${os.platform()}-${os.arch()}`,
  `./node_modules/@roamhq/wrtc-${os.platform()}-${os.arch()}/wrtc.node`,
];

let succeeded = false;
for (let path of paths_to_try) {
  path = Path.resolve(path);
  console.log('Trying path', path);
  try {
    module.exports = require(path);
    succeeded = true;
    break;
  } catch (error) {
    console.warn(error);
    ;
  }
}

if (!succeeded) {
  throw new Error(`Could not find wrtc binary on any of the paths: ${paths_to_try}`);
}
