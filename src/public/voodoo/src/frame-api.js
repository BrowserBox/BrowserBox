// frame-api.js (full updated file)

/**
 * @file frame-api.js
 * @description This class acts as a communication bridge. It receives commands
 * from a parent window and executes them on the provided `browserSurface`.
 * It also has a method for the `browserSurface`'s context to send events back
 * to the parent.
 */

export class IframeCommunicator {
    #parentOrigin;
    #logPrefix = "[EMBED-API]";
    #handlers = new Map();
    browserSurface;

    constructor(parentOrigin = '*', browserSurface = null) {
        if (!browserSurface) {
            throw new Error(`${this.#logPrefix} A browserSurface implementation must be provided.`);
        }
        this.#parentOrigin = parentOrigin;
        this.browserSurface = browserSurface;
        window.addEventListener('message', this.#handleParentMessage.bind(this));
        this.#registerParentCommandHandlers();
    }

    // This method is now called EXTERNALLY by the voodoo scope
    sendMessageToParent(type, data = {}, tabId = null) {
        const message = { type, tabId, data };
        console.log(`${this.#logPrefix} Sending to parent (${type}):`, message);
        window.parent.postMessage(message, this.#parentOrigin);
    }

    sendResponseToParent(type, requestId, data = {}, error = null) {
        const message = { type, requestId, data, error };
        console.log(`${this.#logPrefix} Sending RESPONSE to parent (${type}, reqId: ${requestId}):`, message);
        window.parent.postMessage(message, this.#parentOrigin);
    }

    #registerHandler(type, handler) {
        this.#handlers.set(type, handler);
    }

    #handleParentMessage(event) {
        if (this.#parentOrigin !== '*' && event.origin !== this.#parentOrigin) return;
        if (!event.data || typeof event.data.type !== 'string') return;

        const { type, data, tabId, requestId, click } = event.data;
        console.log(`${this.#logPrefix} Received from parent (${type}):`, event.data);

        const handler = this.#handlers.get(type);
        if (handler) {
            handler({ data, tabId, requestId, click });
        } else {
            console.warn(`${this.#logPrefix} No handler for parent message type: ${type}`);
        }
    }

    #registerParentCommandHandlers() {
        this.#registerHandler('init', () => {
            console.log(`${this.#logPrefix} Initialized by parent.`);
            this.sendMessageToParent('tab-api-ready');
        });

        // --- Tab Operations ---
        this.#registerHandler('createTab', async ({ data, click }) => {
            await this.browserSurface.createTab(click, data.url, data.options);
        });
        this.#registerHandler('closeTab', async ({ tabId, click }) => {
            await this.browserSurface.closeTab(click, tabId);
        });
        this.#registerHandler('setActiveTab', async ({ tabId, click }) => {
            await this.browserSurface.activateTab(click, tabId);
        });

        // --- Navigation ---
        this.#registerHandler('loadURL', async ({ tabId, data }) => {
            await this.browserSurface.loadURL(tabId, data.url);
        });
        this.#registerHandler('goBack', async ({ tabId }) => await this.browserSurface.goBack(tabId));
        this.#registerHandler('goForward', async ({ tabId }) => await this.browserSurface.goForward(tabId));
        this.#registerHandler('reload', async ({ tabId }) => await this.browserSurface.reload(tabId));
        this.#registerHandler('stop', async ({ tabId }) => await this.browserSurface.stop(tabId));

        // --- Data Requests ---
        this.#registerHandler('getTabs', async ({ requestId }) => {
            if (!requestId) return;
            try {
                const tabs = await this.browserSurface.getTabs();
                this.sendResponseToParent('getTabs', requestId, tabs);
            } catch (e) {
                this.sendResponseToParent('getTabs', requestId, [], `Failed to get tabs: ${e.message}`);
            }
        });
        this.#registerHandler('getActiveTab', async ({ requestId }) => {
            if (!requestId) return;
            try {
                const activeTab = await this.browserSurface.getActiveTab();
                this.sendResponseToParent('getActiveTab', requestId, activeTab);
            } catch (e) {
                this.sendResponseToParent('getActiveTab', requestId, null, `Failed to get active tab: ${e.message}`);
            }
        });
    }
}
