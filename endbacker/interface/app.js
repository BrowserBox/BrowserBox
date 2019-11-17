import util from 'util';
import {exec} from 'child_process';
import fs from 'fs';
import path from 'path';
import {safe} from './safe';
import {DEBUG} from '../common';

let nextAppPort = 8000;
let nextChromePort = 5000;

export async function initiate({cookie, username, token}) {
  const status = {
    message: "OK",
    port: 0
  };

  ([cookie, username] = safe(cookie, username));

  nextAppPort += 5;
  nextChromePort += 5;

  const command = `sudo ./scripts/initiate/start.sh ${username} ${nextChromePort} ${nextAppPort} ${cookie} ${token}`;

  DEBUG.val && console.log({command});

  let error, stdout, stderr;

  try {
    ({stdout, stderr} = exec(command));
  } catch(e) {
    error = e;
    console.warn(e);
  }

  if ( error ) {
    status.message = "NO";
  }

  status.port = nextAppPort;

  return {status};
}
