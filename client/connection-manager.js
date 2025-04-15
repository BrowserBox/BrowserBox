// connection-manager.js
import { WebSocket } from 'ws';
import { Agent } from 'https';
import TK from 'terminal-kit';
const { terminal } = TK;
import { DEBUG, logMessage } from './log.js';

export class ConnectionManager {
  constructor(loginUrl, proxyBaseUrl, apiUrl) {
    this.loginUrl = loginUrl;
    this.proxyBaseUrl = proxyBaseUrl;
    this.apiUrl = apiUrl;
    this.cookieHeader = null;
    this.cookieValue = null;
    this.socket = null;
    this.browserbox = null;
    this.sendFn = null;
    this.Resolvers = {};
    this.messageId = 0;
  }

  async authenticate() {
    terminal.cyan('Authenticating to set session cookie...\n');
    try {
      const response = await fetch(this.loginUrl, {
        method: 'GET',
        headers: { Accept: 'text/html' },
        redirect: 'manual',
      });
      if (response.status !== 302) {
        throw new Error(`Expected 302 redirect, got HTTP ${response.status}: ${await response.text()}`);
      }
      const setCookie = response.headers.get('set-cookie');
      if (!setCookie) throw new Error('No Set-Cookie header in /login response');
      const cookieMatch = setCookie.match(/browserbox-[^=]+=(.+?)(?:;|$)/);
      if (!cookieMatch) throw new Error('Could not parse browserbox cookie');
      this.cookieValue = cookieMatch[1];
      const cookieName = setCookie.split('=')[0];
      this.cookieHeader = `${cookieName}=${this.cookieValue}`;
      DEBUG && console.log(`Captured cookie: ${this.cookieHeader}`);
      return { cookieHeader: this.cookieHeader, cookieValue: this.cookieValue };
    } catch (error) {
      if (DEBUG) console.warn(error);
      terminal.red(`Error during login: ${error.message}\n`);
      throw error;
    }
  }

  async fetchTargets() {
    if (!this.cookieHeader) {
      throw new Error('Must authenticate before fetching targets');
    }
    DEBUG && terminal.cyan('Fetching available tabs...\n');
    try {
      const response = await fetch(this.apiUrl, {
        method: 'GET',
        headers: { Accept: 'application/json', Cookie: this.cookieHeader },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      const data = await response.json();
      const targets = (data.tabs || []).filter(t => t.type === 'page' || t.type === 'tab');
      if (!targets.length) {
        DEBUG && terminal.yellow('No page or tab targets available.\n');
      }
      return targets;
    } catch (error) {
      if (DEBUG) console.warn(error);
      terminal.red(`Error fetching tabs: ${error.message}\n`);
      throw error;
    }
  }

  async setupWebSockets(hostname, token) {
    if (!this.cookieValue) {
      throw new Error('Must authenticate before setting up WebSockets');
    }

    // Fetch WebSocket debugger URL
    DEBUG && terminal.cyan(`Fetching WebSocket debugger URL from ${this.proxyBaseUrl}/json/version...\n`);
    let wsDebuggerUrl;
    try {
      const response = await fetch(`${this.proxyBaseUrl}/json/version`, {
        method: 'GET',
        headers: { Accept: 'application/json', 'x-browserbox-local-auth': this.cookieValue },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      const data = await response.json();
      wsDebuggerUrl = data.webSocketDebuggerUrl;
      if (!wsDebuggerUrl) throw new Error('No webSocketDebuggerUrl in response');
    } catch (error) {
      if (DEBUG) console.warn(error);
      terminal.red(`Error fetching WebSocket debugger URL: ${error.message}\n`);
      throw error;
    }

    // Setup main WebSocket
    wsDebuggerUrl = wsDebuggerUrl.replace('ws://localhost', `wss://${hostname}`);
    wsDebuggerUrl = `${wsDebuggerUrl}/${token}`;
    DEBUG && terminal.cyan(`Connecting to WebSocket at ${wsDebuggerUrl}...\n`);
    this.socket = new WebSocket(wsDebuggerUrl, {
      headers: { 'x-browserbox-local-auth': this.cookieValue },
      agent: new Agent({ rejectUnauthorized: false }),
    });

    // Setup browserbox WebSocket
    let wsBBUrl = new URL(this.loginUrl);
    wsBBUrl.protocol = 'wss:';
    wsBBUrl.searchParams.set('session_token', wsBBUrl.searchParams.get('token'));
    wsBBUrl.pathname = '/';
    this.browserbox = new WebSocket(wsBBUrl, {
      headers: { 'x-browserbox-local-auth': token },
      agent: new Agent({ rejectUnauthorized: false }),
    });

    // Wait for connections
    await Promise.all([
      new Promise((resolve, reject) => {
        this.socket.on('open', resolve);
        this.socket.on('error', reject);
      }),
      new Promise(resolve => this.browserbox.on('open', resolve)),
    ]);
    DEBUG && terminal.green('Connected to WebSocket and browserbox\n');

    // Setup CDP send function
    this.sendFn = this.createSend();
    this.socket.on('message', this.createMessageHandler());
    this.socket.on('close', () => {
      terminal.yellow('WebSocket disconnected\n');
    });
    this.socket.on('error', err => {
      if (DEBUG) console.warn(err);
      terminal.red(`WebSocket error: ${err.message}\n`);
    });

    return { socket: this.socket, browserbox: this.browserbox, send: this.sendFn };
  }

  createSend() {
    const WAIT_FOR_COMMAND_RESPONSE = 10 * 1000;
    return async (method, params = {}, sessionId) => {
      const message = { method, params, sessionId, id: ++this.messageId };
      const key = `${sessionId || 'root'}:${message.id}`;
      let resolve;
      const promise = new Promise(res => (resolve = res));
      this.Resolvers[key] = resolve;

      const timeout = setTimeout(() => {
        delete this.Resolvers[key];
        resolve({});
      }, WAIT_FOR_COMMAND_RESPONSE);

      try {
        logMessage('SEND', message, terminal);
        this.socket.send(JSON.stringify(message));
      } catch (error) {
        clearTimeout(timeout);
        delete this.Resolvers[key];
        if (DEBUG) console.warn(error);
        terminal.red(`Send error: ${error.message}\n`);
        throw error;
      }
      return promise.finally(() => clearTimeout(timeout));
    };
  }

  createMessageHandler() {
    return async data => {
      let message;
      try {
        const dataStr = Buffer.isBuffer(data) ? data.toString('utf8') : data;
        message = JSON.parse(dataStr);
        logMessage('RECEIVE', message, terminal);
      } catch (error) {
        if (DEBUG) console.warn(error);
        terminal.red(`Invalid message: ${('' + data).slice(0, 50)}...\n`);
        return;
      }
      const key = `${message.sessionId || 'root'}:${message.id}`;
      if (message.id && this.Resolvers[key]) {
        this.Resolvers[key](message.result || message.error);
        delete this.Resolvers[key];
      }
      // Let caller handle specific CDP events
      return message;
    };
  }

  getSocket() {
    return this.socket;
  }

  getBrowserbox() {
    return this.browserbox;
  }

  getSend() {
    return this.sendFn;
  }

  cleanup() {
    if (this.socket) this.socket.close();
    if (this.browserbox) this.browserbox.close();
    this.socket = null;
    this.browserbox = null;
    this.sendFn = null;
    this.Resolvers = {};
  }
}
