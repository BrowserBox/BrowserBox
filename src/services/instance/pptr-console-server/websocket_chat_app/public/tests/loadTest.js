import {sleep} from './helpers.js';

// add TOTAL members and have each send 1 message
// then remove those members
export default async function run(TOTAL) {
  const sockets = [];
  let disconnects = 0;
  let current = 0;

  console.log('Running load tests');

  const testSocket = new WebSocket(`wss://${location.host}`);

  console.log(`Adding ${TOTAL} members...`);

  // add new members
  for( let i = 0; i < TOTAL; i++ ) {
    await newMember(); 
  }

  await sleep(5000);

  // +2 because 1 for the regular app socket and 1 for our extra test socket
  console.assert(current == TOTAL+2, `Expected ${TOTAL+2} members, but ${current} present.`);

  console.log(`Removing ${TOTAL} members...`);

  testSocket.onmessage = m => {
    m = JSON.parse(m.data);
    if( m.disconnection ) {
      disconnects++;
    }
  };

  // remove new members
  for( let i = 0; i < TOTAL; i++ ) {
    const ws = sockets.shift();
    ws.close();
    await sleep(50);
  }

  await sleep(5000);

  console.assert(disconnects == TOTAL, `Expected ${TOTAL} disconnects, but ${disconnects} present.`);

  console.log('Completed load tests');

  return current == TOTAL+2 && disconnects == TOTAL;

  async function newMember() {
    let resolve;
    const p = new Promise(res => resolve = res);
    let ws = new WebSocket(`wss://${location.host}`);

    sockets.push(ws);

    ws.onopen = () => {
      ws.send(JSON.stringify({code:Math.random(),newUsername:'a'+Math.random()})); 
      setTimeout(() => ws.send(JSON.stringify({message:'hi'})),1000); 

      ws.onmessage = m => {
        m = JSON.parse(m.data);
        if ( m.memberCount && m.memberCount > current ) {
          current = m.memberCount;
        }
        resolve();
      };

    };

    return p;
  }
}
