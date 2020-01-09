# GroundControl

Deliver a browser over the web. 

GroundControl is a HTML/CSS/JavaScript interactive mask or "browser remote control" (inlcuding a front-end that works just like a browser). And it is fully programmable, and you can deliver it as a web app. So you get a browser within a browser, basically. It connects to a browser you run locally or in the cloud via DevTools. The connected browser can be headless or not. Oni don't care.

This means you can customize the browsing experience however you like, without having to fork it or modify its source code. You can even run supreme-architect remotely in the cloud against a headless browser and connect to it from anywhere. Or you can run it on your device. 
More than that you can build atop the Browser in ways that you can't using WebExtension APIs or with the DevTools protocol. 

Things that aren't normally possible, become possible. 

[Watch the 16 second video](https://www.youtube.com/watch?v=SD0Fhl9v87k), or just watch the GIF below:

![GIF of Oni browser in action](https://j.gifs.com/E8yzLv.gif)


## Use

Install from npm 

`npm i onibrowser`

Or clone and download the repository.

Then run `setup_machine.sh` in the repository directory.

You can self-host on your own machine (at home, or in a VPS, VPC or the public cloud)

You can run the browser you connect to in headless mode or normal mode.

### E.g on Debian

```sh
sudo apt update && sudo apt -y upgrade
sudo apt install -y curl git wget
git clone https://github.com/dosyago/GroundControl
cd GroundControl
./setup_machine.sh
npm test
```

Or (using docker build yourself)

```sh
sudo apt update && sudo apt -y upgrade
sudo apt install -y curl git wget
git clone https://github.com/dosyago/GroundControl
cd GroundControl
./buld_docker.sh
./run_docker.sh 
```

Or (using docker pull from hub)

```sh
docker pull dosyago/browsergapce:1.0
curl -o chrome.json https://raw.githubusercontent.com/dosyago/supreme-architect/master/chrome.json
sudo su -c "echo 'kernel.unprivileged_userns_clone=1' > /etc/sysctl.d/00-local-userns.conf"
sudo su -c "echo 'net.ipv4.ip_forward=1' > /etc/sysctl.d/01-network-ipv4.conf"
sudo sysctl -p
sudo docker run -d -p 8002:8002 --security-opt seccomp=$(pwd)/chrome.json browsergapce:1.0
```

And visit http://&lt;your ip&gt;:8002 to see it up.

Or

Try for free at https://free.cloudbrowser.xyz

Or https://hk.cloudbrowser.xyz (if you're in Asia-Pac this is probably faster)

### Detailed Instructions

An annotated transcript of an install is available at [this gist](https://gist.github.com/crislin2046/2fcd103234f93376c44d110d6295f32a).

### Running on Windows locally

Tested using latest Stable Node.JS and Git using Git bash. Clone as normal then run `npm i` then `./postinstall.sh` then modify `./zombie-lord/start_chrome.sh` to comment out and uncomment the lines preceeded by a `# windows ...` comment, as those lines indicate.
Then run `node index.js 5002 8002 xxxcookie username token2`

### Running locally in general

If you want you can also modify `zombie-lord/screenShots.js` to increase the quality and framerate of shots taken if you're running locally.

## Why?

- For more control. Do things that can't be done with Extensions. Do things you can't do with DevTools protocol. Totally change the UI.
- For more powerful apps. You can embed this as a component in a web app, and provide a full and fully customizable browser experience from your web or hybrid app. 
- For fun. Build your own browser. Break free of the restrictive UI. Break free of the monopoly control. :metal:
- Because you want to build something you can't otherwise. That's why I built this. I'm making an app on top of this that can record and playback user actions, to let you reduce the drudgery of repetitive tasks.

## One possible simple use case out of the box: Isolated Remote Browsers for security

Oni can be used as a simple remote browser isolation application. 

If you want a hosted or managed on-prem cloud-based internet isolation solution, check out my corporate page at https://browsergap.xyz

## Other cool use cases this enables:

- Build a plugin for Recording and playback of any sequence of user actions to create fully reproducible "web macros" that people can share. We're building this!
- A "webview" tag for the open web. The web view tag is connected to a remote browser and provides all fuctionalities of a webview tag (such as in Electron or Android).
- A "browser" tag for the open web. The browser tag is connected to a remote browser and provides all capabilities of a browser, including multiple tabs, history, an address bar and so on.
- A service that lets you run electron apps in the cloud, but connect to them on a browser. So a UI for electron apps that you run in the cloud. So take any electron app and convert it into a docker container and server that you run in the cloud and interface with over a front-end on the client. We're building this, it's called [CloudChamber](https://github.com/dosycorp/CloudChamber)!

## Optics

Coming here from [Awesome Chrome DevTools](https://github.com/ChromeDevTools/awesome-chrome-devtools)? Take a look at the ["Zombie Lord" connection](https://github.com/dosycorp/browsergap.ce/blob/master/zombie-lord/connection.js) and ["Translate Voodoo CRDP"](https://github.com/dosycorp/browsergap.ce/blob/master/public/translateVoodooCRDP.js) for the two files with the largest concentrations of CRDTP code.


### Development Roadmap

In no particular order:

- Automation, as in recording and replay of any user intent, or sequence of such (already exists in a basic and broken way)
- Provide UI to install extensions
- build a replacement for the non-existent chromedriver / devtools extension Domain API
- Extend and publish the API for the front-end and back-end to easily enable people to build plugins on top
- Improve the latency and screen performance

### Opening DevTools

Just connect your browser to http://localhost:5002 from the machine you run it on.

### Connecting puppeteer

Just run PPTR on the same machine as this and connect to localhost:5002


### Current version

v1.1.0
