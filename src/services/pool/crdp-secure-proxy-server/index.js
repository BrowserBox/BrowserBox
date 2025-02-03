import fs from 'fs';
import os from 'os';
import path from 'path';
import http from 'http';
import https from 'https';

import express from 'express';
import cookieParser from 'cookie-parser';
import WebSocket from 'ws';
//import {WebSocketServer} from 'ws';
import compression from 'compression';
import exitOnExpipe from 'exit-on-epipe';
import rateLimit from 'express-rate-limit';

import {
  DEBUG,
  app_port,
  chrome_port,
  version,
  COOKIENAME,
  CONFIG,
  untilTrueOrTimeout,
} from '../../../common.js';

DEBUG.debugDevtoolsServer && console.log(process.argv);
const PORT = app_port + 1;
const COOKIE = process.argv[3];
const TOKEN = process.argv[4];
const sleep = ms => new Promise(res => setTimeout(res, ms));

const NO_AUTH = false; // true is insecure as anyone can connect
const CHROME_PORT = chrome_port;
const COOKIE_OPTS = {
  secure: true,
  httpOnly: true,
  maxAge: 345600000,
  sameSite: 'None'
};

if ( ! PORT || ! COOKIE || ! TOKEN ) {
  throw new TypeError(`Must supply: <PORT> <COOKIE> <TOKEN>. 
    Receivedo only: ${JSON.stringify({PORT,COOKIE,TOKEN})}`
  );
}

try { 
  process.title = "browserbox-devtools";
} catch(e) {
  console.info(`Could not set process title. Current title: ${process.title}`, e);
}

const SSL_OPTS = {};
let GO_SECURE = true;
try {
  Object.assign(SSL_OPTS, {
    key: fs.readFileSync(path.resolve(CONFIG.sslcerts(PORT), 'privkey.pem')),
    cert: fs.readFileSync(path.resolve(CONFIG.sslcerts(PORT), 'fullchain.pem')),
    ca: fs.existsSync(path.resolve(CONFIG.sslcerts(PORT), 'chain.pem')) ? 
      fs.readFileSync(path.resolve(CONFIG.sslcerts(PORT), 'chain.pem')) 
      : 
      undefined,
  });
} catch(e) {
  console.warn(`Error using SSL`, e);
  GO_SECURE = false;
}

const SOCKETS = new Map();
//const internalEndpointRegex = /ws=localhost(:\d+)?([^ "'<>,;)}\]`]+)/g;
const internalEndpointRegex = /ws=localhost(:\d+)?([\/\w.-]+)/g;
//const internalEndpointRegex = /ws=localhost/g;

