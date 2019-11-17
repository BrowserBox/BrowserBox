export function History(state) {
  const {Wrap} = state.boilerplate;
  return Wrap(state, "Reading Room: History of BrowserGap", `
        <section class="longform content">
          <section class=introduction tabindex=0>
            <div class=graphic>
              <img src=/images/3rd-party/undraw/backintheday.svg>
            </div>
            <div class=story>
              <h1>History of BrowserGap</h1>
              <p>
                Where we come from helps guide where we will choose to go in future.
              </p>
            </div>
          </section>
        </section>
    `,`
          <section class="longform content">
            <p>
              BrowserGap began in the winter of 2012, with a RFQ for some price data to be scraped from 
              various online auction sites.
            <p>
              This project grew into a general web scraper product, which came to adopt the goal of 
              being deliverable without download, through any browser, to any one. You could scrape
              the web, while in the web, so to speak.
            <p>
              That requirement necessitated running a browser somewhere other than on the client which 
              a simple web app could then talk to, and provide the simulation of being in the browser, 
              when in fact one was only controlling and viewing a remote browser.
            <p>
              As the competition for web scrapers thickened, and the market landscape sloped toward
              two peaks: enterprise and free, we decided to pivot to a more sustainable niche.
          </section>
  `);
}
