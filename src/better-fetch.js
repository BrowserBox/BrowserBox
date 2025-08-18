// better-fetch.js
import http from 'http';
import https from 'https'; // Import the 'https' module for the fallback
import http2 from 'http2';
import { Readable } from 'stream';
import { Buffer } from 'buffer';

// Imports, constants, then state
const DEFAULT_TIMEOUT = 10000; // 10s
const DEFAULT_USER_AGENT = 'UnleashFetch/1.0 (Custom)';
const MAX_REDIRECTS = 11;

// A simple AbortError class for consistency
class AbortError extends Error {
  constructor(message = 'The operation was aborted.') {
    super(message);
    this.name = 'AbortError';
  }
}

const STATUS_TEXT = {
  // ... (status text mapping remains unchanged)
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

class CustomHeaders {
  // ... (CustomHeaders class remains unchanged)
  constructor(init = {}) {
    this._headers = new Map();
    if (init) {
      if (Array.isArray(init)) {
        for (const [key, value] of init) {
          this.append(key, value);
        }
      } else if (init instanceof CustomHeaders || (typeof init.entries === 'function' && init.entries !== Object.entries)) {
        for (const [key, value] of init.entries()) {
          this.append(key, value);
        }
      } else if (typeof init === 'object' && init !== null) {
        for (const [key, value] of Object.entries(init)) {
          this.append(key, value);
        }
      }
    }
  }

  append(name, value) {
    const key = String(name).toLowerCase();
    const existingValues = this._headers.get(key) || [];
    existingValues.push(String(value));
    this._headers.set(key, existingValues);
  }

  delete(name) {
    this._headers.delete(String(name).toLowerCase());
  }

  get(name) {
    const key = String(name).toLowerCase();
    const values = this._headers.get(key);
    if (!values || values.length === 0) {
      return null;
    }
    if (key === 'set-cookie') {
      return values.join('\n');
    }
    return values.join(', ');
  }

  getSetCookie() {
    return this._headers.get('set-cookie') || [];
  }

  has(name) {
    return this._headers.has(String(name).toLowerCase());
  }

  set(name, value) {
    this._headers.set(String(name).toLowerCase(), [String(value)]);
  }

  forEach(callback, thisArg) {
    for (const [key, values] of this._headers) {
      callback.call(thisArg, values.join(', '), key, this);
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
  // ... (CustomResponse class remains unchanged)
  constructor({ stream, status, headers, url, redirected = false, type = 'basic', protocol, _sharedStateOverride = null }) {
    this.status = Number(status);
    this.headers = headers instanceof CustomHeaders ? headers : new CustomHeaders(headers);
    this.url = String(url);
    this.bodyUsed = false;
    this.redirected = !!redirected;
    this.type = String(type);
    this.statusText = STATUS_TEXT[this.status] || '';
    this.protocol = protocol || (this.url.startsWith('https') ? 'h2' : 'http/1.1');

    if (_sharedStateOverride) {
      this._sharedState = _sharedStateOverride;
      this._stream = null;
    } else {
      this._sharedState = {
        originalNodeStream: stream,
        bufferPromise: null,
        buffer: null,
        buffered: !stream,
        streamError: null,
      };
      if (!stream) {
        this._sharedState.bufferPromise = Promise.resolve();
      }
      this._stream = stream;
    }
  }

  get body() { 
    if (this.bodyUsed) return null;
    const state = this._sharedState;
    if (state.buffered && state.buffer) {
        return Readable.toWeb(Readable.from(state.buffer));
    }
    if (state.originalNodeStream && !state.bufferPromise && !Readable.isDisturbed?.(state.originalNodeStream)) {
        return Readable.toWeb(state.originalNodeStream);
    }
    return null;
  }

  async _bufferStream() {
    const state = this._sharedState;

    if (state.bufferPromise) {
      return state.bufferPromise;
    }

    if (!state.originalNodeStream) {
      state.buffered = true;
      state.bufferPromise = Promise.resolve();
      return state.bufferPromise;
    }

    const streamToBuffer = state.originalNodeStream;
    state.originalNodeStream = null;

    state.bufferPromise = (async () => {
      try {
        const chunks = [];
        for await (const chunk of streamToBuffer) {
          chunks.push(chunk);
        }
        state.buffer = Buffer.concat(chunks);
      } catch (err) {
        state.streamError = err;
        throw err;
      } finally {
        state.buffered = true;
      }
    })();
    this._stream = null;
    return state.bufferPromise;
  }

  clone() {
    if (this.bodyUsed) {
      throw new TypeError('Cannot clone: this response instance body is already used.');
    }

    if (this._sharedState.originalNodeStream && !this._sharedState.buffered) {
        // Improvement Comment: Cloning streams is complex. This implementation buffers the entire
        // stream on the first read from any clone. For very large responses, this could be memory-intensive.
        // A more advanced implementation might use Tee-ing the stream, but that adds significant complexity.
        console.warn("Cloning a response with an unconsumed stream. Original and clone will share the buffering process. First read triggers buffering for all.");
    }

    return new CustomResponse({
      stream: null,
      status: this.status,
      headers: new CustomHeaders(this.headers),
      url: this.url,
      redirected: this.redirected,
      type: this.type,
      protocol: this.protocol,
      _sharedStateOverride: this._sharedState,
    });
  }

  async text() {
    if (this.bodyUsed) throw new TypeError('Body already used');
    this.bodyUsed = true;

    await this._bufferStream();
    const state = this._sharedState;
    if (state.streamError) throw state.streamError;
    return state.buffer ? state.buffer.toString('utf8') : '';
  }

  async json() {
    const bodyText = await this.text();
    if (bodyText === '') {
        throw new SyntaxError('Unexpected end of JSON input');
    }
    try {
        return JSON.parse(bodyText);
    } catch (e) {
        const preview = bodyText.length > 100 ? bodyText.substring(0, 100) + "..." : bodyText;
        console.error(`[DEBUG] Failed to parse JSON for URL: ${this.url}. Preview: "${preview}". Error: ${e.message}`);
        throw new SyntaxError(`Failed to parse JSON (source: "${preview}"): ${e.message}`);
    }
  }

  async arrayBuffer() {
    if (this.bodyUsed) throw new TypeError('Body already used');
    this.bodyUsed = true;

    await this._bufferStream();
    const state = this._sharedState;
    if (state.streamError) throw state.streamError;
    if (!state.buffer) return new ArrayBuffer(0);
    const slice = state.buffer.buffer.slice(state.buffer.byteOffset, state.buffer.byteOffset + state.buffer.byteLength);
    return slice;
  }

  async blob() {
    if (typeof Blob === 'undefined') {
        try {
            const { Blob: BufferBlob } = await import('buffer');
            if (typeof BufferBlob !== 'function') throw new Error();
            globalThis.Blob = BufferBlob;
        } catch (e) {
            throw new Error('Blob is not supported in this environment. Requires Node.js 18+ or `buffer.Blob`.');
        }
    }
    const buffer = await this.arrayBuffer();
    return new Blob([buffer], { type: this.headers.get('content-type') || '' });
  }

  get ok() {
    return this.status >= 200 && this.status <= 299;
  }

  async formData() {
    if (this.bodyUsed) throw new TypeError('Body already used');
    this.bodyUsed = true;
    // Improvement Comment: Supporting formData would require parsing 'multipart/form-data' or
    // 'application/x-www-form-urlencoded' response bodies. This is a non-trivial task that
    // would likely involve bringing in a dedicated parsing library.
    throw new Error('formData() is not yet supported in this fetch implementation.');
  }

  static error() {
    return new CustomResponse({ stream: null, status: 0, headers: new CustomHeaders(), url: '', type: 'error' });
  }

  static redirect(url, status = 302) {
    if (![301, 302, 303, 307, 308].includes(status)) {
      throw new RangeError('Invalid status code for redirect');
    }
    return new CustomResponse({ stream: null, status: status, headers: new CustomHeaders({ Location: url }), url: '', type: 'default' });
  }
}

async function fetch(url, options = {}) {
  let currentUrl;
  try {
    currentUrl = new URL(String(url));
  } catch (e) {
    return Promise.reject(new TypeError(`Invalid URL: ${url} - ${e.message}`));
  }

  const {
    method = 'GET',
    headers: optionHeaders,
    body,
    redirect = 'follow',
    signal,
    agent,
    timeout = DEFAULT_TIMEOUT,
  } = options;

  if (signal?.aborted) {
    return Promise.reject(new AbortError('Fetch aborted.'));
  }

  let redirectCount = 0;
  const effectiveMaxRedirects = options.maxRedirects ?? MAX_REDIRECTS;

  const requestHeaders = new CustomHeaders({ 'User-Agent': DEFAULT_USER_AGENT });
  if (optionHeaders) {
    for (const [key, value] of (optionHeaders.entries ? optionHeaders.entries() : Object.entries(optionHeaders))) {
        requestHeaders.set(key, value);
    }
  }

  // Improvement Comment: Body handling could be more robust. It currently only handles string
  // and doesn't explicitly set Content-Length for Buffers or streams, though Node often handles this.
  // Properly supporting Blob, FormData, etc., as a request body would require serialization logic.
  if (body && !requestHeaders.has('Content-Type')) {
    if (typeof body === 'string') {
      requestHeaders.set('Content-Type', 'text/plain;charset=UTF-8');
    }
  }

  // This is the core request execution function.
  async function executeFetch(currentUrlString, currentMethod, currentHeaders, currentBody, isRedirected = false) {
    const parsedUrl = new URL(currentUrlString);
    const protocol = parsedUrl.protocol;
    
    // Create a single AbortController for the overall timeout of this specific request execution.
    const timeoutController = new AbortController();
    const overallTimeoutSignal = timeoutController.signal;

    // Link the user's signal with our timeout signal if applicable.
    const abortHandler = () => timeoutController.abort();
    signal?.addEventListener('abort', abortHandler, { once: true });
    
    const timeoutPromise = new Promise((_, reject) => {
        if (timeout > 0) {
            setTimeout(() => {
                const error = new AbortError(`Fetch to ${currentUrlString} timed out after ${timeout}ms.`);
                timeoutController.abort(error);
                reject(error);
            }, timeout);
        }
    });

    const fetchPromise = (async () => {
        if (protocol === 'http:') {
            return makeHttpRequest(parsedUrl, currentMethod, currentHeaders, currentBody, isRedirected, overallTimeoutSignal);
        }
        if (protocol === 'https:') {
            try {
                // **MODIFICATION**: First, attempt the request with HTTP/2.
                return await makeHttp2Request(parsedUrl, currentMethod, currentHeaders, currentBody, isRedirected, overallTimeoutSignal);
            } catch (h2Error) {
                // **MODIFICATION**: If HTTP/2 fails, log the error and fall back to HTTPS (HTTP/1.1).
                // This is a common scenario for servers that don't support h2.
                console.warn(`HTTP/2 request to ${currentUrlString} failed (Error: ${h2Error.code || h2Error.message}). Falling back to HTTPS/1.1.`);
                
                // Ensure the signal hasn't already been aborted before retrying.
                if (overallTimeoutSignal.aborted) {
                    throw new AbortError('Fetch aborted before fallback attempt.');
                }
                
                return makeHttpsRequest(parsedUrl, currentMethod, currentHeaders, currentBody, isRedirected, overallTimeoutSignal);
            }
        }
        throw new TypeError(`Unsupported protocol: ${protocol}`);
    })();

    try {
        return await Promise.race([fetchPromise, timeoutPromise]);
    } finally {
        signal?.removeEventListener('abort', abortHandler);
    }
  }

  // Main fetch loop for handling redirects
  let currentMethod = method;
  let currentHeaders = requestHeaders;
  let currentBody = body;

  while (true) {
    const response = await executeFetch(currentUrl.toString(), currentMethod, currentHeaders, currentBody, redirectCount > 0);

    if (redirect === 'follow' && [301, 302, 303, 307, 308].includes(response.status)) {
      const locationHeader = response.headers.get('location');
      if (!locationHeader) {
        return response;
      }
      if (redirectCount >= effectiveMaxRedirects) {
        return Promise.reject(new TypeError(`Maximum redirects (${effectiveMaxRedirects}) exceeded at ${currentUrl.toString()}`));
      }
      redirectCount++;

      const newUrl = new URL(locationHeader, currentUrl.toString());

      // Improvement Comment: On cross-origin redirects, sensitive headers like 'Authorization'
      // should be stripped. This implementation currently preserves them, which might not be desirable.
      if (newUrl.origin !== currentUrl.origin) {
          // Example: currentHeaders.delete('authorization');
      }

      if (response.status === 303 || ((response.status === 301 || response.status === 302) && currentMethod === 'POST')) {
        currentMethod = 'GET';
        currentBody = undefined;
        currentHeaders.delete('content-length');
        currentHeaders.delete('content-type');
      }
      currentUrl = newUrl;
      continue;
    }

    if (redirect === 'error' && response.redirected) {
      return Promise.reject(new TypeError(`URL redirected to ${response.url}, but redirect: 'error' was specified.`));
    }

    if (redirect === 'manual' && [301, 302, 303, 307, 308].includes(response.status)) {
      return new CustomResponse({
          ...response,
          type: 'opaqueredirect',
          stream: response._stream,
          headers: response.headers,
      });
    }
    return response;
  }
}

// **NEW**: Extracted request logic into separate functions for clarity and to support the fallback.

function makeHttpRequest(parsedUrl, method, headers, body, isRedirected, signal) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 80,
      path: parsedUrl.pathname + parsedUrl.search,
      method: method,
      headers: Object.fromEntries(headers.entries()),
    };
    
    const clientRequest = http.request(requestOptions, (res) => {
      resolve(new CustomResponse({
        stream: res,
        status: res.statusCode,
        headers: res.headers,
        url: parsedUrl.toString(),
        redirected: isRedirected,
        protocol: `http/${res.httpVersion}`,
      }));
    });

    signal.addEventListener('abort', () => clientRequest.destroy(new AbortError()), { once: true });
    clientRequest.on('error', reject);

    if (body) {
      if (body instanceof Readable) body.pipe(clientRequest);
      else clientRequest.end(body);
    } else {
      clientRequest.end();
    }
  });
}

