<p align="center">
  <img src="https://raw.githubusercontent.com/BrowserBox/BrowserBox/main/docs/icon.svg" alt="BrowserBox Logo 2025" width="111" height="111">
</p>

<h1 align="center">BrowserBox by DOSAYGO</h1>

<p align="center">
  <strong>Secure, modern Remote Browser Isolation (RBI) with a clientless experience</strong>
</p>

<p align="center">
  <a href="https://dosaygo.com#license"><img src="https://img.shields.io/badge/License-Required-red" alt="License Required"></a>
  <a href="https://dosaygo.com"><img src="https://img.shields.io/badge/BrowserBox-Secure%20RBI-blue" alt="BrowserBox Secure RBI"></a>
  <a href="https://dosaygo.com/nist800-53.html"><img src="https://img.shields.io/badge/NIST%20800--53-Alignment-green" alt="NIST 800-53 Alignment"></a>
  <a href="https://dosaygo.com/hipaa.html"><img src="https://img.shields.io/badge/HIPAA-Ready-purple" alt="HIPAA Ready"></a>
  <a href="https://dosaygo.com/dlp.html"><img src="https://img.shields.io/badge/DLP-Options-pink" alt="DLP Options"></a>
  <br>
  <a href="https://github.com/BrowserBox/BrowserBox/actions/workflows/bbx-saga.yaml"><img src="https://github.com/BrowserBox/BrowserBox/actions/workflows/bbx-saga.yaml/badge.svg?event=release" alt="bbx Saga Test Suite"></a>
</p>

<p align="center">
  <strong>🆕 FEBRUARY 2026:</strong> Windows 98½ Demo now live!<br>
  Try BrowserBox with our nostalgic <a href="https://win9-5.com/demo">Windows 98½ demo</a> — free 17-minute cloud browser sessions, no signup required.<br>
  <strong>Cloud API:</strong> Purchase minutes and create on-demand cloud browser sessions via REST API.<br>
  <a href="https://win9-5.com/api/">API Docs</a> · <a href="https://win9-5.com/pricing/">Pricing</a> · <a href="https://win9-5.com/demo">Live Demo</a>
</p>

BrowserBox&trade; is a remote browser isolation (RBI) platform for security teams, SaaS builders, and IT ops. It streams a full modern browser to any client with low latency and 60 FPS, supports embedding, and runs on Windows, Linux, and containers. **A product key is required for all self-hosted BrowserBox usage.**

At a glance:
*   **Clientless RBI:** No plugins or downloads for end users.
*   **60 FPS streaming:** Smooth, responsive browsing over the network.
*   **Embed anywhere:** Drop in the `<browserbox-webview>` component — works with self-hosted or cloud instances.
*   **Cloud API:** Purchase minutes and spin up ephemeral browser sessions on demand via REST.
*   **Flexible deployment:** Works on Windows, Linux, Docker, and LXC.
*   **Built for control:** Policies, isolation, and audit-friendly workflows.

