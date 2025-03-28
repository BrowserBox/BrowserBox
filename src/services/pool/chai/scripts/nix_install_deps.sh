#!/bin/sh

if command -v dnf; then
  sudo dnf install -y ghostscript mupdf
  sudo dnf install -y texlive-cjk
  sudo dnf install -y texlive-collection-langjapanese texlive-latex texlive-collection-latexextra texlive-collection-fontutils texlive-collection-humanities tex-preview
  sudo dnf install -y ImageMagick
  sudo dnf install -y libreoffice
  sudo dnf install -y pandoc
  sudo dnf install -y coreutils
  sudo dnf install -y texlive-collection-fontsextra
  sudo dnf install -y librsvg2-tools
else
  sudo $APT install -y ghostscript mupdf-tools
  sudo $APT install -y texlive-lang-cjk
  sudo $APT install -y texlive-lang-japanese texlive-latex-recommended texlive-latex-extra texlive-font-utils texlive-humanities preview-latex-style
  sudo $APT install -y imagemagick
  sudo $APT install -y libreoffice
  sudo $APT install -y pandoc
  sudo $APT install -y coreutils
  sudo $APT install -y texlive-fonts-extra 
  sudo $APT install -y librsvg2-bin
fi

