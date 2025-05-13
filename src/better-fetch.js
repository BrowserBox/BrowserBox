import http from 'http';
import http2 from 'http2';
import { Readable } from 'stream';

// Imports, constants, then state
const DEFAULT_TIMEOUT = 10000; // 10s
const DEFAULT_USER_AGENT = 'curl/8.7.1';
const MAX_REDIRECTS = 11;

const STATUS_TEXT = {
  100: 'Continue',
  101: 'Switching Protocols',
  102: 'Processing',
  103: 'Early Hints',
  200: 'OK',
  201: 'Created',
  202: 'Accepted',
  203: 'Non-Authoritative Information',
  204: 'No Content',
  205: 'Reset Content',
  206: 'Partial Content',
  300: 'Multiple Choices',
  301: 'Moved Permanently',
  302: 'Found',
  303: 'See Other',
  304: 'Not Modified',
  305: 'Use Proxy',
  307: 'Temporary Redirect',
  308: 'Permanent Redirect',
  400: 'Bad Request',
  401: 'Unauthorized',
  402: 'Payment Required',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  406: 'Not Acceptable',
  407: 'Proxy Authentication Required',
  408: 'Request Timeout',
  409: 'Conflict',
  410: 'Gone',
  411: 'Length Required',
  412: 'Precondition Failed',
  413: 'Payload Too Large',
  414: 'URI Too Long',
  415: 'Unsupported Media Type',
  416: 'Range Not Satisfiable',
  417: 'Expectation Failed',
  418: "I'm a teapot",
  421: 'Misdirected Request',
  422: 'Unprocessable Entity',
  423: 'Locked',
  424: 'Failed Dependency',
  425: 'Too Early',
  426: 'Upgrade Required',
  428: 'Precondition Required',
  429: 'Too Many Requests',
  431: 'Request Header Fields Too Large',
  451: 'Unavailable For Legal Reasons',
  500: 'Internal Server Error',
  501: 'Not Implemented',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
  505: 'HTTP Version Not Supported',
  506: 'Variant Also Negotiates',
  507: 'Insufficient Storage',
  508: 'Loop Detected',
  510: 'Not Extended',
  511: 'Network Authentication Required',
};

// Logic (top-level function calls)
// None needed, as fetch is exported

// Functions, then helper functions
class CustomHeaders {
  constructor(init = {}) {
    this._headers = new Map();
    if (init) {
      if (Array.isArray(init)) {
        // Handle [[key, value], ...] format
        for (const [key, value] of init) {
          this.append(key, value);
        }
      } else if (init instanceof CustomHeaders || (typeof init.entries === 'function')) {
        // Handle another Headers instance
        for (const [key, value] of init.entries()) {
          this.append(key, value);
        }
      } else {
        // Handle plain object { key: value }
        for (const [key, value] of Object.entries(init)) {
          this.append(key, value);
        }
      }
    }
  }

  append(name, value) {
    const key = name.toLowerCase();
    const values = this._headers.get(key) || [];
    values.push(String(value));
    this._headers.set(key, values);
  }

  delete(name) {
    this._headers.delete(name.toLowerCase());
  }

  get(name) {
    const values = this._headers.get(name.toLowerCase());
    return values && values.length > 0 ? values[0] : null;
  }

  getSetCookie() {
    const values = this._headers.get('set-cookie') || [];
    return values;
  }

  has(name) {
    return this._headers.has(name.toLowerCase());
  }

  set(name, value) {
    this._headers.set(name.toLowerCase(), [String(value)]);
  }

  forEach(callback, thisArg) {
    for (const [key, values] of this._headers) {
      for (const value of values) {
        callback.call(thisArg, value, key, this);
      }
    }
  }

  *entries() {
    for (const [key, values] of this._headers) {
      for (const value of values) {
        yield [key, value];
      }
    }
  }

  *keys() {
    for (const key of this._headers.keys()) {
      yield key;
    }
  }

  *values() {
    for (const values of this._headers.values()) {
      for (const value of values) {
        yield value;
      }
    }
  }

