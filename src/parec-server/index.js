#!/usr/bin/env node
'use strict';

import fs from 'fs';
import os from 'os';
import path from 'path';
import childProcess from 'child_process';
import http from 'http';
import https from 'https';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import csrf from 'csurf';
import express from 'express';

import {APP_ROOT, GO_SECURE, COOKIENAME} from '../common.js';
const DEBUG = {
  val: 1,
  mode: 'dev',
  goSecure: true
}

const argv = process.argv;
const device = argv[3] || 'rtp.monitor' || 'auto_null.monitor';
console.log({device});

const encoders = {
  mp3: {
    contentType: 'audio/mpeg',
    command: 'lame',
    args: ['-f', '-r', '-B', '20', '-', '-']
  },
  flac: {
    contentType: 'audio/flac',
    command: 'flac',
    args: [
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
const encoderType = 'mp3';

//var hooks = 0;
let parec = undefined;
let encoder = undefined;

const SSL_OPTS = {};
const COOKIE_OPTS = {
  secure: true,
  httpOnly: true,
  maxAge: 345600000,
  sameSite: 'None'
};
const RateLimiter = rateLimit({
  windowMs: 1000 * 60 * 3,
  max: DEBUG.mode == 'dev' ? 1000 : 300
});

let certsFound = false;

if ( DEBUG.goSecure ) {
  try {
    Object.assign(SSL_OPTS, {
      cert: fs.readFileSync(path.resolve(os.homedir(), 'sslcerts', 'fullchain.pem')),
      key: fs.readFileSync(path.resolve(os.homedir(), 'sslcerts', 'privkey.pem')),
      ca: fs.readFileSync(path.resolve(os.homedir(), 'sslcerts', 'chain.pem')),
    });
    certsFound = true;
  } catch(e) {
    DEBUG.val && console.warn(e);
  }
  DEBUG.val && console.log(SSL_OPTS, {GO_SECURE});
}

function getEncoder() {
  if (encoder) return encoder;

  DEBUG.val && console.log('starting encoder', device);
  parec = childProcess.spawn('parec', ['--process-time-msec=100', '--latency-msec=100', '-d', device]);
  parec.stderr.pipe(process.stdout);
  parec.on('error', e => {
    console.log('parec error', e);
    encoder = null;
  });
  parec.on('close', e => {
    console.log('parec close', e);
    encoder = null;
  });
  parec.on('exit', e => { 
    console.log('parec exit', e);
    encoder = null;
  });

  const encoderCommand = encoders[encoderType];
  encoder = childProcess.spawn(encoderCommand.command, encoderCommand.args);
  encoder.stderr.pipe(process.stdout);
  encoder.on('error', e => {
    console.log('encoder error', e);
    encoder = null;
  });
  encoder.on('close', e => {
    console.log('encoder close', e);
    encoder = null;
  });
  encoder.on('exit', e => { 
    console.log('encoder exit', e);
    encoder = null;
  });

  parec.stdout.pipe(encoder.stdin);

  return encoder;
}

/*function releaseEncoder() {
  hooks--;
  if (hooks > 0) return;
  DEBUG.val && console.log('killing encoder because nobody is listening');
  encoder.kill('SIGINT');
  parec.kill('SIGINT');
  encoder = undefined;
  parec = undefined;
}*/

const port = parseInt(argv[2]);
const PORT = port;
const COOKIE = process.argv[4];
const TOKEN = process.argv[5];
DEBUG.val && console.log('starting http server on port', port);
const MODE = certsFound ? https: http;
const app = express();
app.use(helmet({
  frameguard: false,
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
      objectSrc: ["'none'"],
    },
    reportOnly: false,  
  }
}));
app.use(compression());
app.use(RateLimiter);
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
app.use(csrf({cookie:{sameSite:'None', secure:true}}));
app.use(express.static(path.resolve(APP_ROOT, 'parec-server', 'public')));
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
app.get('/', (request, response) => {
  const cookie = request.cookies[COOKIENAME+(PORT+2)];
  if ( cookie == COOKIE ) {
    var contentType = encoders[encoderType].contentType;
    DEBUG.val && console.log('  setting Content-Type to', contentType);

    response.writeHead(200, {
      'Connection': 'keep-alive',
      'Content-Type': contentType
    });

    var encoder = getEncoder();

    //encoder.stdout.pipe(response);
    encoder.stdout.on('data', function(buffer) {
      response.write(buffer);
    });

    request.on('close', function() {
      //response.end();
      //releaseEncoder();
    });
  } else {
    response.sendStatus(401);
  }
});

const server = MODE.createServer(SSL_OPTS, app).listen(port);

server.on('connection', function(socket) {
  DEBUG.val && console.log('New connection: setting no delay true');
  socket.setNoDelay(true);
});