process.on('uncaughtException', err => { 
  console.error(`Uncaught exception`, err);
  process.exit(1);
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

const app = express();
app.use(limiter);
app.use(compression());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
app.use(function (req, res, next) {
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});

app.get('/login', (req, res) => {
  const {token} = req.query;
  let authorized;
  // if we are bearing a valid token set the cookie
  // so future requests will be authorized
  if ( token == TOKEN ) {
    DEBUG.debugDevtoolsServer && console.info(`Client logged in`, token);
    res.cookie(COOKIENAME+PORT, COOKIE, COOKIE_OPTS);
    authorized = true;
  } else {
    const cookie = req.cookies[COOKIENAME+PORT] || req.headers['x-browserbox-local-auth'];
    authorized = (cookie === COOKIE) || NO_AUTH;
  }
  if ( authorized ) {
    const uri = req.query.nextUri  && ! process.env.TORBB ? decodeURIComponent(req.query.nextUri) : '/';
    res.redirect(uri);
  } else {
    res.end(`
      <!DOCTYPE html>
      <style>:root { font-family: sans-serif; }</style>
      <h1>Logging you into devtools...</h1>
      <script src=devtools_login.js></script>
    `);
  }
});
app.post('/', (req, res) => {
  const {token} = req.body;
  let authorized;
  // if we are bearing a valid token set the cookie
  // so future requests will be authorized
  if ( token == TOKEN ) {
    res.cookie(COOKIENAME+PORT, COOKIE, COOKIE_OPTS);
    authorized = true;
  } else {
    const cookie = req.cookies[COOKIENAME+PORT];
    authorized = (cookie === COOKIE) || NO_AUTH;
  }
  if ( authorized ) {
    res.redirect('/');
  } else {
    res.sendStatus(401);
  }
});
app.get('/', (req, res) => {
  res.sendFile(path.resolve('public', 'index.html'));
});
app.get('/devtools/LICENSE.txt', (req, res) => {
  res.sendFile(path.resolve('public', 'devtools', 'LICENSE.txt'));
});
app.get('/devtools_login.js', (req, res) => {
  res.sendFile(path.resolve('public', 'devtools_login.js'));
});
/**
  // comment this out to ensure our proxy (below) uses the latest version
  app.get('/devtools/inspector.html', (req, res) => {
    res.sendFile(path.resolve('public', 'devtools', 'inspector.html'));
  });
  app.get('/devtools/inspector.js', (req, res) => {
    res.sendFile(path.resolve('public', 'devtools', 'inspector.js'));
  });
**/
app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.resolve('public', 'favicon.ico'));
});
app.get('/favicon.svg', (req, res) => {
  res.sendFile(path.resolve('public', 'favicon.svg'));
});
app.get('/favicons/favicon.ico', (req, res) => {
  res.sendFile(path.resolve('public', 'favicons', 'favicon.ico'));
});
app.get(/\/.*/, (req, res) => {
  const cookie = req.cookies[COOKIENAME+PORT] || req.headers['x-browserbox-local-auth'];
  const authorized = (cookie === COOKIE) || NO_AUTH;

  if (authorized) {
    const resource = {
      hostname: '127.0.0.1',
      port: CHROME_PORT,
      path: req.url,
      method: req.method,
      headers: req.headers
    };

    DEBUG.debugDevtoolsServer && console.info(`Request authorized`, {resource});

    const WSUrl_Raw = req.query.ws || req.query.wss || req.headers['host'].split(':')[0]; 
    const Frame = req.protocol == 'https' ? 'wss:' : 'ws:';
    const WSUrl = new URL(`${Frame}//${WSUrl_Raw}`);
    //WSUrl.searchParams.set('token', TOKEN);
    const ExternalEndpoint = `${Frame.slice(0,-1)}=${encodeURIComponent(WSUrl.href.slice(Frame.length+2).replace(/\/$/, ''))}`
    //const ExternalEndpoint = req.query.ws || req.query.wss || `wss=${req.headers['host'].split(':')[0]}`;

    DEBUG.debugDevtoolsServer && console.info({internalEndpointRegex, ExternalEndpoint});

    // CRDP checks that host is localhost
    req.headers['host'] = `${'localhost'}:${PORT}`;

    const destination = http.request(resource, destinationResponse => {
      const ct = destinationResponse.headers['content-type'];
      if ( ct.includes('json') ) {
        const onData = data => Data.body += data.toString();
        const Data = {body: ''};
        destinationResponse.on('data', onData);

        destinationResponse.headers['cache-control'] = 'no-cache';

        destinationResponse.on('end', () => {
          //destinationResponse.removeListener('data', onData);
          // save responses to inspect
            /**
            fs.writeFileSync(
              path.resolve('save', `file${Math.random().toString(36)}.data`),
              body
            );
            **/

          if ( internalEndpointRegex.test(Data.body) ) {

            const newVal = Data.body.replace(internalEndpointRegex, (match, port, capturedPart) => {
              console.log('match', match);
              // Construct the new URL using the captured part
              //const result = `${ExternalEndpoint}`; //${capturedPart}/${encodeURIComponent(TOKEN)}`;
              const result = `${ExternalEndpoint}${capturedPart}/${encodeURIComponent(TOKEN)}`;
              console.log('result', result);
              return result;
            }); 

            // update content length
            destinationResponse.headers['content-length'] = newVal.length+'';
            DEBUG.debugDevtoolServer && console.log(destinationResponse.headers, req.url, Data.body.length);
            //res.writeHead(destinationResponse.statusCode, destinationResponse.headers);
            res.write(newVal);
            res.end();
          } else {
            res.writeHead(destinationResponse.statusCode, destinationResponse.headers);
            res.end(Data.body);
          }
        });
      } else if ( ct.includes('javascript') ) {
        const onData = data => Data.body += data.toString();
        const Data = {body: ''};
        destinationResponse.on('data', onData);

        destinationResponse.on('end', () => {
          //destinationResponse.removeListener('data', onData);
          // save responses to inspect
            /**
            fs.writeFileSync(
              path.resolve('save', `file${Math.random().toString(36)}.data`),
              body
            );
            **/

          if ( Data.body.includes('chrome://new') ) {
            let newVal = Data.body.replace(/chrome:\/\/newtab/g, 'data:text,about:blank');
            newVal = newVal.replace(/chrome:\/\/new-tab-page/g, 'data:text,about:blank');
            // update content length
            destinationResponse.headers['content-length'] = newVal.length+'';
            DEBUG.debugDevtoolServer && console.log(destinationResponse.headers, req.url, Data.body.length);
            res.writeHead(destinationResponse.statusCode, destinationResponse.headers);
            res.write(newVal);
            res.end();
          } else {
            res.writeHead(destinationResponse.statusCode, destinationResponse.headers);
            res.end(Data.body);
          }
        });
      } else {
        destinationResponse.headers['cache-control'] = 'max-age=86400';
        res.writeHead(destinationResponse.statusCode, destinationResponse.headers);
        destinationResponse.pipe(res, {end: true});
      }
    });

    req.pipe(destination, {end: true});
  } else {
    console.log('Request not authorized to proxy through devtools server');
    res.sendStatus(401);
  }
});

