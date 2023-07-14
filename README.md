# BrowserBoxPro

BrowserBoxPro is a powerful RBI (remote browser isolation) multiplayer (co-browsing) application that provides advanced streaming capabilities and a superior feature set for an enhanced browsing experience. With BrowserBoxPro, you can enjoy the benefits of professional remote browser isolation features in every usage scenario. This guide provides step-by-step instructions for installing and running BrowserBoxPro, along with system requirements and troubleshooting tips.

## Table of Contents

- [BrowserBoxPro](#browserboxpro)
  - [Latest News](#latest-news)
  - [Key Features](#key-features)
  - [Installation and Features Guide](#installation-and-features-guide)
  - [Installation](#installation)
    - [Initial Machine Setup](#initial-machine-setup)
    - [Installation Process](#installation-process)
  - [Applications and Features](#applications-and-features)
    - [Product Space Applications](#product-space-applications)
    - [Internal Tooling Applications](#internal-tooling-applications)
    - [Tech and Framework Applications](#tech-and-framework-applications)
  - [Features of BrowserBox Pro](#features-of-browserbox-pro) 
  - [Licensing](#licensing)
    - [For open-source use](#for-open-source-use)
    - [For non-commercial use](#for-non-commercial-use)
    - [For commercial use](#for-commercial-use)
    - [Purchasing a commercial license](#purchasing-a-commercial-license)
        - [Perpetual or Yearly](#perpetual-or-yearly)
        - [Volume Discounts](#volume-discounts)
        - [Support and Customization](#support-and-customization)
    - [Hardware Appliance (OEM) Licensing](#hardware-appliance-oem-licensing)
  - [Pricing](#pricing)
  - [Elevate Your Cybersecurity with BrowserBoxPro](#elevate-your-cybersecurity-with-browserboxpro)
  - [Sanctions Compliance](#sanctions-compliance)
  - [Copyright](#copyright)


## Latest News

Check out the latest articles about BrowserBox, web automation and RBI from our [Company Blog](https://blog.dosyago.com):

- [Updated Pricing](https://dosyago.com) - now with even more tiers for smaller use cases!
- [BrowserBox Pro Goes Open Source with Multiple Licenses
](https://blog.dosyago.com/2023/06/26/browserbox-pro-goes-open-source-with-multiple-licenses.html)
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

## Installation

Follow these instructions to install BrowserBoxPro on your system.

### Initial Machine Setup

Before installing BrowserBoxPro, ensure that your system meets the following requirements:

- Debian VPS with 1 cores, 1 GB RAM, and 25 GB SSD (e.g. Nanode from Linode)
- At least 5 Mbps internet connection
- A public hostname with a DNS A record pointing to your VPS's IP address, or localhost certificates installed on your local and remote machine (for example using [mkcert](https://github.com/FiloSottile/mkcert))

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

3. Run the global installation script, replacing `<domain_name>` with your domain name that points to the machine you're setting up (if you want to use it without a domain name, just use localhost here for the domain name, but you'll still need to copy the correct mkcert localsthost certificates to $HOME/sslcerts later):
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

BrowserBoxPro is licensed separately under the following licenses:

- [GNU Affero General Public License v3 (or later)](LICENSES/AGPL-3.0.txt)
- [Polyform Non-Commercial License 1.0](LICENSES/PolyForm-Noncommercial-1.0.0.md)
- [BrowserBox Pro perpetual commercial license](LICENSES/LicenseRef-BBP-Commercial-Perpetual.md)
- [BrowserBox Pro subscription commercial license](LICENSES/LicenseRef-BBP-Commercial-Subscription.md)

#### What does this mean for me?

##### Are you using BrowserBox Pro as it ships?

  You may use BrowserBox Pro under the terms of the AGPLv3 (or later).

##### Are you modifying BrowserBox Pro or developing software that uses BrowserBox Pro and willing to license those changes under the AGPL?

  You may use BrowserBox Pro under the terms of the AGPLv3 (or later).

##### Are you using BrowserBox Pro, modifying BrowserBox Pro, or developing software that uses BrowserBox Pro in a non-commercial capacity but do not wish to comply with the license terms of the AGPLv3?

  You may use BrowserBox Pro under the terms of the Polyform Non-Commercial License 1.0.0.

##### Are you using BrowserBox Pro, modifying BrowserBox Pro, or developing software that uses BrowserBox Pro in a commercial capacity but do not wish to comply with the license terms of the AGPLv3?

  You may purchase a [perpetual or subscription based commercial license](#purchasing-a-commercial-license).

### Purchasing a commercial license

Purchasing takes a minute. Our purchasing form accepts credit cards, bank transfers and many other forms of payment. Once purchased, you'll receive a commercial license PDF including your agreement and valid Order receipt and you will be all set to use BrowserBox Pro in your commercial applications. With the purchase of a commercial license:

- You may use BrowserBox Pro in as many commercial applications you like.
- You may use BrowserBox Pro in your own commercial applications and products. For example: premium VPN services, RBI systems, system integration portals, web automation and scraping products, educational platforms, and other products and apps.
- Customers and users of your products do not need to purchase their own license &mdash; so long as they are not developing their own commercial products with BrowserBox Pro.

*Please note that we cannot transact with sanctioned countries, entities or individuals.* 

Commercial Licenses are priced per seat. A seat is someone who uses the BrowserBox Pro system, either in an internal application (like secure email attachment viewing), or an external customer-facing application (such as a customer of your remote browser isolation product). Commercial Licenses come in two flavors:

- **Perpetual License** This is a license to use the version of BrowserBox Pro you purchase forever. The version can be updated to the latest via purchase of yearly licenses.
- **Yearly License** This is a license to use the latest version available within the 12-months from your purchase. It can be manually renewed every year, or you can subscribe so it renews automatically.

Commercial Licenses are available in two sizes:

- **Individual License** Purchasable at [our GumRoad site](https://dosyo.gumroad.com). This is suitable for individuals or small teams working on commercial projects who don't want to use the AGPLv3.
- **License Pack** Available in multiple sizes, from the small to the truly epic, with commensurately epic discounts at scale. These are purchasable at [our main website](https://dosyago.com).

By obtaining a commercial license, you gain the freedom to tailor BrowserBox Pro to your specific requirements and integrate it seamlessly into your workflow. This empowers organizations to leverage the advanced features and capabilities of BrowserBox Pro while maintaining full control over its customization and usage. 

Support tiers and customization may be separately negotiated and purchased. To discuss your needs, please [reach out to our helpful support team here](mailto:support@dosyago.com?subject=BrowserBox%20Pro).

### Hardware Appliance (OEM) Licensing

Are you an OEM and want to deploy BBPro on a hardware device that you sell to your customers? [Contact us for special access to Appliance License pricing with Volume Discounts](mailto:sales@dosyago.com?subject=OEM%20License). This pricing sheet and terms are tailored to suit OEM's delivering security products for business and industry. Please note that if you are supplying government or other non-commercial users you cannot "pass through" DOSYAGO's non-commercial license to your customers without licensing a Commercial license from us. 

### Sanctions Compliance

Unfotunately if you or your company are an OFAC sanctioned entity or other entity sanctioned by the US Government (e.g. designated on OFAC's SDN List, BIS's DPL or Entity List, DDTC's DPL, or on the FBI's various lists, among others) we are unable to offer you a license of any form. Please note that in some cases we may conduct necessary checks to ensure sanctions compliance. 

### Licensing Summary 

BrowserBox Pro offers flexible licensing options to cater to different usage scenarios. As previously mentioned, BBPro software is available for free for non-commercial use under the PolyForm NonCommercial license. This allows individuals and non-profit organizations to enjoy the benefits of BrowserBox Pro without any licensing fees when using the software without any participation in or anticipation of commercial application. The PolyForm NonCommercial license ensures that the software is used strictly for non-commercial purposes.

Whether it's for non-commercial or commercial purposes, BrowserBox Pro provides a range of licensing options to accommodate different user needs and ensure a secure and powerful browsing experience.

-----

## Pricing

See [our website](https://dosyago.com) and [our GumRoad](https://dosy.gumroad.com) for accurate latest pricing or [reach out to us](mailto:sales@dosyago.com?subject=Pricing), but here is a summary below:

| License Type | Quantity | Price Per Unit/Pack | Includes |
| :----------: | :------: | :-----------------: | :------ |
| Yearly | Up to 1 | $84/seat/year | <ul><li>Purchase from 1 to 1 million licenses</li><li>Each license is valid for 1 year</li><li>Volume discounts for multiple licenses</li><li>Source code access</li><li>Use in customer-facing products or internally</li><li>Email support</li><li>Additional support tiers purchasable</li><li>Customize yourself or contract us</li></ul> |
| Yearly | 2-50 | $64.92 | Same as above |
| Yearly | 51-500 | $46.25 | Same as above |
| Yearly | 501-5000 | $35.58 | Same as above |
| Yearly | 5001-100000 | $10.67 | Same as above |
| Yearly | 100001+ | $9.99 | Same as above |
| Perpetual | 10-pack | $1,947.60 | <ul><li>Use forever</li><li>Email support for 1 year</li><li>Optionally buy more support</li><li>Use in customer-facing products or internally</li><li>Customize source code yourself, or contract us</li></ul> |
| Perpetual | 100-pack | $13,875.00 | Same as above |
| Perpetual | 10,000-pack | $320,100.00 | Same as above |

**Notes:**
- *Perpetual Packs contain multiple seats. For example, the 10-pack contains 10 licenses.*
- *Each 'seat' represents a concurrent user.*

## Elevate Your Cybersecurity with BrowserBoxPro

BrowserBoxPro is more than just a web browser. It's a security fortress, a vanguard for your data, and an ally to your privacy. Whether you are a cybersecurity professional, part of an IT department in a large corporation, or a government entity, BrowserBoxPro can help you safeguard sensitive data in an interconnected digital landscape.

What sets BrowserBoxPro apart is its cutting-edge technology, superior browsing experience, advanced security features, customization capabilities, and regular updates to protect against emerging threats. With its proprietary software and scalable infrastructure, BrowserBoxPro can adapt to the unique needs of your organization, regardless of its size or industry.

Our dedicated support and maintenance team is committed to ensuring your satisfaction. BrowserBoxPro delivers not just a product, but a partnership.

Maximize your investment with our commercial options and unlock the full potential of BrowserBoxPro. Whether you are an individual server operator or a large corporation seeking a self-hosted solution, we have you covered. As part of our commercial package, you gain access to the premium features exclusive to BrowserBoxPro, along with the option for source-code access if required.

Take the next step in fortifying your cybersecurity. Visit our website today to secure your commercial license and start your journey with BrowserBoxPro. Let's navigate the challenging cybersecurity landscape together.

## Copyright

This project is copyright The Dosyago Corporation and Cris Stringfellow 2023. All rights reserved.

For detailed information and progress updates, please refer to the [official documentation](https://github.com/dosyago/BrowserBox).
