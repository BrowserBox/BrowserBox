import {DEBUG} from '../common.js';
import {s as R, c as X} from '../../node_modules/bang.html/src/vv/vanillaview.js';

  // Auxilliary view functions 
    const RESPONDABLE_MODALS = new Set([
      'alert',
      'confirm',
      'prompt',
      'beforeunload',
      'filechooser',
      'infobox',
      'auth',
      'intentPrompt'
    ]);
    const ModalRef = {
      alert: null, confirm: null, prompt: null, beforeunload: null,
      infobox: null, notice: null, auth: null, filechooser: null,
      intentPrompt: null
    };

  // Modals
    export function Modals(state) {
      DEBUG.debugModal && console.log('Modal', state.viewState.currentModal, new Error('stack').stack);
      try {
        const {currentModal} = state.viewState;
        // these are default values when there is no current Modal
        let msg = '',type = '', title = '', currentModalEl = false;
        let token = '';
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
            token:token = '',
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
          window.addEventListener('beforeunload', requestModalBeClosedFirst);
        } else {
          window.removeEventListener('beforeunload', requestModalBeClosedFirst);
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

        if ( type == 'filechooser' && !(mode && sessionId && token) ) {
          DEBUG.debugModal && console.log(currentModal);
          throw new TypeError(`File chooser modal requires both sessionId, mode and token`);
        }

        if ( mode == 'selectMultiple' ) {
          multiple = true;
        }

        return R`
          <aside class="modals ${currentModal ? 'active' : ''}" stylist="styleModals" click:capture=${click => closeModal(click, state)}>
            <article role=dialog bond=${el => ModalRef.alert = el} class="alert ${
                currentModalEl === ModalRef.alert ? 'open' : '' 
              }">
              <form method=dialog>
                <fieldset>
                  <legend><h1>Alert! &ndash; page says:</h1></legend>
                  <p class=message value=message>${msg||'You are alerted.'}</p>
                  <p>
                    <button class=ok title="OK, I got it." value=ok>Got it.</button>
                  </p>
                </fieldset>
              </form>
            </article>
            <article role=dialog bond=${el => ModalRef.confirm = el} class="confirm ${
                currentModalEl === ModalRef.confirm ? 'open' : '' 
              }">
              <form method=dialog>
                <fieldset>
                  <legend><h1>Confirm &ndash; page asks:</h1></legend>
                  <p class=message value=message>${msg||'You are asked to confirm'}</p>
                  <p>
                    <button class=ok title="Confirm" value=ok>Confirm</button>
                    <button class=cancel title="Deny" value=cancel>Deny</button>
                  </p>
                </fieldset>
              </form>
            </article>
            <article role=dialog bond=${el => ModalRef.prompt = el} class="prompt ${
                currentModalEl === ModalRef.prompt ? 'open' : '' 
              }">
              <form method=dialog>
                <fieldset>
                  <legend><h1>Prompt &ndash; page asks:</h1></legend>
                  <p class=message value=message>${msg||'You are prompted for information:'}</p>
                  <p>
                    <input type=text name=response>
                  </p>
                  <p>
                    <button class=ok title="Send" value=ok>Send</button>
                    <button class=cancel title="Dismiss" value=cancel>Dismiss</button>
                  </p>
                </fieldset>
              </form>
            </article>
            <article role=dialog bond=${el => ModalRef.beforeunload = el} class="beforeunload ${
                currentModalEl === ModalRef.beforeunload ? 'open' : '' 
              }">
              <form method=dialog>
                <fieldset>
                  <legend><h1>The page unloading asks:</h1></legend>
                  <p class=message value=message>${msg||'Are you sure you wish to leave?'}</p>
                  <p>
                    <button class=ok title="Leave" value=ok>Leave</button>
                    <button class=cancel title="Remain" value=cancel>Remain</button>
                  </p>
                </fieldset>
              </form>
            </article>
            <article role=dialog bond=${el => ModalRef.infobox = el} class="infobox ${
                currentModalEl === ModalRef.infobox ? 'open' : '' 
              }">
              <form method=dialog>
                <fieldset>
                  <legend><h1>&#x1f6c8; ${title || 'Info'}</h1></legend>
                  <p>
                    <textarea 
                      readonly class=message value=message rows=${Math.ceil(msg.length/25)+1}
                    >${msg}</textarea>
                  </p>
                  <p>
                    <button class=ok title="Got it" value=ok>OK</button>
                  </p>
                </fieldset>
              </form>
            </article>
            <article role=dialog bond=${el => ModalRef.notice = el} class="notice ${
                currentModalEl === ModalRef.notice ? 'open' : '' 
              }">
              <form method=dialog>
                <fieldset>
                  <legend><h1>&#x1f6c8; ${title || 'Notice'}</h1></legend>
                  <p>
                  <p class=message value=message>${msg||'Empty notice'}</p>
                  <p>
                    <button class=ok title=Acknowledge value=ok>OK</button>
                    ${otherButton ? X`<button title="${otherButton.title}" click=${otherButton.onclick}>${otherButton.title}</button>` : ''}
                  </p>
                </fieldset>
              </form>
            </article>
            <article role=dialog bond=${el => ModalRef.auth = el} class="auth ${
                currentModalEl === ModalRef.auth ? 'open' : '' 
              }">
              <form method=dialog>
                <fieldset>
                  <legend><h1>&#x1f512; ${title || 'Authentication'}</h1></legend>
                  <p class=message value=message>${msg||'Empty notice'}</p>
                  <input type=hidden name=requestid value=${requestId}>
                  <p>
                    <input type=text 
                      autocomplete=username
                      name=username placeholder=username maxlength=140>
                  <p>
                    <input type=password 
                      autocomplete=current-password
                      name=password placeholder=password maxlength=140>
                  <p>
                    <button click=${click => respondWithAuth(click, state)}>Submit</button>
                    <button click=${click => respondWithCancel(click, state)}>Cancel</button>
                </fieldset>
              </form>
            </article>
            <article role=dialog bond=${el => ModalRef.filechooser = el} class="filechooser ${
                currentModalEl === ModalRef.filechooser ? 'open' : '' 
              }">
              <form method=POST action=/file enctype=multipart/form-data>
                <fieldset>
                  <legend><h1>&#x1f4c1; ${title || 'File upload'}</h1></legend>
                  <p class=message value=message>${msg||'Empty notice'}</p>
                  <input type=hidden name=sessionid value=${sessionId}>
                  <input type=hidden name=token value=${token}>
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
                </fieldset>
              </form>
            </article>
            <article role=dialog bond=${el => ModalRef.intentPrompt = el} class="intent-prompt ${
                currentModalEl === ModalRef.intentPrompt ? 'open' : '' 
              }">
              <form method=GET action="${url}" target=_top submit=${submission => {
                  submission.preventDefault(); 
                  const target = CONFIG.useBlankWindowForProtocolLaunch ? 
                    globalThis.window.open("about:blank") 
                    : 
                    window.top
                  ;
                  setTimeout(() => {
                    window._voodoo_noUnloadDelay = true;
                    target.location.href = url;
                    setTimeout(() => window._voodoo_noUnloadDelay = false, 300);
                    DEBUG.debugIntentPrompts && console.log(target.location);
                  }, 300);
                }}>
                <fieldset>
                  <legend><h1>&#x2348; ${title || 'Open app'}</h1></legend>
                  <p class=message value=message>${
                    `This page is asking to open an external app using URL: ${
                      url.slice(0,140) + (url.length > 140 ? '...' : '')
                    }`
                  }</p>
                <p>
                  <button type=reset>Stop it</button>
                  <button>Open external app</button>
                </p>
              </form>
            </article>
          </aside>
        `;
      } catch(e) {
        console.log("Modal error", e);
      }
    }

    function requestModalBeClosedFirst(unload) {
      const message = "Please close the modal first";
      const obj = (unload || window.event);
      if ( obj ) obj.returnValue = message;
      return message;
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
      const resp = await uberFetch(form.action, request).then(r => r.json());
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
      const resp = await uberFetch(form.action, request).then(r => r.json());
      if ( resp.error ) {
        alert(`An error occurred`);
        console.log({resp});
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
      DEBUG.debugAuth && console.log({authResponse});
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
        modalType: 'auth',
        requestId,
        authResponse
      });
      closeModal(click, state);
    }

    export function openModal({modal} = {}, state) {
      const {
          sessionId, mode, requestId, title, type, message:msg, defaultPrompt, url, otherButton,
          token
      } = modal;
      const currentModal = {type, token, mode, requestId, msg,el:ModalRef[type], sessionId, otherButton, title, url};
      state.viewState.currentModal = currentModal;
      localStorage.setItem('lastModal', JSON.stringify(modal));

      DEBUG.debugModal && console.log(state.viewState.currentModal);

      const modalDebug = {
        defaultPrompt, url, currentModal, ModalRef, state, title, type, otherButton, token
      };

      DEBUG.val >= DEBUG.med && Object.assign(self, {modalDebug});

      DEBUG.val >= DEBUG.med && console.log(`Will display modal ${type} with ${msg} on el:`, state.viewState.currentModal.el);

      Modals(state);
    }

    function closeModal(click, state) {
      if ( ! click.target.matches('button') ) return;

      const response = click.target.value || 'close';
      const data = click.target.closest('form')?.response?.value || '';

      const {sessionId} = state.viewState.currentModal;

      state.viewState.lastModal = state.viewState.currentModal;
      state.viewState.lastModal.modalResponse = response;

      const {type:modalType} = state.viewState.lastModal;

      if ( RESPONDABLE_MODALS.has(modalType) ) {
        const modalResponse = {
          synthetic: true,
          modalType,
          type: "respond-to-modal",
          response,
          sessionId,
          [modalType === 'prompt' ? 'promptText': 'data']: data
        };
        DEBUG.debugModal && console.log({modalResponse});
        state.H(modalResponse);
      }
      
      onlyCloseModal(state);
    }

    export function onlyCloseModal(state) {
      state.viewState.currentModal = null;

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

