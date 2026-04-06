#!/usr/bin/env node

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Resolver, lookup } from 'node:dns/promises';
import { execFile as execFileCallback, spawn } from 'node:child_process';
import { promisify } from 'node:util';

const execFile = promisify(execFileCallback);

const READY_TIMEOUT_MS = 45_000;
const READY_INTERVAL_MS = 2_000;
const READY_FETCH_TIMEOUT_SECONDS = 5;
const SCREENCAST_TIMEOUT_MS = 60_000;
const SCREENCAST_ATTEMPT_TIMEOUT_MS = 20_000;
const SCREENCAST_POLL_MS = 500;
const SCREENCAST_TARGET_URL = process.env.BBX_CI_PROBE_TARGET_URL || 'https://www.wikipedia.org/';
const SCREENCAST_MIN_DATA_URL_LENGTH = 1_000;
const SCREENCAST_MIN_UNIQUE_SAMPLES = 2;
const SCREENCAST_MOUSE_MOVE_STEPS = Math.max(4, Number(process.env.BBX_CI_MOUSE_MOVE_STEPS || 6));
const SCREENCAST_MIN_FRAME_ADVANCE = Math.max(2, Number(process.env.BBX_CI_MIN_FRAME_ADVANCE || 3));

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.mode === 'ready') {
    const result = await waitForBrowserBoxReady(options.loginLink, options);
    console.log(JSON.stringify({ mode: 'ready', ok: true, ...result }, null, 2));
    return;
  }
  if (options.mode === 'screencast') {
    const result = await verifyScreencast(options.loginLink, options);
    console.log(JSON.stringify({ mode: 'screencast', ok: true, ...result }, null, 2));
    return;
  }
  throw new Error(`Unknown mode '${options.mode}'. Expected 'ready' or 'screencast'.`);
}

function parseArgs(argv) {
  const [mode = '', maybeLoginLink = ''] = argv;
  const options = {
    mode: String(mode || '').trim(),
    loginLink: String(maybeLoginLink || process.env.BROWSERBOX_URL || '').trim(),
    timeoutMs: 0,
    intervalMs: 0,
    useTor: false,
    targetUrl: SCREENCAST_TARGET_URL,
  };

  for (const rawArg of argv.slice(2)) {
    const arg = String(rawArg || '').trim();
    if (!arg) continue;
    if (arg === '--tor') {
      options.useTor = true;
      continue;
    }
    if (arg.startsWith('--timeout-ms=')) {
      options.timeoutMs = Number.parseInt(arg.slice('--timeout-ms='.length), 10) || 0;
      continue;
    }
    if (arg.startsWith('--interval-ms=')) {
      options.intervalMs = Number.parseInt(arg.slice('--interval-ms='.length), 10) || 0;
      continue;
    }
    if (arg.startsWith('--target-url=')) {
      options.targetUrl = arg.slice('--target-url='.length).trim() || SCREENCAST_TARGET_URL;
      continue;
    }
  }

  if (!options.loginLink) {
    throw new Error('A BrowserBox login link is required.');
  }
  return options;
}

async function waitForBrowserBoxReady(loginLink, {
  timeoutMs = READY_TIMEOUT_MS,
  intervalMs = READY_INTERVAL_MS,
  useTor = false,
} = {}) {
  const deadline = Date.now() + Math.max(1_000, timeoutMs || READY_TIMEOUT_MS);
  let lastResult = null;
  let lastError = null;

  while (Date.now() <= deadline) {
    try {
      const result = await curlHtml(loginLink, {
        useTor,
        timeoutSeconds: useTor ? 25 : READY_FETCH_TIMEOUT_SECONDS,
      });
      lastResult = result;
      if (result.statusCode >= 200 && result.statusCode < 300 && result.html.includes('<bb-view')) {
        return {
          status: result.statusCode,
          url: result.effectiveUrl,
        };
      }
      lastError = null;
    } catch (error) {
      lastError = error;
    }
    await sleep(Math.max(100, intervalMs || READY_INTERVAL_MS));
  }

  const reason = lastError
    ? formatError(lastError)
    : `status=${lastResult?.statusCode ?? 'unknown'} url=${lastResult?.effectiveUrl || loginLink} preview=${JSON.stringify((lastResult?.html || '').slice(0, 240))}`;
  throw new Error(`Timed out waiting for BrowserBox app readiness at ${loginLink}. ${reason}`);
}

