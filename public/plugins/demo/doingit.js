function installFormSubmitButtonHandler() {
  const forms = document.querySelectorAll('form'); 
  forms.forEach(form => form.addEventListener('submit', e => {
    const button = form.querySelector('button');
    button.disabled = true;
    button.innerText = 'Doing it...';
  }, {passive:true}));
}
