{
  if ( window === window.top ) {
    class MyCursor extends HTMLElement {
      constructor() {
        super();
      }
    }
    window.customElements.define('my-cursor', MyCursor);
    const cursor = document.createElement('my-cursor');
    document.addEventListener('DOMContentLoaded', addCursor);

    const Styles = {
      position: 'absolute',
      transform: 'translate(-50%,-50%)',
      pointerEvents: 'none',
      border: 'medium solid lime',
      background: 'aquamarine',
      opacity: '0.618',
      width: '20px',
      height: '20px',
      display: 'block',
      borderRadius: '20px',
      zIndex: '2147483647'
    };

    window.addEventListener('pointermove', drawCursor, {passive: true}); 
    window.addEventListener('pointerdown', drawCursor, {passive: true}); 

    Object.assign(cursor.style, Styles);

    function addCursor() {
      (document.body || document.documentElement).appendChild(cursor);
    }

    function drawCursor(pointer) {
      const {pageX, pageY} = pointer; 
      Object.assign(cursor.style, {
        left: pageX + 'px',
        top: pageY + 'px'
      });
    }

    console.log(JSON.stringify({installedShowMouse: true}));
  }
}
