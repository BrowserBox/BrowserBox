{
  self.onload = () => {
    document
      .querySelector('button.run-action')
      .addEventListener('click', updateStatus)

    const target = new URL(location);
    target.port = parseInt(location.port) + 1;
    self.parent.postMessage({ack:{arrived:true}}, target.origin);
    self.addEventListener('message', async ({data, origin}) => {
      //console.log(JSON.stringify({data,origin}));
      const {viewport} = data;
      if ( origin !== target.origin ) {
        console.warn(`Incorrect origin`, origin);
      }
      if ( viewport ) {
        try {
          const formData = new FormData();
          formData.append('width', viewport.width);
          formData.append('height', viewport.height);
          formData.append('isMobile', viewport.isMobile);
          formData.append('hasTouch', viewport.hasTouch);
          //console.log({viewport});
          const resp = await fetch('/viewport', {
            credentials: 'same-origin',
            method: 'POST',
            body: new URLSearchParams(formData)
          })
          .then(resp => resp.text())
          //.then(txt => console.log({txt}));
          self.parent.postMessage({ack:{viewport:true}}, target.origin);
        } catch(e) {
          console.error(`Issue sending viewport`);
        }
      }
    });
  };
  function updateStatus(click) {
    const statusEl = document.querySelector('#run_status');
    statusEl.innerText = 'running';
    click.target.innerText = 'Running...';
    setTimeout(() => {
      click.target.disabled = true;
    }, 0);
  }
}
