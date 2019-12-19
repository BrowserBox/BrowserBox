# Joystick

Joystick is a HTML/CSS/JavaScript front-end for your browser that is fully programmable. 

This means you can customize the browsing experience however you like, without having to fork it or modify its source code. You can even run Joystick remotely in the cloud against a headless browser and connect to it from anywhere. Or you can run it on your device. 

More than that you can build atop the Browser in ways that you can't using WebExtension APIs or with the DevTools protocol. 

Things that aren't normally possible, become possible. 

## Why?

- For more control. Do things that can't be done with Extensions. Do things you can't do with DevTools protocol. Totally change the UI.
- For more powerful apps. You can embed this as a component in a web app, and provide a full and fully customizable browser experience from your web or hybrid app. 
- For fun. Build your own browser. Break free of the restrictive UI. Break free of the monopoly control. :metal:
- Because you want to build something you can't otherwise. That's why I built this. I'm making an app on top of this that can record and playback user actions, to let you reduce the drudgery of repetitive tasks.

## One possible simple use case out of the box: Isolated Remote Browsers for security

JoyStick can be used as a simple remote browser isolation application. 

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
- Provide UI to install chrome extension
- build a replacement for the non-existent chromedriver / devtools extension Domain API
- Extend and publish the API for the front-end and back-end to easily enable people to build plugins on top
- Improve the latency and screen performance

### Why?

[Why I built my own browser (and you can too)](https://medium.com/@cris_39045/why-i-built-my-own-browser-and-you-can-too-9dda4b4de869)

### Connecting puppeteer

Just run PPTR on the same machine as BV and connect to localhost:5002

### Bonus Section 

Becuase this works by running Chrome in headless mode and giving that headless Chrome a new head back (in the form of a front and back end to interace with the headless chrome to make it look like a normal browser), some clever folk have come up with a variety of quirky, unusual, funny and creative names for this:

[[Alternate Names]]:
- Bodyless :tada: :heavy_check_mark:
- Horseman :horse: :skull: :man: :heavy_check_mark:
- Bogeyhead ???
- BrowserGap
- ChromeBoard
- BrowserView
- Open Browser Platform
- [DeFAANGED Headful Chrome](https://github.com/dosycorp/BrowserView/issues/20)
