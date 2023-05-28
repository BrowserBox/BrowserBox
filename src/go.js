import path from 'path';
import {execSync} from 'child_process';

import pm2 from 'pm2';

import {APP_ROOT} from './root.js';

const P = new Set();

pm2.connect(err => {
  if ( err ) {
    console.error(err);
    process.exit(2);
  }

  const CONFIG_DIR = execSync(path.resolve(APP_ROOT, '..', 'scripts', 'get_config_dir.sh')).toString().trim();
  const envFile = path.resolve(CONFIG_DIR, 'test.env');

  start(path.resolve(APP_ROOT, '..', 'scripts', 'global', 'start_audio.sh'), envFile);
  start(path.resolve(APP_ROOT, '..', 'scripts', 'basic-bb-main-service.sh'), envFile);
  start(path.resolve(APP_ROOT, '..', 'src', 'services', 'pool', 'crdp-secure-proxy-server', 'devtools-server.sh'), envFile);

  process.on('SIGINT', stopAll);
});

function start(script, args) {
  pm2.start({
    script,
    args,
  }, (err, [proc]) => {
    if ( err ) {
      console.error(`Erroring starting script: ${script}`, err);
      return;
    }
    console.log(`Success starting script: ${script}`, proc);
    P.add(proc);
  });
}

function stopAll() {
  console.log('Stopping');
  let code = 0;
  let counts = P.size;
  if ( counts ) {
    P.forEach(proc => {
      console.log('Stopping', proc);
      pm2.stop(proc.name, err => {
        counts--;
        if ( err ) {
          code = 1;
          console.error(`Erroring stopping process:`, err, proc);
        } else {
          console.log(`Stoppped process`, proc);
        }
        if ( counts === 0 ) {
          setTimeout(() => process.exit(code), 1000);
        }
      });
    });
  } else {
    process.exit(0);
  }
}
