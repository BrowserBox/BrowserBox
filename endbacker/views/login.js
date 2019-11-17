export function login({current: current = 'loginonly', status}) {
  const userMessage = status && status.userMessage || '';
  const username = status && status.username || '';
  return `
    <form method=POST action=/current/${current}/event/login>
      <fieldset>
        <legend>Existing User Login</legend>
        ${userMessage ? `<p>${userMessage}</p>` : ''}
        <p>
          <label>
            Your username
            <input required type=text name=username placeholder=username value=${username}>
          </label>
        <p>
          <label>
            and password
            <input required type=password name=password placeholder=password>
          </label>
        <p>
          <button>LOGIN</button>
      </fieldset>
    </form>
  `;
}

export function subscribesignup({
  plan: plan = {description:'your plan'}, subid, current: current = 'subscribesignup' }) {
  return `
    <form method=POST action=/current/${current}/event/signup>
      <fieldset>
        <legend>Complete your signup</legend>
        <input type=hidden name=subid value=${subid}>
        <p>
          Your purchase of ${plan.description} was successful!
        <p>
          Pick a username and password:
        <p>
          <label>
            Username
            <input required pattern=[a-z][a-z0-9]{4,19} type=text name=username placeholder=username>
            <br>
            <em>Alphanumeric, 5-20 characters</em>
          </label>
        <p>
          <label>
            Password
            <input required pattern=[a-zA-Z0-9\.\:\-]{5,20} type=password name=password placeholder=password>
            <br>
            <em>Alphanumeric, colon, dot, dash, 5-20 characters</em>
          </label>
        <p>
          <button>Sign me up!</button>
      </fieldset>
    </form>
    <script type=module src=/prod/ask-before-unload.js></script>    
    <script src=/scripts/lockbutton.js></script>    
  `;
}

export function loginokay({current: current = 'login'}) {
  return `
    <form method=POST action=/current/${current}/event/loginokay>
      <fieldset>
        <legend>You are Logged In</legend>
        <button autofocus>OK</button>
      </fieldset>
    </form>
  `;
}

export function loginfail({current: current = 'login', status}) {
  return `
    <form method=POST action=/current/${current}/event/loginfail>
      <fieldset>
        <legend>Your LOGIN Failed</legend>
        <p>${status && status.userMessage}
        <button>OK</button>
      </fieldset>
    </form>
  `;
}

export function signupfail({current: current = 'signup', status, subid}) {
  return `
    <form method=POST action=/current/${current}/event/signupfail>
      <fieldset>
        <legend>Your Signup Failed</legend>
        <input type=hidden name=subid value=${subid}
        <p>${status && status.userMessage}
        <button>OK</button>
      </fieldset>
    </form>
  `;
}
