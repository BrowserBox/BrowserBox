class Component extends Base {
  ScrollIntoView() {
    this.scrollIntoView();
  }

  ShowFormula() {
    const {state} = this;
    state.editFormula = true;
    this.updateIfChanged(state);
  }

  ShowValue() {
    const {state} = this;
    state.editFormula = false;
    this.updateIfChanged(state);
  }
}
