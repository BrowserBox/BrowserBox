import {d as R} from '../../node_modules/dumbass/r.js';

let lastBandwidth = 0;

export function BandwidthIndicator(state) {
  const saved = (state.totalBandwidth - state.totalBytes)/1000000;
  return R`
    <aside title="Bandwidth savings" class="bandwidth-indicator" stylist="styleBandwidthIndicator">
      <section class=measure>
        Saved: <span>${Math.round(saved)}M</span>
      </section>
      <section class=measure>
        Used: <span>${Math.round(state.totalBytes/1000000)}M</span>
        ${state.showBandwidthRate? R`K/s: <span>${Math.round(state.totalBytesThisSecond/1000)}</span>` : ''}
      </section>
    </aside>
  `;
}

export function startBandwidthLoop(state) {
  setInterval(() => {
    const bwThisSecond = state.totalBytes - lastBandwidth;
    state.totalBytesThisSecond = bwThisSecond;
    lastBandwidth = state.totalBytes;
    BandwidthIndicator(state);
  }, 1000);
}
