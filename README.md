<p align="center">
  <img src="https://raw.githubusercontent.com/BrowserBox/BrowserBox/main/docs/icon.svg" alt="BrowserBox Logo 2025" width="111" height="111">
</p>

# [BrowserBox](https://dosaygo.com)
*by [DOSAYGO](https://dosaygo.com)*

Secure your web with BrowserBox—cutting-edge remote browser isolation (RBI) technology. Protect your organization from threats and empower your team with seamless, secure browsing. BrowserBox requires a **license key** for all usage—unlock advanced security and productivity today!

## Who It’s For
- **Businesses**: Safeguard your network and data from web-based threats.
- **Developers**: Embed secure browsing into your apps with our API.
- **IT Teams**: Deploy a scalable, isolated browser solution in minutes.

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
- run BrowserBox as multiple users on the one machine 👨‍🦲👱‍♀️👷‍♂️
- run BrowserBox inside docker 🟦🐳
- run BrowserBox through tor 🟣🧅
- easily install and update BrowserBox ⬇️✔️
- And more!

# Useful Links

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

BrowserBox delivers a secure, remote browsing environment that protects your network and boosts efficiency. With a license, you get:

- **Unmatched Security**: Stop malware, ransomware, and zero-day attacks before they reach your systems—saving you from costly breaches.
- **Effortless Integration**: Add secure browsing to your apps or protect local tabs with zero friction.
- **Premium Features**: Enjoy Zero Latency Mode, customizable policies, and a mobile-first experience built for modern teams.

## Trusted by Teams Worldwide

- Used by over 50 companies and organizations worldwide.
- Join 3000+ users who trust BrowserBox for secure browsing.

---

## Features

- **Clientless RBI**: No-download RBI works in any web browser.
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

  - **Commercial**: Starts at $99/user/year, with volume discounts for larger teams—perfect for businesses securing their workforce. See [pricing details](https://dosaygo.com/pricing).
  - **Non-Commercial**: $39/user/year flat rate—for individuals, non-profits, and government use.
  - **Evaluation**: Sign up for a 14-day free trial via the [waitlist](https://tally.so/r/wkv4aM).

   >[!IMPORTANT]
   >When you purchase a license key you will be emailed a link to view it securely. Save it somewhere safely, you can only view it one time. If you lose your license key Support can roll it to a new key, invalidating the old one. Contact support@dosaygo.com for assistance. Please note: evaluation license keys cannot be rolled.

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

## Advanced Usage
- **Secure Document Viewing**: Safely preview files without downloads (Linux only).
- **DevTools Access**: Inspect remote pages with a right-click.
- **Tor & SSH Tunneling**: Run anonymously or privately—see [Advanced Setup Guide](ADVANCE.md#) for details.

## FAQ

**Do you have perpetual licenses, i.e, without a subscription and frozen to a version?**

Yes, but the ACV is $50,000 and above. Contact us: sales@dosaygo.com

**Why choose BrowserBox over alternatives?**

BrowserBox combines enterprise-grade security with developer-friendly tools and unmatched flexibility—no other RBI solution offers multiple OS compatibility, Docker, and embedding in one package.

**When I purchase a license, what do I get?**

You will get an email with the link to view the license key. This key is good for the number of seats you purchased. You can adjust the seat count in the **Qty** field on the payment page, after hitting subscribe. 

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

*I think I might have used BrowserBox in violation in the past, but now I want to get a license and get compliant, what should I do?*

Contact us as soon as possible, we can forgive and work it out as long as you let us know your situation and get compliant. Email: legal@dosaygo.com

**More questions?**  

Email [sales@dosaygo.com](mailto:sales@dosaygo.com).

---

## Support

- **Email**: [support@dosaygo.com](mailto:support@dosaygo.com)  

---

## Copyright

BrowserBox&trade; is &copy; 2025 DOSAYGO Corporation USA. All rights reserved. Since 2018.
All code in this repository is licensed under [LICENSE.md](LICENSE.md) unless otherwise stated.  

