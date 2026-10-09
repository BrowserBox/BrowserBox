# Chromium crash: device metrics on a restored tab without a view

Chrome 154.0.8037.98 on macOS exits with `SIGSEGV` when
`Emulation.setDeviceMetricsOverride` is sent to an attached, session-restored
tab before that tab has a live execution context/view.

The standalone Node witness seeds three real HTTPS tabs, closes Chrome, restores
the profile, attaches to every page target, and identifies restored tabs that
have not emitted `Runtime.executionContextCreated`. In `negative` mode it sends
the metrics command immediately. In `guarded` mode it activates each such tab,
waits for a live execution context, then sends the same command.

## Run

```sh
npm install
npm run reproduce
npm run control
```

Set `CHROME_BIN` if Chrome is not installed in a conventional location. Set
`ITERATIONS` to change the default three iterations.

## Observed result

- Negative witness: 3/3 fresh profiles exited with `SIGSEGV` immediately after
  the metrics command was sent to a restored tab with no execution context.
- Guarded control: 3/3 fresh profiles completed; all 6 initially dormant tabs
  accepted the same metrics command after activation and reported the requested
  `800 x 520` viewport.

The three real sites are DuckDuckGo, Wikipedia, and the Chrome DevTools Protocol
documentation. The witness intentionally avoids `about:blank` and synthetic
local pages so restoration, network loading, and tab lifecycle timing remain in
the experiment.

## Chromium source

The crashing Chrome release dereferences `rwhv` without checking the result of
`GetPrimaryMainFrame()->GetView()` in
[`WebContentsImpl::SetDeviceEmulationSize`](https://github.com/chromium/chromium/blob/154.0.8037.98/content/browser/web_contents/web_contents_impl.cc#L11164-L11175).

Chromium main later added the missing check in
[`1b3b6a7b970c96fbe7ba63c7590319ce79f00e7a`](https://github.com/chromium/chromium/commit/1b3b6a7b970c96fbe7ba63c7590319ce79f00e7a),
`[CDP] Do not crash Emulation.{set,clear}DeviceMetricsOverride without RWHV`.
That change has `Bug: none`, so this report provides a public issue for tracking
the affected stable release and any backport decision.

Playwright independently documents the same failure condition in its
[`connectOverCDP` discarded-tab regression test](https://github.com/microsoft/playwright/blob/main/tests/library/chromium/connect-over-cdp.spec.ts#L117-L159).

## Scope

The repro is plain Node.js and uses only public CDP methods. It contains no
BrowserBox or Freelang runtime code.
