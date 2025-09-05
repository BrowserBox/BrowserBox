---
name: Make VPN
about: Configure and start your BrowserBox VPN on GitHub Actions
title: 'Make VPN'
labels: enhancement
assignees: ''
---

# BrowserBox (bbx) — Control Panel

Welcome! This is your **control panel**. Flip switches here; the Action handles the rest.
Watch for the **BrowserBox Status** comment below — it updates with progress and your login details.

---

## 🔧 Options

**Tunnel**
- [x] tor
- [ ] ssh  (localhost.run)

**Encrypt login link?**
- [x] Encrypt                <!-- default ON; requires an SSH **RSA** key on your GitHub account -->

---

## ⚡ Power On/Off

**Power**
- [ ] ON                     <!-- checked = start/run; uncheck to stop/prevent new runs -->

---

## Requirements & Help

### ✅ Repository checklist (do once)
- **Issues** enabled → Settings ▸ General ▸ Features → **Issues**
- **Actions** enabled → **Actions** tab
- **Secrets** added (Settings ▸ *Secrets and variables* ▸ *Actions* ▸ **New repository secret**)
  - `BB_LICENSE_KEY` — buy at https://dosaygo.com/commerce or email sales@dosaygo.com for a time-limited test key
- Want to encrypt your login link? The first RSA key on your GitHub account is used. 
Add an SSH **RSA** key if you don't have one: https://github.com/settings/keys


### ▶️ How to run / retry
- Edit this issue to set Options, then toggle **Power** **OFF → ON** to (re)start.
- The Action updates the **BrowserBox Status** comment with progress and your login details when ready.

