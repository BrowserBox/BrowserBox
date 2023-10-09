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
    let newStart = false;

    if ( !this.downloadState.progressData[guid] ) {
      if ( this.downloadState.activeDownloads == 0 ) {
        this.resetDownloads();
      }
      this.downloadState.progressData[guid] = {};
      newStart = true;
      this.vanish = false;
    }

    if (state === 'completed' || state === 'canceled') {
      this.downloadState.completedDownloads++;
      this.downloadState.activeDownloads--;
      this.downloadState.progressData[guid].complete = true;
    } else if ( newStart ) {
      this.downloadState.activeDownloads++;
    }

    Object.assign(this.downloadState.progressData[guid], {receivedBytes, totalBytes});

    this.plural = this.downloadState.activeDownloads > 1;
    this.progressValue = this.downloadState.completedDownloads;

    let totalBytesReceived = 0;

    for (const download of Object.values(this.downloadState.progressData)) {
      totalBytesReceived += download.receivedBytes;
      if (download.totalBytes > 0) {
        this.progressValue += download.receivedBytes / download.totalBytes;
      } else {
        this.progressValue += 1; // For shimmering effect
      }
    }

    const megabytesReceived = (totalBytesReceived / (2 ** 20)).toFixed(2);
    this.megabytesReceived = megabytesReceived;
    let htmlStr = `Download: <meter min="0" max="${Math.max(1,this.downloadState.activeDownloads)}" value="${this.progressValue}"></meter> ${megabytesReceived} MB`;
    if (this.downloadState.activeDownloads > 1) {
      htmlStr = `${this.downloadState.completedDownloads} out of ${this.downloadState.activeDownloads} downloaded ` + htmlStr;
    }
  
    // hopefully trigger repaint
    data.downloadState = this.downloadState;
    this.state = data;

    if ( this.downloadState.activeDownloads == 0 ) {
      this.vanishTimer = setTimeout(() => this.vanish = true, 45000);
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
    data.downloadsState = this.downloadState;
    this.state = data;
  }
}

