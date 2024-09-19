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
  if (!checkWebAudio()) probablyTorScore += 0.3;
  if (!checkWebRTC()) probablyTorScore += 0.3;
  if (await checkTorExitNode()) probablyTorScore += 0.3;

  // Threshold to determine Tor usage
  const TOR_THRESHOLD = 0.5;
  if (probablyTorScore > TOR_THRESHOLD) {
    assumeAccessViaTor();
  }

  // Function to handle Tor-specific adjustments
  function assumeAccessViaTor() {
    console.log('Assuming access via Tor. Adjusting site behavior accordingly.');

    // Example: Disable microphone permission request on mobile
    if (/Mobi|Android/i.test(navigator.userAgent)) {
      const microphoneRequest = document.querySelector('#microphonePermission');
      if (microphoneRequest) {
        microphoneRequest.style.display = 'none';
      }
    }

    // Add other Tor-specific adjustments here
  }
}



