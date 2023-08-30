#!/usr/bin/env node
'use strict';

import fs from 'fs';
import os from 'os';
import path from 'path';
import url from 'url';
import childProcess from 'child_process';
import http from 'http';
import https from 'https';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import csrf from 'csurf';
import express from 'express';
import exitOnEpipe from 'exit-on-epipe';
import {WebSocket,WebSocketServer} from 'ws';
import {PassThrough} from 'node:stream';
import {Reader,Writer} from '@dosy/wav';

import {
  DEBUG as APP_DEBUG, APP_ROOT, GO_SECURE, 
  COOKIENAME, ALLOWED_3RD_PARTY_EMBEDDERS,
  CONFIG
} from '../../../common.js';
const DEBUG = {
  showAllData: false,
  showDroppedSilents: false,
  showPrimeFilter: false,
  showPrimeChecks: false,
  showAllMessages: false,
  showAcks: false,
  showConnections: true,
  val: 1,
  showFormat: true,
  mode: 'dev',
  goSecure: true
}
const Clients = new Set();
const sockets = new Set();
const SAMPLE_RATE = 44100;
const FORMAT_BIT_DEPTH = 16;
const MAX_DATA_SIZE = 1200; //SAMPLE_RATE * (FORMAT_BIT_DEPTH/8) // we actually only get around 300 bytes per chunk on average, ~ 3 msec;
const CutOff = {};
const primeCache = [2, 3, 5];
let primeSet = new Set(primeCache);
const SparsePrimes = createSparsePrimes(MAX_DATA_SIZE);

const argv = process.argv;
let device = argv[3] || 'rtp.monitor' || 'auto_null.monitor';

const encoders = {
  mp3: {
    contentType: 'audio/mpeg',
    command: 'lame',
    /*args: ['-S', '--noreplaygain', '-f', '-r', '-B', '20', '-', '-']*/
    args: ['-S', '-r', '-', '-']
  },
  wav: {
    contentType: 'audio/wav',
    /*
    command: () => new Writer({
        endianness: 'LE', 
        sampleRate: 44100,
        bitDepth: 16,
        channels: 1
    }),
    */
  },
  flac: {
    contentType: 'audio/flac',
    command: 'flac',
    args: [
      '-0',
      '--endian=little',
      '--sign=signed',
      '--sample-rate=44100',
      '--bps=16',
      '--channels=2',
      '--silent',
      '-'
    ]
  }
};
//const encoderType = 'flac';
//const encoderType = 'mp3';
const encoderType = 'wav';

var hooks = 0;
let parec = undefined;
let encoder = undefined;
let encoderExpiration;
const ENCODER_EXPIRY_MS = 13*60*1000; // shut down encoder after 13 minutes of nobody listening

const SSL_OPTS = {};
const COOKIE_OPTS = {
  secure: true,
  httpOnly: true,
  maxAge: 345600000,
  sameSite: 'None'
};
const RateLimiter = rateLimit({
  windowMs: 1000 * 60 * 3,
  max: DEBUG.mode == 'dev' ? 10000 : 2000
});

let certsFound = false;

if ( DEBUG.goSecure ) {
  try {
    Object.assign(SSL_OPTS, {
      key: fs.readFileSync(path.resolve(os.homedir(), CONFIG.sslcerts, 'privkey.pem')),
      cert: fs.readFileSync(path.resolve(os.homedir(), CONFIG.sslcerts, 'fullchain.pem')),
      ca: fs.existsSync(path.resolve(os.homedir(), CONFIG.sslcerts, 'chain.pem')) ? 
          fs.readFileSync(path.resolve(os.homedir(), CONFIG.sslcerts, 'chain.pem'))
        :
          undefined
    });
    certsFound = true;
  } catch(e) {
    DEBUG.err && console.warn(e);
  }
  DEBUG.val && console.log(SSL_OPTS, {GO_SECURE});
}

