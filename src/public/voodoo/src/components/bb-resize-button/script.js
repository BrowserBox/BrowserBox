class BBResizeButton extends Base {
  constructor() {
    super();

    if ( !self._resz ) {
      self._resz = [];
    }

    self._resz.push(this);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
  }
}
