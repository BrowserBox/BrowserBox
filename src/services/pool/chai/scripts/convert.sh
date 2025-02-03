#!/usr/bin/env bash

#set -x

. ./scripts/config.sh

echo "$1"

base="$2"
format="${3:-png}"

# Verify if a file path is provided
if [ -z "$1" ]; then
  echo "No file path provided. Exiting." >&2
  exit 1
fi

# Verify if the file exists
if [ ! -f "$1" ]; then
  echo "File does not exist. Exiting." >&2
  exit 1
fi

convert_to_pdf() {
  local input_file="$1"
  shift
  local output_file="$1"
  shift
  local options=("$@")

  echo "Using pandoc options: ${options[@]}" >&2

  pandoc "${options[@]}" "$input_file" -o "$output_file"
}

convert_via_latex() {
  local input_file="$1"
  local output_file="$2"
  local retry_flag="$3"

  latex=$(mktemp -d)
  cp "$input_file" "${latex}/"
  cat <<TAO > "$latex/file.tex"
\documentclass{article}
\usepackage[left=2cm,right=1cm,top=2cm,bottom=2cm]{geometry} % Adjust the global margin
\usepackage{listings}
\usepackage{beramono}
\usepackage[T1]{fontenc}

\lstset{%
  language={},%
  basicstyle=\ttfamily,%
  linewidth=19cm,%
  breaklines=true,%
  breakatwhitespace=false,%
  texcl=false,%
  literate={\\\}{{\textbackslash}}1
}

\begin{document}
\pagestyle{empty}  % Remove page numbers

\lstinputlisting{"$input_file"}

\end{document}
TAO

  pdflatex -interaction=nonstopmode --output-directory "$latex" file.tex 1>&2
  mv "${latex}/file.pdf" "${output_file}"
}

convert_via_libreoffice() {
  local input_file="$1"
  local output_file="$2"
  cmd="soffice"
  if ! command -v "$cmd" > /dev/null 2>&1; then
    cmd="libreoffice"
    if ! command -v "$cmd" > /dev/null 2>&1; then
      echo "Error: cannot find libreoffice" >&2
      exit 1
    fi
  fi

  "$cmd" --headless --convert-to pdf "$input_file" --outdir "$(dirname "$input_file")" 1>&2
}

