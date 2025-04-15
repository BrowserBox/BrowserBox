// focus-manager.js
import { debugLog, focusLog } from './log.js';

// focus-manager.js
export class FocusManager {
  constructor(getTabState, getBrowserState) {
    this.getTabState = getTabState;
    this.getBrowserState = getBrowserState;
    this.focusState = new Map();
    this.focusedElement = null;
    this.previousFocusedElement = null;
    this.currentFocusIndex = 0;
    this.tabbableCached = false;
    this.tabbableCache = [];
  }

  saveFocusState() {
    const sessionId = this.getBrowserState().currentSessionId;
    const tabState = this.getTabState(sessionId);
    const { focusedElement, previousFocusedElement } = this;

    if (!focusedElement || !this.isPageContentElement(focusedElement)) {
      debugLog(`Clearing focus state for sessionId: ${sessionId}, focusedElement: ${focusedElement}`);
      focusLog('clear_state', sessionId, { focusedElement, previousFocusedElement }, (new Error).stack);
      this.focusState.delete(sessionId);
      return;
    }

    const focusState = { focusedElement, previousFocusedElement };
    debugLog(`Saving focus state for sessionId: ${sessionId}, focusedElement: ${focusedElement}`);
    focusLog('save_state', sessionId, focusState, (new Error).stack);
    this.focusState.set(sessionId, focusState);
  }

  restoreFocusState(setFocus) {
    const sessionId = this.getBrowserState().currentSessionId;
    const focusState = this.focusState.get(sessionId);
    debugLog(`Restoring focus state for sessionId: ${sessionId}, found state: ${focusState ? JSON.stringify(focusState) : 'none'}`);
    focusLog('restore_attempt', sessionId, { state: focusState }, (new Error).stack);

    if (!focusState || !focusState.focusedElement) {
      debugLog(`No valid focus state found for sessionId: ${sessionId}, resetting to default`);
      focusLog('restore_failed', sessionId, { reason: 'no_state' }, (new Error).stack);
      this.tabbableCached = false;
      this.focusedElement = null;
      this.currentFocusIndex = 0;
      return false;
    }

    const restoredFocusedElement = focusState.focusedElement;
    if (!this.isPageContentElement(restoredFocusedElement)) {
      debugLog(`Invalid focus state element ${restoredFocusedElement}, resetting`);
      focusLog('restore_failed', sessionId, { reason: 'invalid_element', element: restoredFocusedElement }, (new Error).stack);
      this.tabbableCached = false;
      this.focusedElement = null;
      this.currentFocusIndex = 0;
      return false;
    }

    const tabbable = this.computeTabbableElements();
    let elementToFocus = tabbable.find(el => {
      if (restoredFocusedElement.startsWith('input:')) {
        return el.type === 'input' && `input:${el.backendNodeId}` === restoredFocusedElement;
      } else if (restoredFocusedElement.startsWith('clickable:')) {
        return el.type === 'clickable' && `clickable:${el.backendNodeId}` === restoredFocusedElement;
      }
      return false;
    });

    if (!elementToFocus) {
      debugLog(`Element ${restoredFocusedElement} no longer exists, attempting fallback. Tabbable count: ${tabbable.length}`);
      focusLog('restore_fallback', sessionId, {
        element: restoredFocusedElement,
        tabbableSummary: tabbable.map(el => `${el.type}:${el.backendNodeId || el.targetId || el.type}`)
      }, (new Error).stack);

      const typePrefix = restoredFocusedElement.split(':')[0];
      const candidates = tabbable.filter(el => el.type === typePrefix);
      if (candidates.length > 0) {
        elementToFocus = candidates[0];
        debugLog(`Fallback to ${typePrefix}:${elementToFocus.backendNodeId}`);
        focusLog('restore_fallback_success', sessionId, {
          element: `${typePrefix}:${elementToFocus.backendNodeId}`
        }, (new Error).stack);
      } else {
        debugLog(`No ${typePrefix} elements found, resetting`);
        focusLog('restore_failed', sessionId, {
          reason: 'no_fallback',
          element: restoredFocusedElement,
          tabbableSummary: tabbable.map(el => `${el.type}:${el.backendNodeId || el.targetId || el.type}`)
        }, (new Error).stack);
        this.tabbableCached = false;
        this.focusedElement = null;
        this.currentFocusIndex = 0;
        return false;
      }
    }

    this.tabbableCached = false;
    this.focusedElement = elementToFocus ? `${elementToFocus.type}:${elementToFocus.backendNodeId}` : restoredFocusedElement;
    this.previousFocusedElement = focusState.previousFocusedElement;
    this.currentFocusIndex = 0;

    debugLog(`Restoring focus to ${this.focusedElement}`);
    focusLog('restore_success', sessionId, { element: this.focusedElement }, (new Error).stack);
    setFocus(elementToFocus);

    return true;
  }

