#!/usr/bin/env bash

# Install dependencies
brew install ghostscript jpeg libpng pkg-config webp xz

# Clone ImageMagick source code
if [ ! -d ./ImageMagick ]; then
  git clone https://github.com/ImageMagick/ImageMagick.git
fi

# Enter ImageMagick directory
cd ImageMagick

# Configure ImageMagick with multicore support
./configure --with-webp=yes --with-jpeg=yes --with-jp2=yes --with-png=yes --with-tiff=yes --with-threads=yes CPPFLAGS="-I/opt/homebrew/include" LDFLAGS="-L/opt/homebrew/lib"

# Build and install ImageMagick
make && sudo make install

