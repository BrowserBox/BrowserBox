#!/bin/bash

port="$1"
username="$2"
is_docker="no"
headless="--headless"

mkdir -p $HOME/chrome-browser/

if [[ "$DEBUG_SKATEBOARD" == "headful" ]]; then
  headless=""
fi
echo $headless

# Note that we open debugging port on public interface (0.0.0.0) IF we detect we are in docker
# If we are in docker we are safe since we won't publish that port (5002) outside the container
# BUT if we are not in docker this is a major security risk, you should only ever listen
# for debugging on localhost otherwise anyone can connect to your browser and 
# do whatever they want (full DevTools protocol power) 

# window comment out below if block
if [[ "$OSTYPE" == "win32" ]]; then
  if grep docker /proc/1/cgroup -qa; then
    is_docker="yes"
  fi
fi

if [ $is_docker == "yes" ]; then
  google-chrome-stable --mute-audio $headless --remote-debugging-address=0.0.0.0 --remote-debugging-port=$port --window-size=1280,800 --profile-directory=$HOME/chrome-browser/Default --profiling-flush=1 --enable-aggressive-domstorage-flushing --user-data-dir=$HOME/chrome-browser/ --restore-last-session --disk-cache-size=2750000000 &
else 
  if [[ "$OSTYPE" == "win32" ]]; then
    start "" "c:\program files (x86)\google\chrome\application\chrome.exe" --no-first-run --bwsi --ignore-user-profile-mapping-for-tests --new-window --mute-audio "$headless" --remote-debugging-port=$port --window-size=1280,800 --profile-directory=$HOME/chrome-browser/Default --profiling-flush=1 --enable-aggressive-domstorage-flushing --user-data-dir=$HOME/chrome-browser/ --restore-last-session --disk-cache-size=2750000000 --no-sandbox --enable-logging
  elif [[ "$OSTYPE" == "msys" ]]; then
    start "" "c:\program files (x86)\google\chrome\application\chrome.exe" --new-window --mute-audio --remote-debugging-port=$port --window-size=1280,800 --profile-directory=$HOME/chrome-browser/Default --profiling-flush=1 --enable-aggressive-domstorage-flushing --user-data-dir=$HOME/chrome-browser/ --restore-last-session --disk-cache-size=2750000000 --no-sandbox --enable-logging
  else
    google-chrome-stable --mute-audio $headless --remote-debugging-port=$port --window-size=1280,800 --profile-directory=$HOME/chrome-browser/Default --profiling-flush=1 --enable-aggressive-domstorage-flushing --user-data-dir=$HOME/chrome-browser/ --restore-last-session --disk-cache-size=2750000000 &
  fi
fi

BGPID=$!

trap 'kill -1 $BGPID; exit' SIGHUP
trap 'kill -1 $BGPID; exit' SIGINT
trap 'kill -1 $BGPID; exit' SIGTERM

wait $BGPID

