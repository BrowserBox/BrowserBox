export function UKCorpWeb(state) {
  const {Wrap} = state.boilerplate;
  return Wrap(state, "Case Study: 100s of Company Computers Infected by Web Malware", `
        <section class=content>
          <section class=introduction tabindex=0>
            <div class=story>
              <h1>Case Study: 100s of Company Computers Infected by Web Malware</h1>
              <p>
                Attackers use company's own corporate website to deliver malware to employees machines through their browser. 
              </p>
            </div>
            <div class=graphic>
              <img src=/images/3rd-party/undraw/team.svg>
            </div>
          </section>
        </section>
    `,`
      <section class=content>
        <section class=case-study>
          <div class=document>
            <h1>Introduction</h1>
            <p>
                This widespread compromise of a large UK company's internal network originated from an exploit hosted on their externally-managed corporate website. This was achieved as a result of poor security practices by the website provider. The attackers used a commonly available RAT to gain information about the internal network and control a number of computers. The widespread malware infection took extensive effort to eradicate and remediate.
            <h1>How it happened: the technical details</h1>
            <p>
              As part of their survey of the victim's network and services, attackers discovered that the corporate website
            was hosted by a service provider, and it contained a known vulnerability. In the survey stage of the attack on
            the service provider, the attackers exploited this vulnerability to add a specialised exploit delivery script to
            the corporate website.
            <p>
              The script compared the IP addresses of the website's visitors against the IP range used by the company. It
              then infected a number of computers within the company, taking advantage of a known software flaw, to
              download malware to the visitor's computer within a directory that allowed file execution.
              Over 300 computers were infected during the delivery stage with remote access malware. The malware then
              beaconed and delivered network information to attacker-owned domains. The attackers were eventually
              detected early in the affect stage. By this time they had installed further tools and were consolidating their
              position, carrying out network enumeration and identifying high value users.
            <p>
              Whilst the compromise was successful, it was detected through network security monitoring, and a welldefined incident response plan made it possible to investigate the incident using system and network logs,
              plus forensic examinations of many computers.
              To eradicate the discovered infection it was necessary, at great cost, to return the computers to a known
              good state. Further investigation was also required to identify any further malware that could be used to
              retain network access. To prevent further attacks through the same route, the contract terms with the
              website provider needed to be renegotiated, to ensure they had similar security standards to the targeted
              organisation.
            <h1>Capabilities, vulnerabilities and mitigations</h1>
            <p>
              The attackers used a combination of automated scanning tools, exploit kits and technology-specific attacks
              to compromise the organisation. They took advantage of a known software flaw and the trust relationship
              between the company and its supplier.
            <p>
              The intensive and costly investigation and remediation of the compromise could have been averted by more
              effective implementation of the following cyber security controls:
            <p>
              <ul>
                  <li>
                      patching - the corporate website would have not been compromised, nor would the malware
                    download script have succeeded, had patching on both the web server and users’ computers been
                    up to date
                  </li>
                  <li>
                    network perimeter defences - the malware could have been prevented from being downloaded and
                    the command and control might not have succeeded with the use of two-way web filtering, content
                    checking and firewall policies (as part of the internet gateway structure)
                  </li>
                  <li>
                    whitelisting and execution control - unauthorised executables such as the exploration tools would
                    have been unable to run if the company's corporate computers were subject to whitelisting and
                    execution control (this could also prevent applications from being able to run from the temporary or
                    personal profile folders)
                  </li>
                  <li>
                    security monitoring - may have detected the compromise at an earlier stage
                  </li>
              </ul>
            <p>
              Original source: <cite><a target=_blank href=https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/400106/Common_Cyber_Attacks-Reducing_The_Impact.pdf>Common Cyber Attacks: Reducing The Impact</a></cite>, GCHQ Communications-Electronics Security Group, 2015, pp. 14 - 15.
          </div>
        </section>
      </section>
  `);
}
