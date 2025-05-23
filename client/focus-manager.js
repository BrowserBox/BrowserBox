// focus-manager.js
import { debugLog, focusLog, newLog, DEBUG } from './log.js';
import { renderedBoxesBySession } from './baby-jaguar.js';

export class FocusManager {
  constructor(getTabState, getBrowserState) {
    this.getTabState = getTabState;
    this.getBrowserState = getBrowserState;
    this.getCurrentTabState = () => {
      return this.getTabState(this.getBrowserState().currentSessionId);
    };
    this.focusState = new Map();
    this.focusedElement = null;
    this.previousFocusedElement = null;
    this.currentFocusIndex = 0;
    this.tabbableCached = false;
    this.tabbableCache = [];
    this.restoredSessions = new Set(); // Track restored sessions
  }

  saveFocusState() {
    const sessionId = this.getBrowserState().currentSessionId;
    const { focusedElement, previousFocusedElement } = this;

    if (!focusedElement) {
      debugLog(`No focused element, clearing focus state for sessionId: ${sessionId}`);
      focusLog('clear_state', sessionId, { focusedElement, previousFocusedElement }, (new Error).stack);
      this.focusState.delete(sessionId);
      this.restoredSessions.delete(sessionId); // Clear restoration flag
      return;
    }

    // Only save if it's a page content element (clickable or input)
    if (this.isPageContentElement(focusedElement)) {
      const focusState = { focusedElement, previousFocusedElement };
      debugLog(`Saving focus state for sessionId: ${sessionId}, focusedElement: ${focusedElement}`);
      focusLog('save_state', sessionId, focusState, (new Error).stack);
      this.focusState.set(sessionId, focusState);
    } else {
      debugLog(`Not saving UI element focus: ${focusedElement} for sessionId: ${sessionId}`);
    }
  }

  restoreFocusState(setFocus) {
    const sessionId = this.getBrowserState().currentSessionId;
    const focusState = this.focusState.get(sessionId);
    debugLog(`Restoring focus state for sessionId: ${sessionId}, found state: ${focusState ? JSON.stringify(focusState) : 'none'}`);
    focusLog('restore_attempt', sessionId, { state: focusState }, (new Error).stack);

    if (!focusState || !focusState.focusedElement) {
      debugLog(`No valid focus state found for sessionId: ${sessionId}`);
      focusLog('restore_failed', sessionId, { reason: 'no_state' }, (new Error).stack);
      this.restoredSessions.delete(sessionId);
      return false;
    }

    const restoredFocusedElement = focusState.focusedElement;
    const tabbable = this.computeTabbableElements();
    let elementToFocus = tabbable.find(el => {
      const elId = el.backendNodeId ? `${el.type}:${el.backendNodeId}` : `${el.type}:${el.id || el.index}`;
      return elId === restoredFocusedElement;
    });

    if (!elementToFocus) {
      debugLog(`Element ${restoredFocusedElement} no longer exists`);
      focusLog('restore_failed', sessionId, {
        reason: 'invalid_element',
        element: restoredFocusedElement
      }, (new Error).stack);
      this.focusState.delete(sessionId);
      this.restoredSessions.delete(sessionId);
      return false;
    }

    this.tabbableCached = false;
    this.focusedElement = restoredFocusedElement;
    this.previousFocusedElement = focusState.previousFocusedElement;
    this.currentFocusIndex = tabbable.findIndex(el => {
      const elId = el.backendNodeId ? `${el.type}:${el.backendNodeId}` : `${el.type}:${el.id || el.index}`;
      return elId === restoredFocusedElement;
    });

    debugLog(`Restoring focus to ${restoredFocusedElement}`);
    focusLog('restore_success', sessionId, { element: restoredFocusedElement }, (new Error).stack);
    setFocus(elementToFocus);
    this.restoredSessions.add(sessionId); // Mark as restored
    return true;
  }

