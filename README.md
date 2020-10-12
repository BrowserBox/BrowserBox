# [:camera: ViewFinder](https://github.com/cris691/ViewFinder) [![docker pulls](https://img.shields.io/docker/pulls/dosyago/browsergapce)](https://hub.docker.com/r/dosyago/browsergapce) ![version](https://img.shields.io/npm/v/remoteview) [![npm downloads](https://img.shields.io/npm/dt/remoteview)](https://www.npmjs.com/package/remoteview) [![binary downloads](https://img.shields.io/github/downloads/cris691/ViewFinder/total?label=binary%20downloads)](https://github.com/cris691/ViewFinder/releases/latest)

## License 

To purchase a license for use contact cris@dosycorp.com and see https://browsergap.dosyago.com for options.

[Get the latest binary release](https://github.com/cris691/ViewFinder/releases)

- Embed a browser in another web application to integrate user flows.
- Isolate your network from the risks of the public internet by running browsers in a remote machine.
- Protect your network from [Browser Zero-day exploits](https://www.radsix.com/dashboard1/)

[More info at on fully managed versions https://browsergap.dosyago.com](https://browsergap.dosyago.com)

## Managed API: `VF.openSecurely(url: URI)`

An API to open a link in a secure remote browser context. Calling the below in the browser will open a new tab.

```js
  import ViewFinder from './web_modules/@dosy/browsergapjs.js';
 
  const VF = ViewFinder('<my api key>');
  
  VF.openSecurely(url);
```

If you want to see a demo of that in action, check out: [https://isolation.site](https://isolation.site)

These APIs support the full package include secure document viewing. [Use the SDK](https://github.com/dosyago/browsergap.js)

## Try it out

- [The Free Demo](https://browsergap.dosyago.com)

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

## Some ways people are using ViewFinder

- To embed other applications in their own web app to unite separate user flows, and overcome iframe restrictions.
- As a browser proxy to enable secure browsing on locked down internal networks

## Major bugs

- See the open issues, but most bugs are around interaction (such as multiple touch points) or client side quirks of browsers (like iOS Safari)

## About

This is a feature-complete, clientless, remote browser isolation product, in HTML/JavaScript that runs right in your browser. Integrated with a secure document viewer (available on request), this can provide safe remote browser isolation at deployments of any size. It also saves you bandwidth (on the last hop, anyway).

With ViewFinder, in order to render the content of a web page, the only thing we send to your device form the remote page is pixels. So no HTML, CSS, JavaScript, etc from your browsing is ever executed on your device.

![Animated GIF of ViewFinder in action](https://j.gifs.com/E8yzLv.gif)

**You see that? :point_up: That's a browser running in your browser. All those tabs and UI, that's all ViewFinder. It's sending you pixels from a remote browser, running anywhere.**

You can use this repo to play with a browser running remotely in the cloud, rather than on your own device. Useful for security and automation. 

If you're a developer you can include a "BrowserView" in any other web application (for non-commercial use only).

If you're like to deploy this in your org, or for a for-profit project, write me: cris@dosycorp.com Or keep an eye out for the cloud service, coming soon. Official government use OK without purchase (also for university/public institution researchers, journalists and not-for-profits), as long as deployment is done in-house (or using Dosyago Corporation, not by other contractors, nor part of a paid deployment). If you're in government and you'd like to deploy this and want help, contact me for help or to discuss a deployment contract.

## localhost:8002

By default (unless you provide command line arguments) it runs on port 8002.

## Get and self-host

Clone this repo

`git clone https://github.com/cris691/ViewFinder.git`

Then run `npm i` in the repository directory, followed by `npm start` to start on the default port.

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

## Managed Cloud Service (coming soon)

## Free Demos (currently disabled)

Inquire about demos: cris@dosycorp.com

## Secure Cloud Based Internet Isolation

[Read more here](remote-browser-isolation.md)

### Set up using a blank machine (running Linux)

First set up the machine with git, and node (including nvm and npm) using the below:

If you want to speed up install and it hangs on `processing triggers for man-db` you can remove all your man pages (**WARNING**), with:
`sudo apt-get remove -y --purge man-db`

alternately, somebody reported they had luck with passing a `--force` to the apt command that seems to hang.

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

Then install and run ViewFinder from source:

```sh
git clone https://github.com/cris691/ViewFinder
cd ViewFinder
npm i
npm start
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
docker pull dosyago/browsergapce:2.4
```

And then run it 

```sh
curl -o chrome.json https://raw.githubusercontent.com/cris691/ViewFinder/master/chrome.json
sudo su -c "echo 'kernel.unprivileged_userns_clone=1' > /etc/sysctl.d/00-local-userns.conf"
sudo su -c "echo 'net.ipv4.ip_forward=1' > /etc/sysctl.d/01-network-ipv4.conf"
sudo sysctl -p
sudo docker run -d -p 8002:8002 --security-opt seccomp=$(pwd)/chrome.json dosyago/browsergapce:2.0
```


You can also build a docker image from source yourself (you probably want to be on the nexe-build branch, tho).

Set up the machine (as above in the **Set up** section), then

use clone the repo and install docker (`build_docker.sh` will do that for you) and build yourself an image:

```sh
git clone https://github.com/cris691/ViewFinder
cd ViewFinder
git fetch --all
git branch nexe-build
./buld_docker.sh
./run_docker.sh 
```

And visit http://&lt;your ip&gt;:8002 to see it up.

## :sunglasses: Awesome

Coming here from [Awesome Chrome DevTools](https://github.com/ChromeDevTools/awesome-chrome-devtools) or [awesome-puppeteer](https://github.com/transitive-bullshit/awesome-puppeteer)? 

Take a look at the [Zombie Lord connection](https://github.com/dosycorp/browsergap.ce/blob/master/zombie-lord/connection.js) and [Translate Voodoo CRDP](https://github.com/dosycorp/browsergap.ce/blob/master/public/translateVoodooCRDP.js).

## Opening DevTools

Just connect your browser to http://localhost:5002 from the machine you run it on.

## Connecting puppeteer

Just run PPTR on the same machine as this and connect to http://localhost:5002

## Other Similar Projects

- [Remote Browser](https://github.com/bepsvpt-me/remote-browser) - Use WebRTC to stream remote server puppeteer. Also, seems [that project was inspired by ViewFinder](https://learnku.com/nodejs/t/37088).
