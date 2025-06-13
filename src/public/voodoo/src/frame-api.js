/**
 * @file frame-api.js
 * @description This class acts as a communication bridge between a parent window and a
 * browser rendering surface (the `browserSurface`). It does not maintain any tab state
 * itself. Instead, it translates commands from the parent into API calls on the
 * browserSurface and forwards events from the browserSurface back to the parent.
 * The browserSurface is the single source of truth for all tab information.
 */

export class IframeCommunicator {
    // --- Private Properties ---

    #parentOrigin;
    #logPrefix = "[EMBED-API]";
    #handlers = new Map();
    #sessionId = null;

    /**
     * The browser rendering surface responsible for all tab operations.
     * This object is expected to have methods like createTab, closeTab, activateTab,
     * getTabs, and emit events for state changes.
     * @type {object}
     */
    browserSurface;

    // --- Constructor ---

    /**
     * Initializes the communicator.
     * @param {string} parentOrigin - The expected origin of the parent window for security.
     * @param {object} browserSurface - The browser surface implementation. Must be provided.
     */
    constructor(parentOrigin = '*', browserSurface = null) {
        if (!browserSurface) {
            throw new Error(`${this.#logPrefix} A browserSurface implementation must be provided.`);
        }
        this.#parentOrigin = parentOrigin;
        this.browserSurface = browserSurface;

        // Listen for messages from the parent window
        window.addEventListener('message', this.#handleParentMessage.bind(this));

        // Register handlers for commands from the parent
        this.#registerParentCommandHandlers();

        // Listen for events from the browserSurface to forward to the parent
        this.#registerBrowserSurfaceEventListeners();
    }

    // --- Public Methods for Communication ---

    /**
     * Sends a message to the parent window.
     * @param {string} type - The message type.
     * @param {object} data - The message payload.
     * @param {string|null} tabId - The relevant tab ID, if any.
     */
    sendMessageToParent(type, data = {}, tabId = null) {
        const message = { type, tabId, data };
        console.log(`${this.#logPrefix} Sending to parent (${type}):`, message);
        window.parent.postMessage(message, this.#parentOrigin);
    }

    /**
     * Sends a response to a specific request from the parent window.
     * @param {string} type - The original message type being responded to.
     * @param {string} requestId - The unique ID of the request.
     * @param {object} data - The response payload.
     * @param {string|null} error - An error message, if the request failed.
     */
    sendResponseToParent(type, requestId, data = {}, error = null) {
        const message = { type, requestId, data, error };
        console.log(`${this.#logPrefix} Sending RESPONSE to parent (${type}, reqId: ${requestId}):`, message);
        window.parent.postMessage(message, this.#parentOrigin);
    }

    /**
     * Registers a handler for a specific message type from the parent.
     * @param {string} type - The message type.
     * @param {Function} handler - The function to execute.
     */
    registerHandler(type, handler) {
        this.#handlers.set(type, handler);
    }

    // --- Private Message and Event Handlers ---

    /**
     * Handles incoming messages from the parent window.
     * @param {MessageEvent} event - The message event.
     */
    #handleParentMessage(event) {
        // Basic security and validation
        if (this.#parentOrigin !== '*' && event.origin !== this.#parentOrigin) return;
        if (!event.data || typeof event.data.type !== 'string') return;

        const { type, data, tabId, requestId, click } = event.data;
        console.log(`${this.#logPrefix} Received from parent (${type}):`, event.data);

        const handler = this.#handlers.get(type);
        if (handler) {
            // Pass the entire payload to the handler
            handler({ data, tabId, requestId, click });
        } else {
            console.warn(`${this.#logPrefix} No handler for parent message type: ${type}`);
        }
    }

    /**
     * Registers all handlers for commands initiated by the parent window.
     */
    #registerParentCommandHandlers() {
        this.registerHandler('init', (payload) => {
            this.#sessionId = payload.data.sessionId;
            console.log(`${this.#logPrefix} Initialized by parent. Session: ${this.#sessionId}`);
            // The parent is now responsible for creating the initial tab(s).
            // We just signal that the API is ready to receive commands.
            this.sendMessageToParent('tab-api-ready');
        });

        // --- Tab Operations ---
        this.registerHandler('createTab', async ({ data, click }) => {
            try {
                await this.browserSurface.createTab(click, data.url, data.options);
            } catch (e) {
                console.error(`${this.#logPrefix} Error calling browserSurface.createTab:`, e);
            }
        });

        this.registerHandler('closeTab', async ({ tabId, click }) => {
            try {
                await this.browserSurface.closeTab(click, tabId);
            } catch (e) {
                console.error(`${this.#logPrefix} Error calling browserSurface.closeTab for tab ${tabId}:`, e);
            }
        });

        this.registerHandler('setActiveTab', async ({ tabId, click }) => {
            try {
                await this.browserSurface.activateTab(click, tabId);
            } catch (e) {
                console.error(`${this.#logPrefix} Error calling browserSurface.activateTab for tab ${tabId}:`, e);
            }
        });

        // --- Navigation ---
        // Note: We assume the browserSurface has methods for these actions.
        this.registerHandler('loadURL', async ({ tabId, data }) => {
            if (!this.browserSurface.updateTab) return console.warn("browserSurface.updateTab not implemented");
            await this.browserSurface.updateTab(tabId, { url: data.url });
        });
        this.registerHandler('goBack', async ({ tabId }) => {
            if (!this.browserSurface.goBack) return console.warn("browserSurface.goBack not implemented");
            await this.browserSurface.goBack(tabId);
        });
        this.registerHandler('goForward', async ({ tabId }) => {
            if (!this.browserSurface.goForward) return console.warn("browserSurface.goForward not implemented");
            await this.browserSurface.goForward(tabId);
        });
        this.registerHandler('reload', async ({ tabId }) => {
            if (!this.browserSurface.reload) return console.warn("browserSurface.reload not implemented");
            await this.browserSurface.reload(tabId);
        });
        this.registerHandler('stop', async ({ tabId }) => {
            if (!this.browserSurface.stop) return console.warn("browserSurface.stop not implemented");
            await this.browserSurface.stop(tabId);
        });

        // --- Data Requests ---
        this.registerHandler('getTabs', async ({ requestId }) => {
            if (!requestId) return;
            try {
                const tabs = await this.browserSurface.getTabs();
                this.sendResponseToParent('getTabs', requestId, tabs);
            } catch (e) {
                this.sendResponseToParent('getTabs', requestId, {}, `Failed to get tabs: ${e.message}`);
            }
        });

        this.registerHandler('getActiveTab', async ({ requestId }) => {
            if (!requestId) return;
            if (!this.browserSurface.getActiveTab) return console.warn("browserSurface.getActiveTab not implemented");
            try {
                const activeTab = await this.browserSurface.getActiveTab();
                this.sendResponseToParent('getActiveTab', requestId, activeTab);
            } catch (e) {
                this.sendResponseToParent('getActiveTab', requestId, {}, `Failed to get active tab: ${e.message}`);
            }
        });
    }

    /**
     * Registers event listeners on the browserSurface to propagate state changes to the parent.
     * This assumes the browserSurface uses an "on/emit" event pattern.
     */
    #registerBrowserSurfaceEventListeners() {
        if (typeof this.browserSurface.on !== 'function') {
            console.warn(`${this.#logPrefix} browserSurface does not have an 'on' method for event listening. No events will be forwarded to the parent.`);
            return;
        }

        // A tab was created. The event payload should be the full tab object.
        this.browserSurface.on('tab-created', (tab) => {
            this.sendMessageToParent('tab-created', tab, tab.id);
        });

        // A tab was closed. The event payload should be { tabId }.
        this.browserSurface.on('tab-closed', ({ tabId }) => {
            this.sendMessageToParent('tab-closed', { tabId }, tabId);
        });

        // The active tab changed. The event payload should be { tabId }.
        this.browserSurface.on('active-tab-changed', ({ tabId }) => {
            this.sendMessageToParent('active-tab', { tabId }, tabId);
        });

        // A tab's properties (URL, title, loading state, etc.) were updated.
        // The event payload should be the full, updated tab object.
        this.browserSurface.on('tab-updated', (tab) => {
            this.sendMessageToParent('tab-updated', tab, tab.id);
        });
    }
}
