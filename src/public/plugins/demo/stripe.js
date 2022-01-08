function installStripeButton() {
  const script = document.querySelector('script.stripe-button'); 
  if ( script ) {
    const s = document.createElement('script');
    for ( const attr in script.dataset ) {
      s.dataset[attr] = script.dataset[attr];
    }
    script.parentNode.insertBefore(s, script);
    s.setAttribute('src', script.src);
  }
}
