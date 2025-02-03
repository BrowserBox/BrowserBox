
  if ( navigator.platform.indexOf('Win') != -1 ) {
    window.document.getElementById("wrapper").setAttribute("class", "windows");
  } else if ( navigator.platform.indexOf('Mac') != -1 ) {
    window.document.getElementById("wrapper").setAttribute("class", "mac");
  }

  const x = Array.from(document.querySelectorAll('.move[show]'));
  //const random = x[Math.floor(Math.random()*x.length)];
  const random = x[0];
  //random.setAttribute('show',true);
  window.onresize = () => {
    random.style.transform = `translate(-50%,0) scale(${innerWidth/1400}) `;
  };
  window.onresize();
