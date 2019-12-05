# Robot Head

Robot Head (formerly, Open Browser Platform, BrowserGap, etc) is a UI and backend that turns headless Chrome into a regular browser, except the browser runs in the cloud not on your device. More than that you can build atop Chrome in ways that you can't using Chrome Extension APIs or the Chrome DevTools protocol. 

Things that aren't normally possible, become possible. 

Robot Head can be used to build all sorts of extensions to the normal Browser experience without needing to go through the Chrome WebStore. 

This is because the browser runs in headless mode and is controlled by DevTools (a string-based websocket protocol), interfaced with a simple frontend UI. 

You could extend this project by building a real OBP Extension store (using the more powerful DevTools API instead of the Chrome Extensions API), or you could just build your own extension on top of the work already here.

## One possible use case: Isolated Remote Browsers for security

OBP can be used as a simple remote browser isolation application. 

If you want a hosted or managed on-prem cloud-based internet isolation solution, check out my corporate page at https://browsergap.xyz

## Optics

[We're on HN](https://news.ycombinator.com/item?id=21561613) :tada: [...And we're doing it again!](https://news.ycombinator.com/item?id=21681065) :fearful: :see_no_evil:

If you're having service issues, publicly shame us [on Twitter](https://twitter.com/browsergap)

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

And visit http://<your ip>:8002 to see it up.

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
- Improve the latency and screen performance
- Extend and publish the API for the front-end and back-end to easily enable people to build plugins on top

### Bonus Section 

Becuase this works by running Chrome in headless mode and giving that headless Chrome a new head back (in the form of a front and back end to interace with the headless chrome to make it look like a normal browser), some clever folk have come up with a variety of quirky, unusual, funny and creative names for this:

[[Alternate Names]]:
- Bodyless :tada: :heavy_check_mark:
- Horseman :horse: :skull: :man: :heavy_check_mark:
- Bogeyhead ???
- BrowserGap
- Open Browser Platform
- Defanged Headful Chrome
