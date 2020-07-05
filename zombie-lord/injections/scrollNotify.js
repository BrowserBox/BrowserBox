/* eslint-disable no-inner-declarations */
{
  const THROTTLE_MS = 200;
  const WAIT_FOR_SCROLL = 150;
  const VERTICAL = 1;
  const HORIZONTAL = 2;
  let timeout;

  install();

  function install() {
    self.ensureScroll = ensureScroll;
    self.addEventListener('scroll', throttledNotify, {capture: true, passive:true});
  }

  function throttledNotify() {
    if ( ! timeout ) {
      s({didScroll:true});
      timeout = setTimeout(() => timeout = false, THROTTLE_MS);
    }
  }

  function ensureScroll({deltaX, deltaY, clientX, clientY} = {}) {
    const mainScrollDirection = Math.abs(deltaY) > Math.abs(deltaX) ? VERTICAL : HORIZONTAL;
    const {topElement,scrollElement} = findScrollElement({clientX,clientY}, mainScrollDirection);
    if ( ! scrollElement ) return err({noScrollElement:true});
    const current = {top: scrollElement.scrollTop, left: scrollElement.scrollLeft};
    const expected = {newTop: current.top + deltaY, newLeft: current.left + deltaX};
    setTimeout(() => {
      const newCurrent = {top: scrollElement.scrollTop, left: scrollElement.scrollLeft};
      if ( mainScrollDirection == VERTICAL ) {
        if ( deltaY != 0 && newCurrent.top == current.top ) {
          err({scrollRequired:"top", current, expected, newCurrent});
          scrollElement.scrollBy(0, deltaY);
        }
      } else if ( mainScrollDirection == HORIZONTAL ) {
        if ( deltaX != 0 && newCurrent.left == current.left ) {
          err({scrollRequired:"left", current, expected, newCurrent});
          scrollElement.scrollBy(deltaX, 0);
          /**
            This is required for SCMP bizarre horizontal scrolling
            But it makes it work!
          **/
          topElement.dispatchEvent(new MouseEvent('pointerup',{clientX,clientY,bubbles:true}));
        }
      }
    }, WAIT_FOR_SCROLL);
  }

  //FIXME: support shadow roots for elementsFromPoint
  function findScrollElement({clientX,clientY}, direction) {
    const stack = document.elementsFromPoint(clientX, clientY); 
    const test = direction == VERTICAL ? 
      el => el.scrollHeight - el.clientHeight :
      el => el.scrollWidth - el.clientWidth;
    if ( ! stack ) return err({noStack:true});
    let maxDiff = 0;
    let scrollElement;
    for( const el of stack ) {
      const diff = test(el);
      if ( !! diff && diff >= maxDiff ) {
        scrollElement = el;
        maxDiff = diff;
      }
    }
    return {scrollElement, topElement: stack[0]};
  }

  function s(o) {
    console.log(JSON.stringify({scroll:o}));
  }

  function err(/*e*/) {
    // DEBUG: no need to show error now because it works
    // console.log(JSON.stringify({error:e}));
    return;
  }
}
/* eslint-enable no-inner-declarations */
