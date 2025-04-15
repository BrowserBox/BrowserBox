import { debugLog, focusLog } from './log.js';

export class FocusManager {
  constructor(getState) {
    this.getState = getState;
    this.focusState = new Map();
    this.focusedElement = null;
    this.previousFocusedElement = null;
    this.currentFocusIndex = 0;
    this.tabbableCached = false;
    this.tabbableCache = [];
  }

  saveFocusState() {
    const { sessionId } = this.getState();
    const { focusedElement, previousFocusedElement } = this;

    if (!focusedElement || !this.isPageContentElement(focusedElement)) {
      debugLog(`Clearing focus state for sessionId: ${sessionId}, focusedElement: ${focusedElement} (not a page content element)`);
      focusLog('clear_state', sessionId, { focusedElement, previousFocusedElement }, (new Error).stack);
      this.focusState.delete(sessionId);
      return;
    }

    const focusState = {
      focusedElement,
      previousFocusedElement,
    };
    debugLog(`Saving focus state for sessionId: ${sessionId}, focusedElement: ${focusedElement}`);
    focusLog('save_state', sessionId, focusState, (new Error).stack);
    this.focusState.set(sessionId, focusState);
  }

  restoreFocusState(computeTabbableElements, setFocus) {
    const { sessionId } = this.getState();
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

    const tabbable = computeTabbableElements();
    const elementToFocus = tabbable.find(el => {
      if (restoredFocusedElement.startsWith('input:')) {
        return el.type === 'input' && `input:${el.backendNodeId}` === restoredFocusedElement;
      } else if (restoredFocusedElement.startsWith('clickable:')) {
        return el.type === 'clickable' && `clickable:${el.backendNodeId}` === restoredFocusedElement;
      }
      return false;
    });

    if (!elementToFocus) {
      debugLog(`Element ${restoredFocusedElement} no longer exists, resetting. Tabbable count: ${tabbable.length}`);
      focusLog('restore_failed', sessionId, {
        reason: 'element_missing',
        element: restoredFocusedElement,
        tabbableSummary: tabbable.map(el => `${el.type}:${el.backendNodeId || el.targetId || el.type}`)
      }, (new Error).stack);
      this.tabbableCached = false;
      this.focusedElement = null;
      this.currentFocusIndex = 0;
      return false;
    }

    this.tabbableCached = false;
    this.focusedElement = restoredFocusedElement;
    this.previousFocusedElement = focusState.previousFocusedElement;
    this.currentFocusIndex = 0;

    debugLog(`Restoring focus to ${restoredFocusedElement}`);
    focusLog('restore_success', sessionId, { element: restoredFocusedElement }, (new Error).stack);
    setFocus(elementToFocus);

    return true;
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

  computeTabbableElements(computeTabbableElements) {
    if (this.tabbableCached) return this.tabbableCache;
    this.tabbableCache = computeTabbableElements();
    this.tabbableCached = true;
    focusLog('compute_tabbable', null, {
      count: this.tabbableCache.length,
      elements: this.tabbableCache.map(el => `${el.type}:${el.backendNodeId || el.targetId || el.type}`)
    }, (new Error).stack);
    return this.tabbableCache;
  }

  focusNextElement(computeTabbableElements, setFocus) {
    const tabbable = this.computeTabbableElements(computeTabbableElements);
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

  focusPreviousElement(computeTabbableElements, setFocus) {
    const tabbable = this.computeTabbableElements(computeTabbableElements);
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

  focusNearestInRow(direction, computeTabbableElements, setFocus, options) {
    const tabbable = this.computeTabbableElements(computeTabbableElements);
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
