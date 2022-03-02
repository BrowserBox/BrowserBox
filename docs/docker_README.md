<p align=center><a href=https://dosyago.com target=_blank><img src=https://github.com/crisdosyago/BrowserBox/raw/boss/.github/26881_DOSY_PP-01.png width=61.8%></a></p>

# [BrowserBox](https://github.com/crisdosyago/BrowserBox) · [![Source Lines of Code](https://sloc.xyz/github/crisdosyago/BrowserBox)](https://sloc.xyz) [![PRs welcome](https://camo.githubusercontent.com/b0ad703a46e8b249ef2a969ab95b2cb361a2866ecb8fe18495a2229f5847102d/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f5052732d77656c636f6d652d627269676874677265656e2e737667)](https://github.com/crisdosyago/BrowserBox/pulls) [![npm](https://img.shields.io/npm/v/remoteview)](https://npmjs.com/package/remoteview) [![npm](https://img.shields.io/npm/dt/remoteview)](https://npmjs.com/package/remoteview) [![Docker Pulls](https://img.shields.io/docker/pulls/dosyago/browsergapce)](https://hub.docker.com/r/dosyago/browsergapce) 

**BrowserBox** is a component for a browser that runs on a remote server, with a UI you can embed on the web.

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
- [Commercial Options](#commercial-options)
- [Motivation](#motivation)
- [Stats](#stats)
- [FAQ](#faq)
- [Other sections - coming soon](#other-sections---coming-soon)
- [Contributing](#contributing)
- [⚖️ Licensing](#balance_scale-licensing)
- [&copy; Copyright](#copy-copyright)

--------------------------------------

## Installation

**Clone the repo and install dependencies:**

```shell
$ git clone https://github.com/crisdosyago/BrowserBox.git
$ cd BrowserBox
$ npm i 
```

or, **install it from NPM either as a package or a global:**

```shell
$ npm i --save viewfinder-regular
$ npm i -g viewfinder-regular
```

or, **pull it off DockerHub:**

```shell
$ docker pull dosyago/viewfinder-regular:latest
$ cd BrowserBox/
$ ./scripts/run_docker.sh
```

In all the above cases you can connect to the following address in a regular browser:

`http://<host_ip>:8002/login?token=<token>`

For the Docker image, the token is `token2` for the NPM and repository copies, the token is `bhvNDh6XYZ`

You can enable `https://` by adding certificates (such as from LetsEncrypt) into the `$APP/sslcert/master/` directory where $APP is the source directory of BrowserBox that contains the `server.js` file (i.e ./BrowserBox/src/ in the repository copy).

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
- [✔️] Back and forward history buttons 
- [✔️] Multiple tabs
- [✔️] Favicons
- [✔️] Addressbar search
- [✔️] Incognito tabs
- [✔️] Persistent sessions
- [✔️] `<select>` inputs
- [✔️] Modal dialogs
- [✔️] Copy and paste
- [✔️] Native paste
- [✔️] Touch scroll and touch drag
- [✔️] File upload (including multiple files)
- [✔️] Basic & Digest Auth support
- [✔️] Clear all cookies and cached data during sessions
- [✔️] Sound
- [✔️] Interact with CAPTCHAs
- [✔️] Context-menu (for opening in new tab, copying link address, etc)
- [✔️] Responsive design for any device viewport
- [✔️] Desktop scroll-zoom
- [✔️] Mobile pinch-zoom
- [✔️] `mailto:`, `tel:`, `sktype:` and other [app and protocol links](quora.com/What-are-tel-SMS-mailto-and-geo-in-URLs/answer/Matthew-Cox-33)
- [✔️] Multiple select 
- [✔️] Silky smooth variable-bitrate rendering performance ⭐
- [⏳] Multi-touch on mobile
- [⏳] Bookmarks
- [⏳] Displayable history
- [⏳] Webcam and microphone support

**Security Features**
- [✔️] RBI [browser isolation](https://en.wikipedia.org/wiki/Browser_isolation) security model
- [✔️] Fully clientless, embeds straight into a web page, zero download required for front-end
- [✔️] [Evades](https://github.com/paulirish/headless-cat-n-mouse) [headless](https://github.com/infosimples/detect-headless) [detection](https://github.com/azerpas/detect-headless) 
- [✔️] Customizable browser-fingerprinting cross-section
- [✔️] Works with proxies and Tor
- [✔️] DevTools (*currently only works on Chrome clients*) ⭐
- [✔️] Integrates with PDF/DOCX/XLSX secure document viewer ([CDR](https://en.wikipedia.org/wiki/Content_Disarm_%26_Reconstruction)) (built-in only in Pro ⭐)
- [✔️] [`cgroups`](https://man7.org/linux/man-pages/man7/cgroups.7.html) resource control sandboxing ⭐
- [✔️] 1 temporary user account per browser session ⭐
- [✔️] Clean-slate profile directory per browser session ⭐

**Application Features**
- [✔️] Built-in AdBlocker
- [✔️] Fully remote real-time co-browsing + built-in chat ⭐
- [✔️] Advanced adaptive streaming (with WebRTC + WebSockets) and Shortest path lag reduction ⭐
- [✔️] Run sandboxed puppeteer scripts ⭐
- [✔️] Skinnable browser UI ⭐
- [✔️] Kiosk mode (*no UI controls*) ⭐
- [⏳] Sync browser cookies & settings from other browser (or, for example, Google account)
- [⏳] Chrome extensions API (or cloned functionality)

**Development and Deployment Features**
- [✔️] Fully Dockerized / Dockerizable + reproducible startup and install scripts
- [✔️] Cloud-agnostic, runs on any cloud platform 
- [✔️] Platform agnostic, and runs on Windows, Linux and Mac
- [✔️] Dependency control and minimal dependencies (only 14 external 1st level deps on back-end--mostly [express](https://expressjs.com/) related--and 0 on front-end)
- [✔️] Many customizable settings (including site blocklist)
- [✔️] Embeddable in an `<iframe>` ⭐
- [✔️] Vertically scalable (multiple browsers per server) ⭐
- [✔️] Small resource footprint ⭐
- [✔️] Bandwidth, CPU and memory limiting for resource abuse detection and prevention ⭐
- [✔️] Simple API ⭐
- [✔️] Fully white-labelable
- [⏳] White-labeling API
- [⏳] Fully scriptable with comprehensive API 

## Pro or Regular? 

**What's the difference between VF Pro and regular VF?**

The main differences are that VF Pro has more advanced features and more frequent updates than VF regular. Many Pro features eventually are sent down to regular, but some will likely remain exclusive to Pro. Pro is updated weekly, with major updates shipped every quarter, whereas regular VF follows a much slower and more haphazard release cycle. 

The final main differenece you might want to be aware of is that while VF regular is source-available (and is the sourcecode in this repository), VF Pro is currently closed-source proprietary software only available commercially, for either use in an Individual server, or for deployment in a Self-hosted package. 

More information on these [commercial options](#commercial-options) is below, and take a look at the table of feature comparison between Regular and Pro.

<b id=comparison-table>VF Pro vs Regular &mdash; Comparison Table</b>

| Feature                                       | Regular            | Pro                |
|-----------------------------------------------|--------------------|--------------------|
| Browser features                              | ✔️                  | ✔️                  |
| Security features                             | ✔️                  | ✔️                  |
| Privacy features                              | ✔️                  | ✔️                  |
| Themeable browser UI                          | ✔️                  | ✔️                  |
| Docker image                                  | ✔️                  | ✔️                  |
| Cloud and platform agnostic                   | ✔️                  | ✔️                  |
| Multi-user security features                  |                    | ✔️                  |
| Auto scaling and resource control             |                    | ✔️                  |
| Advanced viewport streaming and lag reduction |                    | ✔️                  |
| Built-in cobrowsing and instant messaging     |                    | ✔️                  |
| Run sandboxed puppeteer scripts               |                    | ✔️                  |
| `<iframe>` embeddable                         |                    | ✔️                  |
| Kiosk mode                                    |                    | ✔️                  |
| Simple API                                    |                    | ✔️                  |


## Commercial Options

If you want to use VF commercially your main option is to purchase an [S license](#licensing), which permits non-competing uses. If you'd like to license VF for purposes that competete with us, we'll have to negotiate agreements. [Reach out to me](mailto:cris@dosycorp.com?subject=VF%20Negotiation&body=Dear%20Cris) if that's the case.

BrowserBox Pro is provided by the [Dosyago Corporation](https://github.com/dosyago) as a commercial offering in two flavors: individual, and self-hosted.

**Self-hosted**

Includes the provision of the VF Pro software, an S license and various tiers of service. The basic cost principle is established on time (not scale): time you want the license for, time of the latest update you want, and time it takes us to service your deployment. Targeted at SMBs up to Enterprise. 

- Various configurable packages available with either perpetual or yearly licensing, and included service and consulting. 
- Starts at USD6,700 a year for non-perpetual single year license plus minimal service. 
- Mid-tier options cost 10K - 16K yearly with a variety of options including perpetual or annual licenses.
- Invoiceable service and consulting also available.
- BYO cloud or data-center, or on-prem are all available.

Prices and buy links for Self-hosted tiers are *coming soon!* In the meantime, <a href="mailto:cris@dosycorp.com?subject=VF%20Pro%20Packages&body=Hi%20Cris" target=_blank>email me</a> to ask a question.

**Individual**

Includes provision of a geographically located server wherever you want (or as close to it as possible for us), installed software, credentials to access, and various tiers of service. The basic cost principle is founded on performance (CPU cores, memory, network speed and bandwidth amount). 

See the current [prices and tiers for the Individual track.](https://personal.dosyago.com)

## Motivation

I originally created this in 2018 as a layer for a collaborative zero-download clientless web-scraping app I'm working on, but fell in love with this browser layer, and decided it was useful enough and a product category in its own right. 

## Stats

- **Visits:** [![visits](https://hits.seeyoufarm.com/api/count/incr/badge.svg?url=https%3A%2F%2Fgithub.com%2Fc9fe%2FBrowserBox&count_bg=%2379C83D&title_bg=%23555555&icon=&icon_color=%23E7E7E7&title=%28today%2Ftotal%29%20visits%20since%2027%2f10%2f2020&edge_flat=false)](https://hits.seeyoufarm.com) 
- **Lines of code:** 40,000
- **Years in development:** 3

## FAQ

**Can you rush legacy Flash applications?**

There's a customized version of Viewfind Pro with Flash support via two separate paths: Legacy Chrome (pre [Chrome 88+ - Jan 2021](https://www.chromium.org/flash-roadmap#TOC-Flash-Support-Removed-from-Chromium-Target:-Chrome-88---Jan-2021-)) with [xvfb], and using latest Chrome with [ruffle](https://github.com/ruffle-rs/ruffle). ***However***, there's no guaruntee that your particular application will work, because ruffle still has many missing features and bugs, and because streaming your app over the network in a virtual browser may introduce other issues for your application, or simply be not suitable in your case.

But in the ideal case, yes, it can be done, and you can embed your legacy Flash player app in a VF Pro iframe and put it on your site.

**Can I download files form the web using VF?**

By default VF does not permit downloading of files to the local device, and instead downloads them to the remote server. In VF Pro, the built-in secure document viewer then processes and displays them if they are of a supported format. However, both Pro and Regular lines can be configured to provide a download link to get the file to the local device, although that is not recommended in security applications, at least not without proper scanning or CDR.

**Can VF integrate with our existing secure document viewer or download scanning?**

Not out of the box but VF Pro can be configured to pass requests for document viewing to a 3rd-party application and to serve downloaded files. In short, VF can be configured to send downloads to your secure document viewer or download scanner. In the case where VF is configured to allow downloads to the local device, it should not effect your normal download scanners and endpoint protection software. 

**What sort of multi-profile or "fake profile" privacy options are available to defeat fingerprinting and tracking?**

By default VF Pro runs with a clean slate every session, so there are no tracking cookies or data retained from any other session of VF. Even if persistent sessions are enabled, VF can still be configured to transmit various phoney profile information (such as installed plugins, geolocation, platform, device, browser version and so on) in order to attempt to defeat fingerprinting and tracking. However, even with the added layer of protection of an additional remote browser, a separate IP address, and forged browser identification, there's no guaruntee of 100% effectiveness. If someone logs in to an account linked to their other profiles or identities, it may still be possible to track them, even if they are using VF. Technology can only go so far, people must also take sensible precautions in their choices. 

**Can you white-label VF as the tech for our internal RBI product?**

Not us, but you can do it and we can help you. VF can most definitely be fully whitelabelled and customized with a variety of themes, splash pages, styles, design systems, brand look and assets.

**Can I use VF tech to make my own commercial RBI product and sell that?**

Yes of course. With the proper license this is most definitely a possible use case for VF, and we encourage you to do so.

**Where can I get more information on your services, available licenses or pricing?**

Eventually I intend to most of that information here, but for now you may [email me](mailto:cris@dosycorp.com?subject=VF%20Info&body=Hi%20Cris). The reason is I'm currently revising a lot of positioning, licensing and prices. If you let me know you prefer a voice call that's also available. 

## Other resources 

- Click to deploy on GCP, AWS, Heroku
- Planned: StackScript for Linode, Vultr Marketplace entry
- Learn and solve issues together at the [community discussion page](https://github.com/crisdosyago/BrowserBox/discussions).

## Contributing

Contributions welcome! But please sign the CLA first. Don't worry, if you open a pull request a bot will automatically let you know what you need to do!

## ⚖️ Licensing

**VF Regular**

  VF Regular (this repository) is licensed under the Polyform Noncommercial License 1.0 (NC license). Any previous licensed versions are also relicensed under this license.  

  The NC license permits *"use by any charitable organization, educational institution, public research organization, public safety or health organization, environmental protection organization, or government institution is use for a permitted purpose regardless of the source of funding or obligations resulting from the funding."* 

  [Read the license](https://github.com/crisdosyago/BrowserBox/blob/boss/LICENSE.md).

**VF Pro**

  VF Pro (closed-source) is available under the Polyform Shield License 1.0.0 (S license), via a licensing agreement with The Dosyago Corporation. [Read the license](https://github.com/crisdosyago/BrowserBox/blob/boss/LICENSE-Pro.md). 

  In essence this license permits any use case besides those which compete with Dosyago Corporation (or the rightsholders of VF).

  If you'd like to purchase a Pro S license, [see the price list here](https://github.com/crisdosyago/BrowserBox/blob/boss/docs/PRICELIST.md)

## &copy; Copyright 

This project copyright The Rightsholders (currently Cris Stringfellow & The Dosyago Corporation) 2022
