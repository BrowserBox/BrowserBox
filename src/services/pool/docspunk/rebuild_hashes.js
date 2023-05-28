#!/usr/bin/env node

const hasha = require('hasha');
const fs = require('fs');
const path = require('path');

const HASH_FILE = path.join(__dirname, 'pdfs', 'hashes.json');
const FILES = path.join(__dirname, 'pdfs');
const VIEW_PAGE = /^file.*$/;

buildHashes();

async function buildHashes() {
  const latestHashes = new Map();

  const dir = await fs.promises.readdir(FILES);

  for( const file of dir ) {
    if ( ! file.match(VIEW_PAGE) ) continue;

    const filepath = path.join(FILES,file);
    const stat = await fs.promises.stat(filepath);
    if ( stat.isFile() ) {
      const hash = await hasha.fromFile(filepath);
      const viewUrl = `https://secureview.dosyago.com/uploads/${file}.html`;
      latestHashes.set(hash,viewUrl);
    }
  }

  await fs.promises.writeFile(HASH_FILE, JSON.stringify([...latestHashes.entries()]));
}

