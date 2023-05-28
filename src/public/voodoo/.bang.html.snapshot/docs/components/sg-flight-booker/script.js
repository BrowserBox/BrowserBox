class Component extends Base {
  SetValence(inputEvent) {
    this.showValidity(inputEvent.target);

    const state = cloneState('data'); 
    state.flightBooker.valence = inputEvent.target.value;
    setState('data', state);
  }

  SetOut(inputEvent) {
    this.showValidity(inputEvent.target);

    const state = cloneState('data'); 
    state.flightBooker.out = dateString(inputEvent.target.valueAsDate);
    setState('data', state);
  }

  SetBack(inputEvent) {
    this.showValidity(inputEvent.target);

    const state = cloneState('data'); 
    state.flightBooker.back = dateString(inputEvent.target.valueAsDate);
    setState('data', state);
  }

  Book(clickEvent) {
    const state = cloneState('data'); 
    const {valence, out, back} = state.flightBooker;
    
    alert(`
      You have booked a ${
        valence
      } flight departing ${
        out
      }${ valence === 'round-trip' ? ` and returning ${
        back
      }` : '' 
      }
    `);
  }

  showValidity(target) {
    /* in fact this should wait for the DOM to be printed 
       which could be async with async value resolution
       in the async case setTimeout is not sufficient
       but it will do here as it works and its 
       a demonstration of how to do it if you want to
       more properly
    */
    setTimeout(() => {
      const state = cloneState('data'); 
      state.flightBooker.formValid = target.form.reportValidity();
      setState('data', state);
    }, 0);
  }
}
