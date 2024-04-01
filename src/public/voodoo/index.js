import voodoo from './src/constructor.js';

// view frame debug
const USE_BOTH = false;

export default function Voodoo({
  api,
  translator,
  image,
  useViewFrame: useViewFrame = false,
  demoMode: demoMode = false,
} = {}, selector, position = 'beforeEnd') {
  let root;

  if ( ! selector ) {
    //console.warn(`Did not specify a root to attach to. Assuming it's the first found from either the body tag, or the document element.`);
    root = document.body || document.documentElement;
  } else if ( typeof selector == "string" ) {
    root = document.querySelector(selector);
  } else if ( selector instanceof HTMLElement ) {
    root = selector;
  }

  if ( ! USE_BOTH && useViewFrame ) {
    console.log(`Using a view frame instead of a canvas.`);
  } else {
    if ( ! image ) {
      //console.warn(`Did not specify an image to act as the screen, searching for one descending from root`);
      image = root.querySelector('img.frame-holder');
      if ( ! image ) {
        //console.warn(`No image found! Creating one...`);
        image = new Image();
        image.classList.add('.frame-holder');
        root.appendChild(image);
      }
    } else if ( typeof image == "string" ) {
      root = document.querySelector(image);
    } else if ( !(image instanceof HTMLImageElement) ) {
      throw new TypeError(`A valid image was not found`);
    }

    image.style.display = 'none';
  }

  if ( ! api ) {
    // assume the root api is same
    // but warn
    //console.warn(`Did not specify an API, assuming it's ${location}`);
    api = location.href;
  }

  if ( ! translator ) {
    //console.warn(`Did not specify a translator, will send RAW Voodoo commands to API`);
    translator = e => e
  }

  return voodoo(root, position, {
    useViewFrame,
    demoMode,
    preInstallTasks: [
      poppet => poppet.queue.addSubscriber(api, translator, image)
    ],
    postInstallTasks: [
    ]
  });
}


