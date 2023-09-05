#!/bin/sh

echo "You might need to rebuild ImageMagick to neable multi-core support. And event include
--with-tcmalloc to reduce lock contention. All about performance enhancement."
echo "Please note it takes a long time to build ImageMagick."

echo "I'm noticing that for large PDFS (such as Clean Code) the process will be killed
even on this 4 core 8 Gb machine. Why? Need to investigate."

echo "Density is so far the single most important parameter controlling execution speed. At 100 it takes 400 ms a page for the 462 page Clean Code to convert. This is good. It's workable."
read _



