#!/bin/sh

# assumes freebsd

sudo $APT -y install ghostscript mupdf-tools
sudo $APT -y install texlive-lang-cjk
sudo $APT -y install texlive-lang-japanese texlive-latex-recommended texlive-latex-extra texlive-font-utils texlive-humanities preview-latex-style
sudo $APT -y install imagemagick
sudo $APT -y install libreoffice
sudo $APT -y install pandoc
sudo $APT -y install coreutils
sudo $APT -y install texlive-fonts-extra 
sudo $APT -y install librsvg2-bin

