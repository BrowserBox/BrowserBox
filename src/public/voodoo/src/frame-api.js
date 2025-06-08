// frame-api.js

export class IframeCommunicator {
    // privates

    #parentOrigin;
    #logPrefix = "[EMBED-API]";
    #handlers = new Map();
    #sessionId = null;

    #tabs = new Map(); // Map<tabId, { id, url, title, history, historyIndex, loading }>
    #activeTabId = null;

    // This will be the actual <iframe> element within this iframe's document
    // that loads and displays the content of the active tab.
    #contentHostIframe;

    constructor(parentOrigin = '*', browserSurface = null) {
        this.#parentOrigin = parentOrigin;
        window.addEventListener('message', this.#handleParentMessage.bind(this));

        // Note: 'error' on iframe itself is for src loading failure, not page errors within.
        this.browserSurface = browserSurface;

        this.registerHandler('init', (payload) => {
            this.#sessionId = payload.data.sessionId;
            console.log(`${this.#logPrefix} Initialized by parent. Session: ${this.#sessionId}`);
            if (this.#tabs.size === 0) {
                this._createInternalTab('about:blank', null, true);
            }
            this.sendMessageToParent('tab-ready');
        });

        this.registerHandler('createTab', this.#handleCreateTab.bind(this));
        this.registerHandler('loadURL', this.#handleLoadURL.bind(this));
        this.registerHandler('closeTab', this.#handleCloseTab.bind(this));
        this.registerHandler('setActiveTab', this.#handleSetActiveTab.bind(this));
        this.registerHandler('goBack', this.#handleGoBack.bind(this));
        this.registerHandler('goForward', this.#handleGoForward.bind(this));
        this.registerHandler('reload', this.#handleReload.bind(this));
        this.registerHandler('stop', this.#handleStop.bind(this));
        this.registerHandler('getTabs', this.#handleGetTabsRequest.bind(this));
        this.registerHandler('getActiveTab', this.#handleGetActiveTabRequest.bind(this));
    }

    sendMessageToParent(type, data = {}, tabId = null) {
        const message = { type, tabId, data };
        console.log(`${this.#logPrefix} Sending to parent (${type}):`, message);
        window.parent.postMessage(message, this.#parentOrigin);
    }

    sendResponseToParent(type, requestId, data = {}, tabId = null, error = null) {
        const message = { type, requestId, tabId, data, error };
        console.log(`${this.#logPrefix} Sending RESPONSE to parent (${type}, reqId: ${requestId}):`, message);
        window.parent.postMessage(message, this.#parentOrigin);
    }

    registerHandler(type, handler) {
        this.#handlers.set(type, handler);
    }

    #handleParentMessage(event) {
        if (!event.data || typeof event.data.type !== 'string') return;
        const { type, tabId, data, requestId } = event.data;
        console.log(`${this.#logPrefix} Received from parent (${type}):`, event.data);
        const handler = this.#handlers.get(type);
        if (handler) {
            handler({ tabId, data, requestId });
        } else {
            console.log(`${this.#logPrefix} No handler for parent message type ${type}:`, { tabId, data });
        }
    }

    _generateInternalTabId() {
        return `iframe-actual-tab-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }

    // Called when the #contentHostIframe finishes loading a page
    #handleContentHostLoad() {
        if (!this.#activeTabId) return;
        const tab = this.#tabs.get(this.#activeTabId);
        if (!tab || !tab.loading) return; // Not loading or tab doesn't exist

        tab.loading = false;
        try {
            // IMPLEMENTATION NEEDED: Safely access contentWindow and contentDocument
            // This can fail due to cross-origin restrictions if `src` is a different origin
            // and no specific measures (like CORS for the document, or specific headers) are in place.
            // For about:blank or same-origin content, this is generally fine.
            tab.url = this.#contentHostIframe.contentWindow.location.href;
            tab.title = this.#contentHostIframe.contentDocument.title || this._extractTitleFromUrl(tab.url);

            // Update history for the tab based on the actual loaded URL
            if (tab.history[tab.historyIndex] !== tab.url) {
                 // This logic assumes a new navigation, not a history traversal within the contentHostIframe
                tab.history = tab.history.slice(0, tab.historyIndex + 1);
                tab.history.push(tab.url);
                tab.historyIndex = tab.history.length - 1;
            }
        } catch (e) {
            console.warn(`${this.#logPrefix} Error accessing contentHostIframe details after load (cross-origin?):`, e);
            // tab.url might remain the one we tried to set, or be unknown.
            // tab.title might remain the old one or be a fallback.
            if (!tab.title) tab.title = this._extractTitleFromUrl(tab.url);
        }


        this.sendMessageToParent('did-stop-loading', { tabId: this.#activeTabId, data: { url: tab.url } });
        this.sendMessageToParent('did-navigate', {
            tabId: this.#activeTabId,
            data: {
                url: tab.url,
                title: tab.title,
                history: tab.history, // Send current snapshot of history
                historyIndex: tab.historyIndex
            }
        });
        console.log(`${this.#logPrefix} Content host loaded for tab ${this.#activeTabId}: ${tab.url}`);
    }


    _createInternalTab(url, requestedTabIdByParent = null, makeActive = false) {
        const newTabId = requestedTabIdByParent || this._generateInternalTabId();
        const newTab = {
            id: newTabId,
            url: url,
            title: this._extractTitleFromUrl(url) || 'New Tab',
            history: [url],
            historyIndex: 0,
            loading: false,
        };
        this.#tabs.set(newTabId, newTab);
        console.log(`${this.#logPrefix} Internal tab created: ${newTabId}`);
        this.sendMessageToParent('tab-created', {
            tabId: newTabId,
            data: { url: newTab.url, title: newTab.title }
        });
        if (makeActive || this.#tabs.size === 1) {
            this._setInternalActiveTab(newTabId);
        }
        return newTabId;
    }

    _setInternalActiveTab(tabId) {
        if (this.#activeTabId === tabId && this.#contentHostIframe.style.display !== 'none' && tabId !== null) return;

        const oldActiveTabId = this.#activeTabId;
        this.#activeTabId = tabId;

        if (oldActiveTabId && oldActiveTabId !== tabId) {
            // IMPLEMENTATION NEEDED: Potentially "unload" or "hide" content of oldActiveTabId if necessary.
            // For a single contentHostIframe, this means its content will be replaced.
        }

        if (this.#activeTabId) {
            const tab = this.#tabs.get(this.#activeTabId);
            if (tab) {
                this.#contentHostIframe.style.display = 'block';
                // Check if the contentHostIframe is already showing the correct URL for this tab
                let currentContentHostURL = '';
                try { currentContentHostURL = this.#contentHostIframe.contentWindow.location.href; } catch (e) { /* cross-origin */ }

                if (currentContentHostURL !== tab.url || this.#contentHostIframe.src !== tab.url) {
                    console.log(`${this.#logPrefix} Setting contentHostIframe src for active tab ${this.#activeTabId} to: ${tab.url}`);
                    tab.loading = true; // Expecting a load
                    this.sendMessageToParent('did-start-loading', { tabId: this.#activeTabId, data: { url: tab.url } });
                    // IMPLEMENTATION NEEDED: Navigate the #contentHostIframe to tab.url.
                    // This will trigger the 'load' event on #contentHostIframe if successful.
                    this.#contentHostIframe.src = tab.url;
                } else {
                    // Content host already shows the correct URL, just ensure it's visible
                    console.log(`${this.#logPrefix} ContentHostIframe already at ${tab.url} for active tab ${this.#activeTabId}`);
                }
            } else {
                 console.warn(`${this.#logPrefix} Active tab ${this.#activeTabId} not found in tabs map.`);
                 this.#contentHostIframe.style.display = 'none';
                 this.#contentHostIframe.src = 'about:blank'; // Clear it
            }
        } else {
            // No active tab
            this.#contentHostIframe.style.display = 'none';
            // IMPLEMENTATION NEEDED: Clear or set #contentHostIframe.src to 'about:blank'.
            this.#contentHostIframe.src = 'about:blank';
        }

        this.sendMessageToParent('active-tab', { data: { tabId: this.#activeTabId } });
        console.log(`${this.#logPrefix} Internal active tab set to: ${this.#activeTabId}`);
    }

    #handleCreateTab({ data, tabId: requestedTabIdByParent }) {
        this._createInternalTab(data.url, requestedTabIdByParent, !this.#activeTabId);
    }

    #handleLoadURL({ tabId, data }) {
        const tab = this.#tabs.get(tabId);
        if (!tab) {
            console.warn(`${this.#logPrefix} loadURL: Tab ${tabId} not found internally.`);
            return;
        }
        console.log(`${this.#logPrefix} Request to load URL ${data.url} in internal tab ${tabId}`);
        tab.loading = true;
        tab.url = data.url; // Update desired URL
        // No title update here yet, wait for actual load if it's the active tab.

        this.sendMessageToParent('did-start-loading', { tabId, data: { url: tab.url } });

        if (tabId === this.#activeTabId) {
            // IMPLEMENTATION NEEDED: Navigate the #contentHostIframe to data.url.
            // The 'load' event on #contentHostIframe will handle did-stop-loading and did-navigate.
            console.log(`${this.#logPrefix} Active tab ${tabId} loading new URL: ${data.url}`);
            this.#contentHostIframe.src = data.url;
        } else {
            // Tab is not active, its URL is updated. When it becomes active, _setInternalActiveTab will load it.
            // For non-active tabs, we might not send stop/navigate until they become active and load.
            // Or, if managing multiple hidden iframes, you'd load it there.
            // For simplicity with one contentHostIframe, we "virtually" stop loading for now.
            // This part is tricky if you want perfect background loading simulation.
            console.log(`${this.#logPrefix} Tab ${tabId} (inactive) URL set to ${data.url}. Will load when activated.`);
            // To avoid confusion, we don't send did-stop-loading or did-navigate for inactive tabs
            // until they are actually loaded into the contentHostIframe.
            // The parent's optimistic update might be enough for UI.
        }
    }

    #handleCloseTab({ tabId }) {
        if (!this.#tabs.has(tabId)) return;
        console.log(`${this.#logPrefix} Closing internal tab ${tabId}`);
        const wasActive = this.#activeTabId === tabId;
        this.#tabs.delete(tabId);
        this.sendMessageToParent('tab-closed', { tabId });

        if (wasActive) {
            // IMPLEMENTATION NEEDED: If the closed tab was active in #contentHostIframe,
            // the #contentHostIframe should be cleared or load about:blank.
            // _setInternalActiveTab will handle loading the new active tab or clearing if no tabs left.
            const remainingTabIds = Array.from(this.#tabs.keys());
            const newActiveTabId = remainingTabIds.length > 0 ? remainingTabIds[remainingTabIds.length - 1] : null;
            this._setInternalActiveTab(newActiveTabId);
        }
    }

    #handleSetActiveTab({ tabId }) {
        this._setInternalActiveTab(tabId);
    }

    _navigateInternalHistory(tabId, direction) {
        const tab = this.#tabs.get(tabId);
        if (!tab) return false;

        if (tabId === this.#activeTabId) {
            // IMPLEMENTATION NEEDED: Tell the #contentHostIframe to go back/forward in its history.
            // e.g., this.#contentHostIframe.contentWindow.history.go(direction);
            // The 'load' event on #contentHostIframe (or popstate) should then fire,
            // allowing #handleContentHostLoad to update state and notify parent.
            console.log(`${this.#logPrefix} Navigating history (${direction}) in active contentHostIframe for tab ${tabId}`);
            try {
                this.#contentHostIframe.contentWindow.history.go(direction);
                // Note: history.go() doesn't guarantee a load event if there's no page at that history entry.
                // A 'popstate' event listener on contentWindow might be more reliable for SPA-like changes.
                // For now, we assume 'load' will eventually fire or state is updated by #handleContentHostLoad.
                // We also need to signal loading started.
                tab.loading = true;
                this.sendMessageToParent('did-start-loading', { tabId, data: { url: "Navigating history..." } }); // URL unknown until load
            } catch (e) {
                console.warn(`${this.#logPrefix} Error navigating history in contentHostIframe:`, e);
                return false;
            }
            return true; // Optimistic: assume navigation will occur.
        } else {
            // For inactive tabs, just update history index. Content will load when activated.
            const newIndex = tab.historyIndex + direction;
            if (newIndex >= 0 && newIndex < tab.history.length) {
                tab.historyIndex = newIndex;
                tab.url = tab.history[newIndex]; // Update tab's current URL based on history
                console.log(`${this.#logPrefix} Updated history index for inactive tab ${tabId} to ${tab.url}`);
                // Inform parent immediately about navigation for inactive tab (state change)
                this.sendMessageToParent('did-navigate', {
                    tabId,
                    data: {
                        url: tab.url,
                        title: tab.title, // Title might be stale, will update on activation
                        history: tab.history,
                        historyIndex: tab.historyIndex
                    }
                });
                return true;
            }
            return false;
        }
    }

    #handleGoBack({ tabId }) {
        console.log(`${this.#logPrefix} Request to navigate back in internal tab ${tabId}`);
        this._navigateInternalHistory(tabId, -1);
    }

    #handleGoForward({ tabId }) {
        console.log(`${this.#logPrefix} Request to navigate forward in internal tab ${tabId}`);
        this._navigateInternalHistory(tabId, 1);
    }

    #handleReload({ tabId }) {
        const tab = this.#tabs.get(tabId);
        if (!tab) return;
        console.log(`${this.#logPrefix} Request to reload internal tab ${tabId}`);
        if (tabId === this.#activeTabId) {
            tab.loading = true;
            this.sendMessageToParent('did-start-loading', { tabId, data: { url: tab.url } });
            // IMPLEMENTATION NEEDED: Tell the #contentHostIframe to reload.
            // e.g., this.#contentHostIframe.contentWindow.location.reload();
            try {
                this.#contentHostIframe.contentWindow.location.reload();
            } catch (e) {
                console.warn(`${this.#logPrefix} Error reloading contentHostIframe:`, e);
                tab.loading = false; // Revert loading state if command fails
                this.sendMessageToParent('did-stop-loading', { tabId, data: { url: tab.url } });
            }
        } else {
            // For inactive tabs, simply mark for reload? Or do nothing until active.
            // For now, do nothing. It will load its current URL when activated.
            console.log(`${this.#logPrefix} Tab ${tabId} (inactive) marked for reload (no-op until active).`);
            // To actually reload an inactive tab, you'd need a hidden iframe for it.
        }
    }

    #handleStop({ tabId }) {
        const tab = this.#tabs.get(tabId);
        if (!tab) return;
        console.log(`${this.#logPrefix} Request to stop loading in internal tab ${tabId}`);
        if (tabId === this.#activeTabId && tab.loading) {
            // IMPLEMENTATION NEEDED: Tell the #contentHostIframe to stop loading.
            // e.g., this.#contentHostIframe.contentWindow.stop();
            try {
                this.#contentHostIframe.contentWindow.stop();
            } catch (e) {
                console.warn(`${this.#logPrefix} Error stopping contentHostIframe:`, e);
            }
            // #handleContentHostLoad or an error handler should update loading state and notify parent.
            // Forcing it here if `stop()` doesn't trigger `load` event reliably with `false`.
            tab.loading = false;
            this.sendMessageToParent('did-stop-loading', { tabId, data: { url: tab.url } });
        } else if (tab.loading) { // Inactive tab that was "loading"
            tab.loading = false;
            this.sendMessageToParent('did-stop-loading', { tabId, data: { url: tab.url } });
        }
    }

    #handleGetTabsRequest({ requestId }) {
        if (!requestId) return;
        const tabsArray = Array.from(this.#tabs.values()).map(t => ({
            id: t.id, url: t.url, title: t.title,
        }));
        this.sendResponseToParent('getTabs', requestId, tabsArray);
    }

    #handleGetActiveTabRequest({ requestId }) {
        if (!requestId) return;
        this.sendResponseToParent('getActiveTab', requestId, this.#activeTabId);
    }

    _extractTitleFromUrl(url) {
        if (!url || typeof url !== 'string') return 'Invalid URL';
        if (url === 'about:blank') return 'Blank Page';
        if (url.startsWith('data:')) return 'Data URL';
        try {
            const parsedUrl = new URL(url);
            let title = parsedUrl.hostname.replace(/^www\./, '');
            if (parsedUrl.pathname !== '/' && parsedUrl.pathname.length > 1) {
                const pathPart = parsedUrl.pathname.split('/').filter(Boolean).pop();
                if (pathPart) title = decodeURIComponent(pathPart) + ' - ' + title;
            }
            return title || 'Untitled';
        } catch (e) {
            return url.length > 30 ? url.substring(0, 27) + '...' : url;
        }
    }
}

