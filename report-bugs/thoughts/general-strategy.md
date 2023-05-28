# Bug Solving Guide - General Startegy

Often logging is not enough, you need to see the stack trace in the logs. In JS, I can do this using,

`console.log((new Error).stack)`

at the logging line and I will see exactly where it's calling from.

That's so fucking good and useful and it's how I solved the infamous meta-bug. It made it easy for me to see a tiny slice of the execution paths of, and to reason about, my program!!!! :P :) xxx ;p FUCK YEAH :P ;) xxx ;p


