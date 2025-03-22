<p align="center">
  <img src="https://raw.githubusercontent.com/BrowserBox/BrowserBox/main/docs/icon.svg" alt="BrowserBox Logo 2025" width="111" height="111">
</p>

# [BrowserBox](https://dosaygo.com)
*by [DOSAYGO](https://dosaygo.com)*

Secure your web with BrowserBox&mdash;cutting-edge remote browser isolation (RBI) technology. BrowserBox requires a **license key** for all usage. Unlock advanced security and productivity today!

<ul>
  <li>
    <a href="https://browse.cloudtabs.net/l" class="cta-button">Get a Commercial License</a>
  </li>
  <li>
    <a href="https://browse.cloudtabs.net/M/jl" class="cta-button">Get a Non-Commercial License</a>
  </li>
  <li>
    <a href="https://tally.so/r/wkv4aM" class="cta-button secondary-cta">Join Evaluation Waitlist</a>    
  </li>
</ul>

>[!CAUTION]  
>Unlicensed instances display a warning and shut down after 2 minutes.

---

# Get our new [`bbx`](https://github.com/BrowserBox/BrowserBox?tab=readme-ov-file#get-started) tool

<a href="https://github.com/BrowserBox/BrowserBox?tab=readme-ov-file#get-started"><img width="1204" alt="Get our New bbx tool" src="https://github.com/user-attachments/assets/4d549f18-1fbb-463d-bf6a-4b2ce121dea2" /></a>


# `bbx` lets you

- manage and activate your BrowserBox copy 📝
- purchase a BrowserBox license key 🔐
- run BrowsreBox as multiple users on the one machine 👨‍🦲👱‍♀️👷‍♂️
- run BrowserBox inside docker 🟦🐳
- run BrowserBox through tor 🟣🧅
- easily install and update BrowserBox ⬇️✔️
- And more!

## Get Started

1. **Install the `bbx` CLI**

   **On Windows:**

   ```powershell
   irm bbx.dosaygo.com | iex
   ```

   **Everywhere else:**

   ```bash
   bash <(curl -sSL bbx.sh.dosaygo.com) install
   ```

   **@browserbox/browserbox**

   You can also install from NPM, like so:

   ```bash
   npm i -g @browserbox/browserbox
   bbx-install 
   ```
   
   *Which just runs either the above **Windows** or **Everywhere else** installation depending on your OS.*

2. **Purchase a License and Activate Your Copy of BrowserBox**

   **On Windows:** Head to [our website to purchase a license](https://dosaygo.com)

   **Everywhere else:**

   Use our website to purchase a license, or the command line:

   ```console
   bbx activate [seats]
   ```

3. **Use BrowserBox**
   ```console
   bbx --help
   bbx setup
   bbx run
   bbx stop
   ```

   And access the **Login Link** you get from any browser on any device. (Make sure you set up your DNS records correctly if connecting over the public Internet).

---

# Userful Links

- [Purchase a BrowserBox Commercial License for 1 or more seats](https://browse.cloudtabs.net/l)
- [CloudTabs - Managed BrowserBox&trade; SaaS](https://browse.cloudtabs.net)
- [Visit the DOSAYGO website](https://dosaygo.com)
- [Read the Rest of this README](#table-of-contents)

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

   **On Windows:**

   ```powershell
   irm bbx.dosaygo.com | iex
   ```

   **Everywhere else:**

   ```bash
   bash <(curl -sSL bbx.sh.dosaygo.com) install
   ```

2. **Purchase a License and Activate Your Copy of BrowserBox**

   **On Windows:** Head to [our website to purchase a license](https://dosaygo.com)

   Then before using `bbx` set the `LICENSE_KEY` environment variable:

   ```powershell
   $Env:LICENSE_KEY = "your license key"
   ```

   **Everywhere else:**

   Use our website to purchase a license, or the command line:

   ```console
   bbx activate [seats]
   ```

   *Note: `LICENSE_KEY` will be saved automatically when using bbx activate. On non-Windows systems you can also set it yourself, 
   using: `bbx certify`*

3. **Use BrowserBox**
   ```console
   bbx --help
   bbx setup
   bbx run
   bbx stop
   ```

   And access the **Login Link** you get from any browser on any device. (Make sure you set up your DNS records correctly if connecting over the public Internet).

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

For more details, check the full WebView API script in the [browserbox-webview.js file](https://github.com/BrowserBox/BrowserBox/blob/main/api/browserbox-webview.js).

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

<ul>
  <li>
    <a href="https://browse.cloudtabs.net/l" class="cta-button">Get a Commercial License</a>
  </li>
  <li>
    <a href="https://browse.cloudtabs.net/M/jl" class="cta-button">Get a Non-Commercial License</a>
  </li>
  <li>
    <a href="https://tally.so/r/wkv4aM" class="cta-button secondary-cta">Join Evaluation Waitlist</a>    
  </li>
</ul>

**Why pay for a license for a browser? Browser's are free!!!**

Yeah, they're *free*, when *you're* the product. With BrowserBox, you are not the product. So pay money, instead of choosing a product where you pay with your data.

**Questions?**  

Email [sales@dosaygo.com](mailto:sales@dosaygo.com).

---

## Support

- **Email**: [support@dosaygo.com](mailto:support@dosaygo.com)  

---

## Copyright

BrowserBox&trade; is &copy; 2025 DOSAYGO Corporation USA. All rights reserved. Since 2018.
All code in this repository is licensed under [LICENSE.md](LICENSE.md) unless otherwise stated.  

