// imports
  import {log, logError} from './helpers.js';

// convenience constant for empty strings
  const _ = '';
  const DEBUG = false;

// render different views
  export function App(state) {
    let currentView;

    switch(state.route) {
      case 'settings':  currentView = Settings;     break;
      default:
      case 'chat':      currentView = Chat;         break;
    }

    return `
      <article class=app>
        <nav class=routes>
          <a href=#${state.route === 'chat' ? 'settings' : 'chat'} onpointerup=reroute(event);
          >${state.route === 'chat' ? 'Settings' : 'Close settings'}</a>
        </nav>
        ${currentView(state)}
      </article>
    `
  }

  function Chat(state) {
    let sendhotkey = '';

    if ( state.settings.sendhotkey == 'enter' ) {
      sendhotkey = `onkeydown="switchOnKey(event);"`;
    }

    return `
      <ul class=chat>
      ${state.chat.messages.map(msg => 
        ChatMessage(msg, state.settings.timeformat)
      ).join('\n')}
      </ul>
      <form class=messager onsubmit=sendMessage(event); ${sendhotkey}>
        <textarea required class=composer
          aria-label="Message composer" 
          maxlength=1200
          name=message placeholder="Enter message"></textarea>
        <button aria-label="Send message">Send</button>
      </form>
    `;
  }

  function Settings(state) {
    const {settings: {
      username,
      colorscheme,
      timeformat,
      sendhotkey,
      language
    }} = state;

    const legend = state.view.saySettingsSaved ? 'Saved' : 
      state.view.saySettingsError ? `Settings error: ${state.lastError}` : '';

    // convenience for form control boolean attributes
    const C = 'checked', S = 'selected';

    return `
      <form id=settings class=settings onreset=saveSettings(event); onchange=saveSettings(event);>
        <fieldset name=notification>
          <legend>${legend}</legend>
          <p>
            <label>
              User name
              <br>
              <input type=text name=username maxlength=40 placeholder="guest0001" value="${safe(username)}">
            </label>
          <p>
            <label>
              Interface color
            </label>
            <br>
            <label>
              <input type=radio name=colorscheme value=light 
                ${colorscheme == 'light' ? C : _}>
              Light
            </label>
            <label>
              <input type=radio name=colorscheme value=dark 
                ${colorscheme == 'dark' ? C : _}>
              Dark
            </label>
          <p>
            <label>
              Clock display
            </label>
            <br>
            <label>
              <input type=radio name=timeformat value=ampm 
                ${timeformat == 'ampm' ? C : _}>
              12 Hours
            </label>
            <label>
              <input type=radio name=timeformat value=military 
                ${timeformat == 'military' ? C : _}>
              24 Hours
            </label>
          <p>
            <label> 
              Send messages on <kbd>ENTER</kbd> (newline on <kbd>CTRL</kbd>+<kbd>ENTER</kbd>)
            </label>
            <br>
            <label>
              <input type=radio name=sendhotkey value=enter 
                ${sendhotkey == 'enter' ? C : _}>
              On
            </label>
            <label>
              <input type=radio name=sendhotkey value=none 
                ${sendhotkey == 'none' ? C : _}>
              Off
            </label>
          <p>
            <label>
              Language
              <br>
              <select name=language>
                <option ${language == 'en' ? S : _} value=en>English</option>
              </select>
            </label>
        </fieldset>
      </form>
      <button class=defaults type=reset form=settings>Reset to defaults</button>
    `;

    // note the value attributes of language <option>s above 
    // need to be valid codes that can be applied to html.lang attribute 
  }

  export function ChatMessage({message, at, newUsername, username, memberCount, error, disconnection, fromMe, viewType}, timeformat) {
    let iso8601 = '?';
    let fullTime = '?';
    try {
      iso8601 = new Date(at).toISOString();
      fullTime = getClockTime(at, timeformat);
    } catch(e) {
      logError({message:`Could not convert message time`, e, at});
      console.warn(e, at);
      if ( DEBUG ) {
        try {
          console.log(`Errorneous message:`);
          console.log(arguments[0].data.map(code => String.fromCharCode(code)).join(''));
        } catch(e2) {
          console.log(arguments);  
        }
      } 
    }

    switch(viewType) {
      case 'note.error':
        return `
          <li class=room-note> 
            <q>${safe(error)}</q>
            <div class=metadata>
              <cite rel=author>system</cite>
              <time datetime=${iso8601}>${fullTime}</time>
            </div>
          </li>
        `;
      case 'note.nameChange':
        return `
          <li class=room-note> 
            <q>${safe(username)} changed their name to ${safe(newUsername)}</q>
            <div class=metadata>
              <cite rel=author>system</cite>
              <time datetime=${iso8601}>${fullTime}</time>
            </div>
          </li>
        `;
      case 'note.newMember':
        return `
          <li class=room-note> 
            <q>
              ${safe(newUsername)} entered the room.
              <br>
              ${safe(memberCount)} total members.
            </q>
            <div class=metadata>
              <cite rel=author>system</cite>
              <time datetime=${iso8601}>${fullTime}</time>
            </div>
          </li>
        `;
      case 'note.disconnection':
        return `
          <li class=room-note> 
            <q>${safe(username)} left the room.</q>
            <div class=metadata>
              <cite rel=author>system</cite>
              <time datetime=${iso8601}>${fullTime}</time>
            </div>
          </li>
        `;
      case 'chat.message':
        return `
          <li class="message ${fromMe? 'from-me' : ''}">
            <q>${safe(message)}</q>
            <div class=metadata>
              ${fromMe ? `
                <time datetime=${iso8601}>${fullTime}</time>
                <cite rel=author>${safe(username)}</cite>
              ` : `
                <cite rel=author>${safe(username)}</cite>
                <time datetime=${iso8601}>${fullTime}</time>
              `}
            </div>
          </li>
        `;
      default:
      case 'log.unknownMessageType':
        log({unknownMessageType: {message, at, newUsername, username, disconnection, fromMe, viewType}});
        return `
          <li class=room-note> 
            <q>Error: Unknown message type: ${safe(message)}</q>
            <div class=metadata>
              <cite rel=author>system</cite>
              <time datetime=${iso8601}>${fullTime}</time>
            </div>
          </li>
        `;
        break;
    }
  }


  // a view function for document.title
    // this may seem strange but it keeps
    // consistency with the idea of the view (markup + other stuff including title)
    // is a function of state 
  export function AppTitle (state) {
    let title = 'Chat App';

    if ( state.route ) {
      title += ` - ${state.route}`;
    }

    if ( state.view.showUnreadCount && state.chat.unreadCount ) {
      title = `(${state.chat.unreadCount}) ` + title;
    }

    return title;
  }

// helpers
  // format timestamp into a 12 or 24 clock time 
  function getClockTime(timestamp, mode) {
    const dateAt = new Date(timestamp);
    let hour = dateAt.getHours();
    let minute = dateAt.getMinutes();
    let hourStr, minuteStr, half = '';

    if ( mode == 'ampm' ) {
      half = 'AM';
      if ( hour > 12 ) {
        hour -= 12;
        half = 'PM';
      } else if ( hour == 12 ) {
        half = 'PM';
      }
      hourStr = hour.toString();
    } else {
      hourStr = hour.toString().padStart(2, '0');
    }

    minuteStr = minute.toString().padStart(2, '0');

    return `${hourStr}:${minuteStr} ${half}`;
  }

  // mitigate XSS
  function safe(userContent = '') {
    return (userContent+'').replace(/"/g, '&quot;').replace(/>/g, '&gt;').replace(/</g, '&lt;');
  }

