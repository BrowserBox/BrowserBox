import fs from 'fs';
import path from 'path';
import { fork } from 'child_process';

import express from 'express';

// In-memory mapping of session to worker
const sessionToWorker = new Map();
let wid = 0;

const TemplateText = fs.readFileSync(path.resolve('src', 'templates', 'hexview.html'));
const renderTemplate = ({
  hexData = '', 
  cursor = 0,
  filePath = '',
  done = false,
}) => render(
  TemplateText, 
  {
    hexData, 
    cursor,
    filePath,
    escapeHTML,
    done
  }
);

export function applyHandlers(app, STATIC_DIR) {
  app.get('/command', (req, res) => {
    const { command, filePath, cursor } = req.query;

    runWorker({req, res, command, filePath, cursor}, STATIC_DIR);
  });

  app.post('/command', (req, res) => {
    const { command, filePath, cursor } = req.body;

    runWorker({req, res, command, filePath, cursor}, STATIC_DIR);
  });
}

// run hexServer as a standalone, for testing only
if ( import.meta.url === `file://${process.argv[1]}` ) {
  const app = express();
  const port = 3000;

  applyHandlers(app);

  app.listen(port, () => {
    console.log(`Test hexServer Server running at http://localhost:${port}/`);
  });
}

function runWorker({req, res, command, filePath, cursor}, STATIC_DIR) {
  if ( typeof filePath != "string" ) {
    console.error(`Invalid filePath`, filePath, {command, cursor});
    throw new TypeError(`Invalid filePath`);
  }
  const file = filePath.split(/\//g);

  if ( file[0] === 'archives' ) {
    file[0] = 'uploads';
  } 

  const fileFullPath = constructSafePath(STATIC_DIR, ...file);

  let workerId = req.session?.[filePath]?.workerId;
  let worker = sessionToWorker.get(workerId);

  if (!workerId || !worker) {
    worker = fork(path.join('src', 'hexReader.mjs'));
    if ( ! req.session[filePath] ) {
      if ( filePath !== '__proto__' && filePath.includes('/') ) {
        req.session[filePath] = {};
      } else {
        throw new Error(`runWorker received garbled filePath: ${filePath}`);
      }
    }
    workerId = nextId();
    sessionToWorker.set(workerId, worker);
    req.session[filePath].workerId = workerId;

    // Initialize worker
    worker.send({ command: 'openFile', fileFullPath });

    // Listen for messages from worker
    worker.on('message', (message) => {
      if (message.error) {
        console.error(`Worker error: ${message.error}`);
      }
    });
  } else {
    worker = sessionToWorker.get(workerId);
  }

  // Send the command to the worker
  worker.send({ command, cursor, fileFullPath });

  worker.once('message', (message) => {
    if (message.error) {
      res.send(renderTemplate({
        cursor: message.pageNumber,
        filePath,
        hexData: `Error: ${message.error}`
      }));
    } else {
      const {hexData, pageNumber, done} = message;
      res.send(renderTemplate({
        hexData,
        filePath, 
        cursor: pageNumber,
        done,
      }));
    }
  });
}

function escapeHTML(str) {
  const escapeChars = {
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    '"': '&quot;',
    "'": '&#39;'
  };

  return str.replace(/[<>&"']/g, (char) => escapeChars[char]);
}

function nextId() {
  return `worker${wid++}`;
}

function render(template, context = globalThis) {
  return new Function("with(this) return `" + template + "`;").call(context);
}

function constructSafePath(basePath, ...userInput) {
  const normalizedInput = path.normalize(path.join(...userInput)).replace(/^(\.\.[\\/])+/, '');
  return path.join(basePath, normalizedInput);
}

