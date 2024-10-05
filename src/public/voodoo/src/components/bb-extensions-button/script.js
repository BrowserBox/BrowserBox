class BBExtensionsButton extends Base {
  async toggleVisibility(click) {
    const {state} = this;

    const panel = this.shadowRoot.querySelector('.panel');
    if ( panel.classList.contains('visible') ) {
      panel.classList.remove('visible');
    } else {
      panel.classList.add('visible');
      state.getExtensions();
    }
  }

  openOptions(click) {
    const id = click.target.closest('li').dataset.id;
    const {state: {extensions}} = this;

    const manifest = extensions.find(m => m.id == id);
    DEBUG.debugExtensions && console.log('options', id, manifest);

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
    DEBUG.debugExtensions && console.log('action', id, manifest);

    if ( manifest?.action?.default_popup ) {
      this.state.createTab(null, `chrome-extension://${id}/${manifest.action.default_popup}`);
    } else {
      this.state.H({
        synthetic: true,
        type: 'actionOnClicked',
        data: {id}
      });
      
    }
  }

  openSettings(click) {
    this.state.createTab(null, `chrome://extensions/`);
  }
}