  computeTabbableElements() {
    if (this.tabbableCached) return this.tabbableCache;
    const browserState = this.getBrowserState();
    const hasClickableDescendants = this.#hasClickableDescendants.bind(this);
    const sessionId = browserState.currentSessionId;
    const tabState = this.getTabState(sessionId);
    const renderedBoxes = renderedBoxesBySession.get(sessionId) || [];
    const tabbable = [];

    browserState.targets.forEach((tab, index) => {
      const x = 1 + index * tabState.tabWidth;
      tabbable.push({ type: 'tab', index, x, y: 1, targetId: tab.targetId });
    });
    tabbable.push({ type: 'newTab', x: tabState.termWidth - tabState.NEW_TAB_WIDTH + 1, y: 1 });
    tabbable.push({ type: 'back', x: 2, y: tabState.TAB_HEIGHT + 2 });
    tabbable.push({ type: 'forward', x: tabState.BACK_WIDTH + 2, y: tabState.TAB_HEIGHT + 2 });
    tabbable.push({ type: 'address', x: tabState.BACK_WIDTH + tabState.FORWARD_WIDTH + 2, y: tabState.TAB_HEIGHT + 2 });
    tabbable.push({ type: 'go', x: tabState.termWidth - tabState.GO_WIDTH, y: tabState.TAB_HEIGHT + 2 });

    if (!tabState || !tabState.nodes || !tabState.layoutToNode || !tabState.nodeToParent) {
      debugLog('Missing state or layout data');
      focusLog('compute_tabbable_failed', sessionId, { reason: 'missing_state' }, (new Error).stack);
      return tabbable;
    }

    debugLog('Rendered Boxes Count:', renderedBoxes.length);
    focusLog('compute_tabbable_boxes', null, {
      boxCount: renderedBoxes.length,
      boxes: renderedBoxes.map(b => ({
        backendNodeId: b.backendNodeId,
        nodeIndex: b.nodeIndex,
        text: b.text || '',
        isClickable: b.isClickable,
        type: b.type,
        ancestorType: b.ancestorType
      }))
    }, (new Error).stack);

    const elementsByParentId = new Map();
    const seenBackendNodeIds = new Set();
    renderedBoxes.forEach(box => {
      if (!box.isClickable && box.type !== 'input' && box.ancestorType !== 'button') return;

      let parentBackendNodeId = box.backendNodeId;
      let parentNodeIndex = box.nodeIndex;
      let currentNodeIndex = box.nodeIndex;
      const nodePath = [currentNodeIndex];

      while (currentNodeIndex !== -1 && currentNodeIndex !== undefined) {
        if (tabState.nodes.isClickable && tabState.nodes.isClickable.index.includes(currentNodeIndex)) {
          parentBackendNodeId = tabState.nodes.backendNodeId[currentNodeIndex];
          parentNodeIndex = currentNodeIndex;
          break;
        }
        currentNodeIndex = tabState.nodeToParent.get(currentNodeIndex);
        nodePath.push(currentNodeIndex);
      }

      focusLog('compute_tabbable_node', null, {
        boxBackendNodeId: box.backendNodeId,
        parentBackendNodeId,
        nodeIndex: box.nodeIndex,
        parentNodeIndex,
        nodePath,
        isClickable: tabState.nodes.isClickable?.index.includes(parentNodeIndex),
        boxText: box.text?.slice(0, 50)
      }, (new Error).stack);

      const nodeNameIdx = tabState.nodes.nodeName[parentNodeIndex];
      const nodeName = nodeNameIdx >= 0 ? tabState.strings[nodeNameIdx] : '';
      if (nodeName === '#document' || tabState.nodes.nodeType[parentNodeIndex] === 9) {
        return;
      }

      {
        if (DEBUG && box.type === 'input') {
          if (seenBackendNodeIds.has(parentBackendNodeId)) {
            DEBUG && newLog(`Skipping input due to duplicate backendNodeId: ${parentBackendNodeId}`);
          } else {
            const isButton = box.ancestorType === 'button';
            if (!isButton && hasClickableDescendants(parentNodeIndex, tabState)) {
              DEBUG && newLog(`Skipping input due to clickable descendants: backendNodeId=${parentBackendNodeId}, parentNodeIndex=${parentNodeIndex}`);
            } else {
              DEBUG && newLog(`Adding input to elementsByParentId: backendNodeId=${parentBackendNodeId}`);
            }
          }
        }
      }

      const isButton = box.ancestorType === 'button';
      if (!isButton && hasClickableDescendants(parentNodeIndex, tabState)) {
        return;
      }

      if (seenBackendNodeIds.has(parentBackendNodeId)) {
        debugLog(`Duplicate backendNodeId detected: ${parentBackendNodeId}`);
        focusLog('compute_tabbable_duplicate', null, { backendNodeId: parentBackendNodeId }, (new Error).stack);
      }
      seenBackendNodeIds.add(parentBackendNodeId);

      if (!elementsByParentId.has(parentBackendNodeId)) {
        elementsByParentId.set(parentBackendNodeId, {
          backendNodeId: parentBackendNodeId,
          type: box.type === 'input' ? 'input' : 'clickable',
          boxes: [],
          text: '',
          ancestorType: box.ancestorType,
          minX: box.termX,
          maxX: box.termX + box.termWidth - 1,
          minY: box.termY,
          maxY: box.termY,
        });
      }

      const elem = elementsByParentId.get(parentBackendNodeId);
      elem.boxes.push(box);
      elem.text += (elem.text ? ' ' : '') + box.text;
      elem.minX = Math.min(elem.minX, box.termX);
      elem.maxX = Math.max(elem.maxX, box.termX + box.termWidth - 1);
      elem.minY = Math.min(elem.minY, box.termY);
      elem.maxY = Math.max(elem.maxY, box.termY);
    });

    elementsByParentId.forEach(elem => {
      tabbable.push({
        type: elem.type,
        backendNodeId: elem.backendNodeId,
        x: elem.minX,
        y: elem.minY,
        width: elem.maxX - elem.minX + 1,
        height: elem.maxY - elem.minY + 1,
        text: elem.text,
        ancestorType: elem.ancestorType,
        boxes: elem.boxes,
      });
    });

    debugLog('Final Tabbable Elements Count:', tabbable.length);
    focusLog('compute_tabbable_elements', null, {
      count: tabbable.length,
      elements: tabbable.map(el => ({
        type: el.type,
        id: el.backendNodeId || el.targetId || el.type,
        text: el.text || ''
      }))
    }, (new Error).stack);
    this.tabbableCache = tabbable.sort((a, b) => a.y - b.y || a.x - b.x);
    this.tabbableCached = true;
    return this.tabbableCache;
  }

