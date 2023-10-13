import fs from 'fs';
import path from 'path';
import { fork } from 'child_process';

import express from 'express';
import csurf from 'csurf';

// In-memory mapping of session to worker
const sessionToWorker = new Map();
let wid = 0;

const TemplateText = fs.readFileSync(path.resolve('src', 'templates', 'hexview.html'));
const renderTemplate = ({
  hexData = '', 
  csrfToken = '', 
  cursor = 0,
  filePath = '',
  done = false,
}) => render(
  TemplateText, 
  {
    hexData, 
    csrfToken, 
    cursor,
    filePath,
    escapeHTML,
    done
  }
);

export function applyHandlers(app) {
  const csrf = csurf();
  app.use(csrf);

  app.get('/command', (req, res) => {
    const { command, filePath, csrfToken, cursor } = req.query;

    runWorker({req, res, command, filePath, csrfToken, cursor});
  });

  app.post('/command', (req, res) => {
    const { command, filePath, csrfToken, cursor } = req.body;

    runWorker({req, res, command, filePath, csrfToken, cursor});
  });
}

if ( import.meta.url === `file://${process.argv[1]}` ) {
  const app = express();
  const port = 3000;

  applyHandlers(app);

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
  });
}

function runWorker({req, res, command, filePath, csrfToken, cursor}) {
  let workerId = req.session?.[filePath]?.workerId;
  let worker = sessionToWorker.get(workerId);

  if (!workerId || !worker) {
    worker = fork(path.join('src', 'hexReader.mjs'));
    if ( ! req.session[filePath] ) {
      req.session[filePath] = {};
    }
    workerId = nextId();
    sessionToWorker.set(workerId, worker);
    req.session[filePath].workerId = workerId;

    // Initialize worker
    worker.send({ command: 'openFile', filePath });

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
  worker.send({ command, cursor });

  worker.once('message', (message) => {
    if (message.error) {
      res.send(renderTemplate({
        csrfToken: req.csrfToken(),
        cursor: message.pageNumber,
        filePath,
        hexData: `Error: ${message.error}`
      }));
    } else {
      const {hexData, pageNumber, done} = message;
      res.send(renderTemplate({
        hexData,
        filePath, 
        csrfToken: req.csrfToken(),
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

