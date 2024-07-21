import {APP_ROOT} from './common.js';
import * as Site from './site.js';
import * as Fs from 'fs';
import * as Path from 'path';

// site routes as a "sitemap" style tree and render funcs
  const STATIC_FILE_PATHS = {
    'index.html': Site.Landing.default,
    'pages': {
      'about-browserbox.html': Site.Pages.About,
      'training-and-tutorials.html': Site.Pages.Training,
      'remote-cloud-browser-service.html': Site.Pages.CloudBrowsers,
      'per-seat-subscription-pricing.html': Site.Pages.Pricing,
      'five-elements-technology-reading-room.html': Site.Pages.FiveElements,
      'tutorials-and-support-reading-room.html': Site.Pages.Training,
      'document-reading-room': {
        'history-of-browser-gap.html': Site.Pages.DRR.History,
        'threats-facing-the-web-user.html': Site.Pages.DRR.Threats,
        'browser-gap-an-overview-of-features.html': Site.Pages.DRR.Features,
      },
      'legal-room': {
        'terms.html': Site.Pages.Legal.Terms,
        'privacy.html': Site.Pages.Legal.Privacy,
        'security-responsible-vulnerability-disclosure-policy.html': Site.Pages.Legal.Security
      },
      'case-study': {
        'uk-corporate-website-malware-attack.html': Site.Pages.CaseStudy.UKCorpWeb,
      }
    },
    '.well-known': {
      'security.txt': Site.SecTxt.securityTxt
    }
  };

// the render state (including ref boilerplate wrapper function)
  const State = {
    boilerplate: {
      Wrap: Site.Boilerplate.Wrap
    }
  };

renderAll({state:State});

setTimeout(() => 1, 1<<31);

async function renderAll({state}) {
  console.log(`Rendering all static file paths...`);
  for ( const [pathList, renderFunc] of enumerateTree(STATIC_FILE_PATHS) ) {
    await render({state, renderFunc, pathList});
  }
  console.log(`Done rendering!`);
}

async function render({state, renderFunc, pathList}) {
  const path = Path.join(APP_ROOT, ...pathList);
  console.log(`Writing static file ${path}`);
  await Fs.promises.writeFile(path, renderFunc(state));
  console.log(`Wrote ${path}!`);
}

// helpers
  /**
    *
    * Treats an object as a tree
    * Enumerates all leaves as pairs [pathList, value]
    *
    **/

  function *enumerateTree(tree) {
    const queue = [{path: [], value: tree}];

    while(queue.length) {
      const current = queue.shift();
      
      if ( isObject(current.value) ) {
        const entries = Object
          .entries(current.value)
          .map(([name,value]) => ({path:current.path.concat(name), value}))
        queue.push(...entries);
      }  else {
        yield [current.path, current.value];
      }
    }
  }

  function isObject(val) {
    return ( typeof val == "object" && val != null );
  }
