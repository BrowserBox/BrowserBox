## v0.12.0 (Wed, Oct 30 2019)
* `66a5e226` flags: add new --disable flags to reduce noise and disable backgrounding (#170)
  - --disable-component-extensions-with-background-pages
  - --disable-backgrounding-occluded-windows
  - --disable-renderer-backgrounding
  - --disable-background-timer-throttling
* `c4890ee3` feat: expose public interface for locating Chrome installations (#177)
  - `Launcher.getInstallations()` returns an array of paths to available Chrome binaries
* `a5ccaa4e` deps: update assorted dependencies (#175)
* `e67a10df` --disable-translation is now --disable-features=TranslateUI (#167)

## v0.11.2 (Mon, Jul 29 2019)
* `1928187` fix: prevent mutation of default flags (#162)
* `02a23c2` docs: fix launcher example in README (#160)
* `90dc0e4` update manual-chrome-launcher with fixes from LH

## v0.11.1 (Tue, Jul 09 2019)
* `ec80f0ca` tests: drop support for node 9. continue supporting node 8 LTS (#159)
* `4865f3af` deps(security): bump mocha to latest (#158)
* `e0d2b09b` deps(security): bump handlebars from 4.0.11 to 4.1.2 (#157)
* `982be53f` update changelog for v0.10.7 and v0.11.0

## v0.11.0 (Tue, Jul 09 2019)
* `a860504f` [Breaking change] remove enableExtensions. add ignoreDefaultFlags & defaultFlags() (#124)
* `448a1d48` chrome-finder: Add support for MacOS Catalina (#149)
* `55b891bb` deps(is-wsl): add support for WSL 2; drop Node 6 (#152)
* `57e18181` deps: upgrade typescript and ts-node (#155)
* `a8848116` deps(security): bump lodash from 4.17.4 to 4.17.11 (#147)
* `0a775dab` Document that --enable-automation disables automatic page reloads (#140)
* `c9f653e2` Removing dead --safebrowsing-disable-auto-update flag. (#139)
* `be12d564` yarn.lock add integrity
* `e361aa43` Update changelog.md (#137)

## v0.10.7 (Wed, May 01 2019)
* `55397e0c` deps: update yarn.lock from #142
* `179a3f33` silence grep (#138)
* `d2f6037a` fix: move unneeded ts types to devDeps (#142)
* `984d61ce` docs(flags): remove a few flags that are gone.
* `6316362c` docs: fix link to chrome-launcher's flags (#128)
* `f1f6d162` Update chrome-flags-for-tools.md

## v0.10.5 (Tue, Sep 25 2018)
* `1328319b` fix: set the `which` command's stdio to pipe (#125)

## v0.10.4 (Mon, Sep 17 2018)
* `35842ba4` fix: ignore stdio on `which` call (#121)
* `f126c3a0` fix: reject promise on failed kill() (#112)
* `5ee0fde2` Set custom error codes for all errors.
* `841bdf3f` Fix picking CHROME_PATH priority over other matches.
* `6b10d748` Fix Travis CI build: GCE for chrome bug (#87)
* `d4aa8295` Fix readme's default logLevel (#85)
* `5be71243` Type improvements (#102)
* `dd5fdd49` Stricter typing for logLevel (#105)
* `c9394cf7` Fix README typo: booelan ==> boolean (#104)
* Update chrome-flags-for-tools.md

## v0.10.3 (Mon, Sep 17 2018)
Bad release. Had a breaking change (#70). Unpublished.

## v0.10.2 (Mon, Jan 8 2018)
* `ef91605f` Fix TS typing (#82)
* `baf2205f` tests(travis): test on Node 9, drop testing on Node 7 (#80)

## v0.10.1 (Fri, Jan 5 2018)
* `a5bc8180` Fix getLocalAppDataPath for wsl (#75)
* `70a91885` readme: recommend use of cri with chrome-launcher (#78)
* `d3ee63bd` folder refactor: ts in /src, js in /dist (#69)

## 0.10.0 (Fri, Dec 8 2017)
* `449c5238` Expose launched chrome child process object. (#67)
* `0978891c` Enable users to pass env vars into spawned chrome. (#66)
* `0261f43b` Add document covering the various chrome flags
* `5617473c` Make launcher the default export. (#63)
* `483acff5` fix: support alpine linux by retrying grep with -r  (#61)
* `eaa0bb87` docs: update maxConnectionRetries default to 50 (#58)

## 0.9.0 (Mon, 27 Nov 2017)
* `4cc9c075` New: Add `userDataDir` flag to use default user profile instead (#48)
* `94137051` Avoid selecting google-emacs (#35)

## 0.8.0 (Wed, 20 Sept 2017)
* `256399c` Add support for Windows Subsystem for Linux / BashOnWindows (#27)

## 0.7.0 (Thu, 14 Sept 2017)
* Project moved to its own repo: https://github.com/GoogleChrome/chrome-launcher
* `8d0766eb` Retry connection for longer (#21)
* `52cb50af` only include PROGRAMFILES(X86) if present (#20)
* `530822b9` log pid to kill (#22)
* `1d617ab3` add support for `connectionPollInterval ` and `maxConnectionRetries` (#19)
* `7474971f` Fix errors inside spawnPromise being ignored (https://github.com/GoogleChrome/lighthouse/pull/2939)

## 0.6.0 (Thu, 17 Aug 2017)
* `43baee69` mute any audio (#3028)
* `ae6e9551` Better SIGINT handling (#2959)
* `3ab3a117` docs: add changelog to launcher (#2987)

## 0.5.0 (Mon, 14 Aug 2017)
* `494f9911` clarify priority of chromePath options
* `1c11021a` add support for finding Chromium on Linux (#2950)
* `391e2043` Publish type definitions instead of source TypeScript files (#2898)
* `de408ad3` readme: update example using deprecated `LIGHTHOUSE_CHROMIUM_PATH` (#2929)
* `8bc6d18e` add license file to launcher package. (#2849)

## 0.4.0 (Tue, 1 Aug 2017)
* `37fd38ce` pass --enable-extensions on from manual-chrome-launcher (#2735)
* `c942d17e` support enabling extension loading (#2650)

## 0.3.2 (Wed, 19 Jul 2017)
* `112c2c7f` Fix chrome finder on linux/osx when process.env isn't populated (#2687)
* `5728695f` Added CHROME_PATH to readme (#2694)
* `fedc76a3` test: fix clang-format error (#2691)
* `a6bbcaba` nuke 'as string'
* `41df647f` cli: remove --select-chrome,--skip-autolaunch. Support CHROME_PATH env  (#2659)
* `8c9724e2` fix launcher w/ arbitrary flags (#2670)
* `9c0c0788` Expose LHR to modules consuming cli/run.ts (#2654)
* `6df6b0e2` support custom port via chrome-debug binary (#2644)
* `3f143b19` log the specific chrome spawn command.

## 0.3.1 (Wed, 5 Jul 2017)
* `ef081063` upgrade rimraf to latest (#2641)

## 0.3.0 (Fri, 30 Jun 2017)
* `edbb40d9` fix(driver): move performance observer registration to setupDriver (#2611)
