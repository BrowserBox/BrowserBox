// code
  const compression = require('compression');
  const hasha = require('hasha');
  const fs = require('fs');
  const exploreDirectories = require('serve-index');
  const child_process = require('child_process');
  const {
    spawn,
    execSync
  } = child_process;
  const express = require('express');
  const https = require('https');
  const http = require('http');
  const multer = require('multer');
  const url = require('url');
  const Path = require('path');
  const os = require('os');
  const app = express();

  const SECRET = require(Path.join(__dirname, '..', 'secrets', 'key.js'));
  const MAX_FILE_DL_TIME = 147*1000; // time to allow a download before rejecting ~ 2.5 mins
  const WAIT_NEW_FILES_BEFORE_DISK_SYNC = 3;
  const PIDFILE = Path.join(__dirname, '..', 'pid.txt');
  const HASH_FILE = Path.join(__dirname, '..', 'pdfs', 'hashes.json');
  const LINK_FILE = Path.join(__dirname, '..', 'pdfs', 'links.json');
  const ArchivesDir = Path.resolve('archives');
  const jobs = {};
  const Files = new Map();
  const Links = new Map();
  const SSL_OPTS = {};
  let jobid = 1;
  let newFiles = 0;
  let syncing = false;
  let secure = false;

  try {
    Object.assign(SSL_OPTS,{
      key: fs.readFileSync(Path.join(os.homedir(), 'sslcerts', 'privkey.pem')),
      cert: fs.readFileSync(Path.join(os.homedir(), 'sslcerts', 'fullchain.pem')),
    });
    secure = true;
  } catch(e) {
    console.warn(`No certs found`, e);
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadPath),
    filename: (req, file, cb) => {
      try {
        return cb(null, nextFileName(Path.extname(file.originalname)))
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
          if ( newFilename === Path.basename(url) ) {
            newFilename = undefined;
          } else {
            newFilename = nextFileName(Path.extname(newFilename));
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
  const DEBUG = {
    showHash: false
  };
  const PORT = process.env.PORT || (secure ? (process.argv[2] || 8080) : 8080);
  const uploadPath = Path.join(__dirname, '..', 'public', 'uploads');
  const CONVERTER = Path.join(__dirname, '..', 'scripts', 'convert.sh');
  const EXPLORER = Path.join(__dirname, '..', 'scripts', 'explore.sh');
  const ARCHIVES = new Set([
    "application/gzip",
    "application/x-bzip2",
    "application/x-7z-compressed",
    "application/zip",
    "application/x-xz",
    "application/x-lzma",
    "application/x-lz4",
    "application/x-rar",
    "application/x-tar",
  ]);
  const VALID = /^\.[a-zA-Z0-9\-\_]{0,12}$|^$/g;
  const upload = multer({storage});

  const State = {
    Files,
    Links,
    Protocol: 'https',
    Host: 'localhost'
  };

  app.use(compression());

  app.use((req, res, next) => {
    State.Protocol = req.protocol;
    State.Host = req.get('host');
    next();
  });

  app.use(express.static('public', { maxAge: 31557600 }));

  app.use('/archives', exploreDirectories(ArchivesDir, {
    icons: true,
    dot: true,
    view: 'details',
    filter: (filename, index, files, dir) => {
      // prevent archive root from being enumerated 
      if ( Path.resolve(dir) == Path.resolve(ArchivesDir) ) {
        return false;
      } 
      return true;
    }
  }))

  app.use('/uploads/file*0000.jpeg', (req, res) => {
    // save browser cache from getting tired of this not existing while conversion is in progress
      // prevent the repreated requests for first page to blow the cache
      // as in browser will eventually think ti doesn't exist and just serve no exist for ever
      // rather than make request
    const fileSystemPath = Path.join(uploadPath, Path.basename(req.originalUrl));
    console.log('Not found yet', fileSystemPath);
    if ( fs.existsSync(fileSystemPath) ) {
      res.send(fileSystemPath);
    } else {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.status(404).end('');
    }
  });

  app.get(/^\/archives\/file[^\/]+\/.+/, async (req, res) => {
    // decodeURIComponent is here necessary for paths with spaces
    const pathElements = decodeURIComponent(req.path).split(/\//g).filter(e => e.length);
    const path = Path.resolve(...pathElements);
    let newPath;
    let newFilename;
    if ( !State.Links.has(path) ) {
      const filename = Path.basename(path);
      newFilename = nextFileName(Path.extname(filename));
      newPath = Path.join(uploadPath, newFilename);
      console.log("Linking", {existingPath: path, newPath});
      fs.linkSync(path, newPath);
      State.Links.set(path, newPath);
      syncHashes(State.Files, State.Links);
    } else {
      newPath = State.Links.get(path);
      newFilename = Path.basename(newPath);
    }
    const pdf = {
      path: newPath,
      filename: newFilename,
    }
    const redirTo = await convertIt({
      res, 
      pdf,
      sendURL: false,
    });
    res.redirect(301, redirTo);
  });

  app.post('/very-secure-manifest-convert(*)', upload.single('pdf'), async (req, res) => {
    let {file:pdf} = req;
    const {secret, url:docUrl} = req.body;

    const ext = Path.extname(req.originalUrl);

    const redirectToUrl = ext == '.html'; 

    if ( secret != SECRET ) {
      console.log({secret,SECRET});
      res.sendStatus(401);
      return;
    }

    // logging 
      log(req, {file:pdf && pdf.path, docUrl});

    if ( docUrl ) {
      let ext = Path.extname(docUrl);
      if ( ! ext ) {
        ext = '.tempdownload';
      }
      const filename = nextFileName(ext);
      pdf = {
        path: Path.resolve(uploadPath, filename),
        filename
      };
      try {
        let newFilename = await download(docUrl, pdf.path);
        if ( newFilename ) { // from content-disposition
          const newPath = Path.resolve(uploadPath, newFilename);
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
          const newPath = Path.resolve(uploadPath, newFilename);
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
      return await convertIt({res, pdf, redirectToUrl});
    } else {
      res.end(`Please provide a file or a URL`);
    }
  });

  async function convertIt({res, pdf, sendURL = true, redirectToUrl = false}) {
    // hash check for duplicate files
      const hash = hasha.fromFileSync(pdf.path);
      let viewUrl;
      let mime;
      try {
        mime = execSync(`file --mime-type -b "${pdf.path}"`).toString().trim();
      } catch(e) {
        console.warn(`Error getting mime type`, e);
        mime = false;
      }
      if ( mime && ARCHIVES.has(mime) ) {
        viewUrl = `${State.Protocol}://${State.Host}/archives/${pdf.filename}/`;
      } else {
        viewUrl = `${State.Protocol}://${State.Host}/uploads/${pdf.filename}.html`;
      }
      console.log({mime});
      DEBUG.showHash && console.log({hash});
      if ( State.Files.has(hash) ) {
        const existingViewUrl = State.Files.get(hash);
        log(null, {note:'File exists', hash, existingViewUrl});
        if ( redirectToUrl ) {
          console.log(`Redirecting to`, existingViewUrl);
          res.redirect(existingViewUrl);
        } else if ( sendURL ) {
          res.end(existingViewUrl);
        }
        return existingViewUrl;
      } else {
        newFiles += 1;
        State.Files.set(hash, viewUrl);
        if ( newFiles % WAIT_NEW_FILES_BEFORE_DISK_SYNC == 0 ) {
          syncHashes(State.Files, State.Links);
        }
      }

    // job start
    let subshell;
    let SCRIPT;
    let isArchive = false;
    let resolve;
    let pr;

    if ( mime && ARCHIVES.has(mime) ) {
      isArchive = true;
      pr = new Promise(res => resolve = res);
      SCRIPT = EXPLORER;
      const destPath = Path.join(uploadPath, pdf.filename);
      if ( pdf.path != destPath ) {
        fs.copyFileSync(pdf.path, destPath);
      }
      subshell = spawn(SCRIPT, [pdf.path]);
    } else {
      SCRIPT = CONVERTER;
      fs.copyFileSync(Path.join(uploadPath, 'index.html'), Path.join(uploadPath, `${Path.basename(pdf.path)}.html`));
      subshell = spawn(SCRIPT, [pdf.path, uploadPath, 'jpeg']);
    }

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
          console.warn(`${SCRIPT} exited with code ${code}`);
          logErr(`${SCRIPT} exited with code ${code}`);
        } else {
          console.log(`${SCRIPT} exited`);
        }
        if ( isArchive && resolve ) {
          resolve();
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
        if ( isArchive && pr ) {
          // we need to wait for extract for the directory to be visible
          await pr;
        }
      if ( redirectToUrl ) {
        console.log(`Redirecting to`, viewUrl);
        res.redirect(viewUrl);
      } else if ( sendURL ) {
        res.end(viewUrl);
      }
      return viewUrl;
  }

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
      await syncHashes(State.Files, State.Links);
      await savePID();
      console.log(JSON.stringify({listening:{port:PORT,at:new Date}}));
    });
  } catch(e) {
    console.warn(`Error creating server`, e);
    process.exit(1);
  }

  process.on('exit', cleanup);
  process.on('error', cleanup);
  process.on('unhandledRejection', cleanup);
  process.on('uncaughtException', cleanup);
  process.on('SIGINT', () => cleanup(true));
  process.on('SIGALRM', async () => {
    console.log('Got sig child resetting Files');
    const hashFile = await fs.promises.readFile(HASH_FILE);
    const linkFile = await fs.promises.readFile(LINK_FILE);
    State.Files = new Map(JSON.parse(hashFile));
    State.Links = new Map(JSON.parse(linkFile));
  });

  function cleanup(...args) {
    const [exit] = args;
    console.log("Error", ...args);
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
    if ( ! ext.startsWith('.') && ext.length ) {
      ext = '.' + ext;
    }
    validate(ext);
    return ranName(ext);
  }

  function ranName(ext = '') {
    if ( ! ext.startsWith('.') && ext.length ) {
      ext = '.' + ext;
    }
    return `file${crypto.randomUUID()}${ext}`;
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
      address:req?.ips,
      ip:req?.ip,
      path:req?.path
    };
    Object.assign(data, extra);
    console.log(data);
    fs.appendFileSync('log', JSON.stringify(data)+'\n');
  }

  async function syncHashes(hashesMap, linksMap) {
    if ( syncing ) {
      return;
    }
    syncing = true;
   
    let hashFile;
    let linkFile;
    try {
      hashFile = await fs.promises.readFile(HASH_FILE); 
      hashFile = new Map(JSON.parse(hashFile)); 
    } catch(e) {
      console.warn(e);
      hashFile = new Map();
    }
    try {
      linkFile = await fs.promises.readFile(LINK_FILE); 
      linkFile = new Map(JSON.parse(linkFile)); 
    } catch(e) {
      console.warn(e);
      linkFile = new Map();
    }

    let latestHashes = mergeMaps(hashFile, hashesMap);
    let latestLinks = mergeMaps(linkFile, linksMap);

    try {
      await fs.promises.writeFile(HASH_FILE, JSON.stringify([...latestHashes.entries()]));
    } catch(e) {
      console.warn('write', e);
    }

    try {
      await fs.promises.writeFile(LINK_FILE, JSON.stringify([...latestLinks.entries()]));
    } catch(e) {
      console.warn('write', e);
    }

    State.Files = latestHashes;
    State.Links = latestLinks;
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