convert_to_pdf_if_needed() {
  # Extract the file extension
  file_extension="${1##*.}"
  file_extension=$(echo "$file_extension" | awk '{print tolower($0)}')
  pandoc_options=""

  echo "File ext: ${file_extension}" >&2

  if [ "$file_extension" = "$1" ]; then
    file_extension=""
  fi

  # Output file name (same as input but with .pdf extension)
  output_file="${1%.*}.pdf"

  # Convert files based on their extension
  case "$file_extension" in
    "123"|"602"|"abw"|"agd"|"ase"|"bmp"|"cdr"|"cgm"|"cmx"|"csv"|"cwk"|"dbf"|"dif"|"dxf"|"emf"|"eps"|"fb2"|"fhd"|"gif"|"gnm"|"gnumeric"|"hwp"|"htm"|"html"|"jpe"|"jpeg"|"jpg"|"jtd"|"jtt"|"key"|"kth"|"mml"|"met"|"pdb"|"pl"|"plt"|"png"|"pm3"|"pm4"|"pm5"|"pm6"|"pmd"|"p65"|"pot"|"pps"|"psd"|"psw"|"pub"|"pxl"|"qxp"|"ras"|"rlf"|"rtf"|"sgf"|"sgv"|"slk"|"svg"|"svm"|"swf"|"tga"|"tif"|"tiff"|"uof"|"uop"|"uos"|"uot"|"wb2"|"wks"|"wk1"|"wk3"|"wk4"|"wps"|"wpd"|"wq1"|"wq2"|"wmf"|"xbm"|"xml"|"xpm"|"xlw"|"xlt"|"zabw"|"zmf"|"xls"|"doc"|"ppt"|"xlsx"|"docx"|"pptx"|"pages"|"epub"|"mobi"|"odt"|"ods"|"numbers")
      echo "Converting Office files to PDF using LibreOffice..." >&2
      convert_via_libreoffice "$1" "$output_file"
      ;;
    "rst")
      echo "Converting RST to PDF..." >&2

      # Check if xelatex is installed and set Pandoc options accordingly
      if command -v xelatex > /dev/null 2>&1; then
        echo "Using xelatex" >&2
        pandoc_options="--pdf-engine=xelatex --pdf-engine-opt=-no-shell-escape"
      else
        echo "xelatex is not installed, proceeding without it." >&2
        pandoc_options=""
      fi

      options_array=(--from=rst $pandoc_options)

      iconv -c -t utf-8//IGNORE "$1"  | awk '{gsub(/[^[:print:]\t]/, ""); print}' > "${1}.utf8"
      mv "${1}.utf8" "$1"

      convert_to_pdf "$1" "$output_file" "${options_array[@]}"
      ;;
    "json"|"conf"|"yaml"|"sh"|"text"|"txt"|"c"|"js"|"cpp"|"h"|"tpp"|"hpp"|"py"|"pl"|"m"|"java"|"go"|"cjs"|"mjs"|"css"|"")
      echo "Converting Text files to PDF via LaTeX..." >&2

      iconv -c -t utf-8//IGNORE "$1"  | awk '{gsub(/[^[:print:]\t]/, ""); print}' > "${1}.utf8"
      mv "${1}.utf8" "$1"

      convert_via_latex "$1" "${1%.*}.pdf"
      ;;
    "me"|"md")
      echo "Converting Markdown (GFM) to PDF..." >&2

      # Check if xelatex is installed and set Pandoc options accordingly
      if command -v xelatex > /dev/null 2>&1; then
        echo "Using xelatex" >&2
        pandoc_options="--pdf-engine=xelatex --pdf-engine-opt=-no-shell-escape"
      else
        echo "xelatex is not installed, proceeding without it." >&2
        pandoc_options=""
      fi

      options_array=(--from=gfm $pandoc_options)

      iconv -c -t utf-8//IGNORE "$1"  | awk '{gsub(/[^[:print:]\t]/, ""); print}' > "${1}.utf8"
      mv "${1}.utf8" "$1"

      convert_to_pdf "$1" "$output_file" "${options_array[@]}"
      ;;
    "3fr"|"aai"|"arw"|"avi"|"avif"|"bmp"|"cin"|"cr2"|"cr3"|"crw"|"cur"|"dcm"|"dcr"|"dcx"|"dng"|"dpx"|"eps"|"erf"|"fax"|"fits"|"fpx"|"gif"|"gray"|"hdr"|"heic"|"heif"|"ico"|"jbg"|"jbig"|"jng"|"jp2"|"jpeg"|"jpg"|"k25"|"kdc"|"mat"|"miff"|"mkv"|"mng"|"mov"|"mp4"|"mpc"|"mpeg"|"mpg"|"mrw"|"msl"|"nef"|"nrf"|"orf"|"pam"|"pbm"|"pcd"|"pef"|"pes"|"pfa"|"pfb"|"pfm"|"pgm"|"png"|"pnm"|"ppm"|"ps"|"psb"|"psd"|"ptif"|"raf"|"ras"|"raw"|"rgb"|"rgba"|"rla"|"rle"|"rw2"|"sfw"|"sgi"|"sr2"|"srf"|"sun"|"svg"|"svgz"|"tga"|"tiff"|"ttf"|"ubrl"|"vda"|"viff"|"vips"|"vst"|"wbmp"|"webm"|"webp"|"wmv"|"wpg"|"x3f"|"xbm"|"xcf"|"xpm"|"xv"|"yuv"|"pdf")
      echo "This format is recognized by ImageMagick so we leave it alone (for now, mwhoahaha)..." >&2
      output_file="$1"
      ;;
    *)
      echo "Converting unknown types to PDF via LaTeX..." >&2

      iconv -c -t utf-8//IGNORE "$1"  | awk '{gsub(/[^[:print:]\t]/, ""); print}' > "${1}.utf8"
      mv "${1}.utf8" "$1"

      convert_via_latex "$1" "${1%.*}.pdf"
      ;;
  esac
  # Return the output file name (either the original or the converted PDF)
  echo "$output_file"
}

# Main Script Execution

converted_file=$(convert_to_pdf_if_needed "$1")

convert -verbose -density 131 -background ivory -alpha remove -alpha off -quality 77% -strip -interlace Plane "${converted_file}[0-999]" +adjoin "${1}-%04d.${format}" || magick convert -verbose -density 131 -background ivory -alpha remove -alpha off -quality 77% -strip -interlace Plane "${converted_file}[0-999]" +adjoin "${1}-%04d.${format}" || (mutool draw -F 1 -L 1000 -i -o "${1}-%04d.${format}" "${converted_file}" && "${INSTALL_DIR}/chai/scripts/rename_1_based.sh" "${1}" "$format") || exit 1

cp "$1" "${pdfs}/"

