class BBTopBar extends Base {
  constructor() {
    super();
    this.downloadState = {
      activeDownloads: 0,
      completedDownloads: 0,
      totalBytesReceived: 0,
      progressData: {}
    };
    this.vanish = true;
    const {state} = this;
    state.downloadState = this.downloadState;
    state.topBarComponent = this;
    this.state = state;
  }

  updateDownloadStatus(event) {
    clearTimeout(this.vanishTimer);
    const {state: data } = this;
    const { guid, state, receivedBytes, totalBytes } = event;
  
    if (state === 'completed' || state === 'cancelled') {
      this.downloadState.completedDownloads++;
      this.downloadState.activeDownloads--;
      delete this.downloadState.progressData[guid];
    } else if ( !this.downloadState.progressData[guid] ) {
      this.downloadState.activeDownloads++;
      this.vanish = false;
    }
    this.downloadState.progressData[guid] = { receivedBytes, totalBytes };

    this.plural = this.downloadState.activeDownloads > 1;
    this.progressValue = this.downloadState.completedDownloads;
    let totalBytesReceived = 0;
    for (const key in this.downloadState.progressData) {
      const data = this.downloadState.progressData[key];
      totalBytesReceived += data.receivedBytes;
      if (data.totalBytes > 0) {
        this.progressValue += data.receivedBytes / data.totalBytes;
      } else {
        this.progressValue += 1; // For shimmering effect
      }
    }
  
    this.downloadState.totalBytesReceived = totalBytesReceived;
  
    const megabytesReceived = (totalBytesReceived / (2 ** 20)).toFixed(2);
    this.megabytesReceived = megabytesReceived;
    let htmlStr = `Download: <meter min="0" max="${this.downloadState.activeDownloads}" value="${this.progressValue}"></meter> ${megabytesReceived} MB`;
    if (this.downloadState.activeDownloads > 1) {
      htmlStr = `${this.downloadState.completedDownloads} out of ${this.downloadState.activeDownloads} downloaded ` + htmlStr;
    }
  
    // hopefully trigger repaint
    data.downloadState = this.downloadState;
    this.state = data;

    if ( this.downloadState.activeDownloads == 0 ) {
      this.vanishTimer = setTimeout(() => this.resetDownloads(), 1500);
    }

    return htmlStr;
  }

  resetDownloads() {
    const {state:data} = this;
    this.downloadState = {
      activeDownloads: 0,
      completedDownloads: 0,
      totalBytesReceived: 0,
      progressData: {}
    };
    this.vanish = true;
    data.downloadsState = this.downloadState;
    this.state = data;
  }
}

