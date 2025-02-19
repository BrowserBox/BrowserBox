import {DEBUG, CONFIG} from './common.js';

const StatusSymbol = Symbol(`[[ConnectivityStatus]]`);

export default class InternetChecker {
  constructor(timeout = (CONFIG.privateConnectivity ? 17000 : 13000), debug = false) {
  }

  async singleCheck(url) {
  }

  async checkInternet() {
    return {status: 'online'};
  }

  get status() {
    return 'online';
  }

  set status(value) {

  }
}
/*
export default class InternetChecker {
  constructor(timeout = (CONFIG.privateConnectivity ? 17000 : 13000), debug = false) {
    this.biasToVerification = CONFIG.privateConnectivity ? 0.618 : 0.8;
    this.timeout = timeout;
    this.debug = debug || DEBUG.val;
    this.checkInProgress = false;
    this[StatusSymbol] = 'issue';
    this.urls = CONFIG.privateConnectivity ? [ 
      "https://browse.cloudtabs.net/connect",
    ] : [
      "https://1.1.1.1",
      "https://dns.google",
      "https://www.akamai.com",
      "https://www.lumen.com",
      "https://www.equinix.com",
      "https://www.f5.com",
      "https://www.cogentco.com",
      "https://www.he.net",
      "https://www.arista.com",
    ];
  }

  async singleCheck(url) {
    const swatch = 0.0;
    if ( swatch < this.biasToVerification ) {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Request timed out")), this.timeout);
      });

      const fetchPromise = uberFetch(url, {
        method: 'GET',
        mode: CONFIG.privateConnectivity ? 'cors' : 'no-cors'
      });

      return Promise.race([fetchPromise, timeoutPromise]);
    } else if ( navigator.onLine ) {
      return true; 
    } else {
      throw new Error(`Offline`);
    }
  }

  async checkInternet() {
    if (this.checkInProgress) {
      this.debug && console.log("Check already in progress, please wait.");
      return { status: "in-progress" };
    }

    this.checkInProgress = true;
    let status = 'issue';
    let error;


    if ( CONFIG.privateConnectivity ) {
      try {
        await this.singleCheck(this.urls[0]);
        this.checkInProgress = false;
        status = 'online'
      } catch(e) {
        this.checkInProgress = false;
        this.status = 'offline';
      }

      this.status = status;
      return { status };
    } else {
      // Shuffle and select two URLs
      const shuffledUrls = this.urls.sort(() => 0.5 - Math.random());
      const selectedUrls = shuffledUrls.slice(0, 2);

      // Execute checks
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
      } catch (err) {
        this.checkInProgress = false;
        this.debug && console.log("An error occurred while checking the connection.", err);
        error = err;
        this.status = 'error';
        return { status: "error", error };
      }
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
*/

