export function Threats(state) {
  const {Wrap} = state.boilerplate;
  return Wrap(state, "Reading Room: The Threats Facing the Web User", `
        <section class="longform content">
          <section class=introduction tabindex=0>
            <div class=story>
              <h1>Web Browsing: Threats to the User</h1>
              <p>
                A codex arcana of awfulness plaguing the web.
              </p>
            </div>
            <div class=graphic>
              <img src=/images/3rd-party/undraw/escape.svg>
            </div>
          </section>
        </section>
    `,`
          <section class="longform content">

          </section>
  `);
}
