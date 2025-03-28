class BBModal extends Base {
  static MICRO_SLEEP = 30;
  RESPONDABLE_MODALS = new Set([
    'alert',
    'confirm',
    'prompt',
    'paste',
    'beforeunload',
    'filechooser',
    'infobox',
    'auth',
    'intentPrompt',
    'settings'
  ]);

  constructor() {
    super();

    this.unloadHandler = this.requestModalBeClosedFirst.bind(this);
    this.prepareState();
  }

  prepareState(currentModal) {
    const state = this.state;
    state._top.DEBUG.debugModal && console.log(`Call stack`, (new Error).stack);
    //super.prepareState();
    // these are default values when there is no current Modal
    let msg = '';
    let type = '';
    let title = '';
    let currentModalEl = false;
    let highlight = undefined;
    let token = '';
    let requestId = '';
    let sessionId = '';
    let mode = '';
    let accept = '';
    let multiple = false;
    let submitText = '';
    let cancelText = '';
    let otherButton = null;
    let link = null;
    let working = false;
    let url = '';

    if ( currentModal ) {
      // the defaults here are defaults when there *is* a current modal
      state._top.DEBUG.debugModal && console.log(`Prepare`, {currentModal});
      ({
        msg:msg = '2 Empty',
        type,
        highlight: highlight = false,
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
        link:link = null,
        working:working = false,
      } = currentModal);
      window.addEventListener('beforeunload', this.unloadHandler);
    } else {
      window.removeEventListener('beforeunload', this.unloadHandler);
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
      console.log({mode,sessionId,token});
      state._top.DEBUG.debugModal && console.log(currentModal);
      throw new TypeError(`File chooser modal requires all of: sessionId, mode and token`);
    }

    // we are getting this now via async fetch inside the HTML template ahahah
    /*
    if ( type == 'settings' && !token ) {
      DEBUG.debugModal && console.log(currentModal);
      throw new TypeError(`Settings modal requires a token`);
    }
    */

    if ( mode == 'selectMultiple' ) {
      multiple = true;
    }

    currentModal = {
      type, token, mode, requestId, msg,
      highlight,
      el: state.viewState.ModalRef[type], 
      sessionId, otherButton, title, url, multiple, accept,
      link,
      working, submitText, cancelText,
    };

    state._top.DEBUG.debugModal && console.log('after prepare state', {currentModal}, '(also "others" state mixin)');

    this.others = currentModal;
  }

  async openModal({modal} = {}) {
    if ( this.opening ) return;
    this.opening = true;
    const state = this.state;
    const {ModalRef} = state.viewState;
    const {
      sessionId, mode, requestId, title, type, message:msg, defaultPrompt, url, 
      link,
      highlight,
      token,
    } = modal;
    let {
      otherButton,
    } = modal;
    if ( !ModalRef[type] ) { 
      DEBUG.debugModal && console.warn(`Waiting until modal type ${type} has its element loaded...`);
    }
    await state._top.untilTrue(() => !!ModalRef[type], 100, 1000);
    let currentModal = {
      type, token, mode, 
      highlight, 
      requestId, 
      msg,
      el:ModalRef[type], 
      sessionId, 
      otherButton, 
      link,
      title, url
    };
    state.viewState.currentModal = currentModal;
    localStorage.setItem('lastModal', JSON.stringify(modal));

    DEBUG.debugModal && console.log(state.viewState.currentModal);

    /*
    while( state?.viewState?.currentModal?.el !== state?.viewState?.ModalRef?.notice ) {
      DEBUG.debugModal && console.log(`Sleeping ${BBModal.MICRO_SLEEP} while we wait for state to be set...`);
      this.state = state;
      await sleep(BBModal.MICRO_SLEEP);
    }
    */

    //DEBUG.debugModal && alert(`Modal should be shown`);
    setTimeout(async () => {
      if ( type == 'copy' ) {
        //this.copyBoxTextarea.select();
        let secondTitle = '';
        try {
          DEBUG.debugClipboard && console.log(`Trying to copy`);
          await navigator.clipboard.writeText(this.copyBoxTextarea.value);
          DEBUG.debugClipboard && console.info(`Copied to clipboard`);
          secondTitle = ' - Copied to Clipboard!';
        } catch(e) {
          DEBUG.debugClipboard && console.warn(`Could not copy to clipboard`, title);
          this.latestCopyValue = this.copyBoxTextarea.value;
          otherButton = {
            title: 'Copy',
            onClick: 'copyToClipboard',
          };
          secondTitle = ' - Click Copy';
        }
        currentModal = {
          type, token, mode, 
          highlight, 
          requestId, 
          msg,
          el:ModalRef[type], 
          sessionId, 
          otherButton, 
          link,
          title: title + secondTitle,
          url
        };
        state.viewState.currentModal = currentModal;
        this.prepareState(currentModal);
        // weird hack don't know why we need this
        this.copyBoxTitle.innerText = title + secondTitle;
        this.state = state;
      }
    }, 32);
    const modalDebug = {
      defaultPrompt, url, highlight, currentModal, ModalRef, state, title, type, otherButton, token,
      link,
    };

    (DEBUG.debugModal || (DEBUG.val >= DEBUG.med)) && Object.assign(self, {modalDebug});

    (DEBUG.debugModal || (DEBUG.val >= DEBUG.med)) && console.log(`Will display modal ${type} with ${msg} on el:`, state.viewState.currentModal.el);
    this.state = state;
  }

  copyToClipboard(event) {
    // stop the modal from being closed by clicking this
    event.stopPropagation();
    // try to copy to clipboard
    navigator.clipboard.writeText(this.latestCopyValue).then(
      () => this.copyBoxTitle.innerText = 'Copied to Clipboard!'
    ).catch(
      () => this.copyBoxTitle.innerText = 'Copy failed. Please manually copy.'
    );
  }

  closeModal(click) {
    const state = this.state;
    if ( ! click.target.matches('button') || ! state.viewState.currentModal ) return;

    const response = click.target.value || 'close';
    const data = click.target.closest('form')?.response?.value || '';

    const {sessionId, type} = state.viewState.currentModal;

    state.viewState.lastModal = state.viewState.currentModal;
    state.viewState.lastModal.modalResponse = response;

    const {type:modalType} = state.viewState.lastModal;

    if ( this.RESPONDABLE_MODALS.has(modalType) ) {
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
    
    this.onlyCloseModal();
  }

  onlyCloseModal() {
    const {state} = this;

    state.viewState.currentModal = null;

    this.opening = false;

    setTimeout(() => this.state = state, 50);
  }

  respondWithAuth(click) {
    const {state} = this;
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
    this.closeModal(click);
  }

  sendPaste(click) {
    const {state} = this;
    click.preventDefault();
    click.stopPropagation();
    const modals = this;
    const form = click.target.closest('form'); 
    const data = new FormData(form);
    const pasteText = data.get('response').slice(0,32000);
    sendPasteData(pasteText);

    function sendPasteData(pasteData) {
      const input = state.viewState.shouldHaveFocus;
      if ( ! input ) return;
      const value = input.value;
      const newValue = value.slice(0, input.selectionStart) + pasteData + value.slice(input.selectionEnd);
      input.value = newValue;
      input.selectionStart = input.selectionEnd;
      if ( document.deepActiveElement !== input ) {
        input.focus();
      }
      state.H({
        type: 'typing',
        data: pasteData,
        synthetic: true,
        event: {paste: true, simulated: true}
      });
      setTimeout(() => {
        state.checkResults();
      }, 300);
      modals.closeModal(click);
    }
  }

  respondWithCancel(click) {
    const {state} = this;
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
    this.closeModal(click);
  }
  
  async chooseFile(click) {
    const {state} = this;
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
    this.prepareState(state.viewState.currentModal);
    this.state = state;
    try {
      const resp = await uberFetch(form.action, request).then(r => r.json());
      if ( resp.error ) {
        alert(resp.error);
      } else {
        DEBUG.val && console.log(`Success attached files`, resp); 
        DEBUG.val && console.log({resp});
      }
    } catch(e) {
      console.warn("Error on file upload", e);
    }
    this.onlyCloseModal(click);
  }

  async cancelFileChooser(click) {
    const {state} = this;
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
    this.prepareState(state.viewState.currentModal);
    this.state = state;
    const resp = await uberFetch(form.action, request).then(r => r.json());
    if ( resp.error ) {
      alert(`An error occurred`);
      console.log({resp});
    } else {
      DEBUG.val && console.log(`Success cancelling file attachment`, resp); 
      console.log({resp});
    }
    this.onlyCloseModal(click);
  }

  requestModalBeClosedFirst(unload) {
    const {state} = this;
    if ( state.viewState.currentModal ) {
      const message = "Please close the modal first";
      const obj = (unload || window.event);
      obj?.preventDefault?.();
      if ( obj ) obj.returnValue = message;
      return message;
    }
  }

  oldsetup() {
    // Auxilliary view functions 
      const ModalRef = {
        alert: null, confirm: null, prompt: null, beforeunload: null,
        infobox: null, notice: null, auth: null, filechooser: null,
        paste: null,
        intentPrompt: null,
        settings: null,
      };

    // Permission request
      function PermissionRequest({
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
  }
}

function approxEqual(s1, s2) {
  // Calculate the Levenshtein distance between two strings
  function levenshteinDistance(a, b) {
    const matrix = [];

    // Step 1: Initialize the distance matrix
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    // Step 2: Populate the matrix based on minimum edit distance
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,  // substitution
            matrix[i][j - 1] + 1,      // insertion
            matrix[i - 1][j] + 1       // deletion
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  // Compute the edit distance between the strings
  const distance = levenshteinDistance(s1, s2);

  // Normalize the distance by the maximum possible distance (longest string length)
  const maxLength = Math.max(s1.length, s2.length);
  const similarity = 1 - (distance / maxLength);

  // Ensure similarity is always in the range [0, 1)
  return similarity >= 1 ? 0.9999 : similarity;
}

