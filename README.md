<p align="center">
  <img src="https://raw.githubusercontent.com/BrowserBox/BrowserBox/main/docs/icon.svg" alt="BrowserBox Logo 2025" width="111" height="111">
</p>

# [BrowserBox](https://dosaygo.com)
*by [DOSAYGO](https://dosaygo.com)*

Secure your web with BrowserBox&mdash;cutting-edge remote browser isolation (RBI) technology. BrowserBox requires a **license key** for all usage. Unlock advanced security and productivity today!

- **[Purchase a Commercial License](https://browse.cloudtabs.net/l)**  
- **[Join the Non-Commercial Waitlist](https://tally.so/r/nPvb1x)**  

>[!CAUTION]  
>Unlicensed instances display a warning and shut down after 2 minutes.

---

## Table of Contents

1. [Why BrowserBox?](#why-browserbox)
2. [Features](#features)
3. [Get Started](#get-started)
4. [Embed BrowserBox Anywhere with Ease](#embed-browserbox-anywhere-with-ease)
5. [Using `bbx` Commands](#using-bbx-commands)
6. [License Compliance](#license-compliance)
7. [FAQ](#faq)
8. [Support](#support)

---

## Why BrowserBox?

BrowserBox isolates web content in a secure, remote environment, protecting your network while boosting productivity. With a license, you get:

- **Advanced Security**: Block malware, ransomware, and zero-day threats.  
- **Seamless Integration**: Embed secure browsing into apps or safeguard local tabs.  
- **Exclusive Features**: Zero Latency Mode, customizable security, and mobile-ready design (new in v10 with enhanced Chrome compatibility).

---

## Features

- **1-Click Cloud Deployment**: Deploy BrowserBox on Vultr, AWS, Azure, or Linode with a single click.  
- **Cross-Platform Support**: Compatible with Ubuntu, Debian, RHEL, CentOS, Windows, and more.  
- **Docker Integration**: Run BrowserBox in a container using `bbx docker-run`.  
- **Tor Support**: Enable anonymity and onion routing with `bbx tor-run`.  
- **Automation Ready**: Run Puppeteer (PPtr) or Playwright scripts for automation (coming soon).

---

## Get Started

1. **Install the `bbx` CLI**
   ```bash
   bash <(curl -sSL https://raw.githubusercontent.com/BrowserBox/BrowserBox/refs/heads/main/bbx.sh) install
   ```

2. **Install BrowserBox**
   ```bash
   bbx install
   ```

3. **Activate Your License**
   ```bash
   bbx activate [seats]
   ```

---

## Embed BrowserBox Anywhere with Ease

Bring secure, remote browsing to your web apps with the BrowserBox Embedding API. Our `<browserbox-webview>` custom element lets you drop a fully isolated browser into any page—perfect for co-browsing, secure web views, or interactive demos. Just set your login link, configure allowed origins, and go. It’s clientless, adaptive, and built for developers. Get started in minutes!

### Quick Start  

1. **Set ALLOWED_EMBEDDING_ORIGINS on your server**:  
   ```bash
   export ALLOWED_EMBEDDING_ORIGINS="https://your-embedding-site.com"
   bbx run
   ```

2. **Add the script and element to your HTML**:  
   ```html
   <script src="https://raw.githubusercontent.com/BrowserBox/BrowserBox/main/api/browserbox-webview.js"></script>
   <browserbox-webview login-link="https://your-browserbox-instance.com/login/abc123" width="800" height="600"></browserbox-webview>
   ```

That’s it—secure browsing, embedded effortlessly.

For more details, check the full WebView API script in the [browserbox-webview.js file](https://raw.githubusercontent.com/BrowserBox/BrowserBox/main/api/browserbox-webview.js).

---

## Using `bbx` Commands

The `bbx` CLI manages all aspects of BrowserBox. Below is a comprehensive list of commands:

### Core Commands
- **`bbx install`**: Install BrowserBox, `bbx` CLI, and related files.  
- **`bbx activate [seats]`**: Activate your license for 1 or more seats.  
- **`bbx run`**: Start BrowserBox on your system.  
- **`bbx stop`**: Stop BrowserBox.  
- **`bbx logs`**: Show BrowserBox logs.

For a full list, see the [CLI documentation](#using-bbx-commands).

---

## License Compliance

We enforce licensing to protect your investment. Usage data ensures compliance. See our [Privacy Policy](https://dosaygo.com/privacy.txt) and [Terms](https://dosaygo.com/terms).

>[!IMPORTANT]  
>A license unlocks full features and ensures a supported, secure solution.

---

## FAQ

**How do I get a license?**  
- Commercial: Purchase at [https://browse.cloudtabs.net/l](https://browse.cloudtabs.net/l).  
- Non-commercial: Join the [waitlist](https://tally.so/r/nPvb1x).

**Questions?**  
Email [sales@dosaygo.com](mailto:sales@dosaygo.com).

---

## Support

- **Email**: [support@dosaygo.com](mailto:support@dosaygo.com)  

---

## Copyright

&copy; 205 DOSAYGO Corporation USA. All rights reserved.
All code in this repository is licensed under [LICENSE.md](LICENSE.md) unless otherwise stated.  