Quick links: [Get Started](#get-started-in-3-steps) | [Cloud API](#cloud-api-ephemeral-sessions) | [Embedding API](#embed-browserbox-anywhere) | [Live Demo](https://win9-5.com/demo) | [Pricing](https://win9-5.com/pricing/) | [Support](mailto:api@browserbox.io)

Official sites: [BrowserBox](https://browserbox.io), [DOSAYGO](https://dosaygo.com), and [CloudTabs](https://browse.cloudtabs.net)

<details>
<summary>bbx CLI help (expand)</summary>

```ansi


   ███████████                                                                ███████████
  ░░███░░░░░███                                                              ░░███░░░░░███
   ░███    ░███ ████████   ██████  █████ ███ █████  █████   ██████  ████████  ░███    ░███  ██████  █████ █████
   ░██████████ ░░███░░███ ███░░███░░███ ░███░░███  ███░░   ███░░███░░███░░███ ░██████████  ███░░███░░███ ░░███
   ░███░░░░░███ ░███ ░░░ ░███ ░███ ░███ ░███ ░███ ░░█████ ░███████  ░███ ░░░  ░███░░░░░███░███ ░███ ░░░█████░
   ░███    ░███ ░███     ░███ ░███ ░░███████████   ░░░░███░███░░░   ░███      ░███    ░███░███ ░███  ███░░░███
   ███████████  █████    ░░██████   ░░████░████    ██████ ░░██████  █████     ███████████ ░░██████  █████ █████
  ░░░░░░░░░░░  ░░░░░      ░░░░░░     ░░░░ ░░░░    ░░░░░░   ░░░░░░  ░░░░░     ░░░░░░░░░░░   ░░░░░░  ░░░░░ ░░░░░


				 Welcome to the bbx CLI tool for BrowserBox!

Usage:
		 bbx <command> [options]

Commands:

  install      Install BrowserBox + bbx CLI
  uninstall    Remove everything
  activate     Purchase a license                   bbx activate [number of people]
  setup        Configure options                    bbx setup [--port|-p <p>] [--hostname|-h <h>] [--token|-t <t>] [--zeta|-z]

    setup options:
      --zeta, -z  Expose each service as a unique hostname. Useful for nginx,
                  ngrok, similar layers, or standard HTTP/S ports. Expects hosts.env
  certify      Check your license
  run          Run BrowserBox                       bbx run [--port|-p <port>] [--hostname|-h <hostname>]
  stop         Stop BrowserBox (current user)
  run-as       Run as a specific user               bbx run-as [--temporary] [username] [port]
  stop-user    Stop BrowserBox for a specific user  bbx stop-user <username> [delay_seconds]
  logs         Show BrowserBox logs
  update       Update BrowserBox                    bbx update [<version>|--latest-rc]
  status       Check BrowserBox status
  tor-run      Run BrowserBox on Tor                bbx tor-run [--no-darkweb] [--no-onion]
  zt-run       Run BrowserBox with ZeroTier tunnel  bbx zt-run
  docker-run   Run BrowserBox using Docker          bbx docker-run [nickname] [--port|-p <port>]
  docker-stop  Stop a Dockerized BrowserBox         bbx docker-stop <nickname>
  automate     *Drive with script, MCP or REPL
  ng-run       Run BrowserBox with Nginx proxy      bbx ng-run
  --version    Show version
  --help       Show this help

*automate coming soon
```
</details>

---

## Table of Contents

1.  [Commercial Licensing & Legal (Not Open Source)](#commercial-licensing--legal-not-open-source)
2.  [Get Started in 3 Steps](#get-started-in-3-steps)
    *   [1. Install the `bbx` CLI](#1-install-the-bbx-cli)
    *   [2. Purchase & Obtain Your Product Key](#2-purchase--obtain-your-product-key)
    *   [3. Activate & Run BrowserBox](#3-activate--run-browserbox)
3.  [Why Choose BrowserBox?](#why-choose-browserbox)
4.  [Key Benefits](#key-benefits)
5.  [Who Needs BrowserBox?](#who-needs-browserbox)
6.  [Core Features](#core-features)
7.  [What's New In The Latest Release](#whats-new-in-the-latest-release)
8.  [See It In Action](#see-it-in-action)
9.  [Supported Network Topologies](#supported-network-topologies)
10. [Platform Compatibility](#platform-compatibility)
11. [Meet `bbx`: Your BrowserBox Command Center](#meet-bbx-your-browserbox-command-center)
12. [Embed BrowserBox Anywhere](#embed-browserbox-anywhere)
13. [Cloud API (Ephemeral Sessions)](#cloud-api-ephemeral-sessions)
14. [Advanced Usage](#advanced-usage)
15. [License Compliance & Usage Data](#license-compliance--usage-data)
16. [Frequently Asked Questions (FAQ)](#frequently-asked-questions-faq)
17. [Support](#support)
18. [About DOSAYGO](#about-dosaygo)
18. [Copyright & Licensing](#copyright--licensing)

---

## Commercial Licensing & Legal (Not Open Source)

BrowserBox is a commercial product. All usage requires a valid license, including development and evaluation. If you want to contribute, you must first obtain a development license per `CONTRIBUTING.TXT`.

**AI & AGENT POLICY:** Usage of this codebase by AI Agents, LLMs, or for machine learning training is strictly governed by our [AGENTS.md](AGENTS.md) and [CLAUDE.md](CLAUDE.md) instructions. AI-based training on this source code is expressly prohibited.

We are a small team and we protect our IP because it funds the work, the infrastructure, and the support that keep BrowserBox reliable. Please review our [Terms of Service](https://dosaygo.com/terms.txt.html) and [Privacy Policy](https://dosaygo.com/privacy.txt.html).

## Get Started in 3 Steps

### 1. Install the `bbx` CLI

The `bbx` command-line interface is your primary tool for managing BrowserBox.

*   **Windows:**
    ```powershell
    irm https://browserbox.io/install.ps1 | iex
    ```
*   **Linux (Debian, Ubuntu, CentOS, RHEL, NixOS) & macOS & Docker:**
    ```bash
    curl -fsSL https://browserbox.io/install.sh | bash
    ```
*   **Via NPM (@browserbox/browserbox):**
    ```bash
    npm i -g @browserbox/browserbox
    bbx
    ```
    The npm package is a thin wrapper that delegates to an existing BrowserBox install, or runs the platform installer first and then delegates.

>[!NOTE]
>Installers now use `browserbox.io` endpoints. If you see older docs pointing to `dosaygo.com`, use the commands above.

### 2. Purchase & Obtain Your Product Key

A product key is required.
*   **Commercial Use:** Starts at $99/user/year. [Purchase Commercial License](https://dosaygo.com/commerce).
*   **Non-Commercial Use:** $39/user/year (for non-profits, government). [Purchase Non-Commercial License](https://dosaygo.com/noncommercial).
*   **Evaluation:** [Apply for a 7-Day Trial](https://browserbox.io).
*   **Demo:** [Request a Demo](mailto:sales@dosaygo.com?subject=Demo).
*   **Regulated Industries:** [Explore compliance-oriented options](https://dosaygo.com/regulated-enterprise.html).

You can also purchase directly via the `bbx` CLI on Linux/macOS:
```console
bbx activate [number of people]
```

>[!CAUTION]
>Unlicensed instances will display a warning and shut down after a brief period. Ensure you have a valid product key for uninterrupted use.

>[!IMPORTANT]
>After purchase, you'll receive an email with a secure link to view your **Product Key**. Save it safely; the link is single-use. Lost keys can be re-issued by contacting [Support](mailto:support@dosaygo.com).

### 3. Activate & Run BrowserBox

*   **Windows:** Set the `LICENSE_KEY` environment variable:
    ```powershell
    $Env:LICENSE_KEY = "YOUR_BROWSERBOX_PRODUCT_KEY"
    ```
*   **Linux/macOS:** Use `bbx certify` to enter and save your Product Key (if not already saved via `bbx activate`).
    ```console
    bbx certify YOUR_BROWSERBOX_PRODUCT_KEY
    ```

Then, start BrowserBox:
```console
bbx setup  # Run once for initial configuration
bbx run
```
Access BrowserBox using the **Login Link** provided in your console. For public internet access, ensure your DNS records are configured correctly. View logs with `bbx logs` and stop with `bbx stop`.

## Why Choose BrowserBox?

In today's threat landscape, standard browsing carries real risk. BrowserBox provides an isolated environment that reduces exposure to web-based threats *before* they reach your network or endpoints. It's a practical tool for:

*   **Protecting Sensitive Data:** Support secure workflows in regulated environments.
*   **Secure Automation:** Run web automation inside isolation boundaries.
*   **Compliance & DLP:** Apply policy-driven controls to reduce data leakage.
*   **Developer Productivity:** Easily embed secure browsing into applications.

## Key Benefits

*   **Stronger Isolation:** Reduce malware risk and limit exposure to web-based threats.
*   **Effortless Integration:** Clientless RBI works in any browser. Embed secure browsing into your apps or protect local tabs with minimal friction.
*   **Cross-Platform Coverage:** Runs on Windows, Linux (Debian, Ubuntu, RHEL, CentOS, NixOS), Docker, and LXC.
*   **Smooth UX:** Low-latency rendering with a focus on responsiveness and 60 FPS streaming.
*   **Developer Friendly:** Powerful `bbx` CLI and a straightforward Embedding API.

## Who Needs BrowserBox?

*   **Security Teams:** Reduce risk from untrusted browsing while keeping access simple.
*   **SaaS Builders & Integrators:** Embed isolated browsing directly into your product or workflow.
*   **IT & Ops:** Deploy a manageable, remote browser on mixed fleets and servers.
*   **Automation & QA:** Run scripts against real sites inside an isolated environment.
*   **Regulated Orgs:** Support policy-driven browsing with configurable controls.

## Core Features

*   **Clientless Remote Browser Isolation (RBI):** No downloads or plugins needed for end-users. Access from any modern web browser.
*   **Comprehensive Platform Support:** Windows, major Linux distributions, Docker, LXC.
*   **Powerful `bbx` CLI Tool:** Manage installations, licenses, users, and run modes (including Tor).
*   **Easy Embedding API:** Integrate BrowserBox into your web applications with a simple `<browserbox-webview>` custom element.
*   **Cloud API:** Create on-demand ephemeral browser sessions via REST — no self-hosting required. [Learn more](https://win9-5.com/api/).
*   **Automation Ready:** Designed for use with Puppeteer (PPtr) and Playwright (support coming soon).
*   **Security Focused:** Built-in DLP features, Tor support for anonymity, and robust access controls.
*   **1-Click Cloud Deployment (Coming Soon):** Easily deploy on Vultr, AWS, Azure, or Linode.

## What's New In The Latest Release

*   **Cloud API:** Purchase minutes and create ephemeral browser sessions on demand — [API docs](https://win9-5.com/api/).
*   **Windows 98½ Demo:** Try BrowserBox free at [win9-5.com/demo](https://win9-5.com/demo) — no signup required.
*   **Binary release system:** Faster installs and more reliable updates.
*   **60 FPS streaming:** Smooth, responsive remote browsing.
*   **Unified install endpoints:** `browserbox.io` installers for Linux/macOS and Windows.

## See It In Action

BrowserBox provides a full-featured, secure browsing experience:

<div align="center">
  <figure style="display: inline-block; margin: 10px;">
    <img width="600" alt="BrowserBox displays the web, like a normal browser, but enterprise secure." src="https://github.com/user-attachments/assets/22150497-a6c9-4e05-9770-e9f5e7196c61" />
    <figcaption>Secure Web Browsing</figcaption>
  </figure>
  <figure style="display: inline-block; margin: 10px;">
    <img width="600" alt="BrowserBox displays PDFs like a normal browser." src="https://github.com/user-attachments/assets/45240ca9-3f1d-458f-9d92-d05cfb14f991" />
    <figcaption>Seamless PDF Viewing</figcaption>
  </figure>
  <figure style="display: inline-block; margin: 10px;">
    <img width="600" alt="BrowserBox has DevTools like a normal browser" src="https://github.com/user-attachments/assets/a6457338-117a-44ee-8ab8-87dafa471f11" />
    <figcaption>Powerful DevTools</figcaption>
  </figure>
  <figure style="display: inline-block; margin: 10px;">
    <img width="600" alt="BrowserBox uploads files, and does many other things, just like a normal browser." src="https://github.com/user-attachments/assets/a70608cd-30d7-48ad-a707-4bacfc6d9a73" />
    <figcaption>Full Browser Features (File Uploads, etc.)</figcaption>
  </figure>
</div>

# Supported Network Topologies

🌐 **Unlock Any Network Scenario with BrowserBox** – Whether you're a SD-WAN architect optimizing enterprise connectivity, a NAT traversal expert punching through firewalls, a WiFi specialist ensuring seamless access on the go, or a NOC pro managing mission-critical operations, BrowserBox delivers unmatched flexibility. From massive country-scale deployments to secure homelab setups, our platform adapts to virtually every operating system, client device, and networking topology you'll encounter. Run it headless on servers without a graphical display or GPU for efficient, low-footprint ops—or leverage full GPU acceleration and manual graphical displays when you need visual power. BrowserBox isn't just software; it's an all-in-one toolkit for secure, scalable remote browser access that fits *your* environment, not the other way around. From mesh to edge, from overlay to backbone — BrowserBox works with it all. 🚀

### Comprehensive Topology Compatibility at a Glance

Here's the core of what makes BrowserBox a networking powerhouse—a detailed table of our supported topologies. We've got you covered from simple HTTP setups to advanced overlay networks, with zero-compromise reliability across platforms. (And stay tuned: Native support via the `bbx` CLI is coming soon for NGINX, Cloudflare Tunnels, and ZeroTier on all platforms, plus automated SSH port forwarding with built-in certificate management and orchestration. Get ready for even smoother integrations! 🎉)

| Topology | Description | Public Access? | Key Features & Benefits | OS Support (Ubuntu/macOS/Windows) | Best For |
|----------|-------------|----------------|--------------------------|------------------------------------|----------|
| **HTTP Only** | Basic unencrypted HTTP connections for quick, lightweight access. | Yes (if exposed) | Simple setup; ideal for internal testing or low-security demos. Supports custom ports (e.g., 8080, 9999, 11111) or standard (80). | ✅ / ✅ / ✅ | Rapid prototyping in trusted networks. |
| **HTTP/WS** | HTTP with WebSocket support for real-time bidirectional communication. | Yes (if exposed) | Enables interactive apps; pairs with custom/standard ports for flexibility. | ✅ / ✅ / ✅ | Chat apps, live updates, or collaborative tools. |
| **HTTPS/WSS/WebRTC** | Secure HTTPS with WebSocket Secure and WebRTC for encrypted, peer-to-peer media streaming. | Yes (if exposed) | End-to-end encryption; auto-cert handling; custom/standard ports (443 default). | ✅ / ✅ / ✅ | Video calls, secure file sharing, or real-time collaboration in production. |
| **Tor/HTTP** | Tor onion service over HTTP for pseudonymous access. | Yes (via .onion) | High privacy; bypasses censorship; slow but reliable. Requires Tor Browser. | ✅ / ✅ / ✅ | Privacy-focused demos or restricted environments. |
| **Tor/HTTPS** | Secure Tor onion service with HTTPS encryption. | Yes (via .onion) | Adds TLS to Tor for extra security; reliable NAT traversal. | ✅ / ✅ / ✅ | Anonymous secure access in high-threat scenarios. |
| **SSH Port Forward, HTTP** | SSH-based port forwarding tunneling HTTP traffic. | No (private) | Secure, low-latency; forwards to custom/standard ports. Upcoming auto-cert orchestration. | ✅ / ✅ / ✅ | Private homelab access or secure internal routing. |
| **SSH Port Forward, HTTPS** | SSH forwarding with HTTPS for encrypted tunnels. | No (private) | Combines SSH reliability with TLS; flexible port options. Native enhancements incoming. | ✅ / ✅ / ✅ | Enterprise-grade secure remote sessions. |
| **Custom Ports** | User-defined ports (e.g., 8080, 9999, 11111) across any protocol. | Varies | Total control; avoids conflicts; integrates with all topologies. | ✅ / ✅ / ✅ | Tailored setups for specialized apps or multi-service hosts. |
| **Standard Ports** | Default ports (e.g., 80 for HTTP, 443 for HTTPS) for seamless compatibility. | Varies | Plug-and-play; reduces config overhead in standard environments. | ✅ / ✅ / ✅ | Quick deployments matching common infrastructure. |
| **Cloudflare Tunnel** | HTTPS DNS facade with port relay via Cloudflare's edge network. | Yes (*.trycloudflare.com) | Auto-install; high reliability; great perf. Native `bbx cf-run` support soon. | ✅ / ✅ / ✅ | Quick public demos with origin privacy. |
| **localhost.run** | SSH reverse tunnel with HTTPS facade. | Yes (http(s)://…lhr.life) | Zero-config; medium reliability; occasional interstitials. | ✅ / ✅ / ✅ | Free, easy links for casual sharing. |
| **ngrok** | Port relay with HTTPS and auth token for secure exposure. | Yes (*.ngrok-free.app) | High perf; webhooks ready; free tier limits (1 tunnel). Token required. | ✅ / ✅ / ✅ | Shareable demos and webhook testing. |
| **Pinggy** | Port relay with HTTPS; may have interstitials. | Yes (*.pinggy.io) | Fair reliability; okay perf. | ✅ / ✅ / ℹ️ (Limited on Windows) | Budget-friendly webhooks and demos. |
| **Tailscale** | Overlay network for private, LAN-like access. | No (private tailnet) | Very high reliability; low latency. SSH forwarding; token required. Less stable on Windows/VPN. | ✅ / ✅ / ℹ️ (SSH not upstream-supported on Windows) | Private team debugging and access. |
| **Tor** | Onion routing for pseudonymous, reliable access. | Yes (.onion) | Extremely reliable (but slow); privacy-first. We already have `bbx tor-run`. | ✅ / ✅ / ✅ | Censorship-resistant, anonymous deployments. |
| **Tunnelmole** | OSS ngrok-style relay with HTTPS. | Yes (https://…tunnelmole.net/.com) | High reliability; good perf; auto-install. | ✅ / ✅ / ✅ | Open-source demos with easy URLs. |
| **ZeroTier** | Overlay network for peer-to-peer private access. | No (private network) | LAN-like; very high reliability. Native `bbx zt-run` support soon. Tokens required; client on access device. | ✅ / ✅ / ✅ | Secure P2P demos in overlays. |

**Notes on Flexibility & Power:**
- **Headless or Graphical? Your Call.** BrowserBox thrives on headless machines—no display or GPU needed for core ops—making it perfect for servers or cloud instances. But when you want it, tap into GPU acceleration for heavy rendering or enable manual graphical displays for hands-on control. Scale from a single homelab box to nationwide rollouts without missing a beat. 💪
- **Why BrowserBox Wins Networks:** In a world of rigid tools, BrowserBox stands out by embracing *every* topology. Punch through NAT with ease, integrate with SD-WAN for optimized routing, ensure WiFi stability for mobile pros, and give NOC teams the configurability to monitor and manage at scale. It's not just supported—it's battle-tested for real-world wins. Ready to deploy? Fork, configure, and conquer! 🌍

  
## Platform Compatibility

BrowserBox runs seamlessly across a wide range of operating systems and containerization technologies:

| Platform                 | Supported | Icon                                                                                                |
| :----------------------- | :-------- | :-------------------------------------------------------------------------------------------------- |
| Tails\*                  | ❌        | <img src="readme-files/tails.png" alt="Tails" width="100" title="Tails OS">    |
| Windows & Windows Server | ✅        | <img src="readme-files/windows.png" alt="Windows" width="100" title="Windows and Windows Server">    |
| Debian                   | ✅        | <img src="readme-files/debian.png" alt="Debian" height="64" title="Debian">                           |
| Ubuntu                   | ✅        | <img src="readme-files/ubuntu.png" alt="Ubuntu" width="100" title="Ubuntu">                           |
| CentOS Stream            | ✅        | <img src="readme-files/centos.png" alt="CentOS Stream" width="100" title="CentOS Stream">             |
| RHEL                     | ✅        | <img src="readme-files/rhel.png" alt="Red Hat Enterprise Linux" width="100" title="RHEL">             |
| NixOS                    | ✅        | <img src="readme-files/nixos.png" alt="NixOS" width="100" title="NixOS">                             |
| Docker                   | ✅        | <img src="readme-files/docker.png" alt="Docker" width="100" title="Docker">                           |
| LXC                      | ✅        | <img src="readme-files/LXC.png" alt="LXC" height="64" title="LXC">                                   |
| Podman‡                  | 🚧        | <img src="readme-files/Podman.png" alt="Podman" width="64" title="Podman">                           |
| Windows 9x†              | ✅        | <img src="readme-files/windows-9x.png" alt="Windows 9x" width="64" title="Windows 9x">              |

>[!NOTE]
>Run `bbx` (or `bbx install` on Windows) to ensure you have the latest version (v13+) with all fixes and features.

**Notes**

- \*Tails is not supported because neither Chrome nor Docker can be installed.
- ‡Podman support is currently under consideration.
- †Windows 9x clients are supported by running the **new** `win9x_bbpro` command which will output the login link for legacy Windows clients (such as Internet Explorer (IE 5, IE 6, etc) or Netscape. Supported Windows 9x operating systems for legacy clients include Windows 95, Windows 98, Windows 2000, Windows NT the BrowserBox server must still be run on a modern system, but now you can connect to BrowserBox from legacy Windows 9x machines and browsers. Modern clients can still use the legacy endpoint but the experience is understandably jurassic.

<p align=center>
  <img src="readme-files/browserbox-running-in-windows-98-ie-5.jpg" alt="BrowserBox Legacy Client Running in IE 5 in Windows 98" title="BrowserBox Legacy Client Running in IE 5 in Windows 98" width=800">
</p>

---

## Meet `bbx`: Your BrowserBox Command Center

<a href="#meet-bbx-your-browserbox-command-center"><img width="1204" alt="BrowserBox v13 CLI - bbx" title="bbx" src="readme-files/v13-cli-screenshot.png" /></a>

The `bbx` CLI simplifies every aspect of BrowserBox management:

*   ✅ **Easy Installation & Updates:** `bbx install`, `bbx update`
*   💳 **License Management:** `bbx activate [number of seats]`, `bbx certify [product key]`
*   👩‍💻 **Multi-User Support:** Run BrowserBox for multiple users on a single machine.
*   🐳 **Docker Integration:** `bbx docker-run`
*   🧅 **Tor Anonymity:** `bbx tor-run`
*   ⚙️ **Core Operations:** `bbx run`, `bbx stop`, `bbx logs`, `bbx setup`
*   🌟 **And much more!** Run `bbx --help` for a full list of commands on your OS.

---

## Embed BrowserBox Anywhere

Integrate secure, remote browsing into your web applications using the `<browserbox-webview>` custom element. This Embedding API works with both **self-hosted** BrowserBox instances and **cloud instances** created via the [Cloud API](#cloud-api-ephemeral-sessions).

**Quick Start (self-hosted):**

1.  **Configure Server:** Set `ALLOWED_EMBEDDING_ORIGINS` on your BrowserBox server:
    ```bash
    export ALLOWED_EMBEDDING_ORIGINS="https://your-embedding-site.com"
    bbx run
    ```
2.  **Add to HTML:** Include the script and element in your webpage:
    ```html
    <script src="https://raw.githubusercontent.com/BrowserBox/BrowserBox/main/api/browserbox-webview.js"></script>
    <browserbox-webview login-link="https://your-browserbox-instance.com/login/abc123" width="800" height="600"></browserbox-webview>
    ```

**Quick Start (cloud API):**

```html
<script src="https://raw.githubusercontent.com/BrowserBox/BrowserBox/main/api/browserbox-webview.js"></script>
<browserbox-webview id="bbx" width="1024" height="768"></browserbox-webview>
<script>
  // Create a session via the Cloud API, then pass the login URL to the webview
  const res = await fetch('https://win9-5.com/api/v1/sessions', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer YOUR_API_KEY', 'Content-Type': 'application/json' },
    body: JSON.stringify({ minutes: 30 })
  });
  const { loginUrl } = await res.json();
  document.getElementById('bbx').setAttribute('login-link', loginUrl);
</script>
```

**Key `<browserbox-webview>` features:**
*   Full navigation control (URL bar, back/forward, reload, tabs)
*   Event listeners: `tabcreated`, `tabnavigated`, `tabclosed`, `faviconschange`
*   Methods: `navigate(url)`, `getTabCount()`, `closeTab(id)`, `callApi(method, params)`
*   Responsive resizing with automatic viewport scaling

For full Embedding API documentation, see the [browserbox-webview.js file](https://github.com/BrowserBox/BrowserBox/blob/main/api/browserbox-webview.js).

---

## Cloud API (Ephemeral Sessions)

The BrowserBox Cloud API lets you create on-demand, ephemeral cloud browser sessions without self-hosting. Purchase minute packs and use a REST API to manage sessions programmatically.

**How it works:**
1.  Purchase a minute pack (60, 300, or 1000 minutes) at [win9-5.com/pricing](https://win9-5.com/pricing/)
2.  Receive an API bearer token by email
3.  Create sessions via `POST /api/v1/sessions` — get a login URL
4.  Embed the login URL in `<browserbox-webview>` or open it directly

**Example:**

```bash
# Create a 30-minute session
curl -X POST https://win9-5.com/api/v1/sessions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"minutes": 30}'

# Response:
# { "sessionId": "abc123...", "loginUrl": "https://...", "minutes_allocated": 30, "balance_minutes": 270 }
```

**Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/api/v1/pricing` | List products and prices (public) |
| `POST` | `/api/v1/sessions` | Create a new browser session |
| `GET`  | `/api/v1/sessions/:id` | Get session status |
| `DELETE` | `/api/v1/sessions/:id` | End session, refund unused minutes |
| `GET`  | `/api/v1/balance` | Check remaining minutes |
| `POST` | `/api/v1/checkout` | Create a Stripe checkout for purchasing minutes |

Unused minutes are refunded when you delete a session early. Minutes never expire.

📖 **Full API documentation:** [win9-5.com/api](https://win9-5.com/api/)
🎮 **Live demo:** [win9-5.com/demo](https://win9-5.com/demo)
📧 **API support:** [api@browserbox.io](mailto:api@browserbox.io)

---

## Advanced Usage

*   **Secure Document Viewing:** Safely preview files without downloading them to the client device (Linux only).
*   **Developer Tools Access:** Inspect remote pages by right-clicking within the BrowserBox session.
*   **Tor & SSH Tunneling:** Enhance privacy and anonymity.

---

## License Compliance & Usage Data

BrowserBox requires a valid license for all deployments. We utilize usage data solely to ensure license compliance and for operational purposes. We never sell your data.
Please review our [Privacy Policy](https://dosaygo.com/privacy.txt.html) and [Terms of Service](https://dosaygo.com/terms.txt.html).

>[!IMPORTANT]
>A valid license unlocks all features, ensures ongoing support, and guarantees a secure, compliant solution.

---

## Frequently Asked Questions (FAQ)

**Q: Can I get an evaluation license?**
A: You can [Apply for a 7-Day Trial Here](https://browserbox.io).

**Q: Why is a license required for BrowserBox?**
A: Licenses fund development, updates, and support so we can keep BrowserBox reliable and secure.

**Q: Do you offer perpetual licenses (non-subscription, version-locked)?**
A: Yes, for enterprise clients with an Annual Contract Value (ACV) of $150K+. Please contact [sales@dosaygo.com](mailto:sales@dosaygo.com) for inquiries.

**Q: How does BrowserBox compare to other RBI solutions?**
A: BrowserBox uniquely combines enterprise-grade security, extensive cross-platform compatibility (including Docker and multiple OS), an easy-to-use embedding API, and a powerful CLI, all in one package.

**Q: What do I receive when I purchase a license?**
A: You'll get an email with a secure, one-time link to view your product key. This key is valid for the number of seats purchased (adjustable during checkout). This is the same as the number of people who will use BrowserBox in your product or organization. For high volume or to negotiate custom pricing reach out to us. 

**Q: How can I purchase more licenses or get volume discounts?**
A: Volume discounts are available for commercial licenses and are automatically applied on our payment page. For custom packages or questions, contact [sales@dosaygo.com](mailto:sales@dosaygo.com). Non-commercial licenses have a flat rate.

**Q: I may have used BrowserBox without a license in the past. How can I become compliant?**
A: We understand situations can be complex. Please contact [legal@dosaygo.com](mailto:legal@dosaygo.com) to discuss your situation and achieve compliance. We're here to help you get on the right track.

**Q: Where can I find more information or ask other questions?**
A: Visit [dosaygo.com](https://dosaygo.com) or email [sales@dosaygo.com](mailto:sales@dosaygo.com).

---

## Support

Need help? Our team is ready to assist.
*   **API & Technical Support:** [api@browserbox.io](mailto:api@browserbox.io)
*   **General Support:** [support@dosaygo.com](mailto:support@dosaygo.com)
*   **Sales & Licensing:** [sales@dosaygo.com](mailto:sales@dosaygo.com)
*   **GitHub Issues:** For bug reports or feature requests related to the open-source components or `bbx` tool.
*   **API Documentation:** [win9-5.com/api](https://win9-5.com/api/)

---

## About DOSAYGO

DOSAYGO (also known, due to an early incorporation typo, as DOSYAGO) is committed to building innovative and secure technology solutions. Our products include:
*   **BrowserBox:** Secure Remote Browser Isolation.
*   **DiskerNet:** Technology for creating offline archives of web content.

Visit us at [dosaygo.com](https://dosaygo.com).

---

## Copyright & Licensing

BrowserBox™ is &copy; 2018-2026 DOSAYGO Corporation USA. All rights reserved.
The `bbx` CLI tool and other specified components are under the [LICENSE.md](LICENSE.md) in this repository. You need a license agreement to use this product. Purchase licenses online at: https://dosaygo.com/commerce or reach out to sales@dosaygo.com to discuss your needs. The BrowserBox product requires a validly purchased license (either commercial for business and personal use, or non-commercial for public sector and non-profit). Your license comes with one or more license keys and a number of seats. 

---

<p align="center">
  <strong>Ready to secure your browsing?</strong><br>
  <a href="https://dosaygo.com/commerce">Get Your Commercial License</a> | <a href="https://dosaygo.com/noncommercial">Get Your Non-Commercial License</a> | <a href="mailto:sales@dosaygo.com?subject=Demo">Request a Demo</a>
</p>
