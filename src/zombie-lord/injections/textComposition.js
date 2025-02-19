/* eslint-disable no-inner-declarations */
{
  install();

  function install() {
    // FIXME: this is buggy anyway
    self.fromFocusedInputDeleteLastOccurrenceOf = (stringVal) => {
      const input = (self.focusEl || document.activeElement);
      if ( !input || ! input.value ) return;
      stringVal = decodeURIComponent(escape(atob(stringVal)));
      const currentVal = (input && input.value) + '';
      const lastIndexOf = currentVal.lastIndexOf(stringVal);
      if ( lastIndexOf > -1 ) {
        const newVal = currentVal.slice(0,lastIndexOf) + currentVal.slice(lastIndexOf+stringVal.length);
        input.value = newVal;
      }
      //input.selectionStart = input.selectionEnd = input.value.length;
    }
    // Further mediation for appminifier is we could check the zig , data id values 
    // against our cache and write our own version of the below func for work with appminifier
    self.syncFocusedInputToValue = async (stringVal) => {
      const input = self.focusEl || document.activeElement;
      if ( ! input ) {
        throw new TypeError(`Supposed to be focused element`);
      }
      stringVal = decodeURIComponent(escape(atob(stringVal)));
      input.value = stringVal;
      //input.selectionStart = input.selectionEnd = input.value.length;
      await Promise.resolve();
    }
  }
}
/* eslint-enable no-inner-declarations */
