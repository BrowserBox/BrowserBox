// code
  import crypto from 'crypto';
  import fs from 'fs';
  import { exec, execSync, spawn } from 'child_process';
  import https from 'https';
  import http from 'http';
  import url from 'url';
  import Path from 'path';
  import os from 'os';
  import {rainbowHash} from '@dosyago/rainsum';
  import {APP_ROOT} from '../../../../common.js';

  import exploreDirectories from 'serve-index';
  import compression from 'compression';
  import express from 'express';
  import Session from 'express-session';
  import rateLimit from 'express-rate-limit';
  import multer from 'multer';

  const app = express();

  try { 
    process.title = "browserbox-microfilm";
  } catch(e) {
    console.info(`Could not set process title. Current title: ${process.title}`, e);
  }

  start();

  async function start() {
    const {CONFIG} = await import('../../../../common.js');
    const SECRET = process.env.DOCS_KEY;
    const FORMAT = 'jpeg';
    const MAX_FILE_DL_TIME = 147*1000; // time to allow a download before rejecting ~ 2.5 mins
    const WAIT_NEW_FILES_BEFORE_DISK_SYNC = 3;
    const CHAI_STATE_PATH = process.env.CHAI_PATH || Path.resolve(os.homedir(), '.config', 'dosyago', 'bbpro', 'chai')
    const PIDFILE = Path.join(CHAI_STATE_PATH, 'chai-pid.txt');
    const HASH_FILE = Path.join(CHAI_STATE_PATH, 'pdfs', 'hashes.json');
    const LINK_FILE = Path.join(CHAI_STATE_PATH, 'pdfs', 'links.json');
    const STATIC_DIR = process.env.STATIC_DIR || Path.join(CHAI_STATE_PATH, 'public');
    const ArchivesDir = Path.resolve(CHAI_STATE_PATH, 'archives');
    const RateLimiter = rateLimit({
      // 1000 requests every 3 minutes
      windowMs: 1000 * 60 * 3,
      max: 1000,
      message: `
        Too many requests from this IP. Please try again in a little while.
      `
    });
    const SmallRateLimiter = rateLimit({
      // 200 requests every 3 minutes
      windowMs: 1000 * 60 * 3,
      max: 200,
      message: `
        Too many requests from this IP. Please try again in a little while.
      `
    });
    const jobs = {};
    const Files = new Map();
    const Links = new Map();
    const FORBIDDEN_CONVERSIONS = new Set(
      [
        'exe', 'com', 'apk', 'deb', 'rpm', 'msi', 'dmg', 'jar', 'iso', 'bin', 'dll', 'so', 'dylib', 
        'db', 'sqlite', 'mdb', 'accdb', 'fp7', 'gdb', 'fdb',
        'dat', 'bson', 'sst', 'sdf'
      ]
    );
    const SSL_OPTS = {};
    const Sessions = {};
    let jobid = 1;
    let newFiles = 0;
    let syncing = false;
    let secure = false;

    try {
      Object.assign(SSL_OPTS,{
        key: fs.readFileSync(Path.resolve(CONFIG.sslcerts(process.env.DOCS_PORT), 'privkey.pem')),
        cert: fs.readFileSync(Path.resolve(CONFIG.sslcerts(process.env.DOCS_PORT), 'fullchain.pem')),
      });
      secure = true;
    } catch(e) {
      console.warn(`No certs found`, e);
    }

    const PORT = process.env.DOCS_PORT || (secure ? (process.argv[2] || 8080) : 8080);

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
    const DEBUG = {
      showHash: false,
      showFullFile: false,
    };
    const uploadPath = Path.resolve(STATIC_DIR, 'uploads');
    const CONVERTER = Path.resolve('.', 'scripts', 'convert.sh');
    const EXPLORER = Path.resolve('.', 'scripts', 'explore.sh');
    const RUNNER = Path.resolve('.', 'scripts', 'flexbashrunner.sh');
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
      "application/java-archive",
      "application/x-ipynb+json",
      "application/x-cpio",
      "application/vnd.sun.xml.calc",
      "application/x-chrome-extension",
      "application/vnd.google-earth.kmz",
      "application/x-silverlight-app",
      "application/vnd.android.package-archive",
    ]);
    const DOCUMENTS_THAT_ARE_ARCHIVES = new Set([
      ".numbers",
      ".pages",
      ".docx",
      ".xlsx",
      ".pptx",
      ".odt",
      ".odt",
      ".epub",
      ".mobi",
    ]);
    const VALID = /^\.[a-zA-Z0-9\-\_]{0,12}$|^$/g;
    const onionAddress = process.env.TORBB ? process.env[`ADDR_${PORT}`] : undefined;
    const upload = multer({storage});

    const State = {
      Files,
      Links,
      Protocol: 'https',
      Host: 'localhost'
    };

    app.use(compression());

    app.use(express.urlencoded({ extended: true }));

    app.use(Session({
      name: `secureview-docsview-hex-${PORT}`,
      secret: SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: { 
        secure: true,
        sameSite: 'lax'
      }
    }));

    app.use((req, res, next) => {
      State.Protocol = req.protocol;
      State.Host = onionAddress ? onionAddress : req.get('host');
      next();
    });

    if ( process.env.DOMAIN.endsWith('cloudtabs.net') ) {
      app.use(miniCorsEmbed);
    }

    app.use(express.static(STATIC_DIR, { maxAge: 31557600 }));

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

    app.use(new RegExp(`/uploads/file.*0000\.${FORMAT}`), RateLimiter, (req, res) => {
      // Save browser cache from getting tired of this not existing while conversion is in progress
      // Prevent the repeated requests for first page to blow the cache
      // As in browser will eventually think it doesn't exist and just serve no exist forever
      // Rather than make request
      const fullPath = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
      const fileSystemPath = Path.join(uploadPath, Path.basename(sanitizeUrl(fullPath)));
      console.log('Not found yet', fileSystemPath);
      if (fs.existsSync(fileSystemPath)) {
        res.send(fileSystemPath);
      } else {
        res.set({
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        });
        res.status(200).end('');
      }
    });

    app.get(/^\/archives\/file[^\/]+\/.+/, SmallRateLimiter, async (req, res) => {
      // decodeURIComponent is here necessary for paths with spaces
      const pathElements = decodeURIComponent(req.path).split(/\//g).filter(e => e.length);
      const path = Path.resolve(CHAI_STATE_PATH, ...pathElements);
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
        ext: Path.extname(pdf.filename)
      });
      res.redirect(301, redirTo);
    });

    app.post(/^\/very-secure-manifest-convert.*\/?/, SmallRateLimiter, upload.single('pdf'), async (req, res) => {
      let {file:pdf} = req;
      const {secret} = req.body;

      pdf.path = sanitizeFilePath(pdf.path);

      let ext = Path.extname(req.originalUrl);

      const redirectToUrl = ext == '.html'; 

      if ( secret != SECRET ) {
        console.log({secret,SECRET});
        res.sendStatus(401);
        return;
      }

      // logging 
        log(req, {file:pdf && pdf.path});

      if ( pdf ) {
        return await convertIt({res, pdf, redirectToUrl, ext});
      } else {
        res.end(`Please provide a file or a URL`);
      }
    });

    async function convertIt({res, pdf, sendURL = true, redirectToUrl = false, ext}) {
      let setViewUrl = false;
      // hash check for duplicate files
        pdf.path = sanitizeFilePath(pdf.path);
        const hash = await rainbowHash(128, 0, fs.readFileSync(pdf.path));
        let viewUrl;
        let mime;
        try {
          mime = execSync(`file --mime-type -b "${pdf.path}"`).toString().trim();
        } catch(e) {
          console.warn(`Error getting mime type`, e);
          mime = false;
        }
        if ( mime && ARCHIVES.has(mime) && ! DOCUMENTS_THAT_ARE_ARCHIVES.has(ext) ) {
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
          setViewUrl = true;
        }

      const sourceFilePath = Path.join(uploadPath, 'index.html');
      const destinationFilePath = Path.join(uploadPath, `${Path.basename(pdf.path)}.html`);
      const noConvertFilePath = Path.join(uploadPath, `${Path.basename(pdf.path)}.noconvert`);
      // job start
      let subshell;
      let SCRIPT;
      let isArchive = false;
      let resolve;
      let pr = new Promise(res => resolve = res);

      try {
        if ( mime && ARCHIVES.has(mime) && ! DOCUMENTS_THAT_ARE_ARCHIVES.has(ext) && ! FORBIDDEN_CONVERSIONS.has(ext) ) {
          isArchive = true;
          SCRIPT = EXPLORER;
          const destPath = Path.join(uploadPath, pdf.filename);
          if ( pdf.path != destPath ) {
            fs.copyFileSync(pdf.path, destPath);
          }
          subshell = spawn(RUNNER, [SCRIPT, `${pdf.path}`]);
        } else {
          SCRIPT = CONVERTER;
          let noConvertReason = null;

          let fileContent = fs.readFileSync(sourceFilePath, 'utf8');
          fileContent = fileContent.replace(/\$\$FORMAT\$\$/g, FORMAT);
          fs.writeFileSync(destinationFilePath, fileContent);
          const size = fs.statSync(pdf.path).size;

          if ( size > 158*(1<<20) ) {
            noConvertReason = 'File too big. Larger than 158 MB.';
          } else if ( FORBIDDEN_CONVERSIONS.has( Path.extname(pdf.path).slice(1) ) ) {
            noConvertReason = 'File is of a type we do not convert.';
          } else if ( size < 10 && fs.readFileSync(pdf.path).toString() == 'Failed' ) {
            noConvertReason = 'File failed to download. This is probably a rate limit on the file\'s website.';
          }

          DEBUG.showFullFile && console.log('file', size, fs.readFileSync(pdf.path).toString());

          if ( noConvertReason ) {
            fs.writeFileSync(noConvertFilePath, noConvertReason );
          } else {
            subshell = spawn(RUNNER, [SCRIPT, `${pdf.path}`, `${uploadPath}`, `${FORMAT}`]);
          }
        }

        // subshell clean up handling
        if ( subshell ) {
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
            setViewUrl = false;
            killit();
          });
          subshell.on('close', (code) => {
            if ( code != 0 ) {
              setViewUrl = false;
              console.warn(`${SCRIPT} exited with code ${code}`);
              logErr(`${SCRIPT} exited with code ${code}`);
              fs.writeFileSync(noConvertFilePath, 'noConvert');
            } else {
              console.log(`${SCRIPT} exited`);
            }
            if ( resolve ) {
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
            res.redirect(sanitizeUrl(viewUrl));
          } else if ( sendURL ) {
            res.type('text/plain');
            res.end(sanitizeUrl(viewUrl));
          }
          pr.then(() => {
            if ( setViewUrl ) {
              State.Files.set(hash, viewUrl);
              console.log(`Set view url`, viewUrl);
              if ( newFiles % WAIT_NEW_FILES_BEFORE_DISK_SYNC == 0 ) {
                syncHashes(State.Files, State.Links);
              }
            }
          });
          return sanitizeUrl(viewUrl);
      } catch(e) {
        console.warn(e);
        throw new Error(`Error during convert: ${e}`);
      }
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
        const Hex = await import('./hexServer.mjs');
        const HexRouter = express.Router();
        Hex.applyHandlers(HexRouter, STATIC_DIR);
        app.use('/hex', HexRouter);
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
      fs.appendFileSync(Path.resolve(CHAI_STATE_PATH, 'chai-log'), JSON.stringify({error})+'\n');
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
      fs.appendFileSync(Path.resolve(CHAI_STATE_PATH, 'chai-log'), JSON.stringify(data)+'\n');
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

    function sanitizeFilePath(filePath) {
      // List of characters that need to be escaped in shell commands
      const shellSpecialChars = [' ', '&', ';', '<', '>', '(', ')', '$', '|', '`', '\\', '"', "'"];
      
      // Escape each special character with a backslash
      let sanitizedPath = filePath.split('').map((char) => {
        return shellSpecialChars.includes(char) ? `\\\\${char}` : char;
      }).join('');
      
      return sanitizedPath;
    }

    function sanitizeUrl(urlString) {
      let url;
      
      // Validate the URL
      try {
        url = new URL(urlString);
      } catch (error) {
        throw new Error(`Invalid URL: ${urlString}`);
      }

      // URL class will take care of encoding special characters,
      // making it safe for use in shell commands
      const sanitizedURL = url.toString();
      
      return sanitizedURL;
    }

    function sanitizeHtml(htmlString) {
      const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      };

      return htmlString.replace(/[&<>"']/g, (char) => map[char]);
    }

    function miniCorsEmbed(req, res, next) {
      const allowedDomainPattern = /^https:\/\/([a-zA-Z0-9-]+\.)*puter\.site(:\d+)?$/;

      const origin = req.headers.origin;
      DEBUG.debugMiniCors && console.log('Origin?', origin);
      if (origin && allowedDomainPattern.test(origin)) {
        res.header("Access-Control-Allow-Origin", origin);  // Allow the specific origin
        res.header("Access-Control-Allow-Methods", "GET, OPTIONS");  // Specify methods you want to allow
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, X-BrowserBox-Local-Auth");  // Specify headers you want to allow

        // Setting Cache-Control for private caching, must-revalidate ensures fresh validation
        res.header("Cache-Control", "private, must-revalidate, max-age=3600");  // Allows client caching, but not shared (e.g., CDNs)
        res.header("Vary", "Origin");  // Ensures all requests from new origins revalidate
      } else {
        // Optionally handle the non-allowed origins
        res.header("Access-Control-Allow-Origin", "null");  // Mitigates the risk of leaking CORS headers to any origin
      }

      next();
    }
  }
