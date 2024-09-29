class BBExtensionsButton extends Base {
  toggleVisibility(click) {
    const panel = this.shadowRoot.querySelector('.panel');
    if ( panel.classList.contains('visible') ) {
      panel.classList.remove('visible');
    } else {
      panel.classList.add('visible');
    }
  }

  openOptions(click) {
    const id = click.target.closest('li').dataset.id;
    const {state: {extensions}} = this;

    const manifest = extensions.find(m => m.id == id);
    console.log('options', id, manifest);

    if ( manifest.options_page ) {
      this.state.createTab(null, `chrome-extension://${id}/${manifest.options_page}`);
    } else {
      this.state.createTab(null, `chrome://extensions/?id=${id}`);
    }
  }

  executeAction(click) {
    const id = click.target.closest('li').dataset.id;
    const {state: {extensions}} = this;

    const manifest = extensions.find(m => m.id == id);
    console.log('action', id, manifest);

    if ( manifest?.action?.default_popup ) {
      this.state.createTab(null, `chrome-extension://${id}/${manifest.action.default_popup}`);
    } else {
      this.state.createTab(null, `chrome-extension://${id}/popup.html`);
    }
  }
}
