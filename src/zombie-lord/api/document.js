export class Document {
  constructor({ send, on, ons }) {
    this.send = send;
    this.on = on;
    this.ons = ons;
  }

  async querySelectorAllWithCDP(selector, sessionId) {
    const searchNodes = async (nodeId) => {
      const elements = [];

      const queryResult = await this.send("DOM.querySelectorAll", {
        selector: selector,
        nodeId: nodeId,
      }, sessionId);
      const nodeIds = queryResult.nodeIds;

      for (const nodeId of nodeIds) {
        const nodeDescription = await this.send("DOM.describeNode", { nodeId }, sessionId);
        const node = nodeDescription.node;
        elements.push(node);

        if (node.isShadowHost) {
          const shadowRootResult = await this.send("DOM.getShadowRoots", { nodeId }, sessionId);
          elements.push(...await searchNodes(shadowRootResult.shadowRoot.nodeId));
        }

        if (node.nodeName === 'IFRAME') {
          const contentDocumentResult = await this.send("DOM.getContentDocument", { nodeId }, sessionId);
          if (contentDocumentResult) {
            elements.push(...await searchNodes(contentDocumentResult.nodeId));
          }
        }
      }

      return elements;
    };

    const documentResult = await this.send("DOM.getDocument", {}, sessionId);
    return searchNodes(documentResult.root.nodeId);
  }

  async querySelectorAll(selector, sessionId) {
    const elements = await this.querySelectorAllWithCDP(selector, sessionId);
    return elements;
  }

  // Additional methods that leverage the send, on, and ons functions can be added here
}