async function curlHtml(url, {
  useTor = false,
  timeoutSeconds = READY_FETCH_TIMEOUT_SECONDS,
} = {}) {
  const curlArgs = [
    '-s',
    '-k',
    '-L',
    '--fail',
    '--max-time',
    String(timeoutSeconds),
  ];
  if (useTor) {
    curlArgs.push('--proxy', 'socks5h://127.0.0.1:9050');
  }
  if (!useTor) {
    curlArgs.push(...await buildCurlResolveArgs(url));
  }
  curlArgs.push(
    '--write-out',
    '\n__BBX_STATUS__:%{http_code}\n__BBX_URL__:%{url_effective}\n',
    url,
  );

  const { stdout } = await execFile(resolveCurlBinary(), curlArgs, {
    maxBuffer: 4 * 1024 * 1024,
  });
  const statusMatch = stdout.match(/\n__BBX_STATUS__:(\d+)/);
  const urlMatch = stdout.match(/\n__BBX_URL__:(.+)\n?$/);
  const html = stdout
    .replace(/\n__BBX_STATUS__:\d+[\s\S]*$/, '')
    .trim();

  return {
    html,
    statusCode: Number.parseInt(statusMatch?.[1] || '0', 10) || 0,
    effectiveUrl: (urlMatch?.[1] || url).trim(),
  };
}

async function buildCurlResolveArgs(url) {
  const parsed = new URL(url);
  const host = String(parsed.hostname || '').trim();
  if (!host.endsWith('.trycloudflare.com')) {
    return [];
  }
  if (await systemDnsResolves(host)) {
    return [];
  }

  const fallbackIp = await resolveTunnelHost(host);
  if (!fallbackIp) {
    return [];
  }

  const port = parsed.port || (parsed.protocol === 'http:' ? '80' : '443');
  return ['--resolve', `${host}:${port}:${fallbackIp}`];
}

async function systemDnsResolves(host) {
  try {
    const result = await lookup(host, { family: 4 });
    return Boolean(result?.address);
  } catch {
    return false;
  }
}

async function resolveTunnelHost(host) {
  const exactIp = await resolveHostViaCloudflareDns(host);
  if (exactIp) {
    return exactIp;
  }

  const parent = host.split('.').slice(1).join('.');
  if (parent === 'trycloudflare.com') {
    return resolveHostViaCloudflareDns(parent);
  }
  return '';
}

async function resolveHostViaCloudflareDns(host) {
  const resolver = new Resolver();
  resolver.setServers(['1.1.1.1']);
  try {
    const answers = await resolver.resolve4(host);
    return Array.isArray(answers) && answers.length > 0 ? answers[0] : '';
  } catch {
    return '';
  }
}

function resolveCurlBinary() {
  return process.platform === 'win32' ? 'curl.exe' : 'curl';
}

