// imports
  import * as Views from './views.js';
  import * as Config from './config.js';
  import {
    newName,
    merge, 
    update, 
    toDOM,
    clone, 
    log, 
    logError
  } from './helpers.js';

// declarations
  // useful constants
    const FORBIDDEN_NAMES = new Set([
      "system"
    ]);

    const TOP = new URL(location);
    TOP.port = parseInt(location.port) - 2;

    const inlineEventHandlerFunctions = {
      sendMessage, saveSettings, switchOnKey, reroute
    };

    const Routes = new Set([
      'chat',
      'settings'
    ]);

  // state constants 
    const DefaultSettings = {
      username: newName(),
      colorscheme: 'light',
      timeformat: 'ampm',
      sendhotkey: 'enter',
      language: 'en'
    };

    const State = {
      settings: clone(DefaultSettings),
      lastError: null,
      chat: {
        unreadCount: 0,
        messages: []
      },
      view : {
        saySettingsSaved: false,
        saySettingsError: false,
        showUnreadCount: false
      }
    };

  // module scoped variables
    let reconnectDelay = Config.InitialReconnectDelay;
    let socket;

loadChatApp();

// start the app
  function loadChatApp() {
    loadSettings();
    addRouteHandler();
    installUnreadBlinker();

    Object.assign(self, inlineEventHandlerFunctions);
    // Notes
      // we will call these functions
      // from inline event handlers (e.g <a onclick="...) 
      // And to be accessible in those handlers, they needed to be in global scope

    // render existing route at startup
    drawRoute({newURL:location.href+''});

    connectToServer();
  }

// draw the app
  // main draw function
  function draw(newState = {}) {
    merge(State, clone(newState));

    update(Views.App, State);

    // restore chat scroll position after route change
    drawScrollPosition();
  }

  // functions for rendering stuff outside <body>, or stuff that is not an Element
    function drawTitle(newState = {}) {
      merge(State, clone(newState));
      document.title = Views.AppTitle(State);
    }

    function drawLatestMessage() {
      if ( State.route == 'chat' ) {
        const data = State.chat.messages[State.chat.messages.length-1];
        const list = document.querySelector('ul.chat');
        const messageDom = toDOM(Views.ChatMessage(data)).querySelector('li');

        list.insertAdjacentElement('beforeend', messageDom);

        // if I sent the message or if we not above the 'last page' of messages
        if ( data.fromMe || (list.scrollHeight - list.scrollTop) <= 1.618*list.clientHeight ) {
          // scroll that latest message into view
          setTimeout(() => messageDom.scrollIntoView(), 0);
          // the timeout ensures that we scroll into view after any IME is opened
        }
      }
    }

    function drawLanguage() {
      document.documentElement.lang = State.settings.language;
    }

    function drawScrollPosition() {
      if ( State.route == 'chat' ) {
        const list = document.querySelector('ul.chat');
        list.scrollTop = State.view.chatScrollTop == undefined ? list.scrollHeight : State.view.chatScrollTop;
      }
    }

    function drawColorScheme(newSettings, oldSettings) {
      const doc = document.documentElement;
      if ( oldSettings ) {
        doc.classList.remove(oldSettings.colorscheme);
      }
      doc.classList.add(newSettings.colorscheme);
    }

// change route when hash fragment changes
  function reroute(event) {
    //console.log(event, State);
    return true;
  }

  function addRouteHandler() {
    self.onhashchange = drawRoute;
  }

  function drawRoute({newURL}) {
    const route = (new URL(newURL)).hash.slice(1);

    if ( ! route || ! Routes.has(route) ) {
      // chat is the default route
      return location.hash = '#chat';
    }

    if ( route == 'settings' ) {
      loadSettings();
    }

    // save chat scroll position
    if ( State.route == 'chat' ) {
      State.view.chatScrollTop = document.querySelector('ul.chat').scrollTop;
    } 

    draw({route});
    drawTitle();
    // title also depends on the route
    broadcastReadability();
  }

