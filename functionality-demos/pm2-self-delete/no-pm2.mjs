import {exec} from 'child_process';

console.log(`Hello`);

setTimeout(() => console.log('GOodbye'), 10000);

console.log('name', process.env.name);

setTimeout(() => {
  if ( process.env.PM2_USAGE && process.env?._?.endsWith?.('pm2') ) {
    console.info(`Running with pm2. Deleting...`);
    console.log(process.title, process.argv, process.env);
    exec(`pm2 delete ${process.env.name}`);
  }
}, 5000);
