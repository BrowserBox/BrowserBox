/* eslint-disable no-inner-declarations */
{
  const STYLE_WHITELIST = [
    'display',
    'position',
    'background-color',
    'background',
    'color',
    'opacity',
    'font-size',
    'font-family',
    'border',
    'margin',
    'padding',
    'width',
    'height',
    'left',
    'top',
    'bottom',
    'right'
  ];

  let installed = false;

  let Binding;

  say({msg:`Install injections for projector`});

  if ( self == top ) {
    const sbInterval = setInterval(setupBinding, 20);
    setupBinding();
    function setupBinding() {
      const binding = self.instructZombie;
      if ( typeof binding == "function" ) {
        delete self.instructZombie;
        Binding = {
          send: msg => binding(JSON.stringify(msg)),
          onmessage: msg => say({domSnapshot:msg})
        };
        Object.defineProperty(self, 'instructZombie', { get: () => Binding });
        Binding.send({bindingAttached:true});
        clearInterval(sbInterval);
      }
    }
  }

  self.getDOMSnapshot = getDOMSnapshot;

  install();

  async function install() {
    if ( top !== self ) return;

    if ( ! installed ) {
      self.addEventListener('load', install);
      document.addEventListener('domcontentloaded', install);
      installed = true;
    } 

    getDOMSnapshot();
  }

  async function getDOMSnapshot() {
    say({msg:"getDOMSnapshot called"});
    if ( ! Binding ) {
      say({error:`getDOMSnapshot binding is not set up yet.`});
      return;
    }
    Binding.send({
      method: "DOMSnapshot.captureSnapshot",
      params: {
        computedStyles: STYLE_WHITELIST
      }
    });
  }

  function say(o) {
    console.log(JSON.stringify(o));
  }
}
/* eslint-enable no-inner-declarations */
