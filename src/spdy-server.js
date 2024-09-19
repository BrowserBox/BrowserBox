  import express from 'express';
  import spdy from 'spdy';
  import fs from 'fs';
  import zl from './zombie-lord/index.js';
  import path from 'path';
  import bodyParser from 'body-parser';
  import {timedSend, eventSendLoop} from './server.js';

  const options = {
    key: fs.readFileSync(path.join(APP_ROOT, "certs", "server.key")),
    cert: fs.readFileSync(path.join(APP_ROOT, "certs", "server.crt")),
  };
  const version = 'v10';

  export async function start_spdy_server(port, zombie_port) {
    console.log(`Starting SPDY server on port ${port}`);
    const app = express();
    const server_port = port;

    app.use(express.static('public'));
    app.use(bodyParser.json({extended:true}));

    const {data:{targetInfos}} = await timedSend({
      name: "Target.getTargets",
      params: {}
    }, zombie_port);

    const browserTargetId = targetInfos[0].targetId;

    function addHandlers() {
      app.post(`/api/${version}/zombie`, async (req,res) => {
        const Data = [], Frames = [], Meta = [];

        const {events} = req.body;  
        
        await eventSendLoop(events, {Data, Frames, Meta});

        res.type('json');

        return res.end(JSON.stringify({data:Data, frameBuffer:Frames, meta:Meta}));
      });

      app.get(`/api/${version}/tabs`, async (req, res) => {
        res.type('json');
        
        let {data:{targetInfos:tabs}} = await timedSend({
          name: "Target.getTargets",
          params: {}
        }, zombie_port);

        const activeTarget = zl.act.getActiveTarget(zombie_port);
        zl.act.addTargets(tabs, zombie_port);

        tabs = (tabs || []).filter(({targetId}) => targetId != browserTargetId);

        res.end(JSON.stringify({tabs,activeTarget}));
      });
    }

    const server = spdy.createServer(options, app);

    server.listen(server_port, async err => {
      if ( err ) {
        console.error(err);
        process.exit(1);
      } else {
        console.log({uptime:new Date, message:'spdy server up', server_port});
        addHandlers();
      }
    });
  }
