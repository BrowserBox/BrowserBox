{
  

}

// returns a promise that eventually resolve to true if puter ability is detected. It never rejects
// and does not resolve until puter ability is detected.
export default async function untilPuterAbility() {
  let resolve;
  const pr = new Promise(res => resolve = res);
  globalThis.addEventListener('message', ({data, origin, source}) => {
    const uri = new URL(origin);
    if ( !uri.hostname.endsWith('puter.site') ) return;
    if ( !data.response ) return;

    if ( data.response.hasPuterAbility >= 0 ) {
      globalThis.hasPuterAbility = true;
      resolve(true);
    }
  });
  globalThis.top.postMessage({request:{hasPuterAbility: 0}}, '*');
  return pr;
}

export async function handlePuterAbility(meta, state) {
  console.log(`received meta event`, meta, state);
}
