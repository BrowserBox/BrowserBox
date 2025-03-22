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

# `bbx` 

- manage and activate your BrowserBox copy 📝
- purchase a BrowserBox license key 🔐
- run BrowsreBox as multiple users on the one machine 👨‍🦲👱‍♀️👷‍♂️
- run BrowserBox inside docker 🟦🐳
- run BrowserBox through tor 🟣🧅
- easily install and update BrowserBox ⬇️✔️
- And more!

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

   **@browserbox/browserbox**

   You can also install from NPM:

   ```bash
   npm i -g @browserbox/browserbox
   bbx-install 
   ```

2. **Purchase a License**

   **On Windows:** Head to [our website to purchase a license](https://dosaygo.com)

   **Everywhere else:**

   Use our website to purchase a license, or the command line:

   ```console
   bbx activate [seats]
   ```

3. **Activate your copy of BrowserBox with a License Key**

  **On Windows:**
  
  Before using `bbx`, set the `LICENSE_KEY` environment variable:

  ```powershell
  $Env:LICENSE_KEY = "a valid BrowserBox license key"
  ```

  **Everywhere else:**`

  Use `bbx certify` to enter a License Key and save it to your config.

  If you used `bbx activate` it will already be saved.

4. **Use BrowserBox**
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

For a full list on your OS, run `bbx`

---

## License Compliance

We enforce licensing and protections for our business. Usage data ensures compliance. See our [Privacy Policy](https://dosaygo.com/privacy.txt) and [Terms](https://dosaygo.com/terms).

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

*I want to buy more licenses, do you offer discounts?*

Yes, see our payment page for volume discounts. These are only available to commercial licensees. Non-commercial (government, non-profit, individuals) keep a flat rate regardless of volume. For any questions regarding volume discounts, support or other custom packages, please contact us: sales@dosaygo.com

*Why pay for a license for a browser? Browser's are **free**!!!*

Yeah, they're *free*, when *you're* the product. With BrowserBox, you are not the product. So pay money, instead of choosing a product where you pay with your data.

*But this used to be **FREE** why do I need to pay now?*

If you don't pay it won't work. Is it right to take, giving nothing in return? Why is anything paid and not free? Because it's valuable. DOSAYGO (the corporation offering BrowserBox) is not a socialist state, it's a federal-tax-paying corporation. Human society functions on exchanges of value. Give and take. Otherwise it's just theft, plunder and abuse. And this is peacetime. 

*But if the code is just there on GitHub, can't I just take it? I mean I can probably modify it and remove the licensing restrictions, can't I?*

Maybe you *can*, but should you? Are you permitted to? No. Because that's theft. Are you really a software pirate? Because that's what that is. There's always software pirates, but BrowserBox is a paid product. The reason the source code is on GitHub (rather than offered as an opaque and obfuscated binary for download), is because there's value in transparency. That way, you also you can trust what you are putting in your computer. 

*But why did it used to be free?*

Actually BrowserBox was never *free*, not even once. Earlier versions used different licenses, including "free software" licenses, but BrowserBox was always offered as a commercial product, with custom licensing and deployments as a paid service, since version 1. A few versions ago, BrowserBox began using stricter commercial licenses, and offered for a while "free for non-commercial use", permitting use of these versions by non-profits, governments and individuals for leisure. Even then, custom work, support and deployments were all paid offerings of DOSAYGO. Today, at version 10, all usage of BrowserBox, whether commercial or non-commercial is paid and requires a license key. This is the Way. 

Use of any code from these versions with earlier versions or forks of BrowserBox is strictly prohibited and violates our business terms. It will likely lead to legal action, and obviously accrues bad karma. Also, reputation is key to consider.

*But we're smarter than you and live far away we can probably get away with it*

We'll see. Smart is as smart does.

*But our company has lots of money and more people than you. We will beat you in court, and we have clever lawyers who will try to rip you off!*

We'll see. But with all that money, what makes it hard for you to pay for BrowserBox?

**More questions?**  

Email [sales@dosaygo.com](mailto:sales@dosaygo.com).

---

## Support

- **Email**: [support@dosaygo.com](mailto:support@dosaygo.com)  

---

## Copyright

BrowserBox&trade; is &copy; 2025 DOSAYGO Corporation USA. All rights reserved. Since 2018.
All code in this repository is licensed under [LICENSE.md](LICENSE.md) unless otherwise stated.  

