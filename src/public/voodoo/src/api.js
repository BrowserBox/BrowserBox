// basic use:
//
// <browser-box src=${loginLink}></browser-box>
// 
//  
class BrowserBox extends HTMLElement {
  #resolvers = new Map();
  #listeners = new Set();

  static get tag() {
    return 'browser-box';
    // 'web-view'
    // 'bb-webview'
    // 'cloud-tabs'
    // whatever, etc ... :) 
  }

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });

    if ( globalThis.bb ) {
      if ( !Array.isArray(globalThis.bb) ) {
        globalThis.bb = [globalThis.bb];
      }
      globalThis.bb.unshift(this);
    } else {
      globalThis.bb = this;
    }
  }

  resetShadow({src}) {
    this.shadow.innerHTML = ` 
      <style> 
        :host {
          display: flex;
          align-items: stretch;
          justify-content: stretch;
          position: relative;
          background: transparent;
        }
        iframe {
          flex-grow: 1; 
          width: 100%;
          height: 100%;
          border: 0;
          background: transparent;
        }
      </style>
      <iframe src=${src}></iframe>
    `;
  }

  // chrome remote debugging protocol
  ctl(method, params, sessionId) {

  }

  api(method, ...args) {

  }

  addListener(handler) {

  }

  connectedCallback() {
    const src = this.getAttribute('src');
    if ( src ) {
      this.resetShadow({src});
    }
  }

  attributeChangedCallback(attr, value) {
    if ( attr == 'src' ) {
      this.resetShaodw({src: value});
    }
  }
}

customElements.define(BrowserBox.tag, BrowserBox);
