
// firefox is the best UA to use for compatibility across most sites
// I found that if I use Chrome or Safari UAs, websites will behave differently

export const deskUA_Mac_Chrome = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
export const deskUA_Mac_FF = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14.4; rv:124.8) Gecko/20100101 Firefox/124.0";

export const mobUA_iOSFF = "Mozilla/5.0 (iPhone; CPU iPhone OS 14_4_8 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/124.0 Mobile/15E148 Safari/605.1.15";
export const mobUA_AndroidFF = "Mozilla/5.0 (Android 14; Mobile; rv:124.8) Gecko/124.0 Firefox/124.0";
export const mobUA_iOSSafari = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_8 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3.1 Mobile/15E148 Safari/604.1";

export const LANG = "en-US";

export const deskPlat_Windows = "Win64";
export const deskPlat_Mac = "MacIntel";
export const mobPlat_Android = "Android";
export const mobPlat_iOS = "iPhone";

export const VEND_Safari = "Apple Computer, Inc.";
export const VEND_Chrome = "Google Inc.";
export const VEND_FF = "";

// probably should make this a navigator export
export const ua = {
  desktop: {
    mac: {
      ff: deskUA_Mac_FF,
      chrome: deskUA_Mac_Chrome,
      platform: deskPlat_Mac
    },
    windows: {
      platform: deskPlat_Windows
    }
  },
  mobile: {
    iphone: {
      ff: mobUA_iOSFF,
      safari: mobUA_iOSSafari,
      platform: mobPlat_iOS
    },
    android: {
      ff: mobUA_AndroidFF,
      platform: mobPlat_Android
    }
  }
};
