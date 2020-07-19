// const
  const MobilePlatform = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  const timers = [];

  if ( isMobile() ) {
    window.addEventListener('orientationchange', e => {
      timers.forEach(clearTimeout);
      timers.push(setTimeout(() => {
        alert("Device re-oriented! You need to reload.");
        location.reload();
      }, 50));
    });
  } else {
    window.addEventListener('resize', e => {
      timers.forEach(clearTimeout);
      timers.push(setTimeout(() => {
        alert(`Window resized! You need to reload.`);
        location.reload();
      }, 50));
    });
  }

function isMobile() {
  return MobilePlatform.test(navigator.userAgent);
}
