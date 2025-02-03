import {s as R, c as X} from '../../node_modules/bang.html/src/vv/vanillaview.js';

let serverBwThisSecond = 0;
let lastServerBandwidth = 0;
let bwThisSecond = 0;
let lastBandwidth = 0;

let last = Date.now();

export function BandwidthIndicator(state) {
  let saved = state.totalBandwidth/1000000 
  let ss = 'M';
  if ( saved > 1000 ) {
    saved /= 1000;
    ss = 'G';
  }
  let sr = state.totalServerBytesThisSecond;
  let sm = 'B/s';
  if ( sr > 1000 ) {
    sr /= 1000;
    sm = 'Kb/s';
  } 
  if ( sr > 1000 ) {
    sr /= 1000;
    sm = 'M/s';
  } 
  if ( sr > 1000 ) {
    sr /= 1000;
    sm = 'G/s';
  } 

  let used = state.totalBytes/1000;
  let us = 'Kb';
  if ( used > 1000 ) {
    used /= 1000;
    us = 'M';
  }
  if ( used > 1000 ) {
    used /= 1000;
    us = 'G';
  }

  let lr = state.totalBytesThisSecond;
  let lm = 'B/s';
  if ( lr > 1000 ) {
    lr /= 1000;
    lm = 'Kb/s';
  } 
  if ( lr > 1000 ) {
    lr /= 1000;
    lm = 'M/s';
  } 
  if ( lr > 1000 ) {
    lr /= 1000;
    lm = 'G/s';
  } 

  return R`
    <aside title="Bandwidth savings" class="bandwidth-indicator" stylist="styleBandwidthIndicator">
      <section class=measure>
        &#x1f4e1; <span>${Math.round(saved)+ss}</span>&nbsp;${
          state.showBandwidthRate? X`<span>(${Math.round(sr)+sm})</span>` : ''
        }
      </section>
      <section class=measure>
        &#x1f4bb; <span>${Math.round(used)+us}</span>&nbsp;${
          state.showBandwidthRate? X`<span>(${Math.round(lr)+lm})</span>` : ''
        }
      </section>
    </aside>
  `;
}

export function startBandwidthLoop(state) {
  setInterval(() => {
    const now = Date.now();
    const diff = (now - last)/1000;
    last = now;

    serverBwThisSecond = state.totalBandwidth - lastServerBandwidth;
    bwThisSecond = state.totalBytes - lastBandwidth;

    lastBandwidth = state.totalBytes;
    state.totalBytesThisSecond = Math.round(bwThisSecond/diff);
    
    lastServerBandwidth = state.totalBandwidth;
    state.totalServerBytesThisSecond = Math.round(serverBwThisSecond/diff);

    BandwidthIndicator(state);

  }, 1000);
}
