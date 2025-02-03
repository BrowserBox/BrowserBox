## BrowserBox Beta API

### Installation:

To start using the Beta API, follow these steps:

1. Clone the BrowserBox repository:
   ```
   git clone https://github.com/BrowserBox/BrowserBox.git
   ```

2. If you're setting up a new installation, run the following command:
   ```
   ./deploy-scripts/global_install.sh <your hostname> <your email>
   ```

3. If you already have an existing installation from the repository, navigate to your BrowserBox directory and update it with the latest changes:
   ```
   git checkout boss
   git pull origin boss
   ./deploy-scripts/copy_install.sh
   ```

4. If you're using Docker, please note that Beta API is only available in 6.2 and above. If you have no updated your container, you can manually upgrade it per container, from inside your container:
   ```
   cd ~/bbpro
   git remote remove origin 
   git remote remove backup
   git remote add origin https://github.com/BrowserBox/BrowserBox.git
   git checkout boss
   git pull origin boss
   ./deploy-scripts/copy_install.sh
   ```

### Usage:

We've introduced a new parameter for an injection script to `setup_bbpro`, `--inject`:

```
setup_bbpro --inject /path/to/your/injection.js -p $PORT
```

This script will be injected into a JavaScript context that has access to the page, similar to an extension content script. Additionally, this context exposes a global async API (`bb.ctl`) that currently provides access to the DevTools protocol.

Here's a simple usage example:

```javascript
await bb.ctl("DOM.enable", {});
document.addEventListener('pointermove', async ({ clientX: x, clientY: y }) => {
   const { backendNodeId, frameId, nodeId } = await bb.ctl("DOM.getNodeForLocation", { x, y });
   const { node } = await bb.ctl("DOM.describeNode", { nodeId });
});
```

By default, the command is sent to the current tab, but you can also send a command to a particular sessionId: `bb.ctl(method, params, sessionId)`

We're planning to mirror this guest context API (aka injection script API) to be available on the embedding page soon. This will allow you to embed the BrowserBox view into an iframe and access the API from there.

Learn more about the Chrome DevTools Protocol (CDP) here: [CDP Documentation](https://chromedevtools.github.io/devtools-protocol/). The CDP is a powerful protocol that provides complete access to controlling every aspect of the browser. Please note that the beta API currently doesn't support adding event listeners for emitted CDP events, but we plan to add that in the future.

We also anticipate adding more API surface in the coming weeks as we work toward a larger developer API with a general release. Your feedback is highly valued in this process.

Feel free to explore these exciting possibilities, and don't hesitate to reach out if you have any questions or need assistance. We're here to support you!
