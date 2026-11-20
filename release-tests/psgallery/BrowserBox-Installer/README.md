# BrowserBox Installer for Windows

BrowserBox runs a browser on Windows infrastructure you control and streams an interactive session to users in their browsers.

## Install

Install the module from the PowerShell Gallery, then run its installer command.

```powershell
Install-Module -Name BrowserBox-Installer -Scope CurrentUser
Install-BrowserBox
```

Run `Install-BrowserBox -Help` first to see the options and environment overrides without installing anything.

If PowerShell Gallery cannot download or extract the module, use the [official Windows installer instructions](https://docs.browserbox.io/installation/#sec:windows).

## Get a license and run BrowserBox

BrowserBox requires a valid license, including for evaluations. See [pricing and purchase options](https://browserbox.io/pricing), [request a free 14-day organization evaluation](https://browserbox.io/evaluate#free) for up to two concurrent sessions, or [start a paid 7-day evaluation](https://browserbox.io/evaluate#paid). Organization requests are subject to review.

Follow the [first-run guide](https://docs.browserbox.io/installation/#suggested-first-run) to activate your key, configure BrowserBox, and start your first session.
