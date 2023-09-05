#!/bin/sh

# Check if xelatex is installed and set Pandoc options accordingly
if command -v xelatex > /dev/null 2>&1; then
  pandoc_options="--pdf-engine=xelatex"
else
  echo "xelatex is not installed, proceeding without it." >&2
  pandoc_options=""
fi

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

echo "$1"

base="$2"
format="$3"

# Set default format to png if none is provided
if [ -z "$format" ]; then
  format="png"
fi

convert_to_pdf() {
  local input_file="$1"
  shift
  local output_file="$1"
  shift
  local options=("$@")

  pandoc "${options[@]}" "$input_file" -o "$output_file"
}

convert_via_latex() {
  local input_file="$1"
  local output_file="$2"

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
  pdflatex --output-directory "$latex" file.tex 1>&2
  mv "${latex}/file.pdf" "${output_file}"
}

convert_to_pdf_if_needed() {
  # Extract the file extension
  file_extension="${1##*.}"

  echo "File ext: ${file_extension}" >&2

  if [ "$file_extension" = "$1" ]; then
    file_extension=""
  fi

  iconv -c -t utf-8//IGNORE "$1"  | sed 's/[^[:print:]\t]//g' > "${1}.utf8"
  mv "${1}.utf8" "$1"

  # Output file name (same as input but with .pdf extension)
  output_file="${1%.*}.pdf"

  # Convert files based on their extension
  case "$file_extension" in
    "rst")
      echo "Converting RST to PDF..." >&2
      options_array=(--from=rst $pandoc_options)
      convert_to_pdf "$1" "$output_file" "${options_array[@]}"
      ;;
    "json"|"conf"|"yaml"|"sh"|"text"|"txt"|"c"|"js"|"cpp"|"h"|"tpp"|"hpp"|"py"|"pl"|"m"|"java"|"go"|"cjs"|"mjs"|"css"|"")
      echo "Converting Text files to PDF via LaTeX..." >&2
      convert_via_latex "$1" "${1%.*}.pdf"
      ;;
    "me"|"md")
      echo "Converting Markdown (GFM) to PDF..." >&2
      options_array=(--from=gfm $pandoc_options)
      convert_to_pdf "$1" "$output_file" "${options_array[@]}"
      ;;
    "htm"|"html")
      echo "Converting HTML to PDF..." >&2
      options_array=($pandoc_options)
      convert_to_pdf "$1" "$output_file" "${options_array[@]}"
      ;;
    *)
      echo "Converting unknown types to PDF via LaTeX..." >&2
      convert_via_latex "$1" "${1%.*}.pdf"
      ;;
  esac
  # Return the output file name (either the original or the converted PDF)
  echo "$output_file"
}

# Main Script Execution
converted_file=$(convert_to_pdf_if_needed "$1")
cp "$base/index.html" "$1.html"

echo "converted file: $converted_file"
echo "format: $format"
echo "1: $1"
echo "base: $base"

convert -verbose -density 120 -background ivory -alpha remove -alpha off -quality 75% -strip -interlace Plane "${converted_file}" +adjoin "${1}-%04d.${format}" || (mutool draw -i -o "${1}-%04d.${format}" "${converted_file}" && "$base/../../scripts/rename_1_based.sh" "${1}" "$format")

cp "$1" "$base/../../pdfs/"

