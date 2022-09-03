export function handleSelectMessage({selectInput:{selectOpen, values, selected}, executionContextId}, state) {
  state.waitingExecutionContext = executionContextId;
  if ( state.ignoreSelectInputEvents ) return;
  toggleSelect({selectOpen,values, selected});
}

function toggleSelect({selectOpen, values, selected}) {
  const input = document.querySelector('#selectinput');
  if ( selectOpen ) {
    input.innerHTML = values;
    input.selectedIndex = selected;
    input.classList.add('open');
    //input.focus();
  } else {
    input.classList.remove('open');
    input.innerHTML = "";
    //input.blur();
  }
}

