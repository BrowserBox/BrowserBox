---
name: Make VPN
about: Start a short-lived personal BrowserBox via GitHub Actions (choose tunnel, encryption)
title: Make VPN
labels: enhancement
assignees: ''
---

# Set Up a Personal BrowserBox (bbx)

Before starting, **fork** or **generate** this repo to your **personal** account (not orgs).

### ✅ Repository checklist (Required)
- [ ] **Issues** are enabled → Settings ▸ General ▸ Features → Issues
- [ ] **Actions** are enabled → Actions tab
- [ ] Secrets added (**Settings ▸ Secrets and variables ▸ Actions ▸ New repository secret**)
  - [ ] `BB_LICENSE_KEY` – buy at https://dosaygo.com/commerce or email sales@dosaygo.com for a time-limited test key
  - [ ] `NGROK_AUTH_TOKEN` – **only** if you select **ngrok**: https://dashboard.ngrok.com/get-started/your-authtoken

---

### 🔧 Options (edit this section to choose)
**Tunnel (pick one):**
- [x] ngrok
- [ ] tor
- [ ] ssh  <!-- not available in this workflow yet -->

**Encrypt login link?**
- [ ] Encrypt  <!-- Requires an SSH **RSA** key on your GitHub account -->

> To add an **SSH RSA** key: https://github.com/settings/keys

---

### ▶️ Start it
When your repo checklist is complete and options above are set, **comment** `start` or `run`

The action will post the login details in a comment when your server is active (takes 5 - 10 minutes to install). Sessions run for ~40 minutes by default.

---

**Privacy notes**
- Issue comments are visible to anyone with repo access.
- If **Encrypt** is checked and you have an **SSH RSA** key on GitHub, your link will be posted **encrypted** with that key; only your matching private key can decrypt it. We’ll include a one-liner to decrypt locally.

*Powered by [DOSAYGO](https://dosaygo.com)*

