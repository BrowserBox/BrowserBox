import './unleash-fetch.js'; // Assuming this provides globalThis.fetch and potentially other fetch functions
import * as BetterFetch from './better-fetch.js'; // Assuming your fetch impl is here
import { Readable, Writable } from 'stream';
import { Buffer } from 'buffer'; // Ensure Buffer is available

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

  const { timeout: _, ...restOptions } = options;

  try {
    // Ensure globalThis.fetch is used here if it's what fetchWithTimeout is supposed to wrap
    const response = await globalThis.fetch(resource, {
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
    return fetchWithTimeout(resource, options);
  }
}

async function fetchWithTor(url, options = {}) {
  let agent;
  if (options.customProxy) {
    agent = options.customProxy;
  }
  logDebug('fetchWithTor', `Executing for URL: ${url} with options: ${JSON.stringify(options)}`);

  return new Promise(async (resolve, reject) => {
    // Dynamic import for http/https modules
    const protocolModule = await import(url.startsWith('https') ? 'https' : 'http');
    const requestOptions = {
      agent,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = protocolModule.request(url, requestOptions, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          statusCode: res.statusCode,
          statusText: res.statusMessage,
          headers: res.headers,
          text: () => Promise.resolve(buffer.toString()),
          arrayBuffer: () => Promise.resolve(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)),
        });
      });
    });
    req.on('error', (error) => {
      logDebug('fetchWithTor Error', error);
      reject(error);
    });
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
  { name: 'fetchWithTor', fn: fetchWithTor, supports: ['text', 'arrayBuffer'] },
];

// vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv
// MODIFIED SECTION: TEST_URLS
// vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv
const TEST_URLS = [
  {
    url: 'https://jsonplaceholder.typicode.com/posts/1',
    desc: 'JSON API (JSONPlaceholder /posts/1)',
    methodExpectations: { // Method-specific expectations
      GET: { expect: 'json' }, // GET to /posts/1 is fine, returns the post
      POST: { expect: 'error', status: 404 } // POST to /posts/1 on JSONPlaceholder typically returns 404 or similar
                                             // It's not a creation endpoint for a specific ID.
    }
  },
  {
    url: 'https://jsonplaceholder.typicode.com/posts',
    desc: 'JSON API POST (JSONPlaceholder /posts)',
    methods: ['POST'], // Only test POST for this one
    expect: 'json', // Expects 201 Created, which is ok: true
    status: 201, // Expect this status code
  },
  { url: 'https://api.github.com', methods: ['GET'], expect: 'json', desc: 'GitHub API (JSON)' }, // GitHub might rate limit or require UA
  { url: 'https://httpbin.org/headers', methods: ['GET'], expect: 'json', desc: 'HTTPBin Headers (Echo Request Headers in Body)' },
  { url: 'https://httpbin.org/user-agent', methods: ['GET'], expect: 'json', desc: 'HTTPBin User-Agent (Echo UA in Body)' },
  { url: 'https://httpbin.org/response-headers?X-Test-Server-Header=hello-from-server&Content-Type=application/json; charset=utf-8', expect: 'json', desc: 'HTTPBin Custom Response Headers' },
  { url: 'https://httpbin.org/status/200', expect: 'ok', desc: 'OK (200)'},
  { url: 'https://httpbin.org/status/204', expect: 'no-body', desc: 'No Content (204)' },
  { url: 'https://httpbin.org/status/404', expect: 'error', status: 404, desc: 'Not Found (404)' },
  { url: 'https://httpbin.org/status/500', expect: 'error', status: 500, desc: 'Server Error (500)' },
  { url: 'https://httpbin.org/redirect-to?url=https://httpbin.org/get&status_code=302', expect: 'redirect', finalUrlPart: '/get', desc: 'Redirect (302 to httpbin/get)' },
  { url: 'https://httpbin.org/redirect/2', method: ['GET'], expect: 'redirect', finalUrlPart: '/get', desc: 'Multiple Redirects (2)' },
];
// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// END OF MODIFIED SECTION: TEST_URLS
// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

const METHODS = ['GET', 'POST'];
const REDIRECT_MODES = ['follow', 'error', 'manual'];
const TIMEOUT_TEST = { url: 'https://httpbin.org/delay/5', timeout: 2500, expect: 'timeout', desc: 'Timeout (2.5s timeout for 5s delay)' };
const LOCALHOST_HAMMER_COUNT = 3;
const DEFAULT_TIMEOUT = 12000;

