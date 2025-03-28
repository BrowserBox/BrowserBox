#!/usr/bin/env node

'use strict';
// Keep this file in sync with lighthouse
// TODO: have LH depend on this one.

/**
 * @fileoverview Script to launch a clean Chrome instance on-demand.
 *
 * Assuming Lighthouse is installed globally or `npm link`ed, use via:
 *     chrome-debug
 * Optionally enable extensions or pass a port, additional chrome flags, and/or a URL
 *     chrome-debug --port=9222
 *     chrome-debug http://goat.com
 *     chrome-debug --show-paint-rects
 *     chrome-debug --enable-extensions
 */

require('./compiled-check.js')('./dist/chrome-launcher.js');
const {Launcher, launch} = require('./dist/chrome-launcher');

const args = process.argv.slice(2);
const chromeFlags = [];
let startingUrl;
let port;
let ignoreDefaultFlags;

if (args.length) {
  const providedFlags = args.filter(flag => flag.startsWith('--'));

  const portFlag = providedFlags.find(flag => flag.startsWith('--port='));
  if (portFlag) port = parseInt(portFlag.replace('--port=', ''), 10);

  const enableExtensions = !!providedFlags.find(flag => flag === '--enable-extensions');
  // The basic pattern for enabling Chrome extensions
  if (enableExtensions) {
    ignoreDefaultFlags = true;
    chromeFlags.push(...Launcher.defaultFlags().filter(flag => flag !== '--disable-extensions'));
  }

  chromeFlags.push(...providedFlags);
  startingUrl = args.find(flag => !flag.startsWith('--'));
}

launch({
  startingUrl,
  port,
  ignoreDefaultFlags,
  chromeFlags,
})
// eslint-disable-next-line no-console
.then(v => console.log(`✨  Chrome debugging port: ${v.port}`));
