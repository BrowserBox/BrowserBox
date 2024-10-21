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
    CONFIG,
    ALLOWED_3RD_PARTY_EMBEDDERS,
    BASE_PATH,
    EXTENSIONS_PATH,
    throttle,
  } from './common.js';
  import {timedSend, eventSendLoop} from './server.js';
  import {MIN_TIME_BETWEEN_SHOTS, WEBP_QUAL} from './zombie-lord/screenShots.js';

  let WRTC;
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
    
    const ConstrainedRateLimiter = rateLimit({
      windowMs: 10000,
      max: 1,
      message: `
        Too many requests from this IP. Please try again in a little while.
      `
    });
    
    const VeryConstrainedRateLimiter = rateLimit({
      windowMs: 30000,
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

  // extensions
  export const extensions = [];

  let shutdownTimer = null;
  let serverOrigin;
  let messageQueueRunning = false;
  let requestId = 0;
  let TabNumber = 0;

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
        "https://localhost:*",
        "https://*.dosyago.com:*",
        "https://browse.cloudtabs.net:*",
        ...(process.env.TORBB ? [
          `https://${process.env[`ADDR_${server_port}`]}:*`, // main service (for data: urls seemingly)
          `https://${process.env[`ADDR_${server_port - 2}`]}:*`, // audio onion service
        ] : [
          `https://${process.env.DOMAIN}:*`, // main service (for data: urls seemingly)
          `https://*.${process.env.DOMAIN}:*`, // main service (for data: urls seemingly)
        ])
      ],
      frameSrc: [
        "'self'",
        "https://localhost:*",
        "https://link.local:*",
        "https://browse.cloudtabs.net:*",
        "https://*.dosyago.com:*",
        ...(process.env.TORBB ? [
          `https://${process.env[`ADDR_${server_port - 2}`]}:*`, // audio onion service
        ] : [
          `https://*.${process.env.DOMAIN}:*`, // main service (for data: urls seemingly)
          `https://${process.env.DOMAIN}:*`, // main service (for data: urls seemingly)
        ])
      ],
      connectSrc: [
        "'self'",
        "wss://*.dosyago.com:*",
        "wss://localhost:*",
        "wss://link.local:*",
        `https://*.dosyago.com:${server_port-1}`,
        `https://*.dosyago.com:${server_port+1}`,
        "https://browse.cloudtabs.net:*",
        "https://browse.cloudtabs.net",
        "wss://browse.cloudtabs.net:*",
        `https://localhost:${server_port-1}`,
        `https://localhost:${server_port+1}`,
        `https://link.local:${server_port-1}`,
        `https://link.local:${server_port+1}`,
        ...CONFIG.connectivityTests,
        ...(process.env.TORBB ? [
          `https://${process.env[`ADDR_${server_port}`]}:*`, // main service 
          `https://${process.env[`ADDR_${server_port - 2}`]}:*`, // audio onion service
          `https://${process.env[`ADDR_${server_port + 1}`]}:*`, // devtools
          `https://${process.env[`ADDR_${server_port + 2}`]}:*`, // docs
        ] : [
          `https://${process.env.DOMAIN}:*`, // main service (for data: urls seemingly)
          `https://*.${process.env.DOMAIN}:*`, // main service (for data: urls seemingly)
          `wss://${process.env.DOMAIN}:*`, // main service (for data: urls seemingly)
          `wss://*.${process.env.DOMAIN}:*`, // main service (for data: urls seemingly)
        ]),
        // for checking if access via TOR
        "https://check.torproject.org/"
      ],
      fontSrc: [
        "'self'", 
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
        "https://fonts.gstatic.com"
      ],
      styleSrc: [
        "'self'", 
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
        "https://fonts.gstatic.com"
      ],
      scriptSrc: [
        "'self'", 
        "'unsafe-eval'",
        "'unsafe-inline'",
        "https://browse.cloudtabs.net:*",
        "https://*.dosyago.com:*"
      ],
      scriptSrcAttr: [
        "'self'",
        "'unsafe-inline'"
      ],
      frameAncestors: [
        "'self'",
        "https://browse.cloudtabs.net:*",
        "https://*.dosyago.com:*",
        ...ALLOWED_3RD_PARTY_EMBEDDERS
      ],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    };
    const sockets = new Set();
    const websockets = new Set();
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
              "https://*.dosyago.com:*"
            ],
            frameSrc: [
              "'self'",
              "https://*.dosyago.com:*"
            ],
            connectSrc: [
              "'self'",
              "wss://*.dosyago.com:*",
              "wss://localhost:*",
              "https://browse.cloudtabs.net",
              `https://*.dosyago.com:${server_port-1}`,
              `https://*.dosyago.com:${server_port+1}`,
              `https://localhost:${server_port-1}`,
              `https://localhost:${server_port+1}`,
              ...CONFIG.connectivityTests
            ],
            fontSrc: [
              "'self'", 
              "'unsafe-inline'",
              "https://fonts.googleapis.com",
              "https://fonts.gstatic.com"
            ],
            styleSrc: [
              "'self'", 
              "'unsafe-inline'",
              "https://fonts.googleapis.com",
              "https://fonts.gstatic.com"
            ],
            scriptSrc: [
              "'self'", 
              "'unsafe-eval'",
              "'unsafe-inline'",
              "https://*.dosyago.com:*"
            ],
            scriptSrcAttr: [
              "'self'",
              "'unsafe-inline'"
            ],
            frameAncestors: [
              "'self'",
              "https://*.dosyago.com:*",
              ...ALLOWED_3RD_PARTY_EMBEDDERS
            ],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
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
          if ( process.env.TORBB ) {
            const zVal = encodeURIComponent(btoa(JSON.stringify({
              x: process.env[`ADDR_${server_port-2}`],  // audio port onion service
              y: process.env[`ADDR_${server_port+1}`],  // devtools port onion service
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
    /*
    if ( process.env.TORBB ) {
      app.get("/torca/rootCA.pem", (req, res) => res.sendFile(path.resolve(process.env.TORCA_CERT_ROOT, 'rootCA.pem')));
    }
    */
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
    const shutDown = (sig) => {
      console.log(`Shutdown requested. Signal: ${sig}`);
      if ( shuttingDown ) return;
      shuttingDown = true;
      server.close(() => console.info(`Server closed on SIGINT`));
      peers.forEach(peer => {
        try {
          peer.destroy(`Server going down.`);
        } catch(e) {
          DEBUG.debugConnect && console.info(`Error closing peer`, e, peer);
        }
      });
      websockets.forEach(ws => {
        try {
          ws.close(1001, "server going down");
        } catch(e) {
          DEBUG.debugConnect && console.info(`Error closing websocket`, e, ws);
        }
      });
      sockets.forEach(socket => {
        try { socket.destroy() } catch(e) { 
          DEBUG.socDebug && console.warn(`MAIN SERVER: port ${server_port}, error closing socket`, e) 
        }
      });
      process.exit(0);
    };

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
        query = new URL(`https://localhost${req.url}`).searchParams;
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

            latestMessageId = messageId;

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
                    if ( DEBUG.restoreSessions ) { 
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
          DEBUG.debugConnect && console.log(`Check 4`);
          let resolve;
          const pr = new Promise(res => resolve = res);
          peer = new Peer({
            wrtc: WRTC, trickle: true, initiator: true,
            channelConfig: {
              ordered: true,
              maxRetransmits: 0,
              /*maxPacketLifeTime: MIN_TIME_BETWEEN_SHOTS()*/
            }
          });
          DEBUG.debugConnect && console.log(`Check 5`);
          peer.on('error', err => {
            DEBUG.val && console.log('webrtc error', err);
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
            DEBUG.val && console.log('peer closed', c);
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

    server.listen(server_port, async err => {
      if ( err ) {
        console.error('err', err);
        process.exit(0);
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
    process.on('SIGUSR1', shutDown);
    process.on('SIGUSR2', shutDown);
    process.on('beforeExit', shutDown);
    process.on('exit', shutDown);

    DEBUG.alwaysStartShutdownTimer && startShutdownTimer();

    return server;

    function addHandlers() {
      // core app interface functions
        app.get(`/api/${version}/tabs`, wrap(async (req, res) => {
          const cookie = req.cookies[COOKIENAME+port] || req.query[COOKIENAME+port] || req.headers['x-browserbox-local-auth'];
          DEBUG.debugCookie && console.log('look for cookie', COOKIENAME+port, 'found: ', {cookie, allowed_user_cookie});
          DEBUG.debugCookie && console.log('all cookies', req.cookies);
          if ( (cookie !== allowed_user_cookie) ) {
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
                  if ( DEBUG.restoreSessions ) { 
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
          DEBUG.debugCookie && console.log('look for cookie', COOKIENAME+port, 'found: ', {cookie, allowed_user_cookie});
          DEBUG.debugCookie && console.log('all cookies', req.cookies);
          res.type('json');
          if ( (cookie !== allowed_user_cookie) ) {
            return res.status(401).send('{"err":"forbidden"}');
          }
          res.set('Cache-Control', 'public, max-age=13');
          populateExtensions();
          return res.send({extensions});
        });
        app.get(`/isTor`, (req, res) => {
          const cookie = req.cookies[COOKIENAME+port] || req.query[COOKIENAME+port] || req.headers['x-browserbox-local-auth'];
          DEBUG.debugCookie && console.log('look for cookie', COOKIENAME+port, 'found: ', {cookie, allowed_user_cookie});
          DEBUG.debugCookie && console.log('all cookies', req.cookies);
          res.type('json');
          if ( (cookie !== allowed_user_cookie) ) {
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
        app.get(`/torExit`, wrap(async (req, res) => {
          res.type('json');
          const data = {};
          let error;

          let clientIP = req.ip || req.connection.remoteAddress;

          clientIP = clientIP.replace('::ffff:', '');
            
          try {
            const torExitList = await fetch('https://check.torproject.org/torbulkexitlist').then(r => r.text());
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
          DEBUG.debugCookie && console.log('look for cookie', COOKIENAME+port, 'found: ', {cookie, allowed_user_cookie});
          DEBUG.debugCookie && console.log('all cookies', req.cookies);
          res.type('json');
          if ( (cookie !== allowed_user_cookie) ) {
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
          DEBUG.debugCookie && console.log('look for cookie', COOKIENAME+port, 'found: ', {cookie, allowed_user_cookie});
          DEBUG.debugCookie && console.log('all cookies', req.cookies);
          res.type('json');
          if ( (cookie !== allowed_user_cookie) ) {
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
          if ( (cookie !== allowed_user_cookie) ) { 
            return res.status(401).send('{"err":"forbidden"}');
          }
          res.status(200).send(` 
            <form method=POST target=results>
              <fieldset>
                <button formaction=/restart_app>Restart app</button>
                <button formaction=/stop_app>Stop app</button>
                <button formaction=/stop_browser>Stop browser</button>
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
      // app meta controls
        app.post("/restart_app", ConstrainedRateLimiter, (req, res) => {
          const cookie = req.cookies[COOKIENAME+port] || req.query[COOKIENAME+port] || req.headers['x-browserbox-local-auth'];
          const url = new URL(req.url, `${req.protocol}://${req.headers.host}`);
          const qp = url.searchParams.get('session_token');
          if ( (cookie !== allowed_user_cookie) && qp != session_token ) { 
            return res.status(401).send('{"err":"forbidden"}');
          }
           /**
              1. queue a restart task
              2. add an exit handler
                a. in exit handler check if pm2 is running us
                process.env.PM2_USAGE && process.env.name exists
                b. then call child_process.spawn
              3. call process exit.
              That's it
           **/
          if ( DEBUG.ensureUptimeBeforeRestart && process.uptime() < T2_MINUTES ) {
            DEBUG.debugRestart && console.info(`Denying restart request, reason: app is up for less than 2 minutes`);
            return res.status(403).send("deny");
          }
          let norestart = false;
          DEBUG.debugRestart && console.info(`Queueing restart task...`);
          timer = setTimeout(function () {
            // Listen for the 'exit' event.
            // This is emitted when our app exits.
            DEBUG.debugRestart && console.info(`Adding exit handler`);
            process.on("exit", function () {
              if ( process.env.PM2_USAGE && process.env.name ) {
                DEBUG.debugRestart && console.info(`pm2 is running us, switching off restart and just exiting,
                  as pm2 will restart us.`);
                norestart = true;
              }
              if ( norestart ) {
                DEBUG.debugRestart && console.info(`Not restarting this time.`);
              }
              DEBUG.debugRestart && console.info(`Spawning new process`, process.argv);
              child_process.spawn(
                process.argv.shift(),
                process.argv,
                {
                  cwd: process.cwd(),
                  detached: true,
                  stdio: "inherit"
                }
              );
            });
            DEBUG.debugRestart && console.info(`Exiting parent process`);
            process.exit();
          }, 1000);
          DEBUG.debugRestart && console.info(`Adding SIGINT restart interrupt handler...`);
          process.on('SIGINT', () => {
            DEBUG.debugRestart && console.info(`Got SIGINT during restart cycle. Not restarting...`);
            clearTimeout(timer);
            norestart = true;
          });
          return res.status(200).send("requested");
        });
        app.post("/stop_app", ConstrainedRateLimiter, (req, res) => {
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
              return executeShutdownOfBBPRO();
            } catch(e) {
              console.warn(e);
            }
          } else {
            DEBUG.debugRestart && console.log(`Is not pm2. Exiting process`);
            process.exit(0);
          }
        });
        app.post("/stop_browser", async (req, res) => {
          const cookie = req.cookies[COOKIENAME+port] || req.query[COOKIENAME+port] || req.headers['x-browserbox-local-auth'];
          const url = new URL(req.url, `${req.protocol}://${req.headers.host}`);
          const qp = url.searchParams.get('session_token');
          if ( (cookie !== allowed_user_cookie) && qp != session_token ) { 
            return res.status(401).send('{"err":"forbidden"}');
          }
          /**
            kill the browser zombie from its pid file
          **/
          await zl.life.kill(zombie_port);
        });
        app.post("/start_browser", (req, res) => {
          const cookie = req.cookies[COOKIENAME+port] || req.query[COOKIENAME+port] || req.headers['x-browserbox-local-auth'];
          const url = new URL(req.url, `${req.protocol}://${req.headers.host}`);
          const qp = url.searchParams.get('session_token');
          if ( (cookie !== allowed_user_cookie) && qp != session_token ) { 
            return res.status(401).send('{"err":"forbidden"}');
          }
          /**
            launch a new browser (if one is not running)
          **/
          throw new Error(`Not implemented`);
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
            process.kill(process.pid, 'SIGINT');
            shutDown();
          } catch(e2) {
            console.warn(`error exit`, e2);
          }
          process.exit(0);
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

  function executeShutdownOfBBPRO() {
    console.warn(`Stopping BrowserBox`);
    return child_process.exec(`stop_bbpro`);
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
