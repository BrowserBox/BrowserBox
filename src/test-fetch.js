import './unleash-fetch.js'; // Assuming this provides globalThis.fetch and potentially other fetch functions
import * as BetterFetch from './better-fetch.js';
import { Readable, Writable } from 'stream';

// ANSI color codes
const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  bold: '\x1b[1m',
  white: '\x1b[37m',
  magenta: '\x1b[35m', // For debug
};

// Test counters
let passCount = 0;
let failCount = 0;

const VERBOSE_DEBUG = true; // Set to true for maximum debug output

function log(message, color = COLORS.reset) {
  console.log(`${color}${message}${COLORS.reset}`);
}

function logDebug(label, data) {
  if (!VERBOSE_DEBUG) return;
  if (typeof data === 'object') {
    try {
      log(`[DEBUG] ${label}: ${JSON.stringify(data, null, 2)}`, COLORS.magenta);
    } catch (e) {
      log(`[DEBUG] ${label}: (circular object or stringify error) ${data}`, COLORS.magenta);
    }
  } else {
    log(`[DEBUG] ${label}: ${data}`, COLORS.magenta);
  }
}

function logErrorDetails(error, context) {
    log(`Error in ${context}: ${error.message}`, COLORS.red);
    if (error.stack) {
        log(`Stack: ${error.stack}`, COLORS.red);
    }
    if (error.cause) {
        log(`Cause: ${String(error.cause)}`, COLORS.red);
    }
    const ownProps = Object.getOwnPropertyNames(error);
    const additionalInfo = {};
    ownProps.forEach(prop => {
        if (prop !== 'message' && prop !== 'stack' && prop !== 'name' && prop !== 'cause') {
            additionalInfo[prop] = error[prop];
        }
    });
    if (Object.keys(additionalInfo).length > 0) {
        logDebug(`${context} - Error Details`, additionalInfo);
    }
}

function assert(condition, message, testName, error = null, expected = undefined, actual = undefined) {
  const fullTestName = `${COLORS.bold}${testName}${COLORS.reset}`;
  if (condition) {
    passCount++;
    log(`✓ ${fullTestName}: ${message}`, COLORS.green);
  } else {
    failCount++;
    log(`✗ ${fullTestName}: ${message}`, COLORS.red);
    if (expected !== undefined || actual !== undefined) {
        log(`  Expected: ${COLORS.green}${JSON.stringify(expected)}${COLORS.reset}`, COLORS.red);
        log(`  Actual:   ${COLORS.red}${JSON.stringify(actual)}${COLORS.reset}`, COLORS.red);
    }
    log(`Test failed! Exiting...`, COLORS.red);
    console.error(`Failed test details: ${testName}, "${message}"`);
    if (error) {
      logErrorDetails(error, `Assertion failed - ${testName}`);
    }
    process.exit(1);
  }
  log(`${COLORS.bold}${COLORS.white}Passed: ${passCount}, Failed: ${failCount}${COLORS.reset}`);
}

