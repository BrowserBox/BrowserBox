<img src=https://github.com/i5ik/ViewFinder/raw/master/.github/26881_DOSY_PP-01.png width=100%>

# [:camera: ViewFinder](https://github.com/cris691/ViewFinder) [![docker pulls](https://img.shields.io/docker/pulls/dosyago/browsergapce)](https://hub.docker.com/r/dosyago/browsergapce) ![version](https://img.shields.io/npm/v/remoteview) [![npm downloads](https://img.shields.io/npm/dt/remoteview)](https://www.npmjs.com/package/remoteview) [![binary downloads](https://img.shields.io/github/downloads/cris691/ViewFinder/total?label=binary%20downloads)](https://github.com/cris691/ViewFinder/releases/latest) [![visitors+++](https://hits.seeyoufarm.com/api/count/incr/badge.svg?url=https%3A%2F%2Fgithub.com%2Fc9fe%2FViewFinder&count_bg=%2379C83D&title_bg=%23555555&icon=&icon_color=%23E7E7E7&title=%28today%2Ftotal%29%20visitors%2B%2B%2B%20since%20Oct%2027%202020&edge_flat=false)](https://hits.seeyoufarm.com) [![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fi5ik%2FViewFinder.svg?type=small)](https://app.fossa.com/projects/git%2Bgithub.com%2Fi5ik%2FViewFinder?ref=badge_small)

ViewFinderJS is a virtualized browser, running in your browser! There's many ways you can think about what VF is:

- a web UI for for headless Chrome (also can work with other browsers that support the DevTools protocol)
- a browser interface that runs in client-side JavaScript and HTML and connects to a browser running locally or on a server
- a platform to build enhanced browsing atop of, including capabilities like: co-browsing, secure document viewing, no-code automation
- a free and source-available implementation of remote browser isolation
- a way to view automations you're running with puppeteer, playwright or using the DevTools protocol natively. 

**What's the Pro version?**

Pro version is an updated version of this free, and source-available "community edition" version, that includes many enhancments including:

- co-browsing support for any number of clients
- advanced "adaptive variable rate"  streaming for optimal quality over a wide range of bandwidth conditions
- chat panel for co-browsing participants
- open DevTools to inspect remote pages
- run puppeteer scripts in a secure sandbox
- scale up to run multiple browsers on a single server
- control CPU, memory and bandwidth resource usage
- additional security and performance enhancements

You can license the Pro version for your product, or license the source-available version with a license exemption to avoid the AGPL-3.0. 
[Contact Dosycorp about a license](mailto:cris@dosycorp.com?subject=ViewFinderJS%20License&body=Hello%20Cris)

