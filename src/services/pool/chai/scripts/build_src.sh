#!/usr/bin/env bash

echo 
#mkdir -p backup
#currentMagick=$(which magick)
#currentLibs=$(dirname "$currentMagick")/.libs/
#echo "Backing up current ImageMagick: $currentMagick + $currentLibs"
#sudo cp $currentMagick backup/
#sudo cp -r $currentLibs backup/
echo
echo "This script will try to build ImageMagick from source."
echo
read -p "Press enter to continue..."
echo
echo "Installing ImageMagick build deps..."
sudo $APT install autoconf automake autopoint autotools-dev chrpath cm-super-minimal debhelper dh-autoreconf dh-exec dh-strip-nondeterminism doxygen doxygen-latex dwz gettext gir1.2-harfbuzz-0.0 gir1.2-pango-1.0 graphviz icu-devtools intltool-debian jdupes libann0 libarchive-zip-perl libbz2-dev libcdt5 libcgraph6 libclang-cpp11 libclang1-11 libdatrie-dev libdebhelper-perl libdeflate-dev libdjvulibre-dev libexif-dev libexif12 libfftw3-bin libfftw3-dev libfftw3-long3 libfftw3-quad3 libfftw3-single3 libfile-stripnondeterminism-perl libfribidi-dev libgraphite2-dev libgts-0.7-5 libgvc6 libgvpr2 libharfbuzz-dev libharfbuzz-gobject0 libicu-dev libilmbase-dev libjbig-dev libjpeg-dev libjpeg62-turbo-dev liblab-gamut1 liblcms2-dev liblqr-1-0-dev libltdl-dev liblzma-dev libmime-charset-perl libopenexr-dev libpango1.0-dev libpangoxft-1.0-0 libpathplan4 libperl-dev librsvg2-bin libsigsegv2 libsombok3 libsub-override-perl libthai-dev libtiff-dev libtiffxx5 libtool libunicode-linebreak-perl libwmf-dev libxapian30 libxft-dev libxml2-dev libxml2-utils libxt-dev m4 pango1.0-tools pkg-kde-tools po-debconf texlive-extra-utils texlive-luatex xsltproc 
sudo $APT install checkinstall libwebp-dev libopenjp2-7-dev librsvg2-dev libde265-dev libheif-dev
echo "Downloading ImageMagick source..."
curl -O -L http://www.imagemagick.org/download/ImageMagick.tar.gz
tar xvf ImageMagick.tar.gz
cd ImageMagick-*
echo "Configuring ImageMagick build..."
./configure --with-rsvg --with-tcmalloc --with-fftw --with-fontconfig --with-openmp --with-pango --with-openexr --with-jp2 --with-webp
echo "Compiling ImageMagick..."
make -j 4
echo "Installing compilation..."
sudo make install
sudo ldconfig /usr/local/lib
echo "Testing compilation..."
echo
make check
echo
echo "Done! Successfully built ImageMagick from source. Cleaning up and exiting..."
echo
cd ../
rm -rf ImageMagick*
exit 0