async function verifyScreencast(loginLink, {
  timeoutMs = SCREENCAST_TIMEOUT_MS,
  targetUrl = SCREENCAST_TARGET_URL,
} = {}) {
  const effectiveTimeoutMs = Math.max(10_000, timeoutMs || SCREENCAST_TIMEOUT_MS);
  const launcher = await launchBrowser();
  const connection = await CDPConnection.connect(launcher.wsUrl);

  try {
    const { targetId } = await connection.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await connection.send('Target.attachToTarget', {
      targetId,
      flatten: true,
    });

    await connection.send('Page.enable', {}, sessionId);
    await connection.send('Runtime.enable', {}, sessionId);
    let attempts = 0;
    let lastError = null;
    const deadline = Date.now() + effectiveTimeoutMs;

    while (Date.now() <= deadline) {
      attempts += 1;
      const remainingMs = Math.max(1_000, deadline - Date.now());
      const attemptTimeoutMs = Math.max(5_000, Math.min(SCREENCAST_ATTEMPT_TIMEOUT_MS, remainingMs));

      try {
        const appState = await navigateToBrowserBoxApp(connection, sessionId, loginLink, attemptTimeoutMs);
        const { interaction, screencast } = await runScreencastAttempt(connection, sessionId, targetUrl, attemptTimeoutMs);
        return {
          targetUrl,
          browserExecutable: launcher.executablePath,
          attempts,
          appState,
          interaction,
          screencast,
        };
      } catch (error) {
        lastError = error;
        if (!isRecoverableScreencastError(error) || remainingMs <= SCREENCAST_POLL_MS) {
          throw error;
        }
        await sleep(SCREENCAST_POLL_MS);
      }
    }

    throw new Error(`Screencast probe failed after ${attempts} attempt(s). ${formatError(lastError)}`);
  } finally {
    await connection.close().catch(() => {});
    await launcher.close().catch(() => {});
  }
}

async function navigateToBrowserBoxApp(connection, sessionId, loginLink, timeoutMs) {
  const readinessTimeoutMs = Math.max(5_000, Math.min(timeoutMs, READY_TIMEOUT_MS));
  await waitForBrowserBoxReady(loginLink, {
    timeoutMs: readinessTimeoutMs,
    intervalMs: Math.min(1_000, READY_INTERVAL_MS),
  });
  await connection.send('Page.navigate', { url: loginLink }, sessionId);
  return waitForBrowserBoxAppState(connection, sessionId, timeoutMs);
}

async function waitForBrowserBoxAppState(connection, sessionId, timeoutMs) {
  return waitForRuntimeCondition(connection, sessionId, 'bb-view app readiness', `
    (() => {
      const bbView = document.querySelector('bb-view');
      const canvas = bbView?.shadowRoot?.querySelector('canvas');
      const api = globalThis._bbx || globalThis.browserbox?.api;
      if (!bbView || !canvas || !api) {
        return null;
      }
      if (typeof api.cleanSlate !== 'function' || typeof api.captureFrame !== 'function') {
        return null;
      }
      return {
        frameId: Number(api._state?.latestFrameReceived || 0),
        castSessionId: Number(api._state?.latestCastSession || 0),
        canvasWidth: Number(canvas.width || 0),
        canvasHeight: Number(canvas.height || 0),
      };
    })()
  `, timeoutMs);
}