// communicate over websocket
  function connectToServer() {
    const ws = new WebSocket(`wss://${location.host}/`);

    ws.binaryType = "arraybuffer";

    ws.onmessage = receiveMessage;

    ws.onopen = () => {
      log({websocketConnected:ws.url});
      // let the server know we are here, and our preferred username
      send({code:Config.myCode,newUsername:State.settings.username});
    };

    ws.onclose = ws.onerror = c => {
      logError({message: 'No connection to server. Reconnecting...', event: c});
      errorMessage({message: 'No connection to server. Reconnecting...', event: c, error: new Error(`No connection to server. Reconnecting...`)});
      setTimeout(connectToServer, reconnectDelay *= Config.ExponentialBackoff);
    }

    socket = ws;
  }

  function receiveMessage(messageEvent, errors = true) {
    let {data} = messageEvent;

    try {
      data = JSON.parse(data);
      if ( data.error ) { 
        logError({message: data.error, error: data.error});
        if ( errors ) {
          errorMessage({message: data.error, error: data.error});
        }
      }
    } catch(e) {
      logError({exception:e, data});
      if ( errors ) {
        errorMessage({exception:e, data});
      }
    }

    if ( messagesUnreadable() ) {
      State.chat.unreadCount += 1;
      parent.parent.postMessage({
        multiplayer: {
          messageReceived: true
        }
      }, TOP.origin);
    } else {
      State.chat.unreadCount = 0;
    }

    // if server has updated my username to an unused one
    if ( data.newUsername && data.automaticUpdate && data.code == Config.myCode ) {
      // persist the new username it to my settings
      if ( allowedName(data.newUsername) ) {
        persist({username:data.newUsername});
      } else {
        logError({message:`Name is reserved.`, error: new Error(`Name is reserved`)});
        if ( errors ) {
          errorMessage({message:`Name is reserved.`, error: new Error(`Name is reserved`)});
        }
      }
    }

    // messages with 'fromMe' go on my side of the chat
    if ( data.username == State.settings.username ) {
      data.fromMe = true;
    }

    // work out the format to display this message (and save it)
    data.viewType = computeViewType(data);

    merge(State, {
      'chat.messages': State.chat.messages.concat([data])
    });

    // even tho drawing a single message breaks our notion 'render the whole tree at once'
    // it works well for performance and prevents textarea input bugs
    drawLatestMessage();
  }

  function broadcastReadability() {
    parent.parent.postMessage({
      multiplayer: {
        chatRoute: State.route === 'chat'
      }
    }, TOP.origin);
  }

  function sendMessage(submission) {
    const form = submission.target.closest('form'); 
    const {message:{value:message}} = form;

    if ( submission.type == 'submit' ) {
      submission.preventDefault();
    }

    const data = {
      message
    };

    if( data.message.trim().length == 0 ) {
      if ( ! Config.APP_TESTING ) {
        alert(`What would you like to say?`); 
      }
      return;
    }

    try {
      send(data);
      form.message.value = '';
      form.message.focus();
    } catch(e) {
      logError({message:`Error sending message`, data, exception:e});
      errorMessage({message:`Error sending message`, data, exception:e});
    }
  }

  function switchOnKey(event) {
    if ( event.code == 'Enter' ) {
      if ( event.ctrlKey ) {
        event.target.value += "\n"; 
        event.target.selectionEnd = Array.from(event.target.value).length;
      } else {
        event.preventDefault();
        sendMessage(event);
      }
    }
  }

  function send(o) {
    socket.send(JSON.stringify(o));
  }

