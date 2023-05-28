# BrowserBoxPro Setup Guide

**Clones per month:** 130

**🌟 Video Installation Guide for Pro: https://youtu.be/cGUJCCPDWNE**

## Overview

This guide provides step-by-step instructions to install and run the BrowserBoxPro application, as well as detailed system requirements and troubleshooting tips. The installation process should be executed from bash (bourne shell). While other shells may work, they could potentially disrupt some install scripts.

## Troubleshooting

If you have trouble with the setup or installation, the first step is always the following:

1. `./deploy-scripts/troubleshoot.sh` (reset any running BB instances) 
2. `./deploy-scripts/globall_install.sh <domain name>` (run installation again)
 
Ensure you're present for the whole install and respond to any prompts (responses need to be Y or yes when asked Y/n for a successful install). You can normally ignore any errors that occur during install. If you still have trouble or something really unusual occurs, email us at: help@dosyago.com. Some helpful output to provide is the output of the install process, as well as the output from running "setup_bbpro --port 8080; bbpro; pm2 logs"

## Initial Machine Setup

Below is a sample setup process on Debian, which includes upgrading your packages, setting up a sudo user, and installing necessary tools (git, curl, wget).

As `root` user, execute the following commands:

1. `adduser pro` - Create a user to operate BrowserBoxPro.
2. `usermod -L pro` - Disable the password for the newly created user.
3. `addgroup sudoers` - Create a new group for sudo privileges.
4. `visudo` - Add `%sudoers ALL=(ALL) NOPASSWD:ALL` to the sudoers file to avoid entering a password for sudo operations.
5. `usermod -G sudoers pro` - Grant sudo privileges to the user.

Now, switch to the newly created user with `sudo -u pro bash`, then perform the following:

1. `sudo apt update && sudo apt -y upgrade` - Update and upgrade your packages.
2. `sudo apt install git curl wget` - Install git, curl, and wget tools.

The next step is to open **a TCP port block** around your main port. In this example, we'll use port `8080` as your main browser service port.

Each browser instance operates 3 services (audio, devtools, and browser), each requiring a port. However, for redundancy, we use a block of 5 ports. These services run on distinct ports:

- Main browser service: input port (e.g., 8080)
- Audio service: browser service port - 2 (e.g., 8078)
- Devtools service: browser service port + 1 (e.g., 8081)

This configuration allows the main browser service to run on the middle port of the block, providing space for two supplementary services on either side. Consequently, you should open a block of 5 ports centered on 8080, i.e., open TCP ports 8078 through 8082.

At this point, your machine is set up and ready for BrowserBoxPro installation.

## Installation Process

**:warning: Caution:** Be sure to install from a non-`root` user with `sudo` permissions (for instance, the `pro` user from the previous example). Some components may not function correctly if installed as root, although they do require `sudo` for installation.

ℹ️ Set up your hostname DNS records for your VPS before installing, as LetsEncrypt certificates are used for the web application. This refers to `domain_name` in step 3 below.

During the installation, you will need to respond to several prompts with "Y", so please ensure to follow through without letting the process time out.

Execute the following commands:

1. `git clone https://github.com/dosyago/BrowserBoxPro`
2. `cd BrowserBoxPro`
3. `./deploy-scripts/global_install.sh <domain_name>` (the domain name that points to the machine you're doing this setup on)
4. `setup_bbpro --port 8080` - This command starts the main service on port 8080 and generates the login link.
5. `bbpro`

Finally, use the login link generated in step 4 to connect to the virtual browser (via a regular mobile or desktop browser). 

ℹ️ You may encounter some errors during the installation. As long as the installation completes, these errors can be ignored; they typically arise due to variations in operating systems.

## Recommended System Requirements

- Debian VPS with 2 core, 4 GB RAM, and 100 GB SSD
- At least 10 Mbps connection
- A public hostname with a DNS A record pointing to your VPS's IP. We use this to provision a TLS certificate, which forms part of the login link.

The actual requirements may vary depending on your browsing needs. However, the above configuration should provide satisfactory performance for a range of browsing tasks. If you require better performance, consider upgrading your hardware.

To minimize lag and boost framerate, locate the server as close to you as possible. Round-trip time (RTT) significantly influences performance, since remote browser isolation is essentially a real-time interactive video streaming application.

## MacOS Troubleshooting

If you intend to run BrowserBoxPro locally on MacOS, ensure it is launched from a terminal under Rosetta due to some native libraries used by node dependencies. Also, switch to a node version installed under a Rosetta terminal (such that `node -p process.arch` returns x86 or x64).

## Running Locally

⚠️ Note: Performance tends to be poorer when running locally (client and browser on the same machine) compared to operating across a network link.

Before running `bbpro`, ensure Chrome is entirely shut down, as it needs to start in headless mode for BrowserBoxPro.

## Shutting Down

To terminate the running BrowserBoxPro services, type `pm2 delete all` in the terminal.

## License

This code is free for non-commercial use, including by governments or public institutions as per [the Polyform Non-commercial License 1.0](LICENSE)
