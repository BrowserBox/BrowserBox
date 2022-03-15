<p align=center><a href=https://dosyago.com target=_blank><img src=https://github.com/crisdosyago/BrowserBox/raw/boss/.github/26881_DOSY_PP-01.png width=61.8%></a></p>

# [BrowserBox](https://github.com/crisdosyago/BrowserBox) Regular · [![Source Lines of Code](https://sloc.xyz/github/crisdosyago/BrowserBox)](https://sloc.xyz) [![PRs welcome](https://camo.githubusercontent.com/b0ad703a46e8b249ef2a969ab95b2cb361a2866ecb8fe18495a2229f5847102d/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f5052732d77656c636f6d652d627269676874677265656e2e737667)](https://github.com/crisdosyago/BrowserBox/pulls) [![npm](https://img.shields.io/npm/v/viewfinder-regular)](https://npmjs.com/package/viewfinder-regular) [![npm](https://img.shields.io/npm/dt/viewfinder-regular)](https://npmjs.com/package/viewfinder-regular) [![Docker Pulls](https://img.shields.io/docker/pulls/dosyago/viewfinder-regular)](https://hub.docker.com/r/dosyago/viewfinder-regular) [![Binary downloads](https://img.shields.io/github/downloads/crisdosyago/BrowserBox/total?label=binary%20downloads)](https://github.com/crisdosyago/BrowserBox/releases/latest)

**BrowserBox** is a full-stack component for a web browser that runs on a remote server, with a UI you can embed on the web.

