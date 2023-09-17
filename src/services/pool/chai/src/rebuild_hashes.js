#!/usr/bin/env node

  const hasha = require('hasha');
  const fs = require('fs');
  const os = require('os');
  const {execSync} = require('child_process');
  const path = require('path');

  const CHAI_STATE_PATH = path.resolve(os.homedir(), '.config', 'dosyago', 'bbpro')
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
      GO_SECURE = false;
    }
    const scheme = GO_SECURE ? 'https' : 'http';
    const host_or_address = execSync(path.resolve(__dirname, '..', 'scripts', 'get_hostname.sh')).toString('utf8').trim();

    for( const file of dir ) {
      if ( ! file.match(VIEW_PAGE) ) continue;

      const filepath = path.join(FILES,file);
      const stat = await fs.promises.stat(filepath);
      if ( stat.isFile() ) {
        const hash = await hasha.fromFile(filepath);
        const viewUrl = `${scheme}://${host_or_address}/uploads/${file}.html`;
        latestHashes.set(hash,viewUrl);
      }
    }

    await fs.promises.writeFile(HASH_FILE, JSON.stringify([...latestHashes.entries()]));
  }

