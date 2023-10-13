import fs from 'fs';
import path from 'path';
import { fork } from 'child_process';

import express from 'express';

// In-memory mapping of session to worker
const sessionToWorker = {};

const TemplateText = fs.readFileSync(path.resolve('templates', 'hexview.html'));
const renderTemplate = ({
  hexData = '', 
  csrfToken = '', 
  cursor = 0,
  fileName = ''
}) => render(
  TemplateText, 
  {
    hexData, 
    csrfToken, 
    cursor,
    fileName,
    escapeHTML
  }
);

export function applyHandlers(app) {
  app.use(express.urlencoded({ extended: true }));

  app.get('/command', (req, res) => {
    const { command, filePath, csrfToken, cursor } = req.query;

    runWorker({req, command, filePath, csrfToken, cursor});
  });

  app.post('/command', (req, res) => {
    const { command, filePath, csrfToken, cursor } = req.body;

    runWorker({req, command, filePath, csrfToken, cursor});
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

function runWorker({req, command, filePath, csrfToken, cursor}) {
  let worker = req.session?.[filePath]?.worker;

  if (!worker) {
    worker = fork(path.join('.', 'hexReader.mjs'));
    if ( ! req.session[filePath] ) {
      req.session[filePath] = {};
    }
    req.session[filePath].worker = worker;

    // Initialize worker
    worker.send({ command: 'openFile', filePath });

    // Listen for messages from worker
    worker.on('message', (message) => {
      if (message.error) {
        console.error(`Worker error: ${message.error}`);
      }
    });
  }

  // Send the command to the worker
  worker.send({ command, cursor });

  worker.once('message', (message) => {
    if (message.error) {
      res.send(renderTemplate({
        csrfToken: req.csrfToken(),
        hexData: `Error: ${message.error}`
      }));
    } else {
      const {hexData} = message;
      res.send(renderTemplate({
        hexData,
        filePath, 
        csrfToken: req.csrfToken(),
        cursor: 0
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

function render(template, context = globalThis) {
  return new Function("with(this) return `" + template + "`;").call(context);
}

