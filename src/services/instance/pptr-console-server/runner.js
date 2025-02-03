  import assert from 'assert';
  import fs from 'fs';
  import path from 'path';
  import vm from 'vm';
  import puppeteer from 'puppeteer';
  import {patchError, MAX_RUN_TIME_MS} from './common.js';

  const sleep = ms => new Promise(res => setTimeout(res, ms));
  const DEBUG = {
    val: 0
  };
  const VM_OPTS = {
    timeout: MAX_RUN_TIME_MS + 300,
    breakOnSigint: true
  };
  const CONTEXT_OPTS = {
    name: 'pptr-console-context-',
    origin: 'pptr-console://',
    codeGeneration: {
      strings: false,
      wasm: false
    },
  };
  const SCRIPT_OPTS = {
    filename: '',
    lineOffset: 1,
    columnOffset: 1,
  };
  const GlobalContext = {
    Sleep: sleep
  };
  const Current = {};
  let MAX_TABS;
  let PORT;
  let globalContextPatched = false;
  let tabCount = 0;

  if ( process.disconnect ) {
    process.disconnect();
  }
  process.on('warning', err => {
    console.error('warning', err);
  });
  process.on('unhandledRejection', (reason, pr) => {
    console.error(reason);
  });
  process.on('uncaughtException', (err, origin) => {
    console.error(`${origin}: exception`, err);
  });
  process.on('exit', code => {
    console.log({exitCode:code});
  });
  runScript();

    // handle running the script in a secure sandbox
    async function runScript() {
      // get args
        const script_name = process.argv[2];
        const {Current:rawCurrent} = JSON.parse(process.argv[3]);
        const currentTabCount = parseInt(process.argv[4]);
        const currentPort = parseInt(process.argv[5]);
        const currentMT = parseInt(process.argv[6]);

      // lift some args to globals
      Object.assign(Current, rawCurrent);
      PORT = currentPort;
      tabCount = currentTabCount;
      MAX_TABS = currentMT;
      if ( ! script_name ) {
        const e = new Error(`Run can only work if you provide a script name to run!`);
        patchError(e);
        throw e;
      }
      if ( Number.isNaN(tabCount) ) {
        const e = new TypeError(`Tab count must be passed in as an integer.`);
        patchError(e);
        throw e;
      }
      let scriptText = fs.readFileSync(script_name).toString();
      // ensure the context is fresh so we don't pollute GlobalContext with any 
      // scope of this run 
      // this means each call to runScript is fresh and pure like a mountain stream
      if ( !globalContextPatched ) {
        await patchContext(GlobalContext);
      }
      const Context = Object.assign(Object.create(null), GlobalContext);
      Context.Current = Current;
      // for logging and inspection
      CONTEXT_OPTS.name += script_name;
      CONTEXT_OPTS.origin += script_name;
      vm.createContext(Context, CONTEXT_OPTS);
      // Object.freeze here simply prevents any properties
      // set on the global ('this' in the contextually run script's execution context)
      // from being visible after execution
      // if we don't set object freeze here, we can inspect these properties 
      // after the script has run
      Object.freeze(Context);
      scriptText = scriptText.replace(
        `require('puppeteer')`, 
        'Puppeteer;'
      );
      scriptText = scriptText.replace(
        `require('assert')`, 
        'Assert;'
      );
      let killTimer;
      try {
        SCRIPT_OPTS.filename = path.basename(script_name);
        const script = new vm.Script(scriptText, SCRIPT_OPTS);
        // send ourselves SIGTERM in timeout + 600
        // to try to froce an end
        killTimer = setTimeout(() => {
          const e = new Error(`[PPTRConsoleCustomerError] Timelimit exceeded.`);
          patchError(e);
          console.error(e);
          process.kill(process.pid, 'SIGTERM');
        }, VM_OPTS.timeout + 900);
        const anyResult = await script.runInContext(Context, VM_OPTS);
        say({result:anyResult});
      } catch(error) {
        patchError(error);
        console.error({error});
      } finally {
        clearTimeout(killTimer);
        await sleep(300);
        try {
          Context.Browser.disconnect();
        } catch(e) {
          const e2 = new Error(`[PPTRConsoleCustomError] PPTR says it had jobs waiting at the end of the script.`);
          patchError(e2);
          patchError(e);
          console.error(e2);
          console.error(e);
        }
        say({complete_at:new Date});
      }
    }

    // patch functions
      function patchCDPSession(cs) {
        // prevent 
        /**
          - Browser.close
          - limit Target.createTarget to MAX_TABS
        **/

        const cs_send = cs.send;

        const scopeSend = async (...args) => cs_send.call(cs, ...args);

        cs.send = async (method, ...paramArgs) => {
          if ( method === "Target.createTarget" ) {
            if ( (tabCount+1) > MAX_TABS ) {
              const e = new Error(`[PPTRConsoleCustomError]\n  Too many tabs: ${tabCount}`);
              patchError(e);
              throw e;
              return;
            } else {
              tabCount += 1;
              DEBUG.val && console.log(`Create. Tabs: ${tabCount}`);
            }
          } else if ( method === "Target.closeTarget" ) {
            /** 
              // we may not need this since we subscribe in browser 
                tabCount -= 1;
                if ( tabCount < 0 ) {
                  tabCount = 0;
                }
                console.log(`Close. Tabs: ${tabCount}`);
            **/
          } else if ( method === "Browser.close" ) {
            return void 0;
          }
          let result;
          try {
            result = await scopeSend(method, ...paramArgs);
          } catch(e) {
            patchError(e);
            throw e; 
          }
        };

        return cs;
      }

      function patchPuppeteer(pt) {
        /**
          - connect: Remove ability to connect to any URL beside localhost port
          (why? so Alice cannot connect to Bob's browser)
          - connect: Only return existing (patched) Br
        **/

        pt.connect = () => GlobalContext.Browser;

        pt.createBrowserFetcher = () => {
          const e = new TypeError(
            `[PPTRConsoleCustomError]\n  BrowserFetchers are not supported in this mode.`
          );
          patchError(e);
          throw e;
        };

        pt.launch = () => GlobalContext.Browser;

        return pt;
      }

      function patchBrowser(br) {
        /**
          - newPage: limit max number of open tabs
          (why? so no while(true) Browser.newPage())
          - defaultBrowserContext: patch it
          - browserContexts: patch returned contexts
          - close: no-op
          - createIncognitoBrowserContext: patch it
          - defaultBrowserContext: patch it
          - waitForTarget: patch returned target if any
        **/

        const br_newPage = br.newPage;
        const br_pages = br.pages;
        const br_browserContexts = br.browserContexts;
        const br_createIncognitoBrowserContext = br.createIncognitoBrowserContext;
        const br_defaultBrowserContext = br.defaultBrowserContext;
        const br_target = br.target;
        const br_targets = br.targets;
        const br_waitForTarget = br.waitForTarget;
        const br_on = br.on;

        const scopeNewPage = (...args) => br_newPage.call(br, ...args);
        const scopePages = (...args) => br_pages.call(br, ...args);
        const scopeBrowserContexts = (...args) => br_browserContexts.call(br, ...args);
        const scopeCreateIBC = (...args) => br_createIncognitoBrowserContext.call(br, ...args);
        const scopeDefaultBC = (...args) => br_defaultBrowserContext.call(br, ...args);
        const scopeTarget = (...args) => br_target.call(br, ...args);
        const scopeTargets = (...args) => br_targets.call(br, ...args);
        const scopeWaitForTarget = (...args) => br_waitForTarget.call(br, ...args);
        const scopeOn = (...args) => br_on.call(br, ...args);

        br.newPage = async (...args) => {
          if ( (tabCount+1) > MAX_TABS ) {
            const e = new Error(`[PPTRConsoleCustomError]\n  Too many tabs: ${tabCount}`);
            patchError(e);
            throw e;
            return;
          } else {
            DEBUG.val && console.log(`Create. Tabs: ${tabCount}`);
            tabCount += 1;
            let page = await scopeNewPage(...args);
            page = patchPage(page);
            return page;
          }
        }

        br.pages = async (...args) => {
          const rawPages = await scopePages();
          const pages = Promise.all(rawPages.map(patchPage));
          return pages;
        }

        br.close = () => void 0;

        br.browserContexts = (...args) => {
          const rawBCs = scopeBrowserContexts();
          const BCs = rawBCs.map(patchBrowserContext);
          return BCs;
        };

        br.createIncognitoBrowserContext = async (...args) => {
          return patchBrowserContext(await scopeCreateIBC(...args));
        };

        br.defaultBrowserContext = (...args) => {
          return patchBrowserContext(scopeDefaultBC(...args));
        };

        br.target = (...args) => {
          return patchTarget(scopeTarget(...args));
        };

        br.targets = (...args) => {
          const rawTargets = scopeTargets(...args);
          return rawTargets.map(patchTarget);
        };

        br.waitForTarget = async (...args) => {
          const matchingTarget = await scopeWaitForTarget(...args);
          if ( matchingTarget ) {
            return patchTarget(matchingTarget);
          }
        };

        br.on = (event, func) => {
          const newFunc = rawTarget => {
            const target = patchTarget(rawTarget);
            return func(target);
          };
          return scopeOn(event, newFunc);
        };

        return br;
      }

      function patchBrowserContext(bc) {
        /**
          - newPage: count
          - pages: patch returned pages
          - browser: return Context.Browser only
          - target
          - targets
          - close: no-op
        **/

        const bc_pages = bc.pages;
        const bc_newPage = bc.newPage;
        const bc_targets = bc.targets;
        const bc_waitForTarget = bc.waitForTarget;
        const bc_on = bc.on;

        const scopePages = (...args) => bc_pages.call(bc,...args);
        const scopeNewPage = (...args) => bc_newPage.call(bc,...args);
        const scopeTargets = (...args) => bc_targets.call(bc,...args);
        const scopeWaitForTarget = (...args) => bc_waitForTarget.call(bc, ...args);
        const scopeOn = (...args) => bc_on.call(bc, ...args);

        bc.pages = (...args) => scopePages(...args);
        bc.newPage = async (...args) => {
          if ( (tabCount+1) > MAX_TABS ) {
            const e = new Error(`Too many tabs: ${tabCount}`);
            patchError(e);
            throw e;
            return;
          } else {
            tabCount += 1;
            return patchPage(await scopeNewPage(...args));
          }
        }
        bc.browser = () => GlobalContext.Browser;
        bc.close = () => void 0;

        bc.targets = (...args) => {
          const rawTargets = scopeTargets(...args);
          return rawTargets.map(patchTarget);
        };

        bc.waitForTarget = async (...args) => {
          const matchingTarget = await scopeWaitForTarget(...args);
          if ( matchingTarget ) {
            return patchTarget(matchingTarget);
          }
        };

        bc.on = (event, func) => {
          const newFunc = rawTarget => {
            const target = patchTarget(rawTarget);
            return func(target);
          };
          return scopeOn(event, newFunc);
        };


        return bc;
      }

      function patchTarget(ta) {
        const ta_page = ta.page;
        const ta_bc = ta.browserContext;
        const ta_opener = ta.opener;
        const ta_cdpSession = ta.createCDPSession;

        const scopePage = (...args) => ta_page.call(ta,...args);
        const scopeBC = (...args) => ta_bc.call(ta, ...args);
        const scopeOpener = (...args) => ta_opener.call(ta, ...args);
        const scopeCreateCDPSession = (...args) => ta_cdpSession.call(ta, ...args);

        ta.browser = () => GlobalContext.Browser;
        ta.page = async (...args) => {
          const rawPage = await scopePage();
          if ( rawPage ) {
            return patchPage(rawPage);
          }
        };
        ta.browserContext = (...args) => {
          const rawBC = scopeBC(...args);
          return patchBrowserContext(rawBC);
        };
        ta.opener = (...args) => {
          const rawTa = scopeOpener(...args);
          if ( rawTa ) {
            return patchTarget(rawTa);
          } 
        };
        ta.createCDPSession = async (...args) => {
          const rawCDPSession = await scopeCreateCDPSession(...args);
          return patchCDPSession(rawCDPSession);
        };

        return ta;
      }

      async function patchPage(pg) {
        /**
          - browser: return Context.Browser only
          - browserContext: patchBrowserContext
        **/

        const pg_close = pg.close;
        const pg_browserContext = pg.browserContext;
        const pg_target = pg.target;

        const scopePageClose = (...args) => pg_close.call(pg, ...args);
        const scopePageBrowserContext = (...args) => pg_browserContext.call(pg, ...args);
        const scopeTarget = (...args) => pg_target.call(pg, ...args);

        pg.close = (...args) => {
          return scopePageClose(...args);
        }

        pg.target = (...args) => {
          return patchTarget(scopeTarget(...args));
        }

        pg.browser = () => GlobalContext.Browser;
        pg.browserContext = () => patchBrowserContext(scopePageBrowserContext());

        await pg.setViewport({
          width: Current.width,
          height: Current.height,
          isMobile: Current.isMobile,
          hasTouch: Current.hasTouch
        });

        return pg;
      }

    async function say(obj, str = false, suppress = true) {
      setTimeout(() => {
        if ( str ) {
          try {
            console.log(JSON.stringify(obj));
            return;
          } catch(e) {
            patchError(e);
            if ( ! suppress ) {
              console.warn(e);
            }
          }
        }
        if ( str ) {
          console.log(`${obj}[*circular reference]`);
        } else {
          console.log(obj);
        }
      }, 0);
    }

    async function patchContext(Context) {
      if ( globalContextPatched ) return;
      try {
        globalContextPatched = true;
        const port = PORT - 3000 + 1;
        Context.Assert = assert;
        Context.Puppeteer = puppeteer;
        Context.Browser = await puppeteer.connect({browserURL:`http://localhost:${port}/`}),
        Context.Browser = patchBrowser(Context.Browser);
        Context.Browser.on('targetcreated', t => {
          if ( t.type() === 'page' ) {
            tabCount += 1;
          }
          DEBUG.val && console.log(`Open. Tabs: ${tabCount}`);
        });
        Context.Browser.on('targetdestroyed', t => {
          if ( t.type() === 'page' ) {
            tabCount -= 1;
          }
          if ( tabCount < 0 ) {
            tabCount = 0;
          }
          DEBUG.val && console.log(`Close. Tabs: ${tabCount}`);
        });
        Context.Puppeteer = patchPuppeteer(Context.Puppeteer);
      } catch(e) {
        patchError(e);
        console.warn(`Error patching global context`, e);
        globalContextPatched = false;
      }
    }



