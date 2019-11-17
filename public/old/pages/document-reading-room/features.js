export function Features(state) {
  const {Wrap} = state.boilerplate;
  return Wrap(state, "Reading Room: An Overview of BrowserGap Features", `
        <section class="longform content">
          <section class=introduction tabindex=0>
            <div class=story>
              <h1>BrowserGap Features</h1>
              <p>
                A catalog of mostly wonderful things.
              </p>
            </div>
            <div class=graphic>
              <img src=/images/3rd-party/undraw/inbloom.svg>
            </div>
          </section>
        </section>
    `,`
          <section class="longform content">

          </section>
  `);
}