function maybeStartEncoderExpiryClock(client) {
  Clients.delete(client);
  hooks--;
  if (hooks > 0) return;
  DEBUG.val && console.log(`Starting encoder expiration clock`);
  encoderExpiration = setTimeout(killAudio, ENCODER_EXPIRY_MS);
}

function killAudio() {
  DEBUG.val && console.log('killing encoder because nobody is listening');
  encoder?.kill && encoder.kill('SIGINT');
  parec?.kill && parec.kill('SIGINT');
  encoder = undefined;
  parec = undefined;
}

function stopEncoderExpiryClock(client) {
  DEBUG.val && console.log(`Stopping encoder expiration clock`);
  Clients.add(client);
  hooks++;
  clearTimeout(encoderExpiration);
  encoderExpiration = false;
}

const port = parseInt(argv[2]);
const PORT = port;
const COOKIE = process.argv[4];
const TOKEN = process.argv[5];
DEBUG.val && console.log('starting http server on port', port);
console.log({ALLOWED_3RD_PARTY_EMBEDDERS});
const MODE = certsFound ? https: http;
const app = express();
let shuttingDown = false;
let audioProcessShuttingDown = false;

app.set('etag', false);
if ( ! APP_DEBUG.noSecurityHeaders ) {
  app.use(helmet({
    frameguard: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
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
          "https://localhost:*",
          "https://*.dosyago.com:*",
          "https://*.browserbox.pro:*"
        ],
        frameSrc: [
          "'self'",
          `https://*.dosyago.com:${PORT+1}`,
          `https://*.dosyago.com:${PORT+2}`,
          `https://*.dosyago.com:${PORT+3}`,
          "https://*.browserbox.pro:*",
          ...ALLOWED_3RD_PARTY_EMBEDDERS
        ],
        frameAncestors: [
          "'self'",
          "https://*.dosyago.com:*",
          "https://*.browserbox.pro:*",
          ...ALLOWED_3RD_PARTY_EMBEDDERS
        ],
        connectSrc: [
          "'self'",
          "wss://*.dosyago.com:*",
          `https://*.dosyago.com:${PORT+1}`,
          "wss://*.browserbox.pro:*"
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
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
      reportOnly: false,  
    }
  }));
} else {
  app.use(cors());
}
app.use(compression({
  level: 4
}));
app.use(RateLimiter);
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
app.use(csrf({cookie:{sameSite:'None', secure:true}}));
const staticPath = path.resolve(APP_ROOT, 'services', 'instance', 'parec-server', 'public');
console.log({staticPath});
app.use(express.static(staticPath));
app.use((req,res,next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

app.get('/login', (req, res) => {
  res.type('html');
  const {token} = req.query; 
  const cookie = req.cookies[COOKIENAME+PORT];
  let loggedIn = false;
  if ( token == TOKEN ) {
    res.cookie(COOKIENAME+PORT, COOKIE, COOKIE_OPTS);
    loggedIn = true;
  } else if ( cookie == COOKIE ) {
    loggedIn = true;
  }
  if ( loggedIn ) {
    res.end(`
      <!DOCTYPE html>
      <script src=request_audio.js></script>
    `);
  } else {
    res.end(`
      <!DOCTYPE html>
      <script src=request_login.js></script>
    `);
  }
});

/*
  app.get('/', (request, response) => {
    const cookie = request.cookies[COOKIENAME+PORT];
    if ( cookie == COOKIE ) {
      var contentType = encoders[encoderType].contentType;
      DEBUG.val && console.log('  setting Content-Type to', contentType);

      response.writeHead(200, {
        'Connection': 'keep-alive',
        'Content-Type': contentType
      });

      const enc = getEncoder();

      if ( enc?.stdout ) {
        enc.stdout.pipe(response);
      } else if ( enc?.pipe ) {
        enc.pipe(response);
      } else {
        console.warn(`Encoder has no stdout or pipe properties`);
      }

      exitOnEpipe(response);
     
      //enc.stdout.on('data', function(buffer) {
      //  response.write(buffer);
      //});

      request.on('close', function() {
        response.end();
        releaseEncoder();
      });
    } else {
      response.sendStatus(401);
    }
  });
*/

const server = MODE.createServer(SSL_OPTS, app);
const socketWaveStreamer = new WebSocketServer({
  server,
  perMessageDeflate: false,
});

socketWaveStreamer.on('connection',  (ws, req) => {
  cookieParser()(req, {}, () => console.log('cookie parsed'));
  const cookie = req.cookies[COOKIENAME+PORT];
  console.log({cookie});
  if ( cookie == COOKIE ) {
    console.log('auth');
  } else {
    console.log('Audio: closing as not authorized');
    ws.send("closing as not authorized");
    ws.close();
    return;
  }
  const client = {
    ACK_VALUE: 3,
    DATA_SIZE: 44100,
    BUF_WINDOW: 4,
    ackReceived: 0,
    firstAck: true,
    buffer: [],
    packet: [],
    ip: `${ws?._socket?.remoteAddress}:${ws?._socket?.remotePort}`,
  };
  stopEncoderExpiryClock(client);
  DEBUG.showConnections && console.log(`Now have ${Clients.size} clients`, Clients);
  try {
    DEBUG.val && console.log('ws (wave header + pcm stream) connection (server #2)');

    const reader = getEncoder().stdout;
    ws.send("give me ack");

    let totalLength = 0;

    const processData = data => {
      DEBUG.showAllData && console.log(`Got data with length`, data.length);
      if ( CONFIG.audioDropPossiblySilentFrames && isSilent(data) ) {
        DEBUG.showDroppedSilents && console.log('drop', data.length, data);
        client.packet.length = 0;
        totalLength = 0;
        client.buffer.length = 0;
        return;
      }
      totalLength += data.length;
      client.packet.push(data);
      if ( totalLength >= client.DATA_SIZE ) {
        const packet = Buffer.concat(client.packet, totalLength);
        totalLength = 0;
        client.packet.length = 0;
        client.buffer.push(packet);
      }
      while ( client.buffer.length > client.BUF_WINDOW ) {
        client.buffer.shift();
      }
      if ( client.buffer.length && client.ackReceived && ws.readyState < WebSocket.CLOSING ) {
        DEBUG.showAllData && console.log(`sending`, Array.from(data).join(' '), 'silent?', isSilent(data));
        ws.send(client.buffer.shift());
        client.ackReceived--;
      }
    };
    reader.on('data', processData);

    function isSilent(data) {
      return data[0] === 0 && data[data.length-1] === 0 && checks(data);
    }

    function checks(dat) {
      const sz = dat.length;
      if ( sz < 3 ) return true;
      const pr = SparsePrimes.slice(0, CutOff[sz]);
      const P = pr.length;
      DEBUG.showPrimeChecks && console.log(
        "miss end by", dat.length - 1 - pr[pr.length-1], "last dat at", dat.length - 1, "last check at", pr[pr.length-1]
      );
      for(let i = 0, p; i < P; i++) {
        p = pr[i];
        if ( dat[p] !== 0 ) {
          DEBUG.showPrimeChecks && console.log({p, datp: dat[p], p, len: dat.length});
          return false;
        }
      }
      return true;
    }

    ws.on('open', () => {
      client.packet.length = 0;
      totalLength = 0;
      client.buffer.length = 0;
    });
    ws.on('message', async msg => {
      msg = msg.toString();
      DEBUG.showAllMessages && console.log(msg);
      if ( msg === "ack" ) {
        DEBUG.showAcks && console.log(`Ack received`);
        if ( client.isFirstAck ) {
          client.firstAck = false;
          client.packet.length = 0;
          totalLength = 0;
          client.buffer.length = 0;
          console.log("first ack", true, client.ackReceived);
        }
        client.ackReceived = client.ACK_VALUE;
        while ( client.ackReceived && client.buffer.length && ws.readyState < WebSocket.CLOSING ) {
          DEBUG.val && console.log(`sending`, client.buffer[0]);
          ws.send(client.buffer.shift());
          client.ackReceived--;
        }
      } else if ( msg === "stop" ) {
        /*
          client.packet.length = 0;
          totalLength = 0;
          client.buffer.length = 0;
        */
      }
    });
    ws.on('error', err => console.warn('WebSocket error', err));
    ws.on('close', info => {
      console.log(`WebSocket closing`, info);
      reader.off('data', processData);
      maybeStartEncoderExpiryClock(client);
      client.packet.length = 0;
      totalLength = 0;
      client.buffer.length = 0;
    });
  } catch(e) {
    console.warn(e);
  }
});

server.on('connection', function(socket) {
  sockets.add(socket);
  socket.on('close', () => sockets.delete(socket));
  DEBUG.showConnections && console.log('New http connection: setting no delay true');
  socket.setNoDelay(true);
});

server.on('upgrade', (req, socket, head) => {
  sockets.add(socket);
  socket.on('close', () => sockets.delete(socket));
  console.log('http upgrade');
  const {pathname} = url.parse(req.url);
  switch(pathname) {
    case "/stream": {
    }; break;
    default: {
      console.log('Destroying socket as wrong path', pathname);
      sockets.delete(socket);
      socket.destroy();
    }; break;
  }
});

server.listen(port);

try {
  childProcess.execSync(`sudo renice -n ${CONFIG.reniceValue} -p ${process.pid}`);
} catch(e) {
  console.info(e);
  console.warn(`Could not renice node audio service`);
}

console.warn('Shut down buries errors');
//process.on('SIGINT', shutDown);
//process.on('SIGUSR2', shutDown);
//process.on('exit', shutDown);


function getEncoder() {
  audioProcessShuttingDown = false;
  if (encoder) return encoder;

  DEBUG.val && console.log('starting encoder');
  //parec = childProcess.spawn('parec', ['--no-remix', '--process-time-msec=100', '--latency-msec=100', '-d', device]);
  //parec = childProcess.spawn('pacat', ['-r', '--no-remix', '--process-time-msec=100', '--latency-msec=100', '-d', device]);
  parec = childProcess.spawn('pacat', [
    '-r',  /* record: the default if run as parec */
    `--rate=${SAMPLE_RATE}`,
    `--format=s${FORMAT_BIT_DEPTH}le`,
    '--channels=1',
    /* // this breaks it
      '--fix-rate',
      '--fix-format',
    */
    /*'--no-remix',*/
    '--process-time-msec=100', 
    '--latency-msec=100', 
    '-d', device
  ]);
  parec.on('spawn', e => {
    console.log('parec spawned', e, parec.pid);
  });
  exitOnEpipe(parec.stdout);
  exitOnEpipe(parec.stderr);
  parec.stderr.pipe(process.stdout);
  
  parec.on('error', e => {
    console.log('parec error', e);
    killAudio();
    //shutDown();
  });
  parec.on('close', e => {
    console.log('parec close', e);
    killAudio();
    //shutDown();
  });
  parec.on('exit', e => { 
    console.log('parec exit', e);
    killAudio();
    //shutDown();
  });
  try {
    childProcess.execSync(`sudo renice -n ${CONFIG.reniceValue} -p ${parec.pid}`);
  } catch(e) {
    console.warn(`Error renicing parec`, e);
  }

  const encoderCommand = encoders[encoderType];

  if ( typeof encoderCommand?.command === "string" ) {
    encoder = childProcess.spawn(encoderCommand.command, encoderCommand.args);
    exitOnEpipe(encoder.stdout);
    exitOnEpipe(encoder.stderr);
    encoder.stderr.pipe(process.stdout);
    encoder.on('error', e => {
      console.log('encoder error', e);
      audioProcessShutDown();
    });
    encoder.on('close', e => {
      console.log('encoder close', e);
      audioProcessShutDown();
    });
    encoder.on('exit', e => { 
      console.log('encoder exit', e);
      audioProcessShutDown();
    });
    childProcess.execSync(`sudo renice -n ${CONFIG.reniceValue} -p ${encoder.pid}`);

    parec.stdout.pipe(encoder.stdin);

    return encoder;
  } else if ( typeof encoderCommand?.command === "function" ) {
    encoder = encoderCommand.command();
    parec.stdout.pipe(encoder);
    return encoder;
  } else {
    encoder = parec;
    return parec;
  }
}

function audioProcessShutDown() {
  if ( audioProcessShuttingDown ) return;
  audioProcessShuttingDown = true;
  if ( encoder ) {
    try {
      encoder?.kill && encoder.kill();
      encoder = null;
    } catch(e) {
      console.log(`Error killing encoder`, e);
    }
  }
  if ( parec ) {
    try {
      parec?.kill && parec.kill();
      parec = null;
    } catch(e) {
      console.log(`Error killing parec`, e);
    }
  }
}

function shutDown(...args) {
  if ( shuttingDown ) return;
  shuttingDown = true;
  audioProcessShutDown();
  server.close(() => console.info(`Server closed on ${[args].join(',')}`));
  sockets.forEach(socket => {
    try { socket.destroy(); sockets.delete(socket); } catch(e) {
      DEBUG && console.warn(`MAIN SERVER: port ${port}, error closing socket`, e)
    }
  });
  process.exit(0);
};

function createSparsePrimes(len) {
  // take the primes up to len and then weed out 61.8 % of them
  const primes = primesUpTo(len);
  const filteredPrimes = primes.filter(() => Math.random() <= 0.618);

  for(let j = 1, end = 0, p = filteredPrimes[0], nextP = filteredPrimes[1]; j < filteredPrimes.length && end < MAX_DATA_SIZE; end++) {
    if ( end > nextP ) {
      j++;
      p = nextP; 
      nextP = filteredPrimes[j];
    }
    CutOff[end] = j;
  }

  DEBUG.showPrimeFilter && console.log(filteredPrimes.join(' '), CutOff);
  return filteredPrimes;
}

/* 
  from my code: 
  https://github.com/crisdosyago/weird-json/blob/9f8868a68e523317b51f9ed1f328b4d52dd6ff58/src/prime-code/index.js
*/

function primesUpTo(n, beginning = 2) {
  // return primes up to n, optionally starting at beginning
  let fillCache = beginning == 2;

  const primes = [];
  let i = beginning;

  while(i <= n) {
    if ( isPrime(i) ) {
      primes.push(i);
      if ( fillCache && primes.length > primeCache.length ) {
        primeCache.push(i);
      }
    }
    i++;
  }

  primeSet = new Set(primeCache);

  return primes;
}

function isPrime(n) {
  if ( n === 2 || n === 3 ) return true;

  let remainder = n % 2;

  if ( remainder === 0 ) return false;

  remainder = n % 3;

  if ( remainder === 0 ) return false;

  if ( primeSet.has(n) ) return true;

  const maxFactor = Math.floor(Math.sqrt(n));

  let primeIndex = 2;
  let factor = primeCache[primeIndex]; // 5

  while(factor <= maxFactor) {
    remainder = n % factor;

    if ( remainder === 0 ) return false;

    primeIndex++;
    if ( primeIndex < primeCache.length ) {
      factor = primeCache[primeIndex];
    } else {
      const sixRemainder = factor % 6;

      if ( sixRemainder === 5 ) {
        factor += 2;
      } else if ( sixRemainder === 1 ) {
        factor += 4;
      }
    }
  }

  return true;
}
