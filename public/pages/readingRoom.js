export function ReadingRoom(state) {
  const {Wrap} = state.boilerplate;
  return Wrap(state, "Tutorials and Support Reading Room", `
        <section class=content>
          <section class=introduction tabindex=0>
            <div class=story>
              <h1>BrowserGap. Training, tutorials and support room.</h1>
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
            </section>
            <section class=protection tabindex=0>
              <div class="points graphic">
                <h1>Story 1</h1>
                <img src=/images/3rd-party/undraw/inbloom.svg>
              </div>
              <div class="points graphic">
                <h1>Story 2</h1>
                <img src=/images/3rd-party/undraw/inbloom.svg>
              </div>
              <div class="points graphic">
                <h1>Story 3</h1>
                <img src=/images/3rd-party/undraw/inbloom.svg>
              </div>
            </section>
            <section class=protection tabindex=0>
              <div class="points graphic">
                <h1>Story 1</h1>
                <img src=/images/3rd-party/undraw/inbloom.svg>
              </div>
              <div class="points graphic">
                <h1>Story 2</h1>
                <img src=/images/3rd-party/undraw/inbloom.svg>
              </div>
              <div class="points graphic">
                <h1>Story 3</h1>
                <img src=/images/3rd-party/undraw/inbloom.svg>
              </div>
            </section>
          </section>
  `);
}
