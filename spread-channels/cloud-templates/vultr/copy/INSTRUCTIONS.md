# BrowserBox Vultr Edition

## Setup Guide

Welcome to **BrowserBox**, your cutting-edge remote browser isolation solution! Your instance is spinning up now—here’s how to get it live and secure in just a few steps.

### 0. Pick Up Your License Key

Don’t have a BrowserBox License Key? No worries—just head to http://getbrowserbox.com or https://dosaygo.com and purchase 1 seat.

### 1. Deploy Your BrowserBox and Unlock the Firewall

Enter your License Key, Email, and hostname (e.g. `mybrowser.example.com` if you own `example.com`) into the Vultr dashboard. Then click **Deploy** to start your BrowserBox instance.

Next, open up the ports that let BrowserBox breathe:

- **80 (HTTP)** — for initial setup and TLS magic  
- **8078–8082 (TCP)** — the BrowserBox gateway to all its mighty services

⚠️ Don’t forget to add these firewall rules! You’ll find the firewall settings under the **Network** tab in the Vultr sidebar.  
🛡️ You can close port 80 once setup completes—it's only needed during initial setup.

### 2. Point Your DNS

Once the server is live and the firewall is open, go to your domain registrar (like GoDaddy or Name.com) and add a **DNS A Record**:

- **Domain**: `{{hostname}}`  
- **IP Address**: `{{ip}}`  

This connects your shiny new fortress to the internet. Once BrowserBox detects this record, setup will begin automatically.

### 3. Log In and Launch

Setup takes around 25 minutes (grab a coffee or consult the stars 🌌). Once it's ready, head to:

`https://{{hostname}}:8080/login?token={{token}}`

Boom — you’re browsing the web from a zero-trust fortress.

## Why BrowserBox?

Built by DOSYAGO, BrowserBox delivers **advanced remote browser isolation** for cybersecurity. It’s your shield against the wild web—powered by sleek, modern architecture, with source code available.

### Need Help?

Taking longer than 30 minutes? Something feel off?

- Head to your Vultr dashboard  
- Click **Server Reinstall** to try again  
- Or tap **View Console** to spot any errors

Still stuck? Reach out to us: **support@dosaygo.com**  
We’re here to make your BrowserBox experience stellar! 🚀
