// Imports, constants, then state
import './unleash-fetch.js';

// Define fetchWithTimeout
async function fetchWithTimeout(resource, options = {}) {
  const { timeout = 12000 } = options; // default 12 seconds
  options.timeout = undefined;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const response = await fetch(resource, {
    ...options,
    signal: controller.signal,
  });
  clearTimeout(id);
  return response;
}

// Define fetchWithTimeoutAndRetry
async function fetchWithTimeoutAndRetry(resource, options = {}) {
  try {
    return await fetchWithTimeout(resource, options);
  } catch (e) {
    console.warn(`First fetch failed`, resource, e);
    console.info(`Will retry 1 time for`, resource);
    await new Promise((resolve) => setTimeout(resolve, 2417));
    return fetchWithTimeout(resource, options);
  }
}

// Define fetchWithTor (simplified, no real Tor proxy)
async function fetchWithTor(url, options = {}) {
  let agent;
  if (options.customProxy) {
    agent = options.customProxy;
    delete options.customProxy;
  }
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? require('https') : require('http');
    const requestOptions = {
      agent,
      method: options.method || 'GET',
      headers: options.headers || {},
    };
    const request = protocol.request(url, requestOptions, (res) => {
      const chunks = [];
      res.on('data', (chunk) => {
        chunks.push(chunk);
      });
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          headers: res.headers,
          text: () => Promise.resolve(buffer.toString()),
          arrayBuffer: () => Promise.resolve(buffer),
          contentType: res.headers['content-type'],
        });
      });
    });
    request.on('error', (error) => {
      reject(error);
    });
    request.end();
  });
}

const FETCH_FUNCTIONS = [
  { name: 'fetch', fn: globalThis.fetch, supports: ['text', 'json', 'arrayBuffer', 'blob', 'clone'] },
  { name: 'fetchWithTimeout', fn: fetchWithTimeout, supports: ['text', 'json', 'arrayBuffer', 'blob', 'clone'] },
  { name: 'fetchWithTimeoutAndRetry', fn: fetchWithTimeoutAndRetry, supports: ['text', 'json', 'arrayBuffer', 'blob', 'clone'] },
  { name: 'fetchWithTor', fn: fetchWithTor, supports: ['text', 'arrayBuffer'] },
];

const TEST_URLS = [
  { url: 'https://jsonplaceholder.typicode.com/posts/1', expect: 'json', desc: 'JSON API' },
  { url: 'https://api.github.com', expect: 'json', desc: 'GitHub API' },
  { url: 'https://httpbin.org/status/204', expect: 'no-body', desc: 'No Content' },
  { url: 'https://httpbin.org/status/404', expect: 'error', desc: 'Not Found' },
  { url: 'https://httpbin.org/redirect-to?url=https://example.com', expect: 'redirect', desc: 'Redirect' },
  { url: 'http://localhost:6000/json/version', expect: 'json', desc: 'Localhost Port 6000' },
  { url: 'https://duckduckgogg42xjoc72x3sjasowoarfbgcmvfimaftt6twagswzczad.onion/', expect: 'html', desc: 'Tor Onion (DuckDuckGo)', torOnly: true },
];

const METHODS = ['GET', 'POST'];
const REDIRECT_MODES = ['follow', 'error', 'manual'];
const TIMEOUT_TEST = { url: 'https://httpbin.org/delay/15', timeout: 1000, expect: 'timeout', desc: 'Timeout' };
const LOCALHOST_HAMMER_COUNT = 5; // Hammer localhost:6000 5 times
const DEFAULT_TIMEOUT = 12000;

// Logic
runTests();

// Functions, then helper functions
async function runTests() {
  // Test static methods (only for custom fetch)
  console.log('\n=== Testing Static Methods (Custom Fetch) ===');
  await testStaticMethods();

  // Test fetch scenarios
  console.log('\n=== Testing Fetch Scenarios ===');
  for (const fetchFunc of FETCH_FUNCTIONS) {
    console.log(`\nTesting Fetch Function: ${fetchFunc.name}`);
    for (const test of TEST_URLS) {
      if (test.torOnly && fetchFunc.name !== 'fetchWithTor') {
        continue; // Skip Tor tests for non-Tor fetch functions
      }
      for (const method of METHODS) {
        for (const redirect of REDIRECT_MODES) {
          await testFetchScenario(fetchFunc, test, method, redirect);
        }
      }
    }

    // Test timeout
    console.log(`\nTesting Timeout (${fetchFunc.name})`);
    await testFetchScenario(fetchFunc, TIMEOUT_TEST, 'GET', 'follow');

    // Hammer localhost:6000
    if (fetchFunc.name !== 'fetchWithTor') { // Tor doesn’t support localhost
      console.log(`\nHammering Localhost:6000 (${fetchFunc.name})`);
      for (let i = 1; i <= LOCALHOST_HAMMER_COUNT; i++) {
        console.log(`Hammer Attempt ${i}/${LOCALHOST_HAMMER_COUNT}`);
        await testFetchScenario(
          fetchFunc,
          TEST_URLS.find((t) => t.url.includes('localhost:6000')),
          'GET',
          'follow'
        );
      }
    }
  }
}

