#!/usr/bin/env node
'use strict';

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

var https = require('https'),
    childProcess = require('child_process'),
    fs = require('fs');

var hooks = 0;
var parec = undefined;
var encoder = undefined;

const SSL_OPTS = {
  cert: fs.readFileSync(`../sslcert/${sslBranch}/fullchain.pem`),
  key: fs.readFileSync(`../sslcert/${sslBranch}/privkey.pem`),
  ca: fs.readFileSync(`../sslcert/${sslBranch}/chain.pem`),
}

function getEncoder() {
    if (encoder) return encoder;
    console.log('starting encoder');
    hooks++;
    parec = childProcess.spawn('parec', ['-d', device]);

    var encoderCommand = encoders[encoderType];
    encoder = childProcess.spawn(encoderCommand.command, encoderCommand.args);
    parec.stdout.pipe(encoder.stdin);
    return encoder;
}

function releaseEncoder() {
    hooks--;
    if (hooks > 0) return;
    console.log('killing encoder because nobody is listening');
    encoder.kill('SIGINT');
    parec.kill('SIGINT');
    encoder = undefined;
    parec = undefined;
}

var port = argv[2];
console.log('starting http server on port', port);
var server = https.createServer(SSL_OPTS, function(request, response) {
    var contentType = encoders[encoderType].contentType;
    console.log('  setting Content-Type to', contentType);

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
    console.log('New connection: setting no delay true');
    socket.setNoDelay(true);
});