  [Symbol.iterator]() {
    return this.entries();
  }
}

class CustomResponse {
  constructor({ stream, status, headers, url, redirected = false, type = 'basic', protocol }) {
    this._stream = stream; // Store Node.js stream.Readable
    this._buffered = false; // Track if stream is buffered
    this._buffer = null; // Store buffered content for cloning
    this.status = status;
    this.headers = new CustomHeaders(headers);
    this.url = url;
    this.bodyUsed = false;
    this.redirected = redirected;
    this.type = type;
    this.statusText = STATUS_TEXT[status] || '';
    this.protocol = protocol || 'http/1.1';
  }

  get body() {
    if (this.bodyUsed) {
      throw new TypeError('Body already used');
    }
    return this._stream ? Readable.toWeb(this._stream) : null; // Convert to ReadableStream only when accessed
  }

  async text() {
    if (this.bodyUsed) {
      throw new TypeError('Body already used');
    }
    this.bodyUsed = true;
    await this._bufferStream();
    if (!this._buffer) {
      return '';
    }
    return this._buffer.toString('utf8');
  }

  async json() {
    const text = await this.text();
    return JSON.parse(text);
  }

  async arrayBuffer() {
    if (this.bodyUsed) {
      throw new TypeError('Body already used');
    }
    this.bodyUsed = true;
    await this._bufferStream();
    if (!this._buffer) {
      return new ArrayBuffer(0);
    }
    return this._buffer.buffer.slice(this._buffer.byteOffset, this._buffer.byteOffset + this._buffer.byteLength);
  }

  async blob() {
    const arrayBuffer = await this.arrayBuffer();
    return new Blob([arrayBuffer], { type: this.headers.get('content-type') || '' });
  }

  async formData() {
    if (this.bodyUsed) {
      throw new TypeError('Body already used');
    }
    this.bodyUsed = true;
    throw new Error('formData() is not supported in this environment');
  }

  clone() {
    if (this.bodyUsed || (this._stream && this._buffered && !this._buffer)) {
      throw new TypeError('Cannot clone a response that has already been consumed');
    }
    // Buffer the stream if not already buffered to ensure cloning works
    if (this._stream && !this._buffered) {
      this._bufferStream();
    }
    // Create a new stream from the buffered content or null
    const newStream = this._buffer ? Readable.from(this._buffer) : null;
    return new CustomResponse({
      stream: newStream,
      status: this.status,
      headers: new CustomHeaders(this.headers),
      url: this.url,
      redirected: this.redirected,
      type: this.type,
      protocol: this.protocol,
    });
  }

  async _bufferStream() {
    if (this._buffered || !this._stream) {
      return;
    }
    const chunks = [];
    for await (const chunk of this._stream) {
      chunks.push(chunk);
    }
    this._buffer = Buffer.concat(chunks);
    this._buffered = true;
    this._stream = null; // Clear stream to prevent further use
  }

  static error() {
    return new CustomResponse({
      stream: null,
      status: 0,
      headers: new CustomHeaders(),
      url: '',
      redirected: false,
      type: 'error',
      protocol: 'http/1.1',
    });
  }

  static redirect(url, status = 302) {
    if (![301, 302, 303, 307, 308].includes(status)) {
      throw new RangeError('Invalid status code');
    }
    const headers = new CustomHeaders({ Location: url });
    return new CustomResponse({
      stream: null,
      status,
      headers,
      url,
      redirected: false,
      type: 'default',
      protocol: 'http/1.1',
    });
  }
}

