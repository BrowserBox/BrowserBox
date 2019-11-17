export function Security(state) {
  const {Wrap} = state.boilerplate;
  return Wrap(state, "Security Policy // Responsible Vulernability Disclosure Policy", `
      <section class=content> 
        <section class=introduction>
          <div class=story>
            <h1>Security Policy // Responsible Vulernability Disclosure Policy</h1>
          </div>
        </section>
      </section>
    `,
    `
      <section class=content>
        <section class=legal>
          <div class=document>
						<h1>Brand Promise</h1>
            <p>
              Keeping user information safe and secure is a top priority for us at The Dosyago Corporation, and we welcome the contribution of external security researchers to report vulnerabilities in a responsible manner for BrowserGap.
						<h1>Scope</h1>
            <p>
              If you believe you've found a security issue in any website, service, or software owned or operated by The Dosyago Corporation, we encourage you to notify us.
						<h1>How to Submit a Report</h1>
            <p>
              To submit a vulnerability report to The Dosyago Corporation, please contact us at cris@dosyago.com. Your submission will be reviewed and validated by a member of our security team.
						<h1>Safe Harbor</h1>
            <p>
              The Dosyago Corporation supports safe harbor for security researchers who:
            <ol>
              <li>Make a good faith effort to avoid privacy violations, destruction of data, and interruption or degradation of our services.
              <li>Only interact with accounts you own or with explicit permission of the account holder. If you do encounter Personally Identifiable Information (PII) contact us immediately, do not proceed with access, and immediately purge any local information.
              <li>Provide us with a reasonable amount of time to resolve vulnerabilities prior to any disclosure to the public or a third-party.
            </ol>
            <p>
              We will consider activities conducted consistent with this policy to constitute "authorized" conduct and will not pursue civil action or initiate a complaint to law enforcement. We will help to the extent we can if legal action is initiated by a third party against you.
            <p>
              Please submit a report to us before engaging in conduct that may be inconsistent with or unaddressed by this policy.
						<h1>Preferences</h1>
            <ol>
              <li>Please provide detailed reports with reproducible steps and a clearly defined impact.
              <li>Submit one vulnerability per report.
              <li>Social engineering (e.g. phishing, vishing, smishing) is prohibited.
            </ol>
          </div>
        </section>
      </section>
  `);
}
