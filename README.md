# BrowserView

## Build your own custom web browser and deploy it anywhere, even in the cloud!

BrowserView is an open-source project that lets you build your own when browser where you can customize everything, and deliver as a web app or Electron app. It does this by providing a free and open platform and API to let you build atop headless Chrome, leveraging the full power of the DevTools API, Chrome extensions, Node.JS and a front end to use this headless browser as a regular browser. You can deliver these experiences over the web, as a web app that acts like a real browser, or as a downloadable Electron app. You can think of it as a `<webview>` tag for the open web! Webview is a term for a component that provides a capability of a browser tab, such as the Android WebView, or Electron's `<webview>` tag or legacy "Chrome Apps" `<webview>` tag.

Technically, BrowserView (formerly named Robot Head, Open Browser Platform, BrowserGap, etc) is a UI and backend that turns headless Chrome into a regular browser, except the browser runs in the cloud not on your device. Only the UI front-end runs on your device, right in your normal browser (we even support iOS Safari going back to iPhone 4). More than that you can build atop Chrome in ways that you can't using Chrome Extension APIs or the Chrome DevTools protocol. 

Things that aren't normally possible, become possible. 

BrowserView can be used to build all sorts of extensions to the normal Browser experience without needing to go through the Chrome WebStore. 

This is because the browser runs in headless mode and is controlled by DevTools (a string-based websocket protocol), interfaced with a simple frontend UI. 

You could extend this project by building a real open browser extension store (using the more powerful DevTools API instead of the Chrome Extensions API), that people could run in their remote browser, or you could just build your own extension on top of the work already here.

## Why this instead of Chrome Extensions?

The Chrome extensions API is very limited. You can't run a server, you can't use UDP, you can't draw atop the UI in any way you like, you can't intercept and handle modal dialogs (like alert, prompt, etc), you can't programmatically respond to permissions requests, or file dialogs. Plus, every Chrome extension needs to be distributed through the extension store.

This platform lets you builds extremely rich extensions to the Chrome experience using the full power of Chrome headless, Node.JS, DevTools protocol and Chrome extensions. It's just more powerful, and it's more open and free because no particular company gate-keeps the access and publishing.

At the same time, this is not a replacement for Chrome extensions API, it is going further. You can build Chrome extensions and install them in the remote browser. There's no need to not use Chrome extensions. 

## Why this instead of puppeteer (or selenium, or phantomjs, etc)?

Mainly because it's so much more powerful than just a protocol to automate a browser. PPTR (and the rest) are basically just simple wrappers around the raw DevTools protocol, and they do not have any front end. So you need to build your own front-end if you want to use PPTR to deliver rich browser plugins. Robot Head extends the basic DevTools protocol in many ways.

For instance, PPTR (et al) do not have any easy way to handle multiple tabs, and there are many many things that require having multiple tabs open (interactions between apps, social login, popups). This project handles all that book-keeping and state to make interacting with multiple tabs simple.

Further, PPTR (et al) are designed around a specific use-case (testing and artificial automation) and they do this brilliantly, but outside of these bounds they become limiting factors. This project is an open protocol designed to support more demanding use cases, including building web apps that have the full power of Chrome, and that involve automating the browser as a user would, which removes a lot of edge cases where websites will not automate correctly with PPTR (and the rest). The acid test is that we can ship a front-end (accessible over the web) that nevertheless acts exatly like a browser. Using PPTR alone this is not possible. 

If you want to, you can connect PPTR to the remote browser that you create with BrowserView, so you can use the BrowserView protocol and the PPTR protocol at the same time. 

## Why this instead of Electron?

Electron requires you to download a large package. That does provide good native integration, at the same time, people criticize the size of the download and the performance and memory demands of simple Electron apps. If you wanted to use Electron mostly for the webview and Node.JS capabilities, you could definitely build atop BrowserView to deliver the same service through a browser from the cloud. At the same time, if you're attached to a downloadable app, that's not a problem. This is not necessarily a replacement for Electron, but it can complement it. For example, instead of asking people to download your massive Electron app, you could run that app in the cloud, and serve the experience as a front-end using BrowserView. In fact, we're [building this as a service](https://github.com/dosycorp/CloudChamber)!

