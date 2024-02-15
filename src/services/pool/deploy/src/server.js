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
    import {spawn, spawnSync, execSync, exec} from 'child_process';

  // 3rd-party NPM imports
    import express from 'express';
    import cookieParser from 'cookie-parser';
    import basicAuth from 'express-basic-auth';
    import bodyParser from 'body-parser';
    import rateLimit from 'express-rate-limit';

  // config and commandline args
    import {
      DEBUG as _DEBUG,
      untilTrue,
      untilForever,
      sleep,
      app_port,
      chrome_port,
      version,
      COOKIENAME,
      CONFIG,
    } from '../../../../common.js';

    const DEBUG = Object.freeze(Object.assign({}, _DEBUG, {
      cleanup: true,
      debugStart: true,
      authDebug: true,
      portControl: true,
      processControl: true,
      spawnDebug: true,
      shutdownDebug: true,
      showOrigin: true,
      showHostname: true
    }));
    const OPEN_SERVER = false;
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

  // global variables (state)
    const LoadNotifiers = new Map();
    const KILL_JOBS = [];
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    });

  // RBI app config
    const testShort = false;
    const ONE_HOUR = testShort ? 1000*20 : 1000*60*60;
    const MIN_PORT = 8002;
    const MAX_PORT = 10998;
    const PORT_RANGE = MAX_PORT - MIN_PORT;
    const MaxTries = 2*Math.round(Math.log(PORT_RANGE));
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
  {
    let root;
    let File;
    let esm = false;

    try {
      console.log(__dirname, __filename);
    } catch(e) {
      esm = true;
    }

    if ( ! esm ) {
      File = __filename;
      root = path.dirname(File);
    } else {
      File = url.fileURLToPath(import.meta.url);
      root = path.dirname(File);
    }

    DEBUG.debugStart && console.log({MAIN_SCRIPT,File});
    if ( File === MAIN_SCRIPT ) {
      console.log('Main script');
      const PORT = parseInt(process.argv[2]) || process.env.DEPLOY_PORT || 443;
      const BA_USER = process.env.DEPLOY_USER || randomHex();
      const BA_PASSWD = process.env.DEPLOY_PASSWD || randomHex();
      const COOKIE = process.argv[4] || randomHex();
      const TOKEN = process.argv[5] || randomHex();
      console.log({PORT,BA_PASSWD,COOKIE,TOKEN});
      start({PORT,BA_PASSWD,BA_USER,COOKIE,TOKEN,exitOnFail:true});
    }
  }

// main export
export default start;

