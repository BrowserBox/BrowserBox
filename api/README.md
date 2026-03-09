# Webview API

Ensure you set

```bash
export ALLOWED_EMBEDDING_ORIGINS="https://site-that-serves-the-page-using-the-webview.example.com https://other-site.you-will-embed.browserbox-on.com"
```

Before running `bbx run` or equivalent run commands.

## Embedding

```html
<script src="browserbox-webview.js"></script>
<browserbox-webview
  login-link="https://example.com:9999/login?token=your_login_link"
  width="100%"
  height="600">
</browserbox-webview>
```

## Quick Start

```js
const bbx = document.querySelector('browserbox-webview');
await bbx.whenReady();

// Create a tab and navigate
await bbx.createTab('https://example.com');
const tabs = await bbx.getTabs();

// Automate
await bbx.click('a.my-link');
await bbx.waitForSelector('.result');
const title = await bbx.evaluate('document.title');

// Capture
const screenshot = await bbx.capture.frame({ format: 'jpeg', quality: 80 });
```

## Element Attributes

| Attribute | Required | Default | Description |
|-----------|----------|---------|-------------|
| `login-link` | yes | — | Full BrowserBox login URL with auth token |
| `width` | no | `"100%"` | CSS width (px if bare number) |
| `height` | no | `"100%"` | CSS height (px if bare number) |
| `parent-origin` | no | `"*"` | Restrict postMessage origin |
| `request-timeout-ms` | no | `30000` | API call timeout (ms) |
| `ui-visible` | no | `true` | Show/hide BrowserBox chrome UI |
| `allow-user-toggle-ui` | no | `true` | Allow user to toggle UI visibility |

## Namespaced Session-Host API

The `<browserbox-webview>` element exposes a namespaced API for programmatic control.

Access via the element directly (`bbx.tabs.list()`) or via `bbx.session` facade.

### `session`

| Property / Method | Returns | Description |
|-------------------|---------|-------------|
| `session.id` | `string \| null` | Routing machine ID |
| `session.usable` | `boolean` | Whether the session is currently usable |
| `session.ready` | `boolean` | Whether the API handshake has completed |
| `session.transport` | `string` | Transport mode: `"modern"`, `"legacy"`, or `"unknown"` |
| `session.health()` | `Promise<boolean>` | Ping the embedded browser |
| `session.capabilities()` | `Promise<object>` | Query supported capabilities |
| `session.disconnect()` | `void` | Tear down the session |
| `session.refresh()` | `void` | Reload the embedded iframe |

### `tabs`

| Method | Returns | Description |
|--------|---------|-------------|
| `tabs.list()` | `Promise<Tab[]>` | List all open tabs |
| `tabs.getActive()` | `Promise<Tab>` | Get the active tab's info |
| `tabs.create({ url, active? })` | `Promise<Tab>` | Open a new tab |
| `tabs.activate(tabId)` | `Promise` | Switch to a tab by ID |
| `tabs.close(tabId)` | `Promise` | Close a tab by ID |
| `tabs.closeAll()` | `Promise` | Close all tabs |

**Tab object:** `{ index, id, url, title, active, canGoBack, canGoForward, hasFavicon, isDefaultFavicon, faviconDataURI }`

### `page`

| Method | Returns | Description |
|--------|---------|-------------|
| `page.navigate(url, opts?)` | `Promise<NavResult>` | Navigate the active tab |
| `page.url()` | `Promise<string>` | Get the active tab's URL |
| `page.title()` | `Promise<string>` | Get the active tab's title |
| `page.favicon()` | `Promise<string \| null>` | Get the favicon as a data URI |
| `page.metrics()` | `Promise<Metrics>` | Get viewport dimensions |
| `page.text(opts?)` | `Promise<string>` | Extract page text (`{ mainContentOnly?: boolean }`) |
| `page.reload()` | `Promise` | Reload the active tab |
| `page.back()` | `Promise<boolean>` | Navigate back |
| `page.forward()` | `Promise<boolean>` | Navigate forward |
| `page.stop()` | `Promise` | Stop loading |

### `capture`

| Method | Returns | Description |
|--------|---------|-------------|
| `capture.frame(opts?)` | `Promise<string>` | Full-page screenshot as data URI |
| `capture.viewport(opts?)` | `Promise<string>` | Viewport-only screenshot as data URI |

Options: `{ format?: "jpeg" | "png", quality?: number }`

### `policy`

| Method | Returns | Description |
|--------|---------|-------------|
| `policy.get()` | `Promise<object>` | Get current policy snapshot |

### Advanced surfaces (capability-gated, off by default)

| Surface | Examples |
|---------|----------|
| `augment` | `augment(spec)`, `augment.update(id, patch)`, `augment.remove(id)`, `augment.list()` |
| `select` | `select({ prompt, intent })` returns a SelectionHandle with `generalize()`, `preview()`, `extract()` |

