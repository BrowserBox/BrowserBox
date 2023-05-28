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

import {
  DEBUG,
  app_port,
  chrome_port,
  version,
  COOKIENAME,
  CONFIG,
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

const SSL_OPTS = {};
let GO_SECURE = true;
try {
  Object.assign(SSL_OPTS, {
    key: fs.readFileSync(path.resolve(os.homedir(), CONFIG.sslcerts, 'privkey.pem')),
    cert: fs.readFileSync(path.resolve(os.homedir(), CONFIG.sslcerts, 'fullchain.pem')),
    ca: fs.existsSync(path.resolve(os.homedir(), CONFIG.sslcerts, 'chain.pem')) ? 
      fs.readFileSync(path.resolve(os.homedir(), CONFIG.sslcerts, 'chain.pem')) 
      : 
      undefined,
  });
} catch(e) {
  console.warn(`Error using SSL`, e);
  GO_SECURE = false;
}

const SOCKETS = new Map();

const app = express();
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
    const cookie = req.cookies[COOKIENAME+PORT];
    authorized = (cookie === COOKIE) || NO_AUTH;
  }
  if ( authorized ) {
    res.redirect('/');
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
app.get('*', (req, res) => {
  const cookie = req.cookies[COOKIENAME+PORT];
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
    const InternalEndpoint = /ws=localhost/g;
    const ExternalEndpoint = req.query.ws || req.query.wss || `wss=${req.headers['host'].split(':')[0]}`;

    DEBUG.debugDevtoolsServer && console.info({InternalEndpoint, ExternalEndpoint});

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

          if ( InternalEndpoint.test(Data.body) ) {
            const newVal = Data.body.replace(InternalEndpoint, ExternalEndpoint);
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
    res.sendStatus(401);
  }
});

const server = (GO_SECURE ? https : http).createServer(SSL_OPTS, app);

const wss = new WebSocket.Server({server});

wss.on('connection', (ws, req) => {
  const cookie = req.headers.cookie;
  const authorized = (cookie && cookie.includes(`${COOKIENAME+PORT}=${COOKIE}`)) || NO_AUTH;
  DEBUG.debugDevtoolServer && console.log('connect', {cookie, authorized}, req.path, req.url);
  if ( authorized ) {
    const url = `ws://127.0.0.1:${CHROME_PORT}${req.url}`;
    try {
      const crdpSocket = new WebSocket(url);
      SOCKETS.set(ws, crdpSocket);
      crdpSocket.on('open', () => {
        DEBUG.debugDevtoolServer && console.log('CRDP Socket open');
      });
      crdpSocket.on('message', msg => {
        //console.log('Browser sends us message', msg);
        ws.send(msg);
      });
      ws.on('message', msg => {
        //console.log('We send browser message');
        crdpSocket.send(msg);
      });
      ws.on('close', (code, reason) => {
        SOCKETS.delete(ws);
        crdpSocket.close(1001, 'client disconnected');
      });
      crdpSocket.on('close', (code, reason) => {
        SOCKETS.delete(ws);
        crdpSocket.close(1011, 'browser disconnected');
      });
    } catch(e) {
      console.warn('Error on websocket creation', e);
    }
  } else {
    ws.send(JSON.stringify({error:`Not authorized`}));
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
});