async function fetch(url, options = {}) {
  const parsedUrl = new URL(url);
  const protocol = parsedUrl.protocol;
  const timeout = options.timeout || DEFAULT_TIMEOUT;
  const redirect = options.redirect || 'follow';
  const maxRedirects = options.maxRedirects || MAX_REDIRECTS;
  let redirectCount = 0;
  let currentUrl = parsedUrl;

  const requestOptions = {
    hostname: currentUrl.hostname,
    port: currentUrl.port || (protocol === 'https:' ? 443 : 80),
    path: currentUrl.pathname + currentUrl.search,
    method: options.method || 'GET',
    headers: new CustomHeaders({
      'User-Agent': DEFAULT_USER_AGENT,
      ...options.headers,
    }),
  };

  async function doFetch(currentUrl, requestOptions, redirectCount) {
    if (redirectCount > maxRedirects) {
      throw new Error('Maximum redirect count exceeded');
    }

    const protocol = currentUrl.protocol;
    if (protocol === 'http:') {
      return makeHttpRequest(currentUrl, requestOptions, http, timeout, options.body, redirect);
    } else if (protocol === 'https:') {
      return makeHttpsRequest(currentUrl, requestOptions, timeout, options.body, redirect, redirectCount);
    } else {
      throw new TypeError(`Unsupported protocol: ${protocol}`);
    }
  }

  let response = await doFetch(currentUrl, requestOptions, redirectCount);

  // Handle redirects
  while (redirect === 'follow' && [301, 302, 303, 307, 308].includes(response.status) && response.headers.get('location')) {
    if (redirectCount >= maxRedirects) {
      throw new Error('Maximum redirect count exceeded');
    }
    const newUrl = new URL(response.headers.get('location'), currentUrl);
    requestOptions.hostname = newUrl.hostname;
    requestOptions.port = newUrl.port || (newUrl.protocol === 'https:' ? 443 : 80);
    requestOptions.path = newUrl.pathname + newUrl.search;
    if ([303].includes(response.status)) {
      requestOptions.method = 'GET';
      requestOptions.body = undefined;
    }
    currentUrl = newUrl;
    redirectCount++;
    response = await doFetch(currentUrl, requestOptions, redirectCount);
  }

  if (redirect === 'error' && [301, 302, 303, 307, 308].includes(response.status)) {
    throw new TypeError('Redirects are not allowed with redirect: "error"');
  }

  if (redirect === 'manual' && [301, 302, 303, 307, 308].includes(response.status)) {
    response.redirected = redirectCount > 0;
    return response;
  }

  response.redirected = redirectCount > 0;
  return response;
}

function makeHttpRequest(parsedUrl, requestOptions, module, timeout, body, redirect) {
  return new Promise((resolve, reject) => {
    const headersObj = {};
    for (const [key, value] of requestOptions.headers.entries()) {
      headersObj[key] = value;
    }
    const req = module.request({ ...requestOptions, headers: headersObj }, (res) => {
      const response = new CustomResponse({
        stream: res,
        status: res.statusCode,
        headers: res.headers,
        url: parsedUrl.toString(),
        protocol: 'http/1.1',
      });
      resolve(response);
    });

    req.setTimeout(timeout, () => {
      req.destroy(new Error('Request timed out'));
    });

    req.on('error', reject);
    if (body) {
      req.write(body);
    }
    req.end();
  });
}

function makeHttpsRequest(parsedUrl, requestOptions, timeout, body, redirect, redirectCount) {
  return new Promise((resolve, reject) => {
    const session = http2.connect(parsedUrl.origin, {
      timeout,
    });

    session.on('connect', () => {
      const headersObj = {};
      for (const [key, value] of requestOptions.headers.entries()) {
        headersObj[key] = value;
      }
      const headers = {
        ':method': requestOptions.method,
        ':path': requestOptions.path,
        ...headersObj,
      };
      const req = session.request(headers);

      req.on('response', (headers) => {
        const status = headers[':status'];
        const responseHeaders = { ...headers };
        delete responseHeaders[':status'];
        const protocol = session.alpnProtocol || 'http/1.1';
        const response = new CustomResponse({
          stream: req,
          status,
          headers: responseHeaders,
          url: parsedUrl.toString(),
          protocol,
        });
        resolve(response);
      });

      req.setTimeout(timeout, () => {
        req.destroy(new Error('Request timed out'));
      });

      req.on('error', reject);
      if (body) {
        req.write(body);
      }
      req.end();
    });

    session.on('error', reject);
    session.setTimeout(timeout, () => {
      session.destroy(new Error('Request timed out'));
    });
  });
}

export { fetch, CustomResponse };
