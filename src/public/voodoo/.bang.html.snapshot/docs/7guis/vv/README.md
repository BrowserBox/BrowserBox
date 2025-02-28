# [VanillaView](https://github.com/i5ik/vanillaview/) &middot; [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/i5ik/vanillaview/blob/main/LICENSE) [![npm version](https://img.shields.io/npm/v/vanillaviewjs.svg?style=flat)](https://www.npmjs.com/package/vanillaviewjs) 

VanillaView is a JavaScript library for building user interfaces.

* **Declarative:** VanillaView makes it painless to create interactive UIs. Design simple views for each state in your application, and VanillaView will efficiently update and render just the right components when your data changes. Declarative views make your code more predictable, simpler to understand, and easier to debug.
* **Component-Based:** Build encapsulated components that manage their own state, then compose them to make complex UIs. Since component logic is written in JavaScript instead of templates, you can easily pass rich data through your app and keep state out of the DOM.
* **Easy:** Mixes well with many other codes and libraries, easy learning curve

[Learn how to use VanillaView in your own project](#Learn).

## Features

- minimal updates with no vDOM overhead
- zero dependencies
- no toolchain required
- no stitching context, nor conceptual model. Use the existing 
vanilla JavaScript 
and HTML semantics you're already familiar with
- use as much or as little as you want

## Learn

First, the VanillaView Haiku:

> When you get around
>
> To taking over the world
>
> The humble vanillaview
>
> Will be your steadfast friend

Now you can add a container to the HTML:

```html

  <!-- ... existing HTML ... -->

  <div id=container></div>

  <!-- ... existing HTML ... -->

```

Second, add some `<script>` tags:

```html

  <!-- Load VanillaView. -->
  <script src=https://unpkg.com/vanillaviewjs@latest/dist/vanillaview.js crossorigin></script>

  <!-- Load our VanillaView component. -->
  <script src=button.js></script>

```

Third, add code to `button.js`:

```js

  const State = { clicked: false };
  const domContainer = document.querySelector('#container');

  Button().to(domContainer, 'innerhtml');

  function Button() {
    return vanillaview.s`
      <button click=${() => State.clicked = true}>
        Click
      </button>
    `;
  }

```

And you're done!

You'll notice that we added an event listener for the `click` event simply by adding a function to the click attribute in the HTML. All event handlers are added this way, using the events name, without any capitalization. If you want to add flags (like 'passive', or 'once') you can separate them with `:`, like 

```js
const PassiveScroller = () => c`
  <div scroll:passive:once=${ ev => console.log('I scrolled', ev) }></div>
`;
```

## Installation

VanillaView has been designed for gradual adoption from the start, and **you can use as little or as much VanillaView as you need**

```console
$ npm i --save vanillaviewjs
```

or use a CDN, like in the above Learn section.

## Examples

Here is the first one to get you started:

```js
function HelloMessage({ name }) {
  return s`<div>Hello ${name}</div>`;
}

HelloMessage({name:'Tay-anne'}).to(
  document.getElementById('container'),
  'afterbegin'
);
```

This example will render "Hello Tay-anne" into a container on the page. 

You'll notice that we used an HTML syntax; [we call it HTML](https://www.w3schools.com/html/). HTML is required to use VanillaView, it makes code more readable, and writing it feels like writing HTML. If you're using VanillaView as a `<script>` tag, you're all good; otherwise, and you'll never need a toolchain to handle it automatically.

The `to` function places your component where you want it on the page. It [supports all the locations that insertAdjacentHTML does](https://developer.mozilla.org/en-US/docs/Web/API/Element/insertAdjacentHTML) as well as 'replace' (which removes the location and replaces it with your component), and 'innerhtml' (which sets the `.innerHTML` property of the location to your component's HTML).

## [Advanced Topic] s vs c

VanillaView provides two render functions: `s` and `c`. 

`s` is for singleton components. These are things that you expect to have a single identity, and show up in only one location in your document. But note that these singletons can be keyed, a keyed singleton can show up in more than one location, but *only where its keys are different.* The singleton for each key will only exist in one place. 

The benefits of singletons are effortless updates. Every time you call them, they will repaint their corresponding widget, with the minimal number of changes necessary. If you want to move a singleton to a new location in the document, you need to the `to` method on it again, like `Button().to(newLocation)`.

With all these benefits why would you ever want to use `c` components? `c` components are for components (or clones). Every time you call a `c` component, it creates new nodes. You might want to use this where you need a lot of widgets but you don't need or want to add keys to them to keep track of them. You need to place those nodes in the document, either using `to` or via nesting, like,

```js
const Child = count => c`<span>${count}</span>`;
const Parent = lastCount => s`<div>${Child(0)}, ${Child(lastCount)}</div>`;
```

Both `s` and `c` components can be arbitrarily nested inside each other. To add a key to an `s` component, simply do like so,

```js

// add the key as the first slot in your component

const KeyedSingleton = (key, name) => s`
  {{key}}
  <div>
    I'm unique. My name is now ${name}
  </div>
`;

// initial insert
KeyedSingleton('0', 'larry').to('body','afterbegin');
KeyedSingleton('1', 'laura').to('body','afterbegin');

// update
KeyedSingleton('0', 'laura');
KeyedSingleton('1', 'larry');

```

Keys always need to be strings. Any other type will throw an error.

## Contributing

The main purpose of this repository is to continue evolving VanillaView core, making it faster and easier to use. Development of VanillaView happens in the common wealth of GitHub, and we are grateful to the community for contributing bugfixes and improvements. Read below to learn how you can take part in improving VanillaView.

### Code of Conduct

Dosyago has adopted a Code of Conduct that we expect project participants to adhere to. Please read [the full text](https://github.com/i5ik/vanillaviewjs/blob/main/docs/coc.md) so that you can understand what actions will and will not be tolerated.

### Contributing Guide

Open a issue to propose a PR, get it approved, sign the [CLA](https://github.com/i5ik/vanillaviewjs/blob/main/docs/CLA.md), and submit a PR.

### License

VanillaView is [MIT licensed](./LICENSE).
