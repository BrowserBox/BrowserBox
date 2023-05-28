{
  const url = decodeURIComponent(new URL(window.location).searchParams.get("url"));
  const downloadFileName = decodeURIComponent(new URL(window.location).searchParams.get("downloadFileName"));
  if ( ! url ) {
    document.write(`<h1 style="font-family: system-ui;">Error receiving Flash file URL...</h1>`);
    setTimeout(() => window.close(), 3000);
  }
  const embedTag = document.createElement('embed');
  embedTag.setAttribute('id', 'og-flash');
  embedTag.type = "application/x-shockwave-flash";
  embedTag.title = `Ruffle Flash Emulator playing ${downloadFileName}`;
  embedTag.setAttribute('role', 'application');
  //embedTag.setAttribute('style', 'border: 3px solid lime;');
  embedTag.src = url;
  console.log({flashContentUrl:url});
  if ( document.body ) {
    document.body.append(embedTag);
  } else {
    document.addEventListener('load', () => {
      (document.body || document.documentElement).append(embedTag);
      if ( ! window.RufflePlayer ) location.reload();
    });
  }
  load();
  document.title = `${downloadFileName} - Ruffle Flash Player Emulator`;

  function load() {
    setTimeout(() => {
      if ( ! window.RufflePlayer ) location.reload();
    }, 1000);
  }
}
