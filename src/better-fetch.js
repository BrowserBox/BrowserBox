// better-fetch.js
import http from 'http';
import http2 from 'http2';
import { Readable } from 'stream';
import { Buffer } from 'buffer'; // Explicit import for Blob

// Imports, constants, then state
const DEFAULT_TIMEOUT = 10000; // 10s
const DEFAULT_USER_AGENT = 'UnleashFetch/1.0 (Custom)'; // Updated User Agent
const MAX_REDIRECTS = 11;

// A simple AbortError class for consistency
class AbortError extends Error {
  constructor(message = 'The operation was aborted.') {
    super(message);
    this.name = 'AbortError';
  }
}


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

class CustomHeaders {
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
    // For 'set-cookie', multiple headers are not combined.
    // However, the standard Headers.get() for other headers returns a comma-separated string.
    if (key === 'set-cookie') {
      return values.join('\n'); // Or just values[0] if only one is expected by `get`
                                 // The spec for Headers.get() is actually to return a byte string,
                                 // which for multiple values (other than Set-Cookie) means comma-separated.
                                 // But getSetCookie() is more appropriate for Set-Cookie.
                                 // Let's stick to comma-separated for general 'get'.
    }
    return values.join(', ');
  }

  getSetCookie() {
    // This is a non-standard but common helper. Returns an array of cookie strings.
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
      // Standard forEach iterates once per header name, with the combined value
      callback.call(thisArg, values.join(', '), key, this);
    }
  }

  *entries() {
    for (const [key, values] of this._headers) {
      // Yields each key-value pair. If a header has multiple values, it yields them individually.
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

// In better-fetch.js
// In better-fetch.js
class CustomResponse {
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
      // this._stream on a clone is conceptually null, data comes via _sharedState
      this._stream = null; // Clones don't "own" the primary stream directly
    } else {
      this._sharedState = {
        originalNodeStream: stream, // Store the actual Node.js stream here
        bufferPromise: null,
        buffer: null,
        buffered: !stream,
        streamError: null,
      };
      if (!stream) {
        this._sharedState.bufferPromise = Promise.resolve();
      }
      // The original response instance can keep a direct _stream ref until it's consumed
      this._stream = stream;
    }
  }

  get body() { 
    if (this.bodyUsed) return null;
    const state = this._sharedState;
    if (state.buffered && state.buffer) {
        return Readable.toWeb(Readable.from(state.buffer));
    }
    // This part is tricky if state.originalNodeStream is the single source
    // and Readable.toWeb consumes it.
    // For now, assume .text() etc. are the primary consumption paths.
    if (state.originalNodeStream && !state.bufferPromise && !Readable.isDisturbed?.(state.originalNodeStream)) {
        // console.warn("Accessing .body directly on an unconsumed response. This might interfere with cloning if not handled carefully.");
        return Readable.toWeb(state.originalNodeStream);
    }
    return null;
  }

  async _bufferStream() {
    const state = this._sharedState;

    if (state.bufferPromise) {
      return state.bufferPromise; // Buffering already initiated or completed
    }

    // If there's no original stream to process in the shared state
    if (!state.originalNodeStream) {
      // This means either it was null initially, or it has already been processed by a previous call.
      // Ensure 'buffered' is true and resolve.
      state.buffered = true;
      state.bufferPromise = Promise.resolve();
      return state.bufferPromise;
    }

    // Capture the stream from shared state to ensure we use the one true source.
    const streamToBuffer = state.originalNodeStream;
    // Mark the originalNodeStream in shared state as "taken" for processing by nulling it.
    // This prevents any other instance from trying to re-process it.
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
        // The streamToBuffer is now fully consumed.
        // No need to destroy it here usually, as 'end' should have been emitted.
      }
    })();
    // Also nullify the instance's _stream if it was the one initiating this.
    // This instance's _stream was just a temporary holder for the original response.
    this._stream = null;
    return state.bufferPromise;
  }

  clone() {
    if (this.bodyUsed) {
      throw new TypeError('Cannot clone: this response instance body is already used.');
    }

    if (this._sharedState.originalNodeStream && !this._sharedState.buffered) {
        console.warn("Cloning a response with an unconsumed stream. Original and clone will share the buffering process. First read triggers buffering for all.");
    }

    return new CustomResponse({
      stream: null, // Clone does not get a direct initial _stream reference; uses shared state.
      status: this.status,
      headers: new CustomHeaders(this.headers),
      url: this.url,
      redirected: this.redirected,
      type: this.type,
      protocol: this.protocol,
      _sharedStateOverride: this._sharedState, // Key: Pass the shared state
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
        // For httpbin.org/headers, an empty body would mean no headers echoed.
        // This would cause the assertion to fail.
        console.warn(`[DEBUG] json() received empty text to parse for URL: ${this.url}`);
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
    throw new Error('formData() is not yet supported in this fetch implementation.');
  }

  static error() {
    // Error responses have no body stream
    return new CustomResponse({ stream: null, status: 0, headers: new CustomHeaders(), url: '', type: 'error' });
  }

  static redirect(url, status = 302) {
    if (![301, 302, 303, 307, 308].includes(status)) {
      throw new RangeError('Invalid status code for redirect');
    }
    // Redirect responses have no body stream
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
    redirect = 'follow', // 'follow', 'error', 'manual'
    signal,
    agent, // User can pass a custom agent
    timeout = DEFAULT_TIMEOUT, // Timeout for the entire fetch operation including redirects
  } = options;

  if (signal?.aborted) {
    return Promise.reject(new AbortError('Fetch aborted.'));
  }

  let redirectCount = 0;
  const effectiveMaxRedirects = options.maxRedirects ?? MAX_REDIRECTS;

  // Prepare initial request headers
  const requestHeaders = new CustomHeaders({ 'User-Agent': DEFAULT_USER_AGENT });
  if (optionHeaders) {
    // If optionHeaders is a Headers instance or object
    if (optionHeaders instanceof CustomHeaders || optionHeaders instanceof Headers || typeof optionHeaders === 'object') {
        for (const [key, value] of (optionHeaders.entries ? optionHeaders.entries() : Object.entries(optionHeaders))) {
            requestHeaders.set(key, value); // Use set to ensure overrides
        }
    }
  }
  if (body && !requestHeaders.has('Content-Type')) {
    if (typeof body === 'string') {
      requestHeaders.set('Content-Type', 'text/plain;charset=UTF-8');
    }
    // Add more auto-detection or let user specify
  }
  // Content-Length is usually handled by Node's http/http2 modules for strings/buffers

  async function executeFetch(currentUrlString, currentMethod, currentHeaders, currentBody, isRedirected = false) {
    const parsedUrl = new URL(currentUrlString);
    const protocol = parsedUrl.protocol;

    let clientRequest; // To store http.ClientRequest or http2.Http2Session
    let responseStream; // To store the incoming message / http2 stream

    const promise = new Promise((resolve, reject) => {
      const abortHandler = () => {
        const error = new AbortError('Fetch aborted.');
        if (clientRequest) {
          clientRequest.destroy?.(error); // For http.ClientRequest
          // For http2.Http2Session, clientRequest might be the session or the stream
          if (responseStream && typeof responseStream.destroy === 'function') responseStream.destroy(error);
          else if (clientRequest.destroy && typeof clientRequest.destroy === 'function' && !clientRequest.destroyed) clientRequest.destroy(error);

        }
        reject(error);
      };

      if (signal) {
        if (signal.aborted) {
          return reject(new AbortError('Fetch aborted.'));
        }
        signal.addEventListener('abort', abortHandler, { once: true });
      }

      const requestOptions = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (protocol === 'https:' ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: currentMethod,
        headers: {},
        agent: agent, // Pass user-provided agent
        // timeout: timeout, // Node's http.request timeout is per-request, not total. We handle total timeout differently.
      };
      for (const [key, value] of currentHeaders.entries()) {
        requestOptions.headers[key] = value; // Node wants plain object for headers
      }

      let moduleToUse;
      if (protocol === 'http:') {
        moduleToUse = http;
        clientRequest = moduleToUse.request(requestOptions, (res) => {
          responseStream = res;
          if (signal) signal.removeEventListener('abort', abortHandler);
          resolve(new CustomResponse({
            stream: res,
            status: res.statusCode,
            headers: res.headers, // Node's headers are plain objects
            url: currentUrlString,
            redirected: isRedirected,
            protocol: `http/${res.httpVersion}`,
          }));
        });
      } else if (protocol === 'https:') {
        moduleToUse = http2; // Using http2 for https for simplicity, could also use 'https' module
        const h2Session = moduleToUse.connect(parsedUrl.origin, {
            // settings for http2 if needed
            // timeout: perRequestTimeout, // http2 session timeout
        });
        clientRequest = h2Session; // Store session for potential destroy on abort

        h2Session.on('error', (err) => {
            if (signal) signal.removeEventListener('abort', abortHandler);
            if (!h2Session.destroyed) h2Session.destroy();
            reject(err);
        });
        // h2Session.setTimeout(perRequestTimeout, () => { ... }); // If using session timeout

        const h2Headers = {
          ':method': currentMethod,
          ':path': requestOptions.path,
          ':scheme': 'https',
          ':authority': requestOptions.hostname,
          ...requestOptions.headers,
        };

        const h2Stream = h2Session.request(h2Headers);
        responseStream = h2Stream; // Store stream for potential destroy

        h2Stream.on('response', (h2ResponseHeaders, flags) => {
          if (signal) signal.removeEventListener('abort', abortHandler);
          const status = h2ResponseHeaders[':status'];
          delete h2ResponseHeaders[':status']; // Remove pseudo-header
          const resp = new CustomResponse({
            stream: h2Stream,
            status: status,
            headers: h2ResponseHeaders,
            url: currentUrlString,
            redirected: isRedirected,
            protocol: h2Session.alpnProtocol || 'h2', // or check negotiated protocol
          });
          // h2Stream.on('end', () => { if (!h2Session.destroyed) h2Session.close(); }); // Close session after stream ends
          // Let's not close session immediately, could be reused for keep-alive
          // Instead, ensure it's closed if an error occurs or when fetch is done with it.
          // For simplicity, we'll close it after this request.
          // A more robust pool would manage sessions.
          h2Stream.on('close', () => { // Or 'end' and check if session should be closed
            if (!h2Session.destroyed) {
                h2Session.close();
            }
          });
          resolve(resp);
        });
        h2Stream.on('error', (err) => {
            if (signal) signal.removeEventListener('abort', abortHandler);
            if (!h2Session.destroyed) h2Session.destroy();
            reject(err);
        });
        // h2Stream.setTimeout(perRequestTimeout, () => { ... }); // If using stream timeout

        if (currentBody) {
          if (currentBody instanceof Readable) {
            currentBody.pipe(h2Stream);
          } else {
            h2Stream.end(currentBody);
          }
        } else {
          h2Stream.end();
        }
        return; // Return because http2 request setup is async with events

      } else {
        if (signal) signal.removeEventListener('abort', abortHandler);
        return reject(new TypeError(`Unsupported protocol: ${protocol}`));
      }

      clientRequest.on('error', (err) => {
        if (signal) signal.removeEventListener('abort', abortHandler);
        reject(err);
      });

      clientRequest.on('timeout', () => { // This is Node's per-request timeout
        if (signal) signal.removeEventListener('abort', abortHandler);
        clientRequest.destroy(new Error(`Request to ${currentUrlString} timed out.`)); // Node's timeout error
      });
      // Set Node's per-request timeout if a general timeout is also desired for each leg
      // clientRequest.setTimeout(timeout); // This would apply to each request individually

      if (currentBody) {
        if (currentBody instanceof Readable) {
          currentBody.pipe(clientRequest);
        } else {
          clientRequest.write(currentBody);
          clientRequest.end();
        }
      } else {
        clientRequest.end();
      }
    });

    // Apply overall timeout for this single fetch execution (including connection, request, response headers)
    if (timeout > 0) {
        let timeoutId;
        const timeoutPromise = new Promise((_, reject) => {
            timeoutId = setTimeout(() => {
                const error = new AbortError(`Fetch to ${currentUrlString} timed out after ${timeout}ms (overall).`);
                if (clientRequest) {
                    clientRequest.destroy?.(error);
                    if (responseStream && typeof responseStream.destroy === 'function') responseStream.destroy(error);
                    else if (clientRequest.destroy && typeof clientRequest.destroy === 'function' && !clientRequest.destroyed) clientRequest.destroy(error);
                }
                reject(error);
            }, timeout);
        });
        return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
    }
    return promise;
  }

  let currentMethod = method;
  let currentHeaders = requestHeaders;
  let currentBody = body;

  // Main fetch loop for handling redirects
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const response = await executeFetch(currentUrl.toString(), currentMethod, currentHeaders, currentBody, redirectCount > 0);

    if (redirect === 'follow' && [301, 302, 303, 307, 308].includes(response.status)) {
      const locationHeader = response.headers.get('location');
      if (!locationHeader) {
        return response; // No location header, cannot follow
      }
      if (redirectCount >= effectiveMaxRedirects) {
        return Promise.reject(new TypeError(`Maximum redirects (${effectiveMaxRedirects}) exceeded at ${currentUrl.toString()}`));
      }
      redirectCount++;

      const newUrl = new URL(locationHeader, currentUrl.toString()); // Resolve relative URLs

      // Change method to GET for 303, or if original was POST for 301/302 (common browser behavior)
      if (response.status === 303 || ((response.status === 301 || response.status === 302) && currentMethod === 'POST')) {
        currentMethod = 'GET';
        currentBody = undefined;
        currentHeaders.delete('content-length');
        currentHeaders.delete('content-type');
      }
      currentUrl = newUrl;
      // Note: Headers like Authorization are typically stripped on cross-origin redirects.
      // This implementation doesn't currently handle that complexity.
      continue;
    }

    if (redirect === 'error' && response.redirected) { // Or check status codes directly
      return Promise.reject(new TypeError(`URL redirected to ${response.url}, but redirect: 'error' was specified.`));
    }

    if (redirect === 'manual' && [301, 302, 303, 307, 308].includes(response.status)) {
      // For manual redirect, the response type should be 'opaqueredirect' if it's a true redirect
      // This is a simplification. True opaque responses have status 0, empty headers etc.
      // We return the redirect response as is, but mark its type.
      return new CustomResponse({
          ...response, // Spread existing properties
          type: 'opaqueredirect', // Indicate it's a redirect response that wasn't followed
          stream: response._stream, // Pass the original stream
          headers: response.headers, // Pass original headers
      });
    }
    return response;
  }
}

export { fetch, CustomResponse, CustomHeaders, AbortError };

// Make them available on globalThis if running in an environment where that's expected for tests
if (typeof globalThis !== 'undefined') {
    if (!globalThis.fetch) globalThis.fetch = fetch;
    if (!globalThis.Headers) globalThis.Headers = CustomHeaders;
    if (!globalThis.Response) globalThis.Response = CustomResponse;
    if (!globalThis.AbortError) globalThis.AbortError = AbortError;
}
