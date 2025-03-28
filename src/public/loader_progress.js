
  const progress = document.currentScript.previousElementSibling;
  const runner = setInterval(() => {
    if ( progress.value < progress.max ) {
      progress.value += 1;
    } else {
      clearInterval(runner);
    }
  }, 17);
