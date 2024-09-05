### BrowserBox HTTPS and Tor: Essential Trust and Installation Guide

#### Important Update: August 2024

The below instructions for macOS currently do not work. `mkcert` signed certificates downloaded from `/torca/rootCA.pem` are never recognized by Tor Browser, even after disabling OCSP querying, adding via KeyChain Access or mkcert -install with a custom `$CAROOT` pointing to your remote's downloaded `rootCA.pem`, or even manually importing into the Certificates section in the Tor Browser.

As a result, the only current reliable method to use TLS with BrowserBox when running as a Tor hidden service is to add an exception to the Tor Browser for the BrowserBox instance. Just click through the security prompts Tor Browser will surface when initially connecting to the BrowserBox instance's onion address login link.

Ideally, a TLS provider such as LetsEncrypt would support certificates for hidden services. As of right now, they do not.

#### Understanding HTTPS with Tor in BrowserBox

BrowserBox, running as a Tor hidden service, encounters unique challenges with HTTPS. Most free certificate authorities, like Let's Encrypt, are reluctant to issue certificates for `.onion` domains due to privacy concerns. This leads to limited HTTPS usage for onion services and reliance on self-signed certificates, which though secure, trigger browser warnings.

Despite Tor's anonymity, HTTPS is crucial for additional encryption, safeguarding data from potential snooping at compromised exit nodes. It also ensures data integrity and enhances privacy by hiding web traffic content from ISPs and intermediaries. For more insights, refer to the [Tor Project's explanation](https://support.torproject.org/https/https-1/).

BrowserBox addresses these challenges by offering the `rootCA.pem` file for its self-signed onion certificates, available at `<browserbox onion address>/torca/rootCA.pem`, with import guidance at `<onion address>/torca/rootca-import-guidance.md`.

#### Trust Guidance for BrowserBox Users

Importing and trusting a rootCA from BrowserBox is a balance between convenience and security. Opting for seamless browsing without certificate warnings entails security risks. This is a crucial consideration, especially for those running their own BrowserBox services or already trusting a BrowserBox provider.

Choosing not to install `rootCA.pem` avoids these risks, despite resulting in warnings and some BrowserBox limitations. It's a safer choice, particularly for the less tech-savvy, ensuring encrypted browsing over HTTPS and Tor.

Installing `rootCA.pem` involves extending significant trust to the CA. This decision should be made with awareness of potential risks like a compromised CA misusing this trust. While BrowserBox functions mostly fine without the CA, be prepared for certificate warnings and base your decision on your trust level and risk understanding.

#### Step-by-Step Instructions for Importing the `rootCA.pem` Certificate

**1. Downloading the Certificate**
   - Fetch the `rootCA.pem` file from its designated source.

**2. Importing and Trusting the Certificate**
   - **On macOS**:
     - Open Keychain Access.
     - Locate the `mkcert` certificate.
     - Double-click to view details, access the Trust section, and adjust settings to "Always Trust" for SSL.
   - **On Debian/CentOS**:
     - Transfer the certificate to `/usr/local/share/ca-certificates/`.
     - Execute `sudo update-ca-certificates` to apply the changes.
   - **On Windows**:
     - Launch the Microsoft Management Console and integrate the Certificates snap-in.
     - Place the certificate under "Trusted Root Certification Authorities".
     - Right-click the certificate, choose Properties, and opt for SSL "Always Trust".

**3. Final Steps**
   - Reboot your browser or system to ensure the new settings are effectively applied.

**4. Verification**
   - Navigate to a site secured by a BrowserBox CA-issued certificate. You should encounter no security warnings.

This guide is crafted to aid you in making an informed decision. Your choice, whether to install the CA or not, is valid and should be based on your understanding of online security and comfort level.
