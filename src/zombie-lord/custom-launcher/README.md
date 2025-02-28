# Chrome Launcher [![Linux Build Status](https://img.shields.io/travis/GoogleChrome/chrome-launcher/master.svg)](https://travis-ci.org/GoogleChrome/chrome-launcher) [![Windows Build Status](https://img.shields.io/appveyor/ci/paulirish/chrome-launcher/master.svg)](https://ci.appveyor.com/project/paulirish/chrome-launcher/branch/master) [![NPM chrome-launcher package](https://img.shields.io/npm/v/chrome-launcher.svg)](https://npmjs.org/package/chrome-launcher)


<img src="https://user-images.githubusercontent.com/39191/29847271-a7ba82f8-8ccf-11e7-8d54-eb88fdf0b6d0.png" align=right height=200>

Launch Google Chrome with ease from node.

* [Disables many Chrome services](https://github.com/GoogleChrome/chrome-launcher/blob/master/src/flags.ts) that add noise to automated scenarios
* Opens up the browser's `remote-debugging-port` on an available port
* Automagically locates a Chrome binary to launch
* Uses a fresh Chrome profile for each launch, and cleans itself up on `kill()`
* Binds `Ctrl-C` (by default) to terminate the Chrome process
* Exposes a small set of [options](#api) for configurability over these details

Once launched, interacting with the browser must be done over the [devtools protocol](https://chromedevtools.github.io/devtools-protocol/), typically via [chrome-remote-interface](https://github.com/cyrus-and/chrome-remote-interface/). For many cases [Puppeteer](https://github.com/GoogleChrome/puppeteer) is recommended, though it has its own chrome launching mechanism.

### Installing

```sh
yarn add chrome-launcher

# or with npm:
npm install chrome-launcher
```


## API

### `.launch([opts])`

#### Launch options

```js
{
  // (optional) remote debugging port number to use. If provided port is already busy, launch() will reject
  // Default: an available port is autoselected
  port: number;

  // (optional) Additional flags to pass to Chrome, for example: ['--headless', '--disable-gpu']
  // See: https://github.com/GoogleChrome/chrome-launcher/blob/master/docs/chrome-flags-for-tools.md
  // Do note, many flags are set by default: https://github.com/GoogleChrome/chrome-launcher/blob/master/src/flags.ts
  chromeFlags: Array<string>;

  // (optional) Close the Chrome process on `Ctrl-C`
  // Default: true
  handleSIGINT: boolean;

  // (optional) Explicit path of intended Chrome binary
  // * If this `chromePath` option is defined, it will be used.
  // * Otherwise, the `CHROME_PATH` env variable will be used if set. (`LIGHTHOUSE_CHROMIUM_PATH` is deprecated)
  // * Otherwise, a detected Chrome Canary will be used if found
  // * Otherwise, a detected Chrome (stable) will be used
  chromePath: string;

  // (optional) Chrome profile path to use, if set to `false` then the default profile will be used.
  // By default, a fresh Chrome profile will be created
  userDataDir: string | boolean;

  // (optional) Starting URL to open the browser with
  // Default: `about:blank`
  startingUrl: string;

  // (optional) Logging level
  // Default: 'silent'
  logLevel: 'verbose'|'info'|'error'|'silent';

  // (optional) Flags specific in [flags.ts](src/flags.ts) will not be included.
  // Typically used with the defaultFlags() method and chromeFlags option.
  // Default: false
  ignoreDefaultFlags: boolean;

  // (optional) Interval in ms, which defines how often launcher checks browser port to be ready.
  // Default: 500
  connectionPollInterval: number;

  // (optional) A number of retries, before browser launch considered unsuccessful.
  // Default: 50
  maxConnectionRetries: number;

  // (optional) A dict of environmental key value pairs to pass to the spawned chrome process.
  envVars: {[key: string]: string};
};
```

#### Launched chrome interface

#### `.launch().then(chrome => ...`

```js
// The remote debugging port exposed by the launched chrome
chrome.port: number;

// Method to kill Chrome (and cleanup the profile folder)
chrome.kill: () => Promise<{}>;

// The process id
chrome.pid: number;

// The childProcess object for the launched Chrome
chrome.process: childProcess
```

### `ChromeLauncher.defaultFlags()`

Returns an `Array<string>` of the default [flags](docs/chrome-flags-for-tools.md) Chrome is launched with. Typically used along with the `ignoreDefaultFlags` and `chromeFlags` options.

Note: This array will exclude the following flags: `--remote-debugging-port` `--disable-setuid-sandbox` `--user-data-dir`.

### `ChromeLauncher.getInstallations()`

Returns an `Array<string>` of paths to available Chrome installations. When `chromePath` is not provided to `.launch()`, the first installation returned from this method is used instead.

Note: This method performs synchronous I/O operations.

## Examples

#### Launching chrome:

```js
const ChromeLauncher = require('chrome-launcher');

ChromeLauncher.launch({
  startingUrl: 'https://google.com'
}).then(chrome => {
  console.log(`Chrome debugging port running on ${chrome.port}`);
});
```


#### Launching headless chrome:

```js
const ChromeLauncher = require('chrome-launcher');

ChromeLauncher.launch({
  startingUrl: 'https://google.com',
  chromeFlags: ['--headless', '--disable-gpu']
}).then(chrome => {
  console.log(`Chrome debugging port running on ${chrome.port}`);
});
```

#### Launching with support for extensions and audio:

```js
const ChromeLauncher = require('chrome-launcher');

const newFlags = ChromeLauncher.defaultFlags().filter(flag => flag !== '--disable-extensions' && flag !== '--mute-audio');

ChromeLauncher.launch({
  ignoreDefaultFlags: true,
  chromeFlags: newFlags,
}).then(chrome => { ... });
```

### Continuous Integration

In a CI environment like Travis, Chrome may not be installed. If you want to use `chrome-launcher`, Travis can [install Chrome at run time with an addon](https://docs.travis-ci.com/user/chrome).  Alternatively, you can also install Chrome using the [`download-chrome.sh`](https://raw.githubusercontent.com/GoogleChrome/chrome-launcher/v0.8.0/scripts/download-chrome.sh) script.

Then in `.travis.yml`, use it like so:

```yaml
language: node_js
install:
  - yarn install
before_script:
  - export DISPLAY=:99.0
  - export CHROME_PATH="$(pwd)/chrome-linux/chrome"
  - sh -e /etc/init.d/xvfb start
  - sleep 3 # wait for xvfb to boot

addons:
  chrome: stable
```