async function runScreencastAttempt(connection, sessionId, targetUrl, timeoutMs) {
  const targetHost = new URL(targetUrl).hostname.replace(/^www\./, '');
  const stepTimeoutMs = Math.max(5_000, Math.min(timeoutMs, 15_000));

  await evaluate(connection, sessionId, `
    (async () => {
      const deadline = Date.now() + ${stepTimeoutMs};
      let api;
      while (Date.now() < deadline) {
        api = globalThis._bbx || globalThis.browserbox?.api;
        if (api?.cleanSlate) break;
        await new Promise(r => setTimeout(r, 250));
      }
      if (!api?.cleanSlate) throw new Error('BrowserBox API not ready after ' + ${stepTimeoutMs} + 'ms');
      await api.cleanSlate(${JSON.stringify(targetUrl)});
      return true;
    })()
  `);

  await waitForRuntimeCondition(connection, sessionId, `remote target ${targetHost}`, `
    (() => {
      const api = globalThis._bbx || globalThis.browserbox?.api;
      const tabs = Array.isArray(api?._state?.tabs) ? api._state.tabs : [];
      const match = tabs.find((tab) => typeof tab?.url === 'string' && tab.url.includes(${JSON.stringify(targetHost)}));
      if (!match) {
        return null;
      }
      return {
        targetId: match.targetId || '',
        url: match.url || '',
      };
    })()
  `, stepTimeoutMs);

  const interaction = await driveCanvasMouseSweep(connection, sessionId, stepTimeoutMs);
  const screencast = await waitForRuntimeCondition(connection, sessionId, 'screencast frame draw', `
    (async () => {
      const bbView = document.querySelector('bb-view');
      const canvas = bbView?.shadowRoot?.querySelector('canvas');
      const api = globalThis._bbx || globalThis.browserbox?.api;
      if (!canvas || !api || typeof api.captureFrame !== 'function') {
        return null;
      }
      const frameId = Number(api._state?.latestFrameReceived || 0);
      if (!(frameId >= ${Number(interaction.beforeFrameId || 0)} + ${SCREENCAST_MIN_FRAME_ADVANCE})) {
        return null;
      }
      const dataUrl = await api.captureFrame({ format: 'png' });
      if (typeof dataUrl !== 'string' || dataUrl.length < ${SCREENCAST_MIN_DATA_URL_LENGTH}) {
        return null;
      }
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const colors = new Set();
      if (ctx && canvas.width > 0 && canvas.height > 0) {
        const cols = 10;
        const rows = 6;
        for (let yi = 0; yi < rows; yi += 1) {
          for (let xi = 0; xi < cols; xi += 1) {
            const px = Math.min(canvas.width - 1, Math.max(0, Math.floor((canvas.width - 1) * (xi / Math.max(1, cols - 1)))));
            const py = Math.min(canvas.height - 1, Math.max(0, Math.floor((canvas.height - 1) * (yi / Math.max(1, rows - 1)))));
            const sample = ctx.getImageData(px, py, 1, 1).data;
            colors.add(sample[0] + ',' + sample[1] + ',' + sample[2] + ',' + sample[3]);
          }
        }
      }
      if (colors.size < ${SCREENCAST_MIN_UNIQUE_SAMPLES}) {
        return null;
      }
      return {
        beforeFrameId: ${Number(interaction.beforeFrameId || 0)},
        frameId,
        frameAdvance: frameId - ${Number(interaction.beforeFrameId || 0)},
        castSessionId: Number(api._state?.latestCastSession || 0),
        dataUrlLength: dataUrl.length,
        uniqueSamples: colors.size,
        canvasWidth: Number(canvas.width || 0),
        canvasHeight: Number(canvas.height || 0),
      };
    })()
  `, stepTimeoutMs);

  return {
    interaction,
    screencast,
  };
}

async function driveCanvasMouseSweep(connection, sessionId, timeoutMs) {
  const bounds = await waitForRuntimeCondition(connection, sessionId, 'canvas bounds for screencast interaction', `
    (() => {
      const bbView = document.querySelector('bb-view');
      const canvas = bbView?.shadowRoot?.querySelector('canvas');
      const api = globalThis._bbx || globalThis.browserbox?.api;
      if (!canvas || !api) {
        return null;
      }
      const rect = canvas.getBoundingClientRect();
      if (!(rect.width > 20) || !(rect.height > 20)) {
        return null;
      }
      return {
        x: Number(rect.left || 0),
        y: Number(rect.top || 0),
        width: Number(rect.width || 0),
        height: Number(rect.height || 0),
        beforeFrameId: Number(api._state?.latestFrameReceived || 0),
      };
    })()
  `, Math.max(5_000, timeoutMs));

  const startX = Math.round(bounds.x + Math.max(10, Math.min(30, bounds.width * 0.1)));
  const startY = Math.round(bounds.y + Math.max(10, Math.min(30, bounds.height * 0.2)));
  const travelX = Math.max(20, Math.floor(bounds.width - 40));
  const stepX = Math.max(2, Math.floor(travelX / Math.max(1, SCREENCAST_MOUSE_MOVE_STEPS - 1)));

  for (let index = 0; index < SCREENCAST_MOUSE_MOVE_STEPS; index += 1) {
    const x = startX + (index * stepX);
    const y = startY + ((index % 2) * 8);
    await connection.send('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x,
      y,
      button: 'none',
      buttons: 0,
      pointerType: 'mouse',
    }, sessionId);
    await sleep(120);
  }

  return {
    ...bounds,
    steps: SCREENCAST_MOUSE_MOVE_STEPS,
  };
}