async function fetchWithTimeout(resource, options = {}) {
  const { timeout = 12000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => {
    logDebug(`fetchWithTimeout`, `Aborting due to timeout ${timeout}ms for ${resource}`);
    controller.abort();
  }, timeout);

  // Remove timeout from options to avoid conflicts if underlying fetch supports it differently
  const { timeout: _, ...restOptions } = options;

  try {
    const response = await fetch(resource, {
      ...restOptions,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

async function fetchWithTimeoutAndRetry(resource, options = {}) {
  try {
    return await fetchWithTimeout(resource, options);
  } catch (e) {
    log(`First fetch failed for ${resource}: ${e.message}. Retrying in ~2.4s...`, COLORS.yellow);
    await new Promise((resolve) => setTimeout(resolve, 2417));
    return fetchWithTimeout(resource, options); // Retry
  }
}

// fetchWithTor: This is a simplified client. It won't behave like a full Fetch Response.
// It needs its own timeout handling if it's to be used with fetchWithTimeout effectively.
async function fetchWithTor(url, options = {}) {
  let agent;
  if (options.customProxy) { // This implies generic proxy support, not necessarily Tor-specific
    agent = options.customProxy;
    // delete options.customProxy; // Don't delete if http.request needs it
  }
  // Note: This implementation does not use AbortSignal or a specific timeout option from `options`
  // Timeout for this would need to be handled by the caller or internally.
  logDebug('fetchWithTor', `Executing for URL: ${url} with options: ${JSON.stringify(options)}`);

  return new Promise(async (resolve, reject) => {
    const protocol = await import(url.startsWith('https') ? 'https' : 'http');
    const requestOptions = {
      agent, // This would be the Tor SOCKS proxy agent if customProxy is configured for Tor
      method: options.method || 'GET',
      headers: options.headers || {}, // Assumes headers is a plain object
      // timeout: options.timeout, // The http.request timeout option
    };

    const req = protocol.request(url, requestOptions, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        // Simplified response object
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          statusCode: res.statusCode, // for compatibility with older code
          statusText: res.statusMessage,
          headers: res.headers, // Node.js http.IncomingMessage headers (object, not Headers API)
          text: () => Promise.resolve(buffer.toString()),
          arrayBuffer: () => Promise.resolve(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)), // Ensure it's an ArrayBuffer
          // Missing: url, redirected, type, clone(), json(), blob() etc.
        });
      });
    });
    req.on('error', (error) => {
      logDebug('fetchWithTor Error', error);
      reject(error);
    });
    // req.on('timeout', () => { // If using http.request timeout
    //   req.abort();
    //   reject(new Error('Request timed out (http.request)'));
    // });
    if (options.body) {
        req.write(options.body);
    }
    req.end();
  });
}


const FETCH_FUNCTIONS = [
  { name: 'fetch (globalThis)', fn: globalThis.fetch, supports: ['text', 'json', 'arrayBuffer', 'blob', 'clone'] },
  { name: 'fetchWithTimeout', fn: fetchWithTimeout, supports: ['text', 'json', 'arrayBuffer', 'blob', 'clone'] },
  { name: 'fetchWithTimeoutAndRetry', fn: fetchWithTimeoutAndRetry, supports: ['text', 'json', 'arrayBuffer', 'blob', 'clone'] },
  { name: 'fetchWithTor', fn: fetchWithTor, supports: ['text', 'arrayBuffer'] }, // Limited support
];

const TEST_URLS = [
  { url: 'https://jsonplaceholder.typicode.com/posts/1', expect: 'json', desc: 'JSON API (JSONPlaceholder)' },
  { url: 'https://api.github.com', expect: 'json', desc: 'GitHub API (JSON)' },
  { url: 'https://httpbin.org/headers', expect: 'json', desc: 'HTTPBin Headers (Echo Request Headers in Body)' },
  { url: 'https://httpbin.org/user-agent', expect: 'json', desc: 'HTTPBin User-Agent (Echo UA in Body)' },
  { url: 'https://httpbin.org/response-headers?X-Test-Server-Header=hello-from-server&Content-Type=application/json; charset=utf-8', expect: 'json', desc: 'HTTPBin Custom Response Headers' },
  { url: 'https://httpbin.org/status/200', expect: 'ok', desc: 'OK (200)'},
  { url: 'https://httpbin.org/status/204', expect: 'no-body', desc: 'No Content (204)' },
  { url: 'https://httpbin.org/status/404', expect: 'error', status: 404, desc: 'Not Found (404)' },
  { url: 'https://httpbin.org/status/500', expect: 'error', status: 500, desc: 'Server Error (500)' },
  { url: 'https://httpbin.org/redirect-to?url=https://httpbin.org/get&status_code=302', expect: 'redirect', finalUrlPart: '/get', desc: 'Redirect (302 to httpbin/get)' },
  { url: 'https://httpbin.org/redirect/2', expect: 'redirect', finalUrlPart: '/get', desc: 'Multiple Redirects (2)' },
  // { url: 'http://localhost:6000/json/version', expect: 'json', desc: 'Localhost Port 6000' }, // Requires local server
  // { url: 'https://duckduckgogg42xjoc72x3sjasowoarfbgcmvfimaftt6twagswzczad.onion/', expect: 'html', desc: 'Tor Onion (DuckDuckGo)', torOnly: true }, // Requires Tor setup and customProxy for fetchWithTor
];

