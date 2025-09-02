---
name: Make VPN
about: Start a short-lived personal BrowserBox via GitHub Actions (choose ngrok or Tor)
title: Make VPN
labels: enhancement
assignees: ''
---

# Set Up a VPN (bbx)

Before starting, **fork** or **generate** this repo to your **personal** account (not orgs).

Make sure:
1. [Issues](../settings#issue-feature) are enabled  
2. [Actions](../actions) are enabled  
3. Add repo **secrets**:
   - `BB_LICENSE_KEY` – buy at https://dosaygo.com/commerce or email sales@dosaygo.com for a time-limited test key
   - `NGROK_AUTH_TOKEN` – only needed if you use **ngrok** (default) https://dashboard.ngrok.com/get-started/your-authtoken

**Choose tunnel by comment:**
- Do nothing → **ngrok** (default)
- Comment `mode: tor` (or just `tor`) → **Tor hidden service**

---

## 🔐 Privacy of your login link

- Issue comments are visible to anyone who can see this repo.  
- By default, your login link is posted **in plaintext**.  
- If you prefer your URL to **stay private**, add an **SSH RSA key** to your GitHub account at [GitHub SSH keys settings](https://github.com/settings/keys).  
  - The workflow will detect your RSA key and encrypt your link with it.  
  - Only your matching `~/.ssh/id_rsa*` or corresponding RSA private key can decrypt the blob.

> **Decryption instructions** will be included in the comment.

---

*Powered by [DOSAYGO](https://dosaygo.com)*