  #hasClickableDescendants(nodeIdx, tabState) {
    const descendants = [];
    const collectDescendants = (idx) => {
      tabState.nodeToParent.forEach((parentIdx, childIdx) => {
        if (parentIdx === idx) {
          descendants.push(childIdx);
          collectDescendants(childIdx);
        }
      });
    };
    collectDescendants(nodeIdx);

    // Filter out #text nodes (nodeType: 3)
    const clickableDescendants = descendants.filter(idx => {
      const isClickable = tabState.nodes.isClickable?.index.includes(idx);
      const nodeType = tabState.nodes.nodeType[idx];
      return isClickable && nodeType !== 3;
    });
    const trulyHas = clickableDescendants.length > 0;

    if (DEBUG && trulyHas) {
      const sessionId = this.getBrowserState().currentSessionId;
      const renderedBoxes = renderedBoxesBySession.get(sessionId) || [];

      const descendantDetails = clickableDescendants.map(idx => {
        const nodeNameIdx = tabState.nodes.nodeName[idx];
        const nodeName = nodeNameIdx >= 0 ? tabState.strings[nodeNameIdx] : '';
        const backendNodeId = tabState.nodes.backendNodeId[idx] || 'unknown';

        // Get innerText from renderedBoxes or nodes.children
        const box = renderedBoxes.find(b => b.backendNodeId === backendNodeId);
        let innerText = box?.text || '';
        if (!innerText && tabState.nodes.children?.[idx]) {
          innerText = tabState.nodes.children[idx].map(childIdx => {
            const childTextIdx = tabState.nodes.nodeValue?.[childIdx];
            return childTextIdx >= 0 ? tabState.strings[childTextIdx] : '';
          }).join(' ').trim();
        }

        // Get attributes
        const attributes = tabState.nodes.attributes?.[idx]?.reduce((acc, attrIdx, i, arr) => {
          if (i % 2 === 0 && attrIdx >= 0 && arr[i + 1] >= 0) {
            acc[tabState.strings[attrIdx]] = tabState.strings[arr[i + 1]];
          }
          return acc;
        }, {}) || {};

        return {
          nodeIdx: idx,
          backendNodeId,
          nodeName,
          innerText,
          attributes,
          isClickable: tabState.nodes.isClickable?.index.includes(idx),
          nodeType: tabState.nodes.nodeType[idx],
          termX: box?.termX || null,
          termY: box?.termY || null,
          termWidth: box?.termWidth || null,
          termHeight: box?.termHeight || null
        };
      });

      DEBUG && newLog(`Node ${nodeIdx} has clickable descendants`, JSON.stringify(descendantDetails, null, 2));
    }

