export function Pricing(state) {
  const {Wrap} = state.boilerplate;
  return Wrap(state, "Per-seat Subscription Pricing", `
        <section class=content>
          <section class=header tabindex=0>
            <div class=story>
              <h1>The Clock is Ticking on Browser Security.</h1>
              <p>
                Spend a little time and get the most secure, and most familiar, browsing experience.
              </p>
            </div>
            <div class=graphic>
              <img src=/images/3rd-party/undraw/serious.svg>
            </div>
          </section>
        </section>
    `,`
          <section class=content>
            <section class=pricing tabindex=0>
              <div class=graphic>
                <img src=/images/3rd-party/undraw/hacker.svg>
              </div>
              <div class=points>
                <h1>How much time are you willing to invest in your security?</h1>
                <ul>
                  <li>Unlimited tabs per browser. 
                  <li>Multiple people can use the same browser.
                  <li>It's just like a workstation, except secure, only a browser and in the cloud.
                  <li>Ticket-based support.
                  <li>Security of BrowserGap's Total Isolation Solution.
                </ul>
              </div>
            </section>
            <section class=cta>
              <div class="price points">
                <h1>BrowserGap Rubicon.</h1>
                <p>
                  Monthly Package
                </p>
                <p>
                  USD $22.22 per month.
                </p>
              </div>
              <a href=#membership-application class="register toggle-opener">
                <span class=verbose-name>Apply for Membership</span> Now
              </a>
            </section>
            <section class=danger>
              <div class=points>
                <a href=/pages/case-study/uk-corporate-website-malware-attack.html>
                  <h1>100s of Employee Computers Infected via Browser: A Case Study</h1>
                  <p>
                    Read about the security exploits and web-based vulnerability that occured at a large UK company.
                  </p>
                </a>
              </div>
            </section>
            <section class=danger>
              <div class=graphic>
                <img src=/images/3rd-party/undraw/scary.svg>
              </div>
              <div class=story>
                <h1>Time's up for browser security.</h1>
                <p>
                  Don't expose yourself to avoidable risks. Take action today, before it's too late.
                  Engage BrowserGap now to contain these risks before they infect your infrastructure.
                </p>
              </div>
            </section>
          </section>
  `);
}
