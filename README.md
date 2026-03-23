<p align="center">
  <img src="icon.svg" alt="BrowserBox Logo" width="111" height="111">
</p>

<h1 align="center">BrowserBox by DOSAYGO</h1>

<p align="center">
  <strong>Secure, modern Remote Browser Isolation (RBI) with a clientless experience</strong>
</p>

<p align="center">
  <a href="https://dosaygo.com#license"><img src="https://img.shields.io/badge/License-Required-red" alt="License Required"></a>
  <a href="https://dosaygo.com"><img src="https://img.shields.io/badge/BrowserBox-Secure%20RBI-blue" alt="BrowserBox Secure RBI"></a>
  <a href="https://github.com/BrowserBox/BrowserBox/actions/workflows/bbx-saga.yaml"><img src="https://github.com/BrowserBox/BrowserBox/actions/workflows/bbx-saga.yaml/badge.svg?event=release" alt="bbx Saga Test Suite"></a>
</p>

<p align="center">
  <a href="https://win9-5.com/demo">Live Demo</a> |
  <a href="https://win9-5.com/api/">Cloud API Docs</a> |
  <a href="https://win9-5.com/pricing/">Pricing</a> |
  <a href="mailto:api@browserbox.io">Support</a>
</p>

---

> **Notice: Legacy source code removed (March 2026)**
>
> When BrowserBox transitioned to a binary distribution model in late 2025, we retained legacy source code in this repository for a six-month period to give existing customers time to migrate. That period is now over and all legacy source has been removed.
>
> Current BrowserBox source is private and proprietary. It diverges significantly from the legacy code that was previously housed here -- by over 1,000 commits -- with extensive bug fixes, security hardening, and performance enhancements that are absent from the legacy codebase and any forks thereof.
>
> Legacy source code may still be visible in third-party forks as a historical curiosity. That code is **not open source**. Permission is **not** granted to use that source in your products, to train AI models, or to re-implement BrowserBox functionality from it. These acts violate BrowserBox terms. See [LICENSE.md](LICENSE.md) and [TRADEMARK.md](TRADEMARK.md).
>
> Current source is available to customers above a threshold ACV as part of due diligence, on request. Contact [sales@dosaygo.com](mailto:sales@dosaygo.com).

---

BrowserBox&trade; is a remote browser isolation (RBI) platform for security teams, SaaS builders, and IT ops. It streams a full modern browser to any client with low latency and 60 FPS, supports embedding, and runs on Windows, Linux, and containers. **A product key is required for all self-hosted BrowserBox usage.**

## Install

### Linux & macOS

```bash
curl -fsSL https://browserbox.io/install.sh | bash
```

### Windows

```powershell
irm https://browserbox.io/install.ps1 | iex
```

### Via npm

```bash
npm i -g @browserbox/browserbox
```

## Quick Start

```bash
bbx install
bbx certify YOUR_PRODUCT_KEY
bbx setup
bbx run
```

## GitHub Actions

Launch BrowserBox directly on a GitHub Actions runner with [BrowserBox/browserbox-action](https://github.com/BrowserBox/browserbox-action).

- Supports `tunnel: none`, `cloudflare`, and `tor`
- Defaults to a minimal runner footprint with `BBX_MINIMAL_MODE=true`
- Disables update checks during runner launches with `BBX_NO_UPDATE=true`
- Requires a BrowserBox license key from [browserbox.io](https://browserbox.io)

```yaml
jobs:
  browserbox:
    runs-on: ubuntu-latest
    steps:
      - name: Launch BrowserBox
        id: browserbox
        uses: BrowserBox/browserbox-action@v1
        with:
          license-key: ${{ secrets.BROWSERBOX_LICENSE_KEY }}
          tunnel: cloudflare

      - name: Print login link
        run: echo "${{ steps.browserbox.outputs.login-link }}"
```

## Cloud API

Create on-demand ephemeral browser sessions without self-hosting. Purchase minute packs and manage sessions via REST.

```bash
curl -X POST https://win9-5.com/api/v1/sessions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"minutes": 15}'
```

Full API documentation: [win9-5.com/api](https://win9-5.com/api/)

## Embed BrowserBox

```html
<script src="https://win9-5.com/browserbox-webview.js" type="module"></script>
<browserbox-webview
  login-link="https://your-instance.com/login/abc123"
  width="1024"
  height="768">
</browserbox-webview>
```

The `<browserbox-webview>` element provides a session-host API with namespaced surfaces for tabs, pages, capture, augmentation, selection, and policy-gated capability control.

## Licensing

BrowserBox is a commercial product. All usage requires a valid license.

- **Commercial:** Starts at $99/user/year. [Purchase](https://dosaygo.com/commerce)
- **Non-Commercial:** $39/user/year (non-profits, government). [Purchase](https://dosaygo.com/noncommercial)
- **Evaluation:** [Apply for a 7-day trial](https://browserbox.io)
- **Enterprise / Source Access:** [sales@dosaygo.com](mailto:sales@dosaygo.com)

## Support

- **API & Technical:** [api@browserbox.io](mailto:api@browserbox.io)
- **General:** [support@dosaygo.com](mailto:support@dosaygo.com)
- **Sales & Licensing:** [sales@dosaygo.com](mailto:sales@dosaygo.com)

## About

BrowserBox&trade; is &copy; 2018-2026 DOSAYGO Corporation USA. All rights reserved.

[dosaygo.com](https://dosaygo.com) | [browserbox.io](https://browserbox.io) | [CloudTabs](https://browse.cloudtabs.net)
