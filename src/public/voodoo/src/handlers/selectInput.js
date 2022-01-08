export function handleSelectMessage({selectInput:{selectOpen, values}, executionContextId}, state) {
  state.waitingExecutionContext = executionContextId;
  if ( state.ignoreSelectInputEvents ) return;
  toggleSelect({selectOpen,values});
}

function toggleSelect({selectOpen, values}) {
  const input = document.querySelector('#selectinput');
  if ( selectOpen ) {
    input.innerHTML = values;
    input.classList.add('open');
    //input.focus();
  } else {
    input.classList.remove('open');
    input.innerHTML = "";
    //input.blur();
  }
}