async function waitForRuntimeCondition(connection, sessionId, description, expression, timeoutMs) {
  const deadline = Date.now() + Math.max(1_000, timeoutMs);
  let lastValue = null;
  let lastError = null;

  while (Date.now() <= deadline) {
    try {
      const value = await evaluate(connection, sessionId, expression);
      if (value) {
        return value;
      }
      lastValue = value;
      lastError = null;
    } catch (error) {
      lastError = error;
    }
    await sleep(SCREENCAST_POLL_MS);
  }

  const reason = lastError ? formatError(lastError) : `lastValue=${JSON.stringify(lastValue)}`;
  throw new Error(`Timed out waiting for ${description}. ${reason}`);
}

async function evaluate(connection, sessionId, expression) {
  const response = await connection.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  }, sessionId);

  if (response?.exceptionDetails) {
    const description = response.result?.description
      || response.exceptionDetails?.text
      || 'Runtime.evaluate failed';
    throw new Error(description);
  }
  return response?.result?.value;
}

async function launchBrowser() {
  const executablePath = await findBrowserExecutable();
  const userDataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bbx-saga-browser-'));
  const args = [
    '--headless=new',
    '--remote-debugging-port=0',
    '--no-first-run',
    '--no-default-browser-check',
    '--ignore-certificate-errors',
    '--allow-insecure-localhost',
    '--disable-features=DialMediaRouteProvider',
    `--user-data-dir=${userDataDir}`,
    'about:blank',
  ];

  if (process.platform === 'linux') {
    args.push('--disable-dev-shm-usage', '--no-sandbox');
  }

  const child = spawn(executablePath, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let resolved = false;
  let bufferedLogs = '';
  let wsUrl = '';

  const wsUrlPromise = new Promise((resolve, reject) => {
    const onData = (chunk) => {
      const text = String(chunk || '');
      bufferedLogs += text;
      const match = bufferedLogs.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (!match) return;
      wsUrl = match[1];
      resolved = true;
      cleanup();
      resolve(wsUrl);
    };
    const onExit = (code, signal) => {
      if (resolved) return;
      cleanup();
      reject(new Error(`Browser exited before exposing DevTools. code=${code} signal=${signal} logs=${JSON.stringify(bufferedLogs.slice(-500))}`));
    };
    const onError = (error) => {
      if (resolved) return;
      cleanup();
      reject(error);
    };
    const timer = setTimeout(() => {
      if (resolved) return;
      cleanup();
      reject(new Error(`Timed out waiting for DevTools websocket. logs=${JSON.stringify(bufferedLogs.slice(-500))}`));
    }, 20_000);

    const cleanup = () => {
      clearTimeout(timer);
      child.stdout.off('data', onData);
      child.stderr.off('data', onData);
      child.off('exit', onExit);
      child.off('error', onError);
    };

    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    child.once('exit', onExit);
    child.once('error', onError);
  });

  await wsUrlPromise;

  return {
    executablePath,
    wsUrl,
    async close() {
      if (!child.killed) {
        child.kill('SIGTERM');
      }
      await sleep(500);
      if (child.exitCode == null) {
        child.kill('SIGKILL');
      }
      await fs.rm(userDataDir, { recursive: true, force: true }).catch(() => {});
    },
  };
}

async function findBrowserExecutable() {
  const envCandidates = [
    process.env.BBX_CI_BROWSER_PATH,
    process.env.CHROME_PATH,
    process.env.PUPPETEER_EXECUTABLE_PATH,
  ].filter(Boolean);

  for (const candidate of envCandidates) {
    if (await isExecutable(candidate)) {
      return candidate;
    }
  }

  const candidates = process.platform === 'win32'
    ? await windowsBrowserCandidates()
    : process.platform === 'darwin'
      ? await macBrowserCandidates()
      : await linuxBrowserCandidates();

  for (const candidate of candidates) {
    if (await isExecutable(candidate)) {
      return candidate;
    }
  }

  throw new Error('Could not find a Chromium-based browser executable for the saga screencast probe.');
}

async function windowsBrowserCandidates() {
  const result = [];
  const roots = [
    process.env['PROGRAMFILES'],
    process.env['PROGRAMFILES(X86)'],
    process.env.LOCALAPPDATA,
  ].filter(Boolean);

  for (const root of roots) {
    result.push(path.join(root, 'Google', 'Chrome', 'Application', 'chrome.exe'));
    result.push(path.join(root, 'Microsoft', 'Edge', 'Application', 'msedge.exe'));
    result.push(path.join(root, 'Chromium', 'Application', 'chrome.exe'));
  }

  result.push(...await resolveCommandPaths('where.exe', ['chrome.exe', 'msedge.exe', 'chromium.exe']));
  return unique(result);
}

async function macBrowserCandidates() {
  return unique([
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    ...(await resolveCommandPaths('which', ['google-chrome', 'chromium', 'microsoft-edge'])),
  ]);
}

async function linuxBrowserCandidates() {
  return unique([
    ...(await resolveCommandPaths('which', [
      'google-chrome-stable',
      'google-chrome',
      'chromium-browser',
      'chromium',
      'microsoft-edge',
    ])),
  ]);
}

async function resolveCommandPaths(resolver, commands) {
  const resolved = [];
  for (const command of commands) {
    try {
      const { stdout } = await execFile(resolver, [command], {
        maxBuffer: 1024 * 1024,
      });
      for (const line of String(stdout || '').split(/\r?\n/)) {
        const value = line.trim();
        if (value) {
          resolved.push(value);
        }
      }
    } catch {
      continue;
    }
  }
  return resolved;
}

async function isExecutable(candidate) {
  if (!candidate) return false;
  try {
    await fs.access(candidate);
    return true;
  } catch {
    return false;
  }
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function formatError(error) {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function isRecoverableScreencastError(error) {
  const message = formatError(error);
  return [
    'Execution context was destroyed',
    'Cannot find context with specified id',
    'Inspected target navigated or closed',
    'Timed out waiting for BrowserBox app readiness',
    'Timed out waiting for bb-view app readiness',
    'Timed out waiting for remote target',
    'Timed out waiting for canvas bounds for screencast interaction',
    'Timed out waiting for screencast frame draw',
  ].some((needle) => message.includes(needle));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class CDPConnection {
  static async connect(url) {
    const socket = new WebSocket(url);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Timed out connecting to ${url}`)), 10_000);
      socket.addEventListener('open', () => {
        clearTimeout(timer);
        resolve();
      }, { once: true });
      socket.addEventListener('error', (event) => {
        clearTimeout(timer);
        reject(event.error || new Error(`Failed to connect to ${url}`));
      }, { once: true });
    });
    return new CDPConnection(socket);
  }

  constructor(socket) {
    this.socket = socket;
    this.nextId = 0;
    this.pending = new Map();
    this.socket.addEventListener('message', (event) => {
      this.#handleMessage(event.data);
    });
    this.socket.addEventListener('close', () => {
      this.#rejectAll(new Error('CDP websocket closed.'));
    }, { once: true });
    this.socket.addEventListener('error', (event) => {
      this.#rejectAll(event.error || new Error('CDP websocket error.'));
    }, { once: true });
  }

  send(method, params = {}, sessionId = '') {
    const id = ++this.nextId;
    const payload = { id, method, params };
    if (sessionId) {
      payload.sessionId = sessionId;
    }
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject, method });
      this.socket.send(JSON.stringify(payload));
    });
  }

  async close() {
    if (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING) {
      this.socket.close();
    }
  }

  #handleMessage(rawData) {
    const message = JSON.parse(String(rawData || '{}'));
    if (!message.id) {
      return;
    }
    const pending = this.pending.get(message.id);
    if (!pending) {
      return;
    }
    this.pending.delete(message.id);
    if (message.error) {
      pending.reject(new Error(`${pending.method} failed: ${message.error.message || JSON.stringify(message.error)}`));
      return;
    }
    pending.resolve(message.result || {});
  }

  #rejectAll(error) {
    for (const pending of this.pending.values()) {
      pending.reject(error);
    }
    this.pending.clear();
  }
}

main().catch((error) => {
  console.error(formatError(error));
  process.exitCode = 1;
});