- **Powerful:** BrowserBox lets your provide controllable access to web resources in a way that's both more sandboxed than, and less restricted than, traditional web `<iframe>` elements. 
- **General:** Build [applications](#applications) that need cross-origin access, while delivering complex user stories that benefit from an encapsulated browser abstraction. Since the whole stack is written in JavaScript you can easily extend it to suit your needs.
- **Unprecendented:** The technology that puts unrestricted browser capabilities within reach of a web app has never before existed in the open. 

[Get ideas for how you can use BrowserBox in your own project](#applications).

--------------------------------------
# Table of contents

- [Installation](#installation)
- [Applications](#applications)
- [Progress & Roadmap](#progress--roadmap)
- [Pro or Regular?](#pro-or-regular)
  * [Pro vs Regular Comparison Table](#vf-pro-vs-regular--comparison-table)
- [Commercial Options](#commercial-options)
- [Motivation](#motivation)
- [Stats](#stats)
- [FAQ](#faq)
- [Other sections - coming soon](#other-sections---coming-soon)
- [Contributing](#contributing)
- [:balance_scale: Licensing](#balance_scale-licensing)
- [&copy; Copyright](#copy-copyright)

--------------------------------------

## Installation

**Pre-install Requirements**

You need to have Chrome installed, and whatever dependencies your system needs for that. A good way to ensure you're starting from a good place is to install [puppeteer](https://github.com/puppeteer/puppeteer).

*Also just a note: don't try installing it using the root user as some of the tools that we use such as pm2 do not work reliably with root.*

**With containers**

If you want to use Docker, the BB docker hub image is your best bet. 

**Without containers**

You can use a [binary release](https://github.com/crisdosyago/BrowserBox/releases/tag/v3.8.2) or the [NPM package](https://www.npmjs.com/package/viewfinder-regular) and either require/import it or install as a global, or source.

Binary releases are best for a local machine, because they don't support sending sound over the network, so you'll only hear sound if you run it locally and Chrome headless is sending sound to your local machine speakers directly.

If you want to run it on a remote machine, the [Docker image](https://hub.docker.com/r/dosyago/viewfinder-regular) is the easier way to get set up, since it requires no configuration or install (but it's best to run it with the run_docker script indicated below to ensure the correct run settings). 

You can also easily run it from cloning and installing the repository or via NPM, but those options are going to be easiest on a Debian flavor distribution as BB mostly uses apt to install dependencies.

So you're on a Debian flavor then just dive right in below.

**Clone the repo and install dependencies:**

*Also just a note: don't try installing it using the root user as some of the tools that we use such as pm2 do not work reliably with root.*

```shell
$ git clone https://github.com/crisdosyago/BrowserBox.git
$ cd BrowserBox
$ npm i 
$ ./scripts/setup_machine.sh
$ npm test
```

or, **run**, **depend on** or **globally install** it from NPM:

```shell
$ npx viewfinder-regular@latest
$ npm i --save viewfinder-regular
$ npm i -g viewfinder-regular
$ vf
```

*Note the vf NPM global binary is called 'vf'*

or, **pull it off DockerHub** (and use the `run_docker.sh` script in the repo to run it):

```shell
$ docker pull dosyago/viewfinder-regular:latest
$ git clone https://github.com/crisdosyago/BrowserBox.git
$ cd BrowserBox/
$ ./scripts/run_docker.sh
```

**In general**

In all the above cases you can connect to the following address in a regular browser:

`http://<host_ip>:8002/login?token=<token>`

For the Docker image, the token is `token2` for the NPM and repository copies, the token is `bhvNDh6XYZ`

You can enable `https://` by adding certificates (such as from LetsEncrypt) into the `$HOME/sslcerts/` directory if running via Node. 

If you want to enable https while using Docker, you'll need to either rebuild a Docker image that copies your certs, or run HTTPS on a reverse-proxy.

To rebuild a Docker image that copies your certs into the correct $HOME/sslcerts/ direcotry, you need to use the script to rebuild docker, which is: `./scripts/build_docker.sh`. You'll need to modify the Dockerfile to copy your certs. 

Alternately you can put a HTTPS reverse-proxy such as nginx in front of your Docker instance, and handle the certs outside the container.

## Installation Troubleshooting

If you encounter problems try running the `./scripts/setup_machine.sh` script, and try again.

## Applications

BrowserBox enables a number of different applications depending on your problem space:

**Product space**
- Remote browser isolation for security, risk mitigation and privacy
- Zero download co-browsing for collaboration and social interaction
- Delivery layer for a zero download web scraping app that works on any device format
- Alternate browser extension platform with associated app store
- An online "internet cafe" with advanced security and privacy features
- An alternative to VPNs, DNS blocklists
- Email attachment threat mitigation via CDR and automatic opening of links and attachments in the remote browser
- An intuitive UI affordance to enable clients to stay in-app while performing 3rd-party processes that normally require them to leave your web site.
- A fully skinable and themeable client-customizable online hosted web browser alternative to downloadable browsers
- Replay web app interactions to record bugs by recording the even stream and the viewport
- Record visual How To guides illustrating key user stories

**Internal tooling space**
- Human-in-the-loop intervention tool to unblock stuck browser automation jobs, and diagnose "selector drift" and script-page mismatch issues
- An effective web proxy to easily integrate 3rd-party processes without APIs
- An effective, interactive console to inspect, observe and interact with browser automation tasks
- An automatable browser that more effectively evades bot detection mechanisms that pure headless Chrome
- A scriptable console, and interactive simulator for automation tasks and automation script creation with a great, familiar and intuitive feedback loop

**Tech and framework space**
- A `<WebView>` tag for the open web
- An `<iframe>` without cross-origin restrictions 
- A 'head' for headless browsers

## Progress & Roadmap 

BrowserBox aims for feature-parity with desktop and mobile browsers, but also to push the limits of this technology with extra features like co-browsing. The list below shows our progress toward those goals. Please note that ⭐ features are only available in BrowserBox Pro.

**Browser Features**
- [:heavy_check_mark:] Back and forward history buttons 
- [:heavy_check_mark:] Multiple tabs
- [:heavy_check_mark:] Favicons
- [:heavy_check_mark:] Addressbar search
- [:heavy_check_mark:] Incognito tabs
- [:heavy_check_mark:] Persistent sessions
- [:heavy_check_mark:] `<select>` inputs
- [:heavy_check_mark:] Modal dialogs
- [:heavy_check_mark:] Copy and paste
- [:heavy_check_mark:] Native paste
- [:heavy_check_mark:] Touch scroll and touch drag
- [:heavy_check_mark:] File upload (including multiple files)
- [:heavy_check_mark:] Basic & Digest Auth support
- [:heavy_check_mark:] Clear all cookies and cached data during sessions
- [:heavy_check_mark:] Sound
- [:heavy_check_mark:] Interact with CAPTCHAs
- [:heavy_check_mark:] Context-menu (for opening in new tab, copying link address, etc)
- [:heavy_check_mark:] Responsive design for any device viewport
- [:heavy_check_mark:] Desktop scroll-zoom
- [:heavy_check_mark:] Mobile pinch-zoom
- [:heavy_check_mark:] `mailto:`, `tel:`, `sktype:` and other [app and protocol links](quora.com/What-are-tel-SMS-mailto-and-geo-in-URLs/answer/Matthew-Cox-33)
- [:heavy_check_mark:] Multiple select 
- [:heavy_check_mark:] Variable-bitrate rendering ⭐
- [:heavy_check_mark:] Flash player (via [Ruffle](https://github.com/ruffle-rs/ruffle)) ⭐
- [:hourglass_flowing_sand:] Multi-touch on mobile
- [:hourglass_flowing_sand:] Bookmarks
- [:hourglass_flowing_sand:] Displayable history
- [:hourglass_flowing_sand:] Webcam and microphone support

**Security Features**
- [:heavy_check_mark:] RBI [browser isolation](https://en.wikipedia.org/wiki/Browser_isolation) security model
- [:heavy_check_mark:] Fully clientless, embeds straight into a web page, zero download required for front-end
- [:heavy_check_mark:] [Evades](https://github.com/paulirish/headless-cat-n-mouse) [headless](https://github.com/infosimples/detect-headless) [detection](https://github.com/azerpas/detect-headless) 
- [:heavy_check_mark:] Customizable browser-fingerprinting cross-section
- [:heavy_check_mark:] Works with proxies and Tor
- [:heavy_check_mark:] DevTools (*currently only works on Chrome clients*) ⭐
- [:heavy_check_mark:] Secure document viewer ([CDR](https://en.wikipedia.org/wiki/Content_Disarm_%26_Reconstruction)) ⭐
- [:heavy_check_mark:] [`cgroups`](https://man7.org/linux/man-pages/man7/cgroups.7.html) resource control sandboxing ⭐
- [:heavy_check_mark:] 1 temporary user account per browser session ⭐
- [:heavy_check_mark:] Clean-slate profile directory per browser session ⭐

**Application Features**
- [:heavy_check_mark:] Built-in AdBlocker
- [:heavy_check_mark:] Fully remote real-time co-browsing + built-in chat ⭐
- [:heavy_check_mark:] Advanced adaptive streaming (with WebRTC + WebSockets) and Shortest path lag reduction ⭐
- [:heavy_check_mark:] Run sandboxed puppeteer scripts ⭐
- [:heavy_check_mark:] Skinnable browser UI ⭐
- [:heavy_check_mark:] Kiosk mode (*no UI controls*) ⭐
- [:hourglass_flowing_sand:] Sync browser cookies & settings from other browser (or, for example, Google account)
- [:hourglass_flowing_sand:] Chrome extensions API (or cloned functionality)

**Development and Deployment Features**
- [:heavy_check_mark:] Fully Dockerized / Dockerizable + reproducible startup and install scripts
- [:heavy_check_mark:] Cloud-agnostic, runs on any cloud platform 
- [:heavy_check_mark:] Platform agnostic, and runs on Windows, Linux and Mac
- [:heavy_check_mark:] Dependency control and minimal dependencies (only 14 external 1st level deps on back-end--mostly [express](https://expressjs.com/) related--and 0 on front-end)
- [:heavy_check_mark:] Many customizable settings (including site blocklist)
- [:heavy_check_mark:] Embeddable in an `<iframe>` ⭐
- [:heavy_check_mark:] Vertically scalable (multiple browsers per server) ⭐
- [:heavy_check_mark:] Small resource footprint ⭐
- [:heavy_check_mark:] Bandwidth, CPU and memory limiting for resource abuse detection and prevention ⭐
- [:heavy_check_mark:] Simple API ⭐
- [:heavy_check_mark:] Fully white-labelable
- [:hourglass_flowing_sand:] White-labeling API
- [:hourglass_flowing_sand:] Fully scriptable with comprehensive API 

## Pro or Regular? 

**What's the difference between BB Pro and Regular?**

The main differences are that BB Pro has more advanced features and more frequent updates than BB Regular.

For example, Pro has much better rendering, higher quality graphics and lower lag than Regular, as a result of many advanced streaming and variable bitrate innovations incorporated there.

Many Pro features are eventually sent down to Regular, but some will likely remain exclusive to Pro. Pro is updated weekly, with major updates shipped every quarter, whereas BB Regular follows a much slower and more haphazard release cycle. 

The final main differenece you might want to be aware of is that while BB Regular is source-available (and is the sourcecode in this repository), BB Pro is currently closed-source proprietary software only available commercially, for either use in an Individual server, or for deployment in a Self-hosted package. 

More information on these [commercial options](#commercial-options) is below, and take a look at the table of feature comparison between Regular and Pro.

### BB Pro vs Regular &mdash; Comparison Table

| Feature                                       | Regular            | Pro                |
|-----------------------------------------------|--------------------|--------------------|
| Browser features                              | :heavy_check_mark: | :heavy_check_mark: |
| Security features                             | :heavy_check_mark: | :heavy_check_mark: |
| Privacy features                              | :heavy_check_mark: | :heavy_check_mark: |
| Themeable browser UI                          | :heavy_check_mark: | :heavy_check_mark: |
| Docker image                                  | :heavy_check_mark: | :heavy_check_mark: |
| Cloud and platform agnostic                   | :heavy_check_mark: | :heavy_check_mark: |
| Multi-user security features                  |                    | :heavy_check_mark: |
| Auto scaling and resource control             |                    | :heavy_check_mark: |
| WebRTC/WebSocket viewport streaming           |                    | :heavy_check_mark: |
| Fastest-path lag reduction                    |                    | :heavy_check_mark: |
| Built-in cobrowsing and instant messaging     |                    | :heavy_check_mark: |
| Puppeteer scripting REPL console              |                    | :heavy_check_mark: |
| `<iframe>` embeddable                         |                    | :heavy_check_mark: |
| Kiosk mode                                    |                    | :heavy_check_mark: |
| Simple API                                    |                    | :heavy_check_mark: |


## Commercial Options

BrowserBox Pro is provided by the [Dosyago Corporation](https://github.com/dosyago) as a commercial offering in two flavors: individual, and self-hosted.

**Self-hosted**

The self-hosted track includes the provision of the BB Pro software, an S license and various tiers of service. The basic cost principle is established on time (not scale): time you want the license for, time of the latest update you want, and time it takes us to service your deployment. Targeted at SMBs up to Enterprise. 

If you want to use BB commercially self-hosted is your main option.

To use the self-hosted track, you need to purchase an [S license](#balance_scale-licensing) for a self-hosted deployment, which permits non-competing uses. I'll have a new price list up here soon, so stay tuned to this repository or [contact me](mailto?cris@dosycorp.com&subject=BB%20S%20License&body=Dear%20Cris) if you'd like first dibs on the new prices. Here's a general overview of where this will go:

- Various configurable packages available with either perpetual or yearly licensing, and included service and consulting. 
- Starts at USD6,700 a year for non-perpetual single year license plus minimal service. 
- Mid-tier options cost 10K - 16K yearly with a variety of options including perpetual or annual licenses.
- Invoiceable service and consulting also available.
- BYO cloud or data-center, or on-prem are all available.

If you'd like to license BB for purposes that competete with us, we'll have to negotiate agreements. [Reach out to me](mailto:cris@dosycorp.com?subject=BB%20Negotiation&body=Dear%20Cris) if that's the case.

Just a reminder that prices and buy links for self-hosted tiers are *being published here soon!* In the meantime, <a href="mailto:cris@dosycorp.com?subject=BB%20Pro%20Packages&body=Hi%20Cris" target=_blank>email me</a> to ask a question.

**Individual**

Includes provision of a geographically located server wherever you want (or as close to it as possible for us), installed software, credentials to access, and various tiers of service. The basic cost principle is founded on performance (CPU cores, memory, network speed and bandwidth amount). 

See the current [prices and tiers for the Individual track.](https://individual.dosyago.com)

## Motivation

I originally created this in 2018 as a layer for a collaborative zero-download clientless web-scraping app I'm working on, but fell in love with this browser layer, and decided it was useful enough and a product category in its own right. 

## Stats

- **Visits:** [![visits](https://hits.seeyoufarm.com/api/count/incr/badge.svg?url=https%3A%2F%2Fgithub.com%2Fc9fe%2FBrowserBox&count_bg=%2379C83D&title_bg=%23555555&icon=&icon_color=%23E7E7E7&title=%28today%2Ftotal%29%20visits%20since%2027%2f10%2f2020&edge_flat=false)](https://hits.seeyoufarm.com) 

## FAQ

**In plain language how would you describe what makes this browser stand-out?**

You can have multiple people browsing at once, in sync (cobrowsing). It also can be faster than your normal connection (because the server + its network is very fast). You can consider it more secure, because it only runs web content in the cloud, not on your device.

**What is BB Individual?**

<strong>BB Individual</strong>&mdash;your remote browser in the cloud, powered by <a href=https://github.com/crisdosyago/BrowserBox#comparison-table>BrowserBox Pro</a>.
<p>
You can also bring 4 other people to cobrowse simultaneously with you on the same session.
<p>
  
<strong>Why do I want a remote browser?</strong>
<ul>
<li>
<em>Security and privacy</em>&ndash;The <a href=https://www.mcafee.com/enterprise/en-us/security-awareness/cloud/what-is-browser-isolation.html>RBI</a> security model offers many
advantages.
</li>
<li>
<em>Cobrowsing and collaboration</em>&ndash;Watch and interact with the page in sync with others.
</li>
<li>
<em>Bandwidth arbitrage</em>&ndash;Hop over slow networks with a faster node.

</li>
<li>
<em>Research and vulnerability testing</em>&ndash;If you work for a public institution or non-profit you may be able to use <a href=https://github.com/crisdosyago/BrowserBox>BrowserBox Regular</a> in your work for free.
</li>
</ul>
<p>
<strong>Where do I get the code for this?</strong>
<br>
Unfortunately this demo uses a version of <strong>BB Pro</strong>:
a closed-source fork of BB Regular.
The Pro code is only available under a commerical license.
<a href=mailto:cris@dosycorp.com?subject=BB%20Pro&body=Hi%20Cris>Email me</a> to discuss
or keep appraised of <a href=https://github.com/crisdosyago/BrowserBox>our GitHub repository</a>
for upcoming new prices.
<p>


**Can I download files form the web using BB?**

By default, for security, BB does not permit downloading of files to the local device, and instead downloads them to the remote server. In BB Pro, the built-in secure document viewer then processes and displays them if they are of a supported format. However, both Pro and Regular lines can be configured to provide a download link to get the file to the local device, although that is not recommended in security applications, at least not without proper scanning or CDR.

You can also link up your own secure document viewer with BB Regular. 

**Can you rush legacy Flash applications?**

There's a customized version of Viewfind Pro with Flash support via two separate paths: Legacy Chrome (pre [Chrome 88 ~ Jan 2021](https://www.chromium.org/flash-roadmap#TOC-Flash-Support-Removed-from-Chromium-Target:-Chrome-88---Jan-2021-)) with [xvfb](https://www.x.org/releases/X11R7.7/doc/man/man1/Xvfb.1.xhtml), and using latest Chrome with [ruffle](https://github.com/ruffle-rs/ruffle). 

**However**, there's no guaruntee that your particular application will work, because ruffle still has many missing features and bugs, and because streaming your app over the network in a virtual browser may introduce other issues for your application, or simply be not suitable in your case.

But in the ideal case, yes, it can be done, and you can embed your legacy Flash player app in a BB Pro iframe and put it on your site.

**Can BB integrate with our existing secure document viewer or download scanning?**

Not out of the box but BB Pro can be configured to pass requests for document viewing to a 3rd-party application and to serve downloaded files. In short, BB can be configured to send downloads to your secure document viewer or download scanner. In the case where BB is configured to allow downloads to the local device, it should not effect your normal download scanners and endpoint protection software. 

**What sort of multi-profile or "fake profile" privacy options are available to defeat fingerprinting and tracking?**

By default BB Pro runs with a clean slate every session, so there are no tracking cookies or data retained from any other session of BB. Even if persistent sessions are enabled, BB can still be configured to transmit various phoney profile information (such as installed plugins, geolocation, platform, device, browser version and so on) in order to attempt to defeat fingerprinting and tracking. However, even with the added layer of protection of an additional remote browser, a separate IP address, and forged browser identification, there's no guaruntee of 100% effectiveness. If someone logs in to an account linked to their other profiles or identities, it may still be possible to track them, even if they are using BB. Technology can only go so far, people must also take sensible precautions in their choices. 

**Can you white-label BB as the tech for our internal RBI product?**

Not us, but you can do it and we can help you. BB can most definitely be fully whitelabelled and customized with a variety of themes, splash pages, styles, design systems, brand look and assets.

**Can I use BB tech to make my own commercial RBI product and sell that?**

Yes of course. With the proper license this is most definitely a possible use case for BB, and we encourage you to do so.

**Where can I get more information on your services, available licenses or pricing?**

Eventually I intend to most of that information here, but for now you may [email me](mailto:cris@dosycorp.com?subject=BB%20Info&body=Hi%20Cris). The reason is I'm currently revising a lot of positioning, licensing and prices. If you let me know you prefer a voice call that's also available. 
 
 **Can I donate to support development?**
 
 Yes of course. You can see various contribution links on the [BB Donations page](https://github.com/crisdosyago/BrowserBox/blob/boss/docs/DONATIONS.md). When you donate to BB specifically, send me [an email](mailto:cris@dosycorp.com?subject=I%20Just%20Donated!&body=Hi%20Cris) if you'd like to be added to the **Backers Hall of Fame**.
 
 Alternately, you may [donate to DosyagoCorp](https://buy.stripe.com/bIY5lw7hL2Ur6LS3cM) in general to support development across many Dosyago products. Thanks! 😍

## Other resources 

- Click to deploy on GCP, AWS, Heroku
- Planned: StackScript for Linode, Vultr Marketplace entry
- Learn and solve issues together at the [community discussion page](https://github.com/crisdosyago/BrowserBox/discussions).

## Contributing

Contributions welcome! But please sign the CLA first. Don't worry, if you open a pull request a bot will automatically let you know what you need to do!

## :balance_scale: Licensing

**BB Regular**

  BB Regular (this repository) is licensed under the Polyform Noncommercial License 1.0 (NC license). Any previous licensed versions are also relicensed under this license.  

  The NC license permits *"use by any charitable organization, educational institution, public research organization, public safety or health organization, environmental protection organization, or government institution is use for a permitted purpose regardless of the source of funding or obligations resulting from the funding."* 

  [Read the license](https://github.com/crisdosyago/BrowserBox/blob/boss/LICENSE.md).

**BB Pro**

  BB Pro (closed-source) is available under the Polyform Shield License 1.0.0 (S license), via a licensing agreement with The Dosyago Corporation. [Read the license](https://github.com/crisdosyago/BrowserBox/blob/boss/LICENSE-Pro.md). 

  In essence this license permits any use case besides those which compete with Dosyago Corporation (or the rightsholders of BB).

  If you'd like to purchase a Pro S license, [see the price list here](https://github.com/crisdosyago/BrowserBox/blob/boss/docs/PRICELIST.md)

## &copy; Copyright 

This project copyright The Rightsholders (currently Cris Stringfellow & The Dosyago Corporation) 2022
