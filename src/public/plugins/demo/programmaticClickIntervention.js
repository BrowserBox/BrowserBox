export function saveFailingClick({click}, state) {
  if ( click.clickModifiers & 2 ) {
    state.createTab(click, click.intendedHref);
  } else if ( click.intendedHref ) {
    state.H({
      synthetic: true,
      type: 'url-address',
      url: click.intendedHref,
      event: click
    });
  }
}

export function auditClicks({click}, state) {
  if ( click.hitsTarget ) return;
  else {
    saveFailingClick({click}, state);
  }
}
