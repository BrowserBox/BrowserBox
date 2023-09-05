#!/bin/sh

echo $1

base=$2
format=$3

if [ -z $format ]; then
  format="png"
fi

cp $base/index.html $1.html

  #convert -verbose -density 120 -background ivory -alpha remove -alpha off -quality 75 $1 +adjoin $1-%04d.$format || (mutool draw -i -o $1-%04d.$format $1 && $base/../../scripts/rename_1_based.sh $1 $format)
  #convert -verbose -density 120 -background ivory -alpha remove -alpha off -quality 75% -strip -interlace Plane -gaussian-blur 0.02 $1 +adjoin $1-%04d.$format || (mutool draw -i -o $1-%04d.$format $1 && $base/../../scripts/rename_1_based.sh $1 $format)
  convert -verbose -density 120 -background ivory -alpha remove -alpha off -quality 75% -strip -interlace Plane $1 +adjoin $1-%04d.$format || (mutool draw -i -o $1-%04d.$format $1 && $base/../../scripts/rename_1_based.sh $1 $format)

cp $1 $base/../../pdfs/

