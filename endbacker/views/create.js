export function create1({subid,username}) {
  return `
    <form method=POST action=/current/create/event/create2>
      <input type=hidden name=username value=${username}>
      <input type=hidden name=subid value=${subid}>
      <p>
        User ${username} created.
      <p> 
        Now, let's create your home directory. This will take a while.
      <p>
        <button autofocus>Create my home directory!</button>
    </form>
    <script type=module src=/prod/ask-before-unload.js></script>
    <script src=/scripts/lockbutton.js></script>
  `;
}

export function create2({subid,username}) {
  return `
    <form method=POST action=/current/create/event/create3>
      <input type=hidden name=username value=${username}>
      <input type=hidden name=subid value=${subid}>
      <p>
        Home directory created!
      <p>
        Now, let's provision your browser. This will take about 1 minute.
      <p>
        <button autofocus>Provision my browser!</button>
    </form>
    <script type=module src=/prod/ask-before-unload.js></script>
    <script src=/scripts/lockbutton.js></script>
  `;
}

export function create3({subid,username}) {
  return `
    <form method=POST action=/current/create/event/created>
      <input type=hidden name=username value=${username}>
      <input type=hidden name=subid value=${subid}>
      <p>
        Browser provisioned!
      <p>
        Now let's complete your setup.
      <p>
        <button autofocus>Complete my setup!</button>
    </form>
    <script type=module src=/prod/ask-before-unload.js></script>
    <script src=/scripts/lockbutton.js></script>
  `;
}
