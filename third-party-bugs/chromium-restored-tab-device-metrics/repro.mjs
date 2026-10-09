import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { access, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import puppeteer from 'puppeteer-core';
import WebSocket from 'ws';

const mode = process.argv[2] ?? 'negative';
const iterations = Number(process.env.ITERATIONS ?? 3);
const urls = [
  'https://duckduckgo.com/',
  'https://www.wikipedia.org/',
  'https://chromedevtools.github.io/devtools-protocol/',
];

if (!['negative', 'guarded'].includes(mode)) {
  throw new Error('usage: node repro.mjs [negative|guarded]');
}

const executable = await findChrome();

for (let iteration = 0; iteration < iterations; iteration += 1) {
  await runIteration(iteration);
}

async function findChrome() {
  const candidates = [
    process.env.CHROME_BIN,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Try the next conventional installation path.
    }
  }

  throw new Error('Chrome not found; set CHROME_BIN to the Chrome executable');
}

async function runIteration(iteration) {
  const profile = await mkdtemp(join(tmpdir(), 'chromium-restored-tab-crash-'));
  let child;
  let socket;

  try {
    await seedProfile(profile);
    await rm(join(profile, 'DevToolsActivePort'), { force: true });

    child = spawn(executable, chromeArguments(profile), {
      stdio: ['ignore', 'ignore', 'pipe'],
    });
    child.stderr.on('data', () => {});

    const endpoint = await discoverEndpoint(profile);
    const cdp = await connectCdp(endpoint);
    socket = cdp.socket;

    const { targetInfos } = await cdp.send('Target.getTargets');
    const pages = targetInfos.filter(
      target => target.type === 'page' && target.url.startsWith('https://'),
    );
    const attached = [];

    for (const page of pages) {
      const { sessionId } = await cdp.send('Target.attachToTarget', {
        targetId: page.targetId,
        flatten: true,
      });
      attached.push({ ...page, sessionId });
      await cdp.send('Page.enable', {}, sessionId, 300).catch(() => {});
      void cdp.send('Runtime.enable', {}, sessionId).catch(() => {});
    }

    await delay(200);
    const dormant = attached.filter(page => !cdp.contexts.has(page.sessionId));
    print({
      mode,
      iteration,
      stage: 'before-geometry',
      tabs: attached.map(page => ({
        url: page.url,
        context: cdp.contexts.has(page.sessionId),
      })),
    });

    if (dormant.length === 0) {
      throw new Error('inconclusive: no restored tab lacked an execution context');
    }

    if (mode === 'negative') {
      await runNegative(cdp, child, dormant[0], iteration);
    } else {
      await runGuarded(cdp, dormant, iteration);
      await cdp.send('Browser.close').catch(() => {});
    }
  } finally {
    socket?.terminate();
    if (child && child.exitCode === null && child.signalCode === null) {
      child.kill('SIGTERM');
      await once(child, 'exit');
    }
    child?.stderr.destroy();
    await rm(profile, { recursive: true, force: true });
  }
}

async function seedProfile(profile) {
  const browser = await puppeteer.launch({
    executablePath: executable,
    headless: true,
    defaultViewport: null,
    userDataDir: profile,
    args: ['--ignore-certificate-errors'],
  });

  try {
    for (const url of urls) {
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    }
  } finally {
    await browser.close();
    for (const stream of browser.process()?.stdio ?? []) stream?.destroy();
  }
}

function chromeArguments(profile) {
  return [
    `--user-data-dir=${profile}`,
    '--profile-directory=Default',
    '--remote-debugging-port=0',
    '--headless=new',
    '--no-first-run',
    '--no-default-browser-check',
    '--password-store=basic',
    '--use-mock-keychain',
    '--disable-extensions',
    '--disable-background-networking',
    '--enable-low-end-device-mode',
    '--window-size=800,600',
    '--force-device-scale-factor=1',
    '--restore-last-session',
    '--restart',
    '--hide-crash-restore-bubble',
  ];
}

