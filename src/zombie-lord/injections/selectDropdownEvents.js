/* eslint-disable no-inner-declarations */
/*
  This provides event for
  select box opening and select box closing
  to enable UI to be rendered on the client

  The select box opens:
  - on a click
  - if it has focus and space key is pressed
  - if it has focus and enter key is pressed

  The select box closes:
  - when it loses focus
  - on a click
  - if enter key is pressed
*/

{
  let closed = true;

  install();

  function install() {
    self.addEventListener('click', monitorSelectEvents, {capture: true});
    self.addEventListener('keydown', monitorSelectEvents, {capture: true});
    console.log(JSON.stringify({install:{selectDropDownEvents:true}}));
  }

  function monitorSelectEvents(e) {
    let {target} = e;
    if ( target.shadowRoot ) {
      // contains a shadow, so will not be the actual event target
      // but this will be
      target = e.path[0];
    }
    const condition = !!target && target.matches && target.matches('select:not([multiple])');
    if ( ! condition ) return;

    if ( e.type == "keydown" ) {
      const id = e.key && e.key.length > 1 ? e.key : e.code;
      if ( closed ) {
        if ( id == "Space" || id == "Enter" ) {
          open(target);
        }
      } else {
        if ( id == "Enter" || id == "Tab" ) {
          close(target);
        }
      }
    } else if ( e.type == "click" ) {
      if ( closed ) {
        open(target);
      } else {
        close(target);
      }
    }

    if ( ! closed ) {
      target.addEventListener('blur', () => close(target), {capture:true, once:true});
    }
  }

  function open(selectEl) {
    closed = false;
    s({selectOpen:true, values:getSelectInside(selectEl), selected: selectEl.selectedIndex});
    self.setSelectValue = makeValueSetter(selectEl);
  }

  function close(/*selectEl*/) {
    closed = true;
    s({selectOpen:false});
  }

  function getSelectInside(selectEl) {
    return Array.from(selectEl.options).map(el => {
      const opt = document.createElement('option');
      opt.value = el.value;
      opt.innerText = el.innerText || el.value;
      return opt.outerHTML;
    }).join('');
  }

  function makeValueSetter(selectEl) {
    return function( val ) {
      console.log(`Setting value of ${selectEl} to ${val}`);
      const optionElem = selectEl.querySelector(`[value="${val}"]`);
      optionElem.selected = true;
      selectEl.value = val;
      selectEl.dispatchEvent(new Event('change', {bubbles:true, isTrusted:true}));
      selectEl.blur();
    }
  }

  function s(o) {
    console.log(JSON.stringify({selectInput:o}));
  }
}
/* eslint-enable no-inner-declarations */
