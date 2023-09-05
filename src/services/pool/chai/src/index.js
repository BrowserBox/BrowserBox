const compression = require('compression');
const hasha = require('hasha');
const fs = require('fs');
const spawn = require('child_process').spawn;
const express = require('express');
const https = require('https');
const http = require('http');
const multer = require('multer');
const url = require('url');
const path = require('path');
const os = require('os');
const app = express();

const SECRET = require(path.join(__dirname, '..', 'secrets', 'key.js'));
const MAX_FILE_DL_TIME = 147*1000; // time to allow a download before rejecting ~ 2.5 mins
const WAIT_NEW_FILES_BEFORE_DISK_SYNC = 3;
const PIDFILE = path.join(__dirname, '..', 'pid.txt');
const HASH_FILE = path.join(__dirname, '..', 'pdfs', 'hashes.json');
const jobs = {};
const Files = new Map();
const SSL_OPTS = {};
let jobid = 1;
let newFiles = 0;
let syncing = false;
let secure = false;

try {
  Object.assign(SSL_OPTS,{
    key: fs.readFileSync(path.join(os.homedir(), 'sslcerts', 'privkey.pem')),
    cert: fs.readFileSync(path.join(os.homedir(), 'sslcerts', 'fullchain.pem')),
  });
  secure = true;
} catch(e) {
  console.warn(`No certs found`, e);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname,'..', 'public', 'uploads')),
  filename: (req, file, cb) => {
    try {
      return cb(null, nextFileName(path.extname(file.originalname)))
    } catch(err) {
      console.warn(err);
      logErr(err, {badname:{oname:file.originalName}});
      return cb(null, ranName());
    }
  }
});

const sleep = ms => new Promise(res => setTimeout(res, ms));
// adapted from code at source: https://stackoverflow.com/a/22907134/10283964
const download = async function(url, dest) {
  let resolve, reject;
  const pr = new Promise((res,rej) => (resolve = res, reject = rej));
  const pro = url.startsWith('https') ? https : http;
  const file = fs.createWriteStream(dest);
  let newFilename;
  const request = pro.get(url, function(response) {
    try {
      response.pipe(file);
      newFilename = response.headers['content-disposition'];
      if ( newFilename ) {
        newFilename = newFilename.split('filename=').pop();
        if ( newFilename.startsWith('"') ) {
          newFilename = newFilename.replace(/^"/,'').replace(/"$/,'');
        } else if ( newFilename.startsWith("'") ) {
          newFilename = newFilename.replace(/^'/,'').replace(/'$/,'');
        }
        newFilename = newFilename.trim();
        if ( newFilename === path.basename(url) ) {
          newFilename = undefined;
        } else {
          newFilename = nextFileName(path.extname(newFilename));
        }
      }
      file.on('finish', function() {
        file.close(() => resolve(newFilename));  // close() is async, call cb after close completes.
      });
    } catch(e) {
      console.warn(e);
    }
  }).on('error', function(err) { // Handle errors
    console.log('Deleting the file', dest, 'because of error', err);
    fs.unlink(dest); // Delete the file async. (But we don't check the result)
    reject(err.message);
  });
  const result = Promise.race([pr, sleep(MAX_FILE_DL_TIME).then(() => reject('timed out'))]);
  result.catch(err => {
    console.log('Deleting the file', dest, 'because of error', err);
    fs.unlink(dest);
  });
  return result;
};
const DEBUG = true;
const PORT = process.env.PORT || (secure ? (process.argv[2] || 8080) : 8080);
const uploadPath = path.join(__dirname, '..', 'public', 'uploads');
const CONVERTER = path.join(__dirname, '..', 'scripts', 'convert.sh');
const VALID = /^\.[a-zA-Z][a-zA-Z0-9\-\_]{0,12}$/g;
const upload = multer({storage});

const State = {
  Files
};

app.use(compression());
app.use(express.static('public', { maxAge: 31557600 }));

