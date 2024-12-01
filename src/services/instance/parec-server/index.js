#!/usr/bin/env node
'use strict';

import fs from 'fs';
import os from 'os';
import path from 'path';
import url from 'url';
import childProcess from 'child_process';
import stream from 'stream';
import http from 'http';
import https from 'https';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import express from 'express';
import exitOnEpipe from 'exit-on-epipe';
import {WebSocket,WebSocketServer} from 'ws';
import {Reader,Writer} from '@dosy/wav';

import {
  DEBUG as APP_DEBUG, APP_ROOT, GO_SECURE, 
  COOKIENAME, ALLOWED_3RD_PARTY_EMBEDDERS,
  CONFIG, sleep
} from '../../../common.js';
const DEBUG = {
  debugRetries: true,
  showAllData: false,
  showPacketPushes: false,
  showDroppedSilents: false,
  showPrimeFilter: false,
  showPrimeChecks: false,
  showAllMessages: false,
  showAcks: false,
  showConnections: true,
  showClients: false,
  val: 0,
  showFormat: true,
  mode: 'prod',
  goSecure: true
}

try { 
  process.title = "browserbox-sound";
} catch(e) {
  console.info(`Could not set process title. Current title: ${process.title}`, e);
}

class MockStream extends stream.Readable {
  _read() {

  }
}
const Clients = new Set();
const sockets = new Set();
const SAMPLE_RATE = DEBUG.windowsUses48KAudio && process.platform.startsWith('win') ? 48000 : 44100;
const FORMAT_BIT_DEPTH = 16;
const BYTE_ALIGNMENT = FORMAT_BIT_DEPTH >> 3;
const MAX_DATA_SIZE = 1200; //SAMPLE_RATE * (FORMAT_BIT_DEPTH/8) // we actually only get around 300 bytes per chunk on average, ~ 3 msec;
const CutOff = {};
const primeCache = [2, 3, 5];
let Encoders = new Set();
let primeSet = new Set(primeCache);
const SparsePrimes = createSparsePrimes(MAX_DATA_SIZE);

const argv = process.argv;
let device = argv[3] || 'rtp.monitor' || 'auto_null.monitor';

const encoders = {
  mp3: {
    contentType: 'audio/mpeg',
    command: 'lame',
    /*args: ['-S', '--noreplaygain', '-f', '-r', '-B', '20', '-', '-'],*/
    args: ['-S', '-r', '-', '-']
  },
  wav: {
    contentType: 'audio/wav',
    ...(process.env.TORBB ? {
      command: () => new Writer({
          endianness: 'LE', 
          sampleRate: SAMPLE_RATE,
          bitDepth: FORMAT_BIT_DEPTH,
          channels: 1
      }),
    } : {})
  },
  flac: {
    contentType: 'audio/flac',
    command: 'flac',
    args: [
      '-0',
      '--endian=little',
      '--sign=signed',
      `--sample-rate=${SAMPLE_RATE}`,
      `--bps=${FORMAT_BIT_DEPTH}`,
      '--channels=2',
      '--silent',
      '-'
    ]
  }
};
const encoderType = process.env.TORBB ? 'wav' : 'wav';
const MAX_RETRY_COUNT = 703;

var hooks = 0;
let parec = undefined;
let savedEncoder;
let encoderExpiration;
let retryCount = 0;
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

function maybeStartEncoderExpiryClock(client) {
  Clients.delete(client);
  hooks--;
  if (hooks > 0) return;
  DEBUG.val && console.log(`Starting encoder expiration clock`);
  encoderExpiration = setTimeout(killAudio, ENCODER_EXPIRY_MS);
}

