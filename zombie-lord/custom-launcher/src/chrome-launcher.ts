/**
 * @license Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

import * as childProcess from 'child_process';
import * as fs from 'fs';
import * as net from 'net';
import * as rimraf from 'rimraf';
import * as chromeFinder from './chrome-finder';
import {getRandomPort} from './random-port';
import {DEFAULT_FLAGS} from './flags';
import {makeTmpDir, defaults, delay, getPlatform, toWinDirFormat, InvalidUserDataDirectoryError, UnsupportedPlatformError, ChromeNotInstalledError} from './utils';
import {ChildProcess} from 'child_process';
const log = require('lighthouse-logger');
const spawn = childProcess.spawn;
const execSync = childProcess.execSync;
const isWsl = getPlatform() === 'wsl';
const isWindows = getPlatform() === 'win32';
const _SIGINT = 'SIGINT';
//const _SIGINT_EXIT_CODE = 130;
const _SUPPORTED_PLATFORMS = new Set(['darwin', 'linux', 'win32', 'wsl']);

type SupportedPlatforms = 'darwin'|'linux'|'win32'|'wsl';

const instances = new Set<Launcher>();

export type RimrafModule = (path: string, callback: (error: Error) => void) => void;

export interface Options {
  startingUrl?: string;
  chromeFlags?: Array<string>;
  port?: number;
  handleSIGINT?: boolean;
  chromePath?: string;
  userDataDir?: string|boolean;
  logLevel?: 'verbose'|'info'|'error'|'silent';
  ignoreDefaultFlags?: boolean;
  connectionPollInterval?: number;
  maxConnectionRetries?: number;
  envVars?: {[key: string]: string|undefined};
}

export interface LaunchedChrome {
  pid: number;
  port: number;
  process: ChildProcess;
  kill: () => Promise<{}>;
}

export interface ModuleOverrides {
  fs?: typeof fs;
  rimraf?: RimrafModule;
  spawn?: typeof childProcess.spawn;
}

const sigintListener = async () => {
  for (const instance of instances) {
    try {
      await instance.kill();
    } catch (err) {
    }
  }
};

async function launch(opts: Options = {}): Promise<LaunchedChrome> {
  opts.handleSIGINT = defaults(opts.handleSIGINT, true);

  const instance = new Launcher(opts);

  // Kill spawned Chrome process in case of ctrl-C.
  if (opts.handleSIGINT && instances.size === 0) {
    process.on(_SIGINT, sigintListener);
  }
  instances.add(instance);

  await instance.launch();

  const kill = async () => {
    instances.delete(instance);
    if (instances.size === 0) {
      process.removeListener(_SIGINT, sigintListener);
    }
    return instance.kill();
  };

  return {pid: instance.pid!, port: instance.port!, kill, process: instance.chrome!};
}

class Launcher {
  private tmpDirandPidFileReady = false;
  private pidFile: string;
  private startingUrl: string;
  private outFile?: number;
  private errFile?: number;
  private chromePath?: string;
  private ignoreDefaultFlags?: boolean;
  private chromeFlags: string[];
  private requestedPort?: number;
  private connectionPollInterval: number;
  private maxConnectionRetries: number;
  private fs: typeof fs;
  private rimraf: RimrafModule;
  private spawn: typeof childProcess.spawn;
  private useDefaultProfile: boolean;
  private envVars: {[key: string]: string|undefined};

  chrome?: childProcess.ChildProcess;
  userDataDir?: string;
  port?: number;
  pid?: number;

  constructor(private opts: Options = {}, moduleOverrides: ModuleOverrides = {}) {
    this.fs = moduleOverrides.fs || fs;
    this.rimraf = moduleOverrides.rimraf || rimraf;
    this.spawn = moduleOverrides.spawn || spawn;

    log.setLevel(defaults(this.opts.logLevel, 'silent'));

    // choose the first one (default)
    this.startingUrl = defaults(this.opts.startingUrl, 'about:blank');
    this.chromeFlags = defaults(this.opts.chromeFlags, []);
    this.requestedPort = defaults(this.opts.port, 0);
    this.chromePath = this.opts.chromePath;
    this.ignoreDefaultFlags = defaults(this.opts.ignoreDefaultFlags, false);
    this.connectionPollInterval = defaults(this.opts.connectionPollInterval, 500);
    this.maxConnectionRetries = defaults(this.opts.maxConnectionRetries, 50);
    this.envVars = defaults(opts.envVars, Object.assign({}, process.env));

    if (typeof this.opts.userDataDir === 'boolean') {
      if (!this.opts.userDataDir) {
        this.useDefaultProfile = true;
        this.userDataDir = undefined;
      } else {
        throw new InvalidUserDataDirectoryError();
      }
    } else {
      this.useDefaultProfile = false;
      this.userDataDir = this.opts.userDataDir;
    }
  }

  private get flags() {
    const flags = this.ignoreDefaultFlags ? [] : DEFAULT_FLAGS.slice();
    flags.push(`--remote-debugging-port=${this.port}`);

    if (!this.ignoreDefaultFlags && getPlatform() === 'linux') {
      flags.push('--disable-setuid-sandbox');
    }

    if (!this.useDefaultProfile) {
      // Place Chrome profile in a custom location we'll rm -rf later
      // If in WSL, we need to use the Windows format
      flags.push(`--user-data-dir=${isWsl ? toWinDirFormat(this.userDataDir) : this.userDataDir}`);
    }

    flags.push(...this.chromeFlags);
    flags.push(this.startingUrl);

    return flags;
  }

  static defaultFlags() {
    return DEFAULT_FLAGS.slice();
  }

  static getInstallations() {
    return chromeFinder[getPlatform() as SupportedPlatforms]();
  }

  // Wrapper function to enable easy testing.
  makeTmpDir() {
    return makeTmpDir();
  }

  prepare() {
    const platform = getPlatform() as SupportedPlatforms;
    if (!_SUPPORTED_PLATFORMS.has(platform)) {
      throw new UnsupportedPlatformError();
    }

    this.userDataDir = this.userDataDir || this.makeTmpDir();
    this.outFile = this.fs.openSync(`${this.userDataDir}/chrome-out.log`, 'a');
    this.errFile = this.fs.openSync(`${this.userDataDir}/chrome-err.log`, 'a');

    // fix for Node4
    // you can't pass a fd to fs.writeFileSync
    this.pidFile = `${this.userDataDir}/chrome.pid`;

    log.verbose('ChromeLauncher', `created ${this.userDataDir}`);

    this.tmpDirandPidFileReady = true;
  }

  async launch() {
    if (this.requestedPort !== 0) {
      this.port = this.requestedPort;

      // If an explict port is passed first look for an open connection...
      try {
        return await this.isDebuggerReady();
      } catch (err) {
        log.log(
            'ChromeLauncher',
            `No debugging port found on port ${this.port}, launching a new Chrome.`);
      }
    }
    if (this.chromePath === undefined) {
      const installations = Launcher.getInstallations();
      if (installations.length === 0) {
        throw new ChromeNotInstalledError();
      }

      this.chromePath = installations[0];
    }

    if (!this.tmpDirandPidFileReady) {
      this.prepare();
    }

    this.pid = await this.spawnProcess(this.chromePath);
    return Promise.resolve();
  }

  private async spawnProcess(execPath: string) {
    const spawnPromise = (async () => {
      if (this.chrome) {
        log.log('ChromeLauncher', `Chrome already running with pid ${this.chrome.pid}.`);
        return this.chrome.pid;
      }


      // If a zero value port is set, it means the launcher
      // is responsible for generating the port number.
      // We do this here so that we can know the port before
      // we pass it into chrome.
      if (this.requestedPort === 0) {
        this.port = await getRandomPort();
      }

      log.verbose(
          'ChromeLauncher', `Launching with command:\n"${execPath}" ${this.flags.join(' ')}`);
      const chrome = this.spawn(
          execPath, this.flags,
          {detached: true, stdio: ['ignore', this.outFile, this.errFile], env: this.envVars});
      this.chrome = chrome;

      this.fs.writeFileSync(this.pidFile, chrome.pid.toString());

      log.verbose('ChromeLauncher', `Chrome running with pid ${chrome.pid} on port ${this.port}.`);
      return chrome.pid;
    })();

    const pid = await spawnPromise;
    await this.waitUntilReady();
    return pid;
  }

  private cleanup(client?: net.Socket) {
    if (client) {
      client.removeAllListeners();
      client.end();
      client.destroy();
      client.unref();
    }
  }

  // resolves if ready, rejects otherwise
  private isDebuggerReady(): Promise<{}> {
    return new Promise((resolve, reject) => {
      const client = net.createConnection(this.port!);
      client.once('error', err => {
        this.cleanup(client);
        reject(err);
      });
      client.once('connect', () => {
        this.cleanup(client);
        resolve();
      });
    });
  }

  // resolves when debugger is ready, rejects after 10 polls
  waitUntilReady() {
    const launcher = this;

    return new Promise((resolve, reject) => {
      let retries = 0;
      let waitStatus = 'Waiting for browser.';

      const poll = () => {
        if (retries === 0) {
          log.log('ChromeLauncher', waitStatus);
        }
        retries++;
        waitStatus += '..';
        log.log('ChromeLauncher', waitStatus);

        launcher.isDebuggerReady()
            .then(() => {
              log.log('ChromeLauncher', waitStatus + `${log.greenify(log.tick)}`);
              resolve();
            })
            .catch(err => {
              if (retries > launcher.maxConnectionRetries) {
                log.error('ChromeLauncher', err.message);
                const stderr =
                    this.fs.readFileSync(`${this.userDataDir}/chrome-err.log`, {encoding: 'utf-8'});
                log.error(
                    'ChromeLauncher', `Logging contents of ${this.userDataDir}/chrome-err.log`);
                log.error('ChromeLauncher', stderr);
                return reject(err);
              }
              delay(launcher.connectionPollInterval).then(poll);
            });
      };
      poll();
    });
  }

  kill() {
    return new Promise<{}>((resolve, reject) => {
      if (this.chrome) {
        this.chrome.on('close', () => {
          delete this.chrome;
          this.destroyTmp().then(resolve);
        });

        log.log('ChromeLauncher', `Killing Chrome instance ${this.chrome.pid}`);
        try {
          if (isWindows) {
            // While pipe is the default, stderr also gets printed to process.stderr
            // if you don't explicitly set `stdio`
            execSync(`taskkill /pid ${this.chrome.pid} /T /F`, {stdio: 'pipe'});
          } else {
            process.kill(-this.chrome.pid);
          }
        } catch (err) {
          const message = `Chrome could not be killed ${err.message}`;
          log.warn('ChromeLauncher', message);
          reject(new Error(message));
        }
      } else {
        // fail silently as we did not start chrome
        resolve();
      }
    });
  }

  destroyTmp() {
    return new Promise(resolve => {
      // Only clean up the tmp dir if we created it.
      if (this.userDataDir === undefined || this.opts.userDataDir !== undefined) {
        return resolve();
      }

      if (this.outFile) {
        this.fs.closeSync(this.outFile);
        delete this.outFile;
      }

      if (this.errFile) {
        this.fs.closeSync(this.errFile);
        delete this.errFile;
      }

      this.rimraf(this.userDataDir, () => resolve());
    });
  }
};

export default Launcher;
export {Launcher, launch};
