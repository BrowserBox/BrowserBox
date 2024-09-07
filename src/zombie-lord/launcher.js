import path from 'path';
import {EventEmitter} from 'node:events';
import os from 'os';
import fs from 'fs';
import isDocker from 'is-docker';
import {launch as ChromeLauncher} from './custom-launcher/dist/chrome-launcher.mjs';
import {sleep, DEBUG, CONFIG, untilForever} from '../common.js';
import {COMMON_FORMAT} from './screenShots.js';

//const RESTART_MS = 1000;
const CHROME_PROFILE = 'Default'
const zombies = new Map();
let chromeNumber = 0;
let chrome_started = false;

const deathHandlers = new Map();

const UNUSED_CHROME_FLAGS = [
  '--display:1',
  '--use-gl=egl',
  '--enable-widevine',

  // seems to do nothing
  '--alsa-fixed-output-sample-rate=16000',
  '--audio-output-sample-rate=16000',
];

const FORCE_SOFTWARE_GL_FLAGS = [
  `--swiftshader-webgl`,
  `--swiftshader`,
  `--use-gl=swiftshader`,
];

// (some people's puppeteer, low resource usage flags)
// found i don't need
const PUPPETEER_RESOURCE_SAVING_FLAGS = [
  '--no-experiments',
  '--no-crash-upload',
  '--no-pings',
  '--no-proxy-server',
  '--no-report-upload',
  '--no-vr-runtime',
  //'--no-service-autorun',
  //'--force-launch-browser',
  //'--disable-accelerated-2d-canvas',
  //'--disable-gpu',
  '--window-position=0,0',
  //'--disable-renderer-backgrounding',
  //'--disable-background-networking',
  //'--disable-webgl2',
  //'--disable-webgl',
  //'--disable-3d-apis',
  //'--disable-backgrounding-occluded-windows',
  //'--disable-features=CalculateNativeWinOcclusion',
];

// disabled (some people's puppeteer stability flags)
// found i don't need
const PUPPETEER_STABILITY_FLAGS = [
  '--ignore-certificate-errors',
  //'--enable-features=NetworkService,NetworkServiceInProcess',
  //'--disable-background-timer-throttling',
  '--disable-backgrounding-occluded-windows',
  //'--disable-breakpad',
  '--disable-client-side-phishing-detection',
  '--disable-component-extensions-with-background-pages',
  '--disable-default-apps',
  /*'--disable-dev-shm-usage',*/
  '--disable-extensions',
  '--disable-features=Translate',
  //'--disable-hang-monitor',
  /*'--disable-ipc-flooding-protection',*/
  //'--disable-popup-blocking',
  '--disable-prompt-on-repost',
  //'--disable-renderer-backgrounding',
  '--disable-sync',
  '--no-first-run',
  '--disable-features=InterestFeedContentSuggestions',
  '--enable-automation',
  //'--password-store=basic',
  '--no-default-browser-check',
  // TODO(sadym): remove '--enable-blink-features=IdleDetection'
  // once IdleDetection is turned on by default.
  '--enable-blink-features=IdleDetection',
];

// I don't use these and have only seen them mentioned to reduce crashes
// but way I see it is they cost a lot of actual stability my removing
// chrome's isolation model to some extent
const MISC_STABILITY_RELATED_FLAGS_THAT_REDUCE_SECURITY = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-infobars',
  '--single-process',
  '--no-zygote',
  '--no-first-run',
  '--window-position=0,0',
  '--ignore-certificate-errors',
  '--ignore-certificate-errors-skip-list',
  '--disable-dev-shm-usage',
  '--disable-accelerated-2d-canvas',
  '--disable-gpu',
  '--hide-scrollbars',
  '--disable-notifications',
  '--disable-background-timer-throttling',
  '--disable-backgrounding-occluded-windows',
  '--disable-breakpad',
  '--disable-component-extensions-with-background-pages',
  '--disable-extensions',
  '--disable-features=TranslateUI,BlinkGenPropertyTrees',
  '--disable-ipc-flooding-protection',
  '--disable-renderer-backgrounding',
  '--enable-features=NetworkService,NetworkServiceInProcess',
  '--force-color-profile=srgb',
  '--metrics-recording-only',
];

