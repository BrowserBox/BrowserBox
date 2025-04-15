import { debugLog, focusLog } from './log.js';

export class FocusManager {
  constructor(getState) {
    this.getState = getState;
    this.focusState = new Map(); // Map<sessionId, focusState>
    this.focusedElement = null;
    this.previousFocusedElement = null;
    this.currentFocusIndex = 0;
    this.tabbableCached = false;
    this.tabbableCache = [];
  }

  // Save focus state for the current tab, but only for page content elements
  saveFocusState() {
    const { sessionId } = this.getState();
    const { focusedElement, previousFocusedElement, currentFocusIndex } = this;

    // Always save the focus state, but we'll only restore page content elements
    const focusState = {
      focusedElement,
      previousFocusedElement,
      currentFocusIndex,
    };
    focusLog('save', sessionId, focusState, (new Error).stack);
    debugLog(`Saving focus state for sessionId: ${sessionId}, focusedElement: ${focusedElement}`);
    this.focusState.set(sessionId, focusState);
  }

  // Restore focus state for the current tab
  restoreFocusState(computeTabbableElements, setFocus) {
    const { sessionId } = this.getState();
    const focusState = this.focusState.get(sessionId);
    debugLog(`Restoring focus state for sessionId: ${sessionId}, found state: ${JSON.stringify(focusState)}`);

    if (!focusState) {
      debugLog(`No focus state found for sessionId: ${sessionId}, resetting to default`);
      this.tabbableCached = false;
      this.currentFocusIndex = 0;
      return false; // Indicate no state was restored
    }

    focusLog('restore', sessionId, focusState, (new Error).stack);

    // Only restore if the saved focus is a page content element
    let restoredFocusedElement = focusState.focusedElement;
    if (!this.isPageContentElement(restoredFocusedElement)) {
      debugLog(`Saved focusedElement ${restoredFocusedElement} is not a page content element, skipping restoration`);
      return false;
    }

    // Validate the focusedElement
    const tabbable = computeTabbableElements();
    const elementExists = tabbable.some(el => {
      if (restoredFocusedElement.startsWith('input:')) {
        return el.type === 'input' && `input:${el.backendNodeId}` === restoredFocusedElement;
      } else if (restoredFocusedElement.startsWith('clickable:')) {
        return el.type === 'clickable' && `clickable:${el.backendNodeId}` === restoredFocusedElement;
      }
      return false;
    });

    if (!elementExists) {
      debugLog(`Restored focusedElement ${restoredFocusedElement} no longer exists, skipping restoration`);
      this.tabbableCached = false;
      this.currentFocusIndex = 0;
      return false;
    }

    this.tabbableCached = false;
    this.focusedElement = restoredFocusedElement;
    this.previousFocusedElement = focusState.previousFocusedElement;
    this.currentFocusIndex = focusState.currentFocusIndex || 0;

    // Set focus to the restored element
    const elementToFocus = tabbable.find(el => {
      if (restoredFocusedElement.startsWith('input:')) {
        return el.type === 'input' && `input:${el.backendNodeId}` === restoredFocusedElement;
      } else if (restoredFocusedElement.startsWith('clickable:')) {
        return el.type === 'clickable' && `clickable:${el.backendNodeId}` === restoredFocusedElement;
      }
      return false;
    });

    if (elementToFocus) {
      setFocus(elementToFocus);
    }

    return true; // Indicate state was restored
  }

  // Check if an element is a page content element (input or clickable)
  isPageContentElement(element) {
    return element && (element.startsWith('input:') || element.startsWith('clickable:'));
  }

  // Check if the current focus is on a browser UI element
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
    return this.tabbableCache;
  }

  focusNextElement(computeTabbableElements, setFocus) {
    const tabbable = this.computeTabbableElements(computeTabbableElements);
    if (!tabbable.length) return;

    const currentIdx = this.currentFocusIndex;
    const nextIdx = (currentIdx + 1) % tabbable.length;
    this.currentFocusIndex = nextIdx;
    setFocus(tabbable[nextIdx]);
  }

  focusPreviousElement(computeTabbableElements, setFocus) {
    const tabbable = this.computeTabbableElements(computeTabbableElements);
    if (!tabbable.length) return;

    const currentIdx = this.currentFocusIndex;
    const prevIdx = (currentIdx - 1 + tabbable.length) % tabbable.length;
    this.currentFocusIndex = prevIdx;
    setFocus(tabbable[prevIdx]);
  }

  focusNearestInRow(direction, computeTabbableElements, setFocus, options) {
    const tabbable = this.computeTabbableElements(computeTabbableElements);
    if (!tabbable.length) return;

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
    if (!current) return;

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
        setFocus(nearest);
        return;
      }
    }

    const targetY = direction === 'down' ? currentY + 1 : currentY - 1;
    let candidates = tabbable.filter(el => el.y === targetY);

    if (!candidates.length) {
      candidates = tabbable.filter(el => (direction === 'down' ? el.y > currentY : el.y < currentY));
      if (!candidates.length) return;
      const nextRowY = direction === 'down' ? Math.min(...candidates.map(el => el.y)) : Math.max(...candidates.map(el => el.y));
      candidates = tabbable.filter(el => el.y === nextRowY);
    }

    const nearest = candidates.reduce((best, el) => {
      const elCenterX = el.x + (el.width || options.tabWidth) / 2;
      const bestCenterX = best.x + (best.width || options.tabWidth) / 2;
      return Math.abs(elCenterX - currentCenterX) < Math.abs(bestCenterX - currentCenterX) ? el : best;
    }, candidates[0]);

    this.currentFocusIndex = tabbable.findIndex(el => el === nearest);
    setFocus(nearest);
  }

  getFocusedElement() {
    return this.focusedElement;
  }

  getPreviousFocusedElement() {
    return this.previousFocusedElement;
  }

  setFocusedElement(element) {
    this.focusedElement = element;
  }

  setPreviousFocusedElement(element) {
    this.previousFocusedElement = element;
  }
}
