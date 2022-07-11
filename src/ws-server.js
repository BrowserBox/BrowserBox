  import express from 'express';
  import http from 'http';
  import https from 'https';
  import fetch from 'node-fetch';
  import multer from 'multer';
  import WebSocket from 'ws';
  import fs from 'fs';
  import os from 'os';
  import path from 'path';
  import bodyParser from 'body-parser';
  import cookieParser from 'cookie-parser';
  import helmet from 'helmet';
  import rateLimit from 'express-rate-limit';
  import csrf from 'csurf';
  import {pluginsDemoPage} from './public/plugins/demo/page.js';
  import zl from './zombie-lord/api.js';
  import {start_mode} from './args.js';
  import {version, APP_ROOT, COOKIENAME, GO_SECURE, DEBUG} from './common.js';
  import {timedSend, eventSendLoop} from './server.js';

  export const fileChoosers = new Map();

  const protocol = GO_SECURE ? https : http;
  const COOKIE_OPTS = {
    secure: GO_SECURE,
    httpOnly: true,
    maxAge: 345600000,
    sameSite: 'Strict'
  };

  const uploadPath = path.resolve(os.homedir(), 'uploads');
  if ( ! fs.existsSync(uploadPath) ) {
    fs.mkdirSync(uploadPath, {recursive:true});
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadPath),
    filename: (req, file, cb) => {
      return cb(null, nextFileName(path.extname(file.originalname)))
    }
  });
  const upload = multer({storage});

  const Queue = {
    funcs: []
  };

  // rate limiter

  const RateLimiter = rateLimit({
    windowMs: 1000 * 60 * 3,
    max: DEBUG.mode == 'dev' ? 1000 : 1000
  });

  export let LatestCSRFToken = '';

  let messageQueueRunning = false;

  let browserTargetId;

  let requestId = 0;

  //let lastTS = Date.now();

  export async function start_ws_server(
      port, zombie_port, allowed_user_cookie, session_token, 
  ) {

    
    
    DEBUG.val && console.log(`Starting websocket server on ${port}`);
    const app = express();
    const server_port = port;

    // determine if we use secure
      let latestMessageId = 0;

      const secure_options = {};
      try {
        const sec = {
          cert: fs.readFileSync(path.resolve(os.homedir(), 'sslcerts', 'fullchain.pem')),
          key: fs.readFileSync(path.resolve(os.homedir(), 'sslcerts', 'privkey.pem')),
          ca: fs.readFileSync(path.resolve(os.homedir(), 'sslcerts', 'chain.pem')),
        };
        Object.assign(secure_options, sec);
      } catch(e) {
        console.warn(`No certs found so will use insecure no SSL.`); 
      }
      const secure = secure_options.cert && secure_options.ca && secure_options.key || false;

    // set up express
      app.use(helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            imgSrc: [
              "'self'",
              "data:"
            ],
            mediaSrc: [
              "'self'",
              "http://*:*",
              "https://*:*"
            ],
            connectSrc: [
              "'self'",
              "wss://isolation.site:*",
              "wss://demo.browsergap.dosyago.com:*"
            ],
            styleSrc: [
              "'self'", 
              "'unsafe-inline'"
            ],
            scriptSrc: [
              "'self'", 
              "'unsafe-eval'",
              "'sha256-ktnwD9kIpbxpOmbTg7NUsKRlpicCv8bryYhIbiRDFaQ='",
            ],
            objectSrc: ["'none'"],
            ...(secure ? {updgradeInsecureRequests: []} : {})
          },
          reportOnly: false,  
        },
        frameguard: DEBUG.frameLimit
      }));
      app.use(RateLimiter);
      app.use(bodyParser.urlencoded({extended:true}));
      app.use(bodyParser.json());
      app.use(cookieParser());
      app.use(upload.array("files", 10));
      app.use(csrf({cookie:true}));
      app.use((req, res, next) => {
        LatestCSRFToken = req.csrfToken();
        next();
      });

    if ( start_mode == "signup" ) {
      app.get("/", (req,res) => res.sendFile(path.join(APP_ROOT, 'public', 'index.html'))); 
    } else {
      if ( DEBUG.mode == 'dev' ) {
        app.get("/", (req,res) => res.sendFile(path.join(APP_ROOT, 'public', 'image.html'))); 
      } else {
        app.get("/", (req,res) => res.sendFile(path.join(APP_ROOT, 'public', 'bundle.html'))); 
      }
      app.get("/login", (req,res) => {
        const {token,ran,url:Url} = req.query; 

        // 为了屏蔽掉login的流程，这里绕过校验过程
        // if ( token == session_token ) {

        res.cookie(COOKIENAME+port, allowed_user_cookie, COOKIE_OPTS);
        let url;
        url = `/?ran=${ran||Math.random()}#${session_token}`;
        if ( !! Url ) {
          url = `/?url=${encodeURIComponent(Url)}&ran=${ran||Math.random()}#${session_token}`;
        }
        res.redirect(url);

        // } 
        // else {
        //   res.type("html");
        //   if ( session_token == 'token2' ) {
        //     res.end(`Incorrect token, not token2. <a href=/login?token=token2>Try again.</a>`);
        //   } else {
        //     res.end(`Incorrect token. <a href=${secure ? 'https' : 'http'}://${req.hostname}/>Try again.</a>`);
        //   }
        // }
      }); 
    }
    app.use(express.static(path.resolve(APP_ROOT,'public')));
    app.post('/current/:current/event/:event', wrap(async (req, res) => {
      const actualUri = 'https://' + req.headers.host + ':8001' + req.url;
      const resp = await fetch(actualUri, {method: 'POST', body: JSON.stringify(req.body), 
        headers: {
          'Content-Type': 'application/json' 
        }}).then(r => r.text());
      res.end(pluginsDemoPage({body:resp}));
    }));

    const server = protocol.createServer.apply(protocol, GO_SECURE && secure ? [secure_options, app] : [app]);
    const wss = new WebSocket.Server({server});

    wss.on('connection', (ws, req) => {
      const qp = req.url.includes('?') ? 
        req.url.slice(req.url.indexOf('?') + 1)
        .split('&')
        .filter(p => p.includes("session_token"))[0]
        .split('=')[1]
        
        :
        undefined;
      const cookie = req.headers.cookie;
      const IP = req.connection.remoteAddress;
      let closed = false;

      DEBUG.val && console.log({wsConnected:{cookie, qp, IP}});

      zl.act.saveIP(IP);

      const validAuth = DEBUG.dev || 
        allowed_user_cookie == 'cookie' || 
        (cookie && cookie.includes(`${COOKIENAME+port}=${allowed_user_cookie}`)) ||
        (qp && qp == session_token);

      if( validAuth ) {
        zl.life.onDeath(zombie_port, () => {
          console.info("Zombie/chrome closed or crashed.");
          //console.log("Closing as zombie crashed.");
          //ws.close();
        });
        ws.on('close', () => {
          closed = true;    
        });
        ws.on('message', message => {
          const func = async () => {
            const Data = [], Frames = [], Meta = [], State = {};

            message = JSON.parse(message);

            const {zombie, tabs, messageId} = message;  

            latestMessageId = messageId;

            try {
              if ( zombie ) {
                const {events} = zombie;
                let {receivesFrames} = zombie;

                if ( receivesFrames ) {
                  // switch it on in DEBUG and save it on the websocket for all future events
                  DEBUG.noShot = false;
                  ws.receivesFrames = receivesFrames;
                } else {
                  receivesFrames = ws.receivesFrames;
                }

                DEBUG.val && console.log(`Starting ${events.length} events for message ${messageId}`);
                await eventSendLoop(events, {Data, Frames, Meta, State, receivesFrames});
                DEBUG.val && console.log(`Ending ${events.length} events for message ${messageId}\n`);

                const {totalBandwidth} = State;

                so(ws,{messageId, data:Data, frameBuffer:Frames, meta:Meta, totalBandwidth});
              } else if ( tabs ) {
                let {data:{targetInfos:targets}} = await timedSend({
                  name: "Target.getTargets",
                  params: {},
                }, zombie_port);

                browserTargetId = browserTargetId ||zl.act.getBrowserTargetId(zombie_port);
                targets = targets.filter(({targetId,type}) => type == 'page' && zl.act.hasSession(targetId, zombie_port));

                const activeTarget = zl.act.getActiveTarget(zombie_port);
                zl.act.addTargets(targets, zombie_port);
                so(ws,{messageId, activeTarget, tabs:targets});
              } else {
                console.warn(JSON.stringify({unknownMessage:message}));
              }
            } catch(e) {
              // errors are not always pushed up this far
              // but when they are we can alert the client
              so(ws,{messageId, data:[
                {
                  error: "Failed to communicate with cloud browser",
                  resetRequired: true
                }
              ], frameBuffer:[], meta:[], totalBandwidth: 0});
            }
          };
          Queue.funcs.push(func); 
          if ( ! messageQueueRunning ) {
            runMessageQueue();
          }
        });
        // why the below?
          // for cases where we still want to alert the client
          // to an error we don't push all the way
          // (because say, the send() method that results in the error
          // has no corresponding result that it is expected to tell the client about
          // e.g.
          // await send("Command.name", params); // errors from here will not go to client
        zl.act.setClientErrorSender(err => {
          so(ws,{messageId:latestMessageId, data:[
            {
              error: err,
              resetRequired: true
            }
          ], frameBuffer:[], meta:[], totalBandwidth: 0});
        }, zombie_port);
      } else {
        const hadSession = !! cookie && cookie.includes(COOKIENAME+port);
        const msg = hadSession ? 
          `Your session has expired. Please log back in.` 
          : `No session detected, have you signed up yet?`;
        const error = {msg, willCloseSocket: true, hadSession};
        so(ws, {messageId:1,data:[{error}]});
        console.log("Closing as not authorized.", cookie, hadSession, msg);
        ws.close();
      }

      function so(socket, message) {
        if ( closed ) return;
        if ( !message ) return;
        message.timestamp = Date.now();
        //message.tgap = message.timestamp - lastTS;
        //lastTS = message.timestamp;
        if ( typeof message == "string" || Array.isArray(message) ){
          message;
        } else {
          message = JSON.stringify(message);
        }

        try {
          socket.send(message);
        } catch(e) {
          console.warn(`Websocket error with sending message`, e, message);
        }
      }
    });

    server.listen(server_port, async err => {
      if ( err ) {
        console.error('err', err);
        process.exit(1);
      } else {
        addHandlers();
        DEBUG.val && console.log({uptime:new Date, message:'websocket server up', server_port});
      }
    });

    function addHandlers() {
      app.get(`/api/${version}/tabs`, wrap(async (req, res) => {
        const cookie = req.cookies[COOKIENAME+port];
        if ( !DEBUG.dev && allowed_user_cookie !== 'cookie' &&
          (cookie !== allowed_user_cookie) ) {
          return res.status(401).send('{"err":"forbidden"}');
        }
        requestId++;
        res.type('json');

        let targets;

        try {
          ({data:{targetInfos:targets}} = await timedSend({
            name: "Target.getTargets",
            params: {},
          }, zombie_port));

          browserTargetId = browserTargetId ||zl.act.getBrowserTargetId(zombie_port);
          targets = targets.filter(({targetId,type}) => type == 'page' && zl.act.hasSession(targetId, zombie_port));

          const activeTarget = zl.act.getActiveTarget(zombie_port);
          zl.act.addTargets(targets, zombie_port);
          res.end(JSON.stringify({tabs:targets,activeTarget,requestId}));
        } catch(e) {
          console.warn('No target data from chrome. Normally means chrome is not opened.');
          throw e;
        }
      }));
      app.post("/file", async (req,res) => {
        const cookie = req.cookies[COOKIENAME+port];
        if ( !DEBUG.dev && allowed_user_cookie !== 'cookie' &&
          (cookie !== allowed_user_cookie) ) { 
          return res.status(401).send('{"err":"forbidden"}');
        }
        const {files} = req;
        const {sessionid:sessionId} = req.body;
        const backendNodeId = fileChoosers.get(sessionId);
        const action = ! files || files.length == 0 ? 'cancel' : 'accept';
        /**
        const fileInputResult = await zl.act.send({
          name:"Runtime.evaluate",
          params: {
            expression: "self.zombieDosyLastClicked.fileInput"
          }, 
          definitelyWait: true,
          sessionId
        }, zombie_port);
        console.log({fileInputResult, s:JSON.stringify(fileInputResult)});
        const objectId = fileInputResult.data.result.objectId;
        **/
        const command = {
          name: "DOM.setFileInputFiles",
          params: {
            files: files && files.map(({path}) => path),
            backendNodeId
          },
          sessionId
        };
        DEBUG.val > DEBUG.med && console.log("We need to send the right command to the browser session", files, sessionId, action, command);
        let result;
        
        try {
          result = await zl.act.send(command, zombie_port);
        } catch(e) {
          console.log("Error sending file input command", e);
        }

        DEBUG.val > DEBUG.med && console.log({fileResult:result});

        if ( !result || result.error ) {
          res.status(500).send(JSON.stringify({error:'there was an error attaching the files'}));
        } else {
          result = {
            success: true,
            files: files.map(({originalname,size}) => ({name:originalname,size}))
          };
          DEBUG.val > DEBUG.med && console.log("Sent files to file input", result, files);
          res.json(result);
        }
      }); 
      // error handling middleware
        app.use('*', (err, req, res, next) => {
          try {
            res.type('json');
          } finally {
            let message = '';
            if ( DEBUG.dev && DEBUG.val ) {
              message = s({error: { msg: err.message, stack: err.stack.split(/\n/g) }});
            } else {
              message = s({error: err.message || err+'', resetRequired:true});
            }
            res.write(message);
            res.end();
            if ( DEBUG.val ) {
              console.warn(err);
            }
            next();
          }
        });
    }

    async function runMessageQueue() {
      if ( messageQueueRunning ) return;
      messageQueueRunning = true;
      while( Queue.funcs.length ) {
        const func = Queue.funcs.shift();
        try {
          await func();
        } catch(e) {
          console.warn("error while running message queue", e);
        }
        // await sleep(TIME_BETWEEN_MESSAGES);
      }
      messageQueueRunning = false;
    }

    // helpers
      function wrap(fn) {
        return async function handler(req, res, next) {
          try {
            await fn(req, res, next);
          } catch(e) {
            if ( DEBUG.val ) {
              console.info(`caught error in ${fn}`, e);
            }
            next(e);
          }
        }
      }

      function s(o) {
        let r;
        if ( typeof o == "string" ) r = 0;
        else try {
          r = JSON.stringify(o, null, 2);
        } catch(e) {
          DEBUG.val > DEBUG.hi && console.warn(e);
        }
        try {
          r = r + '';
        } catch(e) {
          DEBUG.val > DEBUG.hi && console.warn(e);
        }
        return r;
      }
  }

  function nextFileName(ext = '') {
    //console.log({nextFileName:{ext}});
    if ( ! ext.startsWith('.') ) {
      ext = '.' + ext;
    }
    const name = `file${(Math.random()*1000000).toString(36)}${ext}`;
    //console.log({nextFileName:{name}});
    return name;
  }
 
