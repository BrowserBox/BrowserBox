{
  // shim key elements of the chrome extension API 
  let messageId = 0;

  const Listeners = {
    action: new Set(),
  };

  globalThis.__hear = command => {
    console.log(`Extension injection received command`, command);
    switch(command.name) {
      case "actionOnClicked": {
        Listeners.action.forEach(listener => {
          try {
            listener(command.params);
          } catch(e) {
            console.warn(`Error executing listener on command actionOnClick`, e, {listener}, {command});
          }
        });
      }; break;
    }
  };

  const OG_AOCAL = chrome.action.onClicked.addListener;
  chrome.action.onClicked.addListener = listener => {
    console.log(`Received function`, listener, `for execution on Action click`);
    Listeners.action.add(listener);
  };

  chrome.windows.create = (opts, cb) => {
    say({createTab:{opts}});
  };

  function say(o) {
    o.messageId = messageId++;
    console.log(JSON.stringify(o));
  }



}
