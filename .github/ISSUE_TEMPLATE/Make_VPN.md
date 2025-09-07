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

**Access**
- [x] ssh (use any browser)
- [ ] tor (use Tor Browser)

**Encrypt login link?** 
- [x] Encrypt                

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
- **Encrypted Login Link** Requires an RSA key in your GitHub SSH authentication keys. The first RSA key on your GitHub account is used. 
Add one at: https://github.com/settings/keys


### ▶️ How to run / retry
- Click to toggle Options, then **ON** for **Power** to (re)start.
- **BrowserBox Status** comment automatically updates progress and your login details when ready.

