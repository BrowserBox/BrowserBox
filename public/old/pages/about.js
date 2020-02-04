export function About(state) {
  const {Wrap} = state.boilerplate;
  return Wrap(state, "About BrowserGap", `
        <section class=content>
          <section class=introduction tabindex=0>
            <div class=story>
              <h1>About BrowserGap.</h1>
              <h2>A product of The Dosyago Corporation</h2>
            </div>
            <div class=graphic>
              <img src=/images/3rd-party/undraw/instruct.svg>
            </div>
          </section>
        </section>
    `,`
        <section class=content>
          <section class=story>
            <div class=document>
              <h1>The Origin</h1>
              <p>
                We started as a web-scraping platform product in 2017. Delivering a web-scraping experience to anyone anywhere using a browser, has a lot of parallels with delivering a browsing experience to anyone anywhere using a browser. They both involve browsers running in the cloud.
              <p>
                After analyzing the market for web-scraping products, we decided that, despite the favorable legal environment that was emerging for web data scraping, the time was not yet right for a solution similar to what we were planning. 
              <p>
                At around the same time we discovered a class of products that would enable a lot of reuse of our existing technolgoy, code and expertise. That was web browser isolation. So we shifted gears at the end of 2018 to build such a product. Initially we concieved it as a way to deliver the same content by converting it into pixels in the cloud and save bandwidth and battery as there was no local computation.
              <h1>Something Big</h1>
              <p>
                The more we looked into the web browser isolation market, the more we liked it. We had always dreamed of selling to large organizations, and building a truly B2B product. In some sense, our planned scraping offering was an attempt to fit a pseudo-democratised data-scraping solution into a B2B mold. Discovering the possibility to deliver a product that was more naturally a B2B fit, and also one that overlapped interests we already had, was very encouraging. 
              <p>
                Things turned even more encouraging when we discovered the nascent nature of the market, the DARPA request for information about vendors and the large degree of fit between our existing system and what a reliable cloud-based browser isolation service would require. 
              <h1>Looking Forward</h1>
              <p>
                We aim to be the simplest browser isolation solution. This is not just a philosophy. Simplicity is a core tennet of security, similar to the way that a larger codebase will attract a larger number of bugs than a smaller one: a larger system will accrue a larger number of attack vectors than a smaller system. 
              <p>
                We also see a key point of differentiation of our offering being that the experience of using BrowserGap is the most similar to using a regular web browser. Tabs are there. Incognito mode. Websites look and work the same as they normally would. You can persist cookies for common sites from day to day. This, again is not just a philosophy. We believe firmly that simplicity and usability are core tennets of security. How secure is a secure channel that nobody uses? The answer is it's not secure at all because it contributes zero net security to the intended users. 
            </div>
          </section>
        </section>
  `);
}
