#!/bin/sh

if command -v dnf; then
  sudo dnf -y install ghostscript mupdf
  sudo dnf -y install texlive-cjk
  sudo dnf -y install texlive-collection-langjapanese texlive-latex texlive-collection-latexextra texlive-collection-fontutils texlive-collection-humanities tex-preview
  sudo dnf -y install ImageMagick
  sudo dnf -y install libreoffice
  sudo dnf -y install pandoc
  sudo dnf -y install coreutils
  sudo dnf -y install texlive-collection-fontsextra
  sudo dnf -y install librsvg2-tools
else
  sudo $APT -y install ghostscript mupdf-tools
  sudo $APT -y install texlive-lang-cjk
  sudo $APT -y install texlive-lang-japanese texlive-latex-recommended texlive-latex-extra texlive-font-utils texlive-humanities preview-latex-style
  sudo $APT -y install imagemagick
  sudo $APT -y install libreoffice
  sudo $APT -y install pandoc
  sudo $APT -y install coreutils
  sudo $APT -y install texlive-fonts-extra 
  sudo $APT -y install librsvg2-bin
fi

