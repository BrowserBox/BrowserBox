#!/bin/bash

# Script to splice out a section of a video without re-encoding
# Usage: ./splice_video.sh input_file start_time end_time
# Example: ./splice_video.sh input.mp4 00:02:00 00:03:00

usage() {
  echo "Usage: $0 input_file start_time end_time"
  echo "  input_file: The input video file (e.g., input.mp4)"
  echo "  start_time: Start time of section to remove (e.g., 00:02:00 or 120)"
  echo "  end_time: End time of section to remove (e.g., 00:03:00 or 180)"
  exit 1
}

convert_to_seconds() {
  local time=$1
  if [[ $time =~ ^([0-9]{2}):([0-9]{2}):([0-9]{2})$ ]]; then
    local h=${BASH_REMATCH[1]}
    local m=${BASH_REMATCH[2]}
    local s=${BASH_REMATCH[3]}
    echo $((10#$h * 3600 + 10#$m * 60 + 10#$s))
  elif [[ $time =~ ^[0-9]+(\.[0-9]+)?$ ]]; then
    echo "$time"
  else
    echo "Invalid time format: $time"
    exit 1
  fi
}

check_ffmpeg() {
  if ! command -v ffmpeg &> /dev/null; then
    echo "FFmpeg is not installed."
    exit 1
  fi
}

if [ $# -lt 3 ]; then
  usage
fi

INPUT_FILE="$1"
START_TIME="$2"
END_TIME="$3"

if [ ! -f "$INPUT_FILE" ]; then
  echo "Error: File '$INPUT_FILE' not found."
  exit 1
fi

check_ffmpeg

START_SEC=$(convert_to_seconds "$START_TIME")
END_SEC=$(convert_to_seconds "$END_TIME")

if (( $(echo "$START_SEC >= $END_SEC" | bc -l) )); then
  echo "Start time must be less than end time."
  exit 1
fi

# Get video duration
DURATION=$(ffmpeg -i "$INPUT_FILE" 2>&1 | grep "Duration" | awk '{print $2}' | tr -d ,)
DURATION_SEC=$(convert_to_seconds "$DURATION")

if (( $(echo "$END_SEC > $DURATION_SEC" | bc -l) )); then
  echo "End time exceeds video length."
  exit 1
fi

# Calculate parts
PART1_DUR=$(echo "$START_SEC" | bc)
PART2_START="$END_SEC"

# Extract parts without re-encoding
echo "Extracting Part 1..."
ffmpeg -i "$INPUT_FILE" -t "$PART1_DUR" -c copy part1.mp4 -y

echo "Extracting Part 2..."
ffmpeg -i "$INPUT_FILE" -ss "$PART2_START" -c copy part2.mp4 -y

# Concatenate parts using intermediate TS format (safe for stream copy)
echo "Preparing parts for concat..."
ffmpeg -i part1.mp4 -c copy -bsf:v h264_mp4toannexb -f mpegts part1.ts -y
ffmpeg -i part2.mp4 -c copy -bsf:v h264_mp4toannexb -f mpegts part2.ts -y

echo "Concatenating final output..."
ffmpeg -i "concat:part1.ts|part2.ts" -c copy -bsf:a aac_adtstoasc output.mp4 -y

# Clean up
rm part1.mp4 part2.mp4 part1.ts part2.ts

echo "Done! Output is in output.mp4"