# google-chrome-stable --disable-gpu --disable-gpu-compositing --disable-gpu-rasterization --disable-webgl --disable-webgl-image-chromium --disable-webgl2 --disable-2d-canvas-image-chromium --disable-2d-canvas-clip-aa --disable-accelerated-2d-canvas --disable-3d-apis --mute-audio --headless --remote-debugging-port=$port --window-size=1280,800 --profile-directory=/home/$username/chrome-browser/Default --profiling-flush=1 --enable-aggressive-domstorage-flushing --user-data-dir=/home/$username/chrome-browser/ --restore-last-session --disk-cache-size=2750000000 &
# The HeadlessExperimental flags cause command timeouts. I don't think this is just head of line
# blocking, this is actually the page is waiting, as it is supposed to.
# This is great for CPU but for now we can't use HEXP because it cannot be enabled on all tabs.
# google-chrome-stable --renderer-process-limit=1 --process-per-site --disable-gpu --disable-gpu-compositing --disable-gpu-rasterization --disable-webgl --disable-webgl-image-chromium --disable-webgl2 --disable-2d-canvas-image-chromium --disable-2d-canvas-clip-aa --disable-accelerated-2d-canvas --disable-3d-apis --mute-audio --headless --remote-debugging-port=$port --window-size=1280,800 --profile-directory=/home/$username/chrome-browser/Default --profiling-flush=1 --enable-aggressive-domstorage-flushing --user-data-dir=/home/$username/chrome-browser/ --restore-last-session --disk-cache-size=2750000000 --enable-surface-synchronization --run-all-compositor-stages-before-draw --disable-threaded-animation --disable-threaded-scrolling --disable-checker-imaging &
# google-chrome-stable --mute-audio --headless --remote-debugging-port=$port --window-size=1280,800 --profile-directory=/home/$username/chrome-browser/Default --profiling-flush=1 --enable-aggressive-domstorage-flushing --user-data-dir=/home/$username/chrome-browser/ --restore-last-session --disk-cache-size=2750000000 --enable-surface-synchronization --run-all-compositor-stages-before-draw --disable-threaded-animation --disable-threaded-scrolling --disable-checker-imaging &
# google-chrome-stable --no-gpu --disable-gpu --disable-software-rasterizer --mute-audio --headless --remote-debugging-port=$port --window-size=1280,800 --profile-directory=/home/$username/chrome-browser/Default --profiling-flush=1 --enable-aggressive-domstorage-flushing --user-data-dir=/home/$username/chrome-browser/ --restore-last-session --disk-cache-size=2750000000 --enable-surface-synchronization --run-all-compositor-stages-before-draw --disable-threaded-animation --disable-threaded-scrolling --disable-checker-imaging &
# google-chrome-stable --mute-audio --no-gpu --disable-gpu --disable-software-rasterizer --headless --remote-debugging-port=$port --window-size=1280,800 --profile-directory=/home/$username/chrome-browser/Default --profiling-flush=1 --enable-aggressive-domstorage-flushing --user-data-dir=/home/$username/chrome-browser/ --restore-last-session --disk-cache-size=2750000000 &
# google-chrome-stable --mute-audio --headless --remote-debugging-port=$port --window-size=1280,800 --profile-directory=/home/$username/chrome-browser/Default --profiling-flush=1 --enable-aggressive-domstorage-flushing --user-data-dir=/home/$username/chrome-browser/ --restore-last-session --disk-cache-size=2750000000 --enable-surface-synchronization --run-all-compositor-stages-before-draw --disable-threaded-animation --disable-threaded-scrolling --disable-checker-imaging &
# google-chrome-stable --mute-audio --no-gpu --disable-gpu --disable-software-rasterizer --headless --remote-debugging-port=$port --window-size=1280,800 --profile-directory=/home/$username/chrome-browser/Default --profiling-flush=1 --enable-aggressive-domstorage-flushing --user-data-dir=/home/$username/chrome-browser/ --restore-last-session --disk-cache-size=2750000000 &
# sudo cgexec -g memory,cpu:browsers sudo -u $username google-chrome-stable --mute-audio --no-gpu --disable-gpu --disable-software-rasterizer --headless --remote-debugging-port=$port --window-size=1280,800 --profile-directory=/home/$username/chrome-browser/Default --profiling-flush=1 --enable-aggressive-domstorage-flushing --user-data-dir=/home/$username/chrome-browser/ --restore-last-session --disk-cache-size=2750000000 &
# sudo cgexec -g memory,cpu:browsers sudo -u $username google-chrome-stable --mute-audio --no-gpu --disable-gpu --disable-software-rasterizer --headless --remote-debugging-port=$port --window-size=1280,800 --profile-directory=/home/$username/chrome-browser/Default --profiling-flush=1 --enable-aggressive-domstorage-flushing --user-data-dir=/home/$username/chrome-browser/ --restore-last-session &
# google-chrome-stable --no-gpu --disable-software-rasterizer --headless --remote-debugging-port=$1 --window-size=1280,800
# echo google-chrome-stable --no-gpu --disable-software-rasterizer --headless --remote-debugging-port=$1 --remote-debugging-address=0.0.0.0 --window-size=1280,800
# google-chrome-stable --no-gpu --disable-software-rasterizer --headless --remote-debugging-port=$1 --remote-debugging-address=0.0.0.0 --window-size=1280,800
# google-chrome-stable --no-gpu --disable-software-rasterizer --headless --mute-audio --remote-debugging-port=$1 --remote-debugging-address=0.0.0.0 --window-size=800,495
# google-chrome-stable --no-gpu --disable-software-rasterizer --headless --mute-audio --remote-debugging-port=$1 --remote-debugging-address=0.0.0.0 --window-size=1337,666
# google-chrome-stable --no-gpu --disable-software-rasterizer --headless --mute-audio --hide-scrollbars --remote-debugging-port=$1 --remote-debugging-address=0.0.0.0 --window-size=1337,666
# google-chrome-stable --no-gpu --disable-software-rasterizer --headless --mute-audio --hide-scrollbars --remote-debugging-port=$1 --remote-debugging-address=0.0.0.0 --window-size=640,480 --ignore-certificate-errors
