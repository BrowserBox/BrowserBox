class BrowserBoxWebview extends HTMLElement {
  // Define observed attributes for reactivity
  static get observedAttributes() {
    return ['login-link', 'width', 'height'];
  }

  constructor() {
    super();
    // Attach shadow DOM (open mode)
    this.attachShadow({ mode: 'open' });
    
    // Create iframe element with specified allow and sandbox attributes
    this.iframe = document.createElement('iframe');
    this.iframe.allowFullscreen = true; // For allowfullscreen attribute
    this.iframe.setAttribute(
      'allow',
      'accelerometer; camera; encrypted-media; display-capture; geolocation; gyroscope; microphone; midi; clipboard-read; clipboard-write; web-share; fullscreen'
    );
    this.iframe.setAttribute(
      'sandbox',
      'allow-same-origin allow-forms allow-scripts allow-top-navigation allow-top-navigation-by-user-activation allow-storage-access-by-user-activation allow-popups allow-popups-to-escape-sandbox allow-downloads allow-modals allow-pointer-lock'
    );
    
    // Styles to ensure iframe fills the webview with no scrolling or margins
    const style = document.createElement('style');
    style.textContent = `
      :host {
        display: block;
        margin: 0;
        padding: 0;
        overflow: hidden; /* Prevent scrolling */
      }
      iframe {
        border: none;
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
        display: block; /* Remove any default inline spacing */
      }
    `;
    
    // Append to shadow DOM
    this.shadowRoot.append(style, this.iframe);
  }

  // Lifecycle: When element is added to DOM
  connectedCallback() {
    this.updateIframe();
  }

  // Lifecycle: When attributes change
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.updateIframe();
    }
  }

  // Update iframe src and size based on attributes
  updateIframe() {
    const loginLink = this.getAttribute('login-link');
    const width = this.getAttribute('width') || '100%';
    const height = this.getAttribute('height') || '400px';

    if (loginLink) {
      this.iframe.src = loginLink;
    }
    // Set the host element's size explicitly to match attributes
    this.style.width = /^\d+$/.test(width) ? `${width}px` : width;
    this.style.height = /^\d+$/.test(height) ? `${height}px` : height;
  }

  // IDL API: Properties
  get loginLink() {
    return this.getAttribute('login-link');
  }
  set loginLink(value) {
    if (value) {
      this.setAttribute('login-link', value);
    } else {
      this.removeAttribute('login-link');
    }
  }

  get width() {
    return this.getAttribute('width');
  }
  set width(value) {
    if (value) {
      this.setAttribute('width', value);
    } else {
      this.removeAttribute('width');
    }
  }

  get height() {
    return this.getAttribute('height');
  }
  set height(value) {
    if (value) {
      this.setAttribute('height', value);
    } else {
      this.removeAttribute('height');
    }
  }

  // IDL API: Methods
  refresh() {
    this.iframe.src = this.iframe.src; // Reload the iframe
  }
}

// Define the custom element
customElements.define('browserbox-webview', BrowserBoxWebview);
