// setup
  // requires 
  // npm i --save express cookie-parser 
  // node built-in imports
    import fs from 'fs';
    import os from 'os';
    import url from 'url';
    import path from 'path';
    import https from 'https';
    import crypto from 'crypto';
    import {spawn} from 'child_process';

  // 3rd-party NPM imports
    import express from 'express';
    import cookieParser from 'cookie-parser';
    import basicAuth from 'express-basic-auth';
    import bodyParser from 'body-parser';

  // internal imports
    import {
      CONFIG,
    } from '../../../commons.js';
    impprt {
      file,
      APP_ROOT,
    } from './root.js';

  // helpers
    const sleep = ms => new Promise(res => setTimeout(res, ms));

  // config and commandline args
    const DEBUG = Object.freeze({
      authDebug: false,
      portControl: true,
      processControl: true,
      spawnDebug: true,
      shutdownDebug: true,
      showOrigin: true,
      showHostname: true
    });
    const OPEN_SERVER = true;
    const CONTACT_EMAIL = 'cris@dosycorp.com';
    const VERSION = 'v1';
    const COOKIE_NAME = `dosyago-socketpuppet-${VERSION}`;
    const COOKIE_OPTS = {
      secure: true,
      httpOnly: true,
      maxAge: 345600000,
      sameSite: 'None'
    };
    const MAIN_SCRIPT = process.argv[1];
    const BA_USER = 'human';

  // global variables (state)
    const LoadNotifiers = new Map();

  // RBI app config
    const RBI_APP_DIR = process.env.RBI_APP_DIR || path.resolve(
      os.homedir(), process.env.RBI_APP_DIRNAME || 'vfpro'
    );
    const RBI_APP_START_SCRIPT = process.env.RBI_APP_START_SCRIPT || path.resolve(
      RBI_APP_DIR, 'sp-start.sh'
    );
    const RBI_APP_ARGUMENTS = ({cookie,token,chrome_port,app_port}) => {
      return [`${chrome_port}`, `${app_port}`, `${cookie}`, `${token}`]; 
    };
    const MAX_RBI_INSTANCES = process.env.RBI_APP_MAX_CONNECTIONS || 5;
    const RBI_APP_PORT_WIDTH = process.env.RBI_APP_PORT_WIDTH || 2; // number of ports RBI app needs
    const RBI_APP_PORT_GAP = process.env.RBI_APP_PORT_GAP || 1;     // gap between RBI app instances
    const RBI_APP_START_PORT = process.env.RBI_APP_START_PORT || 8010;
    const RBI_APP_END_PORT = process.env.RBI_APP_END_PORT || 
      MAX_RBI_INSTANCES ? 
        MAX_RBI_INSTANCES*(RBI_APP_PORT_WIDTH+RBI_APP_PORT_GAP) + RBI_APP_START_PORT
        :
        10999
    ;
    const RBI_BROWSER_START_PORT = process.env.RBI_BROWSER_START_PORT = 5010;
    const RBI_BROWSER_END_PORT = process.env.RBI_BROWSER_START_PORT = 7999;
    const RBI_APP_GIT_BRANCH = process.env.RBI_APP_GIT_BRANCH || 'boss';

  // Views
    const Views = {
      JSON: {
        Connection: JSONConnectionView
      }
    };

// check if imported, or called directly
  if ( MAIN_SCRIPT == file ) {
    const PORT = parseInt(process.argv[2]);
    const BA_PASSWD = process.argv[3] || randomHex();
    const COOKIE = process.argv[4] || randomHex();
    const TOKEN = process.argv[5] || randomHex();
    start({PORT,BA_PASSWD,COOKIE,TOKEN,exitOnFail:true});
  }

// main export
export default start;