## Automation Methods

Direct methods on the element for browser automation:

| Method | Returns | Description |
|--------|---------|-------------|
| `click(selector, opts?)` | `Promise<{ result }>` | Click an element by CSS selector |
| `type(selector, text, opts?)` | `Promise<{ result }>` | Type text into an element |
| `evaluate(expression, opts?)` | `Promise<{ result }>` | Evaluate JavaScript in the page |
| `waitForSelector(selector, opts?)` | `Promise<boolean>` | Wait for a selector to appear |
| `waitForNavigation(opts?)` | `Promise` | Wait for a navigation to complete |

### `act(action)` — Unified action dispatch

| Action | Example | Description |
|--------|---------|-------------|
| `navigate` | `act({ navigate: "https://..." })` | Navigate the active tab |
| `click` | `act({ click: { selector: "a" } })` | Click an element |
| `type` | `act({ type: { selector: "input", text: "hello" } })` | Type into an element |
| `evaluate` | `act({ evaluate: "document.title" })` | Evaluate JS expression |
| `waitForSelector` | `act({ waitForSelector: { selector: "h1" } })` | Wait for element |
| `waitForNavigation` | `act({ waitForNavigation: {} })` | Wait for nav |

## UI Controls

| Method | Returns | Description |
|--------|---------|-------------|
| `uiVisible(visible?)` | `Promise<boolean>` | Show/hide BrowserBox chrome UI |
| `allowUserToggleUI(allow?)` | `Promise<boolean>` | Allow/deny user UI toggling |

## Event Helpers

| Method | Description |
|--------|-------------|
| `on(name, handler)` | Subscribe; returns unsubscribe function |
| `off(name, handler)` | Unsubscribe |
| `observe(config)` | Structured event observer; returns `{ unsubscribe() }` |
| `events(config)` | Async iterator over events |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `ready` | `{ type }` | Legacy transport handshake completed |
| `api-ready` | `{ methods: string[] }` | Modern API available |
| `ready-timeout` | `{ timeoutMs, error }` | Ready handshake timed out |
| `tab-created` | `{ index, id, url }` | New tab opened |
| `tab-closed` | `{ index, id }` | Tab closed |
| `tab-updated` | `{ id, url, title, faviconDataURI }` | Tab metadata updated |
| `active-tab-changed` | `{ index, id }` | Active tab switched |
| `did-start-loading` | `{ tabId, url }` | Page load started |
| `did-stop-loading` | `{ tabId, url }` | Page load finished |
| `did-navigate` | `{ tabId, url }` | Navigation committed |
| `favicon-changed` | `{ tabId, faviconDataURI }` | Favicon updated |
| `policy-denied` | `{ url, reason }` | Navigation blocked by policy |
| `usability-changed` | `{ usable: boolean }` | Browser usability state changed |
| `sos` | `{ reasonCode, message, retryUrl }` | Fatal unusable signal |
| `disconnected` | — | Session ended |

### Canonical event aliases

Legacy event names continue to work. Dot-notation aliases are also emitted:

| Legacy | Canonical |
|--------|-----------|
| `api-ready` | `api.ready` |
| `tab-created` | `tab.created` |
| `tab-closed` | `tab.closed` |
| `tab-updated` | `tab.updated` |
| `active-tab-changed` | `tab.activated` |
| `did-navigate` | `page.navigated` |
| `did-start-loading` | `page.load.started` |
| `did-stop-loading` | `page.load.stopped` |
| `policy-denied` | `policy.denied` |
| `usability-changed` | `session.usability.changed` |
| `disconnected` | `session.disconnected` |

## Flat Methods (backward compatible)

All classic flat methods remain available:

`whenReady()`, `callApi()`, `navigateTo()`, `navigateTab()`, `submitOmnibox()`,
`getTabs()`, `getFavicons()`, `getTabCount()`, `getActiveTabIndex()`,
`createTab()`, `createTabs()`, `closeTab()`, `closeTabById()`, `closeAllTabs()`,
`switchToTab()`, `switchToTabById()`,
`reload()`, `goBack()`, `goForward()`, `stop()`,
`getScreenMetrics()`, `getTransportDiagnostics()`,
`health()`, `refresh()`, `updateIframe()`, `stopReconnectAttempts()`,
`listApiMethods()`,
`waitForNonDefaultFavicon()`, `waitForTabCount()`, `waitForTabUrl()`

## Test Status

**55/55 tests passing** (2026-03-09) — full coverage across session, tabs, page,
navigation, automation (click, waitForSelector, evaluate, act), capture,
diagnostics, policy, augment, events, and observer APIs.
