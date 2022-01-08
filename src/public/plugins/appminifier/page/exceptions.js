const KEYINPUT = `input, [contenteditable], textarea`;

export function anchorException(e) {
  if ( ! e.target ) return;
  const link = e.target.closest && e.target.closest('a');
  if ( ! link ) return;
  if ( link.matches('a[download]') ) {
    return true;
  } else if ( link.href && link.href.match(/^(mailto|tel)/) ) {
    return true;
  } else if ( link.id && link.id.startsWith('dosy-litewait') ) {
    return true;
  }
} 

export function selectException(e) {
  if ( ! e.target ) return;
  const select = e.target.closest && e.target.closest('select');
  if ( ! select ) return;
  return true;
} 

export function radioException(e) {
  if ( ! e.target ) return;
  const radio = e.target.matches && e.target.matches('input[type="radio"]');
  if ( ! radio ) return;
  return true;
}

export function checkboxException(e) {
  if ( ! e.target ) return;
  const checkbox = e.target.matches && e.target.matches('input[type="checkbox"]');
  if ( ! checkbox ) return;
  return true;
}

export function detailsSummaryException(e) {
  if ( ! e.target ) return;
  const summaryDetails = e.target.matches && e.target.matches('summary, details');
  if ( ! summaryDetails ) return;
  return true;
}

export function keyInputException(e) {
  if ( ! e.target ) return;
  
  return e.target.matches(KEYINPUT);
}