// main function
  export async function start({PORT,BA_PASSWD,BA_USER,COOKIE,TOKEN,exitOnFail: exitOnFail = false} = {}) {
    const State = {
      activeConnections: new Map(),
      nextFreePort: [RBI_APP_START_PORT],
      browsers: new Map(),
    };
    const opts = {PORT,BA_PASSWD,BA_USER,COOKIE,TOKEN,State};
    let fail = false;
    let GO_SECURE = true;

    // add cleanup
    if ( DEBUG.cleanup ) {
      process.on('unhandledRejection', err => Shutdown(State, err));
      process.on('error', (err) => Shutdown(State, err));
      process.on('beforeExit', () => Shutdown(State, 'beforeExit'));
      process.on('exit', () => Shutdown(State, 'exit'));
      process.on('SIGINT', () => Shutdown(State, 'SIGINT'));
    }

    // guard correct arguments
      if ( ! PORT || ! BA_PASSWD || ! COOKIE || ! TOKEN ) {
        fail = true;
        throw new TypeError(`Must supply: <PORT> [<BASIC_AUTH_PASSWD> [<COOKIE> [<TOKEN>]]].
          Received only: ${JSON.stringify(opts)}
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

      server.setTimeout(60000);

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
        subprocess.on('SIGINT', deactivate);
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
          console.warn('Subprocess err', err);
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
        console.warn(`Could not load server`, PORT, GO_SECURE);
        notifyFailed(err);
        throw err;
      }
      const data = {deployServer: { up: new Date, port: PORT, TOKEN, COOKIE, BA_PASSWD }};
      console.log(data);
      return notifyStarted(data);
    });

    await listening;

    return server;
  }

  function addMiddlewear(app, {PORT,COOKIE,TOKEN,BA_PASSWD,BA_USER,State}) {
    app.use(limiter);
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

    app.get('/', glove(async (req, res) => {
      res.status(200).send(`
        <!DOCTYPE html>
        <meta name=viewport content=width=device-width,initial-scale=1>
        <link rel=stylesheet href=style.css>
        <title>BrowserBox Pro Demo with Resource Monitoring</title>
        <meta charset=utf-8>
        <main>
          <header>
            <h1>
              BrowserBox Pro Demo 
              <br>
              <small>with Resource Monitoring</small>
            </h1>
          </header>
          <aside>
            <h1>System Resource Monitoring Dashboards</h1>
            <ul>
              <li><a target=glances href="${execSync('glances.sh')}">glances</a>
              <li><a target=htop href="${execSync('shellinabox.sh')}">htop</a>
            </ul>
          </aside>
          <article>
            <h1>Manual Scaling</h1>
            <ol>
              <li>Click the button below to get a new login link for a fresh browser.
              <li>Create as many browsers as you like.
              <li>Observe the resource usage with the above web dashboards.
            </ol>
            <p>
              <em>Browser Login Link:</em>
              <iframe class=short name=browser-creation></iframe>
            </p>
            <form target=browser-creation method=post action=/on enctype=application/x-www-form-urlencoded>
              <fieldset>
                <legend>Create New Browser</legend>
                <p>
                  <button name=button>Create</button>
                <p>
                  <label>
                    Optionally, enter a desired port number for the new browser service:
                    <input type=number min=${MIN_PORT} max=${MAX_PORT} name=port value="" placeholder="port" step=1>
                  </label>
                <p class=small>
                    <i>Note: ports in the range ${MIN_PORT} to ${MAX_PORT} are valid for this demo. Each browser service occupies a range of 4 consecutive ports. A desired port may be unavailable if that range is occupied.</i>
              </fieldset>
              <script>
                {
                  const form = document.currentScript.closest('form');
                  form.addEventListener('submit', submission => {
                    submission.currentTarget.button.innerText = 'Creating...';
                    submission.currentTarget.button.disabled = true;
                  });
                }
              </script>
            </form>
            <details open class=top-gap>
              <summary>All Browsers</summary>
              <iframe class=full name=control-browsers src=/control-browsers#></iframe>
            </details>
            <p>
              <i>Note: Browsers in this demo have a lifespan of 60 minutes.</i>
            </p>
            <iframe class=invisible name=no-reload src=/control-browsers></iframe>
            <iframe class=invisible name=no-reload-2 src=/control-browsers></iframe>
          </article>
          <footer>
            <cite>
              All content strictly confidential and
              &copy; 
              <a rel=author href=https://dosyago.com>Dosyago Corporation</a>
              <date>2023</date>
              |
              <a href=https://dosyago.com/privacy.txt>Privacy</a>
              |
              <a href=https://dosyago.com/terms.txt>Terms</a>
            </cite>
          </footer>
        </main>
      `);
    }));

    app.get('/browsers', glove(async (req, res) => {
      res.type('json');
      const browsers = await getBrowsers(State);
      res.status(200).send(browsers);
    }));

    app.get('/control-browsers', glove(async (req, res) => {
      const browsers = await getBrowsers(State);
      res.status(200).send(`
        <!DOCTYPE html>
        <meta name=viewport content=width=device-width,initial-scale=1>
        <link rel=stylesheet href=style.css>
        <title>BrowserBox Pro Demo with Resource Monitoring</title>
        <meta charset=utf-8>
        <ul>${browsers.length ? browsers.map(([pid, loginLink]) => {
          const {port} = new URL(loginLink);
          return `
          <script>
            globalThis.reloadFrame = null;
            globalThis.waitingKills = new Set();
          </script>
          <li>
            <a target=bb${port} href=${loginLink}>${loginLink}</a>
            <form class="confirm inline" method=GET action=#confirm>
              <button name=do>Kill</button>
            </form>
            <form target=no-reload-2 class="invisible kill inline" method=POST action=/control-browsers>
              <input name=id hidden value=${pid}> 
              <button name=do value=kill></button>
            </form>
            <details class=inline>
              <summary>Message</summary>
              <form target=no-reload class=message method=post action=/control-browsers>
                <input name=id hidden value=${pid}>
                <textarea name=message placeholder="Message to send to this browser"></textarea>
                <button name=do value=send-message>Send</button>
              </form>
            </details>
            <script>
              {
                const messageForm = document.currentScript.closest('li').querySelector('form.message');
                const myTarget = document.currentScript.closest('li').querySelector('a').target;
                const killForm = document.currentScript.closest('li').querySelector('form.kill');
                const form = document.currentScript.closest('li').querySelector('form.confirm');
                const port = '${port}';
                let killing = false;
                let block = true;

                form.do.addEventListener('click', click => {
                  try { 
                    const givenPort = prompt(
                      \`Really kill this browser? This is irreversible. Type the port number ${port} to confirm.\`
                    )?.trim();
                    if ( givenPort === port ) {
                      block = false;
                    }
                  } finally {
                    if ( block ) {
                      click.preventDefault();
                    } else {
                      globalThis.waitingKills.add(port);
                      if ( globalThis.reloadFrame ) {
                        clearTimeout(globalThis.reloadFrame);
                        globalThis.reloadFrame = null;
                      }
                    }
                  }
                });

                form.addEventListener('submit', submission => {
                  submission.preventDefault();
                  if ( killing || block ) {
                    return;
                  }
                  killing = true;
                  form.do.innerText = 'Notifying...';
                  setTimeout(() => {
                    form.do.disabled = true;
                    messageForm.message.value = "Admin is shutting this browser down.";
                    messageForm.do.click();
                  }, 0);
                  setTimeout(() => {
                    form.do.innerText = 'Killing...';
                    // Note:
                      // await call stack completion before setting disabled
                      // this is necessary for the submission to include the 
                      // button's value. A disabled control is not sent
                      // This slight delay in disabling also necessitates 
                      // the above flag to ensure prevention of double submission
                    killForm.do.click();
                  }, 5000);
                });

                killForm.addEventListener('submit', submission => {
                  if ( top['browser-creation'].document.querySelector('a')?.target === myTarget ) {
                    top['browser-creation'].document.documentElement.innerHTML = '';
                  }
                  globalThis.waitingKills.delete(port);
                  if ( globalThis.waitingKills.size === 0 ) {
                    globalThis.reloadFrame = setTimeout(() => location.reload(), 1000);
                    setTimeout(() => form.do.innerText = 'Killed! Reloading...', 0);
                  } else {
                    setTimeout(() => form.do.innerText = 'Killed! Waiting...', 0);
                  }
                });

                messageForm.addEventListener('submit', submission => {
                  messageForm.do.innerText = 'Sending...';
                  setTimeout(() => messageForm.do.innerText = 'Sent!', 800);
                  setTimeout(() => messageForm.do.innerText = 'Send', 3500);
                });
              }
            </script>
          </li>
        `}) : `<li class=no-list>No browsers right now</li>`}</ul>
      `);
    }));

    app.post('/control-browsers', glove(async (req, res) => {
      const {id, message} = req.body;
      let pid = Number(id);
      if ( Number.isNaN(pid) || !State.browsers.has(pid) ) {
        return res.abort(401);
      }
      switch(req.body.do) {
        case 'kill': {
          execSync(`sudo killuser.sh ${State.browsers.get(pid).username}`);
        } break; case 'send-message': {
          const {noticeFile} = State.browsers.get(pid);
          fs.writeFileSync(noticeFile, message || '');
          execSync(`sudo kill -PIPE ${pid}`);
        } break; default: {
          console.warn(`Unknown control-browsers action: ${req.body.do}`);
        } break;
      }
      res.redirect('/control-browsers');
    }));

    app.post('/on', glove(async (req, res) => {
      res.type('html');
      let {port} = req.body;
      let provided = true;

      if ( ! port ) {
        provided = false;
        port = Math.round(Math.random()*PORT_RANGE) + MIN_PORT;
      }
      port = parseInt(port);

      if ( ! Number.isInteger(port) ) {
        throw new TypeError(`Need to supply port as integer`);
      }

      if ( port < MIN_PORT || port > MAX_PORT ) {
        throw new RangeError(`Port is out of range`);
      }

      const username = execSync('sudo newuser.sh').toString().trim();
      if ( ! username ) {
        throw new RangeError(`Error occured creating a new user to run the browser`);
      }

      console.log({username});

      let tries = 1;
      let loginLink;
      try {
        loginLink = execSync(`sudo -u ${username} setup_bbpro --port=${port}`).toString().trim();
      } catch(e) {
        if ( provided ) {
          console.warn('Setup failed', e);
          execSync(`sudo killuser.sh ${username}`);
          throw new RangeError(`Could not assign port ${port}. Already in use`);
        }
      }

      while( ! loginLink && tries < MaxTries ) {
        await sleep(300); 
        tries += 1;
        port += 2;
        try {
          loginLink = execSync(`sudo -u ${username} setup_bbpro --port=${port}`).toString().trim();
        } catch(e) {
          if ( provided ) {
            console.warn('Setup failed', e);
            execSync(`sudo killuser.sh ${username}`);
            throw new RangeError(`Could not assign port ${port}. Already in use`);
          }
        }
      }

      if ( ! loginLink || tries >= MaxTries ) {
        execSync(`sudo killuser.sh ${username}`);
        throw new RangeError(`Error occured finding a port to run the browser service. Ports must be scarce now, max attempts exceeded.`);
      }

      const result = execSync(`sudo -u ${username} bbpro`).toString().trim();

      console.log(`Start result`, result);

      const ConfigBaseDir = path.resolve(
        path.dirname(os.homedir()), 
        username,
        '.config',
        'dosyago',
        'bbpro',
      );
      const appPidFile = path.resolve(
        ConfigBaseDir,
        `app-${port}.pid`
      );
      console.log({appPidFile});
      await untilForever(() => fs.existsSync(appPidFile), 500);

      const appPid = parseInt(fs.readFileSync(appPidFile).toString().trim());

      KILL_JOBS.push(killJob);
      setTimeout(() => killJob(`This demo browser's lifespan is ending.`), ONE_HOUR);

      function killJob(reason = 'no reason', {noWait = false} = {}) {
        const noticeFile = path.resolve(
          ConfigBaseDir,
          'notices',
          'text'
        );
        fs.writeFileSync(noticeFile, `This browser service is shutting down now. The reason given is: ${reason}`);
        execSync(`sudo kill -PIPE ${appPid}`);
        if ( noWait ) {
          execSync(`sleep 3`);
          execSync(`sudo killuser.sh ${username}`)
        } else {
          setTimeout(() => execSync(`sudo killuser.sh ${username}`), 10000);
        }
      }

      res.status(200).send(`
        <!DOCTYPE html>
        <meta name=viewport content=width=device-width,initial-scale=1>
        <link rel=stylesheet href=style.css>
        <title>BrowserBox Pro Demo with Resource Monitoring</title>
        <meta charset=utf-8>
        <a target=bb${port} href=${loginLink}>${loginLink}</a>
        <script>
          const form = top.document.querySelector('form');
          form.button.innerText = 'Create';
          form.button.disabled = false;
          top['control-browsers'].location.reload(); 
        </script>
      `);
    }));

    app.get('/ready/:server_port', glove((req, res) => {
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
    }));

    app.get('/mailto', glove((req, res) => {
      res.redirect(`mailto:${CONTACT_EMAIL}?${new URLSearchParams(req.query)}`);
    }));

    app.post('/connect', glove(async (req, res) => {
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
    }));

    app.post('/disconnect', glove((req, res) => {
      
    }));

    app.get('/active', glove(async (req, res) => {
      res.sendStatus(401);
      //res.json([...State.activeConnections.entries()].map(([_,{connection}]) => Views.JSON.Connection(connection)));
    }));

    app.use((err, req, res, next) => {
      console.warn(err);
      res.type('html');
      res.status(500).send(`
        <p>
          <em>Error:</em>
        <p>
          <code><pre>${err}</pre></code>
        <script>
          {
            const form = top.document.querySelector('form');
            form.button.innerText = 'Create';
            form.button.disabled = false;
          }
        </script>
      `);
    });
  }

  function randomHex() {
    return crypto.randomBytes(16).toString('hex');
  }

