class Counter extends Base {
  Increment() {
    const {state} = this;
    state.count++;
    this.state = state;
  }
}