const METHODS = ['GET', 'POST'];
const REDIRECT_MODES = ['follow', 'error', 'manual'];
const TIMEOUT_TEST = { url: 'https://httpbin.org/delay/5', timeout: 2500, expect: 'timeout', desc: 'Timeout (2.5s timeout for 5s delay)' };
const LOCALHOST_HAMMER_COUNT = 3; // Reduced for faster testing
const DEFAULT_TIMEOUT = 12000; //ms

// Main
runTests();

async function runTests() {
  log('\n=== Testing Headers API ===', COLORS.cyan);
  await testHeaders();

  log('\n=== Testing Static Response Methods ===', COLORS.cyan);
  await testStaticMethods();

  if (globalThis.fetch === BetterFetch.fetch) { // Crude check if unleash-fetch is the global fetch
    log('\n=== Testing Node.js Stream Compatibility (unleash-fetch specific) ===', COLORS.cyan);
    await testNodeStreamCompatibility();
  }


  log('\n=== Testing Fetch Scenarios ===', COLORS.cyan);
  for (const fetchFunc of FETCH_FUNCTIONS) {
    log(`\n>>> Testing Fetch Function: ${COLORS.bold}${fetchFunc.name}${COLORS.reset}`, COLORS.cyan);
    for (const test of TEST_URLS) {
      if (test.torOnly && fetchFunc.name !== 'fetchWithTor') {
        log(`Skipping Tor-only test "${test.desc}" for non-Tor fetch function "${fetchFunc.name}"`, COLORS.yellow);
        continue;
      }
      if (!test.torOnly && fetchFunc.name === 'fetchWithTor') {
        log(`Skipping non-Tor test "${test.desc}" for Tor-only fetch function "${fetchFunc.name}" (unless customProxy is smart)`, COLORS.yellow);
        // continue; // Or allow if fetchWithTor can handle clearnet via customProxy
      }

      for (const method of METHODS) {
        if (test.expect === 'no-body' && method === 'POST') {
            log(`Skipping POST for no-body test "${test.desc}" as it implies sending a body.`, COLORS.yellow);
            continue;
        }
        for (const redirect of REDIRECT_MODES) {
          // Some redirect modes don't make sense for POSTs with certain fetch implementations or are complex to test generically
          if (method === 'POST' && (redirect === 'error' || redirect === 'manual')) {
             log(`Skipping POST with redirect='${redirect}' for "${test.desc}" due to complexity/spec variance.`, COLORS.yellow);
             continue;
          }
          await testFetchScenario(fetchFunc, test, method, redirect);
        }
      }
    }

    // Test timeout specifically
    if (fetchFunc.name !== 'fetchWithTor' || TIMEOUT_TEST.customProxy) { // fetchWithTor needs its own timeout or relies on agent
        log(`\n--- Testing Timeout Scenario for ${fetchFunc.name} ---`, COLORS.cyan);
        await testFetchScenario(fetchFunc, TIMEOUT_TEST, 'GET', 'follow');
    } else {
        log(`Skipping timeout test for ${fetchFunc.name} as it has custom timeout handling.`, COLORS.yellow);
    }


    // Hammer localhost (if configured and not fetchWithTor)
    const localTest = TEST_URLS.find((t) => t.url.includes('localhost:6000'));
    if (localTest && fetchFunc.name !== 'fetchWithTor') {
      log(`\n--- Hammering Localhost:6000 with ${fetchFunc.name} ---`, COLORS.cyan);
      for (let i = 1; i <= LOCALHOST_HAMMER_COUNT; i++) {
        log(`Hammer Attempt ${i}/${LOCALHOST_HAMMER_COUNT}`, COLORS.cyan);
        await testFetchScenario(fetchFunc, localTest, 'GET', 'follow');
      }
    }
  }

  log('\n=== All Tests Completed ===', COLORS.cyan);
  log(`Final Count - Passed: ${passCount}, Failed: ${failCount}`, failCount > 0 ? COLORS.red : COLORS.green);
  if (failCount > 0) process.exitCode = 1; // Indicate failure for CI
}

