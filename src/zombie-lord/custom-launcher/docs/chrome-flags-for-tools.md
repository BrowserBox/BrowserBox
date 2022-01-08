Many tools maintain a list of runtime flags for Chrome to configure the environment. This file
is an attempt to document all chrome flags that are relevant to tools, automation, benchmarking, etc.

All use cases are different, so you'll have to choose which flags are most appropriate.

## Flags

### `--disable-extensions`
Disable all chrome extensions.

### `--disable-component-extensions-with-background-pages`
Disable some built-in extensions that aren't affected by `--disable-extensions`

### `--disable-background-networking`
Disable various background network services, including extension updating,
safe browsing service, upgrade detector, translate, UMA

### `--disable-sync`
Disable syncing to a Google account

### `--metrics-recording-only`
Disable reporting to UMA, but allows for collection

### `--disable-default-apps`
Disable installation of default apps on first run

### `--mute-audio`
Mute any audio

### `--no-default-browser-check`
Disable the default browser check, do not prompt to set it as such

### `--no-first-run`
Skip first run wizards

### `--disable-background-timer-throttling`
Disable timers being throttled in background pages/tabs

### `--disable-client-side-phishing-detection`
Disables client-side phishing detection.

### `--disable-popup-blocking`
Disable popup blocking.  `--block-new-web-contents` is the strict version of this.

### `--disable-prompt-on-repost`
Reloading a page that came from a POST normally prompts the user.

### `--enable-automation`
Disable a few things considered not appropriate for automation. ([Original design doc](https://docs.google.com/a/google.com/document/d/1JYj9K61UyxIYavR8_HATYIglR9T_rDwAtLLsD3fbDQg/preview)) [codesearch](https://cs.chromium.org/search/?q=kEnableAutomation&type=cs)

* disables the password saving UI (which covers the usecase of the [removed](https://bugs.chromium.org/p/chromedriver/issues/detail?id=1015) `--disable-save-password-bubble` flag)
* disables infobar animations
* disables dev mode extension bubbles (?), and doesn't show some other info bars
* disables auto-reloading on network errors ([source](https://cs.chromium.org/chromium/src/chrome/renderer/net/net_error_helper_core.cc?l=917&rcl=6eaf0af71262eb876764c6237ee2fe021a3e7a18))
* means the default browser check prompt isn't shown
* avoids showing these 3 infobars: ShowBadFlagsPrompt, GoogleApiKeysInfoBarDelegate, ObsoleteSystemInfoBarDelegate
* adds this infobar:

![image](https://user-images.githubusercontent.com/39191/30349667-92a7a086-97c8-11e7-86b2-1365e3d407e3.png)

### `--password-store=basic`
Avoid potential instability of using Gnome Keyring or KDE wallet. crbug.com/571003

### `--use-mock-keychain`
Use mock keychain on Mac to prevent blocking permissions dialogs

### `--test-type`
Basically the 2014 version of `--enable-automation`. [codesearch](https://cs.chromium.org/search/?q=kTestType%5Cb&type=cs)

* It avoids creating application stubs in ~/Applications on mac.
* It makes exit codes slightly more correct
* windows navigation jumplists arent updated https://bugs.chromium.org/p/chromium/issues/detail?id=389375
* doesn't start some chrome StartPageService
* disables initializing chromecast service
* "Component extensions with background pages are not enabled during tests because they generate a lot of background behavior that can interfere."
* when quitting the browser, it disables additional checks that may stop that quitting process. (like unsaved form modifications or unhandled profile notifications..)

### `--disable-browser-side-navigation`
Disable PlzNavigate.

## Flags to triage

These flags are being used in various tools. They also just need to be documented with their effects and confirmed as still present in Chrome.

```sh
--process-per-tab
--new-window
--allow-running-insecure-content
--silent-debugger-extension-api

--disable-notifications
--disable-desktop-notifications
--disable-component-update
--disable-background-downloads
--disable-add-to-shelf
--disable-datasaver-prompt
--disable-domain-reliability
--disable-breakpad # Disable crashdump collection (reporting is already disabled in Chromium)
--disable-features=site-per-process # Disables OOPIF. https://www.chromium.org/Home/chromium-security/site-isolation
--disable-hang-monitor

--disable-backgrounding-occluded-windows
--disable-ipc-flooding-protection # https://crrev.com/604305

--disable-renderer-backgrounding # This disables non-foreground tabs from getting a lower process priority
                                 # This doesn't (on its own) affect timers or painting behavior.
                                 # https://github.com/karma-runner/karma-chrome-launcher/issues/123

--remote-debugging-pipe # more secure than using protocol over a websocket
--enable-logging=stderr # Logging behavior slightly more appropriate for a server-type process.
--log-level=0 # 0 means INFO and higher.
--block-new-web-contents # All pop-ups and calls to window.open will fail.
--js-flags=--random-seed=1157259157 --no-script-streaming
--autoplay-policy=user-gesture-required # Don't render video

--disable-dev-shm-usage # https://github.com/GoogleChrome/puppeteer/issues/1834
--no-sandbox # often used with headless, though ideally you don't need to.

# Headless rendering stuff I definitely don't understand
--run-all-compositor-stages-before-draw
--disable-new-content-rendering-timeout
--enable-features=SurfaceSynchronization
--disable-threaded-animation
--disable-threaded-scrolling
--disable-checker-imaging
--disable-image-animation-resync
--use-gl="" # use angle/swiftshader?
```


## Removed flags

### ~`--disable-translate`~
[Removed April 2017](https://codereview.chromium.org/2819813002/) Used to disable built-in Google Translate service.

### ~`--ignore-autoplay-restrictions`~
[Removed December 2017](https://chromium-review.googlesource.com/#/c/816855/) Can use `--autoplay-policy=no-user-gesture-required` instead.

## Sources

* [chrome-launcher's flags](https://github.com/GoogleChrome/chrome-launcher/blob/master/src/flags.ts)
* [Chromedriver's flags](https://cs.chromium.org/chromium/src/chrome/test/chromedriver/chrome_launcher.cc?type=cs&q=f:chrome_launcher++kDesktopSwitches&sq=package:chromium)
* [Puppeteer's flags](https://github.com/GoogleChrome/puppeteer/blob/master/lib/Launcher.js)
* [WebpageTest's flags](https://github.com/WPO-Foundation/webpagetest/blob/master/agent/wptdriver/web_browser.cc)

## All Chrome flags
* [Peter.sh's canonical list of Chrome command-line switches](http://peter.sh/experiments/chromium-command-line-switches/)
