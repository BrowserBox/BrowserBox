# [BrowserBox Regular](https://github.com/crisdosyago/BrowserBox) 
[![Source Lines of Code](https://sloc.xyz/github/crisdosyago/BrowserBox)](https://sloc.xyz) [![Source Lines of Code in Pro Version](https://img.shields.io/badge/%22Pro%22%20Total%20lines-78K-hotpink)](#bb-pro-vs-regular--comparison-table) [![PRs welcome](https://camo.githubusercontent.com/b0ad703a46e8b249ef2a969ab95b2cb361a2866ecb8fe18495a2229f5847102d/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f5052732d77656c636f6d652d627269676874677265656e2e737667)](https://github.com/crisdosyago/BrowserBox/pulls) [![npm](https://img.shields.io/npm/v/viewfinder-regular)](https://npmjs.com/package/viewfinder-regular) [![npm](https://img.shields.io/npm/dt/viewfinder-regular)](https://npmjs.com/package/viewfinder-regular) [![Docker Pulls](https://img.shields.io/docker/pulls/dosyago/viewfinder-regular)](https://hub.docker.com/r/dosyago/viewfinder-regular) [![Binary downloads](https://img.shields.io/github/downloads/crisdosyago/BrowserBox/total?label=binary%20downloads)](https://github.com/crisdosyago/BrowserBox/releases/latest) [:star:&nbsp;:eyes:](https://github.com/dosyago/Browserbox/stargazers)

**Clones per month**: 1000

## Introduction

**BrowserBox Regular** is an open-source (AGPL-3.0), powerful full-stack web browser component that runs on a remote server. It provides a UI that can be embedded on the web, making it an unrestricted browser within a browser. Formerly known as [:camera: ViewFinder](https://github.com/cris691/ViewFinder), it's now AGPL-3.0 licensed and a [Pro Version](https://github.com/dosyago/BrowserBoxPro) is available for non-commercial use.

## Key Features

- More sandboxed and less restricted than traditional `<iframe>` elements.
- Facilitates the construction of applications that require cross-origin access.
- Entire stack written in JavaScript for ease of extension and customization.

## Similar Products

- CloudFlare remote browsers
- [neko](https://github.com/m1k1o/neko): A self-hosted virtual browser running in docker using WebRTC.
- Menlo Security Web and Browser isolation platform
- McAfee browser isolation
- Hyperbeam embeddable multiplayer browsers and apps
- Ericom browser isolation
- Zscaler zero trust web browsing 
- Symantec Browser isolation 

## Table of contents

- [Installation](#installation)
- [Applications](#applications)
- [Pro vs Regular](#pro-or-regular)
- [Commercial Options](#commercial-options)
- [Contributing](#contributing)
- [:balance_scale: Licensing](#balance_scale-licensing)

For detailed information and progress updates, please refer to the [official documentation](https://github.com/dosyago/BrowserBox).

# Installation and Features Guide

## Setup Guide

### Pre-requisites

Ensure that Chrome and its respective system dependencies are installed. A reliable way to verify this is by installing [puppeteer](https://github.com/puppeteer/puppeteer). Note: For Debian installations, Chrome and its dependencies are managed automatically.

### Installation Using Docker

For Docker users, our recommended image from the BB Docker Hub can be utilized.

### Installation Without Docker

We provide the [binary release](https://github.com/crisdosyago/BrowserBox/releases/tag/v3.8.2) and the [NPM package](https://www.npmjs.com/package/viewfinder-regular). These can be imported, installed globally, or sourced.

The binary releases are ideal for local machines as they do not support transmitting audio over the network. Therefore, you will only hear audio if the program is run locally and Chrome Headless is directing sound to your local machine's speakers.

For running the program on a remote machine, consider using the [Docker image](https://hub.docker.com/r/dosyago/viewfinder-regular). This method is user-friendly and requires minimal setup. However, it is advisable to execute the program using the `run_docker` script mentioned below to guarantee proper run settings.

You can also run the program by cloning and installing the repository or via NPM, but these methods are most convenient on a Debian flavored distribution because BB primarily uses apt to install dependencies.

If you're using a Debian-based system, follow the instructions below.

### Cloning the Repository and Installing Dependencies:

```shell
$ git clone https://github.com/dosyago/BrowserBox.git
$ cd BrowserBox
$ npm i 
$ npm test
```

### Installing from NPM:

```shell
$ npx viewfinder-regular@latest
$ npm i --save viewfinder-regular
$ npm i -g viewfinder-regular
$ vf
```

**Note**: The NPM global binary is named 'vf'.

### Using DockerHub:

```shell
$ docker pull dosyago/viewfinder-regular:latest
$ git clone https://github.com/dosyago/BrowserBox.git
$ cd BrowserBox/
$ ./scripts/run_docker.sh
```

### Post-installation:

Regardless of the chosen installation method, you can connect to the application by opening the following address in a regular browser:

`http://<host_ip>:8002/login?token=<token>`

For the Docker image, the token is `token2`. For the NPM and repository versions, the token is `bhvNDh6XYZ`.

HTTPS can be enabled by adding certificates (such as from LetsEncrypt or mkcert for localhost) into the `$HOME/sslcerts/` directory when running via Node. For enabling HTTPS with Docker, please refer to the detailed instructions below.

### Enabling HTTPS on Docker:

To enable HTTPS, you have two options: 
- Rebuild a Docker image that includes your certificates.
- Use a HTTPS reverse-proxy like nginx.

To rebuild a Docker image with your certificates, use the script `./scripts/build_docker.sh`. You need to modify the Dockerfile to copy your certificates. 

If you prefer to use a reverse-proxy, position it in front of your Docker instance and handle the certificates outside the container.

## Troubleshooting

If you encounter issues, execute the `./scripts/setup_machine.sh` script and retry the installation.

## Applications and Features

BrowserBox offers a wide array of features and potential applications, making it versatile for various use cases. It provides solutions in the product space, internal tooling space, and tech and framework space.

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

## Project Progress & Future Roadmap 

BrowserBox aspires to achieve feature parity with desktop and mobile browsers while also innovating with new features like co-browsing. Below is an overview of our progress towards these goals. Note that the ⭐ icon denotes features exclusive to BrowserBox Pro.

For a detailed list of features, refer to the following tables.

## Choosing Between BrowserBox Pro and Regular

**What sets BrowserBox Pro apart from the Regular version?**

The defining factor separating BrowserBox Pro from the Regular version lies in the advanced features and frequent updates that Pro brings to the table.

For instance, Pro users can enjoy superior rendering, top-tier graphics, and minimal lag, courtesy of the advanced streaming technology and variable bitrate innovations we've integrated. This means you can expect a smoother, more refined browsing experience with BrowserBox Pro.

While some of our Pro features trickle down to the Regular version over time, certain advanced features will always be exclusive to Pro. Moreover, Pro offers a structured, weekly update schedule, with major improvements rolled out quarterly. In contrast, the Regular version maintains a slower and somewhat irregular release cycle.

A key point to note: while the Regular version is source-available (with the source code provided in this repository), BrowserBox Pro is currently a proprietary, closed-source software available exclusively for commercial use, either for Individual server usage or for deployment in a Self-hosted package. 

For more details on these [commercial options](#commercial-options), continue reading below and check out the feature comparison table between Regular and Pro versions.

### Comparing BrowserBox Pro and Regular — Feature Table

| Feature                                       | Regular            | Pro                |
|-----------------------------------------------|--------------------|--------------------|
| Standard browser functionalities              | :heavy_check_mark: | :heavy_check_mark: |
| Advanced security mechanisms                  | :heavy_check_mark: | :heavy_check_mark: |
| Privacy safeguards                            | :heavy_check_mark: | :heavy_check_mark: |
| Customizable browser UI                       | :heavy_check_mark: | :heavy_check_mark: |
| Docker image compatibility                    | :heavy_check_mark: | :heavy_check_mark: |
| Cloud and platform independence               | :heavy_check_mark: | :heavy_check_mark: |
| Multi-user security features                  |                    | :heavy_check_mark: |
| Auto-scaling and resource control             |                    | :heavy_check_mark: |
| WebRTC/WebSocket viewport streaming           |                    | :heavy_check_mark: |
| Fastest-path lag reduction                    |                    | :heavy_check_mark: |
| Built-in multiplayer mode with chat           |                    | :heavy_check_mark: |
| Puppeteer scripting REPL console              |                    | :heavy_check_mark: |
| Embeddable inside `<iframe>`                  |                    | :heavy_check_mark: |
| Kiosk mode                                    |                    | :heavy_check_mark: |
| Adobe Flash Player compatibility              |                    | :heavy_check_mark: |
| User-friendly API                             |                    | :heavy_check_mark: |
| SSH tunneling                                 |                    | :heavy_check_mark: |

## Licensing and Commercial Options

BrowserBox Pro is a commercial product provided by the [Dosyago Corporation](https://github.com/dosyago). It comes in two variations: Individual and Self-hosted.

**Self-hosted**

Our Self-hosted option includes the BB Pro software object-files and the option for source-code access, if required. This version is tailored to meet the needs of small to medium businesses (SMBs) and enterprise-level organizations.

If you're considering commercial use, the Self-hosted option is your go-to choice.

To proceed with the Self-hosted option, you need a commercial license. As of now, we are offering perpetual licenses. Visit [our website](https://dosyago.com) for pricing details.

## Elevate Your Cybersecurity with BrowserBox Pro

**Why Should You Choose BrowserBox Pro?**

BrowserBox Pro isn't just another web browser. It's a security fortress, a vanguard for your data, and an ally to your privacy. As cybersecurity professionals, IT departments in large corporations, and government entities, you are constantly faced with the challenge of safeguarding sensitive data in an increasingly interconnected digital landscape. BrowserBox Pro is your steadfast partner in this endeavor.

What sets us apart? BrowserBox Pro is built on a foundation of cutting-edge technology that empowers you with not just a superior browsing experience but also next-level security features and customization capabilities. Get regular updates to keep your digital environment up-to-date and protected from emerging threats. With its proprietary software and scalable infrastructure, BrowserBox Pro can adapt to your unique needs, regardless of your organization's size or industry.

Moreover, our dedicated support and maintenance team is committed to ensuring your satisfaction. We understand the criticality of your work, and we are here to support you every step of the way. BrowserBox Pro doesn't just provide a product; it delivers a partnership.

**Maximize Your Investment with Our Commercial Options**

By choosing our commercial licensing options, you unlock the full potential of BrowserBox Pro. Whether you're an individual server operator or a large corporation seeking a self-hosted solution, we've got you covered. As part of our commercial package, you gain access to the premium features exclusive to BrowserBox Pro, along with the option for source-code access should you require it. Make the most of your cybersecurity investment with BrowserBox Pro.

**Take the Next Step**

Take your cybersecurity to the next level. Harness the power of BrowserBox Pro to fortify your digital infrastructure, secure your sensitive data, and empower your team with the advanced features they need to succeed. Join the ranks of our satisfied clients who trust BrowserBox Pro to navigate the challenging cybersecurity landscape.

Visit [our website](https://dosyago.com) today to secure your commercial license and start your journey with BrowserBox Pro. There's no better time than now to bolster your cybersecurity posture. Let's take on the future, together.

## &copy; Copyright 

This project is copyright The Dosyago Corporation and Cris Stringfellow 2023. All rights reserved.



