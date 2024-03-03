#!/usr/bin/env node

  import fs from 'fs';
  import os from 'os';
  import { execSync } from 'child_process';
  import path from 'path';
  import {rainbowHash} from '@dosyago/rainsum';

  const BBPRO_CONF = path.resolve(os.homedir(), '.config', 'dosyago', 'bbpro');
  const CHAI_STATE_PATH = path.resolve(BBPRO_CONF, 'chai')
  const FILES = path.join(CHAI_STATE_PATH, 'pdfs');
  const HASH_FILE = path.join(FILES, 'hashes.json');
  const LINK_FILE = path.join(FILES, 'links.json');
  const VIEW_PAGE = /^file.*$/;

  buildHashes();

  async function buildHashes() {
    const latestHashes = new Map();

    const dir = await fs.promises.readdir(FILES);
    let GO_SECURE = true;
    try {
      fs.readFileSync(path.resolve(os.homedir(), 'sslcerts', 'privkey.pem'));
      fs.readFileSync(path.resolve(os.homedir(), 'sslcerts', 'fullchain.pem'));
    } catch(e) {
      try {
        fs.readFileSync(path.resolve('/usr', 'local', 'share', 'dosyago', 'sslcerts', 'privkey.pem'));
        fs.readFileSync(path.resolve('/usr', 'local', 'share', 'dosyago', 'sslcerts', 'fullchain.pem'));
      } catch(e) {
        GO_SECURE = false;
      }
    }
    const scheme = GO_SECURE ? 'https' : 'http';
    let APP_ROOT = '.';
    try { 
      const commonStuff = await import('../../../../common.js');
      ({APP_ROOT} = commonStuff);
    } catch(e) {
      const commonStuff = await import('../../src/common.js');
      ({APP_ROOT} = commonStuff);
    }
    const host_or_address = execSync(path.resolve(APP_ROOT, '..', 'chai', 'scripts', 'get_hostname.sh')).toString('utf8').trim();

    for( const file of dir ) {
      if ( ! file.match(VIEW_PAGE) ) continue;

      const filepath = path.join(FILES,file);
      const stat = await fs.promises.stat(filepath);
      if ( stat.isFile() ) {
        const hash = await rainbowHash(128, 0, fs.readFileSync(filepath));
        const viewUrl = `${scheme}://${host_or_address}:${process.env.DOCS_PORT}/uploads/${file}.html`;
        latestHashes.set(hash,viewUrl);
      }
    }

    await fs.promises.writeFile(HASH_FILE, JSON.stringify([...latestHashes.entries()]));
  }