[Have a little look at the latest features to land on Product Hunt](https://www.producthunt.com/posts/puppeteer-console)

[Product Hunted x 3](https://www.producthunt.com/posts/viewfinderjs/maker-invite?code=wMxcDN)

<a href="https://www.producthunt.com/posts/viewfinderjs?utm_source=badge-featured&utm_medium=badge&utm_souce=badge-viewfinderjs" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=284819&theme=light" alt="ViewFinderJS - A secure browser you embed in your webapp | Product Hunt" style="width: 250px; height: 54px;" width="250" height="54" /></a>

If you use or like this, don't forget to show your appreciation by [starring this repo](https://github.com/i5ik/ViewFinderJS/stargazers), or [following me](https://github.com/i5ik) 😹

**What is this?**

**ViewFinderJS** is a programmable virtualized browser for web apps. You can run it to serve your own remote browser isolation, integrate it as an embeddable BrowserView to permit cross-site process coordination, or build it into your tooling to give you greater visibility into your browser automation jobs, and keep a human-in-the-loop to intervene if a job gets stuck or requires manual input. The source available version offered here is a scaled down, simplified version of the more advanced, and full featured Pro version, which includes variable bandwidth streaming for optimal user experience as well as and co-browsing to enable use cases like real-time interactive support and training using a shared browser. 

As it enables RBI and CBII, ViewFinderJS is like CloudFlare Cloud Browsers, S2, WebGap, Bromium, Authentic8, Menlo Security and Broadcom RBI, but the difference is ViewFinderJS is free and source-available. ViewFinderJS also lives in another space, because it's a fully programmable browser that you can connect to your existing browser workloads, powered by Puppeteer or your own custom automation logic. In this way it's similar to [Browserless](https://browserless.io), but different in that it's also serving a niche that needs a more complete browser experience with multiple tabs and same-as-native-browser UI and UX. Where Browserless focuses almost entirely on automation, ViewFinderJS is a platform for building many tools and apps on top of, from automation, internal tooling, to RBI and live support and training. 

Similarly to Browserless, ViewFinderJS is dual licensed, so if you need to deploy it without releasing your own product under the GPL-3.0, you can [purchase an exemption](mailto:cris@dosycorp.com?subject=ViewFinderJS%20License&body=Hello%20Cris), or you can upgrade to the Pro version to access the more advanced features and a range of flexible licenses, maintenance contracts, deployment, delivery and custom development options to power your business. 

Both source-available and Pro versions support secure document viewing with CDR from https://github.com/dosyago/p2%2e but you'll need to set that up yourself for the source-available version, while the Pro version includes this. 

----------------------

- [Overview](#camera-viewfinder----)
  * [Get started](#very-very-quick-install)
  * [License](#license)
  * [About](#about)
  * [Contributing](#contributing)
  * [Releases](#releases)
  * [Managed API: `VF.openSecurely(url: URI)`](#managed-api-vfopensecurelyurl-uri)
  * [Try it out](#try-it-out)
  * [Normal Browser UI things that work](#normal-browser-ui-things-that-work)
  * [Normal Browser UI things not yet implemented](#normal-browser-ui-things-not-yet-implemented)
  * [Advanced things only BG does](#advanced-things-only-bg-does)
  * [Some ways people are using ViewFinder](#some-ways-people-are-using-viewfinder)
  * [Major bugs](#major-bugs)
  * [localhost:8002](#localhost-8002)
  * [Get and self-host](#get-and-self-host)
  * [Easy install trouble shooting](#easy-install-trouble-shooting)
    + [Windows systems (and Mingw and Cygwin)](#windows-systems-and-mingw-and-cygwin)
    + [Binaries](#binaries)
    + [Safari](#safari)
  * [Docker build](#docker-build)
  * [Headless Detection](#headless-detection)
  * [In depth](#in-depth)
  * [Managed Cloud Service (available now)](#managed-cloud-service-available-now)
  * [Secure Cloud Based Internet Isolation](#secure-cloud-based-internet-isolation)
    + [Set up using a blank machine (running Linux)](#set-up-using-a-blank-machine-running-linux)
    + [Docker](#docker)
  * [Awesome](#awesome)
  * [Opening DevTools](#opening-devtools)
  * [Connecting puppeteer](#connecting-puppeteer)
  * [Other Similar Projects](#other-similar-projects)

------------------------
## Very Very Quick Install

```shell
$ curl -o- https://raw.githubusercontent.com/i5ik/ViewFinderJS/6ddbc6b312d4795a557ea14aa9037ccc254be339/quick_script.sh | bash
```

## Very Quick Install

```shell
$ echo Update distro
$ sudo apt update && sudo apt -y upgrade
$ echo Install tools
$ sudo apt install -y curl wget git
$ echo Install node version manager
$ curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash
$ echo Load NVM
$ source $HOME/.profile
$ source $HOME/.nvm/nvm.sh
$ echo Install latest NodeJS
$ nvm install --lts
$ echo Install latest Node Package Manager
$ npm i -g npm
$ echo Setup ViewFinderJS
$ git clone https://github.com/i5ik/ViewFinderJS.git
$ cd ViewFinderJS
$ npm i
```

Follow the prompts. :)

## License 

This is dual licensed under AGPL-3.0 and a custom exemption.

For both managed and hosted versions, many flexible contracts and licenses are available. To negotiate your deployment, [write to me at cris@dosycorp.com](mailto:cris@dosycorp.com?subject=ViewFinderJS%20License&body=Hello%20Cris), or [schedule a demo](mailto:cris@dosycorp.com?subject=ViewFinderJS%20Demo&body=Hello%20Cris) to figure out if VF can meet your requirements.

## About

This is a feature-complete, clientless, remote browser isolation product (RBI), including secure document viewing (CDR), built in HTML/JavaScript that runs right in your browser. Integrated with a secure document viewer (available on request), this can provide safe remote browser isolation at deployments of any size. It also saves you bandwidth (on the last hop, anyway).

With ViewFinder, in order to render the content of a web page, the only thing we send to your device form the remote page is pixels. So no HTML, CSS, JavaScript, etc from your browsing is ever executed on your device.

[What is RBI / CDR?](https://hackernoon.com/zero-trust-browsing-to-reduce-cybersecurity-job-fatigue-7ce72a633d4)

![Animated GIF of ViewFinder in action](https://j.gifs.com/E8yzLv.gif)

**You see that? :point_up: That's a browser running in your browser. All those tabs and UI, that's all ViewFinder. It's sending you pixels from a remote browser, running anywhere.**

You can use this repo to play with a browser running remotely in the cloud, rather than on your own device. Useful for security and automation. 

If you're a developer you can include a "BrowserView" in any other web application (for non-commercial use only).

If you're like to deploy this in your org, or for a for-profit project, write me: cris@dosycorp.com Or keep an eye out for the cloud service, coming soon. Official government use OK without purchase (also for university/public institution researchers, journalists and not-for-profits), as long as deployment is done in-house (or using Dosyago Corporation, not by other contractors, nor part of a paid deployment). If you're in government and you'd like to deploy this and want help, contact me for help or to discuss a deployment contract.

## Contributing

Hi there! :wave: :smiley: It's great that you'd want to contribute, but unfortunately I'd need you to sign a CLA which you might consider an issue :biohazard: I'm sorry, I'm sure you probably feel this is a stupid and inconvenient burden for you. If that is not impossible for you tho, and you're cool with that, then email me or please know that your PR will be closed unless you sign that. If you want to sign a CLA, have a read of it and if it's acceptable to you, sign it so you can contribute. In general terms, a CLA is a transfer of copyright and all rights (even moral rights) to your contributions to me and my company. The reason for this is to ensure there are no risks to me to license or sell this version to customers or others in future.

## Releases

[Get the latest binary release](https://github.com/cris691/ViewFinder/releases)

- Embed a browser in another web application to integrate user flows.
- Isolate your network from the risks of the public internet by running browsers in a remote machine.
- Protect your network from [Browser Zero-day exploits](https://www.radsix.com/dashboard1/)

[For more info at on fully managed versions, email me](mailto:cris@dosycorp.com?subject=ViewFinder%20Managed&body=Hello%20Cris)

## Managed API: `VF.openSecurely(url: URI)`

An API to open a link in a secure remote browser context. Calling the below in the browser will open a new tab.

```js
  import ViewFinder from './web_modules/@dosy/browsergapjs.js';
 
  const VF = ViewFinder('<my api key>');
  
  VF.openSecurely(url);
```

***News:*** VF.openSecurely was **featured** in ProductHunt.
OMG. Like Wow :rainbow: :joy_cat: I never got many likes on PH. And then suddently it got SO MANY! :P :) xx (wow). And I didn't even check it until 2 months later I was going to PH for something else and I saw all these people voted. Yay. Here's..."The Badge":

<a href="https://www.producthunt.com/posts/iso-1?utm_source=badge-featured&utm_medium=badge&utm_souce=badge-iso-1" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=242265&theme=light" alt="ISO - Isolate dangerous sites and docs in your browser | Product Hunt" style="width: 250px; height: 54px;" width="250" height="54" /></a>

If you want to see a demo of that in action, check out:  [schedule a demo](mailto:cris@dosycorp.com?subject=ViewFinderJS%20Demo&body=Hello%20Cris)

These APIs support the full package include secure document viewing. [Use the SDK](https://github.com/dosyago/browsergap.js)

## Try it out

- [The $3.81 Session](https://comebrowsewithme.com)

## Normal Browser UI things that work

- Copy and paste (paste is as normal, but for copy you need to use the right-click context menu)
- File upload
- File download and CDR secure view (seamlessly integrated in licensed self-hosted, managed or per-session options)
- Modal dialogs
- New tabs
- History (invisible but you can navigate it with the forward and back buttons)
- Address bar search (defaults to Google but you can add your own)
- New incognito tabs 
- Clearing cache, history and session cookies
- Touch scrolling, track pad scrolling, mouse wheel and magic pad scrolling
- Desktop, tablet and mobile
- Form input (text, options, check boxes, etc)

## Normal Browser UI things not yet implemented

- Text selection
- Page zooming and pinch/spread zooming on mobile (implementation is buggy)
- Multi touch on tablet and mobile
- Regular browser settings (language, default page scale, etc)
- Summary list of history entries
- WebGL (this is an open bug in Chrome headless)
- Multiple windows (you can sort of do this by opening the app in different tabs, and say opening all BG tabs in incognito mode, but it's not fluid)

## Advanced things only BG does

- Local and remote bandwidth indicator
- Secure browsing context (we only send you pixels from normal browsing, to protect you from exploits, malware and zero days)
- Fully functioning browser that you can embed in any other app on the open web (basically a `<browserview>` tag that works everywhere, and has the normal UI you expect from a browser)
- Control the resource usage of a pool of remote browsers, collectively and individually.
- Adaptively resamples images based on the bandwidth you have available on your connection, to maintain responsiveness and use the best image quality your bandwidth permits

## Some ways people are using ViewFinder

- To embed other applications in their own web app to unite separate user flows, and overcome iframe restrictions.
- As a browser proxy to enable secure browsing on locked down internal networks

## localhost:8002

By default (unless you provide command line arguments) it runs on port 8002.

## Get and self-host

Clone this repo

`git clone https://github.com/i5ik/ViewFinderJS.git`

Then run `npm i` in the repository directory, followed by `npm test` to start on the default port.

But you might like to `git fetch --all && git checkout nexe-build && git pull` to 
be on the branch that has all the latest additions just like in the Docker image, npm globals
and binaries.

or Install from npm 

`npm i -g remoteview@latest`

*Remember to follow the install prompt*

## Easy install trouble shooting

### Windows systems (and Mingw and Cygwin)

**Pre-requisites: Windows with Google chrome already instaled.**

If you're on Git Bash (or Cygwin, or Mingw) you might have trouble using `npm i -g remoteview@latest`.

Make sure you configure npm 

`npm config set script-shell "C:\\Program Files\\git\\bin\\bash.exe"`

Also, don't worry about running "setup_machine" at the prompt, because it uses `apt-get` which won't work on Windows anyway.

Normally, a Windows device with chrome already installed won't need to run "setup_machine" anyway, which is a script to install things like fonts, graphics libraries and some utilities useful for running headless Chrome in linux.

### Binaries

**Pre-requisites: Windows, Mac OS or Linux with Chrome already installed.**

If you use a [binary](https://github.com/cris691/ViewFinder/releases/latest), make sure you have Google chrome installed. You might also need to run the `setup_machine.sh` script, to make sure you have all dependencies of Google chrome headless installed, but probably not if you have Windows.

### Safari

Safari requires TLS to use WebSockets with ViewFinderJS. In order to set that up you'll need to get yourself some TLS certificates, and copy them to the `/sslcert/master/` directory. Then run as usual using `npm test` or `npm start`.

## Docker build

[Get it on docker hub](https://hub.docker.com/r/dosyago/browsergapce), and see instructions below.

## Headless Detection

Even tho RV uses headless Chrome, it attempts to conceal that fact. Sometimes, a service knows (such as Google, Google always knows). But othertimes the service cannot tell. For some tests of headless, visit the following when using RV:

- [Detect headless](https://infosimples.github.io/detect-headless) :heavy_check_mark:
- [Are you headless?](https://arh.antoinevastel.com/bots/areyouheadless) :heavy_check_mark:

## In depth

ViewFinder is a platform for live streaming the browser, with full interactivity. It lets you plug in to a local or remote, even a headless browser, and fly it as if it's a normal browser. 

You can stream a remote browser with special cusotmizations to your clients to side step the restrictions of regular browsers. You can use it to build rich experiences based on the browser that are not possible using Flash, Browser Extensions or regular Web Driver protocol. 

For business enquiries, please contact [Cris](mailto:cris@dosycorp.com?subject=ViewFinder)

[Watch the 16 second video](https://www.youtube.com/watch?v=SD0Fhl9v87k).

ViewFinder is a HTML/CSS/JavaScript "outer shell" for a browser. It also looks and works just like a browser, but it runs in your browser and controls another browser.

![browser in a browser](readme-files/tenor.gif)

## Managed Cloud Service (available now)

Login at https://dosyago.com and purchase a license. 

Try a session now for $3.81, first:

- https://comebrowsewithme.com

Contact [Cris](mailto:cris@dosycorp.com?subject=ViewFinder) for questions.

## Secure Cloud Based Internet Isolation

[Read more here](remote-browser-isolation.md)

### Set up using a blank machine (running Linux)

First set up the machine with git, and node (including nvm and npm) using the below:

If you want to speed up install and it hangs on `processing triggers for man-db` you can remove all your man pages (**WARNING**), with:
`sudo apt-get remove -y --purge man-db`

alternately, somebody reported they had luck with passing a `--force` to the apt command that seems to hang.

```shell
$ echo Update distro
$ sudo apt update && sudo apt -y upgrade
$ echo Install tools
$ sudo apt install -y curl wget git
$ echo Install node version manager
$ curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash
$ echo Load NVM
$ source $HOME/.profile
$ source $HOME/.nvm/nvm.sh
$ echo Install latest NodeJS
$ nvm install --lts
$ echo Install latest Node Package Manager
$ npm i -g npm
$ echo Setup ViewFinderJS
$ git clone https://github.com/i5ik/ViewFinderJS.git
$ cd ViewFinderJS
$ npm i
```

Then install and run VF from source:

```sh
git clone https://github.com/c9fe/ViewFinder
cd ViewFinder
npm i
npm test
```

If you'd like more control (over say the ports that chrome and the web app run on, you can pass those
parameters to the `start.sh` script, which has the following signature:

```sh
./start.sh <chrome_port> <app_port> <cookie_name> <username> token2
```

*Note: the audio port is always 2 less than the app_port*


### Docker 

*Note: running from docker image means you have no sound*

You can pull an existing image from docker hub (already [![docker pulls](https://img.shields.io/docker/pulls/dosyago/browsergapce)](https://hub.docker.com/r/dosyago/browsergapce))

```sh
docker pull dosyago/browsergapce:2.6
```

And then run it 

```sh
curl -o chrome.json https://raw.githubusercontent.com/c9fe/ViewFinder/master/chrome.json
sudo su -c "echo 'kernel.unprivileged_userns_clone=1' > /etc/sysctl.d/00-local-userns.conf"
sudo su -c "echo 'net.ipv4.ip_forward=1' > /etc/sysctl.d/01-network-ipv4.conf"
sudo sysctl -p
sudo docker run -d -p 8002:8002 --security-opt seccomp=$(pwd)/chrome.json dosyago/browsergapce:2.6
```


You can also build a docker image from source yourself (you probably want to be on the nexe-build branch, tho).

Set up the machine (as above in the **Set up** section), then

use clone the repo and install docker (`build_docker.sh` will do that for you) and build yourself an image:

```sh
git clone https://github.com/i5ik/ViewFinder
cd ViewFinder
git fetch --all
git branch nexe-build
./buld_docker.sh
./run_docker.sh 
```

And visit http://&lt;your ip&gt;:8002 to see it up.

## Awesome

Coming here from [Awesome Chrome DevTools](https://github.com/ChromeDevTools/awesome-chrome-devtools) or [awesome-puppeteer](https://github.com/transitive-bullshit/awesome-puppeteer)? 

Take a look at the [Zombie Lord connection](https://github.com/c9fe/ViewFinder/blob/master/zombie-lord/connection.js) and [Translate Voodoo CRDP](https://github.com/c9fe/ViewFinder/blob/master/public/translateVoodooCRDP.js).

## Opening DevTools

Just connect your browser to http://localhost:5002 from the machine you run it on.

## Connecting puppeteer

Just run PPTR on the same machine as this and connect to http://localhost:5002

## Other Similar Projects

- [Remote Browser](https://github.com/bepsvpt-me/remote-browser) - Use WebRTC to stream remote server puppeteer. Also, seems [that project was inspired by VF](https://learnku.com/nodejs/t/37088).
