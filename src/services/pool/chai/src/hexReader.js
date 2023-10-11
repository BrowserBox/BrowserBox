import fs from 'fs/promises';
import readline from 'readline';
import cluster, { isPrimary } from 'cluster';

let fd;
let currentPage = -1;
let isFileOpening = false;
let isFirstRead = true;
let commandQueue = [];
const PAGE_SIZE = 1024; // 1KB, you can adjust this size

const processQueue = async () => {
  if (isFileOpening) return;

  while (commandQueue.length > 0) {
    const command = commandQueue.shift();
    await executeCommand(command);
  }
};

const readPage = async (page) => {
  try {
    const buffer = Buffer.alloc(PAGE_SIZE);
    let totalBytesRead = 0;
    let position = PAGE_SIZE * page; // Calculating the starting position of this page

    while (totalBytesRead < PAGE_SIZE) {
      const { bytesRead } = await fd.read(buffer, totalBytesRead, PAGE_SIZE - totalBytesRead, position + totalBytesRead);
      if (bytesRead === 0) {
        // EOF reached
        break;
      }
      totalBytesRead += bytesRead;
    }

    return { hexData: buffer.slice(0, totalBytesRead).toString('hex'), position };
  } catch (err) {
    throw new Error(`Unable to read page: ${err.message}`);
  }
};

const executeCommand = async (message) => {
  try {
    switch (message.command) {
      case 'next':
        currentPage++;
        break;
      case 'prev':
        if (currentPage > 0) currentPage--;
        break;
      case 'openFile':
        isFileOpening = true;
        if (fd) await fd.close();
        fd = await fs.open(message.filePath, 'r');
        currentPage = -1;
        isFileOpening = false;
        processQueue();
        return;
      default:
        process.send({ error: 'Unknown command' });
        return;
    }

    const { hexData, position } = await readPage(currentPage);
    process.send({ hexData: formatHexData( hexData, position ) });
  } catch (err) {
    process.send({ error: err.message });
  }
};

const processIPC = async () => {
  process.on('message', async (message) => {
    if (isFileOpening) {
      commandQueue.push(message);
      return;
    }

    await executeCommand(message);
  });
};

const main = async (filePath) => {
  try {
    fd = await fs.open(filePath, 'r');
    const initialHexData = await readPage(currentPage);
    processIPC();  // Activate the IPC listener
  } catch (err) {
    console.error('An error occurred:', err);
  }
};

if (isPrimary) {
  processIPC();  // Worker processes start their IPC listener right away
} else {
  processIPC();  // Worker processes start their IPC listener right away
}

function formatHexData(hexData, position) {
  let output = '';
  for (let i = 0; i < hexData.length; i += 32) {
    const slice = hexData.slice(i, i + 32);
    const ascii = slice.replace(/../g, (pair) => {
      const code = parseInt(pair, 16);
      return code >= 32 && code <= 126 ? String.fromCharCode(code) : '.';
    });

    output += `${(position + (i / 2)).toString(16).padStart(8, '0')}: ${slice.match(/.{1,4}/g).join(' ')}  ${ascii}\n`;
  }
  return output;
}

