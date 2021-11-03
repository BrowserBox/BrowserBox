import {DEBUG} from '../common.js';
import {d as R, u as X} from '../../node_modules/dumbass/r.js';

  // Auxilliary view functions 
    const NATIVE_MODALS = new Set([
      'alert',
      'confirm',
      'prompt',
      'beforeunload'
    ]);
    const ModalRef = {
      alert: null, confirm: null, prompt: null, beforeunload: null,
      infobox: null, notice: null, auth: null, filechooser: null,
      intentPrompt: null
    };

  // Modals
    export function Modals(state) {
      try {
        const {currentModal} = state.viewState;
        // these are default values when there is no current Modal
        let msg = '',type = '', title = '', currentModalEl = false;
        let csrfToken = '';
        let requestId = '';
        let sessionId = '';
        let mode = '';
        let accept = '';
        let multiple = false;
        let submitText = '';
        let cancelText = '';
        let otherButton = null;
        let working = false;
        let url = '';

        if ( currentModal ) {
          // the defaults here are defaults when there *is* a current modal
          ({
            msg:msg = 'Empty',
            type,
            csrfToken:csrfToken = '',
            url:url = '',
            title:title = 'Untitled',
            el:currentModalEl,
            requestId:requestId = '',
            mode:mode = '',
            sessionId:sessionId = '',
            accept: accept = '',
            submitText:submitText = 'Submit',
            cancelText:cancelText = 'Cancel',
            otherButton:otherButton = null,
            working:working = false,
          } = currentModal);
        }

        if ( type == 'intentPrompt' ) {
          if ( ! url ) {
            throw new TypeError(`IntentPrompt modal requires a url`);
          } else {
            const Url = new URL(url);
            if ( Url.protocol == 'intent:' ) {
              if ( ( Url + '').includes('google.com/maps') ) {
                Url.protocol = 'https:';
              }
              url = Url;
            }
          }
        }

        if ( type == 'auth' && ! requestId ) {
          throw new TypeError(`Auth modal requires a requestId to send the response to`);
        }

        if ( type == 'filechooser' && !(mode && sessionId && csrfToken) ) {
          console.log(currentModal);
          throw new TypeError(`File chooser modal requires both sessionId, mode and csrfToken`);
        }

        if ( mode == 'selectMultiple' ) {
          multiple = true;
        }

        return R`
          <aside class="modals ${currentModal ? 'active' : ''}" stylist="styleModals" click=${click => closeModal(click, state)}>
            <article bond=${el => ModalRef.alert = el} class="alert ${
                currentModalEl === ModalRef.alert ? 'open' : '' 
              }">
              <h1>Alert!</h1>
              <p class=message value=message>${msg||'You are alerted.'}</p>
              <button class=ok title=Acknowledge value=ok>Acknowledge</button>
            </article>
            <article bond=${el => ModalRef.confirm = el} class="confirm ${
                currentModalEl === ModalRef.confirm ? 'open' : '' 
              }">
              <h1>Confirm</h1>
              <p class=message value=message>${msg||'You are asked to confirm'}</p>
              <button class=ok title="Confirm" value=ok>Confirm</button>
              <button class=cancel title="Deny" value=cancel>Deny</button>
            </article>
            <article bond=${el => ModalRef.prompt = el} class="prompt ${
                currentModalEl === ModalRef.prompt ? 'open' : '' 
              }">
              <h1>Prompt</h1>
              <p class=message value=message>${msg||'You are prompted for information:'}</p>
              <p><input type=text name=response>
              <button class=ok title="Send" value=ok>Send</button>
              <button class=cancel title="Dismiss" value=cancel>Dismiss</button>
            </article>
            <article bond=${el => ModalRef.beforeunload = el} class="beforeunload ${
                currentModalEl === ModalRef.beforeunload ? 'open' : '' 
              }">
              <h1>Page unloading</h1>
              <p class=message value=message>${msg||'Are you sure you wish to leave?'}</p>
              <button class=ok title="Leave" value=ok>Leave</button>
              <button class=cancel title="Remain" value=cancel>Remain</button>
            </article>
            <article bond=${el => ModalRef.infobox = el} class="infobox ${
                currentModalEl === ModalRef.infobox ? 'open' : '' 
              }">
              <h1>${title || 'Info'}</h1>
              <textarea 
                readonly class=message value=message rows=${Math.ceil(msg.length/80)}
              >${msg}</textarea>
              <button class=ok title="Got it" value=ok>OK</button>
            </article>
            <article bond=${el => ModalRef.notice = el} class="notice ${
                currentModalEl === ModalRef.notice ? 'open' : '' 
              }">
              <h1>${title}</h1>
              <p class=message value=message>${msg||'Empty notice'}</p>
              <button class=ok title=Acknowledge value=ok>OK</button>
              ${otherButton ? X`<button title="${otherButton.title}" click=${otherButton.onclick}>${otherButton.title}</button>` : ''}
            </article>
            <article bond=${el => ModalRef.auth = el} class="auth ${
                currentModalEl === ModalRef.auth ? 'open' : '' 
              }">
              <h1>${title}</h1>
              <form>
                <p class=message value=message>${msg||'Empty notice'}</p>
                <input type=hidden name=requestid value=${requestId}>
                <p>
                  <input type=text name=username placeholder=username maxlength=140>
                <p>
                  <input type=password name=password placeholder=password maxlength=140>
                <p>
                  <button click=${click => respondWithAuth(click, state)}>Submit</button>
                  <button click=${click => respondWithCancel(click, state)}>Cancel</button>
              </form>
            </article>
            <article bond=${el => ModalRef.filechooser = el} class="filechooser ${
                currentModalEl === ModalRef.filechooser ? 'open' : '' 
              }">
              <h1>${title}</h1>
              <form method=POST action=/file enctype=multipart/form-data>
                <p class=message value=message>${msg||'Empty notice'}</p>
                <input type=hidden name=sessionid value=${sessionId}>
                <input type=hidden name=_csrf value=${csrfToken}>
                <p>
                  <label>
                    Select ${multiple?'one or more files':'one file'}.
                    <input type=file name=files ${multiple?'multiple':''} accept="${accept}">
                  </label>
                <p>
                  <button 
                    ${working?'disabled':''} 
                    click=${click => chooseFile(click, state)}
                  >${submitText}</button>
                  <button 
                    ${working?'disabled':''} 
                    click=${click => cancelFileChooser(click, state)}
                  >${cancelText}</button>
              </form>
            </article>
            <article bond=${el => ModalRef.intentPrompt = el} class="intent-prompt ${
                currentModalEl === ModalRef.intentPrompt ? 'open' : '' 
              }">
              <h1>${title}</h1>
              <form method=GET action="${url}" target=_top submit=${submission => {
                submission.preventDefault(); 
                window.top.open(url);
              }}>
                <p class=message value=message>${
                  `This page is asking to open an external app using URL: ${url}`
                }</p>
                <p>
                  <button type=reset>Stop it</button>
                  <button>Open external app</button>
              </form>
            </article>
          </aside>
        `;
      } catch(e) {
        console.log("Modal error", e);
      }
    }

    async function chooseFile(click, state) {
      click.preventDefault();
      click.stopPropagation();
      const form = click.target.closest('form');
      const body = new FormData(form);
      const request = { 
        method: form.method,
        body
      };
      Object.assign(state.viewState.currentModal, {
        submitText: 'Uploading...',
        working: true
      });
      Modals(state);
      const resp = await fetch(form.action, request).then(r => r.json());
      if ( resp.error ) {
        alert(resp.error);
      } else {
        DEBUG.val && console.log(`Success attached files`, resp); 
      }
      closeModal(click, state);
    }

    async function cancelFileChooser(click, state) {
      click.preventDefault();
      click.stopPropagation();
      const form = click.target.closest('form');
      form.reset();
      const body = new FormData(form);
      body.delete('files');
      const request = { 
        method: form.method,
        body
      };
      Object.assign(state.viewState.currentModal, {
        cancelText: 'Canceling...',
        working: true
      });
      Modals(state);
      const resp = await fetch(form.action, request).then(r => r.json());
      if ( resp.error ) {
        alert(`An error occurred`);
      } else {
        DEBUG.val && console.log(`Success cancelling file attachment`, resp); 
      }
      closeModal(click, state);
    }

    function respondWithAuth(click, state) {
      click.preventDefault();
      click.stopPropagation();
      const form = click.target.closest('form'); 
      const data = new FormData(form);
      const requestId = data.get('requestid').slice(0,140);
      const username = data.get('username').slice(0,140);
      const password = data.get('password').slice(0,140);
      const authResponse = {
        username, 
        password,
        response: "ProvideCredentials"
      };
      state.H({
        synthetic: true,
        type: 'auth-response',
        requestId,
        authResponse
      });
      closeModal(click, state);
    }

    function respondWithCancel(click, state) {
      click.preventDefault();
      click.stopPropagation();
      const form = click.target.closest('form'); 
      const data = new FormData(form);
      const requestId = data.get('requestid').slice(0,140);
      const authResponse = {
        response: "CancelAuth"
      };
      state.H({
        synthetic: true,
        type: 'auth-response',
        requestId,
        authResponse
      });
      closeModal(click, state);
    }

    export function openModal({modal:{
          sessionId, mode, requestId, title, type, message:msg, defaultPrompt, url, otherButton,
          csrfToken
        }} = {}, state) {
      const currentModal = {type, csrfToken, mode, requestId, msg,el:ModalRef[type], sessionId, otherButton, title, url};
      state.viewState.currentModal = currentModal;

      //console.log(state.viewState.currentModal);

      const modalDebug = {
        defaultPrompt, url, currentModal, ModalRef, state, title, type, otherButton, csrfToken
      };

      DEBUG.val >= DEBUG.med && Object.assign(self, {modalDebug});

      DEBUG.val >= DEBUG.med && console.log(`Will display modal ${type} with ${msg} on el:`, state.viewState.currentModal.el);

      Modals(state);
    }

    function closeModal(click, state) {
      if ( ! click.target.matches('button') ) return;

      const response = click.target.value || 'unknown';

      const {sessionId} = state.viewState.currentModal;

      state.viewState.lastModal = state.viewState.currentModal;
      state.viewState.currentModal = null;
      state.viewState.lastModal.modalResponse = response;

      if ( NATIVE_MODALS.has(state.viewState.lastModal.type) ) {
        console.log(state.viewState);
        state.H({
          synthetic: true,
          type: "respond-to-modal",
          response,
          sessionId
        });
      }
      
      setTimeout(() => Modals(state), 50);
    }

  // Permission request
    export function PermissionRequest({
      permission, request, page
    }) {
      return R`
        <article class="permission-request hidden">
          <h1>${permission}</h1>
          <p class=request>${page} is requesting ${permission} permission. The details are: ${request}</p>
          <button class=grant>Grant</button>
          <button class=deny>Deny</button>
        </article>
      `;
    }

