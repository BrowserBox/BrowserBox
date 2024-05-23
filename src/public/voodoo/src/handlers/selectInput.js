export function handleSelectMessage({selectInput:{selectOpen, values, selected}, executionContextUniqueId}, state) {
  state.waitingExecutionContext = executionContextUniqueId;
  if ( state.ignoreSelectInputEvents ) return;
  toggleSelect({selectOpen,values, selected});
}

function toggleSelect({selectOpen, values, selected}) {
  try {
    const input = document.querySelector('bb-view').shadowRoot.querySelector('#selectinput');
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
  } catch(e) {
    console.warn`Select error ${e}`;
  }
}

