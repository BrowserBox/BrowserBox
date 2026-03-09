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

## Namespaced Session-Host API

The `<browserbox-webview>` element now exposes a namespaced API for programmatic control:

| Namespace | Examples |
|-----------|----------|
| `session` | `session.id`, `session.usable`, `session.health()`, `session.capabilities()`, `session.disconnect()` |
| `tabs` | `tabs.list()`, `tabs.create({ url })`, `tabs.activate(id)`, `tabs.close(id)` |
| `page` | `page.navigate(url)`, `page.text()`, `page.url()`, `page.title()`, `page.reload()` |
| `capture` | `capture.frame({ format, quality })`, `capture.viewport()` |
| `policy` | `policy.get()` |

### Advanced surfaces (capability-gated, off by default)

| Surface | Examples |
|---------|----------|
| `augment` | `augment(spec)`, `augment.update(id, patch)`, `augment.remove(id)`, `augment.list()` |
| `select` | `select({ prompt, intent })` returns a SelectionHandle with `generalize()`, `preview()`, `extract()` |

### Event helpers

| Method | Description |
|--------|-------------|
| `on(name, handler)` | Subscribe; returns unsubscribe function |
| `off(name, handler)` | Unsubscribe |
| `observe(config)` | Structured event observer |
| `events(config)` | Async iterator over events |

### Canonical event aliases

Legacy event names (`tab-created`, `did-navigate`, etc.) continue to work.
New canonical dot-notation names are also emitted:

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

## Flat methods (backward compatible)

All classic flat methods remain available: `whenReady()`, `callApi()`, `navigateTo()`, `getTabs()`,
`createTab()`, `closeTab()`, `switchToTab()`, `reload()`, `goBack()`, `goForward()`, `stop()`,
`health()`, `getTransportDiagnostics()`, `refresh()`, `listApiMethods()`, etc.
