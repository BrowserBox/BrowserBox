import {subscribe} from './subscribe';
import {logo} from './logo';
import {login} from './login';

let savedOrigin;

export function landing(
    {current: current = 'demolanding'}
  ) {
  return `
    <!DOCTYPE html>
    <meta charset=utf-8>
    <title>Login and Signup</title>
    <main>
      <header>
        <h1>Dosy Browser</h1>
      </header>
      <section class=cta>
        ${signup({})}
      </section>
      <section class=cta>
        ${login({current})}
      </section>
    </main>
  `
}

export function signup(
    {current: current = 'demolanding'}
  ) {
    return `
      <!DOCTYPE html>
      <main>
        <form method=POST action=/current/${current}/event/imreadytotryit>
          <fieldset>
            <legend>New User Sign Up</legend>
            <p>
              Enjoy a saner, simpler internet. 
            <p>
              Read to start?
            <p>
              <button autofocus>I'm ready. Sign me up!</button>
              <button type=reset>No, I like being lost in confusion.</button>
          </fieldset>
        </form>
      </main>
    `;
}
