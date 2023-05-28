class BBLoadingIndicator extends Base {
  static SHOW_LOADED_MS = 300;

  static DEFAULT_LOADING = {
    waiting: 0,
    complete: 0
  };

  constructor(...args) {
    super(...args);

    this.untilLoaded().then(() => {
      this.loading = this.constructor.DEFAULT_LOADING;
      DEBUG.trackLoading && this.startMonitoringLoads();
    });
  }

  get low() {
    return Math.round((this?.loading?.waiting+this?.loading?.complete)*0.309);
  }

  get high() {
    return Math.round((this?.loading?.waiting+this?.loading?.complete)*0.618);
  }

  get optimum() {
    return Math.round((this?.loading?.waiting+this?.loading?.complete)*0.90);
  }

  startMonitoringLoads() {
    if ( this.loadKeeper ) return;
    this.loadKeeper = setInterval(() => this.showLoad(), 503);
  }

  stopMonitoringLoads() {
    clearInterval(this.loadKeeper);
    this.loadKeeper = false;
  }

  showLoad() {
    const {state} = this;
    const loading = state._top.loadings.get(state._top.activeTarget) || this.constructor.DEFAULT_LOADING;
    const jLoading = JSON.stringify(loading);
    if ( this.lastLoading !== jLoading ) {
      this.lastLoading = jLoading;
      this.loading = loading;
      this.loading.isLoading = this.loading.waiting > 0;
      this.state = state;
    }
  }
}