app.post('/very-secure-manifest-convert', upload.single('pdf'), async (req, res) => {
  let {file:pdf} = req;
  const {secret, url:docUrl} = req.body;

  if ( secret != SECRET ) {
    console.log({secret,SECRET});
    res.sendStatus(401);
    return;
  }

  // logging 
    log(req, {file:pdf && pdf.path, docUrl});

  if ( docUrl ) {
    let ext = path.extname(docUrl);
    if ( ! ext ) {
      ext = '.tempdownload';
    }
    const filename = nextFileName(ext);
    pdf = {
      path: path.resolve(uploadPath, filename),
      filename
    };
    try {
      let newFilename = await download(docUrl, pdf.path);
      if ( newFilename ) { // from content-disposition
        const newPath = path.resolve(uploadPath, newFilename);
        console.log({newPath1:newPath});
        fs.renameSync(pdf.path, newPath);
        pdf.path = newPath;
        pdf.filename = newFilename;
      } else if ( ext === '.tempdownload' ) { // need to get it
        try {
          ext = undefined;
          ext = execSync(`file --mime-type ${pdf.path}`).split('/').pop();
        } catch(e) {
          console.warn(`Error trying to get mime filetype extension for ${pdf.path}`, e);
        } finally {
          // fudge it, it's a PDF, it's always PDFs
          if ( ! ext ) {
            ext = '.pdf';
          }
        }
        newFilename = nextFileName(ext);
        const newPath = path.resolve(uploadPath, newFilename);
        console.log({newPath});
        fs.renameSync(pdf.path, newPath);
        pdf.path = newPath;
      }
    } catch(e) {
      const msg = `Error on download file ${docUrl}: ${e}`;
      console.log(msg, e);
      return res.status(500).send(msg);
    }
  }
  
  if ( pdf ) { 
    // hash check for duplicate files
      const hash = await hasha.fromFile(pdf.path);
      const viewUrl = `${req.protocol}://${req.get('host')}/uploads/${pdf.filename}.html`;
      console.log({hash});
      if ( State.Files.has(hash) ) {
        const existingViewUrl = State.Files.get(hash);
        log(req, {note:'File exists', hash, existingViewUrl});
        return res.end(existingViewUrl);
      } else {
        newFiles += 1;
        State.Files.set(hash, viewUrl);
        if ( newFiles % WAIT_NEW_FILES_BEFORE_DISK_SYNC == 0 ) {
          syncHashes(State.Files);
        }
      }

    // job start
    const subshell = spawn(CONVERTER, [pdf.path, uploadPath, 'jpeg']);

    // subshell clean up handling
    {
      const myJobId = jobid;
      let killed = false;
      jobs[myJobId] = {jobid,subshell,killit,path:pdf.path};
      jobid++;

      subshell.stdout.pipe(process.stdout);
      subshell.stderr.pipe(process.stderr);

      subshell.stdout.on('end', () => {
        killit();
      });
      subshell.on('error', (err) => {
        console.warn(err);
        killit();
      });
      subshell.on('close', (code) => {
        if ( code != 0 ) {
          console.warn(`${CONVERTER} exited with code ${code}`);
          logErr(`${CONVERTER} exited with code ${code}`);
        } else {
          console.log(`${CONVERTER} exited`);
        }
      });

      function killit() {
        if ( killed ) return;
        killed = true;
        delete jobs[myJobId];
        subshell.stdin.pause();
        subshell.stdout.pause();
        subshell.stderr.pause();
        subshell.kill();
      }
    }

    // give the view url
      return res.end(viewUrl);
  } else {
    res.end(`Please provide a file or a URL`);
  }
});

app.use((err, req, res, next) => {
	if (res.headersSent) {
		return next(err)
	}
  console.warn(err);
  logErr(err);
  res.redirect('/error.html');
});

try {
  (secure ? https : http).createServer(SSL_OPTS, app).listen(PORT, async err => {
    if ( err ) {
      console.warn(err);
      throw err;
    }
    await syncHashes(State.Files);
    await savePID();
    console.log(JSON.stringify({listening:{port:PORT,at:new Date}}));
  });
} catch(e) {
  console.warn(`Error creating server`, e);
  process.exit(1);
}

process.on('exit', cleanup);
process.on('error', cleanup);
process.on('SIGINT', () => cleanup(true));
process.on('SIGALRM', async () => {
  console.log('Got sig child resetting Files');
  const hashFile = await fs.promises.readFile(HASH_FILE);
  State.Files = new Map(JSON.parse(hashFile));
});

function cleanup(exit) {
  Object.values(jobs).forEach(({killit,subshell, jobid, path}) => {
    console.log("Killing job", path);
    try {
      killit();
      killcp(subshell);
    } catch(e) {
      console.warn(`Error killing`, jobid, path, e);
    }
  });
  if ( exit ) {
    process.exit();
  }
}

function killcp(cp) {
  cp.stdin.pause();
  cp.stdout.pause();
  cp.stderr.pause();
  cp.kill('SIGKILL');
}

function validate(command) {
  const isValid = command.match(VALID); 
  if ( ! isValid ) {
    throw new Error(`No such extension ${command}`);
  }
}

function nextFileName(ext) {
  console.log("File ext", ext);
  if ( ! ext.startsWith('.') ) {
    ext = '.' + ext;
  }
  validate(ext);
  return ranName(ext);
}

function ranName(ext = '') {
  return `file${(Math.random()*1000000).toString(36)}${ext}`;
}

function logErr(err, extra = {}) {
  const error = {
    err: err+'', ...extra
  }
  fs.appendFileSync('log', JSON.stringify({error})+'\n');
}

function log(req, extra = {}) {
  const data = {
    date:new Date,
    address:req.ips,
    ip:req.ip,
    path:req.path
  };
  Object.assign(data, extra);
  console.log(data);
  fs.appendFileSync('log', JSON.stringify(data)+'\n');
}

async function syncHashes(map) {
  if ( syncing ) {
    return;
  }
  syncing = true;
 
  let hashFile;
  try {
    hashFile = await fs.promises.readFile(HASH_FILE); 
    hashFile = new Map(JSON.parse(hashFile)); 
  } catch(e) {
    console.warn(e);
    hashFile = new Map();
  }

  latestHashes = mergeMaps(hashFile, map);

  try {
    await fs.promises.writeFile(HASH_FILE, JSON.stringify([...latestHashes.entries()]));
  } catch(e) {
    console.warn('write', e);
  }

  State.Files = latestHashes;
  syncing = false;
}

function mergeMaps(m1, m2) {
  // we check key exists before insert so
  // IF there IS a collision, the most recent (m2) takes precedence
  const e = [...m2.entries(), ...m1.entries()];
  const newMap = new Map();

  e.forEach(([key,value]) => {
    if ( ! newMap.has(key) ) {
      newMap.set(key, value);
    }
  });

  return newMap;
}

function savePID() {
  return fs.promises.writeFile(PIDFILE, process.pid+'');
}
