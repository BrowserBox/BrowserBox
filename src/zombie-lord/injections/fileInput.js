{
  /* eslint-disable no-inner-declarations */
  // temp location pointer targeting diagnois code

  /**
  // state and config
    const Events = `
      click mousemove mouseover mouseout mousedown pointerdown pointerup pointermove 
    `.split(/\s+/g).filter(s => s.length);
    const Styles = {
      position: 'fixed',
      pointerEvents: 'none',
      transform: 'translate(-50%, -50%)',
      zIndex:999999999,
      display: 'block',
      width: '1rem',
      height: '1rem',
      background: 'transparent',
      border: 'medium solid aqua',
      left: '0px',
      top: '0px'
    }
    const positionMarkers = [];

  install();

  function install() {
    for( const eventName of Events ) {
      document.addEventListener(eventName, showPosition);
    }

    document.defaultView.addEventListener('resize', () => {
      const div = document.createElement('div');
      Object.assign(div.style, Styles);
      Object.assign(div.style, {
        left: window.innerWidth/2+'px',
        top: (window.innerHeight - window.innerHeight*0.85)+10+'px',
        width: '66px',
        borderColor: 'red',
        background: 'lime',
        textAlign: 'center'
      })
      div.style.position = 'fixed';
      div.innerText = 'RESIZE';
      setTimeout(() => {
        div.remove();
      }, 3000);
      document.body.insertAdjacentElement('beforeend', div);
    });
  }

  // display a marker
    function showPosition({clientX,clientY}) {
      const div = document.createElement('div');
      const timestamp = Date.now();
      Object.assign(div.style, Styles);
      Object.assign(div.style, {
        left:clientX+'px', 
        top:clientY+'px'
      });
      document.body.insertAdjacentElement('afterbegin', div);
      positionMarkers.push({
        timestamp, 
        div, 
        remove(ms) {
          setTimeout(() => div.remove(), ms);
        }
      });
    }

  // remove markers older than 2 seconds 
    setInterval(
      () => {
        const Now = Date.now();
        let spliceCount = 0;
        for( const {timestamp, remove} of positionMarkers) {
          const age = Now - timestamp;
          if ( age > 500 ) {
            remove(Math.max(0, 1000 - age));
            spliceCount++;
          }
        }
        positionMarkers.splice(0, spliceCount);
      }, 1000);
  **/

  /* eslint-enable no-inner-declarations */
}
{
  /* eslint-disable no-inner-declarations */
  // temp location for file input related code in page context

  const isFileInput = el => el.localName == 'input' && el.type == 'file';

  self.zombieDosyLastClicked = {};

  self.addEventListener('click', click => {
      const {target} = click;
      const {clientX,clientY} = click;

      self.zombieDosyLastClicked = {target};

      const stack = click.path || click?.composedPath?.() || getAncestors(target); //expandShadowRoots(Array.from(document.elementsFromPoint(clientX,clientY)), clientX, clientY);

      if ( isFileInput(target) && target ) {
        self.zombieDosyLastClicked.fileInput = target;
      } else {
        const fileInputFromStack = stack.find(isFileInput);
        self.zombieDosyLastClicked.fileInput = fileInputFromStack;
      }
      
      //console.log(JSON.stringify({zombieDosyLastClicked:self.zombieDosyLastClicked}));
  }, {capture:true});

  function expandShadowRoots(els, x,y ) {
    const result = []; 
    for( const el of els ) {
      if ( el.shadowRoot ) {
        result.push(...el.shadowRoot.elementsFromPoint(x,y));
      } else {
        result.push(el);
      }
    }
    return result;
  }

  function getAncestors(el) {
    const anc = [];
    while(el?.nodeType == Node.ELEMENT_NODE) {
      anc.push(el);
      el = el.parentNode;
      if ( el?.host ) {
        el = el.host;
      }
    }
    return anc;
  }

  console.log(JSON.stringify({install:"Installed zombieDosyLastClicked with isFileInput support"}));
  /* eslint-enable no-inner-declarations */
}
