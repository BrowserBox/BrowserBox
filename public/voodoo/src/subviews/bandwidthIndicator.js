import {d as R, u as X} from '../../node_modules/dumbass/r.js';

let serverBwThisSecond = 0;
let lastServerBandwidth = 0;
let bwThisSecond = 0;
let lastBandwidth = 0;

export function BandwidthIndicator(state) {
  const saved = (state.totalBandwidth - state.totalBytes)/1000000;
  return R`
    <aside title="Bandwidth savings" class="bandwidth-indicator" stylist="styleBandwidthIndicator">
      <section class=measure>
        Saved: <span>${Math.round(saved)}M</span>
        ${state.showBandwidthRate? X`<span>(${Math.round(state.totalServerBytesThisSecond/1000)}K/s)</span>` : ''}
      </section>
      <section class=measure>
        Used: <span>${Math.round(state.totalBytes/1000000)}M</span>
        ${state.showBandwidthRate? X`<span>(${Math.round(state.totalBytesThisSecond/1000)}K/s)</span>` : ''}
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
