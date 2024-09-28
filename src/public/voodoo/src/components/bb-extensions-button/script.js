class BBExtensionsButton extends Base {
  toggleVisibility(click) {
    const panel = this.shadowRoot.querySelector('.panel');
    if ( panel.classList.contains('visible') ) {
      panel.classList.remove('visible');
    } else {
      panel.classList.add('visible');
    }
  }
}
