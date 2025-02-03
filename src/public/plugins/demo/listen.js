"use strict";
{
  self.addEventListener('submit', async submission => {
    const action = submission.target.getAttribute('action')
    console.log(`Will submit form data to ${action}`);
    submission.preventDefault();
    try {
      parent.postMessage(
        {
          event: {
            custom: true, 
            command: {
              name: "Demo.formSubmission", 
              params: {}
            },
            type:"demo-submit", 
            action,
            result: await fetch(
              `https://${location.hostname}:8001${action}`,
              {
                method: "POST",
                body: new FormData(submission.target),
                credentials: "include"
              }
            ).then(r => r.text())
          }
        }, 
        '*'
      );
    } catch(e) {
      alert(e + e.stack + location.hostname + action);
    }
  });
  self.addEventListener('click', click => {
    if ( !click.target.matches('a') ) return;
    //console.log(`Will navigate to ${click.target.href}`);
    if ( allowClick(click.target) ) return;
    click.preventDefault();
  });

  function allowClick(anchor) {
    const newContext = anchor.target == "_blank";
    const classOkay = anchor.matches('.zig-click-ds');
    const allow = newContext && classOkay;
    return allow;
  }
}
