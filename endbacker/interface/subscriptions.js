import util from 'util';
import {exec} from 'child_process';
import fs from 'fs';
import path from 'path';
import {safe} from './safe';

const sessions = path.join('/tmp', 'sessions');
const oldSessions = path.join('/tmp', 'oldsessions');

const WriteFile = util.promisify(fs.writeFile);
const ReadFile = util.promisify(fs.readFile);
const MKDIR = util.promisify(fs.mkdir);
const Exec = util.promisify(exec);

export async function save_subscribe({plan, email:email = 'anon@net', subid}) {
  ([plan, email, subid] = safe(plan, email, subid));
  const status = {
    message: "OK",
    data: {

    }
  };

  let error;

  try {
    ({error} = await Exec(`./scripts/sub/save_sub.sh ${subid} ${email} ${plan}`));
  } catch(e) {
    error = e;
    console.warn(e);
  }

  if ( error ) {
    status.message = "NO";
  }

  return {status};
}

export async function update_subscribe({subid, username}) {
  ([subid, username] = safe(subid, username));
  const status = {
    message: "OK",
    data: {

    }
  };

  let file, error;

  try {
    file = await ReadFile(`/home/submanager/subs/${subid}/info.json`);
    file = JSON.parse(file);
  } catch(e) {
    error = e;
    console.warn(e);
  }

  if ( error ) {
    status.message = "NO";
  } else {
    file.username = username;
    await WriteFile(`/home/submanager/subs/${subid}/info.json`, JSON.stringify(file));
  }

  status.data.file = file;

  return {status};
}

export async function check_subscribe({subid, username}) {
  ([subid, username] = safe(subid, username));
  const status = {
    message: "OK",
    data: {

    }
  };

  let file, error;

  try {
    file = await ReadFile(`/home/submanager/subs/${subid}/info.json`);
    file = JSON.parse(file);
  } catch(e) {
    error = e;
    console.warn(e);
  }

  if ( error ) {
    status.message = "NO";
  } else {
    if ( !! username && file.username !== username ) {
      status.message = "NO";
    }
  }

  status.data.file = file;

  return {status};
}