const server = (GO_SECURE ? https : http).createServer(SSL_OPTS, app);

const wss = new WebSocket.Server({server});

// we should probably handle upgrade too to stop server crashing on a 404 websocket. weird
wss.on('connection', (ws, req) => {
  try {
    const cookie = req.headers.cookie || req.headers['x-browserbox-local-auth'];
    const parts = req.url.split('/');
    let token;
    if ( parts.length == 5 ) {
      token = parts.pop();
    }
    const path = parts.join('/');
    const authorized = (cookie && cookie.includes(`${COOKIENAME+PORT}=${COOKIE}`)) || token == TOKEN || NO_AUTH;
    DEBUG.debugDevtoolsServer && console.log('connect', {cookie, authorized, token, path, parts}, req.path, req.url);
    if ( authorized ) {
      const url = `ws://127.0.0.1:${CHROME_PORT}${path}`;
      try {
        let crdpSocket = new WebSocket(url);
        SOCKETS.set(ws, crdpSocket);
        ws.on('error', err => {
          DEBUG.debugDevtoolServer && console.warn(`Front-end socket error`, err);
        });
        crdpSocket.on('error', err => {
          DEBUG.debugDevtoolServer && console.warn(`CRDPSocket error`, err);
        });
        ws.on('open', () => {
          DEBUG.debugDevtoolsServer && console.log('Front-end socket open');
        });
        crdpSocket.on('open', () => {
          DEBUG.debugDevtoolsServer && console.log('CRDP Socket open');
        });
        crdpSocket.on('message', async msg => {
          //console.log('Browser sends us message', msg);
          if ( ws.readyState < WebSocket.OPEN ) {
            await untilTrueOrTimeout(() => ws.readyState == WebSocket.OPEN, 150);
          } 
          ws.send(msg);
        });
        ws.on('message', async msg => {
          //console.log('We send browser message');
          if ( crdpSocket.readyState < WebSocket.OPEN ) {
            await untilTrueOrTimeout(() => crdpSocket.readyState == WebSocket.OPEN, 150);
          } 
          crdpSocket.send(msg);
        });
        ws.on('close', (code, reason) => {
          SOCKETS.delete(ws);
          crdpSocket.close(1001, 'client disconnected');
        });
        crdpSocket.on('close', (code, reason) => {
          SOCKETS.delete(ws);
          ws.close(1011, 'browser disconnected');
        });
      } catch(e) {
        console.warn('Error on websocket creation', e);
      }
    } else {
      console.warn(`WS not authorized`);
      if ( ws.readyState == WebSocket.OPEN ) {
        ws.send(JSON.stringify({error:`Not authorized`}));
      }
      ws.close();
    }
  } catch(err) {
    console.warn(`Error during ws connection`, err);
    ws.close();
  }
});
wss.on('error', err => {
  console.warn(`DevTools server warning`, err, PORT);
});

server.listen(PORT, err => {
  if ( err ) {
    console.warn(`DevTools server warning`, err, PORT);
    throw err;
  }
  DEBUG.debugDevtoolsServer && console.log({crdpSecureProxyServer: { up: new Date, port: PORT }});
  console.log({devtoolServer: {up: new Date, port: PORT}});
});
