import {DEBUG, sleep} from '../../src/common.js'
const DemoTab = () => ({
  targetId: 'demo1' + Math.random(),
  browserContextId: 'demobrowser1',
  title: 'Dosy Browser',
  type: 'page',
  url: 'payment://signup-to-dosy-browser.html'
});

const dontFocus = true;
const runFuncs = [
  'installFormSubmitButtonHandler',
  'installStripeButton'
];
const opts = {dontFocus, runFuncs};
const started = new Set();

let tab = DemoTab();
const tabs = [tab];

let requestId = 1;
let messageId = 1;

export async function fetchDemoTabs() {
  requestId++;
  tab = tab || tabs[0];
  return {tabs, activeTarget:tab && tab.targetId, requestId};
}

export async function demoZombie({events}) {
  const meta = [];
  DEBUG.val >= DEBUG.med && console.log(`DEMO Received events: ${JSON.stringify({events}, null, 2)}`);
  for( const event of events ) {
    meta.push(...(await handleEvent(event)));
  }
  messageId++;
  return {data:[], frameBuffer:[], meta, messageId};
}

async function handleEvent(event) {
  const meta = [];
  const {command} = event;
  if ( tab && !started.has(tab.targetId) ) {
    started.add(tab.targetId);
    meta.push(
      {
        treeUpdate: {
          open: await uberFetch(`https://${location.hostname}:8001/demo-landing`).then(resp => resp.text()),
          targetId: tab && tab.targetId,
          ...opts
        }
      }
    )
  }
  switch (command.name) {
    case "Target.createTarget": {
      tab = DemoTab();
      tabs.push(tab);
      const meta1 = {
        created: {
          targetId: tab.targetId
        }
      }
      const meta2 = {
        treeUpdate: {
          open: await uberFetch(`https://${location.hostname}:8001/demo-landing`).then(resp => resp.text()),
          targetId: tab.targetId,
          ...opts
        }
      };
      meta.push(meta1,meta2);
      break;
    }
    case "Target.activateTarget": {
      tab = tabs.find(({targetId}) => targetId == command.params.targetId); 
      break;
    }
    case "Demo.formSubmission": {
      let jres;
      try {
        jres = JSON.parse(event.result);
      } catch(e) {}
      if (!!jres && !!jres.browserUrl) {
        const {browserUrl} = jres;
        const meta1 = {
          topRedirect: {
            browserUrl,
            targetId: tab && tab.targetId
          }
        };
        await sleep(5000);
        meta.push(meta1);
      } else {
        const meta1 = {
          treeUpdate: {
            open: event.result,
            targetId: tab && tab.targetId,
            ...opts
          }
        };
        meta.push(meta1);
      }
      break;
    }
  }
  return meta;
}
