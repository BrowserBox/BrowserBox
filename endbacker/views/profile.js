import {logo} from './logo';
import {subscribe} from './subscribe';

export function profile({current:current = 'profile',session}) {
  return `
    <h1>
      Profile
    </h1>
    <h2>${session.username}</h2>
    <p>You are logged in and good to go!</p>
    <form method=POST action=/current/${current}/event/startapp target=_top>
      <label>
        <button name=app value=litewait>Start Dosy Browser Browser</button>
        <small>This will take about 10 seconds</small>
      </label>
    </form>
    <form method=POST action=/current/${current}/event/logout>
      <button name=action value=logout>Logout</button>
    </form>
    <script src=/scripts/lockbutton.js></script>
  `;
}
