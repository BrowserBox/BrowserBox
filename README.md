# BrowserBoxPro

BrowserBoxPro is a powerful RBI (remote browser isolation) multiplayer (co-browsing) application that provides advanced streaming capabilities and a superior feature set for an enhanced browsing experience. With BrowserBoxPro, you can enjoy the benefits of professional remote browser isolation features in every usage scenario. This guide provides step-by-step instructions for installing and running BrowserBoxPro, along with system requirements and troubleshooting tips.

## Latest News

Check out the latest articles about BrowserBox, web automation and RBI from our [Company Blog](https://blog.dosyago.com):

- [Tunnelling over SSH - You're guide to using Localhost Certificates and SSH port-forwarding to run BrowserBox Pro on a remote machine without a domain name, using SSH tunneling](https://blog.dosyago.com/tutorials/2023/06/17/tunneling-browserbox-pro-over-SSH-complete-guide-to-using-port-forwarding-to-run-RBI-on-a-router.html)
- [Dosyago's BrowserBox - A Revolutionary Leap in Web Security](https://blog.dosyago.com/2023/05/29/future-proofing-online-security-with-dosyago-browserbox.html)
- [Dispelling the Falsehoods - The Dawn of BrowserBox and Contemporary Web Safety](https://blog.dosyago.com/2023/05/29/dispelling-falsehoods-dawn-of-browserbox-and-true-corporate-web-safety.html)

## Key Features

- **Advanced Streaming**: BrowserBoxPro offers advanced streaming capabilities, allowing you to seamlessly browse websites, stream videos, and access web applications with superior performance.
- **Enhanced Feature Set**: Enjoy a wide range of enhanced features that enhance your browsing experience, including improved security, customizable settings, and optimized resource management.
- **Superior Performance**: BrowserBoxPro delivers exceptional performance, ensuring smooth and responsive browsing even for resource-intensive websites and applications.
- **Flexible Usage**: Whether you are a non-commercial user or using BrowserBoxPro for commercial purposes, you can benefit from the full range of pro features to enhance your browsing capabilities.

## Installation and Features Guide

**🌟 Video Installation Guide for Pro: [https://youtu.be/cGUJCCPDWNE](https://youtu.be/cGUJCCPDWNE)**

For detailed information and progress updates, please refer to the [official documentation](https://github.com/dosyago/BrowserBox).

## Table of Contents

- [Installation](#installation)
- [Applications and Features](#applications-and-features)
- [Pro Features](#pro-or-regular)
- [Commercial Options](#commercial-options)
- [Contributing](#contributing)
- [:balance_scale: Licensing](#balance_scale-licensing)

## Installation

Follow these instructions to install BrowserBoxPro on your system.

### Initial Machine Setup

Before installing BrowserBoxPro, ensure that your system meets the following requirements:

- Debian VPS with 1 cores, 1 GB RAM, and 25 GB SSD (e.g. Nanode from Linode)
- At least 5 Mbps internet connection
- A public hostname with a DNS A record pointing to your VPS's IP address, or localhost certificates installed on your local machine (for example using [mkcert](https://github.com/FiloSottile/mkcert)

First, update your distribution:

`apt update && apt -y upgrade`

And install a few basic tools:

`apt install curl git wget`

Now, prepare the machine by following these steps:

1. Create a new user to operate BrowserBoxPro:
   ```
   adduser pro
   ```

2. Disable the password for the newly created user:
   ```
   usermod -L pro
   ```

3. Create a new group for sudo privileges:
   ```
   addgroup sudoers
   ```

4. Add the following line to the sudoers file to avoid entering a password for sudo operations:
   ```
   %sudoers ALL=(ALL) NOPASSWD:ALL
   ```
   Use the `visudo` command to edit the sudoers file.

5. Grant sudo privileges to the user:
   ```
   usermod -G sudoers pro
   ```

Switch to the `pro` user by executing the following command:
```
sudo -u pro bash
```

### Installation Process

Follow these steps to install BrowserBoxPro:

1. Clone the BrowserBoxPro repository:
   ```
   git clone https://github.com/dosyago/BrowserBoxPro
   ```

2. Navigate to the cloned repository:
   ```
   cd BrowserBoxPro
   ```

3. Run the global installation script, replacing `<domain_name>` with your domain name that points to the machine you're setting up:
   ```
   ./deploy-scripts/global_install.sh <domain_name>
   ```

4. Start the main service on port 8080 and generate the login link:
   ```
   setup_bbpro --port 8080
   ```

5. Launch BrowserBoxPro:
   ```
   bbpro
   ```

During the installation process, BrowserBoxPro will automatically install the required dependencies and configure the necessary settings.

## Applications and Features

BrowserBoxPro offers a wide array of features and potential applications, making it versatile for various use cases. Here are some of the applications and features provided by BrowserBoxPro:

### Product Space Applications:

- Remote browser isolation for enhanced security, risk mitigation, and privacy.
- Co-browsing with zero download requirements for collaborative and social interaction.
- A delivery platform for a zero-download web scraping app compatible with any device format.
- An alternative platform for browser extensions with an associated app store.
- A secure online "internet cafe" with advanced privacy features.
- An alternate solution to VPNs and DNS blocklists.
- Mitigation of email attachment threats via Content Disarm & Reconstruction (CDR) and automatic opening of links and attachments in the remote browser or its included secure document viewer (Pro only).
- A user-friendly UI that allows clients to perform 3rd-party processes without leaving your website.
- A fully customizable online hosted web browser that provides an alternative to downloadable browsers.
- The ability to record web app interactions to document bugs by capturing the event stream and viewport.
- A mechanism to create visual "How-To" guides illustrating key user stories.

### Internal Tooling Applications:

- A tool for human-in-the-loop intervention to resolve stuck browser automation jobs and identify "selector drift" and script-page mismatch issues.
- A robust web proxy to seamlessly integrate 3rd-party processes lacking APIs.
- An interactive console to inspect, observe, and interact with browser automation tasks.
- A browser that can be automated, offering effective evasion of bot detection mechanisms that target pure headless Chrome.
- A scriptable console and interactive simulator for automation tasks, creating an intuitive feedback loop.

### Tech and Framework Applications:

- An open web `<WebView>` tag.
- An `<iframe>` without cross-origin restrictions.
- A 'head' for headless browsers.

For a comprehensive list of features and their availability in BrowserBoxPro, refer to the feature table below.

## Features of BrowserBox Pro

BrowserBox Pro offers an array of advanced features that set it apart from other versions of remote browser isolation. With fully open source-code, non-commercial use for free, frequent updates and cutting-edge technology, BrowserBox Pro provides an enhanced browsing experience with superior rendering, top-tier graphics, and minimal lag. Here are the key features of BrowserBox Pro:

- Advanced streaming technology and variable bitrate innovations for smoother browsing experience
- Superior rendering and graphics capabilities
- Structured, weekly update schedule with quarterly major improvements
- Exclusive advanced features not available in other versions
- Commercial use availability with Individual server and Self-hosted options
- Advanced security mechanisms and privacy safeguards
- Customizable browser UI
- Docker image compatibility for easy deployment
- Cloud and platform independence
- Multi-user security features (Pro exclusive)
- Auto-scaling and resource control (Pro exclusive)
- WebRTC/WebSocket viewport streaming (Pro exclusive)
- Fastest-path lag reduction (Pro exclusive)
- Built-in multiplayer mode with chat (Pro exclusive)
- Puppeteer scripting REPL console (Pro exclusive)
- Embeddable inside `<iframe>` (Pro exclusive)
- Kiosk mode (Pro exclusive)
- Adobe Flash Player compatibility (Pro exclusive)
- User-friendly API (Pro exclusive)
- SSH tunneling (Pro exclusive)

These features make BrowserBox Pro the ideal choice for businesses and organizations looking to enhance their cybersecurity, privacy, and browsing capabilities.

For more information about commercial options and licensing, please refer to the relevant sections below.

## Licensing

BrowserBox Pro is a commercial product that generates revenue for US-based DOSYAGO corporation via the sale of Commercial Licenses and Bespoke Customizations and Deployments (see [this page for single licenses](https://dosy.gumroad.com) and [this pages for discounts on volume purchases](https://dosyago.com). However, you can use BrowserBox Pro for free for non-commercial use cases. Government and public institutions, non-profits, private researchers and individuals are covered by this protection when their use is done without any anticipation of commercial application. From time to time, our non-commercial users may desire an license arrangement different to the one provided by the standard [Polyform Non-Commercial License 1.0](LICENSE.md) to suit their needs both now and in future, and such terms may be approved and negotiated on a case-by-case basis typically for a fee or other remunerative or protective arrangement. 

BrowserBox Pro offers flexible licensing options to cater to different usage scenarios. As previously mentioned, BBPro software is available for free for non-commercial use under the PolyForm NonCommercial license. This allows individuals and non-profit organizations to enjoy the benefits of BrowserBox Pro without any licensing fees when using the software without any participation in or anticipation of commercial application. The PolyForm NonCommercial license ensures that the software is used strictly for non-commercial purposes.

In most cases, for commercial use, DOSYAGO offers commercial BrowserBox Pro licenses that can be purchased through the Dosyago website at [https://dosyago.com](https://dosyago.com) - *please note that we cannot transact with sanctioned countries, entities or individuals.* These commercial licenses provide businesses around the world with the rights to fully customize and integrate BrowserBox Pro into their operations, as well as incorporate it into customer-facing products, on a seat-per-role, or seat-per-customer basis.

When acquiring a commercial license, customers have the option to choose from different licensing models, including perpetual or yearly licenses. Dosyago offers volume discounts for larger purchases, enabling businesses to scale their usage of BrowserBox Pro according to their needs. The specific details of minimum volumes and pricing can be obtained [on our website](https://dosyago.com).

By obtaining a commercial license, businesses gain the freedom to tailor BrowserBox Pro to their specific requirements and integrate it seamlessly into their workflows. This empowers organizations to leverage the advanced features and capabilities of BrowserBox Pro while maintaining full control over its customization and usage.

Whether it's for non-commercial or commercial purposes, BrowserBox Pro provides a range of licensing options to accommodate different user needs and ensure a secure and powerful browsing experience.

## Elevate Your Cybersecurity with BrowserBoxPro

BrowserBoxPro is more than just a web browser. It's a security fortress, a vanguard for your data, and an ally to your privacy. Whether you are a cybersecurity professional, part of an IT department in a large corporation, or a government entity, BrowserBoxPro can help you safeguard sensitive data in an interconnected digital landscape.

What sets BrowserBoxPro apart is its cutting-edge technology, superior browsing experience, advanced security features, customization capabilities, and regular updates to protect against emerging threats. With its proprietary software and scalable infrastructure, BrowserBoxPro can adapt to the unique needs of your organization, regardless of its size or industry.

Our dedicated support and maintenance team is committed to ensuring your satisfaction. BrowserBoxPro delivers not just a product, but a partnership.

Maximize your investment with our commercial options and unlock the full potential of BrowserBoxPro. Whether you are an individual server operator or a large corporation seeking a self-hosted solution, we have you covered. As part of our commercial package, you gain access to the premium features exclusive to BrowserBoxPro, along with the option for source-code access if required.

Take the next step in fortifying your cybersecurity. Visit our website today to secure your commercial license and start your journey with BrowserBoxPro. Let's navigate the challenging cybersecurity landscape together.

## Copyright

This project is copyright The Dosyago Corporation and Cris Stringfellow 2023. All rights reserved.

For detailed information and progress updates, please refer to the [official documentation](https://github.com/dosyago/BrowserBox).