// main function
  export async function start({PORT,BA_PASSWD,COOKIE,TOKEN,exitOnFail: exitOnFail = false} = {}) {
    const State = {
      activeConnections: new Map(),
      nextFreePort: [RBI_APP_START_PORT],
    };
    const opts = {PORT,BA_PASSWD,COOKIE,TOKEN,State};
    let fail = false;
    let GO_SECURE = true;

    // add cleanup
      process.on('error', (err) => Shutdown(State, err));
      process.on('beforeExit', () => Shutdown(State, 'beforeExit'));
      process.on('exit', () => Shutdown(State, 'exit'));
      process.on('SIGINT', () => Shutdown(State, 'SIGINT'));

    // guard correct arguments
      if ( ! PORT || ! BA_PASSWD || ! COOKIE || ! TOKEN ) {
        fail = true;
        throw new TypeError(`Must supply: <PORT> [<BASIC_AUTH_PASSWD> [<COOKIE> [<TOKEN>]]].
          Receivedo only: ${JSON.stringify(opts)}
          Usage: npm start -- <PORT> [<BASIC_AUTH_PASSWD> [<COOKIE> [<TOKEN>]]].
          Ie: Supply a cookie and token instead of generating random ones.
          Example 1: npm start -- 8000 myPassword myCookie myToken
          Example 2: npm start -- 443
          Server will report the PORT, BA_PASSWD, COOKIE and TOKEN.
        `);
      }

      if ( fail ) {
        if ( exitOnFail ) {
          return process.exit(1);
        } else {
          return;
        }
      }

    // use SSL if certificates available
      const SSL_OPTS = {};
      try {
        Object.assign(SSL_OPTS, {
          key: fs.readFileSync(path.resolve(CONFIG.sslcerts(PORT), 'privkey.pem')),
          cert: fs.readFileSync(path.resolve(CONFIG.sslcerts(PORT), 'fullchain.pem')),
          ca: fs.readFileSync(path.resolve(CONFIG.sslcerts(PORT), 'chain.pem')),
        });
      } catch(e) {
        console.warn(`Did not find any SSL certificates in ${path.resolve(CONFIG.sslcerts)}`);
        console.info(`No using TLS/HTTPS/WSS for the external-proxy`);
        GO_SECURE = false;
      }
      const ssl_opts = {SSL_OPTS,GO_SECURE};

    // set up HTTP app
      const app = express();
      const API = {claimPort,freePort,connect,disconnect};
      addMiddlewear(app, opts);
      addHandlers(app, {API,State,Views});

    // start server
      const server = await startServer(app, {...ssl_opts,...opts});

    return server;

    // API
      function claimPort() {
        const port = State.nextFreePort.shift();
        if ( port === undefined ) {
          DEBUG.portControl && console.warn(State);
          throw new TypeError(`No ports free!`);
        } else if ( ! Number.isInteger(port) ) {
          DEBUG.portControl && console.warn(State.nextFreePort, port);
          throw new TypeError(`Port is expected to be integer, got: ${port}`);
        } else if ( State.activeConnections.has(port) ) {
          DEBUG.portControl && console.warn(State.activeConnections, port);
          throw new TypeError(`
              Port to claim is expected to have no active connection, but port: ${
                port
              }, already has a connection.
            `);
        }
        let nextPort = port;
        nextPort += RBI_APP_PORT_WIDTH + RBI_APP_PORT_GAP;
        while(nextPort < RBI_APP_END_PORT) {
          if ( !State.activeConnections.has(nextPort) ) {
            State.nextFreePort.push(nextPort);
            break;
          }
          nextPort += RBI_APP_PORT_WIDTH + RBI_APP_PORT_GAP;
        }
        return parseInt(port);
      }

      function freePort(port) {
        port = parseInt(port);
        if ( State.activeConnections.has(port) ) {
          throw new TypeError(`Cannot free port ${port} as still has active connection. 
            Call disconnect first`
          );
        }
        State.nextFreePort.push(port);
        return true;
      }

      async function connect({chrome_port} = {}) {
        const app_port = claimPort(); 
        chrome_port = chrome_port || (app_port - 3000);
        const cookie = randomHex();
        const token = randomHex();
        const loginLink = makeLoginLink({app_port,token});
        const connection = {
          active: undefined,
          app_port,
          chrome_port,
          cookie,
          token,
          loginLink
        };
        const entry = {shutdown, connection};
        State.activeConnections.set(app_port, entry);
        const subprocess = connection.subprocess = spawn(
          RBI_APP_START_SCRIPT,
          RBI_APP_ARGUMENTS({app_port, chrome_port, cookie, token}),
          {
            stdio: 'inherit'
          }
        );
        subprocess.on('exit', deactivate);
        subprocess.on('error', markErrored);
        subprocess.on('close', deactivate);

        DEBUG.spawnDebug && console.log(subprocess.spawnargs);
        console.log(subprocess);

        State.activeConnections.set(app_port, entry);
        connection.active = true;

        return entry;
        
        async function shutdown() {
          let resolve, reject;
          const shuttingDown = new Promise((res, rej) => {
            resolve = res;
            reject = rej;
          });
          subprocess.once('exit', (code, signal) => resolve([code, signal]));
          subprocess.once('error', err => reject(err));
          subprocess.once('close', (code, signal) => resolve([code, signal]));

          if ( ! subprocess.kill('SIGINT') || ! subprocess.killed ) {
            subprocess.kill('SIGKILL');
          }

          return shuttingDown;
        }

        function deactivate() {
          connection.active = false;
          State.activeConnections.delete(app_port);
        }

        function markErrored(err) {
          console.warn(err);
          connection.active = false;
        }
      }

      function disconnect(port) {
        port = parseInt(port);
        if ( ! Number.isInteger(port) ) {
          DEBUG.portControl && console.warn(port);
          throw new TypeError(`Port is expected to be integer, got: ${port}`);
        }
        if ( ! State.activeConnections.has(port) ) {
          console.warn(`[disconnect] No active connection on port: ${port}`);
          return;
        }
        const {shutdown, connection} = State.activeConnections.get(port);
        connection.active = false;
        shutdown().then(([code, signal]) => {
          DEBUG.processControl && console.log(
            `Subprocess ${connection.loginLink} exited with code: ${code}, and signal: ${signal}`
          );
          State.activeConnections.delete(port);
          freePort(port);
        }).catch(err => {
          DEBUG.processControl && console.log(
            `Subprocess ${connection.loginLink} failed to exit. Error: ${err}`
          );
          console.warn(error);
          console.error(`Warning, port: ${port} will not be freed.`);
        });
      }
    
    // helpers
      function makeLoginLink({app_port,token}) {
        return `${GO_SECURE ? 
            'https' : 'http'
          }://${State.serverHostname}:${app_port}/login?token=${encodeURIComponent(token)}`;
      }
  }