  computeTabbableElements() {
    if (this.tabbableCached) return this.tabbableCache;
    const sessionId = this.getBrowserState().currentSessionId;
    const tabState = this.getTabState(sessionId);
    const renderedBoxes = renderedBoxesBySession.get(sessionId) || [];
    const tabbable = [];

    tabState.targets.forEach((tab, index) => {
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

    const hasClickableDescendants = (nodeIdx) => {
      const descendants = [];
      const collectDescendants = (idx) => {
        publicState.nodeToParent.forEach((parentIdx, childIdx) => {
          if (parentIdx === idx) {
            descendants.push(childIdx);
            collectDescendants(childIdx);
          }
        });
      };
      collectDescendants(nodeIdx);
      return descendants.some(idx => publicState.nodes.isClickable?.index.includes(idx));
    };

    const elementsByParentId = new Map();
    const seenBackendNodeIds = new Set();
    renderedBoxes.forEach(box => {
      if (!box.isClickable && box.type !== 'input' && box.ancestorType !== 'button') return;

      let parentBackendNodeId = box.backendNodeId;
      let parentNodeIndex = box.nodeIndex;
      let currentNodeIndex = box.nodeIndex;
      const nodePath = [currentNodeIndex];

      while (currentNodeIndex !== -1 && currentNodeIndex !== undefined) {
        if (publicState.nodes.isClickable && publicState.nodes.isClickable.index.includes(currentNodeIndex)) {
          parentBackendNodeId = publicState.nodes.backendNodeId[currentNodeIndex];
          parentNodeIndex = currentNodeIndex;
          break;
        }
        currentNodeIndex = publicState.nodeToParent.get(currentNodeIndex);
        nodePath.push(currentNodeIndex);
      }

      focusLog('compute_tabbable_node', null, {
        boxBackendNodeId: box.backendNodeId,
        parentBackendNodeId,
        nodeIndex: box.nodeIndex,
        parentNodeIndex,
        nodePath,
        isClickable: publicState.nodes.isClickable?.index.includes(parentNodeIndex),
        boxText: box.text?.slice(0, 50)
      }, (new Error).stack);

      const nodeNameIdx = publicState.nodes.nodeName[parentNodeIndex];
      const nodeName = nodeNameIdx >= 0 ? publicState.strings[nodeNameIdx] : '';
      if (nodeName === '#document' || publicState.nodes.nodeType[parentNodeIndex] === 9) {
        return;
      }

      const isButton = box.ancestorType === 'button';
      if (!isButton && hasClickableDescendants(parentNodeIndex)) {
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
    const tabbable = this.computeTabbableElements();
    if (!tabbable.length) {
      focusLog('focus_next_failed', null, { reason: 'no_tabbable_elements' }, (new Error).stack);
      return;
    }

    const currentIdx = this.currentFocusIndex;
    const nextIdx = (currentIdx + 1) % tabbable.length;
    this.currentFocusIndex = nextIdx;
    const elementToFocus = tabbable[nextIdx];
    focusLog('focus_next', null, {
      from: this.focusedElement,
      to: elementToFocus ? `${elementToFocus.type}:${elementToFocus.backendNodeId || elementToFocus.targetId || elementToFocus.type}` : null,
      index: nextIdx
    }, (new Error).stack);
    setFocus(elementToFocus);
  }

  focusPreviousElement(setFocus) {
    const tabbable = this.computeTabbableElements();
    if (!tabbable.length) {
      focusLog('focus_previous_failed', null, { reason: 'no_tabbable_elements' }, (new Error).stack);
      return;
    }

    const currentIdx = this.currentFocusIndex;
    const prevIdx = (currentIdx - 1 + tabbable.length) % tabbable.length;
    this.currentFocusIndex = prevIdx;
    const elementToFocus = tabbable[prevIdx];
    focusLog('focus_previous', null, {
      from: this.focusedElement,
      to: elementToFocus ? `${elementToFocus.type}:${elementToFocus.backendNodeId || elementToFocus.targetId || elementToFocus.type}` : null,
      index: prevIdx
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