## One possible simple use case out of the box: Isolated Remote Browsers for security

BrowserView can be used as a simple remote browser isolation application. 

If you want a hosted or managed on-prem cloud-based internet isolation solution, check out my corporate page at https://browsergap.xyz

## Other cool use cases this enables:

- Build a plugin for Recording and playback of any sequence of user actions to create fully reproducible "web macros" that people can share. We're building this!
- A "webview" tag for the open web. The web view tag is connected to a remote browser and provides all fuctionalities of a webview tag (such as in Electron or Android).
- A "browser" tag for the open web. The browser tag is connected to a remote browser and provides all capabilities of a browser, including multiple tabs, history, an address bar and so on.
- A service that lets you run electron apps in the cloud, but connect to them on a browser. So a UI for electron apps that you run in the cloud. So take any electron app and convert it into a docker container and server that you run in the cloud and interface with over a front-end on the client. We're building this, it's called [CloudChamber](https://github.com/dosycorp/CloudChamber)!

## Optics

Coming here from [Awesome Chrome DevTools](https://github.com/ChromeDevTools/awesome-chrome-devtools)? Take a look at the ["Zombie Lord" connection](https://github.com/dosycorp/browsergap.ce/blob/master/zombie-lord/connection.js) and ["Translate Voodoo CRDP"](https://github.com/dosycorp/browsergap.ce/blob/master/public/translateVoodooCRDP.js) for the two files with the largest concentrations of CRDTP code.

## Use

Download the repository and self-host on your own machine (at home, or in a VPS, VPC or the public cloud)

### E.g on Debian

```sh
sudo apt update && sudo apt -y upgrade
sudo apt install -y curl git wget
git clone https://github.com/dosycorp/browsergap.ce.git
cd browsergap.ce
./setup_machine.sh
npm test
```

Or (using docker build yourself)

```sh
sudo apt update && sudo apt -y upgrade
sudo apt install -y curl git wget
git clone https://github.com/dosycorp/browsergap.ce.git
cd browsergap.ce
./buld_docker.sh
./run_docker.sh 
```

Or (using docker pull from hub)

```sh
docker pull dosyago/browsergapce:1.0
curl -o chrome.json https://raw.githubusercontent.com/dosycorp/browsergap.ce/master/chrome.json
sudo su -c "echo 'kernel.unprivileged_userns_clone=1' > /etc/sysctl.d/00-local-userns.conf"
sudo su -c "echo 'net.ipv4.ip_forward=1' > /etc/sysctl.d/01-network-ipv4.conf"
sudo sysctl -p
sudo docker run -d -p 8002:8002 --security-opt seccomp=$(pwd)/chrome.json browsergapce:1.0
```

And visit http://&lt;your ip&gt;:8002 to see it up.

Or

Try for free at https://free.cloudbrowser.xyz

Or https://hk.cloudbrowser.xyz (if you're in Asia-Pac this is probably faster)

Would it be impossible for you to invest more time in your security? 

If the answer is NO, then please email me at cris@dosycorp.com OR cris@dosyago.com to discuss how our RBI/CBII solution may assist you.

### Detailed Instructions

An annotated transcript of an install is available at [this gist](https://gist.github.com/crislin2046/2fcd103234f93376c44d110d6295f32a).

### Development Roadmap

In no particular order:

- Automation, as in recording and replay of any user intent, or sequence of such (already exists in a basic and broken way)
- Extend and publish the API for the front-end and back-end to easily enable people to build plugins on top
- Improve the latency and screen performance


### Bonus Section 

Becuase this works by running Chrome in headless mode and giving that headless Chrome a new head back (in the form of a front and back end to interace with the headless chrome to make it look like a normal browser), some clever folk have come up with a variety of quirky, unusual, funny and creative names for this:

[[Alternate Names]]:
- Bodyless :tada: :heavy_check_mark:
- Horseman :horse: :skull: :man: :heavy_check_mark:
- Bogeyhead ???
- BrowserGap
- Open Browser Platform
- [DeFAANGED Headful Chrome](https://github.com/dosycorp/BrowserView/issues/20)
