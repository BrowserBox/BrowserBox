{
  const step1 = document.querySelector('.step1');
  const step2 = document.querySelector('.step2');

  addEventListener('load', async load => {
    const storageAccess = await document.hasStorageAccess();
    if ( storageAccess ) {
      location.pathname = "/SPLlogin";
    } else {
      step1.style.display = 'block';
    }
  });

  addEventListener('click', async click => {
    if ( click.target.matches('button#enabler') ) {
      let permResult;
      try {
        permResult = await document.requestStorageAccess(); 
        //confirm('Permissions granted' + permResult);
        click.target.innerText = 'Enabling...';
        location.pathname = "/SPLlogin";
      } catch(e) {
        alert(`Sorry Safari did not grant the permissions.`);
      }
    } else if ( click.target.matches('button#generator') ) {
      click.target.innerText = 'Generating...';
      setTimeout(() => {
        step1.style.display = 'none';    
        step2.style.display = 'block';
      }, 300);
    }
  });
}