const launcher_api = {
  async newZombie({port, /*username*/}) {
    const crashDir = path.resolve(CONFIG.baseDir, 'browser-crashes');
    const udd = path.resolve(CONFIG.baseDir, 'browser-cache');
    const upd = path.resolve(udd, CHROME_PROFILE);
    if ( ! fs.existsSync( udd ) ) {
      fs.mkdirSync(udd, {recursive:true});
    }
    if ( chrome_started ) {
      DEBUG.val && console.log(`Ignoring launch request as chrome already started.`);
    }
    const DEFAULT_FLAGS = process.platform == 'xdarwin' ? [
      ... PUPPETEER_STABILITY_FLAGS,
      ... PUPPETEER_RESOURCE_SAVING_FLAGS,
    ] : [
      `--window-size=${COMMON_FORMAT.width},${COMMON_FORMAT.height}`,
      `--crash-dumps-dir=${crashDir}`,
      `--profile-directory="${CHROME_PROFILE}"`,
      '--no-first-run',
      //'--metrics-recording-only',
      '--disable-infobars',
      `--noerrdialogs`,
      ...(
        CONFIG.forceContentDarkMode ? [
          `--force-dark-mode`,
        ] : []
      ),
      /* do not flush cache storage when on a development laptop (as it may flush my regular Chrome profile too!)
        I added this after running local development on my MacBook and seeing my YouTube downloads disappear
        I don't know if they are connected, but they could be, so removing these to be sure :) ;p xxx;p
      */
      /*
      ...(
        process.platform !== "darwin" ? [
          '--profiling-flush=1',
          '--enable-aggressive-domstorage-flushing',
          '--disk-cache-size=2750000000',
        ] : []
      ),
      */

      /**
        webgl and 3d api related (
          e.g. github.com landing page animation,
          image editing, 3d games, etc, etc
        )
      **/
      ...(DEBUG.disableGL && process.platform != "darwin" ? [
        '--disable-webgl2',
        '--disable-webgl',
      ] : []),

      ...(DEBUG.disable3D && process.platform != "darwin" ? [
        '--disable-3d-apis',
      ] : []),

      ...(DEBUG.disabled3D && DEBUG.useGL && process.platform != "darwin" ? [
        '--use-gl=swiftshader',
        '--use-angle=default',
      ] : []),

      ...(DEBUG.ALL_FLAGS ? MISC_STABILITY_RELATED_FLAGS_THAT_REDUCE_SECURITY : []),
    ];
    chromeNumber += 1;
    DEBUG.val && console.log(`Chrome Number: ${chromeNumber}, Executing chrome-launcher`);
    const CHROME_FLAGS = Array.from(DEFAULT_FLAGS);
    if (!process.env.DEBUG_SKATEBOARD) {
      if ( DEBUG.useNewAsgardHeadless && ! isDocker() ) {
        CHROME_FLAGS.push('--headless=new');
      } else {
        CHROME_FLAGS.push('--headless');
      }
    } else {
      CHROME_FLAGS.push('--no-sandbox');
    }
    if ( DEBUG.restoreSessions ) {
      CHROME_FLAGS.push(`--restore-last-session`);
      CHROME_FLAGS.push(`--restart`);
      CHROME_FLAGS.push(`--hide-crash-restore-bubble`);
    }
    if ( DEBUG.preventNewTab ) {
      CHROME_FLAGS.push(`--homepage=about:blank`);
    }
    if ( DEBUG.lowEndDefault ) {
      CHROME_FLAGS.push("--enable-low-end-device-mode");
      CHROME_FLAGS.push("--disable-dev-shm-usage");
    }
    if ( DEBUG.disable3PC ) {
      CHROME_FLAGS.push(`--test-third-party-cookie-phaseout`);
      CHROME_FLAGS.push(`--disable-features=PrivacySandboxSettings4`);
    }
    if ( DEBUG.disableIso && ! isDocker() ) {
      CHROME_FLAGS.push(`--disable-site-isolation-trials`);
    }
    if ( DEBUG.extensionsAssemble ) {
      CHROME_FLAGS.push(`--disable-extensions-except=${DEBUG.extensions.join(',')}`);
      CHROME_FLAGS.push(`--skip-force-online-signin-for-testing`)
    }
    if ( DEBUG.extensionsNew ) {
      CHROME_FLAGS.push(`--skip-force-online-signin-for-testing`)
    }
    if ( CONFIG.useTorProxy ) {
      CHROME_FLAGS.push(`--proxy-server="${process.env.TOR_PROXY.replace('socks5h', 'socks5')}"`);
      CHROME_FLAGS.push(`--host-resolver-rules="MAP * 0.0.0.0 , EXCLUDE localhost"`);
    }
    if ( isDocker() ) {
      CHROME_FLAGS.push(...[
        `--disable-features=UseSkiaRenderer,UseOzonePlatform,WebRTC-HWEncoding`
      ]);
    }
    if (isDocker() ) {
      CHROME_FLAGS.push(...[
        "--disable-gpu",
        "--enable-low-end-device-mode",
        "--ignore-gpu-blacklist",
        //"--single-process",
        "--disable-extensions",
        "--disable-hang-monitor",
        "--noerrdialogs",
        "--no-sandbox",
        "--disable-dev-shm-usage"
      ]);
      // the commented out flags below ruined video on Docker (at least on macOS)
      CHROME_FLAGS.push('--no-first-run');
      CHROME_FLAGS.push('--start-maximized');
      CHROME_FLAGS.push('--bwsi');
      CHROME_FLAGS.push('--disable-file-system');
      //CHROME_FLAGS.push('--enable-features=Vulkan,UseSkiaRenderer,VaapiVideoEncoder,VaapiVideoDecoder,CanvasOopRasterization');
      CHROME_FLAGS.push('--ignore-gpu-blocklist');
      CHROME_FLAGS.push('--disable-seccomp-filter-sandbox');
      //CHROME_FLAGS.push('--use-gl=egl');
      //CHROME_FLAGS.push('--disable-software-rasterizer');
      CHROME_FLAGS.push('--disable-dev-shm-usage');
      CHROME_FLAGS.push('--window-position=0,0');
    }
    if (process.platform == "darwin") {
      CHROME_FLAGS.push(...[
        //"--disable-gpu",
        //"--enable-low-end-device-mode",
        "--ignore-gpu-blacklist",
        //"--single-process",
        "--disable-extensions",
        "--disable-hang-monitor",
        "--noerrdialogs",
        "--no-sandbox",
        "--disable-dev-shm-usage"
      ]);
      // the commented out flags below ruined video on Docker (at least on macOS)
      CHROME_FLAGS.push('--no-first-run');
      CHROME_FLAGS.push('--start-maximized');
      CHROME_FLAGS.push('--bwsi');
      CHROME_FLAGS.push('--disable-file-system');
      //CHROME_FLAGS.push('--enable-features=Vulkan,UseSkiaRenderer,VaapiVideoEncoder,VaapiVideoDecoder,CanvasOopRasterization');
      CHROME_FLAGS.push('--ignore-gpu-blocklist');
      CHROME_FLAGS.push('--disable-seccomp-filter-sandbox');
      //CHROME_FLAGS.push('--use-gl=egl');
      //CHROME_FLAGS.push('--disable-software-rasterizer');
      CHROME_FLAGS.push('--disable-dev-shm-usage');
      CHROME_FLAGS.push('--window-position=0,0');
    }
    if ( DEBUG.noAudio ) {
      CHROME_FLAGS.push('--mute-audio');
    }
    const targetCount = fs.existsSync(path.resolve(CONFIG.baseDir, 'targetCount')) ?
        parseInt(fs.readFileSync(path.resolve(CONFIG.baseDir, 'targetCount')).toString())
      :
        0
    ;
    const isNotFirstRun = fs.existsSync(path.resolve(CONFIG.baseDir, 'browser-cache', CHROME_PROFILE, 'Preferences'));

    const CHROME_OPTS = {
      port,
      startingUrl: isNotFirstRun ?
          targetCount == 0 ?
              (CONFIG.homePage || 'https://bing.com')
            :
              'chrome://about'
        :
          (CONFIG.homePage || 'https://duckduckgo.com'),
      ignoreDefaultFlags: true,
      handleSIGINT: false,
      userDataDir: path.resolve(CONFIG.baseDir, 'browser-cache'),
      logLevel: 'verbose',
      chromeFlags: CHROME_FLAGS
    };
    if ( CHROME_OPTS.userDataDir ) {
      fs.mkdirSync(CHROME_OPTS.userDataDir, {recursive:true});
    }
    DEBUG.showFlags && console.log({chromeOpts: CHROME_OPTS});
    const zomb = await ChromeLauncher(CHROME_OPTS);

    const retVal = {};

    zomb.pidFile = path.resolve(CONFIG.baseDir, `chrome-${port}`, `pid`);
    console.log("Did chrome start?");

    if ( zomb.process ) {
      DEBUG.debugChromeStart && console.log(zomb.process, zomb.pid);
      fs.mkdirSync(path.resolve(CONFIG.baseDir, `chrome-${port}`), {recursive:true});
      fs.writeFileSync(zomb.pidFile, zomb.pid.toString());
      chrome_started = true;
      zombies.set(port,zomb);
      retVal.port = port;
    } else {
      console.log("Chrome did not start", zomb);
      let found = false;
        if ( fs.existsSync(zomb.pidFile) ) {
          let pid = parseInt(fs.readFileSync(zomb.pidFile).toString());
          if ( ! Number.isNaN(pid) ) {
            const running = isRunning(pid);
            if ( running ) {
              console.log(`Existing chrome on port ${port} already found (with pid: ${pid})`);
              zomb.pid = pid;
              found = true;
              chrome_started = true;
              zombies.set(port,zomb);
              retVal.port = port;
              zomb.process = new EventEmitter();
              zomb.kill = async () => {
                process.kill(zomb.pid, 'SIGKILL');
                await sleep(500);
                process.kill(zomb.pid, 'SIGKILL');
              }
              setTimeout(async () => {
                untilForever(() => !isRunning(zomb.pid)).then(() => zomb.process.emit('exit'));
              }, 0);
            } else {
              console.info(`Could not find any other chrome process running on port ${port}, even tho pid file was reported.`);
              console.info(`Deleting said pid file...`);
              fs.unlinkSync(zomb.pidFile);
            }

            function isRunning(pid) {
              try {
                process.kill(pid, 0);
                return true;
              } catch(e) {
                return false;
              }
            }
          }
        }
      if ( ! found ) {
        // cleanup just in case
        await zomb.kill();
      }
    }
    if ( zomb.process ) {
      zomb.process.on('exit', () => {
        console.warn("Chrome exiting");
        console.info(`Deleting said pid file...`);
        fs.unlinkSync(zomb.pidFile);
        let handlers = deathHandlers.get(port);
        if ( handlers ) {
          for( const handler of handlers ) {
            try {
              handler();
            } catch(e) {
              console.warn("Error in chrome death handler", e, handler);
            }
          }
        }
      });
    }

    setTimeout(() => {
      process.on('SIGHUP', undoChrome);
      process.on('SIGUSR1', undoChrome);
      process.on('SIGTERM', undoChrome);
      process.on('SIGINT', undoChrome);
      process.on('beforeExit', undoChrome);
    }, 1001);

    return retVal;

    async function undoChrome() {
      DEBUG.val && console.log("Undo chrome called");
      if ( ! chrome_started ) return;
      chrome_started = false;
      try {
        console.warn("Chrome exiting");
        console.info(`Deleting said pid file...`);
        fs.unlinkSync(zomb.pidFile);
        let handlers = deathHandlers.get(port);
        const newHandlers = [];
        if ( handlers ) {
          for( const handler of handlers ) {
            try {
              handler();
            } catch(e) {
              newHandlers.push(handler);
              console.warn("Error in chrome death handler", e, handler);
            }
          }
          deathHandlers.set(port, newHandlers);
        }
        await zomb.kill();
        process.exit(0);
      } catch(e) {
        console.warn("Error on kill chrome on exit", e);
        process.exit(0);
      }
    }
  },

  onDeath(port, func) {
    let handlers = deathHandlers.get(port);
    if ( ! handlers ) {
      handlers = [];
      deathHandlers.set(port,handlers);
    }
    handlers.push(func);
  },

  kill(port) {
    const zombie = zombies.get(port);
    DEBUG.val && console.log(`Requesting zombie kill.`);
    if ( zombie ) {
      return zombie.kill();
    }
  }
};

export default launcher_api;

