import util from 'util';
import {exec} from 'child_process';
import fs from 'fs';
import path from 'path';
import {safe} from './safe';
import {DEBUG} from '../common';

const sessions = path.join('/tmp', 'sessions');
const oldSessions = path.join('/tmp', 'oldsessions');

const WriteFile = util.promisify(fs.writeFile);
const ReadFile = util.promisify(fs.readFile);
const MKDIR = util.promisify(fs.mkdir);
const Exec = util.promisify(exec);

export async function authin({username,password,ip}) {
  ([username,password,ip] = safe(username,password,ip));
  try {
    const status = {
      message: "OK",
      data: {

      }
    };
    const session = {
      cookie: await genSession({username,ip}),
      username,
      data: {

      }
    };

    let error;

    try {
      ({error} = await Exec(`sudo ./scripts/authin/auth_as.rb ${username} ${password}`));
    } catch(e) {
      error = e;
      console.warn(e);
    }

    if ( error ) {
      status.message = "NO";
    }

    return {status, session};
  } catch(e) {
    console.warn(e);
  }
}

export async function getUserdata(cookie) {
  cookie = safe(cookie);
  const sessionData = await getSession(cookie); 
  const status = {
    "message" : "OK"
  };
  if ( ! sessionData ) {
    status.message = "NO";
    return {status};
  }

  const userPath = path.join('/home', sessionData.username, 'userData.json');
  let userData;
  try {
    userData = await ReadFile(userPath);
    userData = JSON.parse(userData);
  } catch(e) {
    console.warn(e);
  }

  if ( ! userData ) {
    status.message = "NO";
    return {status};
  }

  status.userData = userData;
  return {status};
}

async function genSession({username,ip}) {
  ([username,ip] = safe(username,ip));
  const started_at = +Date.now();
  const cookie = (Math.random()*started_at).toString(36);
  const session = {started_at, cookie, username, ip};
  const sessionPath = path.join(sessions, cookie);
  await MKDIR(sessionPath, {recursive:true});
  await WriteFile(path.join(sessionPath, 'sessionData.json'), JSON.stringify(session));
  return cookie;
}

export async function getSession(cookie) {
  cookie = safe(cookie);
  let sessionData;
  DEBUG.val && console.log(cookie);
  try {
    sessionData = await ReadFile(path.join(sessions, cookie, 'sessionData.json')); 
    sessionData = JSON.parse(sessionData);
  } catch(e) {
    return; 
  }
  return sessionData;
}

export async function logout(cookie) {
  cookie = safe(cookie);
  const oldPath = path.join(sessions, cookie) + ''; 
  const newPath = path.join(oldSessions, cookie) + '';
  const status = {
    "message": "OK"
  };
  let error;
  try {
    ({error} = await Exec(`mkdir -p ${newPath}; mv ${oldPath} ${newPath}`));
  } catch(e) {
    console.warn(e);
    error = e;
  }

  if ( !! error ) {
    status.message = "NO"; 
  }

  return {status};
}
