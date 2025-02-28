class CircleDrawer extends Base {
  static Radius = 32;

  AddCircle(clickEvent) {
    if ( clickEvent.target.matches('sg-circle') ) return;
    const {clientX,clientY} = clickEvent;
    const frame = clickEvent.target.closest('.canvas');
    const {left,top} = frame.getBoundingClientRect();
    const r = CircleDrawer.Radius;
    const x = clientX - left;
    const y = clientY - top;
    const state = cloneState('circleDrawer');
    state.circles.push({
      key: `${x},${y}`,
      x, y, 
      radius: r
    });
    setState('circleDrawer', state, {save:true});
  }

  OpenSizer(event) {
    if ( event.type === 'contextmenu' ) {
      event.preventDefault();
    }
    const selected = event.target.dataset.key;
    const state = cloneState('circleDrawer');
    state.selected = selected;
    setState('circleDrawer', state);
  }

  SizeSelected(inputEvent) {
    const state = cloneState('circleDrawer');
    const circle = state.circles.find(({key}) => key === state.selected);
    circle.radius = inputEvent.composedPath()[0].valueAsNumber;
    setState('circleDrawer', state);
  }

  CloseSizer(event) {
    if ( 
      event.target.matches('sg-circle.selected') || 
      event.composedPath()[0].closest('dialog,button') 
    ) return;
    const state = cloneState('circleDrawer');
    if ( ! state.selected ) return;
    if ( event.type === 'contextmenu' ) {
      event.preventDefault();
    }
    event.stopPropagation();
    state.selected = '';
    setState('circleDrawer', state);
  }

  SaveCircleSize(changeEvent) {
    const state = cloneState('circleDrawer'); 
    const {selected} = state;
    state.selected = '';
    setState('circleDrawer', state, {save:true, rerender: false});
    state.selected = selected;
    setState('circleDrawer', state, {rerender: false});
  }

  Undo() {
    undoState('circleDrawer');
  }

  Redo() {
    redoState('circleDrawer');
  }
}
