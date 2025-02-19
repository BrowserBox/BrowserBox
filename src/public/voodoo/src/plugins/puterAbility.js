import {DEBUG, untilTrueOrTimeout} from '../common.js';
// returns a promise that eventually resolve to true if puter ability is detected. It never rejects
// and does not resolve until puter ability is detected.
const FileState = {
  currentFiles: [],
  token: null, 
  sessionId: null,
};
export default async function untilPuterAbility() {
  let resolve;
  const pr = new Promise(res => resolve = res);
  globalThis.addEventListener('message', async ({data, origin, source}) => {
    const uri = new URL(origin);
    if ( !uri.hostname.endsWith('puter.site') ) return;

    if ( Array.isArray(data) ) {
      console.log(`Browser has received ${data.length} files to upload`, data);
      FileState.currentFiles = data;
      return;
    }

    if ( !data.response ) return;

    if ( data.response.hasPuterAbility >= 0 ) {
      globalThis.hasPuterAbility = true;
      resolve(true);
    }
    if ( data.response.puterCustomUpload ) {
      const {names,contents} = data.response.puterCustomUpload;
      console.log(`Browser has received ${names.length} files to upload`, names, contents);
      const body = new FormData();
      const method = 'POST';
      const action = '/file';
      const request = {
        method,
        body
      };

      await untilTrueOrTimeout(() => {
        const pred = (FileState?.currentFiles?.length == names.length) && FileState.token && FileState.sessionId;
        console.log({pred, FileState, names});
        return pred;
      }, 120);

      body.append('token', FileState.token);
      body.append('sessionId', FileState.sessionId);
     
      FileState.currentFiles.forEach((content, i, Files) => {
        const name = names[i];
        const file = new File([content], name);
        body.append('files' + (Files.length > 1 ? '[]' : ''), file, name);
      });

      try {
        const resp = await uberFetch(action, request).then(r => r.json());
        if ( resp.error ) {
          alert(resp.error);
        } else {
          DEBUG.upload && console.log(`Success attached files`, resp); 
          DEBUG.upload && console.log({resp});
        }
      } catch(e) {
        console.warn("Error on file upload", e);
      }
    }
  });
  DEBUG.debugPuterAbility && console.log(`browser context sending request for info on puter ability to puter context`);
  globalThis.parent.parent.postMessage({request:{hasPuterAbility: 0}}, '*');
  return pr;
}

export async function handlePuterAbility(meta, state) {
  DEBUG.debugPuterAbility && console.log(`browser context received meta event`, meta, state);
  if ( meta.hasPuterAbility ) {
    if ( ! globalThis.hasPuterAbility ) {
      // throw it up the chain
      DEBUG.debugPuterAbility && console.log(`browser context sending request for info on puter ability to puter context`);
      globalThis.parent.parent.postMessage({request:{hasPuterAbility:0}}, '*');
    } else {
      // push it back down with the answer
      state.execute(`globalThis.puterAbilityConfirmed = true;`, {contextId: meta.executionContextId});       
    }
  }
  if ( meta.puterCustomDownload ) {
    // throw it up the chain
    DEBUG.debugPuterAbility && console.log(`browser context sending notification of intended download to puter to puter context`);
    globalThis.parent.parent.postMessage({request:{...meta}}, '*');
  }
}

export function setFileContext({token, sessionId}) {
  Object.assign(FileState, {token, sessionId});
}
