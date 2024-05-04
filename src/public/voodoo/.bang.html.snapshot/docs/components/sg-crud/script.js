class Component extends Base {
  UpdateSelected(clickEvent) {
    const {form, state, name} = this.getSelected(clickEvent);

    name.firstName = form.firstname.value;
    name.surname = form.surname.value;

    setState('data', state);
  }

  DeleteSelected(clickEvent) {
    const {name, state} = this.getSelected(clickEvent);
    state.crud.names.splice(state.crud.names.findIndex(({key}) => key === name.key), 1);
    state.crud.selected = '';
    setState('data', state);
  }

  AddName(clickEvent) {
    const form = clickEvent.target.form;
    const state = cloneState('data');

    const name = {
      key: Math.random()+'',
      firstName: form.firstname.value,
      surname: form.surname.value
    }

    state.crud.names.push(name);

    setState('data', state);
  }

  SetSelected(inputEvent) {
    let selected = '';
    if ( inputEvent.target.selectedIndex !== -1 ) {
      selected = inputEvent.target.selectedOptions[0].dataset.key;
    }

    const state = cloneState('data');
    state.crud.selected = selected;
    setState('data', state);
  }

  SetPrefix(inputEvent) {
    const prefix = inputEvent.target.value;

    const state = cloneState('data');
    state.crud.prefix = prefix;
    state.crud.selected = '';
    setState('data', state);
  }

  getSelected(clickEvent) {
    const form = clickEvent.target.form;
    const state = cloneState('data');
    const name = state.crud.names.find(({key}) => key === state.crud.selected);
    return {form, state, name};
  }
}