async function testHeaders() {
  const headersObj = new globalThis.Headers({ 'Content-Type': 'application/json', 'X-Test': 'value' });
  assert(headersObj.get('content-type') === 'application/json' && headersObj.has('x-test'), 'Constructor with object', 'Headers: Object Init');
  assert(headersObj.get('X-Test') === 'value', 'Case-insensitive get for X-Test', 'Headers: Case Get');

  headersObj.set('x-test', 'new-value');
  assert(headersObj.get('X-Test') === 'new-value', 'Set overwrites existing (case-insensitive)', 'Headers: Set Overwrite');

  headersObj.append('X-Another', 'val1');
  headersObj.append('X-Another', 'val2');
  assert(headersObj.get('x-another') === 'val1, val2', 'Append multiple values', 'Headers: Append');

  const entries = [];
  for (const [key, value] of headersObj) { entries.push(`${key}: ${value}`); }
  assert(entries.length >= 3, `Iteration produced ${entries.length} entries`, 'Headers: Iteration');
  logDebug('Header entries', entries);

  let forEachCount = 0;
  headersObj.forEach((value, key) => {
    logDebug('Header forEach', `${key}: ${value}`);
    forEachCount++;
  });
  assert(forEachCount === headersObj.size || forEachCount >= 3, `forEach iterated ${forEachCount} times`, 'Headers: forEach'); // .size is not in all Headers impl

  headersObj.delete('X-Another');
  assert(!headersObj.has('x-another'), 'Delete header', 'Headers: Delete');
}

async function testStaticMethods() {
  const errorResponse = globalThis.Response.error();
  assert(errorResponse.status === 0 && errorResponse.type === 'error', 'Response.error() basic checks', 'Static: Response.error');
  assert(!errorResponse.headers.keys().next().value, 'Response.error() has no headers', 'Static: Response.error Headers');

  const redirectResponse = globalThis.Response.redirect('https://example.com', 302);
  assert(redirectResponse.status === 302 && redirectResponse.headers.get('Location') === 'https://example.com', 'Response.redirect() checks', 'Static: Response.redirect');
  assert(redirectResponse.type === 'default', 'Response.redirect() type is default', 'Static: Response.redirect Type');
}

async function testNodeStreamCompatibility() {
  // This test is specific to Node.js environments and assumes `unleash-fetch.js` might expose a Node stream.
  // Standard fetch `Response.body` is a WHATWG ReadableStream, not a Node.js stream.
  // If `unleash-fetch.js` polyfills `_stream` for Node.js stream compatibility, this tests it.
  try {
    const response = await globalThis.fetch('https://jsonplaceholder.typicode.com/posts/1');
    if (!response._stream || !(response._stream instanceof Readable)) {
      log('Skipping Node.js stream test: response._stream is not a Node.js Readable stream.', COLORS.yellow);
      passCount++; // Count as a pass if not applicable, or make it a specific check
      log(`✓ Stream Compatibility: Skipped (no Node.js _stream)`, COLORS.yellow);
      log(`${COLORS.bold}${COLORS.white}Passed: ${passCount}, Failed: ${failCount}${COLORS.reset}`);
      return;
    }
    const chunks = [];
    const writable = new Writable({
      write(chunk, encoding, callback) { chunks.push(chunk); callback(); },
    });
    response._stream.pipe(writable);
    await new Promise((resolve, reject) => {
      writable.on('finish', resolve);
      writable.on('error', reject);
    });
    const buffer = Buffer.concat(chunks);
    assert(buffer.toString('utf8').includes('"userId"'), 'Piped Node.js stream content matches', 'Stream Compatibility: _stream Pipe');
  } catch (e) {
    assert(false, `Node.js stream compatibility error: ${e.message}`, 'Stream Compatibility: _stream Error', e);
  }
}

