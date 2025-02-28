{
  const SIZE = false;
  const ARIA_FILL = 'a, button, [role="button"]';
  const ATTR_WHITELIST = new Set([
    'zig',
    'href', 'id', 'target', 'for', 'method', 'action', 'name', 'contenteditable', 'type', 'hidden', 'role', 'placeholder', 'value', 'title', 
    'selected', 'checked', 'aria-label', 'download', 'rowspan', 'colspan', 'cellpadding', 'cellspacing',
    'required', 'max', 'min', 'maxlength', 'size', 'pattern', 'inputmethod', 'novalidate', 'enctype', 'autocomplete', 
    'tabindex',
    'aria-hidden', 'open'
  ]);
  const EXEMPT = new Set([
    'select', 'option'
  ]);
  const MO_CONF = { attributes: true, subtree: true, childList: true };
  const DEFAULT_VALUE_EL = `input[type="submit"], input[type="reset"], input[type="button"]`;
  const FORM_CONTROL = `input, option, select, form, fieldset, legend, label, textarea, [contenteditable], optgroup, output`;
  const TABLE_ELEMENT = `table, thead, tbody, tr, th, td, col, colgroup, tfoot`;

  const NOSPLICE = `[aria-label], [role], ` + TABLE_ELEMENT;

  const DATAIDMAP = new Map();
  const RDATAIDMAP = new Map();
  const GZIG = new Map();
  const INVISIBLE = new Set();
  const sleep = ms => new Promise(res => setTimeout(res, ms));

  let installed = false;

  const MAX_GENERATIONS = 100;
  let generation = 0;

  let isFirstMutation = true;
  let lastKey = '';
  let lastData = '';
  let lastRoot;
  let lastTree;
  let Binding;
  let observer;

  let urlCalculator;

  self.lastRequest = {};

  say({msg:`Installing injections for appminifier`});

  if ( self == top ) {
    const sbInterval = setInterval(setupBinding, 20);
    setupBinding();
    function setupBinding() {
      const binding = self.instructZombie;
      if ( typeof binding == "function" ) {
        delete self.instructZombie;
        Binding = {
          send: msg => binding(JSON.stringify(msg)),
          onmessage: msg => say(msg)
        };
        Object.defineProperty(self, 'instructZombie', { get: () => Binding });
        Binding.send({bindingAttached:true});
        clearInterval(sbInterval);
      }
    }
  }

  function prepare(el) {
    if ( el.scrollIntoViewIfNeeded ) {
      el.scrollIntoViewIfNeeded(true);
    } else {
      el.scrollIntoView({block:'center'});
    }
  }

  self.addEventListener('click', e => {
    if ( self == top ) {
      reportClick(e);
    }
  });

  self.addEventListener('keypress', e => {
    if ( e.key == "Enter" ) {
      self.lastRequest.el = null;
    }
  }, {capture: true, passive: true});

  self.clearFocusedInputAndInsertValue = async (encodedValue) => {
    // should have strong focus check here, not just "supposed to be some focused element"
    // but supposed to be THIS PARTICULAR focussed element
    try {
      if ( ! document.activeElement ) throw new TypeError(`Supposed to be focused element`);
      const input = document.activeElement;
      const stringVal = decodeURIComponent(escape(atob(encodedValue)));
      input.value = "";
      //input.selectionStart = input.selectionEnd = input.value.length;
      await Binding.send({
        name: "Input.insertText",
        params: {
          text: stringVal 
        }
      });
      await Promise.resolve();
    } catch(e) {
      console.log(JSON.stringify({errorInCFIAIV:e+''}));
    }
  };

  self.getBoundingBox = async ({dataId, generation:gen}) => {
    const {
      pageXOffset:scrollX,
      pageYOffset:scrollY,
      document: {
        documentElement: {
          clientWidth: innerWidth,
          clientHeight: innerHeight
        }
      }
    } = self;
    self.lastRequest = {dataId, gen};
    const Gen = generation + "";
    const map = DATAIDMAP.get(gen);
    if ( map ) {
      const el = map.get(dataId);
      try {
        if ( el ) {
          self.lastRequest.el = el;
          prepare(el);
          await sleep(50);
          const {left:x,top:y,width,height} = el.getBoundingClientRect();
          // upgrade request to latest generation
          //console.log(JSON.stringify({gen,Gen,width}));
          if ( width == 0 && gen !== Gen ) {
            const newBox = await self.getBoundingBox({dataId,generation:Gen});
            //console.log(JSON.stringify({newBox}));
            return newBox;
          }
          const box = {boundingBox:{scrollX,scrollY,x,y,width,height,innerWidth,innerHeight},currentGeneration:Gen,requestGeneration:gen};
          //console.log(JSON.stringify(box));
          return box;
        }
      } catch(e) {
        console.log(JSON.stringify({err:e+''}));
        return {boundingBox:{error:true}};
      }
    } else console.log({msg:`Generation ${gen} expired`});
  };

  self.getDOMTree = (force = false) => {
    console.log(JSON.stringify({msg:`get dom tree requested`,force}));
    update(force);
  };

  install();

  async function install() {
    if ( top !== self ) return;

    if ( ! installed ) {
      self.addEventListener('load', install);
      document.addEventListener('domcontentloaded', install);
      installed = true;
    }

    if ( ! observer ) {
      await createObserver();
    }

    getDOMTree();
  }

  async function createObserver() {
    if ( document.documentElement ) {
      observer = new MutationObserver(updateOnMutation); 
      observer.observe(document.documentElement, MO_CONF);
    } 
  }

  async function updateOnMutation(a) {
    if ( isFirstMutation ) {
      isFirstMutation = false;
      update();
    } else {
      updateDiff(a);
    }
  }

  async function update(force) {
    if ( self !== top ) return;
    if ( document.body ) {
      nextGeneration();
      const {data,key,tree, root } = await filterMarkup(document.body);
      if ( data == undefined ) return;
      const hasChanged = data.length !== lastData.length || key !== lastKey;
      if ( force || hasChanged ) {
        lastRoot = root;
        lastTree = tree;
        lastKey = key;
        lastData = data;
        console.log(JSON.stringify({msg:`remote updates tree`}));
        s({length: data.length, open: data, targetId});
      }
    }
  }

  async function updateDiff(mutations, force = false) {
    if ( self !== top ) return;
    if ( document.body ) {
      nextGeneration();
      const {data,key,tree, root} = await filterMarkup(document.body);
      if ( data == undefined ) return;
      const hasChanged = data.length !== lastData.length || key !== lastKey;
      if ( force || hasChanged ) {
        lastKey = key;
        lastData = data;
        const diffs = await getDiffs({lastTree, tree, lastRoot});
        if ( diffs.length ) {
          lastRoot = root;
          lastTree = tree;
          const length = JSON.stringify({diffs}).length + '.' + generation + '.' + Math.random();
          console.log(JSON.stringify({treeDiff:{length, diffs, targetId}}));
        }
      }
    }
  }

  async function getDiffs({lastTree, tree, lastRoot}) {
    const deleted = new Set();
    const diffs = []; 
  
    let walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
    let nextNode;

    do {
      const node = walker.currentNode;

      const lastTreeHas = lastTree.has(node);
      const thisTreeHas = tree.has(node);

      const inserted = ! lastTreeHas && thisTreeHas;
      const removed = lastTreeHas && ! thisTreeHas;
      // const moved ???

      if ( inserted ) {
        const addedNode = tree.get(node);
        const hasParent = !! addedNode.parentElement;
        if ( ! hasParent ) {
          say({addedNode:{hasParent, outerHTML:node.cloneNode().outerHTML}});
        } else {
          const originalParent = tree.get(addedNode.parentElement);
          const lastTreeParent = lastTree.get(originalParent);
          if ( ! lastTreeParent || ! lastTreeParent.getAttribute ) {
            // we need to step up the tree until we find a last tree parent  
            // with a zig and add all the missing to the outerHTML
            // repoint the added node to match that, in other words
            // but we can get it from 'this tree parent' zig
            // in other words step up addedNode parent
          } else {
            let parentZig = lastTreeParent.getAttribute('zig');
            diffs.push({
              insert: {
                parentZig: lastTreeParent.getAttribute('zig'),    
                outerHTML: addedNode.outerHTML 
              }
            });
          }
        }
        nextNode = walker.nextSibling();
        if ( ! nextNode ) {
          // walk the subtree until we're out of it
          while(node.contains(walker.currentNode)) {
            nextNode = walker.nextNode();
            if ( ! nextNode ) break;
          }
        }
      } else if ( removed ) {
        const removedNode = lastTree.get(node);
        const hasParent = !! removedNode.parentElement;
        const hasGetAttribute = !! removedNode.getAttribute;
        if ( ! hasParent || ! hasGetAttribute ) {
          const n = node.cloneNode();
          say({removedNode1:{hasParent,hasGetAttribute, val:n.outerHTML||n.nodeValue}});
        } else {
          const zigToDelete = GZIG.get(removedNode) || removedNode.getAttribute('zig');
          deleted.add(zigToDelete);
          diffs.push({
            remove: { 
              parentZig: removedNode.parentElement.getAttribute('zig'),
              zig: zigToDelete
            }
          });
        }
        nextNode = walker.nextSibling();
        if ( ! nextNode ) {
          // walk the subtree until we're out of it
          while(node.contains(walker.currentNode)) {
            nextNode = walker.nextNode();
            if ( ! nextNode ) break;
          }
        }
      } else {
        nextNode = walker.nextNode();
      }
    } while (nextNode);

    
    if ( lastRoot ) {
      walker = document.createTreeWalker(lastRoot, NodeFilter.SHOW_ELEMENT);
      do {
        const node = walker.currentNode;
        const oNode = lastTree.get(node);
        const removed = !document.body.contains(oNode);
        const zig = GZIG.get(oNode) || node.getAttribute('zig');
        if ( deleted.has(zig) ) {
          nextNode = walker.nextSibling();
          if ( ! nextNode ) {
            // walk the subtree until we're out of it
            while(node.contains(walker.currentNode)) {
              nextNode = walker.nextNode();
              if ( ! nextNode ) break;
            }
          }
        } else if ( removed ) {
          const removedNode = node;
          const hasParent = !! removedNode.parentElement;
          const hasGetAttribute = !! removedNode.getAttribute;
          if ( ! hasParent || ! hasGetAttribute ) {
            const n = oNode.cloneNode();
            say({removedNode2:{hasParent,hasGetAttribute, val:n.outerHTML||n.nodeValue}});
          } else {
            deleted.add(zig);
            //const zigToDelete = removedNode.getAttribute('zig');
            const oParent = lastTree.get(removedNode.parentElement);
            const pZig = GZIG.get(oParent);
            diffs.push({
              remove: { 
                parentZig: pZig,
                // removedNode.parentElement.getAttribute('zig'),
                zig: zig // zigToDelete
              }, source: 'lastRoot-bodymissing'
            });
          }
          nextNode = walker.nextSibling();
          if ( ! nextNode ) {
            // walk the subtree until we're out of it
            while(node.contains(walker.currentNode)) {
              nextNode = walker.nextNode();
              if ( ! nextNode ) break;
            }
          }
        } else {
          nextNode = walker.nextNode();
        }
      } while (nextNode);
    }

    return diffs;
  }

  function nextGeneration() {
    if ( generation > MAX_GENERATIONS ) {
      // roll it over, this shouldn't cause a problem with the previous
      // generations effectively acting as a list of previous cache snapshots
      generation = 0;
    }
    generation++;
  }

  function FILLMAP(root) {
    INVISIBLE.clear();
    const map = new Map();
    const rmap = new Map();
    let id = 0;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
    do {
      const node = walker.currentNode;
      id++;
      map.set(id+'', node);
      rmap.set(node, id+'');
      const zig = `${id} ${generation}`;
      if ( EXEMPT.has(node.localName) ) {
        //console.log(`${node.localName} exmept from visibility check.`); 
      } else if ( !visible(node) ) {
        INVISIBLE.add(id);
      }
    } while(walker.nextNode())
    DATAIDMAP.set(generation+'', map);
    RDATAIDMAP.set(generation+'', rmap);
  }

  async function filterMarkup(originalRoot, nextId) {
    const tree = new Map();
    originalRoot.normalize();
    if ( originalRoot.nodeType == Node.TEXT_NODE ) return {
      data: originalRoot.nodeValue,
      key: originalRoot.nodeValue
    };

    const U = location.protocol + '//' + location.hostname;
    FILLMAP(originalRoot);
    let key = '';
    if ( nextId != undefined ) {
      nextId = nextId || 0;
      if ( ! Number.isInteger(nextId) ) {
        throw new TypeError(`Next id ${nextId} is not integer`);
      }
    } else {
      nextId = 0;
    }
    const toInsert = [];
    const toRemove = [];
    const toSplice = [];
    const root = originalRoot.cloneNode(true);
    buildTree({root, originalRoot, tree});
    let walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
    do {
      const node = walker.currentNode;
      nextId++;

      switch(node.localName) {
        case "head":
        case "script":
        case "noscript":
        case "link":
        case "style":
        case "br":
        case "meta":
          if ( ! INVISIBLE.has(nextId) ) {
            toRemove.push(node);
          }
          break;
        case "img":
        case "video":
        case "iframe":
        case "picture":
        case "audio":
        case "canvas":
        case "svg": {
          try {
            let f;
            const id = nextId;
            const g = generation;
            const role = node.getAttribute('role') || node.role;
            let name = node.localName == 'img' ? 'image' : node.localName;
            //name = (name.charAt(0).toUpperCase() + name.slice(1));
            if ( node.hasAttribute('alt')) {
              let text = role || name;
              const alt = node.getAttribute('alt');
              if ( !! alt && ! new RegExp(text, "i").test(alt) ) {
                text = `(${alt} ${text})`;
              } else { 
                text = `(${alt||text})`;
              }
              f = () => node.insertAdjacentHTML('beforeBegin', `<span ${role?`role=${role}`:''} zig="${i} ${g}">${text}</span>`);
            } else if ( node.hasAttribute('aria-label') ) {
              let text = role || name;
              const alt = node.getAttribute('aria-label');
              if ( !! alt && ! new RegExp(text, "i").test(alt) ) {
                text = `(${alt} ${text})`;
              } else { 
                text = `(${alt||text})`;
              }
              f = () => node.insertAdjacentHTML('beforeBegin', `<span ${role?`role=${role}`:''} zig="${id} ${g}">${text}</span>`);
            } else if ( node.hasAttribute('title') ) {
              let text = role || name;
              const alt = node.getAttribute('title');
              if ( !! alt && ! new RegExp(text, "i").test(alt) ) {
                text = `(${alt} ${text})`;
              } else { 
                text = `(${alt||text})`;
              }
              f = () => node.insertAdjacentHTML('beforeBegin', `<span ${role?`role=${role}`:''} zig="${id} ${g}">${text}</span>`);
            } else if ( node.querySelector('title') ) {
              let text = role || name;
              const alt = node.querySelector('title').textContent;
              if ( !! alt && ! new RegExp(text, "i").test(alt) ) {
                text = `(${alt} ${text})`;
              } else { 
                text = `(${alt||text})`;
              }
              f = () => node.insertAdjacentHTML('beforeBegin', `<span ${role?`role=${role}`:''} zig="${id} ${g}">${text}</span>`);
            }
            if ( f ) toInsert.push(f);
          } catch(e) { console.log(JSON.stringify({err:e+''})) }
          if ( ! INVISIBLE.has(nextId) ) {
            INVISIBLE.add(nextId);
            toRemove.push(node);
          }
          break;
        }
        case "li": {
          try {
            if (! node.querySelector(FORM_CONTROL) && ! node.querySelector('a') && node.innerText.trim().length == 0) {
              INVISIBLE.add(nextId);
              toRemove.push(node);
            }
          } catch(e) {
            console.info(e);
          }
        }
        default: {
          if ( node.attributes ) {
            Array.from(node.attributes).forEach(x => !ATTR_WHITELIST.has(x.name) && node.removeAttribute(x.name)); 
            // we explicitly set them to get FULL href
            if ( node.hasAttribute('href') || node.href ) {
              node.setAttribute('href', node.href);
            }
            if ( node.hasAttribute('action') || node.action ) {
              node.setAttribute('action', getOriginURL(node.getAttribute('action')));
              if ( node.action.startsWith('http:') ) {
                // this gets rid of a mixed content warning
                node.removeAttribute('action');
              }
            }
            if ( node.hasAttribute('value') || node.value ) {
              node.setAttribute('value', node.value);
            }
            if ( node.localName == 'input' ) {
              node.autocomplete = "off";
            }
            if ( node.selected ) {
              node.setAttribute('selected', node.selected);
            }
            if ( node.checked ) {
              node.setAttribute('checked', node.checked);
            }
          }
          break;
        }
      }

      const oNode = tree.get(node);
      const existingZig = GZIG.get(oNode);
      if ( existingZig ) {
        node.setAttribute('zig', existingZig);
      } else {
        const zig = `${nextId} ${generation}`;
        GZIG.set(oNode, zig);
        GZIG.set(zig, oNode);
        node.setAttribute('zig', zig);
      }


      if ( INVISIBLE.has(nextId) || node.hasAttribute('hidden') || 
          node.matches('[aria-hidden="true"]')) {
        toRemove.push(node);
      } else {
        if ( node.hasAttribute('placeholder') && node.placeholder.length ) continue;
        else if ( node.matches('textarea, [contenteditable], input, select, br, hr') ) continue;
        else if ( ! node.innerText || ! node.innerText.trim().length ) {
          try {
            let f;
            const g = generation;
            const role = node.getAttribute('role') || node.role;
            if ( node.hasAttribute('alt')) {
              f = () => node.insertAdjacentHTML('afterBegin', `<span ${role?`role=${role}`:''} zig="${nextId++} ${g}">${node.getAttribute('alt')}</span>`);
            } else if ( node.hasAttribute('aria-label') ) {
              f = () => node.insertAdjacentHTML('afterBegin', `<span ${role?`role=${role}`:''} zig="${nextId++} ${g}">${node.getAttribute('aria-label')}</span>`);
            }
            if ( f ) toInsert.push(f);
          } catch(e) { console.log(JSON.stringify({err:e+''})) }
        }
      }
    } while(walker.nextNode());
    for ( const f of toInsert ) { try {
        f();
      } catch(e) {}
    }
    for ( const node of toRemove ) {
      try {
        node.remove();
        const oNode = tree.get(node);
        tree.delete(node);
        tree.delete(oNode);
      } catch(e) {}
    }
    toRemove.length = 0;
    walker = document.createTreeWalker(root, NodeFilter.SHOW_ALL);
    do {
      const node = walker.currentNode;
      if ( node.nodeType == Node.ELEMENT_NODE ) {
        if ( node.localName == 'a' ) {
          const a = node;
          if ( a.hasAttribute('download') && a.href ) {
            a.target = "_blank";
          } else if ( a.href && a.href.match(/^(mailto|tel)/) ) {
            a.target = "_blank";
          }
        }
        const zeroText = !node.innerText || node.innerText.trim().length == 0;
        if ( node.matches(ARIA_FILL) && zeroText ) {
          const titleEl = node.hasAttribute('title') ? node : node.querySelector('[title]');
          const ariaLabelEl = node.hasAttribute('aria-label') ? node : node.querySelector('[aria-label]');
          let text = '';
          if ( titleEl ) {
            text = titleEl.getAttribute('title');
          } else if ( ariaLabelEl ) {
            text = ariaLabelEl.getAttribute('aria-label');
          } else if ( node.localName == 'a' && node.href ) {
            let url = node.href + '';
            if ( url.startsWith(U) ) {
              text = url.slice(U.length);
              if ( text == '/' ) text = 'home';
            } else if (url.startsWith('mailto') ) {
              text = 'Email';
            } else if (url.startsWith('tel') ) {
              text = 'Telephone';
            } else {
              try {
                url = new URL(url);
                text = url.hostname;
              } catch(e) {
                // console.warn("Bad url", e, url);
                text = url;
              }
            }
            text = text.slice(0,22);
          } 
          if ( text ) {
            node.insertAdjacentText('afterBegin', text);
          }
        }
        if ( (node.localName == 'input' || node.localName == 'textarea') && ! node.placeholder ) {
          let text = node.getAttribute('aria-label') || node.getAttribute('title') || '';
          node.placeholder = text;
        }
        try {
          const nodeHasNoTextContent = !node.innerText || node.innerText.trim().length == 0;
          const nodeIsNotFormControl = ! isFormControl(node);
          const nodeIsNotTableElement = ! node.matches(TABLE_ELEMENT);
          const nodeHasNoRole = ! ( node.matches('[role]') && node.matches('[aria-label], [data-tooltip]'));
          const nodeHasNoValueContent = (node.value + '').trim().length == 0;
          const nodeAddsNothing = nodeHasNoTextContent && nodeIsNotFormControl && nodeIsNotTableElement && nodeHasNoRole && nodeHasNoValueContent;
          if ( nodeAddsNothing ) {
            toRemove.push(node);
          } else if ( isUselessContainer(node) ) {
            toSplice.unshift(node);
          } else {
            key += node.localName;
          }
        } catch(e) { console.info(e) }
      } else if ( node.nodeType == Node.COMMENT_NODE ) {
        toRemove.push(node);
      } else if ( node.nodeType == Node.TEXT_NODE ) {
        key += node.nodeValue;
        if ( node.nodeValue.trim().length == 0 ) {
          toRemove.push(node);
        }
      }
    }while(walker.nextNode()); 
    for ( const node of toRemove ) {
      try {
        node.remove();
        const oNode = tree.get(node);
        tree.delete(node);
        tree.delete(oNode);
      } catch(e) {}
    }
    for ( const node of toSplice ) {
      try {
        spliceContainer(node, tree);
      } catch(e) {}
    }
    if ( SIZE ) {
      const originalSize = originalRoot.ownerDocument.documentElement.outerHTML.length;
      const newSize = root.innerHTML.length;
      console.log(`Reduction: ${(newSize/originalSize*100).toFixed(3)}% of original`);
    }
    key = key.replace(/\s+/g, '');
    const data = root.outerHTML || root.nodeValue;
    if ( data == undefined || data == null ) {
      say({emptyData:{root:root.localName,roots:root+''}});
    }
    return { key, data, nextId, tree, root };
  }

  function buildTree({root, originalRoot, tree}) {
    const oWalker = document.createTreeWalker(originalRoot, NodeFilter.SHOW_ALL);
    const cloneWalker = document.createTreeWalker(root, NodeFilter.SHOW_ALL);
    let hasNextPair;
    do {
      tree.set(oWalker.currentNode, cloneWalker.currentNode);
      tree.set(cloneWalker.currentNode, oWalker.currentNode);
      const oNext = !! oWalker.nextNode();
      const cloneNext = !! cloneWalker.nextNode();
      hasNextPair = oNext && cloneNext;
    } while(hasNextPair);
  }

  function hasDefaultValue(node) {
    return node.matches && node.matches(DEFAULT_VALUE_EL);
  }

  function isFormControl(node) {
    return node.matches && node.matches(FORM_CONTROL);
  }

  function s(o) {
    console.log(JSON.stringify({treeUpdate:o}));
  }

  function say(o) {
    console.log(JSON.stringify(o));
  }

  function visible(el) { 
    if (el.nodeType == Node.TEXT_NODE ) return true;
    return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length); 
  }

  function reportClick(e) {
    const {clientX,clientY,type, target} = e;
    const node = target.cloneNode().outerHTML.slice(0,50);
    const lastRequestEl = self.lastRequest.el;
    const {dataId, generation} = lastRequest;
    const intendedLink = !! lastRequestEl && lastRequestEl.closest('a');
    let hitsTarget, intendedHref, clickModifiers, lastRequestHTML;

    if ( intendedLink ) {
      hitsTarget = [...e.composedPath()].includes(intendedLink);
      hitsTarget = hitsTarget && withinViewport(intendedLink);
      if ( ! hitsTarget ) {
        intendedHref = intendedLink.href;
        clickModifiers = encodeModifiers(e);
        e.preventDefault();
        e.stopPropagation();
      }
    } else if ( ! lastRequestEl ) {
      hitsTarget = true;
    } else {
      hitsTarget = [...e.composedPath()].includes(lastRequestEl);
      lastRequestHTML = lastRequestEl.cloneNode().outerHTML.slice(0,50);
    }

    if ( ! hitsTarget ) {
      //e.preventDefault();
      //e.stopPropagation();
    }

    console.log(JSON.stringify({click:{clientX,clientY,type,node,hitsTarget, intendedHref, clickModifiers, dataId, generation, lastRequestHTML}}));
  }

  function encodeModifiers(originalEvent) {
    let modifiers = 0;
    if (originalEvent.altKey ) {
      modifiers += 1;
    }
    if (originalEvent.ctrlKey || originalEvent.metaKey) {
      modifiers += 2;
    }
    if (originalEvent.metaKey ) {
      modifiers += 4;
    } 
    if (originalEvent.shiftKey ) {
      modifiers += 8;
    }

    return modifiers;
  }

  function withinViewport(el) {
    const W = innerWidth;
    const H = innerHeight;
    const {left:x,top:y,width,height} = el.getBoundingClientRect();
    const inX = x >= 0 && x < W || x + width > 0;
    const inY = y >=0 && y < H || y + height > 0;
    return inX && inY;
  }

  function isUselessContainer(el) {
    return false;
    return el.childNodes.length == 1 && el.parentNode.childNodes.length == 1 && ! el.matches(NOSPLICE);
  }

  function spliceContainer(el, tree) {
    const singleChild = el.childNodes[0];
    if ( singleChild ) {
      el.parentNode.insertBefore(singleChild, el);
      el.remove();
      const oNode = tree.get(el);
      tree.delete(el);
      tree.delete(oNode);
    }
  }

  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      const later = () => {
        timeout = null;
        func.apply(this, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    }
  }

  function getOriginURL(possiblyPartialURL) {
    if ( ! urlCalculator ) {
      urlCalculator = document.createElement('a');
    }
    urlCalculator.setAttribute('href', possiblyPartialURL);
    return urlCalculator.href;
  }
}