    return trulyHas;
  }

  isPageContentElement(element) {
    return element && (element.startsWith('input:') || element.startsWith('clickable:'));
  }

  isBrowserUIElement(element) {
    return (
      element &&
      (element.startsWith('tabs:') ||
        element === 'newTab' ||
        element === 'back' ||
        element === 'forward' ||
        element === 'address' ||
        element === 'go')
    );
  }

  focusNextElement(setFocus) {
    const sessionId = this.getBrowserState().currentSessionId;
    // Only attempt restore if not yet restored for this session
    if (!this.restoredSessions.has(sessionId)) {
      const restored = this.restoreFocusState(setFocus);
      if (restored) {
        debugLog(`Focus restored, skipping cycle for sessionId: ${sessionId}`);
        return;
      }
    }

    const tabbable = this.computeTabbableElements();
    if (!tabbable.length) {
      focusLog('focus_next_failed', sessionId, { reason: 'no_tabbable_elements' }, (new Error).stack);
      return;
    }

    this.currentFocusIndex = (this.currentFocusIndex + 1) % tabbable.length;
    const elementToFocus = tabbable[this.currentFocusIndex];
    const elementId = elementToFocus.backendNodeId
      ? `${elementToFocus.type}:${elementToFocus.backendNodeId}`
      : `${elementToFocus.type}:${elementToFocus.id || elementToFocus.index}`;
    focusLog('focus_next', sessionId, {
      from: this.focusedElement,
      to: elementId,
      index: this.currentFocusIndex
    }, (new Error).stack);
    //DEBUG && newLog(elementToFocus);
    setFocus(elementToFocus);
  }

  focusPreviousElement(setFocus) {
    const sessionId = this.getBrowserState().currentSessionId;
    // Only attempt restore if not yet restored for this session
    if (!this.restoredSessions.has(sessionId)) {
      const restored = this.restoreFocusState(setFocus);
      if (restored) {
        debugLog(`Focus restored, skipping cycle for sessionId: ${sessionId}`);
        return;
      }
    }

    const tabbable = this.computeTabbableElements();
    if (!tabbable.length) {
      focusLog('focus_previous_failed', sessionId, { reason: 'no_tabbable_elements' }, (new Error).stack);
      return;
    }

    this.currentFocusIndex = (this.currentFocusIndex - 1 + tabbable.length) % tabbable.length;
    const elementToFocus = tabbable[this.currentFocusIndex];
    const elementId = elementToFocus.backendNodeId
      ? `${elementToFocus.type}:${elementToFocus.backendNodeId}`
      : `${elementToFocus.type}:${elementToFocus.id || elementToFocus.index}`;
    focusLog('focus_previous', sessionId, {
      from: this.focusedElement,
      to: elementId,
      index: this.currentFocusIndex
    }, (new Error).stack);
    setFocus(elementToFocus);
  }

  focusNearestInRow(direction, setFocus, options) {
    const tabbable = this.computeTabbableElements();
    if (!tabbable.length) {
      focusLog('focus_nearest_failed', null, { reason: 'no_tabbable_elements', direction }, (new Error).stack);
      return;
    }

    let current;
    if (this.focusedElement.startsWith('tabs:')) {
      current = tabbable.find(el => el.type === 'tab' && `tabs:${el.targetId}` === this.focusedElement) || tabbable[0];
    } else if (this.focusedElement === 'newTab') {
      current = tabbable.find(el => el.type === 'newTab');
    } else if (this.focusedElement.startsWith('input:')) {
      const id = this.focusedElement.split(':')[1];
      current = tabbable.find(el => el.type === 'input' && el.backendNodeId == id);
    } else if (this.focusedElement.startsWith('clickable:')) {
      const id = this.focusedElement.split(':')[1];
      current = tabbable.find(el => el.type === 'clickable' && el.backendNodeId == id);
    } else {
      current = tabbable.find(el => el.type === this.focusedElement) || tabbable[0];
    }
    if (!current) {
      focusLog('focus_nearest_failed', null, { reason: 'no_current_element', direction, focusedElement: this.focusedElement }, (new Error).stack);
      return;
    }

    const currentY = current.y;
    const currentCenterX = current.x + (current.width || options.tabWidth) / 2;

    if (direction === 'down' && currentY === 1) {
      const omniboxElements = tabbable.filter(el => el.y === options.TAB_HEIGHT + 2);
      if (omniboxElements.length) {
        const nearest = omniboxElements.reduce((best, el) => {
          const elCenterX = el.x + (el.width || options.BACK_WIDTH) / 2;
          const bestCenterX = best.x + (best.width || options.BACK_WIDTH) / 2;
          return Math.abs(elCenterX - currentCenterX) < Math.abs(bestCenterX - currentCenterX) ? el : best;
        }, omniboxElements[0]);
        this.currentFocusIndex = tabbable.findIndex(el => el === nearest);
        focusLog('focus_nearest', null, {
          direction,
          from: this.focusedElement,
          to: `${nearest.type}:${nearest.backendNodeId || nearest.targetId || nearest.type}`,
          index: this.currentFocusIndex
        }, (new Error).stack);
        setFocus(nearest);
        return;
      }
    } else if (direction === 'up' && currentY === options.TAB_HEIGHT + 2) {
      const tabElements = tabbable.filter(el => el.y === 1);
      if (tabElements.length) {
        const nearest = tabElements.reduce((best, el) => {
          const elCenterX = el.x + (el.width || options.tabWidth) / 2;
          const bestCenterX = best.x + (best.width || options.tabWidth) / 2;
          return Math.abs(elCenterX - currentCenterX) < Math.abs(bestCenterX - currentCenterX) ? el : best;
        }, tabElements[0]);
        this.currentFocusIndex = tabbable.findIndex(el => el === nearest);
        focusLog('focus_nearest', null, {
          direction,
          from: this.focusedElement,
          to: `${nearest.type}:${nearest.backendNodeId || nearest.targetId || nearest.type}`,
          index: this.currentFocusIndex
        }, (new Error).stack);
        setFocus(nearest);
        return;
      }
    }

    const targetY = direction === 'down' ? currentY + 1 : currentY - 1;
    let candidates = tabbable.filter(el => el.y === targetY);

    if (!candidates.length) {
      candidates = tabbable.filter(el => direction === 'down' ? el.y > currentY : el.y < currentY);
      if (!candidates.length) {
        focusLog('focus_nearest_failed', null, { reason: 'no_candidates', direction, currentY }, (new Error).stack);
        return;
      }
      const nextRowY = direction === 'down'
        ? Math.min(...candidates.map(el => el.y))
        : Math.max(...candidates.map(el => el.y));
      candidates = tabbable.filter(el => el.y === nextRowY);
    }

    const nearest = candidates.reduce((best, el) => {
      const elCenterX = el.x + (el.width || options.tabWidth) / 2;
      const bestCenterX = best.x + (best.width || options.tabWidth) / 2;
      return Math.abs(elCenterX - currentCenterX) < Math.abs(bestCenterX - currentCenterX) ? el : best;
    }, candidates[0]);

    this.currentFocusIndex = tabbable.findIndex(el => el === nearest);
    focusLog('focus_nearest', null, {
      direction,
      from: this.focusedElement,
      to: `${nearest.type}:${nearest.backendNodeId || nearest.targetId || nearest.type}`,
      index: this.currentFocusIndex
    }, (new Error).stack);
    setFocus(nearest);
  }

  getFocusedElement() {
    return this.focusedElement;
  }

  getPreviousFocusedElement() {
    return this.previousFocusedElement;
  }

  setFocusedElement(element) {
    focusLog('set_focus', null, { from: this.focusedElement, to: element }, (new Error).stack);
    this.focusedElement = element;
  }

  setPreviousFocusedElement(element) {
    focusLog('set_previous_focus', null, { from: this.previousFocusedElement, to: element }, (new Error).stack);
    this.previousFocusedElement = element;
  }
}
