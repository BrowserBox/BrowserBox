(() => {
  const logKey = '__navlog__';
  const push = (e) => {
    const arr = JSON.parse(sessionStorage.getItem(logKey) || '[]');
    arr.push({...e, t: new Date().toISOString()});
    sessionStorage.setItem(logKey, JSON.stringify(arr));
    // also surface in console during dev:
    console.warn('[navlog]', e);
    if (e.stack) console.warn(e.stack);
  };

  // On load, record how we got here
  window.addEventListener('DOMContentLoaded', () => {
    const [nav] = performance.getEntriesByType('navigation');
    push({
      kind: 'load',
      type: nav?.type,           // 'navigate' | 'reload' | 'back_forward' | undefined
      redirectCount: nav?.redirectCount,
      url: location.href
    });
  });

  // Events that commonly precede reloads/navigations
  ['beforeunload', 'unload', 'pagehide', 'pageshow', 'visibilitychange',
   'freeze', 'resume', 'popstate', 'hashchange', 'readystatechange']
   .forEach(evt => window.addEventListener(evt, (ev) => {
     push({kind: 'event', evt, state: document.readyState, hidden: document.hidden});
   }, true));

  // Service worker controller changes (often fires before a forced refresh)
  if (navigator.serviceWorker) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      push({kind: 'event', evt: 'sw:controllerchange'});
      // Some apps auto-reload here; catch it if so.
    });
    navigator.serviceWorker.addEventListener('message', (e) => {
      push({kind: 'sw:message', data: e.data});
    });
  }

  // Monkey-patch all the usual suspects with stack traces
  const trace = (name, args) => {
    const err = new Error(`trace:${name}`);
    push({kind: 'call', name, args: Array.from(args), stack: err.stack});
  };

  const _assign  = location.assign.bind(location);
  const _replace = location.replace.bind(location);
  const _reload  = location.reload.bind(location);
  location.assign = function(){ trace('location.assign', arguments); return _assign(...arguments); };
  location.replace = function(){ trace('location.replace', arguments); return _replace(...arguments); };
  location.reload  = function(){ trace('location.reload',  arguments); return _reload(...arguments); };

  const _pushState = history.pushState.bind(history);
  const _replaceState = history.replaceState.bind(history);
  history.pushState = function(){ trace('history.pushState', arguments); return _pushState(...arguments); };
  history.replaceState = function(){ trace('history.replaceState', arguments); return _replaceState(...arguments); };

  // Bonus: guard meta refresh (rare but nasty)
  const _setAttr = HTMLMetaElement.prototype.setAttribute;
  HTMLMetaElement.prototype.setAttribute = function(k, v) {
    if (this.tagName === 'META' && k.toLowerCase() === 'http-equiv' && String(v).toLowerCase() === 'refresh') {
      trace('meta[http-equiv=refresh]', [this.content]);
    }
    return _setAttr.call(this, k, v);
  };

  // Expose a helper to dump the log quickly
  window.dumpNavLog = () => JSON.parse(sessionStorage.getItem(logKey) || '[]');
})();