function killAudio() {
  DEBUG.val && console.log('killing encoder because nobody is listening');
  for( let encoder of Encoders.values()) {
    try {
      encoder?.kill?.('SIGINT');
      encoder?.parec?.kill?.('SIGINT');
    } catch(e) {
      console.warn('error killing encoder', e, encoder);
    }
  }
  Encoders = new Set();
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
let certsFound = false;
if ( DEBUG.goSecure ) {
  try {
    Object.assign(SSL_OPTS, {
      key: fs.readFileSync(path.resolve(CONFIG.sslcerts(port), 'privkey.pem')),
      cert: fs.readFileSync(path.resolve(CONFIG.sslcerts(port), 'fullchain.pem')),
      ca: fs.existsSync(path.resolve(CONFIG.sslcerts(port), 'chain.pem')) ? 
          fs.readFileSync(path.resolve(CONFIG.sslcerts(port), 'chain.pem'))
        :
          undefined
    });
    certsFound = true;
  } catch(e) {
    DEBUG.err && console.warn(e);
  }
  DEBUG.val && console.log(SSL_OPTS, {GO_SECURE});
  console.log(SSL_OPTS, {GO_SECURE}, path.resolve(CONFIG.sslcerts(port), 'privkey.pem'));
}
const MODE = certsFound ? https: http;
const app = express();
let RETRY_WORTHY_EXIT = 11000;
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
          "data:",
          "https://link.local:*",
          "https://localhost:*",
          "https://*.dosyago.com:*",
          "https://browse.cloudtabs.net:*"
        ],
        frameSrc: [
          "'self'",
          `https://*.dosyago.com:${PORT+1}`,
          `https://*.dosyago.com:${PORT+2}`,
          `https://*.dosyago.com:${PORT+3}`,
          "https://browse.cloudtabs.net:*",
          ...ALLOWED_3RD_PARTY_EMBEDDERS
        ],
        frameAncestors: [
          "'self'",
          "https://localhost:*",
          "https://link.local:*",
          "https://*.dosyago.com:*",
          "https://browse.cloudtabs.net:*",
          ...ALLOWED_3RD_PARTY_EMBEDDERS
        ],
        connectSrc: [
          "'self'",
          "wss://*.link.local:*",
          `https://*.link.local:${PORT+1}`,
          "wss://*.dosyago.com:*",
          `https://*.dosyago.com:${PORT+1}`,
          "wss://browse.cloudtabs.net:*",
          `https://${process.env.DOMAIN}:*`, // main service (for data: urls seemingly)
          `https://*.${process.env.DOMAIN}:*`, // main service (for data: urls seemingly)
          `wss://${process.env.DOMAIN}:*`, // main service (for data: urls seemingly)
          `wss://*.${process.env.DOMAIN}:*`, // main service (for data: urls seemingly)
        ],
        styleSrc: [
          "'self'", 
          "'unsafe-inline'"
        ],
        scriptSrc: [
          "'self'", 
          "'unsafe-eval'",
          ...(process.env.TORBB ? [
            "'unsafe-inline'"
          ] : []),
        ],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
      reportOnly: false,  
    }
  }));
  app.use(helmet.hsts({
    maxAge: 0
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
const staticPath = path.resolve(APP_ROOT, 'services', 'instance', 'parec-server', 'public');
const serverPath = path.resolve(APP_ROOT, 'services', 'instance', 'parec-server');
console.log({staticPath});
app.use(express.static(staticPath));
app.use((req,res,next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

if ( process.env.TORBB ) {
  app.get('/', wrap(async (request, response) => {
    const {token, activateOnly} = request.query; 
    const cookie = request.cookies[COOKIENAME+PORT] || request.headers['x-browserbox-local-auth'] || request.query['localCookie'];
    if ( token == TOKEN || cookie == COOKIE ) {
      if ( activateOnly && activateOnly != 'false' ) {
        // do not start a wav process if we are just activating
        response.type('text/html');
        return response.status(200).send(`<!DOCTYPE html><script>setTimeout(() => window.close(), 500);</script>`);
      }
      var contentType = encoders[encoderType].contentType;
      DEBUG.val && console.log('  setting Content-Type to', contentType);

      response.writeHead(200, {
        'Connection': 'keep-alive',
        'Content-Type': contentType
      });

      const enc = await getEncoder();
      let unpipe;

      if ( enc?.stdout ) {
        DEBUG.val  && console.log('Setting encoder stdout to pipe');
        enc.stdout.pipe(response);
        unpipe = () => enc.stdout.unpipe(resopnse);
      } else if ( enc?.pipe ) {
        DEBUG.val  && console.log('Setting encoder to pipe');
        enc.pipe(response);
        unpipe = () => enc.unpipe(response);
      } else {
        console.warn(`Encoder has no stdout or pipe properties`);
      }

      exitOnEpipe(response);
     
      request.on('close', function() {
        DEBUG.val && console.log('Request closing');
        try {
          unpipe();
          if ( process.env.TORBB ) {
            killEncoder(enc);
          }
        } catch(e) {
          console.warn(`Error on unpipe at end of request / resopnse`);
        }
        response.end();
      });
    } else {
      response.sendStatus(401);
    }
  }));
  app.get('/login', (req, res) => {
    const {token, activateOnly} = req.query; 
    const cookie = req.cookies[COOKIENAME+PORT] || req.headers['x-browserbox-local-auth'] || req.query['localCookie'];
    let loggedIn = false;
    if ( token == TOKEN ) {
      res.cookie(COOKIENAME+PORT, COOKIE, COOKIE_OPTS);
      loggedIn = true;
    } else if ( cookie == COOKIE ) {
      loggedIn = true;
    }
    if ( loggedIn ) {
      res.redirect(`/?token=${encodeURIComponent(TOKEN)}&activateOnly=${ activateOnly ? activateOnly : 'false'}`);
    } else {
      res.sendStatus(401);
    }
  });
} else {
  app.get('/login', (req, res) => {
    res.type('html');
    const {token} = req.query; 
    const cookie = req.cookies[COOKIENAME+PORT] || req.headers['x-browserbox-local-auth'] || req.query['localCookie'];
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
  app.get('/', wrap(async (request, response) => {
    const {token, activateOnly} = request.query; 
    const cookie = request.cookies[COOKIENAME+PORT] || request.headers['x-browserbox-local-auth'] || request.query['localCookie'];
    if ( token == TOKEN || cookie == COOKIE ) {
      if ( activateOnly && activateOnly != 'false' ) {
        // do not start a wav process if we are just activating
        response.type('text/html');
        return response.status(200).send(`<!DOCTYPE html><script>setTimeout(() => window.close(), 500);</script>`);
      }
      var contentType = encoders[encoderType].contentType;
      DEBUG.val && console.log('  setting Content-Type to', contentType);

      response.writeHead(200, {
        'Connection': 'keep-alive',
        'Content-Type': contentType
      });

      const enc = await getEncoder();
      let unpipe;

      if ( enc?.stdout ) {
        DEBUG.val  && console.log('Setting encoder stdout to pipe');
        enc.stdout.pipe(response);
        unpipe = () => enc.stdout.unpipe(resopnse);
      } else if ( enc?.pipe ) {
        DEBUG.val  && console.log('Setting encoder to pipe');
        enc.pipe(response);
        unpipe = () => enc.unpipe(response);
      } else {
        console.warn(`Encoder has no stdout or pipe properties`);
      }

      exitOnEpipe(response);
     
      request.on('close', function() {
        DEBUG.val && console.log('Request closing');
        try {
          unpipe();
          if ( process.env.TORBB ) {
            killEncoder(enc);
          }
        } catch(e) {
          console.warn(`Error on unpipe at end of request / resopnse`);
        }
        response.end();
      });
    } else {
      response.sendStatus(401);
    }
  }));
}

const server = MODE.createServer(SSL_OPTS, app);
const socketWaveStreamer = new WebSocketServer({
  server,
  perMessageDeflate: false,
});

socketWaveStreamer.on('connection',  wrap(async (ws, req) => {
  cookieParser()(req, {}, () => console.log('cookie parsed'));
  let query;
  try {
    query = new URL(req.url).searchParams;
  } catch(e) {
    query = new URL(`https://localhost${req.url}`).searchParams;
  }
  const cookie = req.cookies[COOKIENAME+PORT] || req.headers['x-browserbox-local-auth'] || query.get('localCookie');
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
    DATA_SIZE: SAMPLE_RATE,
    BUF_WINDOW: 4,
    ackReceived: 0,
    firstAck: true,
    buffer: [],
    packet: [],
    ip: `${ws?._socket?.remoteAddress}:${ws?._socket?.remotePort}`,
  };
  stopEncoderExpiryClock(client);
  DEBUG.showConnections && console.log(`Now have ${Clients.size} clients`);
  DEBUG.showClients && console.log(`Now have ${Clients.size} clients`, Clients);
  try {
    DEBUG.val && console.log('ws (wave header + pcm stream) connection (server #2)');

    const reader = (await getEncoder()).stdout;
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
        const misAlignment = totalLength % BYTE_ALIGNMENT;
        let packet = Buffer.concat(client.packet, totalLength);
        client.packet.length = 0;

        if ( misAlignment != 0 ) {
          const remainder = packet.subarray(totalLength, misAlignment);
          totalLength -= misAlignment;  
          packet = packet.subarray(0, totalLength);
          client.packet.push(remainder);
          totalLength = misAlignment;
        } else {
          totalLength = 0;
        }

        client.buffer.push(packet);
        DEBUG.showPacketPushes && console.log(`Pushing packet length: ${packet.length}`);
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
      DEBUG.showConnections && console.log(`Now have ${Clients.size} clients`);
      client.packet.length = 0;
      totalLength = 0;
      client.buffer.length = 0;
    });
  } catch(e) {
    console.warn(e);
  }
}));

server.on('connection', function(socket) {
  sockets.add(socket);
  socket.on('close', () => {
    DEBUG.showConnections && console.log(`Connection ended from: ${socket.remoteAddress}`);
    sockets.delete(socket);
  });
  DEBUG.showConnections && console.log(`Connection from: ${socket.remoteAddress}`);
  socket.setNoDelay(true);
});

server.on('upgrade', (req, socket, head) => {
  sockets.add(socket);
  socket.on('close', () => sockets.delete(socket));
  console.log('http upgrade');
  const {pathname} = url.parse(req.url);
  switch(pathname) {
    case "/stream": {
      if ( process.env.TORBB ) {  // reject all audio websocket connections in TOR
        console.log('Destroying socket as tor mode cannot use webaudio for streaming, need a raw (and laggy) audio tag only)', pathname);
        sockets.delete(socket);
        socket.destroy();
      }
    }; break;
    default: {
      console.log('Destroying socket as wrong path', pathname);
      sockets.delete(socket);
      socket.destroy();
    }; break;
  }
});

server.listen(port);

if ( ! process.platform.startsWith('win') && ! process.platform.startsWith('darwin') ) {
  try {
    childProcess.execSync(`sudo renice -n ${CONFIG.reniceValue} -p ${process.pid}`);
  } catch(e) {
    console.info(e);
    console.warn(`Could not renice node audio service`);
  }
}

console.warn('Shut down buries errors');
//process.on('SIGINT', shutDown);
//process.on('SIGUSR2', shutDown);
//process.on('exit', shutDown);

async function getEncoder() {
  audioProcessShuttingDown = false;
  if (savedEncoder) return savedEncoder;
  let encoder = undefined;
  let parec = undefined;

  DEBUG.val && console.log('starting encoder');
  if ( process.platform.startsWith('win') )  {
	  try {
		  encoder = childProcess.spawn('fmedia.exe', [
			  `--channels=mono`, `--rate=44100`, `--format=int16`,
			  `--notui`,
			`--record`,
			  `--out=@stdout.wav`,
			  `--dev-loopback=1`
		  ]);
			exitOnEpipe(encoder.stdout);
		  exitOnEpipe(encoder.stderr);
		  encoder.stderr.pipe(process.stdout);
	    encoder.on('error', e => {
	      console.log('encoder error', e);
	      killEncoder(encoder);
	      //shutDown();
	    });
	    encoder.on('close', e => {
	      console.log('encoder close', e);
	      killEncoder(encoder);
	      //shutDown();
	    });
	    encoder.on('exit', e => { 
	      console.log('encoder exit', e);
	      killEncoder(encoder);
	      //shutDown();
	    });

	    if ( ! process.env.TORBB ) {
	      savedEncoder = encoder;
	    }
		  console.log(encoder);
	    return encoder;
	  } catch(e) {
		  console.warn(`error starting encoder`, e);
	  }
  } else if ( process.platform.startsWith('darwin') ) {
    // do nothing
    // return a mock 
    savedEncoder = {
      stdout: new MockStream(),
      stderr: new MockStream(),
    };
    return savedEncoder;
  } else {
    let resolve;
    const pr = new Promise(res => resolve = res);
    // Notes on args
      /* 
        note that the following args break it or are unnecessary
          '--fix-rate',         // break
          '--fix-format',       // break
          '--no-remix',         // unknown if break or unnecessary
      */
    const args = [
      '-r',  /* record: the default if run as parec */
      `--rate=${SAMPLE_RATE}`,
      `--format=s${FORMAT_BIT_DEPTH}le`,
      '--channels=1',
      '--process-time-msec=100', 
      '--latency-msec=100', 
      ...(process.platform == 'darwin' ? [] : [
      '-d', device
      ])
    ]
    parec = childProcess.spawn('pacat', args);
    let timer = null;
    let retryingOnStartupError = false;
    parec.on('spawn', e => {
      console.log('parec spawned', {error:e, pid: parec.pid, args: args.join(' ')});
      timer = Date.now();
      if ( ! process.platform.startsWith('win') && ! process.platform.startsWith('darwin') ) {
        // doing this later prevents a bug on some systems where pacat will not connect to pa if reniced immediately
        setTimeout(() => {
          try {
            childProcess.execSync(`sudo renice -n ${CONFIG.reniceValue} -p ${parec.pid}`);
            console.log(`reniced parec`);
          } catch(e) {
            console.warn(`Error renicing parec`, e);
          }
        }, 1441);
      }
    });
    exitOnEpipe(parec.stdout);
    exitOnEpipe(parec.stderr);
    parec.stderr.pipe(process.stdout);
    
    parec.on('error', e => {
      console.log('parec error', e);
      killEncoder(encoder);
      //shutDown();
    });
    parec.on('close', e => {
      console.log('parec close', e);
      killEncoder(encoder);
      //shutDown();
    });
    parec.on('exit', async e => { 
      console.log('parec exit', e);
      killEncoder(encoder);
      DEBUG.debugRetries && console.log(`Time since spawn: ${Date.now() - timer}. Spawn: ${timer}. Now: ${Date.now()}`);
      if ( (Date.now() - timer) <= RETRY_WORTHY_EXIT ) {
        const pa = childProcess.spawn('pulseaudio', ['--start']);
        pa.on('spawn', e => {
          setTimeout(() => childProcess.execSync(`sudo renice -n ${CONFIG.reniceValue} -p ${pa.pid}`), 2000);
        })
        retryingOnStartupError = true;
        DEBUG.debugRetries && console.info({retryingOnStartupError, retryCount, MAX_RETRY_COUNT});
        if ( retryCount > MAX_RETRY_COUNT ) {
          console.error(`Could not start encoder. This is likely a pulseaudio issue where parec/pacat cannot connect for some reason.`);
          return;
        } 
        savedEncoder = false;
        await sleep(1000);
        resolve(await getEncoder(retryCount++)); 
      }
      //shutDown();
    });

    const encoderCommand = encoders[encoderType];

    if ( typeof encoderCommand?.command === "string" ) {
      encoder = childProcess.spawn(encoderCommand.command, encoderCommand.args);
      encoder.parec = parec;
      Encoders.add(encoder);
      exitOnEpipe(encoder.stdout);
      exitOnEpipe(encoder.stderr);
      encoder.stderr.pipe(process.stdout);
      encoder.on('error', e => {
        console.log('encoder error', e);
        killEncoder(encoder);
      });
      encoder.on('close', e => {
        console.log('encoder close', e);
        killEncoder(encoder);
      });
      encoder.on('exit', e => { 
        console.log('encoder exit', e);
        killEncoder(encoder);
      });
      if ( ! process.platform.startsWith('win') ) {
        try {
          childProcess.execSync(`sudo renice -n ${CONFIG.reniceValue} -p ${encoder.pid}`);
        } catch(e) {
          console.warn(`Error renicing encoder.`, e);
        }
      }

      parec.stdout.pipe(encoder.stdin);

      if ( ! process.env.TORBB ) {
        savedEncoder = encoder;
      }
    } else if ( typeof encoderCommand?.command === "function" ) {
      encoder = encoderCommand.command();
      encoder.parec = parec;
      Encoders.add(encoder);
      parec.stdout.pipe(encoder);

      if ( ! process.env.TORBB ) {
        savedEncoder = encoder;
      }
    } else {
      encoder = parec;
      if ( ! process.env.TORBB ) {
        savedEncoder = parec;
      }
    }
    setTimeout(() => {
      if ( ! retryingOnStartupError ) {
        retryCount = 0;
        resolve(encoder);
      }
    }, RETRY_WORTHY_EXIT + 1618);

    return pr;
  }
}

function killEncoder(encoder) {
  console.log('killing encoder');
  if ( encoder ) {
    try {
      encoder?.kill?.();
      encoder?.parec?.kill?.();
      Encoders.delete(encoder);
      encoder = null;
    } catch(e) {
      console.log(`Error killing encoder`, e);
    }
  }
}

function audioProcessShutDown() {
  if ( audioProcessShuttingDown ) return;
  audioProcessShuttingDown = true;
  for( let encoder of Encoders.values()) {
    if ( encoder ) {
      try {
        encoder?.kill && encoder.kill();
        encoder = null;
      } catch(e) {
        console.log(`Error killing encoder`, e);
      }
    }
  }
  Encoders = new Set();
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

function wrap(fn) {
  return async function handler(...args) {
    let next;
    if ( typeof args[2] == "function" ) {
      next = args[2];
    }
    try {
      await fn(...args);
    } catch(e) {
      console.warn(`caught error in ${fn}`, e, args);
      if ( next ) {
        next(e);
      } else {
        console.warn(`Error in wrapped async handler. If this was a http request, next was also undefined or not a function`, e);
      }
    }
  }
}