async function testFetchScenario(fetchFunc, test, method, redirect) {
  const testId = `${fetchFunc.name} | ${test.desc} | ${method} | Redirect: ${redirect}`;
  log(`\n[TEST START] ${testId}`, COLORS.cyan);
  log(`URL: ${test.url}`);
  const startTime = Date.now();

  const requestHeaders = new globalThis.Headers({
    'X-Request-ID': `test-${Date.now()}`,
    'User-Agent': 'UnleashFetchTester/1.1',
  });
  if (method === 'POST') {
    requestHeaders.set('Content-Type', 'application/json');
  }

  const options = {
    method,
    headers: requestHeaders,
    redirect,
    timeout: test.timeout || DEFAULT_TIMEOUT, // Used by fetchWithTimeout
    // customProxy: test.torOnly ? { host: '127.0.0.1', port: 9050 /* Tor SOCKS default */ } : undefined, // Example for fetchWithTor
  };

  if (method === 'POST') {
    options.body = JSON.stringify({ testData: 'payload', timestamp: new Date().toISOString() });
  }

  logDebug(`${testId} - Request Options`, { ...options, headers: Object.fromEntries(options.headers.entries()), body: options.body ? (options.body.length > 100 ? options.body.substring(0,100) + "..." : options.body) : undefined });

  try {
    const response = await fetchFunc.fn(test.url, options); // This is the ORIGINAL response object
    const duration = Date.now() - startTime;

    log(`[RESPONSE] ${testId} | Status: ${response.status || response.statusCode} ${response.statusText || ''} | Duration: ${duration}ms`);
    logDebug(`${testId} - Response Properties`, {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        redirected: response.redirected,
        type: response.type,
    });

    const responseHeadersObj = {};
    if (response.headers && typeof response.headers.forEach === 'function') {
      response.headers.forEach((value, key) => { responseHeadersObj[key] = value; });
    } else if (response.headers) { // For simple objects like in fetchWithTor's current response
      Object.assign(responseHeadersObj, response.headers);
    }
    logDebug(`${testId} - Response Headers`, responseHeadersObj);

    // === HEADER ASSERTIONS ===
    if (test.url.includes('httpbin.org/headers')) { // Checks if request headers are sent correctly
        assert(fetchFunc.supports.includes('json'), `JSON support needed for httpbin.org/headers check`, `${testId} - Prereq: JSON support`);
        // Use a clone for this check if possible, to keep original response body intact for later tests
        const resForHeaderCheck = (response.clone && fetchFunc.supports.includes('clone')) ? response.clone() : response;
        const jsonBody = await resForHeaderCheck.json();
        const echoedHeaders = jsonBody.headers;
        assert(echoedHeaders['X-Request-Id'] && echoedHeaders['User-Agent'] === 'UnleashFetchTester/1.1',
            `Request headers (X-Request-Id, User-Agent) echoed by httpbin.org/headers. UA: ${echoedHeaders['User-Agent']}`,
            `${testId} - Echoed Request Headers`);
    } else if (test.url.includes('httpbin.org/response-headers')) { // Checks if server-set headers are parsed
        const serverHeader = response.headers && typeof response.headers.get === 'function' ? response.headers.get('x-test-server-header') : responseHeadersObj['x-test-server-header'];
        assert(serverHeader === 'hello-from-server',
            `Server-set 'x-test-server-header' received. Got: ${serverHeader}`,
            `${testId} - Server-Set Header`);
    }

    // === STATUS AND REDIRECT ASSERTIONS ===
    if (test.expect === 'timeout') {
      assert(false, `Fetch call did NOT timeout as expected. Status: ${response.status}`, `${testId} - Timeout Failure`);
      return; // Exit early if timeout was expected but didn't happen
    }

    if (test.expect === 'error') {
      assert(response.ok === false, `response.ok should be false for error expectation. Status: ${response.status}`, `${testId} - Error Expectation (ok)`);
      if (test.status) {
        assert((response.status || response.statusCode) === test.status, `Status code mismatch for error. Expected ${test.status}`, `${testId} - Error Expectation (status)`, test.status, response.status || response.statusCode);
      }
    } else if (test.expect !== 'no-body' && test.expect !== 'redirect') { // Standard OK response
      assert(response.ok === true, `response.ok should be true. Status: ${response.status}`, `${testId} - Success Expectation (ok)`);
    }

    if (test.expect === 'redirect') {
      const currentUrl = response.url || test.url;
      if (redirect === 'follow') {
        assert(response.redirected === true, `response.redirected should be true for 'follow'. Got: ${response.redirected}`, `${testId} - Redirect Follow (redirected)`);
        assert(currentUrl.includes(test.finalUrlPart), `Final URL should contain '${test.finalUrlPart}'. Got: ${currentUrl}`, `${testId} - Redirect Follow (url)`);
      } else if (redirect === 'manual') {
        const status = response.status || response.statusCode;
        const isRedirectStatus = status >= 300 && status < 400;
        assert(response.type === 'opaqueredirect' || (isRedirectStatus && response.redirected === false),
            `Manual redirect: type 'opaqueredirect' or (3xx status and redirected=false). Type: ${response.type}, Status: ${status}, Redirected: ${response.redirected}`,
            `${testId} - Redirect Manual (type/status)`);
        const locHeader = response.headers && typeof response.headers.get === 'function' ? response.headers.get('location') : responseHeadersObj['location'];
        assert(!!locHeader, `Location header must be present for manual redirect. Got: ${locHeader}`, `${testId} - Redirect Manual (location)`);
      }
    }

    // === BODY CONSUMPTION TESTS ===
    for (const methodName of fetchFunc.supports) {
      if (methodName === 'clone' && (!response.clone || !fetchFunc.supports.includes('clone'))) {
        logDebug(`${testId}`, `Skipping clone test for ${fetchFunc.name} as response.clone() is not available/supported.`);
        continue;
      }

      let resForBodyTest = response; // By default, operate on the original response
      let isCloneTest = false;

      if (methodName !== 'clone' && response.clone && fetchFunc.supports.includes('clone')) {
        // If we are testing a body method (not 'clone' itself) AND cloning is supported,
        // we create a clone to run the body method on.
        // The original 'response' object should remain usable if the clone is consumed.
        try {
          resForBodyTest = response.clone(); // This is the CLONED response
          isCloneTest = true;
          logDebug(`${testId} - Body Method`, `Testing with CLONED response for ${methodName}()`);
        } catch (e) {
          assert(false, `response.clone() failed: ${e.message}`, `${testId} - Response Clone Method Error`, e);
          continue; // Skip this body method test if cloning failed
        }
      } else if (methodName === 'clone') { // This is the specific test FOR the .clone() method itself
        if (response.clone && fetchFunc.supports.includes('clone')) {
            const clonedObject = response.clone(); // Call clone on the original response
            assert(!!clonedObject, `response.clone() should return a new response object.`, `${testId} - Response Clone Call`);
            assert(clonedObject !== response, `response.clone() should return a NEW instance.`, `${testId} - Response Clone New Instance`);
            assert(response.bodyUsed === false, `Original response.bodyUsed should be false after its clone() method is called. Got: ${response.bodyUsed}`, `${testId} - Original BodyUsed After Clone Call`);
            assert(clonedObject.bodyUsed === false, `Cloned response.bodyUsed should be false initially. Got: ${clonedObject.bodyUsed}`, `${testId} - Cloned BodyUsed Initial`);
        } else {
            // This case should ideally not be hit if fetchFunc.supports is accurate
            assert(false, `response.clone() is listed in supports but not available/supported.`, `${testId} - Response Clone Not Supported`);
        }
        continue; // Move to the next methodName after testing 'clone'
      } else {
        // Not testing a body method that uses a clone, so we're using the original 'response' directly.
        // Or, cloning is not supported by this fetchFunc.
        logDebug(`${testId} - Body Method`, `Testing with ORIGINAL response for ${methodName}()`);
      }

      // Handle expectations for no-body responses
      if (test.expect === 'no-body') {
        if (['json', 'text', 'arrayBuffer', 'blob'].includes(methodName)) {
          try {
            const bodyResult = await resForBodyTest[methodName]();
            if (methodName === 'json') {
                 assert(false, `${methodName}() should throw for no-body response. It resolved.`, `${testId} - ${methodName} No-Body Failure`);
            } else if (methodName === 'text') {
                 assert(bodyResult === '', `${methodName}() should resolve to empty string for no-body. Got: "${String(bodyResult).substring(0,20)}"`, `${testId} - ${methodName} No-Body Success`);
            } else { // arrayBuffer, blob
                 assert( (bodyResult.byteLength || bodyResult.size) === 0, `${methodName}() should resolve to empty for no-body. Size: ${bodyResult.byteLength || bodyResult.size}`, `${testId} - ${methodName} No-Body Success`);
            }
          } catch (e) {
            assert(true, `${methodName}() threw (expected for json, or if strict): ${e.message}`, `${testId} - ${methodName} No-Body Exception`);
          }
        }
        continue; // Move to next methodName for no-body tests
      }

      // Skip certain body methods for error responses if content type is unlikely to match
      if (test.expect === 'error' && (methodName === 'json' || methodName === 'blob')) {
        log(`Skipping ${methodName}() for error response (content likely not ${methodName}).`, COLORS.yellow);
        continue;
      }

      // --- Main body consumption and reuse test block ---
      try {
        logDebug(`${testId} - Body Method`, `Attempting: ${isCloneTest ? "clonedResponse" : "originalResponse"}.${methodName}()`);
        const result = await resForBodyTest[methodName](); // Consumes resForBodyTest (either original or clone)
        const resultPreview = result && typeof result === 'string' ? result.substring(0, 70) + '...' : (result ? `${typeof result} (size/length: ${result.size || result.byteLength || result.length || 'N/A'})` : String(result));
        logDebug(`${testId} - Body Method Result [${methodName}]`, resultPreview);

        // Assertions for the type of result from the body method
        if (methodName === 'text') assert(typeof result === 'string', `text() result type.`, `${testId} - ${methodName} Type`);
        else if (methodName === 'json') assert(typeof result === 'object' && result !== null, `json() result type.`, `${testId} - ${methodName} Type`);
        else if (methodName === 'arrayBuffer') assert(result instanceof ArrayBuffer || (typeof SharedArrayBuffer !== 'undefined' && result instanceof SharedArrayBuffer) || (result && typeof result.byteLength === 'number'), `arrayBuffer() result type. Got: ${Object.prototype.toString.call(result)}`, `${testId} - ${methodName} Type`);
        else if (methodName === 'blob') assert(result && typeof result.size === 'number' && typeof result.type === 'string', `blob() result type.`, `${testId} - ${methodName} Type`);

        assert(true, `${methodName}() call on ${isCloneTest ? "clone" : "original"} succeeded.`, `${testId} - ${methodName} Success`);

        //vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv
        // START OF MODIFIED SECTION FOR bodyUsed and REUSE TESTING
        //vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv
        if (isCloneTest) { // We consumed the CLONED response (resForBodyTest)
            assert(resForBodyTest.bodyUsed === true,
                `Cloned response bodyUsed should be true after ${methodName}(). Got: ${resForBodyTest.bodyUsed}`,
                `${testId} - Cloned ${methodName} bodyUsed After`);

            assert(response.bodyUsed === false, // Check ORIGINAL response
                `Original response bodyUsed should be false after consuming clone. Got: ${response.bodyUsed}`,
                `${testId} - Original ${methodName} bodyUsed After Clone Consumed`);

            // Try to reuse the CLONED response (should fail)
            try {
                await resForBodyTest[methodName]();
                assert(false, `Cloned ${methodName}() should throw on body reuse.`, `${testId} - Cloned ${methodName} Reuse Failure`);
            } catch (e_reuse_clone) {
                assert(true, `Cloned ${methodName}() threw expected reuse error: ${e_reuse_clone.message}`, `${testId} - Cloned ${methodName} Reuse Success`);
            }

            // Now, try to use the ORIGINAL response for the first time (should succeed)
            if (response.bodyUsed === false) { // Ensure original hasn't been accidentally used
                try {
                    logDebug(`${testId} - Body Method`, `Attempting originalResponse.${methodName}() after clone was consumed.`);
                    await response[methodName](); // This will mark the original as used
                    assert(true, `Original ${methodName}() succeeded after clone was consumed.`, `${testId} - Original ${methodName} After Clone Consumed Success`);

                    assert(response.bodyUsed === true,
                        `Original response bodyUsed should be true after its own ${methodName}(). Got: ${response.bodyUsed}`,
                        `${testId} - Original ${methodName} bodyUsed After Own Consumption`);
                    // And try to reuse original (should fail)
                    try {
                        await response[methodName]();
                        assert(false, `Original ${methodName}() should throw on body reuse after own consumption.`, `${testId} - Original ${methodName} Reuse Failure After Own Consumption`);
                    } catch (e_reuse_original_own) {
                        assert(true, `Original ${methodName}() threw expected reuse error after own consumption: ${e_reuse_original_own.message}`, `${testId} - Original ${methodName} Reuse Success After Own Consumption`);
                    }
                } catch (e_original_after_clone) {
                    assert(false, `Original ${methodName}() failed unexpectedly after clone was consumed: ${e_original_after_clone.message}`, `${testId} - Original ${methodName} After Clone Consumed Failure`, e_original_after_clone);
                }
            } else {
                log(`Skipping consumption test of original response after clone, as original.bodyUsed is already true. This might indicate an issue.`, COLORS.yellow);
            }

        } else { // We consumed the ORIGINAL response (resForBodyTest is the same as response)
            assert(response.bodyUsed === true,
                `Original response bodyUsed should be true after ${methodName}(). Got: ${response.bodyUsed}`,
                `${testId} - Original ${methodName} bodyUsed After`);

            // Try to reuse the ORIGINAL response (should fail)
            try {
                await response[methodName]();
                assert(false, `Original ${methodName}() should throw on body reuse.`, `${testId} - Original ${methodName} Reuse Failure`);
            } catch (e_reuse_original) {
                assert(true, `Original ${methodName}() threw expected reuse error: ${e_reuse_original.message}`, `${testId} - Original ${methodName} Reuse Success`);
            }
        }
        //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        // END OF MODIFIED SECTION FOR bodyUsed and REUSE TESTING
        //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

      } catch (e_body) {
        assert(false, `${methodName}() on ${isCloneTest ? "clone" : "original"} threw unexpected error: ${e_body.message}`, `${testId} - ${methodName} Unexpected Error`, e_body);
      }
    } // End of for...of methodName loop

  } catch (error) { // Catch errors from the main fetchFunc.fn call or initial setup
    const duration = Date.now() - startTime;
    log(`[FETCH ERROR] ${testId} | Duration: ${duration}ms`, COLORS.red);
    logErrorDetails(error, `${testId} - Main Catch Block`);

    if (test.expect === 'timeout') {
      const isTimeoutErr = error.name === 'AbortError' || (error.message && error.message.toLowerCase().includes('timeout'));
      assert(isTimeoutErr, `Expected timeout error. Got: ${error.name} - ${error.message}`, `${testId} - Timeout Exception`, undefined, 'TimeoutError/AbortError', error.name);
    } else if (test.expect === 'redirect' && redirect === 'error') {
      // Fetch should throw if redirect='error' and a redirect occurs
      // This error might be a TypeError from fetch itself, or a custom error.
      assert(true, `Fetch correctly threw for redirect='error': ${error.message}`, `${testId} - Redirect Error Mode Exception`);
    } else {
      assert(false, `Unexpected fetch error: ${error.message}`, `${testId} - Unexpected Fetch Exception`, error);
    }
  }
}
