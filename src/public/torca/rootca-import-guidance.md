### Trust Guidance and Certificate Installation Instructions

#### Trust Guidance for Installing the rootCA.pem Certificate

**Understanding Your Trust Decision**
- **Extended Trust to CA**: By installing `rootCA.pem`, you grant trust to the certificate authority to responsibly issue certificates and not misuse this trust.
- **Usage Context Matters**: If you use Tor Browser primarily for specific services like BrowserBox, the trust implications might differ from broader internet usage.
- **BrowserBox Trust**: If you trust the BrowserBox service with your browsing activities, extending this trust to include the CA can be considered a similar level of trust.
- **Self-Setup vs. Third-Party**: Using your own BrowserBox setup is more secure regarding CA trust as you control the CA.
- **Non-Installation Option**: Not installing the CA is also an option, but it may lead to security warnings and some limited functionality in BrowserBox.

**Proceeding with CA Installation**
- Decide based on your trust level and the understanding that installing a CA involves a significant level of trust.

#### Instructions for Importing the rootCA.pem Certificate

**1. Downloading the Certificate**
- Download `rootCA.pem` from our static site.

**2. Importing the Certificate in Tor Browser**
- Open the Tor Browser.
- Type `about:preferences#privacy` in the address bar and press Enter.
- Scroll down to the 'Security' section.
- Click on 'View Certificates' to open the Certificate Manager.
- In the Certificate Manager, go to the 'Authorities' tab.
- Click on 'Import' and select the `rootCA.pem` file you downloaded.
- When prompted, check the box that says "Trust this CA to identify websites" and click OK.

**3. Final Steps**
- Restart the Tor Browser to ensure the new settings take effect.

**4. Verification**
- After restarting, you can verify the installation by accessing a site using a certificate issued by your BrowserBox CA. There should be no security warnings.

