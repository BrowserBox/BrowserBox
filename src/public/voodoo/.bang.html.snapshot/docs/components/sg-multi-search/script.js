class Component extends Base {
  static DEFAULT_TYPE = 'text';

  get type() {
    return this.getAttribute('type') || Component.DEFAULT_TYPE;
  }

  constructor() {
    super();
    this.allowedValues = new Set(this.state.list);
  }

  Choose(change) {
    const {value} = change.target;

    // only Choose values in the list
    if ( !this.allowedValues.has(value) ) return;

    const {state} = this;

    this.state.chosen.push({
      key: Math.random().toFixed(18),
      item: value
    });

    change.target.value = '';

    this.state = state;
  }

  Unchoose(change) {
    const {value:keyToRemove} = change.target;
    const {state} = this;
    const removeIndex = state.chosen.findIndex(({key}) => key === keyToRemove);

    if ( removeIndex >= 0 ) {
      state.chosen.splice(removeIndex, 1);
    }

    this.state = state;
  }
}
