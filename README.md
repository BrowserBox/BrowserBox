# browsergap.ce

Simple remote browser isolation application

The Community Edition version of the cloud-based internet isolation solution at https://browsergap.xyz

## Use

Download the repository and self-host on your own machine (at home, or in a VPS, VPC or the public cloud)

### E.g on Debian

```sh
$ git clone https://github.com/dosycorp/browsergap.ce.git
$ cd browsergap.ce
$ npm i
$ ./setup_machine.sh
$ npm test
```

Or

Try for free at https://free.cloudbrowser.xyz

### Detailed Instructions

Below is from an email I sent to a user to help them set up the first time:


```txt
Okay, I'm not sure about the VirtualBox part, but I'm doing a fresh install from a new droplet now
and I'll list the commands I'm using 1 by 1 in order to help resolve your issue.

(btw to use nodejs v12 I usually use nvm, but I don't bother installing node 12 for root, and I will run some BG processes using sudo, which lets them use the existing node (usually 10) and I have not noticed a problem).

ssh in to droplet, get a root prompt

$ apt update && apt upgrade

(get a weird error about Debian stretch being expired, okay, moving on)

(later found need to add 

Acquire::Check-Valid-Until "false";

to /etc/apt/apt.conf, okay)

$ apt install git

$ adduser --disabled-password user

$ update-alternatives --config editor

(selected vim)

$ visudo

(added

user ALL=(ALL) NOPASSWD:ALL

)

logout as root, ssh back in as user

$ sudo apt install curl
$ curl -sL https://deb.nodesource.com/setup_10.x -o nodesource_setup.sh
$ sudo bash ./nodesource_setup.sh
$ sudo apt-get install -y nodejs
$ sudo apt install build-essential

( okay so node 10 is now installed, now I'm going to install nvm
so I can use whatever node version I want )

$ curl -sL https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh -o install_nvm.sh
$ bash ./install_nvm.sh
$ source $HOME/.profile
$ nvm install --lts

(alright now node v12.13.0 is installed)

$ sudo npm i -g serve nodemon pm2
$ sudo apt install psmisc htop nethogs
$ sudo apt install libcgroup1 cgroup-tools

(okay that's a basic setup, now let's clone and install the bg)

$ git clone https://github.com/dosycorp/browsergap.ce.git
$ cd browsergap.ce
$ npm i

(put some coffee on)

$ npm test

(failed "change of cgroup failed")

$ ./setup_machine.sh
$ npm test

(failed same error)

(I edited the test.sh file to be
#!/bin/bash

username=$(whoami)
nodemon index.js 5002 8002 xxxcookie $username token2

(I have also updated the repo with this change now as well)
)

$ npm test

(works,

opened

http://<ip>:8002/ 

in Chrome browser and I can see the UI and it all works
```

That text is also at [this gist](https://gist.github.com/crislin2046/2fcd103234f93376c44d110d6295f32a)
