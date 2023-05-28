// Why can I just use "git submodule foreach 'npm i && npm rebuild'" ????
"use strict";
const fs = require('fs');
const cp = require('child_process');
const path = require('path');
const {promisify} = require('util');

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
//const access = promisify(fs.access);
const exec = promisify(cp.exec);

const delay = ms => new Promise(res => setTimeout(res, ms));

perform();

async function perform() {
  const thisDir = path.join(APP_ROOT); 
  await exec('npm i; npm rebuild;');
  await exec('npm set progress=false');
  //await exec('npm i -g pnpm');
  await recurser( thisDir );
  await delay(1000);
}

async function recurser( dir ) {
  console.log("installed in ", dir);
  await delay(500);
  const files = await readdir( dir ); 
  for( const f of files ) {
    try {
      const isDir = (await stat(path.join(dir, f))).isDirectory();
      if ( isDir ) {
        const isSubmodule = await stat(path.join(dir,f,'package.json'));
        if ( isDir && isSubmodule ) {
          await exec(`cd ${path.join(dir,f)}; npm i; npm rebuild;`);
        }
        await recurser( path.join(dir,f) );
      }
    } catch(e) {/*console.warn(e)*/}
  }
}
