export function Training(state) {
  const {Wrap} = state.boilerplate;
  return Wrap(state, "Tutorials and Support Reading Room", `
        <section class=content>
          <section class=introduction tabindex=0>
            <div class=story>
              <h1>Training, tutorials and support room.</h1>
            </div>
            <div class=graphic>
              <img src=/images/3rd-party/undraw/instruct.svg>
            </div>
          </section>
        </section>
    `,`
          <section class=content>
            <section class=protection tabindex=0>
              <div class="points graphic">
                <a href=/pages/document-reading-room/history-of-browser-gap.html>
                  <h1>History of Browser Gap</h1>
                  <img src=/images/3rd-party/undraw/backintheday.svg>
                </a>
              </div>
              <div class="points graphic">
                <a href=/pages/document-reading-room/threats-facing-the-web-user.html>
                  <h1>Threats Facing the Web User</h1>
                  <img src=/images/3rd-party/undraw/escape.svg>
                </a>
              </div>
              <div class="points graphic">
                <a href=/pages/document-reading-room/browser-gap-an-overview-of-features.html>
                  <h1>BrowserGap: An Overview of Features</h1>
                  <img src=/images/3rd-party/undraw/inbloom.svg>
                </a>
              </div>
              <div class="points graphic">
                <a target=_blank href=https://www.youtube.com/channel/UCxyWgnYfo8TvSJWc9n_vVcQ>
                  <h1>BrowserGap Training Videos</h1>
                  <img src=/images/3rd-party/undraw/instruct.svg>
                </a>
              </div>
            </section>
          </section>
  `);
}
