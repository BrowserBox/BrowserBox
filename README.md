# :satellite: [BrowserGap](https://github.com/dosyago/BrowserGap) ![docker pulls](https://img.shields.io/docker/pulls/dosyago/browsergapce) ![version](https://img.shields.io/npm/v/remoteview) ![npm downloads](https://img.shields.io/npm/dt/browsergap)

## About

Formerly *BrowserGap Community Edition*. Currently called BrowserGap, and lets you interactively live-stream a remote browser.

This work is released under an OSS license, and is &copy; [Cris Stringfellow](https://github.com/cris691/Portfolio). All my own work. 

For [business inquiries, mail me](mailto:cris@dosycorp.com?subject=BrowserGap&body=Hey%20Cris%2C%0D%0A)

## Get and self-host

**Around 30,000 source lines of code** (see stats folder)

Glone this repo

`git clone https://github.com/dosyago/BrowserGap.git`

or Install from npm 

`npm i remoteview`

Then run `setup_machine.sh` in the repository directory.

Or, [get it on docker hub](https://hub.docker.com/r/dosyago/browsergapce), and see instructions below.

## Headless Detection

Even tho RV uses headless Chrome, it attempts to conceal that fact. Sometimes, a service knows (such as Google, Google always knows). But othertimes the service cannot tell. For some tests of headless, visit the following when using RV:

- [Detect headless](https://infosimples.github.io/detect-headless) :heavey_check_mark:
- [Are you headless?](https://arh.antoinevastel.com/bots/areyouheadless) :heavy_check_mark:

## In depth

BrowserGap is a platform for live streaming the browser, with full interactivity. It lets you plug in to a local or remote, even a headless browser, and fly it as if it's a normal browser. 

You can stream a remote browser with special cusotmizations to your clients to side step the restrictions of regular browsers. You can use it to build rich experiences based on the browser that are not possible using Flash, Browser Extensions or regular Web Driver protocol. 

For business enquiries, please contact [Cris](mailto:cris@dosycorp.com?subject=BrowserGap)

[Watch the 16 second video](https://www.youtube.com/watch?v=SD0Fhl9v87k), or just watch the GIF below:

![GIF of browser in action](https://j.gifs.com/E8yzLv.gif)

BrowserGap is a HTML/CSS/JavaScript "ground control" or "remote control" for a browser. It also looks and works just like a browser, but it runs in your browser and controls another browser.

![browser in a browser](readme-files/tenor.gif)

## Hosted Free Demo

Try for free at https://free.cloudbrowser.xyz

Or https://hk.cloudbrowser.xyz (if you're in Asia-Pac this is probably faster)

## Secure Cloud Based Internet Isolation Version for organizations

[Read more here](remote-browser-isolation.md)


### Set up

```sh
sudo apt update && sudo apt -y upgrade
sudo apt install -y curl git wget
git clone https://github.com/dosyago/BrowserGap
cd BrowserGap
./setup_machine.sh
npm test
```

Or (using docker build yourself for latest)

```sh
sudo apt update && sudo apt -y upgrade
sudo apt install -y curl git wget
git clone https://github.com/dosyago/BrowserGap
cd BrowserGap
./buld_docker.sh
./run_docker.sh 
```

Or (using docker pull from hub)

```sh
docker pull dosyago/browsergapce:1.0
curl -o chrome.json https://raw.githubusercontent.com/dosyago/BrowserGap/master/chrome.json
sudo su -c "echo 'kernel.unprivileged_userns_clone=1' > /etc/sysctl.d/00-local-userns.conf"
sudo su -c "echo 'net.ipv4.ip_forward=1' > /etc/sysctl.d/01-network-ipv4.conf"
sudo sysctl -p
sudo docker run -d -p 8002:8002 --security-opt seccomp=$(pwd)/chrome.json browsergapce:1.0
```

And visit http://&lt;your ip&gt;:8002 to see it up.

## :sunglasses: Awesome

Coming here from [Awesome Chrome DevTools](https://github.com/ChromeDevTools/awesome-chrome-devtools)? 

Take a look at the [Zombie Lord connection](https://github.com/dosycorp/browsergap.ce/blob/master/zombie-lord/connection.js) and [Translate Voodoo CRDP](https://github.com/dosycorp/browsergap.ce/blob/master/public/translateVoodooCRDP.js).

## Opening DevTools

Just connect your browser to http://localhost:5002 from the machine you run it on.

## Connecting puppeteer

Just run PPTR on the same machine as this and connect to http://localhost:5002