// helpers
  async function getBrowsers(State) {
    const USERNAME_REGEX = /user\w+/;
    let browsers;
    try {
      browsers = JSON.parse(execSync('all_browsers.sh')).filter(([,pid]) => !!pid);
      // TODO: security of this is dodgy
      State.browsers = new Map(browsers.map(data => [data[1], {
        pid: data[1],
        loginLink: data[0],
        noticeFile: data[2],
        username: data[2].match(USERNAME_REGEX)?.[0]
      }]));
    } catch(e) {
      console.warn("error getting browsers", e);
      browsers = [];
    }

    browsers = browsers.map(([loginLink, pid, noticeFile]) => {
      return [pid, loginLink]
    });
    console.log(State.browsers);
    return browsers;
  }

// cleanup
  // async error wrapper
  function glove(handler) {
    return async (req, res, next) => {
      try {
        return await handler(req, res, next);
      } catch(err) {
        next(err);
      }
    }
  }

  function Shutdown(State, err) {
    if ( err ) {
      console.warn('Got shutdown condition', err);
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
    while(KILL_JOBS.length) {
      const job = KILL_JOBS.shift();
      try {
        job(`The demo server is shutting down, so all browsers are being shut down now.`, {noWait: true});
      } catch(e) {
        console.warn(`error shutting down, during browser kill job`, e);
      }
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
