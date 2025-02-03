class BBOmniBox extends Base {
  constructor() {
    super();
    if ( ! self._omnis ) {
      self._omnis = [];
    }
    self._omnis.push(this);
  }
}
