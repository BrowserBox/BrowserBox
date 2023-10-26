const StatusSymbol = Symbol(`[[ConnectivityStatus]]`);

export default class InternetChecker {
  constructor(timeout = 5000, debug = false) {
    this.timeout = timeout;
    this.debug = debug;
    this.checkInProgress = false;
    this[StatusSymbol] = 'issue';
    this.urls = [
      "https://www.google.com",
      "https://www.cloudflare.com",
      "https://www.amazon.com",
      "https://www.apple.com",
      "https://www.microsoft.com"
    ];
  }

  async singleCheck(url) {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Request timed out")), this.timeout);
    });

    const fetchPromise = fetch(url, {
      method: 'HEAD',
      mode: 'no-cors'
    });

    return Promise.race([fetchPromise, timeoutPromise]);
  }

  async checkInternet() {
    if (this.checkInProgress) {
      this.debug && console.log("Check already in progress, please wait.");
      return { status: "in-progress" };
    }

    this.checkInProgress = true;

    // Shuffle and select two URLs
    const shuffledUrls = this.urls.sort(() => 0.5 - Math.random());
    const selectedUrls = shuffledUrls.slice(0, 2);

    // Execute checks
    let status = 'issue';
    let error;

    try {
      const results = await Promise.allSettled([
        this.singleCheck(selectedUrls[0]),
        this.singleCheck(selectedUrls[1])
      ]);

      const successfulChecks = results.filter(r => r.status === 'fulfilled').length;

      if (successfulChecks === 2) {
        status = "online";
        this.debug && console.log("You are online!");
      } else if (successfulChecks === 0) {
        status = "offline";
        this.debug && console.log("You are offline!");
      } else {
        this.debug && console.log("Connection status is ambiguous. You might be experiencing network issues.");
        status = 'issue';
      }

      this.checkInProgress = false;
    } catch (eerr) {
      this.checkInProgress = false;
      this.debug && console.log("An error occurred while checking the connection.", err);
      error = err;
      return { status: "error", error };
    }

    this.status = status;

    return { status, error };
  }

  get status() {
    return this[StatusSymbol];
  }

  set status(value) {
    switch(value) {
      case "online":
      case "offline":
      case "issue":
      case "error":
        this[StatusSymbol] = value;
        break;
      default: {
        throw new TypeError(`Invalid value ${value} for Connectivity status enum`);
        break;
      }
    }
  }
}

