{
  if ( location.hostname == "chromewebstore.google.com" ) {
    document.addEventListener('click', event => {
      if ( event.target.closest('main section > section > div:last-child button') ) confirm('You want to install?');
    });
  }
}
