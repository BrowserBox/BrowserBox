import util from 'util';
import {exec} from 'child_process';
import {safe} from './safe';

const Exec = util.promisify(exec);

export async function createUser1({username, password, groups: groups = []}) {
  ([username, password] = safe(username, password, groups.join('')));
  const status = {
    message: "OK",
    data: {

    }
  };

  let error;

  try {
    ({error} = await Exec(`sudo ./scripts/users/create_user1.sh ${username} "${groups.join(",")}" ${password}`));
  } catch(e) {
    error = e;
    console.warn(e);
  }

  if ( error ) {
    status.message = "NO";
  }

  return {status};
}

export async function createUser2({username, subid}) {
  ([subid, username] = safe(subid, username));
  const status = {
    message: "OK",
    data: {

    }
  };

  let error;

  try {
    ({error} = await Exec(`sudo ./scripts/users/create_user2.sh ${username} ${subid}`));
  } catch(e) {
    error = e;
    console.warn(e);
  }

  if ( error ) {
    status.message = "NO";
  }

  return {status};
}

export async function createUser3({username}) {
  username = safe(username);
  const status = {
    message: "OK",
    data: {

    }
  };

  let error;

  try {
    ({error} = await Exec(`sudo ./scripts/users/create_user3.sh ${username}`));
  } catch(e) {
    error = e;
    console.warn(e);
  }

  if ( error ) {
    status.message = "NO";
  }

  return {status};
}

export async function userExists({username} ) {
  username = safe(username);
  const status = {
    message: "OK",
    data: {

    }
  };

  let error;

  try {
    ({error} = await Exec(`sudo ./scripts/users/user_exists.sh ${username}`));
  } catch(e) {
    error = e;
    console.warn(e);
  }

  if ( error ) {
    status.message = "NO";
  }

  return {status};
}
