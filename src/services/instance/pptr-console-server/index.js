  import path from 'path';
  import fs from 'fs';
  import os from 'os';
  import fsp from 'fs/promises';
  import {fork, spawn, exec, execSync} from 'child_process';
  import http from 'http';
  import https from 'https';

  import helmet from 'helmet';
  import compression from 'compression';
  import cookieParser from 'cookie-parser';
  import rateLimit from 'express-rate-limit';
  import express from 'express';
  import exitOnExpipe from 'exit-on-epipe';

  import {DEBUG, GO_SECURE, MAX_TABS, COOKIENAME, APP_ROOT} from '../common.js';
  import {patchError, MAX_RUN_TIME_MS} from './common.js'
  import {
    CONFIG,
  } from '../../../common.js'

  const ScriptWelcomeMessage = () => {
    const RANDOMPAGE = P[Math.floor(Math.random()*P.length)];
    return `
      // Write Your Script Here
      start();

      async function start() {
        const page = await Browser.newPage();
        await page.goto('${RANDOMPAGE}');
        return page;
      }
    `;
  };

  const SCRIPT_PATH = path.resolve('/home', 'submanager', 'scripts');
  const SCRIPTERS_GROUP_ID = parseInt(
    execSync('getent group scripters | cut -d: -f3')
      .toString()
      .trim()
  );

  const PORT = parseInt(process.argv[2] || 8001);
  const COOKIE = process.argv[3];
  const TOKEN = process.argv[4];
  console.log({pptrC:{PORT,COOKIE,TOKEN}});
  const Current = {
    width: 1200,
    height: 800
  };
  const SSL_OPTS = {};
  const COOKIE_OPTS = {
    secure: true,
    httpOnly: true,
    maxAge: 345600000,
    sameSite: 'None'
  };
  const sleep = ms => new Promise(res => setTimeout(res, ms));
  const sleepThrow = ms => {
    let id;
    const cancel = () => clearTimeout(id);
    const timer = new Promise((res,rej) => {
      id = setTimeout(rej, ms);
    });
    return {timer, cancel};
  };
  const P = [
    'https://google.com',
    'https://dosyago.com',
    'https://duckduckgo.com',
    'https://cnn.com',
    'http://assembler.org',
    'http://cachemonet.com',
    'https://mysticmedusa.com',
    'https://twitter.com/elonmusk'
  ];
  const connections = new Set();
  let certsFound = false;
  let tabCount = 0;
  let seq = 1;

  if ( DEBUG.goSecure ) {
    try {
      Object.assign(SSL_OPTS, {
        key: fs.readFileSync(path.resolve(CONFIG.sslcerts(PORT), 'privkey.pem')),
        cert: fs.readFileSync(path.resolve(CONFIG.sslcerts(PORT), 'fullchain.pem')),
        ca: fs.readFileSync(path.resolve(CONFIG.sslcerts(PORT), 'chain.pem')),
      });
      certsFound = true;
    } catch(e) {
      console.warn(e);
    }
    DEBUG.val && console.log(SSL_OPTS, {GO_SECURE});
  }
  const RateLimiter = rateLimit({
    windowMs: 1000 * 60 * 3,
    max: DEBUG.mode == 'dev' ? 1000 : 300
  });

  start();

  async function start() {
    const app = express();
    if ( ! DEBUG.noSecurityHeaders ) {
      app.use(helmet({
        frameguard: false,
        crossOriginResourcePolicy: { policy: "same-site" },
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
              `https://*.dosyago.com:${PORT+1}`,
              `https://*.dosyago.com:${PORT+2}`,
              `https://*.dosyago.com:${PORT+3}`,
            ],
            connectSrc: [
              "'self'",
              "wss://*.dosyago.com:*",
              `https://*.dosyago.com:${PORT+1}`
            ],
            styleSrc: [
              "'self'", 
              "'unsafe-inline'"
            ],
            scriptSrc: [
              "'self'", 
              "'unsafe-eval'",
              "'sha256-ktnwD9kIpbxpOmbTg7NUsKRlpicCv8bryYhIbiRDFaQ='",
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
    app.use((req, res, next) => {
      next();
    });
    app.use(express.static(path.resolve(APP_ROOT, 'pptr-console-server', 'public')));

    app.get('/login', (req, res) => {
      res.type('html');
      const {token} = req.query; 
      if ( token == TOKEN ) {
        res.cookie(COOKIENAME+PORT, COOKIE, COOKIE_OPTS);
        const url = new URL(`https://${req.get('host')}`);
        url.port = PORT;
        url.pathname = '/run-script';
        url.search = `ran=${Math.random().toString(36)}.${(+ new Date).toString(32)}`;
        DEBUG.val && console.log(`PPTR console frame login Redirect`, url, token);
        res.redirect(url);
      } else {
        res.type("html");
        if ( token == 'token2' ) {
          res.end(`Incorrect token, not token2. <a href=/login?token=token2>Try again.</a>`);
        } else {
          res.end(`Incorrect token. <a href=https://${req.host}/>Try again.</a>`);
        }
      }
    });
    app.get('/run-script', (req, res) => {
      const cookie = req.cookies[COOKIENAME+PORT];
      const DEVTOOLS_URL = new URL(`https://${req.hostname}/login`);
      DEVTOOLS_URL.port = parseInt(PORT) + 2;
      const chaturl = new URL(`https://${req.hostname}`);
      chaturl.pathname = '/login';
      chaturl.port = parseInt(PORT) + 3;
      res.type('html');
      if ( cookie === COOKIE ) {
        res.end(view({chaturl, dturl: DEVTOOLS_URL}));
      } else {
        DEBUG.val && console.log(cookie, COOKIE, req.body);
        res.sendStatus(401);
      }
    });
    app.post('/run-script', async (req, res) => {
      const cookie = req.cookies[COOKIENAME+PORT];
      const DEVTOOLS_URL = new URL(`https://${req.hostname}/login`);
      DEVTOOLS_URL.port = parseInt(PORT) + 2;
      const chaturl = new URL(`https://${req.hostname}`);
      chaturl.port = parseInt(PORT) + 3;
      chaturl.pathname = '/login';
      res.type('html');
      if ( cookie === COOKIE ) {
        const {script: scriptText} = req.body; 
        const randomName = `script.${
            (+ new Date).toString('32')
          }${
            Math.random().toString('36')
          }${
            seq++
        }.js`
        const randomFile = path.resolve(SCRIPT_PATH, randomName);
        await fsp.writeFile(randomFile, scriptText);

        // create strings to track any child output
          let stdoutStr = '', stderrStr = '';

        // create promises to track child progress
          let notifyErrored, notifyRunning, notifyCompleted;
          const completion = new Promise(res => notifyCompleted = res);
          const startup = new Promise((res, rej) => {
            notifyRunning = res;
            notifyErrored = rej;
          });

        // create child and add a completion callback
          process.env.NODE_BIN = process.argv[0]
          const child = exec(
            `./script.sh ${
                randomFile
              } '${
                JSON.stringify({Current})
              }' ${tabCount} ${PORT} ${MAX_TABS}`, {
              timeout: MAX_RUN_TIME_MS,
            }, (err, stdout, stderr) => {
              if ( err ) {
                DEBUG.val && console.log(
                  `Child process ended and had error. Exit code: ${
                    err.code
                  }. Signal: ${err.signal}.`,
                  new Date
                );
              } else {
                DEBUG.val && console.log(`Child processed ended successfully.`, new Date);
              }
              notifyCompleted();
              DEBUG.val && console.log({stdout, stderr});
            }
          );

          DEBUG.val && console.log({child:{
            connected: child.connected,
            signalCode: child.signalCode,
            exitCode: child.exitCode,
            channel: child.channel,
            killed: child.killed,
            pid: child.pid
          }});

        // attach promises to events
          child.on('disconnect', () => {
            DEBUG.val && console.log(`Child disconnected.`, new Date);
          });
          child.on('close', (code, signal) => {
            DEBUG.val && console.log(`Child closed. ${code}. ${signal}`, new Date);
            notifyCompleted({code, signal});
          });
          child.on('exit', (code, signal) => {
            DEBUG.val && console.log(`Child exited. ${code}. ${signal}`, new Date);
            if ( signal && signal == 'SIGTERM' ) {
              stderrStr += patchError(new Error(`[PPTRConsoleCustomError] Timelimit exceeded.`));
            }
            notifyCompleted({code, signal});
          });
          child.on('spawn', () => {
            DEBUG.val && console.log(`Child successfully spawned.`, new Date);
            notifyRunning();
          });
          child.on('error', err => {
            DEBUG.val && console.log(`Child had an error while spawning. ${err}`, new Date);
            console.warn(err);
            notifyErrored(err);
          });

          child.unref();
          if ( child.disconnect ) {
            child.disconnect();
          }
          if ( child.channel ) {
            child.channel.unref();
          }

        /*
          // trap any messages
            child.on('message', (message, sendHandle) => {
              console.log(`Child sent a message: ${message}`);
              console.log({message});
              if ( sendHandle ) {
                console.log('Send handle present. ${sendHandle}');
              }
            });
        */

        // trap and save any stdout and stderr
          child.stdout.on('data', data => stdoutStr += data.toString());
          child.stderr.on('data', data => stderrStr += data.toString());

          child.stdout.on('close', () => {
            DEBUG.val && console.log(`Child stdout closed.`, new Date);
          });

        DEBUG.val && console.log(`Waiting for completion`, new Date);
        // wait for startup and completion (or errors) and block response
          // note that this is OK as each user has their own pptr-console server
          // so from a multiuser point of view we are not blocking anything
          // also from a signal user point of view, we are only waiting asynchronously
          // we are not blocking the thread with this request handler while we wait

          // we comment out the below
          // because spawn events only land in node 15
          /*
          // await startup (or error trying to start)
            try {
              await startup;
            } catch(e) {
              console.error(`Child did not start`, e);
              throw e;
            } finally {
              console.log(`Child started and is running`);
            }
          */

          // await completion (or error on running past timeout)
            // note that completion cannot throw as we only attached to resolve (not reject)
            // but sleepThrow throws if not cancelled
            const {timer,cancel} = sleepThrow(MAX_RUN_TIME_MS + 600);
            try {
              await Promise.race([
                completion,
                timer
              ]);
              cancel();
              DEBUG.val && console.log('Child completed');
            } catch(e) {
              DEBUG.val && console.warn(e);
              DEBUG.val && console.log(`Child process did not complete in time. We will terminate the child process.`);
              stderrStr += patchError(new Error(`[PPTRConsoleCustomError] Timelimit exceeded.`));
              child.kill();
            }

        const error = stderrStr;
        const result = stdoutStr;

        DEBUG.val && console.log({child:{
          connected: child.connected,
          signalCode: child.signalCode,
          exitCode: child.exitCode,
          channel: child.channel,
          killed: child.killed,
          pid: child.pid
        }});

        DEBUG.val && console.log(`Responding to view`, new Date);

        res.end(view({
          chaturl,
          dturl: DEVTOOLS_URL, error, script:scriptText, 
          result, run:'completed', 
        }));
      } else {
        console.log(cookie, COOKIE, req.body);
        res.sendStatus(401);
      }
    });
    app.post('/viewport', (req,res) => {
      const cookie = req.cookies[COOKIENAME+PORT];
      res.type('html');
      if ( cookie === COOKIE ) {
        const {width:widthRaw,height:heightRaw,isMobile,hasTouch} = req.body;
        Current.width = parseInt(widthRaw);
        Current.height = parseInt(heightRaw);
        Current.isMobile = isMobile === 'true';
        Current.hasTouch = hasTouch === 'true';
        DEBUG.val && console.log({Current});
        res.end('ok');
      } else {
        console.log(cookie, COOKIE, req.body);
        res.sendStatus(401);
      }
    });
    const MODE = certsFound ? https: http;
    const server = MODE.createServer(SSL_OPTS, app);
    server.listen(PORT, err => {
      if ( err ) {
        throw err;
      } 
      console.log({serverUp:{port:PORT, at:new Date}});
    });
    server.on('connection', socket => {
      connections.add(socket);
      socket.on('close', () => connections.delete(socket));
    });
    process.on('SIGINT', () => {
      server.close();
      connections.forEach(socket => {
        try {
          socket.destroy();
        } catch(e) {
          console.warn(`Error destroying socket`, e);
        }
      });
      process.exit(0);
    });
  }

  function view({dturl, chaturl, script, run: run = 'not started', error, result} = {}) {
    if ( result && typeof result !== "string" ) {
      try {
        result = JSON.stringify({result}, null, 2);
      } catch(e) {
        result = `${result}[circular reference]`;
      }
    }
    return `
      <!DOCTYPE html>
      <link rel=stylesheet href=style.css>
      <main>
        <nav class=tab-heads>
          <label for=tab-chat class=active>
            <span>Chat</span>
          </label>
          <label for=tab-devtools>
            <span>DevTools</span>
          </label>
          <label for=tab-pptr-console>
            <span>Scripting</span>
          </label>
        </nav>
        <section class=tabs>
          <input  checked=checked hidden type=radio id=tab-chat name=tab-head value=tab-chat>
          <aside class=tab>
            <iframe class=full src=${chaturl}></iframe>
          </aside>
          <input  hidden type=radio id=tab-pptr-console name=tab-head value=tab-pptr-console>
          <aside class=tab>
            <form action=/run-script method=post>
              <p class=status>
                <span class=btn>
                  <button class=run-action>Run script</button>
                </span>
              </p>
              <details>
                <summary>
                  <span class=script-run>
                    Script to run
                    <span id=run_status>${run}</span>
                  </span>
                </summary>
                <label>
                  Paste or type your Puppeteer script below:
                  <textarea id=script_input rows=19 name=script>${
                    script||ScriptWelcomeMessage()
                  }</textarea>
                </label>
              </details>
            </form>
            <details ${ (result || error) ? 'open' : ''}>
              <summary style="
              ">Results</summary>
              <pre class=result>${ !result ? 'no result' : `
                <code>${
                  result
                }</code>
              `}</pre>
              <pre class=error>${ !error ? 'no error' : `
                <code>${
                  error
                }</code>
              `}</pre>
            </details>
            <details>
              <summary style="">Globals provided</summary>
              <p>
                <dfn>Assert</dfn> - value of <code>require( 'assert' )</code>
                <br>
                <dfn>Browser</dfn> - the current 
                  <a target=_blank href=https://pptr.dev/#?show=api-class-browser>Browser</a>
                <br>
                <dfn>Puppeteer</dfn> - value of 
                  <a target=_blank href=https://pptr.dev/#?show=api-class-puppeteer>
                    <code>require( 'puppeteer' )</code> 
                  </a>
                <br>
                <dfn>Sleep</dfn> - i.e., <code>await Sleep(3000)</code>
              <p>
                <small><i>
                  Note: require is currently not supported. If  
                  <code>require( 'puppeteer' )</code>
                  is in your script, it will be spliced out and replaced with 
                  <code>Puppeteer</code>
                  , i.e., the provided global.
                </i></small>
              </p>
            </details>
            <details>
              <summary>Script inspiration</summary>
              <ul style="list-style-type: square;">
                <li><a target=_blank href="https://github.com/puppeteer/puppeteer/tree/main/examples">Official examples</a> - Quality examples as part of the official puppeteer repo.</li>
                <li><a target=_blank href="https://github.com/GoogleChromeLabs/puppeteer-examples">Official use case-driven examples</a> - More complex, high quality, use case-driven examples.</li>
                <li><a target=_blank href="https://github.com/checkly/puppeteer-examples">puppeteer-examples</a> - Quality examples for real life use cases such as scraping web pages and common login scenarios.</li>
                <li><a target=_blank href="https://github.com/sweekson/puppeteer-samples">puppeteer-samples</a> - Misc examples.</li>
                <li><a target=_blank href="https://github.com/yidinghan/daily-signin">daily-signin</a> - Signin and control various chinese sites.</li>
                <li><a target=_blank href="https://github.com/MRdotB/linkedin-autoaccept">linkedin-autoaccept</a> - Auto-accept invitations on linkedin.</li>
                <li><a target=_blank href="https://github.com/aofdev/instagram-get-images">instagram-get-images</a> - Instagram image scraper.</li>
                <li><a target=_blank href="https://github.com/zhentaoo/puppeteer-deep">puppeteer-deep</a> - Demos on crawling, UI automation, trace API and so on.</li>
                <li><a target=_blank href="https://github.com/chuongtrh/html_to_pdf">html_to_pdf</a> - Generate a simple invoice PDF from HTML.</li>
              </ul>
              <small>
                <cite>From <a href=https://github.com/transitive-bullshit/awesome-puppeteer#examples>
                  Puppeteer Awesome
                </a></cite>
              </small>
            </details>
            <hr>
            <script src=updateStatus.js></script>
          </aside>
          <input  hidden type=radio id=tab-devtools name=tab-head value=tab-devtools>
          <aside class=tab>
            <iframe class=full src=${dturl}></iframe>
          </aside>
        </section>
      </main>
      <script src=load.js></script>
    `;
  }

