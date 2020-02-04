# Diff algorithm

Okay so in injections we keep lastMarkup (which is our last filtered markup).

To send diffs, what we do is:

If last markup is empty, we send full-patch, just the markup string.

Otherwise, we update is called, we generate the markup and compare with lastMarkup. 

If they are the same (as in the key is the same, since we only view text, and key represents text (it DOES ignore whitespace
which is incorrect for some edge cases that I care not for now), we do nothing.

Send nothing in that case.

If they are different, (and remember we debounce our update from mutation observation events). 

Then we calculate the diff.

How do we do that?

Well, first we convert each to a DOM tree, with parse from string, or whatnot.

Then (and remember we need to update our DOM node numbering algorithm to be diff idempotent somehow).

(just had an idea that we can use DOM comments to mark text node replacement locations as well, cool. could simplify our text replacement algorithm?)

(remember that our zig numbering does not need to be Integers, maybe we could start using arithmetic numbers?)

Okay, anyway, need a diff algorithm.

---

Maybe as we store each node against its zig we can build a diff algorithm.

IDEA: We have the zig for the last tree. Now we step throught the current and build it:

then we step through the zig numbering, and pull up each node in turn. 

Meaning as we step through each node in current, we ALSO bring up each ZIG in the last (which are in document order)

We compare the nodes. When we have something that differs, 

we: 1) make a diff entry, and 2) reset (prefix) the numbering from there.

This ensures: 1) we get all the diffs, and 2) our numbering is consistent.

Case, we added a node after begin:

Let's do other cases.


