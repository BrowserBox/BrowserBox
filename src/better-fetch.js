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

class CustomResponse {
  constructor({ stream, status, headers, url, redirected = false, type = 'basic', protocol }) {
    this._stream = stream;
    this._buffered = false;
    this._buffer = null;
    this.status = Number(status); // Ensure status is a number
    this.headers = headers instanceof CustomHeaders ? headers : new CustomHeaders(headers);
    this.url = String(url);
    this.bodyUsed = false;
    this.redirected = !!redirected;
    this.type = String(type);
    this.statusText = STATUS_TEXT[this.status] || '';
    this.protocol = protocol || (this.url.startsWith('https') ? 'h2' : 'http/1.1'); // Guess protocol
  }

  get ok() {
    return this.status >= 200 && this.status <= 299;
  }

  get body() {
    if (this._stream && !Readable.isDisturbed?.(this._stream) && !this.bodyUsed) { // isDisturbed is newer
        return Readable.toWeb(this._stream);
    } else if (this._buffer && !this.bodyUsed) { // If already buffered, provide stream from buffer
        return Readable.toWeb(Readable.from(this._buffer));
    }
    // If bodyUsed or no stream/buffer, return null or throw as per spec for ReadableStream
    // For simplicity, if bodyUsed, we let methods below throw. If no body, methods return empty.
    return null;
  }

  async _bufferStream() {
    if (this._buffered || !this._stream) {
      return;
    }
    try {
      const chunks = [];
      for await (const chunk of this._stream) {
        chunks.push(chunk);
      }
      this._buffer = Buffer.concat(chunks);
    } catch (err) {
      // If stream errors during buffering, store the error and rethrow
      this._streamError = err;
      throw err;
    } finally {
      this._buffered = true;
      // According to WHATWG Streams, the original stream should be "disturbed" or "closed"
      // We effectively nullify it to prevent reuse.
      if (this._stream && typeof this._stream.destroy === 'function') {
        this._stream.destroy();
      }
      this._stream = null;
    }
  }

  async text() {
    if (this.bodyUsed) throw new TypeError('Body already used');
    this.bodyUsed = true;
    if (this._streamError) throw this._streamError; // Rethrow if buffering failed
    await this._bufferStream();
    return this._buffer ? this._buffer.toString('utf8') : '';
  }

  async json() {
    const bodyText = await this.text();
    if (bodyText === '') { // Handle empty body for JSON parsing
        throw new SyntaxError('Unexpected end of JSON input');
    }
    try {
        return JSON.parse(bodyText);
    } catch (e) {
        throw new SyntaxError(`Failed to parse JSON: ${e.message}`);
    }
  }

  async arrayBuffer() {
    if (this.bodyUsed) throw new TypeError('Body already used');
    this.bodyUsed = true;
    if (this._streamError) throw this._streamError;
    await this._bufferStream();
    if (!this._buffer) return new ArrayBuffer(0);
    return this._buffer.buffer.slice(this._buffer.byteOffset, this._buffer.byteOffset + this._buffer.byteLength);
  }

  async blob() {
    // Blob is not globally available in Node.js by default before v18.
    // For testing, we might need a polyfill or ensure Node >= 18.
    // Assuming Blob is available (e.g., via `import { Blob } from 'buffer';`)
    if (typeof Blob === 'undefined') {
        throw new Error('Blob is not supported in this environment. Requires Node.js 18+ or a polyfill.');
    }
    const buffer = await this.arrayBuffer();
    return new Blob([buffer], { type: this.headers.get('content-type') || '' });
  }

  async formData() {
    // formData parsing is complex and typically requires a multipart parser.
    if (this.bodyUsed) throw new TypeError('Body already used');
    this.bodyUsed = true;
    throw new Error('formData() is not yet supported in this fetch implementation.');
  }

  clone() {
    if (this.bodyUsed) {
      throw new TypeError('Cannot clone: response body is already used or stream is disturbed.');
    }
    if (this._stream && !this._buffered) {
      // If stream exists and not buffered, we must buffer it first to clone.
      // This is an async operation, which makes clone() effectively async if not buffered.
      // Standard clone() is synchronous. This is a deviation or requires pre-buffering.
      // For simplicity here, we'll assume if clone is called, buffering is acceptable.
      // A more advanced implementation might use Teeing for WHATWG streams.
      // Let's make _bufferStream synchronous for clone or throw if not possible.
      // Or, we accept that clone() might need to be async if it triggers buffering.
      // For now, let's throw if trying to clone an unbuffered live stream,
      // or make it clear that clone() might implicitly buffer.
      // The test suite implies clone is sync. So, if we have a live stream, we can't truly clone it
      // without consuming it or using Teeing (which Node's Readable doesn't directly support for toWeb).
      // Let's assume for this version, if _stream exists, it must be buffered by calling a body method first,
      // or clone will operate on a null stream if no body method was called.
      // A better approach: if _stream exists and not buffered, the clone gets a new stream from _buffer if it becomes available.
      // This is complex. Let's stick to: clone works if buffered, or if stream is null.
      if (!this._buffered) {
          // To make clone() synchronous and safe with an unbuffered stream,
          // the original stream would need to be tee-able.
          // Since Node.js Readable.toWeb() doesn't inherently tee,
          // and we don't want clone() to be async here:
          console.warn("Cloning a response with an unbuffered stream. The clone will not have a body until the original is consumed and buffered, or it will have an empty body if the original is never consumed. This behavior might differ from browser fetch.");
      }
    }

    // If already buffered, the clone gets a new stream from the existing buffer.
    const newStream = this._buffer ? Readable.from(this._buffer) : null;

    const clonedResponse = new CustomResponse({
      stream: newStream, // The clone gets a new stream from the buffer if available
      status: this.status,
      headers: new CustomHeaders(this.headers), // Deep copy headers
      url: this.url,
      redirected: this.redirected,
      type: this.type,
      protocol: this.protocol,
    });
    // If the original was buffered, the clone is also considered buffered with the same data.
    if (this._buffered) {
        clonedResponse._buffer = this._buffer; // Share the immutable buffer
        clonedResponse._buffered = true;
    }
    return clonedResponse;
  }

  static error() {
    return new CustomResponse({
      stream: null,
      status: 0, // Network errors are typically represented by status 0
      headers: new CustomHeaders(),
      url: '',
      type: 'error',
    });
  }

  static redirect(url, status = 302) {
    if (![301, 302, 303, 307, 308].includes(status)) {
      throw new RangeError('Invalid status code for redirect');
    }
    return new CustomResponse({
      stream: null,
      status: status,
      headers: new CustomHeaders({ Location: url }),
      url: '', // The URL of the Response object itself is empty for a redirect response
      type: 'default', // Per spec, type is 'default' for Response.redirect()
    });
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