// save and load settings
  function saveSettings(event) {
    if ( event.type == 'submit' || event.type == 'reset' ) {
      event.preventDefault();
    } 

    let newSettings = clone(DefaultSettings);
    
    if ( event.type == 'reset' ) {
      if ( ! Config.APP_TESTING ) {
        const proceed = confirm(`This resets your settings to defaults. Are you sure?`);
        if ( ! proceed ) return;
      }
    } else {
      const formData = new FormData(event.currentTarget);

      for( const [key, value] of formData.entries() ) {
        newSettings[key] = value;
      }

      // fix empty username
      if ( newSettings.username == '' ) {
        logError({message:'Empty username'});
        errorMessage({message:'Empty username', error: new Error(`Empty username`)});
        event.currentTarget.username.value = newSettings.username = newName();
        if ( ! Config.APP_TESTING ) {
          alert(`Username can't be empty`);
        }
      }
    }

    // server tracks usernames, so we need to send a change
    if ( newSettings.username != State.settings.username ) {
      if ( allowedName(newSettings.username) ) {
        send({code:Config.myCode, newUsername: newSettings.username});
      } else {
        const err = new Error(`Name is forbidden`);
        errorMessage({message: `Name is forbidden.`, error: err});
        draw({'view.saySettingsError': true});
        setTimeout(() => draw({'view.saySettingsError': false}), 1618);
        return;
      }
    }

    log({newSettings});

    drawLanguage();
    drawColorScheme(newSettings, State.settings);

    persist(newSettings);

    // say we saved settings
    draw({'view.saySettingsSaved': true});
    setTimeout(() => draw({'view.saySettingsSaved': false}), 1618);
  }

  function loadSettings() {
    const storedSettings = localStorage.getItem('app-settings');
    let settings;
    
    if ( storedSettings ) {
      try {
        settings = JSON.parse(storedSettings);
      } catch(e) {
        logError({storedSettings, exception:e});
      }
    }

    if ( ! settings ) {
      settings = clone(DefaultSettings);
    }

    // we are loading settings so it's ok to overwrite
    Object.assign(State.settings, settings);

    // some settings we need to apply (they will not be drawn with render)
    drawColorScheme(State.settings);
    drawLanguage();
  }

  function persist(newSettings) {
    merge(State.settings, newSettings);
    localStorage.setItem('app-settings', JSON.stringify(State.settings));
  }

// title blinker
  function installUnreadBlinker() {
    let animate = false;

    document.onvisibilitychange = animateTitle;
    self.addEventListener('hashchange', animateTitle);

    animateTitle();
    
    function animateTitle() {
      if ( messagesUnreadable() ) {
        animate = true;
        showUnreadInTitle();
      } else {
        animate = false; 
        drawTitle({
          'chat.unreadCount' : 0,
          'view.showUnreadCount' : false
        });
      }
    }

    function showUnreadInTitle() {
      if ( State.chat.unreadCount ) drawTitle({'view.showUnreadCount': true});
      if ( animate ) setTimeout(clearUnreadFromTitle, 1000);
    }

    function clearUnreadFromTitle() {
      if ( State.view.showUnreadCount ) drawTitle({'view.showUnreadCount': false});
      if ( animate ) setTimeout(showUnreadInTitle, 500);
    }
  }

// helpers
  function errorMessage({message, error, event} = {}) {
    console.warn(`Error message`, {message,error,event});
    State.lastError = error;
    receiveMessage({data:{message,error,event, at:Date.now()}}, false);
  }

  // is the chat view invisible?
  function allowedName(name) {
    return !FORBIDDEN_NAMES.has(name);
  }

  function messagesUnreadable() {
    return State.route != 'chat' || document.visibilityState !== 'visible';
  }

  // when a message arrives determine the view to use
  function computeViewType({error, message, newUsername, username, disconnection}) {
    const viewType = 
      error ?                                               'note.error' :
      disconnection ?                                       'note.disconnection' :
      newUsername && username && username != newUsername ?  'note.nameChange' :
      newUsername ?                                         'note.newMember' : 
      message ?                                             'chat.message' :
                                                            'log.unknownMessageType'
    ;

    // if we had the server do this
    // client view logic and server logic would be coupled
    // so we do it here

    return viewType;
  }

