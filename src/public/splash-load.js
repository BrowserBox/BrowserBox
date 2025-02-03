{
  const text = document.currentScript.previousElementSibling;
  const splash = text.closest('#splash');
  const loader = setInterval(() => {
    if ( document?.body?.querySelector?.('bb-view')?.classList?.contains?.('bang-styled') ) {
      clearInterval(loader);
      splash.remove();
      document.documentElement.style.cursor = 'auto';
    } else {
      switch(text.innerText.trim().length) {
        case 7:
        case 8:
        case 9:
          text.innerText += '.';
          break;
        case 10:
          text.innerText = 'Loading';
          break;
        default:
          text.innerText = 'Loading...';
      }
    }
  }, 800);

  document.documentElement.style.cursor = 'wait';
}