async function testStaticMethods() {
  // Test Response.error()
  console.log('\nTesting Response.error()');
  const errorResponse = globalThis.Response.error();
  console.log(`Status: ${errorResponse.status} ${errorResponse.statusText}`);
  console.log(`Type: ${errorResponse.type}`);
  console.log(`BodyUsed: ${errorResponse.bodyUsed}`);
  console.log(`URL: ${errorResponse.url}`);
  console.log(`Protocol: ${errorResponse.protocol}`);
  console.log(`Pass: ${errorResponse.status === 0 && errorResponse.type === 'error' && !errorResponse.bodyUsed}`);

  // Test Response.redirect()
  console.log('\nTesting Response.redirect()');
  const redirectResponse = globalThis.Response.redirect('https://example.com', 302);
  console.log(`Status: ${redirectResponse.status} ${redirectResponse.statusText}`);
  console.log(`Location: ${redirectResponse.headers.get('Location')}`);
  console.log(`Type: ${redirectResponse.type}`);
  console.log(`URL: ${redirectResponse.url}`);
  console.log(`Protocol: ${redirectResponse.protocol}`);
  console.log(
    `Pass: ${
      redirectResponse.status === 302 &&
      redirectResponse.headers.get('Location') === 'https://example.com' &&
      redirectResponse.type === 'default'
    }`
  );
}

async function testFetchScenario(fetchFunc, test, method, redirect) {
  console.log(`\nTesting: ${test.desc} (${test.url})`);
  console.log(`Fetch: ${fetchFunc.name}, Method: ${method}, Redirect: ${redirect}`);
  const startTime = Date.now();
  try {
    const options = {
      method,
      redirect,
      headers: { 'X-Test-Header': 'test' },
      body: method === 'POST' ? JSON.stringify({ test: 'data' }) : undefined,
      timeout: test.timeout || DEFAULT_TIMEOUT,
      customProxy: test.torOnly ? {} : undefined, // Placeholder for Tor proxy
    };
    const response = await fetchFunc.fn(test.url, options);
    const duration = Date.now() - startTime;
    console.log(`Status: ${response.status || response.statusCode || 'N/A'} ${response.statusText || ''}`);
    console.log(`Protocol: ${response.protocol || 'http/1.1'}`);
    console.log(`Duration: ${duration}ms`);
    console.log(`Redirected: ${response.redirected || false}`);

    // Test response methods
    for (const methodName of fetchFunc.supports) {
      if (test.expect === 'no-body' && methodName === 'json') {
        try {
          await response.clone()[methodName]();
          console.log(`Fail: ${methodName} should throw for no-body response`);
        } catch (e) {
          console.log(`Pass: ${methodName} threw expected error: ${e.message}`);
        }
      } else if (test.expect === 'error' && methodName !== 'text') {
        console.log(`Skip: ${methodName} for error response (only testing text)`);
      } else if (test.expect === 'redirect' && redirect === 'manual') {
        console.log(`Location: ${response.headers.get('location') || response.headers['location']}`);
      } else if (test.expect === 'timeout') {
        console.log(`Fail: ${methodName} should have timed out`);
      } else {
        const clone = fetchFunc.supports.includes('clone') ? response.clone() : response;
        try {
          const result = await (methodName === 'clone' ? clone : response[methodName]());
          if (methodName === 'blob') {
            console.log(`Blob size: ${result.size}, type: ${result.type}`);
          } else if (methodName === 'arrayBuffer') {
            console.log(`ArrayBuffer length: ${result.byteLength}`);
          } else if (methodName === 'text') {
            console.log(`Text: ${result.slice(0, 100)}...`);
          } else if (methodName === 'json') {
            console.log(`JSON: ${JSON.stringify(result, null, 2).slice(0, 200)}...`);
          }
          console.log(`Pass: ${methodName} succeeded`);

          // Test body reuse
          try {
            await response[methodName]();
            console.log(`Fail: ${methodName} should throw on body reuse`);
          } catch (e) {
            console.log(`Pass: ${methodName} threw expected reuse error: ${e.message}`);
          }

          // Test clone (if supported)
          if (fetchFunc.supports.includes('clone') && methodName !== 'clone') {
            const cloneResult = await clone[methodName]();
            console.log(`Pass: Cloned ${methodName} succeeded`);
          }
        } catch (e) {
          console.log(`Fail: ${methodName} threw unexpected error: ${e.message}`);
        }
      }
    }
  } catch (error) {
    if (test.expect === 'timeout') {
      console.log(`Pass: Expected timeout error: ${error.message}`);
    } else {
      console.error(`Error: ${error.message}`);
    }
  }
}