// helpers
  async function startServer(app, {GO_SECURE,SSL_OPTS,PORT,BA_PASSWD,COOKIE,TOKEN}) {
    let notifyStarted;
    let notifyFailed;
    const listening = new Promise((res, rej) => {
      notifyStarted = res;
      notifyFailed = rej;
    });

    const server = (GO_SECURE ? https : http).createServer(SSL_OPTS, app);
    server.listen(PORT, err => {
      if ( err ) {
        notifyFailed(err);
        throw err;
      }
      const data = {crdpSecureProxyServer: { up: new Date, port: PORT, TOKEN, COOKIE, BA_PASSWD }};
      console.log(data);
      return notifyStarted(data);
    });

    await listening;

    return server;
  }

  function addMiddlewear(app, {PORT,COOKIE,TOKEN,BA_PASSWD,State}) {
    app.use(bodyParser.urlencoded({extended:true}));
    app.use((req, res, next) => {
      const newOrigin = `${req.protocol}://${req.get('host')}`;
      if ( newOrigin !== State.serverOrigin ) {
        State.serverOrigin = newOrigin;
        DEBUG.showOrigin && console.log({serverOrigin:State.serverOrigin});
      }
      if ( req.hostname !== State.serverHostname ) {
        State.serverHostname = req.hostname;
        DEBUG.showHostname && console.log({serverHostname:State.serverHostname});
      }
      next();
    });
    app.use(express.urlencoded({extended:true}));
    app.use(cookieParser());
    app.use((req, res, next) => {
      res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
      res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
      next();
    });

    // authentication cookie, or token, or basic auth
    app.use(async (req, res, next) => {
      const cookie = req.cookies[COOKIE_NAME+PORT];
      let authorized = cookie === COOKIE;

      if ( authorized ) {
        req.authorized = {cookie};
        DEBUG.authDebug && console.log('Authorized via Cookie');
        return next();
      } else {
        DEBUG.authDebug && console.log('Cookie auth failed', cookie, COOKIE, 'trying token...');
        const {token} = req.query;
        authorized = token === TOKEN || OPEN_SERVER;
        if ( authorized ) {
          req.authorized = {token};
          DEBUG.authDebug && console.log('Authorized via Token');
        } else {
          DEBUG.authDebug && console.log('Token auth failed', token, TOKEN, 'trying basic...');
          let notifyAuthCheckComplete;
          const authenticating = new Promise(res => notifyAuthCheckComplete = res);
      
          // create HTTP basic auth challenge
            const httpBasicAuthorizer = basicAuth({
              challenge: true,
              realm: "SocketPuppet's Magical Realm",
              users: {
                [BA_USER]: BA_PASSWD
              },
              authorizer: (username, password) => {
                DEBUG.authDebug && console.log(`User has provided credentials.`);
                const rightName = basicAuth.safeCompare(username, BA_USER);
                const rightSecret = basicAuth.safeCompare(password, BA_PASSWD);

                const credentialsValid = rightName && rightSecret;

                if ( credentialsValid ) {
                  authorized = true;
                  req.authorized = {username,password};
                  DEBUG.authDebug && console.log('Authorized via Basic Auth');
                } else {
                  DEBUG.authDebug && console.log('Basic auth failed.', username, BA_USER, password, BA_PASSWD);
                  authorized = false;
                }
                notifyAuthCheckComplete();
                return authorized;
              }
            });

          DEBUG.authDebug && console.log('Waiting for user credentials...');

          httpBasicAuthorizer(req, res, () => 1);

          await authenticating;
        }
      }

      if ( authorized ) {
        DEBUG.authDebug && console.log('Permitting request and setting cookie.');
        res.cookie(COOKIE_NAME+PORT, COOKIE, COOKIE_OPTS);
        return next();
      } else {
        DEBUG.authDebug && console.log(`No further options. Denying request.`);
      }
    });
  }

  function addHandlers(app, {API,State,Views}) {
    app.use(express.static(path.resolve('public')));

    app.get('/ready/:server_port', (req, res) => {
      let {server_port} = req.params;
      server_port = parseInt(server_port);
      console.log('Server-port', server_port, 'ready');
      try {
        LoadNotifiers.get(server_port)(true);
        LoadNotifiers.delete(server_port);
      } catch(e) {
        console.warn(`Could not notify instance on port ${server_port} had loaded.`, e);
      }
      res.end('OK');
    });

    app.get('/mailto', (req, res) => {
      res.redirect(`mailto:${CONTACT_EMAIL}?${new URLSearchParams(req.query)}`);
    });

    app.post('/connect', async (req, res) => {
      DEBUG.authDebug && console.log(req.authorized);
      const {ws_endpoint: chrome_port} = req.body;
      let notifyStarted;
      const serverStarted = new Promise(res => notifyStarted = res);
      const {connection} = (await API.connect({chrome_port}));
      LoadNotifiers.set(parseInt(connection.app_port), notifyStarted);
      await Promise.race([
        serverStarted,
        sleep(10000)
      ]);
      res.redirect(connection.loginLink);
    });

    app.post('/disconnect', (req, res) => {
      
    });

    app.get('/active', async (req, res) => {
      res.sendStatus(401);
      //res.json([...State.activeConnections.entries()].map(([_,{connection}]) => Views.JSON.Connection(connection)));
    });
  }

  function randomHex() {
    return crypto.randomBytes(16).toString('hex');
  }

// cleanup
  function Shutdown(State, err) {
    if ( err ) {
      console.warn('Got error', err);
    }
    DEBUG.shutdownDebug && console.log(
      `Shutting down ${State.activeConnections.size} active connections...`
    );
    try {
      State.activeConnections.forEach(({shutdown,connection}) => {
        try {
          shutdown(); 
        } catch(e) {
          console.warn(`error shutting down: ${connection.loginLink}`, e);
        }
      });
    } catch (err) {
      console.log(err);
    }
    process.exit(0);
  }

// views
  function JSONConnectionView(connection) {
    const {
      active,
      process,
      app_port,
      chrome_port,
      cookie,
      token,
      loginLink
    } = connection;
    const killed = process.killed || false;
    const exitCode = process.exitCode;

    return {process: {exitCode,killed}, loginLink, chrome_port, active};
  }
