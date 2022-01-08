# voodoo

A browser API for performing actions on a bitmap representation of a browser tab, and viewing the changes.

Also provides UI for browser UI such as: address bar, back, forward and reload buttons, new tab, close tab, permission requests, and so on. 

## DONE ( 2018 DEC 3 )

WE HAVE DONE SO MUCH! Progress is TREMENDOUS!

Even more than the scope below, things have been added.
Many problems have been solved. 
Man challenges overcome!
Many things achieved!

I AM SO GREAT!!!
WOO HOO!!! :) :D ;p :) xxxxxx

## Todo ( 2018 DEC 3 )

- new tab, close tab, switch tab
- modal dialogs
- search bar

## Scope

The browser API will provide the following:

- A call to create and insert a component into a DOM tree.
- The component will comprise:
  - An image or canvas representing a bitmap of a browser tab.
  - Event listeners capturing every possible interaction with a browser tab.
  - A queue for events
  - A method of attaching event subscribers (without specificity to event type) in the form of websocket or HTTP POST
  - A method for transmitting events
  - A standard transformation of external events (DOM events, custom events, and so on), into a "transport format" for events
  sent to subscribers
- The component will also comprise UI components for: 
  - address bar
  - back, forward and reload buttons
  - new tab
  - close tab
  - modal dialogs
  - a placeholder space for plugins
  - search bar
- An API to load a plugin, that can provide its own UI and add its own events
- A method for accepting updates to the image state of the tab representation and displaying those.
- A method for displaying other information, that may be sent by the event subscribers, such as current URL, page title, or other arbitrary data messages. For example, plugins may implement their own components for displaying information such as this, and they may communicate with "remote side" plugins that send custom information which the "local side" plugin displays.

## Terms

*Remote side* - the remote thing (typically a browser instance) that the API connects to.

*Local side* - the local execution context (typically a browser running on the person's machine) that runs the voodoo browser API.

## License

Copyright 2018 - X, Cris Stringfellow & Dosyago Corporation

