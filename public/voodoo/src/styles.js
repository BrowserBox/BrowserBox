import {restyleAll,restyleElement,initializeDSS,setState} from '../node_modules/style.dss/index.js';
import {DEBUG, isSafari} from './common.js';

export const stylists = {
  styleDocument, styleVoodooMain,
  styleTabSelector, styleTabList,
  styleNavControl, styleOmniBox, styleURLForm,
  stylePluginsMenu, 
  stylePluginsMenuButton, styleLoadingIndicator,
  styleHistoryForm,
  styleBandwidthIndicator,
  styleTabViewport,
  styleSelectInput,
  styleModals,
  styleContextMenu
};

export const dss = {
  restyleAll,restyleElement,initializeDSS,setState
};

// stylists
  function styleDocument(/*el, state*/) {
    return `
      :root {
        height: 100%;
        display: flex;
      }

      :root body {
        width: 100%;
        max-height: 100%;
        box-sizing: border-box;
        margin: 0;
      }

      nav input[type="text"], nav input[type="url"], 
      nav input[type="search"], nav input:not([type]), 
      nav button {
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
      }

      :root .debugBox,
      :root #debugBox {
        display: ${DEBUG.val>=DEBUG.high?'block':'none'};
      }

      :root input, :root button, :root select, :root textarea, :root [contenteditable] {
        font-family: system-ui, Arial, Helvetica, sans-serif, monospace, system;
      }
    `;
  }

  function styleVoodooMain(el, state) {
    return `
      main.voodoo {
        position: relative;
        display: grid;
        grid-template-areas:
          "targets targets targets targets targets"
          "bandwidth history url url plugins-menu-button"
          "viewport viewport viewport viewport viewport";
        grid-template-rows: auto 3rem 1fr;
        grid-template-columns: auto auto 1fr auto auto;
        height: 100%;
        width: 100%;
        overflow: hidden;
        transition: all 0.3s ease;
        background: snow;
        min-height: ${window.innerHeight-4}px;
      }

      @media screen and (max-width: 600px) {
        main.voodoo {
          grid-template-areas:
            "targets targets targets targets"
            "url url url url"
            "viewport viewport viewport viewport"
            "bandwidth history history plugins-menu-button";
          grid-template-rows: auto 3rem 1fr 3rem;
          grid-template-columns: 1fr 1fr 1fr 1fr;
        }

        nav.controls.aux {
          display: flex; 
          justify-content: center;
        }
      }

      ${state.pluginsMenuActive?
        `
          main.voodoo {
            transform: scale(0.75);
            filter: blur(8px);
            opacity: 0.8;
          }
        `:''
      }
    `;
  }

  function styleTabList(/*el, state*/) {
    return `
      nav ul {
      }

      nav ul li {
        display: inline-block;
        border-top-left-radius: 0.35rem;
        border-top-right-radius: 0.35rem;
        overflow: hidden;
      }

      nav ul li:not(.new):not(.active)::after {
        content: " ";
        border-right: thin solid;
        display: inline-block;
        position: absolute;
        height: 1.25rem;
        top: 0.38rem;
        right: 0;
      }

      nav.targets {
        position: relative;
        overflow: auto hidden;
        background: var(--lightgrey);
      }

      nav.targets::-webkit-scrollbar {
        display: none;
      }

      nav.targets ul {
        overflow: none;
        display: flex;
        flex-wrap: nowrap;
        min-width: 100%;
      }
    `;
  }

  function styleTabSelector(/*el, state*/) {
    return `
      li.tab-selector {
        display: inline-flex;
        align-items: center;
        box-sizing: border-box;
        max-width: 11rem;
        word-break: break-word;
        min-width: 100px;
        position: relative;
        height: 2rem;
        background: transparent;
        background: rgba(200,210,220,0.6);
        padding-left: 0.5rem;
      }
      
      li.tab-selector img.favicon {
        flex: 0 0;
        width: 20px;
        height: 20px;
        pointer-events: none;
      }

      li.tab-selector:not(.active) {
        opacity: 0.8;
      }

      li.tab-selector:not(.active):hover {
        opacity: 0.9;
        background: var(--white);
      }

      li.tab-selector.active {
        background: var(--white);
      }

      li.new {
        flex-shrink: 0;
        min-width: unset;
        border-top-left-radius: 0.35rem;
        border-top-right-radius: 0.35rem;
        overflow: hidden;
        margin: 0 0.35rem;
      }

      li.new button.new {
        display: inline-block;
        border-radius: 2rem;
        width: 1.7rem;
        height: 1.7rem;
        min-width: unset;
        background-image: url(./voodoo/asset-imports/nhsuk-icons/icon-plus.svg);
        background-size: 20px 20px;
        outline: none;
        border-color: transparent;
      }

      li.new button:hover, li.new button:active, li.new button:focus {
      }

      li.tab-selector button.close {
        position: absolute;
        right: 0.25rem;
        top: 0.25rem;
        height: 1.5rem;
        width: 1.5rem;
        z-index:2;
        text-align: center;
        padding: 0;
        background-image: url(./voodoo/asset-imports/nhsuk-icons/icon-close.svg);
        background-size: 61.8% 61.8%;
      }

      li.tab-selector button.close:hover,
      li.tab-selector button.close:active {
      }

      li.tab-selector:not(.active):hover,
      li.tab-selector:not(.active) a:focus {
      }

      li.tab-selector a {
        display: inline-block;
        box-sizing: border-box;
        width: 100%;
        height: 100%;
        overflow: hidden;
        text-decoration: none;
        vertical-align: middle;
        line-height: 2rem;
        white-space: nowrap;
        text-overflow: ellipsis;
        font-size: 0.85rem;
        padding-left: 0.35rem;
        padding-right: 1.65rem;
        outline: none;
        border-color: transparent;
      }
    `;
  }

  function styleNavControl(/*el, state*/) {
    return `
      @media screen and (max-width: 600px) {
        nav.aux {
          display: flex; 
          justify-content: center;
        }
      }

      nav {
        display: inline-flex;
        flex-basis: 2em;
        min-height: 2em;
        line-height: 2em;
        background: transparent;
      }
      
      nav:not(.targets) {
        padding: 0.35rem 0;
      }

      nav button {
        -webkit-user-select: none;
        -moz-user-select: none;
        user-select: none;
        -webkit-touch-callout: none;
        background-color: transparent;
      }

      nav.other {
        display: none;
      }

      nav.keyinput {
        grid-area: keyinput;
        position: absolute;
      }

      nav.loading {
        grid-area: loading;
      }

      nav.targets {
        grid-area: targets; 
      }
      
      nav.url {
        grid-area: url;
      }

      nav.history {
        grid-area: history;
      }

      nav form {
        display: flex;
      }

      ${isSafari()?
        `nav button, nav input {
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
          border: 0;
          box-sizing: border-box;
          position: relative;
          top: -2px;
        }
        
        nav button:active {
          background: linear-gradient( to top, var(--white), var(--silver) );
        }

        nav button {
          background: linear-gradient( to bottom, var(--white), var(--silver) );
        }`:''
      }

      nav form * {
      }

      nav aside.menu.disabled {
        display: none;
      }

      nav form.kbd-input {
        position: fixed;
        top: 5rem;
        left: 5rem;
        z-index: -1;
      }

      nav form.kbd-input input,
      nav form.kbd-input textarea {
        opacity: 0;
        border: 0;

        -webkit-user-select: none;
        -moz-user-select: none;
        user-select: none;
        -webkit-touch-callout: none;
      }
    `;
  }

  function styleOmniBox(/*el, state*/) {
    return `
      input:not(:focus), input[disabled] {
        background: var(--verylightgrey);
      }

      input:not(:focus):not([disabled]) {
        opacity: 0.7;
      }

      input:not(:focus):not([disabled]):hover {
        opacity: 0.9;
      }

      input:focus {
        outline: medium solid dodgerblue;
      }
      
      ${
        isSafari()? `
          input {
            -webkit-appearance: none;
          }
        `:''
      }
    `;
  }

  function styleHistoryForm(/*el, state*/) {
    return `
      form button.back {
        background-image: url(./voodoo/asset-imports/nhsuk-icons/icon-chevron-left.svg);
      }

      form button.forward {
        background-image: url(./voodoo/asset-imports/nhsuk-icons/icon-chevron-right.svg);
      }
    `;
  }

  function styleURLForm(/*el, state*/) {
    return `
      form {
        position: relative;
        display: flex;
        flex: 1;
      }

      form input {
        width: 100%;
        outline: none;
        padding: 0 0.5rem 0 0.35rem;
      }

      form.url input:focus {
      }

      form.url input[disabled] {
        background: transparent;
      }

      form button.go {
        background-image: url(./voodoo/asset-imports/nhsuk-icons/icon-arrow-right-circle.svg);
        background-size: 20px 20px;
      }
    `;
  }

  function stylePluginsMenu(el, state) {
    return `
      nav.plugins-menu {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 10000;
        display: ${state.pluginsMenuActive?'block':'none'};
        box-sizing: border-box;
        max-height: 100vh;
        overflow: hidden;
      }

      nav > aside {
        scroll-behaviour: smooth;
        box-sizing: border-box;
        max-height: 100vh;
        overflow: auto;
        padding-bottom: 10rem;
      }

      nav > aside > article {
        padding: 2rem 2rem 5rem;
        background: rgba(225,220,220,0.3);
      }

      nav > aside > header {
        position: sticky;
        position: -webkit-sticky;
        top: 0;
        background: grey;
        box-shadow: 0 1px 1px 0 grey;
      }

      nav.plugins-menu h1.spread {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 0.5rem 0 1rem;
      }

      nav article {
        max-width: 70ch;
        margin: 0 auto;
      }

      nav ul {
        list-style-position: inside;
      }

      nav h1 {
        margin: 0;
      }

      nav li dl {
        display: inline-block;
        margin: 0;
        vertical-align: top;
        max-width: 85%;
      }

      nav dt h1 {
        display: inline;
      }

      nav details:not([open]) {
        display: inline;
      }

      nav button {
        background: var(--silver);
      }
    `;
  }

  function stylePluginsMenuButton(/*el, state*/) {
    return `
      nav.plugins-menu-button {
        grid-area: plugins-menu-button;
        position: relative;
        display: inline-flex;
      }

      nav button {
        font-weight: bold;
      }

      nav ul.options {
        list-style-type: none;
        padding: 0;
        margin: 0;
        display: none;
      }

      nav ul.options li {
        -webkit-appearance: button;
        -moz-appearance: button;
        appearance: button;
      }

      nav ul.options.open {
        display: table;
        min-width: 10rem;
        z-index: 2;
        right: 0;
        top: 100%;
        transform: translate(0, 0);
      }

      @media screen and (max-width: 600px) {
        nav ul.options.open {
          top: 0;
          transform: translate(0, -100%);
        }
      }
    `;
  }

  /*function styleOldPluginsMenu(el, state) {
    return `
      nav.plugins-menu {
        grid-area: plugins-menu;
        position: relative;
      }

      nav button {
        background: var(--silver);
      }
      
      nav ul.options {
        list-style-type: none;
        padding: 0;
        margin: 0;
        display: none;
      }

      nav ul.options li {
        -webkit-appearance: button;
        -moz-appearance: button;
        appearance: button;
      }

      nav ul.options.open {
        display: table;
        min-width: 10rem;
        z-index: 2;
        right: 0;
        top: 100%;
        transform: translate(0, 0);
      }

      @media screen and (max-width: 600px) {
        nav ul.options.open {
          top: 0;
          transform: translate(0, -100%);
        }
      }
    `;
  }*/

  function styleBandwidthIndicator(/*el, state*/) {
    return `
      aside.bandwidth-indicator {
        grid-area: bandwidth;
        font-size: smaller;
        pointer-events: none;
        width: 18ch;
        margin: 0.25rem 0;
        max-height: 2.5rem;
        overflow: hidden;
        color: var(--grey);
        background: transparent;
        white-space: nowrap;
      }

      aside section.measure {

      }

      @media screen and (max-width: 600px) {
        aside.bandwidth-indicator {
          align-items: flex-start;
        }
      }
    `;
  }

  function styleLoadingIndicator(/*el, state*/) {
    return `
      aside.loading-indicator {
        grid-area: pending;
        position: absolute;
        pointer-events: none;
        height: 0.33rem;
        min-height: 5.333px;
        width: 100%;
        pointer-events: none;
        z-index: 2;
        overflow: hidden;
        top: -1px;
      }

      aside.loading-indicator progress {
        display: inline;
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
        width: 100%;
        height: 100%;
      }

      aside.loading-indicator progress[hidden] {
        display: none;
      }

      aside.loading-indicator progress::-webkit-progress-bar {
        background: silver;
      }

      aside.loading-indicator progress::-webkit-progress-value {
        background: dodgerblue;
      }
    `;
  }

  function styleTabViewport(/*el, state*/) {
    return `
      article.tab-viewport {
        grid-area: viewport;
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        -webkit-overflow-scrolling: touch;
        overflow: auto;
        border-top: thin solid gainsboro;
        border-bottom: thin solid gainsboro;
      }

      article.tab-viewport canvas,
      article.tab-viewport iframe {
        position: relative;
        display: block;
        width: 100%;
        height: 100%;
        flex-grow: 1;
        box-sizing: border-box;
      }

      article.tab-viewport iframe {
        border: 0;
        outline: 0;
      }

      * canvas {
        image-rendering: high-quality;
        -webkit-touch-callout: none;
      }
    `;
  }

  function styleSelectInput(/*el, state*/) {
    return `
      #selectinput {
        position: absolute;
        left: 50%;
        top: 30%;
        transform: translate(-50%,-50%);
        display: none;
        font-size: 2em;
      }

      #selectinput.open {
        display: inline;
        max-width: 90vw;
      }
    `;
  }

  function styleModals(/*el, state*/) {
    return `
      aside {
        position: absolute;
        display: flex;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 5;
        align-items: flex-start;
        justify-content: center;
        background: rgba(50,50,50,0.2);
      }

      aside:not(.active) {
        display: none;
      }

      aside > article:not(.open) {
        display: none; 
      }

      aside > article {
        z-index: 6;
        border: thin solid;
        background: whitesmoke;
        padding: 1rem 2rem;
        margin-top: 2.5rem;
        min-width: 150px;
        max-width: 666px;
        max-height: 80vh;
        word-break: break-word;
        overflow-x: hidden;
        overflow-y: auto;
        box-shadow: 1px 1px 1px grey;
      }

      * article.infobox textarea {
        display: block;
        background: white;
        font-family: monospace;
        width: 555px;
        min-height: 8em;
        max-width: 100%;
        max-height: 60vh;
        word-break: break-word;
        overflow-x: hidden;
        border: thin solid grey;
        overflow-y: auto;
        whitespace: pre;
        margin: 1em auto;
        resize: none;
      }
    `;
  }

  function styleContextMenu(/*el, state*/) {
    return `
      * .context-menu {
        position: absolute;
        background: whitesmoke;
        box-shadow: 1px 1px 1px 1px grey;
        padding: 0.5em 0;
        min-width: 200px;
        z-index: 10;
      }

      * .context-menu h1 {
        margin: 0;
        font-size: smaller;
      }

      * .context-menu ul {
        margin: 0;
        padding: 0;
        font-size: smaller;
        list-style-type: none;
      }

      * .context-menu ul li {
        cursor: default;
      }
      
      * .context-menu li,
      * .context-menu h1 {
        padding: 0 1em;
      }

      * .context-menu ul li:hover {
        background: powderblue;
      }
    `;
  }

