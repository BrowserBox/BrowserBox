/* eslint-disable no-inner-declarations */
{
  install();

  function install() {
    self.getElementInfo = getElementInfo;
  }

  function getElementInfo({attributes, innerText, clientX, clientY, closest} = {}) {
    const retVal = {};
    let target = document.elementFromPoint(clientX,clientY);

    while ( (target?.shadow instanceof DocumentFragment || target?.shadowRoot instanceof DocumentFragment ) ) {
      const d = target.shadowRoot instanceof DocumentFragment ? target.shadowRoot : target.shadow;
      const newTarget = d.elementFromPoint(clientX, clientY);
      if ( newTarget ) target = newTarget;
      else break;
    }

    if ( !! target && !! closest ) {
      target = target.closest(closest);
    }

    if ( ! target ) {
      retVal.noSuchElement = true; 
    } else {
      if ( innerText ) {
        if ( target.matches('input, textarea, select, output') ) {
          retVal.innerText = target.value;
        } else if ( target.matches('img, video, audio') ) {
          retVal.innerText = target.src;
        } else {
          retVal.innerText = target.innerText;
        }
      }

      if ( !! attributes && Array.isArray(attributes) ) {
        retVal.attributes = {};
        attributes.forEach(name => {
          let value = undefined;
          try {
            value = target[name];
          } catch(e) {
            value = target.getAttribute(name);
          }
          if ( value && value.length == 0 ) {
            value = true;
          }
          retVal.attributes[name] = value;
        });
      }
    }

    // don't report if we don't have anything
    
    //if ( ! retVal.noSuchElement ) {
      s(retVal);
    //}
  }

  function s(o) {
    console.log(JSON.stringify({elementInfo:o}));
  }
}
/* eslint-enable no-inner-declarations */
