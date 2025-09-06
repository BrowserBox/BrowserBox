// 
  import './unleash-fetch.js';
  import http from 'http';
  import https from 'https';
  import fs from 'fs';
  import os from 'os';
  import path from 'path';
  import child_process from 'child_process';  

  import express from 'express';
  import compression from 'compression';
  import multer from 'multer';
  import {WebSocketServer, WebSocket} from 'ws';
  import Peer from 'simple-peer';

  import bodyParser from 'body-parser';
  import cookieParser from 'cookie-parser';
  import cors from 'cors';
  import helmet from 'helmet';
  import rateLimit from 'express-rate-limit';

  import zl from './zombie-lord/index.js';
  import {start_mode} from './args.js';
  import {
    AttachmentTypes,
    StartupTabs,
    OurWorld,
    T2_MINUTES,
    version, APP_ROOT, 
    COOKIENAME, GO_SECURE, DEBUG,
    KILL_TIME,
    CONFIG,
    ALLOWED_3RD_PARTY_EMBEDDERS,
    BASE_PATH,
    sleep,
    EXTENSIONS_PATH,
    throttle,
    ConnectOptions,
  } from './common.js';
  import {releaseLicense, timedSend, eventSendLoop} from './server.js';
  import {MIN_TIME_BETWEEN_SHOTS, WEBP_QUAL} from './zombie-lord/screenShots.js';
  import {validityCheck} from './hard/application.js'
  import {stop} from '../branch-bbx-stop.js';

  // legacy route import
  import KEYS from '../client/kbd.js';
  import Connect from './zombie-lord/connection.js';

  const { exec, execSync } = child_process;

  const LEGACY_API_VERSION = 'vwin';
  let WRTC;
  let cacheExpired = true;
  globalThis.xCheckers = null;
  try { 
    await import('@roamhq/wrtc').then(module => WRTC = module.default);
  } catch(e) {
    console.warn(`webRTC not available on this platform (${process.platform}). You may wish to build the module @roamhq/wrtc yourself here.`);
  }

  // config
    const SHUTDOWN_MINUTES = 45 * 60 * 1000; // lol
    const SafariPlatform = /^((?!chrome|android).)*safari/i;
    const PEER_RECONNECT_MS = 2000;
    const FRAME_LIMIT = false; // 'SAMEORIGIN' or 'DENY' or false (no limit)
    const protocol = GO_SECURE ? https : http;
    const COOKIE_OPTS = {
      secure: GO_SECURE,
      httpOnly: true,
      maxAge: 345600000,
    };
    if ( GO_SECURE ) {
      // same site only allowed with secure 
      COOKIE_OPTS.sameSite = ALLOWED_3RD_PARTY_EMBEDDERS.length > 0 ? 'None' : 'Strict';
    } else {
      COOKIE_OPTS.sameSite = 'Lax';
    }
    Object.freeze(COOKIE_OPTS);

  DEBUG.debugCookie && console.log(COOKIE_OPTS);

  if ( ! DEBUG.blockInspect ) {
    console.warn(`
        ===============================================
               WARNING: Inspect is not blocked. 
        ===============================================
    `);
  }

  // file uploads
    export const fileChoosers = new Map();
    const uploadPath = path.resolve(CONFIG.baseDir, 'uploads');
    if ( ! fs.existsSync(uploadPath) ) {
      fs.mkdirSync(uploadPath, {recursive:true});
    }

    const storage = multer.diskStorage({
      destination: (req, file, cb) => cb(null, uploadPath),
      filename: (req, file, cb) => {
        return cb(null, nextFileName(path.extname(file.originalname)))
      }
    });
    const upload = multer({storage});

  // message queue
    const Sent = new Map();
    const Queue = {
      funcs: []
    };

  // selective Cors
    const Cors = cors();
    const CrossOriginOpen = helmet({
      crossOriginResourcePolicy: {
        policy: 'cross-origin'
      },
      contentSecurityPolicy: { 
        directives: {
          objectSrc: [
            "'self'"
          ]
        }
      },
    });

  // rate limiter
    const RateLimiter = rateLimit({
      windowMs: 1000 * 60 * 3,
      max: DEBUG.mode == 'dev' ? 10000 : 2000,
      message: `
        Too many requests from this IP. Please try again in a little while.
      `
    });
    
    const ConstrainedRateLimiter = rateLimit({ windowMs: 10000,
      max: 1,
      message: `
        Too many requests from this IP. Please try again in a little while.
      `
    });
    
    const VeryConstrainedRateLimiter = rateLimit({
      windowMs: 10000,
      max: 1,
      message: `
        Too many requests from this IP. Please try again in a little while.
      `
    });

  // Safari special cookie loader
    let SAFARI_PERMISSION_LOADER_HTML = `<h1>Safari not supported...</h1>`;
    const SafariPermissionLoader = () => DEBUG.loadSPLFreshEachLogin ? 
      SAFARI_PERMISSION_LOADER_HTML = fs.readFileSync(path.resolve(APP_ROOT,'assets','SPL.html'))
      : 
      SAFARI_PERMISSION_LOADER_HTML
    ;

  // Integrity check
    const integrityFilePath = path.resolve(os.homedir(), 'BBPRO.INTEGRITY');
    const INTEGRITY_FILE_CONTENT = fs.existsSync(integrityFilePath) ? 
      fs.readFileSync(integrityFilePath).toString('utf8') : 'null-integrity-check';
    DEBUG.debugIntegrity && console.log({integrityFileContent: INTEGRITY_FILE_CONTENT});

  // keep tabs organized
  const TabNumbers = new Map();

  // global for export
  export const websockets = new Set();

  // extensions
  export const extensions = [];

  let shutdownTimer = null;
  let serverOrigin;
  let messageQueueRunning = false;
  let requestId = 0;
  let TabNumber = 0;

  console.log({DOMAIN:process.env.DOMAIN});
  export async function start_ws_server(
      port, zombie_port, allowed_user_cookie, session_token, 
  ) {
    if ( DEBUG.debugAddr ) {
      const base = port - 2;
      for( let i = base; i < base + 5; i++ ) {
        const key = `ADDR_${i}`;
        console.log(key, process.env[key]);
      }
    }
    DEBUG.val && console.log(`Starting websocket server on ${port}`);
    const app = express();
    app.set('etag', 'strong');
    app.use(compression());
    const server_port = parseInt(port);
    const StandardCSP = {
      defaultSrc: ["'self'"],
      imgSrc: [
        "'self'",
        "data:",
        "blob:"
      ],
      mediaSrc: [
        "data:",
        "'self'",
        `${GO_SECURE ? 'https:' : 'http:'}//localhost:*`,
        `${GO_SECURE ? 'https:' : 'http:'}//*.dosaygo.com:*`,
        `${GO_SECURE ? 'https:' : 'http:'}//browse.cloudtabs.net:*`,
        ...((process.env.TORBB || process.env.HOST_PER_SERVICE) ? [
          `${GO_SECURE ? 'https:' : 'http:'}//${process.env[`ADDR_${server_port}`]}:*`, // main service (for data: urls seemingly)
          `${GO_SECURE ? 'https:' : 'http:'}//${process.env[`ADDR_${server_port - 2}`]}:*`, // audio onion service
        ] : [
          `${GO_SECURE ? 'https:' : 'http:'}//${process.env.DOMAIN}:*`, // main service (for data: urls seemingly)
        ]),
        ...(process.env.DOMAIN?.startsWith?.('*.') ? [
          `${GO_SECURE ? 'https:' : 'http:'}//${process.env.DOMAIN.slice(2)}:*`, // main service (for data: urls seemingly)
        ] : [
          `${GO_SECURE ? 'https:' : 'http:'}//*.${process.env.DOMAIN}:*`, // main service (for data: urls seemingly)
        ]),
      ],
      frameSrc: [
        "'self'",
        `${GO_SECURE ? 'https:' : 'http:'}//localhost:*`,
        `${GO_SECURE ? 'https:' : 'http:'}//link.local:*`,
        `${GO_SECURE ? 'https:' : 'http:'}//browse.cloudtabs.net:*`,
        `${GO_SECURE ? 'https:' : 'http:'}//*.dosaygo.com:*`,
        ...((process.env.TORBB || process.env.HOST_PER_SERVICE) ? [
          `${GO_SECURE ? 'https:' : 'http:'}//${process.env[`ADDR_${server_port - 2}`]}:*`, // audio onion service
        ] : [
          `${GO_SECURE ? 'https:' : 'http:'}//${process.env.DOMAIN}:*`, // main service (for data: urls seemingly)
        ]),
        ...(process.env.DOMAIN?.startsWith?.('*.') ? [
          `${GO_SECURE ? 'https:' : 'http:'}//${process.env.DOMAIN.slice(2)}:*`, // main service (for data: urls seemingly)
        ] : [
          `${GO_SECURE ? 'https:' : 'http:'}//*.${process.env.DOMAIN}:*`, // main service (for data: urls seemingly)
        ]),
      ],
      connectSrc: [
        "'self'",
        "wss://*.dosaygo.com:*",
        "wss://localhost:*",
        "wss://link.local:*",
        `${GO_SECURE ? 'https:' : 'http:'}//*.dosaygo.com:${server_port-1}`,
        `${GO_SECURE ? 'https:' : 'http:'}//*.dosaygo.com:${server_port+1}`,
        `${GO_SECURE ? 'https:' : 'http:'}//browse.cloudtabs.net:*`,
        `${GO_SECURE ? 'https:' : 'http:'}//browse.cloudtabs.net`,
        "wss://browse.cloudtabs.net:*",
        `${GO_SECURE ? 'https:' : 'http:'}//localhost:${server_port-1}`,
        `${GO_SECURE ? 'https:' : 'http:'}//localhost:${server_port+1}`,
        `${GO_SECURE ? 'https:' : 'http:'}//link.local:${server_port-1}`,
        `${GO_SECURE ? 'https:' : 'http:'}//link.local:${server_port+1}`,
        ...CONFIG.connectivityTests,
        ...((process.env.TORBB || process.env.HOST_PER_SERVICE) ? [
          `${GO_SECURE ? 'https:' : 'http:'}//${process.env[`ADDR_${server_port}`]}:*`, // main service 
          `${GO_SECURE ? 'https:' : 'http:'}//${process.env[`ADDR_${server_port - 2}`]}:*`, // audio onion service
          `${GO_SECURE ? 'https:' : 'http:'}//${process.env[`ADDR_${server_port + 1}`]}:*`, // devtools
          `${GO_SECURE ? 'https:' : 'http:'}//${process.env[`ADDR_${server_port + 2}`]}:*`, // docs
        ] : [
          `${GO_SECURE ? 'https:' : 'http:'}//${process.env.DOMAIN}:*`, // main service (for data: urls seemingly)
          `wss://${process.env.DOMAIN}:*`, // main service (for data: urls seemingly)
        ]),
        ...(process.env.DOMAIN?.startsWith?.('*.') ? [
          `${GO_SECURE ? 'https:' : 'http:'}//${process.env.DOMAIN.slice(2)}:*`, // main service (for data: urls seemingly)
          `wss://${process.env.DOMAIN.slice(2)}:*`, // main service (for data: urls seemingly)
        ] : [
          `${GO_SECURE ? 'https:' : 'http:'}//*.${process.env.DOMAIN}:*`, // main service (for data: urls seemingly)
          `wss://*.${process.env.DOMAIN}:*`, // main service (for data: urls seemingly)
        ]),
        // for checking if access via TOR
        "https://check.torproject.org/"
      ],
      fontSrc: [
        "'self'", 
        "'unsafe-inline'",
        `${GO_SECURE ? 'https:' : 'http:'}//fonts.googleapis.com`,
        `${GO_SECURE ? 'https:' : 'http:'}//fonts.gstatic.com`
      ],
      styleSrc: [
        "'self'", 
        "'unsafe-inline'",
        `${GO_SECURE ? 'https:' : 'http:'}//fonts.googleapis.com`,
        `${GO_SECURE ? 'https:' : 'http:'}//fonts.gstatic.com`
      ],
      scriptSrc: [
        "'self'", 
        "'unsafe-eval'",
        "'unsafe-inline'",
        `${GO_SECURE ? 'https:' : 'http:'}//browse.cloudtabs.net:*`,
        `${GO_SECURE ? 'https:' : 'http:'}//*.dosaygo.com:*`
      ],
      scriptSrcAttr: [
        "'self'",
        "'unsafe-inline'"
      ],
      frameAncestors: [
        "'self'",
        `${GO_SECURE ? 'https:' : 'http:'}//browse.cloudtabs.net:*`,
        `${GO_SECURE ? 'https:' : 'http:'}//*.dosaygo.com:*`,
        ...ALLOWED_3RD_PARTY_EMBEDDERS
      ],
      objectSrc: ["'none'"],
      ...(GO_SECURE ? {
        upgradeInsecureRequests: [],
      } : {
        upgradeInsecureRequests: null,
      })
    };
    const sockets = new Set();
    const peers = new Set();

    let latestMessageId = 0;

    if ( ! DEBUG.noSecurityHeaders ) {
      app.use(helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            imgSrc: [
              "'self'",
              "data:",
              "blob:"
            ],
            mediaSrc: [
              "'self'",
              `${GO_SECURE ? 'https:' : 'http:'}//*.dosaygo.com:*`
            ],
            frameSrc: [
              "'self'",
              `${GO_SECURE ? 'https:' : 'http:'}//*.dosaygo.com:*`
            ],
            connectSrc: [
              "'self'",
              "wss://*.dosaygo.com:*",
              "wss://localhost:*",
              `${GO_SECURE ? 'https:' : 'http:'}//browse.cloudtabs.net`,
              `${GO_SECURE ? 'https:' : 'http:'}//*.dosaygo.com:${server_port-1}`,
              `${GO_SECURE ? 'https:' : 'http:'}//*.dosaygo.com:${server_port+1}`,
              `${GO_SECURE ? 'https:' : 'http:'}//localhost:${server_port-1}`,
              `${GO_SECURE ? 'https:' : 'http:'}//localhost:${server_port+1}`,
              ...CONFIG.connectivityTests
            ],
            fontSrc: [
              "'self'", 
              "'unsafe-inline'",
              `${GO_SECURE ? 'https:' : 'http:'}//fonts.googleapis.com`,
              `${GO_SECURE ? 'https:' : 'http:'}//fonts.gstatic.com`
            ],
            styleSrc: [
              "'self'", 
              "'unsafe-inline'",
              `${GO_SECURE ? 'https:' : 'http:'}//fonts.googleapis.com`,
              `${GO_SECURE ? 'https:' : 'http:'}//fonts.gstatic.com`
            ],
            scriptSrc: [
              "'self'", 
              "'unsafe-eval'",
              "'unsafe-inline'",
              `${GO_SECURE ? 'https:' : 'http:'}//*.dosaygo.com:*`
            ],
            scriptSrcAttr: [
              "'self'",
              "'unsafe-inline'"
            ],
            frameAncestors: [
              "'self'",
              `${GO_SECURE ? 'https:' : 'http:'}//*.dosaygo.com:*`,
              ...ALLOWED_3RD_PARTY_EMBEDDERS
            ],
            objectSrc: ["'none'"],
            ...(GO_SECURE ? {
              upgradeInsecureRequests: [],
            } : {
              upgradeInsecureRequests: null,
            })
          },
          reportOnly: false,  
        },
        frameguard: FRAME_LIMIT
      }));
      app.use(helmet({
        contentSecurityPolicy: {
          directives: StandardCSP,
          reportOnly: false,  
        },
        frameguard: FRAME_LIMIT
      }));
      app.use(helmet.hsts({
        maxAge: 0
      }));
    }
    const CrossOriginSecure = helmet({
      crossOriginResourcePolicy: {
        policy: 'cross-origin'
      },
      contentSecurityPolicy: {
        directives: StandardCSP,
        reportOnly: false,  
      },
      frameguard: FRAME_LIMIT
    });
    const SEC_HEADERS = DEBUG.noSecurityHeaders ? [Cors] : [Cors, CrossOriginSecure];
    const OPEN_HEADERS = [Cors, CrossOriginOpen];

    app.use(RateLimiter);
    app.use(bodyParser.urlencoded({extended:true}));
    app.use(bodyParser.json());
    app.use(cookieParser());
    app.use(upload.array("files", 10));
    app.use((req, res, next) => {
      const newOrigin = `${req.protocol}://${req.headers.host}`;
      if ( newOrigin !== serverOrigin ) {
        serverOrigin = newOrigin;
        DEBUG.showOrigin && console.log({serverOrigin});
      }
      next();
    });
    // serve assets that can be injected into pages
    app.get('/assets/*path', OPEN_HEADERS, (req, res, next) => next());
    if ( start_mode == "signup" ) {
      app.get("/", (req,res) => res.sendFile(path.join(APP_ROOT, 'public', 'index.html'))); 
    } else {
      if ( DEBUG.mode == 'dev' ) {
        app.get("/", SEC_HEADERS, (req,res) => res.sendFile(path.join(APP_ROOT, 'public', 'image.html'))); 
      } else {
        app.get("/", SEC_HEADERS, (req,res) => res.sendFile(path.join(APP_ROOT, '..', 'dist', 'image.html'))); 
      }
      app.get("/login", SEC_HEADERS, (req,res) => {
        console.log('login', req.query);
        const {ui: ui = 'true',token,ran: ran = Math.random(),url:Url} = req.query; 
        DEBUG.debugCookie && console.log({token, session_token});
        if ( token == session_token ) {
          res.cookie(COOKIENAME+port, allowed_user_cookie, COOKIE_OPTS);
          DEBUG.debugCookie && console.log('set cookie', COOKIENAME+port, allowed_user_cookie, COOKIE_OPTS);
          let url;
          url = `/?ran=${ran||Math.random()}&ui=${ui}#${session_token}`;
          if ( process.env.TORBB || process.env.HOST_PER_SERVICE ) {
            const zVal = encodeURIComponent(btoa(JSON.stringify({
              x: process.env[`ADDR_${server_port-2}`],  // audio port service hostname
              y: process.env[`ADDR_${server_port+1}`],  // devtools port service hostname
              z: process.env[`ADDR_${server_port+2}`],  // docs port service hostname
            })));
            if ( !! Url ) {
              url = `/?url=${encodeURIComponent(Url)}&z=${zVal}&ran=${ran||Math.random()}&ui=${ui}#${session_token}`;
            } else {
              url = `/?ran=${ran||Math.random()}&z=${zVal}&ui=${ui}#${session_token}`;
            }
          } else if ( !! Url ) {
            url = `/?url=${encodeURIComponent(Url)}&ran=${ran||Math.random()}&ui=${ui}#${session_token}`;
          }
          console.log({url});
          const userAgent = req.headers['user-agent'];
          const isSafari = SafariPlatform.test(userAgent);
          if ( isSafari && DEBUG.ensureRSA_for_3PC ) { // ensure request storage access for 3rd-party cookies
            res.type('html');
            res.end(SafariPermissionLoader());
          } else {
            res.redirect(url);
          }
        } else {
          res.type("html");
          res.status(401);
          if ( session_token == 'token2' ) {
            res.end(`Incorrect token, not token2. <a href=/login?token=token2>Try again.</a>`);
          } else {
            res.end(`Incorrect token. <a href=https://${req.hostname}/>Try again.</a>`);
          }
        }
      }); 
      app.get("/local_cookie.js", SEC_HEADERS, (req,res) => {
        console.log('local cookie', req.query);
        const {ui: ui = 'true',token,ran: ran = Math.random(),url:Url} = req.query; 
        DEBUG.debugCookie && console.log({token, session_token});
        if ( token == session_token ) {
          res.type('application/javascript');
          const userAgent = req.headers['user-agent'];
          const isSafari = SafariPlatform.test(userAgent);
          if ( isSafari || DEBUG.useLocalAuthInPrepFor_3PC_PhaseOut ) {
            res.send(`
              localStorage.setItem('localCookie',"${allowed_user_cookie}");
            `);
          } else {
            res.send(`
              void 0;
            `);
          }
        } else {
          res.type("html");
          if ( session_token == 'token2' ) {
            res.end(`Incorrect token, not token2. <a href=/login?token=token2>Try again.</a>`);
          } else {
            res.end(`Incorrect token. <a href=https://${req.hostname}/>Try again.</a>`);
          }
        }
      });
      app.get("/SPLlogin", (req,res) => {
        const {token,ran,url:Url} = req.query; 
        if ( token == session_token ) {
          res.cookie(COOKIENAME+port, allowed_user_cookie, COOKIE_OPTS);
          let url;
          url = `/?ran=${ran||Math.random()}#${session_token}`;
          if ( !! Url ) {
            url = `/?url=${encodeURIComponent(Url)}&ran=${ran||Math.random()}#${session_token}`;
          }
          res.redirect(url);
        } else {
          res.type("html");
          if ( session_token == 'token2' ) {
            res.end(`Incorrect token, not token2. <a href=/login?token=token2>Try again.</a>`);
          } else {
            res.end(`Incorrect token. <a href=https://${req.hostname}/>Try again.</a>`);
          }
        }
      });
      app.get("/pptr", (req,res) => {
        res.type('html');
        res.end(`
          <!DOCTYPE html>
          <script src=pptr_login.js></script>
        `);
      });
      app.get("/SPLgenerate", (req,res) => {
        res.cookie('SPL-cookie'+port, Date.now().toString(36), COOKIE_OPTS);
        res.sendFile(path.resolve(APP_ROOT,...(DEBUG.mode === 'dev' ? ['public', 'assets'] : ['..', 'dist', 'assets']),'SPL2.html'));
      });
    }
    if ( process.env.TORBB ) {
      app.get("/torca/rootCA.pem", VeryConstrainedRateLimiter, (req, res) => res.sendFile(path.resolve(process.env.TORCA_CERT_ROOT, 'rootCA.pem')));
    }
    app.use(express.static(path.resolve(APP_ROOT, ...(DEBUG.mode === 'dev' ? ['public'] : ['..', 'dist']))));

    try {
      SAFARI_PERMISSION_LOADER_HTML = fs.readFileSync(path.resolve(APP_ROOT,...(DEBUG.mode === 'dev' ? ['public', 'assets'] : ['..', 'dist', 'assets']),'SPL.html'));
    } catch(e) {
      console.warn(`Could not find SafariPermissionLoader HTML file. Hope you don't need to support Safari!`);
    }

    const secure_options = {};
    try {
      const sec = {
        key: fs.readFileSync(path.resolve(CONFIG.sslcerts(server_port), 'privkey.pem')),
        cert: fs.readFileSync(path.resolve(CONFIG.sslcerts(server_port), 'fullchain.pem')),
        ca: fs.existsSync(path.resolve(CONFIG.sslcerts(server_port), 'chain.pem')) ? 
            fs.readFileSync(path.resolve(CONFIG.sslcerts(server_port), 'chain.pem'))
          :
            undefined
      };
      Object.assign(secure_options, sec);
    } catch(e) {
      console.warn(`No certs found so will use insecure no SSL.`); 
      console.log(secure_options, CONFIG.sslcerts(server_port));
    }

    const secure = secure_options.cert && secure_options.key;
    const server = protocol.createServer.apply(protocol, GO_SECURE && secure ? [secure_options, app] : [app]);

    const wss = new WebSocketServer({
      server,
      perMessageDeflate: false
    });
    let shuttingDown = false;
    const shutDown = async (sig) => {
      console.log(`Shutdown requested. Signal: ${sig}`, {shuttingDown});
      try {
        if ( shuttingDown ) return;
        shuttingDown = true;
        clearInterval(globalThis.xCheckers);
        let markOtherTasksComplete;
        let markLicenseReleased;
        let licenseReleased = new Promise(res => markLicenseReleased = res);
        const otherTasks = new Promise(res => markOtherTasksComplete = res);
        console.log('Releasing license');
        releaseLicense().then(async resp => {
          console.log(resp);
          markLicenseReleased();
          await otherTasks;
          console.log('Queueing exit for 5 seconds later');
          setTimeout(() => process.exit(0), 5111);
        });

        setTimeout(() => {
          console.warn(`We do not terminate normally within more than 20 seconds, so shutting down now.`);
          stop();
          setTimeout(() => { process.exit(1); }, 22_222);
        }, 22_222);

        try {
          server.close(() => console.info(`Server closed on ${sig}`));
        } catch {
          console.log(`Issuing closing server`);
        }
        try {
          peers.forEach(peer => {
            try {
              peer.destroy(`Server going down.`);
            } catch(e) {
              DEBUG.debugConnect && console.info(`Error closing peer`, e, peer);
            }
          });
        } catch { 
          console.log(`Issue closing peers`);
        }
        try {
          websockets.forEach(ws => {
            try {
              ws.close(1001, "server going down");
            } catch(e) {
              DEBUG.debugConnect && console.info(`Error closing websocket`, e, ws);
            }
          });
        } catch {
          console.log(`Issue closing websockets`);
        }
        try {
          sockets.forEach(socket => {
            try { socket.destroy() } catch(e) { 
              DEBUG.socDebug && console.warn(`MAIN SERVER: port ${server_port}, error closing socket`, e) 
            }
          });
        } catch {
          console.log(`Issue closing sockets`);
        }
        console.log('Complete shutdown stanza');
        try {
          markOtherTasksComplete();
          console.log('Waiting license released...');
          await licenseReleased;
        } catch {
          console.log(`Issue waiting license release and marking other tasks complete`);
        }
        console.log('License is released.');
        return await stop();
      } catch(e) {
        console.warn(`Error during shutdown`, e);
      }
    };
    globalThis.shutDown = shutDown;

    server.on('connection', socket => {
      sockets.add(socket);
      socket.on('close', () => sockets.delete(socket));
    });

    server.on('upgrade', (req, socket, head) => {
      sockets.add(socket);
      socket.on('close', () => sockets.delete(socket));
      socket.setNoDelay(true);
    });

    wss.on('connection', async (ws, req) => {
      const connectionId = Math.random().toString(36) + (+ new Date).toString(36);
      const url = new URL(req.url, `${req.protocol}://${req.headers.host}`);
      const qp = url.searchParams.get('session_token');
      const cookie = req.headers.cookie;
      let query;
      try {
        query = new URL(req.url).searchParams;
      } catch(e) {
        query = new URL(`${GO_SECURE ? 'https:' : 'http:'}//localhost${req.url}`).searchParams;
      }
      const localCookie = url.searchParams.get(COOKIENAME+port) || req.headers['x-browserbox-local-auth'] || query.get('localCookie');
      const IP = req.connection.remoteAddress;
      let closed = false;

      DEBUG.val && console.log({wsConnected:{cookie, localCookie, qp, IP}});

      zl.act.saveIP(IP);

      const validAuth = (cookie && cookie.includes(`${COOKIENAME+port}=${allowed_user_cookie}`)) ||
        (qp && qp == session_token) || (localCookie == allowed_user_cookie);

      if( validAuth ) {
        DEBUG.debugConnect && console.log(`Check 1`);
        await zl.act.addLink({so, forceMeta}, {connectionId, fastest: null, peer: null, socket:ws}, zombie_port);
        DEBUG.debugConnect && console.log(`Check 2`);
        forceMeta({
          multiplayer: {
            onlineCount: zl.act.linkStats(zombie_port).onlineCount
          }
        });
        stopShutdownTimer();
        DEBUG.debugConnect && console.log(`Check 3`);
        let peer;
        zl.life.onDeath(zombie_port,  () => {
          console.info("Zombie/chrome closed or crashed.");
          zl.act.deleteConnection(zombie_port);
          if ( CONFIG.tryRestartingChrome ) {
            if ( fs.existsSync(path.join(os.homedir(), 'restart_chrome')) ) {
              fs.unlinkSync(path.join(os.homedir(), 'restart_chrome'));
              console.log(`Restarting chrome on request`);
              const MAX_RETRIES = 10;
              let count = 0;

              restart();

              async function restart() {
                let port;
                try {
                  ({port} = await zl.life.newZombie({port: zombie_port})); 
                } catch(e) {
                  console.warn(`Error starting chrome`);
                  zl.life.kill(zombie_port);
                }
                if ( port != zombie_port ) {
                  console.log(`Zombie port mismatch`, {zombie_port, acquired_port: port});
                  if ( port ) { 
                    zl.life.kill(port);
                  }
                  await sleep(500);
                  if ( count++ < MAX_RETRIES ) {
                    console.log(`Retrying...`);
                    setTimeout(() => restart(), 0);
                  } else {
                    console.warn(new Error(`Failed to restart chrome. Retry count exceeded`));
                  }
                }
              }
            }
          } else {
            shutDown();
          }
          //console.log("Closing as zombie crashed.");
          //ws.close();
        });
        ws.on('close', () => {
          DEBUG.debugConnect && console.log(`Check 8`);
          websockets.delete(ws);
          closed = true;    
          ws = null;
          peer && peer.destroy(new Error(`Main communication WebSocket closed.`));
          console.log(`Clients connected now: ${websockets.size}`);
          if ( websockets.size === 0 ) {
            startShutdownTimer();
          }
          peer = null;
          zl.act.addLink({so, forceMeta}, {connectionId, peer: null, socket:null}, zombie_port);
          zl.act.deleteLink({connectionId}, zombie_port);
          zl.act.fanOut(socket => so(
            socket,
            {
              meta:[
                {
                  multiplayer: {
                    onlineCount: zl.act.linkStats(zombie_port).onlineCount
                  }
                }
              ]
            }
          ), zombie_port);
        });
        ws.on('message', message => {
          // possible improvement to simplicity and efficiency
            // creating a function for EVERY message call is probably really inefficient
            // I know my servers run low CPU and low memory but this might be better somehow
            // still I prioritize simplicity, reliability and maintainability over cleverness
            // and performance optimization where performance does not impact usability
          const func = async () => {
            const Data = [], Frames = [], Meta = [], State = {};

            message = JSON.parse(message);

            DEBUG.cnx && console.log(message);

            const {fastestChannel, copeer, zombie, tabs, messageId, viewport} = message;  
            let {screenshotAck} = message;

            if ( !! messageId ) {
              latestMessageId = messageId;
            }

            try {
              if ( fastestChannel ) {
                if ( DEBUG.chooseFastest ) { 
                  if ( fastestChannel.websocket ) {
                    DEBUG.logFastest && console.log(`Fastest is websocket`);
                    zl.act.addLink({so, forceMeta}, {connectionId, fastest: ws, peer, socket:ws}, zombie_port);
                  } else if ( fastestChannel.webrtcpeer ) {
                    DEBUG.logFastest && console.log(`Fastest is webrtc`);
                    zl.act.addLink({so, forceMeta}, {connectionId, fastest: peer, peer, socket:ws}, zombie_port);
                  } else {
                    console.warn(`Unknown fastest channel`, fastestChannel);
                  }
                }
              } 
              if ( screenshotAck ) {
                (DEBUG.debugCast || DEBUG.acks) && console.log('client sent screenshot ack', screenshotAck);
                if ( screenshotAck == 1 ) {
                  (DEBUG.debugCast || DEBUG.acks) && console.log('client sent screenshot no frame received code');
                  screenshotAck = { frameId: 1, requiresCastId: true }
                } 
                if ( !screenshotAck.requiresCastId || DEBUG.allowAckBlastOnStart ) {
                  zl.act.screenshotAck(
                    connectionId, 
                    zombie_port, 
                    screenshotAck, 
                    {Data, Frames, Meta, State, receivesFrames: false, messageId}
                  );
                }
              }
              if ( zombie ) {
                const {events} = zombie;
                let {receivesFrames} = zombie;

                if ( receivesFrames ) {
                  // switch it on in DEBUG and save it on the websocket for all future events
                  ws.receivesFrames = receivesFrames;
                } else {
                  receivesFrames = ws.receivesFrames;
                }

                // debug 
                  DEBUG.val > DEBUG.med && 
                    console.log(`Starting ${events.length} events for message ${messageId}`);

                await eventSendLoop(events, {Data, Frames, Meta, State, receivesFrames, messageId, connectionId});

                // debug
                  DEBUG.val > DEBUG.med &&
                    console.log(`Ending ${events.length} events for message ${messageId}\n`);

                const {totalBandwidth} = State;

                if ( DEBUG.sendFramesWhenTheyArrive ) {
                  zl.act.fanOut(socket => so(
                    socket,
                    {messageId, data:Data, frameBuffer:[], meta:Meta, totalBandwidth}
                  ), zombie_port);
                } else {
                  if ( DEBUG.binaryFrames ) {
                    if ( DEBUG.cwebp && ! zl.act.isSafari(zombie_port) ) {
                      console.warn(`Not currently supported due to when dependency of cwebp not correctly building in esbuild 
                        build script ./scripts/only_build.sh`);
                      /*
                      for( let frame of Frames ) {
                        const encoder = new CWebp(Buffer.from(frame, 'base64'));
                        encoder.quality(WEBP_QUAL);
                        frame = await encoder.toBuffer();
                        so(DEBUG.useWebRTC && peer ? peer : ws,frame);
                      }
                      */
                    } else {
                      for( let frame of Frames ) {
                        so(DEBUG.useWebRTC && peer ? peer : ws,frame);
                      }
                    }
                    zl.act.fanOut(
                      socket => so(
                        socket,
                        {messageId, data:Data, frameBuffer: [], meta:Meta, totalBandwidth}
                      ),
                      zombie_port
                    );
                  } else {
                    zl.act.fanOut(socket => so(
                      socket,
                      {messageId, data:Data, frameBuffer:Frames, meta:Meta, totalBandwidth}
                    ), zombie_port);
                  }
                }
              } 
              if ( tabs ) {
                let {data:{targetInfos:targets, vmPaused, modal}} = await timedSend({
                  name: "Target.getTargets",
                  params: {
                    filter: [
                      {type: 'page'},
                      ...(DEBUG.attachToServiceWorkers ? [
                        {type: 'service_worker'}
                      ] : []),
                    ]
                  },
                }, zombie_port);

                if ( targets.length === 1 ) {
                  zl.act.setHiddenTarget(targets[0].targetId, zombie_port);
                }
                targets = targets.filter(({targetId,type,url}) => { 
                  if ( !AttachmentTypes.has(type) ) return false;
                  /*
                  if ( url.startsWith('chrome') ) {
                    return false;
                  }
                  */
                  if ( ! zl.act.hasSession(targetId, zombie_port) ) {
                    if ( DEBUG.restoreSessions && ! StartupTabs.has(targetId) ) { 
                      DEBUG.restore && console.info(`Sent 'attach' to tab target ${targetId}`);
                      StartupTabs.add(targetId);
                      zl.act.send({
                        name: "Target.attachToTarget",
                        params: {
                          targetId,
                          flatten: true
                        }
                      }, zombie_port);
                    } else {
                      return false;
                    }
                  }
                  if ( zl.act.isOffscreen(targetId, zombie_port) ) {
                    return false;
                  }
                  return true;
                });
                targets = targets.map(t => {
                  if ( !TabNumbers.has(t.targetId) ) {
                    TabNumber++;
                    TabNumbers.set(t.targetId, TabNumber);
                  }
                  t.number = TabNumbers.get(t.targetId);
                  return t;
                });
                targets.sort(({number:A}, {number:B}) => A - B);

                const activeTarget = zl.act.getActiveTarget(zombie_port);
                zl.act.addTargets(targets, zombie_port);
                zl.act.fanOut(
                  socket => so(socket,{messageId, activeTarget, tabs:targets}),
                  zombie_port
                );
              } 
              if ( copeer ) {
                const {signal} = copeer;
                DEBUG.cnx && console.log('Received webrtc signal data from socket', copeer); 
                if ( ! peer && DEBUG.useWebRTC ) {
                  connectPeer().then(peer => peer.signal(signal));
                } else {
                  peer.signal(signal);
                }
              } 
              if ( viewport ) {
                DEBUG.showViewportChanges && console.log(`Viewport received`, viewport);
                zl.act.setViewport(connectionId, viewport, zombie_port);
              }
            } catch(e) {
              console.error("Error", IP, connectionId, e);
              // errors are not always pushed up this far
              // but when they are we can alert the client
              so(ws,{messageId, data:[
                {
                  error: "Failed to communicate with cloud browser",
                  resetRequired: true
                }
              ], frameBuffer:[], meta:[], totalBandwidth: 0});
            }
          };
          Queue.funcs.push(func); 
          if ( ! messageQueueRunning ) {
            runMessageQueue();
          }
        });
        ws.on('error', err => {
          DEBUG.debugConnect && console.log(`Check 10`);
          console.log(`ws err`, err);
          websockets.delete(ws);
          if ( websockets.size === 0 ) {
            startShutdownTimer();
          }
        });
        DEBUG.debugConnect && console.log(`Check 11`);
        if ( DEBUG.useWebRTC ) {
          connectPeer();
        }
        function connectPeer() {
          (DEBUG.cnx || DEBUG.debugConnect) && console.log(`Connecting peer`);
          let resolve;
          const pr = new Promise(res => resolve = res);
          peer = new Peer({
            wrtc: WRTC, trickle: true, initiator: true,
            channelConfig: {
              //ordered: true,
              //maxRetransmits: 0,
              /*maxPacketLifeTime: MIN_TIME_BETWEEN_SHOTS()*/
            }
          });
          (DEBUG.debugConnect || DEBUG.cnx) && console.log(`Server side peer created`);
          peer.on('error', err => {
            (DEBUG.val || DEBUG.cnx) && console.log('webrtc error', err);
            if ( peer ) {
              peers.delete(peer);
              peer = null;
              zl.act.addLink({so, forceMeta}, {connectionId, peer: null, socket:ws}, zombie_port);
              if ( ws?.readyState < WebSocket.CLOSING ) {
                setTimeout(connectPeer, PEER_RECONNECT_MS);
              }
            }
          });
          peer.on('close', c => {
            (DEBUG.val || DEBUG.cnx) && console.log('peer closed', c);
            if ( peer ) {
              peers.delete(peer);
              peer = null;
              zl.act.addLink({so, forceMeta}, {connectionId, peer: null, socket:ws}, zombie_port);
              if ( ws?.readyState < WebSocket.CLOSING ) {
                setTimeout(connectPeer, PEER_RECONNECT_MS);
              }
            }
          });
          peer.on('connect', () => {
            DEBUG.cnx && console.log('peer connected');
            //setTimeout(() => zl.act.addLink({so, forceMeta}, {connectionId, peer, socket:ws}, zombie_port), 15000);
            zl.act.addLink({so, forceMeta}, {connectionId, peer, socket:ws}, zombie_port);
            resolve(peer);
          });
          peer.on('signal', data => {
            DEBUG.cnx && console.log(`have webrtc signal data. sending to client`, data);
            so(ws, {copeer:{signal:data}});
            peers.add(peer);
          });
          return pr;
        }

        // send favicons to client
        zl.act.sendFavicons(msg => so(ws, msg), zombie_port);
        DEBUG.debugConnect && console.log(`Check 12`);

        websockets.add(ws);

        // why the below?
          // for cases where we still want to alert the client
          // to an error we don't push all the way
          // (because say, the send() method that results in the error
          // has no corresponding result that it is expected to tell the client about
          // e.g.
          // await send("Command.name", params); // errors from here will not go to client
        zl.act.setClientErrorSender(err => {
          so(ws,{messageId:latestMessageId, data:[
            {
              error: err,
              resetRequired: true
            }
          ], frameBuffer:[], meta:[], totalBandwidth: 0});
        }, zombie_port);
      } else {
        const hadSession = !! cookie && cookie.includes(COOKIENAME+port);
        const msg = hadSession ? 
          `Your session has expired. Please log back in.` 
          : `No session detected, have you signed up yet?`;
        const error = {msg, willCloseSocket: true, hadSession};
        console.log("Closing as not authorized.", cookie, hadSession, msg);
        so(ws, {messageId:1,data:[{error}]});
        ws.close();
      }
    });

    let runCount = 0;
    const checkers = async () => {
      if ( shuttingDown ) return;
      const targets = zl.act.getTargets(zombie_port);
      const licenseValid = await validityCheck({targets});
      if ( ! licenseValid ) {
        forceMeta({
          applicationCheck: {
            licenseValid
          }
        });
        runCount++;
        if ( runCount >= 2 ) {
          console.log(`Queueing shutdown int win fail`, {licenseValid});
          if ( ! globalThis.megaKiller ) {
            globalThis.megaKiller = setTimeout(() => globalThis.shutDown(), KILL_TIME)
          }
        }
      } else {
        runCount = 0;
        clearTimeout(globalThis.megaKiller);
        globalThis.megaKiller = null;
      }
    };
    setTimeout(checkers, 8051);
    globalThis.xCheckers = setInterval(checkers, 50137);

    server.listen(server_port, async err => {
      if ( err ) {
        console.error('err', err);
        shutDown();
      } else {
        addHandlers();
        DEBUG.val && console.log({uptime:new Date, message:'websocket server up', server_port});
        const pidFilePath = path.resolve(CONFIG.baseDir, `app-${server_port}.pid`);
        console.log(`Writing pid`, process.pid, pidFilePath);
        try {
          fs.writeFileSync(pidFilePath, process.pid.toString());
        } catch(e) {
          console.log(e);
        }
      }
    });

    process.on('SIGINT', shutDown);
    process.on('SIGHUP', shutDown);
    process.on('SIGTERM', shutDown);
    process.on('SIGUSR1', shutDown);
    process.on('SIGUSR2', shutDown);
    process.on('beforeExit', shutDown);
    process.on('exit', shutDown);

    DEBUG.alwaysStartShutdownTimer && startShutdownTimer();

    return server;

    function addLegacyHandlers() {
      // --- Legacy frame state -------------------------------------------------
      const LegacyFrameCache = new Map(); // targetId -> { buffer: Buffer, timestamp: number }
      const LegacyFrameState = new Map(); // targetId -> { lastSentTs: number, lastCaptureAt: number, inFlight: boolean }

      // =================================================================
      // == START: REWRITTEN ROUTES FOR WIN9X LEGACY HTTP CLIENT
      // =================================================================

      // --- All helpers like sanitizeCallback, reply, replyOK, replyErr, etc. remain the same ---
      // (Omitted for brevity)
      function sanitizeCallback(cb) {
        // allow a.b.c_123 style; strip anything else
        return String(cb || '').replace(/[^\w.$]/g, '');
      }

      function reply(req, res, status, payload) {
        const cb = req.query && req.query.callback;
        if (cb) {
          DEBUG.debug9x && console.log({payload, cb});
          const name = sanitizeCallback(cb);
          DEBUG.debug9x && console.log({name});
          // JSONP cannot reliably signal non-200; embed error in payload instead.
          const cbscript = `/* ok */ void 0; ${name}(${JSON.stringify(payload)});`;
          DEBUG.debug9x && console.log({cbscript});
          res
            .status(200)
            .set('Content-Type', 'application/javascript; charset=utf-8')
            .set('Cache-Control', 'no-store')
            .set('X-Content-Type-Options', 'nosniff')
            .send(cbscript);
        } else {
          res
            .status(status)
            .type('json')
            .set('Cache-Control', 'no-store')
            .json(payload);
        }
      }
      function replyOK(req, res, payload) { return reply(req, res, 200, payload); }
      function replyErr(req, res, status, message) {
        return reply(req, res, status, { error: message });
      }

      function getOrInitFrameState(targetId) {
        let st = LegacyFrameState.get(targetId);
        if (!st) {
          st = { lastCaptureAt: 0, lastSentTs: 0, inFlight: false };
          LegacyFrameState.set(targetId, st);
        }
        return st;
      }

      function readLatestFrame(zombie_port, targetId) {
        try {
          return zl.act.getFrameFromBuffer(zombie_port, targetId) || null;
        } catch {
          return null;
        }
      }

      function getState(targetId) {
        let st = LegacyFrameState.get(targetId);
        if (!st) { st = { lastSentTs: 0, lastCaptureAt: 0, inFlight: false }; LegacyFrameState.set(targetId, st); }
        return st;
      }

      function cachePeek(targetId) { return LegacyFrameCache.get(targetId) || null; }
      function cachePut(targetId, frameData) {
        if (frameData && frameData.buffer && frameData.buffer.length) {
          LegacyFrameCache.set(targetId, frameData);
        }
      }
      function cacheTake(targetId) {
        const v = LegacyFrameCache.get(targetId) || null;
        if (v) LegacyFrameCache.delete(targetId);
        return v;
      }

      async function pullIntoCacheIfNeeded(zombie_port, targetId) {
        if (cachePeek(targetId)) return cachePeek(targetId);
        const fd = zl.act.getFrameFromBuffer(zombie_port, targetId);
        if (fd) cachePut(targetId, fd);
        return fd || null;
      }

      function nowMs(){ return Date.now(); }
      function minGapMs(){ try { return MIN_TIME_BETWEEN_SHOTS(); } catch { return 120; } }
      // --- All helpers like sanitizeCallback, reply, replyOK, replyErr, etc. remain the same ---

      /**
       * NEW: A function to force a screen capture for a specific tab.
       * This is the key to solving the "stale frame" problem.
       */
      async function forceCaptureAndCache(targetId, zombie_port) {
        const sid = zl.act.getSessionId(targetId, zombie_port);
        if (!sid) return null;

        try {
          await zl.act.send({
            name: "Page.captureScreenshot",
            params: { format: 'jpeg', quality: 85 },
            sessionId: sid
          }, zombie_port);

          const newFd = zl.act.getFrameFromBuffer(zombie_port, targetId) || null;
          if (newFd) {
            // Overwrite the cache with the newest frame
            cachePut(targetId, newFd);
            return newFd;
          }
        } catch (e) {
          console.warn(`Legacy API: Failed to force capture for ${targetId}`, e.message);
        }
        return null;
      }


      // A shared authentication function for all legacy API routes
      const legacyAuth = (req, res) => {
        const cookie = req.cookies[COOKIENAME + port] || req.query[COOKIENAME + port] || req.headers['x-browserbox-local-auth'];
        const st = req.query.session_token; // The legacy client sends this
        DEBUG.debug9x && logLegacyQuery(req, 'AUTH');
        if ((cookie === allowed_user_cookie) || (st === session_token)) {
          req.authAs = `${cookie}:${st}`;
          DEBUG.debug9x && console.log('AUTH SUCCESS');
          return true;
        }
        DEBUG.debug9x && console.log('AUTH FAIL');
        replyErr(req, res, 401, 'forbidden');
        return false;
      };

      function logLegacyQuery(req, tag) {
        try {
          console.log(`[LEGACY ${tag}] url=${req.originalUrl} qs=`, req.query);
        } catch (_) {}
      }

      app.get(`/api/${LEGACY_API_VERSION}/connect`, wrap(async (req, res) => {
        if (!legacyAuth(req, res)) return;

        const connectionId = 'legacy-' + Math.random().toString(36) + (+ new Date).toString(36);
        DEBUG.debugConnect && console.log(`Check 1`);
        let connection = zl.act.getConnection(zombie_port);
        if ( ! connection ) {
          connection = await Connect({port:zombie_port}, ConnectOptions);
          zl.act.setConnection(zombie_port,connection)
        }

        await zl.act.addLink({so, forceMeta}, {connectionId, legacy: 'connect', fastest: null, peer: null, socket:null}, zombie_port);
        DEBUG.debugConnect && console.log(`Check 2`);
        forceMeta({
          multiplayer: {
            onlineCount: zl.act.linkStats(zombie_port).onlineCount
          }
        });
        stopShutdownTimer();
        return replyOK(req, res, { connected: true });
      }));

      /**
       * /api/vwin/frame-status
       * Lightweight endpoint for the client to poll if a new frame is available.
       */
      app.get(`/api/${LEGACY_API_VERSION}/frame-status`, wrap(async (req, res) => {
        if (!legacyAuth(req, res)) return;

        const lastKnownTimestamp = parseInt(req.query.last_known_ts) || 0;
        const targetId = zl.act.getActiveTarget(zombie_port);
        if (!targetId) return replyOK(req, res, { fresh: false });

        // PULL from cache first, don't force a capture here. Let the connect/resize do that.
        const fd = await pullIntoCacheIfNeeded(zombie_port, targetId);
        const serverTs = fd && fd.timestamp ? fd.timestamp : 0;

        if (serverTs > lastKnownTimestamp) {
          return replyOK(req, res, { fresh: true, timestamp: serverTs });
        } else {
          return replyOK(req, res, { fresh: false, timestamp: serverTs });
        }
      }));

      /**
       * Helpers for navigation history (unchanged)
       */
      async function getNavigationHistory(sessionId, zombie_port) {
        const { data } = await timedSend({
          name: 'Page.getNavigationHistory',
          params: {},
          sessionId,
        }, zombie_port);
        return data;
      }

      async function navigateHistory(sessionId, direction, zombie_port) {
        const { currentIndex, entries } = await getNavigationHistory(sessionId, zombie_port);
        const newIndex = currentIndex + direction;

        if (newIndex >= 0 && newIndex < entries.length) {
          await timedSend({
            name: 'Page.navigateToHistoryEntry',
            params: { entryId: entries[newIndex].id },
            sessionId,
          }, zombie_port);
          return true;
        }
        return false;
      }

      /**
       * /api/vwin/tabs
       * Returns a list of open tabs and the active target ID.
       */
      app.get(`/api/${LEGACY_API_VERSION}/tabs`, wrap(async (req, res) => {
        if (!legacyAuth(req, res)) return;

        try {
          const { data: { targetInfos: targets } } = await timedSend({
            name: "Target.getTargets",
            params: { filter: [{ type: 'page' }] },
          }, zombie_port);

          if (targets) {
            const filteredTargets = targets.filter(({ targetId, type }) => {
              return AttachmentTypes.has(type) && zl.act.hasSession(targetId, zombie_port) && !zl.act.isOffscreen(targetId, zombie_port);
            });

            const activeTarget = zl.act.getActiveTarget(zombie_port);
            return replyOK(req, res, {
              tabs: filteredTargets.map(({ targetId, title, url }) => ({ targetId, title, url })),
              activeTarget: activeTarget,
            });
          } else {
            return replyOK(req, res, { tabs: [], activeTarget: null });
          }
        } catch (e) {
          console.warn('Legacy API: Could not get tabs from Chrome.', e);
          return replyErr(req, res, 500, "Could not get tabs from remote browser.");
        }
      }));

      app.get(`/api/${LEGACY_API_VERSION}/frame`, wrap(async (req, res) => {
        if (!legacyAuth(req, res)) return;

        try {
          const targetId = zl.act.getActiveTarget(zombie_port);
          if (!targetId) throw new Error("No active tab");

          const st = getState(targetId);
          // MODIFICATION: No longer try to capture here. The resize/connect logic is now responsible.
          // We just serve the best frame we have.
          let fd = cacheTake(targetId) || zl.act.getFrameFromBuffer(zombie_port, targetId) || null;


          if (!fd) {
            // If there's truly nothing, try one last-ditch effort to capture.
            fd = await forceCaptureAndCache(targetId, zombie_port);
          }

          const buf = fd && fd.buffer;
          const ts  = fd && fd.timestamp ? fd.timestamp : 0;
          const etag = `"ts:${ts}"`;

          if (!buf || !buf.length) {
            const px = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7','base64');
            res.set({'Content-Type':'image/gif','Cache-Control':'no-store','ETag':'"empty"'}).send(px);
            return;
          }

          st.lastSentTs = Math.max(st.lastSentTs, ts);

          if (req.headers['if-none-match'] === etag) {
            res.status(304).end();
            return;
          }

          res.set({
            'Content-Type': 'image/jpeg',
            'Content-Length': buf.length,
            'Cache-Control': 'no-store, no-cache, must-revalidate, private',
            'ETag': etag,
            'X-Frame-Timestamp': String(ts),
          });
          res.send(buf);
        } catch (e) {
          const px = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7','base64');
          res.set({'Content-Type':'image/gif','Cache-Control':'no-store','ETag':'"error"'}).send(px);
        }
      }));

      app.get(`/api/${LEGACY_API_VERSION}/event`, wrap(async (req, res) => {
        if (!legacyAuth(req, res)) return;

        const mySource = req.authAs;

        const { type, targetId, url, x, y, deltaY, width, height, events, targetIdToClose } = req.query;
        const sessionId = zl.act.getSessionId(targetId, zombie_port);

        try {
          if (!sessionId && !['switch', 'resize', 'new_tab', 'close_tab', 'key_batch'].includes(type)) {
            throw new Error("No active session for the given targetId.");
          }

          switch (type) {
            case 'mousedown':
              await zl.act.send({ name: "Input.dispatchMouseEvent", params: { type: 'mousePressed', button: 'left', x: parseInt(x), y: parseInt(y), clickCount: 1 }, sessionId }, zombie_port);
              await zl.act.send({ name: "Input.dispatchMouseEvent", params: { type: 'mouseReleased', button: 'left', x: parseInt(x), y: parseInt(y), clickCount: 1 }, sessionId }, zombie_port);
              break;
            case 'navigate':
              await zl.act.send({ name: "Page.navigate", params: { url }, sessionId }, zombie_port);
              break;
            case 'back':
              await navigateHistory(sessionId, -1, zombie_port);
              break;
            case 'forward':
              await navigateHistory(sessionId, 1, zombie_port);
              break;
            case 'switch':
              await zl.act.send({ name: "Target.activateTarget", params: { targetId } }, zombie_port);
              await zl.act.send({ isZombieLordCommand: true, name: "Connection.activateTarget", params: { targetId, source: mySource } }, zombie_port);
              // NEW: Force a capture on tab switch
              if (targetId) {
                forceCaptureAndCache(targetId, zombie_port);
              }
              break;
            case 'resize':
              // MODIFICATION: Force a capture *after* resizing.
              const viewport = { width: parseInt(width), height: parseInt(height), mobile: false };
              zl.act.setViewport(req.query.session_token, viewport, zombie_port);
              // Give the browser a moment to resize, then capture.
              setTimeout(function() {
                const currentTarget = zl.act.getActiveTarget(zombie_port);
                if(currentTarget) {
                  forceCaptureAndCache(currentTarget, zombie_port);
                }
              }, 250); // 250ms delay
              break;
            case 'mousewheel':
              await zl.act.send({ name: "Input.dispatchMouseEvent", params: { type: 'mouseWheel', x: parseInt(x), y: parseInt(y), deltaX: 0, deltaY: parseInt(deltaY) }, sessionId }, zombie_port);
              break;
            case 'new_tab':
              await zl.act.send({ name: "Target.createTarget", params: { url: 'about:blank' } }, zombie_port);
              break;
            case 'close_tab':
              if (targetIdToClose) {
                await zl.act.send({ name: "Target.closeTarget", params: { targetId: targetIdToClose } }, zombie_port);
              }
              break;

            // --- NEW BATCHING LOGIC ---
            case 'key_batch':
              const batch = JSON.parse(events);
              processKeyBatch(batch, sessionId, zombie_port); // fire-and-forget
              break;

            default:
              throw new Error(`Unsupported legacy event type: ${type}`);
          }

          res.status(200).send('OK');
        } catch (e) {
          console.warn(`Legacy API: Failed to handle event '${type}'.`, e.message);
          res.status(500).send(`{"error":"Failed to handle event: ${e.message}"}`);
        }
      }));

      // Helper for legacy key events
      function findKeyDefinition(keyCode) {
        for (const key in KEYS) {
          if (KEYS[key].keyCode === keyCode) {
            return KEYS[key];
          }
        }
        return null;
      }

      async function processKeyBatch(batch, sessionId, zombie_port) {
        if (!batch || !Array.isArray(batch)) return;

        for (const keyEvent of batch) {
          let definition;
          if ( keyEvent.p ) {
            definition = KEYS[keyEvent.p];
          } else {
            definition = findKeyDefinition(keyEvent.k);
          }
          console.log(keyEvent, definition);
          if (definition) {
            const [Down, Up] = KEYS.keyEvent(definition.key);
            let modifiers = 0;
            if (keyEvent.a) modifiers |= 1; // a = altKey
            if (keyEvent.c) modifiers |= 2; // c = ctrlKey
            if (keyEvent.s) modifiers |= 8; // s = shiftKey

            Down.command.params.modifiers = modifiers;
            Down.command.sessionId = sessionId;
            Up.command.params.modifiers = modifiers;
            Up.command.sessionId = sessionId;

            zl.act.send(Down.command, zombie_port);
            zl.act.send(Up.command, zombie_port);
          }
        }
      }
    }

    function addHandlers() {
      // Legacy API Handlers (Win9x compatibility mode, etc)

      if ( CONFIG.win9xCompatibility ) {
        addLegacyHandlers();
      }
      // Legacy END
      const CACHE_EXPIRY = 3 * 60 * 1000;
      let torExitList;
      let cachExpired = true;
      // core app interface functions
        app.get(`/api/${version}/tabs`, wrap(async (req, res) => {
          const cookie = req.cookies[COOKIENAME+port] || req.query[COOKIENAME+port] || req.headers['x-browserbox-local-auth'];
          const st = req.query.sessionToken;
          DEBUG.debugCookie && console.log('look for cookie', COOKIENAME+port, 'found: ', {cookie, allowed_user_cookie});
          DEBUG.debugCookie && console.log('all cookies', req.cookies);
          res.type('json');
          if ( (cookie !== allowed_user_cookie) && st !== session_token ) {
            return res.status(401).send('{"err":"forbidden"}');
          }
          requestId++;
          res.type('json');

          let targets, vmPaused, modal;

          try {
            ({data:{targetInfos:targets, vmPaused, modal}} = await timedSend({
              name: "Target.getTargets",
              params: {
                filter: [
                  {type: 'page'},
                  ...(DEBUG.attachToServiceWorkers ? [
                    {type: 'service_worker'}
                  ] : []),
                ]
              },
            }, zombie_port));

            if ( targets ) {
              if ( targets?.length === 1 ) {
                zl.act.setHiddenTarget(targets[0].targetId, zombie_port);
              }
              targets = targets.filter(({targetId,type,url}) => { 
                if ( !AttachmentTypes.has(type) ) return false;
                /*
                if ( url.startsWith('chrome') ) {
                  return false;
                }
                */
                if ( ! zl.act.hasSession(targetId, zombie_port) ) {
                  if ( DEBUG.restoreSessions && ! StartupTabs.has(targetId) ) { 
                    DEBUG.restore && console.info(`Sent 'attach' to tab target ${targetId}`);
                    StartupTabs.add(targetId);
                    zl.act.send({
                      name: "Target.attachToTarget",
                      params: {
                        targetId,
                        flatten: true
                      }
                    }, zombie_port);
                  } else {
                    return false;
                  }
                }
                if ( zl.act.isOffscreen(targetId, zombie_port) ) {
                  return false;
                }
                return true;
              });
              targets = targets.map(t => {
                if ( !TabNumbers.has(t.targetId) ) {
                  TabNumber++;
                  TabNumbers.set(t.targetId, TabNumber);
                }
                t.number = TabNumbers.get(t.targetId);
                return t;
              });
              targets.sort(({number:A}, {number:B}) => A - B);

              const activeTarget = zl.act.getActiveTarget(zombie_port);
              zl.act.addTargets(targets, zombie_port);
              res.end(JSON.stringify({tabs:targets,activeTarget,requestId,vmPaused, modal}));
            } else {
              res.end(JSON.stringify({vmPaused, modal}));
            }
          } catch(e) {
            console.warn('No target data from chrome. Normally means the VM is paused or Chrome is not open.', e);
            /*throw e;*/
          }
        }));
        app.get(`/extensions`, VeryConstrainedRateLimiter, (req, res) => {
          const cookie = req.cookies[COOKIENAME+port] || req.query[COOKIENAME+port] || req.headers['x-browserbox-local-auth'];
          const st = req.query.sessionToken;
          DEBUG.debugCookie && console.log('look for cookie', COOKIENAME+port, 'found: ', {cookie, allowed_user_cookie});
          DEBUG.debugCookie && console.log('all cookies', req.cookies);
          res.type('json');
          if ( (cookie !== allowed_user_cookie) && st !== session_token ) {
            return res.status(401).send('{"err":"forbidden"}');
          }
          res.set('Cache-Control', 'public, max-age=13');
          populateExtensions();
          return res.send({extensions});
        });
        app.get(`/isTor`, (req, res) => {
          const cookie = req.cookies[COOKIENAME+port] || req.query[COOKIENAME+port] || req.headers['x-browserbox-local-auth'];
          const st = req.query.sessionToken;
          DEBUG.debugCookie && console.log('look for cookie', COOKIENAME+port, 'found: ', {cookie, allowed_user_cookie});
          DEBUG.debugCookie && console.log('all cookies', req.cookies);
          res.type('json');
          if ( (cookie !== allowed_user_cookie) && st !== session_token ) {
            return res.status(401).send('{"err":"forbidden"}');
          }
          const data = {};
          if ( CONFIG.useTorProxy ) {
            data.isTor = true;
          } else {
            data.isTor = false;
          }
          res.end(JSON.stringify(data));
        });
        app.get(`/isZeta`, (req, res) => {
          const cookie = req.cookies[COOKIENAME+port] || req.query[COOKIENAME+port] || req.headers['x-browserbox-local-auth'];
          const st = req.query.sessionToken;
          DEBUG.debugCookie && console.log('look for cookie', COOKIENAME+port, 'found: ', {cookie, allowed_user_cookie});
          DEBUG.debugCookie && console.log('all cookies', req.cookies);
          res.type('json');
          if ( (cookie !== allowed_user_cookie) && st !== session_token ) {
            return res.status(401).send('{"err":"forbidden"}');
          }
          const data = {};
          if ( CONFIG.hostPerService ) {
            data.isZeta = true;
          } else {
            data.isZeta = false;
          }
          res.end(JSON.stringify(data));
        });
        app.get(`/torExit`, wrap(async (req, res) => {
          res.type('json');
          const data = {};
          let error;

          let clientIP = req.ip || req.connection.remoteAddress;

          clientIP = clientIP.replace('::ffff:', '');
            
          try {
            if ( ! torExitList || cacheExpired ) {
              cacheExpired = false;
              torExitList = await fetch('https://check.torproject.org/torbulkexitlist').then(r => r.text());
              setTimeout(() => cacheExpired = true, CACHE_EXPIRY);
            }
            const torExitSet = new Set(
              torExitList
                .split(/\n/g)
                .map(line => line.trim())
                .filter(line => line.length)
            );
            data.status = torExitSet.has(clientIP) ? 'tor-exit' : 'non-tor-exit';
          } catch(error) {
            data.error = error;
          }

          res.end(JSON.stringify(data));
        }));
        app.get(`/isSubscriber`, (req, res) => {
          const cookie = req.cookies[COOKIENAME+port] || req.query[COOKIENAME+port] || req.headers['x-browserbox-local-auth'];
          const st = req.query.sessionToken;
          DEBUG.debugCookie && console.log('look for cookie', COOKIENAME+port, 'found: ', {cookie, allowed_user_cookie});
          DEBUG.debugCookie && console.log('all cookies', req.cookies);
          res.type('json');
          if ( (cookie !== allowed_user_cookie) && st !== session_token ) {
            return res.status(401).send('{"err":"forbidden"}');
          }
          const data = {};
          if ( CONFIG.isSubscriber ) {
            data.isSubscriber = true;
          } else {
            data.isSubscriber = false;
          }
          res.end(JSON.stringify(data));
        });
        app.get(`/expiry_time`, (req, res) => {
          const cookie = req.cookies[COOKIENAME+port] || req.query[COOKIENAME+port] || req.headers['x-browserbox-local-auth'];
          const st = req.query.sessionToken;
          DEBUG.debugCookie && console.log('look for cookie', COOKIENAME+port, 'found: ', {cookie, allowed_user_cookie});
          DEBUG.debugCookie && console.log('all cookies', req.cookies);
          res.type('json');
          if ( (cookie !== allowed_user_cookie) && st !== session_token ) {
            return res.status(401).send('{"err":"forbidden"}');
          }
          const data = {};
          if ( CONFIG.isSubscriber ) {
            data.expiry_time = 0;
          } else {
            try {
              data.expiry_time = fs.readFileSync(CONFIG.expiryTimeFilePath).toString().trim();
            } catch(e) {
              console.info(`Cannot read expiry time`);
              DEBUG.showFileErrors && console.warn(e);
              data.expiry_time = 0;
            }
          }
          res.end(JSON.stringify(data));
        });
        app.get("/settings_modal", (req, res) => {
          const cookie = req.cookies[COOKIENAME+port] || req.query[COOKIENAME+port] || req.headers['x-browserbox-local-auth'];
          const st = req.query.sessionToken;
          DEBUG.debugCookie && console.log('look for cookie', COOKIENAME+port, 'found: ', {cookie, allowed_user_cookie});
          DEBUG.debugCookie && console.log('all cookies', req.cookies);
          if ( (cookie !== allowed_user_cookie) && st !== session_token ) {
            return res.status(401).send('{"err":"forbidden"}');
          }
          res.status(200).send(` 
            <form method=POST>
              <fieldset>
                <!--
                <button formaction=/restart_app>Restart app</button>
                !-->
                <button formaction=/stop_app>Close BrowserBox and release seat</button>
                <!--
                <button formaction=/stop_browser>Stop browser</button>
                !-->
              </fieldset>
            </form>
            <iframe style=display:none name=results>
          `);
        });
        app.post("/file", async (req,res) => {
          const cookie = req.cookies[COOKIENAME+port] || req.query[COOKIENAME+port] || req.headers['x-browserbox-local-auth'];
          const {token} = req.body;
          DEBUG.fileDebug && console.log(req.files, req.body, {token});
          if ( (cookie !== allowed_user_cookie) && token != session_token ) { 
            DEBUG.debugFileUpload && console.log(`Request for file upload forbidden.`, req.files);
            return res.status(401).send('{"err":"forbidden"}');
          }
          DEBUG.fileDebug && console.log(req.files, req.body, {token});
          const {files} = req;
          const sessionId = req.body.sessionid || req.body.sessionId;
          const contextId = OurWorld.get(sessionId);
          const backendNodeId = fileChoosers.get(sessionId);
          DEBUG.debugFileUpload && console.log('File choosers get', fileChoosers, `sessionId: ${sessionId}`, {backendNodeId});
          const action = ! files || files.length == 0 ? 'cancel' : 'accept';
          const fileInputResult = await zl.act.send({
            name:"Runtime.evaluate",
            params: {
              expression: "self.zombieDosyLastClicked.fileInput",
              contextId,
            }, 
            definitelyWait: true,
            sessionId
          }, zombie_port);
          DEBUG.debugFileUpload && console.log({fileInputResult, s:JSON.stringify(fileInputResult)});
          const objectId = fileInputResult?.data?.result?.objectId;
          let result;
            
          if ( objectId || backendNodeId ) {
            const command = {
              name: "DOM.setFileInputFiles",
              params: {
                files: files && files.map(({path}) => path),
                backendNodeId,
                objectId,
              },
              sessionId
            };
            DEBUG.debugFileUpload && console.log("We need to send the right command to the browser session", files, sessionId, action, command);
            try {
              result = await zl.act.send(command, zombie_port);
            } catch(e) {
              console.log("Error sending file input command", e);
            }
          } else {
            result = {error: fileInputResult.data.exceptionDetails || 'unknown error'}
          }

          DEBUG.debugFileUpload && console.log(JSON.stringify({fileResult:result}, null, 2));

          if ( !result || result.error ) {
            res.status(500).send(JSON.stringify({error:'there was an error attaching the files'}));
          } else {
            result = {
              success: true,
              files: files.map(({originalname,size}) => ({name:originalname,size}))
            };
            DEBUG.val > DEBUG.med && console.log("Sent files to file input", result, files);
            res.json(result);
          }
          forceMeta({fileChooserClosed:{sessionId}});
          DEBUG.fileDebug && console.log('force meta called');
        }); 
      // fun / extra app data getters
        app.get('/tabs/:tabId', wrap(async (req, res) => {
          const cookie = req.cookies[COOKIENAME+port] || req.query[COOKIENAME+port] || req.headers['x-browserbox-local-auth'];
          DEBUG.debugCookie && console.log('look for cookie', COOKIENAME+port, 'found: ', {cookie, allowed_user_cookie});
          DEBUG.debugCookie && console.log('all cookies', req.cookies);
          res.type('json');
          if ( (cookie !== allowed_user_cookie) ) {
            return res.status(401).send('{"err":"forbidden"}');
          }
          const data = await runCurl(`curl http://${DEBUG.useLoopbackIP ? '127.0.0.1' : 'localhost'}:${zombie_port}/json`);
          const targets = JSON.parse(data);
          const target = targets.filter(({id:t}) => t == req.params.tabId);
          res.send(JSON.stringify({target},null,2));
        }));
      // app meta controls
        app.post("/stop_app", ConstrainedRateLimiter, (req, res) => {
          res.type('html');
          const cookie = req.cookies[COOKIENAME+port] || req.query[COOKIENAME+port] || req.headers['x-browserbox-local-auth'];
          const url = new URL(req.url, `${req.protocol}://${req.headers.host}`);
          const qp = url.searchParams.get('session_token');
          if ( (cookie !== allowed_user_cookie) && qp != session_token ) { 
            return res.status(401).send('{"err":"forbidden"}');
          }
          /**
            call process.exit() if pm2 not running us.
            if pm2 running us, call pm2 delete (our name)
          **/
          // queue a task to provide some time for jobs to complete on exit
          setTimeout(() => console.log('Exiting...'), 5000);
          console.log(process.env, process.argv, process.title);
          if ( process.env.PM2_USAGE && process.env.name ) {
            DEBUG.debugRestart && console.log(`Is pm2. Deleting pm2 name`, process.env.name);
            try {
              setTimeout(() => executeShutdownOfBBPRO(), 1000);
              return res.status(200).send('Stopped');
            } catch(e) {
              console.warn(e);
              stop();
            }
          } else {
            DEBUG.debugRestart && console.log(`Is not pm2. Exiting process`);
            stop();
          }
        });
      // app integrity check
        app.get("/integrity", ConstrainedRateLimiter, (req, res) => {
          const cookie = req.cookies[COOKIENAME+port] || req.query[COOKIENAME+port] || req.headers['x-browserbox-local-auth'];
          const url = new URL(req.url, `${req.protocol}://${req.headers.host}`);
          const qp = url.searchParams.get('session_token');
          if ( (cookie !== allowed_user_cookie) && qp != session_token ) { 
            return res.status(401).send('{"err":"forbidden"}');
          }
          res.type('text');
          res.status(200).send(INTEGRITY_FILE_CONTENT);
        });
      // error handling middleware
        app.use('/*path', (err, req, res, next) => {
          try {
            res.type('json');
          } finally {
            let message = '';
            if ( DEBUG.dev && DEBUG.val ) {
              message = s({error: { msg: err.message, stack: err.stack.split(/\n/g) }});
            } else {
              message = s({error: err.message || err+'', resetRequired:true});
            }
            res.write(message);
            res.end();
            if ( DEBUG.val ) {
              console.warn(err);
            }
            next();
          }
        });
    }

    function forceMeta(...metas) {
      (DEBUG.logMeta || DEBUG.metaDebug) && console.log("meta", ...metas);
      zl.act.fanOut(socket => so(
        socket,
        {
          meta:[
            ...metas
          ]
        }
      ), zombie_port);
    }

    function so(socket, message) {
      if ( !message ) return;

      if ( DEBUG.metaDebug && message.messageId ) {
        DEBUG.val && console.log("Server sending messageId", message.messageId, message.id);
        if ( Sent.has(message.messageId) ) {
          console.warn('Already sent a message with that ID!', message.messageId, Sent.get(message.messageId), 'versus', message);
        } else {
          Sent.set(message.messageId, message);
          DEBUG.val && console.log('Sending message id', message.messageId, 'for first time', message);
        }
      }

      if ( message instanceof Buffer ) {
        message;
      } else {
        if ( message.data ) {
          message.data = message.data.filter(x => !!x && Object.getOwnPropertyNames(x).length);
        }
        message = JSON.stringify(message);
      }

      try {
        if ( socket ) {
          socket.send(message);
        }
      } catch(e) {
        // client has disconnected
        DEBUG.val && console.warn(`${socket} error with sending message`, e, message);
        if ( ! socket && websockets.size === 0 && zl.act.zombieIsDead(zombie_port) ) {
          console.log(`Zombie Chrome is dead and there are no clients. Shutting down.`);
          try {
            shutDown();
          } catch(e2) {
            console.warn(`error exit`, e2);
          }
          shutDown();
        }
      }
    }

    function runMessageQueue() {
      if ( messageQueueRunning ) return;
      messageQueueRunning = true;
      while( Queue.funcs.length ) {
        const func = Queue.funcs.shift();
        /*
        try {
          await func();
        } catch(e) {
          console.warn("error while running message queue", e);
        }
        */
        func();
        // await sleep(TIME_BETWEEN_MESSAGES);
      }
      messageQueueRunning = false;
    }

    // helpers
      function wrap(fn) {
        return async function handler(req, res, next) {
          try {
            await fn(req, res, next);
          } catch(e) {
            if ( DEBUG.val ) {
              console.info(`caught error in ${fn}`, e);
            }
            next(e);
          }
        }
      }

      function s(o) {
        let r;
        if ( typeof o == "string" ) r = 0;
        else try {
          r = JSON.stringify(o, null, 2);
        } catch(e) {
          DEBUG.val > DEBUG.hi && console.warn(e);
        }
        try {
          r = r + '';
        } catch(e) {
          DEBUG.val > DEBUG.hi && console.warn(e);
        }
        return r;
      }
  }

  export function getInjectableAssetPath() {
    if ( ! serverOrigin ) {
      throw new ReferenceError`
        serverOrigin has not been set at time of call to getInjectableAssetPath
      `;
    }
    return `${serverOrigin}/assets`;
  }

  function ensureManifestDepth(manifestPath) {
    const parts = manifestPath.split(path.sep);
    const file = path.basename(manifestPath);
    if ( file != 'manifest.json' ) throw new Error(`manifest.json does not end path`);
    let distance = 0;
    while(parts.length) {
      const part = parts.pop();
      if ( part == 'manifest.json' ) {
        if ( distance != 0 ) throw new Error(`manifest.json exists mid path`);
        continue;
      } else {
        distance++;
      }
      if ( part.length == 32 && part.match(/^[a-z]+$/) ) {
        if ( distance > 2 ) {
          throw new Error(`manifest.json is nested too deeply in extension direcotry`);
        } else {
          return part;
        }
      }
    }
  }

  function localizeExtensionManifest({extensionSettings, extensionPath, manifest}) {
    const keysToLocalize = ['short_name', 'name', 'description'];
    const localesDir = path.resolve(extensionPath, '_locales');
    if ( !fs.existsSync(localesDir) ) return manifest;
    let localeMessages;
    try {
      const localeMessagesJSON = 
          manifest.default_locale && 
            fs.existsSync(path.resolve(localesDir, manifest.default_locale, 'messages.json')) ? 
            fs.readFileSync(path.resolve(localesDir, manifest.default_locale, 'messages.json')).toString()
            :
          extensionSettings.manifest.current_locale && 
            fs.existsSync(path.resolve(localesDir, extensionSettings.manifest.current_locale, 'messages.json')) ? 
            fs.readFileSync(path.resolve(localesDir, extensionSettings.manifest.current_locale, 'messages.json')).toString()
            :
          extensionSettings.manifest.default_locale && 
            fs.existsSync(path.resolve(localesDir, extensionSettings.manifest.default_locale, 'messages.json')) ? 
              fs.readFileSync(path.resolve(localesDir, extensionSettings.manifest.default_locale, 'messages.json')).toString()
            :
            ''
      if ( ! localeMessagesJSON || localeMessagesJSON.trim().length == 0 ) {
        console.warn(`Error localizing extension`, {extensionSettings, extensionPath, manifest, localeMessagesJSON});
        return manifest;
      }
      localeMessages = JSON.parse(localeMessagesJSON);
    } catch(e) {
        console.warn(`Error localizing extension`, {extensionSettings, extensionPath, manifest}, e);
    }
    if ( ! localeMessages ) return manifest;

    for( const key of keysToLocalize ) {
      let value, messageKey, localizedMessage;
      try {
        value = manifest[key];
        if ( value?.startsWith?.("__MSG_") ) {
          messageKey = value.replace(/^__MSG_/, '').replace(/__$/, '')
          localizedMessage = (localeMessages[messageKey] || localeMessages[messageKey.toLocaleLowerCase()]).message;
          manifest[key] = localizedMessage;
        }
      } catch(e) {
        console.warn(`Error localizing key: ${key}`, e, {value, messageKey, localizedMessage, extensionSettings, extensionPath, manifest}); 
      }
    }

    return manifest;
  }

  function nextFileName(ext = '') {
    //console.log({nextFileName:{ext}});
    if ( ! ext.startsWith('.') ) {
      ext = '.' + ext;
    }
    const name = `file${(Math.random()*1000000).toString(36)}${ext}`;
    //console.log({nextFileName:{name}});
    return name;
  }

  function startShutdownTimer() {
    if ( shutdownTimer ) return;
    console.log(`Starting BrowserBox shutdown timer on all clients disconnected`);
    shutdownTimer = setTimeout(executeShutdownOfBBPRO, SHUTDOWN_MINUTES);
  }

  function stopShutdownTimer() {
    clearTimeout(shutdownTimer);
    console.log(`Stopped BrowserBox shutdown timer on a client connected`);
    shutdownTimer = null;
  }

  async function executeShutdownOfBBPRO() {
    console.warn(`Stopping BrowserBox`);
    await globalThis.shutDown();
    return stop();
  }

  function populateExtensions() {
    extensions.length = 0;
    if ( CONFIG.isCT && DEBUG.extensionsAccess ) {
      try {
        const preferencesPath = path.resolve(BASE_PATH, 'browser-cache', 'Default', 'Preferences');
        const preferences = JSON.parse(fs.readFileSync(preferencesPath).toString());
        const extensionsManifests = child_process.execSync(`find "${EXTENSIONS_PATH}" | grep manifest.json`).toString();
        extensionsManifests.split('\n').forEach(manifestPath => {
          if ( manifestPath.trim().length == 0 ) return;
          try {
            manifestPath = path.resolve(manifestPath);
            const extensionId = ensureManifestDepth(manifestPath);
            const manifestJSON = fs.readFileSync(manifestPath).toString();
            const manifest = JSON.parse(manifestJSON);
            if ( ! manifest.name || ! manifest.version || ! manifest.manifest_version ) {
              console.warn({manifest});
              throw new Error(`Incorrect manifest. Will ignore: ${manifestPath}`)
            }
            const extensionPath = path.dirname(manifestPath);
            const extensionSettings = preferences.extensions.settings[extensionId];
            const localizedManifest = localizeExtensionManifest({extensionSettings, extensionPath, manifest});
            // check for a well known popup location
            if ( ! localizedManifest?.action?.default_popup && fs.existsSync(path.resolve(path.dirname(manifestPath), 'popup.html')) ) {
              localizedManifest.action.default_popup = 'popup.html';
            }
            if ( ! localizedManifest?.side_panel?.default_path && fs.existsSync(path.resolve(path.dirname(manifestPath), 'sidepanel.html')) ) {
              localizedManifest.action.default_path = 'sidepanel.html';
            }
            if ( localizedManifest.display_in_launcher !== false ) {
              if ( extensionSettings.state === 0 ) {
                extensions.push({id: extensionId, enabled: false, ...localizedManifest});
              } else {
                extensions.push({id: extensionId, enabled: true, ...localizedManifest});
              }
            }
          } catch(e) {
            console.warn(`Error handling supposed extension path ${manifestPath}, via: ${EXTENSIONS_PATH}`, e);
          }
        });
      } catch(e) {
        console.warn(`Could not get manifests for extensions at: ${EXTENSIONS_PATH}`, e);
      }
    }
    DEBUG.showExtensions && console.log({extensions});
  }

  /**
   * Wrapper to run curl commands in Node.js
   * @param {string} command - The curl command to execute.
   * @param {boolean} isAsync - Whether to run the command asynchronously. Default is true.
   * @returns {Promise<string> | string} - Resolves with the output if async, or returns the output if sync.
   */
  function runCurl(command, isAsync = true) {
    if (!command.startsWith('curl')) {
      throw new Error('Command must start with "curl".');
    }

    if (isAsync) {
      return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
          if (error) {
            reject(`Error: ${stderr || error.message}`);
            return;
          }
          resolve(stdout);
        });
      });
    } else {
      try {
        return execSync(command, { encoding: 'utf-8' });
      } catch (error) {
        throw new Error(`Error: ${error.stderr || error.message}`);
      }
    }
  }

