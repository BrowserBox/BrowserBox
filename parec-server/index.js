#!/usr/bin/env node
'use strict';

import fs from 'fs';
import childProcess from 'child_process';
import http from 'http';
import https from 'https';
import {DEBUG, GO_SECURE} from '../common.js';

var argv = process.argv;
var device = argv[3] || 'auto_null.monitor';

var encoders = {
    mp3: {
        contentType: 'audio/mpeg',
        command: 'lame',
        args: ['-V', '0', '-r', '-', '-']
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
var encoderType = 'mp3';


//var hooks = 0;
var parec = undefined;
var encoder = undefined;

const sslBranch = 'master'
const SSL_OPTS = {};

let certsFound = false;

if ( DEBUG.goSecure ) {
  try {
    Object.assign(SSL_OPTS, {
      cert: fs.readFileSync(`../sslcert/${sslBranch}/fullchain.pem`),
      key: fs.readFileSync(`../sslcert/${sslBranch}/privkey.pem`),
      ca: fs.readFileSync(`../sslcert/${sslBranch}/chain.pem`),
    });
    certsFound = true;
  } catch(e) {
    DEBUG.val && console.warn(e);
  }
  DEBUG.val && console.log(SSL_OPTS, {GO_SECURE});
}

function getEncoder() {
  if (encoder) return encoder;
  DEBUG.val && console.log('starting encoder');
  //hooks++;
  parec = childProcess.spawn('parec', ['-d', device]);

  var encoderCommand = encoders[encoderType];
  encoder = childProcess.spawn(encoderCommand.command, encoderCommand.args);
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

var port = argv[2];
DEBUG.val && console.log('starting http server on port', port);
const MODE = certsFound ? https: http;
var server = MODE.createServer(SSL_OPTS, function(request, response) {
  var contentType = encoders[encoderType].contentType;
  DEBUG.val && console.log('  setting Content-Type to', contentType);

  response.writeHead(200, {
    'Connection': 'keep-alive',
    'Content-Type': contentType
  });

  var encoder = getEncoder();

  encoder.stdout.on('data', function(buffer) {
      response.write(buffer);
  });

  request.on('close', function() {
      //response.end();
      //releaseEncoder();
  });
}).listen(port);

server.on('connection', function(socket) {
  DEBUG.val && console.log('New connection: setting no delay true');
  socket.setNoDelay(true);
});
