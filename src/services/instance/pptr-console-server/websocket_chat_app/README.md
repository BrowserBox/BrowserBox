# Chat App Homework

A very simple chat app in Node.JS, JavaScript, HTML and CSS. Does not use any framework.

Server is a very simple websocket broadcast server that also tracks usernames to prevent impersonation and conflicts.

Client is a simple JS app that works cross-browser and provides a nice user interface.

# Running

Clone this repo and

```console
npm i && npm test
```

Then visit http://localhost:8080 in your browser on the same machine.

Alternately, [see the demo](http://boogeh.com)

# Running tests

To run tests visit [the test page](http://boogeh.com/runtests.html)

Or, if you're running locally, it's http://localhost:8080/runtests.html

**Note** to pass the tests connect to a server by yourself. Any other connection will cause the test counts to deviate from expectations.

# Features

- [X] Chat page
- [X] Settings page
- [X] Responsive layout across all devices
- [X] Works on latest Chrome, Firefox and Safari
- [X] Chat tab blinking title with unread count
- [X] Working settings for username, color scheme, clock display, and send hotkey.
- [X] Design based on mockups
- [X] No automatic code generation tools used
- [X] Clean, small, modular code
- [X] Working code 
- [X] Tests main functionality of members joining and leaving, and sending messages

# Things that are different

- No optional features. My focus is keeping it simple.
- No React, no framework at all. I requested this and it was okayed.
- No CSS preprocessors. CSS here is very simple.
- No TypeScript. I used `tsc --checkJs` to check for issues and fixed any. 
- No complex state management. Just deep merge new state with existing.
- No socket.io. The server is a hugely simple websocket server. Client reconnects with exponential backoff.

# Development Philosophy

In this project I tried to do the following things:

- Keep it simple
- Merge state updates into a single state object 
- render the whole view tree from that state object on every change.

In some cases I needed to break that simple model and where I've done that, I've tried to make it clear, such as with `drawLatestMessage()` which was a performance improvement and bug fix over redrawing the whole tree on every arriving message.

# Development Notes

- Most bugs that occured were not type related bugs but due to cross-browser differnces in CSS, layout.
- Adding explicit types would only lengthen this homework assignment for no good reason. 
- Adding React would also be unnecessary. This is a simple app, with small components and only 2 routes. There's no need for added complexity. Also, it was related to me that 'no framework would be best IMO'.
- Adding CSS preprocessors would also be unnecessary, the CSS is very simple.
