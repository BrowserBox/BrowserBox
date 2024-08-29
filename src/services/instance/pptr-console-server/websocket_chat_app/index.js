// imports
  // main nodejs builtin imports
    import http from 'http';
    import https from 'https';
    import fs from 'fs';
    import os from 'os';
    import path from 'path';
    import {fileURLToPath} from 'url';

  // main 3rd-party imports
    import WebSocket from 'ws';
    //import {WebSocketServer} from 'ws';
    import express from 'express';
    import helmet from 'helmet';
    import compression from 'compression';
    import cookieParser from 'cookie-parser';
    import rateLimit from 'express-rate-limit';
    import exitOnExpipe from 'exit-on-epipe';

  // internal imports
    import {newName} from './public/src/xhelp.js';
    import {COOKIENAME, APP_ROOT, DEBUG as APP_DEBUG} from '../../common.js';
    import {
      CONFIG,
    } from '../../../../common.js';
    import {file, APP_ROOT} from './root.js';

// constants
  // config constants
    const DEBUG = {
      mode: 'prod',
      val: 0
    };
    const FORBIDDEN_NAMES = new Set([
      'system'
    ]);
    const SILENT = true;
    const DEFAULT_PORT = 8004;
    const PORT = process.env.LSD_PORT || Number(process.argv[2] || DEFAULT_PORT);
    const COOKIE = process.argv[3];
    const TOKEN = process.argv[4];

    if ( ! PORT || ! COOKIE || ! TOKEN ) {
      throw new TypeError(`Must supply: <PORT> <COOKIE> <TOKEN>. 
        Receivedo only: ${JSON.stringify({PORT,COOKIE,TOKEN})}`
      );
    }

  // room constants
    const Members = new Set();
    const Names = new Map();
    const NameSet = new Set();
    const sockets = new Set();
    let connectionId = 0;

  // server constants
    const Log = [];
    const SSL_OPTS = {};
    const COOKIE_OPTS = {
      secure: true,
      httpOnly: true,
      maxAge: 345600000,
      sameSite: 'None'
    };
    try {
      Object.assign(SSL_OPTS, {
        key: fs.readFileSync(path.resolve(CONFIG.sslcerts(PORT), 'privkey.pem')),
        cert: fs.readFileSync(path.resolve(CONFIG.sslcerts(PORT), 'fullchain.pem')),
        ca: fs.readFileSync(path.resolve(CONFIG.sslcerts(PORT), 'chain.pem')),
      });
    } catch(e) {
      console.warn(e);
    }
    console.log(SSL_OPTS);
    const RateLimiter = rateLimit({
      windowMs: 1000 * 60 * 3,
      max: DEBUG.mode == 'dev' ? 1000 : 300
    });
    const app = express();
    if ( ! APP_DEBUG.noSecurityHeaders ) {
      app.use(helmet({
        frameguard: false,
        crossOriginResourcePolicy: { policy: "same-site" },
        crossOriginEmbedderPolicy: true,
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
            ],
            connectSrc: [
              "'self'",
              "wss://*.dosyago.com:*",
            ],
            styleSrc: [
              "'self'", 
              "'unsafe-inline'"
            ],
            scriptSrc: [
              "'self'", 
              "'unsafe-inline'"
            ],
            frameAncestors: [
              "'self'",
              "https://*.dosyago.com:*",
            ],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
          },
          reportOnly: false,  
        }
      }));
    }
    app.use(compression());
    app.use(RateLimiter);
    app.use(express.urlencoded({extended:true}));
    app.use(cookieParser());
    // client app is a SPA served from static files
    app.use(express.static(
      path.resolve(APP_ROOT, 'pptr-console-server', 'websocket_chat_app', 'public')
    ));
    /**
    app.get('/abc*', (req, res) => {
      console.log(req.headers);
    });
    **/
    app.get('/login', (req, res) => {
      res.type('html');
      const {token} = req.query;
      let authorized;
      // if we are bearing a valid token set the cookie
      // so future requests will be authorized
      if ( token == TOKEN ) {
        res.cookie(COOKIENAME+PORT, COOKIE, COOKIE_OPTS);
        authorized = true;
      } else {
        const cookie = req.cookies[COOKIENAME+PORT];
        authorized = cookie === COOKIE;
      }
      if ( authorized ) {
        res.redirect('/');
      } else {
        res.end(`
          <!DOCTYPE html>
          <link rel=stylesheet href=/style.css>
          <h1>Logging you into chat...</<h1>
          <script src=chat_login.js></script>
        `);
      }
    });

    const server = https.createServer(SSL_OPTS, app);
    const wss = new WebSocket.Server({server});

    server.on('upgrade', (req, socket, head) => {
      sockets.add(socket);
      socket.on('close', () => sockets.delete(socket));
    });

    server.on('connection', socket => {
      sockets.add(socket);
      socket.on('close', () => sockets.delete(socket));
    });

