// torDetection.js
// this script attempts to detect access via tor to then switch off some features that may or will cause problems
// when accessing via the Onion browser, especially on mobile
// the point of this is to increase availability for users accessing the service via the onion browser

detectTor().catch(e => console.warn(`Error detecting tor`, e));

async function detectTor() {
  let probablyTorScore = 0;

  // Function to check if Web Audio is supported
  function checkWebAudio() {
    try {
      return typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined';
    } catch {
      return false;
    }
  }

  // Function to check if WebRTC is supported
  function checkWebRTC() {
    return !!(window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection);
  }

  function checkHost() {
    return globalThis?.location?.host?.endsWith?.('.onion');
  }

  // Function to check if IP is in Tor Exit Node List
  async function checkTorExitNode() {
    const response = await fetch('/torExit');
    const {error, status} = await response.json();
    if ( error ) {
      console.warn(`Error checking tor exit node status`, error);
      return;
    }
    return status == 'tor-exit';
  }

  // Calculate Tor score
  globalThis.checkingTOR = true;
  if (checkHost()) probablyTorScore += 0.51;
  if (!checkWebAudio()) probablyTorScore += 0.51;
  if (!checkWebRTC()) probablyTorScore += 0.25;
  if (await checkTorExitNode()) probablyTorScore += 0.51;

  // Threshold to determine Tor usage
  const TOR_THRESHOLD = 0.5;
  if (probablyTorScore > TOR_THRESHOLD) {
    assumeAccessViaTor();
  }
  globalThis.checkingTOR = false;

  // Function to handle Tor-specific adjustments
  function assumeAccessViaTor() {
    try {
      console.log('Assuming access via Tor. Adjusting site behavior accordingly.');
      globalThis.comingFromTOR = true;

      // Example: Disable microphone permission request on mobile
      const MobilePlatform = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      if (MobilePlatform.test(navigator.userAgent)) {
        globalThis.shouldNotRequestMicrophone = true;
      }

      // Add other Tor-specific adjustments here
    } catch(e) {
      alert(e+'');
    }
  }
}