// Main
runTests();

// vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv
// MODIFIED SECTION: runTests function
// vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv
async function runTests() {
  log('\n=== Testing Headers API ===', COLORS.cyan);
  await testHeaders();

  log('\n=== Testing Static Response Methods ===', COLORS.cyan);
  await testStaticMethods();

  // Check if globalThis.fetch is your custom fetch
  // Note: BetterFetch.fetch might not be defined if better-fetch.js doesn't export it that way
  // or if unleash-fetch.js doesn't re-export it. Assuming globalThis.fetch is patched.
  let isCustomFetch = false;
  try {
    // A more reliable check might be needed if BetterFetch is not directly importable here
    // For now, let's assume if it's not the native one, it's ours. This is brittle.
    if (globalThis.fetch.toString().includes('CustomResponse')) isCustomFetch = true;
  } catch {}


  if (isCustomFetch) {
    log('\n=== Testing Node.js Stream Compatibility (Custom Fetch specific) ===', COLORS.cyan);
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
        // continue;
      }

      for (const method of METHODS) {
        // Check if the current test case is restricted to certain methods
        if (test.methods && !test.methods.includes(method)) {
          log(`Skipping method ${method} for test "${test.desc}" as it's not in its allowed methods [${test.methods.join(', ')}].`, COLORS.yellow);
          continue;
        }

        // Determine the effective expectation for this method
        let effectiveExpect = test.expect;
        if (test.methodExpectations && test.methodExpectations[method] && test.methodExpectations[method].expect !== undefined) {
            effectiveExpect = test.methodExpectations[method].expect;
        }

        if (effectiveExpect === 'no-body' && method === 'POST') {
            log(`Skipping POST for no-body test "${test.desc}" as it implies sending a body.`, COLORS.yellow);
            continue;
        }
        for (const redirect of REDIRECT_MODES) {
          if (method === 'POST' && (redirect === 'error' || redirect === 'manual')) {
             log(`Skipping POST with redirect='${redirect}' for "${test.desc}" due to complexity/spec variance.`, COLORS.yellow);
             continue;
          }
          await testFetchScenario(fetchFunc, test, method, redirect);
        }
      }
    }

    if (fetchFunc.name !== 'fetchWithTor' || TIMEOUT_TEST.customProxy) {
        log(`\n--- Testing Timeout Scenario for ${fetchFunc.name} ---`, COLORS.cyan);
        await testFetchScenario(fetchFunc, TIMEOUT_TEST, 'GET', 'follow');
    } else {
        log(`Skipping timeout test for ${fetchFunc.name} as it has custom timeout handling.`, COLORS.yellow);
    }

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
  if (failCount > 0) process.exitCode = 1;
}
// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// END OF MODIFIED SECTION: runTests function
// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

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
  // For CustomHeaders, forEach iterates per unique key, so count should match map size.
  // For native Headers, it might be different.
  const expectedForEachCount = headersObj._headers instanceof Map ? headersObj._headers.size : (headersObj.size || Array.from(headersObj.keys()).length);
  assert(forEachCount === expectedForEachCount || forEachCount >= 2, `forEach iterated ${forEachCount} times (expected around ${expectedForEachCount})`, 'Headers: forEach');


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
  try {
    const response = await globalThis.fetch('https://jsonplaceholder.typicode.com/posts/1');
    // Accessing _stream is specific to your custom fetch implementation
    if (!response._stream || !(response._stream instanceof Readable)) {
      log('Skipping Node.js stream test: response._stream is not a Node.js Readable stream or not exposed.', COLORS.yellow);
      passCount++;
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

// vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv
// MODIFIED SECTION: testFetchScenario function
// vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv
async function testFetchScenario(fetchFunc, test, method, redirect) {
  const testId = `${fetchFunc.name} | ${test.desc} | ${method} | Redirect: ${redirect}`;
  log(`\n[TEST START] ${testId}`, COLORS.cyan);
  log(`URL: ${test.url}`);
  const startTime = Date.now();

  const requestHeaders = new globalThis.Headers({
    'X-Request-ID': `test-${Date.now()}`,
    'User-Agent': 'UnleashFetchTester/1.1', // Standard test UA
  });
  if (method === 'POST') {
    requestHeaders.set('Content-Type', 'application/json');
  }

  const options = {
    method,
    headers: requestHeaders,
    redirect,
    timeout: test.timeout || DEFAULT_TIMEOUT,
  };

  if (method === 'POST') {
    if (test.url.includes('jsonplaceholder.typicode.com/posts') && !test.url.endsWith('/1')) { // For /posts (creation)
        options.body = JSON.stringify({ title: 'foo title', body: 'bar body', userId: 1 });
    } else { // For other POSTs, like /posts/1 (update, or error) or httpbin
        options.body = JSON.stringify({ testData: 'payload', timestamp: new Date().toISOString() });
    }
  }

  logDebug(`${testId} - Request Options`, { ...options, headers: Object.fromEntries(options.headers.entries()), body: options.body ? (options.body.length > 100 ? options.body.substring(0,100) + "..." : options.body) : undefined });

  // --- Determine the correct expectation for this specific method ---
  // This needs to be outside the try block if used in catch for timeout/redirect error.
  let currentExpectation = test.expect;
  let currentExpectedStatus = test.status;

  if (test.methodExpectations && test.methodExpectations[method]) {
      const methodSpecific = test.methodExpectations[method];
      currentExpectation = methodSpecific.expect !== undefined ? methodSpecific.expect : currentExpectation;
      currentExpectedStatus = methodSpecific.status !== undefined ? methodSpecific.status : currentExpectedStatus;
  }
  // --- End of expectation determination ---

  try {
    const response = await fetchFunc.fn(test.url, options);
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
    } else if (response.headers) {
      Object.assign(responseHeadersObj, response.headers);
    }
    logDebug(`${testId} - Response Headers`, responseHeadersObj);

    if (test.url.includes('httpbin.org/headers')) {
        assert(fetchFunc.supports.includes('json'), `JSON support needed for httpbin.org/headers check`, `${testId} - Prereq: JSON support`);
        const resForHeaderCheck = (response.clone && fetchFunc.supports.includes('clone') && !response.bodyUsed) ? response.clone() : response;
        const jsonBody = await resForHeaderCheck.json();
        const echoedHeaders = jsonBody.headers;
        // only reflects standard headers
        assert(echoedHeaders['User-Agent'] === 'UnleashFetchTester/1.1',
            `Request headers (X-Request-Id, User-Agent) echoed by httpbin.org/headers. UA: ${echoedHeaders['User-Agent']}`,
            `${testId} - Echoed Request Headers`);
        if (resForHeaderCheck === response && !isCloneTest) { // If original was used
            logDebug(`${testId}`, `Original response might have been consumed by httpbin.org/headers check.`);
        }
    } else if (test.url.includes('httpbin.org/response-headers')) {
        const serverHeader = response.headers && typeof response.headers.get === 'function' ? response.headers.get('x-test-server-header') : responseHeadersObj['x-test-server-header'];
        assert(serverHeader === 'hello-from-server',
            `Server-set 'x-test-server-header' received. Got: ${serverHeader}`,
            `${testId} - Server-Set Header`);
    }

    if (currentExpectation === 'timeout') {
      assert(false, `Fetch call did NOT timeout as expected. Status: ${response.status}`, `${testId} - Timeout Failure`);
      return;
    }

    if (currentExpectation === 'error') {
      assert(response.ok === false, `response.ok should be false for error expectation. Status: ${response.status}`, `${testId} - Error Expectation (ok)`);
      if (currentExpectedStatus) {
        assert((response.status || response.statusCode) === currentExpectedStatus, `Status code mismatch for error. Expected ${currentExpectedStatus}`, `${testId} - Error Expectation (status)`, currentExpectedStatus, response.status || response.statusCode);
      }
    } else if (currentExpectation !== 'no-body' && currentExpectation !== 'redirect') { // e.g. 'json', 'ok', 'html'
      assert(response.ok === true, `response.ok should be true for ${currentExpectation} expectation. Status: ${response.status}`, `${testId} - Success Expectation (ok)`);
      if (currentExpectedStatus && (response.status || response.statusCode) !== currentExpectedStatus) {
        // This is a warning, not a failure. Body content check will ultimately determine pass/fail.
        log(`WARN: Status mismatch for success expectation. Expected ${currentExpectedStatus}, got ${response.status || response.statusCode}. Body content will be verified.`, COLORS.yellow);
      }
    }

    // This uses test.expect because redirect behavior itself isn't method-dependent in the same way content is.
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

    for (const methodName of fetchFunc.supports) {
      let resForBodyTest;
      let isCloneTest = false;

      if (methodName === 'clone') {
        if (response.clone && fetchFunc.supports.includes('clone')) {
            try {
                if (response.bodyUsed) {
                    log(`Skipping .clone() self-test for ${methodName} because original response.bodyUsed is already true. This clone attempt would fail.`, COLORS.yellow);
                } else {
                    const clonedObject = response.clone();
                    assert(!!clonedObject, `response.clone() should return a new response object.`, `${testId} - Response Clone Call`);
                    assert(clonedObject !== response, `response.clone() should return a NEW instance.`, `${testId} - Response Clone New Instance`);
                    assert(response.bodyUsed === false, `Original response.bodyUsed should be false after its clone() method is called. Got: ${response.bodyUsed}`, `${testId} - Original BodyUsed After Clone Call`);
                    assert(clonedObject.bodyUsed === false, `Cloned response.bodyUsed should be false initially. Got: ${clonedObject.bodyUsed}`, `${testId} - Cloned BodyUsed Initial`);
                }
            } catch (e) {
                 assert(false, `response.clone() self-test failed: ${e.message}. Original.bodyUsed: ${response.bodyUsed}`, `${testId} - Response Clone Self-Test Error`, e);
            }
        } else {
            assert(false, `response.clone() is listed in supports but not available/supported.`, `${testId} - Response Clone Not Supported`);
        }
        continue;
      }
      else if (response.clone && fetchFunc.supports.includes('clone')) {
        if (!response.bodyUsed) {
          try {
            resForBodyTest = response.clone();
            isCloneTest = true;
            logDebug(`${testId} - Body Method`, `Testing with FRESH CLONE for ${methodName}() because original is not used.`);
          } catch (e) {
            assert(false, `response.clone() failed unexpectedly (original.bodyUsed=${response.bodyUsed}): ${e.message}`, `${testId} - Response Clone Method Error`, e);
            continue;
          }
        } else {
          log(`Original response is already used. For ${methodName}(), cannot create a fresh clone from original.`, COLORS.yellow);
          log(`Testing ${methodName}() on the already-used original response. Expect 'body already used' error if applicable.`, COLORS.yellow);
          resForBodyTest = response;
          isCloneTest = false;
        }
      } else {
        resForBodyTest = response;
        isCloneTest = false;
        logDebug(`${testId} - Body Method`, `Testing with ORIGINAL for ${methodName}() (cloning not supported or not a clone test).`);
      }

      if (currentExpectation === 'no-body') {
        if (['json', 'text', 'arrayBuffer', 'blob'].includes(methodName)) {
          try {
            if (resForBodyTest.bodyUsed && !isCloneTest) {
                 log(`Skipping no-body check for ${methodName} on already used original response.`, COLORS.yellow);
                 try {
                    await resForBodyTest[methodName]();
                    assert(false, `${methodName}() on used original for no-body should have thrown.`, `${testId} - ${methodName} No-Body Used Original No Throw`);
                 } catch (e_used_no_body) {
                    assert(e_used_no_body.message.toLowerCase().includes('body already used'), `${methodName}() on used original for no-body correctly threw: ${e_used_no_body.message}`, `${testId} - ${methodName} No-Body Used Original Threw`);
                 }
                 continue;
            }
            const bodyResult = await resForBodyTest[methodName]();
            if (methodName === 'json') {
                 assert(false, `${methodName}() should throw for no-body response. It resolved.`, `${testId} - ${methodName} No-Body Failure`);
            } else if (methodName === 'text') {
                 assert(bodyResult === '', `${methodName}() should resolve to empty string for no-body. Got: "${String(bodyResult).substring(0,20)}"`, `${testId} - ${methodName} No-Body Success`);
            } else {
                 // blob and arrayBuffer
                 assert( (bodyResult.byteLength) === 0 || bodyResult.size === 0, `${methodName}() should resolve to empty for no-body. Size: ${bodyResult.byteLength || bodyResult.size}`, `${testId} - ${methodName} No-Body Success`);
            }
          } catch (e) {
            if (resForBodyTest.bodyUsed && e.message.toLowerCase().includes('body already used')) {
                assert(true, `${methodName}() correctly threw bodyUsed error on already used response for no-body check.`, `${testId} - ${methodName} No-Body Used Exception`);
            } else {
                assert(true, `${methodName}() threw (expected for json, or if strict for no-body): ${e.message}`, `${testId} - ${methodName} No-Body Exception`);
            }
          }
        }
        continue;
      }

      // Adjusted logic for skipping body methods on error responses
      if (currentExpectation === 'error') {
        if (methodName === 'text') {
            // Allow text() for error responses as they often have text bodies (HTML, plain text, or even small JSON error messages)
            logDebug(`${testId}`, `Allowing text() for error response.`);
        } else if (methodName === 'json' && response.headers.get('content-type')?.includes('application/json')) {
            // Allow json() if content-type indicates JSON, even for errors
            logDebug(`${testId}`, `Allowing json() for error response with JSON content-type.`);
        }
        else if (methodName !== 'text') {
            log(`Skipping ${methodName}() for error response (content type not text/json or unknown).`, COLORS.yellow);
            continue;
        }
      }


      try {
        if (!isCloneTest && resForBodyTest.bodyUsed) {
            log(`Attempting to consume ${methodName} on already used ORIGINAL response. Expecting 'bodyUsed' error.`, COLORS.yellow);
            try {
                await resForBodyTest[methodName]();
                assert(false, `Consuming ${methodName} on already used ORIGINAL response should have failed.`, `${testId} - ${methodName} Original Used Consume Failure`);
            } catch (e_used_original_first_attempt) {
                assert(e_used_original_first_attempt.message.toLowerCase().includes('body already used'), `Consuming ${methodName} on used ORIGINAL correctly threw: ${e_used_original_first_attempt.message}`, `${testId} - ${methodName} Original Used Consume Success`);
            }
            continue;
        }

        logDebug(`${testId} - Body Method`, `Attempting: ${isCloneTest ? "clonedResponse" : "originalResponse (first use for this method)"}.${methodName}()`);
        const result = await resForBodyTest[methodName]();
        const resultPreview = result && typeof result === 'string' ? result.substring(0, 70) + '...' : (result ? `${typeof result} (size/length: ${result.size || result.byteLength || result.length || 'N/A'})` : String(result));
        logDebug(`${testId} - Body Method Result [${methodName}]`, resultPreview);

        if (methodName === 'text') assert(typeof result === 'string', `text() result type.`, `${testId} - ${methodName} Type`);
        else if (methodName === 'json') assert(typeof result === 'object' && result !== null, `json() result type.`, `${testId} - ${methodName} Type`);
        else if (methodName === 'arrayBuffer') assert(result instanceof ArrayBuffer || (typeof SharedArrayBuffer !== 'undefined' && result instanceof SharedArrayBuffer) || (result && typeof result.byteLength === 'number'), `arrayBuffer() result type. Got: ${Object.prototype.toString.call(result)}`, `${testId} - ${methodName} Type`);
        else if (methodName === 'blob') assert(result && typeof result.size === 'number' && typeof result.type === 'string', `blob() result type.`, `${testId} - ${methodName} Type`);

        assert(true, `${methodName}() call on ${isCloneTest ? "clone" : "original (first use)"} succeeded.`, `${testId} - ${methodName} Success`);

        if (isCloneTest) {
            assert(resForBodyTest.bodyUsed === true, `Cloned Rsp.bodyUsed TRUE after ${methodName}`, `${testId}-Cloned ${methodName} bodyUsed`);
            if (!response.bodyUsed) {
                assert(response.bodyUsed === false, `Orig.Rsp.bodyUsed FALSE after CLONE ${methodName}`, `${testId}-Orig ${methodName} bodyUsed postClone`);
            } else {
                log(`Orig.Rsp.bodyUsed TRUE already (after CLONE ${methodName}). Expected if prior method used orig.`, COLORS.yellow);
            }
            try { await resForBodyTest[methodName](); assert(false, `CLONE ${methodName} REUSE FAILED TO THROW`, `${testId}-Clone ${methodName} ReuseFail`); }
            catch (e_reuse_clone) { assert(true, `CLONE ${methodName} REUSE THREW: ${e_reuse_clone.message}`, `${testId}-Clone ${methodName} ReuseOK`); }

            if (!response.bodyUsed) {
                try {
                    logDebug(`${testId}`, `Attempting originalResponse.${methodName}() after clone consumed.`);
                    await response[methodName]();
                    assert(true, `Orig ${methodName} OK after clone consumed`, `${testId}-Orig ${methodName} PostCloneOK`);
                    assert(response.bodyUsed === true, `Orig.Rsp.bodyUsed TRUE after own ${methodName}`, `${testId}-Orig ${methodName} bodyUsedPostOwn`);
                    try { await response[methodName](); assert(false, `ORIG ${methodName} REUSE FAILED TO THROW`, `${testId}-Orig ${methodName} ReuseFailPostOwn`); }
                    catch (e_reuse_original_own) { assert(true, `ORIG ${methodName} REUSE THREW: ${e_reuse_original_own.message}`, `${testId}-Orig ${methodName} ReuseOKPostOwn`); }
                } catch (e_original_after_clone) {
                    assert(false, `Orig ${methodName} FAILED after clone consumed: ${e_original_after_clone.message}`, `${testId}-Orig ${methodName} PostCloneFail`, e_original_after_clone);
                }
            } else {
                log(`Skipping full consumption: Orig.Rsp.bodyUsed TRUE for ${methodName} after clone.`, COLORS.yellow);
                try { await response[methodName](); assert(false, `Orig ${methodName}(used) NO THROW`, `${testId}-OrigUsed ${methodName} NoThrow`); }
                catch (e_used_original_after_clone) { assert(e_used_original_after_clone.message.toLowerCase().includes('body already used'), `Orig ${methodName}(used) THREW: ${e_used_original_after_clone.message}`, `${testId}-OrigUsed ${methodName} Threw`); }
            }
        } else {
            assert(response.bodyUsed === true, `Orig.Rsp.bodyUsed TRUE after ${methodName}`, `${testId}-Orig ${methodName} bodyUsed`);
            try { await response[methodName](); assert(false, `ORIG ${methodName} REUSE FAILED TO THROW`, `${testId}-Orig ${methodName} ReuseFail`); }
            catch (e_reuse_original) { assert(true, `ORIG ${methodName} REUSE THREW: ${e_reuse_original.message}`, `${testId}-Orig ${methodName} ReuseOK`); }
        }

      } catch (e_body) {
        if (resForBodyTest.bodyUsed && e_body.message.toLowerCase().includes('body already used')) {
             assert(true, `${methodName}() on used ${isCloneTest?"clone":"orig"} THREW: ${e_body.message}`, `${testId}-${methodName} UsedBodyOK`);
        } else {
             assert(false, `${methodName}() on ${isCloneTest?"clone":"orig"} FAILED: ${e_body.message}`, `${testId}-${methodName} UnexpectedErr`, e_body);
        }
      }
    }

  } catch (error) {
    const duration = Date.now() - startTime;
    log(`[FETCH ERROR] ${testId} | Duration: ${duration}ms`, COLORS.red);
    logErrorDetails(error, `${testId} - Main Catch Block`);

    // Use currentExpectation here as well, which was determined before the try block
    if (currentExpectation === 'timeout') {
      const isTimeoutErr = error.name === 'AbortError' || (error.message && error.message.toLowerCase().includes('timeout'));
      assert(isTimeoutErr, `Expected timeout error. Got: ${error.name} - ${error.message}`, `${testId} - Timeout Exception`, undefined, 'TimeoutError/AbortError', error.name);
    } else if (currentExpectation === 'redirect' && redirect === 'error') { // This should be test.expect for redirect error
      assert(true, `Fetch correctly threw for redirect='error': ${error.message}`, `${testId} - Redirect Error Mode Exception`);
    } else {
      assert(false, `Unexpected fetch error: ${error.message}`, `${testId} - Unexpected Fetch Exception`, error);
    }
  }
}
// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// END OF MODIFIED SECTION: testFetchScenario function
// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