// main code
  if ( weAreMainModule() ) {
    start();
  }

// exports 
  // main server start function
  export function start() {
    // a bit of security
    wss.on('connection', joinRoom);
    
    server.listen(PORT, err => {
      if ( err ) throw err;
      log({server:{upAt:Date.now(), port:PORT}});
    });

    process.on('SIGINT', () => {
      server.close();
      sockets.forEach(socket => {
        try { socket.destroy() } catch(e) { 
          console.warn(`WS CHAT SERVER: port: ${PORT} Error closing socket`, e ); 
        }
      });
      process.exit(0);
    });

    return server;
  }

// room functions
  function joinRoom(ws, req) {
    const ip = req.connection.remoteAddress;
    const id = connectionId++;
    const cookie = req.headers.cookie;
    const connection = {ws,ip,id};
    const validAuth = (cookie && 
      cookie.includes(`${COOKIENAME+PORT}=${COOKIE}`)
    );

    if ( validAuth ) {
      Members.add(connection);

      ws.on('message', (data, isBinary) => broadcast({data, isBinary}, ip, id));
      ws.on('close', () => leaveRoom(connection));
      ws.on('error', () => leaveRoom(connection));

      log({newConnection:{at:Date.now(), ip, id}});
    } else {
      console.log(`Closing as not authroized`, cookie, {ip,id});
      ws.send(JSON.stringify({at:Date.now(), error:'not authorized'}));
      ws.close();
    }
  }

  // receive and broadcast all messages
  function broadcast({data,isBinary}, ip, id) {
    if ( isBinary || (typeof data != "string")) {
      data = data.toString();
    }

    if ( typeof data == "string" ) {
      if ( data.length > 5000 ) {
        log({message:`Data too long ${data.length}, ip, id`});
        return;
      }
      try {
        data = JSON.parse(data);
      } catch(e) {
        log({exception:e,data});      
        return;
      }
    }

    data.at = Date.now();

    if ( data.message && data.message.length > 5000 ) {
      log({message:`Message too long ${data.message.length}, ip, id`});
      return;
    }

    // add username server-side so clients can't impersonate
    data.username = Names.get(id);

    // and keep track of name changes
    if ( data.newUsername ) {
      updateName(data, id);
      if ( ! data.username ) {
        // if there's no existing username the member just joined so
        data.memberCount = Members.size;  
      }
    }

    log({broadcast:{data, id, from:ip}});

    Members.forEach(connection => {
      try {
        connection.ws.send(JSON.stringify(data)); 
      } catch(e) {
        leaveRoom(connection);
      }
    });
  }

  function leaveRoom(connection) {
    Members.delete(connection);
    const {ip,id} = connection;

    log({disconnection:{at:Date.now(), ip,id}});

    broadcast({data:{disconnection:true}}, ip, id);

    const username = Names.get(id);
    Names.delete(id);
    NameSet.delete(username);
  }

// helpers
  function allowedName(name) { 
    return !FORBIDDEN_NAMES.has(name);
  }

  // server keeps a record of names to prevent conflicts and impersonation
  function updateName(data, id) {
    if ( data.newUsername.length > 40 ) {
      data.newUsername = data.newUsername.slice(0, 40);
    }

    if ( NameSet.has(data.newUsername) || !allowedName(data.newUsername) ) {
      // generate a random unused username
      data.newUsername = `person${Math.round(((Math.random()+Date.now())*1e14%1e14)).toString(31)}`;
      // tell the client we automatically changed their username to an unused one
      data.automaticUpdate = true;
    }
    NameSet.add(data.newUsername);
    // and don't forget to free the old one
    const username = Names.get(id);
    NameSet.delete(username);
    Names.set(id, data.newUsername);
  }

  function log(obj) {
    Log.push(obj);
    if ( Log.length > 10000 ) {
      Log.shift();
    }
    if ( SILENT ) return;

    console.log(JSON.stringify(obj,null,2));
  }

  // provides esmodules-era answer to the question, is this module called directly or imported?
  function weAreMainModule() {
    return file == process.argv[1];
  }



