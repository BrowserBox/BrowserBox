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

- **Advanced Security**: Block malware, ransomware, and zero-day threats. Securely view documents, archives and files without downloading. 
- **Seamless Integration**: Embed secure browsing into apps or safeguard local tabs. 
- **Exclusive Features**: Zero Latency Mode, customizable security, and mobile-first design.

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

### Securely View Documents without Downloading them

On Linux systems you have the option to install the Secure Document Viewier during `bbx install`. Whenever you click on a document in BrowserBox (e.g. *.doc, .xls, .pages, .pdf, .rtf etc*) the document will automatically be converted to a safe sequence of page images that you can view with the built in viewier. Unsupported formats still have the options of viewing as a binary hex format for analysis using the built-in hex viewer. Also, common archive formats (e.g. *.zip, *.gz, *.7z, *.bz etc*) will be safely expanded remotely and displayed with the built-in file and directory viewier. 

### Inspect the JavaScript and HTML of the remote page with DevTools

When viewing a page just right click (long-tap on mobile) and select "Inspect in DevTools" to open the DevTools viewier for the page. 

### Tunnel over Tor

BrowserBox supports Tor natively, both accessing the hidden web and running as an `.onion` site:

```bash
bbx tor-run 
```

### Tunnel over SSH

You can set up a private SSH tunnel between your machine and your BrowserBox machine (e.g. `user@remote_host`). Then BrowserBox ports are never exposed to the public internet.

1. **Setup your local devices**

Run `install` and enter `localhost` for the hostname when prompted. The `https://localhost` certificates will be trusted by your local machine so copy them to your remote machine for BrowserBox, and create the SSH tunnel:

```console
bbx install # enter localhost when prompted
scp ~/sslcerts/*.pem user@remote_host:~/sslcerts/
ssh -L 9997:localhost:9997 -L 9998:localhost:9998 -L 9999:localhost:9999 -L 10000:localhost:10000 -L 10001:localhost:10001 user@remote_host
```

2. **Run BrowserBox on your remote machine (e.g. user@remote_host)**

Run BrowserBox on the remote machine on the same ports you tunneled by specifying the middle port:

```console
bbx setup --hostname localhost --port 9999
bbx run
```

3. **Remote access BrowserBox from your local devices**

Open a web browser on your local device and put the **Login Link** from step 2 into the address bar.

>[!TIP]
>*Windows instructions differ slightly. Consult AI for guidance.*

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

**More questions?**  

Email [sales@dosaygo.com](mailto:sales@dosaygo.com).

---

## Support

- **Email**: [support@dosaygo.com](mailto:support@dosaygo.com)  

---

## Copyright

BrowserBox&trade; is &copy; 2025 DOSAYGO Corporation USA. All rights reserved. Since 2018.
All code in this repository is licensed under [LICENSE.md](LICENSE.md) unless otherwise stated.  

