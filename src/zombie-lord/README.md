# zombie-lord

Zombie lord is a controller for a set of headless browser instances running somewhere (in the cloud, on your device, wherever). 

The zombie lord can accept incoming requests (over websocket, or http) and uses its minions to run tasks.

## Notes for install

Note that when we install Litewait/Zombie Lord into a user's directory, all that needs to be done is gclone litewait (or cp an existing repo) and call npm i (which will rebuild each node_modules for each module).

But the first time we install on a new instance / system, we need to install chrome (dl_chrome.sh) and do (deb.deps) for chrome first (or a diff deps for other systems, I think aws install can also be used for centos type systems). And also do font.deps (to make sure we have emojis and chinese fonts etc).

Perhaps these font deps are not important for things like litewait / app minifications / text only, but I think they still matter.

Also we can always turn on sending screenshot frames, so font's do matter. And having them there probably prevents weird render issues anyway that might create instability for chrome.




