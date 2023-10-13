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

  app.get('/', (req, res) => {
    const fileName = 'abc.123';
    const csrfToken = '123.abc';
    req.session.fileName = fileName;
    res.send(renderTemplate({
      hexData: '', 
      fileName, 
      csrfToken,
      cursor: 0
    }));
  });

  app.post('/command', (req, res) => {
    const { sessionId, command, filePath } = req.body;

    let worker = sessionToWorker[sessionId];
    
    if (!worker) {
      worker = fork(path.join('.', 'hexReader.mjs'));
      sessionToWorker[sessionId] = worker;

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
    worker.send({ command });

    worker.once('message', (message) => {
      if (message.error) {
        res.send(renderTemplate(`Error: ${message.error}`, sessionId));
      } else {
        res.send(renderTemplate(message.hexData, sessionId));
      }
    });
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

