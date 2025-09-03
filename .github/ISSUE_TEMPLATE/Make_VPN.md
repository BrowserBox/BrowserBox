---
name: Make VPN
about: Configure and start your BrowserBox VPN on GitHub Actions
title: 'Make VPN'
labels: enhancement
assignees: ''

---
# Personal BrowserBox (bbx) — Control Panel

Welcome! This is your **control panel**. Flip switches here; the Action handles the rest.
Watch for the **BrowserBox Status** comment below — it updates with progress and your login details.

---

## ✅ Repository checklist (do once)
- **Issues** enabled → Settings ▸ General ▸ Features → **Issues**
- **Actions** enabled → **Actions** tab
- **Secrets** added (Settings ▸ *Secrets and variables* ▸ *Actions* ▸ **New repository secret**)
  - `BB_LICENSE_KEY` — buy at https://dosaygo.com/commerce or email sales@dosaygo.com for a time-limited test key
  - `NGROK_AUTH_TOKEN` — **only if** you pick **ngrok**: https://dashboard.ngrok.com/get-started/your-authtoken

---

## 🔧 Options

**Power**
- [x] ON                     <!-- checked = start/run; uncheck to stop/prevent new runs -->
- [ ] OFF                    <!-- informational only -->

**Tunnel**
- [ ] ngrok
- [x] tor
- [ ] ssh                    <!-- not available in this workflow yet -->

**Encrypt login link?**
- [x] Encrypt                <!-- default ON; requires an SSH **RSA** key on your GitHub account -->

> Add SSH **RSA** key: https://github.com/settings/keys

---

## ▶️ How to run / retry
- Set your Options above, then **edit this issue** any time you want to (re)start:
  - Toggle **Power** **OFF → ON** to retry after fixing anything the status comment calls out.
- The Action will update the **BrowserBox Status** comment with progress and your login details when ready.