async function discoverEndpoint(profile) {
  const deadline = Date.now() + 10_000;

  while (Date.now() < deadline) {
    try {
      const activePort = await readFile(join(profile, 'DevToolsActivePort'), 'utf8');
      const port = Number(activePort.split('\n')[0]);
      const response = await fetch(`http://127.0.0.1:${port}/json/version`);
      return (await response.json()).webSocketDebuggerUrl;
    } catch {
      await delay(20);
    }
  }

  throw new Error('restored Chrome CDP endpoint was not available within 10 seconds');
}

async function connectCdp(endpoint) {
  const socket = new WebSocket(endpoint);
  await once(socket, 'open');

  let nextId = 1;
  const pending = new Map();
  const contexts = new Set();

  socket.on('message', bytes => {
    const message = JSON.parse(String(bytes));

    if (message.method === 'Runtime.executionContextCreated') {
      contexts.add(message.sessionId);
    } else if (message.method === 'Runtime.executionContextsCleared') {
      contexts.delete(message.sessionId);
    }

    const receipt = pending.get(message.id);
    if (!receipt) return;

    pending.delete(message.id);
    clearTimeout(receipt.timer);
    if (message.error) {
      receipt.reject(new Error(message.error.message));
    } else {
      receipt.resolve(message.result);
    }
  });

  socket.on('close', () => {
    for (const receipt of pending.values()) {
      clearTimeout(receipt.timer);
      receipt.reject(new Error('browser transport closed'));
    }
    pending.clear();
  });

  function send(method, params = {}, sessionId, timeout = 3_000) {
    return new Promise((resolve, reject) => {
      const id = nextId;
      nextId += 1;
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`${method} timed out`));
      }, timeout);
      pending.set(id, { resolve, reject, timer });
      socket.send(JSON.stringify({
        id,
        method,
        params,
        ...(sessionId ? { sessionId } : {}),
      }));
    });
  }

  return { socket, contexts, send };
}

async function runNegative(cdp, child, page, iteration) {
  let error;
  try {
    await cdp.send(
      'Emulation.setDeviceMetricsOverride',
      metrics(),
      page.sessionId,
    );
  } catch (cause) {
    error = cause.message;
  }

  const deadline = Date.now() + 3_000;
  while (child.exitCode === null && child.signalCode === null && Date.now() < deadline) {
    await delay(20);
  }

  print({
    mode,
    iteration,
    url: page.url,
    error,
    exitCode: child.exitCode,
    signal: child.signalCode,
  });

  if (child.signalCode !== 'SIGSEGV') {
    throw new Error('negative witness did not reproduce SIGSEGV');
  }
}

async function runGuarded(cdp, dormant, iteration) {
  await cdp.send('Browser.getVersion');

  for (const page of dormant) {
    await cdp.send('Target.activateTarget', { targetId: page.targetId });
    const deadline = Date.now() + 8_000;
    while (!cdp.contexts.has(page.sessionId) && Date.now() < deadline) {
      await delay(20);
    }

    if (!cdp.contexts.has(page.sessionId)) {
      throw new Error(`activated tab did not report a live context: ${page.url}`);
    }

    await cdp.send(
      'Emulation.setDeviceMetricsOverride',
      metrics(),
      page.sessionId,
    );
    const evaluated = await cdp.send(
      'Runtime.evaluate',
      {
        expression: 'JSON.stringify({width: innerWidth, height: innerHeight, url: location.href})',
        returnByValue: true,
      },
      page.sessionId,
    );
    print({
      mode,
      iteration,
      url: page.url,
      deferred: true,
      context: true,
      geometry: evaluated.result.value,
    });
  }

  await cdp.send('Browser.getVersion');
}

function metrics() {
  return {
    width: 800,
    height: 520,
    deviceScaleFactor: 1,
    mobile: false,
  };
}

function delay(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

function print(value) {
  process.stdout.write(`${JSON.stringify(value)}\n`);
}