function makeHttpsRequest(parsedUrl, method, headers, body, isRedirected, signal) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: method,
      headers: Object.fromEntries(headers.entries()),
    };

    const clientRequest = https.request(requestOptions, (res) => {
      resolve(new CustomResponse({
        stream: res,
        status: res.statusCode,
        headers: res.headers,
        url: parsedUrl.toString(),
        redirected: isRedirected,
        protocol: `https/${res.httpVersion}`,
      }));
    });

    signal.addEventListener('abort', () => clientRequest.destroy(new AbortError()), { once: true });
    clientRequest.on('error', reject);

    if (body) {
      if (body instanceof Readable) body.pipe(clientRequest);
      else clientRequest.end(body);
    } else {
      clientRequest.end();
    }
  });
}

function makeHttp2Request(parsedUrl, method, headers, body, isRedirected, signal) {
    return new Promise((resolve, reject) => {
        let h2Session;
        const connectOptions = {
            // Improvement Comment: For high-throughput applications, managing and reusing http2 sessions
            // via a pool would be more performant than creating a new one for every request.
        };

        try {
            h2Session = http2.connect(parsedUrl.origin, connectOptions);
        } catch(err) {
            // Catch synchronous errors from connect, e.g., invalid URL parts
            return reject(err);
        }

        const abortSession = () => {
            if (h2Session && !h2Session.destroyed) {
                h2Session.destroy(new AbortError());
            }
        };
        signal.addEventListener('abort', abortSession, { once: true });

        h2Session.on('error', reject); // Connection-level errors
        h2Session.on('goaway', () => reject(new Error('HTTP/2 server sent GOAWAY.')));

        const h2Headers = {
            ':method': method,
            ':path': parsedUrl.pathname + parsedUrl.search,
            ':scheme': 'https',
            ':authority': parsedUrl.hostname,
            ...Object.fromEntries(headers.entries()),
        };

        const h2Stream = h2Session.request(h2Headers);

        h2Stream.on('response', (h2ResponseHeaders) => {
            const status = h2ResponseHeaders[':status'];
            delete h2ResponseHeaders[':status'];

            const resp = new CustomResponse({
                stream: h2Stream,
                status: status,
                headers: h2ResponseHeaders,
                url: parsedUrl.toString(),
                redirected: isRedirected,
                protocol: h2Session.alpnProtocol || 'h2',
            });
            resolve(resp);
        });

        h2Stream.on('error', reject); // Stream-level errors
        h2Stream.on('close', () => {
            // Clean up signal listener and session once the stream is fully closed
            signal.removeEventListener('abort', abortSession);
            if (h2Session && !h2Session.destroyed) {
                h2Session.close();
            }
        });

        if (body) {
            if (body instanceof Readable) body.pipe(h2Stream);
            else h2Stream.end(body);
        } else {
            h2Stream.end();
        }
    });
}


export { fetch, CustomResponse, CustomHeaders, AbortError };

// Make them available on globalThis if running in an environment where that's expected for tests
if (typeof globalThis !== 'undefined') {
    if (!globalThis.fetch) globalThis.fetch = fetch;
    if (!globalThis.Headers) globalThis.Headers = CustomHeaders;
    if (!globalThis.Response) globalThis.Response = CustomResponse;
    if (!globalThis.AbortError) globalThis.AbortError = AbortError;
}
