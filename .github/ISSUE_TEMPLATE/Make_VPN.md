---
name: Make VPN
about: Set up an ephemeral, private VPN with BrowserBox via GitHub Actions
title: Make VPN
labels: enhancement
assignees: ''

---

# Set Up a BrowserBox VPN

Before starting, [fork](../fork) or [generate](../generate) this repo to your account (not for orgs).

Then ensure that:

1. [Issues](../settings#issue-feature) are switched on, and 
2. [Actions](actions) are enabled.

To begin the action, click **Submit New Issue**.  
Keep an eye on the comments — your login link or encrypted blob will appear there.

---

## ⚠️ Important Security Note

- If this repository is **public**, then issue comments are also public.  
- By default, your **login link will appear in plaintext** in the comments.  
- If you prefer your URL to **stay private**, add an **SSH RSA key** to your GitHub account at [GitHub SSH keys settings](https://github.com/settings/keys).  
  - The workflow will detect your RSA key and encrypt your link with it.  
  - Only your matching `~/.ssh/id_rsa*` or corresponding RSA private key can decrypt the blob.

> **Decryption instructions** will be included in the comment.

---

*Powered by [DOSAYGO](https://dosaygo.com)*

