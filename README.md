<p align="center">
  <img src="https://raw.githubusercontent.com/BrowserBox/BrowserBox/main/docs/icon.svg" alt="BrowserBox Logo 2023" width="80" height="80">
</p>

# [BrowserBox](https://dosaygo.com)
*by [DOSAYGO](https://dosaygo.com)*

Secure your web with BrowserBox—a cutting-edge remote browser isolation (RBI) solution. Version 10 requires a **license key** for all usage. Unlock advanced security and productivity today!

- **[Purchase a Commercial License](https://browse.cloudtabs.net/l)**  
- **[Join the Non-Commercial Waitlist](https://tally.so/r/nPvb1x)**  

>[!WARNING]  
>Unlicensed instances display a warning and shut down after 2 minutes.

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
- **Docker Integration**: Run BrowserBox in a container using `bbx docker-run` (see "Using `bbx` Commands" below).  
- **Tor Support**: Enable anonymity and onion routing with `bbx tor-run` (requires Tor installed).  
- **Automation Ready**: Run Puppeteer (PPtr) or Playwright scripts for automation with `bbx automate` (coming soon).  

---

## Get Started

### 1. Install the `bbx` CLI
The `bbx` CLI is the central tool to manage, install, and run your BrowserBox instance. Install it globally via NPM:

`npm i -g @browserbox/browserbox`

Alternatively, you can install `bbx` using a script. Ensure `curl` is installed, then run:

`bash <(curl -sSL https://raw.githubusercontent.com/BrowserBox/BrowserBox/refs/heads/main/bbx.sh) install`

>[!NOTE]  
>You’ll need a user with passwordless sudo privileges. See [macOS setup](https://web.archive.org/web/20241210214342/https://jefftriplett.com/2022/enable-sudo-without-a-password-on-macos/) or edit `/etc/sudoers` on Linux.

### 2. Install BrowserBox
Use `bbx` to install BrowserBox on your system:

`bbx install`

### 3. Activate Your License
For commercial use, activate a license:

`bbx activate [seats]`
- Replace `[seats]` with the number of licenses (default: 1).  
- This redirects to [https://browse.cloudtabs.net/l](https://browse.cloudtabs.net/l) for payment. Once paid, your key is provisioned automatically.  
- For non-commercial use, [join the waitlist](https://tally.so/r/nPvb1x).

---

## Using `bbx` Commands

The `bbx` CLI manages all aspects of BrowserBox, including installation, configuration, and deployment. Below is a comprehensive list of commands:

### Core Commands
- **`bbx install`**  
  Install BrowserBox, `bbx` CLI, and related files.  
  `bash <(curl -sSL https://raw.githubusercontent.com/BrowserBox/BrowserBox/refs/heads/main/bbx.sh) install`  
- **`bbx uninstall`**  
  Remove BrowserBox, `bbx` CLI, and all related files.  
- **`bbx activate [seats]`**  
  Activate your copy of BrowserBox by purchasing a license key for 1 or more seats.  
- **`bbx setup [--port|-p <port>] [--hostname|-h <hostname>] [--token|-t <token>]`**  
  Set up BrowserBox. Optionally specify a port, hostname, and token for configuration.  
  `bbx setup --port 8080 --hostname example.com --token mytoken`  
- **`bbx run [--port|-p <port>] [--hostname|-h <hostname>] [Alt]`**  
  Start BrowserBox on the specified port and hostname. `Alt` runs an alternate configuration (if applicable).  
  `bbx run --port 8080 --hostname localhost`  
- **`bbx stop`**  
  Stop BrowserBox for the current user.  
- **`bbx run-as [--temporary] <username> [<port>]`**  
  Run BrowserBox as a specific user. Use `--temporary` to delete the user after stopping.  
  `bbx run-as --temporary testuser 8081`  
- **`bbx stop-user <username> [<delay_seconds>]`**  
  Stop BrowserBox for a specific user, optionally after a delay (in seconds).  
  `bbx stop-user testuser 10`  
- **`bbx logs`**  
  Show BrowserBox logs for the current user.  

### Status and Updates
- **`bbx status`**  
  Check the current status of BrowserBox (e.g., running, stopped).  
- **`bbx update`**  
  Update BrowserBox to the latest version.  

### Tor and Docker Support
- **`bbx tor-run [--no-anonymize] [--no-onion] [--port|-p <port>]`**  
  Run BrowserBox with Tor for anonymity or onion routing (requires Tor installed). Use `--no-anonymize` to disable anonymity, and `--no-onion` to disable onion routing.  
  `bbx tor-run --port 8080 --no-anonymize`  
- **`bbx docker-run [<nickname>] [--port|-p <port>]`**  
  Run BrowserBox in a Docker container, optionally with a nickname for the container (requires Docker installed).  
  `bbx docker-run mybrowser --port 8080`  
- **`bbx docker-stop <nickname>`**  
  Stop a Dockerized BrowserBox instance by its nickname.  
  `bbx docker-stop mybrowser`  

### Advanced Features
- **`bbx console`**  
  Interact with the BrowserBox command stream for debugging or advanced control.  
- **`bbx automate`** *(Coming Soon)*  
  Run Puppeteer (PPtr) or Playwright scripts in a running BrowserBox instance for automation.  

### Version and Help
- **`bbx --version`**  
  Show the current `bbx` version.  
- **`bbx --help`**  
  Display help with all available commands and options.

>[!TIP]  
>Use `bbx --help` to explore all options for any command.

---

## License Compliance

We enforce licensing to protect your investment. Usage data ensures compliance—see our [Privacy Policy](https://dosaygo.com/privacy.txt) and [Terms](https://dosaygo.com/terms). Bypassing licensing violates our terms and may lead to legal action.

>[!INFO]  
>A license unlocks full features and ensures a supported, secure solution.

---

## FAQ

**Why a license?**  
Unlocks full functionality and supports ongoing development of a secure RBI solution.

**How do I get one?**  
- Commercial: Purchase at [https://browse.cloudtabs.net/l](https://browse.cloudtabs.net/l).  
- Non-commercial: Join the [waitlist](https://tally.so/r/nPvb1x).

**Questions?**  
Email [sales@dosaygo.com](mailto:sales@dosaygo.com).

---

## Support

- **Issues**: [GitHub](https://github.com/BrowserBox/BrowserBox/issues)  
- **Email**: [support@dosaygo.com](mailto:support@dosaygo.com)  

---

## Copyright

© 2024 DOSAYGO Corporation USA. All rights reserved.  
All code in this repository is licensed under [LICENSE.md](LICENSE.md) unless otherwise stated.
