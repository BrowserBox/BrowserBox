# :satellite: [BrowserGap](https://github.com/dosyago/BrowserGap) [![docker pulls](https://img.shields.io/docker/pulls/dosyago/browsergapce)](https://hub.docker.com/r/dosyago/browsergapce) ![version](https://img.shields.io/npm/v/remoteview) [![npm downloads](https://img.shields.io/npm/dt/remoteview)](https://www.npmjs.com/package/remoteview) [![binary downloads](https://img.shields.io/github/downloads/dosyago/BrowserGap/total?label=binary%20downloads)](https://github.com/dosyago/BrowserGap/releases/latest)

- Live stream the browser remotely.
- Embed a browser in another web application to integrate user flows.
- Perform remote browser isolation for security and automation.
- Run your browsers anywhere and connect to them from anywhera.
- Isolate your network from the risks of the public internet by running browsers in a remote machine.
- Connect to Chrome headless with a Browser User Interface

[More info at https://browsergap.dosyago.com](https://browsergap.dosyago.com)

## News
- **August 3 2020** ***BREAKING NEWS***
  - New self-hosted license prices are as follows:
    - Per seat, per year: USD$174.99
    - Government, private non-commercial individual, public journalism and non profit use: 
      - Free (under 10,000 seats)
      - USD$30.00 per seat per year (10,000 seats or more)
- **July 30 2020** New marketing/signup site (cloud browser SaaS with monthly subscription coming soon!) https://browsergap.dosyago.com Check it out!
- **July 26 2020** Merge changes from live demo into docker, npm and binaries.
- **July 18 2020** 
  - New client web app bundling improves load speed of browser UI.
  - Remove UI icons from .gitignore because they're no longer added on install, but instead are always in the repo.
  - New [docker builds](https://hub.docker.com/r/dosyago/browsergapce) and [releases](https://github.com/dosyago/BrowserGap/releases/latest) incorporating these changes. 
- **July 18 2020** Bug fix on master: Remove UI icons from .gitignore because they're no longer added on install, but instead are always in the repo.
- **July 15 2020** Run or install as global via `npx remoteview@latest` or `npm i -g remoteview@latest` (**Working!**)
- **July 14 2020** [New Binary releases!](https://github.com/dosyago/BrowserGap/releases/latest). Binaries now come with default args. Platforms available: Mac, Win, and Nix.
- **July 13 2020** New Docker Hub image with latest changes: [dosyago/browsergapce:2.2](https://hub.docker.com/r/dosyago/browsergapce)

## Things People Say They Want (but I don't necessarily believe)

- I want to be able to mask my userAgent and platform (so not send the one from your regular browser, this might break some things on websites but concievably I could put this behind settings)
- I want to be able to mask my IP (um, use a VPN? or run BG remotely from a machine with the IP you want to use, to hide the IP you connect to BG from).
- I want to be able to open DevTools inspector (this is possible, but not sure how popular it is, it will take some plumbing)
- I want better interactions (e.g, context menu doesn't work on iOS Safari)
- I want it to be faster (it seems to laggy)
- I want it to use less bandwidth (it takes so much bandwidth! *edit: actually it often saves you bandwidht, but hey, I get that it can sometimes use a lot*)
- I want the images it sends to be better quality (*edit: it will automatically adjust image quality based on bandwidth you have avilalbe, but concievably I could make the upper limit higher, say behind a setting*)

[Vote for these NOW on the Twitter Poll!](https://twitter.com/BrowserGap/status/1289462355475087360)

## Who uses this for free?

- Private individuals for non-commercial use
- Journalists for publicly available publications (so not specialized corporate press or internal publications), security researchers, researches at public institutions, government officers and members of non-profits in the course of their work, so long as you self-host and deploy yourself, or if you need help for deployment contract Dosyago corporation to help you with that.

**If you're using this, let me know how and let me know what you think.** You can open a PR to this REPO to add your use bio, or you can mail me: [cris@dosycorp.com](mailto:cris@dosycorp.com)

## Used By

- [The Free Demo](https://browsergap.dosyago.com)

## Who pays to use this?

- Anyone who deploys this for use in a for-profit environment, as part of any project intended to make money, or anyone non-covered by the free use exemption above.

[More info at https://browsergap.dosyago.com](https://browsergap.dosyago.com)

## Fee

**Unlimited Seat Per Site License** *normally USD$1,898 a month*. For a limited time, only USD$1,637 a month!

## Normal Browser UI things that work

- Copy and paste (paste is as normal, but for copy you need to use the right-click context menu)
- File upload
- File download (if self hosted, using cloud managed, or with secure file viewer license which is available on request, but not in free demo)
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

## Some ways people are using BrowserGap

- To embed other applications in their own web app to unite separate user flows, and overcome iframe restrictions.
- As a browser proxy to enable secure browsing on locked down internal networks

## Major bugs

- See the open issues, but most bugs are around interaction (such as multiple touch points) or client side quirks of browsers (like iOS Safari)

## About

This is a feature-complete, clientless, remote browser isolation product, in HTML/JavaScript that runs right in your browser. Integrated with a secure document viewer (available on request), this can provide safe remote browser isolation at deployments of any size. It also saves you bandwidth (on the last hop, anyway).

With BrowserGap, in order to render the content of a web page, the only thing we send to your device form the remote page is pixels. So no HTML, CSS, JavaScript, etc from your browsing is ever executed on your device.

![Animated GIF of BrowserGap in action](https://j.gifs.com/E8yzLv.gif)

**You see that? :point_up: That's a browser running in your browser. All those tabs and UI, that's all BrowserGap. It's sending you pixels from a remote browser, running anywhere.**

You can use this repo to play with a browser running remotely in the cloud, rather than on your own device. Useful for security and automation. 

If you're a developer you can include a "BrowserView" in any other web application (for non-commercial use only).

If you're like to deploy this in your org, or for a for-profit project, write me: cris@dosycorp.com Or keep an eye out for the cloud service, coming soon. Official government use OK without purchase (also for university/public institution researchers, journalists and not-for-profits), as long as deployment is done in-house (or using Dosyago Corporation, not by other contractors, nor part of a paid deployment). If you're in government and you'd like to deploy this and want help, contact me for help or to discuss a deployment contract.

## localhost:8002

By default (unless you provide command line arguments) it runs on port 8002.

## Why this over Solution X?

Sure, other companies might have bigger brands and bigger sales budgets, but this is open-source. You can vet the code, in the open, and so can anyone. You know there's nothing hidden inside. Plus, future updates have all the benefit of open-source software. 

There's a lot of competition out there, BrowserGap art more lovely and more temperate. Here's a selection of the most notable:

- [WEBGAP INC.](https://webgap.io/index.html) Fully hosted and managed solution. Aiming to cover the nexus of "low cost, widespread use", starting at just 5USD a head. I have not evaluated it, and there's no demo and no source code. But the website is beautiful! And it's [seed funded by a Royal Highness in the Al-Saud family](https://www.crunchbase.com/organization/webgap#section-investors) :sunglasses: how cool! Co-founder [Guise Bule](https://www.linkedin.com/in/guisebule), a tech-marketing veteran based stateside who describes himself as having "built some of the world's first remote browser platforms" at the NNSA, [blogs profusely](https://medium.com/secjuice/a-quick-guide-to-the-remote-browser-isolation-space-and-its-vendors-4c0e220e696a) about RBI and has recently joined the ranks of some regional Security and tech "think tanks", including Singapore's [ITSEC](https://www.itsec.asia/) and Silicon Valley Bank's Brains Trust.
- [McAfee nee Light Point Security](https://www.mcafee.com/blogs/enterprise/why-light-point-security-is-joining-the-mcafee-team/), the veterna cybersecurity incumbent acquired Light Point, a nascent (but also long-lived) RBI startup in 2020, which was founded around 2012 by ex-members of the US [Intelligence Community, Beau Adkins](https://www.linkedin.com/in/beauadkins/) and [Zuly Gonzalez](https://www.linkedin.com/in/zulygonzalez/). Again, there's no source-code and no demo and I have not evaluated the software, though it seems it is a highly user-focused web application, that is described in their PR copy as a clientless pure HTML/JavaScript RBI solution. The founders of the Maryland-based startup [surely know](https://www.prnewswire.com/news-releases/light-point-security-reveals-most-flexible-browser-isolation-platform-with-the-release-of-its-clientless-version-300797260.html) [what they are talking about.](https://twitter.com/zulygonz?lang=en)
- [Isoolate](https://www.isoolate.com/) founded by Turkish [ex military-tech contractors](https://www.linkedin.com/in/muratdemirten), is headquartered in the United States, and staffed with around 10 people around the world ([including New Zealand!](https://www.linkedin.com/in/aycan-firatli-19b9a939/)), develops a Chrome Extension (and possibly other software) that assists the client choose whether they want to access a page locally, or remotely, aiming to provide a seamless and highly-configurable experience. 

The main advantages of BrowserGap over any of these are:

- Free (for non-commercial or governmental use when self-hosted) and open-source. You can pay for install, or maintenance, or a managed cloud service (bring your own cloud, also OK!).
- Fully clientless (runs in your browser, nothing to download, but also available as download if you want to run locally easily).
- Not hiding anything. You can use the software now, and see how it works. No need for us to grant you lengthy demos to evaluate. You can try it yourself whenever you like. 

## Can I use this for Use Case Y, or Domain Z?

Probably. If you can think of it, you can probably do it.

## Get and self-host

Clone this repo

`git clone https://github.com/dosyago/BrowserGap.git`

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

If you're on Git Bash (or Cygwin, or Mingw) you might have trouble using `npm i -g remoteview`.

Make sure you configure npm 

`npm config set script-shell "C:\\Program Files\\git\\bin\\bash.exe"`

Also, don't worry about running "setup_machine" at the prompt, because it uses `apt-get` which won't work on Windows anyway.

Normally, a Windows device with chrome already installed won't need to run "setup_machine" anyway, which is a script to install things like fonts, graphics libraries and some utilities useful for running headless Chrome in linux.

### Binaries

**Pre-requisites: Windows, Mac OS or Linux with Chrome already installed.**

If you use a [binary](https://github.com/dosyago/BrowserGap/releases/latest), make sure you have Google chrome installed. You might also need to run the `setup_machine.sh` script, to make sure you have all dependencies of Google chrome headless installed, but probably not if you have Windows.

## Docker build

[Get it on docker hub](https://hub.docker.com/r/dosyago/browsergapce), and see instructions below.

## Headless Detection

Even tho RV uses headless Chrome, it attempts to conceal that fact. Sometimes, a service knows (such as Google, Google always knows). But othertimes the service cannot tell. For some tests of headless, visit the following when using RV:

- [Detect headless](https://infosimples.github.io/detect-headless) :heavy_check_mark:
- [Are you headless?](https://arh.antoinevastel.com/bots/areyouheadless) :heavy_check_mark:

## In depth

BrowserGap is a platform for live streaming the browser, with full interactivity. It lets you plug in to a local or remote, even a headless browser, and fly it as if it's a normal browser. 

You can stream a remote browser with special cusotmizations to your clients to side step the restrictions of regular browsers. You can use it to build rich experiences based on the browser that are not possible using Flash, Browser Extensions or regular Web Driver protocol. 

For business enquiries, please contact [Cris](mailto:cris@dosycorp.com?subject=BrowserGap)

[Watch the 16 second video](https://www.youtube.com/watch?v=SD0Fhl9v87k).

BrowserGap is a HTML/CSS/JavaScript "ground control" or "remote control" for a browser. It also looks and works just like a browser, but it runs in your browser and controls another browser.

![browser in a browser](readme-files/tenor.gif)

## Managed Cloud Service (coming soon)

## Free Demos (currently disabled)

Inquire about demos: cris@dosycorp.com

## Secure Cloud Based Internet Isolation Version for organizations

[Read more here](remote-browser-isolation.md)

## License And other Details

Formerly *BrowserGap Community Edition*. Currently called BrowserGap, and lets you interactively live-stream a remote browser.

This work is released under an OSS license, and is &copy; [Cris Stringfellow](https://github.com/cris691/Portfolio). All my own work. 

For [business inquiries, mail me](mailto:cris@dosycorp.com?subject=BrowserGap&body=Hey%20Cris%2C%0D%0A)

**Around 30,000 source lines of code** (see stats folder)

### Set up using a blank machine (running Linux)

First set up the machine with git, and node (including nvm and npm) using the below:

If you want to speed up install and it hangs on `processing triggers for man-db` you can remove all your man pages (**WARNING**), with:
`sudo apt-get remove -y --purge man-db`

```sh
sudo apt update && sudo apt -y upgrade
sudo apt install -y curl git wget
udo apt-get update && sudo apt-get -y upgrade
sudo apt -y install curl nodejs certbot vim
curl -sL https://deb.nodesource.com/setup_10.x -o nodesource_setup.sh
sudo bash ./nodesource_setup.sh
sudo apt -y install nodejs build-essential
curl -sL https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh -o install_nvm.sh
bash ./install_nvm.sh
source $HOME/.profile
source $HOME/.nvm/nvm.sh
nvm install --lts
sudo apt autoremove
npm i -g serve nodemon pm2 npm npx
sudo npm i -g serve nodemon pm2 npm npx
```

Then install and run BrowserGap from source:

```sh
git clone https://github.com/dosyago/BrowserGap
cd BrowserGap
npm i
npm start
```

### Docker 

*Note: running from docker image means you have no sound*

You can pull an existing image from docker hub (already [![docker pulls](https://img.shields.io/docker/pulls/dosyago/browsergapce)](https://hub.docker.com/r/dosyago/browsergapce))

```sh
docker pull dosyago/browsergapce:2.2
```

And then run it 

```sh
curl -o chrome.json https://raw.githubusercontent.com/dosyago/BrowserGap/master/chrome.json
sudo su -c "echo 'kernel.unprivileged_userns_clone=1' > /etc/sysctl.d/00-local-userns.conf"
sudo su -c "echo 'net.ipv4.ip_forward=1' > /etc/sysctl.d/01-network-ipv4.conf"
sudo sysctl -p
sudo docker run -d -p 8002:8002 --security-opt seccomp=$(pwd)/chrome.json dosyago/browsergapce:2.0
```


You can also build a docker image from source yourself (you probably want to be on the nexe-build branch, tho).

Set up the machine (as above in the **Set up** section), then

use clone the repo and install docker (`build_docker.sh` will do that for you) and build yourself an image:

```sh
git clone https://github.com/dosyago/BrowserGap
cd BrowserGap
git fetch --all
git branch nexe-build
./buld_docker.sh
./run_docker.sh 
```

And visit http://&lt;your ip&gt;:8002 to see it up.

## :sunglasses: Awesome

Coming here from [Awesome Chrome DevTools](https://github.com/ChromeDevTools/awesome-chrome-devtools)? 

Take a look at the [Zombie Lord connection](https://github.com/dosycorp/browsergap.ce/blob/master/zombie-lord/connection.js) and [Translate Voodoo CRDP](https://github.com/dosycorp/browsergap.ce/blob/master/public/translateVoodooCRDP.js).

## Opening DevTools

Just connect your browser to http://localhost:5002 from the machine you run it on.

## Connecting puppeteer

Just run PPTR on the same machine as this and connect to http://localhost:5002

## Other Similar Projects

- [Remote Browser](https://github.com/bepsvpt-me/remote-browser) - Use WebRTC to stream remote server puppeteer. Also, seems [that project was inspired by BrowserGap](https://learnku.com/nodejs/t/37088).
