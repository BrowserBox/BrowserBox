export function CloudBrowsers(state) { 
  const {Wrap} = state.boilerplate;
  return Wrap(state, "Remote Cloud Browser Isolation Service", `
        <section class=content>
          <section class=introduction tabindex=0>
            <div class=story>
              <h1>Fully-Remote Cloud-based Browser Isolation Service.</h1>
              <p>
                The simplest and best browser isolation 
                platform, using fully isolated, fully remote cloud browsers.
              </p>
            </div>
              <div class=graphic>
                <img src=/images/3rd-party/undraw/safe.svg>
              </div>
          </section>
        </section>
    `,`
          <section class=content>
            <section class=introduction tabindex=0>
              <div class=graphic>
                <img src=/images/3rd-party/undraw/securityon.svg>
              </div>
              <div class=story>
                <h1>Total Isolation Solution.</h1>
                <p>
                  The simplest and best browser isolation 
                  platform. We put the customer first, and provide the 
                  most similar experience to browsing on your local machine, without
                  the risks. Our fault-tolerant browser-as-a-service infrastructure 
                  enables the secure provision of fully managed, 
                  fully hosted and fully remote cloud browsers. 
                  Our familiar web client looks and feels just like using your popular web browser, 
                  and runs in all modern and legacy browsers, even on mobile.
                </p>
              </div>
            </section>
            <section class=reliability tabindex=0>
              <div class=story>
                <h1>Bespoke Deployments.</h1>
                <p>
                  Custom URL filtering. Domain blacklisting and whitelisting. 
                  Reach out to us for more possibilities.
                </p>
              </div>
              <div class=graphic>
                <img src=/images/3rd-party/undraw/software.svg>
              </div>
            </section>
            <section class=protection tabindex=0>
              <div class=graphic>
                <img src=/images/3rd-party/undraw/logistic.svg>
              </div>
              <div class=story>
                <h1>Fully managed.</h1>
                <p>
                  BrowserGap never runs any remote code on your machine. Ever. We also strip out most ads using adblocking technology on the remote browser. We never run any JavaScript, applets, CSS and not even one tag of HTML on your machine that comes from the remote browser. This means that malware, exploits, ransomware, adware and other web risks cannot harm you or your infrastructure.         
                </p>
              </div>
            </section>
          </section>
  `);
}
