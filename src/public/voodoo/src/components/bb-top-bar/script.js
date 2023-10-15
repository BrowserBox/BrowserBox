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

    if (state === 'completed' || state === 'canceled' || ((receivedBytes >= totalBytes) && totalBytes > 0 )) {
      if ( !this.downloadState.progressData[guid].completed ) {
        this.downloadState.completedDownloads++;
        if ( this.downloadState.progressData[guid].wasActive ) {
          this.downloadState.activeDownloads--;
          if ( this.downloadState.activeDownloads < 0 ) {
            this.downloadState.activeDownloads = 0;
          }
        }
        this.downloadState.progressData[guid].completed = true;
      }
    } else if ( newStart ) {
      this.downloadState.activeDownloads++;
      this.downloadState.progressData[guid].wasActive = true;
    }

    Object.assign(this.downloadState.progressData[guid], {receivedBytes, totalBytes});

    this.plural = this.downloadState.activeDownloads > 1;
    this.progressValue = 0;
    this.totalFiles = this.downloadState.activeDownloads + this.downloadState.completedDownloads;

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
  
    // hopefully trigger repaint
    data.downloadState = this.downloadState;
    this.state = data;

    if ( this.downloadState.activeDownloads == 0 ) {
      this.vanishTimer = setTimeout(() => {
        this.vanish = true; 
        this.state = this.state;
      }, 500000);
    }
  }

  resetDownloads() {
    this.downloadState = {
      activeDownloads: 0,
      completedDownloads: 0,
      totalBytesReceived: 0,
      progressData: {}
    };
  }
}

