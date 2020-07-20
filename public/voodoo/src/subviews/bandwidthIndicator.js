import {d as R, u as X} from '../../node_modules/dumbass/r.js';

let serverBwThisSecond = 0;
let lastServerBandwidth = 0;
let bwThisSecond = 0;
let lastBandwidth = 0;

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
        Server: <span>${Math.round(saved)+ss}</span>
        ${state.showBandwidthRate? X`<span>(${Math.round(sr)+sm})</span>` : ''}
      </section>
      <section class=measure>
        Local: <span>${Math.round(used)+us}</span>
        ${state.showBandwidthRate? X`<span>(${Math.round(lr)+lm})</span>` : ''}
      </section>
    </aside>
  `;
}

export function startBandwidthLoop(state) {
  setInterval(() => {
    //console.log(state);
    serverBwThisSecond = state.totalBandwidth - lastServerBandwidth;
    bwThisSecond = (bwThisSecond + state.totalBytes - lastBandwidth)/2;

    lastBandwidth = state.totalBytes;
    state.totalBytesThisSecond = bwThisSecond;
    
    if ( serverBwThisSecond ) {
      lastServerBandwidth = state.totalBandwidth;
      state.totalServerBytesThisSecond = serverBwThisSecond;
    }

    BandwidthIndicator(state);
  }, 1000);
}
